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
    { label: "Upper Thoracic", type: "blue" },
    { label: "Lower Thoracic", type: "blue" },
    { label: "Mid Lumbar Upper", type: "blue" },
    { label: "Mid Lumbar Lower", type: "blue" },
    { label: "Lower Lumbar", type: "red" },
    { label: "Pelvis Actuator", type: "red" }
  ]

  return (
    <section style={{ 
      display: 'grid', 
      gridTemplateColumns: '1.2fr 1fr', 
      gap: '80px', 
      padding: '140px 0 100px', 
      alignItems: 'center' 
    }}>
      {/* Left side: Heading content */}
      <div style={{ textAlign: 'left' }}>
        {/* Soft capsule badge (Stealth Neumorphic) */}
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

      {/* Right side: Cybernetic Spine Matte-Black Dashboard Mockup */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="clay-card" style={{ 
          width: '380px', 
          background: 'var(--surface)',
          padding: '36px', 
          borderRadius: 'var(--radius-base)',
          position: 'relative'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Spine Actuators</span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Live Feedback</h3>
            </div>
            {/* Neumorphic Indicator Light */}
            <div style={{ 
              background: 'var(--accent-blue)', 
              boxShadow: 'var(--shadow-btn)',
              width: '32px', 
              height: '32px', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.02)'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>

          {/* Graphic representation of the 6 spine actuator cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: active ? '1px solid rgba(255, 255, 255, 0.02)' : '1px solid transparent',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s.label}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Channel {idx}</span>
                  </div>

                  {/* Tactile segment bar */}
                  <div style={{ 
                    width: '90px', 
                    height: '12px', 
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

          {/* Floater calibration pill */}
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
            whiteSpace: 'nowrap'
          }}>
            <span style={{ width: '8px', height: '8px', background: 'var(--accent-blue)', borderRadius: '50%', boxShadow: '0 0 6px var(--accent-blue)' }} />
            Active Mode: Office (1.0x)
          </div>
        </div>
      </div>
    </section>
  )
}
