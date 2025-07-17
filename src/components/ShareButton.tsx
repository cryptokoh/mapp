import { useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { socialSharingService } from '../services/socialSharing';
import './ShareButton.css';

interface ShareButtonProps {
  className?: string;
  gameData?: {
    score: number;
    tokensCollected: number;
    level: number;
    rank?: number;
  };
}

export function ShareButton({ className = '', gameData }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (gameData) {
        // Create custom share text for Farcaster
        const shareText = `I just caught ${gameData.tokensCollected} SuperFluid tokens on @StremeInu's $SuperInu River Adventure! 🌊🐕\n\n🏆 Score: ${gameData.score.toLocaleString()}\n🪙 Tokens: ${gameData.tokensCollected}\n⭐ Level: ${gameData.level}\n\n🎮 Try to catch them here: https://farcaster.xyz/miniapps/UnoOnG81fzr4/stremeinu-superfluid-river`;
        
        await sdk.actions.composeCast({
          text: shareText
        });
      } else {
        // Share general game
        await sdk.actions.composeCast({
          text: `🌊 Just discovered SuperInu River! 🐕\n\nHelp SuperInu catch streaming SuperFluid tokens in this addictive river adventure! 🪙\n\n🎮 Try to catch them here: https://farcaster.xyz/miniapps/UnoOnG81fzr4/stremeinu-superfluid-river`
        });
      }
    } catch (error) {
      console.error('Failed to share:', error);
      // Fallback to other sharing methods
      if (gameData) {
        await socialSharingService.openShareOptions(gameData);
      }
    } finally {
      setIsSharing(false);
    }
  };


  const achievementText = gameData ? socialSharingService.getAchievementText(gameData) : null;

  return (
    <div className={`share-container ${className}`}>
      {achievementText && (
        <div className="achievement-text">
          {achievementText}
        </div>
      )}
      
      <button
        className="share-button"
        onClick={handleShare}
        disabled={isSharing}
      >
        {isSharing ? '📤 Sharing...' : gameData ? '🚀 Share Score' : '🎮 Share Game'}
      </button>
      
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