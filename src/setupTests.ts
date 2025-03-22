import '@testing-library/jest-dom';

// 扩展全局 Window 接口
declare global {
  interface Window {
    require: NodeRequire;
  }
}

// 创建完整的 require mock
const mockRequire = Object.assign(
  () => ({
    child_process: {
      exec: jest.fn()
    }
  }),
  {
    resolve: jest.fn(),
    cache: {},
    extensions: {},
    main: module
  }
) as unknown as NodeRequire;

// Mock Obsidian API
global.window.require = mockRequire;

// 添加全局测试工具函数
global.generateTestMessage = (overrides = {}) => ({
  id: '1',
  content: 'Test content',
  timestamp: Date.now(),
  sender: 'user',
  favorite: false,
  ...overrides
});
