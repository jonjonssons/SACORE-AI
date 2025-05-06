import React, { useState, useRef } from "react";
import { SendIcon, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchResults } from "@/components/SearchResults";
import { useToast } from "@/hooks/use-toast";
import { generateScoring } from "@/utils/claudeService";
import { CandidateScore, MatchCriteria } from "@/lib/types";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  isFollowUp?: boolean;
  followUpQuestions?: string[];
}

export function ChatInterface() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hi! I'm LinkScore Assistant. Tell me what kind of candidates you're looking for, and I'll help you find and score them.",
      sender: "assistant",
      timestamp: new Date(),
      followUpQuestions: [
        "What role are you hiring for?",
        "What skills are most important for this role?",
        "How many years of experience do you require?",
        "Is industry experience necessary?"
      ]
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRequirementsReady, setIsRequirementsReady] = useState(false);
  const [collectedCriteria, setCollectedCriteria] = useState("");
  const [candidateScores, setCandidateScores] = useState<CandidateScore[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() && uploadedFiles.length === 0) return;

    setIsProcessing(true);

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: inputValue + (uploadedFiles.length > 0 ? ` (uploaded ${uploadedFiles.length} file(s))` : ""),
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
      const scoringResult = await generateScoring(updatedCriteria, uploadedFiles);
      
      if (scoringResult.followUpQuestions && scoringResult.followUpQuestions.length > 0) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "I need a bit more information to provide accurate candidate scoring. Could you help with the following:",
          sender: "assistant",
          timestamp: new Date(),
          followUpQuestions: scoringResult.followUpQuestions
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `I've analyzed your criteria and created a candidate scoring profile. Each criterion is worth 1 point, for a total of 10 points.\n\n${scoringResult.explanation || ""}`,
          sender: "assistant",
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        
        if (scoringResult.criteria && scoringResult.criteria.length > 0) {
          setIsRequirementsReady(true);
          
          const mockCandidates = Array(5).fill(0).map((_, index) => {
            const criteriaWithVariation = scoringResult.criteria!.map(criterion => {
              const meetsThreshold = index === 0 ? 
                Math.random() < 0.9 : 
                Math.random() < 0.6;
              
              return {
                name: criterion.name,
                match: meetsThreshold,
                score: meetsThreshold ? 1 : 0
              };
            });
            
            const overallScore = criteriaWithVariation.reduce((sum, crit) => sum + crit.score, 0);
            
            return {
              id: `candidate-${index + 1}`,
              name: `Candidate ${index + 1}`,
              title: `${index % 2 === 0 ? 'Senior' : 'Director of'} ${index % 3 === 0 ? 'Marketing' : index % 3 === 1 ? 'Sales' : 'Operations'}`,
              company: `Company ${String.fromCharCode(65 + index)}`,
              location: index % 2 === 0 ? 'Stockholm, Sweden' : 'London, UK',
              score: overallScore * 10,
              matchCriteria: criteriaWithVariation
            };
          });
          
          mockCandidates.sort((a, b) => b.score - a.score);
          setCandidateScores(mockCandidates);
          
          setTimeout(() => {
            const linkAssistantMessage: Message = {
              id: (Date.now() + 2).toString(),
              content: "Would you like to use these scoring criteria to analyze LinkedIn profiles?",
              sender: "assistant",
              timestamp: new Date(),
              followUpQuestions: [
                "Yes, let me analyze LinkedIn profiles with these criteria",
                "No, I want to refine the criteria further",
                "Show me candidate matches based on these criteria"
              ]
            };
            
            setMessages(prev => [...prev, linkAssistantMessage]);
          }, 1000);
        }
        
        toast({
          title: "Criteria Analysis Complete",
          description: "We've analyzed your requirements and created a scoring profile.",
        });
      }
    } catch (error) {
      console.error("Error processing message:", error);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I encountered an issue while processing your request. Could you provide more specific details about what you're looking for?",
        sender: "assistant",
        timestamp: new Date(),
        followUpQuestions: [
          "What role are you hiring for?",
          "What skills are most important for this role?",
          "How many years of experience do you require?",
          "Is industry experience necessary?"
        ]
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsProcessing(false);
      setUploadedFiles([]);
    }
  };

  const handleFollowUpClick = (question: string) => {
    if (question === "Yes, let me analyze LinkedIn profiles with these criteria") {
      navigate("/linkedin-analysis");
      return;
    }
    
    if (question === "Show me candidate matches based on these criteria") {
      setShowResults(true);
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: "Here are the top candidates matching your criteria:",
        sender: "assistant",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      return;
    }
    
    setInputValue(question);
    
    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: question,
      sender: "user",
      timestamp: new Date(),
      isFollowUp: true
    };

    setMessages((prev) => [...prev, newUserMessage]);
    
    if (question !== "No, I want to refine the criteria further") {
      setTimeout(() => handleSendMessage(), 100);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFiles(Array.from(e.target.files));
      
      toast({
        title: "Files Uploaded",
        description: `${e.target.files.length} file(s) ready to be analyzed with your criteria.`,
      });
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col h-[700px] border rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4">
        <h2 className="text-white font-bold text-lg">Sacore Candidate Scoring Assistant</h2>
        <p className="text-white/80 text-sm">Powered by advanced candidate scoring algorithms</p>
      </div>

      <ScrollArea className="flex-1 p-6 bg-background/95 backdrop-blur-sm">
        <div className="space-y-6 max-w-3xl mx-auto">
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
                      <AvatarFallback className="bg-neutral-900 text-white">U</AvatarFallback>
                      <AvatarImage src="/placeholder.svg" />
                    </>
                  ) : (
                    <>
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">S</AvatarFallback>
                      <AvatarImage src="/placeholder.svg" />
                    </>
                  )}
                </Avatar>
                <div>
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
          
          {showResults && (
            <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl p-4 border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-blue-700">Top Scored Candidates</h3>
              <SearchResults results={candidateScores} />
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-white/80 backdrop-blur-sm">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          className="hidden" 
          multiple 
          accept=".pdf,.doc,.docx,.txt,.json"
        />
        
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Button
            variant="outline" 
            size="icon"
            onClick={triggerFileUpload}
            className="rounded-full h-12 w-12 border-gray-300 flex-shrink-0"
            title="Upload files (resumes, job descriptions, etc.)"
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
          </Button>
          
          <div className="relative flex-1">
            <Input
              placeholder={isProcessing ? "Assistant is thinking..." : "Describe the candidates you're looking for..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
              disabled={isProcessing}
              className="flex-1 border border-gray-300 focus-visible:ring-blue-600 text-base py-6 pl-4 pr-12 shadow-sm"
            />
            {uploadedFiles.length > 0 && (
              <div className="absolute right-16 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                {uploadedFiles.length} file(s)
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleSendMessage} 
            size="icon"
            disabled={(!inputValue.trim() && uploadedFiles.length === 0) || isProcessing}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full h-12 w-12 shadow-md transition-all duration-300"
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <SendIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
