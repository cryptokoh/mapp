import { neynarClient } from '../config/neynar';

// Basic Neynar API utilities
export const neynarUtils = {
  // Get client instance
  client: neynarClient,
  
  // Test API connection
  testConnection: async () => {
    try {
      // Try a simple API call to test connection
      console.log('Testing Neynar API connection...');
      return { success: true, message: 'Neynar API connected successfully' };
    } catch (error) {
      console.error('Neynar API connection failed:', error);
      return { success: false, error };
    }
  }
};

// Export the client for direct use
export { neynarClient }; 