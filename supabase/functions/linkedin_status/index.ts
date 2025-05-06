
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let extensionInstalled = false;
    let linkedinAccessible = false;
    let isDeveloperMode = false;
    
    // Check if we got data from an extension
    if (req.method === 'POST') {
      try {
        const data = await req.json();
        extensionInstalled = data.extensionInstalled || false;
        linkedinAccessible = data.linkedinAccessible || false;
        isDeveloperMode = data.isDeveloperMode || false;
      } catch (err) {
        console.error("Failed to parse JSON from extension:", err);
      }
    }
    
    // For demonstration, always reporting our real status
    const isAvailable = extensionInstalled && linkedinAccessible;
    
    console.log("LinkedIn status check - reporting available:", isAvailable);
    console.log("Extension installed:", extensionInstalled);
    console.log("LinkedIn accessible:", linkedinAccessible);
    console.log("Developer mode:", isDeveloperMode);
    
    // Create a more user-friendly status message based on the extension state
    let statusMessage = "";
    let statusSeverity = "info";
    
    if (extensionInstalled && linkedinAccessible) {
      statusMessage = "LinkedIn API is connected and ready.";
      statusSeverity = "success";
    } else if (extensionInstalled && !linkedinAccessible) {
      statusMessage = "Extension installed but LinkedIn is not accessible. Make sure you're logged in to LinkedIn.";
      statusSeverity = "warning";
    } else if (isDeveloperMode) {
      statusMessage = "Developer mode extension detected. Some features may be limited.";
      statusSeverity = "info";
    } else {
      statusMessage = "Extension not installed. Using demo data.";
      statusSeverity = "info";
    }

    // Add Chrome Web Store extension URL if published
    const extensionUrl = "https://chrome.google.com/webstore/detail/sacore-ai-data-connector/YOUR_EXTENSION_ID";
    
    return new Response(JSON.stringify({ 
      available: isAvailable,
      extensionInstalled: extensionInstalled,
      linkedinAccessible: linkedinAccessible,
      supportsExtension: true,
      isDeveloperMode: isDeveloperMode,
      statusMessage: statusMessage,
      statusSeverity: statusSeverity,
      extensionInfo: {
        name: "SACORE AI Data Connector",
        version: "1.0.0",
        extensionUrl: extensionUrl,
        downloadUrl: extensionUrl,
        instructions: "https://ad08adb0-feb2-4c88-9876-792a9a916dde.lovableproject.com/extension-setup",
        supportEmail: "support@example.com"
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in LinkedIn status check:', error);
    return new Response(JSON.stringify({ 
      available: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
