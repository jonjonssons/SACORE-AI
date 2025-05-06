
export interface ExtractedProfile {
  name: string;
  title: string;
  company: string;
  url: string;
  location?: string;
  confidence?: number;
}

export interface SearchResultItem {
  title?: string;
  snippet?: string;
  link?: string;
}

export interface ProcessingOptions {
  batchSize?: number;
  timeout?: number;
  language?: string;
}
