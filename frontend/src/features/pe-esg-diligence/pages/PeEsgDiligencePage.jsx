import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis,
  PieChart, Pie, Cell,
} from 'recharts';

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

const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

// ── GP Universe Data ──────────────────────────────────────────────────────────
const GP_UNIVERSE = [
  { name:'KKR',              esg:81, climate:84, dei:78, hrdd:80, ilpa:92, aum:528, vintage:'2000-24', tier:'Mega' },
  { name:'Blackstone',       esg:79, climate:82, dei:75, hrdd:77, ilpa:89, aum:1000, vintage:'1987-24', tier:'Mega' },
  { name:'Apollo',           esg:74, climate:71, dei:72, hrdd:70, ilpa:85, aum:651, vintage:'1990-24', tier:'Mega' },
  { name:'Carlyle',          esg:77, climate:80, dei:76, hrdd:74, ilpa:88, aum:435, vintage:'1987-24', tier:'Mega' },
  { name:'TPG',              esg:83, climate:86, dei:82, hrdd:81, ilpa:91, aum:224, vintage:'1992-24', tier:'Mega' },
  { name:'Warburg Pincus',   esg:72, climate:69, dei:71, hrdd:68, ilpa:82, aum:82,  vintage:'1966-24', tier:'Mega' },
  { name:'Apax',             esg:68, climate:65, dei:67, hrdd:63, ilpa:79, aum:75,  vintage:'1981-24', tier:'Mid' },
  { name:'Bridgepoint',      esg:71, climate:74, dei:69, hrdd:66, ilpa:81, aum:44,  vintage:'1984-24', tier:'Mid' },
  { name:'EQT Partners',     esg:87, climate:94, dei:85, hrdd:72, ilpa:95, aum:232, vintage:'1994-24', tier:'Mid' },
  { name:'Nordic Capital',   esg:82, climate:88, dei:80, hrdd:76, ilpa:90, aum:36,  vintage:'1989-24', tier:'Mid' },
  { name:'CVC Capital',      esg:76, climate:73, dei:74, hrdd:71, ilpa:84, aum:186, vintage:'1981-24', tier:'Mid' },
  { name:'BC Partners',      esg:70, climate:68, dei:69, hrdd:65, ilpa:78, aum:44,  vintage:'1986-24', tier:'Mid' },
  { name:'General Atlantic', esg:79, climate:77, dei:81, hrdd:76, ilpa:87, aum:73,  vintage:'1980-24', tier:'Growth' },
  { name:'TA Associates',    esg:65, climate:60, dei:64, hrdd:61, ilpa:74, aum:47,  vintage:'1968-24', tier:'Growth' },
  { name:'Francisco Ptrs',   esg:62, climate:58, dei:60, hrdd:57, ilpa:70, aum:45,  vintage:'1999-24', tier:'Growth' },
  { name:'LeapFrog Invest',  esg:91, climate:88, dei:93, hrdd:90, ilpa:96, aum:2.1, vintage:'2007-24', tier:'Impact' },
  { name:'BlueOrchard',      esg:89, climate:85, dei:91, hrdd:88, ilpa:94, aum:8.5, vintage:'2001-24', tier:'Impact' },
  { name:'Vital Capital',    esg:88, climate:83, dei:90, hrdd:87, ilpa:93, aum:0.8, vintage:'2011-24', tier:'Impact' },
  { name:'Dev World Mkts',   esg:86, climate:81, dei:89, hrdd:86, ilpa:92, aum:0.4, vintage:'2009-24', tier:'Impact' },
  { name:'Summa Equity',     esg:93, climate:95, dei:92, hrdd:91, ilpa:97, aum:3.2, vintage:'2016-24', tier:'Impact' },
  { name:'Advent Intl',      esg:66, climate:63, dei:65, hrdd:62, ilpa:75, aum:88,  vintage:'1984-24', tier:'Mid' },
  { name:'Permira',          esg:73, climate:71, dei:72, hrdd:69, ilpa:83, aum:66,  vintage:'1985-24', tier:'Mid' },
  { name:'Cinven',           esg:69, climate:66, dei:68, hrdd:64, ilpa:78, aum:43,  vintage:'1977-24', tier:'Mid' },
  { name:'Investcorp',       esg:58, climate:54, dei:57, hrdd:52, ilpa:67, aum:51,  vintage:'1982-24', tier:'Mid' },
];

const DDQ_SECTIONS = [
  { section:'ESG Policy & Governance', questions:10, complete:'complete', score:91, peerMedian:72, bic:96 },
  { section:'Climate & Environment',    questions:12, complete:'complete', score:94, peerMedian:68, bic:97 },
  { section:'Social & Human Capital',   questions:11, complete:'complete', score:85, peerMedian:65, bic:92 },
  { section:'Governance & Ethics',      questions:9,  complete:'complete', score:89, peerMedian:74, bic:95 },
  { section:'Portfolio Co. ESG Mgmt',   questions:8,  complete:'partial',  score:82, peerMedian:60, bic:90 },
  { section:'Reporting & Transparency', questions:10, complete:'complete', score:90, peerMedian:71, bic:94 },
  { section:'Stakeholder Engagement',   questions:6,  complete:'partial',  score:78, peerMedian:58, bic:88 },
  { section:'Regulatory Compliance',    questions:7,  complete:'partial',  score:72, peerMedian:63, bic:91 },
];

const radarData = DDQ_SECTIONS.map(s => ({
  subject: s.section.length > 18 ? s.section.slice(0,18)+'…' : s.section,
  EQT: s.score, PeerMedian: s.peerMedian, BIC: s.bic,
}));

