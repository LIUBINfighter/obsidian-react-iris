import { MessageSegmentType, parseMessageContent, generateId } from '../messageProcessorUtils';

describe('messageProcessorUtils', () => {
  describe('parseMessageContent', () => {
    test('应该正确解析普通文本消息', () => {
      const message = {
        id: '1',
        content: 'Hello world',
        timestamp: Date.now(),
        sender: 'user' as const,  // 修复类型
        favorite: false
      };
      
      const segments = parseMessageContent(message);
      expect(segments).toHaveLength(1);
      expect(segments[0].type).toBe(MessageSegmentType.TEXT);
      expect(segments[0].content).toBe('Hello world');
    });

    test('应该正确解析代码块', () => {
      const message = {
        id: '1',
        content: '```javascript\nconsole.log("test");\n```',
        timestamp: Date.now(),
        sender: 'assistant' as const,  // 修复类型
        favorite: false
      };
      
      const segments = parseMessageContent(message);
      expect(segments).toHaveLength(1);
      expect(segments[0].type).toBe(MessageSegmentType.CODE);
      expect(segments[0].language).toBe('javascript');
    });

    test('应该正确解析思考过程标记', () => {
      const message = {
        id: '1',
        content: '<think>思考中...</think>',
        timestamp: Date.now(),
        sender: 'assistant' as const,  // 修复类型
        favorite: false
      };
      
      const segments = parseMessageContent(message);
      expect(segments).toHaveLength(1);
      expect(segments[0].type).toBe(MessageSegmentType.THINKING);
    });
  });

  describe('generateId', () => {
    test('应该生成唯一ID', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });
});
