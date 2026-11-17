// A1 草稿逻辑回归：隔离 / 版本 / 历史 / 通关代码 / 清除 / 损坏备份 / 写入失败 / 防抖
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const req = createRequire(join(root, 'package.json'));
const ts = req('typescript');

/** 内存版 localStorage：可模拟配额失败与指定 key 写入失败 */
class MemoryStorage {
  constructor() {
    this.map = new Map();
    this.failKeys = new Set();
    this.quota = Infinity;
  }
  get length() { return this.map.size; }
  key(i) { return Array.from(this.map.keys())[i] ?? null; }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) {
    const s = String(v);
    if (this.failKeys.has(k) || s.length > this.quota) {
      const e = new Error('QuotaExceededError');
      e.name = 'QuotaExceededError';
      throw e;
    }
    this.map.set(k, s);
  }
  removeItem(k) { this.map.delete(k); }
  clear() { this.map.clear(); }
  keys() { return Array.from(this.map.keys()); }
}

const fake = new MemoryStorage();
globalThis.localStorage = fake;

const src = readFileSync(join(root, 'src/services/drafts.ts'), 'utf8');
const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const mod = { exports: {} };
new Function('exports', 'module', 'require', out)(mod.exports, mod, () => { throw new Error('no require'); });
const D = mod.exports;

let pass = 0, total = 0;
const ok = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? '  => ' + extra : ''));
};
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const NS_A = 'p1700000000000';
const NS_B = 'p1800000000000';

console.log('=== 1. 命名空间与 key ===');
ok(D.draftNamespace({ identity: { createdAt: 1700000000000 } }) === NS_A, '命名空间取自 identity.createdAt');
ok(D.draftNamespace({ identity: {} }) === 'guest', '缺少 createdAt 时回退 guest');
ok(D.draftNamespace(null) === 'guest', '空玩家回退 guest');
ok(D.draftKey(NS_A, '1-1') === 'nexus_draft_v1:p1700000000000:1-1', 'key 形如 nexus_draft_v1:<ns>:<level>');
const parsed = D.parseDraftKey('nexus_draft_v1:p1700000000000:1-1');
ok(parsed && parsed.ns === NS_A && parsed.levelId === '1-1', 'key 可反解出命名空间与关卡');
ok(D.parseDraftKey('nexus_code_repair_save_v1') === null, '非草稿 key 反解为 null');

console.log('=== 2. 写入 / 读取 / 版本 ===');
let r = D.writeDraft(NS_A, '1-1', 'print(1)\n');
ok(r.ok && r.changed, '首次写入成功');
let d = D.readDraft(NS_A, '1-1');
ok(!!d && d.code === 'print(1)\n', '读回内容一致');
ok(d.v === D.DRAFT_ENTRY_VERSION, '草稿带版本号 v' + D.DRAFT_ENTRY_VERSION);
ok(d.history.length === 0, '首条草稿没有历史');
r = D.writeDraft(NS_A, '1-1', 'print(1)\n');
ok(r.ok && !r.changed, '内容未变时不重复写盘（changed=false）');
const stamp1 = D.readDraft(NS_A, '1-1').updatedAt;
r = D.writeDraft(NS_A, '1-1', 'print(1)\n', { force: true, now: stamp1 + 1234 });
ok(r.ok && r.changed && D.readDraft(NS_A, '1-1').updatedAt === stamp1 + 1234, '手动强制保存会刷新保存时间（内容不变）');
ok(D.readDraft(NS_A, '1-1').history.length === 0, '强制保存同一内容不会制造重复历史');

console.log('=== 3. 关卡隔离 / 存档隔离 ===');
D.writeDraft(NS_A, '1-2', 'print(2)\n');
D.writeDraft(NS_B, '1-1', 'print(other-save)\n');
ok(D.readDraft(NS_A, '1-1').code === 'print(1)\n', '同存档不同关卡互不覆盖');
ok(D.readDraft(NS_A, '1-2').code === 'print(2)\n', '第二关内容独立');
ok(D.readDraft(NS_B, '1-1').code === 'print(other-save)\n', '不同存档同一关卡互不覆盖');
ok(D.readDraft(NS_A, '1-3') === null, '未写过的关卡返回 null');
ok(JSON.stringify(D.listDraftLevels(NS_A)) === JSON.stringify(['1-1', '1-2']), '按存档列出草稿关卡');

console.log('=== 4. 历史快照（恢复上一版） ===');
D.writeDraft(NS_A, '1-1', 'v2\n');
D.writeDraft(NS_A, '1-1', 'v3\n');
d = D.readDraft(NS_A, '1-1');
ok(d.code === 'v3\n', '当前内容是最新一版');
ok(d.history.length === 2 && d.history[0].code === 'print(1)\n' && d.history[1].code === 'v2\n', '历史按旧→新保存前两版');
for (let i = 0; i < 12; i++) D.writeDraft(NS_A, '1-1', 'x' + i + '\n');
d = D.readDraft(NS_A, '1-1');
ok(d.history.length === D.DRAFT_HISTORY_MAX, '历史长度受上限 ' + D.DRAFT_HISTORY_MAX + ' 限制');
ok(d.history[d.history.length - 1].code === 'x10\n', '历史上限后保留最近的旧版');

