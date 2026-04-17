import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, Legend, ScatterChart, Scatter, PieChart, Pie, LineChart, Line } from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SECTORS = ['Solar & PV', 'Wind Energy', 'Green Hydrogen', 'Carbon Capture & Storage', 'Battery Storage', 'Nuclear (SMR)', 'Geothermal', 'Sustainable Aviation Fuel', 'EV & Mobility', 'Grid & Efficiency', 'Agri-Tech & FoodTech', 'Blue Economy', 'Waste-to-Value', 'Climate AI & Analytics'];
const STAGES = ['Seed', 'Series A', 'Series B', 'Series C+', 'Growth', 'Pre-IPO', 'Public'];
const GEOS = ['North America', 'Europe', 'China', 'India', 'Asia Pacific', 'Latin America', 'Middle East', 'Africa', 'UK', 'ANZ'];
const RISK_LEVELS = ['Low', 'Medium', 'High'];
const CPC_CLASSES = ['Y02E', 'Y02T', 'Y02W', 'Y02B', 'Y04S'];
const MATURITY = ['Nascent', 'Emerging', 'Growth', 'Mature'];
const TABS = ['Technology Landscape', 'Investment Analytics', 'Impact Assessment', 'Portfolio Exposure', 'Patent Intelligence', 'Market Size & Growth', 'Technology Readiness', 'Exit & IPO Analytics'];
const PIE_C = [T.navy, T.gold, T.sage, T.red, T.amber, T.indigo, T.blue, T.purple, T.teal, T.orange, T.green, '#db2777', '#6b7280', '#059669'];

const CO_NAMES = [
  'Enphase Energy','First Solar','SunPower Corp','Canadian Solar','JinkoSolar','Vestas Wind','Siemens Gamesa','Orsted','Nordex SE','GE Vernova',
  'Plug Power','Nel ASA','ITM Power','Bloom Energy','Green Hydrogen Systems','Climeworks','Carbon Engineering','Heirloom Carbon','Global Thermostat','Charm Industrial',
  'QuantumScape','Tesla Energy','CATL','BYD Company','Solid Power','Fervo Energy','Ormat Technologies','Eavor Technologies','Quaise Energy','Baker Hughes Geo',
  'Neste Corporation','Gevo Inc','LanzaTech','Velocys','SunFire GmbH','Rivian Automotive','Lucid Motors','Nio Inc','Proterra Inc','Arrival SA',
  'Fluence Energy','Stem Inc','Sungrow Power','Shoals Technologies','Array Technologies','NextEra Energy','Brookfield Renewable','Clearway Energy','Enel Green Power','Iberdrola',
  'Northvolt','Redwood Materials','Li-Cycle','Enovix Corp','EnerVenue','Form Energy','ESS Inc','Ambri Inc','Malta Inc','Energy Vault',
  'NuScale Power','Kairos Power','TerraPower','X-energy','Commonwealth Fusion','Helion Energy','TAE Technologies','Zap Energy','General Fusion','Tokamak Energy',
  'CarbonCure Technologies','Twelve Benefit','Prometheus Fuels','Svante Inc','Carbon Clean','H2 Green Steel','Boston Metal','Heliogen Inc','Dandelion Energy','BrightDrop',
  'Koloma Inc','Electric Hydrogen','Verdagy','Sunfire GmbH','Electrochaea','Nubis Communications','Volterra','GridBeyond','AutoGrid','Opus One',
  'Pachama','South Pole Group','Gold Standard','Verra Registry','BeZero Carbon','Xpansiv','ACX Platform','CBL Markets','AirCarbon Exchange','Climate Impact X',
  'Rubicon Carbon','Anew Climate','Bluesource','Finite Carbon','Forest Carbon','Natural Capital Partners','Wildlife Works','Cool Effect','Terrapass','ClimateCare',
  'Sinai Technologies','Persefoni AI','Watershed Tech','Sweep Carbon','Greenly Earth','Plan A Earth','CarbonChain','Emitwise','Normative','Sphera Solutions',
  'Xero Solutions','Clarity AI','Trucost S&P','MSCI ESG','RepRisk AG','Sustainalytics','EcoVadis','ISS ESG','CDP Worldwide','GRI Standards',
  'Kraken Ocean','Ocean Visions','Blue Carbon Labs','Kelp Blue','Running Tide','Brilliant Planet','Algae Systems','C-Combinator','Seafields','OceanBased Perp',
  'Anaergia Inc','Enerkem Inc','Fulcrum Bioenergy','Sierra Energy','Covanta Energy','Babcock Wilcox','Montauk Renewables','Archaea Energy','Opal Fuels','Avfuel Corp',
  'Joby Aviation','Archer Aviation','Lilium eVTOL','Wisk Aero','Overair Inc','Volocopter','EHang Holdings','Vertical Aerospace','Heart Aerospace','ZeroAvia',
  'Ampere Energy','Younicos AG','Powin LLC','Largo Clean Energy','Primus Power','EnerSys Corp','Invinity Energy','Redflow Ltd','VRB Energy','CellCube Energy',
  'Decarbon8','C12 Energy','GreenGasHub','BiogasWorld','Agilyx Corp','Renewlogy','Pyrowave Inc','Plastic Energy','Renewlogy UK','Worn Again',
  'Microsoft Climate','Google Carbon','Amazon Sustainability','Apple Green','Meta Sustainability','Salesforce Net Zero','SAP Sustainability','IBM Climate','Oracle Green','ServiceNow ESG',
  'Solar Mosaic','Mosaic Solar','Sunrun Inc','Sunnova Energy','SunStreet Energy','Freedom Solar','Pink Energy','SolarEdge Tech','SMA Solar','Fronius Solar',
  'WRIAqueduct','Four Twenty Seven','Jupiter Intel','Risklayer GmbH','FloodFlash','Kettle Insurance','Descartes Underwriting','Jumpstart Recovery','Kin Insurance','Lemonade',
  'Arcadia Power','Inspire Clean','OhmConnect','EnergyHub','AutoGrid Flex','Voltus Inc','CPower Energy','Enel X NA','Virtual Peaker','Itron Grid',
  'Xcel Energy Green','AES Clean Energy','Avangrid Renewables','Pattern Energy','Terraform Power','TerraForm Wind','8point3 Energy','Atlantica Yield','Capital Dynamics','Greentech Capital',
  'Breakthrough Energy','Engine Ventures','Lowercarbon Capital','Congruent Ventures','Clean Energy Capital','Generate Capital','Greenbacker Capital','Energy Impact Partners','Prime Coalition','DCVC Bio',
  'Siemens Energy','ABB Power Grids','Schneider Electric','Eaton Corporation','GE Digital Grid','Hitachi Energy','Mitsubishi Power','Toshiba Energy','Emerson Automation','Honeywell Green',
  'Solvay Green Chem','BASF Catalysis','Dow Sustainability','Covestro Circular','Borealis Borouge','LyondellBasell','Sabic Petrochem','Ineos Group','Lanxess Green','Evonik Industries',
  'Oatly Group','NotCo','Impossible Foods','Beyond Meat','Eat Just','New Wave Foods','BlueNalu','Finless Foods','Wild Type','Avant Meats',
  'Xylem Water','Evoqua Water','Veolia Water','Suez Water','Purfresh Inc','Rapid Radicals','Atlantis Water','ZeroMassWater','SOURCE Global','Watergen Ltd',
  'Mainstream Renewable','Acwa Power','Masdar Energy','InfraSource','Leeward Renew','Longroad Energy','Hecate Energy','Savion LLC','Intersect Power','Orion Renewable',
  'Aker Horizons','Equinor Renew','BP Lightsource','Shell Renewables','TotalEnergies EP','Chevron New Energy','ConocoPhillips Net','ExxonMobil CCS','SLB Carbon','Halliburton Net',
  'Schneider Sustain','Verint Systems','Siemens Sustain','Oracle Sustain','IBM ESG','SAP ESG','Workiva ESG','Diligent ESG','ENGIE Impact','Arcadis Green',
  'Trane Technologies','Johnson Controls','Carrier Global','Lennox Green','Daikin Ecology','Mitsubishi HVAC','Danfoss Climate','Grundfos Pumps','Alfa Laval','Spirax-Sarco',
  'Solaris Bus','BYD Electric Bus','Wrightbus NI','Alexander Dennis','Irizar Electric','Volvo Electric','Daimler eCitaro','MAN Electric','Yutong EV','CRRC Electric',
  'Covestro Carbon','Carbfix Iceland','44.01 Minerals','CarbonBuilt','Solidia Cement','Calix Ltd','Brimstone Energy','Chemetry Corp','Solugen Inc','Twelve CO2',
  'Radicle Change','South Pole Tech','Carbon180','Rocky Mtn Inst','World Resources','ClimateWorks','Bezos Earth Fund','Bloomberg Philanth','Omidyar Network','Prelude Ventures',
];

