import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import Apr2026CarbonAnalytics from '../../_shared/Apr2026CarbonAnalytics';

const T = { bg:'#0f1117', surface:'#1a1d27', surfaceH:'#22263a', border:'#2a2f45', borderL:'#1e2235', navy:'#1e3a5f', gold:'#d4a843', sage:'#2d6a4f', teal:'#0d4f5c', text:'#e8e0d0', textSec:'#a89880', textMut:'#6b6050', red:'#c0392b', green:'#27ae60', amber:'#e67e22', font:"'DM Sans',sans-serif", mono:"'JetBrains Mono',monospace" };
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const REGIMES = [
  { id:'EU_ETS', name:'EU ETS (EUA)', region:'EU', price2025:70, price2030:95, price2035:130, unit:'€/tCO₂', liquidity:'Very High', volume2024MtCO2:8200, mechanism:'Cap-and-trade', eligible:['Industry','Power','Aviation'], artSixLink:false, corsiaLink:false, color:T.teal },
  { id:'INDIA_CCTS', name:'India CCTS (CCert)', region:'India', price2025:12, price2030:28, price2035:55, unit:'$/tCO₂', liquidity:'Low (nascent)', volume2024MtCO2:50, mechanism:'Intensity-based + offset', eligible:['Manufacturing','Industry','Offset projects'], artSixLink:true, corsiaLink:false, color:T.amber },
  { id:'JAPAN_JCM', name:'Japan JCM (ITMO)', region:'Japan/bilateral', price2025:20, price2030:35, price2035:60, unit:'$/tCO₂', liquidity:'Medium', volume2024MtCO2:15, mechanism:'Article 6.2 bilateral offset', eligible:['Solar','GH2','Forestry','Energy eff.'], artSixLink:true, corsiaLink:true, color:T.gold },
  { id:'VCS', name:'Verra VCS (VCU)', region:'Global', price2025:8, price2030:18, price2035:40, unit:'$/tCO₂', liquidity:'High', volume2024MtCO2:600, mechanism:'Voluntary offset', eligible:['REDD+','RE','Agriculture','Blue carbon'], artSixLink:false, corsiaLink:true, color:T.green },
  { id:'GOLD_STD', name:'Gold Standard (GS)', region:'Global', price2025:12, price2030:25, price2035:45, unit:'$/tCO₂', liquidity:'Medium', volume2024MtCO2:80, mechanism:'Voluntary offset + co-benefits', eligible:['Cookstoves','RE','Water','WASH'], artSixLink:false, corsiaLink:true, color:T.sage },
  { id:'JAPAN_GX', name:'Japan GX-ETS', region:'Japan', price2025:15, price2030:30, price2035:65, unit:'$/tCO₂', liquidity:'Low (developing)', volume2024MtCO2:25, mechanism:'Mandatory (2026+)/voluntary', eligible:['Power','Industry','GX fuels'], artSixLink:false, corsiaLink:false, color:T.navy },
];

const PRICE_HISTORY = [
  { year:2019, EU_ETS:25, INDIA_CCTS:0, JAPAN_JCM:12, VCS:3, GOLD_STD:5, JAPAN_GX:0 },
  { year:2020, EU_ETS:24, INDIA_CCTS:0, JAPAN_JCM:13, VCS:4, GOLD_STD:6, JAPAN_GX:0 },
  { year:2021, EU_ETS:53, INDIA_CCTS:0, JAPAN_JCM:14, VCS:6, GOLD_STD:9, JAPAN_GX:0 },
  { year:2022, EU_ETS:80, INDIA_CCTS:0, JAPAN_JCM:16, VCS:8, GOLD_STD:12, JAPAN_GX:0 },
  { year:2023, EU_ETS:62, INDIA_CCTS:4, JAPAN_JCM:18, VCS:7, GOLD_STD:11, JAPAN_GX:8 },
  { year:2024, EU_ETS:68, INDIA_CCTS:8, JAPAN_JCM:20, VCS:8, GOLD_STD:12, JAPAN_GX:12 },
  { year:2025, EU_ETS:70, INDIA_CCTS:12, JAPAN_JCM:20, VCS:8, GOLD_STD:12, JAPAN_GX:15 },
];

const FORWARD_CURVE = [
  { year:2025, EU_ETS:70, INDIA_CCTS:12, JAPAN_JCM:20, VCS:8, JAPAN_GX:15 },
  { year:2026, EU_ETS:76, INDIA_CCTS:15, JAPAN_JCM:22, VCS:10, JAPAN_GX:18 },
  { year:2027, EU_ETS:82, INDIA_CCTS:18, JAPAN_JCM:25, VCS:12, JAPAN_GX:22 },
  { year:2028, EU_ETS:88, INDIA_CCTS:22, JAPAN_JCM:28, VCS:15, JAPAN_GX:26 },
  { year:2029, EU_ETS:91, INDIA_CCTS:25, JAPAN_JCM:31, VCS:16, JAPAN_GX:28 },
  { year:2030, EU_ETS:95, INDIA_CCTS:28, JAPAN_JCM:35, VCS:18, JAPAN_GX:30 },
  { year:2031, EU_ETS:103, INDIA_CCTS:33, JAPAN_JCM:40, VCS:22, JAPAN_GX:35 },
  { year:2032, EU_ETS:112, INDIA_CCTS:38, JAPAN_JCM:45, VCS:26, JAPAN_GX:40 },
  { year:2033, EU_ETS:118, INDIA_CCTS:44, JAPAN_JCM:50, VCS:30, JAPAN_GX:46 },
  { year:2034, EU_ETS:124, INDIA_CCTS:49, JAPAN_JCM:55, VCS:34, JAPAN_GX:52 },
  { year:2035, EU_ETS:130, INDIA_CCTS:55, JAPAN_JCM:60, VCS:40, JAPAN_GX:65 },
];

