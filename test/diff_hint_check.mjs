import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');
const src = readFileSync(join(root, 'src/services/judge.ts'), 'utf8');
const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const mod = { exports: {} };
new Function('exports', 'module', 'require', out)(mod.exports, mod, () => { throw new Error('no require'); });
const { judgeRun } = mod.exports;

const spec = { judgeKind: 'stdout', stdoutChecks: [{ name: '终端显示 Hello, world!', contains: ['Hello, world!'] }] };
const cases = [
  ['Hello,world!', '缺空格'],
  ['Hello，world！', '中文标点'],
  ['hello world', '内容不对'],
  ['Hello, world!', '正确'],
];
for (const [stdout, label] of cases) {
  const v = judgeRun(spec, { ok: true, stdout, timedOut: false });
  const c = v.checks[0];
  console.log((c.ok ? 'PASS' : 'FAIL') + ' | ' + label + ' => ' + (c.detail || '(通过)'));
}
