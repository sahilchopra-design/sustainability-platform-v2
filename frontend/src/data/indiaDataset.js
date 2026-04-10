/**
 * indiaDataset.js — Comprehensive India-specific dataset for A² Intelligence Platform
 *
 * Combines REAL data from OWID, CEDA, CBAM, SBTi reference sources with
 * realistic mock data where needed. Every field is tagged with its source.
 *
 * ~1050 lines | 200 companies | 11 data sections | 12 calculation engines
 */

import sbtiData from './sbti-companies.json';
import owidCo2 from './owid-co2-compact.json';
import owidEnergy from './owid-energy-compact.json';
import cedaData from './ceda-2025.json';
import cbamData from './cbam-vulnerability.json';

/* ── PRNG (platform-standard seeded random) ── */
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ── Helpers ── */
const FX = 83.5; // INR per USD
const crToUsd = cr => +(cr * 10 / FX).toFixed(1); // 1 cr INR = 10M INR
const usdToCr = usd => +(usd * FX / 10).toFixed(0);
const guard = (n, d, fallback = 0) => (d > 0 ? n / d : fallback);

/* ── SBTi lookup helper ── */
const _sbtiIndian = (sbtiData.companies || []).filter(c => c.l === 'India');
function lookupSBTi(name) {
  const key = name.toLowerCase();
  const match = _sbtiIndian.find(c => c.n.toLowerCase().includes(key));
  if (!match) return { sbtiStatus: 'None', sbtiClassification: null, sbtiTargetYear: null, sbtiSource: 'none' };
  return {
    sbtiStatus: 'Targets set',
    sbtiClassification: match.c,
    sbtiTargetYear: match.y,
    sbtiSource: 'real',
  };
}

/* ── CEDA India EF lookup ── */
const _indCeda = (cedaData.countries || []).find(c => c.code === 'IND') || { efs: {} };
function cedaEF(sectorCode) { return _indCeda.efs[sectorCode] || 0.5; }

/* ═══════════════════════════════════════════════════════════════════════════
   1. INDIA_PROFILE — Real data from OWID CO2, OWID Energy, CBAM
   ═══════════════════════════════════════════════════════════════════════════ */
const _co2 = (owidCo2.latestByCountry || []).find(c => c.iso === 'IND') || {};
const _en = (owidEnergy.latestByCountry || []).find(c => c.iso === 'IND') || {};
const _cb = (cbamData.countries || []).find(c => c.iso3 === 'IND') || {};

export const INDIA_PROFILE = {
  country: 'India', iso2: 'IN', iso3: 'IND', currency: 'INR', fxRate: FX,
  co2_mt: _co2.co2_mt || 3193.478,
  co2_per_capita: _co2.co2_per_capita || 2.201,
  share_global_co2: _co2.share_global_co2 || 8.274,
  total_ghg_mt: _co2.total_ghg || 4262.411,
  coal_co2_mt: _co2.coal_co2 || 2108.033,
  oil_co2_mt: _co2.oil_co2 || 747.333,
  gas_co2_mt: _co2.gas_co2 || 149.352,
  cement_co2_mt: _co2.cement_co2 || 185.97,
  methane_mt: _co2.methane || 859.294,
  nitrous_oxide_mt: _co2.nitrous_oxide || 310.004,
  primary_energy_twh: _en.primary_energy_twh || 11336,
  renewables_share_pct: _en.renewables_share_pct || 9.146,
  coal_share_pct: _en.coal_share_pct || 56.578,
  solar_share_pct: _en.solar_share_pct || 2.958,
  wind_share_pct: _en.wind_share_pct || 1.764,
  hydro_share_pct: _en.hydro_share_pct || 3.386,
  fossil_share_pct: _en.fossil_share_pct || 89.67,
  carbon_intensity_kwh: _en.carbon_intensity_kwh || 707.45,
  cbam_vulnerability_index: _cb.vulnerabilityIndex || 0.2636,
  cbam_dep_exports: _cb.depExports || 0.077,
  cbam_dep_eu_market: _cb.depEuMarket || 0.2017,
  cbam_emission_intensity: _cb.emissionIntensity || 0.2671,
  cbam_exports_to_eu_kusd: _cb.cbamExportsToEu_kusd || 8725757,
  ndc_target_2030: '45% reduction in emissions intensity vs 2005',
  net_zero_target: 2070,
  re_target_gw: 500,
  gdp_usd_tn: 3.35, population_bn: 1.44,
  dataSource: 'real',
};

/* ═══════════════════════════════════════════════════════════════════════════
   2. NIFTY_50 — All 50 NIFTY 50 constituents
   ═══════════════════════════════════════════════════════════════════════════ */
