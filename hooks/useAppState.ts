import { useState, useEffect } from 'react';

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  emoji: string;
  deadline: string;
  color: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: 'income' | 'expense' | 'savings';
  time: string;
  icon: string;
  merchant: string;
  goalId?: string;
}

export interface AppState {
  totalBalance: number;
  goals: Goal[];
  transactions: Transaction[];
  user: {
    name: string;
    email: string;
    avatar: string;
    joinDate: string;
  };
}

const initialState: AppState = {
  totalBalance: 4672.89,
  goals: [
    {
      id: '1',
      title: 'New iPhone 15',
      target: 1200,
      current: 750,
      emoji: '📱',
      deadline: '2024-06-01',
      color: '#8B5CF6',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      title: 'Summer Vacation',
      target: 3000,
      current: 1850,
      emoji: '🏖️',
      deadline: '2024-07-15',
      color: '#EC4899',
      createdAt: '2024-01-20',
    },
    {
      id: '3',
      title: 'Gaming Setup',
      target: 2500,
      current: 900,
      emoji: '🎮',
      deadline: '2024-08-30',
      color: '#10B981',
      createdAt: '2024-02-01',
    },
    {
      id: '4',
      title: 'Emergency Fund',
      target: 5000,
      current: 2100,
      emoji: '🛡️',
      deadline: '2024-12-31',
      color: '#F59E0B',
      createdAt: '2024-02-10',
    },
  ],
  transactions: [
    {
      id: '1',
      title: 'Freelance Payment',
      amount: 450.00,
      category: 'Income',
      type: 'income',
      time: '2 hours ago',
      icon: '💼',
      merchant: 'Upwork',
    },
    {
      id: '2',
      title: 'Coffee & Snacks',
      amount: -12.50,
      category: 'Food & Drink',
      type: 'expense',
      time: '5 hours ago',
      icon: '☕',
      merchant: 'Starbucks',
    },
    {
      id: '3',
      title: 'iPhone Fund',
      amount: 50.00,
      category: 'Savings',
      type: 'savings',
      time: '1 day ago',
      icon: '📱',
      merchant: 'Goal Savings',
      goalId: '1',
    },
    {
      id: '4',
      title: 'Uber Ride',
      amount: -12.30,
      category: 'Transportation',
      type: 'expense',
      time: '2 days ago',
      icon: '🚗',
      merchant: 'Uber',
    },
    {
      id: '5',
      title: 'Online Shopping',
      amount: -89.99,
      category: 'Shopping',
      type: 'expense',
      time: '3 days ago',
      icon: '🛍️',
      merchant: 'Amazon',
    },
  ],
  user: {
    name: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    avatar: 'A',
    joinDate: 'Feb 2024',
  },
};

export function useAppState() {
  const [state, setState] = useState<AppState>(initialState);

  const addGoal = (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));
  };

  const updateGoal = (goalId: string, updates: Partial<Goal>) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(goal =>
        goal.id === goalId ? { ...goal, ...updates } : goal
      ),
    }));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    
    setState(prev => {
      let newBalance = prev.totalBalance;
      let updatedGoals = prev.goals;

      // Update balance
      if (transaction.type === 'income') {
        newBalance += transaction.amount;
      } else if (transaction.type === 'expense') {
        newBalance += transaction.amount; // amount is already negative
      } else if (transaction.type === 'savings' && transaction.goalId) {
        // Update goal progress
        updatedGoals = prev.goals.map(goal =>
          goal.id === transaction.goalId
            ? { ...goal, current: Math.min(goal.current + transaction.amount, goal.target) }
            : goal
        );
      }

      return {
        ...prev,
        totalBalance: newBalance,
        goals: updatedGoals,
        transactions: [newTransaction, ...prev.transactions],
      };
    });
  };

  const addToGoal = (goalId: string, amount: number) => {
    const transaction: Omit<Transaction, 'id'> = {
      title: `Added to ${state.goals.find(g => g.id === goalId)?.title}`,
      amount,
      category: 'Savings',
      type: 'savings',
      time: 'Just now',
      icon: state.goals.find(g => g.id === goalId)?.emoji || '🎯',
      merchant: 'Goal Savings',
      goalId,
    };
    
    addTransaction(transaction);
  };

  return {
    state,
    actions: {
      addGoal,
      updateGoal,
      addTransaction,
      addToGoal,
    },
  };
}
