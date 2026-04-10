import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart,
  ScatterChart, Scatter, PieChart, Pie, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Cell, ReferenceLine,
  XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  surface: '#fafaf7', border: '#e2e0d8', navy: '#1b2a4a', gold: '#b8962e',
  text: '#1a1a2e', sub: '#64748b', card: '#ffffff', indigo: '#4f46e5',
  green: '#065f46', red: '#991b1b', amber: '#92400e',
  teal: '#0e7490', purple: '#6d28d9', blue: '#1d4ed8', orange: '#c2410c',
  font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const TABS = [
  'Sector Overview','Sector Deep-Dive','Company Profiles','Cross-Sector Comparison',
  'Regional Benchmarking','Metric Comparison','Best Practice Showcase',
  'Gap Analysis','Maturity Assessment','Improvement Roadmap'
];

// ── SECTORS ───────────────────────────────────────────────────────────────────
const SECTORS = [
  { name:'Chemicals', companies:['BASF','Dow','SABIC','LG Chem'], materialTopics:['GHG Emissions','Pollution','Circular Economy','Water Use','Process Safety'], esrsPriority:['E1','E2','E5','S1'], region:'Global',
    benchmarks:{ ghgIntensity:'0.45 tCO2e/t product', renewable:'35%', water:'2.1 ML/t', sustainableRev:'28%', wasteDiversion:'72%' } },
  { name:'Banking & Financial Services', companies:['HSBC','TD Bank','JPMorgan','BNP Paribas'], materialTopics:['Financed Emissions','Green Finance','Financial Inclusion','Cybersecurity','Governance'], esrsPriority:['E1','G1','S1','S4'], region:'Global',
    benchmarks:{ ghgIntensity:'62 tCO2e/$M financed', renewable:'85%', water:'0.01 ML/employee', sustainableRev:'18%', greenAssetRatio:'12%' } },
  { name:'Technology', companies:['Amazon/AWS','Microsoft','Apple','Alphabet'], materialTopics:['Energy Consumption','E-waste','Data Privacy','AI Ethics','Supply Chain Labor'], esrsPriority:['E1','E5','S4','G1'], region:'Global',
    benchmarks:{ ghgIntensity:'8.2 tCO2e/$M rev', renewable:'72%', water:'0.8 ML/$M rev', sustainableRev:'35%', circularProducts:'45%' } },
  { name:'Automotive', companies:['Mercedes-Benz','Tesla','BYD','Toyota'], materialTopics:['Tailpipe Emissions','EV Transition','Battery Sourcing','Circular Design','Worker Safety'], esrsPriority:['E1','E5','S1','S2'], region:'Global',
    benchmarks:{ ghgIntensity:'125 gCO2/km (fleet avg)', renewable:'48%', water:'3.8 m3/vehicle', sustainableRev:'32%', evShare:'28%' } },
  { name:'Consumer Goods', companies:['Unilever','Nestle','P&G','L\'Oreal'], materialTopics:['Packaging Waste','Deforestation','Water Stewardship','Living Wage','Product Safety'], esrsPriority:['E5','E4','E3','S2'], region:'Global',
    benchmarks:{ ghgIntensity:'0.32 tCO2e/t product', renewable:'55%', water:'1.5 ML/t', sustainableRev:'42%', recyclablePackaging:'65%' } },
  { name:'Energy (Oil & Gas + Renewables)', companies:['TotalEnergies','Shell','Iberdrola','Enel'], materialTopics:['Scope 1/2/3 Emissions','Methane','Transition Planning','Biodiversity','Just Transition'], esrsPriority:['E1','E4','S1','S3'], region:'Global',
    benchmarks:{ ghgIntensity:'18 kgCO2e/BOE', renewable:'22%', water:'0.6 m3/BOE', sustainableRev:'15%', methaneIntensity:'0.12%' } },
  { name:'Mining & Metals', companies:['BHP','Vale','Rio Tinto','Glencore'], materialTopics:['Tailings Safety','Water Use','Biodiversity','Indigenous Rights','Dust Emissions'], esrsPriority:['E1','E3','E4','S3'], region:'Global',
    benchmarks:{ ghgIntensity:'2.8 tCO2e/t ore', renewable:'28%', water:'0.9 ML/t ore', sustainableRev:'8%', tailingsSafety:'92% audited' } },
  { name:'Insurance', companies:['Allianz','Munich Re','AXA','Swiss Re'], materialTopics:['Underwriting ESG','Climate Risk Models','Protection Gap','Green Insurance','Governance'], esrsPriority:['E1','G1','S4'], region:'Global',
    benchmarks:{ ghgIntensity:'45 tCO2e/$M premium', renewable:'80%', water:'0.005 ML/employee', sustainableRev:'22%', climateLiability:'$1.2B modeled' } },
  { name:'Telecommunications', companies:['Vodafone','Singtel','Deutsche Telekom','AT&T'], materialTopics:['Energy Efficiency','E-waste','Digital Inclusion','Data Privacy','Network Resilience'], esrsPriority:['E1','E5','S4','G1'], region:'Global',
    benchmarks:{ ghgIntensity:'12 tCO2e/PB data', renewable:'62%', water:'0.3 ML/site', sustainableRev:'15%', digitalInclusion:'85% pop coverage' } },
  { name:'Real Estate & Construction', companies:['British Land','Brookfield','Prologis','Vonovia'], materialTopics:['Building Energy','Embodied Carbon','Tenant Engagement','Green Certification','Climate Resilience'], esrsPriority:['E1','E5','S1','S3'], region:'Global',
    benchmarks:{ ghgIntensity:'35 kgCO2e/m2', renewable:'45%', water:'0.8 m3/m2', sustainableRev:'30%', greenCertified:'58%' } },
  { name:'Healthcare & Pharma', companies:['Novo Nordisk','Roche','Pfizer','AstraZeneca'], materialTopics:['Access to Medicine','Clinical Waste','Water Quality','Animal Testing','Supply Chain'], esrsPriority:['S4','E2','E3','G1'], region:'Global',
    benchmarks:{ ghgIntensity:'52 tCO2e/$M rev', renewable:'58%', water:'1.2 ML/$M rev', sustainableRev:'20%', accessPrograms:'12 active' } },
  { name:'India Leaders', companies:['Reliance Industries','Infosys','Tata Group','Adani Green'], materialTopics:['BRSR Compliance','Renewable Transition','Water Stress','Community Development','Governance'], esrsPriority:['E1','E3','S3','G1'], region:'India',
    benchmarks:{ ghgIntensity:'Varies by sub-sector', renewable:'42%', water:'Sector-dependent', sustainableRev:'25%', brsrScore:'82/100 avg' } },
  { name:'Aviation & Shipping', companies:['IAG','Maersk','Air France-KLM','CMA CGM'], materialTopics:['Fuel Efficiency','SAF Adoption','Ballast Water','Noise Pollution','Route Optimization'], esrsPriority:['E1','E2','S1'], region:'Global',
    benchmarks:{ ghgIntensity:'82 gCO2/RPK (aviation)', renewable:'5% SAF', water:'0.2 m3/TEU (shipping)', sustainableRev:'8%', safAdoption:'3.5%' } },
  { name:'Agriculture & Food', companies:['Cargill','ADM','JBS','Olam'], materialTopics:['Land Use Change','Methane','Water Scarcity','Deforestation','Labor Practices'], esrsPriority:['E1','E4','E3','S2'], region:'Global',
    benchmarks:{ ghgIntensity:'1.8 tCO2e/t product', renewable:'22%', water:'850 m3/t', sustainableRev:'18%', zeroDef:'65% sourcing' } },
];

