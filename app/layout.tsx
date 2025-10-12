import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Betroom',
  description: 'Betroom',
  manifest: '/manifest.json',
  themeColor: '#000000',
  icons: {
    icon: '/public/icon-192x192.png',
    apple: '/public/icon-192x192.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
