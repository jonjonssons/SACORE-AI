
import React, { useState } from 'react';
import { formatAsSwedishContactJSON } from '@/utils/profileExtractors/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, Globe } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SwedishContactExtractor: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState<'sv' | 'en'>('sv');

  const handleExtract = () => {
    try {
      // Split input by lines to separate title and snippet
      const lines = input.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        toast({
          title: language === 'sv' ? "Inget innehåll" : "No content",
          description: language === 'sv' 
            ? "Vänligen ange sökresultat att analysera."
            : "Please enter search results to analyze.",
          variant: "destructive"
        });
        return;
      }
      
      // Assume first line is title, rest is snippet
      const title = lines[0];
      const snippet = lines.slice(1).join(' ');
      
      // Extract contact information
      const contactInfo = formatAsSwedishContactJSON({ title, snippet });
      
      // Format as JSON with English field names if needed
      const formattedResult = language === 'sv' 
        ? JSON.stringify(contactInfo, null, 2)
        : JSON.stringify({
            name: contactInfo.namn,
            title: contactInfo.titel,
            company: contactInfo.företag
          }, null, 2);
      
      setResult(formattedResult);
      
      toast({
        title: language === 'sv' ? "Extraktion slutförd" : "Extraction complete",
        description: language === 'sv'
          ? "Kontaktuppgifter extraherade från sökresultatet."
          : "Contact information extracted from search results.",
      });
    } catch (error) {
      console.error('Error extracting contact info:', error);
      toast({
        title: language === 'sv' ? "Extraktion misslyckades" : "Extraction failed",
        description: language === 'sv'
          ? "Ett fel uppstod vid extrahering av kontaktuppgifter."
          : "An error occurred while extracting contact information.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      toast({
        title: language === 'sv' ? "Kopierat" : "Copied",
        description: language === 'sv'
          ? "JSON kopierat till urklipp."
          : "JSON copied to clipboard.",
      });
      
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({
        title: language === 'sv' ? "Kopiering misslyckades" : "Copy failed",
        description: language === 'sv'
          ? "Kunde inte kopiera till urklipp."
          : "Could not copy to clipboard.",
        variant: "destructive"
      });
    });
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'sv' ? 'en' : 'sv');
    // Re-extract if we have a result to update the language
    if (result) {
      handleExtract();
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card className="bg-[#161923] border-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex justify-between items-center">
            {language === 'sv' ? "Extrahera kontaktuppgifter" : "Extract Contact Information"}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleLanguage} 
              className="h-8 w-8"
              title={language === 'sv' ? "Switch to English" : "Byt till Svenska"}
            >
              <Globe className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-gray-400">
              {language === 'sv' 
                ? "Klistra in LinkedIn-sökresultat här (titel och snippet från Google):"
                : "Paste LinkedIn search results here (title and snippet from Google):"}
            </p>
            <Textarea
              placeholder={language === 'sv'
                ? "Ex: Håkan Svedberg – Account Executive – Lobster&#10;LinkedIn · Håkan Svedberg&#10;Göteborg, Västra Götalands län, Sverige · Account Executive · Lobster"
                : "Ex: John Smith – Product Manager – Acme Inc.&#10;LinkedIn · John Smith&#10;New York, United States · Product Manager · Acme Inc."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-32 bg-[#1A1F2C] border-gray-700"
            />
          </div>
          
          <Button 
            onClick={handleExtract}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {language === 'sv' ? "Extrahera kontaktuppgifter" : "Extract Contact Information"}
          </Button>
          
          {result && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-400">
                  {language === 'sv' ? "Resultat:" : "Result:"}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-gray-400"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copied 
                    ? (language === 'sv' ? "Kopierat" : "Copied") 
                    : (language === 'sv' ? "Kopiera JSON" : "Copy JSON")}
                </Button>
              </div>
              <div className="rounded-md bg-black p-4 font-mono text-sm">
                <pre className="whitespace-pre-wrap">{result}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SwedishContactExtractor;
