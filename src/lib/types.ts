
export interface MatchCriteria {
  name: string;
  match: boolean;
  score: number; // Score from 0-1 for each criteria
  isAiSuggested?: boolean; // Added this property as optional
}

export interface CandidateScore {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  profileImage?: string;
  score: number; // Overall score
  matchCriteria: MatchCriteria[];
  snippet?: string; // Added snippet property
}

export interface SearchResults {
  query: string;
  timestamp: string;
  total: number;
  results: CandidateScore[];
}

export interface ScoringResponse {
  relevanceScore: number;
  engagementPotential: number;
  conversionLikelihood: number;
  overallScore: number;
  explanation?: string;
  followUpQuestions?: string[];
  criteria?: MatchCriteria[];
}

export interface LinkedInAnalysisResponse {
  matches: MatchCriteria[];
  score: number;
  profileId?: string;
  profileUrl?: string;
  name?: string;
  title?: string;
  company?: string;
  location?: string;
  snippet?: string; // Added snippet property
}

// Enhanced types for LinkedIn search
export interface LinkedInSearchResult {
  searchUrl: string;
  criteria: string;
  timestamp: string;
  profiles: LinkedInAnalysisResponse[];
}

// Define LeadResult as alias to CandidateScore for backward compatibility
export type LeadResult = CandidateScore;

// New interface for LinkedIn profile search results
export interface LinkedInProfileSearchResult {
  id: string;
  name: string;
  title?: string;
  company?: string;
  snippet?: string;
  skills?: string[];
  highlight?: string;
}
