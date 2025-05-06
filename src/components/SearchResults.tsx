
import React, { useState } from "react";
import { 
  ExternalLink, 
  MessageSquare, 
  Mail, 
  Check, 
  X, 
  ChevronDown,
  ChevronUp,
  Pencil
} from "lucide-react";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CandidateScore } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function SearchResults({ results }: { results: CandidateScore[] }) {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleCardExpansion = (id: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-500 text-white";
    if (score >= 6) return "bg-emerald-500 text-white";
    if (score >= 4) return "bg-amber-500 text-white";
    return "bg-red-500 text-white";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getCriteriaScoreColor = (score: number) => {
    // Binary score: 1 = green, 0 = red
    return score === 1 ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="space-y-4">
      {results.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No results found matching your criteria.</p>
        </Card>
      ) : (
        results.map((candidate) => (
          <Collapsible 
            key={candidate.id} 
            open={expandedCards[candidate.id]} 
            onOpenChange={() => toggleCardExpansion(candidate.id)}
            className="rounded-lg border shadow-sm"
          >
            <Card className="candidate-card overflow-hidden border-0 shadow-none">
              <div className="flex flex-col md:flex-row">
                <div className="flex items-center justify-center p-4 md:p-6 bg-muted md:w-32">
                  <Avatar className="h-20 w-20 border-2 border-background">
                    <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                    <AvatarImage 
                      src={candidate.profileImage || "/placeholder.svg"} 
                      alt={candidate.name} 
                    />
                  </Avatar>
                </div>
                <div className="flex-1 p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <h3 className="font-semibold text-lg">{candidate.name}</h3>
                        <Badge 
                          className={cn(
                            "ml-2 score-badge", 
                            getScoreColor(candidate.score)
                          )}
                        >
                          {candidate.score}/10
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{candidate.title}</p>
                      <p>
                        <strong>{candidate.company}</strong> · {candidate.location}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-1" />
                        Email
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Progress value={candidate.score * 10} className="h-2" />
                  </div>
                  
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-4 w-full flex items-center justify-center"
                    >
                      {expandedCards[candidate.id] ? (
                        <>Show Less <ChevronUp className="ml-1 h-4 w-4" /></>
                      ) : (
                        <>Show Criteria <ChevronDown className="ml-1 h-4 w-4" /></>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
              
              <CollapsibleContent>
                <div className="px-4 md:px-6 pb-6">
                  <div className="text-sm font-medium mb-3">Match Criteria</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {candidate.matchCriteria.map((criteria, index) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          {criteria.match ? (
                            <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                          )}
                          <span className="truncate">{criteria.name}</span>
                        </div>
                        <div className={cn("font-semibold", getCriteriaScoreColor(criteria.score))}>
                          {criteria.match ? "1/1" : "0/1"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))
      )}
    </div>
  );
}
