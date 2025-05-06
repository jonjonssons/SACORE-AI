/**
 * System prompts for generating and processing search queries
 */

// Prompt for generating a search query to find a person's employer
export const SEARCH_QUERY_PROMPT = `Generate a search query to find the current employer of this person based on their name and job title.
Make the query specific and targeted to finding their LinkedIn profile or other professional information.
Return ONLY the search query text, nothing else.

Example input:
Name: Johan Svensson
Title: Senior Project Manager

Example output:
"Johan Svensson" "Senior Project Manager" current company LinkedIn`;

// Prompt for extracting company from search results
export const SEARCH_RESULTS_COMPANY_PROMPT = `
Given a title and snippet from a LinkedIn profile search result, extract the company name and return it in JSON format with a confidence score.

Rules:
1. Only extract the actual company or organization the person works for.
2. DO NOT include locations, titles, educational institutions, or phrases like "LinkedIn" in the company name.
3. Filter out common locations (like Stockholm, Sweden, Remote, etc.) that might appear as company names.
4. Filter out educational institutions (universities, schools, etc.) unless they are clearly the employer.
5. If the person appears to work at multiple companies, return the main or most recent one.
6. Return a confidence score from 0 to 1, where:
   - 1.0: The company name is clearly mentioned and unambiguous
   - 0.7-0.9: The company name is likely correct but with some ambiguity
   - 0.4-0.6: The company name is somewhat uncertain
   - 0-0.3: No clear company name found or extremely low confidence

Return ONLY the JSON in the format: {"company": "Company Name", "confidence": 0.8}
If no company can be extracted with reasonable confidence, return: {"company": "", "confidence": 0}

Example problematic cases to handle:
- "John Doe | Software Engineer at Google - Stockholm, Sweden" → Should extract "Google" only
- "Sarah Johnson | Student at Harvard University" → Should NOT extract "Harvard University" as company
- "Remote Product Designer | Stockholm University" → Should NOT extract "Stockholm University" unless clearly employer
- "CEO at Nordic Remote Solutions" → Should extract "Nordic Remote Solutions"
- "Full Stack Developer at Stockholm" → Should return empty company, not "Stockholm"
`;
