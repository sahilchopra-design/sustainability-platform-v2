/**
 * masterUniverse.js — SINGLE SOURCE OF TRUTH
 * 300 real publicly-traded companies with comprehensive ESG/climate/financial data.
 * Every module in the platform derives its data from this file.
 *
 * Deterministic: uses seeded PRNG — NO Math.random() anywhere.
 */

/* ── Deterministic PRNG ─────────────────────────────────────────────── */
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const pick = (arr, seed) => arr[Math.floor(sr(seed) * arr.length)];
const range = (min, max, seed) => +(min + sr(seed) * (max - min)).toFixed(2);
const rangeInt = (min, max, seed) => Math.floor(min + sr(seed) * (max - min + 1));

/* ── MSCI rating helpers ────────────────────────────────────────────── */
const MSCI_SCALE = ['CCC','B','BB','BBB','A','AA','AAA'];
const CDP_SCALE = ['D-','D','C-','C','B-','B','A-','A'];
const ACT_SCALE = ['E','D','C','B','A'];
const SBTI_OPTS = ['committed','validated','none'];
const NZ_OPTS = ['NZAM','NZAOA','NZBA','none'];
const TRANS_PLAN = ['published','draft','none'];
const PCAF_CLASSES = ['Listed Equity','Corporate Bonds','Business Loans','Commercial Real Estate','Mortgages','Motor Vehicle Loans'];

/* ── Sector definitions with profiles ───────────────────────────────── */
const SECTOR_PROFILES = {
  'Oil & Gas':            { avgIntensity: 420, weight: 5.2,  trisk: 'very-high', s1Mult: 80, s2Mult: 12, s3Mult: 300, esgBias: -25 },
  'Integrated Oil':       { avgIntensity: 380, weight: 3.1,  trisk: 'very-high', s1Mult: 70, s2Mult: 10, s3Mult: 280, esgBias: -22 },
  'Mining & Metals':      { avgIntensity: 350, weight: 2.8,  trisk: 'high',      s1Mult: 60, s2Mult: 15, s3Mult: 200, esgBias: -18 },
  'Electric Utilities':   { avgIntensity: 520, weight: 3.5,  trisk: 'high',      s1Mult: 90, s2Mult: 8,  s3Mult: 50,  esgBias: -10 },
  'Chemicals':            { avgIntensity: 280, weight: 2.1,  trisk: 'high',      s1Mult: 40, s2Mult: 12, s3Mult: 120, esgBias: -12 },
  'Automobiles':          { avgIntensity: 180, weight: 2.4,  trisk: 'high',      s1Mult: 15, s2Mult: 8,  s3Mult: 250, esgBias: -5  },
  'Steel & Cement':       { avgIntensity: 600, weight: 1.5,  trisk: 'very-high', s1Mult: 100,s2Mult: 20, s3Mult: 80,  esgBias: -20 },
  'Airlines & Shipping':  { avgIntensity: 450, weight: 1.2,  trisk: 'very-high', s1Mult: 70, s2Mult: 5,  s3Mult: 30,  esgBias: -15 },
  'Consumer Staples':     { avgIntensity: 85,  weight: 6.8,  trisk: 'medium',    s1Mult: 5,  s2Mult: 3,  s3Mult: 60,  esgBias: 5   },
  'Consumer Discretionary':{ avgIntensity: 65, weight: 5.5,  trisk: 'medium',    s1Mult: 3,  s2Mult: 2,  s3Mult: 40,  esgBias: 3   },
  'Pharmaceuticals':      { avgIntensity: 45,  weight: 7.2,  trisk: 'low',       s1Mult: 4,  s2Mult: 3,  s3Mult: 25,  esgBias: 8   },
  'Technology':           { avgIntensity: 18,  weight: 22.5, trisk: 'low',       s1Mult: 1,  s2Mult: 5,  s3Mult: 15,  esgBias: 15  },
  'Semiconductors':       { avgIntensity: 35,  weight: 8.5,  trisk: 'low',       s1Mult: 3,  s2Mult: 8,  s3Mult: 20,  esgBias: 10  },
  'Banks':                { avgIntensity: 8,   weight: 8.2,  trisk: 'medium',    s1Mult: 0.3,s2Mult: 1,  s3Mult: 500, esgBias: 0   },
  'Insurance':            { avgIntensity: 6,   weight: 3.8,  trisk: 'medium',    s1Mult: 0.2,s2Mult: 0.8,s3Mult: 300, esgBias: 2   },
  'Diversified Financials':{ avgIntensity: 7,  weight: 4.5,  trisk: 'medium',    s1Mult: 0.2,s2Mult: 0.9,s3Mult: 350, esgBias: 1   },
  'Industrials':          { avgIntensity: 120, weight: 5.8,  trisk: 'medium',    s1Mult: 10, s2Mult: 5,  s3Mult: 80,  esgBias: 0   },
  'Real Estate':          { avgIntensity: 55,  weight: 2.5,  trisk: 'medium',    s1Mult: 2,  s2Mult: 10, s3Mult: 30,  esgBias: 2   },
  'Telecom':              { avgIntensity: 25,  weight: 2.8,  trisk: 'low',       s1Mult: 1,  s2Mult: 6,  s3Mult: 12,  esgBias: 5   },
  'Healthcare Equipment': { avgIntensity: 30,  weight: 4.2,  trisk: 'low',       s1Mult: 2,  s2Mult: 3,  s3Mult: 18,  esgBias: 8   },
};

