import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { SECTOR_BENCHMARKS } from '../../../data/referenceData';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',card:'#ffffff',cardH:'#f0ede7',sub:'#5c6b7e',indigo:'#4f46e5',blue:'#2563eb',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const SECTOR_COLORS = {
  'Power':         '#1b3a5c',
  'Transport':     '#2c5a8c',
  'Buildings':     '#5a8a6a',
  'Industry':      '#c5a96a',
  'Agriculture':   '#7ba67d',
  'Waste':         '#9aa3ae',
  'Land Use':      '#d4be8a',
  'Carbon Removal':'#dc2626',
};

const MEASURES = [
  // Power sector
  { id:1,  name:'Utility-Scale Solar PV',          sector:'Power',         potential:8.2,  mac:18,   trl:9, timeline:'near',   policy:'High' },
  { id:2,  name:'Onshore Wind',                    sector:'Power',         potential:5.8,  mac:22,   trl:9, timeline:'near',   policy:'High' },
  { id:3,  name:'Offshore Wind',                   sector:'Power',         potential:3.4,  mac:55,   trl:8, timeline:'medium', policy:'Medium' },
  { id:4,  name:'Grid-Scale Battery Storage',      sector:'Power',         potential:1.2,  mac:68,   trl:8, timeline:'medium', policy:'Medium' },
  { id:5,  name:'Nuclear Power (SMR)',              sector:'Power',         potential:2.1,  mac:105,  trl:6, timeline:'long',   policy:'Low' },
  // Transport
  { id:6,  name:'Electric Vehicle Adoption',       sector:'Transport',     potential:3.6,  mac:42,   trl:9, timeline:'near',   policy:'High' },
  { id:7,  name:'Public Transit Electrification',  sector:'Transport',     potential:1.4,  mac:28,   trl:8, timeline:'near',   policy:'High' },
  { id:8,  name:'Green Hydrogen Trucks',           sector:'Transport',     potential:0.9,  mac:185,  trl:5, timeline:'long',   policy:'Low' },
  { id:9,  name:'Aviation SAF Blending',           sector:'Transport',     potential:0.6,  mac:220,  trl:6, timeline:'medium', policy:'Medium' },
  { id:10, name:'Modal Shift Rail',                sector:'Transport',     potential:0.8,  mac:-12,  trl:9, timeline:'near',   policy:'Medium' },
  // Buildings
  { id:11, name:'LED Lighting Retrofit',           sector:'Buildings',     potential:0.8,  mac:-85,  trl:9, timeline:'near',   policy:'High' },
  { id:12, name:'Building Insulation',             sector:'Buildings',     potential:1.5,  mac:-45,  trl:9, timeline:'near',   policy:'High' },
  { id:13, name:'Heat Pump Deployment',            sector:'Buildings',     potential:2.2,  mac:35,   trl:9, timeline:'near',   policy:'High' },
  { id:14, name:'Smart Building Controls',         sector:'Buildings',     potential:0.6,  mac:-30,  trl:8, timeline:'near',   policy:'Medium' },
  { id:15, name:'Green Building Standards',        sector:'Buildings',     potential:0.9,  mac:15,   trl:8, timeline:'medium', policy:'Medium' },
  // Industry
  { id:16, name:'Industrial Energy Efficiency',    sector:'Industry',      potential:2.8,  mac:-55,  trl:9, timeline:'near',   policy:'Medium' },
  { id:17, name:'Green Steel (H2-DRI)',            sector:'Industry',      potential:1.6,  mac:148,  trl:6, timeline:'long',   policy:'Low' },
  { id:18, name:'Cement Carbon Capture (CCS)',     sector:'Industry',      potential:1.3,  mac:175,  trl:5, timeline:'long',   policy:'Low' },
  { id:19, name:'Industrial Heat Pumps',           sector:'Industry',      potential:0.7,  mac:62,   trl:7, timeline:'medium', policy:'Medium' },
  { id:20, name:'Chemical Process Optimisation',   sector:'Industry',      potential:0.5,  mac:-38,  trl:8, timeline:'near',   policy:'Low' },
  // Agriculture
  { id:21, name:'Precision Fertiliser Management', sector:'Agriculture',   potential:1.1,  mac:-22,  trl:8, timeline:'near',   policy:'Medium' },
  { id:22, name:'Methane Capture (Livestock)',     sector:'Agriculture',   potential:0.9,  mac:45,   trl:7, timeline:'medium', policy:'Low' },
  { id:23, name:'Regenerative Agriculture',        sector:'Agriculture',   potential:1.8,  mac:32,   trl:7, timeline:'medium', policy:'Medium' },
  { id:24, name:'Rice Paddy Water Management',     sector:'Agriculture',   potential:0.4,  mac:-8,   trl:8, timeline:'near',   policy:'Low' },
  // Waste
  { id:25, name:'Landfill Gas Capture',            sector:'Waste',         potential:0.6,  mac:-42,  trl:9, timeline:'near',   policy:'Medium' },
  { id:26, name:'Waste-to-Energy',                 sector:'Waste',         potential:0.4,  mac:25,   trl:8, timeline:'near',   policy:'Low' },
  { id:27, name:'Circular Economy (Plastics)',     sector:'Waste',         potential:0.3,  mac:-18,  trl:7, timeline:'medium', policy:'Medium' },
  // Land Use
  { id:28, name:'Reforestation & Afforestation',   sector:'Land Use',      potential:2.5,  mac:12,   trl:9, timeline:'medium', policy:'High' },
  { id:29, name:'Peatland Restoration',            sector:'Land Use',      potential:0.7,  mac:28,   trl:8, timeline:'medium', policy:'Medium' },
  // Carbon Removal
  { id:30, name:'Direct Air Capture (DAC)',        sector:'Carbon Removal', potential:0.3, mac:290,  trl:4, timeline:'long',   policy:'Low' },
];

