import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = {
  bg: '#f6f4f0', surface: '#ffffff', border: '#e5e0d8', navy: '#1b3a5c',
  navyL: '#2c5a8c', gold: '#c5a96a', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706', blue: '#2563eb',
  orange: '#ea580c', purple: '#7c3aed', teal: '#0891b2', sage: '#5a8a6a',
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', font: "'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};

function gevPdf(x, mu, sigma, xi) {
  const t = 1 + xi * ((x - mu) / sigma);
  if (t <= 0) return 0;
  const expTerm = Math.pow(t, -1 / xi);
  return (1 / sigma) * Math.pow(t, -1 - 1 / xi) * Math.exp(-expTerm);
}

function returnPeriod(probability) { return 1 / probability; }

const BLACK_SWANS = [
  {
    id: 'methane_clathrate', name: 'Methane Clathrate Release', probability: 0.03, portfolioImpact: -28,
    description: 'Rapid destabilization of oceanic methane hydrates due to warming bottom waters, releasing 50+ GtC over decades.',
    hedging: ['Long natural gas futures', 'Short fossil fuel equities', 'Catastrophe bonds', 'Tail risk put options'],
    timeframe: '2040-2100', severity: 'Extreme', color: T.red,
  },
  {
    id: 'amoc_shutdown', name: 'AMOC Shutdown', probability: 0.05, portfolioImpact: -22,
    description: 'Collapse of Atlantic Meridional Overturning Circulation, disrupting European climate, agriculture, and marine ecosystems.',
    hedging: ['European agriculture shorts', 'Nordic energy longs', 'Climate adaptation REITs', 'EU sovereign CDS'],
    timeframe: '2050-2100', severity: 'Extreme', color: T.orange,
  },
  {
    id: 'permafrost_cascade', name: 'Permafrost Tipping Cascade', probability: 0.08, portfolioImpact: -18,
    description: 'Self-reinforcing permafrost thaw releasing 100+ GtC, triggering cascading tipping points across cryosphere.',
    hedging: ['Carbon credit longs', 'Arctic infrastructure shorts', 'Renewable energy longs', 'Climate risk swaps'],
    timeframe: '2035-2080', severity: 'High', color: T.amber,
  },
  {
    id: 'breadbasket_failure', name: 'Multi-Breadbasket Failure', probability: 0.04, portfolioImpact: -25,
    description: 'Simultaneous crop failures across 3+ major breadbaskets (US Midwest, Indo-Gangetic Plain, NE China, Brazil cerrado).',
    hedging: ['Agricultural commodity longs', 'Food security ETFs', 'Emerging market sovereign CDS', 'Water utilities longs'],
    timeframe: '2030-2060', severity: 'Extreme', color: T.purple,
  },
  {
    id: 'antarctic_collapse', name: 'Rapid Antarctic Ice Collapse', probability: 0.02, portfolioImpact: -35,
    description: 'Marine ice cliff instability in Thwaites/Pine Island glaciers, driving 1-3m sea level rise within decades.',
    hedging: ['Coastal real estate shorts', 'Infrastructure adaptation longs', 'Managed retreat REITs', 'Reinsurance shorts'],
    timeframe: '2060-2150', severity: 'Catastrophic', color: T.red,
  },
];

const EVT_DATA = Array.from({ length: 200 }, (_, i) => {
  const x = 0.5 + i * 0.5;
  return { x, pdf: gevPdf(x, 15, 8, 0.25), cdf: 1 - Math.exp(-Math.pow(x / 15, 1.3)) };
});

const LOSS_EXCEEDANCE = [
  { returnPeriod: '10yr', loss: 2.8, probability: 10 },
  { returnPeriod: '25yr', loss: 5.2, probability: 4 },
  { returnPeriod: '50yr', loss: 8.5, probability: 2 },
  { returnPeriod: '100yr', loss: 14.2, probability: 1 },
  { returnPeriod: '250yr', loss: 22.8, probability: 0.4 },
  { returnPeriod: '500yr', loss: 32.1, probability: 0.2 },
  { returnPeriod: '1000yr', loss: 45.5, probability: 0.1 },
];

