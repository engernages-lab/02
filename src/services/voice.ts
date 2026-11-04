// NEXUS 语音服务：Web Speech API 单例，统一管理播放队列、角色音色与停止逻辑。
// 不依赖任何外部 API，音量与背景音乐/音效完全分离。

export type VoiceRole = 'mira' | 'system' | 'echo' | 'narrator' | 'r07' | 'engel';

export interface VoiceSettings {
  enabled: boolean;                       // 语音总开关
  autoRead: boolean;                      // 对话出现后自动朗读
  rate: number;                           // 0.5 ~ 2
  pitch: number;                          // 0 ~ 2
  volume: number;                         // 0 ~ 1（独立于音乐/音效）
  lang: string;                           // 'zh-CN' 优先
  roleVoices: Record<string, string>;     // role -> 具体音色 name（空=自动）
}

export const DEFAULT_VOICE: VoiceSettings = {
  enabled: true,
  autoRead: false,
  rate: 1,
  pitch: 1,
  volume: 0.9,
  lang: 'zh-CN',
  roleVoices: {},
};

export function normalizeVoice(raw: unknown): VoiceSettings {
  const d = { ...DEFAULT_VOICE };
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<VoiceSettings>;
  return {
    enabled: typeof r.enabled === 'boolean' ? r.enabled : d.enabled,
    autoRead: typeof r.autoRead === 'boolean' ? r.autoRead : d.autoRead,
    rate: typeof r.rate === 'number' ? Math.min(2, Math.max(0.5, r.rate)) : d.rate,
    pitch: typeof r.pitch === 'number' ? Math.min(2, Math.max(0, r.pitch)) : d.pitch,
    volume: typeof r.volume === 'number' ? Math.min(1, Math.max(0, r.volume)) : d.volume,
    lang: typeof r.lang === 'string' && r.lang ? r.lang : d.lang,
    roleVoices: r.roleVoices && typeof r.roleVoices === 'object' ? { ...r.roleVoices } : {},
  };
}

/** 角色语音画像：同一音色下用语速/音调区分性格 */
export const ROLE_PROFILES: Record<VoiceRole, { label: string; rate: number; pitch: number; desc: string }> = {
  mira:     { label: 'MIRA',      rate: 0.98, pitch: 1.18, desc: '温柔、理性、略高音' },
  system:   { label: 'NEXUS 系统', rate: 1.02, pitch: 0.82, desc: '机械、冷静、偏低音' },
  echo:     { label: 'ECHO',      rate: 0.88, pitch: 0.62, desc: '低沉、压迫、缓慢' },
  narrator: { label: '旁白',      rate: 0.95, pitch: 1.00, desc: '平稳、自然' },
  r07:      { label: 'R-07',      rate: 1.00, pitch: 1.06, desc: '玩家本人' },
  engel:    { label: 'E.S. 记录', rate: 0.92, pitch: 0.94, desc: '沉稳、怀旧' },
};

export type VoiceState = 'idle' | 'speaking' | 'paused';

interface SpeechCtor {
  speak(u: SpeechSynthesisUtterance): void;
  cancel(): void;
  pause(): void;
  resume(): void;
  getVoices(): SpeechSynthesisVoice[];
  speaking: boolean;
  paused: boolean;
}

