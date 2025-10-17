'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Check, Crown, Users, Plus, Target, Upload } from 'lucide-react';
import Link from 'next/link';
import OnboardingSlider from '@/components/onboarding/onboardingSlider';
import OnboardingCreateBet from '@/components/onboarding/onboardingCreateBet';
import OnboardingBetCard from '@/components/onboarding/onboardingBetCard';
import OnboardingAddRoom from '@/components/onboarding/onboardingAddRoom';
import OnboardingBetDialog from '@/components/onboarding/onboardingBetDialog';
import dbData from '@/backend/db.json';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [sliderValue, setSliderValue] = useState([50]);
  const [selectedChoice, setSelectedChoice] = useState<'yes' | 'no' | null>(null);
  const [amount, setAmount] = useState('10');
  const [sliderCompleted, setSliderCompleted] = useState(false);
  const [showCreateBetDialog, setShowCreateBetDialog] = useState(false);
  const [betOnRoomCompleted, setBetOnRoomCompleted] = useState(false);
  const [showAddRoomDialog, setShowAddRoomDialog] = useState(false);
  const [roomCreationCompleted, setRoomCreationCompleted] = useState(false);
  const [createdRoomData, setCreatedRoomData] = useState<{
    roomName: string;
    memberIds: string[];
  } | null>(null);
  const [placeBetCompleted, setPlaceBetCompleted] = useState(false);
  const [pseudonym, setPseudonym] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [createdBetData, setCreatedBetData] = useState<{
    choice: 'yes' | 'no';
    percentage: number;
    amount: string;
    userImage: string;
    userName: string;
    betName: string;
    imageUrl: string;
    expirationDate: string;
    selectedParticipants: string[];
  } | null>(null);

  const steps = [
    {
      title: "Welcome to Betroom!",
      description: "Tell us more about you",
      content: "intro"
    },
    {
      title: "Creating Your First Bet",
      description: "Set the best odds for a bet. If you set 60% for YES, another user must match you at 40% for NO to balance the bet.",
      content: "create-bet"
    },
    {
      title: "Adding a Room",
      description: "Create a room with your friends. Click twice on a member to give them admin status (crown).",
      content: "add-room"
    },
    {
      title: "Creating a Full Bet",
      description: "Click the button below to try creating a complete bet with an image, participants, and expiration date.",
      content: "bet-on-room"
    },
    {
      title: "Placing a Bet",
      description: "Now place a bet against a maker. Click Yes or No to bet against someone.",
      content: "place-bet"
    },
    {
      title: "You're All Set!",
      description: "",
      content: "complete"
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      // Check if slider step is completed
      if (currentStep === 1 && !sliderCompleted) {
        return; // Don't allow proceeding if slider not completed
      }
      // Check if room creation step is completed
      if (currentStep === 2 && !roomCreationCompleted) {
        return; // Don't allow proceeding if room not created
      }
      // Check if bet creation step is completed
      if (currentStep === 3 && !betOnRoomCompleted) {
        return; // Don't allow proceeding if bet not created
      }
      // Check if place bet step is completed
      if (currentStep === 4 && !placeBetCompleted) {
        return; // Don't allow proceeding if bet not placed
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].content) {
      case "intro":
        return (
          <div className="space-y-6">
            {/* Profile Picture and Pseudonym - Aligned horizontally */}
            <div className="flex items-center gap-4">
              {/* Profile Picture Upload */}
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setProfileImage(url);
                    }
                  };
                  input.click();
                }}
                className="relative w-20 h-20 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors overflow-hidden group flex-shrink-0"
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
                {profileImage && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                )}
              </button>

              {/* Pseudonym Input */}
              <Input
                type="text"
                placeholder="Enter your pseudonym"
                value={pseudonym}
                onChange={(e) => setPseudonym(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!pseudonym.trim()}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      case "add-room":
        return (
          <div className="space-y-6">
            {!roomCreationCompleted ? (
              <div className="space-y-4">
                {/* Add Room Button styled like homepage */}
                <button 
                  onClick={() => setShowAddRoomDialog(true)}
                  className="flex items-center gap-3 w-full justify-center py-4 rounded-lg opacity-60 hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center hover:border-primary hover:bg-primary/10 transition-all">
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    Add Room
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Show created room with avatars */}
                {createdRoomData && (
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-3 rounded-full px-4 py-2 bg-red-900/30 border border-red-800/50">
                      {/* Avatar Group */}
                      <div className="flex -space-x-3">
                        {createdRoomData.memberIds.map((memberId, idx) => {
                          const member = dbData.users.find((u) => u.id === memberId);
                          return member ? (
                            <Avatar key={idx} className="w-10 h-10">
                              <AvatarImage src={member.profileImage} alt={member.name} />
                              <AvatarFallback className="text-xs">{member.name[0]}</AvatarFallback>
                            </Avatar>
                          ) : null;
                        })}
                      </div>
                      {/* Room Name */}
                      <span className="text-sm font-medium whitespace-nowrap text-red-300">
                        {createdRoomData.roomName}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Next button */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <OnboardingAddRoom
              open={showAddRoomDialog}
              onOpenChange={setShowAddRoomDialog}
              onRoomCreated={(data) => {
                setCreatedRoomData(data);
                setRoomCreationCompleted(true);
              }}
            />
          </div>
        );

      case "create-bet":
        return (
          <div className="space-y-6">
            <OnboardingSlider 
              onComplete={(choice, percentage) => {
                setSliderCompleted(true);
                setSelectedChoice(choice);
                setSliderValue([percentage]);
                // Auto advance to next step
                setCurrentStep(currentStep + 1);
              }}
            />
          </div>
        );

      case "bet-on-room":
        return (
          <div className="space-y-6">
            {!betOnRoomCompleted ? (
              <div className="space-y-4">
                {/* Create Bet Button styled like homepage */}
                <button 
                  onClick={() => setShowCreateBetDialog(true)}
                  className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg py-4 flex items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Create a Bet
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Show the created bet card */}
                {createdBetData && (
                  <OnboardingBetCard
                    id={1}
                    roomId={1}
                    title={createdBetData.betName}
                    imageUrl={createdBetData.imageUrl}
                    amountAtStake={parseInt(createdBetData.amount || '0')}
                    participants={(() => {
                      // Get participant details from dbData
                      const participantList = createdBetData.selectedParticipants.map((userId: string) => {
                        const user = dbData.users.find((u) => u.id === userId);
                        return user ? { name: user.name, image: user.profileImage } : null;
                      }).filter((p): p is { name: string; image: string } => p !== null);
                      
                      // Add the current user who created the bet
                      return [
                        { name: createdBetData.userName, image: createdBetData.userImage },
                        ...participantList
                      ];
                    })()}
                    percentage={createdBetData.percentage}
                    expirationDate={createdBetData.expirationDate}
                    onTriggerAnimation={() => {}}
                  />
                )}
                
                {/* Next button */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <OnboardingCreateBet
              open={showCreateBetDialog}
              onOpenChange={setShowCreateBetDialog}
              onTriggerAnimation={(data) => {
                setBetOnRoomCompleted(true);
                setCreatedBetData(data);
                setShowCreateBetDialog(false);
              }}
            />
          </div>
        );

      case "place-bet":
        return (
          <div className="space-y-6">
            {/* Show a bet card with existing maker - using bet_3 which has trades */}
            <OnboardingBetCard
              id={3}
              roomId={1}
              title="Will it rain tomorrow in SF?"
              imageUrl="https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400&q=80"
              amountAtStake={(() => {
                // Calculate total stake from trades
                const betTrades = dbData.trades.filter((t) => t.betId === 'bet_3');
                return betTrades.reduce((sum, t) => sum + t.amount, 0);
              })()}
              participants={(() => {
                // Get participants from trades
                const betTrades = dbData.trades.filter((t) => t.betId === 'bet_3');
                const uniqueUserIds = [...new Set(betTrades.map((t) => t.userId))];
                return uniqueUserIds.map((userId) => {
                  const user = dbData.users.find((u) => u.id === userId);
                  return user ? { name: user.name, image: user.profileImage } : { name: '', image: '' };
                }).filter((p) => p.name !== '');
              })()}
              percentage={65}
              expirationDate="2025-10-18T00:00:00.000Z"
              onTriggerAnimation={(data) => {
                console.log('Bet placed!', data);
                setPlaceBetCompleted(true);
              }}
            />
            
            {/* Show Next button after bet is placed */}
            {placeBetCompleted && (
              <div className="flex justify-end">
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        );

      case "complete":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                You now know how to create bets, join rooms, and earn crowns.
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="relative text-center space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded bg-background flex items-center justify-center">
                  <span className="text-xs font-bold text-foreground">1</span>
                </div>
                <div className="w-8 h-8 mx-auto flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-sm font-medium">Add Money</p>
              </div>
              <div className="relative text-center space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded bg-background flex items-center justify-center">
                  <span className="text-xs font-bold text-foreground">2</span>
                </div>
                <Target className="w-8 h-8 text-primary mx-auto" />
                <p className="text-sm font-medium">Create a Bet</p>
              </div>
              <div className="relative text-center space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded bg-background flex items-center justify-center">
                  <span className="text-xs font-bold text-foreground">3</span>
                </div>
                <Users className="w-8 h-8 text-primary mx-auto" />
                <p className="text-sm font-medium">Join a Room</p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Link href="/homepage">
                <Button className="flex items-center gap-2">
                  Start Betting
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-2 relative overflow-hidden">
      <div className="w-full max-w-2xl">
        {/* Main Content */}
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              {steps[currentStep].title}
            </h1>
            <p className="text-muted-foreground">
              {steps[currentStep].description}
            </p>
          </div>
          
          <div className="space-y-6">
            {renderStepContent()}
          </div>
        </div>
      </div>

      {/* Progress Indicators - Fixed at bottom */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