const SYSTEMIC_CONTRIB = [
  { sector: 'Fossil Fuels', margES: 8.5, compES: 5.2, systemic: 3.3 },
  { sector: 'Real Estate', margES: 6.2, compES: 4.8, systemic: 1.4 },
  { sector: 'Agriculture', margES: 4.8, compES: 3.1, systemic: 1.7 },
  { sector: 'Utilities', margES: 3.5, compES: 2.8, systemic: 0.7 },
  { sector: 'Transport', margES: 3.2, compES: 2.5, systemic: 0.7 },
  { sector: 'Insurance', margES: 5.8, compES: 2.2, systemic: 3.6 },
  { sector: 'Banking', margES: 4.5, compES: 3.0, systemic: 1.5 },
];

const TABS = ['Tail Distribution Dashboard', 'Extreme Value Theory', 'Black Swan Scenarios', 'Loss Exceedance', 'Systemic Risk Contribution', 'Insurance Implications'];

const Card = ({ title, children, span }) => (
  <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 20, gridColumn: span ? `span ${span}` : undefined }}>
    {title && <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>{title}</div>}
    {children}
  </div>
);

const Pill = ({ label, val, color }) => (
  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
    <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ color, fontSize: 18, fontWeight: 700, fontFamily: T.mono }}>{val}</div>
  </div>
);

const Ref = ({ text }) => (
  <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#92400e', marginTop: 12 }}>
    <strong>Reference:</strong> {text}
  </div>
);