const _n50Raw = [
  { id:'N01', name:'Reliance Industries', ticker:'RELIANCE', isin:'INE002A01018', sector:'Oil, Gas & Consumable Fuels', industry:'Integrated Oil & Gas', mcCr:1780000, revCr:925000, emp:389000, cedaCode:'324110', cbam:false, csrd:true },
  { id:'N02', name:'Tata Consultancy Services', ticker:'TCS', isin:'INE467B01029', sector:'Information Technology', industry:'IT Services', mcCr:1540000, revCr:240000, emp:614795, cedaCode:'511200', cbam:false, csrd:true },
  { id:'N03', name:'HDFC Bank', ticker:'HDFCBANK', isin:'INE040A01034', sector:'Financial Services', industry:'Private Banking', mcCr:1320000, revCr:285000, emp:213527, cedaCode:'522110', cbam:false, csrd:false },
  { id:'N04', name:'Infosys', ticker:'INFY', isin:'INE009A01021', sector:'Information Technology', industry:'IT Services', mcCr:785000, revCr:163000, emp:317240, cedaCode:'511200', cbam:false, csrd:true },
  { id:'N05', name:'ICICI Bank', ticker:'ICICIBANK', isin:'INE090A01021', sector:'Financial Services', industry:'Private Banking', mcCr:910000, revCr:220000, emp:142829, cedaCode:'522110', cbam:false, csrd:false },
  { id:'N06', name:'Hindustan Unilever', ticker:'HINDUNILVR', isin:'INE030A01027', sector:'FMCG', industry:'Personal Products', mcCr:560000, revCr:62000, emp:21000, cedaCode:'325611', cbam:false, csrd:true },
  { id:'N07', name:'ITC', ticker:'ITC', isin:'INE154A01025', sector:'FMCG', industry:'Diversified FMCG', mcCr:585000, revCr:70000, emp:36500, cedaCode:'312230', cbam:false, csrd:false },
  { id:'N08', name:'Bharti Airtel', ticker:'BHARTIARTL', isin:'INE397D01024', sector:'Telecommunication', industry:'Telecom Services', mcCr:875000, revCr:155000, emp:30000, cedaCode:'517110', cbam:false, csrd:false },
  { id:'N09', name:'State Bank of India', ticker:'SBIN', isin:'INE062A01020', sector:'Financial Services', industry:'Public Banking', mcCr:720000, revCr:440000, emp:232296, cedaCode:'522110', cbam:false, csrd:false },
  { id:'N10', name:'Bajaj Finance', ticker:'BAJFINANCE', isin:'INE296A01024', sector:'Financial Services', industry:'NBFC', mcCr:480000, revCr:56000, emp:58000, cedaCode:'522110', cbam:false, csrd:false },
  { id:'N11', name:'Larsen & Toubro', ticker:'LT', isin:'INE018A01030', sector:'Construction', industry:'Infrastructure', mcCr:520000, revCr:225000, emp:412352, cedaCode:'230301', cbam:false, csrd:true },
  { id:'N12', name:'Kotak Mahindra Bank', ticker:'KOTAKBANK', isin:'INE237A01028', sector:'Financial Services', industry:'Private Banking', mcCr:395000, revCr:90000, emp:96000, cedaCode:'522110', cbam:false, csrd:false },
  { id:'N13', name:'Maruti Suzuki', ticker:'MARUTI', isin:'INE585B01010', sector:'Automobile', industry:'Passenger Vehicles', mcCr:415000, revCr:140000, emp:40000, cedaCode:'336111', cbam:false, csrd:false },
  { id:'N14', name:'Asian Paints', ticker:'ASIANPAINT', isin:'INE021A01026', sector:'Consumer Durables', industry:'Paints', mcCr:275000, revCr:35000, emp:10500, cedaCode:'325510', cbam:false, csrd:false },
  { id:'N15', name:'Axis Bank', ticker:'AXISBANK', isin:'INE238A01034', sector:'Financial Services', industry:'Private Banking', mcCr:370000, revCr:115000, emp:105000, cedaCode:'522110', cbam:false, csrd:false },
  { id:'N16', name:'Titan Company', ticker:'TITAN', isin:'INE280A01028', sector:'Consumer Durables', industry:'Jewellery & Watches', mcCr:310000, revCr:51000, emp:14200, cedaCode:'339910', cbam:false, csrd:false },
  { id:'N17', name:'Sun Pharma', ticker:'SUNPHARMA', isin:'INE044A01036', sector:'Healthcare', industry:'Pharmaceuticals', mcCr:420000, revCr:52000, emp:41000, cedaCode:'325411', cbam:false, csrd:false },
  { id:'N18', name:'UltraTech Cement', ticker:'ULTRACEMCO', isin:'INE481G01011', sector:'Construction Materials', industry:'Cement', mcCr:320000, revCr:72000, emp:22500, cedaCode:'327310', cbam:true, csrd:false },
  { id:'N19', name:'NTPC', ticker:'NTPC', isin:'INE733E01010', sector:'Power', industry:'Thermal Power', mcCr:380000, revCr:178000, emp:15662, cedaCode:'221100', cbam:false, csrd:false },
  { id:'N20', name:'Wipro', ticker:'WIPRO', isin:'INE075A01022', sector:'Information Technology', industry:'IT Services', mcCr:290000, revCr:91000, emp:234564, cedaCode:'511200', cbam:false, csrd:true },
  { id:'N21', name:'HCLTech', ticker:'HCLTECH', isin:'INE860A01027', sector:'Information Technology', industry:'IT Services', mcCr:420000, revCr:110000, emp:227481, cedaCode:'511200', cbam:false, csrd:true },
  { id:'N22', name:'Tech Mahindra', ticker:'TECHM', isin:'INE669C01036', sector:'Information Technology', industry:'IT Services', mcCr:175000, revCr:53000, emp:145000, cedaCode:'511200', cbam:false, csrd:true },
  { id:'N23', name:'Power Grid', ticker:'POWERGRID', isin:'INE752E01010', sector:'Power', industry:'Transmission', mcCr:305000, revCr:46000, emp:9500, cedaCode:'221100', cbam:false, csrd:false },
  { id:'N24', name:'Coal India', ticker:'COALINDIA', isin:'INE522F01014', sector:'Metals & Mining', industry:'Coal Mining', mcCr:290000, revCr:140000, emp:238732, cedaCode:'212100', cbam:false, csrd:false },
  { id:'N25', name:'JSW Steel', ticker:'JSWSTEEL', isin:'INE019A01038', sector:'Metals & Mining', industry:'Steel', mcCr:230000, revCr:175000, emp:65000, cedaCode:'331110', cbam:true, csrd:false },
  { id:'N26', name:'Tata Steel', ticker:'TATASTEEL', isin:'INE081A01020', sector:'Metals & Mining', industry:'Steel', mcCr:195000, revCr:230000, emp:77000, cedaCode:'331110', cbam:true, csrd:true },
  { id:'N27', name:'Hindalco Industries', ticker:'HINDALCO', isin:'INE038A01020', sector:'Metals & Mining', industry:'Aluminum', mcCr:155000, revCr:215000, emp:51000, cedaCode:'331313', cbam:true, csrd:false },
  { id:'N28', name:'Oil & Natural Gas Corp', ticker:'ONGC', isin:'INE213A01029', sector:'Oil, Gas & Consumable Fuels', industry:'Exploration & Production', mcCr:340000, revCr:610000, emp:26245, cedaCode:'211000', cbam:false, csrd:false },
  { id:'N29', name:'Cipla', ticker:'CIPLA', isin:'INE059A01026', sector:'Healthcare', industry:'Pharmaceuticals', mcCr:135000, revCr:26000, emp:25000, cedaCode:'325411', cbam:false, csrd:false },
  { id:'N30', name:"Dr. Reddy's Laboratories", ticker:'DRREDDY', isin:'INE089A01023', sector:'Healthcare', industry:'Pharmaceuticals', mcCr:130000, revCr:28000, emp:25000, cedaCode:'325411', cbam:false, csrd:false },
  { id:'N31', name:'Tata Motors', ticker:'TATAMOTORS', isin:'INE155A01022', sector:'Automobile', industry:'Commercial & Passenger Vehicles', mcCr:310000, revCr:440000, emp:81000, cedaCode:'336111', cbam:false, csrd:true },
  { id:'N32', name:'Nestle India', ticker:'NESTLEIND', isin:'INE239A01016', sector:'FMCG', industry:'Packaged Foods', mcCr:230000, revCr:20000, emp:8000, cedaCode:'311812', cbam:false, csrd:false },
  { id:'N33', name:'Mahindra & Mahindra', ticker:'M&M', isin:'INE101A01026', sector:'Automobile', industry:'Utility Vehicles & Farm Equipment', mcCr:380000, revCr:145000, emp:68000, cedaCode:'336111', cbam:false, csrd:false },
  { id:'N34', name:'Bajaj Auto', ticker:'BAJAJ-AUTO', isin:'INE917I01010', sector:'Automobile', industry:'Two & Three Wheelers', mcCr:265000, revCr:44000, emp:12500, cedaCode:'336991', cbam:false, csrd:false },
  { id:'N35', name:'Grasim Industries', ticker:'GRASIM', isin:'INE047A01021', sector:'Diversified', industry:'Cement & Textiles', mcCr:175000, revCr:130000, emp:28000, cedaCode:'327310', cbam:true, csrd:false },
  { id:'N36', name:'Britannia Industries', ticker:'BRITANNIA', isin:'INE216A01030', sector:'FMCG', industry:'Bakery & Dairy', mcCr:130000, revCr:18000, emp:5400, cedaCode:'311812', cbam:false, csrd:false },
  { id:'N37', name:'Adani Enterprises', ticker:'ADANIENT', isin:'INE423A01024', sector:'Diversified', industry:'Incubation & Infrastructure', mcCr:340000, revCr:100000, emp:45000, cedaCode:'211000', cbam:false, csrd:false },
  { id:'N38', name:'IndusInd Bank', ticker:'INDUSINDBK', isin:'INE095A01012', sector:'Financial Services', industry:'Private Banking', mcCr:92000, revCr:52000, emp:37000, cedaCode:'522110', cbam:false, csrd:false },
  { id:'N39', name:'Eicher Motors', ticker:'EICHERMOT', isin:'INE066A01021', sector:'Automobile', industry:'Two Wheelers', mcCr:130000, revCr:17500, emp:14000, cedaCode:'336991', cbam:false, csrd:false },
  { id:'N40', name:'Hero MotoCorp', ticker:'HEROMOTOCO', isin:'INE158A01026', sector:'Automobile', industry:'Two Wheelers', mcCr:105000, revCr:39000, emp:9500, cedaCode:'336991', cbam:false, csrd:false },
  { id:'N41', name:'SBI Life Insurance', ticker:'SBILIFE', isin:'INE123W01016', sector:'Financial Services', industry:'Life Insurance', mcCr:170000, revCr:110000, emp:22000, cedaCode:'524113', cbam:false, csrd:false },
  { id:'N42', name:'Shriram Finance', ticker:'SHRIRAMFIN', isin:'INE721A01013', sector:'Financial Services', industry:'NBFC', mcCr:120000, revCr:36000, emp:68000, cedaCode:'522110', cbam:false, csrd:false },
  { id:'N43', name:'Bharat Electronics', ticker:'BEL', isin:'INE263A01024', sector:'Defence', industry:'Electronic Equipment', mcCr:210000, revCr:20000, emp:10500, cedaCode:'334413', cbam:false, csrd:false },
  { id:'N44', name:'Trent', ticker:'TRENT', isin:'INE849A01020', sector:'Consumer Durables', industry:'Retail', mcCr:215000, revCr:14000, emp:22000, cedaCode:'448140', cbam:false, csrd:false },
  { id:'N45', name:'Havells India', ticker:'HAVELLS', isin:'INE176B01034', sector:'Consumer Durables', industry:'Electrical Equipment', mcCr:120000, revCr:18000, emp:11000, cedaCode:'335228', cbam:false, csrd:false },
  { id:'N46', name:"Divi's Laboratories", ticker:'DIVISLAB', isin:'INE361B01024', sector:'Healthcare', industry:'API Manufacturing', mcCr:130000, revCr:9000, emp:16000, cedaCode:'325411', cbam:false, csrd:false },
  { id:'N47', name:'Apollo Hospitals', ticker:'APOLLOHOSP', isin:'INE437A01024', sector:'Healthcare', industry:'Hospitals', mcCr:105000, revCr:20000, emp:78000, cedaCode:'622000', cbam:false, csrd:false },
  { id:'N48', name:'Tata Consumer Products', ticker:'TATACONSUM', isin:'INE192A01025', sector:'FMCG', industry:'Tea & Beverages', mcCr:115000, revCr:15500, emp:6500, cedaCode:'311920', cbam:false, csrd:false },
  { id:'N49', name:'BPCL', ticker:'BPCL', isin:'INE029A01011', sector:'Oil, Gas & Consumable Fuels', industry:'Refining & Marketing', mcCr:130000, revCr:490000, emp:11600, cedaCode:'324110', cbam:false, csrd:false },
  { id:'N50', name:'Zomato', ticker:'ZOMATO', isin:'INE758T01015', sector:'Consumer Services', industry:'Internet/Food Delivery', mcCr:210000, revCr:16000, emp:5500, cedaCode:'722511', cbam:false, csrd:false },
];

export const NIFTY_50 = _n50Raw.map((c, idx) => {
  const seed = idx * 37 + 7;
  const ef = cedaEF(c.cedaCode);
  const revUsd = crToUsd(c.revCr);
  const scope1 = +(revUsd * ef * 0.35 * (0.8 + sr(seed) * 0.4)).toFixed(0);
  const scope2 = +(revUsd * ef * 0.25 * (0.7 + sr(seed + 1) * 0.6)).toFixed(0);
  const scope3 = +(revUsd * ef * 1.2 * (0.6 + sr(seed + 2) * 0.8)).toFixed(0);
  const sbti = lookupSBTi(c.name.split(' ')[0] === 'Dr.' ? "Dr. Reddy" : c.name.split(' ')[0]);
  const esgBase = 40 + sr(seed + 3) * 45;
  const ratings = ['AAA','AA','A','BBB','BB','B','CCC'];
  const cdpGrades = ['A','A-','B','B-','C','C-','D','D-'];
  return {
    ...c,
    index: 'NIFTY50',
    marketCap_inr_cr: c.mcCr,
    marketCap_usd_mn: crToUsd(c.mcCr),
    revenue_inr_cr: c.revCr,
    revenue_usd_mn: revUsd,
    employees: c.emp,
    scope1_tco2e: scope1, scope2_tco2e: scope2, scope3_tco2e: scope3,
    totalEmissions_tco2e: scope1 + scope2 + scope3,
    carbonIntensity_tco2e_per_cr: guard(scope1 + scope2 + scope3, c.revCr).toFixed(2) * 1,
    esgScore: +esgBase.toFixed(1),
    esgRating: esgBase > 75 ? 'A+' : esgBase > 65 ? 'A' : esgBase > 55 ? 'B+' : esgBase > 45 ? 'B' : 'C',
    cdpScore: cdpGrades[Math.floor(sr(seed + 4) * cdpGrades.length)],
    msciRating: ratings[Math.floor(sr(seed + 5) * 5)],
    ...sbti,
    temperatureAlignment_c: +(1.5 + sr(seed + 6) * 2.5).toFixed(2),
    transitionScore: +(30 + sr(seed + 7) * 60).toFixed(1),
    physicalRiskScore: +(20 + sr(seed + 8) * 50).toFixed(1),
    waterStress: sr(seed + 9) > 0.4 ? 'High' : sr(seed + 9) > 0.2 ? 'Medium' : 'Low',
    brsrCompliant: true,
    csrdApplicable: c.csrd,
    cbamExposed: c.cbam,
    taxonomyAlignment_pct: +(sr(seed + 10) * 40).toFixed(1),
    roe_pct: +(8 + sr(seed + 11) * 25).toFixed(1),
    debtEquity: +(0.1 + sr(seed + 12) * 2.5).toFixed(2),
    pe_ratio: +(10 + sr(seed + 13) * 60).toFixed(1),
    dividend_yield_pct: +(sr(seed + 14) * 4).toFixed(2),
    beta: +(0.5 + sr(seed + 15) * 1.2).toFixed(2),
    dataSources: { name:'real', ticker:'real', sector:'real', isin:'real', sbti: sbti.sbtiSource, emissions:'estimated_from_ceda', esg:'mock', financial:'mock' },
  };
});

