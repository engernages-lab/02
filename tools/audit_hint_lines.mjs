import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ts = createRequire(join(root, 'package.json'))('typescript');
function loadTS(file) {
  const src = readFileSync(file, 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', out)(mod.exports, mod, () => { throw new Error('no require'); });
  return mod.exports;
}
const { LEVELS } = loadTS(join(root, 'src/game/levels.ts'));
for (const l of LEVELS) {
  const lines = l.initialCode.split('\n');
  for (const h of l.hints) {
    for (const m of h.matchAll(/第\s*(\d+)\s*行/g)) {
      const n = Number(m[1]);
      const real = lines[n - 1] ?? '<不存在>';
      console.log(l.id + ' 第' + n + '行 -> ' + JSON.stringify(real));
    }
  }
  for (const m of (l.behavior + ' ' + l.goal).matchAll(/第\s*(\d+)\s*行/g)) {
    const n = Number(m[1]);
    console.log(l.id + ' [goal/behavior] 第' + n + '行 -> ' + JSON.stringify(lines[n - 1] ?? '<不存在>'));
  }
}
