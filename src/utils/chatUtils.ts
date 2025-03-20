import { App } from 'obsidian';
import { ChatSession } from '../component/Chat';

/**
 * 保存聊天会话到文件
 * @param app Obsidian应用实例
 * @param sessionId 会话ID
 * @param session 会话数据
 */
export async function saveChatSessionToFile(app: App, sessionId: string, session: ChatSession): Promise<void> {
  try {
    const configDir = app.vault.configDir;
    const chatDir = `${configDir}/plugins/obsidian-react-iris/chats`;
    
    // 确保目录存在
    try {
      const dirExists = await app.vault.adapter.exists(chatDir);
      if (!dirExists) {
        await app.vault.adapter.mkdir(chatDir);
      }
    } catch (e) {
      console.error('创建聊天目录失败:', e);
      throw e;
    }
    
    const chatFilePath = `${chatDir}/${sessionId}.json`;
    
    // 更新会话的时间戳
    const updatedSession = {
      ...session,
      updatedAt: Date.now()
    };
    
    const data = JSON.stringify(updatedSession, null, 2);
    await app.vault.adapter.write(chatFilePath, data);
    
    console.log(`聊天会话已保存: ${sessionId}`);
  } catch (error) {
    console.error('保存聊天记录失败:', error);
    throw error;
  }
}

/**
 * 从文件加载聊天会话
 * @param app Obsidian应用实例
 * @param sessionId 会话ID
 * @returns 聊天会话数据或null
 */
export async function loadChatSessionFromFile(app: App, sessionId: string): Promise<ChatSession | null> {
  try {
    const configDir = app.vault.configDir;
    const chatFilePath = `${configDir}/plugins/obsidian-react-iris/chats/${sessionId}.json`;
    
    // 检查文件是否存在
    const exists = await app.vault.adapter.exists(chatFilePath);
    
    if (exists) {
      const data = await app.vault.adapter.read(chatFilePath);
      return JSON.parse(data) as ChatSession;
    }
    
    return null;
  } catch (error) {
    console.error('加载聊天记录失败:', error);
    throw error;
  }
}

/**
 * 删除聊天会话
 * @param app Obsidian应用实例
 * @param sessionId 会话ID
 */
export async function deleteChatSession(app: App, sessionId: string): Promise<void> {
  try {
    const configDir = app.vault.configDir;
    const chatFilePath = `${configDir}/plugins/obsidian-react-iris/chats/${sessionId}.json`;
    
    // 检查文件是否存在
    const exists = await app.vault.adapter.exists(chatFilePath);
    
    if (exists) {
      await app.vault.adapter.remove(chatFilePath);
      console.log(`聊天会话已删除: ${sessionId}`);
    }
  } catch (error) {
    console.error('删除聊天记录失败:', error);
    throw error;
  }
}
