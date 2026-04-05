import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine, ZAxis
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const TIER_COLORS = { 1: T.navy, 2: T.blue, 3: T.teal };
const CATEGORIES = ['Drilling & Well Services','Pipeline Equipment','Refining Catalysts','Turbine/Rotating Equip','EPC/Construction','Chemicals & Additives','Safety & PPE','IT & Digital','Marine & Logistics','Environmental Services'];

const SUPPLIERS = [
  { id:'S01', name:'Schlumberger (SLB)', tier:1, cat:'Drilling & Well Services', country:'USA', spend:820, score:58, critical:true, plan:'Submitted' },
  { id:'S02', name:'Halliburton', tier:1, cat:'Drilling & Well Services', country:'USA', spend:640, score:45, critical:true, plan:'In Progress' },
  { id:'S03', name:'Baker Hughes', tier:1, cat:'Turbine/Rotating Equip', country:'USA', spend:580, score:62, critical:true, plan:'Submitted' },
  { id:'S04', name:'TechnipFMC', tier:1, cat:'EPC/Construction', country:'UK', spend:920, score:55, critical:true, plan:'Submitted' },
  { id:'S05', name:'Saipem', tier:1, cat:'EPC/Construction', country:'Italy', spend:450, score:48, critical:false, plan:'In Progress' },
  { id:'S06', name:'Siemens Energy', tier:1, cat:'Turbine/Rotating Equip', country:'Germany', spend:380, score:72, critical:true, plan:'Approved' },
  { id:'S07', name:'NOV Inc.', tier:1, cat:'Drilling & Well Services', country:'USA', spend:320, score:42, critical:true, plan:'Not Requested' },
  { id:'S08', name:'Wood Group', tier:1, cat:'EPC/Construction', country:'UK', spend:290, score:51, critical:false, plan:'In Progress' },
  { id:'S09', name:'BASF Catalysts', tier:1, cat:'Refining Catalysts', country:'Germany', spend:210, score:68, critical:true, plan:'Approved' },
  { id:'S10', name:'Honeywell UOP', tier:1, cat:'Refining Catalysts', country:'USA', spend:185, score:65, critical:true, plan:'Submitted' },
  { id:'S11', name:'Tenaris', tier:2, cat:'Pipeline Equipment', country:'Argentina', spend:145, score:40, critical:false, plan:'Not Requested' },
  { id:'S12', name:'Vallourec', tier:2, cat:'Pipeline Equipment', country:'France', spend:130, score:44, critical:false, plan:'In Progress' },
  { id:'S13', name:'Dow Chemical', tier:2, cat:'Chemicals & Additives', country:'USA', spend:110, score:61, critical:false, plan:'Submitted' },
  { id:'S14', name:'Emerson Electric', tier:2, cat:'IT & Digital', country:'USA', spend:95, score:59, critical:false, plan:'Submitted' },
  { id:'S15', name:'ABB', tier:2, cat:'IT & Digital', country:'Switzerland', spend:88, score:70, critical:false, plan:'Approved' },
  { id:'S16', name:'Hunting PLC', tier:2, cat:'Drilling & Well Services', country:'UK', spend:78, score:38, critical:false, plan:'Not Requested' },
  { id:'S17', name:'Forum Energy', tier:2, cat:'Pipeline Equipment', country:'UK', spend:72, score:35, critical:false, plan:'Not Requested' },
  { id:'S18', name:'Nalco Champion', tier:2, cat:'Chemicals & Additives', country:'USA', spend:68, score:52, critical:false, plan:'In Progress' },
  { id:'S19', name:'Dresser-Rand', tier:2, cat:'Turbine/Rotating Equip', country:'USA', spend:65, score:48, critical:false, plan:'In Progress' },
  { id:'S20', name:'SGS', tier:2, cat:'Environmental Services', country:'Switzerland', spend:55, score:74, critical:false, plan:'Approved' },
  { id:'S21', name:'Bureau Veritas', tier:2, cat:'Environmental Services', country:'France', spend:52, score:71, critical:false, plan:'Approved' },
  { id:'S22', name:'Worley', tier:2, cat:'EPC/Construction', country:'Australia', spend:85, score:56, critical:false, plan:'Submitted' },
  { id:'S23', name:'Intertek', tier:2, cat:'Safety & PPE', country:'UK', spend:42, score:64, critical:false, plan:'Submitted' },
  { id:'S24', name:'Draeger', tier:2, cat:'Safety & PPE', country:'Germany', spend:38, score:66, critical:false, plan:'Approved' },
  { id:'S25', name:'Boskalis', tier:2, cat:'Marine & Logistics', country:'Netherlands', spend:62, score:50, critical:false, plan:'In Progress' },
  { id:'S26', name:'Mammoet', tier:3, cat:'Marine & Logistics', country:'Netherlands', spend:28, score:45, critical:false, plan:'Not Requested' },
  { id:'S27', name:'China Oilfield Services', tier:3, cat:'Drilling & Well Services', country:'China', spend:35, score:22, critical:false, plan:'Not Requested' },
  { id:'S28', name:'Sinopec Engineering', tier:3, cat:'EPC/Construction', country:'China', spend:42, score:25, critical:false, plan:'Not Requested' },
  { id:'S29', name:'Larsen & Toubro', tier:3, cat:'EPC/Construction', country:'India', spend:38, score:35, critical:false, plan:'In Progress' },
  { id:'S30', name:'Petrofac', tier:3, cat:'EPC/Construction', country:'UAE', spend:32, score:42, critical:false, plan:'In Progress' },
  { id:'S31', name:'Aker Solutions', tier:3, cat:'Pipeline Equipment', country:'Norway', spend:28, score:68, critical:false, plan:'Approved' },
  { id:'S32', name:'Kent PLC', tier:3, cat:'EPC/Construction', country:'UK', spend:22, score:48, critical:false, plan:'In Progress' },
  { id:'S33', name:'Matrix Service', tier:3, cat:'Pipeline Equipment', country:'USA', spend:18, score:32, critical:false, plan:'Not Requested' },
  { id:'S34', name:'ENGI', tier:3, cat:'IT & Digital', country:'India', spend:15, score:40, critical:false, plan:'Not Requested' },
  { id:'S35', name:'CG Power', tier:3, cat:'Turbine/Rotating Equip', country:'India', spend:12, score:28, critical:false, plan:'Not Requested' },
  { id:'S36', name:'Arabian Drilling', tier:3, cat:'Drilling & Well Services', country:'Saudi Arabia', spend:25, score:30, critical:false, plan:'Not Requested' },
  { id:'S37', name:'Gulf Marine Services', tier:3, cat:'Marine & Logistics', country:'UAE', spend:20, score:35, critical:false, plan:'Not Requested' },
  { id:'S38', name:'Helix Energy', tier:3, cat:'Marine & Logistics', country:'USA', spend:18, score:42, critical:false, plan:'In Progress' },
  { id:'S39', name:'Newpark Resources', tier:3, cat:'Chemicals & Additives', country:'USA', spend:14, score:38, critical:false, plan:'Not Requested' },
  { id:'S40', name:'Core Lab', tier:3, cat:'Environmental Services', country:'USA', spend:12, score:55, critical:false, plan:'Submitted' },
];

