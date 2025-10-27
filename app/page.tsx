'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppStartup from '@/components/appStartup';
import { useSupabase } from '@/lib/hooks/supabase';

export default function Home() {
  const router = useRouter();
  const { supabase } = useSupabase();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // User is not authenticated, redirect to login
          router.push('/login');
          return;
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // On error, redirect to login as well
        router.push('/login');
      }
    };

    checkAuth();
  }, [supabase, router]);

  const handleStartupComplete = useCallback(() => {
    router.push('/homepage');
  }, [router]);

  return <AppStartup onComplete={handleStartupComplete} />;
}
