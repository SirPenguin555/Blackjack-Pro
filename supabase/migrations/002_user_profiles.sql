-- User profiles and authentication migration
-- This adds user profiles with usernames and account-based data storage

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
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_game_data_user_id ON user_game_data(user_id);

-- Row Level Security policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own profile" ON user_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (user_id = auth.uid());

-- Row Level Security policies for user_game_data
ALTER TABLE user_game_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own game data" ON user_game_data
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own game data" ON user_game_data
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own game data" ON user_game_data
    FOR UPDATE USING (user_id = auth.uid());

-- Function to create user profile and game data when user signs up
CREATE OR REPLACE FUNCTION create_user_profile_and_data()
RETURNS TRIGGER AS $$
BEGIN
    -- This function will be called by a trigger when a new user is created
    -- For now, we'll handle profile creation in the application
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_game_data_updated_at BEFORE UPDATE ON user_game_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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