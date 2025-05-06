// Company name utilities
import { separateProfileComponents } from "@/utils/profileExtractors/separateProfileComponents";

// Verified company list shared between functions
const verifiedCompanies: string[] = [
  'Microsoft', 'Google', 'Amazon', 'Apple', 'Facebook', 'Meta', 'IBM', 'Oracle', 
  'Spotify', 'Klarna', 'Ericsson', 'Volvo', 'IKEA', 'Northvolt', 'H&M', 
  'SAP', 'Salesforce', 'Adobe', 'Autodesk', 'Cisco', 'Dell', 'HP', 'Intel', 
  'AMD', 'NVIDIA', 'Tesla', 'Uber', 'Lyft', 'Airbnb', 'Twitter', 'LinkedIn', 
  'Slack', 'Zoom', 'Shopify', 'Squarespace', 'Wix', 'Atlassian', 'Jira', 
  'GitHub', 'GitLab', 'BitBucket', 'MongoDB', 'MySQL', 'PostgreSQL', 'Redis', 
  'Elastic', 'Confluent', 'Databricks', 'Snowflake', 'Looker', 'Tableau', 'Power BI',
  'SAS', 'SPSS', 'RStudio', 'Anaconda', 'Jupyter', 'Docker', 'Kubernetes', 
  'VMware', 'Citrix', 'Red Hat', 'SUSE', 'Ubuntu', 'Canonical', 'CentOS', 
  'Fedora', 'Debian', 'Alpine', 'Arch', 'Gentoo', 'FreeBSD', 'OpenBSD', 
  'NetBSD', 'Solaris', 'AIX', 'HPUX', 'z/OS', 'AS/400', 'Windows', 'macOS', 
  'iOS', 'Android', 'Chrome OS', 'Firefox OS', 'Ubuntu Touch', 'Tizen', 
  'WebOS', 'Amazon Fire OS', 'Roku OS', 'tvOS', 'watchOS', 'Wear OS', 
  'HarmonyOS', 'EMUI', 'MIUI', 'One UI', 'OxygenOS', 'ColorOS', 'Huawei', 
  'Xiaomi', 'Samsung', 'Sony', 'LG', 'Motorola', 'Nokia', 'HTC', 'OnePlus', 
  'Oppo', 'Vivo', 'Realme', 'ASUS', 'Acer', 'Lenovo', 'ThinkPad', 'Dell XPS', 
  'HP Envy', 'Microsoft Surface', 'MacBook', 'iMac', 'Mac mini', 'Mac Pro', 
  'iPad', 'iPhone', 'Apple Watch', 'AirPods', 'Galaxy S', 'Galaxy Note', 
  'Galaxy Tab', 'Galaxy Watch', 'Galaxy Buds', 'Pixel', 'Pixel Buds', 
  'Nexus', 'Chromecast', 'Apple TV', 'Fire TV', 'Roku', 'Shield TV', 
  'Xbox', 'PlayStation', 'Nintendo', 'Steam', 'Epic Games', 'Ubisoft', 
  'EA', 'Activision Blizzard', 'Riot Games', 'Valve', 'BioWare', 'Bethesda', 
  'Rockstar Games', 'CD Projekt Red', 'Square Enix', 'Capcom', 'Konami', 
  'SEGA', 'Bandai Namco', 'Nintendo', 'Sony', 'Microsoft', 'TSMC', 'ARM', 
  'Qualcomm', 'Broadcom', 'MediaTek', 'Foxconn', 'LG Display', 'Samsung Display', 
  'BOE', 'AU Optronics', 'Sharp', 'Panasonic', 'Toshiba', 'Hitachi', 'Fujitsu',
  'Sinch', 'Verified Global'
];

