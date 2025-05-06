export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

/**
 * Create a proper CORS preflight response
 */
export function createCorsResponse() {
  console.log("Creating CORS preflight response with headers:", corsHeaders);
  console.log("Returning status 204 (No Content) for OPTIONS request");
  return new Response(null, {
    headers: corsHeaders,
    status: 204  // No content is the standard response for OPTIONS preflight
  });
}

/**
 * Create a proper JSON response with CORS headers
 */
export function createJsonResponse(data: any, status = 200) {
  console.log(`Creating JSON response with status ${status}:`, 
    typeof data === 'object' ? JSON.stringify(data).substring(0, 200) + '...' : data);
  
  // Ensure data is a proper object before stringifying
  let jsonData: string;
  
  if (typeof data === 'string') {
    // Check if the string is already JSON
    try {
      JSON.parse(data);
      jsonData = data; // It's already valid JSON string
    } catch (e) {
      // Not valid JSON, stringify it
      jsonData = JSON.stringify({ message: data });
    }
  } else {
    // It's an object, stringify it
    jsonData = JSON.stringify(data);
  }
  
  // Log the full response headers and first part of the body for debugging
  console.log("Sending response with headers:", corsHeaders);
  console.log("Response body (first 200 chars):", jsonData.substring(0, 200) + "...");
  
  return new Response(jsonData, {
    headers: corsHeaders,
    status,
  });
}

/**
 * Create a proper error response with CORS headers
 */
export function createErrorResponse(message: string, status = 400) {
  console.error(`Error response (${status}): ${message}`);
  
  const errorBody = JSON.stringify({
    error: message,
    success: false,
    timestamp: new Date().toISOString()
  });
  
  // Log the error response details
  console.log(`Returning error response with status: ${status}`);
  console.log(`Error response body: ${errorBody}`);
  
  return new Response(errorBody, {
    headers: corsHeaders,
    status,
  });
}

/**
 * Create a debug response with request details
 */
export function createDebugResponse(req: Request) {
  const url = new URL(req.url);
  
  const debugInfo = {
    message: "Debug information",
    url: req.url,
    method: req.method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString()
  };
  
  return createJsonResponse({
    debug: true,
    ...debugInfo
  });
}

/**
 * Create a structured error response for OpenAI API errors
 */
export function createOpenAIErrorResponse(error: any) {
  let status = 500;
  let message = "Unknown OpenAI API error";
  
  // Capture the raw error for debugging
  console.error("Original OpenAI error object:", error);
  
  // Special handling for HTML responses which indicate API key issues
  if (error.message && (
      error.message.includes("HTML instead of JSON") || 
      error.message.includes("<!DOCTYPE") ||
      error.message.includes("<html")
  )) {
    message = "Received HTML from OpenAI API instead of JSON. This typically indicates an invalid API key or authentication error.";
    status = 401;
    
    console.error("HTML response detected in OpenAI error:", error.message.substring(0, 500) + "...");
    return createErrorResponse(message, status);
  }
  
  // Check for different types of OpenAI errors
  if (error.response) {
    // The API returned an error response
    status = error.response.status;
    
    if (status === 401) {
      message = "Invalid or expired OpenAI API key. Please check your credentials.";
    } else if (status === 429) {
      message = "OpenAI rate limit exceeded. Please try again later.";
    } else if (status === 400) {
      message = "Bad request to OpenAI API. Please check your inputs.";
    } else if (error.response.data && error.response.data.error) {
      message = `OpenAI API error: ${error.response.data.error.message || error.response.data.error}`;
    }
  } else if (error.message && error.message.includes("Unexpected token '<'")) {
    // HTML response instead of JSON (likely due to invalid API key)
    message = "Received HTML instead of JSON from OpenAI API. This typically indicates an invalid API key.";
    status = 401;
  } else if (error.message && error.message.includes("rate limit")) {
    message = "OpenAI rate limit exceeded. Please try again later.";
    status = 429;
  } else if (error.message && (error.message.includes("text/html") || error.message.includes("HTML instead of JSON"))) {
    message = "Received HTML response from OpenAI API. This usually means invalid API key or authentication error.";
    status = 401;
  } else if (error.message) {
    message = error.message;
  }
  
  console.error(`OpenAI API error (${status}): ${message}`);
  console.error("Error details:", error);
  
  return createErrorResponse(message, status);
}

/**
 * Sanitize the OpenAI API key for logging (only show first/last few chars)
 */
export function sanitizeApiKey(apiKey: string | null | undefined): string {
  if (!apiKey) return 'undefined or null';
  if (typeof apiKey !== 'string') return 'invalid type';
  if (apiKey.length < 8) return 'too short';
  
  return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
}

/**
 * Validate OpenAI API key format
 * OpenAI API keys typically start with 'sk-' and are about 51 characters long
 */
export function isValidOpenAIKey(key: string): boolean {
  // Basic validation to avoid obvious errors
  if (!key || typeof key !== 'string') {
    console.error("API key is missing or not a string");
    return false;
  }
  
  // Check if it starts with sk-
  if (!key.startsWith('sk-')) {
    console.error("API key does not start with 'sk-', which is required for OpenAI API keys");
    return false;
  }
  
  // Check if it's approximately the right length
  // OpenAI keys are usually around 51 characters
  if (key.length < 40 || key.length > 100) {
    console.error(`API key length (${key.length}) is outside typical range for OpenAI keys (expected 40-100)`);
    return false;
  }
  
  console.log("API key format validation passed");
  return true;
}

/**
 * Create a detailed debug response for API call failures
 */
export function createDetailedDebugResponse(req: Request, errorInfo: any = null) {
  const url = new URL(req.url);
  
  // Extract request headers (safely)
  const headers: Record<string, string> = {};
  try {
    for (const [key, value] of req.headers.entries()) {
      // Skip sensitive headers
      if (key.toLowerCase() !== 'authorization') {
        headers[key] = value;
      } else {
        headers[key] = 'REDACTED';
      }
    }
  } catch (e) {
    console.error("Failed to extract request headers:", e);
  }
  
  // Try to get request body (if possible)
  let bodyInfo = "Could not extract request body";
  try {
    if (req.bodyUsed) {
      bodyInfo = "Request body has already been consumed";
    } else {
      bodyInfo = "Request body is available but not read to avoid consuming it";
    }
  } catch (e) {
    console.error("Error checking request body:", e);
  }
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    request: {
      url: req.url,
      method: req.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      headers: headers,
      bodyState: bodyInfo
    },
    error: errorInfo ? {
      message: errorInfo.message || "Unknown error",
      name: errorInfo.name || "Error",
      stack: errorInfo.stack || "No stack trace available"
    } : null,
    environment: {
      openaiApiKeyPresent: Boolean(Deno.env.get('OPENAI_API_KEY')),
      openaiApiKeyFormat: sanitizeApiKey(Deno.env.get('OPENAI_API_KEY') || ""),
      denoVersion: Deno.version ? Deno.version.deno : "Unknown"
    }
  };
  
  return createJsonResponse({
    debug: true,
    ...debugInfo
  });
}
