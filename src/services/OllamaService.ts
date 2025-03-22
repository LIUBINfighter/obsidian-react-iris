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
  images?: string[]; // 添加图片数组支持
  [key: string]: any; // 允许额外的请求选项
}

export interface AIResponseStream {
  content: string;
  isComplete: boolean;
  responseTime: number;
  tokenCount: number;
}

export interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
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

// 添加generateCompletionOptions接口
export interface GenerateCompletionOptions {
  prompt: string;
  model: string;
  format?: string | object;
  options?: {
    temperature?: number;
    seed?: number;
    num_predict?: number;
    top_k?: number;
    top_p?: number;
    min_p?: number;
    typical_p?: number;
    repeat_last_n?: number;
    repeat_penalty?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    mirostat?: number;
    mirostat_tau?: number;
    mirostat_eta?: number;
    penalize_newline?: boolean;
    stop?: string[];
    [key: string]: any;
  };
  system?: string;
  template?: string;
  context?: number[];
  stream?: boolean;
  raw?: boolean;
  keep_alive?: string;
  images?: string[];
  suffix?: string;
}

// 添加生成结果接口
export interface GenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  done_reason?: string;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

// 添加运行中模型接口
export interface RunningModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  expires_at: string;
  size_vram: number;
}

// 添加嵌入向量接口
export interface EmbeddingResponse {
  model: string;
  embeddings: number[][];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
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
  