/* ── Raw company definitions (300) ──────────────────────────────────── */
const RAW_COMPANIES = [
  // ── US Mega-cap Tech (1-20)
  { name:'Apple',ticker:'AAPL',sector:'Technology',country:'US',mcap:2950,rev:394,emp:164000 },
  { name:'Microsoft',ticker:'MSFT',sector:'Technology',country:'US',mcap:2800,rev:212,emp:221000 },
  { name:'Alphabet',ticker:'GOOGL',sector:'Technology',country:'US',mcap:1750,rev:307,emp:182000 },
  { name:'Amazon',ticker:'AMZN',sector:'Technology',country:'US',mcap:1620,rev:575,emp:1540000 },
  { name:'NVIDIA',ticker:'NVDA',sector:'Semiconductors',country:'US',mcap:1500,rev:61,emp:29600 },
  { name:'Meta Platforms',ticker:'META',sector:'Technology',country:'US',mcap:920,rev:135,emp:67317 },
  { name:'Tesla',ticker:'TSLA',sector:'Automobiles',country:'US',mcap:780,rev:97,emp:128000 },
  { name:'Broadcom',ticker:'AVGO',sector:'Semiconductors',country:'US',mcap:620,rev:36,emp:20000 },
  { name:'Salesforce',ticker:'CRM',sector:'Technology',country:'US',mcap:260,rev:35,emp:73000 },
  { name:'Adobe',ticker:'ADBE',sector:'Technology',country:'US',mcap:245,rev:20,emp:30000 },
  { name:'AMD',ticker:'AMD',sector:'Semiconductors',country:'US',mcap:210,rev:23,emp:26000 },
  { name:'Cisco Systems',ticker:'CSCO',sector:'Technology',country:'US',mcap:205,rev:57,emp:84900 },
  { name:'Oracle',ticker:'ORCL',sector:'Technology',country:'US',mcap:310,rev:53,emp:143000 },
  { name:'Intel',ticker:'INTC',sector:'Semiconductors',country:'US',mcap:125,rev:54,emp:124800 },
  { name:'IBM',ticker:'IBM',sector:'Technology',country:'US',mcap:170,rev:62,emp:288300 },
  { name:'Qualcomm',ticker:'QCOM',sector:'Semiconductors',country:'US',mcap:165,rev:39,emp:51000 },
  { name:'Texas Instruments',ticker:'TXN',sector:'Semiconductors',country:'US',mcap:158,rev:18,emp:34000 },
  { name:'Intuit',ticker:'INTU',sector:'Technology',country:'US',mcap:155,rev:15,emp:17300 },
  { name:'ServiceNow',ticker:'NOW',sector:'Technology',country:'US',mcap:142,rev:9,emp:22800 },
  { name:'Palantir Technologies',ticker:'PLTR',sector:'Technology',country:'US',mcap:95,rev:2.8,emp:3700 },
  // ── US Healthcare / Pharma (21-40)
  { name:'UnitedHealth Group',ticker:'UNH',sector:'Healthcare Equipment',country:'US',mcap:480,rev:372,emp:400000 },
  { name:'Johnson & Johnson',ticker:'JNJ',sector:'Pharmaceuticals',country:'US',mcap:420,rev:85,emp:131900 },
  { name:'Eli Lilly',ticker:'LLY',sector:'Pharmaceuticals',country:'US',mcap:580,rev:34,emp:43000 },
  { name:'Pfizer',ticker:'PFE',sector:'Pharmaceuticals',country:'US',mcap:160,rev:58,emp:83000 },
  { name:'AbbVie',ticker:'ABBV',sector:'Pharmaceuticals',country:'US',mcap:290,rev:58,emp:50000 },
  { name:'Merck & Co.',ticker:'MRK',sector:'Pharmaceuticals',country:'US',mcap:275,rev:60,emp:69000 },
  { name:'Thermo Fisher Scientific',ticker:'TMO',sector:'Healthcare Equipment',country:'US',mcap:210,rev:43,emp:122000 },
  { name:'Abbott Laboratories',ticker:'ABT',sector:'Healthcare Equipment',country:'US',mcap:195,rev:40,emp:113000 },
  { name:'Danaher',ticker:'DHR',sector:'Healthcare Equipment',country:'US',mcap:185,rev:31,emp:80000 },
  { name:'Amgen',ticker:'AMGN',sector:'Pharmaceuticals',country:'US',mcap:145,rev:27,emp:27000 },
  { name:'Gilead Sciences',ticker:'GILD',sector:'Pharmaceuticals',country:'US',mcap:102,rev:27,emp:17000 },
  { name:'Medtronic',ticker:'MDT',sector:'Healthcare Equipment',country:'US',mcap:108,rev:32,emp:95000 },
  { name:'Intuitive Surgical',ticker:'ISRG',sector:'Healthcare Equipment',country:'US',mcap:140,rev:7,emp:12000 },
  { name:'Boston Scientific',ticker:'BSX',sector:'Healthcare Equipment',country:'US',mcap:98,rev:15,emp:47000 },
  { name:'Regeneron',ticker:'REGN',sector:'Pharmaceuticals',country:'US',mcap:105,rev:13,emp:12600 },
  { name:'Vertex Pharmaceuticals',ticker:'VRTX',sector:'Pharmaceuticals',country:'US',mcap:92,rev:9,emp:10400 },
  { name:'Edwards Lifesciences',ticker:'EW',sector:'Healthcare Equipment',country:'US',mcap:45,rev:6,emp:19700 },
  { name:'Becton Dickinson',ticker:'BDX',sector:'Healthcare Equipment',country:'US',mcap:68,rev:20,emp:75000 },
  { name:'Stryker',ticker:'SYK',sector:'Healthcare Equipment',country:'US',mcap:120,rev:20,emp:51000 },
  { name:'Zimmer Biomet',ticker:'ZBH',sector:'Healthcare Equipment',country:'US',mcap:25,rev:7,emp:18500 },
  // ── US Consumer (41-60)
  { name:'Procter & Gamble',ticker:'PG',sector:'Consumer Staples',country:'US',mcap:365,rev:82,emp:107000 },
  { name:'Coca-Cola',ticker:'KO',sector:'Consumer Staples',country:'US',mcap:265,rev:45,emp:82500 },
  { name:'PepsiCo',ticker:'PEP',sector:'Consumer Staples',country:'US',mcap:240,rev:86,emp:315000 },
  { name:'Costco',ticker:'COST',sector:'Consumer Staples',country:'US',mcap:290,rev:242,emp:316000 },
  { name:'Walmart',ticker:'WMT',sector:'Consumer Staples',country:'US',mcap:430,rev:648,emp:2100000 },
  { name:'Home Depot',ticker:'HD',sector:'Consumer Discretionary',country:'US',mcap:340,rev:157,emp:475000 },
  { name:"McDonald's",ticker:'MCD',sector:'Consumer Discretionary',country:'US',mcap:210,rev:24,emp:150000 },
  { name:'Nike',ticker:'NKE',sector:'Consumer Discretionary',country:'US',mcap:145,rev:51,emp:79400 },
  { name:'Starbucks',ticker:'SBUX',sector:'Consumer Discretionary',country:'US',mcap:105,rev:36,emp:381000 },
  { name:'Walt Disney',ticker:'DIS',sector:'Consumer Discretionary',country:'US',mcap:175,rev:89,emp:220000 },
  { name:'Philip Morris International',ticker:'PM',sector:'Consumer Staples',country:'US',mcap:155,rev:35,emp:71300 },
  { name:'Colgate-Palmolive',ticker:'CL',sector:'Consumer Staples',country:'US',mcap:72,rev:19,emp:34200 },
  { name:'Mondelez International',ticker:'MDLZ',sector:'Consumer Staples',country:'US',mcap:88,rev:36,emp:91000 },
  { name:'Estee Lauder',ticker:'EL',sector:'Consumer Discretionary',country:'US',mcap:32,rev:16,emp:62000 },
  { name:'General Mills',ticker:'GIS',sector:'Consumer Staples',country:'US',mcap:38,rev:20,emp:35000 },
  { name:'Kellogg Company',ticker:'K',sector:'Consumer Staples',country:'US',mcap:22,rev:16,emp:34000 },
  { name:'Target',ticker:'TGT',sector:'Consumer Discretionary',country:'US',mcap:58,rev:107,emp:440000 },
  { name:'Lowe\'s',ticker:'LOW',sector:'Consumer Discretionary',country:'US',mcap:125,rev:86,emp:300000 },
  { name:'Booking Holdings',ticker:'BKNG',sector:'Consumer Discretionary',country:'US',mcap:120,rev:21,emp:21700 },
  { name:'Marriott International',ticker:'MAR',sector:'Consumer Discretionary',country:'US',mcap:62,rev:24,emp:120000 },
  // ── US Financials (61-85)
  { name:'JPMorgan Chase',ticker:'JPM',sector:'Banks',country:'US',mcap:490,rev:155,emp:293723 },
  { name:'Bank of America',ticker:'BAC',sector:'Banks',country:'US',mcap:265,rev:99,emp:217000 },
  { name:'Wells Fargo',ticker:'WFC',sector:'Banks',country:'US',mcap:175,rev:78,emp:234000 },
  { name:'Goldman Sachs',ticker:'GS',sector:'Banks',country:'US',mcap:130,rev:47,emp:45100 },
  { name:'Morgan Stanley',ticker:'MS',sector:'Banks',country:'US',mcap:145,rev:54,emp:82000 },
  { name:'Citigroup',ticker:'C',sector:'Banks',country:'US',mcap:95,rev:78,emp:240000 },
  { name:'Charles Schwab',ticker:'SCHW',sector:'Diversified Financials',country:'US',mcap:118,rev:19,emp:36800 },
  { name:'BlackRock',ticker:'BLK',sector:'Diversified Financials',country:'US',mcap:108,rev:18,emp:19800 },
  { name:'S&P Global',ticker:'SPGI',sector:'Diversified Financials',country:'US',mcap:130,rev:13,emp:40500 },
  { name:'Visa',ticker:'V',sector:'Diversified Financials',country:'US',mcap:510,rev:33,emp:26500 },
  { name:'Mastercard',ticker:'MA',sector:'Diversified Financials',country:'US',mcap:380,rev:25,emp:29900 },
  { name:'American Express',ticker:'AXP',sector:'Diversified Financials',country:'US',mcap:155,rev:60,emp:77300 },
  { name:'Berkshire Hathaway',ticker:'BRK.B',sector:'Insurance',country:'US',mcap:790,rev:365,emp:396000 },
  { name:'Progressive Corp.',ticker:'PGR',sector:'Insurance',country:'US',mcap:110,rev:62,emp:55000 },
  { name:'Marsh McLennan',ticker:'MMC',sector:'Insurance',country:'US',mcap:98,rev:23,emp:85000 },
  { name:'Chubb',ticker:'CB',sector:'Insurance',country:'US',mcap:95,rev:50,emp:40000 },
  { name:'MetLife',ticker:'MET',sector:'Insurance',country:'US',mcap:52,rev:71,emp:45000 },
  { name:'Aon',ticker:'AON',sector:'Insurance',country:'US',mcap:68,rev:14,emp:50000 },
  { name:'CME Group',ticker:'CME',sector:'Diversified Financials',country:'US',mcap:78,rev:5.6,emp:4400 },
  { name:'Intercontinental Exchange',ticker:'ICE',sector:'Diversified Financials',country:'US',mcap:72,rev:9,emp:12200 },
  { name:'Moody\'s',ticker:'MCO',sector:'Diversified Financials',country:'US',mcap:70,rev:6,emp:14700 },
  { name:'T. Rowe Price',ticker:'TROW',sector:'Diversified Financials',country:'US',mcap:25,rev:6.5,emp:7600 },
  { name:'State Street',ticker:'STT',sector:'Banks',country:'US',mcap:24,rev:12,emp:46000 },
  { name:'Northern Trust',ticker:'NTRS',sector:'Banks',country:'US',mcap:18,rev:7,emp:23500 },
  { name:'PNC Financial',ticker:'PNC',sector:'Banks',country:'US',mcap:65,rev:22,emp:60000 },
  // ── US Industrials (86-105)
  { name:'General Electric',ticker:'GE',sector:'Industrials',country:'US',mcap:185,rev:68,emp:125000 },
  { name:'Honeywell',ticker:'HON',sector:'Industrials',country:'US',mcap:135,rev:37,emp:97000 },
  { name:'Caterpillar',ticker:'CAT',sector:'Industrials',country:'US',mcap:155,rev:67,emp:113200 },
  { name:'Deere & Company',ticker:'DE',sector:'Industrials',country:'US',mcap:115,rev:55,emp:83000 },
  { name:'Union Pacific',ticker:'UNP',sector:'Industrials',country:'US',mcap:140,rev:24,emp:32000 },
  { name:'UPS',ticker:'UPS',sector:'Industrials',country:'US',mcap:108,rev:91,emp:500000 },
  { name:'FedEx',ticker:'FDX',sector:'Industrials',country:'US',mcap:60,rev:87,emp:518000 },
  { name:'Lockheed Martin',ticker:'LMT',sector:'Industrials',country:'US',mcap:115,rev:67,emp:116000 },
  { name:'Raytheon Technologies',ticker:'RTX',sector:'Industrials',country:'US',mcap:140,rev:69,emp:182000 },
  { name:'Boeing',ticker:'BA',sector:'Airlines & Shipping',country:'US',mcap:125,rev:78,emp:171000 },
  { name:'3M',ticker:'MMM',sector:'Industrials',country:'US',mcap:58,rev:34,emp:92000 },
  { name:'Illinois Tool Works',ticker:'ITW',sector:'Industrials',country:'US',mcap:72,rev:16,emp:46000 },
  { name:'Emerson Electric',ticker:'EMR',sector:'Industrials',country:'US',mcap:58,rev:17,emp:67000 },
  { name:'Parker-Hannifin',ticker:'PH',sector:'Industrials',country:'US',mcap:62,rev:19,emp:62730 },
  { name:'Northrop Grumman',ticker:'NOC',sector:'Industrials',country:'US',mcap:72,rev:37,emp:95000 },
  { name:'General Dynamics',ticker:'GD',sector:'Industrials',country:'US',mcap:68,rev:42,emp:106500 },
  { name:'Waste Management',ticker:'WM',sector:'Industrials',country:'US',mcap:78,rev:20,emp:48000 },
  { name:'Republic Services',ticker:'RSG',sector:'Industrials',country:'US',mcap:55,rev:15,emp:41000 },
  { name:'Eaton Corp.',ticker:'ETN',sector:'Industrials',country:'US',mcap:92,rev:23,emp:92000 },
  { name:'Cummins',ticker:'CMI',sector:'Industrials',country:'US',mcap:38,rev:34,emp:73600 },
  // ── US Energy (106-115)
  { name:'ExxonMobil',ticker:'XOM',sector:'Oil & Gas',country:'US',mcap:450,rev:398,emp:62000 },
  { name:'Chevron',ticker:'CVX',sector:'Oil & Gas',country:'US',mcap:310,rev:246,emp:43846 },
  { name:'ConocoPhillips',ticker:'COP',sector:'Oil & Gas',country:'US',mcap:135,rev:58,emp:10400 },
  { name:'EOG Resources',ticker:'EOG',sector:'Oil & Gas',country:'US',mcap:68,rev:23,emp:2900 },
  { name:'Pioneer Natural Resources',ticker:'PXD',sector:'Oil & Gas',country:'US',mcap:55,rev:20,emp:2100 },
  { name:'Schlumberger',ticker:'SLB',sector:'Oil & Gas',country:'US',mcap:65,rev:33,emp:99000 },
  { name:'Halliburton',ticker:'HAL',sector:'Oil & Gas',country:'US',mcap:28,rev:23,emp:48000 },
  { name:'Baker Hughes',ticker:'BKR',sector:'Oil & Gas',country:'US',mcap:32,rev:25,emp:55000 },
  { name:'Valero Energy',ticker:'VLO',sector:'Oil & Gas',country:'US',mcap:42,rev:149,emp:10015 },
  { name:'Marathon Petroleum',ticker:'MPC',sector:'Oil & Gas',country:'US',mcap:55,rev:180,emp:17800 },
  // ── US Utilities & Telecom (116-125)
  { name:'NextEra Energy',ticker:'NEE',sector:'Electric Utilities',country:'US',mcap:155,rev:28,emp:16000 },
  { name:'Duke Energy',ticker:'DUK',sector:'Electric Utilities',country:'US',mcap:78,rev:29,emp:27600 },
  { name:'Southern Company',ticker:'SO',sector:'Electric Utilities',country:'US',mcap:82,rev:25,emp:27000 },
  { name:'Dominion Energy',ticker:'D',sector:'Electric Utilities',country:'US',mcap:45,rev:17,emp:17000 },
  { name:'American Electric Power',ticker:'AEP',sector:'Electric Utilities',country:'US',mcap:48,rev:19,emp:16800 },
  { name:'AT&T',ticker:'T',sector:'Telecom',country:'US',mcap:118,rev:120,emp:160700 },
  { name:'Verizon',ticker:'VZ',sector:'Telecom',country:'US',mcap:155,rev:134,emp:117100 },
  { name:'T-Mobile US',ticker:'TMUS',sector:'Telecom',country:'US',mcap:192,rev:80,emp:71000 },
  { name:'Comcast',ticker:'CMCSA',sector:'Telecom',country:'US',mcap:152,rev:121,emp:186000 },
  { name:'Charter Communications',ticker:'CHTR',sector:'Telecom',country:'US',mcap:45,rev:55,emp:93700 },
  // ── US Real Estate (126-130)
  { name:'Prologis',ticker:'PLD',sector:'Real Estate',country:'US',mcap:112,rev:8,emp:2600 },
  { name:'American Tower',ticker:'AMT',sector:'Real Estate',country:'US',mcap:95,rev:11,emp:6600 },
  { name:'Crown Castle',ticker:'CCI',sector:'Real Estate',country:'US',mcap:42,rev:7,emp:5000 },
  { name:'Equinix',ticker:'EQIX',sector:'Real Estate',country:'US',mcap:72,rev:8,emp:13100 },
  { name:'Simon Property Group',ticker:'SPG',sector:'Real Estate',country:'US',mcap:48,rev:6,emp:3100 },
  // ── European (131-180)
  { name:'Nestle',ticker:'NESN.SW',sector:'Consumer Staples',country:'CH',mcap:290,rev:98,emp:275000 },
  { name:'Roche Holding',ticker:'ROG.SW',sector:'Pharmaceuticals',country:'CH',mcap:225,rev:66,emp:101465 },
  { name:'Novartis',ticker:'NOVN.SW',sector:'Pharmaceuticals',country:'CH',mcap:210,rev:52,emp:105533 },
  { name:'LVMH',ticker:'MC.PA',sector:'Consumer Discretionary',country:'FR',mcap:385,rev:86,emp:213000 },
  { name:'ASML Holding',ticker:'ASML.AS',sector:'Semiconductors',country:'NL',mcap:305,rev:28,emp:42000 },
  { name:'TotalEnergies',ticker:'TTE.PA',sector:'Integrated Oil',country:'FR',mcap:145,rev:218,emp:101309 },
  { name:'Shell',ticker:'SHEL.L',sector:'Integrated Oil',country:'GB',mcap:210,rev:316,emp:86000 },
  { name:'BP',ticker:'BP.L',sector:'Integrated Oil',country:'GB',mcap:92,rev:241,emp:65900 },
  { name:'SAP',ticker:'SAP.DE',sector:'Technology',country:'DE',mcap:240,rev:34,emp:107415 },
  { name:'Siemens',ticker:'SIE.DE',sector:'Industrials',country:'DE',mcap:135,rev:78,emp:311000 },
  { name:'AstraZeneca',ticker:'AZN.L',sector:'Pharmaceuticals',country:'GB',mcap:220,rev:46,emp:89900 },
  { name:'Unilever',ticker:'ULVR.L',sector:'Consumer Staples',country:'GB',mcap:128,rev:62,emp:127000 },
  { name:'Rio Tinto',ticker:'RIO.L',sector:'Mining & Metals',country:'GB',mcap:105,rev:55,emp:49000 },
  { name:'BHP Group',ticker:'BHP.AX',sector:'Mining & Metals',country:'AU',mcap:155,rev:53,emp:80000 },
  { name:'Glencore',ticker:'GLEN.L',sector:'Mining & Metals',country:'CH',mcap:62,rev:220,emp:135000 },
  { name:'HSBC Holdings',ticker:'HSBA.L',sector:'Banks',country:'GB',mcap:155,rev:66,emp:219000 },
  { name:'Barclays',ticker:'BARC.L',sector:'Banks',country:'GB',mcap:35,rev:30,emp:85000 },
  { name:'Deutsche Bank',ticker:'DBK.DE',sector:'Banks',country:'DE',mcap:28,rev:28,emp:85000 },
  { name:'BNP Paribas',ticker:'BNP.PA',sector:'Banks',country:'FR',mcap:72,rev:50,emp:190000 },
  { name:'UBS Group',ticker:'UBSG.SW',sector:'Banks',country:'CH',mcap:95,rev:42,emp:74000 },
  { name:'Novo Nordisk',ticker:'NOVO-B.CO',sector:'Pharmaceuticals',country:'DK',mcap:440,rev:33,emp:63400 },
  { name:'Sanofi',ticker:'SAN.PA',sector:'Pharmaceuticals',country:'FR',mcap:125,rev:46,emp:91000 },
  { name:'GSK',ticker:'GSK.L',sector:'Pharmaceuticals',country:'GB',mcap:72,rev:37,emp:69000 },
  { name:'Allianz',ticker:'ALV.DE',sector:'Insurance',country:'DE',mcap:105,rev:162,emp:159000 },
  { name:'Zurich Insurance',ticker:'ZURN.SW',sector:'Insurance',country:'CH',mcap:72,rev:72,emp:56000 },
  { name:'ING Group',ticker:'INGA.AS',sector:'Banks',country:'NL',mcap:42,rev:22,emp:60000 },
  { name:'Enel',ticker:'ENEL.MI',sector:'Electric Utilities',country:'IT',mcap:68,rev:92,emp:56200 },
  { name:'Iberdrola',ticker:'IBE.MC',sector:'Electric Utilities',country:'ES',mcap:78,rev:53,emp:42100 },
  { name:'Schneider Electric',ticker:'SU.PA',sector:'Industrials',country:'FR',mcap:105,rev:36,emp:150000 },
  { name:'Air Liquide',ticker:'AI.PA',sector:'Chemicals',country:'FR',mcap:82,rev:30,emp:67100 },
  { name:'BASF',ticker:'BAS.DE',sector:'Chemicals',country:'DE',mcap:38,rev:69,emp:111481 },
  { name:'Linde',ticker:'LIN.DE',sector:'Chemicals',country:'DE',mcap:185,rev:33,emp:66000 },
  { name:'Volkswagen',ticker:'VOW3.DE',sector:'Automobiles',country:'DE',mcap:62,rev:295,emp:676000 },
  { name:'BMW',ticker:'BMW.DE',sector:'Automobiles',country:'DE',mcap:55,rev:155,emp:149475 },
  { name:'Mercedes-Benz',ticker:'MBG.DE',sector:'Automobiles',country:'DE',mcap:68,rev:153,emp:172425 },
  { name:'Stellantis',ticker:'STLAM.MI',sector:'Automobiles',country:'NL',mcap:42,rev:190,emp:281600 },
  { name:'Airbus',ticker:'AIR.PA',sector:'Airlines & Shipping',country:'FR',mcap:105,rev:79,emp:134267 },
  { name:'Rolls-Royce',ticker:'RR.L',sector:'Airlines & Shipping',country:'GB',mcap:38,rev:18,emp:42000 },
  { name:'Maersk',ticker:'MAERSK-B.CO',sector:'Airlines & Shipping',country:'DK',mcap:22,rev:51,emp:100000 },
  { name:'HeidelbergCement',ticker:'HEI.DE',sector:'Steel & Cement',country:'DE',mcap:15,rev:22,emp:51000 },
  // ── Asian (181-230)
  { name:'TSMC',ticker:'2330.TW',sector:'Semiconductors',country:'TW',mcap:620,rev:75,emp:73090 },
  { name:'Samsung Electronics',ticker:'005930.KS',sector:'Semiconductors',country:'KR',mcap:340,rev:210,emp:267937 },
  { name:'Toyota Motor',ticker:'7203.T',sector:'Automobiles',country:'JP',mcap:245,rev:275,emp:375235 },
  { name:'Sony Group',ticker:'6758.T',sector:'Technology',country:'JP',mcap:115,rev:88,emp:113000 },
  { name:'Hitachi',ticker:'6501.T',sector:'Industrials',country:'JP',mcap:72,rev:80,emp:368247 },
  { name:'Mitsubishi UFJ Financial',ticker:'8306.T',sector:'Banks',country:'JP',mcap:115,rev:58,emp:149700 },
  { name:'SoftBank Group',ticker:'9984.T',sector:'Diversified Financials',country:'JP',mcap:82,rev:56,emp:63000 },
  { name:'Keyence',ticker:'6861.T',sector:'Technology',country:'JP',mcap:105,rev:8,emp:12286 },
  { name:'Shin-Etsu Chemical',ticker:'4063.T',sector:'Chemicals',country:'JP',mcap:68,rev:16,emp:25900 },
  { name:'Daikin Industries',ticker:'6367.T',sector:'Industrials',country:'JP',mcap:52,rev:32,emp:96000 },
  { name:'Tokyo Electron',ticker:'8035.T',sector:'Semiconductors',country:'JP',mcap:88,rev:18,emp:17600 },
  { name:'Fast Retailing',ticker:'9983.T',sector:'Consumer Discretionary',country:'JP',mcap:78,rev:23,emp:56000 },
  { name:'Recruit Holdings',ticker:'6098.T',sector:'Industrials',country:'JP',mcap:65,rev:28,emp:60000 },
  { name:'Nintendo',ticker:'7974.T',sector:'Consumer Discretionary',country:'JP',mcap:62,rev:12,emp:7317 },
  { name:'Honda Motor',ticker:'7267.T',sector:'Automobiles',country:'JP',mcap:48,rev:142,emp:204035 },
  { name:'Alibaba Group',ticker:'9988.HK',sector:'Technology',country:'CN',mcap:185,rev:130,emp:235216 },
  { name:'Tencent Holdings',ticker:'0700.HK',sector:'Technology',country:'CN',mcap:375,rev:86,emp:104503 },
  { name:'Meituan',ticker:'3690.HK',sector:'Technology',country:'CN',mcap:95,rev:32,emp:78000 },
  { name:'BYD Company',ticker:'1211.HK',sector:'Automobiles',country:'CN',mcap:92,rev:78,emp:630000 },
  { name:'ICBC',ticker:'1398.HK',sector:'Banks',country:'CN',mcap:205,rev:125,emp:430000 },
  { name:'China Construction Bank',ticker:'0939.HK',sector:'Banks',country:'CN',mcap:175,rev:110,emp:350000 },
  { name:'Ping An Insurance',ticker:'2318.HK',sector:'Insurance',country:'CN',mcap:105,rev:185,emp:350000 },
  { name:'China Merchants Bank',ticker:'3968.HK',sector:'Banks',country:'CN',mcap:95,rev:48,emp:112000 },
  { name:'JD.com',ticker:'9618.HK',sector:'Consumer Discretionary',country:'CN',mcap:45,rev:152,emp:347000 },
  { name:'Baidu',ticker:'9888.HK',sector:'Technology',country:'CN',mcap:35,rev:19,emp:41200 },
  { name:'Reliance Industries',ticker:'RELIANCE.NS',sector:'Oil & Gas',country:'IN',mcap:210,rev:108,emp:389000 },
  { name:'Tata Consultancy Services',ticker:'TCS.NS',sector:'Technology',country:'IN',mcap:155,rev:28,emp:614795 },
  { name:'Infosys',ticker:'INFY.NS',sector:'Technology',country:'IN',mcap:78,rev:19,emp:343234 },
  { name:'HDFC Bank',ticker:'HDFCBANK.NS',sector:'Banks',country:'IN',mcap:135,rev:32,emp:177000 },
  { name:'ICICI Bank',ticker:'ICICIBANK.NS',sector:'Banks',country:'IN',mcap:82,rev:22,emp:130000 },
  // ── Additional global (231-270)
  { name:'Vale',ticker:'VALE3.SA',sector:'Mining & Metals',country:'BR',mcap:62,rev:42,emp:67000 },
  { name:'Petrobras',ticker:'PETR4.SA',sector:'Oil & Gas',country:'BR',mcap:85,rev:98,emp:45532 },
  { name:'Itau Unibanco',ticker:'ITUB4.SA',sector:'Banks',country:'BR',mcap:52,rev:35,emp:96000 },
  { name:'Banco Bradesco',ticker:'BBDC4.SA',sector:'Banks',country:'BR',mcap:35,rev:28,emp:87000 },
  { name:'Saudi Aramco',ticker:'2222.SR',sector:'Oil & Gas',country:'SA',mcap:1800,rev:535,emp:70496 },
  { name:'SABIC',ticker:'2010.SR',sector:'Chemicals',country:'SA',mcap:72,rev:42,emp:31000 },
  { name:'QatarEnergy',ticker:'QEWS.QA',sector:'Oil & Gas',country:'QA',mcap:28,rev:52,emp:12000 },
  { name:'Fortescue Metals',ticker:'FMG.AX',sector:'Mining & Metals',country:'AU',mcap:52,rev:18,emp:16300 },
  { name:'Woodside Energy',ticker:'WDS.AX',sector:'Oil & Gas',country:'AU',mcap:35,rev:14,emp:4700 },
  { name:'Commonwealth Bank',ticker:'CBA.AX',sector:'Banks',country:'AU',mcap:155,rev:22,emp:53000 },
  { name:'CSL Limited',ticker:'CSL.AX',sector:'Pharmaceuticals',country:'AU',mcap:105,rev:14,emp:32000 },
  { name:'Wesfarmers',ticker:'WES.AX',sector:'Consumer Discretionary',country:'AU',mcap:52,rev:36,emp:107000 },
  { name:'Naspers',ticker:'NPN.JO',sector:'Technology',country:'ZA',mcap:32,rev:8,emp:28000 },
  { name:'Sasol',ticker:'SOL.JO',sector:'Chemicals',country:'ZA',mcap:8,rev:16,emp:28000 },
  { name:'Standard Bank',ticker:'SBK.JO',sector:'Banks',country:'ZA',mcap:22,rev:14,emp:49000 },
  { name:'MTN Group',ticker:'MTN.JO',sector:'Telecom',country:'ZA',mcap:12,rev:12,emp:17000 },
  { name:'SK Hynix',ticker:'000660.KS',sector:'Semiconductors',country:'KR',mcap:82,rev:35,emp:36000 },
  { name:'Hyundai Motor',ticker:'005380.KS',sector:'Automobiles',country:'KR',mcap:38,rev:128,emp:75000 },
  { name:'POSCO Holdings',ticker:'005490.KS',sector:'Steel & Cement',country:'KR',mcap:22,rev:65,emp:26000 },
  { name:'KB Financial Group',ticker:'105560.KS',sector:'Banks',country:'KR',mcap:22,rev:18,emp:27000 },
  { name:'Cemex',ticker:'CX',sector:'Steel & Cement',country:'MX',mcap:10,rev:16,emp:43000 },
  { name:'Grupo Bimbo',ticker:'BIMBOA.MX',sector:'Consumer Staples',country:'MX',mcap:15,rev:20,emp:136000 },
  { name:'America Movil',ticker:'AMXB.MX',sector:'Telecom',country:'MX',mcap:48,rev:52,emp:185000 },
  { name:'Neste',ticker:'NESTE.HE',sector:'Oil & Gas',country:'FI',mcap:18,rev:22,emp:6400 },
  { name:'Orsted',ticker:'ORSTED.CO',sector:'Electric Utilities',country:'DK',mcap:25,rev:17,emp:8100 },
  { name:'Vestas Wind Systems',ticker:'VWS.CO',sector:'Industrials',country:'DK',mcap:18,rev:16,emp:28700 },
  { name:'Siemens Gamesa',ticker:'SGRE.MC',sector:'Industrials',country:'ES',mcap:12,rev:10,emp:27000 },
  { name:'Engie',ticker:'ENGI.PA',sector:'Electric Utilities',country:'FR',mcap:38,rev:82,emp:96400 },
  { name:'National Grid',ticker:'NG.L',sector:'Electric Utilities',country:'GB',mcap:42,rev:22,emp:29000 },
  { name:'SSE',ticker:'SSE.L',sector:'Electric Utilities',country:'GB',mcap:22,rev:12,emp:13000 },
  // ── Additional to reach 300 (271-300)
  { name:'ArcelorMittal',ticker:'MT.AS',sector:'Steel & Cement',country:'LU',mcap:22,rev:68,emp:129000 },
  { name:'ThyssenKrupp',ticker:'TKA.DE',sector:'Steel & Cement',country:'DE',mcap:4,rev:38,emp:100000 },
  { name:'Nippon Steel',ticker:'5401.T',sector:'Steel & Cement',country:'JP',mcap:22,rev:55,emp:106000 },
  { name:'Suzuki Motor',ticker:'7269.T',sector:'Automobiles',country:'JP',mcap:22,rev:38,emp:70000 },
  { name:'Panasonic Holdings',ticker:'6752.T',sector:'Technology',country:'JP',mcap:22,rev:62,emp:233391 },
  { name:'Sumitomo Mitsui Financial',ticker:'8316.T',sector:'Banks',country:'JP',mcap:68,rev:42,emp:115000 },
  { name:'Mizuho Financial',ticker:'8411.T',sector:'Banks',country:'JP',mcap:48,rev:35,emp:53000 },
  { name:'Nomura Holdings',ticker:'8604.T',sector:'Diversified Financials',country:'JP',mcap:18,rev:14,emp:26700 },
  { name:'AIA Group',ticker:'1299.HK',sector:'Insurance',country:'HK',mcap:82,rev:52,emp:24000 },
  { name:'Hong Kong Exchanges',ticker:'0388.HK',sector:'Diversified Financials',country:'HK',mcap:45,rev:5,emp:2700 },
  { name:'NetEase',ticker:'9999.HK',sector:'Technology',country:'CN',mcap:55,rev:14,emp:30000 },
  { name:'Xiaomi',ticker:'1810.HK',sector:'Technology',country:'CN',mcap:62,rev:42,emp:35000 },
  { name:'China Petroleum & Chemical',ticker:'0386.HK',sector:'Oil & Gas',country:'CN',mcap:62,rev:465,emp:379000 },
  { name:'PetroChina',ticker:'0857.HK',sector:'Oil & Gas',country:'CN',mcap:145,rev:415,emp:432000 },
  { name:'LONGi Green Energy',ticker:'601012.SS',sector:'Semiconductors',country:'CN',mcap:18,rev:14,emp:60000 },
  { name:'CATL',ticker:'300750.SZ',sector:'Technology',country:'CN',mcap:128,rev:48,emp:120000 },
  { name:'Adani Enterprises',ticker:'ADANIENT.NS',sector:'Mining & Metals',country:'IN',mcap:42,rev:28,emp:50000 },
  { name:'Wipro',ticker:'WIPRO.NS',sector:'Technology',country:'IN',mcap:32,rev:11,emp:240000 },
  { name:'Larsen & Toubro',ticker:'LT.NS',sector:'Industrials',country:'IN',mcap:55,rev:24,emp:407000 },
  { name:'Mahindra & Mahindra',ticker:'M&M.NS',sector:'Automobiles',country:'IN',mcap:32,rev:15,emp:260000 },
  { name:'Accenture',ticker:'ACN',sector:'Technology',country:'IE',mcap:210,rev:64,emp:733000 },
  { name:'Medtronic',ticker:'MDT.IE',sector:'Healthcare Equipment',country:'IE',mcap:108,rev:32,emp:95000 },
  { name:'CRH',ticker:'CRH',sector:'Steel & Cement',country:'IE',mcap:55,rev:35,emp:78500 },
  { name:'Canadian National Railway',ticker:'CNR.TO',sector:'Industrials',country:'CA',mcap:78,rev:16,emp:25100 },
  { name:'Enbridge',ticker:'ENB.TO',sector:'Oil & Gas',country:'CA',mcap:82,rev:46,emp:12900 },
  { name:'Shopify',ticker:'SHOP.TO',sector:'Technology',country:'CA',mcap:95,rev:7,emp:11600 },
  { name:'Toronto-Dominion Bank',ticker:'TD.TO',sector:'Banks',country:'CA',mcap:105,rev:48,emp:95000 },
  { name:'Royal Bank of Canada',ticker:'RY.TO',sector:'Banks',country:'CA',mcap:155,rev:52,emp:92000 },
  { name:'Brookfield Asset Mgmt',ticker:'BAM.TO',sector:'Diversified Financials',country:'CA',mcap:72,rev:22,emp:180000 },
  { name:'Nutrien',ticker:'NTR.TO',sector:'Chemicals',country:'CA',mcap:28,rev:28,emp:23500 },
  // ── Final 40 to reach 300 (261-300)
  { name:'Suncor Energy',ticker:'SU.TO',sector:'Oil & Gas',country:'CA',mcap:45,rev:42,emp:16600 },
  { name:'Barrick Gold',ticker:'ABX.TO',sector:'Mining & Metals',country:'CA',mcap:32,rev:11,emp:22000 },
  { name:'Manulife Financial',ticker:'MFC.TO',sector:'Insurance',country:'CA',mcap:42,rev:62,emp:38000 },
  { name:'Sun Life Financial',ticker:'SLF.TO',sector:'Insurance',country:'CA',mcap:32,rev:28,emp:25000 },
  { name:'Telus',ticker:'T.TO',sector:'Telecom',country:'CA',mcap:28,rev:19,emp:68000 },
  { name:'Woodside Energy',ticker:'WDS2.AX',sector:'Oil & Gas',country:'AU',mcap:28,rev:13,emp:4600 },
  { name:'Transurban Group',ticker:'TCL.AX',sector:'Industrials',country:'AU',mcap:32,rev:4,emp:1900 },
  { name:'ANZ Banking Group',ticker:'ANZ.AX',sector:'Banks',country:'AU',mcap:62,rev:18,emp:40000 },
  { name:'Westpac Banking',ticker:'WBC.AX',sector:'Banks',country:'AU',mcap:68,rev:18,emp:34000 },
  { name:'Macquarie Group',ticker:'MQG.AX',sector:'Diversified Financials',country:'AU',mcap:52,rev:14,emp:20000 },
  { name:'Singapore Telecom',ticker:'Z74.SI',sector:'Telecom',country:'US',mcap:32,rev:12,emp:23000 },
  { name:'DBS Group',ticker:'D05.SI',sector:'Banks',country:'US',mcap:72,rev:18,emp:35000 },
  { name:'Oversea-Chinese Banking',ticker:'O39.SI',sector:'Banks',country:'US',mcap:42,rev:12,emp:32000 },
  { name:'PTT',ticker:'PTT.BK',sector:'Oil & Gas',country:'US',mcap:28,rev:82,emp:25000 },
  { name:'Petronas Chemicals',ticker:'5183.KL',sector:'Chemicals',country:'US',mcap:12,rev:8,emp:4200 },
  { name:'Tenaga Nasional',ticker:'5347.KL',sector:'Electric Utilities',country:'US',mcap:18,rev:14,emp:35000 },
  { name:'Formosa Plastics',ticker:'1301.TW',sector:'Chemicals',country:'TW',mcap:15,rev:18,emp:10000 },
  { name:'Delta Electronics',ticker:'2308.TW',sector:'Technology',country:'TW',mcap:32,rev:12,emp:80000 },
  { name:'Hon Hai Precision',ticker:'2317.TW',sector:'Technology',country:'TW',mcap:42,rev:198,emp:800000 },
  { name:'MediaTek',ticker:'2454.TW',sector:'Semiconductors',country:'TW',mcap:52,rev:18,emp:19000 },
  { name:'Samsung SDI',ticker:'006400.KS',sector:'Technology',country:'KR',mcap:22,rev:16,emp:25000 },
  { name:'LG Energy Solution',ticker:'373220.KS',sector:'Technology',country:'KR',mcap:68,rev:28,emp:26000 },
  { name:'Samsung Biologics',ticker:'207940.KS',sector:'Pharmaceuticals',country:'KR',mcap:42,rev:3,emp:6000 },
  { name:'Naver',ticker:'035420.KS',sector:'Technology',country:'KR',mcap:28,rev:8,emp:6000 },
  { name:'Li Auto',ticker:'2015.HK',sector:'Automobiles',country:'CN',mcap:28,rev:18,emp:32000 },
  { name:'NIO',ticker:'9866.HK',sector:'Automobiles',country:'CN',mcap:12,rev:8,emp:26000 },
  { name:'Bank of China',ticker:'3988.HK',sector:'Banks',country:'CN',mcap:135,rev:85,emp:300000 },
  { name:'Agricultural Bank of China',ticker:'1288.HK',sector:'Banks',country:'CN',mcap:125,rev:98,emp:450000 },
  { name:'China Life Insurance',ticker:'2628.HK',sector:'Insurance',country:'CN',mcap:52,rev:95,emp:102000 },
  { name:'Country Garden',ticker:'2007.HK',sector:'Real Estate',country:'CN',mcap:5,rev:55,emp:300000 },
  { name:'Sun Pharma',ticker:'SUNPHARMA.NS',sector:'Pharmaceuticals',country:'IN',mcap:42,rev:6,emp:38000 },
  { name:'HCL Technologies',ticker:'HCLTECH.NS',sector:'Technology',country:'IN',mcap:42,rev:13,emp:225000 },
  { name:'Bajaj Finance',ticker:'BAJFINANCE.NS',sector:'Diversified Financials',country:'IN',mcap:48,rev:8,emp:55000 },
  { name:'State Bank of India',ticker:'SBIN.NS',sector:'Banks',country:'IN',mcap:62,rev:52,emp:250000 },
  { name:'Axis Bank',ticker:'AXISBANK.NS',sector:'Banks',country:'IN',mcap:35,rev:18,emp:92000 },
  { name:'Tata Steel',ticker:'TATASTEEL.NS',sector:'Steel & Cement',country:'IN',mcap:18,rev:28,emp:80000 },
  { name:'JSW Steel',ticker:'JSWSTEEL.NS',sector:'Steel & Cement',country:'IN',mcap:22,rev:18,emp:50000 },
  { name:'NTPC',ticker:'NTPC.NS',sector:'Electric Utilities',country:'IN',mcap:35,rev:18,emp:21000 },
  { name:'Power Grid Corp',ticker:'POWERGRID.NS',sector:'Electric Utilities',country:'IN',mcap:28,rev:5,emp:10000 },
  { name:'Indian Oil Corp',ticker:'IOC.NS',sector:'Oil & Gas',country:'IN',mcap:28,rev:98,emp:32000 },
];

