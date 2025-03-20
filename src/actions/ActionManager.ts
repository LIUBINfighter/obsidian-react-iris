import { Action, CommandPosition } from './ActionTypes';

/**
 * 命令管理器 - 负责注册和执行命令
 */
export class ActionManager {
  private actions: Map<string, Action> = new Map();
  
  constructor() {
    // 自动加载内置命令
    this.loadBuiltinActions();
  }
  
  /**
   * 加载内置命令
   */
  private loadBuiltinActions() {
    // 稍后会实现并注册具体命令
    // 例如 this.registerAction(new MakeTitleAction());
  }
  
  /**
   * 注册一个命令
   */
  public registerAction(action: Action): void {
    this.actions.set(action.prefix, action);
    console.log(`已注册命令: ${action.prefix} - ${action.name}`);
  }
  
  /**
   * 获取所有已注册的命令
   */
  public getAllActions(): Action[] {
    return Array.from(this.actions.values());
  }
  
  /**
   * 获取特定的命令
   */
  public getAction(prefix: string): Action | undefined {
    return this.actions.get(prefix);
  }
  
  /**
   * 解析文本中的命令
   */
  public parseCommands(text: string): CommandPosition[] {
    const commands: CommandPosition[] = [];
    const registeredPrefixes = Array.from(this.actions.keys());
    
    // 简单解析：查找以@开头的单词
    const commandRegex = /@[\w-]+/g;
    let match;
    
    while ((match = commandRegex.exec(text)) !== null) {
      const fullCommand = match[0]; // 包含@的完整命令
      
      // 检查是否是已注册的命令
      const matchedPrefix = registeredPrefixes.find(prefix => 
        fullCommand.toLowerCase() === prefix.toLowerCase()
      );
      
      if (matchedPrefix) {
        commands.push({
          command: fullCommand,
          prefix: matchedPrefix,
          startIndex: match.index,
          endIndex: match.index + fullCommand.length
        });
      }
    }
    
    return commands;
  }
}

// 创建全局单例实例
export const actionManager = new ActionManager();
