
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LinkedinIcon, Search, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LinkedInUrlFormProps {
  onSubmit: (url: string, criteria: string) => void;
  isLoading: boolean;
}

export function LinkedInUrlForm({ onSubmit, isLoading }: LinkedInUrlFormProps) {
  const [url, setUrl] = useState("");
  const [criteria, setCriteria] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [criteriaError, setCriteriaError] = useState<string | null>(null);
  const { toast } = useToast();

  // Validate LinkedIn URL
  const validateLinkedInUrl = (url: string) => {
    setUrlError(null);
    
    if (!url.trim()) return setUrlError("URL is required"), false;
    if (!url.includes('linkedin.com')) return setUrlError("Please enter a valid LinkedIn URL"), false;
    
    const isLikelyValidUrl = url.includes('linkedin.com/sales/') || url.includes('linkedin.com/in/');
    if (!isLikelyValidUrl) return setUrlError("Please enter a LinkedIn Sales Navigator or profile URL"), false;
    
    return true;
  };
  
  // Validate criteria
  const validateCriteria = (criteria: string) => {
    setCriteriaError(null);
    
    if (!criteria.trim()) {
      setCriteriaError("Scoring criteria is required");
      return false;
    }
    
    if (criteria.trim().length < 10) {
      setCriteriaError("Please provide more detailed criteria for better results");
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isUrlValid = validateLinkedInUrl(url);
    const isCriteriaValid = validateCriteria(criteria);
    
    if (!isUrlValid || !isCriteriaValid) {
      if (!isUrlValid) {
        toast({
          title: "Invalid URL",
          description: urlError || "Please enter a valid LinkedIn URL",
          variant: "destructive"
        });
      }
      
      if (!isCriteriaValid) {
        toast({
          title: "Invalid criteria",
          description: criteriaError || "Please enter valid scoring criteria",
          variant: "destructive"
        });
      }
      
      return;
    }
    
    onSubmit(url, criteria);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 -mt-[0.7cm]">
        <Label htmlFor="linkedin-url">LinkedIn Sales Navigator URL</Label>
        <div className="relative">
          <LinkedinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            id="linkedin-url"
            placeholder="https://www.linkedin.com/sales/..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (urlError) validateLinkedInUrl(e.target.value);
            }}
            className={`pl-10 py-[0.85rem] ${urlError ? 'border-red-500' : ''}`}
            required
          />
          {urlError && (
            <div className="flex items-center mt-1 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>{urlError}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Paste a LinkedIn Sales Navigator search or profile URL
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="criteria">Scoring Criteria</Label>
        <Textarea
          id="criteria"
          placeholder="Describe the ideal candidate criteria (include experience like '5 years in Sales' or 'SaaS background')"
          value={criteria}
          onChange={(e) => {
            setCriteria(e.target.value);
            if (criteriaError) validateCriteria(e.target.value);
          }}
          required
          className={`min-h-[120px] ${criteriaError ? 'border-red-500' : ''}`}
        />
        {criteriaError && (
          <div className="flex items-center mt-1 text-red-500 text-sm">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>{criteriaError}</span>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Include specific experience requirements (e.g., "3+ years in Marketing", "SaaS experience")
        </p>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || !url || !criteria}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            Analyze LinkedIn Data
            <Search className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
