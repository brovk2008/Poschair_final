import Head from 'next/head'
import Nav from '../components/Nav'
import Hero from '../components/Hero'
import HowItWorks from '../components/HowItWorks'
import Features from '../components/Features'
import DownloadButton from '../components/DownloadButton'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <>
      <Head>
        <title>PosChair — AI Posture Correction for Your Chair</title>
        <meta name="description" content="Open-source AI posture correction. Camera detects slouching, motor-driven chair attachment corrects it in real time." />
        <meta property="og:image" content="/og-image.png" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>

      <Nav />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <Hero />
        <HowItWorks />
        <Features />

        {/* Download Section */}
        <section style={{ textAlign: 'center', padding: '100px 0', borderTop: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '16px', fontWeight: 700 }}>Ready to improve your posture?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
            Get started today by downloading the Windows installer or cloning the repository files.
          </p>
          <DownloadButton />
          <p style={{ color: 'var(--text-dim)', marginTop: 24, fontSize: 13 }}>
            Requires a webcam and Bluetooth. <a href="/terms" style={{ color: 'var(--text-muted)' }}>Terms</a> · <a href="/privacy" style={{ color: 'var(--text-muted)' }}>Privacy</a>
          </p>
        </section>
      </main>

      <Footer />
    </>
  )
}
