import { AIService, AIServiceOptions, AIRequestOptions, AIResponseStream } from './AIService';
import { Message } from '../component/Chat';

export class MockAIService implements AIService {
  private options: AIServiceOptions;
  private isCancelled: boolean = false;
  
  constructor(options: AIServiceOptions) {
    this.options = options;
  }
  
  async sendRequest(options: AIRequestOptions): Promise<Message> {
    const { messages } = options;
    const lastMessage = messages[messages.length - 1];
    
    // 添加模拟的延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (this.isCancelled) {
      this.isCancelled = false;
      throw new Error('请求已取消');
    }
    
    return {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      content: `这是来自模拟AI服务的回复，您发送的消息是: "${lastMessage.content}"`,
      timestamp: Date.now(),
      sender: 'assistant',
      favorite: false
    };
  }
  
  async sendStreamingRequest(
    options: AIRequestOptions,
    onUpdate: (response: AIResponseStream) => void
  ): Promise<void> {
    const { messages } = options;
    const lastMessage = messages[messages.length - 1];
    
    const mockResponse = `这是来自模拟AI服务的流式回复，您发送的消息是: "${lastMessage.content}"`;
    let content = '';
    
    // 模拟流式输出
    for (let i = 0; i < mockResponse.length; i++) {
      if (this.isCancelled) {
        this.isCancelled = false;
        onUpdate({ content, isComplete: true });
        return;
      }
      
      // 每次添加一个字符
      content += mockResponse[i];
      onUpdate({ content, isComplete: false });
      
      // 添加随机延迟
      await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 80));
    }
    
    onUpdate({ content, isComplete: true });
  }
  
  cancelRequest(): void {
    this.isCancelled = true;
    console.log('模拟请求已取消');
  }
}
