import React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoringResponse } from "@/lib/types";

interface ScoringResultsProps {
  scoringData: ScoringResponse | null;
  inputValue: string;
  handleScoringApproval: () => void;
}

const ScoringResults = ({ scoringData, inputValue, handleScoringApproval }: ScoringResultsProps) => {
  if (!scoringData) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <h3 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text">Lead Scoring Results</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-50 p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 font-medium">Relevance Score</div>
            <div className="text-3xl font-bold text-blue-500">{scoringData?.relevanceScore}/10</div>
          </div>
          <div className="bg-gray-50 p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 font-medium">Engagement Potential</div>
            <div className="text-3xl font-bold text-indigo-500">{scoringData?.engagementPotential}/10</div>
          </div>
          <div className="bg-gray-50 p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 font-medium">Conversion Likelihood</div>
            <div className="text-3xl font-bold text-purple-500">{scoringData?.conversionLikelihood}/10</div>
          </div>
          <div className="bg-gray-50 p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 font-medium">Overall Score</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text">{scoringData?.overallScore}/10</div>
          </div>
        </div>
        
        {scoringData?.criteria && scoringData.criteria.length > 0 && (
          <div className="mt-8 border border-gray-200 rounded-xl p-5 bg-gray-50">
            <h4 className="font-bold text-lg mb-3 text-black">Your Requirements</h4>
            <ol className="list-decimal pl-5 space-y-2">
              {scoringData.criteria.map((criterion, index) => {
                const criteriaCount = inputValue.split(',')
                  .map(item => item.trim())
                  .filter(item => item.length > 0).length;
                  
                const isAiSuggested = index >= criteriaCount;
                
                return (
                  <li key={index} className="text-gray-700">
                    {criterion.name} 
                    <span className="ml-2 text-sm text-gray-600 font-medium">(1/1)</span>
                    {isAiSuggested && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        AI Suggested
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        )}
        
        <div className="flex justify-end mt-8">
          <Button 
            onClick={handleScoringApproval}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 text-white rounded-full px-8 py-3 font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Check className="mr-2 h-5 w-5" />
            Approve Scoring
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScoringResults;
