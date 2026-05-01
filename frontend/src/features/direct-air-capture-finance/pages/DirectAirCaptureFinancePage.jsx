import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ScatterChart, Scatter } from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E', sub: '#6B7280', indigo: '#4F46E5', green: '#065F46', red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', sky: '#0369A1', cdr: '#0D9488' };
const TABS = ['DAC Overview', 'Technology Comparison', 'Project Economics', 'Learning Curves', 'Offtake & Credits', 'Market Intelligence'];

const DAC_TECHS = [
  { id: 'Solid-DAC', name: 'Solid Sorbent DAC', lcoc: 600, capex: 850, elec: 1.8, heat: 0, co2Purity: 99, permanent: true, company: 'Climeworks / Carbon Engineering', maturity: 'Commercial' },
  { id: 'Liquid-DAC', name: 'Liquid Solvent DAC', lcoc: 500, capex: 750, elec: 0.6, heat: 5.5, co2Purity: 98, permanent: true, company: 'Carbon Engineering / 1PointFive', maturity: 'Commercial' },
  { id: 'ESDA', name: 'Electroswing DAC', lcoc: 350, capex: 600, elec: 2.2, heat: 0, co2Purity: 97, permanent: true, company: 'Verdox', maturity: 'Pilot' },
  { id: 'Moisture-Swing', name: 'Moisture-Swing DAC', lcoc: 450, capex: 700, elec: 0.8, heat: 1.5, co2Purity: 95, permanent: true, company: 'Global Thermostat / Skytree', maturity: 'Early Comm.' },
  { id: 'DACCS-Wind', name: 'DAC + Geologic Storage', lcoc: 550, capex: 820, elec: 2.0, heat: 4.0, co2Purity: 99, permanent: true, company: 'Heirloom / Project Bison', maturity: 'Commercial' },
];

const PROJECTS = Array.from({ length: 18 }, (_, i) => {
  const tech = DAC_TECHS[Math.floor(sr(i * 7 + 1) * DAC_TECHS.length)];
  const capKt = parseFloat((0.01 + sr(i * 11 + 2) * 0.49).toFixed(2));
  const country = ['USA', 'Iceland', 'Canada', 'Norway', 'UK', 'UAE', 'Australia', 'Switzerland'][Math.floor(sr(i * 13 + 3) * 8)];
  const status = ['Operating', 'Construction', 'FID', 'Piloting', 'Announced'][Math.floor(sr(i * 17 + 4) * 5)];
  const lcoc = parseFloat((tech.lcoc * (0.88 + sr(i * 19 + 5) * 0.28)).toFixed(0));
  const irr = parseFloat((4 + sr(i * 23 + 6) * 9).toFixed(1));
  const creditPrice = parseFloat((350 + sr(i * 29 + 7) * 450).toFixed(0));
  return { id: i + 1, name: `${country.substring(0, 3)}-${tech.id.substring(0, 6)}-${i + 1}`, tech: tech.id, company: tech.company.split(' / ')[0], country, status, capKt, lcoc, irr, creditPrice, elec: tech.elec };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: '1 1 150px' }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);
const Pill = ({ v }) => {
  const c = { Operating: T.green, Construction: T.sky, FID: T.indigo, Piloting: T.amber, Announced: T.sub, Commercial: T.green, 'Early Comm.': T.sky, Pilot: T.amber }[v] || T.sub;
  return <span style={{ background: c, color: '#fff', fontSize: 10, borderRadius: 12, padding: '2px 8px', fontWeight: 600 }}>{v}</span>;
};

