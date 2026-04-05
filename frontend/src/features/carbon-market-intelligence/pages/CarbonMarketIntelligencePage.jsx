import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const COMPLIANCE_MARKETS = [
  { name:'EU ETS', region:'Europe', value:680, price:65, unit:'EUR', trend:'+12%', coverage:'40%' },
  { name:'UK ETS', region:'Europe', value:28, price:42, unit:'GBP', trend:'+8%', coverage:'25%' },
  { name:'California Cap', region:'N. America', value:22, price:32, unit:'USD', trend:'+5%', coverage:'35%' },
  { name:'RGGI', region:'N. America', value:6, price:15, unit:'USD', trend:'+3%', coverage:'20%' },
  { name:'China ETS', region:'Asia', value:180, price:9, unit:'CNY', trend:'+25%', coverage:'40%' },
  { name:'Korea ETS', region:'Asia', value:12, price:8, unit:'USD', trend:'-2%', coverage:'70%' },
  { name:'NZ ETS', region:'Oceania', value:4, price:35, unit:'NZD', trend:'+15%', coverage:'50%' },
  { name:'Switzerland', region:'Europe', value:2, price:60, unit:'CHF', trend:'+10%', coverage:'10%' },
];

const VCM_DATA = {
  totalValue: 1.7, issuance: [
    { year:2019, issued:104, retired:62, ratio:0.60 },
    { year:2020, issued:112, retired:78, ratio:0.70 },
    { year:2021, issued:198, retired:155, ratio:0.78 },
    { year:2022, issued:165, retired:142, ratio:0.86 },
    { year:2023, issued:142, retired:128, ratio:0.90 },
    { year:2024, issued:168, retired:152, ratio:0.90 },
  ]
};

const EU_ETS_HISTORY = [
  { year:2018, price:16 }, { year:2019, price:25 }, { year:2020, price:32 },
  { year:2021, price:53 }, { year:2022, price:80 }, { year:2023, price:85 },
  { year:2024, price:65 },
];

const REGIONAL = [
  { region:'EU', compliance:680, vcm:0.4, policy:'MSR, CBAM Phase-In', outlook:'Bullish' },
  { region:'UK', compliance:28, vcm:0.1, policy:'UK CBAM, Expansion Plans', outlook:'Bullish' },
  { region:'California', compliance:22, vcm:0.2, policy:'Cap Tightening 2030', outlook:'Stable' },
  { region:'RGGI', compliance:6, vcm:0.05, policy:'Membership Expansion', outlook:'Stable' },
  { region:'China', compliance:180, vcm:0.3, policy:'Sector Expansion', outlook:'Bullish' },
  { region:'Korea', compliance:12, vcm:0.05, policy:'Offset Limits', outlook:'Bearish' },
  { region:'Emerging', compliance:5, vcm:0.5, policy:'Art. 6 Development', outlook:'High Growth' },
];

const POLICY_EVENTS = [
  { event:'EU CBAM Full Phase-In', date:'2026', impact:'high', priceEffect:'+15-25%' },
  { event:'China ETS Sector Expansion', date:'2025', impact:'high', priceEffect:'+30-50%' },
  { event:'CORSIA Phase 2', date:'2027', impact:'medium', priceEffect:'+5-10%' },
  { event:'Art. 6.4 Market Launch', date:'2025', impact:'high', priceEffect:'New market' },
  { event:'US Federal Carbon Price', date:'2027+', impact:'transformative', priceEffect:'N/A' },
  { event:'UK CBAM Implementation', date:'2027', impact:'medium', priceEffect:'+8-15%' },
];

const FORECASTS = [2025, 2026, 2027, 2028, 2029, 2030].map(y => ({
  year: y,
  meanReversion: 65 + (y - 2024) * 4 + Math.sin(y) * 5,
  trendFollowing: 65 + (y - 2024) * 8,
  scenarioConditional: 65 + (y - 2024) * 12 - (y > 2028 ? (y - 2028) * 3 : 0)
}));

const TABS = ['Market Overview','Compliance vs. Voluntary Trends','Regional Market Deep-Dive','Policy Impact Tracker','Issuance & Retirement Analytics','Price Forecast Models'];
const card = { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 16 };
const lbl = { fontSize: 10, color: T.textMut, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 };

