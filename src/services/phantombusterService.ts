
import { toast } from '@/hooks/use-toast';

const PHANTOMBUSTER_API_KEY = 'mV9L81NC8ckhApbgg6XbWeMEXNmDQhspsMIvPajkcjA';

interface PhantomBusterResponse {
  status: string;
  id?: string;
  message?: string;
  containerId?: string;
}

export const runPhantombusterSearch = async (linkedInUrl: string): Promise<PhantomBusterResponse> => {
  try {
    console.log("Starting Phantombuster search with URL:", linkedInUrl);
    
    // Configuration for Sales Navigator Search Export phantom
    const agentId = "10048"; // This is the ID for LinkedIn Sales Navigator Search Export phantom
    const arguments_json = JSON.stringify({
      sessionCookie: "li_at", // This is a placeholder, ideally stored securely
      searchUrl: linkedInUrl,
      numberOfProfiles: 100,
      extractDefaultUrl: true
    });

    const formData = new FormData();
    formData.append('arguments', arguments_json);

    const response = await fetch(`https://api.phantombuster.com/api/v2/agents/launch`, {
      method: 'POST',
      headers: {
        'X-Phantombuster-Key': PHANTOMBUSTER_API_KEY
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Phantombuster API error:", errorText);
      throw new Error(`Phantombuster API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("Phantombuster search initiated:", data);
    
    return data;
  } catch (error) {
    console.error("Error running Phantombuster search:", error);
    toast({
      title: "Phantombuster Error",
      description: error.message || "Failed to run Phantombuster search",
      variant: "destructive"
    });
    throw error;
  }
};

export const checkPhantombusterStatus = async (containerId: string): Promise<any> => {
  try {
    console.log("Checking Phantombuster job status for containerId:", containerId);
    
    const response = await fetch(`https://api.phantombuster.com/api/v2/containers/fetch-output?id=${containerId}`, {
      method: 'GET',
      headers: {
        'X-Phantombuster-Key': PHANTOMBUSTER_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to check status: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("Phantombuster status check result:", data);
    return data;
  } catch (error) {
    console.error("Error checking Phantombuster status:", error);
    return { status: 'error', error: error.message };
  }
};

export const getPhantombusterResults = async (containerId: string): Promise<any[]> => {
  try {
    let status = await checkPhantombusterStatus(containerId);
    let attempts = 0;
    const maxAttempts = 20; // About 5 minutes with 15 second intervals
    
    while (status.status !== 'finished' && status.status !== 'error' && attempts < maxAttempts) {
      console.log(`Waiting for Phantombuster results... (Attempt ${attempts + 1}/${maxAttempts})`);
      
      // Wait for 15 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      status = await checkPhantombusterStatus(containerId);
      attempts++;
    }

    if (status.status === 'error') {
      throw new Error(`Phantombuster job failed: ${status.message || 'Unknown error'}`);
    }

    if (attempts >= maxAttempts) {
      throw new Error('Timeout waiting for Phantombuster results');
    }

    console.log("Phantombuster processing complete. Fetching results...");
    
    // Get the result data
    const response = await fetch(`https://api.phantombuster.com/api/v2/agents/fetch-output?id=${containerId}`, {
      method: 'GET',
      headers: {
        'X-Phantombuster-Key': PHANTOMBUSTER_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch results: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      console.error("Unexpected data format from Phantombuster:", data);
      throw new Error('Invalid data format from Phantombuster');
    }
    
    return data.data;
  } catch (error) {
    console.error("Error getting Phantombuster results:", error);
    toast({
      title: "Failed to get results",
      description: error.message || "An error occurred while retrieving search results",
      variant: "destructive"
    });
    return [];
  }
};
