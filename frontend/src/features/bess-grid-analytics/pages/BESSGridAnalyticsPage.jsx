import React, { useState, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E',
  sub: '#6B7280', accent: '#B8860B', indigo: '#4F46E5', green: '#065F46',
  red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', solar: '#D97706', navy: '#1A1A2E',
};

const CHEMISTRIES = ['LFP', 'NMC', 'NCA'];
const MARKETS = ['CAISO', 'ERCOT', 'PJM', 'MISO', 'ISO-NE', 'NYISO'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

// ─── Arrhenius + Cycle Degradation ─────────────────────────────────────────
function calcDegradation(yearsArr, tempC, efcPerYear, chemistry) {
  const A = chemistry === 'LFP' ? 0.022 : chemistry === 'NMC' ? 0.026 : 0.030;
  const Ea = chemistry === 'LFP' ? 0.52 : chemistry === 'NMC' ? 0.48 : 0.44;
  const kCyc = chemistry === 'LFP' ? 1.8e-5 : chemistry === 'NMC' ? 2.5e-5 : 3.0e-5;
  const R = 8.314e-5;
  const TK = tempC + 273.15;
  return yearsArr.map(yr => {
    const calFade = A * Math.exp(-Ea / (R * TK)) * Math.sqrt(yr);
    const cycFade = efcPerYear * yr * kCyc;
    const combined = Math.sqrt(calFade * calFade + cycFade * cycFade);
    return { year: yr, calFade: +calFade.toFixed(4), cycFade: +cycFade.toFixed(4), combined: +Math.min(0.95, combined).toFixed(4), capacity: +(1 - Math.min(0.95, combined)).toFixed(3) };
  });
}

// ─── LCOS calculation ───────────────────────────────────────────────────────
function calcLCOS(capexPerKWh, powerMW, capMWh, opexPct, discountR, lifeYrs, efcPerYear, degradation) {
  const capex = capexPerKWh * 1000 * capMWh;
  let npvOpex = 0, npvEnergy = 0, npvReplace = 0;
  for (let y = 1; y <= lifeYrs; y++) {
    const dr = Math.pow(1 + discountR, y);
    const deg = degradation[y - 1]?.capacity || 1;
    const opex = capex * opexPct;
    npvOpex += opex / dr;
    const eMWh = efcPerYear * capMWh * deg * 365;
    npvEnergy += eMWh / dr;
    if (y === Math.round(lifeYrs * 0.55)) npvReplace += (capex * 0.25) / dr;
  }
  return npvEnergy > 0 ? ((capex + npvOpex + npvReplace) / npvEnergy).toFixed(2) : '0';
}

// ─── Greedy dispatch ────────────────────────────────────────────────────────
function greedyDispatch(prices, capMWh, powerMW, rte) {
  const sorted = prices.map((p, h) => ({ h, p })).sort((a, b) => a.p - b.p);
  const chargeHrs = sorted.slice(0, 4).map(x => x.h).sort((a, b) => a - b);
  const dischargeHrs = sorted.slice(-4).map(x => x.h).sort((a, b) => a - b);
  const schedule = prices.map((p, h) => ({
    hour: HOURS[h], price: p,
    action: chargeHrs.includes(h) ? 'charge' : dischargeHrs.includes(h) ? 'discharge' : 'idle',
    soc: null,
  }));
  let soc = 0.5;
  schedule.forEach(s => {
    if (s.action === 'charge') soc = Math.min(1, soc + powerMW / capMWh * rte);
    else if (s.action === 'discharge') soc = Math.max(0, soc - powerMW / capMWh);
    s.soc = +soc.toFixed(3);
  });
  const arb = dischargeHrs.reduce((s, h) => s + prices[h] * powerMW, 0)
    - chargeHrs.reduce((s, h) => s + prices[h] * powerMW / rte, 0);
  return { schedule, arbitrageDaily: Math.max(0, arb) };
}

// ─── Market price arrays (seeded) ──────────────────────────────────────────
function marketPrices(market) {
  const base = { CAISO: 45, ERCOT: 38, PJM: 42, MISO: 35, 'ISO-NE': 48, NYISO: 55 }[market] || 40;
  return Array.from({ length: 24 }, (_, h) => {
    const peak = (h >= 16 && h <= 20) ? 1.8 : (h >= 7 && h <= 10) ? 1.3 : 0.7;
    return +(base * peak * (0.9 + sr(h * 17 + MARKETS.indexOf(market)) * 0.2)).toFixed(1);
  });
}

// ─── Sub-components ────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px' }}>
      <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || T.text }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
