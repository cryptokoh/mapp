import { NeynarAPIClient } from '@neynar/nodejs-sdk';

export const NEYNAR_CONFIG = {
  API_KEY: '775866C1-12A0-41B4-8F84-83235558A52F',
  CLIENT_ID: '20df84d2-f2cf-452f-810d-8676d5a48716',
  BASE_URL: 'https://api.neynar.com'
};

export const neynarClient = new NeynarAPIClient({ apiKey: NEYNAR_CONFIG.API_KEY }); 