  private formatMessages(messages: Message[], systemPrompt?: string, images?: string[]): any[] {
    const formattedMessages = [];
    
    // 添加系统提示
    if (systemPrompt) {
      formattedMessages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    // 添加对话消息
    messages.forEach((msg, index) => {
      // 检查是否是最后一条用户消息且有图片
      if (msg.sender === 'user' && index === messages.length - 1 && images && images.length > 0) {
        // 构建多模态内容数组
        const contentArray: MessageContent[] = [
          {
            type: 'text',
            text: msg.content
          }
        ];
        
        // 添加所有图片
        images.forEach(imageBase64 => {
          contentArray.push({
            type: 'image_url',
            image_url: {
              url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
            }
          });
        });
        
        formattedMessages.push({
          role: 'user',
          content: contentArray
        });
      } else {
        // 标准文本消息
        formattedMessages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    });
    
    return formattedMessages;
  }
  
  async sendRequest(options: AIRequestOptions): Promise<Message> {
    const { messages, systemPrompt, temperature = 0.7, maxTokens, images } = options;
    
    this.controller = new AbortController();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: this.formatMessages(messages, systemPrompt, images),
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
    const { messages, systemPrompt, temperature = 0.7, maxTokens, images } = options;
    
    this.controller = new AbortController();
    let isCompleteEmitted = false;
    const startTime = Date.now(); // 添加开始时间
    
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: this.formatMessages(messages, systemPrompt, images),
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
      let buffer = ''; // 添加缓冲区处理可能被分割的JSON
      
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
        buffer += chunk;
        
        // 寻找完整的JSON对象
        const processBuffer = () => {
          let jsonStartIndex = buffer.indexOf('{');
          if (jsonStartIndex === -1) {
            buffer = ''; // 没有JSON对象的开始标记，清空缓冲区
            return;
          }
          
          let bracketCount = 0;
          let jsonEndIndex = -1;
          
          // 寻找匹配的JSON对象结束位置
          for (let i = jsonStartIndex; i < buffer.length; i++) {
            if (buffer[i] === '{') bracketCount++;
            else if (buffer[i] === '}') bracketCount--;
            
            if (bracketCount === 0) {
              jsonEndIndex = i + 1;
              break;
            }
          }
          
          if (jsonEndIndex === -1) {
            return; // JSON对象不完整，等待更多数据
          }
          
          const jsonStr = buffer.substring(jsonStartIndex, jsonEndIndex);
          buffer = buffer.substring(jsonEndIndex); // 更新缓冲区，移除已处理的JSON
          
          try {
            const data = JSON.parse(jsonStr);
            
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
            console.warn('无法解析JSON响应:', jsonStr, e);
          }
          
          // 递归处理剩余缓冲区中可能的下一个JSON对象
          if (buffer.includes('{')) {
            processBuffer();
          }
        };
        
        processBuffer();
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('流式请求已取消');
      } else {
        console.error('Ollama流式请求错误:', error);
      }
      
      // 确保在错误时也发送完成信号
      if (!isCompleteEmitted) {
        onUpdate({ 
          content: '',
          isComplete: true,
          responseTime: Date.now() - startTime,
          tokenCount: 0
        });
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

  /**
   * 检查模型是否支持图像输入
   * @param modelName 模型名称
   */
  isVisionModel(modelName: string = this.modelName): boolean {
    const visionModels = ['llama3.2-vision', 'llava', 'bakllava', 'moondream', 'phi3-vision'];
    return visionModels.some(model => modelName.toLowerCase().includes(model.toLowerCase()));
  }
  
  /**
   * 将图片转换为Base64格式
   * @param imageFile 图片文件
   */
  async imageToBase64(imageFile: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  /**
   * 使用generate API生成文本补全
   * @param options 生成参数
   */
  async generateCompletion(options: GenerateCompletionOptions): Promise<GenerateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...options,
          model: options.model || this.modelName
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API请求失败: ${response.status} ${response.statusText}`);
      }
      
      return await response.json() as GenerateResponse;
    } catch (err) {
      console.error('Generate completion error:', err);
      throw err;
    }
  }
  
  /**
   * 使用generate API进行流式文本生成
   * @param options 生成参数
   * @param onUpdate 每次收到更新时的回调
   */
  async generateCompletionStream(
    options: GenerateCompletionOptions, 
    onUpdate: (response: Partial<GenerateResponse>) => void
  ): Promise<void> {
    this.controller = new AbortController();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...options,
          model: options.model || this.modelName,
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
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // 寻找完整的JSON对象
        const processBuffer = () => {
          let jsonStartIndex = buffer.indexOf('{');
          if (jsonStartIndex === -1) {
            buffer = ''; // 没有JSON对象的开始标记，清空缓冲区
            return;
          }
          
          let bracketCount = 0;
          let jsonEndIndex = -1;
          
          // 寻找匹配的JSON对象结束位置
          for (let i = jsonStartIndex; i < buffer.length; i++) {
            if (buffer[i] === '{') bracketCount++;
            else if (buffer[i] === '}') bracketCount--;
            
            if (bracketCount === 0) {
              jsonEndIndex = i + 1;
              break;
            }
          }
          
          if (jsonEndIndex === -1) {
            return; // JSON对象不完整，等待更多数据
          }
          
          const jsonStr = buffer.substring(jsonStartIndex, jsonEndIndex);
          buffer = buffer.substring(jsonEndIndex); // 更新缓冲区，移除已处理的JSON
          
          try {
            const data = JSON.parse(jsonStr) as Partial<GenerateResponse>;
            onUpdate(data);
          } catch (e) {
            console.warn('无法解析JSON响应:', jsonStr, e);
          }
          
          // 递归处理剩余缓冲区中可能的下一个JSON对象
          if (buffer.includes('{')) {
            processBuffer();
          }
        };
        
        processBuffer();
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('流式请求已取消');
      } else {
        console.error('Ollama流式请求错误:', error);
      }
      throw error;
    } finally {
      this.controller = null;
    }
  }
  
  /**
   * 获取运行中的模型列表
   */
  async listRunningModels(): Promise<RunningModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ps`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`获取运行中模型失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.models || [];
    } catch (err) {
      console.error('Error listing running models:', err);
      throw err;
    }
  }
  
  /**
   * 生成嵌入向量
   * @param input 文本或文本数组
   * @param model 模型名称
   */
  async generateEmbeddings(input: string | string[], model?: string): Promise<EmbeddingResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || this.modelName,
          input
        })
      });
      
      if (!response.ok) {
        throw new Error(`生成嵌入向量失败: ${response.status} ${response.statusText}`);
      }
      
      return await response.json() as EmbeddingResponse;
    } catch (err) {
      console.error('Generate embeddings error:', err);
      throw err;
    }
  }
  
  /**
   * 显示模型详细信息
   * @param modelName 模型名称
   */
  async showModelInfo(modelName: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/show`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          verbose: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`获取模型信息失败: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error(`Error showing model info for ${modelName}:`, err);
      throw err;
    }
  }
  
  /**
   * 复制模型
   * @param sourceModel 源模型名
   * @param destinationModel 目标模型名
   */
  async copyModel(sourceModel: string, destinationModel: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: sourceModel,
          destination: destinationModel
        })
      });
      
      if (!response.ok) {
        throw new Error(`复制模型失败: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error(`Error copying model from ${sourceModel} to ${destinationModel}:`, err);
      throw err;
    }
  }
  
  /**
   * 获取Ollama版本信息
   */
  async getVersion(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`获取版本信息失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.version;
    } catch (err) {
      console.error('Error getting version:', err);
      throw err;
    }
  }
}
