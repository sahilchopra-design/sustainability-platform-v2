import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Taxonomy Browser','ISSB S2 Tags','ESRS E1 Tags','Tag Mapping Tool','Validation Engine','Filing Preview'];

const S2_CATEGORIES = [
  { category:'Governance', tags:28, mapped:24, validated:22 },
  { category:'Strategy', tags:42, mapped:35, validated:30 },
  { category:'Risk Management', tags:35, mapped:28, validated:25 },
  { category:'Metrics & Targets', tags:65, mapped:52, validated:45 },
  { category:'Industry Specific', tags:32, mapped:18, validated:12 },
];

const E1_CATEGORIES = [
  { category:'Transition Plan', tags:18, mapped:15, validated:12 },
  { category:'Policies & Actions', tags:22, mapped:18, validated:15 },
  { category:'Targets', tags:15, mapped:12, validated:10 },
  { category:'Energy', tags:20, mapped:18, validated:16 },
  { category:'GHG Emissions', tags:35, mapped:30, validated:28 },
  { category:'Financial Effects', tags:12, mapped:8, validated:5 },
];

const VALIDATION_RESULTS = [
  { check:'Required tags present', passed:185, failed:17, total:202 },
  { check:'Data type validation', passed:192, failed:10, total:202 },
  { check:'Cross-reference consistency', passed:178, failed:24, total:202 },
  { check:'Calculation linkbase', passed:165, failed:37, total:202 },
  { check:'Presentation linkbase', passed:190, failed:12, total:202 },
  { check:'Label completeness', passed:195, failed:7, total:202 },
];

const MAPPED_STATUS = [{ name:'Fully Mapped', value:155 },{ name:'Partially Mapped', value:32 },{ name:'Not Mapped', value:15 }];
const MAP_COLORS = [T.green, T.amber, T.red];

const TAG_SAMPLES = [
  { tag:'ifrs-s2:AbsoluteGrossScope1', element:'GHG Scope 1', type:'monetaryItemType', mapped:true },
  { tag:'ifrs-s2:AbsoluteGrossScope2Location', element:'GHG Scope 2 (Location)', type:'monetaryItemType', mapped:true },
  { tag:'ifrs-s2:AbsoluteGrossScope3', element:'GHG Scope 3', type:'monetaryItemType', mapped:true },
  { tag:'ifrs-s2:TransitionPlanDescription', element:'Transition Plan', type:'stringItemType', mapped:true },
  { tag:'ifrs-s2:ClimateRelatedRisksDescription', element:'Climate Risks', type:'stringItemType', mapped:false },
  { tag:'ifrs-s2:InternalCarbonPrice', element:'Carbon Price', type:'perShareItemType', mapped:true },
  { tag:'ifrs-s2:CapitalDeploymentClimateRelated', element:'Climate CapEx', type:'monetaryItemType', mapped:false },
  { tag:'esrs-e1:EnergyConsumptionTotal', element:'Total Energy', type:'energyItemType', mapped:true },
];

