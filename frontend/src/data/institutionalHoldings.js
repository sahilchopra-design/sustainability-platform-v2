/**
 * INSTITUTIONAL HOLDINGS — AA Impact Global Multi-Asset Fund
 * Comprehensive $50Bn multi-asset institutional portfolio with 2000+ holdings.
 * Covers every PCAF asset class, every platform module, every geography.
 *
 * PRNG: deterministic seeded random — NO Math.random().
 * const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
 */

// ── Deterministic seeded random ──────────────────────────────────────────────
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const pick = (arr, seed) => arr[Math.floor(sr(seed) * arr.length)];
const rng = (min, max, seed) => min + sr(seed) * (max - min);
const rngInt = (min, max, seed) => Math.floor(rng(min, max, seed));
const round2 = (v) => Math.round(v * 100) / 100;
const round4 = (v) => Math.round(v * 10000) / 10000;

// ── Fund Meta ────────────────────────────────────────────────────────────────
export const INSTITUTIONAL_META = {
  name: 'AA Impact Global Multi-Asset Fund',
  totalAum: 50_000_000_000,
  currency: 'USD',
  manager: 'AA Impact Inc.',
  sfdrClass: 'Article 8+',
  nzamSignatory: true,
  benchmark: 'Custom Blended (60/25/10/5)',
  domicile: 'Luxembourg',
  inceptionDate: '2018-03-15',
  navDate: '2026-03-28',
  shareClasses: ['Institutional USD', 'Institutional EUR-H', 'Retail USD'],
  totalHoldingsTarget: 2000,
};

const AUM = 50_000_000_000;

