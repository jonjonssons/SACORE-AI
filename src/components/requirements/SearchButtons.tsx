import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search, ChevronRight, Loader2 } from 'lucide-react';

interface SearchButtonsProps {
  onAddRequirement: () => void;
  onApprove: () => void;
  isSearching: boolean;
  analysisStage: 'idle' | 'searching' | 'analyzing' | 'complete' | 'error';
  searchExecuted: boolean;
  disableSearch: boolean;
  isRelaxedSearch: boolean;
  requirementsCount?: number;
  isEditing?: boolean;
}

const SearchButtons = ({
  onAddRequirement,
  onApprove,
  isSearching,
  analysisStage,
  searchExecuted,
  disableSearch,
  isRelaxedSearch,
  requirementsCount = 0,
  isEditing = true
}: SearchButtonsProps) => {
  const getSearchButtonText = () => {
    if (isSearching) {
      if (analysisStage === 'searching') return 'Searching...';
      if (analysisStage === 'analyzing') return 'Analyzing Results...';
      return 'Processing...';
    }
    
    return "Approve";
  };

  return (
    <div className="flex space-x-3 justify-end">
      {isEditing && (
        <Button
          variant="outline"
          onClick={onAddRequirement}
          className="bg-white hover:bg-gray-50 border-gray-300 text-black hover:text-gray-800"
        >
          <Plus className="h-4 w-4 mr-1" />
          <span>Add Requirement</span>
        </Button>
      )}
      
      <Button
        variant="default"
        onClick={onApprove}
        disabled={disableSearch}
        className={`${
          disableSearch 
            ? 'opacity-70 cursor-not-allowed' 
            : 'bg-black hover:bg-gray-800'
        } min-w-[120px]`}
      >
        {isSearching ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Search className="h-4 w-4 mr-1" />
        )}
        <span>{getSearchButtonText()}</span>
      </Button>
    </div>
  );
};

export default SearchButtons;
