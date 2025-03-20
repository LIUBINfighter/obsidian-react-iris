import { App } from 'obsidian';
import { Message } from '../component/Chat';

/**
 * 收藏消息项，在普通消息的基础上添加折叠状态
 */
export interface FavoriteItem extends Message {
  folded: boolean; // 是否折叠状态
  sourceSessionId?: string; // 消息来源的会话ID
}

/**
 * 收藏箱会话
 */
export interface FavoriteSession {
  items: FavoriteItem[];
  updatedAt: number;
}

/**
 * 获取收藏箱存储路径
 */
function getFavoriteFilePath(app: App): string {
  return `${app.vault.configDir}/plugins/obsidian-react-iris/favorite.json`;
}

/**
 * 确保插件目录存在
 */
async function ensurePluginDirExists(app: App): Promise<void> {
  const dir = `${app.vault.configDir}/plugins/obsidian-react-iris`;
  
  try {
    const dirExists = await app.vault.adapter.exists(dir);
    if (!dirExists) {
      await app.vault.adapter.mkdir(dir);
    }
  } catch (e) {
    console.error('创建插件目录失败:', e);
    throw e;
  }
}

/**
 * 保存收藏箱数据
 */
export async function saveFavorites(app: App, items: FavoriteItem[]): Promise<void> {
  try {
    await ensurePluginDirExists(app);
    const filePath = getFavoriteFilePath(app);
    
    const favoriteSession: FavoriteSession = {
      items,
      updatedAt: Date.now()
    };
    
    const data = JSON.stringify(favoriteSession, null, 2);
    await app.vault.adapter.write(filePath, data);
    
    console.log('收藏箱数据已保存');
  } catch (error) {
    console.error('保存收藏箱数据失败:', error);
    throw error;
  }
}

/**
 * 加载收藏箱数据
 */
export async function loadFavorites(app: App): Promise<FavoriteItem[]> {
  try {
    const filePath = getFavoriteFilePath(app);
    const exists = await app.vault.adapter.exists(filePath);
    
    if (!exists) {
      console.log('收藏箱文件不存在，返回空数组');
      return [];
    }
    
    const data = await app.vault.adapter.read(filePath);
    const favoriteSession = JSON.parse(data) as FavoriteSession;
    
    // 确保每个项目都有folded属性
    const validatedItems = favoriteSession.items.map(item => ({
      ...item,
      folded: item.folded !== undefined ? item.folded : false
    }));
    
    return validatedItems;
  } catch (error) {
    console.error('加载收藏箱数据失败:', error);
    
    // 如果加载失败，返回空数组而不是抛出错误
    // 这样可以避免UI出现异常
    return [];
  }
}

/**
 * 添加消息到收藏箱
 */
export async function addToFavorites(app: App, message: Message, sessionId?: string): Promise<FavoriteItem[]> {
  const favorites = await loadFavorites(app);
  
  // 检查是否已存在
  if (favorites.some(item => item.id === message.id)) {
    return favorites;
  }
  
  // 创建新的收藏项，默认不折叠
  const favoriteItem: FavoriteItem = {
    ...message,
    folded: false,
    favorite: true,
    sourceSessionId: sessionId
  };
  
  const updatedFavorites = [favoriteItem, ...favorites];
  await saveFavorites(app, updatedFavorites);
  
  return updatedFavorites;
}

/**
 * 从收藏箱中移除消息
 */
export async function removeFromFavorites(app: App, messageId: string): Promise<FavoriteItem[]> {
  const favorites = await loadFavorites(app);
  const updatedFavorites = favorites.filter(item => item.id !== messageId);
  
  if (updatedFavorites.length !== favorites.length) {
    await saveFavorites(app, updatedFavorites);
  }
  
  return updatedFavorites;
}

/**
 * 更新收藏项的折叠状态
 */
export async function updateFoldState(app: App, messageId: string, folded: boolean): Promise<FavoriteItem[]> {
  const favorites = await loadFavorites(app);
  
  const updatedFavorites = favorites.map(item => 
    item.id === messageId ? { ...item, folded } : item
  );
  
  await saveFavorites(app, updatedFavorites);
  
  return updatedFavorites;
}

/**
 * 迁移旧的localStorage数据到文件存储(如果需要)
 */
export async function migrateFromLocalStorage(app: App): Promise<void> {
  try {
    // 检查文件是否已存在
    const filePath = getFavoriteFilePath(app);
    const fileExists = await app.vault.adapter.exists(filePath);
    
    if (fileExists) {
      console.log('收藏箱文件已存在，跳过迁移');
      return;
    }
    
    // 尝试从localStorage加载
    const storedFavorites = localStorage.getItem('obsidian-react-iris-favorites');
    if (!storedFavorites) {
      console.log('找不到localStorage数据，跳过迁移');
      return;
    }
    
    // 解析并转换数据
    const oldFavorites = JSON.parse(storedFavorites) as Message[];
    const newFavorites: FavoriteItem[] = oldFavorites.map(msg => ({
      ...msg,
      folded: false,
      favorite: true
    }));
    
    // 保存到文件
    await saveFavorites(app, newFavorites);
    
    // 清除localStorage
    localStorage.removeItem('obsidian-react-iris-favorites');
    
    console.log('已成功将收藏数据从localStorage迁移到文件');
  } catch (error) {
    console.error('从localStorage迁移数据失败:', error);
  }
}
