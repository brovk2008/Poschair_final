import { useEffect, useState } from 'react'

const REPO = 'brovk2008/Poschair_final'

interface Release {
  tag_name: string
  assets: { name: string; browser_download_url: string; size: number }[]
}

export default function DownloadButton() {
  const [release, setRelease] = useState<Release | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
      .then(r => r.json())
      .then(data => { 
        if (data && data.assets) {
          setRelease(data); 
        }
        setLoading(false); 
      })
      .catch(() => setLoading(false))
  }, [])

  const exeAsset = release?.assets.find(a => a.name.endsWith('.exe'))
  const sizeMb   = exeAsset ? (exeAsset.size / 1024 / 1024).toFixed(1) : null

  return (
    <a
      href={exeAsset?.browser_download_url ?? `https://github.com/${REPO}/releases`}
      target="_blank"
      rel="noopener noreferrer"
      className="clay-btn clay-btn-brand"
      style={{
        padding: '16px 36px',
        borderRadius: '999px',
        fontSize: '15px',
        textDecoration: 'none',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: '10px' }}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      {loading
        ? 'Reading Release...'
        : exeAsset 
          ? `Download for Windows (${sizeMb} MB)` 
          : 'Download Setup Executable'}
    </a>
  )
}