class SpeechService {
  private synth: SpeechCtor | null = null;
  private settings: VoiceSettings = { ...DEFAULT_VOICE };
  private current: SpeechSynthesisUtterance | null = null;
  private state: VoiceState = 'idle';
  private listeners = new Set<(s: VoiceState, role?: VoiceRole) => void>();
  private currentRole: VoiceRole | undefined;
  private voicesCache: SpeechSynthesisVoice[] = [];
  private voicesBound = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis as unknown as SpeechCtor;
      // Chrome 的音色列表是异步加载的
      this.voicesCache = this.synth.getVoices() || [];
      if (typeof window.speechSynthesis.addEventListener === 'function') {
        window.speechSynthesis.addEventListener('voiceschanged', () => {
          this.voicesCache = this.synth?.getVoices() || [];
        });
      }
      this.voicesBound = true;
    }
  }

  get supported(): boolean { return !!this.synth; }
  get isSpeaking(): boolean { return this.state === 'speaking'; }
  get paused(): boolean { return this.state === 'paused'; }
  get bound(): boolean { return this.voicesBound; }

  applySettings(s: VoiceSettings): void {
    this.settings = { ...s };
  }

  voices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    const v = this.synth.getVoices() || [];
    if (v.length) this.voicesCache = v;
    return this.voicesCache;
  }

  /** 中文优先的音色列表（含语言标注） */
  voiceOptions(): { name: string; lang: string; local: boolean }[] {
    return this.voices()
      .map(v => ({ name: v.name, lang: v.lang, local: !!v.localService }))
      .sort((a, b) => {
        const sa = a.lang.startsWith('zh') ? 0 : 1;
        const sb = b.lang.startsWith('zh') ? 0 : 1;
        if (sa !== sb) return sa - sb;
        return a.name.localeCompare(b.name);
      });
  }

  onState(cb: (s: VoiceState, role?: VoiceRole) => void): () => void {
    this.listeners.add(cb);
    cb(this.state, this.currentRole);
    return () => this.listeners.delete(cb);
  }

  private emit() {
    this.listeners.forEach(f => f(this.state, this.currentRole));
  }

  private pickVoice(role: VoiceRole): SpeechSynthesisVoice | null {
    const list = this.voices();
    if (!list.length) return null;
    const explicit = this.settings.roleVoices[role];
    if (explicit) {
      const hit = list.find(v => v.name === explicit);
      if (hit) return hit;
    }
    const zh = list.filter(v => v.lang && v.lang.toLowerCase().startsWith('zh'));
    const pool = zh.length ? zh : list;
    // 角色—性别启发式匹配（不同系统音色命名差异大，做多关键词尝试）
    const wantFemale = role === 'mira' || role === 'r07';
    const femaleKeys = ['xiaoxiao', 'xiaoyi', 'female', '女', 'huihui', 'yaoyao', 'tingting', 'meijia', 'samantha', 'zira'];
    const maleKeys = ['yunxi', 'yunyang', 'male', '男', 'kangkang', 'liang', 'david', 'mark'];
    const keys = wantFemale ? femaleKeys : maleKeys;
    const matched = pool.find(v => keys.some(k => v.name.toLowerCase().includes(k)));
    if (matched) return matched;
    // 退化为按角色索引取一个，保证不同角色尽量不同音色
    const order: VoiceRole[] = ['mira', 'system', 'echo', 'narrator', 'r07', 'engel'];
    const idx = Math.max(0, order.indexOf(role));
    return pool[idx % pool.length] || pool[0];
  }

  /** 播放一段语音（会先取消上一段，禁止叠加） */
  speak(text: string, role: VoiceRole = 'narrator'): boolean {
    if (!this.synth) return false;
    if (!this.settings.enabled) return false;
    const clean = String(text || '').replace(/^[「『]|[」』]$/g, '').trim();
    if (!clean) return false;

    this.cancelInternal();
    const u = new SpeechSynthesisUtterance(clean);
    const voice = this.pickVoice(role);
    if (voice) u.voice = voice;
    u.lang = this.settings.lang || (voice && voice.lang) || 'zh-CN';
    const profile = ROLE_PROFILES[role] || ROLE_PROFILES.narrator;
    u.rate = Math.min(2, Math.max(0.5, this.settings.rate * profile.rate));
    u.pitch = Math.min(2, Math.max(0, this.settings.pitch * profile.pitch));
    u.volume = Math.min(1, Math.max(0, this.settings.volume));

    u.onstart = () => { this.state = 'speaking'; this.currentRole = role; this.emit(); };
    u.onend = () => { if (this.current === u) { this.state = 'idle'; this.current = null; this.currentRole = undefined; this.emit(); } };
    u.onerror = () => { if (this.current === u) { this.state = 'idle'; this.current = null; this.currentRole = undefined; this.emit(); } };

    this.current = u;
    try {
      this.synth.speak(u);
    } catch {
      this.state = 'idle';
      this.current = null;
      this.emit();
      return false;
    }
    return true;
  }

  private cancelInternal() {
    if (!this.synth) return;
    try { this.synth.cancel(); } catch { /* ignore */ }
    this.current = null;
    if (this.state !== 'idle') { this.state = 'idle'; }
  }

  /** 停止（切换对话/离开页面时调用） */
  stop(): void {
    if (!this.synth) return;
    this.cancelInternal();
    this.currentRole = undefined;
    this.emit();
  }

  pause(): void {
    if (!this.synth || this.state !== 'speaking') return;
    try { this.synth.pause(); this.state = 'paused'; this.emit(); } catch { /* ignore */ }
  }

  resume(): void {
    if (!this.synth || this.state !== 'paused') return;
    try { this.synth.resume(); this.state = 'speaking'; this.emit(); } catch { /* ignore */ }
  }

  /** 角色对应的 speaker kind 映射 */
  static roleFromKind(kind: string | undefined): VoiceRole {
    switch (kind) {
      case 'mira': return 'mira';
      case 'system': return 'system';
      case 'echo': return 'echo';
      case 'r07': return 'r07';
      case 'engel': return 'engel';
      default: return 'narrator';
    }
  }
}

export const speech = new SpeechService();

/** 便捷方法：按 speaker kind 朗读 */
export function speakLine(text: string, kind?: string): boolean {
  return speech.speak(text, SpeechService.roleFromKind(kind));
}
