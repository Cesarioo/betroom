'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface AppStartupProps {
  onComplete: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function AppStartup({ onComplete }: AppStartupProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Listen for the PWA install prompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      console.log('PWA install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    console.log('AppStartup mounted');
    // Start entrance animation
    const animInTimer = setTimeout(() => setIsAnimatingIn(true), 50);

    // Wait for 2 seconds, then start exit animation
    const exitTimer = setTimeout(() => {
      setIsAnimatingOut(true);
      setIsVisible(false);
      // After animation completes, call onComplete
      setTimeout(() => {
        onComplete();
        
        // Wait an extra 500ms before showing PWA install prompt
        // This ensures the browser is ready and prevents double prompt() issues
        setTimeout(() => {
          if (deferredPromptRef.current) {
            deferredPromptRef.current.prompt();
            deferredPromptRef.current.userChoice.then((choiceResult) => {
              console.log('User choice:', choiceResult.outcome);
              deferredPromptRef.current = null;
            });
          }
        }, 500);
      }, 400); // Match faster animation duration
    }, 2000);

    return () => {
      clearTimeout(animInTimer);
      clearTimeout(exitTimer);
    };
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
            src="/icon.png"
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

