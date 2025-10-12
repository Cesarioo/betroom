'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, ChevronUp } from 'lucide-react';
import dbData from '@/backend/db.json';
import BetDialog from './betDialog';
import BetParticipants from './betParticipants';

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

  const handleBetClick = (choice: 'yes' | 'no') => {
    setBetChoice(choice);
    setSelectedAnswer(choice);
    setIsBetDialogOpen(true);
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
          <div className="flex-1 flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-foreground line-clamp-2">
                {title}
              </h3>

              {/* Participants betting text */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {participants.slice(0, 3).map((participant, idx) => (
                    <Avatar key={idx} className="w-5 h-5">
                      <AvatarImage src={participant.image} alt={participant.name} />
                      <AvatarFallback className="text-[8px]">
                        {participant.name[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {participants.length > 0 && (
                    <>
                      {participants[0]?.name}
                      {participants.length > 1 && `, ${participants[1]?.name}`}
                      {participants.length > 2 && ' and others'}
                      {' are betting!'}
                    </>
                  )}
                </span>
              </div>
            </div>
            
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
        <BetParticipants 
          isExpanded={isExpanded}
          betTrades={betTrades}
        />
      </CardContent>

      {/* Bet Dialog */}
      <BetDialog
        isOpen={isBetDialogOpen}
        onOpenChange={setIsBetDialogOpen}
        title={title}
        betChoice={betChoice}
        percentage={percentage}
        betAmount={betAmount}
        setBetAmount={setBetAmount}
        onPlaceBet={handlePlaceBet}
      />
    </Card>
  );
}

