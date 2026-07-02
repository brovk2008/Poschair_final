import DownloadButton from './DownloadButton'

export default function Hero() {
  return (
    <section style={{ padding: '120px 0 80px', textAlign: 'center', position: 'relative' }}>
      {/* Badge */}
      <div style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:             8,
        padding:        '6px 14px',
        background:     'rgba(79, 140, 255, 0.05)',
        border:         '1px solid var(--border)',
        borderRadius:    30,
        fontSize:        12,
        fontWeight:      500,
        color:          'var(--text-secondary)',
        marginBottom:    32,
        letterSpacing:  '0.04em',
        textTransform:  'uppercase',
      }}>
        <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true">
          <circle cx="3" cy="3" r="3" fill="var(--accent)"/>
        </svg>
        Open source · MIT License
      </div>

      <h1 style={{
        fontSize:    56,
        fontWeight:  700,
        lineHeight:  1.15,
        letterSpacing: '-0.02em',
        marginBottom: 24,
        color:       'var(--text-primary)',
        maxWidth:     800,
        margin:      '0 auto 24px',
        fontFamily:  'inherit'
      }}>
        Your chair corrects<br />
        <span style={{ background: 'linear-gradient(135deg, var(--accent), #a259ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          your posture for you.
        </span>
      </h1>

      <p style={{
        fontSize:    18,
        color:       'var(--text-secondary)',
        maxWidth:     600,
        margin:      '0 auto 48px',
        lineHeight:   1.7,
      }}>
        PosChair uses your webcam to detect slouching in real time and physically adjusts a servo-driven attachment on your chair — no wearables, no reminders.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <DownloadButton />
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Windows 10/11 · 64-bit · Free & open source</span>
      </div>
    </section>
  )
}
