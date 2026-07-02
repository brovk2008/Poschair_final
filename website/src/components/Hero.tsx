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
    { label: "Upper Thoracic", maxAngle: 70 },
    { label: "Lower Thoracic", maxAngle: 70 },
    { label: "Mid Lumbar Upper", maxAngle: 70 },
    { label: "Mid Lumbar Lower", maxAngle: 70 },
    { label: "Lower Lumbar", maxAngle: 70 },
    { label: "Pelvis Actuator", maxAngle: 70 }
  ]

  return (
    <section style={{ 
      display: 'grid', 
      gridTemplateColumns: '1.2fr 1fr', 
      gap: '64px', 
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
          padding:        '8px 16px',
          background:     '#161729',
          boxShadow:      'inset 2px 2px 4px rgba(255,255,255,0.04), inset -2px -2px 4px rgba(0,0,0,0.5)',
          borderRadius:    30,
          fontSize:        '11px',
          fontWeight:      700,
          letterSpacing:  '0.06em',
          textTransform:  'uppercase',
          color:          '#7aa3ff',
          marginBottom:    32,
        }}>
          <span style={{ 
            width: '6px', 
            height: '6px', 
            background: '#22c55e', 
            borderRadius: '50%',
            boxShadow: '0 0 8px #22c55e'
          }} />
          Open Source project · MIT License
        </div>

        <h1 style={{
          fontSize:    '58px',
          fontWeight:  800,
          lineHeight:  1.1,
          letterSpacing: '-0.03em',
          marginBottom: '24px',
          color:       'var(--text-primary)',
        }}>
          Your chair corrects<br />
          <span style={{ background: 'linear-gradient(135deg, #4f8cff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            your posture for you.
          </span>
        </h1>

        <p style={{
          fontSize:    '18px',
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

      {/* Right side: Cybernetic Spine Clay Dashboard Mockup */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="clay-card" style={{ 
          width: '380px', 
          background: 'var(--surface-2)',
          padding: '36px', 
          borderRadius: '36px',
          position: 'relative'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Spine Actuators</span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Live Feedback</h3>
            </div>
            <div style={{ 
              background: '#22c55e', 
              boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.4), inset -2px -2px 4px rgba(0,0,0,0.3), 0 0 16px rgba(34,197,94,0.4)',
              width: '32px', 
              height: '32px', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>

          {/* Graphic representation of the 6 spine actuator cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {segments.map((s, idx) => {
              const active = activeSegment === idx;
              return (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  background: active ? 'rgba(79, 140, 255, 0.04)' : 'transparent',
                  padding: '8px 12px',
                  borderRadius: '16px',
                  border: active ? '1px solid rgba(79, 140, 255, 0.15)' : '1px solid transparent',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s.label}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PCA9685 Channel {idx}</span>
                  </div>

                  {/* Tactile segment bar */}
                  <div style={{ 
                    width: '90px', 
                    height: '14px', 
                    background: '#0a0a14', 
                    borderRadius: '8px', 
                    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.8), 1px 1px 2px rgba(255,255,255,0.05)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: active ? '75%' : '15%',
                      background: active ? 'linear-gradient(90deg, #4f8cff, #a855f7)' : '#334155',
                      borderRadius: '8px',
                      boxShadow: active ? 'inset 1px 1px 2px rgba(255,255,255,0.5), 0 0 10px rgba(79,140,255,0.4)' : 'none',
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Floater calibration pill */}
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--surface-2)',
            boxShadow: 'var(--clay-shadow)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '8px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap'
          }}>
            <span style={{ width: '8px', height: '8px', background: '#a855f7', borderRadius: '50%', boxShadow: '0 0 8px #a855f7' }} />
            Active Mode: Office (1.0x)
          </div>
        </div>
      </div>
    </section>
  )
}