// ── COMPANY PROFILES ──────────────────────────────────────────────────────────
const COMPANIES = SECTORS.flatMap((sector, si) =>
  sector.companies.map((name, ci) => {
    const seed = si * 100 + ci * 37 + 2000;
    return {
      name, sector: sector.name,
      region: ci === 0 ? 'EU' : ci === 1 ? 'North America' : ci === 2 ? 'Asia-Pacific' : 'Global',
      ghgIntensity: +(5 + sr(seed + 1) * 150).toFixed(1),
      renewablePct: Math.round(15 + sr(seed + 2) * 75),
      waterIntensity: +(0.1 + sr(seed + 3) * 5).toFixed(2),
      sustainableRevPct: Math.round(5 + sr(seed + 4) * 50),
      esgScore: Math.round(40 + sr(seed + 5) * 55),
      sbtiTarget: sr(seed + 6) > 0.4,
      tcfdAligned: sr(seed + 7) > 0.3,
      tnfdAligned: sr(seed + 8) > 0.7,
      genderDiversityPct: Math.round(20 + sr(seed + 9) * 35),
      safetyRate: +(0.1 + sr(seed + 10) * 3).toFixed(2),
    };
  })
);

// ── ESG DIMENSIONS FOR RADAR ──────────────────────────────────────────────────
const ESG_DIMS = ['GHG Intensity','Renewable Energy','Water Mgmt','Circular Economy','Biodiversity','Social (DEI)','Governance','Disclosure'];

