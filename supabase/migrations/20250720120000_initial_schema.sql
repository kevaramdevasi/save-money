/*
# [Initial Schema Setup]
This script sets up the initial database schema for the GenZ Finance App. It includes tables for user profiles, savings goals, and transactions, along with necessary security policies and a trigger to automatically create user profiles upon registration.

## Query Description: This operation is structural and safe. It creates new tables and enables Row Level Security (RLS) to ensure users can only access their own data. No existing data will be affected as this is the initial setup. It is recommended to run this on a fresh database.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping tables)

## Structure Details:
- Tables Created: `profiles`, `goals`, `transactions`
- Triggers Created: `on_auth_user_created` on `auth.users`
- Functions Created: `handle_new_user()`
- RLS Policies: Enabled and configured for all new tables.

## Security Implications:
- RLS Status: Enabled on all tables.
- Policy Changes: Yes, policies are created to restrict data access to the owner.
- Auth Requirements: Policies are based on `auth.uid()`.

## Performance Impact:
- Indexes: Primary keys and foreign keys are indexed by default.
- Triggers: One trigger on `auth.users` for new user profile creation.
- Estimated Impact: Low performance impact, standard for user-based applications.
*/

-- 1. PROFILES TABLE
-- Stores public user data.
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ,
  PRIMARY KEY (id)
);

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create a profile for a new user.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. GOALS TABLE
-- Stores user savings goals.
CREATE TABLE public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  emoji TEXT,
  deadline DATE,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies for goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own goals." ON public.goals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 3. TRANSACTIONS TABLE
-- Stores user financial transactions.
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  goal_id UUID REFERENCES public.goals ON DELETE SET NULL,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT,
  type TEXT, -- 'income', 'expense', 'savings'
  merchant TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own transactions." ON public.transactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
