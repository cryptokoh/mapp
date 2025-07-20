import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/frame-sdk';

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio: string;
  followerCount?: number;
  followingCount?: number;
}

interface FarcasterContext {
  user: FarcasterUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export function useFarcaster(): FarcasterContext {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        console.log('🔗 Initializing Farcaster SDK...');
        
        // Get the context from the Farcaster Frame SDK
        const context = await sdk.context;
        
        if (context && context.user) {
          console.log('🔗 Farcaster user found:', context.user);
          
          const farcasterUser: FarcasterUser = {
            fid: context.user.fid,
            username: context.user.username || `user-${context.user.fid}`,
            displayName: context.user.displayName || context.user.username || `User ${context.user.fid}`,
            pfpUrl: context.user.pfpUrl || '',
            bio: (context.user as any).bio || '',
            followerCount: (context.user as any).followerCount,
            followingCount: (context.user as any).followingCount,
          };
          
          setUser(farcasterUser);
          setIsAuthenticated(true);
          console.log('🔗 Farcaster user authenticated:', farcasterUser.username);

          // Automatically add miniapp to Farcaster
          try {
            console.log('📱 Automatically adding miniapp to Farcaster...');
            await sdk.actions.addMiniApp();
            console.log('📱 Miniapp added successfully on initialization!');
          } catch (addError: any) {
            console.log('📱 Miniapp addition on init:', addError.code === 'RejectedByUser' ? 'User declined' : `Error: ${addError.message}`);
            // Don't throw error - this is optional functionality
          }
        } else {
          console.log('🔗 No Farcaster user context available - deployment mode');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('🔗 Error initializing Farcaster:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Farcaster');
        
        // No fallback user for deployment
        setUser(null);
        setIsAuthenticated(false);
        console.log('🔗 No user available - deployment mode');
      } finally {
        setIsLoading(false);
      }
    };

    initializeFarcaster();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
  };
}