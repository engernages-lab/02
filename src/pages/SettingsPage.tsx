import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store/gameStore';
import { play } from '../services/sound';
import { DEFAULT_VOICE, normalizeVoice, ROLE_PROFILES, speech, type VoiceRole } from '../services/voice';
import { SAVE_VERSION } from '../services/save';

export default function SettingsPage() {
  const g = useGame();
  const s = g.player.settings;
  const [confirmReset, setConfirmReset] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const doExport = () => {
    const text = g.exportSaveString();
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus-save-v1.json';
    a.click();
    URL.revokeObjectURL(url);
    setSaveMsg('存档已导出（nexus-save-v1.json）。');
    play('click');
  };

  const doImport = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    const r = g.importSaveData(text);
    setSaveMsg(r.ok ? '存档导入成功。' : '导入失败：' + (r.reason || ''));
    if (r.ok) play('success'); else play('deny');
  };

  // ---------- 语音设置（独立于音乐/音效音量） ----------
  const voice = normalizeVoice(s.voice);
  const [voiceList, setVoiceList] = useState<{ name: string; lang: string; local: boolean }[]>([]);
  const [testMsg, setTestMsg] = useState('');
  useEffect(() => {
    const load = () => setVoiceList(speech.voiceOptions());
    load();
    const t = window.setTimeout(load, 900); // 部分浏览器音色异步就绪
    return () => window.clearTimeout(t);
  }, []);
  const patchVoice = (patch: Partial<typeof voice>) => {
    g.patchSettings({ voice: { ...voice, ...patch } });
    speech.applySettings({ ...voice, ...patch });
  };
  const testVoice = (role: VoiceRole) => {
    speech.applySettings(voice);
    const ok = speech.speak('意识同步程序启动。这是 ' + ROLE_PROFILES[role].label + ' 的语音测试。', role);
    setTestMsg(ok ? '正在播放测试语音（' + ROLE_PROFILES[role].label + '）' : (speech.supported ? '播放失败：可能浏览器限制，请先点击页面任意处再试。' : '当前浏览器不支持语音合成。'));
  };

  const doFullscreen = () => { g.patchSettings({ fullscreen: !s.fullscreen }); play('click'); };
  const doWipe = () => { g.wipeSave(); g.toast('info', '存档已清空，数据已重置。'); play('rebirth'); };

  return (
    <div className="page page-anim">
      <div className="page-inner" style={{ maxWidth: 900 }}>
        <div className="hud">
          <div>
            <div className="hud-title">系统配置</div>
            <div className="hud-sub">音效 / 动画 / 存档</div>
          </div>
          <div className="hud-spacer" />
          <button className="nxbtn small ghost" onClick={() => { play('click'); g.nav('menu'); }}>◀ 返回</button>
        </div>

        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panel-title">音频</div>
          <div className="set-row">
            <span className="set-label">音乐音量<span className="set-desc">NEXUS 氛围合成音乐（Web Audio 实时生成，无音频文件）</span></span>
            <input type="range" className="nx-range" min={0} max={100} value={Math.round(s.musicVolume * 100)}
              onChange={e => g.patchSettings({ musicVolume: Number(e.target.value) / 100 })} />
            <span className="mono dim" style={{ width: 40, textAlign: 'right' }}>{Math.round(s.musicVolume * 100)}%</span>
          </div>
          <div className="set-row">
            <span className="set-label">音效音量<span className="set-desc">操作、判题、警报等合成音效</span></span>
            <input type="range" className="nx-range" min={0} max={100} value={Math.round(s.sfxVolume * 100)}
              onChange={e => g.patchSettings({ sfxVolume: Number(e.target.value) / 100 })} />
            <span className="mono dim" style={{ width: 40, textAlign: 'right' }}>{Math.round(s.sfxVolume * 100)}%</span>
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panel-title">画面</div>
          <div className="set-row">
            <span className="set-label">启用动画<span className="set-desc">粒子、打字机、故障特效等（关闭可提升低配设备流畅度）</span></span>
            <label className="toggle"><input type="checkbox" checked={s.animations} onChange={e => g.patchSettings({ animations: e.target.checked })} /><span className="tk" /></label>
          </div>
          <div className="set-row">
            <span className="set-label">动画强度<span className="set-desc">粒子数量与特效密度</span></span>
            <input type="range" className="nx-range" min={0} max={1} step={1} value={s.animLevel === 'high' ? 1 : 0}
              onChange={e => g.patchSettings({ animLevel: Number(e.target.value) === 1 ? 'high' : 'low' })} />
            <span className="mono dim" style={{ width: 60, textAlign: 'right' }}>{s.animLevel === 'high' ? '高' : '低'}</span>
          </div>
          <div className="set-row">
            <span className="set-label">打字机速度<span className="set-desc">剧情文本逐字显示的速度</span></span>
            <input type="range" className="nx-range" min={4} max={60} value={s.typewriterMs}
              onChange={e => g.patchSettings({ typewriterMs: Number(e.target.value) })} />
            <span className="mono dim" style={{ width: 60, textAlign: 'right' }}>{s.typewriterMs}ms/字</span>
          </div>
          <div className="set-row">
            <span className="set-label">全屏模式<span className="set-desc">以全屏运行游戏（浏览器允许时）</span></span>
            <label className="toggle"><input type="checkbox" checked={s.fullscreen} onChange={doFullscreen} /><span className="tk" /></label>
          </div>
          <div className="set-row">
            <span className="set-label">游戏语言<span className="set-desc">界面语言（当前为简体中文）</span></span>
            <span className="chip dim">简体中文（更多语言预留）</span>
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panel-title">语音设置<span className="panel-tag">{speech.supported ? 'Web Speech API' : '当前浏览器不支持'}</span></div>
          {!speech.supported && (
            <div className="result-banner fail" style={{ marginBottom: 10 }}>
              当前浏览器不支持语音合成，剧情与提示文字不受影响，可正常游玩。
            </div>
          )}
          <div className="set-row">
            <span className="set-label">语音总开关<span className="set-desc">关闭后所有角色语音静音（不影响背景音乐与音效）</span></span>
            <label className="toggle">
              <input type="checkbox" checked={voice.enabled} onChange={e => patchVoice({ enabled: e.target.checked })} />
              <span className="tk" />
            </label>
          </div>
          <div className="set-row">
            <span className="set-label">对话自动朗读<span className="set-desc">文字显示完整后自动播放该句语音</span></span>
            <label className="toggle">
              <input type="checkbox" checked={voice.autoRead} onChange={e => patchVoice({ autoRead: e.target.checked })} />
              <span className="tk" />
            </label>
          </div>
          <div className="set-row">
            <span className="set-label">语音语速<span className="set-desc">仅影响语音朗读速度</span></span>
            <input type="range" className="nx-range" min={50} max={200} value={Math.round(voice.rate * 100)}
              onChange={e => patchVoice({ rate: Number(e.target.value) / 100 })} />
            <span className="mono dim" style={{ width: 46, textAlign: 'right' }}>{voice.rate.toFixed(2)}×</span>
          </div>
          <div className="set-row">
            <span className="set-label">语音音调<span className="set-desc">角色基础音调，各角色另有独立偏移</span></span>
            <input type="range" className="nx-range" min={0} max={200} value={Math.round(voice.pitch * 100)}
              onChange={e => patchVoice({ pitch: Number(e.target.value) / 100 })} />
            <span className="mono dim" style={{ width: 46, textAlign: 'right' }}>{voice.pitch.toFixed(2)}</span>
          </div>
          <div className="set-row">
            <span className="set-label">语音音量<span className="set-desc">与音乐音量、音效音量相互独立</span></span>
            <input type="range" className="nx-range" min={0} max={100} value={Math.round(voice.volume * 100)}
              onChange={e => patchVoice({ volume: Number(e.target.value) / 100 })} />
            <span className="mono dim" style={{ width: 46, textAlign: 'right' }}>{Math.round(voice.volume * 100)}%</span>
          </div>
          <div className="set-row">
            <span className="set-label">角色音色<span className="set-desc">为每个角色指定系统音色（留空 = 自动匹配中文音色）</span></span>
            <span className="chip dim">{voiceList.length} 个可用音色</span>
          </div>
          {(Object.keys(ROLE_PROFILES) as VoiceRole[]).map(role => (
            <div className="set-row" key={role}>
              <span className="set-label" style={{ paddingLeft: 10 }}>
                {ROLE_PROFILES[role].label}
                <span className="set-desc">{ROLE_PROFILES[role].desc}</span>
              </span>
              <select
                className="nx-select"
                value={voice.roleVoices[role] || ''}
                onChange={e => patchVoice({ roleVoices: { ...voice.roleVoices, [role]: e.target.value } })}
              >
                <option value="">自动（中文优先）</option>
                {voiceList.map(v => (
                  <option key={v.name} value={v.name}>{v.name} · {v.lang}{v.local ? '' : ' · 云端'}</option>
                ))}
              </select>
              <button className="nxbtn small ghost" onClick={() => testVoice(role)}>试听</button>
            </div>
          ))}
          <div className="set-row">
            <span className="set-label">播放控制</span>
            <button className="nxbtn small ghost" onClick={() => { speech.stop(); setTestMsg('已停止所有语音。'); }}>停止所有语音</button>
            <span className="mono dim" style={{ fontSize: 12 }}>{testMsg}</span>
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 14 }}>
          <div className="panel-title">存档管理</div>
          <div className="set-row">
            <span className="set-label">导出存档<span className="set-desc">下载包含全部进度的 JSON 文件</span></span>
            <button className="nxbtn small" onClick={doExport}>导出 JSON</button>
          </div>
          <div className="set-row">
            <span className="set-label">导入存档<span className="set-desc">从 JSON 文件恢复进度（将覆盖当前进度）</span></span>
            <button className="nxbtn small" onClick={() => fileRef.current?.click()}>选择文件导入</button>
            <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }}
              onChange={e => { void doImport(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
          <div className="set-row">
            <span className="set-label">重置游戏进度<span className="set-desc" style={{ color: '#E2939A' }}>清空存档并恢复初始状态，不可撤销</span></span>
            {!confirmReset ? (
              <button className="nxbtn small danger" onClick={() => setConfirmReset(true)}>重置进度</button>
            ) : (
              <button className="nxbtn small danger" onClick={() => { setConfirmReset(false); doWipe(); }}>再次点击确认清空</button>
            )}
          </div>
          {saveMsg && <div className="dim" style={{ marginTop: 10, fontSize: 13 }}>{saveMsg}</div>}
        </div>

        <div className="dim" style={{ fontSize: 12, textAlign: 'center' }}>
          存档自动保存至浏览器 localStorage（nexus_code_repair_save_v1）· 数据版本 v{SAVE_VERSION}，旧版本存档会在读取时自动迁移
        </div>
      </div>
    </div>
  );
}
