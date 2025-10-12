'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function ProfilePage() {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  // Mock user data
  const userCash = 1250;
  const userInBets = 450;
  const userName = "Alex Johnson";
  const userEmail = "alex.johnson@email.com";
  const memberSince = "January 2024";

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
        {/* Avatar and Basic Info - Horizontal Layout */}
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="w-20 h-20 flex-shrink-0">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" alt="Profile" />
            <AvatarFallback className="text-2xl">U</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground mb-1">{userName}</h2>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
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

        {/* Statistics */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Statistics</h3>
          <div className="space-y-4">
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

