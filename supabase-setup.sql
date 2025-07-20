-- SuperInu River Leaderboard Table Setup
-- Run this in your Supabase SQL Editor

-- Create the leaderboard table
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fid INTEGER NOT NULL,
    username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    pfp_url TEXT DEFAULT '',
    score INTEGER NOT NULL DEFAULT 0,
    tokens_collected INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    favorite_token_symbol TEXT,
    favorite_token_name TEXT,
    favorite_token_count INTEGER DEFAULT 0,
    favorite_token_img TEXT,
    token_stats JSONB DEFAULT '{}',
    gameplay_stats JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON public.leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_fid ON public.leaderboard(fid);
CREATE INDEX IF NOT EXISTS idx_leaderboard_created_at ON public.leaderboard(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON public.leaderboard;
DROP POLICY IF EXISTS "Allow public insert" ON public.leaderboard;
DROP POLICY IF EXISTS "Prevent updates" ON public.leaderboard;
DROP POLICY IF EXISTS "Prevent deletes" ON public.leaderboard;

-- Create RLS policies
CREATE POLICY "Allow public read access" ON public.leaderboard
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON public.leaderboard
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Prevent updates" ON public.leaderboard
    FOR UPDATE USING (false);

CREATE POLICY "Prevent deletes" ON public.leaderboard
    FOR DELETE USING (false);

-- Insert some sample data for testing (optional)
INSERT INTO public.leaderboard (
    fid, username, display_name, pfp_url, score, tokens_collected, level,
    favorite_token_symbol, favorite_token_name, favorite_token_count,
    token_stats, gameplay_stats
) VALUES 
(
    12345, 'testuser1', 'Test User 1', 'https://example.com/avatar1.png', 
    1500, 25, 3,
    'SUPERINU', 'SuperInu Token', 15,
    '{"SUPERINU": {"count": 15, "totalValue": 1200, "name": "SuperInu Token", "img_url": "https://example.com/superinu.png", "contract_address": "0x123"}}',
    '{"playTime": 180, "missedTokens": 5, "rocksHit": 2, "rocksSpawned": 12, "speedBoostsCollected": 3, "holdBonusTotal": 150, "longestStreak": 8, "totalTokenValue": 1200, "uniqueTokenTypes": 3}'
),
(
    67890, 'testuser2', 'Test User 2', 'https://example.com/avatar2.png',
    2200, 35, 4,
    'DEGEN', 'Degen Token', 20,
    '{"DEGEN": {"count": 20, "totalValue": 1800, "name": "Degen Token", "img_url": "https://example.com/degen.png", "contract_address": "0x456"}}',
    '{"playTime": 240, "missedTokens": 3, "rocksHit": 1, "rocksSpawned": 15, "speedBoostsCollected": 4, "holdBonusTotal": 200, "longestStreak": 12, "totalTokenValue": 1800, "uniqueTokenTypes": 4}'
)
ON CONFLICT DO NOTHING;

-- Verify the setup
SELECT 'Table created successfully!' as status;
SELECT COUNT(*) as total_entries FROM public.leaderboard;
SELECT 'Setup complete! You can now test the leaderboard.' as message;