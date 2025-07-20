-- Delete test data from leaderboard table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- First, let's see what we have
SELECT * FROM leaderboard ORDER BY created_at;

-- Delete test users
DELETE FROM leaderboard 
WHERE username LIKE 'testuser%';

-- Verify deletion
SELECT * FROM leaderboard ORDER BY score DESC;