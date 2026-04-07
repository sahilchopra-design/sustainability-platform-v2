import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ComposedChart, Area,
  ResponsiveContainer, Cell,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const ENTITY_TYPES = ['Corporation', 'Sovereign', 'Financial Institution', 'Municipality'];
const SECTORS = ['Energy', 'Utilities', 'Materials', 'Financials', 'Industrials', 'Consumer Staples', 'Real Estate', 'Transport', 'Agriculture', 'Technology', 'Healthcare', 'Government'];
const JURISDICTIONS = ['USA', 'UK', 'EU', 'Germany', 'France', 'Australia', 'Canada', 'Netherlands', 'Belgium', 'New Zealand', 'Philippines', 'Colombia', 'Pakistan', 'Kenya', 'Japan', 'India', 'Brazil', 'South Africa', 'Switzerland', 'Ireland'];
const CLAIM_TYPES = ['Failure to Disclose', 'Greenwashing', 'Stranded Asset', 'Human Rights', 'Corporate Governance', 'Product Liability', 'Tortious Liability', 'Administrative Challenge', 'Shareholder Derivative', 'Consumer Protection', 'Securities Fraud', 'Constitutional Climate Rights'];
const OUTCOMES = ['Plaintiff Win', 'Defendant Win', 'Settlement', 'Dismissed', 'Pending'];

const ENTITY_NAME_BASES = [
  'Apex Energy', 'GlobalPower', 'TerraFuel', 'CoalTech', 'OilStream', 'NatGas Holdings', 'RefineX',
  'CarbonFirst', 'FossilFin Bank', 'PetroChem AG', 'EnergyGiant SE', 'BlueFuel', 'GasWorld',
  'CokeOvens', 'TarSands Global', 'HeavyOil Partners', 'ShaleFirst', 'LNG Dynamics', 'PipelineCo',
  'RefineryCorp', 'UtilityPrime AG', 'PowerGen Holdings', 'GridCo Intl', 'ElectricFirst', 'VoltageMax',
  'ThermalPower', 'NuclearBase SE', 'HydroElectric', 'SteelMill', 'CementWorks',
  'ChemFirst', 'PlasticsPrime', 'MetalsFund AG', 'MiningCo', 'QuarryTech',
  'CoalMine Holdings', 'IronOre Partners', 'CopperVein', 'AlumSmelter', 'ZincPrime',
  'AutoDrive', 'AirTransport PLC', 'ShippingGlobal', 'TruckingMass', 'RailFreight AG',
  'AviationFirst SE', 'LogisticsCo', 'MaritimeShip', 'PortOps', 'CargoWorld PLC',
  'AgriGiant', 'FarmFirst', 'CropScience', 'LivestockCo AG', 'FoodPrime SE',
  'GrainHoldings', 'SoyBean Partners', 'PalmOil Global', 'FertilizerCo', 'PesticideTech',
  'Republic Alpha', 'Kingdom Beta', 'State Gamma', 'Federation Delta', 'Commonwealth Epsilon',
  'Province Zeta', 'Emirate Eta', 'Territory Theta', 'Union Iota', 'Nation Kappa',
  'MegaBank Global', 'CapitalFirst PLC', 'InvestCo AG', 'AssetMgmt SE', 'TrustBank',
  'BondIssuer', 'PensionFund', 'InsureCo Global', 'ReinsureFirst', 'HedgeFund Partners',
  'PropCo REIT', 'REITFirst', 'LandBank', 'BuildFirst', 'ConstructionPrime',
  'HousingCo SE', 'UrbanDev', 'CommercialProp', 'OfficeREIT', 'LogisticsPark',
  'City Alpha', 'Municipality Beta', 'Town Gamma', 'Borough Delta', 'District Epsilon',
  'Council Zeta', 'Authority Eta', 'Region Theta', 'County Iota', 'Province Lambda',
  'TechEnergy', 'DataCenter Power', 'CloudFirst', 'DigitalInfra', 'ServerFarm',
  'NetEnergy AG', 'GridTech SE', 'SmartPower', 'AICompute', 'ByteEnergy',
  'HealthChem', 'PharmaCo', 'MedDevice', 'BioFuel SE', 'GeneTech AG',
  'LabFirst', 'ClinicalPrime', 'DrugMfg', 'VaccineCo AG', 'TherapyFirst',
  'GlobalInsurance PLC', 'ReinsureMax', 'LloydsMkt', 'CatBond Partners', 'ClimateIns AG',
  'WeatherRisk', 'FloodCover', 'DroughtFirst', 'FireRisk SE', 'StormShield',
  'SovereignFund AA', 'PensionPool BB', 'Endowment CC', 'Foundation DD', 'TrustPortfolio EE',
  'AlternativeFF', 'InfraFund GG', 'PrivateEq HH', 'VentureClimate II', 'GreenBond JJ',
  'EmergeMarket KK', 'Frontier LL', 'Asia Exposure MM', 'Africa Focus NN', 'LatAm OO',
  'Europe Mkt PP', 'Nordics QQ', 'CEE RR', 'MENA SS', 'APAC TT',
  'LegalHoldCo UU', 'SPVFirst VV', 'ShellCo WW', 'Offshore XX', 'TrustCo YY',
  'HoldingZZ', 'ParentCo A1', 'Subsidiary B1', 'JointVen C1', 'Consortium D1',
  'GreenWash E1', 'CleanCrum F1', 'EcoFake G1', 'Nature H1', 'Sustain I1',
  'CarbonFake J1', 'NetZero K1', 'Offset L1', 'Credits M1', 'Neutral N1',
  'Transition O1', 'Climate P1', 'Resilience Q1', 'Adaptation R1', 'Mitigation S1',
  'Disclosure T1', 'Reporting U1', 'Standards V1', 'Compliance W1', 'Audit X1',
  'Governance Y1', 'Board Z1', 'Committee A2', 'Oversight B2', 'Account C2',
  'Liability D2', 'Exposure E2', 'Risk F2', 'VaR G2', 'Stress H2',
  'Scenario I2', 'Forecast J2', 'Projection K2', 'Estimate L2', 'Model M2',
  'Analytics N2', 'Intel O2', 'Data P2', 'Metrics Q2', 'KPIs R2',
  'Benchmark S2', 'Index T2', 'Indicator U2', 'Tracker V2', 'Monitor W2',
  'Assessor X2', 'Evaluator Y2', 'Rater Z2', 'Scorer A3', 'Ranking B3',
];

