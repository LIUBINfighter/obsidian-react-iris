import { Message } from '../component/Chat';

/**
 * 消息段落类型
 */
export enum MessageSegmentType {
  TEXT = 'text',           // 普通文本
  THINKING = 'thinking',   // 思考过程
  CODE = 'code',           // 代码块
  MERMAID = 'mermaid'      // Mermaid图表
}

/**
 * 消息段落接口
 */
export interface MessageSegment {
  id: string;              // 段落唯一ID
  type: MessageSegmentType;// 段落类型
  content: string;         // 段落内容
  language?: string;       // 代码块的语言
  originalMessage: Message;// 引用原始消息
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * 解析消息内容，将其分割为多个段落
 * @param message 原始消息
 * @returns 解析后的消息段落列表
 */
export function parseMessageContent(message: Message): MessageSegment[] {
  // 如果是用户消息，则不做特殊处理
  if (message.sender === 'user') {
    return [{
      id: generateId(),
      type: MessageSegmentType.TEXT,
      content: message.content,
      originalMessage: message
    }];
  }

  const segments: MessageSegment[] = [];
  let content = message.content;
  
  // 处理思考过程 <think>...</think>
  const thinkingRegex = /<think>([\s\S]*?)<\/think>/g;
  const thinkingMatches = [...content.matchAll(thinkingRegex)];
  
  // 如果包含思考过程，则先提取出来
  if (thinkingMatches.length > 0) {
    for (const match of thinkingMatches) {
      const thinkingContent = match[1];
      segments.push({
        id: generateId(),
        type: MessageSegmentType.THINKING,
        content: thinkingContent,
        originalMessage: message
      });
      
      // 从原内容中移除思考过程
      content = content.replace(match[0], '');
    }
  }
  
  // 处理代码块
  const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // 添加代码块前的文本
    const textBefore = content.substring(lastIndex, match.index).trim();
    if (textBefore) {
      // 将文本按段落分割
      const paragraphs = splitTextIntoParagraphs(textBefore);
      segments.push(...paragraphs.map(p => ({
        id: generateId(),
        type: MessageSegmentType.TEXT,
        content: p,
        originalMessage: message
      })));
    }
    
    // 提取语言和代码内容
    const language = match[1] || 'text';
    const codeContent = match[2];
    
    // 判断是否为mermaid图表
    if (language.toLowerCase() === 'mermaid') {
      segments.push({
        id: generateId(),
        type: MessageSegmentType.MERMAID,
        content: codeContent,
        language: 'mermaid',
        originalMessage: message
      });
    } else {
      segments.push({
        id: generateId(),
        type: MessageSegmentType.CODE,
        content: codeContent,
        language,
        originalMessage: message
      });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // 添加剩余的文本
  const remainingText = content.substring(lastIndex).trim();
  if (remainingText) {
    // 将剩余文本按段落分割
    const paragraphs = splitTextIntoParagraphs(remainingText);
    segments.push(...paragraphs.map(p => ({
      id: generateId(),
      type: MessageSegmentType.TEXT,
      content: p,
      originalMessage: message
    })));
  }
  
  return segments;
}

/**
 * 将文本按段落分割
 * @param text 要分割的文本
 * @returns 分割后的段落数组
 */
function splitTextIntoParagraphs(text: string): string[] {
  // 按连续两个换行符分割
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
  
  // 如果没有段落，则返回原文本
  if (paragraphs.length === 0) {
    return [text];
  }
  
  // 处理剩余单行内容，如果太长则不分割
  return paragraphs.flatMap(p => {
    // 如果段落包含单个换行符且长度适中，则尝试进一步分割
    if (p.includes('\n') && p.length < 1000) {
      const lines = p.split('\n').filter(line => line.trim());
      // 只有当每行长度适中时才分割
      if (lines.every(line => line.length < 100)) {
        return lines;
      }
    }
    return [p];
  });
}

/**
 * 将特定消息段落转换为收藏消息
 * @param segment 消息段落
 * @returns 可收藏的消息对象
 */
export function segmentToFavoriteMessage(segment: MessageSegment): Message {
  // 使用原始消息的属性，但更新内容为段落内容
  return {
    ...segment.originalMessage,
    id: segment.id, // 使用段落ID
    content: segment.content,
    // 对于代码块和mermaid，添加类型标记
    ...(segment.type === MessageSegmentType.CODE && {
      content: `\`\`\`${segment.language || ''}\n${segment.content}\n\`\`\``
    }),
    ...(segment.type === MessageSegmentType.MERMAID && {
      content: `\`\`\`mermaid\n${segment.content}\n\`\`\``
    }),
    ...(segment.type === MessageSegmentType.THINKING && {
      content: `<think>${segment.content}</think>`
    })
  };
}

/**
 * 检查文本是否为空或只包含空白字符
 */
export function isEmptyOrWhitespace(text: string): boolean {
  return !text || /^\s*$/.test(text);
}
