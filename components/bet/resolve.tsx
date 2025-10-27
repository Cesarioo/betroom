'use client';

import { useState } from 'react';
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

  const handleResolve = () => {
    if (!selectedOutcome) return;
    
    console.log('Resolving bet:', {
      betId,
      outcome: selectedOutcome,
    });
    
    // Reset and close
    setSelectedOutcome(null);
    onOpenChange(false);
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
            disabled={!selectedOutcome}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Confirm Resolution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

