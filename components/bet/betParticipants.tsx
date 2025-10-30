'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown } from 'lucide-react';
import { useSupabase } from '@/lib/hooks/supabase';
import { useEffect, useState } from 'react';

interface Trade {
  id: string;
  bet_id: string;
  user_id: string;
  side: 'yes' | 'no';
  price: number;
  amount: number;
  maker_trade_id: string | null;
  created_at: string;
}

interface BetParticipantsProps {
  isExpanded: boolean;
  betTrades: Trade[];
  roomId: number;
  tradeUsers?: Map<string, { pseudonym: string; avatar_url: string | null }>;
}

type AdminProfile = { id: string; pseudonym: string; avatar_url: string | null };

export default function BetParticipants({ isExpanded, betTrades, roomId, tradeUsers }: BetParticipantsProps) {
  const { supabase } = useSupabase();
  const [roomAdmins, setRoomAdmins] = useState<AdminProfile[]>([]);
  
  // Group trades by side
  const yesTrades = betTrades.filter((t) => t.side === 'yes');
  const noTrades = betTrades.filter((t) => t.side === 'no');

  // Get user details for trades with maker/taker relationship
  const getTradeWithUser = (trade: Trade) => {
    const user = tradeUsers?.get(trade.user_id);
    
    return { trade, user };
  };

  // Fetch room admins from bet_participants
  useEffect(() => {
    const fetchRoomAdmins = async () => {
      try {
        // Get all bets in the room
        const { data: roomMembers } = await supabase
          .from('room_members')
          .select('user_id, is_admin')
          .eq('room_id', roomId)
          .eq('is_admin', true);

        if (roomMembers) {
          const adminIds = (roomMembers as Array<{ user_id: string; is_admin: boolean }>).map((m) => m.user_id);
          
          // Get admin profiles
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, pseudonym, avatar_url')
            .in('id', adminIds);

          setRoomAdmins((profiles as AdminProfile[] | null) || []);
        }
      } catch (error) {
        console.error('Error fetching room admins:', error);
      }
    };

    if (isExpanded && roomId) {
      fetchRoomAdmins();
    }
  }, [isExpanded, roomId, supabase]);

  if (!isExpanded) return null;

  // Group all trades by maker_trade_id (makers are those with maker_trade_id === null)
  const makerGroups = new Map<string, { maker: Trade; takers: Trade[] }>();
  
  // First, add all makers to the map
  betTrades
    .filter((trade) => trade.maker_trade_id === null)
    .forEach((maker) => {
      makerGroups.set(maker.id, { maker, takers: [] });
    });
  
  // Then, add all takers to their respective maker groups
  betTrades
    .filter((trade) => trade.maker_trade_id !== null)
    .forEach((taker) => {
      const group = makerGroups.get(taker.maker_trade_id!);
      if (group) {
        group.takers.push(taker);
      }
    });

  return (
    <div className="pt-4 mt-2 border-t border-border animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Headers */}
      <div className="grid grid-cols-[auto_1fr_auto] gap-0 mb-2">
        <div className="text-xs font-semibold text-green-500 uppercase tracking-wide">
          Yes ({yesTrades.length})
        </div>
        <div></div>
        <div className="text-xs font-semibold text-red-500 uppercase tracking-wide pl-2">
          No ({noTrades.length})
        </div>
      </div>

      {/* Maker Groups */}
      <div className="space-y-4">
        {Array.from(makerGroups.entries()).map(([makerId, { maker, takers }], groupIndex) => {
          const { user: makerUser } = getTradeWithUser(maker);
          if (!makerUser) return null;

          // Check if THIS group has YES takers
          const groupHasYesTakers = takers.some(t => t.side === 'yes');

          return (
            <div 
              key={makerId} 
              className="grid grid-cols-[auto_1fr_auto] gap-0 animate-in fade-in slide-in-from-top-2 duration-300"
              style={{ animationDelay: `${groupIndex * 50}ms` }}
            >
              {/* YES Column - Show maker if YES, or takers if maker is NO */}
              <div className="space-y-2">
                {maker.side === 'yes' ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={makerUser.avatar_url || ''} alt={makerUser.pseudonym} />
                      <AvatarFallback className="text-xs">{makerUser.pseudonym[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 max-w-[120px]">
                      <div className="text-xs font-medium text-foreground truncate">
                        {makerUser.pseudonym}
                      </div>
                      <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                        ${maker.amount} @ {maker.price}%
                      </div>
                    </div>
                  </div>
                ) : (
                  takers.map((taker) => {
                    const { user: takerUser } = getTradeWithUser(taker);
                    if (!takerUser || taker.side !== 'yes') return null;
                    
                    return (
                      <div key={taker.id} className="flex items-center gap-2">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={takerUser.avatar_url || ''} alt={takerUser.pseudonym} />
                          <AvatarFallback className="text-xs">{takerUser.pseudonym[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 max-w-[120px]">
                          <div className="text-xs font-medium text-foreground truncate">
                            {takerUser.pseudonym}
                          </div>
                          <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                            ${taker.amount} @ {taker.price}%
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Connector Space */}
              <div className="pl-2">
                <div className={`${groupHasYesTakers ? 'pr-8' : 'pl-8'}`}>
                  <div className="relative" style={{ height: `${takers.length * 40 - 8}px` }}>
                    {takers.map((trade, index) => {
                      const isFirstOfGroup = index === 0;
                      const isSubsequentInGroup = index > 0;
                      const rowsToTop = index * 40;
                      const offsetTop = index * 40;

                      return (
                        <div key={trade.id} className="absolute w-full" style={{ top: `${offsetTop}px`, height: '32px' }}>
                          {/* Horizontal line with gradient */}
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 h-[2px]"
                            style={{
                              left: isFirstOfGroup && trade.side === 'no' ? '-25px' : '0',
                              right: isFirstOfGroup && trade.side === 'yes' ? '-20px' : '0',
                              background: 'linear-gradient(to right, rgb(34 197 94), rgb(239 68 68))'  // green (YES/left) to red (NO/right)
                            }}
                          />
                          
                          {isFirstOfGroup && (
                            trade.side === 'no' ? (
                              <div className="absolute top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-green-500" style={{ left: '-30px' }} />
                            ) : (
                              <div className="absolute top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-red-500" style={{ right: '-24px' }} />
                            )
                          )}
                          
                          {isSubsequentInGroup && (
                            trade.side === 'no' ? (
                              <div 
                                className="absolute left-0 bottom-1/2 w-[2px]"
                                style={{ 
                                  height: `${rowsToTop}px`,
                                  background: 'rgb(34 197 94)'  // green - matches left edge of horizontal gradient
                                }}
                              />
                            ) : (
                              <div 
                                className="absolute right-0 bottom-1/2 w-[2px]"
                                style={{ 
                                  height: `${rowsToTop}px`,
                                  background: 'rgb(239 68 68)'  // red - matches right edge of horizontal gradient
                                }}
                              />
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* NO Column - Show maker if NO, or takers */}
              <div className="space-y-2 w-[115px]">
                {maker.side === 'no' ? (
                  <div className="flex items-center gap-2 pl-2">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={makerUser.avatar_url || ''} alt={makerUser.pseudonym} />
                      <AvatarFallback className="text-xs">{makerUser.pseudonym[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">
                        {makerUser.pseudonym}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        ${maker.amount} @ {maker.price}%
                      </div>
                    </div>
                  </div>
                ) : (
                  takers.map((taker) => {
                    const { user: takerUser } = getTradeWithUser(taker);
                    if (!takerUser || taker.side !== 'no') return null;
                    
                    return (
                      <div key={taker.id} className="flex items-center gap-2 pl-2">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={takerUser.avatar_url || ''} alt={takerUser.pseudonym} />
                          <AvatarFallback className="text-xs">{takerUser.pseudonym[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-foreground truncate">
                            {takerUser.pseudonym}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            ${taker.amount} @ {taker.price}%
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Room Admins */}
      {roomAdmins.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border flex justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Room Admins:</span>
            <div className="flex -space-x-2">
              {roomAdmins.map((admin, index) => (
                <div key={admin.id} className="relative" style={{ zIndex: roomAdmins.length - index }}>
                  <Avatar className="w-8 h-8 ring-2 ring-background">
                    <AvatarImage src={admin.avatar_url || ''} alt={admin.pseudonym} />
                    <AvatarFallback className="text-xs">{admin.pseudonym[0]}</AvatarFallback>
                  </Avatar>
                  <Crown className="absolute -top-1 -right-1 h-4 w-4 text-red-500 fill-red-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

