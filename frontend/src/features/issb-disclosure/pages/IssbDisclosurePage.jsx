import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar,
} from 'recharts';

/* ============================================================ THEME */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ============================================================ HELPERS */
const pill = (label, color) => (
  <span style={{background:`${color}18`,color,border:`1px solid ${color}40`,borderRadius:99,padding:'2px 10px',fontSize:11,fontWeight:600,whiteSpace:'nowrap'}}>{label}</span>
);
const statusColor = s => s==='Complete'?T.green:s==='In Progress'?T.amber:T.red;
const Card = ({children,style={}}) => (
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'18px 20px',boxShadow:T.card,...style}}>{children}</div>
);
const SectionTitle = ({children}) => (
  <div style={{fontSize:13,fontWeight:700,color:T.navy,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:12}}>{children}</div>
);
const KpiCard = ({label,value,sub,color=T.navy}) => (
  <Card style={{flex:1,minWidth:160}}>
    <div style={{fontSize:26,fontWeight:800,color,fontVariantNumeric:'tabular-nums'}}>{value}</div>
    <div style={{fontSize:13,fontWeight:600,color:T.text,marginTop:2}}>{label}</div>
    {sub&&<div style={{fontSize:11,color:T.textMut,marginTop:2}}>{sub}</div>}
  </Card>
);

/* ============================================================ DATA */
const ADOPTION_DATA = [
  {jurisdiction:'New Zealand',region:'Asia-Pacific',standard:'XRB Aotearoa',status:'Mandatory',scope:'Large listed + FMC',effective:'FY2023',gdpBn:250,diff:'First globally — broad entity scope'},
  {jurisdiction:'UK',region:'Europe',standard:'UK SRS (ISSB-aligned)',status:'Mandatory',scope:'Premium listed (TCFD → ISSB)',effective:'FY2025',gdpBn:3100,diff:'UK-specific carve-outs under review'},
  {jurisdiction:'Australia',region:'Asia-Pacific',standard:'AASB S1/S2',status:'Mandatory',scope:'Large entities (Group 1)',effective:'FY2025',gdpBn:1700,diff:'Phased: Group 1→2→3 over 3 yrs'},
  {jurisdiction:'Singapore',region:'Asia-Pacific',standard:'SGX ISSB',status:'Mandatory',scope:'SGX-listed large',effective:'FY2025',gdpBn:500,diff:'Climate first; S1 from FY2026'},
  {jurisdiction:'Brazil',region:'Americas',standard:'CVM ISSB',status:'Mandatory',scope:'Listed companies',effective:'FY2025',gdpBn:2100,diff:'Portuguese language disclosure'},
  {jurisdiction:'Nigeria',region:'Africa',standard:'FRCN ISSB',status:'Mandatory',scope:'Public interest entities',effective:'FY2025',gdpBn:480,diff:'First African ISSB mandate'},
  {jurisdiction:'Hong Kong',region:'Asia-Pacific',standard:'HKEX ISSB',status:'Mandatory',scope:'Large listed',effective:'FY2025',gdpBn:370,diff:'SFC climate mandate aligned'},
  {jurisdiction:'Switzerland',region:'Europe',standard:'Swiss ISSB',status:'Mandatory',scope:'Large PIEs >500 employees',effective:'FY2024',gdpBn:870,diff:'Linked to CO2 Act obligations'},
  {jurisdiction:'Japan',region:'Asia-Pacific',standard:'SSBJ S1/S2',status:'Voluntary→Mandatory',scope:'Prime Market listed',effective:'FY2027 (mandatory)',gdpBn:4200,diff:'SSBJ standards near-identical to ISSB'},
  {jurisdiction:'South Korea',region:'Asia-Pacific',standard:'K-ISSB',status:'Voluntary→Mandatory',scope:'KOSPI listed',effective:'FY2030 (mandatory)',gdpBn:1600,diff:'Phased rollout by market cap'},
  {jurisdiction:'Canada',region:'Americas',standard:'CSA ISSB',status:'Consultation',scope:'Reporting issuers',effective:'TBD 2026',gdpBn:2100,diff:'CSA NI 51-107 consultation 2024'},
  {jurisdiction:'EU',region:'Europe',standard:'ESRS (ISSB-interoperable)',status:'Mandatory',scope:'Large CSRD-scope entities',effective:'FY2024 (phased)',gdpBn:17000,diff:'ESRS ≠ ISSB but endorsed interoperable'},
  {jurisdiction:'USA',region:'Americas',standard:'SEC Climate Rule',status:'Stayed',scope:'SEC registrants',effective:'TBD (legal challenges)',gdpBn:27000,diff:'Own rule — not ISSB; legal stay 2024'},
  {jurisdiction:'India',region:'Asia-Pacific',standard:'SEBI BRSR Core',status:'Mandatory',scope:'Top 1000 listed',effective:'FY2024',gdpBn:3500,diff:'BRSR Core aligned to ISSB metrics'},
  {jurisdiction:'South Africa',region:'Africa',standard:'JSE ISSB',status:'Mandatory',scope:'JSE-listed',effective:'FY2024',gdpBn:420,diff:'King IV integrated reporting context'},
  {jurisdiction:'Malaysia',region:'Asia-Pacific',standard:'Bursa ISSB',status:'Voluntary',scope:'Bursa-listed',effective:'Voluntary 2025',gdpBn:380,diff:'SC sustainable finance roadmap'},
  {jurisdiction:'Thailand',region:'Asia-Pacific',standard:'SEC Thailand ISSB',status:'Voluntary',scope:'SET-listed',effective:'Consultation 2025',gdpBn:500,diff:'BOT climate stress test linked'},
  {jurisdiction:'Indonesia',region:'Asia-Pacific',standard:'OJK ISSB',status:'Voluntary',scope:'IDX-listed',effective:'TBD',gdpBn:1320,diff:'OJK sustainable finance roadmap'},
  {jurisdiction:'Mexico',region:'Americas',standard:'BMV ISSB',status:'Voluntary',scope:'BMV-listed',effective:'TBD',gdpBn:1270,diff:'CNBV consultation underway'},
  {jurisdiction:'Chile',region:'Americas',standard:'CMF ISSB',status:'Voluntary',scope:'CMF-listed',effective:'TBD',gdpBn:360,diff:'CMF clima disclosure framework'},
];

const ADOPTION_MOMENTUM = [
  {year:'2023',mandatory:2,voluntary:3,total:5},
  {year:'2024',mandatory:5,voluntary:6,total:11},
  {year:'2025',mandatory:10,voluntary:7,total:17},
  {year:'2026',mandatory:12,voluntary:6,total:18},
  {year:'2027',mandatory:15,voluntary:5,total:20},
];

