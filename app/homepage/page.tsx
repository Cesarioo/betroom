'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import AddGroup from '@/components/addGroup';
import Bet from '@/components/bet';

// Mock data for groups
const groups = [
  {
    id: 1,
    name: 'Work Squad',
    members: [
      { name: 'John', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
      { name: 'Sarah', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
      { name: 'Mike', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
    ]
  },
  {
    id: 2,
    name: 'Friends',
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
    groupId: 1,
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
    groupId: 1,
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
    groupId: 1,
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
    groupId: 1,
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
    groupId: 1,
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
    groupId: 2,
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
    groupId: 2,
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
    groupId: 2,
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
    groupId: 2,
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
    groupId: 2,
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
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(1);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);

  // Filter bets by selected group
  const filteredBets = selectedGroupId 
    ? bets.filter(bet => bet.groupId === selectedGroupId)
    : bets;

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

          {/* Sign In / Sign Up on the right */}
          <div className="flex items-center gap-6">
            <Link 
              href="/signin" 
              className="text-sm font-medium text-muted-foreground hover:text-accent-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      {/* Sticky Group Selector */}
      <div className="sticky top-0 z-10 w-full border-b border-border bg-background">
          <div className="flex gap-6 overflow-x-auto py-4 scrollbar-hide snap-x snap-mandatory">
            {groups.map((group, index) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`flex items-center gap-3 min-w-fit snap-start group transition-all rounded-full px-4 py-2 ${
                  selectedGroupId === group.id 
                    ? 'opacity-100 bg-red-900/30 border border-red-800/50' 
                    : 'opacity-60 hover:opacity-80 border border-transparent'
                } ${index === 0 ? 'ml-6' : ''}`}
              >
                {/* Avatar Group */}
                <div className="flex -space-x-3">
                  {group.members.map((member, idx) => (
                    <Avatar 
                      key={idx} 
                      className="w-10 h-10"
                    >
                      <AvatarImage src={member.image} alt={member.name} />
                      <AvatarFallback className="text-xs">{member.name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {/* Group Name */}
                <span className={`text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedGroupId === group.id
                    ? 'text-red-300'
                    : 'text-muted-foreground group-hover:text-foreground'
                }`}>
                  {group.name}
                </span>
              </button>
            ))}
            
            {/* Add New Group Button */}
            <button 
              onClick={() => setIsAddGroupOpen(true)}
              className="flex items-center gap-3 min-w-fit snap-start group opacity-60 hover:opacity-80 transition-opacity mr-6"
            >
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-all">
                <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
                Add Group
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

      {/* Add Group Dialog */}
      <AddGroup open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen} />
    </div>
  );
}

