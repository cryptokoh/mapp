import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { serverLeaderboardService } from '../services/serverLeaderboard';
import type { LeaderboardEntry } from '../services/serverLeaderboard';
import { useFarcaster } from '../hooks/useFarcaster';
import './Leaderboard.css';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserScore?: number;
}

export function Leaderboard({ isOpen, onClose, currentUserScore }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState({ totalPlayers: 0, totalScores: 0, highestScore: 0 });
  const [activeTab, setActiveTab] = useState<'top10' | 'all'>('top10');
  const { user } = useFarcaster();

  useEffect(() => {
    if (isOpen) {
      loadLeaderboard();
    }
  }, [isOpen]);

  const loadLeaderboard = async () => {
    try {
      const allEntries = await serverLeaderboardService.getLeaderboard();
      const statsData = await serverLeaderboardService.getStats();
      setEntries(allEntries);
      setStats(statsData);
      console.log('🏆 Loaded leaderboard:', allEntries.length, 'entries');
    } catch (error) {
      console.error('🏆 Failed to load leaderboard:', error);
    }
  };

  const displayEntries = activeTab === 'top10' ? entries.slice(0, 10) : entries;
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userBest, setUserBest] = useState<LeaderboardEntry | null>(null);

  // Load user data when user changes
  useEffect(() => {
    if (user && isOpen) {
      Promise.all([
        serverLeaderboardService.getUserRank(user.fid),
        serverLeaderboardService.getUserBestScore(user.fid)
      ]).then(([rank, best]) => {
        setUserRank(rank);
        setUserBest(best);
      }).catch(error => {
        console.error('🏆 Failed to load user data:', error);
      });
    }
  }, [user, isOpen]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const formatScore = (score: number) => {
    return score.toLocaleString();
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="leaderboard-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="leaderboard-modal"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="leaderboard-header">
            <h2>🏆 Leaderboard</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>

          {/* Stats */}
          <div className="leaderboard-stats">
            <div className="stat-item">
              <span className="stat-value">{stats.totalPlayers}</span>
              <span className="stat-label">Players</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{formatScore(stats.highestScore)}</span>
              <span className="stat-label">High Score</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.totalScores}</span>
              <span className="stat-label">Games Played</span>
            </div>
          </div>

          {/* User Stats */}
          {user && (
            <div className="user-stats">
              <div className="user-info">
                <img 
                  src={user.pfpUrl || '/superinu.png'} 
                  alt={user.displayName}
                  className="user-avatar"
                  onError={(e) => {
                    e.currentTarget.src = '/superinu.png';
                  }}
                />
                <div className="user-details">
                  <span className="user-name">{user.displayName}</span>
                  <a 
                    href={`https://warpcast.com/${user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="user-username clickable"
                  >
                    @{user.username}
                  </a>
                </div>
              </div>
              <div className="user-performance">
                {userBest && (
                  <>
                    <div className="user-stat">
                      <span className="user-stat-label">Best Score</span>
                      <span className="user-stat-value">{formatScore(userBest.score)}</span>
                    </div>
                    <div className="user-stat">
                      <span className="user-stat-label">Best Rank</span>
                      <span className="user-stat-value">{getRankIcon(userRank || 0)}</span>
                    </div>
                  </>
                )}
                {currentUserScore && (
                  <div className="user-stat">
                    <span className="user-stat-label">Last Game</span>
                    <span className="user-stat-value">{formatScore(currentUserScore)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="leaderboard-tabs">
            <button
              className={`tab-button ${activeTab === 'top10' ? 'active' : ''}`}
              onClick={() => setActiveTab('top10')}
            >
              Top 10
            </button>
            <button
              className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Players ({entries.length})
            </button>
          </div>

          {/* Leaderboard List */}
          <div className="leaderboard-list">
            {displayEntries.length === 0 ? (
              <div className="empty-leaderboard">
                <span className="empty-icon">🎮</span>
                <p>No scores yet!</p>
                <p>Be the first to play and set a high score!</p>
              </div>
            ) : (
              displayEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  className={`leaderboard-entry ${entry.fid === user?.fid ? 'current-user' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="entry-rank">
                    {getRankIcon(entry.rank || index + 1)}
                  </div>
                  
                  <div className="entry-player">
                    <img 
                      src={entry.pfpUrl || '/superinu.png'} 
                      alt={entry.displayName}
                      className="entry-avatar"
                      onError={(e) => {
                        e.currentTarget.src = '/superinu.png';
                      }}
                    />
                    <div className="entry-info">
                      <span className="entry-name">{entry.displayName}</span>
                      <a 
                        href={`https://warpcast.com/${entry.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="entry-username clickable"
                      >
                        @{entry.username}
                      </a>
                    </div>
                  </div>
                  
                  <div className="entry-stats">
                    <div className="entry-score">{formatScore(entry.score)}</div>
                    <div className="entry-details">
                      <span>Tokens: {entry.tokensCollected}</span>
                      <span>Level: {entry.level}</span>
                    </div>
                    {entry.favoriteToken && (
                      <div className="entry-favorite-token">
                        <img 
                          src={entry.favoriteToken.img_url} 
                          alt={entry.favoriteToken.symbol}
                          className="favorite-token-image"
                          onError={(e) => {
                            e.currentTarget.src = 'https://api.streme.fun/images/streme-icon.png';
                          }}
                        />
                        <div className="favorite-token-info">
                          <span className="favorite-token-symbol">{entry.favoriteToken.symbol}</span>
                          <span className="favorite-token-count">{entry.favoriteToken.count}x</span>
                        </div>
                      </div>
                    )}
                    <div className="entry-time">{formatTimeAgo(entry.timestamp)}</div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="leaderboard-footer">
            <button className="play-again-button" onClick={onClose}>
              🎮 Back to Game
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}