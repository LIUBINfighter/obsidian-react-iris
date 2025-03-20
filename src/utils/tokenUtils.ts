/**
 * 估算文本的token数量
 * 这是一个简化的估算方法，真实的token数取决于具体的分词器
 * @param text 要计算的文本
 * @returns 估算的token数量
 */
export function estimateTokenCount(text: string): number {
  if (!text || text.trim() === '') {
    return 0;
  }
  
  // 英文单词和标点符号处理（大约4个字符为1个token）
  const englishCharCount = (text.match(/[a-zA-Z0-9.,?!;:()\[\]{}'"<>\/\\@#$%^&*_+=|~`-]/g) || []).length;
  
  // 中文字符处理（每个汉字大约是1个token）
  const chineseCharCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  
  // 其他字符（如空格、换行、表情符等）
  const otherCharCount = text.length - englishCharCount - chineseCharCount;
  
  // 计算总token数
  return Math.ceil(englishCharCount / 4) + chineseCharCount + Math.ceil(otherCharCount / 2);
}

/**
 * 格式化响应时间显示
 * @param milliseconds 毫秒时间
 * @returns 格式化的时间字符串
 */
export function formatResponseTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  } else {
    return `${(milliseconds / 1000).toFixed(2)}s`;
  }
}
