import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import Apr2026CarbonAnalytics from '../../_shared/Apr2026CarbonAnalytics';
import IndiaAdvancedAnalytics from '../../_shared/IndiaAdvancedAnalytics';
import IndiaGreenHybridFinance from '../../_shared/IndiaGreenHybridFinance';

const T = { bg:'#0f1117', surface:'#1a1d27', surfaceH:'#22263a', border:'#2a2f45', borderL:'#1e2235', navy:'#1e3a5f', gold:'#d4a843', sage:'#2d6a4f', teal:'#0d4f5c', text:'#e8e0d0', textSec:'#a89880', textMut:'#6b6050', red:'#c0392b', green:'#27ae60', amber:'#e67e22', font:"'DM Sans',sans-serif", mono:"'JetBrains Mono',monospace" };
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const INFRA_TYPES = [
  { type:'RE Transmission', icon:'⚡', sector:'Power', nabfidLimitBnInr:800, cctsCreditElig:true, gcfElig:true, yieldTenYrPct:7.2, dscrMin:1.35, irrEquity:13.5, carbonCreditMech:'REC + CCTS Grid EF reduction', greenBondSize:2.4, capexBnInr:3200 },
  { type:'Green Roads (NHAI)', icon:'🛣️', sector:'Transport', nabfidLimitBnInr:600, cctsCreditElig:false, gcfElig:true, yieldTenYrPct:7.5, dscrMin:1.30, irrEquity:12.8, carbonCreditMech:'VCS transport emission reduction', greenBondSize:1.8, capexBnInr:2800 },
  { type:'Green Ports', icon:'⚓', sector:'Logistics', nabfidLimitBnInr:400, cctsCreditElig:true, gcfElig:false, yieldTenYrPct:7.8, dscrMin:1.28, irrEquity:13.0, carbonCreditMech:'CCTS shipping Scope 1+3', greenBondSize:0.9, capexBnInr:1500 },
  { type:'Cold Chain Logistics', icon:'❄️', sector:'Agriculture', nabfidLimitBnInr:200, cctsCreditElig:false, gcfElig:true, yieldTenYrPct:8.2, dscrMin:1.25, irrEquity:14.0, carbonCreditMech:'VCS refrigeration (AM0001)', greenBondSize:0.5, capexBnInr:800 },
  { type:'Green Data Centres', icon:'💻', sector:'Digital', nabfidLimitBnInr:300, cctsCreditElig:true, gcfElig:false, yieldTenYrPct:8.5, dscrMin:1.22, irrEquity:15.0, carbonCreditMech:'RE100 + PUE efficiency credits', greenBondSize:0.8, capexBnInr:1200 },
  { type:'Urban Transit (Metro)', icon:'🚇', sector:'Urban', nabfidLimitBnInr:500, cctsCreditElig:false, gcfElig:true, yieldTenYrPct:7.0, dscrMin:1.40, irrEquity:11.5, carbonCreditMech:'VCS ACM0016 (electric transport)', greenBondSize:2.1, capexBnInr:4500 },
  { type:'Green Buildings (REITs)', icon:'🏢', sector:'Real Estate', nabfidLimitBnInr:250, cctsCreditElig:false, gcfElig:false, yieldTenYrPct:8.0, dscrMin:1.20, irrEquity:14.5, carbonCreditMech:'LEED/GRIHA certified offset credits', greenBondSize:1.2, capexBnInr:1800 },
  { type:'Water & Sanitation', icon:'💧', sector:'Municipal', nabfidLimitBnInr:350, cctsCreditElig:false, gcfElig:true, yieldTenYrPct:7.3, dscrMin:1.32, irrEquity:12.0, carbonCreditMech:'VCS AM0065 (water treatment)', greenBondSize:0.7, capexBnInr:1400 },
];

const NABFID_OVERVIEW = {
  estYear: 2021, mandateBnInr: 2000, paidUpCapBnInr: 200, lendingRatePct: 8.1,
  targetSectors: ['RE', 'Roads', 'Ports', 'Urban Infra', 'Digital', 'Water'],
  fundingSources: ['Sovereign bond', 'Multilateral DFI', 'Green bond', 'Masala bond'],
  creditRating: 'AAA (India)/BBB (FITCH)',
};

const INVIT_DEALS = [
  { name:'IndiGrid InvIT (Power)', sector:'RE Transmission', aum:180, yieldPct:10.2, navPremiumPct:12, distribFreq:'Quarterly', greenCertified:true, carbonOffset:true, isinListed:true },
  { name:'IRB InvIT (Roads)', sector:'Roads', aum:120, yieldPct:9.8, navPremiumPct:8, distribFreq:'Semi-annual', greenCertified:false, carbonOffset:false, isinListed:true },
  { name:'Powergrid InvIT', sector:'Transmission', aum:80, yieldPct:9.5, navPremiumPct:6, distribFreq:'Quarterly', greenCertified:true, carbonOffset:true, isinListed:true },
  { name:'Cube Highways InvIT', sector:'Roads', aum:65, yieldPct:10.5, navPremiumPct:14, distribFreq:'Quarterly', greenCertified:false, carbonOffset:false, isinListed:false },
  { name:'National Highways InvIT', sector:'Roads', aum:95, yieldPct:9.2, navPremiumPct:5, distribFreq:'Semi-annual', greenCertified:false, carbonOffset:false, isinListed:true },
  { name:'Mumbai Int. Airport InvIT', sector:'Aviation', aum:55, yieldPct:10.8, navPremiumPct:18, distribFreq:'Quarterly', greenCertified:true, carbonOffset:false, isinListed:true },
];

