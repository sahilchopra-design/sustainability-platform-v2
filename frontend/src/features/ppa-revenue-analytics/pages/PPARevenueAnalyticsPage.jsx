import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E',
  sub: '#6B7280', accent: '#B8860B', indigo: '#4F46E5', green: '#065F46',
  red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', solar: '#D97706'
};

const COLORS = [T.indigo, T.accent, T.green, T.red, T.teal, T.blue, '#7C3AED', '#DB2777', T.solar, '#059669'];

const fmt = (v, d = 1) => (typeof v === 'number' && !isNaN(v) ? v.toFixed(d) : '—');
const fmtM = v => `$${(v / 1).toFixed(1)}M`;
const fmtPct = v => `${(v * 100).toFixed(1)}%`;

// ─── Static Market Data ───────────────────────────────────────────────────────
const MARKETS = ['ERCOT','CAISO','PJM','MISO','SPP','NYISO','ISO-NE','UK','Germany','Australia'];

const MARKET_META = {
  ERCOT:     { cf: 0.235, curtPct: 0.055, basis: -0.09, capPct: 0.18, liq: 9 },
  CAISO:     { cf: 0.265, curtPct: 0.060, basis: -0.14, capPct: 0.20, liq: 8 },
  PJM:       { cf: 0.175, curtPct: 0.012, basis: -0.07, capPct: 0.06, liq: 8 },
  MISO:      { cf: 0.190, curtPct: 0.030, basis: -0.10, capPct: 0.05, liq: 7 },
  SPP:       { cf: 0.225, curtPct: 0.035, basis: -0.11, capPct: 0.04, liq: 6 },
  NYISO:     { cf: 0.165, curtPct: 0.008, basis: -0.06, capPct: 0.09, liq: 6 },
  'ISO-NE':  { cf: 0.155, curtPct: 0.005, basis: -0.05, capPct: 0.07, liq: 5 },
  UK:        { cf: 0.120, curtPct: 0.020, basis: -0.08, capPct: 0.12, liq: 7 },
  Germany:   { cf: 0.110, curtPct: 0.025, basis: -0.09, capPct: 0.10, liq: 7 },
  Australia: { cf: 0.280, curtPct: 0.045, basis: -0.13, capPct: 0.15, liq: 6 },
};

const PPA_PRICE_HISTORY = [
  { year: 2018, ERCOT:16,CAISO:26,PJM:20,MISO:17,SPP:13,NYISO:28,'ISO-NE':26,UK:52,Germany:58,Australia:40 },
  { year: 2019, ERCOT:17,CAISO:27,PJM:21,MISO:18,SPP:14,NYISO:29,'ISO-NE':27,UK:50,Germany:55,Australia:42 },
  { year: 2020, ERCOT:18,CAISO:28,PJM:22,MISO:19,SPP:15,NYISO:30,'ISO-NE':28,UK:48,Germany:52,Australia:44 },
  { year: 2021, ERCOT:22,CAISO:30,PJM:24,MISO:21,SPP:18,NYISO:33,'ISO-NE':30,UK:50,Germany:54,Australia:48 },
  { year: 2022, ERCOT:35,CAISO:42,PJM:38,MISO:32,SPP:28,NYISO:45,'ISO-NE':46,UK:68,Germany:74,Australia:62 },
  { year: 2023, ERCOT:32,CAISO:40,PJM:36,MISO:30,SPP:26,NYISO:42,'ISO-NE':44,UK:62,Germany:68,Australia:56 },
  { year: 2024, ERCOT:30,CAISO:38,PJM:33,MISO:27,SPP:24,NYISO:40,'ISO-NE':42,UK:58,Germany:64,Australia:52 },
];

const CREDIT_RATINGS = ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB'];
const PD_BY_RATING = { AAA:0.0001,['AA+']:0.0002,AA:0.0003,['AA-']:0.0004,['A+']:0.0005,A:0.0006,['A-']:0.0008,['BBB+']:0.0015,BBB:0.0022,['BBB-']:0.0040,['BB+']:0.0070,BB:0.0090 };

const PPA_CONTRACTS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  project: `Solar Farm ${String.fromCharCode(65 + i)}`,
  capacityMW: 50 + Math.round(sr(i * 37) * 250),
  market: MARKETS[Math.floor(sr(i * 41) * 7)],
  type: ['Fixed Price','Fixed+Escalator','Floor+Collar','Revenue Share'][Math.floor(sr(i * 43) * 4)],
  strikeMWh: 28 + parseFloat((sr(i * 47) * 20).toFixed(1)),
  escalatorPct: sr(i * 53) < 0.5 ? 0 : parseFloat((0.01 + sr(i * 53) * 0.02).toFixed(3)),
  termYr: [10, 15, 20, 25][Math.floor(sr(i * 59) * 4)],
  expiryYear: 2026 + Math.floor(sr(i * 61) * 20),
  buyerRating: CREDIT_RATINGS[Math.floor(sr(i * 67) * CREDIT_RATINGS.length)],
  curtailmentPct: parseFloat((sr(i * 71) * 0.08).toFixed(3)),
  annualGWh: parseFloat((50 + sr(i * 73) * 450).toFixed(0)),
  contractedPct: 0.70 + sr(i * 79) * 0.30,
}));

const CORPORATE_BUYERS = [
  { name: 'Microsoft',  sector: 'Technology',     mwh: 18000, price: 32, term: 20, market: 'PJM',    re100: true,  signed: 2021, structure: 'Virtual VPPA' },
  { name: 'Google',     sector: 'Technology',     mwh: 22000, price: 30, term: 15, market: 'ERCOT',  re100: true,  signed: 2020, structure: 'Physical PPA' },
  { name: 'Amazon',     sector: 'Technology',     mwh: 35000, price: 28, term: 20, market: 'CAISO',  re100: true,  signed: 2022, structure: 'Virtual VPPA' },
  { name: 'Meta',       sector: 'Technology',     mwh: 12000, price: 33, term: 15, market: 'MISO',   re100: true,  signed: 2021, structure: 'Physical PPA' },
  { name: 'Apple',      sector: 'Technology',     mwh: 9000,  price: 35, term: 10, market: 'CAISO',  re100: true,  signed: 2023, structure: 'Physical PPA' },
  { name: 'Walmart',    sector: 'Retail',         mwh: 6000,  price: 31, term: 12, market: 'SPP',    re100: false, signed: 2022, structure: 'Physical PPA' },
  { name: 'Target',     sector: 'Retail',         mwh: 3500,  price: 34, term: 10, market: 'MISO',   re100: false, signed: 2023, structure: 'Green Tariff' },
  { name: 'GM',         sector: 'Manufacturing',  mwh: 8000,  price: 29, term: 15, market: 'PJM',    re100: false, signed: 2022, structure: 'Physical PPA' },
  { name: 'Ford',       sector: 'Manufacturing',  mwh: 5000,  price: 31, term: 12, market: 'MISO',   re100: false, signed: 2023, structure: 'Physical PPA' },
  { name: 'JPMorgan',   sector: 'Finance',        mwh: 2000,  price: 38, term: 10, market: 'NYISO',  re100: true,  signed: 2023, structure: 'Virtual VPPA' },
];

const MONTHLY_CF = {
  Solar:       [0.12,0.14,0.18,0.22,0.24,0.25,0.24,0.23,0.20,0.16,0.12,0.10],
  Wind:        [0.30,0.28,0.26,0.24,0.20,0.18,0.17,0.18,0.22,0.26,0.29,0.31],
  'Solar+BESS':[0.14,0.16,0.20,0.24,0.26,0.27,0.26,0.25,0.22,0.18,0.14,0.12],
};

const STATE_RPS = [
  { state: 'California', target: 100, year: 2045, srec: false, penalty: 50 },
  { state: 'New York',   target: 100, year: 2040, srec: true,  penalty: 45 },
  { state: 'Texas',      target: 0,   year: null,  srec: false, penalty: 0  },
  { state: 'Illinois',   target: 25,  year: 2025,  srec: true,  penalty: 20 },
  { state: 'New Jersey', target: 50,  year: 2030,  srec: true,  penalty: 55 },
  { state: 'Maryland',   target: 50,  year: 2030,  srec: true,  penalty: 40 },
  { state: 'Virginia',   target: 100, year: 2045,  srec: false, penalty: 30 },
  { state: 'Colorado',   target: 100, year: 2040,  srec: false, penalty: 25 },
  { state: 'Michigan',   target: 60,  year: 2035,  srec: false, penalty: 18 },
  { state: 'Minnesota',  target: 100, year: 2040,  srec: false, penalty: 22 },
  { state: 'Massachusetts',target:40, year: 2030,  srec: true,  penalty: 65 },
  { state: 'Connecticut',target: 40,  year: 2030,  srec: false, penalty: 55 },
];

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, width }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', minWidth: width || 140, flex: 1 }}>
      <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SH({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10, marginTop: 18, borderBottom: `2px solid ${T.accent}`, paddingBottom: 4 }}>{children}</div>;
}

// ─── Slider Input ─────────────────────────────────────────────────────────────
function SliderInput({ label, value, min, max, step, onChange, fmt: fmtFn, disabled, note }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 11, color: T.sub }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: disabled ? T.sub : T.accent }}>{fmtFn ? fmtFn(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step || 1} value={value} disabled={!!disabled}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: T.accent, opacity: disabled ? 0.4 : 1 }} />
      {note && <div style={{ fontSize: 10, color: T.sub, marginTop: 1 }}>{note}</div>}
    </div>
  );
}

