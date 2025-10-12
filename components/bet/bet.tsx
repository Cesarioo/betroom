'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import dbData from '@/backend/db.json';

interface Participant {
  name: string;
  image: string;
}

interface BetProps {
  id: number;
  title: string;
  imageUrl: string;
  amountAtStake: number;
  participants: Participant[];
  percentage: number;
  expirationDate: string;
}

export default function Bet({
  id,
  title,
  imageUrl,
  amountAtStake,
  participants,
  percentage,
  expirationDate,
}: BetProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<'yes' | 'no' | null>(null);
  const [isBetDialogOpen, setIsBetDialogOpen] = useState(false);
  const [betAmount, setBetAmount] = useState('');
  const [betChoice, setBetChoice] = useState<'yes' | 'no'>('yes');
  const [isExpanded, setIsExpanded] = useState(false);

  const displayedParticipants = participants.slice(0, 5);
  const remainingCount = Math.max(0, participants.length - 5);

  // Get all trades for this bet
  const betId = `bet_${id}`;
  const betTrades = dbData.trades.filter((t) => t.betId === betId);
  
  // Group trades by position
  const yesTrades = betTrades.filter((t) => t.position === 'yes');
  const noTrades = betTrades.filter((t) => t.position === 'no');

  // Get user details for trades with maker/taker relationship
  const getTradeWithUser = (trade: typeof betTrades[0]) => {
    const user = dbData.users.find((u) => u.id === trade.userId);
    
    // If this is a taker, find the maker they're trading with
    let counterpartyUser = null;
    if (trade.type === 'taker' && trade.makerTradeId) {
      const makerTrade = betTrades.find((t) => t.id === trade.makerTradeId);
      if (makerTrade) {
        counterpartyUser = dbData.users.find((u) => u.id === makerTrade.userId);
      }
    }
    
    return { trade, user, counterpartyUser };
  };

  const handleBetClick = (choice: 'yes' | 'no') => {
    setBetChoice(choice);
    setSelectedAnswer(choice);
    setIsBetDialogOpen(true);
  };

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

  const handlePlaceBet = () => {
    console.log('Placing bet:', {
      choice: betChoice,
      amount: betAmount,
      percentage: betChoice === 'yes' ? percentage : (100 - percentage)
    });
    setBetAmount('');
    setIsBetDialogOpen(false);
  };

  const earnings = calculatePotentialEarnings();

  // Calculate color based on percentage (red to green gradient)
  const getColor = (percentage: number) => {
    if (percentage <= 33) return 'rgb(239, 68, 68)'; // red-500
    if (percentage <= 66) return 'rgb(234, 179, 8)'; // yellow-500
    return 'rgb(34, 197, 94)'; // green-500
  };

  // Format expiration date
  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Format time
    const time = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    // Format date based on proximity
    if (diffDays === 0) {
      return `Today ${time}`;
    } else if (diffDays === 1) {
      return `Tomorrow ${time}`;
    } else if (diffDays < 7) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      return `${dayName} ${time}`;
    } else {
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      return `${dateStr} ${time}`;
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="px-3 space-y-2">
        {/* Top Row: Image, Title, and Half Circle */}
        <div className="flex items-center gap-3">
          {/* Square Image */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>

          {/* Title and Half Circle */}
          <div className="flex-1 flex items-center justify-between gap-3">
            <h3 className="text-sm sm:text-base font-semibold text-foreground line-clamp-2 flex-1">
              {title}
            </h3>
            
            {/* Half Circle Progress */}
            <div className="relative flex items-end justify-center flex-shrink-0 w-16 h-8 sm:w-20 sm:h-10">
              {/* Background half circle */}
              <div className="absolute bottom-0 w-full h-full border-t-4 border-l-4 border-r-4 border-muted rounded-t-full" />
              {/* Progress half circle */}
              <div 
                className="absolute bottom-0 w-full h-full border-t-4 border-l-4 border-r-4 rounded-t-full transition-all"
                style={{
                  borderColor: getColor(percentage),
                  clipPath: `polygon(0 100%, 0 0, ${percentage}% 0, ${percentage}% 100%)`,
                }}
              />
              {/* Percentage text inside */}
              <span 
                className="absolute bottom-0.5 text-xs sm:text-sm font-bold z-5"
                style={{ color: getColor(percentage) }}
              >
                {percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Yes/No Buttons */}
        <div className="flex gap-2">
          <Button
            variant={selectedAnswer === 'yes' ? 'default' : 'outline'}
            onClick={() => handleBetClick('yes')}
            className={`flex-1 ${selectedAnswer === 'yes' ? 'bg-green-600 hover:bg-green-700 border-green-600' : ''}`}
          >
            Yes
          </Button>
          <Button
            variant={selectedAnswer === 'no' ? 'default' : 'outline'}
            onClick={() => handleBetClick('no')}
            className={`flex-1 ${selectedAnswer === 'no' ? 'bg-red-600 hover:bg-red-700 border-red-600' : ''}`}
          >
            No
          </Button>
        </div>

        {/* Stake, Expiration & Participants */}
        <div className="flex items-center justify-between pt-2">
          {/* Stake */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Stake</span>
            <span className="text-sm font-bold text-foreground">${amountAtStake}</span>
          </div>

          {/* Expiration */}
          <div className="flex flex-col gap-0.5 items-center">
            <span className="text-xs text-muted-foreground">Ends</span>
            <span className="text-xs font-medium text-foreground">{formatExpirationDate(expirationDate)}</span>
          </div>

          {/* Participants */}
          <div className="flex flex-col items-end gap-0.5">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 group"
            >
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                Participants
              </span>
              {isExpanded ? (
                <ChevronUp className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              ) : (
                <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </button>
            <div className="flex items-center gap-1">
              <div className="flex -space-x-2">
                {displayedParticipants.map((participant, idx) => (
                  <Avatar key={idx} className="w-6 h-6">
                    <AvatarImage src={participant.image} alt={participant.name} />
                    <AvatarFallback className="text-[10px]">
                      {participant.name[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {remainingCount > 0 && (
                <span className="text-xs font-medium text-muted-foreground ml-1">
                  +{remainingCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Participants View */}
        {isExpanded && (() => {
          // Group all trades by makerTradeId
          const makerGroups = new Map<string, { maker: typeof betTrades[0], takers: typeof betTrades }>();
          
          betTrades
            .filter((trade) => trade.type === 'taker' && trade.makerTradeId)
            .forEach((taker) => {
              const makerId = taker.makerTradeId!;
              if (!makerGroups.has(makerId)) {
                const maker = betTrades.find(t => t.id === makerId);
                if (maker) {
                  makerGroups.set(makerId, { maker, takers: [] });
                }
              }
              makerGroups.get(makerId)?.takers.push(taker);
            });

          return (
            <div className="pt-4 mt-2 border-t border-border animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Headers */}
              <div className="grid grid-cols-[auto_1fr_auto] gap-0 mb-2">
                <div className="text-xs font-semibold text-green-500 uppercase tracking-wide">
                  Yes ({yesTrades.length})
                </div>
                <div></div>
                <div className="text-xs font-semibold text-red-500 uppercase tracking-wide pl-2">
                  No ({noTrades.length})
                </div>
              </div>

              {/* Maker Groups */}
              <div className="space-y-4">
                {Array.from(makerGroups.entries()).map(([makerId, { maker, takers }], groupIndex) => {
                  const { user: makerUser } = getTradeWithUser(maker);
                  if (!makerUser) return null;

                  // Check if THIS group has YES takers
                  const groupHasYesTakers = takers.some(t => t.position === 'yes');

                  return (
                    <div 
                      key={makerId} 
                      className="grid grid-cols-[auto_1fr_auto] gap-0 animate-in fade-in slide-in-from-top-2 duration-300"
                      style={{ animationDelay: `${groupIndex * 50}ms` }}
                    >
                      {/* YES Column - Show maker if YES, or takers if maker is NO */}
                      <div className="space-y-2">
                        {maker.position === 'yes' ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarImage src={makerUser.profileImage} alt={makerUser.name} />
                              <AvatarFallback className="text-xs">{makerUser.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 max-w-[120px]">
                              <div className="text-xs font-medium text-foreground truncate">
                                {makerUser.name}
                              </div>
                              <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                                ${maker.amount} @ {maker.percentage}%
                              </div>
                            </div>
                          </div>
                        ) : (
                          takers.map((taker) => {
                            const { user: takerUser } = getTradeWithUser(taker);
                            if (!takerUser || taker.position !== 'yes') return null;
                            
                            return (
                              <div key={taker.id} className="flex items-center gap-2">
                                <Avatar className="w-8 h-8 flex-shrink-0">
                                  <AvatarImage src={takerUser.profileImage} alt={takerUser.name} />
                                  <AvatarFallback className="text-xs">{takerUser.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 max-w-[120px]">
                                  <div className="text-xs font-medium text-foreground truncate">
                                    {takerUser.name}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                                    ${taker.amount} @ {taker.percentage}%
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Connector Space */}
                      <div className="pl-2">
                        <div className={`${groupHasYesTakers ? 'pr-8' : 'pl-8'}`}>
                          <div className="relative" style={{ height: `${takers.length * 40 - 8}px` }}>
                            {takers.map((trade, index) => {
                              const isFirstOfGroup = index === 0;
                              const isSubsequentInGroup = index > 0;
                              const rowsToTop = index * 40;
                              const offsetTop = index * 40;

                              return (
                                <div key={trade.id} className="absolute w-full" style={{ top: `${offsetTop}px`, height: '32px' }}>
                                  {/* Horizontal line with gradient */}
                                  <div 
                                    className="absolute top-1/2 -translate-y-1/2 h-[2px]"
                                    style={{
                                      left: isFirstOfGroup && trade.position === 'no' ? '-25px' : '0',
                                      right: isFirstOfGroup && trade.position === 'yes' ? '-20px' : '0',
                                      background: 'linear-gradient(to right, rgb(34 197 94), rgb(239 68 68))'  // green (YES/left) to red (NO/right)
                                    }}
                                  />
                                  
                                  {isFirstOfGroup && (
                                    trade.position === 'no' ? (
                                      <div className="absolute top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-green-500" style={{ left: '-30px' }} />
                                    ) : (
                                      <div className="absolute top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-red-500" style={{ right: '-24px' }} />
                                    )
                                  )}
                                  
                                  {isSubsequentInGroup && (
                                    trade.position === 'no' ? (
                                      <div 
                                        className="absolute left-0 bottom-1/2 w-[2px]"
                                        style={{ 
                                          height: `${rowsToTop}px`,
                                          background: 'rgb(34 197 94)'  // green - matches left edge of horizontal gradient
                                        }}
                                      />
                                    ) : (
                                      <div 
                                        className="absolute right-0 bottom-1/2 w-[2px]"
                                        style={{ 
                                          height: `${rowsToTop}px`,
                                          background: 'rgb(239 68 68)'  // red - matches right edge of horizontal gradient
                                        }}
                                      />
                                    )
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* NO Column - Show maker if NO, or takers */}
                      <div className="space-y-2 w-[115px]">
                        {maker.position === 'no' ? (
                          <div className="flex items-center gap-2 pl-2">
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarImage src={makerUser.profileImage} alt={makerUser.name} />
                              <AvatarFallback className="text-xs">{makerUser.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-foreground truncate">
                                {makerUser.name}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                ${maker.amount} @ {maker.percentage}%
                              </div>
                            </div>
                          </div>
                        ) : (
                          takers.map((taker) => {
                            const { user: takerUser } = getTradeWithUser(taker);
                            if (!takerUser || taker.position !== 'no') return null;
                            
                            return (
                              <div key={taker.id} className="flex items-center gap-2 pl-2">
                                <Avatar className="w-8 h-8 flex-shrink-0">
                                  <AvatarImage src={takerUser.profileImage} alt={takerUser.name} />
                                  <AvatarFallback className="text-xs">{takerUser.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-foreground truncate">
                                    {takerUser.name}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    ${taker.amount} @ {taker.percentage}%
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </CardContent>

      {/* Bet Dialog */}
      <Dialog open={isBetDialogOpen} onOpenChange={setIsBetDialogOpen}>
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
                setIsBetDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePlaceBet}
              disabled={!betAmount || parseFloat(betAmount) <= 0}
              className={betChoice === 'yes' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              Place Bet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

