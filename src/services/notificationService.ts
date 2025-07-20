export interface NotificationService {
  requestPermission: () => Promise<boolean>;
  checkPermission: () => NotificationPermission;
  showNotification: (title: string, options?: NotificationOptions) => Promise<void>;
  isSupported: () => boolean;
}

class NotificationServiceImpl implements NotificationService {
  private permissionKey = 'streme-notification-permission';
  private askedKey = 'streme-notification-asked';

  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  checkPermission(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  hasAskedBefore(): boolean {
    return localStorage.getItem(this.askedKey) === 'true';
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.log('❌ Notifications not supported on this device');
      return false;
    }

    // Mark that we've asked
    localStorage.setItem(this.askedKey, 'true');

    if (Notification.permission === 'granted') {
      localStorage.setItem(this.permissionKey, 'granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      localStorage.setItem(this.permissionKey, 'denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      localStorage.setItem(this.permissionKey, permission);
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted!');
        // Show a welcome notification
        await this.showNotification('Welcome to SuperInu River! 🌊', {
          body: "You'll get notified about special token events and leaderboard updates!",
          icon: '/stremeinu.png',
          badge: '/stremeinu.png',
          tag: 'welcome',
          requireInteraction: false,
        });
        return true;
      } else {
        console.log('❌ Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return;
    }

    try {
      // In the future, this would use a service worker for background notifications
      // For now, we'll use the basic Notification API
      const notification = new Notification(title, {
        icon: '/stremeinu.png',
        badge: '/stremeinu.png',
        ...options,
      });

      // Auto close after 5 seconds unless specified otherwise
      if (!options?.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }
    } catch (error) {
      console.error('❌ Error showing notification:', error);
    }
  }

  // Example notification methods for game events
  async notifyHighScore(score: number): Promise<void> {
    await this.showNotification('New High Score! 🏆', {
      body: `Amazing! You scored ${score} points!`,
      tag: 'highscore',
    });
  }

  async notifyRareToken(tokenName: string): Promise<void> {
    await this.showNotification('Rare Token Alert! 💎', {
      body: `${tokenName} is appearing in the river now!`,
      tag: 'raretoken',
      requireInteraction: true,
    });
  }

  async notifyLeaderboardRank(rank: number): Promise<void> {
    await this.showNotification('Leaderboard Update! 📊', {
      body: `You're now ranked #${rank} on the leaderboard!`,
      tag: 'leaderboard',
    });
  }
}

export const notificationService = new NotificationServiceImpl();