import { Message } from '../component/Chat';
import { estimateTokenCount } from '../utils/tokenUtils';

export interface AIServiceOptions {
  baseUrl: string;
  modelName: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any; // 允许额外的配置选项
}

export interface AIRequestOptions {
  messages: Message[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any; // 允许额外的请求选项
}

export interface AIResponseStream {
  content: string;
  isComplete: boolean;
}

/**
 * AI服务接口 - 定义所有AI服务应该实现的方法
 */
export interface AIService {
  // 发送请求并获取完整响应
  sendRequest(options: AIRequestOptions): Promise<Message>;
  
  // 发送请求并获取流式响应
  sendStreamingRequest(
    options: AIRequestOptions, 
    onUpdate: (response: AIResponseStream) => void
  ): Promise<void>;
  
  // 取消正在进行的请求
  cancelRequest(): void;
}
import { Message } from '../component/Chat';

export interface LMStudioOptions extends AIServiceOptions {
  maxTokens?: number;
  temperature?: number;
}

export interface LMStudioModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface LMStudioModelsResponse {
  object: string;
  data: LMStudioModel[];
}

export interface StreamResponse {
  content: string;
  isComplete: boolean;
  responseTime?: number;
  tokenCount?: number;
}

export class LMStudioService implements AIService {
  // 修改为公开访问
  readonly baseUrl: string; 
  private modelName: string;
  private controller: AbortController | null = null;
  private options: LMStudioOptions;
  
  constructor(options: LMStudioOptions) {
    this.baseUrl = options.baseUrl || 'http://127.0.0.1:1234';
    this.modelName = options.modelName || '';
    this.options = options;
  }
  
  /**
   * 测试与LM Studio服务的连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (err) {
      console.error('Failed to connect to LM Studio:', err);
      return false;
    }
  }

  /**
   * 获取所有可用的模型列表
   */
  async listModels(): Promise<LMStudioModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.statusText}`);
      }
      
      const data = await response.json() as LMStudioModelsResponse;
      return data.data || [];
    } catch (err) {
      console.error('Error listing models:', err);
      throw err;
    }
  }
  
  private formatMessages(messages: Message[], systemPrompt?: string): any[] {
    const formattedMessages = [];
    
    // 添加系统提示
    if (systemPrompt) {
      formattedMessages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    // 添加对话消息
    messages.forEach(msg => {
      // 处理特殊消息类型
      if (msg.isContext) {
        // 上下文消息作为系统消息添加
        formattedMessages.push({
          role: 'system',
          content: msg.content
        });
      } 
      // 处理包含图像的消息 - 按照LM Studio官方文档格式处理
      else if (msg.imageData) {
        formattedMessages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: [
            { type: "text", text: msg.content || "请描述这张图片" },
            { 
              type: "image_url", 
              image_url: { 
                url: msg.imageData.startsWith('data:') ? msg.imageData : `data:image/png;base64,${msg.imageData}` 
              } 
            }
          ]
        });
      }
      // 普通文本消息
      else {
        formattedMessages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    });
    
    return formattedMessages;
  }
  
  async sendRequest(options: AIRequestOptions): Promise<Message> {
    const { messages, systemPrompt, temperature = 0.7, maxTokens } = options;
    
    this.controller = new AbortController();
    
    try {
      // 端点修改：从 /completion 改为 /completions (注意复数形式)
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: this.formatMessages(messages, systemPrompt),
          temperature,
          max_tokens: maxTokens || -1,
          stream: false
        }),
        signal: this.controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`LM Studio API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const responseContent = data.choices[0].message.content;
      
      // 创建消息对象
      return {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        content: responseContent,
        timestamp: Date.now(),
        sender: 'assistant',
        favorite: false,
        tokencount: data.usage?.completion_tokens || 0,
        responsetime: 0 // LM Studio API不提供响应时间
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('请求已取消');
        throw new Error('请求已取消');
      }
      throw error;
    } finally {
      this.controller = null;
    }
  }
  
  /**
   * 处理流式响应数据
   */
  private async handleStreamResponse(
    response: Response,
    startTime: number,
    onUpdate: (response: StreamResponse) => void
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }
    
    const decoder = new TextDecoder();
    let content = '';
    let isCompleteEmitted = false;
    
    const emitComplete = () => {
      if (!isCompleteEmitted) {
        onUpdate({
          content,
          isComplete: true,
          responseTime: Date.now() - startTime,
          tokenCount: Math.ceil(content.length / 4) // 简单的token估算
        });
        isCompleteEmitted = true;
      }
    };
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          emitComplete();
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            
            if (dataStr === "[DONE]") {
              emitComplete();
              continue;
            }
            
            try {
              const data = JSON.parse(dataStr);
              if (data.choices?.[0]?.delta?.content) {
                content += data.choices[0].delta.content;
                onUpdate({ content, isComplete: false });
              }
            } catch (e) {
              console.warn('无法解析JSON响应:', line);
            }
          }
        }
      }
    } catch (error) {
      if (!isCompleteEmitted) {
        onUpdate({ content: '', isComplete: true });
      }
      throw error;
    }
  }

  /**
   * 发送图片识别请求
   */
  async sendImageRequest(
    imageBase64: string,
    prompt: string,
    temperature: number = 0.7,
    onUpdate: (response: StreamResponse) => void
  ): Promise<void> {
    if (!imageBase64) {
      throw new Error('未提供图片数据');
    }
    
    const startTime = Date.now();
    this.controller = new AbortController();
    
    try {
      const messages = [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }
      ];
      
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "llava-v1.5-7b", // 使用固定的图像模型
          messages,
          temperature,
          max_tokens: -1,
          stream: true
        }),
        signal: this.controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`图像识别请求失败: ${response.status} ${response.statusText}`);
      }
      
      await this.handleStreamResponse(response, startTime, onUpdate);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('图像识别请求已取消');
      }
      throw error;
    } finally {
      this.controller = null;
    }
  }

  // 修改现有的 sendStreamingRequest 方法
  async sendStreamingRequest(
    options: AIRequestOptions,
    onUpdate: (response: StreamResponse) => void
  ): Promise<void> {
    const { messages, systemPrompt, temperature = 0.7, maxTokens } = options;
    const startTime = Date.now();
    this.controller = new AbortController();
    
    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: this.formatMessages(messages, systemPrompt),
          temperature,
          max_tokens: maxTokens || -1,
          stream: true
        }),
        signal: this.controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`LM Studio API请求失败: ${response.status} ${response.statusText}`);
      }
      
      await this.handleStreamResponse(response, startTime, onUpdate);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('流式请求已取消');
      }
      throw error;
    } finally {
      this.controller = null;
    }
  }
}
