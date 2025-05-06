import React from 'react';
import FollowUpQuestions from '@/components/requirements/FollowUpQuestions';
import SearchButtons from '@/components/requirements/SearchButtons';
import { Separator } from '@/components/ui/separator';

interface Requirement {
  id: string;
  description: string;
  score: number;
  isAiSuggested?: boolean;
  category?: string;
}

interface RequirementsFooterProps {
  requirements: Requirement[];
  followUpQuestions: string[];
  onFollowUpClick: (question: string) => void;
  onAddRequirement: () => void;
  onApprove: () => void;
  isSearching: boolean;
  analysisStage: 'idle' | 'searching' | 'analyzing' | 'complete' | 'error';
  searchExecuted: boolean;
  isRelaxedSearch: boolean;
  requirementsCount?: number;
  isEditing?: boolean;
}

const RequirementsFooter = ({
  requirements,
  followUpQuestions,
  onFollowUpClick,
  onAddRequirement,
  onApprove,
  isSearching,
  analysisStage,
  searchExecuted,
  isRelaxedSearch,
  requirementsCount = 5, // Changed back to default of 5 but still allows for more if provided
  isEditing = true
}: RequirementsFooterProps) => {
  const hasRequirements = requirements.length > 0;
  const hasIncompleteRequirements = requirements.some(req => !req.description?.trim());
  const disableSearch = !hasRequirements || hasIncompleteRequirements || isSearching;

  // Debug log to verify requirements are being passed correctly
  console.log("Requirements in footer:", requirements);

  return (
    <div className="p-6 bg-gray-50 border-t border-gray-200">
      {followUpQuestions.length > 0 ? (
        <FollowUpQuestions 
          questions={followUpQuestions}
          onClick={onFollowUpClick}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {hasIncompleteRequirements && isEditing && (
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                Please complete all requirements before searching.
              </div>
            )}
            
            {!hasRequirements && (
              <div className="p-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-800 text-sm">
                Add at least one requirement to begin your search.
              </div>
            )}
          </div>
         
          <div>
            <SearchButtons 
              onAddRequirement={onAddRequirement}
              onApprove={onApprove}
              isSearching={isSearching}
              analysisStage={analysisStage}
              searchExecuted={searchExecuted}
              disableSearch={disableSearch}
              isRelaxedSearch={isRelaxedSearch}
              requirementsCount={requirementsCount}
              isEditing={isEditing}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RequirementsFooter;
