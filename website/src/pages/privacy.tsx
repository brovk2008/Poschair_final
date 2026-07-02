import Head from 'next/head'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy — PosChair</title>
      </Head>
      <Nav />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 56 }}>
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.75, display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>No data collection</h2>
            <p>PosChair does not collect, transmit, or store any personal data. The application runs entirely on your local machine.</p>
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>Camera</h2>
            <p>Your camera feed is processed locally using MediaPipe running as WebAssembly in the browser. No video frames, images, or pose data leave your device. Ever.</p>
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>Local database</h2>
            <p>Session history and calibration data are stored in a PostgreSQL database running locally via Docker on your machine. This data never leaves your computer.</p>
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>Bluetooth</h2>
            <p>Bluetooth communication happens directly between the app and your chair hardware over BLE. No data is routed through any server or third-party service.</p>
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>This website</h2>
            <p>The marketing website (this page) uses no analytics, no cookies, and no tracking scripts. The only external request is to the GitHub API to fetch the latest release version for the download button.</p>
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>Contact</h2>
            <p>Questions? Open an issue on <a href="https://github.com/brovk2008/Poschair_final" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>GitHub</a>.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