/* ── ISIN/LEI generators (deterministic) ────────────────────────────── */
const COUNTRY_ISIN_PREFIX = { US:'US',CH:'CH',FR:'FR',GB:'GB',DE:'DE',NL:'NL',JP:'JP',CN:'CN',TW:'TW',KR:'KR',IN:'IN',BR:'BR',SA:'SA',QA:'QA',AU:'AU',ZA:'ZA',DK:'DK',IT:'IT',ES:'ES',LU:'LU',HK:'HK',FI:'FI',MX:'MX',IE:'IE',CA:'CA' };
const genISIN = (i, country) => {
  const prefix = COUNTRY_ISIN_PREFIX[country] || 'US';
  const num = String(1000000000 + i * 7919 + rangeInt(100,999,i*3)).slice(0,10);
  return `${prefix}${num.padStart(10,'0')}`;
};
const genLEI = (i) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let lei = '';
  for (let j = 0; j < 20; j++) lei += chars[Math.floor(sr(i * 20 + j) * chars.length)];
  return lei;
};

/* ── REGIONS with metadata ──────────────────────────────────────────── */
export const REGIONS = [
  { code:'US', name:'United States',       carbonPrice:0,   gridIntensity:380, ndcTarget:'-50% by 2030', regime:'SEC Climate Rule' },
  { code:'GB', name:'United Kingdom',      carbonPrice:48,  gridIntensity:220, ndcTarget:'-68% by 2030', regime:'UK SDR / TCFD' },
  { code:'DE', name:'Germany',             carbonPrice:55,  gridIntensity:340, ndcTarget:'-65% by 2030', regime:'EU CSRD' },
  { code:'FR', name:'France',              carbonPrice:55,  gridIntensity:60,  ndcTarget:'-40% by 2030', regime:'EU CSRD / Art 29' },
  { code:'CH', name:'Switzerland',         carbonPrice:125, gridIntensity:30,  ndcTarget:'-50% by 2030', regime:'Swiss TCFD' },
  { code:'NL', name:'Netherlands',         carbonPrice:55,  gridIntensity:310, ndcTarget:'-49% by 2030', regime:'EU CSRD' },
  { code:'IT', name:'Italy',               carbonPrice:55,  gridIntensity:260, ndcTarget:'-43% by 2030', regime:'EU CSRD' },
  { code:'ES', name:'Spain',               carbonPrice:55,  gridIntensity:170, ndcTarget:'-23% by 2030', regime:'EU CSRD' },
  { code:'DK', name:'Denmark',             carbonPrice:55,  gridIntensity:120, ndcTarget:'-70% by 2030', regime:'EU CSRD' },
  { code:'FI', name:'Finland',             carbonPrice:55,  gridIntensity:70,  ndcTarget:'-60% by 2030', regime:'EU CSRD' },
  { code:'LU', name:'Luxembourg',          carbonPrice:55,  gridIntensity:90,  ndcTarget:'-55% by 2030', regime:'EU CSRD / SFDR' },
  { code:'IE', name:'Ireland',             carbonPrice:55,  gridIntensity:290, ndcTarget:'-51% by 2030', regime:'EU CSRD' },
  { code:'JP', name:'Japan',               carbonPrice:3,   gridIntensity:450, ndcTarget:'-46% by 2030', regime:'TCFD / ISSB-aligned' },
  { code:'CN', name:'China',               carbonPrice:9,   gridIntensity:540, ndcTarget:'Peak by 2030', regime:'CN ESG Disclosure' },
  { code:'HK', name:'Hong Kong',           carbonPrice:0,   gridIntensity:500, ndcTarget:'Aligned w/ CN', regime:'HKEX ESG Guide' },
  { code:'TW', name:'Taiwan',              carbonPrice:10,  gridIntensity:490, ndcTarget:'-24% by 2030', regime:'TW Climate Act' },
  { code:'KR', name:'South Korea',         carbonPrice:18,  gridIntensity:410, ndcTarget:'-40% by 2030', regime:'K-Taxonomy / TCFD' },
  { code:'IN', name:'India',               carbonPrice:0,   gridIntensity:680, ndcTarget:'-45% intensity', regime:'BRSR / SEBI ESG' },
  { code:'AU', name:'Australia',           carbonPrice:0,   gridIntensity:510, ndcTarget:'-43% by 2030', regime:'ASRS / ISSB-aligned' },
  { code:'BR', name:'Brazil',              carbonPrice:0,   gridIntensity:75,  ndcTarget:'-50% by 2030', regime:'CVM ESG Rule' },
  { code:'SA', name:'Saudi Arabia',        carbonPrice:0,   gridIntensity:520, ndcTarget:'60 MtCO2 cut',  regime:'Saudi Green Initiative' },
  { code:'QA', name:'Qatar',               carbonPrice:0,   gridIntensity:490, ndcTarget:'-25% by 2030', regime:'QSE ESG Guide' },
  { code:'ZA', name:'South Africa',        carbonPrice:9,   gridIntensity:900, ndcTarget:'350-420 Mt',    regime:'JSE Sustainability' },
  { code:'MX', name:'Mexico',              carbonPrice:3,   gridIntensity:400, ndcTarget:'-22% by 2030', regime:'MX Climate Law' },
  { code:'CA', name:'Canada',              carbonPrice:65,  gridIntensity:120, ndcTarget:'-40% by 2030', regime:'CSA / ISSB-aligned' },
];
const regionMap = Object.fromEntries(REGIONS.map(r => [r.code, r]));

