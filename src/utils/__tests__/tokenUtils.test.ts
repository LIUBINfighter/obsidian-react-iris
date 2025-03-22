import { formatResponseTime } from '../tokenUtils';

describe('tokenUtils', () => {
  describe('formatResponseTime', () => {
    test('应该格式化毫秒为秒', () => {
      expect(formatResponseTime(1500)).toBe('1.5s');
    });

    test('应该保留小于1秒的毫秒显示', () => {
      expect(formatResponseTime(500)).toBe('500ms');
    });

    test('应该正确处理0和负值', () => {
      expect(formatResponseTime(0)).toBe('0ms');
      expect(formatResponseTime(-100)).toBe('0ms');
    });
  });
});
