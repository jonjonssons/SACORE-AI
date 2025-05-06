import { openaiConfig, isOpenAIConfigured } from '@/config/openai';
import { toast } from '@/hooks/use-toast';

/**
 * Interface för namnextrahering från LinkedIn-profiler
 */
interface LinkedInProfile {
  title?: string;
  snippet?: string;
  link?: string;
}

interface NameExtractionResult {
  name: string;
  confidence: number;
}

/**
 * Extrahera namn från LinkedIn-profildata med hjälp av OpenAI API
 */
export const extractNameWithAI = async (
  profile: LinkedInProfile
): Promise<NameExtractionResult | null> => {
  if (!isOpenAIConfigured()) {
    console.error('OpenAI API is not configured. Check your .env file.');
    return null;
  }

  try {
    const prompt = `
    Du är en expert på att extrahera namn från LinkedIn-profiler. 
    Från följande LinkedIn-profilinformation, extrahera personens fullständiga namn (för- och efternamn).

    Titel: "${profile.title || ''}"
    Beskrivning: "${profile.snippet || ''}"
    URL: "${profile.link || ''}"
    
    LinkedIn-titlar innehåller ofta namn följt av position och företag, separerade med " - " eller " | ".
    Till exempel: "John Doe - Software Engineer at Microsoft | LinkedIn"
    
    LinkedIn snippets innehåller också ofta namnet som första del.
    
    Du ska BARA svara med personens fullständiga namn, ingenting annat. Om du inte kan extrahera ett namn med säkerhet, svara med "Unknown".
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: openaiConfig.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: openaiConfig.maxTokens,
        temperature: 0.3, // Lägre temperatur för mer precisa svar
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to extract name');
    }

    const data = await response.json();
    const extractedName = data.choices[0]?.message?.content?.trim() || '';
    
    // Om GPT svarade "Unknown" eller inget alls
    if (extractedName === 'Unknown' || !extractedName) {
      return null;
    }

    // Om vi hittar något som inte ser ut som ett namn (t.ex. en hel mening)
    if (extractedName.length > 40 || extractedName.includes('.')) {
      console.log("AI returned potential non-name:", extractedName);
      return null;
    }

    console.log(`AI extracted name from profile "${profile.title}": "${extractedName}"`);
    
    return {
      name: extractedName,
      confidence: 0.9, // Estimated confidence score
    };
  } catch (error) {
    console.error('Error extracting name with OpenAI:', error);
    return null;
  }
};

/**
 * Batch-process för att extrahera namn från flera profiler
 * Använder batching för att undvika rate-limits och reducera kostnader
 */
export const extractNamesWithAI = async (
  profiles: LinkedInProfile[]
): Promise<Map<string, string>> => {
  const nameMap = new Map<string, string>();
  const BATCH_SIZE = 5; // Processa 5 i taget för att undvika rate limits
  const DELAY_MS = 1000; // 1 sekund mellan batches
  
  if (!isOpenAIConfigured()) {
    toast({
      title: "OpenAI API saknas",
      description: "Kontrollera din .env-fil och lägg till VITE_OPENAI_API_KEY",
      variant: "destructive"
    });
    return nameMap;
  }

  try {
    // Visa toast för att indikera processen
    toast({
      title: "Extraherar namn med AI",
      description: `Bearbetar ${profiles.length} profiler...`,
    });

    // Dela upp profiler i batches
    for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
      const batch = profiles.slice(i, i + BATCH_SIZE);
      
      // Processa batch parallellt
      const results = await Promise.all(
        batch.map(async (profile) => {
          const result = await extractNameWithAI(profile);
          return { profile, result };
        })
      );
      
      // Uppdatera resultat i nameMap
      results.forEach(({ profile, result }) => {
        if (result && profile.link) {
          nameMap.set(profile.link, result.name);
        }
      });
      
      // Uppdatera användarinterface med progress
      if (i % 10 === 0 || i + BATCH_SIZE >= profiles.length) {
        toast({
          title: "Namnextrahering pågår",
          description: `Bearbetat ${Math.min(i + BATCH_SIZE, profiles.length)} av ${profiles.length} profiler`,
        });
      }
      
      // Vänta före nästa batch
      if (i + BATCH_SIZE < profiles.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    // Visa success toast
    toast({
      title: "Namnextrahering slutförd",
      description: `Extraherade ${nameMap.size} namn från ${profiles.length} profiler`,
    });

    return nameMap;
  } catch (error) {
    console.error('Error batch-processing profiles:', error);
    
    toast({
      title: "Fel vid namnextrahering",
      description: "Kunde inte extrahera namn med AI. Kontrollera din API-nyckel.",
      variant: "destructive"
    });
    
    return nameMap;
  }
}; 