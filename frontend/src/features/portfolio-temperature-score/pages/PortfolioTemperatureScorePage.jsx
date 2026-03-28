import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, CartesianGrid,
} from 'recharts';

// ── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7',
  border:'#e5e0d8', borderL:'#d5cfc5',
  navy:'#1b3a5c', navyL:'#2c5a8c',
  gold:'#c5a96a', goldL:'#d4be8a',
  sage:'#5a8a6a', sageL:'#7ba67d',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  card:'0 1px 4px rgba(27,58,92,0.06)',
  cardH:'0 4px 16px rgba(27,58,92,0.1)',
  font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

// ── Deterministic helpers ─────────────────────────────────────────────────────
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ── Static data ───────────────────────────────────────────────────────────────
const METHODOLOGIES = [
  { id:'pacta', label:'PACTA', temp:2.7 },
  { id:'sbti',  label:'SBTi Temperature Score', temp:2.4 },
  { id:'tpi',   label:'TPI', temp:2.9 },
  { id:'wa',    label:'Weighted Average', temp:2.6 },
];

const YEAR_FILTERS = ['Q4 2023','Q4 2024','Forward to 2030'];
const YEAR_DELTAS  = { 'Q4 2023':0, 'Q4 2024':-0.1, 'Forward to 2030':+0.3 };

const SECTORS = ['Energy','Utilities','Materials','Industrials','Consumer Staples',
  'Consumer Discretionary','Health Care','Financials','Technology','Communication',
  'Real Estate','Automotive','Cement','Steel','Oil & Gas'];

const COUNTRIES = ['USA','GBR','DEU','JPN','CHN','AUS','CAN','FRA','IND','BRA',
  'KOR','NLD','NOR','SWE','CHE'];

const SBTI_STATUSES = ['Approved','Committed','No target'];
const ENG_STATUSES  = ['Active','Pending','Not started'];

// 60 holdings
const ALL_HOLDINGS = Array.from({length:60}, (_,i) => {
  const companies = [
    'Shell plc','BP plc','TotalEnergies','Chevron Corp','ExxonMobil',
    'NextEra Energy','Orsted A/S','Iberdrola','Enel SpA','RWE AG',
    'Toyota Motor','Volkswagen AG','Ford Motor','General Motors','Stellantis',
    'ArcelorMittal','ThyssenKrupp','Nucor Corp','POSCO Holdings','Tata Steel',
    'HeidelbergMaterials','LafargeHolcim','CRH plc','Cemex','Votorantim',
    'Alibaba Group','Tencent Holdings','Samsung Electronics','TSMC','ASML',
    'Nestlé SA','Unilever plc','Procter & Gamble','Danone SA','Pepsico',
    'BNP Paribas','HSBC Holdings','JPMorgan Chase','Deutsche Bank','Citigroup',
    'Apple Inc','Microsoft Corp','Alphabet Inc','Meta Platforms','Amazon',
    'Siemens AG','Schneider Electric','ABB Ltd','Honeywell','Emerson Electric',
    'Glencore plc','Rio Tinto','BHP Group','Vale SA','Anglo American',
    'Vattenfall','Engie SA','Duke Energy','Southern Company','American Electric',
  ];
  const s = i + 7;
  const temp = 1.2 + sr(s * 3) * 3.6;
  const weight = 0.4 + sr(s * 7) * 3.2;
  const sbtiIdx = Math.floor(sr(s * 11) * 3);
  const engIdx  = Math.floor(sr(s * 13) * 3);
  const sectorIdx = Math.floor(sr(s * 5) * SECTORS.length);
  const countryIdx = Math.floor(sr(s * 9) * COUNTRIES.length);
  const nearYear = 2025 + Math.floor(sr(s * 17) * 6);
  const nzYear   = 2040 + Math.floor(sr(s * 19) * 11);
  const lastEng  = `2025-${String(Math.floor(sr(s*23)*12+1)).padStart(2,'0')}-${String(Math.floor(sr(s*29)*28+1)).padStart(2,'0')}`;
  const emissions = [
    +(180 + sr(s*31)*320).toFixed(1),
    +(160 + sr(s*37)*300).toFixed(1),
    +(140 + sr(s*41)*280).toFixed(1),
  ];
  const sectorPath = [
    +(150 + sr(s*43)*200).toFixed(1),
    +(130 + sr(s*47)*180).toFixed(1),
    +(100 + sr(s*53)*150).toFixed(1),
  ];
  const notes = [
    `Initial outreach sent ${lastEng}. Awaiting board-level response.`,
    `Follow-up call scheduled. CFO confirmed net-zero commitment in principle.`,
    `SBTi submission draft reviewed. Target year confirmed as ${nearYear}.`,
  ];
  return {
    id: i,
    company: companies[i] || `Company ${i+1}`,
    sector: SECTORS[sectorIdx],
    country: COUNTRIES[countryIdx],
    weight: +weight.toFixed(2),
    temp: +temp.toFixed(2),
    sbti: SBTI_STATUSES[sbtiIdx],
    nearYear,
    nzYear,
    engagement: ENG_STATUSES[engIdx],
    lastEng,
    emissions,
    sectorPath,
    notes,
    sbtiDelta: +(sr(s*59) * 0.4).toFixed(2),
  };
});

