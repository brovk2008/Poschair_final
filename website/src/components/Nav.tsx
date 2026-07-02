import Link from 'next/link'

const SpineIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--accent)' }}>
    <rect x="9" y="1"  width="6" height="4" rx="1" fill="currentColor" opacity="0.9"/>
    <rect x="9" y="7"  width="6" height="4" rx="1" fill="currentColor" opacity="0.75"/>
    <rect x="9" y="13" width="6" height="4" rx="1" fill="currentColor" opacity="0.6"/>
    <rect x="9" y="19" width="6" height="4" rx="1" fill="currentColor" opacity="0.45"/>
    <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="1.5" opacity="0.2"/>
  </svg>
)

export default function Nav() {
  return (
    <nav style={{
      position:      'sticky',
      top:            0,
      zIndex:         50,
      background:    'rgba(10, 10, 15, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom:  '1px solid var(--border)',
    }}>
      <div style={{
        maxWidth:   1100,
        margin:     '0 auto',
        padding:    '0 24px',
        height:      64,
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontWeight: 600, fontSize: 16, letterSpacing: '0.02em' }}>
          <SpineIcon />
          PosChair
        </Link>
        <div style={{ display: 'flex', gap: 28, fontSize: 14, alignItems: 'center' }}>
          <a href="#how-it-works" style={{ color: 'var(--text-secondary)' }}>How it works</a>
          <a href="#features"     style={{ color: 'var(--text-secondary)' }}>Features</a>
          <a href="https://github.com/brovk2008/Poschair_final" target="_blank" rel="noopener noreferrer"
             style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* GitHub icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </nav>
  )
}
