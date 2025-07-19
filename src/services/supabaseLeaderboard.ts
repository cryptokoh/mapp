import { supabase } from '../lib/supabase'
import type { LeaderboardEntry } from './serverLeaderboard'

interface SupabaseLeaderboardEntry {
  id: string
  fid: number
  username: string
  display_name: string
  pfp_url: string
  score: number
  tokens_collected: number
  level: number
  created_at: string
  favorite_token_symbol?: string
  favorite_token_name?: string
  favorite_token_count?: number
  favorite_token_img?: string
  token_stats?: Record<string, any>
}

class SupabaseLeaderboardService {
  // Get all leaderboard entries
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      console.log('🏆 Fetching leaderboard from Supabase...')
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(100)

      if (error) {
        console.error('❌ Supabase query error:', error)
        throw error
      }

      if (!data) {
        return []
      }

      // Transform Supabase data to match our LeaderboardEntry interface
      const entries: LeaderboardEntry[] = data.map((entry: SupabaseLeaderboardEntry, index) => ({
        id: entry.id,
        fid: entry.fid,
        username: entry.username,
        displayName: entry.display_name,
        pfpUrl: entry.pfp_url,
        score: entry.score,
        tokensCollected: entry.tokens_collected,
        level: entry.level,
        timestamp: new Date(entry.created_at).getTime(),
        rank: index + 1,
        favoriteToken: entry.favorite_token_symbol ? {
          symbol: entry.favorite_token_symbol,
          name: entry.favorite_token_name || '',
          count: entry.favorite_token_count || 0,
          img_url: entry.favorite_token_img || ''
        } : undefined,
        tokenStats: entry.token_stats
      }))

      console.log('✅ Supabase leaderboard loaded:', entries.length, 'entries')
      return entries
    } catch (error) {
      console.error('❌ Failed to fetch leaderboard:', error)
      return []
    }
  }

  // Submit a new score (Farcaster users only)
  async submitScore(entry: Omit<LeaderboardEntry, 'id' | 'timestamp' | 'rank'>): Promise<LeaderboardEntry> {
    // Validate that this is a real Farcaster user (not demo/fallback)
    if (!entry.fid || entry.fid >= 888888) {
      throw new Error('Only Farcaster users can submit scores to the leaderboard')
    }

    try {
      console.log('🏆 Submitting score to Supabase...', entry)
      
      // First check if user already has a score
      const { data: existingScores } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('fid', entry.fid)
        .order('score', { ascending: false })
        .limit(1)

      // Only submit if this is a new high score
      if (existingScores && existingScores.length > 0 && existingScores[0].score >= entry.score) {
        console.log('⚠️ Score not submitted - not a new high score')
        return {
          ...entry,
          id: existingScores[0].id,
          timestamp: new Date(existingScores[0].created_at).getTime(),
          rank: await this.getUserRank(entry.fid) || 0
        }
      }

      const supabaseEntry = {
        fid: entry.fid,
        username: entry.username,
        display_name: entry.displayName,
        pfp_url: entry.pfpUrl,
        score: entry.score,
        tokens_collected: entry.tokensCollected,
        level: entry.level,
        favorite_token_symbol: entry.favoriteToken?.symbol,
        favorite_token_name: entry.favoriteToken?.name,
        favorite_token_count: entry.favoriteToken?.count,
        favorite_token_img: entry.favoriteToken?.img_url,
        token_stats: entry.tokenStats
      }

      const { data, error } = await supabase
        .from('leaderboard')
        .insert([supabaseEntry])
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase insert error:', error)
        throw error
      }

      if (!data) {
        throw new Error('No data returned from insert')
      }

      console.log('✅ Score submitted to Supabase successfully!')
      
      // Get the rank
      const rank = await this.getUserRank(entry.fid)
      
      return {
        ...entry,
        id: data.id,
        timestamp: new Date(data.created_at).getTime(),
        rank: rank || 0
      }
    } catch (error) {
      console.error('❌ Failed to submit score:', error)
      throw error
    }
  }

  // Get user's best score and rank
  async getUserBestScore(fid: number): Promise<LeaderboardEntry | null> {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('fid', fid)
        .order('score', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('❌ Supabase query error:', error)
        throw error
      }

      if (!data) {
        return null
      }

      // Get rank
      const rank = await this.getUserRank(fid)

      return {
        id: data.id,
        fid: data.fid,
        username: data.username,
        displayName: data.display_name,
        pfpUrl: data.pfp_url,
        score: data.score,
        tokensCollected: data.tokens_collected,
        level: data.level,
        timestamp: new Date(data.created_at).getTime(),
        rank: rank || undefined,
        favoriteToken: data.favorite_token_symbol ? {
          symbol: data.favorite_token_symbol,
          name: data.favorite_token_name || '',
          count: data.favorite_token_count || 0,
          img_url: data.favorite_token_img || ''
        } : undefined,
        tokenStats: data.token_stats
      }
    } catch (error) {
      console.error('❌ Failed to get user best score:', error)
      return null
    }
  }

  // Get user's rank
  async getUserRank(fid: number): Promise<number | null> {
    try {
      const { data: userScore } = await supabase
        .from('leaderboard')
        .select('score')
        .eq('fid', fid)
        .order('score', { ascending: false })
        .limit(1)
        .single()

      if (!userScore) {
        return null
      }

      const { count, error } = await supabase
        .from('leaderboard')
        .select('*', { count: 'exact', head: true })
        .gt('score', userScore.score)

      if (error) {
        console.error('❌ Error getting rank:', error)
        return null
      }

      return (count || 0) + 1
    } catch (error) {
      console.error('❌ Failed to get user rank:', error)
      return null
    }
  }

  // Get stats
  async getStats(): Promise<{ totalPlayers: number; totalScores: number; highestScore: number }> {
    try {
      // Get total unique players
      const { data: players, error: playersError } = await supabase
        .from('leaderboard')
        .select('fid', { count: 'exact' })
        
      if (playersError) {
        throw playersError
      }

      // Get highest score
      const { data: highest, error: highestError } = await supabase
        .from('leaderboard')
        .select('score')
        .order('score', { ascending: false })
        .limit(1)
        .single()

      if (highestError && highestError.code !== 'PGRST116') {
        throw highestError
      }

      // Get unique player count
      const uniqueFids = new Set(players?.map(p => p.fid) || [])

      return {
        totalPlayers: uniqueFids.size,
        totalScores: players?.length || 0,
        highestScore: highest?.score || 0
      }
    } catch (error) {
      console.error('❌ Failed to get stats:', error)
      return {
        totalPlayers: 0,
        totalScores: 0,
        highestScore: 0
      }
    }
  }

  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('leaderboard')
        .select('count')
        .limit(1)
      
      if (error) {
        console.error('❌ Supabase connection test failed:', error)
        return false
      }
      
      console.log('✅ Supabase connection successful!')
      return true
    } catch (error) {
      console.error('❌ Supabase connection test error:', error)
      return false
    }
  }
}

export const supabaseLeaderboardService = new SupabaseLeaderboardService()