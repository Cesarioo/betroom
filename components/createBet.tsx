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
import { Upload, ChevronDown, ChevronRight, Check, Crown } from 'lucide-react';
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
  const [crownedParticipants, setCrownedParticipants] = useState<string[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isExpirationOpen, setIsExpirationOpen] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const [showIndividualUsers, setShowIndividualUsers] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automatically open Rooms when popover opens
  useEffect(() => {
    if (isParticipantsOpen) {
      setShowRooms(true);
      setShowIndividualUsers(false);
    }
  }, [isParticipantsOpen]);

  // Reconstruct rooms from user data
  const reconstructRooms = () => {
    const roomsMap = new Map<string, { id: string; name: string; members: string[] }>();
    
    dbData.users.forEach(user => {
      if (user.rooms && Array.isArray(user.rooms)) {
        user.rooms.forEach((room: any) => {
          if (!roomsMap.has(room.id)) {
            roomsMap.set(room.id, {
              id: room.id,
              name: room.name,
              members: []
            });
          }
          roomsMap.get(room.id)!.members.push(user.id);
        });
      }
    });
    
    return Array.from(roomsMap.values());
  };
  
  const allRooms = reconstructRooms();
  
  // Get all rooms except "My Room" (room_0)
  const availableRooms = allRooms.filter(room => room.id !== 'room_0');
  
  // Get all participants except current user (user_1)
  const availableParticipants = dbData.users.filter(user => user.id !== 'user_1');
  
  // Filter rooms by search query (searches in room name and member names)
  const filteredRooms = availableRooms.filter(room => {
    const roomNameMatch = room.name.toLowerCase().includes(searchQuery.toLowerCase());
    const memberNamesMatch = room.members.some(memberId => {
      const user = dbData.users.find(u => u.id === memberId);
      return user && user.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
    return roomNameMatch || memberNamesMatch;
  });
  
  // Filter participants by search query
  const filteredParticipants = availableParticipants.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Toggle room selection and its members
  const toggleRoom = (roomId: string) => {
    const room = allRooms.find(r => r.id === roomId);
    if (!room) return;
    
    const isCurrentlySelected = selectedRooms.includes(roomId);
    
    if (isCurrentlySelected) {
      // Deselect room and remove its members from selectedParticipants
      setSelectedRooms(prev => prev.filter(id => id !== roomId));
      setSelectedParticipants(prev => 
        prev.filter(userId => !room.members.includes(userId) || userId === 'user_1')
      );
    } else {
      // Select room and add its members to selectedParticipants
      setSelectedRooms(prev => [roomId, ...prev]);
      const newMembers = room.members.filter(id => id !== 'user_1');
      setSelectedParticipants(prev => {
        const uniqueMembers = [...new Set([...newMembers, ...prev])];
        return uniqueMembers;
      });
    }
  };
  
  // Toggle between Rooms and Individual Users sections
  const handleToggleRooms = () => {
    setShowRooms(!showRooms);
    if (!showRooms) {
      setShowIndividualUsers(false); // Close Individual Users when opening Rooms
    }
  };
  
  const handleToggleIndividualUsers = () => {
    setShowIndividualUsers(!showIndividualUsers);
    if (!showIndividualUsers) {
      setShowRooms(false); // Close Rooms when opening Individual Users
    }
  };
  
  // Toggle participant selection (3-state cycle)
  const toggleParticipant = (userId: string) => {
    const isCurrentlySelected = selectedParticipants.includes(userId);
    const isCurrentlyCrowned = crownedParticipants.includes(userId);
    
    if (!isCurrentlySelected) {
      // State 1 -> State 2: Not selected -> Selected (no crown)
      setSelectedParticipants(prev => [userId, ...prev]);
    } else if (isCurrentlySelected && !isCurrentlyCrowned) {
      // State 2 -> State 3: Selected (no crown) -> Selected with crown
      setCrownedParticipants(prev => [userId, ...prev]);
    } else {
      // State 3 -> State 1: Selected with crown -> Not selected
      // Check if this user is part of any selected room
      const roomsWithUser = selectedRooms.filter(roomId => {
        const room = allRooms.find(r => r.id === roomId);
        return room && room.members.includes(userId);
      });
      
      // Deselect those rooms but keep all other participants
      if (roomsWithUser.length > 0) {
        setSelectedRooms(prev => prev.filter(id => !roomsWithUser.includes(id)));
      }
      
      // Remove the user from both selectedParticipants and crownedParticipants
      setSelectedParticipants(prev => prev.filter(id => id !== userId));
      setCrownedParticipants(prev => prev.filter(id => id !== userId));
    }
  };
  
  // Get all selected members (from rooms and individuals)
  const getAllSelectedMembers = () => {
    const roomMembers = selectedRooms.flatMap(roomId => {
      const room = allRooms.find(r => r.id === roomId);
      return room ? room.members : [];
    });
    return [...new Set([...roomMembers, ...selectedParticipants])].filter(id => id !== 'user_1');
  };
  
  const allSelectedMembers = getAllSelectedMembers();

  // Get browser timezone in GMT format
  const getTimezone = () => {
    const offset = -new Date().getTimezoneOffset() / 60;
    const sign = offset >= 0 ? '+' : '';
    return `GMT${sign}${offset}`;
  };

  // Calculate quick date options
  const getQuickDate = (option: 'tomorrow' | 'end-of-week' | 'end-of-month') => {
    const date = new Date();
    
    switch (option) {
      case 'tomorrow':
        date.setDate(date.getDate() + 1);
        break;
      case 'end-of-week':
        const daysUntilSunday = 7 - date.getDay();
        date.setDate(date.getDate() + daysUntilSunday);
        break;
      case 'end-of-month':
        date.setMonth(date.getMonth() + 1, 0); // Last day of current month
        break;
    }
    
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  // Format date for display
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
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
      selectedRooms,
      selectedParticipants,
      crownedParticipants,
      allSelectedMembers,
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
    setCrownedParticipants([]);
    setSelectedRooms([]);
    setSearchQuery('');
    setShowRooms(false);
    setShowIndividualUsers(false);
    onOpenChange(false);
  };

  const isComplete = betName && imageUrl && expirationDate && amount && initialPercentage && allSelectedMembers.length > 0;

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
              <Popover open={isExpirationOpen} onOpenChange={setIsExpirationOpen} modal={true}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className={expirationDate ? '' : 'text-muted-foreground'}>
                      {expirationDate ? formatDisplayDate(expirationDate) : 'Select date'}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-80 p-0" 
                  align="start" 
                  sideOffset={4}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="flex flex-col">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setExpirationDate(getQuickDate('tomorrow'));
                          setIsExpirationOpen(false);
                        }}
                        className="w-full flex items-center px-3 py-2 hover:bg-accent transition-colors text-sm"
                      >
                        Tomorrow
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setExpirationDate(getQuickDate('end-of-week'));
                          setIsExpirationOpen(false);
                        }}
                        className="w-full flex items-center px-3 py-2 hover:bg-accent transition-colors text-sm"
                      >
                        End of Week
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setExpirationDate(getQuickDate('end-of-month'));
                          setIsExpirationOpen(false);
                        }}
                        className="w-full flex items-center px-3 py-2 hover:bg-accent transition-colors text-sm"
                      >
                        End of Month
                      </button>
                      <div className="border-t p-2">
                        <div className="text-xs text-muted-foreground px-1 mb-1">Custom Date</div>
                        <Input
                          type="date"
                          value={expirationDate}
                          onChange={(e) => {
                            setExpirationDate(e.target.value);
                            setIsExpirationOpen(false);
                          }}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Participants Selector */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Participants
              </label>
              <Popover open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen} modal={true}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {allSelectedMembers.length === 0 ? (
                      <span className="text-muted-foreground">Participants</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <div className="flex -space-x-2">
                          {allSelectedMembers.slice(0, 3).map((userId, index) => {
                            const user = dbData.users.find(u => u.id === userId);
                            const isCrowned = crownedParticipants.includes(userId);
                            return user ? (
                              <div key={userId} className="relative" style={{ zIndex: 3 - index }}>
                                <Avatar className="w-6 h-6 ring-2 ring-background">
                                  <AvatarImage src={user.profileImage} alt={user.name} />
                                  <AvatarFallback className="text-[10px]">{user.name[0]}</AvatarFallback>
                                </Avatar>
                                {isCrowned && (
                                  <Crown className="absolute -top-1 -right-1 h-3 w-3 text-red-500 fill-red-500" />
                                )}
                              </div>
                            ) : null;
                          })}
                        </div>
                        {allSelectedMembers.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{allSelectedMembers.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-80 p-0 max-h-[calc(100vh-120px)]" 
                  align="start" 
                  sideOffset={4}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="flex flex-col">
                    {/* Search Input */}
                    <div className="border-b">
                      <div className="px-3 py-2 flex items-center min-h-[42px]">
                        <Input
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-[26px] text-sm"
                        />
                      </div>
                    </div>
                    
                    {/* Rooms Dropdown */}
                    <div className="border-b">
                      <button
                        type="button"
                        onClick={handleToggleRooms}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent transition-colors min-h-[42px]"
                      >
                        <span className="text-xs font-semibold text-muted-foreground">
                          Rooms
                        </span>
                        <ChevronRight 
                          className={`h-4 w-4 text-muted-foreground transition-transform ${showRooms ? 'rotate-90' : ''}`}
                        />
                      </button>
                    </div>
                    
                    {/* Rooms List - Collapsible */}
                    {showRooms && (
                      <div className="border-b overflow-hidden">
                        <div 
                          className="py-1 space-y-1 max-h-30 overflow-y-auto overscroll-contain"
                          onWheel={(e) => e.stopPropagation()}
                        >
                          {filteredRooms.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              No rooms found
                            </div>
                          ) : (
                            filteredRooms.map((room) => {
                            const isSelected = selectedRooms.includes(room.id);
                            const roomUsers = room.members.map(memberId => 
                              dbData.users.find(u => u.id === memberId)
                            ).filter(Boolean);
                            
                            return (
                              <button
                                key={room.id}
                                type="button"
                                onClick={() => toggleRoom(room.id)}
                                className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent transition-colors ${isSelected ? 'bg-accent/50' : ''}`}
                              >
                                <div className="flex -space-x-2 flex-shrink-0">
                                  {roomUsers.slice(0, 3).map((user) => (
                                    user && (
                                      <Avatar key={user.id} className="w-6 h-6">
                                        <AvatarImage src={user.profileImage} alt={user.name} />
                                        <AvatarFallback className="text-[10px]">{user.name[0]}</AvatarFallback>
                                      </Avatar>
                                    )
                                  ))}
                                </div>
                                <span className="flex-1 text-left text-sm">{room.name}</span>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                                )}
                              </button>
                            );
                          })
                        )}
                        </div>
                      </div>
                    )}
                    
                    {/* Individual Users Dropdown */}
                    <div className="border-b">
                      <button
                        type="button"
                        onClick={handleToggleIndividualUsers}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent transition-colors min-h-[42px]"
                      >
                        <span className="text-xs font-semibold text-muted-foreground">
                          Individual Users
                        </span>
                        <ChevronRight 
                          className={`h-4 w-4 text-muted-foreground transition-transform ${showIndividualUsers ? 'rotate-90' : ''}`}
                        />
                      </button>
                    </div>
                    
                    {/* Individual Users List - Collapsible */}
                    {showIndividualUsers && (
                      <div className="border-b overflow-hidden">
                        {/* Users List */}
                        <div 
                          className="py-1 space-y-1 overflow-y-auto max-h-30 overscroll-contain"
                          onWheel={(e) => e.stopPropagation()}
                        >
                          {filteredParticipants.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              No users found
                            </div>
                          ) : (
                            filteredParticipants.map((user) => {
                              const isSelected = selectedParticipants.includes(user.id);
                              const isCrowned = crownedParticipants.includes(user.id);
                              return (
                                <button
                                  key={user.id}
                                  type="button"
                                  onClick={() => toggleParticipant(user.id)}
                                  className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent transition-colors ${isSelected ? 'bg-accent/50' : ''}`}
                                >
                                  <Avatar className="w-6 h-6 flex-shrink-0">
                                    <AvatarImage src={user.profileImage} alt={user.name} />
                                    <AvatarFallback className="text-[10px]">{user.name[0]}</AvatarFallback>
                                  </Avatar>
                                  <span className="flex-1 text-left text-sm">{user.name}</span>
                                  {isSelected && (
                                    isCrowned ? (
                                      <Crown className="h-4 w-4 text-red-500 flex-shrink-0" />
                                    ) : (
                                      <Crown className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                                    )
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
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

