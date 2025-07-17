import { useEffect, useState } from 'react';
import type { StremeToken } from '../services/tokenService';

interface TokenCollectedPopupProps {
  token: StremeToken;
  value: number;
  x: number;
  y: number;
  onComplete: () => void;
}

export function TokenCollectedPopup({ token, value, x, y, onComplete }: TokenCollectedPopupProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 400); // Wait for animation to complete
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`token-collected-popup ${isVisible ? 'visible' : 'fade-out'}`}
      style={{
        position: 'absolute',
        left: `${Math.max(10, Math.min(x - 50, window.innerWidth - 110))}px`,
        top: `${Math.max(10, y - 30)}px`,
        zIndex: 200,
        pointerEvents: 'none',
      }}
    >
      <div className="token-collected-content">
        <div className="token-collected-header">
          <img 
            src={token.img_url} 
            alt={token.symbol}
            className="token-collected-image"
            onError={(e) => {
              e.currentTarget.src = 'https://api.streme.fun/images/streme-icon.png';
            }}
          />
          <div className="token-collected-info">
            <div className="token-collected-symbol">{token.symbol}</div>
            <div className="token-collected-name">{token.name}</div>
          </div>
        </div>
        <div className="token-collected-value">+{value} points</div>
        {token.marketData.priceChange24h > 0 && (
          <div className="token-collected-trend">
            📈 +{token.marketData.priceChange24h.toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}