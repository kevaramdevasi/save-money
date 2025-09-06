import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Goal, Transaction } from '../lib/types';

interface AppContextType {
  goals: Goal[];
  transactions: Transaction[];
  totalBalance: number;
  loading: boolean;
  addGoal: (goalData: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'current_amount'>) => Promise<void>;
  editGoal: (goalId: string, goalData: Partial<Omit<Goal, 'id' | 'user_id' | 'created_at'>>) => Promise<void>;
  addToGoal: (goalId: string, amount: number) => Promise<void>;
  addTransaction: (txData: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppData() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppProvider');
  }
  return context;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchInitialData();

      const goalSubscription = supabase
        .channel('public:goals')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'goals' },
          () => fetchGoals()
        )
        .subscribe();

      const transactionSubscription = supabase
        .channel('public:transactions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions' },
          () => fetchTransactions()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(goalSubscription);
        supabase.removeChannel(transactionSubscription);
      };
    } else {
      // Clear data on logout
      setGoals([]);
      setTransactions([]);
      setLoading(false);
    }
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching goals:', error);
    else setGoals(data || []);
  };

  const fetchTransactions = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching transactions:', error);
    else setTransactions(data || []);
  };

  const fetchInitialData = async () => {
    await Promise.all([fetchGoals(), fetchTransactions()]);
    setLoading(false);
  };

  const addGoal = async (goalData: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'current_amount'>) => {
    if (!user) throw new Error('User not authenticated');
    const { error } = await supabase.from('goals').insert({
      ...goalData,
      user_id: user.id,
      current_amount: 0,
    });
    if (error) throw error;
  };
  
  const editGoal = async (goalId: string, goalData: Partial<Omit<Goal, 'id' | 'user_id' | 'created_at'>>) => {
    if (!user) throw new Error('User not authenticated');
    const { error } = await supabase
      .from('goals')
      .update(goalData)
      .eq('id', goalId)
      .eq('user_id', user.id);
    if (error) throw error;
  };

  const addTransaction = async (txData: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) throw new Error('User not authenticated');
    const { error } = await supabase.from('transactions').insert({
      ...txData,
      user_id: user.id,
    });
    if (error) throw error;
  };

  const addToGoal = async (goalId: string, amount: number) => {
    if (!user) throw new Error('User not authenticated');
    
    const goal = goals.find(g => g.id === goalId);
    if (!goal) throw new Error('Goal not found');

    // 1. Add transaction record
    await addTransaction({
      title: `Added to ${goal.title}`,
      amount,
      category: 'Savings',
      icon: goal.emoji,
      merchant: 'Goal Savings',
      goal_id: goalId,
    });

    // 2. Update goal's current amount
    const { error } = await supabase.rpc('add_to_goal', {
      goal_id_param: goalId,
      amount_param: amount,
    });

    if (error) {
      console.error('Error adding to goal:', error);
      throw error;
    }
  };

  const totalBalance = transactions.reduce((acc, tx) => {
    if (tx.category === 'Income') return acc + tx.amount;
    if (tx.category === 'Expense') return acc - tx.amount;
    // Savings are transfers, so they don't affect the total balance directly
    return acc;
  }, 0);

  const value = {
    goals,
    transactions,
    totalBalance,
    loading,
    addGoal,
    editGoal,
    addToGoal,
    addTransaction,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