const S1_PILLARS = [
  {pillar:'Governance',score:78,reqs:[
    {code:'S1-GOV-a',label:'Board oversight of sustainability risks/opportunities',status:'Complete',source:'Board Risk Committee Charter',quality:90},
    {code:'S1-GOV-b',label:"Management's role in governance processes",status:'Complete',source:'CEO Sustainability Report',quality:85},
  ]},
  {pillar:'Strategy',score:62,reqs:[
    {code:'S1-STR-a',label:'Sustainability risks and opportunities identified',status:'Complete',source:'Double Materiality Assessment',quality:88},
    {code:'S1-STR-b',label:'Effects on business model and value chain',status:'In Progress',source:'Value Chain Analysis Module',quality:65},
    {code:'S1-STR-c',label:'Effects on strategy and decision-making',status:'In Progress',source:'Strategic Planning Integration',quality:60},
    {code:'S1-STR-d',label:'Resilience of strategy (scenario analysis)',status:'In Progress',source:'Scenario Analysis Engine (Tab 4)',quality:55},
  ]},
  {pillar:'Risk Management',score:71,reqs:[
    {code:'S1-RM-a',label:'Processes for identifying and assessing risks',status:'Complete',source:'Enterprise Risk Management Framework',quality:82},
    {code:'S1-RM-b',label:'Processes for monitoring and managing risks',status:'Complete',source:'Risk Dashboard',quality:78},
    {code:'S1-RM-c',label:'Integration into overall risk management',status:'In Progress',source:'ERM Integration Project',quality:62},
  ]},
  {pillar:'Metrics & Targets',score:54,reqs:[
    {code:'S1-MT-a',label:'Metrics used for sustainability risks/opportunities',status:'In Progress',source:'ESG Data Platform',quality:68},
    {code:'S1-MT-b',label:'Cross-industry metric categories (IFRS S1 App B)',status:'In Progress',source:'Cross-Industry Metrics Module',quality:55},
    {code:'S1-MT-c',label:'Industry-based metrics (SASB standards)',status:'Not Started',source:'SASB Tab (Tab 5)',quality:20},
    {code:'S1-MT-d',label:'Targets set for sustainability risks/opportunities',status:'Not Started',source:'Targets & Commitments Registry',quality:15},
  ]},
];

const RADAR_DATA = S1_PILLARS.map(p=>({pillar:p.pillar,score:p.score}));

const S2_REQUIREMENTS = [
  {id:1,title:'Climate Governance',tcfd:'Governance a/b',para:'IFRS S2 para 6–9',status:'Complete',platformModule:'Board ESG Dashboard',disclosure:'The Board of Directors, through the Sustainability Committee, oversees climate-related risks and opportunities on a quarterly basis. The Chief Sustainability Officer reports directly to the CEO and maintains accountability for climate strategy execution.'},
  {id:2,title:'Climate Risks/Opportunities in Strategy',tcfd:'Strategy a/b/c',para:'IFRS S2 para 10–19',status:'In Progress',platformModule:'Climate Risk Analytics',disclosure:'The entity has identified 12 material climate-related risks across its value chain, spanning transition risks (policy, technology, market) and physical risks (acute and chronic). These are integrated into the 3-year strategic plan with a dedicated climate CapEx envelope of $450M through 2030.'},
  {id:3,title:'Climate Scenario Analysis',tcfd:'Strategy d',para:'IFRS S2 para 20–21',status:'In Progress',platformModule:'Scenario Analysis Engine (Tab 4)',disclosure:'The entity assessed climate resilience under three scenarios consistent with NGFS/IEA frameworks: Net Zero 2050 (1.5°C), Delayed Transition (2°C), and High Physical Risk (3°C+). Scenario analysis covers 2030, 2040, and 2050 time horizons.'},
  {id:4,title:'Climate Risk Management',tcfd:'Risk Management a/b/c',para:'IFRS S2 para 22–26',status:'Complete',platformModule:'Enterprise Risk Management',disclosure:'Climate risks are identified through annual climate risk assessments integrated with the Enterprise Risk Management framework. Physical risks are assessed using IPCC AR6 data; transition risks are monitored via carbon price sensitivity analysis updated quarterly.'},
  {id:5,title:'GHG Emissions (Scope 1, 2, 3)',tcfd:'Metrics a',para:'IFRS S2 para 29–36',status:'In Progress',platformModule:'GHG Accounting Engine',disclosure:'Scope 1: 45,200 tCO2e | Scope 2 (market-based): 28,400 tCO2e | Scope 3: 412,000 tCO2e (15 categories). Scope 3 reported with 1-year phase-in relief per IFRS S2 para C4 for first reporting year.'},
  {id:6,title:'Climate Targets',tcfd:'Metrics b/c',para:'IFRS S2 para 37–42',status:'Not Started',platformModule:'Targets & Net Zero Registry',disclosure:'[Disclosure text pending — Targets module integration in progress. SBTi 1.5°C-aligned targets to be disclosed: Scope 1+2 50% reduction by 2030 vs 2019 baseline; Net Zero by 2050.]'},
];

const TCFD_ISSB_MAP = [
  {tcfd:'Governance (a) — Board oversight',issb:'IFRS S2 para 6',status:'Direct mapping'},
  {tcfd:'Governance (b) — Management role',issb:'IFRS S2 para 7–9',status:'Direct mapping'},
  {tcfd:'Strategy (a) — Risks/opportunities',issb:'IFRS S2 para 10–14',status:'Enhanced — time horizons required'},
  {tcfd:'Strategy (b) — Impact on organisation',issb:'IFRS S2 para 15–16',status:'Enhanced — value chain required'},
  {tcfd:'Strategy (c) — Resilience',issb:'IFRS S2 para 20–21',status:'Enhanced — quantitative required'},
  {tcfd:'Risk Mgmt (a/b) — Processes',issb:'IFRS S2 para 22–25',status:'Direct mapping'},
  {tcfd:'Risk Mgmt (c) — Integration',issb:'IFRS S2 para 26',status:'Direct mapping'},
  {tcfd:'Metrics (a) — Climate metrics',issb:'IFRS S2 para 29 + App B',status:'Enhanced — SASB industry metrics added'},
  {tcfd:'Metrics (b) — Scope 1/2/3 GHG',issb:'IFRS S2 para 29–36',status:'Enhanced — Scope 3 mandatory (financial sector)'},
  {tcfd:'Metrics (c) — Climate targets',issb:'IFRS S2 para 37–42',status:'Enhanced — intensity + absolute required'},
];

const SCENARIO_DATA_CHART = [
  {year:'2024',nz:0,dt:0,hp:0},
  {year:'2026',nz:-1.2,dt:-0.5,hp:-0.3},
  {year:'2028',nz:-2.8,dt:-1.1,hp:-0.8},
  {year:'2030',nz:-5.5,dt:-2.0,hp:-1.5},
  {year:'2032',nz:-4.2,dt:-2.8,hp:-2.2},
  {year:'2035',nz:-3.0,dt:-3.5,hp:-3.8},
  {year:'2040',nz:-1.5,dt:-5.2,hp:-7.2},
  {year:'2045',nz:0.5,dt:-6.8,hp:-12.5},
  {year:'2050',nz:2.2,dt:-8.5,hp:-18.0},
];

