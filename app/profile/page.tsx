'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  // Mock user data
  const userCash = 1250;
  const userInBets = 450;
  const userName = "Alex Johnson";
  const userEmail = "alex.johnson@email.com";
  const memberSince = "January 2024";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="w-full bg-background border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <Link 
            href="/homepage" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Profile</h1>
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-6 py-8">
        {/* Avatar and Basic Info */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <Avatar className="w-24 h-24">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" alt="Profile" />
            <AvatarFallback className="text-2xl">U</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-1">{userName}</h2>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
            <p className="text-xs text-muted-foreground mt-2">Member since {memberSince}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Cash</p>
            <p className="text-2xl font-bold text-foreground">${userCash}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">In Bets</p>
            <p className="text-2xl font-bold text-foreground">${userInBets}</p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Bets</span>
              <span className="text-sm font-semibold text-foreground">24</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Bets Won</span>
              <span className="text-sm font-semibold text-green-500">16</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Bets Lost</span>
              <span className="text-sm font-semibold text-red-500">8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Win Rate</span>
              <span className="text-sm font-semibold text-foreground">66.7%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rooms Joined</span>
              <span className="text-sm font-semibold text-foreground">2</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-3"
          >
            <Settings className="w-4 h-4" />
            Account Settings
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-3 text-red-500 hover:text-red-500 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}