const RED_FLAGS = [
  { id:1, cat:'E', sev:'Critical', gp:'Investcorp',     desc:'No formal climate target or net-zero commitment in place',              src:'GP Disclosure 2023', action:'Require TCFD-aligned transition plan within 6 months' },
  { id:2, cat:'E', sev:'Critical', gp:'TA Associates',  desc:'Portfolio carbon intensity 3.4x sector benchmark (high-carbon holdings)',src:'Portfolio Review Q4-23', action:'Immediate portfolio decarbonisation roadmap required' },
  { id:3, cat:'E', sev:'High',     gp:'Francisco Ptrs', desc:'No biodiversity/TNFD policy; material exposure to land-use sectors',    src:'Public DDQ 2023', action:'Develop TNFD-aligned Nature strategy by Q2-24' },
  { id:4, cat:'E', sev:'High',     gp:'BC Partners',    desc:'EU Taxonomy alignment <15% — risk of SFDR greenwashing scrutiny',       src:'SFDR Disclosure', action:'Commission EU Taxonomy audit; update disclosures' },
  { id:5, cat:'E', sev:'Medium',   gp:'Apollo',         desc:'Marketing materials use "ESG-integrated" without methodology proof',    src:'Fund Marketing Docs', action:'Request evidence pack; independent verification' },
  { id:6, cat:'E', sev:'Medium',   gp:'Advent Intl',    desc:'Scope 3 emissions not measured for >60% of portfolio',                  src:'Annual ESG Report', action:'Engage portfolio Cos on Scope 3 data collection' },
  { id:7, cat:'S', sev:'Critical', gp:'Investcorp',     desc:'No Human Rights Due Diligence policy (UN Guiding Principles gap)',      src:'GP DDQ Response', action:'Mandatory HRDD framework implementation required' },
  { id:8, cat:'S', sev:'High',     gp:'Cinven',         desc:'Supply chain audit coverage <20%; apparel/consumer portfolio exposure', src:'Supply Chain Review', action:'Require supplier code of conduct & audit programme' },
  { id:9, cat:'S', sev:'High',     gp:'Warburg Pincus', desc:'Board gender diversity at portfolio Cos below 20% (ILPA benchmark 30%)',src:'Portfolio Data 2023', action:'Set binding diversity KPIs in management incentives' },
  { id:10,cat:'S', sev:'Medium',   gp:'Apax',           desc:'Employee turnover 28% — 1.8x industry average; engagement score low',  src:'HR Analytics Report', action:'Commission employee sentiment survey; retention plan' },
  { id:11,cat:'S', sev:'Medium',   gp:'Apollo',         desc:'Living wage compliance not verified across emerging market portfolio',  src:'ESG Audit 2023', action:'Living wage assessment & remediation timeline' },
  { id:12,cat:'G', sev:'Critical', gp:'Francisco Ptrs', desc:'No independent advisory board or LP advisory committee (LPAC)',         src:'Fund Docs Review', action:'Constitute LPAC with independent majority within 90 days' },
  { id:13,cat:'G', sev:'High',     gp:'Cinven',         desc:'Related party transactions undisclosed in annual report',              src:'Audit Report 2023', action:'Mandatory RPT disclosure framework; auditor sign-off' },
  { id:14,cat:'G', sev:'Medium',   gp:'TA Associates',  desc:'ESG reporting frequency annual-only; no interim KPI disclosure',        src:'Investor Relations', action:'Require semi-annual ESG KPI reporting to LPs' },
  { id:15,cat:'G', sev:'Medium',   gp:'Advent Intl',    desc:'Carried interest clawback provisions lack ESG-linked conditions',      src:'LPA Review', action:'Negotiate ESG ratchet clauses in next vintage' },
];

const PIE_RED = [
  { name:'Environment (E)', value:6, color:T.sage },
  { name:'Social (S)',       value:5, color:T.gold },
  { name:'Governance (G)',   value:4, color:T.navyL },
];

const PORTFOLIO_COS = [
  { co:'AlphaSoft',    sector:'Software',     rev:340, ebitdaM:31, scope12:1200,  esg:72, waci:35,  bdiv:38, turn:12 },
  { co:'MedCore',      sector:'Healthcare',   rev:520, ebitdaM:22, scope12:8400,  esg:65, waci:162, bdiv:33, turn:18 },
  { co:'IndustrialCo', sector:'Industrial',   rev:890, ebitdaM:18, scope12:42000, esg:41, waci:472, bdiv:22, turn:24 },
  { co:'ConsumerBrnd', sector:'Consumer',     rev:430, ebitdaM:24, scope12:5600,  esg:58, waci:130, bdiv:35, turn:21 },
  { co:'LogiFlow',     sector:'Logistics',    rev:610, ebitdaM:16, scope12:28000, esg:47, waci:459, bdiv:28, turn:19 },
  { co:'EnergyServ',   sector:'Energy Svcs',  rev:280, ebitdaM:29, scope12:15000, esg:53, waci:536, bdiv:25, turn:22 },
  { co:'DataHub',      sector:'Software',     rev:190, ebitdaM:36, scope12:600,   esg:78, waci:32,  bdiv:42, turn:10 },
  { co:'PharmaCo',     sector:'Healthcare',   rev:710, ebitdaM:28, scope12:6200,  esg:69, waci:87,  bdiv:40, turn:15 },
  { co:'PackagingCo',  sector:'Industrial',   rev:360, ebitdaM:20, scope12:18000, esg:44, waci:500, bdiv:20, turn:26 },
  { co:'FoodBrand',    sector:'Consumer',     rev:480, ebitdaM:21, scope12:9800,  esg:56, waci:204, bdiv:31, turn:20 },
  { co:'AutoParts',    sector:'Industrial',   rev:320, ebitdaM:17, scope12:22000, esg:39, waci:688, bdiv:18, turn:28 },
  { co:'TechPlatform', sector:'Software',     rev:260, ebitdaM:38, scope12:800,   esg:80, waci:31,  bdiv:45, turn:9  },
];

