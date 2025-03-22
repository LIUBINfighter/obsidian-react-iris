import { generateMarkdownContent } from '../exportUtils';
import { Message } from '../../component/Chat';

describe('exportUtils', () => {
  describe('generateMarkdownContent', () => {
    test('应该生成正确的Markdown格式', () => {
      const messages: Message[] = [
        {
          id: '1',
          content: 'Hello',
          timestamp: Date.now(),
          sender: 'user' as const,
          favorite: true
        }
      ];
      
      const options = {
        title: 'Test Chat',
        tags: ['test', 'chat']
      };
      
      const markdown = generateMarkdownContent(messages, options);
      
      expect(markdown).toContain('# Test Chat');
      expect(markdown).toContain('tags: test chat');
      expect(markdown).toContain('> [!cite]+ User');
      expect(markdown).toContain('Hello');
    });

    test('应该正确处理代码块', () => {
      const messages: Message[] = [
        {
          id: '1',
          content: '```js\nconsole.log("test");\n```',
          timestamp: Date.now(),
          sender: 'assistant' as const,
          favorite: true
        }
      ];
      
      const options = {title: 'Test', tags: []};
      const markdown = generateMarkdownContent(messages, options);
      
      expect(markdown).toContain('```js');
      expect(markdown).toContain('console.log("test");');
    });
  });
});