const ENTITIES = Array.from({ length: 200 }, (_, i) => {
  const typeIdx = Math.floor(sr(i * 7) * 4);
  const sectorIdx = Math.floor(sr(i * 11) * 12);
  const jurIdx = Math.floor(sr(i * 13) * 20);
  const claim1 = Math.floor(sr(i * 17) * 12);
  let claim2 = Math.floor(sr(i * 19) * 12);
  if (claim2 === claim1) claim2 = (claim2 + 1) % 12;
  const disclosureAdequacy = Math.round(sr(i * 23) * 80 + 10);
  const physRisk = Math.round(sr(i * 29) * 90 + 5);
  const transRisk = Math.round(sr(i * 31) * 90 + 5);
  const precedentRisk = Math.round(sr(i * 37) * 80 + 10);
  const reputationalRisk = Math.round(sr(i * 41) * 80 + 10);
  const activeCases = Math.floor(sr(i * 43) * 20);
  const historicalCases = Math.floor(sr(i * 47) * 40);
  const settledCases = Math.floor(sr(i * 53) * (historicalCases + 1));
  const dismissedCases = Math.floor(sr(i * 59) * Math.max(1, historicalCases - settledCases + 1));
  const totalExposureUSD = Math.round((sr(i * 61) * 9 + 0.1) * 1e9);
  const largestCaseUSD = Math.round(totalExposureUSD * (sr(i * 67) * 0.5 + 0.1));
  const legalCostEstimate = Math.round(totalExposureUSD * 0.05 * sr(i * 71));
  const litigationRiskScore = Math.min(100, Math.max(0, Math.round(
    (1 - disclosureAdequacy / 100) * 30 +
    physRisk / 100 * 20 +
    transRisk / 100 * 20 +
    precedentRisk / 100 * 15 +
    reputationalRisk / 100 * 15
  )));
  const outcomeIdx = Math.floor(sr(i * 73) * 5);
  return {
    id: i + 1,
    name: ENTITY_NAME_BASES[i] || `Entity ${i + 1}`,
    type: ENTITY_TYPES[typeIdx],
    sector: SECTORS[sectorIdx],
    jurisdiction: JURISDICTIONS[jurIdx],
    activeCases,
    historicalCases,
    totalExposureUSD,
    largestCaseUSD,
    claimTypes: [CLAIM_TYPES[claim1], CLAIM_TYPES[claim2]],
    litigationRiskScore,
    safeHarbor: sr(i * 79) > 0.65,
    disclosureAdequacy,
    physicalRiskExposure: physRisk,
    transitionRiskExposure: transRisk,
    precedentRisk,
    reputationalRisk,
    legalCostEstimate,
    settledCases,
    dismissedCases,
    pendingCases: activeCases,
    outcome: OUTCOMES[outcomeIdx],
  };
});

const LANDMARK_CASES = Array.from({ length: 50 }, (_, j) => {
  const jurIdx = Math.floor(sr(j * 83 + 500) * 20);
  const claimIdx = Math.floor(sr(j * 89 + 500) * 12);
  const outIdx = Math.floor(sr(j * 97 + 500) * 5);
  const year = 2000 + Math.floor(sr(j * 101 + 500) * 24);
  const impact = Math.round((sr(j * 103 + 500) * 4.5 + 0.1) * 1e9);
  const pLevels = ['High', 'Medium', 'Low'];
  const pLvl = pLevels[Math.floor(sr(j * 107 + 500) * 3)];
  const prefixes = ['v. National Oil Authority', 'Climate Commission v. State', 'People v. Energy Corp',
    'Environmental Alliance v. Ministry', 'State v. Carbon Emitter', 'Citizens v. Fossil Corp',
    'Youth Climate v. Government', 'NGO v. Pipeline Co', 'Minister v. Coal Mine', 'Court of Climate Appeal'];
  return {
    id: j + 1,
    caseName: `${ENTITY_NAME_BASES[j % 50]} ${prefixes[j % prefixes.length]}`,
    parties: `${ENTITY_NAME_BASES[(j * 3) % 50]} vs ${ENTITY_NAME_BASES[(j * 5 + 1) % 50]}`,
    jurisdiction: JURISDICTIONS[jurIdx],
    filingYear: year,
    claimType: CLAIM_TYPES[claimIdx],
    outcome: OUTCOMES[outIdx],
    financialImpact: impact,
    precedentLevel: pLvl,
    description: `${CLAIM_TYPES[claimIdx]} case filed in ${year} in ${JURISDICTIONS[jurIdx]}. Outcome: ${OUTCOMES[outIdx]}.`,
  };
});

