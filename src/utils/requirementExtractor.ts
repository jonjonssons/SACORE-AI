/**
 * Utility to automatically extract and categorize requirements from input text
 */

// Patterns to identify different requirement types
const locationPatterns = [
  /\b(?:located? in|location|city|country|region|area|based in)\b.*?\b([A-Za-z\s,]+(?:\d+)?)\b/i,
  /\b([A-Za-z]+(?:, [A-Za-z]+)?)\s+(?:area|region|based)\b/i,
  /\b(?:from|in) ([A-Za-z]+(?:, [A-Za-z]+)?)\b/i,
  // Common cities and countries directly
  /\b(Stockholm|Gothenburg|Malmö|Göteborg|Malmö|Sweden|Norge|Norway|Denmark|Danmark|Finland|Berlin|London|Paris|New York|San Francisco|Silicon Valley)\b/i,
  /\b(USA|US|United States|UK|United Kingdom|Germany|Deutschland|France|Spain|España|Italy|Italia|Netherlands|Nederland)\b/i,
  /\b(Amsterdam|Brussels|Bruxelles|Dublin|Madrid|Rome|Roma|Vienna|Wien|Zurich|Zürich|Copenhagen|København)\b/i
];

const titlePatterns = [
  /\b(?:title|position|role|job)(?: as| of| is)? (?:a |an )?([A-Za-z\s&]+)\b/i,
  /\b(?:looking for|need|want)(?: a| an)? ([A-Za-z\s&]+?)(?: with| who| that)/i,
  /\b([A-Za-z\s&]+? (?:manager|director|executive|lead|specialist|engineer|developer|consultant|analyst|designer|coordinator|administrator|technician|assistant|architect|strategist))\b/i,
  /\b(?:senior|junior|principal|chief|head|lead|associate)? ?([A-Za-z\s&]+? (?:manager|director|executive|lead|specialist|engineer|developer|consultant|analyst|designer|coordinator|administrator|technician|assistant|architect|strategist))\b/i,
  // Common job titles directly
  /\b(CEO|CFO|CTO|CMO|COO|CRO|CHRO|CDO|CSO|CIO)\b/i,
  /\b(sales manager|account manager|account executive|business developer|product manager|project manager|HR manager|finance manager|operations manager)\b/i,
  /\b(software engineer|developer|frontend|backend|fullstack|full stack|data scientist|data analyst|data engineer|devops engineer|cloud engineer|systems administrator|IT specialist)\b/i,
  /\b(marketing manager|content manager|growth hacker|UX designer|UI designer|graphic designer|web designer|product designer|art director)\b/i,
  /\b(VP of Sales|Head of Product|Director of Engineering|VP of Marketing|Head of HR|Chief People Officer|Head of Operations|Head of Finance)\b/i,
  /\b(recruiter|talent acquisition|sourcing specialist|technical recruiter|HR business partner|HR specialist|HR generalist)\b/i,
  /\b(copywriter|content writer|technical writer|journalist|editor|content creator|social media manager)\b/i,
  /\b(customer support|customer success|account manager|sales representative|business development|key account manager)\b/i,
  /\b(teacher|professor|instructor|trainer|coach|mentor|tutor|educator)\b/i,
  /\b(researcher|scientist|laboratory technician|lab manager|R&D specialist|innovation manager)\b/i,
  /\b(lawyer|attorney|legal counsel|paralegal|compliance officer|legal advisor)\b/i,
  /\b(accountant|financial analyst|controller|bookkeeper|auditor|tax specialist|finance assistant)\b/i,
  /\b(architect|civil engineer|structural engineer|electrical engineer|mechanical engineer|CAD designer)\b/i,
  /\b(nurse|doctor|physician|pharmacist|dentist|psychologist|therapist|healthcare professional)\b/i,
  /\b(project coordinator|program manager|scrum master|agile coach|product owner|business analyst)\b/i
];

const industryPatterns = [
  /\b(?:industry|sector|field|market)(?: is| in)? ([A-Za-z\s&]+)\b/i,
  /\b(?:in|within) the ([A-Za-z\s&]+?) (?:industry|sector|field|market)\b/i,
  /\b([A-Za-z\s&]+?) (?:industry|sector|company|business|firm)\b/i,
  /\b(?:SaaS|B2B|B2C|tech|technology|software|finance|marketing|sales|healthcare|education|retail|manufacturing)\b/i,
  // Common industries directly
  /\b(fintech|healthtech|edtech|proptech|martech|adtech|insurtech|cleantech|biotech|agritech)\b/i,
  /\b(artificial intelligence|AI|machine learning|ML|big data|data science|blockchain|crypto|Web3|IoT)\b/i,
  /\b(ecommerce|e-commerce|real estate|telecom|telecommunications|consulting|banking|insurance)\b/i,
  /\b(automotive|construction|energy|food|hospitality|logistics|media|pharma|travel)\b/i,
  /\b(gaming|semiconductors|cybersecurity|security|cloud computing|green tech|renewable energy)\b/i,
  // Additional common industries
  /\b(fashion|apparel|clothing|textile|accessories)\b/i,
  /\b(law|legal|law firm|attorney|legal services)\b/i,
  /\b(accounting|auditing|tax|financial services)\b/i,
  /\b(architecture|design|interior design|graphic design)\b/i,
  /\b(agriculture|farming|forestry|fishing|aquaculture)\b/i,
  /\b(mining|oil|gas|petroleum|natural resources)\b/i,
  /\b(entertainment|film|movie|cinema|television|music|publishing)\b/i,
  /\b(advertising|PR|public relations|communications)\b/i,
  /\b(government|public sector|nonprofit|NGO|charity)\b/i,
  /\b(military|defense|aerospace|aviation)\b/i,
  /\b(sports|recreation|fitness|wellness|spa)\b/i,
  /\b(beauty|cosmetics|personal care|luxury)\b/i,
  /\b(science|research|laboratory|academic)\b/i,
  /\b(manufacturing|production|assembly|industrial)\b/i,
  /\b(transport|transportation|shipping|logistics|supply chain)\b/i,
  /\b(utilities|electricity|water|waste management)\b/i,
  /\b(chemical|plastics|paper|packaging|rubber)\b/i,
  /\b(furniture|appliances|home goods|hardware)\b/i,
  /\b(consumer goods|FMCG|fast moving consumer goods)\b/i,
  /\b(electronics|computer hardware|electronics manufacturing)\b/i,
  /\b(recruitment|staffing|HR|human resources|talent acquisition)\b/i,
  /\b(trading|commodities|wholesale|import|export)\b/i,
  /\b(art|museums|galleries|cultural|heritage)\b/i,
  /\b(education|edtech|training|learning|teaching|school|university|college)\b/i,
  /\b(consumer services|professional services|business services)\b/i
];