const SCENARIOS = [
  {id:'nz',label:'Net Zero 2050 (1.5°C)',color:T.green,carbonPrice2030:'$150/tCO2e',carbonPrice2050:'$250/tCO2e',energyMix:'85% renewables by 2050',policy:'Carbon border adj, clean tech subsidies',revRisk2030:-45,opexChange2030:+12,capexReq2030:320,stranded2030:85,ebidta2030:-5.5,ebidta2050:+2.2,physRisk:'Low — rapid transition limits warming',transRisk:'High near-term, declining post-2035'},
  {id:'dt',label:'Delayed Transition (2°C)',color:T.amber,carbonPrice2030:'$50/tCO2e',carbonPrice2050:'$130/tCO2e',energyMix:'55% renewables by 2050',policy:'Patchwork regulations, late policy surge 2035',revRisk2030:-28,opexChange2030:+8,capexReq2030:180,stranded2030:210,ebidta2030:-2.0,ebidta2050:-8.5,physRisk:'Moderate — ~2°C warming by 2100',transRisk:'Moderate near-term, high post-2035'},
  {id:'hp',label:'High Physical Risk (3°C+)',color:T.red,carbonPrice2030:'$15/tCO2e',carbonPrice2050:'$35/tCO2e',energyMix:'35% renewables by 2050',policy:'Minimal climate policy, fossil fuel subsidies',revRisk2030:-8,opexChange2030:+3,capexReq2030:45,stranded2030:0,ebidta2030:-1.5,ebidta2050:-18.0,physRisk:'Very High — 3°C+ warming, severe physical impacts',transRisk:'Low — policy inaction'},
];

const SASB_SECTORS = ['Technology & Communications','Energy','Materials','Industrials','Consumer Discretionary','Consumer Staples','Health Care','Financials','Utilities','Real Estate','Comm Services'];

const SASB_METRICS = {
  'Technology & Communications':[
    {area:'Energy Management',metric:'Total energy consumed',unit:'GJ',s2Link:'IFRS S2 para 29(a)',company:285000,median:310000,pai:'PAI 5 — Non-renewable energy'},
    {area:'Energy Management',metric:'% renewable electricity',unit:'%',s2Link:'IFRS S2 Annex B',company:68,median:45,pai:'PAI 5'},
    {area:'Energy Management',metric:'Energy intensity (revenue)',unit:'GJ/$M revenue',s2Link:'IFRS S2 para 30',company:142,median:185,pai:'PAI 5'},
    {area:'Data Privacy',metric:'User data requests received',unit:'Count',s2Link:'IFRS S1 App B — Social',company:1240,median:980,pai:'N/A'},
    {area:'Data Privacy',metric:'% data requests complied',unit:'%',s2Link:'IFRS S1 App B',company:78,median:82,pai:'N/A'},
    {area:'Data Security',metric:'Number of data breaches',unit:'Count',s2Link:'IFRS S1 App B — Governance',company:0,median:1,pai:'N/A'},
    {area:'Data Security',metric:'Users affected by breaches',unit:'Count',s2Link:'IFRS S1 App B',company:0,median:42000,pai:'N/A'},
    {area:'Workforce',metric:'% women in technical roles',unit:'%',s2Link:'IFRS S1 App B — Human capital',company:34,median:28,pai:'PAI 13'},
    {area:'Workforce',metric:'Voluntary turnover rate',unit:'%',s2Link:'IFRS S1 App B',company:12.5,median:14.2,pai:'N/A'},
    {area:'Infrastructure',metric:'Weighted avg PUE (data centres)',unit:'Ratio',s2Link:'IFRS S2 Industry — TC',company:1.38,median:1.52,pai:'N/A'},
    {area:'Infrastructure',metric:'% in certified data centres',unit:'%',s2Link:'IFRS S2 Industry — TC',company:82,median:68,pai:'N/A'},
  ],
  'Energy':[
    {area:'GHG & Air Emissions',metric:'Gross Scope 1 GHG emissions',unit:'tCO2e',s2Link:'IFRS S2 para 29(a)',company:2850000,median:3200000,pai:'PAI 1'},
    {area:'GHG & Air Emissions',metric:'Scope 2 GHG (market-based)',unit:'tCO2e',s2Link:'IFRS S2 para 29(a)',company:185000,median:220000,pai:'PAI 1'},
    {area:'GHG & Air Emissions',metric:'NOx emissions',unit:'tonne',s2Link:'IFRS S2 Industry — EM',company:12500,median:15000,pai:'N/A'},
    {area:'Water Management',metric:'Total water withdrawn',unit:'ML',s2Link:'IFRS S2 Industry — EM',company:4200,median:5800,pai:'PAI 7'},
    {area:'Energy Mix',metric:'% renewable energy produced',unit:'%',s2Link:'IFRS S2 para 29',company:8,median:5,pai:'PAI 5'},
    {area:'Reserves',metric:'Proved reserves (oil equivalent)',unit:'MMboe',s2Link:'IFRS S2 Industry — EM',company:850,median:1200,pai:'N/A'},
  ],
  'Financials':[
    {area:'Financed Emissions',metric:'Financed emissions (Scope 3 Cat 15)',unit:'tCO2e/$M AUM',s2Link:'IFRS S2 para 29(a)(iii) + App E',company:125,median:185,pai:'PAI 1'},
    {area:'Climate Risk Exposure',metric:'% loans to carbon-intensive sectors',unit:'%',s2Link:'IFRS S2 Appendix E',company:18,median:24,pai:'PAI 4'},
    {area:'Climate Risk Exposure',metric:'Physical risk exposure (% portfolio)',unit:'%',s2Link:'IFRS S2 para 18',company:12,median:15,pai:'PAI 6'},
    {area:'Green Finance',metric:'Green/sustainable bonds issued',unit:'$M',s2Link:'IFRS S1 App B',company:2800,median:1200,pai:'N/A'},
    {area:'Engagement',metric:'% portfolio with SBTi targets',unit:'%',s2Link:'IFRS S2 para 42',company:38,median:22,pai:'N/A'},
  ],
};

const CONNECTIVITY_CHECKS = [
  {assumption:'Discount rate used in impairment tests',issb:'S2 para 15 — strategy effects',ifrs:'IAS 36 — impairment of assets',status:'Aligned',note:'WACC 8.2% consistent in both reports'},
  {assumption:'Useful life of fossil fuel assets',issb:'S2 para 10 — transition risk',ifrs:'IAS 16 — PP&E depreciation',status:'Review Required',note:'Gas turbines: ISSB assumes 2035 stranding; IFRS uses 2042'},
  {assumption:'Carbon price assumption in cost projections',issb:'S2 para 20 — scenario analysis',ifrs:'IAS 37 — provisions',status:'Aligned',note:'$85/tCO2e 2030 used consistently'},
  {assumption:'Going concern and climate litigation risk',issb:'S1 para 9 — governance',ifrs:'IAS 1 — presentation',status:'Aligned',note:'No material climate going concern risk identified'},
  {assumption:'Inventory valuation (stranded commodity risk)',issb:'S2 para 16 — value chain',ifrs:'IAS 2 — inventories',status:'Aligned',note:'NRV tested with $150/tCO2e carbon price'},
  {assumption:'Insurance coverage for physical climate risk',issb:'S2 para 18 — physical risk',ifrs:'IFRS 17 — insurance contracts',status:'Gap Identified',note:'Flood coverage gap in IFRS notes not disclosed in S2'},
];