/* ── SECTORS export ─────────────────────────────────────────────────── */
export const SECTORS = Object.entries(SECTOR_PROFILES).map(([name, p]) => ({
  name,
  avgIntensity: p.avgIntensity,
  weightInIndex: p.weight,
  transitionRiskLevel: p.trisk,
}));

/* ── Build 300-company universe ─────────────────────────────────────── */
const buildCompany = (raw, i) => {
  const sp = SECTOR_PROFILES[raw.sector] || SECTOR_PROFILES['Industrials'];
  const seed = i * 137;
  const reg = regionMap[raw.country] || regionMap['US'];

  // Emissions scaled by revenue and sector profile
  const revScale = raw.rev || 10;
  const scope1 = Math.round(revScale * sp.s1Mult * (0.7 + sr(seed) * 0.6) * 1000);
  const scope2 = Math.round(revScale * sp.s2Mult * (0.6 + sr(seed + 1) * 0.8) * 1000);
  const scope3 = Math.round(revScale * sp.s3Mult * (0.5 + sr(seed + 2) * 1.0) * 1000);
  const totalEmissions = scope1 + scope2 + scope3;
  const emissionsIntensity = +(totalEmissions / (revScale * 1e6) * 1e6).toFixed(1);

  // ESG scores — correlated with sector bias + noise
  const esgBase = 50 + sp.esgBias;
  const spGlobalScore = Math.min(100, Math.max(0, Math.round(esgBase + range(-8, 8, seed + 10))));
  const bloombergScore = Math.min(100, Math.max(0, Math.round(esgBase + range(-12, 12, seed + 11))));
  const sustainalyticsRisk = Math.min(100, Math.max(0, Math.round(100 - esgBase + range(-10, 10, seed + 12))));
  const issScore = +Math.min(10, Math.max(1, (esgBase / 10 + range(-1, 1, seed + 13)))).toFixed(1);
  const msciIdx = Math.min(6, Math.max(0, Math.round((esgBase - 20) / 12 + sr(seed + 14) * 1.5)));
  const msciRating = MSCI_SCALE[msciIdx];
  const cdpIdx = Math.min(7, Math.max(0, Math.round((esgBase - 15) / 11 + sr(seed + 15) * 1.2)));
  const cdpScore = CDP_SCALE[cdpIdx];

  // Climate alignment
  const sbtiStatus = pick(SBTI_OPTS, seed + 20);
  const sbtiTarget = sbtiStatus !== 'none' ? `${rangeInt(30, 55, seed + 21)}% by 2030` : null;
  const netZeroYear = sbtiStatus !== 'none' ? rangeInt(2035, 2060, seed + 22) : (sr(seed + 23) > 0.5 ? rangeInt(2040, 2070, seed + 24) : null);
  const greenRevenuePct = raw.sector === 'Electric Utilities' ? range(15, 65, seed + 25) : (sp.esgBias > 5 ? range(5, 35, seed + 25) : range(0, 12, seed + 25));
  const brownRevenuePct = ['Oil & Gas','Integrated Oil'].includes(raw.sector) ? range(60, 95, seed + 26) : (['Mining & Metals','Steel & Cement'].includes(raw.sector) ? range(25, 60, seed + 26) : range(0, 8, seed + 26));
  const capexGreenPct = range(5, 45, seed + 27);
  const temperatureScore = ['Oil & Gas','Integrated Oil'].includes(raw.sector) ? range(2.5, 4.5, seed + 28) : (sp.esgBias > 5 ? range(1.5, 2.5, seed + 28) : range(1.8, 3.5, seed + 28));
  const pcafAssetClass = pick(PCAF_CLASSES, seed + 29);

  // Governance
  const boardIndependencePct = range(55, 95, seed + 30);
  const femaleBoardPct = range(15, 50, seed + 31);
  const ceoPayRatio = rangeInt(50, 450, seed + 32);

  // Controversy
  const controversyCount = rangeInt(0, 12, seed + 33);
  const controversySeverity = +(range(0, 5, seed + 34)).toFixed(1);

  // Classification
  const euTaxonomyAlignedPct = raw.country === 'US' ? 0 : range(0, 40, seed + 35);
  const transitionPlanStatus = pick(TRANS_PLAN, seed + 36);
  const actGrade = pick(ACT_SCALE, seed + 37);
  const nzCommitment = pick(NZ_OPTS, seed + 38);

  // Risk scores
  const physicalRiskScore = range(5, 85, seed + 39);
  const transitionRiskScore = sp.trisk === 'very-high' ? range(65, 95, seed + 40) : (sp.trisk === 'high' ? range(45, 75, seed + 40) : (sp.trisk === 'medium' ? range(25, 55, seed + 40) : range(5, 35, seed + 40)));

  // Avoided emissions (renewables/tech companies might have positive)
  const avoidedEmissions = ['Electric Utilities','Technology','Semiconductors'].includes(raw.sector) ? Math.round(range(10000, 500000, seed + 41)) : 0;
  const avoidedToEmittedRatio = avoidedEmissions > 0 ? +(avoidedEmissions / totalEmissions).toFixed(3) : 0;

  // Transport fields (for airlines, shipping, autos)
  const fleetType = ['Airlines & Shipping','Automobiles'].includes(raw.sector) ? pick(['Mixed Fleet','Modern Fleet','Legacy Fleet','Transitioning'], seed + 42) : null;
  const ciiRating = raw.sector === 'Airlines & Shipping' ? pick(['A','B','C','D','E'], seed + 43) : null;
  const corsiaPhase = raw.sector === 'Airlines & Shipping' ? pick(['Pilot Phase','Phase 1','Phase 2','Exempt'], seed + 44) : null;

  // 12 quarters of historical data (Q1-2022 to Q4-2024)
  const quarters = ['Q1-22','Q2-22','Q3-22','Q4-22','Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24'];
  const quarterlyEmissions = quarters.map((q, qi) => {
    const trend = 1 - qi * 0.008; // slight downward trend
    const seasonal = 1 + 0.05 * Math.sin(qi * 1.57);
    const noise = 0.9 + sr(seed + 100 + qi) * 0.2;
    const qScope1 = Math.round(scope1 / 4 * trend * seasonal * noise);
    const qScope2 = Math.round(scope2 / 4 * trend * seasonal * noise);
    const qScope3 = Math.round(scope3 / 4 * trend * seasonal * noise);
    const qTotal = qScope1 + qScope2 + qScope3;
    const qIntensity = +((qTotal) / (revScale * 250000) * 1e6).toFixed(1);
    const qEsgScore = Math.round(spGlobalScore + qi * 0.3 + (sr(seed + 200 + qi) - 0.5) * 4);
    return { q, scope1: qScope1, scope2: qScope2, scope3: qScope3, intensity: qIntensity, esgScore: Math.min(100, Math.max(0, qEsgScore)) };
  });

  const region = ['US','CA'].includes(raw.country) ? 'North America' :
    ['GB','DE','FR','CH','NL','IT','ES','DK','FI','LU','IE'].includes(raw.country) ? 'Europe' :
    ['JP','CN','HK','TW','KR','IN'].includes(raw.country) ? 'Asia-Pacific' :
    ['BR','MX'].includes(raw.country) ? 'Latin America' :
    ['SA','QA'].includes(raw.country) ? 'Middle East' :
    ['AU'].includes(raw.country) ? 'Asia-Pacific' :
    ['ZA'].includes(raw.country) ? 'Africa' : 'Other';

  return {
    id: `CO-${String(i + 1).padStart(4, '0')}`,
    name: raw.name,
    ticker: raw.ticker,
    isin: genISIN(i, raw.country),
    lei: genLEI(i),
    sector: raw.sector,
    subIndustry: raw.sector,
    country: raw.country,
    region,
    marketCap: raw.mcap,
    revenue: raw.rev,
    employees: raw.emp,
    scope1, scope2, scope3, totalEmissions,
    emissionsIntensity,
    msciRating, sustainalyticsRisk, issScore,
    cdpScore, spGlobalScore, bloombergScore,
    sbtiStatus, sbtiTarget, netZeroYear,
    greenRevenuePct, brownRevenuePct, capexGreenPct,
    temperatureScore: +temperatureScore.toFixed(2),
    pcafAssetClass,
    boardIndependencePct, femaleBoardPct, ceoPayRatio,
    controversyCount, controversySeverity,
    euTaxonomyAlignedPct, transitionPlanStatus,
    actGrade, nzCommitment,
    physicalRiskScore, transitionRiskScore,
    avoidedEmissions, avoidedToEmittedRatio,
    fleetType, ciiRating, corsiaPhase,
    quarterlyEmissions,
  };
};

