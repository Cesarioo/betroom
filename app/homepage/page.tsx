'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { useState, useRef } from 'react';
import AddRoom from '@/components/addRoom';
import CreateBet from '@/components/createBet';
import Bet from '@/components/bet/betCard';
import BetAnimation from '@/components/bet/betAnimation';
import dbData from '@/backend/db.json';

// Process data from database
const processRoomsAndBets = () => {
  const { users, bets, trades } = dbData;
  
  // Reconstruct rooms from user data
  const roomsMap = new Map<string, { id: string; name: string; isPersonal: boolean; memberIds: string[] }>();
  
  users.forEach(user => {
    if (user.rooms && Array.isArray(user.rooms)) {
      user.rooms.forEach((room: { id: string; name: string; isPersonal?: boolean }) => {
        if (!roomsMap.has(room.id)) {
          roomsMap.set(room.id, {
            id: room.id,
            name: room.name,
            isPersonal: room.isPersonal || false,
            memberIds: []
          });
        }
        roomsMap.get(room.id)!.memberIds.push(user.id);
      });
    }
  });
  
  // Process rooms with member details
  const processedRooms = Array.from(roomsMap.values()).map((room) => ({
    id: room.id === 'room_0' ? 0 : room.id === 'room_1' ? 1 : 2,
    name: room.name,
    isPersonal: room.isPersonal,
    members: room.memberIds.map((userId) => {
      const user = users.find((u) => u.id === userId);
      return user ? { name: user.name, image: user.profileImage } : { name: '', image: '' };
    }),
  }));

  // Calculate stake and participants for each bet
  const processedBets = bets.map((bet) => {
    const betTrades = trades.filter((t) => t.betId === bet.id);
    const totalStake = betTrades.reduce((sum, t) => sum + t.amount, 0);
    
    // Get unique participants
    const uniqueUserIds = [...new Set(betTrades.map((t) => t.userId))];
    const participants = uniqueUserIds.map((userId) => {
      const user = users.find((u) => u.id === userId);
      return user ? { name: user.name, image: user.profileImage } : { name: '', image: '' };
    });

    // Calculate current percentage (latest trade percentage for simplicity)
    const latestTrade = betTrades.length > 0 ? betTrades[betTrades.length - 1] : null;
    const currentPercentage = latestTrade ? latestTrade.percentage : 50;

    return {
      id: parseInt(bet.id.replace('bet_', '')),
      roomId: bet.roomId === 'room_0' ? 0 : bet.roomId === 'room_1' ? 1 : 2,
      title: bet.title,
      imageUrl: bet.imageUrl,
      amountAtStake: totalStake,
      participants,
      percentage: currentPercentage,
      expirationDate: bet.expirationDate,
    };
  });

  return { rooms: processedRooms, bets: processedBets };
};

const { rooms, bets } = processRoomsAndBets();