/* ═══════════════════════════════════════════════════════════════════════════
   3. INDIA_BSE_200 — Additional 150 companies beyond NIFTY 50
   ═══════════════════════════════════════════════════════════════════════════ */
const _bse200Raw = [
  ['B001','Adani Green Energy','ADANIGREEN','Energy','Renewable Energy',95000,3200,1200,'221100',false],
  ['B002','Adani Power','ADANIPOWER','Power','Thermal Power',82000,55000,4800,'221100',false],
  ['B003','Adani Total Gas','ATGL','Oil, Gas & Consumable Fuels','Gas Distribution',44000,4800,2000,'221200',false],
  ['B004','Tata Power','TATAPOWER','Power','Integrated Power',68000,58000,12000,'221100',false],
  ['B005','Tata Chemicals','TATACHEM','Chemicals','Inorganic Chemicals',22000,16000,4200,'325310',false],
  ['B006','Tata Elxsi','TATAELXSI','Information Technology','Product Design',18000,3500,12000,'511200',false],
  ['B007','Tata Communications','TATACOMM','Telecommunication','Data Services',15000,20000,14500,'517110',false],
  ['B008','Jindal Steel & Power','JINDALSTEL','Metals & Mining','Steel',38000,55000,27000,'331110',true],
  ['B009','Vedanta','VEDL','Metals & Mining','Diversified Metals',46000,150000,65000,'331313',true],
  ['B010','NMDC','NMDC','Metals & Mining','Iron Ore',28000,18000,6000,'212100',false],
  ['B011','SAIL','SAIL','Metals & Mining','Steel',24000,105000,60000,'331110',true],
  ['B012','Indian Oil Corporation','IOC','Oil, Gas & Consumable Fuels','Refining',75000,830000,31000,'324110',false],
  ['B013','BPCL','BPCL','Oil, Gas & Consumable Fuels','Refining',38000,490000,11600,'324110',false],
  ['B014','HPCL','HPCL','Oil, Gas & Consumable Fuels','Refining',32000,440000,10500,'324110',false],
  ['B015','GAIL','GAIL','Oil, Gas & Consumable Fuels','Gas Transmission',54000,130000,4700,'221200',false],
  ['B016','NHPC','NHPC','Power','Hydropower',45000,12000,7500,'221100',false],
  ['B017','Torrent Power','TORNTPOWER','Power','Integrated Power',22000,22000,6000,'221100',false],
  ['B018','JSW Energy','JSWENERGY','Power','Integrated Power',48000,14000,4500,'221100',false],
  ['B019','Adani Energy Solutions','ADANIENSOL','Power','Transmission',55000,16000,8000,'221100',false],
  ['B020','Motherson Sumi','MOTHERSON','Automobile','Auto Components',38000,98000,135000,'336350',false],
  ['B021','Bosch India','BOSCHLTD','Automobile','Auto Components',42000,16000,29500,'336340',false],
  ['B022','Bharat Forge','BHARATFORG','Automobile','Forgings',18000,16000,7200,'332111',false],
  ['B023','Cummins India','CUMMINSIND','Capital Goods','Engines',28000,9000,6500,'333618',false],
  ['B024','Ambuja Cements','AMBUJACEM','Construction Materials','Cement',32000,35000,5200,'327310',true],
  ['B025','ACC','ACC','Construction Materials','Cement',24000,20000,6500,'327310',true],
  ['B026','Dalmia Bharat','DALBHARAT','Construction Materials','Cement',16000,15000,12000,'327310',true],
  ['B027','Shree Cement','SHREECEM','Construction Materials','Cement',28000,18000,6000,'327310',true],
  ['B028','Havells India','HAVELLS','Consumer Durables','Electrical',22000,18000,11000,'335228',false],
  ['B029','Voltas','VOLTAS','Consumer Durables','Air Conditioning',15000,12000,6000,'333415',false],
  ['B030','Crompton Greaves','CROMPTON','Consumer Durables','Fans & Pumps',12000,6500,3000,'335228',false],
  ['B031','Bajaj Electricals','BAJAJELEC','Consumer Durables','Lighting',5500,5000,3500,'335121',false],
  ['B032','Godrej Consumer Products','GODREJCP','FMCG','Home & Personal Care',28000,14000,11000,'325611',false],
  ['B033','Dabur India','DABUR','FMCG','Ayurveda & Healthcare',25000,12000,5500,'325611',false],
  ['B034','Marico','MARICO','FMCG','Edible Oils & Personal Care',18000,10000,3200,'311225',false],
  ['B035','Colgate Palmolive India','COLPAL','FMCG','Oral Care',20000,6000,3000,'325611',false],
  ['B036','HDFC AMC','HDFCAMC','Financial Services','Asset Management',55000,3200,1400,'523900',false],
  ['B037','SBI Cards','SBICARD','Financial Services','Credit Cards',22000,17000,10000,'522110',false],
  ['B038','Bajaj Holdings','BAJAJHLDNG','Financial Services','Holding Company',48000,800,400,'551111',false],
  ['B039','ICICI Lombard','ICICIGI','Financial Services','General Insurance',48000,19000,8000,'524126',false],
  ['B040','ICICI Prudential Life','ICICIPRULI','Financial Services','Life Insurance',55000,52000,22000,'524113',false],
  ['B041','Biocon','BIOCON','Healthcare','Biopharma',12000,12000,16000,'325411',false],
  ['B042','Aurobindo Pharma','AUROPHARMA','Healthcare','Generics',16000,28000,23000,'325411',false],
  ['B043','Lupin','LUPIN','Healthcare','Pharma',22000,19000,21000,'325411',false],
  ['B044','Torrent Pharma','TORNTPHARM','Healthcare','Pharma',28000,11000,16000,'325411',false],
  ['B045','Glenmark Pharma','GLENMARK','Healthcare','Pharma',10000,14000,14000,'325411',false],
  ['B046','Pidilite Industries','PIDILITIND','Chemicals','Adhesives',42000,13000,7000,'325520',false],
  ['B047','Berger Paints','BERGEPAINT','Consumer Durables','Paints',16000,10000,6500,'325510',false],
  ['B048','Kansai Nerolac','KANSAINER','Consumer Durables','Paints',8000,7000,4000,'325510',false],
  ['B049','Info Edge','NAUKRI','Consumer Services','Internet/Jobs',28000,2800,5500,'511200',false],
  ['B050','Paytm (One97)','PAYTM','Consumer Services','Fintech',14000,9500,10000,'511200',false],
  ['B051','Nykaa (FSN E-Commerce)','NYKAA','Consumer Services','E-Commerce',8000,6500,4200,'454110',false],
  ['B052','LIC','LICI','Financial Services','Life Insurance',420000,820000,105000,'524113',false],
  ['B053','SBI Life Insurance','SBILIFE','Financial Services','Life Insurance',170000,110000,22000,'524113',false],
  ['B054','HDFC Life Insurance','HDFCLIFE','Financial Services','Life Insurance',150000,70000,18000,'524113',false],
  ['B055','Max Financial Services','MFSL','Financial Services','Life Insurance',28000,42000,20000,'524113',false],
  ['B056','DLF','DLF','Real Estate','Residential & Commercial',85000,7000,2500,'531100',false],
  ['B057','Godrej Properties','GODREJPROP','Real Estate','Residential',32000,4500,1800,'531100',false],
  ['B058','Oberoi Realty','OBEROIRLTY','Real Estate','Premium Residential',28000,4000,900,'531100',false],
  ['B059','Phoenix Mills','PHOENIXLTD','Real Estate','Malls & Commercial',18000,3200,2000,'531100',false],
  ['B060','InterGlobe Aviation','INDIGO','Consumer Services','Airlines',78000,62000,38000,'481000',false],
  ['B061','Coromandel International','COROMANDEL','Chemicals','Fertilizers',22000,24000,5000,'325310',true],
  ['B062','Chambal Fertilizers','CHAMBLFERT','Chemicals','Fertilizers',12000,18000,1900,'325310',true],
  ['B063','NALCO','NATIONALUM','Metals & Mining','Aluminum',12000,14000,6500,'331313',true],
  ['B064','Hindustan Zinc','HINDZINC','Metals & Mining','Zinc',48000,33000,4500,'331419',false],
  ['B065','Siemens India','SIEMENS','Capital Goods','Electrical Equipment',55000,22000,10000,'335999',false],
  ['B066','ABB India','ABB','Capital Goods','Power & Automation',35000,12000,6500,'335999',false],
  ['B067','Honeywell India','HONAUT','Capital Goods','Automation',18000,5000,5500,'334512',false],
  ['B068','Thermax','THERMAX','Capital Goods','Energy & Environment',9000,9000,5500,'333410',false],
  ['B069','Indian Hotels','INDHOTEL','Consumer Services','Hotels',32000,7000,20000,'721110',false],
  ['B070','Jubilant FoodWorks','JUBLFOOD','Consumer Services','Quick Service Restaurants',12000,6000,42000,'722511',false],
  ['B071','PB Fintech','POLICYBZR','Financial Services','InsurTech',14000,3500,5000,'511200',false],
  ['B072','Mphasis','MPHASIS','Information Technology','IT Services',14000,14000,33000,'511200',false],
  ['B073','LTIMindtree','LTIM','Information Technology','IT Services',48000,36000,82000,'511200',false],
  ['B074','Persistent Systems','PERSISTENT','Information Technology','IT Services',18000,8000,23000,'511200',false],
  ['B075','Coforge','COFORGE','Information Technology','IT Services',12000,10000,26000,'511200',false],
  ['B076','L&T Technology Services','LTTS','Information Technology','Engineering R&D',16000,9500,24000,'511200',false],
  ['B077','Canara Bank','CANBK','Financial Services','Public Banking',38000,110000,55000,'522110',false],
  ['B078','Bank of Baroda','BANKBARODA','Financial Services','Public Banking',36000,120000,72000,'522110',false],
  ['B079','Punjab National Bank','PNB','Financial Services','Public Banking',28000,105000,65000,'522110',false],
  ['B080','Federal Bank','FEDERALBNK','Financial Services','Private Banking',18000,22000,14000,'522110',false],
  ['B081','AU Small Finance Bank','AUBANK','Financial Services','SFB',12000,14000,30000,'522110',false],
  ['B082','Cholamandalam Investment','CHOLAFIN','Financial Services','NBFC',36000,19000,17000,'522110',false],
  ['B083','Muthoot Finance','MUTHOOTFIN','Financial Services','Gold Loans',22000,14000,30000,'522110',false],
  ['B084','Bajaj Finserv','BAJAJFINSV','Financial Services','Holding',24000,88000,32000,'524113',false],
  ['B085','Polycab India','POLYCAB','Capital Goods','Cables & Wires',22000,18000,28000,'335929',false],
  ['B086','Kaynes Technology','KAYNES','Capital Goods','Electronics Manufacturing',5500,2200,5000,'334418',false],
  ['B087','Dixon Technologies','DIXON','Capital Goods','Electronics Manufacturing',14000,17000,16000,'334310',false],
  ['B088','Sundaram Finance','SUNDARMFIN','Financial Services','NBFC',16000,7000,6500,'522110',false],
  ['B089','CG Power','CGPOWER','Capital Goods','Motors & Switchgear',18000,8500,7000,'335312',false],
  ['B090','Bharat Dynamics','BDL','Defence','Missiles',10000,3500,2800,'332993',false],
  ['B091','Hindustan Aeronautics','HAL','Defence','Aerospace',82000,30000,28000,'336411',false],
  ['B092','Solar Industries','SOLARINDS','Defence','Explosives',14000,6500,3200,'325920',false],
  ['B093','Data Patterns','DATAPATTNS','Defence','Electronics',4000,700,1500,'334511',false],
  ['B094','Cochin Shipyard','COCHINSHIP','Defence','Shipbuilding',8000,4000,4500,'336611',false],
  ['B095','Mazagon Dock','MAZDOCK','Defence','Shipbuilding',22000,9000,8500,'336611',false],
  ['B096','Max Healthcare','MAXHEALTH','Healthcare','Hospitals',26000,6000,18000,'622000',false],
  ['B097','Fortis Healthcare','FORTIS','Healthcare','Hospitals',12000,7000,15000,'622000',false],
  ['B098','Dr Lal PathLabs','LALPATHLAB','Healthcare','Diagnostics',10000,2400,7000,'621511',false],
  ['B099','Metropolis Healthcare','METROPOLIS','Healthcare','Diagnostics',6000,1600,5000,'621511',false],
  ['B100','Syngene International','SYNGENE','Healthcare','CRO',10000,3600,6000,'541711',false],
  ['B101','UPL','UPL','Chemicals','Agrochemicals',14000,46000,14000,'325320',false],
  ['B102','SRF','SRF','Chemicals','Specialty Chemicals',22000,14000,8000,'325199',false],
  ['B103','Aarti Industries','AARTIIND','Chemicals','Specialty Chemicals',8000,7000,6000,'325199',false],
  ['B104','Deepak Nitrite','DEEPAKNTR','Chemicals','Basic Chemicals',9000,8000,3000,'325199',false],
  ['B105','Clean Science','CLEAN','Chemicals','Specialty Chemicals',6000,2000,1100,'325199',false],
  ['B106','Navin Fluorine','NAVINFLUOR','Chemicals','Fluorochemicals',5000,2200,1200,'325199',false],
  ['B107','PI Industries','PIIND','Chemicals','CSM & Agrochemicals',22000,7500,5000,'325320',false],
  ['B108','Supreme Industries','SUPREMEIND','Consumer Durables','Plastics',14000,10000,8000,'326122',false],
  ['B109','Astral','ASTRAL','Consumer Durables','Pipes',14000,6000,3500,'326122',false],
  ['B110','APL Apollo Tubes','APLAPOLLO','Metals & Mining','Steel Tubes',14000,18000,7000,'331110',true],
  ['B111','Prestige Estates','PRESTIGE','Real Estate','Mixed Use',18000,12000,6500,'531100',false],
  ['B112','Brigade Enterprises','BRIGADE','Real Estate','Mixed Use',8000,6500,3500,'531100',false],
  ['B113','Macrotech Developers','LODHA','Real Estate','Residential',28000,13000,5000,'531100',false],
  ['B114','Sunteck Realty','SUNTECK','Real Estate','Premium Residential',4000,1200,650,'531100',false],
  ['B115','Varun Beverages','VBL','FMCG','Bottling',34000,18000,12000,'312111',false],
  ['B116','United Spirits','UNITDSPR','FMCG','Alcoholic Beverages',14000,12000,5000,'312140',false],
  ['B117','Radico Khaitan','RADICO','FMCG','Alcoholic Beverages',7000,4000,1600,'312140',false],
  ['B118','Sapphire Foods','SAPPHIRE','Consumer Services','QSR',5000,2500,28000,'722511',false],
  ['B119','Devyani International','DEVYANI','Consumer Services','QSR',4000,3200,42000,'722511',false],
  ['B120','Relaxo Footwears','RELAXO','Consumer Durables','Footwear',5000,3000,6000,'316210',false],
  ['B121','Metro Brands','METROBRAND','Consumer Durables','Footwear',8000,2500,6500,'448210',false],
  ['B122','Aditya Birla Fashion','ABFRL','Consumer Durables','Apparel',5000,14000,28000,'448110',false],
  ['B123','Page Industries','PAGEIND','Consumer Durables','Innerwear',16000,4600,28000,'315220',false],
  ['B124','IRCTC','IRCTC','Consumer Services','Tourism & Catering',28000,4000,4500,'561510',false],
  ['B125','Adani Ports & SEZ','ADANIPORTS','Infrastructure','Ports',95000,26000,16000,'488310',false],
  ['B126','Container Corp','CONCOR','Infrastructure','Logistics',22000,9000,5500,'484110',false],
  ['B127','Delhivery','DELHIVERY','Consumer Services','Logistics',10000,8500,45000,'492110',false],
  ['B128','IRB Infrastructure','IRB','Infrastructure','Roads & Highways',12000,7500,18000,'237310',false],
  ['B129','KNR Constructions','KNRCON','Construction','Roads',5000,4500,5000,'237310',false],
  ['B130','NCC','NCC','Construction','Diversified',4500,15000,22000,'237310',false],
  ['B131','Praj Industries','PRAJIND','Capital Goods','Biofuels Engineering',5000,3200,1800,'333249',false],
  ['B132','Triveni Turbine','TRITURBINE','Capital Goods','Steam Turbines',8000,1800,1200,'333611',false],
  ['B133','BEL','BEL','Defence','Electronics',210000,20000,10500,'334413',false],
  ['B134','Tata Technologies','TATATECH','Information Technology','Engineering R&D',12000,5500,12500,'511200',false],
  ['B135','Zensar Technologies','ZENSARTECH','Information Technology','IT Services',5000,5500,11000,'511200',false],
  ['B136','Cyient','CYIENT','Information Technology','Engineering R&D',8000,6500,15000,'511200',false],
  ['B137','KPIT Technologies','KPITTECH','Information Technology','Automotive IT',22000,4500,13000,'511200',false],
  ['B138','Birla Soft','BSOFT','Information Technology','IT Services',5000,5500,13000,'511200',false],
  ['B139','JSW Infrastructure','JSWINFRA','Infrastructure','Ports',18000,4000,3500,'488310',false],
  ['B140','KEI Industries','KEI','Capital Goods','Cables',10000,8000,3500,'335929',false],
  ['B141','Schaeffler India','SCHAEFFLER','Automobile','Bearings',14000,7500,3500,'332991',false],
  ['B142','Timken India','TIMKEN','Automobile','Bearings',8000,2800,2000,'332991',false],
  ['B143','SKF India','SKFINDIA','Automobile','Bearings',8000,4200,2500,'332991',false],
  ['B144','Sundram Fasteners','SUNDRMFAST','Automobile','Fasteners',5000,5500,4800,'332722',false],
  ['B145','Carborundum Universal','CARBORUNIV','Capital Goods','Abrasives',5000,4500,3500,'327910',false],
  ['B146','Gujarat Gas','GUJGASLTD','Oil, Gas & Consumable Fuels','City Gas',10000,16000,2800,'221200',false],
  ['B147','Petronet LNG','PETRONET','Oil, Gas & Consumable Fuels','LNG',22000,55000,1400,'221200',false],
  ['B148','Indraprastha Gas','IGL','Oil, Gas & Consumable Fuels','City Gas',16000,15000,3200,'221200',false],
  ['B149','Mahanagar Gas','MGL','Oil, Gas & Consumable Fuels','City Gas',8000,6500,2200,'221200',false],
  ['B150','Kalpataru Projects','KPIL','Construction','EPC',6000,20000,14000,'237130',false],
];

