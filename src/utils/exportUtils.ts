import { App, TFile } from 'obsidian';
import { Message } from '../component/Chat';

interface ExportResult {
  success: boolean;
  file?: TFile;
  error?: string;
}

/**
 * 导出消息为Markdown文件
 * @param app Obsidian应用实例
 * @param messages 要导出的消息
 * @param fileName 文件名
 * @returns 导出结果
 */
export async function exportMessagesToMarkdown(
  app: App, 
  messages: Message[], 
  fileName: string
): Promise<ExportResult> {
  try {
    if (messages.length === 0) {
      return {
        success: false,
        error: '没有消息可导出'
      };
    }
    
    // 生成Markdown内容
    const markdownContent = generateMarkdownFromMessages(messages);
    
    // 创建新的Markdown文件
    const file = await app.vault.create(fileName, markdownContent);
    
    // 打开创建的文件
    const leaf = app.workspace.getLeaf(false);
    await leaf.openFile(file);
    
    return {
      success: true,
      file
    };
    
  } catch (error) {
    console.error('导出消息为Markdown失败:', error);
    return {
      success: false,
      error: error.message || '导出失败'
    };
  }
}

/**
 * 从消息生成Markdown格式内容
 * @param messages 消息列表
 * @returns Markdown格式的字符串
 */
export function generateMarkdownFromMessages(messages: Message[]): string {
  let markdown = `# 导出的消息\n\n*导出时间: ${new Date().toLocaleString()}*\n\n`;
  
  if (messages.length === 0) {
    markdown += '无消息\n';
    return markdown;
  }
  
  // 将消息按时间排序
  const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
  
  // 添加每条消息
  sortedMessages.forEach((msg, index) => {
    markdown += `## 消息 ${index + 1}\n\n`;
    
    // 添加发送者信息
    markdown += `**${msg.sender === 'user' ? '用户' : 'AI助手'}**\n\n`;
    
    // 添加消息内容
    markdown += `> ${msg.content}\n\n`;
    
    // 添加时间戳
    markdown += `*时间: ${new Date(msg.timestamp).toLocaleString()}*\n\n`;
    
    // 如果不是最后一条消息，添加分隔线
    if (index < sortedMessages.length - 1) {
      markdown += '---\n\n';
    }
  });
  
  return markdown;
}
