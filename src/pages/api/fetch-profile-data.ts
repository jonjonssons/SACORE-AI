import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '', // Replace with your environment variable
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { profileData, title, snippet } = req.body;

    if (!profileData) {
      return res.status(400).json({ error: 'Profile data is required' });
    }

    console.log('Processing profile data extraction with OpenAI');
    console.log('Input data:', { profileData: profileData.substring(0, 100) + '...', title, snippet });

    // More detailed prompt for OpenAI to extract accurate company information
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `
          You are a LinkedIn profile analyzer specialized in extracting accurate company names. 
          
          Given a LinkedIn profile snippet or title, extract the following information:
          1. The person's name
          2. Their current or most recent job title
          3. The exact company name they work for (or worked for most recently)
          
          IMPORTANT RULES FOR COMPANY EXTRACTION:
          - Do NOT output generic terms like "Experience", "Location", "Technical", "Regional", "end", etc. as companies
          - Do NOT output Norwegian terms like "Erfaring", "Sted", "Det", "Don", etc. as companies
          - Do NOT output locations or cities as companies (e.g., Oslo, Stockholm, Sweden)
          - Do NOT output academic institutions or schools as companies
          - Do NOT output job titles as companies
          - Do NOT output industry terms like "Cybersecurity" or "Finance" as companies
          - Do NOT output phrases containing "responsibility for", "management of", "compliance with"
          - Do NOT output phrases longer than 3-4 words
          - Only extract ACTUAL company names like "Microsoft", "ABB", "Telenor"
          - If you cannot identify a clear company name, return an empty string for the company field
          
          EXAMPLES OF GOOD EXTRACTIONS:
          - "John Smith - Software Engineer at Microsoft" -> company = "Microsoft"
          - "Jane Doe · Technical Sales Manager · Ericsson" -> company = "Ericsson"
          
          EXAMPLES OF BAD EXTRACTIONS (DO NOT DO THESE):
          - "John Smith - Software Engineer in Stockholm" -> company should be EMPTY, not "Stockholm"
          - "Jane Doe · Experience · Regional" -> company should be EMPTY, not "Experience" or "Regional"
          - "Sarah Johnson · Erfaring" -> company should be EMPTY, not "Erfaring"
          - "Thomas Nielsen · Sted" -> company should be EMPTY, not "Sted"
          - "Product Manager Test Instruments and Fusion Splicers" -> company should be EMPTY (too long phrase)
          
          Respond with a JSON object containing name, title, and company fields.
          `
        },
        {
          role: 'user',
          content: profileData
        }
      ],
      temperature: 0.1, // Use a low temperature for more deterministic results
    });

    const extractedContent = response.choices[0].message.content;
    console.log('OpenAI response:', extractedContent);

    // Parse the response JSON
    let extractedData;
    try {
      extractedData = JSON.parse(extractedContent || '{}');
    } catch (e) {
      console.error('Error parsing OpenAI response:', e);
      // Fallback to regex extraction for name and company if JSON parsing fails
      const nameMatch = extractedContent?.match(/name"?\s*:\s*"([^"]+)"/i);
      const titleMatch = extractedContent?.match(/title"?\s*:\s*"([^"]+)"/i);
      const companyMatch = extractedContent?.match(/company"?\s*:\s*"([^"]+)"/i);
      
      extractedData = {
        name: nameMatch?.[1] || '',
        title: titleMatch?.[1] || '',
        company: companyMatch?.[1] || ''
      };
    }

    // Expanded list of invalid company terms
    const invalidCompanyTerms = [
      // Norwegian terms
      'erfaring', 'erfarenhet', 'sted', 'plats', 'det', 'don', 'de', 'jobb',

      // Generic terms
      'experience', 'location', 'position', 'profile', 'end', 'start', 'free',
      'technical', 'technology', 'regional', 'utdanning', 'formation', 'over',
      'not available', 'unknown', 'linkedin', 'page', 'website', 'using',
      'background', 'professional', 'summary', 'conclusion', 'information',
      'profile', 'introduction', 'head', 'bottom', 'top', 'n/a', 'none', 'null',
      'undefined', 'you', 'my', 'they', 'we', 'us', 'me', 'their', 'opps',
      'projects', 'years', 'months', 'år', 'månader', 'sedan', 'ago',

      // Industry terms
      'cybersecurity', 'security', 'sales', 'education', 'software', 'tech',
      'it', 'fintech', 'healthcare', 'consulting', 'marketing', 'showtagtv',
      'foodtech', 'digital', 'television', 'sjømat', 'wheelme', 'nutrition',
      'solution', 'data', 'automotive', 'retail', 'finans', 'finance', 'bank',
      'banking', 'transport', 'logistics', 'gdpr', 'e-commerce', 'ecommerce',
      'e-handel', 'försäljning', 'media', 'social media', 'ai', 'ml', 'ux', 'ui',
      'cloud', 'b2b', 'b2c', 'platform', 'internet', 'web', 'telecom', 'telekom',
      'gaming', 'pharma', 'blockchain', 'safety', 'suppling', 'proffselger',
      'ilmoita', 'national', 'interim', 'cleantech', 'renewable'
    ];

    // Check if extracted company is invalid
    if (extractedData.company) {
      const companyLower = extractedData.company.toLowerCase();
      
      // Check against invalid terms
      const isInvalidCompany = 
        // Length check
        extractedData.company.length < 2 ||
        
        // Exact match with invalid terms
        invalidCompanyTerms.includes(companyLower) ||
        
        // Starts with invalid term
        invalidCompanyTerms.some(term => companyLower.startsWith(term + ' ')) ||
        
        // Ends with invalid term
        invalidCompanyTerms.some(term => companyLower.endsWith(' ' + term)) ||
        
        // Contains invalid term
        invalidCompanyTerms.some(term => companyLower.includes(' ' + term + ' ')) ||
        
        // Too long (likely a phrase, not a company)
        companyLower.split(/\s+/).length > 4 ||
        
        // Contains descriptive phrases
        /\b(responsibility|responsible|ansvar|for|compliance|with|easy|efficient|management|driving|supporting|developing)\b/i.test(companyLower) ||
        
        // Looks like job title with seniority
        /\b(sr|senior|jr|junior)\s+\w+\s+(manager|engineer|director|specialist|consultant|executive)\b/i.test(companyLower) ||
        
        // Is just an industry acronym
        /^(saas|gdpr|it|b2b|b2c|ai|ml|iot|ux|ui)$/i.test(companyLower);
      
      if (isInvalidCompany) {
        console.log(`Invalid company detected: "${extractedData.company}". Setting to empty string.`);
        extractedData.company = '';
      }
    }

    return res.status(200).json(extractedData);
  } catch (error) {
    console.error('Error processing profile data:', error);
    return res.status(500).json({ error: 'Failed to process profile data' });
  }
} 