'use client';

import { useState } from 'react';
import { useSupabase } from '@/lib/hooks/supabase';

interface CreateBetData {
  betName: string;
  imageUrl: string; // Can be blob URL or regular URL
  expirationDate: string;
  amount: string;
  initialChoice: 'yes' | 'no';
  initialPercentage: number;
  allSelectedMembers: string[]; // User IDs of all participants
  crownedParticipants: string[]; // User IDs of crowned/admins
  currentUser: {
    id: string;
    pseudonym: string;
    avatar_url: string | null;
  };
  currentBalance: number; // User's available cash
}

interface UseCreateBetResult {
  createBet: (data: CreateBetData) => Promise<void>;
  isCreating: boolean;
  error: string | null;
}

/**
 * Custom hook to handle bet creation including image upload and Supabase insertion
 */
export function useCreateBet(): UseCreateBetResult {
  const { supabase } = useSupabase();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBet = async (data: CreateBetData) => {
    setIsCreating(true);
    setError(null);

    try {
      // Validate that the bet amount doesn't exceed available cash
      const betAmount = parseFloat(data.amount);
      if (isNaN(betAmount) || betAmount <= 0) {
        throw new Error('Invalid bet amount');
      }
      
      if (betAmount > data.currentBalance) {
        throw new Error(`Insufficient funds. You have $${data.currentBalance.toFixed(2)} but trying to bet $${betAmount.toFixed(2)}`);
      }

      let finalImageUrl = data.imageUrl;
      
      // If image is a blob URL, upload it to R2
      if (data.imageUrl.startsWith('blob:')) {
        const response = await fetch(data.imageUrl);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Generate filename with user's pseudonym
        const fileExtension = blob.type.split('/')[1] || 'jpg';
        const timestamp = Date.now();
        const sanitizedPseudonym = data.currentUser.pseudonym.replace(/[^a-zA-Z0-9]/g, '');
        const fileName = `bets/${sanitizedPseudonym}-${timestamp}.${fileExtension}`;
        
        // Upload to R2
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: (() => {
            const formData = new FormData();
            formData.append('file', new File([buffer], fileName, { type: blob.type }));
            formData.append('pseudonym', data.currentUser.pseudonym);
            formData.append('fileType', 'bet');
            return formData;
          })(),
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }
        
        const { url } = await uploadResponse.json();
        finalImageUrl = url;
        
        // Clean up blob URL
        URL.revokeObjectURL(data.imageUrl);
      }

      // Save bet to Supabase
      let betData: { id: string } | null = null;
      try {
        const result = await supabase
          .from('bets')
          .insert({
            created_by: data.currentUser.id,
            title: data.betName,
            image_url: finalImageUrl,
            is_resolved: false,
            resolved_at: data.expirationDate ? new Date(data.expirationDate).toISOString() : null,
          })
          .select()
          .single();
        
        if (result.error) {
          throw result.error;
        }
        
        betData = result.data as { id: string };
      } catch (betError) {
        console.error('Error creating bet:', betError);
        throw betError;
      }

      console.log('Bet created successfully:', betData);

      // Save participants to bet_participants table
      // Always include the bet creator as an admin, but avoid duplicates
      const allParticipants = [...new Set([data.currentUser.id, ...data.allSelectedMembers])];
      const participantsData = allParticipants.map(userId => ({
        bet_id: betData!.id,
        user_id: userId,
        is_admin: userId === data.currentUser.id || data.crownedParticipants.includes(userId),
        joined_at: new Date().toISOString(),
      }));

      const { error: participantsError } = await supabase
        .from('bet_participants')
        .insert(participantsData);

      if (participantsError) {
        console.error('Error saving participants:', participantsError);
        
        // Cleanup: Delete the bet we created
        await supabase
          .from('bets')
          .delete()
          .eq('id', betData!.id);
        
        throw participantsError;
      } else {
        console.log('Participants saved successfully:', participantsData);
      }

      // Create the creator's initial trade
      const tradeData = {
        bet_id: betData!.id,
        user_id: data.currentUser.id,
        side: data.initialChoice, // 'yes' or 'no'
        price: data.initialPercentage, // The price (percentage) at which they're buying
        amount: betAmount,
        maker_trade_id: null,
      };

      const { error: tradeError } = await supabase
        .from('trades')
        .insert(tradeData);
 
      if (tradeError) {
        console.error('Error creating initial trade:', tradeError);
        
        // Cleanup: Delete the bet and participants we created
        await supabase
          .from('bet_participants')
          .delete()
          .eq('bet_id', betData.id);
        
        await supabase
          .from('bets')
          .delete()
          .eq('id', betData.id);
        
        throw tradeError;
      } else {
        console.log('Initial trade created successfully:', tradeData);
      }

    } catch (err) {
      console.error('Error creating bet:', err);
      setError(err instanceof Error ? err.message : 'Failed to create bet');
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return { createBet, isCreating, error };
}

interface TakeBetData {
  bet_id: string;
  user_id: string;
  side: 'yes' | 'no';
  price: number;
  amount: number;
  maker_trade_id: string;
  currentBalance: number;
}

interface UseTakeBetResult {
  takeBet: (data: TakeBetData) => Promise<void>;
  isTaking: boolean;
  error: string | null;
}

/**
 * Custom hook to handle taking a bet against an existing maker
 */
export function useTakeBet(): UseTakeBetResult {
  const { supabase } = useSupabase();
  const [isTaking, setIsTaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takeBet = async (data: TakeBetData) => {
    setIsTaking(true);
    setError(null);

    try {
      // Validate that the bet amount doesn't exceed available cash
      const betAmount = data.amount;
      if (isNaN(betAmount) || betAmount <= 0) {
        throw new Error('Invalid bet amount');
      }
      
      if (betAmount > data.currentBalance) {
        throw new Error(`Insufficient funds. You have $${data.currentBalance.toFixed(2)} but trying to bet $${betAmount.toFixed(2)}`);
      }

      // Get the maker trade to validate it exists
      const { data: makerTrade, error: makerError } = await supabase
        .from('trades')
        .select('*')
        .eq('id', data.maker_trade_id)
        .single();

      if (makerError || !makerTrade) {
        throw new Error('Maker trade not found');
      }

      // Validate the maker trade has no taker yet
      if (makerTrade.maker_trade_id !== null) {
        throw new Error('This trade has already been taken');
      }

      // Get all existing taker trades for this maker trade
      const { data: existingTakers, error: takersError } = await supabase
        .from('trades')
        .select('amount')
        .eq('maker_trade_id', data.maker_trade_id);

      if (takersError) {
        throw new Error('Failed to fetch existing takers');
      }

      // Calculate total amount already taken from this maker
      const totalTaken = (existingTakers as Array<{ amount: number }> | null)?.reduce((sum, t) => sum + t.amount, 0) || 0;
      
      // Calculate remaining available amount (maker's original amount minus total taken)
      const remainingAvailable = makerTrade.amount - totalTaken;

      // Validate the amount doesn't exceed remaining available liquidity (already accounting for price)
      if (betAmount > remainingAvailable) {
        throw new Error(`Amount exceeds available liquidity. Only $${remainingAvailable.toFixed(2)} remaining from this maker.`);
      }

      // Create the taker trade
      const tradeData = {
        bet_id: data.bet_id,
        user_id: data.user_id,
        side: data.side,
        price: data.price,
        amount: betAmount,
        maker_trade_id: data.maker_trade_id,
      };

      const { error: tradeError } = await supabase
        .from('trades')
        .insert(tradeData);

      if (tradeError) {
        console.error('Error creating taker trade:', tradeError);
        throw tradeError;
      }

      console.log('Taker trade created successfully:', tradeData);

    } catch (err) {
      console.error('Error taking bet:', err);
      setError(err instanceof Error ? err.message : 'Failed to take bet');
      throw err;
    } finally {
      setIsTaking(false);
    }
  };

  return { takeBet, isTaking, error };
}

interface CreateMakerTradeData {
  bet_id: string;
  user_id: string;
  side: 'yes' | 'no';
  price: number;
  amount: number;
  currentBalance: number;
}

interface UseCreateMakerTradeResult {
  createMakerTrade: (data: CreateMakerTradeData) => Promise<void>;
  isCreating: boolean;
  error: string | null;
}

/**
 * Custom hook to handle creating a new maker trade (proposing a bet)
 */
export function useCreateMakerTrade(): UseCreateMakerTradeResult {
  const { supabase } = useSupabase();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMakerTrade = async (data: CreateMakerTradeData) => {
    setIsCreating(true);
    setError(null);

    try {
      // Validate that the bet amount doesn't exceed available cash
      const betAmount = data.amount;
      if (isNaN(betAmount) || betAmount <= 0) {
        throw new Error('Invalid bet amount');
      }
      
      if (betAmount > data.currentBalance) {
        throw new Error(`Insufficient funds. You have $${data.currentBalance.toFixed(2)} but trying to bet $${betAmount.toFixed(2)}`);
      }

      // Create the maker trade (maker_trade_id is null for maker trades)
      const tradeData = {
        bet_id: data.bet_id,
        user_id: data.user_id,
        side: data.side,
        price: data.price,
        amount: betAmount,
        maker_trade_id: null,
      };

      const { error: tradeError } = await supabase
        .from('trades')
        .insert(tradeData);

      if (tradeError) {
        console.error('Error creating maker trade:', tradeError);
        throw tradeError;
      }

      console.log('Maker trade created successfully:', tradeData);

    } catch (err) {
      console.error('Error creating maker trade:', err);
      setError(err instanceof Error ? err.message : 'Failed to create maker trade');
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return { createMakerTrade, isCreating, error };
}
