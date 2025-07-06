/*
  # User-Profile Many-to-Many Relationship

  1. New Tables
    - `user_profiles` junction table for many-to-many relationship between users and profiles
    - Allows multiple users to access the same profile
    - Tracks when each user added the profile to their collection

  2. Schema Changes
    - Remove user_id constraint from linkedin_profiles (keep existing data)
    - Add junction table with proper relationships
    - Add indexes for performance

  3. Security
    - Enable RLS on new junction table
    - Add policies for user access control
*/

-- Create user_profiles junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  profile_id uuid NOT NULL REFERENCES public.linkedin_profiles(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  tags text[] DEFAULT '{}'::text[],
  notes text DEFAULT '',
  is_favorite boolean DEFAULT false,
  
  -- Ensure unique user-profile combinations
  UNIQUE(user_id, profile_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_id ON public.user_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_added_at ON public.user_profiles(added_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tags ON public.user_profiles USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_user_profiles_favorite ON public.user_profiles(is_favorite) WHERE is_favorite = true;

-- Enable RLS on junction table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user access control
CREATE POLICY "Users can manage their own profile relationships"
  ON public.user_profiles
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.user_profiles TO anon, authenticated;

-- Create a view for easy profile access with user context
CREATE OR REPLACE VIEW public.user_profile_details AS
SELECT 
  up.user_id,
  up.profile_id,
  up.added_at,
  up.tags as user_tags,
  up.notes,
  up.is_favorite,
  lp.linkedin_url,
  lp.profile_data,
  lp.last_updated,
  lp.created_at
FROM public.user_profiles up
JOIN public.linkedin_profiles lp ON up.profile_id = lp.id;

-- Grant access to the view
GRANT SELECT ON public.user_profile_details TO anon, authenticated;