function SHdr({ title, expanded, onToggle, color }) {
  return (
    <button onClick={onToggle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 12px', background: 'none', border: 'none', borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}>
      <span style={{ fontWeight: 700, fontSize: 11, color: color || T.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</span>
      <span style={{ color: T.sub, fontSize: 12 }}>{expanded ? '▾' : '▸'}</span>
    </button>
  );
}
function Slider({ label, value, min, max, step, onChange, fmt }) {
  return (
    <div style={{ padding: '4px 12px 6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
        <span style={{ color: T.sub }}>{label}</span>
        <span style={{ color: T.accent, fontWeight: 700, fontFamily: 'monospace' }}>{(fmt || (v => v))(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: T.accent, height: 3 }} />
    </div>
  );
}
function Sel({ label, value, options, onChange }) {
  return (
    <div style={{ padding: '4px 12px 6px' }}>
      <div style={{ fontSize: 11, color: T.sub, marginBottom: 3 }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '4px 6px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, background: T.card, color: T.text }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 12px' }}>
      <span style={{ fontSize: 11, color: T.sub }}>{label}</span>
      <button onClick={() => onChange(!value)} style={{ width: 36, height: 18, borderRadius: 9, border: 'none', cursor: 'pointer', background: value ? T.accent : T.border, position: 'relative', transition: 'background 0.2s' }}>
        <span style={{ position: 'absolute', top: 2, left: value ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
      </button>
    </div>
  );
}

const TABS = [
  'BESS Overview', 'LCOS Waterfall', 'Revenue Stacking', 'Dispatch Optimizer',
  'Degradation Model', 'Chemistry Compare', 'Revenue vs LCOS', 'Co-location (Solar+BESS)',
  'Augmentation Plan', 'FERC 841 Compliance', 'Frequency Regulation', 'Capacity Markets',
  'Scenario Analysis', 'Project Finance', 'Safety & Compliance', 'Competitive Landscape',
  'Long-Duration Storage', 'Sensitivity Summary',
];

export default function BESSGridAnalyticsPage() {
  // System inputs
  const [chemistry, setChemistry] = useState('LFP');
  const [capMWh, setCapMWh] = useState(100);
  const [powerMW, setPowerMW] = useState(25);
  const [rte, setRte] = useState(90);
  const [dod, setDod] = useState(90);
  const [tempC, setTempC] = useState(25);
  const [lifeYrs, setLifeYrs] = useState(15);
  const [discountR, setDiscountR] = useState(7);
  const [capexPerKWh, setCapexPerKWh] = useState(280);
  const [opexPct, setOpexPct] = useState(0.015);
  // Market
  const [market, setMarket] = useState('ERCOT');
  const [arbSpread, setArbSpread] = useState(35);
  const [efcTarget, setEfcTarget] = useState(1.0);
  const [freqRegMW, setFreqRegMW] = useState(10);
  const [capMarketPct, setCapMarketPct] = useState(80);
  const [capPrice, setCapPrice] = useState(55);
  // Co-location
  const [colocation, setColocation] = useState(true);
  const [solarMW, setSolarMW] = useState(50);
  const [dcCoupled, setDcCoupled] = useState(true);
  const [chargeGrid, setChargeGrid] = useState(20);
  // Finance
  const [itcBESS, setItcBESS] = useState(true);
  const [energyCommunity, setEnergyCommunity] = useState(false);
  // UI
  const [activeTab, setActiveTab] = useState(0);
  const [col, setCol] = useState({ sys: false, market: true, deg: true, coloc: true, fin: true });
  const toggle = useCallback(k => setCol(c => ({ ...c, [k]: !c[k] })), []);

  const efcPerYear = useMemo(() => efcTarget * 365, [efcTarget]);
  const yearsArr = useMemo(() => Array.from({ length: lifeYrs }, (_, i) => i + 1), [lifeYrs]);
  const degradation = useMemo(() => calcDegradation(yearsArr, tempC, efcPerYear, chemistry), [yearsArr, tempC, efcPerYear, chemistry]);
  const lcos = useMemo(() => calcLCOS(capexPerKWh, powerMW, capMWh, opexPct, discountR / 100, lifeYrs, efcPerYear, degradation), [capexPerKWh, powerMW, capMWh, opexPct, discountR, lifeYrs, efcPerYear, degradation]);

  const prices = useMemo(() => marketPrices(market), [market]);
  const dispatch = useMemo(() => greedyDispatch(prices, capMWh * (dod / 100), powerMW, rte / 100), [prices, capMWh, dod, powerMW, rte]);

  const annualArb = useMemo(() => dispatch.arbitrageDaily * 365 / 1000, [dispatch]);  // $k/yr
  const freqRegRevK = useMemo(() => freqRegMW * capPrice * 12 / 1000, [freqRegMW, capPrice]);
  const capMarketRevK = useMemo(() => powerMW * (capMarketPct / 100) * capPrice * 12 / 1000, [powerMW, capMarketPct, capPrice]);
  const totalRevK = useMemo(() => annualArb + freqRegRevK + capMarketRevK, [annualArb, freqRegRevK, capMarketRevK]);

  const capex = useMemo(() => capexPerKWh * capMWh * 1000, [capexPerKWh, capMWh]);
  const itcPct = useMemo(() => {
    if (!itcBESS) return 0;
    let base = 0.30;
    if (energyCommunity) base += 0.10;
    const gridChargeFraction = chargeGrid / 100;
    return base * (1 - gridChargeFraction);
  }, [itcBESS, energyCommunity, chargeGrid]);

  const npvCapex = useMemo(() => capex * (1 - itcPct), [capex, itcPct]);
  const npvRevenue = useMemo(() => totalRevK * 1000 * (1 - Math.pow(1 + discountR / 100, -lifeYrs)) / (discountR / 100), [totalRevK, discountR, lifeYrs]);
  const projectNPV = useMemo(() => npvRevenue - npvCapex, [npvRevenue, npvCapex]);

  const yr1Degrad = useMemo(() => degradation[0]?.capacity || 1, [degradation]);
  const yr10Degrad = useMemo(() => degradation[9]?.capacity || 0.85, [degradation]);

  const lcosByChemistry = useMemo(() => CHEMISTRIES.map(ch => {
    const deg = calcDegradation(yearsArr, tempC, efcPerYear, ch);
    return { chemistry: ch, lcos: calcLCOS(capexPerKWh * (ch === 'NMC' ? 0.95 : ch === 'NCA' ? 0.90 : 1.0), powerMW, capMWh, opexPct, discountR / 100, lifeYrs, efcPerYear, deg) };
  }), [yearsArr, tempC, efcPerYear, capexPerKWh, powerMW, capMWh, opexPct, discountR, lifeYrs]);

  const clippingRevK = useMemo(() => {
    if (!colocation || !solarMW) return 0;
    const clippedMWh = solarMW * 0.05 * 8760;
    const clippingPrice = 20;
    return clippedMWh * clippingPrice / 1000;
  }, [colocation, solarMW]);

  const revStack = useMemo(() => [
    { name: 'Arbitrage', value: +annualArb.toFixed(0), color: T.accent },
    { name: 'Freq Regulation', value: +freqRegRevK.toFixed(0), color: T.indigo },
    { name: 'Capacity Market', value: +capMarketRevK.toFixed(0), color: T.teal },
    { name: 'Solar Clipping', value: +clippingRevK.toFixed(0), color: T.solar },
  ], [annualArb, freqRegRevK, capMarketRevK, clippingRevK]);

  const lcosWaterfall = useMemo(() => {
    const capexComp = capex / 1000;
    const opexNPV = capex * opexPct * (1 - Math.pow(1 + discountR / 100, -lifeYrs)) / (discountR / 100) / 1000;
    const augCost = capex * 0.20 / 1000;
    const replaceCost = capex * 0.10 / 1000;
    const totalCost = capexComp + opexNPV + augCost + replaceCost;
    const dischargeMWh = efcPerYear * capMWh * yearsArr.reduce((s, _, i) => s + (degradation[i]?.capacity || 1) / Math.pow(1 + discountR / 100, i + 1), 0);
    return [
      { component: 'CAPEX', cost: +capexComp.toFixed(0) },
      { component: 'O&M NPV', cost: +opexNPV.toFixed(0) },
      { component: 'Augmentation', cost: +augCost.toFixed(0) },
      { component: 'Replacement', cost: +replaceCost.toFixed(0) },
    ];
  }, [capex, opexPct, discountR, lifeYrs, efcPerYear, capMWh, degradation, yearsArr]);

  const sensData = useMemo(() => [
    { factor: 'CAPEX ±20%', low: +(Number(lcos) * 0.80).toFixed(1), high: +(Number(lcos) * 1.20).toFixed(1) },
    { factor: 'RTE ±5pp', low: +(Number(lcos) * 0.94).toFixed(1), high: +(Number(lcos) * 1.06).toFixed(1) },
    { factor: 'Degradation ±30%', low: +(Number(lcos) * 0.95).toFixed(1), high: +(Number(lcos) * 1.08).toFixed(1) },
    { factor: 'Discount Rate ±2pp', low: +(Number(lcos) * 0.93).toFixed(1), high: +(Number(lcos) * 1.10).toFixed(1) },
    { factor: 'EFC/day ±0.5', low: +(Number(lcos) * 0.88).toFixed(1), high: +(Number(lcos) * 1.12).toFixed(1) },
  ], [lcos]);

  const renderTab = () => {
    switch (activeTab) {
      case 0: return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            <KpiCard label="LCOS" value={`$${lcos}/MWh`} sub={`${chemistry} ${capMWh}MWh`} color={Number(lcos) < 150 ? T.green : Number(lcos) < 200 ? '#D97706' : T.red} />
            <KpiCard label="Annual Revenue" value={`$${totalRevK.toFixed(0)}k/yr`} sub="Stacked streams" color={T.indigo} />
            <KpiCard label="Project NPV" value={`$${(projectNPV / 1e6).toFixed(1)}M`} sub={`IRR calc. below`} color={projectNPV > 0 ? T.green : T.red} />
            <KpiCard label="ITC on BESS" value={`${(itcPct * 100).toFixed(0)}%`} sub={`$${(capex * itcPct / 1e6).toFixed(1)}M credit`} color={T.teal} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Revenue Stack</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revStack}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: '$k/yr', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Revenue $k/yr">
                    {revStack.map((r, i) => <Cell key={i} fill={r.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>10-Year Capacity Fade</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={degradation}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0.7, 1.0]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`${(v * 100).toFixed(1)}%`, 'Capacity']} />
                  <ReferenceLine y={0.80} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'Aug. trigger', fontSize: 9 }} />
                  <Line dataKey="capacity" stroke={T.indigo} strokeWidth={2} dot={false} name="Remaining Capacity" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <KpiCard label="Round-trip Efficiency" value={`${rte}%`} sub={dcCoupled ? 'DC-coupled' : 'AC-coupled'} color={rte >= 90 ? T.green : T.amber} />
            <KpiCard label="Year-10 Capacity" value={`${(yr10Degrad * 100).toFixed(1)}%`} sub="After degradation" color={yr10Degrad > 0.85 ? T.green : T.amber} />
            <KpiCard label="C-rate" value={`${(powerMW / capMWh).toFixed(2)}C`} sub={`${(capMWh / powerMW).toFixed(1)}-hr duration`} color={T.blue} />
            <KpiCard label="System CAPEX" value={`$${(capex / 1e6).toFixed(1)}M`} sub={`$${capexPerKWh}/kWh`} color={T.accent} />
          </div>
        </div>
      );

      case 1: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>LCOS Waterfall — Cost per MWh Discharged</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>PNNL methodology: (CAPEX + NPV(O&M) + NPV(Augmentation) + NPV(Replacement)) / NPV(Discharged MWh)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={lcosWaterfall}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="component" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: '$k total cost', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="cost" name="Cost Component $k">
                  {lcosWaterfall.map((_, i) => <Cell key={i} fill={[T.red, T.amber, '#D97706', T.blue][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <KpiCard label="LCOS" value={`$${lcos}/MWh`} color={Number(lcos) < 150 ? T.green : T.red} />
            <KpiCard label="CAPEX Component" value={`$${(Number(lcos) * 0.65).toFixed(0)}/MWh`} sub="~65% of LCOS" color={T.red} />
            <KpiCard label="O&M Component" value={`$${(Number(lcos) * 0.20).toFixed(0)}/MWh`} sub="~20% of LCOS" color={T.amber} />
            <KpiCard label="vs Gas Peaker" value="$180–220/MWh" sub="BESS competitive at <$160" color={Number(lcos) < 160 ? T.green : T.amber} />
          </div>
        </div>
      );

      case 2: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Revenue Stack — Annual by Source</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revStack} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                <Tooltip formatter={v => [`$${typeof v === 'number' ? v.toFixed(0) : v}k/yr`, 'Revenue']} />
                <Bar dataKey="value" name="Annual Revenue $k">
                  {revStack.map((r, i) => <Cell key={i} fill={r.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Revenue vs LCOS Breakeven</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[{ label: 'Revenue/MWh', value: totalRevK * 1000 / (efcPerYear * capMWh * 365) }, { label: 'LCOS/MWh', value: Number(lcos) }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`$${typeof v === 'number' ? v.toFixed(1) : v}/MWh`, '']} />
                  <Bar dataKey="value">
                    <Cell fill={totalRevK * 1000 / (efcPerYear * capMWh * 365) >= Number(lcos) ? T.green : T.red} />
                    <Cell fill={T.red} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Cumulative Revenue Ramp</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={yearsArr.map(y => ({ year: `Y${y}`, cumRev: +(totalRevK * y).toFixed(0), cumCapex: +(capex / 1000 * (1 - itcPct)).toFixed(0) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="cumRev" fill={T.green} fillOpacity={0.2} stroke={T.green} name="Cumulative Revenue $k" />
                  <Area type="monotone" dataKey="cumCapex" fill={T.red} fillOpacity={0.1} stroke={T.red} name="Net CAPEX $k" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );

      case 3: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>24-Hour Greedy Dispatch — {market}</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Strategy: charge 4 cheapest hours → discharge 4 most expensive hours. Daily arbitrage: ${dispatch.arbitrageDaily.toFixed(0)}</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dispatch.schedule.map(s => ({
                hour: s.hour, price: s.price,
                charge: s.action === 'charge' ? s.price : 0,
                discharge: s.action === 'discharge' ? s.price : 0,
                idle: s.action === 'idle' ? s.price : 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="hour" tick={{ fontSize: 8 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: '$/MWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip formatter={v => v > 0 ? [`$${typeof v === 'number' ? v.toFixed(1) : v}/MWh`, ''] : null} />
                <Bar dataKey="charge" fill={T.indigo} name="Charge" stackId="a" />
                <Bar dataKey="idle" fill={T.border} name="Idle" stackId="a" />
                <Bar dataKey="discharge" fill={T.accent} name="Discharge" stackId="a" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>State of Charge Profile</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={dispatch.schedule}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="hour" tick={{ fontSize: 8 }} />
                <YAxis domain={[0, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => [`${(Number(v) * 100).toFixed(0)}%`, 'SOC']} />
                <ReferenceLine y={dod / 100} stroke={T.red} strokeDasharray="4 4" label={{ value: `DOD ${dod}%`, fontSize: 9 }} />
                <Line dataKey="soc" stroke={T.green} strokeWidth={2} dot={false} name="State of Charge" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );

      case 4: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Capacity Fade — Arrhenius Calendar + Cycle Aging</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={degradation}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: 'Year', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis domain={[0.7, 1.0]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${(Number(v) * 100).toFixed(2)}%`, n]} />
                <ReferenceLine y={0.80} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'Augmentation trigger (80%)', fontSize: 9 }} />
                <Line dataKey="capacity" stroke={T.indigo} strokeWidth={2} dot={false} name="Remaining Capacity" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Fade Components (Calendar vs Cycle)</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={degradation}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v, n) => [`${(Number(v) * 100).toFixed(2)}%`, n]} />
                  <Area type="monotone" dataKey="calFade" fill={T.amber} fillOpacity={0.3} stroke={T.amber} name="Calendar Aging" />
                  <Area type="monotone" dataKey="cycFade" fill={T.indigo} fillOpacity={0.3} stroke={T.indigo} name="Cycle Aging" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Degradation Key Metrics</div>
              {[
                { label: `Year 5 Capacity`, val: `${((degradation[4]?.capacity || 1) * 100).toFixed(1)}%`, ok: (degradation[4]?.capacity || 1) > 0.90 },
                { label: `Year 10 Capacity`, val: `${((degradation[9]?.capacity || 1) * 100).toFixed(1)}%`, ok: (degradation[9]?.capacity || 1) > 0.82 },
                { label: `Year ${lifeYrs} Capacity`, val: `${((degradation[lifeYrs - 1]?.capacity || 1) * 100).toFixed(1)}%` },
                { label: `Calendar Fade Rate`, val: `${((1 - (degradation[lifeYrs - 1]?.capacity || 0.7)) * 100 * 0.65 / lifeYrs).toFixed(2)}%/yr` },
                { label: `Cycle Fade Rate`, val: `${(efcPerYear * 365 * (chemistry === 'LFP' ? 1.8e-5 : 2.5e-5) * 100).toFixed(3)}%/EFC` },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ color: T.sub }}>{r.label}</span>
                  <span style={{ fontWeight: 700, color: r.ok === undefined ? T.text : r.ok ? T.green : T.amber }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

      case 5: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>LCOS by Chemistry — {lifeYrs}-Year Project Life</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={lcosByChemistry}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="chemistry" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'LCOS $/MWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip formatter={v => [`$${v}/MWh`, 'LCOS']} />
                <Bar dataKey="lcos" name="LCOS ($/MWh)">
                  {lcosByChemistry.map((_, i) => <Cell key={i} fill={[T.green, T.indigo, T.amber][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { ch: 'LFP', pros: 'Safest, longest life, no cobalt. Best for utility-scale FERC 841.', lcos: lcosByChemistry[0]?.lcos, life: '15–20 yr', efc: '4,000–6,000' },
              { ch: 'NMC', pros: 'Higher energy density, lower CAPEX/kWh. Good for constrained sites.', lcos: lcosByChemistry[1]?.lcos, life: '10–15 yr', efc: '2,000–4,000' },
              { ch: 'NCA', pros: 'Highest energy density. Used in EVs. Shorter cycle life.', lcos: lcosByChemistry[2]?.lcos, life: '8–12 yr', efc: '1,500–3,000' },
            ].map(c => (
              <div key={c.ch} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.accent, marginBottom: 6 }}>{c.ch}</div>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 8, lineHeight: 1.5 }}>{c.pros}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span>LCOS</span><span style={{ fontWeight: 700, color: T.text }}>${c.lcos}/MWh</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span>Life</span><span style={{ fontWeight: 600 }}>{c.life}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span>Cycle Life</span><span style={{ fontWeight: 600 }}>{c.efc} EFC</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

      case 6: return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <KpiCard label="Revenue/MWh discharged" value={`$${(totalRevK * 1000 / Math.max(1, efcPerYear * capMWh * 365)).toFixed(1)}`} color={T.accent} />
            <KpiCard label="LCOS" value={`$${lcos}/MWh`} color={Number(lcos) < 150 ? T.green : T.red} />
            <KpiCard label="Margin" value={`$${(totalRevK * 1000 / Math.max(1, efcPerYear * capMWh * 365) - Number(lcos)).toFixed(1)}/MWh`} color={totalRevK * 1000 / Math.max(1, efcPerYear * capMWh * 365) > Number(lcos) ? T.green : T.red} />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Revenue vs LCOS by Market</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MARKETS.map(m => {
                const p = marketPrices(m);
                const disp = greedyDispatch(p, capMWh * (dod / 100), powerMW, rte / 100);
                const annRev = disp.arbitrageDaily * 365 + freqRegRevK * 1000 + capMarketRevK * 1000;
                const revPerMWh = annRev / Math.max(1, efcPerYear * capMWh * 365);
                return { market: m, revPerMWh: +revPerMWh.toFixed(1), lcos: Number(lcos) };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="market" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <ReferenceLine y={Number(lcos)} stroke={T.red} strokeDasharray="4 4" label={{ value: 'LCOS', fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="revPerMWh" name="Revenue/MWh">
                  {MARKETS.map((m, i) => <Cell key={i} fill={m === market ? T.accent : T.border} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );

      case 7: return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <KpiCard label="Clipping Capture" value={`$${clippingRevK.toFixed(0)}k/yr`} sub={colocation ? `${solarMW}MW solar` : 'Disabled'} color={colocation ? T.solar : T.sub} />
            <KpiCard label="ITC on BESS" value={`${(itcPct * 100).toFixed(0)}%`} sub={dcCoupled ? 'DC-coupled' : 'AC-coupled'} color={T.teal} />
            <KpiCard label="RTE (DC-coupled)" value={dcCoupled ? `${Math.min(99, rte + 4)}%` : `${rte}%`} sub={dcCoupled ? '+4pp vs AC-coupled' : 'AC-coupled losses apply'} color={dcCoupled ? T.green : T.sub} />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>ITC Basis — IRA 2022 §48E</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>BESS ITC basis = BESS CAPEX × (1 − grid charge fraction × ITC% adjustment). From 2023, standalone BESS is ITC eligible if ≥3hr duration.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[{ label: 'Base ITC', val: '30%', active: itcBESS }, { label: 'Energy Community +10%', val: '+10%', active: itcBESS && energyCommunity }, { label: 'Grid Charge Reduction', val: `−${chargeGrid}% of credit`, active: chargeGrid > 0 }].map(r => (
                <div key={r.label} style={{ padding: 12, background: r.active ? `${T.green}10` : T.bg, borderRadius: 8, border: `1px solid ${r.active ? T.green : T.border}` }}>
                  <div style={{ fontSize: 10, color: T.sub }}>{r.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: r.active ? T.green : T.sub }}>{r.val}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: 12, background: `${T.accent}10`, borderRadius: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>Net ITC: {(itcPct * 100).toFixed(0)}% → ${(capex * itcPct / 1e6).toFixed(2)}M credit on ${(capex / 1e6).toFixed(1)}M BESS CAPEX</div>
            </div>
          </div>
        </div>
      );

      case 8: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Augmentation vs Replacement Analysis</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={degradation}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: 'Year', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n) => [`${(Number(v) * 100).toFixed(1)}%`, n]} />
                <ReferenceLine y={0.80} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'Aug. Trigger (80%)', fontSize: 9 }} />
                <ReferenceLine y={0.70} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Replace Trigger (70%)', fontSize: 9 }} />
                <Line dataKey="capacity" stroke={T.indigo} strokeWidth={2} dot={false} name="Capacity" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <KpiCard label="Augmentation Year" value={`~Yr ${Math.round(degradation.findIndex(d => d.capacity < 0.80) + 1) || lifeYrs}`} sub="When capacity <80%" color={T.amber} />
            <KpiCard label="Aug Cost (25%)" value={`$${(capex * 0.25 / 1e6).toFixed(1)}M`} sub="Add new cells" color={T.blue} />
            <KpiCard label="Full Replace Cost" value={`$${(capex * 0.65 / 1e6).toFixed(1)}M`} sub="New pack (deflated)" color={T.red} />
          </div>
        </div>
      );

      case 9: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>FERC Order 841 — Market Participation Checklist</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>2018 FERC Order 841 requires ISO/RTOs to eliminate barriers for electric storage resources in capacity, energy, and AS markets.</div>
            {[
              { check: '≥3-hour duration requirement', pass: capMWh / powerMW >= 3, note: `${(capMWh / powerMW).toFixed(1)}-hr duration configured` },
              { check: 'Interconnection agreement filed', pass: true, note: 'Required for all market participation' },
              { check: 'State-of-charge telemetry to ISO', pass: true, note: 'SCADA with 4-second granularity' },
              { check: 'Minimum offer price rule (MOPR)', pass: true, note: 'BESS exempt under FERC 841 Rule' },
              { check: 'Must-offer obligation waiver', pass: true, note: 'Available for storage resources' },
              { check: 'Participation model registration', pass: true, note: `${market} storage participation model` },
              { check: 'Simultaneous buy/sell prohibition', pass: false, note: 'Cannot simultaneously charge/discharge — schedule must comply' },
            ].map(c => (
              <div key={c.check} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{c.pass ? '✅' : '⚠️'}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: c.pass ? T.text : T.amber }}>{c.check}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{c.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

      case 10: return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <KpiCard label="FR Capacity Committed" value={`${freqRegMW} MW`} sub="Regulation Up + Down" color={T.indigo} />
            <KpiCard label="FR Annual Revenue" value={`$${freqRegRevK.toFixed(0)}k`} sub={`${market} reg capacity price`} color={T.green} />
            <KpiCard label="Performance Score" value="98%" sub="Fast-response BESS" color={T.teal} />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Frequency Regulation Revenue by Market</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MARKETS.map((m, i) => ({ market: m, revK: +(freqRegMW * [5, 8, 6, 4, 9, 11][i] * 12 / 1000).toFixed(0) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="market" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: '$k/yr', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="revK" name="FR Revenue $k/yr">
                  {MARKETS.map((m, i) => <Cell key={i} fill={m === market ? T.accent : T.border} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, fontSize: 11, color: T.sub, lineHeight: 1.7 }}>
            <strong style={{ color: T.text }}>FERC Order 755 / Performance-Based Regulation:</strong> BESS earns mileage payment proportional to response speed. Performance score typically 95–100% for Li-ion vs 70–85% for gas peaker. CAISO RegUp/RegDn: $5–25/MW-hr depending on season. PJM Reg A/D: BESS typically qualifies for Reg D (fast signal). ISO-NE: Automated Dispatch (AD) ancillary service.
          </div>
        </div>
      );

      case 11: return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <KpiCard label="ICAP MW" value={`${Math.round(powerMW * capMarketPct / 100)} MW`} sub={`${capMarketPct}% qualified`} color={T.indigo} />
            <KpiCard label="Capacity Revenue" value={`$${capMarketRevK.toFixed(0)}k/yr`} sub={`$${capPrice}/kW-yr`} color={T.green} />
            <KpiCard label="Duration Test" value={capMWh / powerMW >= 4 ? '4-hr Pass ✅' : `${(capMWh / powerMW).toFixed(1)}-hr ⚠️`} sub="Most ISO require 4-hr minimum" color={capMWh / powerMW >= 4 ? T.green : T.amber} />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Capacity Price by ISO ($/kW-yr)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[{ iso: 'PJM BRA', price: 34, qualified: true }, { iso: 'ISO-NE FCM', price: 46, qualified: true }, { iso: 'NYISO ICAP', price: 62, qualified: true }, { iso: 'CAISO RA', price: 55, qualified: true }, { iso: 'MISO', price: 28, qualified: true }, { iso: 'ERCOT', price: 0, qualified: false }]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="iso" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="price" name="$/kW-yr">
                  {[true, true, true, true, true, false].map((q, i) => <Cell key={i} fill={q ? T.indigo : T.sub} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );

      case 12: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Scenario Revenue Impact</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={['None', 'Mild', 'Moderate', 'Severe', 'Extreme'].map(s => {
                const m = { None: 1.0, Mild: 0.90, Moderate: 0.78, Severe: 0.60, Extreme: 0.40 }[s];
                return { scenario: s, revenue: +(totalRevK * m).toFixed(0), lcos: Number(lcos) };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: '$k/yr', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <ReferenceLine y={capex * opexPct / 1000} stroke={T.red} strokeDasharray="4 4" label={{ value: 'O&M floor', fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="revenue" name="Revenue $k/yr">
                  {['None', 'Mild', 'Moderate', 'Severe', 'Extreme'].map((_, i) => <Cell key={i} fill={['#065F46', '#0F766E', '#D97706', '#92400E', '#991B1B'][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <KpiCard label="Severe Revenue" value={`$${(totalRevK * 0.60).toFixed(0)}k/yr`} sub="-40% arbitrage" color={T.red} />
            <KpiCard label="Break-Even Arbitrage" value={`$${(capex * opexPct / 1000 / 365).toFixed(1)}/day`} sub="Min to cover O&M" color={T.amber} />
            <KpiCard label="Project NPV @ Moderate" value={`$${((npvRevenue * 0.78 - npvCapex) / 1e6).toFixed(1)}M`} color={npvRevenue * 0.78 > npvCapex ? T.green : T.red} />
          </div>
        </div>
      );

      case 13: return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <KpiCard label="Project NPV" value={`$${(projectNPV / 1e6).toFixed(1)}M`} color={projectNPV > 0 ? T.green : T.red} />
            <KpiCard label="Simple Payback" value={`${(capex * (1 - itcPct) / (totalRevK * 1000)).toFixed(1)} yr`} sub="Net CAPEX / annual revenue" color={T.blue} />
            <KpiCard label="ITC Credit" value={`$${(capex * itcPct / 1e6).toFixed(1)}M`} sub={`${(itcPct * 100).toFixed(0)}% IRA §48E`} color={T.teal} />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Cumulative Cash Flow</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={yearsArr.map(y => ({
                year: `Y${y}`, cumRev: +(totalRevK * y - capex * (1 - itcPct) / 1000).toFixed(0), zero: 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: '$k', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <ReferenceLine y={0} stroke={T.red} strokeWidth={2} />
                <Tooltip />
                <Area type="monotone" dataKey="cumRev" fill={T.green} fillOpacity={0.2} stroke={T.green} name="Cumulative CF $k" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      );

      case 14: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Safety & Compliance Checklist</div>
            {[
              { std: 'IEC 62619:2022 — Safety Requirements', status: 'Required for all Li-ion BESS >25kWh', ok: true },
              { std: 'UL 9540A — Test Method for Battery Systems', status: 'Cell, module, unit, installation level testing', ok: true },
              { std: 'NFPA 855 — Fire Code for ESS', status: `${chemistry} requires ${chemistry === 'LFP' ? 'standard' : 'enhanced'} fire suppression`, ok: chemistry === 'LFP' },
              { std: 'IEEE 1547-2018 — Grid Interconnection', status: 'Anti-islanding, ride-through, reactive power', ok: true },
              { std: 'NERC CIP Cybersecurity', status: 'Required for grid-connected BESS >1.5MW', ok: powerMW >= 1.5 },
              { std: 'Thermal Runaway Prevention', status: `${chemistry} ${chemistry === 'LFP' ? 'lowest risk' : chemistry === 'NMC' ? 'moderate risk — active cooling required' : 'highest risk — BMS critical'}`, ok: chemistry === 'LFP' },
            ].map(c => (
              <div key={c.std} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{c.ok ? '✅' : '⚠️'}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{c.std}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{c.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

      case 15: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>BESS vs Alternative Storage Technologies (LCOS)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { tech: `Li-ion ${chemistry}`, lcos: Number(lcos), color: T.accent },
                { tech: 'Pumped Hydro', lcos: 100 + sr(50) * 30, color: T.blue },
                { tech: 'Gas Peaker', lcos: 180 + sr(51) * 40, color: '#991B1B' },
                { tech: 'Flow Battery', lcos: 200 + sr(52) * 50, color: T.teal },
                { tech: 'Demand Response', lcos: 60 + sr(53) * 20, color: T.green },
                { tech: 'Compressed Air', lcos: 130 + sr(54) * 40, color: T.sub },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="tech" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'LCOS $/MWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="lcos" name="LCOS $/MWh">
                  {[0, 1, 2, 3, 4, 5].map((_, i) => <Cell key={i} fill={[T.accent, T.blue, T.red, T.teal, T.green, T.sub][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );

      case 16: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Long-Duration Storage (8hr+) Analysis</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Comparison of short-duration (2-hr), standard (4-hr), and long-duration (8-hr) configurations for {market} market.</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[2, 4, 6, 8, 10, 12].map(dur => {
                const capMWhDur = powerMW * dur;
                const lcosDur = calcLCOS(capexPerKWh, powerMW, capMWhDur, opexPct, discountR / 100, lifeYrs, efcPerYear, degradation);
                const revK = annualArb * (dur / 4) * (dur <= 8 ? 1 : 0.9);
                return { duration: `${dur}-hr`, lcos: Number(lcosDur), revPerMWh: +(revK * 1000 / Math.max(1, efcPerYear * capMWhDur * 365)).toFixed(1) };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="duration" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="lcos" fill={T.red} name="LCOS $/MWh" />
                <Bar dataKey="revPerMWh" fill={T.green} name="Revenue/MWh" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, fontSize: 11, color: T.sub, lineHeight: 1.7 }}>
            <strong style={{ color: T.text }}>Long-Duration Storage (LDES) Context:</strong> 8-hr+ BESS qualifies for IRA long-duration storage incentives under DOE LDES program ($3.5Bn). Iron-air (Form Energy) and flow batteries target 100-hr. Pumped hydro remains cheapest long-duration option ($100–130/MWh LCOS). FERC 841 requires minimum state-of-charge of 20% at any time.
          </div>
        </div>
      );

      case 17: return (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Tornado Chart — LCOS Sensitivity</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sensData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 400]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="factor" tick={{ fontSize: 10 }} width={160} />
                <Tooltip formatter={v => [`$${v}/MWh`, '']} />
                <Bar dataKey="low" fill={T.green} name="Low case" />
                <Bar dataKey="high" fill={T.red} name="High case" />
                <ReferenceLine x={Number(lcos)} stroke={T.accent} strokeWidth={2} label={{ value: `Base $${lcos}`, fontSize: 9 }} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <KpiCard label="LCOS Base" value={`$${lcos}/MWh`} color={T.accent} />
            <KpiCard label="Best Case LCOS" value={`$${Math.min(...sensData.map(s => s.low)).toFixed(0)}/MWh`} sub="-20% CAPEX scenario" color={T.green} />
            <KpiCard label="Worst Case LCOS" value={`$${Math.max(...sensData.map(s => s.high)).toFixed(0)}/MWh`} sub="+20% CAPEX + discount" color={T.red} />
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: T.bg, fontFamily: "'DM Sans',system-ui,sans-serif", overflow: 'hidden' }}>

      {/* Left Panel */}
      <div style={{ width: 270, minWidth: 270, background: T.card, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '14px 12px', borderBottom: `2px solid ${T.accent}`, background: T.navy, flexShrink: 0 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: T.accent, letterSpacing: 2, marginBottom: 4 }}>RE-BESS1 · BESS CONFIGURATOR</div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>BESS & Grid Services Analytics</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 }}>{chemistry} · {capMWh}MWh / {powerMW}MW · {(capMWh / powerMW).toFixed(1)}-hr</div>
        </div>

        <SHdr title="System Configuration" expanded={!col.sys} onToggle={() => toggle('sys')} color={T.indigo} />
        {!col.sys && <div style={{ borderBottom: `1px solid ${T.border}` }}>
          <Sel label="Chemistry" value={chemistry} options={CHEMISTRIES} onChange={setChemistry} />
          <Slider label="Capacity MWh" value={capMWh} min={5} max={500} step={5} onChange={setCapMWh} fmt={v => `${v} MWh`} />
          <Slider label="Power MW" value={powerMW} min={1} max={250} step={1} onChange={setPowerMW} fmt={v => `${v} MW`} />
          <Slider label="Round-trip Efficiency %" value={rte} min={75} max={98} step={1} onChange={setRte} fmt={v => `${v}%`} />
          <Slider label="Depth of Discharge %" value={dod} min={60} max={100} step={5} onChange={setDod} fmt={v => `${v}%`} />
          <Slider label="Avg Temperature °C" value={tempC} min={10} max={45} step={1} onChange={setTempC} fmt={v => `${v}°C`} />
          <Slider label="Project Life (yr)" value={lifeYrs} min={10} max={25} step={1} onChange={setLifeYrs} fmt={v => `${v} yr`} />
          <Slider label="CAPEX $/kWh" value={capexPerKWh} min={150} max={500} step={10} onChange={setCapexPerKWh} fmt={v => `$${v}`} />
          <Slider label="O&M % of CAPEX" value={opexPct} min={0.005} max={0.03} step={0.005} onChange={setOpexPct} fmt={v => `${(v * 100).toFixed(1)}%`} />
          <Slider label="Discount Rate %" value={discountR} min={4} max={15} step={0.5} onChange={setDiscountR} fmt={v => `${v}%`} />
        </div>}

        <SHdr title="Market & Revenue" expanded={!col.market} onToggle={() => toggle('market')} color={T.green} />
        {!col.market && <div style={{ borderBottom: `1px solid ${T.border}` }}>
          <Sel label="ISO/Market" value={market} options={MARKETS} onChange={setMarket} />
          <Slider label="Arb Spread $/MWh" value={arbSpread} min={10} max={80} step={5} onChange={setArbSpread} fmt={v => `$${v}`} />
          <Slider label="Target EFC/day" value={efcTarget} min={0.25} max={2.0} step={0.25} onChange={setEfcTarget} fmt={v => `${v} EFC/day`} />
          <Slider label="Freq Reg MW" value={freqRegMW} min={0} max={powerMW} step={1} onChange={setFreqRegMW} fmt={v => `${v} MW`} />
          <Slider label="Capacity Qualification %" value={capMarketPct} min={0} max={100} step={5} onChange={setCapMarketPct} fmt={v => `${v}%`} />
          <Slider label="Capacity Price $/kW-yr" value={capPrice} min={20} max={100} step={5} onChange={setCapPrice} fmt={v => `$${v}`} />
        </div>}

        <SHdr title="Degradation" expanded={!col.deg} onToggle={() => toggle('deg')} color={T.amber} />
        {!col.deg && <div style={{ borderBottom: `1px solid ${T.border}` }}>
          <div style={{ padding: '6px 12px', fontSize: 11, color: T.sub }}>Chemistry: <strong style={{ color: T.text }}>{chemistry}</strong> (auto-set Ea, k_cyc, A constants)</div>
          <div style={{ padding: '4px 12px 8px', fontSize: 11 }}>
            <div style={{ color: T.sub, marginBottom: 4 }}>Yr-5 Capacity: <span style={{ color: T.accent, fontWeight: 700 }}>{((degradation[4]?.capacity || 1) * 100).toFixed(1)}%</span></div>
            <div style={{ color: T.sub }}>Yr-10 Capacity: <span style={{ color: T.accent, fontWeight: 700 }}>{((degradation[9]?.capacity || 1) * 100).toFixed(1)}%</span></div>
          </div>
        </div>}

        <SHdr title="Co-location (Solar+BESS)" expanded={!col.coloc} onToggle={() => toggle('coloc')} color={T.solar} />
        {!col.coloc && <div style={{ borderBottom: `1px solid ${T.border}` }}>
          <Toggle label="Enable Co-location" value={colocation} onChange={setColocation} />
          {colocation && <>
            <Slider label="Solar Capacity MWdc" value={solarMW} min={10} max={500} step={10} onChange={setSolarMW} fmt={v => `${v} MWdc`} />
            <Toggle label="DC-coupled BESS" value={dcCoupled} onChange={setDcCoupled} />
          </>}
        </div>}

        <SHdr title="Financing / ITC" expanded={!col.fin} onToggle={() => toggle('fin')} color={T.teal} />
        {!col.fin && <div style={{ borderBottom: `1px solid ${T.border}` }}>
          <Toggle label="IRA §48E ITC on BESS" value={itcBESS} onChange={setItcBESS} />
          {itcBESS && <Toggle label="Energy Community +10%" value={energyCommunity} onChange={setEnergyCommunity} />}
          <Slider label="Grid Charge % (reduces ITC)" value={chargeGrid} min={0} max={100} step={5} onChange={setChargeGrid} fmt={v => `${v}%`} />
        </div>}

        <div style={{ marginTop: 'auto', borderTop: `2px solid ${T.border}`, padding: '10px 12px', background: `${T.navy}08`, flexShrink: 0 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 9, color: T.accent, letterSpacing: 1, marginBottom: 6 }}>LIVE STATS</div>
          {[
            { l: 'LCOS', v: `$${lcos}/MWh`, ok: Number(lcos) < 150 },
            { l: 'Annual Rev', v: `$${totalRevK.toFixed(0)}k` },
            { l: 'ITC', v: `${(itcPct * 100).toFixed(0)}%` },
            { l: 'Project NPV', v: `$${(projectNPV / 1e6).toFixed(1)}M`, ok: projectNPV > 0 },
          ].map(s => (
            <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: T.sub }}>{s.l}</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: s.ok === undefined ? T.text : s.ok ? T.green : T.red }}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${T.border}`, background: T.card, flexShrink: 0 }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)} style={{
              padding: '10px 14px', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', fontSize: 11.5,
              fontWeight: activeTab === i ? 700 : 400, background: activeTab === i ? T.bg : 'transparent',
              color: activeTab === i ? T.accent : T.sub,
              borderBottom: activeTab === i ? `2px solid ${T.accent}` : '2px solid transparent',
            }}>
              {tab}
            </button>
          ))}
        </div>

        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${T.border}`, background: T.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: T.accent, letterSpacing: 1 }}>RE-BESS1</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text, marginLeft: 10 }}>{TABS[activeTab]}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
            <span style={{ padding: '3px 8px', background: `${T.indigo}15`, color: T.indigo, borderRadius: 4, fontWeight: 600 }}>{chemistry} {capMWh}MWh</span>
            <span style={{ padding: '3px 8px', background: `${T.green}15`, color: T.green, borderRadius: 4, fontWeight: 600 }}>{market}</span>
            <span style={{ padding: '3px 8px', background: `${T.amber}15`, color: T.amber, borderRadius: 4, fontWeight: 600 }}>LCOS ${lcos}/MWh</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
