// Neynar API configuration for browser environment
const NEYNAR_API_KEY = import.meta.env.VITE_NEYNAR_API_KEY || '';
const NEYNAR_CLIENT_ID = import.meta.env.VITE_NEYNAR_CLIENT_ID || '';

// Export configuration for use in other parts of the app
export const neynarConfig = {
  apiKey: NEYNAR_API_KEY,
  clientId: NEYNAR_CLIENT_ID,
};

// Basic helper function to test the connection
export const testNeynarConnection = async () => {
  try {
    // Check if API key is configured
    if (!NEYNAR_API_KEY) {
      console.log('Neynar API key not configured');
      return false;
    }

    // Simple test to verify the configuration is working
    console.log('Neynar config loaded with API key:', NEYNAR_API_KEY.substring(0, 8) + '...');
    console.log('Neynar client ID:', NEYNAR_CLIENT_ID);
    
    // Test API call using fetch instead of SDK to avoid browser conflicts
    const response = await fetch('https://api.neynar.com/v2/farcaster/user/info?fid=3', {
      headers: {
        'api_key': NEYNAR_API_KEY,
        'accept': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('Neynar API test successful');
      return true;
    } else {
      console.log('Neynar API test failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Error testing Neynar connection:', error);
    return false;
  }
};

// Helper function to make Neynar API calls
export const neynarApiCall = async (endpoint: string, options: RequestInit = {}) => {
  if (!NEYNAR_API_KEY) {
    throw new Error('Neynar API key not configured');
  }

  try {
    const response = await fetch(`https://api.neynar.com/v2/farcaster/${endpoint}`, {
      ...options,
      headers: {
        'api_key': NEYNAR_API_KEY,
        'accept': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Neynar API call error:', error);
    throw error;
  }
}; 