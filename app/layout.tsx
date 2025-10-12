import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Betroom',
  description: 'Betroom',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192x192.png',
    apple: '/icon-192x192.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
