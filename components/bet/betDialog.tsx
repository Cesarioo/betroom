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
import { useTakeBet, useCreateMakerTrade } from '@/lib/database/bet';
import { useSupabase } from '@/lib/hooks/supabase';
import { useUserMoney } from '@/lib/database/money';

type MakerOrder = { id: string; price: number; amount: number };

interface BetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  betChoice: 'yes' | 'no';
  percentage: number;
  betAmount: string;
  setBetAmount: (amount: string) => void;
  currentUser: {
    name: string;
    profileImage: string;
  };
  opponentUser: {
    name: string;
    profileImage: string;
  } | null;
  betId: string;
  onTriggerAnimation: (data: {
    choice: 'yes' | 'no';
    percentage: number;
    amount: string;
    userImage: string;
    userName: string;
  }) => void;
  initialMode?: 'take' | 'propose';
  yesButtonOrders?: MakerOrder[];
  noButtonOrders?: MakerOrder[];
}

export default function BetDialog({
  isOpen,
  onOpenChange,
  title,
  betChoice,
  percentage,
  betAmount,
  setBetAmount,
  currentUser,
  opponentUser,
  betId,
  onTriggerAnimation,
  initialMode = 'take',
  yesButtonOrders = [],
  noButtonOrders = [],
}: BetDialogProps) {
  const [mode, setMode] = useState<'take' | 'propose'>(initialMode);
  const [proposePercentage, setProposePercentage] = useState(50);
  const [proposeAmount, setProposeAmount] = useState('');
  const [proposeChoice, setProposeChoice] = useState<'yes' | 'no'>('yes');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingMakerLiquidity, setRemainingMakerLiquidity] = useState(0);
  
  const { takeBet, isTaking } = useTakeBet();
  const { createMakerTrade, isCreating: isCreatingMaker } = useCreateMakerTrade();
  const { supabase } = useSupabase();
  const { currentBalance } = useUserMoney();
  
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
  
  // Calculate slider range based on maker positions
  const actualMin = lowestYesMaker ? lowestYesMaker.percentage : 0;
  const actualMax = highestNoMaker ? highestNoMaker.percentage : 100;
  
  const sliderMin = actualMin;
  const sliderMax = actualMax;
  
  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setMode('take');
      setProposeAmount('');
      setProposeChoice('yes');
    } else {
      // Set mode to initialMode when dialog opens
      setMode(initialMode);
      // Initialize to the middle of the valid range when opening
      const actualMin = lowestYesMaker ? lowestYesMaker.percentage : 0;
      const actualMax = highestNoMaker ? highestNoMaker.percentage : 100;
      const middle = Math.floor((actualMin + actualMax) / 2);
      // Round to nearest 10
      setProposePercentage(Math.round(middle / 10) * 10);
    }
  }, [isOpen, lowestYesMaker, highestNoMaker, initialMode]);
  
  // Calculate max user can bet based on remaining maker liquidity
  // remainingMakerLiquidity is already converted to taker's side based on price
  // Also cap it by the user's available cash
  const calculateMaxUserBet = () => {
    // Take the minimum of available liquidity and user's cash
    return Math.min(remainingMakerLiquidity, currentBalance);
  };
  
  const maxUserBet = calculateMaxUserBet();
  const maxUserBetWhole = Math.floor(maxUserBet);
  
  // Initialize slider at 10% of max user bet when dialog opens or remaining liquidity changes
  useEffect(() => {
    if (isOpen && maxUserBetWhole > 0 && remainingMakerLiquidity > 0) {
      const initialAmount = Math.floor(maxUserBet * 0.1);
      if (initialAmount > 0) {
        setBetAmount(initialAmount.toString());
      }
    }
  }, [isOpen, maxUserBetWhole, remainingMakerLiquidity, setBetAmount]);

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

  // Fetch remaining maker liquidity
  useEffect(() => {
    const fetchRemainingLiquidity = async () => {
      try {
        const orders = betChoice === 'yes' ? yesButtonOrders : noButtonOrders;
        if (orders.length === 0) {
          setRemainingMakerLiquidity(0);
          return;
        }

        const selectedMakerTrade = orders[0];
        const makerPrice = selectedMakerTrade.price;
        
        // Get all existing taker trades for this maker trade
        const { data: existingTakers } = await supabase
          .from('trades')
          .select('amount')
          .eq('maker_trade_id', selectedMakerTrade.id);

        // Calculate total amount already taken by takers
        const totalTaken = (existingTakers as Array<{ amount: number }> | null)?.reduce((sum, t) => sum + t.amount, 0) || 0;
        
        // Calculate how much of the maker's allocation is still available
        // Then convert that to how much the taker can bet at their side's price
        const remainingMakerAllocation = selectedMakerTrade.amount - totalTaken;
        
        // Convert remaining maker allocation to taker amount based on price
        // The maker's price determines how much the taker can bet
        // Example: If maker has 10 at price 80 (maker betting at 80% odds)
        // - Taker at 20% can bet: (makerAmount * (100 - makerPrice)) / makerPrice
        // - Taker amount = (10 * 20) / 80 = 2.5
        // Both YES and NO takers use the same formula when maker is on opposite side
        let takerMaxAmount = 0;
        if (makerPrice > 0 && makerPrice < 100) {
          takerMaxAmount = (remainingMakerAllocation * (100 - makerPrice)) / makerPrice;
        }
        
        setRemainingMakerLiquidity(takerMaxAmount > 0 ? takerMaxAmount : 0);
      } catch (error) {
        console.error('Error fetching remaining liquidity:', error);
        setRemainingMakerLiquidity(0);
      }
    };

    if (isOpen && (yesButtonOrders.length > 0 || noButtonOrders.length > 0)) {
      fetchRemainingLiquidity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, betChoice, yesButtonOrders.length, noButtonOrders.length]);



  const handleTakeBet = async () => {
    try {
      setErrorMessage(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the first available maker trade for the chosen side
      const orders = betChoice === 'yes' ? yesButtonOrders : noButtonOrders;
      if (orders.length === 0) {
        throw new Error('No makers available for this side');
      }

      const selectedMakerTrade = orders[0];
      const makerPrice = betChoice === 'yes' ? percentage : (100 - percentage);

      await takeBet({
        bet_id: betId,
        user_id: user.id,
        side: betChoice,
        price: makerPrice,
        amount: amount,
        maker_trade_id: selectedMakerTrade.id,
        currentBalance: currentBalance,
      });

      // Close dialog and trigger animation
      onOpenChange(false);
      setTimeout(() => {
        onTriggerAnimation({
          choice: betChoice,
          percentage: betChoice === 'yes' ? percentage : (100 - percentage),
          amount: betAmount,
          userImage: currentUser.profileImage,
          userName: currentUser.name,
        });
      }, 100);
      
      // Reset state
      setBetAmount('');
      setErrorMessage(null);
    } catch (err) {
      console.error('Error taking bet:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to take bet');
    }
  };

  const handleProposeBet = async () => {
    try {
      setErrorMessage(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const proposeAmountValue = parseFloat(proposeAmount);
      if (isNaN(proposeAmountValue) || proposeAmountValue <= 0) {
        throw new Error('Please enter a valid amount');
      }

      await createMakerTrade({
        bet_id: betId,
        user_id: user.id,
        side: proposeChoice,
        price: proposePercentage,
        amount: proposeAmountValue,
        currentBalance: currentBalance,
      });

      // Close dialog and trigger animation
      onOpenChange(false);
      setTimeout(() => {
        onTriggerAnimation({
          choice: proposeChoice,
          percentage: proposePercentage,
          amount: proposeAmount,
          userImage: currentUser.profileImage,
          userName: currentUser.name,
        });
      }, 100);
      
      // Reset state
      setProposeAmount('');
      setProposeChoice('yes');
      setProposePercentage(50);
      setMode('take');
      setErrorMessage(null);
    } catch (err) {
      console.error('Error proposing bet:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to propose bet');
    }
  };

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

        {errorMessage && (
          <div className="px-6 py-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive text-center">{errorMessage}</p>
          </div>
        )}

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
                  max={maxUserBetWhole}
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
                    {/* Left avatar - always YES maker */}
                    <div className="-mr-4 z-10">
                      {lowestYesMaker && (() => {
                        const user = dbData.users.find((u) => u.id === lowestYesMaker.userId);
                        return user ? (
                          <Avatar className="w-8 h-8 border-2 border-green-500">
                            <AvatarImage src={user.profileImage} alt={user.name} />
                            <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                          </Avatar>
                        ) : <div className="w-8 h-8" />;
                      })()}
                    </div>
                    
                    {/* Slider with current user avatar */}
                    <div className="flex-1 relative py-2">
                      {/* Current user avatar positioned at slider thumb */}
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 pointer-events-none transition-all"
                        style={{ 
                          left: `${isInverted 
                            ? (100 - ((proposePercentage - sliderMin) / (sliderMax - sliderMin)) * 100)
                            : ((proposePercentage - sliderMin) / (sliderMax - sliderMin)) * 100}%` 
                        }}
                      >
                        <Avatar className={`w-8 h-8 border-2 ${proposeChoice === 'yes' ? 'border-green-500' : 'border-red-500'}`}>
                          <AvatarImage src={currentUser.profileImage} alt={currentUser.name} />
                          <AvatarFallback className="text-xs">{currentUser.name[0]}</AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <Slider
                        value={[proposePercentage]}
                        onValueChange={(values) => setProposePercentage(values[0])}
                        max={sliderMax}
                        min={sliderMin}
                        step={10}
                        className="w-full [&_[role=slider]]:opacity-0"
                        inverted={isInverted}
                      />
                    </div>
                    
                    {/* Right avatar - always NO maker */}
                    <div className="-ml-4 z-10">
                      {highestNoMaker && (() => {
                        const user = dbData.users.find((u) => u.id === highestNoMaker.userId);
                        return user ? (
                          <Avatar className="w-8 h-8 border-2 border-red-500">
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
                      onClick={handleProposeBet}
                      disabled={!proposeAmount || parseFloat(proposeAmount) <= 0 || isCreatingMaker}
                      className={`${proposeChoice === 'yes' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                      {isCreatingMaker ? 'Creating...' : 'Propose'}
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
              onClick={handleTakeBet}
              disabled={!betAmount || amount <= 0 || isTaking}
              className={`flex-1 ${betChoice === 'yes' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isTaking ? 'Processing...' : `Bet against ${opponentUser?.name || 'Opponent'}`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

