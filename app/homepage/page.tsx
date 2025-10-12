'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { useState, useRef } from 'react';
import AddRoom from '@/components/addRoom';
import Bet from '@/components/bet';

// Mock data for rooms
const rooms = [
  {
    id: 1,
    name: 'Work Room',
    members: [
      { name: 'John', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
      { name: 'Sarah', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
      { name: 'Mike', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
    ]
  },
  {
    id: 2,
    name: 'Friends Room',
    members: [
      { name: 'Emma', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
      { name: 'Alex', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
      { name: 'Lisa', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa' },
    ]
  },
];

// Mock data for bets
const bets = [
  {
    id: 1,
    roomId: 1,
    title: "Will it rain tomorrow in San Francisco?",
    imageUrl: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400&q=80",
    amountAtStake: 250,
    participants: [
      { name: 'John', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
      { name: 'Sarah', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
      { name: 'Mike', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
    ],
    percentage: 65
  },
  {
    id: 2,
    roomId: 1,
    title: "Will Bitcoin reach $100k by end of month?",
    imageUrl: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=400&q=80",
    amountAtStake: 500,
    participants: [
      { name: 'John', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
      { name: 'Sarah', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
      { name: 'Mike', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
    ],
    percentage: 42
  },
  {
    id: 3,
    roomId: 1,
    title: "Will finish the project before deadline",
    imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&q=80",
    amountAtStake: 100,
    participants: [
      { name: 'John', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
      { name: 'Sarah', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
      { name: 'Mike', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
    ],
    percentage: 33
  },
  {
    id: 4,
    roomId: 1,
    title: "Stock market will hit new high this week",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80",
    amountAtStake: 400,
    participants: [
      { name: 'John', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
      { name: 'Sarah', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    ],
    percentage: 58
  },
  {
    id: 5,
    roomId: 1,
    title: "CEO will announce layoffs this month",
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80",
    amountAtStake: 200,
    participants: [
      { name: 'John', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
      { name: 'Mike', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
    ],
    percentage: 72
  },
  {
    id: 6,
    roomId: 2,
    title: "Lakers will win their next game",
    imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=80",
    amountAtStake: 150,
    participants: [
      { name: 'Emma', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
      { name: 'Alex', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
      { name: 'Lisa', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa' },
    ],
    percentage: 78
  },
  {
    id: 7,
    roomId: 2,
    title: "New iPhone will be announced next week",
    imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&q=80",
    amountAtStake: 320,
    participants: [
      { name: 'Emma', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
      { name: 'Alex', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
      { name: 'Lisa', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa' },
    ],
    percentage: 55
  },
  {
    id: 8,
    roomId: 2,
    title: "Will get concert tickets before they sell out",
    imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&q=80",
    amountAtStake: 180,
    participants: [
      { name: 'Emma', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
      { name: 'Lisa', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa' },
    ],
    percentage: 45
  },
  {
    id: 9,
    roomId: 2,
    title: "New restaurant will open by next month",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",
    amountAtStake: 90,
    participants: [
      { name: 'Emma', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
      { name: 'Alex', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    ],
    percentage: 67
  },
  {
    id: 10,
    roomId: 2,
    title: "Summer vacation trip will happen",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
    amountAtStake: 600,
    participants: [
      { name: 'Emma', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
      { name: 'Alex', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
      { name: 'Lisa', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa' },
    ],
    percentage: 88
  }
];

export default function Homepage() {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(1);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userCash, setUserCash] = useState(1250);
  const [userAtStake, setUserAtStake] = useState(450);
  const roomRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // Filter bets by selected room
  const filteredBets = selectedRoomId 
    ? bets.filter(bet => bet.roomId === selectedRoomId)
    : bets;

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
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" alt="Profile" />
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
            {rooms.map((room, index) => (
              <button
                key={room.id}
                ref={(el) => { roomRefs.current[room.id] = el; }}
                onClick={() => handleRoomSelect(room.id)}
                className={`flex items-center gap-3 min-w-fit snap-start group transition-all rounded-full px-4 py-2 ${
                  selectedRoomId === room.id 
                    ? 'opacity-100 bg-red-900/30 border border-red-800/50' 
                    : 'opacity-60 hover:opacity-80 border border-transparent'
                } ${index === 0 ? 'ml-6' : ''}`}
              >
                {/* Avatar Group */}
                <div className="flex -space-x-3">
                  {room.members.map((member, idx) => (
                    <Avatar 
                      key={idx} 
                      className="w-10 h-10"
                    >
                      <AvatarImage src={member.image} alt={member.name} />
                      <AvatarFallback className="text-xs">{member.name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {/* Room Name */}
                <span className={`text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedRoomId === room.id
                    ? 'text-red-300'
                    : 'text-muted-foreground group-hover:text-foreground'
                }`}>
                  {room.name}
                </span>
              </button>
            ))}
            
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
      <main className="px-6 py-8">
        <div className="space-y-4">
          {filteredBets.map((bet) => (
            <Bet
              key={bet.id}
              id={bet.id}
              title={bet.title}
              imageUrl={bet.imageUrl}
              amountAtStake={bet.amountAtStake}
              participants={bet.participants}
              percentage={bet.percentage}
            />
          ))}
        </div>
      </main>

      {/* Add Room Dialog */}
      <AddRoom open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen} />
    </div>
  );
}

