import React from 'react';
import { Cpu, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { 
  Tooltip,
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from './ui/tooltip';

interface AIExtractorStatusProps {
  status: 'idle' | 'processing' | 'completed' | 'error';
  profilesCount?: number;
  onReprocess?: () => void;
}

const AIExtractorStatus = ({ 
  status, 
  profilesCount = 0,
  onReprocess 
}: AIExtractorStatusProps) => {
  return (
    <TooltipProvider>
      <div className="flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-2 py-1 px-3 rounded-full bg-opacity-20 text-sm">
              {status === 'idle' && (
                <>
                  <Cpu className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-400">AI Ready</span>
                </>
              )}
              
              {status === 'processing' && (
                <>
                  <Cpu className="h-4 w-4 text-blue-400 animate-pulse" />
                  <span className="text-blue-400">Processing...</span>
                </>
              )}
              
              {status === 'completed' && (
                <>
                  <Check className="h-4 w-4 text-green-400" />
                  <span className="text-green-400">
                    {profilesCount} Profiles Extracted
                  </span>
                </>
              )}
              
              {status === 'error' && (
                <>
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <span className="text-red-400">Extraction Error</span>
                  {onReprocess && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={onReprocess}
                      className="ml-2 h-6 text-xs"
                    >
                      Retry
                    </Button>
                  )}
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {status === 'idle' && "AI extraction available for this search"}
            {status === 'processing' && "AI is extracting profile data..."}
            {status === 'completed' && `Successfully extracted ${profilesCount} profiles with AI`}
            {status === 'error' && "Failed to extract profiles with AI, using fallback methods"}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default AIExtractorStatus;
