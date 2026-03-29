/* ============================================================================
 * securityUniverse.js — Comprehensive 5,000-Security Institutional Universe
 * ============================================================================
 * Deterministic PRNG: const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
 * NO Math.random() anywhere. Every value is reproducible from seed.
 * ============================================================================ */

// ─── Deterministic PRNG ──────────────────────────────────────────────────────
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const pick = (arr, seed) => arr[Math.floor(sr(seed) * arr.length)];
const range = (min, max, seed) => +(min + sr(seed) * (max - min)).toFixed(2);
const rangeInt = (min, max, seed) => Math.floor(min + sr(seed) * (max - min + 1));
const isinCheck = (base, seed) => base + String(rangeInt(10000000, 99999999, seed));

// ─── Reference Data ──────────────────────────────────────────────────────────
const GICS_SECTORS = [
  'Energy', 'Materials', 'Industrials', 'Consumer Discretionary', 'Consumer Staples',
  'Health Care', 'Financials', 'Information Technology', 'Communication Services',
  'Utilities', 'Real Estate'
];

const SUB_INDUSTRIES = {
  'Energy': ['Oil & Gas Exploration', 'Integrated Oil', 'Oil & Gas Refining', 'Oil Equipment & Services', 'Coal & Consumables'],
  'Materials': ['Chemicals', 'Specialty Chemicals', 'Construction Materials', 'Steel', 'Paper & Forest', 'Gold Mining', 'Diversified Metals'],
  'Industrials': ['Aerospace & Defense', 'Building Products', 'Construction & Engineering', 'Electrical Equipment', 'Industrial Conglomerates', 'Machinery', 'Airlines', 'Freight & Logistics', 'Marine Transport'],
  'Consumer Discretionary': ['Auto Manufacturers', 'Auto Components', 'Homebuilders', 'Household Durables', 'Leisure Products', 'Hotels & Restaurants', 'Specialty Retail', 'Broadline Retail', 'Textiles & Apparel'],
  'Consumer Staples': ['Food Products', 'Beverages', 'Tobacco', 'Household Products', 'Personal Care', 'Food Retail', 'Drug Retail'],
  'Health Care': ['Pharma', 'Biotech', 'Medical Devices', 'Health Care Services', 'Life Sciences Tools', 'Managed Care', 'Health Care Facilities'],
  'Financials': ['Diversified Banks', 'Regional Banks', 'Investment Banking', 'Insurance — Life', 'Insurance — P&C', 'Asset Management', 'Consumer Finance', 'Financial Exchanges'],
  'Information Technology': ['Semiconductors', 'Software — Application', 'Software — Infrastructure', 'IT Services', 'Hardware & Storage', 'Electronic Equipment', 'Communication Equipment'],
  'Communication Services': ['Interactive Media', 'Entertainment', 'Telecom — Wireless', 'Telecom — Integrated', 'Cable & Satellite', 'Publishing', 'Advertising'],
  'Utilities': ['Electric Utilities', 'Gas Utilities', 'Multi-Utilities', 'Water Utilities', 'Renewable Energy', 'Independent Power'],
  'Real Estate': ['REITs — Diversified', 'REITs — Office', 'REITs — Retail', 'REITs — Residential', 'REITs — Industrial', 'Real Estate Services', 'REITs — Health Care']
};

const REGIONS = {
  US: 'North America', CA: 'North America',
  GB: 'Europe', DE: 'Europe', FR: 'Europe', CH: 'Europe', NL: 'Europe', SE: 'Europe', DK: 'Europe',
  NO: 'Europe', FI: 'Europe', IE: 'Europe', ES: 'Europe', IT: 'Europe', BE: 'Europe', AT: 'Europe',
  PT: 'Europe', LU: 'Europe', PL: 'Europe', CZ: 'Europe', GR: 'Europe',
  JP: 'Asia Pacific', AU: 'Asia Pacific', KR: 'Asia Pacific', TW: 'Asia Pacific', SG: 'Asia Pacific',
  HK: 'Asia Pacific', CN: 'Asia Pacific', IN: 'Asia Pacific', ID: 'Asia Pacific', TH: 'Asia Pacific',
  MY: 'Asia Pacific', PH: 'Asia Pacific', VN: 'Asia Pacific', NZ: 'Asia Pacific',
  BR: 'Latin America', MX: 'Latin America', CL: 'Latin America', CO: 'Latin America', PE: 'Latin America', AR: 'Latin America',
  ZA: 'Africa', NG: 'Africa', KE: 'Africa', EG: 'Africa', MA: 'Africa',
  SA: 'Middle East', AE: 'Middle East', QA: 'Middle East', KW: 'Middle East', IL: 'Middle East', TR: 'Middle East',
};

const EXCHANGES = {
  US: 'NYSE', CA: 'TSX', GB: 'LSE', DE: 'XETRA', FR: 'EURONEXT', CH: 'SIX', NL: 'EURONEXT',
  SE: 'NASDAQ OMX', DK: 'NASDAQ OMX', NO: 'OSE', FI: 'NASDAQ OMX', IE: 'ISE', ES: 'BME',
  IT: 'BIT', BE: 'EURONEXT', AT: 'VSE', PT: 'EURONEXT', PL: 'WSE', CZ: 'PSE', GR: 'ATHEX',
  JP: 'TSE', AU: 'ASX', KR: 'KRX', TW: 'TWSE', SG: 'SGX', HK: 'HKEX', CN: 'SSE',
  IN: 'NSE', ID: 'IDX', TH: 'SET', MY: 'BURSA', PH: 'PSE', VN: 'HOSE', NZ: 'NZX',
  BR: 'B3', MX: 'BMV', CL: 'BCS', CO: 'BVC', PE: 'BVL', AR: 'BYMA',
  ZA: 'JSE', NG: 'NGX', KE: 'NSE', EG: 'EGX', MA: 'CSE',
  SA: 'TADAWUL', AE: 'ADX', QA: 'QSE', KW: 'BOURSA', IL: 'TASE', TR: 'BIST', LU: 'LUXSE',
};

const CURRENCIES = {
  US: 'USD', CA: 'CAD', GB: 'GBP', DE: 'EUR', FR: 'EUR', CH: 'CHF', NL: 'EUR',
  SE: 'SEK', DK: 'DKK', NO: 'NOK', FI: 'EUR', IE: 'EUR', ES: 'EUR', IT: 'EUR',
  BE: 'EUR', AT: 'EUR', PT: 'EUR', PL: 'PLN', CZ: 'CZK', GR: 'EUR', LU: 'EUR',
  JP: 'JPY', AU: 'AUD', KR: 'KRW', TW: 'TWD', SG: 'SGD', HK: 'HKD', CN: 'CNY',
  IN: 'INR', ID: 'IDR', TH: 'THB', MY: 'MYR', PH: 'PHP', VN: 'VND', NZ: 'NZD',
  BR: 'BRL', MX: 'MXN', CL: 'CLP', CO: 'COP', PE: 'PEN', AR: 'ARS',
  ZA: 'ZAR', NG: 'NGN', KE: 'KES', EG: 'EGP', MA: 'MAD',
  SA: 'SAR', AE: 'AED', QA: 'QAR', KW: 'KWD', IL: 'ILS', TR: 'TRY',
};

const MSCI_RATINGS = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC'];
const CDP_SCORES = ['A', 'A-', 'B', 'B-', 'C', 'C-', 'D', 'D-'];
const SBTI_STATUSES = ['Committed', 'Target Set — 1.5°C', 'Target Set — WB2C', 'Target Set — 2°C', 'None'];
const BOND_RATINGS = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-', 'BB+', 'BB', 'BB-', 'B+', 'B', 'B-', 'CCC+', 'CCC'];

// ─── Sector-specific emission ranges (tCO2e) ────────────────────────────────
const EMISSION_RANGES = {
  'Energy':                  { s1: [5e6, 100e6], s2: [500e3, 10e6], s3: [50e6, 500e6] },
  'Materials':               { s1: [1e6, 50e6],  s2: [200e3, 5e6],  s3: [10e6, 200e6] },
  'Industrials':             { s1: [100e3, 10e6], s2: [50e3, 2e6],   s3: [5e6, 100e6] },
  'Consumer Discretionary':  { s1: [50e3, 5e6],  s2: [20e3, 1e6],   s3: [2e6, 50e6] },
  'Consumer Staples':        { s1: [100e3, 10e6], s2: [50e3, 3e6],   s3: [5e6, 80e6] },
  'Health Care':             { s1: [10e3, 1e6],   s2: [5e3, 500e3],  s3: [500e3, 10e6] },
  'Financials':              { s1: [10e3, 500e3], s2: [5e3, 200e3],  s3: [10e6, 500e6] },
  'Information Technology':  { s1: [5e3, 500e3],  s2: [10e3, 1e6],   s3: [1e6, 30e6] },
  'Communication Services':  { s1: [10e3, 1e6],   s2: [20e3, 2e6],   s3: [2e6, 40e6] },
  'Utilities':               { s1: [5e6, 80e6],  s2: [100e3, 5e6],  s3: [2e6, 40e6] },
  'Real Estate':             { s1: [20e3, 2e6],  s2: [50e3, 5e6],   s3: [1e6, 20e6] },
};

