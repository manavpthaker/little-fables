import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { SwApp } from './SwApp'
import { LfFilters } from './LfFilters'
import { alegreya, caveat, youngSerif } from './lf-fonts'
import './read.css'

export const metadata: Metadata = {
  title: 'Little Fables',
  description: 'Interactive chapter books, buddies, and star words — made for Azad.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Little Fables',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1e1b4b',
}

export default function ReadLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${alegreya.variable} ${youngSerif.variable} ${caveat.variable}`}>
      {/* SVG filter defs used by every drawn surface in the v3 Drawn Room.
          Mounted once per SPA session so `filter: url(#lf-wobble)` etc. work. */}
      <LfFilters />
      <SwApp>
        {children}
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js').catch(()=>{}) }`}
        </Script>
      </SwApp>
    </div>
  )
}
