
import React from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

// Function to convert any LinkedIn link to a profile link format
const convertToProfileLink = (link: string): string => {
  try {
    // If it's already a profile link, return it as is
    if (link.includes('linkedin.com/in/')) {
      return link;
    }
    
    // Extract the username if it's a post link
    if (link.includes('linkedin.com/posts/')) {
      const parts = link.split('linkedin.com/posts/');
      if (parts.length > 1) {
        const username = parts[1].split('_')[0]; // Get username part before first underscore
        if (username) {
          return `https://www.linkedin.com/in/${username}`;
        }
      }
    }
    
    // For pulse articles, try to extract the author's name
    if (link.includes('linkedin.com/pulse/')) {
      const parts = link.split('linkedin.com/pulse/');
      if (parts.length > 1) {
        const lastSegment = parts[1].split('-').pop(); // Get the last segment which is often the author name
        if (lastSegment && !lastSegment.includes('?') && lastSegment.length > 2) {
          return `https://www.linkedin.com/in/${lastSegment}`;
        }
      }
    }
    
    // If we can't convert it to a proper profile link, return original
    return link;
  } catch (error) {
    console.error("Error converting link:", error);
    return link;
  }
};

export const RawLinkList = ({ links }: { links: string[] }) => {
  console.log("RawLinkList rendering with links:", links?.length || 0);
  
  const handleCopy = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied",
      description: "Link has been copied to clipboard"
    });
  };

  // Convert all links to profile format
  const profileLinks = links ? links.map(convertToProfileLink) : [];

  return (
    <div className="p-4 bg-[#1A1F2C] border border-[#2A2F3C] rounded-lg space-y-3">
      <h3 className="text-lg font-medium text-white mb-4">Found Links ({profileLinks.length || 0})</h3>
      
      {!profileLinks || profileLinks.length === 0 ? (
        <div className="text-gray-400 py-8 text-center">No links found. Try different search terms.</div>
      ) : (
        profileLinks.map((link, index) => (
          <div key={index} className="flex items-start justify-between p-3 bg-[#232733] border border-[#2A2F3C] rounded-lg group hover:bg-[#2A303F] transition-colors">
            <a 
              href={link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-400 hover:text-blue-300 flex items-center break-all mr-2"
            >
              <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
              {link}
            </a>
            <Button 
              variant="ghost" 
              size="sm" 
              className="opacity-0 group-hover:opacity-100 transition-opacity" 
              onClick={() => handleCopy(link)}
            >
              <Copy className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        ))
      )}
    </div>
  );
};

export default RawLinkList;