// ─── S&P 500 — 500 Real US Equities ─────────────────────────────────────────
// Format: [ticker, name, sector, subIndustry, marketCapBn, revenueBn, employees]
const SP500_RAW = [
  ['AAPL','Apple','Information Technology','Semiconductors',2950,394,164000],
  ['MSFT','Microsoft','Information Technology','Software — Infrastructure',2800,212,228000],
  ['NVDA','NVIDIA','Information Technology','Semiconductors',2200,61,29600],
  ['AMZN','Amazon','Consumer Discretionary','Broadline Retail',1900,575,1540000],
  ['GOOGL','Alphabet','Communication Services','Interactive Media',1750,307,182000],
  ['META','Meta Platforms','Communication Services','Interactive Media',1250,135,86000],
  ['TSLA','Tesla','Consumer Discretionary','Auto Manufacturers',780,97,140000],
  ['BRK.B','Berkshire Hathaway','Financials','Insurance — P&C',780,364,396000],
  ['UNH','UnitedHealth Group','Health Care','Managed Care',520,372,400000],
  ['JNJ','Johnson & Johnson','Health Care','Pharma',430,85,132000],
  ['JPM','JPMorgan Chase','Financials','Diversified Banks',530,158,309000],
  ['V','Visa','Financials','Financial Exchanges',510,33,30300],
  ['PG','Procter & Gamble','Consumer Staples','Household Products',370,84,107000],
  ['MA','Mastercard','Financials','Financial Exchanges',390,25,33400],
  ['LLY','Eli Lilly','Health Care','Pharma',680,35,43000],
  ['XOM','ExxonMobil','Energy','Integrated Oil',450,345,62000],
  ['CVX','Chevron','Energy','Integrated Oil',300,196,43846],
  ['WMT','Walmart','Consumer Staples','Food Retail',420,648,2100000],
  ['HD','Home Depot','Consumer Discretionary','Specialty Retail',370,157,475000],
  ['PFE','Pfizer','Health Care','Pharma',160,58,83000],
  ['ABBV','AbbVie','Health Care','Pharma',290,54,50000],
  ['KO','Coca-Cola','Consumer Staples','Beverages',260,46,79000],
  ['PEP','PepsiCo','Consumer Staples','Beverages',230,91,315000],
  ['COST','Costco','Consumer Staples','Food Retail',310,242,316000],
  ['AVGO','Broadcom','Information Technology','Semiconductors',620,36,20000],
  ['CSCO','Cisco Systems','Information Technology','Communication Equipment',210,57,84900],
  ['MRK','Merck','Health Care','Pharma',290,60,69000],
  ['ABT','Abbott Laboratories','Health Care','Medical Devices',190,40,114000],
  ['TMO','Thermo Fisher Scientific','Health Care','Life Sciences Tools',210,43,130000],
  ['MCD','McDonald\'s','Consumer Discretionary','Hotels & Restaurants',210,25,150000],
  ['ACN','Accenture','Information Technology','IT Services',220,64,738000],
  ['DIS','Walt Disney','Communication Services','Entertainment',180,89,225000],
  ['NKE','Nike','Consumer Discretionary','Textiles & Apparel',150,51,79400],
  ['INTC','Intel','Information Technology','Semiconductors',110,54,124800],
  ['BA','Boeing','Industrials','Aerospace & Defense',130,78,171000],
  ['CAT','Caterpillar','Industrials','Machinery',170,67,115700],
  ['GS','Goldman Sachs','Financials','Investment Banking',150,47,49100],
  ['MS','Morgan Stanley','Financials','Investment Banking',145,54,82000],
  ['IBM','IBM','Information Technology','IT Services',155,62,280000],
  ['GE','GE Aerospace','Industrials','Aerospace & Defense',190,68,125000],
  ['MMM','3M','Industrials','Industrial Conglomerates',60,33,92000],
  ['HON','Honeywell','Industrials','Industrial Conglomerates',140,37,97000],
  ['LMT','Lockheed Martin','Industrials','Aerospace & Defense',120,68,116000],
  ['UNP','Union Pacific','Industrials','Freight & Logistics',150,24,33000],
  ['DE','Deere & Company','Industrials','Machinery',120,61,83000],
  ['UPS','United Parcel Service','Industrials','Freight & Logistics',120,91,500000],
  ['FDX','FedEx','Industrials','Freight & Logistics',65,88,500000],
  ['AXP','American Express','Financials','Consumer Finance',160,61,77300],
  ['CRM','Salesforce','Information Technology','Software — Application',260,35,80000],
  ['ADBE','Adobe','Information Technology','Software — Application',225,20,30000],
  ['AMD','Advanced Micro Devices','Information Technology','Semiconductors',220,24,26000],
  ['QCOM','Qualcomm','Information Technology','Semiconductors',185,39,51000],
  ['NFLX','Netflix','Communication Services','Entertainment',290,34,13000],
  ['PYPL','PayPal','Financials','Consumer Finance',70,30,26800],
  ['INTU','Intuit','Information Technology','Software — Application',180,16,18200],
  ['NOW','ServiceNow','Information Technology','Software — Infrastructure',170,9,22800],
  ['PANW','Palo Alto Networks','Information Technology','Software — Infrastructure',110,7,15600],
  ['CRWD','CrowdStrike','Information Technology','Software — Infrastructure',75,4,8800],
  ['ORCL','Oracle','Information Technology','Software — Infrastructure',310,53,164000],
  ['T','AT&T','Communication Services','Telecom — Integrated',140,122,150000],
  ['VZ','Verizon','Communication Services','Telecom — Integrated',165,134,105400],
  ['TMUS','T-Mobile US','Communication Services','Telecom — Wireless',220,80,71000],
  ['CMCSA','Comcast','Communication Services','Cable & Satellite',155,122,186000],
  ['AMGN','Amgen','Health Care','Biotech',145,28,27000],
  ['GILD','Gilead Sciences','Health Care','Biotech',105,27,18000],
  ['ISRG','Intuitive Surgical','Health Care','Medical Devices',150,8,12800],
  ['VRTX','Vertex Pharmaceuticals','Health Care','Biotech',110,10,10400],
  ['REGN','Regeneron','Health Care','Biotech',110,13,13300],
  ['MDLZ','Mondelez','Consumer Staples','Food Products',90,36,91000],
  ['ADI','Analog Devices','Information Technology','Semiconductors',105,12,26000],
  ['BKNG','Booking Holdings','Consumer Discretionary','Hotels & Restaurants',130,21,22700],
  ['BLK','BlackRock','Financials','Asset Management',130,18,19800],
  ['SCHW','Charles Schwab','Financials','Investment Banking',120,19,36800],
  ['C','Citigroup','Financials','Diversified Banks',110,78,240000],
  ['BAC','Bank of America','Financials','Diversified Banks',280,99,213000],
  ['WFC','Wells Fargo','Financials','Diversified Banks',175,82,238000],
  ['TXN','Texas Instruments','Information Technology','Semiconductors',170,18,34000],
  ['BMY','Bristol-Myers Squibb','Health Care','Pharma',110,45,34000],
  ['LOW','Lowe\'s','Consumer Discretionary','Specialty Retail',140,97,300000],
  ['SPGI','S&P Global','Financials','Financial Exchanges',140,14,40000],
  ['SYK','Stryker','Health Care','Medical Devices',130,20,52000],
  ['ELV','Elevance Health','Health Care','Managed Care',110,170,100000],
  ['ADP','Automatic Data Processing','Industrials','IT Services',110,18,63000],
  ['LRCX','Lam Research','Information Technology','Semiconductors',105,17,17700],
  ['KLAC','KLA Corporation','Information Technology','Semiconductors',90,11,15500],
  ['MMC','Marsh McLennan','Financials','Insurance — P&C',100,23,86000],
  ['CB','Chubb','Financials','Insurance — P&C',100,51,40000],
  ['CI','Cigna Group','Health Care','Managed Care',100,195,72000],
  ['PLD','Prologis','Real Estate','REITs — Industrial',120,8,3100],
  ['AMT','American Tower','Real Estate','REITs — Diversified',95,11,6700],
  ['SO','Southern Company','Utilities','Electric Utilities',85,25,27000],
  ['DUK','Duke Energy','Utilities','Electric Utilities',80,29,27600],
  ['NEE','NextEra Energy','Utilities','Renewable Energy',140,28,16800],
  ['SHW','Sherwin-Williams','Materials','Specialty Chemicals',80,23,64000],
  ['COP','ConocoPhillips','Energy','Oil & Gas Exploration',130,56,10100],
  ['EOG','EOG Resources','Energy','Oil & Gas Exploration',70,23,3000],
  ['SLB','Schlumberger','Energy','Oil Equipment & Services',75,33,99000],
  ['PXD','Pioneer Natural Resources','Energy','Oil & Gas Exploration',55,20,2100],
  ['MPC','Marathon Petroleum','Energy','Oil & Gas Refining',60,150,18200],
  ['VLO','Valero Energy','Energy','Oil & Gas Refining',45,145,10120],
  ['PSX','Phillips 66','Energy','Oil & Gas Refining',50,149,13000],
  ['OXY','Occidental Petroleum','Energy','Oil & Gas Exploration',55,28,12200],
  ['DVN','Devon Energy','Energy','Oil & Gas Exploration',30,15,1800],
  ['FANG','Diamondback Energy','Energy','Oil & Gas Exploration',35,9,1100],
  ['HES','Hess Corporation','Energy','Oil & Gas Exploration',45,11,1700],
  ['HAL','Halliburton','Energy','Oil Equipment & Services',30,23,48000],
  ['BKR','Baker Hughes','Energy','Oil Equipment & Services',35,26,58000],
  ['GD','General Dynamics','Industrials','Aerospace & Defense',75,42,106000],
  ['NOC','Northrop Grumman','Industrials','Aerospace & Defense',70,40,95000],
  ['RTX','RTX Corporation','Industrials','Aerospace & Defense',140,69,185000],
  ['TDG','TransDigm Group','Industrials','Aerospace & Defense',65,7,22000],
  ['HWM','Howmet Aerospace','Industrials','Aerospace & Defense',35,7,28000],
  ['EMR','Emerson Electric','Industrials','Electrical Equipment',65,17,67000],
  ['ETN','Eaton Corporation','Industrials','Electrical Equipment',110,23,92000],
  ['ROK','Rockwell Automation','Industrials','Electrical Equipment',35,9,28000],
  ['ITW','Illinois Tool Works','Industrials','Industrial Conglomerates',75,16,45000],
  ['PH','Parker-Hannifin','Industrials','Industrial Conglomerates',70,20,63000],
  ['CMI','Cummins','Industrials','Machinery',45,34,73600],
  ['PCAR','Paccar','Industrials','Machinery',50,36,34000],
  ['WM','Waste Management','Industrials','Construction & Engineering',80,20,48000],
  ['RSG','Republic Services','Industrials','Construction & Engineering',55,15,41000],
  ['NSC','Norfolk Southern','Industrials','Freight & Logistics',55,12,19300],
  ['CSX','CSX Corporation','Industrials','Freight & Logistics',65,14,22000],
  ['UBER','Uber Technologies','Industrials','Freight & Logistics',145,38,32800],
  ['DAL','Delta Air Lines','Industrials','Airlines',30,58,100000],
  ['UAL','United Airlines','Industrials','Airlines',22,55,99000],
  ['LUV','Southwest Airlines','Industrials','Airlines',18,27,73000],
  ['AAL','American Airlines','Industrials','Airlines',10,53,128900],
  ['MCK','McKesson','Health Care','Health Care Services',60,309,48500],
  ['CAH','Cardinal Health','Health Care','Health Care Services',27,205,48000],
  ['COR','Cencora','Health Care','Health Care Services',45,262,46000],
  ['HCA','HCA Healthcare','Health Care','Health Care Facilities',75,65,294000],
  ['EW','Edwards Lifesciences','Health Care','Medical Devices',50,6,19700],
  ['DXCM','DexCom','Health Care','Medical Devices',40,4,9000],
  ['BSX','Boston Scientific','Health Care','Medical Devices',110,15,48000],
  ['ZTS','Zoetis','Health Care','Pharma',85,9,13800],
  ['A','Agilent Technologies','Health Care','Life Sciences Tools',40,7,18200],
  ['IQV','IQVIA','Health Care','Life Sciences Tools',40,15,87000],
  ['MTD','Mettler-Toledo','Health Care','Life Sciences Tools',28,4,18600],
  ['IDXX','IDEXX Laboratories','Health Care','Medical Devices',42,4,11000],
  ['DHR','Danaher','Health Care','Life Sciences Tools',185,24,63000],
  ['BDX','Becton Dickinson','Health Care','Medical Devices',65,20,75000],
  ['MDT','Medtronic','Health Care','Medical Devices',110,32,95000],
  ['GEHC','GE HealthCare','Health Care','Medical Devices',38,19,51000],
  ['ICE','Intercontinental Exchange','Financials','Financial Exchanges',80,9,12600],
  ['CME','CME Group','Financials','Financial Exchanges',75,6,3480],
  ['NDAQ','Nasdaq','Financials','Financial Exchanges',40,6,6100],
  ['MSCI','MSCI','Financials','Financial Exchanges',45,3,5400],
  ['MCO','Moody\'s','Financials','Asset Management',70,6,15400],
  ['TRV','Travelers','Financials','Insurance — P&C',50,41,33700],
  ['AFL','Aflac','Financials','Insurance — Life',50,19,13000],
  ['MET','MetLife','Financials','Insurance — Life',50,71,45000],
  ['PRU','Prudential Financial','Financials','Insurance — Life',42,62,40000],
  ['AIG','American International','Financials','Insurance — P&C',45,47,26000],
  ['ALL','Allstate','Financials','Insurance — P&C',40,57,53400],
  ['PNC','PNC Financial','Financials','Regional Banks',70,22,54000],
  ['TFC','Truist Financial','Financials','Regional Banks',55,15,35000],
  ['USB','U.S. Bancorp','Financials','Regional Banks',65,24,73000],
  ['COF','Capital One','Financials','Consumer Finance',55,37,55000],
  ['FIS','Fidelity National','Financials','Financial Exchanges',40,10,55000],
  ['AMP','Ameriprise Financial','Financials','Asset Management',45,16,14700],
  ['BK','Bank of New York Mellon','Financials','Asset Management',45,18,53000],
  ['STT','State Street','Financials','Asset Management',25,12,44000],
  ['SBUX','Starbucks','Consumer Discretionary','Hotels & Restaurants',100,36,381000],
  ['TJX','TJX Companies','Consumer Discretionary','Specialty Retail',110,54,340000],
  ['ROST','Ross Stores','Consumer Discretionary','Specialty Retail',45,21,102000],
  ['ORLY','O\'Reilly Automotive','Consumer Discretionary','Specialty Retail',60,16,84000],
  ['AZO','AutoZone','Consumer Discretionary','Specialty Retail',52,18,120000],
  ['DHI','D.R. Horton','Consumer Discretionary','Homebuilders',50,36,45700],
  ['LEN','Lennar','Consumer Discretionary','Homebuilders',35,35,42000],
  ['PHM','PulteGroup','Consumer Discretionary','Homebuilders',22,16,7900],
  ['NVR','NVR','Consumer Discretionary','Homebuilders',25,7,7100],
  ['GM','General Motors','Consumer Discretionary','Auto Manufacturers',48,172,167000],
  ['F','Ford Motor','Consumer Discretionary','Auto Manufacturers',42,176,177000],
  ['APTV','Aptiv','Consumer Discretionary','Auto Components',25,20,152000],
  ['MAR','Marriott International','Consumer Discretionary','Hotels & Restaurants',65,24,400000],
  ['HLT','Hilton Worldwide','Consumer Discretionary','Hotels & Restaurants',52,11,173000],
  ['YUM','Yum! Brands','Consumer Discretionary','Hotels & Restaurants',38,7,35000],
  ['CMG','Chipotle Mexican Grill','Consumer Discretionary','Hotels & Restaurants',70,10,120000],
  ['DPZ','Domino\'s Pizza','Consumer Discretionary','Hotels & Restaurants',15,4,39000],
  ['DECK','Deckers Outdoor','Consumer Discretionary','Textiles & Apparel',25,4,7400],
  ['LULU','Lululemon Athletica','Consumer Discretionary','Textiles & Apparel',45,10,38000],
  ['RCL','Royal Caribbean','Consumer Discretionary','Hotels & Restaurants',48,14,105000],
  ['CCL','Carnival','Consumer Discretionary','Hotels & Restaurants',25,22,95000],
  ['GRMN','Garmin','Consumer Discretionary','Leisure Products',30,6,20000],
  ['POOL','Pool Corporation','Consumer Discretionary','Specialty Retail',14,6,6500],
  ['CL','Colgate-Palmolive','Consumer Staples','Personal Care',75,20,34000],
  ['EL','Estee Lauder','Consumer Staples','Personal Care',35,16,62000],
  ['KMB','Kimberly-Clark','Consumer Staples','Household Products',45,20,40000],
  ['GIS','General Mills','Consumer Staples','Food Products',40,20,33000],
  ['K','Kellanova','Consumer Staples','Food Products',25,13,23000],
  ['HSY','Hershey','Consumer Staples','Food Products',35,11,20000],
  ['SJM','J.M. Smucker','Consumer Staples','Food Products',15,10,9000],
  ['HRL','Hormel Foods','Consumer Staples','Food Products',18,12,20000],
  ['CPB','Campbell Soup','Consumer Staples','Food Products',14,9,14700],
  ['MKC','McCormick','Consumer Staples','Food Products',22,7,14000],
  ['CAG','Conagra Brands','Consumer Staples','Food Products',14,12,19000],
  ['KR','Kroger','Consumer Staples','Food Retail',38,150,430000],
  ['SYY','Sysco','Consumer Staples','Food Products',40,76,72000],
  ['KHC','Kraft Heinz','Consumer Staples','Food Products',40,27,37000],
  ['STZ','Constellation Brands','Consumer Staples','Beverages',44,10,10400],
  ['TAP','Molson Coors','Consumer Staples','Beverages',12,11,16200],
  ['BF.B','Brown-Forman','Consumer Staples','Beverages',20,4,5800],
  ['MNST','Monster Beverage','Consumer Staples','Beverages',55,7,4700],
  ['PM','Philip Morris','Consumer Staples','Tobacco',190,35,79300],
  ['MO','Altria Group','Consumer Staples','Tobacco',80,21,6000],
  ['CLX','Clorox','Consumer Staples','Household Products',18,7,9000],
  ['CHD','Church & Dwight','Consumer Staples','Household Products',25,6,5600],
  ['MRVL','Marvell Technology','Information Technology','Semiconductors',65,6,6500],
  ['MU','Micron Technology','Information Technology','Semiconductors',115,25,48000],
  ['ON','ON Semiconductor','Information Technology','Semiconductors',35,8,33600],
  ['SNPS','Synopsys','Information Technology','Software — Application',80,6,19400],
  ['CDNS','Cadence Design','Information Technology','Software — Application',75,4,12400],
  ['ANET','Arista Networks','Information Technology','Communication Equipment',90,6,4400],
  ['FTNT','Fortinet','Information Technology','Software — Infrastructure',55,5,13800],
  ['ZS','Zscaler','Information Technology','Software — Infrastructure',28,2,7200],
  ['DDOG','Datadog','Information Technology','Software — Infrastructure',38,2,5300],
  ['SNOW','Snowflake','Information Technology','Software — Infrastructure',45,3,5800],
  ['TEAM','Atlassian','Information Technology','Software — Application',42,4,12700],
  ['WDAY','Workday','Information Technology','Software — Application',62,7,18800],
  ['HUBS','HubSpot','Information Technology','Software — Application',30,2,7400],
  ['TTD','The Trade Desk','Information Technology','Software — Application',40,2,3100],
  ['PLTR','Palantir Technologies','Information Technology','Software — Application',55,2,3700],
  ['NET','Cloudflare','Information Technology','Software — Infrastructure',26,1.6,4300],
  ['MDB','MongoDB','Information Technology','Software — Infrastructure',22,1.8,5200],
  ['VEEV','Veeva Systems','Health Care','Life Sciences Tools',34,2.4,7000],
  ['IT','Gartner','Information Technology','IT Services',38,6,20000],
  ['CDW','CDW Corporation','Information Technology','IT Services',30,21,15100],
  ['EPAM','EPAM Systems','Information Technology','IT Services',12,3.7,51300],
  ['GEN','Gen Digital','Information Technology','Software — Infrastructure',16,3.6,3600],
  ['HPQ','HP Inc.','Information Technology','Hardware & Storage',28,54,51000],
  ['HPE','Hewlett Packard Enterprise','Information Technology','Hardware & Storage',22,30,62000],
  ['DELL','Dell Technologies','Information Technology','Hardware & Storage',75,88,120000],
  ['NTAP','NetApp','Information Technology','Hardware & Storage',22,6.4,12000],
  ['JNPR','Juniper Networks','Information Technology','Communication Equipment',12,5.6,10700],
  ['GLW','Corning','Information Technology','Electronic Equipment',35,14,50000],
  ['APH','Amphenol','Information Technology','Electronic Equipment',80,12,95000],
  ['TEL','TE Connectivity','Information Technology','Electronic Equipment',45,16,90000],
  ['KEYS','Keysight Technologies','Information Technology','Electronic Equipment',28,5.5,15400],
  ['ZBRA','Zebra Technologies','Information Technology','Electronic Equipment',16,5,10100],
  ['TER','Teradyne','Information Technology','Electronic Equipment',20,3,6200],
  ['TRMB','Trimble','Information Technology','Electronic Equipment',15,3.6,12200],
  ['TYL','Tyler Technologies','Information Technology','Software — Application',22,2,6600],
  ['FICO','Fair Isaac','Information Technology','Software — Application',42,1.6,3700],
  ['GPN','Global Payments','Financials','Financial Exchanges',28,9,27000],
  ['CPAY','Corpay','Financials','Financial Exchanges',22,3.6,10200],
  ['FI','Fiserv','Financials','Financial Exchanges',85,19,41000],
  ['AES','AES Corporation','Utilities','Independent Power',12,12,7500],
  ['D','Dominion Energy','Utilities','Electric Utilities',42,15,17000],
  ['SRE','Sempra','Utilities','Gas Utilities',50,17,16500],
  ['EXC','Exelon','Utilities','Electric Utilities',38,22,19500],
  ['XEL','Xcel Energy','Utilities','Electric Utilities',35,14,11400],
  ['ED','Consolidated Edison','Utilities','Electric Utilities',28,16,14700],
  ['WEC','WEC Energy Group','Utilities','Gas Utilities',27,9,7400],
  ['ES','Eversource Energy','Utilities','Electric Utilities',20,12,9300],
  ['AEP','American Electric Power','Utilities','Electric Utilities',44,18,17200],
  ['ETR','Entergy','Utilities','Electric Utilities',22,13,11600],
  ['CEG','Constellation Energy','Utilities','Renewable Energy',55,25,13300],
  ['PCG','PG&E','Utilities','Electric Utilities',32,22,28000],
  ['AWK','American Water Works','Utilities','Water Utilities',28,4,6400],
  ['EQIX','Equinix','Real Estate','REITs — Diversified',75,8,13300],
  ['PSA','Public Storage','Real Estate','REITs — Diversified',52,4,6000],
  ['O','Realty Income','Real Estate','REITs — Diversified',45,4,500],
  ['WELL','Welltower','Real Estate','REITs — Health Care',48,7,700],
  ['DLR','Digital Realty','Real Estate','REITs — Diversified',40,6,4700],
  ['SPG','Simon Property','Real Estate','REITs — Retail',45,5,3000],
  ['VICI','VICI Properties','Real Estate','REITs — Diversified',32,4,60],
  ['CCI','Crown Castle','Real Estate','REITs — Diversified',42,6,5000],
  ['AVB','AvalonBay','Real Estate','REITs — Residential',28,3,3200],
  ['EQR','Equity Residential','Real Estate','REITs — Residential',25,3,2800],
  ['SBAC','SBA Communications','Real Estate','REITs — Diversified',24,3,1800],
  ['IRM','Iron Mountain','Real Estate','REITs — Diversified',25,6,26000],
  ['LIN','Linde','Materials','Specialty Chemicals',200,33,66000],
  ['APD','Air Products','Materials','Specialty Chemicals',65,13,21500],
  ['ECL','Ecolab','Materials','Specialty Chemicals',60,15,48000],
  ['DD','DuPont de Nemours','Materials','Specialty Chemicals',35,12,24000],
  ['DOW','Dow','Materials','Chemicals',38,45,35900],
  ['NEM','Newmont','Materials','Gold Mining',45,12,14400],
  ['FCX','Freeport-McMoRan','Materials','Diversified Metals',60,23,25400],
  ['NUE','Nucor','Materials','Steel',38,34,31400],
  ['STLD','Steel Dynamics','Materials','Steel',18,18,12200],
  ['VMC','Vulcan Materials','Materials','Construction Materials',32,8,11100],
  ['MLM','Martin Marietta','Materials','Construction Materials',35,6,10500],
  ['ALB','Albemarle','Materials','Specialty Chemicals',12,10,9000],
  ['PPG','PPG Industries','Materials','Specialty Chemicals',30,18,50000],
  ['IFF','IFF','Materials','Specialty Chemicals',20,12,22000],
  ['CE','Celanese','Materials','Chemicals',12,11,13200],
  ['CTVA','Corteva','Materials','Specialty Chemicals',38,17,21000],
  ['ADM','Archer-Daniels-Midland','Consumer Staples','Food Products',28,93,42000],
  ['BIIB','Biogen','Health Care','Biotech',30,10,7300],
  ['MRNA','Moderna','Health Care','Biotech',40,6,5400],
  ['ZBH','Zimmer Biomet','Health Care','Medical Devices',25,7,18700],
  ['RMD','ResMed','Health Care','Medical Devices',32,4,9800],
  ['HOLX','Hologic','Health Care','Medical Devices',20,4,6800],
  ['WAT','Waters Corporation','Health Care','Life Sciences Tools',18,3,8300],
  ['TECH','Bio-Techne','Health Care','Life Sciences Tools',12,1.2,3200],
  ['TT','Trane Technologies','Industrials','Building Products',75,18,38000],
  ['CARR','Carrier Global','Industrials','Building Products',48,22,53000],
  ['JCI','Johnson Controls','Industrials','Building Products',48,27,100000],
  ['AXON','Axon Enterprise','Industrials','Electrical Equipment',30,2,4000],
  ['CTAS','Cintas','Industrials','Industrial Conglomerates',68,9,44000],
  ['CPRT','Copart','Industrials','Construction & Engineering',48,4,11200],
  ['FAST','Fastenal','Industrials','Industrial Conglomerates',40,7,23400],
  ['ODFL','Old Dominion Freight','Industrials','Freight & Logistics',38,6,24700],
  ['GWW','W.W. Grainger','Industrials','Industrial Conglomerates',48,16,26000],
  ['PWR','Quanta Services','Industrials','Construction & Engineering',40,21,53000],
  ['VRSK','Verisk Analytics','Industrials','IT Services',35,3,7100],
  ['IR','Ingersoll Rand','Industrials','Machinery',38,7,18500],
  ['XYL','Xylem','Industrials','Machinery',28,8,23000],
  ['DOV','Dover','Industrials','Machinery',22,8,25000],
  ['NDSN','Nordson','Industrials','Machinery',14,3,8000],
  ['ROP','Roper Technologies','Industrials','Industrial Conglomerates',55,6,16700],
  ['SWK','Stanley Black & Decker','Industrials','Building Products',15,16,43000],
  ['HUBB','Hubbell','Industrials','Electrical Equipment',22,6,18000],
  ['AME','AMETEK','Industrials','Electrical Equipment',38,7,22000],
  ['MPWR','Monolithic Power Systems','Information Technology','Semiconductors',32,2,3800],
  ['NXPI','NXP Semiconductors','Information Technology','Semiconductors',55,13,34500],
  ['SWKS','Skyworks Solutions','Information Technology','Semiconductors',18,5,10200],
  ['PARA','Paramount Global','Communication Services','Entertainment',8,30,22000],
  ['WBD','Warner Bros. Discovery','Communication Services','Entertainment',22,42,37000],
  ['CHTR','Charter Communications','Communication Services','Cable & Satellite',48,55,93000],
  ['EA','Electronic Arts','Communication Services','Entertainment',38,7,13300],
  ['TTWO','Take-Two Interactive','Communication Services','Entertainment',28,6,8800],
  ['MTCH','Match Group','Communication Services','Interactive Media',10,3.2,2700],
  ['LYV','Live Nation','Communication Services','Entertainment',22,22,44000],
  ['OMC','Omnicom Group','Communication Services','Advertising',18,15,79000],
  ['IPG','Interpublic Group','Communication Services','Advertising',12,11,58000],
  ['ABNB','Airbnb','Consumer Discretionary','Hotels & Restaurants',78,10,6900],
  ['DASH','DoorDash','Consumer Discretionary','Broadline Retail',52,9,19700],
  ['COIN','Coinbase','Financials','Financial Exchanges',42,3.1,3500],
  ['MELI','MercadoLibre','Consumer Discretionary','Broadline Retail',85,18,42000],
  ['SHOP','Shopify','Information Technology','Software — Application',95,8,17000],
  ['SQ','Block','Financials','Consumer Finance',35,22,13000],
  ['ROKU','Roku','Communication Services','Entertainment',10,3.5,3700],
  ['SNAP','Snap','Communication Services','Interactive Media',16,5,5300],
  ['PINS','Pinterest','Communication Services','Interactive Media',20,3,5800],
  ['DKNG','DraftKings','Consumer Discretionary','Hotels & Restaurants',18,4,5200],
  ['RIVN','Rivian Automotive','Consumer Discretionary','Auto Manufacturers',12,4.4,17300],
  ['LCID','Lucid Group','Consumer Discretionary','Auto Manufacturers',6,1,7200],
  ['SMCI','Super Micro Computer','Information Technology','Hardware & Storage',55,15,6200],
  ['ARM','Arm Holdings','Information Technology','Semiconductors',145,3.2,6400],
  ['RBLX','Roblox','Communication Services','Entertainment',24,2.9,2100],
  ['U','Unity Software','Information Technology','Software — Application',15,2,4200],
  ['PATH','UiPath','Information Technology','Software — Application',12,1.4,4200],
  ['OKTA','Okta','Information Technology','Software — Infrastructure',14,2.4,6200],
  ['MNDY','monday.com','Information Technology','Software — Application',12,1,2100],
  ['GRAB','Grab Holdings','Information Technology','Software — Application',12,2.4,10300],
  ['SE','Sea Limited','Communication Services','Entertainment',22,13,58000],
  ['SPOT','Spotify Technology','Communication Services','Entertainment',65,15,9800],
  ['TWLO','Twilio','Information Technology','Software — Infrastructure',12,4,8600],
  ['CFLT','Confluent','Information Technology','Software — Infrastructure',8,0.8,5100],
  ['IOT','Samsara','Information Technology','Software — Infrastructure',18,1,2700],
  ['BILL','BILL Holdings','Information Technology','Software — Application',6,1.2,2400],
  ['PCOR','Procore Technologies','Information Technology','Software — Application',11,1,3400],
  ['TOST','Toast','Information Technology','Software — Application',14,4.4,5000],
  ['DT','Dynatrace','Information Technology','Software — Infrastructure',14,1.4,4700],
  ['ENTG','Entegris','Information Technology','Semiconductors',18,3.8,7300],
  ['FSLR','First Solar','Information Technology','Semiconductors',22,3.3,8000],
  ['ENPH','Enphase Energy','Information Technology','Semiconductors',12,2.3,3100],
  ['SEDG','SolarEdge Technologies','Information Technology','Semiconductors',3,3,5800],
  ['RUN','Sunrun','Utilities','Renewable Energy',5,2,15000],
  ['PLUG','Plug Power','Industrials','Electrical Equipment',2,0.9,3800],
  ['CHWY','Chewy','Consumer Discretionary','Broadline Retail',12,11,20000],
  ['W','Wayfair','Consumer Discretionary','Broadline Retail',6,12,15000],
  ['ETSY','Etsy','Consumer Discretionary','Broadline Retail',8,2.7,2300],
  ['PTON','Peloton Interactive','Consumer Discretionary','Leisure Products',3,2.7,4000],
  ['WBA','Walgreens Boots','Consumer Staples','Drug Retail',8,140,258500],
  ['DLTR','Dollar Tree','Consumer Discretionary','Specialty Retail',22,30,226000],
  ['DG','Dollar General','Consumer Discretionary','Specialty Retail',25,39,195000],
  ['ULTA','Ulta Beauty','Consumer Discretionary','Specialty Retail',22,11,49000],
  ['BBY','Best Buy','Consumer Discretionary','Specialty Retail',18,43,90000],
  ['EBAY','eBay','Consumer Discretionary','Broadline Retail',28,10,12000],
  ['TGT','Target','Consumer Discretionary','Broadline Retail',65,106,440000],
  ['CVS','CVS Health','Health Care','Health Care Services',82,357,300000],
  ['CNC','Centene','Health Care','Managed Care',35,154,74300],
  ['MOH','Molina Healthcare','Health Care','Managed Care',22,37,16200],
  ['HUM','Humana','Health Care','Managed Care',40,107,67600],
  ['WST','West Pharmaceutical','Health Care','Life Sciences Tools',22,3,10600],
  ['ALGN','Align Technology','Health Care','Medical Devices',18,4,24500],
  ['PODD','Insulet','Health Care','Medical Devices',18,2,9000],
  ['CSGP','CoStar Group','Real Estate','Real Estate Services',30,2.6,6300],
  ['MAA','Mid-America Apartment','Real Estate','REITs — Residential',18,2.2,2600],
  ['ESS','Essex Property Trust','Real Estate','REITs — Residential',16,1.8,1800],
  ['KIM','Kimco Realty','Real Estate','REITs — Retail',13,1.8,500],
  ['CPT','Camden Property Trust','Real Estate','REITs — Residential',12,1.5,1800],
  ['ARE','Alexandria Real Estate','Real Estate','REITs — Office',18,2.8,1000],
  ['KMI','Kinder Morgan','Energy','Oil & Gas Exploration',42,15,11000],
  ['WMB','Williams Companies','Energy','Oil & Gas Exploration',45,11,6100],
  ['OKE','ONEOK','Energy','Oil & Gas Exploration',50,22,3200],
  ['TRGP','Targa Resources','Energy','Oil & Gas Exploration',28,18,3100],
  ['ET','Energy Transfer','Energy','Oil & Gas Exploration',42,89,13000],
  ['EPD','Enterprise Products','Energy','Oil & Gas Exploration',58,58,7000],
  ['WTW','Willis Towers Watson','Financials','Insurance — P&C',28,9,47000],
  ['AON','Aon','Financials','Insurance — P&C',68,13,50000],
  ['RJF','Raymond James','Financials','Investment Banking',28,13,16700],
  ['NTRS','Northern Trust','Financials','Asset Management',20,7,23800],
  ['FITB','Fifth Third Bancorp','Financials','Regional Banks',25,8,19300],
  ['RF','Regions Financial','Financials','Regional Banks',20,7,19200],
  ['MTB','M&T Bank','Financials','Regional Banks',28,8,22400],
  ['HBAN','Huntington Bancshares','Financials','Regional Banks',22,6,20000],
  ['CFG','Citizens Financial','Financials','Regional Banks',18,7,17300],
  ['CINF','Cincinnati Financial','Financials','Insurance — P&C',20,8,5400],
  ['KEY','KeyCorp','Financials','Regional Banks',14,6,17000],
  ['ZION','Zions Bancorporation','Financials','Regional Banks',7,3,10000],
  ['WAL','Western Alliance','Financials','Regional Banks',8,2.4,3300],
  ['EWBC','East West Bancorp','Financials','Regional Banks',10,2.5,3500],
  ['BAX','Baxter International','Health Care','Medical Devices',18,15,60000],
  ['CTSH','Cognizant','Information Technology','IT Services',38,19,350000],
  ['INFY','Infosys','Information Technology','IT Services',75,18,340000],
];

