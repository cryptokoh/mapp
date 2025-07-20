#!/bin/bash

echo "🏆 SuperInu River - Supabase Database Setup"
echo "=========================================="

SUPABASE_URL="https://nkfoxyaxtkfwsncunqne.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rZm94eWF4dGtmd3NuY3VucW5lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjk1NDI0OCwiZXhwIjoyMDY4NTMwMjQ4fQ.oBG59jl0tPPyoQw0MBff09i1NSoCNzy8ieOHBniUytU"

echo "🔧 Creating leaderboard table..."

# Create the table using SQL query
curl -X POST "$SUPABASE_URL/rest/v1/rpc/query" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -d '{
    "query": "CREATE TABLE IF NOT EXISTS public.leaderboard (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, fid INTEGER NOT NULL, username TEXT NOT NULL, display_name TEXT NOT NULL, pfp_url TEXT DEFAULT \"\", score INTEGER NOT NULL DEFAULT 0, tokens_collected INTEGER NOT NULL DEFAULT 0, level INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), favorite_token_symbol TEXT, favorite_token_name TEXT, favorite_token_count INTEGER DEFAULT 0, favorite_token_img TEXT, token_stats JSONB DEFAULT \"{}\", gameplay_stats JSONB DEFAULT \"{}\")"
  }'

echo -e "\n🔍 Creating indexes..."

curl -X POST "$SUPABASE_URL/rest/v1/rpc/query" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -d '{
    "query": "CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON public.leaderboard(score DESC); CREATE INDEX IF NOT EXISTS idx_leaderboard_fid ON public.leaderboard(fid); CREATE INDEX IF NOT EXISTS idx_leaderboard_created_at ON public.leaderboard(created_at DESC);"
  }'

echo -e "\n🔒 Setting up Row Level Security..."

curl -X POST "$SUPABASE_URL/rest/v1/rpc/query" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -d '{
    "query": "ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS \"Allow public read access\" ON public.leaderboard; DROP POLICY IF EXISTS \"Allow public insert\" ON public.leaderboard; CREATE POLICY \"Allow public read access\" ON public.leaderboard FOR SELECT USING (true); CREATE POLICY \"Allow public insert\" ON public.leaderboard FOR INSERT WITH CHECK (true);"
  }'

echo -e "\n📊 Adding sample data..."

curl -X POST "$SUPABASE_URL/rest/v1/rpc/query" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -d '{
    "query": "INSERT INTO public.leaderboard (fid, username, display_name, pfp_url, score, tokens_collected, level, favorite_token_symbol, favorite_token_name, favorite_token_count, token_stats, gameplay_stats) VALUES (12345, \"testuser1\", \"Test User 1\", \"https://example.com/avatar1.png\", 1500, 25, 3, \"SUPERINU\", \"SuperInu Token\", 15, \"{\\\"SUPERINU\\\": {\\\"count\\\": 15, \\\"totalValue\\\": 1200, \\\"name\\\": \\\"SuperInu Token\\\", \\\"img_url\\\": \\\"https://example.com/superinu.png\\\", \\\"contract_address\\\": \\\"0x123\\\"}}\", \"{\\\"playTime\\\": 180, \\\"missedTokens\\\": 5, \\\"rocksHit\\\": 2, \\\"rocksSpawned\\\": 12, \\\"speedBoostsCollected\\\": 3, \\\"holdBonusTotal\\\": 150, \\\"longestStreak\\\": 8, \\\"totalTokenValue\\\": 1200, \\\"uniqueTokenTypes\\\": 3}\") ON CONFLICT DO NOTHING"
  }'

echo -e "\n🧪 Testing setup..."

# Test if the table was created successfully
RESPONSE=$(curl -s -X GET "$SUPABASE_URL/rest/v1/leaderboard?select=count" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "apikey: $SERVICE_ROLE_KEY")

if [[ $RESPONSE == *"["* ]]; then
  echo "✅ Database setup completed successfully!"
  echo "📊 Leaderboard table is ready and accessible"
  echo ""
  echo "🎉 Setup complete! Your leaderboard is ready to use."
  echo "🧪 Test it by clicking the 'Test Supabase' button in your Mini App"
else
  echo "❌ Setup may have failed. Response: $RESPONSE"
  echo ""
  echo "📝 Try manual setup:"
  echo "1. Go to https://app.supabase.com"
  echo "2. Select your project" 
  echo "3. Go to SQL Editor"
  echo "4. Run: cat supabase-setup.sql"
fi