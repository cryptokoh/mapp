// Quick Auth token verification utility
export const verifyQuickAuthToken = async (token: string) => {
  try {
    // In a real app, you would verify the JWT token on your backend
    // For now, we'll just decode it to get the user info
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    return {
      success: true,
      user: {
        fid: payload.sub,
        issuedAt: payload.iat,
        expiresAt: payload.exp,
        issuer: payload.iss
      }
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return {
      success: false,
      error: 'Invalid token'
    };
  }
};

// Fetch user data using the Quick Auth token
export const fetchUserData = async (token: string) => {
  try {
    // In a real app, you would make an authenticated request to your backend
    // For now, we'll simulate a successful response
    const verification = await verifyQuickAuthToken(token);
    
    if (verification.success && verification.user) {
      return {
        success: true,
        user: {
          ...verification.user,
          username: 'user_' + verification.user.fid,
          displayName: 'Farcaster User',
          pfpUrl: 'https://fcmapp.netlify.app/stremeinu.png'
        }
      };
    } else {
      return verification;
    }
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    return {
      success: false,
      error: 'Failed to fetch user data'
    };
  }
}; 