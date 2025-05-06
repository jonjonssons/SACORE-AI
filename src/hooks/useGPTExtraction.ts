
interface Profile {
  title?: string;
  snippet?: string;
  link?: string;
}

interface ExtractedProfile {
  name: string;
  title: string;
  company: string;
  url: string;
}

export const useGPTExtraction = () => {
  const extractProfileData = async (profiles: Profile[]): Promise<ExtractedProfile[]> => {
    console.log('Starting profile extraction process:', profiles.length);
    
    if (profiles.length > 0) {
      console.log('Sample profile data for extraction:');
      profiles.slice(0, 2).forEach((profile, i) => {
        console.log(`Profile ${i} input:`, {
          title: profile.title,
          snippet: profile.snippet?.substring(0, 50) + '...',
          link: profile.link
        });
      });
    }
    
    const extractedProfiles = await Promise.all(profiles.map(async (profile, index) => {
      try {
        console.log(`Extracting name for profile ${index}...`);
        const response = await fetch("https://ucofzcubtdgwcekdogxr.functions.supabase.co/linkedin_data_retrieval", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: profile.title || "",
            snippet: profile.snippet || ""
          })
        });

        if (!response.ok) {
          console.error(`HTTP error for profile ${index}! status: ${response.status}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Name extraction result for profile ${index}:`, data);
        
        // Make sure name is properly assigned from the API response
        const name = data.name || '';
        console.log(`Extracted name for profile ${index}: "${name}"`);
        
        return {
          name: name,
          title: profile.title || '',
          company: data.company || '',
          url: profile.link || ''
        };
      } catch (error) {
        console.error(`Error extracting profile ${index} data:`, error);
        return {
          name: '',
          title: profile.title || '',
          company: '',
          url: profile.link || ''
        };
      }
    }));

    console.log('Extracted names:', extractedProfiles.map(p => p.name));
    
    localStorage.setItem('aiExtractedProfiles', JSON.stringify(extractedProfiles));
    localStorage.setItem('extractedProfileData', JSON.stringify(extractedProfiles));
    localStorage.setItem('linkSheetRows', JSON.stringify(
      extractedProfiles.map((profile, index) => ({
        id: `profile-${index}`,
        url: profile.url,
        name: profile.name,
        title: profile.title || '',
        company: profile.company || ''
      }))
    ));
    
    try {
      const storedData = localStorage.getItem('linkSheetRows');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log(`Verified data storage - read back ${parsedData.length} profiles`);
        console.log('First few stored names:', parsedData.slice(0, 3).map(p => p.name));
      }
    } catch (error) {
      console.error('Error verifying data storage:', error);
    }
    
    return extractedProfiles;
  };

  return { extractProfileData };
};

export default useGPTExtraction;