export default function DirectAirCaptureFinancePage() {
  const [tab, setTab] = useState(0);
  const [elecPrice, setElecPrice] = useState(40);
  const [creditPrice, setCreditPrice] = useState(500);
  const [scale, setScale] = useState(1);

  const filtered = useMemo(() => PROJECTS, []);
  const avgLcoc = useMemo(() => filtered.length ? Math.round(filtered.reduce((s, p) => s + p.lcoc, 0) / filtered.length) : 0, [filtered]);
  const totalCap = useMemo(() => filtered.reduce((s, p) => s + p.capKt, 0).toFixed(2), [filtered]);

  const lcocByElec = useMemo(() => [20, 30, 40, 50, 60, 80, 100].map(ep => ({
    elec: ep,
    solidDAC: Math.round(600 + (ep - 40) * DAC_TECHS[0].elec * 8),
    liquidDAC: Math.round(500 + (ep - 40) * DAC_TECHS[1].elec * 8),
    esda: Math.round(350 + (ep - 40) * DAC_TECHS[2].elec * 8),
  })), []);

  const learningCurve = Array.from({ length: 10 }, (_, i) => ({
    year: 2024 + i,
    solidDAC: Math.round(600 * Math.pow(0.85, i)),
    liquidDAC: Math.round(500 * Math.pow(0.87, i)),
    esda: Math.round(350 * Math.pow(0.88, i)),
    target: 200,
  }));

  const revenue = useMemo(() => {
    const creditsPerYear = scale * 1000;
    return {
      creditRevenue: parseFloat((creditsPerYear * creditPrice / 1e6).toFixed(1)),
      elecCost: parseFloat((creditsPerYear * DAC_TECHS[0].elec * elecPrice / 1e6).toFixed(1)),
      margin: parseFloat((creditsPerYear * (creditPrice - DAC_TECHS[0].elec * elecPrice - 200) / 1e6).toFixed(1)),
    };
  }, [scale, creditPrice, elecPrice]);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text }}>
      <div style={{ background: '#0C1A2E', padding: '20px 32px', borderBottom: `3px solid ${T.cdr}` }}>
        <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>EP-EH1 · CDR Finance Suite</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#F1F5F9' }}>Direct Air Capture (DAC) Finance</div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Solid Sorbent · Liquid Solvent · Electroswing · DACCS · 5 Technologies · 18 Projects · LCOC Engine</div>
      </div>
      <div style={{ background: '#0C1A2E', display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid #1E3A5F` }}>
        {TABS.map((t, i) => <button key={t} onClick={() => setTab(i)} style={{ padding: '12px 18px', fontSize: 12, fontWeight: tab === i ? 700 : 400, color: tab === i ? T.cdr : '#94A3B8', background: 'none', border: 'none', borderBottom: tab === i ? `2px solid ${T.cdr}` : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>)}
      </div>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <KpiCard label="Avg LCOC" value={`$${avgLcoc}/tCO₂`} sub="Levelized Cost of CDR" color={T.cdr} />
          <KpiCard label="Pipeline Projects" value={filtered.length} sub={`${totalCap} kt CO₂/yr cap`} color={T.indigo} />
          <KpiCard label="DAC Capacity 2024" value="~0.1 Mt" sub="Global (Climeworks, 1PointFive)" color={T.green} />
          <KpiCard label="IRA §45Q Credit" value="$180/tCO₂" sub="Geological + DACCS" color={T.amber} />
          <KpiCard label="2050 Target (IPCC)" value="5 GtCO₂/yr" sub="CDR needed for 1.5°C" color={T.teal} />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>Elec Price: ${elecPrice}/MWh</span><input type="range" min={10} max={120} value={elecPrice} onChange={e => setElecPrice(+e.target.value)} style={{ width: 100 }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>Credit Price: ${creditPrice}/t</span><input type="range" min={100} max={1000} step={25} value={creditPrice} onChange={e => setCreditPrice(+e.target.value)} style={{ width: 120 }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.sub }}><span>Scale: {scale} kt/yr</span><input type="range" min={0.1} max={10} step={0.1} value={scale} onChange={e => setScale(+e.target.value)} style={{ width: 100 }} /></div>
        </div>

        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>LCOC by Technology ($/tCO₂)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={DAC_TECHS.map(t => ({ name: t.id.split('-')[0], lcoc: t.lcoc, elecCost: Math.round(t.elec * elecPrice), other: t.lcoc - Math.round(t.elec * elecPrice) - 150, capex_ann: 150 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                  <Tooltip formatter={v => [`$${v}/tCO₂`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="capex_ann" name="CAPEX Amort." stackId="a" fill={T.cdr} />
                  <Bar dataKey="elecCost" name="Electricity" stackId="a" fill={T.amber} />
                  <Bar dataKey="other" name="Other Opex" stackId="a" fill={T.sky} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Technology Overview</div>
              {DAC_TECHS.map(t => (
                <div key={t.id} style={{ padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{t.name}</span>
                    <Pill v={t.maturity} />
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: T.sub }}>
                    <span>LCOC: <strong style={{ color: T.cdr }}>${t.lcoc}/t</strong></span>
                    <span>Elec: {t.elec} MWh/t</span>
                    <span>Purity: {t.co2Purity}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{t.company}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>LCOC Sensitivity to Electricity Price</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={lcocByElec}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="elec" tick={{ fontSize: 11 }} unit="$/MWh" />
                  <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                  <Tooltip formatter={v => [`$${v}/tCO₂`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Line dataKey="solidDAC" name="Solid DAC" stroke={T.cdr} strokeWidth={2} dot={false} />
                  <Line dataKey="liquidDAC" name="Liquid DAC" stroke={T.sky} strokeWidth={2} dot={false} />
                  <Line dataKey="esda" name="Electroswing" stroke={T.green} strokeWidth={2} dot={false} />
                  <ReferenceLine x={elecPrice} stroke={T.amber} strokeDasharray="4 2" label={{ value: `$${elecPrice}/MWh`, fontSize: 10 }} />
                  <ReferenceLine y={creditPrice} stroke={T.green} strokeDasharray="4 2" label={{ value: `Credit $${creditPrice}`, fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Project Pipeline</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr style={{ background: '#F8F7F4' }}>
                    {['Project', 'Tech', 'Country', 'Cap kt', 'LCOC $/t', 'IRR %', 'Credit $/t', 'Status'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filtered.slice(0, 12).map((p, i) => (
                      <tr key={p.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 ? '#FAFAF7' : T.card }}>
                        <td style={{ padding: '7px 10px', fontWeight: 500 }}>{p.name}</td>
                        <td style={{ padding: '7px 10px', color: T.sub, fontSize: 10 }}>{p.tech}</td>
                        <td style={{ padding: '7px 10px' }}>{p.country}</td>
                        <td style={{ padding: '7px 10px' }}>{p.capKt}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 600, color: p.lcoc < creditPrice ? T.green : T.red }}>${p.lcoc}</td>
                        <td style={{ padding: '7px 10px', color: p.irr >= 8 ? T.green : T.amber }}>{p.irr}%</td>
                        <td style={{ padding: '7px 10px', color: T.cdr }}>${p.creditPrice}</td>
                        <td style={{ padding: '7px 10px' }}><Pill v={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Unit Economics ({scale} kt/yr, ${elecPrice}/MWh)</div>
              {[['Revenue (credits @ $' + creditPrice + '/t)', `$${revenue.creditRevenue}M/yr`], ['Electricity Cost', `$${revenue.elecCost}M/yr`], ['Other Opex', `$${(scale * 200 / 1000).toFixed(1)}M/yr`], ['Gross Margin', `$${revenue.margin}M/yr`], ['IRA §45Q Credit', `$${(scale * 180 / 1000).toFixed(1)}M/yr`], ['CAPEX', `$${(scale * 850 / 1000).toFixed(1)}M`]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                  <span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, background: revenue.margin > 0 ? '#F0FFF4' : '#FFF1F2', borderRadius: 8, padding: 12, border: `1px solid ${revenue.margin > 0 ? T.green : T.red}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: revenue.margin > 0 ? T.green : T.red }}>
                  {revenue.margin > 0 ? `✓ Profitable at $${creditPrice}/t credit price` : `✗ Unprofitable — need $${Math.round(avgLcoc + 50)}/t credit`}
                </div>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>LCOC vs Credit Price Breakeven</div>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="lcoc" name="LCOC" unit="$/t" tick={{ fontSize: 11 }} label={{ value: 'LCOC ($/tCO₂)', position: 'insideBottom', offset: -8, fontSize: 11 }} />
                  <YAxis dataKey="creditPrice" name="Credit" unit="$/t" tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload && payload[0] ? <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 11 }}><strong>{payload[0].payload.name}</strong><br />LCOC: ${payload[0].payload.lcoc}/t<br />Credit: ${payload[0].payload.creditPrice}/t</div> : null} />
                  <Scatter data={filtered.map(p => ({ lcoc: p.lcoc, creditPrice: p.creditPrice, name: p.name }))} fill={T.cdr} fillOpacity={0.7} />
                  <ReferenceLine stroke={T.green} strokeWidth={2} segment={[{ x: 0, y: 0 }, { x: 1000, y: 1000 }]} strokeDasharray="5 3" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>DAC LCOC Learning Curves</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={learningCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                  <Tooltip formatter={v => [`$${v}/tCO₂`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Line dataKey="solidDAC" name="Solid DAC" stroke={T.cdr} strokeWidth={2} dot={false} />
                  <Line dataKey="liquidDAC" name="Liquid DAC" stroke={T.sky} strokeWidth={2} dot={false} />
                  <Line dataKey="esda" name="Electroswing" stroke={T.green} strokeWidth={2} dot={false} />
                  <ReferenceLine y={200} stroke={T.amber} strokeDasharray="4 2" label={{ value: '$200/t target', fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Global DAC Scale-Up (MtCO₂/yr)</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={[2024, 2026, 2028, 2030, 2035, 2040, 2050].map(yr => ({ year: yr, deployed: parseFloat(Math.min(5000, 0.1 * Math.pow(1.8, yr - 2024)).toFixed(1)), target: parseFloat(Math.min(5000, 0.5 * Math.pow(2, yr - 2024)).toFixed(1)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit=" kt" />
                  <Tooltip formatter={v => [`${v} kt CO₂/yr`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="target" name="NZE Target" fill={T.cdr} stroke={T.cdr} fillOpacity={0.2} />
                  <Area type="monotone" dataKey="deployed" name="Deployed" fill={T.green} stroke={T.green} fillOpacity={0.4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>DAC Credit Buyers & Advance Offtake</div>
              {[{ buyer: 'Microsoft', commitment: '1.5 Mt over 10yr', price: '$500–800/t', standard: 'Isometric / CarbonPlan' }, { buyer: 'Stripe / Frontier', commitment: '$1B advance mkt', price: '$400–1000/t', standard: 'Frontier criteria' }, { buyer: 'Shopify', commitment: 'Undisclosed', price: '$600–900/t', standard: 'Internal + Puro.earth' }, { buyer: 'Swiss Re', commitment: '50 kt', price: '$450–700/t', standard: 'SBTi + Gold Standard' }, { buyer: 'Alphabet', commitment: '0.4 Mt', price: '$520–850/t', standard: 'Isometric' }, { buyer: 'US DoD / ARPA-E', commitment: 'R&D grants', price: 'Subsidized', standard: '§45Q + grants' }].map(b => (
                <div key={b.buyer} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{b.buyer}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: T.sub, marginTop: 3 }}>
                    <span style={{ color: T.green }}>{b.commitment}</span>
                    <span style={{ color: T.cdr }}>{b.price}</span>
                    <span>{b.standard}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>IRA §45Q for DAC</div>
              {[['Credit Amount (DAC+geo)', '$180/tCO₂ (2023+)'], ['Credit Amount (DAC+utiliz.)', '$130/tCO₂'], ['Direct Pay (non-tax equity)', '5yr cash; corp tax payers'], ['Prevailing Wage Req.', 'Full credit requires IRS cert.'], ['Minimum CO₂ purity', '90% from atmosphere'], ['Annual capture threshold', '>1,000 tCO₂/yr (facility)'], ['Sequestration', 'Geologic only for $180'], ['Inflation Adjustment', 'CPI-indexed from 2026']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>DAC Market Intelligence</div>
              {[['Global DAC capacity (2024)', '~0.1 Mt CO₂/yr (Climeworks + 1PointFive)'], ['Orca plant (Iceland)', '4,000 tCO₂/yr, Climeworks'], ['Stratos plant (USA)', '36,000 t/yr, Carbon Engineering/1PointFive'], ['LCOC 2024 range', '$400–1,000/tCO₂ (BNEF)'], ['LCOC 2030 target', '$200–400/tCO₂'], ['LCOC 2050 target', '$100–200/tCO₂ (scenario)'], ['IRA 45Q boost', '+$180/t certainty for US projects'], ['Power share of LCOC', '30–55% of total cost'], ['Permanent storage options', 'Basalt mineralisation, saline aquifers'], ['IPCC AR6 CDR need', '1–10 GtCO₂/yr from tech CDR by 2050']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                  <span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 600, maxWidth: '50%', textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>DAC Investment by Source ($M/yr)</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={[2023, 2025, 2027, 2030, 2033, 2035].map(yr => ({ year: yr, govt: Math.round(200 + (yr - 2023) * 180), private: Math.round(100 + (yr - 2023) * 280), corporate: Math.round(50 + (yr - 2023) * 120) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="$M" />
                  <Tooltip formatter={v => [`$${v}M`]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="govt" name="Government" stackId="a" fill={T.sky} stroke={T.sky} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="private" name="Private" stackId="a" fill={T.cdr} stroke={T.cdr} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="corporate" name="Corporate" stackId="a" fill={T.green} stroke={T.green} fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
