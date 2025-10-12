'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface BetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  betChoice: 'yes' | 'no';
  percentage: number;
  betAmount: string;
  setBetAmount: (amount: string) => void;
  onPlaceBet: () => void;
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
}: BetDialogProps) {
  const calculatePotentialEarnings = () => {
    const amount = parseFloat(betAmount) || 0;
    if (amount <= 0) return { total: 0, profit: 0 };

    let potentialReturn = 0;
    if (betChoice === 'yes') {
      // If betting YES, you pay the percentage price
      // If YES wins, you get $1 per share
      potentialReturn = (100 / percentage) * amount;
    } else {
      // If betting NO, you pay (100 - percentage) price
      // If NO wins, you get $1 per share
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
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            Place Your Bet - {betChoice === 'yes' ? 'YES' : 'NO'}
          </DialogTitle>
          <DialogDescription>
            {title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Odds */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">
              {betChoice === 'yes' ? 'YES' : 'NO'} at
            </span>
            <span className="text-lg font-bold text-foreground">
              {betChoice === 'yes' ? percentage : (100 - percentage)}%
            </span>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Amount to bet</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                placeholder="0"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="pl-7"
                min="0"
              />
            </div>
          </div>

          {/* Potential Earnings */}
          {parseFloat(betAmount) > 0 && (
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
          )}
        </div>

        <DialogFooter className="sm:justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setBetAmount('');
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={onPlaceBet}
            disabled={!betAmount || parseFloat(betAmount) <= 0}
            className={betChoice === 'yes' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            Place Bet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

