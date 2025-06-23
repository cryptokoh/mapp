import React, { useState, useEffect } from 'react';
import './TrendingScreen.css';

interface StremeToken {
  id: number;
  name: string;
  symbol: string;
  img_url: string;
  username: string;
  marketData: {
    price: number;
    priceChange24h: number;
    volume24h: number;
    marketCap: number;
    priceChange1h: number;
    priceChange5m: number;
  };
  pfp_url?: string;
  created_at: string;
  lastTraded: {
    _seconds: number;
    _nanoseconds: number;
  };
}

interface GameTrend {
  id: string;
  title: string;
  description: string;
  players: number;
  rating: number;
  category: string;
  image?: string;
}

const TrendingScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'games'>('tokens');
  const [trendingTokens, setTrendingTokens] = useState<StremeToken[]>([]);
  const [trendingGames, setTrendingGames] = useState<GameTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Show the panel with animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Fetch trending data from Streme.Fun API
    const fetchTrendingData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch real trending tokens from Streme.Fun API
        const response = await fetch('https://api.streme.fun/api/tokens/trending');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const tokens: StremeToken[] = await response.json();
        console.log('🔥 Fetched trending tokens from Streme.Fun:', tokens.length);
        
        // Sort tokens by market cap and take top 10
        const sortedTokens = tokens
          .sort((a, b) => b.marketData.marketCap - a.marketData.marketCap)
          .slice(0, 10);
        
        setTrendingTokens(sortedTokens);
        
        // Mock trending games data (since there's no games API)
        const mockGames: GameTrend[] = [
          {
            id: '1',
            title: 'StremINU\'s SuperFluid River',
            description: 'Collect tokens and explore the blockchain world',
            players: 15420,
            rating: 4.8,
            category: 'Adventure',
            image: '/public/stremeinu.png'
          },
          {
            id: '2',
            title: 'Crypto Runner',
            description: 'Run through the crypto landscape',
            players: 8920,
            rating: 4.6,
            category: 'Runner',
            image: '/public/stremeinu.png'
          },
          {
            id: '3',
            title: 'Token Collector',
            description: 'Strategic token collection game',
            players: 12350,
            rating: 4.7,
            category: 'Strategy',
            image: '/public/stremeinu.png'
          },
          {
            id: '4',
            title: 'Blockchain Quest',
            description: 'Adventure through the blockchain',
            players: 6780,
            rating: 4.5,
            category: 'RPG',
            image: '/public/stremeinu.png'
          },
          {
            id: '5',
            title: 'DeFi Tycoon',
            description: 'Build your DeFi empire',
            players: 4560,
            rating: 4.4,
            category: 'Simulation',
            image: '/public/stremeinu.png'
          }
        ];

        setTrendingGames(mockGames);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error fetching trending data:', error);
        setError('Failed to load trending data. Please try again.');
        setLoading(false);
        
        // Fallback to mock data if API fails
        const fallbackTokens: StremeToken[] = [
          {
            id: 1,
            name: 'Streme',
            symbol: 'STREME',
            img_url: 'https://api.streme.fun/images/streme-icon.png',
            username: 'streme',
            marketData: {
              price: 0.00000025,
              priceChange24h: 5.2,
              volume24h: 1000,
              marketCap: 25000,
              priceChange1h: 1.5,
              priceChange5m: 0.2
            },
            created_at: new Date().toISOString(),
            lastTraded: {
              _seconds: Math.floor(Date.now() / 1000),
              _nanoseconds: 0
            }
          }
        ];
        setTrendingTokens(fallbackTokens);
      }
    };

    fetchTrendingData();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPrice = (price: number): string => {
    if (price < 0.000001) {
      return price.toExponential(2);
    } else if (price < 0.01) {
      return price.toFixed(8);
    } else if (price < 1) {
      return price.toFixed(6);
    } else if (price >= 1000) {
      return price.toLocaleString();
    } else {
      return price.toFixed(2);
    }
  };

  const formatTimeAgo = (timestamp: { _seconds: number; _nanoseconds: number }): string => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp._seconds;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const renderTokenCard = (token: StremeToken, index: number) => (
    <div key={`${token.id}-${index}`} className="trending-card token-card">
      <div className="card-header">
        <div className="token-info">
          <img 
            src={token.img_url || 'https://api.streme.fun/images/streme-icon.png'} 
            alt={token.name} 
            className="token-image"
            onError={(e) => {
              e.currentTarget.src = 'https://api.streme.fun/images/streme-icon.png';
            }}
          />
          <div className="token-details">
            <h4 className="token-name">{token.name}</h4>
            <span className="token-symbol">@{token.username} • {token.symbol}</span>
          </div>
        </div>
        <div className={`price-change ${token.marketData.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
          {token.marketData.priceChange24h >= 0 ? '+' : ''}{token.marketData.priceChange24h.toFixed(2)}%
        </div>
      </div>
      
      <div className="card-content">
        <div className="price-info">
          <span className="price">${formatPrice(token.marketData.price)}</span>
          <span className="time-ago">{formatTimeAgo(token.lastTraded)}</span>
        </div>
        
        <div className="token-stats">
          <div className="stat">
            <span className="stat-label">Market Cap</span>
            <span className="stat-value">${formatNumber(token.marketData.marketCap)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Volume 24h</span>
            <span className="stat-value">${formatNumber(token.marketData.volume24h)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">1h Change</span>
            <span className={`stat-value ${token.marketData.priceChange1h >= 0 ? 'positive' : 'negative'}`}>
              {token.marketData.priceChange1h >= 0 ? '+' : ''}{token.marketData.priceChange1h.toFixed(2)}%
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">5m Change</span>
            <span className={`stat-value ${token.marketData.priceChange5m >= 0 ? 'positive' : 'negative'}`}>
              {token.marketData.priceChange5m >= 0 ? '+' : ''}{token.marketData.priceChange5m.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGameCard = (game: GameTrend, index: number) => (
    <div key={`${game.id}-${index}`} className="trending-card game-card">
      <div className="card-header">
        <div className="game-info">
          {game.image && (
            <img src={game.image} alt={game.title} className="game-image" />
          )}
          <div className="game-details">
            <h4 className="game-title">{game.title}</h4>
            <span className="game-category">{game.category}</span>
          </div>
        </div>
        <div className="game-rating">
          <span className="rating-stars">★★★★★</span>
          <span className="rating-value">{game.rating}</span>
        </div>
      </div>
      
      <div className="card-content">
        <p className="game-description">{game.description}</p>
        
        <div className="game-stats">
          <div className="stat">
            <span className="stat-label">Players</span>
            <span className="stat-value">{formatNumber(game.players)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Rating</span>
            <span className="stat-value">{game.rating}/5.0</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="trending-overlay" onClick={handleClose}>
      <div className={`trending-panel ${isVisible ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="trending-header">
          <h2>🔥 Trending</h2>
          <button className="close-button" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="trending-tabs">
          <button
            className={`tab ${activeTab === 'tokens' ? 'active' : ''}`}
            onClick={() => setActiveTab('tokens')}
          >
            🪙 Tokens ({trendingTokens.length})
          </button>
          <button
            className={`tab ${activeTab === 'games' ? 'active' : ''}`}
            onClick={() => setActiveTab('games')}
          >
            🎮 Games ({trendingGames.length})
          </button>
        </div>

        <div className="trending-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading trending data from Streme.Fun...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button 
                className="retry-button"
                onClick={() => window.location.reload()}
              >
                🔄 Retry
              </button>
            </div>
          ) : (
            <div className="trending-grid">
              {activeTab === 'tokens' 
                ? trendingTokens.map((token, index) => renderTokenCard(token, index))
                : trendingGames.map((game, index) => renderGameCard(game, index))
              }
            </div>
          )}
        </div>

        <div className="trending-footer">
          <p>Live market data • Updates every 5 minutes</p>
          <button className="refresh-button" onClick={() => window.location.reload()}>
            🔄 Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrendingScreen; 