// ══════════════════════════════════════════════════════════════════════════════
// MASTER UNIVERSE — 300 real global companies
// ══════════════════════════════════════════════════════════════════════════════
const MASTER_COMPANIES = [
  // ── Energy (1-25) ──
  { id:1, name:'ExxonMobil', ticker:'XOM', isin:'US30231G1022', country:'US', sector:'Energy', subSector:'Oil & Gas Integrated' },
  { id:2, name:'Chevron', ticker:'CVX', isin:'US1667641005', country:'US', sector:'Energy', subSector:'Oil & Gas Integrated' },
  { id:3, name:'Shell plc', ticker:'SHEL', isin:'GB00BP6MXD84', country:'GB', sector:'Energy', subSector:'Oil & Gas Integrated' },
  { id:4, name:'TotalEnergies', ticker:'TTE', isin:'FR0000120271', country:'FR', sector:'Energy', subSector:'Oil & Gas Integrated' },
  { id:5, name:'BP plc', ticker:'BP', isin:'GB0007980591', country:'GB', sector:'Energy', subSector:'Oil & Gas Integrated' },
  { id:6, name:'ConocoPhillips', ticker:'COP', isin:'US20825C1045', country:'US', sector:'Energy', subSector:'Oil & Gas E&P' },
  { id:7, name:'Equinor ASA', ticker:'EQNR', isin:'NO0010096985', country:'NO', sector:'Energy', subSector:'Oil & Gas Integrated' },
  { id:8, name:'Eni SpA', ticker:'ENI', isin:'IT0003132476', country:'IT', sector:'Energy', subSector:'Oil & Gas Integrated' },
  { id:9, name:'Saudi Aramco', ticker:'2222.SR', isin:'SA14TG012N13', country:'SA', sector:'Energy', subSector:'Oil & Gas E&P' },
  { id:10, name:'Petrobras', ticker:'PBR', isin:'BRPETRACNPR6', country:'BR', sector:'Energy', subSector:'Oil & Gas Integrated' },
  { id:11, name:'NextEra Energy', ticker:'NEE', isin:'US65339F1012', country:'US', sector:'Energy', subSector:'Renewable Utilities' },
  { id:12, name:'Enbridge', ticker:'ENB', isin:'CA29250N1050', country:'CA', sector:'Energy', subSector:'Midstream' },
  { id:13, name:'Schlumberger', ticker:'SLB', isin:'AN8068571086', country:'US', sector:'Energy', subSector:'Oilfield Services' },
  { id:14, name:'Pioneer Natural Resources', ticker:'PXD', isin:'US7237871071', country:'US', sector:'Energy', subSector:'Oil & Gas E&P' },
  { id:15, name:'Woodside Energy', ticker:'WDS', isin:'AU0000224040', country:'AU', sector:'Energy', subSector:'Oil & Gas E&P' },
  { id:16, name:'Repsol SA', ticker:'REP', isin:'ES0173516115', country:'ES', sector:'Energy', subSector:'Oil & Gas Integrated' },
  { id:17, name:'Orsted A/S', ticker:'ORSTED', isin:'DK0060094928', country:'DK', sector:'Energy', subSector:'Offshore Wind' },
  { id:18, name:'Vestas Wind Systems', ticker:'VWS', isin:'DK0061539921', country:'DK', sector:'Energy', subSector:'Wind Turbines' },
  { id:19, name:'Iberdrola SA', ticker:'IBE', isin:'ES0144580Y14', country:'ES', sector:'Energy', subSector:'Renewable Utilities' },
  { id:20, name:'Enel SpA', ticker:'ENEL', isin:'IT0003128367', country:'IT', sector:'Energy', subSector:'Electric Utilities' },
  { id:21, name:'Duke Energy', ticker:'DUK', isin:'US26441C2044', country:'US', sector:'Energy', subSector:'Electric Utilities' },
  { id:22, name:'Southern Company', ticker:'SO', isin:'US8425871071', country:'US', sector:'Energy', subSector:'Electric Utilities' },
  { id:23, name:'Dominion Energy', ticker:'D', isin:'US25746U1097', country:'US', sector:'Energy', subSector:'Electric Utilities' },
  { id:24, name:'Reliance Industries', ticker:'RELIANCE', isin:'INE002A01018', country:'IN', sector:'Energy', subSector:'Integrated Conglomerate' },
  { id:25, name:'CNOOC Ltd', ticker:'883.HK', isin:'HK0883013259', country:'CN', sector:'Energy', subSector:'Oil & Gas E&P' },
  // ── Materials (26-50) ──
  { id:26, name:'BHP Group', ticker:'BHP', isin:'AU000000BHP4', country:'AU', sector:'Materials', subSector:'Diversified Metals & Mining' },
  { id:27, name:'Rio Tinto', ticker:'RIO', isin:'GB0007188757', country:'AU', sector:'Materials', subSector:'Diversified Metals & Mining' },
  { id:28, name:'Vale SA', ticker:'VALE', isin:'BRVALEACNOR0', country:'BR', sector:'Materials', subSector:'Iron Ore' },
  { id:29, name:'Glencore plc', ticker:'GLEN', isin:'JE00B4T3BW64', country:'CH', sector:'Materials', subSector:'Commodity Trading' },
  { id:30, name:'Freeport-McMoRan', ticker:'FCX', isin:'US35671D8570', country:'US', sector:'Materials', subSector:'Copper' },
  { id:31, name:'Newmont Corporation', ticker:'NEM', isin:'US6516391066', country:'US', sector:'Materials', subSector:'Gold' },
  { id:32, name:'Air Liquide', ticker:'AI', isin:'FR0000120073', country:'FR', sector:'Materials', subSector:'Industrial Gases' },
  { id:33, name:'Linde plc', ticker:'LIN', isin:'IE000S9YS762', country:'IE', sector:'Materials', subSector:'Industrial Gases' },
  { id:34, name:'BASF SE', ticker:'BAS', isin:'DE000BASF111', country:'DE', sector:'Materials', subSector:'Chemicals' },
  { id:35, name:'Dow Inc', ticker:'DOW', isin:'US2605571031', country:'US', sector:'Materials', subSector:'Chemicals' },
  { id:36, name:'Nucor Corporation', ticker:'NUE', isin:'US6703461052', country:'US', sector:'Materials', subSector:'Steel' },
  { id:37, name:'ArcelorMittal', ticker:'MT', isin:'LU1598757687', country:'LU', sector:'Materials', subSector:'Steel' },
  { id:38, name:'CRH plc', ticker:'CRH', isin:'IE0001827041', country:'IE', sector:'Materials', subSector:'Building Materials' },
  { id:39, name:'Holcim AG', ticker:'HOLN', isin:'CH0012214059', country:'CH', sector:'Materials', subSector:'Cement' },
  { id:40, name:'Albemarle Corporation', ticker:'ALB', isin:'US0126531013', country:'US', sector:'Materials', subSector:'Lithium' },
  { id:41, name:'Yara International', ticker:'YAR', isin:'NO0010208051', country:'NO', sector:'Materials', subSector:'Fertilizers' },
  { id:42, name:'Anglo American', ticker:'AAL', isin:'GB00B1XZS820', country:'ZA', sector:'Materials', subSector:'Diversified Metals & Mining' },
  { id:43, name:'Teck Resources', ticker:'TECK', isin:'CA8787422044', country:'CA', sector:'Materials', subSector:'Base Metals' },
  { id:44, name:'Norsk Hydro', ticker:'NHY', isin:'NO0005052605', country:'NO', sector:'Materials', subSector:'Aluminium' },
  { id:45, name:'Sumitomo Metal Mining', ticker:'5713.T', isin:'JP3402600005', country:'JP', sector:'Materials', subSector:'Base Metals' },
  { id:46, name:'Smurfit Kappa', ticker:'SKG', isin:'IE00B1RR8406', country:'IE', sector:'Materials', subSector:'Packaging' },
  { id:47, name:'International Paper', ticker:'IP', isin:'US4601461035', country:'US', sector:'Materials', subSector:'Paper & Forest' },
  { id:48, name:'Suzano SA', ticker:'SUZ', isin:'BRSUZBACNOR0', country:'BR', sector:'Materials', subSector:'Pulp & Paper' },
  { id:49, name:'UPM-Kymmene', ticker:'UPM', isin:'FI0009005987', country:'FI', sector:'Materials', subSector:'Forest Products' },
  { id:50, name:'Fortescue Metals', ticker:'FMG', isin:'AU000000FMG4', country:'AU', sector:'Materials', subSector:'Iron Ore' },
  // ── Industrials (51-80) ──
  { id:51, name:'Caterpillar', ticker:'CAT', isin:'US1491231015', country:'US', sector:'Industrials', subSector:'Construction Machinery' },
  { id:52, name:'Deere & Company', ticker:'DE', isin:'US2441991054', country:'US', sector:'Industrials', subSector:'Farm Machinery' },
  { id:53, name:'Siemens AG', ticker:'SIE', isin:'DE0007236101', country:'DE', sector:'Industrials', subSector:'Industrial Conglomerate' },
  { id:54, name:'Honeywell', ticker:'HON', isin:'US4385161066', country:'US', sector:'Industrials', subSector:'Industrial Conglomerate' },
  { id:55, name:'General Electric', ticker:'GE', isin:'US3696043013', country:'US', sector:'Industrials', subSector:'Aviation & Power' },
  { id:56, name:'3M Company', ticker:'MMM', isin:'US88579Y1010', country:'US', sector:'Industrials', subSector:'Diversified Industrials' },
  { id:57, name:'ABB Ltd', ticker:'ABBN', isin:'CH0012221716', country:'CH', sector:'Industrials', subSector:'Electrification' },
  { id:58, name:'Schneider Electric', ticker:'SU', isin:'FR0000121972', country:'FR', sector:'Industrials', subSector:'Electrical Equipment' },
  { id:59, name:'Waste Management', ticker:'WM', isin:'US94106L1098', country:'US', sector:'Industrials', subSector:'Waste & Environment' },
  { id:60, name:'Republic Services', ticker:'RSG', isin:'US7607591002', country:'US', sector:'Industrials', subSector:'Waste & Environment' },
  { id:61, name:'Union Pacific', ticker:'UNP', isin:'US9078181081', country:'US', sector:'Industrials', subSector:'Railroads' },
  { id:62, name:'Canadian Pacific Kansas', ticker:'CP', isin:'CA13646K1084', country:'CA', sector:'Industrials', subSector:'Railroads' },
  { id:63, name:'FedEx Corporation', ticker:'FDX', isin:'US31428X1063', country:'US', sector:'Industrials', subSector:'Logistics' },
  { id:64, name:'United Parcel Service', ticker:'UPS', isin:'US9113121068', country:'US', sector:'Industrials', subSector:'Logistics' },
  { id:65, name:'Airbus SE', ticker:'AIR', isin:'NL0000235190', country:'NL', sector:'Industrials', subSector:'Aerospace' },
  { id:66, name:'Boeing Company', ticker:'BA', isin:'US0970231058', country:'US', sector:'Industrials', subSector:'Aerospace' },
  { id:67, name:'Raytheon Technologies', ticker:'RTX', isin:'US75513E1010', country:'US', sector:'Industrials', subSector:'Defense' },
  { id:68, name:'Lockheed Martin', ticker:'LMT', isin:'US5398301094', country:'US', sector:'Industrials', subSector:'Defense' },
  { id:69, name:'Rolls-Royce Holdings', ticker:'RR', isin:'GB00B63H8491', country:'GB', sector:'Industrials', subSector:'Aerospace Engines' },
  { id:70, name:'Hitachi Ltd', ticker:'6501.T', isin:'JP3788600009', country:'JP', sector:'Industrials', subSector:'Conglomerate' },
  { id:71, name:'Vinci SA', ticker:'DG', isin:'FR0000125486', country:'FR', sector:'Industrials', subSector:'Construction' },
  { id:72, name:'Eiffage SA', ticker:'FGR', isin:'FR0000130452', country:'FR', sector:'Industrials', subSector:'Construction' },
  { id:73, name:'Atlas Copco', ticker:'ATCO-A', isin:'SE0017486889', country:'SE', sector:'Industrials', subSector:'Compressors' },
  { id:74, name:'Parker-Hannifin', ticker:'PH', isin:'US7010941042', country:'US', sector:'Industrials', subSector:'Motion & Control' },
  { id:75, name:'Emerson Electric', ticker:'EMR', isin:'US2910111044', country:'US', sector:'Industrials', subSector:'Automation' },
  { id:76, name:'Danaher Corporation', ticker:'DHR', isin:'US2358511028', country:'US', sector:'Industrials', subSector:'Life Sciences' },
  { id:77, name:'Illinois Tool Works', ticker:'ITW', isin:'US4523081093', country:'US', sector:'Industrials', subSector:'Diversified Industrials' },
  { id:78, name:'Komatsu Ltd', ticker:'6301.T', isin:'JP3304200003', country:'JP', sector:'Industrials', subSector:'Construction Machinery' },
  { id:79, name:'CNH Industrial', ticker:'CNHI', isin:'NL0010545661', country:'NL', sector:'Industrials', subSector:'Farm & Construction' },
  { id:80, name:'Volvo Group', ticker:'VOLV-B', isin:'SE0000115446', country:'SE', sector:'Industrials', subSector:'Commercial Vehicles' },
  // ── Technology (81-120) ──
  { id:81, name:'Apple Inc', ticker:'AAPL', isin:'US0378331005', country:'US', sector:'Technology', subSector:'Consumer Electronics' },
  { id:82, name:'Microsoft', ticker:'MSFT', isin:'US5949181045', country:'US', sector:'Technology', subSector:'Software' },
  { id:83, name:'Alphabet (Google)', ticker:'GOOGL', isin:'US02079K3059', country:'US', sector:'Technology', subSector:'Internet' },
  { id:84, name:'Amazon.com', ticker:'AMZN', isin:'US0231351067', country:'US', sector:'Technology', subSector:'E-Commerce' },
  { id:85, name:'NVIDIA Corporation', ticker:'NVDA', isin:'US67066G1040', country:'US', sector:'Technology', subSector:'Semiconductors' },
  { id:86, name:'Meta Platforms', ticker:'META', isin:'US30303M1027', country:'US', sector:'Technology', subSector:'Social Media' },
  { id:87, name:'Taiwan Semiconductor', ticker:'TSM', isin:'US8740391003', country:'TW', sector:'Technology', subSector:'Semiconductors' },
  { id:88, name:'Samsung Electronics', ticker:'005930.KS', isin:'KR7005930003', country:'KR', sector:'Technology', subSector:'Electronics' },
  { id:89, name:'ASML Holding', ticker:'ASML', isin:'NL0010273215', country:'NL', sector:'Technology', subSector:'Semiconductor Equipment' },
  { id:90, name:'Adobe Inc', ticker:'ADBE', isin:'US00724F1012', country:'US', sector:'Technology', subSector:'Software' },
  { id:91, name:'Salesforce', ticker:'CRM', isin:'US79466L3024', country:'US', sector:'Technology', subSector:'Enterprise Software' },
  { id:92, name:'Oracle Corporation', ticker:'ORCL', isin:'US68389X1054', country:'US', sector:'Technology', subSector:'Enterprise Software' },
  { id:93, name:'SAP SE', ticker:'SAP', isin:'DE0007164600', country:'DE', sector:'Technology', subSector:'Enterprise Software' },
  { id:94, name:'Intel Corporation', ticker:'INTC', isin:'US4581401001', country:'US', sector:'Technology', subSector:'Semiconductors' },
  { id:95, name:'Broadcom Inc', ticker:'AVGO', isin:'US11135F1012', country:'US', sector:'Technology', subSector:'Semiconductors' },
  { id:96, name:'Texas Instruments', ticker:'TXN', isin:'US8825081040', country:'US', sector:'Technology', subSector:'Semiconductors' },
  { id:97, name:'Cisco Systems', ticker:'CSCO', isin:'US17275R1023', country:'US', sector:'Technology', subSector:'Networking' },
  { id:98, name:'Qualcomm', ticker:'QCOM', isin:'US7475251036', country:'US', sector:'Technology', subSector:'Semiconductors' },
  { id:99, name:'ServiceNow', ticker:'NOW', isin:'US81762P1021', country:'US', sector:'Technology', subSector:'Enterprise Software' },
  { id:100, name:'Infosys Ltd', ticker:'INFY', isin:'INE009A01021', country:'IN', sector:'Technology', subSector:'IT Services' },
  { id:101, name:'Tata Consultancy', ticker:'TCS', isin:'INE467B01029', country:'IN', sector:'Technology', subSector:'IT Services' },
  { id:102, name:'Accenture plc', ticker:'ACN', isin:'IE00B4BNMY34', country:'IE', sector:'Technology', subSector:'Consulting' },
  { id:103, name:'Sony Group', ticker:'6758.T', isin:'JP3435000009', country:'JP', sector:'Technology', subSector:'Electronics' },
  { id:104, name:'Applied Materials', ticker:'AMAT', isin:'US0382221051', country:'US', sector:'Technology', subSector:'Semiconductor Equipment' },
  { id:105, name:'Lam Research', ticker:'LRCX', isin:'US5128071082', country:'US', sector:'Technology', subSector:'Semiconductor Equipment' },
  { id:106, name:'Palo Alto Networks', ticker:'PANW', isin:'US6974351057', country:'US', sector:'Technology', subSector:'Cybersecurity' },
  { id:107, name:'CrowdStrike', ticker:'CRWD', isin:'US22788C1053', country:'US', sector:'Technology', subSector:'Cybersecurity' },
  { id:108, name:'Snowflake Inc', ticker:'SNOW', isin:'US8334451098', country:'US', sector:'Technology', subSector:'Cloud Data' },
  { id:109, name:'Shopify Inc', ticker:'SHOP', isin:'CA82509L1076', country:'CA', sector:'Technology', subSector:'E-Commerce Platform' },
  { id:110, name:'Atlassian', ticker:'TEAM', isin:'US0494681010', country:'AU', sector:'Technology', subSector:'Collaboration Software' },
  { id:111, name:'Keyence Corporation', ticker:'6861.T', isin:'JP3236200006', country:'JP', sector:'Technology', subSector:'Sensors & Automation' },
  { id:112, name:'Infineon Technologies', ticker:'IFX', isin:'DE0006231004', country:'DE', sector:'Technology', subSector:'Semiconductors' },
  { id:113, name:'STMicroelectronics', ticker:'STM', isin:'NL0000226223', country:'NL', sector:'Technology', subSector:'Semiconductors' },
  { id:114, name:'MediaTek Inc', ticker:'2454.TW', isin:'TW0002454006', country:'TW', sector:'Technology', subSector:'Semiconductors' },
  { id:115, name:'Tencent Holdings', ticker:'0700.HK', isin:'KYG875721634', country:'CN', sector:'Technology', subSector:'Internet' },
  { id:116, name:'Alibaba Group', ticker:'BABA', isin:'US01609W1027', country:'CN', sector:'Technology', subSector:'E-Commerce' },
  { id:117, name:'Baidu Inc', ticker:'BIDU', isin:'US0567521085', country:'CN', sector:'Technology', subSector:'Internet' },
  { id:118, name:'Meituan', ticker:'3690.HK', isin:'KYG596691041', country:'CN', sector:'Technology', subSector:'Platform' },
  { id:119, name:'MercadoLibre', ticker:'MELI', isin:'US58733R1023', country:'AR', sector:'Technology', subSector:'E-Commerce' },
  { id:120, name:'Grab Holdings', ticker:'GRAB', isin:'KYG4124C1096', country:'SG', sector:'Technology', subSector:'Ride-Hailing' },
  // ── Financials (121-165) ──
  { id:121, name:'JPMorgan Chase', ticker:'JPM', isin:'US46625H1005', country:'US', sector:'Financials', subSector:'Banking' },
  { id:122, name:'Bank of America', ticker:'BAC', isin:'US0605051046', country:'US', sector:'Financials', subSector:'Banking' },
  { id:123, name:'Citigroup', ticker:'C', isin:'US1729674242', country:'US', sector:'Financials', subSector:'Banking' },
  { id:124, name:'Goldman Sachs', ticker:'GS', isin:'US38141G1040', country:'US', sector:'Financials', subSector:'Investment Banking' },
  { id:125, name:'Morgan Stanley', ticker:'MS', isin:'US6174464486', country:'US', sector:'Financials', subSector:'Investment Banking' },
  { id:126, name:'Wells Fargo', ticker:'WFC', isin:'US9497461015', country:'US', sector:'Financials', subSector:'Banking' },
  { id:127, name:'HSBC Holdings', ticker:'HSBA', isin:'GB0005405286', country:'GB', sector:'Financials', subSector:'Banking' },
  { id:128, name:'Barclays plc', ticker:'BARC', isin:'GB0031348658', country:'GB', sector:'Financials', subSector:'Banking' },
  { id:129, name:'UBS Group', ticker:'UBSG', isin:'CH0244767585', country:'CH', sector:'Financials', subSector:'Banking' },
  { id:130, name:'BNP Paribas', ticker:'BNP', isin:'FR0000131104', country:'FR', sector:'Financials', subSector:'Banking' },
  { id:131, name:'Deutsche Bank', ticker:'DBK', isin:'DE0005140008', country:'DE', sector:'Financials', subSector:'Banking' },
  { id:132, name:'Societe Generale', ticker:'GLE', isin:'FR0000130809', country:'FR', sector:'Financials', subSector:'Banking' },
  { id:133, name:'ING Groep', ticker:'INGA', isin:'NL0011821202', country:'NL', sector:'Financials', subSector:'Banking' },
  { id:134, name:'Santander', ticker:'SAN', isin:'ES0113900J37', country:'ES', sector:'Financials', subSector:'Banking' },
  { id:135, name:'Intesa Sanpaolo', ticker:'ISP', isin:'IT0000072618', country:'IT', sector:'Financials', subSector:'Banking' },
  { id:136, name:'Mitsubishi UFJ', ticker:'8306.T', isin:'JP3902900004', country:'JP', sector:'Financials', subSector:'Banking' },
  { id:137, name:'ICBC', ticker:'1398.HK', isin:'CNE1000003G1', country:'CN', sector:'Financials', subSector:'Banking' },
  { id:138, name:'Commonwealth Bank', ticker:'CBA', isin:'AU000000CBA7', country:'AU', sector:'Financials', subSector:'Banking' },
  { id:139, name:'Toronto-Dominion Bank', ticker:'TD', isin:'CA8911605092', country:'CA', sector:'Financials', subSector:'Banking' },
  { id:140, name:'BlackRock', ticker:'BLK', isin:'US09247X1019', country:'US', sector:'Financials', subSector:'Asset Management' },
  { id:141, name:'Charles Schwab', ticker:'SCHW', isin:'US8085131055', country:'US', sector:'Financials', subSector:'Brokerage' },
  { id:142, name:'Visa Inc', ticker:'V', isin:'US92826C8394', country:'US', sector:'Financials', subSector:'Payments' },
  { id:143, name:'Mastercard', ticker:'MA', isin:'US57636Q1040', country:'US', sector:'Financials', subSector:'Payments' },
  { id:144, name:'AXA SA', ticker:'CS', isin:'FR0000120628', country:'FR', sector:'Financials', subSector:'Insurance' },
  { id:145, name:'Allianz SE', ticker:'ALV', isin:'DE0008404005', country:'DE', sector:'Financials', subSector:'Insurance' },
  { id:146, name:'Zurich Insurance', ticker:'ZURN', isin:'CH0011075394', country:'CH', sector:'Financials', subSector:'Insurance' },
  { id:147, name:'AIA Group', ticker:'1299.HK', isin:'HK0000069689', country:'HK', sector:'Financials', subSector:'Insurance' },
  { id:148, name:'Ping An Insurance', ticker:'2318.HK', isin:'CNE1000003X6', country:'CN', sector:'Financials', subSector:'Insurance' },
  { id:149, name:'Standard Chartered', ticker:'STAN', isin:'GB0004082847', country:'GB', sector:'Financials', subSector:'Banking' },
  { id:150, name:'DBS Group', ticker:'D05.SI', isin:'SG1L01001701', country:'SG', sector:'Financials', subSector:'Banking' },
  { id:151, name:'Brookfield Asset Mgmt', ticker:'BAM', isin:'CA1125851040', country:'CA', sector:'Financials', subSector:'Alternative Assets' },
  { id:152, name:'KKR & Co', ticker:'KKR', isin:'US48251W1045', country:'US', sector:'Financials', subSector:'Private Equity' },
  { id:153, name:'Apollo Global Mgmt', ticker:'APO', isin:'US03769M1062', country:'US', sector:'Financials', subSector:'Private Equity' },
  { id:154, name:'Ares Management', ticker:'ARES', isin:'US03990B1017', country:'US', sector:'Financials', subSector:'Private Credit' },
  { id:155, name:'Macquarie Group', ticker:'MQG', isin:'AU000000MQG1', country:'AU', sector:'Financials', subSector:'Infrastructure Finance' },
  { id:156, name:'Nomura Holdings', ticker:'8604.T', isin:'JP3762600009', country:'JP', sector:'Financials', subSector:'Investment Banking' },
  { id:157, name:'HDFC Bank', ticker:'HDFCBANK', isin:'INE040A01034', country:'IN', sector:'Financials', subSector:'Banking' },
  { id:158, name:'State Bank of India', ticker:'SBIN', isin:'INE062A01020', country:'IN', sector:'Financials', subSector:'Banking' },
  { id:159, name:'Itau Unibanco', ticker:'ITUB', isin:'BRITUBACNPR1', country:'BR', sector:'Financials', subSector:'Banking' },
  { id:160, name:'Nedbank Group', ticker:'NED', isin:'ZAE000004875', country:'ZA', sector:'Financials', subSector:'Banking' },
  { id:161, name:'FirstRand Ltd', ticker:'FSR', isin:'ZAE000066304', country:'ZA', sector:'Financials', subSector:'Banking' },
  { id:162, name:'Skandinaviska Enskilda', ticker:'SEB-A', isin:'SE0000148884', country:'SE', sector:'Financials', subSector:'Banking' },
  { id:163, name:'DNB Bank', ticker:'DNB', isin:'NO0010031479', country:'NO', sector:'Financials', subSector:'Banking' },
  { id:164, name:'National Australia Bank', ticker:'NAB', isin:'AU000000NAB4', country:'AU', sector:'Financials', subSector:'Banking' },
  { id:165, name:'Bank of Nova Scotia', ticker:'BNS', isin:'CA0641491075', country:'CA', sector:'Financials', subSector:'Banking' },
  // ── Healthcare (166-195) ──
  { id:166, name:'Johnson & Johnson', ticker:'JNJ', isin:'US4781601046', country:'US', sector:'Healthcare', subSector:'Pharma' },
  { id:167, name:'UnitedHealth Group', ticker:'UNH', isin:'US91324P1021', country:'US', sector:'Healthcare', subSector:'Health Insurance' },
  { id:168, name:'Eli Lilly', ticker:'LLY', isin:'US5324571083', country:'US', sector:'Healthcare', subSector:'Pharma' },
  { id:169, name:'Novo Nordisk', ticker:'NOVO-B', isin:'DK0062498333', country:'DK', sector:'Healthcare', subSector:'Pharma' },
  { id:170, name:'Roche Holding', ticker:'ROG', isin:'CH0012032048', country:'CH', sector:'Healthcare', subSector:'Pharma' },
  { id:171, name:'Pfizer Inc', ticker:'PFE', isin:'US7170811035', country:'US', sector:'Healthcare', subSector:'Pharma' },
  { id:172, name:'AbbVie Inc', ticker:'ABBV', isin:'US00287Y1091', country:'US', sector:'Healthcare', subSector:'Biopharma' },
  { id:173, name:'Merck & Co', ticker:'MRK', isin:'US58933Y1055', country:'US', sector:'Healthcare', subSector:'Pharma' },
  { id:174, name:'AstraZeneca', ticker:'AZN', isin:'GB0009895292', country:'GB', sector:'Healthcare', subSector:'Pharma' },
  { id:175, name:'Novartis AG', ticker:'NOVN', isin:'CH0012005267', country:'CH', sector:'Healthcare', subSector:'Pharma' },
  { id:176, name:'Sanofi SA', ticker:'SAN.PA', isin:'FR0000120578', country:'FR', sector:'Healthcare', subSector:'Pharma' },
  { id:177, name:'GSK plc', ticker:'GSK', isin:'GB00BN7SWP63', country:'GB', sector:'Healthcare', subSector:'Pharma' },
  { id:178, name:'Amgen Inc', ticker:'AMGN', isin:'US0311621009', country:'US', sector:'Healthcare', subSector:'Biotech' },
  { id:179, name:'Gilead Sciences', ticker:'GILD', isin:'US3755581036', country:'US', sector:'Healthcare', subSector:'Biotech' },
  { id:180, name:'Medtronic plc', ticker:'MDT', isin:'IE00BTN1Y115', country:'IE', sector:'Healthcare', subSector:'Medical Devices' },
  { id:181, name:'Abbott Laboratories', ticker:'ABT', isin:'US0028241000', country:'US', sector:'Healthcare', subSector:'Medical Devices' },
  { id:182, name:'Stryker Corporation', ticker:'SYK', isin:'US8636671013', country:'US', sector:'Healthcare', subSector:'Medical Devices' },
  { id:183, name:'Becton Dickinson', ticker:'BDX', isin:'US0758871091', country:'US', sector:'Healthcare', subSector:'Medical Devices' },
  { id:184, name:'Daiichi Sankyo', ticker:'4568.T', isin:'JP3475350009', country:'JP', sector:'Healthcare', subSector:'Pharma' },
  { id:185, name:'Takeda Pharmaceutical', ticker:'4502.T', isin:'JP3463000004', country:'JP', sector:'Healthcare', subSector:'Pharma' },
  { id:186, name:'CSL Limited', ticker:'CSL', isin:'AU000000CSL8', country:'AU', sector:'Healthcare', subSector:'Blood Products' },
  { id:187, name:'Bayer AG', ticker:'BAYN', isin:'DE000BAY0017', country:'DE', sector:'Healthcare', subSector:'Pharma & Crop Science' },
  { id:188, name:'Siemens Healthineers', ticker:'SHL', isin:'DE000SHL1006', country:'DE', sector:'Healthcare', subSector:'Medical Imaging' },
  { id:189, name:'Sun Pharma', ticker:'SUNPHARMA', isin:'INE044A01036', country:'IN', sector:'Healthcare', subSector:'Generics' },
  { id:190, name:'Dr Reddy Labs', ticker:'DRREDDY', isin:'INE089A01023', country:'IN', sector:'Healthcare', subSector:'Generics' },
  { id:191, name:'Samsung Biologics', ticker:'207940.KS', isin:'KR7207940008', country:'KR', sector:'Healthcare', subSector:'CDMO' },
  { id:192, name:'WuXi AppTec', ticker:'2359.HK', isin:'CNE100003F19', country:'CN', sector:'Healthcare', subSector:'CRO' },
  { id:193, name:'Lonza Group', ticker:'LONN', isin:'CH0013841017', country:'CH', sector:'Healthcare', subSector:'CDMO' },
  { id:194, name:'Sartorius AG', ticker:'SRT3', isin:'DE0007165631', country:'DE', sector:'Healthcare', subSector:'Bioprocess' },
  { id:195, name:'Intuitive Surgical', ticker:'ISRG', isin:'US46120E6023', country:'US', sector:'Healthcare', subSector:'Surgical Robotics' },
  // ── Consumer Staples (196-215) ──
  { id:196, name:'Nestle SA', ticker:'NESN', isin:'CH0038863350', country:'CH', sector:'Consumer Staples', subSector:'Food & Beverages' },
  { id:197, name:'Procter & Gamble', ticker:'PG', isin:'US7427181091', country:'US', sector:'Consumer Staples', subSector:'Household Products' },
  { id:198, name:'Coca-Cola Company', ticker:'KO', isin:'US1912161007', country:'US', sector:'Consumer Staples', subSector:'Beverages' },
  { id:199, name:'PepsiCo Inc', ticker:'PEP', isin:'US7134481081', country:'US', sector:'Consumer Staples', subSector:'Beverages' },
  { id:200, name:'Unilever plc', ticker:'ULVR', isin:'GB00B10RZP78', country:'GB', sector:'Consumer Staples', subSector:'Consumer Goods' },
  { id:201, name:'LOreal SA', ticker:'OR', isin:'FR0000120321', country:'FR', sector:'Consumer Staples', subSector:'Beauty' },
  { id:202, name:'Diageo plc', ticker:'DGE', isin:'GB0002374006', country:'GB', sector:'Consumer Staples', subSector:'Spirits' },
  { id:203, name:'Philip Morris', ticker:'PM', isin:'US7181721090', country:'US', sector:'Consumer Staples', subSector:'Tobacco' },
  { id:204, name:'Costco Wholesale', ticker:'COST', isin:'US22160K1051', country:'US', sector:'Consumer Staples', subSector:'Retail' },
  { id:205, name:'Walmart Inc', ticker:'WMT', isin:'US9311421039', country:'US', sector:'Consumer Staples', subSector:'Retail' },
  { id:206, name:'AB InBev', ticker:'ABI', isin:'BE0974293251', country:'BE', sector:'Consumer Staples', subSector:'Beverages' },
  { id:207, name:'Mondelez International', ticker:'MDLZ', isin:'US6092071058', country:'US', sector:'Consumer Staples', subSector:'Snacks' },
  { id:208, name:'Danone SA', ticker:'BN', isin:'FR0000120644', country:'FR', sector:'Consumer Staples', subSector:'Dairy' },
  { id:209, name:'Colgate-Palmolive', ticker:'CL', isin:'US1941621039', country:'US', sector:'Consumer Staples', subSector:'Household Products' },
  { id:210, name:'Archer-Daniels-Midland', ticker:'ADM', isin:'US0394831020', country:'US', sector:'Consumer Staples', subSector:'Agribusiness' },
  { id:211, name:'Bunge Ltd', ticker:'BG', isin:'BMG169621056', country:'US', sector:'Consumer Staples', subSector:'Agribusiness' },
  { id:212, name:'ITC Ltd', ticker:'ITC', isin:'INE154A01025', country:'IN', sector:'Consumer Staples', subSector:'Tobacco & FMCG' },
  { id:213, name:'Hindustan Unilever', ticker:'HINDUNILVR', isin:'INE030A01027', country:'IN', sector:'Consumer Staples', subSector:'FMCG' },
  { id:214, name:'JBS SA', ticker:'JBSS3', isin:'BRJBSSACNOR8', country:'BR', sector:'Consumer Staples', subSector:'Meat Processing' },
  { id:215, name:'Tyson Foods', ticker:'TSN', isin:'US9024941034', country:'US', sector:'Consumer Staples', subSector:'Meat Processing' },
  // ── Consumer Discretionary (216-240) ──
  { id:216, name:'Tesla Inc', ticker:'TSLA', isin:'US88160R1014', country:'US', sector:'Consumer Discretionary', subSector:'Electric Vehicles' },
  { id:217, name:'Toyota Motor', ticker:'7203.T', isin:'JP3633400001', country:'JP', sector:'Consumer Discretionary', subSector:'Automobiles' },
  { id:218, name:'Volkswagen AG', ticker:'VOW3', isin:'DE0007664039', country:'DE', sector:'Consumer Discretionary', subSector:'Automobiles' },
  { id:219, name:'BMW AG', ticker:'BMW', isin:'DE0005190003', country:'DE', sector:'Consumer Discretionary', subSector:'Automobiles' },
  { id:220, name:'Mercedes-Benz', ticker:'MBG', isin:'DE0007100000', country:'DE', sector:'Consumer Discretionary', subSector:'Automobiles' },
  { id:221, name:'Stellantis NV', ticker:'STLA', isin:'NL00150001Q9', country:'NL', sector:'Consumer Discretionary', subSector:'Automobiles' },
  { id:222, name:'BYD Company', ticker:'1211.HK', isin:'CNE100000296', country:'CN', sector:'Consumer Discretionary', subSector:'Electric Vehicles' },
  { id:223, name:'Hyundai Motor', ticker:'005380.KS', isin:'KR7005380001', country:'KR', sector:'Consumer Discretionary', subSector:'Automobiles' },
  { id:224, name:'LVMH', ticker:'MC', isin:'FR0000121014', country:'FR', sector:'Consumer Discretionary', subSector:'Luxury Goods' },
  { id:225, name:'Nike Inc', ticker:'NKE', isin:'US6541061031', country:'US', sector:'Consumer Discretionary', subSector:'Apparel' },
  { id:226, name:'Home Depot', ticker:'HD', isin:'US4370761029', country:'US', sector:'Consumer Discretionary', subSector:'Home Improvement' },
  { id:227, name:'McDonalds Corporation', ticker:'MCD', isin:'US5801351017', country:'US', sector:'Consumer Discretionary', subSector:'Restaurants' },
  { id:228, name:'Starbucks', ticker:'SBUX', isin:'US8552441094', country:'US', sector:'Consumer Discretionary', subSector:'Restaurants' },
  { id:229, name:'Booking Holdings', ticker:'BKNG', isin:'US09857L1089', country:'US', sector:'Consumer Discretionary', subSector:'Travel' },
  { id:230, name:'Marriott International', ticker:'MAR', isin:'US5719032022', country:'US', sector:'Consumer Discretionary', subSector:'Hotels' },
  { id:231, name:'Sony Group Corp', ticker:'SONY', isin:'JP3435000009', country:'JP', sector:'Consumer Discretionary', subSector:'Entertainment' },
  { id:232, name:'Inditex SA', ticker:'ITX', isin:'ES0148396007', country:'ES', sector:'Consumer Discretionary', subSector:'Fast Fashion' },
  { id:233, name:'Tata Motors', ticker:'TATAMOTORS', isin:'INE155A01022', country:'IN', sector:'Consumer Discretionary', subSector:'Automobiles' },
  { id:234, name:'Li Auto Inc', ticker:'LI', isin:'US50202M1027', country:'CN', sector:'Consumer Discretionary', subSector:'Electric Vehicles' },
  { id:235, name:'Rivian Automotive', ticker:'RIVN', isin:'US76954A1034', country:'US', sector:'Consumer Discretionary', subSector:'Electric Vehicles' },
  { id:236, name:'Hermes International', ticker:'RMS', isin:'FR0000052292', country:'FR', sector:'Consumer Discretionary', subSector:'Luxury Goods' },
  { id:237, name:'Kering SA', ticker:'KER', isin:'FR0000121485', country:'FR', sector:'Consumer Discretionary', subSector:'Luxury Goods' },
  { id:238, name:'Adidas AG', ticker:'ADS', isin:'DE000A1EWWW0', country:'DE', sector:'Consumer Discretionary', subSector:'Apparel' },
  { id:239, name:'Fast Retailing', ticker:'9983.T', isin:'JP3802300008', country:'JP', sector:'Consumer Discretionary', subSector:'Apparel' },
  { id:240, name:'General Motors', ticker:'GM', isin:'US37045V1008', country:'US', sector:'Consumer Discretionary', subSector:'Automobiles' },
  // ── Real Estate (241-255) ──
  { id:241, name:'Prologis Inc', ticker:'PLD', isin:'US74340W1036', country:'US', sector:'Real Estate', subSector:'Industrial REIT' },
  { id:242, name:'American Tower', ticker:'AMT', isin:'US03027X1000', country:'US', sector:'Real Estate', subSector:'Tower REIT' },
  { id:243, name:'Equinix Inc', ticker:'EQIX', isin:'US29444U7000', country:'US', sector:'Real Estate', subSector:'Data Center REIT' },
  { id:244, name:'Simon Property', ticker:'SPG', isin:'US8288061091', country:'US', sector:'Real Estate', subSector:'Retail REIT' },
  { id:245, name:'Vonovia SE', ticker:'VNA', isin:'DE000A1ML7J1', country:'DE', sector:'Real Estate', subSector:'Residential' },
  { id:246, name:'British Land', ticker:'BLND', isin:'GB0001367019', country:'GB', sector:'Real Estate', subSector:'Commercial' },
  { id:247, name:'Segro plc', ticker:'SGRO', isin:'GB00B5ZN1N88', country:'GB', sector:'Real Estate', subSector:'Industrial' },
  { id:248, name:'Goodman Group', ticker:'GMG', isin:'AU000000GMG2', country:'AU', sector:'Real Estate', subSector:'Logistics' },
  { id:249, name:'Link REIT', ticker:'0823.HK', isin:'HK0823032773', country:'HK', sector:'Real Estate', subSector:'Retail REIT' },
  { id:250, name:'CapitaLand Inv', ticker:'9CI.SI', isin:'SG1T67931084', country:'SG', sector:'Real Estate', subSector:'Diversified REIT' },
  { id:251, name:'Mitsui Fudosan', ticker:'8801.T', isin:'JP3893200000', country:'JP', sector:'Real Estate', subSector:'Diversified' },
  { id:252, name:'Sun Hung Kai', ticker:'0016.HK', isin:'HK0016000132', country:'HK', sector:'Real Estate', subSector:'Developer' },
  { id:253, name:'Welltower Inc', ticker:'WELL', isin:'US95040Q1040', country:'US', sector:'Real Estate', subSector:'Healthcare REIT' },
  { id:254, name:'Digital Realty', ticker:'DLR', isin:'US2538681030', country:'US', sector:'Real Estate', subSector:'Data Center REIT' },
  { id:255, name:'Gecina SA', ticker:'GFC', isin:'FR0010040865', country:'FR', sector:'Real Estate', subSector:'Office REIT' },
  // ── Utilities (256-270) ──
  { id:256, name:'Engie SA', ticker:'ENGI', isin:'FR0010208488', country:'FR', sector:'Utilities', subSector:'Multi-Utility' },
  { id:257, name:'National Grid', ticker:'NG', isin:'GB00BDR05C01', country:'GB', sector:'Utilities', subSector:'Transmission' },
  { id:258, name:'SSE plc', ticker:'SSE', isin:'GB0007908733', country:'GB', sector:'Utilities', subSector:'Renewable Utility' },
  { id:259, name:'E.ON SE', ticker:'EOAN', isin:'DE000ENAG999', country:'DE', sector:'Utilities', subSector:'Distribution' },
  { id:260, name:'RWE AG', ticker:'RWE', isin:'DE0007037129', country:'DE', sector:'Utilities', subSector:'Power Generation' },
  { id:261, name:'Exelon Corporation', ticker:'EXC', isin:'US30161N1019', country:'US', sector:'Utilities', subSector:'Regulated Utility' },
  { id:262, name:'AES Corporation', ticker:'AES', isin:'US00130H1059', country:'US', sector:'Utilities', subSector:'Renewable Utility' },
  { id:263, name:'Eversource Energy', ticker:'ES', isin:'US30040W1080', country:'US', sector:'Utilities', subSector:'Regulated Utility' },
  { id:264, name:'Fortis Inc', ticker:'FTS', isin:'CA3495531079', country:'CA', sector:'Utilities', subSector:'Regulated Utility' },
  { id:265, name:'AGL Energy', ticker:'AGL', isin:'AU000000AGL7', country:'AU', sector:'Utilities', subSector:'Multi-Utility' },
  { id:266, name:'NTPC Ltd', ticker:'NTPC', isin:'INE733E01010', country:'IN', sector:'Utilities', subSector:'Power Generation' },
  { id:267, name:'China Yangtze Power', ticker:'600900.SS', isin:'CNE000001G87', country:'CN', sector:'Utilities', subSector:'Hydro' },
  { id:268, name:'Ecopetrol SA', ticker:'EC', isin:'COC04PA00016', country:'CO', sector:'Utilities', subSector:'Integrated Energy' },
  { id:269, name:'Tenaga Nasional', ticker:'TNB', isin:'MYL5347OO009', country:'MY', sector:'Utilities', subSector:'Electric Utility' },
  { id:270, name:'Veolia Environnement', ticker:'VIE', isin:'FR0000124141', country:'FR', sector:'Utilities', subSector:'Water & Waste' },
  // ── Communication Services (271-285) ──
  { id:271, name:'Walt Disney', ticker:'DIS', isin:'US2546871060', country:'US', sector:'Communication', subSector:'Entertainment' },
  { id:272, name:'Netflix Inc', ticker:'NFLX', isin:'US64110L1061', country:'US', sector:'Communication', subSector:'Streaming' },
  { id:273, name:'Comcast Corporation', ticker:'CMCSA', isin:'US20030N1019', country:'US', sector:'Communication', subSector:'Cable' },
  { id:274, name:'Deutsche Telekom', ticker:'DTE', isin:'DE0005557508', country:'DE', sector:'Communication', subSector:'Telecoms' },
  { id:275, name:'Vodafone Group', ticker:'VOD', isin:'GB00BH4HKS39', country:'GB', sector:'Communication', subSector:'Telecoms' },
  { id:276, name:'SoftBank Group', ticker:'9984.T', isin:'JP3436100006', country:'JP', sector:'Communication', subSector:'Conglomerate' },
  { id:277, name:'Bharti Airtel', ticker:'BHARTIARTL', isin:'INE397D01024', country:'IN', sector:'Communication', subSector:'Telecoms' },
  { id:278, name:'China Mobile', ticker:'0941.HK', isin:'HK0941009539', country:'CN', sector:'Communication', subSector:'Telecoms' },
  { id:279, name:'Verizon Communications', ticker:'VZ', isin:'US92343V1044', country:'US', sector:'Communication', subSector:'Telecoms' },
  { id:280, name:'AT&T Inc', ticker:'T', isin:'US00206R1023', country:'US', sector:'Communication', subSector:'Telecoms' },
  { id:281, name:'Spotify Technology', ticker:'SPOT', isin:'LU1778762911', country:'SE', sector:'Communication', subSector:'Streaming' },
  { id:282, name:'Nintendo Co', ticker:'7974.T', isin:'JP3756600007', country:'JP', sector:'Communication', subSector:'Gaming' },
  { id:283, name:'Naspers Ltd', ticker:'NPN', isin:'ZAE000015889', country:'ZA', sector:'Communication', subSector:'Internet Invest' },
  { id:284, name:'Sea Limited', ticker:'SE', isin:'US81141R1005', country:'SG', sector:'Communication', subSector:'Gaming/E-Commerce' },
  { id:285, name:'SK Telecom', ticker:'017670.KS', isin:'KR7017670001', country:'KR', sector:'Communication', subSector:'Telecoms' },
  // ── Transport / Shipping / Aviation (286-300) ──
  { id:286, name:'Maersk', ticker:'MAERSK-B', isin:'DK0010244508', country:'DK', sector:'Transport', subSector:'Container Shipping' },
  { id:287, name:'CMA CGM', ticker:'N/A', isin:'FR0000001000', country:'FR', sector:'Transport', subSector:'Container Shipping' },
  { id:288, name:'Hapag-Lloyd', ticker:'HLAG', isin:'DE000HLAG475', country:'DE', sector:'Transport', subSector:'Container Shipping' },
  { id:289, name:'Yang Ming Marine', ticker:'2609.TW', isin:'TW0002609005', country:'TW', sector:'Transport', subSector:'Container Shipping' },
  { id:290, name:'COSCO Shipping', ticker:'1919.HK', isin:'CNE1000002J7', country:'CN', sector:'Transport', subSector:'Container Shipping' },
  { id:291, name:'Delta Air Lines', ticker:'DAL', isin:'US2473617023', country:'US', sector:'Transport', subSector:'Airlines' },
  { id:292, name:'United Airlines', ticker:'UAL', isin:'US9100471096', country:'US', sector:'Transport', subSector:'Airlines' },
  { id:293, name:'Lufthansa Group', ticker:'LHA', isin:'DE0008232125', country:'DE', sector:'Transport', subSector:'Airlines' },
  { id:294, name:'IAG (British Airways)', ticker:'IAG', isin:'ES0177542018', country:'GB', sector:'Transport', subSector:'Airlines' },
  { id:295, name:'Singapore Airlines', ticker:'C6L.SI', isin:'SG1V61937297', country:'SG', sector:'Transport', subSector:'Airlines' },
  { id:296, name:'Cathay Pacific', ticker:'0293.HK', isin:'HK0293001514', country:'HK', sector:'Transport', subSector:'Airlines' },
  { id:297, name:'Air France-KLM', ticker:'AF', isin:'FR0000031122', country:'FR', sector:'Transport', subSector:'Airlines' },
  { id:298, name:'Emirates (dnata)', ticker:'N/A', isin:'N/A', country:'AE', sector:'Transport', subSector:'Airlines' },
  { id:299, name:'Ryanair Holdings', ticker:'RYAAY', isin:'IE00BYTBXV33', country:'IE', sector:'Transport', subSector:'Low-Cost Airlines' },
  { id:300, name:'LATAM Airlines', ticker:'LTM', isin:'CL0000000423', country:'CL', sector:'Transport', subSector:'Airlines' },
];

