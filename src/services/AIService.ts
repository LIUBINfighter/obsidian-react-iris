import { Message } from '../component/Chat';

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
  // 重载方法：接受对象格式请求
  sendRequest(options: AIRequestOptions): Promise<Message>;
  
  // 重载方法：接受字符串格式请求
  sendRequest(prompt: string): Promise<string>;
  
  // 发送请求并获取流式响应
  sendStreamingRequest(
    options: AIRequestOptions, 
    onUpdate: (response: AIResponseStream) => void
  ): Promise<void>;
  
  // 取消正在进行的请求
  cancelRequest(): void;
}
