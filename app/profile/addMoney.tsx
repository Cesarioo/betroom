'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowDownToLine, ArrowUpFromLine, Bitcoin, Landmark, Copy, Check, UserRound, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import dbData from '@/backend/db.json';

interface AddMoneyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'withdraw';
  currentBalance: number;
}

export default function AddMoney({ open, onOpenChange, mode, currentBalance }: AddMoneyProps) {
  const [activeTab, setActiveTab] = useState<'crypto' | 'bank' | 'friend'>('crypto');
  const [selectedChain, setSelectedChain] = useState('base');
  const [copied, setCopied] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [error, setError] = useState('');
  const [isFriendSelectorOpen, setIsFriendSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock deposit address (in real app, this would be generated per user/transaction)
  const depositAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  
  // Mock bank details
  const bankDetails = {
    iban: 'GB29 NWBK 6016 1331 9268 19',
    beneficiary: 'Betroom Inc.',
    memo: 'user@email.com' // User's email
  };

  // Get available friends (all users except current user)
  const availableFriends = dbData.users.filter(user => user.id !== 'user_1');
  
  // Filter friends by search query
  const filteredFriends = availableFriends.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get selected friend
  const selectedFriend = selectedFriendId ? dbData.users.find(u => u.id === selectedFriendId) : null;

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setActiveTab(mode === 'add' ? 'crypto' : 'friend');
      setSelectedChain('base');
      setCopied(false);
      setWithdrawAddress('');
      setSelectedFriendId(null);
      setWithdrawAmount('');
      setError('');
      setSearchQuery('');
    }
  }, [open, mode]);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(depositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyBankDetail = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleWithdraw = () => {
    if (!withdrawAddress || withdrawAddress.trim() === '') {
      setError('Please enter a valid address');
      return;
    }

    // Validate address format (basic check)
    if (!withdrawAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Invalid address format');
      return;
    }

    // Here you would handle the actual withdrawal
    console.log(`Withdrawing to address: ${withdrawAddress} on chain: ${selectedChain}`);
    
    // Reset and close
    setWithdrawAddress('');
    setError('');
    onOpenChange(false);
  };

  const handleSendToFriend = () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!withdrawAmount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount > currentBalance) {
      setError('Insufficient balance');
      return;
    }

    if (!selectedFriendId) {
      setError('Please select a friend');
      return;
    }

    // Here you would handle the actual send to friend
    console.log(`Sending $${amount} to user ${selectedFriendId}`);
    
    // Reset and close
    setSelectedFriendId(null);
    setWithdrawAmount('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'add' ? (
              <>
                <ArrowDownToLine className="w-5 h-5 text-green-500" />
                <span>Add Money</span>
              </>
            ) : (
              <>
                <ArrowUpFromLine className="w-5 h-5 text-red-500" />
                <span>Withdraw Money</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            {mode === 'add' ? (
              <>
                <button
                  onClick={() => setActiveTab('crypto')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
                    activeTab === 'crypto'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Bitcoin className="w-4 h-4" />
                  <span className="text-sm font-medium">Crypto</span>
                </button>
                <button
                  onClick={() => setActiveTab('bank')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
                    activeTab === 'bank'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Landmark className="w-4 h-4" />
                  <span className="text-sm font-medium">Bank</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('friend')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
                    activeTab === 'friend'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <UserRound className="w-4 h-4" />
                  <span className="text-sm font-medium">Friend</span>
                </button>
                <button
                  onClick={() => setActiveTab('crypto')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
                    activeTab === 'crypto'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Bitcoin className="w-4 h-4" />
                  <span className="text-sm font-medium">Crypto</span>
                </button>
              </>
            )}
          </div>

          {/* Content based on mode and tab */}
          {mode === 'add' ? (
            activeTab === 'crypto' ? (
              // Crypto Deposit
              <div className="space-y-4">
                  <label className="text-sm font-medium text-foreground block mb-2">Deposit Address</label>
                  <div className="flex gap-2 items-center">
                    <Image
                      src="/usdc.png"
                      alt="USDC"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <Select value={selectedChain} onValueChange={setSelectedChain}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="base">Base</SelectItem>
                        <SelectItem value="polygon">Polygon</SelectItem>
                        <SelectItem value="arbitrum">Arbitrum</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="text"
                      value={`${depositAddress.slice(0, 5)}...${depositAddress.slice(-5)}`}
                      readOnly
                      className="flex-1 font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyAddress}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                <p className="text-xs text-muted-foreground text-center">
                  Send USDC on {selectedChain.charAt(0).toUpperCase() + selectedChain.slice(1)} • Do not close this window once funds are sent • Please try a small sum first. 
                </p>
              </div>
            ) : (
              // Bank Deposit
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">IBAN</label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={bankDetails.iban}
                        readOnly
                        className="flex-1 font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyBankDetail(bankDetails.iban)}
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Beneficiary</label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={bankDetails.beneficiary}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyBankDetail(bankDetails.beneficiary)}
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Memo (Your Email)</label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={bankDetails.memo}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyBankDetail(bankDetails.memo)}
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Send EUR to this address • Please try a small sum first • Do not close this window once funds are sent.
                </p>
              </div>
            )
          ) : (
            // Withdraw mode
            activeTab === 'friend' ? (
              // Send to a Friend
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Friend Selector */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Friend</label>
                    <Popover open={isFriendSelectorOpen} onOpenChange={setIsFriendSelectorOpen} modal={true}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent dark:bg-primary/5 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          {selectedFriend ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-5 h-5">
                                <AvatarImage src={selectedFriend.profileImage} alt={selectedFriend.name} />
                                <AvatarFallback className="text-[10px]">{selectedFriend.name[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{selectedFriend.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Select friend</span>
                          )}
                          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-64 p-0 max-h-[calc(100vh-120px)]" 
                        align="start" 
                        sideOffset={4}
                        onOpenAutoFocus={(e) => e.preventDefault()}
                      >
                        <div className="flex flex-col">
                          {/* Search Input */}
                          <div className="border-b">
                            <div className="px-3 py-2">
                              <Input
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-[26px] text-sm"
                              />
                            </div>
                          </div>
                          
                          {/* Users List */}
                          <div className="py-1 space-y-1 max-h-60 overflow-y-auto">
                            {filteredFriends.length === 0 ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                No users found
                              </div>
                            ) : (
                              filteredFriends.map((user) => (
                                <button
                                  key={user.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedFriendId(user.id);
                                    setIsFriendSelectorOpen(false);
                                    setSearchQuery('');
                                    setError('');
                                  }}
                                  className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-accent transition-colors ${
                                    selectedFriendId === user.id ? 'bg-accent/50' : ''
                                  }`}
                                >
                                  <Avatar className="w-6 h-6 flex-shrink-0">
                                    <AvatarImage src={user.profileImage} alt={user.name} />
                                    <AvatarFallback className="text-[10px]">{user.name[0]}</AvatarFallback>
                                  </Avatar>
                                  <span className="flex-1 text-left text-sm">{user.name}</span>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="text"
                        value={withdrawAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                            setWithdrawAmount(value);
                            setError('');
                          }
                        }}
                        placeholder="0.00"
                        className="pl-8 h-[40px]"
                      />
                    </div>
                  </div>
                </div>
                
                {error && <p className="text-sm text-red-500">{error}</p>}

                <p className="text-xs text-muted-foreground text-center">
                  Your friend will receive funds instantly • Transaction cannot be reversed • Verify the recipient
                </p>

                <Button
                  onClick={handleSendToFriend}
                  className="w-full bg-red-500 hover:bg-red-600"
                >
                  Send to Friend
                </Button>
              </div>
            ) : (
              // Crypto Withdraw
              <div className="space-y-4">
                <label className="text-sm font-medium text-foreground block mb-2">Withdrawal Address</label>
                <div className="flex gap-2 items-center">
                  <Image
                    src="/usdc.png"
                    alt="USDC"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <Select value={selectedChain} onValueChange={setSelectedChain}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base">Base</SelectItem>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      <SelectItem value="polygon">Polygon</SelectItem>
                      <SelectItem value="arbitrum">Arbitrum</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => {
                      setWithdrawAddress(e.target.value);
                      setError('');
                    }}
                    placeholder="0x..."
                    className="flex-1 font-mono text-sm"
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}

                <p className="text-xs text-muted-foreground text-center">
                  Double-check the address • Withdrawals cannot be reversed • Please try a small sum first
                </p>

                <Button
                  onClick={handleWithdraw}
                  className="w-full bg-red-500 hover:bg-red-600"
                >
                  Confirm Withdrawal
                </Button>
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
