'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';

interface CreateBetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateBet({ open, onOpenChange }: CreateBetProps) {
  const [betName, setBetName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [amount, setAmount] = useState('');
  const [initialChoice, setInitialChoice] = useState<'yes' | 'no'>('yes');
  const [initialPercentage, setInitialPercentage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [betName]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clean up previous blob URL if it exists
      if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  const handleCreateBet = () => {
    console.log('Creating bet:', {
      betName,
      imageUrl,
      expirationDate,
      amount,
      initialChoice,
      initialPercentage,
    });
    // Clean up blob URL if it exists
    if (imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
    // Reset form
    setBetName('');
    setImageUrl('');
    setExpirationDate('');
    setAmount('');
    setInitialChoice('yes');
    setInitialPercentage('');
    onOpenChange(false);
  };

  const isComplete = betName && imageUrl && expirationDate && amount && initialPercentage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[calc(100vw-2rem)] max-w-[500px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create a Bet</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new bet for your room.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Top Row: Image, Title, Amount and Chance */}
          <div className="flex gap-3 mb-4 items-center">
            {/* Image Upload Area */}
            <button 
              type="button"
              onClick={handleImageClick}
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-md border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20 hover:border-primary/50 hover:bg-primary/5 transition-all flex-shrink-0 overflow-hidden"
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="Bet preview" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-6 h-6 text-muted-foreground" />
              )}
            </button>
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Title and Amount/Chance */}
            <div className="flex-1 flex flex-col justify-center">
              {/* Title Input */}
              <textarea
                ref={textareaRef}
                placeholder="Will it rain tomorrow SF?"
                value={betName}
                onChange={(e) => setBetName(e.target.value)}
                rows={1}
                className="w-full text-base sm:text-lg font-semibold border-0 bg-transparent px-0 py-0 resize-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground/50 text-foreground mb-1 leading-tight overflow-hidden"
                style={{ 
                  maxHeight: '3rem'
                }}
              />
              
              {/* Amount and Chance Row */}
              <div className="grid grid-cols-2 gap-2">
                {/* Amount */}
                <div className="flex items-center">
                  <span className="text-muted-foreground text-base sm:text-lg">$</span>
                  <input
                    type="number"
                    placeholder="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ width: `${Math.max((amount || '100').length, 3)}ch` }}
                    className="bg-transparent border-0 text-base sm:text-lg font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                {/* Chance/Percentage */}
                <div className="flex items-center">
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="100"
                    value={initialPercentage}
                    onChange={(e) => setInitialPercentage(e.target.value)}
                    style={{ width: `${Math.max((initialPercentage || '0').length, 1)}ch` }}
                    className="bg-transparent border-0 text-base sm:text-lg font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-muted-foreground text-base sm:text-lg">%</span>
                </div>
              </div>
            </div>
          </div>


          {/* Yes/No Position */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setInitialChoice('yes')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all ${
                initialChoice === 'yes'
                  ? 'bg-green-500/20 border-green-500 text-green-500'
                  : 'border-border text-muted-foreground hover:border-green-500/50'
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => setInitialChoice('no')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all ${
                initialChoice === 'no'
                  ? 'bg-red-500/20 border-red-500 text-red-500'
                  : 'border-border text-muted-foreground hover:border-red-500/50'
              }`}
            >
              No
            </button>
          </div>

          {/* Expiration Date */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Expiration</label>
            <div className="relative">
              <Input
                type="datetime-local"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            type="submit"
            onClick={handleCreateBet}
            disabled={!isComplete}
          >
            Create Bet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

