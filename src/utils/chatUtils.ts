import { App } from 'obsidian';
import { ChatSession } from '../component/Chat';
import { debounce } from './debounceUtils';

// 保存聊天会话的防抖实例缓存
const debouncedSaveInstances = new Map<string, (...args: any[]) => void>();

/**
 * 获取聊天会话存储目录
 * @param app Obsidian应用实例
 * @returns 存储目录路径
 */
function getChatSessionDir(app: App): string {
  return `${app.vault.configDir}/plugins/obsidian-react-iris/chats`;
}

/**
 * 确保聊天会话目录存在
 * @param app Obsidian应用实例
 */
async function ensureChatDirExists(app: App): Promise<void> {
  const chatDir = getChatSessionDir(app);
  
  try {
    const dirExists = await app.vault.adapter.exists(chatDir);
    if (!dirExists) {
      await app.vault.adapter.mkdir(chatDir);
    }
  } catch (e) {
    console.error('创建聊天目录失败:', e);
    throw e;
  }
}

/**
 * 获取所有聊天会话ID
 * @param app Obsidian应用实例
 * @returns 会话ID数组
 */
export async function getAllChatSessionIds(app: App): Promise<string[]> {
  try {
    await ensureChatDirExists(app);
    const chatDir = getChatSessionDir(app);
    const files = await app.vault.adapter.list(chatDir);
    
    return files.files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const fileName = file.split('/').pop() || '';
        return fileName.replace('.json', '');
      });
  } catch (error) {
    console.error('获取聊天会话ID失败:', error);
    return [];
  }
}

/**
 * 保存聊天会话到文件(带防抖)
 * @param app Obsidian应用实例
 * @param sessionId 会话ID
 * @param session 会话数据
 * @param debounceMs 防抖时间（毫秒）
 */
export function saveChatSessionToFileWithDebounce(
  app: App, 
  sessionId: string, 
  session: ChatSession, 
  debounceMs = 500
): void {
  // 对每个sessionId创建唯一的防抖实例
  if (!debouncedSaveInstances.has(sessionId)) {
    debouncedSaveInstances.set(
      sessionId, 
      debounce(async (app: App, id: string, data: ChatSession) => {
        await saveChatSessionToFile(app, id, data);
      }, debounceMs)
    );
  }
  
  // 使用防抖函数保存
  const debouncedSave = debouncedSaveInstances.get(sessionId)!;
  debouncedSave(app, sessionId, session);
}

/**
 * 立即保存聊天会话到文件
 * @param app Obsidian应用实例
 * @param sessionId 会话ID
 * @param session 会话数据
 */
export async function saveChatSessionToFile(app: App, sessionId: string, session: ChatSession): Promise<void> {
  try {
    await ensureChatDirExists(app);
    const chatDir = getChatSessionDir(app);
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