// ══════════════════════════════════════════════════════════════════════════════
// HELPER ARRAYS
// ══════════════════════════════════════════════════════════════════════════════
const COUNTRIES_30 = ['US','GB','DE','FR','JP','AU','CA','CH','NL','SE','NO','DK','IT','ES','BE','FI','IE','BR','IN','CN','KR','TW','SG','HK','ZA','MX','CO','CL','MY','AE'];
const COUNTRY_NAMES = {US:'United States',GB:'United Kingdom',DE:'Germany',FR:'France',JP:'Japan',AU:'Australia',CA:'Canada',CH:'Switzerland',NL:'Netherlands',SE:'Sweden',NO:'Norway',DK:'Denmark',IT:'Italy',ES:'Spain',BE:'Belgium',FI:'Finland',IE:'Ireland',BR:'Brazil',IN:'India',CN:'China',KR:'South Korea',TW:'Taiwan',SG:'Singapore',HK:'Hong Kong',ZA:'South Africa',MX:'Mexico',CO:'Colombia',CL:'Chile',MY:'Malaysia',AE:'UAE',SA:'Saudi Arabia',PL:'Poland',CZ:'Czech Republic',IL:'Israel',TH:'Thailand',ID:'Indonesia',PH:'Philippines',NZ:'New Zealand',AT:'Austria',PT:'Portugal'};
const RATINGS = ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B'];
const IG_RATINGS = ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-'];
const HY_RATINGS = ['BB+','BB','BB-','B+','B'];
const SECTORS = ['Energy','Materials','Industrials','Technology','Financials','Healthcare','Consumer Staples','Consumer Discretionary','Real Estate','Utilities','Communication'];
const EPC_RATINGS = ['A','B','C','D','E','F','G'];
const CII_GRADES = ['A','B','C','D','E'];
const FUEL_TYPES = ['VLSFO','LNG','Methanol','HFO','MGO','Ammonia'];
const VESSEL_TYPES = ['Bulk Carrier','Container','Tanker','LNG Carrier','Ro-Ro','Chemical Tanker'];
const MATURITIES_SOV = ['2Y','5Y','10Y','20Y','30Y'];
const SOV_COUNTRIES = ['US','GB','DE','FR','JP','AU','CA','IT','ES','NL','SE','NO','DK','BE','FI','IE','BR','IN','CN','KR','ZA','MX','CO','CL','SG','NZ','AT','PT','IL','PL','CZ'];

