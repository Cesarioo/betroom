'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import AddGroup from '@/components/addGroup';

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
    name: 'College Friends',
    members: [
      { name: 'Emma', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
      { name: 'Alex', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
      { name: 'Lisa', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa' },
    ]
  },
  {
    id: 3,
    name: 'Family',
    members: [
      { name: 'Dad', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dad' },
      { name: 'Mom', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mom' },
      { name: 'Sis', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sis' },
    ]
  },
  {
    id: 4,
    name: 'Gaming Crew',
    members: [
      { name: 'Tyler', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tyler' },
      { name: 'Nina', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nina' },
      { name: 'Chris', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chris' },
    ]
  },
  {
    id: 5,
    name: 'Neighborhood',
    members: [
      { name: 'Tom', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom' },
      { name: 'Jenny', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jenny' },
      { name: 'Dave', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dave' },
    ]
  },
];

export default function Homepage() {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(1);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Navigation and Group Selector */}
      <header className="w-full border-b border-border">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-4">
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

        {/* Group Selector Slider */}
        <div className="pb-4">
          <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory pl-6">
            {groups.map((group, index) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`flex items-center gap-3 min-w-fit snap-start group transition-all rounded-full px-4 py-2 ${
                  selectedGroupId === group.id 
                    ? 'opacity-100 bg-red-900/30 border border-red-800/50' 
                    : 'opacity-60 hover:opacity-80 border border-transparent'
                } ${index === groups.length - 1 ? 'mr-6' : ''}`}
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
      </header>

      {/* Main Content Area - Ready for future content */}
      <main className="px-6 py-8">
        {/* Content will go here */}
      </main>

      {/* Add Group Dialog */}
      <AddGroup open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen} />
    </div>
  );
}

