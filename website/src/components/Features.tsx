import React from 'react'

const features = [
  {
    title: "2x3 Paraspinal Actuator Grid",
    desc: "Two independent columns of three worm-rack modules push foam pads into paraspinal muscle lines and correct lateral asymmetry."
  },
  {
    title: "On-device AI Pose Analysis",
    desc: "MediaPipe Pose tracking runs client-side inside the browser. No camera feed or coordinate data ever leaves your computer."
  },
  {
    title: "Zero-latency BLE Connection",
    desc: "Communicates using standard Web Bluetooth API writing packed 8-byte position payloads directly to the ESP32 DevKit controller."
  },
  {
    title: "Automatic Failsafe Watchdog",
    desc: "If the connection is interrupted or the browser tab closes, all motors retract to the 0mm home position within 2 seconds."
  },
  {
    title: "Position-based Correction",
    desc: "Mode curves output continuous 0-100mm targets with confidence gating and velocity-aware posture anticipation."
  },
  {
    title: "Local Session Analytics",
    desc: "Saves calibration baselines and score history locally in PostgreSQL to analyze weekly posture summaries."
  }
]

export default function Features() {
  return (
    <section id="features" style={{ padding: '80px 0' }}>
      <h2 className="section-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-secondary)', marginRight: '6px' }}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        Features
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {features.map((f, i) => (
          <div key={i} className="clay-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{f.title}</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
