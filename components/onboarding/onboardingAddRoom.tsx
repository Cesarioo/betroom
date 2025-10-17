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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, Crown } from 'lucide-react';
import dbData from '@/backend/db.json';

interface AddGroupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomCreated?: (data: { roomName: string; memberIds: string[] }) => void;
}

export default function AddGroup({ open, onOpenChange, onRoomCreated }: AddGroupProps) {
  const [roomName, setRoomName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(['user_1']);
  const [crownedParticipants, setCrownedParticipants] = useState<string[]>(['user_1']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  // Get all participants except current user (user_1)
  const availableParticipants = dbData.users.filter(user => user.id !== 'user_1');
  
  // Filter participants by search query
  const filteredParticipants = availableParticipants.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setRoomName('');
      setSelectedParticipants(['user_1']);
      setCrownedParticipants(['user_1']);
      setSearchQuery('');
    }
  }, [open]);

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
      setSelectedParticipants(prev => prev.filter(id => id !== userId));
      setCrownedParticipants(prev => prev.filter(id => id !== userId));
    }
  };

  const handleAddGroup = () => {
    // TODO: Handle adding group logic here
    console.log('Room Name:', roomName);
    console.log('Selected Participants:', selectedParticipants);
    console.log('Crowned Participants:', crownedParticipants);
    
    // Call the callback if provided
    if (onRoomCreated) {
      onRoomCreated({
        roomName: roomName,
        memberIds: selectedParticipants
      });
    }
    
    // Reset and close
    setRoomName('');
    setSelectedParticipants(['user_1']);
    setCrownedParticipants(['user_1']);
    setSearchQuery('');
    onOpenChange(false);
  };

  const isComplete = roomName.trim() !== '' && selectedParticipants.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[calc(100vw-2rem)] max-w-[400px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add Group</DialogTitle>
          <DialogDescription>
            Select members and give your group a name.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {/* Selected Participants Display */}
          {selectedParticipants.length > 0 && (
            <div className="flex justify-center">
              <div className="flex -space-x-4">
                {selectedParticipants.map((userId, index) => {
                  const user = dbData.users.find(u => u.id === userId);
                  const isCrowned = crownedParticipants.includes(userId);
                  return user ? (
                    <div key={userId} className="relative" style={{ zIndex: selectedParticipants.length - index }}>
                      <Avatar className="w-16 h-16 ring-4 ring-background">
                        <AvatarImage src={user.profileImage} alt={user.name} />
                        <AvatarFallback className="text-lg">{user.name[0]}</AvatarFallback>
                      </Avatar>
                      {isCrowned && (
                        <Crown className="absolute -top-2 -right-2 h-6 w-6 text-red-500 fill-red-500" />
                      )}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Room Name Input */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Group Name</label>
            <Input
                  type="text"
              placeholder="My Awesome Group"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full"
            />
            </div>
            
          {/* Participants Selector */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Members</label>
            <Popover open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen} modal={true}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent dark:bg-primary/5 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {selectedParticipants.length === 0 ? (
                    <span className="text-muted-foreground">Select members</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-2">
                        {selectedParticipants.slice(0, 3).map((userId, index) => {
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
                      {selectedParticipants.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{selectedParticipants.length - 3}
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
            
                  {/* Users List */}
                  <div className="py-1 space-y-1 overflow-y-auto max-h-40 overscroll-contain"
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
              </PopoverContent>
            </Popover>
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

