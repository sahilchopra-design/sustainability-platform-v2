import React, { useState, useCallback } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',blue:'#2563eb',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const BADGE = (label, color = T.navy) => (
  <span style={{
    fontSize: 10, fontWeight: 700, color, background: `${color}18`,
    border: `1px solid ${color}44`, borderRadius: 4, padding: '2px 7px', marginRight: 4,
  }}>{label}</span>
);

const FRAMEWORKS = ['TCFD', 'SFDR PAI', 'UNPRI', 'CSRD', 'Custom'];
const PORTFOLIOS = ['Demo Portfolio', 'Climate Leaders', 'Emerging Markets', 'Global Mixed'];

const HOLDINGS = [
  { name: 'Reliance Industries', weight: 18.4, sector: 'Energy', scope1: 12.4, trisk: 'High', dqs: 82, sbti: false },
  { name: 'NTPC Ltd', weight: 14.2, sector: 'Utilities', scope1: 18.7, trisk: 'High', dqs: 76, sbti: false },
  { name: 'TCS', weight: 16.8, sector: 'IT Services', scope1: 0.3, trisk: 'Low', dqs: 91, sbti: true },
  { name: 'HDFC Bank', weight: 15.1, sector: 'Financials', scope1: 0.1, trisk: 'Low', dqs: 88, sbti: true },
  { name: 'Coal India', weight: 8.3, sector: 'Mining', scope1: 13.7, trisk: 'High', dqs: 69, sbti: false },
];

const SECTOR_PIE = [
  { name: 'Energy', value: 26.7 },
  { name: 'Utilities', value: 14.2 },
  { name: 'IT Services', value: 16.8 },
  { name: 'Financials', value: 15.1 },
  { name: 'Mining', value: 27.2 },
];
const PIE_COLORS = [T.amber, T.teal, T.blue, T.sage, T.red];

const TRISK_BAR = [
  { risk: 'High', count: 3 }, { risk: 'Medium', count: 1 }, { risk: 'Low', count: 2 },
];

const COMPLIANCE = [
  { framework: 'TCFD', status: 'Aligned', icon: '✓', color: T.green },
  { framework: 'SFDR PAI', status: 'PAI Reported', icon: '✓', color: T.green },
  { framework: 'SEBI BRSR', status: 'Top 500 Covered', icon: '✓', color: T.green },
  { framework: 'EU Taxonomy', status: 'Partial', icon: '⚠', color: T.amber },
];

