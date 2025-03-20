import { AIService, AIServiceOptions, AIRequestOptions, AIResponseStream } from './AIService';
import { Message } from '../component/Chat';

export interface OllamaOptions extends AIServiceOptions {
  keepAlive?: string;
  numPredict?: number;
  numCtx?: number;
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
      
      return {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        content: data.message.content,
        timestamp: Date.now(),
        sender: 'assistant',
        favorite: false
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
      let isComplete = false;
      
      while (!isComplete) {
        const { done, value } = await reader.read();
        
        if (done) {
          isComplete = true;
          onUpdate({ content, isComplete });
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        try {
          // Ollama返回的是多个JSON对象，每行一个
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              
              if (data.message?.content) {
                content += data.message.content;
                onUpdate({ content, isComplete: false });
              }
              
              if (data.done) {
                isComplete = true;
              }
            } catch (e) {
              console.warn('无法解析JSON响应:', line);
            }
          }
        } catch (e) {
          console.error('处理响应块时出错:', e);
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('流式请求已取消');
        onUpdate({ content, isComplete: true });
      } else {
        throw error;
      }
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
