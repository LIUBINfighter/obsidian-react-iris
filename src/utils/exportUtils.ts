import { App, TFile, normalizePath } from 'obsidian';
import { Message } from '../component/Chat';
import { FavoriteItem } from './favoriteUtils';
import { ExportOptions } from '../component/modal/ExportModal';

interface ExportResult {
  success: boolean;
  file?: TFile;
  error?: string;
}

/**
 * 导出消息为Markdown文件
 * @param app Obsidian应用实例
 * @param messages 要导出的消息
 * @param options 导出选项（标题、标签、存储位置）
 * @returns 导出结果
 */
export async function exportMessagesToMarkdown(
  app: App, 
  messages: Message[] | FavoriteItem[], 
  options: ExportOptions
): Promise<ExportResult> {
  try {
    if (messages.length === 0) {
      return {
        success: false,
        error: '没有消息可导出'
      };
    }
    
    // 规范化文件夹路径和创建不存在的文件夹
    let folderPath = options.folderPath;
    if (folderPath === '/') folderPath = '';
    if (folderPath && !folderPath.endsWith('/')) folderPath += '/';
    
    // 确保文件夹存在
    await ensureFolderExists(app, folderPath);
    
    // 生成唯一的文件名
    const fileName = generateUniqueFileName(options.title);
    
    // 完整的文件路径
    const fullPath = normalizePath(`${folderPath}${fileName}.md`);
    
    // 生成Markdown内容
    const markdownContent = generateMarkdownFromMessages(messages, options);
    
    // 创建新的Markdown文件
    const file = await app.vault.create(fullPath, markdownContent);
    
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
 * 确保文件夹存在，如果不存在则创建
 * @param app Obsidian应用实例
 * @param folderPath 文件夹路径
 */
async function ensureFolderExists(app: App, folderPath: string): Promise<void> {
  if (!folderPath) return; // 根目录总是存在的
  
  // 拆分路径部分
  const parts = folderPath.split('/').filter(p => p);
  let currentPath = '';
  
  for (const part of parts) {
    currentPath += part;
    
    // 检查是否已存在
    if (!(await app.vault.adapter.exists(currentPath))) {
      await app.vault.createFolder(currentPath);
    }
    
    currentPath += '/';
  }
}

/**
 * 根据标题生成唯一的文件名
 * @param title 标题
 * @returns 唯一的文件名
 */
function generateUniqueFileName(title: string): string {
  // 从标题生成合法的文件名
  const sanitizedTitle = title
    .replace(/[\\/:*?"<>|]/g, '-') // 替换非法字符
    .replace(/\s+/g, '-') // 替换空白字符为连字符
    .replace(/-+/g, '-') // 避免多个连续的连字符
    .replace(/^-|-$/g, ''); // 删除开头和结尾的连字符
  
  // 添加时间戳确保唯一性
  const timestamp = new Date().toISOString()
    .replace(/:/g, '-')
    .replace(/\..+$/, '');
  
  return `${sanitizedTitle}-${timestamp}`;
}

/**
 * 从消息生成Markdown格式内容
 * @param messages 消息列表
 * @param options 导出选项
 * @returns Markdown格式的字符串
 */
export function generateMarkdownFromMessages(
  messages: Message[] | FavoriteItem[],
  options: ExportOptions
): string {
  const now = new Date();
  const formattedDate = now.toISOString();
  const tagsYaml = options.tags.map(tag => `"${tag}"`).join(', ');
  
  // 创建YAML frontmatter，包含所有元数据
  let markdown = `---
title: ${options.title}
date: ${formattedDate}
exported_at: ${now.toLocaleString()}
message_count: ${messages.length}
tags: [${tagsYaml}]
source: ObsidianIris AI助手
messages:
${messages.map(msg => `  - sender: ${msg.sender}
    timestamp: ${new Date(msg.timestamp).toLocaleString()}
    ${msg.tokencount ? `tokens: ${msg.tokencount}` : ''}`).join('\n')}
---

`;
  
  if (messages.length === 0) {
    markdown += '> 无收藏内容\n';
    return markdown;
  }
  
  // 将消息按时间排序
  const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
  
  // 添加每条消息，极简格式，只保留内容
  sortedMessages.forEach((msg, index) => {
    // 直接添加消息内容，保持原始格式
    markdown += `${msg.content.trim()}\n`;
    
    // 如果不是最后一条消息，添加分隔线
    if (index < sortedMessages.length - 1) {
      markdown += `\n---\n\n`;
    }
  });
  
  return markdown;
}

/**
 * 生成单条消息的Markdown
 * 用于单独导出某个收藏项
 */
export function generateSingleMessageMarkdown(
  message: Message | FavoriteItem,
  options?: ExportOptions
): string {
  const now = new Date();
  const tagsYaml = options?.tags 
    ? options.tags.map(tag => `"${tag}"`).join(', ')
    : '"AI回复", "chat"';
  
  // 创建YAML frontmatter，包含所有需要的元数据
  let markdown = `---
title: ${options?.title || '导出的AI回复'}
date: ${now.toISOString()}
created: ${new Date(message.timestamp).toISOString()}
tags: [${tagsYaml}]
source: ObsidianIris AI助手
sender: ${message.sender}
${message.tokencount ? `tokens: ${message.tokencount}` : ''}
${message.responsetime ? `response_time: ${message.responsetime}ms` : ''}
---

`;
  
  // 添加消息内容，保持原始格式，不添加任何标记
  markdown += `${message.content.trim()}\n`;
  
  return markdown;
}
