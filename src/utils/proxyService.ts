const PROXY_URL = "https://ucofzcubtdgwcekdogxr.functions.supabase.co/proxy";

export const proxyRequest = async (originalUrl: string, method: string = 'GET', data?: any) => {
  try {
    console.log(`Sending proxy request to: ${originalUrl} via ${PROXY_URL}`);
    console.log('Request data:', { method, data });
    
    // First perform an OPTIONS request to ensure CORS is properly set up
    try {
      const preflightResponse = await fetch(PROXY_URL, {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Preflight check for proxy:", {
        status: preflightResponse.status,
        ok: preflightResponse.ok,
        headers: Object.fromEntries(preflightResponse.headers.entries())
      });
      
    } catch (preflightError) {
      console.warn("Preflight check for proxy failed:", preflightError);
      // Continue anyway, as the browser will handle the actual preflight
    }
    
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: originalUrl,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: data
      }),
      // Increase timeout for longer GPT processing
      signal: AbortSignal.timeout(45000) // 45-second timeout
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Proxy request failed with status ${response.status}:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    // Log the raw response text
    const responseText = await response.text();
    console.log('Raw proxy response:', responseText.substring(0, 500) + (responseText.length > 500 ? "..." : ""));
    
    // Parse the response text
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing proxy response:', parseError);
      throw new Error(`Failed to parse proxy response: ${parseError.message}`);
    }
    
    console.log('Parsed proxy response:', responseData);
    return responseData;
  } catch (error) {
    console.error('Proxy request failed:', error);
    throw error;
  }
};
