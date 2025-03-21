/**
 * 格式化响应时间
 * @param ms 毫秒数
 * @returns 格式化后的字符串
 */
export function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

/**
 * 估算文本的token数量
 * @param text 文本内容
 * @returns 估算的token数量
 */
export function estimateTokenCount(text: string): number {
  // 这是一个简单的估算，实际token计数取决于模型和分词器
  // GPT模型平均每4个字符约为1个token
  const chars = text.trim().length;
  const estimatedTokens = Math.ceil(chars / 4);
  return estimatedTokens;
}

/**
 * 判断代码块语言是否为Mermaid
 * @param language 语言字符串
 * @returns 是否为Mermaid
 */
export function isMermaidLanguage(language: string): boolean {
  return language.toLowerCase() === 'mermaid';
}

/**
 * 从代码块中提取语言
 * @param codeBlock 代码块文本 
 * @returns 语言标识符
 */
export function extractLanguageFromCodeBlock(codeBlock: string): string {
  const match = codeBlock.match(/^```([a-zA-Z0-9_+-]*)/);
  return match ? match[1].trim() : '';
}
