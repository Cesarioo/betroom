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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, ChevronDown, Check, X } from 'lucide-react';
import dbData from '@/backend/db.json';

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
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get all participants except current user (user_1)
  const availableParticipants = dbData.users.filter(user => user.id !== 'user_1');
  
  // Filter participants by search query
  const filteredParticipants = availableParticipants.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Toggle participant selection
  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  // Remove a specific participant
  const removeParticipant = (userId: string) => {
    setSelectedParticipants(prev => prev.filter(id => id !== userId));
  };

  // Get browser timezone in GMT format
  const getTimezone = () => {
    const offset = -new Date().getTimezoneOffset() / 60;
    const sign = offset >= 0 ? '+' : '';
    return `GMT${sign}${offset}`;
  };

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
      selectedParticipants,
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
    setSelectedParticipants([]);
    setSearchQuery('');
    onOpenChange(false);
  };

  const isComplete = betName && imageUrl && expirationDate && amount && initialPercentage && selectedParticipants.length > 0;

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

          {/* Expiration Date and Participants */}
          <div className="grid grid-cols-2 gap-4">
            {/* Expiration Date */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Expiration ({getTimezone()})
              </label>
              <div className="relative">
                <Input
                  type="datetime-local"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Participants Selector */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Participants
              </label>
              <Popover open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className={selectedParticipants.length === 0 ? 'text-muted-foreground' : ''}>
                      {selectedParticipants.length === 0
                        ? 'Participants'
                        : `${selectedParticipants.length} selected`}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="flex flex-col">
                    {/* Search Input */}
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search participants..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    
                    {/* Selected Participants */}
                    {selectedParticipants.length > 0 && (
                      <div className="p-2 border-b bg-muted/50 max-h-20 overflow-y-auto">
                        <div className="flex flex-wrap gap-1">
                          {selectedParticipants.map((userId) => {
                            const user = availableParticipants.find(u => u.id === userId);
                            return user ? (
                              <div
                                key={userId}
                                className="flex items-center gap-1 bg-primary/10 text-primary rounded-md px-2 py-1 text-xs"
                              >
                                <Avatar className="w-4 h-4">
                                  <AvatarImage src={user.profileImage} alt={user.name} />
                                  <AvatarFallback className="text-[8px]">{user.name[0]}</AvatarFallback>
                                </Avatar>
                                <span>{user.name}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeParticipant(userId);
                                  }}
                                  className="hover:bg-primary/20 rounded-sm"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Participants List - Fixed height and scrollable */}
                    <div className="overflow-y-auto max-h-64">
                      {filteredParticipants.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No participants found
                        </div>
                      ) : (
                        filteredParticipants.map((user) => {
                          const isSelected = selectedParticipants.includes(user.id);
                          return (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => toggleParticipant(user.id)}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors"
                            >
                              <Avatar className="w-8 h-8 flex-shrink-0">
                                <AvatarImage src={user.profileImage} alt={user.name} />
                                <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                              </Avatar>
                              <span className="flex-1 text-left text-sm">{user.name}</span>
                              {isSelected && (
                                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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

