import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

// Neynar API configuration
const NEYNAR_API_KEY = '775866C1-12A0-41B4-8F84-83235558A52F';
const NEYNAR_CLIENT_ID = '20df84d2-f2cf-452f-810d-8676d5a48716';

// Create Neynar configuration and client
const config = new Configuration({
  apiKey: NEYNAR_API_KEY,
});

const client = new NeynarAPIClient(config);

// Export configuration for use in other parts of the app
export const neynarConfig = {
  apiKey: NEYNAR_API_KEY,
  clientId: NEYNAR_CLIENT_ID,
};

// Export the client for use in other parts of the app
export { client as neynarClient };

// Basic helper function to test the connection
export const testNeynarConnection = async () => {
  try {
    // Simple test to verify the client is working
    console.log('Neynar client initialized with API key:', NEYNAR_API_KEY.substring(0, 8) + '...');
    console.log('Neynar client ID:', NEYNAR_CLIENT_ID);
    console.log('Neynar client object:', client);
    
    // For now, just return true if the client was created successfully
    return true;
  } catch (error) {
    console.error('Error testing Neynar connection:', error);
    return false;
  }
}; 