const COMPANIES = Array.from({ length: 400 }, (_, i) => {
  const sector = SECTORS[i % SECTORS.length];
  const stage = STAGES[Math.floor(sr(i * 7) * STAGES.length)];
  const geo = GEOS[Math.floor(sr(i * 11) * GEOS.length)];
  const founded = 2010 + Math.floor(sr(i * 13) * 15);
  const trl = 1 + Math.floor(sr(i * 17) * 9);
  const funding = Math.round(5 + sr(i * 19) * 995);
  const irr = Math.round(4 + sr(i * 23) * 36);
  const co2AvoidedMtpa = Math.round((0.01 + sr(i * 29) * 4.99) * 100) / 100;
  const waterSavedMn = Math.round(sr(i * 31) * 500);
  const jobsCreated = Math.round(50 + sr(i * 37) * 4950);
  const landHaMn = Math.round((sr(i * 41) * 2) * 100) / 100;
  const ipoReadiness = Math.round(10 + sr(i * 43) * 88);
  const revenue = Math.round(1 + sr(i * 47) * 499);
  const scalabilityScore = Math.round(15 + sr(i * 53) * 84);
  const patentCount = Math.round(sr(i * 59) * 120);
  const techRisk = RISK_LEVELS[Math.floor(sr(i * 61) * 3)];
  const marketRisk = RISK_LEVELS[Math.floor(sr(i * 67) * 3)];
  const policyRisk = RISK_LEVELS[Math.floor(sr(i * 71) * 3)];
  const lastRoundSize = Math.round(1 + sr(i * 73) * 199);
  const sbtiAligned = sr(i * 79) > 0.45;
  const climateImpactScore = Math.round(20 + sr(i * 83) * 79);
  const name = CO_NAMES[i] || `ClimateTech Co ${i + 1}`;
  return {
    id: i, name, sector, stage, geo, founded, trl, funding, irr, co2AvoidedMtpa,
    waterSavedMn, jobsCreated, landHaMn, ipoReadiness, revenue, scalabilityScore,
    patentCount, techRisk, marketRisk, policyRisk, lastRoundSize, sbtiAligned,
    climateImpactScore,
  };
});

const PATENT_DATA = Array.from({ length: 200 }, (_, i) => {
  const co = COMPANIES[Math.floor(sr(i * 3) * 400)];
  return {
    id: i,
    company: co.name,
    sector: co.sector,
    year: 2019 + Math.floor(sr(i * 7) * 7),
    patents: 1 + Math.floor(sr(i * 11) * 49),
    greenShare: Math.round(20 + sr(i * 13) * 79),
    cpcClass: CPC_CLASSES[Math.floor(sr(i * 17) * CPC_CLASSES.length)],
  };
});

const MARKET_TAM = SECTORS.map((s, i) => ({
  sector: s,
  tamBn: Math.round(50 + sr(i * 23) * 1950),
  samBn: Math.round(10 + sr(i * 29) * 490),
  cagr: Math.round((4 + sr(i * 31) * 28) * 10) / 10,
  marketMaturity: MATURITY[Math.floor(sr(i * 37) * 4)],
}));

// ─── helpers ─────────────────────────────────────────────────────────────────
const exportCSV = (rows, fn) => {
  if (!rows.length) return;
  const h = Object.keys(rows[0]);
  const csv = [h.join(','), ...rows.map(r => h.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
  const b = new Blob([csv], { type: 'text/csv' });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a'); a.href = u; a.download = fn; a.click();
  URL.revokeObjectURL(u);
};

const KpiCard = ({ label, value, sub, accent = T.navy }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', borderLeft: `3px solid ${accent}` }}>
    <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: T.textPri }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: accent, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Row = ({ children, cols }) => (
  <div style={{ display: 'grid', gridTemplateColumns: cols || 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 16 }}>{children}</div>
);

const Badge = ({ children, bg, fg }) => (
  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: bg || T.surfaceH, color: fg || T.textPri }}>{children}</span>
);

const Panel = ({ title, children, h }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, height: h }}>
    <div style={{ fontWeight: 600, fontSize: 13, color: T.textPri, marginBottom: 10 }}>{title}</div>
    {children}
  </div>
);

const riskColor = r => r === 'Low' ? T.green : r === 'Medium' ? T.amber : T.red;

