import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promisify } from 'util';
import fetch from 'node-fetch';

// Konfigurera environment variabler
dotenv.config();

// API konfiguration - används genomgående i filen
const SIGNALHIRE_API_KEY = '202.evxjhWwFUZyG5qr8gJlEN1BQ5PIe';

// För att använda __dirname i ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3333;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add debug middleware to log requests and responses
app.use((req, res, next) => {
  // Log request details
  console.log(`[DEBUG] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('[DEBUG] Headers:', req.headers);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('[DEBUG] Request Body:', JSON.stringify(req.body, null, 2));
  } else {
    console.log('[DEBUG] Request Body: Empty or no body parser for this content-type');
    // For debugging raw request body
    let rawBody = '';
    req.on('data', chunk => {
      rawBody += chunk.toString();
    });
    req.on('end', () => {
      if (rawBody) {
        console.log('[DEBUG] Raw Request Body:', rawBody);
      }
    });
  }
  
  // Capture and log response
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`[DEBUG] ${new Date().toISOString()} - Response Status: ${res.statusCode}`);
    console.log('[DEBUG] Response:', typeof data === 'object' ? JSON.stringify(data) : data.toString().substring(0, 500));
    return originalSend.call(this, data);
  };
  
  next();
});

// Data store for profile data
const dataDirectory = path.join(__dirname, 'data');
const profilesFile = path.join(dataDirectory, 'profiles.json');
const requestsFile = path.join(dataDirectory, 'requests.json');

// Ensure data directory exists
if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true });
}

// Initialize store files if they don't exist
if (!fs.existsSync(profilesFile)) {
  fs.writeFileSync(profilesFile, JSON.stringify({}));
}

if (!fs.existsSync(requestsFile)) {
  fs.writeFileSync(requestsFile, JSON.stringify({}));
}

// Memory cache
let profilesCache = {};
let requestsCache = {};
let evaluationsCache = {};

// Load data from files
try {
  profilesCache = JSON.parse(fs.readFileSync(profilesFile, 'utf8'));
  requestsCache = JSON.parse(fs.readFileSync(requestsFile, 'utf8'));
  console.log(`Loaded ${Object.keys(profilesCache).length} profiles and ${Object.keys(requestsCache).length} requests from disk`);
} catch (error) {
  console.error('Error loading data from disk:', error);
}

// Helper function to save profiles to disk
const saveProfiles = async () => {
  try {
    await promisify(fs.writeFile)(profilesFile, JSON.stringify(profilesCache, null, 2));
  } catch (error) {
    console.error('Error saving profiles to disk:', error);
  }
};

// Helper function to save requests to disk
const saveRequests = async () => {
  try {
    await promisify(fs.writeFile)(requestsFile, JSON.stringify(requestsCache, null, 2));
  } catch (error) {
    console.error('Error saving requests to disk:', error);
  }
};

// Helper function to save evaluations to disk
const saveEvaluations = async () => {
  try {
    const evaluationsFile = path.join(dataDirectory, 'evaluations.json');
    await promisify(fs.writeFile)(evaluationsFile, JSON.stringify(evaluationsCache, null, 2));
  } catch (error) {
    console.error('Error saving evaluations to disk:', error);
  }
};

// Helper function to normalize LinkedIn URLs
const normalizeLinkedInUrl = (url) => {
  if (!url) return '';
  
  try {
    // Add https:// if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Parse the URL to handle it properly
    const urlObj = new URL(url);
    
    // Make sure it's a linkedin.com URL
    if (!urlObj.hostname.includes('linkedin.com')) {
      console.warn('Not a LinkedIn URL:', url);
      return url; // Return as is if not LinkedIn
    }
    
    // Clean up the path to just keep the profile part
    let path = urlObj.pathname;
    
    // Remove trailing slash
    if (path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    
    // Get just /in/username or /pub/username part
    const pathParts = path.split('/').filter(Boolean);
    if (pathParts.length >= 2) {
      // Keep only first two parts (e.g., 'in' and 'username')
      path = '/' + pathParts.slice(0, 2).join('/');
    }
    
    // Build clean URL without query parameters or fragments
    return `https://www.linkedin.com${path}`;
  } catch (error) {
    console.error('Error normalizing LinkedIn URL:', error);
    return url; // Return original if parsing fails
  }
};

// API Routes

// Route to receive SignalHire callbacks
app.post('/api/signalhire-callback', async (req, res) => {
  console.log('Received callback from SignalHire:', JSON.stringify(req.body, null, 2));
  
  try {
    const data = req.body;
    
    if (!data || !data.requestId) {
      return res.status(400).json({ error: 'Invalid request data. Missing requestId.' });
    }
    
    const requestId = data.requestId;
    
    // Check if we have a request with this ID
    if (!requestsCache[requestId]) {
      console.warn(`Received callback for unknown requestId: ${requestId}`);
      // Create placeholder request entry
      requestsCache[requestId] = {
        url: data.url || 'unknown',
        createdAt: new Date().toISOString(),
        status: 'unknown',
        note: 'Created from callback with unknown requestId'
      };
    }
    
    console.log(`Found matching request for requestId: ${requestId}`);
    
    // Get the LinkedIn URL from the request
    let linkedInUrl = requestsCache[requestId].url;
    
    if (!linkedInUrl || linkedInUrl === 'unknown') {
      // Try to extract from data
      if (data.url) {
        linkedInUrl = data.url;
      } else if (data.profile && data.profile.linkedinUrl) {
        linkedInUrl = data.profile.linkedinUrl;
      }
      
      // Normalize the URL
      linkedInUrl = normalizeLinkedInUrl(linkedInUrl);
      
      // Update the request with the extracted URL
      requestsCache[requestId].url = linkedInUrl;
    }
    
    if (linkedInUrl) {
      console.log(`Processing callback data for URL: ${linkedInUrl}`);
      
      try {
        // Store the profile data with the LinkedIn URL as the key
        profilesCache[linkedInUrl] = {
          data: data,
          timestamp: new Date().toISOString(),
          requestId: requestId
        };
        
        // Update request status
        requestsCache[requestId].status = 'completed';
        requestsCache[requestId].completedAt = new Date().toISOString();
        
        // Check if we have pending evaluation criteria for this profile
        if (evaluationsCache[linkedInUrl] && !evaluationsCache[linkedInUrl].evaluated) {
          console.log(`Found pending evaluation for ${linkedInUrl}, analyzing profile...`);
          const criteria = evaluationsCache[linkedInUrl].criteria;
          
          try {
            // Analyze profile against criteria
            const evaluation = analyzeProfile(data, criteria);
            
            // Update evaluation with results
            evaluationsCache[linkedInUrl].evaluation = evaluation;
            evaluationsCache[linkedInUrl].evaluated = true;
            
            await saveEvaluations();
            
            console.log(`Profile evaluation completed for ${linkedInUrl}:`, evaluation);
          } catch (evaluationError) {
            console.error(`Error analyzing profile for ${linkedInUrl}:`, evaluationError);
            
            // Store the error in the evaluation
            evaluationsCache[linkedInUrl].error = evaluationError.message;
            evaluationsCache[linkedInUrl].evaluated = true;
            await saveEvaluations();
          }
        } else {
          console.log(`No pending evaluation found for ${linkedInUrl}`);
        }
        
        // Save to disk
        await saveProfiles();
        await saveRequests();
        
        console.log(`Stored profile data for URL: ${linkedInUrl}`);
      } catch (storageError) {
        console.error(`Error storing profile data for ${linkedInUrl}:`, storageError);
      }
    } else {
      console.error('Could not determine LinkedIn URL for requestId:', requestId);
    }
    
    // Always acknowledge receipt of callback data
    return res.status(200).json({ success: true, message: 'Callback data received' });
  } catch (error) {
    console.error('Error processing SignalHire callback:', error);
    return res.status(500).json({ error: 'Internal server error processing callback' });
  }
});

// Route to register a new SignalHire API request
app.post('/api/signalhire-request', async (req, res) => {
  console.log('Received request to register SignalHire request:', JSON.stringify(req.body, null, 2));
  
  try {
    const { requestId, url } = req.body;
    
    if (!requestId || !url) {
      return res.status(400).json({ error: 'Missing required fields: requestId and url' });
    }
    
    // Store the request
    requestsCache[requestId] = {
      url: url,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    // Save to disk
    await saveRequests();
    
    return res.status(200).json({ success: true, message: 'Request registered successfully' });
  } catch (error) {
    console.error('Error registering SignalHire request:', error);
    return res.status(500).json({ error: 'Internal server error registering request' });
  }
});

// Endpoint to enrich profile with SignalHire data
app.post('/api/enrich-profile', async (req, res) => {
  console.log('Received request to enrich profile:', JSON.stringify(req.body, null, 2));
  
  try {
    const { linkedinUrl, userId, criteria } = req.body;
    
    if (!linkedinUrl) {
      return res.status(400).json({ error: 'LinkedIn URL is required' });
    }
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Normalize the LinkedIn URL
    const normalizedUrl = normalizeLinkedInUrl(linkedinUrl);
    console.log(`Original URL: ${linkedinUrl}`);
    console.log(`Normalized URL: ${normalizedUrl}`);
    
    // Check if we already have data for this URL
    if (profilesCache[normalizedUrl]) {
      console.log(`Using cached profile data for URL: ${normalizedUrl}`);
      
      // Store evaluation criteria for later use
      evaluationsCache[normalizedUrl] = {
        userId,
        criteria,
        timestamp: new Date().toISOString(),
        evaluated: false
      };
      
      await saveEvaluations();
      
      // Analyze profile immediately with existing data
      const evaluation = analyzeProfile(profilesCache[normalizedUrl].data, criteria);
      
      // Update evaluation with results
      evaluationsCache[normalizedUrl].evaluation = evaluation;
      evaluationsCache[normalizedUrl].evaluated = true;
      
      await saveEvaluations();
      
      return res.status(200).json({
        success: true,
        message: 'Profile enriched from cache',
        data: {
          profileData: profilesCache[normalizedUrl].data,
          evaluation
        }
      });
    }
    
    // Make request to SignalHire API
    console.log('Making request to SignalHire API for URL:', normalizedUrl);
    
    // Server host for callback URL
    const HOST = process.env.HOST || `http://localhost:${PORT}`;
    
    // Prepare request payload - make sure it's valid JSON
    const requestPayload = {
      items: [normalizedUrl], // Make sure this is an array with at least one item
      withoutContacts: true,
      callbackUrl: `${HOST}/api/signalhire-callback`
    };
    
    console.log('SignalHire API request payload:', JSON.stringify(requestPayload, null, 2));
    
    // Make API request to SignalHire
    try {
      // Use apikey instead of X-API-KEY according to SignalHire documentation
      const response = await fetch('https://www.signalhire.com/api/v1/candidate/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': SIGNALHIRE_API_KEY,
          'apikey': SIGNALHIRE_API_KEY
        },
        body: JSON.stringify(requestPayload)
      });
      
      console.log('SignalHire API response status:', response.status);
      console.log('SignalHire API response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check status - we expect 201 Created according to documentation
      if (response.status === 201) {
        // Successful request - try to read requestId
        const responseText = await response.text();
        console.log('SignalHire API response text:', responseText);
        
        let requestId;
        
        // Try to parse JSON if there's a response
        if (responseText && responseText.trim()) {
          try {
            const data = JSON.parse(responseText);
            requestId = data.requestId;
            console.log('Received requestId:', requestId);
          } catch (jsonError) {
            console.warn('Could not parse response as JSON:', jsonError);
            // Generate own requestId if parsing fails
            requestId = `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          }
        } else {
          // Empty response, create own requestId
          requestId = `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          console.log('Empty response, using generated requestId:', requestId);
        }
        
        // Store the request
        requestsCache[requestId] = {
          url: normalizedUrl,
          userId,
          criteria,
          createdAt: new Date().toISOString(),
          status: 'pending'
        };
        
        // Save to disk
        await saveRequests();
        
        // Store evaluation criteria for later use
        evaluationsCache[normalizedUrl] = {
          userId,
          criteria,
          timestamp: new Date().toISOString(),
          evaluated: false
        };
        
        await saveEvaluations();
        
        return res.status(200).json({
          success: true,
          message: 'Profile enrichment request sent to SignalHire',
          requestId: requestId,
          pollingUrl: `${HOST}/api/profile/${encodeURIComponent(normalizedUrl)}`
        });
      } else {
        // Error status, log information and return error
        const errorText = await response.text();
        console.error('SignalHire API error:', response.status, errorText);
        
        return res.status(500).json({ 
          error: `SignalHire API error: ${response.status}`,
          details: errorText
        });
      }
    } catch (error) {
      console.error('Error calling SignalHire API:', error);
      return res.status(500).json({ 
        error: 'Error calling SignalHire API',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Error enriching profile:', error);
    return res.status(500).json({ error: 'Internal server error enriching profile' });
  }
});

// Route to check profile data by LinkedIn URL
app.get('/api/profile/:url', (req, res) => {
  try {
    const url = decodeURIComponent(req.params.url);
    console.log(`Checking profile data for URL: ${url}`);
    
    // Check if we have this profile
    if (profilesCache[url]) {
      console.log('Profile found in cache');
      const profile = profilesCache[url].data?.profile || {};
      
      // Format profile data for frontend
      const formattedData = {
        found: true,
        name: profile.fullName || 'Unknown',
        title: profile.headLine || getJobTitle(profile),
        company: getCurrentCompany(profile),
        email: getEmail(profile),
        phone: getPhone(profile),
        location: getLocation(profile),
        experience: formatExperience(profile.experience || []),
        education: formatEducation(profile.education || []),
        linkedInUrl: url,
        timestamp: profilesCache[url].timestamp
      };
      
      return res.status(200).json(formattedData);
    }
    
    // Check if we have a pending request for this URL
    const pendingRequest = Object.values(requestsCache).find(
      request => request.url === url && request.status === 'pending'
    );
    
    if (pendingRequest) {
      console.log('Pending request found');
      return res.status(200).json({
        found: false,
        pending: true,
        message: 'Request is pending. Try again shortly.',
        linkedInUrl: url
      });
    }
    
    // No data found
    console.log('No profile data found');
    return res.status(200).json({
      found: false,
      pending: false,
      message: 'No profile data found for this URL.',
      linkedInUrl: url
    });
  } catch (error) {
    console.error('Error checking profile data:', error);
    return res.status(500).json({ error: 'Internal server error checking profile data' });
  }
});

// Route to get profile evaluation
app.get('/api/evaluation/:url', (req, res) => {
  try {
    const url = decodeURIComponent(req.params.url);
    console.log(`Checking evaluation for URL: ${url}`);
    
    // Check if we have evaluation for this profile
    if (evaluationsCache[url] && evaluationsCache[url].evaluated) {
      return res.status(200).json({
        found: true,
        evaluation: evaluationsCache[url].evaluation,
        timestamp: evaluationsCache[url].timestamp
      });
    }
    
    // No evaluation found
    return res.status(200).json({
      found: false,
      message: 'No evaluation found for this URL.'
    });
  } catch (error) {
    console.error('Error checking evaluation:', error);
    return res.status(500).json({ error: 'Internal server error checking evaluation' });
  }
});

// Route to list all profiles (for admin purposes)
app.get('/api/profiles', (req, res) => {
  try {
    const profiles = Object.keys(profilesCache).map(url => ({
      url,
      timestamp: profilesCache[url].timestamp,
      name: profilesCache[url].data?.profile?.fullName || 'Unknown'
    }));
    
    return res.status(200).json({ profiles });
  } catch (error) {
    console.error('Error listing profiles:', error);
    return res.status(500).json({ error: 'Internal server error listing profiles' });
  }
});

// Endpoint to enrich profile with SignalHire public data only (no contacts)
app.post('/api/enrich-profile-public', async (req, res) => {
  console.log('Received request to enrich public profile data:', JSON.stringify(req.body, null, 2));
  
  try {
    const { linkedinUrl, userId } = req.body;
    
    if (!linkedinUrl) {
      return res.status(400).json({ error: 'LinkedIn URL is required' });
    }
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Check available credits first
    console.log('Checking available public profile credits...');
    try {
      const creditsResponse = await fetch('https://www.signalhire.com/api/v1/credits?withoutContacts=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': SIGNALHIRE_API_KEY,
          'apikey': SIGNALHIRE_API_KEY
        }
      });
      
      if (!creditsResponse.ok) {
        console.error('Error checking credits:', creditsResponse.status);
        return res.status(500).json({ 
          error: 'Error checking credits with SignalHire API',
          status: creditsResponse.status
        });
      }
      
      const creditsData = await creditsResponse.json();
      console.log('Credits response:', creditsData);
      
      // Check if we have credits available
      if (!creditsData.withoutContacts || creditsData.withoutContacts <= 0) {
        console.log('No credits available for public profile enrichment');
        return res.status(403).json({ 
          error: 'No credits available for public profile enrichment.'
        });
      }
      
      console.log(`Available credits: ${creditsData.withoutContacts}`);
      
      // Normalize the LinkedIn URL
      const normalizedUrl = normalizeLinkedInUrl(linkedinUrl);
      console.log(`Original URL: ${linkedinUrl}`);
      console.log(`Normalized URL: ${normalizedUrl}`);
      
      // Server host for callback URL
      const HOST = process.env.HOST || `http://localhost:${PORT}`;
      
      // Prepare request payload
      const requestPayload = {
        items: [normalizedUrl],
        withoutContacts: true,
        callbackUrl: `${HOST}/api/signalhire-callback`
      };
      
      console.log('SignalHire API request payload:', JSON.stringify(requestPayload, null, 2));
      
      // Make API request to SignalHire
      const response = await fetch('https://www.signalhire.com/api/v1/candidate/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': SIGNALHIRE_API_KEY,
          'apikey': SIGNALHIRE_API_KEY
        },
        body: JSON.stringify(requestPayload)
      });
      
      console.log('SignalHire API response status:', response.status);
      
      // Check status - we expect 201 Created according to documentation
      if (response.status === 201) {
        console.log('Successfully sent enrichment request to SignalHire');
        
        // Generate request ID
        const requestId = `req_public_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // Store the request
        requestsCache[requestId] = {
          url: normalizedUrl,
          userId,
          createdAt: new Date().toISOString(),
          status: 'pending',
          type: 'public'
        };
        
        // Save to disk
        await saveRequests();
        
        return res.status(200).json({
          success: true,
          message: 'Public profile enrichment request sent to SignalHire',
          requestId: requestId,
          pollingUrl: `${HOST}/api/profile/${encodeURIComponent(normalizedUrl)}`
        });
      } else {
        // Error status, log information and return error
        console.error('SignalHire API error:', response.status);
        
        return res.status(500).json({ 
          error: `SignalHire API error: ${response.status}`
        });
      }
    } catch (error) {
      console.error('Error enriching public profile:', error);
      return res.status(500).json({ 
        error: 'Error enriching public profile',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Error processing public profile enrichment request:', error);
    return res.status(500).json({ error: 'Internal server error enriching public profile' });
  }
});

// Endpoint to check available public profile credits
app.get('/api/credits/public', async (req, res) => {
  console.log('Checking available public profile credits');
  
  try {
    const response = await fetch('https://www.signalhire.com/api/v1/credits?withoutContacts=true', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': SIGNALHIRE_API_KEY,
        'apikey': SIGNALHIRE_API_KEY
      }
    });
    
    if (!response.ok) {
      console.error('Error checking credits:', response.status);
      return res.status(500).json({ 
        error: 'Error checking credits with SignalHire API',
        status: response.status
      });
    }
    
    const creditsData = await response.json();
    console.log('Credits response:', creditsData);
    
    return res.status(200).json({
      credits: creditsData.withoutContacts || 0
    });
  } catch (error) {
    console.error('Error checking public profile credits:', error);
    return res.status(500).json({ error: 'Error checking credits', details: error.message });
  }
});

// Route to list all requests (for admin purposes)
app.get('/api/requests', (req, res) => {
  try {
    return res.status(200).json({ requests: requestsCache });
  } catch (error) {
    console.error('Error listing requests:', error);
    return res.status(500).json({ error: 'Internal server error listing requests' });
  }
});

// Route to delete a profile
app.delete('/api/profile/:url', async (req, res) => {
  try {
    const url = decodeURIComponent(req.params.url);
    
    if (profilesCache[url]) {
      delete profilesCache[url];
      await saveProfiles();
      return res.status(200).json({ success: true, message: 'Profile deleted successfully' });
    } else {
      return res.status(404).json({ error: 'Profile not found' });
    }
  } catch (error) {
    console.error('Error deleting profile:', error);
    return res.status(500).json({ error: 'Internal server error deleting profile' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  const startTime = process.uptime();
  const uptime = Math.floor(startTime);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: `${hours}h ${minutes}m ${seconds}s`,
    profiles: Object.keys(profilesCache).length,
    requests: Object.keys(requestsCache).length,
    server: {
      node: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      pid: process.pid
    }
  });
});

// Function to analyze a profile against criteria
function analyzeProfile(profileData, criteria) {
  try {
    console.log('Analyzing profile against criteria:', criteria);
    
    if (!profileData || !criteria || !Array.isArray(criteria)) {
      return {
        score: "0/0",
        matches: [],
        nonMatches: []
      };
    }
    
    const profile = profileData.profile || profileData;
    const matches = [];
    const nonMatches = [];
    
    // Extract useful profile information
    const fullName = profile.fullName || '';
    const currentTitle = profile.headLine || '';
    const experience = profile.experience || [];
    const education = profile.education || [];
    const skills = profile.skills || [];
    
    // Get all work experience titles and companies
    const allTitles = experience.map(exp => exp.position || '').filter(Boolean);
    const allCompanies = experience.map(exp => exp.company || '').filter(Boolean);
    
    // Get all education information
    const allSchools = education.map(edu => edu.university || '').filter(Boolean);
    const allDegrees = education.map(edu => {
      if (Array.isArray(edu.degree)) {
        return edu.degree.join(' ');
      }
      return edu.degree || '';
    }).filter(Boolean);
    
    // Concatenate all profile text for keyword matching
    const profileText = [
      fullName,
      currentTitle,
      ...allTitles,
      ...allCompanies,
      ...allSchools,
      ...allDegrees,
      ...(skills.map(s => s.name || '').filter(Boolean))
    ].join(' ').toLowerCase();
    
    // Check each criterion against the profile
    for (const criterion of criteria) {
      const keywords = criterion.keywords || criterion.text || '';
      
      if (!keywords) continue;
      
      // Split the keywords by commas, OR, or AND
      const keywordList = keywords
        .split(/,|\sOR\s|\sAND\s/)
        .map(k => k.trim().toLowerCase())
        .filter(Boolean);
      
      // Check if any of the keywords match the profile text
      const keywordMatches = keywordList.some(keyword => profileText.includes(keyword));
      
      if (keywordMatches) {
        matches.push(criterion);
      } else {
        nonMatches.push(criterion);
      }
    }
    
    // Calculate score as a fraction
    const score = `${matches.length}/${criteria.length}`;
    
    return {
      score,
      matches,
      nonMatches
    };
  } catch (error) {
    console.error('Error analyzing profile:', error);
    return {
      score: "0/0",
      error: error.message,
      matches: [],
      nonMatches: []
    };
  }
}

// Add direct handler for /api/fetchProfile
app.post('/api/fetchProfile', async (req, res) => {
  console.log('Received request to /api/fetchProfile directly on the server');
  console.log('Request body:', req.body);
  
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('Empty request body in direct server handler');
      return res.status(400).json({
        error: 'Empty request body',
        message: 'Please provide a valid JSON body with LinkedIn URL'
      });
    }
    
    const { url, linkedinUrl } = req.body;
    const linkedInUrl = url || linkedinUrl;
    
    if (!linkedInUrl) {
      console.error('Missing LinkedIn URL in request');
      return res.status(400).json({
        error: 'LinkedIn URL is required',
        receivedData: req.body
      });
    }
    
    console.log(`Processing LinkedIn URL directly: ${linkedInUrl}`);
    
    // Check if we have this profile data cached
    const normalizedUrl = normalizeLinkedInUrl(linkedInUrl);
    
    if (profilesCache[normalizedUrl] && profilesCache[normalizedUrl].data) {
      console.log('Found cached profile data for:', normalizedUrl);
      const profileData = profilesCache[normalizedUrl].data;
      
      return res.status(200).json({
        name: profileData.profile?.fullName || 'Unknown',
        title: profileData.profile?.headline || '',
        company: getCurrentCompany(profileData.profile) || '',
        email: getEmail(profileData.profile) || '',
        phone: getPhone(profileData.profile) || '',
        location: getLocation(profileData.profile) || '',
        experience: formatExperience(profileData.profile?.experience || []),
        education: formatEducation(profileData.profile?.education || []),
        linkedInUrl: normalizedUrl,
        source: 'cached'
      });
    }
    
    // Generate mock data for any profile to avoid endless "pending"
    console.log('Generating mock profile data for testing');
    
    // Extract name from LinkedIn profile URL
    let mockName = linkedInUrl.split('/').pop() || 'mockuser';
    mockName = mockName.replace(/[.-]/g, ' ');
    
    // Format name parts properly
    const nameParts = mockName.split(/\s+/);
    const firstName = nameParts[0] ? (nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase()) : 'John';
    const lastName = nameParts.length > 1 ? (nameParts[nameParts.length-1].charAt(0).toUpperCase() + nameParts[nameParts.length-1].slice(1).toLowerCase()) : 'Doe';
    const fullName = `${firstName} ${lastName}`;
    
    // Create email from name
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    
    // Choose a random job title and company
    const jobTitles = ['Software Developer', 'Project Manager', 'UX Designer', 'Data Scientist', 'Marketing Manager'];
    const companies = ['Spotify', 'Klarna', 'Ericsson', 'Volvo', 'IKEA', 'H&M'];
    
    const title = jobTitles[Math.floor(Math.random() * jobTitles.length)];
    const company = companies[Math.floor(Math.random() * companies.length)];
    
    const mockData = {
      name: fullName,
      title: title,
      company: company,
      email: email,
      phone: '+46 70 ' + Math.floor(1000000 + Math.random() * 9000000),
      location: 'Stockholm, Sweden',
      experience: [
        {
          company: company,
          title: title,
          duration: `${1 + Math.floor(Math.random() * 4)} years`
        },
        {
          company: companies[Math.floor(Math.random() * companies.length)],
          title: jobTitles[Math.floor(Math.random() * jobTitles.length)],
          duration: `${1 + Math.floor(Math.random() * 3)} years`
        }
      ],
      education: [
        {
          school: 'KTH Royal Institute of Technology',
          degree: 'Master of Science in Computer Science',
          year: `${2015 + Math.floor(Math.random() * 8)}`
        }
      ],
      linkedInUrl: linkedInUrl,
      source: 'mock'
    };
    
    return res.status(200).json(mockData);
  } catch (error) {
    console.error('Error handling fetchProfile request:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An unknown error occurred'
    });
  }
});

// Helper functions for formatting profile data
function getJobTitle(profile) {
  if (profile.experience && profile.experience.length > 0) {
    const currentJob = profile.experience.find(job => job.current === true);
    return currentJob ? currentJob.position : profile.experience[0].position;
  }
  return '';
}

function getCurrentCompany(profile) {
  if (profile.experience && profile.experience.length > 0) {
    const currentJob = profile.experience.find(job => job.current === true);
    return currentJob ? currentJob.company : profile.experience[0].company;
  }
  return '';
}

function getEmail(profile) {
  if (profile.contacts && profile.contacts.length > 0) {
    const email = profile.contacts.find(contact => contact.type === 'email');
    return email ? email.value : '';
  }
  return '';
}

function getPhone(profile) {
  if (profile.contacts && profile.contacts.length > 0) {
    const phone = profile.contacts.find(contact => contact.type === 'phone');
    return phone ? phone.value : '';
  }
  return '';
}

function getLocation(profile) {
  return profile.location || '';
}

function formatExperience(experience) {
  return experience.map(job => ({
    title: job.position || '',
    company: job.company || '',
    duration: formatDuration(job.startDate, job.endDate),
    current: job.current || false
  }));
}

function formatEducation(education) {
  return education.map(edu => ({
    school: edu.university || '',
    degree: Array.isArray(edu.degree) ? edu.degree.join(' ') : (edu.degree || ''),
    dates: formatDuration(edu.startDate, edu.endDate)
  }));
}

function formatDuration(startDate, endDate) {
  const start = startDate ? startDate.split('/').pop() : '';
  const end = endDate ? endDate.split('/').pop() : 'Present';
  return start && end ? `${start} - ${end}` : '';
}

// Add new endpoint to the server
app.post('/api/enrich-public-profile', async (req, res) => {
  console.log('Received request to enrich public profile:', JSON.stringify(req.body, null, 2));
  
  try {
    const { linkedinUrl } = req.body;
    
    if (!linkedinUrl) {
      console.error('Missing LinkedIn URL in request');
      return res.status(400).json({ 
        error: 'LinkedIn URL is required' 
      });
    }
    
    // Normalize the LinkedIn URL
    const normalizedUrl = normalizeLinkedInUrl(linkedinUrl);
    console.log(`Original URL: ${linkedinUrl}`);
    console.log(`Normalized URL: ${normalizedUrl}`);
    
    // Server host for callback URL
    const HOST = process.env.HOST || `http://localhost:${PORT}`;
    
    // Prepare request payload
    const requestPayload = {
      items: [normalizedUrl],
      withoutContacts: true,
      callbackUrl: `${HOST}/api/signalhire-callback`
    };
    
    console.log('SignalHire API request payload:', JSON.stringify(requestPayload, null, 2));
    
    // Make API request to SignalHire
    const response = await fetch('https://www.signalhire.com/api/v1/candidate/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': SIGNALHIRE_API_KEY,
        'apikey': SIGNALHIRE_API_KEY
      },
      body: JSON.stringify(requestPayload)
    });
    
    console.log('SignalHire API response status:', response.status);
    
    // Check status - we expect 201 Created according to documentation
    if (response.status === 201) {
      console.log('SignalHire request accepted.');
      
      // Generate request ID
      const requestId = `req_public_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Store the request
      requestsCache[requestId] = {
        url: normalizedUrl,
        createdAt: new Date().toISOString(),
        status: 'pending',
        type: 'public'
      };
      
      // Save to disk
      await saveRequests();
      
      return res.status(200).json({
        success: true,
        message: 'Profile enrichment started.',
        requestId: requestId,
        pollingUrl: `${HOST}/api/profile/${encodeURIComponent(normalizedUrl)}`
      });
    } else if (response.status === 401) {
      console.error('Unauthorized – check your API key or headers.');
      return res.status(401).json({ 
        error: 'Unauthorized – check your API key or headers.'
      });
    } else {
      // Error status, log information and return error
      console.error('SignalHire API error:', response.status);
      
      let responseText = '';
      try {
        responseText = await response.text();
        console.error('Error response body:', responseText);
      } catch (e) {
        console.error('Could not read error response body');
      }
      
      return res.status(response.status).json({ 
        error: `SignalHire API error: ${response.status}`,
        details: responseText
      });
    }
  } catch (error) {
    console.error('Error enriching public profile:', error);
    return res.status(500).json({ 
      error: 'Error enriching public profile',
      details: error.message
    });
  }
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Setup graceful shutdown
process.on('SIGINT', () => {
  console.log('Server shutting down gracefully...');
  
  // Save any in-memory data before shutdown
  try {
    fs.writeFileSync(profilesFile, JSON.stringify(profilesCache, null, 2));
    fs.writeFileSync(requestsFile, JSON.stringify(requestsCache, null, 2));
    console.log('Data saved successfully before shutdown');
  } catch (error) {
    console.error('Error saving data before shutdown:', error);
  }
  
  // Close the server
  server.close(() => {
    console.log('Server closed successfully');
    process.exit(0);
  });
  
  // Force exit after 5 seconds if server doesn't close gracefully
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 5000);
}); 