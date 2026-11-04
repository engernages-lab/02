// 奖励系统 + 语音模块的逻辑验证（node 环境，无浏览器）
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const ts = createRequire(join(root, 'package.json'))('typescript');

function loadTS(file) {
  const src = readFileSync(file, 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', out)(mod.exports, mod, () => { throw new Error('no require'); });
  return mod.exports;
}

let pass = 0, total = 0;
const check = (cond, label, extra = '') => {
  total++;
  if (cond) { pass++; console.log('PASS | ' + label); }
  else console.log('FAIL | ' + label + (extra ? ' => ' + extra : ''));
};

const R = loadTS(join(root, 'src/game/rewards.ts'));

// ---- 评级边界 ----
check(R.gradeOf(0, 0) === 'S', '评级：0 失误 0 提示 = S');
check(R.gradeOf(1, 0) === 'A', '评级：1 失误 = A');
check(R.gradeOf(0, 1) === 'A', '评级：用 1 次提示 = A');
check(R.gradeOf(2, 0) === 'B', '评级：2 失误 = B');
check(R.gradeOf(3, 3) === 'B', '评级：3 失误 3 提示 = B');
check(R.gradeOf(4, 0) === 'C', '评级：4 失误 = C');
check(R.gradeOf(0, 5) === 'C', '评级：5 次提示 = C');

// ---- 奖励计算 ----
const s = R.computeLevelReward(100, 0, 0, true);
const c = R.computeLevelReward(100, 5, 5, false);
check(s.total > c.total, '奖励：S 首通多于 C 重复（' + s.total + ' > ' + c.total + '）');
check(s.firstClear === 30 && c.firstClear === 0, '奖励：首通奖励只发放一次');
check(s.trustGain > 0 && c.trustGain > 0, '奖励：信任度始终正向');
check(R.computeLevelReward(40, 0, 0, false).total >= 15, '奖励：基础值下限 15（慢玩家不被惩罚）');

// ---- 状态归一化（旧存档兼容） ----
const n1 = R.normalizeRewards(undefined);
check(n1.credits === 0 && n1.trust === 10 && Array.isArray(n1.skins), '迁移：空数据得到默认奖励状态');
const n2 = R.normalizeRewards({ credits: 120, trust: 33, items: { scan: 2 }, cleared: { '1-1': { grade: 'S', fails: 0, hints: 0, credits: 70, trust: 3 } } });
check(n2.credits === 120 && n2.trust === 33 && n2.items.scan === 2, '迁移：已存在字段被保留');
check(Array.isArray(n2.chapterRewards) && Array.isArray(n2.archiveRead), '迁移：缺失字段补齐');
const n3 = R.normalizeRewards({ trust: 999, credits: -5 });
check(n3.trust === 100 && n3.credits === 0, '迁移：越界数值被夹紧');

// ---- 章节奖励唯一性 ----
check(R.CHAPTER_REWARDS.length === 6, '章节奖励：6 章各一份');
check(new Set(R.CHAPTER_REWARDS.map(c => c.id)).size === 6, '章节奖励：id 唯一');
check(R.chapterRewardOf(3).fragment === 'f8', '章节奖励：第三章掉落记忆碎片');

// ---- 商城 ----
check(R.SHOP_ITEMS.length >= 12, '商城：商品数量 ' + R.SHOP_ITEMS.length);
check(R.SHOP_ITEMS.every(i => i.price > 0), '商城：价格均有效');
check(R.SHOP_ITEMS.filter(i => i.unique).every(i => !!i.slot || !!i.flag), '商城：一次性商品可装备或标记');
check(R.shopItemById('scan').count === 1, '商城：道具带库存数量');

// ---- 档案解锁 ----
check(R.unlockedArchives(0).length === 0, '档案：0 碎片无解锁');
check(R.unlockedArchives(2).length === 1, '档案：2 碎片解锁 1 份');
check(R.unlockedArchives(99).length === R.MEMORY_ARCHIVES.length, '档案：碎片足够时全部解锁');

// ---- 信任度阶段 ----
check(R.trustTier(0).name === '陌生' && R.trustTier(100).name === '共生', '信任度：阶段映射正确');

// ---- 语音模块（node 无 speechSynthesis，应安全降级） ----
const V = loadTS(join(root, 'src/services/voice.ts'));
check(V.DEFAULT_VOICE.enabled === true && V.DEFAULT_VOICE.autoRead === false, '语音：默认开启但默认不自动朗读');
check(V.normalizeVoice({ rate: 99 }).rate === 2, '语音：语速越界被夹紧');
check(V.normalizeVoice(null).volume === 0.9, '语音：空设置得到默认值');
check(V.speech.supported === false, '语音：无 speechSynthesis 环境安全降级（supported=false）');
check(V.speech.speak('测试', 'mira') === false, '语音：不支持时 speak 返回 false 而不抛错');
check(typeof V.ROLE_PROFILES.mira.pitch === 'number' && V.ROLE_PROFILES.mira.pitch !== V.ROLE_PROFILES.echo.pitch, '语音：角色音调互不相同');
check(V.speech.voiceOptions().length === 0, '语音：无音色时返回空列表');
V.speech.stop();
V.speech.pause();
V.speech.resume();
check(true, '语音：stop/pause/resume 在不支持环境下不崩溃');

console.log('=== 奖励/语音模块：' + pass + '/' + total + ' ===');
process.exit(pass === total ? 0 : 1);