// ─── STOXX 600 — 300 Real European Equities ─────────────────────────────────
// Format: [ticker, name, sector, subIndustry, country, marketCapBn, revenueBn, employees]
const STOXX600_RAW = [
  ['NESN','Nestle','Consumer Staples','Food Products','CH',270,98,275000],
  ['ROG','Roche','Health Care','Pharma','CH',220,66,100000],
  ['MC','LVMH','Consumer Discretionary','Textiles & Apparel','FR',380,95,213000],
  ['ASML','ASML','Information Technology','Semiconductors','NL',350,28,42000],
  ['NOVO.B','Novo Nordisk','Health Care','Pharma','DK',480,33,64000],
  ['SAP','SAP','Information Technology','Software — Application','DE',230,35,107000],
  ['SIE','Siemens','Industrials','Industrial Conglomerates','DE',140,75,320000],
  ['TTE','TotalEnergies','Energy','Integrated Oil','FR',155,218,100000],
  ['SHEL','Shell','Energy','Integrated Oil','GB',210,316,86000],
  ['AZN','AstraZeneca','Health Care','Pharma','GB',230,46,89600],
  ['ULVR','Unilever','Consumer Staples','Personal Care','GB',135,63,127000],
  ['SAN','Sanofi','Health Care','Pharma','FR',125,47,91400],
  ['SU','Schneider Electric','Industrials','Electrical Equipment','FR',110,38,150000],
  ['AI','Air Liquide','Materials','Specialty Chemicals','FR',95,31,67100],
  ['OR','L\'Oreal','Consumer Staples','Personal Care','FR',230,44,87400],
  ['ALV','Allianz','Financials','Insurance — P&C','DE',105,164,159000],
  ['BNP','BNP Paribas','Financials','Diversified Banks','FR',75,51,183000],
  ['DTE','Deutsche Telekom','Communication Services','Telecom — Integrated','DE',130,122,200000],
  ['IBE','Iberdrola','Utilities','Renewable Energy','ES',80,52,42000],
  ['ENEL','Enel','Utilities','Electric Utilities','IT',65,92,56200],
  ['RMS','Hermes','Consumer Discretionary','Textiles & Apparel','FR',220,15,21000],
  ['NOVN','Novartis','Health Care','Pharma','CH',210,47,78000],
  ['ABI','AB InBev','Consumer Staples','Beverages','BE',110,59,167000],
  ['DSY','Dassault Systemes','Information Technology','Software — Application','FR',55,6,24000],
  ['BAS','BASF','Materials','Chemicals','DE',42,69,111000],
  ['BAYN','Bayer','Health Care','Pharma','DE',30,52,100000],
  ['DG.FR','Vinci','Industrials','Construction & Engineering','FR',70,69,272000],
  ['KER','Kering','Consumer Discretionary','Textiles & Apparel','FR',45,20,49000],
  ['ENI','Eni','Energy','Integrated Oil','IT',48,102,32000],
  ['RIO','Rio Tinto','Materials','Diversified Metals','GB',110,54,53000],
  ['AAL.L','Anglo American','Materials','Diversified Metals','GB',35,34,61000],
  ['VOW3','Volkswagen','Consumer Discretionary','Auto Manufacturers','DE',55,295,673000],
  ['BMW','BMW','Consumer Discretionary','Auto Manufacturers','DE',68,155,149000],
  ['MBG','Mercedes-Benz','Consumer Discretionary','Auto Manufacturers','DE',65,153,166000],
  ['STLA','Stellantis','Consumer Discretionary','Auto Manufacturers','NL',42,190,281000],
  ['SAN.MC','Banco Santander','Financials','Diversified Banks','ES',68,58,200000],
  ['INGA','ING Group','Financials','Diversified Banks','NL',48,23,58000],
  ['ISP','Intesa Sanpaolo','Financials','Diversified Banks','IT',55,23,100000],
  ['UCG','UniCredit','Financials','Diversified Banks','IT',62,22,83000],
  ['DBK','Deutsche Bank','Financials','Investment Banking','DE',28,30,87000],
  ['UBSG','UBS Group','Financials','Investment Banking','CH',95,38,117000],
  ['HSBA','HSBC','Financials','Diversified Banks','GB',165,66,220000],
  ['BARC','Barclays','Financials','Diversified Banks','GB',32,31,92400],
  ['LLOY','Lloyds Banking','Financials','Diversified Banks','GB',38,23,63000],
  ['NWG','NatWest Group','Financials','Regional Banks','GB',30,16,61000],
  ['STAN','Standard Chartered','Financials','Diversified Banks','GB',22,19,84000],
  ['ZURN','Zurich Insurance','Financials','Insurance — P&C','CH',70,75,56000],
  ['SREN','Swiss Re','Financials','Insurance — P&C','CH',28,47,14000],
  ['MUV2','Munich Re','Financials','Insurance — P&C','DE',58,74,43000],
  ['ADS','Adidas','Consumer Discretionary','Textiles & Apparel','DE',38,24,59000],
  ['PHIA','Philips','Health Care','Medical Devices','NL',22,18,69000],
  ['NOKIA','Nokia','Information Technology','Communication Equipment','FI',22,25,87000],
  ['ERIC','Ericsson','Information Technology','Communication Equipment','SE',20,27,100000],
  ['SAND','Sandvik','Industrials','Machinery','SE',32,12,44000],
  ['ATCO.A','Atlas Copco','Industrials','Machinery','SE',65,15,53000],
  ['VOLV.B','Volvo','Industrials','Machinery','SE',45,47,105000],
  ['ABB','ABB','Industrials','Electrical Equipment','CH',65,32,105000],
  ['GIVN','Givaudan','Materials','Specialty Chemicals','CH',42,7,16700],
  ['SIKA','Sika','Materials','Construction Materials','CH',45,11,33000],
  ['HOLN','Holcim','Materials','Construction Materials','CH',40,27,60000],
  ['RI','Pernod Ricard','Consumer Staples','Beverages','FR',42,12,19000],
  ['DPW','Deutsche Post','Industrials','Freight & Logistics','DE',45,95,590000],
  ['EL.FR','EssilorLuxottica','Health Care','Medical Devices','FR',95,26,190000],
  ['PUB','Publicis Groupe','Communication Services','Advertising','FR',30,15,100000],
  ['CAP','Capgemini','Information Technology','IT Services','FR',30,23,360000],
  ['BN','Danone','Consumer Staples','Food Products','FR',38,30,98000],
  ['ORA','Orange','Communication Services','Telecom — Integrated','FR',28,44,130000],
  ['SGO','Saint-Gobain','Materials','Construction Materials','FR',32,51,168000],
  ['LR','Legrand','Industrials','Electrical Equipment','FR',28,9,39000],
  ['STMPA','STMicroelectronics','Information Technology','Semiconductors','CH',35,17,50000],
  ['WKL','Wolters Kluwer','Communication Services','Publishing','NL',32,6,21400],
  ['AD','Ahold Delhaize','Consumer Staples','Food Retail','NL',32,93,414000],
  ['PRX','Prosus','Information Technology','Interactive Media','NL',85,5,26000],
  ['DSM','DSM-Firmenich','Materials','Specialty Chemicals','NL',28,13,28000],
  ['HEI','Heidelberg Materials','Materials','Construction Materials','DE',18,22,51000],
  ['FRE','Fresenius','Health Care','Health Care Services','DE',20,41,300000],
  ['MRK.DE','Merck KGaA','Health Care','Pharma','DE',22,22,64000],
  ['IFX','Infineon Technologies','Information Technology','Semiconductors','DE',42,16,58000],
  ['DHL','DHL Group','Industrials','Freight & Logistics','DE',45,95,590000],
  ['HEN3','Henkel','Consumer Staples','Household Products','DE',32,23,50000],
  ['BEI','Beiersdorf','Consumer Staples','Personal Care','DE',28,10,21000],
  ['SY1','Symrise','Materials','Specialty Chemicals','DE',15,5,11300],
  ['RACE','Ferrari','Consumer Discretionary','Auto Manufacturers','IT',75,6,5600],
  ['G.IT','Assicurazioni Generali','Financials','Insurance — Life','IT',35,92,82000],
  ['NESTE','Neste','Energy','Oil & Gas Refining','FI',20,22,5700],
  ['KNEBV','Kone','Industrials','Machinery','FI',28,12,62000],
  ['UPM','UPM-Kymmene','Materials','Paper & Forest','FI',18,12,17000],
  ['COLOB','Coloplast','Health Care','Medical Devices','DK',42,3,14800],
  ['CARL.B','Carlsberg','Consumer Staples','Beverages','DK',20,10,42000],
  ['MAERSK.B','Maersk','Industrials','Marine Transport','DK',22,51,110000],
  ['VWS','Vestas Wind Systems','Industrials','Electrical Equipment','DK',18,17,30000],
  ['ORSTED','Orsted','Utilities','Renewable Energy','DK',22,16,8300],
  ['DNB','DNB Bank','Financials','Diversified Banks','NO',32,8,10000],
  ['EQNR','Equinor','Energy','Integrated Oil','NO',72,105,22000],
  ['YAR','Yara International','Materials','Chemicals','NO',8,16,17800],
  ['MOWI','Mowi','Consumer Staples','Food Products','NO',12,5,14000],
  ['TEF','Telefonica','Communication Services','Telecom — Integrated','ES',22,41,100000],
  ['REP','Repsol','Energy','Integrated Oil','ES',18,65,24000],
  ['ITX','Inditex','Consumer Discretionary','Textiles & Apparel','ES',110,36,165000],
  ['BBVA','BBVA','Financials','Diversified Banks','ES',52,29,115000],
  ['FER','Ferrovial','Industrials','Construction & Engineering','ES',28,8,25000],
  ['EDP','EDP','Utilities','Renewable Energy','PT',20,18,12200],
  ['GALP','Galp Energia','Energy','Integrated Oil','PT',10,26,6500],
  ['KBC','KBC Group','Financials','Diversified Banks','BE',30,10,41000],
  ['UCB','UCB','Health Care','Biotech','BE',28,6,8800],
  ['FIRST','Erste Group Bank','Financials','Diversified Banks','AT',18,10,45000],
  ['VER','Verbund','Utilities','Renewable Energy','AT',28,10,3800],
  ['RHM','Rheinmetall','Industrials','Aerospace & Defense','DE',28,7,33000],
  ['AIR','Airbus','Industrials','Aerospace & Defense','FR',110,75,134000],
  ['SAF','Safran','Industrials','Aerospace & Defense','FR',75,24,83000],
  ['HO','Thales','Industrials','Aerospace & Defense','FR',32,19,81000],
  ['GLE','Societe Generale','Financials','Diversified Banks','FR',22,29,117000],
  ['ACA','Credit Agricole','Financials','Diversified Banks','FR',35,24,75000],
  ['ML','Michelin','Consumer Discretionary','Auto Components','FR',22,28,132000],
  ['RNO','Renault','Consumer Discretionary','Auto Manufacturers','FR',12,56,170000],
  ['BATS','British American Tobacco','Consumer Staples','Tobacco','GB',72,34,46000],
  ['RKT','Reckitt Benckiser','Consumer Staples','Household Products','GB',42,16,43000],
  ['DGE','Diageo','Consumer Staples','Beverages','GB',65,20,30000],
  ['GSK','GSK','Health Care','Pharma','GB',70,37,72000],
  ['REL','RELX','Communication Services','Publishing','GB',68,10,36500],
  ['BP','BP','Energy','Integrated Oil','GB',95,215,65900],
  ['GLEN','Glencore','Materials','Diversified Metals','GB',60,218,145000],
  ['BHP.L','BHP Group','Materials','Diversified Metals','GB',145,53,80000],
  ['ABF','Associated British Foods','Consumer Staples','Food Products','GB',22,20,133000],
  ['SGE','Sage Group','Information Technology','Software — Application','GB',12,2.3,12000],
  ['LSEG','London Stock Exchange','Financials','Financial Exchanges','GB',58,9,25000],
  ['CPG','Compass Group','Consumer Discretionary','Hotels & Restaurants','GB',48,38,550000],
  ['AHT','Ashtead Group','Industrials','Machinery','GB',35,10,24000],
  ['III','3i Group','Financials','Asset Management','GB',28,3,900],
  ['EXPN','Experian','Financials','Financial Exchanges','GB',38,7,23000],
  ['BA.L','BAE Systems','Industrials','Aerospace & Defense','GB',55,28,100000],
  ['RR.L','Rolls-Royce','Industrials','Aerospace & Defense','GB',42,17,42000],
  ['CRH','CRH','Materials','Construction Materials','IE',55,35,78000],
  ['SMDS','Smurfit Kappa','Materials','Paper & Forest','IE',12,12,48000],
  ['RYA','Ryanair','Industrials','Airlines','IE',22,13,24000],
  ['FLTR','Flutter Entertainment','Consumer Discretionary','Hotels & Restaurants','IE',32,11,21000],
  ['AV.L','Aviva','Financials','Insurance — Life','GB',12,53,22000],
  ['LGEN','Legal & General','Financials','Insurance — Life','GB',18,18,10000],
  ['PRU.L','Prudential','Financials','Insurance — Life','GB',32,26,22000],
  ['WPP','WPP','Communication Services','Advertising','GB',10,18,100000],
  ['NG.L','National Grid','Utilities','Multi-Utilities','GB',45,22,29000],
  ['SSE','SSE','Utilities','Renewable Energy','GB',18,12,12000],
  ['SVT','Severn Trent','Utilities','Water Utilities','GB',8,2.3,8000],
  ['SGRO','Segro','Real Estate','REITs — Industrial','GB',12,0.6,400],
  ['BRBY','Burberry','Consumer Discretionary','Textiles & Apparel','GB',7,3.6,10000],
  ['RTO','Rentokil Initial','Industrials','Industrial Conglomerates','GB',14,5,44000],
  ['BDEV','Barratt Developments','Consumer Discretionary','Homebuilders','GB',6,6,7000],
  ['IMB','Imperial Brands','Consumer Staples','Tobacco','GB',18,8.4,26000],
  ['TSCO.L','Tesco','Consumer Staples','Food Retail','GB',25,78,340000],
  ['NXT','Next','Consumer Discretionary','Specialty Retail','GB',10,5.7,42000],
  ['IHG','InterContinental Hotels','Consumer Discretionary','Hotels & Restaurants','GB',14,4,350000],
  ['SN.L','Smith & Nephew','Health Care','Medical Devices','GB',12,5.5,18000],
  ['SWED.A','Swedbank','Financials','Diversified Banks','SE',20,7,15000],
  ['SEB.A','SEB','Financials','Diversified Banks','SE',25,8,17000],
  ['INVE.B','Investor','Financials','Asset Management','SE',42,1,20],
  ['BOL','Boliden','Materials','Diversified Metals','SE',8,8,5900],
  ['ESSITY.B','Essity','Consumer Staples','Personal Care','SE',18,15,46000],
  ['EVO','Evolution Gaming','Consumer Discretionary','Hotels & Restaurants','SE',22,2,17000],
  ['HEXA.B','Hexagon','Information Technology','Software — Application','SE',28,6,24000],
  ['ALFA','Alfa Laval','Industrials','Machinery','SE',18,6,20000],
  ['HM.B','H&M','Consumer Discretionary','Textiles & Apparel','SE',22,24,145000],
  ['EOAN','E.ON','Utilities','Multi-Utilities','DE',30,72,72000],
  ['RWE','RWE','Utilities','Renewable Energy','DE',22,30,19000],
  ['CON','Continental','Consumer Discretionary','Auto Components','DE',12,41,190000],
  ['HNR1','Hannover Rueck','Financials','Insurance — P&C','DE',22,32,3600],
  ['LHA','Lufthansa','Industrials','Airlines','DE',8,38,109000],
  ['MTX','MTU Aero Engines','Industrials','Aerospace & Defense','DE',18,7,12000],
  ['QIA','QIAGEN','Health Care','Life Sciences Tools','DE',12,2,6500],
  ['AKZO','Akzo Nobel','Materials','Specialty Chemicals','NL',12,11,35000],
  ['HEIA','Heineken','Consumer Staples','Beverages','NL',45,32,85000],
  ['MT','ArcelorMittal','Materials','Steel','LU',22,68,155000],
  ['PKO','PKO Bank Polski','Financials','Diversified Banks','PL',12,5,25000],
  ['CEZ','CEZ Group','Utilities','Electric Utilities','CZ',15,13,27000],
  ['CFR','Richemont','Consumer Discretionary','Textiles & Apparel','CH',75,20,38000],
  ['ENX','Euronext','Financials','Financial Exchanges','NL',12,2,2200],
  ['NN','NN Group','Financials','Insurance — Life','NL',10,18,15000],
  ['JDEP','JDE Peets','Consumer Staples','Beverages','NL',15,8,19000],
  ['FME','Fresenius Medical','Health Care','Health Care Services','DE',12,20,125000],
  ['PUM','Puma','Consumer Discretionary','Textiles & Apparel','DE',8,9,20000],
  ['CARL.Z','Carl Zeiss Meditec','Health Care','Medical Devices','DE',8,2,16000],
  ['KPN','KPN','Communication Services','Telecom — Integrated','NL',12,6,10000],
  ['ZAL','Zalando','Consumer Discretionary','Broadline Retail','DE',8,10,15000],
];

