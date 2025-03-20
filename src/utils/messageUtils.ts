import { Message } from '../component/Chat';

/**
 * 将消息保存到收藏
 * @param messages 要保存的消息列表
 */
export async function saveMessageToFavorites(messages: Message[]): Promise<void> {
  try {
    localStorage.setItem('obsidian-react-iris-favorites', JSON.stringify(messages));
  } catch (error) {
    console.error('保存收藏消息到localStorage失败:', error);
    throw error;
  }
}

/**
 * 从存储中加载收藏的消息
 * @returns 收藏的消息列表
 */
export async function loadFavoritesFromStorage(): Promise<Message[]> {
  try {
    const storedFavorites = localStorage.getItem('obsidian-react-iris-favorites');
    if (storedFavorites) {
      return JSON.parse(storedFavorites) as Message[];
    }
    return [];
  } catch (error) {
    console.error('从localStorage加载收藏消息失败:', error);
    return [];
  }
}

/**
 * 将消息添加到收藏
 * @param message 要添加的消息
 * @param currentFavorites 当前收藏列表
 * @returns 更新后的收藏列表
 */
export function addMessageToFavorites(message: Message, currentFavorites: Message[]): Message[] {
  // 检查消息是否已在收藏中
  if (!currentFavorites.some(msg => msg.id === message.id)) {
    return [...currentFavorites, {...message, favorite: true}];
  }
  return currentFavorites;
}

/**
 * 从收藏中移除消息
 * @param messageId 要移除的消息ID
 * @param currentFavorites 当前收藏列表
 * @returns 更新后的收藏列表
 */
export function removeMessageFromFavorites(messageId: string, currentFavorites: Message[]): Message[] {
  return currentFavorites.filter(msg => msg.id !== messageId);
}
