import React from "react";

// Use the same type definition as in Index.tsx
type StepType = "input" | "scoring" | "search" | "linkedin";

interface AppHeaderProps {
  currentStep: StepType;
}

const AppHeader = ({ currentStep }: AppHeaderProps) => {
  return (
    <div className="text-center py-10">
      <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-transparent bg-clip-text">
        Linkedscore
      </h1>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto mt-3 font-medium">
        Find and score high-quality leads with artificial intelligence
      </p>
    </div>
  );
};

export default AppHeader;