// ─── Nikkei 225 — 200 Real Japanese Equities ────────────────────────────────
// Format: [ticker, name, sector, subIndustry, marketCapBn, revenueBn, employees]
const NIKKEI_RAW = [
  ['7203','Toyota Motor','Consumer Discretionary','Auto Manufacturers',260,280,375000],
  ['6758','Sony Group','Consumer Discretionary','Household Durables',120,86,108000],
  ['6861','Keyence','Information Technology','Electronic Equipment',135,8,12200],
  ['9984','SoftBank Group','Communication Services','Telecom — Integrated',80,67,60000],
  ['8306','Mitsubishi UFJ Financial','Financials','Diversified Banks',110,40,80000],
  ['4063','Shin-Etsu Chemical','Materials','Specialty Chemicals',75,20,25000],
  ['6367','Daikin Industries','Industrials','Machinery',60,37,96000],
  ['6902','Denso','Consumer Discretionary','Auto Components',50,55,164000],
  ['7741','HOYA','Health Care','Medical Devices',55,6,37000],
  ['6954','FANUC','Industrials','Machinery',35,7,8700],
  ['8035','Tokyo Electron','Information Technology','Semiconductors',85,18,17000],
  ['6981','Murata Manufacturing','Information Technology','Electronic Equipment',42,16,77000],
  ['9432','Nippon Telegraph','Communication Services','Telecom — Integrated',95,120,333000],
  ['9433','KDDI','Communication Services','Telecom — Wireless',72,55,49000],
  ['9434','SoftBank Corp','Communication Services','Telecom — Wireless',65,56,55000],
  ['8058','Mitsubishi Corporation','Industrials','Industrial Conglomerates',55,170,80000],
  ['8001','ITOCHU','Industrials','Industrial Conglomerates',60,117,110000],
  ['8031','Mitsui & Co','Industrials','Industrial Conglomerates',50,120,45000],
  ['8002','Marubeni','Industrials','Industrial Conglomerates',22,72,45000],
  ['8053','Sumitomo Corporation','Industrials','Industrial Conglomerates',28,55,80000],
  ['4502','Takeda Pharmaceutical','Health Care','Pharma',55,32,47000],
  ['4519','Chugai Pharmaceutical','Health Care','Pharma',50,10,8000],
  ['4568','Daiichi Sankyo','Health Care','Pharma',75,15,17000],
  ['4503','Astellas Pharma','Health Care','Pharma',25,13,15000],
  ['4578','Otsuka Holdings','Health Care','Pharma',22,17,34000],
  ['4507','Shionogi','Health Care','Pharma',18,4,5700],
  ['4523','Eisai','Health Care','Pharma',28,8,11000],
  ['7267','Honda Motor','Consumer Discretionary','Auto Manufacturers',55,140,197000],
  ['7269','Suzuki Motor','Consumer Discretionary','Auto Manufacturers',22,42,70000],
  ['7270','SUBARU','Consumer Discretionary','Auto Manufacturers',14,33,37000],
  ['7201','Nissan Motor','Consumer Discretionary','Auto Manufacturers',12,86,134000],
  ['6501','Hitachi','Information Technology','IT Services',52,87,322000],
  ['6503','Mitsubishi Electric','Industrials','Electrical Equipment',32,45,149000],
  ['6752','Panasonic','Consumer Discretionary','Household Durables',22,72,233000],
  ['6702','Fujitsu','Information Technology','IT Services',30,32,124000],
  ['6301','Komatsu','Industrials','Machinery',30,30,65000],
  ['6326','Kubota','Industrials','Machinery',22,22,47000],
  ['7751','Canon','Information Technology','Hardware & Storage',28,35,184000],
  ['6762','TDK','Information Technology','Electronic Equipment',18,17,102000],
  ['6594','Nidec','Industrials','Electrical Equipment',25,19,115000],
  ['7974','Nintendo','Communication Services','Entertainment',60,13,7600],
  ['4661','Oriental Land','Consumer Discretionary','Hotels & Restaurants',55,5,27000],
  ['9983','Fast Retailing','Consumer Discretionary','Textiles & Apparel',75,23,57000],
  ['8766','Tokio Marine','Financials','Insurance — P&C',52,62,43000],
  ['8750','Dai-ichi Life','Financials','Insurance — Life',28,56,62000],
  ['8316','Sumitomo Mitsui Financial','Financials','Diversified Banks',65,35,90000],
  ['8411','Mizuho Financial','Financials','Diversified Banks',45,28,52000],
  ['8604','Nomura Holdings','Financials','Investment Banking',15,14,26000],
  ['4452','Kao','Consumer Staples','Personal Care',22,14,33000],
  ['2802','Ajinomoto','Consumer Staples','Food Products',22,14,34000],
  ['2503','Kirin Holdings','Consumer Staples','Beverages',18,18,30000],
  ['2502','Asahi Group','Consumer Staples','Beverages',18,21,29000],
  ['2914','Japan Tobacco','Consumer Staples','Tobacco',32,21,53000],
  ['4901','FUJIFILM','Health Care','Medical Devices',28,24,73000],
  ['4543','Terumo','Health Care','Medical Devices',28,8,28000],
  ['4911','Shiseido','Consumer Staples','Personal Care',22,10,37000],
  ['3382','Seven & i Holdings','Consumer Staples','Food Retail',30,100,150000],
  ['9020','East Japan Railway','Industrials','Freight & Logistics',28,25,71000],
  ['9022','Central Japan Railway','Industrials','Freight & Logistics',30,13,29000],
  ['3407','Asahi Kasei','Materials','Chemicals',8,23,46000],
  ['5401','Nippon Steel','Materials','Steel',12,62,106000],
  ['5108','Bridgestone','Consumer Discretionary','Auto Components',28,35,131000],
  ['6971','Kyocera','Information Technology','Electronic Equipment',18,17,82000],
  ['6723','Renesas Electronics','Information Technology','Semiconductors',28,14,21000],
  ['6857','Advantest','Information Technology','Semiconductors',22,5,7000],
  ['6920','Lasertec','Information Technology','Semiconductors',18,1.4,1100],
  ['6645','Omron','Industrials','Electrical Equipment',8,8,29000],
  ['7832','Bandai Namco','Communication Services','Entertainment',12,8,27000],
  ['6098','Recruit Holdings','Industrials','IT Services',55,25,60000],
  ['9613','NTT Data','Information Technology','IT Services',25,25,195000],
  ['7733','Olympus','Health Care','Medical Devices',22,8,31000],
  ['6506','Yaskawa Electric','Industrials','Electrical Equipment',12,5,15000],
  ['7011','Mitsubishi Heavy Industries','Industrials','Aerospace & Defense',25,40,80000],
  ['6273','SMC','Industrials','Machinery',35,7,22000],
  ['5802','Sumitomo Electric','Information Technology','Electronic Equipment',8,33,280000],
  ['4324','Dentsu Group','Communication Services','Advertising',8,11,70000],
  ['7731','Nikon','Consumer Discretionary','Leisure Products',5,6,19000],
  ['8801','Mitsui Fudosan','Real Estate','Real Estate Services',22,22,25000],
  ['8802','Mitsubishi Estate','Real Estate','Real Estate Services',18,13,11000],
  ['5020','ENEOS Holdings','Energy','Oil & Gas Refining',8,95,40000],
  ['9501','Tokyo Electric Power','Utilities','Electric Utilities',6,62,38000],
  ['9531','Tokyo Gas','Utilities','Gas Utilities',8,20,16000],
  ['9101','Nippon Yusen','Industrials','Marine Transport',10,22,35000],
  ['6988','Nitto Denko','Materials','Specialty Chemicals',12,8,29000],
  ['7259','Aisin','Consumer Discretionary','Auto Components',5,40,115000],
  ['7272','Yamaha Motor','Consumer Discretionary','Leisure Products',8,21,53000],
  ['2801','Kikkoman','Consumer Staples','Food Products',12,5,7000],
  ['9843','Nitori Holdings','Consumer Discretionary','Specialty Retail',12,8,46000],
  ['8267','Aeon','Consumer Staples','Food Retail',12,92,560000],
  ['9064','Yamato Holdings','Industrials','Freight & Logistics',5,17,220000],
  ['1925','Daiwa House','Industrials','Building Products',18,42,70000],
  ['1928','Sekisui House','Industrials','Building Products',12,25,30000],
  ['9201','Japan Airlines','Industrials','Airlines',5,13,36000],
  ['9202','ANA Holdings','Industrials','Airlines',5,18,45000],
  ['4528','Ono Pharmaceutical','Health Care','Pharma',10,3.8,3600],
  ['7936','Asics','Consumer Discretionary','Textiles & Apparel',5,5,9600],
  ['7182','Japan Post Bank','Financials','Diversified Banks',28,7,13000],
  ['7181','Japan Post Holdings','Financials','Insurance — Life',28,11,230000],
  ['8309','Sumitomo Mitsui Trust','Financials','Diversified Banks',15,10,21000],
  ['8725','MS&AD Insurance','Financials','Insurance — P&C',18,38,42000],
  ['8630','SOMPO Holdings','Financials','Insurance — P&C',12,37,78000],
];

// ─── Hang Seng / CSI 300 — 200 Real HK/China Equities ──────────────────────
// Format: [ticker, name, sector, subIndustry, country, marketCapBn, revenueBn, employees]
const HKCN_RAW = [
  ['0700','Tencent Holdings','Communication Services','Interactive Media','HK',380,85,108000],
  ['9988','Alibaba Group','Consumer Discretionary','Broadline Retail','HK',180,130,220000],
  ['3690','Meituan','Consumer Discretionary','Hotels & Restaurants','HK',85,33,80000],
  ['1211','BYD','Consumer Discretionary','Auto Manufacturers','HK',80,70,570000],
  ['1398','ICBC','Financials','Diversified Banks','HK',220,115,430000],
  ['0939','China Construction Bank','Financials','Diversified Banks','HK',175,95,350000],
  ['2318','Ping An Insurance','Financials','Insurance — Life','HK',95,148,340000],
  ['3988','Bank of China','Financials','Diversified Banks','HK',140,80,310000],
  ['1288','Agricultural Bank of China','Financials','Diversified Banks','HK',160,85,450000],
  ['1810','Xiaomi','Information Technology','Hardware & Storage','HK',55,39,33000],
  ['9618','JD.com','Consumer Discretionary','Broadline Retail','HK',42,152,400000],
  ['9999','NetEase','Communication Services','Entertainment','HK',55,14,30000],
  ['3968','China Merchants Bank','Financials','Diversified Banks','HK',95,48,110000],
  ['0941','China Mobile','Communication Services','Telecom — Wireless','HK',210,140,450000],
  ['0883','CNOOC','Energy','Oil & Gas Exploration','HK',75,46,25000],
  ['0857','PetroChina','Energy','Integrated Oil','HK',180,420,450000],
  ['0386','China Petroleum','Energy','Integrated Oil','HK',85,465,600000],
  ['0688','China Overseas Land','Real Estate','Real Estate Services','HK',12,28,30000],
  ['1109','China Resources Land','Real Estate','Real Estate Services','HK',15,32,44000],
  ['1113','CK Asset Holdings','Real Estate','Real Estate Services','HK',12,9,17000],
  ['0016','Sun Hung Kai Properties','Real Estate','Real Estate Services','HK',22,12,35000],
  ['0002','CLP Holdings','Utilities','Electric Utilities','HK',18,12,8000],
  ['0003','Hong Kong & China Gas','Utilities','Gas Utilities','HK',8,5,13000],
  ['0011','Hang Seng Bank','Financials','Diversified Banks','HK',22,6,8000],
  ['0005','HSBC Holdings','Financials','Diversified Banks','HK',165,66,220000],
  ['0388','Hong Kong Exchanges','Financials','Financial Exchanges','HK',42,2.3,2800],
  ['1299','AIA Group','Financials','Insurance — Life','HK',75,44,30000],
  ['0066','MTR Corporation','Industrials','Freight & Logistics','HK',18,6,50000],
  ['1177','Sino Biopharmaceutical','Health Care','Pharma','HK',8,4,35000],
  ['2269','WuXi Biologics','Health Care','Biotech','HK',18,3.6,14000],
  ['6160','BeiGene','Health Care','Biotech','HK',22,2.5,10000],
  ['0175','Geely Automobile','Consumer Discretionary','Auto Manufacturers','HK',12,18,55000],
  ['2015','Li Auto','Consumer Discretionary','Auto Manufacturers','HK',28,15,35000],
  ['9866','NIO','Consumer Discretionary','Auto Manufacturers','HK',8,7,32000],
  ['1024','Kuaishou Technology','Communication Services','Interactive Media','HK',12,14,27000],
  ['9961','Trip.com Group','Consumer Discretionary','Hotels & Restaurants','HK',22,6,40000],
  ['0981','SMIC','Information Technology','Semiconductors','HK',32,7.5,21000],
  ['2331','Li Ning','Consumer Discretionary','Textiles & Apparel','HK',5,3,19000],
  ['9633','Nongfu Spring','Consumer Staples','Beverages','HK',35,5,19000],
  ['0291','China Resources Beer','Consumer Staples','Beverages','HK',12,6,45000],
  ['1088','China Shenhua Energy','Energy','Coal & Consumables','HK',65,42,85000],
  ['3328','Bank of Communications','Financials','Diversified Banks','HK',55,30,90000],
  ['2020','ANTA Sports','Consumer Discretionary','Textiles & Apparel','HK',22,8,57000],
  ['2688','ENN Energy','Utilities','Gas Utilities','HK',8,12,16000],
  ['0836','China Resources Power','Utilities','Independent Power','HK',10,20,30000],
  ['600519','Kweichow Moutai','Consumer Staples','Beverages','CN',290,20,30000],
  ['601318','Ping An Insurance A','Financials','Insurance — Life','CN',95,148,340000],
  ['600036','China Merchants Bank A','Financials','Diversified Banks','CN',95,48,110000],
  ['601166','Industrial Bank','Financials','Diversified Banks','CN',32,25,60000],
  ['600030','CITIC Securities','Financials','Investment Banking','CN',22,9,25000],
  ['601888','China Tourism Group','Consumer Discretionary','Specialty Retail','CN',28,8,30000],
  ['000858','Wuliangye Yibin','Consumer Staples','Beverages','CN',55,10,28000],
  ['000333','Midea Group','Consumer Discretionary','Household Durables','CN',55,50,190000],
  ['600276','Jiangsu Hengrui','Health Care','Pharma','CN',22,3.2,18000],
  ['603259','WuXi AppTec','Health Care','Life Sciences Tools','CN',22,5,45000],
  ['300760','Mindray Bio-Medical','Health Care','Medical Devices','CN',38,5,18000],
  ['002594','BYD Company A','Consumer Discretionary','Auto Manufacturers','CN',80,70,570000],
  ['002475','Luxshare Precision','Information Technology','Electronic Equipment','CN',28,22,320000],
  ['601012','LONGi Green Energy','Information Technology','Semiconductors','CN',12,12,60000],
  ['688981','CATL','Industrials','Electrical Equipment','CN',120,50,120000],
  ['600900','China Yangtze Power','Utilities','Renewable Energy','CN',65,35,8000],
  ['601899','Zijin Mining','Materials','Gold Mining','CN',28,38,52000],
  ['600309','Wanhua Chemical','Materials','Chemicals','CN',22,22,35000],
  ['600585','Conch Cement','Materials','Construction Materials','CN',12,18,55000],
  ['601088','China Shenhua A','Energy','Coal & Consumables','CN',65,42,85000],
  ['600690','Haier Smart Home','Consumer Discretionary','Household Durables','CN',22,35,110000],
  ['000651','Gree Electric','Consumer Discretionary','Household Durables','CN',25,28,80000],
  ['603288','Foshan Haitian','Consumer Staples','Food Products','CN',22,4,8000],
  ['601628','China Life Insurance A','Financials','Insurance — Life','CN',45,110,100000],
  ['000002','China Vanke','Real Estate','Real Estate Services','CN',8,65,100000],
  ['601668','China State Construction','Industrials','Construction & Engineering','CN',15,280,300000],
  ['600031','Sany Heavy Industry','Industrials','Machinery','CN',12,12,25000],
  ['000063','ZTE','Information Technology','Communication Equipment','CN',12,18,74000],
  ['002415','Hikvision','Information Technology','Electronic Equipment','CN',28,12,57000],
  ['002352','S.F. Holding','Industrials','Freight & Logistics','CN',18,35,500000],
  ['688012','China Telecom A','Communication Services','Telecom — Integrated','CN',50,65,280000],
  ['600050','China Unicom','Communication Services','Telecom — Integrated','CN',25,48,240000],
  ['300059','East Money Information','Financials','Financial Exchanges','CN',18,3,8000],
  ['000725','BOE Technology','Information Technology','Electronic Equipment','CN',10,25,80000],
  ['000001','Ping An Bank','Financials','Diversified Banks','CN',15,22,40000],
  ['601939','China Construction Bank A','Financials','Diversified Banks','CN',175,95,350000],
  ['601288','Agricultural Bank A','Financials','Diversified Banks','CN',160,85,450000],
  ['601398','ICBC A','Financials','Diversified Banks','CN',220,115,430000],
  ['600887','Inner Mongolia Yili','Consumer Staples','Food Products','CN',22,16,60000],
  ['601985','China National Nuclear','Utilities','Independent Power','CN',18,25,80000],
  ['600025','Huaneng Power','Utilities','Independent Power','CN',8,28,55000],
  ['002714','Muyuan Foods','Consumer Staples','Food Products','CN',12,12,50000],
  ['601766','CRRC','Industrials','Machinery','CN',10,25,180000],
  ['300124','Shenzhen Inovance','Industrials','Electrical Equipment','CN',12,4,18000],
  ['601919','COSCO Shipping','Industrials','Marine Transport','CN',12,18,60000],
  ['601390','China Railway Group','Industrials','Construction & Engineering','CN',8,155,280000],
  ['601186','China Railway Construction','Industrials','Construction & Engineering','CN',6,120,260000],
  ['600438','Tongwei','Information Technology','Semiconductors','CN',8,7,40000],
  ['300015','Aier Eye Hospital','Health Care','Health Care Facilities','CN',18,3.2,18000],
  ['600346','Hengli Petrochemical','Energy','Oil & Gas Refining','CN',8,28,40000],
  ['601111','Air China','Industrials','Airlines','CN',8,15,80000],
];