// ─── Select Input ─────────────────────────────────────────────────────────────
function SelectInput({ label, value, options, onChange }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: T.sub, marginBottom: 3 }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '5px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, background: T.card, color: T.text }}>
        {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
      </select>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <span style={{ fontSize: 11, color: T.sub }}>{label}</span>
      <div onClick={() => onChange(!value)} style={{ width: 36, height: 20, borderRadius: 10, background: value ? T.green : T.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
        <div style={{ width: 16, height: 16, borderRadius: 8, background: T.card, position: 'absolute', top: 2, left: value ? 18 : 2, transition: 'left 0.2s' }} />
      </div>
    </div>
  );
}

// ─── Tab Bar ─────────────────────────────────────────────────────────────────
const TABS = [
  'Command Center','Pricing Engine','Corporate VPPA','Market Intelligence',
  'Revenue Stack','Merchant Risk','Basis Risk','Curtailment','Counterparty Risk',
  'Contract Optimization','VPPA Structuring','Forecasting','Portfolio Analytics',
  'Negotiation Toolkit','Carbon & RECs','Regulatory','Documentation','Intelligence Report'
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ cfg, setCfg }) {
  const set = (k, v) => setCfg(c => ({ ...c, [k]: v }));
  const autoGWh = Math.round(cfg.capacityMW * (cfg.capacityCF / 100) * 8760 / 1000);
  const p90 = Math.round(cfg.p50GWh * 0.90);
  const merchantPct = 100 - cfg.contractedPct;

  // Year-1 quick stats
  const contractedGWh = cfg.p50GWh * (1 - cfg.curtailmentPct / 100) * (cfg.contractedPct / 100);
  const merchantGWh = cfg.p50GWh * (1 - cfg.curtailmentPct / 100) * (merchantPct / 100);
  const ppaRev = contractedGWh * cfg.strikeMWh / 1000;
  const merchantRev = merchantGWh * cfg.merchantLMP * (1 - Math.abs(cfg.basisPct) / 100) / 1000;
  const recRev = cfg.p50GWh * cfg.recPrice / 1000;
  const totalRev = ppaRev + merchantRev + recRev;
  const discountRate = cfg.discountRate / 100;
  const ppaNpv = Array.from({ length: cfg.ppaTermYr }, (_, y) => {
    const escalatedPrice = cfg.strikeMWh * Math.pow(1 + cfg.escalatorPct / 100, y);
    return contractedGWh * escalatedPrice / 1000 / Math.pow(1 + discountRate, y + 1);
  }).reduce((a, b) => a + b, 0);
  const varMerchant = merchantRev * (cfg.merchantSigmaPct / 100) * 1.645;
  const wale = cfg.ppaTermYr * (cfg.contractedPct / 100);

  return (
    <div style={{ width: 270, minWidth: 270, maxWidth: 270, background: T.card, borderRight: `1px solid ${T.border}`, overflowY: 'auto', padding: '16px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: T.text, marginBottom: 14, letterSpacing: '-0.02em' }}>PPA Deal Configurator</div>

      {/* Section 1 */}
      <div style={{ fontWeight: 700, fontSize: 11, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>1 · Project Asset</div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: T.sub, marginBottom: 3 }}>Project Name</div>
        <input value={cfg.projectName} onChange={e => set('projectName', e.target.value)}
          style={{ width: '100%', padding: '5px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, background: T.bg, color: T.text, boxSizing: 'border-box' }} />
      </div>
      <SelectInput label="Technology" value={cfg.technology} options={['Solar','Wind','Solar+BESS']} onChange={v => set('technology', v)} />
      <SliderInput label="Capacity MW" value={cfg.capacityMW} min={20} max={500} step={5} onChange={v => set('capacityMW', v)} fmtFn={v => `${v} MW`} />
      <SliderInput label="Capacity Factor %" value={cfg.capacityCF} min={14} max={42} step={0.5} onChange={v => set('capacityCF', v)} fmtFn={v => `${v.toFixed(1)}%`} />
      <SliderInput label="Annual P50 GWh" value={cfg.p50GWh} min={50} max={1500} step={5} onChange={v => set('p50GWh', v)} fmtFn={v => `${v} GWh`} note={`Auto: ${autoGWh} GWh`} />
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 10, background: T.bg, borderRadius: 5, padding: '4px 7px' }}>P90: {p90} GWh (P50 × 0.90)</div>
      <SelectInput label="COD Date" value={cfg.codYear} options={['2024','2025','2026','2027']} onChange={v => set('codYear', v)} />

      {/* Section 2 */}
      <div style={{ fontWeight: 700, fontSize: 11, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, marginTop: 14 }}>2 · PPA Structure</div>
      <SelectInput label="PPA Type" value={cfg.ppaType} options={['Fixed Price','Fixed+Escalator','Floor+Collar','Revenue Share','Virtual VPPA']} onChange={v => set('ppaType', v)} />
      <SelectInput label="Power Market" value={cfg.market} options={MARKETS} onChange={v => set('market', v)} />
      <SliderInput label="PPA Strike Price $/MWh" value={cfg.strikeMWh} min={18} max={70} step={0.5} onChange={v => set('strikeMWh', v)} fmtFn={v => `$${v.toFixed(1)}`} />
      <SliderInput label="Price Escalator %/yr" value={cfg.escalatorPct} min={0} max={3} step={0.1} onChange={v => set('escalatorPct', v)} fmtFn={v => `${v.toFixed(1)}%`} disabled={cfg.ppaType === 'Fixed Price'} />
      {(cfg.ppaType === 'Floor+Collar') && <>
        <SliderInput label="Floor Price $/MWh" value={cfg.floorMWh} min={15} max={50} step={0.5} onChange={v => set('floorMWh', v)} fmtFn={v => `$${v.toFixed(1)}`} />
        <SliderInput label="Cap Price $/MWh" value={cfg.capMWh} min={30} max={80} step={0.5} onChange={v => set('capMWh', v)} fmtFn={v => `$${v.toFixed(1)}`} />
      </>}
      <SelectInput label="PPA Term (years)" value={cfg.ppaTermYr} options={[5,7,10,12,15,20,25].map(v => ({ value: v, label: `${v} years` }))} onChange={v => set('ppaTermYr', Number(v))} />
      <SliderInput label="Contracted Volume %" value={cfg.contractedPct} min={50} max={100} step={5} onChange={v => set('contractedPct', v)} fmtFn={v => `${v}%`} />
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 10, background: T.bg, borderRadius: 5, padding: '4px 7px' }}>Merchant: {merchantPct}%</div>

      {/* Section 3 */}
      <div style={{ fontWeight: 700, fontSize: 11, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, marginTop: 14 }}>3 · Offtaker Profile</div>
      <SelectInput label="Buyer Type" value={cfg.buyerType} options={['Utility','Corporate','Municipality','Cooperative']} onChange={v => set('buyerType', v)} />
      <SelectInput label="Credit Rating" value={cfg.buyerRating} options={CREDIT_RATINGS} onChange={v => set('buyerRating', v)} />
      <SelectInput label="Credit Enhancement" value={cfg.creditEnhancement} options={['None','Letter of Credit','Parent Guarantee','Escrow']} onChange={v => set('creditEnhancement', v)} />
      {cfg.creditEnhancement === 'Letter of Credit' && <SliderInput label="LC Amount $M" value={cfg.lcAmountM} min={1} max={50} step={1} onChange={v => set('lcAmountM', v)} fmtFn={v => `$${v}M`} />}
      <Toggle label="RE100 Commitment" value={cfg.re100} onChange={v => set('re100', v)} />
      <SelectInput label="Buyer Sector" value={cfg.buyerSector} options={['Technology','Finance','Manufacturing','Retail','Healthcare','Energy','Government']} onChange={v => set('buyerSector', v)} />

      {/* Section 4 */}
      <div style={{ fontWeight: 700, fontSize: 11, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, marginTop: 14 }}>4 · Market & Basis</div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: T.sub, marginBottom: 3 }}>Delivery Node</div>
        <input value={cfg.deliveryNode} onChange={e => set('deliveryNode', e.target.value)}
          style={{ width: '100%', padding: '5px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, background: T.bg, color: T.text, boxSizing: 'border-box' }} />
      </div>
      <SliderInput label="Basis Spread %" value={cfg.basisPct} min={-30} max={0} step={0.5} onChange={v => set('basisPct', v)} fmtFn={v => `${v.toFixed(1)}%`} />
      <SliderInput label="Curtailment Rate %" value={cfg.curtailmentPct} min={0} max={20} step={0.5} onChange={v => set('curtailmentPct', v)} fmtFn={v => `${v.toFixed(1)}%`} />
      <SliderInput label="Shape Factor %" value={cfg.shapeFactor} min={70} max={100} step={0.5} onChange={v => set('shapeFactor', v)} fmtFn={v => `${v.toFixed(1)}%`} />
      <SliderInput label="Merchant LMP $/MWh" value={cfg.merchantLMP} min={15} max={60} step={0.5} onChange={v => set('merchantLMP', v)} fmtFn={v => `$${v.toFixed(1)}`} />
      <SliderInput label="Merchant LMP σ %" value={cfg.merchantSigmaPct} min={15} max={50} step={1} onChange={v => set('merchantSigmaPct', v)} fmtFn={v => `${v}%`} />

      {/* Section 5 */}
      <div style={{ fontWeight: 700, fontSize: 11, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, marginTop: 14 }}>5 · REC & Carbon</div>
      <SliderInput label="REC Price $/MWh" value={cfg.recPrice} min={0} max={20} step={0.5} onChange={v => set('recPrice', v)} fmtFn={v => `$${v.toFixed(1)}`} />
      <Toggle label="Carbon Credit Additionality" value={cfg.carbonAdditionality} onChange={v => set('carbonAdditionality', v)} />
      <SliderInput label="Green Premium $/MWh" value={cfg.greenPremium} min={0} max={10} step={0.5} onChange={v => set('greenPremium', v)} fmtFn={v => `$${v.toFixed(1)}`} />
      <Toggle label="I-REC Export Option" value={cfg.irecExport} onChange={v => set('irecExport', v)} />

      {/* Section 6 */}
      <div style={{ fontWeight: 700, fontSize: 11, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, marginTop: 14 }}>6 · Revenue Targets</div>
      <SliderInput label="Target Project IRR %" value={cfg.targetIRR} min={8} max={20} step={0.5} onChange={v => set('targetIRR', v)} fmtFn={v => `${v.toFixed(1)}%`} />
      <SliderInput label="Discount Rate %" value={cfg.discountRate} min={5} max={12} step={0.25} onChange={v => set('discountRate', v)} fmtFn={v => `${v.toFixed(2)}%`} />
      <SliderInput label="ITC %" value={cfg.itcPct} min={6} max={50} step={1} onChange={v => set('itcPct', v)} fmtFn={v => `${v}%`} />
      <SliderInput label="Target Min DSCR" value={cfg.targetDSCR} min={1.10} max={1.40} step={0.01} onChange={v => set('targetDSCR', v)} fmtFn={v => v.toFixed(2)} />

      {/* Live Quick Stats */}
      <div style={{ marginTop: 18, background: '#1A1A2E', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ fontSize: 10, color: T.accent, fontWeight: 700, marginBottom: 8, letterSpacing: '0.06em' }}>LIVE QUICK STATS</div>
        {[
          ['Year-1 PPA Rev', `$${ppaRev.toFixed(1)}M`],
          ['Year-1 Total Rev', `$${totalRev.toFixed(1)}M`],
          ['PPA NPV', `$${ppaNpv.toFixed(1)}M`],
          ['Merchant VaR', `$${varMerchant.toFixed(1)}M`],
          ['Net Rev at Risk', `${(varMerchant / (totalRev || 1) * 100).toFixed(1)}%`],
          ['Contract WALE', `${wale.toFixed(1)} yrs`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: '#9CA3AF' }}>{k}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#FAFAF7' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab 1: PPA Command Center ────────────────────────────────────────────────
function Tab1({ cfg }) {
  const mMeta = MARKET_META[cfg.market] || MARKET_META.ERCOT;
  const merchantPct = 100 - cfg.contractedPct;
  const contractedGWh = cfg.p50GWh * (1 - cfg.curtailmentPct / 100) * (cfg.contractedPct / 100);
  const merchantGWh = cfg.p50GWh * (1 - cfg.curtailmentPct / 100) * (merchantPct / 100);
  const ppaRev = contractedGWh * cfg.strikeMWh / 1000;
  const merchantRev = merchantGWh * cfg.merchantLMP * (1 + cfg.basisPct / 100) / 1000;
  const recRev = cfg.p50GWh * cfg.recPrice / 1000;
  const carbonAdder = cfg.carbonAdditionality ? cfg.p50GWh * (3.5) / 1000 : 0;
  const totalRev = ppaRev + merchantRev + recRev + carbonAdder;
  const discountRate = cfg.discountRate / 100;
  const ppaNpv = Array.from({ length: Math.min(cfg.ppaTermYr, 25) }, (_, y) => {
    const esc = cfg.strikeMWh * Math.pow(1 + cfg.escalatorPct / 100, y);
    return contractedGWh * esc / 1000 / Math.pow(1 + discountRate, y + 1);
  }).reduce((a, b) => a + b, 0);
  const pd = PD_BY_RATING[cfg.buyerRating] || 0.005;
  const lgd = cfg.creditEnhancement === 'None' ? 0.60 : 0.40;
  const exposure = ppaNpv;
  const ecl = pd * lgd * exposure;
  const varMerchant = merchantRev * (cfg.merchantSigmaPct / 100) * 1.645;
  const wale = cfg.ppaTermYr;
  const lcoeEst = cfg.technology === 'Solar' ? 28 : cfg.technology === 'Wind' ? 30 : 35;
  const ppavLcoe = cfg.strikeMWh - lcoeEst;
  const irr = cfg.targetIRR;
  const contractCoverage = cfg.contractedPct;

  const scorecard = [
    { metric: 'Revenue Certainty', score: contractCoverage >= 90 ? 9 : contractCoverage >= 70 ? 7 : 5, max: 10 },
    { metric: 'Basis Risk', score: Math.max(1, 10 + Math.round(cfg.basisPct / 3)), max: 10 },
    { metric: 'Curtailment Risk', score: cfg.curtailmentPct < 3 ? 9 : cfg.curtailmentPct < 7 ? 7 : 5, max: 10 },
    { metric: 'Offtaker Credit', score: pd < 0.001 ? 10 : pd < 0.003 ? 8 : pd < 0.007 ? 6 : 4, max: 10 },
    { metric: 'Market Liquidity', score: mMeta.liq, max: 10 },
    { metric: 'Escalator Protection', score: cfg.escalatorPct >= 2 ? 9 : cfg.escalatorPct >= 1 ? 7 : 5, max: 10 },
    { metric: 'PPA vs LCOE Spread', score: ppavLcoe >= 8 ? 9 : ppavLcoe >= 4 ? 7 : ppavLcoe >= 0 ? 5 : 3, max: 10 },
    { metric: 'IRR vs Hurdle', score: irr >= cfg.targetIRR + 2 ? 10 : irr >= cfg.targetIRR ? 8 : 5, max: 10 },
  ];
  const avgScore = scorecard.reduce((a, b) => a + b.score, 0) / scorecard.length;

  const mktTxns = [
    { deal: 'ERCOT Solar PPA (2024)', size: 200, price: 31.5, term: 15 },
    { deal: 'CAISO Wind PPA (2024)',  size: 150, price: 37.0, term: 20 },
    { deal: 'PJM Solar PPA (2023)',   size: 120, price: 34.0, term: 12 },
  ];

  const iraAdders = [
    { adder: 'Base ITC', pct: cfg.itcPct, revMWh: 0 },
    { adder: 'Domestic Content Bonus', pct: 10, revMWh: cfg.p50GWh * 10 / (cfg.capacityMW * 1000) },
    { adder: 'Energy Community Bonus', pct: 10, revMWh: 0 },
    { adder: 'Low-Income Community', pct: 20, revMWh: 0 },
  ];

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 16 }}>PPA Command Center — {cfg.projectName}</div>

      {/* 8 KPI cards */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <KpiCard label="Year-1 PPA Revenue" value={`$${ppaRev.toFixed(1)}M`} color={T.indigo} />
        <KpiCard label="Year-1 Total Revenue" value={`$${totalRev.toFixed(1)}M`} color={T.green} />
        <KpiCard label={`PPA NPV (${cfg.ppaTermYr}yr)`} value={`$${ppaNpv.toFixed(1)}M`} color={T.blue} />
        <KpiCard label="Merchant VaR (95%)" value={`$${varMerchant.toFixed(1)}M`} color={T.red} />
        <KpiCard label="Revenue WALE" value={`${wale} yrs`} color={T.teal} />
        <KpiCard label="Contract Coverage" value={`${contractCoverage}%`} color={T.accent} />
        <KpiCard label="Project IRR" value={`${cfg.targetIRR.toFixed(1)}%`} color={T.solar} />
        <KpiCard label="Offtaker ECL" value={`$${ecl.toFixed(2)}M`} color={T.amber} />
      </div>

      {/* Deal Health Scorecard */}
      <SH>Deal Health Scorecard</SH>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 20 }}>
        {scorecard.map(s => (
          <div key={s.metric} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, color: T.sub, marginBottom: 5 }}>{s.metric}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3 }}>
                <div style={{ width: `${(s.score / s.max) * 100}%`, height: '100%', background: s.score >= 8 ? T.green : s.score >= 6 ? T.accent : T.red, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: s.score >= 8 ? T.green : s.score >= 6 ? T.accent : T.red }}>{s.score}/{s.max}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 16px', marginBottom: 20 }}>
        <span style={{ fontSize: 12, color: T.sub }}>Overall Deal Score: </span>
        <span style={{ fontSize: 16, fontWeight: 800, color: avgScore >= 8 ? T.green : avgScore >= 6 ? T.accent : T.red }}>{avgScore.toFixed(1)}/10</span>
        <span style={{ fontSize: 11, color: T.sub, marginLeft: 12 }}>{avgScore >= 8 ? 'Strong — Proceed' : avgScore >= 6 ? 'Acceptable — Negotiate key terms' : 'Weak — Structural issues to address'}</span>
      </div>

      {/* PPA Structure Diagram */}
      <SH>PPA Cash Flow Diagram</SH>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          {[
            { label: cfg.projectName, sub: `${cfg.capacityMW} MW ${cfg.technology}`, color: T.green },
            null,
            { label: 'PPA Agreement', sub: `$${cfg.strikeMWh}/MWh · ${cfg.ppaTermYr}yr`, color: T.indigo },
            null,
            { label: cfg.buyerType, sub: `${cfg.buyerRating} · ${cfg.buyerSector}`, color: T.blue },
          ].map((item, idx) => item === null ? (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 4px' }}>
              <div style={{ fontSize: 18, color: T.accent }}>→</div>
              <div style={{ fontSize: 9, color: T.sub, textAlign: 'center', marginTop: 2 }}>{idx === 1 ? `Energy / RECs` : `$${ppaRev.toFixed(1)}M/yr`}</div>
            </div>
          ) : (
            <div key={idx} style={{ background: item.color, borderRadius: 10, padding: '12px 16px', textAlign: 'center', minWidth: 120 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{item.label}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>{item.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 30, marginTop: 16 }}>
          {[
            ['PPA Contracted', `$${ppaRev.toFixed(1)}M/yr`, T.indigo],
            ['Merchant Offtake', `$${merchantRev.toFixed(1)}M/yr`, T.solar],
            ['RECs', `$${recRev.toFixed(1)}M/yr`, T.green],
          ].map(([k, v, c]) => (
            <div key={k} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: T.sub }}>{k}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: c }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Comparisons */}
      <SH>Recent Market Transactions vs This Deal</SH>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.bg }}>
              {['Deal','Capacity MW','Strike $/MWh','Term','vs This Deal'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...mktTxns, { deal: `${cfg.projectName} (This Deal)`, size: cfg.capacityMW, price: cfg.strikeMWh, term: cfg.ppaTermYr }].map((row, i) => (
              <tr key={row.deal} style={{ borderTop: `1px solid ${T.border}`, background: i === 3 ? '#EEF2FF' : T.card }}>
                <td style={{ padding: '8px 12px', fontWeight: i === 3 ? 700 : 400 }}>{row.deal}</td>
                <td style={{ padding: '8px 12px' }}>{row.size}</td>
                <td style={{ padding: '8px 12px', color: T.indigo, fontWeight: 700 }}>${row.price.toFixed(1)}</td>
                <td style={{ padding: '8px 12px' }}>{row.term} yr</td>
                <td style={{ padding: '8px 12px', color: i === 3 ? T.text : row.price < cfg.strikeMWh ? T.green : T.red }}>
                  {i === 3 ? '—' : `${row.price < cfg.strikeMWh ? '+' : '-'}$${Math.abs(cfg.strikeMWh - row.price).toFixed(1)}/MWh`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* IRA Adder Panel */}
      <SH>IRA Incentive Benefit Panel</SH>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        {iraAdders.map(a => (
          <div key={a.adder} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: T.sub }}>{a.adder}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.green, marginTop: 4 }}>{a.pct}% ITC</div>
            {a.revMWh > 0 && <div style={{ fontSize: 10, color: T.sub }}>+${a.revMWh.toFixed(2)}/MWh revenue benefit</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab 2: PPA Pricing Engine ────────────────────────────────────────────────
function Tab2({ cfg }) {
  const merchantPct = 100 - cfg.contractedPct;
  const netGWh = cfg.p50GWh * (1 - cfg.curtailmentPct / 100);
  const contractedGWh = netGWh * (cfg.contractedPct / 100);
  const merchantGWh = netGWh * (merchantPct / 100);
  const curtailedGWh = cfg.p50GWh - netGWh;
  const basisFactor = 1 + cfg.basisPct / 100;
  const ppaRev = contractedGWh * cfg.strikeMWh / 1000;
  const recRev = cfg.p50GWh * cfg.recPrice / 1000;
  const merchantRev = merchantGWh * cfg.merchantLMP * basisFactor / 1000;
  const curtailLoss = curtailedGWh * cfg.strikeMWh / 1000;
  const basisAdj = ppaRev * Math.abs(cfg.basisPct) / 100;
  const netRev = ppaRev + recRev + merchantRev - curtailLoss - basisAdj;
  const discountRate = cfg.discountRate / 100;

  const projection20 = Array.from({ length: 20 }, (_, y) => {
    const esc = cfg.strikeMWh * Math.pow(1 + cfg.escalatorPct / 100, y);
    const ppaR = y < cfg.ppaTermYr ? contractedGWh * esc / 1000 : 0;
    const merchant = y < cfg.ppaTermYr ? merchantGWh * cfg.merchantLMP * (1 + sr(y * 13) * 0.1 - 0.05) * basisFactor / 1000
      : netGWh * cfg.merchantLMP * (1 + sr(y * 13) * 0.1 - 0.05) * basisFactor / 1000;
    const rec = cfg.recPrice > 0 ? cfg.p50GWh * cfg.recPrice / 1000 : 0;
    const total = ppaR + merchant + rec;
    const npv = total / Math.pow(1 + discountRate, y + 1);
    return { year: 2025 + y, ppaPrice: y < cfg.ppaTermYr ? esc.toFixed(2) : '—', ppaRev: ppaR.toFixed(2), merchantRev: merchant.toFixed(2), recRev: rec.toFixed(2), total: total.toFixed(2), npv: npv.toFixed(2) };
  });

  const chartData = projection20.map(r => ({
    year: r.year,
    PPA: parseFloat(r.ppaRev),
    Merchant: parseFloat(r.merchantRev),
    RECs: parseFloat(r.recRev),
  }));

  // Breakeven LMP where merchant > PPA
  const breakeven = cfg.strikeMWh / basisFactor;

  // Fair-value PPA price for target IRR (simplified)
  const capex = cfg.capacityMW * 1200; // $1200/kW
  const itcBenefit = capex * (cfg.itcPct / 100);
  const annualOpex = cfg.capacityMW * 15000; // $15/kW/yr
  const netCapex = capex - itcBenefit;
  const annualDebt = netCapex * 0.7 * cfg.discountRate / 100;
  const reqRevenue = (netCapex * (cfg.targetIRR / 100) + annualDebt + annualOpex) / 1000000;
  const fairValueMWh = (reqRevenue * 1000000) / (contractedGWh > 0 ? contractedGWh : 1);

  const components = [
    { name: 'Contracted Energy (PPA)', value: ppaRev.toFixed(2), color: T.indigo, pct: (ppaRev / (netRev || 1) * 100).toFixed(1) },
    { name: 'REC Revenue', value: recRev.toFixed(2), color: T.green, pct: (recRev / (netRev || 1) * 100).toFixed(1) },
    { name: 'Merchant Revenue', value: merchantRev.toFixed(2), color: T.solar, pct: (merchantRev / (netRev || 1) * 100).toFixed(1) },
    { name: 'Curtailment Loss', value: `-${curtailLoss.toFixed(2)}`, color: T.red, pct: `-${(curtailLoss / (netRev || 1) * 100).toFixed(1)}` },
    { name: 'Basis Adjustment', value: `-${basisAdj.toFixed(2)}`, color: T.amber, pct: `-${(basisAdj / (netRev || 1) * 100).toFixed(1)}` },
    { name: 'Net Revenue', value: netRev.toFixed(2), color: T.text, pct: '100' },
  ];

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 16 }}>PPA Pricing Engine</div>

      <SH>Revenue Component Breakdown (Year 1)</SH>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.bg }}>
              {['Component','$M/yr','% of Net'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, fontSize: 11 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {components.map(c => (
              <tr key={c.name} style={{ borderTop: `1px solid ${T.border}`, fontWeight: c.name === 'Net Revenue' ? 700 : 400 }}>
                <td style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: c.color }} />
                  {c.name}
                </td>
                <td style={{ padding: '8px 12px', color: c.value.startsWith('-') ? T.red : T.green, fontWeight: 600 }}>{c.value}</td>
                <td style={{ padding: '8px 12px', color: T.sub }}>{c.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PPA vs Merchant breakeven */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>PPA Breakeven LMP</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.indigo }}>${breakeven.toFixed(1)}/MWh</div>
          <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>
            {cfg.merchantLMP > breakeven ? `Merchant BETTER by $${(cfg.merchantLMP - breakeven).toFixed(1)}/MWh` : `PPA BETTER by $${(breakeven - cfg.merchantLMP).toFixed(1)}/MWh`}
          </div>
        </div>
        <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px' }}>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>Fair-Value PPA Price (Target {cfg.targetIRR}% IRR)</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.green }}>${fairValueMWh.toFixed(1)}/MWh</div>
          <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>
            vs configured ${cfg.strikeMWh}/MWh ({cfg.strikeMWh >= fairValueMWh ? `+$${(cfg.strikeMWh - fairValueMWh).toFixed(1)} above` : `-$${(fairValueMWh - cfg.strikeMWh).toFixed(1)} below`})
          </div>
        </div>
      </div>

      {/* 20-year projection chart */}
      <SH>20-Year Revenue Projection</SH>
      <div style={{ height: 280, marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} tickFormatter={v => `'${String(v).slice(2)}`} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}M`} />
            <Tooltip formatter={(v, n) => [`$${v}M`, n]} />
            <Legend />
            <Bar dataKey="PPA" fill={T.indigo} stackId="a" />
            <Bar dataKey="Merchant" fill={T.solar} stackId="a" />
            <Bar dataKey="RECs" fill={T.green} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 20-year table */}
      <SH>20-Year Revenue Table</SH>
      <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead style={{ position: 'sticky', top: 0, background: T.bg }}>
            <tr>
              {['Year','PPA $/MWh','PPA Rev $M','Merchant $M','REC $M','Total $M','NPV $M'].map(h => (
                <th key={h} style={{ padding: '7px 10px', textAlign: 'right', color: T.sub, fontWeight: 600, fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projection20.map(r => (
              <tr key={r.year} style={{ borderTop: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 600 }}>{r.year}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', color: T.indigo }}>{r.ppaPrice !== '—' ? `$${r.ppaPrice}` : '—'}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>{r.ppaRev}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', color: T.solar }}>{r.merchantRev}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', color: T.green }}>{r.recRev}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>{r.total}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', color: T.blue }}>{r.npv}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 3: Corporate VPPA ────────────────────────────────────────────────────
function Tab3({ cfg }) {
  const comparisonDims = [
    { dim: 'Settlement', physical: 'Energy delivered at meter', vppa: 'Financial: (Strike - LMP) × MWh' },
    { dim: 'RE100 Credit', physical: 'Direct energy use', vppa: 'Bundled RECs / attribute transfer' },
    { dim: 'Basis Risk', physical: 'Buyer bears shape/basis', vppa: 'Developer bears basis; buyer bears price risk' },
    { dim: 'Balance Sheet', physical: 'May appear as lease (ASC 842)', vppa: 'Derivative (ASC 815) — hedge accounting' },
    { dim: 'Additionality', physical: 'New capacity if not existing', vppa: 'New capacity — strong additionality claim' },
    { dim: 'Corporate Location', physical: 'Must be near project', vppa: 'Any geography — remote settlement' },
    { dim: 'Utility Involvement', physical: 'Utility buys + resells (sleeve)', vppa: 'No utility needed (ISDA direct)' },
    { dim: 'Complexity', physical: 'Low — standard EEI contract', vppa: 'High — ISDA, hedge designation, MTM' },
  ];

  const retailPrice = 65; // avg retail $/MWh
  const annualConsumptionGWh = 500; // corporate buyer
  const ppaPct = Math.min(100, (cfg.p50GWh / annualConsumptionGWh * 100)).toFixed(1);
  const retailEscalator = 0.025;

  const npvSavings = Array.from({ length: 20 }, (_, y) => {
    const retail = retailPrice * Math.pow(1 + retailEscalator, y);
    const ppaEsc = cfg.strikeMWh * Math.pow(1 + cfg.escalatorPct / 100, y);
    return (retail - ppaEsc) * cfg.p50GWh / 1000 / Math.pow(1 + cfg.discountRate / 100, y + 1);
  }).reduce((a, b) => a + b, 0);

  const monthlyVppa = Array.from({ length: 12 }, (_, m) => {
    const lmp = cfg.merchantLMP * (1 + (sr(m * 7) - 0.5) * 0.3);
    const settlement = (cfg.strikeMWh - lmp) * cfg.p50GWh / 12000;
    const energyRev = lmp * cfg.p50GWh / 12000;
    return { month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m], lmp: lmp.toFixed(1), settlement: settlement.toFixed(2), energyRev: energyRev.toFixed(2), net: (parseFloat(settlement) + parseFloat(energyRev)).toFixed(2) };
  });

  const corpVolData = [
    { year: 2018, gwh: 40000 }, { year: 2019, gwh: 62000 }, { year: 2020, gwh: 80000 },
    { year: 2021, gwh: 110000 }, { year: 2022, gwh: 135000 }, { year: 2023, gwh: 158000 }, { year: 2024, gwh: 180000 },
  ];

  const re100Data = [
    { year: 2015, count: 70 }, { year: 2016, count: 100 }, { year: 2017, count: 140 },
    { year: 2018, count: 175 }, { year: 2019, count: 218 }, { year: 2020, count: 262 },
    { year: 2021, count: 330 }, { year: 2022, count: 380 }, { year: 2023, count: 414 }, { year: 2024, count: 432 },
  ];

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 16 }}>Corporate PPA Deep Dive — VPPA</div>

      {/* Physical vs VPPA */}
      <SH>Physical PPA vs Virtual VPPA — 8-Dimension Comparison</SH>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.bg }}>
              {['Dimension','Physical PPA','Virtual VPPA (ISDA)'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, fontSize: 11 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {comparisonDims.map(r => (
              <tr key={r.dim} style={{ borderTop: `1px solid ${T.border}` }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: T.text }}>{r.dim}</td>
                <td style={{ padding: '8px 12px', color: T.sub }}>{r.physical}</td>
                <td style={{ padding: '8px 12px', color: T.indigo }}>{r.vppa}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VPPA Settlement Mechanics */}
      <SH>VPPA Settlement Mechanics (Monthly)</SH>
      <div style={{ marginBottom: 8, padding: '10px 14px', background: '#EEF2FF', borderRadius: 8, fontSize: 12 }}>
        <strong>Settlement Formula:</strong> Settlement = (Strike ${cfg.strikeMWh}/MWh − Floating LMP) × Reference MWh
        <br />Developer Net Revenue = Merchant Energy Revenue + Settlement = Strike × Reference MWh (hedged)
      </div>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.bg }}>
              {['Month','LMP $/MWh','Settlement $M (dev receives)','Energy Rev $M','Net to Developer $M'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'right', color: T.sub, fontWeight: 600, fontSize: 10 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {monthlyVppa.map(r => (
              <tr key={r.month} style={{ borderTop: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 600 }}>{r.month}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>${r.lmp}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', color: parseFloat(r.settlement) >= 0 ? T.green : T.red }}>{parseFloat(r.settlement) >= 0 ? '+' : ''}{r.settlement}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', color: T.solar }}>{r.energyRev}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>{r.net}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Corporate Buyer Analysis */}
      <SH>Corporate Buyer Financial Analysis</SH>
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiCard label="RE100 Progress" value={`${ppaPct}%`} sub={`${cfg.p50GWh} GWh vs ${annualConsumptionGWh} GWh load`} color={T.green} />
        <KpiCard label="NPV Savings vs Retail" value={`$${npvSavings.toFixed(1)}M`} sub="20yr @ 2.5% retail escalation" color={T.blue} />
        <KpiCard label="Scope 2 Reduction" value={`${(cfg.p50GWh * 0.386 / 1000).toFixed(1)} ktCO₂`} sub="Market-based method" color={T.teal} />
        <KpiCard label="PPA vs Retail" value={`$${(retailPrice - cfg.strikeMWh).toFixed(1)}/MWh`} sub="Year-1 savings" color={T.accent} />
      </div>

      {/* Corporate PPA Volume */}
      <SH>Global Corporate PPA Volume 2018–2024 (GWh)</SH>
      <div style={{ height: 220, marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={corpVolData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={v => [`${v.toLocaleString()} GWh`]} />
            <Bar dataKey="gwh" fill={T.indigo} name="Corporate PPA Volume (GWh)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Corporate Buyers */}
      <SH>Top Corporate PPA Buyers</SH>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.bg }}>
              {['Company','Sector','Annual MWh','Strike $/MWh','Term','Market','RE100','Structure','Signed'].map(h => (
                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CORPORATE_BUYERS.map(b => (
              <tr key={b.name} style={{ borderTop: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 700 }}>{b.name}</td>
                <td style={{ padding: '7px 10px', color: T.sub }}>{b.sector}</td>
                <td style={{ padding: '7px 10px' }}>{b.mwh.toLocaleString()}</td>
                <td style={{ padding: '7px 10px', color: T.indigo }}>${b.price}</td>
                <td style={{ padding: '7px 10px' }}>{b.term}yr</td>
                <td style={{ padding: '7px 10px' }}>{b.market}</td>
                <td style={{ padding: '7px 10px', color: b.re100 ? T.green : T.sub }}>{b.re100 ? 'Yes' : 'No'}</td>
                <td style={{ padding: '7px 10px', fontSize: 10 }}>{b.structure}</td>
                <td style={{ padding: '7px 10px' }}>{b.signed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RE100 signatory trend */}
      <SH>RE100 Signatory Growth</SH>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={re100Data}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke={T.green} strokeWidth={2} dot={false} name="RE100 Signatories" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Tab 4: Market Intelligence ───────────────────────────────────────────────
function Tab4({ cfg }) {
  const currentPrices = MARKETS.slice(0, 7).map((m, i) => ({
    market: m,
    bid: PPA_PRICE_HISTORY[6][m] - 2 + sr(i * 13) * 2,
    ask: PPA_PRICE_HISTORY[6][m] + 1 + sr(i * 17) * 2,
    liq: MARKET_META[m]?.liq || 6,
    shapeFactor: ((MARKET_META[m]?.cf || 0.2) / 0.20 * 85).toFixed(0),
    curtailRisk: MARKET_META[m]?.curtPct || 0.03,
  }));

  const sectorBreakdown = [
    { name: 'Technology', value: 45 }, { name: 'Retail', value: 20 },
    { name: 'Manufacturing', value: 15 }, { name: 'Finance', value: 10 }, { name: 'Other', value: 10 },
  ];

  const monthlyLMP = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((mo, i) => ({
    month: mo,
    ERCOT: 28 + sr(i * 3) * 12 - 5,
    CAISO: 35 + sr(i * 7) * 14 - 6,
    PJM: 30 + sr(i * 11) * 10 - 4,
    MISO: 24 + sr(i * 17) * 8 - 3,
  }));

  const demandOutlook = [
    { year: 2025, re100Demand: 450, supplyPipeline: 380 },
    { year: 2026, re100Demand: 520, supplyPipeline: 460 },
    { year: 2027, re100Demand: 600, supplyPipeline: 550 },
    { year: 2028, re100Demand: 690, supplyPipeline: 650 },
    { year: 2029, re100Demand: 790, supplyPipeline: 760 },
    { year: 2030, re100Demand: 900, supplyPipeline: 880 },
  ];

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 16 }}>Market Intelligence & Benchmarks</div>

      {/* PPA Price History */}
      <SH>PPA Price History by Market 2018–2024 ($/MWh)</SH>
      <div style={{ height: 280, marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={PPA_PRICE_HISTORY}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={(v, n) => [`$${v.toFixed(1)}/MWh`, n]} />
            <Legend />
            {['ERCOT','CAISO','PJM','MISO','SPP','NYISO','ISO-NE'].map((m, i) => (
              <Line key={m} type="monotone" dataKey={m} stroke={COLORS[i]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Current spot pricing */}
      <SH>Current Spot PPA Pricing — Bid/Ask Spread (2025)</SH>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.bg }}>
              {['Market','Bid $/MWh','Ask $/MWh','Mid $/MWh','Spread','Liquidity (1-10)','Shape Factor %','Curtailment Risk'].map(h => (
                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentPrices.map(r => (
              <tr key={r.market} style={{ borderTop: `1px solid ${T.border}`, background: r.market === cfg.market ? '#EEF2FF' : T.card }}>
                <td style={{ padding: '7px 10px', fontWeight: 700 }}>{r.market}</td>
                <td style={{ padding: '7px 10px', color: T.green }}>${r.bid.toFixed(1)}</td>
                <td style={{ padding: '7px 10px', color: T.red }}>${r.ask.toFixed(1)}</td>
                <td style={{ padding: '7px 10px', color: T.indigo, fontWeight: 700 }}>${((r.bid + r.ask) / 2).toFixed(1)}</td>
                <td style={{ padding: '7px 10px' }}>${(r.ask - r.bid).toFixed(1)}</td>
                <td style={{ padding: '7px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3 }}>
                      <div style={{ width: `${r.liq * 10}%`, height: '100%', background: T.green, borderRadius: 3 }} />
                    </div>
                    {r.liq}/10
                  </div>
                </td>
                <td style={{ padding: '7px 10px' }}>{r.shapeFactor}%</td>
                <td style={{ padding: '7px 10px', color: r.curtailRisk > 0.05 ? T.red : r.curtailRisk > 0.02 ? T.amber : T.green }}>{(r.curtailRisk * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Seasonal LMP heatmap */}
      <SH>Seasonal LMP Patterns — Monthly Average $/MWh</SH>
      <div style={{ height: 260, marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyLMP}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v.toFixed(0)}`} />
            <Tooltip formatter={(v, n) => [`$${v.toFixed(1)}/MWh`, n]} />
            <Legend />
            {['ERCOT','CAISO','PJM','MISO'].map((m, i) => (
              <Line key={m} type="monotone" dataKey={m} stroke={COLORS[i]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Buyer sector breakdown */}
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <SH>Buyer Sector Breakdown (%)</SH>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sectorBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                  {sectorBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={v => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <SH>RE100 Demand vs Supply Pipeline (TWh/yr)</SH>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demandOutlook}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}`} />
                <Tooltip />
                <Legend />
                <Bar dataKey="re100Demand" fill={T.indigo} name="RE100 Demand (TWh)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="supplyPipeline" fill={T.green} name="Supply Pipeline (TWh)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 5: Revenue Stack Builder ─────────────────────────────────────────────
function Tab5({ cfg }) {
  const [streams, setStreams] = useState({
    ppa: true, rec: true, capacity: false, merchant: true, ancillary: false, carbon: false
  });
  const [capacityPriceMWday, setCapacityPriceMWday] = useState(4.5);
  const [ancillaryPriceMWhr, setAncillaryPriceMWhr] = useState(12);
  const [carbonCreditMW, setCarbonCreditMW] = useState(8);

  const netGWh = cfg.p50GWh * (1 - cfg.curtailmentPct / 100);
  const contractedGWh = netGWh * (cfg.contractedPct / 100);
  const merchantGWh = netGWh * (1 - cfg.contractedPct / 100);
  const basisFactor = 1 + cfg.basisPct / 100;

  const annual = {
    ppa: streams.ppa ? contractedGWh * cfg.strikeMWh / 1000 : 0,
    rec: streams.rec ? cfg.p50GWh * cfg.recPrice / 1000 : 0,
    capacity: streams.capacity ? cfg.capacityMW * capacityPriceMWday * 365 / 1000000 : 0,
    merchant: streams.merchant ? merchantGWh * cfg.merchantLMP * basisFactor / 1000 : 0,
    ancillary: (streams.ancillary && cfg.technology === 'Solar+BESS') ? cfg.capacityMW * ancillaryPriceMWhr * 8760 / 1000000 : 0,
    carbon: streams.carbon ? cfg.p50GWh * carbonCreditMW / 1000 : 0,
  };

  const total = Object.values(annual).reduce((a, b) => a + b, 0);
  const streamDefs = [
    { key: 'ppa', label: 'PPA Contracted Energy', color: T.indigo },
    { key: 'rec', label: 'REC / Green Attributes', color: T.green },
    { key: 'capacity', label: 'Capacity Market Payments', color: T.blue },
    { key: 'merchant', label: 'Merchant Uncontracted', color: T.solar },
    { key: 'ancillary', label: 'Ancillary Services (BESS)', color: T.teal },
    { key: 'carbon', label: 'Voluntary Carbon Credits', color: T.accent },
  ];

  // HHI diversification
  const vals = Object.values(annual).filter(v => v > 0);
  const hhi = vals.length > 0 ? vals.reduce((acc, v) => acc + Math.pow(v / (total || 1) * 100, 2), 0) : 10000;

  const stacked20 = Array.from({ length: 20 }, (_, y) => {
    const esc = cfg.strikeMWh * Math.pow(1 + cfg.escalatorPct / 100, y);
    return {
      year: 2025 + y,
      PPA: streams.ppa && y < cfg.ppaTermYr ? contractedGWh * esc / 1000 : 0,
      Merchant: streams.merchant ? merchantGWh * cfg.merchantLMP * (1 + sr(y * 13) * 0.1 - 0.05) * basisFactor / 1000 : 0,
      RECs: streams.rec ? cfg.p50GWh * cfg.recPrice / 1000 : 0,
      Capacity: streams.capacity ? cfg.capacityMW * capacityPriceMWday * 365 / 1000000 : 0,
      Carbon: streams.carbon ? cfg.p50GWh * carbonCreditMW / 1000 : 0,
    };
  });

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 16 }}>Revenue Stack Builder</div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Stream toggles */}
        <div style={{ width: 260 }}>
          <SH>Revenue Stream Controls</SH>
          {streamDefs.map(s => (
            <div key={s.key} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: s.key !== 'ppa' ? 6 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{s.label}</span>
                </div>
                {s.key !== 'ppa' && (
                  <div onClick={() => setStreams(p => ({ ...p, [s.key]: !p[s.key] }))} style={{ width: 32, height: 18, borderRadius: 9, background: streams[s.key] ? T.green : T.border, cursor: 'pointer', position: 'relative' }}>
                    <div style={{ width: 14, height: 14, borderRadius: 7, background: T.card, position: 'absolute', top: 2, left: streams[s.key] ? 16 : 2, transition: 'left 0.2s' }} />
                  </div>
                )}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>${annual[s.key].toFixed(2)}M/yr</div>
              {s.key === 'capacity' && streams.capacity && (
                <SliderInput label="$/MW-day" value={capacityPriceMWday} min={0} max={20} step={0.5} onChange={setCapacityPriceMWday} fmtFn={v => `$${v.toFixed(1)}`} />
              )}
              {s.key === 'ancillary' && streams.ancillary && (
                <SliderInput label="$/MW-hr" value={ancillaryPriceMWhr} min={5} max={30} step={1} onChange={setAncillaryPriceMWhr} fmtFn={v => `$${v}`} />
              )}
              {s.key === 'carbon' && streams.carbon && (
                <SliderInput label="$/tCO₂ credit" value={carbonCreditMW} min={2} max={30} step={1} onChange={setCarbonCreditMW} fmtFn={v => `$${v}`} />
              )}
            </div>
          ))}
          <div style={{ background: T.card, border: `2px solid ${T.accent}`, borderRadius: 8, padding: '10px 14px', marginTop: 8 }}>
            <div style={{ fontSize: 11, color: T.sub }}>Total Annual Revenue</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.accent }}>${total.toFixed(2)}M</div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>HHI Diversification: {hhi.toFixed(0)} {hhi < 2500 ? '(Diversified)' : hhi < 5000 ? '(Moderate)' : '(Concentrated)'}</div>
          </div>
        </div>

        {/* Chart */}
        <div style={{ flex: 1 }}>
          <SH>20-Year Revenue Stack</SH>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stacked20}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} tickFormatter={v => `'${String(v).slice(2)}`} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}M`} />
                <Tooltip formatter={(v, n) => [`$${v.toFixed(2)}M`, n]} />
                <Legend />
                <Bar dataKey="PPA" fill={T.indigo} stackId="a" />
                <Bar dataKey="Merchant" fill={T.solar} stackId="a" />
                <Bar dataKey="RECs" fill={T.green} stackId="a" />
                <Bar dataKey="Capacity" fill={T.blue} stackId="a" />
                <Bar dataKey="Carbon" fill={T.accent} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <SH>Revenue at Risk Analysis</SH>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {streamDefs.filter(s => annual[s.key] > 0).map(s => (
              <div key={s.key} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: T.sub }}>{s.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>${annual[s.key].toFixed(2)}M</div>
                <div style={{ fontSize: 10, color: T.sub, marginTop: 3 }}>
                  {s.key === 'ppa' ? 'Fixed — low risk' : s.key === 'rec' ? 'Moderate volatility' : s.key === 'merchant' ? 'Variable — high risk' : 'Fixed — low risk'}
                </div>
                <div style={{ fontSize: 10, color: T.sub }}>{((annual[s.key] / (total || 1)) * 100).toFixed(1)}% of portfolio</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 6: Merchant Price Risk ───────────────────────────────────────────────
function Tab6({ cfg }) {
  const merchantPct = 100 - cfg.contractedPct;
  const netGWh = cfg.p50GWh * (1 - cfg.curtailmentPct / 100);
  const merchantGWh = netGWh * (merchantPct / 100);
  const basisFactor = 1 + cfg.basisPct / 100;
  const sigma = cfg.merchantSigmaPct / 100;

  // Monte Carlo (500 seeds using sr)
  const mcRuns = Array.from({ length: 500 }, (_, i) => {
    const u1 = Math.max(1e-9, sr(i * 3));
    const u2 = sr(i * 7);
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const lmp = cfg.merchantLMP * (1 + sigma * z);
    return merchantGWh * Math.max(0, lmp) * basisFactor / 1000;
  }).sort((a, b) => a - b);

  const p10 = mcRuns[Math.floor(0.10 * mcRuns.length)];
  const p50 = mcRuns[Math.floor(0.50 * mcRuns.length)];
  const p90 = mcRuns[Math.floor(0.90 * mcRuns.length)];
  const p99 = mcRuns[Math.floor(0.99 * mcRuns.length)];
  const mean = mcRuns.reduce((a, b) => a + b, 0) / (mcRuns.length || 1);
  const varAtRisk = mcRuns[Math.floor(0.05 * mcRuns.length)];
  const cvar = mcRuns.slice(0, Math.floor(0.05 * mcRuns.length)).reduce((a, b) => a + b, 0) / Math.max(1, Math.floor(0.05 * mcRuns.length));

  // Histogram
  const min = mcRuns[0];
  const max = mcRuns[mcRuns.length - 1];
  const buckets = 20;
  const bw = (max - min) / (buckets || 1);
  const histData = Array.from({ length: buckets }, (_, i) => {
    const lo = min + i * bw;
    const hi = lo + bw;
    return { bin: `$${lo.toFixed(1)}`, count: mcRuns.filter(v => v >= lo && v < hi).length };
  });

  const negPriceFreq = [
    { market: 'ERCOT', hours: 380, pct: 4.3, revImpact: -0.8 },
    { market: 'CAISO', hours: 290, pct: 3.3, revImpact: -0.6 },
    { market: 'SPP',   hours: 220, pct: 2.5, revImpact: -0.4 },
    { market: 'MISO',  hours: 160, pct: 1.8, revImpact: -0.3 },
    { market: 'PJM',   hours: 80,  pct: 0.9, revImpact: -0.2 },
    { market: 'NYISO', hours: 40,  pct: 0.5, revImpact: -0.1 },
  ];

  const cannibalCurve = [
    { penetration: 0, valueFactor: 100 }, { penetration: 10, valueFactor: 93 },
    { penetration: 20, valueFactor: 80 }, { penetration: 30, valueFactor: 70 },
    { penetration: 40, valueFactor: 65 }, { penetration: 50, valueFactor: 58 },
    { penetration: 60, valueFactor: 50 }, { penetration: 70, valueFactor: 42 },
  ];

  const hedgeData = [10,20,30,40,50,60,70,80,90,100].map(pct => {
    const ppaRev = netGWh * (pct / 100) * cfg.strikeMWh / 1000;
    const mRev = netGWh * (1 - pct / 100) * cfg.merchantLMP * basisFactor / 1000;
    const mSigma = mRev * sigma;
    const totalSigma = mSigma; // PPA is fixed
    return { contracted: pct, totalRev: (ppaRev + mRev).toFixed(2), revSigma: totalSigma.toFixed(2) };
  });

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 16 }}>Merchant Price Risk Analytics</div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KpiCard label="P10 Merchant Rev" value={`$${p10.toFixed(2)}M`} color={T.red} />
        <KpiCard label="P50 Merchant Rev" value={`$${p50.toFixed(2)}M`} color={T.text} />
        <KpiCard label="P90 Merchant Rev" value={`$${p90.toFixed(2)}M`} color={T.green} />
        <KpiCard label="P99 Merchant Rev" value={`$${p99.toFixed(2)}M`} color={T.teal} />
        <KpiCard label="VaR (95%)" value={`$${varAtRisk.toFixed(2)}M`} color={T.red} />
        <KpiCard label="CVaR (ES)" value={`$${cvar.toFixed(2)}M`} color={T.amber} />
      </div>

      {/* Histogram */}
      <SH>Monte Carlo Merchant Revenue Distribution (500 runs)</SH>
      <div style={{ height: 220, marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="bin" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill={T.indigo} name="Frequency" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Negative price analysis */}
      <SH>Negative LMP Frequency by Market</SH>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.bg }}>
              {['Market','Hours/yr','% of Hours','Annual Revenue Impact $M','Strategy'].map(h => (
                <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {negPriceFreq.map(r => (
              <tr key={r.market} style={{ borderTop: `1px solid ${T.border}`, background: r.market === cfg.market ? '#FFF7ED' : T.card }}>
                <td style={{ padding: '7px 10px', fontWeight: 700 }}>{r.market}</td>
                <td style={{ padding: '7px 10px' }}>{r.hours}</td>
                <td style={{ padding: '7px 10px', color: T.red }}>{r.pct}%</td>
                <td style={{ padding: '7px 10px', color: T.red }}>{r.revImpact}</td>
                <td style={{ padding: '7px 10px', fontSize: 10, color: T.sub }}>Curtail + BESS storage</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Price cannibalization */}
      <SH>Solar Value Factor vs Penetration (Cannibalization)</SH>
      <div style={{ height: 200, marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={cannibalCurve}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="penetration" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} label={{ value: 'Solar Penetration %', position: 'insideBottom', offset: -5, fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={(v, n) => [`${v}%`, 'Value Factor']} />
            <Line type="monotone" dataKey="valueFactor" stroke={T.solar} strokeWidth={2} dot={true} name="Solar Value Factor" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Hedge ratio optimizer */}
      <SH>Hedge Ratio Optimizer — Contracted % vs Revenue Risk</SH>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={hedgeData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="contracted" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}M`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}M`} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="totalRev" stroke={T.indigo} strokeWidth={2} dot={false} name="Total Revenue $M" />
            <Line yAxisId="right" type="monotone" dataKey="revSigma" stroke={T.red} strokeWidth={2} dot={false} name="Revenue σ $M (Risk)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Tab 7: Basis Risk Analytics ─────────────────────────────────────────────
function Tab7({ cfg }) {
  const mMeta = MARKET_META[cfg.market] || MARKET_META.ERCOT;
  const historicalBasis = MARKETS.slice(0, 7).map((m, i) => {
    const bMean = (MARKET_META[m]?.basis || -0.1) * 100;
    return {
      market: m,
      mean: bMean.toFixed(1),
      sigma: (2 + sr(i * 7) * 3).toFixed(1),
      p10: (bMean - 6 - sr(i * 11) * 5).toFixed(1),
      p90: (bMean + 3 + sr(i * 13) * 2).toFixed(1),
      worstCase: (bMean - 12 - sr(i * 17) * 8).toFixed(1),
    };
  });

  const proxyCalcSteps = [
    { step: 1, desc: 'Reference production shape (monthly P50 profile)', value: `${cfg.p50GWh.toFixed(0)} GWh/yr` },
    { step: 2, desc: '× Hub LMP (forward market)', value: `$${cfg.merchantLMP.toFixed(1)}/MWh` },
    { step: 3, desc: '× Basis factor (= 1 − |basis%|)', value: `${(1 + cfg.basisPct / 100).toFixed(3)}` },
    { step: 4, desc: '= Proxy Revenue', value: `$${(cfg.p50GWh * cfg.merchantLMP * (1 + cfg.basisPct / 100) / 1000).toFixed(2)}M` },
  ];

  const basisVaR = cfg.p50GWh * cfg.merchantLMP / 1000 * Math.abs(cfg.basisPct / 100) * 1.645;

  const congestionZones = [
    { zone: 'CAISO SP15 vs NP15', spread: -12, risk: 'High' },
    { zone: 'CAISO NP15 vs ZP26', spread: -8, risk: 'Medium' },
    { zone: 'ERCOT West vs Houston', spread: -18, risk: 'Very High' },
    { zone: 'ERCOT West vs North', spread: -14, risk: 'High' },
    { zone: 'PJM West vs East', spread: -5, risk: 'Low' },
    { zone: 'PJM AEP vs ATSI', spread: -7, risk: 'Medium' },
    { zone: 'MISO Zone 4 vs Zone 5', spread: -9, risk: 'Medium' },
  ];

  const basisDist = Array.from({ length: 24 }, (_, i) => ({
    basis: -30 + i * 1.5,
    prob: Math.exp(-0.5 * Math.pow(((-30 + i * 1.5) - (mMeta.basis * 100)) / 5, 2)) * 20,
  }));

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 16 }}>Basis Risk Analytics</div>
      <div style={{ background: '#EEF2FF', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 12 }}>
        <strong>Basis Risk:</strong> Delivery point LMP − Hub LMP. Solar projects typically deliver at nodes with negative basis vs hub due to local congestion.
        Current market ({cfg.market}): mean basis {(mMeta.basis * 100).toFixed(1)}% | Configured: {cfg.basisPct.toFixed(1)}%
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KpiCard label="Basis Factor" value={(1 + cfg.basisPct / 100).toFixed(3)} sub="Delivery LMP / Hub LMP" />
        <KpiCard label="Annual Revenue Haircut" value={`$${(cfg.p50GWh * cfg.merchantLMP * Math.abs(cfg.basisPct / 100) / 1000).toFixed(2)}M`} color={T.red} />
        <KpiCard label="Basis VaR (95%)" value={`$${basisVaR.toFixed(2)}M`} color={T.red} sub="Annual P5 adverse basis" />
        <KpiCard label="Market Avg Basis" value={`${(mMeta.basis * 100).toFixed(1)}%`} sub={cfg.market} />
      </div>
      <SH>Proxy Revenue Calculation — Step by Step</SH>
      <div style={{ marginBottom: 20 }}>
        {proxyCalcSteps.map(s => (
          <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: T.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{s.step}</div>
            <div style={{ flex: 1, fontSize: 12 }}>{s.desc}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.accent }}>{s.value}</div>
          </div>
        ))}
      </div>
      <SH>Historical Basis Statistics by Market (% vs Hub)</SH>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: T.bg }}>
            {['Market','Mean %','Sigma %','P10 %','P90 %','Worst Case %'].map(h => (
              <th key={h} style={{ padding: '7px 10px', textAlign: 'right', color: T.sub, fontWeight: 600, fontSize: 10 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {historicalBasis.map(r => (
              <tr key={r.market} style={{ borderTop: `1px solid ${T.border}`, background: r.market === cfg.market ? '#EEF2FF' : T.card }}>
                <td style={{ padding: '7px 10px', fontWeight: 700 }}>{r.market}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', color: T.red }}>{r.mean}%</td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>{r.sigma}%</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', color: T.red }}>{r.p10}%</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', color: T.green }}>{r.p90}%</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', color: T.red }}>{r.worstCase}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SH>Basis Distribution — {cfg.market} Node</SH>
      <div style={{ height: 180, marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={basisDist}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="basis" tick={{ fontSize: 10 }} tickFormatter={v => `${v.toFixed(0)}%`} />
            <YAxis hide />
            <Tooltip formatter={(v) => [v.toFixed(2), 'Density']} />
            <Area type="monotone" dataKey="prob" stroke={T.indigo} fill={T.indigo} fillOpacity={0.3} name="Probability" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <SH>Key Congestion Zones & Basis Spreads</SH>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 20 }}>
        {congestionZones.map(z => (
          <div key={z.zone} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600 }}>{z.zone}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.red, marginTop: 4 }}>{z.spread}%</div>
            <div style={{ fontSize: 10, color: T.sub }}>{z.risk} congestion risk</div>
          </div>
        ))}
      </div>
      <SH>Anti-Basis Mitigation Strategies</SH>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
        {[
          { name: 'FACTS Device', cost: '$5-15M', improvement: '+3-6% basis', timeline: '12-24 months' },
          { name: 'New Transmission Line', cost: '$20-80M', improvement: '+8-15% basis', timeline: '36-60 months' },
          { name: 'Hub Price Swap', cost: '0.5-1.5% premium', improvement: 'Basis risk eliminated', timeline: 'Immediate' },
          { name: 'Congestion Revenue Rights', cost: '$0.5-2M/yr', improvement: 'Hedge 50-70% congestion', timeline: 'Annual auction' },
        ].map(m => (
          <div key={m.name} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.indigo }}>{m.name}</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Cost: {m.cost}</div>
            <div style={{ fontSize: 11, color: T.green }}>Benefit: {m.improvement}</div>
            <div style={{ fontSize: 10, color: T.sub }}>Timeline: {m.timeline}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab 8: Curtailment Intelligence ─────────────────────────────────────────
function Tab8({ cfg }) {
  const mMeta = MARKET_META[cfg.market] || MARKET_META.ERCOT;
  const curtGWh = cfg.p50GWh * (cfg.curtailmentPct / 100);
  const econCurtGWh = curtGWh * 0.55;
  const forcedCurtGWh = curtGWh * 0.45;
  const ppaRevLoss = curtGWh * cfg.strikeMWh / 1000;

  const hourlyData = Array.from({ length: 24 }, (_, h) => {
    const isSolar = h >= 7 && h <= 19;
    const isPeak = h >= 11 && h <= 15;
    return { hour: `${h}:00`, curtailPct: isSolar ? (isPeak ? 8 + sr(h * 7) * 6 : 3 + sr(h * 7) * 4) : 0.5 + sr(h * 7) * 0.5 };
  });

  const monthlyData = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((mo, i) => {
    const springFall = (i === 2 || i === 3 || i === 8 || i === 9);
    return { month: mo, curtailPct: springFall ? mMeta.curtPct * 100 * 1.8 + sr(i * 7) * 3 : mMeta.curtPct * 100 * 0.7 + sr(i * 7) * 1.5 };
  });

  const mktCurtail = [
    { market: 'CAISO', min: 3, max: 8, avg: 5.5 },
    { market: 'ERCOT', min: 2, max: 7, avg: 4.8 },
    { market: 'SPP',   min: 2, max: 6, avg: 3.5 },
    { market: 'MISO',  min: 1, max: 4, avg: 2.5 },
    { market: 'PJM',   min: 0, max: 1, avg: 0.7 },
    { market: 'NYISO', min: 0, max: 1, avg: 0.5 },
  ];

  const trendData = [
    { year: 2020, CAISO: 3.2, ERCOT: 2.5, SPP: 1.8 },
    { year: 2021, CAISO: 4.0, ERCOT: 3.1, SPP: 2.2 },
    { year: 2022, CAISO: 4.8, ERCOT: 3.8, SPP: 2.8 },
    { year: 2023, CAISO: 5.5, ERCOT: 4.5, SPP: 3.2 },
    { year: 2024, CAISO: 6.2, ERCOT: 5.2, SPP: 3.5 },
    { year: 2025, CAISO: 7.0, ERCOT: 5.8, SPP: 3.9 },
  ];

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 16 }}>Curtailment Intelligence</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KpiCard label="Total Curtailed GWh" value={curtGWh.toFixed(1)} color={T.red} />
        <KpiCard label="Economic Curtailment" value={`${econCurtGWh.toFixed(1)} GWh`} sub="LMP < $0" color={T.amber} />
        <KpiCard label="Forced Curtailment" value={`${forcedCurtGWh.toFixed(1)} GWh`} sub="Grid dispatch" color={T.red} />
        <KpiCard label="PPA Revenue Loss" value={`$${ppaRevLoss.toFixed(2)}M`} color={T.red} />
        <KpiCard label="Curtailment Rate" value={`${cfg.curtailmentPct.toFixed(1)}%`} color={T.amber} />
      </div>
      <SH>Curtailment Probability by Market (%)</SH>
      <div style={{ height: 200, marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mktCurtail}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="market" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
            <Tooltip />
            <Legend />
            <Bar dataKey="min" fill={T.green} name="Min %" />
            <Bar dataKey="avg" fill={T.amber} name="Avg %" />
            <Bar dataKey="max" fill={T.red} name="Max %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <SH>Curtailment by Hour of Day</SH>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v.toFixed(0)}%`} />
                <Tooltip formatter={(v) => [`${v.toFixed(1)}%`, 'Curtailment']} />
                <Area type="monotone" dataKey="curtailPct" stroke={T.solar} fill={T.solar} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <SH>Curtailment by Month</SH>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v.toFixed(1)}%`} />
                <Tooltip formatter={(v) => [`${v.toFixed(1)}%`, 'Curtailment']} />
                <Bar dataKey="curtailPct" fill={T.red} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <SH>Anti-Curtailment Strategies</SH>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { name: 'Battery Storage (BESS)', eff: 50, capex: '$250-350/kWh', detail: 'Absorbs 40-60% of curtailed energy; dispatch during peak pricing' },
          { name: 'Demand Flexibility', eff: 30, capex: '$1-3M/yr', detail: 'Partner with industrial loads to shift demand to solar peak hours' },
          { name: 'Export to Adjacent Zone', eff: 40, capex: '$10-40M transmission', detail: 'Export curtailed energy via new tie-line to less congested zone' },
          { name: 'CfD Curtailment Provision', eff: 25, capex: 'PPA term negotiation', detail: 'Deemed delivery clause protects developer from curtailment revenue loss' },
        ].map(s => (
          <div key={s.name} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.indigo }}>{s.name}</div>
            <div style={{ height: 6, background: T.border, borderRadius: 3, margin: '6px 0 3px' }}>
              <div style={{ width: `${s.eff}%`, height: '100%', background: T.green, borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 10, color: T.green }}>{s.eff}% curtailment reduction · CapEx: {s.capex}</div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 3 }}>{s.detail}</div>
          </div>
        ))}
      </div>
      <SH>Curtailment Trend — Solar Penetration Effect (%)</SH>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="CAISO" stroke={T.red} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="ERCOT" stroke={T.solar} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="SPP" stroke={T.blue} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Tab 9: Counterparty Risk ─────────────────────────────────────────────────
function Tab9({ cfg }) {
  const pd = PD_BY_RATING[cfg.buyerRating] || 0.005;
  const lgd = cfg.creditEnhancement === 'None' ? 0.60 : 0.40;
  const discountRate = cfg.discountRate / 100;
  const contractedGWh = cfg.p50GWh * (1 - cfg.curtailmentPct / 100) * (cfg.contractedPct / 100);

  const eclByYear = Array.from({ length: Math.min(cfg.ppaTermYr, 20) }, (_, y) => {
    const esc = cfg.strikeMWh * Math.pow(1 + cfg.escalatorPct / 100, y);
    const remainingNPV = Array.from({ length: cfg.ppaTermYr - y }, (_, j) => {
      const fEsc = esc * Math.pow(1 + cfg.escalatorPct / 100, j);
      return contractedGWh * fEsc / 1000 / Math.pow(1 + discountRate, j + 1);
    }).reduce((a, b) => a + b, 0);
    return { year: 2025 + y, exposure: remainingNPV.toFixed(2), ecl: (pd * lgd * remainingNPV).toFixed(3) };
  });

  const migrationMatrix = [
    { from: 'AAA', AA: 92, A: 7, BBB: 0.5, BB: 0.3, D: 0.1 },
    { from: 'AA',  AA: 2,  A: 88, BBB: 8,  BB: 1.5, D: 0.2 },
    { from: 'A',   AA: 0.5,A: 5,  BBB: 85, BB: 8,   D: 0.5 },
    { from: 'BBB', AA: 0,  A: 1,  BBB: 8,  BB: 79,  D: 1.2 },
    { from: 'BB',  AA: 0,  A: 0.5,BBB: 3,  BB: 5,   D: 4.5 },
  ];

  const creditEnhancementCBA = [
    { type: 'No Enhancement', lgdPct: 60, cost: 0 },
    { type: 'Letter of Credit', lgdPct: 40, cost: cfg.lcAmountM * 0.01 },
    { type: 'Parent Guarantee', lgdPct: 35, cost: cfg.lcAmountM * 0.005 },
    { type: 'Escrow', lgdPct: 25, cost: cfg.lcAmountM * 0.005 },
  ];

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 16 }}>Offtake Counterparty Risk</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KpiCard label="Buyer Rating" value={cfg.buyerRating} sub={cfg.buyerType} color={T.indigo} />
        <KpiCard label="Prob of Default" value={`${(pd * 100).toFixed(3)}%`} sub="Annual PD" color={pd > 0.005 ? T.red : T.green} />
        <KpiCard label="LGD" value={`${(lgd * 100).toFixed(0)}%`} sub={cfg.creditEnhancement} color={T.amber} />
        <KpiCard label="ECL Year 1" value={eclByYear.length > 0 ? `$${eclByYear[0].ecl}M` : '—'} color={T.red} />
        <KpiCard label="Exposure Year 1" value={eclByYear.length > 0 ? `$${parseFloat(eclByYear[0].exposure).toFixed(1)}M` : '—'} sub="NPV remaining CF" />
      </div>
      <SH>PD by Rating (S&P Annual)</SH>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {Object.entries(PD_BY_RATING).map(([r, d]) => (
          <div key={r} style={{ background: d < 0.001 ? '#F0FDF4' : d < 0.005 ? '#FFFBEB' : '#FEF2F2', border: `1px solid ${d < 0.001 ? T.green : d < 0.005 ? T.accent : T.red}`, borderRadius: 6, padding: '8px 12px', minWidth: 80, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: d < 0.001 ? T.green : d < 0.005 ? T.accent : T.red }}>{r}</div>
            <div style={{ fontSize: 11, color: T.sub }}>{(d * 100).toFixed(3)}%</div>
          </div>
        ))}
      </div>
      <SH>ECL by Year</SH>
      <div style={{ overflowX: 'auto', maxHeight: 260, overflowY: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead style={{ position: 'sticky', top: 0, background: T.bg }}>
            <tr>{['Year','Exposure $M','ECL $M'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'right', color: T.sub, fontWeight: 600, fontSize: 10 }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {eclByYear.map(r => (
              <tr key={r.year} style={{ borderTop: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 600 }}>{r.year}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>{r.exposure}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', color: T.red }}>{r.ecl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SH>Credit Enhancement Cost-Benefit</SH>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
        {creditEnhancementCBA.map(c => {
          const ecl = pd * (c.lgdPct / 100) * parseFloat(eclByYear[0]?.exposure || 0);
          return (
            <div key={c.type} style={{ background: c.type === cfg.creditEnhancement ? '#EEF2FF' : T.card, border: `1px solid ${c.type === cfg.creditEnhancement ? T.indigo : T.border}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{c.type}</div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 3 }}>LGD: {c.lgdPct}%</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.red, marginTop: 3 }}>ECL: ${ecl.toFixed(3)}M</div>
              <div style={{ fontSize: 11, color: T.sub }}>Annual cost: ${c.cost.toFixed(2)}M</div>
            </div>
          );
        })}
      </div>
      <SH>1-Year Rating Migration Matrix</SH>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead><tr style={{ background: T.bg }}>
            {['From','→AA','→A','→BBB','→BB','→Default'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'right', color: T.sub, fontWeight: 600, fontSize: 10 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {migrationMatrix.map(r => (
              <tr key={r.from} style={{ borderTop: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 700 }}>{r.from}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>{r.AA}%</td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>{r.A}%</td>
                <td style={{ padding: '7px 10px', textAlign: 'right' }}>{r.BBB}%</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', color: T.red }}>{r.BB}%</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', color: T.red }}>{r.D}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 10: Contract Optimization ────────────────────────────────────────────
function Tab10({ cfg }) {
  const terms = [5,10,15,20,25];
  const escalators = [0,1,2,3];
  const discountRate = cfg.discountRate / 100;
  const contractedGWh = cfg.p50GWh * (1 - cfg.curtailmentPct / 100) * (cfg.contractedPct / 100);

  const termAnalysis = terms.map(t => {
    const npv = Array.from({ length: t }, (_, y) => {
      const esc = cfg.strikeMWh * Math.pow(1 + cfg.escalatorPct / 100, y);
      return contractedGWh * esc / 1000 / Math.pow(1 + discountRate, y + 1);
    }).reduce((a, b) => a + b, 0);
    const irr = cfg.targetIRR - (t < 10 ? 2 : t < 15 ? 1 : t >= 20 ? -1 : 0);
    return { term: `${t}yr`, npv: npv.toFixed(1), irr: irr.toFixed(1), risk: t <= 10 ? 'Re-contracting risk' : t <= 15 ? 'Low' : 'Very Low' };
  });

  const escalatorAnalysis = escalators.map(e => {
    const npv = Array.from({ length: 20 }, (_, y) =>
      contractedGWh * cfg.strikeMWh * Math.pow(1 + e / 100, y) / 1000 / Math.pow(1 + discountRate, y + 1)
    ).reduce((a, b) => a + b, 0);
    const nomRev = Array.from({ length: 20 }, (_, y) => contractedGWh * cfg.strikeMWh * Math.pow(1 + e / 100, y) / 1000).reduce((a, b) => a + b, 0);
    return { esc: `${e}%/yr`, nomRev: nomRev.toFixed(1), npv: npv.toFixed(1) };
  });

  const avgRecontract = cfg.strikeMWh * (0.6 + sr(42) * 0.8);
  const expiryWaterfall = Array.from({ length: 26 }, (_, i) => {
    const yr = 2025 + i;
    const expired = PPA_CONTRACTS.filter(c => c.expiryYear <= yr).length;
    const mPct = Math.min(100, expired / PPA_CONTRACTS.length * 100);
    return { year: yr, Contracted: 100 - mPct, Merchant: mPct };
  });

  const renewalProb = [
    { type: 'Utility', prob: 85 }, { type: 'Corporate', prob: 70 },
    { type: 'Municipality', prob: 80 }, { type: 'Cooperative', prob: 75 },
  ];

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 16 }}>Contract Optimization</div>
      <SH>PPA Term Optimization</SH>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: T.bg }}>
            {['Term','NPV $M','Est. IRR %','Risk Profile'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, fontSize: 11 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {termAnalysis.map(r => (
              <tr key={r.term} style={{ borderTop: `1px solid ${T.border}`, background: r.term === `${cfg.ppaTermYr}yr` ? '#EEF2FF' : T.card }}>
                <td style={{ padding: '8px 12px', fontWeight: 700 }}>{r.term}</td>
                <td style={{ padding: '8px 12px', color: T.indigo, fontWeight: 600 }}>${r.npv}M</td>
                <td style={{ padding: '8px 12px', color: T.green }}>{r.irr}%</td>
                <td style={{ padding: '8px 12px', fontSize: 11, color: T.sub }}>{r.risk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SH>Escalator Optimization (20yr Nominal Rev vs NPV)</SH>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: T.bg }}>
            {['Escalator','Nominal 20yr $M','NPV $M'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'right', color: T.sub, fontWeight: 600, fontSize: 11 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {escalatorAnalysis.map(r => (
              <tr key={r.esc} style={{ borderTop: `1px solid ${T.border}`, background: r.esc === `${cfg.escalatorPct}%/yr` ? '#EEF2FF' : T.card }}>
                <td style={{ padding: '8px 12px', fontWeight: 700 }}>{r.esc}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: T.indigo }}>${r.nomRev}M</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: T.green, fontWeight: 700 }}>${r.npv}M</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Avg Re-contracting Price" value={`$${avgRecontract.toFixed(1)}/MWh`} sub="±40% range post-expiry" />
        <KpiCard label="P10 Re-contracting" value={`$${(avgRecontract * 0.6).toFixed(1)}/MWh`} color={T.red} />
        <KpiCard label="P90 Re-contracting" value={`$${(avgRecontract * 1.4).toFixed(1)}/MWh`} color={T.green} />
      </div>
      <SH>Portfolio Expiry Waterfall 2025–2050</SH>
      <div style={{ height: 200, marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={expiryWaterfall}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={(v, n) => [`${v.toFixed(1)}%`, n]} />
            <Legend />
            <Area type="monotone" dataKey="Contracted" stroke={T.indigo} fill={T.indigo} fillOpacity={0.4} stackId="a" />
            <Area type="monotone" dataKey="Merchant" stroke={T.solar} fill={T.solar} fillOpacity={0.4} stackId="a" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <SH>Contract Renewal Probability by Buyer Type</SH>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {renewalProb.map(r => (
          <div key={r.type} style={{ flex: 1, minWidth: 120, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{r.type}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: r.prob >= 80 ? T.green : T.amber, marginTop: 4 }}>{r.prob}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab 11: VPPA Structuring Toolkit ─────────────────────────────────────────
function Tab11({ cfg }) {
  const [floatingLMP, setFloatingLMP] = useState(cfg.merchantLMP);
  const [refVol, setRefVol] = useState(Math.round(cfg.p50GWh / 12));

  const settlement = (cfg.strikeMWh - floatingLMP) * refVol / 1000;
  const energyRev = floatingLMP * refVol / 1000;
  const devNet = cfg.strikeMWh * refVol / 1000;

  const monthlySettlement = Array.from({ length: 12 }, (_, m) => {
    const lmp = cfg.merchantLMP * (1 + (sr(m * 11) - 0.5) * 0.35);
    const settl = (cfg.strikeMWh - lmp) * refVol / 1000;
    return { month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m], lmp: lmp.toFixed(1), settlement: settl.toFixed(3) };
  });

  const greenTariffComparison = [
    { option: 'Utility Green Tariff', cost: 45, complexity: 'Low', additionality: 'Low', re100: 'Partial' },
    { option: 'Virtual VPPA', cost: cfg.strikeMWh, complexity: 'High', additionality: 'High', re100: 'Full' },
    { option: 'Physical PPA (Sleeved)', cost: cfg.strikeMWh + 3, complexity: 'Medium', additionality: 'High', re100: 'Full' },
    { option: 'Retail REC Purchase', cost: 3.5, complexity: 'Very Low', additionality: 'None', re100: 'Partial' },
  ];

  const corpCostComparison = Array.from({ length: 20 }, (_, y) => {
    const retailCost = 65 * Math.pow(1.025, y) * 500 / 1000;
    const netSettl = (cfg.strikeMWh - cfg.merchantLMP * (1 + (sr(y * 17) - 0.5) * 0.1)) * cfg.p50GWh / 1000000;
    return { year: 2025 + y, Retail: retailCost.toFixed(2), WithVPPA: (retailCost - netSettl).toFixed(2) };
  });

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 16 }}>VPPA Structuring Toolkit</div>
      <SH>VPPA Settlement Calculator</SH>
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <SliderInput label="Floating LMP $/MWh" value={floatingLMP} min={5} max={100} step={0.5} onChange={setFloatingLMP} fmtFn={v => `$${v.toFixed(1)}`} />
          <SliderInput label="Reference Volume GWh" value={refVol} min={1} max={200} step={1} onChange={setRefVol} fmtFn={v => `${v} GWh`} />
        </div>
        <div style={{ flex: 1, display: 'flex', gap: 10, flexWrap: 'wrap', alignContent: 'flex-start' }}>
          <KpiCard label="Settlement (Dev)" value={`$${settlement.toFixed(3)}M`} color={settlement >= 0 ? T.green : T.red} sub={settlement >= 0 ? 'Receives from buyer' : 'Pays buyer'} />
          <KpiCard label="Energy Revenue" value={`$${energyRev.toFixed(3)}M`} color={T.solar} />
          <KpiCard label="Dev Net (Hedged)" value={`$${devNet.toFixed(3)}M`} color={T.indigo} sub="= Strike × Vol" />
        </div>
      </div>
      <SH>Monthly Settlement Illustration</SH>
      <div style={{ height: 220, marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlySettlement}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}M`} />
            <Tooltip formatter={(v) => [`$${parseFloat(v).toFixed(3)}M`, 'Settlement']} />
            <Bar dataKey="settlement" name="Settlement $M" fill={T.indigo} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <SH>Procurement Options Comparison</SH>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: T.bg }}>
            {['Option','Cost $/MWh','Complexity','Additionality','RE100'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 600, fontSize: 11 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {greenTariffComparison.map(r => (
              <tr key={r.option} style={{ borderTop: `1px solid ${T.border}`, background: r.option === 'Virtual VPPA' ? '#EEF2FF' : T.card }}>
                <td style={{ padding: '8px 12px', fontWeight: 700 }}>{r.option}</td>
                <td style={{ padding: '8px 12px', color: T.indigo }}>${r.cost.toFixed(1)}</td>
                <td style={{ padding: '8px 12px', color: T.sub }}>{r.complexity}</td>
                <td style={{ padding: '8px 12px', color: r.additionality === 'High' ? T.green : r.additionality === 'None' ? T.red : T.amber }}>{r.additionality}</td>
                <td style={{ padding: '8px 12px', color: r.re100 === 'Full' ? T.green : T.amber }}>{r.re100}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SH>Corporate Total Electricity Cost: With vs Without VPPA ($M/yr)</SH>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={corpCostComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}M`} />
            <Tooltip formatter={(v, n) => [`$${parseFloat(v).toFixed(1)}M`, n]} />
            <Legend />
            <Line type="monotone" dataKey="Retail" stroke={T.red} strokeWidth={2} dot={false} name="Retail Only" />
            <Line type="monotone" dataKey="WithVPPA" stroke={T.green} strokeWidth={2} dot={false} name="With VPPA" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Tab 12: Revenue Forecasting ──────────────────────────────────────────────
function Tab12({ cfg }) {
  const discountRate = cfg.discountRate / 100;
  const contractedGWh = cfg.p50GWh * (1 - cfg.curtailmentPct / 100) * (cfg.contractedPct / 100);
  const merchantGWh = cfg.p50GWh * (1 - cfg.curtailmentPct / 100) * (1 - cfg.contractedPct / 100);
  const basisFactor = 1 + cfg.basisPct / 100;
  const p90GWh = cfg.p50GWh * 0.90;
  const mCF = MONTHLY_CF[cfg.technology] || MONTHLY_CF['Solar'];

  const budget5yr = Array.from({ length: 5 }, (_, y) => {
    const esc = cfg.strikeMWh * Math.pow(1 + cfg.escalatorPct / 100, y);
    const p50Rev = contractedGWh * esc / 1000 + merchantGWh * cfg.merchantLMP * basisFactor / 1000 + cfg.p50GWh * cfg.recPrice / 1000;
    const p90Rev = p90GWh * (1 - cfg.curtailmentPct / 100) * (cfg.contractedPct / 100) * esc / 1000 + merchantGWh * 0.9 * cfg.merchantLMP * basisFactor / 1000;
    const budget = p50Rev * 0.95;
    const actual = budget * (0.93 + sr(y * 13) * 0.12);
    return { year: 2025 + y, p50: p50Rev.toFixed(2), p90: p90Rev.toFixed(2), budget: budget.toFixed(2), actual: actual.toFixed(2), variance: (actual - budget).toFixed(2) };
  });

  const monthlyForecast = mCF.map((cf, i) => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
    productionGWh: parseFloat((cfg.capacityMW * cf * 730 / 1000).toFixed(1)),
    ppaRev: parseFloat(((cfg.capacityMW * cf * 730 / 1000) * (cfg.contractedPct / 100) * cfg.strikeMWh / 1000).toFixed(3)),
  }));

  const rar99 = (contractedGWh * cfg.strikeMWh / 1000 + merchantGWh * cfg.merchantLMP * basisFactor / 1000) * 0.70;
  const lenderP90 = p90GWh * (1 - cfg.curtailmentPct / 100) * cfg.strikeMWh / 1000 * basisFactor;

  const elasticityData = [-10,-5,-2,0,2,5,10].map(delta => ({
    priceDelta: `${delta >= 0 ? '+' : ''}${delta}`,
    revChange: ((merchantGWh * delta) / 1000).toFixed(2),
  }));

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 16 }}>Revenue Forecasting & Budgeting</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KpiCard label="Revenue at Risk (99%)" value={`$${rar99.toFixed(2)}M`} color={T.red} sub="Worst-case annual" />
        <KpiCard label="Lender P90 Revenue" value={`$${lenderP90.toFixed(2)}M`} color={T.blue} sub="DSCR sizing base" />
        <KpiCard label="P50 Revenue" value={`$${parseFloat(budget5yr[0]?.p50 || 0).toFixed(2)}M`} color={T.green} />
        <KpiCard label="Budget (×0.95)" value={`$${parseFloat(budget5yr[0]?.budget || 0).toFixed(2)}M`} color={T.accent} />
      </div>
      <SH>5-Year Revenue Budget</SH>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: T.bg }}>
            {['Year','P50 $M','P90 $M','Budget $M','Actual $M','Variance $M'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'right', color: T.sub, fontWeight: 600, fontSize: 11 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {budget5yr.map(r => (
              <tr key={r.year} style={{ borderTop: `1px solid ${T.border}` }}>
                <td style={{ padding: '8px 12px', fontWeight: 700 }}>{r.year}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: T.green }}>{r.p50}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: T.amber }}>{r.p90}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: T.indigo }}>{r.budget}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{r.actual}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: parseFloat(r.variance) >= 0 ? T.green : T.red, fontWeight: 700 }}>{parseFloat(r.variance) >= 0 ? '+' : ''}{r.variance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SH>Monthly Production & Revenue Forecast</SH>
      <div style={{ height: 220, marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyForecast}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => `${v}GWh`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}M`} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="productionGWh" fill={T.solar} name="Production GWh" radius={[2,2,0,0]} />
            <Bar yAxisId="right" dataKey="ppaRev" fill={T.indigo} name="PPA Rev $M" radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <SH>Revenue Sensitivity to Merchant LMP ($/MWh shift)</SH>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={elasticityData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="priceDelta" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}M`} />
            <Tooltip formatter={(v) => [`$${v}M`, 'Revenue Δ']} />
            <Bar dataKey="revChange" name="Revenue Δ $M" fill={T.indigo} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Tab 13: Portfolio Analytics ──────────────────────────────────────────────
