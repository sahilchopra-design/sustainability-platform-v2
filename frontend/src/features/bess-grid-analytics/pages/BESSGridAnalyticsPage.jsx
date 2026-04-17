import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

/* ─── Platform Standards ────────────────────────────────────────────────── */
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E',
  sub: '#6B7280', accent: '#B8860B', indigo: '#4F46E5', green: '#065F46',
  red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E'
};

/* ─── Seed Data ─────────────────────────────────────────────────────────── */
const TECH_SPECS = [
  { tech: 'LFP', energyDensity: 160, cycleFade: 0.002, calFade: 0.02, rte: 0.87, capexKwh: 275, lifeYr: 20, cycles: 6000, fireRisk: 'Low', chemistry: 'LiFePO4', temp: '-20 to 55°C', applic: 'Grid-scale, Long duration' },
  { tech: 'NMC', energyDensity: 250, cycleFade: 0.003, calFade: 0.025, rte: 0.90, capexKwh: 290, lifeYr: 15, cycles: 4000, fireRisk: 'Medium', chemistry: 'Li-NiMnCoO2', temp: '-20 to 45°C', applic: 'High-power, C&I' },
  { tech: 'Vanadium Flow', energyDensity: 25, cycleFade: 0.001, calFade: 0.005, rte: 0.75, capexKwh: 450, lifeYr: 25, cycles: 20000, fireRisk: 'Very Low', chemistry: 'Vanadium electrolyte', temp: '10 to 40°C', applic: 'Long duration (8h+)' },
  { tech: 'NaS', energyDensity: 150, cycleFade: 0.002, calFade: 0.018, rte: 0.80, capexKwh: 380, lifeYr: 20, cycles: 4500, fireRisk: 'Medium', chemistry: 'Sodium-Sulfur', temp: '300°C operating', applic: 'Load leveling, islands' },
  { tech: 'Zinc-Air', energyDensity: 170, cycleFade: 0.003, calFade: 0.015, rte: 0.65, capexKwh: 200, lifeYr: 20, cycles: 5000, fireRisk: 'Very Low', chemistry: 'Zinc-Oxygen', temp: '-10 to 60°C', applic: 'Long duration emerging' },
  { tech: 'LAES (Liquid Air)', energyDensity: 60, cycleFade: 0.001, calFade: 0.010, rte: 0.60, capexKwh: 350, lifeYr: 30, cycles: 30000, fireRisk: 'None', chemistry: 'Cryogenic', temp: 'Ambient', applic: 'Multi-day storage' },
];

const MARKETS_BESS = [
  { market: 'ERCOT', arbitrageSpread: 48, frPrice: 14, capPayMWDay: 3.5, ancillary: 8, curtailmentValue: 12, access: 'Full' },
  { market: 'CAISO', arbitrageSpread: 52, frPrice: 18, capPayMWDay: 0, ancillary: 12, curtailmentValue: 20, access: 'Full, FERC 841' },
  { market: 'PJM', arbitrageSpread: 38, frPrice: 22, capPayMWDay: 18, ancillary: 9, curtailmentValue: 5, access: 'Full' },
  { market: 'MISO', arbitrageSpread: 30, frPrice: 10, capPayMWDay: 6, ancillary: 6, curtailmentValue: 4, access: 'Partial' },
  { market: 'NYISO', arbitrageSpread: 45, frPrice: 16, capPayMWDay: 12, ancillary: 11, curtailmentValue: 8, access: 'Full, Prop 118' },
  { market: 'ISO-NE', arbitrageSpread: 42, frPrice: 20, capPayMWDay: 15, ancillary: 10, curtailmentValue: 6, access: 'Full' },
];

const PRICE_CURVE_24H = Array.from({ length: 24 }, (_, h) => {
  const morningPeak = h >= 6 && h <= 9 ? 0.7 : 0;
  const eveningPeak = h >= 17 && h <= 20 ? 1.0 : 0;
  const offpeak = (h <= 5 || h >= 23) ? -0.3 : 0;
  const baseLMP = 35;
  const shape = morningPeak * 30 + eveningPeak * 50 + offpeak * (-15);
  return { hour: h, lmp: Math.max(-5, baseLMP + shape + (sr(h * 7) - 0.5) * 10) };
});

const STATE_MANDATES = [
  { state: 'California', mandate: 'AB 2514 / CPUC', target: '1,325 MW (IOU)', year: 2024 },
  { state: 'New York', mandate: 'CLCPA', target: '6,000 MW', year: 2030 },
  { state: 'New Jersey', mandate: 'EO 307', target: '2,000 MW', year: 2030 },
  { state: 'Massachusetts', mandate: 'ACES', target: '1,000 MWh', year: 2025 },
  { state: 'Illinois', mandate: 'CEJA', target: '1,000 MW', year: 2030 },
  { state: 'Oregon', mandate: 'SB 1547', target: '400 MW', year: 2030 },
];

const CAPEX_TRAJECTORY = [
  { year: 2020, LFP: 380, NMC: 410, Vanadium: 600, NaS: 500 },
  { year: 2021, LFP: 340, NMC: 370, Vanadium: 570, NaS: 480 },
  { year: 2022, LFP: 310, NMC: 340, Vanadium: 540, NaS: 460 },
  { year: 2023, LFP: 290, NMC: 310, Vanadium: 510, NaS: 440 },
  { year: 2024, LFP: 275, NMC: 290, Vanadium: 450, NaS: 380 },
  { year: 2025, LFP: 240, NMC: 260, Vanadium: 420, NaS: 360 },
  { year: 2026, LFP: 210, NMC: 230, Vanadium: 390, NaS: 340 },
  { year: 2027, LFP: 185, NMC: 205, Vanadium: 360, NaS: 320 },
  { year: 2028, LFP: 165, NMC: 185, Vanadium: 330, NaS: 300 },
  { year: 2029, LFP: 155, NMC: 170, Vanadium: 310, NaS: 285 },
  { year: 2030, LFP: 150, NMC: 160, Vanadium: 300, NaS: 275 },
];

/* ─── Sub-components ────────────────────────────────────────────────────── */
const KpiCard = ({ label, value, unit, sub, color }) => (
  <div style={{
    background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
    padding: '14px 18px', flex: 1, minWidth: 130,
    borderTop: `3px solid ${color || T.accent}`
  }}>
    <div style={{ fontSize: 11, color: T.sub, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: T.text, fontFamily: 'JetBrains Mono, monospace' }}>
      {value}<span style={{ fontSize: 13, color: T.sub, marginLeft: 3 }}>{unit}</span>
    </div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 3 }}>{sub}</div>}
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12, marginTop: 20, textTransform: 'uppercase', letterSpacing: '0.06em', borderLeft: `3px solid ${T.accent}`, paddingLeft: 10 }}>
    {children}
  </div>
);

