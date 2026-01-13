-- Add is_new_user column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_new_user BOOLEAN DEFAULT true;
