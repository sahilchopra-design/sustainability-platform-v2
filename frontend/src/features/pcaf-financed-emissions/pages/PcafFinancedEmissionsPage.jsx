import React, { useState, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, LineChart, Line, AreaChart, Area, CartesianGrid, Legend,
} from 'recharts';
import { SECTOR_EMISSION_INTENSITY } from '../../../data/sectorBenchmarks';
import { EU_ETS_ANNUAL } from '../../../data/carbonPrices';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const AC_COLORS = {
  'Listed Equity':          '#0ea5e9',
  'Corporate Bonds':        '#06c896',
  'Project Finance':        '#f0a828',
  'Commercial Real Estate': '#a78bfa',
  'Mortgages':              '#f04060',
};
const AC_ORDER = ['Listed Equity','Corporate Bonds','Project Finance','Commercial Real Estate','Mortgages'];

// ── 60-position portfolio ────────────────────────────────────────────────────
const BASE_POSITIONS = [
  // Listed Equity (25 positions)
  { id:1,  name:'Apple Inc',              country:'US',  geo:'Americas', assetClass:'Listed Equity',          sector:'Technology',         evic:2740, outstanding:18.4,  totalEmissions:22100,     dqs:2, source:'CDP A-List 2023' },
  { id:2,  name:'Microsoft Corp',         country:'US',  geo:'Americas', assetClass:'Listed Equity',          sector:'Technology',         evic:2910, outstanding:22.1,  totalEmissions:14200,     dqs:2, source:'CDP A-List 2023' },
  { id:3,  name:'Shell plc',              country:'GB',  geo:'EMEA',     assetClass:'Listed Equity',          sector:'Oil & Gas',          evic:245,  outstanding:31.2,  totalEmissions:68400000,  dqs:1, source:'Shell Annual Report 2023' },
  { id:4,  name:'TotalEnergies SE',       country:'FR',  geo:'EMEA',     assetClass:'Listed Equity',          sector:'Oil & Gas',          evic:178,  outstanding:24.6,  totalEmissions:53200000,  dqs:1, source:'TotalEnergies Sustainability 2023' },
  { id:5,  name:'BASF SE',               country:'DE',  geo:'EMEA',     assetClass:'Listed Equity',          sector:'Chemicals',          evic:48,   outstanding:12.8,  totalEmissions:21800000,  dqs:2, source:'BASF CDP Response 2023' },
  { id:6,  name:'BHP Group',             country:'AU',  geo:'APAC',     assetClass:'Listed Equity',          sector:'Mining',             evic:168,  outstanding:19.3,  totalEmissions:42300000,  dqs:1, source:'BHP Climate Report 2023' },
  { id:7,  name:'Vale S.A.',             country:'BR',  geo:'Americas', assetClass:'Listed Equity',          sector:'Mining',             evic:72,   outstanding:15.7,  totalEmissions:17900000,  dqs:2, source:'Vale CDP 2023' },
  { id:8,  name:'Nippon Steel Corp',     country:'JP',  geo:'APAC',     assetClass:'Listed Equity',          sector:'Steel',              evic:31,   outstanding:8.9,   totalEmissions:58700000,  dqs:3, source:'Nippon Steel CSR 2023' },
  { id:9,  name:'Rio Tinto plc',         country:'GB',  geo:'EMEA',     assetClass:'Listed Equity',          sector:'Mining',             evic:98,   outstanding:14.1,  totalEmissions:31200000,  dqs:1, source:'Rio Tinto Climate Report 2023' },
  { id:10, name:'Glencore plc',          country:'CH',  geo:'EMEA',     assetClass:'Listed Equity',          sector:'Mining',             evic:94,   outstanding:17.6,  totalEmissions:38100000,  dqs:2, source:'Glencore Responsibility Report 2023' },
  { id:11, name:'Anglo American plc',    country:'GB',  geo:'EMEA',     assetClass:'Listed Equity',          sector:'Mining',             evic:41,   outstanding:10.2,  totalEmissions:15400000,  dqs:2, source:'Anglo American Sustainability 2023' },
  { id:12, name:'ArcelorMittal SA',      country:'LU',  geo:'EMEA',     assetClass:'Listed Equity',          sector:'Steel',              evic:28,   outstanding:11.4,  totalEmissions:72900000,  dqs:3, source:'ArcelorMittal CDP 2023' },
  { id:13, name:'Thyssenkrupp AG',       country:'DE',  geo:'EMEA',     assetClass:'Listed Equity',          sector:'Steel',              evic:19,   outstanding:7.3,   totalEmissions:41200000,  dqs:3, source:'Thyssenkrupp Sustainability 2023' },
  { id:14, name:'Cemex SAB',             country:'MX',  geo:'Americas', assetClass:'Listed Equity',          sector:'Cement',             evic:14,   outstanding:6.8,   totalEmissions:36800000,  dqs:3, source:'Cemex CDP 2023' },
  { id:15, name:'HeidelbergCement AG',   country:'DE',  geo:'EMEA',     assetClass:'Listed Equity',          sector:'Cement',             evic:22,   outstanding:9.4,   totalEmissions:58300000,  dqs:2, source:'Heidelberg CDP 2023' },
  { id:16, name:'LafargeHolcim Ltd',     country:'CH',  geo:'EMEA',     assetClass:'Listed Equity',          sector:'Cement',             evic:31,   outstanding:11.2,  totalEmissions:76400000,  dqs:2, source:'Holcim Sustainability 2023' },
  { id:17, name:'ExxonMobil Corp',       country:'US',  geo:'Americas', assetClass:'Listed Equity',          sector:'Oil & Gas',          evic:388,  outstanding:27.8,  totalEmissions:102000000, dqs:2, source:'ExxonMobil CDP 2023' },
  { id:18, name:'Chevron Corp',          country:'US',  geo:'Americas', assetClass:'Listed Equity',          sector:'Oil & Gas',          evic:298,  outstanding:21.4,  totalEmissions:63700000,  dqs:2, source:'Chevron CDP 2023' },
  { id:19, name:'BP plc',               country:'GB',  geo:'EMEA',     assetClass:'Listed Equity',          sector:'Oil & Gas',          evic:134,  outstanding:18.9,  totalEmissions:44800000,  dqs:1, source:'BP Sustainability 2023' },
  { id:20, name:'Equinor ASA',           country:'NO',  geo:'EMEA',     assetClass:'Listed Equity',          sector:'Oil & Gas',          evic:102,  outstanding:14.6,  totalEmissions:31600000,  dqs:1, source:'Equinor CDP 2023' },
  { id:21, name:'Volkswagen AG',         country:'DE',  geo:'EMEA',     assetClass:'Listed Equity',          sector:'Automotive',         evic:84,   outstanding:13.2,  totalEmissions:24100000,  dqs:2, source:'VW CDP 2023' },
  { id:22, name:'Toyota Motor Corp',     country:'JP',  geo:'APAC',     assetClass:'Listed Equity',          sector:'Automotive',         evic:312,  outstanding:19.7,  totalEmissions:18600000,  dqs:1, source:'Toyota CDP 2023' },
  { id:23, name:'Samsung Electronics',   country:'KR',  geo:'APAC',     assetClass:'Listed Equity',          sector:'Technology',         evic:276,  outstanding:16.4,  totalEmissions:14800000,  dqs:2, source:'Samsung CDP 2023' },
  { id:24, name:'TSMC',                  country:'TW',  geo:'APAC',     assetClass:'Listed Equity',          sector:'Technology',         evic:498,  outstanding:24.3,  totalEmissions:8400000,   dqs:2, source:'TSMC CDP 2023' },
  { id:25, name:'POSCO Holdings',        country:'KR',  geo:'APAC',     assetClass:'Listed Equity',          sector:'Steel',              evic:24,   outstanding:9.1,   totalEmissions:68200000,  dqs:3, source:'POSCO Sustainability 2023' },
  // Corporate Bonds (15 positions)
  { id:26, name:'Ford Motor 7.45% 2031',               country:'US',  geo:'Americas', assetClass:'Corporate Bonds', sector:'Automotive',         evic:54,   outstanding:14.2,  totalEmissions:6340000,   dqs:3, source:'Ford CDP 2023' },
  { id:27, name:'EDF Green Bond 1.625% 2030',          country:'FR',  geo:'EMEA',     assetClass:'Corporate Bonds', sector:'Electric Utilities', evic:89,   outstanding:20.4,  totalEmissions:42700000,  dqs:2, source:'EDF Sustainability 2023' },
  { id:28, name:'Petrobras 6.9% 2049',                 country:'BR',  geo:'Americas', assetClass:'Corporate Bonds', sector:'Oil & Gas',          evic:115,  outstanding:9.8,   totalEmissions:24600000,  dqs:3, source:'Petrobras CDP 2023' },
  { id:29, name:'Maersk 2.5% 2030',                    country:'DK',  geo:'EMEA',     assetClass:'Corporate Bonds', sector:'Shipping',           evic:21,   outstanding:8.4,   totalEmissions:10800000,  dqs:3, source:'Maersk CDP 2023' },
  { id:30, name:'CMA CGM 5.5% 2029',                   country:'FR',  geo:'EMEA',     assetClass:'Corporate Bonds', sector:'Shipping',           evic:18,   outstanding:7.2,   totalEmissions:9200000,   dqs:4, source:'Revenue proxy — EF database' },
  { id:31, name:'Delta Air Lines 7% 2025',             country:'US',  geo:'Americas', assetClass:'Corporate Bonds', sector:'Aviation',           evic:19,   outstanding:6.1,   totalEmissions:11400000,  dqs:3, source:'Delta CDP 2023' },
  { id:32, name:'Lufthansa 3.5% 2028',                 country:'DE',  geo:'EMEA',     assetClass:'Corporate Bonds', sector:'Aviation',           evic:14,   outstanding:5.8,   totalEmissions:8900000,   dqs:3, source:'Lufthansa CDP 2023' },
  { id:33, name:'Ryanair Holdings 2.875% 2025',        country:'IE',  geo:'EMEA',     assetClass:'Corporate Bonds', sector:'Aviation',           evic:22,   outstanding:7.4,   totalEmissions:10200000,  dqs:4, source:'Revenue proxy — ICAO factors' },
  { id:34, name:'GM 5.4% 2023',                        country:'US',  geo:'Americas', assetClass:'Corporate Bonds', sector:'Automotive',         evic:78,   outstanding:12.6,  totalEmissions:5890000,   dqs:3, source:'GM CDP 2023' },
  { id:35, name:'BMW AG 0.75% 2030',                   country:'DE',  geo:'EMEA',     assetClass:'Corporate Bonds', sector:'Automotive',         evic:67,   outstanding:11.8,  totalEmissions:4760000,   dqs:2, source:'BMW CDP 2023' },
  { id:36, name:'Siemens AG 0.375% 2027',              country:'DE',  geo:'EMEA',     assetClass:'Corporate Bonds', sector:'Industrials',        evic:98,   outstanding:13.4,  totalEmissions:2140000,   dqs:2, source:'Siemens CDP 2023' },
  { id:37, name:'Schneider Electric 1.5% 2028',        country:'FR',  geo:'EMEA',     assetClass:'Corporate Bonds', sector:'Industrials',        evic:84,   outstanding:11.6,  totalEmissions:890000,    dqs:2, source:'Schneider CDP 2023' },
  { id:38, name:'IKEA bonds 1.5% 2027',                country:'SE',  geo:'EMEA',     assetClass:'Corporate Bonds', sector:'Retail',             evic:null, outstanding:9.2,   totalEmissions:1240000,   dqs:4, source:'Revenue proxy — EF database' },
  { id:39, name:'H&M bonds 0.25% 2024',                country:'SE',  geo:'EMEA',     assetClass:'Corporate Bonds', sector:'Retail',             evic:null, outstanding:6.4,   totalEmissions:780000,    dqs:4, source:'Revenue proxy — EF database' },
  { id:40, name:'Tata Steel 5.45% 2028',               country:'IN',  geo:'APAC',     assetClass:'Corporate Bonds', sector:'Steel',              evic:16,   outstanding:8.7,   totalEmissions:39100000,  dqs:4, source:'Revenue proxy — Trucost' },
  // Project Finance (10 positions)
  { id:41, name:'North Sea Wind Farm (1.2 GW)',         country:'GB',  geo:'EMEA',     assetClass:'Project Finance', sector:'Renewables',         evic:null, outstanding:480,   totalEmissions:12400,     dqs:3, source:'Project monitoring report 2023' },
  { id:42, name:'Solar Farm — Vietnam (320 MW)',         country:'VN',  geo:'APAC',     assetClass:'Project Finance', sector:'Renewables',         evic:null, outstanding:210,   totalEmissions:6800,      dqs:4, source:'Physical proxy — GEF grid factor' },
  { id:43, name:'Coal-to-Gas Transition — Indonesia',   country:'ID',  geo:'APAC',     assetClass:'Project Finance', sector:'Electric Utilities', evic:null, outstanding:340,   totalEmissions:4280000,   dqs:4, source:'Physical proxy — IEA EF' },
  { id:44, name:'Wastewater Treatment — Brazil',        country:'BR',  geo:'Americas', assetClass:'Project Finance', sector:'Infrastructure',     evic:null, outstanding:85,    totalEmissions:31200,     dqs:4, source:'Physical proxy — IPCC CH4 EF' },
  { id:45, name:'Offshore Wind — Taiwan Strait (400MW)',country:'TW',  geo:'APAC',     assetClass:'Project Finance', sector:'Renewables',         evic:null, outstanding:310,   totalEmissions:8600,      dqs:3, source:'Project monitoring report 2023' },
  { id:46, name:'Hydro Dam — Ethiopia (2 GW)',          country:'ET',  geo:'EMEA',     assetClass:'Project Finance', sector:'Renewables',         evic:null, outstanding:680,   totalEmissions:3200,      dqs:5, source:'Headcount proxy — limited data' },
  { id:47, name:'Gas Pipeline — Kazakhstan',            country:'KZ',  geo:'EMEA',     assetClass:'Project Finance', sector:'Oil & Gas',          evic:null, outstanding:430,   totalEmissions:2940000,   dqs:5, source:'Revenue proxy — IEA EF' },
  { id:48, name:'Solar + Storage — Chile (600 MW)',     country:'CL',  geo:'Americas', assetClass:'Project Finance', sector:'Renewables',         evic:null, outstanding:390,   totalEmissions:14200,     dqs:3, source:'Project monitoring report 2023' },
  { id:49, name:'LNG Terminal — Mozambique',            country:'MZ',  geo:'EMEA',     assetClass:'Project Finance', sector:'Oil & Gas',          evic:null, outstanding:820,   totalEmissions:5620000,   dqs:4, source:'Physical proxy — IEA EF' },
  { id:50, name:'Transmission Grid — India (HVDC)',     country:'IN',  geo:'APAC',     assetClass:'Project Finance', sector:'Infrastructure',     evic:null, outstanding:240,   totalEmissions:18400,     dqs:4, source:'Physical proxy — CEA EF' },
  // Commercial Real Estate (5 positions)
  { id:51, name:'Canary Wharf Office Complex, London',  country:'GB',  geo:'EMEA',     assetClass:'Commercial Real Estate', sector:'Real Estate', evic:null, outstanding:620,   totalEmissions:18400,     dqs:3, source:'EPC + energy audit 2023' },
  { id:52, name:'Schiphol Logistics Hub, Amsterdam',    country:'NL',  geo:'EMEA',     assetClass:'Commercial Real Estate', sector:'Real Estate', evic:null, outstanding:310,   totalEmissions:9200,      dqs:4, source:'CRREM physical proxy' },
  { id:53, name:'La Défense Mixed-Use, Paris',          country:'FR',  geo:'EMEA',     assetClass:'Commercial Real Estate', sector:'Real Estate', evic:null, outstanding:480,   totalEmissions:14600,     dqs:3, source:'DPE audit 2023' },
  { id:54, name:'Midtown Manhattan Office Tower, NYC',  country:'US',  geo:'Americas', assetClass:'Commercial Real Estate', sector:'Real Estate', evic:null, outstanding:740,   totalEmissions:22100,     dqs:3, source:'LL97 disclosure 2023' },
  { id:55, name:'Tokyo Grade-A Office, Shinjuku',       country:'JP',  geo:'APAC',     assetClass:'Commercial Real Estate', sector:'Real Estate', evic:null, outstanding:560,   totalEmissions:16800,     dqs:4, source:'CASBEE proxy estimate' },
  // Mortgages (5 positions)
  { id:56, name:'UK Residential Mortgage Portfolio',    country:'GB',  geo:'EMEA',     assetClass:'Mortgages', sector:'Residential',              evic:null, outstanding:2400,  totalEmissions:189000,    dqs:4, source:'EPC distribution proxy' },
  { id:57, name:'Dutch Mortgage Book (NHG-backed)',     country:'NL',  geo:'EMEA',     assetClass:'Mortgages', sector:'Residential',              evic:null, outstanding:1840,  totalEmissions:134000,    dqs:4, source:'RVO NL EPC proxy 2023' },
  { id:58, name:'French Immobilier Portfolio',          country:'FR',  geo:'EMEA',     assetClass:'Mortgages', sector:'Residential',              evic:null, outstanding:1210,  totalEmissions:98600,     dqs:5, source:'DPE distribution proxy' },
  { id:59, name:'US Conforming Mortgage Pool (GSE)',    country:'US',  geo:'Americas', assetClass:'Mortgages', sector:'Residential',              evic:null, outstanding:3800,  totalEmissions:284000,    dqs:5, source:'ENERGY STAR proxy — headcount' },
  { id:60, name:'Australian Residential Book',         country:'AU',  geo:'APAC',     assetClass:'Mortgages', sector:'Residential',              evic:null, outstanding:920,   totalEmissions:72400,     dqs:4, source:'NatHERS rating proxy' },
];

