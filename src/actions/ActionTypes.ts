import { App } from 'obsidian';
import { Message } from '../component/Chat';
import ReactIris from '../main';

/**
 * 命令执行上下文
 */
export interface ActionContext {
  app: App;
  plugin: ReactIris;
  sessionId: string;
  messages: Message[];
  commandText: string; // 原始命令文本
  updateMessages: (messages: Message[]) => void; // 用于更新消息列表的回调
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>; // 更新会话标题的回调
}

/**
 * 命令执行结果
 */
export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * 命令定义接口
 */
export interface Action {
  name: string; // 命令名称
  description: string; // 命令描述
  prefix: string; // 命令前缀，如 @make-title
  helpText?: string; // 命令帮助文本
  
  // 执行命令
  execute: (context: ActionContext) => Promise<ActionResult>;
  
  // 检查命令是否可用（可选）
  isAvailable?: (context: Omit<ActionContext, 'commandText'>) => boolean;
}

/**
 * 命令在文本中的位置
 */
export interface CommandPosition {
  command: string; // 完整命令
  prefix: string; // 命令前缀
  startIndex: number; // 在文本中的起始位置
  endIndex: number; // 在文本中的结束位置
}