const fmtUSD = v => {
  if (!isFinite(v) || isNaN(v)) return '$0';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${Math.round(v).toLocaleString()}`;
};

const riskColor = s => s >= 70 ? T.red : s >= 40 ? T.amber : T.green;

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>{sub}</div>}
  </div>
);

const RiskBadge = ({ val }) => (
  <span style={{ background: riskColor(val) + '18', color: riskColor(val), border: `1px solid ${riskColor(val)}40`, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>{val}</span>
);

const TABS = ['Risk Scorer Dashboard', 'Entity Database', 'Jurisdiction Analysis', 'Case Database', 'Claim Type Analytics', 'Portfolio Litigation VaR', 'Summary & Export'];

export default function ClimateLitigationRiskScorerPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [jurFilter, setJurFilter] = useState([]);
  const [claimFilter, setClaimFilter] = useState('All');
  const [riskMax, setRiskMax] = useState(100);
  const [riskMin, setRiskMin] = useState(0);
  const [safeHarborFilter, setSafeHarborFilter] = useState('All');
  const [activeCasesToggle, setActiveCasesToggle] = useState(false);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('litigationRiskScore');
  const [sortDir, setSortDir] = useState('desc');
  const [drillEntity, setDrillEntity] = useState(null);
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [caseClaimFilter, setCaseClaimFilter] = useState('All');
  const [caseJurFilter, setCaseJurFilter] = useState('All');
  const [caseSortCol, setCaseSortCol] = useState('filingYear');
  const [caseSortDir, setCaseSortDir] = useState('desc');

  const filtered = useMemo(() => {
    if (!ENTITIES.length) return [];
    let arr = [...ENTITIES];
    if (typeFilter !== 'All') arr = arr.filter(e => e.type === typeFilter);
    if (sectorFilter !== 'All') arr = arr.filter(e => e.sector === sectorFilter);
    if (jurFilter.length > 0) arr = arr.filter(e => jurFilter.includes(e.jurisdiction));
    if (claimFilter !== 'All') arr = arr.filter(e => e.claimTypes.includes(claimFilter));
    if (safeHarborFilter !== 'All') arr = arr.filter(e => e.safeHarbor === (safeHarborFilter === 'Yes'));
    if (activeCasesToggle) arr = arr.filter(e => e.activeCases > 0);
    if (search) arr = arr.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
    arr = arr.filter(e => e.litigationRiskScore >= riskMin && e.litigationRiskScore <= riskMax);
    return [...arr].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [typeFilter, sectorFilter, jurFilter, claimFilter, riskMin, riskMax, safeHarborFilter, activeCasesToggle, search, sortCol, sortDir]);

  const top20 = useMemo(() => [...ENTITIES].sort((a, b) => b.litigationRiskScore - a.litigationRiskScore).slice(0, 20), []);

  const riskDist = useMemo(() => {
    const bins = [[0, 20], [20, 40], [40, 60], [60, 80], [80, 100]];
    return bins.map(([lo, hi]) => ({
      range: `${lo}-${hi}`,
      count: filtered.filter(e => e.litigationRiskScore >= lo && e.litigationRiskScore < hi).length,
    }));
  }, [filtered]);

  const jurData = useMemo(() => {
    const map = {};
    ENTITIES.forEach(e => {
      if (!map[e.jurisdiction]) map[e.jurisdiction] = { jur: e.jurisdiction, count: 0, totalRisk: 0, cases: 0, exposure: 0 };
      map[e.jurisdiction].count++;
      map[e.jurisdiction].totalRisk += e.litigationRiskScore;
      map[e.jurisdiction].cases += e.activeCases;
      map[e.jurisdiction].exposure += e.totalExposureUSD;
    });
    return Object.values(map).map(d => ({
      ...d,
      avgRisk: d.count ? Math.round(d.totalRisk / d.count) : 0,
      exposureB: +(d.exposure / 1e9).toFixed(1),
    })).sort((a, b) => b.avgRisk - a.avgRisk);
  }, []);

  const claimDist = useMemo(() => {
    const map = {};
    CLAIM_TYPES.forEach(ct => { map[ct] = 0; });
    ENTITIES.forEach(e => e.claimTypes.forEach(ct => { map[ct] = (map[ct] || 0) + 1; }));
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    const hhi = total ? Math.round(Object.values(map).reduce((s, v) => s + Math.pow(v / total, 2), 0) * 10000) : 0;
    return {
      data: Object.entries(map).map(([type, count]) => ({
        type, count,
        pct: total ? +(count / total * 100).toFixed(1) : 0,
        contrib: total ? Math.round(Math.pow(count / total, 2) * 10000) : 0,
      })).sort((a, b) => b.count - a.count),
      hhi,
    };
  }, []);

  const portfolioVaR = useMemo(() => {
    if (!filtered.length) return { base: 0, excl: 0, reduction: 0, reductionPct: '0', sectorAttr: [], top10: [] };
    const base = filtered.reduce((s, e) => s + e.totalExposureUSD * e.litigationRiskScore / 100, 0);
    const top10ids = new Set([...ENTITIES].sort((a, b) => b.litigationRiskScore - a.litigationRiskScore).slice(0, 10).map(e => e.id));
    const excl = filtered.filter(e => !top10ids.has(e.id)).reduce((s, e) => s + e.totalExposureUSD * e.litigationRiskScore / 100, 0);
    const sectorMap = {};
    filtered.forEach(e => {
      sectorMap[e.sector] = (sectorMap[e.sector] || 0) + e.totalExposureUSD * e.litigationRiskScore / 100;
    });
    return {
      base,
      excl,
      reduction: base - excl,
      reductionPct: base ? ((base - excl) / base * 100).toFixed(1) : '0',
      sectorAttr: Object.entries(sectorMap).map(([s, v]) => ({ sector: s, var: Math.round(v / 1e6) })).sort((a, b) => b.var - a.var),
      top10: [...ENTITIES].sort((a, b) => b.litigationRiskScore - a.litigationRiskScore).slice(0, 10),
    };
  }, [filtered]);

  const filteredCases = useMemo(() => {
    let arr = [...LANDMARK_CASES];
    if (caseClaimFilter !== 'All') arr = arr.filter(c => c.claimType === caseClaimFilter);
    if (caseJurFilter !== 'All') arr = arr.filter(c => c.jurisdiction === caseJurFilter);
    return [...arr].sort((a, b) => {
      const av = a[caseSortCol], bv = b[caseSortCol];
      if (typeof av === 'number') return caseSortDir === 'asc' ? av - bv : bv - av;
      return caseSortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [caseClaimFilter, caseJurFilter, caseSortCol, caseSortDir]);

  const handleSort = useCallback(col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }, [sortCol]);

  const toggleJur = useCallback(jur => {
    setJurFilter(prev => prev.includes(jur) ? prev.filter(j => j !== jur) : [...prev, jur]);
  }, []);

  const avgRisk = filtered.length ? (filtered.reduce((s, e) => s + e.litigationRiskScore, 0) / filtered.length).toFixed(1) : '0';

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ background: T.indigo, borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>EP</div>
            <div>
              <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1, textTransform: 'uppercase' }}>EP-DA1 · Disclosure & Stranded Asset Analytics</div>
              <h1 style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>Climate Litigation Risk Scorer</h1>
            </div>
          </div>
          <div style={{ fontSize: 12, color: T.muted }}>200 entities · 20 jurisdictions · 50 landmark cases · portfolio litigation VaR · claim-type HHI concentration</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: `2px solid ${T.border}`, overflowX: 'auto', paddingBottom: 1 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)} style={{ padding: '8px 14px', border: 'none', background: activeTab === i ? T.indigo : 'transparent', color: activeTab === i ? '#fff' : T.muted, borderRadius: '6px 6px 0 0', cursor: 'pointer', fontWeight: activeTab === i ? 600 : 400, fontSize: 12, whiteSpace: 'nowrap' }}>{t}</button>
          ))}
        </div>

        {/* Global Filters */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Search</div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Entity name..." style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12, width: 150 }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Type</div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {ENTITY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Sector</div>
            <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Claim Type</div>
            <select value={claimFilter} onChange={e => setClaimFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {CLAIM_TYPES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Safe Harbor</div>
            <select value={safeHarborFilter} onChange={e => setSafeHarborFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option><option>Yes</option><option>No</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Min Risk: {riskMin}</div>
            <input type="range" min={0} max={100} value={riskMin} onChange={e => setRiskMin(+e.target.value)} style={{ width: 90 }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Max Risk: {riskMax}</div>
            <input type="range" min={0} max={100} value={riskMax} onChange={e => setRiskMax(+e.target.value)} style={{ width: 90 }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={activeCasesToggle} onChange={e => setActiveCasesToggle(e.target.checked)} />Active Cases
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={compareMode} onChange={e => setCompareMode(e.target.checked)} />Compare Mode
          </label>
          <div style={{ fontSize: 11, color: T.muted, marginLeft: 'auto' }}>{filtered.length}/{ENTITIES.length}</div>
        </div>

        {/* Jurisdiction chips */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: T.muted, marginRight: 4 }}>JURS:</span>
          {JURISDICTIONS.map(j => (
            <button key={j} onClick={() => toggleJur(j)} style={{ padding: '2px 8px', fontSize: 10, border: `1px solid ${jurFilter.includes(j) ? T.indigo : T.border}`, borderRadius: 10, background: jurFilter.includes(j) ? T.indigo + '18' : 'transparent', color: jurFilter.includes(j) ? T.indigo : T.muted, cursor: 'pointer' }}>{j}</button>
          ))}
          {jurFilter.length > 0 && <button onClick={() => setJurFilter([])} style={{ padding: '2px 8px', fontSize: 10, border: `1px solid ${T.red}`, borderRadius: 10, background: T.red + '18', color: T.red, cursor: 'pointer' }}>Clear</button>}
        </div>

        {/* Compare Panel */}
        {compareMode && (
          <div style={{ background: T.card, border: `2px solid ${T.indigo}`, borderRadius: 8, padding: 14, marginBottom: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Entity Comparison</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              {[['A', compareA, setCompareA], ['B', compareB, setCompareB]].map(([lbl, val, setter]) => (
                <div key={lbl} style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Entity {lbl}</div>
                  <select value={val?.id || ''} onChange={e => setter(ENTITIES.find(x => x.id === +e.target.value) || null)} style={{ width: '100%', padding: '5px 8px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
                    <option value="">-- Select --</option>
                    {ENTITIES.slice(0, 60).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {compareA && compareB && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[compareA, compareB].map((ent, idx) => (
                  <div key={idx} style={{ background: T.sub, borderRadius: 6, padding: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>{ent.name}</div>
                    {[['Type', ent.type], ['Sector', ent.sector], ['Jurisdiction', ent.jurisdiction], ['Risk Score', ent.litigationRiskScore], ['Exposure', fmtUSD(ent.totalExposureUSD)], ['Active Cases', ent.activeCases], ['Disclosure', `${ent.disclosureAdequacy}%`], ['Safe Harbor', ent.safeHarbor ? 'Yes' : 'No'], ['Outcome', ent.outcome]].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ color: T.muted }}>{k}</span>
                        <span style={{ fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Drill-down Panel */}
        {drillEntity && (
          <div style={{ background: T.card, border: `2px solid ${T.indigo}`, borderRadius: 8, padding: 18, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{drillEntity.name} — Litigation Profile</div>
              <button onClick={() => setDrillEntity(null)} style={{ background: T.red, color: '#fff', border: 'none', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 12 }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
              <KpiCard label="Risk Score" value={drillEntity.litigationRiskScore} color={riskColor(drillEntity.litigationRiskScore)} />
              <KpiCard label="Total Exposure" value={fmtUSD(drillEntity.totalExposureUSD)} />
              <KpiCard label="Active Cases" value={drillEntity.activeCases} />
              <KpiCard label="Legal Cost Est." value={fmtUSD(drillEntity.legalCostEstimate)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
              {[['Disclosure', drillEntity.disclosureAdequacy], ['Physical Risk', drillEntity.physicalRiskExposure], ['Transition Risk', drillEntity.transitionRiskExposure], ['Precedent Risk', drillEntity.precedentRisk], ['Reputational', drillEntity.reputationalRisk]].map(([label, val]) => (
                <div key={label} style={{ background: T.sub, borderRadius: 6, padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: riskColor(val) }}>{val}</div>
                  <div style={{ height: 3, background: T.border, borderRadius: 2, marginTop: 5 }}>
                    <div style={{ height: 3, width: `${val}%`, background: riskColor(val), borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: T.muted, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span>Claims: {drillEntity.claimTypes.join(' · ')}</span>
              <span>|</span>
              <span>Safe Harbor: <b>{drillEntity.safeHarbor ? 'Yes' : 'No'}</b></span>
              <span>|</span>
              <span>Outcome: <b>{drillEntity.outcome}</b></span>
              <span>|</span>
              <span>Settled: <b>{drillEntity.settledCases}</b></span>
              <span>|</span>
              <span>Dismissed: <b>{drillEntity.dismissedCases}</b></span>
            </div>
          </div>
        )}

        {/* ── TAB 0: Risk Scorer Dashboard ── */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <KpiCard label="Entities Monitored" value={filtered.length} />
              <KpiCard label="Avg Litigation Risk" value={avgRisk} color={T.amber} />
              <KpiCard label="Total Exposure" value={fmtUSD(filtered.reduce((s, e) => s + e.totalExposureUSD, 0))} color={T.red} />
              <KpiCard label="Active Cases" value={filtered.reduce((s, e) => s + e.activeCases, 0)} color={T.orange} />
              <KpiCard label="Portfolio Lit. VaR" value={fmtUSD(portfolioVaR.base)} color={T.indigo} />
              <KpiCard label="Safe Harbor" value={filtered.filter(e => e.safeHarbor).length} color={T.green} />
              <KpiCard label="Claim HHI" value={claimDist.hhi} sub="concentration" color={T.purple} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Risk Score Distribution (Filtered)</div>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={riskDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Entities" radius={[4, 4, 0, 0]}>
                      {riskDist.map((d, i) => <Cell key={i} fill={i < 2 ? T.green : i < 3 ? T.amber : T.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Top 20 Highest-Risk Entities</div>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={top20} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={95} />
                    <Tooltip />
                    <Bar dataKey="litigationRiskScore" name="Risk Score" radius={[0, 4, 4, 0]}>
                      {top20.map((e, i) => <Cell key={i} fill={riskColor(e.litigationRiskScore)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Entity Type Distribution</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={ENTITY_TYPES.map(t => ({ type: t, count: ENTITIES.filter(e => e.type === t).length }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Count" fill={T.blue} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Avg Risk by Sector</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={SECTORS.map(s => {
                    const ents = ENTITIES.filter(e => e.sector === s);
                    return { sector: s, avg: ents.length ? Math.round(ents.reduce((a, e) => a + e.litigationRiskScore, 0) / ents.length) : 0 };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={45} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="avg" name="Avg Risk" radius={[4, 4, 0, 0]}>
                      {SECTORS.map((s, i) => <Cell key={i} fill={T.indigo} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 1: Entity Database ── */}
        {activeTab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Entity Database — {filtered.length} records</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {[['name', 'Name'], ['type', 'Type'], ['sector', 'Sector'], ['jurisdiction', 'Jur.'], ['litigationRiskScore', 'Risk'], ['totalExposureUSD', 'Exposure'], ['activeCases', 'Active'], ['disclosureAdequacy', 'Disclosure'], ['safeHarbor', 'Safe Harbor'], ['outcome', 'Outcome']].map(([col, label]) => (
                      <th key={col} onClick={() => handleSort(col)} style={{ padding: '7px 9px', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap', borderBottom: `2px solid ${T.border}`, color: sortCol === col ? T.indigo : T.text, userSelect: 'none', fontSize: 11 }}>
                        {label} {sortCol === col ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </th>
                    ))}
                    <th style={{ padding: '7px 9px' }}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((e, i) => (
                    <tr key={e.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 9px', fontWeight: 600, whiteSpace: 'nowrap' }}>{e.name}</td>
                      <td style={{ padding: '6px 9px', color: T.muted }}>{e.type}</td>
                      <td style={{ padding: '6px 9px' }}>{e.sector}</td>
                      <td style={{ padding: '6px 9px' }}>{e.jurisdiction}</td>
                      <td style={{ padding: '6px 9px' }}><RiskBadge val={e.litigationRiskScore} /></td>
                      <td style={{ padding: '6px 9px' }}>{fmtUSD(e.totalExposureUSD)}</td>
                      <td style={{ padding: '6px 9px', textAlign: 'center' }}>{e.activeCases}</td>
                      <td style={{ padding: '6px 9px', textAlign: 'center' }}>{e.disclosureAdequacy}%</td>
                      <td style={{ padding: '6px 9px', textAlign: 'center' }}>{e.safeHarbor ? <span style={{ color: T.green }}>✓</span> : <span style={{ color: T.red }}>✗</span>}</td>
                      <td style={{ padding: '6px 9px' }}>{e.outcome}</td>
                      <td style={{ padding: '6px 9px' }}>
                        <button onClick={() => setDrillEntity(e)} style={{ background: T.indigo, color: '#fff', border: 'none', borderRadius: 3, padding: '2px 7px', fontSize: 10, cursor: 'pointer' }}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 100 && <div style={{ textAlign: 'center', padding: 10, color: T.muted, fontSize: 11 }}>Showing 100 of {filtered.length} — use filters to narrow results</div>}
            </div>
          </div>
        )}

        {/* ── TAB 2: Jurisdiction Analysis ── */}
        {activeTab === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Average Risk Score by Jurisdiction</div>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={jurData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="jur" tick={{ fontSize: 10 }} width={78} />
                    <Tooltip />
                    <Bar dataKey="avgRisk" name="Avg Risk" radius={[0, 4, 4, 0]}>
                      {jurData.map((d, i) => <Cell key={i} fill={riskColor(d.avgRisk)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Exposure by Jurisdiction ($B)</div>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={jurData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="jur" tick={{ fontSize: 10 }} width={78} />
                    <Tooltip formatter={v => [`$${v}B`, 'Exposure']} />
                    <Bar dataKey="exposureB" name="Exposure ($B)" fill={T.blue} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Jurisdiction Risk Ranking</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Rank', 'Jurisdiction', 'Entities', 'Avg Risk', 'Active Cases', 'Exposure ($B)'].map(h => (
                      <th key={h} style={{ padding: '7px 12px', textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jurData.map((d, i) => (
                    <tr key={d.jur} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 12px', fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: '6px 12px', fontWeight: 600 }}>{d.jur}</td>
                      <td style={{ padding: '6px 12px' }}>{d.count}</td>
                      <td style={{ padding: '6px 12px' }}><RiskBadge val={d.avgRisk} /></td>
                      <td style={{ padding: '6px 12px' }}>{d.cases}</td>
                      <td style={{ padding: '6px 12px' }}>${d.exposureB}B</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: Case Database ── */}
        {activeTab === 3 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Claim Type</div>
                <select value={caseClaimFilter} onChange={e => setCaseClaimFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
                  <option>All</option>
                  {CLAIM_TYPES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Jurisdiction</div>
                <select value={caseJurFilter} onChange={e => setCaseJurFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
                  <option>All</option>
                  {JURISDICTIONS.map(j => <option key={j}>{j}</option>)}
                </select>
              </div>
              <div style={{ alignSelf: 'flex-end', fontSize: 12, color: T.muted }}>{filteredCases.length} cases</div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Landmark Case Database</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {[['caseName', 'Case Name'], ['jurisdiction', 'Jur.'], ['filingYear', 'Year'], ['claimType', 'Claim Type'], ['outcome', 'Outcome'], ['financialImpact', 'Impact'], ['precedentLevel', 'Precedent']].map(([col, label]) => (
                        <th key={col} onClick={() => { if (caseSortCol === col) setCaseSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setCaseSortCol(col); setCaseSortDir('desc'); } }} style={{ padding: '7px 9px', textAlign: 'left', cursor: 'pointer', borderBottom: `2px solid ${T.border}`, color: caseSortCol === col ? T.indigo : T.text, userSelect: 'none', whiteSpace: 'nowrap' }}>
                          {label} {caseSortCol === col ? (caseSortDir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map((c, i) => (
                      <tr key={c.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '6px 9px', fontWeight: 600, maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.caseName}</td>
                        <td style={{ padding: '6px 9px' }}>{c.jurisdiction}</td>
                        <td style={{ padding: '6px 9px' }}>{c.filingYear}</td>
                        <td style={{ padding: '6px 9px' }}>{c.claimType}</td>
                        <td style={{ padding: '6px 9px', fontWeight: 600, color: c.outcome === 'Plaintiff Win' ? T.red : c.outcome === 'Defendant Win' ? T.green : T.amber }}>{c.outcome}</td>
                        <td style={{ padding: '6px 9px' }}>{fmtUSD(c.financialImpact)}</td>
                        <td style={{ padding: '6px 9px', fontWeight: 600, color: c.precedentLevel === 'High' ? T.red : c.precedentLevel === 'Medium' ? T.amber : T.muted }}>{c.precedentLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Precedent Level Distribution</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={['High', 'Medium', 'Low'].map(p => ({ level: p, count: LANDMARK_CASES.filter(c => c.precedentLevel === p).length }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="level" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Cases" radius={[4, 4, 0, 0]}>
                    {['High', 'Medium', 'Low'].map((p, i) => <Cell key={i} fill={p === 'High' ? T.red : p === 'Medium' ? T.amber : T.muted} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── TAB 4: Claim Type Analytics ── */}
        {activeTab === 4 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <KpiCard label="Claim HHI" value={claimDist.hhi} sub="0 = equal, 10000 = monopoly" color={claimDist.hhi > 1000 ? T.red : T.green} />
              <KpiCard label="Top Claim" value={claimDist.data[0]?.type?.split(' ').slice(0, 2).join(' ')} />
              <KpiCard label="Top Claim Count" value={claimDist.data[0]?.count} />
              <KpiCard label="Active Claim Types" value={claimDist.data.filter(d => d.count > 0).length} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18, marginBottom: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Claim Type Distribution (Entities)</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={claimDist.data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="type" tick={{ fontSize: 9 }} width={135} />
                    <Tooltip />
                    <Bar dataKey="count" name="Entities" fill={T.blue} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Claim Type Share & HHI Contribution</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Claim Type', 'Count', 'Share%', 'HHI'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {claimDist.data.map((d, i) => (
                      <tr key={d.type} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '5px 8px', fontSize: 10 }}>{d.type}</td>
                        <td style={{ padding: '5px 8px' }}>{d.count}</td>
                        <td style={{ padding: '5px 8px' }}>{d.pct}%</td>
                        <td style={{ padding: '5px 8px', color: d.contrib > 300 ? T.red : T.muted }}>{d.contrib}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: Portfolio Litigation VaR ── */}
        {activeTab === 5 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <KpiCard label="Portfolio Lit. VaR" value={fmtUSD(portfolioVaR.base)} color={T.red} />
              <KpiCard label="VaR ex-Top 10" value={fmtUSD(portfolioVaR.excl)} color={T.amber} />
              <KpiCard label="VaR Reduction" value={fmtUSD(portfolioVaR.reduction)} color={T.green} sub={`${portfolioVaR.reductionPct}% reduction`} />
              <KpiCard label="Total Exposure" value={fmtUSD(filtered.reduce((s, e) => s + e.totalExposureUSD, 0))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18, marginBottom: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>VaR Attribution by Sector ($M)</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={portfolioVaR.sectorAttr.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={45} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => [`$${v}M`, 'Lit. VaR']} />
                    <Bar dataKey="var" name="VaR ($M)" fill={T.red} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>What-If: Exclude Top 10 Risky Entities</div>
                <div style={{ background: T.red + '12', border: `1px solid ${T.red}30`, borderRadius: 6, padding: 12, marginBottom: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.muted }}>Base VaR</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: T.red }}>{fmtUSD(portfolioVaR.base)}</div>
                </div>
                <div style={{ textAlign: 'center', fontSize: 18, color: T.muted, marginBottom: 10 }}>↓ exclude top 10</div>
                <div style={{ background: T.green + '12', border: `1px solid ${T.green}30`, borderRadius: 6, padding: 12, marginBottom: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.muted }}>Reduced VaR</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: T.green }}>{fmtUSD(portfolioVaR.excl)}</div>
                  <div style={{ fontSize: 12, color: T.green }}>−{portfolioVaR.reductionPct}%</div>
                </div>
                <div style={{ marginTop: 8 }}>
                  {portfolioVaR.top10.map((e, i) => (
                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ color: T.muted }}>{i + 1}. {e.name}</span>
                      <span style={{ fontWeight: 600, color: T.red }}>{e.litigationRiskScore}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Exposure × Risk Matrix (Top 30 Entities)</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['#', 'Entity', 'Type', 'Sector', 'Exposure', 'Risk Score', 'Lit. VaR', 'Share%'].map(h => <th key={h} style={{ padding: '6px 9px', textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[...ENTITIES].sort((a, b) => b.totalExposureUSD * b.litigationRiskScore - a.totalExposureUSD * a.litigationRiskScore).slice(0, 30).map((e, i) => {
                      const varE = e.totalExposureUSD * e.litigationRiskScore / 100;
                      const pct = portfolioVaR.base ? (varE / portfolioVaR.base * 100).toFixed(1) : '0';
                      return (
                        <tr key={e.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '5px 9px', fontWeight: 700 }}>{i + 1}</td>
                          <td style={{ padding: '5px 9px', fontWeight: 600 }}>{e.name}</td>
                          <td style={{ padding: '5px 9px', color: T.muted }}>{e.type}</td>
                          <td style={{ padding: '5px 9px' }}>{e.sector}</td>
                          <td style={{ padding: '5px 9px' }}>{fmtUSD(e.totalExposureUSD)}</td>
                          <td style={{ padding: '5px 9px' }}><RiskBadge val={e.litigationRiskScore} /></td>
                          <td style={{ padding: '5px 9px', fontWeight: 600, color: T.red }}>{fmtUSD(varE)}</td>
                          <td style={{ padding: '5px 9px' }}>{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: Summary & Export ── */}
        {activeTab === 6 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
              <KpiCard label="Total Entities" value={ENTITIES.length} />
              <KpiCard label="Filtered Entities" value={filtered.length} />
              <KpiCard label="Landmark Cases" value={LANDMARK_CASES.length} />
              <KpiCard label="Jurisdictions" value={JURISDICTIONS.length} />
              <KpiCard label="Avg Litigation Risk" value={`${filtered.length ? (filtered.reduce((s, e) => s + e.litigationRiskScore, 0) / filtered.length).toFixed(1) : 0}/100`} color={T.amber} />
              <KpiCard label="Total Exposure" value={fmtUSD(ENTITIES.reduce((s, e) => s + e.totalExposureUSD, 0))} color={T.red} />
              <KpiCard label="Total Active Cases" value={ENTITIES.reduce((s, e) => s + e.activeCases, 0)} color={T.orange} />
              <KpiCard label="Portfolio Lit. VaR" value={fmtUSD(portfolioVaR.base)} color={T.indigo} />
              <KpiCard label="Safe Harbor Entities" value={ENTITIES.filter(e => e.safeHarbor).length} color={T.green} />
              <KpiCard label="Claim HHI" value={claimDist.hhi} color={T.purple} />
              <KpiCard label="High Precedent Cases" value={LANDMARK_CASES.filter(c => c.precedentLevel === 'High').length} />
              <KpiCard label="Plaintiff Wins" value={ENTITIES.filter(e => e.outcome === 'Plaintiff Win').length} color={T.red} />
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Full KPI Table — Top 50 by Risk Score</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['#', 'Name', 'Type', 'Sector', 'Jur.', 'Risk', 'Exposure', 'Active', 'Disclosure%', 'Phys', 'Trans', 'Prec', 'Rep', 'Safe', 'Outcome'].map(h => (
                        <th key={h} style={{ padding: '6px 7px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', fontSize: 10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...ENTITIES].sort((a, b) => b.litigationRiskScore - a.litigationRiskScore).slice(0, 50).map((e, i) => (
                      <tr key={e.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '4px 7px' }}>{i + 1}</td>
                        <td style={{ padding: '4px 7px', fontWeight: 600, whiteSpace: 'nowrap' }}>{e.name}</td>
                        <td style={{ padding: '4px 7px', color: T.muted }}>{e.type}</td>
                        <td style={{ padding: '4px 7px' }}>{e.sector}</td>
                        <td style={{ padding: '4px 7px' }}>{e.jurisdiction}</td>
                        <td style={{ padding: '4px 7px' }}><RiskBadge val={e.litigationRiskScore} /></td>
                        <td style={{ padding: '4px 7px' }}>{fmtUSD(e.totalExposureUSD)}</td>
                        <td style={{ padding: '4px 7px', textAlign: 'center' }}>{e.activeCases}</td>
                        <td style={{ padding: '4px 7px', textAlign: 'center' }}>{e.disclosureAdequacy}%</td>
                        <td style={{ padding: '4px 7px', textAlign: 'center' }}>{e.physicalRiskExposure}</td>
                        <td style={{ padding: '4px 7px', textAlign: 'center' }}>{e.transitionRiskExposure}</td>
                        <td style={{ padding: '4px 7px', textAlign: 'center' }}>{e.precedentRisk}</td>
                        <td style={{ padding: '4px 7px', textAlign: 'center' }}>{e.reputationalRisk}</td>
                        <td style={{ padding: '4px 7px', textAlign: 'center' }}>{e.safeHarbor ? '✓' : '✗'}</td>
                        <td style={{ padding: '4px 7px', fontSize: 10 }}>{e.outcome}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: 'center', padding: 8, color: T.muted, fontSize: 11 }}>Top 50 of {ENTITIES.length} total entities</div>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Jurisdiction Risk Heatmap</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {jurData.map(d => (
                  <div key={d.jur} style={{ background: riskColor(d.avgRisk) + '15', border: `1px solid ${riskColor(d.avgRisk)}40`, borderRadius: 6, padding: 8, textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: 11 }}>{d.jur}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: riskColor(d.avgRisk) }}>{d.avgRisk}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>{d.count} entities</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