const CARBON_PRICES = [
  { name:'RGGI',       price:15,  color:'#9aa3ae' },
  { name:'CA Cap',     price:30,  color:'#7ba67d' },
  { name:'EU ETS',     price:65,  color:'#2c5a8c' },
  { name:'IEA 1.5C',  price:130, color:'#c5a96a' },
  { name:'SCC',        price:185, color:'#dc2626' },
];

const SBTI_TARGET_GAP = 12.6; // GtCO2e/yr remaining gap

// ---- helper components ----

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: T.surface,
      borderRadius: 10,
      padding: '16px 20px',
      boxShadow: T.card,
      border: `1px solid ${T.border}`,
      flex: 1,
      minWidth: 160,
    }}>
      <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || T.navy, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', gap: 4, borderBottom:`2px solid ${T.border}`, marginBottom: 24, flexWrap:'wrap' }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 18px',
            fontSize: 13, fontWeight: 600,
            color: active === t.id ? T.navy : T.textSec,
            borderBottom: active === t.id ? `3px solid ${T.navy}` : '3px solid transparent',
            marginBottom: -2,
            fontFamily: T.font,
            transition: 'all 0.15s',
          }}
        >{t.label}</button>
      ))}
    </div>
  );
}

function SectorBadge({ sector }) {
  return (
    <span style={{
      background: SECTOR_COLORS[sector] + '20',
      color: SECTOR_COLORS[sector],
      border: `1px solid ${SECTOR_COLORS[sector]}40`,
      borderRadius: 4,
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 600,
    }}>{sector}</span>
  );
}

function TRLBadge({ trl }) {
  const color = trl >= 8 ? T.green : trl >= 6 ? T.amber : T.red;
  return (
    <span style={{
      background: color + '20',
      color: color,
      border: `1px solid ${color}40`,
      borderRadius: 4,
      padding: '2px 7px',
      fontSize: 11,
      fontWeight: 700,
    }}>TRL {trl}</span>
  );
}

function TimelineBadge({ timeline }) {
  const map = { near: { label:'Near-term', color: T.green }, medium: { label:'Medium', color: T.amber }, long: { label:'Long-term', color: T.red } };
  const cfg = map[timeline] || map['near'];
  return (
    <span style={{
      background: cfg.color + '18',
      color: cfg.color,
      borderRadius: 4,
      padding: '2px 7px',
      fontSize: 11,
      fontWeight: 600,
    }}>{cfg.label}</span>
  );
}

// ---- MACC Waterfall custom tooltip ----
function MACCTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0] && payload[0].payload;
  if (!d) return null;
  return (
    <div style={{
      background: T.surface, border:`1px solid ${T.border}`, borderRadius: 8,
      padding: '12px 16px', boxShadow: T.cardH, minWidth: 220, fontFamily: T.font,
    }}>
      <div style={{ fontWeight: 700, color: T.navy, marginBottom: 6, fontSize: 13 }}>{d.name}</div>
      <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}><SectorBadge sector={d.sector} /></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 12px', marginTop: 8 }}>
        <span style={{ fontSize: 11, color: T.textMut }}>MAC:</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: d.mac < 0 ? T.green : d.mac > 150 ? T.red : T.amber }}>
          {d.mac < 0 ? '' : '+'}{d.mac} $/tCO2e
        </span>
        <span style={{ fontSize: 11, color: T.textMut }}>Potential:</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{d.potential} GtCO2e/yr</span>
        <span style={{ fontSize: 11, color: T.textMut }}>TRL:</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{d.trl}/9</span>
        <span style={{ fontSize: 11, color: T.textMut }}>Timeline:</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{d.timeline}</span>
      </div>
    </div>
  );
}

