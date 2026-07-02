import React from 'react';
import { Activity } from 'lucide-react';

interface SpineVisualizerProps {
  targetAngles: number[];
  currentAngles: number[];
  labels?: string[];
}

const DEFAULT_LABELS = [
  "Upper Thoracic",
  "Lower Thoracic",
  "Mid Lumbar Upper",
  "Mid Lumbar Lower",
  "Lower Lumbar",
  "Pelvis"
];

export const SpineVisualizer: React.FC<SpineVisualizerProps> = ({
  targetAngles,
  currentAngles,
  labels = DEFAULT_LABELS
}) => {
  return (
    <div className="glass-panel glass-panel-glow">
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={18} style={{ color: 'var(--accent-cyan)' }} />
        Mechanical Spine Actuators
      </h3>

      <div className="spine-container" style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
        {labels.map((name, i) => {
          const target = targetAngles[i] ?? 0;
          const current = currentAngles[i] ?? 0;
          
          // Max angle is 70 degrees per Section 3.2
          const pct = Math.round((target / 70) * 100);
          const active = target > 0;

          return (
            <div 
              key={i} 
              className={`spine-vertebra ${active ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                background: active ? 'rgba(79, 140, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: active ? '1px solid var(--accent-cyan)' : '1px solid var(--color-border)',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{name}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  Target: {target}° | Actual: {current}°
                </span>
              </div>
              <div 
                className="vertebra-bar"
                style={{
                  height: '6px',
                  width: '80px',
                  borderRadius: '3px',
                  background: 'rgba(255,255,255,0.1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div 
                  className="vertebra-fill"
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-violet))',
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
