import React from 'react';

export default function ModuleLoading({ label = 'NEXUS' }: { label?: string }) {
  return (
    <div className="nx-module-loading" role="status" aria-live="polite" aria-label={'正在加载 ' + label + ' 模块'}>
      <div className="nx-module-grid" aria-hidden="true" />
      <div className="nx-module-card">
        <div className="nx-module-brand">NEXUS · MODULE INITIALIZING</div>
        <div className="nx-module-title">{label === 'NEXUS' ? '正在加载模块…' : '正在加载' + label + '模块…'}</div>
        <div className="nx-module-track" aria-hidden="true"><i /></div>
        <div className="nx-module-sub">正在同步真实存档与系统数据流</div>
      </div>
    </div>
  );
}
