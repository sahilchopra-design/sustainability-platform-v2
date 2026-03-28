import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, Legend, PieChart, Pie,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const SECTORS = [
  'Oil & Gas','Electric Utilities','Cement','Steel','Automotive',
  'Aviation','Shipping','Chemicals','Mining','Real Estate',
  'Food & Beverage','Telecommunications','Banking','Insurance','Retail',
];

const DIMENSIONS = [
  { key:'targets', label:'Targets', weight:15, desc:'Alignment of emission reduction targets with Paris Agreement' },
  { key:'matInvest', label:'Material Investment', weight:20, desc:'CapEx allocation toward low-carbon assets and technologies' },
  { key:'intInvest', label:'Intangible Investment', weight:15, desc:'R&D spending on decarbonisation and clean technology' },
  { key:'soldProd', label:'Sold Product Performance', weight:20, desc:'Carbon intensity of sold products relative to benchmarks' },
  { key:'mgmt', label:'Management', weight:15, desc:'Governance, climate oversight, and internal carbon pricing' },
  { key:'supplier', label:'Supplier Engagement', weight:15, desc:'Scope 3 upstream engagement and supplier decarbonisation programs' },
];

const GRADES = ['A','B','C','D','E'];
const GRADE_COLORS = { A:T.green, B:'#22c55e', C:T.amber, D:'#ea580c', E:T.red };
const GRADE_LABELS = { A:'Advanced',B:'Progressing',C:'Building Momentum',D:'Starting',E:'Not Aligned' };

const FLAG_TYPES = [
  { id:0, name:'Net-Zero Without Near-Term Targets', severity:5 },
  { id:1, name:'High Brown CapEx Ratio', severity:4 },
  { id:2, name:'Inconsistent Lobbying Activities', severity:4 },
  { id:3, name:'No Scope 3 Coverage', severity:5 },
  { id:4, name:'Offset-Heavy Strategy', severity:3 },
  { id:5, name:'Missing Board Climate Oversight', severity:3 },
  { id:6, name:'No Internal Carbon Price', severity:2 },
  { id:7, name:'Declining R&D Investment', severity:3 },
  { id:8, name:'Supplier Engagement < 20%', severity:2 },
  { id:9, name:'Greenwashing Risk (Marketing vs Action)', severity:5 },
];

const COMPANIES = Array.from({length:100}, (_,i) => {
  const s = sr(i*7+3);
  const sector = SECTORS[Math.floor(sr(i*13+5)*SECTORS.length)];
  const dimScores = DIMENSIONS.map((_d,di) => {
    const base = sr(i*31+di*17)*16 + sr(i*11+di*7)*4;
    return Math.min(20, Math.max(0, Math.round(base*10)/10));
  });
  const weighted = dimScores.reduce((a,sc,di) => a + sc * DIMENSIONS[di].weight, 0) / 100;
  const grade = weighted >= 16 ? 'A' : weighted >= 12 ? 'B' : weighted >= 8 ? 'C' : weighted >= 4 ? 'D' : 'E';
  const flags = FLAG_TYPES.filter((_f,fi) => sr(i*41+fi*23) > 0.55).map(f => f.id);
  const names = [
    'Meridian Energy','Atlas Corp','Vanguard Industries','Pacific Holdings','Nordic Systems',
    'Coastal Resources','Summit Capital','Prairie Solutions','Alpine Technologies','River Basin Group',
    'Horizon Dynamics','Sterling Materials','Apex Global','Pinnacle Energy','Crestview Mining',
    'BlueWave Corp','Verdant Holdings','Ironclad Systems','Aurelia Partners','Zenith Logistics',
    'Cascade Power','Obsidian Capital','Terraverde Inc','Silver Ridge','Boreal Industries',
    'Eclipse Energy','Polaris Group','Ember Resources','Cobalt Mining','Solstice Holdings',
    'Nova Materials','Granite Corp','Seaforth Energy','Windward Tech','Beacon Capital',
    'Stratus Systems','Redwood Holdings','Canyon Resources','Prism Energy','Harbor Industries',
    'Velocity Group','Quantum Materials','Osprey Corp','Cedar Holdings','Talon Energy',
    'Compass Mining','Sable Resources','Northstar Power','Firestone Corp','Aegis Capital',
    'Summit Energy','Titan Corp','Lakeview Holdings','Sierra Resources','Basalt Industries',
    'Copperton Mining','Evergreen Power','Delta Systems','Sapphire Corp','Ridgeline Energy',
    'Phoenix Holdings','Tundra Resources','Falcon Industries','Oasis Capital','Magellan Corp',
    'Ironwood Energy','Clearwater Group','Slate Mining','Torrent Power','Halcyon Holdings',
    'Zephyr Corp','Aspen Resources','Boulder Industries','Cirrus Energy','Dune Capital',
    'Ember Holdings','Flint Systems','Garnet Corp','Halo Energy','Ivory Industries',
    'Jasper Mining','Keystone Power','Lunar Holdings','Mesa Corp','Nimbus Energy',
    'Onyx Resources','Paragon Group','Quartz Industries','Riviera Capital','Sienna Corp',
    'Topaz Energy','Umber Holdings','Vortex Systems','Wren Resources','Xenon Industries',
    'Yarrow Corp','Zenith Energy','Alder Holdings','Birch Resources','Coral Industries',
  ];
  const histGrades = [2022,2023,2024,2025].map(yr => {
    const drift = sr(i*53+yr*7)*3-1;
    const adjW = Math.max(0, Math.min(20, weighted + drift));
    return { year:yr, grade: adjW>=16?'A':adjW>=12?'B':adjW>=8?'C':adjW>=4?'D':'E' };
  });
  const countries = ['US','UK','DE','FR','JP','CN','AU','CA','BR','IN','NL','CH','KR','SG','NO'];
  const country = countries[Math.floor(sr(i*17+11)*countries.length)];
  const scope1 = Math.round(sr(i*29+3)*4500+200);
  const scope2 = Math.round(sr(i*37+7)*2200+100);
  const scope3 = Math.round(sr(i*43+13)*28000+2000);
  const carbonIntensity = Math.round((scope1+scope2+scope3)/(sr(i*19+2)*80+5)*10)/10;
  const sbtiStatus = sr(i*61+9) > 0.6 ? 'Committed' : sr(i*61+9) > 0.3 ? 'Target Set' : 'None';
  const netZeroYear = sr(i*71+4) > 0.5 ? 2050 : sr(i*71+4) > 0.25 ? 2040 : 0;
  const brownCapExPct = Math.round(sr(i*47+17)*65+5);
  const greenCapExPct = 100 - brownCapExPct;
  const supplierEngPct = Math.round(sr(i*59+21)*80+5);
  const boardClimateOversight = sr(i*67+33) > 0.4;
  const internalCarbonPrice = sr(i*73+41) > 0.5 ? Math.round(sr(i*79+47)*120+20) : 0;
  const cdpScore = ['A','A-','B','B-','C','C-','D','D-'][Math.floor(sr(i*83+53)*8)];
  return {
    id:i, name:names[i], sector, dimScores, weighted:Math.round(weighted*100)/100,
    grade, flags, revenue:Math.round(sr(i*19+2)*80+5)+'B',
    employees:Math.round(sr(i*23+1)*180+5)+'K', histGrades,
    country, scope1, scope2, scope3, carbonIntensity, sbtiStatus, netZeroYear,
    brownCapExPct, greenCapExPct, supplierEngPct, boardClimateOversight,
    internalCarbonPrice, cdpScore,
    evidence: DIMENSIONS.map((_d,di) => {
      const ev = [
        'SBTi-validated 1.5C target by 2030','Committed net-zero by 2050 but no interim milestones',
        '42% of CapEx allocated to renewables','Launched $2B green bond for clean energy transition',
        'R&D spend at 3.2% of revenue on clean tech','Patent portfolio includes 45 clean-tech patents',
        'Product carbon intensity reduced 28% since 2019','Sold products 15% above sector benchmark',
        'Board-level climate committee established 2023','Internal carbon price at $85/tCO2e',
        '65% of suppliers by spend engaged on SBTi','Scope 3 Category 1 mapped for 80% of suppliers',
      ];
      return ev[Math.floor(sr(i*67+di*29)*ev.length)];
    }),
  };
});