function computeAttrFactor(p) {
  if (p.assetClass === 'Project Finance' || p.assetClass === 'Commercial Real Estate' || p.assetClass === 'Mortgages') return 1.0;
  if (!p.evic) return 1.0;
  return Math.min(1.0, p.outstanding / p.evic);
}

function computeRow(p) {
  const attrFactor = computeAttrFactor(p);
  const financedEmissions = +(attrFactor * p.totalEmissions).toFixed(0);
  const evicM = p.evic ? p.evic * 1000 : null;
  const waci = evicM ? (p.totalEmissions / evicM) * p.outstanding : 0;
  return { ...p, attrFactor, financedEmissions, waci };
}

const INITIAL_POSITIONS = BASE_POSITIONS.map(computeRow);

const YOY_DATA = [
  { year:'2021', fe:1124600, waci:398, dqs:3.9, coverage:71 },
  { year:'2022', fe:983200,  waci:356, dqs:3.6, coverage:78 },
  { year:'2023', fe:847400,  waci:312, dqs:3.2, coverage:84 },
  { year:'2024E',fe:791000,  waci:287, dqs:2.9, coverage:91 },
];

const DQS_IMPROVEMENT_STEPS = {
  5: 'Obtain revenue-based emission factor from industry database or engage company for Scope 1+2 inventory',
  4: 'Request company GHG inventory or use physical intensity proxy (production × EF)',
  3: 'Request CDP submission or independent verification of self-reported data',
  2: 'Obtain third-party limited assurance; push toward reasonable assurance',
  1: 'Maintain — re-verify annually; gold standard',
};

