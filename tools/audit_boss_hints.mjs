import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ts = createRequire(join(root, 'package.json'))('typescript');
const cache = new Map();
const rf = (b) => existsSync(b) && extname(b) ? b : existsSync(b + '.ts') ? b + '.ts' : existsSync(join(b, 'index.ts')) ? join(b, 'index.ts') : b + '.ts';
function load(file) {
  const abs = rf(file);
  if (cache.has(abs)) return cache.get(abs).exports;
  const src = readFileSync(abs, 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const mod = { exports: {} }; cache.set(abs, mod);
  new Function('exports', 'module', 'require', out)(mod.exports, mod, (sp) => load(join(dirname(abs), sp)));
  return mod.exports;
}
const B = load(join(root, 'src/game/battle.ts'));
for (const b of B.BOSS_BATTLES) {
  for (const p of b.phases) {
    const lines = p.initialCode.split('\n');
    for (const h of (p.hints || [])) {
      for (const mm of h.matchAll(/第\s*(\d+)\s*行/g)) {
        const n = +mm[1];
        console.log(b.bossId, p.id, '第' + n + '行 ->', JSON.stringify(lines[n - 1]));
      }
    }
  }
}