const ARBITRAGE_PAIRS = [
  { src:'INDIA_CCTS', dst:'EU_ETS', srcName:'India CCert', dstName:'EU EUA', conversionNote:'Article 6 CA required; 5% SOP deducted', artSix:true, corsiaElig:false, risk:'High (regulatory)' },
  { src:'VCS', dst:'EU_ETS', srcName:'VCS VCU', dstName:'EU EUA', conversionNote:'Not eligible for EU ETS — voluntary only', artSix:false, corsiaElig:false, risk:'Ineligible' },
  { src:'JAPAN_JCM', dst:'JAPAN_GX', srcName:'JCM ITMO', dstName:'GX-ETS', conversionNote:'70% of JCM credit goes to Japan GX; direct use', artSix:true, corsiaElig:true, risk:'Low' },
  { src:'VCS', dst:'JAPAN_GX', srcName:'VCS (Nature/RE)', dstName:'GX-ETS', conversionNote:'GX recognises high-quality VCS from 2026E', artSix:false, corsiaElig:true, risk:'Medium' },
  { src:'INDIA_CCTS', dst:'JAPAN_JCM', srcName:'India CCert', dstName:'JCM ITMO', conversionNote:'JCM covers India bilateral projects; 30% India NDC share', artSix:true, corsiaElig:true, risk:'Medium' },
  { src:'GOLD_STD', dst:'CORSIA', srcName:'Gold Standard', dstName:'CORSIA OISC', conversionNote:'GS CORSIA-eligible; offset unit accepted from 2024', artSix:false, corsiaElig:true, risk:'Low' },
];

const INDIA_CORPORATE_PATHWAYS = [
  { company:'Tata Steel', scope12MtCO2:15.2, targetYr:2045, cctsBuyReqMt:2.4, jcmOption:true, vcsBuy:1.0, euCbamExp:true, strategy:'CCTS obligation + JCM for export shadow cost' },
  { company:'Reliance Industries', scope12MtCO2:88, targetYr:2035, cctsBuyReqMt:15, jcmOption:false, vcsBuy:5.0, euCbamExp:true, strategy:'Massive CCTS + VCS portfolio diversification' },
  { company:'Mahindra & Mahindra', scope12MtCO2:3.2, targetYr:2040, cctsBuyReqMt:0.5, jcmOption:false, vcsBuy:0.8, euCbamExp:false, strategy:'SBTi aligned · RE100 + VCS top-up' },
  { company:'JSW Steel', scope12MtCO2:18.5, targetYr:2050, cctsBuyReqMt:3.1, jcmOption:true, vcsBuy:1.5, euCbamExp:true, strategy:'Steel CBAM + CCTS dual compliance' },
  { company:'Adani Ports', scope12MtCO2:4.8, targetYr:2040, cctsBuyReqMt:0.8, jcmOption:false, vcsBuy:0.5, euCbamExp:false, strategy:'Port decarbonization + VCS blue carbon' },
];

const PORTFOLIO_DEFAULTS = { EU_ETS:0, INDIA_CCTS:30, JAPAN_JCM:25, VCS:30, GOLD_STD:10, JAPAN_GX:5 };

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

const calcArbitrageRevenue = ({ srcPrice, dstPrice, qty, artSixDeductPct }) => {
  const spread = dstPrice - srcPrice;
  const netQty = qty * (1 - artSixDeductPct/100);
  const revenue = spread * netQty;
  return { spread, netQty: netQty.toFixed(0), revenue: revenue.toFixed(1) };
};

const calcPortfolioVaR = ({ weights, prices, confidence }) => {
  const portfolioPrice = Object.entries(weights).reduce((acc, [k,w]) => {
    const regime = REGIMES.find(r => r.id === k);
    return acc + (regime ? regime.price2025 * w/100 : 0);
  }, 0);
  const vol = 0.25;
  const zScore = confidence === 95 ? 1.645 : confidence === 99 ? 2.326 : 1.282;
  const varPct = portfolioPrice * vol * zScore;
  return { portfolioPrice: portfolioPrice.toFixed(1), varPct: varPct.toFixed(1), varPct1yr: (varPct * Math.sqrt(252)).toFixed(1) };
};

export default function CarbonArbitragePortfolioPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [portfolio, setPortfolio] = useState({ ...PORTFOLIO_DEFAULTS });
  const [selSrc, setSelSrc] = useState(0);
  const [selDst, setSelDst] = useState(0);
  const [arbQty, setArbQty] = useState(100000);
  const [artSixDeduct, setArtSixDeduct] = useState(5);
  const [varConfidence, setVarConfidence] = useState(95);
  const [horizonYr, setHorizonYr] = useState(2030);

  const srcR = REGIMES[selSrc];
  const dstR = REGIMES[selDst];
  const spread = dstR.price2025 - srcR.price2025;
  const arbCalc = useMemo(() => calcArbitrageRevenue({ srcPrice:srcR.price2025, dstPrice:dstR.price2025, qty:arbQty, artSixDeductPct:artSixDeduct }), [srcR, dstR, arbQty, artSixDeduct]);
  const portfolioVaR = useMemo(() => calcPortfolioVaR({ weights:portfolio, prices:REGIMES, confidence:varConfidence }), [portfolio, varConfidence]);
  const totalPortfolioPct = Object.values(portfolio).reduce((a,b)=>a+b,0);

  const horizonRow = FORWARD_CURVE.find(r => r.year === horizonYr) || FORWARD_CURVE[5];

  const tabs = ['Overview','Price History','Forward Curve','Arbitrage Calculator','Portfolio Builder','Portfolio VaR','Article 6 ITMO','CORSIA Integration','India Corporate NZ Pathways','Deal Screener'];

  return (
    <div style={{ background:T.bg, minHeight:'100vh', color:T.text, fontFamily:T.font, padding:24 }}>
      <div style={{ borderBottom:`2px solid ${T.gold}`, paddingBottom:16, marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ color:T.textMut, fontSize:11, fontFamily:T.mono, letterSpacing:2, textTransform:'uppercase' }}>EP-EA6 · Cross-Market Carbon Arbitrage</div>
            <h1 style={{ margin:'4px 0 8px', fontSize:28, fontWeight:700, color:T.text }}>Cross-Market Carbon Arbitrage & Net-Zero Portfolio Builder</h1>
            <div style={{ color:T.textSec, fontSize:13 }}>EU ETS · India CCTS · Japan GX-ETS/JCM · VCS/Gold Standard · Article 6 ITMOs · CORSIA · Portfolio VaR</div>
          </div>
          <div style={{ textAlign:'right', fontFamily:T.mono, fontSize:11, color:T.textMut }}>
            <div>EU ETS Volume 2024</div>
            <div style={{ color:T.gold, fontSize:20, fontWeight:700 }}>8.2 GtCO₂</div>
            <div>Global VCM Volume 2024</div>
            <div style={{ color:T.green, fontSize:16, fontWeight:700 }}>~680 MtCO₂</div>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
        <Kpi label="EU ETS Price 2025" value="€70/t" sub="2030 forward: €95/t" color={T.teal} />
        <Kpi label="India CCTS Price" value="$12/t" sub="Nascent · IEX listing expected 2025" color={T.amber} />
        <Kpi label="JCM ITMO Price" value="$20/t" sub="India-Japan bilateral · Art. 6.2" color={T.gold} />
        <Kpi label="VCS Price" value="$8/t" sub="Voluntary · CORSIA-eligible" color={T.green} />
        <Kpi label="EU–India Spread" value="$58/t" sub="Arbitrage ceiling (pre-CA deduction)" color={T.red} />
        <Kpi label="CORSIA Phase II" value="2027–2035" sub="VCS/GS eligible as OISC from 2024" color={T.textSec} />
      </div>

      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
        {tabs.map((t,i) => <Tab key={i} label={t} active={activeTab===i} onClick={()=>setActiveTab(i)} />)}
      </div>

      {/* Tab 0: Overview */}
      {activeTab===0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Multi-Regime Carbon Market Landscape</SectionTitle>
            <div style={{ color:T.textSec, fontSize:13, lineHeight:1.8 }}>
              The global carbon market is converging across six distinct regimes, each with different price levels, liquidity profiles, and regulatory connectivity under the Paris Agreement. Indian corporates — particularly those in manufacturing, steel, cement, and petrochemicals — now face obligations across multiple systems simultaneously: domestic CCTS compliance, EU CBAM cost exposure, and voluntary VCM retirement for net-zero claims.
              <br/><br/>
              <span style={{ color:T.amber }}>Arbitrage Architecture:</span> The most viable India-focused arbitrage involves directing emission reductions first to CCTS compliance (avoiding ~₹500–1,200/tCO₂ penalties), then channelling high-quality projects through JCM to Japan (capturing the $20/t ITMO premium), and finally using VCS/Gold Standard for voluntary net-zero claims and CORSIA compliance at $8–12/t.
              <br/><br/>
              <span style={{ color:T.gold }}>Article 6 Constraint:</span> Article 6.2 Corresponding Adjustments (CA) are mandatory for any credit used in compliance markets. A 5% Share of Proceeds (SOP) is deducted for adaptation finance. Double-counting is prohibited — a credit claimed by India toward its NDC cannot simultaneously satisfy a foreign buyer's compliance obligation.
              <br/><br/>
              <span style={{ color:T.teal }}>2030 Convergence:</span> As India CCTS matures, the domestic price floor is expected to converge toward $55/t by 2035, eliminating much of the EU-India spread arbitrage — frontloading cross-market positions (2025–2028) maximises arbitrage window.
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Market Regime Comparison</SectionTitle>
            <div style={{ display:'grid', gap:8 }}>
              {REGIMES.map((r,i) => (
                <div key={i} style={{ padding:10, background:T.surfaceH, borderRadius:6, display:'flex', justifyContent:'space-between', alignItems:'center', borderLeft:`3px solid ${r.color}` }}>
                  <div>
                    <div style={{ color:T.text, fontSize:12, fontWeight:600 }}>{r.name}</div>
                    <div style={{ color:T.textMut, fontSize:11 }}>{r.region} · {r.mechanism}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ color:r.color, fontFamily:T.mono, fontSize:14, fontWeight:700 }}>{r.unit.split('/')[0]}{r.price2025}/{r.unit.split('/')[1]}</div>
                    <div style={{ color:T.textSec, fontSize:10 }}>Vol: {r.volume2024MtCO2} Mt/yr</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Price History */}
      {activeTab===1 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>Carbon Price History 2019–2025 ($/tCO₂)</SectionTitle>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={PRICE_HISTORY}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fill:T.textSec, fontSize:11 }} />
              <YAxis tick={{ fill:T.textSec, fontSize:11 }} />
              <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} />
              <Legend />
              <Line type="monotone" dataKey="EU_ETS" stroke={T.teal} strokeWidth={2} name="EU ETS (EUA)" dot={{ r:3 }} />
              <Line type="monotone" dataKey="JAPAN_JCM" stroke={T.gold} strokeWidth={2} name="JCM ITMO" dot={{ r:3 }} />
              <Line type="monotone" dataKey="VCS" stroke={T.green} strokeWidth={2} name="VCS (VCU)" dot={{ r:3 }} />
              <Line type="monotone" dataKey="GOLD_STD" stroke={T.sage} strokeWidth={2} name="Gold Standard" dot={{ r:3 }} />
              <Line type="monotone" dataKey="INDIA_CCTS" stroke={T.amber} strokeWidth={2} name="India CCTS" dot={{ r:3 }} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="JAPAN_GX" stroke={T.navy} strokeWidth={2} name="Japan GX-ETS" dot={{ r:3 }} strokeDasharray="3 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tab 2: Forward Curve */}
      {activeTab===2 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>Carbon Price Forward Curve 2025–2035 ($/tCO₂)</SectionTitle>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            {[2027,2028,2029,2030,2031,2032,2035].map(y => <button key={y} onClick={()=>setHorizonYr(y)} style={{ padding:'5px 12px', background:horizonYr===y?T.navy:'transparent', color:horizonYr===y?T.gold:T.textSec, border:`1px solid ${horizonYr===y?T.gold:T.border}`, borderRadius:4, cursor:'pointer', fontFamily:T.mono, fontSize:11 }}>{y}</button>)}
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16 }}>
            {REGIMES.map(r => (
              <div key={r.id} style={{ background:T.surfaceH, borderRadius:6, padding:'8px 14px', borderLeft:`3px solid ${r.color}` }}>
                <div style={{ color:T.textMut, fontSize:10, fontFamily:T.mono }}>{r.name}</div>
                <div style={{ color:r.color, fontFamily:T.mono, fontSize:16, fontWeight:700 }}>${horizonRow[r.id] ?? '–'}/t</div>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={FORWARD_CURVE}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fill:T.textSec, fontSize:11 }} />
              <YAxis tick={{ fill:T.textSec, fontSize:11 }} />
              <Tooltip contentStyle={{ background:T.surfaceH, border:`1px solid ${T.border}`, color:T.text }} />
              <Legend />
              <Area type="monotone" dataKey="EU_ETS" stroke={T.teal} fill={`${T.teal}11`} name="EU ETS" />
              <Area type="monotone" dataKey="JAPAN_JCM" stroke={T.gold} fill={`${T.gold}11`} name="JCM ITMO" />
              <Area type="monotone" dataKey="INDIA_CCTS" stroke={T.amber} fill={`${T.amber}11`} name="India CCTS" />
              <Line type="monotone" dataKey="VCS" stroke={T.green} strokeWidth={2} name="VCS" />
              <Line type="monotone" dataKey="JAPAN_GX" stroke={T.navy} strokeWidth={2} name="Japan GX-ETS" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tab 3: Arbitrage Calculator */}
      {activeTab===3 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Cross-Market Arbitrage Calculator</SectionTitle>
            <div style={{ display:'grid', gap:12, marginBottom:16 }}>
              <div>
                <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:4 }}>Source Market (Buy Cheap)</label>
                <select value={selSrc} onChange={e=>setSelSrc(+e.target.value)} style={{ width:'100%', background:T.surfaceH, color:T.text, border:`1px solid ${T.border}`, borderRadius:4, padding:'6px 10px', fontFamily:T.mono, fontSize:12 }}>
                  {REGIMES.map((r,i) => <option key={i} value={i}>{r.name} — ${r.price2025}/t</option>)}
                </select>
              </div>
              <div>
                <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:4 }}>Destination Market (Sell Premium)</label>
                <select value={selDst} onChange={e=>setSelDst(+e.target.value)} style={{ width:'100%', background:T.surfaceH, color:T.text, border:`1px solid ${T.border}`, borderRadius:4, padding:'6px 10px', fontFamily:T.mono, fontSize:12 }}>
                  {REGIMES.map((r,i) => <option key={i} value={i}>{r.name} — ${r.price2025}/t</option>)}
                </select>
              </div>
              <div>
                <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:4 }}>Volume (tCO₂): {arbQty.toLocaleString()} t</label>
                <input type="range" min={1000} max={5000000} step={1000} value={arbQty} onChange={e=>setArbQty(+e.target.value)} style={{ width:'100%' }} />
              </div>
              <div>
                <label style={{ color:T.textSec, fontSize:12, display:'block', marginBottom:4 }}>Article 6 CA Deduction: {artSixDeduct}%</label>
                <input type="range" min={0} max={15} step={1} value={artSixDeduct} onChange={e=>setArtSixDeduct(+e.target.value)} style={{ width:'100%' }} />
              </div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
              <div style={{ display:'grid', gap:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textSec, fontSize:12 }}>Gross Spread</span><span style={{ color:spread>0?T.green:T.red, fontFamily:T.mono, fontSize:14 }}>${spread.toFixed(1)}/t</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textSec, fontSize:12 }}>Net Credits After CA</span><span style={{ color:T.gold, fontFamily:T.mono }}>{arbCalc.netQty} tCO₂</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textSec, fontSize:12 }}>Gross Revenue</span><span style={{ color:T.green, fontFamily:T.mono, fontSize:18, fontWeight:700 }}>${arbCalc.revenue}K</span></div>
              </div>
              {spread <= 0 && <div style={{ marginTop:10, color:T.red, fontSize:12 }}>⚠ No arbitrage opportunity — destination price ≤ source price</div>}
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Arbitrage Pair Analysis</SectionTitle>
            <div style={{ display:'grid', gap:8 }}>
              {ARBITRAGE_PAIRS.map((p,i) => {
                const s = REGIMES.find(r=>r.id===p.src);
                const d = REGIMES.find(r=>r.id===p.dst);
                const sprd = d && s ? d.price2025 - s.price2025 : 0;
                return (
                  <div key={i} style={{ padding:12, background:T.surfaceH, borderRadius:6, borderLeft:`3px solid ${p.risk==='Low'?T.green:p.risk==='Medium'?T.amber:p.risk==='Ineligible'?T.textMut:T.red}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                      <span style={{ color:T.text, fontSize:12 }}>{p.srcName} → {p.dstName}</span>
                      <span style={{ color:sprd>0?T.green:T.textMut, fontFamily:T.mono, fontSize:12 }}>${sprd}/t spread</span>
                    </div>
                    <div style={{ color:T.textSec, fontSize:11 }}>{p.conversionNote}</div>
                    <div style={{ display:'flex', gap:8, marginTop:4 }}>
                      {p.artSix && <span style={{ color:T.teal, fontSize:10, fontFamily:T.mono }}>Art.6</span>}
                      {p.corsiaElig && <span style={{ color:T.green, fontSize:10, fontFamily:T.mono }}>CORSIA</span>}
                      <span style={{ color:p.risk==='Low'?T.green:p.risk==='Medium'?T.amber:T.red, fontSize:10, fontFamily:T.mono }}>Risk: {p.risk}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Portfolio Builder */}
      {activeTab===4 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Carbon Portfolio Allocation Builder</SectionTitle>
            <div style={{ display:'grid', gap:10, marginBottom:16 }}>
              {REGIMES.map((r,i) => (
                <div key={i}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <label style={{ color:r.color, fontSize:12, fontFamily:T.mono }}>{r.name}</label>
                    <span style={{ color:T.gold, fontFamily:T.mono, fontSize:12 }}>{portfolio[r.id]}%</span>
                  </div>
                  <input type="range" min={0} max={80} step={5} value={portfolio[r.id]} onChange={e=>setPortfolio(prev=>({...prev,[r.id]:+e.target.value}))} style={{ width:'100%' }} />
                </div>
              ))}
            </div>
            <div style={{ padding:10, background:totalPortfolioPct===100?`${T.green}11`:`${T.red}11`, border:`1px solid ${totalPortfolioPct===100?T.green:T.red}33`, borderRadius:4, color:totalPortfolioPct===100?T.green:T.red, fontFamily:T.mono, fontSize:12 }}>
              Total: {totalPortfolioPct}% {totalPortfolioPct!==100?`(adjust by ${100-totalPortfolioPct}%)`:' ✓'}
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Portfolio Analytics</SectionTitle>
            <div style={{ display:'grid', gap:8 }}>
              {REGIMES.map((r,i) => {
                const w = portfolio[r.id];
                const fwd = (FORWARD_CURVE.find(f=>f.year===2030)?.[r.id] ?? r.price2025);
                const gain = ((fwd - r.price2025) / r.price2025 * 100).toFixed(0);
                return (
                  <div key={i} style={{ padding:'8px 12px', background:T.surfaceH, borderRadius:4, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                      <div style={{ width:10, height:10, background:r.color, borderRadius:2 }} />
                      <div>
                        <div style={{ color:T.text, fontSize:11 }}>{r.name}</div>
                        <div style={{ color:T.textMut, fontSize:10 }}>2030 target: ${fwd}/t (+{gain}%)</div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ color:T.gold, fontFamily:T.mono, fontSize:12 }}>{w}%</div>
                      <div style={{ color:T.textSec, fontSize:10 }}>${(r.price2025*w/100).toFixed(1)} wtd</div>
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop:8, padding:12, background:`${T.teal}11`, borderRadius:6 }}>
                <div style={{ color:T.teal, fontFamily:T.mono, fontSize:12 }}>Weighted Avg Price (2025): ${portfolioVaR.portfolioPrice}/t</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Portfolio VaR */}
      {activeTab===5 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Carbon Portfolio Value-at-Risk (VaR)</SectionTitle>
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {[90,95,99].map(c => <button key={c} onClick={()=>setVarConfidence(c)} style={{ padding:'6px 14px', background:varConfidence===c?T.navy:'transparent', color:varConfidence===c?T.gold:T.textSec, border:`1px solid ${varConfidence===c?T.gold:T.border}`, borderRadius:4, cursor:'pointer', fontFamily:T.mono, fontSize:12 }}>{c}% CI</button>)}
            </div>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:16 }}>
              <div style={{ display:'grid', gap:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textSec, fontSize:12 }}>Weighted Avg Price</span><span style={{ color:T.gold, fontFamily:T.mono, fontSize:16 }}>${portfolioVaR.portfolioPrice}/t</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textSec, fontSize:12 }}>1-Day VaR ({varConfidence}%)</span><span style={{ color:T.red, fontFamily:T.mono, fontSize:16 }}>-${portfolioVaR.varPct}/t</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:T.textSec, fontSize:12 }}>Annualised VaR ({varConfidence}%)</span><span style={{ color:T.red, fontFamily:T.mono, fontSize:16 }}>-${portfolioVaR.varPct1yr}/t</span></div>
              </div>
              <div style={{ marginTop:12, color:T.textSec, fontSize:11, lineHeight:1.6 }}>
                Assumptions: 25% annualised vol (correlated across regimes); normal distribution; EU ETS dominates portfolio risk. Regulatory risk (CBAM implementation, CCTS compliance date slippage) is not captured in statistical VaR.
              </div>
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
            <SectionTitle>Risk Factor Analysis</SectionTitle>
            {[
              { risk:'EU ETS Policy Risk', type:'Regulatory', severity:'Medium', desc:'MSR trigger at EUA vol >833Mt; sudden surplus injection → price crash. Historical: 2019 Backloading collapse.' },
              { risk:'India CCTS Delay', type:'Regulatory', severity:'High', desc:'BEE consultation delays CCert market launch. Current target Q3 2025 may slip to 2026.' },
              { risk:'Article 6 Interpretation', type:'Legal', severity:'High', desc:'Corresponding Adjustment (CA) ambiguity. Some buyers rejecting credits without CA confirmation.' },
              { risk:'Currency Risk (INR/USD)', type:'FX', severity:'Medium', desc:'CCTS priced in INR; USD-reporting portfolio takes FX exposure. INR historically -3%/yr vs USD.' },
              { risk:'Counterparty Risk', type:'Credit', severity:'Low', desc:'JCM ITMOs backed by Japan government bilateral; EU EUAs exchange-cleared. VCS counterparty risk on OTC deals.' },
              { risk:'Quality/Integrity Risk', type:'Operational', severity:'High', desc:'VCS/GS credit quality widely variable. Berkeley CARB study: 94% of REDD+ credits overestimated reductions.' },
            ].map((r,i) => (
              <div key={i} style={{ padding:10, background:T.surfaceH, borderRadius:4, marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                  <span style={{ color:T.text, fontSize:12, fontWeight:600 }}>{r.risk}</span>
                  <span style={{ padding:'1px 8px', background:`${r.severity==='High'?T.red:r.severity==='Medium'?T.amber:T.green}22`, color:r.severity==='High'?T.red:r.severity==='Medium'?T.amber:T.green, borderRadius:4, fontSize:10, fontFamily:T.mono }}>{r.severity}</span>
                </div>
                <div style={{ color:T.textMut, fontSize:10 }}>{r.type}</div>
                <div style={{ color:T.textSec, fontSize:11, marginTop:4 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Article 6 ITMO */}
      {activeTab===6 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>Article 6 ITMO Flow — India to Japan/EU</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
            {[
              { step:'1. Project Registration', detail:'India project registered under CCTS/JCM. Methodology approved by BEE/UNFCCC SB.' },
              { step:'2. Emission Reduction Verified', detail:'Third-party VVB verifies MRV. Corresponding Adjustment (CA) applied to India NDC registry.' },
              { step:'3. ITMO Issuance', detail:'India NDC registry issues ITMO. First transfer recorded under Art. 6.2 bilateral agreement.' },
              { step:'4. Destination Use', detail:'Japan GX-ETS (70% share) or EU CBAM offset (discussed). 5% SOP to Adaptation Fund.' },
            ].map((s,i) => (
              <div key={i} style={{ background:T.surfaceH, borderRadius:6, padding:14, borderTop:`2px solid ${T.gold}` }}>
                <div style={{ color:T.gold, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:6 }}>{s.step}</div>
                <div style={{ color:T.textSec, fontSize:12, lineHeight:1.6 }}>{s.detail}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
              <div style={{ color:T.teal, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:8 }}>India NDC Accounting Impact</div>
              <div style={{ color:T.textSec, fontSize:12, lineHeight:1.8 }}>
                India's NDC 2022 targets 45% GHG intensity reduction by 2030 (vs 2005). ITMOs exported to Japan count as India's contribution only if India retains the corresponding adjustment benefit — meaning ITMOs transferred to Japan are subtracted from India's national inventory credit, reducing India's "headroom" for domestic emissions.
                <br/><br/>
                Optimal strategy: export ITMOs only from <span style={{ color:T.gold }}>additionality projects</span> that exceed India's NDC trajectory, ensuring no headroom sacrifice.
              </div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
              <div style={{ color:T.amber, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:8 }}>Article 6.4 Supervisory Body (A6.4ERs)</div>
              <div style={{ color:T.textSec, fontSize:12, lineHeight:1.8 }}>
                The UNFCCC Article 6.4 Supervisory Body approved the first methodologies in 2024. A6.4 Emission Reduction units (A6.4ERs) are expected to replace VCS as the premium standard from 2026. Indian solar and GH2 projects can register under A6.4 for dual compliance (CCTS domestic + A6.4 international), generating credits usable in both India CCTS and Japan GX-ETS via bilateral recognition agreements.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: CORSIA */}
      {activeTab===7 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>CORSIA (Carbon Offsetting and Reduction Scheme for International Aviation)</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
              <div style={{ color:T.gold, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:8 }}>CORSIA Phase Structure</div>
              {[
                ['Pilot Phase','2021–2023','Voluntary · 107 countries'],
                ['Phase I','2024–2026','Voluntary · expanding list'],
                ['Phase II','2027–2035','Mandatory for all ICAO members'],
              ].map(([ph,yr,note],i) => (
                <div key={i} style={{ padding:'8px 10px', background:T.surface, borderRadius:4, marginBottom:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:T.teal, fontFamily:T.mono, fontSize:12 }}>{ph}</span>
                    <span style={{ color:T.textSec, fontSize:11 }}>{yr}</span>
                  </div>
                  <div style={{ color:T.textMut, fontSize:10 }}>{note}</div>
                </div>
              ))}
            </div>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
              <div style={{ color:T.amber, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:8 }}>CORSIA Eligible Offset Schemes (OISC)</div>
              {[
                ['Gold Standard','CORSIA approved 2021–2024','High — SDG co-benefits valued'],
                ['Verra VCS','CORSIA approved 2021–2024','High — large volume'],
                ['American Carbon Registry','CORSIA approved','Medium'],
                ['JCM (Article 6.2)','CORSIA eligible (bilateral)','Medium — additionality uncertain'],
                ['India CCTS CCert','Not yet approved','Low — regulatory immaturity'],
              ].map(([s,status,quality],i) => (
                <div key={i} style={{ padding:'6px 10px', background:T.surface, borderRadius:4, marginBottom:4 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:T.text, fontSize:11 }}>{s}</span>
                    <span style={{ color:quality.startsWith('High')?T.green:quality.startsWith('Medium')?T.amber:T.red, fontSize:10 }}>{quality}</span>
                  </div>
                  <div style={{ color:T.textMut, fontSize:10 }}>{status}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
            <div style={{ color:T.gold, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:6 }}>India Aviation CORSIA Exposure</div>
            <div style={{ color:T.textSec, fontSize:12, lineHeight:1.8 }}>
              IndiGo, Air India, and Vistara (now merged) are obligated under CORSIA Phase I/II for international routes. India's voluntary participation means airlines must offset growth in international emissions above 2019 baseline. At ~1.5 Mt CO₂/yr growth trajectory, India airlines face ~0.5–0.8 Mt/yr CORSIA offset demand by 2030 — creating domestic demand for VCS/GS credits at $8–12/t. JCM-linked Indian RE projects are well-positioned to serve this demand, providing a domestic buyer base for CORSIA-eligible units.
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: India Corporate NZ Pathways */}
      {activeTab===8 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>India Corporate Net-Zero Carbon Finance Pathways</SectionTitle>
          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:20 }}>
            <thead>
              <tr style={{ background:T.surfaceH }}>
                {['Company','Scope 1+2 (MtCO₂/yr)','NZ Target','CCTS Buy (Mt)','VCS Buy (Mt)','EU CBAM?','Strategy'].map(h => <th key={h} style={{ padding:'8px 12px', color:T.textSec, fontSize:11, fontFamily:T.mono, textAlign:'left', borderBottom:`1px solid ${T.border}` }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {INDIA_CORPORATE_PATHWAYS.map((c,i) => (
                <tr key={i} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                  <td style={{ padding:'8px 12px', color:T.gold, fontSize:12, fontWeight:600, borderBottom:`1px solid ${T.borderL}` }}>{c.company}</td>
                  <td style={{ padding:'8px 12px', color:T.text, fontFamily:T.mono, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{c.scope12MtCO2}</td>
                  <td style={{ padding:'8px 12px', color:T.teal, fontFamily:T.mono, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{c.targetYr}</td>
                  <td style={{ padding:'8px 12px', color:T.amber, fontFamily:T.mono, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{c.cctsBuyReqMt}</td>
                  <td style={{ padding:'8px 12px', color:T.green, fontFamily:T.mono, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{c.vcsBuy}</td>
                  <td style={{ padding:'8px 12px', color:c.euCbamExp?T.red:T.textMut, fontSize:12, borderBottom:`1px solid ${T.borderL}` }}>{c.euCbamExp?'Yes':'No'}</td>
                  <td style={{ padding:'8px 12px', color:T.textSec, fontSize:11, borderBottom:`1px solid ${T.borderL}` }}>{c.strategy}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
              <div style={{ color:T.gold, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:8 }}>SBTi Alignment for Indian Corporates</div>
              <div style={{ color:T.textSec, fontSize:12, lineHeight:1.8 }}>
                As of 2025, <span style={{ color:T.gold }}>487 Indian companies</span> have signed SBTi commitments, with 112 having approved targets. The Corporate Net-Zero Standard (2021) requires: (1) near-term targets by 2030 of 42–50% Scope 1+2 reduction; (2) long-term net-zero by 2050 with 90%+ reduction; (3) only 5–10% residual offset via permanent carbon removal. This limits the role of CCTS/VCS credits to the 5–10% residual — incentivising actual emissions reductions over offset purchasing.
              </div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:6, padding:14 }}>
              <div style={{ color:T.amber, fontFamily:T.mono, fontSize:12, fontWeight:700, marginBottom:8 }}>Net-Zero Portfolio Construction Rules</div>
              {[
                'Priority 1: Internal abatement (RE100, electrification, efficiency)',
                'Priority 2: CCTS compliance purchase for obligated Scope 1+2',
                'Priority 3: JCM ITMOs for export-exposed Scope 1+2 (CBAM shadow)',
                'Priority 4: VCS/GS for Scope 3 and voluntary net-zero claims',
                'Priority 5: Permanent CDR (BECCS/DAC) for 5–10% residual',
              ].map((r,i) => (
                <div key={i} style={{ padding:'6px 10px', background:T.surface, borderRadius:4, marginBottom:4, color:T.textSec, fontSize:12 }}>
                  {r}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 9: Deal Screener */}
      {activeTab===9 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20 }}>
          <SectionTitle>Cross-Market Carbon Deal Screener</SectionTitle>
          <div style={{ display:'grid', gap:10 }}>
            {[
              { deal:'India Solar IPP → JCM ITMO → Japan GX-ETS', vol:'2 MtCO₂/yr', price:'$20/t ITMO', revenue:'$40M/yr', artSix:'6.2', risk:'Low', mechanism:'ACM0002 + JCM methodology · NTPC/Greenko eligible' },
              { deal:'India Green NH3 → JCM ITMO → Japan co-firing', vol:'1.7 MtCO₂/yr', price:'$22/t', revenue:'$37M/yr', artSix:'6.2', risk:'Low', mechanism:'JCM bilateral MOU signed · NH3 ammonia tanker route' },
              { deal:'India REDD+ → VCS → CORSIA (Airlines)', vol:'0.5 MtCO₂/yr', price:'$8/t', revenue:'$4M/yr', artSix:'None', risk:'High', mechanism:'VCS VM0006/VM0015 · integrity risk (Berkeley study)' },
              { deal:'India Renewable Energy → CCTS CCert → Domestic obligation', vol:'0.8 MtCO₂/yr', price:'₹800/t ($10/t)', revenue:'$8M/yr', artSix:'None', risk:'Medium', mechanism:'IEX CCert marketplace · BEE registered offset project' },
              { deal:'India GH2 → A6.4ER → EU H2 import (RFNBO+Art.6)', vol:'0.4 MtCO₂/yr', price:'$30/t', revenue:'$12M/yr', artSix:'6.4', risk:'Medium', mechanism:'UNFCCC Art 6.4 SB approval Q4 2025 · new pathway' },
              { deal:'India Blue Carbon → VCS VM0033 → Global VCM', vol:'0.2 MtCO₂/yr', price:'$35/t', revenue:'$7M/yr', artSix:'None', risk:'Low–Medium', mechanism:'Mangrove restoration · Sundarbans JFM · co-benefits' },
            ].map((d,i) => (
              <div key={i} style={{ padding:14, background:T.surfaceH, borderRadius:6 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ color:T.gold, fontSize:13, fontWeight:700 }}>{d.deal}</span>
                  <span style={{ color:T.green, fontFamily:T.mono, fontSize:13, fontWeight:700 }}>{d.revenue}</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                  <div><div style={{ color:T.textMut, fontSize:10 }}>Volume</div><div style={{ color:T.teal, fontSize:11, fontFamily:T.mono }}>{d.vol}</div></div>
                  <div><div style={{ color:T.textMut, fontSize:10 }}>Price</div><div style={{ color:T.amber, fontSize:11, fontFamily:T.mono }}>{d.price}</div></div>
                  <div><div style={{ color:T.textMut, fontSize:10 }}>Art. 6</div><div style={{ color:T.teal, fontSize:11 }}>{d.artSix}</div></div>
                  <div><div style={{ color:T.textMut, fontSize:10 }}>Risk</div><div style={{ color:d.risk==='Low'?T.green:d.risk.includes('Medium')?T.amber:T.red, fontSize:11 }}>{d.risk}</div></div>
                </div>
                <div style={{ marginTop:6, color:T.textSec, fontSize:11 }}>{d.mechanism}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop:20, padding:'10px 16px', background:T.surfaceH, borderRadius:6, display:'flex', justifyContent:'space-between', fontFamily:T.mono, fontSize:11, color:T.textMut }}>
        <span>EP-EA6 · Cross-Market Carbon Arbitrage & Net-Zero Portfolio Builder</span>
        <span>EU ETS · CCTS · JCM · VCS · Article 6 · CORSIA · 6 Regimes · 10 Tabs</span>
      </div>

      <Apr2026CarbonAnalytics moduleCode="EP-EA6" moduleTitle="Carbon Arbitrage & NZ Portfolio" flavor="arbitrage" basePrice={25} T={T} />
    </div>
  );
}
