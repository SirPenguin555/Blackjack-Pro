-- Fix RLS policies to allow profile creation during signup
-- Run this in your Supabase SQL Editor

-- Drop and recreate the user_profiles INSERT policy to allow signup
DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;

CREATE POLICY "Users can create their own profile" ON user_profiles
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR 
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
    );

-- Also fix the user_game_data INSERT policy
DROP POLICY IF EXISTS "Users can create their own game data" ON user_game_data;

CREATE POLICY "Users can create their own game data" ON user_game_data
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR 
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
    );

-- Alternative approach: Create a more permissive policy for initial signup
-- This allows any authenticated user to create their own profile
DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can create their own game data" ON user_game_data;

CREATE POLICY "Users can create their own profile" ON user_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can create their own game data" ON user_game_data
    FOR INSERT WITH CHECK (user_id = auth.uid());