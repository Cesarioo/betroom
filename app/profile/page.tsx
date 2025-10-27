'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, LogOut, ChevronDown, Pen, Check, X, ArrowDownToLine, ArrowUpFromLine, ThumbsUp, ThumbsDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import AddMoney from './addMoney';
import { useSupabase } from '@/lib/hooks/supabase';
import { useRouter } from 'next/navigation';
import { useUserMoney } from '@/lib/database/money';

interface MoneyMovement {
  id: string;
  user_id: string;
  type: 'credit' | 'debit';
  amount: number;
  created_at: string;
}

export default function ProfilePage() {
  const [showBetHistory, setShowBetHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [moneyMode, setMoneyMode] = useState<'add' | 'withdraw'>('add');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Supabase integration
  const { supabase } = useSupabase();
  const router = useRouter();
  
  // User data from Supabase
  const [userProfile, setUserProfile] = useState<{
    pseudonym: string;
    avatar_url: string | null;
    email: string;
  } | null>(null);

  // Money state using custom hook
  const { currentBalance, userInBets, isLoading: isLoadingMoney } = useUserMoney();
  
  // Money movements from Supabase (for portfolio chart only)
  const [moneyMovements, setMoneyMovements] = useState<MoneyMovement[]>([]);
  const [portfolioData, setPortfolioData] = useState<Array<{ month: string; value: number }>>([]);
  
  // Statistics from Supabase
  const [totalBets, setTotalBets] = useState(0);
  const [betsWon, setBetsWon] = useState(0);
  const [betsLost, setBetsLost] = useState(0);
  const [winRate, setWinRate] = useState('0%');
  const [roomsJoined, setRoomsJoined] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // Bet history from Supabase
  const [betHistory, setBetHistory] = useState<Array<{
    id: string;
    title: string;
    imageUrl: string;
    userChoice: 'yes' | 'no';
    boughtAt: number;
    finalOutcome: number;
    amountBet: number;
    isResolved: boolean;
  }>>([]);
  
  // Editing state
  const [tempPseudonym, setTempPseudonym] = useState('');
  const [tempProfileImage, setTempProfileImage] = useState('');
  const memberSince = "January 2024";

  // Fetch money movements for portfolio chart only
  useEffect(() => {
    const fetchMoneyMovements = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        // Fetch all money movements for the user
        const { data: movements, error } = await supabase
          .from('money_movement')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching money movements:', error);
          return;
        }

        // Fetch trades to calculate money in bets over time
        const { data: trades, error: tradesError } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (tradesError) {
          console.error('Error fetching trades:', tradesError);
        }

        if (movements) {
          setMoneyMovements(movements);

          // Get all unique bet IDs to fetch bet details
          const betIds = trades ? [...new Set(trades.map(t => t.bet_id))] : [];
          
          // Fetch bet details
          let betsMap = new Map();
          if (betIds.length > 0) {
            const { data: bets } = await supabase
              .from('bets')
              .select('*')
              .in('id', betIds);
            
            betsMap = new Map(bets?.map(b => [b.id, b]) || []);
          }

          // Group by day and calculate cumulative balance (total cash + in bets)
          const dailyData = new Map<string, number>();
          let runningBalance = 0;

          // Track money in bets per day
          const moneyInBetsByDay = new Map<string, number>();

          movements.forEach((movement) => {
            const date = new Date(movement.created_at);
            const dayKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            runningBalance = movement.type === 'credit'
              ? runningBalance + movement.amount
              : runningBalance - movement.amount;
            
            // Calculate money in bets up to this day
            let moneyInBetsForDay = 0;
            if (trades) {
              trades.forEach((trade) => {
                const tradeDate = new Date(trade.created_at);
                if (tradeDate <= date) {
                  const bet = betsMap.get(trade.bet_id);
                  if (bet && !bet.is_resolved) {
                    moneyInBetsForDay += trade.amount;
                  }
                }
              });
            }
            
            moneyInBetsByDay.set(dayKey, moneyInBetsForDay);
            
            // Portfolio = cash + in bets
            dailyData.set(dayKey, runningBalance + moneyInBetsForDay);
          });

          // Convert to array format for the chart
          const chartData = Array.from(dailyData.entries()).map(([day, value]) => ({
            month: day,
            value,
          }));

          setPortfolioData(chartData);
        }
      } catch (err) {
        console.error('Error fetching money movements:', err);
      }
    };

    fetchMoneyMovements();
  }, [supabase]);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('pseudonym, avatar_url')
            .eq('id', user.id)
            .single();
          
          if (!error && profile) {
            setUserProfile({
              pseudonym: profile.pseudonym,
              avatar_url: profile.avatar_url,
              email: user.email || '',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchUserProfile();
  }, [supabase]);

  // Fetch statistics data
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        // Get all trades for the user
        const { data: trades, error: tradesError } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id);

        if (tradesError) {
          console.error('Error fetching trades:', tradesError);
          return;
        }

        if (trades && trades.length > 0) {
          // Get unique bet IDs to fetch bet details
          const betIds = [...new Set(trades.map(t => t.bet_id))];
          
          // Get all bet details for these trades
          const { data: bets, error: betsError } = await supabase
            .from('bets')
            .select('*')
            .in('id', betIds);

          if (betsError) {
            console.error('Error fetching bets:', betsError);
            return;
          }

          // Create a map of bet_id to bet data
          const betsMap = new Map(bets?.map(b => [b.id, b]) || []);

          // Calculate total bets
          setTotalBets(trades.length);

          // Calculate money in unresolved bets
          let moneyInUnresolved = 0;
          let wonCount = 0;
          let lostCount = 0;

          trades.forEach((trade) => {
            const bet = betsMap.get(trade.bet_id);
            
            if (!bet) return;

            // Check if bet is unresolved (is_resolved = false)
            if (!bet.is_resolved) {
              moneyInUnresolved += trade.amount;
            } else {
              // Check if user won or lost
              // User wins if their "side" matches the resolved_outcome
              const userSide = trade.side === 'yes' ? 100 : 0;
              const resolvedOutcome = bet.resolved_outcome;
              
              if (userSide === resolvedOutcome) {
                wonCount++;
              } else {
                lostCount++;
              }
            }
          });

          setBetsWon(wonCount);
          setBetsLost(lostCount);

          // Calculate win rate
          const totalResolved = wonCount + lostCount;
          const winRateValue = totalResolved > 0 ? (wonCount / totalResolved * 100).toFixed(1) : 0;
          setWinRate(`${winRateValue}%`);

          // Build bet history for all bets (resolved and current)
          const historyData: Array<{
            id: string;
            title: string;
            imageUrl: string;
            userChoice: 'yes' | 'no';
            boughtAt: number;
            finalOutcome: number;
            amountBet: number;
            isResolved: boolean;
          }> = [];

          trades.forEach((trade) => {
            const bet = betsMap.get(trade.bet_id);
            if (!bet) return;

            // Show all bets (resolved and current)
            historyData.push({
              id: trade.id,
              title: bet.title,
              imageUrl: bet.image_url || '',
              userChoice: trade.side as 'yes' | 'no',
              boughtAt: trade.price || 50,
              finalOutcome: bet.is_resolved ? (bet.resolved_outcome || 0) : -1, // -1 means current/unresolved
              amountBet: trade.amount,
              isResolved: bet.is_resolved,
            });
          });

          // Sort by most recent (descending)
          historyData.sort((a, b) => b.id.localeCompare(a.id));
          
          setBetHistory(historyData);
        }

        // Get rooms joined count
        const { data: roomMemberships, error: roomsError } = await supabase
          .from('room_members')
          .select('*')
          .eq('user_id', user.id);

        if (roomsError) {
          console.error('Error fetching room memberships:', roomsError);
        } else {
          setRoomsJoined(roomMemberships?.length || 0);
        }

      } catch (err) {
        console.error('Error fetching statistics:', err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStatistics();
  }, [supabase]);

  const handleEditClick = async () => {
    if (isEditing) {
      // Save changes
      if (!userProfile) return;
      
      setIsSaving(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let finalImageUrl = tempProfileImage;
        
        // If image is a blob URL, upload it to R2
        if (tempProfileImage.startsWith('blob:')) {
          const response = await fetch(tempProfileImage);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Generate filename with user's pseudonym
          const fileExtension = blob.type.split('/')[1] || 'jpg';
          const timestamp = Date.now();
          const sanitizedPseudonym = tempPseudonym.replace(/[^a-zA-Z0-9]/g, '');
          const fileName = `profiles/${sanitizedPseudonym}-${timestamp}.${fileExtension}`;
          
          // Upload to R2
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: (() => {
              const formData = new FormData();
              formData.append('file', new File([buffer], fileName, { type: blob.type }));
              formData.append('pseudonym', tempPseudonym);
              formData.append('fileType', 'profile');
              return formData;
            })(),
          });
          
          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image');
          }
          
          const { url } = await uploadResponse.json();
          finalImageUrl = url;
          
          // Clean up blob URL
          URL.revokeObjectURL(tempProfileImage);
        }

        // Update profile in Supabase
        const { error } = await supabase
          .from('profiles')
          .update({
            pseudonym: tempPseudonym,
            avatar_url: finalImageUrl,
          })
          .eq('id', user.id);

        if (error) {
          throw error;
        }

        // Update local state
        setUserProfile({
          pseudonym: tempPseudonym,
          avatar_url: finalImageUrl,
          email: userProfile.email,
        });
        
        setIsEditing(false);
      } catch (error) {
        console.error('Error saving profile:', error);
        // You might want to show an error message to the user here
      } finally {
        setIsSaving(false);
      }
    } else {
      // Start editing
      if (userProfile) {
        setTempPseudonym(userProfile.pseudonym);
        setTempProfileImage(userProfile.avatar_url || '');
        setIsEditing(true);
      }
    }
  };

  const handleCancelEdit = () => {
    if (userProfile) {
      setTempPseudonym(userProfile.pseudonym);
      // Clean up blob URL if it exists and we're canceling
      if (tempProfileImage.startsWith('blob:')) {
        URL.revokeObjectURL(tempProfileImage);
      }
      setTempProfileImage(userProfile.avatar_url || '');
      setIsEditing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
    };
  }, [tempProfileImage]);

  // Mock portfolio value data (last 7 months) - cumulative, always positive
  // const portfolioData = [
  //   { month: 'Apr', value: 1000 },
  //   { month: 'May', value: 1120 },
  //   { month: 'Jun', value: 1040 },
  //   { month: 'Jul', value: 1240 },
  //   { month: 'Aug', value: 1390 },
  //   { month: 'Sep', value: 1340 },
  //   { month: 'Oct', value: 1640 },
  // ];

  // const startingValue = portfolioData[0].value;
  // const currentValue = portfolioData[portfolioData.length - 1].value;
  // const totalPnL = currentValue - startingValue;

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
              <AvatarImage 
                src={isEditing ? tempProfileImage : (userProfile?.avatar_url || '')} 
                alt="Profile" 
              />
              <AvatarFallback className="text-2xl">
                {userProfile?.pseudonym?.[0] || 'U'}
              </AvatarFallback>
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
                <h2 className="text-xl font-bold text-foreground mb-1">
                  {userProfile?.pseudonym || 'Loading...'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {userProfile?.email || 'Loading...'}
                </p>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={tempPseudonym}
                  onChange={(e) => setTempPseudonym(e.target.value)}
                  className="text-xl font-bold text-foreground mb-1 bg-background border border-border rounded px-2 py-1 w-full focus:outline-none focus:border-primary"
                  placeholder="Pseudonym"
                />
                <p className="text-sm text-muted-foreground">
                  {userProfile?.email}
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button 
                  onClick={handleEditClick}
                  disabled={!userProfile}
                  className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Pen className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5 text-red-500 hover:text-red-600" />
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleEditClick}
                  disabled={isSaving || !tempPseudonym.trim()}
                  className="p-2 hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-5 h-5 text-green-500 hover:text-green-600" />
                  )}
                </button>
                <button 
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            <h3 className="text-lg font-semibold text-foreground">Portfolio: ${Math.round(currentBalance + userInBets)}</h3>
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
            {isLoadingMoney ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">Loading...</div>
              </div>
            ) : portfolioData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground text-center">
                  No transaction history yet.<br />
                  Add money to get started!
                </div>
              </div>
            ) : (
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
                        const startingValue = portfolioData[0]?.value || 0;
                        const monthChange = (payload[0].value as number) - startingValue;
                        const monthChangePercent = startingValue !== 0 
                          ? ((monthChange / startingValue) * 100).toFixed(1) 
                          : '0.0';
                        return (
                          <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[140px]">
                            <div className="text-center">
                              <p className="text-xs text-white/70 mb-1">{data.month}</p>
                              <p className="text-lg font-bold text-white">
                                ${data.value.toFixed(2)}
                              </p>
                              <p className={`text-xs font-medium mt-1 ${monthChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {monthChange >= 0 ? '+' : ''}{monthChange >= 0 ? '$' : '-$'}{Math.abs(monthChange).toFixed(2)} ({monthChange >= 0 ? '+' : ''}{monthChangePercent}%)
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
            )}
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
                 <span className="text-sm font-semibold text-foreground">${currentBalance.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-muted-foreground">In Bets</span>
                 <span className="text-sm font-semibold text-foreground">${userInBets.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-muted-foreground">Total Bets</span>
                 <span className="text-sm font-semibold text-foreground">{totalBets}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-muted-foreground">Bets Won</span>
                 <span className="text-sm font-semibold text-green-500">{betsWon}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-muted-foreground">Bets Lost</span>
                 <span className="text-sm font-semibold text-red-500">{betsLost}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-muted-foreground">Win Rate</span>
                 <span className="text-sm font-semibold text-foreground">{winRate}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-muted-foreground">Rooms Joined</span>
                 <span className="text-sm font-semibold text-foreground">{roomsJoined}</span>
               </div>
            </div>

                         {/* Bet History View */}
             <div className={`transition-all duration-300 ${
               showBetHistory 
                 ? 'opacity-100 translate-y-0' 
                 : 'opacity-0 translate-y-[-20px] pointer-events-none absolute inset-0'
             }`}>
               {betHistory.length === 0 ? (
                 <div className="text-center py-8 text-muted-foreground">
                   No bet history yet. Place your first bet to get started!
                 </div>
               ) : (
                 betHistory.map((bet, index) => {
                // Check if bet is current/unresolved
                const isCurrent = !bet.isResolved || bet.finalOutcome === -1;
                
                // For resolved bets, calculate win/loss
                const won = isCurrent ? false : ((bet.userChoice === 'yes' && bet.finalOutcome === 100) || 
                            (bet.userChoice === 'no' && bet.finalOutcome === 0));
                const pnl = isCurrent ? 0 : (won ? bet.amountBet * (100 / bet.boughtAt - 1) : -bet.amountBet);
                
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
                          <span>at {Math.round(bet.boughtAt)}%</span>
                          <span>•</span>
                          <span>${bet.amountBet}</span>
                        </div>
                      </div>

                      {/* Outcome Badge and PnL */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {isCurrent ? (
                          <>
                            <span className="text-sm font-bold text-right w-20 text-yellow-500">
                              Current
                            </span>
                            <div className="p-1.5 rounded-full bg-yellow-500/20 text-yellow-500">
                              <div className="w-4 h-4 rounded-full border-2 border-current"></div>
                            </div>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Withdraw Money Dialog */}
      <AddMoney 
        open={isAddMoneyOpen} 
        onOpenChange={setIsAddMoneyOpen}
        mode={moneyMode}
        currentBalance={currentBalance}
      />
    </div>
  );
}

