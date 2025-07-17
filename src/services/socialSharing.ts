// Social sharing service for SuperInu River game

interface ShareData {
  score: number;
  tokensCollected: number;
  level: number;
  rank?: number;
}

// Interface for future cast implementation
// interface CastData {
//   text: string;
//   embeds?: Array<{
//     url: string;
//   }>;
// }

class SocialSharingService {
  private gameUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Create share text for social media
  createShareText(data: ShareData): string {
    const { score, tokensCollected, level, rank } = data;
    
    let shareText = `🌊 Just played SuperInu River! 🐕\n\n`;
    shareText += `🏆 Score: ${score.toLocaleString()}\n`;
    shareText += `🪙 Tokens: ${tokensCollected}\n`;
    shareText += `⭐ Level: ${level}\n`;
    
    if (rank) {
      if (rank === 1) {
        shareText += `👑 Rank: #${rank} - NEW HIGH SCORE! 🥇\n\n`;
      } else if (rank <= 3) {
        shareText += `🏅 Rank: #${rank} - Top 3! 🎯\n\n`;
      } else if (rank <= 10) {
        shareText += `🎯 Rank: #${rank} - Top 10! ⚡\n\n`;
      } else {
        shareText += `📊 Rank: #${rank}\n\n`;
      }
    }
    
    shareText += `Help SuperInu catch streaming SuperFluid tokens in the river!`;
    
    return shareText;
  }

  // Create Farcaster cast
  async createFarcasterCast(data: ShareData): Promise<string> {
    try {
      const text = this.createShareText(data);
      
      // For now, create a Warpcast intent URL
      // In a full implementation, you'd use the Farcaster SDK to create the cast
      const intentUrl = this.createWarpcastIntent(text);
      
      console.log('🚀 Created Farcaster cast intent:', intentUrl);
      return intentUrl;
      
    } catch (error) {
      console.error('❌ Failed to create Farcaster cast:', error);
      throw error;
    }
  }

  // Create Warpcast intent URL
  private createWarpcastIntent(text: string): string {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(this.gameUrl);
    
    return `https://warpcast.com/~/compose?text=${encodedText}&embeds[]=${encodedUrl}`;
  }

  // Share via Web Share API (mobile)
  async shareNative(data: ShareData): Promise<boolean> {
    if (!navigator.share) {
      return false;
    }

    try {
      const shareText = this.createShareText(data);
      
      await navigator.share({
        title: 'SuperInu River - High Score!',
        text: shareText,
        url: this.gameUrl,
      });
      
      console.log('📱 Shared via native share API');
      return true;
    } catch (error) {
      console.error('❌ Native share failed:', error);
      return false;
    }
  }

  // Copy to clipboard
  async copyToClipboard(data: ShareData): Promise<boolean> {
    try {
      const shareText = this.createShareText(data);
      const fullText = `${shareText}\n\n🎮 Play now: ${this.gameUrl}`;
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullText);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = fullText;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      console.log('📋 Copied to clipboard');
      return true;
    } catch (error) {
      console.error('❌ Copy to clipboard failed:', error);
      return false;
    }
  }

  // Open share options
  async openShareOptions(data: ShareData): Promise<void> {
    // Try native share first (mobile)
    const nativeShared = await this.shareNative(data);
    
    if (!nativeShared) {
      // Fallback to copy to clipboard
      const copied = await this.copyToClipboard(data);
      
      if (copied) {
        // Show toast notification
        this.showToast('Score copied to clipboard! 📋');
      }
    }
  }

  // Create and show toast notification
  private showToast(message: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #06b6d4, #0891b2);
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 4px 20px rgba(34, 211, 238, 0.3);
      animation: slideDown 0.3s ease-out, slideUp 0.3s ease-in 2.7s;
    `;
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 3000);
  }

  // Generate achievement text based on score
  getAchievementText(data: ShareData): string | null {
    const { score, tokensCollected, rank } = data;
    
    if (rank === 1) {
      return "🏆 NEW HIGH SCORE! You're the top swimmer! 👑";
    }
    
    if (rank && rank <= 3) {
      return "🥉 Top 3! You're swimming with the best! 🏊‍♂️";
    }
    
    if (score >= 10000) {
      return "🎯 Score Master! Over 10,000 points! ⚡";
    }
    
    if (tokensCollected >= 50) {
      return "🪙 Token Collector! Caught 50+ tokens! 💰";
    }
    
    if (score >= 5000) {
      return "🌊 River Expert! Keep swimming! 🐕";
    }
    
    if (tokensCollected >= 20) {
      return "🎮 Getting Good! Nice token collecting! 🎯";
    }
    
    return null;
  }
}

export const socialSharingService = new SocialSharingService();