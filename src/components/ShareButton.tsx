import { useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import './ShareButton.css';

interface ShareButtonProps {
  className?: string;
}

export function ShareButton({ className = '' }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // Create a cast with the game
      await sdk.actions.composeCast({
        text: `🎮 Playing Stremeinu's River Adventure! Collect trending tokens and stake them for rewards! Built with React, TypeScript, and the Farcaster SDK. 🌊`
      });
    } catch (error) {
      console.error('Failed to share:', error);
    } finally {
      setIsSharing(false);
      setShowOptions(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      
      // Show a brief success message
      const button = document.querySelector('.share-button') as HTMLElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = '✅ Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
    setShowOptions(false);
  };

  return (
    <div className={`share-container ${className}`}>
      <button
        className="share-button"
        onClick={() => setShowOptions(!showOptions)}
        disabled={isSharing}
      >
        {isSharing ? '📤 Sharing...' : '🎮 Share Game'}
      </button>
      
      {showOptions && (
        <div className="share-options">
          <button 
            className="share-option"
            onClick={handleShare}
            disabled={isSharing}
          >
            📱 Cast to Farcaster
          </button>
          <button 
            className="share-option"
            onClick={handleCopyLink}
          >
            📋 Copy Link
          </button>
          <button 
            className="share-option"
            onClick={() => setShowOptions(false)}
          >
            ❌ Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// Quick share buttons
export function QuickShareButtons() {
  return (
    <div className="quick-share-buttons">
      <h3>Share Your Game:</h3>
      <div className="share-grid">
        <ShareButton />
      </div>
    </div>
  );
} 