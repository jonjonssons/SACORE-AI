
/**
 * Profile data types for LinkedIn profiles
 */

export interface ProfileData {
  name: string;
  title: string;
  company: string;
  url: string;
  rawData?: any;
  score?: number; // Optional score property
  location?: string; // Optional location property
} 