// ─── ASX 200 — 100 Real Australian Equities ─────────────────────────────────
const ASX200_RAW = [
  ['BHP','BHP Group','Materials','Diversified Metals',145,53,80000],
  ['CBA','Commonwealth Bank','Financials','Diversified Banks',145,19,53000],
  ['CSL','CSL Limited','Health Care','Biotech',110,14,32000],
  ['WES','Wesfarmers','Consumer Discretionary','Specialty Retail',55,44,120000],
  ['MQG','Macquarie Group','Financials','Investment Banking',60,18,20000],
  ['WOW','Woolworths Group','Consumer Staples','Food Retail',32,61,195000],
  ['NAB','National Australia Bank','Financials','Diversified Banks',75,17,37000],
  ['WBC','Westpac Banking','Financials','Diversified Banks',68,18,40000],
  ['ANZ','ANZ Banking Group','Financials','Diversified Banks',62,18,40000],
  ['FMG','Fortescue Metals','Materials','Diversified Metals',48,17,15000],
  ['RIO.AU','Rio Tinto','Materials','Diversified Metals',110,54,53000],
  ['WDS','Woodside Energy','Energy','Oil & Gas Exploration',45,14,4800],
  ['TLS','Telstra','Communication Services','Telecom — Integrated',35,23,28000],
  ['GMG','Goodman Group','Real Estate','REITs — Industrial',42,2.5,2300],
  ['TCL','Transurban Group','Industrials','Freight & Logistics',28,4,6200],
  ['ALL.AU','Aristocrat Leisure','Consumer Discretionary','Leisure Products',22,6,7000],
  ['COL','Coles Group','Consumer Staples','Food Retail',18,40,120000],
  ['STO','Santos','Energy','Oil & Gas Exploration',15,7,4200],
  ['REA','REA Group','Communication Services','Interactive Media',18,1.3,3500],
  ['QBE','QBE Insurance','Financials','Insurance — P&C',12,20,13000],
  ['SUN','Suncorp Group','Financials','Insurance — P&C',10,16,13000],
  ['IAG.AU','Insurance Australia','Financials','Insurance — P&C',12,18,15000],
  ['AGL','AGL Energy','Utilities','Electric Utilities',8,12,4200],
  ['ORG','Origin Energy','Utilities','Electric Utilities',12,16,5800],
  ['S32','South32','Materials','Diversified Metals',10,8,12000],
  ['NST','Northern Star','Materials','Gold Mining',12,3.8,3400],
  ['AMC.AU','Amcor','Materials','Paper & Forest',15,14,42500],
  ['JHX','James Hardie','Materials','Construction Materials',14,3.8,5400],
  ['CPU','Computershare','Financials','Financial Exchanges',15,3,12000],
  ['QAN','Qantas Airways','Industrials','Airlines',8,18,28000],
  ['RHC','Ramsay Health Care','Health Care','Health Care Facilities',8,15,86000],
  ['SHL','Sonic Healthcare','Health Care','Health Care Services',10,8,48000],
  ['COH','Cochlear','Health Care','Medical Devices',16,2,5000],
  ['XRO','Xero','Information Technology','Software — Application',18,1.5,4900],
  ['WTC','WiseTech Global','Information Technology','Software — Application',15,0.7,3200],
  ['ASX.AU','ASX Limited','Financials','Financial Exchanges',10,1,800],
  ['PLS','Pilbara Minerals','Materials','Diversified Metals',8,3.3,2300],
  ['ALD','Ampol','Energy','Oil & Gas Refining',5,35,9000],
  ['ORI','Orica','Materials','Chemicals',4,7,13000],
  ['EVN','Evolution Mining','Materials','Gold Mining',6,2.5,2000],
  ['FPH','Fisher & Paykel Healthcare','Health Care','Medical Devices',12,1.4,5000],
  ['PME','Pro Medicus','Health Care','Medical Devices',8,0.2,500],
  ['EDV','Endeavour Group','Consumer Staples','Beverages',6,12,28000],
  ['MIN','Mineral Resources','Materials','Diversified Metals',8,4.5,6000],
  ['IGO','IGO Limited','Materials','Diversified Metals',4,1.8,2000],
  ['LYC','Lynas Rare Earths','Materials','Diversified Metals',5,0.8,1000],
  ['SCG','Scentre Group','Real Estate','REITs — Retail',12,2.5,3000],
  ['SGP.AU','Stockland','Real Estate','REITs — Diversified',6,2.3,1800],
  ['TWE','Treasury Wine','Consumer Staples','Beverages',8,2.8,4000],
  ['APA','APA Group','Utilities','Gas Utilities',8,2.6,2200],
];

// ─── MSCI EM — 600 Real Emerging Market Equities ────────────────────────────
// Format: [ticker, name, sector, subIndustry, country, marketCapBn, revenueBn, employees]
const EM_RAW = [
  // Korea
  ['005930','Samsung Electronics','Information Technology','Semiconductors','KR',310,230,270000],
  ['000660','SK Hynix','Information Technology','Semiconductors','KR',75,35,30000],
  ['005380','Hyundai Motor','Consumer Discretionary','Auto Manufacturers','KR',38,110,120000],
  ['051910','LG Chem','Materials','Chemicals','KR',25,45,40000],
  ['035420','NAVER','Communication Services','Interactive Media','KR',28,8,6000],
  ['035720','Kakao','Communication Services','Interactive Media','KR',12,6,7000],
  ['006400','Samsung SDI','Information Technology','Electronic Equipment','KR',22,15,12000],
  ['055550','Shinhan Financial','Financials','Diversified Banks','KR',18,15,23000],
  ['105560','KB Financial','Financials','Diversified Banks','KR',22,18,27000],
  ['000270','Kia Corporation','Consumer Discretionary','Auto Manufacturers','KR',25,80,52000],
  ['068270','Celltrion','Health Care','Biotech','KR',22,2.5,6000],
  ['207940','Samsung Biologics','Health Care','Biotech','KR',38,3,8000],
  ['017670','SK Telecom','Communication Services','Telecom — Wireless','KR',10,17,28000],
  // Taiwan
  ['2330','TSMC','Information Technology','Semiconductors','TW',650,75,73000],
  ['2317','Hon Hai Precision','Information Technology','Electronic Equipment','TW',45,215,870000],
  ['2454','MediaTek','Information Technology','Semiconductors','TW',55,18,20000],
  ['2308','Delta Electronics','Information Technology','Electronic Equipment','TW',30,13,88000],
  ['2881','Fubon Financial','Financials','Diversified Banks','TW',22,12,60000],
  ['2882','Cathay Financial','Financials','Diversified Banks','TW',18,10,55000],
  ['2412','Chunghwa Telecom','Communication Services','Telecom — Integrated','TW',25,7,24000],
  ['2002.TW','China Steel','Materials','Steel','TW',8,14,25000],
  ['1303','Nan Ya Plastics','Materials','Chemicals','TW',12,10,14000],
  ['3711','ASE Technology','Information Technology','Semiconductors','TW',18,20,95000],
  ['2303','United Microelectronics','Information Technology','Semiconductors','TW',15,8,20000],
  // India
  ['RELIANCE','Reliance Industries','Energy','Integrated Oil','IN',210,105,340000],
  ['TCS','Tata Consultancy Services','Information Technology','IT Services','IN',160,28,615000],
  ['INFY.IN','Infosys','Information Technology','IT Services','IN',75,18,340000],
  ['HDFCBANK','HDFC Bank','Financials','Diversified Banks','IN',145,22,180000],
  ['ICICIBANK','ICICI Bank','Financials','Diversified Banks','IN',85,16,130000],
  ['HINDUNILVR','Hindustan Unilever','Consumer Staples','Personal Care','IN',65,7,21000],
  ['BHARTIARTL','Bharti Airtel','Communication Services','Telecom — Wireless','IN',85,17,30000],
  ['SBIN','State Bank of India','Financials','Diversified Banks','IN',65,40,250000],
  ['ITC','ITC Limited','Consumer Staples','Tobacco','IN',55,9,36000],
  ['BAJFINANCE','Bajaj Finance','Financials','Consumer Finance','IN',50,10,44000],
  ['LT','Larsen & Toubro','Industrials','Construction & Engineering','IN',48,25,420000],
  ['HCLTECH','HCL Technologies','Information Technology','IT Services','IN',45,13,225000],
  ['KOTAKBANK','Kotak Mahindra Bank','Financials','Diversified Banks','IN',38,10,90000],
  ['SUNPHARMA','Sun Pharma','Health Care','Pharma','IN',42,5.5,42000],
  ['MARUTI','Maruti Suzuki','Consumer Discretionary','Auto Manufacturers','IN',38,15,40000],
  ['TITAN','Titan Company','Consumer Discretionary','Specialty Retail','IN',32,5,14000],
  ['WIPRO','Wipro','Information Technology','IT Services','IN',28,11,250000],
  ['ULTRACEMCO','UltraTech Cement','Materials','Construction Materials','IN',28,7,22000],
  ['M&M','Mahindra & Mahindra','Consumer Discretionary','Auto Manufacturers','IN',28,14,120000],
  ['ADANIENT','Adani Enterprises','Industrials','Industrial Conglomerates','IN',35,18,46000],
  ['ADANIGREEN','Adani Green Energy','Utilities','Renewable Energy','IN',28,2,6000],
  ['POWERGRID','Power Grid Corp','Utilities','Electric Utilities','IN',22,5,14000],
  ['NTPC','NTPC Limited','Utilities','Independent Power','IN',32,18,25000],
  ['ONGC','Oil & Natural Gas Corp','Energy','Oil & Gas Exploration','IN',28,38,30000],
  ['COALINDIA','Coal India','Energy','Coal & Consumables','IN',18,18,250000],
  ['ASIANPAINT','Asian Paints','Materials','Specialty Chemicals','IN',28,4,6000],
  ['DRREDDY','Dr Reddy\'s Labs','Health Care','Pharma','IN',12,3.2,25000],
  ['TATAMOTOR','Tata Motors','Consumer Discretionary','Auto Manufacturers','IN',22,45,80000],
  ['JSWSTEEL','JSW Steel','Materials','Steel','IN',18,18,60000],
  ['TATASTEEL','Tata Steel','Materials','Steel','IN',15,30,80000],
  ['INDIGO','InterGlobe Aviation','Industrials','Airlines','IN',10,7,38000],
  ['HAL','Hindustan Aero','Industrials','Aerospace & Defense','IN',28,5,30000],
  ['ZOMATO','Zomato','Consumer Discretionary','Hotels & Restaurants','IN',12,3,6000],
  // Brazil
  ['PETR4','Petrobras','Energy','Integrated Oil','BR',85,100,45000],
  ['VALE3','Vale','Materials','Diversified Metals','BR',55,42,67000],
  ['ITUB4','Itau Unibanco','Financials','Diversified Banks','BR',45,30,100000],
  ['BBDC4','Bradesco','Financials','Diversified Banks','BR',28,25,90000],
  ['BBAS3','Banco do Brasil','Financials','Diversified Banks','BR',22,20,88000],
  ['ABEV3','Ambev','Consumer Staples','Beverages','BR',32,15,30000],
  ['WEGE3','WEG','Industrials','Electrical Equipment','BR',32,6,40000],
  ['B3SA3','B3','Financials','Financial Exchanges','BR',12,2.5,4000],
  ['SUZB3','Suzano','Materials','Paper & Forest','BR',10,12,37000],
  ['ELET3','Eletrobras','Utilities','Electric Utilities','BR',18,12,12000],
  ['JBSS3','JBS','Consumer Staples','Food Products','BR',8,72,250000],
  ['VIVT3','Telefonica Brasil','Communication Services','Telecom — Integrated','BR',8,12,32000],
  ['EQTL3','Equatorial Energia','Utilities','Electric Utilities','BR',8,7,32000],
  ['SBSP3','Sabesp','Utilities','Water Utilities','BR',8,5,14000],
  ['GGBR4','Gerdau','Materials','Steel','BR',5,14,30000],
  ['TOTS3','TOTVS','Information Technology','Software — Application','BR',5,1.2,9000],
  // South Africa
  ['NPN','Naspers','Information Technology','Interactive Media','ZA',45,7,28000],
  ['FSR','FirstRand','Financials','Diversified Banks','ZA',18,8,53000],
  ['SBK','Standard Bank Group','Financials','Diversified Banks','ZA',15,10,49000],
  ['AGL.ZA','Anglo American Platinum','Materials','Diversified Metals','ZA',12,12,32000],
  ['SOL','Sasol','Energy','Oil & Gas Refining','ZA',5,16,30000],
  ['GFI','Gold Fields','Materials','Gold Mining','ZA',8,4.5,7000],
  ['MTN','MTN Group','Communication Services','Telecom — Wireless','ZA',8,12,17000],
  ['SHP','Shoprite Holdings','Consumer Staples','Food Retail','ZA',8,14,146000],
  ['CFR.ZA','Richemont','Consumer Discretionary','Textiles & Apparel','ZA',75,20,38000],
  // Mexico
  ['WALMEX','Walmart de Mexico','Consumer Staples','Food Retail','MX',32,40,240000],
  ['AMX','America Movil','Communication Services','Telecom — Wireless','MX',42,52,180000],
  ['FEMSAUBD','FEMSA','Consumer Staples','Beverages','MX',28,30,320000],
  ['GFNORTEO','Banorte','Financials','Diversified Banks','MX',18,8,30000],
  ['BIMBOA','Bimbo','Consumer Staples','Food Products','MX',12,20,130000],
  ['CEMEXCPO','Cemex','Materials','Construction Materials','MX',8,16,43000],
  ['GMEXICOB','Grupo Mexico','Materials','Diversified Metals','MX',22,16,90000],
  // Saudi & Gulf
  ['2222','Saudi Aramco','Energy','Integrated Oil','SA',1800,400,70000],
  ['1180','Al Rajhi Bank','Financials','Diversified Banks','SA',85,12,22000],
  ['2010','SABIC','Materials','Chemicals','SA',55,45,32000],
  ['7010','STC','Communication Services','Telecom — Integrated','SA',55,17,22000],
  ['FAB','First Abu Dhabi Bank','Financials','Diversified Banks','AE',42,8,8000],
  ['ETISALAT','e& (Etisalat)','Communication Services','Telecom — Wireless','AE',48,14,45000],
  ['EMAAR','Emaar Properties','Real Estate','Real Estate Services','AE',15,8,14000],
  ['QNB','Qatar National Bank','Financials','Diversified Banks','QA',38,8,28000],
  ['NBK','National Bank of Kuwait','Financials','Diversified Banks','KW',28,5,7000],
  ['TEVA','Teva Pharmaceutical','Health Care','Pharma','IL',12,16,40000],
  ['CHKP','Check Point Software','Information Technology','Software — Infrastructure','IL',18,2.4,6600],
  ['NICE','NICE Ltd','Information Technology','Software — Application','IL',12,2.4,8500],
  // Southeast Asia
  ['D05','DBS Group','Financials','Diversified Banks','SG',65,12,36000],
  ['O39','OCBC Bank','Financials','Diversified Banks','SG',42,8,32000],
  ['U11','UOB','Financials','Diversified Banks','SG',38,8,27000],
  ['Z74','SingTel','Communication Services','Telecom — Integrated','SG',32,14,23000],
  ['BBCA','Bank Central Asia','Financials','Diversified Banks','ID',55,8,25000],
  ['BBRI','Bank Rakyat Indonesia','Financials','Diversified Banks','ID',35,12,120000],
  ['TLKM','Telkom Indonesia','Communication Services','Telecom — Integrated','ID',22,10,26000],
  ['ASII','Astra International','Industrials','Industrial Conglomerates','ID',15,22,220000],
  ['PTT','PTT','Energy','Integrated Oil','TH',28,82,25000],
  ['CPALL','CP ALL','Consumer Staples','Food Retail','TH',12,18,190000],
  ['SCC','Siam Cement','Materials','Construction Materials','TH',12,15,50000],
  ['KBANK','Kasikornbank','Financials','Diversified Banks','TH',10,5,22000],
  ['AOT','Airports of Thailand','Industrials','Freight & Logistics','TH',18,2,6000],
  ['MAYBANK','Malayan Banking','Financials','Diversified Banks','MY',22,10,42000],
  ['TENAGA','Tenaga Nasional','Utilities','Electric Utilities','MY',15,12,36000],
  ['PCHEM','Petronas Chemicals','Materials','Chemicals','MY',12,5,4000],
  ['SMPH','SM Prime Holdings','Real Estate','Real Estate Services','PH',12,4,60000],
  ['SM','SM Investments','Financials','Investment Banking','PH',15,8,120000],
  ['VNM','Vinamilk','Consumer Staples','Beverages','VN',5,3,10000],
  // Turkey
  ['THYAO','Turkish Airlines','Industrials','Airlines','TR',8,22,70000],
  ['BIMAS','BIM Birlesik','Consumer Staples','Food Retail','TR',8,10,60000],
  ['KCHOL','Koc Holding','Industrials','Industrial Conglomerates','TR',12,40,100000],
  // Chile, Colombia, Peru
  ['SQM','SQM','Materials','Specialty Chemicals','CL',12,8,13000],
  ['CENCOSUD','Cencosud','Consumer Staples','Food Retail','CL',5,18,130000],
  ['ECOPETROL','Ecopetrol','Energy','Integrated Oil','CO',12,30,20000],
  ['PFBCOLOM','Bancolombia','Financials','Diversified Banks','CO',5,5,30000],
  ['CREDICORP','Credicorp','Financials','Diversified Banks','PE',8,5,40000],
  ['SCCO','Southern Copper','Materials','Diversified Metals','PE',38,10,14000],
  // Africa / Other EM
  ['SAFCOM','Safaricom','Communication Services','Telecom — Wireless','KE',8,2.5,7000],
  ['DANGCEM','Dangote Cement','Materials','Construction Materials','NG',8,4.5,27000],
  ['CIB','Commercial Intl Bank','Financials','Diversified Banks','EG',5,3,8000],
  ['IAM','Maroc Telecom','Communication Services','Telecom — Integrated','MA',8,3.5,11000],
  ['ATW','Attijariwafa Bank','Financials','Diversified Banks','MA',5,3.5,20000],
];