export default function Homepage() {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(0);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isCreateBetOpen, setIsCreateBetOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const roomRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Animation state
  const [showBetAnimation, setShowBetAnimation] = useState(false);
  const [animationData, setAnimationData] = useState<{
    choice: 'yes' | 'no';
    percentage: number;
    amount: string;
    userImage: string;
    userName: string;
  } | null>(null);
  
  // Swipe state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'horizontal' | 'vertical' | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Get current user data
  const currentUser = dbData.users.find((u) => u.id === 'user_1');
  const userCash = currentUser?.cash || 0;
  
  // Calculate user's total at stake from all their trades
  const userTrades = dbData.trades.filter((t) => t.userId === 'user_1');
  const userAtStake = userTrades.reduce((sum, t) => sum + t.amount, 0);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const triggerBetAnimation = (data: {
    choice: 'yes' | 'no';
    percentage: number;
    amount: string;
    userImage: string;
    userName: string;
  }) => {
    setAnimationData(data);
    setShowBetAnimation(true);
  };

  const handleRoomSelect = (roomId: number) => {
    setSelectedRoomId(roomId);
    
    // Scroll the selected room to the left
    const roomElement = roomRefs.current[roomId];
    const scrollContainer = scrollContainerRef.current;
    
    if (roomElement && scrollContainer) {
      const containerLeft = scrollContainer.getBoundingClientRect().left;
      const elementLeft = roomElement.getBoundingClientRect().left;
      const scrollLeft = scrollContainer.scrollLeft;
      
      // Calculate the target scroll position (with some padding)
      const targetScroll = scrollLeft + (elementLeft - containerLeft) - 24; // 24px padding
      
      scrollContainer.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  // Swipe handlers
  const minSwipeDistance = 100; // Minimum swipe distance for both animation and room change
  const minDirectionThreshold = 10; // Pixels to determine swipe direction

  // Check if any dialog is open
  const isAnyDialogOpen = () => {
    return isCreateBetOpen || isAddRoomOpen || document.querySelector('[role="dialog"]') !== null;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    // Don't allow swiping if a dialog is open
    if (isAnyDialogOpen()) return;
    
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
    setSwipeDirection(null);
    setIsSwiping(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    // Don't allow swiping if a dialog is open
    if (isAnyDialogOpen()) return;
    
    if (touchStart === null) return;
    
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    const diffX = currentX - touchStart.x;
    const diffY = currentY - touchStart.y;
    
    // Determine swipe direction once we have enough movement
    if (swipeDirection === null && (Math.abs(diffX) > minDirectionThreshold || Math.abs(diffY) > minDirectionThreshold)) {
      // Set direction based on which axis has more movement
      if (Math.abs(diffX) > Math.abs(diffY)) {
        setSwipeDirection('horizontal');
        setIsSwiping(true);
      } else {
        setSwipeDirection('vertical');
      }
    }
    
    // Only apply horizontal swipe logic if we've committed to horizontal direction
    if (swipeDirection === 'horizontal') {
      // Lock vertical scrolling
      e.preventDefault();
      
      // Only start animation after 100px threshold
      const adjustedDiff = Math.abs(diffX) > minSwipeDistance 
        ? (diffX > 0 ? diffX - minSwipeDistance : diffX + minSwipeDistance)
        : 0;
      
      setSwipeOffset(adjustedDiff);
    }
    
    setTouchEnd({ x: currentX, y: currentY });
  };

  const onTouchEnd = () => {
    // Don't process swipe if a dialog is open
    if (isAnyDialogOpen()) {
      setIsSwiping(false);
      setSwipeOffset(0);
      setTouchStart(null);
      setTouchEnd(null);
      setSwipeDirection(null);
      return;
    }
    
    if (!touchStart || !touchEnd) {
      setIsSwiping(false);
      setSwipeOffset(0);
      setSwipeDirection(null);
      return;
    }

    // Only process if this was a horizontal swipe
    if (swipeDirection === 'horizontal') {
      const distance = touchStart.x - touchEnd.x;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      // Get current room index
      const currentIndex = rooms.findIndex(r => r.id === selectedRoomId);

      if (isLeftSwipe && currentIndex < rooms.length - 1) {
        // Swipe left: go to next room
        handleRoomSelect(rooms[currentIndex + 1].id);
      } else if (isRightSwipe && currentIndex > 0) {
        // Swipe right: go to previous room
        handleRoomSelect(rooms[currentIndex - 1].id);
      }
    }

    // Reset swipe state completely after swipe
    setTouchStart(null);
    setTouchEnd(null);
    setSwipeOffset(0);
    setIsSwiping(false);
    setSwipeDirection(null);
  };

  // Calculate the transform offset based on selected room
  const currentRoomIndex = rooms.findIndex(r => r.id === selectedRoomId);
  const baseOffset = currentRoomIndex * -100; // -100% per room
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 375; // Default to mobile width
  const totalOffset = baseOffset + (swipeOffset / (mainContentRef.current?.offsetWidth || viewportWidth)) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <div className="w-full bg-background">
        <div className="flex items-center justify-between px-6 pt-4">
          {/* Logo on the left */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image
              src="/icon-512x512.png"
              alt="Betroom Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-semibold text-foreground">Betroom</span>
          </Link>

          {/* Sign In / Sign Up or User Info on the right */}
          {!isLoggedIn ? (
            <div className="flex items-center gap-6">
              <button 
                onClick={handleLogin}
                className="text-sm font-medium text-muted-foreground hover:text-accent-foreground transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={handleLogin}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Sign Up
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground">Cash</span>
                <span className="text-sm sm:text-base font-bold text-foreground">${userCash}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground">In Bets</span>
                <span className="text-sm sm:text-base font-bold text-foreground">${userAtStake}</span>
              </div>
              <Link href="/profile">
                <Avatar className="w-10 h-10 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80" alt="Profile" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Room Selector */}
      <div className="sticky top-0 z-10 w-full border-b border-border bg-background">
          <div 
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto py-4 scrollbar-hide snap-x snap-mandatory"
          >
            {rooms.map((room, index) => {
              const isPersonalRoom = room.id === 0 || room.isPersonal;
              return (
                <button
                  key={room.id}
                  ref={(el) => { roomRefs.current[room.id] = el; }}
                  onClick={() => handleRoomSelect(room.id)}
                  className={`flex items-center gap-3 min-w-fit snap-start group transition-all rounded-full px-4 py-2 ${
                    selectedRoomId === room.id
                      ? isPersonalRoom
                        ? 'opacity-100 bg-gradient-to-br from-yellow-500/40 to-amber-600/40 border border-yellow-500/60'
                        : 'opacity-100 bg-red-900/30 border border-red-800/50'
                      : 'opacity-60 hover:opacity-80 border border-transparent'
                  } ${index === 0 ? 'ml-6' : ''}`}
                >
                  {/* Avatar Group */}
                  <div className="flex -space-x-3">
                    {room.members.map((member, idx) => (
                      <Avatar 
                        key={idx} 
                        className={`w-10 h-10 ${isPersonalRoom && selectedRoomId === room.id ? 'ring-2 ring-yellow-500/50' : ''}`}
                      >
                        <AvatarImage src={member.image} alt={member.name} />
                        <AvatarFallback className="text-xs">{member.name[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {/* Room Name */}
                  <span className={`text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedRoomId === room.id
                      ? isPersonalRoom
                        ? 'text-yellow-300'
                        : 'text-red-300'
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`}>
                    {room.name}
                  </span>
                </button>
              );
            })}
            
            {/* Add New Room Button */}
            <button 
              onClick={() => setIsAddRoomOpen(true)}
              className="flex items-center gap-3 min-w-fit snap-start group opacity-60 hover:opacity-80 transition-opacity mr-6"
            >
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-all">
                <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
                Add Room
              </span>
            </button>
          </div>
      </div>

      {/* Main Content Area */}
      <main className="overflow-hidden">
        <div
          ref={mainContentRef}
          className="flex touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            transform: `translateX(${totalOffset}%)`,
            transition: isSwiping ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {rooms.map((room, index) => {
            // Filter bets for this specific room
            const roomBets = room.id === 0
              ? bets.filter(bet => {
                  const betId = `bet_${bet.id}`;
                  return dbData.trades.some(
                    trade => trade.betId === betId && trade.userId === 'user_1'
                  );
                })
              : bets.filter(bet => bet.roomId === room.id);

            // Calculate scale and opacity for peek effect
            const isCurrentRoom = room.id === selectedRoomId;
            const distanceFromCurrent = Math.abs(index - currentRoomIndex);
            const scale = isCurrentRoom ? 1 : 0.95;
            const opacity = isCurrentRoom ? 1 : 0.4;

            return (
              <div
                key={room.id}
                className="min-w-full px-6 py-8"
                style={{ 
                  width: '100%',
                  transform: `scale(${scale})`,
                  opacity: isSwiping ? (distanceFromCurrent <= 1 ? 0.6 : 0.3) : opacity,
                  transition: isSwiping ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  pointerEvents: isCurrentRoom ? 'auto' : 'none',
                }}
              >
                <div className="space-y-4">
                  {/* Create Bet Button */}
                  <button 
                    onClick={() => setIsCreateBetOpen(true)}
                    className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg py-4 flex items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      Create a Bet
                    </span>
                  </button>
                  
                  {/* Bets for this room */}
                  {roomBets.length > 0 ? (
                    roomBets.map((bet) => (
                      <Bet
                        key={bet.id}
                        id={bet.id}
                        roomId={bet.roomId}
                        title={bet.title}
                        imageUrl={bet.imageUrl}
                        amountAtStake={bet.amountAtStake}
                        participants={bet.participants}
                        percentage={bet.percentage}
                        expirationDate={bet.expirationDate}
                        onTriggerAnimation={triggerBetAnimation}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-muted-foreground">No bets in this room yet</p>
                      <p className="text-sm text-muted-foreground/60 mt-2">Create the first bet!</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Add Room Dialog */}
      <AddRoom open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen} />
      
      {/* Create Bet Dialog */}
      <CreateBet 
        open={isCreateBetOpen} 
        onOpenChange={setIsCreateBetOpen}
        onTriggerAnimation={triggerBetAnimation}
      />

      {/* Bet Proposal Animation */}
      {animationData && (
        <BetAnimation
          isOpen={showBetAnimation}
          onOpenChange={setShowBetAnimation}
          choice={animationData.choice}
          percentage={animationData.percentage}
          amount={animationData.amount}
          userImage={animationData.userImage}
          userName={animationData.userName}
        />
      )}
    </div>
  );
}

