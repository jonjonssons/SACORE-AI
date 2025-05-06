import { NextApiRequest, NextApiResponse } from 'next';

// SignalHire API endpoint
const SIGNALHIRE_API_URL = 'https://api.signalhire.com/profiles/find-by-url';
// Använd en fast API-nyckel från miljövariabeln - detta är säkrare än att skicka från klienten
const API_KEY = process.env.SIGNALHIRE_API_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'LinkedIn URL is required' });
    }

    if (!API_KEY) {
      console.error('SIGNALHIRE_API_KEY miljövariabel är inte konfigurerad');
      return res.status(500).json({ error: 'API-nyckel är inte konfigurerad på servern' });
    }

    console.log('Fetching profile data from SignalHire for URL:', url);

    // Make request to SignalHire API
    const response = await fetch(`${SIGNALHIRE_API_URL}?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('SignalHire API error:', response.status, errorData);
      
      if (response.status === 401 || response.status === 403) {
        return res.status(401).json({ error: 'Invalid API key or unauthorized access' });
      }
      
      if (response.status === 404) {
        return res.status(404).json({ error: 'Profile not found on SignalHire' });
      }
      
      if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      }
      
      return res.status(response.status).json({ 
        error: `SignalHire API error: ${errorData.message || response.statusText}` 
      });
    }

    const profileData = await response.json();
    
    // Transform SignalHire data to match our expected format
    const transformedData = {
      name: profileData.name || '',
      title: profileData.title || '',
      company: profileData.company || '',
      email: profileData.email || '',
      phone: profileData.phone || '',
      location: profileData.location || '',
      experience: Array.isArray(profileData.experience) 
        ? profileData.experience.map((exp: any) => ({
            company: exp.company || '',
            title: exp.title || '',
            duration: exp.duration || ''
          }))
        : [],
      education: Array.isArray(profileData.education)
        ? profileData.education.map((edu: any) => ({
            school: edu.school || '',
            degree: edu.degree || '',
            year: edu.year || ''
          }))
        : []
    };

    return res.status(200).json(transformedData);
  } catch (error) {
    console.error('Error processing SignalHire request:', error);
    return res.status(500).json({ error: 'Failed to process SignalHire request' });
  }
} 