// Neynar API configuration for browser environment
const NEYNAR_API_KEY = import.meta.env.VITE_NEYNAR_API_KEY || '';
const NEYNAR_CLIENT_ID = import.meta.env.VITE_NEYNAR_CLIENT_ID || '';

// Export configuration for use in other parts of the app
export const neynarConfig = {
  apiKey: NEYNAR_API_KEY,
  clientId: NEYNAR_CLIENT_ID,
  isConfigured: !!NEYNAR_API_KEY,
};

// Simple test function that can be called from browser console
export const quickNeynarTest = async () => {
  console.log('🧪 Quick Neynar Test Starting...');
  console.log('🔑 API Key present:', !!NEYNAR_API_KEY);
  console.log('🆔 Client ID present:', !!NEYNAR_CLIENT_ID);
  
  if (!NEYNAR_API_KEY) {
    console.error('❌ No API key found!');
    return false;
  }
  
  try {
    const response = await fetch('https://api.neynar.com/v2/farcaster/user/bulk?fids=3', {
      headers: {
        'api_key': NEYNAR_API_KEY,
        'accept': 'application/json',
      },
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Test successful! User:', data.users?.[0]?.username);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Test failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('💥 Test error:', error);
    return false;
  }
};

// Enhanced test function with detailed status reporting
export const testNeynarConnection = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    // Check if API key is configured
    if (!NEYNAR_API_KEY) {
      return {
        success: false,
        message: 'Neynar API key not configured. Please add VITE_NEYNAR_API_KEY to your .env file.',
        details: {
          hasApiKey: false,
          hasClientId: !!NEYNAR_CLIENT_ID,
        }
      };
    }

    // Log configuration status (safely)
    console.log('🔗 Testing Neynar connection...');
    console.log('📋 API Key configured:', NEYNAR_API_KEY ? 'Yes' : 'No');
    console.log('📋 Client ID configured:', NEYNAR_CLIENT_ID ? 'Yes' : 'No');
    
    // Test API call using the correct endpoint (user/bulk is confirmed working)
    const testUrl = 'https://api.neynar.com/v2/farcaster/user/bulk?fids=3';
    console.log('🌐 Testing endpoint:', testUrl);
    
    const response = await fetch(testUrl, {
      headers: {
        'api_key': NEYNAR_API_KEY,
        'accept': 'application/json',
      },
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Neynar API test successful');
      console.log('📊 User data:', data.users?.[0]?.username || 'No user data');
      return {
        success: true,
        message: `Successfully connected to Neynar API. Tested with user: ${data.users?.[0]?.username || 'Unknown'}`,
        details: {
          status: response.status,
          hasApiKey: true,
          hasClientId: !!NEYNAR_CLIENT_ID,
          testUser: data.users?.[0]?.username,
          testData: data,
        }
      };
    } else {
      const errorText = await response.text();
      console.log('❌ Neynar API test failed:', response.status, errorText);
      return {
        success: false,
        message: `API request failed with status ${response.status}`,
        details: {
          status: response.status,
          error: errorText,
          hasApiKey: true,
          hasClientId: !!NEYNAR_CLIENT_ID,
        }
      };
    }
  } catch (error) {
    console.error('💥 Error testing Neynar connection:', error);
    return {
      success: false,
      message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        error: error,
        hasApiKey: !!NEYNAR_API_KEY,
        hasClientId: !!NEYNAR_CLIENT_ID,
      }
    };
  }
};

// Enhanced API call function with better error handling
export const neynarApiCall = async (endpoint: string, options: RequestInit = {}) => {
  if (!NEYNAR_API_KEY) {
    throw new Error('Neynar API key not configured. Please add VITE_NEYNAR_API_KEY to your .env file.');
  }

  try {
    const url = `https://api.neynar.com/v2/farcaster/${endpoint}`;
    console.log('🌐 Making Neynar API call to:', url);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'api_key': NEYNAR_API_KEY,
        'accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Neynar API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ API call successful');
    return data;
  } catch (error) {
    console.error('💥 Neynar API call error:', error);
    throw error;
  }
};

// Helper function to get user info (confirmed working endpoint)
export const getUserInfo = async (fid: number) => {
  return neynarApiCall(`user/bulk?fids=${fid}`);
};

// Helper function to get multiple users info
export const getUsersInfo = async (fids: number[]) => {
  const fidsParam = fids.join(',');
  return neynarApiCall(`user/bulk?fids=${fidsParam}`);
};

// Helper function to get user followers (if available)
export const getUserFollowers = async (fid: number, limit: number = 10) => {
  return neynarApiCall(`user/followers?fid=${fid}&limit=${limit}`);
};

// Helper function to get user following (if available)
export const getUserFollowing = async (fid: number, limit: number = 10) => {
  return neynarApiCall(`user/following?fid=${fid}&limit=${limit}`);
};

// Helper function to get frame info (if available)
export const getFrameInfo = async (frameUrl: string) => {
  return neynarApiCall(`frame/validate?frame_url=${encodeURIComponent(frameUrl)}`);
};

// Configuration status checker
export const getNeynarStatus = () => {
  return {
    isConfigured: !!NEYNAR_API_KEY,
    hasApiKey: !!NEYNAR_API_KEY,
    hasClientId: !!NEYNAR_CLIENT_ID,
    apiKeyPreview: NEYNAR_API_KEY ? `${NEYNAR_API_KEY.substring(0, 8)}...` : 'Not set',
    clientIdPreview: NEYNAR_CLIENT_ID ? `${NEYNAR_CLIENT_ID.substring(0, 8)}...` : 'Not set',
  };
}; 