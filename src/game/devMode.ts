// DEV 工具开关：生产构建中 process.env.NODE_ENV 被替换为 'production'，
// 任何 URL 参数都无法打开；dev 环境仍需显式开启（localStorage 或 ?dev）。

export function isDevBuild(): boolean {
  try {
    // 构建工具会把整段 process.env.NODE_ENV 静态替换为 "production" / "development"
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}

export function devToolsOn(): boolean {
  if (!isDevBuild()) return false;
  try {
    if (localStorage.getItem('nexus_dev_tools') === '1') return true;
    return new URLSearchParams(window.location.search).has('dev');
  } catch {
    return false;
  }
}
