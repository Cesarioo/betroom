'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, LogOut, ChevronDown, Pen, Check, X, ArrowDownToLine, ArrowUpFromLine, ThumbsUp, ThumbsDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import AddMoney from './addMoney';

export default function ProfilePage() {
  const [showBetHistory, setShowBetHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [moneyMode, setMoneyMode] = useState<'add' | 'withdraw'>('add');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Mock user data
  const userCash = 1250;
  const userInBets = 450;
  const [userName, setUserName] = useState("Alex Johnson");
  const [userEmail, setUserEmail] = useState("alex.johnson@email.com");
  const [tempName, setTempName] = useState(userName);
  const [tempEmail, setTempEmail] = useState(userEmail);
  const [profileImage, setProfileImage] = useState("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80");
  const [tempProfileImage, setTempProfileImage] = useState(profileImage);
  const memberSince = "January 2024";

  const handleEditClick = () => {
    if (isEditing) {
      // Save changes
      setUserName(tempName);
      setUserEmail(tempEmail);
      setProfileImage(tempProfileImage);
      setIsEditing(false);
    } else {
      // Start editing
      setTempName(userName);
      setTempEmail(userEmail);
      setTempProfileImage(profileImage);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setTempName(userName);
    setTempEmail(userEmail);
    // Clean up blob URL if it exists and we're canceling
    if (tempProfileImage.startsWith('blob:')) {
      URL.revokeObjectURL(tempProfileImage);
    }
    setTempProfileImage(profileImage);
    setIsEditing(false);
  };

  const handleImageClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clean up previous blob URL if it exists
      if (tempProfileImage.startsWith('blob:')) {
        URL.revokeObjectURL(tempProfileImage);
      }
      const url = URL.createObjectURL(file);
      setTempProfileImage(url);
    }
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (tempProfileImage.startsWith('blob:')) {
        URL.revokeObjectURL(tempProfileImage);
      }
      if (profileImage.startsWith('blob:')) {
        URL.revokeObjectURL(profileImage);
      }
    };
  }, [tempProfileImage, profileImage]);

  // Mock portfolio value data (last 7 months) - cumulative, always positive
  const portfolioData = [
    { month: 'Apr', value: 1000 },
    { month: 'May', value: 1120 },
    { month: 'Jun', value: 1040 },
    { month: 'Jul', value: 1240 },
    { month: 'Aug', value: 1390 },
    { month: 'Sep', value: 1340 },
    { month: 'Oct', value: 1640 },
  ];

  const startingValue = portfolioData[0].value;
  const currentValue = portfolioData[portfolioData.length - 1].value;
  const totalPnL = currentValue - startingValue;

  // Mock bet history data
  const betHistory = [
    {
      id: 1,
      title: "Will it rain tomorrow in SF?",
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
          <div className="relative w-20 h-20 flex-shrink-0">
            <Avatar className="w-20 h-20">
              <AvatarImage src={isEditing ? tempProfileImage : profileImage} alt="Profile" />
              <AvatarFallback className="text-2xl">U</AvatarFallback>
            </Avatar>
            {isEditing && (
              <button
                onClick={handleImageClick}
                className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center text-white text-xs font-medium hover:bg-black/70 transition-all cursor-pointer"
              >
                Modify
              </button>
            )}
          </div>
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
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

        {/* Portfolio Value Graph */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Portfolio: ${currentValue}</h3>
            <div className="flex items-center gap-2">
            <button
                onClick={() => {
                  setMoneyMode('withdraw');
                  setIsAddMoneyOpen(true);
                }}
                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                title="Withdraw Money"
              >
                <ArrowUpFromLine className="w-5 h-5 text-red-500" />
              </button>
              <button
                onClick={() => {
                  setMoneyMode('add');
                  setIsAddMoneyOpen(true);
                }}
                className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors"
                title="Add Money"
              >
                <ArrowDownToLine className="w-5 h-5 text-green-500" />
              </button>
            </div>
          </div>
          
          {/* Recharts Graph */}
          <div className="w-full h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={portfolioData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis 
                  dataKey="month" 
                  stroke="#ffffff"
                  fontSize={12}
                  tickLine={false}
                  tick={{ fill: '#ffffff' }}
                />
                <YAxis 
                  stroke="#ffffff"
                  fontSize={12}
                  tickLine={false}
                  tick={{ fill: '#ffffff' }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const monthChange = payload[0].value as number - startingValue;
                      const monthChangePercent = ((monthChange / startingValue) * 100).toFixed(1);
                      return (
                        <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[140px]">
                          <div className="text-center">
                            <p className="text-xs text-white/70 mb-1">{data.month} 2024</p>
                            <p className="text-lg font-bold text-white">
                              ${data.value}
                            </p>
                            <p className={`text-xs font-medium mt-1 ${monthChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {monthChange >= 0 ? '+' : ''}{monthChange >= 0 ? '$' : '-$'}{Math.abs(monthChange)} ({monthChange >= 0 ? '+' : ''}{monthChangePercent}%)
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#22c55e"
                  strokeWidth={3}
                  fill="url(#portfolioGradient)"
                  dot={{ 
                    r: 5, 
                    strokeWidth: 2,
                    stroke: '#1a1a1a',
                    fill: '#22c55e'
                  }}
                  activeDot={{ 
                    r: 7,
                    strokeWidth: 3,
                    stroke: '#1a1a1a',
                    fill: '#22c55e'
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
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
            <div className={`transition-all duration-300 ${
              showBetHistory 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-[-20px] pointer-events-none absolute inset-0'
            }`}>
              {betHistory.map((bet, index) => {
                const won = (bet.userChoice === 'yes' && bet.finalOutcome === 100) || 
                            (bet.userChoice === 'no' && bet.finalOutcome === 0);
                const pnl = won ? bet.amountBet * (100 / bet.boughtAt - 1) : -bet.amountBet;
                
                return (
                  <div key={bet.id} className="w-full">
                    {/* Separator */}
                    {index > 0 && <div className="border-t border-border mb-4" />}
                    
                    <div className="flex items-center gap-3 mb-4">
                      {/* Square Image */}
                      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={bet.imageUrl}
                          alt={bet.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>

                      {/* Title and Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate mb-1">
                          {bet.title}
                        </h3>
                        
                        {/* Bet Info in one line */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className={`font-semibold ${
                            bet.userChoice === 'yes' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {bet.userChoice.toUpperCase()}
                          </span>
                          <span>at {bet.boughtAt}%</span>
                          <span>•</span>
                          <span>${bet.amountBet}</span>
                        </div>
                      </div>

                      {/* Outcome Badge and PnL */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-sm font-bold text-right w-20 ${
                          pnl >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {pnl >= 0 ? '+' : ''}{pnl >= 0 ? '$' : '-$'}{Math.abs(pnl).toFixed(2)}
                        </span>
                        
                        <div className={`p-1.5 rounded-full ${
                          won ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                        }`}>
                          {won ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Withdraw Money Dialog */}
      <AddMoney 
        open={isAddMoneyOpen} 
        onOpenChange={setIsAddMoneyOpen}
        mode={moneyMode}
        currentBalance={userCash}
      />
    </div>
  );
}

