'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/hooks/supabase';

interface MoneyData {
  currentBalance: number;
  userInBets: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch and manage user's cash available and money in bets
 * @returns {MoneyData} Object containing currentBalance, userInBets, isLoading, and error
 */
export function useUserMoney(): MoneyData {
  const { supabase } = useSupabase();
  const [currentBalance, setCurrentBalance] = useState(0);
  const [userInBets, setUserInBets] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMoneyData = async () => { 
      try {
        setIsLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setCurrentBalance(0);
          setUserInBets(0);
          setIsLoading(false);
          return;
        }

        // Fetch all money movements for the user
        const { data: movements, error: movementsError } = await supabase
          .from('money_movement')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (movementsError) {
          console.error('Error fetching money movements:', movementsError);
          setError('Failed to fetch money movements');
          return;
        }

        // Get all trades for the user to calculate money in bets first
        const { data: trades, error: tradesError } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id);

        if (tradesError) {
          console.error('Error fetching trades:', tradesError);
          setError('Failed to fetch trades');
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
            setError('Failed to fetch bets');
            return;
          }

          // Create a map of bet_id to bet data
          const betsMap = new Map(bets?.map(b => [b.id, b]) || []);

          // Calculate money in unresolved bets
          let moneyInUnresolved = 0;

          trades.forEach((trade) => {
            const bet = betsMap.get(trade.bet_id);
            
            if (!bet) return;

            // Check if bet is unresolved (is_resolved = false)
            if (!bet.is_resolved) {
              moneyInUnresolved += trade.amount;
            }
          });

          setUserInBets(moneyInUnresolved);

          // Now calculate current balance: total cash from movements minus money in bets
          if (movements) {
            // Calculate total balance from money movements
            const totalCash = movements.reduce((sum, movement) => {
              return movement.type === 'credit' 
                ? sum + movement.amount 
                : sum - movement.amount;
            }, 0);
            
            // Cash available = total cash - money in bets
            const cashAvailable = totalCash - moneyInUnresolved;
            setCurrentBalance(cashAvailable);
          } else {
            // No movements, so cash available is 0 - money in bets (negative if there are bets)
            setCurrentBalance(-moneyInUnresolved);
          }
        } else {
          // No trades, so just calculate from movements
          if (movements) {
            const balance = movements.reduce((sum, movement) => {
              return movement.type === 'credit' 
                ? sum + movement.amount 
                : sum - movement.amount;
            }, 0);
            setCurrentBalance(balance);
          }
        }
      } catch (err) {
        console.error('Error fetching money data:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMoneyData();
  }, [supabase]);

  return {
    currentBalance,
    userInBets,
    isLoading,
    error,
  };
}
