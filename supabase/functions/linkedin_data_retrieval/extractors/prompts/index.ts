
/**
 * Central export point for all AI extraction prompts
 */

// Export profile extraction prompts
export { 
  PROFILE_EXTRACTION_PROMPT,
  TITLE_EXTRACTION_PROMPT 
} from './profileExtractionPrompts.ts';

// Export company extraction and correction prompts
export { 
  COMPANY_PREDICTION_PROMPT,
  COMPANY_FALLBACK_PROMPT,
  COMPANY_CORRECTION_PROMPT 
} from './companyExtractionPrompts.ts';

// Export search query related prompts
export { 
  SEARCH_QUERY_PROMPT,
  SEARCH_RESULTS_COMPANY_PROMPT 
} from './searchQueryPrompts.ts';
