import React, { useState, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

interface SearchBoxProps {
  onSearch: (query: string, files: File[]) => void;
  isSearching: boolean;
  onLinkedInClick?: () => void;
  onAdvancedSearchClick?: () => void;
}

const SearchBox = ({ 
  onSearch, 
  isSearching, 
  onLinkedInClick,
  onAdvancedSearchClick 
}: SearchBoxProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    if (!inputValue.trim() && uploadedFiles.length === 0) return;
    onSearch(inputValue, uploadedFiles);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFiles(Array.from(e.target.files));
      toast({
        title: "Files Uploaded",
        description: `${e.target.files.length} file(s) ready to analyze.`
      });
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleLinkedInClick = () => {
    if (onLinkedInClick) {
      onLinkedInClick();
    } else {
      toast({
        title: "LinkedIn URL",
        description: "LinkedIn URL analysis feature is coming soon."
      });
    }
  };

  const handleAdvancedSearchClick = () => {
    if (onAdvancedSearchClick) {
      onAdvancedSearchClick();
    } else {
      toast({
        title: "Advanced Search",
        description: "Advanced search feature is coming soon."
      });
    }
  };

  return (
    <div className={`relative w-full mx-auto transition-all duration-300 ${isSearchFocused ? 'scale-105' : ''}`} style={{ width: "13cm" }}>
      <div className={`search-box-border flex items-center bg-white border border-silver rounded-full overflow-hidden transition-all duration-300 ${isSearchFocused ? 'search-box-pulse' : ''}`} style={{ padding: "6px" }}>
        <div className="pl-4 pr-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <textarea
          ref={inputRef}
          className="w-full py-3 px-2 focus:outline-none text-base bg-transparent text-black resize-none h-24 overflow-y-auto"
          placeholder="Describe your Ideal Profile..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          onKeyDown={handleKeyDown}
        />
        <button
          className={`mr-2 p-2 rounded-full transition-all duration-300 ${
            inputValue || uploadedFiles.length > 0 ? 'bg-gradient-to-r from-black to-gray-700 text-white' : 'bg-gray-100 text-gray-400'
          }`}
          onClick={handleSearch}
          disabled={!inputValue && uploadedFiles.length === 0}
        >
          {isSearching ? (
            <div className="flex space-x-1 justify-center items-center w-5 h-5">
              <div className="w-1 h-1 rounded-full bg-white animate-bounce"></div>
              <div className="w-1 h-1 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-1 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          )}
        </button>
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        className="hidden" 
        multiple 
        accept=".pdf,.doc,.docx,.txt,.csv,.json"
      />
    </div>
  );
};

export default SearchBox;
