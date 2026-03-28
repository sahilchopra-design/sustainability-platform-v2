import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7',
  border:'#e5e0d8', borderL:'#d5cfc5',
  navy:'#1b3a5c', navyL:'#2c5a8c',
  gold:'#c5a96a', goldL:'#d4be8a',
  sage:'#5a8a6a', sageL:'#7ba67d', teal:'#5a8a6a',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  card:'0 1px 4px rgba(27,58,92,0.06)',
  cardH:'0 4px 16px rgba(27,58,92,0.1)',
  font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};
const ACCENT = '#0284c7';
const tip = { contentStyle:{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, color:T.text }, labelStyle:{ color:T.textSec } };
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const TABS = ['Overview','Social Return on Investment','FPIC & Indigenous Rights','Local Economic Multiplier','Measurement Frameworks'];

const SECTOR_TABLE = [
  { sector:'Extractive Industries', investment:142, sroi:2.8, fpic:72, localEmp:38, grievance:81 },
  { sector:'Renewable Energy',      investment:98,  sroi:3.6, fpic:89, localEmp:62, grievance:91 },
  { sector:'Agriculture & Food',    investment:76,  sroi:4.1, fpic:55, localEmp:74, grievance:76 },
  { sector:'Infrastructure',        investment:134, sroi:2.9, fpic:68, localEmp:55, grievance:84 },
  { sector:'Financial Services',    investment:64,  sroi:3.3, fpic:94, localEmp:41, grievance:95 },
  { sector:'Consumer Goods',        investment:87,  sroi:3.1, fpic:88, localEmp:58, grievance:88 },
  { sector:'Healthcare',            investment:52,  sroi:4.8, fpic:96, localEmp:69, grievance:97 },
  { sector:'Digital Tech',          investment:27,  sroi:2.5, fpic:91, localEmp:43, grievance:89 },
];

const INVEST_TREND = Array.from({length:24},(_,i)=>({ month:`M${i+1}`, value:+(28+sr(i*7)*18+i*0.4).toFixed(2) }));

const SROI_TYPES = [
  { type:'Education & Skills',        investment:18.4, sroi:4.6, beneficiaries:2840, payback:3.2, sdg:'SDG 4, 8' },
  { type:'Healthcare Access',         investment:24.1, sroi:5.1, beneficiaries:3610, payback:2.8, sdg:'SDG 3' },
  { type:'Infrastructure',            investment:42.7, sroi:2.3, beneficiaries:1420, payback:6.1, sdg:'SDG 9, 11' },
  { type:"Women's Empowerment",       investment:12.3, sroi:4.2, beneficiaries:2190, payback:3.7, sdg:'SDG 5, 8' },
  { type:'Indigenous Community',      investment:19.8, sroi:3.8, beneficiaries:1870, payback:4.4, sdg:'SDG 10, 16' },
  { type:'Environmental Restoration', investment:31.5, sroi:2.9, beneficiaries:980,  payback:5.5, sdg:'SDG 13, 15' },
  { type:'Digital Inclusion',         investment:9.6,  sroi:3.5, beneficiaries:3240, payback:3.0, sdg:'SDG 9, 10' },
  { type:'Food Security',             investment:22.0, sroi:4.9, beneficiaries:4100, payback:2.5, sdg:'SDG 2' },
];

