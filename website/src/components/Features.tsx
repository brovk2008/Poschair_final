import React from 'react'

const features = [
  {
    title: "6-Level Mechanical Spine",
    desc: "A vertical chain of six servo-driven spring-steel 'bow' modules adjusts dynamically to your thoracic, lumbar, and pelvis zones."
  },
  {
    title: "On-device AI Pose Analysis",
    desc: "MediaPipe Pose tracking runs client-side inside the browser. No camera feed or coordinate data ever leaves your computer."
  },
  {
    title: "Zero-latency BLE Connection",
    desc: "Communicates using standard Web Bluetooth API writing packed binary payloads directly to the ESP32-C3 microcontroller."
  },
  {
    title: "Automatic Failsafe Watchdog",
    desc: "If the connection is interrupted or the browser tab closes, all servos return to flat neutral state within 2 seconds."
  },
  {
    title: "Presets & Mode Easing",
    desc: "Features customized support curves optimized for Office, Study, Gaming, or Relaxing, applying smooth 50Hz linear easing."
  },
  {
    title: "Local Session Analytics",
    desc: "Saves calibration baselines and scores history locally in PostgreSQL to analyze weekly posture summaries."
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
