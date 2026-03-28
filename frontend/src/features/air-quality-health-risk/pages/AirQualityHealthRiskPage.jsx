import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, Cell, LineChart, Line,
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
const SLATE = '#6366f1';
const tip = { contentStyle:{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, color:T.text }, labelStyle:{ color:T.textSec } };
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const TABS = ['Overview','Pollutant Monitor','Corporate Liability','Health Economics','Regulatory Framework'];

const CITIES = [
  { city:'Delhi',    pm25:92.9, aqi:374, who:0,  hcost:36.2, trend:'▲' },
  { city:'Lahore',   pm25:86.5, aqi:358, who:0,  hcost:18.7, trend:'▲' },
  { city:'Dhaka',    pm25:79.9, aqi:312, who:0,  hcost:14.3, trend:'▲' },
  { city:'Kolkata',  pm25:67.3, aqi:271, who:0,  hcost:12.1, trend:'→' },
  { city:'Chengdu',  pm25:55.1, aqi:224, who:0,  hcost:21.8, trend:'▼' },
  { city:'Jakarta',  pm25:49.4, aqi:196, who:0,  hcost:17.4, trend:'→' },
  { city:'Karachi',  pm25:73.2, aqi:291, who:0,  hcost:11.5, trend:'▲' },
  { city:'Mumbai',   pm25:46.8, aqi:183, who:2,  hcost:15.9, trend:'▼' },
];

const PM25_TREND = Array.from({ length:24 }, (_, i) => ({
  month: `M${i+1}`,
  pm25: +(25 + sr(i*3)*35).toFixed(1),
}));

const POLLUTANTS = [
  { name:'PM2.5', source:'Combustion/dust',  avg:35.6, who:5,   ratio:7.12, effect:'Respiratory & cardiovascular disease' },
  { name:'PM10',  source:'Dust/construction', avg:49.8, who:15,  ratio:3.32, effect:'Lung irritation, reduced function' },
  { name:'NO₂',   source:'Vehicle emissions', avg:25.3, who:10,  ratio:2.53, effect:'Airway inflammation, asthma' },
  { name:'SO₂',   source:'Coal/industrial',   avg:18.7, who:40,  ratio:0.47, effect:'Respiratory damage, acid rain' },
  { name:'O₃',    source:'Photochemical',     avg:102,  who:100, ratio:1.02, effect:'Lung damage, reduced capacity' },
  { name:'CO',    source:'Incomplete comb.',  avg:2.1,  who:4,   ratio:0.53, effect:'Oxygen deprivation, cardiac' },
];

const NO2_TREND = Array.from({ length:24 }, (_, i) => ({
  month: `M${i+1}`,
  no2: +(15 + sr(i*7+2)*22).toFixed(1),
}));

const INDUSTRIES = [
  { name:'Power & Utilities', ei:8.4, exc:34, lit:82, eu:41, mort:2.3 },
  { name:'Steel & Metals',    ei:7.1, exc:28, lit:74, eu:55, mort:1.9 },
  { name:'Cement',            ei:6.8, exc:31, lit:69, eu:47, mort:1.7 },
  { name:'Chemicals',         ei:5.9, exc:22, lit:63, eu:62, mort:1.4 },
  { name:'Oil & Gas',         ei:5.2, exc:19, lit:71, eu:68, mort:1.6 },
  { name:'Transport',         ei:3.8, exc:14, lit:58, eu:72, mort:1.1 },
  { name:'Agriculture',       ei:2.9, exc:9,  lit:31, eu:81, mort:0.7 },
  { name:'Mining',            ei:4.6, exc:26, lit:55, eu:53, mort:1.2 },
];

const HEALTH_OUTCOMES = [
  { name:'Premature Mortality',    burden:6.7,  cost:3420, link:91, avoidable:72 },
  { name:'Respiratory Disease',    burden:212,  cost:890,  link:78, avoidable:65 },
  { name:'Cardiovascular Disease', burden:89,   cost:1240, link:62, avoidable:48 },
  { name:'Lung Cancer',            burden:2.3,  cost:310,  link:29, avoidable:41 },
  { name:'Child Cognitive Dev.',   burden:44,   cost:580,  link:55, avoidable:58 },
  { name:'Lost Workdays',          burden:1800, cost:670,  link:43, avoidable:62 },
];

const ROI_SCENARIOS = [
  { level:'Moderate (25% reduction)', invest:120, return_:2800, lives:1.2, timeline:'2025–2030' },
  { level:'Ambitious (50% reduction)', invest:340, return_:7400, lives:3.1, timeline:'2025–2035' },
  { level:'WHO-Compliant (75% reduc.)', invest:820, return_:18200, lives:5.8, timeline:'2025–2040' },
];