export const cleanupCompanyName = (company: string): string => {
  if (!company) return '';
  
  // Ta bort alla parenteser och deras innehåll
  let cleaned = company
    .replace(/\([^)]*\)/g, '')   // Ta bort (innehåll)
    .replace(/\[[^\]]*\]/g, '')  // Ta bort [innehåll]
    .replace(/\{[^}]*\}/g, '')   // Ta bort {innehåll}
    .replace(/\s+/g, ' ')        // Ersätt flera mellanslag med ett
    .replace(/\./g, '')          // Ta bort punkter
    .replace(/,\s*$/, '')        // Ta bort kommatecken i slutet
    .trim();
  
  // Kontrollera om det är för kort efter rensning
  if (cleaned.length <= 2) return '';
  
  // Filter out generic market descriptions
  const marketDescriptions = [
    'international markets',
    'global markets',
    'domestic markets',
    'european markets',
    'nordic markets',
    'emerging markets',
    'financial markets',
    'capital markets',
    'global consumer markets',
    'international market',
    'enterprise market',
    'corporate market',
    'b2b market',
    'b2c market',
    'market',
    'markets',
    'market development',
    'market expansion',
    'market leader',
    'various markets',
    'select markets'
  ];
  
  // Check for exact match against market descriptions
  if (marketDescriptions.some(market => 
      cleaned.toLowerCase() === market ||
      cleaned.toLowerCase().includes(market))) {
    return '';
  }
  
  // Non-company technical terms
  const nonCompanyTerms = [
    'HTML', 'CSS', 'JavaScript', 'React', 'Angular', 'Vue', 'Node.js', 
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'GitHub',
    'Salesforce', 'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL',
    'Redis', 'Kafka', 'RabbitMQ', 'REST', 'GraphQL', 'API', 'JSON',
    'XML', 'YAML', 'TOML', 'NGINX', 'Apache', 'Linux', 'Unix', 'Windows',
    'macOS', 'iOS', 'Android', 'Python', 'Java', 'C++', 'C#', 'PHP',
    'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'TypeScript', 'Dart',
    'Flutter', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Matplotlib',
    'Scikit-learn', 'Jupyter', 'VS Code', 'IntelliJ', 'Eclipse', 'Xcode',
    'Android Studio', 'Photoshop', 'Illustrator', 'Figma', 'Sketch',
    'Adobe XD', 'Premiere Pro', 'After Effects', 'Blender', 'Unity',
    'Unreal Engine', 'Jira', 'Confluence', 'Trello', 'Asana', 'Notion',
    'Slack', 'Teams', 'Zoom', 'Meet', 'WebEx', 'Excel', 'Word', 'PowerPoint',
    'Outlook', 'SharePoint', 'OneDrive', 'Google Drive', 'Sheets', 'Docs',
    'Slides', 'Gmail', 'Analytics', 'Tag Manager', 'Search Console',
    'Ads', 'Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube',
    'TikTok', 'Pinterest', 'Snapchat', 'WhatsApp', 'Messenger',
    'Stripe', 'PayPal', 'Square', 'Shopify', 'Magento', 'WooCommerce',
    'WordPress', 'Drupal', 'Joomla', 'Webflow', 'Wix', 'Squarespace',
    'Bootstrap', 'Tailwind CSS', 'Material UI', 'Ant Design', 'jQuery',
    'Axios', 'Fetch', 'WebSocket', 'SSE', 'PWA', 'SPA', 'MPA', 'SSR',
    'CSR', 'SSG', 'ISR', 'JWT', 'OAuth', 'SAML', 'OpenID', 'LDAP',
    'Active Directory', 'SSL', 'TLS', 'HTTPS', 'HTTP', 'SMTP', 'IMAP',
    'POP3', 'FTP', 'SFTP', 'SSH', 'TCP', 'UDP', 'IP', 'DNS', 'CDN',
    'Load Balancer', 'Proxy', 'VPN', 'VPC', 'Subnet', 'CIDR', 'IPv4',
    'IPv6', 'BGP', 'OSPF', 'EIGRP', 'MPLS', 'VoIP', 'SIP', 'RTP',
    'WebRTC', 'SPA', 'SSR', 'JAMstack', 'MERN', 'MEAN', 'LAMP', 'LEMP',
    'DevOps', 'GitOps', 'MLOps', 'AIOps', 'ChatOps', 'NoOps', 'SRE',
    'CI/CD', 'IaC', 'Terraform', 'Ansible', 'Chef', 'Puppet', 'CloudFormation',
    'ARM Templates', 'Bicep', 'Pulumi', 'Helm', 'Prometheus', 'Grafana',
    'ELK', 'Splunk', 'Datadog', 'New Relic', 'AppDynamics', 'Dynatrace',
  ];
  
  // Kontrollera om det bara är en vanlig teknisk term
  for (const term of nonCompanyTerms) {
    if (cleaned.toUpperCase() === term || 
        cleaned.toLowerCase() === term.toLowerCase() ||
        cleaned === term) {
      return '';
    }
  }
  
  // Kontrollera om det innehåller beskrivningar av roller/processer
  if (/(?:sales|selling)\s+(?:via|through|by|to|in|at)\b/i.test(cleaned)) {
    // Extrahera företaget från början om det finns ett
    const match = cleaned.match(/^([A-Z][a-zA-Z0-9]+)\s+(?:sales|selling)/i);
    if (match) {
      cleaned = match[1].trim();
    } else {
      return '';
    }
  }
  
  // Filter out simple single words that aren't companies
  const singleWordNonCompanies = [
    'int', 'cash', 'global', 'as', 'same', 'nordics', 'research', 'partner', 'route', 
    'fredrik', 'an', 'the', 'weave', 'deel', 'mentor', 'spce', 'prenax', 'saas', 'sinch',
    'dry', 'cargo', 'shipbrokers', 'region', 'south', 'strategic', 'partners', 'efficy',
    'international', 'markets', 'market', 'worldwide', 'domestic', 'enterprise', 'corporate'
  ];
  
  // Om det är ett enskilt ord, kontrollera mot listan
  const words = cleaned.toLowerCase().split(/\s+/);
  if (words.length === 1 && singleWordNonCompanies.includes(words[0])) {
    return '';
  }

  // Patterns that clearly aren't company names
  const rejectPatterns = [
    // Time periods (e.g. "2019 - Present", "11 Months.")
    /^\d{1,4}\s*[-–]\s*(?:present|now|\d{4})$/i,
    /^\d+\s+months?\.?$/i,
    
    // Date formats
    /^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}/i,
    
    // Swedish locations with common format
    /^(?:stockholm|göteborg|malmö|uppsala|linköping),?\s+(?:area|region|län|municipality|kommun|county)$/i,
    
    // Educational institutions
    /^(?:stockholm|uppsala)\s+(?:university|school|college)/i,
    /^(?:university|school|college)\s+of/i,
    
    // Generic descriptions 
    /^(?:full-time|part-time|contractor|consultant|freelancer|internship|employment|experience)/i,
    
    // LinkedIn boilerplate text
    /^(?:profile|page|update|post|experience|education|certification|language|skill)s?$/i,
    
    // Common job titles (these are not companies)
    /^(?:ceo|cto|cfo|coo|vp|director|manager|consultant|specialist|engineer|developer|designer|analyst)$/i,
    
    // Experience phrases
    /(?:experience|managing|extensive|selling to|deliver|uncovering|driving|developing)/i,
    
    // Teams and departments 
    /(?:team|sales team|department|inside sales|emea sales|client acquisition)/i,
    
    // Industry descriptions without company context
    /(?:global (?:players|fashion)|various multinational players|media and fashion|fashion industries)/i,
    
    // Action phrases
    /(?:organized racks|algorithmic monitoring|enables|evaluate|outbound activities)/i,
    
    // Market descriptions
    /^(?:international|global|domestic|european|nordic)\s+markets?$/i,
    /^(?:emerging|financial|capital|consumer)\s+markets?$/i,
    /^market(?:\s+(?:development|expansion|leader))?$/i,
    /^markets$/i,
    /^.*\s+market(?:s|\s+development|\s+expansion|\s+leader)?$/i,
    /^various\s+markets$/i,
    /^select\s+markets$/i,
    
    // Specific non-company patterns from the examples
    /saas dry cargo/i,
    /dry cargo shipbrokers/i,
    /sales via strategic/i,
    /strategic partners/i,
    /region south/i,
    /efficy crm/i
  ];
  
  // Simple list of terms that should be filtered out
  const termsToFilter = [
    'linkedin', 
    'erfarenhet', 
    'over', 
    'managed',
    'business development manager',
    'account executive',
    'sales manager',
    'research skills',
    'new business',
    'our',
    'key accounts',
    'client portfolio',
    'money in the bank',
    'via strategic partners',
    'in region south',
    'efficy crm',
    'international markets',
    'international market',
    'global markets',
    'nordic markets',
    'european markets'
  ];
  
  // Check if it's just one of these terms
  if (termsToFilter.some(term => cleaned.toLowerCase().includes(term.toLowerCase())) || 
      rejectPatterns.some(pattern => pattern.test(cleaned))) {
    return '';
  }
  
  // Special check for entries ending with a preposition or similar word
  if (/\s(?:and|of|in|via|to|as|that|the)$/i.test(cleaned)) {
    return '';
  }
  
  // Kolla om företaget finns i vår verifierade lista
  const exactMatch = verifiedCompanies.find(
    verified => verified.toLowerCase() === cleaned.toLowerCase()
  );
  
  if (exactMatch) {
    return exactMatch; // Returnera det verifierade företagsnamnet med korrekt skrivning
  }
  
  // Known company name mapping
  const companyMapping: Record<string, string> = {
    'Microsoft Sweden': 'Microsoft',
    'Google Sweden': 'Google',
    'Amazon Sweden': 'Amazon',
    'IBM Sweden': 'IBM',
    'Oracle Sweden': 'Oracle',
    'Oracle and': 'Oracle',
    'Amazon Web': 'Amazon Web Services',
    'Adobe': 'Adobe',
    'OpenText': 'OpenText',
    'Canon EMEA': 'Canon',
    'Ignyto: Platinum Salesforce': 'Ignyto',
    'Commvault': 'Commvault',
    'Bentley Systems': 'Bentley Systems',
    'Multisoft AB': 'Multisoft',
    'Madison Square Garden Sports Corp': 'Madison Square Garden Sports',
    'Verified Global AB': 'Verified Global',
  };
  
  // Check for known company mappings
  if (companyMapping[cleaned]) {
    return companyMapping[cleaned];
  }
  
  // Final cleanup
  cleaned = cleaned
    .replace(/\s+ltd\.?$/i, '') // Remove Ltd.
    .replace(/\s+limited$/i, '') // Remove Limited
    .replace(/\s+inc\.?$/i, '') // Remove Inc.
    .replace(/\s+llc$/i, '') // Remove LLC
    .replace(/\s+ab$/i, '') // Remove AB (Aktiebolag)
    .replace(/\s+b\.?v\.?$/i, '') // Remove B.V.
    .replace(/\s+gmbh$/i, '') // Remove GmbH
    .replace(/\s+s\.?p\.?a\.?$/i, '') // Remove S.p.A.
    .replace(/\s+a\.?g\.?$/i, '') // Remove A.G.
    .replace(/\s+s\.?a\.?$/i, '') // Remove S.A.
    .replace(/\s+corp\.?$/i, '') // Remove Corp.
    .replace(/\s+corporation$/i, '') // Remove Corporation
    .replace(/\s+group$/i, '') // Remove Group
    .trim();
  
  return cleaned;
};

