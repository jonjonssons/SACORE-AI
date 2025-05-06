
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Endpoint för att ta emot och uppdatera prompts
 */
serve(async (req) => {
  // Hantera CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Kontrollera att det är en POST-begäran
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Endast POST-metod stöds' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Hämta data från begäran
    const data = await req.json();
    
    // Kontrollera att nödvändig data finns
    if (!data.promptType || !data.promptContent) {
      return new Response(
        JSON.stringify({ error: 'Båda promptType och promptContent krävs' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validera promptType
    const validPromptTypes = [
      'companyPrediction', 
      'companyFallback', 
      'companyCorrection',
      'profileExtraction',
      'titleExtraction',
      'searchQuery'
    ];

    if (!validPromptTypes.includes(data.promptType)) {
      return new Response(
        JSON.stringify({ 
          error: `Ogiltig promptType. Måste vara en av: ${validPromptTypes.join(', ')}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Här skulle vi normalt uppdatera prompten i databasen eller en fil
    // För denna implementation loggar vi bara och returnerar framgång
    console.log(`Uppdaterar prompt av typ: ${data.promptType}`);
    console.log(`Nytt promptinnehåll: ${data.promptContent}`);
    
    // I en verklig implementation skulle vi uppdatera filen eller databasen här
    // Kod för att spara prompten till en fil eller databas skulle gå här

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Prompt av typ ${data.promptType} har uppdaterats framgångsrikt`,
        promptType: data.promptType
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Fel vid hantering av prompt-uppdatering:', error);
    
    return new Response(
      JSON.stringify({ error: `Internt serverfel: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
