
import React from 'react';
import { Button } from '@/components/ui/button';

interface FollowUpQuestionsProps {
  questions: string[];
  onClick: (question: string) => void;
}

const FollowUpQuestions = ({ questions, onClick }: FollowUpQuestionsProps) => {
  if (!questions.length) return null;
  
  return (
    <div className="text-right">
      <p className="text-sm font-medium text-gray-300 mb-2">Please answer one of these questions:</p>
      <div className="space-y-2">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onClick(question)}
            className="block w-full text-left px-3 py-2 rounded-lg bg-[#212636] hover:bg-[#262D42] text-gray-300 text-sm transition-colors"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FollowUpQuestions;
