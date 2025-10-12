'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppStartup from '@/components/appStartup';

export default function Home() {
  const router = useRouter();

  const handleStartupComplete = useCallback(() => {
    router.push('/homepage');
  }, [router]);

  return <AppStartup onComplete={handleStartupComplete} />;
}