console.log('=== 5. 通关代码只记录真实通过 ===');
D.writeDraft(NS_A, '1-3', 'bad\n');
r = D.writeDraft(NS_A, '1-3', 'good\n', { passed: true });
ok(r.ok && D.readDraft(NS_A, '1-3').passedCode === 'good\n', 'passed=true 时记录通关代码');
D.writeDraft(NS_A, '1-3', 'working\n');
ok(D.readDraft(NS_A, '1-3').passedCode === 'good\n', '继续修改不会覆盖已记录的通关代码');
D.writeDraft(NS_B, '1-3', 'bad\n');
ok(D.readDraft(NS_B, '1-3').passedCode === undefined, '未通过判题的草稿没有通关代码');

console.log('=== 6. 清除 ===');
ok(D.clearDraft(NS_A, '1-2') === true && D.readDraft(NS_A, '1-2') === null, '清除单关草稿');
const removed = D.clearAllDrafts(NS_B);
ok(removed === 2 && D.readDraft(NS_B, '1-1') === null && D.readDraft(NS_B, '1-3') === null, '按存档清空（保留其它存档）');
ok(D.readDraft(NS_A, '1-1') !== null, '清空 B 不影响 A');
ok(D.clearAllDrafts() === 2, '清空全部草稿');
ok(D.readDraft(NS_A, '1-1') === null && D.readDraft(NS_A, '1-3') === null, '全部清空后为空');

console.log('=== 7. 损坏数据不静默丢弃 ===');
fake.setItem(D.draftKey(NS_A, '1-9'), '{ this is not json');
const before = fake.keys().length;
const bad = D.readDraft(NS_A, '1-9');
const backups = fake.keys().filter(k => k.startsWith(D.DRAFT_BACKUP_PREFIX));
ok(bad === null, '损坏草稿读取为 null');
ok(backups.length === 1, '损坏内容已写入备份 key');
ok(fake.getItem(backups[0]) === '{ this is not json', '备份保留原始文本');
ok(fake.keys().length === before + 1, '损坏时不删除原 key，仅额外备份');
fake.removeItem(D.draftKey(NS_A, '1-9'));

console.log('=== 8. 写入失败必须显式返回 ===');
fake.failKeys.add(D.draftKey(NS_A, '1-4'));
r = D.writeDraft(NS_A, '1-4', 'print(4)\n');
ok(r.ok === false, '写入失败返回 ok=false');
ok(typeof r.reason === 'string' && r.reason.length > 0, '失败带可展示原因');
ok(!!r.entry && r.entry.code === 'print(4)\n', '失败时仍返回内存中的草稿（不丢代码）');
ok(r.backedUp === true, '主 key 失败时成功转存备份');
fake.failKeys.clear();

fake.setItem(D.draftKey(NS_A, '1-5'), 'x');
fake.quota = 10;
r = D.writeDraft(NS_A, '1-5', 'print(5)\n'.repeat(4));
ok(r.ok === false && r.backedUp !== true, '配额超限且备份也失败时如实返回（backedUp=false）');
fake.quota = Infinity;
fake.removeItem(D.draftKey(NS_A, '1-5'));

console.log('=== 9. 自动保存判定（含切关时渲染未同步） ===');
const g = (o) => D.shouldAutosaveDraft({ code: '', pending: '', touched: false, hasDraft: false, lastSaved: '', ...o });
ok(g({ code: 'a', pending: 'a', touched: true, hasDraft: false, lastSaved: '' }) === true, '用户改动后应保存');
ok(g({ code: 'a', pending: 'a', touched: true, hasDraft: true, lastSaved: 'a' }) === false, '内容与已保存一致时不重复保存');
ok(g({ code: 'a', pending: 'a', touched: false, hasDraft: false, lastSaved: '' }) === false, '只有初始代码时不创建草稿');
ok(g({ code: 'draft', pending: 'draft', touched: false, hasDraft: true, lastSaved: 'draft' }) === false, '刚恢复的草稿不触发写盘');
ok(g({ code: 'INIT', pending: 'draft', touched: false, hasDraft: true, lastSaved: 'draft' }) === false, '切关首帧（code 仍是旧值）不覆盖草稿');
ok(g({ code: 'INIT', pending: 'draft', touched: true, hasDraft: true, lastSaved: 'draft' }) === false, '渲染未同步时即使 touched 也不写盘');

console.log('=== 10. 防抖落盘器（真实计时器） ===');
let got = [];
const saver = D.createDebouncedFlush((v) => got.push(v), 120);
saver.schedule('a');
await sleep(50);
saver.schedule('ab');
await sleep(50);
saver.schedule('abc');
ok(saver.pending() === true, '未到时限时仍待写');
await sleep(180);
ok(JSON.stringify(got) === JSON.stringify(['abc']), '多次输入只落盘最后一次', JSON.stringify(got));
saver.schedule('flush-me');
saver.flush();
ok(got[got.length - 1] === 'flush-me', 'flush 立即写入待写值');
saver.schedule('cancel-me');
saver.cancel();
await sleep(180);
ok(!got.includes('cancel-me') && saver.pending() === false, 'cancel 丢弃待写值');
ok(D.DRAFT_DEBOUNCE_MS === 500, '默认防抖间隔为 500ms');

console.log('=== 11. 时间显示 ===');
ok(D.formatDraftClock(null) === '', '空时间返回空串');
const t = new Date(2026, 0, 2, 9, 5, 0).getTime();
ok(D.formatDraftClock(t) === '09:05', '时间格式化为 HH:MM');

console.log('\n=== 结果 ===');
console.log('通过 ' + pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);
