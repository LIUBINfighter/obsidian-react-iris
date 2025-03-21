import esbuild from 'esbuild';
import process from 'process';
import { copy } from 'esbuild-plugin-copy';
import builtins from 'builtin-modules';

const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
*/
`;

const prod = process.argv[2] === 'production';

const buildOptions = {
  banner: {
    js: banner,
  },
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: [
    'obsidian', 
    'electron', 
    ...builtins
    // 移除 LangChain 依赖的 external 标记，让它们被打包进来
  ],
  format: 'cjs',
  target: 'es2018',
  logLevel: 'info',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  outfile: 'main.js',
  plugins: [
    copy({
      assets: [
        { from: ['./manifest.json'], to: ['./'] },
        { from: ['./styles.css'], to: ['./'] },
      ]
    })
  ],
};

if (prod) {
  esbuild.build(buildOptions).catch(() => process.exit(1));
} else {
  // 开发模式使用 context API 进行监视
  esbuild.context(buildOptions)
    .then(ctx => {
      ctx.watch();
      console.log('⚡ esbuild 正在监视文件变化...');
    })
    .catch(() => process.exit(1));
}
