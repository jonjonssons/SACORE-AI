import React from 'react';
import RequirementItem from './RequirementItem';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface Requirement {
  id: string;
  description: string;
  score: number;
  isAiSuggested?: boolean;
  category?: string;
  placeholder?: string;
}

interface RequirementsListProps {
  requirements: Requirement[];
  onEdit: (id: string, value: string) => void;
  onDelete: (id: string) => void;
  isEditing?: boolean;
  renderHeader?: (req: Requirement) => React.ReactNode;
  onAddRequirement?: (category: string) => void;
}

const RequirementsList = ({ 
  requirements, 
  onEdit, 
  onDelete,
  isEditing = true,
  renderHeader,
  onAddRequirement
}: RequirementsListProps) => {
  // Group requirements by category
  const groupedRequirements: Record<string, Requirement[]> = {};
  
  // Create groups of requirements
  requirements.forEach(req => {
    const category = req.category || 'Other';
    if (!groupedRequirements[category]) {
      groupedRequirements[category] = [];
    }
    groupedRequirements[category].push(req);
  });
  
  // Define the display order for categories
  const categoryOrder = ['Location', 'Titles', 'Industries', 'Skill', 'Other'];
  
  // Sort categories
  const sortedCategories = Object.keys(groupedRequirements).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  return (
    <div className="space-y-6">
      {sortedCategories.map((category) => (
        <div key={category} className="space-y-2">
          {/* Show category header once per group with score for Location, Titles, and Industries */}
          {renderHeader && category !== 'Other' && category !== 'Skill' && (
            <div className="flex justify-between items-center">
              <h4 className="text-md font-medium text-black">{category}</h4>
              
              {/* Visa poäng för Location, Titles och Industries */}
              {(category === 'Location' || category === 'Titles' || category === 'Industries') && 
                groupedRequirements[category].length > 0 && (
                <div className="w-8 h-8 rounded-full bg-gray-100 text-black flex items-center justify-center text-sm font-bold">
                  1/1
                </div>
              )}
            </div>
          )}
          
          {/* Special handling for Titles - they share a single score */}
          {category === 'Titles' ? (
            <div className="space-y-2">
              {/* Render all titles without scores */}
              {groupedRequirements[category].map((req) => (
                <RequirementItem
                  key={req.id}
                  id={req.id}
                  description={req.description}
                  score={0}
                  isAiSuggested={req.isAiSuggested}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isEditing={isEditing}
                  hideScore={true}
                  placeholder={req.placeholder || "Enter title..."}
                />
              ))}
              
              {/* Add Title button */}
              {isEditing && onAddRequirement && (
                <Button 
                  variant="ghost" 
                  className="text-black hover:text-gray-800 hover:bg-gray-50 p-0 h-auto mt-2 text-xs"
                  onClick={() => onAddRequirement('Titles')}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Title
                </Button>
              )}
            </div>
          ) : category === 'Industries' ? (
            <div className="space-y-2">
              {/* Render all industries without scores */}
              {groupedRequirements[category].map((req) => (
                <RequirementItem
                  key={req.id}
                  id={req.id}
                  description={req.description}
                  score={0}
                  isAiSuggested={req.isAiSuggested}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isEditing={isEditing}
                  hideScore={true}
                  placeholder={req.placeholder || "Enter industry..."}
                />
              ))}
              
              {/* Add Industry button */}
              {isEditing && onAddRequirement && (
                <Button 
                  variant="ghost" 
                  className="text-black hover:text-gray-800 hover:bg-gray-50 p-0 h-auto mt-2 text-xs"
                  onClick={() => onAddRequirement('Industries')}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Industry
                </Button>
              )}
            </div>
          ) : category === 'Location' ? (
            /* Hantera Location - bara en plats, visa inte poäng */
            <div className="space-y-2">
              {groupedRequirements[category].map((req) => (
                <RequirementItem
                  key={req.id}
                  id={req.id}
                  description={req.description}
                  score={0}
                  isAiSuggested={req.isAiSuggested}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isEditing={isEditing}
                  hideScore={true}
                  placeholder={req.placeholder || "Enter location..."}
                />
              ))}
            </div>
          ) : category === 'Skill' ? (
            /* Hantera Skills - varje skill får egen header och poäng */
            <div className="space-y-4">
              {groupedRequirements[category].map((req, index) => (
                <div key={req.id} className="space-y-2">
                  {/* Visa rubrik och poäng för varje skill */}
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-medium text-black">Skill</h4>
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-black flex items-center justify-center text-sm font-bold">
                      1/1
                    </div>
                  </div>
                  <RequirementItem
                    id={req.id}
                    description={req.description}
                    score={1}
                    isAiSuggested={req.isAiSuggested}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isEditing={isEditing}
                    hideScore={true}
                    placeholder={req.placeholder || "Enter skill..."}
                  />
                </div>
              ))}
              
              {/* Add Skill button */}
              {isEditing && onAddRequirement && (
                <Button 
                  variant="ghost" 
                  className="text-black hover:text-gray-800 hover:bg-gray-50 p-0 h-auto mt-2 text-xs"
                  onClick={() => onAddRequirement('Skill')}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Skill
                </Button>
              )}
            </div>
          ) : (
            /* Regular rendering for other categories */
            <div>
              {groupedRequirements[category].map((req) => (
                <RequirementItem
                  key={req.id}
                  id={req.id}
                  description={req.description}
                  score={req.score}
                  isAiSuggested={req.isAiSuggested}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isEditing={isEditing}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RequirementsList;
