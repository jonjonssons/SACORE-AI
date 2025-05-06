import React, { useState, useEffect } from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface RequirementItemProps {
  id: string;
  description: string;
  score: number;
  isAiSuggested?: boolean;
  onEdit: (id: string, value: string) => void;
  onDelete: (id: string) => void;
  isEditing?: boolean; // Om komponenten globalt är i redigeringsläge
  hideScore?: boolean; // Om poängen ska döljas
  placeholder?: string; // Placeholder-text för input
}

const RequirementItem = ({ 
  id, 
  description, 
  score, 
  isAiSuggested, 
  onEdit, 
  onDelete,
  isEditing: globalEditing = true,
  hideScore = false,
  placeholder = "Enter requirement..."
}: RequirementItemProps) => {
  // Initialize editing state based on whether description is empty
  const [isItemEditing, setIsItemEditing] = useState(!description.trim());
  const [editValue, setEditValue] = useState(description);

  // Update editing state when description changes
  useEffect(() => {
    if (!description.trim()) {
      setIsItemEditing(true);
    }
  }, [description]);

  const handleSave = () => {
    if (!editValue.trim()) {
      onDelete(id);
      return;
    }
    
    onEdit(id, editValue);
    setIsItemEditing(false);
  };

  // Om globalEditing är false, tillåt inte redigering
  const canEdit = globalEditing;

  return (
    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
      <div className="flex-1">
        {isItemEditing && canEdit ? (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="bg-white border-gray-300 text-black"
            autoFocus
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setIsItemEditing(false);
            }}
            placeholder={placeholder}
          />
        ) : (
          <div className="flex items-center justify-between w-full">
            <p 
              className={`text-sm font-medium text-gray-800 flex items-center ${canEdit ? 'cursor-pointer hover:text-black' : ''} w-full`}
              onClick={() => canEdit && setIsItemEditing(true)}
            >
              {description}
              {isAiSuggested && (
                <span className="flex items-center ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Suggestion
                </span>
              )}
            </p>
          </div>
        )}
      </div>
      {!hideScore && (
      <div className="flex items-center ml-4">
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm font-bold">
          {score}/1
        </div>
      </div>
      )}
    </div>
  );
};

export default RequirementItem;