const scatterData = PORTFOLIO_COS.map(c => ({
  x: c.esg, y: c.ebitdaM, z: c.rev / 50, name: c.co, sector: c.sector,
}));

const PAI_TABLE = [
  { metric:'GHG Emissions (Scope 1+2)', unit:'tCO2e/€M invested', fund:234, ilpaBench:198, status:'amber' },
  { metric:'Carbon Footprint',           unit:'tCO2e',             fund:156700, ilpaBench:130000, status:'red' },
  { metric:'Fossil Fuel Exposure',       unit:'% revenue',         fund:12, ilpaBench:8, status:'amber' },
  { metric:'Board Gender Diversity',     unit:'% female',          fund:31, ilpaBench:34, status:'amber' },
  { metric:'Unadjusted Pay Gap',         unit:'% gap',             fund:18, ilpaBench:15, status:'amber' },
  { metric:'Human Rights Policy',        unit:'% cos with policy', fund:75, ilpaBench:82, status:'amber' },
  { metric:'Anti-Corruption Policy',     unit:'% cos with policy', fund:92, ilpaBench:88, status:'green' },
  { metric:'Water Emissions',            unit:'t to water/€M rev', fund:0.8, ilpaBench:1.2, status:'green' },
];

const VC_ARCHETYPES = [
  { type:'Platform Acquisition', days100:'Baseline ESG audit, policy gap analysis, board ESG committee', ebitdaUp:'+4-6%', exitMult:'+0.6x', irrBps:'+180 bps' },
  { type:'Add-on',               days100:'Integrate ESG standards from platform; quick wins in energy efficiency', ebitdaUp:'+2-3%', exitMult:'+0.3x', irrBps:'+90 bps' },
  { type:'Turnaround',           days100:'ESG risk triage, regulatory compliance, community relations rebuild', ebitdaUp:'+5-8%', exitMult:'+0.8x', irrBps:'+220 bps' },
  { type:'Growth Equity',        days100:'DEI & talent programmes, ESG-linked exec incentives, product ESG features', ebitdaUp:'+3-5%', exitMult:'+0.5x', irrBps:'+140 bps' },
  { type:'Pre-IPO',              days100:'TCFD disclosure, ESG rating agency engagement, ESG roadshow narrative', ebitdaUp:'+2-4%', exitMult:'+0.7x', irrBps:'+160 bps' },
  { type:'Secondary Buyout',     days100:'ESG data continuity, deepen GP commitments, LP ESG reporting upgrade', ebitdaUp:'+1-3%', exitMult:'+0.2x', irrBps:'+60 bps' },
];

const CASE_STUDIES = [
  {
    gp:'KKR', company:'Manufacturing Portfolio Co.',
    title:'Solar + Energy Efficiency Programme',
    actions:['Installed 2.4 MW rooftop solar across 4 facilities','LED lighting retrofit — 34% energy reduction','Energy management system deployment'],
    result:'$2.1M/yr OpEx savings; Scope 1+2 down 28%; ESG score +18pts',
    irrImpact:'+210 bps IRR contribution at exit',
    color:T.navy,
  },
  {
    gp:'EQT', company:'European Industrial Platform',
    title:'Supply Chain Human Rights DD',
    actions:['Tier-1 & Tier-2 supplier HRDD audit (340 suppliers)','Code of conduct rollout with training','Remediation programme for 23 at-risk suppliers'],
    result:'Supplier retention improved 22%; zero regulatory incidents; reputational risk eliminated',
    irrImpact:'+170 bps IRR from supply chain resilience',
    color:T.sage,
  },
  {
    gp:'TPG', company:'US Healthcare Services Co.',
    title:'DEI & Talent Acquisition Programme',
    actions:['Structured DEI hiring programme across 6 business units','Mentorship & sponsorship for underrepresented groups','Pay equity audit & remediation'],
    result:'Talent acquisition efficiency +34%; regrettable attrition -19%; employer brand NPS +28',
    irrImpact:'+190 bps IRR from workforce quality & retention',
    color:T.gold,
  },
];

const IRR_UPLIFT = [
  { initiative:'Solar & Renewables',         bps:210, fill:T.sage },
  { initiative:'Supply Chain HRDD',           bps:170, fill:T.navyL },
  { initiative:'DEI & Talent',                bps:190, fill:T.gold },
  { initiative:'Circular Economy',            bps:130, fill:'#7b8c9e' },
  { initiative:'Water Stewardship',           bps:90,  fill:T.sageL },
  { initiative:'ESG-Linked Exec Pay',         bps:150, fill:'#b07d4f' },
  { initiative:'TCFD Disclosure Programme',   bps:160, fill:T.navyL },
  { initiative:'Regulatory Compliance Uplift',bps:120, fill:'#8a6aaa' },
];

