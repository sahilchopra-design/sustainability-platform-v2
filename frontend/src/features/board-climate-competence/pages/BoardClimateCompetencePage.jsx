import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Competence Dashboard','Director Profiles','Climate Committee Status','Training & Development','Diversity for Climate','Peer Benchmarking'];

const COMPANIES = [
  { company:'Shell', sector:'Oil & Gas', expertise:72, structure:80, accountability:68, score:73, committee:true, meetingFreq:6, directors:12, climateExp:4, training:65, diversityScore:72 },
  { company:'BP', sector:'Oil & Gas', expertise:78, structure:85, accountability:72, score:78, committee:true, meetingFreq:8, directors:11, climateExp:5, training:70, diversityScore:68 },
  { company:'Exxon', sector:'Oil & Gas', expertise:35, structure:28, accountability:30, score:31, committee:false, meetingFreq:0, directors:13, climateExp:1, training:28, diversityScore:52 },
  { company:'TotalEnergies', sector:'Oil & Gas', expertise:68, structure:75, accountability:65, score:69, committee:true, meetingFreq:5, directors:12, climateExp:3, training:60, diversityScore:65 },
  { company:'Rio Tinto', sector:'Mining', expertise:82, structure:88, accountability:80, score:83, committee:true, meetingFreq:8, directors:10, climateExp:4, training:75, diversityScore:78 },
  { company:'BHP', sector:'Mining', expertise:85, structure:90, accountability:82, score:86, committee:true, meetingFreq:10, directors:11, climateExp:5, training:80, diversityScore:82 },
  { company:'Glencore', sector:'Mining', expertise:62, structure:68, accountability:58, score:63, committee:true, meetingFreq:4, directors:11, climateExp:3, training:55, diversityScore:58 },
  { company:'HSBC', sector:'Banking', expertise:75, structure:82, accountability:72, score:76, committee:true, meetingFreq:6, directors:14, climateExp:4, training:68, diversityScore:75 },
  { company:'Barclays', sector:'Banking', expertise:68, structure:72, accountability:65, score:68, committee:true, meetingFreq:5, directors:13, climateExp:3, training:62, diversityScore:70 },
  { company:'Unilever', sector:'Consumer', expertise:88, structure:92, accountability:85, score:88, committee:true, meetingFreq:8, directors:11, climateExp:5, training:82, diversityScore:85 },
  { company:'Nestle', sector:'Consumer', expertise:72, structure:78, accountability:70, score:73, committee:true, meetingFreq:6, directors:12, climateExp:3, training:65, diversityScore:72 },
  { company:'VW Group', sector:'Auto', expertise:65, structure:72, accountability:62, score:66, committee:true, meetingFreq:4, directors:20, climateExp:4, training:58, diversityScore:55 },
  { company:'Toyota', sector:'Auto', expertise:55, structure:58, accountability:50, score:54, committee:false, meetingFreq:0, directors:12, climateExp:2, training:42, diversityScore:42 },
  { company:'HeidelbergCement', sector:'Materials', expertise:60, structure:65, accountability:58, score:61, committee:true, meetingFreq:4, directors:10, climateExp:2, training:52, diversityScore:58 },
  { company:'ArcelorMittal', sector:'Materials', expertise:52, structure:55, accountability:48, score:52, committee:false, meetingFreq:0, directors:9, climateExp:1, training:40, diversityScore:50 },
  { company:'Equinor', sector:'Oil & Gas', expertise:80, structure:85, accountability:78, score:81, committee:true, meetingFreq:7, directors:10, climateExp:4, training:72, diversityScore:80 },
  { company:'Orsted', sector:'Utilities', expertise:92, structure:95, accountability:90, score:92, committee:true, meetingFreq:10, directors:8, climateExp:6, training:88, diversityScore:85 },
  { company:'Iberdrola', sector:'Utilities', expertise:78, structure:82, accountability:75, score:78, committee:true, meetingFreq:6, directors:14, climateExp:4, training:70, diversityScore:72 },
  { company:'NextEra', sector:'Utilities', expertise:82, structure:88, accountability:80, score:83, committee:true, meetingFreq:8, directors:12, climateExp:5, training:75, diversityScore:75 },
  { company:'Siemens', sector:'Industrials', expertise:72, structure:78, accountability:68, score:73, committee:true, meetingFreq:5, directors:10, climateExp:3, training:65, diversityScore:68 },
  { company:'ABB', sector:'Industrials', expertise:68, structure:72, accountability:65, score:68, committee:true, meetingFreq:4, directors:9, climateExp:3, training:60, diversityScore:65 },
  { company:'Schneider', sector:'Industrials', expertise:85, structure:88, accountability:82, score:85, committee:true, meetingFreq:8, directors:12, climateExp:5, training:78, diversityScore:80 },
  { company:'Apple', sector:'Tech', expertise:65, structure:70, accountability:62, score:66, committee:true, meetingFreq:4, directors:8, climateExp:2, training:55, diversityScore:72 },
  { company:'Microsoft', sector:'Tech', expertise:78, structure:82, accountability:75, score:78, committee:true, meetingFreq:6, directors:12, climateExp:4, training:72, diversityScore:78 },
  { company:'Google', sector:'Tech', expertise:72, structure:75, accountability:68, score:72, committee:true, meetingFreq:5, directors:11, climateExp:3, training:68, diversityScore:75 },
];

