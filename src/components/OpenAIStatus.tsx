import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { openaiConfig, isOpenAIConfigured } from '@/config/openai';
import { toast } from '@/hooks/use-toast';

const OpenAIStatus: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unchecked' | 'valid' | 'invalid'>('unchecked');
  
  const checkApiKey = async () => {
    setIsChecking(true);
    setApiStatus('unchecked');
    
    if (!isOpenAIConfigured()) {
      setApiStatus('invalid');
      toast({
        title: "API-nyckel saknas",
        description: "OpenAI API-nyckeln är inte konfigurerad. Kontrollera din .env-fil.",
        variant: "destructive"
      });
      setIsChecking(false);
      return;
    }
    
    try {
      // Make a simple API call to validate the key
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${openaiConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setApiStatus('valid');
        toast({
          title: "API-nyckel är giltig",
          description: "Anslutningen till OpenAI API fungerar korrekt.",
        });
      } else {
        setApiStatus('invalid');
        const error = await response.json();
        toast({
          title: "Ogiltig API-nyckel",
          description: error.error?.message || "Kunde inte ansluta till OpenAI API.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setApiStatus('invalid');
      toast({
        title: "Anslutningsfel",
        description: "Kunde inte ansluta till OpenAI API. Kontrollera din internetanslutning.",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto bg-slate-900 border-slate-800 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          OpenAI Konfigurationsstatus
          {apiStatus === 'valid' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {apiStatus === 'invalid' && <XCircle className="h-5 w-5 text-red-500" />}
          {apiStatus === 'unchecked' && <Info className="h-5 w-5 text-blue-500" />}
        </CardTitle>
        <CardDescription className="text-gray-400">
          Kontrollera status för OpenAI API-nyckeln
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">API-nyckelstatus:</span>
            <Badge 
              variant={apiStatus === 'valid' ? 'default' : 'destructive'}
              className={apiStatus === 'unchecked' ? 'bg-blue-600' : ''}
            >
              {apiStatus === 'valid' && 'Giltig'}
              {apiStatus === 'invalid' && 'Ogiltig'}
              {apiStatus === 'unchecked' && 'Kontrollera'}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Vald modell:</span>
            <span className="text-sm font-medium">{openaiConfig.model}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Max tokens:</span>
            <span className="text-sm font-medium">{openaiConfig.maxTokens}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Namnextrahering aktiverad:</span>
            <Badge variant={openaiConfig.enableNameExtraction ? 'default' : 'outline'}>
              {openaiConfig.enableNameExtraction ? 'Ja' : 'Nej'}
            </Badge>
          </div>
        </div>
        
        <div className="p-3 rounded bg-slate-800 border border-slate-700">
          <p className="text-xs text-gray-400 mb-1">API-nyckel (maskerad):</p>
          <code className="text-xs font-mono">
            {openaiConfig.apiKey 
              ? `${openaiConfig.apiKey.substring(0, 7)}...${openaiConfig.apiKey.substring(openaiConfig.apiKey.length - 4)}` 
              : 'Inte konfigurerad'}
          </code>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={checkApiKey} 
          disabled={isChecking}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          {isChecking ? 'Kontrollerar...' : 'Kontrollera API-anslutning'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OpenAIStatus; 