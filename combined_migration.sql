-- Combined Migration for Blackjack Pro
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Game tables for multiplayer lobbies
CREATE TABLE IF NOT EXISTS game_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(6) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    max_players INTEGER NOT NULL DEFAULT 4,
    current_players INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'waiting',
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash VARCHAR(255),
    host_user_id UUID NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game states for active multiplayer games
CREATE TABLE IF NOT EXISTS game_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES game_tables(id) ON DELETE CASCADE,
    round INTEGER NOT NULL DEFAULT 1,
    phase VARCHAR(50) NOT NULL DEFAULT 'betting',
    current_player_index INTEGER NOT NULL DEFAULT 0,
    dealer JSONB NOT NULL DEFAULT '{}',
    players JSONB NOT NULL DEFAULT '[]',
    deck JSONB NOT NULL DEFAULT '[]',
    last_action VARCHAR(100),
    messages JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players in multiplayer tables
CREATE TABLE IF NOT EXISTS table_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES game_tables(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    chips INTEGER NOT NULL DEFAULT 1000,
    is_connected BOOLEAN NOT NULL DEFAULT TRUE,
    is_host BOOLEAN NOT NULL DEFAULT FALSE,
    seat_position INTEGER,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(table_id, user_id),
    UNIQUE(table_id, seat_position)
);

-- Chat messages for multiplayer tables
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID NOT NULL REFERENCES game_tables(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    player_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player statistics and progress (old table)
CREATE TABLE IF NOT EXISTS player_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    total_chips INTEGER NOT NULL DEFAULT 1000,
    statistics JSONB NOT NULL DEFAULT '{}',
    achievements JSONB NOT NULL DEFAULT '[]',
    table_level VARCHAR(50) NOT NULL DEFAULT 'beginner',
    game_variant VARCHAR(50) NOT NULL DEFAULT 'vegas',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table for extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(16) UNIQUE NOT NULL,
    display_name VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Profile settings
    email_verified BOOLEAN DEFAULT FALSE,
    profile_picture_url TEXT,
    
    -- Game preferences
    preferred_table_level VARCHAR(50) DEFAULT 'beginner',
    preferred_game_variant VARCHAR(50) DEFAULT 'vegas',
    
    -- Constraints
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 16),
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$'),
    CONSTRAINT username_no_admin CHECK (lower(username) NOT LIKE '%admin%')
);

-- User game data for account-based storage
CREATE TABLE IF NOT EXISTS user_game_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Current game state
    total_chips INTEGER NOT NULL DEFAULT 1000,
    current_table_level VARCHAR(50) DEFAULT 'beginner',
    current_game_variant VARCHAR(50) DEFAULT 'vegas',
    
    -- Statistics (replaces localStorage stats)
    total_hands_played INTEGER DEFAULT 0,
    hands_won INTEGER DEFAULT 0,
    hands_lost INTEGER DEFAULT 0,
    hands_pushed INTEGER DEFAULT 0,
    blackjacks_hit INTEGER DEFAULT 0,
    total_winnings INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    biggest_win INTEGER DEFAULT 0,
    biggest_loss INTEGER DEFAULT 0,
    winning_streak INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_winning_streak INTEGER DEFAULT 0,
    
    -- Advanced statistics
    hands_by_variant JSONB DEFAULT '{}',
    hands_by_table_level JSONB DEFAULT '{}',
    strategy_accuracy JSONB DEFAULT '{}',
    betting_patterns JSONB DEFAULT '{}',
    
    -- Achievements
    achievements_unlocked JSONB DEFAULT '[]',
    achievement_progress JSONB DEFAULT '{}',
    
    -- Progression
    tables_unlocked JSONB DEFAULT '["beginner"]',
    variants_unlocked JSONB DEFAULT '["vegas"]',
    tutorial_progress JSONB DEFAULT '{}',
    
    -- Multiplayer statistics
    multiplayer_games_played INTEGER DEFAULT 0,
    multiplayer_games_won INTEGER DEFAULT 0,
    multiplayer_tables_hosted INTEGER DEFAULT 0,
    multiplayer_total_winnings INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update existing player_profiles table to reference user_profiles
