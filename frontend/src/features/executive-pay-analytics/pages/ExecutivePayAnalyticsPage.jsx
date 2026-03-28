import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
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
const ACCENT = '#c5a96a';
const tip = {
  contentStyle: { background: T.surface, border: '1px solid ' + T.border, borderRadius: 8, color: T.text },
  labelStyle: { color: T.textSec }
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const COMPANIES = ['Alpha Corp', 'Beta Group', 'Gamma Inc', 'Delta Ltd', 'Epsilon Plc', 'Zeta Co', 'Eta Corp', 'Theta Industries'];
const SHORT = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const overviewTable = COMPANIES.map((name, i) => ({
  name,
  ceoPay: +(8 + sr(i * 3) * 18).toFixed(1),
  medianPay: +(52 + sr(i * 7) * 60).toFixed(0),
  payRatio: Math.round(180 + sr(i * 11) * 260),
  sayOnPay: +(72 + sr(i * 13) * 27).toFixed(1),
  esgLinked: i % 3 !== 2 ? 'Y' : 'N',
}));

const ratioTrend = Array.from({ length: 24 }, (_, i) => ({
  month: `M${i + 1}`,
  ratio: Math.round(280 + sr(i * 5) * 100),
}));

const payStructure = COMPANIES.map((name, i) => {
  const base = Math.round(10 + sr(i * 2) * 10);
  const bonus = Math.round(20 + sr(i * 4) * 15);
  const ltip = Math.round(50 + sr(i * 6) * 15);
  const other = 100 - base - bonus - ltip;
  return { name, short: SHORT[i], base, bonus, ltip, other, totalComp: +(8 + sr(i * 3) * 18).toFixed(1) };
});

const compBarData = payStructure.map(d => ({ name: d.short, comp: d.totalComp }));

const ESG_METRICS = [
  { metric: 'GHG Reduction', adoption: 82, weight: 22, period: 'Annual', verified: 74 },
  { metric: 'Safety (TRIR)', adoption: 71, weight: 18, period: 'Annual', verified: 61 },
  { metric: 'Employee Engagement', adoption: 65, weight: 14, period: 'Annual', verified: 48 },
  { metric: 'Diversity Targets', adoption: 58, weight: 12, period: 'Annual', verified: 52 },
  { metric: 'Customer Satisfaction', adoption: 44, weight: 10, period: 'Annual', verified: 35 },
  { metric: 'Supplier Conduct', adoption: 37, weight: 9, period: 'Biannual', verified: 28 },
  { metric: 'Water Intensity', adoption: 29, weight: 8, period: 'Annual', verified: 22 },
  { metric: 'Social Impact Score', adoption: 21, weight: 7, period: 'Annual', verified: 18 },
];

const esgTrend = Array.from({ length: 24 }, (_, i) => ({
  month: `M${i + 1}`,
  linked: Math.round(40 + sr(i * 9) * 35),
}));

const VOTES = COMPANIES.map((name, i) => {
  const support = +(72 + sr(i * 17) * 27).toFixed(1);
  const outcome = support >= 90 ? 'Passed' : support >= 75 ? 'Passed' : i === 3 ? 'Failed' : i === 6 ? 'Withdrawn' : 'Passed';
  const concerns = ['Pay quantum', 'LTIP structure', 'Peer benchmarking', 'ESG weighting', 'Disclosure quality', 'Clawback policy', 'Ratio disclosure', 'Bonus targets'][i];
  return { name, short: SHORT[i], support, opposition: +(100 - support).toFixed(1), concerns, outcome };
});

const proxyAdvisors = [
  { company: 'Alpha Corp', iss: 'For', gl: 'For', outcome: 'Passed' },
  { company: 'Beta Group', iss: 'For', gl: 'For', outcome: 'Passed' },
  { company: 'Gamma Inc', iss: 'Against', gl: 'For', outcome: 'Passed' },
  { company: 'Delta Ltd', iss: 'Against', gl: 'Against', outcome: 'Failed' },
  { company: 'Epsilon Plc', iss: 'For', gl: 'For', outcome: 'Passed' },
  { company: 'Zeta Co', iss: 'Against', gl: 'For', outcome: 'Passed' },
  { company: 'Eta Corp', iss: 'For', gl: 'Abstain', outcome: 'Withdrawn' },
  { company: 'Theta Industries', iss: 'For', gl: 'For', outcome: 'Passed' },
];

const REGULATIONS = [
  { name: 'EU Shareholders Rights Dir. II', jurisdiction: 'EU', disclosure: 'CEO pay ratio, individual director pay', vote: 'Advisory', penalty: '€500k / 5% revenue', effective: '2020' },
  { name: "UK Directors' Remuneration Report", jurisdiction: 'UK', disclosure: 'Full pay policy & single figure table', vote: 'Binding (policy)', penalty: 'Criminal liability', effective: '2013' },
  { name: 'SEC Pay vs Performance Rule', jurisdiction: 'US', disclosure: 'Pay vs company financial performance', vote: 'Advisory', penalty: 'SEC enforcement', effective: '2023' },
  { name: 'Dodd-Frank Pay Ratio Rule', jurisdiction: 'US', disclosure: 'CEO-to-median employee pay ratio', vote: 'Advisory', penalty: 'SEC enforcement', effective: '2018' },
  { name: 'Australian Remuneration Report', jurisdiction: 'AUS', disclosure: 'KMP remuneration full disclosure', vote: 'Advisory (two-strikes)', penalty: 'Board spill', effective: '2004' },
  { name: 'Say-on-Pay (Various)', jurisdiction: 'Global', disclosure: 'Remuneration policy vote', vote: 'Advisory / Binding', penalty: 'Varies', effective: 'Varies' },
];

const complianceData = [
  { name: 'EU', rate: 84 }, { name: 'UK', rate: 91 }, { name: 'US (PvP)', rate: 78 },
  { name: 'US (Ratio)', rate: 88 }, { name: 'AUS', rate: 93 }, { name: 'Global', rate: 67 },
];

const TABS = ['Overview', 'Pay Structure', 'ESG Linkage', 'Shareholder Voting', 'Regulatory'];

const StatCard = ({ label, value }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ color: T.textSec, fontSize: 12, marginBottom: 6 }}>{label}</div>
    <div style={{ color: ACCENT, fontSize: 22, fontWeight: 700 }}>{value}</div>
  </div>
);