const ASSURANCE_READINESS = [
  {indicator:'Data collection systems documented',status:'Ready',detail:'ESG data platform with audit trail'},
  {indicator:'Internal controls over ESG reporting',status:'Ready',detail:'SOX-equivalent controls mapped to ISSB'},
  {indicator:'Third-party data verification',status:'Partial',detail:'Scope 1/2 verified; Scope 3 in progress'},
  {indicator:'GHG boundary documentation',status:'Ready',detail:'Operational control boundary defined'},
  {indicator:'Material estimation techniques documented',status:'Partial',detail:'Spend-based Scope 3 — estimation uncertainty disclosed'},
  {indicator:'Prior year comparative data available',status:'Not Ready',detail:'First-year ISSB reporting — comparatives TBD'},
  {indicator:'Assurance provider engaged',status:'Ready',detail:'EY appointed for limited assurance 2025'},
  {indicator:'Board sign-off process established',status:'Partial',detail:'Audit Committee to approve — process draft in progress'},
];

const REGULATORY_EQUIV = [
  {market:'EU + UK dual-listed',regime1:'CSRD/ESRS',regime2:'UK SRS (ISSB)',outcome:'Interoperability — ESRS covers ISSB S2; UK addendum covers ESRS gaps',doublreport:'Minimal — single report with EU/UK addendum'},
  {market:'EU + Australia dual-listed',regime1:'CSRD/ESRS',regime2:'AASB S1/S2',outcome:'ESRS/ISSB interoperability applies; different assurance timelines',doublreport:'Some overlap — materiality differences in ESRS double vs ISSB single'},
  {market:'UK + Singapore dual-listed',regime1:'UK SRS',regime2:'SGX ISSB',outcome:'Both ISSB-based — near-identical requirements',doublreport:'None — single ISSB report satisfies both'},
  {market:'EU + Japan dual-listed',regime1:'CSRD/ESRS',regime2:'SSBJ (ISSB-aligned)',outcome:'ESRS/ISSB interoperability applies',doublreport:'Some — ESRS biodiversity, social exceed SSBJ scope'},
];