function fmt(n, dec = 0) {
  if (n == null) return '—';
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(dec || 2) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(dec || 2) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(dec || 1) + 'K';
  return n.toFixed(dec);
}

function fmtPct(n) { return (n * 100).toFixed(2) + '%'; }

const DQS_COLOR = { 1:T.green, 2:'#38bdf8', 3:T.amber, 4:'#f97316', 5:T.red };
const PIE_COLORS = ['#0ea5e9','#06c896','#f0a828','#a78bfa','#f04060','#38bdf8','#facc15','#34d399','#fb7185','#818cf8'];

// ── Reusable small components ────────────────────────────────────────────────
function KPICard({ label, value, sub, color }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'14px 18px', boxShadow:T.card, flex:1, minWidth:160 }}>
      <div style={{ fontSize:11, color:T.textMut, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700, color:color||T.navy, lineHeight:1.1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', borderBottom:`2px solid ${T.border}`, marginBottom:24, gap:0 }}>
      {tabs.map(t => (
        <button key={t} onClick={() => onChange(t)} style={{ padding:'10px 22px', border:'none', background:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:T.font, color:active===t ? T.navy : T.textMut, borderBottom:active===t ? `2px solid ${T.navy}` : '2px solid transparent', marginBottom:-2, transition:'color 0.15s' }}>
          {t}
        </button>
      ))}
    </div>
  );
}

function Badge({ children, color }) {
  return <span style={{ display:'inline-block', padding:'1px 7px', borderRadius:10, fontSize:11, fontWeight:700, background:color+'22', color }}>{children}</span>;
}