// ---- Tab 1: MACC Visualisation ----
function MACCVisualisationTab({ measures, highlighted, onHighlight }) {
  const sorted = useMemo(() => [...measures].sort((a, b) => a.mac - b.mac), [measures]);

  // Build MACC bars: x position = cumulative potential, bar width = measure potential, height = mac
  // We represent this as a BarChart where each bar's "width" corresponds to potential
  // Using a simple approach: one entry per measure with value=mac
  const chartData = useMemo(() => {
    let cum = 0;
    return sorted.map(m => {
      const start = cum;
      cum += m.potential;
      return { ...m, cumStart: start, cumEnd: cum, midX: start + m.potential / 2 };
    });
  }, [sorted]);

  return (
    <div>
      <div style={{ marginBottom: 16, display:'flex', gap: 12, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ fontSize: 13, color: T.textSec }}>
          Measures ordered by marginal abatement cost. Bar width represents abatement potential (GtCO2e/yr). Negative cost = profitable.
        </div>
      </div>

      {/* Legend: carbon price references */}
      <div style={{ display:'flex', gap: 16, flexWrap:'wrap', marginBottom: 16 }}>
        {CARBON_PRICES.map(cp => (
          <div key={cp.name} style={{ display:'flex', alignItems:'center', gap: 6 }}>
            <div style={{ width: 24, height: 2, background: cp.color, borderRadius: 1 }} />
            <span style={{ fontSize: 11, color: T.textSec, fontWeight: 600 }}>{cp.name} ${cp.price}</span>
          </div>
        ))}
        <div style={{ display:'flex', alignItems:'center', gap: 6 }}>
          <div style={{ width: 16, height: 12, background: T.sage + '40', border:`1px solid ${T.sage}` }} />
          <span style={{ fontSize: 11, color: T.textSec }}>Profitable (negative cost)</span>
        </div>
      </div>

      <div style={{ background: T.surface, borderRadius: 12, padding: 20, boxShadow: T.card, border:`1px solid ${T.border}` }}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 80, left: 60 }}
            barCategoryGap={1}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: T.textMut, fontFamily: T.font }}
              angle={-55}
              textAnchor="end"
              interval={0}
              height={80}
            />
            <YAxis
              label={{ value: '$/tCO2e', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: T.textSec } }}
              tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.font }}
              domain={[-150, 310]}
            />
            <Tooltip content={<MACCTooltip />} />
            <ReferenceLine y={0} stroke={T.navy} strokeWidth={2} />
            {CARBON_PRICES.map(cp => (
              <ReferenceLine key={cp.name} y={cp.price} stroke={cp.color} strokeDasharray="6 3" strokeWidth={1.5}
                label={{ value: cp.name, position:'right', fontSize: 9, fill: cp.color }} />
            ))}
            <Bar dataKey="mac" name="Marginal Abatement Cost" onClick={(d) => onHighlight(d.id === highlighted ? null : d.id)}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.id === highlighted
                    ? T.gold
                    : entry.mac < 0
                    ? T.sage
                    : SECTOR_COLORS[entry.sector] || T.navy}
                  opacity={highlighted && entry.id !== highlighted ? 0.45 : 1}
                  stroke={entry.id === highlighted ? T.gold : 'none'}
                  strokeWidth={2}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 16, display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap: 8 }}>
        {Object.entries(SECTOR_COLORS).map(([sec, col]) => (
          <div key={sec} style={{ display:'flex', alignItems:'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: col }} />
            <span style={{ fontSize: 10, color: T.textSec }}>{sec}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Tab 2: Measure Library ----
function MeasureLibraryTab({ measures, highlighted, onHighlight }) {
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [timelineFilter, setTimelineFilter] = useState('All');
  const [sortKey, setSortKey] = useState('mac');
  const [sortDir, setSortDir] = useState(1);

  const sectors = ['All', ...Object.keys(SECTOR_COLORS)];
  const timelines = ['All', 'near', 'medium', 'long'];

  const filtered = useMemo(() => {
    let d = measures;
    if (search) d = d.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
    if (sectorFilter !== 'All') d = d.filter(m => m.sector === sectorFilter);
    if (timelineFilter !== 'All') d = d.filter(m => m.timeline === timelineFilter);
    d = [...d].sort((a, b) => sortDir * (a[sortKey] - b[sortKey]));
    return d;
  }, [measures, search, sectorFilter, timelineFilter, sortKey, sortDir]);

  const handleSort = key => {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(1); }
  };

  const thStyle = (key) => ({
    padding: '10px 12px',
    fontSize: 11,
    fontWeight: 700,
    color: T.textSec,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    borderBottom: `2px solid ${T.border}`,
    background: T.surfaceH,
    cursor: 'pointer',
    userSelect: 'none',
    textAlign: key === 'mac' || key === 'potential' || key === 'trl' ? 'right' : 'left',
    whiteSpace: 'nowrap',
  });

  return (
    <div>
      {/* Filters row */}
      <div style={{ display:'flex', gap: 12, flexWrap:'wrap', marginBottom: 20, alignItems:'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search measures..."
          style={{
            border:`1px solid ${T.border}`, borderRadius: 8, padding:'8px 14px',
            fontSize: 13, fontFamily: T.font, color: T.text, background: T.surface,
            outline: 'none', width: 220,
          }}
        />
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
          style={{ border:`1px solid ${T.border}`, borderRadius: 8, padding:'8px 12px', fontSize: 13, fontFamily: T.font, color: T.text, background: T.surface, outline:'none', cursor:'pointer' }}>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={timelineFilter} onChange={e => setTimelineFilter(e.target.value)}
          style={{ border:`1px solid ${T.border}`, borderRadius: 8, padding:'8px 12px', fontSize: 13, fontFamily: T.font, color: T.text, background: T.surface, outline:'none', cursor:'pointer' }}>
          {timelines.map(t => <option key={t} value={t}>{t === 'All' ? 'All Timelines' : t.charAt(0).toUpperCase() + t.slice(1) + '-term'}</option>)}
        </select>
        <div style={{ marginLeft:'auto', fontSize: 12, color: T.textMut }}>{filtered.length} of {measures.length} measures</div>
      </div>

      <div style={{ background: T.surface, borderRadius: 12, boxShadow: T.card, border:`1px solid ${T.border}`, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontFamily: T.font }}>
            <thead>
              <tr>
                <th style={thStyle('name')} onClick={() => handleSort('name')}>Measure</th>
                <th style={thStyle('sector')} onClick={() => handleSort('sector')}>Sector</th>
                <th style={{ ...thStyle('mac'), textAlign:'right' }} onClick={() => handleSort('mac')}>MAC $/tCO2e {sortKey==='mac' ? (sortDir===1?'▲':'▼') : ''}</th>
                <th style={{ ...thStyle('potential'), textAlign:'right' }} onClick={() => handleSort('potential')}>Potential GtCO2e/yr {sortKey==='potential' ? (sortDir===1?'▲':'▼') : ''}</th>
                <th style={thStyle('trl')} onClick={() => handleSort('trl')}>TRL</th>
                <th style={thStyle('timeline')}>Timeline</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr
                  key={m.id}
                  onClick={() => onHighlight(m.id === highlighted ? null : m.id)}
                  style={{
                    background: m.id === highlighted ? T.navy + '08' : i % 2 === 0 ? T.surface : T.surfaceH,
                    borderLeft: m.id === highlighted ? `3px solid ${T.gold}` : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  <td style={{ padding:'11px 12px', fontSize: 13, color: T.text, fontWeight: m.id === highlighted ? 700 : 400 }}>{m.name}</td>
                  <td style={{ padding:'11px 12px' }}><SectorBadge sector={m.sector} /></td>
                  <td style={{ padding:'11px 12px', textAlign:'right', fontSize: 13, fontWeight: 700, color: m.mac < 0 ? T.green : m.mac > 150 ? T.red : T.amber }}>
                    {m.mac < 0 ? '' : '+'}{m.mac}
                  </td>
                  <td style={{ padding:'11px 12px', textAlign:'right', fontSize: 13, color: T.navy, fontWeight: 600 }}>{m.potential.toFixed(1)}</td>
                  <td style={{ padding:'11px 12px' }}><TRLBadge trl={m.trl} /></td>
                  <td style={{ padding:'11px 12px' }}><TimelineBadge timeline={m.timeline} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- Tab 3: Sector Comparison ----
function SectorComparisonTab({ measures }) {
  const sectorStats = useMemo(() => {
    const map = {};
    measures.forEach(m => {
      if (!map[m.sector]) map[m.sector] = { sector: m.sector, totalPotential: 0, totalCost: 0, count: 0, trlSum: 0, negCount: 0 };
      map[m.sector].totalPotential += m.potential;
      map[m.sector].totalCost += m.mac * m.potential;
      map[m.sector].count += 1;
      map[m.sector].trlSum += m.trl;
      if (m.mac < 0) map[m.sector].negCount += 1;
    });
    return Object.values(map).map(s => ({
      ...s,
      weightedMAC: s.totalPotential > 0 ? Math.round(s.totalCost / s.totalPotential) : 0,
      avgTRL: Math.round((s.trlSum / s.count) * 10) / 10,
    })).sort((a, b) => b.totalPotential - a.totalPotential);
  }, [measures]);

  const radarData = useMemo(() => sectorStats.map(s => ({
    sector: s.sector.length > 10 ? s.sector.split(' ')[0] : s.sector,
    Potential: Math.round((s.totalPotential / 10) * 100),
    CostEfficiency: Math.max(0, Math.round(((300 - s.weightedMAC) / 450) * 100)),
    TRL: Math.round((s.avgTRL / 9) * 100),
    Speed: s.sector === 'Power' || s.sector === 'Buildings' ? 90 : s.sector === 'Carbon Removal' ? 20 : 55,
    PolicySupport: measures.filter(m => m.sector === s.sector && m.policy === 'High').length * 25,
  })), [sectorStats, measures]);

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 20 }}>
        {/* Total abatement potential by sector */}
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, boxShadow: T.card, border:`1px solid ${T.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Total Abatement Potential by Sector</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sectorStats} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} label={{ value:'GtCO2e/yr', position:'insideBottom', offset:-5, fontSize:11, fill:T.textSec }} />
              <YAxis type="category" dataKey="sector" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.font }} width={110} />
              <Tooltip formatter={(v) => [v.toFixed(1) + ' GtCO2e/yr', 'Potential']} />
              <Bar dataKey="totalPotential" radius={[0,4,4,0]}>
                {sectorStats.map((s, i) => <Cell key={i} fill={SECTOR_COLORS[s.sector] || T.navy} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weighted average MAC by sector */}
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, boxShadow: T.card, border:`1px solid ${T.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Weighted Average MAC by Sector ($/tCO2e)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sectorStats} layout="vertical" margin={{ left: 10, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} domain={[-60, 300]} />
              <YAxis type="category" dataKey="sector" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.font }} width={110} />
              <ReferenceLine x={0} stroke={T.navy} strokeWidth={1.5} />
              <Tooltip formatter={(v) => ['$' + v + '/tCO2e', 'Weighted MAC']} />
              <Bar dataKey="weightedMAC" radius={[0,4,4,0]}>
                {sectorStats.map((s, i) => (
                  <Cell key={i} fill={s.weightedMAC < 0 ? T.sage : s.weightedMAC > 100 ? T.red : T.amber} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar chart */}
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, boxShadow: T.card, border:`1px solid ${T.border}`, gridColumn:'1 / -1' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Sector Attribute Radar (normalised 0-100)</div>
          <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>Potential · Cost Efficiency · TRL · Speed to Scale · Policy Support</div>
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={radarData} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="sector" tick={{ fontSize: 11, fill: T.textSec, fontFamily: T.font }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: T.textMut }} />
              <Radar name="Potential" dataKey="Potential" stroke={T.navy} fill={T.navy} fillOpacity={0.12} />
              <Radar name="CostEfficiency" dataKey="CostEfficiency" stroke={T.sage} fill={T.sage} fillOpacity={0.12} />
              <Radar name="TRL" dataKey="TRL" stroke={T.gold} fill={T.gold} fillOpacity={0.12} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: T.font }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ---- Tab 4: Carbon Price Scenarios ----
function CarbonPriceScenariosTab({ measures }) {
  const scenarioPrices = [0, 15, 30, 50, 65, 80, 100, 130, 150, 185, 200, 250];

  const viabilityData = useMemo(() => scenarioPrices.map(price => {
    const viable = measures.filter(m => m.mac <= price);
    const totalPotential = viable.reduce((s, m) => s + m.potential, 0);
    return { price, count: viable.length, potential: Math.round(totalPotential * 10) / 10 };
  }), [measures]);

  const spotScenarios = [
    { label:'$50/tCO2e', price:50 },
    { label:'$100/tCO2e', price:100 },
    { label:'$150/tCO2e', price:150 },
    { label:'$200/tCO2e', price:200 },
  ];

  return (
    <div>
      {/* Scenario cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {spotScenarios.map(sc => {
          const viable = measures.filter(m => m.mac <= sc.price);
          const totalPot = viable.reduce((s, m) => s + m.potential, 0);
          const pct = Math.round((viable.length / (measures.length || 1)) * 100);
          return (
            <div key={sc.label} style={{ background: T.surface, borderRadius: 10, padding: '16px 18px', boxShadow: T.card, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.gold, marginBottom: 6 }}>{sc.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>{viable.length}<span style={{ fontSize: 13, fontWeight: 400, color: T.textSec }}> / 30</span></div>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 8 }}>Measures viable ({pct}%)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.sage }}>{totalPot.toFixed(1)} <span style={{ fontSize: 11, fontWeight: 400 }}>GtCO2e/yr</span></div>
              <div style={{ fontSize: 11, color: T.textMut }}>Total viable abatement</div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 20 }}>
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, boxShadow: T.card, border:`1px solid ${T.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Cumulative Viable Abatement vs. Carbon Price</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={viabilityData} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="price" tick={{ fontSize: 11, fill: T.textSec }} label={{ value:'Carbon Price ($/tCO2e)', position:'insideBottom', offset:-10, fontSize:11, fill:T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} label={{ value:'GtCO2e/yr', angle:-90, position:'insideLeft', fontSize:11, fill:T.textSec }} />
              {CARBON_PRICES.map(cp => (
                <ReferenceLine key={cp.name} x={cp.price} stroke={cp.color} strokeDasharray="5 3" strokeWidth={1.5}
                  label={{ value:cp.name, position:'top', fontSize:9, fill:cp.color }} />
              ))}
              <Tooltip formatter={(v, name) => [name === 'potential' ? v + ' GtCO2e/yr' : v + ' measures', name]} />
              <Line type="monotone" dataKey="potential" name="Viable Abatement" stroke={T.sage} strokeWidth={2.5} dot={{ r:3, fill:T.sage }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.surface, borderRadius: 12, padding: 20, boxShadow: T.card, border:`1px solid ${T.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Number of Viable Measures vs. Carbon Price</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={viabilityData} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="price" tick={{ fontSize: 11, fill: T.textSec }} label={{ value:'Carbon Price ($/tCO2e)', position:'insideBottom', offset:-10, fontSize:11, fill:T.textSec }} />
              <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 30]} />
              {CARBON_PRICES.map(cp => (
                <ReferenceLine key={cp.name} x={cp.price} stroke={cp.color} strokeDasharray="5 3" strokeWidth={1.5} />
              ))}
              <Tooltip formatter={(v) => [v + ' measures', 'Viable Count']} />
              <Line type="stepAfter" dataKey="count" name="Viable Measures" stroke={T.navy} strokeWidth={2.5} dot={{ r:3, fill:T.navy }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reference prices legend */}
      <div style={{ marginTop: 16, display:'flex', gap: 20, flexWrap:'wrap' }}>
        {CARBON_PRICES.map(cp => (
          <div key={cp.name} style={{ display:'flex', alignItems:'center', gap: 8 }}>
            <div style={{ width: 20, height: 2, background: cp.color }} />
            <span style={{ fontSize: 12, color: T.textSec }}><b>{cp.name}</b> — ${cp.price}/tCO2e</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Tab 5: Portfolio Builder ----
function PortfolioBuilderTab({ measures }) {
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');

  const toggle = id => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const portfolio = measures.filter(m => selected.has(m.id));
  const totalPotential = portfolio.reduce((s, m) => s + m.potential, 0);
  const totalCost = portfolio.reduce((s, m) => s + m.mac * m.potential, 0);
  const portfolioMAC = totalPotential > 0 ? Math.round(totalCost / totalPotential) : 0;
  const sbtiGap = SBTI_TARGET_GAP;
  const sbtiCoverage = Math.min(100, Math.round((totalPotential / sbtiGap) * 100));

  const filtered = useMemo(() => {
    let d = measures;
    if (search) d = d.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
    return d;
  }, [measures, search]);

  return (
    <div>
      {/* Portfolio summary bar */}
      <div style={{ background: T.navy, borderRadius: 12, padding: '18px 24px', marginBottom: 24, display:'flex', gap: 32, flexWrap:'wrap', alignItems:'center' }}>
        <div>
          <div style={{ fontSize: 10, color: T.goldL, fontWeight: 600, textTransform:'uppercase', letterSpacing:0.8, marginBottom: 4 }}>Portfolio Abatement</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{totalPotential.toFixed(1)} <span style={{ fontSize: 14, fontWeight: 400 }}>GtCO2e/yr</span></div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: T.goldL, fontWeight: 600, textTransform:'uppercase', letterSpacing:0.8, marginBottom: 4 }}>Portfolio MAC</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: portfolioMAC < 0 ? '#4ade80' : portfolioMAC > 100 ? '#f87171' : '#fbbf24' }}>
            {portfolioMAC >= 0 ? '+' : ''}{portfolioMAC} <span style={{ fontSize: 14, fontWeight: 400 }}>$/tCO2e</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: T.goldL, fontWeight: 600, textTransform:'uppercase', letterSpacing:0.8, marginBottom: 4 }}>Measures Selected</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{selected.size} <span style={{ fontSize: 14, fontWeight: 400 }}>of 30</span></div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 10, color: T.goldL, fontWeight: 600, textTransform:'uppercase', letterSpacing:0.8, marginBottom: 6 }}>
            SBTi Target Gap Coverage ({sbtiCoverage}%)
          </div>
          <div style={{ background:'rgba(255,255,255,0.15)', borderRadius: 6, height: 12, overflow:'hidden' }}>
            <div style={{
              height:'100%', width: sbtiCoverage + '%',
              background: sbtiCoverage >= 100 ? '#4ade80' : sbtiCoverage >= 50 ? '#fbbf24' : '#f87171',
              borderRadius: 6, transition:'width 0.3s ease',
            }} />
          </div>
          <div style={{ fontSize: 11, color:'rgba(255,255,255,0.6)', marginTop: 4 }}>
            {totalPotential.toFixed(1)} / {sbtiGap} GtCO2e/yr gap
          </div>
        </div>
        <button
          onClick={() => setSelected(new Set())}
          style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.3)', borderRadius: 8, color:'#fff', padding:'8px 16px', fontSize: 12, cursor:'pointer', fontFamily: T.font }}
        >Clear All</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap: 20, alignItems:'start' }}>
        {/* Measure picker */}
        <div style={{ background: T.surface, borderRadius: 12, boxShadow: T.card, border:`1px solid ${T.border}`, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:`1px solid ${T.border}`, display:'flex', gap: 12, alignItems:'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>Select Measures</div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter..."
              style={{
                marginLeft:'auto', border:`1px solid ${T.border}`, borderRadius: 6, padding:'6px 10px',
                fontSize: 12, fontFamily: T.font, color: T.text, background: T.surfaceH, outline:'none', width: 160,
              }}
            />
          </div>
          <div style={{ maxHeight: 450, overflowY:'auto' }}>
            {filtered.map((m, i) => {
              const isSelected = selected.has(m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => toggle(m.id)}
                  style={{
                    display:'flex', alignItems:'center', gap: 12,
                    padding:'10px 18px',
                    background: isSelected ? T.navy + '08' : i % 2 === 0 ? T.surface : T.surfaceH,
                    borderLeft: isSelected ? `3px solid ${T.gold}` : '3px solid transparent',
                    cursor:'pointer', transition:'all 0.12s',
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: `2px solid ${isSelected ? T.gold : T.border}`,
                    background: isSelected ? T.gold : 'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    flexShrink: 0,
                  }}>
                    {isSelected && <span style={{ color:'#fff', fontSize: 12, fontWeight: 800, lineHeight: 1 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: T.text, fontWeight: isSelected ? 600 : 400, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: T.textMut }}>{m.sector}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: m.mac < 0 ? T.green : m.mac > 150 ? T.red : T.amber }}>
                      {m.mac >= 0 ? '+' : ''}{m.mac} $/t
                    </div>
                    <div style={{ fontSize: 11, color: T.textMut }}>{m.potential.toFixed(1)} Gt</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Portfolio composition */}
        <div>
          <div style={{ background: T.surface, borderRadius: 12, boxShadow: T.card, border:`1px solid ${T.border}`, overflow:'hidden', marginBottom: 16 }}>
            <div style={{ padding:'14px 18px', borderBottom:`1px solid ${T.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>Portfolio Composition</div>
            </div>
            <div style={{ padding:'12px 18px' }}>
              {portfolio.length === 0 ? (
                <div style={{ textAlign:'center', padding:'24px 0', color: T.textMut, fontSize: 13 }}>No measures selected yet</div>
              ) : (
                portfolio.sort((a, b) => a.mac - b.mac).map(m => (
                  <div key={m.id} style={{ display:'flex', alignItems:'center', gap: 10, padding:'8px 0', borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: SECTOR_COLORS[m.sector], flexShrink:0 }} />
                    <div style={{ flex: 1, fontSize: 12, color: T.text, minWidth: 0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.name}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: m.mac < 0 ? T.green : m.mac > 100 ? T.red : T.amber, flexShrink:0 }}>
                      {m.mac >= 0 ? '+' : ''}{m.mac}
                    </div>
                    <button onClick={e => { e.stopPropagation(); toggle(m.id); }} style={{ background:'none', border:'none', color: T.textMut, cursor:'pointer', fontSize: 14, padding:'0 2px', lineHeight:1 }}>×</button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sector breakdown of portfolio */}
          {portfolio.length > 0 && (() => {
            const sMap = {};
            portfolio.forEach(m => { sMap[m.sector] = (sMap[m.sector] || 0) + m.potential; });
            const entries = Object.entries(sMap).sort((a, b) => b[1] - a[1]);
            return (
              <div style={{ background: T.surface, borderRadius: 12, boxShadow: T.card, border:`1px solid ${T.border}`, padding:'14px 18px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, marginBottom: 12 }}>By Sector (GtCO2e/yr)</div>
                {entries.map(([sec, pot]) => (
                  <div key={sec} style={{ marginBottom: 8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.textSec }}>{sec}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{pot.toFixed(1)}</span>
                    </div>
                    <div style={{ background: T.border, borderRadius: 4, height: 6 }}>
                      <div style={{ width: Math.round((pot / (totalPotential || 1)) * 100) + '%', height:'100%', background: SECTOR_COLORS[sec], borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function AbatementCostCurvePage() {
  const [activeTab, setActiveTab] = useState('macc');
  const [highlighted, setHighlighted] = useState(null);

  const tabs = [
    { id:'macc',     label:'MACC Visualisation' },
    { id:'library',  label:'Measure Library' },
    { id:'sectors',  label:'Sector Comparison' },
    { id:'scenarios',label:'Carbon Price Scenarios' },
    { id:'portfolio',label:'Portfolio Builder' },
  ];

  const negativeMACCount = MEASURES.filter(m => m.mac < 0).length;
  const avgNegMAC = negativeMACCount ? Math.round(MEASURES.filter(m => m.mac < 0).reduce((s, m) => s + m.mac, 0) / negativeMACCount) : 0;
  const viable100 = MEASURES.filter(m => m.mac <= 100).length;
  const lowestMAC = MEASURES.reduce((a, b) => a.mac < b.mac ? a : b);
  const highestPotential = MEASURES.reduce((a, b) => a.potential > b.potential ? a : b);

  return (
    <div style={{ background: T.bg, minHeight:'100vh', fontFamily: T.font, padding: 0 }}>
      {/* Header */}
      <div style={{ background: T.navy, padding:'28px 40px 24px', color:'#fff' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap: 16 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 8 }}>
              <span style={{ background: T.gold + '30', color: T.goldL, border:`1px solid ${T.gold}40`, borderRadius: 6, padding:'3px 10px', fontSize: 11, fontWeight: 700 }}>EP-AI3</span>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>/abatement-cost-curve</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color:'#fff', letterSpacing:-0.5 }}>Marginal Abatement Cost Curve Builder</h1>
            <p style={{ margin:'8px 0 0', fontSize: 14, color:'rgba(255,255,255,0.65)', maxWidth: 600 }}>
              McKinsey-style MACC analysis for corporate and sector-level decarbonisation. 30 measures across 8 sectors. Identify cost-effective pathways to net zero.
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
            <div style={{ background:'rgba(255,255,255,0.08)', borderRadius: 8, padding:'8px 14px', textAlign:'center' }}>
              <div style={{ fontSize: 10, color: T.goldL, fontWeight: 600, letterSpacing:0.8, marginBottom: 2 }}>GLOBAL POTENTIAL</div>
              <div style={{ fontSize: 18, fontWeight: 800, color:'#fff' }}>38.4 GtCO2e/yr</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:'28px 40px' }}>
        {/* KPI row */}
        <div style={{ display:'flex', gap: 14, flexWrap:'wrap', marginBottom: 32 }}>
          <KpiCard
            label="Total Technical Potential"
            value="38.4 GtCO2e"
            sub="per year, global"
            color={T.navy}
          />
          <KpiCard
            label="Profitable Measures (neg. MAC)"
            value={String(negativeMACCount)}
            sub={`Avg saving: $${Math.abs(avgNegMAC)}/tCO2e`}
            color={T.green}
          />
          <KpiCard
            label="Viable at $100/tCO2e"
            value={`${viable100} / 30`}
            sub={`${Math.round((viable100 / 30) * 100)}% of all measures`}
            color={T.amber}
          />
          <KpiCard
            label="Lowest Cost Measure"
            value={`$${lowestMAC.mac}/tCO2e`}
            sub={`${lowestMAC.name} (${lowestMAC.potential} Gt)`}
            color={T.green}
          />
          <KpiCard
            label="Highest Potential Measure"
            value={`${highestPotential.potential} GtCO2e`}
            sub={`${highestPotential.name} ($${highestPotential.mac}/t)`}
            color={T.navyL}
          />
        </div>

        {/* Tabs */}
        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'macc' && (
          <MACCVisualisationTab measures={MEASURES} highlighted={highlighted} onHighlight={setHighlighted} />
        )}
        {activeTab === 'library' && (
          <MeasureLibraryTab measures={MEASURES} highlighted={highlighted} onHighlight={setHighlighted} />
        )}
        {activeTab === 'sectors' && (
          <SectorComparisonTab measures={MEASURES} />
        )}
        {activeTab === 'scenarios' && (
          <CarbonPriceScenariosTab measures={MEASURES} />
        )}
        {activeTab === 'portfolio' && (
          <PortfolioBuilderTab measures={MEASURES} />
        )}

        {/* Footer note */}
        <div style={{ marginTop: 36, padding:'14px 20px', background: T.surface, borderRadius: 10, border:`1px solid ${T.border}`, display:'flex', gap: 16, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ fontSize: 11, color: T.textMut }}>
            <b style={{ color: T.textSec }}>Data sources:</b> IEA World Energy Outlook 2024 · IPCC AR6 WG3 · McKinsey Global GHG Abatement Cost Curve · Project Drawdown 2023
          </div>
          <div style={{ marginLeft:'auto', fontSize: 11, color: T.textMut }}>
            All cost estimates in 2024 USD. Potentials represent technically achievable global annual reductions by 2030-2050.
          </div>
        </div>
      </div>
    </div>
  );
}
