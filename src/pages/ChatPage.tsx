import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Send, 
  Check, 
  Link as LinkIcon,
  ArrowRight,
  X,
  User,
  FileText
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SearchResults } from "@/components/SearchResults";
import { useToast } from "@/hooks/use-toast";
import { generateScoring, analyzeLinkedInUrl } from "@/utils/claudeService";
import { CandidateScore } from "@/lib/types";
import { mockSearch } from "@/lib/mock-data";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  isFollowUp?: boolean;
  followUpQuestions?: string[];
  showResults?: boolean;
  results?: CandidateScore[];
  linkedInPrompt?: boolean;
}

const ChatPage = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hej! Jag är Sacore AI. Berätta för mig vilka kandidater du letar efter, så hjälper jag dig att hitta och betygsätta dem.",
      sender: "assistant",
      timestamp: new Date(),
      followUpQuestions: [
        "Vilken roll rekryterar du för?",
        "Vilka kompetenser är viktigast för denna roll?",
        "Hur många års erfarenhet krävs?",
        "Är branscherfarenhet nödvändig?"
      ]
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [collectedCriteria, setCollectedCriteria] = useState("");
  const [candidateScores, setCandidateScores] = useState<CandidateScore[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isAnalyzingLinkedIn, setIsAnalyzingLinkedIn] = useState(false);

  useEffect(() => {
    const scrollContainer = document.getElementById('chat-scroll-area');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const linkedInPrompt = messages[messages.length - 1].linkedInPrompt;
    
    if (linkedInPrompt) {
      setLinkedinUrl(inputValue);
      handleLinkedinSubmit(inputValue);
      return;
    }

    setIsProcessing(true);

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    
    const updatedCriteria = collectedCriteria 
      ? `${collectedCriteria}\n\nAdditional information: ${inputValue}` 
      : inputValue;
    
    setCollectedCriteria(updatedCriteria);
    setInputValue("");

    try {
      const scoringResult = await generateScoring(updatedCriteria);
      
      if (scoringResult.followUpQuestions && scoringResult.followUpQuestions.length > 0) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "Jag behöver lite mer information för att ge en korrekt bedömning av kandidater. Kan du hjälpa till med följande:",
          sender: "assistant",
          timestamp: new Date(),
          followUpQuestions: scoringResult.followUpQuestions
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `Jag har analyserat dina kriterier och betygsatt kandidater därefter. Här är resultaten, betygsatta på en skala från 0-10 för varje kriterium:\n\n${scoringResult.explanation || ""}`,
          sender: "assistant",
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        
        if (scoringResult.criteria && scoringResult.criteria.length > 0) {
          const candidatesWithCustomScores = mockSearch.results.map((candidate, index) => {
            const criteriaWithVariation = scoringResult.criteria!.map(criterion => {
              let variation = (Math.random() * 0.3) - 0.15;
              if (index === 0) variation = 0.1;
              let score = Math.max(0, Math.min(1, criterion.score + variation));
              score = Math.round(score * 10) / 10;
              
              return {
                name: criterion.name,
                match: score >= 0.5,
                score: score
              };
            });
            
            const overallScore = Math.round(
              criteriaWithVariation.reduce((sum, crit) => sum + (crit.score * 10), 0) / 
              criteriaWithVariation.length
            );
            
            return {
              ...candidate,
              score: overallScore,
              matchCriteria: criteriaWithVariation
            };
          });
          
          candidatesWithCustomScores.sort((a, b) => b.score - a.score);
          setCandidateScores(candidatesWithCustomScores);
          
          const resultsMessage: Message = {
            id: (Date.now() + 2).toString(),
            content: "Här är kandidaterna som bäst matchar dina kriterier:",
            sender: "assistant",
            timestamp: new Date(),
            showResults: true,
            results: candidatesWithCustomScores
          };
          
          setMessages(prev => [...prev, resultsMessage]);
          
          const linkedinPromptMessage: Message = {
            id: (Date.now() + 3).toString(),
            content: "Vill du att jag ska analysera kandidater från LinkedIn? Ange din LinkedIn Sales Navigator URL eller skriv 'Nej tack' för att avsluta.",
            sender: "assistant",
            timestamp: new Date(),
            linkedInPrompt: true
          };
          
          setMessages(prev => [...prev, linkedinPromptMessage]);
        }
        
        toast({
          title: "Kandidatbetygsättning klar",
          description: "Vi har analyserat dina kriterier och betygsatt matchande kandidater.",
        });
      }
    } catch (error) {
      console.error("Fel vid bearbetning av meddelande:", error);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Jag stötte på ett problem vid bearbetningen av din förfrågan. Kan du ge mer specifika detaljer om vad du letar efter?",
        sender: "assistant",
        timestamp: new Date(),
        followUpQuestions: [
          "Vilken roll rekryterar du för?",
          "Vilka kompetenser är viktigast för denna roll?",
          "Hur många års erfarenhet krävs?",
          "Är branscherfarenhet nödvändig?"
        ]
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLinkedinSubmit = async (url: string) => {
    if (!url.trim() || url.toLowerCase() === "nej tack") {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: "Okej, tack för att du använde Sacore AI! Är det något annat jag kan hjälpa dig med?",
        sender: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      return;
    }

    setIsAnalyzingLinkedIn(true);
    
    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: url,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);

    try {
      const result = await analyzeLinkedInUrl(url, collectedCriteria);
      
      localStorage.setItem('linkedinAnalysis', JSON.stringify({
        url: url,
        criteria: collectedCriteria,
        result
      }));
      
      const linkedInCandidates = Array(5).fill(0).map((_, index) => {
        const matchCriteria = result.matches.map(match => ({
          name: match.name,
          match: match.match,
          score: match.score
        }));
        
        const overallScore = Math.round(result.score * 100 * (1 - (index * 0.08)));
        
        return {
          id: `linkedin-${index}`,
          name: `LinkedIn Kandidat ${index + 1}`,
          title: index % 2 === 0 ? 'Senior Developer' : 'Tech Lead',
          company: `Företag ${String.fromCharCode(65 + index)}`,
          location: index % 2 === 0 ? 'Stockholm' : 'Göteborg',
          score: overallScore,
          matchCriteria: matchCriteria
        };
      });
      
      const linkedInResultsMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Jag har analyserat LinkedIn-data och hittat dessa matchande kandidater:",
        sender: "assistant",
        timestamp: new Date(),
        showResults: true,
        results: linkedInCandidates
      };
      
      setMessages(prev => [...prev, linkedInResultsMessage]);
      
      const completionMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: "Kandidatanalysen är klar! Du kan också gå till sökssidan för att se alla resultat i ett mer detaljerat gränssnitt. Är det något mer du vill att jag ska hjälpa dig med?",
        sender: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, completionMessage]);
      
      toast({
        title: "LinkedIn-analys klar",
        description: "Vi har analyserat LinkedIn-data och hittat potentiella matchningar.",
      });
    } catch (error) {
      console.error("Fel vid LinkedIn-analys:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Jag kunde inte analysera LinkedIn-URL:en. Kontrollera att du har angett en giltig LinkedIn Sales Navigator URL och försök igen.",
        sender: "assistant",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Fel",
        description: "Kunde inte analysera LinkedIn-data.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingLinkedIn(false);
    }
  };

  const handleFollowUpClick = (question: string) => {
    setInputValue(question);
    
    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: question,
      sender: "user",
      timestamp: new Date(),
      isFollowUp: true
    };

    setMessages((prev) => [...prev, newUserMessage]);
    
    handleSendMessage();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 text-white">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Sacore AI</h1>
          <p className="text-white/80">Din chatbot för kandidatrekrytering</p>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-6 max-w-4xl">
        <Card className="h-[calc(100vh-12rem)] flex flex-col shadow-lg rounded-xl overflow-hidden border">
          <ScrollArea id="chat-scroll-area" className="flex-1 p-4">
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex gap-3 max-w-[85%] ${
                      message.sender === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Avatar className={`h-9 w-9 ${message.sender === "assistant" ? "bg-gradient-to-br from-blue-600 to-purple-600" : "bg-black"}`}>
                      {message.sender === "user" ? (
                        <>
                          <AvatarFallback className="bg-neutral-900 text-white">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                          <AvatarImage src="/placeholder.svg" />
                        </>
                      ) : (
                        <>
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">S</AvatarFallback>
                          <AvatarImage src="/placeholder.svg" />
                        </>
                      )}
                    </Avatar>
                    <div className="space-y-1 max-w-full">
                      <Card className={`border-0 shadow-md ${
                        message.sender === "assistant" 
                          ? "bg-white" 
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                      }`}>
                        <CardContent className="p-4">
                          <p className={message.sender === "user" ? "text-white" : "text-gray-800"}>{message.content}</p>
                          
                          {message.sender === "assistant" && message.followUpQuestions && message.followUpQuestions.length > 0 && (
                            <div className="mt-4 space-y-2">
                              {message.followUpQuestions.map((question, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleFollowUpClick(question)}
                                  className="block w-full text-left px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm transition-colors"
                                >
                                  {question}
                                </button>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      
                      {message.showResults && message.results && (
                        <div className="mt-4 bg-white rounded-xl p-4 border shadow-sm">
                          <SearchResults results={message.results} />
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-1 px-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <Avatar className="h-9 w-9 bg-gradient-to-br from-blue-600 to-purple-600">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">S</AvatarFallback>
                    </Avatar>
                    <div>
                      <Card className="border-0 shadow-md bg-white">
                        <CardContent className="p-4">
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 rounded-full bg-white animate-bounce"></div>
                            <div className="w-1 h-1 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-1 h-1 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}
              
              {isAnalyzingLinkedIn && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <Avatar className="h-9 w-9 bg-gradient-to-br from-blue-600 to-purple-600">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">S</AvatarFallback>
                    </Avatar>
                    <div>
                      <Card className="border-0 shadow-md bg-white">
                        <CardContent className="p-4">
                          <div className="flex flex-col space-y-2">
                            <div className="flex space-x-2">
                              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></div>
                              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                            <p className="text-sm text-gray-600">Analyserar LinkedIn data...</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Input
                placeholder={isProcessing || isAnalyzingLinkedIn ? "Assistenten tänker..." : "Beskriv kandidaterna du letar efter..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                disabled={isProcessing || isAnalyzingLinkedIn}
                className="flex-1 border border-gray-300 focus-visible:ring-blue-600 text-base py-6 pl-4 pr-12 shadow-sm"
              />
              <Button 
                onClick={handleSendMessage} 
                size="icon"
                disabled={!inputValue.trim() || isProcessing || isAnalyzingLinkedIn}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full h-12 w-12 shadow-md transition-all duration-300"
              >
                {isProcessing || isAnalyzingLinkedIn ? (
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 rounded-full bg-white animate-bounce"></div>
                    <div className="w-1 h-1 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-1 h-1 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </main>
      
      <footer className="border-t p-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Sacore AI. Alla rättigheter förbehållna.
      </footer>
    </div>
  );
};

export default ChatPage;
