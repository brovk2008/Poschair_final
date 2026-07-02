import { useState, useEffect } from 'react'
import DownloadButton from './DownloadButton'

export default function Hero() {
  const [activeSegment, setActiveSegment] = useState(0)

  // Cycle active visual segments on the mockup to simulate live posture corrections
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSegment(prev => (prev + 1) % 6)
    }, 1500)
    return () => clearInterval(timer)
  }, [])

  const segments = [
    { label: "Upper-Left (UL)", type: "blue" },
    { label: "Upper-Right (UR)", type: "blue" },
    { label: "Mid-Left (ML)", type: "blue" },
    { label: "Mid-Right (MR)", type: "blue" },
    { label: "Lower-Left (LL)", type: "red" },
    { label: "Lower-Right (LR)", type: "red" }
  ]

  // Calculate dynamic bending chord coordinates for the spring-steel simulator ribbon
  const getBendingPath = () => {
    const startX = 40;
    const endX = 40;
    const startY = 10;
    const endY = 270;
    
    // Default spine straight position is X=40. Shift right on active vertebra.
    const p1 = { x: activeSegment === 0 ? 68 : 40, y: 45 };
    const p2 = { x: activeSegment === 1 ? 68 : 40, y: 90 };
    const p3 = { x: activeSegment === 2 ? 68 : 40, y: 135 };
    const p4 = { x: activeSegment === 3 ? 68 : 40, y: 180 };
    const p5 = { x: activeSegment === 4 ? 68 : 40, y: 225 };
    const p6 = { x: activeSegment === 5 ? 68 : 40, y: 255 };

    return `M ${startX} ${startY} 
            C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y} 
            C ${p4.x} ${p4.y}, ${p5.x} ${p5.y}, ${p6.x} ${p6.y} 
            L ${endX} ${endY}`;
  }

  return (
    <section style={{ 
      display: 'grid', 
      gridTemplateColumns: '1.1fr 1fr', 
      gap: '48px', 
      padding: '140px 0 100px', 
      alignItems: 'center' 
    }}>
      {/* Left side: Heading content */}
      <div style={{ textAlign: 'left' }}>
        {/* Soft capsule badge */}
        <div style={{
          display:        'inline-flex',
          alignItems:     'center',
          gap:             8,
          padding:        '8px 18px',
          background:     'var(--surface)',
          boxShadow:      'var(--shadow-btn)',
          borderRadius:    '30px',
          fontSize:        '11px',
          fontWeight:      800,
          letterSpacing:  '0.06em',
          textTransform:  'uppercase',
          color:          'var(--text-secondary)',
          marginBottom:    32,
          border:          '1px solid rgba(255, 255, 255, 0.01)'
        }}>
          <span style={{ 
            width: '6px', 
            height: '6px', 
            background: 'var(--text-secondary)', 
            borderRadius: '50%',
            boxShadow: '0 0 6px rgba(255,255,255,0.2)'
          }} />
          Open Source Project · MIT License
        </div>

        <h1 style={{
          fontSize:    '62px',
          fontWeight:  800,
          lineHeight:  1.05,
          letterSpacing: '-0.03em',
          marginBottom: '24px',
          color:       'var(--text-primary)',
        }}>
          Your chair corrects<br />
          <span style={{ color: 'var(--text-secondary)' }}>
            your posture for you.
          </span>
        </h1>

        <p style={{
          fontSize:    '19px',
          color:       'var(--text-secondary)',
          lineHeight:   1.65,
          marginBottom: '48px',
          maxWidth: '540px'
        }}>
          PosChair runs real-time computer vision on your webcam to detect slouching. It automatically writes instructions to a 6-zone mechanical spine on your chair — no wearables required.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
          <DownloadButton />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '12px' }}>
            Requires Windows 10/11 · Free & open-source software
          </span>
        </div>
      </div>

      {/* Right side: Cybernetic Spine 3D Bending Simulation Console */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="clay-card" style={{ 
          width: '460px', 
          background: 'var(--surface)',
          padding: '36px', 
          borderRadius: 'var(--radius-base)',
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: '100px 1fr',
          gap: '24px'
        }}>
          
          {/* Left Column: Interactive 3D Spine Bending Simulator */}
          <div style={{ 
            position: 'relative', 
            height: '280px', 
            display: 'flex', 
            justifyContent: 'center', 
            perspective: '600px', 
            background: '#070709',
            borderRadius: '24px',
            boxShadow: 'var(--shadow-inset-groove)',
            overflow: 'hidden'
          }}>
            {/* SVG Spring-Steel Tension Ribbon */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <path 
                d={getBendingPath()} 
                fill="none" 
                stroke="var(--text-dim)" 
                strokeWidth="4" 
                strokeLinecap="round"
                style={{ transition: 'd 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
              />
              <path 
                d={getBendingPath()} 
                fill="none" 
                stroke="var(--accent-blue)" 
                strokeWidth="1.5" 
                strokeLinecap="round"
                opacity="0.5"
                style={{ transition: 'd 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
              />
            </svg>

            {/* 6 Vertebra Links */}
            <div style={{ 
              position: 'absolute', 
              top: '20px', 
              bottom: '20px', 
              left: 0, 
              right: 0, 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              zIndex: 2,
              transformStyle: 'preserve-3d'
            }}>
              {segments.map((s, idx) => {
                const active = activeSegment === idx;
                const activeColor = s.type === "red" ? "var(--accent-red)" : "var(--accent-blue)";
                return (
                  <div 
                    key={idx}
                    style={{
                      width: '48px',
                      height: '22px',
                      borderRadius: '8px',
                      background: active ? activeColor : 'var(--surface)',
                      border: '1px solid rgba(255,255,255,0.03)',
                      boxShadow: active 
                        ? `0 4px 12px ${activeColor}, inset 2px 2px 4px rgba(255,255,255,0.25), inset -2px -2px 4px rgba(0,0,0,0.5)` 
                        : 'var(--shadow-sm)',
                      transform: active 
                        ? 'translateZ(20px) translateX(28px) rotateY(-15deg)' 
                        : 'translateZ(0) translateX(0) rotateY(0)',
                      transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      fontWeight: 800,
                      color: active ? '#ffffff' : 'var(--text-muted)'
                    }}
                  >
                    L{idx + 1}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Actuator Telemetry & Indicator Details */}
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Spine Actuators</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Live Feedback</h3>
              </div>
              {/* Neumorphic Indicator Light */}
              <div style={{ 
                background: 'var(--accent-blue)', 
                boxShadow: 'var(--shadow-btn)',
                width: '28px', 
                height: '28px', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.02)'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>

            {/* Graphic representation of the 6 spine actuator cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {segments.map((s, idx) => {
                const active = activeSegment === idx;
                const fillVal = s.type === "red" ? "var(--accent-red)" : "var(--accent-blue)";
                return (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    background: active ? 'var(--surface-2)' : 'transparent',
                    boxShadow: active ? 'var(--shadow-btn-pressed)' : 'none',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: active ? '1px solid rgba(255, 255, 255, 0.02)' : '1px solid transparent',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s.label}</span>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Channel {idx}</span>
                    </div>

                    {/* Tactile segment bar */}
                    <div style={{ 
                      width: '75px', 
                      height: '10px', 
                      background: '#070709', 
                      borderRadius: '8px', 
                      boxShadow: 'var(--shadow-inset-groove)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        width: active ? '75%' : '15%',
                        background: active ? fillVal : 'var(--text-dim)',
                        borderRadius: '8px',
                        boxShadow: active ? 'inset 1px 1px 2px rgba(255,255,255,0.15)' : 'none',
                        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Floater Active Preset Mode Indicator */}
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--surface-2)',
            boxShadow: 'var(--shadow-btn)',
            border: '1px solid var(--border-hover)',
            borderRadius: '16px',
            padding: '8px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            zIndex: 10
          }}>
            <span style={{ width: '8px', height: '8px', background: 'var(--accent-blue)', borderRadius: '50%', boxShadow: '0 0 6px var(--accent-blue)' }} />
            Active Mode: Office (1.0x)
          </div>
        </div>
      </div>
    </section>
  )
}