/* ============================================================ TAB 1: Global Adoption Tracker */
function Tab1GlobalAdoption() {
  const [region, setRegion] = useState('All');
  const regions = ['All','Asia-Pacific','Europe','Americas','Africa'];
  const filtered = region==='All'?ADOPTION_DATA:ADOPTION_DATA.filter(d=>d.region===region);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* KPIs */}
      <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
        <KpiCard label="Jurisdictions — Mandatory ISSB" value="14" sub="As of Q1 2026" color={T.green}/>
        <KpiCard label="Global GDP Covered" value="72%" sub="By mandatory/voluntary ISSB regimes" color={T.navy}/>
        <KpiCard label="ISSB-aligned Reports Published" value="8,400+" sub="CY2025 estimate" color={T.navyL}/>
        <KpiCard label="TCFD Formally Superseded" value="38" sub="Jurisdictions declaring ISSB supersedes TCFD" color={T.gold}/>
      </div>

      {/* Momentum chart */}
      <Card>
        <SectionTitle>Adoption Momentum: Jurisdictions with Mandatory ISSB (2023–2027 Forecast)</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={ADOPTION_MOMENTUM} margin={{top:5,right:20,left:0,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:12,fill:T.textSec}}/>
            <YAxis tick={{fontSize:12,fill:T.textSec}} domain={[0,25]}/>
            <Tooltip contentStyle={{fontSize:12,border:`1px solid ${T.border}`,borderRadius:8}}/>
            <Legend wrapperStyle={{fontSize:12}}/>
            <Line type="monotone" dataKey="mandatory" stroke={T.green} strokeWidth={2.5} name="Mandatory" dot={{r:4}}/>
            <Line type="monotone" dataKey="voluntary" stroke={T.amber} strokeWidth={2} name="Voluntary" strokeDasharray="5 3" dot={{r:3}}/>
            <Line type="monotone" dataKey="total" stroke={T.navy} strokeWidth={2} name="Total" strokeDasharray="3 2" dot={{r:3}}/>
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Region filter */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        {regions.map(r=>(
          <button key={r} onClick={()=>setRegion(r)} style={{padding:'5px 14px',borderRadius:20,border:`1px solid ${region===r?T.navy:T.border}`,background:region===r?T.navy:T.surface,color:region===r?'#fff':T.textSec,fontSize:12,cursor:'pointer',fontWeight:600}}>{r}</button>
        ))}
      </div>

      {/* Jurisdiction table */}
      <Card style={{padding:0,overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:T.surfaceH}}>
                {['Jurisdiction','Region','Standard','Status','Scope','Effective','Key Differences'].map(h=>(
                  <th key={h} style={{padding:'10px 14px',textAlign:'left',color:T.textSec,fontWeight:600,whiteSpace:'nowrap',borderBottom:`1px solid ${T.border}`}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d,i)=>(
                <tr key={d.jurisdiction} style={{background:i%2===0?T.surface:T.surfaceH,borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:'9px 14px',fontWeight:700,color:T.navy,whiteSpace:'nowrap'}}>{d.jurisdiction}</td>
                  <td style={{padding:'9px 14px',color:T.textSec}}>{d.region}</td>
                  <td style={{padding:'9px 14px',color:T.text,whiteSpace:'nowrap'}}>{d.standard}</td>
                  <td style={{padding:'9px 14px'}}>
                    {pill(d.status, d.status==='Mandatory'?T.green:d.status==='Voluntary→Mandatory'?T.amber:d.status==='Consultation'?T.navyL:d.status==='Stayed'?T.red:T.textMut)}
                  </td>
                  <td style={{padding:'9px 14px',color:T.textSec,maxWidth:160}}>{d.scope}</td>
                  <td style={{padding:'9px 14px',color:T.text,whiteSpace:'nowrap'}}>{d.effective}</td>
                  <td style={{padding:'9px 14px',color:T.textSec,maxWidth:220,fontSize:11}}>{d.diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================ TAB 2: IFRS S1 */
function Tab2S1() {
  const [openPillar, setOpenPillar] = useState(null);
  const radarData = RADAR_DATA;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',alignItems:'flex-start'}}>
        {/* Radar */}
        <Card style={{flex:'0 0 320px'}}>
          <SectionTitle>S1 Completion by Pillar</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.border}/>
              <PolarAngleAxis dataKey="pillar" tick={{fontSize:11,fill:T.textSec}}/>
              <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:10,fill:T.textMut}}/>
              <Radar name="Completion %" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.18} strokeWidth={2}/>
              <Tooltip formatter={(v)=>`${v}%`}/>
            </RadarChart>
          </ResponsiveContainer>
          <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
            {S1_PILLARS.map(p=>(
              <div key={p.pillar} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:12,color:T.textSec}}>{p.pillar}</span>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:80,height:6,background:T.border,borderRadius:3,overflow:'hidden'}}>
                    <div style={{width:`${p.score}%`,height:'100%',background:p.score>=75?T.green:p.score>=55?T.amber:T.red,borderRadius:3}}/>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:T.navy,width:32,textAlign:'right'}}>{p.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Connectivity note */}
        <Card style={{flex:1,minWidth:260}}>
          <SectionTitle>IFRS S1 Para 21 — Connectivity Principle</SectionTitle>
          <p style={{fontSize:13,color:T.textSec,lineHeight:1.6,margin:'0 0 12px'}}>IFRS S1 requires entities to provide information that enables users to understand connections between different sustainability-related risks and opportunities, and how they affect the entity's strategy, business model, cash flows, and financial position.</p>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {['S1 Governance → S2 Climate Governance (same board disclosure)','S1 Strategy → S2 Climate Scenario Analysis (same resilience assessment)','S1 Risk Mgmt → S2 Climate Risk Processes (integrated framework)','S1 Metrics → S2 GHG + SASB Industry Metrics (all within one framework)'].map((c,i)=>(
              <div key={i} style={{display:'flex',gap:8,alignItems:'flex-start',background:`${T.navy}08`,borderRadius:7,padding:'8px 12px'}}>
                <span style={{color:T.gold,fontWeight:800,fontSize:14,marginTop:1}}>→</span>
                <span style={{fontSize:12,color:T.textSec}}>{c}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Pillar accordion */}
      {S1_PILLARS.map(p=>(
        <Card key={p.pillar} style={{padding:0,overflow:'hidden'}}>
          <button onClick={()=>setOpenPillar(openPillar===p.pillar?null:p.pillar)} style={{width:'100%',padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}>
            <span style={{fontWeight:700,fontSize:15,color:T.navy}}>{p.pillar}</span>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:12,color:p.score>=75?T.green:p.score>=55?T.amber:T.red,fontWeight:700}}>{p.score}% complete</span>
              <span style={{color:T.textMut,fontSize:16}}>{openPillar===p.pillar?'▲':'▼'}</span>
            </div>
          </button>
          {openPillar===p.pillar&&(
            <div style={{borderTop:`1px solid ${T.border}`}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{background:T.surfaceH}}>
                    {['Code','Requirement','Status','Data Source','Quality'].map(h=>(
                      <th key={h} style={{padding:'8px 14px',textAlign:'left',color:T.textSec,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {p.reqs.map(r=>(
                    <tr key={r.code} style={{borderBottom:`1px solid ${T.border}`}}>
                      <td style={{padding:'9px 14px',fontFamily:'monospace',color:T.textMut,fontSize:11}}>{r.code}</td>
                      <td style={{padding:'9px 14px',color:T.text,maxWidth:280}}>{r.label}</td>
                      <td style={{padding:'9px 14px'}}>{pill(r.status,statusColor(r.status))}</td>
                      <td style={{padding:'9px 14px',color:T.textSec,fontSize:11}}>{r.source}</td>
                      <td style={{padding:'9px 14px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:60,height:5,background:T.border,borderRadius:3}}>
                            <div style={{width:`${r.quality}%`,height:'100%',background:r.quality>=75?T.green:r.quality>=50?T.amber:T.red,borderRadius:3}}/>
                          </div>
                          <span style={{fontSize:11,color:T.textSec}}>{r.quality}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ============================================================ TAB 3: IFRS S2 */
function Tab3S2() {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* TCFD mapping */}
      <Card>
        <SectionTitle>TCFD Recommendations → IFRS S2 Paragraph Mapping</SectionTitle>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:T.surfaceH}}>
                {['TCFD Recommendation','IFRS S2 Paragraph','Transition Notes'].map(h=>(
                  <th key={h} style={{padding:'8px 14px',textAlign:'left',color:T.textSec,fontWeight:600,borderBottom:`1px solid ${T.border}`}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TCFD_ISSB_MAP.map((m,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.border}`,background:i%2===0?T.surface:T.surfaceH}}>
                  <td style={{padding:'8px 14px',color:T.text,maxWidth:220}}>{m.tcfd}</td>
                  <td style={{padding:'8px 14px',fontFamily:'monospace',color:T.navyL,fontSize:11,whiteSpace:'nowrap'}}>{m.issb}</td>
                  <td style={{padding:'8px 14px'}}>
                    {pill(m.status,m.status==='Direct mapping'?T.green:T.amber)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Scope 3 phase-in notice */}
      <div style={{background:`${T.amber}12`,border:`1px solid ${T.amber}40`,borderRadius:9,padding:'12px 16px',display:'flex',gap:12,alignItems:'flex-start'}}>
        <span style={{fontSize:18,marginTop:1}}>⚠</span>
        <div>
          <div style={{fontWeight:700,color:T.amber,fontSize:13,marginBottom:3}}>IFRS S2 para C4 — Scope 3 Phase-in Relief</div>
          <div style={{fontSize:12,color:T.textSec}}>In the first annual reporting period an entity applies IFRS S2, it is not required to disclose Scope 3 GHG emissions. Relief expires after the first year. Financial sector entities face stricter requirements: financed emissions (Category 15) are required from year one for entities with investment or lending activities exceeding materiality thresholds.</div>
        </div>
      </div>

      {/* S2 Requirements with disclosure preview */}
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {S2_REQUIREMENTS.map(req=>(
          <Card key={req.id} style={{padding:0,overflow:'hidden'}}>
            <button onClick={()=>setSelected(selected===req.id?null:req.id)} style={{width:'100%',padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',background:'none',border:'none',cursor:'pointer',textAlign:'left',gap:12}}>
              <div style={{display:'flex',gap:12,alignItems:'center',flex:1}}>
                <span style={{fontWeight:800,color:T.gold,fontSize:14,minWidth:20}}>#{req.id}</span>
                <span style={{fontWeight:700,fontSize:14,color:T.navy}}>{req.title}</span>
                <span style={{fontFamily:'monospace',fontSize:11,color:T.textMut}}>{req.para}</span>
              </div>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                {pill(req.status,statusColor(req.status))}
                <span style={{color:T.textMut,fontSize:16}}>{selected===req.id?'▲':'▼'}</span>
              </div>
            </button>
            {selected===req.id&&(
              <div style={{borderTop:`1px solid ${T.border}`,padding:'14px 20px',background:T.surfaceH}}>
                <div style={{fontSize:11,color:T.textMut,marginBottom:6}}>Platform data source: <strong style={{color:T.navyL}}>{req.platformModule}</strong> &nbsp;|&nbsp; TCFD precedent: {req.tcfd}</div>
                <div style={{fontSize:12,color:T.textSec,lineHeight:1.7,background:T.surface,border:`1px solid ${T.border}`,borderRadius:7,padding:'12px 14px',fontStyle:'italic'}}>"{req.disclosure}"</div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============================================================ TAB 4: Scenario Analysis */
function Tab4Scenarios() {
  const [sel, setSel] = useState('all');
  const lines = sel==='all'?['nz','dt','hp']:sel==='nz'?['nz']:sel==='dt'?['dt']:['hp'];
  const colorMap = {nz:T.green,dt:T.amber,hp:T.red};
  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Scenario selector */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        {[{id:'all',label:'All Scenarios'},...SCENARIOS.map(s=>({id:s.id,label:s.label}))].map(s=>(
          <button key={s.id} onClick={()=>setSel(s.id)} style={{padding:'5px 14px',borderRadius:20,border:`1px solid ${sel===s.id?T.navy:T.border}`,background:sel===s.id?T.navy:T.surface,color:sel===s.id?'#fff':T.textSec,fontSize:12,cursor:'pointer',fontWeight:600}}>{s.label}</button>
        ))}
      </div>

      {/* EBITDA chart */}
      <Card>
        <SectionTitle>EBITDA Impact Under Climate Scenarios (%) — 2024 to 2050</SectionTitle>
        <div style={{fontSize:11,color:T.textMut,marginBottom:10}}>IFRS S2 para 20–21 — Quantitative scenario analysis required. Positive = net benefit; Negative = net cost vs BAU baseline.</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={SCENARIO_DATA_CHART} margin={{top:5,right:20,left:0,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:12,fill:T.textSec}}/>
            <YAxis tick={{fontSize:12,fill:T.textSec}} tickFormatter={v=>`${v}%`}/>
            <Tooltip formatter={(v)=>`${v}%`} contentStyle={{fontSize:12,border:`1px solid ${T.border}`,borderRadius:8}}/>
            <Legend wrapperStyle={{fontSize:12}}/>
            {lines.includes('nz')&&<Line type="monotone" dataKey="nz" stroke={T.green} strokeWidth={2.5} name="Net Zero 2050 (1.5°C)" dot={false}/>}
            {lines.includes('dt')&&<Line type="monotone" dataKey="dt" stroke={T.amber} strokeWidth={2.5} name="Delayed Transition (2°C)" dot={false}/>}
            {lines.includes('hp')&&<Line type="monotone" dataKey="hp" stroke={T.red} strokeWidth={2.5} name="High Physical Risk (3°C+)" dot={false}/>}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Scenario cards */}
      <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
        {SCENARIOS.map(s=>(
          <Card key={s.id} style={{flex:1,minWidth:240,borderTop:`3px solid ${s.color}`}}>
            <div style={{fontWeight:800,color:s.color,fontSize:14,marginBottom:8}}>{s.label}</div>
            <div style={{display:'flex',flexDirection:'column',gap:6,fontSize:12}}>
              {[
                {k:'Carbon price 2030',v:s.carbonPrice2030},
                {k:'Carbon price 2050',v:s.carbonPrice2050},
                {k:'Energy mix 2050',v:s.energyMix},
                {k:'Policy environment',v:s.policy},
                {k:'Revenue at risk 2030',v:`$${Math.abs(s.revRisk2030)}M`},
                {k:'CapEx required 2030',v:`$${s.capexReq2030}M`},
                {k:'Stranded assets 2030',v:`$${s.stranded2030}M`},
                {k:'EBITDA impact 2030',v:`${s.ebidta2030>0?'+':''}${s.ebidta2030}%`},
                {k:'EBITDA impact 2050',v:`${s.ebidta2050>0?'+':''}${s.ebidta2050}%`},
              ].map(({k,v})=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',gap:8,borderBottom:`1px solid ${T.border}`,paddingBottom:4}}>
                  <span style={{color:T.textSec}}>{k}</span>
                  <span style={{fontWeight:700,color:T.text,textAlign:'right'}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{marginTop:10,background:`${s.color}10`,borderRadius:6,padding:'7px 10px'}}>
              <div style={{fontSize:11,color:T.textMut,marginBottom:2}}>Physical Risk</div>
              <div style={{fontSize:11,color:T.textSec}}>{s.physRisk}</div>
              <div style={{fontSize:11,color:T.textMut,marginBottom:2,marginTop:5}}>Transition Risk</div>
              <div style={{fontSize:11,color:T.textSec}}>{s.transRisk}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Materiality note */}
      <Card>
        <SectionTitle>ISSB Materiality Threshold for Scenario Analysis</SectionTitle>
        <div style={{fontSize:13,color:T.textSec,lineHeight:1.7}}>
          IFRS S2 requires scenario analysis for climate risks that are "reasonably possible to occur" (IFRS S1 para 29) — i.e., the entity cannot rule them out. This is a lower threshold than "probable" (IFRS accounting standards). In practice: <strong style={{color:T.navy}}>all three scenarios above must be disclosed</strong>, as a High Physical Risk outcome cannot be ruled out even if the entity believes Net Zero policies will prevail. The scenario analysis should be proportionate to the skills, capabilities and resources available to the entity (IFRS S2 para 22).
        </div>
      </Card>
    </div>
  );
}

/* ============================================================ TAB 5: SASB Industry Standards */
function Tab5SASB() {
  const [sector, setSector] = useState('Technology & Communications');
  const metrics = SASB_METRICS[sector]||SASB_METRICS['Technology & Communications'];
  const areas = [...new Set(metrics.map(m=>m.area))];
  const barData = metrics.map(m=>({
    name:m.metric.length>28?m.metric.slice(0,28)+'…':m.metric,
    company:typeof m.company==='number'?Math.round(m.company/Math.max(m.company,m.median,1)*100):0,
    median:100,
  }));
  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Sector selector */}
      <Card>
        <SectionTitle>Select SASB Industry (66 Standards across 11 Sectors)</SectionTitle>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {SASB_SECTORS.map(s=>(
            <button key={s} onClick={()=>setSector(s)} style={{padding:'5px 14px',borderRadius:20,border:`1px solid ${sector===s?T.navy:T.border}`,background:sector===s?T.navy:T.surface,color:sector===s?'#fff':T.textSec,fontSize:12,cursor:'pointer',fontWeight:600}}>{s}</button>
          ))}
        </div>
        {!SASB_METRICS[sector]&&<div style={{marginTop:10,fontSize:12,color:T.textMut,fontStyle:'italic'}}>Detailed metrics for {sector} sector — click Technology & Communications, Energy, or Financials for full data.</div>}
      </Card>

      {/* Bar chart */}
      {SASB_METRICS[sector]&&(
        <Card>
          <SectionTitle>Company Performance vs SASB Sector Median (indexed to 100)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} layout="vertical" margin={{top:0,right:20,left:140,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false}/>
              <XAxis type="number" tick={{fontSize:11,fill:T.textSec}} domain={[0,150]}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:T.textSec}} width={140}/>
              <Tooltip contentStyle={{fontSize:12,border:`1px solid ${T.border}`,borderRadius:8}}/>
              <Legend wrapperStyle={{fontSize:12}}/>
              <Bar dataKey="company" name="Company" fill={T.navy} radius={[0,3,3,0]} barSize={10}>
                {barData.map((_,i)=><Cell key={i} fill={T.navyL}/>)}
              </Bar>
              <Bar dataKey="median" name="SASB Median" fill={T.border} radius={[0,3,3,0]} barSize={10}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Metrics table by area */}
      {SASB_METRICS[sector]&&areas.map(area=>(
        <Card key={area} style={{padding:0,overflow:'hidden'}}>
          <div style={{padding:'10px 18px',background:T.surfaceH,borderBottom:`1px solid ${T.border}`,fontWeight:700,fontSize:13,color:T.navy}}>{area}</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{background:'#fafaf8'}}>
                  {['Accounting Metric','Unit','IFRS S2 Linkage','Company','SASB Median','PAI Cross-ref','vs Median'].map(h=>(
                    <th key={h} style={{padding:'8px 14px',textAlign:'left',color:T.textSec,fontWeight:600,borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.filter(m=>m.area===area).map((m,i)=>{
                  const pct=m.median!==0?(((m.company-m.median)/m.median)*100).toFixed(1):0;
                  const better=parseFloat(pct)<0&&m.metric.toLowerCase().includes('emiss')||parseFloat(pct)<0&&m.metric.toLowerCase().includes('pue')||parseFloat(pct)<0&&m.metric.toLowerCase().includes('breach')||parseFloat(pct)<0&&m.metric.toLowerCase().includes('turn')||(parseFloat(pct)>0&&!m.metric.toLowerCase().includes('emiss')&&!m.metric.toLowerCase().includes('pue')&&!m.metric.toLowerCase().includes('breach'));
                  return (
                    <tr key={i} style={{borderBottom:`1px solid ${T.border}`,background:i%2===0?T.surface:T.surfaceH}}>
                      <td style={{padding:'9px 14px',color:T.text,maxWidth:200}}>{m.metric}</td>
                      <td style={{padding:'9px 14px',color:T.textMut,whiteSpace:'nowrap'}}>{m.unit}</td>
                      <td style={{padding:'9px 14px',fontFamily:'monospace',color:T.navyL,fontSize:11}}>{m.s2Link}</td>
                      <td style={{padding:'9px 14px',fontWeight:700,color:T.text}}>{typeof m.company==='number'?m.company.toLocaleString():m.company}</td>
                      <td style={{padding:'9px 14px',color:T.textSec}}>{typeof m.median==='number'?m.median.toLocaleString():m.median}</td>
                      <td style={{padding:'9px 14px',fontSize:11,color:T.textMut}}>{m.pai}</td>
                      <td style={{padding:'9px 14px'}}>{pill(`${parseFloat(pct)>0?'+':''}${pct}%`,better?T.green:T.red)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      {/* Cross-framework convergence */}
      <Card>
        <SectionTitle>Cross-Framework Convergence: SASB → PAI → ESRS Data Points</SectionTitle>
        <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
          {[
            {from:'SASB TC-HW-130a.1 (Energy, % renewable)',to:'PAI 5 (Share non-renewable energy)',esrs:'E1-5 (Energy consumption & mix)'},
            {from:'SASB FN-IN-450a.1 (Financed GHG)',to:'PAI 1 (GHG intensity, Category 15)',esrs:'E1-6 (Scope 1/2/3 GHG)'},
            {from:'SASB FN-IB-330a.2 (GHG trading risk exposure)',to:'PAI 4 (Carbon-intensive exposure)',esrs:'E1-9 (Transition risk exposure)'},
            {from:'SASB All — Total water withdrawn',to:'PAI 7 (Water usage)',esrs:'E3-4 (Water consumption)'},
          ].map((item,i)=>(
            <div key={i} style={{flex:'1 1 280px',background:T.surfaceH,borderRadius:8,padding:'12px 14px',border:`1px solid ${T.border}`}}>
              <div style={{fontSize:11,fontWeight:700,color:T.navy,marginBottom:4}}>SASB</div>
              <div style={{fontSize:11,color:T.textSec,marginBottom:8}}>{item.from}</div>
              <div style={{fontSize:11,fontWeight:700,color:T.amber,marginBottom:4}}>→ PAI (SFDR)</div>
              <div style={{fontSize:11,color:T.textSec,marginBottom:8}}>{item.to}</div>
              <div style={{fontSize:11,fontWeight:700,color:T.sage,marginBottom:4}}>→ ESRS</div>
              <div style={{fontSize:11,color:T.textSec}}>{item.esrs}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ============================================================ TAB 6: Assurance & Connectivity */
function Tab6Assurance() {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Connectivity checker */}
      <Card>
        <SectionTitle>Financial Statement Connectivity Checker (IFRS S2 para 15 + IAS 1)</SectionTitle>
        <div style={{fontSize:12,color:T.textMut,marginBottom:12}}>ISSB requires that climate assumptions used in sustainability reports are consistent with those used in IFRS financial statements. Inconsistencies create regulatory and audit risk.</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:T.surfaceH}}>
                {['Assumption','ISSB S2 Reference','IFRS Financial Stmt Ref','Status','Note'].map(h=>(
                  <th key={h} style={{padding:'8px 14px',textAlign:'left',color:T.textSec,fontWeight:600,borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONNECTIVITY_CHECKS.map((c,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.border}`,background:i%2===0?T.surface:T.surfaceH}}>
                  <td style={{padding:'9px 14px',fontWeight:600,color:T.text}}>{c.assumption}</td>
                  <td style={{padding:'9px 14px',fontFamily:'monospace',fontSize:11,color:T.navyL}}>{c.issb}</td>
                  <td style={{padding:'9px 14px',fontFamily:'monospace',fontSize:11,color:T.navyL}}>{c.ifrs}</td>
                  <td style={{padding:'9px 14px'}}>{pill(c.status,c.status==='Aligned'?T.green:c.status==='Review Required'?T.amber:T.red)}</td>
                  <td style={{padding:'9px 14px',color:T.textSec,fontSize:11}}>{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Assurance readiness */}
      <Card>
        <SectionTitle>Assurance Readiness — 8 Indicators</SectionTitle>
        <div style={{fontSize:12,color:T.textMut,marginBottom:12}}>Mandatory limited assurance expected 2027–2028 in major markets. Reasonable assurance expected 2029–2030. Current status of readiness indicators:</div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {ASSURANCE_READINESS.map((a,i)=>(
            <div key={i} style={{display:'flex',alignItems:'flex-start',gap:14,padding:'10px 14px',background:T.surfaceH,borderRadius:8,border:`1px solid ${T.border}`}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:a.status==='Ready'?T.green:a.status==='Partial'?T.amber:T.red,marginTop:3,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13,color:T.navy}}>{a.indicator}</div>
                <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{a.detail}</div>
              </div>
              {pill(a.status,a.status==='Ready'?T.green:a.status==='Partial'?T.amber:T.red)}
            </div>
          ))}
        </div>
        <div style={{marginTop:14,display:'flex',gap:14,flexWrap:'wrap'}}>
          {[{label:'Ready',n:ASSURANCE_READINESS.filter(a=>a.status==='Ready').length,c:T.green},{label:'Partial',n:ASSURANCE_READINESS.filter(a=>a.status==='Partial').length,c:T.amber},{label:'Not Ready',n:ASSURANCE_READINESS.filter(a=>a.status==='Not Ready').length,c:T.red}].map(s=>(
            <div key={s.label} style={{display:'flex',alignItems:'center',gap:8,background:`${s.c}10`,border:`1px solid ${s.c}40`,borderRadius:8,padding:'8px 14px'}}>
              <span style={{fontSize:22,fontWeight:800,color:s.c}}>{s.n}</span>
              <span style={{fontSize:12,color:s.c,fontWeight:600}}>{s.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Regulatory equivalence */}
      <Card>
        <SectionTitle>Regulatory Equivalence — Dual-Listed Companies (Avoiding Double Reporting)</SectionTitle>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {REGULATORY_EQUIV.map((r,i)=>(
            <div key={i} style={{background:T.surfaceH,borderRadius:8,padding:'12px 16px',border:`1px solid ${T.border}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
                <div>
                  <div style={{fontWeight:700,color:T.navy,fontSize:14,marginBottom:4}}>{r.market}</div>
                  <div style={{fontSize:12,color:T.textSec}}><strong>Frameworks:</strong> {r.regime1} + {r.regime2}</div>
                  <div style={{fontSize:12,color:T.textSec,marginTop:3}}><strong>Interoperability:</strong> {r.outcome}</div>
                </div>
                <div style={{background:`${T.green}10`,border:`1px solid ${T.green}30`,borderRadius:6,padding:'6px 12px',minWidth:160}}>
                  <div style={{fontSize:11,color:T.textMut,marginBottom:2}}>Double reporting risk</div>
                  <div style={{fontSize:12,fontWeight:700,color:T.green}}>{r.doublreport}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Integrated reporting connection */}
      <Card>
        <SectionTitle>IIRC Integrated Reporting — Connection to ISSB S1/S2</SectionTitle>
        <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
          {[
            {ir:'Financial Capital','issb':'IFRS S2 → Financial impacts of climate (para 15)',link:'Direct — climate assumptions in IFRS financial statements'},
            {ir:'Manufactured Capital','issb':'IFRS S2 → Physical asset exposure, CapEx requirements',link:'Direct — asset stranding, CapEx for transition'},
            {ir:'Natural Capital','issb':'IFRS S1 → Environmental sustainability risks/opps',link:'Indirect — ISSB references SASB and TNFD for nature'},
            {ir:'Human Capital','issb':'IFRS S1 → Workforce sustainability metrics (SASB)',link:'Indirect — skills for transition, just transition risks'},
            {ir:'Social & Relationship Capital','issb':'IFRS S1 → Supply chain, community engagement',link:'Indirect — value chain disclosure (para 16)'},
            {ir:'Intellectual Capital','issb':'IFRS S2 → Technology transition risks and opportunities',link:'Indirect — clean tech IP, R&D for decarbonisation'},
          ].map((item,i)=>(
            <div key={i} style={{flex:'1 1 260px',background:T.surfaceH,borderRadius:8,padding:'12px 14px',border:`1px solid ${T.border}`}}>
              <div style={{fontSize:12,fontWeight:800,color:T.gold,marginBottom:4}}>{item.ir}</div>
              <div style={{fontSize:11,color:T.textSec,marginBottom:6}}>{item['issb']}</div>
              <div style={{fontSize:11,color:T.textMut,fontStyle:'italic'}}>{item.link}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ============================================================ TABS CONFIG */
const TABS = [
  {id:'adoption',label:'Global Adoption Tracker',component:Tab1GlobalAdoption},
  {id:'s1',label:'IFRS S1 — General Requirements',component:Tab2S1},
  {id:'s2',label:'IFRS S2 — Climate Disclosure',component:Tab3S2},
  {id:'scenario',label:'Scenario Analysis Engine',component:Tab4Scenarios},
  {id:'sasb',label:'SASB Industry Standards',component:Tab5SASB},
  {id:'assurance',label:'Assurance & Connectivity',component:Tab6Assurance},
];

/* ============================================================ PAGE */
export default function IssbDisclosurePage() {
  const [activeTab, setActiveTab] = useState('adoption');
  const ActiveComponent = TABS.find(t=>t.id===activeTab)?.component||Tab1GlobalAdoption;

  return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
      {/* Header */}
      <div style={{background:T.navy,padding:'22px 32px 0',borderBottom:`2px solid ${T.gold}`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:14}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
              <span style={{fontSize:11,fontFamily:'monospace',color:T.gold,background:`${T.gold}20`,padding:'2px 8px',borderRadius:4,fontWeight:700}}>EP-AH3</span>
              {['IFRS S1/S2','20+ Jurisdictions','Scenario Analysis','TCFD Superseded','2024 Mandatory'].map(b=>(
                <span key={b} style={{fontSize:10,color:'#fff',background:'rgba(255,255,255,0.12)',padding:'2px 8px',borderRadius:10,fontWeight:600}}>{b}</span>
              ))}
            </div>
            <h1 style={{margin:0,fontSize:22,fontWeight:800,color:'#fff'}}>ISSB S1/S2 Disclosure Builder</h1>
            <p style={{margin:'4px 0 0',fontSize:13,color:'rgba(255,255,255,0.65)'}}>IFRS Sustainability Standards — Global Adoption, Disclosure Framework, Scenario Analysis & Assurance</p>
          </div>
          <div style={{display:'flex',gap:10}}>
            <div style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:8,padding:'8px 14px',textAlign:'center'}}>
              <div style={{fontSize:18,fontWeight:800,color:T.gold}}>S1+S2</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>IFRS Standards</div>
            </div>
            <div style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:8,padding:'8px 14px',textAlign:'center'}}>
              <div style={{fontSize:18,fontWeight:800,color:T.sage}}>TCFD</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>Superseded</div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{display:'flex',gap:2,overflowX:'auto',paddingBottom:0}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{padding:'9px 16px',borderRadius:'6px 6px 0 0',border:'none',background:activeTab===t.id?T.bg:'transparent',color:activeTab===t.id?T.navy:'rgba(255,255,255,0.65)',fontSize:12,fontWeight:activeTab===t.id?700:500,cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.15s',fontFamily:T.font}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{padding:'24px 32px',maxWidth:1400,margin:'0 auto'}}>
        <ActiveComponent/>
      </div>
    </div>
  );
}