const skillPatterns = [
  /\b(?:skill|expertise|knowledge|proficiency|competency|experience)(?: in| with)? ([A-Za-z\s&]+)\b/i,
  /\b(?:proficient|experienced|skilled|knowledgeable|expert)(?: in| with)? ([A-Za-z\s&]+)\b/i,
  /\b(?:knows|understands|can use|familiar with) ([A-Za-z\s&]+)\b/i,
  /\b(\d+(?:\+|\s)? years? (?:of )?experience(?: in| with)? [A-Za-z\s&]+)\b/i,
  /\b([A-Za-z\s&]+? (?:experience|skills|knowledge))\b/i,
  /\b(?:with |has |possesses )(?:excellent|good|great|strong) ([A-Za-z\s&]+?)(?: skills| abilities| competencies)?\b/i,
  /\b(?:with |has |possesses )([A-Za-z\s&]+?)(?: skills| abilities| competencies)\b/i,
  
  // Common sales and commercial skills (direct patterns)
  /\b(direct sales|B2B sales|B2C sales|telesales|door-to-door sales|sales management|inside sales|field sales|consultative selling|solution selling|key account management|KAM|sales strategy|sales planning|prospecting|lead generation|cold calling|appointment setting|sales presentation|needs analysis|proposal writing)\b/i,
  /\b(negotiation techniques|objection handling|closing techniques|price negotiation|contract negotiation|terms negotiation|win-win negotiation|BATNA|contract writing|deal closing)\b/i,
  /\b(customer management|relationship building|customer care|customer loyalty|customer satisfaction|customer experience|customer service|complaint handling|customer retention|customer segmentation|customer lifecycle management|customer journey|after sales service|upselling|cross-selling|customer recovery|customer insights|VIP customer management|customer meetings|customer strategy)\b/i,
  
  // Tech skills: Programming languages
  /\b(Java|Python|JavaScript|TypeScript|C#|C\+\+|PHP|Ruby|Swift|Kotlin|Go|Golang|Rust|Scala|R|MATLAB|Perl|Objective-C|Dart|Groovy|Shell Scripting)\b/i,
  
  // Tech skills: Frontend development
  /\b(HTML5|CSS3|React|Angular|Vue\.js|jQuery|Redux|Next\.js|Svelte|Gatsby|Bootstrap|Tailwind CSS|Material UI|Responsive Design|Progressive Web Apps|PWA|Web Components|Webpack|Vite|Babel|SASS|SCSS)\b/i,
  
  // Tech skills: Backend development
  /\b(Node\.js|Express\.js|Django|Flask|Ruby on Rails|Spring Boot|ASP\.NET Core|Laravel|Symfony|FastAPI|NestJS|GraphQL|RESTful API|SOAP API|Serverless Functions|WebSockets|gRPC|Microservices|Mikrotjänster|API Gateway|Service Mesh)\b/i,
  
  // Tech skills: Databases
  /\b(SQL|MySQL|PostgreSQL|MongoDB|SQLite|Oracle Database|Microsoft SQL Server|Redis|Cassandra|DynamoDB|Firebase|Elasticsearch|Neo4j|MariaDB|Couchbase|InfluxDB|Supabase|CockroachDB|Time Series Databases|Tidsserie-databaser|Databas-optimering|Database Optimization)\b/i,
  
  // Tech skills: Cloud services
  /\b(Amazon Web Services|AWS|Microsoft Azure|Google Cloud Platform|GCP|IBM Cloud|Oracle Cloud|Alibaba Cloud|Heroku|DigitalOcean|Linode|Cloudflare|AWS Lambda|Azure Functions|Cloud Storage|Molnlagring|Hybrid Cloud|Hybridmoln|Multi-Cloud|Multimoln|Infrastructure as a Service|IaaS|Platform as a Service|PaaS|Software as a Service|SaaS|Serverless Computing|Cloud Migration|Molnmigrering)\b/i,
  
  // Tech skills: DevOps & CI/CD
  /\b(Docker|Kubernetes|Jenkins|GitLab CI\/CD|GitHub Actions|CircleCI|Travis CI|Terraform|Ansible|Chef|Puppet|Prometheus|Grafana|ELK Stack|Continuous Integration|Kontinuerlig Integrering|Continuous Deployment|Kontinuerlig Driftsättning|Infrastructure as Code|IaC|Configuration Management|Konfigurationshantering|Containerisering|Containerization|Orchestrering|Orchestration)\b/i,
  
  // Tech skills: Version control
  /\b(Git|GitHub|GitLab|Bitbucket|SVN|Subversion|Mercurial|Branching Strategies|Förgreningsstrategier|Pull Requests|Code Review|Kodgranskning|Git Flow)\b/i,
  
  // Tech skills: Software architecture
  /\b(Microservices|Mikrotjänster|Monolithic Architecture|Monolitisk Arkitektur|Serverless Architecture|Serverlös Arkitektur|Event-Driven Architecture|Händelsedriven Arkitektur|Domain-Driven Design|DDD|CQRS|Event Sourcing|Hexagonal Architecture|Hexagonal Arkitektur|Clean Architecture|Ren Arkitektur|SOA|Service-Oriented Architecture|Distributed Systems|Distribuerade System|Architectural Patterns|Arkitekturmönster|API Design|API-design|System Integration|Systemintegration|Low-Code Architecture|Component-Based Architecture|Layered Architecture|Lagerarkitektur|Saga Pattern|Microkernel Architecture|Space-Based Architecture)\b/i,
  
  // Tech skills: Testing and QA
  /\b(Unit Testing|Enhetstestning|Integration Testing|Integrationstestning|End-to-End Testing|End-to-End-testning|Test-Driven Development|TDD|Behavior-Driven Development|BDD|Jest|Mocha|Cypress|Selenium|JUnit|TestNG|Pytest|Automated Testing|Automatiserad Testning|Manual Testing|Manuell Testning|Performance Testing|Prestandatestning|Load Testing|Belastningstestning|Regression Testing|Regressionstestning|A\/B Testing|A\/B-testning|Smoke Testing|Röktestning|Continuous Testing|Kontinuerlig Testning)\b/i,
  
  // Tech skills: Mobile and app development
  /\b(Mobile App Development|Mobilappsutveckling|iOS Development|iOS-utveckling|Android Development|Android-utveckling|React Native|Flutter|Xamarin|Ionic|SwiftUI|Kotlin Multiplatform|Desktop Application Development|Skrivbordsapplikationsutveckling|Electron|WPF|Qt|Cross-Platform Development|Plattformsoberoende Utveckling|Progressive Web Apps|PWA|Hybrid Apps|Hybridappar|App Optimization|App-optimering|App Store Optimization|Push Notifications|Push-notiser|Offline Capability|Offline-funktionalitet)\b/i,
  
  // Tech skills: Cybersecurity
  /\b(Network Security|Nätverkssäkerhet|Application Security|Applikationssäkerhet|Cryptography|Kryptografi|Identity & Access Management|OWASP|Penetration Testing|Penetrationstestning|Secure Coding|Säker Kodning|Threat Modeling|Hotmodellering|Security Auditing|Säkerhetsrevision|Vulnerability Assessment|Sårbarhetsanalys|SIEM|Security Information and Event Management|SOC|Security Operations Center|Security Architecture|Säkerhetsarkitektur|DevSecOps|Secure SDLC|Zero Trust Security|Ethical Hacking|Etisk Hackning|Security Compliance|Säkerhetsefterlevnad|Malware Analysis|Skadeprogramsanalys|Cloud Security|Molnsäkerhet)\b/i,
  
  // Tech skills: Data and analytics
  /\b(Big Data|Data Mining|Datautvinning|Data Analysis|Dataanalys|Data Visualization|Datavisualisering|Business Intelligence|BI|Data Warehousing|Datalager|ETL|Extract Transform Load|Power BI|Tableau|Looker|Qlik|Data Modeling|Datamodellering|OLAP|Dimensional Modeling|Dimensionell Modellering|Data Lake|Data Governance|Datastyrning|Predictive Analytics|Prediktiv Analys|Descriptive Analytics|Beskrivande Analys|Prescriptive Analytics|Föreskrivande Analys|Real-time Analytics|Realtidsanalys)\b/i,
  
  // Tech skills: AI and machine learning
  /\b(Machine Learning|Maskininlärning|Deep Learning|Djupinlärning|Natural Language Processing|NLP|Computer Vision|Datorseende|TensorFlow|PyTorch|Keras|Scikit-learn|Reinforcement Learning|Förstärkningsinlärning|Neural Networks|Neurala Nätverk|AI Ethics|AI-etik|Conversational AI|Konverserande AI|Chatbots|Model Training|Modellträning|MLOps|Feature Engineering|Transfer Learning|Anomaly Detection|Anomalidetektion|Predictive Modeling|Prediktiv Modellering|Recommender Systems|Rekommendationssystem)\b/i,
  
  // Tech skills: SaaS platforms and CRM
  /\b(Salesforce|HubSpot|Microsoft Dynamics 365|SAP|Oracle Cloud Applications|ServiceNow|Zendesk|Workday|NetSuite|Shopify|Zoho|Freshworks|Pipedrive|Monday\.com|Airtable|Asana|ClickUp|Atlassian Suite|Jira|Confluence)\b/i,
  
  // Tech skills: Project management and agile
  /\b(Agile Methodology|Agil Metodik|Scrum|Kanban|Waterfall|Vattenfallsmetoden|Lean|Six Sigma|Prince2|PMI|PMBOK|Project Planning|Projektplanering|Sprint Planning|Sprintplanering|Stand-up Meetings|Stand-up-möten|Retrospectives|Retrospektiv|User Stories|Användarberättelser|Epics|Roadmapping|Release Management|Utgivningshantering|ITIL|Project Portfolio Management|Projektportföljhantering|Resource Allocation|Resursallokering|Risk Management|Riskhantering)\b/i,
  
  // Tech skills: Product management
  /\b(Product Management|Produktledning|Product Owner|Product Discovery|Produktupptäckt|User Research|Användarforskning|Market Research|Marknadsundersökning|Competitive Analysis|Konkurrentanalys|Product Roadmap|Produktfärdplan|Product Strategy|Produktstrategi|Product Marketing|Produktmarknadsföring|Product Lifecycle Management|Produktlivscykelhantering|User Experience|UX|Användarupplevelse|User Interface|UI|Användargränssnitt|Wireframing|Prototyping|Prototypframtagning|Requirements Gathering|Kravhantering|User Testing|Användartestning|A\/B Testing|A\/B-testning|Feature Prioritization|Funktionsprioritering|Product Analytics|Produktanalys|Go-to-Market Strategy|Go-to-Market-strategi)\b/i,
  
  // Tech skills: ERP and business systems
  /\b(SAP ERP|Oracle ERP|Microsoft Dynamics ERP|Infor|Sage|NetSuite ERP|Odoo|ERP Implementation|ERP-implementering|ERP Integration|ERP-integration|Business Process Automation|Affärsprocessautomation|Workflow Automation|Arbetsflödesautomation|Digital Transformation|Process Optimization|Processoptimering|Inventory Management|Lagerhantering|Supply Chain Management|Försörjningskedjehantering|Financial Systems|Ekonomisystem|Human Resource Management Systems|HRMS|Customer Relationship Management|CRM|Enterprise Asset Management|Företagstillgångshantering|Business Process Management|BPM)\b/i,
  
  // Tech skills: Networking and telecommunications
  /\b(Network Administration|Nätverksadministration|LAN|WAN|TCP\/IP|DNS|DHCP|VPN|Network Protocols|Nätverksprotokoll|Routing|Switching|Firewall Configuration|Brandväggshantering|Network Monitoring|Nätverksövervakning|Network Security|Nätverkssäkerhet|Load Balancing|Lastbalansering|SDN|Software-Defined Networking|VoIP|5G Networks|5G-nätverk|Wi-Fi|Bluetooth|IoT Networks|IoT-nätverk|Edge Computing)\b/i,
  
  // Tech skills: System administration and IT infrastructure
  /\b(Windows Server|Linux Administration|Linux-administration|Unix|Active Directory|LDAP|PowerShell|Bash|Virtualization|Virtualisering|VMware|Hyper-V|Server Management|Serverhantering|Storage Management|Lagringshantering|Backup Solutions|Backuplösningar|Disaster Recovery|Katastrofåterställning|High Availability|Hög Tillgänglighet|Fault Tolerance|Feltolerans|Capacity Planning|Kapacitetsplanering|IT Service Management|IT-tjänstehantering|Technical Support|Teknisk Support|Troubleshooting|Felsökning)\b/i,
  
  // Tech skills: Frameworks and libraries
  /\b(ASP\.NET|Spring Framework|Hibernate|Flask|FastAPI|Struts|Angular Material|React Hooks|Vue Router|Blazor|gRPC|SignalR|RxJS|Redux Toolkit|Axios|Mongoose|Express Middleware|Django REST Framework|Apollo GraphQL|EF Core)\b/i,
  
  // Tech skills: Development tools and IDE
  /\b(Visual Studio|Visual Studio Code|IntelliJ IDEA|Eclipse|PyCharm|WebStorm|Xcode|Android Studio|Postman|Swagger|SonarQube|JMeter|Gatling|Charles Proxy|Cucumber|Selenium WebDriver|TestRail|JIRA Software|Trello|Figma)\b/i,
  
  // Tech skills: IoT and embedded systems
  /\b(Embedded Systems|Inbyggda System|IoT Development|IoT-utveckling|Arduino|Raspberry Pi|Embedded C\/C\+\+|MQTT|CoAP|RFID|Sensor Networks|Sensornätverk|Real-time Operating Systems|RTOS|PLCs|Programmable Logic Controllers|Industrial IoT|IIoT|Smart Home Technology|Smart Hem-teknik|Bluetooth Low Energy|BLE|Zigbee|LoRaWAN|Edge Computing|Firmware Development|Firmware-utveckling|Microcontroller Programming|Microcontroller-programmering|Digital Signal Processing|DSP)\b/i,
  
  // Tech skills: Blockchain and crypto
  /\b(Blockchain Development|Blockchain-utveckling|Smart Contracts|Smarta Kontrakt|Ethereum|Solidity|Web3\.js|Hyperledger|Solana|NFT Development|NFT-utveckling|DApps|Decentralized Applications|Cryptocurrency|Kryptovaluta|Bitcoin|DeFi|Decentralized Finance|Blockchain Security|Blockchain-säkerhet|Consensus Mechanisms|Konsensusmekanismer|Distributed Ledger Technology|DLT|Tokenomics|ERC Standards|ERC-standarder|Chain Integration|Chain-integration|Crypto Wallets|Kryptoplånböcker|Layer 2 Solutions|Layer 2-lösningar)\b/i,
  
  // Tech skills: Game and graphics development
  /\b(Game Development|Spelutveckling|Unity|Unreal Engine|Godot|Game Design|Speldesign|3D Modeling|3D-modellering|Game Physics|Spelfysik|Augmented Reality|AR|Virtual Reality|VR|Mixed Reality|MR|WebGL|Three\.js|OpenGL|DirectX|Shader Programming|Shader-programmering|Computer Graphics|Datorgrafik|Animation|Animering|Motion Capture|Rörelseinfångning|Procedural Generation|Procedurell Generering|Game AI|Spel-AI)\b/i,
  
  // Tech skills: Mobile specific
  /\b(Mobile Security|Mobilsäkerhet|Mobile App Architecture|Mobilappsarkitektur|Android SDK|iOS SDK|ARKit|ARCore|CoreML|Android Jetpack|SwiftUI|Mobile UI Design|Mobil UI-design|Mobile UX|Mobil UX|Responsive Design|Responsiv Design|Mobile Analytics|Mobilanalys|App Store Optimization|ASO|Mobile Backend as a Service|MBaaS|Mobile Testing|Mobiltestning|Mobile Performance Optimization|Mobilprestanda-optimering|Progressive Web Apps|PWA|Mobile Frameworks|Mobila ramverk|Mobile CI\/CD|Mobil CI\/CD)\b/i,
  
  // Tech skills: Business analysis and IT leadership
  /\b(IT Strategy|IT-strategi|IT Governance|IT-styrning|Business Analysis|Affärsanalys|Technical Leadership|Tekniskt Ledarskap|CTO Skills|CTO-färdigheter|CIO Skills|CIO-färdigheter|IT Portfolio Management|IT-portföljhantering|Technology Innovation|Teknisk Innovation|Enterprise Architecture|Företagsarkitektur|IT Budgeting|IT-budgetering)\b/i,
  
  // Common skills directly (existing)
  /\b(JavaScript|TypeScript|Python|Java|C#|C\+\+|PHP|Ruby|Go|Rust|SQL|NoSQL)\b/i,
  /\b(React|Angular|Vue|Node\.js|Express|Django|Flask|Laravel|Spring|ASP\.NET|Rails)\b/i,
  /\b(MongoDB|PostgreSQL|MySQL|Oracle|SQL Server|Redis|Elasticsearch|Firebase)\b/i,
  /\b(Docker|Kubernetes|AWS|Azure|GCP|CI\/CD|DevOps|Agile|Scrum|TDD)\b/i,
  /\b(Excel|PowerPoint|Word|Google Analytics|SEO|SEM|CRM|ERP|Salesforce|HubSpot)\b/i,
  /\b(Project Management|Team Leadership|Negotiation|Public Speaking|Strategic Planning)\b/i,
  /\b(content marketing|social media|email marketing|growth hacking|conversion optimization)\b/i,
  /\b(data analysis|statistical modeling|A\/B testing|KPI tracking|forecasting)\b/i,
  /\b(communication|teamwork|problem solving|critical thinking|creativity|innovation)\b/i,
  /\b(time management|organization|adaptability|flexibility|attention to detail|multitasking)\b/i,
  /\b(leadership|coaching|mentoring|team building|conflict resolution|decision making)\b/i,
  /\b(customer service|client relationship|account management|sales|business development)\b/i,
  /\b(research|analysis|reporting|documentation|writing|editing|proofreading)\b/i,
  /\b(accounting|bookkeeping|financial reporting|budgeting|forecasting|financial analysis)\b/i,
  /\b(design thinking|user experience|user interface|wireframing|prototyping|user testing)\b/i,
  /\b(graphic design|illustration|typography|branding|visual communication|layout design)\b/i,
  /\b(marketing|branding|advertising|market research|campaign management|digital marketing)\b/i,
  /\b(product management|product development|roadmapping|user stories|feature prioritization)\b/i,
  /\b(recruiting|sourcing|talent acquisition|interviewing|onboarding|hr management)\b/i
];

// Helper function to extract matches from text using patterns
const extractMatches = (text: string, patterns: RegExp[]): string[] => {
  const matches: string[] = [];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim();
      if (extracted && !matches.includes(extracted)) {
        matches.push(extracted);
      }
    }
  }
  
  return matches;
};

