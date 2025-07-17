import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import './SplashScreen.css';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide the Farcaster splash screen
    sdk.actions.ready();

    // Auto-hide after 3 seconds
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete();
      }, 500);
    }, 3000);

    return () => {
      clearTimeout(hideTimer);
    };
  }, [onComplete]);

  return (
    <>
      {isVisible && (
        <div className="splash-screen">
          {/* Mesmerizing Background Effects */}
          <div className="hypnotic-bg">
            <div className="ripple ripple-1"></div>
            <div className="ripple ripple-2"></div>
            <div className="ripple ripple-3"></div>
          </div>
          
          <div className="splash-content">
            {/* SuperInu Logo with Effects */}
            <div className="splash-logo-container">
              <div className="logo-orbit orbit-1"></div>
              <div className="logo-orbit orbit-2"></div>
              <div className="logo-orbit orbit-3"></div>
              <div className="splash-logo">
                <img src="/superinu.png" alt="SuperInu" />
                <div className="logo-pulse"></div>
              </div>
            </div>

            {/* Title */}
            <h1 className="splash-title">SuperInu River</h1>
            
            {/* Mesmerizing Loading Indicator */}
            <div className="loading-waves">
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 