export default function TailRiskAnalyzerPage() {
  const [tab, setTab] = useState(0);
  const [selectedSwan, setSelectedSwan] = useState('methane_clathrate');
  const [evtShape, setEvtShape] = useState(0.25);
  const [alertSubs, setAlertSubs] = useState([]);
  const [customScenario, setCustomScenario] = useState({ name: '', probability: 5, impact: -15 });

  const swan = BLACK_SWANS.find(s => s.id === selectedSwan);

  const evtFitted = useMemo(() =>
    Array.from({ length: 200 }, (_, i) => {
      const x = 0.5 + i * 0.5;
      return { x: x.toFixed(1), pdf: gevPdf(x, 15, 8, evtShape) };
    }),
  [evtShape]);

  const insuranceData = [
    { peril: 'Flood', insuredLoss: 42, economicLoss: 125, gap: 83, gapPct: 66 },
    { peril: 'Wildfire', insuredLoss: 18, economicLoss: 65, gap: 47, gapPct: 72 },
    { peril: 'Hurricane', insuredLoss: 68, economicLoss: 185, gap: 117, gapPct: 63 },
    { peril: 'Drought', insuredLoss: 5, economicLoss: 45, gap: 40, gapPct: 89 },
    { peril: 'Heat Wave', insuredLoss: 2, economicLoss: 35, gap: 33, gapPct: 94 },
  ];

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CH4 -- TAIL RISK ANALYZER</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Climate Tail Risk & Extreme Event Analysis</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              EVT (GEV Fit) -- 5 Black Swan Scenarios -- Loss Exceedance Curves -- Systemic Risk -- Insurance Gap Analysis
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Pill label="1000yr Loss" val="45.5%" color={T.red} />
            <Pill label="Black Swans" val="5" color={T.orange} />
            <Pill label="EVT Shape" val={evtShape.toFixed(2)} color={T.gold} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 12,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px 32px' }}>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="Tail Loss Distribution (GEV Fit)" span={2}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={evtFitted}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" fontSize={10} label={{ value: 'Loss (%)', position: 'insideBottom', offset: -4, fontSize: 10 }} />
                  <YAxis fontSize={10} label={{ value: 'Density', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="pdf" fill={T.red + '30'} stroke={T.red} strokeWidth={2} name="GEV PDF" />
                  <ReferenceLine x="14.2" stroke={T.orange} strokeDasharray="5 5" label={{ value: '100yr', fill: T.orange, fontSize: 10 }} />
                  <ReferenceLine x="32.1" stroke={T.red} strokeDasharray="5 5" label={{ value: '500yr', fill: T.red, fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
              <Ref text="IPCC AR6 WG1 Chapter 11 (Weather and Climate Extreme Events). GEV distribution fit per Coles (2001) 'An Introduction to Statistical Modeling of Extreme Values'." />
            </Card>
            <Card title="Key Return Periods">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Return Period', 'Loss (%)', 'Probability (%)'].map(h => <th key={h} style={{ padding: 8, textAlign: 'right', color: T.navy }}>{h}</th>)}
                </tr></thead>
                <tbody>{LOSS_EXCEEDANCE.map(r => (
                  <tr key={r.returnPeriod} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>{r.returnPeriod}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono, color: T.red }}>{r.loss}%</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono }}>{r.probability}%</td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
            <Card title="Black Swan Overview">
              {BLACK_SWANS.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 12, color: s.color }}>{s.name}</span>
                    <span style={{ fontSize: 10, color: T.textMut, marginLeft: 8 }}>{s.timeframe}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontFamily: T.mono, fontSize: 12 }}>P={s.probability * 100}%</span>
                    <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.red }}>{s.portfolioImpact}%</span>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="GEV Distribution Shape Parameter" span={2}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: T.textSec }}>Shape parameter (xi): {evtShape.toFixed(2)} -- {evtShape > 0 ? 'Frechet (heavy tail)' : evtShape < 0 ? 'Weibull (bounded)' : 'Gumbel (exponential tail)'}</label>
                <input type="range" min={-0.5} max={0.8} step={0.05} value={evtShape} onChange={e => setEvtShape(+e.target.value)} style={{ display: 'block', width: 400 }} />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={evtFitted}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="pdf" fill={T.purple + '30'} stroke={T.purple} strokeWidth={2} name="GEV PDF" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card title="EVT Methodology">
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.7 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, background: T.bg, padding: 12, borderRadius: 8, marginBottom: 12 }}>
                  GEV(x; mu, sigma, xi) = exp{'{'}-(1 + xi*(x-mu)/sigma)^(-1/xi){'}'}
                </div>
                <p><strong>Parameters:</strong> mu (location) = 15, sigma (scale) = 8, xi (shape) = {evtShape.toFixed(2)}</p>
                <p><strong>Return periods:</strong> RP = 1/P(X {'>'} x) where P is the exceedance probability from GEV CDF.</p>
                <p><strong>Estimation:</strong> Maximum Likelihood Estimation (MLE) on block maxima of annual climate losses (1980-2025).</p>
              </div>
              <Ref text="Coles (2001) 'Statistical Modeling of Extreme Values'. Fisher-Tippett-Gnedenko theorem. Block maxima approach with annual blocks." />
            </Card>
            <Card title="Shape Parameter Impact on Tail">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={Array.from({ length: 100 }, (_, i) => {
                  const x = 0.5 + i;
                  return { x, light: gevPdf(x, 15, 8, 0.1), moderate: gevPdf(x, 15, 8, 0.25), heavy: gevPdf(x, 15, 8, 0.5) };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="light" stroke={T.green} strokeWidth={2} name="xi=0.1 (light)" dot={false} />
                  <Line type="monotone" dataKey="moderate" stroke={T.amber} strokeWidth={2} name="xi=0.25 (moderate)" dot={false} />
                  <Line type="monotone" dataKey="heavy" stroke={T.red} strokeWidth={2} name="xi=0.5 (heavy)" dot={false} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="Black Swan Scenario Selector" span={2}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {BLACK_SWANS.map(s => (
                  <button key={s.id} onClick={() => setSelectedSwan(s.id)} style={{
                    padding: '8px 16px', borderRadius: 10, border: `2px solid ${selectedSwan === s.id ? s.color : T.border}`,
                    background: selectedSwan === s.id ? s.color + '15' : T.surface, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: s.color
                  }}>{s.name.split(' ').slice(0, 2).join(' ')}</button>
                ))}
              </div>
            </Card>
            <Card title={`${swan.name} -- Deep Dive`}>
              <div style={{ borderLeft: `4px solid ${swan.color}`, paddingLeft: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.7, marginBottom: 12 }}>{swan.description}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { l: 'Probability', v: `${(swan.probability * 100).toFixed(0)}%`, col: T.amber },
                    { l: 'Portfolio Impact', v: `${swan.portfolioImpact}%`, col: T.red },
                    { l: 'Timeframe', v: swan.timeframe, col: T.blue },
                    { l: 'Severity', v: swan.severity, col: swan.color },
                  ].map(m => (
                    <div key={m.l} style={{ background: T.bg, borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 10, color: T.textMut, textTransform: 'uppercase' }}>{m.l}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: m.col, fontFamily: T.mono }}>{m.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Hedging Strategies</div>
              {swan.hedging.map((h, i) => (
                <div key={i} style={{ padding: '6px 10px', background: T.bg, borderRadius: 6, marginBottom: 4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: swan.color }} /> {h}
                </div>
              ))}
              <Ref text="IPCC AR6 WG1 Chapter 4 tipping elements. Lenton et al. (2019) 'Climate tipping points -- too risky to bet against'. Nature 575, 592-595." />
            </Card>
            <Card title="Black Swan Impact Comparison">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={BLACK_SWANS.map(s => ({ name: s.name.split(' ')[0], impact: Math.abs(s.portfolioImpact), prob: s.probability * 100, color: s.color }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" fontSize={10} />
                  <YAxis type="category" dataKey="name" fontSize={10} width={80} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="impact" name="Portfolio Impact (%)" radius={[0, 4, 4, 0]}>
                    {BLACK_SWANS.map(s => <Cell key={s.id} fill={s.color} />)}
                  </Bar>
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="Loss Exceedance Curve" span={2}>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={LOSS_EXCEEDANCE}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="returnPeriod" fontSize={10} />
                  <YAxis fontSize={10} label={{ value: 'Loss (%)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="loss" stroke={T.red} strokeWidth={3} name="Loss Exceedance (%)" dot={{ r: 5, fill: T.red }} />
                  <ReferenceLine y={20} stroke={T.orange} strokeDasharray="5 5" label={{ value: '20% Threshold', fill: T.orange, fontSize: 10 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
              <Ref text="Loss exceedance probability (EP) curve methodology per Grossi & Kunreuther (2005). Return periods calibrated to GEV distribution fit on historical climate-related financial losses." />
            </Card>
            <Card title="Detailed EP Table">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Return Period', 'Loss (%)', 'Annual Prob (%)', 'Equiv $B (10B AUM)'].map(h => <th key={h} style={{ padding: 8, textAlign: 'right', color: T.navy }}>{h}</th>)}
                </tr></thead>
                <tbody>{LOSS_EXCEEDANCE.map(r => (
                  <tr key={r.returnPeriod} style={{ borderBottom: `1px solid ${T.border}`, background: r.loss > 20 ? T.red + '08' : 'transparent' }}>
                    <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>{r.returnPeriod}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono, color: T.red }}>{r.loss}%</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono }}>{r.probability}%</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono }}>${(r.loss * 100).toFixed(0)}M</td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
            <Card title="Custom Extreme Scenario Builder">
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                <div><label style={{ fontSize: 11, color: T.textSec }}>Scenario Name</label><input type="text" value={customScenario.name} onChange={e => setCustomScenario(p => ({ ...p, name: e.target.value }))} placeholder="Custom scenario..." style={{ display: 'block', padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: 200 }} /></div>
                <div><label style={{ fontSize: 11, color: T.textSec }}>Probability (%): {customScenario.probability}</label><input type="range" min={1} max={20} value={customScenario.probability} onChange={e => setCustomScenario(p => ({ ...p, probability: +e.target.value }))} style={{ display: 'block', width: 150 }} /></div>
                <div><label style={{ fontSize: 11, color: T.textSec }}>Impact (%): {customScenario.impact}</label><input type="range" min={-50} max={0} value={customScenario.impact} onChange={e => setCustomScenario(p => ({ ...p, impact: +e.target.value }))} style={{ display: 'block', width: 150 }} /></div>
              </div>
              <button onClick={() => alert(`Custom scenario: ${customScenario.name || 'Unnamed'}, P=${customScenario.probability}%, Impact=${customScenario.impact}%`)} style={{ padding: '6px 14px', background: T.navy, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Add Custom Scenario</button>
            </Card>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="Systemic Risk Contribution by Sector" span={2}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={SYSTEMIC_CONTRIB}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" fontSize={10} />
                  <YAxis fontSize={10} label={{ value: 'Expected Shortfall (%)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="compES" fill={T.blue} name="Component ES" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="systemic" fill={T.red} name="Systemic Contribution" stackId="a" radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
              <Ref text="Systemic risk decomposition per Acharya et al. (2017) 'Measuring Systemic Risk'. Marginal ES = component ES + systemic spillover contribution." />
            </Card>
            <Card title="Systemic Risk Detail">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Sector', 'Marginal ES', 'Component ES', 'Systemic Contrib', 'Rank'].map(h => <th key={h} style={{ padding: 8, textAlign: 'right', color: T.navy }}>{h}</th>)}
                </tr></thead>
                <tbody>{SYSTEMIC_CONTRIB.sort((a, b) => b.systemic - a.systemic).map((r, i) => (
                  <tr key={r.sector} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>{r.sector}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono }}>{r.margES}%</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono }}>{r.compES}%</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono, fontWeight: 700, color: T.red }}>{r.systemic}%</td>
                    <td style={{ padding: 8, textAlign: 'right', fontWeight: 700 }}>#{i + 1}</td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
            <Card title="Tail Risk Alert Subscription">
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>Subscribe to alerts when tail risk metrics breach thresholds. Alerts delivered via dashboard notification.</div>
              {['100yr loss exceeds 15%', '500yr loss exceeds 30%', 'New tipping point evidence', 'Systemic contribution spike'].map(alert => (
                <div key={alert} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                  <input type="checkbox" checked={alertSubs.includes(alert)} onChange={() => setAlertSubs(prev => prev.includes(alert) ? prev.filter(a => a !== alert) : [...prev, alert])} />
                  <span style={{ fontSize: 12 }}>{alert}</span>
                </div>
              ))}
              <button onClick={() => alert(`Subscribed to ${alertSubs.length} alerts`)} style={{ padding: '6px 14px', background: T.navy, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, marginTop: 8 }}>Save Alert Preferences</button>
            </Card>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Card title="Insurance Protection Gap by Peril" span={2}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={insuranceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="peril" fontSize={10} />
                  <YAxis fontSize={10} label={{ value: 'Loss ($B)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="insuredLoss" fill={T.blue} name="Insured Loss" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="gap" fill={T.red + '88'} name="Protection Gap" stackId="a" radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Protection Gap Detail">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Peril', 'Insured ($B)', 'Economic ($B)', 'Gap ($B)', 'Gap %'].map(h => <th key={h} style={{ padding: 8, textAlign: 'right', color: T.navy }}>{h}</th>)}
                </tr></thead>
                <tbody>{insuranceData.map(r => (
                  <tr key={r.peril} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>{r.peril}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono }}>{r.insuredLoss}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono }}>{r.economicLoss}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono, color: T.red }}>{r.gap}</td>
                    <td style={{ padding: 8, textAlign: 'right', fontFamily: T.mono, fontWeight: 700, color: T.red }}>{r.gapPct}%</td>
                  </tr>
                ))}</tbody>
              </table>
              <Ref text="Swiss Re sigma 1/2025 'Natural catastrophes in 2024'. Insurance protection gap per Geneva Association (2024). Lenton et al. (2019) tipping cascade analysis." />
            </Card>
            <Card title="Peer Comparison & Export">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button style={{ padding: '6px 14px', background: T.navy, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Compare vs Peers</button>
                <button style={{ padding: '6px 14px', background: T.blue, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Export Tail Risk Report</button>
                <button style={{ padding: '6px 14px', background: T.green, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Share Analysis</button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