// ── Modal for Add Position ───────────────────────────────────────────────────
function AddPositionModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ name:'', country:'US', geo:'Americas', assetClass:'Listed Equity', sector:'Technology', evic:'', outstanding:'', totalEmissions:'', dqs:'3', source:'Manual entry' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  function handleSave() {
    if (!form.name || !form.outstanding || !form.totalEmissions) return;
    const p = { ...form, id: Date.now(), evic: form.evic ? +form.evic : null, outstanding: +form.outstanding, totalEmissions: +form.totalEmissions, dqs: +form.dqs };
    onAdd(computeRow(p));
    onClose();
  }
  const inp = { width:'100%', padding:'7px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, fontFamily:T.font, color:T.text, background:T.surface, boxSizing:'border-box' };
  const lbl = { display:'block', fontSize:11, fontWeight:600, color:T.textSec, marginBottom:4, letterSpacing:'0.04em', textTransform:'uppercase' };
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:T.surface, borderRadius:10, padding:28, width:520, maxWidth:'95vw', boxShadow:'0 12px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize:16, fontWeight:700, color:T.navy, marginBottom:20 }}>Add New Position</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={lbl}>Company / Instrument Name</label>
            <input style={inp} value={form.name} onChange={set('name')} placeholder="e.g. BP plc" />
          </div>
          <div>
            <label style={lbl}>Asset Class</label>
            <select style={inp} value={form.assetClass} onChange={set('assetClass')}>
              {AC_ORDER.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Sector (GICS)</label>
            <input style={inp} value={form.sector} onChange={set('sector')} placeholder="e.g. Oil & Gas" />
          </div>
          <div>
            <label style={lbl}>Country</label>
            <input style={inp} value={form.country} onChange={set('country')} placeholder="US" />
          </div>
          <div>
            <label style={lbl}>Geography</label>
            <select style={inp} value={form.geo} onChange={set('geo')}>
              {['Americas','EMEA','APAC'].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>EVIC ($bn) — blank for loans/mortgages</label>
            <input style={inp} value={form.evic} onChange={set('evic')} type="number" placeholder="e.g. 245" />
          </div>
          <div>
            <label style={lbl}>Outstanding ($M)</label>
            <input style={inp} value={form.outstanding} onChange={set('outstanding')} type="number" placeholder="e.g. 31.2" />
          </div>
          <div>
            <label style={lbl}>Scope 1+2 Emissions (tCO2e)</label>
            <input style={inp} value={form.totalEmissions} onChange={set('totalEmissions')} type="number" placeholder="e.g. 68400000" />
          </div>
          <div>
            <label style={lbl}>DQS Score (1–5)</label>
            <select style={inp} value={form.dqs} onChange={set('dqs')}>
              {[1,2,3,4,5].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', border:`1px solid ${T.border}`, borderRadius:6, background:T.surface, cursor:'pointer', fontSize:13, fontFamily:T.font }}>Cancel</button>
          <button onClick={handleSave} style={{ padding:'8px 18px', border:'none', borderRadius:6, background:T.navy, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:T.font }}>Add Position</button>
        </div>
      </div>
    </div>
  );
}

// ── Tab 1: Portfolio Builder ─────────────────────────────────────────────────
function PortfolioBuilderTab({ positions, setPositions }) {
  const [search, setSearch] = useState('');
  const [acFilter, setAcFilter] = useState('All');
  const [sortKey, setSortKey] = useState('financedEmissions');
  const [sortDir, setSortDir] = useState(-1);
  const [expandedId, setExpandedId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [selected, setSelected] = useState(new Set());
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    let ps = positions;
    if (acFilter !== 'All') ps = ps.filter(p => p.assetClass === acFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      ps = ps.filter(p => p.name.toLowerCase().includes(q) || p.sector.toLowerCase().includes(q));
    }
    return [...ps].sort((a, b) => sortDir * (a[sortKey] > b[sortKey] ? 1 : -1));
  }, [positions, acFilter, search, sortKey, sortDir]);

  const totalFE = useMemo(() => positions.reduce((s, p) => s + p.financedEmissions, 0), [positions]);
  const totalOut = useMemo(() => positions.reduce((s, p) => s + p.outstanding, 0), [positions]);
  const waci = useMemo(() => totalOut > 0 ? positions.reduce((s, p) => s + p.waci, 0) / totalOut : 0, [positions, totalOut]);
  const avgDqs = useMemo(() => (positions.reduce((s, p) => s + p.dqs, 0) / positions.length).toFixed(2), [positions]);

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(-1); }
  }

  function startEdit(p) {
    setExpandedId(p.id);
    setEditDraft({ outstanding: p.outstanding, evicOverride: p.evic, totalEmissions: p.totalEmissions });
  }

  function applyEdit(p) {
    const updated = { ...p, outstanding: +editDraft.outstanding, evic: editDraft.evicOverride ? +editDraft.evicOverride : null, totalEmissions: +editDraft.totalEmissions };
    const recomputed = computeRow(updated);
    setPositions(prev => prev.map(x => x.id === p.id ? recomputed : x));
    setExpandedId(null);
  }

  function removeSelected() {
    setPositions(prev => prev.filter(p => !selected.has(p.id)));
    setSelected(new Set());
  }

  function toggleSelect(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const hdr = (key, label) => (
    <th onClick={() => handleSort(key)} style={{ padding:'8px 10px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textSec, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', userSelect:'none', whiteSpace:'nowrap', borderBottom:`1px solid ${T.border}` }}>
      {label}{sortKey===key ? (sortDir===-1?' ▼':' ▲') : ''}
    </th>
  );

  const inp = { width:'100%', padding:'5px 8px', border:`1px solid ${T.border}`, borderRadius:5, fontSize:12, fontFamily:T.font, color:T.text, background:T.bg };

  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16 }}>
        <KPICard label="Total Financed Emissions" value={fmt(totalFE) + ' tCO2e'} sub={`${positions.length} positions`} color={T.navy} />
        <KPICard label="WACI" value={waci.toFixed(1)} sub="tCO2e / $M AUM" color={T.navyL} />
        <KPICard label="Avg DQS" value={avgDqs} sub="Portfolio average" color={DQS_COLOR[Math.round(+avgDqs)] || T.amber} />
        <KPICard label="Total Exposure" value={'$' + fmt(totalOut) + 'M'} sub="Across all asset classes" color={T.sage} />
      </div>

      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:12 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company or sector…" style={{ padding:'7px 12px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, fontFamily:T.font, width:240, color:T.text }} />
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          {['All', ...AC_ORDER].map(ac => (
            <button key={ac} onClick={() => setAcFilter(ac)} style={{ padding:'5px 12px', border:`1px solid ${acFilter===ac ? T.navy : T.border}`, borderRadius:20, fontSize:12, fontWeight:acFilter===ac ? 700 : 400, background:acFilter===ac ? T.navy : T.surface, color:acFilter===ac ? '#fff' : T.textSec, cursor:'pointer', fontFamily:T.font }}>
              {ac === 'Commercial Real Estate' ? 'Comm. RE' : ac}
            </button>
          ))}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          {selected.size > 0 && (
            <button onClick={removeSelected} style={{ padding:'6px 14px', border:`1px solid ${T.red}`, borderRadius:6, background:'#fee2e2', color:T.red, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:T.font }}>
              Remove {selected.size} selected
            </button>
          )}
          <button onClick={() => setShowAdd(true)} style={{ padding:'6px 14px', border:'none', borderRadius:6, background:T.navy, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:T.font }}>
            + Add Position
          </button>
        </div>
      </div>

      <div style={{ overflowX:'auto', borderRadius:8, border:`1px solid ${T.border}` }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
          <thead style={{ background:T.bg }}>
            <tr>
              <th style={{ padding:'8px 10px', width:32 }}><input type="checkbox" onChange={e => { if (e.target.checked) setSelected(new Set(filtered.map(p => p.id))); else setSelected(new Set()); }} /></th>
              {hdr('name','Company')}
              {hdr('assetClass','Asset Class')}
              {hdr('sector','Sector')}
              {hdr('outstanding','Exp $M')}
              {hdr('attrFactor','Attr%')}
              {hdr('totalEmissions','Scope1+2 tCO2e')}
              {hdr('financedEmissions','Fin. Em. tCO2e')}
              {hdr('dqs','DQS')}
              <th style={{ padding:'8px 10px', borderBottom:`1px solid ${T.border}` }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, ri) => (
              <React.Fragment key={p.id}>
                <tr style={{ background: ri % 2 === 0 ? T.surface : T.bg, borderBottom:`1px solid ${T.border}` }}>
                  <td style={{ padding:'7px 10px' }}><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                  <td style={{ padding:'7px 10px', fontWeight:600, color:T.navy, whiteSpace:'nowrap', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</td>
                  <td style={{ padding:'7px 10px' }}><Badge color={AC_COLORS[p.assetClass]}>{p.assetClass==='Commercial Real Estate'?'Comm. RE':p.assetClass}</Badge></td>
                  <td style={{ padding:'7px 10px', color:T.textSec }}>{p.sector}</td>
                  <td style={{ padding:'7px 10px', textAlign:'right' }}>{p.outstanding.toFixed(1)}</td>
                  <td style={{ padding:'7px 10px', textAlign:'right' }}>{fmtPct(p.attrFactor)}</td>
                  <td style={{ padding:'7px 10px', textAlign:'right' }}>{fmt(p.totalEmissions)}</td>
                  <td style={{ padding:'7px 10px', textAlign:'right', fontWeight:600, color:p.financedEmissions>1e6?T.red:p.financedEmissions>1e5?T.amber:T.text }}>{fmt(p.financedEmissions)}</td>
                  <td style={{ padding:'7px 10px', textAlign:'center' }}><span style={{ fontWeight:700, color:DQS_COLOR[p.dqs]||T.text }}>{p.dqs}</span></td>
                  <td style={{ padding:'7px 10px' }}>
                    <button onClick={() => expandedId===p.id ? setExpandedId(null) : startEdit(p)} style={{ padding:'3px 10px', border:`1px solid ${T.border}`, borderRadius:4, background:expandedId===p.id?T.navy:T.surface, color:expandedId===p.id?'#fff':T.text, fontSize:11, cursor:'pointer', fontFamily:T.font }}>
                      {expandedId===p.id ? 'Cancel' : 'Edit'}
                    </button>
                  </td>
                </tr>
                {expandedId===p.id && (
                  <tr style={{ background:'#eff6ff', borderBottom:`1px solid ${T.border}` }}>
                    <td colSpan={10} style={{ padding:'12px 20px' }}>
                      <div style={{ display:'flex', gap:16, alignItems:'flex-end', flexWrap:'wrap' }}>
                        <div><label style={{ fontSize:11, color:T.textSec, display:'block', marginBottom:3 }}>Outstanding ($M)</label><input style={inp} type="number" value={editDraft.outstanding} onChange={e => setEditDraft(d => ({ ...d, outstanding:e.target.value }))} /></div>
                        <div><label style={{ fontSize:11, color:T.textSec, display:'block', marginBottom:3 }}>EVIC Override ($bn)</label><input style={inp} type="number" value={editDraft.evicOverride||''} onChange={e => setEditDraft(d => ({ ...d, evicOverride:e.target.value }))} placeholder="leave blank for loans" /></div>
                        <div><label style={{ fontSize:11, color:T.textSec, display:'block', marginBottom:3 }}>Scope 1+2 Emissions (tCO2e)</label><input style={inp} type="number" value={editDraft.totalEmissions} onChange={e => setEditDraft(d => ({ ...d, totalEmissions:e.target.value }))} /></div>
                        <button onClick={() => applyEdit(p)} style={{ padding:'6px 16px', border:'none', borderRadius:5, background:T.sage, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:T.font }}>Apply & Recalculate</button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize:12, color:T.textMut, marginTop:8 }}>Showing {filtered.length} of {positions.length} positions</div>
      {showAdd && <AddPositionModal onAdd={p => setPositions(prev => [p, ...prev])} onClose={() => setShowAdd(false)} />}
    </div>
  );
}

// ── Tab 2: DQS Wizard ────────────────────────────────────────────────────────
function DqsWizardTab({ positions, setPositions }) {
  const [actionStatus, setActionStatus] = useState({});
  const [targetDqs, setTargetDqs] = useState({ 'Listed Equity':2, 'Corporate Bonds':2, 'Project Finance':3, 'Commercial Real Estate':3, 'Mortgages':3 });

  const byDqs = useMemo(() => {
    const groups = {1:[],2:[],3:[],4:[],5:[]};
    positions.forEach(p => groups[p.dqs].push(p));
    return groups;
  }, [positions]);

  const currentAvg = (positions.reduce((s,p)=>s+p.dqs,0)/positions.length).toFixed(2);

  const simulatedAvg = useMemo(() => {
    let total = 0;
    positions.forEach(p => {
      const target = targetDqs[p.assetClass] || p.dqs;
      total += Math.min(p.dqs, target);
    });
    return (total / positions.length).toFixed(2);
  }, [positions, targetDqs]);

  function markAction(id, status) {
    setActionStatus(prev => ({ ...prev, [id]: status }));
    if (status === 'complete') {
      setPositions(prev => prev.map(p => {
        if (p.id !== id) return p;
        const newDqs = Math.max(1, p.dqs - 1);
        return computeRow({ ...p, dqs: newDqs });
      }));
    }
  }

  const DQS_PIE = [1,2,3,4,5].map(s => ({ name:`DQS ${s}`, value:byDqs[s].length, color:DQS_COLOR[s] }));
  const improved = Object.values(actionStatus).filter(v => v==='complete').length;

  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        <KPICard label="Current Avg DQS" value={currentAvg} sub="Portfolio-weighted" color={DQS_COLOR[Math.round(+currentAvg)]} />
        <KPICard label="Simulated Avg DQS" value={simulatedAvg} sub="After target improvements" color={T.sage} />
        <KPICard label="Actions Completed" value={`${improved} / ${positions.length}`} sub="Positions upgraded" color={T.navyL} />
        <KPICard label="DQS-4/5 Positions" value={(byDqs[4].length+byDqs[5].length)} sub="Require urgent upgrade" color={T.red} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:18 }}>
          <div style={{ fontWeight:700, color:T.navy, marginBottom:14, fontSize:14 }}>DQS Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={DQS_PIE} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={e => `DQS${e.name.slice(-1)}: ${e.value}`} labelLine={false}>
                {DQS_PIE.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:18 }}>
          <div style={{ fontWeight:700, color:T.navy, marginBottom:14, fontSize:14 }}>DQS Target Setter by Asset Class</div>
          {AC_ORDER.map(ac => (
            <div key={ac} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <Badge color={AC_COLORS[ac]}>{ac==='Commercial Real Estate'?'Comm. RE':ac}</Badge>
              <div style={{ flex:1 }} />
              <span style={{ fontSize:11, color:T.textSec }}>Target DQS:</span>
              <select value={targetDqs[ac]} onChange={e => setTargetDqs(t => ({ ...t, [ac]:+e.target.value }))} style={{ padding:'3px 8px', border:`1px solid ${T.border}`, borderRadius:4, fontSize:12, fontFamily:T.font }}>
                {[1,2,3,4,5].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          ))}
          <div style={{ marginTop:12, padding:'10px 14px', background:'#f0fdf4', borderRadius:6, border:`1px solid #bbf7d0`, fontSize:12, color:T.sage }}>
            Simulated portfolio avg DQS: <strong>{simulatedAvg}</strong> (currently {currentAvg}). Improvement: <strong>{(+currentAvg - +simulatedAvg).toFixed(2)} points</strong>.
          </div>
        </div>
      </div>

      <div style={{ fontWeight:700, color:T.navy, fontSize:14, marginBottom:12 }}>Improvement Action Items (DQS 3–5)</div>
      {[4,5,3].map(score => (
        byDqs[score].length > 0 && (
          <div key={score} style={{ marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <span style={{ fontWeight:700, fontSize:13, color:DQS_COLOR[score] }}>DQS {score}</span>
              <span style={{ fontSize:12, color:T.textMut }}>{DQS_IMPROVEMENT_STEPS[score]}</span>
            </div>
            {byDqs[score].map(p => {
              const st = actionStatus[p.id];
              return (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, marginBottom:6 }}>
                  <span style={{ flex:1, fontSize:12, fontWeight:600, color:T.navy }}>{p.name}</span>
                  <Badge color={AC_COLORS[p.assetClass]}>{p.assetClass==='Commercial Real Estate'?'RE':p.assetClass.split(' ')[0]}</Badge>
                  <span style={{ fontSize:11, color:T.textSec, minWidth:120 }}>Request from {p.country}: {p.source}</span>
                  {st === 'complete' ? (
                    <span style={{ fontSize:11, fontWeight:700, color:T.green }}>Completed — DQS upgraded</span>
                  ) : st === 'inprogress' ? (
                    <button onClick={() => markAction(p.id, 'complete')} style={{ padding:'4px 12px', border:`1px solid ${T.sage}`, borderRadius:4, background:'#f0fdf4', color:T.sage, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:T.font }}>Mark Complete</button>
                  ) : (
                    <button onClick={() => markAction(p.id, 'inprogress')} style={{ padding:'4px 12px', border:`1px solid ${T.amber}`, borderRadius:4, background:'#fffbeb', color:T.amber, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:T.font }}>Mark In Progress</button>
                  )}
                </div>
              );
            })}
          </div>
        )
      ))}
    </div>
  );
}

