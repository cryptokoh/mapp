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

const TrendingScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [trendingTokens, setTrendingTokens] = useState<StremeToken[]>([]);
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

  return (
    <div className="trending-overlay" onClick={handleClose}>
      <div className={`trending-panel ${isVisible ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="trending-header">
          <h2>🔥 Trending Tokens</h2>
          <button className="close-button" onClick={handleClose}>
            ✕
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
              {trendingTokens.map((token, index) => renderTokenCard(token, index))}
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