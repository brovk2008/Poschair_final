import React from 'react';
import { Sliders, Briefcase, Gamepad2, BookOpen, Coffee } from 'lucide-react';
import { Mode } from '../decisionEngine';

interface ModeSelectorProps {
  currentMode: Mode;
  onChange: (m: Mode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onChange }) => {
  const modesList: { id: Mode; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'office', label: 'Office', desc: 'Standard support (1.0x)', icon: <Briefcase size={16} /> },
    { id: 'gaming', label: 'Gaming', desc: 'Active support (1.2x)', icon: <Gamepad2 size={16} /> },
    { id: 'study', label: 'Study', desc: 'Steady support (0.9x)', icon: <BookOpen size={16} /> },
    { id: 'relax', label: 'Relax', desc: 'Mild support (0.5x)', icon: <Coffee size={16} /> }
  ];

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
        <Sliders size={18} style={{ color: 'var(--accent-cyan)' }} />
        Active Correction Presets
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {modesList.map((m) => {
          const active = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              className="btn"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                padding: '14px',
                borderRadius: '14px',
                background: active ? 'var(--accent-blue-dark)' : 'var(--bg-dark)',
                border: active ? '1px solid rgba(255,255,255,0.05)' : '1px solid var(--color-border)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: active ? 'var(--btn-shadow-pressed)' : 'var(--btn-shadow)',
                transition: 'all 0.2s ease',
                height: 'auto'
              }}
            >
              <div style={{ color: active ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
                {m.icon}
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 'bold' }}>{m.label}</span>
                <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.2' }}>
                  {m.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