// ─── main ─────────────────────────────────────────────────────────────────────
export default function ClimateTechPage() {
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const [geoFilter, setGeoFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('funding');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedId, setSelectedId] = useState(0);
  const [trlMin, setTrlMin] = useState(1);
  const [trlMax, setTrlMax] = useState(9);
  const [carbonPrice, setCarbonPrice] = useState(80);
  const [deploySpeed, setDeploySpeed] = useState(5);

  const th = { padding: '8px 10px', fontSize: 11, fontWeight: 600, color: T.textSec, background: T.surfaceH, border: `1px solid ${T.border}`, textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' };
  const td = { padding: '7px 10px', fontSize: 12, border: `1px solid ${T.border}`, color: T.textPri };

  const filtered = useMemo(() => {
    let c = [...COMPANIES];
    if (sectorFilter !== 'All') c = c.filter(x => x.sector === sectorFilter);
    if (stageFilter !== 'All') c = c.filter(x => x.stage === stageFilter);
    if (geoFilter !== 'All') c = c.filter(x => x.geo === geoFilter);
    if (search) c = c.filter(x => x.name.toLowerCase().includes(search.toLowerCase()));
    c = c.filter(x => x.trl >= trlMin && x.trl <= trlMax);
    return [...c].sort((a, b) => sortDir === 'asc' ? (a[sortCol] > b[sortCol] ? 1 : -1) : (a[sortCol] < b[sortCol] ? 1 : -1));
  }, [sectorFilter, stageFilter, geoFilter, search, sortCol, sortDir, trlMin, trlMax]);

  const toggleSort = col => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };

  const totalFunding = COMPANIES.reduce((a, c) => a + c.funding, 0);
  const avgTrl = Math.round(COMPANIES.reduce((a, c) => a + c.trl, 0) / COMPANIES.length * 10) / 10;
  const selectedCo = COMPANIES[selectedId] || COMPANIES[0];

  // ── Tab 0: Technology Landscape ─────────────────────────────────────────────
  const renderLandscape = () => {
    const trlDist = Array.from({ length: 9 }, (_, i) => ({ name: `TRL ${i + 1}`, count: COMPANIES.filter(c => c.trl === i + 1).length }));
    const sectorDist = SECTORS.map(s => { const cs = COMPANIES.filter(c => c.sector === s); return { name: s.slice(0, 16), count: cs.length, avgTrl: cs.length ? Math.round(cs.reduce((a, c) => a + c.trl, 0) / cs.length * 10) / 10 : 0 }; });
    const geoDist = GEOS.map(g => ({ name: g, value: COMPANIES.filter(c => c.geo === g).length }));
    return (
      <div>
        <Row cols="repeat(5,1fr)">
          <KpiCard label="Companies Tracked" value="400" accent={T.navy} />
          <KpiCard label="Avg TRL" value={avgTrl} sub={avgTrl > 5 ? 'Deployment-ready' : 'R&D Phase'} accent={avgTrl > 5 ? T.green : T.amber} />
          <KpiCard label="Total Funding" value={`$${(totalFunding / 1000).toFixed(0)}B`} accent={T.gold} />
          <KpiCard label="SBTi Aligned" value={COMPANIES.filter(c => c.sbtiAligned).length} sub="Companies" accent={T.teal} />
          <KpiCard label="Sectors Covered" value={SECTORS.length} accent={T.indigo} />
        </Row>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="Search company..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 12, minWidth: 160 }} />
          <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 12 }}>
            <option value="All">All Sectors</option>{SECTORS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 12 }}>
            <option value="All">All Stages</option>{STAGES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={geoFilter} onChange={e => setGeoFilter(e.target.value)} style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 12 }}>
            <option value="All">All Geographies</option>{GEOS.map(g => <option key={g}>{g}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: T.textSec }}>TRL:</span>
            <input type="range" min={1} max={9} value={trlMin} onChange={e => setTrlMin(Math.min(+e.target.value, trlMax))} style={{ width: 70, accentColor: T.navy }} />
            <span style={{ fontFamily: T.fontMono, fontSize: 11 }}>{trlMin}–{trlMax}</span>
            <input type="range" min={1} max={9} value={trlMax} onChange={e => setTrlMax(Math.max(+e.target.value, trlMin))} style={{ width: 70, accentColor: T.navy }} />
          </div>
          <button onClick={() => exportCSV(filtered.map(c => ({ Name: c.name, Sector: c.sector, TRL: c.trl, Stage: c.stage, Geo: c.geo, Founded: c.founded, Funding: c.funding, IRR: c.irr, SBTi: c.sbtiAligned })), 'climate_tech_landscape.csv')} style={{ background: T.navy, color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>Export CSV</button>
        </div>
        <Row cols="1fr 1fr">
          <Panel title="TRL Distribution (400 Companies)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trlDist}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip />
                <Bar dataKey="count" name="Companies" radius={[3, 3, 0, 0]}>
                  {trlDist.map((_, i) => <Cell key={i} fill={i < 3 ? T.amber : i < 6 ? T.gold : T.green} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="Geographic Distribution">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={geoDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name.slice(0, 8)}: ${value}`} labelLine={false}>
                  {geoDist.map((_, i) => <Cell key={i} fill={PIE_C[i % PIE_C.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Panel>
        </Row>
        <Panel title="Companies by Sector (count & avg TRL)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sectorDist} margin={{ bottom: 55 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend />
              <Bar dataKey="count" fill={T.navy} name="Companies" radius={[3, 3, 0, 0]} />
              <Bar dataKey="avgTrl" fill={T.gold} name="Avg TRL" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title={`Filtered Results (${filtered.length} companies)`}>
          <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>{[{ k: 'name', l: 'Company' }, { k: 'sector', l: 'Sector' }, { k: 'founded', l: 'Founded' }, { k: 'trl', l: 'TRL' }, { k: 'stage', l: 'Stage' }, { k: 'geo', l: 'Geography' }, { k: 'funding', l: 'Funding $M' }, { k: 'irr', l: 'IRR %' }, { k: 'climateImpactScore', l: 'Impact Score' }].map(c => <th key={c.k} style={th} onClick={() => toggleSort(c.k)}>{c.l}{sortCol === c.k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map(c => (
                  <tr key={c.id} style={{ cursor: 'pointer', background: selectedId === c.id ? T.surfaceH : 'transparent' }} onClick={() => setSelectedId(c.id)}>
                    <td style={{ ...td, fontWeight: 500 }}>{c.name}</td>
                    <td style={{ ...td, fontSize: 11 }}>{c.sector}</td>
                    <td style={{ ...td, fontFamily: T.fontMono }}>{c.founded}</td>
                    <td style={td}><span style={{ fontFamily: T.fontMono, fontWeight: 700, color: c.trl > 6 ? T.green : c.trl > 3 ? T.amber : T.red }}>TRL {c.trl}</span></td>
                    <td style={td}><Badge>{c.stage}</Badge></td>
                    <td style={td}>{c.geo}</td>
                    <td style={{ ...td, fontFamily: T.fontMono }}>${c.funding}M</td>
                    <td style={{ ...td, fontFamily: T.fontMono }}>{c.irr}%</td>
                    <td style={td}><span style={{ fontFamily: T.fontMono, color: c.climateImpactScore > 60 ? T.green : T.amber }}>{c.climateImpactScore}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    );
  };

  // ── Tab 1: Investment Analytics ─────────────────────────────────────────────
  const renderInvestment = () => {
    const stageDist = STAGES.map(s => { const cs = COMPANIES.filter(c => c.stage === s); return { name: s, count: cs.length, funding: Math.round(cs.reduce((a, c) => a + c.funding, 0)), avgIrr: cs.length ? Math.round(cs.reduce((a, c) => a + c.irr, 0) / cs.length * 10) / 10 : 0 }; });
    const topFunded = [...COMPANIES].sort((a, b) => b.funding - a.funding).slice(0, 15).map(c => ({ name: c.name.slice(0, 18), funding: c.funding, irr: c.irr }));
    const irrBuckets = [0, 10, 15, 20, 25, 30, 40].map((v, i, arr) => ({ range: `${v}–${arr[i + 1] || '40+'}%`, count: COMPANIES.filter(c => c.irr >= v && c.irr < (arr[i + 1] || 999)).length })).slice(0, -1);
    const yearlyFunding = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map((y, i) => ({ year: y, total: Math.round(totalFunding * [0.04, 0.06, 0.07, 0.10, 0.14, 0.18, 0.22, 0.19][i]) }));
    const stageSectorHeat = STAGES.map(s => { const obj = { stage: s }; SECTORS.slice(0, 7).forEach(sec => { const cs = COMPANIES.filter(c => c.stage === s && c.sector === sec); obj[sec.slice(0, 8)] = cs.length ? Math.round(cs.reduce((a, c) => a + c.funding, 0) / cs.length) : 0; }); return obj; });
    const avgRound = COMPANIES.length ? Math.round(COMPANIES.reduce((a, c) => a + c.lastRoundSize, 0) / COMPANIES.length) : 0;
    return (
      <div>
        <Row cols="repeat(5,1fr)">
          <KpiCard label="Total Funding" value={`$${(totalFunding / 1000).toFixed(1)}B`} accent={T.navy} />
          <KpiCard label="Avg Round Size" value={`$${avgRound}M`} accent={T.gold} />
          <KpiCard label="Median IRR" value={`${[...COMPANIES].sort((a, b) => a.irr - b.irr)[200].irr}%`} accent={T.green} />
          <KpiCard label="Pre-IPO / Public" value={COMPANIES.filter(c => c.stage === 'Pre-IPO' || c.stage === 'Public').length} accent={T.indigo} />
          <KpiCard label="Seed Stage" value={COMPANIES.filter(c => c.stage === 'Seed').length} sub="Early stage" accent={T.amber} />
        </Row>
        <Row cols="1fr 1fr">
          <Panel title="Annual Climate Tech Funding ($M)">
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={yearlyFunding}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="total" fill={T.indigo + '30'} stroke={T.indigo} name="Funding $M" />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="IRR Distribution (Histogram)">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={irrBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip />
                <Bar dataKey="count" name="Companies" radius={[3, 3, 0, 0]}>
                  {irrBuckets.map((_, i) => <Cell key={i} fill={i < 2 ? T.red : i < 4 ? T.gold : T.green} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </Row>
        <Row cols="2fr 1fr">
          <Panel title="Top 15 Companies by Funding">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={topFunded} layout="vertical" margin={{ left: 110 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} width={105} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend />
                <Bar dataKey="funding" fill={T.navy} name="Funding $M" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="Stage × Funding Mix">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={stageDist}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-30} textAnchor="end" height={55} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill={T.navy} name="Companies" radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="avgIrr" fill={T.gold} name="Avg IRR %" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </Row>
        <Panel title="Stage × Sector Average Funding Heatmap ($M)">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr><th style={th}>Stage</th>{SECTORS.slice(0, 7).map(s => <th key={s} style={{ ...th, textAlign: 'center' }}>{s.slice(0, 12)}</th>)}</tr></thead>
              <tbody>{stageSectorHeat.map((row, i) => <tr key={i}>{['stage', ...SECTORS.slice(0, 7).map(s => s.slice(0, 8))].map((k, j) => <td key={j} style={{ ...td, textAlign: j > 0 ? 'center' : 'left', fontFamily: j > 0 ? T.fontMono : 'inherit', background: j > 0 ? (row[k] > 200 ? T.navy + '25' : row[k] > 80 ? T.gold + '30' : 'transparent') : 'transparent', fontWeight: j === 0 ? 600 : 400 }}>{j === 0 ? row.stage : (row[k] ? `$${row[k]}M` : '—')}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </Panel>
      </div>
    );
  };

  // ── Tab 2: Impact Assessment ─────────────────────────────────────────────────
  const renderImpact = () => {
    const totalCO2 = COMPANIES.reduce((a, c) => a + c.co2AvoidedMtpa, 0);
    const sectorImpact = SECTORS.map(s => { const cs = COMPANIES.filter(c => c.sector === s); return { name: s.slice(0, 14), co2: cs.length ? Math.round(cs.reduce((a, c) => a + c.co2AvoidedMtpa, 0) * 100) / 100 : 0, jobs: cs.length ? Math.round(cs.reduce((a, c) => a + c.jobsCreated, 0) / cs.length) : 0 }; });
    const topImpact = [...COMPANIES].sort((a, b) => b.climateImpactScore - a.climateImpactScore).slice(0, 20).map(c => ({ name: c.name.slice(0, 18), score: c.climateImpactScore, co2: c.co2AvoidedMtpa }));
    const scatterData = COMPANIES.slice(0, 80).map(c => ({ name: c.name, x: c.waterSavedMn, y: c.jobsCreated, z: c.co2AvoidedMtpa, sector: c.sector }));
    const portfolioValue = Math.round(totalCO2 * carbonPrice * 1000000 / 1e9);
    return (
      <div>
        <Row cols="repeat(5,1fr)">
          <KpiCard label="Total CO2 Avoided" value={`${totalCO2.toFixed(1)} Mtpa`} accent={T.sage} />
          <KpiCard label="Total Jobs Created" value={`${(COMPANIES.reduce((a, c) => a + c.jobsCreated, 0) / 1000).toFixed(0)}K`} accent={T.navy} />
          <KpiCard label="Water Saved" value={`${(COMPANIES.reduce((a, c) => a + c.waterSavedMn, 0) / 1000).toFixed(1)}Bn L`} accent={T.teal} />
          <KpiCard label="SBTi Aligned" value={COMPANIES.filter(c => c.sbtiAligned).length} sub={`${Math.round(COMPANIES.filter(c => c.sbtiAligned).length / COMPANIES.length * 100)}% of universe`} accent={T.green} />
          <KpiCard label="Carbon Value @$${carbonPrice}" value={`$${portfolioValue}B`} accent={T.gold} />
        </Row>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: T.textPri }}>What-If: Carbon Price</div>
          <input type="range" min={20} max={300} step={5} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ width: 180, accentColor: T.sage }} />
          <span style={{ fontFamily: T.fontMono, fontSize: 13, fontWeight: 700, color: T.sage }}>${carbonPrice}/tCO2e</span>
          <span style={{ fontSize: 12, color: T.textSec }}>→ Portfolio carbon asset value: <strong style={{ color: T.gold }}>${portfolioValue}B</strong></span>
        </div>
        <Row cols="1fr 1fr">
          <Panel title="CO2 Avoided by Sector (Mtpa)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sectorImpact} margin={{ bottom: 55 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="co2" fill={T.sage} name="CO2 Avoided Mtpa" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="Water Saved vs Jobs Created (sample 80)">
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" dataKey="x" name="Water Saved (ML)" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Water Saved ML', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis type="number" dataKey="y" name="Jobs" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Jobs', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => { if (!payload || !payload.length) return null; const d = payload[0].payload; return <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 11 }}><div style={{ fontWeight: 600 }}>{d.name}</div><div>Water: {d.x}ML | Jobs: {d.y.toLocaleString()}</div><div>CO2: {d.z}Mtpa</div></div>; }} />
                <Scatter data={scatterData} fill={T.teal} fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </Panel>
        </Row>
        <Panel title="Top 20 Companies by Climate Impact Score">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topImpact} layout="vertical" margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} width={115} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="score" fill={T.green} name="Impact Score" radius={[0, 3, 3, 0]}>
                {topImpact.map((d, i) => <Cell key={i} fill={d.score > 80 ? T.green : d.score > 60 ? T.teal : T.amber} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    );
  };

  // ── Tab 3: Portfolio Exposure ────────────────────────────────────────────────
  const renderPortfolio = () => {
    const portfolio = COMPANIES.filter(c => c.climateImpactScore > 65).slice(0, 50);
    const sectorAlloc = SECTORS.map(s => { const cs = portfolio.filter(c => c.sector === s); return { name: s.slice(0, 14), value: cs.length, pct: portfolio.length ? Math.round(cs.length / portfolio.length * 1000) / 10 : 0 }; }).filter(s => s.value > 0);
    const geoBar = GEOS.map(g => ({ name: g, count: portfolio.filter(c => c.geo === g).length }));
    const riskMatrix = portfolio.slice(0, 60).map(c => ({ name: c.name, x: ['Low', 'Medium', 'High'].indexOf(c.techRisk) + 1 + sr(c.id * 3) * 0.6 - 0.3, y: ['Low', 'Medium', 'High'].indexOf(c.marketRisk) + 1 + sr(c.id * 7) * 0.6 - 0.3, funding: c.funding, sector: c.sector }));
    const sbtiSector = SECTORS.map(s => { const cs = COMPANIES.filter(c => c.sector === s); const aligned = cs.filter(c => c.sbtiAligned).length; return { name: s.slice(0, 12), aligned, total: cs.length, pct: cs.length ? Math.round(aligned / cs.length * 100) : 0 }; });
    const trlPipe = [{ stage: 'Early (1-3)', count: portfolio.filter(c => c.trl <= 3).length }, { stage: 'Mid (4-6)', count: portfolio.filter(c => c.trl >= 4 && c.trl <= 6).length }, { stage: 'Mature (7-9)', count: portfolio.filter(c => c.trl >= 7).length }];
    return (
      <div>
        <Row cols="repeat(4,1fr)">
          <KpiCard label="Portfolio Companies" value={portfolio.length} accent={T.navy} />
          <KpiCard label="Avg Climate Impact" value={`${portfolio.length ? Math.round(portfolio.reduce((a, c) => a + c.climateImpactScore, 0) / portfolio.length) : 0}/100`} accent={T.green} />
          <KpiCard label="SBTi Aligned (Portfolio)" value={portfolio.filter(c => c.sbtiAligned).length} sub={`${portfolio.length ? Math.round(portfolio.filter(c => c.sbtiAligned).length / portfolio.length * 100) : 0}%`} accent={T.teal} />
          <KpiCard label="Avg TRL (Portfolio)" value={portfolio.length ? Math.round(portfolio.reduce((a, c) => a + c.trl, 0) / portfolio.length * 10) / 10 : 0} accent={T.amber} />
        </Row>
        <Row cols="1fr 1fr">
          <Panel title="Sector Allocation (High-Impact Portfolio)">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={sectorAlloc} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, pct }) => `${name.slice(0, 10)}: ${pct}%`} labelLine={false}>
                  {sectorAlloc.map((_, i) => <Cell key={i} fill={PIE_C[i % PIE_C.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="TRL Pipeline Distribution">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trlPipe}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip />
                <Bar dataKey="count" name="Companies" radius={[4, 4, 0, 0]}>
                  {trlPipe.map((_, i) => <Cell key={i} fill={[T.amber, T.gold, T.green][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </Row>
        <Row cols="1fr 1fr">
          <Panel title="Geographic Diversification">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={geoBar} layout="vertical" margin={{ left: 110 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} width={105} />
                <Tooltip />
                <Bar dataKey="count" fill={T.indigo} name="Companies" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="Risk Matrix: Tech Risk vs Market Risk">
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" dataKey="x" domain={[0.5, 3.5]} ticks={[1, 2, 3]} tickFormatter={v => ['', 'Low', 'Med', 'High'][Math.round(v)] || ''} tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Tech Risk', position: 'insideBottom', offset: -10, fontSize: 10 }} />
                <YAxis type="number" dataKey="y" domain={[0.5, 3.5]} ticks={[1, 2, 3]} tickFormatter={v => ['', 'Low', 'Med', 'High'][Math.round(v)] || ''} tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Market Risk', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip content={({ payload }) => { if (!payload || !payload.length) return null; const d = payload[0].payload; return <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 11 }}><div style={{ fontWeight: 600 }}>{d.name}</div><div>Funding: ${d.funding}M</div></div>; }} />
                <Scatter data={riskMatrix} fill={T.red} fillOpacity={0.5} />
              </ScatterChart>
            </ResponsiveContainer>
          </Panel>
        </Row>
        <Panel title="SBTi Alignment by Sector (% Aligned)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sbtiSector} margin={{ bottom: 55 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={{ fontSize: 12 }} formatter={v => `${v}%`} />
              <Bar dataKey="pct" name="SBTi Aligned %" radius={[3, 3, 0, 0]}>
                {sbtiSector.map((d, i) => <Cell key={i} fill={d.pct > 60 ? T.green : d.pct > 35 ? T.amber : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    );
  };

  // ── Tab 4: Patent Intelligence ───────────────────────────────────────────────
  const renderPatents = () => {
    const bySector = SECTORS.map(s => { const ps = PATENT_DATA.filter(p => p.sector === s); return { name: s.slice(0, 14), total: ps.reduce((a, p) => a + p.patents, 0), avgGreen: ps.length ? Math.round(ps.reduce((a, p) => a + p.greenShare, 0) / ps.length) : 0 }; });
    const byCpc = CPC_CLASSES.map(c => ({ name: c, value: PATENT_DATA.filter(p => p.cpcClass === c).reduce((a, p) => a + p.patents, 0) }));
    const byYear = [2019, 2020, 2021, 2022, 2023, 2024, 2025].map(y => { const ps = PATENT_DATA.filter(p => p.year === y); return { year: y, total: ps.reduce((a, p) => a + p.patents, 0), avgGreen: ps.length ? Math.round(ps.reduce((a, p) => a + p.greenShare, 0) / ps.length) : 0 }; });
    const topByCount = Object.entries(PATENT_DATA.reduce((acc, p) => { acc[p.company] = (acc[p.company] || 0) + p.patents; return acc; }, {})).map(([name, patents]) => ({ name: name.slice(0, 20), patents })).sort((a, b) => b.patents - a.patents).slice(0, 20);
    const totalPatents = PATENT_DATA.reduce((a, p) => a + p.patents, 0);
    return (
      <div>
        <Row cols="repeat(4,1fr)">
          <KpiCard label="Total Patents Filed" value={totalPatents.toLocaleString()} accent={T.indigo} />
          <KpiCard label="Patent Records" value="200" sub="Tracked filings" accent={T.navy} />
          <KpiCard label="Avg Green Share" value={`${PATENT_DATA.length ? Math.round(PATENT_DATA.reduce((a, p) => a + p.greenShare, 0) / PATENT_DATA.length) : 0}%`} accent={T.green} />
          <KpiCard label="CPC Classes" value={CPC_CLASSES.length} sub="Y02E/T/W/B + Y04S" accent={T.teal} />
        </Row>
        <Row cols="1fr 1fr">
          <Panel title="Patent Filings by Sector">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={bySector} margin={{ bottom: 55 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill={T.indigo} name="Total Patents" radius={[3, 3, 0, 0]} />
                <Bar dataKey="avgGreen" fill={T.green} name="Avg Green Share %" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="CPC Class Distribution">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={byCpc} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {byCpc.map((_, i) => <Cell key={i} fill={PIE_C[i % PIE_C.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Panel>
        </Row>
        <Panel title="Green Share by Year (%) — Area Chart">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={byYear}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend />
              <Area type="monotone" dataKey="avgGreen" fill={T.green + '30'} stroke={T.green} name="Avg Green Share %" />
              <Area type="monotone" dataKey="total" fill={T.indigo + '20'} stroke={T.indigo} name="Total Patents" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Top 20 Companies by Patent Count">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topByCount} layout="vertical" margin={{ left: 140 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} width={135} />
              <Tooltip />
              <Bar dataKey="patents" fill={T.purple} name="Patents" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    );
  };

  // ── Tab 5: Market Size & Growth ──────────────────────────────────────────────
  const renderMarket = () => {
    const totalTam = MARKET_TAM.reduce((a, m) => a + m.tamBn, 0);
    const maturityDist = MATURITY.map(m => ({ name: m, count: MARKET_TAM.filter(x => x.marketMaturity === m).length }));
    const cagrRank = [...MARKET_TAM].sort((a, b) => b.cagr - a.cagr);
    const bubble = MARKET_TAM.map(m => ({ name: m.sector.slice(0, 14), x: m.cagr, y: m.tamBn, sam: m.samBn }));
    return (
      <div>
        <Row cols="repeat(4,1fr)">
          <KpiCard label="Total TAM" value={`$${(totalTam / 1000).toFixed(1)}T`} accent={T.gold} />
          <KpiCard label="Total SAM" value={`$${(MARKET_TAM.reduce((a, m) => a + m.samBn, 0) / 1000).toFixed(1)}T`} accent={T.navy} />
          <KpiCard label="Highest CAGR" value={`${Math.max(...MARKET_TAM.map(m => m.cagr))}%`} sub={[...MARKET_TAM].sort((a, b) => b.cagr - a.cagr)[0].sector.slice(0, 20)} accent={T.green} />
          <KpiCard label="Sectors Analyzed" value={MARKET_TAM.length} accent={T.indigo} />
        </Row>
        <Row cols="1fr 1fr">
          <Panel title="TAM & SAM by Sector ($Bn)">
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={MARKET_TAM.map(m => ({ name: m.sector.slice(0, 12), tam: m.tamBn, sam: m.samBn }))} margin={{ bottom: 55 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend />
                <Bar dataKey="tam" fill={T.navy} name="TAM $Bn" radius={[3, 3, 0, 0]} />
                <Bar dataKey="sam" fill={T.gold} name="SAM $Bn" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="CAGR Ranking by Sector">
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={cagrRank.map(m => ({ name: m.sector.slice(0, 14), cagr: m.cagr }))} layout="vertical" margin={{ left: 110 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} width={105} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={v => `${v}%`} />
                <Bar dataKey="cagr" name="CAGR %" radius={[0, 3, 3, 0]}>
                  {cagrRank.map((d, i) => <Cell key={i} fill={d.cagr > 25 ? T.green : d.cagr > 15 ? T.amber : T.navy} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </Row>
        <Row cols="1fr 1fr">
          <Panel title="Market Maturity Distribution">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={maturityDist}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip />
                <Bar dataKey="count" name="Sectors" radius={[4, 4, 0, 0]}>
                  {maturityDist.map((_, i) => <Cell key={i} fill={[T.red, T.amber, T.gold, T.green][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="CAGR vs TAM Bubble (size = SAM)">
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" dataKey="x" name="CAGR %" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'CAGR %', position: 'insideBottom', offset: -10, fontSize: 10 }} />
                <YAxis type="number" dataKey="y" name="TAM $Bn" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'TAM $Bn', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip content={({ payload }) => { if (!payload || !payload.length) return null; const d = payload[0].payload; return <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 11 }}><div style={{ fontWeight: 600 }}>{d.name}</div><div>TAM: ${d.y}Bn | CAGR: {d.x}%</div><div>SAM: ${d.sam}Bn</div></div>; }} />
                <Scatter data={bubble} fill={T.teal} fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </Panel>
        </Row>
        <Panel title="Market Overview Table">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr>{['Sector', 'TAM ($Bn)', 'SAM ($Bn)', 'CAGR (%)', 'Maturity'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{MARKET_TAM.map((m, i) => <tr key={i}><td style={{ ...td, fontWeight: 500 }}>{m.sector}</td><td style={{ ...td, fontFamily: T.fontMono }}>${m.tamBn}B</td><td style={{ ...td, fontFamily: T.fontMono }}>${m.samBn}B</td><td style={{ ...td, fontFamily: T.fontMono, color: m.cagr > 25 ? T.green : m.cagr > 15 ? T.amber : T.textPri }}>{m.cagr}%</td><td style={td}><Badge bg={m.marketMaturity === 'Mature' ? T.green + '20' : m.marketMaturity === 'Growth' ? T.gold + '20' : T.amber + '20'} fg={m.marketMaturity === 'Mature' ? T.green : m.marketMaturity === 'Growth' ? T.gold : T.amber}>{m.marketMaturity}</Badge></td></tr>)}</tbody>
            </table>
          </div>
        </Panel>
      </div>
    );
  };

  // ── Tab 6: Technology Readiness ──────────────────────────────────────────────
  const renderTRL = () => {
    const trlBySector = SECTORS.map(s => { const cs = COMPANIES.filter(c => c.sector === s); const obj = { sector: s.slice(0, 14) }; for (let t = 1; t <= 9; t++) obj[`TRL${t}`] = cs.filter(c => c.trl === t).length; obj.avg = cs.length ? Math.round(cs.reduce((a, c) => a + c.trl, 0) / cs.length * 10) / 10 : 0; return obj; });
    const avgBySector = trlBySector.map(r => ({ name: r.sector, avg: r.avg }));
    const pipeline = [{ stage: 'Early (TRL 1-3)', count: COMPANIES.filter(c => c.trl <= 3).length, pct: Math.round(COMPANIES.filter(c => c.trl <= 3).length / COMPANIES.length * 100) }, { stage: 'Mid (TRL 4-6)', count: COMPANIES.filter(c => c.trl >= 4 && c.trl <= 6).length, pct: Math.round(COMPANIES.filter(c => c.trl >= 4 && c.trl <= 6).length / COMPANIES.length * 100) }, { stage: 'Deploy (TRL 7-9)', count: COMPANIES.filter(c => c.trl >= 7).length, pct: Math.round(COMPANIES.filter(c => c.trl >= 7).length / COMPANIES.length * 100) }];
    const byLevel = Array.from({ length: 9 }, (_, i) => ({ trl: `TRL ${i + 1}`, count: COMPANIES.filter(c => c.trl === i + 1).length }));
    const deployYear = 2026 + Math.round((10 - deploySpeed));
    return (
      <div>
        <Row cols="repeat(4,1fr)">
          <KpiCard label="Avg TRL (Universe)" value={avgTrl} accent={avgTrl > 6 ? T.green : T.amber} />
          <KpiCard label="Deploy-Ready (TRL 7-9)" value={COMPANIES.filter(c => c.trl >= 7).length} sub={`${Math.round(COMPANIES.filter(c => c.trl >= 7).length / COMPANIES.length * 100)}% of universe`} accent={T.green} />
          <KpiCard label="Early Stage (TRL 1-3)" value={COMPANIES.filter(c => c.trl <= 3).length} accent={T.red} />
          <KpiCard label="Mid-Stage (TRL 4-6)" value={COMPANIES.filter(c => c.trl >= 4 && c.trl <= 6).length} accent={T.amber} />
        </Row>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: T.textPri }}>What-If: Deployment Speed</div>
          <input type="range" min={1} max={10} value={deploySpeed} onChange={e => setDeploySpeed(+e.target.value)} style={{ width: 180, accentColor: T.indigo }} />
          <span style={{ fontFamily: T.fontMono, fontSize: 13, fontWeight: 700, color: T.indigo }}>Speed {deploySpeed}/10</span>
          <span style={{ fontSize: 12, color: T.textSec }}>→ TRL 9 deployment at scale by: <strong style={{ color: T.navy }}>{deployYear}</strong></span>
        </div>
        <Row cols="1fr 1fr">
          <Panel title="TRL Pipeline Funnel">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={pipeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend />
                <Bar dataKey="count" name="Companies" radius={[4, 4, 0, 0]}>
                  {pipeline.map((_, i) => <Cell key={i} fill={[T.red, T.amber, T.green][i]} />)}
                </Bar>
                <Bar dataKey="pct" name="%" radius={[4, 4, 0, 0]}>
                  {pipeline.map((_, i) => <Cell key={i} fill={[T.red + '60', T.amber + '60', T.green + '60'][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="Companies at Each TRL Level">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={byLevel}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="trl" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip />
                <Bar dataKey="count" name="Companies" radius={[3, 3, 0, 0]}>
                  {byLevel.map((_, i) => <Cell key={i} fill={i < 3 ? T.red : i < 6 ? T.amber : T.green} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </Row>
        <Panel title="Avg TRL by Sector">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={avgBySector} margin={{ bottom: 55 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 9]} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="avg" name="Avg TRL" radius={[3, 3, 0, 0]}>
                {avgBySector.map((d, i) => <Cell key={i} fill={d.avg > 6 ? T.green : d.avg > 4 ? T.amber : T.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="TRL Heatmap by Sector (company count)">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr><th style={th}>Sector</th>{Array.from({ length: 9 }, (_, i) => <th key={i} style={{ ...th, textAlign: 'center', minWidth: 38 }}>TRL {i + 1}</th>)}<th style={{ ...th, textAlign: 'center' }}>Avg</th></tr></thead>
              <tbody>{trlBySector.map((row, i) => <tr key={i}><td style={{ ...td, fontWeight: 500, fontSize: 11 }}>{row.sector}</td>{Array.from({ length: 9 }, (_, t) => <td key={t} style={{ ...td, textAlign: 'center', fontFamily: T.fontMono, background: row[`TRL${t + 1}`] > 8 ? T.navy + '30' : row[`TRL${t + 1}`] > 4 ? T.gold + '30' : row[`TRL${t + 1}`] > 0 ? T.amber + '15' : 'transparent' }}>{row[`TRL${t + 1}`] || '—'}</td>)}<td style={{ ...td, textAlign: 'center', fontFamily: T.fontMono, fontWeight: 700, color: row.avg > 6 ? T.green : T.amber }}>{row.avg}</td></tr>)}</tbody>
            </table>
          </div>
        </Panel>
      </div>
    );
  };

  // ── Tab 7: Exit & IPO Analytics ──────────────────────────────────────────────
  const renderExit = () => {
    const ipoBuckets = [0, 20, 40, 60, 80, 100].map((v, i, arr) => ({ range: `${v}–${arr[i + 1] || 100}`, count: COMPANIES.filter(c => c.ipoReadiness >= v && c.ipoReadiness < (arr[i + 1] || 101)).length })).slice(0, -1);
    const top20Ipo = [...COMPANIES].sort((a, b) => b.ipoReadiness - a.ipoReadiness).slice(0, 20).map(c => ({ name: c.name.slice(0, 20), score: c.ipoReadiness, stage: c.stage }));
    const exitPipeline = STAGES.map(s => ({ stage: s, count: COMPANIES.filter(c => c.stage === s).length, avgIpo: COMPANIES.filter(c => c.stage === s).length ? Math.round(COMPANIES.filter(c => c.stage === s).reduce((a, c) => a + c.ipoReadiness, 0) / COMPANIES.filter(c => c.stage === s).length) : 0 }));
    const revFunding = COMPANIES.slice(0, 100).map(c => ({ name: c.name, x: c.funding, y: c.revenue, multiple: c.revenue > 0 ? Math.round(c.funding / c.revenue * 10) / 10 : 0 }));
    const avgMultipleBySector = SECTORS.map(s => { const cs = COMPANIES.filter(c => c.sector === s && c.revenue > 0); return { name: s.slice(0, 12), multiple: cs.length ? Math.round(cs.reduce((a, c) => a + c.funding / Math.max(1, c.revenue), 0) / cs.length * 10) / 10 : 0 }; });
    return (
      <div>
        <Row cols="repeat(4,1fr)">
          <KpiCard label="IPO Readiness >80" value={COMPANIES.filter(c => c.ipoReadiness > 80).length} sub="Near-term candidates" accent={T.green} />
          <KpiCard label="Pre-IPO / Public" value={COMPANIES.filter(c => c.stage === 'Pre-IPO' || c.stage === 'Public').length} accent={T.navy} />
          <KpiCard label="Avg IPO Readiness" value={`${COMPANIES.length ? Math.round(COMPANIES.reduce((a, c) => a + c.ipoReadiness, 0) / COMPANIES.length) : 0}/100`} accent={T.gold} />
          <KpiCard label="Avg Revenue Multiple" value={`${COMPANIES.filter(c => c.revenue > 0).length ? Math.round(COMPANIES.filter(c => c.revenue > 0).reduce((a, c) => a + c.funding / Math.max(1, c.revenue), 0) / COMPANIES.filter(c => c.revenue > 0).length * 10) / 10 : 0}×`} accent={T.indigo} />
        </Row>
        <Row cols="1fr 1fr">
          <Panel title="IPO Readiness Score Distribution">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ipoBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip />
                <Bar dataKey="count" name="Companies" radius={[3, 3, 0, 0]}>
                  {ipoBuckets.map((_, i) => <Cell key={i} fill={i < 2 ? T.red : i < 4 ? T.amber : T.green} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="Exit Stage Pipeline">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={exitPipeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="stage" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill={T.navy} name="Companies" radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="avgIpo" fill={T.gold} name="Avg IPO Score" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </Row>
        <Panel title="Top 20 by IPO Readiness Score">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={top20Ipo} layout="vertical" margin={{ left: 150 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} width={145} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="score" fill={T.indigo} name="IPO Readiness" radius={[0, 3, 3, 0]}>
                {top20Ipo.map((d, i) => <Cell key={i} fill={d.score > 80 ? T.green : d.score > 60 ? T.indigo : T.amber} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Row cols="1fr 1fr">
          <Panel title="Revenue vs Funding Scatter (sample 100)">
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" dataKey="x" name="Funding $M" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Funding $M', position: 'insideBottom', offset: -10, fontSize: 10 }} />
                <YAxis type="number" dataKey="y" name="Revenue $M" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'Revenue $M', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip content={({ payload }) => { if (!payload || !payload.length) return null; const d = payload[0].payload; return <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 11 }}><div style={{ fontWeight: 600 }}>{d.name}</div><div>Funding: ${d.x}M | Revenue: ${d.y}M</div><div>Multiple: {d.multiple}×</div></div>; }} />
                <Scatter data={revFunding} fill={T.purple} fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="Avg Funding/Revenue Multiple by Sector">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={avgMultipleBySector} margin={{ bottom: 55 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ fontSize: 12 }} formatter={v => `${v}×`} />
                <Bar dataKey="multiple" name="Funding/Revenue" radius={[3, 3, 0, 0]}>
                  {avgMultipleBySector.map((d, i) => <Cell key={i} fill={d.multiple > 10 ? T.purple : d.multiple > 5 ? T.indigo : T.navy} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </Row>
      </div>
    );
  };

  const renderers = [renderLandscape, renderInvestment, renderImpact, renderPortfolio, renderPatents, renderMarket, renderTRL, renderExit];

  return (
    <div style={{ fontFamily: 'DM Sans, system-ui, sans-serif', background: T.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: T.gold, fontFamily: T.fontMono, marginBottom: 4, letterSpacing: 1 }}>EP-DF6 · CLIMATE TECHNOLOGY INTELLIGENCE</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', margin: 0 }}>Climate Technology Analytics</h1>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>400 companies · 14 sectors · 8 analytical dimensions · Patent & market intelligence</p>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Total Funding</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.gold, fontFamily: T.fontMono }}>${(totalFunding / 1000).toFixed(0)}B</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Avg TRL</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', fontFamily: T.fontMono }}>{avgTrl}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, background: T.card, overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '10px 18px', fontSize: 12, fontWeight: tab === i ? 700 : 500, color: tab === i ? T.navy : T.textSec, background: 'transparent', border: 'none', borderBottom: tab === i ? `2px solid ${T.navy}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: -2 }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px' }}>
        {renderers[tab] && renderers[tab]()}
      </div>
    </div>
  );
}
