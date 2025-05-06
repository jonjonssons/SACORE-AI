import React, { useState, useEffect } from 'react';

interface SearchProgressOverlayProps {
  analysisStage: "idle" | "searching" | "analyzing" | "complete" | "error";
  isRelaxedSearch: boolean;
  visible?: boolean;
  searchTriggered: boolean;
  currentQuery?: number;
  totalQueries?: number;
  currentPage?: number;
}

const SearchProgressOverlay = ({ 
  analysisStage, 
  isRelaxedSearch,
  visible = false,
  searchTriggered,
  currentQuery = 0,
  totalQueries = 1,
  currentPage = 0
}: SearchProgressOverlayProps) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState(0);
  
  // Set target progress based on analysis stage
  useEffect(() => {
    if (!visible || !searchTriggered) return;
    
    if (analysisStage === 'idle') {
      setTargetProgress(0);
    } else if (analysisStage === 'searching') {
      // Start at 5% immediately when searching begins
      if (targetProgress === 0) {
        setDisplayProgress(5);
      }
      
      // Calculate target based on query progress 
      // Searching phase goes from 5% to 60%
      if (totalQueries > 0) {
        const queryProgress = Math.min(currentQuery / totalQueries, 1);
        const calculatedTarget = 5 + (queryProgress * 55); // 5% to 60%
        setTargetProgress(Math.max(calculatedTarget, targetProgress));
      } else {
        // If we don't have query data, use a default
        setTargetProgress(Math.max(30, targetProgress));
      }
    } else if (analysisStage === 'analyzing') {
      // Analyzing phase goes from 60% to 95%
      setTargetProgress(Math.max(75, targetProgress));
    } else if (analysisStage === 'complete') {
      // Complete phase is always 100%
      setTargetProgress(100);
    }
  }, [analysisStage, visible, searchTriggered, currentQuery, totalQueries, targetProgress]);
  
  // Animate progress continuously
  useEffect(() => {
    if (!visible || !searchTriggered) return;
    
    // Always increment even without target changes, but faster when target is higher
    const interval = setInterval(() => {
      setDisplayProgress(current => {
        if (current >= 100) {
          clearInterval(interval);
          return 100;
        }
        
        // If we're at or past the target, increment slowly
        if (current >= targetProgress) {
          return current + 0.2;
        }
        
        // Otherwise, catch up to target more quickly
        const gap = targetProgress - current;
        const increment = Math.max(0.3, Math.min(1, gap / 10));
        return current + increment;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [visible, searchTriggered, targetProgress]);
  
  // Reset progress when search starts
  useEffect(() => {
    if (searchTriggered && visible && analysisStage === 'searching' && targetProgress === 0) {
      setDisplayProgress(0);
    }
  }, [searchTriggered, visible, analysisStage, targetProgress]);
  
  // Don't render if not visible or not triggered or on error
  if (!visible || !searchTriggered || analysisStage === 'error') {
    return null;
  }
  
  // Only show integer part of progress
  const displayedValue = Math.floor(displayProgress);

  return (
    <div className="fixed inset-0 bg-black/20 flex flex-col items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 shadow-lg max-w-xs w-full text-center">
        <div className="flex justify-center">
          <div className="text-4xl font-bold text-black">{displayedValue}%</div>
        </div>
      </div>
    </div>
  );
};

export default SearchProgressOverlay;
