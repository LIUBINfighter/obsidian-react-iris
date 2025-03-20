import { actionManager } from './ActionManager';
import { makeTitleAction } from './make-title';

// 注册所有内置命令
actionManager.registerAction(makeTitleAction);

export { actionManager };
export * from './ActionTypes';
export { MakeTitleAction } from './make-title';
