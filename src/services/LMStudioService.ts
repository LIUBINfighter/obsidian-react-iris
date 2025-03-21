import { AIService, AIServiceOptions, AIRequestOptions, AIResponseStream } from './AIService';
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
  
  async sendStreamingRequest(
    options: AIRequestOptions,
    onUpdate: (response: AIResponseStream) => void
  ): Promise<void> {
    const { messages, systemPrompt, temperature = 0.7, maxTokens } = options;
    
    this.controller = new AbortController();
    let isCompleteEmitted = false;
    
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
          stream: true
        }),
        signal: this.controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`LM Studio API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }
      
      const decoder = new TextDecoder();
      let content = '';
      
      const emitComplete = () => {
        if (!isCompleteEmitted) {
          onUpdate({ content, isComplete: true });
          isCompleteEmitted = true;
        }
      };
      
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
            const dataStr = line.slice(6); // 去掉 "data: " 前缀
            
            if (dataStr === "[DONE]") {
              emitComplete();
              continue;
            }
            
            try {
              const data = JSON.parse(dataStr);
              if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
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
      if (error.name === 'AbortError') {
        console.log('流式请求已取消');
      } else {
        console.error('LM Studio流式请求错误:', error);
      }
      
      // 确保在错误时也发送完成信号
      if (!isCompleteEmitted) {
        onUpdate({ content: '', isComplete: true });
      }
      
      throw error;
    } finally {
      this.controller = null;
    }
  }
  
  cancelRequest(): void {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
      console.log('请求已取消');
    }
  }
}