export default function BoardClimateCompetencePage() {
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [watchlist, setWatchlist] = useState(false);

  const sectors = [...new Set(COMPANIES.map(c => c.sector))];
  const filtered = useMemo(() => sectorFilter === 'All' ? COMPANIES : COMPANIES.filter(c => c.sector === sectorFilter), [sectorFilter]);
  const avgScore = filtered.length ? Math.round(filtered.reduce((s, c) => s + c.score, 0) / filtered.length) : 0;

  const card = (title, value, sub, color) => (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, flex:1, minWidth:150 }}>
      <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut, textTransform:'uppercase', letterSpacing:1 }}>{title}</div>
      <div style={{ fontSize:28, fontWeight:700, color:color||T.navy, marginTop:4 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:T.textSec, marginTop:2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:24 }}>
      <div style={{ background:T.surface, border:`2px solid ${T.gold}`, borderRadius:12, padding:'20px 28px', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CP5</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>BOARD CLIMATE COMPETENCE</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Board Climate Competence Scoring</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>Director profiles, climate committees & competence benchmarking across 25 companies</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setWatchlist(!watchlist)} style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${watchlist?T.gold:T.border}`, background:watchlist?T.gold+'18':T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>{watchlist?'★ Watchlisted':'☆ Watchlist'}</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>⬇ Export</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>🔖 Bookmark</button>
            <span style={{ padding:'6px 14px', borderRadius:6, background:T.teal+'15', color:T.teal, fontFamily:T.mono, fontSize:11 }}>👥 2 viewing</span>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
        {TABS.map((t, i) => <button key={i} onClick={() => setTab(i)} style={{ padding:'8px 16px', borderRadius:6, border:`1px solid ${tab===i?T.gold:T.border}`, background:tab===i?T.gold+'18':T.surface, color:tab===i?T.navy:T.textSec, fontWeight:tab===i?600:400, fontFamily:T.font, fontSize:13, cursor:'pointer' }}>{t}</button>)}
      </div>

      <div style={{ marginBottom:12 }}>
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:13 }}>
          <option value="All">All Sectors</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {card('Companies Scored', filtered.length.toString(), 'With board data', T.navy)}
            {card('Avg Competence Score', avgScore + '/100', avgScore >= 70 ? 'Good' : 'Needs improvement', avgScore >= 70 ? T.green : T.amber)}
            {card('With Climate Committee', filtered.filter(c => c.committee).length.toString(), 'Dedicated committee', T.green)}
            {card('Top Scorer', filtered.sort((a, b) => b.score - a.score)[0]?.company || '-', filtered.sort((a, b) => b.score - a.score)[0]?.score + '/100', T.gold)}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Competence Score by Company</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={filtered.sort((a, b) => b.score - a.score)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis type="category" dataKey="company" width={120} tick={{ fontSize:10, fontFamily:T.mono }} />
                <Tooltip />
                <Bar dataKey="score" name="Score">{filtered.sort((a, b) => b.score - a.score).map((c, i) => <Cell key={i} fill={c.score >= 80 ? T.green : c.score >= 60 ? T.gold : c.score >= 40 ? T.amber : T.red} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Directors with Climate Expertise</h3>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={filtered}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="company" tick={{ fontSize:9, fontFamily:T.mono, angle:-25, textAnchor:'end' }} height={60} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
              <Tooltip /><Legend />
              <Bar dataKey="directors" fill={T.navy} name="Total Directors" />
              <Bar dataKey="climateExp" fill={T.green} name="Climate Expertise" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Climate Committee Meeting Frequency (per year)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={filtered.filter(c => c.committee).sort((a, b) => b.meetingFreq - a.meetingFreq)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="company" tick={{ fontSize:9, fontFamily:T.mono, angle:-20, textAnchor:'end' }} height={50} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
              <Tooltip />
              <Bar dataKey="meetingFreq" name="Meetings/Year">{filtered.filter(c => c.committee).map((c, i) => <Cell key={i} fill={c.meetingFreq >= 8 ? T.green : c.meetingFreq >= 5 ? T.gold : T.amber} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Training Score vs Expertise Score</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={filtered}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="company" tick={{ fontSize:9, fontFamily:T.mono, angle:-25, textAnchor:'end' }} height={60} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0, 100]} />
              <Tooltip /><Legend />
              <Bar dataKey="expertise" fill={T.navy} name="Expertise" />
              <Bar dataKey="training" fill={T.gold} name="Training" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Diversity Score for Climate Decision-Making</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={filtered.sort((a, b) => b.diversityScore - a.diversityScore)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="company" tick={{ fontSize:9, fontFamily:T.mono, angle:-25, textAnchor:'end' }} height={60} />
              <YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="diversityScore" name="Diversity Score">{filtered.sort((a, b) => b.diversityScore - a.diversityScore).map((c, i) => <Cell key={i} fill={c.diversityScore >= 75 ? T.green : c.diversityScore >= 60 ? T.gold : T.amber} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Peer Benchmarking: Expertise + Structure + Accountability</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={filtered.sort((a, b) => b.score - a.score)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize:11, fontFamily:T.mono }} />
              <YAxis type="category" dataKey="company" width={120} tick={{ fontSize:10, fontFamily:T.mono }} />
              <Tooltip /><Legend />
              <Bar dataKey="expertise" fill={T.navy} name="Expertise" />
              <Bar dataKey="structure" fill={T.gold} name="Structure" />
              <Bar dataKey="accountability" fill={T.green} name="Accountability" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          Chapter Zero (Climate Governance Initiative) · IIGCC Board-Level Climate Competence Framework · World Economic Forum Climate Governance Principles · Carbon Tracker Board Climate Competence Report
        </div>
      </div>
    </div>
  );
}