export const COMPANY_UNIVERSE = RAW_COMPANIES.map((raw, i) => buildCompany(raw, i));

/* ── Benchmark Indices ──────────────────────────────────────────────── */
const buildIndex = (label, criteria, seed0) => {
  // Sort universe by criteria, pick top 50
  const scored = COMPANY_UNIVERSE.map((c, i) => ({ c, score: criteria(c) + sr(seed0 + i) * 5 }));
  scored.sort((a, b) => b.score - a.score);
  const constituents = scored.slice(0, 50).map(s => ({
    id: s.c.id,
    name: s.c.name,
    ticker: s.c.ticker,
    weight: +(s.c.marketCap / scored.slice(0, 50).reduce((a, x) => a + x.c.marketCap, 0) * 100).toFixed(2),
  }));
  return { label, constituents };
};

export const INDICES = [
  buildIndex('Global ESG Leaders', c => c.spGlobalScore + c.bloombergScore - c.sustainalyticsRisk, 5000),
  buildIndex('Climate Transition Index', c => -c.temperatureScore * 20 + c.greenRevenuePct - c.brownRevenuePct + (c.sbtiStatus === 'validated' ? 30 : 0), 6000),
  buildIndex('Paris-Aligned Benchmark', c => (c.temperatureScore < 2.0 ? 50 : 0) + c.capexGreenPct - c.transitionRiskScore * 0.5 + (c.netZeroYear && c.netZeroYear <= 2050 ? 20 : 0), 7000),
];

