
import { convertToProfileLink } from './convertToProfileLink';

interface SearchResult {
  title?: string;
  snippet?: string;
  link?: string;
}

interface Profile {
  id: string;
  url: string;
  name: string;
  title: string;
  company: string;
  score: number;
  notes?: string;
}

export const createProfileFromSearchResult = (
  result: SearchResult,
  index: number,
  url: string
): Profile => {
  return {
    id: `profile-${index}`,
    url: convertToProfileLink(url),
    name: `Profile ${index + 1}`,
    title: "",
    company: "",
    score: Math.max(60, 100 - (index % 40)),
    notes: result.snippet || ""
  };
};

export default createProfileFromSearchResult;
