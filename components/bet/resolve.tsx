'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSupabase } from '@/lib/hooks/supabase';

interface ResolveDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  imageUrl: string;
  betId: string;
}

export default function ResolveDialog({
  isOpen,
  onOpenChange,
  title,
  imageUrl,
  betId,
}: ResolveDialogProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no' | null>(null);
  const [admins, setAdmins] = useState<Array<{ id: string; pseudonym: string; avatar_url: string | null }>>([]);
  const { supabase } = useSupabase();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    const fetchAdmins = async () => {
      if (!betId) return;

      // Find admin participants for this bet
      const { data: participants, error: participantsError } = await supabase
        .from('bet_participants')
        .select('user_id, is_admin')
        .eq('bet_id', betId)
        .eq('is_admin', true);

      if (participantsError) throw new Error(participantsError.message);
      if (!participants || participants.length === 0) {
        setAdmins([]);
        return;
      }

      const adminUserIds = participants.map((p) => p.user_id);

      // Fetch admin profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, pseudonym, avatar_url')
        .in('id', adminUserIds);

      if (profilesError) throw new Error(profilesError.message);
      setAdmins(profiles || []);
    };

    if (isOpen) {
      fetchAdmins().catch((err) => {
        console.error('Failed to fetch bet admins:', err);
        setAdmins([]);
      });
    }
  }, [isOpen, supabase, betId]);

  // Get current authenticated user id
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id ?? null);
    };
    if (isOpen) getUser();
  }, [isOpen, supabase]);

  const handleResolve = () => {
    (async () => {
      if (!selectedOutcome || isResolving) return;
      if (!currentUserId) {
        console.error('No authenticated user');
        return;
      }
      setIsResolving(true);

      try {
        const res = await fetch('/api/complete_bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bet_id: betId,
            admin_user_id: currentUserId,
            decision: selectedOutcome,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.error('Failed to resolve bet', body);
          return;
        }

        // Reset and close
        setSelectedOutcome(null);
        onOpenChange(false);
      } finally {
        setIsResolving(false);
      }
    })();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Resolve Bet</DialogTitle>
          <DialogDescription>
            Select the outcome for this bet. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {/* Bet Admins */}
        {admins.length > 0 && (
          <div className="py-2">
            <div className="text-xs text-muted-foreground mb-2">Bet admins</div>
            <div className="flex -space-x-2">
              {admins.map((admin) => (
                <Avatar key={admin.id} className="w-8 h-8 ring-2 ring-background">
                  <AvatarImage src={admin.avatar_url || ''} alt={admin.pseudonym} />
                  <AvatarFallback className="text-xs">{admin.pseudonym[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        )}

        <div className="py-4 space-y-4">
          {/* Bet Image and Title */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="relative w-12 h-12 rounded-md overflow-hidden bg-background flex-shrink-0">
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <h3 className="text-sm font-semibold text-foreground line-clamp-2 flex-1">
              {title}
            </h3>
          </div>

          {/* Outcome Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">
              What was the outcome?
            </label>
            <div className="flex gap-2">
              <Button
                variant={selectedOutcome === 'yes' ? 'default' : 'outline'}
                onClick={() => setSelectedOutcome('yes')}
                className={`flex-1 ${
                  selectedOutcome === 'yes'
                    ? 'bg-green-600 hover:bg-green-700 border-green-600'
                    : 'hover:bg-green-600/10 hover:border-green-600/50'
                }`}
              >
                Yes
              </Button>
              <Button
                variant={selectedOutcome === 'no' ? 'default' : 'outline'}
                onClick={() => setSelectedOutcome('no')}
                className={`flex-1 ${
                  selectedOutcome === 'no'
                    ? 'bg-red-600 hover:bg-red-700 border-red-600'
                    : 'hover:bg-red-600/10 hover:border-red-600/50'
                }`}
              >
                No
              </Button>
            </div>
          </div>

          {/* Warning */}
          <p className="text-xs text-muted-foreground text-center">
            Winners will receive their payouts immediately • Losers will lose their stake • This action is final
          </p>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            onClick={handleResolve}
            disabled={!selectedOutcome || isResolving}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-70"
          >
            {isResolving ? 'Resolving...' : 'Confirm Resolution'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