const sectorRadarData = useMemo => SECTORS.map((s,si) => {
  const seed = si * 200 + 3000;
  const obj = { name: s.name };
  ESG_DIMS.forEach((d,di) => { obj[d] = Math.round(30 + sr(seed + di * 7) * 65); });
  return obj;
});

// ── REGIONS ───────────────────────────────────────────────────────────────────
const REGIONS = ['EU Leaders','North America','Asia-Pacific','India','LatAm & Africa'];

const BEST_PRACTICES = [
  { rank:1, practice:'Science-Based Targets validated by SBTi', company:'Microsoft', detail:'100% renewable energy by 2025, carbon negative by 2030, $1B Climate Innovation Fund' },
  { rank:2, practice:'Internal Carbon Pricing > $100/tCO2e', company:'Novo Nordisk', detail:'$150/tCO2e internal price driving capital allocation decisions across all business units' },
  { rank:3, practice:'Full Scope 3 Disclosure with CDP A-List', company:'Unilever', detail:'Complete Scope 3 measurement across all 15 categories with third-party verification' },
  { rank:4, practice:'Circular Economy Product Design', company:'Apple', detail:'100% recycled rare earth elements in magnets, carbon neutral products, recycling robots' },
  { rank:5, practice:'Nature-Positive Commitment with TNFD LEAP', company:'HSBC', detail:'$1T sustainable finance target, TNFD-aligned nature risk assessment, biodiversity credits' },
  { rank:6, practice:'Living Wage Certification Across Supply Chain', company:'Nestle', detail:'Living wage for 100% own employees, 80% Tier 1 suppliers with verified wage assessments' },
  { rank:7, practice:'Green Building Portfolio 100% Certified', company:'British Land', detail:'100% EPC B+ portfolio target by 2030, BREEAM Excellent for all new developments' },
  { rank:8, practice:'Methane Intensity Below 0.1%', company:'TotalEnergies', detail:'OGMP 2.0 Gold Standard reporting, continuous methane monitoring, $500M abatement investment' },
  { rank:9, practice:'Gender Parity in Leadership (50/50)', company:'L\'Oreal', detail:'50% women in leadership positions, pay equity certification, inclusive recruitment targets' },
  { rank:10, practice:'Integrated Annual & Sustainability Report', company:'Reliance Industries', detail:'Combined IR framework report, BRSR + GRI + TCFD alignment, assurance on key ESG metrics' },
];

