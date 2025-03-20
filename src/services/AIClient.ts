import { AIService, AIResponseStream } from './AIService';
import { AIServiceFactory, AIServiceType } from './AIServiceFactory';
import { Message, ChatSession } from '../component/Chat';
import ReactIris from '../main';
import { App, Notice } from 'obsidian';
import { saveChatSessionToFile, saveChatSessionToFileWithDebounce } from '../utils/chatUtils';

/**
 * AI客户端 - 处理与AI服务相关的逻辑
 */
export class AIClient {
  private service: AIService | null = null;
  private plugin: ReactIris | null = null;
  private app: App;
  private sessionId: string;
  
  constructor(app: App, plugin: ReactIris | null, sessionId: string = 'default') {
    this.app = app;
    this.plugin = plugin;
    this.sessionId = sessionId;
    this.initService();
  }
  
  /**
   * 初始化AI服务
   */
  private initService(): void {
    if (this.plugin) {
      const aiConfig = this.plugin.getAIServiceConfig();
      try {
        this.service = AIServiceFactory.createService(
          aiConfig.type, 
          {
            baseUrl: aiConfig.baseUrl,
            modelName: aiConfig.modelName,
            systemPrompt: aiConfig.systemPrompt,
            temperature: aiConfig.temperature,
            maxTokens: aiConfig.maxTokens
          }
        );
        console.log(`AI服务初始化成功: ${aiConfig.type} - ${aiConfig.modelName}`);
      } catch (error) {
        console.error('AI服务初始化失败:', error);
        // 如果初始化失败，使用Mock服务作为后备
        this.service = AIServiceFactory.createService('mock', {
          baseUrl: '',
          modelName: 'mock'
        });
      }
    } else {
      // 如果没有插件实例，使用Mock服务
      this.service = AIServiceFactory.createService('mock', {
        baseUrl: '',
        modelName: 'mock'
      });
    }
  }
  
  /**
   * 更改AI服务类型
   * @param type 服务类型
   * @returns 是否成功
   */
  public changeServiceType(type: AIServiceType): boolean {
    if (!this.plugin) return false;
    
    try {
      const aiConfig = this.plugin.getAIServiceConfig();
      this.service = AIServiceFactory.createService(
        type,
        {
          baseUrl: aiConfig.baseUrl,
          modelName: aiConfig.modelName,
          systemPrompt: aiConfig.systemPrompt,
          temperature: aiConfig.temperature,
          maxTokens: aiConfig.maxTokens
        }
      );
      console.log(`AI服务已切换到: ${type}`);
      return true;
    } catch (error) {
      console.error('切换AI服务失败:', error);
      return false;
    }
  }
  
  /**
   * 生成消息ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  /**
   * 发送消息并处理响应
   */
  public async sendMessage(
    messages: Message[],
    onStreamUpdate: (content: string, isComplete: boolean) => void,
    onMessagesUpdate: (messages: Message[]) => void
  ): Promise<boolean> {
    if (!this.service) {
      new Notice('AI服务未初始化');
      return false;
    }
    
    // 创建临时AI响应消息
    const tempAiMessage: Message = {
      id: this.generateId(),
      content: '',
      timestamp: Date.now(),
      sender: 'assistant',
      favorite: false
    };
    
    // 更新消息列表，添加临时消息
    const messagesWithTemp = [...messages, tempAiMessage];
    onMessagesUpdate(messagesWithTemp);
    
    try {
      // 使用流式处理发送请求
      await this.service.sendStreamingRequest(
        {
          messages,
          systemPrompt: this.plugin?.getAIServiceConfig().systemPrompt,
        },
        (response: AIResponseStream) => {
          // 更新流内容
          onStreamUpdate(response.content, response.isComplete);
          
          // 使用函数式更新临时消息内容
          const updatedMessages = messagesWithTemp.map(msg => 
            msg.id === tempAiMessage.id 
              ? { ...msg, content: response.content }
              : msg
          );
          onMessagesUpdate(updatedMessages);
          
          // 使用防抖保存临时更新
          if (!response.isComplete) {
            const updatedSession: ChatSession = {
              id: this.sessionId,
              title: '聊天会话',
              messages: updatedMessages,
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            saveChatSessionToFileWithDebounce(this.app, this.sessionId, updatedSession);
          } else {
            // 响应完成，保存最终版本
            const finalSession: ChatSession = {
              id: this.sessionId,
              title: '聊天会话',
              messages: updatedMessages,
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            
            saveChatSessionToFile(this.app, this.sessionId, finalSession)
              .then(() => console.log('聊天记录已保存 (最终版本)'))
              .catch(err => console.error('保存聊天记录失败:', err));
          }
        }
      );
      
      return true;
    } catch (error) {
      console.error('发送消息失败:', error);
      return false;
    }
  }
  
  /**
   * 取消当前请求
   */
  public cancelRequest(): void {
    if (this.service) {
      this.service.cancelRequest();
    }
  }
  
  /**
   * 获取当前服务类型
   */
  public getServiceType(): AIServiceType {
    return this.plugin?.getAIServiceConfig().type || 'mock';
  }
}
