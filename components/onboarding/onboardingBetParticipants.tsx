'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown } from 'lucide-react';
import dbData from '@/backend/db.json';

interface BetParticipantsProps {
  isExpanded: boolean;
  betTrades: typeof dbData.trades;
  roomId: number;
}

export default function BetParticipants({ isExpanded, betTrades, roomId }: BetParticipantsProps) {
  // Group trades by position
  const yesTrades = betTrades.filter((t) => t.position === 'yes');
  const noTrades = betTrades.filter((t) => t.position === 'no');

  // Get user details for trades with maker/taker relationship
  const getTradeWithUser = (trade: typeof betTrades[0]) => {
    const user = dbData.users.find((u) => u.id === trade.userId);
    
    // If this is a taker, find the maker they're trading with
    let counterpartyUser = null;
    if (trade.type === 'taker' && trade.makerTradeId) {
      const makerTrade = betTrades.find((t) => t.id === trade.makerTradeId);
      if (makerTrade) {
        counterpartyUser = dbData.users.find((u) => u.id === makerTrade.userId);
      }
    }
    
    return { trade, user, counterpartyUser };
  };

  if (!isExpanded) return null;

  // Get room admins
  const roomIdString = `room_${roomId}`;
  const roomAdmins = dbData.users.filter((user) => {
    const userRoom = user.rooms.find((r) => r.id === roomIdString);
    return userRoom?.isAdmin === true;
  });

  // Group all trades by makerTradeId
  const makerGroups = new Map<string, { maker: typeof betTrades[0], takers: typeof betTrades }>();
  
  betTrades
    .filter((trade) => trade.type === 'taker' && trade.makerTradeId)
    .forEach((taker) => {
      const makerId = taker.makerTradeId!;
      if (!makerGroups.has(makerId)) {
        const maker = betTrades.find(t => t.id === makerId);
        if (maker) {
          makerGroups.set(makerId, { maker, takers: [] });
        }
      }
      makerGroups.get(makerId)?.takers.push(taker);
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
          const groupHasYesTakers = takers.some(t => t.position === 'yes');

          return (
            <div 
              key={makerId} 
              className="grid grid-cols-[auto_1fr_auto] gap-0 animate-in fade-in slide-in-from-top-2 duration-300"
              style={{ animationDelay: `${groupIndex * 50}ms` }}
            >
              {/* YES Column - Show maker if YES, or takers if maker is NO */}
              <div className="space-y-2">
                {maker.position === 'yes' ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={makerUser.profileImage} alt={makerUser.name} />
                      <AvatarFallback className="text-xs">{makerUser.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 max-w-[120px]">
                      <div className="text-xs font-medium text-foreground truncate">
                        {makerUser.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                        ${maker.amount} @ {maker.percentage}%
                      </div>
                    </div>
                  </div>
                ) : (
                  takers.map((taker) => {
                    const { user: takerUser } = getTradeWithUser(taker);
                    if (!takerUser || taker.position !== 'yes') return null;
                    
                    return (
                      <div key={taker.id} className="flex items-center gap-2">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={takerUser.profileImage} alt={takerUser.name} />
                          <AvatarFallback className="text-xs">{takerUser.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 max-w-[120px]">
                          <div className="text-xs font-medium text-foreground truncate">
                            {takerUser.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                            ${taker.amount} @ {taker.percentage}%
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
                              left: isFirstOfGroup && trade.position === 'no' ? '-25px' : '0',
                              right: isFirstOfGroup && trade.position === 'yes' ? '-20px' : '0',
                              background: 'linear-gradient(to right, rgb(34 197 94), rgb(239 68 68))'  // green (YES/left) to red (NO/right)
                            }}
                          />
                          
                          {isFirstOfGroup && (
                            trade.position === 'no' ? (
                              <div className="absolute top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-green-500" style={{ left: '-30px' }} />
                            ) : (
                              <div className="absolute top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-red-500" style={{ right: '-24px' }} />
                            )
                          )}
                          
                          {isSubsequentInGroup && (
                            trade.position === 'no' ? (
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
                {maker.position === 'no' ? (
                  <div className="flex items-center gap-2 pl-2">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={makerUser.profileImage} alt={makerUser.name} />
                      <AvatarFallback className="text-xs">{makerUser.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">
                        {makerUser.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        ${maker.amount} @ {maker.percentage}%
                      </div>
                    </div>
                  </div>
                ) : (
                  takers.map((taker) => {
                    const { user: takerUser } = getTradeWithUser(taker);
                    if (!takerUser || taker.position !== 'no') return null;
                    
                    return (
                      <div key={taker.id} className="flex items-center gap-2 pl-2">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={takerUser.profileImage} alt={takerUser.name} />
                          <AvatarFallback className="text-xs">{takerUser.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-foreground truncate">
                            {takerUser.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            ${taker.amount} @ {taker.percentage}%
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
                    <AvatarImage src={admin.profileImage} alt={admin.name} />
                    <AvatarFallback className="text-xs">{admin.name[0]}</AvatarFallback>
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