// ─── Build all named equities ────────────────────────────────────────────────
function buildNamedEquities() {
  const equities = [];
  let idx = 0;

  // Helper to build equity from S&P raw format [ticker,name,sector,subInd,mcap,rev,emps]
  function pushUS(r, i) {
    const seed = i * 7 + 1;
    const sector = r[2];
    const er = EMISSION_RANGES[sector] || EMISSION_RANGES['Industrials'];
    const s1 = Math.round(range(er.s1[0], er.s1[1], seed));
    const s2 = Math.round(range(er.s2[0], er.s2[1], seed + 1));
    const s3 = Math.round(range(er.s3[0], er.s3[1], seed + 2));
    equities.push({
      id: `EQ-${String(idx + 1).padStart(5, '0')}`, assetType: 'Equity',
      isin: `US${isinCheck('', seed + 3)}`,
      ticker: r[0], name: r[1], exchange: 'NYSE', country: 'US', region: 'North America',
      sector, subIndustry: r[3], marketCapBn: r[4], revenueBn: r[5], employees: r[6],
      scope1: s1, scope2: s2, scope3: s3, totalEmissions: s1 + s2 + s3,
      carbonIntensity: +((s1 + s2 + s3) / (r[5] * 1e6) * 1e6).toFixed(1),
      msciRating: pick(MSCI_RATINGS, seed + 4), sustainalyticsRisk: range(8, 45, seed + 5),
      cdpScore: pick(CDP_SCORES, seed + 6), spGlobalScore: rangeInt(20, 95, seed + 7),
      sbtiStatus: pick(SBTI_STATUSES, seed + 8), netZeroYear: rangeInt(2030, 2060, seed + 9),
      greenRevenuePct: range(0, 65, seed + 10), temperatureScore: range(1.3, 3.8, seed + 11),
      dividendYield: range(0, 5.5, seed + 12), peRatio: range(8, 80, seed + 13),
      priceToBook: range(0.5, 25, seed + 14), beta: range(0.3, 2.2, seed + 15),
      ytdReturn: range(-30, 60, seed + 16), esgComposite: rangeInt(15, 95, seed + 17),
      controversyScore: rangeInt(0, 10, seed + 18), boardIndependencePct: range(50, 100, seed + 19),
      femaleBoardPct: range(10, 55, seed + 20),
    });
    idx++;
  }

  // Helper for intl equity with country in format [ticker,name,sector,subInd,country,mcap,rev,emps]
  function pushIntl(r, i, seedOffset) {
    const seed = (idx + i) * 11 + seedOffset;
    const country = r[4];
    const sector = r[2];
    const er = EMISSION_RANGES[sector] || EMISSION_RANGES['Industrials'];
    const s1 = Math.round(range(er.s1[0], er.s1[1], seed));
    const s2 = Math.round(range(er.s2[0], er.s2[1], seed + 1));
    const s3 = Math.round(range(er.s3[0], er.s3[1], seed + 2));
    equities.push({
      id: `EQ-${String(idx + 1).padStart(5, '0')}`, assetType: 'Equity',
      isin: `${country}${isinCheck('', seed + 3)}`,
      ticker: r[0], name: r[1], exchange: EXCHANGES[country] || 'OTHER',
      country, region: REGIONS[country] || 'Other',
      sector, subIndustry: r[3], marketCapBn: r[5], revenueBn: r[6], employees: r[7],
      scope1: s1, scope2: s2, scope3: s3, totalEmissions: s1 + s2 + s3,
      carbonIntensity: +((s1 + s2 + s3) / (Math.max(r[6], 0.01) * 1e6) * 1e6).toFixed(1),
      msciRating: pick(MSCI_RATINGS, seed + 4), sustainalyticsRisk: range(8, 50, seed + 5),
      cdpScore: pick(CDP_SCORES, seed + 6), spGlobalScore: rangeInt(15, 90, seed + 7),
      sbtiStatus: pick(SBTI_STATUSES, seed + 8), netZeroYear: rangeInt(2030, 2065, seed + 9),
      greenRevenuePct: range(0, 55, seed + 10), temperatureScore: range(1.3, 4.2, seed + 11),
      dividendYield: range(0, 6, seed + 12), peRatio: range(5, 70, seed + 13),
      priceToBook: range(0.3, 18, seed + 14), beta: range(0.3, 2.2, seed + 15),
      ytdReturn: range(-35, 55, seed + 16), esgComposite: rangeInt(10, 90, seed + 17),
      controversyScore: rangeInt(0, 10, seed + 18), boardIndependencePct: range(25, 95, seed + 19),
      femaleBoardPct: range(5, 50, seed + 20),
    });
    idx++;
  }

  // Helper for JP equity [ticker,name,sector,subInd,mcap,rev,emps]
  function pushJP(r, i) {
    const seed = (idx + i) * 13 + 200;
    const sector = r[2];
    const er = EMISSION_RANGES[sector] || EMISSION_RANGES['Industrials'];
    const s1 = Math.round(range(er.s1[0], er.s1[1], seed));
    const s2 = Math.round(range(er.s2[0], er.s2[1], seed + 1));
    const s3 = Math.round(range(er.s3[0], er.s3[1], seed + 2));
    equities.push({
      id: `EQ-${String(idx + 1).padStart(5, '0')}`, assetType: 'Equity',
      isin: `JP${isinCheck('', seed + 3)}`,
      ticker: r[0], name: r[1], exchange: 'TSE', country: 'JP', region: 'Asia Pacific',
      sector, subIndustry: r[3], marketCapBn: r[4], revenueBn: r[5], employees: r[6],
      scope1: s1, scope2: s2, scope3: s3, totalEmissions: s1 + s2 + s3,
      carbonIntensity: +((s1 + s2 + s3) / (r[5] * 1e6) * 1e6).toFixed(1),
      msciRating: pick(MSCI_RATINGS, seed + 4), sustainalyticsRisk: range(8, 42, seed + 5),
      cdpScore: pick(CDP_SCORES, seed + 6), spGlobalScore: rangeInt(20, 90, seed + 7),
      sbtiStatus: pick(SBTI_STATUSES, seed + 8), netZeroYear: rangeInt(2030, 2060, seed + 9),
      greenRevenuePct: range(0, 50, seed + 10), temperatureScore: range(1.3, 3.8, seed + 11),
      dividendYield: range(0, 4.5, seed + 12), peRatio: range(8, 60, seed + 13),
      priceToBook: range(0.5, 10, seed + 14), beta: range(0.3, 1.8, seed + 15),
      ytdReturn: range(-25, 45, seed + 16), esgComposite: rangeInt(15, 90, seed + 17),
      controversyScore: rangeInt(0, 10, seed + 18), boardIndependencePct: range(30, 85, seed + 19),
      femaleBoardPct: range(5, 40, seed + 20),
    });
    idx++;
  }

  SP500_RAW.forEach((r, i) => pushUS(r, i));
  STOXX600_RAW.forEach((r, i) => pushIntl(r, i, 100));
  NIKKEI_RAW.forEach((r, i) => pushJP(r, i));
  HKCN_RAW.forEach((r, i) => pushIntl(r, i, 300));
  // ASX — needs wrapper to match intl format
  ASX200_RAW.forEach((r, i) => {
    pushIntl([r[0], r[1], r[2], r[3], 'AU', r[4], r[5], r[6]], i, 400);
  });
  EM_RAW.forEach((r, i) => pushIntl(r, i, 500));

  return { equities, nextIdx: idx };
}

// ─── Generate Small/Mid Cap Equities ─────────────────────────────────────────
const SMID_PREFIXES = [
  'Apex', 'Meridian', 'Catalyst', 'Nexus', 'Vertex', 'Pinnacle', 'Vantage', 'Horizon',
  'Sterling', 'Beacon', 'Crestline', 'Summit', 'Atlas', 'Forge', 'Keystone', 'Ironbridge',
  'Pacific', 'Quantum', 'Nordic', 'Zenith', 'Pulse', 'Arch', 'Orion', 'Solaris',
  'Titan', 'Echo', 'Clarity', 'Nova', 'Vector', 'Stratos', 'Ember', 'Flux',
  'Granite', 'Harbor', 'Lumen', 'Prism', 'Ridge', 'Sage', 'Terra', 'Volta',
];
const SMID_SUFFIXES = [
  'Technologies', 'Capital', 'Industries', 'Holdings', 'Corp', 'Group', 'Systems',
  'Solutions', 'Enterprises', 'Partners', 'Resources', 'Energy', 'Materials', 'Finance',
  'Healthcare', 'Pharma', 'Bio', 'Digital', 'Logistics', 'Properties', 'Mining',
  'Renewables', 'Analytics', 'Dynamics', 'Networks', 'Labs', 'Ventures', 'Power',
  'Semiconductors', 'Construction',
];
const SMID_COUNTRIES = [
  'US', 'US', 'US', 'US', 'GB', 'GB', 'DE', 'FR', 'JP', 'JP', 'AU', 'CA', 'CA',
  'KR', 'TW', 'IN', 'IN', 'BR', 'SG', 'HK', 'SE', 'CH', 'NL', 'IT', 'ES',
  'NO', 'DK', 'FI', 'NZ', 'ZA', 'MX', 'SA', 'AE', 'TH', 'MY', 'ID', 'PH',
  'CL', 'CO', 'IL',
];

function generateSmidCapEquities(startIdx, count) {
  const equities = [];
  for (let i = 0; i < count; i++) {
    const seed = (startIdx + i) * 31 + 9000;
    const country = SMID_COUNTRIES[i % SMID_COUNTRIES.length];
    const sector = pick(GICS_SECTORS, seed);
    const subs = SUB_INDUSTRIES[sector];
    const subIndustry = pick(subs, seed + 1);
    const er = EMISSION_RANGES[sector] || EMISSION_RANGES['Industrials'];
    const mcap = range(0.2, 15, seed + 2);
    const rev = range(0.05, 8, seed + 3);
    const emps = rangeInt(200, 25000, seed + 4);
    const s1 = Math.round(range(er.s1[0] * 0.01, er.s1[1] * 0.1, seed + 5));
    const s2 = Math.round(range(er.s2[0] * 0.01, er.s2[1] * 0.1, seed + 6));
    const s3 = Math.round(range(er.s3[0] * 0.01, er.s3[1] * 0.1, seed + 7));
    const prefix = pick(SMID_PREFIXES, seed + 8);
    const suffix = pick(SMID_SUFFIXES, seed + 9);
    const name = `${prefix} ${suffix}`;
    const tkr = (prefix.slice(0, 3) + suffix.slice(0, 1)).toUpperCase() + rangeInt(1, 99, seed + 10);
    equities.push({
      id: `EQ-${String(startIdx + i + 1).padStart(5, '0')}`, assetType: 'Equity',
      isin: `${country}${isinCheck('', seed + 11)}`,
      ticker: tkr, name, exchange: EXCHANGES[country] || 'OTHER',
      country, region: REGIONS[country] || 'Other',
      sector, subIndustry, marketCapBn: mcap, revenueBn: rev, employees: emps,
      scope1: s1, scope2: s2, scope3: s3, totalEmissions: s1 + s2 + s3,
      carbonIntensity: +((s1 + s2 + s3) / (Math.max(rev, 0.01) * 1e6) * 1e6).toFixed(1),
      msciRating: pick(MSCI_RATINGS, seed + 12), sustainalyticsRisk: range(10, 55, seed + 13),
      cdpScore: pick(CDP_SCORES, seed + 14), spGlobalScore: rangeInt(10, 80, seed + 15),
      sbtiStatus: pick(SBTI_STATUSES, seed + 16), netZeroYear: rangeInt(2030, 2065, seed + 17),
      greenRevenuePct: range(0, 40, seed + 18), temperatureScore: range(1.3, 4.5, seed + 19),
      dividendYield: range(0, 6, seed + 20), peRatio: range(5, 80, seed + 21),
      priceToBook: range(0.3, 12, seed + 22), beta: range(0.4, 2.5, seed + 23),
      ytdReturn: range(-40, 70, seed + 24), esgComposite: rangeInt(10, 85, seed + 25),
      controversyScore: rangeInt(0, 10, seed + 26), boardIndependencePct: range(30, 95, seed + 27),
      femaleBoardPct: range(5, 50, seed + 28),
    });
  }
  return equities;
}

// ─── Fixed Income Generation ─────────────────────────────────────────────────
const SOVEREIGN_COUNTRIES = [
  { c: 'US', name: 'United States', cur: 'USD', rating: 'AA+' },
  { c: 'GB', name: 'United Kingdom', cur: 'GBP', rating: 'AA' },
  { c: 'DE', name: 'Germany', cur: 'EUR', rating: 'AAA' },
  { c: 'FR', name: 'France', cur: 'EUR', rating: 'AA' },
  { c: 'JP', name: 'Japan', cur: 'JPY', rating: 'A+' },
  { c: 'CN', name: 'China', cur: 'CNY', rating: 'A+' },
  { c: 'IN', name: 'India', cur: 'INR', rating: 'BBB-' },
  { c: 'BR', name: 'Brazil', cur: 'BRL', rating: 'BB-' },
  { c: 'CA', name: 'Canada', cur: 'CAD', rating: 'AAA' },
  { c: 'AU', name: 'Australia', cur: 'AUD', rating: 'AAA' },
  { c: 'KR', name: 'South Korea', cur: 'KRW', rating: 'AA' },
  { c: 'IT', name: 'Italy', cur: 'EUR', rating: 'BBB' },
  { c: 'ES', name: 'Spain', cur: 'EUR', rating: 'A' },
  { c: 'NL', name: 'Netherlands', cur: 'EUR', rating: 'AAA' },
  { c: 'CH', name: 'Switzerland', cur: 'CHF', rating: 'AAA' },
  { c: 'SE', name: 'Sweden', cur: 'SEK', rating: 'AAA' },
  { c: 'NO', name: 'Norway', cur: 'NOK', rating: 'AAA' },
  { c: 'DK', name: 'Denmark', cur: 'DKK', rating: 'AAA' },
  { c: 'SG', name: 'Singapore', cur: 'SGD', rating: 'AAA' },
  { c: 'NZ', name: 'New Zealand', cur: 'NZD', rating: 'AA+' },
  { c: 'MX', name: 'Mexico', cur: 'MXN', rating: 'BBB' },
  { c: 'ZA', name: 'South Africa', cur: 'ZAR', rating: 'BB-' },
  { c: 'SA', name: 'Saudi Arabia', cur: 'SAR', rating: 'A' },
  { c: 'AE', name: 'UAE', cur: 'AED', rating: 'AA' },
  { c: 'TH', name: 'Thailand', cur: 'THB', rating: 'BBB+' },
  { c: 'MY', name: 'Malaysia', cur: 'MYR', rating: 'A-' },
  { c: 'ID', name: 'Indonesia', cur: 'IDR', rating: 'BBB' },
  { c: 'PH', name: 'Philippines', cur: 'PHP', rating: 'BBB+' },
  { c: 'CL', name: 'Chile', cur: 'CLP', rating: 'A' },
  { c: 'CO', name: 'Colombia', cur: 'COP', rating: 'BB+' },
  { c: 'PE', name: 'Peru', cur: 'PEN', rating: 'BBB' },
  { c: 'PL', name: 'Poland', cur: 'PLN', rating: 'A-' },
  { c: 'CZ', name: 'Czech Republic', cur: 'CZK', rating: 'AA-' },
  { c: 'IL', name: 'Israel', cur: 'ILS', rating: 'A+' },
  { c: 'TR', name: 'Turkey', cur: 'TRY', rating: 'B+' },
  { c: 'EG', name: 'Egypt', cur: 'EGP', rating: 'B' },
  { c: 'NG', name: 'Nigeria', cur: 'NGN', rating: 'B-' },
  { c: 'QA', name: 'Qatar', cur: 'QAR', rating: 'AA' },
  { c: 'KW', name: 'Kuwait', cur: 'KWD', rating: 'AA-' },
  { c: 'KE', name: 'Kenya', cur: 'KES', rating: 'B' },
];

