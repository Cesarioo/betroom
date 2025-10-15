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
  
  // Calculate max user can bet based on opponent's available liquidity
  const calculateMaxUserBet = () => {
    if (maxAvailable <= 0) return 0;
    
    // maxAvailable is what the opponent has available
    // We need to calculate how much the user can bet to use up that liquidity
    if (betChoice === 'yes') {
      // User bets YES at percentage%, opponent needs (userAmount * (100-percentage)) / percentage
      // Solve: maxAvailable = (userAmount * (100-percentage)) / percentage
      // userAmount = (maxAvailable * percentage) / (100-percentage)
      return (maxAvailable * percentage) / (100 - percentage);
    } else {
      // User bets NO at (100-percentage)%, opponent needs (userAmount * percentage) / (100-percentage)
      // Solve: maxAvailable = (userAmount * percentage) / (100-percentage)
      // userAmount = (maxAvailable * (100-percentage)) / percentage
      return (maxAvailable * (100 - percentage)) / percentage;
    }
  };
  
  const maxUserBet = Math.floor(calculateMaxUserBet());
  
  // Initialize slider at 10% of max user bet when dialog opens
  useEffect(() => {
    if (isOpen && maxUserBet > 0) {
      const initialAmount = Math.floor(maxUserBet * 0.1);
      if (initialAmount > 0) {
        setBetAmount(initialAmount.toString());
      }
    }
  }, [isOpen, maxUserBet, setBetAmount]);

  // Calculate opponent's amount based on odds (this will always be <= maxAvailable)
  const calculateOpponentAmount = () => {
    if (amount <= 0) return 0;
    
    if (betChoice === 'yes') {
      // User bets YES at percentage%, opponent needs to put (100-percentage)% of the payout
      return (amount * (100 - percentage)) / percentage;
    } else {
      // User bets NO at (100-percentage)%, opponent needs to put percentage% of the payout
      return (amount * percentage) / (100 - percentage);
    }
  };

  const opponentAmount = calculateOpponentAmount();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-center">
            Bet against {opponentUser?.name || 'Opponent'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {title}
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
              <span className="text-sm font-semibold">
                <span className={betChoice === 'yes' ? 'text-green-500' : 'text-red-500'}>
                  {betChoice.toUpperCase()}
                </span>
                <span className="text-foreground"> for ${amount}</span>
              </span>
            </div>

            {/* VS */}
            <div className="text-4xl font-bold text-muted-foreground">VS</div>

            {/* Opponent User */}
            <div className="flex flex-col items-center gap-2">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-destructive">
                <AvatarImage src={opponentUser?.profileImage} alt={opponentUser?.name || 'Opponent'} />
                <AvatarFallback className="text-2xl">{opponentUser?.name[0] || '?'}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold">
                <span className={betChoice === 'yes' ? 'text-red-500' : 'text-green-500'}>
                  {betChoice === 'yes' ? 'NO' : 'YES'}
                </span>
                <span className="text-foreground"> for ${opponentAmount.toFixed(2)}</span>
              </span>
            </div>
          </div>

          {/* Amount Slider */}
          <div className="px-2">
            <Slider
              value={[amount]}
              onValueChange={(values) => setBetAmount(values[0].toString())}
              max={maxUserBet}
              min={0}
              step={1}
              className="w-full"
            />
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