const CITIES = ['New York','London','Frankfurt','Paris','Tokyo','Sydney','Toronto','Zurich','Amsterdam','Stockholm','Oslo','Copenhagen','Milan','Madrid','Brussels','Helsinki','Dublin','Sao Paulo','Mumbai','Shanghai','Seoul','Taipei','Singapore','Hong Kong','Johannesburg','Mexico City','Dubai','Warsaw','Prague','Tel Aviv'];

const RE_TYPES = ['Office','Retail','Industrial','Residential','Logistics'];
const INFRA_TYPES = ['Solar Farm','Wind Farm','Battery Storage','Toll Road','Airport','Hospital PPP','Fibre Network','Water Treatment','Rail Link','Port Terminal'];

// ══════════════════════════════════════════════════════════════════════════════
// 1. LISTED EQUITY — 800 holdings
// ══════════════════════════════════════════════════════════════════════════════
const equityWeight = 0.38; // 38% of AUM = $19Bn
const EQUITY_HOLDINGS = [];

// First 300 from master universe
for (let i = 0; i < 300; i++) {
  const c = MASTER_COMPANIES[i];
  const seed = 1000 + i;
  const w = round4(rng(0.02, 0.22, seed));
  const price = round2(rng(15, 800, seed + 1));
  const mktVal = round2(AUM * equityWeight * (w / 100));
  const shares = Math.round(mktVal / price);
  const costBasis = round2(price * rng(0.65, 1.15, seed + 2));
  EQUITY_HOLDINGS.push({
    holdingId: `EQ-${String(i + 1).padStart(4, '0')}`,
    assetClass: 'Listed Equity',
    companyId: c.id,
    name: c.name,
    ticker: c.ticker,
    isin: c.isin,
    country: c.country,
    countryName: COUNTRY_NAMES[c.country] || c.country,
    sector: c.sector,
    subSector: c.subSector,
    shares,
    weightPct: w,
    costBasis,
    currentPrice: price,
    marketValue: mktVal,
    unrealisedPnl: round2((price - costBasis) * shares),
    pcafClass: 1,
    pcafDqs: rngInt(1, 4, seed + 3),
  });
}