export default function CarbonMarketIntelligencePage() {
  const [tab, setTab] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState('EU');
  const [forecastModel, setForecastModel] = useState('all');
  const [watchlist, setWatchlist] = useState([]);

  const totalCompliance = COMPLIANCE_MARKETS.reduce((a, m) => a + m.value, 0);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: T.mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CN6 · CARBON MARKET INTELLIGENCE</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Carbon Market Intelligence & Analytics Hub</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>8 Compliance Markets · VCM Analytics · Policy Tracker · 3 Forecast Models · Regional Deep-Dive</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Compliance Mkt', val: `$${totalCompliance}B`, col: T.gold },
              { label: 'VCM', val: `$${VCM_DATA.totalValue}B`, col: T.teal },
              { label: 'EU ETS', val: `EUR${COMPLIANCE_MARKETS[0].price}`, col: T.blue },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label}</div>
                <div style={{ color: m.col, fontSize: 18, fontWeight: 700, fontFamily: T.mono }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 12,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px 32px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
            {REGIONAL.map(r => <option key={r.region}>{r.region}</option>)}
          </select>
          <button onClick={() => alert('Export PDF')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export PDF</button>
          <button onClick={() => alert('Export CSV')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.navy}`, background: 'transparent', color: T.navy, cursor: 'pointer', fontSize: 11 }}>Export CSV</button>
          <button onClick={() => alert('Subscribe')} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${T.teal}`, background: 'transparent', color: T.teal, cursor: 'pointer', fontSize: 11 }}>Subscribe Alerts</button>
        </div>

        {tab === 0 && (<div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={card}>
              <div style={lbl}>Compliance Market Value ($B)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={COMPLIANCE_MARKETS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => `$${v}B`} /><Bar dataKey="value" name="Market Value ($B)" radius={[0, 4, 4, 0]}>
                    {COMPLIANCE_MARKETS.map((_, i) => <Cell key={i} fill={[T.blue, T.teal, T.green, T.sage, T.red, T.amber, T.purple, T.orange][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <div style={lbl}>Global Carbon Market Split</div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={[{ name: 'Compliance', value: totalCompliance }, { name: 'Voluntary', value: VCM_DATA.totalValue }]} dataKey="value" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: $${value}B`}>
                    <Cell fill={T.blue} /><Cell fill={T.green} />
                  </Pie>
                  <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={card}>
            <div style={lbl}>Market Summary Table</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Market','Region','Value ($B)','Price','Trend','Coverage'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 6px', color: T.textMut }}>{h}</th>)}
              </tr></thead>
              <tbody>{COMPLIANCE_MARKETS.map(m => (
                <tr key={m.name} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: 6, fontWeight: 600 }}>{m.name}</td>
                  <td style={{ padding: 6 }}>{m.region}</td>
                  <td style={{ padding: 6, fontFamily: T.mono }}>${m.value}B</td>
                  <td style={{ padding: 6, fontFamily: T.mono }}>{m.unit}{m.price}</td>
                  <td style={{ padding: 6, color: m.trend.startsWith('+') ? T.green : T.red }}>{m.trend}</td>
                  <td style={{ padding: 6 }}>{m.coverage}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>)}

        {tab === 1 && (<div>
          <div style={card}>
            <div style={lbl}>EU ETS Price History (EUR/tCO2)</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={EU_ETS_HISTORY}>
                <defs><linearGradient id="euGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.blue} stopOpacity={0.3} /><stop offset="95%" stopColor={T.blue} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                <Tooltip /><Area type="monotone" dataKey="price" stroke={T.blue} fill="url(#euGrad)" strokeWidth={2} name="EU ETS (EUR)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>VCM Issuance vs Retirement Trend (MtCO2)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={VCM_DATA.issuance}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="issued" name="Issued (Mt)" fill={T.blue} />
                <Bar dataKey="retired" name="Retired (Mt)" fill={T.green} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 2 && (<div>
          <div style={card}>
            <div style={lbl}>Regional Market Comparison</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={REGIONAL}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="region" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="compliance" name="Compliance ($B)" fill={T.blue} />
                <Bar dataKey="vcm" name="VCM ($B)" fill={T.green} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Regional Details</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Region','Compliance ($B)','VCM ($B)','Key Policy','Outlook'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 6px', color: T.textMut }}>{h}</th>)}
              </tr></thead>
              <tbody>{REGIONAL.map(r => (
                <tr key={r.region} style={{ borderBottom: `1px solid ${T.border}`, background: r.region === selectedRegion ? T.gold + '11' : 'transparent' }}>
                  <td style={{ padding: 6, fontWeight: 600 }}>{r.region}</td>
                  <td style={{ padding: 6, fontFamily: T.mono }}>${r.compliance}B</td>
                  <td style={{ padding: 6, fontFamily: T.mono }}>${r.vcm}B</td>
                  <td style={{ padding: 6 }}>{r.policy}</td>
                  <td style={{ padding: 6 }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, background: r.outlook === 'Bullish' || r.outlook === 'High Growth' ? T.green + '22' : r.outlook === 'Bearish' ? T.red + '22' : T.amber + '22', color: r.outlook === 'Bullish' || r.outlook === 'High Growth' ? T.green : r.outlook === 'Bearish' ? T.red : T.amber }}>{r.outlook}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>)}

        {tab === 3 && (<div>
          <div style={card}>
            <div style={lbl}>Key Policy Events & Carbon Price Impact</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Event','Date','Impact','Price Effect'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 6px', color: T.textMut }}>{h}</th>)}
              </tr></thead>
              <tbody>{POLICY_EVENTS.map(e => (
                <tr key={e.event} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: 6, fontWeight: 600 }}>{e.event}</td>
                  <td style={{ padding: 6, fontFamily: T.mono }}>{e.date}</td>
                  <td style={{ padding: 6 }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: e.impact === 'high' || e.impact === 'transformative' ? T.red + '22' : T.amber + '22', color: e.impact === 'high' || e.impact === 'transformative' ? T.red : T.amber }}>{e.impact}</span></td>
                  <td style={{ padding: 6, fontFamily: T.mono, color: T.green }}>{e.priceEffect}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={card}>
            <div style={lbl}>Policy Timeline</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={POLICY_EVENTS.map(e => ({ ...e, impactScore: e.impact === 'transformative' ? 4 : e.impact === 'high' ? 3 : 2 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="event" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" height={60} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} /><Tooltip />
                <Bar dataKey="impactScore" name="Impact Level" radius={[4, 4, 0, 0]}>
                  {POLICY_EVENTS.map((e, i) => <Cell key={i} fill={e.impact === 'transformative' ? T.purple : e.impact === 'high' ? T.red : T.amber} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 4 && (<div>
          <div style={card}>
            <div style={lbl}>VCM Issuance/Retirement Ratio Trend</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={VCM_DATA.issuance}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis domain={[0.4, 1]} tick={{ fontSize: 10 }} />
                <Tooltip /><ReferenceLine y={1} stroke={T.green} strokeDasharray="4 4" label={{ value: 'Equilibrium', fontSize: 10 }} />
                <Line type="monotone" dataKey="ratio" stroke={T.navy} strokeWidth={2} name="Retire/Issue Ratio" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={lbl}>Annual Issuance & Retirement Volume (MtCO2)</div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={VCM_DATA.issuance}>
                <defs>
                  <linearGradient id="iGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.blue} stopOpacity={0.3} /><stop offset="95%" stopColor={T.blue} stopOpacity={0} /></linearGradient>
                  <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.green} stopOpacity={0.3} /><stop offset="95%" stopColor={T.green} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="issued" stroke={T.blue} fill="url(#iGrad)" name="Issued (Mt)" />
                <Area type="monotone" dataKey="retired" stroke={T.green} fill="url(#rGrad)" name="Retired (Mt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>)}

        {tab === 5 && (<div>
          <div style={card}>
            <div style={lbl}>EU ETS Price Forecast — 3 Models (EUR/tCO2)</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['all','meanReversion','trendFollowing','scenarioConditional'].map(m => (
                <button key={m} onClick={() => setForecastModel(m)} style={{
                  padding: '4px 12px', borderRadius: 20, border: `2px solid ${forecastModel === m ? T.gold : 'transparent'}`,
                  background: forecastModel === m ? T.gold + '22' : T.bg, cursor: 'pointer', fontSize: 11
                }}>{m === 'all' ? 'All Models' : m.replace(/([A-Z])/g, ' $1').trim()}</button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={FORECASTS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                {(forecastModel === 'all' || forecastModel === 'meanReversion') && <Line type="monotone" dataKey="meanReversion" stroke={T.blue} strokeWidth={2} name="Mean Reversion" dot={{ r: 3 }} />}
                {(forecastModel === 'all' || forecastModel === 'trendFollowing') && <Line type="monotone" dataKey="trendFollowing" stroke={T.green} strokeWidth={2} name="Trend Following" dot={{ r: 3 }} />}
                {(forecastModel === 'all' || forecastModel === 'scenarioConditional') && <Line type="monotone" dataKey="scenarioConditional" stroke={T.purple} strokeWidth={2} name="Scenario Conditional" dot={{ r: 3 }} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...card, background: T.navy + '08', border: `1px solid ${T.gold}33` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 4 }}>Forecast Methodology</div>
            <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>
              Mean Reversion: Ornstein-Uhlenbeck process around long-term equilibrium. Trend Following: momentum-based with breakout detection. Scenario Conditional: NGFS-weighted forecast incorporating policy events (CBAM, ETS reform). All models calibrated to 2018-2024 EU ETS data.
            </div>
          </div>
        </div>)}
      </div>
    </div>
  );
}
