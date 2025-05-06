
export interface LinkRow {
  id: string;
  url: string;
  name?: string;
}

export interface SearchResult {
  title?: string;
  link?: string;
  snippet?: string;
}

export interface LinksSheetProps {
  links: string[];
  searchResults?: SearchResult[];
  isLoading?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const STORAGE_KEYS = [
  'googleSearchLinks',
  'linkedInSearchLinks',
  'searchResultLinks'
];
