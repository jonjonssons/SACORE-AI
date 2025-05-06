
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log("🔥 Proxy Function LIVE on Supabase at", new Date().toISOString());

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS preflight request");
    console.log("Returning CORS headers:", corsHeaders);
    return new Response('ok', { 
      status: 200,  
      headers: corsHeaders 
    });
  }

  try {
    console.log("Processing proxy request:", req.url);
    
    const { url, method, headers, body } = await req.json();
    console.log(`Proxying request to: ${url}, Method: ${method}`);

    // Remove any existing CORS headers from the forwarded request
    const forwardHeaders = new Headers(headers);
    Object.keys(corsHeaders).forEach((key) => forwardHeaders.delete(key));

    const response = await fetch(url, {
      method,
      headers: forwardHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Get response data - first try as JSON, fallback to text
    let responseData;
    const contentType = response.headers.get('Content-Type');
    
    try {
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        try {
          // Try to parse as JSON anyway, in case Content-Type is wrong
          responseData = JSON.parse(text);
        } catch (e) {
          // If parsing fails, use the text
          responseData = { text };
        }
      }
    } catch (error) {
      console.error('Error parsing response:', error);
      responseData = { error: 'Failed to parse response' };
    }

    console.log(`Proxy response status: ${response.status}`);
    
    return new Response(
      JSON.stringify(responseData),
      {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Proxy server error', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