const ILPA_METRICS = [
  { metric:'Gross Revenue ($M)',        dataKey:'rev',    unit:'$M',     c0:95, c1:88, c2:72, c3:100, c4:90, c5:65, c6:100, c7:95, c8:85, c9:90, c10:60, c11:100 },
  { metric:'EBITDA ($M)',               dataKey:'ebitda', unit:'$M',     c0:95, c1:88, c2:72, c3:100, c4:90, c5:65, c6:100, c7:95, c8:85, c9:90, c10:60, c11:100 },
  { metric:'Scope 1 GHG (tCO2e)',       dataKey:'s1',     unit:'tCO2e',  c0:90, c1:80, c2:95, c3:85,  c4:92, c5:88, c6:95,  c7:82, c8:90, c9:85, c10:78, c11:95 },
  { metric:'Scope 2 GHG (tCO2e)',       dataKey:'s2',     unit:'tCO2e',  c0:90, c1:80, c2:95, c3:85,  c4:92, c5:88, c6:95,  c7:82, c8:90, c9:85, c10:78, c11:95 },
  { metric:'Scope 3 GHG (optional)',    dataKey:'s3',     unit:'tCO2e',  c0:40, c1:30, c2:55, c3:45,  c4:50, c5:35, c6:60,  c7:42, c8:48, c9:40, c10:28, c11:65 },
  { metric:'Total Energy (MWh)',        dataKey:'en',     unit:'MWh',    c0:85, c1:75, c2:90, c3:80,  c4:88, c5:82, c6:92,  c7:78, c8:86, c9:80, c10:70, c11:90 },
  { metric:'Renewable Energy (%)',      dataKey:'re',     unit:'%',      c0:70, c1:60, c2:80, c3:65,  c4:72, c5:68, c6:85,  c7:62, c8:75, c9:68, c10:55, c11:82 },
  { metric:'Employee Count (FTE)',      dataKey:'emp',    unit:'FTE',    c0:100,c1:98, c2:95, c3:100, c4:98, c5:92, c6:100, c7:97, c8:95, c9:98, c10:88, c11:100 },
  { metric:'TRIR (H&S)',                dataKey:'trir',   unit:'rate',   c0:75, c1:68, c2:88, c3:72,  c4:80, c5:74, c6:90,  c7:70, c8:78, c9:72, c10:62, c11:88 },
  { metric:'Board Gender Diversity (%)',dataKey:'bgd',    unit:'%',      c0:95, c1:90, c2:85, c3:100, c4:92, c5:82, c6:100, c7:88, c8:90, c9:92, c10:75, c11:100 },
  { metric:'Net New Hires (%)',         dataKey:'nnh',    unit:'%',      c0:80, c1:72, c2:78, c3:85,  c4:82, c5:70, c6:88,  c7:75, c8:80, c9:78, c10:65, c11:90 },
  { metric:'Employee Turnover (%)',     dataKey:'eturn',  unit:'%',      c0:88, c1:80, c2:85, c3:92,  c4:88, c5:75, c6:95,  c7:82, c8:88, c9:85, c10:70, c11:95 },
];

const coNames = PORTFOLIO_COS.map(c => c.co);

// ── Helpers ───────────────────────────────────────────────────────────────────
const KPI = ({ label, value, sub, color }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'16px 20px', boxShadow:T.card, flex:'1 1 180px', minWidth:160 }}>
    <div style={{ fontSize:11, color:T.textMut, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:26, fontWeight:700, color: color||T.navy, lineHeight:1.1 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>{sub}</div>}
  </div>
);

