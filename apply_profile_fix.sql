-- Apply this SQL directly to the Supabase database to fix profile creation

-- Function to create user profile (bypasses RLS)
CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id UUID,
  p_username VARCHAR(16),
  p_email_verified BOOLEAN DEFAULT FALSE
)
RETURNS user_profiles AS $$
DECLARE
  new_profile user_profiles;
BEGIN
  -- Insert the profile record
  INSERT INTO user_profiles (user_id, username, email_verified)
  VALUES (p_user_id, p_username, p_email_verified)
  RETURNING * INTO new_profile;
  
  RETURN new_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user game data (bypasses RLS)
CREATE OR REPLACE FUNCTION create_user_game_data(
  p_user_id UUID,
  p_total_chips INTEGER DEFAULT 1000,
  p_current_table_level VARCHAR(50) DEFAULT 'beginner',
  p_current_game_variant VARCHAR(50) DEFAULT 'vegas'
)
RETURNS user_game_data AS $$
DECLARE
  new_game_data user_game_data;
BEGIN
  -- Insert the game data record
  INSERT INTO user_game_data (user_id, total_chips, current_table_level, current_game_variant)
  VALUES (p_user_id, p_total_chips, p_current_table_level, p_current_game_variant)
  RETURNING * INTO new_game_data;
  
  RETURN new_game_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, VARCHAR, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_game_data(UUID, INTEGER, VARCHAR, VARCHAR) TO authenticated;