export const INDIA_BSE_200 = _bse200Raw.map(([id,name,ticker,sector,industry,mcCr,revCr,emp,cedaCode,cbam], idx) => {
  const seed = (idx + 51) * 41 + 13;
  const ef = cedaEF(cedaCode);
  const revUsd = crToUsd(revCr);
  const scope1 = +(revUsd * ef * 0.35 * (0.8 + sr(seed) * 0.4)).toFixed(0);
  const scope2 = +(revUsd * ef * 0.25 * (0.7 + sr(seed + 1) * 0.6)).toFixed(0);
  const scope3 = +(revUsd * ef * 1.2 * (0.6 + sr(seed + 2) * 0.8)).toFixed(0);
  const sbti = lookupSBTi(name.split(' ')[0]);
  const esgBase = 35 + sr(seed + 3) * 45;
  return {
    id, name, ticker, sector, industry, index: 'BSE200',
    marketCap_inr_cr: mcCr, marketCap_usd_mn: crToUsd(mcCr),
    revenue_inr_cr: revCr, revenue_usd_mn: revUsd, employees: emp,
    scope1_tco2e: scope1, scope2_tco2e: scope2, scope3_tco2e: scope3,
    totalEmissions_tco2e: scope1 + scope2 + scope3,
    carbonIntensity_tco2e_per_cr: guard(scope1 + scope2 + scope3, revCr).toFixed(2) * 1,
    esgScore: +esgBase.toFixed(1),
    esgRating: esgBase > 70 ? 'A+' : esgBase > 60 ? 'A' : esgBase > 50 ? 'B+' : esgBase > 40 ? 'B' : 'C',
    ...sbti,
    temperatureAlignment_c: +(1.5 + sr(seed + 6) * 2.8).toFixed(2),
    transitionScore: +(25 + sr(seed + 7) * 60).toFixed(1),
    physicalRiskScore: +(25 + sr(seed + 8) * 50).toFixed(1),
    waterStress: sr(seed + 9) > 0.45 ? 'High' : sr(seed + 9) > 0.2 ? 'Medium' : 'Low',
    brsrCompliant: mcCr > 10000,
    cbamExposed: cbam,
    taxonomyAlignment_pct: +(sr(seed + 10) * 35).toFixed(1),
    beta: +(0.6 + sr(seed + 15) * 1.3).toFixed(2),
    dataSources: { name:'real', ticker:'real', sector:'real', sbti: sbti.sbtiSource, emissions:'estimated_from_ceda', esg:'mock', financial:'mock' },
  };
});

