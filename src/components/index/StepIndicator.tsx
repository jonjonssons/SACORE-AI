import React from "react";

// Use the same type definition as in Index.tsx
type StepType = "input" | "scoring" | "search" | "linkedin";

interface StepIndicatorProps {
  currentStep: StepType;
}

const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  return (
    <div className="p-4 border-t bg-gray-50 border-gray-200">
      <div className="text-center text-sm text-gray-600 font-medium">
        {currentStep === "input" ? "Enter your criteria to begin scoring" : 
         currentStep === "scoring" ? "Review and approve your scoring" : 
         currentStep === "search" ? "Search for matching results" :
         "Connect to LinkedIn to find matching leads"}
      </div>
    </div>
  );
};

export default StepIndicator;