/* ── Helper lookups ─────────────────────────────────────────────────── */
export const getCompanyById = (id) => COMPANY_UNIVERSE.find(c => c.id === id);
export const getCompanyByTicker = (ticker) => COMPANY_UNIVERSE.find(c => c.ticker === ticker);
export const getCompaniesBySector = (sector) => COMPANY_UNIVERSE.filter(c => c.sector === sector);
export const getCompaniesByCountry = (country) => COMPANY_UNIVERSE.filter(c => c.country === country);
export const getCompaniesByRegion = (region) => COMPANY_UNIVERSE.filter(c => c.region === region);
export const getTopEmitters = (n = 20) => [...COMPANY_UNIVERSE].sort((a, b) => b.totalEmissions - a.totalEmissions).slice(0, n);
export const getTopESG = (n = 20) => [...COMPANY_UNIVERSE].sort((a, b) => b.spGlobalScore - a.spGlobalScore).slice(0, n);
export const getHighTransitionRisk = (threshold = 60) => COMPANY_UNIVERSE.filter(c => c.transitionRiskScore >= threshold);
export const getSBTiValidated = () => COMPANY_UNIVERSE.filter(c => c.sbtiStatus === 'validated');
export const getNetZeroCommitted = () => COMPANY_UNIVERSE.filter(c => c.nzCommitment !== 'none');
export const getHighPhysicalRisk = (threshold = 60) => COMPANY_UNIVERSE.filter(c => c.physicalRiskScore >= threshold);
export const getByMsciRating = (rating) => COMPANY_UNIVERSE.filter(c => c.msciRating === rating);
export const getByTransitionPlan = (status) => COMPANY_UNIVERSE.filter(c => c.transitionPlanStatus === status);
export const getControversial = (minSeverity = 3) => COMPANY_UNIVERSE.filter(c => c.controversySeverity >= minSeverity);