const PLAN_COLORS = { 'Approved': T.green, 'Submitted': T.blue, 'In Progress': T.amber, 'Not Requested': T.red };
const TABS = ['Supplier Dashboard','Tier 1 Detail','Tier 2 & 3 Map','Concentration Risk','Critical Dependencies','Engagement Tracker'];

export default function EnergySupplierNetworkPage() {
  const [tab, setTab] = useState(0);
  const [tierFilter, setTierFilter] = useState('All');

  const filtered = useMemo(() => tierFilter === 'All' ? SUPPLIERS : SUPPLIERS.filter(s => s.tier === +tierFilter), [tierFilter]);
  const totalSpend = SUPPLIERS.reduce((s, x) => s + x.spend, 0);
  const avgScore = Math.round(SUPPLIERS.reduce((s, x) => s + x.score, 0) / SUPPLIERS.length);
  const criticals = SUPPLIERS.filter(s => s.critical);

  const catConc = useMemo(() => {
    const map = {};
    SUPPLIERS.forEach(s => { if (!map[s.cat]) map[s.cat] = []; map[s.cat].push(s.spend); });
    return Object.entries(map).map(([cat, spends]) => {
      const total = spends.reduce((a, b) => a + b, 0);
      const hhi = Math.round(spends.reduce((a, s) => a + Math.pow(s / total * 100, 2), 0));
      return { cat, total, hhi, count: spends.length };
    }).sort((a, b) => b.hhi - a.hhi);
  }, []);

  const planStatus = useMemo(() => {
    const map = {};
    SUPPLIERS.forEach(s => { map[s.plan] = (map[s.plan] || 0) + 1; });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, []);

  const card = (label, value, sub, color = T.navy) => (
    <div style={{ background: T.surface, borderRadius: 10, padding: '14px 18px', border: `1px solid ${T.border}`, flex: '1 1 150px' }}>
      <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ background: T.navy, color: '#fff', fontFamily: T.mono, fontSize: 11, padding: '3px 10px', borderRadius: 6 }}>EP-CU3</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0 }}>Supplier Network Transition Scorer</h1>
      </div>
      <p style={{ color: T.textSec, fontSize: 13, marginBottom: 16 }}>
        40 suppliers across 3 tiers with transition scoring, concentration risk, and engagement tracking.
        <span style={{ fontFamily: T.mono, marginLeft: 8, fontSize: 11, color: T.textMut }}>Source: CDP Supply Chain | GRESB | Company procurement data</span>
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {card('Total Suppliers', SUPPLIERS.length, '10 Tier 1 | 15 Tier 2 | 15 Tier 3')}
        {card('Total Spend', `$${(totalSpend / 1000).toFixed(1)}B`, 'Annual procurement')}
        {card('Avg Transition Score', `${avgScore}/100`, avgScore < 50 ? 'Below target' : 'On track', avgScore < 50 ? T.amber : T.green)}
        {card('Critical Dependencies', criticals.length, 'Single-source or strategic', T.red)}
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 18 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '10px 16px', border: 'none', cursor: 'pointer', fontFamily: T.font, fontSize: 13, fontWeight: tab === i ? 700 : 500,
            color: tab === i ? T.navy : T.textSec, background: tab === i ? T.surface : 'transparent',
            borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent', marginBottom: -2, borderRadius: '6px 6px 0 0'
          }}>{t}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontFamily: T.font, fontSize: 13 }}>
          <option value="All">All Tiers</option>
          <option value="1">Tier 1</option>
          <option value="2">Tier 2</option>
          <option value="3">Tier 3</option>
        </select>
      </div>

      {tab === 0 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Supplier Spend vs Transition Score</h3>
          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="spend" name="Spend ($M)" tick={{ fontSize: 11 }} label={{ value: 'Annual Spend ($M)', position: 'bottom', fontSize: 11 }} />
              <YAxis dataKey="score" name="Transition Score" tick={{ fontSize: 11 }} domain={[0, 100]} label={{ value: 'Transition Score', angle: -90, position: 'left', fontSize: 11 }} />
              <ZAxis range={[60, 60]} />
              <Tooltip content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (<div style={{ background: '#fff', border: `1px solid ${T.border}`, padding: 10, borderRadius: 8, fontSize: 12 }}>
                  <div style={{ fontWeight: 700 }}>{d.name}</div>
                  <div>Tier {d.tier} | {d.cat} | {d.country}</div>
                  <div>Spend: ${d.spend}M | Score: {d.score}/100</div>
                  <div>Critical: {d.critical ? 'Yes' : 'No'} | Plan: {d.plan}</div>
                </div>);
              }} />
              <ReferenceLine y={50} stroke={T.amber} strokeDasharray="5 5" label={{ value: 'Target 50', fontSize: 10 }} />
              <Scatter data={filtered}>
                {filtered.map(s => <Cell key={s.id} fill={TIER_COLORS[s.tier]} opacity={s.critical ? 1 : 0.6} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
            {[1, 2, 3].map(t => <span key={t} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: TIER_COLORS[t] }} />Tier {t}</span>)}
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Tier 1 Strategic Suppliers</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: T.bg }}>
              {['Supplier','Category','Country','Spend $M','Score','Critical','Plan Status'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {SUPPLIERS.filter(s => s.tier === 1).sort((a,b) => b.spend - a.spend).map(s => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: '6px 10px' }}>{s.cat}</td>
                  <td style={{ padding: '6px 10px' }}>{s.country}</td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{s.spend}</td>
                  <td style={{ padding: '6px 10px' }}>
                    <span style={{ fontFamily: T.mono, fontWeight: 700, color: s.score >= 60 ? T.green : s.score >= 40 ? T.amber : T.red }}>{s.score}</span>
                  </td>
                  <td style={{ padding: '6px 10px' }}>{s.critical ? <span style={{ color: T.red, fontWeight: 700 }}>YES</span> : 'No'}</td>
                  <td style={{ padding: '6px 10px' }}><span style={{ color: PLAN_COLORS[s.plan], fontWeight: 600 }}>{s.plan}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Tier 2 & 3 Supplier Transition Scores</h3>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={SUPPLIERS.filter(s => s.tier >= 2).sort((a,b) => b.score - a.score)} layout="vertical" margin={{ left: 150 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={145} />
              <Tooltip formatter={v => [`${v}/100`, 'Score']} />
              <ReferenceLine x={50} stroke={T.amber} strokeDasharray="5 5" />
              <Bar dataKey="score" radius={[0,4,4,0]}>
                {SUPPLIERS.filter(s => s.tier >= 2).sort((a,b) => b.score - a.score).map(s => (
                  <Cell key={s.id} fill={s.score >= 60 ? T.green : s.score >= 40 ? T.amber : T.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Concentration Risk by Category (HHI)</h3>
          <p style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>HHI > 2500 = highly concentrated, 1500-2500 = moderate, &lt; 1500 = competitive.</p>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={catConc} layout="vertical" margin={{ left: 160 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="cat" tick={{ fontSize: 10 }} width={155} />
              <Tooltip formatter={(v, name) => [name === 'hhi' ? v : `$${v}M`, name === 'hhi' ? 'HHI Index' : 'Spend']} />
              <ReferenceLine x={2500} stroke={T.red} strokeDasharray="5 5" label={{ value: 'HHI 2500', fontSize: 10 }} />
              <Bar dataKey="hhi" radius={[0,4,4,0]}>
                {catConc.map(c => <Cell key={c.cat} fill={c.hhi > 2500 ? T.red : c.hhi > 1500 ? T.amber : T.green} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Critical Dependencies</h3>
          <p style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Suppliers flagged as single-source or strategic with limited substitutability.</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: '#fef2f2' }}>
              {['Supplier','Category','Spend $M','Score','Plan','Risk Level'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, fontFamily: T.mono, fontSize: 10, color: T.red }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {criticals.sort((a,b) => b.spend - a.spend).map(s => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', fontWeight: 700 }}>{s.name}</td>
                  <td style={{ padding: '6px 10px' }}>{s.cat}</td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono }}>{s.spend}</td>
                  <td style={{ padding: '6px 10px', fontFamily: T.mono, color: s.score < 50 ? T.red : T.green, fontWeight: 700 }}>{s.score}</td>
                  <td style={{ padding: '6px 10px' }}><span style={{ color: PLAN_COLORS[s.plan] }}>{s.plan}</span></td>
                  <td style={{ padding: '6px 10px' }}><span style={{ background: s.score < 40 ? '#fef2f2' : s.score < 60 ? '#fffbeb' : '#f0fdf4', color: s.score < 40 ? T.red : s.score < 60 ? T.amber : T.green, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{s.score < 40 ? 'HIGH' : s.score < 60 ? 'MEDIUM' : 'LOW'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background: T.surface, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.navy, fontSize: 15, marginBottom: 12 }}>Transition Plan Engagement Tracker</h3>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {planStatus.map(p => (
              <div key={p.status} style={{ padding: '10px 18px', background: T.bg, borderRadius: 8, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: PLAN_COLORS[p.status] }}>{p.count}</div>
                <div style={{ fontSize: 11, color: T.textSec }}>{p.status}</div>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={planStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label={({ status, count }) => `${status}: ${count}`}>
                {planStatus.map(p => <Cell key={p.status} fill={PLAN_COLORS[p.status]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 14, padding: 12, background: T.bg, borderRadius: 8, fontSize: 12, color: T.textSec }}>
            <strong>Engagement Progress:</strong> {Math.round((SUPPLIERS.filter(s => s.plan !== 'Not Requested').length / SUPPLIERS.length) * 100)}% of suppliers have been engaged. Target: 80% by Q4 2026.
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, padding: 14, background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 11, color: T.textMut }}>
        <strong>Data Sources:</strong> CDP Supply Chain Programme | Company procurement database | GRESB Infrastructure Assessment.
        <span style={{ float: 'right', fontFamily: T.mono }}>EP-CU3 v1.0 | Supplier Network</span>
      </div>
    </div>
  );
}
