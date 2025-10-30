'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import AddRoom from '@/components/addRoom';
import CreateBet from '@/components/createBet';
import Bet from '@/components/bet/betCard';
import BetAnimation from '@/components/bet/betAnimation';
import { useSupabase } from '@/lib/hooks/supabase';
import { useUserMoney } from '@/lib/database/money';


export default function Homepage() {
  const { supabase } = useSupabase();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isCreateBetOpen, setIsCreateBetOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    pseudonym: string;
    avatar_url: string | null;
  } | null>(null);
  
  // Money state using custom hook
  const { currentBalance, userInBets } = useUserMoney();
  
  const [supabaseRooms, setSupabaseRooms] = useState<Array<{
    id: string;
    name: string;
    members: Array<{
      name: string;
      image: string;
    }>;
    isPersonal?: boolean;
  }>>([]);
  const [supabaseBets, setSupabaseBets] = useState<Array<{
    id: string;
    title: string;
    image_url: string;
    created_by: string;
    is_resolved: boolean;
    created_at: string;
    resolved_at: string | null;
    participants: Array<{
      user_id: string;
      is_admin: boolean;
      pseudonym: string;
      avatar_url: string | null;
    }>;
    roomId?: string; // Inferred room ID
  }>>([]);
  const roomRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Animation state
  const [showBetAnimation, setShowBetAnimation] = useState(false);
  const [animationData, setAnimationData] = useState<{
    choice: 'yes' | 'no';
    percentage: number;
    amount: string;
    userImage: string;
    userName: string;
  } | null>(null);
  
  // Swipe state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'horizontal' | 'vertical' | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Refresh function to refetch all data
  const refreshData = async () => {
    await fetchUserProfile();
    await fetchRooms();
    // fetchBets will be called automatically when supabaseRooms updates
  };

  // Fetch user profile from Supabase
  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('pseudonym, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (!error && profile) {
          setUserProfile(profile);
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Fetch rooms from Supabase
  const fetchRooms = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get user profile for "My Room"
      const { data: profile } = await supabase
        .from('profiles')
        .select('pseudonym, avatar_url')
        .eq('id', user.id)
        .single();

      // Create "My Room" as the first room (virtual room - not in DB)
      const myRoom = {
        id: 'my-room', // Special ID for virtual personal room
        name: `${profile?.pseudonym || 'My'}'s Room`,
        members: [{
          name: profile?.pseudonym || 'You',
          image: profile?.avatar_url || '',
        }],
        isPersonal: true, // Flag to identify this as the personal room
      };

      // Get rooms where the user is a member
      const { data: roomMemberships, error: memberError } = await supabase
        .from('room_members')
        .select(`
          room_id,
          rooms (
            id,
            name
          )
        `)
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      let otherRooms: Array<{
        id: string;
        name: string;
        members: Array<{ name: string; image: string }>;
      }> = [];

      if (roomMemberships && roomMemberships.length > 0) {
        // For each room, get all members with their profiles
        type RoomMembership = { rooms: { id: string; name: string } };
        const roomsWithMembers = await Promise.all(
          (roomMemberships as unknown as RoomMembership[]).map(async (membership) => {
            const room = membership.rooms;
            
            // Get all members of this room
            const { data: members, error: membersError } = await supabase
              .from('room_members')
              .select(`
                user_id,
                profiles (
                  pseudonym,
                  avatar_url
                )
              `)
              .eq('room_id', room.id);

            if (membersError) {
              console.error('Error fetching room members:', membersError);
              return null;
            }

            return {
              id: room.id,
              name: room.name,
              members: (members as unknown as Array<{ user_id: string; profiles: { pseudonym: string; avatar_url: string | null } | null }> | null)?.map((m) => ({
                name: m.profiles?.pseudonym || 'Unknown',
                image: m.profiles?.avatar_url || '',
              })) || [],
            };
          })
        );

        otherRooms = roomsWithMembers.filter((r): r is NonNullable<typeof r> => r !== null);
      }

      // Combine My Room with other rooms
      const allRooms = [myRoom, ...otherRooms];
      setSupabaseRooms(allRooms);
      
      // Set My Room as selected by default
      if (!selectedRoomId) {
        setSelectedRoomId(myRoom.id);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  }, [supabase, selectedRoomId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Fetch bets from Supabase
  const fetchBets = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get all bets where the user is a participant
      const { data: userBets, error: betsError } = await supabase
        .from('bet_participants')
        .select(`
          bet_id,
          is_admin,
          bets (
            id,
            title,
            image_url,
            created_by,
            is_resolved,
            created_at,
            resolved_at
          )
        `)
        .eq('user_id', user.id);

      if (betsError) throw betsError;

      if (userBets && userBets.length > 0) {
        // Get all participants for each bet
        type UserBetRow = {
          bet_id: string;
          is_admin: boolean;
          bets: {
            id: string;
            title: string;
            image_url: string;
            created_by: string;
            is_resolved: boolean;
            created_at: string;
            resolved_at: string | null;
          }
        };
        const betsWithParticipants = await Promise.all(
          (userBets as unknown as UserBetRow[]).map(async (userBet) => {
            const bet = userBet.bets;
            
            // Get all participants for this bet
            const { data: participants, error: participantsError } = await supabase
              .from('bet_participants')
              .select(`
                user_id,
                is_admin,
                profiles (
                  pseudonym,
                  avatar_url
                )
              `)
              .eq('bet_id', bet.id);

            if (participantsError) {
              console.error('Error fetching bet participants:', participantsError);
              return null;
            }

            return {
              id: bet.id,
              title: bet.title,
              image_url: bet.image_url,
              created_by: bet.created_by,
              is_resolved: bet.is_resolved,
              created_at: bet.created_at,
              resolved_at: bet.resolved_at,
              participants: (participants as unknown as Array<{ user_id: string; is_admin: boolean; profiles: { pseudonym: string; avatar_url: string | null } | null }> | null)?.map((p) => ({
                user_id: p.user_id,
                is_admin: p.is_admin,
                pseudonym: p.profiles?.pseudonym || 'Unknown',
                avatar_url: p.profiles?.avatar_url || null,
              })) || [],
            };
          })
        );

        const validBets = betsWithParticipants.filter((bet): bet is NonNullable<typeof bet> => bet !== null);
        // Exclude resolved bets
        const activeBets = validBets.filter(b => !b.is_resolved);

        // Create multiple bet entries - one for each room the bet should appear in
        const betsWithRooms: Array<typeof activeBets[0] & { roomId: string }> = [];
        
        activeBets.forEach(bet => {
          // Always add to personal room (shows ALL user's bets)
          betsWithRooms.push({
            ...bet,
            roomId: 'my-room',
          });
          
          // Also add to specific room if participants match exactly
          const matchingRoom = supabaseRooms.find(room => {
            if (room.id === 'my-room') {
              return false; // Skip personal room
            } else {
              // For regular rooms, check if participants match room members exactly
              const roomMemberNames = room.members.map(m => m.name);
              const betParticipantNames = bet.participants.map(p => p.pseudonym);
              
              // Check if all bet participants are in this room AND all room members are in the bet
              return betParticipantNames.every(name => roomMemberNames.includes(name)) &&
                     roomMemberNames.every(name => betParticipantNames.includes(name));
            }
          });
          
          if (matchingRoom) {
            betsWithRooms.push({
              ...bet,
              roomId: matchingRoom.id,
            });
          }
        });

        setSupabaseBets(betsWithRooms);
      }
    } catch (err) {
      console.error('Error fetching bets:', err);
    }
  }, [supabase, supabaseRooms]);

  useEffect(() => {
    // Only fetch bets after rooms are loaded
    if (supabaseRooms.length > 0) {
      fetchBets();
    }
  }, [fetchBets, supabaseRooms.length]);

  const triggerBetAnimation = (data: {
    choice: 'yes' | 'no';
    percentage: number;
    amount: string;
    userImage: string;
    userName: string;
  }) => {
    setAnimationData(data);
    setShowBetAnimation(true);
  };

  const handleRoomSelect = (roomId: string) => {
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

  // Swipe handlers
  const minSwipeDistance = 100; // Minimum swipe distance for both animation and room change
  const minDirectionThreshold = 10; // Pixels to determine swipe direction

  // Check if any dialog is open
  const isAnyDialogOpen = () => {
    return isCreateBetOpen || isAddRoomOpen || document.querySelector('[role="dialog"]') !== null;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    // Don't allow swiping if a dialog is open
    if (isAnyDialogOpen()) return;
    
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
    setSwipeDirection(null);
    setIsSwiping(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    // Don't allow swiping if a dialog is open
    if (isAnyDialogOpen()) return;
    
    if (touchStart === null) return;
    
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    const diffX = currentX - touchStart.x;
    const diffY = currentY - touchStart.y;
    
    // Determine swipe direction once we have enough movement
    if (swipeDirection === null && (Math.abs(diffX) > minDirectionThreshold || Math.abs(diffY) > minDirectionThreshold)) {
      // Set direction based on which axis has more movement
      if (Math.abs(diffX) > Math.abs(diffY)) {
        setSwipeDirection('horizontal');
        setIsSwiping(true);
      } else {
        setSwipeDirection('vertical');
      }
    }
    
    // Only apply horizontal swipe logic if we've committed to horizontal direction
    if (swipeDirection === 'horizontal') {
      // Lock vertical scrolling
      e.preventDefault();
      
      // Only start animation after 100px threshold
      const adjustedDiff = Math.abs(diffX) > minSwipeDistance 
        ? (diffX > 0 ? diffX - minSwipeDistance : diffX + minSwipeDistance)
        : 0;
      
      setSwipeOffset(adjustedDiff);
    }
    
    setTouchEnd({ x: currentX, y: currentY });
  };

  const onTouchEnd = () => {
    // Don't process swipe if a dialog is open
    if (isAnyDialogOpen()) {
      setIsSwiping(false);
      setSwipeOffset(0);
      setTouchStart(null);
      setTouchEnd(null);
      setSwipeDirection(null);
      return;
    }
    
    if (!touchStart || !touchEnd) {
      setIsSwiping(false);
      setSwipeOffset(0);
      setSwipeDirection(null);
      return;
    }

    // Only process if this was a horizontal swipe
    if (swipeDirection === 'horizontal') {
      const distance = touchStart.x - touchEnd.x;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      // Get current room index
      const currentIndex = supabaseRooms.findIndex(r => r.id === selectedRoomId);

      if (isLeftSwipe && currentIndex < supabaseRooms.length - 1) {
        // Swipe left: go to next room
        handleRoomSelect(supabaseRooms[currentIndex + 1].id);
      } else if (isRightSwipe && currentIndex > 0) {
        // Swipe right: go to previous room
        handleRoomSelect(supabaseRooms[currentIndex - 1].id);
      }
    }

    // Reset swipe state completely after swipe
    setTouchStart(null);
    setTouchEnd(null);
    setSwipeOffset(0);
    setIsSwiping(false);
    setSwipeDirection(null);
  };

  // Calculate the transform offset based on selected room
  const currentRoomIndex = supabaseRooms.findIndex(r => r.id === selectedRoomId);
  const baseOffset = currentRoomIndex * -100; // -100% per room
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 375; // Default to mobile width
  const totalOffset = baseOffset + (swipeOffset / (mainContentRef.current?.offsetWidth || viewportWidth)) * 100;

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

                     {/* User Info on the right */}
           <div className="flex items-center gap-4 sm:gap-6">
             <div className="flex flex-col items-center">
               <span className="text-xs text-muted-foreground">Cash</span>
               <span className="text-sm sm:text-base font-bold text-foreground">${Math.round(currentBalance)}</span>
             </div>
             <div className="flex flex-col items-center">
               <span className="text-xs text-muted-foreground">In Bets</span>
               <span className="text-sm sm:text-base font-bold text-foreground">${Math.round(userInBets)}</span>
             </div>
            <Link href="/profile">
              <Avatar className="w-10 h-10 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={userProfile?.avatar_url || undefined} alt={userProfile?.pseudonym || 'Profile'} />
                <AvatarFallback>{userProfile?.pseudonym?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </div>

      {/* Sticky Room Selector */}
      <div className="sticky top-0 z-10 w-full border-b border-border bg-background">
          <div 
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto py-4 scrollbar-hide snap-x snap-mandatory"
          >
            {supabaseRooms.map((room, index) => {
              const isMyRoom = room.id === 'my-room';
              return (
                <button
                  key={room.id}
                  ref={(el) => { roomRefs.current[room.id] = el; }}
                  onClick={() => handleRoomSelect(room.id)}
                  className={`flex items-center gap-3 min-w-fit snap-start group transition-all rounded-full px-4 py-2 ${
                    selectedRoomId === room.id
                      ? isMyRoom
                        ? 'opacity-100 bg-gradient-to-br from-yellow-500/40 to-amber-600/40 border border-yellow-500/60'
                        : 'opacity-100 bg-red-900/30 border border-red-800/50'
                      : 'opacity-60 hover:opacity-80 border border-transparent'
                  } ${index === 0 ? 'ml-6' : ''}`}
                >
                  {/* Avatar Group */}
                  <div className="flex -space-x-3">
                    {room.members.map((member, idx) => (
                      <Avatar 
                        key={idx} 
                        className={`w-10 h-10 ${isMyRoom && selectedRoomId === room.id ? 'ring-2 ring-yellow-500/50' : ''}`}
                      >
                        <AvatarImage src={member.image || undefined} alt={member.name} />
                        <AvatarFallback className="text-xs">{member.name[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {/* Room Name */}
                  <span className={`text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedRoomId === room.id
                      ? isMyRoom
                        ? 'text-yellow-300'
                        : 'text-red-300'
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`}>
                    {room.name}
                  </span>
                </button>
              );
            })}
            
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
      <main className="overflow-hidden">
        <div
          ref={mainContentRef}
          className="flex touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            transform: `translateX(${totalOffset}%)`,
            transition: isSwiping ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {supabaseRooms.map((room, index) => {
            // Filter bets for this room
            const roomBets = supabaseBets.filter(bet => bet.roomId === room.id);

            // Calculate scale and opacity for peek effect
            const isCurrentRoom = room.id === selectedRoomId;
            const distanceFromCurrent = Math.abs(index - currentRoomIndex);
            const scale = isCurrentRoom ? 1 : 0.95;
            const opacity = isCurrentRoom ? 1 : 0.4;

            return (
              <div
                key={room.id}
                className="min-w-full px-6 py-8"
                style={{ 
                  width: '100%',
                  transform: `scale(${scale})`,
                  opacity: isSwiping ? (distanceFromCurrent <= 1 ? 0.6 : 0.3) : opacity,
                  transition: isSwiping ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  pointerEvents: isCurrentRoom ? 'auto' : 'none',
                }}
              >
                <div className="space-y-4">
                  {/* Create Bet Button */}
                  <button 
                    onClick={() => setIsCreateBetOpen(true)}
                    className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg py-4 flex items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      Create a Bet
                    </span>
                  </button>
                  
                  {/* Bets for this room */}
                  {roomBets.length > 0 ? (
                    roomBets.map((bet) => (
                      <Bet
                        key={bet.id}
                        id={bet.id}
                        roomId={bet.roomId === 'my-room' ? 0 : parseInt(bet.roomId?.replace(/\D/g, '') || '1') || 1}
                        title={bet.title}
                        imageUrl={bet.image_url}
                        amountAtStake={0}
                        participants={bet.participants.map(p => ({
                          name: p.pseudonym,
                          image: p.avatar_url || '',
                          isAdmin: p.is_admin
                        }))}
                        percentage={50}
                        expirationDate={bet.resolved_at || bet.created_at}
                        onTriggerAnimation={triggerBetAnimation}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <p className="text-muted-foreground">No bets in this room yet</p>
                      <p className="text-sm text-muted-foreground/60 mt-2">Create the first bet!</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Add Room Dialog */}
      <AddRoom 
        open={isAddRoomOpen} 
        onOpenChange={setIsAddRoomOpen}
        onRoomCreated={refreshData}
      />
      
      {/* Create Bet Dialog */}
      <CreateBet 
        open={isCreateBetOpen} 
        onOpenChange={setIsCreateBetOpen}
        onTriggerAnimation={triggerBetAnimation}
        onBetCreated={refreshData}
      />

      {/* Bet Proposal Animation */}
      {animationData && (
        <BetAnimation
          isOpen={showBetAnimation}
          onOpenChange={setShowBetAnimation}
          choice={animationData.choice}
          percentage={animationData.percentage}
          amount={animationData.amount}
          userImage={animationData.userImage}
          userName={animationData.userName}
        />
      )}
    </div>
  );
}

