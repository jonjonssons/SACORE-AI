
import React, { useState } from "react";
import { Search, PlusCircle, Filter, LinkedinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { SearchResults } from "@/components/SearchResults";
import { toast } from "@/hooks/use-toast";
import GoogleCustomSearch from "@/components/GoogleCustomSearch";

export function SearchForm() {
  const [searchParams, setSearchParams] = useState({
    keywords: "",
    title: "",
    company: "",
    location: "",
    industry: "",
    companySize: "",
  });

  const [advancedFilters, setAdvancedFilters] = useState(false);
  const [criteriaFields, setCriteriaFields] = useState([
    { id: 1, name: "Job title contains specific keywords", value: true },
    { id: 2, name: "Company has more than 100 employees", value: true },
    { id: 3, name: "Has been at current position for 1+ years", value: false },
    { id: 4, name: "Has engaged with content in last 30 days", value: false },
  ]);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<GoogleCustomSearchResultCollection | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  const handleCriteriaChange = (id: number, checked: boolean) => {
    setCriteriaFields(
      criteriaFields.map(field => 
        field.id === id ? { ...field, value: checked } : field
      )
    );
  };

  const handleSearch = () => {
    // Prepare a search query based on form parameters
    const query = buildSearchQuery();
    
    if (!query) {
      toast({
        title: "Search Error",
        description: "Please provide at least one search term",
        variant: "destructive"
      });
      return;
    }
    
    setIsSearching(true);
    console.log("Executing search with query:", query);
    
    // Set the executeSearch prop to trigger the search
    setShowResults(true);
  };
  
  const handleSearchResults = (results: GoogleCustomSearchResultCollection | null) => {
    setIsSearching(false);
    if (results && results.items && results.items.length > 0) {
      setSearchResults(results);
      console.log(`Search returned ${results.items.length} results`);
      toast({
        title: "Search Complete",
        description: `Found ${results.items.length} results matching your criteria`,
      });
    } else {
      console.error("No search results found or search failed");
      toast({
        title: "No Results",
        description: "No profiles found matching your criteria. Please try different search terms.",
        variant: "destructive"
      });
    }
  };
  
  const buildSearchQuery = (): string => {
    const queryParts = [];
    
    if (searchParams.keywords) queryParts.push(searchParams.keywords);
    if (searchParams.title) queryParts.push(`"${searchParams.title}"`);
    if (searchParams.company) queryParts.push(`"${searchParams.company}"`);
    if (searchParams.location) queryParts.push(`"${searchParams.location}"`);
    if (searchParams.industry) queryParts.push(`"${searchParams.industry}"`);
    
    return queryParts.join(" ");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">LinkedIn Sales Navigator search</CardTitle>
          <CardDescription>
            Paste a search URL or enter search parameters manually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <LinkedinIcon className="h-5 w-5 text-[#0A66C2]" />
            <Input 
              placeholder="Paste LinkedIn Sales Navigator search URL" 
              className="flex-1"
            />
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Input 
                  id="keywords"
                  name="keywords"
                  placeholder="Enter keywords"
                  value={searchParams.keywords}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input 
                  id="title"
                  name="title"
                  placeholder="E.g. CTO, Marketing Manager"
                  value={searchParams.title}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input 
                  id="company"
                  name="company"
                  placeholder="Company name"
                  value={searchParams.company}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location"
                  name="location"
                  placeholder="E.g. Stockholm, Sweden"
                  value={searchParams.location}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            {advancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("industry", value)}
                  >
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="finance">Finance & Banking</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("companySize", value)}
                  >
                    <SelectTrigger id="companySize">
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="501-1000">501-1,000 employees</SelectItem>
                      <SelectItem value="1001-5000">1,001-5,000 employees</SelectItem>
                      <SelectItem value="5001-10000">5,001-10,000 employees</SelectItem>
                      <SelectItem value="10001+">10,001+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            <Button 
              variant="link" 
              className="w-fit p-0 h-auto" 
              onClick={() => setAdvancedFilters(!advancedFilters)}
            >
              {advancedFilters ? "Show less" : "Show more filters"}
            </Button>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Scoring Criteria</h3>
              <Button variant="ghost" size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add criteria
              </Button>
            </div>
            
            <div className="space-y-2">
              {criteriaFields.map((field) => (
                <div key={field.id} className="flex items-start space-x-2">
                  <Checkbox 
                    id={`criteria-${field.id}`} 
                    checked={field.value}
                    onCheckedChange={(checked) => 
                      handleCriteriaChange(field.id, checked as boolean)
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={`criteria-${field.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {field.name}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSearch} className="ml-auto" disabled={isSearching}>
            {isSearching ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search and Score Leads
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {showResults && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                {searchResults && searchResults.items ? 
                  `Found ${searchResults.items.length} leads matching your criteria` : 
                  "Searching for leads..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSearching ? (
                <div className="flex items-center justify-center p-12">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce"></div>
                    <div className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="ml-3 text-gray-400">Searching across LinkedIn profiles...</span>
                </div>
              ) : searchResults && searchResults.items ? (
                <SearchResults results={[]} />
              ) : (
                <div className="text-center p-8 text-gray-500">
                  No results found. Try adjusting your search criteria.
                </div>
              )}
              
              {/* Hidden GoogleCustomSearch component to handle the actual search */}
              <div className="hidden">
                <GoogleCustomSearch 
                  executeSearch={isSearching ? buildSearchQuery() : ""}
                  onResultsReady={handleSearchResults}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
