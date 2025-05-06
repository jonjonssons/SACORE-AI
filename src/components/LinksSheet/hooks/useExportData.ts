
import { LinkRow } from "../types";
import { toast } from "@/hooks/use-toast";

export const useExportData = () => {
  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied",
      description: "Link has been copied to clipboard",
    });
  };

  const downloadCSV = (linkRows: LinkRow[]) => {
    try {
      const headers = ['Name', 'Profile URL'];
      
      const csvRows = [
        headers.join(','),
        ...linkRows.map(row => {
          return [
            `"${row.name || ''}"`,
            `"${row.url.replace(/"/g, '""')}"`
          ].join(',');
        })
      ];
      
      const csvContent = csvRows.join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `linkedin-profiles-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "CSV Downloaded",
        description: `Exported ${linkRows.length} profile URLs to CSV file.`,
      });
    } catch (error) {
      console.error("Error creating CSV:", error);
      toast({
        title: "Export Failed",
        description: "There was an error creating the CSV file.",
        variant: "destructive"
      });
    }
  };

  return {
    copyLink,
    downloadCSV
  };
};
