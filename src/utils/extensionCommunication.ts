
/**
 * Utility functions for communicating with the LinkedIn extension
 */

/**
 * Check if the LinkedIn browser extension is installed and connected
 * @returns Promise with extension status
 */
export async function checkExtensionStatus(): Promise<{
  installed: boolean;
  connected: boolean;
  isDeveloperMode: boolean;
  error?: string;
}> {
  // Simplified version that always returns false for extension status
  return {
    installed: false,
    connected: false,
    isDeveloperMode: false,
    error: undefined
  };
}

/**
 * Get the extension download information
 */
export async function getExtensionInfo(): Promise<{
  name: string;
  version: string;
  downloadUrl: string;
  instructions: string;
}> {
  // Return default values without making API calls
  return {
    name: "LinkedIn Data Connector",
    version: "1.0.0",
    downloadUrl: "#",
    instructions: "#"
  };
}

/**
 * Check if the LinkedIn API is available
 * @returns Boolean indicating if the API is available
 */
export async function isLinkedInApiAvailable(): Promise<boolean> {
  return false;
}

/**
 * Get a user-friendly status message about the LinkedIn integration
 * @returns Status object with message and severity
 */
export async function getLinkedInStatusMessage(): Promise<{
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  showExtensionPrompt: boolean;
}> {
  return {
    message: 'Using demo data for demonstration.',
    severity: 'info',
    showExtensionPrompt: false
  };
}
