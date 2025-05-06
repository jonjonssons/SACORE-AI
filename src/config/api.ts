import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

/**
 * SignalHire API Configuration
 */
export const SIGNALHIRE_API_KEY = process.env.SIGNALHIRE_API_KEY || '202.evxjhWwFUZyG5qr8gJlEN1BQ5PIe';
export const SIGNALHIRE_API_URL = process.env.SIGNALHIRE_API_URL || 'https://www.signalhire.com/api';
export const LOCAL_SERVER_URL = process.env.LOCAL_SERVER_URL || 'http://localhost:3333';
export const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:3333/api/signalhire-callback'; 