const REGULATIONS = [
  { name:'EU Ambient Air Quality Directive', pm25limit:'10 μg/m³', year:2024, enforcement:'Infringement proceedings', timeline:'2030', penalty:'Up to €25M/yr' },
  { name:'WHO AQG 2021',                     pm25limit:'5 μg/m³',  year:2021, enforcement:'Voluntary / treaty pressure', timeline:'Immediate', penalty:'Reputational' },
  { name:'US NAAQS',                         pm25limit:'9 μg/m³',  year:2024, enforcement:'EPA enforcement actions', timeline:'2032', penalty:'Up to $70K/day' },
  { name:'China Air Pollution Prevention',   pm25limit:'35 μg/m³', year:2023, enforcement:'State inspections & fines', timeline:'2025', penalty:'Up to ¥1M/event' },
  { name:'India NCAP',                       pm25limit:'40 μg/m³', year:2019, enforcement:'CPCB directives', timeline:'2026', penalty:'Facility closure' },
  { name:'UK Clean Air Strategy',            pm25limit:'10 μg/m³', year:2023, enforcement:'Environment Agency', timeline:'2040', penalty:'Up to £300K' },
];

const card = (label, value, sub) => (
  <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:'16px 20px', flex:1, minWidth:160 }}>
    <div style={{ color:T.textSec, fontSize:11, textTransform:'uppercase', letterSpacing:1 }}>{label}</div>
    <div style={{ color:T.text, fontSize:22, fontWeight:700, margin:'6px 0 2px' }}>{value}</div>
    {sub && <div style={{ color:T.textMut, fontSize:11 }}>{sub}</div>}
  </div>
);