const Badge = ({ children, color }) => (
  <span style={{ background:`${color}22`, color, border:`1px solid ${color}55`, borderRadius:4, padding:'2px 7px', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>{children}</span>
);

const sevColor = s => s==='Critical'?T.red : s==='High'?T.amber : T.textSec;
const compColor = c => c==='complete'?T.green : c==='partial'?T.amber : T.red;
const pctColor = v => v>=90?T.green : v>=60?T.amber : T.red;

const TABS = [
  'GP Universe & Scoring',
  'ESG DD Questionnaire',
  'Red Flag Engine',
  'Portfolio ESG Aggregation',
  'ESG Value Creation Plan',
  'ILPA Reporting Template',
];

// ── Tab 1 ─────────────────────────────────────────────────────────────────────
const Tab1 = () => {
  const sorted = [...GP_UNIVERSE].sort((a,b) => b.esg - a.esg);
  const top6   = sorted.slice(0,6);
  const bot6   = sorted.slice(-6);
  const chartData = [
    ...top6.map(g => ({ name:g.name, ESG:g.esg, fill:T.sage })),
    ...bot6.map(g => ({ name:g.name, ESG:g.esg, fill:T.red  })),
  ];
  const tierColors = { Mega:T.navy, Mid:T.navyL, Growth:T.gold, Impact:T.sage };
  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
        <KPI label="Universe Avg ESG Score" value="64.2/100" sub="Across 24 GP firms" />
        <KPI label="Net Zero Commitment" value="58%" sub="14 of 24 GPs committed" color={T.sage} />
        <KPI label="SFDR Article 8+ Reporting" value="71%" sub="17 of 24 GPs compliant" color={T.navyL} />
        <KPI label="ILPA DDQ Compliance" value="83%" sub="20 of 24 GPs filing" color={T.gold} />
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, marginBottom:24, boxShadow:T.card }}>
        <div style={{ fontWeight:700, color:T.navy, marginBottom:14, fontSize:14 }}>Top 6 vs Bottom 6 GPs — ESG Score</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top:4, right:16, left:0, bottom:40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize:11, fill:T.textSec }} angle={-30} textAnchor="end" interval={0} />
            <YAxis domain={[0,100]} tick={{ fontSize:11, fill:T.textSec }} />
            <Tooltip formatter={v=>[v+'/100','ESG Score']} contentStyle={{ fontSize:12, borderRadius:6, border:`1px solid ${T.border}` }} />
            <Bar dataKey="ESG" radius={[4,4,0,0]}>
              {chartData.map((e,i) => <Cell key={i} fill={e.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, boxShadow:T.card, overflowX:'auto' }}>
        <div style={{ fontWeight:700, color:T.navy, marginBottom:14, fontSize:14 }}>Full GP Universe — ESG Scorecard</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:T.surfaceH }}>
              {['GP Firm','Tier','AUM ($bn)','Vintage','ESG Policy','Climate','DEI','HRDD','ILPA %'].map(h => (
                <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((g,i) => (
              <tr key={g.name} style={{ background: i%2===0?T.surface:T.surfaceH }}>
                <td style={{ padding:'7px 10px', fontWeight:600, color:T.navy }}>{g.name}</td>
                <td style={{ padding:'7px 10px' }}><Badge color={tierColors[g.tier]}>{g.tier}</Badge></td>
                <td style={{ padding:'7px 10px', color:T.textSec }}>{g.aum < 10 ? g.aum.toFixed(1) : g.aum}</td>
                <td style={{ padding:'7px 10px', color:T.textMut, fontSize:11 }}>{g.vintage}</td>
                {[g.esg, g.climate, g.dei, g.hrdd].map((v,j) => (
                  <td key={j} style={{ padding:'7px 10px' }}>
                    <span style={{ color: v>=80?T.green:v>=65?T.amber:T.red, fontWeight:600 }}>{v}</span>
                  </td>
                ))}
                <td style={{ padding:'7px 10px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ flex:1, background:T.border, borderRadius:4, height:6 }}>
                      <div style={{ width:`${g.ilpa}%`, background: g.ilpa>=85?T.green:g.ilpa>=70?T.amber:T.red, height:6, borderRadius:4 }} />
                    </div>
                    <span style={{ fontSize:11, color:T.textSec, width:28 }}>{g.ilpa}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Tab 2 ─────────────────────────────────────────────────────────────────────
const Tab2 = () => (
  <div>
    <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:20 }}>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'10px 16px', boxShadow:T.card }}>
        <span style={{ color:T.textSec, fontSize:12 }}>Selected GP: </span>
        <span style={{ fontWeight:700, color:T.navy, fontSize:14 }}>EQT Partners</span>
      </div>
      <div style={{ background:`${T.sage}15`, border:`1px solid ${T.sage}40`, borderRadius:8, padding:'10px 16px' }}>
        <span style={{ color:T.textSec, fontSize:12 }}>Overall DDQ Score: </span>
        <span style={{ fontWeight:700, color:T.sage, fontSize:18 }}>87/100</span>
      </div>
      <div style={{ background:`${T.gold}15`, border:`1px solid ${T.gold}40`, borderRadius:8, padding:'10px 16px' }}>
        <span style={{ color:T.textSec, fontSize:12 }}>Sections Complete: </span>
        <span style={{ fontWeight:700, color:T.gold, fontSize:18 }}>5/8</span>
      </div>
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, boxShadow:T.card }}>
        <div style={{ fontWeight:700, color:T.navy, marginBottom:14, fontSize:14 }}>DDQ Section Scores — EQT vs Peers</div>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData} margin={{ top:8, right:30, bottom:8, left:30 }}>
            <PolarGrid stroke={T.border} />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize:9, fill:T.textSec }} />
            <PolarRadiusAxis domain={[0,100]} tick={{ fontSize:9 }} />
            <Radar name="EQT" dataKey="EQT" stroke={T.sage} fill={T.sage} fillOpacity={0.25} strokeWidth={2} />
            <Radar name="Peer Median" dataKey="PeerMedian" stroke={T.gold} fill={T.gold} fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" />
            <Radar name="Best-in-Class" dataKey="BIC" stroke={T.navyL} fill={T.navyL} fillOpacity={0.05} strokeWidth={1} strokeDasharray="2 2" />
            <Legend wrapperStyle={{ fontSize:11 }} />
            <Tooltip contentStyle={{ fontSize:12, borderRadius:6, border:`1px solid ${T.border}` }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, boxShadow:T.card }}>
        <div style={{ fontWeight:700, color:T.navy, marginBottom:14, fontSize:14 }}>Section Breakdown</div>
        {DDQ_SECTIONS.map((s,i) => (
          <div key={i} style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, alignItems:'center' }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{s.section}</div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <Badge color={compColor(s.complete)}>{s.complete}</Badge>
                <span style={{ fontSize:13, fontWeight:700, color: s.score>=85?T.green:s.score>=75?T.amber:T.red }}>{s.score}/100</span>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ flex:1, background:T.border, borderRadius:4, height:7 }}>
                <div style={{ width:`${s.score}%`, background: s.score>=85?T.sage:s.score>=75?T.gold:T.red, height:7, borderRadius:4 }} />
              </div>
              <span style={{ fontSize:10, color:T.textMut, width:100 }}>Peer: {s.peerMedian} | BIC: {s.bic}</span>
            </div>
            <div style={{ fontSize:10, color:T.textMut, marginTop:2 }}>{s.questions} questions</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Tab 3 ─────────────────────────────────────────────────────────────────────
