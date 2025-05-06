
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SheetFiltersProps {
  filters: {
    score: string;
    location: string;
    company: string;
    title: string;
  };
  onFilterChange: (key: string, value: string) => void;
}

const SheetFilters: React.FC<SheetFiltersProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="space-y-4 p-4 bg-[#1A1F2C] rounded-lg border border-gray-800">
      <h3 className="font-semibold text-white mb-4">Filter Results</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="score-filter">Score</Label>
          <Select
            value={filters.score}
            onValueChange={(value) => onFilterChange("score", value)}
          >
            <SelectTrigger id="score-filter" className="bg-[#212636] border-gray-700">
              <SelectValue placeholder="Select score..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Scores</SelectItem>
              <SelectItem value="high">High (8-10)</SelectItem>
              <SelectItem value="medium">Medium (5-7)</SelectItem>
              <SelectItem value="low">Low (1-4)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location-filter">Location</Label>
          <Input
            id="location-filter"
            placeholder="Filter by location..."
            value={filters.location}
            onChange={(e) => onFilterChange("location", e.target.value)}
            className="bg-[#212636] border-gray-700"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company-filter">Company</Label>
          <Input
            id="company-filter"
            placeholder="Filter by company..."
            value={filters.company}
            onChange={(e) => onFilterChange("company", e.target.value)}
            className="bg-[#212636] border-gray-700"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title-filter">Title</Label>
          <Input
            id="title-filter"
            placeholder="Filter by title..."
            value={filters.title}
            onChange={(e) => onFilterChange("title", e.target.value)}
            className="bg-[#212636] border-gray-700"
          />
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        Tip: Combine filters to narrow down results
      </div>
    </div>
  );
};

export default SheetFilters;