// Funktion för att extrahera företag från sökresultat med verifiering
export const extractCompanyName = (searchItem: any): string => {
  if (!searchItem) return '';
  
  // Samla potentiella företagsnamn från olika källor
  const potentialCompanies: string[] = [];
  
  // 1. Försök 1: Extrahera från titel (vanligaste formatet)
  if (searchItem.title) {
    // LinkedIn-titlar följer olika format - försöker hitta alla mönster
    // Format 1: "Namn | Titel | Företag"
    // Format 2: "Titel på Företag"
    // Format 3: "Namn - Titel - Företag"
    
    // Först plocka bort "| LinkedIn" eller "- LinkedIn" i slutet
    const cleanTitle = searchItem.title
      .replace(/\s*[|\-–]\s*LinkedIn\s*$/, '')
      .replace(/\s+LinkedIn\s*$/, '')
      .trim();
    
    // Testa olika separatorer för format 1 och 3
    const separators = ["|", "-", "–", "—"];
    
    for (const separator of separators) {
      const parts = cleanTitle.split(new RegExp(`\\s*${separator}\\s*`));
      
      if (parts.length === 3) {
        // Typiskt format: "Namn | Titel | Företag"
        potentialCompanies.push(parts[2].trim());
      } else if (parts.length === 2) {
        // Kan vara "Titel | Företag" eller "Namn | Titel"
        potentialCompanies.push(parts[1].trim());
      }
    }
    
    // Testa format 2: "Titel på/at/hos Företag"
    const prepositions = ['at', 'på', 'hos', 'with', 'för', 'i', 'in', 'from'];
    for (const prep of prepositions) {
      const pattern = new RegExp(`\\b${prep}\\s+([A-Z][A-Za-z0-9\\s&\\.,']+)$`, 'i');
      const match = cleanTitle.match(pattern);
      if (match && match[1]) {
        potentialCompanies.push(match[1].trim());
      }
    }
  }
  
  // 2. Försök 2: Extrahera direkt från LinkedIn-snippets
  if (searchItem.snippet) {
    // Använd separateProfileComponents
    const components = separateProfileComponents(searchItem.snippet);
    if (components && components.company) {
      potentialCompanies.push(components.company);
    }
    
    // Hitta företag efter prepositioner
    const companyPatterns = [
      /(?:at|with|for|@)\s+([A-Z][A-Za-z0-9\s&\.,]+?)(?:[\s\.,]|$)/i,
      /(?:arbetar på|jobbar på|anställd på|konsult på|konsult hos)\s+([A-Z][A-Za-z0-9\s&\.,]+?)(?:[\s\.,]|$)/i,
      /(?:works at|employed at|employed by|consultant at|consultant for)\s+([A-Z][A-Za-z0-9\s&\.,]+?)(?:[\s\.,]|$)/i,
      // Nya mönster för att fånga företag i snippets
      /(?:joined|working at|based at|located at)\s+([A-Z][A-Za-z0-9\s&\.,]+?)(?:[\s\.,]|$)/i,
      /([A-Z][A-Za-z0-9\s&\.,]+?)\s+(?:employee|company|organization|firm)/i,
      // Ytterligare mönster för att fånga företag
      /current(?:\s+position)?(?:\s+at)?\s+([A-Z][A-Za-z0-9\s&\.,]+?)(?:[\s\.,]|$)/i,
      /(?:founded|co-founded|started|established)\s+([A-Z][A-Za-z0-9\s&\.,]+?)(?:[\s\.,]|$)/i,
      /experience\s+(?:at|with|in)\s+([A-Z][A-Za-z0-9\s&\.,]+?)(?:[\s\.,]|$)/i,
      /(?:ceo|cto|coo|cfo|founder|co-founder|director|vp|head|lead)\s+(?:at|of|for)\s+([A-Z][A-Za-z0-9\s&\.,]+?)(?:[\s\.,]|$)/i,
      /([A-Z][A-Za-z0-9\s&\.,]+?)\s+(?:saas|software|platform|solution|product)/i
    ];
    
    for (const pattern of companyPatterns) {
      const match = searchItem.snippet.match(pattern);
      if (match && match[1]) {
        const potentialCompany = match[1].trim();
        if (potentialCompany.length > 1 && !/^(the|my|our|their|his|her|its)/i.test(potentialCompany)) {
          potentialCompanies.push(potentialCompany);
        }
      }
    }
    
    // Sök efter företag i början av snippet (vanligt på LinkedIn)
    const startMatch = searchItem.snippet.match(/^([A-Z][A-Za-z0-9\s&\.,]+?)(?:[\s\.,]|$)/);
    if (startMatch && startMatch[1] && startMatch[1].length > 3) {
      potentialCompanies.push(startMatch[1].trim());
    }
    
    // Sök efter företag med domän
    const domainMatch = searchItem.snippet.match(/([A-Za-z0-9][A-Za-z0-9-]+\.[A-Za-z]{2,})/);
    if (domainMatch && domainMatch[1]) {
      const domain = domainMatch[1].trim();
      // Extract company name from domain (remove TLD)
      const domainParts = domain.split('.');
      if (domainParts.length >= 2 && domainParts[0] !== 'www') {
        potentialCompanies.push(domainParts[0]);
      }
    }
  }
  
  // Check link for company domain
  if (searchItem.link) {
    const urlMatch = searchItem.link.match(/https?:\/\/(?:www\.)?([^.]+)\.[^/]+\//);
    if (urlMatch && urlMatch[1] && urlMatch[1] !== 'linkedin') {
      const domainName = urlMatch[1].charAt(0).toUpperCase() + urlMatch[1].slice(1);
      potentialCompanies.push(domainName);
    }
  }
  
  // Ta bort dubbletter och hantera unika företagsnamn
  const uniqueCompanies = [...new Set(potentialCompanies)];
  
  // Testa direkt mot vår lista med verifierade företag först
  for (const company of uniqueCompanies) {
    const exactMatch = verifiedCompanies.find(
      (verified: string) => verified.toLowerCase() === company.toLowerCase()
    );
    
    if (exactMatch) {
      return exactMatch; // Direkt träff mot verifierad lista
    }
  }
  
  // Rensa och verifiera varje potentiellt företagsnamn
  for (const company of uniqueCompanies) {
    const result = cleanupCompanyName(company);
    if (result) return result;
  }
  
  // För companies som inte matchats, gör ett sista försök med mindre restriktiv verifiering
  for (const company of uniqueCompanies) {
    // Ta bort icke-alfanumeriska tecken och kontrollera
    const cleanedCompany = company.replace(/[^\w\s]/g, '').trim();
    
    // Kolla om det är en del av ett verifierat företagsnamn
    for (const verified of verifiedCompanies) {
      if (verified.toLowerCase().includes(cleanedCompany.toLowerCase()) && 
          cleanedCompany.length > 3) {
        return verified;
      }
    }
    
    // Kolla företagsindikatorer för normala företagsnamn
    const companyIndicators = [
      /\b(?:technologies|technology|tech|software|solutions)\b/i,
      /\b(?:consulting|services|agency|corporation|group)\b/i,
      /\b(?:ab|inc|ltd|llc|gmbh|co|company|limited)\b/i,
      /\b(?:partners|associates|international|global|systems)\b/i,
      /\b(?:enterprises|industries|network|digital|media)\b/i,
      /\b(?:cloud|platform|saas|analytics|ai|intelligence)\b/i,
      /\b(?:labs|studio|studios|works|games|interactive)\b/i
    ];
    
    if (cleanedCompany.length > 3 && 
        companyIndicators.some(indicator => indicator.test(cleanedCompany)) &&
        !/\s(?:and|of|in|via|to|as|that|the|by|for|with|at)\s/i.test(cleanedCompany)) {
      return cleanedCompany;
    }
  }
  
  // If all else fails and we have a reasonably long potential company name, return it
  const bestMatch = uniqueCompanies.find(company => company.length > 3 && /[A-Z]/.test(company));
  if (bestMatch) {
    return bestMatch;
  }
  
  return '';
};

// Additional utility functions can be added here in the future 