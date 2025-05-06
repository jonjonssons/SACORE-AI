
interface Window {
  google: {
    search: {
      CustomSearchControl: new (engineId: string) => GoogleCustomSearchControl;
      cse?: {
        element?: {
          getElement: (id: string) => {
            execute: (query: string) => void;
          };
        };
      };
    };
  };
}

interface GoogleCustomSearchControl {
  execute: (query: string) => void;
  setSearchStartingCallback?: (obj: any, callback: () => void) => void;
  setSearchCompleteCallback?: (obj: any, callback: (results: GoogleCustomSearchResultCollection) => void) => void;
}

interface GoogleCustomSearchResultItem {
  kind?: string;
  title?: string;
  htmlTitle?: string;
  link?: string;
  displayLink?: string;
  snippet?: string;
  htmlSnippet?: string;
  cacheId?: string;
  formattedUrl?: string;
  htmlFormattedUrl?: string;
  pagemap?: Record<string, any>;
  [key: string]: any;
}

interface GoogleCustomSearchResultCollection {
  kind?: string;
  url?: {
    type: string;
    template: string;
  };
  queries?: {
    request?: Array<{
      totalResults: string;
      searchTerms: string;
      count: number;
      startIndex: number;
      inputEncoding: string;
      outputEncoding: string;
      safe: string;
      cx: string;
    }>;
    nextPage?: Array<any>;
  };
  context?: {
    title: string;
  };
  searchInformation?: {
    searchTime: number;
    formattedSearchTime: string;
    totalResults: string;
    formattedTotalResults: string;
  };
  items?: GoogleCustomSearchResultItem[];
  cursor?: {
    currentPageIndex?: number;
    estimatedResultCount?: number;
  };
  results?: GoogleCustomSearchResultItem[];
}
