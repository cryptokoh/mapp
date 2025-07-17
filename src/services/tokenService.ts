export interface StremeToken {
  id: number;
  name: string;
  symbol: string;
  img_url: string;
  username: string;
  contract_address: string;
  cast_hash: string;
  marketData: {
    price: number;
    priceChange24h: number;
    volume24h: number;
    marketCap: number;
    priceChange1h: number;
    priceChange5m: number;
  };
  pfp_url?: string;
  created_at: string;
  lastTraded: {
    _seconds: number;
    _nanoseconds: number;
  };
}

class TokenService {
  private cache: StremeToken[] = [];
  private lastFetch: number = 0;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes
  private apiUrl = 'https://api.streme.fun/api/tokens/trending';
  private fallbackImageUrl = 'https://api.streme.fun/images/streme-icon.png';

  // Get trending tokens with caching
  async getTrendingTokens(): Promise<StremeToken[]> {
    const now = Date.now();
    
    // Return cached data if it's still fresh
    if (this.cache.length > 0 && now - this.lastFetch < this.cacheDuration) {
      console.log('🪙 Using cached trending tokens:', this.cache.length);
      return this.cache;
    }

    try {
      console.log('🔥 Fetching fresh trending tokens from Streme.fun API...');
      const response = await fetch(this.apiUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const tokens: StremeToken[] = await response.json();
      
      // Validate and filter tokens
      const validTokens = tokens.filter(token => 
        token.name && 
        token.symbol && 
        token.marketData && 
        typeof token.marketData.marketCap === 'number'
      );

      if (validTokens.length === 0) {
        throw new Error('No valid tokens received from API');
      }

      // Sort by market cap and volume for better game tokens
      const sortedTokens = validTokens
        .sort((a, b) => {
          // Primary sort by market cap, secondary by volume
          const marketCapDiff = b.marketData.marketCap - a.marketData.marketCap;
          if (marketCapDiff !== 0) return marketCapDiff;
          return b.marketData.volume24h - a.marketData.volume24h;
        })
        .slice(0, 20); // Take top 20 for variety

      // Ensure image URLs are valid
      const tokensWithImages = sortedTokens.map(token => ({
        ...token,
        img_url: token.img_url || token.pfp_url || this.fallbackImageUrl,
      }));

      this.cache = tokensWithImages;
      this.lastFetch = now;
      
      console.log('🪙 Successfully fetched trending tokens:', tokensWithImages.length);
      return tokensWithImages;

    } catch (error) {
      console.warn('⚠️ Failed to fetch trending tokens, using fallback:', error);
      return this.getFallbackTokens();
    }
  }

  // Get random token from available tokens
  getRandomToken(availableTokens: StremeToken[]): StremeToken {
    if (availableTokens.length === 0) {
      return this.getFallbackTokens()[0];
    }
    
    // Weighted selection - higher market cap tokens are more likely
    const weights = availableTokens.map(token => {
      const marketCap = token.marketData.marketCap || 1;
      const volume = token.marketData.volume24h || 1;
      return Math.sqrt(marketCap) + Math.sqrt(volume); // Weight by sqrt for balanced distribution
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (let i = 0; i < availableTokens.length; i++) {
      currentWeight += weights[i];
      if (random <= currentWeight) {
        return availableTokens[i];
      }
    }
    
    // Fallback to random selection
    return availableTokens[Math.floor(Math.random() * availableTokens.length)];
  }

  // Get token value for scoring (based on market data)
  getTokenValue(token: StremeToken): number {
    const baseValue = 100; // Base points for any token
    const marketCapBonus = Math.min(token.marketData.marketCap / 10000, 50); // Max 50 bonus
    const volumeBonus = Math.min(token.marketData.volume24h / 1000, 25); // Max 25 bonus
    const priceChangeBonus = Math.max(0, token.marketData.priceChange24h) * 2; // Positive price change bonus
    
    return Math.floor(baseValue + marketCapBonus + volumeBonus + priceChangeBonus);
  }

  // Get fallback tokens if API fails
  private getFallbackTokens(): StremeToken[] {
    return [
      {
        id: 1,
        name: 'Streme',
        symbol: 'STREME',
        img_url: this.fallbackImageUrl,
        username: 'streme',
        contract_address: '0x3b3cd21242ba44e9865b066e5ef5d1cc1030cc58',
        cast_hash: '0x3f100319c64a53f49925c2662eca87b39865f1c8',
        marketData: {
          price: 0.00000025,
          priceChange24h: 5.2,
          volume24h: 1000,
          marketCap: 25000,
          priceChange1h: 1.5,
          priceChange5m: 0.2
        },
        created_at: new Date().toISOString(),
        lastTraded: {
          _seconds: Math.floor(Date.now() / 1000),
          _nanoseconds: 0
        }
      },
      {
        id: 2,
        name: 'SuperFluid',
        symbol: 'SUPER',
        img_url: this.fallbackImageUrl,
        username: 'superfluid',
        contract_address: '0x42bb40bF79730451B11f6De1CbA222F17b87Afd7',
        cast_hash: '0x2f100319c64a53f49925c2662eca87b39865f1c9',
        marketData: {
          price: 0.00000045,
          priceChange24h: 8.7,
          volume24h: 1500,
          marketCap: 45000,
          priceChange1h: 2.1,
          priceChange5m: 0.5
        },
        created_at: new Date().toISOString(),
        lastTraded: {
          _seconds: Math.floor(Date.now() / 1000),
          _nanoseconds: 0
        }
      },
      {
        id: 3,
        name: 'Base',
        symbol: 'BASE',
        img_url: this.fallbackImageUrl,
        username: 'base',
        contract_address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
        cast_hash: '0x3f100319c64a53f49925c2662eca87b39865f1ca',
        marketData: {
          price: 0.00000035,
          priceChange24h: 3.1,
          volume24h: 1200,
          marketCap: 35000,
          priceChange1h: 0.8,
          priceChange5m: 0.1
        },
        created_at: new Date().toISOString(),
        lastTraded: {
          _seconds: Math.floor(Date.now() / 1000),
          _nanoseconds: 0
        }
      },
      {
        id: 4,
        name: 'Farcaster',
        symbol: 'FARC',
        img_url: this.fallbackImageUrl,
        username: 'farcaster',
        contract_address: '0x91f4dC10Fbb41c7e4b8dfE5c70A30f45E3D20c7a',
        cast_hash: '0x4f100319c64a53f49925c2662eca87b39865f1cb',
        marketData: {
          price: 0.00000055,
          priceChange24h: 12.4,
          volume24h: 2000,
          marketCap: 55000,
          priceChange1h: 3.2,
          priceChange5m: 0.7
        },
        created_at: new Date().toISOString(),
        lastTraded: {
          _seconds: Math.floor(Date.now() / 1000),
          _nanoseconds: 0
        }
      },
      {
        id: 5,
        name: 'Degen',
        symbol: 'DEGEN',
        img_url: this.fallbackImageUrl,
        username: 'degen',
        contract_address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
        cast_hash: '0x5f100319c64a53f49925c2662eca87b39865f1cc',
        marketData: {
          price: 0.00000065,
          priceChange24h: 15.6,
          volume24h: 2500,
          marketCap: 65000,
          priceChange1h: 4.1,
          priceChange5m: 1.2
        },
        created_at: new Date().toISOString(),
        lastTraded: {
          _seconds: Math.floor(Date.now() / 1000),
          _nanoseconds: 0
        }
      }
    ];
  }

  // Clear cache (useful for development)
  clearCache(): void {
    this.cache = [];
    this.lastFetch = 0;
    console.log('🗑️ Token cache cleared');
  }

  // Get cache info
  getCacheInfo(): { count: number; age: number; fresh: boolean } {
    const age = Date.now() - this.lastFetch;
    return {
      count: this.cache.length,
      age,
      fresh: age < this.cacheDuration
    };
  }
}

export const tokenService = new TokenService();