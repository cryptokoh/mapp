import { useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
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
      // Fallback: copy to clipboard
      if (gameData) {
        const shareText = `I just caught ${gameData.tokensCollected} SuperFluid tokens on @StremeInu's $SuperInu River Adventure! 🌊🐕\n\n🏆 Score: ${gameData.score.toLocaleString()}\n🪙 Tokens: ${gameData.tokensCollected}\n⭐ Level: ${gameData.level}\n\n🎮 Try to catch them here: https://farcaster.xyz/miniapps/UnoOnG81fzr4/stremeinu-superfluid-river`;
        await navigator.clipboard.writeText(shareText);
      }
    } finally {
      setIsSharing(false);
    }
  };


  const getAchievementText = (data: typeof gameData) => {
    if (!data) return null;
    const { score, tokensCollected, rank } = data;
    
    if (rank === 1) return "🏆 NEW HIGH SCORE! You're the top swimmer! 👑";
    if (rank && rank <= 3) return "🥉 Top 3! You're swimming with the best! 🏊‍♂️";
    if (score >= 10000) return "🎯 Score Master! Over 10,000 points! ⚡";
    if (tokensCollected >= 50) return "🪙 Token Collector! Caught 50+ tokens! 💰";
    if (score >= 5000) return "🌊 River Expert! Keep swimming! 🐕";
    if (tokensCollected >= 20) return "🎮 Getting Good! Nice token collecting! 🎯";
    return null;
  };

  const achievementText = getAchievementText(gameData);

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

 