/* ── Search utility ─────────────────────────────────────────────────── */
export const searchCompanies = (query) => {
  const q = query.toLowerCase();
  return COMPANY_UNIVERSE.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.ticker.toLowerCase().includes(q) ||
    c.sector.toLowerCase().includes(q) ||
    c.country.toLowerCase().includes(q)
  );
};

/* ── Sector aggregation ─────────────────────────────────────────────── */
export const getSectorAggregates = () => {
  const sectorMap = {};
  COMPANY_UNIVERSE.forEach(c => {
    if (!sectorMap[c.sector]) {
      sectorMap[c.sector] = {
        sector: c.sector,
        count: 0,
        totalEmissions: 0,
        totalMarketCap: 0,
        totalRevenue: 0,
        avgSpScore: 0,
        avgTempScore: 0,
        avgTransitionRisk: 0,
        sbtiValidated: 0,
        companies: [],
      };
    }
    const s = sectorMap[c.sector];
    s.count++;
    s.totalEmissions += c.totalEmissions;
    s.totalMarketCap += c.marketCap;
    s.totalRevenue += c.revenue;
    s.avgSpScore += c.spGlobalScore;
    s.avgTempScore += c.temperatureScore;
    s.avgTransitionRisk += c.transitionRiskScore;
    if (c.sbtiStatus === 'validated') s.sbtiValidated++;
    s.companies.push(c.id);
  });
  return Object.values(sectorMap).map(s => ({
    ...s,
    avgSpScore: +(s.avgSpScore / s.count).toFixed(1),
    avgTempScore: +(s.avgTempScore / s.count).toFixed(2),
    avgTransitionRisk: +(s.avgTransitionRisk / s.count).toFixed(1),
    weightedAvgIntensity: +(s.totalEmissions / (s.totalRevenue * 1e6) * 1e6).toFixed(1),
  }));
};

/* ── Region aggregation ─────────────────────────────────────────────── */
export const getRegionAggregates = () => {
  const regionMap = {};
  COMPANY_UNIVERSE.forEach(c => {
    if (!regionMap[c.region]) {
      regionMap[c.region] = {
        region: c.region,
        count: 0,
        totalEmissions: 0,
        totalMarketCap: 0,
        avgSpScore: 0,
        avgTempScore: 0,
        countries: new Set(),
      };
    }
    const r = regionMap[c.region];
    r.count++;
    r.totalEmissions += c.totalEmissions;
    r.totalMarketCap += c.marketCap;
    r.avgSpScore += c.spGlobalScore;
    r.avgTempScore += c.temperatureScore;
    r.countries.add(c.country);
  });
  return Object.values(regionMap).map(r => ({
    ...r,
    avgSpScore: +(r.avgSpScore / r.count).toFixed(1),
    avgTempScore: +(r.avgTempScore / r.count).toFixed(2),
    countries: [...r.countries],
  }));
};

/* ── Portfolio construction helpers ─────────────────────────────────── */
export const buildPortfolio = (companyIds, weights = null) => {
  const companies = companyIds.map(id => getCompanyById(id)).filter(Boolean);
  if (!companies.length) return null;
  const equalWeight = 100 / companies.length;
  const w = weights || companies.map(() => equalWeight);
  const totalWeight = w.reduce((a, v) => a + v, 0);
  const normalized = w.map(v => v / totalWeight * 100);

  return {
    holdings: companies.map((c, i) => ({ ...c, weight: +normalized[i].toFixed(2) })),
    metrics: {
      waciScope12: +companies.reduce((a, c, i) => a + (c.scope1 + c.scope2) / (c.revenue * 1e6) * 1e6 * normalized[i] / 100, 0).toFixed(1),
      waciTotal: +companies.reduce((a, c, i) => a + c.totalEmissions / (c.revenue * 1e6) * 1e6 * normalized[i] / 100, 0).toFixed(1),
      weightedTempScore: +companies.reduce((a, c, i) => a + c.temperatureScore * normalized[i] / 100, 0).toFixed(2),
      weightedEsgScore: +companies.reduce((a, c, i) => a + c.spGlobalScore * normalized[i] / 100, 0).toFixed(1),
      greenRevenueExposure: +companies.reduce((a, c, i) => a + c.greenRevenuePct * normalized[i] / 100, 0).toFixed(1),
      brownRevenueExposure: +companies.reduce((a, c, i) => a + c.brownRevenuePct * normalized[i] / 100, 0).toFixed(1),
      sbtiCoverage: +(companies.filter(c => c.sbtiStatus !== 'none').length / companies.length * 100).toFixed(1),
      avgPhysicalRisk: +companies.reduce((a, c, i) => a + c.physicalRiskScore * normalized[i] / 100, 0).toFixed(1),
      avgTransitionRisk: +companies.reduce((a, c, i) => a + c.transitionRiskScore * normalized[i] / 100, 0).toFixed(1),
    },
  };
};

/* ── Rating distribution helper ─────────────────────────────────────── */
export const getMsciDistribution = () => {
  const dist = {};
  MSCI_SCALE.forEach(r => { dist[r] = 0; });
  COMPANY_UNIVERSE.forEach(c => { if (dist[c.msciRating] !== undefined) dist[c.msciRating]++; });
  return dist;
};

export const getCdpDistribution = () => {
  const dist = {};
  CDP_SCALE.forEach(r => { dist[r] = 0; });
  COMPANY_UNIVERSE.forEach(c => { if (dist[c.cdpScore] !== undefined) dist[c.cdpScore]++; });
  return dist;
};