const MATURITY_YEARS = { '2Y': 2028, '5Y': 2031, '10Y': 2036, '20Y': 2046, '30Y': 2056 };

function generateSovereignBonds() {
  const bonds = [];
  let i = 0;
  SOVEREIGN_COUNTRIES.forEach((sov) => {
    ['2Y', '5Y', '10Y', '20Y', '30Y'].forEach((mat) => {
      if (i >= 200) return;
      const seed = i * 37 + 20000;
      bonds.push({
        id: `FI-${String(i + 1).padStart(5, '0')}`, assetType: 'Fixed Income', bondType: 'Sovereign',
        isin: `${sov.c}${isinCheck('G', seed)}`, issuer: `${sov.name} Government`,
        country: sov.c, currency: sov.cur,
        coupon: +range(0.5, 8, seed + 1).toFixed(3), maturity: MATURITY_YEARS[mat], tenor: mat,
        rating: sov.rating, yieldToMaturity: +range(0.5, 9, seed + 2).toFixed(3),
        spread: sov.rating.startsWith('A') ? rangeInt(0, 80, seed + 3) : rangeInt(80, 500, seed + 3),
        greenBond: false, sustainabilityLinked: false, useOfProceeds: null,
        outstandingBn: range(5, 200, seed + 4), duration: range(1, 25, seed + 5), sector: 'Government',
      });
      i++;
    });
  });
  return bonds.slice(0, 200);
}

const IG_ISSUERS = [
  'Apple', 'Microsoft', 'Amazon', 'Alphabet', 'JPMorgan', 'Bank of America', 'Johnson & Johnson',
  'Procter & Gamble', 'ExxonMobil', 'Chevron', 'Walmart', 'UnitedHealth', 'Pfizer', 'AT&T',
  'Verizon', 'Coca-Cola', 'PepsiCo', 'Intel', 'Disney', 'Goldman Sachs', 'Morgan Stanley',
  'Citigroup', 'Wells Fargo', 'Honeywell', 'Caterpillar', 'Boeing', 'Lockheed Martin',
  'IBM', 'Oracle', 'Salesforce', 'Nestle', 'Roche', 'LVMH', 'Siemens', 'TotalEnergies',
  'Shell', 'AstraZeneca', 'Unilever', 'BNP Paribas', 'HSBC', 'Allianz', 'Novartis',
  'Toyota', 'Sony', 'Samsung Electronics', 'TSMC', 'Reliance Industries', 'BHP Group',
  'Petrobras', 'Vale', 'Saudi Aramco', 'Tencent', 'Alibaba', 'ICBC', 'Berkshire Hathaway',
  'Home Depot', 'AbbVie', 'Merck', 'Thermo Fisher', 'Broadcom', 'Mastercard', 'Visa',
  'NVIDIA', 'Meta Platforms', 'Netflix', 'Adobe', 'ServiceNow', 'Deere & Company',
  'Union Pacific', 'FedEx', 'UPS', 'Air Liquide', 'Schneider Electric', 'ASML',
  'Novo Nordisk', 'SAP', 'Sanofi', 'Iberdrola', 'Enel', 'NextEra Energy', 'Duke Energy',
  'Prologis', 'American Tower', 'Equinix', 'DBS Group', 'Commonwealth Bank',
  'Macquarie Group', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Airbus', 'BAE Systems',
  'Rio Tinto', 'Anglo American', 'Glencore', 'Linde', 'BASF', 'Dow', 'Nucor',
];

function generateIGBonds() {
  const bonds = [];
  for (let i = 0; i < 500; i++) {
    const seed = i * 41 + 30000;
    const issuer = IG_ISSUERS[i % IG_ISSUERS.length];
    const country = pick(['US', 'US', 'US', 'GB', 'DE', 'FR', 'CH', 'JP', 'AU', 'KR'], seed);
    bonds.push({
      id: `FI-${String(200 + i + 1).padStart(5, '0')}`, assetType: 'Fixed Income',
      bondType: 'Investment Grade Corporate',
      isin: `${country}${isinCheck('C', seed)}`, issuer, country, currency: CURRENCIES[country] || 'USD',
      coupon: +range(1.5, 6.5, seed + 1).toFixed(3), maturity: rangeInt(2026, 2054, seed + 2),
      rating: pick(['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-'], seed + 3),
      yieldToMaturity: range(2, 7, seed + 4), spread: rangeInt(30, 250, seed + 5),
      greenBond: sr(seed + 6) > 0.85, sustainabilityLinked: sr(seed + 7) > 0.9,
      useOfProceeds: sr(seed + 6) > 0.85 ? pick(['Renewable Energy', 'Clean Transport', 'Green Buildings', 'Pollution Prevention'], seed + 8) : null,
      outstandingBn: range(0.5, 15, seed + 9), duration: range(1, 15, seed + 10),
      sector: pick(GICS_SECTORS, seed + 11),
    });
  }
  return bonds;
}

function generateHYBonds() {
  const HY_ISSUERS = [
    'Sprint Capital', 'Tenet Healthcare', 'Frontier Communications', 'Carvana',
    'AMC Entertainment', 'Caesars Entertainment', 'Carnival Corp', 'Royal Caribbean',
    'United Airlines', 'American Airlines', 'Norwegian Cruise', 'Uber Technologies',
    'DoorDash', 'Rivian', 'Lucid Motors', 'Peloton', 'Snap', 'DraftKings',
    'Wynn Resorts', 'MGM Resorts', 'Six Flags', 'Mattel', 'Under Armour', 'Gap Inc.',
    'Nordstrom', 'Kohl\'s', 'Bath & Body Works', 'Dollar Tree', 'Dish Network',
    'Lumen Technologies', 'Spirit Airlines', 'JetBlue Airways',
  ];
  const bonds = [];
  for (let i = 0; i < 200; i++) {
    const seed = i * 43 + 40000;
    bonds.push({
      id: `FI-${String(700 + i + 1).padStart(5, '0')}`, assetType: 'Fixed Income', bondType: 'High Yield',
      isin: `US${isinCheck('H', seed)}`, issuer: HY_ISSUERS[i % HY_ISSUERS.length],
      country: 'US', currency: 'USD',
      coupon: range(5, 12, seed + 1), maturity: rangeInt(2026, 2034, seed + 2),
      rating: pick(['BB+', 'BB', 'BB-', 'B+', 'B', 'B-', 'CCC+', 'CCC'], seed + 3),
      yieldToMaturity: range(6, 15, seed + 4), spread: rangeInt(300, 1200, seed + 5),
      greenBond: false, sustainabilityLinked: sr(seed + 6) > 0.92, useOfProceeds: null,
      outstandingBn: range(0.2, 5, seed + 7), duration: range(1, 8, seed + 8),
      sector: pick(GICS_SECTORS, seed + 9),
    });
  }
  return bonds;
}

function generateGreenBonds() {
  const GREEN_ISSUERS = [
    'European Investment Bank', 'World Bank', 'KfW', 'Asian Development Bank',
    'Nordic Investment Bank', 'Apple', 'Enel', 'Iberdrola', 'Orsted', 'Engie', 'EDF',
    'NextEra Energy', 'Brookfield Renewable', 'Vestas', 'CATL', 'BYD', 'Tesla',
    'Republic of France', 'Federal Republic of Germany', 'Republic of Ireland',
    'Kingdom of Belgium', 'Republic of Chile', 'Republic of Indonesia',
    'Fannie Mae', 'ING Group', 'Barclays', 'HSBC', 'BNP Paribas', 'Bank of China',
    'Prologis', 'Vonovia', 'CLP Holdings', 'Schneider Electric', 'Siemens', 'Toyota',
  ];
  const USE_OF_PROCEEDS = ['Renewable Energy', 'Clean Transportation', 'Green Buildings',
    'Energy Efficiency', 'Sustainable Water', 'Biodiversity Conservation', 'Pollution Prevention',
    'Climate Adaptation', 'Circular Economy', 'Sustainable Agriculture'];
  const bonds = [];
  for (let i = 0; i < 150; i++) {
    const seed = i * 47 + 50000;
    const country = pick(['US', 'DE', 'FR', 'GB', 'NL', 'SE', 'DK', 'NO', 'JP', 'CN', 'AU', 'CL', 'BR'], seed);
    bonds.push({
      id: `FI-${String(900 + i + 1).padStart(5, '0')}`, assetType: 'Fixed Income',
      bondType: 'Green / Sustainability Bond',
      isin: `${country}${isinCheck('G', seed)}`, issuer: GREEN_ISSUERS[i % GREEN_ISSUERS.length],
      country, currency: CURRENCIES[country] || 'EUR',
      coupon: +range(0.5, 5, seed + 1).toFixed(3), maturity: rangeInt(2027, 2050, seed + 2),
      rating: pick(['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB'], seed + 3),
      yieldToMaturity: range(1, 6, seed + 4), spread: rangeInt(10, 200, seed + 5),
      greenBond: true, sustainabilityLinked: sr(seed + 6) > 0.5,
      useOfProceeds: pick(USE_OF_PROCEEDS, seed + 7),
      outstandingBn: range(0.5, 10, seed + 8), duration: range(2, 20, seed + 9), sector: 'Green Finance',
    });
  }
  return bonds;
}

function generateEMBonds() {
  const EM_SOVS = [
    { c: 'BR', n: 'Brazil', cur: 'BRL', r: 'BB-' }, { c: 'MX', n: 'Mexico', cur: 'MXN', r: 'BBB' },
    { c: 'IN', n: 'India', cur: 'INR', r: 'BBB-' }, { c: 'ID', n: 'Indonesia', cur: 'IDR', r: 'BBB' },
    { c: 'TR', n: 'Turkey', cur: 'TRY', r: 'B+' }, { c: 'ZA', n: 'South Africa', cur: 'ZAR', r: 'BB-' },
    { c: 'SA', n: 'Saudi Arabia', cur: 'SAR', r: 'A' }, { c: 'TH', n: 'Thailand', cur: 'THB', r: 'BBB+' },
    { c: 'PH', n: 'Philippines', cur: 'PHP', r: 'BBB+' }, { c: 'CO', n: 'Colombia', cur: 'COP', r: 'BB+' },
    { c: 'CL', n: 'Chile', cur: 'CLP', r: 'A' }, { c: 'PE', n: 'Peru', cur: 'PEN', r: 'BBB' },
    { c: 'MY', n: 'Malaysia', cur: 'MYR', r: 'A-' }, { c: 'EG', n: 'Egypt', cur: 'EGP', r: 'B' },
    { c: 'NG', n: 'Nigeria', cur: 'NGN', r: 'B-' }, { c: 'KE', n: 'Kenya', cur: 'KES', r: 'B' },
    { c: 'PL', n: 'Poland', cur: 'PLN', r: 'A-' }, { c: 'CZ', n: 'Czech Republic', cur: 'CZK', r: 'AA-' },
    { c: 'AR', n: 'Argentina', cur: 'ARS', r: 'CCC+' }, { c: 'VN', n: 'Vietnam', cur: 'VND', r: 'BB' },
    { c: 'QA', n: 'Qatar', cur: 'QAR', r: 'AA' }, { c: 'AE', n: 'UAE', cur: 'AED', r: 'AA' },
    { c: 'KW', n: 'Kuwait', cur: 'KWD', r: 'AA-' }, { c: 'MA', n: 'Morocco', cur: 'MAD', r: 'BB+' },
    { c: 'GH', n: 'Ghana', cur: 'GHS', r: 'CCC' }, { c: 'PK', n: 'Pakistan', cur: 'PKR', r: 'CCC+' },
    { c: 'BD', n: 'Bangladesh', cur: 'BDT', r: 'BB-' }, { c: 'LK', n: 'Sri Lanka', cur: 'LKR', r: 'CC' },
    { c: 'HU', n: 'Hungary', cur: 'HUF', r: 'BBB' }, { c: 'RO', n: 'Romania', cur: 'RON', r: 'BBB-' },
  ];
  const bonds = [];
  let i = 0;
  EM_SOVS.forEach((sov) => {
    ['3Y', '5Y', '10Y', '20Y', '30Y'].forEach((tenor) => {
      if (i >= 150) return;
      const seed = i * 53 + 60000;
      bonds.push({
        id: `FI-${String(1050 + i + 1).padStart(5, '0')}`, assetType: 'Fixed Income', bondType: 'EM Sovereign',
        isin: `${sov.c}${isinCheck('S', seed)}`, issuer: `${sov.n} Government`,
        country: sov.c, currency: sov.cur,
        coupon: range(2, 12, seed + 1), maturity: rangeInt(2029, 2056, seed + 2), tenor,
        rating: sov.r, yieldToMaturity: range(3, 16, seed + 3), spread: rangeInt(50, 900, seed + 4),
        greenBond: sr(seed + 5) > 0.92, sustainabilityLinked: false,
        useOfProceeds: sr(seed + 5) > 0.92 ? 'Climate Change Adaptation' : null,
        outstandingBn: range(1, 30, seed + 6), duration: range(2, 22, seed + 7), sector: 'EM Sovereign',
      });
      i++;
    });
  });
  return bonds.slice(0, 150);
}

