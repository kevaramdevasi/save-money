export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  emoji: string;
  deadline?: string;
  color: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: 'Income' | 'Expense' | 'Savings';
  icon: string;
  merchant?: string;
  goal_id?: string;
  created_at: string;
}