export default function XbrlClimateTaxonomyPage() {
  const [tab, setTab] = useState(0);
  const [searchTag, setSearchTag] = useState('');
  const [watchlist, setWatchlist] = useState(false);

  const filteredTags = useMemo(() => searchTag ? TAG_SAMPLES.filter(t => t.tag.toLowerCase().includes(searchTag.toLowerCase()) || t.element.toLowerCase().includes(searchTag.toLowerCase())) : TAG_SAMPLES, [searchTag]);

  const totalS2 = S2_CATEGORIES.reduce((s,c)=>s+c.tags,0);
  const totalE1 = E1_CATEGORIES.reduce((s,c)=>s+c.tags,0);

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
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CR4</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>XBRL CLIMATE TAXONOMY</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>XBRL/iXBRL Climate Taxonomy Mapper</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>ISSB S2 ({totalS2}+ tags) & ESRS E1 ({totalE1}+ tags) taxonomy mapping & validation</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setWatchlist(!watchlist)} style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${watchlist?T.gold:T.border}`, background:watchlist?T.gold+'18':T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>{watchlist?'★ Watchlisted':'☆ Watchlist'}</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>⬇ Export</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>🔖 Bookmark</button>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
        {TABS.map((t, i) => <button key={i} onClick={() => setTab(i)} style={{ padding:'8px 16px', borderRadius:6, border:`1px solid ${tab===i?T.gold:T.border}`, background:tab===i?T.gold+'18':T.surface, color:tab===i?T.navy:T.textSec, fontWeight:tab===i?600:400, fontFamily:T.font, fontSize:13, cursor:'pointer' }}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {card('ISSB S2 Tags', totalS2+'+', '5 categories', T.navy)}
            {card('ESRS E1 Tags', totalE1+'+', '6 categories', T.gold)}
            {card('Mapped', '155', 'Platform metrics linked', T.green)}
            {card('Validation Pass Rate', '92%', 'Across all checks', T.blue)}
          </div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
              <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Tag Mapping Status</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart><Pie data={MAPPED_STATUS} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>{MAPPED_STATUS.map((_,i)=><Cell key={i} fill={MAP_COLORS[i]}/>)}</Pie><Tooltip/><Legend/></PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:300 }}>
              <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Validation Results</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={VALIDATION_RESULTS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="check" tick={{ fontSize:8, fontFamily:T.mono, angle:-15, textAnchor:'end' }} height={50}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }}/><Tooltip/><Legend/>
                  <Bar dataKey="passed" stackId="a" fill={T.green} name="Passed"/>
                  <Bar dataKey="failed" stackId="a" fill={T.red} name="Failed"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>ISSB S2 Tags: Mapped vs Validated</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={S2_CATEGORIES}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="category" tick={{ fontSize:10, fontFamily:T.mono }}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }}/><Tooltip/><Legend/>
              <Bar dataKey="tags" fill={T.navy} name="Total Tags"/>
              <Bar dataKey="mapped" fill={T.gold} name="Mapped"/>
              <Bar dataKey="validated" fill={T.green} name="Validated"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>ESRS E1 ESEF Tags: Mapped vs Validated</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={E1_CATEGORIES}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="category" tick={{ fontSize:10, fontFamily:T.mono }}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }}/><Tooltip/><Legend/>
              <Bar dataKey="tags" fill={T.navy} name="Total Tags"/>
              <Bar dataKey="mapped" fill={T.gold} name="Mapped"/>
              <Bar dataKey="validated" fill={T.green} name="Validated"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <div style={{ marginBottom:12 }}>
            <input type="text" placeholder="Search tags..." value={searchTag} onChange={e=>setSearchTag(e.target.value)} style={{ padding:'8px 14px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:13, width:300 }}/>
          </div>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Tag Mapping Tool</h3>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{['XBRL Tag','Element','Type','Mapped'].map(h=><th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
            <tbody>{filteredTags.map((t,i)=>(
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:11, color:T.blue }}>{t.tag}</td>
                <td style={{ padding:'8px 12px', fontSize:13 }}>{t.element}</td>
                <td style={{ padding:'8px 12px', fontFamily:T.mono, fontSize:11, color:T.textMut }}>{t.type}</td>
                <td style={{ padding:'8px 12px' }}><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:t.mapped?T.green+'18':T.red+'18', color:t.mapped?T.green:T.red }}>{t.mapped?'Mapped':'Unmapped'}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Validation Checks — Pass/Fail</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={VALIDATION_RESULTS} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{ fontSize:11, fontFamily:T.mono }}/><YAxis type="category" dataKey="check" width={180} tick={{ fontSize:9, fontFamily:T.mono }}/><Tooltip/><Legend/>
              <Bar dataKey="passed" stackId="a" fill={T.green} name="Passed"/>
              <Bar dataKey="failed" stackId="a" fill={T.red} name="Failed"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <h3 style={{ fontSize:16, fontWeight:600, color:T.navy, marginBottom:16 }}>iXBRL Filing Preview</h3>
          <div style={{ padding:16, background:T.bg, borderRadius:8, fontFamily:T.mono, fontSize:12, lineHeight:1.8 }}>
            <div style={{ color:T.textMut }}>&lt;ix:nonNumeric name="ifrs-s2:TransitionPlanDescription"&gt;</div>
            <div style={{ color:T.navy, paddingLeft:20 }}>The Group has established a comprehensive transition plan aligned with a 1.5C pathway...</div>
            <div style={{ color:T.textMut }}>&lt;/ix:nonNumeric&gt;</div>
            <div style={{ marginTop:12, color:T.textMut }}>&lt;ix:nonFraction name="ifrs-s2:AbsoluteGrossScope1" unitRef="tCO2e" decimals="0"&gt;</div>
            <div style={{ color:T.green, paddingLeft:20, fontWeight:600 }}>1,245,000</div>
            <div style={{ color:T.textMut }}>&lt;/ix:nonFraction&gt;</div>
          </div>
          <div style={{ marginTop:16, padding:12, background:T.amber+'10', border:`1px solid ${T.amber}30`, borderRadius:6, fontSize:12, color:T.textSec }}>
            This is a simplified preview. Actual iXBRL documents contain full XBRL Instance with DTS references, contexts, units, and linkbases.
          </div>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          IFRS Sustainability Disclosure Taxonomy 2024 · EFRAG ESRS XBRL Taxonomy · ESEF Regulation (EU) · SEC Inline XBRL Requirements · XBRL International Standards
        </div>
      </div>
    </div>
  );
}