const EXEC_SUMMARY = {
  TCFD: `This portfolio has been assessed against the Task Force on Climate-related Financial Disclosures (TCFD) framework across Governance, Strategy, Risk Management, and Metrics & Targets pillars. The portfolio demonstrates partial alignment with TCFD recommendations, with governance structures in place and scenario analysis conducted under NGFS Phase 3 pathways. Material climate-related risks have been identified in the Energy and Utilities sectors, representing 40.9% of portfolio weight.\n\nTransition risks dominate near-term exposure, particularly through carbon pricing sensitivity in coal and fossil fuel holdings. Physical risk assessment using chronic and acute hazard layers indicates moderate flood and heat stress exposure for assets in South and Central India. The portfolio weighted average carbon intensity (WACI) of 285 tCO₂e/$M revenue exceeds the global benchmark of 180, indicating room for decarbonisation.\n\nForward-looking temperature alignment analysis suggests an implied portfolio temperature of 2.8°C, above the 1.5°C Paris Agreement pathway. Management of transition risk through engagement and strategic reallocation is recommended as a priority action.`,
  'SFDR PAI': `Under the Sustainable Finance Disclosure Regulation (SFDR) Level 2 Regulatory Technical Standards, this report presents Principal Adverse Impact (PAI) indicators for the reference period FY2024. The portfolio reports on all mandatory PAI indicators including GHG emissions intensity, carbon footprint, exposure to fossil fuels, and share of non-renewable energy consumption.\n\nThe portfolio carbon footprint stands at 285 tCO₂e/$M invested, with fossil fuel exposure at 35.1% of portfolio weight — above the SFDR Article 9 threshold requiring active reduction plans. Biodiversity-sensitive area exposure has been assessed using IBAT data. Social PAIs including gender pay gap and UN Global Compact violations are included in the annex.\n\nThe portfolio does not qualify as Article 9 under current composition due to fossil fuel exposure. Reclassification to Article 8 with ESG characteristics binding is recommended pending reduction of high-impact holdings. A credible PAI reduction target of 7% annual decline in carbon intensity is proposed.`,
  UNPRI: `This report aligns with the United Nations Principles for Responsible Investment (UNPRI) reporting framework, covering signatory obligations across Listed Equity and Fixed Income asset classes. The portfolio demonstrates active ownership practices including 47 company engagements conducted in FY2024 and voting on 100% of resolutions at AGMs of portfolio companies.\n\nESG integration is embedded across the investment process through quantitative ESG scoring (DQS range 69-91 in this portfolio), negative screening of severe ESG violators, and thematic allocation to climate solutions. The portfolio's exposure to SDG-aligned revenue streams is estimated at 22% by weight, primarily through IT services and financial inclusion activities.\n\nStewardship outcomes include two successful engagements resulting in emission reduction target commitments from NTPC and Reliance. Proxy voting records and engagement logs are available in the supplementary annex. The fund is on track to meet UNPRI transparency requirements for the 2025 reporting cycle.`,
  CSRD: `This report is prepared in accordance with the Corporate Sustainability Reporting Directive (CSRD) and European Sustainability Reporting Standards (ESRS), applying double materiality assessment principles. Climate change (ESRS E1) has been assessed as material from both impact and financial materiality perspectives given the portfolio's sectoral concentration.\n\nThe double materiality assessment identified 12 material sustainability topics across environment, social, and governance dimensions. Climate transition plans have been evaluated for each portfolio company using the IEA Net Zero by 2050 scenario as the reference pathway. Scope 1, 2, and 3 emissions are reported with methodology disclosures per ESRS E1-6.\n\nValue chain due diligence has been conducted under CSDDD preliminary guidance. The portfolio's alignment with EU Taxonomy environmental objectives is 34% by turnover, 28% by capex. Biodiversity and ecosystem services impacts are being assessed for the first time per ESRS E4 requirements, with full disclosure expected in the next reporting cycle.`,
  Custom: `This custom ESG climate report presents a consolidated view of portfolio sustainability performance across key environmental, social, and governance dimensions. The analysis integrates multiple regulatory frameworks to provide a comprehensive risk and opportunity assessment tailored to the client's investment mandate and stakeholder requirements.\n\nThe portfolio has been stress-tested against three climate scenarios (Net Zero 2050, Below 2°C, and Current Policies) to assess value at risk under different transition pathways. Results indicate a 12-18% potential value at risk under disorderly transition scenarios, concentrated in the fossil fuel and heavy industrial holdings.\n\nRecommendations include targeted engagement with the top 3 high-emitting holdings, gradual portfolio rebalancing towards climate solution sectors, and adoption of a Science-Based Target for the portfolio by 2026. The Climate Alignment Score of 58/100 reflects progress but signals significant decarbonisation work ahead.`,
};

const ALIGN_SCORE = { TCFD: { score: 62, label: 'Moderate', color: T.amber }, 'SFDR PAI': { score: 54, label: 'Below Target', color: T.red }, UNPRI: { score: 71, label: 'Good', color: T.green }, CSRD: { score: 58, label: 'Developing', color: T.amber }, Custom: { score: 65, label: 'Moderate', color: T.amber } };

const ALL_SECTIONS = [
  { key: 'exec', label: 'Executive Summary', default: true },
  { key: 'portfolio', label: 'Portfolio Overview', default: true },
  { key: 'climate', label: 'Climate Risk Analysis', default: true },
  { key: 'ghg', label: 'GHG Emissions (Scope 1/2/3)', default: true },
  { key: 'temp', label: 'Temperature Alignment', default: true },
  { key: 'transition', label: 'Transition Risk', default: true },
  { key: 'physical', label: 'Physical Risk', default: true },
  { key: 'regulatory', label: 'Regulatory Compliance', default: true },
  { key: 'engagement', label: 'Engagement & Stewardship', default: false },
  { key: 'outlook', label: 'Outlook & Recommendations', default: false },
];

