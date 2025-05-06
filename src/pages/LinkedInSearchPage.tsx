import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ArrowRight, Link as LinkIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { runPhantombusterSearch } from '@/services/phantombusterService';

const LinkedInSearchPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedService, setSelectedService] = useState('evaboot');

  const handlePhantombusterSearch = async () => {
    try {
      setIsProcessing(true);
      toast({
        title: "Phantombuster Search",
        description: "Initiating search with Phantombuster...",
      });
      
      const response = await runPhantombusterSearch(searchQuery);
      
      if (response.status === "success" && response.containerId) {
        localStorage.setItem('phantombusterContainerId', response.containerId);
        localStorage.setItem('linkedInSearchQuery', searchQuery);
        
        toast({
          title: "Phantombuster Job Started",
          description: "Your search is being processed by Phantombuster.",
        });
        
        setTimeout(() => {
          navigate('/sheet-view');
        }, 1500);
      } else {
        throw new Error("Failed to start Phantombuster job");
      }
    } catch (error) {
      console.error("Phantombuster search error:", error);
      toast({
        title: "Search Error",
        description: error.message || "An error occurred with Phantombuster search",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a LinkedIn search link",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      localStorage.setItem('linkedInSearchQuery', searchQuery);
      localStorage.setItem('selectedService', selectedService);
      
      navigate('/linkedin-connect');
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Error",
        description: "An error occurred while processing your search",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getServiceLabel = () => {
    switch(selectedService) {
      case 'evaboot': return 'Use Evaboot';
      case 'appify': return 'Use Appify';
      case 'phantombuster': return 'Use Phantombuster';
      default: return 'Choose Analysis Service';
    }
  };

  return (
    <div className="min-h-screen bg-[#131722] text-white">
      <div className="max-w-4xl mx-auto pt-20 px-4">
        <Card className="w-full bg-[#1A1F2C] border-[#2A2F3C] text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text">
              LinkedIn Search Results
            </CardTitle>
            <CardDescription className="text-gray-400">
              Paste LinkedIn Sales Navigator Search Link
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-5 w-5" />
                <Input
                  placeholder="Paste LinkedIn Sales Navigator Search Link"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 py-6 bg-[#212636] border-[#2A3042] text-white rounded-lg"
                />
              </div>

              <div className="w-full">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full bg-[#212636] border-[#2A3042] text-white hover:bg-[#2A3042]">
                      <span>{getServiceLabel()}</span>
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full bg-[#1A1F2C] border-[#2A2F3C] text-white">
                    <DropdownMenuItem 
                      onClick={() => setSelectedService('evaboot')}
                      className="hover:bg-[#2A3042] cursor-pointer"
                    >
                      Use Evaboot
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setSelectedService('appify')}
                      className="hover:bg-[#2A3042] cursor-pointer"
                    >
                      Use Appify
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setSelectedService('phantombuster')}
                      className="hover:bg-[#2A3042] cursor-pointer"
                    >
                      Use Phantombuster
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <Button 
                onClick={handleSearch}
                disabled={isProcessing || !searchQuery.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LinkedInSearchPage;
