
import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Loader2, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface Lead {
  name: string;
  title: string;
  company: string;
  industry: string;
  location: string;
  scoring: number;
}

interface LeadsResultsTableProps {
  leads: Lead[];
  isLoading: boolean;
}

const LeadsResultsTable = ({ leads, isLoading }: LeadsResultsTableProps) => {
  const [visibleLeads, setVisibleLeads] = useState<Lead[]>([]);
  const [sortField, setSortField] = useState<keyof Lead>('scoring');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [initialBatchProcessed, setInitialBatchProcessed] = useState(false);
  
  // Effect to animate leads appearing one by one with a batch limit
  useEffect(() => {
    // Clear visible leads when new data comes in
    setVisibleLeads([]);
    setInitialBatchProcessed(false);
    
    if (leads.length === 0) return;
    
    const sortedLeads = [...leads].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      
      return sortDirection === 'asc' 
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
    
    // Only process first 15 leads initially for immediate feedback
    const initialBatchSize = Math.min(15, sortedLeads.length);
    const initialBatch = sortedLeads.slice(0, initialBatchSize);
    
    // Display initial batch immediately with animation delay
    initialBatch.forEach((lead, index) => {
      setTimeout(() => {
        setVisibleLeads(prev => [...prev, lead]);
        console.log(`Lead added: ${lead.name} – ${lead.title} at ${lead.company}`);
        
        // Mark initial batch as processed when the last item is added
        if (index === initialBatchSize - 1) {
          setInitialBatchProcessed(true);
        }
      }, index * 300); // Faster animation for better UX
    });
    
    // After initial batch is displayed, process remaining leads if any
    if (sortedLeads.length > initialBatchSize) {
      const remainingLeads = sortedLeads.slice(initialBatchSize);
      
      setTimeout(() => {
        remainingLeads.forEach((lead, index) => {
          setTimeout(() => {
            setVisibleLeads(prev => [...prev, lead]);
            console.log(`Lead added: ${lead.name} – ${lead.title} at ${lead.company}`);
          }, index * 300);
        });
      }, initialBatchSize * 300 + 500); // Start after initial batch plus a pause
    }
  }, [leads, sortField, sortDirection]);

  const handleSort = (field: keyof Lead) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getScoringBadgeColor = (score: number) => {
    if (score >= 8) return "bg-green-600 text-white";
    if (score >= 6) return "bg-blue-600 text-white";
    if (score >= 4) return "bg-indigo-600 text-white";
    return "bg-gray-600 text-white";
  };

  // Ny funktion för att bestämma bakgrundsfärg baserat på scoring som representerar matchningar
  const getRowBackgroundColor = (score: number) => {
    // 🟢 Grön bakgrund = 3+ matchningar (scoring 7-10)
    if (score >= 7) return "bg-green-50 dark:bg-green-900/20";
    // 🟡 Gul = 2 matchningar (scoring 4-6)
    if (score >= 4) return "bg-yellow-50 dark:bg-yellow-900/20";
    // 🔴 Röd = 0-1 matchningar (scoring 1-3)
    return "bg-red-50 dark:bg-red-900/10";
  };

  const renderSortIcon = (field: keyof Lead) => {
    if (field !== sortField) return <Filter className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" /> 
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  if (isLoading) {
    return (
      <div className="bg-[#121212] rounded-xl border border-[#333333] p-8 w-full">
        <div className="flex flex-col items-center justify-center space-y-4 min-h-[300px]">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          <p className="text-[#E0E0E0] text-lg">Processing leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121212] rounded-xl border border-[#333333] w-full overflow-hidden">
      <div className="p-4 border-b border-[#333333] flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#E0E0E0]">LinkedScore Results</h2>
        <div className="text-sm text-gray-400">
          {visibleLeads.length} of {leads.length} leads displayed
          {leads.length > visibleLeads.length && !initialBatchProcessed && (
            <span className="ml-2 text-blue-400">(Loading more...)</span>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-[#1F1F1F]">
            <TableRow>
              <TableHead 
                className="text-[#E0E0E0] font-bold cursor-pointer hover:text-blue-400 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Name {renderSortIcon('name')}
                </div>
              </TableHead>
              <TableHead 
                className="text-[#E0E0E0] font-bold cursor-pointer hover:text-blue-400 transition-colors"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center">
                  Title {renderSortIcon('title')}
                </div>
              </TableHead>
              <TableHead 
                className="text-[#E0E0E0] font-bold cursor-pointer hover:text-blue-400 transition-colors"
                onClick={() => handleSort('company')}
              >
                <div className="flex items-center">
                  Company {renderSortIcon('company')}
                </div>
              </TableHead>
              <TableHead 
                className="text-[#E0E0E0] font-bold cursor-pointer hover:text-blue-400 transition-colors"
                onClick={() => handleSort('industry')}
              >
                <div className="flex items-center">
                  Industry {renderSortIcon('industry')}
                </div>
              </TableHead>
              <TableHead 
                className="text-[#E0E0E0] font-bold cursor-pointer hover:text-blue-400 transition-colors"
                onClick={() => handleSort('location')}
              >
                <div className="flex items-center">
                  Location {renderSortIcon('location')}
                </div>
              </TableHead>
              <TableHead 
                className="text-[#E0E0E0] font-bold cursor-pointer hover:text-blue-400 transition-colors"
                onClick={() => handleSort('scoring')}
              >
                <div className="flex items-center">
                  Matches {renderSortIcon('scoring')}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleLeads.map((lead, index) => (
              <TableRow 
                key={`${lead.name}-${index}`}
                className={`opacity-0 table-row-enter ${getRowBackgroundColor(lead.scoring)}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <TableCell className="font-medium text-[#E0E0E0]">{lead.name}</TableCell>
                <TableCell className="text-[#E0E0E0]">{lead.title}</TableCell>
                <TableCell className="text-blue-400">{lead.company}</TableCell>
                <TableCell className="text-[#E0E0E0]">{lead.industry}</TableCell>
                <TableCell className="text-[#E0E0E0]">{lead.location}</TableCell>
                <TableCell>
                  <Badge className={`${getScoringBadgeColor(lead.scoring)} score-badge-enter`}>
                    {Math.ceil(lead.scoring / 2.5)}/4
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            
            {visibleLeads.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                  No leads found. Try adjusting your search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="p-4 border-t border-[#333333] flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-600 mr-2"></div>
            <span className="text-sm text-gray-400">3+ matches</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-sm text-gray-400">2 matches</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
            <span className="text-sm text-gray-400">0-1 matches</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadsResultsTable;
