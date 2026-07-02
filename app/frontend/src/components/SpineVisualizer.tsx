import React from 'react';
import { Activity } from 'lucide-react';

interface SpineVisualizerProps {
  targetAngles: number[];
  currentAngles: number[];
}

const MODULES = [
  { index: 0, label: "Upper-Left (UL)", ch: 0 },
  { index: 1, label: "Upper-Right (UR)", ch: 1 },
  { index: 2, label: "Mid-Left (ML)", ch: 2 },
  { index: 3, label: "Mid-Right (MR)", ch: 3 },
  { index: 4, label: "Lower-Left (LL)", ch: 4 },
  { index: 5, label: "Lower-Right (LR)", ch: 5 }
];

export const SpineVisualizer: React.FC<SpineVisualizerProps> = ({
  targetAngles,
  currentAngles
}) => {
  return (
    <div className="glass-panel glass-panel-glow">
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
        <Activity size={18} style={{ color: 'var(--accent-cyan)' }} />
        Mechanical Spine Grid Actuators
      </h3>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '12px', 
        position: 'relative' 
      }}>
        {/* Visual spine vertical line overlay in center */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '10px',
          bottom: '10px',
          width: '2px',
          background: 'var(--text-dim)',
          transform: 'translateX(-50%)',
          zIndex: 1,
          opacity: 0.3
        }} />

        {MODULES.map((m) => {
          const target = targetAngles[m.index] ?? 0;
          const current = currentAngles[m.index] ?? 0;
          
          // Max safe angle is 55 degrees in V2
          const pct = Math.round((target / 55) * 100);
          const active = target > 0;
          const activeColor = m.index >= 4 ? 'var(--accent-violet)' : 'var(--accent-cyan)';

          return (
            <div 
              key={m.index} 
              className={`spine-vertebra ${active ? 'active' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: '14px',
                background: active ? 'var(--bg-card-hover)' : 'var(--bg-dark)',
                border: active ? `1px solid ${activeColor}` : '1px solid var(--color-border)',
                boxShadow: active ? 'var(--btn-shadow-pressed)' : 'var(--btn-shadow)',
                transition: 'all 0.3s ease',
                zIndex: 2,
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{m.label}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  Trg: {target}° | Act: {current}°
                </span>
              </div>
              <div 
                className="vertebra-bar"
                style={{
                  height: '8px',
                  width: '100%',
                  borderRadius: '4px',
                  background: 'var(--bg-dark)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.8)'
                }}
              >
                <div 
                  className="vertebra-fill"
                  style={{
                    height: '100%',
                    background: activeColor,
                    width: `${Math.min(100, Math.max(0, pct))}%`,
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