// PACTA sectors
const PACTA_SECTORS = [
  { id:'power',    label:'Power',     tempScore:3.8, radarScore:28, unit:'GW',
    port:[2.84,3.1,3.4,3.5,3.6,3.7,3.7,3.8,3.8,3.9,4.0],
    path15:[2.84,2.5,2.1,1.7,1.3,0.9,0.6,0.4,0.2,0.1,0.0],
    path2: [2.84,2.6,2.3,2.0,1.7,1.4,1.1,0.9,0.7,0.5,0.3],
    pathNdc:[2.84,2.7,2.6,2.5,2.4,2.3,2.2,2.1,2.0,1.9,1.8],
    gap:'Divest 65% coal by 2030', companies:[
      'NextEra Energy','RWE AG','Enel SpA','Iberdrola','Orsted A/S',
      'Duke Energy','Southern Company','Vattenfall','Engie SA','American Electric',
    ]},
  { id:'auto',     label:'Automotive',tempScore:2.4, radarScore:55, unit:'% EV',
    port:[38,41,44,47,50,52,55,57,59,61,63],
    path15:[38,45,53,61,69,77,85,88,91,94,97],
    path2: [38,43,48,53,58,63,68,72,76,80,84],
    pathNdc:[38,40,43,46,50,53,57,60,63,66,70],
    gap:'Increase EV exposure to 85% by 2030', companies:[
      'Toyota Motor','Volkswagen AG','Ford Motor','General Motors','Stellantis',
    ]},
  { id:'oilgas',   label:'Oil & Gas', tempScore:3.2, radarScore:35, unit:'mboe/d',
    port:[840,855,862,870,875,880,878,876,874,872,870],
    path15:[840,810,775,735,690,645,595,540,480,415,345],
    path2: [840,820,798,774,748,720,690,658,624,588,550],
    pathNdc:[840,835,830,825,820,815,810,806,802,798,795],
    gap:'Reduce production by 18% vs. current trajectory', companies:[
      'Shell plc','BP plc','TotalEnergies','Chevron Corp','ExxonMobil',
      'Glencore plc','Rio Tinto','BHP Group','Vale SA','Anglo American',
    ]},
  { id:'steel',    label:'Steel',     tempScore:2.8, radarScore:48, unit:'% EAF',
    port:[42,43,44,46,47,49,50,52,53,55,56],
    path15:[42,46,51,55,60,64,69,73,78,82,87],
    path2: [42,45,48,51,54,57,60,63,66,69,72],
    pathNdc:[42,43,45,46,47,49,50,51,53,54,55],
    gap:'Increase EAF share to 58% by 2030', companies:[
      'ArcelorMittal','ThyssenKrupp','Nucor Corp','POSCO Holdings','Tata Steel',
    ]},
  { id:'cement',   label:'Cement',    tempScore:3.5, radarScore:32, unit:'kgCO₂/t',
    port:[820,825,830,835,838,840,842,843,844,845,846],
    path15:[820,780,735,685,630,570,505,435,360,280,195],
    path2: [820,795,768,739,708,675,640,602,562,520,475],
    pathNdc:[820,812,803,794,785,776,767,758,749,740,731],
    gap:'Reduce clinker intensity by 28% vs. 2024 level', companies:[
      'HeidelbergMaterials','LafargeHolcim','CRH plc','Cemex','Votorantim',
    ]},
];

const YEARS = [2020,2021,2022,2023,2024,2025,2026,2027,2028,2029,2030];

// Engagement queue (20 companies)
const INITIAL_ENGAGEMENTS = Array.from({length:20}, (_,i) => {
  const holding = ALL_HOLDINGS[i * 3];
  const statuses = ['Not Started','Letter Sent','Response Received','Meeting Scheduled','Commitment Made','Closed'];
  const types = ['Climate','Social','Governance','Climate','Climate','Governance','Social','Climate','Climate','Governance'];
  const owners = ['Sarah Chen','James Liu','Maria Rossi','Tariq Hassan','Emma Patel'];
  const si = i + 41;
  return {
    id: i,
    priority: Math.floor(sr(si*7)*5)+1,
    company: holding.company,
    issue: ['Net-zero commitment','SBTi target adoption','Coal phase-out','EV transition','Methane reduction',
      'Carbon disclosure','TCFD alignment','Scope 3 reporting','Green capex plan','Deforestation policy'][i%10],
    tempGap: +(holding.temp - 1.5).toFixed(2),
    weight: holding.weight,
    status: statuses[Math.floor(sr(si*11)*6)],
    owner: owners[Math.floor(sr(si*13)*5)],
    nextAction: `2026-${String(Math.floor(sr(si*17)*11+1)).padStart(2,'0')}-${String(Math.floor(sr(si*19)*27+1)).padStart(2,'0')}`,
    lastContact: holding.lastEng,
    theme: types[i%10],
    log: [
      { date:'2025-09-01', type:'Letter', outcome:'Initial outreach, no response yet', next:'Follow up in 30 days' },
      { date:'2025-10-05', type:'Call',   outcome:'CFO available, positive response', next:'Schedule board meeting' },
      { date:'2025-11-14', type:'Meeting',outcome:'Board committed to SBTi review',   next:'Submit commitment letter' },
    ].slice(0, Math.floor(sr(si*23)*3)+1),
  };
});

// ── Shared UI atoms ───────────────────────────────────────────────────────────
const Btn = ({ active, onClick, children, style={} }) => (
  <button onClick={onClick} style={{
    padding:'6px 14px', borderRadius:6, border:`1px solid ${active ? T.navy : T.border}`,
    background: active ? T.navy : T.surface, color: active ? '#fff' : T.textSec,
    fontSize:13, fontWeight: active ? 600 : 400, cursor:'pointer',
    transition:'all .15s', ...style,
  }}>{children}</button>
);

const Card = ({ children, style={} }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
    padding:20, boxShadow:T.card, ...style }}>{children}</div>
);

const Badge = ({ val, color }) => (
  <span style={{ background: color+'22', color, fontSize:11, fontWeight:600,
    padding:'2px 8px', borderRadius:20 }}>{val}</span>
);

const tempColor = t => t <= 1.5 ? T.green : t <= 2.0 ? '#4ade80' : t <= 2.5 ? T.amber : t <= 3.0 ? '#f97316' : T.red;

