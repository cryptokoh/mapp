import { useEffect, useState } from 'react';

interface TokenValuePopupProps {
  value: number;
  symbol: string;
  x: number;
  y: number;
  onComplete: () => void;
}

export function TokenValuePopup({ value, symbol, x, y, onComplete }: TokenValuePopupProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Wait for animation to complete
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`token-value-popup ${isVisible ? 'visible' : 'fade-out'}`}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 100,
        pointerEvents: 'none',
        color: '#22d3ee',
        fontSize: '16px',
        fontWeight: '800',
        textShadow: '0 2px 8px rgba(34, 211, 238, 0.8)',
        animation: 'tokenScoreFloat 1.5s ease-out forwards',
      }}
    >
      +{value}
      <div style={{ fontSize: '10px', opacity: 0.8 }}>{symbol}</div>
    </div>
  );
}