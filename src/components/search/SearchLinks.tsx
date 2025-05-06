
import React from "react";
import RawLinkList from "@/components/RawLinkList";

interface SearchLinksProps {
  links: string[];
}

const SearchLinks: React.FC<SearchLinksProps> = ({ links }) => {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-white mb-4">Search Links</h2>
      <RawLinkList links={links} />
    </div>
  );
};

export default SearchLinks;