// ── TAB 1: Dashboard ──────────────────────────────────────────────────────────
function DashboardTab({ methodology, setMethodology, attribution, setAttribution,
  scope3, setScope3, yearFilter, setYearFilter, portfolioTemp }) {

  const markerPct = Math.min(100, Math.max(0, ((portfolioTemp - 1) / 3) * 100));
  const distData = useMemo(() => {
    const base = [
      { range:'≤1.5°C', count:8,  color:T.green },
      { range:'1.5–2°C',count:14, color:'#4ade80' },
      { range:'2–2.5°C',count:12, color:T.amber },
      { range:'2.5–3°C',count:9,  color:'#f97316' },
      { range:'>3°C',   count:7,  color:T.red },
    ];
    const delta = { pacta:0, sbti:-1, tpi:2, wa:1 };
    const d = delta[methodology] || 0;
    return base.map((b,i) => ({ ...b, count: Math.max(1, b.count + (i===d ? 2 : i===(4-d)%5 ? -1 : 0)) }));
  }, [methodology]);

  const methDesc = {
    pacta:'PACTA assesses forward-looking production plans against NGFS climate scenarios.',
    sbti:'SBTi Temperature Score maps corporate targets to global temperature outcomes.',
    tpi:'TPI evaluates management quality and carbon performance against sectoral pathways.',
    wa:'Weighted Average Temperature Score using EVIC-based portfolio aggregation.',
  };

  return (
    <div style={{ display:'grid', gap:20 }}>
      {/* Controls row */}
      <Card>
        <div style={{ display:'flex', flexWrap:'wrap', gap:20, alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:12, color:T.textMut, marginBottom:6 }}>METHODOLOGY</div>
            <div style={{ display:'flex', gap:6 }}>
              {METHODOLOGIES.map(m => (
                <Btn key={m.id} active={methodology===m.id} onClick={() => setMethodology(m.id)}>{m.label}</Btn>
              ))}
            </div>
            <div style={{ fontSize:11, color:T.textSec, marginTop:6, fontStyle:'italic' }}>{methDesc[methodology]}</div>
          </div>
          <div>
            <div style={{ fontSize:12, color:T.textMut, marginBottom:6 }}>ATTRIBUTION</div>
            <div style={{ display:'flex', gap:6 }}>
              {['EVIC-weighted','Revenue-weighted','Equal-weighted'].map(a => (
                <Btn key={a} active={attribution===a} onClick={() => setAttribution(a)}>{a}</Btn>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize:12, color:T.textMut, marginBottom:6 }}>PERIOD</div>
            <div style={{ display:'flex', gap:6 }}>
              {YEAR_FILTERS.map(y => (
                <Btn key={y} active={yearFilter===y} onClick={() => setYearFilter(y)}>{y}</Btn>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Headline + spectrum */}
      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:20 }}>
        <Card style={{ textAlign:'center' }}>
          <div style={{ fontSize:13, color:T.textMut, marginBottom:4 }}>Portfolio Temperature</div>
          <div style={{ fontSize:56, fontWeight:800, color:tempColor(portfolioTemp), lineHeight:1 }}>
            {portfolioTemp.toFixed(1)}°C
          </div>
          <div style={{ fontSize:13, color:T.textSec, marginTop:4 }}>{METHODOLOGIES.find(m=>m.id===methodology)?.label}</div>
          <div style={{ marginTop:16, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
            <span style={{ fontSize:12, color:T.textMut }}>Scope 3</span>
            <button onClick={() => setScope3(v => !v)} style={{
              width:44, height:24, borderRadius:12, border:'none', cursor:'pointer',
              background: scope3 ? T.navy : T.border, position:'relative', transition:'background .2s',
            }}>
              <span style={{
                position:'absolute', top:3, left: scope3 ? 22 : 3, width:18, height:18,
                borderRadius:'50%', background:'#fff', transition:'left .2s',
              }}/>
            </button>
            <span style={{ fontSize:12, color: scope3 ? T.navy : T.textMut, fontWeight:600 }}>
              {scope3 ? 'Included' : 'Excl.'}
            </span>
          </div>
          <div style={{ marginTop:8, fontSize:12, color:T.textSec }}>
            {scope3 ? 'Scope 1+2+3 emissions' : 'Scope 1+2 only (−0.3°C)'}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:16 }}>Temperature Spectrum</div>
          <div style={{ position:'relative', marginBottom:24 }}>
            <div style={{
              height:24, borderRadius:12,
              background:'linear-gradient(to right, #16a34a, #4ade80, #d97706, #f97316, #dc2626)',
            }}/>
            <div style={{
              position:'absolute', top:-6, left:`${markerPct}%`,
              transform:'translateX(-50%)',
            }}>
              <div style={{ width:2, height:36, background:T.navy, margin:'0 auto' }}/>
              <div style={{ background:T.navy, color:'#fff', fontSize:11, fontWeight:700,
                padding:'2px 6px', borderRadius:4, whiteSpace:'nowrap', marginTop:2 }}>
                {portfolioTemp.toFixed(1)}°C
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:32, fontSize:11, color:T.textMut }}>
              <span>1°C</span><span>1.5°C</span><span>2°C</span><span>2.5°C</span><span>3°C</span><span>4°C</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:16, fontSize:12 }}>
            {METHODOLOGIES.map(m => (
              <div key={m.id} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:10, height:10, borderRadius:'50%', background:tempColor(m.temp), display:'block' }}/>
                <span style={{ color:T.textSec }}>{m.label}: <strong style={{ color:tempColor(m.temp) }}>{m.temp}°C</strong></span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Distribution */}
      <Card>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>
          Holdings Temperature Distribution (60 holdings)
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={distData}>
            <XAxis dataKey="range" tick={{ fontSize:12, fill:T.textSec }} />
            <YAxis tick={{ fontSize:12, fill:T.textSec }} />
            <Tooltip formatter={v => [`${v} holdings`,'Count']} />
            <Bar dataKey="count" radius={[4,4,0,0]}>
              {distData.map((d,i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ── TAB 2: Holdings Screener ──────────────────────────────────────────────────
function HoldingsTab() {
  const [search, setSearch] = useState('');
  const [tempMin, setTempMin] = useState(1.0);
  const [tempMax, setTempMax] = useState(5.0);
  const [sectorFilter, setSectorFilter] = useState([]);
  const [countryFilter, setCountryFilter] = useState([]);
  const [sbtiFilter, setSbtiFilter] = useState([]);
  const [engFilter, setEngFilter] = useState([]);
  const [weightMin, setWeightMin] = useState(0);
  const [sortBy, setSortBy] = useState('temp');
  const [sortDir, setSortDir] = useState('desc');
  const [expanded, setExpanded] = useState(null);
  const [selected, setSelected] = useState([]);
  const [filterOpen, setFilterOpen] = useState(true);
  const [whatIfId, setWhatIfId] = useState(null);
  const [bulkAction, setBulkAction] = useState('');

  const filtered = useMemo(() => {
    let h = ALL_HOLDINGS.filter(r =>
      (search==='' || r.company.toLowerCase().includes(search.toLowerCase())) &&
      r.temp >= tempMin && r.temp <= tempMax &&
      r.weight >= weightMin &&
      (sectorFilter.length===0 || sectorFilter.includes(r.sector)) &&
      (countryFilter.length===0 || countryFilter.includes(r.country)) &&
      (sbtiFilter.length===0 || sbtiFilter.includes(r.sbti)) &&
      (engFilter.length===0 || engFilter.includes(r.engagement))
    );
    h.sort((a,b) => {
      const v = sortDir==='asc' ? 1 : -1;
      if(sortBy==='temp') return (a.temp-b.temp)*v;
      if(sortBy==='weight') return (a.weight-b.weight)*v;
      if(sortBy==='company') return a.company.localeCompare(b.company)*v;
      if(sortBy==='sbti') return a.sbti.localeCompare(b.sbti)*v;
      if(sortBy==='lastEng') return a.lastEng.localeCompare(b.lastEng)*v;
      return 0;
    });
    return h;
  }, [search,tempMin,tempMax,weightMin,sectorFilter,countryFilter,sbtiFilter,engFilter,sortBy,sortDir]);

  const totalWeight = ALL_HOLDINGS.reduce((s,h) => s+h.weight, 0);
  const whatIfDelta = whatIfId !== null ? (ALL_HOLDINGS.find(h=>h.id===whatIfId)?.sbtiDelta || 0) : 0;
  const portfolioBaseTemp = 2.7;
  const whatIfTemp = +(portfolioBaseTemp - (selected.length>0
    ? selected.reduce((s,id) => s + (ALL_HOLDINGS.find(h=>h.id===id)?.sbtiDelta||0), 0) / selected.length
    : 0)).toFixed(2);

  const toggleSort = col => {
    if(sortBy===col) setSortDir(d => d==='asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const toggleSector = s => setSectorFilter(f => f.includes(s) ? f.filter(x=>x!==s) : [...f,s]);
  const toggleSbti   = s => setSbtiFilter(f  => f.includes(s) ? f.filter(x=>x!==s) : [...f,s]);
  const toggleEng    = s => setEngFilter(f   => f.includes(s) ? f.filter(x=>x!==s) : [...f,s]);

  const SortArrow = ({ col }) => sortBy===col
    ? <span style={{ marginLeft:4 }}>{sortDir==='asc' ? '▲' : '▼'}</span> : null;

  const EngStatusColors = { Active:T.green, Pending:T.amber, 'Not started':T.textMut };
  const SbtiColors = { Approved:T.green, Committed:T.amber, 'No target':T.red };

  return (
    <div style={{ display:'flex', gap:20 }}>
      {/* Filter panel */}
      {filterOpen && (
        <div style={{ width:220, flexShrink:0 }}>
          <Card style={{ padding:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:12 }}>Filters</div>

            <div style={{ fontSize:12, color:T.textMut, marginBottom:4 }}>Temperature (°C)</div>
            <div style={{ display:'flex', gap:6, marginBottom:12 }}>
              <input type="number" value={tempMin} step={0.1} min={1} max={tempMax}
                onChange={e=>setTempMin(+e.target.value)}
                style={{ width:60, padding:'4px 6px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12 }}/>
              <span style={{ color:T.textMut, lineHeight:'28px' }}>–</span>
              <input type="number" value={tempMax} step={0.1} min={tempMin} max={5}
                onChange={e=>setTempMax(+e.target.value)}
                style={{ width:60, padding:'4px 6px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12 }}/>
            </div>

            <div style={{ fontSize:12, color:T.textMut, marginBottom:4 }}>Min Weight (%)</div>
            <input type="number" value={weightMin} step={0.1} min={0}
              onChange={e=>setWeightMin(+e.target.value)}
              style={{ width:80, padding:'4px 6px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, marginBottom:12 }}/>

            <div style={{ fontSize:12, color:T.textMut, marginBottom:6 }}>Sector</div>
            <div style={{ maxHeight:120, overflowY:'auto', marginBottom:12 }}>
              {SECTORS.map(s => (
                <label key={s} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3, cursor:'pointer' }}>
                  <input type="checkbox" checked={sectorFilter.includes(s)} onChange={()=>toggleSector(s)}/>
                  <span style={{ fontSize:11, color:T.textSec }}>{s}</span>
                </label>
              ))}
            </div>

            <div style={{ fontSize:12, color:T.textMut, marginBottom:6 }}>SBTi Status</div>
            <div style={{ marginBottom:12 }}>
              {SBTI_STATUSES.map(s => (
                <label key={s} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3, cursor:'pointer' }}>
                  <input type="checkbox" checked={sbtiFilter.includes(s)} onChange={()=>toggleSbti(s)}/>
                  <span style={{ fontSize:11, color:T.textSec }}>{s}</span>
                </label>
              ))}
            </div>

            <div style={{ fontSize:12, color:T.textMut, marginBottom:6 }}>Engagement</div>
            <div>
              {ENG_STATUSES.map(s => (
                <label key={s} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3, cursor:'pointer' }}>
                  <input type="checkbox" checked={engFilter.includes(s)} onChange={()=>toggleEng(s)}/>
                  <span style={{ fontSize:11, color:T.textSec }}>{s}</span>
                </label>
              ))}
            </div>

            <button onClick={() => { setSectorFilter([]); setSbtiFilter([]); setEngFilter([]);
              setTempMin(1); setTempMax(5); setWeightMin(0); setSearch(''); }}
              style={{ marginTop:12, fontSize:11, color:T.navyL, background:'none', border:'none',
                cursor:'pointer', textDecoration:'underline' }}>Clear all</button>
          </Card>
        </div>
      )}

      <div style={{ flex:1, minWidth:0 }}>
        {/* Toolbar */}
        <Card style={{ marginBottom:16, padding:12 }}>
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            <button onClick={()=>setFilterOpen(v=>!v)} style={{ fontSize:12, padding:'6px 12px',
              border:`1px solid ${T.border}`, borderRadius:6, background:T.surface, cursor:'pointer', color:T.textSec }}>
              {filterOpen ? '◀ Hide Filters' : '▶ Show Filters'}
            </button>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search company…"
              style={{ flex:1, minWidth:180, padding:'7px 12px', border:`1px solid ${T.border}`,
                borderRadius:6, fontSize:13, outline:'none' }}/>
            <span style={{ fontSize:12, color:T.textMut }}>{filtered.length} / 60 holdings</span>
            {selected.length>0 && (
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:12, color:T.textSec }}>{selected.length} selected</span>
                <select value={bulkAction} onChange={e=>setBulkAction(e.target.value)}
                  style={{ fontSize:12, padding:'6px 10px', border:`1px solid ${T.border}`, borderRadius:6 }}>
                  <option value=''>Bulk action…</option>
                  <option>Start Engagement</option>
                  <option>Request SBTi</option>
                  <option>Flag for Exclusion</option>
                </select>
                <Btn onClick={()=>{ setSelected([]); setBulkAction(''); }} style={{ fontSize:11, padding:'4px 10px' }}>Clear</Btn>
              </div>
            )}
            {selected.length>0 && (
              <div style={{ fontSize:12, color:T.textSec }}>
                What if selected adopt SBTi? <strong style={{ color:tempColor(whatIfTemp) }}>{whatIfTemp}°C</strong>
              </div>
            )}
          </div>
        </Card>

        {/* Table */}
        <Card style={{ padding:0, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:T.surfaceH }}>
                  <th style={{ padding:'10px 12px', textAlign:'left', width:32 }}>
                    <input type="checkbox" checked={selected.length===filtered.length && filtered.length>0}
                      onChange={e => setSelected(e.target.checked ? filtered.map(h=>h.id) : [])}/>
                  </th>
                  {[['company','Company'],['sector','Sector'],['weight','Weight'],
                    ['temp','Temp°C'],['sbti','SBTi'],['engagement','Engagement'],['lastEng','Last Eng']].map(([col,lbl]) => (
                    <th key={col} onClick={()=>toggleSort(col)} style={{ padding:'10px 12px',
                      textAlign:'left', color:T.textSec, fontWeight:600, cursor:'pointer',
                      borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>
                      {lbl}<SortArrow col={col}/>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((h, ri) => (
                  <React.Fragment key={h.id}>
                    <tr onClick={()=>setExpanded(expanded===h.id ? null : h.id)}
                      style={{ cursor:'pointer', background: expanded===h.id ? T.surfaceH :
                        ri%2===0 ? T.surface : '#faf9f7',
                        borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'8px 12px' }} onClick={e=>e.stopPropagation()}>
                        <input type="checkbox" checked={selected.includes(h.id)}
                          onChange={e => setSelected(sel => e.target.checked ? [...sel,h.id] : sel.filter(x=>x!==h.id))}/>
                      </td>
                      <td style={{ padding:'8px 12px', fontWeight:500, color:T.text }}>{h.company}</td>
                      <td style={{ padding:'8px 12px', color:T.textSec }}>{h.sector}</td>
                      <td style={{ padding:'8px 12px', color:T.textSec }}>{h.weight.toFixed(2)}%</td>
                      <td style={{ padding:'8px 12px' }}>
                        <span style={{ color:tempColor(h.temp), fontWeight:700 }}>{h.temp.toFixed(2)}°C</span>
                      </td>
                      <td style={{ padding:'8px 12px' }}>
                        <Badge val={h.sbti} color={SbtiColors[h.sbti]}/>
                      </td>
                      <td style={{ padding:'8px 12px' }}>
                        <Badge val={h.engagement} color={EngStatusColors[h.engagement]}/>
                      </td>
                      <td style={{ padding:'8px 12px', color:T.textMut }}>{h.lastEng}</td>
                    </tr>
                    {expanded===h.id && (
                      <tr style={{ background:T.surfaceH }}>
                        <td colSpan={8} style={{ padding:20, borderBottom:`1px solid ${T.border}` }}>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
                            <div>
                              <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:8 }}>Emission Intensity (tCO₂e/€M)</div>
                              <ResponsiveContainer width="100%" height={100}>
                                <LineChart data={[2022,2023,2024].map((yr,i) => ({ yr, val:h.emissions[i] }))}>
                                  <Line type="monotone" dataKey="val" stroke={T.navy} dot={false} strokeWidth={2}/>
                                  <XAxis dataKey="yr" tick={{ fontSize:10 }}/>
                                  <YAxis tick={{ fontSize:10 }}/>
                                  <Tooltip/>
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                            <div>
                              <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:8 }}>vs. Sector Pathway</div>
                              <ResponsiveContainer width="100%" height={100}>
                                <LineChart data={[2022,2023,2024].map((yr,i) => ({ yr, company:h.emissions[i], sector:h.sectorPath[i] }))}>
                                  <Line type="monotone" dataKey="company" stroke={T.red} dot={false} strokeWidth={2} name="Company"/>
                                  <Line type="monotone" dataKey="sector"  stroke={T.green} dot={false} strokeWidth={2} name="Pathway"/>
                                  <XAxis dataKey="yr" tick={{ fontSize:10 }}/>
                                  <YAxis tick={{ fontSize:10 }}/>
                                  <Tooltip/>
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                            <div>
                              <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:8 }}>Engagement Notes</div>
                              {h.notes.slice(0,3).map((n,ni) => (
                                <div key={ni} style={{ fontSize:11, color:T.textSec, marginBottom:6, paddingLeft:8,
                                  borderLeft:`2px solid ${T.gold}` }}>{n}</div>
                              ))}
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:8, marginTop:12 }}>
                            {['Start Engagement','Request SBTi Commitment','Flag for Exclusion','Add Note'].map(a => (
                              <Btn key={a} style={{ fontSize:11, padding:'4px 10px' }}>{a}</Btn>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── TAB 3: PACTA Sector Analysis ──────────────────────────────────────────────
function PactaTab() {
  const [activeSector, setActiveSector] = useState('power');
  const [scenario, setScenario] = useState('path15');

  const sector = PACTA_SECTORS.find(s => s.id === activeSector);
  const lineData = YEARS.map((yr, i) => ({
    yr, Portfolio: sector.port[i],
    '1.5°C': sector.path15[i],
    '2°C': sector.path2[i],
    'NDC Policies': sector.pathNdc[i],
  }));

  const radarData = PACTA_SECTORS.map(s => ({ sector:s.label, score:s.radarScore }));
  const ScenarioColors = { path15:T.green, path2:T.amber, pathNdc:T.red };

  return (
    <div style={{ display:'grid', gap:20 }}>
      {/* Sector tabs */}
      <Card style={{ padding:12 }}>
        <div style={{ display:'flex', gap:8 }}>
          {PACTA_SECTORS.map(s => (
            <Btn key={s.id} active={activeSector===s.id} onClick={()=>setActiveSector(s.id)}>
              {s.label}
            </Btn>
          ))}
        </div>
      </Card>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20 }}>
        <div style={{ display:'grid', gap:16 }}>
          {/* Scenario selector */}
          <Card style={{ padding:12 }}>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ fontSize:12, color:T.textMut }}>Scenario:</span>
              {[['path15','1.5°C NZ'],['path2','2°C'],['pathNdc','NDC Policies']].map(([id,lbl]) => (
                <Btn key={id} active={scenario===id} onClick={()=>setScenario(id)}
                  style={{ borderColor: scenario===id ? ScenarioColors[id] : T.border,
                    background: scenario===id ? ScenarioColors[id]+'22' : T.surface,
                    color: scenario===id ? ScenarioColors[id] : T.textSec }}>{lbl}</Btn>
              ))}
            </div>
          </Card>

          {/* Production chart */}
          <Card>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:4 }}>
              {sector.label} — Portfolio Production vs. NGFS Pathways ({sector.unit})
            </div>
            <div style={{ fontSize:11, color:T.textMut, marginBottom:12 }}>
              Temperature score: <strong style={{ color:tempColor(sector.tempScore) }}>{sector.tempScore}°C</strong>
              &nbsp;·&nbsp;Alignment gap: {sector.gap}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="yr" tick={{ fontSize:11, fill:T.textSec }}/>
                <YAxis tick={{ fontSize:11, fill:T.textSec }}/>
                <Tooltip/>
                <Line type="monotone" dataKey="Portfolio" stroke={T.navy} strokeWidth={2.5} dot={false}/>
                <Line type="monotone" dataKey="1.5°C"     stroke={T.green} strokeWidth={1.5} strokeDasharray="5 3" dot={false}/>
                <Line type="monotone" dataKey="2°C"        stroke={T.amber} strokeWidth={1.5} strokeDasharray="5 3" dot={false}/>
                <Line type="monotone" dataKey="NDC Policies" stroke={T.red} strokeWidth={1.5} strokeDasharray="5 3" dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Company cards */}
          <Card>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:12 }}>Companies in Sector</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
              {sector.companies.map((c,ci) => {
                const h = ALL_HOLDINGS.find(h => h.company===c) ||
                  { temp: 2.0 + sr((ci+sector.id.length)*7)*2.5, sbti: SBTI_STATUSES[ci%3] };
                return (
                  <div key={c} style={{ padding:10, border:`1px solid ${T.border}`, borderRadius:8,
                    background:T.surface, boxShadow:T.card }}>
                    <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:4 }}>{c}</div>
                    <div style={{ fontSize:20, fontWeight:800, color:tempColor(h.temp) }}>{h.temp.toFixed(1)}°C</div>
                    <Badge val={h.sbti} color={SbtiColors[h.sbti]}/>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Radar */}
        <div style={{ display:'grid', gap:16 }}>
          <Card>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>Cross-Sector Alignment</div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={T.border}/>
                <PolarAngleAxis dataKey="sector" tick={{ fontSize:11, fill:T.textSec }}/>
                <Radar name="Score" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.25}/>
              </RadarChart>
            </ResponsiveContainer>
            <div style={{ fontSize:11, color:T.textMut, textAlign:'center' }}>
              Higher = better alignment. Max 100.
            </div>
          </Card>
          <Card>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:10 }}>Sector Scorecard</div>
            {PACTA_SECTORS.map(s => (
              <div key={s.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'7px 0', borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:12, color:T.text }}>{s.label}</span>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <div style={{ width:60, height:6, borderRadius:3, background:T.border, overflow:'hidden' }}>
                    <div style={{ width:`${s.radarScore}%`, height:'100%',
                      background:s.radarScore>60 ? T.green : s.radarScore>40 ? T.amber : T.red }}/>
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color:tempColor(s.tempScore) }}>{s.tempScore}°C</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

