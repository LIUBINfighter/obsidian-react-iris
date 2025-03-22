export class App {
  vault: any;
  workspace: any;
  constructor() {
    this.vault = {};
    this.workspace = {};
  }
}

export class Plugin {}

export const MarkdownRenderer = {
  renderMarkdown: jest.fn()
};

export class Notice {
  constructor(message: string) {}
}

export const setIcon = jest.fn();

export const moment = jest.fn();

export class TFile {
  path: string;
  constructor(path: string) {
    this.path = path;
  }
}

export class TFolder {
  path: string;
  children: (TFile | TFolder)[];
  constructor(path: string) {
    this.path = path;
    this.children = [];
  }
}