/* ═══════════════════════════════════════════════════════════════════════════
   4. INDIA_SECTORS — Sector-level aggregates
   ═══════════════════════════════════════════════════════════════════════════ */
const _allCompanies = [...NIFTY_50, ...INDIA_BSE_200];
const _sectorMap = {};
_allCompanies.forEach(c => {
  if (!_sectorMap[c.sector]) _sectorMap[c.sector] = [];
  _sectorMap[c.sector].push(c);
});

export const INDIA_SECTORS = Object.entries(_sectorMap).map(([sector, comps]) => {
  const n = comps.length;
  const totalEmissions = comps.reduce((s, c) => s + c.totalEmissions_tco2e, 0);
  const avgESG = guard(comps.reduce((s, c) => s + c.esgScore, 0), n);
  const sbtiCount = comps.filter(c => c.sbtiStatus === 'Targets set').length;
  const avgTemp = guard(comps.reduce((s, c) => s + c.temperatureAlignment_c, 0), n);
  return {
    sector, companies: n,
    totalEmissions_tco2e: totalEmissions,
    avgEmissions_tco2e: Math.round(guard(totalEmissions, n)),
    avgESG: +avgESG.toFixed(1),
    sbtiCoverage_pct: +(guard(sbtiCount * 100, n)).toFixed(1),
    avgTemperatureAlignment: +avgTemp.toFixed(2),
    cbamExposedCount: comps.filter(c => c.cbamExposed).length,
    dataSource: 'derived',
  };
}).sort((a, b) => b.totalEmissions_tco2e - a.totalEmissions_tco2e);

/* ═══════════════════════════════════════════════════════════════════════════
   5. INDIA_CBAM_EXPOSURE — Detailed CBAM analysis (REAL from cbam-vulnerability)
   ═══════════════════════════════════════════════════════════════════════════ */
const _cbamFlows = (cbamData.tradeFlows || []).filter(f => f.iso3 === 'IND');
const _cbamPhaseIn = cbamData.phaseIn || [];
const _carbonPrice = 90; // EUR/tCO2 reference price

export const INDIA_CBAM_EXPOSURE = {
  totalExposure_kusd: _cb.cbamExportsToEu_kusd || 8725757,
  vulnerabilityIndex: _cb.vulnerabilityIndex || 0.2636,
  byCommodity: _cbamFlows.map(f => ({
    commodity: f.commodity,
    exports_kusd: Math.round(f.exports_kusd),
    emissions_tco2: Math.round(f.totalEmissions_tco2 || f.appliedEmissions_tco2 || 0),
    directEmissions_tco2: Math.round(f.directEmissions_tco2 || 0),
    indirectEmissions_tco2: Math.round(f.indirectEmissions_tco2 || 0),
    companies: f.commodity === 'Iron & Steel' ? ['Tata Steel','JSW Steel','SAIL','Jindal Steel','APL Apollo']
      : f.commodity === 'Aluminum' ? ['Hindalco','Vedanta','NALCO']
      : f.commodity === 'Cement' ? ['UltraTech','Ambuja','ACC','Dalmia Bharat','Shree Cement']
      : f.commodity === 'Fertilizer' ? ['Coromandel','Chambal Fertilizers']
      : f.commodity === 'Electricity' ? ['NTPC','Adani Power','Tata Power']
      : [],
    dataSource: 'real_cbam',
  })),
  phaseIn: _cbamPhaseIn,
  estimatedCost2026_usd: Math.round((_cbamFlows.reduce((s, f) => s + (f.appliedEmissions_tco2 || 0), 0)) * _carbonPrice * 0.025),
  estimatedCost2034_usd: Math.round((_cbamFlows.reduce((s, f) => s + (f.appliedEmissions_tco2 || 0), 0)) * _carbonPrice * 1.0),
  dataSource: 'real_cbam',
};

/* ═══════════════════════════════════════════════════════════════════════════
   6. INDIA_EMISSIONS_BY_SECTOR — Top India sectors from CEDA
   ═══════════════════════════════════════════════════════════════════════════ */
const _indEfs = _indCeda.efs || {};
const _cedaSectors = cedaData.sectors || [];
export const INDIA_EMISSIONS_BY_SECTOR = Object.entries(_indEfs)
  .map(([code, ef]) => {
    const sec = _cedaSectors.find(s => s.code === code);
    return { cedaCode: code, sector: sec ? sec.name : code, ef_kgco2_usd: +ef.toFixed(4), dataSource: 'real_ceda' };
  })
  .sort((a, b) => b.ef_kgco2_usd - a.ef_kgco2_usd)
  .slice(0, 30);

/* ═══════════════════════════════════════════════════════════════════════════
   7. INDIA_PORTFOLIOS — 5 themed Indian portfolios
   ═══════════════════════════════════════════════════════════════════════════ */
function makeHoldings(companies, aumCr) {
  const total = companies.reduce((s, c) => s + c.marketCap_inr_cr, 0);
  return companies.map(c => ({
    id: c.id, name: c.name, ticker: c.ticker, sector: c.sector,
    weight_pct: +(guard(c.marketCap_inr_cr * 100, total)).toFixed(2),
    value_inr_cr: +(guard(c.marketCap_inr_cr * aumCr, total)).toFixed(0),
    scope1: c.scope1_tco2e, scope2: c.scope2_tco2e, scope3: c.scope3_tco2e,
    esgScore: c.esgScore, sbtiStatus: c.sbtiStatus,
  }));
}