const TABS = ['ACT Scoring Engine','Maturity Distribution','Credibility Flags','Sector Benchmarking'];

const card = { background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:24 };
const cardSm = { ...card, padding:16 };
const btn = (active) => ({
  padding:'10px 22px', borderRadius:10, border:`1px solid ${active?T.navy:T.border}`,
  background:active?T.navy:T.surface, color:active?'#fff':T.text, cursor:'pointer',
  fontWeight:600, fontSize:13, fontFamily:T.font, transition:'all 0.2s',
});
const badge = (color) => ({
  display:'inline-block', padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:700,
  background:color+'18', color, fontFamily:T.mono,
});
const select = {
  padding:'8px 14px', borderRadius:8, border:`1px solid ${T.border}`, background:T.surface,
  fontFamily:T.font, fontSize:13, color:T.text, cursor:'pointer', outline:'none',
};
const slider = {
  width:'100%', accentColor:T.navy, cursor:'pointer', height:6,
};

/* ─── Main Component ─── */
export default function ActAssessmentPage() {
  const [tab, setTab] = useState(0);
  const [selCo, setSelCo] = useState(0);
  const [selSector, setSelSector] = useState('All');
  const [dimOverrides, setDimOverrides] = useState(null);
  const [running, setRunning] = useState(false);
  const [assessed, setAssessed] = useState(false);
  const [gradeFilter, setGradeFilter] = useState(null);
  const [flagCo, setFlagCo] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [benchSector, setBenchSector] = useState(SECTORS[0]);
  const [planCo, setPlanCo] = useState(null);
  const [csvMsg, setCsvMsg] = useState('');

  const company = COMPANIES[selCo];
  const scores = dimOverrides || company.dimScores;

  const calcGrade = useCallback((sc) => {
    const w = sc.reduce((a,s,i) => a + s * DIMENSIONS[i].weight, 0) / 100;
    return { weighted:Math.round(w*100)/100, grade: w>=16?'A':w>=12?'B':w>=8?'C':w>=4?'D':'E' };
  }, []);

  const currentCalc = useMemo(() => calcGrade(scores), [scores, calcGrade]);

  const handleSlider = (idx, val) => {
    const next = [...scores];
    next[idx] = parseFloat(val);
    setDimOverrides(next);
    setAssessed(false);
  };

  const runAssessment = () => {
    setRunning(true);
    setTimeout(() => { setRunning(false); setAssessed(true); }, 1200);
  };

  const radarData = DIMENSIONS.map((d,i) => ({
    dim:d.label, score:scores[i], max:20,
    peer:Math.round(sr(i*41+99)*12+4),
  }));

  /* ── Tab 2 data ── */
  const distData = useMemo(() => {
    const filtered = selSector==='All' ? COMPANIES : COMPANIES.filter(c=>c.sector===selSector);
    return GRADES.map(g => ({ grade:g, count:filtered.filter(c=>c.grade===g).length, fill:GRADE_COLORS[g] }));
  }, [selSector]);

  const sectorHeatmap = useMemo(() => SECTORS.map(sec => {
    const cos = COMPANIES.filter(c=>c.sector===sec);
    const avg = cos.length ? cos.reduce((a,c)=>a+c.weighted,0)/cos.length : 0;
    return { sector:sec, avg:Math.round(avg*10)/10, count:cos.length,
      grade: avg>=16?'A':avg>=12?'B':avg>=8?'C':avg>=4?'D':'E' };
  }), []);

  const trendData = useMemo(() => {
    const years = [2022,2023,2024,2025];
    return years.map(yr => {
      const filtered = selSector==='All' ? COMPANIES : COMPANIES.filter(c=>c.sector===selSector);
      const row = { year:yr };
      GRADES.forEach(g => {
        row[g] = filtered.filter(c => {
          const h = c.histGrades.find(h2=>h2.year===yr);
          return h && h.grade===g;
        }).length;
      });
      return row;
    });
  }, [selSector]);

  const migrationMatrix = useMemo(() => {
    const filtered = selSector==='All' ? COMPANIES : COMPANIES.filter(c=>c.sector===selSector);
    const matrix = {};
    GRADES.forEach(g1 => { matrix[g1]={}; GRADES.forEach(g2 => { matrix[g1][g2]=0; }); });
    filtered.forEach(c => {
      const h23 = c.histGrades.find(h=>h.year===2023);
      const h25 = c.histGrades.find(h=>h.year===2025);
      if(h23&&h25) matrix[h23.grade][h25.grade]++;
    });
    return matrix;
  }, [selSector]);

  /* ── Tab 3 data ── */
  const flagHeatmap = useMemo(() => COMPANIES.map(c => ({
    id:c.id, name:c.name, sector:c.sector, grade:c.grade,
    flags: FLAG_TYPES.map(f => c.flags.includes(f.id)),
    totalSeverity: c.flags.reduce((a,fid) => a + FLAG_TYPES[fid].severity, 0),
  })).sort((a,b)=>b.totalSeverity-a.totalSeverity), []);

  /* ── Tab 4 data ── */
  const sectorCos = useMemo(() =>
    COMPANIES.filter(c=>c.sector===benchSector).sort((a,b)=>b.weighted-a.weighted),
  [benchSector]);

  const sectorAvg = useMemo(() => {
    if(!sectorCos.length) return DIMENSIONS.map(()=>0);
    return DIMENSIONS.map((_,di) =>
      Math.round(sectorCos.reduce((a,c)=>a+c.dimScores[di],0)/sectorCos.length*10)/10
    );
  }, [sectorCos]);

  const exportCSV = () => {
    const header = ['Company','Sector','ACT Score','Grade',...DIMENSIONS.map(d=>d.label)].join(',');
    const rows = sectorCos.map(c =>
      [c.name,c.sector,c.weighted,c.grade,...c.dimScores].join(',')
    );
    const blob = new Blob([header+'\n'+rows.join('\n')], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`act_benchmark_${benchSector.replace(/\s+/g,'_')}.csv`; a.click();
    URL.revokeObjectURL(url);
    setCsvMsg('Exported!');
    setTimeout(()=>setCsvMsg(''),2000);
  };

  const improvementPlan = useMemo(() => {
    if(!planCo) return [];
    const co = COMPANIES[planCo];
    return DIMENSIONS.map((d,i) => {
      const gap = 20 - co.dimScores[i];
      const impact = Math.round(gap * d.weight / 100 * 100)/100;
      const actions = [
        'Set SBTi-validated near-term target','Increase low-carbon CapEx to 40%+',
        'Boost R&D spend by 1.5% of revenue','Redesign product lines for lower intensity',
        'Establish board climate committee','Launch CDP-aligned supplier program',
      ];
      return { dim:d.label, current:co.dimScores[i], gap:Math.round(gap*10)/10,
        impact, action:actions[i], priority: gap>10?'High':gap>5?'Medium':'Low' };
    }).sort((a,b)=>b.impact-a.impact);
  }, [planCo]);

  /* ─── Render helpers ─── */
  const renderGradeBadge = (g, size='sm') => (
    <span style={{
      ...badge(GRADE_COLORS[g]),
      fontSize: size==='lg'?16:11,
      padding: size==='lg'?'6px 16px':'3px 10px',
    }}>{g} - {GRADE_LABELS[g]}</span>
  );

  /* ════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:32, color:T.text }}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
          <span style={{ fontSize:28 }}>&#9878;</span>
          <h1 style={{ fontSize:26, fontWeight:800, margin:0, letterSpacing:'-0.5px' }}>
            ACT Assessment & Maturity Scoring
          </h1>
        </div>
        <p style={{ color:T.textSec, fontSize:14, margin:0 }}>
          CDP/ADEME Assessing low-Carbon Transition methodology — {COMPANIES.length} companies across {SECTORS.length} sectors
        </p>
      </div>

      {/* KPI Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label:'Companies Assessed', value:COMPANIES.length, color:T.navy },
          { label:'Average ACT Score', value:(COMPANIES.reduce((a,c)=>a+c.weighted,0)/COMPANIES.length).toFixed(1)+'/20', color:T.gold },
          { label:'Grade A Companies', value:COMPANIES.filter(c=>c.grade==='A').length, color:T.green },
          { label:'Critical Flags', value:COMPANIES.reduce((a,c)=>a+c.flags.length,0), color:T.red },
          { label:'Sectors Covered', value:SECTORS.length, color:T.sage },
        ].map((kpi,i) => (
          <div key={i} style={cardSm}>
            <div style={{ fontSize:11, color:T.textMut, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>{kpi.label}</div>
            <div style={{ fontSize:26, fontWeight:800, color:kpi.color, marginTop:4, fontFamily:T.mono }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {TABS.map((t,i) => (
          <button key={i} onClick={()=>setTab(i)} style={btn(tab===i)}>{t}</button>
        ))}
      </div>

      {/* ════════ TAB 0: ACT Scoring Engine ════════ */}
      {tab===0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {/* Left: Company selector + dimension sliders */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={card}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Select Company</div>
              <select value={selCo} onChange={e=>{setSelCo(+e.target.value);setDimOverrides(null);setAssessed(false);}}
                style={{ ...select, width:'100%' }}>
                {COMPANIES.map((c,i) => (
                  <option key={i} value={i}>{c.name} — {c.sector} (Grade {c.grade})</option>
                ))}
              </select>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:14 }}>
                <div style={{ padding:10, background:T.surfaceH, borderRadius:8 }}>
                  <div style={{ fontSize:10, color:T.textMut }}>Sector</div>
                  <div style={{ fontSize:13, fontWeight:700 }}>{company.sector}</div>
                </div>
                <div style={{ padding:10, background:T.surfaceH, borderRadius:8 }}>
                  <div style={{ fontSize:10, color:T.textMut }}>Revenue</div>
                  <div style={{ fontSize:13, fontWeight:700 }}>${company.revenue}</div>
                </div>
                <div style={{ padding:10, background:T.surfaceH, borderRadius:8 }}>
                  <div style={{ fontSize:10, color:T.textMut }}>Employees</div>
                  <div style={{ fontSize:13, fontWeight:700 }}>{company.employees}</div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginTop:10 }}>
                <div style={{ padding:8, background:T.surfaceH, borderRadius:8 }}>
                  <div style={{ fontSize:9, color:T.textMut, textTransform:'uppercase' }}>Country</div>
                  <div style={{ fontSize:12, fontWeight:700 }}>{company.country}</div>
                </div>
                <div style={{ padding:8, background:T.surfaceH, borderRadius:8 }}>
                  <div style={{ fontSize:9, color:T.textMut, textTransform:'uppercase' }}>SBTi Status</div>
                  <div style={{ fontSize:12, fontWeight:700, color:company.sbtiStatus==='Target Set'?T.green:company.sbtiStatus==='Committed'?T.amber:T.red }}>{company.sbtiStatus}</div>
                </div>
                <div style={{ padding:8, background:T.surfaceH, borderRadius:8 }}>
                  <div style={{ fontSize:9, color:T.textMut, textTransform:'uppercase' }}>CDP Score</div>
                  <div style={{ fontSize:12, fontWeight:700 }}>{company.cdpScore}</div>
                </div>
                <div style={{ padding:8, background:T.surfaceH, borderRadius:8 }}>
                  <div style={{ fontSize:9, color:T.textMut, textTransform:'uppercase' }}>Net-Zero Target</div>
                  <div style={{ fontSize:12, fontWeight:700, color:company.netZeroYear?T.green:T.red }}>{company.netZeroYear||'None'}</div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginTop:10 }}>
                <div style={{ padding:8, background:T.surfaceH, borderRadius:8 }}>
                  <div style={{ fontSize:9, color:T.textMut, textTransform:'uppercase' }}>Scope 1 (tCO2e)</div>
                  <div style={{ fontSize:12, fontWeight:700, fontFamily:T.mono }}>{company.scope1.toLocaleString()}</div>
                </div>
                <div style={{ padding:8, background:T.surfaceH, borderRadius:8 }}>
                  <div style={{ fontSize:9, color:T.textMut, textTransform:'uppercase' }}>Scope 2 (tCO2e)</div>
                  <div style={{ fontSize:12, fontWeight:700, fontFamily:T.mono }}>{company.scope2.toLocaleString()}</div>
                </div>
                <div style={{ padding:8, background:T.surfaceH, borderRadius:8 }}>
                  <div style={{ fontSize:9, color:T.textMut, textTransform:'uppercase' }}>Scope 3 (tCO2e)</div>
                  <div style={{ fontSize:12, fontWeight:700, fontFamily:T.mono }}>{company.scope3.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginTop:10 }}>
                <div style={{ padding:8, background:T.surfaceH, borderRadius:8 }}>
                  <div style={{ fontSize:9, color:T.textMut, textTransform:'uppercase' }}>Carbon Intensity</div>
                  <div style={{ fontSize:12, fontWeight:700, fontFamily:T.mono }}>{company.carbonIntensity} tCO2e/$M</div>
                </div>
                <div style={{ padding:8, background:T.surfaceH, borderRadius:8 }}>
                  <div style={{ fontSize:9, color:T.textMut, textTransform:'uppercase' }}>Green CapEx</div>
                  <div style={{ fontSize:12, fontWeight:700, color:company.greenCapExPct>50?T.green:T.amber }}>{company.greenCapExPct}%</div>
                </div>
                <div style={{ padding:8, background:T.surfaceH, borderRadius:8 }}>
                  <div style={{ fontSize:9, color:T.textMut, textTransform:'uppercase' }}>Supplier Engagement</div>
                  <div style={{ fontSize:12, fontWeight:700, color:company.supplierEngPct>50?T.green:T.amber }}>{company.supplierEngPct}%</div>
                </div>
              </div>
            </div>

            {/* Dimension Sliders */}
            <div style={card}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>ACT Dimension Scores</div>
              <div style={{ fontSize:12, color:T.textMut, marginBottom:16 }}>Adjust scores per dimension (0-20 scale)</div>
              {DIMENSIONS.map((d,i) => (
                <div key={d.key} style={{ marginBottom:18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:600 }}>{d.label}</span>
                    <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:11, color:T.textMut }}>Weight: {d.weight}%</span>
                      <span style={{ fontFamily:T.mono, fontWeight:800, fontSize:15, color:T.navy,
                        background:T.surfaceH, padding:'2px 10px', borderRadius:6 }}>
                        {scores[i].toFixed(1)}
                      </span>
                    </span>
                  </div>
                  <input type="range" min="0" max="20" step="0.1" value={scores[i]}
                    onChange={e=>handleSlider(i,e.target.value)} style={slider} />
                  <div style={{ fontSize:11, color:T.textMut, marginTop:2 }}>{d.desc}</div>
                  <div style={{ fontSize:11, color:T.navyL, fontStyle:'italic', marginTop:2 }}>
                    Evidence: {company.evidence[i]}
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Grade + Run */}
            <div style={{ ...card, background:T.navy, color:'#fff' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:12, opacity:0.7, fontWeight:600 }}>Overall ACT Score</div>
                  <div style={{ fontSize:36, fontWeight:900, fontFamily:T.mono }}>{currentCalc.weighted}/20</div>
                  <div style={{ marginTop:4 }}>{renderGradeBadge(currentCalc.grade,'lg')}</div>
                </div>
                <button onClick={runAssessment} disabled={running}
                  style={{
                    padding:'14px 32px', borderRadius:12, border:'none', cursor:running?'wait':'pointer',
                    background: running ? T.goldL : T.gold, color:T.navy, fontWeight:800, fontSize:15,
                    fontFamily:T.font, transition:'all 0.3s',
                    transform: running?'scale(0.96)':'scale(1)',
                    boxShadow: assessed?'0 0 20px rgba(197,169,106,0.5)':'none',
                  }}>
                  {running ? '⏳ Assessing...' : assessed ? '✓ Assessment Complete' : 'Run Assessment'}
                </button>
              </div>
              {assessed && (
                <div style={{ marginTop:14, padding:12, background:'rgba(255,255,255,0.1)', borderRadius:10, fontSize:12 }}>
                  Assessment validated. Grade {currentCalc.grade} ({GRADE_LABELS[currentCalc.grade]}) confirmed with {currentCalc.weighted}/20 weighted score.
                  {dimOverrides ? ' Custom overrides applied.' : ' Using baseline scores.'}
                </div>
              )}
            </div>
          </div>

          {/* Right: Radar + Peer Comparison */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={card}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>ACT Dimension Radar</div>
              <ResponsiveContainer width="100%" height={340}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="dim" tick={{ fontSize:11, fill:T.textSec }} />
                  <PolarRadiusAxis domain={[0,20]} tick={{ fontSize:10, fill:T.textMut }} />
                  <Radar name="Company" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2} />
                  <Radar name="Sector Avg" dataKey="peer" stroke={T.gold} fill={T.gold} fillOpacity={0.1} strokeWidth={2} strokeDasharray="4 4" />
                  <Legend wrapperStyle={{ fontSize:12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Dimension Score Bar */}
            <div style={card}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Dimension Score Breakdown</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={DIMENSIONS.map((d,i) => ({
                  dim:d.label, score:scores[i], weight:d.weight,
                  contribution:Math.round(scores[i]*d.weight/100*100)/100,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="dim" tick={{ fontSize:9, fill:T.textSec }} />
                  <YAxis domain={[0,20]} tick={{ fontSize:10, fill:T.textMut }} />
                  <Tooltip contentStyle={{ borderRadius:10, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:12 }}
                    formatter={(v,n,p) => {
                      if(n==='score') return [`${v}/20`, 'Score'];
                      return [v,'Contribution'];
                    }} />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                  <Bar dataKey="score" name="Score (0-20)" fill={T.navy} radius={[4,4,0,0]} />
                  <Bar dataKey="contribution" name="Weighted Contribution" fill={T.gold} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:10 }}>
                <div style={{ padding:8, background:T.surfaceH, borderRadius:8, textAlign:'center' }}>
                  <div style={{ fontSize:9, color:T.textMut, textTransform:'uppercase' }}>Strongest Dimension</div>
                  <div style={{ fontSize:12, fontWeight:700, color:T.green }}>
                    {DIMENSIONS[scores.indexOf(Math.max(...scores))].label}
                  </div>
                </div>
                <div style={{ padding:8, background:T.surfaceH, borderRadius:8, textAlign:'center' }}>
                  <div style={{ fontSize:9, color:T.textMut, textTransform:'uppercase' }}>Weakest Dimension</div>
                  <div style={{ fontSize:12, fontWeight:700, color:T.red }}>
                    {DIMENSIONS[scores.indexOf(Math.min(...scores))].label}
                  </div>
                </div>
                <div style={{ padding:8, background:T.surfaceH, borderRadius:8, textAlign:'center' }}>
                  <div style={{ fontSize:9, color:T.textMut, textTransform:'uppercase' }}>Score Range</div>
                  <div style={{ fontSize:12, fontWeight:700, fontFamily:T.mono }}>
                    {Math.min(...scores).toFixed(1)} - {Math.max(...scores).toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* Peer Comparison */}
            <div style={card}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Peer Comparison — {company.sector}</div>
              {(() => {
                const peers = COMPANIES.filter(c=>c.sector===company.sector).sort((a,b)=>b.weighted-a.weighted);
                const rank = peers.findIndex(p=>p.id===company.id)+1;
                return (
                  <>
                    <div style={{ marginBottom:12, fontSize:13, color:T.textSec }}>
                      Ranked <strong style={{ color:T.navy }}>#{rank}</strong> of {peers.length} in {company.sector}
                    </div>
                    <div style={{ maxHeight:260, overflowY:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                        <thead>
                          <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                            <th style={{ textAlign:'left', padding:'6px 8px', color:T.textMut, fontWeight:600 }}>Rank</th>
                            <th style={{ textAlign:'left', padding:'6px 8px', color:T.textMut, fontWeight:600 }}>Company</th>
                            <th style={{ textAlign:'right', padding:'6px 8px', color:T.textMut, fontWeight:600 }}>Score</th>
                            <th style={{ textAlign:'center', padding:'6px 8px', color:T.textMut, fontWeight:600 }}>Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {peers.map((p,pi) => (
                            <tr key={p.id} style={{
                              borderBottom:`1px solid ${T.border}`,
                              background: p.id===company.id ? T.surfaceH : 'transparent',
                              fontWeight: p.id===company.id ? 700 : 400,
                            }}>
                              <td style={{ padding:'6px 8px' }}>{pi+1}</td>
                              <td style={{ padding:'6px 8px' }}>{p.name}{p.id===company.id?' ◀':''}</td>
                              <td style={{ padding:'6px 8px', textAlign:'right', fontFamily:T.mono }}>{p.weighted}</td>
                              <td style={{ padding:'6px 8px', textAlign:'center' }}>
                                <span style={badge(GRADE_COLORS[p.grade])}>{p.grade}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ════════ TAB 1: Maturity Distribution ════════ */}
      {tab===1 && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Filters */}
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <span style={{ fontSize:13, fontWeight:600 }}>Filter by Sector:</span>
            <select value={selSector} onChange={e=>{setSelSector(e.target.value);setGradeFilter(null);}} style={select}>
              <option value="All">All Sectors</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {gradeFilter && (
              <button onClick={()=>setGradeFilter(null)} style={{ ...btn(false), fontSize:11, padding:'6px 14px' }}>
                Clear Grade Filter: {gradeFilter}
              </button>
            )}
          </div>

          {/* Summary Stats Row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:14 }}>
            {(() => {
              const filtered = selSector==='All' ? COMPANIES : COMPANIES.filter(c=>c.sector===selSector);
              const avgScore = filtered.length?(filtered.reduce((a,c)=>a+c.weighted,0)/filtered.length).toFixed(1):'0';
              const medianScore = filtered.length?filtered.map(c=>c.weighted).sort((a,b)=>a-b)[Math.floor(filtered.length/2)].toFixed(1):'0';
              const sbtiPct = filtered.length?Math.round(filtered.filter(c=>c.sbtiStatus!=='None').length/filtered.length*100):0;
              const nzPct = filtered.length?Math.round(filtered.filter(c=>c.netZeroYear>0).length/filtered.length*100):0;
              const avgGreenCapEx = filtered.length?Math.round(filtered.reduce((a,c)=>a+c.greenCapExPct,0)/filtered.length):0;
              const gradeAB = filtered.filter(c=>c.grade==='A'||c.grade==='B').length;
              return [
                { label:'Companies', value:filtered.length, color:T.navy },
                { label:'Mean Score', value:avgScore+'/20', color:T.gold },
                { label:'Median Score', value:medianScore+'/20', color:T.navyL },
                { label:'SBTi Committed', value:sbtiPct+'%', color:T.sage },
                { label:'Net-Zero Target', value:nzPct+'%', color:T.green },
                { label:'Grade A+B', value:gradeAB, color:T.green },
              ].map((kpi,i) => (
                <div key={i} style={cardSm}>
                  <div style={{ fontSize:10, color:T.textMut, fontWeight:600, textTransform:'uppercase' }}>{kpi.label}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:kpi.color, marginTop:4, fontFamily:T.mono }}>{kpi.value}</div>
                </div>
              ));
            })()}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {/* Distribution Bar Chart */}
            <div style={card}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Grade Distribution</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={distData} onClick={d=>{ if(d&&d.activePayload) setGradeFilter(d.activePayload[0].payload.grade); }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="grade" tick={{ fontSize:13, fontWeight:700, fill:T.text }} />
                  <YAxis tick={{ fontSize:11, fill:T.textMut }} />
                  <Tooltip contentStyle={{ borderRadius:10, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:12 }}
                    formatter={(v,n,p) => [`${v} companies`, `Grade ${p.payload.grade} (${GRADE_LABELS[p.payload.grade]})`]} />
                  <Bar dataKey="count" radius={[6,6,0,0]} cursor="pointer">
                    {distData.map((d,i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ fontSize:11, color:T.textMut, marginTop:8 }}>Click a grade bar to filter companies</div>
            </div>

            {/* Sector Heatmap */}
            <div style={card}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Sector Maturity Heatmap</div>
              <div style={{ maxHeight:320, overflowY:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                      <th style={{ textAlign:'left', padding:'6px 8px', color:T.textMut }}>Sector</th>
                      <th style={{ textAlign:'center', padding:'6px 8px', color:T.textMut }}>Cos.</th>
                      <th style={{ textAlign:'right', padding:'6px 8px', color:T.textMut }}>Avg Score</th>
                      <th style={{ textAlign:'center', padding:'6px 8px', color:T.textMut }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectorHeatmap.sort((a,b)=>b.avg-a.avg).map(sh => (
                      <tr key={sh.sector} style={{ borderBottom:`1px solid ${T.border}` }}>
                        <td style={{ padding:'6px 8px', fontWeight:600 }}>{sh.sector}</td>
                        <td style={{ padding:'6px 8px', textAlign:'center', fontFamily:T.mono }}>{sh.count}</td>
                        <td style={{ padding:'6px 8px', textAlign:'right' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:8 }}>
                            <div style={{ width:60, height:8, background:T.surfaceH, borderRadius:4, overflow:'hidden' }}>
                              <div style={{ width:`${sh.avg/20*100}%`, height:'100%', background:GRADE_COLORS[sh.grade], borderRadius:4 }} />
                            </div>
                            <span style={{ fontFamily:T.mono, fontWeight:700 }}>{sh.avg}</span>
                          </div>
                        </td>
                        <td style={{ padding:'6px 8px', textAlign:'center' }}>
                          <span style={badge(GRADE_COLORS[sh.grade])}>{sh.grade}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Companies in grade (click filter) */}
          {gradeFilter && (
            <div style={card}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>
                Companies with Grade {gradeFilter} ({GRADE_LABELS[gradeFilter]})
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                {(selSector==='All'?COMPANIES:COMPANIES.filter(c=>c.sector===selSector))
                  .filter(c=>c.grade===gradeFilter).sort((a,b)=>b.weighted-a.weighted).map(c => (
                  <div key={c.id} style={{
                    padding:12, borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceH,
                  }}>
                    <div style={{ fontSize:13, fontWeight:700 }}>{c.name}</div>
                    <div style={{ fontSize:11, color:T.textMut }}>{c.sector}</div>
                    <div style={{ fontSize:13, fontWeight:800, fontFamily:T.mono, color:GRADE_COLORS[c.grade], marginTop:4 }}>
                      {c.weighted}/20
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {/* Trend Chart */}
            <div style={card}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Maturity Trend (2022-2025)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize:12, fill:T.text }} />
                  <YAxis tick={{ fontSize:11, fill:T.textMut }} />
                  <Tooltip contentStyle={{ borderRadius:10, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:12 }} />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                  {GRADES.map(g => (
                    <Bar key={g} dataKey={g} stackId="a" fill={GRADE_COLORS[g]} radius={g==='A'?[4,4,0,0]:[0,0,0,0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Migration Matrix */}
            <div style={card}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Grade Migration Matrix (2023 → 2025)</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr>
                    <th style={{ padding:8, textAlign:'left', color:T.textMut, fontSize:11 }}>From ↓ / To →</th>
                    {GRADES.map(g => (
                      <th key={g} style={{ padding:8, textAlign:'center', fontWeight:700, color:GRADE_COLORS[g] }}>{g}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GRADES.map(fromG => (
                    <tr key={fromG} style={{ borderTop:`1px solid ${T.border}` }}>
                      <td style={{ padding:8, fontWeight:700, color:GRADE_COLORS[fromG] }}>{fromG}</td>
                      {GRADES.map(toG => {
                        const val = migrationMatrix[fromG]?.[toG] || 0;
                        const isImprove = GRADES.indexOf(toG) < GRADES.indexOf(fromG);
                        const isDecline = GRADES.indexOf(toG) > GRADES.indexOf(fromG);
                        const isSame = fromG===toG;
                        return (
                          <td key={toG} style={{
                            padding:8, textAlign:'center', fontFamily:T.mono, fontWeight:val>0?700:400,
                            color: val===0?T.textMut:isSame?T.text:isImprove?T.green:isDecline?T.red:T.text,
                            background: val>0 ? (isSame?T.surfaceH:isImprove?T.green+'10':isDecline?T.red+'10':'transparent') : 'transparent',
                          }}>
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize:11, color:T.textMut, marginTop:8 }}>
                <span style={{ color:T.green }}>Green = improvement</span> | <span style={{ color:T.red }}>Red = decline</span> | Gray = stable
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════ TAB 2: Credibility Flags ════════ */}
      {tab===2 && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontSize:15, fontWeight:700 }}>Credibility Red Flag Analysis — {FLAG_TYPES.length} Flag Types</div>
            <button onClick={()=>{setScanning(true);setTimeout(()=>setScanning(false),1500);}} disabled={scanning}
              style={{ ...btn(true), opacity:scanning?0.7:1 }}>
              {scanning ? '⏳ Scanning All Companies...' : 'Bulk Scan (100 Companies)'}
            </button>
          </div>

          {/* Flag Type Legend */}
          <div style={{ ...card, padding:16 }}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
              {FLAG_TYPES.map(f => (
                <div key={f.id} style={{
                  padding:'5px 12px', borderRadius:8, fontSize:11, fontWeight:600,
                  background: f.severity>=4?T.red+'15':f.severity>=3?T.amber+'15':T.gold+'15',
                  color: f.severity>=4?T.red:f.severity>=3?T.amber:T.gold,
                  border:`1px solid ${f.severity>=4?T.red+'30':f.severity>=3?T.amber+'30':T.gold+'30'}`,
                }}>
                  S{f.severity} — {f.name}
                </div>
              ))}
            </div>
          </div>

          {/* Severity Stats + Flag Prevalence */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={card}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Flag Prevalence by Type</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={FLAG_TYPES.map(f => ({
                  name:f.name.length>22?f.name.slice(0,20)+'...':f.name,
                  count:COMPANIES.filter(c=>c.flags.includes(f.id)).length,
                  severity:f.severity,
                  fill:f.severity>=4?T.red:f.severity>=3?T.amber:T.gold,
                }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize:10, fill:T.textMut }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize:9, fill:T.textSec }} width={130} />
                  <Tooltip contentStyle={{ borderRadius:10, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:12 }}
                    formatter={(v) => [`${v} companies`,'Affected']} />
                  <Bar dataKey="count" radius={[0,4,4,0]}>
                    {FLAG_TYPES.map((f,i) => <Cell key={i} fill={f.severity>=4?T.red:f.severity>=3?T.amber:T.gold} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Severity Distribution</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[
                  { range:'0-5', count:flagHeatmap.filter(c=>c.totalSeverity<=5).length, fill:T.green },
                  { range:'6-10', count:flagHeatmap.filter(c=>c.totalSeverity>5&&c.totalSeverity<=10).length, fill:T.gold },
                  { range:'11-15', count:flagHeatmap.filter(c=>c.totalSeverity>10&&c.totalSeverity<=15).length, fill:T.amber },
                  { range:'16-20', count:flagHeatmap.filter(c=>c.totalSeverity>15&&c.totalSeverity<=20).length, fill:'#ea580c' },
                  { range:'21+', count:flagHeatmap.filter(c=>c.totalSeverity>20).length, fill:T.red },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize:11, fill:T.text }} label={{ value:'Severity Score', position:'insideBottom', offset:-5, fontSize:11, fill:T.textMut }} />
                  <YAxis tick={{ fontSize:11, fill:T.textMut }} />
                  <Tooltip contentStyle={{ borderRadius:10, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:12 }}
                    formatter={(v) => [`${v} companies`,'Count']} />
                  <Bar dataKey="count" radius={[6,6,0,0]}>
                    {['#16a34a','#c5a96a','#d97706','#ea580c','#dc2626'].map((c,i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginTop:12 }}>
                {[
                  { label:'Avg Flags/Company', value:(COMPANIES.reduce((a,c)=>a+c.flags.length,0)/COMPANIES.length).toFixed(1) },
                  { label:'Max Severity', value:Math.max(...flagHeatmap.map(c=>c.totalSeverity)) },
                  { label:'Clean Companies', value:flagHeatmap.filter(c=>c.totalSeverity===0).length },
                  { label:'Critical (S5 flags)', value:COMPANIES.filter(c=>c.flags.some(fid=>FLAG_TYPES[fid].severity===5)).length },
                ].map((s,i) => (
                  <div key={i} style={{ padding:8, background:T.surfaceH, borderRadius:8, textAlign:'center' }}>
                    <div style={{ fontSize:9, color:T.textMut, textTransform:'uppercase' }}>{s.label}</div>
                    <div style={{ fontSize:16, fontWeight:800, fontFamily:T.mono, color:T.navy }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <div style={card}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Company × Flag Heatmap</div>
            <div style={{ overflowX:'auto', maxHeight:480, overflowY:'auto' }}>
              <table style={{ borderCollapse:'collapse', fontSize:11, width:'100%', minWidth:900 }}>
                <thead>
                  <tr style={{ position:'sticky', top:0, background:T.surface, zIndex:2 }}>
                    <th style={{ padding:'6px 8px', textAlign:'left', color:T.textMut, minWidth:140, borderBottom:`2px solid ${T.border}` }}>Company</th>
                    <th style={{ padding:'6px 8px', textAlign:'center', color:T.textMut, borderBottom:`2px solid ${T.border}` }}>Grade</th>
                    {FLAG_TYPES.map(f => (
                      <th key={f.id} style={{
                        padding:'4px 6px', textAlign:'center', color:T.textMut, fontSize:9,
                        maxWidth:70, borderBottom:`2px solid ${T.border}`, writingMode:'vertical-lr', height:80,
                      }}>
                        {f.name}
                      </th>
                    ))}
                    <th style={{ padding:'6px 8px', textAlign:'right', color:T.textMut, borderBottom:`2px solid ${T.border}` }}>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {flagHeatmap.slice(0,50).map(c => (
                    <tr key={c.id} style={{
                      borderBottom:`1px solid ${T.border}`, cursor:'pointer',
                      background: flagCo===c.id?T.surfaceH:'transparent',
                    }} onClick={()=>setFlagCo(flagCo===c.id?null:c.id)}>
                      <td style={{ padding:'5px 8px', fontWeight:600, fontSize:11 }}>{c.name}</td>
                      <td style={{ padding:'5px 8px', textAlign:'center' }}>
                        <span style={badge(GRADE_COLORS[c.grade])}>{c.grade}</span>
                      </td>
                      {c.flags.map((hasFlag,fi) => (
                        <td key={fi} style={{
                          padding:3, textAlign:'center',
                          background: hasFlag ? (FLAG_TYPES[fi].severity>=4?T.red+'25':FLAG_TYPES[fi].severity>=3?T.amber+'25':T.gold+'18') : 'transparent',
                        }}>
                          {hasFlag ? <span style={{ fontSize:13 }}>&#9679;</span> : ''}
                        </td>
                      ))}
                      <td style={{
                        padding:'5px 8px', textAlign:'right', fontFamily:T.mono, fontWeight:700,
                        color: c.totalSeverity>15?T.red:c.totalSeverity>8?T.amber:T.text,
                      }}>
                        {c.totalSeverity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize:11, color:T.textMut, marginTop:8 }}>Showing top 50 by severity. Click a row for detailed analysis.</div>
          </div>

          {/* Detailed Flag Analysis */}
          {flagCo!==null && (() => {
            const c = COMPANIES[flagCo];
            const activeFlags = FLAG_TYPES.filter(f => c.flags.includes(f.id));
            const remediations = [
              'Set near-term SBTi-validated target for 2030 with annual milestones.',
              'Reduce brown CapEx below 30% within 2 years; publish transition CapEx plan.',
              'Align trade association memberships with stated climate positions; publish lobbying disclosure.',
              'Complete Scope 3 Category 1-15 mapping; set Scope 3 reduction target.',
              'Cap offsets at 10% of reduction pathway; prioritise direct abatement.',
              'Appoint board-level climate committee with quarterly reporting mandate.',
              'Implement internal carbon price at minimum $80/tCO2e for all investment decisions.',
              'Increase clean-tech R&D to 3%+ of revenue; publish innovation pipeline.',
              'Launch supplier engagement program targeting 60% of Scope 3 emissions by spend.',
              'Commission independent verification of climate marketing claims.',
            ];
            return (
              <div style={card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:17, fontWeight:700 }}>{c.name} — Flag Analysis</div>
                    <div style={{ fontSize:12, color:T.textSec }}>{c.sector} | Grade {c.grade} | ACT Score: {c.weighted}/20</div>
                  </div>
                  <div style={{ ...badge(activeFlags.length>4?T.red:activeFlags.length>2?T.amber:T.green), fontSize:13 }}>
                    {activeFlags.length} Active Flags
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                  {activeFlags.map(f => (
                    <div key={f.id} style={{
                      padding:14, borderRadius:10,
                      border:`1px solid ${f.severity>=4?T.red+'40':f.severity>=3?T.amber+'40':T.gold+'40'}`,
                      background: f.severity>=4?T.red+'08':f.severity>=3?T.amber+'08':T.gold+'08',
                    }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                        <span style={{ fontSize:13, fontWeight:700 }}>{f.name}</span>
                        <span style={{
                          ...badge(f.severity>=4?T.red:f.severity>=3?T.amber:T.gold), fontSize:10,
                        }}>Severity {f.severity}/5</span>
                      </div>
                      <div style={{ fontSize:12, color:T.textSec, lineHeight:1.5 }}>
                        <strong>Remediation:</strong> {remediations[f.id]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ════════ TAB 3: Sector Benchmarking ════════ */}
      {tab===3 && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:13, fontWeight:600 }}>Select Sector:</span>
            <select value={benchSector} onChange={e=>{setBenchSector(e.target.value);setPlanCo(null);}} style={select}>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={exportCSV} style={btn(false)}>
              Export Benchmark CSV
            </button>
            {csvMsg && <span style={{ fontSize:12, color:T.green, fontWeight:600 }}>{csvMsg}</span>}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {/* Sector Rankings */}
            <div style={card}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{benchSector} — Company Rankings</div>
              <div style={{ fontSize:12, color:T.textMut, marginBottom:14 }}>{sectorCos.length} companies</div>
              {(() => {
                const best = sectorCos[0];
                const worst = sectorCos[sectorCos.length-1];
                const avg = sectorCos.length ? (sectorCos.reduce((a,c)=>a+c.weighted,0)/sectorCos.length).toFixed(1) : 0;
                return (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
                    <div style={{ padding:10, background:T.green+'10', borderRadius:8, border:`1px solid ${T.green}30` }}>
                      <div style={{ fontSize:10, color:T.textMut }}>Best-in-Class</div>
                      <div style={{ fontSize:13, fontWeight:700, color:T.green }}>{best?.name||'—'}</div>
                      <div style={{ fontSize:15, fontWeight:800, fontFamily:T.mono }}>{best?.weighted||0}</div>
                    </div>
                    <div style={{ padding:10, background:T.surfaceH, borderRadius:8 }}>
                      <div style={{ fontSize:10, color:T.textMut }}>Sector Average</div>
                      <div style={{ fontSize:15, fontWeight:800, fontFamily:T.mono, color:T.navy }}>{avg}</div>
                    </div>
                    <div style={{ padding:10, background:T.red+'10', borderRadius:8, border:`1px solid ${T.red}30` }}>
                      <div style={{ fontSize:10, color:T.textMut }}>Worst</div>
                      <div style={{ fontSize:13, fontWeight:700, color:T.red }}>{worst?.name||'—'}</div>
                      <div style={{ fontSize:15, fontWeight:800, fontFamily:T.mono }}>{worst?.weighted||0}</div>
                    </div>
                  </div>
                );
              })()}
              <div style={{ maxHeight:320, overflowY:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ borderBottom:`2px solid ${T.border}` }}>
                      <th style={{ textAlign:'left', padding:'6px 8px', color:T.textMut }}>#</th>
                      <th style={{ textAlign:'left', padding:'6px 8px', color:T.textMut }}>Company</th>
                      <th style={{ textAlign:'right', padding:'6px 8px', color:T.textMut }}>Score</th>
                      <th style={{ textAlign:'center', padding:'6px 8px', color:T.textMut }}>Grade</th>
                      <th style={{ textAlign:'center', padding:'6px 8px', color:T.textMut }}>Plan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectorCos.map((c,ci) => (
                      <tr key={c.id} style={{ borderBottom:`1px solid ${T.border}` }}>
                        <td style={{ padding:'6px 8px', fontFamily:T.mono, color:T.textMut }}>{ci+1}</td>
                        <td style={{ padding:'6px 8px', fontWeight:600 }}>{c.name}</td>
                        <td style={{ padding:'6px 8px', textAlign:'right', fontFamily:T.mono, fontWeight:700 }}>{c.weighted}</td>
                        <td style={{ padding:'6px 8px', textAlign:'center' }}>
                          <span style={badge(GRADE_COLORS[c.grade])}>{c.grade}</span>
                        </td>
                        <td style={{ padding:'6px 8px', textAlign:'center' }}>
                          <button onClick={()=>setPlanCo(planCo===c.id?null:c.id)}
                            style={{
                              padding:'3px 10px', borderRadius:6, border:`1px solid ${T.border}`,
                              background: planCo===c.id?T.navy:T.surface, color: planCo===c.id?'#fff':T.navyL,
                              cursor:'pointer', fontSize:10, fontWeight:600, fontFamily:T.font,
                            }}>
                            {planCo===c.id ? 'Hide Plan' : 'Generate Plan'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Radar Overlay: Company vs Sector Avg */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div style={card}>
                <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>
                  Sector Radar — {benchSector}
                  {planCo!==null && ` vs ${COMPANIES[planCo].name}`}
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={DIMENSIONS.map((d,i) => ({
                    dim:d.label, sectorAvg:sectorAvg[i],
                    company:planCo!==null?COMPANIES[planCo].dimScores[i]:null,
                    best:sectorCos[0]?.dimScores[i]||0,
                  }))}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="dim" tick={{ fontSize:10, fill:T.textSec }} />
                    <PolarRadiusAxis domain={[0,20]} tick={{ fontSize:9, fill:T.textMut }} />
                    <Radar name="Sector Avg" dataKey="sectorAvg" stroke={T.gold} fill={T.gold} fillOpacity={0.15} strokeWidth={2} />
                    <Radar name="Best-in-Class" dataKey="best" stroke={T.green} fill={T.green} fillOpacity={0.08} strokeWidth={2} strokeDasharray="4 4" />
                    {planCo!==null && (
                      <Radar name={COMPANIES[planCo].name} dataKey="company" stroke={T.navy} fill={T.navy} fillOpacity={0.2} strokeWidth={2} />
                    )}
                    <Legend wrapperStyle={{ fontSize:11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Sector Grade Pie */}
              <div style={card}>
                <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Grade Composition — {benchSector}</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={GRADES.map(g => ({
                      name:`Grade ${g}`,
                      value:sectorCos.filter(c=>c.grade===g).length,
                    })).filter(d=>d.value>0)}
                      cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}
                      dataKey="value" label={({name,value})=>`${name}: ${value}`}
                      labelLine={{ stroke:T.textMut, strokeWidth:1 }}>
                      {GRADES.map((g,i) => <Cell key={i} fill={GRADE_COLORS[g]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius:10, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Sector Dimension Breakdown */}
          <div style={card}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Dimension Score Breakdown — {benchSector}</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={DIMENSIONS.map((d,i) => ({
                dim:d.label,
                avg:sectorAvg[i],
                best:sectorCos[0]?.dimScores[i]||0,
                worst:sectorCos[sectorCos.length-1]?.dimScores[i]||0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="dim" tick={{ fontSize:10, fill:T.textSec }} />
                <YAxis domain={[0,20]} tick={{ fontSize:11, fill:T.textMut }} />
                <Tooltip contentStyle={{ borderRadius:10, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:12 }} />
                <Legend wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="best" name="Best-in-Class" fill={T.green} radius={[4,4,0,0]} />
                <Bar dataKey="avg" name="Sector Average" fill={T.gold} radius={[4,4,0,0]} />
                <Bar dataKey="worst" name="Worst" fill={T.red} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8, marginTop:12 }}>
              {DIMENSIONS.map((d,i) => {
                const gapFromBest = sectorCos[0] ? Math.round((sectorCos[0].dimScores[i] - sectorAvg[i])*10)/10 : 0;
                return (
                  <div key={d.key} style={{ padding:8, background:T.surfaceH, borderRadius:8, textAlign:'center' }}>
                    <div style={{ fontSize:9, color:T.textMut, textTransform:'uppercase' }}>{d.label}</div>
                    <div style={{ fontSize:14, fontWeight:800, fontFamily:T.mono, color:T.navy }}>{sectorAvg[i]}</div>
                    <div style={{ fontSize:10, color:gapFromBest>3?T.red:T.green }}>
                      Gap: {gapFromBest>0?'+':''}{gapFromBest}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Improvement Roadmap */}
          {planCo!==null && (
            <div style={card}>
              <div style={{ fontSize:17, fontWeight:700, marginBottom:4 }}>
                Improvement Roadmap — {COMPANIES[planCo].name}
              </div>
              <div style={{ fontSize:12, color:T.textSec, marginBottom:16 }}>
                Current Grade: {renderGradeBadge(COMPANIES[planCo].grade)} | Score: {COMPANIES[planCo].weighted}/20 — Ranked by potential score impact
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:12 }}>
                {improvementPlan.map((ip,idx) => (
                  <div key={idx} style={{
                    display:'grid', gridTemplateColumns:'180px 1fr 100px 100px 80px',
                    alignItems:'center', gap:16, padding:14, borderRadius:10,
                    border:`1px solid ${T.border}`, background:idx===0?T.navy+'08':T.surface,
                  }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700 }}>{ip.dim}</div>
                      <div style={{ fontSize:11, color:T.textMut }}>Current: {ip.current.toFixed(1)}/20</div>
                    </div>
                    <div style={{ fontSize:12 }}>
                      <strong>Action:</strong> {ip.action}
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:10, color:T.textMut }}>Gap</div>
                      <div style={{ fontFamily:T.mono, fontWeight:800, fontSize:15, color:T.amber }}>{ip.gap}</div>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:10, color:T.textMut }}>Score Impact</div>
                      <div style={{ fontFamily:T.mono, fontWeight:800, fontSize:15, color:T.green }}>+{ip.impact}</div>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <span style={{
                        ...badge(ip.priority==='High'?T.red:ip.priority==='Medium'?T.amber:T.green),
                      }}>{ip.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop:16, padding:14, background:T.green+'10', borderRadius:10,
                border:`1px solid ${T.green}30`, fontSize:13,
              }}>
                <strong>Projected Maximum Score:</strong>{' '}
                <span style={{ fontFamily:T.mono, fontWeight:800, fontSize:16, color:T.green }}>
                  {(COMPANIES[planCo].weighted + improvementPlan.reduce((a,ip)=>a+ip.impact,0)).toFixed(1)}/20
                </span>
                {' '}(+{improvementPlan.reduce((a,ip)=>a+ip.impact,0).toFixed(1)} points if all improvements implemented)
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