// 500 smaller positions (synthetic smaller-cap companies)
const SMALL_NAMES = [
  'Plug Power','Bloom Energy','Enphase Energy','SolarEdge Technologies','First Solar',
  'Array Technologies','Sunrun Inc','Sunnova Energy','Canadian Solar','JinkoSolar',
  'ChargePoint Holdings','EVgo Inc','Lucid Group','Fisker Inc','Lordstown Motors',
  'QuantumScape','Solid Power','Li-Cycle Holdings','Redwood Materials','Umicore SA',
  'ITM Power','Ceres Power','AFC Energy','Ballard Power','Fuel Cell Energy',
  'Bloom Energy','Maxeon Solar','Daqo New Energy','Xinyi Solar','LONGi Green Energy',
  'Siemens Gamesa','Nordex SE','TPI Composites','Hannon Armstrong','Clearway Energy',
  'Brookfield Renewable','TransAlta Renewables','Boralex Inc','Innergex Renewable','Northland Power',
  'Algonquin Power','Atlantica Sustainable','ReNew Energy','Azure Power','Adani Green Energy',
  'Suzlon Energy','Tata Power','JSW Energy','Torrent Power','NHPC Ltd',
  'BorgWarner Inc','Aptiv plc','ON Semiconductor','Wolfspeed Inc','Power Integrations',
  'Shoals Technologies','Array Technologies','Stem Inc','Fluence Energy','EOS Energy',
  'Montrose Environmental','Clean Harbors','US Ecology','Casella Waste','Covanta Holding',
  'Stantec Inc','Arcadis NV','WSP Global','AECOM','Jacobs Solutions',
  'Xylem Inc','A.O. Smith','Roper Technologies','IDEX Corporation','Watts Water Technologies',
  'Evoqua Water Tech','Mueller Water Products','Energy Recovery','Pentair plc','Franklin Electric',
  'Darling Ingredients','Corbion NV','Novozymes','Chr Hansen','Kerry Group',
  'DSM-Firmenich','Symrise AG','Givaudan SA','IFF Inc','Croda International',
  'Beyond Meat','Oatly Group','Tattooed Chef','AppHarvest','Local Bounti',
  'Impossible Foods','Eat Just Inc','Apeel Sciences','Natura & Co','Essity AB',
  // Financials small
  'Triodos Bank','Amalgamated Bank','Aspiration Inc','Oportun Financial','Green Dot Corp',
  'LendingClub Corp','SoFi Technologies','Upstart Holdings','Affirm Holdings','Toast Inc',
  'Marqeta Inc','Payoneer Global','Remitly Global','Wise plc','Adyen NV',
  'Nexi SpA','Worldline SA','Global-e Online','dLocal Ltd','PagSeguro Digital',
  'Hannon Armstrong','DigitalBridge Group','Owl Rock Capital','Blue Owl Capital','Ares Capital',
  'FS KKR Capital','Golub Capital BDC','Gladstone Capital','Prospect Capital','Hercules Capital',
  // Tech small
  'Palantir Technologies','C3.ai Inc','BigBear.ai','Recursion Pharma','Veeva Systems',
  'Datadog Inc','Dynatrace Inc','Elastic NV','Confluent Inc','HashiCorp Inc',
  'MongoDB Inc','Cloudflare Inc','Fastly Inc','Zscaler Inc','SentinelOne',
  'Varonis Systems','Tenable Holdings','Rapid7 Inc','CyberArk Software','Fortinet Inc',
  'Okta Inc','Twilio Inc','HubSpot Inc','ZoomInfo Tech','Braze Inc',
  'Klaviyo Inc','GitLab Inc','JFrog Ltd','UiPath Inc','Celonis SE',
  // Healthcare small
  'Moderna Inc','BioNTech SE','CureVac NV','Arcturus Therapeutics','Ionis Pharma',
  'Alnylam Pharma','Vertex Pharma','Regeneron Pharma','BioMarin Pharma','Exact Sciences',
  'Guardant Health','10x Genomics','Pacific Biosciences','Illumina Inc','Agilent Technologies',
  'Bio-Techne Corp','Repligen Corp','West Pharma','Azenta Inc','Stevanato Group',
  // Materials small
  'Sigma Lithium','Piedmont Lithium','Livent Corp','Allkem Ltd','Pilbara Minerals',
  'IGO Ltd','Lynas Rare Earths','MP Materials','Energy Fuels','Uranium Energy',
  'Cameco Corporation','NexGen Energy','Paladin Energy','Boss Energy','Denison Mines',
  'Ivanhoe Mines','First Quantum','Lundin Mining','Hudbay Minerals','Capstone Copper',
  // Consumer small
  'Rivian Automotive','Polestar Automotive','Vinfast Auto','Xpeng Inc','NIO Inc',
  'Zeekr Intelligent','Canoo Inc','Arrival SA','REE Automotive','Hyzon Motors',
  'Nikola Corporation','Embark Technology','TuSimple Holdings','Aurora Innovation','Waymo (Alphabet)',
  'Joby Aviation','Lilium NV','Archer Aviation','Blade Air Mobility','Vertical Aerospace',
  // Utilities small
  'Ormat Technologies','Sunnova Energy','TerraForm Power','Pattern Energy','Clearway Energy',
  'Avangrid Inc','OGE Energy','Portland General','IDACORP Inc','Otter Tail Corp',
  'Black Hills Corp','NorthWestern Energy','Unitil Corp','Spire Inc','Southwest Gas',
  'New Jersey Resources','Atmos Energy','ONE Gas Inc','National Fuel Gas','Chesapeake Utilities',
  // Real estate small
  'Hannon Armstrong','IQHQ Inc','Alexandria Real Estate','Kilroy Realty','Cousins Properties',
  'Highwoods Properties','Piedmont Office','Mack-Cali Realty','Vornado Realty','SL Green Realty',
  'Boston Properties','Paramount Group','Hudson Pacific','Columbia Property','Easterly Government',
  'Innovative Industrial','Power REIT','Uniti Group','CatchMark Timber','Rayonier Inc',
  // Emerging market small
  'Adani Enterprises','Adani Ports','Vedanta Ltd','Hindalco Industries','Grasim Industries',
  'UltraTech Cement','Shree Cement','ACC Ltd','Ambuja Cements','Dalmia Bharat',
  'Cipla Ltd','Lupin Ltd','Aurobindo Pharma','Biocon Ltd','Gland Pharma',
  'MercadoLibre','Grupo Bimbo','Femsa','America Movil','Cemex SAB',
  'Samsung SDI','LG Energy Solution','SK Innovation','POSCO Holdings','Hyundai Steel',
  'Nidec Corporation','Murata Manufacturing','Tokyo Electron','Renesas Electronics','Rohm Co',
  'Ping An Bank','China Merchants Bank','Bank of China','Agricultural Bank China','China Construction Bank',
  'Kweichow Moutai','Midea Group','CATL','Wuxi Biologics','Meituan',
  'Grab Holdings','GoTo Group','Bukalapak','Tokopedia (GoTo)','Sea Ltd',
  // Extra global names to reach 500
  'SThree plc','Renishaw plc','Spirax-Sarco','Halma plc','Spectris plc',
  'IMI plc','Rotork plc','Weir Group','Bodycote plc','Morgan Advanced',
  'Johnson Matthey','Victrex plc','Elementis plc','Synthomer plc','Hunting plc',
  'Petrofac Ltd','Wood Group','Harbour Energy','Energean plc','Tullow Oil',
  'Cairn Energy','Premier Oil','Neptune Energy','Ithaca Energy','EnQuest plc',
  'Centrica plc','Drax Group','Ceres Power','ITM Power','AFC Energy',
  'Greencoat UK Wind','Foresight Solar','NextEnergy Solar','Bluefield Solar','JLEN Environmental',
  'Gresham House Energy','Octopus Renewables','US Solar Fund','VH Global Energy','Harmony Energy',
  'Ashmore Group','Man Group','Abrdn plc','Legal & General','Aviva plc',
  'Prudential plc','Phoenix Group','M&G plc','Schroders plc','Hargreaves Lansdown',
  'London Stock Exchange','ICE (Intercontinental)','CME Group','Cboe Global','Nasdaq Inc',
  'S&P Global','Moody Corporation','MSCI Inc','FactSet Research','Verisk Analytics',
  'Wolters Kluwer','RELX plc','Experian plc','Bureau Veritas','SGS SA',
  'Eurofins Scientific','Intertek Group','TUV SUD','Dun & Bradstreet','Fair Isaac Corp',
];