const Tab3 = () => {
  const flagCounts = GP_UNIVERSE.reduce((acc, g) => {
    acc[g.name] = RED_FLAGS.filter(f => f.gp === g.name).length;
    return acc;
  }, {});
  const leagueTable = Object.entries(flagCounts).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);

  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        <KPI label="Total Red Flags" value="15" sub="Across 24 GPs" color={T.red} />
        <KPI label="Critical Flags" value="4" sub="Immediate action required" color={T.red} />
        <KPI label="High Severity" value="6" sub="Escalated review" color={T.amber} />
        <KPI label="GPs with Flags" value="9" sub="37.5% of universe" color={T.navyL} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:20, marginBottom:20 }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, boxShadow:T.card }}>
          <div style={{ fontWeight:700, color:T.navy, marginBottom:14, fontSize:14 }}>Flags by ESG Pillar</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={PIE_RED} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name,value })=>`${name.split(' ')[0]}: ${value}`} labelLine={{ stroke:T.border }} fontSize={11}>
                {PIE_RED.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize:12, borderRadius:6, border:`1px solid ${T.border}` }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop:8 }}>
            <div style={{ fontWeight:700, color:T.navy, marginBottom:8, fontSize:12 }}>GP Flag League Table</div>
            {leagueTable.map(([gp,n],i) => (
              <div key={gp} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                <span style={{ color:T.text }}>{i+1}. {gp}</span>
                <Badge color={n>=2?T.red:T.amber}>{n} flag{n>1?'s':''}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, boxShadow:T.card, overflowX:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontWeight:700, color:T.navy, fontSize:14 }}>Auto-Scan Results — All 24 GPs</div>
            <button style={{ background:T.navy, color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              Re-run Auto-Scan
            </button>
          </div>
          {RED_FLAGS.map((f,i) => (
            <div key={i} style={{ background: i%2===0?T.surface:T.surfaceH, border:`1px solid ${T.border}`, borderRadius:8, padding:'10px 14px', marginBottom:8 }}>
              <div style={{ display:'flex', gap:8, alignItems:'flex-start', flexWrap:'wrap' }}>
                <Badge color={sevColor(f.sev)}>{f.sev}</Badge>
                <Badge color={f.cat==='E'?T.sage:f.cat==='S'?T.gold:T.navyL}>{f.cat}</Badge>
                <span style={{ fontSize:12, fontWeight:600, color:T.navy }}>{f.gp}</span>
              </div>
              <div style={{ fontSize:12, color:T.text, margin:'6px 0 4px' }}>{f.desc}</div>
              <div style={{ fontSize:11, color:T.textMut }}>Source: {f.src}</div>
              <div style={{ fontSize:11, color:T.navyL, marginTop:3 }}>Action: {f.action}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Tab 4 ─────────────────────────────────────────────────────────────────────
const Tab4 = () => (
  <div>
    <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
      <KPI label="Fund Avg ESG Score" value="58.3/100" sub="Weighted avg, 12 cos" />
      <KPI label="Fund WACI" value="234 tCO2e/$M" sub="vs IPCC pathway 180" color={T.amber} />
      <KPI label="Board Gender Diversity" value="31%" sub="vs ILPA benchmark 34%" color={T.amber} />
      <KPI label="Avg Employee Turnover" value="19.5%" sub="vs sector avg 16%" color={T.red} />
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, boxShadow:T.card }}>
        <div style={{ fontWeight:700, color:T.navy, marginBottom:6, fontSize:14 }}>ESG-EBITDA Matrix</div>
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>Bubble = revenue scale | X-axis = ESG score | Y-axis = EBITDA margin %</div>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top:4, right:16, left:0, bottom:4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" dataKey="x" domain={[30,85]} name="ESG Score" tick={{ fontSize:11, fill:T.textSec }} label={{ value:'ESG Score', position:'insideBottom', offset:-2, fontSize:11, fill:T.textSec }} />
            <YAxis type="number" dataKey="y" domain={[14,42]} name="EBITDA Margin %" tick={{ fontSize:11, fill:T.textSec }} label={{ value:'EBITDA %', angle:-90, position:'insideLeft', fontSize:11, fill:T.textSec }} />
            <ZAxis type="number" dataKey="z" range={[40,400]} />
            <Tooltip cursor={{ strokeDasharray:'3 3' }} content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, padding:'8px 12px', fontSize:12 }}>
                  <div style={{ fontWeight:600, color:T.navy }}>{d.name}</div>
                  <div>ESG: {d.x} | EBITDA: {d.y}% | Rev: ${(d.z*50).toFixed(0)}M</div>
                </div>
              );
            }} />
            <Scatter data={scatterData} fill={T.navyL} fillOpacity={0.75} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, boxShadow:T.card, overflowX:'auto' }}>
        <div style={{ fontWeight:700, color:T.navy, marginBottom:14, fontSize:14 }}>Portfolio Company ESG Heatmap</div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr style={{ background:T.surfaceH }}>
              {['Company','Sector','ESG','WACI','Bdiv%','Turnover%','Scope 1+2'].map(h => (
                <th key={h} style={{ padding:'6px 8px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PORTFOLIO_COS.map((c,i) => (
              <tr key={i} style={{ background: i%2===0?T.surface:T.surfaceH }}>
                <td style={{ padding:'6px 8px', fontWeight:600, color:T.navy }}>{c.co}</td>
                <td style={{ padding:'6px 8px', color:T.textSec }}>{c.sector}</td>
                <td style={{ padding:'6px 8px' }}>
                  <span style={{ fontWeight:700, color: c.esg>=70?T.green:c.esg>=55?T.amber:T.red }}>{c.esg}</span>
                </td>
                <td style={{ padding:'6px 8px' }}>
                  <span style={{ color: c.waci<100?T.green:c.waci<300?T.amber:T.red }}>{c.waci}</span>
                </td>
                <td style={{ padding:'6px 8px' }}>
                  <span style={{ color: c.bdiv>=35?T.green:c.bdiv>=25?T.amber:T.red }}>{c.bdiv}%</span>
                </td>
                <td style={{ padding:'6px 8px' }}>
                  <span style={{ color: c.turn<=15?T.green:c.turn<=22?T.amber:T.red }}>{c.turn}%</span>
                </td>
                <td style={{ padding:'6px 8px', color:T.textSec }}>{c.scope12.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, boxShadow:T.card, overflowX:'auto' }}>
      <div style={{ fontWeight:700, color:T.navy, marginBottom:14, fontSize:14 }}>SFDR Article 8 PAI Indicators</div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
        <thead>
          <tr style={{ background:T.surfaceH }}>
            {['PAI Metric','Unit','Fund','ILPA Benchmark','Status'].map(h => (
              <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PAI_TABLE.map((p,i) => (
            <tr key={i} style={{ background: i%2===0?T.surface:T.surfaceH }}>
              <td style={{ padding:'7px 10px', fontWeight:600, color:T.navy }}>{p.metric}</td>
              <td style={{ padding:'7px 10px', color:T.textMut, fontSize:11 }}>{p.unit}</td>
              <td style={{ padding:'7px 10px', fontWeight:600 }}>{typeof p.fund==='number'&&p.fund>1000?p.fund.toLocaleString():p.fund}</td>
              <td style={{ padding:'7px 10px', color:T.textSec }}>{typeof p.ilpaBench==='number'&&p.ilpaBench>1000?p.ilpaBench.toLocaleString():p.ilpaBench}</td>
              <td style={{ padding:'7px 10px' }}>
                <Badge color={p.status==='green'?T.green:p.status==='amber'?T.amber:T.red}>
                  {p.status==='green'?'On Track':p.status==='amber'?'Below Benchmark':'Underperforming'}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ── Tab 5 ─────────────────────────────────────────────────────────────────────
const Tab5 = () => (
  <div>
    <div style={{ background:`${T.navy}08`, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:20, fontSize:13, color:T.textSec }}>
      <strong style={{ color:T.navy }}>Bain 2024 Research:</strong> Companies in the top ESG quartile at exit achieve <strong style={{ color:T.sage }}>1.8x–2.1x EBITDA multiple premium</strong> over bottom quartile, contributing +150–220 bps IRR across the holding period.
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
      {VC_ARCHETYPES.map((a,i) => (
        <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:18, boxShadow:T.card }}>
          <div style={{ fontWeight:700, color:T.navy, marginBottom:8, fontSize:13 }}>{a.type}</div>
          <div style={{ fontSize:11, color:T.textSec, marginBottom:10, lineHeight:1.5 }}>
            <strong>100-Day Playbook:</strong> {a.days100}
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <div style={{ background:`${T.sage}15`, border:`1px solid ${T.sage}40`, borderRadius:6, padding:'4px 8px', fontSize:11 }}>
              <span style={{ color:T.textMut }}>EBITDA uplift: </span>
              <strong style={{ color:T.sage }}>{a.ebitdaUp}</strong>
            </div>
            <div style={{ background:`${T.gold}15`, border:`1px solid ${T.gold}40`, borderRadius:6, padding:'4px 8px', fontSize:11 }}>
              <span style={{ color:T.textMut }}>Exit mult: </span>
              <strong style={{ color:T.gold }}>{a.exitMult}</strong>
            </div>
            <div style={{ background:`${T.navyL}15`, border:`1px solid ${T.navyL}40`, borderRadius:6, padding:'4px 8px', fontSize:11 }}>
              <strong style={{ color:T.navyL }}>{a.irrBps}</strong>
            </div>
          </div>
        </div>
      ))}
    </div>

    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
      <div>
        {CASE_STUDIES.map((c,i) => (
          <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderLeft:`4px solid ${c.color}`, borderRadius:10, padding:18, marginBottom:16, boxShadow:T.card }}>
            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
              <Badge color={c.color}>{c.gp}</Badge>
              <span style={{ fontSize:12, color:T.textSec }}>{c.company}</span>
            </div>
            <div style={{ fontWeight:700, color:T.navy, marginBottom:8, fontSize:13 }}>{c.title}</div>
            <ul style={{ margin:'0 0 10px 16px', padding:0 }}>
              {c.actions.map((a,j) => (
                <li key={j} style={{ fontSize:12, color:T.textSec, marginBottom:3 }}>{a}</li>
              ))}
            </ul>
            <div style={{ fontSize:12, color:T.sage, fontWeight:600, marginBottom:4 }}>{c.result}</div>
            <div style={{ fontSize:12, color:c.color, fontWeight:700 }}>{c.irrImpact}</div>
          </div>
        ))}
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, boxShadow:T.card }}>
        <div style={{ fontWeight:700, color:T.navy, marginBottom:14, fontSize:14 }}>ESG Initiative IRR Uplift (bps)</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={IRR_UPLIFT} layout="vertical" margin={{ top:4, right:20, left:140, bottom:4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false} />
            <XAxis type="number" domain={[0,250]} tick={{ fontSize:11, fill:T.textSec }} />
            <YAxis type="category" dataKey="initiative" tick={{ fontSize:10, fill:T.textSec }} width={130} />
            <Tooltip formatter={v=>[v+' bps','IRR Uplift']} contentStyle={{ fontSize:12, borderRadius:6, border:`1px solid ${T.border}` }} />
            <Bar dataKey="bps" radius={[0,4,4,0]}>
              {IRR_UPLIFT.map((e,i) => <Cell key={i} fill={e.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

// ── Tab 6 ─────────────────────────────────────────────────────────────────────
const Tab6 = () => {
  const colKeys = ['c0','c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','c11'];
  const avgCompletion = ILPA_METRICS.map(m => {
    const vals = colKeys.map(k => m[k]);
    return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
  });
  const overallAvg = Math.round(avgCompletion.reduce((a,b)=>a+b,0)/avgCompletion.length);

  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        <KPI label="Overall ILPA DCP Completion" value={`${overallAvg}%`} sub="12 metrics × 12 companies" color={T.sage} />
        <KPI label="ILPA DCP Universe" value="2,000+" sub="Portfolio companies globally" />
        <KPI label="Metrics > 90% Complete" value="4/12" sub="Financial & headcount metrics" color={T.green} />
        <KPI label="Metrics < 60% Complete" value="1/12" sub="Scope 3 GHG (optional)" color={T.amber} />
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, marginBottom:20, boxShadow:T.card, overflowX:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div style={{ fontWeight:700, color:T.navy, fontSize:14 }}>ILPA ESG Data Convergence Project — Completion Matrix</div>
          <button style={{ background:T.sage, color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            Generate ILPA Report
          </button>
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr style={{ background:T.surfaceH }}>
              <th style={{ padding:'8px 10px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, minWidth:200 }}>ILPA DCP Metric</th>
              {coNames.map(n => (
                <th key={n} style={{ padding:'6px 6px', textAlign:'center', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, fontSize:10, minWidth:72 }}>
                  {n.length>9?n.slice(0,9)+'…':n}
                </th>
              ))}
              <th style={{ padding:'8px 8px', textAlign:'center', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, minWidth:56 }}>Avg</th>
            </tr>
          </thead>
          <tbody>
            {ILPA_METRICS.map((m,i) => (
              <tr key={i} style={{ background: i%2===0?T.surface:T.surfaceH }}>
                <td style={{ padding:'7px 10px', fontWeight:600, color:T.navy, fontSize:11 }}>{m.metric}</td>
                {colKeys.map(k => {
                  const v = m[k];
                  const bg = v>=90?`${T.green}22`:v>=60?`${T.amber}22`:`${T.red}22`;
                  const col = v>=90?T.green:v>=60?T.amber:T.red;
                  return (
                    <td key={k} style={{ padding:'6px', textAlign:'center', background:bg }}>
                      <span style={{ fontWeight:700, color:col, fontSize:11 }}>{v}%</span>
                    </td>
                  );
                })}
                <td style={{ padding:'6px 8px', textAlign:'center', background:`${pctColor(avgCompletion[i])}22` }}>
                  <span style={{ fontWeight:700, color:pctColor(avgCompletion[i]), fontSize:12 }}>{avgCompletion[i]}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, boxShadow:T.card }}>
        <div style={{ fontWeight:700, color:T.navy, marginBottom:14, fontSize:14 }}>Peer Benchmarking vs ILPA DCP Aggregate (2,000+ Portfolio Cos)</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={ILPA_METRICS.map((m,i) => ({ name: m.metric.split('(')[0].trim().slice(0,22), fund:avgCompletion[i], ilpa:Math.round(55+sr(i)*30) }))}
            margin={{ top:4, right:16, left:0, bottom:60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize:9, fill:T.textSec }} angle={-35} textAnchor="end" interval={0} />
            <YAxis domain={[0,100]} tick={{ fontSize:11, fill:T.textSec }} tickFormatter={v=>v+'%'} />
            <Tooltip formatter={v=>[v+'%']} contentStyle={{ fontSize:12, borderRadius:6, border:`1px solid ${T.border}` }} />
            <Legend wrapperStyle={{ fontSize:11 }} />
            <Bar dataKey="fund" name="This Fund" fill={T.navy} radius={[3,3,0,0]}>
              {ILPA_METRICS.map((_,i) => <Cell key={i} fill={avgCompletion[i]>=90?T.green:avgCompletion[i]>=60?T.gold:T.red} />)}
            </Bar>
            <Bar dataKey="ilpa" name="ILPA DCP Benchmark" fill={T.border} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PeEsgDiligencePage() {
  const [activeTab, setActiveTab] = useState(0);

  const tabContent = [<Tab1 />, <Tab2 />, <Tab3 />, <Tab4 />, <Tab5 />, <Tab6 />];

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, padding:'24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <div style={{ background:T.navy, color:'#fff', borderRadius:6, padding:'4px 10px', fontSize:11, fontWeight:700, letterSpacing:'0.04em' }}>EP-AG1</div>
              <div style={{ fontSize:11, color:T.textMut }}>AA Impact Risk Analytics Platform</div>
            </div>
            <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:T.navy, letterSpacing:'-0.02em' }}>
              Private Equity ESG Diligence
            </h1>
            <div style={{ fontSize:13, color:T.textSec, marginTop:4 }}>
              GP universe scoring, ILPA DDQ framework, red flag engine, and portfolio ESG aggregation
            </div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {['ILPA ESG','24 GPs','DD Questionnaire','Red Flag Engine','ESG Value Creation'].map(b => (
              <Badge key={b} color={T.navyL}>{b}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display:'flex', gap:2, marginBottom:24, borderBottom:`1px solid ${T.border}`, overflowX:'auto' }}>
        {TABS.map((t,i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            style={{
              background: activeTab===i ? T.navy : 'transparent',
              color: activeTab===i ? '#fff' : T.textSec,
              border:'none',
              borderBottom: activeTab===i ? `2px solid ${T.navy}` : '2px solid transparent',
              borderRadius:'6px 6px 0 0',
              padding:'10px 16px',
              fontSize:13,
              fontWeight: activeTab===i ? 700 : 400,
              cursor:'pointer',
              whiteSpace:'nowrap',
              fontFamily:T.font,
              transition:'all 0.15s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>{tabContent[activeTab]}</div>
    </div>
  );
}