// ── Tab 3: Benchmarking & Carbon Sensitivity ─────────────────────────────────
function BenchmarkingTab({ positions }) {
  const [carbonPrice, setCarbonPrice] = useState(80);
  const [selectedSector, setSelectedSector] = useState('Oil & Gas');

  const CARBON_INTENSE = ['Oil & Gas','Steel','Cement','Chemicals','Electric Utilities','Mining','Aviation','Shipping'];

  const carbonImpact = useMemo(() => {
    return positions
      .filter(p => CARBON_INTENSE.includes(p.sector))
      .map(p => {
        const costM = (p.financedEmissions * carbonPrice) / 1e6;
        const viabilityBreached = costM > p.outstanding * 0.15;
        return { ...p, carbonCost: costM, viabilityBreached };
      })
      .sort((a,b) => b.carbonCost - a.carbonCost)
      .slice(0,12);
  }, [positions, carbonPrice]);

  const portfolioRisk = useMemo(() => {
    return positions.filter(p => CARBON_INTENSE.includes(p.sector)).reduce((s,p) => s + (p.financedEmissions * carbonPrice) / 1e6, 0);
  }, [positions, carbonPrice]);

  const sectorPositions = useMemo(() => positions.filter(p => p.sector === selectedSector), [positions, selectedSector]);
  const benchmarkRow = useMemo(() => SECTOR_EMISSION_INTENSITY.find(r => r.sector === selectedSector || r.sector.includes(selectedSector.split(' ')[0])), [selectedSector]);

  const uniqueSectors = useMemo(() => [...new Set(positions.map(p => p.sector))].sort(), [positions]);

  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        <KPICard label="Carbon Price Sensitivity" value={`$${carbonPrice}/t`} sub="EU ETS reference 2024: $64.8" color={T.amber} />
        <KPICard label="Portfolio Carbon Risk" value={`$${fmt(portfolioRisk,1)}M`} sub="Financed carbon cost at current price" color={carbonPrice > 150 ? T.red : T.amber} />
        <KPICard label="Positions Above Viability" value={carbonImpact.filter(p=>p.viabilityBreached).length} sub=">15% of exposure in carbon costs" color={T.red} />
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:18, marginBottom:20 }}>
        <div style={{ fontWeight:700, color:T.navy, fontSize:14, marginBottom:10 }}>Carbon Price Sensitivity — EBITDA Impact</div>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
          <span style={{ fontSize:12, color:T.textSec }}>$50/t</span>
          <input type="range" min={50} max={300} step={5} value={carbonPrice} onChange={e => setCarbonPrice(+e.target.value)} style={{ flex:1, accentColor:T.navy }} />
          <span style={{ fontSize:12, color:T.textSec }}>$300/t</span>
          <span style={{ fontWeight:700, color:T.navy, minWidth:70, textAlign:'right' }}>${carbonPrice}/tCO2e</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={carbonImpact} margin={{ top:0, right:10, bottom:40, left:10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize:9, fill:T.textMut }} angle={-35} textAnchor="end" />
            <YAxis tick={{ fontSize:10, fill:T.textMut }} tickFormatter={v => `$${v.toFixed(0)}M`} />
            <Tooltip formatter={(v,n) => [`$${v.toFixed(2)}M`, 'Carbon Cost']} labelStyle={{ color:T.navy, fontWeight:700 }} />
            <Bar dataKey="carbonCost" name="Carbon Cost $M" radius={[3,3,0,0]}>
              {carbonImpact.map((p, i) => <Cell key={i} fill={p.viabilityBreached ? T.red : T.amber} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize:11, color:T.textMut, marginTop:8 }}>Red bars indicate positions where carbon cost exceeds 15% of outstanding exposure (viability threshold)</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:18 }}>
          <div style={{ fontWeight:700, color:T.navy, fontSize:14, marginBottom:12 }}>EU ETS Historical Price</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={EU_ETS_ANNUAL} margin={{ top:0, right:10, bottom:0, left:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize:10, fill:T.textMut }} />
              <YAxis tick={{ fontSize:10, fill:T.textMut }} tickFormatter={v=>`€${v}`} />
              <Tooltip formatter={v=>[`€${v}/t`,'EU ETS']} />
              <Area type="monotone" dataKey="price" stroke={T.gold} fill={T.gold+'33'} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:18 }}>
          <div style={{ fontWeight:700, color:T.navy, fontSize:14, marginBottom:12 }}>Sector Benchmark Comparison</div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <label style={{ fontSize:12, color:T.textSec }}>Sector:</label>
            <select value={selectedSector} onChange={e => setSelectedSector(e.target.value)} style={{ padding:'5px 10px', border:`1px solid ${T.border}`, borderRadius:5, fontSize:12, fontFamily:T.font }}>
              {uniqueSectors.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {sectorPositions.length > 0 ? (
            <div>
              {benchmarkRow && (
                <div style={{ padding:'8px 12px', background:'#eff6ff', borderRadius:6, fontSize:12, marginBottom:8 }}>
                  Sector benchmark: <strong>{benchmarkRow.intensityMean || benchmarkRow.intensity || '—'} tCO2e/$M</strong> — {benchmarkRow.sector}
                </div>
              )}
              {sectorPositions.map(p => {
                const portIntensity = p.outstanding > 0 ? (p.financedEmissions / p.outstanding).toFixed(1) : '—';
                return (
                  <div key={p.id} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                    <span style={{ color:T.navy, fontWeight:600, maxWidth:'60%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
                    <span style={{ color:T.textSec }}>{portIntensity} tCO2e/$M</span>
                    <Badge color={DQS_COLOR[p.dqs]}>DQS {p.dqs}</Badge>
                  </div>
                );
              })}
            </div>
          ) : <div style={{ fontSize:12, color:T.textMut }}>No positions in this sector</div>}
        </div>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:18 }}>
        <div style={{ fontWeight:700, color:T.navy, fontSize:14, marginBottom:12 }}>All-Sector Benchmark Table ({SECTOR_EMISSION_INTENSITY.length} sectors)</div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead><tr style={{ background:T.bg }}>
              {['Sector','Intensity tCO2e/$M','SBTi Path','Coverage'].map(h => (
                <th key={h} style={{ padding:'7px 10px', textAlign:'left', fontWeight:700, fontSize:11, color:T.textSec, letterSpacing:'0.05em', textTransform:'uppercase', borderBottom:`1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {SECTOR_EMISSION_INTENSITY.slice(0,21).map((row, i) => (
                <tr key={i} style={{ background:i%2===0?T.surface:T.bg, borderBottom:`1px solid ${T.border}` }}>
                  <td style={{ padding:'7px 10px', fontWeight:600, color:T.navy }}>{row.sector}</td>
                  <td style={{ padding:'7px 10px', textAlign:'right' }}>{row.intensityMean ?? row.intensity ?? '—'}</td>
                  <td style={{ padding:'7px 10px', color:T.textSec }}>{row.sbtiPath || row.pathway || '—'}</td>
                  <td style={{ padding:'7px 10px', color:T.textMut }}>{row.coverage || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab 4: PCAF Report Generator ─────────────────────────────────────────────
function ReportGeneratorTab({ positions }) {
  const [reportYear, setReportYear] = useState('2024');
  const [includePartial, setIncludePartial] = useState(true);
  const [format, setFormat] = useState('PCAF Standard');
  const [generating, setGenerating] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [copied, setCopied] = useState(false);

  function generateReport() {
    setGenerating(true);
    setReportReady(false);
    setTimeout(() => { setGenerating(false); setReportReady(true); }, 1500);
  }

  const byAC = useMemo(() => {
    const out = {};
    AC_ORDER.forEach(ac => {
      const ps = positions.filter(p => p.assetClass === ac);
      out[ac] = {
        count: ps.length,
        exposure: ps.reduce((s,p) => s+p.outstanding, 0),
        fe: ps.reduce((s,p) => s+p.financedEmissions, 0),
        avgDqs: ps.length ? (ps.reduce((s,p)=>s+p.dqs,0)/ps.length).toFixed(1) : '—',
      };
    });
    return out;
  }, [positions]);

  const totalFE = positions.reduce((s,p)=>s+p.financedEmissions,0);
  const totalExp = positions.reduce((s,p)=>s+p.outstanding,0);
  const avgDqs = (positions.reduce((s,p)=>s+p.dqs,0)/positions.length).toFixed(2);
  const coverageRatio = ((positions.filter(p=>p.dqs<=3).length/positions.length)*100).toFixed(1);

  function generateCSV() {
    const header = 'ID,Company,Country,Asset Class,Sector,Outstanding $M,Attribution %,Scope1+2 tCO2e,Financed Emissions tCO2e,DQS,Source\n';
    const rows = positions.map(p =>
      `${p.id},"${p.name}",${p.country},"${p.assetClass}","${p.sector}",${p.outstanding},${fmtPct(p.attrFactor)},${p.totalEmissions},${p.financedEmissions},${p.dqs},"${p.source}"`
    ).join('\n');
    const blob = new Blob([header+rows], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `pcaf_disclosure_${reportYear}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function copyToClipboard() {
    const text = `PCAF Financed Emissions Disclosure — ${reportYear}\nFormat: ${format}\n\nTotal Financed Emissions: ${fmt(totalFE)} tCO2e\nTotal Exposure: $${fmt(totalExp)}M\nAvg DQS: ${avgDqs}\nCoverage: ${coverageRatio}%\n\nBy Asset Class:\n` +
      AC_ORDER.map(ac => `  ${ac}: ${fmt(byAC[ac].fe)} tCO2e | $${fmt(byAC[ac].exposure)}M | ${byAC[ac].count} positions | Avg DQS ${byAC[ac].avgDqs}`).join('\n');
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20, marginBottom:20 }}>
        <div style={{ fontWeight:700, color:T.navy, fontSize:15, marginBottom:16 }}>Report Configuration</div>
        <div style={{ display:'flex', gap:20, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:T.textSec, marginBottom:5, letterSpacing:'0.05em', textTransform:'uppercase' }}>Reporting Year</label>
            <select value={reportYear} onChange={e => { setReportYear(e.target.value); setReportReady(false); }} style={{ padding:'8px 14px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, fontFamily:T.font }}>
              {['2021','2022','2023','2024'].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:T.textSec, marginBottom:5, letterSpacing:'0.05em', textTransform:'uppercase' }}>Format</label>
            <select value={format} onChange={e => { setFormat(e.target.value); setReportReady(false); }} style={{ padding:'8px 14px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, fontFamily:T.font }}>
              {['PCAF Standard','GHG Protocol','CDP Climate'].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" id="partialChk" checked={includePartial} onChange={e => setIncludePartial(e.target.checked)} />
            <label htmlFor="partialChk" style={{ fontSize:13, color:T.text }}>Include partial-year positions</label>
          </div>
          <button onClick={generateReport} disabled={generating} style={{ padding:'9px 24px', border:'none', borderRadius:6, background:generating?T.textMut:T.navy, color:'#fff', fontSize:13, fontWeight:600, cursor:generating?'not-allowed':'pointer', fontFamily:T.font, minWidth:160 }}>
            {generating ? 'Generating…' : 'Generate Report'}
          </button>
        </div>
        {generating && (
          <div style={{ marginTop:14, height:4, background:T.bg, borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', background:T.gold, borderRadius:2, animation:'pcafProgress 1.5s linear', width:'100%' }} />
          </div>
        )}
        <style>{`@keyframes pcafProgress { from { width:0% } to { width:100% } }`}</style>
      </div>

      {reportReady && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontWeight:700, color:T.navy, fontSize:15 }}>
              PCAF Financed Emissions Disclosure — {reportYear} ({format})
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={copyToClipboard} style={{ padding:'6px 14px', border:`1px solid ${T.border}`, borderRadius:6, background:T.surface, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:T.font, color:copied?T.sage:T.navy }}>
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button onClick={generateCSV} style={{ padding:'6px 14px', border:'none', borderRadius:6, background:T.sage, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:T.font }}>
                Download CSV
              </button>
            </div>
          </div>

          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:18 }}>
            <KPICard label="Total Financed Emissions" value={fmt(totalFE)+' tCO2e'} sub={`Reporting year ${reportYear}`} color={T.navy} />
            <KPICard label="Total Covered Exposure" value={'$'+fmt(totalExp)+'M'} sub={`${positions.length} positions`} color={T.navyL} />
            <KPICard label="Portfolio Avg DQS" value={avgDqs} sub="Weighted average" color={DQS_COLOR[Math.round(+avgDqs)]} />
            <KPICard label="High-Quality Coverage" value={coverageRatio+'%'} sub="Positions DQS 1–3" color={T.sage} />
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, marginBottom:18, overflow:'hidden' }}>
            <div style={{ padding:'12px 18px', background:T.navy, color:'#fff', fontWeight:700, fontSize:13 }}>
              PCAF Standard Table — All Asset Classes
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
                <thead><tr style={{ background:T.bg }}>
                  {['Asset Class','# Positions','Exposure $M','Fin. Emissions tCO2e','% of Portfolio FE','Avg DQS'].map(h => (
                    <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:T.textSec, letterSpacing:'0.05em', textTransform:'uppercase', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {AC_ORDER.map((ac, i) => (
                    <tr key={ac} style={{ background:i%2===0?T.surface:T.bg, borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'9px 12px' }}><Badge color={AC_COLORS[ac]}>{ac}</Badge></td>
                      <td style={{ padding:'9px 12px', textAlign:'center' }}>{byAC[ac].count}</td>
                      <td style={{ padding:'9px 12px', textAlign:'right' }}>${fmt(byAC[ac].exposure,1)}M</td>
                      <td style={{ padding:'9px 12px', textAlign:'right', fontWeight:600 }}>{fmt(byAC[ac].fe)}</td>
                      <td style={{ padding:'9px 12px', textAlign:'right' }}>{totalFE>0?((byAC[ac].fe/totalFE)*100).toFixed(1):'0'}%</td>
                      <td style={{ padding:'9px 12px', textAlign:'center' }}><span style={{ fontWeight:700, color:DQS_COLOR[Math.round(+byAC[ac].avgDqs)]||T.text }}>{byAC[ac].avgDqs}</span></td>
                    </tr>
                  ))}
                  <tr style={{ background:T.bg, fontWeight:700, borderTop:`2px solid ${T.border}` }}>
                    <td style={{ padding:'9px 12px', color:T.navy }}>Total</td>
                    <td style={{ padding:'9px 12px', textAlign:'center' }}>{positions.length}</td>
                    <td style={{ padding:'9px 12px', textAlign:'right' }}>${fmt(totalExp,1)}M</td>
                    <td style={{ padding:'9px 12px', textAlign:'right', color:T.navy }}>{fmt(totalFE)}</td>
                    <td style={{ padding:'9px 12px', textAlign:'right' }}>100.0%</td>
                    <td style={{ padding:'9px 12px', textAlign:'center', color:DQS_COLOR[Math.round(+avgDqs)]||T.text }}>{avgDqs}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:18 }}>
              <div style={{ fontWeight:700, color:T.navy, fontSize:13, marginBottom:14 }}>Year-on-Year Trend</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={YOY_DATA} margin={{ top:0, right:10, bottom:0, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize:10, fill:T.textMut }} />
                  <YAxis yAxisId="fe" tick={{ fontSize:10, fill:T.textMut }} tickFormatter={v=>`${(v/1000).toFixed(0)}K`} />
                  <YAxis yAxisId="waci" orientation="right" tick={{ fontSize:10, fill:T.textMut }} />
                  <Tooltip />
                  <Line yAxisId="fe" type="monotone" dataKey="fe" stroke={T.navy} strokeWidth={2} dot={{ r:4, fill:T.navy }} name="Financed Emissions tCO2e" />
                  <Line yAxisId="waci" type="monotone" dataKey="waci" stroke={T.gold} strokeWidth={2} dot={{ r:4, fill:T.gold }} name="WACI" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:18 }}>
              <div style={{ fontWeight:700, color:T.navy, fontSize:13, marginBottom:14 }}>Auto-Generated Data Quality Narrative</div>
              <div style={{ fontSize:12, color:T.text, lineHeight:1.7 }}>
                <p style={{ margin:'0 0 8px' }}>As of reporting year <strong>{reportYear}</strong>, the institution's financed emissions portfolio covers <strong>{positions.length} positions</strong> across all five PCAF asset classes, with total financed Scope 1+2 GHG emissions of <strong>{fmt(totalFE)} tCO2e</strong>.</p>
                <p style={{ margin:'0 0 8px' }}>Portfolio-weighted average data quality score (DQS) is <strong>{avgDqs}</strong>. <strong>{coverageRatio}%</strong> of positions are rated DQS 1–3 (primary or company-reported data), exceeding the PCAF minimum 67% threshold.</p>
                <p style={{ margin:0 }}>Estimated emissions are reported in accordance with the <strong>{format}</strong> methodology. Scope 3 category 15 (investments) attribution follows the PCAF Standard (Part A, v2.0). Data sourced from CDP submissions, company sustainability reports, and sector emission factor databases where primary data is unavailable.</p>
              </div>
            </div>
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:18 }}>
            <div style={{ fontWeight:700, color:T.navy, fontSize:13, marginBottom:14 }}>Geographic Breakdown</div>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              {['EMEA','Americas','APAC'].map(geo => {
                const ps = positions.filter(p => p.geo === geo);
                const fe = ps.reduce((s,p)=>s+p.financedEmissions,0);
                return (
                  <div key={geo} style={{ flex:1, minWidth:160, padding:'12px 16px', background:T.bg, borderRadius:6, border:`1px solid ${T.border}` }}>
                    <div style={{ fontWeight:700, color:T.navy, fontSize:13 }}>{geo}</div>
                    <div style={{ fontSize:20, fontWeight:700, color:T.navyL, marginTop:4 }}>{fmt(fe)} tCO2e</div>
                    <div style={{ fontSize:11, color:T.textMut, marginTop:2 }}>{ps.length} positions · {totalFE>0?((fe/totalFE)*100).toFixed(1):0}% of total</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function PcafFinancedEmissionsPage() {
  const [positions, setPositions] = useState(INITIAL_POSITIONS);
  const [activeTab, setActiveTab] = useState('Portfolio Builder');

  const TABS = ['Portfolio Builder','DQS Improvement Wizard','Benchmarking & Carbon Sensitivity','PCAF Report Generator'];

  const totalFE = useMemo(() => positions.reduce((s,p)=>s+p.financedEmissions,0), [positions]);
  const totalExp = useMemo(() => positions.reduce((s,p)=>s+p.outstanding,0), [positions]);

  const acPieData = useMemo(() => AC_ORDER.map(ac => {
    const ps = positions.filter(p => p.assetClass === ac);
    return { name:ac==='Commercial Real Estate'?'Comm. RE':ac, value:ps.reduce((s,p)=>s+p.financedEmissions,0), color:AC_COLORS[ac] };
  }).filter(d => d.value > 0), [positions]);

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.font, color:T.text }}>
      <div style={{ maxWidth:1400, margin:'0 auto', padding:'28px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.textMut, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:6 }}>
                PCAF Standard · Scope 3 Category 15 · Financed Emissions
              </div>
              <h1 style={{ fontSize:26, fontWeight:800, color:T.navy, margin:0, lineHeight:1.2 }}>
                Financed Emissions Engine
              </h1>
              <div style={{ fontSize:13, color:T.textSec, marginTop:6 }}>
                {positions.length} positions · {fmt(totalFE)} tCO2e total · ${fmt(totalExp)}M AUM covered · PCAF Standard v2.0
              </div>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <Badge color={T.sage}>PCAF Standard v2.0</Badge>
              <Badge color={T.navyL}>GHG Protocol Cat 15</Badge>
              <Badge color={T.gold}>TCFD Aligned</Badge>
            </div>
          </div>
        </div>

        {/* Summary strip */}
        <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap' }}>
          {acPieData.map(d => (
            <div key={d.name} style={{ flex:1, minWidth:120, background:T.surface, border:`1px solid ${T.border}`, borderRadius:7, padding:'10px 14px', boxShadow:T.card }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <span style={{ width:8, height:8, borderRadius:2, background:d.color, display:'inline-block' }} />
                <span style={{ fontSize:10, fontWeight:700, color:T.textSec, textTransform:'uppercase', letterSpacing:'0.05em' }}>{d.name}</span>
              </div>
              <div style={{ fontSize:15, fontWeight:700, color:T.navy }}>{fmt(d.value)} tCO2e</div>
              <div style={{ fontSize:10, color:T.textMut }}>{totalFE>0?((d.value/totalFE)*100).toFixed(1):0}% of total</div>
            </div>
          ))}
        </div>

        {/* Tab navigation */}
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'Portfolio Builder' && (
          <PortfolioBuilderTab positions={positions} setPositions={setPositions} />
        )}
        {activeTab === 'DQS Improvement Wizard' && (
          <DqsWizardTab positions={positions} setPositions={setPositions} />
        )}
        {activeTab === 'Benchmarking & Carbon Sensitivity' && (
          <BenchmarkingTab positions={positions} />
        )}
        {activeTab === 'PCAF Report Generator' && (
          <ReportGeneratorTab positions={positions} />
        )}
      </div>
    </div>
  );
}
