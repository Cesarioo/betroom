'use client';

import { useState, useEffect } from 'react';
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

interface AddGroupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddGroup({ open, onOpenChange }: AddGroupProps) {
  const [inviteCode, setInviteCode] = useState(['', '', '', '', '', '']);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setInviteCode(['', '', '', '', '', '']);
    }
  }, [open]);

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !inviteCode[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      const inputs = document.querySelectorAll<HTMLInputElement>('.code-input');
      inputs[index - 1]?.focus();
    }
  };

  const handleChange = (index: number, value: string) => {
    // Only allow single digit numbers
    if (value && !/^[0-9]$/.test(value)) return;
    
    const newCode = [...inviteCode];
    newCode[index] = value;
    setInviteCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const inputs = document.querySelectorAll<HTMLInputElement>('.code-input');
      inputs[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    const digits = pasteData.slice(0, 6).split('');
    
    const newCode = [...inviteCode];
    digits.forEach((digit, index) => {
      if (index < 6) newCode[index] = digit;
    });
    setInviteCode(newCode);

    // Focus the next empty input or last input
    const nextEmptyIndex = newCode.findIndex(val => !val);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    const inputs = document.querySelectorAll<HTMLInputElement>('.code-input');
    inputs[focusIndex]?.focus();
  };

  const handleAddGroup = () => {
    const code = inviteCode.join('');
    // TODO: Handle adding group logic here
    console.log('Invite code:', `${code.slice(0, 3)}-${code.slice(3)}`);
  };

  const isComplete = inviteCode.every(digit => digit !== '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Group</DialogTitle>
          <DialogDescription>
            Enter your invite code to join a group.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            {/* First 3 digits */}
            <div className="flex gap-1.5 sm:gap-2">
              {[0, 1, 2].map((index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={inviteCode[index]}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="code-input w-10 h-12 sm:w-14 sm:h-16 text-center text-lg sm:text-2xl font-bold border-2 border-input bg-background rounded-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                />
              ))}
            </div>
            
            {/* Dash separator */}
            <span className="text-lg sm:text-2xl font-bold text-muted-foreground">-</span>
            
            {/* Last 3 digits */}
            <div className="flex gap-1.5 sm:gap-2">
              {[3, 4, 5].map((index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={inviteCode[index]}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="code-input w-10 h-12 sm:w-14 sm:h-16 text-center text-lg sm:text-2xl font-bold border-2 border-input bg-background rounded-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                />
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-center">
          <Button
            type="submit"
            onClick={handleAddGroup}
            disabled={!isComplete}
          >
            Add Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

