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
  
  constructor(options: LangChainOptions) {
    this.baseUrl = options.baseUrl || 'http://localhost:11434';
    this.modelName = options.modelName || 'deepseek-r1:latest';
    this.options = options;
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
  
  async sendRequest(options: AIRequestOptions): Promise<Message> {
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
    
    try {
      const chatModel = this.createChatModel();
      chatModel.streaming = true;
      
      const langchainMessages = this.convertMessages(messages, systemPrompt);
      
      // 使用变量捕获，确保回调使用最新值
      let accumulatedContent = '';
      
      console.log('开始流式请求，消息数量:', langchainMessages.length);
      console.log('模型:', this.modelName, '基础URL:', this.baseUrl);
      
      // 直接使用Ollama API，而不是LangChain
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
          }),
          stream: true,
          temperature: this.options.temperature || 0.7
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
      let done = false;
      
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (done) {
          // 流结束时发送完成消息
          onUpdate({ content: accumulatedContent, isComplete: true });
          console.log('流式响应完成，总长度:', accumulatedContent.length);
          break;
        }
        
        // 解码接收到的数据块
        const chunk = decoder.decode(value, { stream: true });
        console.log('收到数据块:', chunk.length);
        
        try {
          // Ollama 流式响应格式是每行一个JSON
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.message?.content) {
                accumulatedContent += data.message.content;
                onUpdate({ content: accumulatedContent, isComplete: false });
                console.log('内容更新,当前长度:', accumulatedContent.length);
              }
            } catch (err) {
              console.warn('解析响应行失败:', line, err);
            }
          }
        } catch (err) {
          console.error('处理响应块错误:', err);
        }
      }
    } catch (error) {
      console.error('流式请求错误:', error);
      if (error.name === 'AbortError') {
        console.log('流式请求已取消');
        onUpdate({ content: '', isComplete: true });
      } else {
        // 抛出错误，让上层处理
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