export default function AirQualityHealthRiskPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ background:T.bg, minHeight:'100vh', color:T.text, fontFamily:T.font, padding:24 }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:700, color:T.text }}>Air Quality & Health Risk Analytics</div>
        <div style={{ color:T.textSec, fontSize:13, marginTop:4 }}>EP-AC6 — Global pollution burden, corporate liability & regulatory compliance</div>
      </div>

      {/* Tab Bar */}
      <div style={{ display:'flex', gap:4, borderBottom:'1px solid '+T.border, marginBottom:24 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            background:'none', border:'none', cursor:'pointer', padding:'10px 16px', fontSize:13, fontWeight:600,
            color: tab===i ? T.text : T.textSec,
            borderBottom: tab===i ? '2px solid '+SLATE : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>

      {/* Tab 1 — Overview */}
      {tab===0 && (
        <div>
          <div style={{ display:'flex', gap:14, marginBottom:24, flexWrap:'wrap' }}>
            {card('Deaths/Year (WHO)','7M','Air pollution-attributable')}
            {card('Economic Cost','$8.1T','Annual global burden')}
            {card('PM2.5 Exposure','99%','Population above WHO guideline')}
            {card('WHO AQG Compliance','3%','Countries meeting guidelines')}
          </div>

          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20, marginBottom:24 }}>
            <div style={{ fontWeight:600, marginBottom:14, fontSize:14 }}>City Air Quality Index — PM2.5 Hotspots</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ color:T.textSec, borderBottom:'1px solid '+T.border }}>
                  {['City','PM2.5 (μg/m³)','AQI','WHO %','Health Cost ($bn/yr)','Trend'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', fontWeight:500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CITIES.map((r,i) => (
                  <tr key={r.city} style={{ borderBottom:'1px solid '+T.border, background: i%2===0?'transparent':'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding:'8px 10px', fontWeight:600 }}>{r.city}</td>
                    <td style={{ padding:'8px 10px', color:T.red }}>{r.pm25}</td>
                    <td style={{ padding:'8px 10px', color:T.amber }}>{r.aqi}</td>
                    <td style={{ padding:'8px 10px', color:r.who>10?T.green:T.red }}>{r.who}%</td>
                    <td style={{ padding:'8px 10px' }}>${r.hcost}bn</td>
                    <td style={{ padding:'8px 10px', color:r.trend==='▲'?T.red:r.trend==='▼'?T.green:T.amber }}>{r.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20 }}>
            <div style={{ fontWeight:600, marginBottom:14, fontSize:14 }}>Global PM2.5 Concentration Trend (24 months)</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={PM25_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill:T.textSec, fontSize:11 }} interval={3} />
                <YAxis tick={{ fill:T.textSec, fontSize:11 }} domain={[20,65]} unit=" μg" />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="pm25" stroke={SLATE} fill={SLATE+'33'} strokeWidth={2} name="PM2.5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2 — Pollutant Monitor */}
      {tab===1 && (
        <div>
          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20, marginBottom:24 }}>
            <div style={{ fontWeight:600, marginBottom:14, fontSize:14 }}>Pollutant Profiles & WHO Exceedance</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ color:T.textSec, borderBottom:'1px solid '+T.border }}>
                  {['Pollutant','Primary Source','Global Avg','WHO Guideline','Exceedance Ratio','Health Effect'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', fontWeight:500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {POLLUTANTS.map((p,i) => (
                  <tr key={p.name} style={{ borderBottom:'1px solid '+T.border, background: i%2===0?'transparent':'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding:'8px 10px', fontWeight:600, color:SLATE }}>{p.name}</td>
                    <td style={{ padding:'8px 10px', color:T.textSec }}>{p.source}</td>
                    <td style={{ padding:'8px 10px' }}>{p.avg}</td>
                    <td style={{ padding:'8px 10px', color:T.green }}>{p.who}</td>
                    <td style={{ padding:'8px 10px', color:p.ratio>5?T.red:p.ratio>2?T.amber:T.green, fontWeight:700 }}>{p.ratio}x</td>
                    <td style={{ padding:'8px 10px', color:T.textSec, fontSize:12 }}>{p.effect}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20 }}>
              <div style={{ fontWeight:600, marginBottom:14, fontSize:14 }}>WHO Exceedance Ratio by Pollutant</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={POLLUTANTS} margin={{ left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:11 }} />
                  <YAxis tick={{ fill:T.textSec, fontSize:11 }} unit="x" />
                  <Tooltip {...tip} />
                  <Bar dataKey="ratio" name="Exceedance Ratio">
                    {POLLUTANTS.map((p,i) => (
                      <Cell key={i} fill={p.ratio>5?T.red:p.ratio>2?T.amber:T.green} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20 }}>
              <div style={{ fontWeight:600, marginBottom:14, fontSize:14 }}>NO₂ Concentration Trend (24 months)</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={NO2_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fill:T.textSec, fontSize:11 }} interval={3} />
                  <YAxis tick={{ fill:T.textSec, fontSize:11 }} unit=" μg" />
                  <Tooltip {...tip} />
                  <Line type="monotone" dataKey="no2" stroke={T.amber} strokeWidth={2} dot={false} name="NO₂" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3 — Corporate Liability */}
      {tab===2 && (
        <div>
          <div style={{ display:'flex', gap:14, marginBottom:24, flexWrap:'wrap' }}>
            {card('Annual Corporate Fines','$47bn','Air quality violations')}
            {card('Pending Litigation','312 cases','Active air quality suits')}
            {card('Avg Settlement','$180M','Per resolved case')}
          </div>

          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20, marginBottom:24 }}>
            <div style={{ fontWeight:600, marginBottom:14, fontSize:14 }}>Industry Air Emission Liability Metrics</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ color:T.textSec, borderBottom:'1px solid '+T.border }}>
                  {['Industry','Emission Intensity (t/$M rev)','Reg. Exceedances %','Litigation Risk','EU IPPC %','Mortality/$bn output'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', fontWeight:500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INDUSTRIES.map((r,i) => (
                  <tr key={r.name} style={{ borderBottom:'1px solid '+T.border, background: i%2===0?'transparent':'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding:'8px 10px', fontWeight:600 }}>{r.name}</td>
                    <td style={{ padding:'8px 10px', color:r.ei>6?T.red:r.ei>4?T.amber:T.green }}>{r.ei}</td>
                    <td style={{ padding:'8px 10px', color:r.exc>25?T.red:T.amber }}>{r.exc}%</td>
                    <td style={{ padding:'8px 10px' }}>
                      <div style={{ background:T.border, borderRadius:4, height:6, width:'100%' }}>
                        <div style={{ background:r.lit>70?T.red:r.lit>50?T.amber:T.green, borderRadius:4, height:6, width:r.lit+'%' }} />
                      </div>
                      <span style={{ fontSize:11, color:T.textSec }}>{r.lit}/100</span>
                    </td>
                    <td style={{ padding:'8px 10px', color:r.eu>65?T.green:T.amber }}>{r.eu}%</td>
                    <td style={{ padding:'8px 10px', color:T.red }}>{r.mort}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20 }}>
            <div style={{ fontWeight:600, marginBottom:14, fontSize:14 }}>Emission Intensity by Industry (t/$M revenue)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={INDUSTRIES} margin={{ left:-10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill:T.textSec, fontSize:10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fill:T.textSec, fontSize:11 }} />
                <Tooltip {...tip} />
                <Bar dataKey="ei" name="Emission Intensity">
                  {INDUSTRIES.map((r,i) => (
                    <Cell key={i} fill={r.ei>6?T.red:r.ei>4?T.amber:T.green} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 4 — Health Economics */}
      {tab===3 && (
        <div>
          <div style={{ background:T.navy, border:'1px solid '+T.border, borderRadius:10, padding:16, marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ fontSize:28, fontWeight:800, color:T.gold }}>$30</div>
            <div>
              <div style={{ fontWeight:600, color:T.text }}>Return for every $1 invested in clean air (WHO)</div>
              <div style={{ color:T.textSec, fontSize:12 }}>Benefits from reduced mortality, healthcare costs and productivity gains</div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
            <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20 }}>
              <div style={{ fontWeight:600, marginBottom:14, fontSize:14 }}>Health Outcomes — Economic Cost ($bn/yr)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={HEALTH_OUTCOMES} layout="vertical" margin={{ left:10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fill:T.textSec, fontSize:11 }} unit="bn" />
                  <YAxis type="category" dataKey="name" tick={{ fill:T.textSec, fontSize:10 }} width={130} />
                  <Tooltip {...tip} />
                  <Bar dataKey="cost" name="Economic Cost ($bn)">
                    {HEALTH_OUTCOMES.map((h,i) => (
                      <Cell key={i} fill={[SLATE,T.red,T.amber,T.teal,T.sage,T.gold][i%6]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20 }}>
              <div style={{ fontWeight:600, marginBottom:14, fontSize:14 }}>Health Burden Summary</div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ color:T.textSec, borderBottom:'1px solid '+T.border }}>
                    {['Outcome','Pollution Link %','Avoidable %'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'5px 8px', fontWeight:500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HEALTH_OUTCOMES.map((h,i) => (
                    <tr key={h.name} style={{ borderBottom:'1px solid '+T.border }}>
                      <td style={{ padding:'7px 8px', fontSize:11 }}>{h.name}</td>
                      <td style={{ padding:'7px 8px', color:h.link>70?T.red:h.link>40?T.amber:T.green }}>{h.link}%</td>
                      <td style={{ padding:'7px 8px', color:T.sage }}>{h.avoidable}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20 }}>
            <div style={{ fontWeight:600, marginBottom:14, fontSize:14 }}>Clean Air Investment ROI Scenarios</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ color:T.textSec, borderBottom:'1px solid '+T.border }}>
                  {['Intervention Level','Investment ($bn)','Return ($bn)','Lives Saved (M)','Timeline'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', fontWeight:500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROI_SCENARIOS.map((s,i) => (
                  <tr key={i} style={{ borderBottom:'1px solid '+T.border, background: i%2===0?'transparent':'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding:'8px 10px', fontWeight:600 }}>{s.level}</td>
                    <td style={{ padding:'8px 10px', color:T.amber }}>${s.invest}bn</td>
                    <td style={{ padding:'8px 10px', color:T.green }}>${s.return_}bn</td>
                    <td style={{ padding:'8px 10px', color:T.teal }}>{s.lives}M</td>
                    <td style={{ padding:'8px 10px', color:T.textSec }}>{s.timeline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5 — Regulatory Framework */}
      {tab===4 && (
        <div>
          <div style={{ display:'flex', gap:14, marginBottom:24, flexWrap:'wrap' }}>
            {card('WHO AQG Compliance','3%','Jurisdictions meeting guidelines')}
            {card('Binding Standards','142','Countries with PM2.5 rules')}
            {card('Global Investment','$340bn/yr','Clean air compliance spend')}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {REGULATIONS.map((r,i) => (
              <div key={i} style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:18 }}>
                <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:8 }}>{r.name}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, fontSize:12 }}>
                  <div><span style={{ color:T.textSec }}>PM2.5 Limit: </span><span style={{ color:T.green, fontWeight:600 }}>{r.pm25limit}</span></div>
                  <div><span style={{ color:T.textSec }}>Revised: </span><span style={{ color:T.text }}>{r.year}</span></div>
                  <div style={{ gridColumn:'1/-1' }}><span style={{ color:T.textSec }}>Enforcement: </span><span style={{ color:T.amber }}>{r.enforcement}</span></div>
                  <div><span style={{ color:T.textSec }}>Timeline: </span><span style={{ color:SLATE }}>{r.timeline}</span></div>
                  <div><span style={{ color:T.textSec }}>Penalty: </span><span style={{ color:T.red, fontSize:11 }}>{r.penalty}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
