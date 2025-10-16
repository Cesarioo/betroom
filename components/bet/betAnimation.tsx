'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, Sparkles } from 'lucide-react';

interface BetAnimationProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  choice: 'yes' | 'no';
  percentage: number;
  amount: string;
  userImage: string;
  userName: string;
}

export default function BetAnimation({
  isOpen,
  onOpenChange,
  choice,
  percentage,
  amount,
  userImage,
  userName,
}: BetAnimationProps) {
  const [showContent, setShowContent] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; duration: number }>>([]);
  const [floatingTexts, setFloatingTexts] = useState<Array<{ id: number; x: number; y: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    if (isOpen) {
      // Generate random particles
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.5 + Math.random() * 1,
      }));
      setParticles(newParticles);
      
      // Generate floating choice texts with staggered appearance
      const newTexts = Array.from({ length: 25 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 4, // Spread over 4 seconds
        duration: 2 + Math.random() * 1.5,
      }));
      setFloatingTexts(newTexts);
      
      // Show content after brief delay
      setTimeout(() => setShowContent(true), 100);
      
      // Auto close after 5 seconds (increased from 2.5)
      const timer = setTimeout(() => {
        // First hide content, then slide up
        setShowContent(false);
        setIsExiting(true);
        // Trigger slide up animation
        setTimeout(() => {
          onOpenChange(false);
          setIsExiting(false);
        }, 600);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
      setIsExiting(false);
      setParticles([]);
      setFloatingTexts([]);
    }
  }, [isOpen, onOpenChange]);

  if (!isOpen && !isExiting) return null;

  const isYes = choice === 'yes';
  const primaryColor = isYes ? 'green' : 'red';
  const bgGradient = isYes 
    ? 'from-green-500/20 via-green-500/10 to-transparent'
    : 'from-red-500/20 via-red-500/10 to-transparent';

  return (
    <div 
      className={`fixed inset-0 w-screen h-screen z-50 flex items-center justify-center overflow-hidden ${isYes ? 'bg-green-600' : 'bg-red-600'}`}
      style={{ 
        height: '100vh',
        transform: isExiting 
          ? (isYes ? 'translateY(-100%)' : 'translateY(100%)') 
          : (showContent ? 'translateY(0)' : (isYes ? 'translateY(100%)' : 'translateY(-100%)')),
        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >

      {/* Floating choice texts */}
      {floatingTexts.map((text) => (
        <div
          key={text.id}
          className="absolute text-6xl font-black text-white/15 select-none pointer-events-none"
          style={{
            left: `${text.x}%`,
            animation: `${isYes ? 'textFloatUp' : 'textFloatDown'} ${text.duration}s ease-in-out ${text.delay}s`,
            animationFillMode: 'both',
            transform: 'rotate(-15deg)',
          }}
        >
          {choice.toUpperCase()}
        </div>
      ))}

      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full bg-white animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animation: `float ${particle.duration}s ease-in-out ${particle.delay}s infinite alternate`,
            opacity: 0.6,
          }}
        />
      ))}

      {/* Main Content */}
      <div 
        className="relative z-10 flex flex-col items-center gap-6 transition-all duration-500"
        style={{
          transform: showContent ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)',
          opacity: showContent ? 1 : 0,
        }}
      >
        {/* Avatar with Glow Effect */}
        <div className="relative">
          {/* Glow rings */}
          <div className="absolute inset-0 rounded-full bg-white blur-2xl opacity-20 animate-ping" />
          <div className="absolute inset-0 rounded-full bg-white blur-xl opacity-30" 
            style={{
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          
          {/* Avatar */}
          <Avatar className="w-32 h-32 border-4 border-white relative z-10 shadow-2xl">
            <AvatarImage src={userImage} alt={userName} />
            <AvatarFallback className="text-4xl">{userName[0]}</AvatarFallback>
          </Avatar>

          {/* Check icon */}
          <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-white flex items-center justify-center border-4 border-white/20 shadow-lg z-20"
            style={{
              animation: 'bounce 1s ease-in-out 0.3s',
            }}
          >
            <Check className={`w-7 h-7 ${isYes ? 'text-green-600' : 'text-red-600'}`} strokeWidth={3} />
          </div>
        </div>

        {/* Text Content */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-white" />
            <h2 className="text-3xl font-bold text-white">Bet Placed!</h2>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex items-center gap-4 text-xl font-semibold text-white">
            <span className="uppercase tracking-wide">
              {choice}
            </span>
            <span>•</span>
            <span>
              {percentage}%
            </span>
            <span>•</span>
            <span>
              ${amount}
            </span>
          </div>

        </div>

        {/* Animated rings */}
        <div className="absolute inset-0 pointer-events-none">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-full border-2 border-white/20"
              style={{
                animation: `ping 2s cubic-bezier(0, 0, 0.2, 1) ${i * 0.3}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-20px) scale(1.2);
          }
        }
        
        @keyframes textFloatUp {
          0% {
            transform: translateY(120vh) rotate(-15deg) scale(0.8);
            opacity: 0;
          }
          10% {
            opacity: 0.15;
          }
          90% {
            opacity: 0.15;
          }
          100% {
            transform: translateY(-20vh) rotate(-15deg) scale(1.2);
            opacity: 0;
          }
        }
        
        @keyframes textFloatDown {
          0% {
            transform: translateY(-20vh) rotate(-15deg) scale(0.8);
            opacity: 0;
          }
          10% {
            opacity: 0.15;
          }
          90% {
            opacity: 0.15;
          }
          100% {
            transform: translateY(120vh) rotate(-15deg) scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