const Table = ({ headers, rows, small }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: small ? 11 : 12 }}>
      <thead>
        <tr style={{ background: '#F3F4F6' }}>
          {headers.map((h, i) => (
            <th key={i} style={{ padding: '8px 12px', textAlign: 'left', color: T.sub, fontWeight: 700, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} style={{ borderBottom: `1px solid ${T.border}`, background: ri % 2 === 0 ? T.card : '#FAFAF7' }}>
            {row.map((cell, ci) => (
              <td key={ci} style={{ padding: '7px 12px', color: T.text, whiteSpace: 'nowrap' }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ─── Default Inputs ────────────────────────────────────────────────────── */
const DEFAULT_INPUTS = {
  capacityMWh: 200,
  powerMW: 50,
  roundTripEfficiency: 0.87,
  technology: 'LFP',
  capexPerKwh: 280,
  opexPerKwhYr: 8,
  projectLifeYr: 20,
  cyclesPerDay: 1.0,
  discountRate: 0.08,
  market: 'ERCOT',
  arbitrageSpread: 45,
  frPrice: 12,
  frCapacityMW: 30,
  capacityPaymentMWDay: 4.50,
  availabilityFactor: 0.95,
  colocationSolar: false,
  solarMW: 150,
  taxCreditPct: 0.30,
};

/* ─── TABS ──────────────────────────────────────────────────────────────── */
const TABS = [
  'Dashboard', 'LCOS Calculator', 'Revenue Stacking', 'Degradation Model',
  'Optimal Dispatch', 'Grid Services', 'Co-location', 'Tech Benchmarking',
  'Regulatory', 'Investment Decision'
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function BESSGridAnalyticsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [bessInputs, setBessInputs] = useState(DEFAULT_INPUTS);

  const set = (key, val) => setBessInputs(prev => ({ ...prev, [key]: val }));

  /* ── Core Calculations (useMemo) ──────────────────────────────────────── */
  const calc = useMemo(() => {
    const {
      capacityMWh, powerMW, roundTripEfficiency, capexPerKwh, opexPerKwhYr,
      projectLifeYr, cyclesPerDay, discountRate, arbitrageSpread, frPrice,
      frCapacityMW, capacityPaymentMWDay, availabilityFactor, taxCreditPct,
      solarMW, colocationSolar
    } = bessInputs;

    const capexTotal = capexPerKwh * capacityMWh * 1000; // $
    const itcAmount = capexTotal * taxCreditPct;
    const netCapex = capexTotal - itcAmount;

    // Annual energy discharged
    const annualEnergyMWh = cyclesPerDay * 365 * capacityMWh * roundTripEfficiency;
    const annualEnergyGWh = annualEnergyMWh / 1000;

    // NPV helpers
    const npvFactor = (r, n) => (1 - Math.pow(1 + r, -n)) / r;
    const pvFactor = (r, n) => Math.pow(1 + r, -n);

    // NPV of OPEX
    const annualOpex = opexPerKwhYr * capacityMWh * 1000;
    const npvOpex = annualOpex * npvFactor(discountRate, projectLifeYr);

    // Replacement at year 12 (80% fade trigger for LFP)
    const replacementYear = 12;
    const replacementCapex = capexTotal * 0.50; // 50% of initial
    const npvReplacement = replacementCapex * pvFactor(discountRate, replacementYear);

    // NPV of energy discharged
    let npvEnergy = 0;
    let totalEnergyGWh = 0;
    for (let y = 1; y <= projectLifeYr; y++) {
      const calFade = 0.02 * Math.sqrt(y);
      const cycFade = cyclesPerDay * 365 * y * 0.00002;
      const totalFade = Math.sqrt(calFade ** 2 + cycFade ** 2);
      const degradedEnergy = annualEnergyMWh * Math.max(0.70, 1 - totalFade);
      npvEnergy += (degradedEnergy / 1000) * pvFactor(discountRate, y);
      totalEnergyGWh += degradedEnergy / 1000;
    }

    const totalLifecycleCost = netCapex + npvOpex + npvReplacement;
    const lcos = npvEnergy > 0 ? (totalLifecycleCost / (npvEnergy * 1000000)) * 1000 : 0; // $/MWh → $/kWh

    // Revenue stacking
    const arbitrageRev = arbitrageSpread * cyclesPerDay * 365 * capacityMWh * roundTripEfficiency / 1000000; // $M
    const frRev = frPrice * frCapacityMW * 8760 * availabilityFactor / 1000000; // $M
    const capRev = capacityPaymentMWDay * powerMW * 365 * availabilityFactor / 1000000; // $M
    const ancillaryRev = 8 * (powerMW - frCapacityMW) * 3000 / 1000000; // $M rough
    const totalRevYr1 = arbitrageRev + frRev + capRev + ancillaryRev;

    // IRR (simple NPV-based estimate)
    const annualOpexM = annualOpex / 1000000;
    const netCapexM = netCapex / 1000000;
    let npvAt10 = -netCapexM;
    for (let y = 1; y <= projectLifeYr; y++) {
      const calFade = 0.02 * Math.sqrt(y);
      const cycFade = cyclesPerDay * 365 * y * 0.00002;
      const fade = Math.sqrt(calFade ** 2 + cycFade ** 2);
      const revDegraded = totalRevYr1 * Math.max(0.70, 1 - fade);
      const cf = revDegraded - annualOpexM - (y === replacementYear ? replacementCapex / 1000000 : 0);
      npvAt10 += cf / Math.pow(1.10, y);
    }
    const irr = npvAt10 > 0 ? 12.5 + npvAt10 * 0.8 : 10 + npvAt10 * 0.5;

    // Co-location benefit
    const clippingHours = colocationSolar ? Math.round(sr(17) * 200 + 300) : 0;
    const clippedMWh = colocationSolar ? Math.max(0, solarMW - powerMW) * clippingHours * 0.3 : 0;
    const negPriceHours = colocationSolar ? 180 : 0;
    const colocBenefit = colocationSolar
      ? (clippedMWh * 55 + negPriceHours * capacityMWh * 15) / 1000000
      : 0;

    // 20-year revenue projection
    const revenueProjection = Array.from({ length: projectLifeYr }, (_, i) => {
      const y = i + 1;
      const calFade = 0.02 * Math.sqrt(y);
      const cycFade = cyclesPerDay * 365 * y * 0.00002;
      const fade = Math.sqrt(calFade ** 2 + cycFade ** 2);
      const degradeMult = Math.max(0.70, 1 - fade);
      const noise = 1 + (sr(i * 13) - 0.5) * 0.06;
      return {
        year: `Y${y}`,
        arbitrage: parseFloat((arbitrageRev * degradeMult * noise).toFixed(2)),
        fr: parseFloat((frRev * degradeMult * noise).toFixed(2)),
        capacity: parseFloat((capRev * availabilityFactor * noise).toFixed(2)),
        ancillary: parseFloat((ancillaryRev * degradeMult * noise).toFixed(2)),
      };
    });

    return {
      capexTotal, itcAmount, netCapex, annualEnergyMWh, annualEnergyGWh,
      npvOpex, npvReplacement, totalLifecycleCost, lcos, npvEnergy,
      arbitrageRev, frRev, capRev, ancillaryRev, totalRevYr1,
      irr: Math.max(6, Math.min(25, irr)),
      cRate: powerMW / capacityMWh,
      revenueProjection, replacementYear, totalEnergyGWh,
      colocBenefit, clippingHours, clippedMWh, negPriceHours,
    };
  }, [bessInputs]);

  /* ── Dispatch Simulation ──────────────────────────────────────────────── */
  const dispatchSim = useMemo(() => {
    const sorted = [...PRICE_CURVE_24H].sort((a, b) => a.lmp - b.lmp);
    const chargeable = Math.ceil(bessInputs.cyclesPerDay * bessInputs.capacityMWh / bessInputs.powerMW * 2);
    const chargeHours = new Set(sorted.slice(0, Math.min(chargeable, 8)).map(h => h.hour));
    const dischargeHours = new Set([...sorted].reverse().slice(0, Math.min(chargeable, 8)).map(h => h.hour));

    let soc = 50;
    let dispRevenue = 0;
    let dispCost = 0;

    const curve = PRICE_CURVE_24H.map(({ hour, lmp }) => {
      let action = 'idle';
      let charge = 0;
      let discharge = 0;

      if (lmp < 0 || chargeHours.has(hour)) {
        const chargeKw = bessInputs.powerMW * 1000;
        const energyIn = Math.min(chargeKw, (100 - soc) / 100 * bessInputs.capacityMWh * 1000);
        soc = Math.min(100, soc + energyIn / (bessInputs.capacityMWh * 1000) * 100);
        charge = energyIn / 1000;
        dispCost += Math.max(0, lmp) * energyIn / 1000;
        action = 'charge';
      } else if (dischargeHours.has(hour) && soc > 10) {
        const dischargeKw = bessInputs.powerMW * 1000;
        const energyOut = Math.min(dischargeKw, soc / 100 * bessInputs.capacityMWh * 1000);
        soc = Math.max(0, soc - energyOut / (bessInputs.capacityMWh * 1000) * 100);
        discharge = energyOut * bessInputs.roundTripEfficiency / 1000;
        dispRevenue += lmp * discharge;
        action = 'discharge';
      }

      return { hour: `${hour}:00`, lmp: parseFloat(lmp.toFixed(1)), soc: parseFloat(soc.toFixed(1)), charge: parseFloat(charge.toFixed(1)), discharge: parseFloat(discharge.toFixed(1)), action };
    });

    const dailyRev = dispRevenue - dispCost;
    return { curve, dailyRev, annualRev: dailyRev * 365 / 1000000 };
  }, [bessInputs]);

  /* ── Degradation Series ───────────────────────────────────────────────── */
  const degradationSeries = useMemo(() => {
    return Array.from({ length: bessInputs.projectLifeYr + 1 }, (_, y) => {
      const calFade = 0.02 * Math.sqrt(y);
      const cycFade = bessInputs.cyclesPerDay * 365 * y * 0.00002;
      const totalFade = Math.sqrt(calFade ** 2 + cycFade ** 2);
      const capacity = Math.max(0.60, 1 - totalFade) * 100;
      return { year: y, capacity: parseFloat(capacity.toFixed(1)), calFade: parseFloat((calFade * 100).toFixed(2)), cycFade: parseFloat((cycFade * 100).toFixed(2)) };
    });
  }, [bessInputs]);

  /* ── LCOS Sensitivity ─────────────────────────────────────────────────── */
  const lcosSensitivity = useMemo(() => {
    const cyclesArray = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5];
    return cyclesArray.map(c => {
      const annE = c * 365 * bessInputs.capacityMWh * bessInputs.roundTripEfficiency;
      let npvE = 0;
      for (let y = 1; y <= bessInputs.projectLifeYr; y++) {
        const cf = 0.02 * Math.sqrt(y);
        const cc = c * 365 * y * 0.00002;
        const fade = Math.sqrt(cf ** 2 + cc ** 2);
        npvE += (annE * Math.max(0.70, 1 - fade) / 1000) / Math.pow(1 + bessInputs.discountRate, y);
      }
      const npvOpexL = (bessInputs.opexPerKwhYr * bessInputs.capacityMWh * 1000) * ((1 - Math.pow(1 + bessInputs.discountRate, -bessInputs.projectLifeYr)) / bessInputs.discountRate);
      const totalCostL = calc.netCapex + npvOpexL + calc.npvReplacement;
      const lc = npvE > 0 ? (totalCostL / (npvE * 1000000)) * 1000 : 0;
      return { cycles: c, lcos: parseFloat(lc.toFixed(1)) };
    });
  }, [bessInputs, calc]);

  /* ── Monte Carlo IRR ──────────────────────────────────────────────────── */
  const monteCarlo = useMemo(() => {
    const runs = 500;
    const irrs = [];
    for (let i = 0; i < runs; i++) {
      const spreadMult = 0.6 + sr(i * 3) * 0.8;
      const rteMult = 0.95 + sr(i * 7) * 0.10;
      const capexMult = 0.85 + sr(i * 11) * 0.30;
      const adjSpread = bessInputs.arbitrageSpread * spreadMult;
      const adjRte = bessInputs.roundTripEfficiency * rteMult;
      const adjCapex = bessInputs.capexPerKwh * capexMult;
      const adjCapexTotal = adjCapex * bessInputs.capacityMWh * 1000 * (1 - bessInputs.taxCreditPct);
      const adjArbRev = adjSpread * bessInputs.cyclesPerDay * 365 * bessInputs.capacityMWh * adjRte / 1000000;
      const adjTotalRev = adjArbRev + calc.frRev + calc.capRev + calc.ancillaryRev;
      const annOp = bessInputs.opexPerKwhYr * bessInputs.capacityMWh * 1000 / 1000000;
      let npvAt = -adjCapexTotal / 1000000;
      for (let y = 1; y <= bessInputs.projectLifeYr; y++) {
        const fade = Math.sqrt((0.02 * Math.sqrt(y)) ** 2 + (bessInputs.cyclesPerDay * 365 * y * 0.00002) ** 2);
        const cf = adjTotalRev * Math.max(0.70, 1 - fade) - annOp;
        npvAt += cf / Math.pow(1.10, y);
      }
      irrs.push(Math.max(2, Math.min(30, 10 + npvAt * 0.5 + (sr(i * 17) - 0.5) * 2)));
    }
    const sorted = [...irrs].sort((a, b) => a - b);
    const p10 = sorted[Math.floor(runs * 0.10)];
    const p50 = sorted[Math.floor(runs * 0.50)];
    const p90 = sorted[Math.floor(runs * 0.90)];

    // Histogram
    const bins = Array.from({ length: 15 }, (_, i) => ({
      range: `${(4 + i * 2).toFixed(0)}-${(6 + i * 2).toFixed(0)}%`,
      count: 0,
      mid: 5 + i * 2
    }));
    irrs.forEach(v => {
      const idx = Math.min(14, Math.max(0, Math.floor((v - 4) / 2)));
      bins[idx].count++;
    });

    return { p10: p10.toFixed(1), p50: p50.toFixed(1), p90: p90.toFixed(1), bins };
  }, [bessInputs, calc]);

  /* ── Scorecard ────────────────────────────────────────────────────────── */
  const scorecard = useMemo(() => {
    const irrScore = calc.irr >= 12 ? 5 : calc.irr >= 10 ? 4 : calc.irr >= 8 ? 3 : 2;
    const lcosScore = calc.lcos < bessInputs.arbitrageSpread * 0.7 ? 5 : calc.lcos < bessInputs.arbitrageSpread ? 4 : calc.lcos < bessInputs.arbitrageSpread * 1.2 ? 3 : 2;
    const techScore = bessInputs.technology === 'LFP' ? 5 : bessInputs.technology === 'NMC' ? 4 : 3;
    const offtakeScore = 4;
    const mktScore = MARKETS_BESS.find(m => m.market === bessInputs.market)?.access === 'Full' ? 5 : 3;
    const regScore = bessInputs.taxCreditPct >= 0.30 ? 5 : 3;
    const devScore = 4;

    const weights = [0.25, 0.20, 0.15, 0.15, 0.10, 0.10, 0.05];
    const scores = [irrScore, lcosScore, techScore, offtakeScore, mktScore, regScore, devScore];
    const weighted = scores.reduce((acc, s, i) => acc + s * weights[i], 0);

    const recommendation = weighted >= 4.0 ? 'PROCEED' : weighted >= 3.0 ? 'CONDITIONAL' : 'REJECT';
    const color = weighted >= 4.0 ? T.green : weighted >= 3.0 ? T.amber : T.red;

    const criteria = [
      { name: 'IRR vs Hurdle Rate', weight: '25%', score: irrScore, detail: `${calc.irr.toFixed(1)}% vs 10% hurdle` },
      { name: 'LCOS vs Arbitrage Spread', weight: '20%', score: lcosScore, detail: `${calc.lcos.toFixed(2)} $/kWh vs $${bessInputs.arbitrageSpread}/MWh` },
      { name: 'Technology Readiness', weight: '15%', score: techScore, detail: `${bessInputs.technology} — TRL 9` },
      { name: 'Offtake Certainty', weight: '15%', score: offtakeScore, detail: 'Partial merchant / contracted' },
      { name: 'Market Access', weight: '10%', score: mktScore, detail: MARKETS_BESS.find(m => m.market === bessInputs.market)?.access || 'Full' },
      { name: 'Regulatory Support', weight: '10%', score: regScore, detail: `ITC ${(bessInputs.taxCreditPct * 100).toFixed(0)}% eligible` },
      { name: 'Developer Track Record', weight: '5%', score: devScore, detail: '>5 operational BESS assets' },
    ];

    return { weighted: weighted.toFixed(2), recommendation, color, criteria };
  }, [calc, bessInputs]);

  /* ── Market Revenue Comparison ────────────────────────────────────────── */
  const marketComparison = useMemo(() => {
    return MARKETS_BESS.map(m => {
      const arb = m.arbitrageSpread * bessInputs.cyclesPerDay * 365 * bessInputs.capacityMWh * bessInputs.roundTripEfficiency / 1000000;
      const fr = m.frPrice * bessInputs.frCapacityMW * 8760 * bessInputs.availabilityFactor / 1000000;
      const cap = m.capPayMWDay * bessInputs.powerMW * 365 * bessInputs.availabilityFactor / 1000000;
      const anc = m.ancillary * (bessInputs.powerMW - bessInputs.frCapacityMW) * 3000 / 1000000;
      return { market: m.market, arbitrage: parseFloat(arb.toFixed(2)), fr: parseFloat(fr.toFixed(2)), capacity: parseFloat(cap.toFixed(2)), ancillary: parseFloat(anc.toFixed(2)), total: parseFloat((arb + fr + cap + anc).toFixed(2)) };
    });
  }, [bessInputs]);

  /* ── Render Input Row ─────────────────────────────────────────────────── */
  const InputRow = ({ label, stateKey, min, max, step, unit, isToggle }) => {
    const val = bessInputs[stateKey];
    if (isToggle) return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: T.sub, width: 160 }}>{label}</span>
        <button onClick={() => set(stateKey, !val)}
          style={{ padding: '4px 12px', borderRadius: 4, border: `1px solid ${T.border}`, background: val ? T.green : T.card, color: val ? '#fff' : T.text, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
          {val ? 'ON' : 'OFF'}
        </button>
      </div>
    );
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ fontSize: 11, color: T.sub }}>{label}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.text, fontFamily: 'JetBrains Mono, monospace' }}>
            {typeof val === 'number' && val % 1 !== 0 ? val.toFixed(2) : val}{unit}
          </span>
        </div>
        <input type="range" min={min} max={max} step={step} value={val}
          onChange={e => set(stateKey, parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: T.accent }} />
      </div>
    );
  };

  /* ── Shared chart tooltip ─────────────────────────────────────────────── */
  const ChartTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
        <div style={{ fontWeight: 700, marginBottom: 4, color: T.text }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color }}>{p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong></div>
        ))}
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════════════════
     TAB RENDERERS
  ══════════════════════════════════════════════════════════════════════ */

  /* Tab 0 — Dashboard */
  const renderDashboard = () => (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <KpiCard label="Capacity" value={`${bessInputs.powerMW}MW / ${bessInputs.capacityMWh}MWh`} color={T.indigo} />
        <KpiCard label="C-Rate" value={calc.cRate.toFixed(2)} unit="C" sub="Power/Capacity ratio" color={T.blue} />
        <KpiCard label="Round-Trip Eff" value={(bessInputs.roundTripEfficiency * 100).toFixed(0)} unit="%" color={T.teal} />
        <KpiCard label="Year-1 Revenue" value={calc.totalRevYr1.toFixed(2)} unit="$M" color={T.green} />
        <KpiCard label="LCOS" value={calc.lcos.toFixed(2)} unit="$/kWh" sub="Levelized Cost of Storage" color={T.accent} />
        <KpiCard label="Project IRR" value={calc.irr.toFixed(1)} unit="%" color={T.indigo} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Revenue Breakdown (Year 1)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={[
                { name: 'Arbitrage', value: parseFloat(calc.arbitrageRev.toFixed(2)) },
                { name: 'Freq Reg', value: parseFloat(calc.frRev.toFixed(2)) },
                { name: 'Capacity', value: parseFloat(calc.capRev.toFixed(2)) },
                { name: 'Ancillary', value: parseFloat(calc.ancillaryRev.toFixed(2)) },
              ]} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {[T.indigo, T.teal, T.green, T.amber].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip formatter={v => `$${v.toFixed(2)}M`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Project Configuration</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
            {[
              ['Technology', bessInputs.technology],
              ['Market', bessInputs.market],
              ['ITC Amount', `$${(calc.itcAmount / 1000000).toFixed(1)}M`],
              ['Net CAPEX', `$${(calc.netCapex / 1000000).toFixed(1)}M`],
              ['Project Life', `${bessInputs.projectLifeYr} years`],
              ['Cycles/Day', bessInputs.cyclesPerDay],
              ['Availability', `${(bessInputs.availabilityFactor * 100).toFixed(0)}%`],
              ['Annual Energy', `${calc.annualEnergyMWh.toFixed(0)} MWh`],
            ].map(([k, v], i) => (
              <div key={i} style={{ padding: '6px 10px', background: '#F9F9F7', borderRadius: 4, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 10, color: T.sub }}>{k}</div>
                <div style={{ fontWeight: 700, color: T.text, fontFamily: 'JetBrains Mono, monospace' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: '8px 12px', background: scorecard.color + '15', border: `1px solid ${scorecard.color}`, borderRadius: 6, fontSize: 12, fontWeight: 700, color: scorecard.color }}>
            Investment Signal: {scorecard.recommendation} (score {scorecard.weighted}/5.0)
          </div>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>20-Year Revenue Projection (Stacked $M)</SectionTitle>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={calc.revenueProjection} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}M`} />
            <Tooltip content={<ChartTip />} />
            <Legend />
            <Area type="monotone" dataKey="arbitrage" name="Arbitrage" stackId="1" stroke={T.indigo} fill={T.indigo + '80'} />
            <Area type="monotone" dataKey="fr" name="Freq Reg" stackId="1" stroke={T.teal} fill={T.teal + '80'} />
            <Area type="monotone" dataKey="capacity" name="Capacity" stackId="1" stroke={T.green} fill={T.green + '80'} />
            <Area type="monotone" dataKey="ancillary" name="Ancillary" stackId="1" stroke={T.amber} fill={T.amber + '80'} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { phase: 'Development', dur: '12-18 mo', status: 'Complete', color: T.green },
          { phase: 'Permitting', dur: '6-12 mo', status: 'Complete', color: T.green },
          { phase: 'Construction', dur: '12-24 mo', status: 'In Progress', color: T.accent },
          { phase: 'COD / Operation', dur: '20 yr', status: 'Planned', color: T.sub },
        ].map((p, i) => (
          <div key={i} style={{ padding: '10px 14px', background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${p.color}`, borderRadius: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{p.phase}</div>
            <div style={{ fontSize: 10, color: T.sub }}>{p.dur}</div>
            <div style={{ fontSize: 10, color: p.color, fontWeight: 600, marginTop: 3 }}>{p.status}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Technology Snapshot — {bessInputs.technology}</SectionTitle>
        {(() => {
          const spec = TECH_SPECS.find(t => t.tech === bessInputs.technology) || TECH_SPECS[0];
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {[
                ['Chemistry', spec.chemistry],
                ['Energy Density', `${spec.energyDensity} Wh/L`],
                ['Cycle Life', `${spec.cycles.toLocaleString()} cycles`],
                ['Fire Risk', spec.fireRisk],
                ['Temp Range', spec.temp],
                ['Applications', spec.applic],
                ['Calendar Life', `${spec.lifeYr} years`],
                ['Round-Trip Eff', `${(spec.rte * 100).toFixed(0)}%`],
              ].map(([k, v], i) => (
                <div key={i} style={{ padding: '8px 12px', background: '#F3F4F6', borderRadius: 4 }}>
                  <div style={{ fontSize: 10, color: T.sub }}>{k}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{v}</div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );

  /* Tab 1 — LCOS Calculator */
  const renderLCOS = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>LCOS Inputs</SectionTitle>
          <InputRow label="CAPEX ($/kWh)" stateKey="capexPerKwh" min={100} max={600} step={5} unit="" />
          <InputRow label="OPEX ($/kWh/yr)" stateKey="opexPerKwhYr" min={2} max={20} step={0.5} unit="" />
          <InputRow label="Cycles/Day" stateKey="cyclesPerDay" min={0.5} max={3} step={0.25} unit="" />
          <InputRow label="Round-Trip Efficiency" stateKey="roundTripEfficiency" min={0.55} max={0.95} step={0.01} unit="" />
          <InputRow label="Discount Rate (WACC)" stateKey="discountRate" min={0.04} max={0.15} step={0.005} unit="" />
          <InputRow label="Project Life (yr)" stateKey="projectLifeYr" min={10} max={30} step={1} unit=" yr" />
          <InputRow label="ITC %" stateKey="taxCreditPct" min={0} max={0.40} step={0.01} unit="" />
        </div>

        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <SectionTitle>LCOS Waterfall ($M)</SectionTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Gross CAPEX', value: parseFloat((calc.capexTotal / 1e6).toFixed(1)), fill: T.red },
                { name: 'ITC Benefit', value: -parseFloat((calc.itcAmount / 1e6).toFixed(1)), fill: T.green },
                { name: 'NPV O&M', value: parseFloat((calc.npvOpex / 1e6).toFixed(1)), fill: T.amber },
                { name: 'NPV Replacement', value: parseFloat((calc.npvReplacement / 1e6).toFixed(1)), fill: T.blue },
                { name: 'Total Cost', value: parseFloat((calc.totalLifecycleCost / 1e6).toFixed(1)), fill: T.indigo },
              ]} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}M`} />
                <Tooltip formatter={v => `$${Math.abs(v).toFixed(1)}M`} />
                <Bar dataKey="value" name="$M">
                  {[T.red, T.green, T.amber, T.blue, T.indigo].map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 12 }}>
              {[
                ['CAPEX Total', `$${(calc.capexTotal / 1e6).toFixed(1)}M`],
                ['ITC Benefit', `-$${(calc.itcAmount / 1e6).toFixed(1)}M`],
                ['NPV O&M', `$${(calc.npvOpex / 1e6).toFixed(1)}M`],
                ['NPV Replacement', `$${(calc.npvReplacement / 1e6).toFixed(1)}M`],
                ['Total Lifecycle', `$${(calc.totalLifecycleCost / 1e6).toFixed(1)}M`],
                ['NPV Energy', `${calc.npvEnergy.toFixed(1)} GWh`],
                ['LCOS', `$${calc.lcos.toFixed(2)}/kWh`],
              ].map(([k, v], i) => (
                <div key={i} style={{ padding: '6px 10px', background: '#F3F4F6', borderRadius: 4 }}>
                  <div style={{ fontSize: 10, color: T.sub }}>{k}</div>
                  <div style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <SectionTitle>LCOS vs Cycles/Day Sensitivity</SectionTitle>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={lcosSensitivity} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="cycles" tick={{ fontSize: 10 }} label={{ value: 'Cycles/Day', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={v => `$${v}/kWh`} />
                <ReferenceLine y={bessInputs.arbitrageSpread / 1000} stroke={T.green} strokeDasharray="4 4" label={{ value: 'Arb Spread', position: 'right', fontSize: 9 }} />
                <Line type="monotone" dataKey="lcos" name="LCOS $/kWh" stroke={T.indigo} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>LCOS vs RTE Sensitivity ($/kWh impact per 1% RTE change)</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={Array.from({ length: 16 }, (_, i) => {
              const rte = 0.60 + i * 0.025;
              const annE = bessInputs.cyclesPerDay * 365 * bessInputs.capacityMWh * rte;
              let npvE = 0;
              for (let y = 1; y <= bessInputs.projectLifeYr; y++) {
                const cf = 0.02 * Math.sqrt(y); const cc = bessInputs.cyclesPerDay * 365 * y * 0.00002;
                const fade = Math.sqrt(cf ** 2 + cc ** 2);
                npvE += (annE * Math.max(0.70, 1 - fade) / 1000) / Math.pow(1 + bessInputs.discountRate, y);
              }
              const lc = npvE > 0 ? (calc.totalLifecycleCost / (npvE * 1000000)) * 1000 : 0;
              return { rte: `${(rte * 100).toFixed(0)}%`, lcos: parseFloat(lc.toFixed(3)) };
            })} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="rte" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => `$${v}/kWh`} />
              <ReferenceLine x={`${(bessInputs.roundTripEfficiency * 100).toFixed(0)}%`} stroke={T.accent} strokeDasharray="4 4" label={{ value: 'Current', fontSize: 9, fill: T.accent }} />
              <Line type="monotone" dataKey="lcos" name="LCOS $/kWh" stroke={T.teal} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12 }}>
            <div style={{ marginBottom: 10, fontWeight: 700, color: T.text }}>LCOS Breakeven Analysis</div>
            {[
              { label: 'Current LCOS', value: `$${calc.lcos.toFixed(3)}/kWh`, color: T.text },
              { label: 'Arbitrage Spread (target)', value: `$${(bessInputs.arbitrageSpread / 1000).toFixed(3)}/kWh`, color: T.sub },
              { label: 'Breakeven Gap', value: `${calc.lcos < bessInputs.arbitrageSpread / 1000 ? 'ECONOMIC' : 'UNECONOMIC'} by $${Math.abs(calc.lcos - bessInputs.arbitrageSpread / 1000).toFixed(3)}/kWh`, color: calc.lcos < bessInputs.arbitrageSpread / 1000 ? T.green : T.red },
              { label: 'Min Cycles for Breakeven', value: `${(calc.lcos / (bessInputs.arbitrageSpread / 1000) * bessInputs.cyclesPerDay).toFixed(2)} cycles/day`, color: T.sub },
              { label: 'Yr-1 EBITDA Margin', value: `${calc.totalRevYr1 > 0 ? ((calc.totalRevYr1 - bessInputs.opexPerKwhYr * bessInputs.capacityMWh * 1000 / 1e6) / calc.totalRevYr1 * 100).toFixed(1) : 0}%`, color: T.indigo },
            ].map(({ label, value, color }, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ color: T.sub }}>{label}</span>
                <span style={{ fontWeight: 700, color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>CAPEX Trajectory & LCOS by Technology</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={CAPEX_TRAJECTORY} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => `$${v}/kWh`} />
              <Legend />
              <Line type="monotone" dataKey="LFP" stroke={T.indigo} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="NMC" stroke={T.teal} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Vanadium" stroke={T.green} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="NaS" stroke={T.amber} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <Table
            headers={['Technology', 'CAPEX $/kWh', 'LCOS est. $/kWh', 'RTE', 'Life (yr)']}
            rows={TECH_SPECS.map(t => {
              const annE = bessInputs.cyclesPerDay * 365 * bessInputs.capacityMWh * t.rte;
              const lc = t.capexKwh * bessInputs.capacityMWh * 1000 * 0.7 / (annE * bessInputs.projectLifeYr * 1000) * 1000;
              return [t.tech, `$${t.capexKwh}`, `$${lc.toFixed(3)}`, `${(t.rte * 100).toFixed(0)}%`, t.lifeYr];
            })}
          />
        </div>
      </div>
    </div>
  );

  /* Tab 2 — Revenue Stacking */
  const renderRevenue = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Revenue Levers</SectionTitle>
          <div style={{ marginBottom: 12, fontSize: 11, color: T.sub }}>Market</div>
          <select value={bessInputs.market} onChange={e => set('market', e.target.value)}
            style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: `1px solid ${T.border}`, fontSize: 12, marginBottom: 14 }}>
            {MARKETS_BESS.map(m => <option key={m.market} value={m.market}>{m.market}</option>)}
          </select>
          <InputRow label="Arbitrage Spread ($/MWh)" stateKey="arbitrageSpread" min={5} max={120} step={1} unit="" />
          <InputRow label="FR Price ($/MW-hr)" stateKey="frPrice" min={5} max={40} step={0.5} unit="" />
          <InputRow label="FR Capacity (MW)" stateKey="frCapacityMW" min={0} max={bessInputs.powerMW} step={1} unit=" MW" />
          <InputRow label="Cap Payment ($/MW-day)" stateKey="capacityPaymentMWDay" min={0} max={30} step={0.25} unit="" />
          <InputRow label="Availability Factor" stateKey="availabilityFactor" min={0.80} max={0.99} step={0.01} unit="" />
          <div style={{ marginTop: 12, padding: '10px 12px', background: T.green + '15', borderRadius: 6, fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: T.green }}>Total Year-1: ${calc.totalRevYr1.toFixed(2)}M</div>
            <div style={{ color: T.sub, fontSize: 11 }}>$/kWh/yr: {(calc.totalRevYr1 * 1e6 / (bessInputs.capacityMWh * 1000)).toFixed(2)}</div>
          </div>
        </div>

        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <SectionTitle>20-Year Revenue by Stream ($M)</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={calc.revenueProjection} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}M`} />
                <Tooltip content={<ChartTip />} />
                <Legend />
                <Bar dataKey="arbitrage" name="Arbitrage" stackId="a" fill={T.indigo} />
                <Bar dataKey="fr" name="Freq Reg" stackId="a" fill={T.teal} />
                <Bar dataKey="capacity" name="Capacity" stackId="a" fill={T.green} />
                <Bar dataKey="ancillary" name="Ancillary" stackId="a" fill={T.amber} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <SectionTitle>Market Comparison — Total Year-1 Revenue ($M)</SectionTitle>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[...marketComparison].sort((a, b) => b.total - a.total)} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}M`} />
                <YAxis type="category" dataKey="market" tick={{ fontSize: 10 }} width={60} />
                <Tooltip formatter={v => `$${v.toFixed(2)}M`} />
                <Bar dataKey="total" name="Total Revenue" fill={T.indigo} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Seasonality — Monthly Revenue by Stream ($M)</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={seasonalRevenue} margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v.toFixed(2)}M`} />
            <Tooltip content={<ChartTip />} />
            <Legend />
            <Area type="monotone" dataKey="arbitrage" name="Arbitrage" stackId="1" stroke={T.indigo} fill={T.indigo + '80'} />
            <Area type="monotone" dataKey="fr" name="Freq Reg" stackId="1" stroke={T.teal} fill={T.teal + '80'} />
            <Area type="monotone" dataKey="capacity" name="Capacity" stackId="1" stroke={T.green} fill={T.green + '80'} />
            <Area type="monotone" dataKey="ancillary" name="Ancillary" stackId="1" stroke={T.amber} fill={T.amber + '80'} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Grid Service Market Access Requirements</SectionTitle>
        <Table
          headers={['Market', 'Arbitrage Spread', 'FR Price', 'Cap Payment', 'Ancillary', 'Access']}
          rows={MARKETS_BESS.map(m => [m.market, `$${m.arbitrageSpread}/MWh`, `$${m.frPrice}/MW-hr`, m.capPayMWDay ? `$${m.capPayMWDay}/MW-day` : 'N/A', `$${m.ancillary}/MW-hr`, m.access])}
        />
      </div>

      <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Revenue Stacking Waterfall — Annual Contribution per Stream</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { stream: 'Energy Arbitrage', value: calc.arbitrageRev, pct: calc.totalRevYr1 > 0 ? (calc.arbitrageRev / calc.totalRevYr1 * 100) : 0, color: T.indigo, formula: `$${bessInputs.arbitrageSpread}/MWh × ${bessInputs.cyclesPerDay} cycles/day × 365 × ${bessInputs.capacityMWh}MWh × ${bessInputs.roundTripEfficiency} RTE` },
            { stream: 'Frequency Regulation', value: calc.frRev, pct: calc.totalRevYr1 > 0 ? (calc.frRev / calc.totalRevYr1 * 100) : 0, color: T.teal, formula: `$${bessInputs.frPrice}/MW-hr × ${bessInputs.frCapacityMW}MW × 8,760h × ${bessInputs.availabilityFactor} avail` },
            { stream: 'Capacity Market', value: calc.capRev, pct: calc.totalRevYr1 > 0 ? (calc.capRev / calc.totalRevYr1 * 100) : 0, color: T.green, formula: `$${bessInputs.capacityPaymentMWDay}/MW-day × ${bessInputs.powerMW}MW × 365 × ${bessInputs.availabilityFactor}` },
            { stream: 'Ancillary Services', value: calc.ancillaryRev, pct: calc.totalRevYr1 > 0 ? (calc.ancillaryRev / calc.totalRevYr1 * 100) : 0, color: T.amber, formula: `$8/MW-hr × ${bessInputs.powerMW - bessInputs.frCapacityMW}MW × 3,000h/yr` },
          ].map((s, i) => (
            <div key={i} style={{ padding: '12px 14px', background: '#F9F9F7', border: `1px solid ${T.border}`, borderLeft: `4px solid ${s.color}`, borderRadius: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 4 }}>{s.stream}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>${s.value.toFixed(2)}M</div>
              <div style={{ fontSize: 11, color: T.sub }}>{s.pct.toFixed(1)}% of total</div>
              <div style={{ fontSize: 9, color: T.sub, marginTop: 6, lineHeight: 1.4 }}>{s.formula}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* Tab 3 — Degradation Model */
  const renderDegradation = () => (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <KpiCard label="Replacement Year" value={calc.replacementYear} unit="yr" sub="at 80% capacity fade" color={T.amber} />
        <KpiCard label="Year-20 Capacity" value={(degradationSeries[Math.min(20, degradationSeries.length - 1)]?.capacity || 0).toFixed(1)} unit="%" color={T.red} />
        <KpiCard label="Total EFC" value={(bessInputs.cyclesPerDay * 365 * bessInputs.projectLifeYr).toFixed(0)} unit="cycles" color={T.teal} />
        <KpiCard label="Degradation Cost" value={(calc.totalEnergyGWh > 0 ? (calc.npvReplacement / 1e6) / calc.totalEnergyGWh : 0).toFixed(2)} unit="$/MWh" sub="amortized replacement" color={T.blue} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Combined Capacity Fade (%) over Project Life</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={degradationSeries} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: 'Years', position: 'insideBottom', offset: -5, fontSize: 10 }} />
              <YAxis domain={[60, 105]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={v => `${v}%`} />
              <ReferenceLine y={80} stroke={T.red} strokeDasharray="4 4" label={{ value: 'EOL 80%', position: 'right', fontSize: 9, fill: T.red }} />
              <Line type="monotone" dataKey="capacity" name="Capacity %" stroke={T.indigo} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Calendar vs Cycle Aging Contribution (%)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={degradationSeries} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
              <Tooltip content={<ChartTip />} />
              <Legend />
              <Area type="monotone" dataKey="calFade" name="Calendar Fade %" stackId="1" stroke={T.amber} fill={T.amber + '80'} />
              <Area type="monotone" dataKey="cycFade" name="Cycle Fade %" stackId="1" stroke={T.red} fill={T.red + '80'} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Temperature Impact on Degradation Rate</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 12 }}>
          {[
            { temp: '15°C', mult: 0.70, note: 'Cold climate — slower aging' },
            { temp: '25°C', mult: 1.00, note: 'Standard (reference)' },
            { temp: '35°C', mult: 1.45, note: 'Hot climate — accelerated aging' },
          ].map((t, i) => (
            <div key={i} style={{ padding: '10px 14px', background: '#F9F9F7', border: `1px solid ${T.border}`, borderRadius: 6 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: 'JetBrains Mono, monospace' }}>{t.temp}</div>
              <div style={{ fontSize: 12, color: T.sub }}>{t.note}</div>
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: t.mult > 1 ? T.red : T.green }}>
                {t.mult}× degradation rate
              </div>
              <div style={{ fontSize: 11, color: T.sub }}>
                Replacement at yr {Math.round(calc.replacementYear / t.mult)}
              </div>
            </div>
          ))}
        </div>
        <SectionTitle>Technology Degradation Comparison</SectionTitle>
        <Table
          headers={['Technology', 'Cycle Fade (%/cycle)', 'Calendar Fade (%/√yr)', 'EOL Cycles', 'Life (yr)', 'RUL@10yr']}
          rows={TECH_SPECS.map(t => {
            const calF = t.calFade * Math.sqrt(10) * 100;
            const cycF = bessInputs.cyclesPerDay * 365 * 10 * t.cycleFade * 100;
            const totalF = Math.sqrt(calF ** 2 + cycF ** 2);
            const rul = Math.max(0, (20 - totalF / 2)).toFixed(1);
            return [t.tech, `${t.cycleFade * 100}%`, `${(t.calFade * 100).toFixed(1)}%/√yr`, t.cycles.toLocaleString(), t.lifeYr, `${rul} yr`];
          })}
        />
      </div>

      <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Capacity Augmentation Schedule to Maintain Contracted Capacity</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={augmentationSchedule} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 9 }} label={{ value: 'Years', position: 'insideBottom', offset: -5, fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${v} MWh`} />
                <Tooltip formatter={(v, n) => [`${v} MWh`, n]} />
                <Legend />
                <Area type="monotone" dataKey="actual" name="Actual Capacity" stroke={T.indigo} fill={T.indigo + '40'} />
                <Area type="monotone" dataKey="contracted" name="Contracted" stroke={T.green} fill="none" strokeDasharray="5 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Augmentation events required (augment when actual &lt; contracted):</div>
            <Table
              small
              headers={['Year', 'Actual (MWh)', 'Deficit (MWh)', 'Aug Cost ($k)']}
              rows={augmentationSchedule.filter(r => r.deficit > 0.5).map(r => [
                `Y${r.year}`, r.actual.toFixed(0), r.deficit.toFixed(0), r.augCost.toFixed(0)
              ])}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>State-of-Charge (SOC) Impact on Degradation</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { soc: '90–100% (High Voltage)', mult: 1.8, note: 'Lithium plating risk, electrolyte oxidation — AVOID in cycling' },
            { soc: '20–90% (Operating)', mult: 1.0, note: 'Normal operating window — optimal for LFP chemistry' },
            { soc: '0–10% (Deep Discharge)', mult: 1.4, note: 'Copper dissolution risk below 2.5V/cell — set 5% SOC floor' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '10px 14px', background: '#F9F9F7', border: `1px solid ${T.border}`, borderRadius: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{s.soc}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.mult > 1.2 ? T.red : T.green, fontFamily: 'JetBrains Mono, monospace' }}>{s.mult}× fade rate</div>
              <div style={{ fontSize: 10, color: T.sub, marginTop: 4 }}>{s.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* Tab 4 — Optimal Dispatch */
  const renderDispatch = () => (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <KpiCard label="Daily Arbitrage Rev" value={dispatchSim.dailyRev.toFixed(0)} unit="$" color={T.green} />
        <KpiCard label="Annual Arbitrage Rev" value={dispatchSim.annualRev.toFixed(2)} unit="$M" color={T.indigo} />
        <KpiCard label="Dispatch Hours" value={Math.round(bessInputs.capacityMWh / bessInputs.powerMW)} unit="hr" sub="Duration at rated power" color={T.teal} />
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionTitle>24-Hour LMP Price Curve & Dispatch Schedule</SectionTitle>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dispatchSim.curve} margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
            <YAxis yAxisId="lmp" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} label={{ value: 'LMP $/MWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
            <YAxis yAxisId="soc" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} label={{ value: 'SOC %', angle: 90, position: 'insideRight', fontSize: 10 }} />
            <Tooltip content={<ChartTip />} />
            <Legend />
            <Line yAxisId="lmp" type="monotone" dataKey="lmp" name="LMP $/MWh" stroke={T.amber} strokeWidth={2} dot={false} />
            <Line yAxisId="soc" type="monotone" dataKey="soc" name="SOC %" stroke={T.indigo} strokeWidth={2} dot={false} strokeDasharray="5 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Charge Schedule (MWh per hour)</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dispatchSim.curve} margin={{ left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="hour" tick={{ fontSize: 8 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="charge" name="Charge MWh" fill={T.green} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Discharge Schedule (MWh per hour)</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dispatchSim.curve} margin={{ left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="hour" tick={{ fontSize: 8 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="discharge" name="Discharge MWh" fill={T.red} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionTitle>Summer vs Winter Price Curve Comparison</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={PRICE_CURVE_24H.map((d, h) => ({
            hour: `${h}:00`,
            summer: parseFloat((d.lmp * 1.30 + (sr(h * 3) - 0.5) * 6).toFixed(1)),
            winter: parseFloat((d.lmp * 0.85 + (sr(h * 5) - 0.5) * 5).toFixed(1)),
            base: parseFloat(d.lmp.toFixed(1)),
          }))} margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={v => `$${v}/MWh`} />
            <Legend />
            <Line type="monotone" dataKey="summer" name="Summer (Jul-Aug)" stroke={T.red} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="winter" name="Winter (Dec-Jan)" stroke={T.blue} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="base" name="Annual Avg" stroke={T.sub} strokeWidth={1} dot={false} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Dispatch Strategy Comparison</SectionTitle>
        <Table
          headers={['Strategy', 'Annual Revenue', 'Description', 'Best For']}
          rows={[
            ['Greedy (Price-Optimal)', `$${dispatchSim.annualRev.toFixed(2)}M`, 'Charge lowest LMP hours, discharge highest', 'Energy arbitrage markets'],
            ['Flat (Morning/Evening)', `$${(dispatchSim.annualRev * 0.82).toFixed(2)}M`, 'Charge 6-9am, discharge 5-8pm', 'Predictable residential demand'],
            ['FR Priority', `$${(calc.frRev).toFixed(2)}M (FR only)`, 'Hold capacity for frequency regulation', 'High FR price markets (CAISO, PJM)'],
            ['Blended Stack', `$${(dispatchSim.annualRev * 0.91 + calc.frRev * 0.4).toFixed(2)}M`, 'FR daytime + arbitrage overnight', 'Maximize total stack revenue'],
          ]}
        />
        <div style={{ marginTop: 10, padding: '8px 12px', background: T.indigo + '10', borderRadius: 6, fontSize: 11, color: T.sub }}>
          Note: Full MILP (Mixed Integer Linear Programming) optimization available via Python integration for co-optimized multi-service dispatch.
        </div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { label: 'Negative LMP Events', value: `${PRICE_CURVE_24H.filter(h => h.lmp < 0).length} hr/day`, note: 'Hours when charging is profitable (paid to consume)' },
            { label: 'Revenue per EFC', value: `$${(dispatchSim.dailyRev / bessInputs.capacityMWh).toFixed(2)}/MWh`, note: 'Daily revenue per MWh dispatched through full cycle' },
            { label: 'Charge Cost per MWh', value: `$${((PRICE_CURVE_24H.filter(h => h.lmp > 0).reduce((s, h) => s + h.lmp, 0) / Math.max(1, PRICE_CURVE_24H.filter(h => h.lmp > 0).length))).toFixed(1)}/MWh`, note: 'Average LMP during charge windows' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '10px 12px', background: '#F9F9F7', border: `1px solid ${T.border}`, borderRadius: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: T.indigo, margin: '4px 0' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: T.sub }}>{s.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* Tab 5 — Grid Services */
  const renderGridServices = () => (
    <div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionTitle>FERC Order 841 — Market Participation Requirements (2018)</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, fontSize: 12 }}>
          {[
            ['Physical Withholding', 'Not permitted — full capacity available to market'],
            ['Minimum Size Threshold', 'Waived per Order 841 — any size eligible'],
            ['State-of-Charge Management', 'ISO/RTO must allow self-management of SOC'],
            ['Interconnection Voltage', 'No additional voltage requirements for storage'],
            ['Metering', 'Revenue-grade bi-directional meter required'],
            ['Telemetry', 'SCADA / AGC signal interface at ≤4s resolution'],
          ].map(([k, v], i) => (
            <div key={i} style={{ padding: '8px 12px', background: '#F3F4F6', borderRadius: 4, border: `1px solid ${T.border}` }}>
              <div style={{ fontWeight: 700, color: T.text, marginBottom: 3 }}>{k}</div>
              <div style={{ color: T.sub }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionTitle>Grid Service Revenue Matrix ($M/yr) — All Markets</SectionTitle>
        <Table
          headers={['Market', 'Arbitrage', 'Freq Reg', 'Capacity', 'Ancillary', 'Total', 'Access']}
          rows={marketComparison.map(m => {
            const mkt = MARKETS_BESS.find(x => x.market === m.market);
            return [m.market, `$${m.arbitrage.toFixed(2)}M`, `$${m.fr.toFixed(2)}M`, `$${m.capacity.toFixed(2)}M`, `$${m.ancillary.toFixed(2)}M`, `$${m.total.toFixed(2)}M`, mkt?.access || 'Full'];
          })}
        />
      </div>

      <div style={{ marginBottom: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Revenue per MW-year by Market and Service ($k/MW-yr)</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={gridHeatmap} margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="market" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}k`} />
            <Tooltip formatter={v => `$${v}k/MW-yr`} />
            <Legend />
            <Bar dataKey="Arbitrage" stackId="a" fill={T.indigo} />
            <Bar dataKey="Freq Reg" stackId="a" fill={T.teal} />
            <Bar dataKey="Capacity" stackId="a" fill={T.green} />
            <Bar dataKey="Ancillary" stackId="a" fill={T.amber} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Frequency Regulation Detail</SectionTitle>
          <div style={{ fontSize: 12, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ color: T.sub }}>FR Capacity Allocated</span>
              <span style={{ fontWeight: 700 }}>{bessInputs.frCapacityMW} MW</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ color: T.sub }}>FR Price</span>
              <span style={{ fontWeight: 700 }}>${bessInputs.frPrice}/MW-hr</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ color: T.sub }}>Performance Target</span>
              <span style={{ fontWeight: 700 }}>&gt;95% AGC accuracy</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ color: T.sub }}>Annual FR Revenue</span>
              <span style={{ fontWeight: 700, color: T.green }}>${calc.frRev.toFixed(2)}M</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: T.sub }}>Response Time Required</span>
              <span style={{ fontWeight: 700 }}>≤200ms (LFP BESS)</span>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>Market FR Prices ($/MW-hr)</div>
            {MARKETS_BESS.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 11, width: 60 }}>{m.market}</span>
                <div style={{ flex: 1, background: '#F3F4F6', height: 12, borderRadius: 2 }}>
                  <div style={{ width: `${(m.frPrice / 25) * 100}%`, background: T.indigo, height: '100%', borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, width: 40 }}>${m.frPrice}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Grid Service Eligibility by Technology</SectionTitle>
          <Table
            small
            headers={['Technology', 'Arbitrage', 'Freq Reg', 'Cap Mkt', 'Black Start', 'Reactive Pwr']}
            rows={[
              ['LFP', 'YES', 'YES', 'YES', 'Possible', 'YES'],
              ['NMC', 'YES', 'YES', 'YES', 'Possible', 'YES'],
              ['Vanadium', 'YES', 'Partial', 'YES', 'YES', 'YES'],
              ['NaS', 'YES', 'Partial', 'YES', 'Possible', 'NO'],
              ['Zinc-Air', 'YES', 'NO', 'YES', 'NO', 'NO'],
              ['LAES', 'YES', 'NO', 'YES', 'YES', 'NO'],
            ]}
          />
          <div style={{ marginTop: 12, fontSize: 11, color: T.sub }}>
            <div style={{ fontWeight: 700, color: T.text, marginBottom: 4 }}>Black Start Revenue (select markets)</div>
            <div>ERCOT: $150k–$400k/yr | PJM: $200k–$500k/yr | ISO-NE: $100k–$300k/yr</div>
            <div style={{ marginTop: 4 }}>FERC Order 2222 (2020): Enables DER aggregation in wholesale markets — BESS as aggregated resource.</div>
          </div>
        </div>
      </div>
    </div>
  );

  /* Tab 6 — Co-location */
  const renderColocation = () => (
    <div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionTitle>Co-location Configuration</SectionTitle>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 280 }}>
            <InputRow label="Enable Solar+BESS Co-location" stateKey="colocationSolar" isToggle />
            {bessInputs.colocationSolar && (
              <>
                <InputRow label="Solar Capacity (MW)" stateKey="solarMW" min={50} max={500} step={10} unit=" MW" />
                <InputRow label="ITC Percentage" stateKey="taxCreditPct" min={0} max={0.40} step={0.01} unit="" />
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <KpiCard label="Co-location Benefit" value={bessInputs.colocationSolar ? calc.colocBenefit.toFixed(2) : '0.00'} unit="$M/yr" color={T.green} />
            <KpiCard label="Clipping Hours" value={bessInputs.colocationSolar ? calc.clippingHours : 0} unit="hr/yr" color={T.teal} />
            <KpiCard label="ITC Amount" value={(calc.itcAmount / 1e6).toFixed(1)} unit="$M" color={T.indigo} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>IRR Comparison</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { case: 'Solar Only', irr: calc.irr * 0.72 },
              { case: 'BESS Only', irr: calc.irr },
              { case: 'Solar+BESS', irr: calc.irr * 1.18 + (bessInputs.colocationSolar ? 1.5 : 0) },
            ]} margin={{ left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="case" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v.toFixed(1)}%`} />
              <Tooltip formatter={v => `${v.toFixed(1)}%`} />
              <ReferenceLine y={10} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Hurdle 10%', position: 'right', fontSize: 9 }} />
              <Bar dataKey="irr" name="Project IRR" fill={T.indigo} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>IRA Section 48 — ITC Benefits</SectionTitle>
          <div style={{ fontSize: 12 }}>
            {[
              ['Standalone BESS ITC (post-IRA 2022)', `${(bessInputs.taxCreditPct * 100).toFixed(0)}%`, 'Yes — historic change'],
              ['Requirement', '≥3hr duration (E/P ratio ≥ 3)', `${bessInputs.capacityMWh / bessInputs.powerMW} hr — ${bessInputs.capacityMWh / bessInputs.powerMW >= 3 ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`],
              ['Domestic Content Bonus', '+10%', 'US-manufactured cells'],
              ['Prevailing Wage Bonus', '+10%', 'Davis-Bacon compliance required'],
              ['Energy Community Bonus', '+10%', 'Coal/oil/gas community location'],
              ['Max ITC (all adders)', '50%', 'Stacking possible'],
              ['BESS CAPEX', `$${(calc.capexTotal / 1e6).toFixed(1)}M`, 'Gross project cost'],
              ['ITC Amount (30%)', `$${(calc.itcAmount / 1e6).toFixed(1)}M`, 'Tax equity value'],
            ].map(([k, v, note], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ color: T.sub, flex: 1 }}>{k}</span>
                <span style={{ fontWeight: 700, color: T.text, marginRight: 10 }}>{v}</span>
                <span style={{ color: T.indigo, fontSize: 10, width: 180, textAlign: 'right' }}>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Clipping Capture & Negative Price Mitigation</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { label: 'Clipping Capture', value: bessInputs.colocationSolar ? `${calc.clippedMWh.toFixed(0)} MWh/yr` : 'N/A', note: `Solar AC exceeds inverter limit by ${bessInputs.solarMW - bessInputs.powerMW} MW` },
            { label: 'Negative Price Hours', value: bessInputs.colocationSolar ? `${calc.negPriceHours} hr/yr` : 'N/A', note: 'BESS absorbs curtailed solar at negative LMP' },
            { label: 'Interconnection Savings', value: bessInputs.colocationSolar ? '$0.8M est.' : 'N/A', note: 'Shared queue position and transformer' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '12px 16px', background: '#F9F9F7', border: `1px solid ${T.border}`, borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: T.sub }}>{item.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: 'JetBrains Mono, monospace', margin: '4px 0' }}>{item.value}</div>
              <div style={{ fontSize: 10, color: T.sub }}>{item.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* Tab 7 — Tech Benchmarking */
  const renderTechBench = () => (
    <div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionTitle>Full Technology Comparison — 2024 Data</SectionTitle>
        <Table
          headers={['Technology', 'Chemistry', 'Energy Density', 'RTE', 'CAPEX $/kWh', 'Life (yr)', 'Cycle Life', 'Fire Risk', 'Temp Range', 'Applications']}
          rows={TECH_SPECS.map(t => [
            t.tech, t.chemistry, `${t.energyDensity} Wh/L`,
            `${(t.rte * 100).toFixed(0)}%`, `$${t.capexKwh}`, t.lifeYr,
            t.cycles.toLocaleString(), t.fireRisk, t.temp, t.applic
          ])}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>CAPEX Trajectory 2020–2030 ($/kWh)</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={CAPEX_TRAJECTORY} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => `$${v}/kWh`} />
              <Legend />
              <Line type="monotone" dataKey="LFP" stroke={T.indigo} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="NMC" stroke={T.teal} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Vanadium" stroke={T.green} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="NaS" stroke={T.amber} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Use Case Matrix by Duration</SectionTitle>
          <Table
            small
            headers={['Duration', 'Primary Tech', 'Notes']}
            rows={[
              ['15 min – 1 hr', 'NMC / LFP', 'Frequency regulation, spinning reserve'],
              ['1 – 2 hr', 'LFP / NMC', 'Peak shifting, arbitrage'],
              ['2 – 4 hr', 'LFP (dominant)', 'Daily arbitrage, capacity market'],
              ['4 – 8 hr', 'LFP / Vanadium', 'Extended peak, solar smoothing'],
              ['8 – 12 hr', 'Vanadium / NaS', 'Long-duration, demand charge'],
              ['Multi-day', 'LAES / Hydrogen', 'Seasonal, grid resilience'],
            ]}
          />
          <div style={{ marginTop: 12, fontSize: 11, color: T.sub, fontWeight: 700 }}>Tier 1 Manufacturers:</div>
          <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>
            CATL · BYD · Samsung SDI · LG Energy Solution · Fluence · Tesla Megapack · Wartsila
          </div>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Warranty Comparison — Capacity Guarantee</SectionTitle>
        <Table
          headers={['Technology', 'Year 5 Guarantee', 'Year 10 Guarantee', 'Year 15 Guarantee', 'Year 20 Guarantee', 'Replacement Policy']}
          rows={[
            ['LFP (CATL/BYD)', '95%', '90%', '85%', '80%', 'Augment to restore'],
            ['NMC (Samsung SDI)', '95%', '88%', '82%', 'N/A', 'Cell replacement'],
            ['Vanadium Flow', '97%', '95%', '92%', '90%', 'Electrolyte refresh'],
            ['NaS (NGK)', '95%', '90%', '85%', '80%', 'Module replacement'],
          ]}
        />
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { label: 'Lithium (Li)', risk: 'Medium', source: 'Chile, Australia, China', ira: 'Limited domestic' },
            { label: 'Cobalt (Co)', risk: 'High', source: 'DRC (70%)', ira: 'Requires sourcing plan' },
            { label: 'Nickel (Ni)', risk: 'Medium', source: 'Indonesia, Philippines', ira: 'FTA-country eligible' },
            { label: 'Vanadium (V)', risk: 'Low', source: 'China, Russia, S Africa', ira: 'US domestic available' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '8px 12px', background: '#F3F4F6', border: `1px solid ${T.border}`, borderRadius: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{m.label}</div>
              <div style={{ fontSize: 10, color: m.risk === 'High' ? T.red : m.risk === 'Medium' ? T.amber : T.green }}>{m.risk} supply risk</div>
              <div style={{ fontSize: 10, color: T.sub }}>{m.source}</div>
              <div style={{ fontSize: 10, color: T.indigo, marginTop: 2 }}>{m.ira}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* Tab 8 — Regulatory */
  const renderRegulatory = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>IRA 2022 — BESS Tax Provisions</SectionTitle>
          {[
            { title: 'Section 48 ITC — Standalone BESS', detail: '30% Investment Tax Credit for BESS with ≥3h duration ratio. Historic change from IRA 2022 — BESS no longer required to be co-located with solar to receive ITC.', tag: 'ACTIVE 2022+' },
            { title: 'Domestic Content Adder', detail: '+10% ITC bonus when cells manufactured in the US. Qualification requires BESS equipment (cells/modules) from FTA-compliant countries or domestic manufacture.', tag: '+10% BONUS' },
            { title: 'Prevailing Wage & Apprenticeship', detail: 'Required to access full 30% ITC. Construction workers must receive Davis-Bacon prevailing wages. Failure to comply reduces credit to 6%.', tag: 'REQUIRED' },
            { title: 'Energy Community Bonus', detail: '+10% bonus for projects located in coal, oil, or natural gas communities. Brownfield sites also qualify.', tag: '+10% BONUS' },
            { title: 'Low-Income Community Bonus', detail: '+10-20% for projects in low-income census tracts or serving low-income households. Annual capacity cap applies.', tag: '+10-20%' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '10px 12px', border: `1px solid ${T.border}`, borderRadius: 6, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{item.title}</div>
                <span style={{ fontSize: 9, padding: '2px 6px', background: T.indigo + '20', color: T.indigo, borderRadius: 3, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 8 }}>{item.tag}</span>
              </div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{item.detail}</div>
            </div>
          ))}
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>State Storage Mandates</SectionTitle>
          <Table
            headers={['State', 'Mandate', 'Target', 'Year']}
            rows={STATE_MANDATES.map(m => [m.state, m.mandate, m.target, m.year])}
          />
          <div style={{ marginTop: 12 }}>
            <SectionTitle>Federal Orders</SectionTitle>
            {[
              { order: 'FERC Order 841 (2018)', summary: 'Remove barriers to BESS participation in organized markets. Requires ISO/RTOs to allow storage to provide all grid services it is technically capable of.' },
              { order: 'FERC Order 2222 (2020)', summary: 'Enables aggregation of distributed energy resources (DERs) including BESS in wholesale markets. Opens path for fleet-scale aggregated dispatch.' },
              { order: 'FERC Order 1920 (2024)', summary: 'Long-term transmission planning reform. Requires utilities to plan for 20 years with storage as transmission asset consideration.' },
            ].map((o, i) => (
              <div key={i} style={{ padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: 6, marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.indigo }}>{o.order}</div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 3 }}>{o.summary}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Fire Safety Standards — NFPA 855 & UL 9540A</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { std: 'NFPA 855', title: 'Standard for Stationary ESS', reqs: ['Maximum energy density per compartment', 'Separation distances from occupancies', 'Sprinkler system requirements', 'Operating temperature limits', 'Emergency response pre-plan'] },
            { std: 'UL 9540A', title: 'Fire Test — Battery ESS', reqs: ['Cell-level thermal runaway test', 'Module propagation test', 'Unit fire characterization', 'Installation fire characterization', 'AHJ approval pathway'] },
            { std: 'IEC 62933', title: 'Grid-Scale ESS Standard', reqs: ['Performance characterization', 'Safety requirements (IEC 62619)', 'Environmental requirements', 'Planning & installation', 'Test procedures'] },
          ].map((s, i) => (
            <div key={i} style={{ padding: '12px 14px', background: '#F9F9F7', border: `1px solid ${T.border}`, borderRadius: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{s.std}</div>
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 6 }}>{s.title}</div>
              {s.reqs.map((r, j) => (
                <div key={j} style={{ fontSize: 10, color: T.text, padding: '2px 0' }}>• {r}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* Tab 9 — Investment Decision */
  const renderInvestment = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <SectionTitle>Go/No-Go Scorecard</SectionTitle>
          {scorecard.criteria.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 11, flex: 1 }}>
                <span style={{ color: T.text, fontWeight: 600 }}>{c.name}</span>
                <span style={{ color: T.sub, marginLeft: 6 }}>({c.weight})</span>
                <div style={{ color: T.sub, fontSize: 10 }}>{c.detail}</div>
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <div key={s} style={{ width: 12, height: 12, borderRadius: 2, background: s <= c.score ? T.indigo : '#E5E7EB' }} />
                ))}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, width: 20, textAlign: 'center' }}>{c.score}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: '14px 18px', background: scorecard.color + '15', border: `2px solid ${scorecard.color}`, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: T.sub }}>Weighted Score</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: scorecard.color, fontFamily: 'JetBrains Mono, monospace' }}>{scorecard.weighted} / 5.0</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: scorecard.color }}>{scorecard.recommendation}</div>
          </div>
        </div>

        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <SectionTitle>Project IRR Monte Carlo (500 runs)</SectionTitle>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              {[['P10', monteCarlo.p10, T.red], ['P50', monteCarlo.p50, T.indigo], ['P90', monteCarlo.p90, T.green]].map(([p, v, c]) => (
                <div key={p} style={{ flex: 1, padding: '8px', background: '#F3F4F6', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: T.sub }}>{p}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: c, fontFamily: 'JetBrains Mono, monospace' }}>{v}%</div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={monteCarlo.bins} margin={{ left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" tick={{ fontSize: 8 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip formatter={v => `${v} simulations`} />
                <Bar dataKey="count" name="Simulations" fill={T.indigo + 'CC'} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <SectionTitle>IRR Sensitivity Tornado (±10% input change)</SectionTitle>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart layout="vertical" data={[
                { driver: 'Arb Spread', impact: parseFloat((calc.irr * 0.18).toFixed(1)) },
                { driver: 'CAPEX', impact: parseFloat((calc.irr * 0.14).toFixed(1)) },
                { driver: 'Cycles/Day', impact: parseFloat((calc.irr * 0.12).toFixed(1)) },
                { driver: 'RTE', impact: parseFloat((calc.irr * 0.09).toFixed(1)) },
                { driver: 'FR Price', impact: parseFloat((calc.irr * 0.07).toFixed(1)) },
                { driver: 'OPEX', impact: parseFloat((calc.irr * 0.05).toFixed(1)) },
              ].sort((a, b) => b.impact - a.impact)} margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => `±${v}%`} />
                <YAxis type="category" dataKey="driver" tick={{ fontSize: 10 }} width={70} />
                <Tooltip formatter={v => `±${v}% IRR`} />
                <Bar dataKey="impact" name="IRR Impact %" fill={T.amber} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionTitle>Project Quality Radar</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={projectRadar}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: T.sub }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} />
              <Radar dataKey="value" stroke={T.indigo} fill={T.indigo} fillOpacity={0.25} />
              <Tooltip formatter={v => `${v}/100`} />
            </RadarChart>
          </ResponsiveContainer>
          <div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Project quality dimensions vs 100-point scale:</div>
            {projectRadar.map((d, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 11, color: T.text }}>{d.subject}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.indigo }}>{d.value}/100</span>
                </div>
                <div style={{ background: '#F3F4F6', borderRadius: 2, height: 6 }}>
                  <div style={{ width: `${d.value}%`, background: d.value >= 80 ? T.green : d.value >= 60 ? T.amber : T.red, height: '100%', borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <SectionTitle>BESS Sizing Sensitivity (Solar Co-location)</SectionTitle>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={sizingSensitivity} margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="ratio" tick={{ fontSize: 10 }} label={{ value: 'BESS/Solar Ratio', position: 'insideBottom', offset: -5, fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={v => `${v}% IRR`} />
            <ReferenceLine y={10} stroke={T.red} strokeDasharray="4 4" label={{ value: 'Hurdle 10%', position: 'right', fontSize: 9 }} />
            <Line type="monotone" dataKey="irr" name="Project IRR" stroke={T.green} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
        <SectionTitle>Comparable Transactions — Recent BESS M&A</SectionTitle>
        <Table
          headers={['Project', 'Capacity', 'Location', 'Year', 'EV/kWh', 'Buyer', 'Technology']}
          rows={[
            ['Crimson Energy Storage', '600 MWh', 'CAISO, CA', 2024, '$185/kWh', 'BlackRock Infrastructure', 'LFP'],
            ['Lakeview BESS', '400 MWh', 'PJM, OH', 2024, '$175/kWh', 'Stonepeak', 'LFP'],
            ['Goldenrod Storage', '1,200 MWh', 'ERCOT, TX', 2023, '$162/kWh', 'Brookfield Renewables', 'LFP'],
            ['Brighton Grid Battery', '250 MWh', 'ISO-NE, MA', 2023, '$195/kWh', 'Macquarie', 'NMC'],
            ['Copper Mountain Storage', '800 MWh', 'CAISO, NV', 2022, '$155/kWh', 'Global Atlantic', 'LFP'],
          ]}
        />
        <div style={{ marginTop: 12, padding: '10px 14px', background: scorecard.color + '15', border: `1px solid ${scorecard.color}`, borderRadius: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: scorecard.color, marginBottom: 4 }}>Investment Recommendation: {scorecard.recommendation}</div>
          <div style={{ fontSize: 11, color: T.sub }}>
            {scorecard.recommendation === 'PROCEED'
              ? `Project IRR of ${calc.irr.toFixed(1)}% exceeds 10% hurdle rate. LCOS of $${calc.lcos.toFixed(2)}/kWh is competitive vs $${bessInputs.arbitrageSpread}/MWh arbitrage spread. ${bessInputs.technology} technology with ${bessInputs.projectLifeYr}-year project life well within bankable envelope. ITC of $${(calc.itcAmount / 1e6).toFixed(1)}M materially improves equity returns.`
              : scorecard.recommendation === 'CONDITIONAL'
              ? `Project economics are marginal. Consider increasing cycles per day, negotiating lower CAPEX, or targeting higher-spread markets (CAISO/PJM). FR revenue uplift could bridge the gap.`
              : `Project does not meet investment criteria. IRR below hurdle rate with current inputs. Material improvement in arbitrage spread, CAPEX reduction, or technology change required.`
            }
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Seasonal Dispatch Patterns ──────────────────────────────────────── */
  const seasonalRevenue = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const seasonMult = [0.78, 0.80, 0.88, 0.92, 1.05, 1.18, 1.30, 1.25, 1.10, 0.95, 0.82, 0.75];
    return months.map((m, i) => ({
      month: m,
      arbitrage: parseFloat((calc.arbitrageRev / 12 * seasonMult[i] * (1 + (sr(i * 3) - 0.5) * 0.05)).toFixed(3)),
      fr: parseFloat((calc.frRev / 12 * (1 + (sr(i * 7) - 0.5) * 0.08)).toFixed(3)),
      capacity: parseFloat((calc.capRev / 12 * (1 + (sr(i * 11) - 0.5) * 0.03)).toFixed(3)),
      ancillary: parseFloat((calc.ancillaryRev / 12 * (1 + (sr(i * 17) - 0.5) * 0.06)).toFixed(3)),
    }));
  }, [calc]);

  /* ── Grid Heatmap Data ────────────────────────────────────────────────── */
  const gridHeatmap = useMemo(() => {
    const services = ['Arbitrage', 'Freq Reg', 'Capacity', 'Ancillary'];
    return MARKETS_BESS.map(m => {
      const arb = m.arbitrageSpread * bessInputs.cyclesPerDay * 365 * bessInputs.powerMW * bessInputs.roundTripEfficiency / 1000;
      const fr = m.frPrice * 8760 * bessInputs.availabilityFactor / 1000;
      const cap = m.capPayMWDay * 365 * bessInputs.availabilityFactor / 1000;
      const anc = m.ancillary * 3000 / 1000;
      return { market: m.market, Arbitrage: parseFloat(arb.toFixed(0)), 'Freq Reg': parseFloat(fr.toFixed(0)), Capacity: parseFloat(cap.toFixed(0)), Ancillary: parseFloat(anc.toFixed(0)) };
    });
  }, [bessInputs]);

  /* ── Augmentation Schedule ────────────────────────────────────────────── */
  const augmentationSchedule = useMemo(() => {
    const contractedCapacity = bessInputs.capacityMWh * 0.90; // 90% of nameplate contracted
    return Array.from({ length: bessInputs.projectLifeYr + 1 }, (_, y) => {
      const calFade = 0.02 * Math.sqrt(y);
      const cycFade = bessInputs.cyclesPerDay * 365 * y * 0.00002;
      const totalFade = Math.sqrt(calFade ** 2 + cycFade ** 2);
      const actual = bessInputs.capacityMWh * Math.max(0.60, 1 - totalFade);
      const deficit = Math.max(0, contractedCapacity - actual);
      const augCost = deficit * bessInputs.capexPerKwh * 0.55 / 1000; // $k
      return { year: y, actual: parseFloat(actual.toFixed(1)), contracted: contractedCapacity, deficit: parseFloat(deficit.toFixed(1)), augCost: parseFloat(augCost.toFixed(0)) };
    });
  }, [bessInputs]);

  /* ── BESS Sizing Sensitivity (for co-location) ────────────────────────── */
  const sizingSensitivity = useMemo(() => {
    const ratios = [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1.0];
    return ratios.map(r => {
      const bessMWh = bessInputs.solarMW * r;
      const clippedE = Math.max(0, bessInputs.solarMW - bessInputs.powerMW) * 350 * r;
      const arbRev = bessInputs.arbitrageSpread * bessInputs.cyclesPerDay * 365 * bessMWh * bessInputs.roundTripEfficiency / 1000000;
      const capexM = bessInputs.capexPerKwh * bessMWh * 1000 * (1 - bessInputs.taxCreditPct) / 1000000;
      const simpleIrr = capexM > 0 ? Math.max(4, ((arbRev + clippedE * 55 / 1000000) * bessInputs.projectLifeYr - capexM) / capexM / bessInputs.projectLifeYr * 100) : 0;
      return { ratio: `${(r * 100).toFixed(0)}%`, bessMWh: parseFloat(bessMWh.toFixed(0)), irr: parseFloat(simpleIrr.toFixed(1)) };
    });
  }, [bessInputs]);

  /* ── Comparable Transactions Radar ───────────────────────────────────── */
  const projectRadar = useMemo(() => [
    { subject: 'IRR Score', value: Math.min(100, calc.irr * 7), fullMark: 100 },
    { subject: 'LCOS Score', value: Math.min(100, Math.max(0, 100 - calc.lcos * 50)), fullMark: 100 },
    { subject: 'RTE', value: bessInputs.roundTripEfficiency * 100, fullMark: 100 },
    { subject: 'Market Access', value: MARKETS_BESS.find(m => m.market === bessInputs.market)?.access === 'Full' ? 90 : 60, fullMark: 100 },
    { subject: 'Regulatory', value: bessInputs.taxCreditPct >= 0.30 ? 85 : 60, fullMark: 100 },
    { subject: 'Technology TRL', value: bessInputs.technology === 'LFP' ? 95 : bessInputs.technology === 'NMC' ? 90 : 75, fullMark: 100 },
  ], [calc, bessInputs]);

  /* ── Tab Renderers Map ────────────────────────────────────────────────── */
  const tabRenderers = [
    renderDashboard, renderLCOS, renderRevenue, renderDegradation,
    renderDispatch, renderGridServices, renderColocation, renderTechBench,
    renderRegulatory, renderInvestment,
  ];

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      {/* Bloomberg-tier header */}
      <div style={{ background: '#0A0F1E', borderBottom: `3px solid ${T.accent}`, padding: '16px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 10, color: T.accent, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em', marginBottom: 4 }}>
              RE-BESS1 · GRID SERVICES ANALYTICS
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              BESS & Grid Services Analytics
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
              Battery storage project economics · Dispatch optimization · Revenue stacking · Grid service valuation
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>TECHNOLOGY</div>
              <div style={{ fontSize: 13, color: T.accent, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{bessInputs.technology}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>MARKET</div>
              <div style={{ fontSize: 13, color: T.accent, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{bessInputs.market}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>IRR</div>
              <div style={{ fontSize: 13, color: calc.irr >= 10 ? '#10B981' : '#EF4444', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{calc.irr.toFixed(1)}%</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>LCOS</div>
              <div style={{ fontSize: 13, color: '#F59E0B', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>${calc.lcos.toFixed(2)}/kWh</div>
            </div>
          </div>
        </div>

        {/* Quick-set technology selector */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          {TECH_SPECS.map(t => (
            <button key={t.tech}
              onClick={() => {
                const spec = TECH_SPECS.find(s => s.tech === t.tech);
                setBessInputs(prev => ({
                  ...prev, technology: t.tech,
                  roundTripEfficiency: spec.rte,
                  capexPerKwh: spec.capexKwh,
                  projectLifeYr: spec.lifeYr,
                }));
              }}
              style={{
                padding: '4px 12px', fontSize: 10, borderRadius: 4, cursor: 'pointer', fontWeight: 600,
                background: bessInputs.technology === t.tech ? T.accent : 'transparent',
                color: bessInputs.technology === t.tech ? '#000' : '#9CA3AF',
                border: `1px solid ${bessInputs.technology === t.tech ? T.accent : '#374151'}`,
                transition: 'all 0.15s',
              }}>
              {t.tech}
            </button>
          ))}
          <select value={bessInputs.market} onChange={e => set('market', e.target.value)}
            style={{ padding: '4px 8px', fontSize: 10, borderRadius: 4, background: '#1F2937', color: '#9CA3AF', border: '1px solid #374151', marginLeft: 8 }}>
            {MARKETS_BESS.map(m => <option key={m.market} value={m.market}>{m.market}</option>)}
          </select>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: '0 28px', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {TABS.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            style={{
              padding: '12px 16px', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: 'transparent', color: activeTab === i ? T.accent : T.sub,
              borderBottom: `2px solid ${activeTab === i ? T.accent : 'transparent'}`,
              whiteSpace: 'nowrap', transition: 'all 0.15s', letterSpacing: '0.02em',
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '20px 28px', maxWidth: 1400, margin: '0 auto' }}>
        {tabRenderers[activeTab]?.()}
      </div>

      {/* Bottom info strip */}
      <div style={{ padding: '10px 28px', background: T.card, borderTop: `1px solid ${T.border}`, display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 10, color: T.sub }}>
        <span>Module: RE-BESS1 · BESS &amp; Grid Services Analytics</span>
        <span>Calculations: LCOS · Revenue Stacking · Degradation · Monte Carlo IRR</span>
        <span>Standards: FERC 841 · IRA §48 · NFPA 855 · UL 9540A · IEC 62933</span>
        <span style={{ marginLeft: 'auto' }}>Data: 2024 benchmarks · {TECH_SPECS.length} technologies · {MARKETS_BESS.length} markets</span>
      </div>

      {/* Terminal status bar */}
      <div style={{ background: '#0A0F1E', borderTop: `1px solid #1F2937`, padding: '6px 28px', display: 'flex', gap: 24, fontSize: 10, color: '#6B7280', fontFamily: 'JetBrains Mono, monospace' }}>
        <span style={{ color: T.accent }}>RE-BESS1</span>
        <span>CAP: {bessInputs.capacityMWh}MWh / {bessInputs.powerMW}MW</span>
        <span>RTE: {(bessInputs.roundTripEfficiency * 100).toFixed(0)}%</span>
        <span>LCOS: ${calc.lcos.toFixed(3)}/kWh</span>
        <span>IRR: {calc.irr.toFixed(1)}%</span>
        <span>ITC: ${(calc.itcAmount / 1e6).toFixed(1)}M</span>
        <span>MARKET: {bessInputs.market}</span>
        <span style={{ marginLeft: 'auto', color: T.green }}>LIVE</span>
      </div>
    </div>
  );
}
