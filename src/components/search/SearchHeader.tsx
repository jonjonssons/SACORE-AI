
import React from "react";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchHeaderProps {
  onNewSearch?: () => void;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({ onNewSearch }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-transparent bg-clip-text">Lead Search</h1>
        <p className="text-gray-400">
          Search for leads using LinkedIn Sales Navigator criteria or chat interface
        </p>
      </div>
      <div className="flex items-start gap-2">
        <Button variant="outline" className="border-gray-700 bg-[#212636] hover:bg-[#262D42] hover:text-blue-400 transition-all text-gray-300">
          <Filter className="mr-2 h-4 w-4" />
          Saved searches
        </Button>
        <Button 
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 transition-all"
          onClick={onNewSearch}
        >
          <Search className="mr-2 h-4 w-4" />
          New search
        </Button>
      </div>
    </div>
  );
};

export default SearchHeader;