for (let i = 0; i < 500; i++) {
  const seed = 2000 + i;
  const nm = SMALL_NAMES[i % SMALL_NAMES.length];
  const cIdx = i % COUNTRIES_30.length;
  const sIdx = i % SECTORS.length;
  const w = round4(rng(0.001, 0.04, seed));
  const price = round2(rng(3, 350, seed + 1));
  const mktVal = round2(AUM * equityWeight * (w / 100));
  const shares = Math.round(mktVal / price);
  const costBasis = round2(price * rng(0.5, 1.3, seed + 2));
  EQUITY_HOLDINGS.push({
    holdingId: `EQ-${String(301 + i).padStart(4, '0')}`,
    assetClass: 'Listed Equity',
    companyId: null,
    name: nm,
    ticker: nm.substring(0, 4).toUpperCase().replace(/\s/g, ''),
    isin: `XX${String(seed).padStart(10, '0')}`,
    country: COUNTRIES_30[cIdx],
    countryName: COUNTRY_NAMES[COUNTRIES_30[cIdx]] || COUNTRIES_30[cIdx],
    sector: SECTORS[sIdx],
    subSector: 'Small/Mid Cap',
    shares,
    weightPct: w,
    costBasis,
    currentPrice: price,
    marketValue: mktVal,
    unrealisedPnl: round2((price - costBasis) * shares),
    pcafClass: 1,
    pcafDqs: rngInt(2, 5, seed + 3),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. CORPORATE BONDS — 400 holdings
// ══════════════════════════════════════════════════════════════════════════════
const bondWeight = 0.22; // 22% of AUM = $11Bn
const CORPORATE_BOND_HOLDINGS = [];

// 250 investment grade
for (let i = 0; i < 250; i++) {
  const seed = 3000 + i;
  const c = MASTER_COMPANIES[i % 300];
  const matYr = 2025 + rngInt(1, 20, seed);
  const cpn = round2(rng(1.5, 6.5, seed + 1));
  const ytm = round2(cpn + rng(-0.5, 1.5, seed + 2));
  const spread = rngInt(30, 250, seed + 3);
  const fv = rngInt(5, 100, seed + 4) * 1_000_000;
  const isGreen = sr(seed + 5) > 0.8;
  CORPORATE_BOND_HOLDINGS.push({
    holdingId: `CB-IG-${String(i + 1).padStart(4, '0')}`,
    assetClass: 'Corporate Bonds',
    subClass: 'Investment Grade',
    companyId: c.id,
    issuer: c.name,
    coupon: cpn,
    maturity: `${matYr}-${String(rngInt(1, 12, seed + 6)).padStart(2, '0')}-15`,
    rating: pick(IG_RATINGS, seed + 7),
    ratingAgency: pick(['S&P', 'Moody\'s', 'Fitch'], seed + 8),
    outstanding: fv * rngInt(2, 10, seed + 9),
    faceValue: fv,
    yieldToMaturity: ytm,
    spread,
    greenBondFlag: isGreen,
    country: c.country,
    sector: c.sector,
    currency: pick(['USD', 'EUR', 'GBP', 'JPY'], seed + 10),
    weightPct: round4(rng(0.01, 0.12, seed + 11)),
    marketValue: round2(fv * rng(0.92, 1.08, seed + 12)),
    pcafClass: 2,
    pcafDqs: rngInt(1, 4, seed + 13),
  });
}

// 150 high yield
for (let i = 0; i < 150; i++) {
  const seed = 4000 + i;
  const c = MASTER_COMPANIES[(i + 100) % 300];
  const matYr = 2025 + rngInt(1, 10, seed);
  const cpn = round2(rng(5.0, 11.0, seed + 1));
  const ytm = round2(cpn + rng(0.5, 3.0, seed + 2));
  const spread = rngInt(300, 900, seed + 3);
  const fv = rngInt(2, 50, seed + 4) * 1_000_000;
  CORPORATE_BOND_HOLDINGS.push({
    holdingId: `CB-HY-${String(i + 1).padStart(4, '0')}`,
    assetClass: 'Corporate Bonds',
    subClass: 'High Yield',
    companyId: c.id,
    issuer: c.name,
    coupon: cpn,
    maturity: `${matYr}-${String(rngInt(1, 12, seed + 5)).padStart(2, '0')}-15`,
    rating: pick(HY_RATINGS, seed + 6),
    ratingAgency: pick(['S&P', 'Moody\'s', 'Fitch'], seed + 7),
    outstanding: fv * rngInt(2, 8, seed + 8),
    faceValue: fv,
    yieldToMaturity: ytm,
    spread,
    greenBondFlag: sr(seed + 9) > 0.9,
    country: c.country,
    sector: c.sector,
    currency: pick(['USD', 'EUR', 'GBP'], seed + 10),
    weightPct: round4(rng(0.005, 0.06, seed + 11)),
    marketValue: round2(fv * rng(0.78, 1.02, seed + 12)),
    pcafClass: 2,
    pcafDqs: rngInt(2, 5, seed + 13),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. SOVEREIGN BONDS — 150 holdings (30 countries x 5 maturities)
// ══════════════════════════════════════════════════════════════════════════════
const sovWeight = 0.12; // 12% = $6Bn
const SOVEREIGN_BOND_HOLDINGS = [];
const SOV_RATINGS_MAP = {US:'AAA',GB:'AA',DE:'AAA',FR:'AA',JP:'A+',AU:'AAA',CA:'AAA',IT:'BBB',ES:'A',NL:'AAA',SE:'AAA',NO:'AAA',DK:'AAA',BE:'AA-',FI:'AA+',IE:'AA-',BR:'BB',IN:'BBB-',CN:'A+',KR:'AA',ZA:'BB-',MX:'BBB',CO:'BB+',CL:'A',SG:'AAA',NZ:'AA+',AT:'AA+',PT:'A-',IL:'A+',PL:'A-',CZ:'AA-'};
const NDC_TARGETS = {US:'-50% by 2030',GB:'-68% by 2030',DE:'-65% by 2030',FR:'-40% by 2030',JP:'-46% by 2030',AU:'-43% by 2030',CA:'-40% by 2030',IT:'-55% by 2030',ES:'-23% by 2030',NL:'-55% by 2030',SE:'Net zero 2045',NO:'-55% by 2030',DK:'-70% by 2030',BE:'-47% by 2030',FI:'Carbon neutral 2035',IE:'-51% by 2030',BR:'-50% by 2030',IN:'-45% intensity by 2030',CN:'Peak before 2030',KR:'-40% by 2030',ZA:'-32% by 2030',MX:'-35% by 2030',CO:'-51% by 2030',CL:'Carbon neutral 2050',SG:'Peak ~65MtCO2e by 2030',NZ:'-50% by 2030',AT:'-48% by 2030',PT:'-55% by 2030',IL:'-27% by 2030',PL:'-30% by 2030',CZ:'-55% by 2030'};

for (let ci = 0; ci < SOV_COUNTRIES.length; ci++) {
  const cc = SOV_COUNTRIES[ci];
  for (let mi = 0; mi < 5; mi++) {
    const seed = 5000 + ci * 5 + mi;
    const tenor = MATURITIES_SOV[mi];
    const yrs = parseInt(tenor);
    const cpn = round2(rng(0.5, 6.5, seed));
    const fv = rngInt(10, 80, seed + 1) * 1_000_000;
    SOVEREIGN_BOND_HOLDINGS.push({
      holdingId: `SOV-${cc}-${tenor}`,
      assetClass: 'Sovereign Bonds',
      country: cc,
      countryName: COUNTRY_NAMES[cc] || cc,
      maturity: `${2024 + yrs}-${String(rngInt(1, 12, seed + 2)).padStart(2, '0')}-01`,
      tenor,
      coupon: cpn,
      outstanding: fv * rngInt(5, 50, seed + 3),
      faceValue: fv,
      yieldToMaturity: round2(cpn + rng(-0.3, 1.0, seed + 4)),
      creditRating: SOV_RATINGS_MAP[cc] || 'A',
      climateScore: round2(rng(20, 90, seed + 5)),
      ndcTarget: NDC_TARGETS[cc] || 'TBD',
      weightPct: round4(rng(0.01, 0.15, seed + 6)),
      marketValue: round2(fv * rng(0.90, 1.10, seed + 7)),
      currency: cc === 'US' ? 'USD' : pick(['USD', 'EUR', 'Local'], seed + 8),
      pcafClass: 3,
      pcafDqs: rngInt(1, 3, seed + 9),
    });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. PROJECT FINANCE — 100 holdings
// ══════════════════════════════════════════════════════════════════════════════
const PF_PROJECTS = [];
const PF_SECTORS = [
  { sector: 'Renewable Energy', count: 40, techs: ['Solar PV','Onshore Wind','Offshore Wind','Battery Storage','Green Hydrogen','Geothermal','Small Hydro','Biomass'] },
  { sector: 'Infrastructure', count: 25, techs: ['Toll Road','Airport Terminal','Port Expansion','Rail Link','Water Treatment','Desalination','EV Charging Network'] },
  { sector: 'Real Estate Development', count: 20, techs: ['Mixed-Use','Green Office','Sustainable Housing','Transit-Oriented','Brownfield Redevelopment'] },
  { sector: 'Transport', count: 15, techs: ['Electric Bus Fleet','Metro Extension','High-Speed Rail','Green Shipping','Airport Expansion'] },
];
const PF_SPONSORS = ['Brookfield','Macquarie','BlackRock Infra','KKR Infra','GIP','EDF Renewables','Engie','Enel Green Power','Orsted','NextEra Partners','AES Corp','Masdar','ACWA Power','TAQA','Sembcorp','TotalEnergies Renewables','Iberdrola','EDP Renewables','Acciona Energia','Statkraft'];

let pfIdx = 0;
PF_SECTORS.forEach(({ sector, count, techs }) => {
  for (let i = 0; i < count; i++) {
    const seed = 6000 + pfIdx;
    const cc = pick(COUNTRIES_30, seed);
    const tech = pick(techs, seed + 1);
    const loanAmt = rngInt(20, 500, seed + 2) * 1_000_000;
    PF_PROJECTS.push({
      holdingId: `PF-${String(pfIdx + 1).padStart(4, '0')}`,
      assetClass: 'Project Finance',
      projectName: `${COUNTRY_NAMES[cc] || cc} ${tech} ${rngInt(1, 50, seed + 3)}`,
      sector,
      technology: tech,
      country: cc,
      countryName: COUNTRY_NAMES[cc] || cc,
      loanAmount: loanAmt,
      tenor: rngInt(5, 25, seed + 4),
      sponsor: pick(PF_SPONSORS, seed + 5),
      co2Avoided: sector === 'Renewable Energy' ? rngInt(10000, 500000, seed + 6) : rngInt(1000, 50000, seed + 6),
      capacityMW: sector === 'Renewable Energy' ? rngInt(20, 800, seed + 7) : null,
      weightPct: round4(rng(0.01, 0.08, seed + 8)),
      marketValue: round2(loanAmt * rng(0.90, 1.05, seed + 9)),
      greenTaxonomyAligned: sr(seed + 10) > 0.4,
      pcafClass: 4,
      pcafDqs: rngInt(2, 5, seed + 11),
    });
    pfIdx++;
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. COMMERCIAL REAL ESTATE — 150 holdings
// ══════════════════════════════════════════════════════════════════════════════
const CRE_HOLDINGS = [];
const CRE_COUNTS = { Office: 50, Retail: 30, Industrial: 25, Residential: 25, Logistics: 20 };
let creIdx = 0;
Object.entries(CRE_COUNTS).forEach(([type, count]) => {
  for (let i = 0; i < count; i++) {
    const seed = 7000 + creIdx;
    const cc = pick(COUNTRIES_30, seed);
    const city = pick(CITIES, seed + 1);
    const sqm = rngInt(2000, 80000, seed + 2);
    const epc = pick(EPC_RATINGS, seed + 3);
    const valM = rngInt(10, 500, seed + 4);
    const ltv = round2(rng(0.30, 0.75, seed + 5));
    CRE_HOLDINGS.push({
      holdingId: `CRE-${String(creIdx + 1).padStart(4, '0')}`,
      assetClass: 'Commercial Real Estate',
      propertyName: `${city} ${type} ${pick(['Tower','Park','Centre','Plaza','Hub','Campus','Estate'], seed + 6)} ${rngInt(1, 99, seed + 7)}`,
      type,
      city,
      country: cc,
      countryName: COUNTRY_NAMES[cc] || cc,
      sqm,
      epcRating: epc,
      energyIntensity: round2(rng(50, 400, seed + 8)),
      crremPathway: pick(['1.5C Aligned', '2C Aligned', 'Stranded Risk', 'On Track'], seed + 9),
      valuationM: valM,
      ltv,
      debtOutstanding: round2(valM * ltv),
      occupancyPct: round2(rng(60, 99, seed + 10)),
      gresbScore: rngInt(40, 95, seed + 11),
      weightPct: round4(rng(0.01, 0.08, seed + 12)),
      marketValue: valM * 1_000_000,
      nabers: type === 'Office' ? round2(rng(3.0, 6.0, seed + 13)) : null,
      pcafClass: 5,
      pcafDqs: rngInt(2, 5, seed + 14),
    });
    creIdx++;
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. MORTGAGES — 100 holdings
// ══════════════════════════════════════════════════════════════════════════════
const MORTGAGE_HOLDINGS = [];
const MORTGAGE_COUNTRIES = ['US','GB','DE','FR','AU','CA','NL','SE','NO','DK'];
for (let i = 0; i < 100; i++) {
  const seed = 8000 + i;
  const cc = MORTGAGE_COUNTRIES[i % 10];
  const epc = pick(EPC_RATINGS, seed);
  const loanAmt = rngInt(100000, 2000000, seed + 1);
  const ltv = round2(rng(0.40, 0.90, seed + 2));
  MORTGAGE_HOLDINGS.push({
    holdingId: `MG-${String(i + 1).padStart(4, '0')}`,
    assetClass: 'Mortgages',
    loanId: `MG-${cc}-${String(seed).padStart(8, '0')}`,
    country: cc,
    countryName: COUNTRY_NAMES[cc] || cc,
    propertyType: pick(['Detached','Semi-Detached','Apartment','Terraced','Townhouse'], seed + 3),
    epcRating: epc,
    loanAmount: loanAmt,
    ltv,
    propertyValue: round2(loanAmt / ltv),
    energyIntensity: round2(rng(40, 350, seed + 4)),
    meesCompliant: epc <= 'E',
    interestRate: round2(rng(2.0, 7.0, seed + 5)),
    remainingTermYrs: rngInt(5, 30, seed + 6),
    weightPct: round4(rng(0.002, 0.02, seed + 7)),
    marketValue: round2(loanAmt * rng(0.95, 1.02, seed + 8)),
    pcafClass: 5,
    pcafDqs: rngInt(3, 5, seed + 9),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// 7. PRIVATE EQUITY — 80 holdings
// ══════════════════════════════════════════════════════════════════════════════
const PE_HOLDINGS = [];
const PE_STRATEGIES = { Buyout: 30, Growth: 25, Venture: 25 };
const PE_FUND_NAMES = [
  'Alpine Growth Partners','Meridian Capital','Summit Equity','Horizon Partners','Elevation Fund',
  'Vertex Ventures','Pinnacle Capital','Catalyst Growth','Atlas Equity','Redwood Partners',
  'Pacific Growth','Nordic Ventures','Sequoia Heritage','GreenBridge Capital','Impact Alpha Fund',
  'Terra Climate Ventures','Clean Growth Capital','Transition Partners','Sustain Equity','Carbon Neutral Fund',
  'Blockchain Ventures','DeepTech Capital','AI Growth Fund','Robotics Partners','BioVenture Capital',
  'FinTech Equity','InsurTech Growth','PropTech Partners','EdTech Ventures','HealthTech Capital',
  'Africa Growth Fund','LatAm Equity','ASEAN Partners','India Growth Cap','China Tech Fund',
  'MENA Ventures','CEE Growth Fund','Nordic Impact','Iberian Capital','Swiss Innovation Fund',
];
let peIdx = 0;
Object.entries(PE_STRATEGIES).forEach(([strategy, count]) => {
  for (let i = 0; i < count; i++) {
    const seed = 9000 + peIdx;
    const vintage = 2015 + rngInt(0, 10, seed);
    const commitment = rngInt(20, 300, seed + 1) * 1_000_000;
    const nav = round2(commitment * rng(0.6, 2.5, seed + 2));
    PE_HOLDINGS.push({
      holdingId: `PE-${String(peIdx + 1).padStart(4, '0')}`,
      assetClass: 'Private Equity',
      fundName: `${PE_FUND_NAMES[peIdx % PE_FUND_NAMES.length]} ${pick(['I','II','III','IV','V','VI'], seed + 3)}`,
      vintage,
      strategy,
      nav,
      commitment,
      calledPct: round2(rng(0.40, 1.0, seed + 4)),
      distributionsPct: round2(rng(0.0, 1.5, seed + 5)),
      irr: round2(rng(strategy === 'Venture' ? -5 : 5, strategy === 'Venture' ? 40 : 25, seed + 6)),
      tvpi: round2(rng(0.8, 3.0, seed + 7)),
      esgScore: rngInt(40, 95, seed + 8),
      carbonIntensity: round2(rng(20, 600, seed + 9)),
      ilpaCompliant: sr(seed + 10) > 0.3,
      sfdrClassification: pick(['Article 6', 'Article 8', 'Article 9'], seed + 11),
      weightPct: round4(rng(0.01, 0.06, seed + 12)),
      marketValue: nav,
      pcafClass: 6,
      pcafDqs: rngInt(3, 5, seed + 13),
    });
    peIdx++;
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. PRIVATE CREDIT — 60 holdings
// ══════════════════════════════════════════════════════════════════════════════
const PC_HOLDINGS = [];
const PC_TYPES = ['Direct Lending','Mezzanine','Distressed','Unitranche','ABL'];
const PC_BORROWERS = [
  'NovaTech Solutions','GreenLeaf Industries','Atlas Manufacturing','Pinnacle Healthcare','Summit Logistics',
  'Meridian Software','Cascade Materials','Vertex Renewables','Alpine Infrastructure','Harbor Marine',
  'Evergreen Agriculture','BlueSky Aviation','Crossroads Retail','Quantum Biotech','Phoenix Real Estate',
  'Ironclad Steel','Horizon Media','Spectrum Telecom','Granite Construction','Sapphire Electronics',
  'Riverdale Foods','Ascend Education','Cobalt Mining','Pacific Timber','Nordic Shipping',
  'Zenith Automotive','Sterling Financial','Prism Energy','Keystone Health','Anchor Maritime',
  'Apex Manufacturing','Coral Hospitality','Diamond Logistics','Falcon Aviation','Genesis Pharma',
  'Highland Resources','Iris Technology','Jupiter Finance','Kensington Properties','Lighthouse Energy',
  'Magnus Infrastructure','Noble Agriculture','Orion Chemicals','Paragon Services','Quartz Minerals',
  'Radiant Power','Solaris Clean Energy','Titan Construction','Unity Healthcare','Voyager Transport',
  'Wildflower Organics','Xenon Analytics','York Capital','Zephyr Renewables','Artemis Biotech',
  'Beacon Logistics','Cascade Water','Delta Infrastructure','Eclipse Mining',
];
for (let i = 0; i < 60; i++) {
  const seed = 10000 + i;
  const amt = rngInt(10, 200, seed) * 1_000_000;
  const matYr = 2025 + rngInt(1, 7, seed + 1);
  PC_HOLDINGS.push({
    holdingId: `PC-${String(i + 1).padStart(4, '0')}`,
    assetClass: 'Private Credit',
    borrower: PC_BORROWERS[i % PC_BORROWERS.length],
    facility: pick(PC_TYPES, seed + 2),
    amount: amt,
    rate: `SOFR + ${rngInt(300, 800, seed + 3)}bps`,
    allInRate: round2(rng(7.0, 14.0, seed + 4)),
    maturity: `${matYr}-${String(rngInt(1, 12, seed + 5)).padStart(2, '0')}-01`,
    sector: pick(SECTORS, seed + 6),
    esgRatchet: sr(seed + 7) > 0.5,
    esgRatchetBps: sr(seed + 7) > 0.5 ? rngInt(10, 50, seed + 8) : 0,
    covenantStatus: pick(['Compliant', 'Compliant', 'Compliant', 'Watch', 'Breach'], seed + 9),
    country: pick(COUNTRIES_30, seed + 10),
    weightPct: round4(rng(0.005, 0.04, seed + 11)),
    marketValue: round2(amt * rng(0.90, 1.05, seed + 12)),
    pcafClass: 2,
    pcafDqs: rngInt(3, 5, seed + 13),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// 9. INFRASTRUCTURE — 40 holdings
// ══════════════════════════════════════════════════════════════════════════════
const INFRA_HOLDINGS = [];
const INFRA_SECTORS = [
  { type: 'Energy Infra', count: 15 },
  { type: 'Transport', count: 10 },
  { type: 'Social', count: 10 },
  { type: 'Digital', count: 5 },
];
const INFRA_NAMES_BASE = ['Pacific','Atlantic','Northern','Southern','Central','Eastern','Western','Highland','Coastal','Valley','Metro','Regional','National','Continental','Global'];
let infraIdx = 0;
INFRA_SECTORS.forEach(({ type, count }) => {
  for (let i = 0; i < count; i++) {
    const seed = 11000 + infraIdx;
    const cc = pick(COUNTRIES_30, seed);
    const equity = rngInt(30, 500, seed + 1) * 1_000_000;
    const debt = rngInt(50, 800, seed + 2) * 1_000_000;
    INFRA_HOLDINGS.push({
      holdingId: `INF-${String(infraIdx + 1).padStart(4, '0')}`,
      assetClass: 'Infrastructure',
      assetName: `${pick(INFRA_NAMES_BASE, seed + 3)} ${pick(INFRA_TYPES, seed + 4)}`,
      type,
      country: cc,
      countryName: COUNTRY_NAMES[cc] || cc,
      equity,
      debt,
      totalValue: equity + debt,
      gresbScore: rngInt(50, 98, seed + 5),
      irrTarget: round2(rng(6, 18, seed + 6)),
      irrActual: round2(rng(4, 20, seed + 7)),
      co2Scope1: rngInt(500, 50000, seed + 8),
      co2Scope2: rngInt(100, 10000, seed + 9),
      concessionYears: rngInt(15, 50, seed + 10),
      greenTaxonomyAligned: sr(seed + 11) > 0.4,
      weightPct: round4(rng(0.01, 0.06, seed + 12)),
      marketValue: equity,
      pcafClass: 4,
      pcafDqs: rngInt(2, 5, seed + 13),
    });
    infraIdx++;
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. SHIPPING / MARITIME — 30 holdings
// ══════════════════════════════════════════════════════════════════════════════
const SHIPPING_HOLDINGS = [];
const SHIP_NAMES = [
  'MV Pacific Voyager','MV Atlantic Pioneer','MV Nordic Star','MV Asian Spirit','MV Global Horizon',
  'MV Cape Hope','MV Silver Dawn','MV Ocean Fortune','MV Crystal Bay','MV Emerald Sea',
  'MV Coral Breeze','MV Iron Monarch','MV Golden Harvest','MV Blue Titan','MV White Pearl',
  'MT Crude Express','MT Eagle Tanker','MT Neptune','MT Poseidon','MT Triton',
  'LNG Spirit of Qatar','LNG Methane Princess','LNG Arctic Carrier','LNG Coral Energy','LNG Pacific Sun',
  'MV Chemical Star','MV RoRo Express','MV CargoMaster','MV TradeLine','MV FreightKing',
];
const SHIP_OWNERS = ['Maersk','MSC','CMA CGM','COSCO','Hapag-Lloyd','Evergreen','ONE','Yang Ming','ZIM','K-Line','MOL','NYK','Stena Bulk','Torm','Teekay','Frontline','Euronav','Scorpio Tankers','Flex LNG','Gaslog'];
for (let i = 0; i < 30; i++) {
  const seed = 12000 + i;
  const vType = VESSEL_TYPES[i % 6];
  const dwt = rngInt(20000, 320000, seed);
  const exposure = rngInt(20, 200, seed + 1) * 1_000_000;
  SHIPPING_HOLDINGS.push({
    holdingId: `SH-${String(i + 1).padStart(4, '0')}`,
    assetClass: 'Shipping',
    vesselName: SHIP_NAMES[i % 30],
    imoNumber: `IMO${9000000 + rngInt(0, 999999, seed + 2)}`,
    type: vType,
    dwt,
    owner: pick(SHIP_OWNERS, seed + 3),
    ciiGrade: pick(CII_GRADES, seed + 4),
    eexiCompliant: sr(seed + 5) > 0.4,
    fuelType: pick(FUEL_TYPES, seed + 6),
    aer: round2(rng(2.0, 15.0, seed + 7)),
    eexi: round2(rng(1.0, 8.0, seed + 8)),
    poseidonAligned: sr(seed + 9) > 0.5,
    buildYear: rngInt(2005, 2024, seed + 10),
    flag: pick(['Panama','Liberia','Marshall Islands','Singapore','Malta','Bahamas','Hong Kong'], seed + 11),
    exposure,
    weightPct: round4(rng(0.005, 0.03, seed + 12)),
    marketValue: exposure,
    pcafClass: 4,
    pcafDqs: rngInt(3, 5, seed + 13),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// 11. AVIATION — 20 holdings
// ══════════════════════════════════════════════════════════════════════════════
const AVIATION_HOLDINGS = [];
const AIRLINES = [
  { name:'Delta Air Lines', iata:'DL', country:'US' },
  { name:'United Airlines', iata:'UA', country:'US' },
  { name:'American Airlines', iata:'AA', country:'US' },
  { name:'Lufthansa', iata:'LH', country:'DE' },
  { name:'British Airways', iata:'BA', country:'GB' },
  { name:'Air France', iata:'AF', country:'FR' },
  { name:'Singapore Airlines', iata:'SQ', country:'SG' },
  { name:'Cathay Pacific', iata:'CX', country:'HK' },
  { name:'Qantas Airways', iata:'QF', country:'AU' },
  { name:'Emirates', iata:'EK', country:'AE' },
  { name:'ANA Holdings', iata:'NH', country:'JP' },
  { name:'KLM Royal Dutch', iata:'KL', country:'NL' },
  { name:'Ryanair', iata:'FR', country:'IE' },
  { name:'Southwest Airlines', iata:'WN', country:'US' },
  { name:'LATAM Airlines', iata:'LA', country:'CL' },
  { name:'Turkish Airlines', iata:'TK', country:'TR' },
  { name:'Etihad Airways', iata:'EY', country:'AE' },
  { name:'Air Canada', iata:'AC', country:'CA' },
  { name:'IndiGo Airlines', iata:'6E', country:'IN' },
  { name:'Korean Air', iata:'KE', country:'KR' },
];
for (let i = 0; i < 20; i++) {
  const seed = 13000 + i;
  const al = AIRLINES[i];
  const exp = rngInt(30, 300, seed) * 1_000_000;
  AVIATION_HOLDINGS.push({
    holdingId: `AV-${String(i + 1).padStart(4, '0')}`,
    assetClass: 'Aviation',
    airline: al.name,
    iataCode: al.iata,
    country: al.country,
    type: pick(['Corporate Bond', 'EETC', 'Aircraft Lease', 'Secured Loan'], seed + 1),
    exposure: exp,
    corsiaPhase: pick(['Pilot Phase', 'Phase 1', 'Phase 2'], seed + 2),
    safPct: round2(rng(0.5, 10.0, seed + 3)),
    fleetAge: round2(rng(5, 18, seed + 4)),
    fleetSize: rngInt(50, 800, seed + 5),
    co2PerRPK: round2(rng(60, 120, seed + 6)),
    fuelEfficiency: round2(rng(2.5, 5.0, seed + 7)),
    weightPct: round4(rng(0.005, 0.03, seed + 8)),
    marketValue: exp,
    pcafClass: 4,
    pcafDqs: rngInt(3, 5, seed + 9),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// 12. CARBON CREDITS — 30 holdings
// ══════════════════════════════════════════════════════════════════════════════
const CARBON_CREDIT_HOLDINGS = [];
const CC_REGISTRIES = ['Verra (VCS)', 'Gold Standard', 'ACR', 'CAR'];
const CC_TYPES = ['Avoidance - REDD+', 'Avoidance - Renewable Energy', 'Removal - Afforestation', 'Removal - Direct Air Capture', 'Removal - Biochar', 'Avoidance - Cookstoves', 'Removal - Enhanced Weathering', 'Avoidance - Methane Capture'];
const CC_VERIFIERS = ['SCS Global','Aster Global','TUV SUD','DNV','SGS','ERM CVS','Ruby Canyon','AENOR'];
const CC_PROJECTS = [
  'Amazonia Forest Protection','Kalimantan Peatland','Kenya Cookstoves','India Wind Portfolio',
  'Congo Basin REDD+','Guatemala Reforestation','Vietnam Mangrove','Chile Afforestation',
  'US DAC Hub Alpha','Iceland Carbfix','Australia Biochar','Canada Forest Mgmt',
  'Ethiopia Cleanwater','Nepal Solar Mini-Grid','Indonesia Rice Paddy','Brazil Cerrado REDD+',
  'Peru Rainforest','Tanzania Cookstoves','Uganda Reforestation','Cambodia Watershed',
  'Nordic Ocean Alkalinity','Sahel Great Green Wall','Pacific Island Mangrove','Morocco Solar Avoidance',
  'Philippines Geothermal','Costa Rica Forest','Papua New Guinea REDD+','Gabon Tropical Forest',
  'Mexico Wind Avoidance','Argentina Grassland',
];
for (let i = 0; i < 30; i++) {
  const seed = 14000 + i;
  const vol = rngInt(5000, 200000, seed);
  const price = round2(rng(5, 120, seed + 1));
  CARBON_CREDIT_HOLDINGS.push({
    holdingId: `CC-${String(i + 1).padStart(4, '0')}`,
    assetClass: 'Carbon Credits',
    projectName: CC_PROJECTS[i],
    registry: pick(CC_REGISTRIES, seed + 2),
    vintage: rngInt(2019, 2026, seed + 3),
    type: pick(CC_TYPES, seed + 4),
    volume_tCO2e: vol,
    pricePerTonne: price,
    totalValue: round2(vol * price),
    status: pick(['Active', 'Active', 'Retired', 'Pending Issuance'], seed + 5),
    verificationBody: pick(CC_VERIFIERS, seed + 6),
    country: pick(COUNTRIES_30, seed + 7),
    correspondingAdjustment: sr(seed + 8) > 0.5,
    icvcmCcpEligible: sr(seed + 9) > 0.4,
    weightPct: round4(rng(0.001, 0.01, seed + 10)),
    marketValue: round2(vol * price),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// 13. SAF OFFTAKES — 10 holdings
// ══════════════════════════════════════════════════════════════════════════════
const SAF_HOLDINGS = [];
const SAF_PRODUCERS = ['Neste','World Energy','Gevo','Montana Renewables','LanzaJet','SkyNRG','TotalEnergies SAF','Topsoe','Velocys','SynKero'];
const SAF_PATHWAYS = ['HEFA','Fischer-Tropsch','Alcohol-to-Jet','Power-to-Liquid','Gasification-FT'];
const SAF_AIRLINES = ['Delta','United','JetBlue','Lufthansa','BA','AF-KLM','SIA','Qantas','ANA','Emirates'];
for (let i = 0; i < 10; i++) {
  const seed = 15000 + i;
  const vol = rngInt(10000, 200000, seed);
  const price = round2(rng(1.2, 4.5, seed + 1));
  SAF_HOLDINGS.push({
    holdingId: `SAF-${String(i + 1).padStart(4, '0')}`,
    assetClass: 'SAF Offtakes',
    producer: SAF_PRODUCERS[i],
    pathway: pick(SAF_PATHWAYS, seed + 2),
    volume_Mt: vol,
    pricePerLitre: price,
    totalContractValue: round2(vol * price * 1000),
    duration: rngInt(3, 15, seed + 3),
    airline: SAF_AIRLINES[i],
    co2ReductionPct: round2(rng(50, 90, seed + 4)),
    rsb_iscc_certified: sr(seed + 5) > 0.4,
    deliveryStart: `${2025 + rngInt(0, 3, seed + 6)}-01-01`,
    weightPct: round4(rng(0.001, 0.005, seed + 7)),
    marketValue: round2(vol * price * 200),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// 14. GREEN BONDS — 30 holdings
// ══════════════════════════════════════════════════════════════════════════════
const GREEN_BOND_HOLDINGS = [];
const GB_ISSUERS = [
  { issuer:'Republic of Germany', type:'Sovereign' },
  { issuer:'Republic of France', type:'Sovereign' },
  { issuer:'Kingdom of Netherlands', type:'Sovereign' },
  { issuer:'Republic of Italy', type:'Sovereign' },
  { issuer:'Kingdom of Belgium', type:'Sovereign' },
  { issuer:'Republic of Ireland', type:'Sovereign' },
  { issuer:'Government of UK', type:'Sovereign' },
  { issuer:'Republic of Chile', type:'Sovereign' },
  { issuer:'Republic of Indonesia', type:'Sovereign' },
  { issuer:'Government of Japan', type:'Sovereign' },
  { issuer:'EIB (European Investment Bank)', type:'Supranational' },
  { issuer:'World Bank (IBRD)', type:'Supranational' },
  { issuer:'KfW', type:'Agency' },
  { issuer:'Apple Inc', type:'Corporate' },
  { issuer:'Toyota Motor', type:'Corporate' },
  { issuer:'Iberdrola SA', type:'Corporate' },
  { issuer:'Orsted A/S', type:'Corporate' },
  { issuer:'Engie SA', type:'Corporate' },
  { issuer:'Enel SpA', type:'Corporate' },
  { issuer:'Verizon Communications', type:'Corporate' },
  { issuer:'Bank of America', type:'Corporate' },
  { issuer:'HSBC Holdings', type:'Corporate' },
  { issuer:'BNP Paribas', type:'Corporate' },
  { issuer:'Societe Generale', type:'Corporate' },
  { issuer:'Prologis Inc', type:'Corporate' },
  { issuer:'Digital Realty', type:'Corporate' },
  { issuer:'NextEra Energy', type:'Corporate' },
  { issuer:'SSE plc', type:'Corporate' },
  { issuer:'National Grid', type:'Corporate' },
  { issuer:'CLP Holdings', type:'Corporate' },
];
const USE_OF_PROCEEDS = ['Renewable Energy','Energy Efficiency','Clean Transport','Green Buildings','Sustainable Water','Biodiversity','Climate Adaptation','Circular Economy'];
for (let i = 0; i < 30; i++) {
  const seed = 16000 + i;
  const gb = GB_ISSUERS[i];
  const amt = rngInt(20, 500, seed) * 1_000_000;
  const cpn = round2(rng(0.5, 5.5, seed + 1));
  const matYr = 2025 + rngInt(2, 20, seed + 2);
  GREEN_BOND_HOLDINGS.push({
    holdingId: `GB-${String(i + 1).padStart(4, '0')}`,
    assetClass: 'Green Bonds',
    issuer: gb.issuer,
    type: gb.type,
    amount: amt,
    coupon: cpn,
    maturity: `${matYr}-${String(rngInt(1, 12, seed + 3)).padStart(2, '0')}-15`,
    useOfProceeds: pick(USE_OF_PROCEEDS, seed + 4),
    icmaAligned: true,
    secondPartyOpinion: pick(['Sustainalytics', 'Vigeo Eiris', 'ISS ESG', 'CICERO', 'S&P SPO'], seed + 5),
    euTaxonomyAligned: gb.type === 'Sovereign' ? sr(seed + 6) > 0.3 : sr(seed + 6) > 0.5,
    cbiCertified: sr(seed + 7) > 0.4,
    greenium: round2(rng(-0.10, 0.15, seed + 8)),
    weightPct: round4(rng(0.01, 0.08, seed + 9)),
    marketValue: round2(amt * rng(0.94, 1.06, seed + 10)),
    rating: pick(IG_RATINGS, seed + 11),
  });
}


// ══════════════════════════════════════════════════════════════════════════════
// AGGREGATION & CONVENIENCE EXPORTS
// ══════════════════════════════════════════════════════════════════════════════
const ALL_HOLDINGS = [
  ...EQUITY_HOLDINGS,
  ...CORPORATE_BOND_HOLDINGS,
  ...SOVEREIGN_BOND_HOLDINGS,
  ...PF_PROJECTS,
  ...CRE_HOLDINGS,
  ...MORTGAGE_HOLDINGS,
  ...PE_HOLDINGS,
  ...PC_HOLDINGS,
  ...INFRA_HOLDINGS,
  ...SHIPPING_HOLDINGS,
  ...AVIATION_HOLDINGS,
  ...CARBON_CREDIT_HOLDINGS,
  ...SAF_HOLDINGS,
  ...GREEN_BOND_HOLDINGS,
];

export const TOTAL_HOLDINGS_COUNT = ALL_HOLDINGS.length;

// ── Group-by helper ──────────────────────────────────────────────────────────
function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key] || 'Unclassified';
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

function sumByKey(arr, key, valKey) {
  return arr.reduce((acc, item) => {
    const k = item[key] || 'Unclassified';
    acc[k] = (acc[k] || 0) + (item[valKey] || 0);
    return acc;
  }, {});
}

// ── Exports by asset class ───────────────────────────────────────────────────
export const HOLDINGS_BY_CLASS = {
  equity: EQUITY_HOLDINGS,
  corporateBonds: CORPORATE_BOND_HOLDINGS,
  sovereignBonds: SOVEREIGN_BOND_HOLDINGS,
  projectFinance: PF_PROJECTS,
  commercialRealEstate: CRE_HOLDINGS,
  mortgages: MORTGAGE_HOLDINGS,
  privateEquity: PE_HOLDINGS,
  privateCredit: PC_HOLDINGS,
  infrastructure: INFRA_HOLDINGS,
  shipping: SHIPPING_HOLDINGS,
  aviation: AVIATION_HOLDINGS,
  carbonCredits: CARBON_CREDIT_HOLDINGS,
  safOfftakes: SAF_HOLDINGS,
  greenBonds: GREEN_BOND_HOLDINGS,
};

export const HOLDINGS_BY_SECTOR = groupBy(ALL_HOLDINGS, 'sector');
export const HOLDINGS_BY_COUNTRY = groupBy(ALL_HOLDINGS, 'country');

export const AUM_BY_CLASS = {
  equity: EQUITY_HOLDINGS.reduce((s, h) => s + (h.marketValue || 0), 0),
  corporateBonds: CORPORATE_BOND_HOLDINGS.reduce((s, h) => s + (h.marketValue || 0), 0),
  sovereignBonds: SOVEREIGN_BOND_HOLDINGS.reduce((s, h) => s + (h.marketValue || 0), 0),
  projectFinance: PF_PROJECTS.reduce((s, h) => s + (h.marketValue || 0), 0),
  commercialRealEstate: CRE_HOLDINGS.reduce((s, h) => s + (h.marketValue || 0), 0),
  mortgages: MORTGAGE_HOLDINGS.reduce((s, h) => s + (h.marketValue || 0), 0),
  privateEquity: PE_HOLDINGS.reduce((s, h) => s + (h.marketValue || 0), 0),
  privateCredit: PC_HOLDINGS.reduce((s, h) => s + (h.marketValue || 0), 0),
  infrastructure: INFRA_HOLDINGS.reduce((s, h) => s + (h.marketValue || 0), 0),
  shipping: SHIPPING_HOLDINGS.reduce((s, h) => s + (h.marketValue || 0), 0),
  aviation: AVIATION_HOLDINGS.reduce((s, h) => s + (h.marketValue || 0), 0),
  carbonCredits: CARBON_CREDIT_HOLDINGS.reduce((s, h) => s + (h.marketValue || 0), 0),
  safOfftakes: SAF_HOLDINGS.reduce((s, h) => s + (h.marketValue || 0), 0),
  greenBonds: GREEN_BOND_HOLDINGS.reduce((s, h) => s + (h.marketValue || 0), 0),
};

// ── PCAF convenience slices ──────────────────────────────────────────────────
export const HOLDINGS_BY_PCAF_CLASS = groupBy(ALL_HOLDINGS, 'pcafClass');
export const PCAF_CLASS_NAMES = {
  1: 'Listed Equity & Corporate Bonds (Listed)',
  2: 'Business Loans & Unlisted Equity',
  3: 'Sovereign Bonds',
  4: 'Project Finance',
  5: 'Commercial Real Estate & Mortgages',
  6: 'Private Equity / Unlisted',
};

// ── Weight summary check ─────────────────────────────────────────────────────
export const WEIGHT_SUMMARY = sumByKey(ALL_HOLDINGS, 'assetClass', 'weightPct');

// ── Master universe reference ────────────────────────────────────────────────
export const MASTER_UNIVERSE = MASTER_COMPANIES;

// ── Individual class exports for direct imports ──────────────────────────────
export {
  EQUITY_HOLDINGS,
  CORPORATE_BOND_HOLDINGS,
  SOVEREIGN_BOND_HOLDINGS,
  PF_PROJECTS as PROJECT_FINANCE_HOLDINGS,
  CRE_HOLDINGS,
  MORTGAGE_HOLDINGS,
  PE_HOLDINGS,
  PC_HOLDINGS as PRIVATE_CREDIT_HOLDINGS,
  INFRA_HOLDINGS as INFRASTRUCTURE_HOLDINGS,
  SHIPPING_HOLDINGS,
  AVIATION_HOLDINGS,
  CARBON_CREDIT_HOLDINGS,
  SAF_HOLDINGS,
  GREEN_BOND_HOLDINGS,
  ALL_HOLDINGS,
};

// ── Default export ───────────────────────────────────────────────────────────
export default {
  meta: INSTITUTIONAL_META,
  holdings: ALL_HOLDINGS,
  holdingsByClass: HOLDINGS_BY_CLASS,
  holdingsBySector: HOLDINGS_BY_SECTOR,
  holdingsByCountry: HOLDINGS_BY_COUNTRY,
  holdingsByPcafClass: HOLDINGS_BY_PCAF_CLASS,
  aumByClass: AUM_BY_CLASS,
  totalCount: TOTAL_HOLDINGS_COUNT,
  masterUniverse: MASTER_COMPANIES,
};
