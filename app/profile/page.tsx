'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, LogOut, ChevronDown, Pen, Check, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { useState } from 'react';

export default function ProfilePage() {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [showBetHistory, setShowBetHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Mock user data
  const userCash = 1250;
  const userInBets = 450;
  const [userName, setUserName] = useState("Alex Johnson");
  const [userEmail, setUserEmail] = useState("alex.johnson@email.com");
  const [tempName, setTempName] = useState(userName);
  const [tempEmail, setTempEmail] = useState(userEmail);
  const memberSince = "January 2024";

  const handleEditClick = () => {
    if (isEditing) {
      // Save changes
      setUserName(tempName);
      setUserEmail(tempEmail);
      setIsEditing(false);
    } else {
      // Start editing
      setTempName(userName);
      setTempEmail(userEmail);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setTempName(userName);
    setTempEmail(userEmail);
    setIsEditing(false);
  };

  // Mock PnL data (last 7 months)
  const pnlData = [
    { month: 'Apr', value: 120, isProfit: true },
    { month: 'May', value: -80, isProfit: false },
    { month: 'Jun', value: 200, isProfit: true },
    { month: 'Jul', value: 150, isProfit: true },
    { month: 'Aug', value: -50, isProfit: false },
    { month: 'Sep', value: 300, isProfit: true },
    { month: 'Oct', value: 180, isProfit: true },
  ];

  const maxValue = Math.max(...pnlData.map(d => Math.abs(d.value)));
  const totalPnL = pnlData.reduce((sum, d) => sum + d.value, 0);

  // Mock bet history data
  const betHistory = [
    {
      id: 1,
      title: "Will it rain tomorrow in San Francisco?",
      imageUrl: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400&q=80",
      userChoice: 'yes' as const,
      boughtAt: 65,
      finalOutcome: 100,
      amountBet: 50,
    },
    {
      id: 2,
      title: "Will Bitcoin reach $100k by end of month?",
      imageUrl: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=400&q=80",
      userChoice: 'no' as const,
      boughtAt: 42,
      finalOutcome: 0,
      amountBet: 100,
    },
    {
      id: 3,
      title: "Will finish the project before deadline",
      imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&q=80",
      userChoice: 'yes' as const,
      boughtAt: 33,
      finalOutcome: 0,
      amountBet: 75,
    },
    {
      id: 4,
      title: "Stock market will hit new high this week",
      imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80",
      userChoice: 'yes' as const,
      boughtAt: 58,
      finalOutcome: 100,
      amountBet: 120,
    },
    {
      id: 5,
      title: "Lakers will win their next game",
      imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=80",
      userChoice: 'no' as const,
      boughtAt: 78,
      finalOutcome: 100,
      amountBet: 80,
    },
  ];

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
          <div className="w-9"></div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-6 py-8">
        {/* Avatar and Basic Info - Horizontal Layout */}
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="w-20 h-20 flex-shrink-0">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" alt="Profile" />
            <AvatarFallback className="text-2xl">U</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            {!isEditing ? (
              <>
                <h2 className="text-xl font-bold text-foreground mb-1">{userName}</h2>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="text-xl font-bold text-foreground mb-1 bg-background border border-border rounded px-2 py-1 w-full focus:outline-none focus:border-primary"
                  placeholder="Name"
                />
                <input
                  type="email"
                  value={tempEmail}
                  onChange={(e) => setTempEmail(e.target.value)}
                  className="text-sm text-muted-foreground bg-background border border-border rounded px-2 py-1 w-full focus:outline-none focus:border-primary"
                  placeholder="Email"
                />
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button 
                  onClick={handleEditClick}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <Pen className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </button>
                <Link href="/homepage">
                  <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                    <LogOut className="w-5 h-5 text-red-500 hover:text-red-600" />
                  </button>
                </Link>
              </>
            ) : (
              <>
                <button 
                  onClick={handleEditClick}
                  className="p-2 hover:bg-green-500/10 rounded-lg transition-colors"
                >
                  <Check className="w-5 h-5 text-green-500 hover:text-green-600" />
                </button>
                <button 
                  onClick={handleCancelEdit}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-red-500 hover:text-red-600" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* PnL Graph */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Profit & Loss</h3>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className={`text-lg font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalPnL >= 0 ? '+$' : '-$'}{Math.abs(totalPnL)}
              </p>
            </div>
          </div>
          
          {/* Line Graph */}
          <div className="relative h-40 mt-4">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.2" className="text-border" />
              
              {/* Line path */}
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className={totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}
                points={pnlData.map((data, index) => {
                  const x = (index / (pnlData.length - 1)) * 100;
                  const y = 50 - (data.value / maxValue) * 40;
                  return `${x},${y}`;
                }).join(' ')}
              />
              
              {/* Area under the line */}
              <polygon
                fill="currentColor"
                className={totalPnL >= 0 ? 'text-green-500/20' : 'text-red-500/20'}
                points={
                  pnlData.map((data, index) => {
                    const x = (index / (pnlData.length - 1)) * 100;
                    const y = 50 - (data.value / maxValue) * 40;
                    return `${x},${y}`;
                  }).join(' ') + ` 100,50 0,50`
                }
              />
            </svg>
            
            {/* Data points */}
            <div className="absolute inset-0 flex justify-between items-center">
              {pnlData.map((data, index) => {
                const yPosition = 50 - (data.value / maxValue) * 40;
                return (
                  <div 
                    key={index} 
                    className="flex flex-col items-center relative"
                    style={{ position: 'absolute', left: `${(index / (pnlData.length - 1)) * 100}%`, top: `${yPosition}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <button
                      onClick={() => setSelectedPoint(selectedPoint === index ? null : index)}
                      className={`w-3 h-3 rounded-full ${data.isProfit ? 'bg-green-500' : 'bg-red-500'} border-2 border-background cursor-pointer hover:scale-150 transition-transform ${selectedPoint === index ? 'scale-150' : ''}`}
                    />
                    
                    {/* Tooltip */}
                    {selectedPoint === index && (
                      <div className="absolute bottom-full mb-2 bg-card border border-border rounded-lg shadow-lg p-3 min-w-[120px] z-20">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">{data.month} 2024</p>
                          <p className={`text-lg font-bold ${data.isProfit ? 'text-green-500' : 'text-red-500'}`}>
                            {data.isProfit ? '+' : ''}{data.value > 0 ? '$' : '-$'}{Math.abs(data.value)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {data.isProfit ? 'Profit' : 'Loss'}
                          </p>
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border"></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Month labels */}
            <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-1">
              {pnlData.map((data, index) => (
                <span key={index} className="text-xs text-muted-foreground">
                  {data.month}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Statistics / Bet History */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Statistics</h3>
            <button
              onClick={() => setShowBetHistory(!showBetHistory)}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-all"
            >
              <span className="transition-all">{showBetHistory ? 'Back' : 'See More'}</span>
              <div className={`transition-transform duration-300 ${showBetHistory ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>
          </div>
          
          <div className="relative">
            {/* Statistics View */}
            <div className={`space-y-4 transition-all duration-300 ${
              showBetHistory 
                ? 'opacity-0 translate-y-[-20px] pointer-events-none absolute inset-0' 
                : 'opacity-100 translate-y-0'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cash Available</span>
                <span className="text-sm font-semibold text-foreground">${userCash}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">In Bets</span>
                <span className="text-sm font-semibold text-foreground">${userInBets}</span>
              </div>
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

            {/* Bet History View */}
            <div className={`space-y-4 transition-all duration-300 ${
              showBetHistory 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-[-20px] pointer-events-none absolute inset-0'
            }`}>
              {betHistory.map((bet) => {
                const won = (bet.userChoice === 'yes' && bet.finalOutcome === 100) || 
                            (bet.userChoice === 'no' && bet.finalOutcome === 0);
                const pnl = won ? bet.amountBet * (100 / bet.boughtAt - 1) : -bet.amountBet;
                
                return (
                  <Card key={bet.id} className="w-full">
                    <CardContent className="p-3 space-y-2">
                      {/* Top Row: Image, Title, and Outcome Badge */}
                      <div className="flex items-center gap-3">
                        {/* Square Image */}
                        <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          <Image
                            src={bet.imageUrl}
                            alt={bet.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>

                        {/* Title and Outcome */}
                        <div className="flex-1 flex items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold text-foreground line-clamp-2 flex-1">
                            {bet.title}
                          </h3>
                          
                          {/* Outcome Badge */}
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            won ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                          }`}>
                            {won ? 'WON' : 'LOST'}
                          </div>
                        </div>
                      </div>

                      {/* Bet Details */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-muted-foreground">Your Choice</span>
                          <span className={`font-semibold ${
                            bet.userChoice === 'yes' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {bet.userChoice.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-muted-foreground">Bought At</span>
                          <span className="font-semibold text-foreground">{bet.boughtAt}%</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-muted-foreground">Final Outcome</span>
                          <span className="font-semibold text-foreground">{bet.finalOutcome}%</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-muted-foreground">Amount Bet</span>
                          <span className="font-semibold text-foreground">${bet.amountBet}</span>
                        </div>
                      </div>

                      {/* PnL */}
                      <div className="pt-2 border-t border-border flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Profit/Loss</span>
                        <span className={`text-sm font-bold ${
                          pnl >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {pnl >= 0 ? '+' : ''}{pnl >= 0 ? '$' : '-$'}{Math.abs(pnl).toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