const triskColor = (r) => r === 'High' ? T.red : r === 'Medium' ? T.amber : T.green;

export default function ClientReportPage() {
  const [clientName, setClientName] = useState('Acme Capital Management');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [framework, setFramework] = useState('TCFD');
  const [portfolio, setPortfolio] = useState('Demo Portfolio');
  const [generated, setGenerated] = useState(true);
  const [sections, setSections] = useState(() => Object.fromEntries(ALL_SECTIONS.map(s => [s.key, s.default])));
  const [copied, setCopied] = useState(false);
  const [generatedAt] = useState(new Date().toLocaleTimeString());

  const selectedCount = Object.values(sections).filter(Boolean).length;
  const align = ALIGN_SCORE[framework];

  const toggleSection = (key) => setSections(p => ({ ...p, [key]: !p[key] }));

  const handleGenerate = useCallback(() => setGenerated(true), []);

  const handleCopy = () => {
    navigator.clipboard.writeText(`ESG Climate Report — ${clientName} | Framework: ${framework} | Portfolio: ${portfolio} | Date: ${reportDate}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJSON = () => {
    const data = { clientName, reportDate, framework, portfolio, sections, holdings: HOLDINGS, ghg: { scope1: 45.2, scope2: 3.1, scope3: 180, waci: 285, impliedTemp: 2.8 }, compliance: COMPLIANCE, generatedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `esg-report-${reportDate}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, color: T.text }}>
      {/* PAGE HEADER */}
      <div style={{ background: T.navy, padding: '18px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>EP-F4</span>
            <span style={{ color: T.gold, fontWeight: 700, fontSize: 18 }}>Client ESG Report Studio</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {['TCFD', 'SFDR PAI', 'UNPRI', 'CSRD'].map(b => BADGE(b, T.gold))}
          </div>
        </div>
      </div>

      {/* CONFIG BAR */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '14px 32px', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.sub }}>CLIENT NAME</label>
          <input value={clientName} onChange={e => setClientName(e.target.value)}
            style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 13, fontFamily: T.font, width: 200, color: T.text }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.sub }}>REPORT DATE</label>
          <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)}
            style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 13, fontFamily: T.font, color: T.text }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.sub }}>FRAMEWORK</label>
          <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden' }}>
            {FRAMEWORKS.map(f => (
              <button key={f} onClick={() => setFramework(f)} style={{
                padding: '6px 12px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: T.font,
                background: framework === f ? T.navy : T.card, color: framework === f ? '#fff' : T.sub,
                borderRight: `1px solid ${T.border}`,
              }}>{f}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: T.sub }}>PORTFOLIO</label>
          <select value={portfolio} onChange={e => setPortfolio(e.target.value)}
            style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 13, fontFamily: T.font, color: T.text, background: T.card }}>
            {PORTFOLIOS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={handleGenerate} style={{
            background: T.navy, color: '#fff', border: 'none', borderRadius: 7, padding: '8px 22px',
            fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: T.font,
          }}>Generate Report</button>
        </div>
      </div>

      {/* MAIN 3-COLUMN LAYOUT */}
      <div style={{ display: 'flex', height: 'calc(100vh - 148px)', overflow: 'hidden' }}>

        {/* LEFT SIDEBAR */}
        <div style={{ width: 260, background: T.card, borderRight: `1px solid ${T.border}`, padding: 20, overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 4 }}>Report Sections</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>{selectedCount} of {ALL_SECTIONS.length} sections selected</div>
          {ALL_SECTIONS.map(s => (
            <label key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 2, background: sections[s.key] ? `${T.navy}0a` : 'transparent' }}>
              <input type="checkbox" checked={sections[s.key]} onChange={() => toggleSection(s.key)}
                style={{ accentColor: T.navy, width: 14, height: 14 }} />
              <span style={{ fontSize: 12, fontWeight: sections[s.key] ? 600 : 400, color: sections[s.key] ? T.navy : T.sub }}>{s.label}</span>
            </label>
          ))}
        </div>

        {/* CENTER: REPORT PREVIEW */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: T.bg }}>
          {generated ? (
            <div style={{ maxWidth: 700, margin: '0 auto', background: T.card, borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', padding: 40 }}>

              {/* REPORT HEADER */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28, paddingBottom: 20, borderBottom: `2px solid ${T.navy}` }}>
                <div style={{ width: 60, height: 60, background: `${T.navy}15`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.navy, textAlign: 'center' }}>{clientName.split(' ').map(w => w[0]).join('').slice(0, 3)}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: T.navy, marginBottom: 4 }}>ESG Climate Report — Q1 2024</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {BADGE(framework, T.navy)}
                    <span style={{ fontSize: 11, color: T.sub }}>{portfolio}</span>
                    <span style={{ fontSize: 11, color: T.sub }}>·</span>
                    <span style={{ fontSize: 11, color: T.sub }}>{reportDate}</span>
                  </div>
                </div>
              </div>

              {/* EXECUTIVE SUMMARY */}
              {sections.exec && (
                <section style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, borderLeft: `3px solid ${T.gold}`, paddingLeft: 10, marginBottom: 12 }}>EXECUTIVE SUMMARY</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: T.sub }}>Climate Alignment Score</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: align.color, background: `${align.color}15`, border: `1px solid ${align.color}44`, borderRadius: 6, padding: '3px 12px' }}>
                      {align.score}/100 — {align.label}
                    </span>
                  </div>
                  {EXEC_SUMMARY[framework].split('\n\n').map((para, i) => (
                    <p key={i} style={{ fontSize: 12.5, color: T.text, lineHeight: 1.75, marginBottom: 10 }}>{para}</p>
                  ))}
                </section>
              )}

              {/* PORTFOLIO OVERVIEW */}
              {sections.portfolio && (
                <section style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, borderLeft: `3px solid ${T.gold}`, paddingLeft: 10, marginBottom: 12 }}>PORTFOLIO OVERVIEW</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                    <thead>
                      <tr style={{ background: `${T.navy}08` }}>
                        {['Holding', 'Weight', 'Sector', 'Scope 1 Mt', 'T-Risk', 'DQS', 'SBTi'].map(h => (
                          <th key={h} style={{ padding: '7px 8px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}`, fontSize: 10 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {HOLDINGS.map((h, i) => (
                        <tr key={h.name} style={{ background: i % 2 === 1 ? `${T.bg}` : T.card }}>
                          <td style={{ padding: '7px 8px', fontWeight: 600, color: T.text }}>{h.name}</td>
                          <td style={{ padding: '7px 8px', color: T.sub }}>{h.weight}%</td>
                          <td style={{ padding: '7px 8px', color: T.sub }}>{h.sector}</td>
                          <td style={{ padding: '7px 8px', color: T.text }}>{h.scope1}</td>
                          <td style={{ padding: '7px 8px' }}>
                            <span style={{ color: triskColor(h.trisk), fontWeight: 600, fontSize: 10 }}>{h.trisk}</span>
                          </td>
                          <td style={{ padding: '7px 8px', color: T.text }}>{h.dqs}</td>
                          <td style={{ padding: '7px 8px' }}>
                            {h.sbti ? <span style={{ color: T.green, fontWeight: 700 }}>✓</span> : <span style={{ color: T.sub }}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}

              {/* CLIMATE RISK ANALYSIS */}
              {sections.climate && (
                <section style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, borderLeft: `3px solid ${T.gold}`, paddingLeft: 10, marginBottom: 14 }}>CLIMATE RISK ANALYSIS</div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 6, textAlign: 'center' }}>Sector Allocation</div>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={SECTOR_PIE} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false} fontSize={9}>
                            {SECTOR_PIE.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => `${v}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 6, textAlign: 'center' }}>Transition Risk Distribution</div>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={TRISK_BAR} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                          <XAxis dataKey="risk" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="count" name="Holdings">
                            {TRISK_BAR.map((e, i) => <Cell key={i} fill={[T.red, T.amber, T.green][i]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </section>
              )}

              {/* GHG EMISSIONS */}
              {sections.ghg && (
                <section style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, borderLeft: `3px solid ${T.gold}`, paddingLeft: 10, marginBottom: 14 }}>GHG EMISSIONS (SCOPE 1/2/3)</div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                    {[{ label: 'Scope 1', value: '45.2 Mt', color: T.red }, { label: 'Scope 2', value: '3.1 Mt', color: T.amber }, { label: 'Scope 3', value: '180 Mt', color: T.indigo }].map(m => (
                      <div key={m.label} style={{ flex: 1, background: `${m.color}10`, border: `1px solid ${m.color}30`, borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: m.color, marginBottom: 4 }}>{m.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.value}</div>
                        <div style={{ fontSize: 9, color: T.sub }}>CO₂ equivalent</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1, background: `${T.navy}08`, borderRadius: 7, padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, color: T.sub }}>Portfolio WACI: </span>
                      <span style={{ fontWeight: 700, color: T.navy }}>285 tCO₂e/$M Revenue</span>
                    </div>
                    <div style={{ flex: 1, background: `${T.red}0d`, borderRadius: 7, padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, color: T.sub }}>Implied Temperature: </span>
                      <span style={{ fontWeight: 700, color: T.red }}>2.8°C</span>
                    </div>
                  </div>
                </section>
              )}

              {/* REGULATORY COMPLIANCE */}
              {sections.regulatory && (
                <section style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, borderLeft: `3px solid ${T.gold}`, paddingLeft: 10, marginBottom: 12 }}>REGULATORY COMPLIANCE</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                    <thead>
                      <tr style={{ background: `${T.navy}08` }}>
                        {['Framework', 'Status', 'Coverage'].map(h => (
                          <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}`, fontSize: 10 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {COMPLIANCE.map((c, i) => (
                        <tr key={c.framework} style={{ background: i % 2 === 1 ? T.bg : T.card }}>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: T.text }}>{c.framework}</td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ color: c.color, fontWeight: 700 }}>{c.icon} {c.status}</span>
                          </td>
                          <td style={{ padding: '8px 10px', color: T.sub, fontSize: 11 }}>FY2024 Reported</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}

              {/* FOOTER */}
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, textAlign: 'center', fontSize: 10, color: T.sub }}>
                Prepared by Risk Analytics Platform v6.0 &nbsp;|&nbsp; Confidential &nbsp;|&nbsp; {reportDate}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60%', color: T.sub, fontSize: 14 }}>
              Click "Generate Report" to preview your ESG report.
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: EXPORT */}
        <div style={{ width: 200, background: T.card, borderLeft: `1px solid ${T.border}`, padding: 20, overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 16 }}>Export Options</div>

          {[
            { label: 'Download PDF', disabled: true, tip: 'PDF export requires premium', color: T.navy },
            { label: copied ? 'Copied!' : 'Copy to Clipboard', disabled: false, onClick: handleCopy, color: T.sage },
            { label: 'Export as JSON', disabled: false, onClick: handleExportJSON, color: T.blue },
            { label: 'Email Report', disabled: true, tip: 'Email requires integration setup', color: T.sub },
          ].map(btn => (
            <div key={btn.label} style={{ position: 'relative', marginBottom: 10 }} title={btn.tip || ''}>
              <button onClick={btn.onClick} disabled={btn.disabled} style={{
                width: '100%', padding: '9px 0', borderRadius: 7, border: `1px solid ${btn.color}40`,
                background: btn.disabled ? T.bg : `${btn.color}15`, color: btn.disabled ? T.sub : btn.color,
                fontWeight: 600, fontSize: 12, cursor: btn.disabled ? 'not-allowed' : 'pointer', fontFamily: T.font,
              }}>{btn.label}</button>
            </div>
          ))}

          <div style={{ marginTop: 24, padding: '12px', background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 8 }}>REPORT METADATA</div>
            {[
              { label: 'Generated', value: generatedAt },
              { label: 'Framework', value: framework },
              { label: 'Est. Pages', value: `${selectedCount + 2}` },
              { label: 'Est. Words', value: `${(selectedCount * 320 + 580).toLocaleString()}` },
            ].map(m => (
              <div key={m.label} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 9, color: T.sub, fontWeight: 600 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: T.text, fontWeight: 500 }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
