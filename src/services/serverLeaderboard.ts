export interface LeaderboardEntry {
  id: string;
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  score: number;
  tokensCollected: number;
  level: number;
  timestamp: number;
  rank?: number;
  favoriteToken?: {
    symbol: string;
    name: string;
    count: number;
    img_url: string;
  };
  tokenStats?: Record<string, {
    count: number;
    totalValue: number;
    name: string;
    img_url: string;
  }>;
  // New gameplay metrics
  gameplayStats?: {
    playTime: number; // in seconds
    missedTokens: number;
    rocksHit: number;
    rocksSpawned: number;
    speedBoostsCollected: number;
    holdBonusTotal: number;
    longestStreak: number;
    totalTokenValue: number;
    uniqueTokenTypes: number;
  };
}

interface LeaderboardResponse {
  success: boolean;
  data?: LeaderboardEntry[] | LeaderboardEntry;
  error?: string;
  stats?: {
    totalPlayers: number;
    totalScores: number;
    highestScore: number;
  };
}

class ServerLeaderboardService {
  private baseUrl = '';
  private fallbackStorage = 'streme-leaderboard-fallback';

  constructor() {
    // Auto-detect API URL based on environment
    if (typeof window !== 'undefined') {
      this.baseUrl = window.location.origin;
    }
  }

  // Get all leaderboard entries
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      console.log('🏆 Fetching leaderboard from server...');
      const response = await fetch(`${this.baseUrl}/.netlify/functions/leaderboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result: LeaderboardResponse = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        console.log('🏆 Server leaderboard loaded:', result.data.length, 'entries');
        return result.data;
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (error) {
      console.warn('🏆 Server leaderboard failed, using local fallback:', error);
      return this.getLocalFallback();
    }
  }

  // Submit a new score (Farcaster users only)
  async submitScore(entry: Omit<LeaderboardEntry, 'id' | 'timestamp' | 'rank'>): Promise<LeaderboardEntry> {
    // Validate that this is a real Farcaster user (not demo/fallback)
    if (!entry.fid || entry.fid >= 888888) {
      throw new Error('Only Farcaster users can submit scores to the leaderboard');
    }
    try {
      console.log('🏆 Submitting score to server...', entry);
      const response = await fetch(`${this.baseUrl}/.netlify/functions/leaderboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result: LeaderboardResponse = await response.json();
      
      if (result.success && result.data && !Array.isArray(result.data)) {
        console.log('🏆 Score submitted to server successfully:', result.data);
        
        // Also save to local fallback
        this.saveToLocalFallback(result.data);
        
        return result.data;
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (error) {
      console.warn('🏆 Server submission failed, using local fallback:', error);
      return this.submitToLocalFallback(entry);
    }
  }

  // Get user's best score and rank
  async getUserBestScore(fid: number): Promise<LeaderboardEntry | null> {
    try {
      const response = await fetch(`${this.baseUrl}/.netlify/functions/leaderboard/user/${fid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        return null; // User not found
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result: LeaderboardResponse = await response.json();
      
      if (result.success && result.data && !Array.isArray(result.data)) {
        return result.data;
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (error) {
      console.warn('🏆 Server user lookup failed, using local fallback:', error);
      return this.getUserBestScoreLocal(fid);
    }
  }

  // Get user's rank
  async getUserRank(fid: number): Promise<number | null> {
    const userBest = await this.getUserBestScore(fid);
    return userBest?.rank || null;
  }

  // Get stats
  async getStats(): Promise<{ totalPlayers: number; totalScores: number; highestScore: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/.netlify/functions/leaderboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result: LeaderboardResponse = await response.json();
      
      if (result.success && result.stats) {
        return result.stats;
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (error) {
      console.warn('🏆 Server stats failed, using local fallback:', error);
      return this.getStatsLocal();
    }
  }

  // Local fallback methods
  private getLocalFallback(): LeaderboardEntry[] {
    try {
      const stored = localStorage.getItem(this.fallbackStorage);
      if (!stored) return [];
      
      const entries: LeaderboardEntry[] = JSON.parse(stored);
      
      // Deduplicate by player, keeping best score
      const bestScoresByPlayer = new Map<number, LeaderboardEntry>();
      entries.forEach(entry => {
        const existing = bestScoresByPlayer.get(entry.fid);
        if (!existing || entry.score > existing.score) {
          bestScoresByPlayer.set(entry.fid, entry);
        }
      });
      
      // Convert to array and sort
      return Array.from(bestScoresByPlayer.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 100)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
    } catch (error) {
      console.error('Error loading local fallback:', error);
      return [];
    }
  }

  private submitToLocalFallback(entry: Omit<LeaderboardEntry, 'id' | 'timestamp' | 'rank'>): LeaderboardEntry {
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: `${entry.fid}-${Date.now()}`,
      timestamp: Date.now(),
    };

    try {
      const currentEntries = this.getLocalFallback();
      const updatedEntries = [...currentEntries, newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 100);

      localStorage.setItem(this.fallbackStorage, JSON.stringify(updatedEntries));
      
      newEntry.rank = updatedEntries.findIndex(e => e.id === newEntry.id) + 1;
      console.log('🏆 Score saved to local fallback:', newEntry);
      
      return newEntry;
    } catch (error) {
      console.error('Error saving to local fallback:', error);
      return newEntry;
    }
  }

  private saveToLocalFallback(entry: LeaderboardEntry): void {
    try {
      const currentEntries = this.getLocalFallback();
      const updatedEntries = [...currentEntries.filter(e => e.id !== entry.id), entry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 100);

      localStorage.setItem(this.fallbackStorage, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Error saving to local fallback:', error);
    }
  }

  private getUserBestScoreLocal(fid: number): LeaderboardEntry | null {
    const entries = this.getLocalFallback();
    const userEntries = entries.filter(e => e.fid === fid);
    if (userEntries.length === 0) return null;
    
    return userEntries.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }

  private getStatsLocal(): { totalPlayers: number; totalScores: number; highestScore: number } {
    try {
      const stored = localStorage.getItem(this.fallbackStorage);
      if (!stored) return { totalPlayers: 0, totalScores: 0, highestScore: 0 };
      
      const allEntries: LeaderboardEntry[] = JSON.parse(stored);
      const deduplicatedEntries = this.getLocalFallback();
      
      return {
        totalPlayers: deduplicatedEntries.length, // Number of unique players
        totalScores: allEntries.length, // Total number of games played
        highestScore: deduplicatedEntries.length > 0 ? deduplicatedEntries[0].score : 0,
      };
    } catch (error) {
      console.error('Error getting local stats:', error);
      return { totalPlayers: 0, totalScores: 0, highestScore: 0 };
    }
  }

  // Clear all data (for development)
  clearAll(): void {
    localStorage.removeItem(this.fallbackStorage);
    console.log('🏆 All leaderboard data cleared');
  }
}

export const serverLeaderboardService = new ServerLeaderboardService();