-- =============================================
-- Reset incorrect policies if they exist
-- =============================================
/*
# [Operation Name] Reset Profile Update Policy
[This operation drops a potentially faulty policy on the profiles table to allow for its correct re-creation. This is a cleanup step to fix the previous migration error.]

## Query Description: [This operation will temporarily remove the update rule on user profiles. It's safe to run and necessary to apply the corrected security policy. No data will be lost.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]
*/
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;


-- =============================================
-- Create helper function to check ownership
-- =============================================
/*
# [Operation Name] Create Profile Update Helper Function
[This function checks if the currently authenticated user is the owner of a specific profile. It's a security helper for our database policies.]

## Query Description: [This creates a reusable SQL function. It's a safe, non-destructive operation that adds a security feature. It also resolves the 'Function Search Path Mutable' warning by explicitly setting the search_path.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Security Implications:
- RLS Status: [This is a helper for RLS]
- Policy Changes: [No]
- Auth Requirements: [Used by authenticated roles]
*/
CREATE OR REPLACE FUNCTION public.can_update_profile(profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
-- IMPORTANT: Set search_path to prevent security vulnerabilities
SET search_path = public
AS $$
BEGIN
  -- Check if the user is the owner of the profile
  RETURN (auth.uid() = profile_id);
END;
$$;


-- =============================================
-- Re-create policies for the 'profiles' table
-- =============================================
/*
# [Operation Name] Re-apply Profile Security Policies
[This operation re-creates the security rules for the 'profiles' table, ensuring users can only access and modify their own data.]

## Query Description: [This applies row-level security to the profiles table. Users will be able to see and edit their own profile, and see other users' profiles, but not edit them. This is a critical security enhancement.]

## Metadata:
- Schema-Category: ["Structural", "Safe"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Affects 'profiles' table policies.

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [Applies to 'authenticated' role]
*/

-- Users can view their own profile and other profiles.
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Users can insert their own profile.
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (public.can_update_profile(id))
WITH CHECK (public.can_update_profile(id));

-- =============================================
-- Fix search_path on other functions
-- =============================================
/*
# [Operation Name] Secure Other Helper Functions
[This operation updates existing database functions to explicitly set the 'search_path', resolving the security advisory warning.]

## Query Description: [This is a security hardening step. It modifies the functions for handling new users and calculating totals to make them more secure. It's a safe and recommended change.]

## Metadata:
- Schema-Category: ["Structural", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  
  -- Create an initial wallet for the user
  INSERT INTO public.wallets (user_id, balance)
  VALUES (new.id, 0);

  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_totals(p_user_id uuid)
RETURNS TABLE(total_balance numeric, total_saved numeric, goals_completed bigint, avg_progress numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(w.balance, 0) AS total_balance,
        COALESCE(g.total_saved, 0) AS total_saved,
        COALESCE(g.goals_completed, 0) AS goals_completed,
        COALESCE(g.avg_progress, 0) AS avg_progress
    FROM
        wallets w
    LEFT JOIN (
        SELECT
            user_id,
            SUM(current_amount) AS total_saved,
            COUNT(*) FILTER (WHERE current_amount >= target_amount) AS goals_completed,
            AVG(CASE WHEN target_amount > 0 THEN (current_amount / target_amount) * 100 ELSE 0 END) AS avg_progress
        FROM goals
        WHERE goals.user_id = p_user_id
        GROUP BY user_id
    ) g ON w.user_id = g.user_id
    WHERE w.user_id = p_user_id;
END;
$$;
