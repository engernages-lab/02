import { useRef, useState } from 'react';
import { useGame } from '../store/gameStore';
import { play } from '../services/sound';

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
          存档自动保存至浏览器 localStorage（nexus_code_repair_save_v1）· 数据版本 v1，未来升级自动迁移
        </div>
      </div>
    </div>
  );
}
