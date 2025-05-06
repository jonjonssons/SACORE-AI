import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("LinkedIn data retrieval function called");
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData));
    
    const { title, snippet } = requestData;

    if (!title && !snippet) {
      console.log("No title or snippet provided");
      return new Response(JSON.stringify({ 
        name: "",
        company: "",
        error: "No title or snippet provided" 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error("OPENAI_API_KEY is not set in environment variables");
      return new Response(JSON.stringify({ 
        name: "",
        company: "",
        error: "API key not configured" 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    console.log("Calling OpenAI API to extract profile data");
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Extract LinkedIn profile information from the provided data.

Instructions:
1. Return a JSON object with these fields:
   - name: The person's full name (first and last)
   - company: The company they currently work at

2. For the name:
   - Return ONLY the first name and last name in "First Last" format
   - If you cannot identify a name, return an empty string

3. For the company:
   - Return ONLY the company name, without any descriptors or locations
   - Ignore universities, schools, and locations UNLESS they are clearly the employer
   - If you can't determine the company with confidence, return an empty string
   - Prioritize current employment (ignore "former" positions)
   - For company names, include the full official name without abbreviations when possible
   - Be careful not to confuse locations (like Stockholm, London, etc.) with company names

4. Do NOT include titles, positions, or other information
5. Return valid JSON only - no additional text or explanations

Examples:
Input: "John Smith - Software Engineer at Google | LinkedIn"
Output: {"name": "John Smith", "company": "Google"}

Input: "Sarah Johnson | CEO & Founder at Acme Inc 🚀 | LinkedIn"
Output: {"name": "Sarah Johnson", "company": "Acme Inc"}

Input: "Tech Lead at Microsoft - LinkedIn Profile"
Output: {"name": "", "company": "Microsoft"}

Input: "Maria Garcia - Marketing Director - Stockholm, Sweden"
Output: {"name": "Maria Garcia", "company": ""}

Input: "Alex Wong - Data Scientist at Stockholm University"
Output: {"name": "Alex Wong", "company": "Stockholm University"}

Input: "LinkedIn | Erik Andersson - Senior Developer working in Gothenburg"
Output: {"name": "Erik Andersson", "company": ""}

Input: "Remote Senior Developer at Spotify | Peter Johansson"
Output: {"name": "Peter Johansson", "company": "Spotify"}

Return valid JSON only. No additional text.`
          },
          {
            role: 'user',
            content: `Title: ${title || ''}
Snippet: ${snippet || ''}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error(`OpenAI API error: ${openAIResponse.status}`, errorText);
      return new Response(JSON.stringify({ 
        name: "",
        company: "",
        error: `OpenAI API error: ${openAIResponse.status}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    const data = await openAIResponse.json();
    console.log("OpenAI API response:", JSON.stringify(data));
    
    try {
      const content = data.choices?.[0]?.message?.content || "{}";
      const extractedData = JSON.parse(content);
      
      console.log("Parsed extraction data:", extractedData);
      
      const extractedName = extractedData.name || "";
      const extractedCompany = extractedData.company || "";
      
    console.log("Extracted name:", extractedName);
      console.log("Extracted company:", extractedCompany);
    
      // Validate name
    const isValidName = extractedName && 
      extractedName.split(' ').length >= 2 && 
      !/[0-9!@#$%^&*(),.?":{}|<>]/.test(extractedName);
    
      // Validate company - check if it's not just a location
      const commonLocations = ["stockholm", "gothenburg", "göteborg", "malmö", "sweden", "sverige", 
        "remote", "distans", "london", "copenhagen", "oslo", "helsinki"];
      const companyLower = extractedCompany.toLowerCase();
      const isCommonLocation = commonLocations.some(loc => companyLower === loc);
      const validatedCompany = isCommonLocation ? "" : extractedCompany;
      
    return new Response(JSON.stringify({ 
      name: isValidName ? extractedName : "",
        company: validatedCompany
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
      return new Response(JSON.stringify({ 
        name: "",
        company: "",
        error: "Failed to parse OpenAI response" 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        name: "",
        company: "",
        error: error.message || "Unknown error" 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

