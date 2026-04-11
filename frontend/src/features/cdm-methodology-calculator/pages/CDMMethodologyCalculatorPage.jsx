import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const METHODOLOGIES = ['ACM0002','ACM0001','ACM0014','ACM0022','ACM0018','AMS-I.D','AMS-I.F','AMS-II.C','AMS-III.F','AMS-III.G','AR-ACM0003','AM0029','AM0031','AM0067','AMS-III.AU'];
const REGISTRIES = ['CDM','GS','VCS','CAR','ACR'];
const SECTORS = ['Energy Industries','Energy Distribution','Energy Demand','Manufacturing','Chemical Industries','Construction','Transport','Mining/Mineral','Metal Production','Fugitive Emissions','Waste Handling & Disposal','Afforestation/Reforestation','Agriculture','Livestock/Manure','HFC/PFC/SF6'];
const VVBs = ['Bureau Veritas','DNV','SGS','TÜV SÜD','KPMG','EY','PwC','Deloitte','SCS Global','Intertek'];
const COUNTRIES_DATA = ['India','China','Brazil','Kenya','Indonesia','Vietnam','Mexico','Bangladesh','Colombia','Nigeria','Ethiopia','Ghana','Pakistan','Philippines','Thailand','Tanzania','Uganda','South Africa','Morocco','Peru'];
const PROJ_NAMES = ['Rajasthan Wind Farm Bundle','Sichuan Hydropower CDM','Amazon REDD+ Conservation','Rift Valley Geothermal','Sumatra Biogas Recovery','Mekong Solar Irrigation','Yucatan Landfill Gas','Dhaka Cookstoves Programme','Antioquia Run-of-River','Lagos Organic Waste','Addis Ababa LED Retrofit','Accra Composting Facility','Lahore Industrial EE','Mindanao Biomass CHP','Chiang Mai Manure Digester','Dodoma Solar Minigrid','Kampala E-Mobility Pilot','Gauteng Green Cement','Atlas Solar Park','Cusco Afforestation','Gujarat Offshore Wind','Yunnan Forest Carbon','Cerrado Savanna REDD','Nairobi Transit BRT','Java Peat Restoration','Hanoi District Heating EE','Oaxaca Small Hydro','Chittagong Tidal Energy','Bogota Bike Infrastructure','Abuja Solar Home Systems','Tigray Cookstoves','Tema Port Electrification','Karachi Industrial Heat','Davao Coconut Biomass','Nakhon Biomass Gasification','Dar es Salaam BRT','Jinja Sugarcane Bagasse','Durban Landfill Gas','Marrakech Solar Thermal','Lima Micro-Hydro Bundle','Orissa Coal Mine Methane','Guizhou Nitric Acid Plant','Mato Grosso Soy REDD','Mombasa Blue Carbon','Kalimantan Mangrove','Ho Chi Minh Waste-to-Energy','Monterrey Refrigerant Destruction','Sylhet Rice Husk CHP','Cartagena Coastal Resilience','Buenos Aires Transit EE'];

const REG_PRICE = { CDM: [2, 3], GS: [15, 20], VCS: [8, 10], CAR: [12, 10], ACR: [10, 10] };

const PROJECTS = Array.from({ length: 50 }, (_, i) => {
  const registry = REGISTRIES[i % 5];
  const [base, range] = REG_PRICE[registry];
  const price = base + sr(i * 7 + 3) * range;
  const annualER = 5000 + sr(i * 11 + 2) * 195000;
  const creditingYrs = 7 + Math.floor(sr(i * 5 + 1) * 14);
  const vintage = 2016 + Math.floor(sr(i * 3 + 4) * 9);
  const dq = 1 + sr(i * 13 + 5) * 4;
  const issued = annualER * (1 + Math.floor(sr(i * 9 + 6) * 6)) * (0.88 + sr(i * 17 + 1) * 0.1);
  return {
    id: `CDM-${String(i + 1).padStart(3, '0')}`,
    name: PROJ_NAMES[i],
    country: COUNTRIES_DATA[i % 20],
    methodology: METHODOLOGIES[i % 15],
    sector: SECTORS[i % 15],
    annualER_tCO2e: Math.round(annualER),
    carbonPrice_USD: parseFloat(price.toFixed(2)),
    portfolioValue_USD: Math.round(annualER * price * (0.9 + sr(i * 23 + 7) * 0.2)),
    creditingPeriodYrs: creditingYrs,
    vintageYear: vintage,
    registry,
    dqScore: parseFloat(dq.toFixed(1)),
    verificationStatus: ['Verified','Pending','Issued','Under Review'][Math.floor(sr(i * 31 + 8) * 4)],
    vvbName: VVBs[i % 10],
    registrationDate: `${2015 + Math.floor(sr(i * 19 + 9) * 10)}-${String(Math.floor(sr(i * 37 + 10) * 12 + 1)).padStart(2,'0')}-${String(Math.floor(sr(i * 41 + 11) * 28 + 1)).padStart(2,'0')}`,
    issuedCredits: Math.round(issued),
    pendingCredits: Math.round(annualER * (0.05 + sr(i * 43 + 12) * 0.3)),
    uncertainty_pct: parseFloat((2 + sr(i * 47 + 13) * 8).toFixed(1)),
  };
});

const GRID_EF = [
  { country: 'India',        om: 0.820, bm: 0.740, cm: 0.780, year: 2022, type: 'Interconnected' },
  { country: 'China',        om: 0.680, bm: 0.610, cm: 0.650, year: 2022, type: 'Interconnected' },
  { country: 'Brazil',       om: 0.140, bm: 0.120, cm: 0.130, year: 2022, type: 'Interconnected' },
  { country: 'Kenya',        om: 0.410, bm: 0.330, cm: 0.370, year: 2022, type: 'Isolated' },
  { country: 'Indonesia',    om: 0.740, bm: 0.670, cm: 0.710, year: 2022, type: 'Interconnected' },
  { country: 'Vietnam',      om: 0.590, bm: 0.520, cm: 0.560, year: 2022, type: 'Interconnected' },
  { country: 'Mexico',       om: 0.470, bm: 0.440, cm: 0.460, year: 2022, type: 'Interconnected' },
  { country: 'Bangladesh',   om: 0.610, bm: 0.580, cm: 0.600, year: 2022, type: 'Isolated' },
  { country: 'Colombia',     om: 0.280, bm: 0.220, cm: 0.250, year: 2022, type: 'Interconnected' },
  { country: 'Nigeria',      om: 0.550, bm: 0.490, cm: 0.520, year: 2022, type: 'Isolated' },
  { country: 'Ethiopia',     om: 0.020, bm: 0.020, cm: 0.020, year: 2022, type: 'Isolated' },
  { country: 'Ghana',        om: 0.440, bm: 0.390, cm: 0.420, year: 2021, type: 'Isolated' },
  { country: 'Pakistan',     om: 0.460, bm: 0.430, cm: 0.450, year: 2022, type: 'Interconnected' },
  { country: 'Philippines',  om: 0.620, bm: 0.560, cm: 0.590, year: 2022, type: 'Isolated' },
  { country: 'Thailand',     om: 0.510, bm: 0.480, cm: 0.500, year: 2022, type: 'Interconnected' },
  { country: 'Tanzania',     om: 0.380, bm: 0.310, cm: 0.350, year: 2021, type: 'Isolated' },
  { country: 'Uganda',       om: 0.030, bm: 0.030, cm: 0.030, year: 2021, type: 'Isolated' },
  { country: 'South Africa', om: 0.910, bm: 0.840, cm: 0.880, year: 2022, type: 'Interconnected' },
  { country: 'Morocco',      om: 0.630, bm: 0.550, cm: 0.590, year: 2022, type: 'Interconnected' },
  { country: 'Peru',         om: 0.310, bm: 0.270, cm: 0.290, year: 2022, type: 'Interconnected' },
];

