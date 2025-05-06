import React, { useState } from "react";
import { ArrowRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface StepInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  handleInputSubmit: () => void;
  isProcessing: boolean;
}

const StepInput = ({
  inputValue,
  setInputValue,
  files,
  setFiles,
  handleInputSubmit,
  isProcessing
}: StepInputProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto w-full">
      <div className="flex flex-col space-y-4">
        <Textarea
          placeholder="Paste your criteria here... (e.g. technology decision-makers at SaaS companies with 50-200 employees who've recently raised funding, 5 years in sales)"
          className="resize-none min-h-[180px] text-base focus-visible:ring-blue-500 rounded-lg border-gray-300 shadow-sm bg-white text-black"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <div className="text-sm text-gray-600 font-medium">
          Or upload a file with your criteria
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex items-center gap-2 border border-gray-300 rounded-full px-5 py-2.5 hover:bg-gray-50 transition-colors">
              <Upload size={18} className="text-blue-600" />
              <span className="font-medium text-gray-800">Upload File</span>
            </div>
          </label>
          {files.length > 0 && (
            <div className="text-sm text-blue-600 font-medium">
              {files.length} file(s) selected
            </div>
          )}
        </div>
      </div>
      <Button
        onClick={handleInputSubmit}
        disabled={(!inputValue && files.length === 0) || isProcessing}
        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 text-white rounded-full py-7 h-auto text-lg font-bold shadow-md hover:shadow-lg transition-all"
      >
        {isProcessing ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Scoring...
          </span>
        ) : (
          <>
            Generate Scoring
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>
    </div>
  );
};

export default StepInput;
