import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E',
  sub: '#6B7280', accent: '#B8860B', indigo: '#4F46E5', green: '#065F46',
  red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E'
};

const MARKETS = ['ERCOT', 'CAISO', 'PJM', 'MISO', 'SPP', 'NYISO', 'ISO-NE'];

const PPA_MARKET_DATA = [
  { market: 'ERCOT', price2020: 18, price2021: 22, price2022: 35, price2023: 32, price2024: 30, solarCF: 0.235, curtailmentRisk: 'High' },
  { market: 'CAISO', price2020: 28, price2021: 30, price2022: 42, price2023: 40, price2024: 38, solarCF: 0.265, curtailmentRisk: 'High' },
  { market: 'PJM',   price2020: 22, price2021: 24, price2022: 38, price2023: 36, price2024: 33, solarCF: 0.175, curtailmentRisk: 'Low' },
  { market: 'MISO',  price2020: 19, price2021: 21, price2022: 32, price2023: 30, price2024: 27, solarCF: 0.190, curtailmentRisk: 'Medium' },
  { market: 'SPP',   price2020: 15, price2021: 18, price2022: 28, price2023: 26, price2024: 24, solarCF: 0.225, curtailmentRisk: 'Medium' },
  { market: 'NYISO', price2020: 30, price2021: 33, price2022: 45, price2023: 42, price2024: 40, solarCF: 0.165, curtailmentRisk: 'Low' },
  { market: 'ISO-NE',price2020: 28, price2021: 30, price2022: 46, price2023: 44, price2024: 42, solarCF: 0.155, curtailmentRisk: 'Low' },
];

const CORPORATE_BUYERS = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: `Corp ${['Technology','Manufacturing','Retail','Finance','Healthcare','Energy'][i % 6]} ${i + 1}`,
  sector: ['Technology','Manufacturing','Retail','Finance','Healthcare','Energy'][i % 6],
  creditRating: ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-'][Math.floor(sr(i * 7) * 10)],
  annualLoadGWh: 50 + Math.round(sr(i * 11) * 950),
  ppaPriceMWh: 30 + parseFloat((sr(i * 13) * 25).toFixed(1)),
  termYr: [10, 12, 15, 20][Math.floor(sr(i * 17) * 4)],
  structure: ['Physical','Virtual (VPPA)','Sleeve','Green Tariff'][Math.floor(sr(i * 19) * 4)],
  market: MARKETS[Math.floor(sr(i * 23) * MARKETS.length)],
  re100: sr(i * 29) > 0.5,
  signed: 2019 + Math.floor(sr(i * 31) * 6),
}));

const PPA_CONTRACTS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  project: `Solar Farm ${String.fromCharCode(65 + i)}`,
  capacityMW: 50 + Math.round(sr(i * 37) * 250),
  market: MARKETS[Math.floor(sr(i * 41) * MARKETS.length)],
  type: ['Fixed Price','Fixed+Escalator','Floor+Collar','Revenue Share'][Math.floor(sr(i * 43) * 4)],
  strikeMWh: 30 + parseFloat((sr(i * 47) * 20).toFixed(1)),
  escalatorPct: sr(i * 53) < 0.5 ? 0 : parseFloat((0.01 + sr(i * 53) * 0.02).toFixed(3)),
  termYr: [10, 15, 20, 25][Math.floor(sr(i * 59) * 4)],
  expiryYear: 2025 + Math.floor(sr(i * 61) * 20),
  buyerRating: ['IG','IG','IG','Sub-IG'][Math.floor(sr(i * 67) * 4)],
  curtailmentPct: parseFloat((sr(i * 71) * 0.12).toFixed(3)),
  annualGWh: parseFloat((50 + sr(i * 73) * 450).toFixed(0)),
}));

const TABS = [
  'PPA Market Overview',
  'PPA Pricing Engine',
  'Revenue Stack Builder',
  'Merchant Price Risk',
  'Basis Risk Analytics',
  'Curtailment Modeling',
  'Corporate PPA Structuring',
  'Offtake Counterparty Risk',
  'Contract Optimization',
  'Portfolio Revenue Analytics',
];

const COLORS = [T.indigo, T.accent, T.green, T.red, T.teal, T.blue, '#7C3AED', '#DB2777', '#D97706', '#059669'];

const fmt = (v, d = 1) => (typeof v === 'number' ? v.toFixed(d) : v);
const fmtM = v => `$${(v / 1).toFixed(1)}M`;

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', minWidth: 140 }}>
      <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: T.sub }}>{sub}</div>}
    </div>
  );
}