const MATURITY_LEVELS = ['Ad Hoc (Level 1)','Developing (Level 2)','Defined (Level 3)','Managed (Level 4)','Optimizing (Level 5)'];
const MATURITY_DIMS = ['GHG Management','Water Stewardship','Circular Economy','Social Impact','Governance','Disclosure Quality','Target Setting','Assurance'];

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function SectorSustainabilityBenchmarkPage() {
  const [tab, setTab] = useState(0);
  const [selectedSector, setSelectedSector] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState('esgScore');
  const [maturityScores, setMaturityScores] = useState({});
  const [gapCompany, setGapCompany] = useState('');

  const COLORS = [T.indigo, T.green, T.teal, T.purple, T.blue, T.orange, T.amber, T.red, T.navy, '#059669', '#7c3aed', '#be185d', '#0d9488', '#6366f1'];

  const filteredCompanies = useMemo(() => {
    if (!searchQuery) return COMPANIES;
    const q = searchQuery.toLowerCase();
    return COMPANIES.filter(c => c.name.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q));
  }, [searchQuery]);

  const sectorChartData = useMemo(() => SECTORS.map((s,i) => ({
    name: s.name.length > 15 ? s.name.slice(0,13)+'...' : s.name,
    companies: s.companies.length,
    fill: COLORS[i % COLORS.length]
  })), []);

  const radarData = useMemo(() => {
    return ESG_DIMS.map((dim, di) => {
      const obj = { dimension: dim };
      SECTORS.slice(0, 5).forEach((s, si) => {
        const seed = si * 200 + di * 7 + 3000;
        obj[s.name] = Math.round(30 + sr(seed) * 65);
      });
      return obj;
    });
  }, []);

  const metricOptions = [
    { key:'esgScore', label:'ESG Score' },
    { key:'renewablePct', label:'Renewable Energy %' },
    { key:'ghgIntensity', label:'GHG Intensity' },
    { key:'sustainableRevPct', label:'Sustainable Revenue %' },
    { key:'genderDiversityPct', label:'Gender Diversity %' },
    { key:'waterIntensity', label:'Water Intensity' },
  ];

  const metricChartData = useMemo(() => {
    const byS = {};
    COMPANIES.forEach(c => {
      if (!byS[c.sector]) byS[c.sector] = [];
      byS[c.sector].push(c[selectedMetric]);
    });
    return Object.entries(byS).map(([sector, vals], i) => ({
      name: sector.length > 15 ? sector.slice(0,13)+'...' : sector,
      avg: vals.length > 0 ? +(vals.reduce((a,b)=>a+b,0) / vals.length).toFixed(1) : 0,
      topQuartile: vals.length > 0 ? +([...vals].sort((a,b)=>b-a)[0]).toFixed(1) : 0,
      fill: COLORS[i % COLORS.length]
    }));
  }, [selectedMetric]);

  const regionData = useMemo(() => {
    return REGIONS.map((r, ri) => {
      const seed = ri * 300 + 4000;
      return {
        region: r,
        avgEsg: Math.round(50 + sr(seed + 1) * 40),
        renewable: Math.round(20 + sr(seed + 2) * 60),
        disclosure: Math.round(40 + sr(seed + 3) * 55),
        sbtiAdoption: Math.round(10 + sr(seed + 4) * 70),
      };
    });
  }, []);

  const getMaturity = useCallback((dim) => maturityScores[dim] || 1, [maturityScores]);
  const setMaturity = useCallback((dim, val) => setMaturityScores(p => ({...p, [dim]: val})), []);
  const avgMaturity = useMemo(() => {
    const vals = MATURITY_DIMS.map(d => getMaturity(d));
    return vals.length > 0 ? (vals.reduce((a,b)=>a+b,0) / vals.length).toFixed(1) : '0.0';
  }, [getMaturity]);

  const gapAnalysisData = useMemo(() => {
    if (!gapCompany) return [];
    const c = COMPANIES.find(co => co.name === gapCompany);
    if (!c) return [];
    const sectorComps = COMPANIES.filter(co => co.sector === c.sector);
    const topQ = (key) => {
      const sorted = [...sectorComps].sort((a,b)=>b[key]-a[key]);
      return sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.25)][key] : 0;
    };
    return ['esgScore','renewablePct','sustainableRevPct','genderDiversityPct'].map(key => ({
      metric: metricOptions.find(m=>m.key===key)?.label || key,
      yours: c[key],
      topQuartile: topQ(key),
      gap: +(topQ(key) - c[key]).toFixed(1)
    }));
  }, [gapCompany]);

  return (
    <div style={{ fontFamily: T.font, color: T.text, background: T.surface, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: T.navy, margin: 0 }}>Sector Sustainability Benchmark</h1>
          <p style={{ color: T.sub, fontSize: 14, margin: '4px 0 0', fontFamily: T.mono }}>
            {SECTORS.length} Sectors | {COMPANIES.length}+ Companies | Top-Quartile Benchmarks | 5 Regions
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 20, borderBottom: `2px solid ${T.border}`, paddingBottom: 8 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '8px 14px', fontSize: 12, fontWeight: tab === i ? 700 : 500,
              background: tab === i ? T.navy : 'transparent', color: tab === i ? '#fff' : T.sub,
              border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: T.font
            }}>{t}</button>
          ))}
        </div>

        {/* TAB 0: Sector Overview */}
        {tab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
              {SECTORS.map((s,i) => (
                <div key={i} style={{ background: T.card, borderRadius: 10, padding: 16, border: `1px solid ${T.border}`, cursor: 'pointer' }} onClick={()=>{setSelectedSector(i);setTab(1);}}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h4 style={{ color: T.navy, fontSize: 14, margin: 0 }}>{s.name}</h4>
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: COLORS[i % COLORS.length] }}>{s.companies.length} companies</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                    {s.esrsPriority.map(e => (
                      <span key={e} style={{ padding: '1px 6px', borderRadius: 3, fontSize: 9, background: '#eef2ff', color: T.indigo, fontFamily: T.mono }}>{e}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: T.sub }}>
                    {s.materialTopics.slice(0,3).join(' | ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 1: Sector Deep-Dive */}
        {tab === 1 && (
          <div>
            <select value={selectedSector} onChange={e=>setSelectedSector(Number(e.target.value))} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13, marginBottom: 16 }}>
              {SECTORS.map((s,i) => <option key={i} value={i}>{s.name}</option>)}
            </select>
            {(() => {
              const s = SECTORS[selectedSector];
              const sectorComps = COMPANIES.filter(c => c.sector === s.name);
              return (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                      <h3 style={{ color: T.navy, fontSize: 16, marginTop: 0 }}>{s.name}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {Object.entries(s.benchmarks).map(([k,v]) => (
                          <div key={k} style={{ background: T.surface, borderRadius: 6, padding: 10 }}>
                            <div style={{ fontSize: 10, color: T.sub, fontFamily: T.mono }}>{k.replace(/([A-Z])/g,' $1').toUpperCase()}</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: T.navy }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                      <h4 style={{ color: T.navy, fontSize: 14, marginTop: 0 }}>Company ESG Scores</h4>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={sectorComps.map(c=>({name:c.name,score:c.esgScore}))}>
                          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0,100]} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="score" fill={T.indigo} radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div style={{ background: T.card, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
                    <h4 style={{ color: T.navy, fontSize: 14, marginTop: 0 }}>Material ESG Topics</h4>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {s.materialTopics.map((t,i) => (
                        <span key={i} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, background: COLORS[i % COLORS.length]+'18', color: COLORS[i % COLORS.length], fontWeight: 600 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 2: Company Profiles */}
        {tab === 2 && (
          <div>
            <input placeholder="Search companies or sectors..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{ padding: '8px 14px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13, marginBottom: 16, width: 300 }} />
            <span style={{ color: T.sub, fontSize: 12, marginLeft: 12, fontFamily: T.mono }}>{filteredCompanies.length} companies</span>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.navy, color: '#fff' }}>
                    {['Company','Sector','Region','ESG Score','Renewable %','GHG Intensity','Sust. Rev %','SBTi','TCFD','Gender Div %'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.slice(0, 50).map((c,i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.surface, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '6px 8px', color: T.sub }}>{c.sector}</td>
                      <td style={{ padding: '6px 8px' }}>{c.region}</td>
                      <td style={{ padding: '6px 8px', fontFamily: T.mono, fontWeight: 700, color: c.esgScore >= 70 ? T.green : c.esgScore >= 50 ? T.amber : T.red }}>{c.esgScore}</td>
                      <td style={{ padding: '6px 8px', fontFamily: T.mono }}>{c.renewablePct}%</td>
                      <td style={{ padding: '6px 8px', fontFamily: T.mono }}>{c.ghgIntensity}</td>
                      <td style={{ padding: '6px 8px', fontFamily: T.mono }}>{c.sustainableRevPct}%</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{c.sbtiTarget ? 'Yes' : '-'}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{c.tcfdAligned ? 'Yes' : '-'}</td>
                      <td style={{ padding: '6px 8px', fontFamily: T.mono }}>{c.genderDiversityPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Cross-Sector Comparison */}
        {tab === 3 && (
          <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ color: T.navy, fontSize: 16, marginTop: 0 }}>Cross-Sector Radar (Top 5 Sectors)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={150}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fontFamily: T.font }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                {SECTORS.slice(0, 5).map((s, i) => (
                  <Radar key={i} name={s.name} dataKey={s.name} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} />
                ))}
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* TAB 4: Regional Benchmarking */}
        {tab === 4 && (
          <div>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <h3 style={{ color: T.navy, fontSize: 16, marginTop: 0 }}>Regional ESG Benchmarks</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="avgEsg" fill={T.indigo} name="Avg ESG Score" radius={[4,4,0,0]} />
                  <Bar dataKey="renewable" fill={T.green} name="Renewable %" radius={[4,4,0,0]} />
                  <Bar dataKey="disclosure" fill={T.teal} name="Disclosure %" radius={[4,4,0,0]} />
                  <Bar dataKey="sbtiAdoption" fill={T.purple} name="SBTi Adoption %" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 5: Metric Comparison */}
        {tab === 5 && (
          <div>
            <select value={selectedMetric} onChange={e=>setSelectedMetric(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13, marginBottom: 16 }}>
              {metricOptions.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
            <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={metricChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11, fontFamily: T.mono }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="avg" fill={T.indigo} name="Sector Average" radius={[0,4,4,0]} />
                  <Bar dataKey="topQuartile" fill={T.green} name="Top Quartile" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 6: Best Practice Showcase */}
        {tab === 6 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12 }}>
            {BEST_PRACTICES.map((bp, i) => (
              <div key={i} style={{ background: T.card, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: COLORS[i % COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>#{bp.rank}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{bp.practice}</div>
                    <div style={{ fontSize: 11, color: T.indigo, fontFamily: T.mono }}>{bp.company}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: T.sub }}>{bp.detail}</div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 7: Gap Analysis */}
        {tab === 7 && (
          <div>
            <select value={gapCompany} onChange={e=>setGapCompany(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13, marginBottom: 16 }}>
              <option value="">Select a company...</option>
              {COMPANIES.map((c,i) => <option key={i} value={c.name}>{c.name} ({c.sector})</option>)}
            </select>
            {gapAnalysisData.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                  <h4 style={{ color: T.navy, fontSize: 14, marginTop: 0 }}>Gap to Top Quartile</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={gapAnalysisData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="metric" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="yours" fill={T.indigo} name="Your Score" radius={[4,4,0,0]} />
                      <Bar dataKey="topQuartile" fill={T.green} name="Top Quartile" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                  <h4 style={{ color: T.navy, fontSize: 14, marginTop: 0 }}>Gap Details</h4>
                  {gapAnalysisData.map((g,i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 12 }}>{g.metric}</span>
                      <span style={{ fontFamily: T.mono, fontSize: 12, color: g.gap > 0 ? T.red : T.green, fontWeight: 700 }}>
                        {g.gap > 0 ? `+${g.gap} gap` : 'Above TQ'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: Maturity Assessment */}
        {tab === 8 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                <h3 style={{ color: T.navy, fontSize: 16, marginTop: 0 }}>Self-Assessment</h3>
                {MATURITY_DIMS.map((dim, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{dim}</span>
                      <span style={{ fontFamily: T.mono, color: T.indigo }}>{MATURITY_LEVELS[getMaturity(dim)-1]}</span>
                    </div>
                    <input type="range" min={1} max={5} value={getMaturity(dim)}
                      onChange={e=>setMaturity(dim, Number(e.target.value))} style={{ width: '100%' }} />
                  </div>
                ))}
              </div>
              <div style={{ background: T.card, borderRadius: 10, padding: 20, border: `1px solid ${T.border}` }}>
                <h4 style={{ color: T.navy, fontSize: 14, marginTop: 0 }}>Overall Maturity</h4>
                <div style={{ fontSize: 48, fontWeight: 700, color: T.indigo, textAlign: 'center' }}>{avgMaturity}</div>
                <div style={{ fontSize: 12, color: T.sub, textAlign: 'center', marginBottom: 16 }}>of 5.0</div>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={MATURITY_DIMS.map(d => ({ dim: d, score: getMaturity(d) }))}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="dim" tick={{ fontSize: 9 }} />
                    <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 9 }} />
                    <Radar dataKey="score" stroke={T.indigo} fill={T.indigo} fillOpacity={0.3} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: Improvement Roadmap */}
        {tab === 9 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
              {MATURITY_DIMS.map((dim, i) => {
                const level = getMaturity(dim);
                const actions = [
                  'Establish baseline measurement and reporting processes',
                  'Set interim targets and assign ownership for tracking',
                  'Implement automated data collection and verification',
                  'Achieve third-party assurance and peer leadership',
                  'Drive industry transformation and standard-setting',
                ];
                return (
                  <div key={i} style={{ background: T.card, borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <h4 style={{ color: T.navy, fontSize: 13, margin: 0 }}>{dim}</h4>
                      <span style={{ fontFamily: T.mono, fontSize: 11, color: COLORS[i % COLORS.length] }}>Level {level}/5</span>
                    </div>
                    <div style={{ fontSize: 12, color: T.text, marginBottom: 8 }}>
                      <b>Current:</b> {MATURITY_LEVELS[level - 1]}
                    </div>
                    {level < 5 && (
                      <div style={{ fontSize: 12, color: T.sub }}>
                        <b>Next Action:</b> {actions[Math.min(level, 4)]}
                      </div>
                    )}
                    {level >= 5 && (
                      <div style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>Optimizing - maintain leadership</div>
                    )}
                    <div style={{ height: 6, background: T.surface, borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${level * 20}%`, background: COLORS[i % COLORS.length], borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
