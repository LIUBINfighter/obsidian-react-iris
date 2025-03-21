import { AIService, AIServiceOptions, AIRequestOptions, AIResponseStream } from './AIService';
import { Message } from '../component/Chat';
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { RunnableSequence } from "@langchain/core/runnables";

export interface LangChainOptions extends AIServiceOptions {
  keepAlive?: boolean;
  numPredict?: number;
  numCtx?: number;
}

export class LangChainService implements AIService {
  private modelName: string;
  private baseUrl: string;
  private options: LangChainOptions;
  private controller: AbortController | null = null;
  private model: ChatOllama; // 添加模型属性
  private systemPrompt: string;
  
  constructor(options: LangChainOptions) {
    this.baseUrl = options.baseUrl || 'http://localhost:11434';
    this.modelName = options.modelName || 'deepseek-r1:latest';
    this.options = options;
    this.systemPrompt = options.systemPrompt || "你是一个有用的AI助手。";
    
    // 初始化模型
    this.model = this.createChatModel();
  }
  
  private createChatModel() {
    return new ChatOllama({
      baseUrl: this.baseUrl,
      model: this.modelName,
      temperature: this.options.temperature,
      ...(this.options.numPredict && { numPredict: this.options.numPredict }),
      ...(this.options.numCtx && { numCtx: this.options.numCtx })
    });
  }
  
  private convertMessages(messages: Message[], systemPrompt?: string): BaseMessage[] {
    const result: BaseMessage[] = [];
    
    // 添加系统提示
    if (systemPrompt) {
      result.push(new SystemMessage(systemPrompt));
    }
    
    // 转换消息历史
    messages.forEach(msg => {
      if (msg.sender === 'user') {
        result.push(new HumanMessage(msg.content));
      } else {
        result.push(new AIMessage(msg.content));
      }
    });
    
    return result;
  }
  
  // 重载 sendRequest 方法以接受字符串
  async sendRequest(promptOrOptions: string | AIRequestOptions): Promise<Message | string> {
    // 处理字符串类型的请求
    if (typeof promptOrOptions === 'string') {
      this.controller = new AbortController();
      
      try {
        console.log("LangChain 发送字符串请求:", promptOrOptions.substring(0, 100) + "...");
        
        // 直接使用模型处理字符串请求
        const messages = [
          new SystemMessage(this.systemPrompt),
          new HumanMessage(promptOrOptions)
        ];
        
        const response = await this.model.invoke(messages, {
          signal: this.controller.signal
        });
        
        return response.content;
      } catch (error) {
        console.error("LangChain 字符串请求错误:", error);
        throw new Error(`AI请求失败: ${error.message}`);
      } finally {
        this.controller = null;
      }
    }
    
    // 处理 AIRequestOptions 类型的请求
    const options = promptOrOptions as AIRequestOptions;
    const { messages, systemPrompt } = options;
    
    this.controller = new AbortController();
    
    try {
      const chatModel = this.createChatModel();
      const llmChain = RunnableSequence.from([
        chatModel,
        new StringOutputParser()
      ]);
      
      const langchainMessages = this.convertMessages(messages, systemPrompt);
      
      // 去掉历史记录中的最后一条消息（通常是用户消息）
      // 因为这条消息会作为输入传递给模型
      const history = langchainMessages.slice(0, -1);
      const userInput = langchainMessages[langchainMessages.length - 1];
      
      const response = await llmChain.invoke({
        messages: history.length > 0 ? history : undefined, 
        message: userInput
      }, {
        signal: this.controller.signal
      });
      
      return {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        content: response,
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
    const { messages, systemPrompt } = options;
    
    this.controller = new AbortController();
    let isCompleteEmitted = false;
    
    try {
      const langchainMessages = this.convertMessages(messages, systemPrompt);
      console.log('开始流式请求，消息数量:', langchainMessages.length);
      
      // 直接使用Ollama API
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: langchainMessages.map(msg => {
            if (msg instanceof SystemMessage) {
              return { role: 'system', content: msg.content };
            } else if (msg instanceof HumanMessage) {
              return { role: 'user', content: msg.content };
            } else if (msg instanceof AIMessage) {
              return { role: 'assistant', content: msg.content };
            }
            return null; // 添加防止未处理的消息类型
          }).filter(Boolean), // 过滤掉可能的null值
          stream: true,
          temperature: this.options.temperature || 0.7
        }),
        signal: this.controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }
      
      // 修复：添加缺少的TextDecoder定义
      const decoder = new TextDecoder();
      let content = '';
      
      const emitComplete = () => {
        if (!isCompleteEmitted) {
          console.log('发送完成信号, 内容长度:', content.length);
          onUpdate({ content, isComplete: true });
          isCompleteEmitted = true;
        }
      };
      
      // 使用更简单的循环结构，避免嵌套过深
      let isDone = false;
      while (!isDone) {
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
              content += data.message.content;
              onUpdate({ content, isComplete: false });
            }
            
            if (data.done === true) {
              isDone = true;
              emitComplete();
            }
          } catch (err) {
            // 修复：添加错误类型，避免使用隐式any
            console.warn('无法解析响应行:', line, err instanceof Error ? err.message : String(err));
          }
        }
      }
    } catch (error) {
      // 修复：使用明确的错误类型
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('流式处理错误:', errorMessage);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('请求已取消');
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