// ─── Tab 1 ────────────────────────────────────────────────────────────────────
function Tab1() {
  const volumeData = [
    { year: '2018', gw: 8, solar: 5.2, wind: 2.4, other: 0.4 },
    { year: '2019', gw: 12, solar: 7.8, wind: 3.6, other: 0.6 },
    { year: '2020', gw: 19, solar: 12.4, wind: 5.7, other: 0.9 },
    { year: '2021', gw: 31, solar: 20.2, wind: 9.3, other: 1.5 },
    { year: '2022', gw: 45, solar: 29.3, wind: 13.5, other: 2.2 },
    { year: '2023', gw: 52, solar: 33.8, wind: 15.6, other: 2.6 },
    { year: '2024', gw: 60, solar: 39.0, wind: 18.0, other: 3.0 },
  ];

  const topBuyers = [
    { name: 'Microsoft', gwh: 9800 }, { name: 'Google', gwh: 8200 },
    { name: 'Amazon', gwh: 7600 }, { name: 'Meta', gwh: 4200 }, { name: 'Apple', gwh: 3100 },
  ];

  const priceTrend = PPA_MARKET_DATA.map(m => ({
    market: m.market,
    '2020': m.price2020, '2021': m.price2021, '2022': m.price2022,
    '2023': m.price2023, '2024': m.price2024,
  }));

  const priceByYear = ['2020','2021','2022','2023','2024'].map(yr => {
    const row = { year: yr };
    PPA_MARKET_DATA.forEach(m => { row[m.market] = m[`price${yr}`]; });
    return row;
  });

  const re100 = [
    { year: '2018', companies: 155 }, { year: '2019', companies: 214 },
    { year: '2020', companies: 277 }, { year: '2021', companies: 350 },
    { year: '2022', companies: 407 }, { year: '2023', companies: 446 },
    { year: '2024', companies: 480 },
  ];

  const liquidityData = PPA_MARKET_DATA.map(m => ({
    market: m.market,
    bidAsk: parseFloat((0.5 + sr(MARKETS.indexOf(m.market) * 13) * 2.5).toFixed(2)),
    liquidity: parseFloat((60 + sr(MARKETS.indexOf(m.market) * 17) * 35).toFixed(0)),
  }));

  const mktStats = PPA_MARKET_DATA.map(m => ({
    market: m.market,
    avgTenor: `${10 + Math.floor(sr(MARKETS.indexOf(m.market) * 3) * 10)} yr`,
    avgPrice: `$${m.price2024}/MWh`,
    dealCount: Math.floor(sr(MARKETS.indexOf(m.market) * 7) * 80 + 20),
    solarCF: `${(m.solarCF * 100).toFixed(1)}%`,
    curtailmentRisk: m.curtailmentRisk,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="2024E Global PPA Volume" value="60 GW" sub="+15% YoY" color={T.indigo} />
        <KpiCard label="Solar Share" value="65%" sub="of all PPA volume" color={T.accent} />
        <KpiCard label="Avg PPA Tenor" value="15 yr" sub="market average" color={T.green} />
        <KpiCard label="RE100 Signatories" value="480" sub="companies pledged 100% RE" color={T.teal} />
        <KpiCard label="Avg Solar PPA Price" value="$32/MWh" sub="2024 blended" color={T.blue} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Global Corporate PPA Volume (GW Signed)" sub="Annual renewable capacity contracted by corporates" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" GW" />
              <Tooltip formatter={(v, n) => [`${v} GW`, n]} />
              <Legend />
              <Bar dataKey="solar" name="Solar" stackId="a" fill={T.accent} />
              <Bar dataKey="wind" name="Wind" stackId="a" fill={T.indigo} />
              <Bar dataKey="other" name="Other" stackId="a" fill={T.teal} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Top Corporate PPA Buyers" sub="Cumulative renewable capacity contracted (GWh equivalent)" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topBuyers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={v => [`${v.toLocaleString()} GWh`]} />
              <Bar dataKey="gwh" name="Volume (GWh)" fill={T.indigo} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="PPA Price Trends by Market ($/MWh)" sub="Annual average contracted PPA prices" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={priceByYear}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="$" />
              <Tooltip formatter={v => [`$${v}/MWh`]} />
              <Legend />
              {['ERCOT','CAISO','PJM','MISO','SPP'].map((m, i) => (
                <Line key={m} type="monotone" dataKey={m} stroke={COLORS[i]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="RE100 Signatory Growth" sub="Companies pledging 100% renewable electricity" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={re100}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="companies" name="RE100 Companies" stroke={T.green} fill={T.green} fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Key Market Statistics" sub="2024 summary by ISO/RTO" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              {['Market','Avg Tenor','Avg PPA Price','Deal Count','Solar CF','Curtailment Risk','Bid-Ask Spread','Liquidity Score'].map(h => (
                <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mktStats.map((r, i) => (
              <tr key={r.market} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '6px 10px', fontWeight: 700 }}>{r.market}</td>
                <td style={{ padding: '6px 10px' }}>{r.avgTenor}</td>
                <td style={{ padding: '6px 10px', color: T.indigo, fontWeight: 600 }}>{r.avgPrice}</td>
                <td style={{ padding: '6px 10px' }}>{r.dealCount}</td>
                <td style={{ padding: '6px 10px' }}>{r.solarCF}</td>
                <td style={{ padding: '6px 10px' }}>
                  <span style={{ background: r.curtailmentRisk === 'High' ? '#FEF2F2' : r.curtailmentRisk === 'Medium' ? '#FFFBEB' : '#F0FDF4', color: r.curtailmentRisk === 'High' ? T.red : r.curtailmentRisk === 'Medium' ? T.amber : T.green, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{r.curtailmentRisk}</span>
                </td>
                <td style={{ padding: '6px 10px' }}>${liquidityData[i]?.bidAsk}/MWh</td>
                <td style={{ padding: '6px 10px' }}>{liquidityData[i]?.liquidity}/100</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 2 ────────────────────────────────────────────────────────────────────
function Tab2({ inputs, setInputs }) {
  const mktData = PPA_MARKET_DATA.find(m => m.market === inputs.market) || PPA_MARKET_DATA[0];
  const merchantLMP = mktData.price2024 * (1 + (sr(42) - 0.5) * 0.1);

  const energyRev = (inputs.annualGWh * 1000 * inputs.strikePriceMWh) / 1e6;
  const recRev = (inputs.annualGWh * 1000 * inputs.recPrice) / 1e6;
  const capRev = (inputs.capacityMW * 1000 * inputs.capacityPayment) / 1e6;
  const totalContracted = energyRev + recRev + capRev;
  const merchantRev = (inputs.annualGWh * inputs.merchantPct * 1000 * merchantLMP) / 1e6;
  const totalRev = totalContracted + merchantRev;

  const breakEvenLMP = inputs.strikePriceMWh * (1 - inputs.basisSpreadPct);

  const projection = Array.from({ length: 20 }, (_, yr) => {
    const esc = Math.pow(1 + inputs.escalatorPct, yr);
    const contracted = (inputs.annualGWh * (1 - inputs.merchantPct) * 1000 * inputs.strikePriceMWh * esc) / 1e6;
    const p50lmp = merchantLMP * (1 + yr * 0.02);
    const p90lmp = p50lmp * 0.75;
    const merchant_p50 = (inputs.annualGWh * inputs.merchantPct * 1000 * p50lmp) / 1e6;
    const merchant_p90 = (inputs.annualGWh * inputs.merchantPct * 1000 * p90lmp) / 1e6;
    return {
      year: `Y${yr + 1}`,
      contracted: parseFloat(contracted.toFixed(2)),
      merchant_p50: parseFloat(merchant_p50.toFixed(2)),
      merchant_p90: parseFloat(merchant_p90.toFixed(2)),
      total_p50: parseFloat((contracted + merchant_p50).toFixed(2)),
    };
  });

  const structureComp = [
    { structure: 'Fixed Price', y1: inputs.strikePriceMWh, y5: inputs.strikePriceMWh, y10: inputs.strikePriceMWh, y20: inputs.strikePriceMWh },
    { structure: 'Escalating (2%)', y1: inputs.strikePriceMWh, y5: parseFloat((inputs.strikePriceMWh * Math.pow(1.02, 4)).toFixed(2)), y10: parseFloat((inputs.strikePriceMWh * Math.pow(1.02, 9)).toFixed(2)), y20: parseFloat((inputs.strikePriceMWh * Math.pow(1.02, 19)).toFixed(2)) },
    { structure: 'Floor+Collar', y1: inputs.strikePriceMWh * 0.70, y5: inputs.strikePriceMWh * 0.90, y10: inputs.strikePriceMWh * 1.05, y20: inputs.strikePriceMWh * 1.20 },
    { structure: 'Merchant P50', y1: merchantLMP, y5: merchantLMP * 1.10, y10: merchantLMP * 1.21, y20: merchantLMP * 1.48 },
  ];

  const basisImpact = Array.from({ length: 11 }, (_, i) => {
    const basis = i * 0.025;
    return { basis: `${(basis * 100).toFixed(0)}%`, revenue: parseFloat((energyRev * (1 - basis)).toFixed(2)) };
  });

  const curtailmentImpact = Array.from({ length: 7 }, (_, i) => {
    const curt = i * 0.02;
    return { curtailment: `${(curt * 100).toFixed(0)}%`, lostRev: parseFloat((energyRev * curt).toFixed(2)), netRev: parseFloat((energyRev * (1 - curt)).toFixed(2)) };
  });

  const inputField = (label, key, min, max, step, unit) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.sub, marginBottom: 4 }}>
        <span>{label}</span><span style={{ fontWeight: 700, color: T.text }}>{inputs[key]}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={inputs[key]}
        onChange={e => setInputs(p => ({ ...p, [key]: parseFloat(e.target.value) }))}
        style={{ width: '100%', accentColor: T.indigo }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="PPA Pricing Inputs" />
          {inputField('Capacity (MW)', 'capacityMW', 10, 500, 10, ' MW')}
          {inputField('Annual Production (GWh)', 'annualGWh', 50, 1000, 10, ' GWh')}
          {inputField('Strike Price ($/MWh)', 'strikePriceMWh', 20, 70, 0.5, ' $/MWh')}
          {inputField('Escalator', 'escalatorPct', 0, 0.03, 0.005, ' %')}
          {inputField('Term (years)', 'termYr', 5, 25, 1, ' yr')}
          {inputField('Curtailment Risk', 'curtailmentPct', 0, 0.20, 0.01, ' %')}
          {inputField('Basis Spread', 'basisSpreadPct', 0, 0.30, 0.01, ' %')}
          {inputField('Merchant %', 'merchantPct', 0, 0.50, 0.05, ' %')}
          {inputField('REC Price ($/MWh)', 'recPrice', 0, 15, 0.5, ' $/MWh')}
          {inputField('Capacity Payment ($/kW-yr)', 'capacityPayment', 0, 30, 1, ' $/kW-yr')}
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: 11, color: T.sub }}>Market</label>
            <select value={inputs.market} onChange={e => setInputs(p => ({ ...p, market: e.target.value }))}
              style={{ width: '100%', marginTop: 4, padding: '6px 8px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
              {MARKETS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <KpiCard label="Energy Revenue" value={`$${energyRev.toFixed(1)}M`} sub="$/yr contracted" color={T.indigo} />
            <KpiCard label="REC Revenue" value={`$${recRev.toFixed(2)}M`} sub="green attributes" color={T.green} />
            <KpiCard label="Capacity Revenue" value={`$${capRev.toFixed(2)}M`} sub="capacity market" color={T.teal} />
            <KpiCard label="Merchant Revenue" value={`$${merchantRev.toFixed(2)}M`} sub={`${(inputs.merchantPct*100).toFixed(0)}% uncontracted`} color={T.accent} />
            <KpiCard label="Total Annual Revenue" value={`$${totalRev.toFixed(1)}M`} sub="all sources" color={T.blue} />
            <KpiCard label="Breakeven LMP" value={`$${breakEvenLMP.toFixed(1)}/MWh`} sub="merchant equivalent" color={T.red} />
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <SectionHeader title="20-Year Revenue Projection" sub="Contracted vs Merchant P50/P90 ($/yr, $M)" />
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={projection}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 11 }} unit="M" />
                <Tooltip formatter={v => [`$${v}M`]} />
                <Legend />
                <Line type="monotone" dataKey="contracted" name="Contracted" stroke={T.indigo} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="merchant_p50" name="Merchant P50" stroke={T.accent} strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
                <Line type="monotone" dataKey="merchant_p90" name="Merchant P90" stroke={T.red} strokeWidth={1.5} dot={false} strokeDasharray="2 4" />
                <Line type="monotone" dataKey="total_p50" name="Total P50" stroke={T.green} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <SectionHeader title="Basis Risk Impact on Revenue" />
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={basisImpact}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="basis" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip formatter={v => [`$${v}M`]} />
                  <Line type="monotone" dataKey="revenue" name="Net Revenue" stroke={T.red} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <SectionHeader title="Curtailment Revenue Impact" />
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={curtailmentImpact}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="curtailment" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="M" />
                  <Tooltip formatter={v => [`$${v}M`]} />
                  <Bar dataKey="netRev" name="Net Revenue" fill={T.green} />
                  <Bar dataKey="lostRev" name="Lost Revenue" fill={T.red} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Structure Comparison — PPA Price by Year ($/MWh)" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              {['Structure','Year 1','Year 5','Year 10','Year 20'].map(h => (
                <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {structureComp.map((r, i) => (
              <tr key={r.structure} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '6px 10px', fontWeight: 600 }}>{r.structure}</td>
                <td style={{ padding: '6px 10px' }}>${r.y1.toFixed(2)}</td>
                <td style={{ padding: '6px 10px' }}>${r.y5.toFixed(2)}</td>
                <td style={{ padding: '6px 10px' }}>${r.y10.toFixed(2)}</td>
                <td style={{ padding: '6px 10px', fontWeight: 700, color: T.indigo }}>${r.y20.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 3 ────────────────────────────────────────────────────────────────────
function Tab3({ inputs }) {
  const mktData = PPA_MARKET_DATA.find(m => m.market === inputs.market) || PPA_MARKET_DATA[0];
  const merchantLMP = mktData.price2024;

  const [sliders, setSliders] = useState({
    ppaEnergy: 55, rec: 8, capacity: 7, merchant: 20, ancillary: 5, ira: 5
  });

  const total = Object.values(sliders).reduce((a, b) => a + b, 0);

  const components = [
    { name: 'PPA Energy', key: 'ppaEnergy', color: T.indigo },
    { name: 'REC/Green Attr.', key: 'rec', color: T.green },
    { name: 'Capacity Market', key: 'capacity', color: T.teal },
    { name: 'Merchant', key: 'merchant', color: T.accent },
    { name: 'Ancillary Svc', key: 'ancillary', color: T.blue },
    { name: 'IRA Adder', key: 'ira', color: '#7C3AED' },
  ];

  const baseRev = (inputs.annualGWh * 1000 * inputs.strikePriceMWh) / 1e6;

  const projection20 = Array.from({ length: 20 }, (_, yr) => {
    const esc = Math.pow(1 + inputs.escalatorPct, yr);
    const row = { year: `Y${yr + 1}` };
    components.forEach(c => {
      row[c.name] = parseFloat((baseRev * (sliders[c.key] / 100) * esc).toFixed(2));
    });
    return row;
  });

  const hhi = components.reduce((sum, c) => sum + Math.pow(sliders[c.key] / 100, 2), 0);

  const pieData = components.map(c => ({ name: c.name, value: sliders[c.key], fill: c.color }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Total Base Revenue" value={`$${baseRev.toFixed(1)}M/yr`} sub="before diversification" color={T.indigo} />
        <KpiCard label="Revenue HHI" value={hhi.toFixed(3)} sub="diversification index (lower=better)" color={hhi > 0.3 ? T.red : T.green} />
        <KpiCard label="Fixed Revenue %" value={`${(sliders.ppaEnergy + sliders.rec + sliders.capacity).toFixed(0)}%`} sub="contracted / predictable" color={T.green} />
        <KpiCard label="Variable Revenue %" value={`${(sliders.merchant + sliders.ancillary).toFixed(0)}%`} sub="merchant / market-linked" color={T.amber} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Revenue Component Mix" sub="Adjust sliders to model revenue structure" />
          {components.map(c => (
            <div key={c.key} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: c.color, fontWeight: 600 }}>{c.name}</span>
                <span style={{ color: T.text, fontWeight: 700 }}>{sliders[c.key]}%</span>
              </div>
              <input type="range" min={0} max={80} step={1} value={sliders[c.key]}
                onChange={e => setSliders(p => ({ ...p, [c.key]: parseInt(e.target.value) }))}
                style={{ width: '100%', accentColor: c.color }} />
            </div>
          ))}
          <div style={{ marginTop: 8, padding: '8px', background: total > 100 ? '#FEF2F2' : '#F0FDF4', borderRadius: 6, fontSize: 11, textAlign: 'center', fontWeight: 700, color: total > 100 ? T.red : T.green }}>
            Total: {total}% {total > 100 ? '— Over 100%' : ''}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <SectionHeader title="Revenue Mix (Pie)" />
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={v => [`${v}%`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <SectionHeader title="Revenue at Risk Classification" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {[
                  { label: 'Fixed / Contracted', pct: sliders.ppaEnergy + sliders.rec + sliders.capacity, color: T.green },
                  { label: 'Market-Linked', pct: sliders.merchant, color: T.amber },
                  { label: 'Performance-Based', pct: sliders.ancillary, color: T.blue },
                  { label: 'Policy-Dependent', pct: sliders.ira, color: '#7C3AED' },
                ].map(r => (
                  <div key={r.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                      <span style={{ color: T.sub }}>{r.label}</span>
                      <span style={{ fontWeight: 700, color: r.color }}>{r.pct}%</span>
                    </div>
                    <div style={{ background: T.border, borderRadius: 4, height: 6 }}>
                      <div style={{ background: r.color, width: `${Math.min(r.pct, 100)}%`, height: '100%', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <SectionHeader title="20-Year Stacked Revenue Projection ($M/yr)" sub="With escalation applied" />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={projection20}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 11 }} unit="M" />
                <Tooltip formatter={v => [`$${v}M`]} />
                <Legend />
                {components.map(c => (
                  <Area key={c.key} type="monotone" dataKey={c.name} stackId="1" stroke={c.color} fill={c.color} fillOpacity={0.7} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 4 ────────────────────────────────────────────────────────────────────
function Tab4({ inputs }) {
  const mktData = PPA_MARKET_DATA.find(m => m.market === inputs.market) || PPA_MARKET_DATA[0];
  const basePrice = mktData.price2024;
  const sigma = { ERCOT: 0.35, CAISO: 0.25, PJM: 0.20, MISO: 0.22, SPP: 0.28, NYISO: 0.18, 'ISO-NE': 0.16 }[inputs.market] || 0.25;

  const annualRev = (inputs.annualGWh * inputs.merchantPct * 1000 * basePrice) / 1e6;

  const mcRuns = useMemo(() => Array.from({ length: 60 }, (_, i) => {
    const z = (sr(i * 97) + sr(i * 53) + sr(i * 37) - 1.5) * 1.4;
    const lmp = basePrice * (1 + sigma * z);
    const rev = (inputs.annualGWh * inputs.merchantPct * 1000 * Math.max(0, lmp)) / 1e6;
    return { rev: parseFloat(rev.toFixed(2)), lmp: parseFloat(lmp.toFixed(1)) };
  }), [inputs.market, inputs.annualGWh, inputs.merchantPct]);

  const sorted = [...mcRuns].sort((a, b) => a.rev - b.rev);
  const p10 = sorted[Math.floor(sorted.length * 0.10)]?.rev || 0;
  const p50 = sorted[Math.floor(sorted.length * 0.50)]?.rev || 0;
  const p90 = sorted[Math.floor(sorted.length * 0.90)]?.rev || 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)]?.rev || 0;
  const varRev = annualRev * sigma * 1.645;
  const cvar = p10;

  const histBins = Array.from({ length: 10 }, (_, i) => {
    const lo = p10 + (p99 - p10) * i / 10;
    const hi = p10 + (p99 - p10) * (i + 1) / 10;
    const count = sorted.filter(r => r.rev >= lo && r.rev < hi).length;
    return { bin: `$${lo.toFixed(1)}M`, count };
  });

  const valueFactor = Array.from({ length: 11 }, (_, i) => ({
    penetration: `${i * 5}%`,
    valueFactor: parseFloat((100 - i * 5.5 - sr(i * 7) * 3).toFixed(1)),
  }));

  const negPriceFreq = PPA_MARKET_DATA.map(m => ({
    market: m.market,
    '2021': parseFloat((sr(MARKETS.indexOf(m.market) * 11) * 8 + 1).toFixed(1)),
    '2022': parseFloat((sr(MARKETS.indexOf(m.market) * 13) * 10 + 2).toFixed(1)),
    '2023': parseFloat((sr(MARKETS.indexOf(m.market) * 17) * 9 + 1.5).toFixed(1)),
    '2024': parseFloat((sr(MARKETS.indexOf(m.market) * 19) * 8 + 1).toFixed(1)),
  }));

  const hedgeOptimize = Array.from({ length: 11 }, (_, i) => {
    const hedge = i * 10;
    const portVar = varRev * (1 - hedge / 100 * 0.8);
    return { hedge: `${hedge}%`, var: parseFloat(portVar.toFixed(2)) };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Base Merchant Revenue" value={`$${annualRev.toFixed(2)}M`} sub={`${inputs.market} P50`} color={T.indigo} />
        <KpiCard label="Merchant VaR (95%)" value={`$${varRev.toFixed(2)}M`} sub="annual revenue at risk" color={T.red} />
        <KpiCard label="P10 Revenue" value={`$${p10.toFixed(2)}M`} sub="worst 10th percentile" color={T.red} />
        <KpiCard label="P50 Revenue" value={`$${p50.toFixed(2)}M`} sub="median" color={T.accent} />
        <KpiCard label="P90 Revenue" value={`$${p90.toFixed(2)}M`} sub="90th percentile" color={T.green} />
        <KpiCard label="Market Volatility σ" value={`${(sigma * 100).toFixed(0)}%`} sub={`${inputs.market} annual LMP σ`} color={T.teal} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Merchant Revenue Distribution (Monte Carlo)" sub="60-run simulation using sr() PRNG" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={histBins}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="bin" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" name="Frequency" fill={T.indigo} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Solar Value Factor vs Penetration" sub="Price cannibalization as solar % increases" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={valueFactor}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="penetration" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[40, 105]} />
              <Tooltip formatter={v => [`${v}%`]} />
              <Line type="monotone" dataKey="valueFactor" name="Value Factor" stroke={T.accent} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Hedge Ratio Optimization" sub="% contracted vs portfolio VaR reduction" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={hedgeOptimize}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="hedge" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} unit="M" />
              <Tooltip formatter={v => [`$${v}M`]} />
              <Line type="monotone" dataKey="var" name="Portfolio VaR" stroke={T.red} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Negative Price Frequency (% Solar Hours)" sub="Hours per year with LMP ≤ $0 by market" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                <th style={{ padding: '4px 8px', color: T.sub, textAlign: 'left' }}>Market</th>
                <th style={{ padding: '4px 8px', color: T.sub }}>2021</th>
                <th style={{ padding: '4px 8px', color: T.sub }}>2022</th>
                <th style={{ padding: '4px 8px', color: T.sub }}>2023</th>
                <th style={{ padding: '4px 8px', color: T.sub }}>2024</th>
              </tr>
            </thead>
            <tbody>
              {negPriceFreq.map((r, i) => (
                <tr key={r.market} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                  <td style={{ padding: '4px 8px', fontWeight: 600 }}>{r.market}</td>
                  {['2021','2022','2023','2024'].map(yr => (
                    <td key={yr} style={{ padding: '4px 8px', textAlign: 'center', color: r[yr] > 5 ? T.red : T.text }}>{r[yr]}%</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 5 ────────────────────────────────────────────────────────────────────
function Tab5({ inputs }) {
  const basisData = PPA_MARKET_DATA.map((m, i) => ({
    market: m.market,
    p50Basis: parseFloat((-5 - sr(i * 11) * 15).toFixed(1)),
    p90Basis: parseFloat((-12 - sr(i * 13) * 20).toFixed(1)),
    historicalAvg: parseFloat((-4 - sr(i * 17) * 10).toFixed(1)),
    correlation: parseFloat((0.75 + sr(i * 19) * 0.20).toFixed(2)),
  }));

  const mktData = PPA_MARKET_DATA.find(m => m.market === inputs.market) || PPA_MARKET_DATA[0];
  const mktBasis = basisData.find(b => b.market === inputs.market) || basisData[0];

  const baseRev = (inputs.annualGWh * 1000 * inputs.strikePriceMWh) / 1e6;
  const proxyRev = baseRev * mktBasis.correlation * (1 + mktBasis.p50Basis / 100);
  const basisVar = baseRev * Math.abs(mktBasis.p90Basis - mktBasis.p50Basis) / 100;

  const congestionZones = [
    { zone: 'CAISO SP15', congestionHrs: 312, avgCost: -8.2, risk: 'High' },
    { zone: 'CAISO NP15', congestionHrs: 156, avgCost: -4.1, risk: 'Medium' },
    { zone: 'ERCOT West', congestionHrs: 480, avgCost: -12.5, risk: 'Very High' },
    { zone: 'ERCOT Houston', congestionHrs: 89, avgCost: -2.8, risk: 'Low' },
    { zone: 'PJM PSEG', congestionHrs: 44, avgCost: -1.5, risk: 'Low' },
    { zone: 'MISO Zone 1', congestionHrs: 210, avgCost: -6.3, risk: 'Medium' },
  ];

  const basisDist = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
    basis: parseFloat((mktBasis.historicalAvg + (sr(i * 23) - 0.5) * 8).toFixed(1)),
  }));

  const haircut = Math.abs(mktBasis.p90Basis) + 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="P50 Basis Spread" value={`${mktBasis.p50Basis}%`} sub={`${inputs.market} hub-delivery`} color={T.indigo} />
        <KpiCard label="P90 Basis (Adverse)" value={`${mktBasis.p90Basis}%`} sub="90th percentile adverse" color={T.red} />
        <KpiCard label="Hub Correlation" value={mktBasis.correlation.toFixed(2)} sub="project vs hub LMP" color={T.green} />
        <KpiCard label="Proxy Revenue" value={`$${proxyRev.toFixed(2)}M`} sub="basis-adjusted estimate" color={T.accent} />
        <KpiCard label="Basis VaR (95%)" value={`$${basisVar.toFixed(2)}M`} sub="annual revenue at risk" color={T.red} />
        <KpiCard label="Recommended Haircut" value={`${haircut.toFixed(1)}%`} sub="for underwriting" color={T.amber} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="P50 / P90 Basis Spread by Market (% of hub price)" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={basisData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
              <YAxis dataKey="market" type="category" tick={{ fontSize: 11 }} width={65} />
              <Tooltip formatter={v => [`${v}%`]} />
              <Legend />
              <Bar dataKey="p50Basis" name="P50 Basis" fill={T.indigo} />
              <Bar dataKey="p90Basis" name="P90 Basis (Adverse)" fill={T.red} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Monthly Basis Spread Distribution" sub={`${inputs.market} — delivery point vs hub LMP`} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={basisDist}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={v => [`${v}%`]} />
              <Bar dataKey="basis" name="Basis %" fill={v => v < 0 ? T.red : T.green} radius={[3,3,0,0]}>
                {basisDist.map((entry, i) => (
                  <Cell key={i} fill={entry.basis < -8 ? T.red : entry.basis < -4 ? T.amber : T.green} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Node-Specific Congestion Analysis" sub="Transmission-constrained delivery zones" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              {['Zone','Congestion Hours/yr','Avg LMP Impact ($/MWh)','Risk Level','Annual Revenue Impact'].map(h => (
                <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {congestionZones.map((r, i) => {
              const impact = (r.congestionHrs * Math.abs(r.avgCost) * inputs.capacityMW * 0.3) / 1e6;
              return (
                <tr key={r.zone} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{r.zone}</td>
                  <td style={{ padding: '6px 10px' }}>{r.congestionHrs.toLocaleString()}</td>
                  <td style={{ padding: '6px 10px', color: T.red }}>${r.avgCost}/MWh</td>
                  <td style={{ padding: '6px 10px' }}>
                    <span style={{ background: r.risk === 'Very High' || r.risk === 'High' ? '#FEF2F2' : r.risk === 'Medium' ? '#FFFBEB' : '#F0FDF4', color: r.risk === 'Very High' || r.risk === 'High' ? T.red : r.risk === 'Medium' ? T.amber : T.green, padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{r.risk}</span>
                  </td>
                  <td style={{ padding: '6px 10px', color: T.red, fontWeight: 600 }}>-${impact.toFixed(2)}M</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Proxy Revenue Methodology" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12 }}>
          <div style={{ padding: 12, background: T.bg, borderRadius: 6 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Step 1: Hub Proxy Revenue</div>
            <div style={{ color: T.sub }}>Proxy = Hub_LMP × Reference_Shape</div>
            <div style={{ color: T.indigo, fontWeight: 600, marginTop: 4 }}>${baseRev.toFixed(2)}M</div>
          </div>
          <div style={{ padding: 12, background: T.bg, borderRadius: 6 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Step 2: Apply Correlation Factor</div>
            <div style={{ color: T.sub }}>× Corr({mktBasis.correlation.toFixed(2)}) × (Project σ / Hub σ)</div>
            <div style={{ color: T.indigo, fontWeight: 600, marginTop: 4 }}>${(baseRev * mktBasis.correlation).toFixed(2)}M</div>
          </div>
          <div style={{ padding: 12, background: T.bg, borderRadius: 6 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Step 3: Basis-Adjusted Revenue</div>
            <div style={{ color: T.sub }}>× (1 - Basis {mktBasis.p50Basis}%) × (1 - Curtailment)</div>
            <div style={{ color: T.green, fontWeight: 600, marginTop: 4 }}>${proxyRev.toFixed(2)}M</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 6 ────────────────────────────────────────────────────────────────────
function Tab6({ inputs }) {
  const curtailByMarket = PPA_MARKET_DATA.map((m, i) => ({
    market: m.market,
    economic: parseFloat((sr(i * 11) * 4 + 1).toFixed(1)),
    forced: parseFloat((sr(i * 13) * 6 + 1).toFixed(1)),
    total: parseFloat((sr(i * 11) * 4 + 1 + sr(i * 13) * 6 + 1).toFixed(1)),
  }));

  const curtailByMonth = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => ({
    month: m,
    hours: Math.round(sr(i * 17) * 80 + (i >= 2 && i <= 7 ? 60 : 10)),
  }));

  const curtailedMWh = inputs.annualGWh * inputs.curtailmentPct;
  const revLoss = (curtailedMWh * 1000 * inputs.strikePriceMWh) / 1e6;
  const mktData = PPA_MARKET_DATA.find(m => m.market === inputs.market) || PPA_MARKET_DATA[0];
  const negPriceHrs = Math.round(sr(MARKETS.indexOf(inputs.market) * 7) * 400 + 50);

  const riskScores = PPA_CONTRACTS.map(c => ({
    project: c.project,
    market: c.market,
    curtPct: parseFloat((c.curtailmentPct * 100).toFixed(1)),
    riskScore: Math.round(c.curtailmentPct * 100 * (c.market === 'ERCOT' || c.market === 'CAISO' ? 1.5 : 1)),
  }));

  const strategies = [
    { strategy: 'BESS Pairing (4hr)', curtailReduction: '60%', cost: '$45-65/MWh-stored', npvImpact: '+$8-15M' },
    { strategy: 'Demand Flexibility', curtailReduction: '15%', cost: '$5-12/MWh', npvImpact: '+$2-5M' },
    { strategy: 'Interruptible Agreements', curtailReduction: '20%', cost: '$3-8/MWh', npvImpact: '+$3-6M' },
    { strategy: 'Transmission Upgrades', curtailReduction: '40%', cost: '$80-120/kW', npvImpact: '+$5-12M' },
    { strategy: 'Grid Enhancing Tech', curtailReduction: '25%', cost: '$20-40/kW', npvImpact: '+$4-8M' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Curtailed Production" value={`${curtailedMWh.toFixed(0)} GWh`} sub={`at ${(inputs.curtailmentPct * 100).toFixed(0)}% rate`} color={T.red} />
        <KpiCard label="Annual Revenue Loss" value={`$${revLoss.toFixed(2)}M`} sub="curtailment impact" color={T.red} />
        <KpiCard label="Negative Price Hours" value={`${negPriceHrs} hrs/yr`} sub={`${inputs.market} historical avg`} color={T.amber} />
        <KpiCard label="Economic Curtailment" value={`${curtailByMarket.find(m => m.market === inputs.market)?.economic || 0}%`} sub="LMP < variable cost" color={T.amber} />
        <KpiCard label="Forced Curtailment" value={`${curtailByMarket.find(m => m.market === inputs.market)?.forced || 0}%`} sub="grid operator dispatch" color={T.red} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Curtailment by Market (Economic vs Forced %)" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={curtailByMarket}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="market" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={v => [`${v}%`]} />
              <Legend />
              <Bar dataKey="economic" name="Economic" stackId="a" fill={T.amber} />
              <Bar dataKey="forced" name="Forced" stackId="a" fill={T.red} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Curtailment Hours by Month" sub="Solar generation curtailment seasonality" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={curtailByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="hours" name="Curtailed Hours" fill={T.indigo} radius={[3,3,0,0]}>
                {curtailByMonth.map((entry, i) => (
                  <Cell key={i} fill={entry.hours > 80 ? T.red : entry.hours > 40 ? T.amber : T.indigo} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Anti-Curtailment Strategies" sub="Options to reduce curtailment exposure and recover revenue" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              {['Strategy','Curtailment Reduction','Estimated Cost','NPV Impact'].map(h => (
                <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {strategies.map((r, i) => (
              <tr key={r.strategy} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '6px 10px', fontWeight: 600 }}>{r.strategy}</td>
                <td style={{ padding: '6px 10px', color: T.green, fontWeight: 700 }}>{r.curtailReduction}</td>
                <td style={{ padding: '6px 10px', color: T.sub }}>{r.cost}</td>
                <td style={{ padding: '6px 10px', color: T.indigo, fontWeight: 700 }}>{r.npvImpact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Curtailment Risk Score by Project" sub="Portfolio risk ranking (higher = more curtailment exposure)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
          {[...riskScores].sort((a, b) => b.riskScore - a.riskScore).slice(0, 12).map(r => (
            <div key={r.project} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, width: 100, color: T.sub }}>{r.project}</span>
              <span style={{ fontSize: 10, color: T.sub, width: 50 }}>{r.market}</span>
              <div style={{ flex: 1, background: T.border, borderRadius: 4, height: 8 }}>
                <div style={{ background: r.riskScore > 12 ? T.red : r.riskScore > 7 ? T.amber : T.green, width: `${Math.min(r.riskScore * 5, 100)}%`, height: '100%', borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, width: 30, color: r.riskScore > 12 ? T.red : r.riskScore > 7 ? T.amber : T.green }}>{r.riskScore}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 7 ────────────────────────────────────────────────────────────────────
function Tab7({ inputs }) {
  const structureComparison = [
    { feature: 'Location Match', physical: 'Yes — delivery point', vppa: 'No — additionality basis', greenTariff: 'Market zone' },
    { feature: 'Settlement', physical: 'Energy delivery', vppa: 'Financial swap (Strike-LMP)×MWh', greenTariff: 'Utility bill credit' },
    { feature: 'Basis Risk', physical: 'Delivery point basis', vppa: 'Hub LMP exposure', greenTariff: 'Utility rate risk' },
    { feature: 'Regulatory', physical: 'State utility commission', vppa: 'FERC jurisdiction', greenTariff: 'Utility tariff' },
    { feature: 'Accounting', physical: 'Revenue recognition', vppa: 'Fair value hedge (ASC 815)', greenTariff: 'Operating expense' },
    { feature: 'REC Attribution', physical: 'Bundled delivery', vppa: 'Unbundled (market)', greenTariff: 'Utility-sourced' },
    { feature: 'Credit Req.', physical: 'Delivery guarantee', vppa: 'ISDA/CSA collateral', greenTariff: 'Utility creditworthiness' },
    { feature: 'Additionality', physical: 'High — new supply', vppa: 'High — new supply', greenTariff: 'Low — existing supply' },
  ];

  const mktData = PPA_MARKET_DATA.find(m => m.market === inputs.market) || PPA_MARKET_DATA[0];
  const lmp = mktData.price2024;
  const strike = inputs.strikePriceMWh;
  const refVol = inputs.annualGWh * 1000 * 0.8;

  const vppaSettlement = Array.from({ length: 12 }, (_, i) => {
    const monthLMP = lmp * (1 + (sr(i * 31) - 0.5) * 0.3);
    const settlement = (strike - monthLMP) * refVol / 12 / 1e6;
    const energyRev = monthLMP * refVol / 12 / 1e6;
    const netRev = strike * refVol / 12 / 1e6;
    return {
      month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
      lmp: parseFloat(monthLMP.toFixed(2)),
      settlement: parseFloat(settlement.toFixed(3)),
      energyRev: parseFloat(energyRev.toFixed(3)),
      netRev: parseFloat(netRev.toFixed(3)),
    };
  });

  const timeline = [
    { phase: 'LOI/Term Sheet', duration: '1-2 mo', milestone: 'Commercial terms agreed' },
    { phase: 'Due Diligence', duration: '2-3 mo', milestone: 'Site, permits, grid study' },
    { phase: 'Contract Negotiation', duration: '3-5 mo', milestone: 'PPA/VPPA legal drafting' },
    { phase: 'Credit Approval', duration: '1-2 mo', milestone: 'Internal approvals + LC/guarantee' },
    { phase: 'Board/FID Approval', duration: '1-2 mo', milestone: 'Developer final investment decision' },
    { phase: 'Financial Close', duration: '2-4 mo', milestone: 'Construction financing arranged' },
    { phase: 'Commercial Operation', duration: '12-24 mo', milestone: 'Construction + commissioning' },
  ];

  const checklist = [
    'ISDA Master Agreement (2002 ISDA)',
    'EEI Master Power Purchase & Sale Agreement',
    'Credit Support Annex (CSA)',
    'Parent Guarantee / Letter of Credit',
    'Step-in Rights Agreement',
    'Interconnection Agreement (utility)',
    'REC Transfer Agreement',
    'FERC EQR filing (if applicable)',
    'State RPS compliance documentation',
    'Green-e Energy certification (voluntary)',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="VPPA Strike" value={`$${strike}/MWh`} sub="vs market LMP" color={T.indigo} />
        <KpiCard label="Reference Volume" value={`${(refVol / 1000).toFixed(0)} GWh`} sub="80% of production" color={T.accent} />
        <KpiCard label="Net VPPA Revenue" value={`$${(strike * refVol / 1e9).toFixed(2)}M/yr`} sub="energy + settlement" color={T.green} />
        <KpiCard label="Market LMP" value={`$${lmp}/MWh`} sub={`${inputs.market} 2024 avg`} color={T.blue} />
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Physical PPA vs VPPA vs Green Tariff — Structure Comparison" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              <th style={{ padding: '6px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>Feature</th>
              <th style={{ padding: '6px 10px', textAlign: 'left', color: T.indigo, fontWeight: 700 }}>Physical PPA</th>
              <th style={{ padding: '6px 10px', textAlign: 'left', color: T.green, fontWeight: 700 }}>Virtual (VPPA)</th>
              <th style={{ padding: '6px 10px', textAlign: 'left', color: T.teal, fontWeight: 700 }}>Green Tariff</th>
            </tr>
          </thead>
          <tbody>
            {structureComparison.map((r, i) => (
              <tr key={r.feature} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '6px 10px', fontWeight: 600, color: T.sub }}>{r.feature}</td>
                <td style={{ padding: '6px 10px' }}>{r.physical}</td>
                <td style={{ padding: '6px 10px' }}>{r.vppa}</td>
                <td style={{ padding: '6px 10px' }}>{r.greenTariff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="VPPA Monthly Settlement ($M)" sub="Settlement = (Strike - LMP) × Reference Volume" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={vppaSettlement}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} unit="M" />
              <Tooltip formatter={v => [`$${v}M`]} />
              <Legend />
              <Bar dataKey="energyRev" name="Energy Revenue" stackId="a" fill={T.indigo} />
              <Bar dataKey="settlement" name="VPPA Settlement" stackId="a" fill={v => v >= 0 ? T.green : T.red}>
                {vppaSettlement.map((entry, i) => (
                  <Cell key={i} fill={entry.settlement >= 0 ? T.green : T.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Corporate PPA Deal Timeline" sub="Typical 6-18 month process from LOI to COD" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {timeline.map((t, i) => (
              <div key={t.phase} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 20, height: 20, background: T.indigo, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{t.phase} <span style={{ color: T.accent, fontWeight: 400 }}>({t.duration})</span></div>
                  <div style={{ fontSize: 11, color: T.sub }}>{t.milestone}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Corporate PPA Legal Checklist" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {checklist.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
              <span style={{ color: T.green, fontWeight: 700 }}>✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 8 ────────────────────────────────────────────────────────────────────
function Tab8() {
  const pdByRating = [
    { rating: 'AAA', pd: 0.01, lgd: 60 },
    { rating: 'AA', pd: 0.02, lgd: 62 },
    { rating: 'A', pd: 0.05, lgd: 63 },
    { rating: 'BBB', pd: 0.22, lgd: 65 },
    { rating: 'BB', pd: 0.90, lgd: 70 },
    { rating: 'B', pd: 3.50, lgd: 75 },
    { rating: 'CCC', pd: 12.0, lgd: 80 },
  ];

  const creditEnhancement = [
    { type: 'Letter of Credit (LC)', cost: '0.5-1.5%/yr', reduces: 'Counterparty default', when: 'Sub-IG buyers' },
    { type: 'Parent Guarantee', cost: '0.1-0.3%/yr', reduces: 'Subsidiary default', when: 'SPV structures' },
    { type: 'Escrow Account', cost: '0.2-0.5%/yr', reduces: 'Payment delay', when: 'Project finance' },
    { type: 'Step-in Rights', cost: 'Legal fee only', reduces: 'Project default', when: 'Lender requirement' },
    { type: 'Revenue Waterfall', cost: 'Structural', reduces: 'Subordination risk', when: 'Multi-offtaker' },
  ];

  const concentrationData = PPA_CONTRACTS.slice(0, 8).map((c, i) => ({
    buyer: `Buyer ${i + 1}`,
    revShare: parseFloat((sr(i * 23) * 20 + 5).toFixed(1)),
  }));
  const totalRev = concentrationData.reduce((sum, d) => sum + d.revShare, 0);
  const normConc = concentrationData.map(d => ({ ...d, revShare: parseFloat((d.revShare / totalRev * 100).toFixed(1)) }));
  const hhiConc = normConc.reduce((sum, d) => sum + Math.pow(d.revShare / 100, 2), 0);

  const maxConc = Math.max(...normConc.map(d => d.revShare));

  const watchList = CORPORATE_BUYERS.filter(b => ['BB+','BB','BB-','B+','B','B-','CCC'].includes(b.creditRating)).slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Portfolio HHI (Conc.)" value={hhiConc.toFixed(3)} sub="revenue concentration" color={hhiConc > 0.25 ? T.red : T.green} />
        <KpiCard label="Max Single Offtaker" value={`${maxConc.toFixed(1)}%`} sub="of portfolio revenue" color={maxConc > 30 ? T.red : T.amber} />
        <KpiCard label="IG Counterparties" value={`${CORPORATE_BUYERS.filter(b => ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-'].includes(b.creditRating)).length}`} sub="of 30 buyers" color={T.green} />
        <KpiCard label="Sub-IG Counterparties" value={`${CORPORATE_BUYERS.filter(b => !['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-'].includes(b.creditRating)).length}`} sub="elevated default risk" color={T.red} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Probability of Default by Rating" sub="S&P annual PD (%) and LGD assumption" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Rating','Annual PD (%)','LGD (%)','20yr Cumulative PD'].map(h => (
                  <th key={h} style={{ padding: '5px 8px', color: T.sub, textAlign: 'left', fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pdByRating.map((r, i) => {
                const cum20 = parseFloat((100 * (1 - Math.pow(1 - r.pd / 100, 20))).toFixed(1));
                return (
                  <tr key={r.rating} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                    <td style={{ padding: '5px 8px', fontWeight: 700 }}>{r.rating}</td>
                    <td style={{ padding: '5px 8px', color: r.pd > 1 ? T.red : T.text }}>{r.pd}%</td>
                    <td style={{ padding: '5px 8px' }}>{r.lgd}%</td>
                    <td style={{ padding: '5px 8px', color: cum20 > 10 ? T.red : T.text, fontWeight: cum20 > 10 ? 700 : 400 }}>{cum20}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Counterparty Revenue Concentration" sub="% of total portfolio revenue per offtaker" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={normConc} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
              <YAxis dataKey="buyer" type="category" tick={{ fontSize: 10 }} width={55} />
              <Tooltip formatter={v => [`${v}%`]} />
              <Bar dataKey="revShare" name="Revenue %" fill={T.indigo} radius={[0,4,4,0]}>
                {normConc.map((entry, i) => (
                  <Cell key={i} fill={entry.revShare > 25 ? T.red : entry.revShare > 15 ? T.amber : T.indigo} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Credit Enhancement Options" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              {['Enhancement Type','Annual Cost','Risk Reduced','Typical Use Case'].map(h => (
                <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {creditEnhancement.map((r, i) => (
              <tr key={r.type} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '6px 10px', fontWeight: 600 }}>{r.type}</td>
                <td style={{ padding: '6px 10px', color: T.accent }}>{r.cost}</td>
                <td style={{ padding: '6px 10px', color: T.green }}>{r.reduces}</td>
                <td style={{ padding: '6px 10px', color: T.sub }}>{r.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Buyer Watch List — Sub-IG with Rating Review Risk" sub="Elevated monitoring required" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['Buyer','Sector','Rating','Annual Load (GWh)','PPA Price','Term','Action Required'].map(h => (
                <th key={h} style={{ padding: '5px 8px', color: T.sub, textAlign: 'left', fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {watchList.map((b, i) => (
              <tr key={b.id} style={{ background: i % 2 === 0 ? '#FFF7F7' : T.card }}>
                <td style={{ padding: '5px 8px', fontWeight: 600 }}>{b.name}</td>
                <td style={{ padding: '5px 8px', color: T.sub }}>{b.sector}</td>
                <td style={{ padding: '5px 8px', color: T.red, fontWeight: 700 }}>{b.creditRating}</td>
                <td style={{ padding: '5px 8px' }}>{b.annualLoadGWh}</td>
                <td style={{ padding: '5px 8px' }}>${b.ppaPriceMWh}/MWh</td>
                <td style={{ padding: '5px 8px' }}>{b.termYr} yr</td>
                <td style={{ padding: '5px 8px', color: T.red }}>Request LC / Guarantee</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 9 ────────────────────────────────────────────────────────────────────
function Tab9({ inputs }) {
  const irrByTerm = [5, 10, 15, 20, 25].map(term => {
    const baseIrr = 8 + term * 0.3 - Math.pow(term - 15, 2) * 0.05;
    return { term: `${term} yr`, irr: parseFloat(baseIrr.toFixed(1)) };
  });

  const escalatorComp = Array.from({ length: 20 }, (_, yr) => ({
    year: `Y${yr + 1}`,
    fixed: parseFloat((inputs.strikePriceMWh * inputs.annualGWh * 1000 / 1e6).toFixed(2)),
    esc1pct: parseFloat((inputs.strikePriceMWh * Math.pow(1.01, yr) * inputs.annualGWh * 1000 / 1e6).toFixed(2)),
    esc2pct: parseFloat((inputs.strikePriceMWh * Math.pow(1.02, yr) * inputs.annualGWh * 1000 / 1e6).toFixed(2)),
  }));

  const collarSims = Array.from({ length: 24 }, (_, i) => {
    const lmp = inputs.strikePriceMWh * (0.6 + sr(i * 37) * 0.9);
    const floor = inputs.strikePriceMWh * 0.70;
    const cap = inputs.strikePriceMWh * 1.30;
    const collarRev = Math.max(floor, Math.min(cap, lmp));
    return {
      period: `M${i + 1}`,
      lmp: parseFloat(lmp.toFixed(1)),
      collarRev: parseFloat(collarRev.toFixed(1)),
      fixedRev: inputs.strikePriceMWh,
    };
  });

  const wale = PPA_CONTRACTS.reduce((sum, c) => sum + c.annualGWh * (c.expiryYear - 2025), 0) /
    (PPA_CONTRACTS.reduce((sum, c) => sum + c.annualGWh, 0) || 1);

  const expiryWaterfall = Array.from({ length: 10 }, (_, yr) => {
    const year = 2025 + yr;
    const expiring = PPA_CONTRACTS.filter(c => c.expiryYear === year);
    const expiringGWh = expiring.reduce((s, c) => s + parseFloat(c.annualGWh), 0);
    const contracted = PPA_CONTRACTS.filter(c => c.expiryYear > year).reduce((s, c) => s + parseFloat(c.annualGWh), 0);
    return { year: `${year}`, contracted: parseFloat(contracted.toFixed(0)), expiring: parseFloat(expiringGWh.toFixed(0)) };
  });

  const renewalProb = [
    { type: 'Utility offtaker', prob: 85 }, { type: 'Corporate buyer', prob: 70 },
    { type: 'Financial buyer', prob: 60 }, { type: 'Merchant', prob: 100 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Portfolio WALE" value={`${wale.toFixed(1)} yr`} sub="weighted avg contract life" color={T.indigo} />
        <KpiCard label="Optimal PPA Term" value="15 yr" sub="highest risk-adj IRR" color={T.green} />
        <KpiCard label="Floor Protection" value={`$${(inputs.strikePriceMWh * 0.70).toFixed(1)}/MWh`} sub="70% of strike" color={T.teal} />
        <KpiCard label="Collar Cap" value={`$${(inputs.strikePriceMWh * 1.30).toFixed(1)}/MWh`} sub="130% of strike" color={T.accent} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="PPA Term vs Project IRR" sub="Optimal term balances price premium vs re-contracting risk" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={irrByTerm}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="term" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[6, 14]} />
              <Tooltip formatter={v => [`${v}%`]} />
              <Bar dataKey="irr" name="Project IRR" fill={T.indigo} radius={[4,4,0,0]}>
                {irrByTerm.map((entry, i) => (
                  <Cell key={i} fill={entry.irr === Math.max(...irrByTerm.map(d => d.irr)) ? T.green : T.indigo} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Floor + Collar Revenue vs LMP" sub="Downside floor at 70%, cap at 130% of strike" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={collarSims}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="period" tick={{ fontSize: 9 }} interval={3} />
              <YAxis tick={{ fontSize: 11 }} unit="$" />
              <Tooltip formatter={v => [`$${v}/MWh`]} />
              <Legend />
              <Line type="monotone" dataKey="lmp" name="Market LMP" stroke={T.sub} strokeWidth={1} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="collarRev" name="Collar Revenue" stroke={T.green} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="fixedRev" name="Fixed Strike" stroke={T.indigo} strokeWidth={1.5} dot={false} strokeDasharray="2 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Fixed vs Escalating Revenue ($/yr, $M)" sub="20-year cumulative comparison" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={escalatorComp}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 9 }} interval={3} />
              <YAxis tick={{ fontSize: 11 }} unit="M" />
              <Tooltip formatter={v => [`$${v}M`]} />
              <Legend />
              <Line type="monotone" dataKey="fixed" name="Fixed Price" stroke={T.indigo} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="esc1pct" name="1% Escalator" stroke={T.accent} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="esc2pct" name="2% Escalator" stroke={T.green} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="PPA Expiry Waterfall" sub="GWh going merchant each year (2025-2034)" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={expiryWaterfall}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} unit="GWh" />
              <Tooltip />
              <Legend />
              <Bar dataKey="contracted" name="Contracted" stackId="a" fill={T.indigo} />
              <Bar dataKey="expiring" name="Going Merchant" stackId="a" fill={T.red} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Renewal Probability by Offtaker Type" />
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {renewalProb.map(r => (
            <div key={r.type} style={{ minWidth: 160 }}>
              <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>{r.type}</div>
              <div style={{ background: T.border, borderRadius: 6, height: 10, marginBottom: 4 }}>
                <div style={{ background: r.prob > 80 ? T.green : r.prob > 65 ? T.accent : T.red, width: `${r.prob}%`, height: '100%', borderRadius: 6 }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.indigo }}>{r.prob}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 10 ───────────────────────────────────────────────────────────────────
function Tab10({ inputs }) {
  const byType = ['Fixed Price', 'Fixed+Escalator', 'Floor+Collar', 'Revenue Share'].map((type, i) => {
    const contracts = PPA_CONTRACTS.filter(c => c.type === type);
    const totalGWh = contracts.reduce((sum, c) => sum + parseFloat(c.annualGWh), 0);
    const avgStrike = contracts.length ? contracts.reduce((sum, c) => sum + c.strikeMWh, 0) / contracts.length : 0;
    const rev = (totalGWh * 1000 * avgStrike) / 1e6;
    return { type, contracts: contracts.length, totalGWh: parseFloat(totalGWh.toFixed(0)), avgStrike: parseFloat(avgStrike.toFixed(1)), rev: parseFloat(rev.toFixed(2)) };
  });

  const pieContracts = byType.map((d, i) => ({ name: d.type, value: d.rev, fill: COLORS[i] }));
  const totalPortRev = byType.reduce((s, d) => s + d.rev, 0);
  const hhi = byType.reduce((s, d) => s + Math.pow(d.rev / (totalPortRev || 1), 2), 0);

  const wale = PPA_CONTRACTS.reduce((sum, c) => sum + parseFloat(c.annualGWh) * Math.max(0, c.expiryYear - 2025), 0) /
    (PPA_CONTRACTS.reduce((sum, c) => sum + parseFloat(c.annualGWh), 0) || 1);

  const revBridge = [
    { item: 'Prior Year Revenue', value: parseFloat((totalPortRev * 0.95).toFixed(2)), type: 'base' },
    { item: 'New Contracts', value: parseFloat((totalPortRev * 0.08).toFixed(2)), type: 'positive' },
    { item: 'Expiries / Expirations', value: parseFloat((-totalPortRev * 0.04).toFixed(2)), type: 'negative' },
    { item: 'Price Escalation', value: parseFloat((totalPortRev * 0.02).toFixed(2)), type: 'positive' },
    { item: 'Production Degradation', value: parseFloat((-totalPortRev * 0.005).toFixed(2)), type: 'negative' },
    { item: 'Curtailment Change', value: parseFloat((-totalPortRev * 0.01).toFixed(2)), type: 'negative' },
    { item: 'Current Year Revenue', value: parseFloat(totalPortRev.toFixed(2)), type: 'total' },
  ];

  const stressedRev = totalPortRev * (1 - 0.10) * (1 - 0.15) * (1 - 0.02);

  const recos = [
    { action: 'Extend 3 short-tenor contracts', impact: '+$12M NPV', priority: 'High' },
    { action: 'Add escalator to 2 fixed-price contracts', impact: '+$6M NPV', priority: 'High' },
    { action: 'Re-contract expiring ERCOT capacity', impact: '+$18M NPV', priority: 'Medium' },
    { action: 'Diversify into PJM/NYISO markets', impact: 'Lower basis VaR', priority: 'Medium' },
    { action: 'Add BESS to top 3 curtailment sites', impact: '+$9M NPV', priority: 'Low' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Total Portfolio Revenue" value={`$${totalPortRev.toFixed(1)}M/yr`} sub={`${PPA_CONTRACTS.length} active contracts`} color={T.indigo} />
        <KpiCard label="Revenue HHI" value={hhi.toFixed(3)} sub="by contract type" color={hhi > 0.3 ? T.red : T.green} />
        <KpiCard label="Portfolio WALE" value={`${wale.toFixed(1)} yr`} sub="weighted avg life" color={T.accent} />
        <KpiCard label="Stressed Revenue" value={`$${stressedRev.toFixed(1)}M`} sub="10% curt + 15% basis + 2 defaults" color={T.red} />
        <KpiCard label="Revenue at Risk" value={`$${(totalPortRev - stressedRev).toFixed(1)}M`} sub="stress scenario loss" color={T.red} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Revenue by Contract Type ($M/yr)" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieContracts} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, value }) => `${name.split('+')[0]}: $${value.toFixed(1)}M`} labelLine={false}>
                {pieContracts.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip formatter={v => [`$${v.toFixed(2)}M`]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Revenue Bridge (Year-over-Year)" sub="Key drivers of revenue change" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revBridge} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10 }} unit="M" />
              <YAxis dataKey="item" type="category" tick={{ fontSize: 9 }} width={130} />
              <Tooltip formatter={v => [`$${v}M`]} />
              <Bar dataKey="value" name="$M" radius={[0,4,4,0]}>
                {revBridge.map((entry, i) => (
                  <Cell key={i} fill={entry.type === 'positive' ? T.green : entry.type === 'negative' ? T.red : entry.type === 'total' ? T.indigo : T.sub} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="PPA Portfolio Contract Summary (20 Contracts)" />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Project','Capacity (MW)','Market','Type','Strike ($/MWh)','Escalator','Term (yr)','Expiry','Buyer Rating','Annual GWh','Annual Rev ($M)'].map(h => (
                  <th key={h} style={{ padding: '5px 8px', color: T.sub, fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PPA_CONTRACTS.map((c, i) => {
                const rev = (parseFloat(c.annualGWh) * 1000 * c.strikeMWh) / 1e6;
                return (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '5px 8px', fontWeight: 600 }}>{c.project}</td>
                    <td style={{ padding: '5px 8px' }}>{c.capacityMW}</td>
                    <td style={{ padding: '5px 8px' }}>{c.market}</td>
                    <td style={{ padding: '5px 8px', fontSize: 10 }}>{c.type}</td>
                    <td style={{ padding: '5px 8px', color: T.indigo, fontWeight: 600 }}>${c.strikeMWh}</td>
                    <td style={{ padding: '5px 8px' }}>{c.escalatorPct > 0 ? `${(c.escalatorPct * 100).toFixed(1)}%` : '—'}</td>
                    <td style={{ padding: '5px 8px' }}>{c.termYr}</td>
                    <td style={{ padding: '5px 8px' }}>{c.expiryYear}</td>
                    <td style={{ padding: '5px 8px' }}>
                      <span style={{ background: c.buyerRating === 'IG' ? '#F0FDF4' : '#FEF2F2', color: c.buyerRating === 'IG' ? T.green : T.red, padding: '1px 6px', borderRadius: 3, fontSize: 10 }}>{c.buyerRating}</span>
                    </td>
                    <td style={{ padding: '5px 8px' }}>{c.annualGWh}</td>
                    <td style={{ padding: '5px 8px', fontWeight: 700, color: T.indigo }}>${rev.toFixed(1)}M</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionHeader title="Revenue Optimization Recommendations" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['Recommended Action','Revenue Impact','Priority'].map(h => (
                <th key={h} style={{ padding: '6px 10px', color: T.sub, fontWeight: 600, textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recos.map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '6px 10px' }}>{r.action}</td>
                <td style={{ padding: '6px 10px', color: T.green, fontWeight: 700 }}>{r.impact}</td>
                <td style={{ padding: '6px 10px' }}>
                  <span style={{ background: r.priority === 'High' ? '#FEF2F2' : r.priority === 'Medium' ? '#FFFBEB' : T.bg, color: r.priority === 'High' ? T.red : r.priority === 'Medium' ? T.amber : T.sub, padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{r.priority}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PPA Glossary & Methodology Panel ─────────────────────────────────────────
function GlossaryPanel() {
  const terms = [
    { term: 'LMP', full: 'Locational Marginal Price', definition: 'Wholesale electricity price at a specific node; sum of energy, congestion, and loss components.' },
    { term: 'VPPA', full: 'Virtual Power Purchase Agreement', definition: 'Financial contract (CFD) where settlement = (Strike - LMP) × Reference MWh. No physical energy delivery.' },
    { term: 'Basis Risk', full: 'Hub-to-Delivery Basis Risk', definition: 'Difference between hub LMP and delivery node LMP. Can reduce project revenue by 5-20%.' },
    { term: 'P50 / P90', full: 'Exceedance Probability', definition: 'P50 = median expected production. P90 = production exceeded 90% of years (conservative underwriting).' },
    { term: 'Value Factor', full: 'Solar Value Factor', definition: 'Ratio of solar-weighted average LMP to flat average LMP. Declines as solar penetration grows (cannibalization).' },
    { term: 'WALE', full: 'Weighted Average Lease Expiry', definition: 'Portfolio average contract duration weighted by revenue (GWh × price).' },
    { term: 'ECL', full: 'Expected Credit Loss', definition: 'ECL = PD × LGD × EAD. Regulatory metric for counterparty credit risk in PPA portfolios.' },
    { term: 'Proxy Revenue', full: 'Independent Engineer Proxy', definition: 'Revenue estimate using independent LMP data × reference production shape — free of project-specific data.' },
    { term: 'HHI', full: 'Herfindahl-Hirschman Index', definition: 'Sum of squared market shares. HHI < 0.15 = diversified; 0.15-0.25 = moderate; > 0.25 = concentrated.' },
    { term: 'Shape Premium', full: 'Generation Profile Premium/Discount', definition: 'Adjustment for solar/wind generation being coincident with low-price hours vs flat block power.' },
    { term: 'REC', full: 'Renewable Energy Certificate', definition: '1 REC = 1 MWh of renewable generation. Used for voluntary and compliance renewable claims.' },
    { term: 'Curtailment', full: 'Economic / Forced Curtailment', definition: 'Economic: project voluntarily curtails when LMP < 0. Forced: grid operator dispatch curtailment.' },
  ];

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
      <SectionHeader title="PPA & Revenue Analytics Glossary" sub="Key terms and methodology definitions" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {terms.map(t => (
          <div key={t.term} style={{ padding: '10px 12px', background: T.bg, borderRadius: 6, borderLeft: `3px solid ${T.indigo}` }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 3 }}>
              <span style={{ fontWeight: 800, color: T.indigo, fontSize: 12 }}>{t.term}</span>
              <span style={{ fontSize: 11, color: T.sub }}>{t.full}</span>
            </div>
            <div style={{ fontSize: 11, color: T.text, lineHeight: 1.5 }}>{t.definition}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Market Forward Curves Panel ───────────────────────────────────────────────
function ForwardCurvesPanel({ inputs }) {
  const mktData = PPA_MARKET_DATA.find(m => m.market === inputs.market) || PPA_MARKET_DATA[0];
  const basePrice = mktData.price2024;

  const forwardCurve = Array.from({ length: 10 }, (_, i) => {
    const yr = 2025 + i;
    const forward = basePrice * (1 + i * 0.015 + (sr(i * 43) - 0.5) * 0.04);
    const p90 = forward * (1 - 0.15 - sr(i * 47) * 0.05);
    const p10 = forward * (1 + 0.15 + sr(i * 53) * 0.05);
    return {
      year: `${yr}`,
      forward: parseFloat(forward.toFixed(2)),
      p90: parseFloat(p90.toFixed(2)),
      p10: parseFloat(p10.toFixed(2)),
      ppaStrike: inputs.strikePriceMWh * Math.pow(1 + inputs.escalatorPct, i),
    };
  });

  const marketVolatility = PPA_MARKET_DATA.map((m, i) => ({
    market: m.market,
    annualVol: parseFloat((15 + sr(i * 31) * 20).toFixed(1)),
    dailyVol: parseFloat((2 + sr(i * 37) * 4).toFixed(1)),
    spike95pct: parseFloat((m.price2024 * (1 + 0.35 + sr(i * 41) * 0.40)).toFixed(1)),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title={`${inputs.market} LMP Forward Curve (2025-2034)`} sub="Market consensus forward with P10/P90 band vs PPA strike" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={forwardCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} unit="$" />
              <Tooltip formatter={v => [`$${parseFloat(v).toFixed(1)}/MWh`]} />
              <Legend />
              <Line type="monotone" dataKey="p10" name="P10 (High)" stroke={T.green} strokeWidth={1} strokeDasharray="3 3" dot={false} />
              <Line type="monotone" dataKey="forward" name="P50 Forward" stroke={T.indigo} strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="p90" name="P90 (Low)" stroke={T.red} strokeWidth={1} strokeDasharray="3 3" dot={false} />
              <Line type="monotone" dataKey="ppaStrike" name="PPA Strike" stroke={T.accent} strokeWidth={2} dot={false} strokeDasharray="6 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionHeader title="Market Price Volatility Profile" sub="Annual σ, daily σ, and 95th pct spike by ISO/RTO" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Market','Annual Vol (%)','Daily Vol (%)','95th Pct Spike ($/MWh)'].map(h => (
                  <th key={h} style={{ padding: '5px 8px', color: T.sub, fontWeight: 600, textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {marketVolatility.map((m, i) => (
                <tr key={m.market} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                  <td style={{ padding: '5px 8px', fontWeight: m.market === inputs.market ? 700 : 400, color: m.market === inputs.market ? T.indigo : T.text }}>{m.market}</td>
                  <td style={{ padding: '5px 8px', color: m.annualVol > 25 ? T.red : T.text }}>{m.annualVol}%</td>
                  <td style={{ padding: '5px 8px' }}>{m.dailyVol}%</td>
                  <td style={{ padding: '5px 8px', color: T.amber }}>${m.spike95pct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── IRA Adder Calculator ─────────────────────────────────────────────────────
function IRAAdderPanel({ inputs }) {
  const [iraInputs, setIraInputs] = useState({
    domesticContent: true,
    energyCommunity: false,
    lowIncome: false,
    ptcVsItc: 'PTC',
  });

  const ptcBase = 0.030; // $/kWh base PTC 2024
  const ptcMultiplier = (iraInputs.domesticContent ? 1.1 : 1.0) * (iraInputs.energyCommunity ? 1.1 : 1.0) * (iraInputs.lowIncome ? 1.2 : 1.0);
  const effectivePTC = ptcBase * ptcMultiplier;
  const annualPTCValue = (inputs.annualGWh * 1000 * effectivePTC) / 1e6;

  const itcBase = 0.30; // 30% base ITC
  const itcMultiplier = (iraInputs.domesticContent ? 1.10 : 1.0) * (iraInputs.energyCommunity ? 1.10 : 1.0) * (iraInputs.lowIncome ? 1.20 : 1.0);
  const effectiveITC = Math.min(itcBase * itcMultiplier, 0.70);
  const assumedCapex = inputs.capacityMW * 1.1e6; // $1.1M/MW
  const itcValue = assumedCapex * effectiveITC / 1e6;

  const adderRows = [
    { adder: 'Base PTC/ITC', value: iraInputs.ptcVsItc === 'PTC' ? `$${(ptcBase * 1000).toFixed(0)}/MWh` : '30%', type: 'base' },
    { adder: 'Domestic Content Bonus', value: iraInputs.domesticContent ? '+10%' : 'Not applicable', type: iraInputs.domesticContent ? 'active' : 'inactive' },
    { adder: 'Energy Community Bonus', value: iraInputs.energyCommunity ? '+10%' : 'Not applicable', type: iraInputs.energyCommunity ? 'active' : 'inactive' },
    { adder: 'Low-Income Bonus (ITC only)', value: iraInputs.lowIncome ? '+20%' : 'Not applicable', type: iraInputs.lowIncome ? 'active' : 'inactive' },
    { adder: 'Effective Tax Credit', value: iraInputs.ptcVsItc === 'PTC' ? `$${(effectivePTC * 1000).toFixed(1)}/MWh` : `${(effectiveITC * 100).toFixed(0)}%`, type: 'total' },
    { adder: '10-Year PTC Value', value: `$${(annualPTCValue * 10).toFixed(1)}M NPV`, type: 'total' },
  ];

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
      <SectionHeader title="IRA Tax Credit Adder Calculator" sub="Inflation Reduction Act — PTC/ITC bonus stacking analysis" />
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        <div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Tax Credit Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['PTC','ITC'].map(type => (
                <button key={type} onClick={() => setIraInputs(p => ({ ...p, ptcVsItc: type }))}
                  style={{ flex: 1, padding: '6px', borderRadius: 6, border: `1px solid ${iraInputs.ptcVsItc === type ? T.indigo : T.border}`, background: iraInputs.ptcVsItc === type ? T.indigo : T.bg, color: iraInputs.ptcVsItc === type ? '#fff' : T.text, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  {type}
                </button>
              ))}
            </div>
          </div>
          {[
            { key: 'domesticContent', label: 'Domestic Content (+10%)', desc: '≥40% US-made components' },
            { key: 'energyCommunity', label: 'Energy Community (+10%)', desc: 'Brownfield / coal closure zone' },
            { key: 'lowIncome', label: 'Low-Income Bonus (+20%)', desc: 'ITC only — census tract threshold' },
          ].map(item => (
            <div key={item.key} style={{ marginBottom: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={iraInputs[item.key]} onChange={e => setIraInputs(p => ({ ...p, [item.key]: e.target.checked }))}
                  style={{ accentColor: T.indigo, width: 14, height: 14 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: T.sub }}>{item.desc}</div>
                </div>
              </label>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: 10, background: '#EEF2FF', borderRadius: 6 }}>
            <div style={{ fontSize: 11, color: T.indigo, fontWeight: 700 }}>Annual Tax Credit Value</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.indigo }}>${annualPTCValue.toFixed(2)}M</div>
            <div style={{ fontSize: 10, color: T.sub }}>10yr NPV: ${(annualPTCValue * 10 * 0.85).toFixed(1)}M</div>
          </div>
        </div>
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Adder Component','Value / Rate','Status'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', color: T.sub, textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adderRows.map((r, i) => (
                <tr key={r.adder} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 10px', fontWeight: r.type === 'total' ? 700 : 400 }}>{r.adder}</td>
                  <td style={{ padding: '6px 10px', color: r.type === 'total' ? T.indigo : r.type === 'active' ? T.green : T.sub, fontWeight: r.type === 'total' ? 700 : 400 }}>{r.value}</td>
                  <td style={{ padding: '6px 10px' }}>
                    {r.type !== 'base' && r.type !== 'total' && (
                      <span style={{ background: r.type === 'active' ? '#F0FDF4' : T.bg, color: r.type === 'active' ? T.green : T.sub, padding: '2px 6px', borderRadius: 3, fontSize: 10 }}>
                        {r.type === 'active' ? 'Claimed' : 'Not claimed'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 12, padding: 10, background: '#FFFBEB', borderRadius: 6, fontSize: 11, color: T.amber }}>
            <strong>Note:</strong> PTC and ITC cannot be stacked on the same project. Prevailing wage requirements must be met for full credit. Domestic content rules apply to steel/iron and manufactured products (per IRS Notice 2023-29).
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PPARevenueAnalyticsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [ppaInputs, setPpaInputs] = useState({
    capacityMW: 150,
    annualGWh: 280,
    market: 'ERCOT',
    structure: 'Fixed Price',
    strikePriceMWh: 32,
    escalatorPct: 0.00,
    termYr: 15,
    curtailmentPct: 0.05,
    basisSpreadPct: 0.12,
    buyerCreditRating: 'BBB+',
    merchantPct: 0.20,
    vppaMwh: 0,
    recPrice: 3.5,
    capacityPayment: 8,
  });

  const tabContent = [
    <div key="t1" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}><Tab1 /><GlossaryPanel /></div>,
    <div key="t2" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}><Tab2 inputs={ppaInputs} setInputs={setPpaInputs} /><IRAAdderPanel inputs={ppaInputs} /></div>,
    <Tab3 key="t3" inputs={ppaInputs} />,
    <div key="t4" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}><Tab4 inputs={ppaInputs} /><ForwardCurvesPanel inputs={ppaInputs} /></div>,
    <Tab5 key="t5" inputs={ppaInputs} />,
    <Tab6 key="t6" inputs={ppaInputs} />,
    <Tab7 key="t7" inputs={ppaInputs} />,
    <Tab8 key="t8" />,
    <Tab9 key="t9" inputs={ppaInputs} />,
    <Tab10 key="t10" inputs={ppaInputs} />,
  ];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, system-ui, sans-serif', color: T.text }}>
      {/* Bloomberg-tier header */}
      <div style={{ background: '#0A0F1C', borderBottom: `3px solid ${T.accent}`, padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: T.accent, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 3, letterSpacing: '0.08em' }}>RE-PPA1</div>
            <div>
              <div style={{ color: '#FAFAF7', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>PPA & Revenue Intelligence</div>
              <div style={{ color: '#9CA3AF', fontSize: 11 }}>Power Purchase Agreement Analytics · Merchant Risk · Revenue Optimization</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <select value={ppaInputs.market} onChange={e => setPpaInputs(p => ({ ...p, market: e.target.value }))}
              style={{ background: '#1E2A3A', color: '#FAFAF7', border: `1px solid #374151`, padding: '5px 10px', borderRadius: 6, fontSize: 12 }}>
              {MARKETS.map(m => <option key={m}>{m}</option>)}
            </select>
            <select value={ppaInputs.structure} onChange={e => setPpaInputs(p => ({ ...p, structure: e.target.value }))}
              style={{ background: '#1E2A3A', color: '#FAFAF7', border: `1px solid #374151`, padding: '5px 10px', borderRadius: 6, fontSize: 12 }}>
              {['Fixed Price','Fixed+Escalator','Floor+Collar','Revenue Share'].map(s => <option key={s}>{s}</option>)}
            </select>
            <div style={{ color: T.accent, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)}
              style={{ background: activeTab === i ? T.accent : 'transparent', color: activeTab === i ? '#fff' : '#9CA3AF', border: 'none', padding: '8px 14px', cursor: 'pointer', fontSize: 11, fontWeight: activeTab === i ? 700 : 400, borderRadius: '4px 4px 0 0', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {tabContent[activeTab]}
      </div>

      {/* Status bar */}
      <div style={{ background: '#0A0F1C', borderTop: `1px solid #1F2937`, padding: '6px 32px', display: 'flex', gap: 24, fontSize: 10, color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>
        <span>MODULE: RE-PPA1</span>
        <span>MARKET: {ppaInputs.market}</span>
        <span>STRUCTURE: {ppaInputs.structure}</span>
        <span>CAPACITY: {ppaInputs.capacityMW}MW</span>
        <span>PRODUCTION: {ppaInputs.annualGWh}GWh</span>
        <span>STRIKE: ${ppaInputs.strikePriceMWh}/MWh</span>
        <span>MERCHANT: {(ppaInputs.merchantPct * 100).toFixed(0)}%</span>
        <span style={{ marginLeft: 'auto', color: T.accent }}>LIVE · {PPA_CONTRACTS.length} CONTRACTS · {CORPORATE_BUYERS.length} BUYERS</span>
      </div>
    </div>
  );
}
