// Neynar API configuration for browser environment
const NEYNAR_API_KEY = import.meta.env.VITE_NEYNAR_API_KEY || '';
const NEYNAR_CLIENT_ID = import.meta.env.VITE_NEYNAR_CLIENT_ID || '';

// Export configuration for use in other parts of the app
export const neynarConfig = {
  apiKey: NEYNAR_API_KEY,
  clientId: NEYNAR_CLIENT_ID,
  isConfigured: !!NEYNAR_API_KEY,
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
    
    // Test API call using fetch instead of SDK to avoid browser conflicts
    const testUrl = 'https://api.neynar.com/v2/farcaster/user/info?fid=3';
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
      return {
        success: true,
        message: 'Successfully connected to Neynar API',
        details: {
          status: response.status,
          hasApiKey: true,
          hasClientId: !!NEYNAR_CLIENT_ID,
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

// Helper function to get user info
export const getUserInfo = async (fid: number) => {
  return neynarApiCall(`user/info?fid=${fid}`);
};

// Helper function to get user casts
export const getUserCasts = async (fid: number, limit: number = 10) => {
  return neynarApiCall(`casts?fid=${fid}&limit=${limit}`);
};

// Helper function to get trending casts
export const getTrendingCasts = async (limit: number = 10) => {
  return neynarApiCall(`casts/trending?limit=${limit}`);
};

// Helper function to get frame info
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