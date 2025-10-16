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
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import dbData from '@/backend/db.json';

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
  betId: number;
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
  betId,
}: BetDialogProps) {
  const [mode, setMode] = useState<'take' | 'propose'>('take');
  const [proposePercentage, setProposePercentage] = useState(50);
  const [proposeAmount, setProposeAmount] = useState('');
  const [proposeChoice, setProposeChoice] = useState<'yes' | 'no'>('yes');
  
  const amount = parseFloat(betAmount) || 0;
  
  // Get all trades for this bet
  const betIdString = `bet_${betId}`;
  const betTrades = dbData.trades.filter((t) => t.betId === betIdString);
  
  // Get all maker orders
  const makerOrders = betTrades.filter(
    (t) => t.type === 'maker' && (t.status === 'open' || t.status === 'partially_filled')
  );
  
  // Find the lowest YES maker and highest NO maker
  const yesMakers = makerOrders.filter(m => m.position === 'yes');
  const noMakers = makerOrders.filter(m => m.position === 'no');
  
  const lowestYesMaker = yesMakers.length > 0 
    ? yesMakers.reduce((min, maker) => maker.percentage < min.percentage ? maker : min)
    : null;
  
  const highestNoMaker = noMakers.length > 0
    ? noMakers.reduce((max, maker) => maker.percentage > max.percentage ? maker : max)
    : null;
  
  // Determine slider direction based on current propose choice
  // If proposing YES: YES on left, NO on right
  // If proposing NO: NO on left, YES on right (inverted)
  const isInverted = proposeChoice === 'no';
  
  const actualMin = lowestYesMaker ? lowestYesMaker.percentage : 0;
  const actualMax = highestNoMaker ? highestNoMaker.percentage : 100;
  
  // Slider always needs min < max to function
  const sliderMin = actualMin;
  const sliderMax = actualMax;
  
  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setMode('take');
      setProposeAmount('');
      setProposeChoice('yes');
    } else {
      // Initialize to the middle of the slider range when opening
      setProposePercentage(Math.floor((sliderMin + sliderMax) / 2));
    }
  }, [isOpen, sliderMin, sliderMax]);
  
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
          {mode === 'take' ? (
            <>
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
            </>
          ) : (
            <>
              {/* Propose Mode */}
              <div className="space-y-4">
                {/* Percentage Slider with Makers */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block mb-2">Your Position</label>
                  
                  {/* Flex container with avatars and slider */}
                  <div className="flex items-center gap-2">
                    {/* Left avatar */}
                    <div className="-mr-4 z-10">
                      {(isInverted ? highestNoMaker : lowestYesMaker) && (() => {
                        const maker = isInverted ? highestNoMaker : lowestYesMaker;
                        const user = maker ? dbData.users.find((u) => u.id === maker.userId) : null;
                        const isYes = maker?.position === 'yes';
                        return user ? (
                          <Avatar className={`w-8 h-8 border-2 ${isYes ? 'border-green-500' : 'border-red-500'}`}>
                            <AvatarImage src={user.profileImage} alt={user.name} />
                            <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                          </Avatar>
                        ) : <div className="w-8 h-8" />;
                      })()}
                    </div>
                    
                    {/* Slider */}
                    <div className="flex-1">
                      <Slider
                        value={[isInverted ? (sliderMin + sliderMax - proposePercentage) : proposePercentage]}
                        onValueChange={(values) => setProposePercentage(isInverted ? (sliderMin + sliderMax - values[0]) : values[0])}
                        max={sliderMax}
                        min={sliderMin}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Right avatar */}
                    <div className="-ml-4 z-10">
                      {(isInverted ? lowestYesMaker : highestNoMaker) && (() => {
                        const maker = isInverted ? lowestYesMaker : highestNoMaker;
                        const user = maker ? dbData.users.find((u) => u.id === maker.userId) : null;
                        const isYes = maker?.position === 'yes';
                        return user ? (
                          <Avatar className={`w-8 h-8 border-2 ${isYes ? 'border-green-500' : 'border-red-500'}`}>
                            <AvatarImage src={user.profileImage} alt={user.name} />
                            <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                          </Avatar>
                        ) : <div className="w-8 h-8" />;
                      })()}
                    </div>
                  </div>
                  
                  {/* Percentage Display */}
                  <div className="text-center mt-2 text-sm font-semibold">
                    {proposePercentage}%
                  </div>
                </div>

                {/* Choice Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant={proposeChoice === 'yes' ? 'default' : 'outline'}
                    onClick={() => setProposeChoice('yes')}
                    className={`flex-1 ${proposeChoice === 'yes' ? 'bg-green-600 hover:bg-green-700 border-green-600' : ''}`}
                  >
                    Yes
                  </Button>
                  <Button
                    variant={proposeChoice === 'no' ? 'default' : 'outline'}
                    onClick={() => setProposeChoice('no')}
                    className={`flex-1 ${proposeChoice === 'no' ? 'bg-red-600 hover:bg-red-700 border-red-600' : ''}`}
                  >
                    No
                  </Button>
                </div>

                {/* Amount Input and Propose Button */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block mb-2">Amount</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="text"
                        value={proposeAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                            setProposeAmount(value);
                          }
                        }}
                        placeholder="0.00"
                        className="pl-8"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        console.log('Proposing bet:', {
                          choice: proposeChoice,
                          percentage: proposePercentage,
                          amount: proposeAmount,
                        });
                        setProposeAmount('');
                        setMode('take');
                        onOpenChange(false);
                      }}
                      disabled={!proposeAmount || parseFloat(proposeAmount) <= 0}
                      className={`${proposeChoice === 'yes' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                      Propose
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {mode === 'take' && (
          <DialogFooter className="flex flex-row gap-2 w-full">
            <Button
              onClick={() => {
                setMode('propose');
                setProposeChoice(betChoice === 'yes' ? 'no' : 'yes');
              }}
              variant="outline"
              className="flex-1"
            >
              Better quote
            </Button>
            <Button
              onClick={onPlaceBet}
              disabled={!betAmount || amount <= 0}
              className={`flex-1 ${betChoice === 'yes' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              Bet against {opponentUser?.name || 'Opponent'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

