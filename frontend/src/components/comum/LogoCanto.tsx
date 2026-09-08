import React from 'react';
import { CORES } from '../../theme/cores';
import logo from '../../assets/logo.png';

export function LogoCanto() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px 6px 6px',
        borderRadius: 999,
        backgroundColor: `${CORES.verdeGarrafaProfundo}cc`,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
        userSelect: 'none',
      }}
    >
      <img
        src={logo}
        alt="DangerMap"
        style={{ height: 26, width: 'auto', display: 'block' }}
      />
      <span
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 11,
          fontWeight: 600,
          color: CORES.eggshell,
          letterSpacing: 0.2,
        }}
      >
        DangerMap
      </span>
    </div>
  );
}