const FPIC_PROJECTS = [
  { name:'Project Alpha',  country:'Brazil',      group:'Kayapó',         status:'Obtained',    cba:12.4, area:340, legal:'N' },
  { name:'Project Beta',   country:'Canada',      group:'Cree Nation',    status:'Ongoing',     cba:8.7,  area:190, legal:'Y' },
  { name:'Project Gamma',  country:'Australia',   group:'Arrernte',       status:'Obtained',    cba:5.2,  area:120, legal:'N' },
  { name:'Project Delta',  country:'Peru',        group:'Quechua',        status:'Failed',      cba:0,    area:470, legal:'Y' },
  { name:'Project Epsilon',country:'Indonesia',   group:'Dayak',          status:'Not Started', cba:0,    area:280, legal:'N' },
  { name:'Project Zeta',   country:'Ghana',       group:'Akan',           status:'Obtained',    cba:3.9,  area:95,  legal:'N' },
  { name:'Project Eta',    country:'India',       group:'Adivasi',        status:'Ongoing',     cba:6.1,  area:210, legal:'Y' },
  { name:'Project Theta',  country:'New Zealand', group:'Ngāi Tahu',      status:'Obtained',    cba:9.8,  area:155, legal:'N' },
];

const FPIC_STATUS_DATA = [
  { status:'Obtained',    count:4 },
  { status:'Ongoing',     count:2 },
  { status:'Failed',      count:1 },
  { status:'Not Started', count:1 },
];

const FPIC_CHECKLIST = [
  { item:'Community identification & mapping',       done:true  },
  { item:'Free consent process documentation',       done:true  },
  { item:'Prior consultation (pre-project phase)',   done:true  },
  { item:'Informed disclosure of project impacts',   done:true  },
  { item:'Benefit-sharing agreement signed',         done:false },
  { item:'Grievance mechanism established',          done:false },
];

const LOCAL_SECTORS = [
  { sector:'Mining',                 direct:4200, indirect:1.8, procurement:34, tax:28.4, skills:62 },
  { sector:'Renewable Energy',       direct:2800, indirect:2.4, procurement:58, tax:14.7, skills:78 },
  { sector:'Manufacturing',          direct:6100, indirect:2.9, procurement:71, tax:41.2, skills:84 },
  { sector:'Agriculture',            direct:8400, indirect:1.6, procurement:82, tax:12.1, skills:55 },
  { sector:'Tourism',                direct:3300, indirect:3.1, procurement:67, tax:9.8,  skills:71 },
  { sector:'Digital Infrastructure', direct:1100, indirect:2.2, procurement:44, tax:6.3,  skills:91 },
];

const EMP_TREND = Array.from({length:24},(_,i)=>({ month:`M${i+1}`, value:Math.round(18000+sr(i*11)*6000+i*140) }));

const FRAMEWORKS = [
  { name:'GRI 413 Local Communities', jurisdiction:'Global',    metrics:'Community investment, grievances, FPIC, resettlement', adoption:61, maturity:'Established' },
  { name:'IFC Performance Standards', jurisdiction:'Global',    metrics:'PS7 Indigenous peoples, PS1 ESIA, PS8 Cultural heritage', adoption:48, maturity:'Established' },
  { name:'SASB Social Capital',       jurisdiction:'US/Global', metrics:'Community relations, product quality, human rights',     adoption:39, maturity:'Maturing' },
  { name:'B Impact Assessment',       jurisdiction:'Global',    metrics:'Community score, local economic impact, supply chain',   adoption:22, maturity:'Growing' },
  { name:'Social Value Act (UK)',      jurisdiction:'UK',        metrics:'Economic, social, environmental wellbeing measures',     adoption:34, maturity:'Maturing' },
  { name:'ISO 26000',                 jurisdiction:'Global',    metrics:'Community involvement, development, human rights',       adoption:27, maturity:'Growing' },
];

const fpicColor = s => s==='Obtained'?T.green:s==='Ongoing'?T.amber:s==='Failed'?T.red:T.textMut;
const maturityColor = m => m==='Established'?T.green:m==='Maturing'?T.amber:ACCENT;

