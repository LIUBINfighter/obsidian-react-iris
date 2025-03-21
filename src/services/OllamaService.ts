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
  responseTime: number;
  tokenCount: number;
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

export interface OllamaOptions extends AIServiceOptions {
  keepAlive?: string;
  numPredict?: number;
  numCtx?: number;
}

export interface OllamaModel {
  name: string;
  tag: string;
  size: number;
  modified_at: string;
  digest: string;
}

export interface OllamaResponse {
  models: OllamaModel[];
}

export interface PullProgressResponse {
  status: string;
  completed: number;
  total: number;
}

export class OllamaService implements AIService {
  private baseUrl: string;
  private modelName: string;
  private controller: AbortController | null = null;
  private options: OllamaOptions;
  
  constructor(options: OllamaOptions) {
    this.baseUrl = options.baseUrl || 'http://localhost:11434';
    this.modelName = options.modelName || 'deepseek-r1:latest';
    this.options = options;
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
      formattedMessages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });
    
    return formattedMessages;
  }
  
  async sendRequest(options: AIRequestOptions): Promise<Message> {
    const { messages, systemPrompt, temperature = 0.7, maxTokens } = options;
    
    this.controller = new AbortController();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: this.formatMessages(messages, systemPrompt),
          temperature,
          ...(maxTokens && { num_predict: maxTokens }),
          ...(this.options.numCtx && { num_ctx: this.options.numCtx }),
          stream: false
        }),
        signal: this.controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const responseContent = data.message.content;
      
      // 计算token数量
      const tokenCount = estimateTokenCount(responseContent);
      
      return {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        content: responseContent,
        timestamp: Date.now(),
        sender: 'assistant',
        favorite: false,
        tokencount: tokenCount,
        responsetime: data.total_duration || 0 // Ollama API可能提供总耗时
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
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: this.formatMessages(messages, systemPrompt),
          temperature,
          ...(maxTokens && { num_predict: maxTokens }),
          ...(this.options.numCtx && { num_ctx: this.options.numCtx }),
          stream: true
        }),
        signal: this.controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }
      
      const decoder = new TextDecoder();
      let content = '';
      
      const emitComplete = () => {
        if (!isCompleteEmitted) {
          onUpdate({ 
        content,
        isComplete: true,
        responseTime: Date.now() - startTime,
        tokenCount: estimateTokenCount(content)
      });
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
          try {
            const data = JSON.parse(line);
            
            if (data.message?.content) {
              const responseTime = Date.now() - startTime;
              const tokenCount = estimateTokenCount(content + data.message.content);
              content += data.message.content;
              onUpdate({ 
                content,
                isComplete: false,
                responseTime,
                tokenCount 
              });
            }
            
            if (data.done === true) {
              emitComplete();
            }
          } catch (e) {
            console.warn('无法解析JSON响应:', line);
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('流式请求已取消');
      } else {
        console.error('Ollama流式请求错误:', error);
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

  /**
   * 测试与Ollama的连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (err) {
      console.error('Failed to connect to Ollama:', err);
      return false;
    }
  }

  /**
   * 获取所有可用的模型列表
   */
  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.statusText}`);
      }
      
      const data = await response.json() as OllamaResponse;
      return data.models || [];
    } catch (err) {
      console.error('Error listing models:', err);
      throw err;
    }
  }

  /**
   * 拉取/下载指定的模型
   * @param modelName 模型名称
   * @param onProgress 进度回调函数
   */
  async pullModel(modelName: string, onProgress: (progress: PullProgressResponse) => void): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName }),
      });

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        lines.forEach(line => {
          try {
            const data = JSON.parse(line) as PullProgressResponse;
            onProgress(data);
          } catch (e) {
            console.error('无法解析JSON响应', e);
          }
        });
      }
    } catch (err) {
      console.error(`Error pulling model ${modelName}:`, err);
      throw err;
    }
  }

  /**
   * 删除指定的模型
   * @param modelName 模型名称
   */
  async deleteModel(modelName: string): Promise<void> {
    try {
      // 去除可能存在的":undefined"后缀
      const cleanModelName = modelName.replace(/:undefined$/, '');
      
      const response = await fetch(`${this.baseUrl}/api/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: cleanModelName }),
      });

      if (!response.ok) {
        throw new Error(`删除模型失败: ${response.statusText}`);
      }
    } catch (err) {
      console.error(`删除模型 ${modelName} 出错:`, err);
      throw err;
    }
  }
}