function Tab13({ cfg }) {
  const typeTotals = {};
  PPA_CONTRACTS.forEach(c => { typeTotals[c.type] = (typeTotals[c.type] || 0) + c.annualGWh * c.strikeMWh / 1000; });
  const typeBreakdown = Object.entries(typeTotals).map(([k, v]) => ({ name: k, value: parseFloat(v.toFixed(1)) }));
  const totalPortfolioRev = PPA_CONTRACTS.reduce((a, c) => a + c.annualGWh * c.strikeMWh / 1000, 0);
  const sorted = [...PPA_CONTRACTS].sort((a, b) => (b.annualGWh * b.strikeMWh) - (a.annualGWh * a.strikeMWh));
  const top3Pct = sorted.slice(0, 3).reduce((a, c) => a + c.annualGWh * c.strikeMWh / 1000, 0) / (totalPortfolioRev || 1) * 100;
  const totalGWh = PPA_CONTRACTS.reduce((a, c) => a + c.annualGWh, 0);
  const wale = PPA_CONTRACTS.reduce((a, c) => a + c.termYr * c.annualGWh, 0) / (totalGWh || 1);
  const contractedVol = PPA_CONTRACTS.reduce((a, c) => a + c.annualGWh * c.contractedPct, 0);
  const merchantVol = PPA_CONTRACTS.reduce((a, c) => a + c.annualGWh * (1 - c.contractedPct), 0);
  const splitData = [
    { name: 'Contracted', value: parseFloat((contractedVol / 1000).toFixed(1)) },
    { name: 'Merchant', value: parseFloat((merchantVol / 1000).toFixed(1)) },
  ];

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 16 }}>Portfolio Revenue Analytics</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KpiCard label="Total Portfolio Rev" value={`$${totalPortfolioRev.toFixed(1)}M`} color={T.indigo} />
        <KpiCard label="Portfolio WALE" value={`${wale.toFixed(1)} yrs`} color={T.blue} />
        <KpiCard label="Top-3 Concentration" value={`${top3Pct.toFixed(1)}%`} color={top3Pct > 50 ? T.red : T.green} />
        <KpiCard label="Total Contracts" value={`${PPA_CONTRACTS.length}`} color={T.teal} />
      </div>
      <SH>PPA Contract Register</SH>
      <div style={{ overflowX: 'auto', maxHeight: 300, overflowY: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead style={{ position: 'sticky', top: 0, background: T.bg }}>
            <tr>{['#','Project','Cap MW','Market','Type','Strike','GWh/yr','Rev $M','Rating','Term','Expiry'].map(h => <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, fontSize: 10 }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {PPA_CONTRACTS.map(c => (
              <tr key={c.id} style={{ borderTop: `1px solid ${T.border}`, background: c.id % 2 === 0 ? T.bg : T.card }}>
                <td style={{ padding: '6px 10px', color: T.sub }}>{c.id}</td>
                <td style={{ padding: '6px 10px', fontWeight: 600 }}>{c.project}</td>
                <td style={{ padding: '6px 10px' }}>{c.capacityMW}</td>
                <td style={{ padding: '6px 10px' }}>{c.market}</td>
                <td style={{ padding: '6px 10px', fontSize: 10, color: T.indigo }}>{c.type}</td>
                <td style={{ padding: '6px 10px', color: T.green, fontWeight: 700 }}>${c.strikeMWh.toFixed(1)}</td>
                <td style={{ padding: '6px 10px' }}>{c.annualGWh}</td>
                <td style={{ padding: '6px 10px', color: T.indigo }}>{(c.annualGWh * c.strikeMWh / 1000).toFixed(1)}</td>
                <td style={{ padding: '6px 10px', color: c.buyerRating.startsWith('BB') ? T.red : T.green, fontSize: 10 }}>{c.buyerRating}</td>
                <td style={{ padding: '6px 10px' }}>{c.termYr}yr</td>
                <td style={{ padding: '6px 10px' }}>{c.expiryYear}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <SH>Revenue by Contract Type</SH>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeBreakdown} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name.split('+')[0]} $${value.toFixed(0)}M`} labelLine={false}>
                  {typeBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={v => [`$${v}M`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <SH>Contracted vs Merchant Volume (TWh/yr)</SH>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={splitData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}TWh`}>
                  {splitData.map((_, i) => <Cell key={i} fill={i === 0 ? T.indigo : T.solar} />)}
                </Pie>
                <Tooltip formatter={v => [`${v} TWh/yr`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 14: Negotiation Toolkit ──────────────────────────────────────────────
function Tab14({ cfg }) {
  const priorityMatrix = [
    { term: 'PPA Strike Price', dev: 10, buyer: 9, note: 'Both sides highly motivated' },
    { term: 'Credit Support', dev: 9, buyer: 5, note: 'Dev wants large LC; buyer resists cost' },
    { term: 'Basis Risk Allocation', dev: 8, buyer: 6, note: 'Physical: on buyer; VPPA: on developer' },
    { term: 'Curtailment Provision', dev: 9, buyer: 4, note: 'Developer pushes for deemed delivery' },
    { term: 'Price Escalator', dev: 7, buyer: 8, note: 'Buyer prefers fixed; dev prefers escalating' },
    { term: 'Termination Fee', dev: 9, buyer: 3, note: 'Dev wants large breakage fee' },
    { term: 'Change in Law', dev: 7, buyer: 6, note: 'Policy risk allocation — key post-IRA' },
    { term: 'Force Majeure', dev: 6, buyer: 8, note: 'Breadth of excused events' },
  ];

  const timeline = [
    { week: 1,  milestone: 'LOI executed',              done: true },
    { week: 3,  milestone: 'Credit check completed',    done: true },
    { week: 6,  milestone: 'Term sheet agreed',         done: false, active: true },
    { week: 8,  milestone: 'Legal counsel engaged',     done: false },
    { week: 12, milestone: 'Draft PPA circulated',      done: false },
    { week: 16, milestone: 'PPA executed',              done: false },
    { week: 20, milestone: 'FID / NTP',                 done: false },
  ];

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 16 }}>PPA Negotiation Toolkit</div>
      <SH>PPA Term Sheet — {cfg.projectName}</SH>
      <div style={{ background: T.card, border: `2px solid ${T.accent}`, borderRadius: 10, padding: 20, marginBottom: 20, fontFamily: 'Georgia, serif' }}>
        <div style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', borderBottom: `1px solid ${T.border}`, paddingBottom: 10, marginBottom: 14 }}>POWER PURCHASE AGREEMENT — TERM SHEET (NON-BINDING)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '7px 16px', fontSize: 12 }}>
          {[
            ['Seller', cfg.projectName],
            ['Buyer', `${cfg.buyerType} — ${cfg.buyerSector}`],
            ['Capacity', `${cfg.capacityMW} MW (AC) — ${cfg.technology}`],
            ['Commercial Operation', `Q1 ${cfg.codYear}`],
            ['Delivery Point', cfg.deliveryNode || 'Hub'],
            ['Contract Price', `$${cfg.strikeMWh.toFixed(2)}/MWh${cfg.escalatorPct > 0 ? ` + ${cfg.escalatorPct}%/yr` : ''}`],
            ['Term', `${cfg.ppaTermYr} years from COD`],
            ['Contracted Volume', `${cfg.contractedPct}% of net generation`],
            ['Credit Support', `${cfg.creditEnhancement}${cfg.creditEnhancement === 'Letter of Credit' ? ` ($${cfg.lcAmountM}M)` : ''}`],
            ['Termination', 'Cure 30 days; breakage = mark-to-market NPV'],
            ['Force Majeure', 'Standard EEI — excludes price and market changes'],
            ['Change in Law', '30-day renegotiation window on material policy change'],
          ].map(([k, v]) => (
            <React.Fragment key={k}>
              <div style={{ fontWeight: 700, color: T.sub, fontSize: 11 }}>{k}</div>
              <div style={{ color: T.text }}>{v}</div>
            </React.Fragment>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 10, color: T.sub, fontStyle: 'italic', textAlign: 'center' }}>Non-binding — subject to execution of definitive PPA.</div>
      </div>
      <SH>Negotiation Priority Matrix</SH>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: T.bg }}>
            {['PPA Term','Dev Priority','Buyer Priority','Note'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, fontSize: 10 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {priorityMatrix.map(r => (
              <tr key={r.term} style={{ borderTop: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 600 }}>{r.term}</td>
                <td style={{ padding: '7px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 50, height: 6, background: T.border, borderRadius: 3 }}><div style={{ width: `${r.dev * 10}%`, height: '100%', background: T.indigo, borderRadius: 3 }} /></div>
                    <span style={{ fontWeight: 700, color: T.indigo }}>{r.dev}</span>
                  </div>
                </td>
                <td style={{ padding: '7px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 50, height: 6, background: T.border, borderRadius: 3 }}><div style={{ width: `${r.buyer * 10}%`, height: '100%', background: T.teal, borderRadius: 3 }} /></div>
                    <span style={{ fontWeight: 700, color: T.teal }}>{r.buyer}</span>
                  </div>
                </td>
                <td style={{ padding: '7px 10px', fontSize: 11, color: T.sub }}>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SH>Execution Timeline</SH>
      <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: 8 }}>
        {timeline.map((t, i) => (
          <React.Fragment key={t.milestone}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: t.done ? T.green : t.active ? T.accent : T.border, display: 'flex', alignItems: 'center', justifyContent: 'center', color: (!t.done && !t.active) ? T.sub : '#FFF', fontWeight: 700, fontSize: 11 }}>
                {t.done ? '✓' : t.week}
              </div>
              <div style={{ fontSize: 9, textAlign: 'center', color: T.sub, marginTop: 4, maxWidth: 80 }}>Wk {t.week}: {t.milestone}</div>
            </div>
            {i < timeline.length - 1 && <div style={{ flex: 1, height: 2, background: timeline[i + 1]?.done ? T.green : T.border, minWidth: 16 }} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Tab 15: Carbon & RECs ────────────────────────────────────────────────────
function Tab15({ cfg }) {
  const srecHistory = [
    { year: 2018, NJ: 220, MA: 310, DC: 390 }, { year: 2019, NJ: 235, MA: 295, DC: 420 },
    { year: 2020, NJ: 210, MA: 280, DC: 400 }, { year: 2021, NJ: 190, MA: 340, DC: 450 },
    { year: 2022, NJ: 175, MA: 360, DC: 460 }, { year: 2023, NJ: 150, MA: 380, DC: 430 },
    { year: 2024, NJ: 165, MA: 400, DC: 450 },
  ];
  const recMarkets = [
    { market: 'NJ SRECs', price: 165, type: 'SREC', eligible: false },
    { market: 'MA SRECs II', price: 380, type: 'SREC', eligible: false },
    { market: 'DC SRECs', price: 450, type: 'SREC', eligible: false },
    { market: 'National RECs', price: 3.5, type: 'REC', eligible: true },
    { market: 'EU GOs', price: 4.2, type: 'GO', eligible: false },
    { market: 'I-RECs', price: 2.8, type: 'I-REC', eligible: cfg.irecExport },
    { market: 'Gold Standard VERs', price: 12, type: 'VER', eligible: true },
  ];
  const bundleRev = cfg.p50GWh * cfg.recPrice / 1000 * 1.15;
  const optRev = cfg.p50GWh * cfg.recPrice / 1000;

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 16 }}>Carbon & RECs Market</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KpiCard label="National REC Revenue" value={`$${optRev.toFixed(2)}M`} sub={`${cfg.p50GWh} GWh × $${cfg.recPrice}/MWh`} color={T.green} />
        <KpiCard label="Bundled PPA+REC" value={`$${bundleRev.toFixed(2)}M`} sub="+15% bundling premium" color={T.indigo} />
        <KpiCard label="Carbon Additionality" value={cfg.carbonAdditionality ? `+$${(cfg.p50GWh * 3.5 / 1000).toFixed(2)}M` : 'Off'} color={cfg.carbonAdditionality ? T.green : T.sub} />
      </div>
      <SH>REC / EAC Market Overview</SH>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: T.bg }}>
            {['Market','Price USD/MWh','Type','This Project Eligible?'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, fontSize: 10 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {recMarkets.map(r => (
              <tr key={r.market} style={{ borderTop: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 700 }}>{r.market}</td>
                <td style={{ padding: '7px 10px', color: T.green, fontWeight: 700 }}>${r.price.toFixed(1)}</td>
                <td style={{ padding: '7px 10px', color: T.indigo }}>{r.type}</td>
                <td style={{ padding: '7px 10px', color: r.eligible ? T.green : T.sub }}>{r.eligible ? 'Yes' : 'Subject to eligibility'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SH>SREC Price History — NJ / MA / DC ($/SREC)</SH>
      <div style={{ height: 220, marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={srecHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={(v, n) => [`$${v}/SREC`, n]} />
            <Legend />
            <Line type="monotone" dataKey="NJ" stroke={T.green} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="MA" stroke={T.blue} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="DC" stroke={T.accent} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <SH>Bundling Strategy</SH>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { strategy: 'Bundled PPA + RECs', revenue: bundleRev, pros: 'Premium pricing, single buyer, simpler', cons: 'Must find buyer who wants both' },
          { strategy: 'Unbundled RECs', revenue: optRev, pros: 'Access highest SREC market; optimize separately', cons: 'Two counterparties; REC price uncertainty' },
        ].map(s => (
          <div key={s.strategy} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{s.strategy}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.green, marginTop: 6 }}>${s.revenue.toFixed(2)}M/yr</div>
            <div style={{ fontSize: 11, color: T.green, marginTop: 6 }}>✓ {s.pros}</div>
            <div style={{ fontSize: 11, color: T.red, marginTop: 3 }}>✗ {s.cons}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab 16: Regulatory Intelligence ──────────────────────────────────────────
function Tab16({ cfg }) {
  const [filterState, setFilterState] = useState('');
  const filtered = filterState ? STATE_RPS.filter(s => s.state.toLowerCase().includes(filterState.toLowerCase())) : STATE_RPS;

  const iraTable = [
    { item: 'Base ITC', value: `${cfg.itcPct}%`, notes: 'Prevailing wage + apprenticeship required for full credit' },
    { item: 'Domestic Content', value: '+10%', notes: '≥40% US content in steel/iron/mfg components' },
    { item: 'Energy Community', value: '+10%', notes: 'Brownfield, coal closure, or fossil fuel employment community' },
    { item: 'Low-Income', value: '+10-20%', notes: 'Low-income census tract or tribal land' },
    { item: 'Direct Pay', value: 'Refundable', notes: 'Tax-exempt entities can elect direct pay (utilities, munis)' },
    { item: 'Transferability', value: 'Sellable', notes: 'ITC/PTC can be sold to unrelated party for cash' },
  ];

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 16 }}>Regulatory Intelligence</div>
      <SH>State RPS Table</SH>
      <div style={{ marginBottom: 10 }}>
        <input value={filterState} onChange={e => setFilterState(e.target.value)} placeholder="Filter state..."
          style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, width: 200 }} />
      </div>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: T.bg }}>
            {['State','RPS Target %','Year','SREC Program','Penalty $/MWh'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, fontSize: 10 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.state} style={{ borderTop: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 700 }}>{r.state}</td>
                <td style={{ padding: '7px 10px', color: r.target >= 100 ? T.green : T.indigo, fontWeight: 700 }}>{r.target}%</td>
                <td style={{ padding: '7px 10px' }}>{r.year || 'No mandate'}</td>
                <td style={{ padding: '7px 10px', color: r.srec ? T.green : T.sub }}>{r.srec ? 'Yes' : 'No'}</td>
                <td style={{ padding: '7px 10px', color: r.penalty > 0 ? T.red : T.sub }}>{r.penalty > 0 ? `$${r.penalty}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SH>IRA 2022 — ITC/PTC Interaction with PPA</SH>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: T.bg }}>
            {['Provision','Value','Notes'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, fontSize: 10 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {iraTable.map(r => (
              <tr key={r.item} style={{ borderTop: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 700 }}>{r.item}</td>
                <td style={{ padding: '7px 10px', color: T.green, fontWeight: 700 }}>{r.value}</td>
                <td style={{ padding: '7px 10px', fontSize: 11, color: T.sub }}>{r.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SH>FERC Order 2023 — Interconnection Reforms</SH>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { reform: 'Cluster Processing', detail: 'Projects studied in clusters — 18 months faster', impact: '↓ 40% study timeline' },
          { reform: 'Financial Security', detail: 'Higher deposits early reduce speculative queue', impact: '↓ Queue backlogs 60%' },
          { reform: 'Timeline Caps', detail: 'ISOs must complete studies within statutory deadlines', impact: '3yr max queue-to-interconnect' },
        ].map(r => (
          <div key={r.reform} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.indigo }}>{r.reform}</div>
            <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{r.detail}</div>
            <div style={{ fontSize: 11, color: T.green, marginTop: 4, fontWeight: 700 }}>{r.impact}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab 17: Documentation Tracker ────────────────────────────────────────────
function Tab17({ cfg }) {
  const [checklist, setChecklist] = useState({
    loi: true, creditCheck: true, termSheet: false, legalCounsel: false,
    isdaEei: false, corpApprovals: false, envAttributes: false, ferc: false,
    utilityNotif: false, finalPpa: false, cpSatisfied: false,
  });
  const toggle = key => setChecklist(c => ({ ...c, [key]: !c[key] }));

  const items = [
    { key: 'loi', label: 'LOI executed', cat: 'Pre-Negotiation' },
    { key: 'creditCheck', label: 'Credit check & due diligence completed', cat: 'Pre-Negotiation' },
    { key: 'termSheet', label: 'Term sheet agreed (bilateral sign-off)', cat: 'Negotiation' },
    { key: 'legalCounsel', label: 'Legal counsel engaged (both parties)', cat: 'Negotiation' },
    { key: 'isdaEei', label: 'ISDA/EEI master agreement agreed (if VPPA)', cat: 'Documentation' },
    { key: 'corpApprovals', label: 'Corporate board approvals obtained', cat: 'Documentation' },
    { key: 'envAttributes', label: 'Environmental attributes treatment agreed', cat: 'Documentation' },
    { key: 'ferc', label: 'FERC filings submitted (if wholesale)', cat: 'Regulatory' },
    { key: 'utilityNotif', label: 'Utility notification completed', cat: 'Regulatory' },
    { key: 'finalPpa', label: 'Final PPA executed (all parties)', cat: 'Execution' },
    { key: 'cpSatisfied', label: 'Conditions Precedent satisfied / NTP', cat: 'Execution' },
  ];

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const pct = Math.round(completedCount / items.length * 100);
  const cats = ['Pre-Negotiation','Negotiation','Documentation','Regulatory','Execution'];

  const versionTracker = [
    { ver: 'v0.1', date: '2025-01-08', author: 'Dev Legal', note: 'Initial draft — standard form' },
    { ver: 'v0.2', date: '2025-01-22', author: 'Buyer Legal', note: 'Credit support reduction; FM expansion' },
    { ver: 'v0.3', date: '2025-02-05', author: 'Dev Legal', note: 'Accepted FM; maintained LC at $5M' },
    { ver: 'v1.0', date: '2025-02-19', author: 'Both Parties', note: 'FINAL — execution ready' },
  ];

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 16 }}>Deal Documentation Tracker</div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 700 }}>PPA Execution Progress</span>
          <span style={{ fontWeight: 700, color: pct === 100 ? T.green : T.accent }}>{pct}% ({completedCount}/{items.length})</span>
        </div>
        <div style={{ height: 12, background: T.border, borderRadius: 6 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? T.green : T.accent, borderRadius: 6, transition: 'width 0.4s' }} />
        </div>
      </div>
      {cats.map(cat => {
        const catItems = items.filter(i => i.cat === cat);
        const done = catItems.filter(i => checklist[i.key]).length;
        return (
          <div key={cat} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cat}</div>
              <div style={{ fontSize: 11, color: done === catItems.length ? T.green : T.sub }}>{done}/{catItems.length}</div>
            </div>
            {catItems.map(item => (
              <div key={item.key} onClick={() => toggle(item.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', background: T.card, border: `1px solid ${checklist[item.key] ? T.green : T.border}`, borderRadius: 8, marginBottom: 5, cursor: 'pointer' }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: checklist[item.key] ? T.green : T.card, border: `2px solid ${checklist[item.key] ? T.green : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {checklist[item.key] && <span style={{ color: '#FFF', fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 12, color: checklist[item.key] ? T.text : T.sub }}>{item.label}</span>
              </div>
            ))}
          </div>
        );
      })}
      <SH>Document Version Tracker</SH>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: T.bg }}>
            {['Version','Date','Author','Key Changes'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, fontSize: 10 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {versionTracker.map(r => (
              <tr key={r.ver} style={{ borderTop: `1px solid ${T.border}`, background: r.ver === 'v1.0' ? '#F0FDF4' : T.card }}>
                <td style={{ padding: '7px 10px', fontWeight: 700, color: r.ver === 'v1.0' ? T.green : T.text }}>{r.ver}</td>
                <td style={{ padding: '7px 10px' }}>{r.date}</td>
                <td style={{ padding: '7px 10px', color: T.sub }}>{r.author}</td>
                <td style={{ padding: '7px 10px', fontSize: 11 }}>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 18: Intelligence Report ──────────────────────────────────────────────
function Tab18({ cfg }) {
  const mMeta = MARKET_META[cfg.market] || MARKET_META.ERCOT;
  const pd = PD_BY_RATING[cfg.buyerRating] || 0.005;
  const contractedGWh = cfg.p50GWh * (1 - cfg.curtailmentPct / 100) * (cfg.contractedPct / 100);
  const merchantGWh = cfg.p50GWh * (1 - cfg.curtailmentPct / 100) * (1 - cfg.contractedPct / 100);
  const basisFactor = 1 + cfg.basisPct / 100;
  const ppaRev = contractedGWh * cfg.strikeMWh / 1000;
  const merchantRev = merchantGWh * cfg.merchantLMP * basisFactor / 1000;
  const recRev = cfg.p50GWh * cfg.recPrice / 1000;
  const totalRev = ppaRev + merchantRev + recRev;
  const discountRate = cfg.discountRate / 100;
  const npv = Array.from({ length: cfg.ppaTermYr }, (_, y) => {
    const esc = cfg.strikeMWh * Math.pow(1 + cfg.escalatorPct / 100, y);
    return contractedGWh * esc / 1000 / Math.pow(1 + discountRate, y + 1);
  }).reduce((a, b) => a + b, 0);

  const mktPpa = PPA_PRICE_HISTORY[6][cfg.market] || 35;
  const vsBenchmark = cfg.strikeMWh - mktPpa;
  const basisRating = Math.abs(cfg.basisPct) < 10 ? 'Low' : Math.abs(cfg.basisPct) < 20 ? 'Medium' : 'High';
  const curtailRating = cfg.curtailmentPct < 3 ? 'Low' : cfg.curtailmentPct < 7 ? 'Medium' : 'High';
  const creditRating2 = pd < 0.001 ? 'Strong' : pd < 0.005 ? 'Adequate' : 'Elevated';

  const recommendation = vsBenchmark >= 2 && cfg.curtailmentPct < 8 && pd < 0.01 && cfg.ppaTermYr >= 10 ? 'PROCEED'
    : (cfg.strikeMWh < mktPpa * 0.85 || cfg.ppaTermYr < 10) ? 'PASS' : 'NEGOTIATE';
  const recColor = recommendation === 'PROCEED' ? T.green : recommendation === 'PASS' ? T.red : T.accent;

  const assumptions = [
    { param: 'P50 Production', value: `${cfg.p50GWh} GWh/yr`, source: 'NREL PVWatts / WindPro' },
    { param: 'P90 Production', value: `${Math.round(cfg.p50GWh * 0.9)} GWh/yr`, source: 'P50 × 0.90 haircut' },
    { param: 'Merchant LMP', value: `$${cfg.merchantLMP}/MWh`, source: 'Forward market consensus' },
    { param: 'Basis Factor', value: `${basisFactor.toFixed(3)}`, source: 'Historical node analysis' },
    { param: 'Discount Rate', value: `${cfg.discountRate}%`, source: 'Project WACC estimate' },
    { param: 'ITC', value: `${cfg.itcPct}%`, source: 'IRA 2022 — prevailing wage assumed' },
    { param: 'Curtailment', value: `${cfg.curtailmentPct}%`, source: `${cfg.market} historical average` },
  ];

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 16 }}>Revenue Intelligence Report</div>
      <div style={{ background: T.card, border: `2px solid ${T.accent}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{cfg.projectName}</div>
            <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>{cfg.technology} · {cfg.capacityMW} MW · {cfg.market} · COD {cfg.codYear}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: T.sub }}>Recommendation</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: recColor, letterSpacing: '0.05em', marginTop: 2 }}>{recommendation}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, textTransform: 'uppercase', marginBottom: 10 }}>Asset Summary</div>
            {[['Capacity',`${cfg.capacityMW} MW`],['Technology',cfg.technology],['Market',cfg.market],['COD',`Q1 ${cfg.codYear}`],['P50 Production',`${cfg.p50GWh} GWh/yr`],['P90 Production',`${Math.round(cfg.p50GWh*0.9)} GWh/yr`]].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11 }}>
                <span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, textTransform: 'uppercase', marginBottom: 10 }}>PPA Structure</div>
            {[['Type',cfg.ppaType],['Strike',`$${cfg.strikeMWh}/MWh`],['Escalator',`${cfg.escalatorPct}%/yr`],['Term',`${cfg.ppaTermYr} yrs`],['Contracted',`${cfg.contractedPct}%`],['Offtaker',`${cfg.buyerType} (${cfg.buyerRating})`]].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11 }}>
                <span style={{ color: T.sub }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, textTransform: 'uppercase', marginBottom: 10 }}>Revenue Summary</div>
            {[['P50 Revenue',`$${totalRev.toFixed(1)}M`],['P90 Revenue',`$${(totalRev*0.88).toFixed(1)}M`],['PPA NPV',`$${npv.toFixed(1)}M`],['WALE',`${cfg.ppaTermYr} yrs`],['PPA vs Market',`${vsBenchmark>=0?'+':''}$${vsBenchmark.toFixed(1)}/MWh`],['Project IRR',`${cfg.targetIRR.toFixed(1)}%`]].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11 }}>
                <span style={{ color: T.sub }}>{k}</span>
                <span style={{ fontWeight: 600, color: k==='PPA vs Market'?(vsBenchmark>=0?T.green:T.red):T.text }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { label: 'Basis Risk', rating: basisRating, color: basisRating==='Low'?T.green:basisRating==='Medium'?T.amber:T.red },
            { label: 'Curtailment', rating: curtailRating, color: curtailRating==='Low'?T.green:curtailRating==='Medium'?T.amber:T.red },
            { label: 'Counterparty', rating: creditRating2, color: creditRating2==='Strong'?T.green:creditRating2==='Adequate'?T.amber:T.red },
            { label: 'Liquidity', rating: mMeta.liq>=8?'High':mMeta.liq>=6?'Medium':'Low', color: mMeta.liq>=8?T.green:mMeta.liq>=6?T.amber:T.red },
          ].map(r => (
            <div key={r.label} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: T.sub }}>{r.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: r.color, marginTop: 3 }}>{r.rating}</div>
            </div>
          ))}
        </div>
        <div style={{ background: recColor + '18', border: `1px solid ${recColor}`, borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: recColor, marginBottom: 6 }}>{recommendation} — Rationale</div>
          <div style={{ fontSize: 12, color: T.text }}>
            {recommendation === 'PROCEED'
              ? `Strike $${cfg.strikeMWh}/MWh is $${vsBenchmark.toFixed(1)}/MWh above ${cfg.market} benchmark. ${cfg.ppaTermYr}-yr term delivers NPV $${npv.toFixed(1)}M. Offtaker ${cfg.buyerRating} with ${cfg.creditEnhancement}. Curtailment ${cfg.curtailmentPct}% manageable.`
              : recommendation === 'PASS'
              ? `PPA price below market or term too short. Seek higher pricing or longer tenor before proceeding.`
              : `Acceptable structure but renegotiate: ${vsBenchmark<2?'price near market — push for $2+/MWh uplift; ':''}${cfg.curtailmentPct>=8?'curtailment elevated; ':''}${pd>=0.01?'offtaker credit risk elevated — strengthen credit support; ':''}`}
          </div>
        </div>
      </div>
      <SH>Model Assumptions</SH>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: T.bg }}>
            {['Parameter','Value','Source'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, fontSize: 10 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {assumptions.map(r => (
              <tr key={r.param} style={{ borderTop: `1px solid ${T.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 700 }}>{r.param}</td>
                <td style={{ padding: '7px 10px', color: T.indigo, fontWeight: 600 }}>{r.value}</td>
                <td style={{ padding: '7px 10px', fontSize: 11, color: T.sub }}>{r.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PPARevenueAnalyticsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [cfg, setCfg] = useState({
    projectName: 'Solar Farm Alpha',
    technology: 'Solar',
    capacityMW: 150,
    capacityCF: 21,
    p50GWh: 280,
    codYear: '2026',
    ppaType: 'Fixed Price',
    market: 'ERCOT',
    strikeMWh: 34,
    escalatorPct: 0,
    floorMWh: 25,
    capMWh: 55,
    ppaTermYr: 15,
    contractedPct: 100,
    buyerType: 'Corporate',
    buyerRating: 'A',
    creditEnhancement: 'Letter of Credit',
    lcAmountM: 5,
    re100: true,
    buyerSector: 'Technology',
    deliveryNode: 'Hub',
    basisPct: -12,
    curtailmentPct: 3,
    shapeFactor: 88,
    merchantLMP: 32,
    merchantSigmaPct: 28,
    recPrice: 3.5,
    carbonAdditionality: false,
    greenPremium: 0,
    irecExport: false,
    targetIRR: 11,
    discountRate: 8,
    itcPct: 30,
    targetDSCR: 1.25,
  });

  const tabComponents = [Tab1,Tab2,Tab3,Tab4,Tab5,Tab6,Tab7,Tab8,Tab9,Tab10,Tab11,Tab12,Tab13,Tab14,Tab15,Tab16,Tab17,Tab18];
  const ActiveTab = tabComponents[activeTab] || Tab1;

  return (
    <div style={{ display: 'flex', height: '100vh', background: T.bg, fontFamily: 'DM Sans, sans-serif', overflow: 'hidden' }}>
      <Sidebar cfg={cfg} setCfg={setCfg} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: `2px solid ${T.border}`, background: T.card, flexShrink: 0 }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              style={{ padding: '10px 14px', fontSize: 11, fontWeight: activeTab === i ? 700 : 500, color: activeTab === i ? T.accent : T.sub, border: 'none', borderBottom: activeTab === i ? `2px solid ${T.accent}` : '2px solid transparent', background: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', marginBottom: -2 }}>
              {i + 1}. {tab}
            </button>
          ))}
        </div>
        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <ActiveTab cfg={cfg} />
        </div>
      </div>
    </div>
  );
}