export default function CommunityImpactPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text, padding:'24px' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Community Impact & Social Value</div>
        <div style={{ color:T.textSec, fontSize:14 }}>EP-AD5 · IFC PS7 · GRI 413 · SROI Analytics · FPIC Compliance Tracker</div>
      </div>

      {/* Tab Bar */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid '+T.border, marginBottom:24, overflowX:'auto' }}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{
            background:'none', border:'none', color: tab===i ? T.text : T.textSec,
            padding:'10px 18px', cursor:'pointer', fontSize:13, fontWeight: tab===i?600:400, whiteSpace:'nowrap',
            borderBottom: tab===i ? `2px solid ${ACCENT}` : '2px solid transparent'
          }}>{t}</button>
        ))}
      </div>

      {/* Tab 1 — Overview */}
      {tab===0 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
            {[
              { label:'Corporate Community Spend', value:'$780bn', sub:'Global 2024' },
              { label:'SROI Average',              value:'3.2×',   sub:'Across 8 sectors' },
              { label:'IFC PS7 Standard',          value:'FPIC',   sub:'Free Prior Informed Consent' },
              { label:'B Impact Score Leaders',    value:'142',    sub:'Companies ≥ 80 pts' },
            ].map(s=>(
              <div key={s.label} style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:'18px 20px' }}>
                <div style={{ fontSize:11, color:T.textSec, marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>{s.label}</div>
                <div style={{ fontSize:26, fontWeight:700, color:ACCENT }}>{s.value}</div>
                <div style={{ fontSize:12, color:T.textMut, marginTop:4 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20, marginBottom:24 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Sector Community Investment Summary</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ color:T.textSec }}>
                  {['Sector','Investment ($bn)','SROI','FPIC Compliance','Local Employment','Grievance Resolution'].map(h=>(
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', borderBottom:'1px solid '+T.border, fontWeight:500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTOR_TABLE.map((r,i)=>(
                  <tr key={r.sector} style={{ background: i%2===0?'transparent':'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding:'7px 10px', fontWeight:500 }}>{r.sector}</td>
                    <td style={{ padding:'7px 10px', color:ACCENT }}>${r.investment}</td>
                    <td style={{ padding:'7px 10px', color:r.sroi>=4?T.green:r.sroi>=3?T.amber:T.textSec }}>{r.sroi}×</td>
                    <td style={{ padding:'7px 10px' }}>{r.fpic}%</td>
                    <td style={{ padding:'7px 10px' }}>{r.localEmp}%</td>
                    <td style={{ padding:'7px 10px', color:r.grievance>=90?T.green:r.grievance>=80?T.amber:T.red }}>{r.grievance}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>24-Month Community Investment Trend ($bn)</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={INVEST_TREND} margin={{top:4,right:16,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={ACCENT} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="month" stroke={T.textMut} tick={{fontSize:11}}/>
                <YAxis stroke={T.textMut} tick={{fontSize:11}}/>
                <Tooltip {...tip}/>
                <Area type="monotone" dataKey="value" stroke={ACCENT} fill="url(#ciGrad)" name="Investment ($bn)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2 — SROI */}
      {tab===1 && (
        <div>
          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20, marginBottom:24 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>SROI by Investment Type</div>
            <div style={{ fontSize:12, color:T.textSec, marginBottom:14 }}>Social Return on Investment multipliers across 8 community investment categories</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SROI_TYPES} margin={{top:4,right:16,left:0,bottom:60}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="type" stroke={T.textMut} tick={{fontSize:10,fill:T.textSec}} angle={-30} textAnchor="end" interval={0}/>
                <YAxis stroke={T.textMut} tick={{fontSize:11}} domain={[0,6]}/>
                <Tooltip {...tip} formatter={(v)=>[`${v}×`,'SROI']}/>
                <Bar dataKey="sroi" radius={[4,4,0,0]} name="SROI">
                  {SROI_TYPES.map((d,i)=>(
                    <Cell key={i} fill={d.sroi>=4?T.green:d.sroi>=2?T.amber:ACCENT}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:T.navy, border:'1px solid '+T.border, borderRadius:10, padding:18, marginBottom:24 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.gold, marginBottom:6 }}>SROI Formula</div>
            <div style={{ fontSize:13, color:T.text, fontFamily:'monospace', marginBottom:4 }}>SROI = (Net Present Value of Impact) / Investment</div>
            <div style={{ fontSize:12, color:T.textSec }}>Captures economic, social and environmental value generated per £/$ invested. Ratios above 1.0 indicate net positive social return.</div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
            {SROI_TYPES.map(d=>(
              <div key={d.type} style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16 }}>
                <div style={{ fontWeight:600, fontSize:13, marginBottom:8 }}>{d.type}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, fontSize:12 }}>
                  <span style={{ color:T.textSec }}>Avg Investment</span><span style={{ color:ACCENT }}>${d.investment}M</span>
                  <span style={{ color:T.textSec }}>SROI Multiplier</span><span style={{ color:d.sroi>=4?T.green:d.sroi>=2?T.amber:T.text }}>{d.sroi}×</span>
                  <span style={{ color:T.textSec }}>Beneficiaries/$M</span><span>{d.beneficiaries.toLocaleString()}</span>
                  <span style={{ color:T.textSec }}>Payback Period</span><span>{d.payback} yrs</span>
                  <span style={{ color:T.textSec }}>SDG Alignment</span><span style={{ color:T.teal }}>{d.sdg}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3 — FPIC */}
      {tab===2 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
            {[
              { label:'Projects with FPIC',       value:'45%', color:T.amber },
              { label:'Legal Challenges Pending', value:'23%', color:T.red },
              { label:'Avg Negotiation Time',     value:'18 mo', color:ACCENT },
            ].map(s=>(
              <div key={s.label} style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:'16px 20px', textAlign:'center' }}>
                <div style={{ fontSize:28, fontWeight:700, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
            <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>FPIC Status Breakdown</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={FPIC_STATUS_DATA} margin={{top:4,right:8,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                  <XAxis dataKey="status" stroke={T.textMut} tick={{fontSize:11}}/>
                  <YAxis stroke={T.textMut} tick={{fontSize:11}} allowDecimals={false}/>
                  <Tooltip {...tip}/>
                  <Bar dataKey="count" radius={[4,4,0,0]} name="Projects">
                    {FPIC_STATUS_DATA.map((d,i)=>(
                      <Cell key={i} fill={fpicColor(d.status)}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>IFC PS7 Compliance Checklist</div>
              {FPIC_CHECKLIST.map(c=>(
                <div key={c.item} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, fontSize:13 }}>
                  <span style={{ color:c.done?T.green:T.red, fontSize:16 }}>{c.done?'✓':'✗'}</span>
                  <span style={{ color:c.done?T.text:T.textSec }}>{c.item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Project FPIC Tracker</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textSec }}>
                  {['Project','Country','Indigenous Group','FPIC Status','CBA ($M)','Land (km²)','Legal'].map(h=>(
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', borderBottom:'1px solid '+T.border, fontWeight:500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FPIC_PROJECTS.map((r,i)=>(
                  <tr key={r.name} style={{ background: i%2===0?'transparent':'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding:'7px 10px', fontWeight:500 }}>{r.name}</td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>{r.country}</td>
                    <td style={{ padding:'7px 10px' }}>{r.group}</td>
                    <td style={{ padding:'7px 10px' }}>
                      <span style={{ background:fpicColor(r.status)+'22', color:fpicColor(r.status), padding:'2px 8px', borderRadius:4, fontSize:11 }}>{r.status}</span>
                    </td>
                    <td style={{ padding:'7px 10px', color:r.cba>0?T.green:T.textMut }}>{r.cba>0?`$${r.cba}`:'-'}</td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>{r.area}</td>
                    <td style={{ padding:'7px 10px', color:r.legal==='Y'?T.red:T.green }}>{r.legal==='Y'?'Yes':'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4 — Local Economic Multiplier */}
      {tab===3 && (
        <div>
          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20, marginBottom:24 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Local Economic Multiplier by Sector</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={LOCAL_SECTORS} margin={{top:4,right:16,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="sector" stroke={T.textMut} tick={{fontSize:11}}/>
                <YAxis stroke={T.textMut} tick={{fontSize:11}} domain={[0,4]}/>
                <Tooltip {...tip} formatter={(v)=>[`${v}×`,'Multiplier']}/>
                <Bar dataKey="indirect" radius={[4,4,0,0]} name="Multiplier">
                  {LOCAL_SECTORS.map((d,i)=>(
                    <Cell key={i} fill={d.indirect>=3?T.green:d.indirect>=2?T.amber:ACCENT}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20, marginBottom:24 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>Sector Employment & Economic Data</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ color:T.textSec }}>
                  {['Sector','Direct Jobs','Econ. Multiplier','Local Procurement','Tax Contribution','Skills Transfer'].map(h=>(
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', borderBottom:'1px solid '+T.border, fontWeight:500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LOCAL_SECTORS.map((r,i)=>(
                  <tr key={r.sector} style={{ background: i%2===0?'transparent':'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding:'7px 10px', fontWeight:500 }}>{r.sector}</td>
                    <td style={{ padding:'7px 10px', color:ACCENT }}>{r.direct.toLocaleString()}</td>
                    <td style={{ padding:'7px 10px', color:r.indirect>=3?T.green:r.indirect>=2?T.amber:T.textSec }}>{r.indirect}×</td>
                    <td style={{ padding:'7px 10px' }}>{r.procurement}%</td>
                    <td style={{ padding:'7px 10px', color:T.teal }}>${r.tax}M</td>
                    <td style={{ padding:'7px 10px' }}>
                      <div style={{ background:T.border, borderRadius:4, height:6, width:'100%' }}>
                        <div style={{ background:r.skills>=80?T.green:r.skills>=60?T.amber:ACCENT, height:6, borderRadius:4, width:`${r.skills}%` }}/>
                      </div>
                      <span style={{ fontSize:11, color:T.textSec }}>{r.skills}/100</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>24-Month Local Employment Trend</div>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={EMP_TREND} margin={{top:4,right:16,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="empGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.green} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={T.green} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="month" stroke={T.textMut} tick={{fontSize:11}}/>
                <YAxis stroke={T.textMut} tick={{fontSize:11}}/>
                <Tooltip {...tip}/>
                <Area type="monotone" dataKey="value" stroke={T.green} fill="url(#empGrad)" name="Local Jobs"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 5 — Measurement Frameworks */}
      {tab===4 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
            {[
              { label:'Companies Measuring SROI', value:'28%', color:T.amber },
              { label:'Avg Community Disclosure',  value:'54/100', color:ACCENT },
              { label:'Frameworks in CSRD',        value:'3', color:T.green },
            ].map(s=>(
              <div key={s.label} style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:'16px 20px', textAlign:'center' }}>
                <div style={{ fontSize:28, fontWeight:700, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:12, color:T.textSec, marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
            {FRAMEWORKS.map(f=>(
              <div key={f.name} style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:18 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{f.name}</div>
                  <span style={{ background:maturityColor(f.maturity)+'22', color:maturityColor(f.maturity), padding:'2px 8px', borderRadius:4, fontSize:11, whiteSpace:'nowrap', marginLeft:8 }}>{f.maturity}</span>
                </div>
                <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>Jurisdiction: <span style={{ color:T.text }}>{f.jurisdiction}</span></div>
                <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>{f.metrics}</div>
                <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>Adoption Rate: <span style={{ color:ACCENT, fontWeight:600 }}>{f.adoption}%</span></div>
                <div style={{ background:T.border, borderRadius:4, height:6 }}>
                  <div style={{ background:ACCENT, height:6, borderRadius:4, width:`${f.adoption}%`, transition:'width 0.4s' }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