const GWP_TABLE = [
  { gas: 'CH₄ (fossil)',  formula: 'CH₄',    ar4: 25,    ar5: 28,    ar6: 29.8  },
  { gas: 'CH₄ (biogenic)',formula: 'CH₄',    ar4: 25,    ar5: 28,    ar6: 27.9  },
  { gas: 'N₂O',           formula: 'N₂O',    ar4: 298,   ar5: 265,   ar6: 273   },
  { gas: 'HFC-23',        formula: 'CHF₃',   ar4: 14800, ar5: 12400, ar6: 14600 },
  { gas: 'HFC-134a',      formula: 'CH₂FCF₃',ar4: 1430,  ar5: 1300,  ar6: 1526  },
  { gas: 'SF₆',           formula: 'SF₆',    ar4: 22800, ar5: 23500, ar6: 25200 },
  { gas: 'NF₃',           formula: 'NF₃',    ar4: 17200, ar5: 16100, ar6: 17400 },
  { gas: 'PFC-14 (CF₄)',  formula: 'CF₄',    ar4: 7390,  ar5: 6630,  ar6: 7380  },
];

const PRICE_CURVES = {
  CDM: [{ yr: 2020, p: 1.2 },{ yr: 2021, p: 1.8 },{ yr: 2022, p: 2.1 },{ yr: 2023, p: 2.8 },{ yr: 2024, p: 3.5 }],
  GS:  [{ yr: 2020, p: 8 },  { yr: 2021, p: 11 }, { yr: 2022, p: 16 }, { yr: 2023, p: 18 }, { yr: 2024, p: 22 }],
  VCS: [{ yr: 2020, p: 4 },  { yr: 2021, p: 6 },  { yr: 2022, p: 9 },  { yr: 2023, p: 11 }, { yr: 2024, p: 14 }],
  CAR: [{ yr: 2020, p: 7 },  { yr: 2021, p: 10 }, { yr: 2022, p: 13 }, { yr: 2023, p: 16 }, { yr: 2024, p: 19 }],
  ACR: [{ yr: 2020, p: 6 },  { yr: 2021, p: 9 },  { yr: 2022, p: 11 }, { yr: 2023, p: 13 }, { yr: 2024, p: 16 }],
};

const TABS = ['Portfolio Dashboard','ACM0002 Calculator','ACM0014 Waste Sector','AMS Small-Scale Suite','IPCC GWP & EFs','Vintage & Pricing','Monitoring Compliance','Registry & Issuance'];

const fmt  = (n, d = 0) => n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtM = n => `$${(n / 1e6).toFixed(2)}M`;

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Badge = ({ status }) => {
  const map = { Verified: T.green, Issued: T.teal, Pending: T.amber, 'Under Review': T.blue };
  const c = map[status] || T.textSec;
  return <span style={{ background: c + '22', color: c, border: `1px solid ${c}55`, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontFamily: T.fontMono }}>{status}</span>;
};

const RegBox = ({ title, refs }) => (
  <div style={{ background: T.navy + '08', border: `1px solid ${T.navy}22`, borderRadius: 6, padding: '10px 14px', marginBottom: 16 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, fontFamily: T.fontMono, marginBottom: 4 }}>{title}</div>
    {refs.map((r, i) => <div key={i} style={{ fontSize: 11, color: T.textSec }}>{r}</div>)}
  </div>
);

const FormulaBox = ({ lines }) => (
  <div style={{ background: '#0a0a1a', borderRadius: 8, padding: '14px 18px', fontFamily: T.fontMono, fontSize: 12, color: '#e2e8f0', lineHeight: 1.85 }}>
    {lines.map((l, i) => (
      <div key={i} style={{ color: l.startsWith('STEP') ? '#fbbf24' : l.startsWith('  ') ? '#86efac' : '#e2e8f0', whiteSpace: 'pre' }}>{l}</div>
    ))}
  </div>
);

const SliderRow = ({ label, val, setVal, min, max, step = 1, unit = '' }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
      <span style={{ fontSize: 12, color: T.textSec, fontFamily: T.fontMono }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>{fmt(val, step < 1 ? 3 : 0)}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={val} onChange={e => setVal(Number(e.target.value))}
      style={{ width: '100%', accentColor: T.navy }} />
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 10, color: T.textSec }}>{min}{unit}</span>
      <span style={{ fontSize: 10, color: T.textSec }}>{max}{unit}</span>
    </div>
  </div>
);

export default function CDMMethodologyCalculatorPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [sortField, setSortField]   = useState('portfolioValue_USD');
  const [sortDir, setSortDir]       = useState('desc');
  const [filterReg, setFilterReg]   = useState('All');
  const [filterSt,  setFilterSt]    = useState('All');

  // ACM0002 state
  const [egY,       setEgY]       = useState(50000);
  const [efGrid,    setEfGrid]    = useState(0.72);
  const [peY,       setPeY]       = useState(800);
  const [leY,       setLeY]       = useState(200);
  const [calcPrice, setCalcPrice] = useState(12);

  // ACM0014 state
  const [wasteTonnes,  setWasteTonnes]  = useState(50000);
  const [docFraction,  setDocFraction]  = useState(0.15);
  const [mcf,          setMcf]          = useState(0.80);
  const [oxidFactor,   setOxidFactor]   = useState(0.10);

  // AMS tab & state
  const [amsTab,     setAmsTab]     = useState(0);
  const [amsEg,      setAmsEg]      = useState(8000);
  const [amsEf,      setAmsEf]      = useState(0.65);
  const [amsBec,     setAmsBec]     = useState(120000);
  const [amsPec,     setAmsPec]     = useState(85000);
  const [amsHours,   setAmsHours]   = useState(6000);
  const [amsAnimals, setAmsAnimals] = useState(5000);
  const [amsVs,      setAmsVs]      = useState(3.5);
  const [amsB0,      setAmsB0]      = useState(0.24);
  const [amsMcf,     setAmsMcf]     = useState(0.55);

  // TOOL07 state
  const [selCountry, setSelCountry] = useState('India');
  const [wOm,        setWOm]        = useState(0.5);

  // Monitoring state
  const [monIdx, setMonIdx] = useState(0);

  const sortedProjects = useMemo(() => {
    let p = [...PROJECTS];
    if (filterReg !== 'All') p = p.filter(x => x.registry === filterReg);
    if (filterSt  !== 'All') p = p.filter(x => x.verificationStatus === filterSt);
    return p.sort((a, b) => {
      const av = a[sortField], bv = b[sortField];
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [sortField, sortDir, filterReg, filterSt]);

  const kpis = useMemo(() => {
    const totalER  = PROJECTS.reduce((s, p) => s + p.annualER_tCO2e, 0);
    const totalWgt = PROJECTS.reduce((s, p) => s + p.annualER_tCO2e * p.carbonPrice_USD, 0);
    return {
      total:    PROJECTS.reduce((s, p) => s + p.issuedCredits + p.pendingCredits, 0),
      totalVal: PROJECTS.reduce((s, p) => s + p.portfolioValue_USD, 0),
      wavgPrice: totalER > 0 ? totalWgt / totalER : 0,
      verified: PROJECTS.filter(p => p.verificationStatus === 'Verified' || p.verificationStatus === 'Issued').reduce((s, p) => s + p.issuedCredits, 0),
      pending:  PROJECTS.reduce((s, p) => s + p.pendingCredits, 0),
      avgDq:    PROJECTS.reduce((s, p) => s + p.dqScore, 0) / Math.max(1, PROJECTS.length),
    };
  }, []);

  const handleSort = field => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const acm2 = useMemo(() => {
    const beY = egY * efGrid;
    const erY = beY - peY - leY;
    return { beY, erY, rev: erY * calcPrice, rev20p: erY * calcPrice * 1.2, rev20m: erY * calcPrice * 0.8, revStress: erY * 2 };
  }, [egY, efGrid, peY, leY, calcPrice]);

  const acm14 = useMemo(() => {
    const DOCf = 0.50, F = 0.50;
    const base = wasteTonnes * docFraction * DOCf * F * (16 / 12) * mcf * (1 - oxidFactor);
    return { base, erAR4: base * 25, erAR5: base * 28, erAR6: base * 27.9 };
  }, [wasteTonnes, docFraction, mcf, oxidFactor]);

  const amsCalcs = useMemo(() => ({
    amsID:   Math.max(0, amsEg * amsEf - 500),
    amsIIC:  Math.max(0, (amsBec - amsPec) * 0.00065 * amsHours),
    amsIIIF: amsAnimals * amsVs * amsB0 * amsMcf * 27.9 * 0.9 * 0.67 * 365 / 1000,
  }), [amsEg, amsEf, amsBec, amsPec, amsHours, amsAnimals, amsVs, amsB0, amsMcf]);

  const portfolioNPV = useMemo(() =>
    PROJECTS.map(p => {
      let npv = 0;
      const cf = p.annualER_tCO2e * p.carbonPrice_USD;
      for (let t = 1; t <= p.creditingPeriodYrs; t++) npv += cf / Math.pow(1.08, t);
      return { ...p, npv };
    }), []);

  const totalNPV = portfolioNPV.reduce((s, p) => s + p.npv, 0);

  const vintageByYear = useMemo(() => {
    const map = {};
    PROJECTS.forEach(p => { map[p.vintageYear] = (map[p.vintageYear] || 0) + p.issuedCredits; });
    return [...Object.entries(map)].sort((a, b) => a[0] - b[0]);
  }, []);

  const countryEf = GRID_EF.find(g => g.country === selCountry) || GRID_EF[0];
  const efCm = parseFloat((wOm * countryEf.om + (1 - wOm) * countryEf.bm).toFixed(4));

  const monProj = PROJECTS[monIdx];
  const MON_CHECKS = [
    'Measurement equipment calibrated and in-place',
    'Monitoring frequency defined (monthly/quarterly/annual)',
    'QA/QC procedures documented',
    'Equipment failure backup protocol',
    'Data storage and archiving (10-year retention)',
    'Default factor update review (annual)',
    'GHG calculation methodology version current',
    'Monitoring report signed by project developer',
  ];
  const monStatus = MON_CHECKS.map((_, ci) => sr(monIdx * 100 + ci) > 0.25);

  const thS = field => ({
    padding: '8px 10px', background: T.sub, fontSize: 11, fontFamily: T.fontMono,
    color: sortField === field ? T.navy : T.textSec, textAlign: 'left', cursor: 'pointer',
    fontWeight: sortField === field ? 700 : 400, whiteSpace: 'nowrap',
    borderBottom: `1px solid ${T.border}`,
  });
  const tdS = { padding: '7px 10px', fontSize: 12, color: T.textPri, borderBottom: `1px solid ${T.borderL}`, verticalAlign: 'middle' };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '24px 32px', fontFamily: 'DM Sans, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 4, height: 36, background: T.gold, borderRadius: 2 }} />
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: T.navy }}>CDM Methodology Calculator</div>
            <div style={{ fontSize: 12, color: T.textSec, fontFamily: T.fontMono }}>UNFCCC CDM · Gold Standard · Verra VCS · CAR · ACR — Flagship Calculation Engine v19</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[['CDM-EB47 Annex 13', T.navy],['IPCC AR6 GWP100', T.sage],['ISO 14064-3:2019', T.indigo],['50 Projects · 15 UNFCCC Sectors', T.gold],['TOOL07 v4', T.teal]].map(([l, c]) => (
            <span key={l} style={{ fontSize: 11, background: c + '14', color: c, padding: '3px 10px', borderRadius: 4, fontFamily: T.fontMono }}>{l}</span>
          ))}
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)} style={{
            padding: '9px 15px', fontSize: 12, fontWeight: activeTab === i ? 700 : 500,
            color: activeTab === i ? T.navy : T.textSec, background: 'none', border: 'none',
            borderBottom: activeTab === i ? `3px solid ${T.navy}` : '3px solid transparent',
            cursor: 'pointer', fontFamily: T.fontMono, whiteSpace: 'nowrap', marginBottom: -2,
          }}>{t}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 0 — Portfolio Dashboard
      ══════════════════════════════════════════════════════ */}
      {activeTab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
            <KpiCard label="Total Portfolio Credits" value={fmt(kpis.total)} sub="tCO2e issued + pending" color={T.teal} />
            <KpiCard label="Portfolio Value" value={fmtM(kpis.totalVal)} sub="at current carbon prices" color={T.navy} />
            <KpiCard label="Wt. Avg Carbon Price" value={`$${kpis.wavgPrice.toFixed(2)}/t`} sub="ER-weighted across registries" color={T.gold} />
            <KpiCard label="Verified Credits YTD" value={fmt(kpis.verified)} sub="Verified + Issued status" color={T.green} />
            <KpiCard label="Pending Issuance" value={fmt(kpis.pending)} sub="tCO2e awaiting verification" color={T.amber} />
            <KpiCard label="Avg DQ Score" value={kpis.avgDq.toFixed(2)} sub="IPCC DQI scale 1–5" color={T.indigo} />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {['All', ...REGISTRIES].map(r => (
              <button key={r} onClick={() => setFilterReg(r)} style={{
                padding: '4px 12px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
                background: filterReg === r ? T.navy : T.card,
                color: filterReg === r ? '#fff' : T.textSec,
                border: `1px solid ${T.border}`, fontFamily: T.fontMono,
              }}>{r}</button>
            ))}
            <span style={{ borderLeft: `1px solid ${T.border}`, margin: '0 6px' }} />
            {['All','Verified','Issued','Pending','Under Review'].map(s => (
              <button key={s} onClick={() => setFilterSt(s)} style={{
                padding: '4px 12px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
                background: filterSt === s ? T.indigo : T.card,
                color: filterSt === s ? '#fff' : T.textSec,
                border: `1px solid ${T.border}`, fontFamily: T.fontMono,
              }}>{s}</button>
            ))}
          </div>

          <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${T.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {[['id','ID'],['name','Project Name'],['methodology','Methodology'],['country','Country'],['registry','Registry'],['annualER_tCO2e','Annual ER (t)'],['carbonPrice_USD','Price $/t'],['portfolioValue_USD','Value'],['vintageYear','Vintage'],['verificationStatus','Status'],['vvbName','VVB'],['dqScore','DQ']].map(([f, l]) => (
                    <th key={f} style={thS(f)} onClick={() => handleSort(f)}>{l}{sortField === f ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedProjects.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ ...tdS, fontFamily: T.fontMono, fontSize: 11, color: T.indigo }}>{p.id}</td>
                    <td style={{ ...tdS, fontWeight: 500, maxWidth: 170, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</td>
                    <td style={{ ...tdS, fontFamily: T.fontMono, fontSize: 11 }}>{p.methodology}</td>
                    <td style={tdS}>{p.country}</td>
                    <td style={{ ...tdS, fontFamily: T.fontMono, fontSize: 11 }}>
                      <span style={{ background: T.gold + '18', color: T.gold, padding: '2px 7px', borderRadius: 3, fontWeight: 700 }}>{p.registry}</span>
                    </td>
                    <td style={{ ...tdS, textAlign: 'right' }}>{fmt(p.annualER_tCO2e)}</td>
                    <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono }}>${p.carbonPrice_USD.toFixed(2)}</td>
                    <td style={{ ...tdS, textAlign: 'right' }}>{fmtM(p.portfolioValue_USD)}</td>
                    <td style={{ ...tdS, textAlign: 'center', fontFamily: T.fontMono }}>{p.vintageYear}</td>
                    <td style={tdS}><Badge status={p.verificationStatus} /></td>
                    <td style={{ ...tdS, fontSize: 11 }}>{p.vvbName}</td>
                    <td style={{ ...tdS, textAlign: 'center', fontWeight: 700, color: p.dqScore >= 4 ? T.green : p.dqScore >= 3 ? T.amber : T.red }}>{p.dqScore.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 8, padding: '7px 12px', background: T.sub, borderRadius: 6, fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>
            IPCC AR6 GWP100 (CDM note): CH₄ biogenic=27.9 · CH₄ fossil=29.8 · N₂O=273 · HFC-23=14,600 · SF₆=25,200 · NF₃=17,400 · PFC-14=7,380 | Source: IPCC AR6 WGI Table 7.SM.7 (2021, erratum Mar 2022)
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 1 — ACM0002 Live Calculator
      ══════════════════════════════════════════════════════ */}
      {activeTab === 1 && (
        <div>
          <RegBox
            title="UNFCCC CDM — ACM0002 v19 | Grid-Connected Renewable Energy Systems"
            refs={[
              'Ref: CDM-EB47 Annex 13 · TOOL07 v4 · IPCC AR6 GWP100 · Decision 4/CMP.1',
              'Scope: Wind · Solar PV · Run-of-River Hydro · Geothermal · Biomass displacing fossil generation',
              'ER_y = BE_y − PE_y − LE_y  (net emission reductions per crediting year, tCO2e)',
            ]}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Input Parameters — ACM0002 v19</div>
              <SliderRow label="EG_y — Net electricity generated (MWh/yr)" val={egY} setVal={setEgY} min={1000} max={500000} step={1000} unit=" MWh" />
              <SliderRow label="EF_grid,CM — Combined margin EF (tCO2e/MWh)" val={efGrid} setVal={setEfGrid} min={0.1} max={1.5} step={0.01} unit=" tCO2e/MWh" />
              <SliderRow label="PE_y — Project emissions (tCO2e/yr)" val={peY} setVal={setPeY} min={0} max={50000} step={100} unit=" tCO2e" />
              <SliderRow label="LE_y — Leakage emissions (tCO2e/yr)" val={leY} setVal={setLeY} min={0} max={20000} step={100} unit=" tCO2e" />
              <SliderRow label="Carbon price ($/tCO2e)" val={calcPrice} setVal={setCalcPrice} min={1} max={50} step={0.5} unit=" $/t" />

              <div style={{ marginTop: 16, background: T.sub, borderRadius: 6, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, fontFamily: T.fontMono, marginBottom: 8 }}>TOOL07 v4 — GRID EMISSION FACTOR</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <select value={selCountry} onChange={e => setSelCountry(e.target.value)} style={{ padding: '5px 8px', borderRadius: 5, border: `1px solid ${T.border}`, fontSize: 11, fontFamily: T.fontMono }}>
                    {GRID_EF.map(g => <option key={g.country}>{g.country}</option>)}
                  </select>
                  <div style={{ fontSize: 12, fontFamily: T.fontMono }}>
                    OM: <b style={{ color: T.navy }}>{countryEf.om}</b> · BM: <b style={{ color: T.navy }}>{countryEf.bm}</b> · CM: <b style={{ color: T.gold }}>{efCm}</b> tCO2e/MWh
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono }}>w_OM: {wOm.toFixed(1)}</label>
                  <input type="range" min={0} max={1} step={0.1} value={wOm} onChange={e => setWOm(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
                </div>
              </div>
            </div>

            <div>
              <FormulaBox lines={[
                'STEP 1: Baseline Emissions',
                `  BE_y = EG_y × EF_grid,CM`,
                `        = ${fmt(egY)} MWh × ${efGrid} tCO2e/MWh`,
                `        = ${fmt(acm2.beY, 1)} tCO2e/yr`,
                '',
                'STEP 2: Project Emissions (direct)',
                `  PE_y = ${fmt(peY)} tCO2e/yr`,
                '',
                'STEP 3: Leakage Emissions',
                `  LE_y = ${fmt(leY)} tCO2e (upstream fuel supply)`,
                '',
                'STEP 4: Emission Reductions',
                `  ER_y = BE_y − PE_y − LE_y`,
                `       = ${fmt(acm2.beY, 1)} − ${fmt(peY)} − ${fmt(leY)}`,
                `       = ${fmt(acm2.erY, 1)} tCO2e/yr`,
                '',
                'STEP 5: Annual Revenue',
                `  Revenue = ER_y × Price`,
                `          = ${fmt(acm2.erY, 1)} × $${calcPrice.toFixed(2)}/t`,
                `          = $${fmt(acm2.rev, 0)} per year`,
              ]} />

              <div style={{ marginTop: 14, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>CER Issuance Value — Scenario Analysis</div>
                {[
                  { label: 'At spot price', val: acm2.rev,       color: T.navy  },
                  { label: 'Upside +20%',   val: acm2.rev20p,    color: T.green },
                  { label: 'Downside −20%', val: acm2.rev20m,    color: T.amber },
                  { label: 'Stress $2/t',   val: acm2.revStress, color: T.red   },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ fontSize: 12, color: T.textSec }}>{s.label}</span>
                    <span style={{ fontFamily: T.fontMono, fontWeight: 700, color: s.color }}>${fmt(s.val, 0)}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14, background: T.sub, borderRadius: 8, padding: '12px 16px', fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: T.navy, marginBottom: 6 }}>Sensitivity at Carbon Prices</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{[5,10,15,20,25,35,50].map(p => <th key={p} style={{ padding: '4px 6px', fontSize: 11, fontFamily: T.fontMono, color: T.textSec }}>${p}</th>)}</tr></thead>
                  <tbody><tr>{[5,10,15,20,25,35,50].map(p => <td key={p} style={{ padding: '4px 6px', textAlign: 'center', fontFamily: T.fontMono, fontSize: 11, color: T.navy, fontWeight: 600 }}>{fmtM(acm2.erY * p)}</td>)}</tr></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2 — ACM0014 Waste Sector
      ══════════════════════════════════════════════════════ */}
      {activeTab === 2 && (
        <div>
          <RegBox
            title="ACM0014 v8 | Avoided Methane Emissions from Organic Waste Treatment"
            refs={[
              'Ref: CDM EB ACM0014 Version 8.0.0 | IPCC AR6 WGI GWP100: CH₄ (biogenic) = 27.9',
              'Formula: ER = Σᵢ [Qᵢ × DOCᵢ × DOCf × F × (16/12) × MCFᵢ × (1−OXᵢ)] × GWP_CH4 − PE',
              'CDM default GWP (AR4) = 25; AR6 update material for new GS/VCS projects',
            ]}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>ACM0014 Input Parameters</div>
              <SliderRow label="Q — Waste quantity diverted (t/yr)" val={wasteTonnes} setVal={setWasteTonnes} min={1000} max={500000} step={1000} unit=" t" />
              <SliderRow label="DOC — Degradable organic carbon fraction" val={docFraction} setVal={setDocFraction} min={0.05} max={0.25} step={0.01} />
              <SliderRow label="MCF — Methane correction factor" val={mcf} setVal={setMcf} min={0.40} max={1.0} step={0.05} />
              <SliderRow label="OX — Oxidation factor" val={oxidFactor} setVal={setOxidFactor} min={0.0} max={0.1} step={0.01} />

              <div style={{ marginTop: 16, background: T.sub, borderRadius: 6, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, fontFamily: T.fontMono, marginBottom: 8 }}>DOC BY WASTE TYPE (IPCC 2006 GL §10.2)</div>
                {[['Food waste','0.15'],['Paper / cardboard','0.40'],['Garden / green waste','0.20'],['Wood waste','0.43'],['Textiles','0.24'],['Sludge','0.05']].map(([t, v]) => (
                  <div key={t} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ color: T.textSec }}>{t}</span>
                    <span style={{ fontFamily: T.fontMono, color: T.navy, fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <FormulaBox lines={[
                'ACM0014 v8 — Step-by-Step Calculation',
                '',
                `  Q     = ${fmt(wasteTonnes)} t/yr (waste diverted)`,
                `  DOC   = ${docFraction}  (degradable organic carbon)`,
                `  DOCf  = 0.50 (fraction of DOC decomposing, IPCC 2006)`,
                `  F     = 0.50 (CH₄ fraction in landfill gas)`,
                `  MCF   = ${mcf}  (methane correction factor)`,
                `  OX    = ${oxidFactor}  (oxidation factor)`,
                '',
                'STEP 1: Raw CH₄ mass (tCH₄)',
                `  = Q × DOC × DOCf × F × (16/12)`,
                `  = ${fmt(wasteTonnes * docFraction * 0.5 * 0.5 * 1.333, 1)} tCH₄`,
                '',
                'STEP 2: Net CH₄ with MCF and OX',
                `  × MCF(${mcf}) × (1−OX)(${(1 - oxidFactor).toFixed(2)})`,
                `  = ${fmt(acm14.base, 1)} tCH₄/yr`,
                '',
                'STEP 3: GWP Comparison (tCO2e/yr)',
                `  AR4 (GWP_CH4 = 25.0): ${fmt(acm14.erAR4, 0)} tCO2e`,
                `  AR5 (GWP_CH4 = 28.0): ${fmt(acm14.erAR5, 0)} tCO2e`,
                `  AR6 (GWP_CH4 = 27.9): ${fmt(acm14.erAR6, 0)} tCO2e`,
                `  AR4→AR6 delta: ${fmt(acm14.erAR6 - acm14.erAR4, 0)} tCO2e (${((acm14.erAR6 / Math.max(1, acm14.erAR4) - 1) * 100).toFixed(1)}%)`,
              ]} />

              <div style={{ marginTop: 14, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 10 }}>AMS-III.G v12 — Landfill Gas Recovery & Utilisation</div>
                <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 8 }}>ER = Q_LFG × x_CH4 × GWP_CH4 × (1−OX) − PE</div>
                {[
                  ['Q_LFG (LFG generated)', `${fmt(wasteTonnes * 0.15, 0)} m³/yr`],
                  ['x_CH4 (CH4 volume fraction)', '0.50'],
                  ['GWP_CH4 (AR6 biogenic)', '27.9'],
                  ['OX factor', oxidFactor.toString()],
                  ['Estimated Gross ER', `${fmt(wasteTonnes * 0.15 * 0.5 * 0.00072 * 27.9 * (1 - oxidFactor), 0)} tCO2e/yr`],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ color: T.textSec }}>{l}</span>
                    <span style={{ fontFamily: T.fontMono, fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 3 — AMS Small-Scale Suite
      ══════════════════════════════════════════════════════ */}
      {activeTab === 3 && (
        <div>
          <RegBox
            title="UNFCCC CDM — AMS Small-Scale Methodologies Suite (Type I / II / III)"
            refs={[
              'Simplified Modalities & Procedures for SSC CDM: Decision 17/CP.7 Annex II',
              'Capacity limits: Type I <15MW, Type II <60GWh/yr, Type III <15kt CO2e/yr',
              'Bundling: aggregate capacity ≤15MW for Type I; Additionality via TOOL21',
            ]}
          />
          <div style={{ display: 'flex', gap: 0, marginBottom: 18 }}>
            {['AMS-I.D — Grid Renewable (<15 MW)','AMS-II.C — EE Equipment (Industry)','AMS-III.F — Manure Management'].map((t, i) => (
              <button key={i} onClick={() => setAmsTab(i)} style={{
                padding: '8px 18px', fontSize: 11, cursor: 'pointer', fontFamily: T.fontMono,
                background: amsTab === i ? T.navy : T.card,
                color: amsTab === i ? '#fff' : T.textSec,
                border: `1px solid ${T.border}`,
                borderRadius: i === 0 ? '6px 0 0 6px' : i === 2 ? '0 6px 6px 0' : '0',
              }}>{t}</button>
            ))}
          </div>

          {amsTab === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>AMS-I.D v18 — Grid-Connected RE (&lt;15 MW)</div>
                <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 14 }}>ER = EG × EF_grid − PE | Capacity limit: 15 MW · 60 GWh/yr</div>
                <SliderRow label="EG — Annual electricity generated (MWh/yr)" val={amsEg} setVal={setAmsEg} min={500} max={60000} step={500} unit=" MWh" />
                <SliderRow label="EF_grid (tCO2e/MWh)" val={amsEf} setVal={setAmsEf} min={0.1} max={1.2} step={0.01} />
                <div style={{ padding: '10px 14px', background: amsEg < 60000 ? T.green + '12' : T.amber + '12', borderRadius: 6, marginTop: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: amsEg < 60000 ? T.green : T.amber }}>
                    Implied capacity ~{(amsEg / 8760 * 1000).toFixed(0)} kW — {amsEg < 60000 ? 'WITHIN 60 GWh limit' : 'EXCEEDS limit — use ACM0002'}
                  </div>
                </div>
                <div style={{ fontFamily: T.fontMono, fontSize: 14, color: T.navy, fontWeight: 700 }}>
                  ER = {fmt(amsEg)} × {amsEf} − 500 = <span style={{ color: T.green }}>{fmt(amsCalcs.amsID, 0)} tCO2e/yr</span>
                </div>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>AMS-I.D Reference Data</div>
                {[['Methodology version','AMS-I.D v18.0.0'],['Applicable technologies','Wind · Solar PV · SWH · Small Hydro · Biomass'],['Regulatory limit','<15 MW installed capacity'],['Annual generation cap','<60 GWh/yr'],['GHG limit','<15 kt CO2e/yr (Type I)'],['Metering requirement','IEC Class 0.5 energy meter'],['Baseline approach','TOOL07 v4 grid EF'],['Verification frequency','Annual or biennial'],['Crediting period','7yr fixed or 3×7yr renewable'],['DOE/VVB requirement','UNFCCC EB accredited']].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ color: T.textSec }}>{l}</span>
                    <span style={{ fontFamily: T.fontMono, fontSize: 11 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {amsTab === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>AMS-II.C v15 — Energy Efficiency — Equipment (Industrial)</div>
                <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 14 }}>ER = (B_EC − P_EC) × EF_grid × n_hours</div>
                <SliderRow label="B_EC — Baseline energy consumption (kWh/unit)" val={amsBec} setVal={setAmsBec} min={10000} max={500000} step={5000} unit=" kWh" />
                <SliderRow label="P_EC — Project energy consumption (kWh/unit)" val={amsPec} setVal={setAmsPec} min={5000} max={450000} step={5000} unit=" kWh" />
                <SliderRow label="n_hours — Annual operating hours" val={amsHours} setVal={setAmsHours} min={1000} max={8760} step={100} unit=" hrs" />
                <div style={{ marginTop: 14, fontFamily: T.fontMono, fontSize: 14, color: T.navy, fontWeight: 700 }}>
                  ER = ({fmt(amsBec)} − {fmt(amsPec)}) × 0.00065 × {fmt(amsHours)} = <span style={{ color: T.green }}>{fmt(amsCalcs.amsIIC, 0)} tCO2e/yr</span>
                </div>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>AMS-II.C Reference Data</div>
                {[['Methodology version','AMS-II.C v15.0.0'],['Applicable sectors','Industrial motors · HVAC · Lighting · Pumps'],['Type','Type II — Energy Efficiency'],['GHG limit','<60 GWh equiv/yr'],['Metering','Submetering at equipment level'],['Baseline','TOOL03 — project lifetime & degradation'],['Leakage','Upstream only; typically de minimis'],['Crediting period','7yr fixed or 3×7yr renewable']].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ color: T.textSec }}>{l}</span>
                    <span style={{ fontFamily: T.fontMono, fontSize: 11 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {amsTab === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>AMS-III.F v11 — Avoidance of Methane — Manure Management</div>
                <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 14 }}>ER = N × VS × B₀ × MCF × GWP_CH4 × LR × 0.67 × 365 / 1000</div>
                <SliderRow label="N — Number of animals (head)" val={amsAnimals} setVal={setAmsAnimals} min={100} max={50000} step={100} />
                <SliderRow label="VS — Volatile solids (kg/head/day)" val={amsVs} setVal={setAmsVs} min={1.0} max={10.0} step={0.1} />
                <SliderRow label="B₀ — Max methane potential (m³CH4/kg VS)" val={amsB0} setVal={setAmsB0} min={0.1} max={0.45} step={0.01} />
                <SliderRow label="MCF — Methane conversion factor" val={amsMcf} setVal={setAmsMcf} min={0.1} max={1.0} step={0.05} />
                <div style={{ marginTop: 14, fontFamily: T.fontMono, fontSize: 14, color: T.navy, fontWeight: 700 }}>
                  ER = <span style={{ color: T.green }}>{fmt(amsCalcs.amsIIIF, 0)} tCO2e/yr</span> (GWP_CH4=27.9, LR=0.9)
                </div>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 12 }}>AMS-III.F Parameter Reference</div>
                {[['N × VS','Total volatile solids production (IPCC 2006 GL)'],['B₀','IPCC 2006 Table 10.16 by livestock type'],['MCF','By manure mgmt system (IPCC Table 10.17)'],['0.67 kg/m³','Density of CH₄ at STP (standard)'],['GWP_CH4','27.9 (AR6 biogenic) or 25 (AR4 CDM default)'],['LR = 0.90','Leakage reduction fraction (covered digesters)'],['×365','Days per year conversion'],['Type','Type III — Other project activities']].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.indigo }}>{l}</span>
                    <span style={{ color: T.textSec, fontSize: 11, maxWidth: 200, textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 4 — IPCC GWP & Emission Factors
      ══════════════════════════════════════════════════════ */}
      {activeTab === 4 && (
        <div>
          <RegBox
            title="IPCC AR6 WGI (2021) — Global Warming Potentials (100-year Horizon)"
            refs={[
              'Source: IPCC AR6 WGI Chapter 7, Table 7.SM.7 (2021) — Erratum corrected March 2022',
              'CDM EB Decision: CDM projects use AR4 GWPs by default unless EB issues specific guidance',
              'Impact: AR4→AR6 CH₄ biogenic +11.6% — material for waste/agriculture/livestock projects',
            ]}
          />
          <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Gas','Formula','AR4 GWP100','AR5 GWP100','AR6 GWP100','AR4→AR6 Δ','CDM / Reg Status'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontFamily: T.fontMono, color: T.textSec, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GWP_TABLE.map((row, i) => {
                  const pct = ((row.ar6 / row.ar4 - 1) * 100).toFixed(1);
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ ...tdS, fontWeight: 600 }}>{row.gas}</td>
                      <td style={{ ...tdS, fontFamily: T.fontMono, color: T.indigo }}>{row.formula}</td>
                      <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono }}>{fmt(row.ar4)}</td>
                      <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono }}>{fmt(row.ar5)}</td>
                      <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono, fontWeight: 700, color: T.navy }}>{fmt(row.ar6)}</td>
                      <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono, color: parseFloat(pct) > 0 ? T.red : T.green }}>{pct > 0 ? '+' : ''}{pct}%</td>
                      <td style={{ ...tdS, fontSize: 11 }}>{row.gas.includes('CH') || row.gas.includes('N₂O') ? 'AR4 default per EB' : 'AR4/AR5 varies by methodology'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>TOOL07 v4 — Grid Emission Factors (20 Countries)</div>
          <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${T.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Country','OM (tCO2e/MWh)','BM (tCO2e/MWh)','CM (tCO2e/MWh)','Source Year','Grid Type','±15% Sensitivity'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontFamily: T.fontMono, color: T.textSec, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GRID_EF.map((g, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ ...tdS, fontWeight: 600 }}>{g.country}</td>
                    <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono }}>{g.om.toFixed(3)}</td>
                    <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono }}>{g.bm.toFixed(3)}</td>
                    <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono, fontWeight: 700, color: T.navy }}>{g.cm.toFixed(3)}</td>
                    <td style={{ ...tdS, textAlign: 'center', fontFamily: T.fontMono }}>{g.year}</td>
                    <td style={tdS}>{g.type}</td>
                    <td style={{ ...tdS, fontFamily: T.fontMono, fontSize: 11, color: T.textSec }}>{(g.cm * 0.85).toFixed(3)} — {(g.cm * 1.15).toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 5 — Vintage & Forward Pricing
      ══════════════════════════════════════════════════════ */}
      {activeTab === 5 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Carbon Price Curves by Registry (2020–2024) — Spot & Premium Factors</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
            {Object.entries(PRICE_CURVES).map(([reg, data]) => (
              <div key={reg} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 10, fontFamily: T.fontMono }}>{reg}</div>
                {data.map((d, i) => {
                  const spot = parseFloat((d.p * (0.9 + sr(i * 7 + reg.length) * 0.2)).toFixed(2));
                  return (
                    <div key={d.yr} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <span style={{ color: T.textSec }}>{d.yr}</span>
                      <span style={{ fontFamily: T.fontMono, fontWeight: d.yr === 2024 ? 700 : 400, color: d.yr === 2024 ? T.navy : T.textPri }}>${spot}</span>
                    </div>
                  );
                })}
                <div style={{ marginTop: 8, fontSize: 11 }}>
                  {reg === 'GS'  && <div style={{ color: T.sage, marginTop: 4 }}>SDG labeled: +25%</div>}
                  {reg === 'VCS' && <div style={{ color: T.sage, marginTop: 4 }}>Nature-based: +40%</div>}
                  {(reg === 'VCS' || reg === 'GS') && <div style={{ color: T.indigo, marginTop: 2 }}>CCP labeled: +30%</div>}
                  {reg === 'CDM' && <div style={{ color: T.amber, marginTop: 4 }}>Article 6 ITMO: TBD</div>}
                  {reg === 'CAR' && <div style={{ color: T.blue, marginTop: 4 }}>US voluntary market</div>}
                  {reg === 'ACR' && <div style={{ color: T.blue, marginTop: 4 }}>CORSIA Phase 1 eligible</div>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Portfolio NPV — Discounted at 8% Over Full Crediting Period</div>
          <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['ID','Name','Registry','Annual ER (t)','Annual CF ($)','Yrs','Price $/t','NPV ($M)','NPV / tCO2e'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', fontSize: 11, fontFamily: T.fontMono, color: T.textSec, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolioNPV.slice(0, 20).map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ ...tdS, fontFamily: T.fontMono, fontSize: 11, color: T.indigo }}>{p.id}</td>
                    <td style={{ ...tdS, fontSize: 12, maxWidth: 155, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</td>
                    <td style={{ ...tdS, fontFamily: T.fontMono, fontSize: 11 }}>{p.registry}</td>
                    <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono }}>{fmt(p.annualER_tCO2e)}</td>
                    <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono }}>${fmt(p.annualER_tCO2e * p.carbonPrice_USD, 0)}</td>
                    <td style={{ ...tdS, textAlign: 'center' }}>{p.creditingPeriodYrs}</td>
                    <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono }}>${p.carbonPrice_USD.toFixed(2)}</td>
                    <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono, fontWeight: 700, color: T.navy }}>{fmtM(p.npv)}</td>
                    <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono }}>${(p.npv / Math.max(1, p.annualER_tCO2e * p.creditingPeriodYrs)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.navy, color: '#fff', padding: '14px 20px', borderRadius: 8, display: 'flex', gap: 36, flexWrap: 'wrap' }}>
            <div><div style={{ fontSize: 11, opacity: 0.7, fontFamily: T.fontMono }}>TOTAL PORTFOLIO NPV (50 projects)</div><div style={{ fontSize: 22, fontWeight: 800, fontFamily: T.fontMono }}>{fmtM(totalNPV)}</div></div>
            <div><div style={{ fontSize: 11, opacity: 0.7, fontFamily: T.fontMono }}>DISCOUNT RATE</div><div style={{ fontSize: 22, fontWeight: 800, fontFamily: T.fontMono }}>8.00%</div></div>
            <div><div style={{ fontSize: 11, opacity: 0.7, fontFamily: T.fontMono }}>AVG NPV / PROJECT</div><div style={{ fontSize: 22, fontWeight: 800, fontFamily: T.fontMono }}>{fmtM(totalNPV / 50)}</div></div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 6 — Monitoring Plan Compliance
      ══════════════════════════════════════════════════════ */}
      {activeTab === 6 && (
        <div>
          <RegBox
            title="UNFCCC CDM Monitoring Plan Requirements — Decision 3/CMP.1 Annex · ISO 14064-3:2019 §6.3"
            refs={[
              'Monitoring Plan per CDM SSC/LSC PDD Section D | Verification: annual (or biennial per EB60 para.50)',
              'CAR = Corrective Action Request · CL = Clarification · FAR = Forward Action Recommendation',
              'ISO 14064-3:2019 §6.3: Completeness · Consistency · Accuracy · Transparency · Conservativeness · Relevance',
            ]}
          />
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: T.textSec, fontFamily: T.fontMono }}>SELECT PROJECT: </label>
            <select value={monIdx} onChange={e => setMonIdx(Number(e.target.value))} style={{ marginLeft: 8, padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.fontMono }}>
              {PROJECTS.map((p, i) => <option key={p.id} value={i}>{p.id} — {p.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{monProj.name}</div>
              <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.fontMono, marginBottom: 16 }}>
                {monProj.id} · {monProj.methodology} · {monProj.registry} · VVB: {monProj.vvbName}
              </div>
              {MON_CHECKS.map((check, ci) => (
                <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ width: 22, height: 22, borderRadius: 4, background: monStatus[ci] ? T.green + '18' : T.red + '18', border: `2px solid ${monStatus[ci] ? T.green : T.red}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 13, color: monStatus[ci] ? T.green : T.red, lineHeight: 1 }}>{monStatus[ci] ? '✓' : '✗'}</span>
                  </div>
                  <span style={{ fontSize: 12, color: T.textPri, flex: 1 }}>{check}</span>
                  <span style={{ fontSize: 10, fontFamily: T.fontMono, color: monStatus[ci] ? T.green : T.red, flexShrink: 0 }}>
                    {monStatus[ci] ? 'COMPLIANT' : 'CAR OPEN'}
                  </span>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: '10px 14px', background: T.sub, borderRadius: 6, display: 'flex', gap: 24 }}>
                <span style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>Compliant: {monStatus.filter(Boolean).length}/8</span>
                <span style={{ fontSize: 12, color: T.red, fontWeight: 600 }}>CARs Open: {monStatus.filter(x => !x).length}</span>
                <span style={{ fontSize: 12, color: T.navy, fontWeight: 700 }}>Score: {((monStatus.filter(Boolean).length / 8) * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>ISO 14064-3 §6.3 Data Quality Requirements Matrix</div>
              {[
                ['Completeness',     'All emission sources/sinks within project boundary covered',    T.green],
                ['Consistency',      'Consistent methodologies across reporting periods',               T.green],
                ['Accuracy',         `Measurement error within stated uncertainty (${monProj.uncertainty_pct.toFixed(1)}%)`, monProj.uncertainty_pct > 7 ? T.amber : T.green],
                ['Transparency',     'Full documentation of assumptions and data sources',              T.green],
                ['Conservativeness', 'Conservative assumptions under conditions of uncertainty',        T.green],
                ['Relevance',        'Methodology appropriate for intended use and context',            T.green],
              ].map(([dim, desc, col]) => (
                <div key={dim} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: col, marginTop: 4, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>{dim}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{desc}</div>
                  </div>
                  <span style={{ fontSize: 10, color: col, fontFamily: T.fontMono }}>{col === T.green ? 'PASS' : 'REVIEW'}</span>
                </div>
              ))}
              <div style={{ marginTop: 14, padding: '10px 14px', background: T.sub, borderRadius: 6 }}>
                <div style={{ fontSize: 11, fontFamily: T.fontMono, color: T.textSec }}>
                  DQ SCORE: <b style={{ color: T.navy }}>{monProj.dqScore.toFixed(1)}/5.0</b> |
                  Uncertainty: <b style={{ color: monProj.uncertainty_pct > 7 ? T.amber : T.green }}>{monProj.uncertainty_pct.toFixed(1)}%</b> |
                  Vintage: <b>{monProj.vintageYear}</b>
                </div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>
                  IPCC DQRS: Reliability={monProj.dqScore >= 4 ? 'High' : 'Medium'} · Completeness=High · Temporal Correlation=Good · Geographical Corr.=High
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 7 — Registry & Issuance
      ══════════════════════════════════════════════════════ */}
      {activeTab === 7 && (
        <div>
          <RegBox
            title="Registry & Issuance — CDM · GS · Verra VCS · CAR · ACR"
            refs={[
              'CDM Registry: cdm.unfccc.int · Verra Registry: registry.verra.org · GS: apx.com/gold-standard',
              'Article 6.4 Mechanism (CMA3 Annex): Corresponding Adjustments required for ITMOs from 2021+',
              'CORSIA Phase 1 (2024–2026): ICAO Eligible — pre-2020 CDM/GS/VCS with qualifying methodologies',
            ]}
          />

          <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Project ID','Registry','Vintage','Submitted (t)','Verified (t)','Uncertainty','Net Issued','Serial Prefix','Issuance Date','Art.6 CA','CORSIA'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', fontSize: 11, fontFamily: T.fontMono, color: T.textSec, textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROJECTS.slice(0, 25).map((p, i) => {
                  const submitted = p.issuedCredits + p.pendingCredits;
                  const verified  = Math.round(submitted * (1 - p.uncertainty_pct / 100));
                  const net       = Math.round(verified  * (1 - p.uncertainty_pct / 200));
                  const prefix    = `${p.registry}-${p.vintageYear}-${p.id}`;
                  const issuMo    = String(Math.floor(sr(i * 59) * 12 + 1)).padStart(2,'0');
                  const issuYr    = 2020 + Math.floor(sr(i * 53) * 6);
                  const ca        = p.vintageYear >= 2021 ? (sr(i * 61) > 0.5 ? 'Pending' : 'Confirmed') : 'Pre-2021';
                  const corsia    = p.vintageYear < 2020 && ['CDM','VCS','GS'].includes(p.registry) ? 'Eligible' : 'Review';
                  const caColor   = ca === 'Confirmed' ? T.green : ca === 'Pending' ? T.amber : T.textSec;
                  const coColor   = corsia === 'Eligible' ? T.teal : T.amber;
                  return (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ ...tdS, fontFamily: T.fontMono, fontSize: 11, color: T.indigo }}>{p.id}</td>
                      <td style={{ ...tdS, fontFamily: T.fontMono, fontSize: 11 }}>{p.registry}</td>
                      <td style={{ ...tdS, textAlign: 'center', fontFamily: T.fontMono }}>{p.vintageYear}</td>
                      <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono }}>{fmt(submitted)}</td>
                      <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono }}>{fmt(verified)}</td>
                      <td style={{ ...tdS, textAlign: 'center', fontFamily: T.fontMono, color: p.uncertainty_pct > 7 ? T.amber : T.green }}>{p.uncertainty_pct.toFixed(1)}%</td>
                      <td style={{ ...tdS, textAlign: 'right', fontFamily: T.fontMono, fontWeight: 700, color: T.navy }}>{fmt(net)}</td>
                      <td style={{ ...tdS, fontFamily: T.fontMono, fontSize: 10, color: T.textSec }}>{prefix}</td>
                      <td style={{ ...tdS, fontFamily: T.fontMono, fontSize: 11 }}>{issuYr}-{issuMo}</td>
                      <td style={tdS}><span style={{ background: caColor + '22', color: caColor, padding: '2px 6px', borderRadius: 3, fontSize: 10, fontFamily: T.fontMono }}>{ca}</span></td>
                      <td style={tdS}><span style={{ background: coColor + '22', color: coColor, padding: '2px 6px', borderRadius: 3, fontSize: 10, fontFamily: T.fontMono }}>{corsia}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Cumulative Issuance by Vintage Year (All 50 Projects)</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 160, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px 10px' }}>
            {(() => {
              const maxV = Math.max(...vintageByYear.map(([, v]) => v));
              return vintageByYear.map(([yr, vol]) => {
                const h = maxV > 0 ? (vol / maxV) * 100 : 0;
                return (
                  <div key={yr} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{ fontSize: 10, color: T.textSec, fontFamily: T.fontMono, marginBottom: 4 }}>{(vol / 1e6).toFixed(1)}M</div>
                    <div style={{ width: '100%', height: `${h}%`, background: T.navy, borderRadius: '3px 3px 0 0', minHeight: 4 }} />
                    <div style={{ fontSize: 10, color: T.textSec, fontFamily: T.fontMono, marginTop: 4 }}>{yr}</div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
