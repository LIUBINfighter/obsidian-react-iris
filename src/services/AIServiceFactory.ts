import { AIService, AIServiceOptions } from './AIService';
import { OllamaService, OllamaOptions } from './OllamaService';
import { LangChainService, LangChainOptions } from './LangChainService';
import { MockAIService } from './MockAIService';

export type AIServiceType = 'ollama' | 'langchain' | 'mock';

export class AIServiceFactory {
  /**
   * 创建AI服务实例
   * @param type 服务类型
   * @param options 服务配置选项
   * @returns AI服务实例
   */
  static createService(type: AIServiceType, options: AIServiceOptions): AIService {
    switch (type) {
      case 'ollama':
        return new OllamaService(options as OllamaOptions);
      case 'langchain':
        return new LangChainService(options as LangChainOptions);
      case 'mock':
        return new MockAIService(options);
      default:
        throw new Error(`不支持的AI服务类型: ${type}`);
    }
  }
}