const Badge = ({ val }) => {
  const color = val === 'Passed' ? T.green : val === 'Failed' ? T.red : T.amber;
  return <span style={{ background: color + '22', color, border: `1px solid ${color}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{val}</span>;
};

export default function ExecutivePayAnalyticsPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: '24px 28px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Executive Pay & Remuneration Analytics</h1>
      <p style={{ color: T.textSec, fontSize: 13, marginBottom: 24 }}>CEO compensation ratios, ESG pay linkage, shareholder voting outcomes and regulatory compliance.</p>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${T.border}`, marginBottom: 28 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            background: 'none', border: 'none', padding: '10px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            color: tab === i ? ACCENT : T.textSec,
            borderBottom: tab === i ? `2px solid ${ACCENT}` : '2px solid transparent',
            transition: 'color .2s'
          }}>{t}</button>
        ))}
      </div>

      {/* Tab 1 — Overview */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <StatCard label="CEO-Median Pay Ratio" value="324x" />
            <StatCard label="Say-on-Pay Pass Rate" value="89%" />
            <StatCard label="ESG-Linked Pay" value="68%" />
            <StatCard label="Avg LTIP Vesting" value="3.2 yrs" />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>CEO Compensation Overview</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Company', 'CEO Total ($M)', 'Median Pay ($k)', 'Pay Ratio', 'Say-on-Pay %', 'ESG Linked'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: T.textSec, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overviewTable.map((r, i) => (
                  <tr key={r.name} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 ? T.bg + '60' : 'transparent' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: '8px 10px', color: ACCENT }}>${r.ceoPay}M</td>
                    <td style={{ padding: '8px 10px' }}>${r.medianPay}k</td>
                    <td style={{ padding: '8px 10px', color: r.payRatio > 300 ? T.red : T.amber }}>{r.payRatio}x</td>
                    <td style={{ padding: '8px 10px' }}>{r.sayOnPay}%</td>
                    <td style={{ padding: '8px 10px' }}><Badge val={r.esgLinked === 'Y' ? 'Passed' : 'Failed'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>CEO Pay Ratio — 24-Month Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={ratioTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill: T.textSec, fontSize: 11 }} interval={3} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} domain={[250, 400]} />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="ratio" stroke={ACCENT} fill={ACCENT + '22'} strokeWidth={2} name="Pay Ratio (x)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2 — Pay Structure Breakdown */}
      {tab === 1 && (
        <div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Compensation Mix by Company</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Company', 'Base %', 'Annual Bonus %', 'LTIP %', 'Other %'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: T.textSec, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payStructure.map((r, i) => (
                  <tr key={r.name} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 ? T.bg + '60' : 'transparent' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.name}</td>
                    {[{ val: r.base, color: T.teal }, { val: r.bonus, color: ACCENT }, { val: r.ltip, color: T.green }, { val: r.other, color: T.textSec }].map(({ val, color }, j) => (
                      <td key={j} style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 8, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${val}%`, height: '100%', background: color, borderRadius: 4 }} />
                          </div>
                          <span style={{ color }}>{val}%</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <StatCard label="Avg ESG Weight in Bonus" value="18%" />
            <StatCard label="Avg LTIP Performance Period" value="3.2 yrs" />
            <StatCard label="Clawback Provision Adoption" value="74%" />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Total CEO Compensation by Company ($M)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={compBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 11 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
                <Tooltip {...tip} formatter={v => [`$${v}M`, 'Total Comp']} />
                <Bar dataKey="comp" name="Total Comp ($M)" radius={[4, 4, 0, 0]}>
                  {compBarData.map((d, i) => (
                    <Cell key={i} fill={d.comp > 20 ? T.red : d.comp > 10 ? T.amber : T.green} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3 — ESG Pay Linkage */}
      {tab === 2 && (
        <div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>ESG Metrics Used in Executive Pay</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Metric', 'Companies Using (%)', 'Avg Bonus Weight (%)', 'Period', '3rd Party Verified (%)'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: T.textSec, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ESG_METRICS.map((r, i) => (
                  <tr key={r.metric} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 ? T.bg + '60' : 'transparent' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.metric}</td>
                    <td style={{ padding: '8px 10px', color: r.adoption > 60 ? T.green : r.adoption > 30 ? T.amber : T.red }}>{r.adoption}%</td>
                    <td style={{ padding: '8px 10px' }}>{r.weight}%</td>
                    <td style={{ padding: '8px 10px', color: T.textSec }}>{r.period}</td>
                    <td style={{ padding: '8px 10px' }}>{r.verified}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>ESG Metric Adoption in Pay (%)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ESG_METRICS.map(d => ({ name: d.metric.split(' ')[0], adoption: d.adoption }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 11 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} domain={[0, 100]} />
                <Tooltip {...tip} formatter={v => [`${v}%`, 'Adoption']} />
                <Bar dataKey="adoption" name="Adoption %" radius={[4, 4, 0, 0]}>
                  {ESG_METRICS.map((d, i) => (
                    <Cell key={i} fill={d.adoption > 60 ? T.green : d.adoption > 30 ? T.amber : ACCENT} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>ESG Pay Linkage Trend — 24 Months (%)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={esgTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill: T.textSec, fontSize: 11 }} interval={3} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} domain={[30, 80]} />
                <Tooltip {...tip} formatter={v => [`${v}%`, 'ESG Linked']} />
                <Line type="monotone" dataKey="linked" stroke={T.green} strokeWidth={2} dot={false} name="ESG Linked %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 4 — Shareholder Voting */}
      {tab === 3 && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <StatCard label="Avg Say-on-Pay Support" value="89%" />
            <StatCard label="Failed Votes" value="3%" />
            <StatCard label="Investor Groups Voting Against (avg)" value="12%" />
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>2024 AGM Say-on-Pay Results</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Company', 'Support %', 'Opposition %', 'Key Concern', 'Outcome'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: T.textSec, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VOTES.map((r, i) => (
                  <tr key={r.name} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 ? T.bg + '60' : 'transparent' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: '8px 10px', color: r.support > 90 ? T.green : r.support > 75 ? T.amber : T.red }}>{r.support}%</td>
                    <td style={{ padding: '8px 10px', color: T.red }}>{r.opposition}%</td>
                    <td style={{ padding: '8px 10px', color: T.textSec }}>{r.concerns}</td>
                    <td style={{ padding: '8px 10px' }}><Badge val={r.outcome} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Say-on-Pay Support % by Company</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={VOTES.map(d => ({ name: d.short, support: d.support }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 11 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} domain={[60, 100]} />
                <Tooltip {...tip} formatter={v => [`${v}%`, 'Support']} />
                <Bar dataKey="support" name="Support %" radius={[4, 4, 0, 0]}>
                  {VOTES.map((d, i) => (
                    <Cell key={i} fill={d.support > 90 ? T.green : d.support > 75 ? T.amber : T.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Proxy Advisor Recommendations</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Company', 'ISS', 'Glass Lewis', 'Outcome'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: T.textSec, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {proxyAdvisors.map((r, i) => (
                  <tr key={r.company} style={{ borderBottom: `1px solid ${T.border}22`, background: i % 2 ? T.bg + '60' : 'transparent' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.company}</td>
                    <td style={{ padding: '8px 10px', color: r.iss === 'For' ? T.green : r.iss === 'Against' ? T.red : T.amber }}>{r.iss}</td>
                    <td style={{ padding: '8px 10px', color: r.gl === 'For' ? T.green : r.gl === 'Against' ? T.red : T.amber }}>{r.gl}</td>
                    <td style={{ padding: '8px 10px' }}><Badge val={r.outcome} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5 — Regulatory Landscape */}
      {tab === 4 && (
        <div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <StatCard label="Mandatory Say-on-Pay Jurisdictions" value="32" />
            <StatCard label="Avg Vote Frequency" value="Annual" />
            <StatCard label="Binding Vote Jurisdictions" value="8" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 14, marginBottom: 24 }}>
            {REGULATIONS.map((r, i) => (
              <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text, flex: 1, marginRight: 8 }}>{r.name}</span>
                  <span style={{ background: ACCENT + '22', color: ACCENT, border: `1px solid ${ACCENT}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{r.jurisdiction}</span>
                </div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}><span style={{ color: T.textMut }}>Disclosure:</span> {r.disclosure}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}><span style={{ color: T.textMut }}>Vote Type:</span> <span style={{ color: r.vote.includes('Binding') ? T.red : T.amber }}>{r.vote}</span></div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}><span style={{ color: T.textMut }}>Penalty:</span> {r.penalty}</div>
                <div style={{ fontSize: 11, color: T.textSec }}><span style={{ color: T.textMut }}>Effective:</span> {r.effective}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Compliance Rate by Jurisdiction (%)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 11 }} />
                <YAxis tick={{ fill: T.textSec, fontSize: 11 }} domain={[50, 100]} />
                <Tooltip {...tip} formatter={v => [`${v}%`, 'Compliance Rate']} />
                <Bar dataKey="rate" name="Compliance %" radius={[4, 4, 0, 0]}>
                  {complianceData.map((d, i) => (
                    <Cell key={i} fill={d.rate >= 90 ? T.green : d.rate >= 75 ? T.amber : T.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
