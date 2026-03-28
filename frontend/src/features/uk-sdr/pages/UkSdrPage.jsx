import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  LineChart, Line, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

/* ================================================================= THEME */
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

/* ================================================================= HELPERS */
const fmt1 = n => Number(n).toFixed(1);
const pct = n => `${n}%`;

/* ================================================================= SHARED STYLES */
const S = {
  page: { background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: '0 0 48px' },
  header: { background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyL} 100%)`, padding: '28px 32px 24px', color: '#fff' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: '#fff', marginRight: 8, marginTop: 4 },
  tabBar: { display: 'flex', gap: 0, background: T.surface, borderBottom: `1px solid ${T.border}`, overflowX: 'auto', padding: '0 24px' },
  tab: active => ({ padding: '12px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: active ? T.navy : T.textSec, borderBottom: active ? `2px solid ${T.gold}` : '2px solid transparent', whiteSpace: 'nowrap', transition: 'color 0.15s', background: 'none', border: 'none', borderBottom: active ? `2px solid ${T.gold}` : '2px solid transparent' }),
  body: { padding: '24px 32px', maxWidth: 1280, margin: '0 auto' },
  grid: cols => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }),
  card: (extra={}) => ({ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, boxShadow: T.card, ...extra }),
  kpiCard: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', boxShadow: T.card },
  kpiVal: { fontSize: 26, fontWeight: 700, color: T.navy, letterSpacing: '-0.5px' },
  kpiLabel: { fontSize: 12, color: T.textSec, marginTop: 2 },
  kpiSub: { fontSize: 11, color: T.textMut, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 },
  pill: (color='#e2e8f0', text='#1b3a5c') => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: color, color: text }),
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { background: T.surfaceH, color: T.textSec, fontWeight: 700, padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' },
  td: { padding: '9px 12px', borderBottom: `1px solid ${T.border}`, verticalAlign: 'middle' },
};

/* ================================================================= DATA */
const SDR_LABELS = [
  { id:'focus', name:'Sustainability Focus', color:'#1b3a5c', threshold:'≥70% robust sustainability characteristics', description:'Fund selects assets based on their positive sustainability characteristics.', minInvestment:'70% of NAV at all times', disclosures:['Pre-contractual','Consumer-facing (2-page)','Annual report','Ongoing product-level'], kpis:['% NAV meeting criteria','Weighted ESG score','Carbon intensity','Engagement activity'], consumerStatement:'This fund aims to invest at least 70% of its assets in those with positive sustainability characteristics.' },
  { id:'improvers', name:'Sustainability Improvers', color:'#5a8a6a', threshold:'≥70% improving assets', description:'Fund selects assets for their potential to improve their sustainability profile over time.', minInvestment:'70% selected for improvement potential', disclosures:['Pre-contractual','Consumer-facing (2-page)','Annual report','Engagement report'], kpis:['Improvement trajectory','Engagement success rate','Baseline vs current ESG','Stewardship activity'], consumerStatement:'This fund invests in companies with the potential to improve their sustainability over time.' },
  { id:'impact', name:'Sustainability Impact', color:'#c5a96a', threshold:'Specific real-world outcome', description:'Fund pursues a specific positive real-world sustainability outcome with measurable impact.', minInvestment:'Substantial majority pursuing the stated impact', disclosures:['Pre-contractual','Consumer-facing (2-page)','Annual impact report','Theory of change'], kpis:['Impact metrics (e.g. tCO2 avoided)','Additionality evidence','SDG alignment score','Impact per £ invested'], consumerStatement:'This fund aims to achieve a specific sustainability impact through direct investment activity.' },
  { id:'mixed', name:'Sustainability Mixed Goals', color:'#7c3aed', threshold:'Combination of Focus/Improvers/Impact', description:'Fund pursues a mix of sustainability goals using a combination of the above three approaches.', minInvestment:'Aggregate ≥70% across combined strategies', disclosures:['Pre-contractual','Consumer-facing (2-page)','Annual multi-goal report','Strategy allocation disclosure'], kpis:['Allocation by strategy type','Combined sustainability score','Impact metrics where applicable','Cross-strategy engagement'], consumerStatement:'This fund pursues multiple sustainability goals simultaneously, combining focus, improvers and impact strategies.' },
];

const FUND_PORTFOLIO = [
  { name:'UK Equity Sustainability Focus', aum:2.8, label:'Sustainability Focus', compliance:82, retail:65, institutional:35, objective:'Invest in UK cos with top-quintile ESG scores', manager:'Aviva Investors' },
  { name:'Global Green Infrastructure', aum:4.1, label:'Sustainability Impact', compliance:91, retail:20, institutional:80, objective:'Finance renewable energy infrastructure delivering measurable GHG reductions', manager:'LGIM' },
  { name:'Emerging Markets Improvers', aum:1.6, label:'Sustainability Improvers', compliance:74, retail:40, institutional:60, objective:'Engage with EM companies to improve ESG practices over 5-year horizon', manager:'Schroders' },
  { name:'UK Corporate Bond ESG', aum:3.3, label:'Sustainability Focus', compliance:79, retail:55, institutional:45, objective:'Hold bonds from issuers with robust sustainability characteristics', manager:'M&G' },
  { name:'Climate Transition Multi-Asset', aum:2.0, label:'Sustainability Mixed Goals', compliance:68, retail:70, institutional:30, objective:'Blend of transition-aligned, net zero and impact strategies', manager:'Baillie Gifford' },
  { name:'Nature Positive Impact', aum:0.8, label:'Sustainability Impact', compliance:88, retail:25, institutional:75, objective:'Generate biodiversity net gain and natural capital restoration', manager:'Impax AM' },
  { name:'European Equity ESG Core', aum:5.2, label:'Sustainability Focus', compliance:76, retail:60, institutional:40, objective:'90th percentile MSCI ESG score at all times', manager:'BlackRock' },
  { name:'UK Small Cap Growth', aum:0.9, label:'Unlabelled', compliance:38, retail:80, institutional:20, objective:'No sustainability objective declared', manager:'Liontrust' },
];

const LABEL_AUM = [
  { label:'Focus', aum:11.3, funds:3 },
  { label:'Improvers', aum:1.6, funds:1 },
  { label:'Impact', aum:4.9, funds:2 },
  { label:'Mixed Goals', aum:2.0, funds:1 },
  { label:'Unlabelled', aum:0.9, funds:1 },
];

const ELIGIBILITY_STEPS = [
  { step:1, title:'Investment Policy', question:"Does the fund's prospectus explicitly state sustainability as a primary objective?", status:'pass', evidence:"Prospectus Section 2.1 states: \"The Fund's investment objective is to invest at least 70% of NAV in securities with robust sustainability characteristics as defined by the FCA SDR framework.\"", required:'Explicit sustainability objective in offering documents' },
  { step:2, title:'70% Threshold', question:"What % of NAV meets robust sustainability characteristics?", status:'pass', evidence:'Current portfolio analysis: 74.2% of NAV qualifies under the robust sustainability characteristics test. Exceeds 70% minimum threshold. Monthly monitoring confirms consistent compliance.', required:'Minimum 70% of NAV at all times' },
  { step:3, title:'Robust Characteristics Test', question:"Does the selection methodology meet FCA criteria?", status:'pass', evidence:'Methodology documented: ESG score ≥75th percentile (evidenced by MSCI data), quarterly review cycle (ongoing monitoring), exclusion of UNGC violators (measurable). Third-party verification in place.', required:'Evidenced, measurable, ongoing monitored methodology' },
  { step:4, title:'No Significant Harm', question:"Do remaining 30% holdings significantly harm sustainability goals?", status:'warn', evidence:'28.6% of NAV in "transition" holdings. 3 positions (1.4% NAV) require further assessment — energy sector cos with limited disclosure. Remediation plan in place, target Q2 2025.', required:'Remaining 30% must not significantly harm sustainability goals' },
  { step:5, title:'Consumer-Facing Disclosure', question:"Is the 2-page consumer summary document complete and filed?", status:'pass', evidence:'FCA-formatted 2-page summary submitted and published on fund website. Contains standardised label wording, bespoke objective, methodology summary, and monitoring approach. Last updated March 2025.', required:'FCA-standardised 2-page summary, published pre-sale' },
  { step:6, title:'Ongoing Monitoring', question:"Are quarterly 70% threshold checks formally in place?", status:'pass', evidence:'Compliance framework includes automated daily portfolio monitoring with 70% threshold alert at 72% (2% buffer). Quarterly formal attestation by Head of Sustainability. Escalation policy documented.', required:'Quarterly formal threshold attestation with evidence trail' },
];

const BOUNDARY_CASES = [
  { scenario:'Fund holds equity derivatives (total return swaps)', issue:'TRS may not count towards 70% threshold as they are not "investments" in the traditional sense', fcaGuidance:'FCA PS23/16 confirms look-through to reference assets; qualifying if reference asset qualifies. Cash collateral does not count.', outcome:'Conditional — requires look-through analysis and documentation' },
  { scenario:'Futures used for hedging (e.g. index futures short)', issue:'Short futures positions reduce net economic exposure to qualifying assets, potentially breaching 70% calculation', fcaGuidance:'Hedging instruments are excluded from 70% calculation if used solely for risk management and documented as such in risk management policy', outcome:'Acceptable if hedging policy documented and notional exposure remains ≥70%' },
  { scenario:'Cash buffer (>5% NAV in cash/money market)', issue:'Cash and equivalents do not meet sustainability characteristics, reducing qualifying %', fcaGuidance:'Cash for liquidity management purposes is excluded from denominator calculation. FCA allows up to 5% operational cash buffer outside the 70% test.', outcome:'Permissible up to 5%; above 5% requires justification in quarterly board report' },
];

const MARKETING_CLAIMS = [
  { claim:'"Green fund"', status:'NON-COMPLIANT', rationale:'Ambiguous, unsubstantiated. No SDR label held. No specific characteristics described.', action:'Must obtain SDR label or remove all green terminology.' },
  { claim:'"Net Zero 2050 aligned"', status:'CONDITIONAL', rationale:'Credible net zero pathway required. Must show interim 2025/2030 targets, asset-level Scope 1+2+3 data, and exclude expansion fossil fuel assets.', action:'Provide pathway document with interim milestones and annual progress report.' },
  { claim:'"ESG screened"', status:'COMPLIANT', rationale:'Screening criteria are fully disclosed in fund prospectus and on fund fact sheet. Methodology is consistent with fund profile.', action:'No action required. Ensure criteria disclosures remain current.' },
  { claim:'"Carbon neutral"', status:'NON-COMPLIANT', rationale:'No Scope 3 data. Offsets used are not independently verified. Methodology not consistent with Oxford/VCMI standards.', action:'Obtain Scope 1+2+3 audit, use Gold Standard/VCS offsets, publish carbon neutral claim methodology.' },
  { claim:'"Impact investing"', status:'NON-COMPLIANT', rationale:'Fund does not hold SDR Sustainability Impact label. No additionality evidence. No theory of change disclosed.', action:'Obtain SDR Impact label or remove "impact" from all marketing materials.' },
  { claim:'"Sustainable investing"', status:'CONDITIONAL', rationale:'May be used only if substantiated by specific sustainability objectives, characteristics, and processes. Must not imply a sustainability label if not held.', action:'Add qualifying disclosure: specify what "sustainable" means for this fund.' },
  { claim:'"Responsible investment"', status:'CONDITIONAL', rationale:'Lower bar than "sustainable" but still requires that RI policies are disclosed and consistently applied to the fund in question.', action:'Publish RI policy specific to this fund; do not use as a standalone marketing phrase.' },
  { claim:'"Low carbon"', status:'CONDITIONAL', rationale:'Specific carbon intensity metric required. Must define benchmark. "Low" relative to what must be stated. Historical trend data needed.', action:'State carbon intensity (tCO2e/£m) vs benchmark; publish methodology for calculation.' },
  { claim:'"Fossil fuel free"', status:'COMPLIANT', rationale:'Fund holds zero fossil fuel extraction, refining or distribution companies per third-party screen (MSCI ex-Fossil Fuels). Exclusion methodology published.', action:'No action. Maintain published exclusion list and screening methodology.' },
  { claim:'"Paris-aligned"', status:'CONDITIONAL', rationale:'Paris alignment requires TCFD-aligned scenario analysis, net zero pathway, and portfolio temperature metric below 1.5°C. Evidence required.', action:'Commission climate scenario analysis; publish portfolio implied temperature rise (ITR) metric.' },
  { claim:'"Best-in-class ESG"', status:'COMPLIANT', rationale:'Methodology clearly described: top-third MSCI ESG score within each GICS sector. Applied consistently. Data source disclosed.', action:'No action. Ensure methodology document kept updated with data vintage.' },
  { claim:'"Biodiversity positive"', status:'NON-COMPLIANT', rationale:'No biodiversity measurement methodology. No TNFD-aligned disclosure. No baseline or target metric. Claim unsubstantiated.', action:'Adopt TNFD framework; measure ENCORE/IBAT dependencies; publish biodiversity footprint.' },
];

const FCA_ENFORCEMENT = [
  { firm:'Unnamed Asset Manager A', claim:'Marketed as "100% sustainable" fund', finding:'Portfolio contained 42% in non-ESG-screened derivatives and money market instruments. Claim materially misleading.', outcome:'Required to restate all marketing; add prominent disclaimer; 6-month review period.' },
  { firm:'Unnamed Asset Manager B', claim:'"Net zero by 2040" commitment', finding:'No portfolio-level net zero pathway. Only headline commitment without interim milestones or asset-level engagement plan.', outcome:'Required to publish detailed net zero transition plan within 3 months or remove claim.' },
  { firm:'Unnamed Asset Manager C', claim:'"ESG Leaders" fund branding', finding:'Stock selection model weighted ESG scores at only 5% of total score. Fund name inconsistent with investment process.', outcome:'Required to rename fund or increase ESG weighting to ≥50% of selection criteria.' },
];

const FCA_GREENWASHING_CHARS = [
  { char:'Basis for Claims', desc:'Claims must be grounded in factual, evidence-based analysis. Opinions and aspirations must be clearly labelled as such.' },
  { char:'Clarity', desc:'Sustainability claims must be expressed in plain language, understandable to the target audience. Technical jargon without explanation is non-compliant.' },
  { char:'Completeness', desc:'Claims must not omit material information that would change the consumer\'s perception. Cherry-picking data is non-compliant.' },
  { char:'Comparisons', desc:'If comparing to a benchmark, index or peer group, the methodology must be disclosed and the comparison must be like-for-like.' },
  { char:'Forward-Looking Statements', desc:'Targets and forecasts must include appropriate caveats, be based on credible assumptions, and distinguish between committed and aspirational claims.' },
];

const UK_GTF_OBJECTIVES = [
  { obj:'Climate Change Mitigation (CCM)', euAlign:'Full alignment', ukDiff:'Nuclear energy included (UK policy choice). North Sea gas transition provisions to 2035.', activities:['Solar/wind generation','EV manufacturing','Building renovation','Nuclear power (UK only)'] },
  { obj:'Climate Change Adaptation (CCA)', euAlign:'Broad alignment', ukDiff:'UK coastal flooding criteria updated to EA flood risk maps. UK-specific heat stress thresholds.', activities:['Flood defence infrastructure','Drought-resistant agriculture','Resilient transport networks'] },
  { obj:'Water & Marine Resources', euAlign:'Broad alignment', ukDiff:'UK water stress maps used (EA/Ofwat data). Different baseline metrics for water efficiency.', activities:['Water-efficient manufacturing','Wastewater treatment','Marine protected areas'] },
  { obj:'Circular Economy', euAlign:'Partial alignment', ukDiff:'UK plastic packaging levy aligned. Post-Brexit waste shipment rules differ.', activities:['Recycling infrastructure','Product-as-a-service models','Remanufacturing'] },
  { obj:'Pollution Prevention', euAlign:'Broad alignment', ukDiff:'UK REACH regulations post-Brexit diverge on 47 substances. Air quality thresholds use UK AQS.', activities:['Pollution control equipment','Air quality monitoring','Hazardous waste treatment'] },
  { obj:'Biodiversity Protection', euAlign:'Partial alignment', ukDiff:'UK Environment Act 2021 BNG mandate (10% biodiversity net gain). SSSI-specific criteria.', activities:['Nature-based solutions','Habitat restoration','Sustainable forestry'] },
];

const ACTIVITY_COMPARISON = [
  { activity:'Onshore wind', euTax:'Aligned', ukGtf:'Aligned', note:'—' },
  { activity:'Offshore wind', euTax:'Aligned', ukGtf:'Aligned', note:'—' },
  { activity:'Solar PV', euTax:'Aligned', ukGtf:'Aligned', note:'—' },
  { activity:'Nuclear energy', euTax:'Aligned (annex)', ukGtf:'Aligned (included)', note:'UK includes nuclear explicitly' },
  { activity:'North Sea gas (transition)', euTax:'Not aligned', ukGtf:'Conditional', note:'UK transition provisions to 2035' },
  { activity:'Aviation (SAF)', euTax:'Conditional', ukGtf:'Different criteria', note:'UK SAF Mandate differs from EU' },
  { activity:'Hydrogen (green)', euTax:'Aligned', ukGtf:'Aligned', note:'—' },
  { activity:'Hydrogen (blue/CCS)', euTax:'Conditional', ukGtf:'Under review', note:'CCS criteria still being developed' },
  { activity:'Building renovation', euTax:'Aligned', ukGtf:'Aligned', note:'UK EPC rating thresholds used' },
  { activity:'Electric vehicles', euTax:'Aligned', ukGtf:'Aligned', note:'—' },
  { activity:'Waste-to-energy', euTax:'Conditional', ukGtf:'Stricter', note:'UK residual waste gate higher' },
  { activity:'Sustainable forestry', euTax:'Aligned', ukGtf:'UK Forestry Standard', note:'UK uses own standard' },
  { activity:'Data centres', euTax:'Conditional', ukGtf:'Under development', note:'PUE thresholds TBC' },
  { activity:'Bioenergy (BECCS)', euTax:'Conditional', ukGtf:'Under review', note:'Scope differs' },
  { activity:'Financial products', euTax:'Aligned (SFDR link)', ukGtf:'SDR link (future)', note:'GTF will eventually underpin SDR' },
];

const MONITORING_DATA = [
  { month:'Jan 24', focus_a:76, focus_b:74, focus_c:79, improvers:72, impact_a:88, impact_b:91, mixed:71 },
  { month:'Feb 24', focus_a:77, focus_b:73, focus_c:80, improvers:73, impact_a:89, impact_b:92, mixed:70 },
  { month:'Mar 24', focus_a:75, focus_b:75, focus_c:78, improvers:71, impact_a:87, impact_b:90, mixed:72 },
  { month:'Apr 24', focus_a:78, focus_b:76, focus_c:81, improvers:74, impact_a:90, impact_b:91, mixed:73 },
  { month:'May 24', focus_a:79, focus_b:74, focus_c:82, improvers:73, impact_a:89, impact_b:93, mixed:74 },
  { month:'Jun 24', focus_a:77, focus_b:77, focus_c:80, improvers:75, impact_a:91, impact_b:92, mixed:72 },
  { month:'Jul 24', focus_a:80, focus_b:75, focus_c:83, improvers:74, impact_a:90, impact_b:94, mixed:75 },
  { month:'Aug 24', focus_a:78, focus_b:78, focus_c:81, improvers:76, impact_a:92, impact_b:93, mixed:73 },
  { month:'Sep 24', focus_a:81, focus_b:76, focus_c:84, improvers:75, impact_a:91, impact_b:95, mixed:76 },
  { month:'Oct 24', focus_a:79, focus_b:79, focus_c:82, improvers:77, impact_a:93, impact_b:94, mixed:74 },
  { month:'Nov 24', focus_a:82, focus_b:77, focus_c:85, improvers:76, impact_a:92, impact_b:96, mixed:77 },
  { month:'Dec 24', focus_a:80, focus_b:80, focus_c:83, improvers:78, impact_a:94, impact_b:95, mixed:75 },
];

const ENGAGEMENT_OUTCOMES = [
  { company:'Rolls-Royce Holdings', sector:'Aerospace', baselineESG:42, currentESG:61, activity:'Engaged on SMR programme disclosure and Scope 2 renewable transition', improvement:'+19pts' },
  { company:'Barclays plc', sector:'Banking', baselineESG:55, currentESG:68, activity:'Pushed for NZBA-aligned financed emissions reporting by 2025', improvement:'+13pts' },
  { company:'BP plc', sector:'Energy', baselineESG:48, currentESG:58, activity:'Supported low-carbon capex >£6bn/yr commitment and methane intensity target', improvement:'+10pts' },
  { company:'Tesco plc', sector:'Retail', baselineESG:62, currentESG:73, activity:'Scope 3 supply chain mapping for food emissions; plastic reduction targets', improvement:'+11pts' },
  { company:'Legal & General', sector:'Insurance', baselineESG:70, currentESG:79, activity:'Climate scenario analysis aligned to TCFD; physical risk disclosure', improvement:'+9pts' },
  { company:'SSE plc', sector:'Utilities', baselineESG:74, currentESG:84, activity:'Accelerated coal exit; offshore wind pipeline transparency improvement', improvement:'+10pts' },
  { company:'Unilever plc', sector:'Consumer', baselineESG:78, currentESG:85, activity:'Deforestation-free supply chain audit; Scope 3 upstream emissions target', improvement:'+7pts' },
  { company:'Vodafone Group', sector:'Telecoms', baselineESG:58, currentESG:71, activity:'Science-based target submission; e-waste circularity disclosure', improvement:'+13pts' },
];

const REGULATORY_CALENDAR = [
  { date:'May 2024', event:'Anti-Greenwashing Rule effective', type:'rule', status:'completed', detail:'All FCA-authorised firms must comply. No SDR label required to trigger obligations.' },
  { date:'Jul 2024', event:'SDR Labels available (asset managers)', type:'label', status:'completed', detail:'Voluntary uptake from July 2024. FCA published final rules in PS23/16.' },
  { date:'Dec 2024', event:'First consumer-facing disclosures due', type:'disclosure', status:'completed', detail:'For funds using SDR labels from July 2024, first full disclosure cycle.' },
  { date:'Apr 2025', event:'SDR naming & marketing rules', type:'rule', status:'current', detail:'Restrictions on use of sustainability-related terms in fund names.' },
  { date:'Oct 2025', event:'SDR extended to portfolio managers', type:'extension', status:'upcoming', detail:'Managed portfolio service (MPS) and discretionary portfolio managers in scope.' },
  { date:'2025–2026', event:'UK Green Taxonomy final rules', type:'taxonomy', status:'upcoming', detail:'HM Treasury consultation response expected; technical screening criteria finalised.' },
  { date:'Dec 2025', event:'First annual SDR reports due', type:'reporting', status:'upcoming', detail:'Annual sustainability objective attainment reports for funds labelled from Jul 2024.' },
  { date:'2026', event:'UK GTF disclosure obligations', type:'taxonomy', status:'future', detail:'Taxonomy-aligned % disclosure expected to feed into SDR reporting.' },
];

const PEER_COMPARISON = [
  { manager:'Legal & General IM', focus:8, improvers:3, impact:4, mixed:2, totalAUM:62 },
  { manager:'Aviva Investors', focus:5, improvers:4, impact:3, mixed:1, totalAUM:28 },
  { manager:'Schroders', focus:6, improvers:5, impact:2, mixed:2, totalAUM:41 },
  { manager:'M&G Investments', focus:4, improvers:2, impact:3, mixed:1, totalAUM:35 },
  { manager:'BlackRock (UK)', focus:9, improvers:1, impact:5, mixed:3, totalAUM:89 },
  { manager:'Baillie Gifford', focus:3, improvers:6, impact:1, mixed:2, totalAUM:22 },
];

const SDR_SFDR_CROSSWALK = [
  { sdr:'Sustainability Focus', sfdr:'Article 8 (enhanced) or Article 9', rationale:'If ≥70% of assets are sustainable investments (SFDR definition), likely Article 9. Robust characteristics test may qualify as Article 8+.', complexity:'Medium' },
  { sdr:'Sustainability Improvers', sfdr:'Article 8', rationale:'Engagement and stewardship approach with sustainability characteristics. Typically Article 8 as no specific sustainable investment commitment required.', complexity:'Low' },
  { sdr:'Sustainability Impact', sfdr:'Article 9', rationale:'Specific real-world sustainability outcome with additionality aligns directly to SFDR Article 9 "sustainable investment" objective.', complexity:'Low' },
  { sdr:'Sustainability Mixed Goals', sfdr:'Article 8 or Article 9 (partial)', rationale:'Depends on composition. Impact component may qualify portions as Article 9; full classification requires analysis of aggregate portfolio.', complexity:'High' },
  { sdr:'Unlabelled (ESG integration)', sfdr:'Article 8', rationale:'If ESG factors are considered in investment process, Article 8 is typical even without SDR label.', complexity:'Low' },
];

const LABEL_COLORS = { 'Sustainability Focus':'#1b3a5c', 'Sustainability Improvers':'#5a8a6a', 'Sustainability Impact':'#c5a96a', 'Sustainability Mixed Goals':'#7c3aed', 'Unlabelled':'#9aa3ae' };
const STATUS_COLORS = { pass:'#16a34a', fail:'#dc2626', warn:'#d97706', COMPLIANT:'#16a34a', 'NON-COMPLIANT':'#dc2626', CONDITIONAL:'#d97706', completed:'#16a34a', current:'#d97706', upcoming:'#1b3a5c', future:'#9aa3ae' };

/* ================================================================= TAB 1: SDR Labels Overview */
function Tab1() {
  const kpis = [
    { val:'£9.4T', label:'Total UK AUM', sub:'Investment Association 2024' },
    { val:'8', label:'Funds with SDR Label', sub:'In monitored portfolio' },
    { val:'76%', label:'Avg Criteria Compliance', sub:'Across labelled funds' },
    { val:'94%', label:'Anti-Greenwashing Compliance', sub:'FCA rule (May 2024)' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={S.grid(4)}>
        {kpis.map(k => (
          <div key={k.label} style={S.kpiCard}>
            <div style={S.kpiVal}>{k.val}</div>
            <div style={S.kpiLabel}>{k.label}</div>
            <div style={S.kpiSub}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, boxShadow:T.card }}>
        <div style={{ ...S.sectionTitle, marginBottom:4 }}>UK FCA SDR Framework</div>
        <div style={{ fontSize:12, color:T.textSec, marginBottom:16 }}>Sustainability Disclosure Requirements — 4 Label System effective July 2024 (PS23/16)</div>
        <div style={S.grid(2)}>
          {SDR_LABELS.map(label => (
            <div key={label.id} style={{ background:T.surfaceH, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <div style={{ width:12, height:12, borderRadius:'50%', background:label.color }} />
                <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{label.name}</div>
              </div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:10 }}>{label.description}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <div style={{ fontSize:11 }}><b style={{color:T.navy}}>Threshold:</b> <span style={{color:T.textSec}}>{label.threshold}</span></div>
                <div style={{ fontSize:11 }}><b style={{color:T.navy}}>Min Investment:</b> <span style={{color:T.textSec}}>{label.minInvestment}</span></div>
                <div style={{ fontSize:11 }}><b style={{color:T.navy}}>Consumer Statement:</b> <span style={{color:T.textMut,fontStyle:'italic'}}>{label.consumerStatement}</span></div>
              </div>
              <div style={{ marginTop:10 }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.textSec, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:4 }}>Key KPIs</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {label.kpis.map(k => <span key={k} style={{ background:label.color, color:'#fff', padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:600 }}>{k}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={S.grid(2)}>
        <div style={S.card()}>
          <div style={S.sectionTitle}>Fund Portfolio — SDR Status</div>
          <table style={S.table}>
            <thead>
              <tr>
                {['Fund','AUM (£bn)','Label','Compliance','Retail %','Objective'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {FUND_PORTFOLIO.map((f,i) => (
                <tr key={i} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                  <td style={S.td}><div style={{fontWeight:600,fontSize:12}}>{f.name}</div><div style={{fontSize:10,color:T.textMut}}>{f.manager}</div></td>
                  <td style={S.td}><b>{f.aum}</b></td>
                  <td style={S.td}><span style={{ ...S.pill(LABEL_COLORS[f.label]||'#9aa3ae','#fff') }}>{f.label}</span></td>
                  <td style={S.td}><span style={{fontWeight:700,color:f.compliance>=70?T.green:T.red}}>{f.compliance}%</span></td>
                  <td style={S.td}>{f.retail}%</td>
                  <td style={S.td} title={f.objective}><span style={{fontSize:11,color:T.textSec}}>{f.objective.length>50?f.objective.slice(0,50)+'…':f.objective}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={S.card()}>
          <div style={S.sectionTitle}>AUM by SDR Label Category</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={LABEL_AUM} margin={{top:4,right:16,left:0,bottom:4}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="label" tick={{fontSize:11, fill:T.textSec}} />
              <YAxis tickFormatter={v=>`£${v}bn`} tick={{fontSize:11, fill:T.textSec}} />
              <Tooltip formatter={(v)=>[`£${v}bn AUM`,'AUM']} contentStyle={{fontSize:12,borderRadius:8,border:`1px solid ${T.border}`}} />
              <Bar dataKey="aum" radius={[4,4,0,0]}>
                {LABEL_AUM.map((d,i) => <Cell key={i} fill={Object.values(LABEL_COLORS)[i] || T.navy} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:8 }}>
            {LABEL_AUM.map((d,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:6,fontSize:11}}>
                <div style={{width:10,height:10,borderRadius:2,background:Object.values(LABEL_COLORS)[i]||T.navy}} />
                <span style={{color:T.textSec}}>{d.label}: {d.funds} fund{d.funds>1?'s':''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================= TAB 2: Label Eligibility Assessment */
function Tab2() {
  const [expandedStep, setExpandedStep] = useState(null);

  const statusIcon = s => ({ pass:'✓', fail:'✗', warn:'⚠' }[s] || '?');
  const statusColor = s => ({ pass:T.green, fail:T.red, warn:T.amber }[s] || T.textMut);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={S.card()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div>
            <div style={S.sectionTitle}>Label Eligibility Assessment — Sustainability Focus</div>
            <div style={{ fontSize:12, color:T.textSec }}>Fund: UK Equity Sustainability Focus | AUM: £2.8bn | Manager: Aviva Investors</div>
          </div>
          <span style={{ background:LABEL_COLORS['Sustainability Focus'], color:'#fff', padding:'6px 16px', borderRadius:20, fontSize:12, fontWeight:700 }}>Sustainability Focus</span>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {ELIGIBILITY_STEPS.map(s => (
            <div key={s.step} style={{ flex:1, height:6, borderRadius:4, background: statusColor(s.status) }} title={s.title} />
          ))}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {ELIGIBILITY_STEPS.map(step => (
            <div key={step.step} onClick={() => setExpandedStep(expandedStep===step.step?null:step.step)} style={{ border:`1px solid ${step.status==='warn'?T.amber:T.border}`, borderRadius:8, overflow:'hidden', cursor:'pointer' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background: expandedStep===step.step ? T.surfaceH : T.surface }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:statusColor(step.status), color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, flexShrink:0 }}>{statusIcon(step.status)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>Step {step.step}: {step.title}</div>
                  <div style={{ fontSize:11, color:T.textSec }}>{step.question}</div>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:statusColor(step.status), textTransform:'uppercase' }}>{step.status==='pass'?'PASS':step.status==='fail'?'FAIL':'REVIEW'}</div>
                <div style={{ fontSize:12, color:T.textMut, marginLeft:8 }}>{expandedStep===step.step?'▲':'▼'}</div>
              </div>
              {expandedStep===step.step && (
                <div style={{ padding:'12px 16px', background:T.surfaceH, borderTop:`1px solid ${T.border}` }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:T.textSec, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:4 }}>Evidence on File</div>
                      <div style={{ fontSize:12, color:T.text, lineHeight:1.6 }}>{step.evidence}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:T.textSec, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:4 }}>FCA Requirement</div>
                      <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>{step.required}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={S.card()}>
        <div style={S.sectionTitle}>Boundary Cases — Eligibility Ambiguity Scenarios</div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {BOUNDARY_CASES.map((bc, i) => (
            <div key={i} style={{ background:T.surfaceH, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.amber, marginBottom:6 }}>⚠ {bc.scenario}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <div><div style={{ fontSize:10, fontWeight:700, color:T.textSec, textTransform:'uppercase', marginBottom:3 }}>Issue</div><div style={{ fontSize:11, color:T.text }}>{bc.issue}</div></div>
                <div><div style={{ fontSize:10, fontWeight:700, color:T.textSec, textTransform:'uppercase', marginBottom:3 }}>FCA Guidance (PS23/16)</div><div style={{ fontSize:11, color:T.text }}>{bc.fcaGuidance}</div></div>
                <div><div style={{ fontSize:10, fontWeight:700, color:T.textSec, textTransform:'uppercase', marginBottom:3 }}>Outcome</div><div style={{ fontSize:11, fontWeight:600, color:T.amber }}>{bc.outcome}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================= TAB 3: Anti-Greenwashing Rule */
function Tab3() {
  const [claimInput, setClaimInput] = useState('');
  const [checkResult, setCheckResult] = useState(null);

  const checkClaim = () => {
    const lower = claimInput.toLowerCase();
    let result;
    if (lower.includes('green fund') || lower.includes('carbon neutral') || lower.includes('impact invest') || lower.includes('biodiversity positive')) {
      result = { status:'NON-COMPLIANT', message:'This claim contains unsubstantiated sustainability assertions. Without supporting evidence, methodology disclosure, and/or the relevant SDR label, this claim is likely to breach the FCA Anti-Greenwashing Rule (May 2024).' };
    } else if (lower.includes('esg screen') || lower.includes('fossil fuel free') || lower.includes('best-in-class')) {
      result = { status:'COMPLIANT', message:'This claim appears substantiatable if supported by a published, consistent methodology. Ensure screening criteria are disclosed in the fund prospectus and kept current. No further action required if evidence is in place.' };
    } else if (lower.includes('net zero') || lower.includes('paris') || lower.includes('sustainable') || lower.includes('responsible') || lower.includes('low carbon')) {
      result = { status:'CONDITIONAL', message:'This claim requires supporting evidence to be compliant. You must disclose the specific methodology, data sources, interim milestones, and assumptions underlying this claim. Review against FCA\'s 5 greenwashing characteristics before publication.' };
    } else {
      result = { status:'CONDITIONAL', message:'This claim requires review against the FCA Anti-Greenwashing Rule. Ensure the claim is clear, fair, not misleading, and consistent with the sustainability profile of the product. Recommend legal review before publication.' };
    }
    setCheckResult(result);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={S.grid(2)}>
        <div style={S.card()}>
          <div style={S.sectionTitle}>Claims Checker Tool</div>
          <div style={{ fontSize:12, color:T.textSec, marginBottom:12 }}>FCA Anti-Greenwashing Rule: effective May 2024, applies to ALL FCA-authorised firms</div>
          <textarea value={claimInput} onChange={e=>setClaimInput(e.target.value)} placeholder='Enter a marketing claim to assess, e.g. "Our fund is net zero aligned and carbon neutral"' style={{ width:'100%', height:80, padding:10, borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font, resize:'vertical', color:T.text, boxSizing:'border-box' }} />
          <button onClick={checkClaim} style={{ marginTop:10, background:T.navy, color:'#fff', border:'none', borderRadius:6, padding:'8px 20px', fontSize:13, fontWeight:700, cursor:'pointer' }}>Assess Claim</button>
          {checkResult && (
            <div style={{ marginTop:16, padding:14, borderRadius:8, background: checkResult.status==='COMPLIANT'?'#f0fdf4':checkResult.status==='NON-COMPLIANT'?'#fef2f2':'#fffbeb', border:`1px solid ${STATUS_COLORS[checkResult.status]}30` }}>
              <div style={{ fontWeight:700, color:STATUS_COLORS[checkResult.status], marginBottom:6, fontSize:13 }}>{checkResult.status}</div>
              <div style={{ fontSize:12, color:T.text, lineHeight:1.6 }}>{checkResult.message}</div>
            </div>
          )}
        </div>

        <div style={S.card()}>
          <div style={S.sectionTitle}>5 FCA Greenwashing Characteristics</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {FCA_GREENWASHING_CHARS.map((c,i) => (
              <div key={i} style={{ display:'flex', gap:10, padding:10, background:T.surfaceH, borderRadius:6 }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:T.navy, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:T.navy }}>{c.char}</div>
                  <div style={{ fontSize:11, color:T.textSec, marginTop:2, lineHeight:1.5 }}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={S.card()}>
        <div style={S.sectionTitle}>12 Marketing Claims — Compliance Assessment</div>
        <table style={S.table}>
          <thead>
            <tr>
              {['Claim','Status','Rationale','Required Action'].map(h=><th key={h} style={S.th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {MARKETING_CLAIMS.map((c,i) => (
              <tr key={i} style={{ background: i%2===0?T.surface:T.surfaceH }}>
                <td style={{ ...S.td, fontWeight:600, fontSize:12 }}>{c.claim}</td>
                <td style={S.td}><span style={{ ...S.pill(STATUS_COLORS[c.status]+'22',STATUS_COLORS[c.status]), whiteSpace:'nowrap' }}>{c.status}</span></td>
                <td style={{ ...S.td, fontSize:11, color:T.textSec }}>{c.rationale}</td>
                <td style={{ ...S.td, fontSize:11, color:T.text }}>{c.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={S.card()}>
        <div style={S.sectionTitle}>FCA Enforcement Actions — Greenwashing Cases</div>
        <div style={S.grid(3)}>
          {FCA_ENFORCEMENT.map((e,i) => (
            <div key={i} style={{ background:T.surfaceH, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:4 }}>{e.firm}</div>
              <div style={{ fontSize:11, color:T.amber, fontWeight:600, marginBottom:6 }}>Claim: {e.claim}</div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:8, lineHeight:1.5 }}><b>Finding:</b> {e.finding}</div>
              <div style={{ fontSize:11, color:T.red, lineHeight:1.5 }}><b>Outcome:</b> {e.outcome}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================= TAB 4: UK Green Taxonomy Framework */
function Tab4() {
  const readinessData = [
    { subject:'CCM Alignment', score:72 }, { subject:'CCA Alignment', score:58 }, { subject:'Water Resources', score:45 },
    { subject:'Circular Economy', score:38 }, { subject:'Pollution Prev.', score:62 }, { subject:'Biodiversity', score:31 },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, boxShadow:T.card }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={S.sectionTitle}>UK Green Taxonomy Framework (UK GTF)</div>
            <div style={{ fontSize:12, color:T.textSec }}>Status: <b style={{color:T.amber}}>Consultation Stage</b> — Expected final rules 2025–2026 (HM Treasury)</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <span style={{ ...S.pill('#dbeafe','#1d4ed8') }}>6 Objectives</span>
            <span style={{ ...S.pill('#fef3c7',T.amber) }}>Pre-Final Rules</span>
            <span style={{ ...S.pill('#f0fdf4',T.green) }}>EU Taxonomy aligned</span>
          </div>
        </div>
      </div>

      <div style={S.grid(2)}>
        <div style={S.card()}>
          <div style={S.sectionTitle}>6 Taxonomy Objectives — UK vs EU Differences</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {UK_GTF_OBJECTIVES.map((obj,i) => (
              <div key={i} style={{ background:T.surfaceH, border:`1px solid ${T.border}`, borderRadius:8, padding:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.navy }}>{obj.obj}</div>
                  <span style={{ ...S.pill(obj.euAlign==='Full alignment'?'#f0fdf4':'#fef9ec', obj.euAlign==='Full alignment'?T.green:T.amber) }}>{obj.euAlign}</span>
                </div>
                <div style={{ fontSize:11, color:T.textSec, marginBottom:6 }}><b>UK Differences:</b> {obj.ukDiff}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {obj.activities.map(a => <span key={a} style={{ background:T.navyL+'22', color:T.navy, padding:'2px 8px', borderRadius:10, fontSize:10 }}>{a}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={S.card()}>
          <div style={S.sectionTitle}>UK Taxonomy Readiness — Sample Portfolio</div>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={readinessData} margin={{top:10,right:20,bottom:10,left:20}}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="subject" tick={{fontSize:10, fill:T.textSec}} />
              <PolarRadiusAxis domain={[0,100]} tick={{fontSize:9, fill:T.textMut}} />
              <Radar name="UK GTF Readiness" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.2} strokeWidth={2} />
              <Tooltip formatter={v=>[`${v}%`,'Readiness']} contentStyle={{fontSize:12,borderRadius:8}} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ fontSize:11, color:T.textSec, textAlign:'center', marginTop:4 }}>% activities taxonomy-aligned | Overall: 51% (£34.2bn of £67bn portfolio)</div>
          <div style={{ marginTop:12, padding:12, background:'#fef9ec', border:`1px solid ${T.amber}30`, borderRadius:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.amber, marginBottom:4 }}>UK GTF → SDR Link</div>
            <div style={{ fontSize:11, color:T.textSec, lineHeight:1.5 }}>When UK GTF is finalised, taxonomy-aligned % will become a mandatory KPI within SDR reporting, replacing current voluntary ESG metrics for alignment assessment.</div>
          </div>
        </div>
      </div>

      <div style={S.card()}>
        <div style={S.sectionTitle}>Activity Comparison — EU Taxonomy vs UK GTF (15 Activities)</div>
        <table style={S.table}>
          <thead>
            <tr>{['Activity','EU Taxonomy','UK GTF','Key Divergence'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {ACTIVITY_COMPARISON.map((a,i) => (
              <tr key={i} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                <td style={{ ...S.td, fontWeight:600, fontSize:12 }}>{a.activity}</td>
                <td style={S.td}><span style={{ ...S.pill(a.euTax==='Aligned'?'#f0fdf4':'#fef9ec',a.euTax==='Aligned'?T.green:T.amber) }}>{a.euTax}</span></td>
                <td style={S.td}><span style={{ ...S.pill(a.ukGtf==='Aligned'?'#f0fdf4':a.ukGtf==='Not aligned'?'#fef2f2':'#fef9ec', a.ukGtf==='Aligned'?T.green:a.ukGtf==='Not aligned'?T.red:T.amber) }}>{a.ukGtf}</span></td>
                <td style={{ ...S.td, fontSize:11, color:T.textSec }}>{a.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================= TAB 5: Consumer-Facing Disclosure Builder */
function Tab5() {
  const feedbackThemes = [
    { theme:'Objective specificity', issue:'FCA found objectives like "invest sustainably in global equities" too vague. Requires measurable targets (e.g. "≥70% MSCI ESG score ≥65").', severity:'High' },
    { theme:'Methodology description', issue:'Early disclosures used generic descriptions. FCA expects the specific data source, screening methodology and exclusion criteria to be named.', severity:'High' },
    { theme:'Monitoring frequency', issue:'Statements like "regularly monitored" rejected. FCA expects explicit frequency (e.g. "quarterly with board sign-off").', severity:'Medium' },
    { theme:'Consumer language', issue:'Technical jargon (e.g. "orthogonal ESG factor loading") flagged. Must be understandable to retail investors.', severity:'Medium' },
    { theme:'Label badge placement', issue:'Some managers placed label on page 2. FCA requires standardised label badge on page 1, top section, using FCA-specified design.', severity:'Medium' },
    { theme:'OCF accuracy', issue:'Ongoing charges figure must match KIID/PRIIPs KID exactly. Discrepancies found in early submissions.', severity:'Low' },
  ];

  const objQuality = [
    { criterion:'Specific (not generic)', score:72, good:'"≥70% of NAV in MSCI ESG score ≥70th percentile"', bad:'"Invest sustainably in global markets"' },
    { criterion:'Measurable KPIs included', score:68, good:'"Carbon intensity <85 tCO2e/£m revenue; quarterly monitoring"', bad:'"Low carbon portfolio"' },
    { criterion:'Ambitious (beyond baseline ESG)', score:55, good:'"Top-decile ESG score within each sector"', bad:'"ESG screened"' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={S.grid(2)}>
        <div style={S.card()}>
          <div style={S.sectionTitle}>Consumer-Facing Disclosure — 2-Page Preview</div>
          <div style={{ border:`2px solid ${T.navy}`, borderRadius:10, overflow:'hidden', fontSize:12 }}>
            <div style={{ background:T.navy, color:'#fff', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:700, fontSize:13 }}>UK Equity Sustainability Focus Fund</span>
              <span style={{ background:T.gold, color:T.navy, padding:'4px 12px', borderRadius:12, fontWeight:700, fontSize:11 }}>SUSTAINABILITY FOCUS</span>
            </div>
            <div style={{ padding:16, background:'#fafaf8' }}>
              <div style={{ fontSize:10, fontWeight:700, color:T.textSec, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>FCA Standardised Wording (cannot be modified)</div>
              <div style={{ fontSize:11, color:T.text, background:'#f0ede7', padding:10, borderRadius:6, marginBottom:12, lineHeight:1.6, borderLeft:`3px solid ${T.gold}` }}>
                "The label means this fund invests primarily in assets it considers to have positive sustainability characteristics. This is assessed using an evidenced, measurable and ongoing methodology."
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.navy, marginBottom:3 }}>The Fund's Sustainability Objective</div>
                <div style={{ fontSize:11, color:T.textSec, lineHeight:1.6 }}>To invest at least 70% of NAV in UK-listed companies ranked in the top 30% of their GICS sector by MSCI ESG Score (minimum score of 65/100), with a portfolio carbon intensity below 85 tCO2e per £m of revenue, monitored quarterly by the Sustainability Committee.</div>
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.navy, marginBottom:3 }}>How the Fund Meets the Label Criteria</div>
                <div style={{ fontSize:11, color:T.textSec, lineHeight:1.5 }}>
                  <div>• 74.2% of NAV currently meets the robust characteristics test (threshold: 70%)</div>
                  <div>• MSCI ESG data, updated monthly; sector-relative scoring</div>
                  <div>• Exclusions: UNGC violators, coal >5% revenue, controversial weapons</div>
                  <div>• Remaining 30%: liquidity holdings and transition cos — no significant harm assessment completed</div>
                </div>
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.navy, marginBottom:3 }}>Monitoring & Ongoing Oversight</div>
                <div style={{ fontSize:11, color:T.textSec, lineHeight:1.5 }}>Quarterly 70% threshold attestation by Head of Sustainability. Annual report published on fund website by 31 January each year. FCA notified of any material changes within 30 days.</div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:T.textSec, paddingTop:10, borderTop:`1px solid ${T.border}` }}>
                <span>Ongoing Charges Figure: <b style={{color:T.navy}}>0.82% p.a.</b></span>
                <span>Page 1 of 2 — Aviva Investors | March 2025</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={S.card()}>
            <div style={S.sectionTitle}>Sustainability Objective Quality Checker</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {objQuality.map((q,i) => (
                <div key={i} style={{ background:T.surfaceH, borderRadius:8, padding:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:T.navy }}>{q.criterion}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:q.score>=70?T.green:T.amber }}>{q.score}%</span>
                  </div>
                  <div style={{ height:6, background:T.border, borderRadius:4, overflow:'hidden', marginBottom:8 }}>
                    <div style={{ height:'100%', width:`${q.score}%`, background:q.score>=70?T.green:T.amber, borderRadius:4 }} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <div style={{ background:'#f0fdf4', borderRadius:6, padding:8, fontSize:10, color:T.green }}><b>Good:</b> {q.good}</div>
                    <div style={{ background:'#fef2f2', borderRadius:6, padding:8, fontSize:10, color:T.red }}><b>Poor:</b> {q.bad}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={S.card()}>
            <div style={S.sectionTitle}>FCA Supervisory Feedback — Early SDR Disclosures</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {feedbackThemes.map((f,i) => (
                <div key={i} style={{ display:'flex', gap:10, padding:10, background:T.surfaceH, borderRadius:6, alignItems:'flex-start' }}>
                  <span style={{ ...S.pill(f.severity==='High'?'#fef2f2':f.severity==='Medium'?'#fef9ec':'#f0f9ff', f.severity==='High'?T.red:f.severity==='Medium'?T.amber:'#1d4ed8'), flexShrink:0, marginTop:1 }}>{f.severity}</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:2 }}>{f.theme}</div>
                    <div style={{ fontSize:11, color:T.textSec, lineHeight:1.5 }}>{f.issue}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================= TAB 6: SDR Reporting & Monitoring */
function Tab6() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={S.card()}>
        <div style={S.sectionTitle}>Monthly 70% Threshold Monitoring — All Labelled Funds</div>
        <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>70% minimum threshold shown as dashed red line. All funds shown over 12-month period (Jan–Dec 2024).</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={MONITORING_DATA} margin={{top:4,right:16,left:0,bottom:4}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{fontSize:10,fill:T.textSec}} />
            <YAxis domain={[65,100]} tickFormatter={v=>`${v}%`} tick={{fontSize:10,fill:T.textSec}} />
            <Tooltip formatter={(v,n)=>[`${v}%`,n]} contentStyle={{fontSize:11,borderRadius:8,border:`1px solid ${T.border}`}} />
            <Legend wrapperStyle={{fontSize:11}} />
            <Line type="monotone" dataKey="focus_a" name="Focus A" stroke="#1b3a5c" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="focus_b" name="Focus B" stroke="#2c5a8c" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="focus_c" name="Focus C" stroke="#5c8abf" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="improvers" name="Improvers" stroke="#5a8a6a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="impact_a" name="Impact A" stroke="#c5a96a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="impact_b" name="Impact B" stroke="#d4be8a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="mixed" name="Mixed Goals" stroke="#7c3aed" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey={() => 70} name="Min Threshold (70%)" stroke={T.red} strokeWidth={1.5} strokeDasharray="6 3" dot={false} legendType="line" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={S.grid(2)}>
        <div style={S.card()}>
          <div style={S.sectionTitle}>Engagement Reporting — Sustainability Improvers Fund</div>
          <div style={{ fontSize:11, color:T.textSec, marginBottom:12 }}>8 engagement outcomes — annual report period 2024. Before/after ESG scores.</div>
          <table style={S.table}>
            <thead>
              <tr>{['Company','Sector','Before','After','Change','Activity'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {ENGAGEMENT_OUTCOMES.map((e,i) => (
                <tr key={i} style={{ background:i%2===0?T.surface:T.surfaceH }}>
                  <td style={{ ...S.td, fontWeight:600, fontSize:11 }}>{e.company}</td>
                  <td style={{ ...S.td, fontSize:11, color:T.textMut }}>{e.sector}</td>
                  <td style={{ ...S.td, fontSize:11 }}>{e.baselineESG}</td>
                  <td style={{ ...S.td, fontSize:11 }}>{e.currentESG}</td>
                  <td style={S.td}><span style={{ fontWeight:700, color:T.green, fontSize:12 }}>{e.improvement}</span></td>
                  <td style={{ ...S.td, fontSize:10, color:T.textSec }} title={e.activity}>{e.activity.slice(0,55)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={S.card()}>
            <div style={S.sectionTitle}>Regulatory Calendar 2024–2026</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {REGULATORY_CALENDAR.map((r,i) => (
                <div key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'8px 0', borderBottom:`1px solid ${T.border}` }}>
                  <div style={{ minWidth:76, fontSize:11, fontWeight:700, color:T.navyL }}>{r.date}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:T.navy }}>{r.event}</span>
                      <span style={{ ...S.pill(STATUS_COLORS[r.status]+'22',STATUS_COLORS[r.status]) }}>{r.status}</span>
                    </div>
                    <div style={{ fontSize:11, color:T.textSec }}>{r.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={S.grid(2)}>
        <div style={S.card()}>
          <div style={S.sectionTitle}>Peer Comparison — SDR Labels by Asset Manager</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={PEER_COMPARISON} margin={{top:4,right:16,left:0,bottom:40}} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}} />
              <YAxis dataKey="manager" type="category" width={100} tick={{fontSize:10,fill:T.textSec}} />
              <Tooltip contentStyle={{fontSize:11,borderRadius:8}} />
              <Legend wrapperStyle={{fontSize:10}} />
              <Bar dataKey="focus" name="Focus" stackId="a" fill={LABEL_COLORS['Sustainability Focus']} />
              <Bar dataKey="improvers" name="Improvers" stackId="a" fill={LABEL_COLORS['Sustainability Improvers']} />
              <Bar dataKey="impact" name="Impact" stackId="a" fill={LABEL_COLORS['Sustainability Impact']} />
              <Bar dataKey="mixed" name="Mixed" stackId="a" fill={LABEL_COLORS['Sustainability Mixed Goals']} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={S.card()}>
          <div style={S.sectionTitle}>SDR vs SFDR Crosswalk</div>
          <div style={{ fontSize:11, color:T.textSec, marginBottom:10 }}>For dual-regulated UK/EU firms — label equivalence mapping.</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {SDR_SFDR_CROSSWALK.map((c,i) => (
              <div key={i} style={{ background:T.surfaceH, borderRadius:8, padding:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.navy }}>{c.sdr}</div>
                  <span style={{ ...S.pill(c.complexity==='Low'?'#f0fdf4':c.complexity==='Medium'?'#fef9ec':'#fef2f2', c.complexity==='Low'?T.green:c.complexity==='Medium'?T.amber:T.red) }}>{c.complexity} complexity</span>
                </div>
                <div style={{ fontSize:11, color:T.navyL, fontWeight:600, marginBottom:4 }}>→ SFDR: {c.sfdr}</div>
                <div style={{ fontSize:11, color:T.textSec, lineHeight:1.5 }}>{c.rationale}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================= MAIN PAGE */
const TABS = [
  { id:'labels', label:'SDR Labels Overview', component:Tab1 },
  { id:'eligibility', label:'Label Eligibility', component:Tab2 },
  { id:'greenwashing', label:'Anti-Greenwashing Rule', component:Tab3 },
  { id:'taxonomy', label:'UK Green Taxonomy', component:Tab4 },
  { id:'disclosure', label:'Consumer Disclosure Builder', component:Tab5 },
  { id:'reporting', label:'SDR Reporting & Monitoring', component:Tab6 },
];

const BADGES = ['FCA SDR 2024','4 Labels','Anti-Greenwashing','UK GTF','£9.4T UK AUM'];

export default function UkSdrPage() {
  const [activeTab, setActiveTab] = useState('labels');

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || Tab1;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.6)', marginBottom:6 }}>EP-AH4</div>
            <div style={{ fontSize:22, fontWeight:700, color:'#fff', letterSpacing:'-0.3px' }}>UK SDR & Taxonomy</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', marginTop:4 }}>Sustainability Disclosure Requirements · FCA SDR Framework · UK Green Taxonomy</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:0, marginTop:12 }}>
              {BADGES.map(b => <span key={b} style={S.badge}>{b}</span>)}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
            <div style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, padding:'10px 16px', textAlign:'right' }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Regulatory Basis</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginTop:2 }}>PS23/16 · FCA Anti-Greenwashing</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:1 }}>Effective: May 2024 / July 2024</div>
            </div>
            <div style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, padding:'10px 16px', textAlign:'right' }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.06em' }}>UK GTF Status</div>
              <div style={{ fontSize:13, fontWeight:700, color:T.gold, marginTop:2 }}>Consultation Stage</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginTop:1 }}>Final rules expected 2025–2026</div>
            </div>
          </div>
        </div>
      </div>

      <div style={S.tabBar}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={S.tab(activeTab === tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={S.body}>
        <ActiveComponent />
      </div>
    </div>
  );
}
