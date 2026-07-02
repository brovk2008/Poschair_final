import React from 'react';
import { StatusData } from '../bleManager';
import { Shield, ShieldAlert, Cpu } from 'lucide-react';

interface BLEStatusBarProps {
  bleConnected: boolean;
  bleStatus: StatusData | null;
  lastPacketTime: number | null;
}

export const BLEStatusBar: React.FC<BLEStatusBarProps> = ({
  bleConnected,
  bleStatus,
  lastPacketTime
}) => {
  const failsafeActive = bleStatus ? (bleStatus.flags & 0x02) !== 0 : false;
  
  return (
    <footer 
      className="glass-panel" 
      style={{ 
        marginTop: '24px', 
        padding: '12px 24px', 
        borderRadius: '12px',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        fontSize: '12px',
        color: 'var(--text-secondary)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Connection status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={14} style={{ color: bleConnected ? 'var(--accent-cyan)' : 'var(--text-muted)' }} />
          <span>Hardware: {bleConnected ? "Online" : "Offline"}</span>
        </div>

        {/* Failsafe warning info */}
        {bleConnected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: failsafeActive ? 'var(--accent-red)' : 'var(--accent-green)' }}>
            {failsafeActive ? (
              <>
                <ShieldAlert size={14} className="pulsing-glow" />
                <span>Watchdog Active (Neutral)</span>
              </>
            ) : (
              <>
                <Shield size={14} />
                <span>Failsafe Guard Active</span>
              </>
            )}
          </div>
        )}

      </div>

      {/* Packet info and angles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {lastPacketTime && (
          <span>
            Last Tx: {new Date(lastPacketTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
        {bleStatus && (
          <span style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            ESP32 Feedback: [{bleStatus.currentAngles.join(', ')}]
          </span>
        )}
      </div>
      
    </footer>
  );
};
