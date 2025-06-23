import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import './SplashScreen.css';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showGame, setShowGame] = useState(false);

  useEffect(() => {
    // Hide the Farcaster splash screen
    sdk.actions.ready();

    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    // Auto-hide after 3 seconds
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setShowGame(true);
        onComplete();
      }, 500);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(hideTimer);
    };
  }, [onComplete]);

  return (
    <>
      {isVisible && (
        <div className="splash-screen">
          {/* Animated Background */}
          <div className="river-background">
            <div className="river-flow"></div>
            <div className="river-flow river-flow-2"></div>
            <div className="river-flow river-flow-3"></div>
            
            {/* Floating particles */}
            <div className="particles">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="particle" style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}></div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="splash-content">
            {/* Stremeinu Character */}
            <div className="stremeinu-splash">
              <img src="/stremeinu.png" alt="Stremeinu" />
              <div className="stremeinu-glow"></div>
            </div>

            {/* Title */}
            <div className="splash-title">
              <h1>StremeINU's SuperFluid River</h1>
              <p>Navigate the river of trending tokens</p>
            </div>

            {/* Progress Bar */}
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="progress-text">{progress}%</span>
            </div>

            {/* Loading Animation */}
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>

            {/* Instructions */}
            <div className="splash-instructions">
              <p>🎮 Use Arrow Keys or W/S to move</p>
              <p>🌊 Dodge the trending Streme tokens</p>
              <p>🏆 Survive as long as possible!</p>
            </div>
          </div>

          {/* Skip Button */}
          <button 
            className="skip-button"
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => {
                setShowGame(true);
                onComplete();
              }, 500);
            }}
          >
            Skip Intro
          </button>
        </div>
      )}

      {/* Transition Screen */}
      {!isVisible && !showGame && (
        <div className="transition-screen">
          <div className="transition-content">
            <h2>Ready to Float?</h2>
            <div className="transition-stremeinu">
              <img src="/stremeinu.png" alt="Stremeinu" />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 