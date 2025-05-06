
import React from 'react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import SearchResultsTable from '@/components/SearchResultsTable';
import LinksSheet from '@/components/LinksSheet';

interface SearchResultsProps {
  links: string[];
  hasCompletedSearch: boolean;
  searchResultsReady: boolean;
  sheetOpen: boolean;
  onSheetOpenChange: (open: boolean) => void;
  apiError?: string | null;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  links,
  hasCompletedSearch,
  searchResultsReady,
  sheetOpen,
  onSheetOpenChange,
  apiError
}) => {
  return (
    <div id="results" className="bg-[#1A1F2C] p-6 rounded-xl border border-[#2A2F3C] mb-6">
      <h3 className="text-xl font-bold mb-4 text-white">
        Search Results {links.length > 0 ? `(${links.length})` : ''}
      </h3>

      {apiError && (
        <Alert className="mb-4 bg-[#2D1E24] border-[#7D2231]">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Search Error</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {hasCompletedSearch && (
        <div className="space-y-2">
          {links.slice(0, 5).map((link, index) => (
            <div key={index} className="p-3 rounded-lg bg-[#232733] border border-[#2A2F3C]">
              <a 
                href={link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:text-blue-300 break-all"
              >
                {link}
              </a>
            </div>
          ))}
          {links.length > 5 && (
            <div className="text-center mt-2">
              <button 
                onClick={() => onSheetOpenChange(true)}
                className="text-blue-400 hover:text-blue-300"
              >
                View all {links.length} results
              </button>
            </div>
          )}
        </div>
      )}

      {links.length > 0 && (
        <LinksSheet 
          links={links} 
          isOpen={sheetOpen} 
          onOpenChange={onSheetOpenChange}
        />
      )}
    </div>
  );
};

export default SearchResults;
