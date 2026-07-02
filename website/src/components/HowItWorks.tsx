const steps = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M23 7l-7 5 7 5V7z"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
    step:  '01',
    title: 'Camera detects posture',
    desc:  'MediaPipe Pose runs as WebAssembly in the browser. No data leaves your device.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="2"/>
        <rect x="9" y="9" width="6" height="6"/>
        <line x1="9"  y1="1"  x2="9"  y2="4"/>
        <line x1="15" y1="1"  x2="15" y2="4"/>
        <line x1="9"  y1="20" x2="9"  y2="23"/>
        <line x1="15" y1="20" x2="15" y2="23"/>
        <line x1="20" y1="9"  x2="23" y2="9"/>
        <line x1="20" y1="14"  x2="23" y2="14"/>
        <line x1="1"  y1="9"  x2="4"  y2="9"/>
        <line x1="1"  y1="14" x2="4"  y2="14"/>
      </svg>
    ),
    step:  '02',
    title: 'Decision engine maps to angles',
    desc:  'Spine deviation is converted to six servo target angles based on mode (office, gaming, study, relax).',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"/>
      </svg>
    ),
    step:  '03',
    title: 'BLE sends commands',
    desc:  'An 8-byte command packet with XOR checksum is sent over Bluetooth Low Energy to the chair hardware.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
    step:  '04',
    title: 'Servos correct your posture',
    desc:  'PCA9685 drives six servos across thoracic, lumbar, and pelvis zones. Eased at 50 Hz — no jerking.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: '100px 0 80px' }}>
      <h2 className="section-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--brand)' }}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        How it works
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
        {steps.map(s => (
          <div key={s.step} className="clay-card">
            <div style={{ color: 'var(--brand)', fontSize: '11px', fontWeight: 800, marginBottom: '20px', letterSpacing: '0.04em', fontFamily: 'monospace' }}>
              STEP {s.step}
            </div>
            
            {/* Clay icon background */}
            <div style={{ 
              background: 'var(--surface-medium)',
              boxShadow: 'var(--shadow-sm)',
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand)',
              marginBottom: '24px'
            }}>
              {s.icon}
            </div>
            
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>{s.title}</h3>
            <p  style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
