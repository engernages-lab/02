import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');
function makeLoader() {
  const cache = new Map();
  function rf(base) { if (existsSync(base) && extname(base)) return base; if (existsSync(base + '.ts')) return base + '.ts'; if (existsSync(join(base, 'index.ts'))) return join(base, 'index.ts'); return base + '.ts'; }
  function load(file) {
    const abs = rf(file); if (cache.has(abs)) return cache.get(abs).exports;
    const src = readFileSync(abs, 'utf8');
    const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    const mod = { exports: {} }; cache.set(abs, mod);
    const req = (sp) => { if (!sp.startsWith('.')) throw new Error('ext'); return load(join(dirname(abs), sp)); };
    new Function('exports', 'module', 'require', out)(mod.exports, mod, req);
    return mod.exports;
  }
  return rel => load(join(root, rel));
}
const load = makeLoader();
const B = load('src/game/battle.ts');
const J = load('src/services/judge.ts');
const RUNNER = readFileSync(join(__dirname, '_mp_runner.py'), 'utf8');
let raw = '';
const mp = await loadMicroPython({ url: join(root, 'node_modules', '@micropython/micropython-webassembly-pyscript', 'micropython-settrace.wasm'), stdout: s => { raw += s; }, stderr: s => { raw += s; } });
const pyStr = s => JSON.stringify(String(s));
function extract(m) { const i = raw.lastIndexOf(m); if (i < 0) return null; try { return JSON.parse(raw.slice(i + m.length).trim()); } catch { return null; } }
function run(code) { raw = ''; mp.runPython(RUNNER.replace('__NX_SRC__', pyStr(code))); const r = extract('__NX_RES__'); return { ok: r ? !r.err : false, stdout: r ? (r.out || '') : '', timedOut: false }; }
for (const def of B.BOSS_BATTLES) {
  for (const p of def.phases) {
    const combined = J.combineWithHarness(p.initialCode, J.buildHarness(p.judge.pythonChecks || []));
    const v = J.judgeRun(p.judge, run(combined));
    let mask = 0; v.checks.forEach((c, i) => { if (c.ok) mask |= (1 << i); });
    console.log(def.bossId, p.id, 'mask=' + mask, 'stored=' + p.baselineMask, 'ok=' + (mask === p.baselineMask));
  }
}
