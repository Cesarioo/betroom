'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import dbData from '@/backend/db.json';

interface OnboardingSliderProps {
  onComplete: (choice: 'yes' | 'no', percentage: number) => void;
}

export default function OnboardingSlider({ onComplete }: OnboardingSliderProps) {
  const [choice, setChoice] = useState<'yes' | 'no'>('yes');
  const [percentage, setPercentage] = useState(0);

  const handleSliderChange = (values: number[]) => {
    setPercentage(values[0]);
  };

  const handleChoiceChange = (newChoice: 'yes' | 'no') => {
    setChoice(newChoice);
  };

  const handleComplete = () => {
    if (choice === 'yes' && percentage === 60) {
      onComplete(choice, percentage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-8 mx-3 mb-8">
          {/* Slider container with avatar */}
          <div className="relative flex-1 py-2">
            {/* User avatar positioned at slider thumb */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 pointer-events-none transition-all"
              style={{ 
                left: `${choice === 'no' ? (100 - percentage) : percentage}%` 
              }}
            >
              <Avatar className={`w-12 h-12 border-4 ${choice === 'yes' ? 'border-green-500' : 'border-red-500'}`}>
                <AvatarImage src={dbData.users[0].profileImage} alt="You" />
                <AvatarFallback className="text-sm">Y</AvatarFallback>
              </Avatar>
            </div>
            
            <Slider
              value={[percentage]}
              onValueChange={handleSliderChange}
              max={100}
              min={0}
              step={10}
              className="[&_[role=slider]]:opacity-0"
              inverted={choice === 'no'}
            />
          </div>
          
          {/* Percentage Display - fixed width */}
          <span className="text-sm font-semibold text-foreground w-10 text-right">
            {percentage}%
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleChoiceChange('yes')}
            className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all ${
              choice === 'yes'
                ? 'bg-green-500/20 border-green-500 text-green-500'
                : 'border-border text-muted-foreground hover:border-green-500/50'
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => handleChoiceChange('no')}
            className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all ${
              choice === 'no'
                ? 'bg-red-500/20 border-red-500 text-red-500'
                : 'border-border text-muted-foreground hover:border-red-500/50'
            }`}
          >
            No
          </button>
        </div>
      </div>
      
      <div className="text-center">
        <Button 
          onClick={handleComplete}
          disabled={!(choice === 'yes' && percentage === 60)}
          className="w-full"
        >
          {choice === 'yes' && percentage === 60 ? 'Perfect! Continue' : 'Set YES at 60% to continue'}
        </Button>
      </div>
    </div>
  );
}