/* ── Temperature alignment buckets ──────────────────────────────────── */
export const getTemperatureAlignmentBuckets = () => ({
  below15: COMPANY_UNIVERSE.filter(c => c.temperatureScore < 1.5).length,
  below20: COMPANY_UNIVERSE.filter(c => c.temperatureScore >= 1.5 && c.temperatureScore < 2.0).length,
  below25: COMPANY_UNIVERSE.filter(c => c.temperatureScore >= 2.0 && c.temperatureScore < 2.5).length,
  below30: COMPANY_UNIVERSE.filter(c => c.temperatureScore >= 2.5 && c.temperatureScore < 3.0).length,
  above30: COMPANY_UNIVERSE.filter(c => c.temperatureScore >= 3.0).length,
});

/* ── Emissions quartile classification ──────────────────────────────── */
export const getEmissionsQuartiles = () => {
  const sorted = [...COMPANY_UNIVERSE].sort((a, b) => a.totalEmissions - b.totalEmissions);
  const q1 = sorted[Math.floor(sorted.length * 0.25)].totalEmissions;
  const q2 = sorted[Math.floor(sorted.length * 0.50)].totalEmissions;
  const q3 = sorted[Math.floor(sorted.length * 0.75)].totalEmissions;
  return {
    q1Threshold: q1,
    q2Threshold: q2,
    q3Threshold: q3,
    lowEmitters: sorted.filter(c => c.totalEmissions <= q1).map(c => c.id),
    mediumEmitters: sorted.filter(c => c.totalEmissions > q1 && c.totalEmissions <= q2).map(c => c.id),
    highEmitters: sorted.filter(c => c.totalEmissions > q2 && c.totalEmissions <= q3).map(c => c.id),
    veryHighEmitters: sorted.filter(c => c.totalEmissions > q3).map(c => c.id),
  };
};

/* ── Quarterly trend calculator ─────────────────────────────────────── */
export const getQuarterlyTrend = (companyId) => {
  const c = getCompanyById(companyId);
  if (!c || !c.quarterlyEmissions || c.quarterlyEmissions.length < 2) return null;
  const first = c.quarterlyEmissions[0];
  const last = c.quarterlyEmissions[c.quarterlyEmissions.length - 1];
  const firstTotal = first.scope1 + first.scope2 + first.scope3;
  const lastTotal = last.scope1 + last.scope2 + last.scope3;
  const changePct = +((lastTotal - firstTotal) / firstTotal * 100).toFixed(1);
  const intensityChange = +(last.intensity - first.intensity).toFixed(1);
  const esgChange = last.esgScore - first.esgScore;
  return { changePct, intensityChange, esgChange, quarters: c.quarterlyEmissions.length };
};

/* ── ESG rating divergence detector ─────────────────────────────────── */
export const getRatingDivergence = () => {
  return COMPANY_UNIVERSE.map(c => {
    const normalizedMsci = MSCI_SCALE.indexOf(c.msciRating) / 6 * 100;
    const normalizedSust = 100 - c.sustainalyticsRisk;
    const normalizedIss = c.issScore * 10;
    const scores = [normalizedMsci, normalizedSust, normalizedIss, c.spGlobalScore, c.bloombergScore];
    const avg = scores.reduce((a, v) => a + v, 0) / scores.length;
    const variance = scores.reduce((a, v) => a + Math.pow(v - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    return { id: c.id, name: c.name, divergenceScore: +stdDev.toFixed(1), scores: { msci: normalizedMsci, sustainalytics: normalizedSust, iss: normalizedIss, spGlobal: c.spGlobalScore, bloomberg: c.bloombergScore } };
  }).sort((a, b) => b.divergenceScore - a.divergenceScore);
};

/* ── Financed emissions calculator (for banks) ──────────────────────── */
export const getFinancedEmissionsLeaderboard = () => {
  return COMPANY_UNIVERSE
    .filter(c => ['Banks','Diversified Financials','Insurance'].includes(c.sector))
    .map(c => ({
      id: c.id,
      name: c.name,
      sector: c.sector,
      scope3FinancedEmissions: c.scope3,
      financedIntensity: +(c.scope3 / (c.revenue * 1e6) * 1e6).toFixed(1),
      sbtiStatus: c.sbtiStatus,
      nzCommitment: c.nzCommitment,
    }))
    .sort((a, b) => b.scope3FinancedEmissions - a.scope3FinancedEmissions);
};

/* ── Taxonomy alignment summary ─────────────────────────────────────── */
export const getTaxonomyAlignmentSummary = () => {
  const eu = COMPANY_UNIVERSE.filter(c =>
    ['GB','DE','FR','CH','NL','IT','ES','DK','FI','LU','IE'].includes(c.country)
  );
  return {
    totalEuropeanCompanies: eu.length,
    avgAlignmentPct: +(eu.reduce((a, c) => a + c.euTaxonomyAlignedPct, 0) / eu.length).toFixed(1),
    highAlignment: eu.filter(c => c.euTaxonomyAlignedPct > 30).length,
    mediumAlignment: eu.filter(c => c.euTaxonomyAlignedPct > 10 && c.euTaxonomyAlignedPct <= 30).length,
    lowAlignment: eu.filter(c => c.euTaxonomyAlignedPct <= 10).length,
    bySector: [...new Set(eu.map(c => c.sector))].map(s => {
      const sc = eu.filter(c => c.sector === s);
      return { sector: s, count: sc.length, avgAlignment: +(sc.reduce((a, c) => a + c.euTaxonomyAlignedPct, 0) / sc.length).toFixed(1) };
    }).sort((a, b) => b.avgAlignment - a.avgAlignment),
  };
};

/* ── Carbon price exposure calculator ───────────────────────────────── */
export const getCarbonPriceExposure = () => {
  return COMPANY_UNIVERSE.map(c => {
    const reg = regionMap[c.country];
    const carbonPrice = reg ? reg.carbonPrice : 0;
    const scope12 = c.scope1 + c.scope2;
    const annualCarbonCost = Math.round(scope12 * carbonPrice);
    const costAsRevenuePct = +(annualCarbonCost / (c.revenue * 1e9) * 100).toFixed(3);
    return {
      id: c.id,
      name: c.name,
      country: c.country,
      carbonPrice,
      scope12,
      annualCarbonCost,
      costAsRevenuePct,
    };
  }).sort((a, b) => b.annualCarbonCost - a.annualCarbonCost);
};

/* ── Net-zero readiness score ───────────────────────────────────────── */
export const getNetZeroReadiness = () => {
  return COMPANY_UNIVERSE.map(c => {
    let score = 0;
    if (c.sbtiStatus === 'validated') score += 25;
    else if (c.sbtiStatus === 'committed') score += 15;
    if (c.nzCommitment !== 'none') score += 15;
    if (c.transitionPlanStatus === 'published') score += 20;
    else if (c.transitionPlanStatus === 'draft') score += 10;
    if (c.netZeroYear && c.netZeroYear <= 2050) score += 15;
    if (c.temperatureScore < 2.0) score += 15;
    else if (c.temperatureScore < 2.5) score += 8;
    if (c.greenRevenuePct > 20) score += 10;
    return { id: c.id, name: c.name, sector: c.sector, readinessScore: Math.min(100, score), components: { sbti: c.sbtiStatus, nzCommitment: c.nzCommitment, transitionPlan: c.transitionPlanStatus, netZeroYear: c.netZeroYear, tempScore: c.temperatureScore } };
  }).sort((a, b) => b.readinessScore - a.readinessScore);
};

/* ── Board diversity analysis ───────────────────────────────────────── */
export const getBoardDiversityAnalysis = () => {
  const byRegion = {};
  COMPANY_UNIVERSE.forEach(c => {
    if (!byRegion[c.region]) byRegion[c.region] = { count: 0, totalFemale: 0, totalIndep: 0 };
    byRegion[c.region].count++;
    byRegion[c.region].totalFemale += c.femaleBoardPct;
    byRegion[c.region].totalIndep += c.boardIndependencePct;
  });
  return Object.entries(byRegion).map(([region, d]) => ({
    region,
    companies: d.count,
    avgFemaleBoardPct: +(d.totalFemale / d.count).toFixed(1),
    avgIndependencePct: +(d.totalIndep / d.count).toFixed(1),
  }));
};

/* ── Aggregate stats ────────────────────────────────────────────────── */
export const UNIVERSE_STATS = {
  totalCompanies: COMPANY_UNIVERSE.length,
  totalMarketCap: +COMPANY_UNIVERSE.reduce((a, c) => a + c.marketCap, 0).toFixed(0),
  totalEmissions: COMPANY_UNIVERSE.reduce((a, c) => a + c.totalEmissions, 0),
  avgTemperatureScore: +(COMPANY_UNIVERSE.reduce((a, c) => a + c.temperatureScore, 0) / COMPANY_UNIVERSE.length).toFixed(2),
  avgSpGlobalScore: +(COMPANY_UNIVERSE.reduce((a, c) => a + c.spGlobalScore, 0) / COMPANY_UNIVERSE.length).toFixed(1),
  sbtiBreakdown: {
    validated: COMPANY_UNIVERSE.filter(c => c.sbtiStatus === 'validated').length,
    committed: COMPANY_UNIVERSE.filter(c => c.sbtiStatus === 'committed').length,
    none: COMPANY_UNIVERSE.filter(c => c.sbtiStatus === 'none').length,
  },
  nzCommitmentBreakdown: {
    NZAM: COMPANY_UNIVERSE.filter(c => c.nzCommitment === 'NZAM').length,
    NZAOA: COMPANY_UNIVERSE.filter(c => c.nzCommitment === 'NZAOA').length,
    NZBA: COMPANY_UNIVERSE.filter(c => c.nzCommitment === 'NZBA').length,
    none: COMPANY_UNIVERSE.filter(c => c.nzCommitment === 'none').length,
  },
  transitionPlanBreakdown: {
    published: COMPANY_UNIVERSE.filter(c => c.transitionPlanStatus === 'published').length,
    draft: COMPANY_UNIVERSE.filter(c => c.transitionPlanStatus === 'draft').length,
    none: COMPANY_UNIVERSE.filter(c => c.transitionPlanStatus === 'none').length,
  },
  sectorCount: new Set(COMPANY_UNIVERSE.map(c => c.sector)).size,
  countryCount: new Set(COMPANY_UNIVERSE.map(c => c.country)).size,
  regionCount: new Set(COMPANY_UNIVERSE.map(c => c.region)).size,
};

export default COMPANY_UNIVERSE;