const SbtiColors = { Approved:T.green, Committed:T.amber, 'No target':T.red };

// ── TAB 4: Engagement Tracker ─────────────────────────────────────────────────
function EngagementTab() {
  const [engagements, setEngagements] = useState(INITIAL_ENGAGEMENTS);
  const [showForm, setShowForm] = useState(false);
  const [expandedEng, setExpandedEng] = useState(null);
  const [calDays, setCalDays] = useState(30);
  const [sortEng, setSortEng] = useState('priority');
  const [divestSel, setDivestSel] = useState([]);
  const [form, setForm] = useState({
    company:'', type:'Letter', objective:'', theme:'Climate', targetDate:''
  });

  const STATUSES = ['Not Started','Letter Sent','Response Received','Meeting Scheduled','Commitment Made','Closed'];
  const StatusColors = {
    'Not Started':T.textMut,'Letter Sent':T.amber,'Response Received':'#0ea5e9',
    'Meeting Scheduled':T.gold,'Commitment Made':T.sage,'Closed':T.green
  };

  const sorted = useMemo(() => [...engagements].sort((a,b) => {
    if(sortEng==='priority') return a.priority - b.priority;
    if(sortEng==='tempGap')  return b.tempGap - a.tempGap;
    if(sortEng==='weight')   return b.weight - a.weight;
    return a.nextAction.localeCompare(b.nextAction);
  }), [engagements, sortEng]);

  const today = new Date('2026-03-28');
  const calItems = engagements.filter(e => {
    const d = new Date(e.nextAction);
    const diff = (d - today) / 86400000;
    return diff >= 0 && diff <= calDays;
  }).sort((a,b) => a.nextAction.localeCompare(b.nextAction));

  const divestTemp = divestSel.length === 0 ? 2.7 :
    +(2.7 - divestSel.reduce((s,id) => {
      const e = engagements.find(x=>x.id===id);
      return s + (e ? e.tempGap * e.weight / 100 * 0.12 : 0);
    }, 0)).toFixed(2);

  const advanceStatus = id => {
    setEngagements(prev => prev.map(e => {
      if(e.id!==id) return e;
      const idx = STATUSES.indexOf(e.status);
      return { ...e, status: STATUSES[Math.min(idx+1, STATUSES.length-1)] };
    }));
  };

  const submitForm = () => {
    if(!form.company) return;
    const newEng = {
      id: engagements.length,
      priority: 3,
      company: form.company,
      issue: form.objective || 'Climate alignment',
      tempGap: 1.2,
      weight: 0.8,
      status: 'Not Started',
      owner: 'Sarah Chen',
      nextAction: form.targetDate || '2026-04-30',
      lastContact: '2026-03-28',
      theme: form.theme,
      log: [],
    };
    setEngagements(prev => [newEng, ...prev]);
    setForm({ company:'', type:'Letter', objective:'', theme:'Climate', targetDate:'' });
    setShowForm(false);
  };

  return (
    <div style={{ display:'grid', gap:20 }}>
      {/* Header controls */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
        <button onClick={()=>setShowForm(v=>!v)} style={{
          padding:'8px 16px', borderRadius:8, border:'none',
          background:T.navy, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          + Add Engagement
        </button>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <span style={{ fontSize:12, color:T.textMut }}>Sort by:</span>
          {[['priority','Priority'],['tempGap','Temp Gap'],['weight','Weight'],['nextAction','Next Action']].map(([v,l]) => (
            <Btn key={v} active={sortEng===v} onClick={()=>setSortEng(v)} style={{ fontSize:11, padding:'4px 10px' }}>{l}</Btn>
          ))}
        </div>
      </div>

      {/* New engagement form */}
      {showForm && (
        <Card style={{ border:`2px solid ${T.gold}` }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:16 }}>New Engagement</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
            {[
              ['Company','company','text'],['Objective','objective','text'],['Target Date','targetDate','date']
            ].map(([lbl,key,type]) => (
              <div key={key}>
                <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>{lbl}</div>
                <input type={type} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
                  style={{ width:'100%', padding:'7px 10px', border:`1px solid ${T.border}`,
                    borderRadius:6, fontSize:13, boxSizing:'border-box' }}/>
              </div>
            ))}
            <div>
              <div style={{ fontSize:11, color:T.textMut, marginBottom:4 }}>ESG Theme</div>
              <select value={form.theme} onChange={e=>setForm(f=>({...f,theme:e.target.value}))}
                style={{ width:'100%', padding:'7px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13 }}>
                {['Climate','Social','Governance'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <Btn active onClick={submitForm}>Submit</Btn>
            <Btn onClick={()=>setShowForm(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20 }}>
        {/* Engagement queue */}
        <div>
          <Card style={{ padding:0, overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:T.surfaceH }}>
                    {['P','Company','Issue','°C Gap','Weight','Status','Owner','Next Action'].map(h => (
                      <th key={h} style={{ padding:'10px 12px', textAlign:'left',
                        color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                    <th style={{ padding:'10px 12px', borderBottom:`1px solid ${T.border}` }}/>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((e, ri) => (
                    <React.Fragment key={e.id}>
                      <tr onClick={()=>setExpandedEng(expandedEng===e.id ? null : e.id)}
                        style={{ cursor:'pointer', background: expandedEng===e.id ? T.surfaceH :
                          ri%2===0 ? T.surface : '#faf9f7', borderBottom:`1px solid ${T.border}` }}>
                        <td style={{ padding:'8px 12px', fontWeight:700, color:T.text }}>{e.priority}</td>
                        <td style={{ padding:'8px 12px', fontWeight:500, color:T.text }}>{e.company}</td>
                        <td style={{ padding:'8px 12px', color:T.textSec }}>{e.issue}</td>
                        <td style={{ padding:'8px 12px', fontWeight:700,
                          color:e.tempGap > 1.5 ? T.red : e.tempGap > 0.8 ? T.amber : T.amber }}>
                          +{e.tempGap.toFixed(2)}°C
                        </td>
                        <td style={{ padding:'8px 12px', color:T.textSec }}>{e.weight.toFixed(2)}%</td>
                        <td style={{ padding:'8px 12px' }}>
                          <span style={{ fontSize:11, fontWeight:600, color:StatusColors[e.status],
                            background:StatusColors[e.status]+'22', padding:'2px 8px', borderRadius:20 }}>
                            {e.status}
                          </span>
                        </td>
                        <td style={{ padding:'8px 12px', color:T.textSec }}>{e.owner}</td>
                        <td style={{ padding:'8px 12px', color:T.textMut }}>{e.nextAction}</td>
                        <td style={{ padding:'8px 12px' }}>
                          <button onClick={ev=>{ ev.stopPropagation(); advanceStatus(e.id); }}
                            style={{ fontSize:10, padding:'3px 8px', border:`1px solid ${T.border}`,
                              borderRadius:4, cursor:'pointer', background:T.surface, color:T.textSec }}>
                            Advance ▶
                          </button>
                        </td>
                      </tr>
                      {expandedEng===e.id && (
                        <tr style={{ background:T.surfaceH }}>
                          <td colSpan={9} style={{ padding:16, borderBottom:`1px solid ${T.border}` }}>
                            <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:8 }}>Engagement Log</div>
                            {e.log.map((l,li) => (
                              <div key={li} style={{ display:'grid', gridTemplateColumns:'100px 100px 1fr 1fr',
                                gap:8, padding:'6px 0', borderBottom:`1px solid ${T.border}`, fontSize:11 }}>
                                <span style={{ color:T.textMut }}>{l.date}</span>
                                <Badge val={l.type} color={T.gold}/>
                                <span style={{ color:T.textSec }}>{l.outcome}</span>
                                <span style={{ color:T.navyL }}>→ {l.next}</span>
                              </div>
                            ))}
                            {e.log.length===0 && (
                              <div style={{ fontSize:11, color:T.textMut }}>No interactions logged yet.</div>
                            )}
                            {/* Status stepper */}
                            <div style={{ display:'flex', alignItems:'center', gap:0, marginTop:12 }}>
                              {STATUSES.map((s,si) => (
                                <React.Fragment key={s}>
                                  <div style={{ padding:'4px 8px', borderRadius:4, fontSize:10, fontWeight:600,
                                    background: STATUSES.indexOf(e.status) >= si ? T.navy : T.border,
                                    color: STATUSES.indexOf(e.status) >= si ? '#fff' : T.textMut,
                                    whiteSpace:'nowrap' }}>{s}</div>
                                  {si < STATUSES.length-1 && (
                                    <div style={{ width:20, height:2,
                                      background: STATUSES.indexOf(e.status) > si ? T.navy : T.border }}/>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Side panels */}
        <div style={{ display:'grid', gap:16 }}>
          {/* Calendar */}
          <Card>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:10 }}>Upcoming Actions</div>
            <div style={{ display:'flex', gap:6, marginBottom:12 }}>
              {[30,60,90].map(d => (
                <Btn key={d} active={calDays===d} onClick={()=>setCalDays(d)} style={{ fontSize:11, padding:'3px 10px' }}>
                  {d}d
                </Btn>
              ))}
            </div>
            {calItems.length===0 && (
              <div style={{ fontSize:12, color:T.textMut }}>No actions in next {calDays} days.</div>
            )}
            {calItems.slice(0,6).map(e => (
              <div key={e.id} style={{ display:'flex', justifyContent:'space-between',
                padding:'7px 0', borderBottom:`1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{e.company}</div>
                  <div style={{ fontSize:11, color:T.textSec }}>{e.issue}</div>
                </div>
                <div style={{ fontSize:11, color:T.textMut }}>{e.nextAction}</div>
              </div>
            ))}
          </Card>

          {/* Re-alignment scenario */}
          <Card>
            <div style={{ fontSize:13, fontWeight:600, color:T.text, marginBottom:8 }}>Divestment Scenario</div>
            <div style={{ fontSize:11, color:T.textMut, marginBottom:10 }}>
              Select companies to divest — see portfolio temperature impact
            </div>
            {engagements.slice(0,8).map(e => (
              <label key={e.id} style={{ display:'flex', alignItems:'center', gap:8,
                marginBottom:6, cursor:'pointer' }}>
                <input type="checkbox" checked={divestSel.includes(e.id)}
                  onChange={ev => setDivestSel(s => ev.target.checked ? [...s,e.id] : s.filter(x=>x!==e.id))}/>
                <span style={{ fontSize:11, color:T.textSec, flex:1 }}>{e.company}</span>
                <span style={{ fontSize:11, fontWeight:700, color:tempColor(e.tempGap+1.5) }}>
                  +{e.tempGap.toFixed(1)}°C
                </span>
              </label>
            ))}
            <div style={{ marginTop:12, padding:10, background:T.surfaceH, borderRadius:8,
              textAlign:'center' }}>
              <div style={{ fontSize:11, color:T.textMut }}>Resulting Portfolio Temp</div>
              <div style={{ fontSize:28, fontWeight:800, color:tempColor(divestTemp) }}>
                {divestTemp}°C
              </div>
              {divestSel.length>0 && (
                <div style={{ fontSize:11, color:T.green }}>
                  ↓ {(2.7-divestTemp).toFixed(2)}°C reduction
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Root page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id:'dashboard', label:'Portfolio Temperature Dashboard' },
  { id:'holdings',  label:'Holdings Screener' },
  { id:'pacta',     label:'PACTA Sector Analysis' },
  { id:'engagement',label:'Engagement Tracker' },
];

export default function PortfolioTemperatureScorePage() {
  const [tab,          setTab]          = useState('dashboard');
  const [methodology,  setMethodology]  = useState('pacta');
  const [attribution,  setAttribution]  = useState('EVIC-weighted');
  const [scope3,       setScope3]       = useState(true);
  const [yearFilter,   setYearFilter]   = useState('Q4 2024');

  const portfolioTemp = useMemo(() => {
    const base = METHODOLOGIES.find(m => m.id===methodology)?.temp ?? 2.7;
    const scope3Adj = scope3 ? 0 : -0.3;
    const yearAdj   = YEAR_DELTAS[yearFilter] ?? 0;
    return +(base + scope3Adj + yearAdj).toFixed(2);
  }, [methodology, scope3, yearFilter]);

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:T.font, padding:24 }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:T.navy }}>
          Portfolio Temperature Score
        </h1>
        <p style={{ margin:'4px 0 0', fontSize:14, color:T.textSec }}>
          PACTA · SBTi · TPI multi-methodology temperature assessment across 60 holdings
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, marginBottom:24, borderBottom:`2px solid ${T.border}`, paddingBottom:0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'10px 20px', border:'none', background:'none', cursor:'pointer',
            fontSize:13, fontWeight: tab===t.id ? 700 : 400,
            color: tab===t.id ? T.navy : T.textSec,
            borderBottom: tab===t.id ? `2px solid ${T.navy}` : '2px solid transparent',
            marginBottom:-2, transition:'all .15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab==='dashboard'  && (
        <DashboardTab methodology={methodology} setMethodology={setMethodology}
          attribution={attribution} setAttribution={setAttribution}
          scope3={scope3} setScope3={setScope3}
          yearFilter={yearFilter} setYearFilter={setYearFilter}
          portfolioTemp={portfolioTemp}/>
      )}
      {tab==='holdings'   && <HoldingsTab/>}
      {tab==='pacta'      && <PactaTab/>}
      {tab==='engagement' && <EngagementTab/>}
    </div>
  );
}