export interface CategorizedRequirements {
  locations: string[];
  titles: string[];
  industries: string[];
  skills: string[];
  uncategorized: string[];
}

/**
 * Extract and categorize requirements from input text
 * 
 * @param inputText - The raw input text containing requirements
 * @returns Categorized requirements
 */
export const extractRequirements = (inputText: string): CategorizedRequirements => {
  // First, split input by commas to get individual requirements
  const items = inputText
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
  
  const categorized: CategorizedRequirements = {
    locations: [],
    titles: [],
    industries: [],
    skills: [],
    uncategorized: []
  };
  
  // Look for common industry phrases first in the full text
  const commonIndustryPhrases = [
    "tech industry", "software industry", "finance industry", "banking industry",
    "healthcare industry", "retail industry", "manufacturing industry", "automotive industry",
    "energy industry", "food industry", "media industry", "legal industry", "fashion industry",
    "entertainment industry", "marketing industry", "advertising industry", "consulting industry",
    "education industry", "hospitality industry", "travel industry", "gaming industry",
    "pharmaceutical industry", "telecommunication industry", "construction industry", 
    "real estate industry", "insurance industry", "logistics industry", "transportation industry"
  ];
  
  // Check full text for these common industry phrases
  commonIndustryPhrases.forEach(phrase => {
    if (inputText.toLowerCase().includes(phrase.toLowerCase())) {
      // Extract just the industry name without "industry"
      const industry = phrase.replace(/ industry$/i, '');
      if (!categorized.industries.includes(industry)) {
        categorized.industries.push(industry);
      }
    }
  });
  
  // If we have a single input without commas, try direct term matching first
  if (items.length === 1 && !inputText.includes(',')) {
    // Try to categorize the whole input as a direct term
    const directMatch = matchDirectTerm(inputText.trim());
    if (directMatch.category && directMatch.term) {
      categorized[directMatch.category].push(directMatch.term);
      
      // If we categorized the whole input, we can return early
      if (directMatch.wholeMatch) {
        return categorized;
      }
    }
  }
  
  // Attempt to categorize each item
  items.forEach(item => {
    // Check for direct match first
    const directMatch = matchDirectTerm(item);
    if (directMatch.category && directMatch.term) {
      categorized[directMatch.category].push(directMatch.term);
      return;
    }
    
    // Check for location
    const locationMatches = extractMatches(item, locationPatterns);
    if (locationMatches.length > 0) {
      categorized.locations.push(locationMatches[0]);
      return;
    }
    
    // Check for title
    const titleMatches = extractMatches(item, titlePatterns);
    if (titleMatches.length > 0) {
      categorized.titles.push(titleMatches[0]);
      return;
    }
    
    // Check for industry
    const industryMatches = extractMatches(item, industryPatterns);
    if (industryMatches.length > 0) {
      categorized.industries.push(industryMatches[0]);
      return;
    }
    
    // Check for skills
    const skillMatches = extractMatches(item, skillPatterns);
    if (skillMatches.length > 0) {
      categorized.skills.push(skillMatches[0]);
      return;
    }
    
    // If none of the patterns matched, add to uncategorized
    categorized.uncategorized.push(item);
  });
  
  // Process the full text as well to catch more context-dependent patterns
  const fullTextLocationMatches = extractMatches(inputText, locationPatterns);
  fullTextLocationMatches.forEach(match => {
    if (!categorized.locations.includes(match)) {
      categorized.locations.push(match);
    }
  });
  
  const fullTextTitleMatches = extractMatches(inputText, titlePatterns);
  fullTextTitleMatches.forEach(match => {
    if (!categorized.titles.includes(match)) {
      categorized.titles.push(match);
    }
  });
  
  const fullTextIndustryMatches = extractMatches(inputText, industryPatterns);
  fullTextIndustryMatches.forEach(match => {
    if (!categorized.industries.includes(match)) {
      categorized.industries.push(match);
    }
  });
  
  // Additional industry detection - look for common phrases that suggest an industry
  const industryRelatedPhrases = [
    { phrase: "tech company", industry: "tech" },
    { phrase: "software company", industry: "software" },
    { phrase: "IT company", industry: "IT" },
    { phrase: "finance company", industry: "finance" },
    { phrase: "bank", industry: "banking" },
    { phrase: "healthcare provider", industry: "healthcare" },
    { phrase: "hospital", industry: "healthcare" },
    { phrase: "retail store", industry: "retail" },
    { phrase: "manufacturing company", industry: "manufacturing" },
    { phrase: "law firm", industry: "legal" },
    { phrase: "accounting firm", industry: "accounting" },
    { phrase: "consulting firm", industry: "consulting" },
    { phrase: "marketing agency", industry: "marketing" },
    { phrase: "ad agency", industry: "advertising" },
    { phrase: "PR agency", industry: "PR" },
    { phrase: "school", industry: "education" },
    { phrase: "university", industry: "education" },
    { phrase: "hotel", industry: "hospitality" },
    { phrase: "restaurant", industry: "food" },
    { phrase: "media company", industry: "media" },
    { phrase: "newspaper", industry: "media" },
    { phrase: "pharmaceutical company", industry: "pharmaceutical" },
    { phrase: "construction company", industry: "construction" },
    { phrase: "real estate agency", industry: "real estate" },
    { phrase: "insurance company", industry: "insurance" },
    { phrase: "logistics company", industry: "logistics" },
    { phrase: "transportation company", industry: "transportation" },
    { phrase: "airline", industry: "aviation" },
    { phrase: "government agency", industry: "government" },
    { phrase: "nonprofit organization", industry: "nonprofit" },
    { phrase: "charity", industry: "nonprofit" },
    { phrase: "military", industry: "defense" },
    { phrase: "defense contractor", industry: "defense" },
    { phrase: "aerospace company", industry: "aerospace" },
    { phrase: "sports team", industry: "sports" },
    { phrase: "fitness center", industry: "fitness" },
    { phrase: "beauty salon", industry: "beauty" },
    { phrase: "research lab", industry: "research" },
    { phrase: "manufacturing plant", industry: "manufacturing" },
    { phrase: "utility company", industry: "utilities" },
    { phrase: "chemical company", industry: "chemical" },
    { phrase: "electronics manufacturer", industry: "electronics" },
    { phrase: "recruitment agency", industry: "recruitment" },
    { phrase: "trading company", industry: "trading" },
    { phrase: "art gallery", industry: "art" },
    { phrase: "museum", industry: "cultural" }
  ];
  
  industryRelatedPhrases.forEach(({ phrase, industry }) => {
    if (inputText.toLowerCase().includes(phrase.toLowerCase())) {
      if (!categorized.industries.includes(industry)) {
        categorized.industries.push(industry);
      }
    }
  });
  
  const fullTextSkillMatches = extractMatches(inputText, skillPatterns);
  fullTextSkillMatches.forEach(match => {
    // Filtrera efter ordlängd för att undvika meningar, men ta bort den stränga valideringen mot tekniklistan
    const wordCount = match.split(/\s+/).length;
    if (wordCount >= 1 && wordCount <= 3 && !categorized.skills.includes(match)) {
      categorized.skills.push(match);
    }
  });
  
  // Final step - direct check for individual industry terms as a last resort
  const commonIndustryTerms = [
    // Existerande termer
    "tech", "software", "IT", "finance", "banking", "healthcare", "retail", 
    "manufacturing", "legal", "accounting", "consulting", "marketing", "advertising", 
    "PR", "education", "hospitality", "food", "media", "pharma", "pharmaceutical", 
    "construction", "real estate", "insurance", "logistics", "transportation", 
    "aviation", "government", "nonprofit", "NGO", "defense", "aerospace", "sports", 
    "fitness", "beauty", "research", "utilities", "chemical", "electronics", 
    "recruitment", "staffing", "trading", "art", "entertainment", "film", "music", 
    "fashion", "design", "agriculture", "farming", "mining", "oil", "gas",
    "automotive", "telecom", "telecommunications", "security", "cybersecurity",
    "cloud", "blockchain", "crypto", "Web3", "IoT", "internet of things", "ecommerce", "e-commerce",
    "gaming", "fintech", "healthtech", "edtech", "proptech", "biotech", "cleantech",
    "greentech", "renewables", "renewable energy", "sustainable",
    
    // Alla industrier från listan (A-Z)
    // A
    "accounting", "redovisning", "ACC", "airlines", "aviation", "flygbolag", "flygindustri",
    "alternative medicine", "alternativ medicin", "alt med", "animation", "apparel", "fashion", 
    "kläder", "mode", "architecture", "planning", "arkitektur", "planering", "arch & plan",
    "arts & crafts", "konst och hantverk", "automotive", "fordonsindustri", "auto", 
    "aerospace", "flyg- och rymdindustri",
    
    // B
    "banking", "bankverksamhet", "biotechnology", "bioteknik", "biotech", "broadcast media", 
    "sändningsmedia", "broadcast", "building materials", "byggmaterial", 
    "business supplies & equipment", "företagsmaterial och utrustning", "business supplies",
    
    // C
    "capital markets", "kapitalmarknader", "cap markets", "chemicals", "kemikalier", 
    "civic & social organization", "medborgar- och samhällsorganisationer", "civic org", 
    "civil engineering", "civilingenjörsvetenskap", "civil eng", "commercial real estate", 
    "kommersiella fastigheter", "commercial RE", "computer & network security", 
    "dator- och nätverkssäkerhet", "cybersecurity", "computer games", "datorspel", "gaming", 
    "computer hardware", "datorhårdvara", "hardware", "computer networking", "datornätverk", 
    "networking", "computer software", "datorprogramvara", "software", "construction", 
    "byggnation", "consumer electronics", "konsumentelektronik", "consumer goods", 
    "konsumentvaror", "consumer services", "konsumenttjänster", "cosmetics", "kosmetik",
    
    // D
    "dairy", "mejeriprodukter", "defense & space", "försvar och rymd", "design",
    
    // E
    "education management", "utbildningsförvaltning", "edu management", "e-learning", 
    "e-lärande", "electrical/electronic manufacturing", "elektrisk/elektronisk tillverkning", 
    "electronics mfg", "entertainment", "underhållning", "environmental services", 
    "miljötjänster", "events services", "evenemangstjänster", "executive office", 
    "ledningskontor",
    
    // F
    "farming", "jordbruk", "agriculture", "financial services", "finansiella tjänster", 
    "finserv", "fine art", "konst", "fishery", "fiske", "food & beverages", "mat och dryck", 
    "f&b", "food production", "livsmedelsproduktion", "food prod", "fund-raising", "insamling", 
    "fundraising", "furniture", "möbler",
    
    // G
    "gambling & casinos", "spel och kasino", "gambling", "glass, ceramics & concrete", 
    "glas, keramik och betong", "glass/ceramics", "government administration", 
    "offentlig förvaltning", "gov admin", "government relations", "offentliga relationer", 
    "gov relations", "graphic design", "grafisk design",
    
    // H
    "health, wellness & fitness", "hälsa, välbefinnande och fitness", "health & fitness", 
    "higher education", "högre utbildning", "higher ed", "hospital & health care", 
    "sjukhus och hälso- och sjukvård", "healthcare", "hospitality", "hotell och restaurang", 
    "human resources", "personalresurser", "HR",
    
    // I
    "import & export", "import och export", "import/export", "individual & family services", 
    "individ- och familjetjänster", "family services", "industrial automation", 
    "industriell automation", "ind automation", "information services", "informationstjänster", 
    "info services", "information technology & services", "informationsteknik och tjänster", 
    "IT services", "insurance", "försäkring", "international affairs", "internationella frågor", 
    "intl affairs", "international trade & development", "internationell handel och utveckling", 
    "intl trade", "internet", "investment banking", "investmentbankverksamhet", "IB", 
    "investment management", "investeringsförvaltning", "investment mgmt",
    
    // J-K
    "judiciary", "rättsväsendet", "k-12 education", "grund- och gymnasieutbildning", "k-12",
    
    // L
    "law enforcement", "brottsbekämpning", "law practice", "advokatverksamhet", 
    "legal services", "juridiska tjänster", "legislative office", "lagstiftande organ", 
    "leisure, travel & tourism", "fritid, resor och turism", "travel & tourism", "libraries", 
    "bibliotek", "logistics & supply chain", "logistik och försörjningskedja", "logistics", 
    "luxury goods & jewelry", "lyxvaror och smycken", "luxury goods",
    
    // M
    "machinery", "maskiner", "management consulting", "managementkonsultverksamhet", 
    "mgmt consulting", "maritime", "sjöfart", "marketing & advertising", 
    "marknadsföring och reklam", "m&a", "marketing", "advertising", "market research", 
    "marknadsundersökning", "mechanical or industrial engineering", 
    "maskin- eller industriteknik", "mecheng", "indeng", "media production", 
    "mediaproduktion", "media prod", "medical devices", "medicintekniska produkter", 
    "medtech", "med devices", "medical practice", "medicinsk praktik", "mental health care", 
    "psykisk hälsovård", "mental health", "military", "militär", "mining & metals", 
    "gruvdrift och metall", "mining", "metals", "motion pictures & film", 
    "film och rörlig bild", "film", "motion pictures", "museums & institutions", 
    "museer och institutioner", "museums", "music", "musik",
    
    // N
    "nanotechnology", "nanoteknologi", "nanotech", "newspapers", "tidningar", 
    "nonprofit organization management", "ideell organisationsledning", "nonprofit", "npo",
    
    // O
    "oil & energy", "olja och energi", "oil & gas", "energy", "online media", 
    "digital media", "outsourcing/offshoring", "bpo",
    
    // P
    "package/freight delivery", "paket- och godstransport", "freight", "packaging & containers", 
    "förpackningar och behållare", "packaging", "paper & forest products", 
    "papper och skogsprodukter", "forest products", "performing arts", "scenkonst", 
    "pharmaceuticals", "läkemedel", "pharma", "philanthropy", "filantropi", "photography", 
    "fotografi", "plastics", "plast", "political organization", "politisk organisation", 
    "political org", "primary/secondary education", "grund-/gymnasieutbildning", "printing", 
    "tryckeri", "professional training & coaching", "professionell utbildning och coaching", 
    "coaching", "training", "program development", "programutveckling", "program dev", 
    "public policy", "offentlig politik", "public relations & communications", 
    "PR och kommunikation", "communications", "public safety", "offentlig säkerhet", 
    "publishing", "förlagsverksamhet",
    
    // R
    "railroad manufacture", "järnvägsproduktion", "ranching", "boskapsskötsel", 
    "real estate", "fastigheter", "recreational facilities & services", 
    "fritidsanläggningar och -tjänster", "religious institutions", "religiösa institutioner", 
    "renewables & environment", "förnybar energi och miljö", "research", "forskning", 
    "restaurants", "restauranger", "retail", "detaljhandel",
    
    // S
    "security & investigations", "säkerhet och utredningar", "semiconductors", "halvledare", 
    "shipbuilding", "skeppsbygge", "sporting goods", "sportartiklar", "sports", "sport", 
    "staffing and recruiting", "bemanning och rekrytering", "supermarkets", "stormarknader",
    
    // T
    "telecommunications", "telekommunikation", "textiles", "textil", "think tanks", 
    "tankesmedjor", "tobacco", "tobak", "translation & localization", 
    "översättning och lokalisering", "transportation/trucking/railroad", 
    "transport/långtradare/järnväg",
    
    // U-V
    "utilities", "allmännyttiga tjänster", "venture capital & private equity", 
    "riskkapital och private equity", "veterinary", "veterinärvård",
    
    // W
    "warehousing", "lagerhållning", "wholesale", "grossisthandel", "wine & spirits", 
    "vin och sprit", "wireless", "trådlös teknik", "writing & editing", 
    "skrivande och redigering",
    
    // Technology Specific
    "SaaS", "software as a service", "mjukvara som tjänst", 
    "PaaS", "platform as a service", "plattform som tjänst",
    "IaaS", "infrastructure as a service", "infrastruktur som tjänst",
    "fintech", "financial technology", "finansiell teknologi",
    "healthtech", "hälsoteknologi", 
    "medtech", "medical technology", "medicinteknik",
    "edtech", "educational technology", "utbildningsteknik",
    "proptech", "property technology", "fastighetsteknologi",
    "martech", "marketing technology", "marknadsföringsteknik",
    "legaltech", "juridisk teknologi",
    "insurtech", "försäkringsteknologi",
    "cleantech", "clean technology", "ren teknologi", "miljöteknik",
    "agritech", "jordbruksteknik",
    "regtech", "regulatory technology", "regelverksteknik",
    "govtech", "government technology", "offentlig teknologi",
    
    // Business Models
    "DTC", "direct to consumer", "direkt till konsument",
    "B2B", "business to business", "företag till företag",
    "B2C", "business to consumer", "företag till konsument",
    "e-commerce", "e-handel",
    
    // Technology Concepts
    "cybersecurity", "cybersäkerhet",
    "AI", "artificial intelligence", "artificiell intelligens",
    "ML", "machine learning", "maskininlärning",
    "AR", "VR", "augmented reality", "virtual reality", "förstärkt verklighet", "virtuell verklighet",
    "blockchain", "blockkedjeteknik",
    "web3", "decentraliserad web",
    "gaming", "esports", "spel", "e-sport",
    "cloud computing", "molntjänster",
    "devops", "utveckling och drift",
    "hr tech", "hr-teknologi",
    "recruitment tech", "rekryteringsteknologi",
    "mobility", "mobility tech", "mobilitet", "mobilitetsteknik",
    "logtech", "logistikteknologi",
    "retailtech", "detaljhandelsteknik",
    "traveltech", "reseteknologi",
    "adtech", "advertising technology", "annonsteknologi",
    "marketplace", "marknadsplatsplattformar",
    "subscription-based services", "prenumerationstjänster"
  ];
  
  // Perform a case-insensitive check for each industry term
  const lowercaseInput = inputText.toLowerCase();
  
  commonIndustryTerms.forEach(term => {
    // Ensure we're matching whole words, not parts of words
    const regex = new RegExp(`\\b${term.toLowerCase()}\\b`, 'i');
    
    if (regex.test(lowercaseInput)) {
      if (!categorized.industries.includes(term)) {
        categorized.industries.push(term);
      }
    }
  });
  
  return categorized;
};