export const INDIA_PORTFOLIOS = {
  nifty50: {
    name: 'NIFTY 50 Replication', totalAum_inr_cr: 50000, totalAum_usd_mn: crToUsd(50000),
    holdings: makeHoldings(NIFTY_50, 50000), dataSource: 'derived',
  },
  greenIndia: {
    name: 'India Green Portfolio', totalAum_inr_cr: 20000, totalAum_usd_mn: crToUsd(20000),
    holdings: makeHoldings(
      _allCompanies.filter(c => c.sbtiStatus === 'Targets set' || c.esgScore > 65).slice(0, 30),
      20000
    ), dataSource: 'derived',
  },
  highCarbon: {
    name: 'India High-Carbon Exposure', totalAum_inr_cr: 15000, totalAum_usd_mn: crToUsd(15000),
    holdings: makeHoldings(
      _allCompanies.filter(c => ['Metals & Mining','Power','Oil, Gas & Consumable Fuels','Construction Materials'].includes(c.sector)).slice(0, 25),
      15000
    ), dataSource: 'derived',
  },
  cbamExposed: {
    name: 'India CBAM-Exposed', totalAum_inr_cr: 10000, totalAum_usd_mn: crToUsd(10000),
    holdings: makeHoldings(
      _allCompanies.filter(c => c.cbamExposed).slice(0, 20),
      10000
    ), dataSource: 'derived',
  },
  midcapGrowth: {
    name: 'India Midcap Growth', totalAum_inr_cr: 12000, totalAum_usd_mn: crToUsd(12000),
    holdings: makeHoldings(
      INDIA_BSE_200.filter(c => c.marketCap_inr_cr < 50000 && c.marketCap_inr_cr > 5000).slice(0, 30),
      12000
    ), dataSource: 'derived',
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   8. INDIA_REGULATORY — Indian regulatory landscape
   ═══════════════════════════════════════════════════════════════════════════ */
export const INDIA_REGULATORY = {
  brsr: { name: 'BRSR (Business Responsibility & Sustainability Reporting)', mandatory: true, applicableFrom: 'FY 2022-23', topCompanies: 1000, framework: 'SEBI', principles: 9, dataSource: 'real' },
  brsrCore: { name: 'BRSR Core', mandatory: true, applicableFrom: 'FY 2023-24', assuranceRequired: true, dataSource: 'real' },
  greenBonds: { name: 'SEBI Sovereign Green Bond Framework', issuers: 50, totalIssuance_usd_bn: 12, dataSource: 'mock' },
  carbonMarket: { name: 'Indian Carbon Credit Trading Scheme (CCTS)', status: 'Operational', launchYear: 2023, dataSource: 'real' },
  performAchieveTrade: { name: 'PAT (Perform, Achieve, Trade)', cycles: 7, designatedConsumers: 1073, dataSource: 'real' },
  nationalHydrogenMission: { name: 'National Green Hydrogen Mission', target_mt_by_2030: 5, investment_usd_bn: 100, dataSource: 'real' },
  solarMission: { name: 'National Solar Mission', target_gw: 280, installed_gw: 82, dataSource: 'real' },
  rbi_climate: { name: 'RBI Climate Risk Framework', status: 'Draft guidelines issued', year: 2024, dataSource: 'real' },
  sebi_esg_ratings: { name: 'SEBI ESG Rating Providers Regulation', effective: 'July 2024', dataSource: 'real' },
};

/* ═══════════════════════════════════════════════════════════════════════════
   9. INDIA_BRSR_METRICS — 9-principle BRSR scores for NIFTY 50
   ═══════════════════════════════════════════════════════════════════════════ */
const BRSR_PRINCIPLES = [
  'P1: Ethics & Transparency', 'P2: Products & Services Sustainability',
  'P3: Employee Wellbeing', 'P4: Stakeholder Responsiveness',
  'P5: Human Rights', 'P6: Environmental Protection',
  'P7: Policy Advocacy', 'P8: Inclusive Growth', 'P9: Consumer Value',
];

export const INDIA_BRSR_METRICS = NIFTY_50.map((c, idx) => {
  const seed = idx * 53 + 101;
  const scores = BRSR_PRINCIPLES.map((p, pi) => ({
    principle: p,
    score: +(50 + sr(seed + pi) * 45).toFixed(1),
    leadership: sr(seed + pi + 10) > 0.5,
  }));
  const avgScore = guard(scores.reduce((s, p) => s + p.score, 0), scores.length);
  return {
    id: c.id, name: c.name, ticker: c.ticker,
    principles: scores,
    avgBrsrScore: +avgScore.toFixed(1),
    assuranceProvider: ['Deloitte','EY','PwC','KPMG','BSI'][Math.floor(sr(seed + 20) * 5)],
    reportingYear: 'FY 2024-25',
    dataSource: 'mock',
  };
});

/* ═══════════════════════════════════════════════════════════════════════════
   10. INDIA_CLIMATE_TARGETS — National targets & CO2 trajectory
   ═══════════════════════════════════════════════════════════════════════════ */
const _ts = (owidCo2.top20TimeSeries || {}).IND || [];
export const INDIA_CLIMATE_TARGETS = {
  ndc: {
    baseYear: 2005, targetYear: 2030,
    intensityReduction_pct: 45,
    re_target_gw: 500,
    nonFossilElectricity_pct: 50,
    dataSource: 'real',
  },
  netZero: { targetYear: 2070, dataSource: 'real' },
  carbonMarket: { launchYear: 2023, compliance: 'PAT Scheme', voluntary: 'Indian Carbon Market', dataSource: 'real' },
  co2Trajectory: [1990, 2000, 2005, 2010, 2015, 2020, 2022, 2023, 2024].map(y => {
    const d = _ts.find(t => t.year === y);
    return d
      ? { year: y, co2_mt: d.co2_mt, co2_per_capita: d.co2_per_capita, share_global: d.share_global, dataSource: 'real_owid' }
      : { year: y, co2_mt: 0, co2_per_capita: 0, share_global: 0, dataSource: 'missing' };
  }),
  sectorBreakdown: {
    power: { share_pct: 44, co2_mt: 1405 },
    industry: { share_pct: 22, co2_mt: 703 },
    transport: { share_pct: 14, co2_mt: 447 },
    buildings: { share_pct: 10, co2_mt: 319 },
    agriculture: { share_pct: 10, co2_mt: 319 },
    dataSource: 'estimated',
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   11. Calculation Engines — 12 engines on India portfolios
   ═══════════════════════════════════════════════════════════════════════════ */
function calcWACI(portfolio) {
  const h = portfolio.holdings || [];
  const totalW = h.reduce((s, x) => s + x.weight_pct, 0);
  const waci = h.reduce((s, x) => s + guard(x.weight_pct, totalW) * (x.scope1 + x.scope2), 0);
  return { metric: 'WACI', value: +waci.toFixed(2), unit: 'tCO2e/$M invested', dataSource: 'derived' };
}
function calcFE(portfolio) {
  const h = portfolio.holdings || [];
  const totalVal = h.reduce((s, x) => s + (x.value_inr_cr || 0), 0);
  const fe = h.reduce((s, x) => s + (x.scope1 + x.scope2) * guard(x.value_inr_cr, totalVal), 0);
  return { metric: 'Financed Emissions', value: +fe.toFixed(0), unit: 'tCO2e', dataSource: 'derived' };
}
function calcTemp(portfolio) {
  const h = portfolio.holdings || [];
  const totalW = h.reduce((s, x) => s + x.weight_pct, 0);
  const n50Map = Object.fromEntries(NIFTY_50.map(c => [c.id, c]));
  const bseMap = Object.fromEntries(INDIA_BSE_200.map(c => [c.id, c]));
  const temp = h.reduce((s, x) => {
    const full = n50Map[x.id] || bseMap[x.id];
    return s + guard(x.weight_pct, totalW) * ((full || {}).temperatureAlignment_c || 2.5);
  }, 0);
  return { metric: 'Portfolio Temperature', value: +temp.toFixed(2), unit: '°C', dataSource: 'derived' };
}
function calcVaR(portfolio) {
  const h = portfolio.holdings || [];
  const totalVal = h.reduce((s, x) => s + (x.value_inr_cr || 0), 0);
  const seed = h.length * 97;
  const var95 = totalVal * (0.03 + sr(seed) * 0.08);
  return { metric: 'Climate VaR (95%)', value: +var95.toFixed(0), unit: 'INR Cr', pct: +(guard(var95 * 100, totalVal)).toFixed(2), dataSource: 'mock' };
}
function calcPAI(portfolio) {
  const h = portfolio.holdings || [];
  const totalW = h.reduce((s, x) => s + x.weight_pct, 0);
  const ghgIntensity = h.reduce((s, x) => s + guard(x.weight_pct, totalW) * (x.scope1 + x.scope2), 0);
  return {
    metric: 'SFDR PAI Indicators', pai1_ghg: +ghgIntensity.toFixed(0),
    pai2_carbonFootprint: +(guard(ghgIntensity, (portfolio.totalAum_usd_mn || 1))).toFixed(2),
    pai3_ghgIntensity: +(ghgIntensity * 0.8).toFixed(0),
    dataSource: 'derived',
  };
}
function calcTax(portfolio) {
  const h = portfolio.holdings || [];
  const n50Map = Object.fromEntries(NIFTY_50.map(c => [c.id, c]));
  const bseMap = Object.fromEntries(INDIA_BSE_200.map(c => [c.id, c]));
  const totalW = h.reduce((s, x) => s + x.weight_pct, 0);
  const aligned = h.reduce((s, x) => {
    const full = n50Map[x.id] || bseMap[x.id];
    return s + guard(x.weight_pct, totalW) * ((full || {}).taxonomyAlignment_pct || 0);
  }, 0);
  return { metric: 'Taxonomy Alignment', value: +aligned.toFixed(1), unit: '%', dataSource: 'derived' };
}
function calcTrans(portfolio) {
  const h = portfolio.holdings || [];
  const n50Map = Object.fromEntries(NIFTY_50.map(c => [c.id, c]));
  const bseMap = Object.fromEntries(INDIA_BSE_200.map(c => [c.id, c]));
  const totalW = h.reduce((s, x) => s + x.weight_pct, 0);
  const score = h.reduce((s, x) => {
    const full = n50Map[x.id] || bseMap[x.id];
    return s + guard(x.weight_pct, totalW) * ((full || {}).transitionScore || 40);
  }, 0);
  return { metric: 'Transition Score', value: +score.toFixed(1), unit: '/100', dataSource: 'derived' };
}
function calcPhys(portfolio) {
  const h = portfolio.holdings || [];
  const n50Map = Object.fromEntries(NIFTY_50.map(c => [c.id, c]));
  const bseMap = Object.fromEntries(INDIA_BSE_200.map(c => [c.id, c]));
  const totalW = h.reduce((s, x) => s + x.weight_pct, 0);
  const risk = h.reduce((s, x) => {
    const full = n50Map[x.id] || bseMap[x.id];
    return s + guard(x.weight_pct, totalW) * ((full || {}).physicalRiskScore || 35);
  }, 0);
  return { metric: 'Physical Risk Score', value: +risk.toFixed(1), unit: '/100', dataSource: 'derived' };
}
function calcWater(portfolio) {
  const h = portfolio.holdings || [];
  const n50Map = Object.fromEntries(NIFTY_50.map(c => [c.id, c]));
  const bseMap = Object.fromEntries(INDIA_BSE_200.map(c => [c.id, c]));
  const highStress = h.filter(x => {
    const full = n50Map[x.id] || bseMap[x.id];
    return (full || {}).waterStress === 'High';
  });
  const totalW = h.reduce((s, x) => s + x.weight_pct, 0);
  const pct = guard(highStress.reduce((s, x) => s + x.weight_pct, 0) * 100, totalW);
  return { metric: 'Water Stress Exposure', highStress_pct: +pct.toFixed(1), companies: highStress.length, dataSource: 'derived' };
}
function calcBio(portfolio) {
  const seed = (portfolio.holdings || []).length * 71;
  const score = 25 + sr(seed) * 40;
  return { metric: 'Biodiversity Impact Score', value: +score.toFixed(1), unit: '/100', dataSource: 'mock' };
}
function calcSBTi(portfolio) {
  const h = portfolio.holdings || [];
  const sbtiCount = h.filter(x => x.sbtiStatus === 'Targets set').length;
  const totalW = h.reduce((s, x) => s + x.weight_pct, 0);
  const sbtiWeight = h.filter(x => x.sbtiStatus === 'Targets set').reduce((s, x) => s + x.weight_pct, 0);
  return {
    metric: 'SBTi Coverage',
    companies_pct: +(guard(sbtiCount * 100, h.length)).toFixed(1),
    weight_pct: +(guard(sbtiWeight * 100, totalW)).toFixed(1),
    dataSource: 'derived',
  };
}
function calcCBAM(portfolio) {
  const h = portfolio.holdings || [];
  const n50Map = Object.fromEntries(NIFTY_50.map(c => [c.id, c]));
  const bseMap = Object.fromEntries(INDIA_BSE_200.map(c => [c.id, c]));
  const exposed = h.filter(x => {
    const full = n50Map[x.id] || bseMap[x.id];
    return (full || {}).cbamExposed;
  });
  const totalW = h.reduce((s, x) => s + x.weight_pct, 0);
  const pct = guard(exposed.reduce((s, x) => s + x.weight_pct, 0) * 100, totalW);
  return { metric: 'CBAM Exposure', exposed_pct: +pct.toFixed(1), companies: exposed.length, dataSource: 'derived' };
}

/* ═══════════════════════════════════════════════════════════════════════════
   11a. INDIA_STATE_EMISSIONS — Per-state climate data
   ═══════════════════════════════════════════════════════════════════════════ */
const _stateRaw = [
  ['Maharashtra','MH',310,125.3,22.4,15.2,'Mumbai, Pune, Nagpur'],
  ['Uttar Pradesh','UP',245,62.8,8.1,4.3,'Lucknow, Noida, Agra'],
  ['Gujarat','GJ',225,140.2,31.5,18.6,'Ahmedabad, Surat, Vadodara'],
  ['Tamil Nadu','TN',215,98.4,28.7,22.1,'Chennai, Coimbatore'],
  ['Karnataka','KA',185,95.1,26.3,19.8,'Bengaluru, Hubli'],
  ['Rajasthan','RJ',170,55.2,42.6,35.2,'Jaipur, Jodhpur'],
  ['West Bengal','WB',165,48.3,5.2,2.1,'Kolkata, Durgapur'],
  ['Madhya Pradesh','MP',155,42.1,12.8,8.5,'Bhopal, Indore'],
  ['Andhra Pradesh','AP',140,58.7,18.4,14.2,'Visakhapatnam, Tirupati'],
  ['Telangana','TS',130,72.5,16.2,11.8,'Hyderabad'],
  ['Chhattisgarh','CG',120,28.4,3.1,1.2,'Raipur (steel/power hub)'],
  ['Odisha','OR',115,32.6,4.8,2.3,'Bhubaneswar (metals hub)'],
  ['Punjab','PB',95,38.2,12.5,8.4,'Chandigarh, Ludhiana'],
  ['Haryana','HR',90,52.8,14.3,9.7,'Gurugram, Faridabad'],
  ['Jharkhand','JH',85,22.1,2.4,1.1,'Ranchi, Jamshedpur (steel)'],
  ['Kerala','KL',60,45.3,8.6,5.2,'Kochi, Thiruvananthapuram'],
  ['Assam','AS',40,14.2,1.8,0.6,'Guwahati (oil refinery)'],
  ['Bihar','BR',55,12.8,2.1,0.8,'Patna'],
  ['Uttarakhand','UK',30,18.5,6.2,4.1,'Dehradun (hydro)'],
  ['Himachal Pradesh','HP',22,15.2,8.5,7.8,'Shimla (hydro)'],
  ['Goa','GA',15,22.4,2.8,1.5,'Panaji (mining)'],
  ['Delhi','DL',75,85.6,8.2,4.5,'National Capital'],
];

export const INDIA_STATE_EMISSIONS = _stateRaw.map(([name, code, co2_mt, gdp_usd_bn, re_gw_installed, solar_gw, notes], idx) => {
  const seed = idx * 61 + 200;
  return {
    state: name, code, co2_mt,
    co2_per_capita: +(co2_mt / (10 + sr(seed) * 180)).toFixed(2),
    gdp_usd_bn,
    carbonIntensity_kgco2_per_usd: +(guard(co2_mt * 1e6, gdp_usd_bn * 1e9) * 1e3).toFixed(3),
    re_installed_gw: re_gw_installed,
    solar_gw,
    wind_gw: +(re_gw_installed - solar_gw - sr(seed + 1) * 2).toFixed(1),
    coalPlants: Math.floor(3 + sr(seed + 2) * 25),
    waterStressIndex: +(1.5 + sr(seed + 3) * 3.5).toFixed(2),
    heatWaveDays_yr: Math.floor(10 + sr(seed + 4) * 50),
    floodRiskScore: +(20 + sr(seed + 5) * 60).toFixed(1),
    notes,
    dataSource: 'estimated',
  };
});

/* ═══════════════════════════════════════════════════════════════════════════
   11b. INDIA_GREEN_BONDS — Indian green bond issuances
   ═══════════════════════════════════════════════════════════════════════════ */
const _greenBondRaw = [
  ['SGB-2023-01','Sovereign Green Bond S1','Govt of India',4000,2023,'Q1','Sovereign','10Y','7.10',['Metro Rail','Solar','Green Hydrogen']],
  ['SGB-2023-02','Sovereign Green Bond S2','Govt of India',6500,2023,'Q4','Sovereign','10Y','7.18',['RE Projects','EV Infrastructure']],
  ['SGB-2024-01','Sovereign Green Bond S3','Govt of India',10000,2024,'Q1','Sovereign','10Y','7.25',['Green Corridors','Offshore Wind']],
  ['GB-REC-01','REC Green Bond','REC Limited',3000,2022,'Q3','Corporate','5Y','7.45',['RE Transmission']],
  ['GB-PFC-01','PFC Green Bond','Power Finance Corp',2500,2022,'Q2','Corporate','7Y','7.35',['Solar Parks']],
  ['GB-IREDA-01','IREDA Green Bond','IREDA',1500,2023,'Q1','Corporate','5Y','7.55',['RE Projects']],
  ['GB-SBI-01','SBI Green Bond','State Bank of India',5000,2023,'Q3','Corporate','5Y','7.30',['Solar','Wind','Green Buildings']],
  ['GB-NTPC-01','NTPC Green Bond','NTPC',2000,2024,'Q2','Corporate','7Y','7.50',['Solar Capacity']],
  ['GB-ADANI-01','Adani Green Bond','Adani Green Energy',8000,2023,'Q2','Corporate','20Y','6.90',['Solar','Wind Farms']],
  ['GB-TATA-01','Tata Motors Green Bond','Tata Motors',3500,2024,'Q1','Corporate','5Y','7.20',['EV Manufacturing']],
  ['GB-HDFC-01','HDFC Green Bond','HDFC Bank',2000,2024,'Q3','Corporate','3Y','7.00',['Green Mortgages']],
  ['GB-JSW-01','JSW Steel Green Bond','JSW Steel',4000,2024,'Q1','Corporate','10Y','7.60',['Green Steel Transition']],
  ['GB-REL-01','Reliance Green Bond','Reliance Industries',15000,2024,'Q2','Corporate','10Y','7.15',['Green Hydrogen','New Energy']],
  ['GB-MAHI-01','M&M Green Bond','Mahindra & Mahindra',1500,2024,'Q3','Corporate','5Y','7.25',['EV Fleet','Farm Solar']],
  ['GB-VEDANTA-01','Vedanta Transition Bond','Vedanta',2000,2024,'Q4','Corporate','7Y','8.10',['Smelter Efficiency']],
];

export const INDIA_GREEN_BONDS = _greenBondRaw.map(([id, name, issuer, size_inr_cr, year, quarter, type, tenor, coupon, useOfProceeds], idx) => {
  const seed = idx * 47 + 300;
  return {
    id, name, issuer, size_inr_cr, size_usd_mn: crToUsd(size_inr_cr),
    year, quarter, type, tenor, coupon_pct: parseFloat(coupon),
    useOfProceeds,
    verifier: ['Sustainalytics','CICERO','CBI','Deloitte','EY'][Math.floor(sr(seed) * 5)],
    framework: type === 'Sovereign' ? 'India Sovereign Green Bond Framework' : 'ICMA Green Bond Principles',
    rating: ['AAA','AA+','AA','A+'][Math.floor(sr(seed + 1) * 4)],
    greenTag: true,
    taxonomyAligned_pct: +(60 + sr(seed + 2) * 35).toFixed(1),
    dataSource: 'mock',
  };
});

/* ═══════════════════════════════════════════════════════════════════════════
   11c. INDIA_TRANSITION_PATHWAYS — Sector decarbonization paths
   ═══════════════════════════════════════════════════════════════════════════ */
export const INDIA_TRANSITION_PATHWAYS = [
  {
    sector: 'Power', currentIntensity_kgco2_kwh: 0.71, target2030: 0.45, target2050: 0.08, target2070: 0,
    keyActions: ['500 GW RE by 2030','Phase down coal','Battery storage 500 GWh','Green hydrogen co-firing'],
    investmentNeeded_usd_bn: 220, currentInvestment_usd_bn: 15, gap_usd_bn: 205,
    companies: ['NTPC','Tata Power','Adani Green','JSW Energy','NHPC'],
    dataSource: 'estimated',
  },
  {
    sector: 'Steel', currentIntensity_tco2_per_t: 2.5, target2030: 2.0, target2050: 0.5, target2070: 0,
    keyActions: ['Green hydrogen DRI','Scrap-based EAF','CCUS pilots','Energy efficiency'],
    investmentNeeded_usd_bn: 45, currentInvestment_usd_bn: 3, gap_usd_bn: 42,
    companies: ['Tata Steel','JSW Steel','SAIL','Jindal Steel'],
    dataSource: 'estimated',
  },
  {
    sector: 'Cement', currentIntensity_kgco2_per_t: 580, target2030: 470, target2050: 200, target2070: 0,
    keyActions: ['Clinker substitution','CCUS','Alternative fuels','Waste heat recovery'],
    investmentNeeded_usd_bn: 18, currentInvestment_usd_bn: 1.5, gap_usd_bn: 16.5,
    companies: ['UltraTech','Ambuja','ACC','Dalmia Bharat','Shree Cement'],
    dataSource: 'estimated',
  },
  {
    sector: 'Transport', currentEmissions_mt: 447, target2030_mt: 380, target2050_mt: 120, target2070_mt: 0,
    keyActions: ['30% EV sales by 2030','Ethanol blending 20%','Metro expansion','Hydrogen trucks'],
    investmentNeeded_usd_bn: 110, currentInvestment_usd_bn: 8, gap_usd_bn: 102,
    companies: ['Tata Motors','Maruti','Bajaj Auto','Hero MotoCorp','Eicher Motors'],
    dataSource: 'estimated',
  },
  {
    sector: 'Oil & Gas', currentEmissions_mt: 280, target2030_mt: 250, target2050_mt: 80, target2070_mt: 0,
    keyActions: ['Green hydrogen blending','Refinery efficiency','Methane capture','Biofuels'],
    investmentNeeded_usd_bn: 35, currentInvestment_usd_bn: 4, gap_usd_bn: 31,
    companies: ['Reliance','ONGC','IOC','BPCL','HPCL','GAIL'],
    dataSource: 'estimated',
  },
  {
    sector: 'Agriculture', currentEmissions_mt: 319, target2030_mt: 290, target2050_mt: 180, target2070_mt: 60,
    keyActions: ['Zero-burn policy','Precision farming','Solar pumps','Methane reduction in paddy'],
    investmentNeeded_usd_bn: 25, currentInvestment_usd_bn: 2, gap_usd_bn: 23,
    companies: ['ITC','UPL','Coromandel','PI Industries','Chambal Fertilizers'],
    dataSource: 'estimated',
  },
  {
    sector: 'Buildings', currentEmissions_mt: 150, target2030_mt: 130, target2050_mt: 45, target2070_mt: 0,
    keyActions: ['ECBC compliance','Green building codes','Efficient cooling','Rooftop solar'],
    investmentNeeded_usd_bn: 40, currentInvestment_usd_bn: 5, gap_usd_bn: 35,
    companies: ['DLF','Godrej Properties','Oberoi Realty','Prestige','Macrotech'],
    dataSource: 'estimated',
  },
  {
    sector: 'IT & Services', currentEmissions_mt: 15, target2030_mt: 8, target2050_mt: 0, target2070_mt: 0,
    keyActions: ['100% RE procurement','Green data centers','Net-zero campuses','Supply chain'],
    investmentNeeded_usd_bn: 5, currentInvestment_usd_bn: 2, gap_usd_bn: 3,
    companies: ['TCS','Infosys','Wipro','HCLTech','Tech Mahindra'],
    dataSource: 'estimated',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   11d. INDIA_PHYSICAL_RISK_HOTSPOTS — Key physical climate risks
   ═══════════════════════════════════════════════════════════════════════════ */
export const INDIA_PHYSICAL_RISK_HOTSPOTS = [
  { hazard: 'Heat Waves', riskLevel: 'Extreme', affectedStates: ['Rajasthan','Gujarat','Maharashtra','MP','UP','Telangana'], popExposed_mn: 600, economicImpact_pct_gdp: 2.8, trend: 'Worsening', rcp85_2050_increase: '+4.5°C peak', dataSource: 'estimated' },
  { hazard: 'Flooding (Riverine)', riskLevel: 'High', affectedStates: ['Assam','Bihar','WB','UP','Kerala'], popExposed_mn: 350, economicImpact_pct_gdp: 1.5, trend: 'Worsening', rcp85_2050_increase: '+20% rainfall intensity', dataSource: 'estimated' },
  { hazard: 'Cyclones', riskLevel: 'High', affectedStates: ['Odisha','AP','Tamil Nadu','Gujarat','WB'], popExposed_mn: 200, economicImpact_pct_gdp: 0.8, trend: 'Intensifying', rcp85_2050_increase: '+15% wind speed', dataSource: 'estimated' },
  { hazard: 'Water Stress', riskLevel: 'Extreme', affectedStates: ['Rajasthan','Gujarat','Maharashtra','Karnataka','Tamil Nadu'], popExposed_mn: 500, economicImpact_pct_gdp: 1.2, trend: 'Worsening', rcp85_2050_increase: '-25% groundwater', dataSource: 'estimated' },
  { hazard: 'Sea Level Rise', riskLevel: 'Medium', affectedStates: ['Kerala','Goa','Maharashtra','Gujarat','WB','Tamil Nadu'], popExposed_mn: 150, economicImpact_pct_gdp: 0.5, trend: 'Accelerating', rcp85_2050_increase: '+0.3m', dataSource: 'estimated' },
  { hazard: 'Agricultural Drought', riskLevel: 'High', affectedStates: ['Maharashtra','Karnataka','Rajasthan','Telangana','AP'], popExposed_mn: 400, economicImpact_pct_gdp: 1.8, trend: 'Variable', rcp85_2050_increase: '-15% yield (rainfed)', dataSource: 'estimated' },
  { hazard: 'Air Pollution', riskLevel: 'Extreme', affectedStates: ['Delhi','UP','Haryana','Punjab','Bihar'], popExposed_mn: 500, economicImpact_pct_gdp: 1.4, trend: 'Stable', rcp85_2050_increase: 'Linked to coal phase-down', dataSource: 'estimated' },
  { hazard: 'Glacier Retreat', riskLevel: 'High', affectedStates: ['Uttarakhand','HP','J&K','Sikkim'], popExposed_mn: 50, economicImpact_pct_gdp: 0.2, trend: 'Accelerating', rcp85_2050_increase: '-30% glacier mass', dataSource: 'estimated' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   11e. INDIA_ESG_BENCHMARKS — Market-level ESG benchmarks
   ═══════════════════════════════════════════════════════════════════════════ */
export const INDIA_ESG_BENCHMARKS = {
  nifty50_avg_esg: +(NIFTY_50.reduce((s, c) => s + c.esgScore, 0) / 50).toFixed(1),
  nifty50_avg_temp: +(NIFTY_50.reduce((s, c) => s + c.temperatureAlignment_c, 0) / 50).toFixed(2),
  nifty50_sbti_pct: +(NIFTY_50.filter(c => c.sbtiStatus === 'Targets set').length * 100 / 50).toFixed(1),
  nifty50_cbam_exposed_pct: +(NIFTY_50.filter(c => c.cbamExposed).length * 100 / 50).toFixed(1),
  bse200_avg_esg: +(guard(_allCompanies.reduce((s, c) => s + c.esgScore, 0), _allCompanies.length)).toFixed(1),
  bse200_sbti_pct: +(_allCompanies.filter(c => c.sbtiStatus === 'Targets set').length * 100 / _allCompanies.length).toFixed(1),
  topSectors_by_esg: [...INDIA_SECTORS].sort((a, b) => b.avgESG - a.avgESG).slice(0, 5).map(s => s.sector),
  bottomSectors_by_esg: [...INDIA_SECTORS].sort((a, b) => a.avgESG - b.avgESG).slice(0, 5).map(s => s.sector),
  topEmitters: [...NIFTY_50].sort((a, b) => b.totalEmissions_tco2e - a.totalEmissions_tco2e).slice(0, 10).map(c => ({ name: c.name, tco2e: c.totalEmissions_tco2e })),
  dataSource: 'derived',
};

/* ═══════════════════════════════════════════════════════════════════════════
   11f. INDIA_PAT_SCHEME — PAT (Perform, Achieve, Trade) sectors
   ═══════════════════════════════════════════════════════════════════════════ */
export const INDIA_PAT_SCHEME = {
  totalDesignatedConsumers: 1073,
  cycles: [
    { cycle: 'PAT-I', period: '2012-15', designatedConsumers: 478, savings_mtoe: 6.69, escerts_issued: 35000 },
    { cycle: 'PAT-II', period: '2016-19', designatedConsumers: 621, savings_mtoe: 8.67, escerts_issued: 42000 },
    { cycle: 'PAT-III', period: '2017-20', designatedConsumers: 116, savings_mtoe: 1.06, escerts_issued: 8500 },
    { cycle: 'PAT-IV', period: '2018-21', designatedConsumers: 109, savings_mtoe: 0.76, escerts_issued: 6000 },
    { cycle: 'PAT-V', period: '2019-22', designatedConsumers: 110, savings_mtoe: 0.92, escerts_issued: 7200 },
    { cycle: 'PAT-VI', period: '2020-23', designatedConsumers: 135, savings_mtoe: 1.15, escerts_issued: 9000 },
    { cycle: 'PAT-VII', period: '2022-25', designatedConsumers: 1073, savings_mtoe: null, escerts_issued: null },
  ],
  sectorCoverage: [
    { sector: 'Thermal Power', consumers: 144, shareOfNationalEnergy_pct: 35 },
    { sector: 'Iron & Steel', consumers: 67, shareOfNationalEnergy_pct: 8 },
    { sector: 'Cement', consumers: 85, shareOfNationalEnergy_pct: 5 },
    { sector: 'Aluminum', consumers: 10, shareOfNationalEnergy_pct: 3 },
    { sector: 'Fertilizer', consumers: 29, shareOfNationalEnergy_pct: 3 },
    { sector: 'Pulp & Paper', consumers: 31, shareOfNationalEnergy_pct: 1 },
    { sector: 'Textiles', consumers: 90, shareOfNationalEnergy_pct: 2 },
    { sector: 'Chlor-Alkali', consumers: 22, shareOfNationalEnergy_pct: 1 },
    { sector: 'Railways', consumers: 1, shareOfNationalEnergy_pct: 2 },
    { sector: 'Refineries', consumers: 18, shareOfNationalEnergy_pct: 6 },
    { sector: 'DISCOMs', consumers: 55, shareOfNationalEnergy_pct: 4 },
    { sector: 'Petrochemicals', consumers: 38, shareOfNationalEnergy_pct: 2 },
  ],
  escertPrice_inr: 350,
  dataSource: 'real',
};

/* ═══════════════════════════════════════════════════════════════════════════
   12. Calculation Engines — 12 engines on India portfolios
   ═══════════════════════════════════════════════════════════════════════════ */

function _runEnginesOnPortfolio(p) {
  return {
    waci: calcWACI(p), financedEmissions: calcFE(p), temperature: calcTemp(p),
    climateVaR: calcVaR(p), sfdrPai: calcPAI(p), taxonomy: calcTax(p),
    transition: calcTrans(p), physicalRisk: calcPhys(p), water: calcWater(p),
    biodiversity: calcBio(p), sbtiCoverage: calcSBTi(p), cbamExposure: calcCBAM(p),
  };
}

export function runIndiaEngines() {
  return {
    nifty50: _runEnginesOnPortfolio(INDIA_PORTFOLIOS.nifty50),
    greenIndia: _runEnginesOnPortfolio(INDIA_PORTFOLIOS.greenIndia),
    highCarbon: _runEnginesOnPortfolio(INDIA_PORTFOLIOS.highCarbon),
    cbamExposed: _runEnginesOnPortfolio(INDIA_PORTFOLIOS.cbamExposed),
    midcapGrowth: _runEnginesOnPortfolio(INDIA_PORTFOLIOS.midcapGrowth),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   EXPORTS
   ═══════════════════════════════════════════════════════════════════════════ */
export default {
  INDIA_PROFILE, NIFTY_50, INDIA_BSE_200, INDIA_SECTORS,
  INDIA_CBAM_EXPOSURE, INDIA_EMISSIONS_BY_SECTOR, INDIA_PORTFOLIOS,
  INDIA_REGULATORY, INDIA_BRSR_METRICS, INDIA_CLIMATE_TARGETS,
  INDIA_STATE_EMISSIONS, INDIA_GREEN_BONDS, INDIA_TRANSITION_PATHWAYS,
  INDIA_PHYSICAL_RISK_HOTSPOTS, INDIA_ESG_BENCHMARKS, INDIA_PAT_SCHEME,
  runIndiaEngines,
};
