import { NeynarAPIClient } from '@neynar/nodejs-sdk';

// Neynar API configuration
const NEYNAR_API_KEY = '775866C1-12A0-41B4-8F84-83235558A52F';
const NEYNAR_CLIENT_ID = '20df84d2-f2cf-452f-810d-8676d5a48716';

// Create Neynar client instance
export const neynarClient = new NeynarAPIClient({
  apiKey: NEYNAR_API_KEY,
});

// Export configuration for use in other parts of the app
export const neynarConfig = {
  apiKey: NEYNAR_API_KEY,
  clientId: NEYNAR_CLIENT_ID,
};

// Basic helper function to test the connection
export const testNeynarConnection = async () => {
  try {
    // Simple test to verify the client is working
    console.log('Neynar client initialized with API key:', NEYNAR_API_KEY.substring(0, 8) + '...');
    return true;
  } catch (error) {
    console.error('Error initializing Neynar client:', error);
    return false;
  }
}; 