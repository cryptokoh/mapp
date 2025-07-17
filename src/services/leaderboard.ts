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
}

class LeaderboardService {
  private storageKey = 'streme-leaderboard';
  private maxEntries = 100;

  // Get all leaderboard entries sorted by score
  getLeaderboard(): LeaderboardEntry[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const entries: LeaderboardEntry[] = JSON.parse(stored);
      return entries
        .sort((a, b) => b.score - a.score) // Sort by score descending
        .slice(0, this.maxEntries) // Limit to max entries
        .map((entry, index) => ({ ...entry, rank: index + 1 })); // Add rank
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      return [];
    }
  }

  // Submit a new score
  submitScore(entry: Omit<LeaderboardEntry, 'id' | 'timestamp' | 'rank'>): LeaderboardEntry {
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: `${entry.fid}-${Date.now()}`,
      timestamp: Date.now(),
    };

    try {
      const currentEntries = this.getLeaderboard();
      
      // Check if this is a new high score for this user
      const userBestScore = Math.max(
        ...currentEntries
          .filter(e => e.fid === entry.fid)
          .map(e => e.score),
        0
      );

      const isNewHighScore = entry.score > userBestScore;
      
      // Add the new entry
      const updatedEntries = [...currentEntries, newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, this.maxEntries);

      localStorage.setItem(this.storageKey, JSON.stringify(updatedEntries));
      
      console.log(`🏆 Score submitted: ${entry.score} points${isNewHighScore ? ' (NEW HIGH SCORE!)' : ''}`);
      
      return {
        ...newEntry,
        rank: updatedEntries.findIndex(e => e.id === newEntry.id) + 1,
      };
    } catch (error) {
      console.error('Error submitting score:', error);
      return newEntry;
    }
  }

  // Get user's best score
  getUserBestScore(fid: number): LeaderboardEntry | null {
    const entries = this.getLeaderboard();
    const userEntries = entries.filter(e => e.fid === fid);
    if (userEntries.length === 0) return null;
    
    return userEntries.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }

  // Get user's rank
  getUserRank(fid: number): number | null {
    const entries = this.getLeaderboard();
    const userBest = this.getUserBestScore(fid);
    if (!userBest) return null;
    
    return entries.findIndex(e => e.fid === fid && e.score === userBest.score) + 1;
  }

  // Get top N players
  getTopPlayers(limit: number = 10): LeaderboardEntry[] {
    return this.getLeaderboard().slice(0, limit);
  }

  // Clear leaderboard (for development)
  clearLeaderboard(): void {
    localStorage.removeItem(this.storageKey);
    console.log('🏆 Leaderboard cleared');
  }

  // Get leaderboard stats
  getStats(): { totalPlayers: number; totalScores: number; highestScore: number } {
    const entries = this.getLeaderboard();
    const uniquePlayers = new Set(entries.map(e => e.fid)).size;
    
    return {
      totalPlayers: uniquePlayers,
      totalScores: entries.length,
      highestScore: entries.length > 0 ? entries[0].score : 0,
    };
  }
}

export const leaderboardService = new LeaderboardService();