const BLENDED_FINANCE = [
  { instrument:'GCF Grant', provider:'Green Climate Fund', rateOrSize:'0% / $50–200M', structure:'First-loss tranche / TA grant', rrCond:'National climate priority', suitability:'Urban resilience, water, cold chain' },
  { instrument:'ADB Technical Assistance', provider:'Asian Dev Bank', rateOrSize:'$2–10M TA grant', structure:'Project prep / feasibility', rrCond:'Developing country DFI co-financing', suitability:'Pre-FINANCIAL CLOSE projects' },
  { instrument:'IFC Anchor Equity', provider:'IFC (World Bank)', rateOrSize:'10–20% equity', structure:'Anchor + mobilisation signal', rrCond:'Frontier markets / new sector', suitability:'Green data centres, cold chain' },
  { instrument:'AIIB Green Bond', provider:'AIIB', rateOrSize:'USD Libor+50bps', structure:'Senior debt / co-financing', rrCond:'Member country infrastructure', suitability:'RE transmission, urban metro' },
  { instrument:'JICA Green ODA Loan', provider:'JICA (Japan)', rateOrSize:'0.1–0.5% / 40yr', structure:'Sovereign + ODA channel', rrCond:'JCM-linked projects preferred', suitability:'Metro, RE, water treatment' },
  { instrument:'NaBFID Project Bond', provider:'NaBFID', rateOrSize:'7.5–8.5%', structure:'INR bond / partial guarantee', rrCond:'Min DSCR 1.25×', suitability:'All 8 infra types' },
];

const YIELD_CURVE = [
  { tenor:'1yr', greenInfra:6.9, gsec:6.7, spread:0.2 },
  { tenor:'3yr', greenInfra:7.1, gsec:6.9, spread:0.2 },
  { tenor:'5yr', greenInfra:7.4, gsec:7.1, spread:0.3 },
  { tenor:'7yr', greenInfra:7.6, gsec:7.3, spread:0.3 },
  { tenor:'10yr', greenInfra:7.9, gsec:7.5, spread:0.4 },
  { tenor:'15yr', greenInfra:8.2, gsec:7.8, spread:0.4 },
  { tenor:'20yr', greenInfra:8.5, gsec:8.0, spread:0.5 },
];

const BRSR_METRICS = [
  { metric:'Energy Intensity', unit:'GJ/Cr revenue', benchmark:'12.5', threshold:'<10', sebiMandatory:true },
  { metric:'Water Intensity', unit:'KL/Cr revenue', benchmark:'8.2', threshold:'<6', sebiMandatory:true },
  { metric:'GHG Intensity (Scope 1+2)', unit:'tCO₂/Cr revenue', benchmark:'1.8', threshold:'<1.2', sebiMandatory:true },
  { metric:'Waste Diversion Rate', unit:'%', benchmark:'62%', threshold:'>75%', sebiMandatory:false },
  { metric:'Supply Chain Emissions (Scope 3)', unit:'%reported', benchmark:'35%', threshold:'>50%', sebiMandatory:false },
  { metric:'Board ESG Oversight', unit:'%', benchmark:'68%', threshold:'100% (top 1000)', sebiMandatory:true },
];

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'16px 20px', minWidth:160 }}>
    <div style={{ color:T.textMut, fontSize:11, fontFamily:T.mono, textTransform:'uppercase', letterSpacing:1 }}>{label}</div>
    <div style={{ color:color||T.gold, fontSize:24, fontWeight:700, fontFamily:T.mono, margin:'6px 0 2px' }}>{value}</div>
    {sub && <div style={{ color:T.textSec, fontSize:11 }}>{sub}</div>}
  </div>
);

const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding:'8px 16px', background:active?T.navy:'transparent', color:active?T.gold:T.textSec, border:`1px solid ${active?T.gold:T.border}`, borderRadius:6, cursor:'pointer', fontFamily:T.mono, fontSize:12, whiteSpace:'nowrap' }}>{label}</button>
);

const SectionTitle = ({ children }) => (
  <div style={{ color:T.gold, fontFamily:T.mono, fontSize:13, fontWeight:700, letterSpacing:1, textTransform:'uppercase', borderBottom:`1px solid ${T.border}`, paddingBottom:6, marginBottom:16 }}>{children}</div>
);

const calcDscr = ({ annRevenue, annOpex, annDebtService }) => annDebtService > 0 ? ((annRevenue - annOpex) / annDebtService).toFixed(2) : 'N/A';
const calcNpv = ({ annCashflow, capex, discRate, lifeYrs }) => {
  let pv = 0;
  for (let i=1; i<=lifeYrs; i++) pv += annCashflow / Math.pow(1 + discRate/100, i);
  return (pv - capex).toFixed(0);
};

export default function IndiaGreenInfraFinancePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selInfra, setSelInfra] = useState(0);
  const [capexBnInr, setCapexBnInr] = useState(1000);
  const [annRevenueBnInr, setAnnRevenueBnInr] = useState(120);
  const [annOpexBnInr, setAnnOpexBnInr] = useState(40);
  const [debtPct, setDebtPct] = useState(70);
  const [discRate, setDiscRate] = useState(9);
  const [lifeYrs, setLifeYrs] = useState(25);

  const infra = INFRA_TYPES[selInfra];
  const annDebtService = (capexBnInr * debtPct/100 * 0.085);
  const dscrVal = calcDscr({ annRevenue:annRevenueBnInr, annOpex:annOpexBnInr, annDebtService });
  const annCashflow = annRevenueBnInr - annOpexBnInr;
  const npv = calcNpv({ annCashflow, capex:capexBnInr, discRate, lifeYrs });

  const tabs = ['Overview','Infra Type Dashboard','NaBFID & InvIT','Project Finance Calc','Yield Curve','Blended Finance','InvIT Deals','BRSR Compliance','Carbon Credit Eligibility','Deal Pipeline','Advanced Analytics'];

  return (
    <div style={{ background:T.bg, minHeight:'100vh', color:T.text, fontFamily:T.font, padding:24 }}>
      <div style={{ borderBottom:`2px solid ${T.gold}`, paddingBottom:16, marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ color:T.textMut, fontSize:11, fontFamily:T.mono, letterSpacing:2, textTransform:'uppercase' }}>EP-EA5 · India Green Infrastructure Finance</div>
            <h1 style={{ margin:'4px 0 8px', fontSize:28, fontWeight:700, color:T.text }}>India Green Infrastructure & Project Finance</h1>
            <div style={{ color:T.textSec, fontSize:13 }}>NaBFID · InvIT · GCF/ADB blended finance · BRSR compliance · CCTS eligibility · Green bonds</div>
          </div>
          <div style={{ textAlign:'right', fontFamily:T.mono, fontSize:11, color:T.textMut }}>
            <div>NaBFID Mandate</div>
            <div style={{ color:T.gold, fontSize:20, fontWeight:700 }}>₹2,000 Bn</div>
            <div>India Infra Pipeline 2025–30</div>
            <div style={{ color:T.green, fontSize:16, fontWeight:700 }}>$1.4 Tn</div>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
        <Kpi label="NaBFID Lending Rate" value="8.1%" sub="AAA rated · INR denominated" color={T.gold} />
        <Kpi label="InvIT Avg Yield" value="10.0%" sub="Green InvITs at 9.5–10.2%" color={T.teal} />
        <Kpi label="Green Bond Market (India)" value="₹1.8 Tn" sub="RBI SGB framework 2023" color={T.green} />
        <Kpi label="GCF India Pipeline" value="$3.2 Bn" sub="Accredited entities: NABARD, GIZ, NaBFID" color={T.amber} />
        <Kpi label="SEBI BRSR Core" value="Top 1000" sub="Mandatory FY2024+ for listed cos" color={T.navy } />
        <Kpi label="India Infra Gap (Annual)" value="$170 Bn" value="$170 Bn" sub="McKinsey Infra Gap Study 2024" color={T.red} />
      </div>

      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
        {tabs.map((t,i) => <Tab key={i} label={t} active={activeTab===i} onClick={()=>setActiveTab(i)} />)}
      </div>

      {/* Tab 0: Overview */}
      {activeTab===0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>India Green Infrastructure Finance Ecosystem</SectionTitle>
            <div style={{ color:T.textSec, fontSize:13, lineHeight:1.8 }}>
              India's green infrastructure financing ecosystem is anchored by <span style={{ color:T.gold }}>NaBFID</span> (National Bank for Financing Infrastructure and Development), established in 2021 with a ₹2,000 Bn mandate, targeting 8 infrastructure verticals including RE transmission, green roads, ports, cold chains, data centres, urban transit, green buildings, and water.
              <br/><br/>
              <span style={{ color:T.amber }}>InvIT Revolution:</span> Infrastructure Investment Trusts have emerged as a critical capital recycling mechanism, with ₹1.1 Tn of assets across 22 SEBI-registered InvITs. Green InvITs (IndiGrid, Powergrid) attract global ESG capital with yields of 9.5–10.2% — competitive with emerging market green bonds while offering INR hedging.
              <br/><br/>
              <span style={{ color:T.teal }}>BRSR-Carbon Nexus:</span> SEBI's Business Responsibility & Sustainability Reporting (BRSR) Core framework (mandatory from FY2024 for top 1000 companies) includes assured disclosures of GHG intensity, energy intensity, and Scope 3 supply chain emissions. This directly integrates with CCTS compliance, creating a reporting backbone for carbon credit issuance.
              <br/><br/>
              <span style={{ color:T.green }}>Blended Finance:</span> GCF ($3.2 Bn pipeline), ADB ($8 Bn India portfolio), IFC ($4 Bn India), and JICA (¥800 Bn ODA bilateral) collectively provide concessional capital for first-loss risk absorption, enabling commercially unviable projects to achieve bankability.
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Green Infra Capex Pipeline by Sector (₹ Bn)</SectionTitle>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={INFRA_TYPES} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fill:T.textSec, fontSize:11 }} />
                <YAxis type="category" dataKey="type" tick={{ fill:T.textSec, fontSize:10 }} width={140} />
                <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} formatter={(v)=>[`₹${v} Bn`]} />
                <Bar dataKey="capexBnInr" fill={T.teal} name="Capex Pipeline ₹Bn" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 1: Infra Type Dashboard */}
      {activeTab===1 && (
        <div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            {INFRA_TYPES.map((t,i) => <button key={i} onClick={()=>setSelInfra(i)} style={{ padding:'6px 14px', background:selInfra===i?T.navy:'transparent', color:selInfra===i?T.gold:T.textSec, border:`1px solid ${selInfra===i?T.gold:T.border}`, borderRadius:6, cursor:'pointer', fontFamily:T.mono, fontSize:12 }}>{t.icon} {t.type}</button>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
            <Kpi label="NaBFID Limit" value={`₹${infra.nabfidLimitBnInr}Bn`} sub={`Sector: ${infra.sector}`} color={T.gold} />
            <Kpi label="10yr Yield" value={`${infra.yieldTenYrPct}%`} sub={`Min DSCR: ${infra.dscrMin}×`} color={T.teal} />
            <Kpi label="Equity IRR" value={`${infra.irrEquity}%`} sub={`Green Bond: $${infra.greenBondSize}Bn`} color={T.green} />
            <Kpi label="CCTS Eligible" value={infra.cctsCreditElig?'Yes':'No'} sub={infra.gcfElig?'GCF Eligible':'No GCF'} color={infra.cctsCreditElig?T.green:T.textSec} />
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Carbon Credit Mechanism: {infra.type}</SectionTitle>
            <div style={{ color:T.textSec, fontSize:13, marginBottom:16 }}>{infra.carbonCreditMech}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <SectionTitle>Finance Stack</SectionTitle>
                {[['NaBFID Senior Debt','40%',T.navy],['Green Bond','20%',T.green],['DFI Co-lending','15%',T.teal],['InvIT / REIT','10%',T.amber],['Sponsor Equity','15%',T.gold]].map(([l,v,c],i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 10px', background:T.surfaceH, borderRadius:4, marginBottom:4 }}>
                    <span style={{ color:T.textSec, fontSize:12 }}>{l}</span>
                    <span style={{ color:c, fontFamily:T.mono, fontSize:12 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div>
                <SectionTitle>Risk Matrix</SectionTitle>
                {[['Construction Risk','Medium','Political will + EPC track record'],['Revenue Risk','Low–Medium','Tariff/toll regulated'],['Refinancing Risk','Low','NaBFID long-tenor (20–25yr)'],['Carbon Price Risk','Low','CCTS domestic floor price expected'],['FX Risk','Low (INR only)','NaBFID + green bonds INR denominated']].map(([r,s,n],i) => (
                  <div key={i} style={{ padding:'6px 10px', background:T.surfaceH, borderRadius:4, marginBottom:4 }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ color:T.text, fontSize:12 }}>{r}</span>
                      <span style={{ color:s==='Low'?T.green:s.includes('Low–')?T.amber:T.red, fontFamily:T.mono, fontSize:11 }}>{s}</span>
                    </div>
                    <div style={{ color:T.textMut, fontSize:10 }}>{n}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: NaBFID & InvIT */}
      {activeTab===2 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>NaBFID Profile</SectionTitle>
            <div style={{ display:'grid', gap:8 }}>
              {[
                ['Establishment', '2021 · Parliament Act'],
                ['Mandate', `₹${NABFID_OVERVIEW.mandateBnInr.toLocaleString()} Bn long-term infra finance`],
                ['Paid-up Capital', `₹${NABFID_OVERVIEW.paidUpCapBnInr} Bn (govt 100%)`],
                ['Lending Rate', `${NABFID_OVERVIEW.lendingRatePct}% (INR, variable)`],
                ['Credit Rating', NABFID_OVERVIEW.creditRating],
                ['Funding Sources', NABFID_OVERVIEW.fundingSources.join(' · ')],
                ['Target Sectors', NABFID_OVERVIEW.targetSectors.join(' · ')],
                ['Green Finance %', '~65% of portfolio (RBI target)'],
              ].map(([k,v],i) => (
                <div key={i} style={{ display:'flex', gap:16, padding:'8px 10px', background:i%2===0?T.surfaceH:T.surface, borderRadius:4 }}>
                  <span style={{ color:T.textMut, fontSize:11, fontFamily:T.mono, minWidth:140 }}>{k}</span>
                  <span style={{ color:T.text, fontSize:12 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>NaBFID Sectoral Limits (₹Bn)</SectionTitle>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={INFRA_TYPES}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="type" tick={{ fill:T.textSec, fontSize:8 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fill:T.textSec, fontSize:11 }} />
                <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} formatter={(v)=>[`₹${v}Bn`]} />
                <Bar dataKey="nabfidLimitBnInr" fill={T.gold} name="NaBFID Limit ₹Bn" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3: Project Finance Calc */}
      {activeTab===3 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Green Infra Project Finance Calculator</SectionTitle>
            <div style={{ display:'grid', gap:10, marginBottom:16 }}>
              {[
                { label:`Project Capex (₹Bn): ₹${capexBnInr}Bn`, min:100, max:5000, step:50, val:capexBnInr, set:setCapexBnInr },
                { label:`Annual Revenue (₹Bn): ₹${annRevenueBnInr}Bn`, min:10, max:500, step:10, val:annRevenueBnInr, set:setAnnRevenueBnInr },
                { label:`Annual Opex (₹Bn): ₹${annOpexBnInr}Bn`, min:5, max:200, step:5, val:annOpexBnInr, set:setAnnOpexBnInr },
                { label:`Debt % (NaBFID+bonds): ${debtPct}%`, min:40, max:80, step:5, val:debtPct, set:setDebtPct },
                { label:`Discount Rate: ${discRate}%`, min:7, max:15, step:0.5, val:discRate, set:setDiscRate },
                { label:`Project Life: ${lifeYrs}yr`, min:15, max:35, step:5, val:lifeYrs, set:setLifeYrs },
              ].map((s,i) => (
                <div key={i}>
                  <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:3 }}>{s.label}</label>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={s.val} onChange={e=>s.set(+e.target.value)} style={{ width:'100%' }} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Project Finance Outputs</SectionTitle>
            <div style={{ display:'grid', gap:12 }}>
              <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
                <div style={{ display:'grid', gap:8 }}>
                  {[
                    ['Total Debt (₹Bn)', `₹${(capexBnInr*debtPct/100).toFixed(0)}Bn`, T.navy],
                    ['Annual Debt Service', `₹${annDebtService.toFixed(1)}Bn (8.5%, 20yr)`, T.amber],
                    ['Net Cash Flow', `₹${(annRevenueBnInr-annOpexBnInr).toFixed(1)}Bn/yr`, T.green],
                    ['DSCR', `${dscrVal}×`, +dscrVal >= infra.dscrMin ? T.green : T.red],
                    ['NPV (₹Bn)', `₹${npv}Bn`, +npv>0?T.green:T.red],
                    ['Equity Invested', `₹${(capexBnInr*(100-debtPct)/100).toFixed(0)}Bn`, T.gold],
                  ].map(([l,v,c],i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 10px', background:i%2===0?T.surface:T.surfaceH, borderRadius:4 }}>
                      <span style={{ color:T.textSec, fontSize:12 }}>{l}</span>
                      <span style={{ color:c, fontFamily:T.mono, fontSize:13, fontWeight:700 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              {+dscrVal < infra.dscrMin && (
                <div style={{ padding:10, background:`${T.red}11`, border:`1px solid ${T.red}33`, borderRadius:6, color:T.red, fontSize:12 }}>
                  ⚠ DSCR {dscrVal}× below {infra.type} minimum ({infra.dscrMin}×). Increase revenue, reduce opex, or restructure debt.
                </div>
              )}
              <div style={{ padding:12, background:T.surfaceH, borderRadius:6 }}>
                <div style={{ color:T.teal, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:6 }}>Carbon Credit Revenue Boost</div>
                <div style={{ color:T.textSec, fontSize:12 }}>
                  CCTS/VCS carbon credits from {infra.type} can add ₹{(capexBnInr*0.02).toFixed(0)}–{(capexBnInr*0.05).toFixed(0)}Bn/yr in carbon revenue (est. 2–5% of capex/yr at ₹500–1,000/tCO₂), improving DSCR by ~0.05–0.15×.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Yield Curve */}
      {activeTab===4 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>India Green Infrastructure Yield Curve vs G-Sec</SectionTitle>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={YIELD_CURVE}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="tenor" tick={{ fill:T.textSec, fontSize:11 }} />
              <YAxis domain={[6.5, 8.8]} tick={{ fill:T.textSec, fontSize:11 }} label={{ value:'Yield %', angle:-90, position:'insideLeft', fill:T.textMut, fontSize:10 }} />
              <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} />
              <Legend />
              <Line type="monotone" dataKey="greenInfra" stroke={T.green} strokeWidth={2} name="Green Infra Bond" dot={{ r:4 }} />
              <Line type="monotone" dataKey="gsec" stroke={T.textSec} strokeWidth={2} name="G-Sec (Benchmark)" dot={{ r:3 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {YIELD_CURVE.filter((_,i)=>i%2===0).map((y,i) => (
              <div key={i} style={{ background:T.surfaceH, borderRadius:6, padding:10 }}>
                <div style={{ color:T.textMut, fontFamily:T.mono, fontSize:11 }}>{y.tenor}</div>
                <div style={{ color:T.green, fontFamily:T.mono, fontSize:14, fontWeight:700 }}>{y.greenInfra}%</div>
                <div style={{ color:T.textSec, fontSize:11 }}>Spread vs G-Sec: +{y.spread}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Blended Finance */}
      {activeTab===5 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>Blended Finance Instruments — India Green Infra</SectionTitle>
          <div style={{ display:'grid', gap:12 }}>
            {BLENDED_FINANCE.map((b,i) => (
              <div key={i} style={{ padding:14, background:T.surfaceH, borderRadius:6, display:'grid', gridTemplateColumns:'180px 1fr 1fr 1fr', gap:12, alignItems:'start' }}>
                <div>
                  <div style={{ color:T.gold, fontFamily:T.mono, fontSize:12, fontWeight:700 }}>{b.instrument}</div>
                  <div style={{ color:T.textMut, fontSize:11, marginTop:2 }}>{b.provider}</div>
                </div>
                <div>
                  <div style={{ color:T.textMut, fontSize:10, marginBottom:2 }}>Rate / Size</div>
                  <div style={{ color:T.green, fontFamily:T.mono, fontSize:12 }}>{b.rateOrSize}</div>
                </div>
                <div>
                  <div style={{ color:T.textMut, fontSize:10, marginBottom:2 }}>Structure</div>
                  <div style={{ color:T.textSec, fontSize:11 }}>{b.structure}</div>
                </div>
                <div>
                  <div style={{ color:T.textMut, fontSize:10, marginBottom:2 }}>Best For</div>
                  <div style={{ color:T.teal, fontSize:11 }}>{b.suitability}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: InvIT Deals */}
      {activeTab===6 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>India InvIT Deal Screen</SectionTitle>
          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:20 }}>
            <thead>
              <tr style={{ background:T.surfaceH }}>
                {['InvIT','Sector','AUM (₹Bn)','Yield','NAV Premium','Green Cert','Carbon Offset'].map(h => <th key={h} style={{ padding:'8px 12px', color:T.textSec, fontSize:11, fontFamily:T.mono, textAlign:'left', borderBottom:`1px solid ${T.border}` }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {INVIT_DEALS.map((d,i) => (
                <tr key={i} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                  <td style={{ padding:'8px 12px', color:T.gold, fontSize:12, fontWeight:600, borderBottom:`1px solid ${T.borderL}` }}>{d.name}</td>
                  <td style={{ padding:'8px 12px', color:T.textSec, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{d.sector}</td>
                  <td style={{ padding:'8px 12px', color:T.text, fontFamily:T.mono, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>₹{d.aum}</td>
                  <td style={{ padding:'8px 12px', color:T.green, fontFamily:T.mono, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{d.yieldPct}%</td>
                  <td style={{ padding:'8px 12px', color:T.amber, fontFamily:T.mono, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>+{d.navPremiumPct}%</td>
                  <td style={{ padding:'8px 12px', color:d.greenCertified?T.green:T.textMut, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{d.greenCertified?'✓':'-'}</td>
                  <td style={{ padding:'8px 12px', color:d.carbonOffset?T.teal:T.textMut, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{d.carbonOffset?'✓':'-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 7: BRSR Compliance */}
      {activeTab===7 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>SEBI BRSR Core Sustainability KPIs</SectionTitle>
          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:20 }}>
            <thead>
              <tr style={{ background:T.surfaceH }}>
                {['KPI Metric','Unit','Industry Benchmark','SEBI Threshold','Mandatory?'].map(h => <th key={h} style={{ padding:'8px 12px', color:T.textSec, fontSize:11, fontFamily:T.mono, textAlign:'left', borderBottom:`1px solid ${T.border}` }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {BRSR_METRICS.map((m,i) => (
                <tr key={i} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                  <td style={{ padding:'8px 12px', color:T.text, fontSize:12, fontWeight:600, borderBottom:`1px solid ${T.borderL}` }}>{m.metric}</td>
                  <td style={{ padding:'8px 12px', color:T.textSec, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{m.unit}</td>
                  <td style={{ padding:'8px 12px', color:T.gold, fontFamily:T.mono, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{m.benchmark}</td>
                  <td style={{ padding:'8px 12px', color:T.green, fontFamily:T.mono, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{m.threshold}</td>
                  <td style={{ padding:'8px 12px', color:m.sebiMandatory?T.red:T.textSec, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{m.sebiMandatory?'Mandatory':'Voluntary'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
            <div style={{ color:T.gold, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:8 }}>BRSR → CCTS → Carbon Revenue Pathway</div>
            <div style={{ color:T.textSec, fontSize:12, lineHeight:1.8 }}>
              SEBI BRSR Core requires assurance (Limited Assurance from FY2024, Reasonable Assurance from FY2027) on 9 KPIs including GHG intensity and water intensity. The assured GHG data forms the evidentiary basis for CCTS CCert issuance — companies demonstrating intensity reduction vs baseline can claim CCerts at ₹500–1,500/tCO₂ on IEX. For infra assets generating 100,000+ tCO₂/yr in avoided emissions (e.g., metro rail), this adds ₹5–15 Cr/yr in carbon revenue.
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: Carbon Credit Eligibility */}
      {activeTab===8 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>Carbon Credit Eligibility by Infra Type</SectionTitle>
          <div style={{ display:'grid', gap:10 }}>
            {INFRA_TYPES.map((t,i) => (
              <div key={i} style={{ padding:14, background:T.surfaceH, borderRadius:6 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ color:T.text, fontSize:13, fontWeight:600 }}>{t.icon} {t.type}</span>
                  <div style={{ display:'flex', gap:8 }}>
                    <span style={{ padding:'2px 8px', background:t.cctsCreditElig?`${T.green}22`:T.surface, color:t.cctsCreditElig?T.green:T.textMut, borderRadius:4, fontSize:11, fontFamily:T.mono }}>CCTS: {t.cctsCreditElig?'Yes':'No'}</span>
                    <span style={{ padding:'2px 8px', background:t.gcfElig?`${T.teal}22`:T.surface, color:t.gcfElig?T.teal:T.textMut, borderRadius:4, fontSize:11, fontFamily:T.mono }}>GCF: {t.gcfElig?'Yes':'No'}</span>
                  </div>
                </div>
                <div style={{ color:T.textSec, fontSize:12 }}>{t.carbonCreditMech}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 9: Deal Pipeline */}
      {activeTab===9 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>India Green Infrastructure Deal Pipeline (2025–2027)</SectionTitle>
          <div style={{ display:'grid', gap:10 }}>
            {[
              { project:'Rajasthan HVDC RE Transmission (3 GW)', sponsor:'Powergrid + Adani', size:'₹18,000 Cr', status:'Financial Close Q3 2025', instruments:'NaBFID 40% + ADB $400M + Green bond ₹5,000 Cr', carbon:'CCTS grid EF reduction ~2.4 MtCO₂/yr' },
              { project:'Mumbai–Ahmedabad Green Metro Extension', sponsor:'MMRDA + Siemens', size:'₹45,000 Cr', status:'DPR Complete', instruments:'JICA ODA ¥200Bn + NaBFID + Mumbai Muni Bond', carbon:'VCS ACM0016 ~1.1 MtCO₂/yr' },
              { project:'Kandla Green Port (H2/NH3 import)', sponsor:'APSEZ + IOCL', size:'₹12,000 Cr', status:'MOU signed', instruments:'IFC anchor equity + AIIB senior debt', carbon:'CCTS shipping ~0.3 MtCO₂/yr' },
              { project:'National Cold Chain (50 hubs)', sponsor:'NCCD + Maersk', size:'₹8,000 Cr', status:'GCF approval Q2 2025', instruments:'GCF $150M grant + NaBFID + SIDBI', carbon:'VCS AM0001 ~0.8 MtCO₂/yr' },
              { project:'Chennai Green Data Centre (300 MW)', sponsor:'Adani Data + Microsoft', size:'₹22,000 Cr', status:'Under construction', instruments:'Green bond $500M + SBI syndication', carbon:'RE100 + PUE credits ~0.6 MtCO₂/yr' },
              { project:'Varanasi Water & Sewage (Smart City)', sponsor:'NMCG + ADB', size:'₹4,500 Cr', status:'Operational 2026', instruments:'ADB $200M + GCF TA + Municipal bond', carbon:'VCS AM0065 ~0.2 MtCO₂/yr' },
            ].map((d,i) => (
              <div key={i} style={{ padding:14, background:T.surfaceH, borderRadius:6 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ color:T.gold, fontSize:13, fontWeight:700 }}>{d.project}</span>
                  <span style={{ color:T.green, fontFamily:T.mono, fontSize:13, fontWeight:700 }}>{d.size}</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:6 }}>
                  <div><div style={{ color:T.textMut, fontSize:10 }}>Sponsor</div><div style={{ color:T.textSec, fontSize:12 }}>{d.sponsor}</div></div>
                  <div><div style={{ color:T.textMut, fontSize:10 }}>Status</div><div style={{ color:T.amber, fontSize:12 }}>{d.status}</div></div>
                  <div><div style={{ color:T.textMut, fontSize:10 }}>Instruments</div><div style={{ color:T.teal, fontSize:11 }}>{d.instruments}</div></div>
                </div>
                <div style={{ marginTop:6, color:T.green, fontSize:11 }}>🌱 {d.carbon}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 10 && (
        <IndiaAdvancedAnalytics
          T={T}
          moduleCode="EP-EA5"
          title="Green Infra DSCR — MC, Driver Tornado & NGFS Yield Scenario Suite"
          mcModel={{
            title: `MC Project DSCR · ${infra.name}`,
            unit: 'x',
            fmt: (n) => n.toFixed(2),
            vars: {
              rev:  { min: annRevenueBnInr * 0.7, mode: annRevenueBnInr, max: annRevenueBnInr * 1.2 },
              opex: { min: annOpexBnInr * 0.8,    mode: annOpexBnInr,    max: annOpexBnInr * 1.4 },
              capex:{ min: capexBnInr * 0.85,     mode: capexBnInr,      max: capexBnInr * 1.25 },
              rate: { min: 0.075,                  mode: 0.085,            max: 0.105 },
            },
            compute: (v) => {
              const ds = v.capex * (debtPct/100) * v.rate;
              return Math.max(0, (v.rev - v.opex) / Math.max(0.01, ds));
            },
          }}
          tornadoModel={{
            title: 'Tornado — DSCR Drivers (±20%)',
            unit: 'x',
            fmt: (n) => `${n.toFixed(2)}x`,
            inputs: {
              rev: annRevenueBnInr,
              opex: annOpexBnInr,
              capex: capexBnInr,
              rate: 0.085,
            },
            compute: (v) => {
              const ds = v.capex * (debtPct/100) * v.rate;
              return Math.max(0, (v.rev - v.opex) / Math.max(0.01, ds));
            },
          }}
          scenarioImpact={(priceUSDt) => {
            const tariffUplift = 1 + (priceUSDt / 500);
            const ds = capexBnInr * (debtPct/100) * 0.085;
            return Math.max(0, (annRevenueBnInr * tariffUplift - annOpexBnInr) / Math.max(0.01, ds));
          }}
          scenarioFmt={(v) => `${v.toFixed(2)}x`}
          scenarioTitle="Carbon Price × NGFS Pathway — DSCR impact"
          defaultCovered={['gov1','gov2','str1','str2','rsk1','rsk2','met1','met2','tgt1']}
          brsrDefault={['p1','p2','p6','p7','p8','p9']}
          peers={{
            title: 'India Green Infra / InvIT Peer Benchmarks',
            cols: [
              { k: 'name',  label: 'InvIT / Platform' },
              { k: 'aum',   label: 'AUM (₹Cr)',         fmt: (v) => `₹${v}` },
              { k: 'yield', label: 'Yield (%)',         fmt: (v) => `${v.toFixed(1)}%` },
              { k: 'dscr',  label: 'DSCR (x)',          fmt: (v) => `${v.toFixed(2)}x` },
              { k: 'ltv',   label: 'LTV (%)',           fmt: (v) => `${v}%` },
              { k: 'rating',label: 'Rating' },
            ],
            rows: [
              { name: 'IRB InvIT',        aum: 6500, yield: 11.2, dscr: 1.45, ltv: 55, rating: 'AAA' },
              { name: 'India Grid Trust', aum: 20500, yield: 9.8,  dscr: 1.60, ltv: 50, rating: 'AAA' },
              { name: 'PowerGrid InvIT',  aum: 13800, yield: 10.1, dscr: 1.70, ltv: 45, rating: 'AAA' },
              { name: 'Virescent Infra',  aum: 7200,  yield: 10.6, dscr: 1.40, ltv: 55, rating: 'AA+' },
              { name: 'Anzen Green',      aum: 2700,  yield: 9.5,  dscr: 1.35, ltv: 60, rating: 'AA'  },
              { name: 'Bharat Highways',  aum: 3200,  yield: 10.8, dscr: 1.50, ltv: 55, rating: 'AA+' },
            ],
          }}
        />
      )}

      <div style={{ marginTop:20, padding:'10px 16px', background:T.surfaceH, borderRadius:6, display:'flex', justifyContent:'space-between', fontFamily:T.mono, fontSize:11, color:T.textMut }}>
        <span>EP-EA5 · India Green Infrastructure & Project Finance</span>
        <span>NaBFID · InvIT · GCF/ADB · BRSR · CCTS · 8 Infra Types · 11 Tabs</span>
      </div>


      {tab === 11 && (
        <IndiaGreenHybridFinance T={T} useCases={[
    {
      tag: 'UC-1', title: 'Green Infra InvIT: 3 GW RE asset monetisation',
      persona: 'ReNew / NTPC Green / Virescent', personaDetail: '3 GW operating RE listed as InvIT on BSE/NSE',
      problem: 'Balance sheet strain limits 4 GW pipeline. Need capital recycling via InvIT at 9.5% distribution yield.', outcome: '₹6,500 Cr InvIT raise → recycles to 4 GW pipeline; sponsor retains 30% + management agreement.',
      capitalStack: [
          { label: 'Public units', amount: 4550, unit: '₹Cr', source: 'BSE/NSE listing' },
          { label: 'Sponsor (locked)', amount: 1950, unit: '₹Cr', source: '30% share' },
          { label: 'InvIT-level debt', amount: 4200, unit: '₹Cr', source: '2.1× EBITDA' },
          { label: 'GCF/ADB anchor', amount: 680, unit: '₹Cr', source: '$80M cornerstone' },
        ],
      revenueStack: [
          { label: 'PPA receipts 3GW × 22%', value: 1380, source: 'Blended ₹2.6/kWh' },
          { label: 'REC sale', value: 55, source: 'CERC floor', scenSens: true },
          { label: 'Merchant 15% surplus', value: 95, source: 'IEX DAM/RTM' },
          { label: 'CCTS credit', value: 110, source: '₹2,200/t × 500kt', scenSens: true },
        ],
      revenueUnit: '₹Cr/yr',
      termSheet: [
          { k: 'Issuance', v: '₹6,500 Cr' },
          { k: 'Yield', v: '9.5% distribution' },
          { k: 'Listing', v: 'BSE + NSE' },
          { k: 'Rating', v: 'AAA/Stable (CRISIL)' },
          { k: 'Sponsor lock', v: '3Y mand + 2Y partial' },
          { k: 'NAV/unit', v: '₹102' },
          { k: 'DPU ratio', v: '>90% of DCF' },
          { k: 'Asset life', v: 'WA 22Y' },
        ],
      dscrCovenant: 1.35,
      financialModel: {
        years: 15, revenue0: 1640, revenueGrowth: 0.018,
        opexPct: 0.18, daPct: 0.10, taxRate: 0.0, wacc: 0.085,
        capex: [150, 140, 130, 125, 120, 115, 110, 105, 100, 95, 90, 85, 80, 75, 70],
        debtService: 1250,
      },
      risk: {
        var95: 125, es99: 285, defaultProb: 0.015,
        policyScore: 8.5, fxSensPct: -2.2, fxPair: 'USD/INR',
        carbonBeta: 0.25, dv01: 8.5, climVaR: 42,
        unit: '₹Cr', ratingImplied: 'AAA (CRISIL) · InvIT pass-through',
      },
      bankability: [
          { label: 'Operating RE quality (3Y+)', score: 9.0 },
          { label: 'Cash flow stability (25Y PPA)', score: 8.5 },
          { label: 'Sponsor governance', score: 8.5 },
          { label: 'DPU sustainability', score: 8.0 },
          { label: 'SEBI InvIT framework', score: 8.5 },
          { label: 'Secondary liquidity', score: 7.0 },
        ],
      lenders: [
          { name: 'SBI Capital / Kotak', instrument: 'BRLM', tenor: 'Perp', pricing: '150bps fee', ticket: '₹6,500Cr', fit: 'High' },
          { name: 'GCF (NABARD)', instrument: 'Cornerstone', tenor: '5Y', pricing: '9.5%', ticket: '$80M', fit: 'High' },
          { name: 'ADB', instrument: 'Anchor investor', tenor: '5Y', pricing: '9.5%', ticket: '$60M', fit: 'High' },
          { name: 'LIC / EPFO', instrument: 'Institutional alloc', tenor: 'Perp', pricing: '9.5%', ticket: '₹1,500Cr', fit: 'High' },
          { name: 'NaBFID', instrument: 'Holdco term', tenor: '10Y', pricing: 'MCLR+120', ticket: '₹1,200Cr', fit: 'High' },
        ],
      closingNotes: '5+ RE InvITs listed (IndiGrid, PowerGrid, Virescent, Bharat Highways). Yield must stay 175-250bps above 10Y G-Sec for price stability; if G-Sec → 8.5%, InvIT yield must re-rate to 10.5-11%.',
    },
    {
      tag: 'UC-2', title: 'NaBFID senior + GCF concessional for ISTS green corridor',
      persona: 'PowerGrid / Adani Transmission', personaDetail: '765kV + HVDC Rajasthan-Gujarat-South green corridor',
      problem: '₹18,500 Cr ISTS for 50 GW RE evacuation; needs 20Y+ tenor at <MCLR+100 + concessional for 12.5% equity IRR on 15.5% regulated RoE.', outcome: 'NaBFID ₹9,500Cr MCLR+110/20Y + GCF $200M 3.5%/25Y + green bond ₹3,500Cr → IRR 13.1%.',
      capitalStack: [
          { label: 'Sponsor equity', amount: 4625, unit: '₹Cr', source: 'PGCIL budget' },
          { label: 'NaBFID senior', amount: 9500, unit: '₹Cr', source: '20Y MCLR+110' },
          { label: 'GCF concessional', amount: 1700, unit: '₹Cr', source: '$200M 3.5%/25Y' },
          { label: 'Green bond (INR)', amount: 3500, unit: '₹Cr', source: 'REC/PFC subs' },
          { label: 'AIIB senior', amount: 1275, unit: '₹Cr', source: '$150M SOFR+155' },
        ],
      revenueStack: [
          { label: 'Transmission charge (CERC)', value: 2870, source: '15.5% RoE × capex' },
          { label: 'Loss pooling', value: 85, source: 'Energy fees' },
          { label: 'Green corridor premium', value: 45, source: 'MoP Phase-II' },
          { label: 'Ancillary services', value: 32, source: 'CERC ancillary regs' },
        ],
      revenueUnit: '₹Cr/yr',
      termSheet: [
          { k: 'Regulator', v: 'CERC MYT' },
          { k: 'Regulated RoE', v: '15.5% on equity' },
          { k: 'Capex', v: '₹18,500 Cr' },
          { k: 'Longest tenor', v: '25Y GCF' },
          { k: 'WACC', v: '8.4%' },
          { k: 'DSCR cov', v: '1.30×' },
          { k: 'DSRA', v: '6M' },
          { k: 'Avail cov', v: '99.5%' },
        ],
      dscrCovenant: 1.30,
      financialModel: {
        years: 25, revenue0: 3032, revenueGrowth: 0.015,
        opexPct: 0.12, daPct: 0.08, taxRate: 0.22, wacc: 0.084,
        capex: [18500, 800, 600, 500, 400, 350, 300, 280, 260, 240, 220, 200, 180, 170, 160, 150, 145, 140, 135, 130, 125, 120, 115, 110, 105],
        debtService: 2240,
      },
      risk: {
        var95: 145, es99: 310, defaultProb: 0.002,
        policyScore: 9.5, fxSensPct: -1.8, fxPair: 'USD/INR (GCF, AIIB)',
        carbonBeta: 0.05, dv01: 24.5, climVaR: 85,
        unit: '₹Cr', ratingImplied: 'AAA (PGCIL PSU)',
      },
      bankability: [
          { label: 'CERC regulated returns', score: 9.5 },
          { label: 'PGCIL sovereign credit', score: 9.5 },
          { label: 'PoC pooling (no counterparty)', score: 9.0 },
          { label: '5Y EPC construction risk', score: 7.0 },
          { label: '765kV + HVDC technology', score: 8.5 },
          { label: 'Tenor match (25Y vs 35Y asset)', score: 9.0 },
        ],
      lenders: [
          { name: 'NaBFID', instrument: 'Senior term', tenor: '20Y', pricing: 'MCLR+110', ticket: '₹9,500Cr', fit: 'High' },
          { name: 'GCF (NABARD)', instrument: 'Concessional senior', tenor: '25Y', pricing: '3.5% fixed', ticket: '$200M', fit: 'High' },
          { name: 'REC / PFC', instrument: 'Tax-free bond', tenor: '15Y', pricing: '7.15-7.25%', ticket: '₹3,500Cr', fit: 'High' },
          { name: 'AIIB', instrument: 'Senior', tenor: '20Y', pricing: 'SOFR+155', ticket: '$150M', fit: 'High' },
          { name: 'ADB', instrument: 'Senior + PRG', tenor: '20Y', pricing: 'SOFR+145', ticket: '$200M', fit: 'High' },
        ],
      closingNotes: 'Transmission is lowest-risk regulated asset (99.9% avail + CERC MYT). GCF concessional 3.5%/25Y lynchpin — blends WACC 8.9%→8.4% (50bps) = ₹185Cr NPV. Critical: forest/wildlife clearances (tiger corridor) 18M delay risk — elevated line mitigates.',
    },
  ]} moduleCode="EP-EA5" title="India Green Infra — NaBFID / InvIT / GCF Capital Stack"
        />
      )}

      <Apr2026CarbonAnalytics moduleCode="EP-EA5" moduleTitle="India Green Infra Finance" flavor="infra" basePrice={16} T={T} />
    </div>
  );
}
