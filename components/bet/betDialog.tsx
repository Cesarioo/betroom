'use client';

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface BetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  betChoice: 'yes' | 'no';
  percentage: number;
  betAmount: string;
  setBetAmount: (amount: string) => void;
  onPlaceBet: () => void;
  currentUser: {
    name: string;
    profileImage: string;
  };
  opponentUser: {
    name: string;
    profileImage: string;
  } | null;
  maxAvailable: number;
}

export default function BetDialog({
  isOpen,
  onOpenChange,
  title,
  betChoice,
  percentage,
  betAmount,
  setBetAmount,
  onPlaceBet,
  currentUser,
  opponentUser,
  maxAvailable,
}: BetDialogProps) {
  const amount = parseFloat(betAmount) || 0;
  
  // Initialize slider at 10% of max available when dialog opens
  useEffect(() => {
    if (isOpen && maxAvailable > 0) {
      const initialAmount = Math.floor(maxAvailable * 0.1);
      if (initialAmount > 0) {
        setBetAmount(initialAmount.toString());
      }
    }
  }, [isOpen, maxAvailable]);

  const calculatePotentialEarnings = () => {
    if (amount <= 0) return { total: 0, profit: 0 };

    let potentialReturn = 0;
    if (betChoice === 'yes') {
      potentialReturn = (100 / percentage) * amount;
    } else {
      potentialReturn = (100 / (100 - percentage)) * amount;
    }

    const profit = potentialReturn - amount;
    return {
      total: potentialReturn,
      profit: profit
    };
  };

  const earnings = calculatePotentialEarnings();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-center">
            Bet against {opponentUser?.name || 'Opponent'}
          </DialogTitle>
          <DialogDescription className="text-center">
            You bet on {title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* VS Section */}
          <div className="flex items-center justify-center gap-6">
            {/* Current User */}
            <div className="flex flex-col items-center gap-2">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-primary">
                <AvatarImage src={currentUser.profileImage} alt={currentUser.name} />
                <AvatarFallback className="text-2xl">{currentUser.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold text-foreground">{currentUser.name}</span>
            </div>

            {/* VS */}
            <div className="text-4xl font-bold text-muted-foreground">VS</div>

            {/* Opponent User */}
            <div className="flex flex-col items-center gap-2">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-destructive">
                <AvatarImage src={opponentUser?.profileImage} alt={opponentUser?.name || 'Opponent'} />
                <AvatarFallback className="text-2xl">{opponentUser?.name[0] || '?'}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold text-foreground">{opponentUser?.name || 'Opponent'}</span>
            </div>
          </div>

          {/* Amount Slider */}
          <div className="space-y-3 px-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-lg font-bold text-foreground">${amount}</span>
            </div>
            <Slider
              value={[amount]}
              onValueChange={(values) => setBetAmount(values[0].toString())}
              max={maxAvailable}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>$0</span>
              <span>Max: ${maxAvailable}</span>
            </div>
          </div>

          {/* Potential Earnings */}
          <div className="space-y-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Potential return</span>
              <span className="text-base font-semibold text-foreground">
                ${earnings.total.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Potential profit</span>
              <span className={`text-base font-bold ${earnings.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                +${earnings.profit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            onClick={onPlaceBet}
            disabled={!betAmount || amount <= 0}
            className={`w-full ${betChoice === 'yes' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            Bet against {opponentUser?.name || 'Opponent'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

