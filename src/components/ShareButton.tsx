import { useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { EMBED_CONFIGS, createShareableEmbed } from '../lib/embeds';
import './ShareButton.css';

interface ShareButtonProps {
  variant?: 'default' | 'success' | 'features' | 'neynar' | 'game';
  className?: string;
}

export function ShareButton({ variant = 'default', className = '' }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // Create a cast with the app embed
      await sdk.actions.composeCast({
        text: `🚀 Check out this awesome Farcaster Mini App! Built with React, TypeScript, and Vite. Features Neynar integration and a beautiful purple gradient theme!`,
        embeds: [createShareableEmbed(variant)]
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
      const shareUrl = createShareableEmbed(variant);
      await navigator.clipboard.writeText(shareUrl);
      
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

  const getButtonText = () => {
    switch (variant) {
      case 'success':
        return '🎉 Share Success';
      case 'features':
        return '✨ Share Features';
      case 'neynar':
        return '🔗 Share Neynar';
      case 'game':
        return '🎮 Share Game';
      default:
        return '🚀 Share App';
    }
  };

  return (
    <div className={`share-container ${className}`}>
      <button
        className="share-button"
        onClick={() => setShowOptions(!showOptions)}
        disabled={isSharing}
      >
        {isSharing ? '📤 Sharing...' : getButtonText()}
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

// Quick share buttons for different scenarios
export function QuickShareButtons() {
  return (
    <div className="quick-share-buttons">
      <h3>Share Your Experience:</h3>
      <div className="share-grid">
        <ShareButton variant="default" />
        <ShareButton variant="success" />
        <ShareButton variant="features" />
        <ShareButton variant="neynar" />
        <ShareButton variant="game" />
      </div>
    </div>
  );
} 