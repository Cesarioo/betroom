'use client';

import { useState, useEffect } from 'react';
import './globals.css'
import AppStartup from '@/components/appStartup';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [showStartup, setShowStartup] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStartupComplete = () => {
    setShowStartup(false);
  };

  return (
    <html lang="en" className="dark">
      <body>
        {isClient && showStartup && <AppStartup onComplete={handleStartupComplete} />}
        {children}
      </body>
    </html>
  )
}
