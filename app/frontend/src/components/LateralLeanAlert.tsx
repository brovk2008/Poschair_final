import React from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import { PostureData, isLateralLean, lateralLeanDirection } from '../postureAnalyzer';

interface LateralLeanAlertProps {
  posture: PostureData | null;
}

export const LateralLeanAlert: React.FC<LateralLeanAlertProps> = ({ posture }) => {
  if (!posture || !isLateralLean(posture)) return null;

  const direction = lateralLeanDirection(posture);
  
  return (
    <div 
      style={{ 
        background: 'rgba(249, 115, 22, 0.12)', 
        border: '1.5px solid hsl(32, 95%, 55%)', 
        borderRadius: '12px', 
        padding: '14px 20px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '14px',
        color: 'hsl(32, 95%, 55%)',
        animation: 'pulse 2s infinite'
      }}
    >
      <div style={{ background: 'rgba(249, 115, 22, 0.2)', padding: '8px', borderRadius: '50%' }}>
        <AlertTriangle size={20} />
      </div>

      <div style={{ flex: 1, fontSize: '13px' }}>
        <strong style={{ display: 'block', marginBottom: '2px' }}>Lateral Asymmetry Detected</strong>
        <span>
          You are leaning to the <strong>{direction}</strong>. The chair's single-column mechanical spine corrects forward slouching. Please center your shoulders manually.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        {direction === 'left' && <ArrowRight size={20} className="pulsing-glow" style={{ animation: 'bounceRight 1s infinite alternate' }} />}
        {direction === 'right' && <ArrowLeft size={20} className="pulsing-glow" style={{ animation: 'bounceLeft 1s infinite alternate' }} />}
      </div>
    </div>
  );
};