ALTER TABLE player_profiles 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_tables_code ON game_tables(code);
CREATE INDEX IF NOT EXISTS idx_game_tables_status ON game_tables(status);
CREATE INDEX IF NOT EXISTS idx_game_tables_host ON game_tables(host_user_id);
CREATE INDEX IF NOT EXISTS idx_game_states_table_id ON game_states(table_id);
CREATE INDEX IF NOT EXISTS idx_table_players_table_id ON table_players(table_id);
CREATE INDEX IF NOT EXISTS idx_table_players_user_id ON table_players(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_table_id ON chat_messages(table_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_player_profiles_user_id ON player_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_game_data_user_id ON user_game_data(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE game_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_data ENABLE ROW LEVEL SECURITY;

-- Policies for game_tables
CREATE POLICY "Users can view public tables" ON game_tables
    FOR SELECT USING (NOT is_private OR host_user_id = auth.uid());

CREATE POLICY "Users can create tables" ON game_tables
    FOR INSERT WITH CHECK (host_user_id = auth.uid());

CREATE POLICY "Hosts can update their tables" ON game_tables
    FOR UPDATE USING (host_user_id = auth.uid());

CREATE POLICY "Hosts can delete their tables" ON game_tables
    FOR DELETE USING (host_user_id = auth.uid());

-- Policies for game_states
CREATE POLICY "Players can view game states for their tables" ON game_states
    FOR SELECT USING (
        table_id IN (
            SELECT table_id FROM table_players WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Hosts can manage game states" ON game_states
    FOR ALL USING (
        table_id IN (
            SELECT id FROM game_tables WHERE host_user_id = auth.uid()
        )
    );

-- Policies for table_players
CREATE POLICY "Users can view players in their tables" ON table_players
    FOR SELECT USING (
        table_id IN (
            SELECT table_id FROM table_players WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join tables" ON table_players
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own player record" ON table_players
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can leave tables" ON table_players
    FOR DELETE USING (user_id = auth.uid());

-- Policies for chat_messages
CREATE POLICY "Players can view chat in their tables" ON chat_messages
    FOR SELECT USING (
        table_id IN (
            SELECT table_id FROM table_players WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Players can send chat messages" ON chat_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        table_id IN (
            SELECT table_id FROM table_players WHERE user_id = auth.uid()
        )
    );

-- Policies for player_profiles
CREATE POLICY "Users can view their own profile" ON player_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own profile" ON player_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON player_profiles
    FOR UPDATE USING (user_id = auth.uid());

-- Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own profile" ON user_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (user_id = auth.uid());

-- Policies for user_game_data
CREATE POLICY "Users can view their own game data" ON user_game_data
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own game data" ON user_game_data
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own game data" ON user_game_data
    FOR UPDATE USING (user_id = auth.uid());

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_game_tables_updated_at BEFORE UPDATE ON game_tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_states_updated_at BEFORE UPDATE ON game_states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_profiles_updated_at BEFORE UPDATE ON player_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_game_data_updated_at BEFORE UPDATE ON user_game_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup inactive tables
CREATE OR REPLACE FUNCTION cleanup_inactive_tables()
RETURNS void AS $$
BEGIN
    -- Delete tables that have been inactive for more than 24 hours
    DELETE FROM game_tables 
    WHERE updated_at < NOW() - INTERVAL '24 hours'
    AND status != 'active';
    
    -- Update player connection status based on last_seen
    UPDATE table_players 
    SET is_connected = FALSE 
    WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ language 'plpgsql';

-- Create a function to generate unique table codes
CREATE OR REPLACE FUNCTION generate_table_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    code VARCHAR(6);
    chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    i INTEGER;
    char_length INTEGER := length(chars);
BEGIN
    LOOP
        code := '';
        FOR i IN 1..6 LOOP
            code := code || substring(chars FROM (floor(random() * char_length) + 1) FOR 1);
        END LOOP;
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM game_tables WHERE code = code) THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ language 'plpgsql';

-- Function to create user profile and game data when user signs up
CREATE OR REPLACE FUNCTION create_user_profile_and_data()
RETURNS TRIGGER AS $$
BEGIN
    -- This function will be called by a trigger when a new user is created
    -- For now, we'll handle profile creation in the application
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check username availability
CREATE OR REPLACE FUNCTION is_username_available(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE lower(username) = lower(check_username)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to validate username format
CREATE OR REPLACE FUNCTION validate_username(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check length
    IF char_length(check_username) < 3 OR char_length(check_username) > 16 THEN
        RETURN FALSE;
    END IF;
    
    -- Check format (alphanumeric, underscore, dash only)
    IF check_username !~ '^[a-zA-Z0-9_-]+$' THEN
        RETURN FALSE;
    END IF;
    
    -- Check for admin
    IF lower(check_username) LIKE '%admin%' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;