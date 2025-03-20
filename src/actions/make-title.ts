import { Action, ActionContext, ActionResult } from './ActionTypes';
import { ChatSession, Message } from '../component/Chat';
import { saveChatSessionToFile } from '../utils/chatUtils';
import { Notice } from 'obsidian';

/**
 * 生成标题命令
 */
export class MakeTitleAction implements Action {
  name = '生成对话标题';
  description = '使用AI为当前对话生成一个合适的标题';
  prefix = '@make-title';
  helpText = '输入 @make-title 来为对话生成标题';
  
  /**
   * 执行生成标题命令
   */
  async execute(context: ActionContext): Promise<ActionResult> {
    try {
      const { app, plugin, sessionId, messages, updateMessages, updateSessionTitle } = context;
      
      // 创建系统提示和请求内容
      const systemPrompt = "你是一个助手，负责为对话生成简短、准确且有描述性的标题。";
      const requestContent = `
        请为以下对话生成一个简短的标题（不超过20个字符）。
        标题应该概括对话的主要内容或目的。
        请用JSON格式回复，格式为: {"title": "生成的标题"}
        
        对话内容:
        ${messages.map(msg => `[${msg.sender === 'user' ? '用户' : 'AI'}]: ${msg.content}`).join('\n')}
      `;
      
      // 显示执行中消息 - 使用 system 角色
      const loadingMessage: Message = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        content: "🔄 正在为对话生成标题...",
        timestamp: Date.now(),
        sender: 'system', // 改为 system
        favorite: false
      };
      
      // 添加加载消息
      const updatedMessages = [...messages, loadingMessage];
      updateMessages(updatedMessages);
      
      // 记录开始时间，用于计算响应时间
      const startTime = Date.now();
      
      // 使用插件的AI服务发送请求
      const aiConfig = plugin.getAIServiceConfig();
      const aiService = aiConfig.type;
      
      // 定义请求选项
      const requestOptions = {
        messages: [
          {
            id: 'system',
            content: systemPrompt,
            timestamp: Date.now(),
            sender: 'assistant',
            favorite: false
          },
          {
            id: 'user-request',
            content: requestContent,
            timestamp: Date.now(),
            sender: 'user',
            favorite: false
          }
        ],
        systemPrompt
      };
      
      // 创建AI客户端并发送请求
      let aiResponse: string;
      try {
        // 这里我们使用现有的导入和模块结构，实际中可能需要调整
        const { AIServiceFactory } = await import('../services/AIServiceFactory');
        const aiService = AIServiceFactory.createService(
          aiConfig.type,
          {
            baseUrl: aiConfig.baseUrl,
            modelName: aiConfig.modelName,
            systemPrompt,
            temperature: 0.3, // 较低的温度以获得更确定性的结果
            maxTokens: 100 // 标题很短，不需要太多token
          }
        );
        
        // 发送请求
        const response = await aiService.sendRequest(requestOptions);
        aiResponse = response.content;
      } catch (error) {
        console.error('AI请求失败:', error);
        throw new Error('生成标题时出错: ' + error.message);
      }
      
      // 计算响应时间
      const responseTime = Date.now() - startTime;
      
      // 解析JSON响应
      let title: string;
      try {
        // 尝试提取JSON部分，处理可能的前后缀
        const jsonMatch = aiResponse.match(/\{.*\}/s);
        if (!jsonMatch) {
          throw new Error('无法从响应中提取JSON');
        }
        
        const jsonResponse = JSON.parse(jsonMatch[0]);
        title = jsonResponse.title?.trim();
        
        if (!title) {
          throw new Error('响应中没有有效的标题');
        }
      } catch (error) {
        console.error('解析AI响应失败:', error, aiResponse);
        throw new Error('无法解析AI生成的标题');
      }
      
      // 更新会话标题
      await updateSessionTitle(sessionId, title);
      
      // 更新加载消息为成功消息 - 使用 system 角色
      const successMessage: Message = {
        id: loadingMessage.id,
        content: `✅ 对话已命名为: "${title}" (${responseTime}ms)`,
        timestamp: Date.now(),
        sender: 'system', // 改为 system
        favorite: false,
        responsetime: responseTime
      };
      
      // 更新消息列表
      const finalMessages = updatedMessages.map(msg => 
        msg.id === loadingMessage.id ? successMessage : msg
      );
      updateMessages(finalMessages);
      
      return {
        success: true,
        message: `对话已命名为: ${title}`,
        data: { title }
      };
      
    } catch (error) {
      console.error('执行make-title命令时出错:', error);
      
      // 如果已经添加了加载消息，将其替换为错误消息
      const existingLoadingMsg = context.messages.find(msg => 
        msg.sender === 'system' && msg.content.includes('正在为对话生成标题')
      ); // 更新 sender 检查
      
      if (existingLoadingMsg) {
        const errorMessages = context.messages.map(msg => 
          msg.id === existingLoadingMsg.id 
            ? {
                ...msg,
                content: `❌ 生成标题失败: ${error.message || '未知错误'}`
              }
            : msg
        );
        context.updateMessages(errorMessages);
      } else {
        // 添加错误消息 - 使用 system 角色
        const errorMessage: Message = {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          content: `❌ 生成标题失败: ${error.message || '未知错误'}`,
          timestamp: Date.now(),
          sender: 'system', // 改为 system
          favorite: false
        };
        
        context.updateMessages([...context.messages, errorMessage]);
      }
      
      return {
        success: false,
        message: `生成标题失败: ${error.message || '未知错误'}`
      };
    }
  }
  
  /**
   * 检查命令是否可用
   */
  isAvailable(context: Omit<ActionContext, 'commandText'>): boolean {
    // 至少有几条消息才能生成标题
    return context.messages.length >= 3;
  }
}

// 创建实例并导出
export const makeTitleAction = new MakeTitleAction();