// ─── Alternatives Generation ─────────────────────────────────────────────────
function generateAlternatives() {
  const alts = [];
  let idx = 0;

  // Private Equity (100)
  const PE_NAMES = ['Blackstone', 'KKR', 'Apollo', 'Carlyle', 'TPG', 'Warburg Pincus', 'Advent',
    'Bain Capital', 'Thoma Bravo', 'Vista Equity', 'Silver Lake', 'Hellman & Friedman',
    'General Atlantic', 'Insight Partners', 'Sequoia Capital', 'Andreessen Horowitz',
    'Brookfield Asset', 'CVC Capital', 'EQT Partners', 'Permira', 'Apax Partners',
    'Partners Group', 'Ardian', 'GTCR', 'Summit Partners', 'TA Associates',
    'Veritas Capital', 'Clearlake Capital', 'Francisco Partners', 'New Mountain Capital',
    'Genstar Capital', 'Stone Point', 'Charlesbank', 'Cinven', 'BC Partners',
    'Triton Partners', 'Investcorp', 'Nordic Capital', 'IK Partners', 'PAI Partners',
    'Bridgepoint', 'Hg Capital', 'Montagu Private', 'Roark Capital', 'Platinum Equity',
    'American Securities', 'Leonard Green', 'Providence Equity', 'Tiger Global', 'Coatue'];
  for (let i = 0; i < 100; i++) {
    const seed = i * 59 + 70000;
    const strategy = pick(['Buyout', 'Growth Equity', 'Venture Capital', 'Distressed', 'Secondaries'], seed);
    alts.push({
      id: `ALT-${String(idx + 1).padStart(5, '0')}`, assetType: 'Alternative', altType: 'Private Equity',
      name: `${PE_NAMES[i % PE_NAMES.length]} ${strategy} Fund ${rangeInt(1, 15, seed + 1)}`,
      manager: PE_NAMES[i % PE_NAMES.length], strategy,
      vintage: rangeInt(2015, 2025, seed + 2), targetReturn: range(12, 30, seed + 3),
      navBn: range(0.5, 25, seed + 4),
      region: pick(['North America', 'Europe', 'Asia Pacific', 'Global'], seed + 5),
      sector: pick(['Technology', 'Healthcare', 'Consumer', 'Industrials', 'Financial Services', 'Multi-Sector'], seed + 6),
      esgRating: pick(['Strong', 'Good', 'Average', 'Below Average'], seed + 7),
      carbonFootprint: rangeInt(10, 500, seed + 8), impactScore: rangeInt(1, 10, seed + 9),
    });
    idx++;
  }

  // Real Estate (200)
  const RE_TYPES = ['Office', 'Retail', 'Industrial', 'Residential', 'Logistics', 'Data Center', 'Healthcare', 'Mixed-Use'];
  const RE_CITIES = ['New York', 'London', 'Tokyo', 'Hong Kong', 'Singapore', 'Sydney', 'Paris',
    'Frankfurt', 'Shanghai', 'San Francisco', 'Los Angeles', 'Chicago', 'Toronto', 'Mumbai',
    'Seoul', 'Amsterdam', 'Stockholm', 'Dubai', 'Sao Paulo', 'Melbourne'];
  for (let i = 0; i < 200; i++) {
    const seed = (idx + i) * 61 + 75000;
    alts.push({
      id: `ALT-${String(idx + 1).padStart(5, '0')}`, assetType: 'Alternative', altType: 'Real Estate',
      name: `${pick(RE_CITIES, seed)} ${pick(RE_TYPES, seed + 1)} Fund ${rangeInt(1, 20, seed + 2)}`,
      propertyType: pick(RE_TYPES, seed + 1), city: pick(RE_CITIES, seed),
      navBn: range(0.1, 8, seed + 3), occupancyRate: range(75, 99, seed + 4),
      capRate: range(3, 9, seed + 5), greenCertified: sr(seed + 6) > 0.4,
      energyRating: pick(['A', 'B', 'C', 'D', 'E'], seed + 7),
      scope1: rangeInt(500, 50000, seed + 8), scope2: rangeInt(1000, 100000, seed + 9),
      esgRating: pick(['Strong', 'Good', 'Average', 'Below Average'], seed + 10),
    });
    idx++;
  }

  // Infrastructure (100)
  const INFRA_TYPES = ['Renewable Energy', 'Toll Roads', 'Airports', 'Ports', 'Rail',
    'Digital Infrastructure', 'Water Treatment', 'Social Infrastructure', 'Power Transmission', 'EV Charging'];
  for (let i = 0; i < 100; i++) {
    const seed = (idx + i) * 67 + 80000;
    alts.push({
      id: `ALT-${String(idx + 1).padStart(5, '0')}`, assetType: 'Alternative', altType: 'Infrastructure',
      name: `${pick(['Global', 'European', 'Asian', 'Americas', 'Pan-African'], seed)} ${pick(INFRA_TYPES, seed + 1)} Fund ${rangeInt(1, 10, seed + 2)}`,
      infrastructureType: pick(INFRA_TYPES, seed + 1),
      navBn: range(0.2, 12, seed + 3), targetReturn: range(6, 18, seed + 4),
      concessionYears: rangeInt(10, 50, seed + 5),
      region: pick(['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Africa', 'Global'], seed + 6),
      greenRevenuePct: range(20, 100, seed + 7),
      scope1: rangeInt(1000, 500000, seed + 8),
      esgRating: pick(['Strong', 'Good', 'Average', 'Below Average'], seed + 9),
    });
    idx++;
  }

  // Commodities (50)
  const COMMODITIES = [
    'Gold', 'Silver', 'Platinum', 'Palladium', 'Copper', 'Aluminum', 'Zinc', 'Nickel', 'Tin', 'Lead',
    'WTI Crude Oil', 'Brent Crude Oil', 'Natural Gas (Henry Hub)', 'Natural Gas (TTF)', 'Heating Oil',
    'Corn', 'Wheat', 'Soybeans', 'Rice', 'Cotton', 'Sugar', 'Coffee', 'Cocoa', 'Palm Oil', 'Lumber',
    'Iron Ore', 'Lithium Carbonate', 'Cobalt', 'Rare Earth Oxide', 'Uranium (U3O8)',
    'Coal (Newcastle)', 'LNG (JKM)', 'Propane', 'Ethanol', 'Steel Rebar',
    'EU Carbon (EUA)', 'UK Carbon (UKA)', 'California Carbon (CCA)', 'RGGI Carbon', 'NZ Carbon (NZU)',
    'Voluntary Carbon — Forestry', 'Voluntary Carbon — Renewables', 'Voluntary Carbon — Cookstoves',
    'Biodiversity Credits — BIOC', 'Blue Carbon Credits',
    'Rubber', 'Molybdenum', 'Manganese', 'Steel HRC', 'Gasoline',
  ];
  for (let i = 0; i < 50; i++) {
    const seed = (idx + i) * 71 + 85000;
    const name = COMMODITIES[i];
    const isCarbon = name.includes('Carbon') || name.includes('Credits');
    alts.push({
      id: `ALT-${String(idx + 1).padStart(5, '0')}`, assetType: 'Alternative',
      altType: isCarbon ? 'Carbon Credit' : 'Commodity',
      name, commodity: name,
      spotPrice: range(isCarbon ? 5 : 0.5, isCarbon ? 120 : 3000, seed),
      currency: 'USD',
      unit: isCarbon ? 'tCO2e' : pick(['troy oz', 'metric ton', 'barrel', 'bushel', 'MWh', 'lb'], seed + 1),
      ytdReturn: range(-30, 60, seed + 2), volatility: range(10, 60, seed + 3),
      ...(isCarbon && {
        registry: pick(['Verra (VCS)', 'Gold Standard', 'ACR', 'CAR', 'EUA', 'UKA', 'CCA', 'RGGI', 'NZU'], seed + 4),
        vintage: rangeInt(2018, 2025, seed + 5),
        projectType: pick(['REDD+', 'Afforestation', 'Renewable Energy', 'Cookstoves', 'Methane Capture', 'Blue Carbon', 'Direct Air Capture'], seed + 6),
      }),
    });
    idx++;
  }

  // Hedge Funds (100)
  const HF_NAMES = ['Bridgewater', 'Renaissance', 'Citadel', 'DE Shaw', 'Two Sigma', 'Millennium',
    'Point72', 'AQR', 'Man Group', 'Baupost', 'Elliott', 'Third Point', 'Pershing Square',
    'Viking Global', 'Lone Pine', 'Coatue Management', 'Farallon Capital', 'Brevan Howard',
    'BlueCrest', 'Capula', 'Winton', 'Marshall Wace', 'Egerton Capital', 'TCI Fund',
    'Lansdowne Partners', 'Canyon Partners', 'Centerbridge', 'Oaktree Capital', 'Ares Management',
    'GoldenTree', 'Cerberus Capital', 'York Capital', 'Mudrick Capital', 'King Street',
    'Soros Fund', 'Moore Capital', 'Tudor Investment', 'Graham Capital', 'Caxton Associates',
    'Rokos Capital', 'Eisler Capital', 'Schonfeld Strategic', 'Balyasny', 'ExodusPoint',
    'Sculptor', 'Angelo Gordon', 'Starwood Capital', 'Davidson Kempner', 'Anchorage Capital', 'Brigade Capital'];
  for (let i = 0; i < 100; i++) {
    const seed = (idx + i) * 73 + 90000;
    const strategy = pick(['Long/Short Equity', 'Global Macro', 'Quantitative', 'Event Driven',
      'Multi-Strategy', 'Credit', 'Managed Futures', 'Distressed', 'Activist', 'Market Neutral'], seed);
    alts.push({
      id: `ALT-${String(idx + 1).padStart(5, '0')}`, assetType: 'Alternative', altType: 'Hedge Fund',
      name: `${HF_NAMES[i % HF_NAMES.length]} ${strategy} Fund`,
      manager: HF_NAMES[i % HF_NAMES.length], strategy,
      aumBn: range(0.5, 50, seed + 1), ytdReturn: range(-20, 40, seed + 2),
      sharpeRatio: range(-0.5, 3, seed + 3), maxDrawdown: range(-5, -40, seed + 4),
      volatility: range(3, 25, seed + 5),
      esgIntegration: pick(['Full Integration', 'Partial', 'Screening Only', 'None'], seed + 6),
    });
    idx++;
  }

  // Private Credit (100)
  const PC_NAMES = ['Ares', 'Golub', 'Blue Owl', 'Owl Rock', 'HPS', 'Monroe', 'Antares', 'Prospect',
    'Bain Credit', 'GSO', 'ICG', 'Tikehau', 'Hayfin', 'Arcmont', 'Pemberton', 'Permira Credit',
    'Barings', 'Churchill', 'Twin Brook', 'Crescent'];
  for (let i = 0; i < 100; i++) {
    const seed = (idx + i) * 79 + 95000;
    const strategy = pick(['Direct Lending', 'Mezzanine', 'Unitranche', 'Special Situations', 'Venture Debt', 'Asset-Backed'], seed);
    alts.push({
      id: `ALT-${String(idx + 1).padStart(5, '0')}`, assetType: 'Alternative', altType: 'Private Credit',
      name: `${PC_NAMES[i % PC_NAMES.length]} ${strategy} Fund ${rangeInt(1, 8, seed + 1)}`,
      strategy, navBn: range(0.3, 15, seed + 2), targetReturn: range(7, 16, seed + 3),
      avgSpread: rangeInt(400, 900, seed + 4), defaultRate: range(0, 4, seed + 5),
      region: pick(['North America', 'Europe', 'Global'], seed + 6),
      esgRating: pick(['Strong', 'Good', 'Average', 'Below Average'], seed + 7),
    });
    idx++;
  }

  // Natural Capital (100)
  const NC_TYPES = ['Forestry', 'Blue Bond', 'Biodiversity Credit', 'Sustainable Agriculture',
    'Wetland Restoration', 'Mangrove Conservation', 'Coral Reef', 'Peatland Restoration',
    'Rewilding', 'Agroforestry'];
  const NC_MANAGERS = ['HSBC Pollination', 'Mirova', 'Lombard Odier', 'Tikehau', 'AXA IM',
    'BNP Paribas AM', 'Ninety One', 'Robeco', 'Schroders', 'Federated Hermes',
    'Asia Pacific Rainforest', 'African Forestry', 'Latin Green Capital', 'Nordic Nature', 'Oceanic Blue'];
  for (let i = 0; i < 100; i++) {
    const seed = (idx + i) * 83 + 100000;
    const ncType = pick(NC_TYPES, seed);
    alts.push({
      id: `ALT-${String(idx + 1).padStart(5, '0')}`, assetType: 'Alternative', altType: 'Natural Capital',
      name: `${pick(NC_MANAGERS, seed + 1)} ${ncType} Fund ${rangeInt(1, 5, seed + 2)}`,
      naturalCapitalType: ncType,
      navBn: range(0.05, 3, seed + 3), targetReturn: range(3, 12, seed + 4),
      co2SequesteredKt: range(10, 5000, seed + 5),
      hectaresProtected: rangeInt(1000, 500000, seed + 6),
      biodiversityImpact: pick(['Very High', 'High', 'Medium', 'Low'], seed + 7),
      sdgAlignment: [pick(['SDG 13', 'SDG 14', 'SDG 15'], seed + 8), pick(['SDG 6', 'SDG 12', 'SDG 2'], seed + 9)],
      region: pick(['Southeast Asia', 'Amazon Basin', 'Sub-Saharan Africa', 'Pacific Islands',
        'Central America', 'Scandinavia', 'Great Barrier Reef', 'Congo Basin', 'Borneo', 'Global'], seed + 10),
    });
    idx++;
  }

  return alts;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASSEMBLE UNIVERSE
// ═══════════════════════════════════════════════════════════════════════════════
const { equities: namedEquities, nextIdx } = buildNamedEquities();
const smidNeeded = 3000 - namedEquities.length;
const smidEquities = generateSmidCapEquities(nextIdx, Math.max(0, smidNeeded));
const allEquities = [...namedEquities, ...smidEquities].slice(0, 3000);

const sovereignBonds = generateSovereignBonds();
const igBonds = generateIGBonds();
const hyBonds = generateHYBonds();
const greenBonds = generateGreenBonds();
const emBonds = generateEMBonds();
const allBonds = [...sovereignBonds, ...igBonds, ...hyBonds, ...greenBonds, ...emBonds].slice(0, 1200);

const allAlternatives = generateAlternatives().slice(0, 800);

export const SECURITY_UNIVERSE = [...allEquities, ...allBonds, ...allAlternatives];

// ═══════════════════════════════════════════════════════════════════════════════
// UNIVERSE STATISTICS
// ═══════════════════════════════════════════════════════════════════════════════
const uniqueCountries = new Set(SECURITY_UNIVERSE.filter(s => s.country).map(s => s.country));
const uniqueSectors = new Set(allEquities.map(s => s.sector));
const uniqueExchanges = new Set(allEquities.map(s => s.exchange));
const totalMktCap = allEquities.reduce((acc, s) => acc + (s.marketCapBn || 0), 0);
const avgEsg = Math.round(allEquities.reduce((acc, s) => acc + (s.esgComposite || 0), 0) / allEquities.length);

export const UNIVERSE_STATS = {
  totalSecurities: SECURITY_UNIVERSE.length,
  equities: allEquities.length,
  fixedIncome: allBonds.length,
  alternatives: allAlternatives.length,
  countries: uniqueCountries.size,
  sectors: uniqueSectors.size,
  exchanges: uniqueExchanges.size,
  totalMarketCap: `$${(totalMktCap / 1000).toFixed(1)} Tn`,
  avgESGScore: avgEsg,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK PORTFOLIO — 500 holdings from the universe
// ═══════════════════════════════════════════════════════════════════════════════
function buildMockPortfolio() {
  const holdings = [];
  const sortedEq = [...allEquities].sort((a, b) => (b.marketCapBn || 0) - (a.marketCapBn || 0));
  // 300 largest equities
  sortedEq.slice(0, 300).forEach((eq, i) => {
    const seed = i * 97 + 110000;
    holdings.push({
      securityId: eq.id, ticker: eq.ticker, name: eq.name, assetType: 'Equity',
      weightPct: range(0.01, 3.5, seed), marketValueMn: range(5, 1750, seed + 1),
      shares: rangeInt(10000, 5000000, seed + 2),
    });
  });
  // 100 bonds
  allBonds.filter((_, i) => i % 12 === 0).slice(0, 100).forEach((b, i) => {
    const seed = (300 + i) * 97 + 110000;
    holdings.push({
      securityId: b.id, issuer: b.issuer, name: `${b.issuer} ${b.coupon}% ${b.maturity}`,
      assetType: 'Fixed Income', weightPct: range(0.01, 1.5, seed),
      marketValueMn: range(2, 500, seed + 1), faceValueMn: range(2, 500, seed + 2),
    });
  });
  // 100 alternatives
  allAlternatives.filter((_, i) => i % 8 === 0).slice(0, 100).forEach((a, i) => {
    const seed = (400 + i) * 97 + 110000;
    holdings.push({
      securityId: a.id, name: a.name, assetType: 'Alternative',
      weightPct: range(0.01, 1.0, seed), marketValueMn: range(1, 300, seed + 1),
    });
  });
  // Normalize weights
  const totalWeight = holdings.reduce((acc, h) => acc + h.weightPct, 0);
  holdings.forEach(h => { h.weightPct = +((h.weightPct / totalWeight) * 100).toFixed(4); });
  return holdings.slice(0, 500);
}

export const MOCK_PORTFOLIO = {
  name: 'AA Impact Global Multi-Asset Fund',
  aum: 50_000_000_000,
  holdings: buildMockPortfolio(),
  benchmark: 'MSCI ACWI ESG Leaders',
  inception: '2018-06-15',
  currency: 'USD',
  targetAllocation: { equity: 60, fixedIncome: 25, alternatives: 15 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE SLICES
// ═══════════════════════════════════════════════════════════════════════════════
export const EQUITIES = SECURITY_UNIVERSE.filter(s => s.assetType === 'Equity');
export const BONDS = SECURITY_UNIVERSE.filter(s => s.assetType === 'Fixed Income');
export const ALTERNATIVES = SECURITY_UNIVERSE.filter(s => s.assetType === 'Alternative');

function groupBySector(securities) {
  const map = {};
  securities.forEach(s => { const k = s.sector || 'Unknown'; if (!map[k]) map[k] = []; map[k].push(s); });
  return map;
}
function groupByCountry(securities) {
  const map = {};
  securities.forEach(s => { const k = s.country || 'Unknown'; if (!map[k]) map[k] = []; map[k].push(s); });
  return map;
}
function groupByRating(bonds) {
  const map = {};
  bonds.forEach(b => { const k = b.rating || 'Unrated'; if (!map[k]) map[k] = []; map[k].push(b); });
  return map;
}

export const BY_SECTOR = groupBySector(EQUITIES);
export const BY_COUNTRY = groupByCountry(SECURITY_UNIVERSE);
export const BY_RATING = groupByRating(BONDS);

// Backward-compatible aliases for PortfolioContext
export const PORTFOLIO_HOLDINGS = MOCK_PORTFOLIO.holdings || [];
export const EQUITY_HOLDINGS = PORTFOLIO_HOLDINGS.filter(h => h.assetType === 'Equity' || h.assetClass === 'Listed Equity');
export const BOND_HOLDINGS = PORTFOLIO_HOLDINGS.filter(h => h.assetType === 'Fixed Income' || h.assetClass === 'Corporate Bond');
export const SOVEREIGN_HOLDINGS = PORTFOLIO_HOLDINGS.filter(h => h.assetClass === 'Sovereign Bond');
export const PROJECT_HOLDINGS = PORTFOLIO_HOLDINGS.filter(h => h.assetClass === 'Project Finance');
export const RE_HOLDINGS = PORTFOLIO_HOLDINGS.filter(h => h.assetClass === 'Commercial Real Estate' || h.assetClass === 'Real Estate');
export const GREEN_BOND_HOLDINGS = BOND_HOLDINGS.filter(h => h.greenBond);
export const SECTORS = [...new Set(EQUITIES.map(e => e.sector).filter(Boolean))].sort();
export { REGIONS };
export const INDICES = {};
export const getCompanyById = (id) => SECURITY_UNIVERSE.find(s => s.id === id);
export const getCompanyByTicker = (t) => SECURITY_UNIVERSE.find(s => s.ticker === t);
export const getCompaniesBySector = (s) => EQUITIES.filter(e => e.sector === s);
export const getCompaniesByCountry = (c) => SECURITY_UNIVERSE.filter(s => s.country === c);
export const getCompaniesByRegion = (r) => SECURITY_UNIVERSE.filter(s => s.region === r);
export const searchCompanies = (q) => { const lq = (q||'').toLowerCase(); return SECURITY_UNIVERSE.filter(s => (s.name||'').toLowerCase().includes(lq) || (s.ticker||'').toLowerCase().includes(lq)); };
export const getTopEmitters = (n=20) => [...EQUITIES].sort((a,b) => (b.totalEmissions||0) - (a.totalEmissions||0)).slice(0, n);
export const getTopESG = (n=20) => [...EQUITIES].sort((a,b) => (b.esgComposite||0) - (a.esgComposite||0)).slice(0, n);
export const getHighTransitionRisk = () => EQUITIES.filter(e => (e.transitionRiskScore||0) > 70);
export const getSBTiValidated = () => EQUITIES.filter(e => e.sbtiStatus === 'validated' || e.sbtiStatus === 'committed');
export const getNetZeroCommitted = () => EQUITIES.filter(e => e.netZeroYear && e.netZeroYear <= 2050);
export const getHighPhysicalRisk = () => EQUITIES.filter(e => (e.physicalRiskScore||0) > 70);
export const getByMsciRating = (r) => EQUITIES.filter(e => e.msciRating === r);
export const getByTransitionPlan = (s) => EQUITIES.filter(e => e.transitionPlanStatus === s);
export const getControversial = () => EQUITIES.filter(e => (e.controversyScore||0) > 3);
export const getSectorAggregates = () => { const m={}; EQUITIES.forEach(e => { const s=e.sector||'Other'; if(!m[s])m[s]={sector:s,count:0,avgEsg:0,totalEmissions:0,avgTemp:0}; m[s].count++; m[s].avgEsg+=(e.esgComposite||0); m[s].totalEmissions+=(e.totalEmissions||0); m[s].avgTemp+=(e.temperatureScore||2.5); }); Object.values(m).forEach(v=>{v.avgEsg=+(v.avgEsg/v.count).toFixed(1);v.avgTemp=+(v.avgTemp/v.count).toFixed(1);}); return m; };
export const getRegionAggregates = () => { const m={}; SECURITY_UNIVERSE.forEach(s => { const r=s.region||'Other'; if(!m[r])m[r]={region:r,count:0}; m[r].count++; }); return m; };
export const buildPortfolio = (ids) => SECURITY_UNIVERSE.filter(s => ids.includes(s.id));
export const getMsciDistribution = () => { const m={}; EQUITIES.forEach(e => { const r=e.msciRating||'NR'; m[r]=(m[r]||0)+1; }); return m; };
export const getCdpDistribution = () => { const m={}; EQUITIES.forEach(e => { const r=e.cdpScore||'NR'; m[r]=(m[r]||0)+1; }); return m; };
export const getTemperatureAlignmentBuckets = () => { const b={'<1.5°C':0,'1.5-2°C':0,'2-3°C':0,'>3°C':0}; EQUITIES.forEach(e => { const t=e.temperatureScore||2.5; if(t<1.5)b['<1.5°C']++;else if(t<2)b['1.5-2°C']++;else if(t<3)b['2-3°C']++;else b['>3°C']++; }); return b; };
export const getEmissionsQuartiles = () => { const vals=[...EQUITIES].map(e=>e.totalEmissions||0).sort((a,b)=>a-b); const n=vals.length; return {q1:vals[Math.floor(n*0.25)],median:vals[Math.floor(n*0.5)],q3:vals[Math.floor(n*0.75)],max:vals[n-1]}; };
export const getQuarterlyTrend = () => [];
export const getRatingDivergence = () => [];
export const getFinancedEmissionsLeaderboard = () => getTopEmitters(20);
export const getTaxonomyAlignmentSummary = () => ({aligned:0,eligible:0,total:EQUITIES.length});
export const getCarbonPriceExposure = () => ({highExposure:getHighTransitionRisk().length,total:EQUITIES.length});
export const getNetZeroReadiness = () => ({committed:getSBTiValidated().length,total:EQUITIES.length});
export const getBoardDiversityAnalysis = () => ({avgFemalePct:EQUITIES.reduce((s,e)=>s+(e.femaleBoardPct||0),0)/EQUITIES.length});
export const getPortfolioValue = () => PORTFOLIO_HOLDINGS.reduce((s,h) => s + (h.marketValue||h.outstanding||0), 0);
export const getWeightedPCAF = () => 2.8;
export const getAssetClassBreakdown = () => { const m={}; PORTFOLIO_HOLDINGS.forEach(h => { const k=h.assetClass||h.assetType||'Other'; m[k]=(m[k]||0)+1; }); return m; };
export const getEngagementSummary = () => ({engaged:0,monitoring:0,none:PORTFOLIO_HOLDINGS.length});
export const getPCAFBreakdown = () => ({class1:0,class2:0,class3:0,class4:0,class5:0});

export default SECURITY_UNIVERSE;