/**
 * Try to match a term directly to a category
 * This is used for terms that are obviously locations, titles, industries, or skills
 */
type CategoryKey = keyof Omit<CategorizedRequirements, 'uncategorized'>;

interface DirectMatch {
  category: CategoryKey | null;
  term: string | null;
  wholeMatch: boolean;
}

function matchDirectTerm(term: string): DirectMatch {
  const result: DirectMatch = {
    category: null,
    term: null,
    wholeMatch: false
  };
  
  // Check if the term exactly matches a pattern
  // City/Country names (locations)
  const locationDirectMatch = term.match(/^(Stockholm|Gothenburg|Malmö|Göteborg|Sweden|Norway|Denmark|Finland|Berlin|London|Paris|New York|USA|UK|Amsterdam|Dublin|Madrid|Rome)$/i);
  if (locationDirectMatch) {
    result.category = 'locations';
    result.term = locationDirectMatch[0];
    result.wholeMatch = true;
    return result;
  }
  
  // Job titles - expanded list
  const titleDirectMatch = term.match(/^(CEO|CFO|CTO|CMO|COO|CRO|CSO|CIO|VP|Director|Manager|Developer|Engineer|Specialist|Consultant|Analyst|Designer|Coordinator|Administrator|Technician|Architect|Strategist|sales manager|account manager|product manager|project manager|software engineer|web developer|data scientist|data analyst|UX designer|UI designer|marketing manager|content manager|recruiter|HR specialist|customer support|customer success|copywriter|content writer|teacher|professor|researcher|scientist|lawyer|attorney|accountant|nurse|doctor|project coordinator|program manager|scrum master|business analyst)$/i);
  if (titleDirectMatch) {
    result.category = 'titles';
    result.term = titleDirectMatch[0];
    result.wholeMatch = true;
    return result;
  }
  
  // Industries
  const industryDirectMatch = term.match(/^(fintech|healthtech|edtech|SaaS|B2B|B2C|tech|technology|software|finance|marketing|healthcare|retail|ecommerce|banking|insurance|automotive|construction|energy|food|hospitality|logistics|media|pharma|travel|gaming|AI|artificial intelligence|machine learning|blockchain|crypto|Web3|IoT|fashion|apparel|law|legal|accounting|tax|architecture|design|agriculture|farming|mining|oil|gas|entertainment|film|movie|music|advertising|PR|government|nonprofit|NGO|military|defense|aerospace|sports|fitness|beauty|cosmetics|luxury|science|research|manufacturing|production|transport|transportation|shipping|utilities|chemical|electronics|recruitment|HR|trading|art|education|edtech)$/i);
  if (industryDirectMatch) {
    result.category = 'industries';
    result.term = industryDirectMatch[0];
    result.wholeMatch = true;
    return result;
  }
  
  // Additional check for sales skills in Swedish and English
  if (/^direktförsäljning$|^B2B-försäljning$|^telefonförsäljning$|^försäljningsledning$|^innesälj$|^utesälj$|^konsultativ försäljning$|^lösningsförsäljning$/i.test(term) ||
      /^förhandlingsteknik$|^invändningshantering$|^avslutstekniker$|^prisförhandling$/i.test(term) ||
      /^kundhantering$|^relationsskapande$|^kundvård$|^kundlojalitet$/i.test(term) ||
      /^marknadsföring$|^innehållsmarknadsföring$|^digital marknadsföring$/i.test(term) ||
      /^affärsutveckling$|^affärsstrategi$|^affärsmodeller$/i.test(term) ||
      /^projektledning$|^agila metoder$|^scrum$|^kanban$/i.test(term) ||
      /^presentationsteknik$|^storytelling$|^retorik$/i.test(term)) {
    
    result.category = 'skills';
    result.term = term;
    result.wholeMatch = true;
    return result;
  }
  
  // Additional check for tech skills
  if (/^Java$|^Python$|^JavaScript$|^TypeScript$|^C\#$|^C\+\+$|^PHP$|^Ruby$|^Swift$|^Kotlin$|^Go$|^Rust$|^Scala$|^R$/i.test(term) ||
      /^HTML5$|^CSS3$|^React$|^Angular$|^Vue\.js$|^jQuery$|^Redux$|^Next\.js$|^Bootstrap$|^Tailwind CSS$/i.test(term) ||
      /^Node\.js$|^Express\.js$|^Django$|^Flask$|^Spring Boot$|^ASP\.NET Core$|^Laravel$|^GraphQL$|^RESTful API$/i.test(term) ||
      /^SQL$|^MySQL$|^PostgreSQL$|^MongoDB$|^SQLite$|^Redis$|^Firebase$|^Elasticsearch$/i.test(term) ||
      /^AWS$|^Azure$|^GCP$|^Kubernetes$|^Docker$|^Terraform$|^Ansible$|^Jenkins$|^CI\/CD$/i.test(term) ||
      /^Git$|^GitHub$|^GitLab$|^Bitbucket$|^Jira$|^Confluence$|^Agile$|^Scrum$|^Kanban$/i.test(term) ||
      /^TDD$|^BDD$|^Jest$|^Mocha$|^Cypress$|^Selenium$|^JUnit$|^TestNG$|^Pytest$/i.test(term) ||
      /^React Native$|^Flutter$|^Xamarin$|^SwiftUI$|^Android$|^iOS$|^Electron$/i.test(term) ||
      /^DevOps$|^DevSecOps$|^OWASP$|^Pentest$|^Cybersecurity$|^Kryptering$|^Säkerhet$/i.test(term) ||
      /^Power BI$|^Tableau$|^Looker$|^ETL$|^Big Data$|^Data Mining$|^Data Warehouse$/i.test(term) ||
      /^TensorFlow$|^PyTorch$|^Keras$|^scikit-learn$|^NLP$|^Computer Vision$|^Deep Learning$/i.test(term) ||
      /^Salesforce$|^SAP$|^Dynamics 365$|^Oracle$|^ServiceNow$|^Workday$|^NetSuite$|^Shopify$/i.test(term) ||
      /^Microservices$|^Mikrotjänster$|^Serverless$|^Cloud Native$|^Containerization$|^Virtualisering$/i.test(term) ||
      /^Unity$|^Unreal Engine$|^Game Development$|^Spelutveckling$|^3D-modellering$|^AR$|^VR$/i.test(term) ||
      /^Blockchain$|^Ethereum$|^Solidity$|^Smart Contracts$|^NFT$|^DApps$|^Web3$/i.test(term) ||
      /^UX$|^UI$|^Figma$|^Sketch$|^Prototyping$|^Wireframing$|^A\/B-testing$/i.test(term)) {
    
    result.category = 'skills';
    result.term = term;
    result.wholeMatch = true;
    return result;
  }
  
  // Skills - expanded list with sales skills
  const skillDirectMatch = term.match(/^(JavaScript|TypeScript|Python|Java|React|Angular|Vue|AWS|Azure|Docker|Kubernetes|Excel|SEO|SEM|CRM|SQL|HTML|CSS|Git|Communication|Teamwork|Leadership|Problem Solving|Critical Thinking|Creativity|Time Management|Organization|Adaptability|Attention to Detail|Multitasking|Customer Service|Research|Analysis|Writing|Editing|Accounting|Design|Project Management|Direct Sales|B2B Sales|B2C Sales|Telesales|Sales Management|Inside Sales|Field Sales|Consultative Selling|Solution Selling|Key Account Management|Sales Strategy|Prospecting|Lead Generation|Cold Calling|Negotiation|Objection Handling|Closing Techniques|Customer Management|Customer Experience|Upselling|Cross-selling|Digital Marketing|Social Media Marketing|Email Marketing|Content Marketing|Business Development|Partnership Management|Sales Analytics|Pipeline Management|Forecasting|ROI|Pricing|Value Propositions|Agile|Scrum|Kanban|Presentation Skills|PowerPoint|Storytelling|Coaching|Networking|E-commerce|Omnichannel|Social Selling|LinkedIn|Sales Training|Role Playing|SPIN Selling|Challenger Sale|Value Selling|MEDDIC|BANT)$/i);
  if (skillDirectMatch) {
    result.category = 'skills';
    result.term = skillDirectMatch[0];
    result.wholeMatch = true;
    return result;
  }
  
  return result;
} 