// 生产构建：Rollup（纯 JS）+ 内置 TypeScript 编译器
// 不需要 esbuild / 原生二进制，任何有 node 的环境都可构建
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('[build] 开始构建 NEXUS……');
  const t0 = Date.now();

  const bundle = await rollup({
    input: join(__dirname, 'src/main.tsx'),
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: false,
        extensions: ['.mjs', '.js', '.json', '.ts', '.tsx', '.jsx'],
      }),
      commonjs(),
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      typescript({
        tsconfig: join(__dirname, 'tsconfig.json'),
        compilerOptions: { noEmit: false, allowImportingTsExtensions: false, declaration: false, declarationMap: false, sourceMap: false, outDir: undefined },
        exclude: ['node_modules', 'dist'],
      }),
    ],
    onwarn: (w) => {
      if (w.code === 'CIRCULAR_DEPENDENCY') return;
      console.warn('[rollup warn]', w.message);
    },
  });

  rmSync(join(__dirname, 'dist'), { recursive: true, force: true });
  mkdirSync(join(__dirname, 'dist', 'assets'), { recursive: true });

  const { output } = await bundle.generate({
    format: 'es',
    entryFileNames: 'assets/game.js',
    chunkFileNames: 'assets/chunks/[name]-[hash].js',
  });
  let total = 0;
  for (const chunk of output) {
    if (chunk.type === 'chunk') {
      total += chunk.code.length;
      const dest = join(__dirname, 'dist', chunk.fileName);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, chunk.code);
      console.log('[build] chunk:', chunk.fileName, (chunk.code.length / 1024).toFixed(0) + ' KB');
    }
  }
  console.log('[build] JS total:', (total / 1024).toFixed(0) + ' KB');
  await bundle.close();

  // 静态资源与 index
  cpSync(join(__dirname, 'public'), join(__dirname, 'dist'), { recursive: true });
  const index = readFileSync(join(__dirname, 'index.html'), 'utf8');
  // ESM 入口：页面级动态导入需要 module 与独立 chunk
  let outIndex = index.replace('<script type="module" src="/src/main.tsx"></script>', '<script type="module" src="./assets/game.js"></script>');
  // 资源改相对路径：这样部署到任意子路径（如 GitHub Pages 的 /02/）都能正确加载
  outIndex = outIndex.replace(/(href|src)="\/(?!\/)/g, '$1="./');
  // 版本指纹：避免 GitHub Pages / 浏览器继续使用旧版 global.css 与 game.js
  const assetVersion = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8')).version;
  outIndex = outIndex.replace(/href="\.\/([^"?]+\.css)"/g, 'href="./$1?v=' + assetVersion + '"');
  // 入口不追加 query：动态 chunk 会以 ../game.js 引用共享模块，query 不同会导致 React 双实例
  writeFileSync(join(__dirname, 'dist', 'index.html'), outIndex);

  console.log('[build] 完成，耗时', ((Date.now() - t0) / 1000).toFixed(1) + 's');
}

main().catch((e) => {
  console.error('[build] 失败：', e);
  process.exit(1);
});
