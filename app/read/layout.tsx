import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { SwApp } from './SwApp'
import './read.css'

export const metadata: Metadata = {
  title: "Azad's Story World",
  description: 'Interactive stories made just for Azad',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: "Azad's Stories",
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
    <SwApp>
      {children}
      <Script id="sw-register" strategy="afterInteractive">
        {`if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js').catch(()=>{}) }`}
      </Script>
    </SwApp>
  )
}
