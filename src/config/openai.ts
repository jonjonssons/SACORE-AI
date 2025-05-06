/**
 * OpenAI API konfiguration
 * För att använda: 
 * 1. Skapa en kopia av .env.example och döp den till .env
 * 2. Lägg till din OpenAI API-nyckel
 * 3. Starta om utvecklingsservern
 */

export const openaiConfig = {
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo',
  maxTokens: Number(import.meta.env.VITE_OPENAI_MAX_TOKENS || 100),
  temperature: Number(import.meta.env.VITE_OPENAI_TEMPERATURE || 0.7),
  enableNameExtraction: import.meta.env.VITE_ENABLE_NAME_EXTRACTION_AI === 'true',
};

/**
 * Kontrollera om OpenAI API-nyckeln är konfigurerad
 */
export const isOpenAIConfigured = (): boolean => {
  return Boolean(openaiConfig.apiKey) && 
         openaiConfig.apiKey !== 'your_openai_api_key_here';
}; 