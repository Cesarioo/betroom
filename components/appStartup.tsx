'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface AppStartupProps {
  onComplete: () => void;
}

export default function AppStartup({ onComplete }: AppStartupProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    // Start entrance animation
    setTimeout(() => setIsAnimatingIn(true), 50);

    // Wait for 2 seconds, then start exit animation
    const timer = setTimeout(() => {
      setIsAnimatingOut(true);
      setIsVisible(false);
      // After animation completes, call onComplete
      setTimeout(() => {
        onComplete();
      }, 400); // Match faster animation duration
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div 
        className={`flex flex-col items-center gap-4 ${
          isAnimatingOut
            ? 'transition-all duration-400 opacity-0 scale-150'
            : isAnimatingIn 
              ? 'transition-all duration-700 opacity-100 scale-100' 
              : 'transition-all duration-700 opacity-0 scale-75'
        }`}
      >
        <div className="animate-pulse">
          <Image
            src="/icon-512x512.png"
            alt="Betroom Logo"
            width={120}
            height={120}
            className="rounded-2xl"
          />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Betroom</h1>
      </div>
    </div>
  );
}

