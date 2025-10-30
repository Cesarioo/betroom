'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, ChevronUp } from 'lucide-react';
import BetDialog from './betDialog';
import BetParticipants from './betParticipants';
import ResolveDialog from './resolve';
import { useSupabase } from '@/lib/hooks/supabase';

interface Participant {
  name: string;
  image: string;
}

interface Trade {
  id: string;
  bet_id: string;
  user_id: string;
  side: 'yes' | 'no';
  price: number;
  amount: number;
  maker_trade_id: string | null;
}

interface BetProps {
  id: string;
  roomId: number;
  title: string;
  imageUrl: string;
  amountAtStake: number;
  participants: Participant[];
  percentage: number;
  expirationDate: string;
  onTriggerAnimation: (data: {
    choice: 'yes' | 'no';
    percentage: number;
    amount: string;
    userImage: string;
    userName: string;
  }) => void;
}

export default function Bet({
  id,
  roomId,
  title,
  imageUrl,
  amountAtStake,
  participants,
  percentage,
  expirationDate,
  onTriggerAnimation,
}: BetProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<'yes' | 'no' | null>(null);
  const [isBetDialogOpen, setIsBetDialogOpen] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [betAmount, setBetAmount] = useState('');
  const [betChoice, setBetChoice] = useState<'yes' | 'no'>('yes');
  const [isExpanded, setIsExpanded] = useState(false);
  const [initialDialogMode, setInitialDialogMode] = useState<'take' | 'propose'>('take');

  const { supabase } = useSupabase();
  const displayedParticipants = participants.slice(0, 3);
  const remainingCount = Math.max(0, participants.length - 3);

  // Supabase data state
  const [betTrades, setBetTrades] = useState<Trade[]>([]);
  const [currentUser, setCurrentUser] = useState<{ pseudonym: string; avatar_url: string | null } | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [tradeUsers, setTradeUsers] = useState<Map<string, { pseudonym: string; avatar_url: string | null }>>(new Map());
  const [calculatedAmountAtStake, setCalculatedAmountAtStake] = useState(0);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchBetData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setCurrentUser(profile ? { pseudonym: profile.pseudonym, avatar_url: profile.avatar_url } : null);

        // Check if user is admin of this bet
        const { data: participant } = await supabase
          .from('bet_participants')
          .select('is_admin')
          .eq('bet_id', id)
          .eq('user_id', user.id)
          .single();
        
        setIsUserAdmin(participant?.is_admin || false);

        // Get all trades for this bet
        const { data: trades } = await supabase
          .from('trades')
          .select('*')
          .eq('bet_id', id);

        setBetTrades((trades as Trade[]) || []);

        // Calculate total stake from all trades
        const totalStake = (trades as Trade[] | null)?.reduce((sum: number, t: Trade) => sum + t.amount, 0) || 0;
        setCalculatedAmountAtStake(totalStake);

        // Get unique user IDs from trades
        const userIds = [...new Set(((trades as Trade[] | null) || []).map((t) => t.user_id))];
        
        // Fetch user profiles for all traders
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, pseudonym, avatar_url')
            .in('id', userIds);

          const usersMap = new Map((profiles as Array<{ id: string; pseudonym: string; avatar_url: string | null }> | null)?.map((p) => [p.id, { pseudonym: p.pseudonym, avatar_url: p.avatar_url }]) || []);
          setTradeUsers(usersMap);
        }
      } catch (error) {
        console.error('Error fetching bet data:', error);
      }
    };

    fetchBetData();
  }, [supabase, id]);

  // Identify makers (trades with maker_trade_id === null)
  const makerTrades = betTrades.filter((t) => t.maker_trade_id === null);
  
  // Group makers by side - makers on YES side show on NO button (opposite side)
  // and makers on NO side show on YES button (opposite side)
  const yesButtonOrders = makerTrades.filter((t) => t.side === 'no'); // NO makers show on YES button
  const noButtonOrders = makerTrades.filter((t) => t.side === 'yes'); // YES makers show on NO button

  // Calculate weighted mid price between YES and NO sides (only from makers)
  const calculateWeightedPercentage = () => {
    if (makerTrades.length === 0) return percentage; // fallback to prop if no makers
    
    // Get all YES and NO makers
    const yesMakers = makerTrades.filter((t) => t.side === 'yes');
    const noMakers = makerTrades.filter((t) => t.side === 'no');
    
    // Calculate total amounts for YES and NO sides
    const yesTotal = yesMakers.reduce((sum: number, order: Trade) => sum + order.amount, 0);
    const noTotal = noMakers.reduce((sum: number, order: Trade) => sum + order.amount, 0);
    const totalAmount = yesTotal + noTotal;
    
    if (totalAmount === 0) return percentage;
    
    // Calculate weighted price - YES makers use their price, NO makers use (100 - price)
    const yesWeightedPrice = yesMakers.reduce((sum: number, order: Trade) => 
      sum + (order.amount * order.price), 0);
    const noWeightedPrice = noMakers.reduce((sum: number, order: Trade) => 
      sum + (order.amount * (100 - order.price)), 0);
    
    return Math.round((yesWeightedPrice + noWeightedPrice) / totalAmount);
  };

  const displayPercentage = calculateWeightedPercentage();
  
  // Check if bet is expired
  const isBetExpired = new Date(expirationDate) < new Date();
  
  // Get opponent and max available based on selected choice
  const getOpponentAndMax = (choice: 'yes' | 'no') => {
    const orders = choice === 'yes' ? yesButtonOrders : noButtonOrders;
    if (orders.length === 0) {
      return { opponent: null, maxAvailable: 0 };
    }
    
    // Get the first order's user as opponent (from tradeUsers map)
    const firstOrder = orders[0];
    const user = tradeUsers.get(firstOrder.user_id);
    const opponent = user ? {
      name: user.pseudonym,
      profileImage: user.avatar_url || '',
    } : null;
    
    // Calculate total available amount
    const maxAvailable = orders.reduce((sum: number, order: Trade) => sum + order.amount, 0);
    
    return { opponent, maxAvailable };
  };

  const handleBetClick = (choice: 'yes' | 'no') => {
    setBetChoice(choice);
    setSelectedAnswer(choice);
    
    // Check if there are maker orders for this choice
    const orders = choice === 'yes' ? yesButtonOrders : noButtonOrders;
    
    // If no maker orders available, open in "propose" mode
    if (orders.length === 0) {
      setInitialDialogMode('propose');
    } else {
      setInitialDialogMode('take');
    }
    
    setIsBetDialogOpen(true);
  };

  const handlePlaceBet = () => {
    const finalPercentage = betChoice === 'yes' ? displayPercentage : (100 - displayPercentage);
    const finalAmount = betAmount;
    
    console.log('Placing bet:', {
      choice: betChoice,
      amount: finalAmount,
      percentage: finalPercentage
    });
    
    // Close dialog and reset
    setIsBetDialogOpen(false);
    setBetAmount('');
    
    // Trigger animation after brief delay
    setTimeout(() => {
      onTriggerAnimation({
        choice: betChoice,
        percentage: finalPercentage,
        amount: finalAmount,
        userImage: currentUser?.profileImage || '',
        userName: currentUser?.name || 'You',
      });
    }, 100);
  };

  // Calculate color based on percentage (red to green gradient)
  const getColor = (percentage: number) => {
    if (percentage <= 33) return 'rgb(239, 68, 68)'; // red-500
    if (percentage <= 66) return 'rgb(234, 179, 8)'; // yellow-500
    return 'rgb(34, 197, 94)'; // green-500
  };

  // Format expiration date
  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Only show time if less than 24 hours away
    const showTime = diffHours < 24 && diffHours >= 0;
    
    // Format time
    const time = showTime ? date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }) : '';
    
    // Format date based on proximity
    if (diffDays === 0) {
      // For today, show "in X hours"
      if (showTime) {
        const hoursLeft = Math.floor(diffHours);
        return `in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`;
      }
      return 'Today';
    } else if (diffDays === 1) {
      return showTime ? `Tomorrow ${time}` : 'Tomorrow';
    } else if (diffDays < 7) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      return dayName;
    } else {
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      return dateStr;
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="px-3 space-y-2">
        {/* Top Row: Image, Title, and Half Circle */}
        <div className="flex items-center gap-3">
          {/* Square Image */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>

          {/* Title and Half Circle */}
          <div className="flex-1 flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-foreground line-clamp-2">
                {title}
              </h3>

              {/* Participants betting text */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {participants.slice(0, 3).map((participant, idx) => (
                    <Avatar key={idx} className="w-5 h-5">
                      <AvatarImage src={participant.image} alt={participant.name} />
                      <AvatarFallback className="text-[8px]">
                        {participant.name[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {participants.length > 0 && (
                    <>
                      {participants[0]?.name}
                      {participants.length > 1 && `, ${participants[1]?.name}`}
                      {participants.length > 2 && ' and others'}
                      {' are betting!'}
                    </>
                  )}
                </span>
              </div>
            </div>
            
            {/* Half Circle Progress */}
            <div className="relative flex items-end justify-center flex-shrink-0 w-16 h-8 sm:w-20 sm:h-10">
              {/* Background half circle */}
              <div className="absolute bottom-0 w-full h-full border-t-4 border-l-4 border-r-4 border-muted rounded-t-full" />
              {/* Progress half circle */}
              <div 
                className="absolute bottom-0 w-full h-full border-t-4 border-l-4 border-r-4 rounded-t-full transition-all"
                style={{
                  borderColor: getColor(displayPercentage),
                  clipPath: `polygon(0 100%, 0 0, ${displayPercentage}% 0, ${displayPercentage}% 100%)`,
                }}
              />
              {/* Percentage text inside */}
              <span 
                className="absolute bottom-0.5 text-xs sm:text-sm font-bold z-5"
                style={{ color: getColor(displayPercentage) }}
              >
                {displayPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Yes/No Buttons or Resolve Button */}
        {isBetExpired ? (
          isUserAdmin ? (
            <Button
              onClick={() => setIsResolveDialogOpen(true)}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Resolve the Bet
            </Button>
          ) : (
            <Button
              disabled
              className="w-full bg-muted/50 text-muted-foreground cursor-not-allowed hover:bg-muted/50"
            >
              Resolution incoming...
            </Button>
          )
        ) : (
          <div className="flex gap-2">
            <Button
              variant={selectedAnswer === 'yes' ? 'default' : 'outline'}
              onClick={() => handleBetClick('yes')}
              className={`flex-1 flex items-center justify-center gap-2 ${selectedAnswer === 'yes' ? 'bg-green-600 hover:bg-green-700 border-green-600' : ''}`}
            >
              <span>Yes</span>
            {yesButtonOrders.length > 0 && (
                <div className="flex -space-x-1.5">
                  {yesButtonOrders.slice(0, 3).map((order: Trade) => {
                    const user = tradeUsers.get(order.user_id);
                    return user ? (
                      <Avatar key={order.id} className="w-4 h-4">
                        <AvatarImage src={user.avatar_url || ''} alt={user.pseudonym || 'User'} />
                        <AvatarFallback className="text-[8px]">{user.pseudonym?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                    ) : null;
                  })}
                </div>
              )}
            </Button>
            <Button
              variant={selectedAnswer === 'no' ? 'default' : 'outline'}
              onClick={() => handleBetClick('no')}
              className={`flex-1 flex items-center justify-center gap-2 ${selectedAnswer === 'no' ? 'bg-red-600 hover:bg-red-700 border-red-600' : ''}`}
            >
              <span>No</span>
              {noButtonOrders.length > 0 && (
                <div className="flex -space-x-1.5">
                  {noButtonOrders.slice(0, 3).map((order: Trade) => {
                    const user = tradeUsers.get(order.user_id);
                    return user ? (
                      <Avatar key={order.id} className="w-4 h-4">
                        <AvatarImage src={user.avatar_url || ''} alt={user.pseudonym || 'User'} />
                        <AvatarFallback className="text-[8px]">{user.pseudonym?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                    ) : null;
                  })}
                </div>
              )}
            </Button>
          </div>
        )}

        {/* Stake, Expiration & Participants */}
        <div className="grid grid-cols-3 pt-2">
          {/* Stake */}
          <div className="flex flex-col justify-between gap-0.5">
            <span className="text-xs text-muted-foreground">Stake</span>
            <span className="text-sm font-bold text-foreground">${Math.round(calculatedAmountAtStake || amountAtStake)}</span>
          </div>

          {/* Expiration */}
          <div className="flex flex-col justify-between gap-0.5 items-center">
            <span className="text-xs text-muted-foreground">Ends</span>
            <span className="text-sm font-bold text-foreground">{formatExpirationDate(expirationDate)}</span>
          </div>

          {/* Participants */}
          <div className="flex flex-col justify-between items-end gap-0.5">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 group"
            >
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                Players
              </span>
              {isExpanded ? (
                <ChevronUp className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              ) : (
                <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </button>
            <div className="flex items-center gap-1">
              <div className="flex -space-x-2">
                {displayedParticipants.map((participant, idx) => (
                  <Avatar key={idx} className="w-6 h-6">
                    <AvatarImage src={participant.image} alt={participant.name} />
                    <AvatarFallback className="text-[10px]">
                      {participant.name[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {remainingCount > 0 && (
                <span className="text-xs font-medium text-muted-foreground ml-1">
                  +{remainingCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Participants View */}
        <BetParticipants 
          isExpanded={isExpanded}
          betTrades={betTrades}
          roomId={roomId}
          tradeUsers={tradeUsers}
        />
      </CardContent>

      {/* Bet Dialog */}
      <BetDialog
        isOpen={isBetDialogOpen}
        onOpenChange={setIsBetDialogOpen}
        title={title}
        betChoice={betChoice}
        percentage={displayPercentage}
        betAmount={betAmount}
        setBetAmount={setBetAmount}
        currentUser={{
          name: currentUser?.pseudonym || 'You',
          profileImage: currentUser?.avatar_url || '',
        }}
        opponentUser={(() => {
          const { opponent } = getOpponentAndMax(betChoice);
          return opponent ? {
            name: opponent.name,
            profileImage: opponent.profileImage,
          } : null;
        })()}
        betId={id}
        onTriggerAnimation={onTriggerAnimation}
        initialMode={initialDialogMode}
        yesButtonOrders={yesButtonOrders}
        noButtonOrders={noButtonOrders}
      />

      {/* Resolve Dialog */}
      <ResolveDialog
        isOpen={isResolveDialogOpen}
        onOpenChange={setIsResolveDialogOpen}
        title={title}
        imageUrl={imageUrl}
        betId={id}
      />
    </Card>
  );
}

