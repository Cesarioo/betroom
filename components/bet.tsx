'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
}

export default function Bet({
  title,
  imageUrl,
  amountAtStake,
  participants,
  percentage,
}: BetProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<'yes' | 'no' | null>(null);

  const displayedParticipants = participants.slice(0, 5);
  const remainingCount = Math.max(0, participants.length - 5);

  // Calculate color based on percentage (red to green gradient)
  const getColor = (percentage: number) => {
    if (percentage <= 33) return 'rgb(239, 68, 68)'; // red-500
    if (percentage <= 66) return 'rgb(234, 179, 8)'; // yellow-500
    return 'rgb(34, 197, 94)'; // green-500
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
            onClick={() => setSelectedAnswer('yes')}
            className={`flex-1 ${selectedAnswer === 'yes' ? 'bg-green-600 hover:bg-green-700 border-green-600' : ''}`}
          >
            Yes
          </Button>
          <Button
            variant={selectedAnswer === 'no' ? 'default' : 'outline'}
            onClick={() => setSelectedAnswer('no')}
            className={`flex-1 ${selectedAnswer === 'no' ? 'bg-red-600 hover:bg-red-700 border-red-600' : ''}`}
          >
            No
          </Button>
        </div>

        {/* Amount at Stake & Participants */}
        <div className="flex items-center justify-between pt-2">
          {/* Amount at Stake */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Amount at stake</span>
            <span className="text-sm font-bold text-foreground">${amountAtStake}</span>
          </div>

          {/* Participants */}
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-muted-foreground">Participants</span>
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
      </CardContent>
    </Card>
  );
}

