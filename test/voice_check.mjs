// 语音服务：单实例不叠加 / 暂停继续停止 / 角色音色 / 中文音色提示
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');

// ---- 模拟 Web Speech API ----
const spoken = [];
const calls = { cancel: 0, pause: 0, resume: 0 };
let voices = [
  { name: 'Microsoft Xiaoxiao', lang: 'zh-CN', localService: true },
  { name: 'Microsoft Yunxi', lang: 'zh-CN', localService: true },
  { name: 'English David', lang: 'en-US', localService: true },
];
class FakeUtterance { constructor(text) { this.text = text; } }
const synth = {
  speaking: false, paused: false,
  speak(u) { spoken.push(u); synth.speaking = true; if (u.onstart) u.onstart(); },
  cancel() { calls.cancel++; synth.speaking = false; },
  pause() { calls.pause++; synth.paused = true; },
  resume() { calls.resume++; synth.paused = false; },
  getVoices() { return voices; },
  addEventListener() {},
};
globalThis.window = { speechSynthesis: synth };
globalThis.SpeechSynthesisUtterance = FakeUtterance;

function makeLoader() {
  const cache = new Map();
  function rf(base) {
    if (existsSync(base) && extname(base)) return base;
    if (existsSync(base + '.ts')) return base + '.ts';
    if (existsSync(join(base, 'index.ts'))) return join(base, 'index.ts');
    return base + '.ts';
  }
  function load(file) {
    const abs = rf(file);
    if (cache.has(abs)) return cache.get(abs).exports;
    const src = readFileSync(abs, 'utf8');
    const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    const mod = { exports: {} };
    cache.set(abs, mod);
    const req = (sp) => { if (!sp.startsWith('.')) throw new Error('ext'); return load(join(dirname(abs), sp)); };
    new Function('exports', 'module', 'require', out)(mod.exports, mod, req);
    return mod.exports;
  }
  return rel => load(join(root, rel));
}
const V = makeLoader()('src/services/voice.ts');
const speech = V.speech;

let pass = 0, total = 0;
const check = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};

console.log('=== 1. 播放与不叠加 ===');
check(speech.supported === true, '检测到语音合成能力');
speech.applySettings(V.normalizeVoice(undefined));
check(speech.speak('第一句', 'mira') === true, '可以朗读一句');
check(spoken.length === 1, '产生 1 条朗读');
const first = spoken[0];
check(first.rate > 0 && first.pitch > 0 && first.volume > 0, '朗读参数已设置');
speech.speak('第二句', 'engel');
check(calls.cancel >= 1, '播放新一句前会取消上一句（不叠加）');
check(spoken.length === 2 && speech.isSpeaking, '同一时刻只有最新一段在播');

console.log('=== 2. 暂停 / 继续 / 停止 ===');
speech.pause();
check(speech.paused === true, '暂停后状态为 paused');
speech.resume();
check(speech.isSpeaking === true, '继续后状态为 speaking');
speech.stop();
check(speech.isSpeaking === false && speech.paused === false, '停止后回到 idle');
check(calls.pause === 1 && calls.resume === 1, '暂停/继续各调用一次');

console.log('=== 3. 开关与空文本 ===');
speech.applySettings(V.normalizeVoice({ enabled: false }));
const before = spoken.length;
check(speech.speak('关闭时不应朗读', 'mira') === false, '语音关闭时 speak 返回 false');
check(spoken.length === before, '语音关闭时不会产生朗读');
speech.applySettings(V.normalizeVoice(undefined));
check(speech.speak('   ', 'mira') === false, '空白文本不朗读');

console.log('=== 4. 角色音色与中文优先 ===');
check(speech.hasChineseVoice() === true, '检测到中文音色');
check(speech.chineseVoiceHint() === null, '有中文音色时无提示');
const profileRoles = Object.keys(V.ROLE_PROFILES);
['mira', 'engel', 'k0', 'r07', 'system'].forEach(r => {
  check(profileRoles.includes(r), '存在角色语音画像：' + r);
});
const mira = V.ROLE_PROFILES.mira, k0 = V.ROLE_PROFILES.k0;
check(mira.pitch > k0.pitch, 'MIRA 音调高于 K-0（温柔 vs 低沉）');
check(k0.rate < mira.rate, 'K-0 语速更慢（压迫感）');
const opts = speech.voiceOptions();
check(opts.length >= 3 && opts[0].lang.startsWith('zh'), '音色列表中文优先');

console.log('=== 5. 无中文音色的提示 ===');
voices = [{ name: 'English David', lang: 'en-US', localService: true }];
check(speech.hasChineseVoice() === false, '无中文音色时检测为 false');
check(typeof speech.chineseVoiceHint() === 'string' && speech.chineseVoiceHint().includes('中文'), '给出中文音色缺失提示');
voices = [];
check(typeof speech.chineseVoiceHint() === 'string', '音色未加载时也有提示');
voices = [{ name: 'Microsoft Xiaoxiao', lang: 'zh-CN', localService: true }];

console.log('=== 6. 角色映射 ===');
const roleOf = (kind) => V.RoleFromKind ? V.RoleFromKind(kind) : null;
check(typeof V.speakLine === 'function', 'speakLine 便捷方法存在');
check(V.ROLE_PROFILES.k0 !== undefined && V.ROLE_PROFILES.engel !== undefined, 'K-0 / 恩格尔 画像存在');

console.log('\n=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
