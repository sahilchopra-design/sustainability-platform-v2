import React, { useState, useCallback, useMemo } from 'react';
import EnergyAdvancedAnalytics from '../../_shared/EnergyAdvancedAnalytics';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ComposedChart, Scatter, ScatterChart, RadarChart,
  PolarGrid, PolarAngleAxis, Radar, Cell, PieChart, Pie
} from 'recharts';

// ─── Platform Standards ─────────────────────────────────────────────────────
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E',
  sub: '#6B7280', accent: '#B8860B', indigo: '#4F46E5', green: '#065F46',
  red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E',
  solar: '#D97706', navy: '#0F172A',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TABS = [
  'Overview','Monthly GHI','Temperature','PR Analysis','Energy Yield',
  'Technology Compare','Degradation','Soiling & Loss','P50/P90','Bifacial',
  'Tilt Optimization','Tracker vs Fixed','Shading Analysis','Inverter Performance',
  'Long-Run Trend','Satellite vs Ground','NASA POWER Live','Summary Report',
];

// ─── Location Presets ───────────────────────────────────────────────────────
const LOCATIONS = [
  { name: 'Phoenix, AZ',   lat: 33.4484,  lon: -112.0740, region: 'North America',       ghiBase: 5.98, tempAvg: 23.2 },
  { name: 'Chicago, IL',   lat: 41.8781,  lon:  -87.6298, region: 'North America',       ghiBase: 4.04, tempAvg:  9.8 },
  { name: 'Madrid, ES',    lat: 40.4168,  lon:   -3.7038, region: 'Europe',              ghiBase: 4.87, tempAvg: 14.5 },
  { name: 'Dubai, UAE',    lat: 25.2048,  lon:   55.2708, region: 'Middle East / N Africa', ghiBase: 5.77, tempAvg: 27.1 },
  { name: 'Chennai, IN',   lat: 13.0827,  lon:   80.2707, region: 'South/SE Asia',       ghiBase: 5.33, tempAvg: 28.6 },
  { name: 'Santiago, CL',  lat: -33.4489, lon:  -70.6693, region: 'South America',       ghiBase: 5.12, tempAvg: 14.2 },
  { name: 'Johannesburg',  lat: -26.2041, lon:   28.0473, region: 'Sub-Saharan Africa',  ghiBase: 5.55, tempAvg: 15.8 },
  { name: 'Perth, AU',     lat: -31.9505, lon:  115.8605, region: 'Pacific / ANZ',       ghiBase: 5.43, tempAvg: 18.9 },
  { name: 'Custom',        lat: null,     lon:  null,      region: 'Custom',              ghiBase: 4.50, tempAvg: 15.0 },
];

// ─── Module Technology Config ───────────────────────────────────────────────
const MODULE_TECHS = {
  PERC:    { label: 'Mono PERC',     tempCoeff: -0.0035, annualDeg: 0.0045, lid: 0.015, eff: 0.215, cost: 0.18, bifacial: false, bifGain: 0,    warranty25: 80 },
  BifPERC: { label: 'Bifacial PERC', tempCoeff: -0.0035, annualDeg: 0.0045, lid: 0.010, eff: 0.220, cost: 0.20, bifacial: true,  bifGain: 0.07, warranty25: 80 },
  TOPCon:  { label: 'TOPCon',        tempCoeff: -0.0030, annualDeg: 0.0035, lid: 0.005, eff: 0.235, cost: 0.24, bifacial: true,  bifGain: 0.08, warranty25: 80 },
  HJT:     { label: 'HJT',           tempCoeff: -0.0026, annualDeg: 0.0030, lid: 0.001, eff: 0.245, cost: 0.32, bifacial: true,  bifGain: 0.10, warranty25: 82 },
  CdTe:    { label: 'CdTe (FS)',     tempCoeff: -0.0029, annualDeg: 0.0050, lid: 0.000, eff: 0.195, cost: 0.25, bifacial: false, bifGain: 0,    warranty25: 80 },
};

// ─── Generate seeded monthly resource data ──────────────────────────────────
function buildMonthly(ghiBase, tempAvg, seed = 0) {
  const ghiShape = [0.55, 0.68, 0.88, 1.05, 1.18, 1.25, 1.22, 1.15, 0.97, 0.75, 0.57, 0.48];
  const tempShape = [-0.65, -0.50, -0.10, 0.35, 0.75, 1.10, 1.30, 1.25, 0.85, 0.30, -0.20, -0.55];
  const annual = ghiBase * 365;
  return MONTHS.map((m, i) => {
    const ghi = ghiShape[i] * ghiBase * (1 + (sr(seed + i * 3) - 0.5) * 0.06);
    const dni = ghi * (0.60 + sr(seed + i * 7) * 0.20);
    const dhi = ghi - dni * 0.75;
    const temp = tempAvg + tempShape[i] * Math.abs(tempAvg) * 0.8 + (sr(seed + i * 11) - 0.5) * 2;
    const wind = 2.5 + sr(seed + i * 5) * 3.5;
    const humidity = 35 + sr(seed + i * 13) * 45;
    const clearness = (ghi / (ghiShape[i] * ghiBase + 0.01)).toFixed(2);
    return { month: m, ghi: +ghi.toFixed(2), dni: +dni.toFixed(2), dhi: +dhi.toFixed(2),
             temp: +temp.toFixed(1), wind: +wind.toFixed(1), humidity: +humidity.toFixed(0),
             clearness: +clearness };
  });
}

// ─── PR calculation (IEC 61724) ─────────────────────────────────────────────
function calcPR(monthData, tempCoeff, soilingAnnual, wiring, mismatch, shading, inverterEff) {
  return monthData.map(m => {
    const tCell = m.temp + 25 * 0.03;
    const tempLoss = Math.abs(tempCoeff) * Math.max(0, tCell - 25);
    const totalLoss = soilingAnnual / 100 + wiring / 100 + mismatch / 100 + shading / 100 + (1 - inverterEff / 100);
    const pr = Math.max(0.60, 1 - tempLoss - totalLoss);
    const yieldKwh = m.ghi * pr;
    return { ...m, tCell: +tCell.toFixed(1), tempLoss: +(tempLoss * 100).toFixed(2),
             pr: +(pr * 100).toFixed(1), yieldKwh: +yieldKwh.toFixed(2) };
  });
}

// ─── Degradation curve ──────────────────────────────────────────────────────
function buildDegCurve(years, annualDeg, lid, firstYear = 0.02) {
  return Array.from({ length: years + 1 }, (_, y) => {
    const factor = y === 0 ? 1 : (1 - firstYear - lid) * Math.pow(1 - annualDeg, y - 1);
    return { year: y, factor: +(factor * 100).toFixed(2), loss: +((1 - factor) * 100).toFixed(2) };
  });
}

// ─── P50/P90 (lognormal) ────────────────────────────────────────────────────
function calcP50P90(annualMWh, sigma = 0.07) {
  const p50 = annualMWh;
  const p90 = annualMWh * Math.exp(-1.282 * sigma);
  const p75 = annualMWh * Math.exp(-0.674 * sigma);
  const p99 = annualMWh * Math.exp(-2.326 * sigma);
  return { p50: +p50.toFixed(1), p75: +p75.toFixed(1), p90: +p90.toFixed(1), p99: +p99.toFixed(1) };
}

// ─── Tilt optimization ──────────────────────────────────────────────────────
function buildTiltCurve(lat, ghiBase) {
  const optTilt = Math.abs(lat) * 0.87 + 4;
  return Array.from({ length: 19 }, (_, i) => {
    const tilt = i * 5;
    const penalty = Math.abs(tilt - optTilt) / 90;
    const gain = ghiBase * 365 * (1 - 0.4 * penalty * penalty);
    return { tilt, gain: +gain.toFixed(0), penalty: +(penalty * 100).toFixed(1) };
  });
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const S = {
  page: { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: T.bg, fontFamily: 'DM Sans, sans-serif', color: T.text },
  header: { background: `linear-gradient(135deg, ${T.navy} 0%, #1E293B 60%, #1A1A2E 100%)`, borderBottom: `3px solid ${T.accent}`, padding: '20px 28px' },
  htitle: { color: '#F8F8F2', fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' },
  hsub: { color: '#94A3B8', fontSize: 12, marginTop: 4, fontFamily: 'JetBrains Mono, monospace' },
  body: { display: 'flex', flex: 1 },
  sidebar: { width: 280, background: '#0F172A', borderRight: `1px solid #1E293B`, overflowY: 'auto', padding: '16px 0', flexShrink: 0 },
  sideSection: { marginBottom: 0 },
  sideHead: { padding: '10px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1E293B', borderBottom: '1px solid #334155', userSelect: 'none' },
  sideHeadTxt: { color: '#94A3B8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' },
  sideBody: { padding: '12px 16px' },
  label: { display: 'block', color: '#64748B', fontSize: 11, marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' },
  input: { width: '100%', padding: '6px 8px', background: '#1E293B', border: '1px solid #334155', borderRadius: 4, color: '#E2E8F0', fontSize: 12, boxSizing: 'border-box', marginBottom: 8 },
  select: { width: '100%', padding: '6px 8px', background: '#1E293B', border: '1px solid #334155', borderRadius: 4, color: '#E2E8F0', fontSize: 12, boxSizing: 'border-box', marginBottom: 8 },
  main: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  quickBar: { display: 'flex', gap: 0, background: '#0F172A', borderBottom: `2px solid ${T.accent}`, overflowX: 'auto' },
  qbItem: (active) => ({ padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', color: active ? T.accent : '#64748B', borderBottom: active ? `2px solid ${T.accent}` : '2px solid transparent', background: 'transparent', border: 'none', fontFamily: 'DM Sans, sans-serif' }),
  statsBar: { display: 'flex', gap: 12, padding: '12px 20px', background: '#1E293B', borderBottom: '1px solid #334155', flexWrap: 'wrap' },
  statChip: { background: '#0F172A', border: '1px solid #334155', borderRadius: 4, padding: '6px 12px', textAlign: 'center' },
  statVal: { color: T.accent, fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', display: 'block' },
  statLbl: { color: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' },
  content: { flex: 1, overflowY: 'auto', padding: '20px' },
  card: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px', marginBottom: 16 },
  cardTitle: { fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 },
  kpiCard: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 16px', textAlign: 'center' },
  kpiVal: { fontSize: 22, fontWeight: 700, color: T.indigo, fontFamily: 'JetBrains Mono, monospace' },
  kpiLbl: { fontSize: 11, color: T.sub, marginTop: 4 },
  pill: (col) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: col + '22', color: col }),
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { padding: '8px 10px', background: '#F8F9FA', borderBottom: `2px solid ${T.border}`, textAlign: 'left', fontWeight: 600, fontSize: 11, color: T.sub },
  td: { padding: '7px 10px', borderBottom: `1px solid ${T.border}`, color: T.text },
};

// ─── Reusable Toggle ─────────────────────────────────────────────────────────
function Toggle({ on, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <div onClick={() => onChange(!on)} style={{ width: 36, height: 20, borderRadius: 10, background: on ? T.accent : '#334155', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
      </div>
      <span style={{ color: '#94A3B8', fontSize: 11 }}>{label}</span>
    </div>
  );
}

// ─── Slider ──────────────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step = 1, unit = '', onChange }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={S.label}>{label}</span>
        <span style={{ color: T.accent, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: T.accent }} />
    </div>
  );
}

// ─── Collapsible Section ─────────────────────────────────────────────────────
function SideSection({ title, open, toggle, children }) {
  return (
    <div style={S.sideSection}>
      <div style={S.sideHead} onClick={toggle}>
        <span style={S.sideHeadTxt}>{title}</span>
        <span style={{ color: '#64748B', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && <div style={S.sideBody}>{children}</div>}
    </div>
  );
}

// ─── CHART COLORS ────────────────────────────────────────────────────────────
const COLORS = [T.indigo, T.solar, T.green, T.teal, T.red, '#7C3AED', '#DB2777', '#0891B2'];

export default function SolarResourcePerformancePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [open, setOpen] = useState({ site: true, module: true, losses: false, tracker: false, financial: false, env: false });
  const tog = k => setOpen(o => ({ ...o, [k]: !o[k] }));

  // ── Site Inputs ──
  const [locIdx, setLocIdx] = useState(0);
  const [customLat, setCustomLat] = useState(33.45);
  const [customLon, setCustomLon] = useState(-112.07);
  const [siteCapMW, setSiteCapMW] = useState(100);
  const [dclacRatio, setDclacRatio] = useState(1.25);
  const [tiltDeg, setTiltDeg] = useState(20);
  const [azimuth, setAzimuth] = useState(180);
  const [trackerType, setTrackerType] = useState('fixed'); // 'fixed' | 'singleAxis' | 'dualAxis'
  const [albedo, setAlbedo] = useState(0.20);
  const [gcr, setGcr] = useState(0.40);

  // ── Module Inputs ──
  const [techKey, setTechKey] = useState('TOPCon');
  const [useBifacial, setUseBifacial] = useState(true);
  const [bifacialFactor, setBifacialFactor] = useState(0.70);
  const [nominalPower, setNominalPower] = useState(600); // Wp per module
  const [inverterEff, setInverterEff] = useState(98.0);
  const [analysisYears, setAnalysisYears] = useState(25);

  // ── Loss Inputs ──
  const [soilingAnnual, setSoilingAnnual] = useState(2.0);
  const [wiringLoss, setWiringLoss] = useState(1.5);
  const [mismatchLoss, setMismatchLoss] = useState(1.0);
  const [shadingLoss, setShadingLoss] = useState(1.2);
  const [availabilityLoss, setAvailabilityLoss] = useState(1.5);

  // ── Environmental & Satellite ──
  const [p90Sigma, setP90Sigma] = useState(7.0); // % interannual variability
  const [satelliteUncert, setSatelliteUncert] = useState(3.5);
  const [groundTruth, setGroundTruth] = useState(false);
  const [groundBias, setGroundBias] = useState(1.8);

  // ── Financial ──
  const [ppaPriceMWh, setPpaPriceMWh] = useState(45);
  const [escalator, setEscalator] = useState(1.5);
  const [discountRate, setDiscountRate] = useState(7.0);

  // ── NASA POWER State ──
  const [nasaLoading, setNasaLoading] = useState(false);
  const [nasaData, setNasaData] = useState(null);
  const [nasaError, setNasaError] = useState('');

  const loc = LOCATIONS[locIdx];
  const lat = locIdx === LOCATIONS.length - 1 ? customLat : loc.lat;
  const lon = locIdx === LOCATIONS.length - 1 ? customLon : loc.lon;
  const tech = MODULE_TECHS[techKey];

  // ── Tracker gain ──
  const trackerGain = trackerType === 'singleAxis' ? 1.22 : trackerType === 'dualAxis' ? 1.35 : 1.00;

  // ── Monthly data ──
  const monthData = useMemo(() => buildMonthly(loc.ghiBase * trackerGain, loc.tempAvg, locIdx * 100), [loc, trackerGain, locIdx]);
  const prData = useMemo(() => calcPR(monthData, tech.tempCoeff, soilingAnnual, wiringLoss, mismatchLoss, shadingLoss, inverterEff), [monthData, tech, soilingAnnual, wiringLoss, mismatchLoss, shadingLoss, inverterEff]);

  // ── Bifacial gain ──
  const bifGain = (useBifacial && tech.bifacial) ? tech.bifGain * bifacialFactor * albedo : 0;

  // ── Annual energy ──
  const annualGHI = useMemo(() => prData.reduce((s, m) => s + m.ghi, 0), [prData]);
  const annualPR = useMemo(() => prData.reduce((s, m) => s + m.pr, 0) / 12, [prData]);
  const specificYield = useMemo(() => annualGHI * (annualPR / 100) * (1 + bifGain), [annualGHI, annualPR, bifGain]);
  const annualMWh = useMemo(() => specificYield * siteCapMW * 1000 / 1000, [specificYield, siteCapMW]);
  const cfPct = useMemo(() => annualMWh / (siteCapMW * 8760) * 100, [annualMWh, siteCapMW]);

  // ── P50/P90 ──
  const { p50, p75, p90, p99 } = useMemo(() => calcP50P90(annualMWh, p90Sigma / 100), [annualMWh, p90Sigma]);

  // ── Degradation curve ──
  const degCurve = useMemo(() => buildDegCurve(analysisYears, tech.annualDeg, tech.lid), [analysisYears, tech]);

  // ── Revenue over life ──
  const revenueCurve = useMemo(() => degCurve.map(d => {
    const mwh = annualMWh * d.factor / 100;
    const price = ppaPriceMWh * Math.pow(1 + escalator / 100, d.year);
    const rev = mwh * price / 1e6;
    return { ...d, mwh: +mwh.toFixed(0), price: +price.toFixed(1), rev: +rev.toFixed(2) };
  }), [degCurve, annualMWh, ppaPriceMWh, escalator]);

  const totalRevM = useMemo(() => revenueCurve.reduce((s, d) => s + d.rev, 0), [revenueCurve]);
  const npvFactor = useMemo(() => revenueCurve.reduce((s, d, i) => s + d.rev / Math.pow(1 + discountRate / 100, i + 1), 0), [revenueCurve, discountRate]);

  // ── Tilt curve ──
  const tiltCurve = useMemo(() => buildTiltCurve(lat, loc.ghiBase), [lat, loc.ghiBase]);
  const optTilt = useMemo(() => Math.abs(lat) * 0.87 + 4, [lat]);

  // ── Technology compare ──
  const techCompare = useMemo(() => Object.entries(MODULE_TECHS).map(([k, tc]) => {
    const bf = (useBifacial && tc.bifacial) ? tc.bifGain * bifacialFactor * albedo : 0;
    const yield25 = specificYield * (1 + bf) * (1 - tc.lid - tc.annualDeg * analysisYears / 2);
    const energy25 = yield25 * siteCapMW;
    return { key: k, label: tc.label, eff: tc.eff * 100, tempCoeff: tc.tempCoeff * 100,
             annualDeg: tc.annualDeg * 100, bifacial: tc.bifacial, yield25: +yield25.toFixed(0),
             energy25: +energy25.toFixed(0), cost: tc.cost, relValue: tc.cost ? +(energy25 / tc.cost / 1000).toFixed(1) : null };
  }), [specificYield, siteCapMW, useBifacial, bifacialFactor, albedo, analysisYears]);

  // ── Loss waterfall ──
  const lossWaterfall = useMemo(() => [
    { name: 'POA Irradiance', value: annualGHI, bar: annualGHI },
    { name: '− Temp. Losses', value: -(annualGHI * Math.abs(tech.tempCoeff) * Math.max(0, loc.tempAvg + 15 - 25)), bar: -(annualGHI * Math.abs(tech.tempCoeff) * 5) },
    { name: '− Soiling', value: -(annualGHI * soilingAnnual / 100), bar: -(annualGHI * soilingAnnual / 100) },
    { name: '− Wiring', value: -(annualGHI * wiringLoss / 100), bar: -(annualGHI * wiringLoss / 100) },
    { name: '− Mismatch', value: -(annualGHI * mismatchLoss / 100), bar: -(annualGHI * mismatchLoss / 100) },
    { name: '− Shading', value: -(annualGHI * shadingLoss / 100), bar: -(annualGHI * shadingLoss / 100) },
    { name: '− Inverter', value: -(annualGHI * (1 - inverterEff / 100)), bar: -(annualGHI * (1 - inverterEff / 100)) },
    { name: '+ Bifacial', value: annualGHI * bifGain, bar: annualGHI * bifGain },
    { name: 'Net Yield', value: specificYield, bar: specificYield },
  ], [annualGHI, tech, loc, soilingAnnual, wiringLoss, mismatchLoss, shadingLoss, inverterEff, bifGain, specificYield]);

  // ── Monthly comparison: NASA vs satellite ──
  const nasaCompare = useMemo(() => MONTHS.map((m, i) => {
    const sat = prData[i].ghi;
    const nasa = nasaData ? (nasaData[i] || sat * (1 + (sr(i * 9) - 0.5) * 0.05)) : sat * (1 + (sr(i * 9 + 200) - 0.5) * 0.08);
    const ground = groundTruth ? sat * (1 - groundBias / 100 + (sr(i * 17) - 0.5) * 0.02) : null;
    return { month: m, satellite: +sat.toFixed(2), nasa: +nasa.toFixed(2), ground: ground ? +ground.toFixed(2) : null };
  }), [prData, nasaData, groundTruth, groundBias]);

  // ── Soiling monthly ──
  const soilingMonthly = useMemo(() => MONTHS.map((m, i) => {
    const baseRain = (loc.ghiBase < 4 ? 80 : 45) + sr(i * 7) * 40;
    const dust = soilingAnnual * (1 + (sr(i * 11) - 0.5) * 0.6);
    const loss = dust * (1 - Math.min(1, baseRain / 120));
    return { month: m, soiling: +loss.toFixed(2), rain: +baseRain.toFixed(0) };
  }), [loc, soilingAnnual]);

  // ── Long-run trend (10 years historical) ──
  const longRunTrend = useMemo(() => Array.from({ length: 10 }, (_, i) => {
    const yr = 2015 + i;
    const trend = -0.003 * i; // slight dimming/brightening
    const noise = (sr(i * 23) - 0.5) * 0.06;
    const ghi = annualGHI * (1 + trend + noise);
    return { year: yr, ghi: +ghi.toFixed(0), trend: +(annualGHI * (1 + trend)).toFixed(0) };
  }), [annualGHI]);

  // ── Inverter efficiency curve ──
  const invEffCurve = useMemo(() => Array.from({ length: 21 }, (_, i) => {
    const load = i * 5;
    const eff = load === 0 ? 0 : load < 10 ? 92 + load * 0.4 : load < 25 ? 96 + (load - 10) * 0.12 : Math.min(inverterEff, 99 - (load - 25) * 0.01);
    return { load, eff: +eff.toFixed(2) };
  }), [inverterEff]);

  // ── Shading by hour ──
  const shadingHourly = useMemo(() => Array.from({ length: 24 }, (_, h) => {
    const solar = h >= 6 && h <= 18 ? Math.sin((h - 6) / 12 * Math.PI) : 0;
    const shade = h >= 7 && h <= 9 && gcr > 0.5 ? shadingLoss * (gcr - 0.4) * 2 : h >= 16 && h <= 18 && gcr > 0.5 ? shadingLoss * (gcr - 0.4) * 1.5 : 0;
    return { hour: `${h}:00`, irr: +(solar * loc.ghiBase * 1200 / 8).toFixed(0), shading: +shade.toFixed(2) };
  }), [loc, gcr, shadingLoss]);

  // ── Tracker vs fixed comparison ──
  const trackerCompare = useMemo(() => MONTHS.map((m, i) => {
    const fixed = monthData[i].ghi;
    const singleAxis = fixed * (1.15 + (sr(i * 31) - 0.5) * 0.05);
    const dualAxis = fixed * (1.28 + (sr(i * 37) - 0.5) * 0.04);
    return { month: m, fixed: +fixed.toFixed(2), singleAxis: +singleAxis.toFixed(2), dualAxis: +dualAxis.toFixed(2) };
  }), [monthData]);

  // ── NASA POWER fetch ──
  const fetchNASA = useCallback(async () => {
    setNasaLoading(true);
    setNasaError('');
    try {
      const url = `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${lon}&latitude=${lat}&start=2020&end=2023&format=JSON`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const raw = json?.properties?.parameter?.ALLSKY_SFC_SW_DWN;
      if (!raw) throw new Error('Parameter not found in response');
      const monthly = Array(12).fill(0);
      const counts = Array(12).fill(0);
      Object.entries(raw).forEach(([k, v]) => {
        if (v > 0) { const mo = parseInt(k.slice(4)) - 1; monthly[mo] += v; counts[mo]++; }
      });
      setNasaData(monthly.map((s, i) => counts[i] > 0 ? s / counts[i] : null));
    } catch (e) {
      setNasaError(e.name === 'TimeoutError' ? 'Request timed out — NASA POWER API may be slow' : e.message);
    } finally {
      setNasaLoading(false);
    }
  }, [lat, lon]);

  const fmt = (n, d = 1) => (n ?? 0).toLocaleString('en-US', { maximumFractionDigits: d });

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={S.htitle}>☀️ Solar Resource & Performance Analytics</h1>
            <div style={S.hsub}>RE-RES1 · IEC 61724 · NASA POWER · P50/P90 Probabilistic Yield · Technology Comparison</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ background: '#D1FAE522', color: '#6EE7B7', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
              ⚡ {fmt(annualMWh, 0)} MWh/yr
            </span>
            <span style={{ background: '#FEF3C722', color: T.accent, padding: '4px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
              PR {fmt(annualPR, 1)}%
            </span>
          </div>
        </div>
      </div>

      <div style={S.body}>
        {/* Sidebar */}
        <div style={S.sidebar}>
          <SideSection title="📍 Site & System" open={open.site} toggle={() => tog('site')}>
            <label style={S.label}>Location Preset</label>
            <select style={S.select} value={locIdx} onChange={e => setLocIdx(Number(e.target.value))}>
              {LOCATIONS.map((l, i) => <option key={i} value={i}>{l.name}</option>)}
            </select>
            {locIdx === LOCATIONS.length - 1 && (<>
              <Slider label="Latitude (°)" value={customLat} min={-70} max={70} step={0.1} unit="°" onChange={setCustomLat} />
              <Slider label="Longitude (°)" value={customLon} min={-180} max={180} step={0.1} unit="°" onChange={setCustomLon} />
            </>)}
            <Slider label="System Capacity" value={siteCapMW} min={1} max={500} step={1} unit=" MW" onChange={setSiteCapMW} />
            <Slider label="DC/AC Ratio" value={dclacRatio} min={1.0} max={1.6} step={0.05} unit="x" onChange={setDclacRatio} />
            <Slider label="Tilt Angle" value={tiltDeg} min={0} max={60} step={1} unit="°" onChange={setTiltDeg} />
            <Slider label="Azimuth" value={azimuth} min={90} max={270} step={5} unit="°" onChange={setAzimuth} />
            <Slider label="Ground Coverage Ratio" value={gcr} min={0.2} max={0.7} step={0.05} unit="" onChange={setGcr} />
            <Slider label="Albedo" value={albedo} min={0.10} max={0.50} step={0.01} unit="" onChange={setAlbedo} />
          </SideSection>

          <SideSection title="🔬 Module & Inverter" open={open.module} toggle={() => tog('module')}>
            <label style={S.label}>Module Technology</label>
            <select style={S.select} value={techKey} onChange={e => setTechKey(e.target.value)}>
              {Object.entries(MODULE_TECHS).map(([k, tc]) => <option key={k} value={k}>{tc.label}</option>)}
            </select>
            <Toggle on={useBifacial} onChange={setUseBifacial} label="Enable Bifacial Gain" />
            {useBifacial && tech.bifacial && (
              <Slider label="Bifacial Factor" value={bifacialFactor} min={0.50} max={0.90} step={0.01} unit="" onChange={setBifacialFactor} />
            )}
            <Slider label="Inverter Efficiency" value={inverterEff} min={95.0} max={99.5} step={0.1} unit="%" onChange={setInverterEff} />
            <Slider label="Module Wp" value={nominalPower} min={400} max={750} step={5} unit=" Wp" onChange={setNominalPower} />
            <Slider label="Analysis Period" value={analysisYears} min={10} max={35} step={1} unit=" yr" onChange={setAnalysisYears} />
          </SideSection>

          <SideSection title="📉 Loss Budget" open={open.losses} toggle={() => tog('losses')}>
            <Slider label="Soiling (annual avg)" value={soilingAnnual} min={0.5} max={10.0} step={0.5} unit="%" onChange={setSoilingAnnual} />
            <Slider label="DC Wiring Loss" value={wiringLoss} min={0.5} max={3.0} step={0.1} unit="%" onChange={setWiringLoss} />
            <Slider label="Mismatch Loss" value={mismatchLoss} min={0.5} max={3.0} step={0.1} unit="%" onChange={setMismatchLoss} />
            <Slider label="Shading Loss" value={shadingLoss} min={0.5} max={8.0} step={0.1} unit="%" onChange={setShadingLoss} />
            <Slider label="Availability" value={availabilityLoss} min={0.5} max={5.0} step={0.1} unit="%" onChange={setAvailabilityLoss} />
          </SideSection>

          <SideSection title="🔄 Tracker System" open={open.tracker} toggle={() => tog('tracker')}>
            <label style={S.label}>Mounting Configuration</label>
            <select style={S.select} value={trackerType} onChange={e => setTrackerType(e.target.value)}>
              <option value="fixed">Fixed Tilt</option>
              <option value="singleAxis">Single-Axis Tracker (SAT)</option>
              <option value="dualAxis">Dual-Axis Tracker (DAT)</option>
            </select>
            <div style={{ background: '#1E293B', borderRadius: 4, padding: 8, marginTop: 4 }}>
              <div style={{ color: T.accent, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
                Energy Gain: {trackerType === 'fixed' ? '—' : trackerType === 'singleAxis' ? '+22%' : '+35%'}
              </div>
              <div style={{ color: '#64748B', fontSize: 10, marginTop: 4 }}>vs. fixed tilt baseline</div>
            </div>
          </SideSection>

          <SideSection title="💵 Financial" open={open.financial} toggle={() => tog('financial')}>
            <Slider label="PPA Price" value={ppaPriceMWh} min={20} max={100} step={1} unit=" $/MWh" onChange={setPpaPriceMWh} />
            <Slider label="PPA Escalator" value={escalator} min={0.0} max={4.0} step={0.1} unit="%" onChange={setEscalator} />
            <Slider label="Discount Rate" value={discountRate} min={4.0} max={12.0} step={0.25} unit="%" onChange={setDiscountRate} />
          </SideSection>

          <SideSection title="📡 Uncertainty" open={open.env} toggle={() => tog('env')}>
            <Slider label="Interannual Variability σ" value={p90Sigma} min={3.0} max={15.0} step={0.5} unit="%" onChange={setP90Sigma} />
            <Slider label="Satellite Uncertainty" value={satelliteUncert} min={1.0} max={8.0} step={0.5} unit="%" onChange={setSatelliteUncert} />
            <Toggle on={groundTruth} onChange={setGroundTruth} label="Ground Station Available" />
            {groundTruth && <Slider label="Ground Bias vs Sat" value={groundBias} min={-5.0} max={5.0} step={0.1} unit="%" onChange={setGroundBias} />}
          </SideSection>
        </div>

        {/* Main Content */}
        <div style={S.main}>
          {/* Quick Stats */}
          <div style={S.statsBar}>
            {[
              { v: `${fmt(annualGHI, 0)} kWh/m²`, l: 'Annual GHI' },
              { v: `${fmt(specificYield, 0)} kWh/kWp`, l: 'Specific Yield' },
              { v: `${fmt(annualPR, 1)}%`, l: 'Avg PR (IEC 61724)' },
              { v: `${fmt(annualMWh / 1000, 1)} GWh/yr`, l: 'P50 Generation' },
              { v: `${fmt(cfPct, 1)}%`, l: 'Capacity Factor' },
              { v: `${fmt(p90, 0)} MWh`, l: 'P90 (1-yr)' },
              { v: `$${fmt(totalRevM, 1)}M`, l: `${analysisYears}-yr Revenue` },
            ].map(({ v, l }) => (
              <div key={l} style={S.statChip}>
                <span style={S.statVal}>{v}</span>
                <span style={S.statLbl}>{l}</span>
              </div>
            ))}
          </div>

          {/* Tab Bar */}
          <div style={S.quickBar}>
            {TABS.map((t, i) => (
              <button key={t} style={S.qbItem(activeTab === i)} onClick={() => setActiveTab(i)}>{t}</button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={S.content}>

            {/* ── Tab 0: Overview ── */}
            {activeTab === 0 && (
              <>
                <div style={S.grid3}>
                  {[
                    { label: 'Annual GHI', val: `${fmt(annualGHI, 0)} kWh/m²`, color: T.solar },
                    { label: 'Specific Yield', val: `${fmt(specificYield, 0)} kWh/kWp`, color: T.indigo },
                    { label: 'Performance Ratio', val: `${fmt(annualPR, 1)}%`, color: T.green },
                    { label: 'P50 Generation', val: `${fmt(annualMWh, 0)} MWh/yr`, color: T.teal },
                    { label: 'Capacity Factor', val: `${fmt(cfPct, 1)}%`, color: T.blue },
                    { label: 'P90 (1-yr)', val: `${fmt(p90, 0)} MWh`, color: T.amber },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={S.kpiCard}>
                      <div style={{ ...S.kpiVal, color }}>{val}</div>
                      <div style={S.kpiLbl}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={S.grid2}>
                  <div style={S.card}>
                    <div style={S.cardTitle}>Monthly GHI & Temperature</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <ComposedChart data={prData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis yAxisId="l" tick={{ fontSize: 10 }} />
                        <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar yAxisId="l" dataKey="ghi" fill={T.solar} name="GHI kWh/m²/d" />
                        <Line yAxisId="r" dataKey="temp" stroke={T.red} dot={false} name="Temp °C" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={S.card}>
                    <div style={S.cardTitle}>Monthly Performance Ratio</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={prData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis domain={[60, 100]} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <ReferenceLine y={80} stroke={T.indigo} strokeDasharray="4 2" label={{ value: 'Target 80%', fontSize: 10 }} />
                        <Bar dataKey="pr" fill={T.indigo} name="PR %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Site Summary — {loc.name}</div>
                  <table style={S.table}>
                    <tbody>
                      {[
                        ['Location', `${loc.name} (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`],
                        ['Region', loc.region],
                        ['Module Technology', tech.label],
                        ['System Capacity', `${siteCapMW} MW-ac`],
                        ['Mounting', trackerType === 'fixed' ? `Fixed Tilt ${tiltDeg}°` : trackerType === 'singleAxis' ? 'Single-Axis Tracker' : 'Dual-Axis Tracker'],
                        ['DC/AC Ratio', `${dclacRatio}x`],
                        ['Bifacial', useBifacial && tech.bifacial ? `Yes (factor ${bifacialFactor})` : 'No'],
                        ['25-yr P50 Revenue', `$${fmt(totalRevM, 1)}M`],
                        ['NPV of Revenue', `$${fmt(npvFactor, 1)}M (@ ${discountRate}% WACC)`],
                      ].map(([k, v]) => (
                        <tr key={k}><td style={{ ...S.td, fontWeight: 600, width: 200 }}>{k}</td><td style={S.td}>{v}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Tab 1: Monthly GHI ── */}
            {activeTab === 1 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>Monthly GHI / DNI / DHI — {loc.name}</div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={prData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} label={{ value: 'kWh/m²/day', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ghi" fill={T.solar} name="GHI" />
                      <Bar dataKey="dni" fill={T.accent} name="DNI" />
                      <Bar dataKey="dhi" fill={T.teal} name="DHI" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Monthly Resource Table</div>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {['Month','GHI (kWh/m²/d)','DNI','DHI','Temp (°C)','Wind (m/s)','Clearness'].map(h => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {prData.map(m => (
                        <tr key={m.month}>
                          <td style={{ ...S.td, fontWeight: 600 }}>{m.month}</td>
                          <td style={S.td}>{m.ghi}</td>
                          <td style={S.td}>{m.dni}</td>
                          <td style={S.td}>{m.dhi}</td>
                          <td style={S.td}>{m.temp}</td>
                          <td style={S.td}>{m.wind}</td>
                          <td style={S.td}>{m.clearness}</td>
                        </tr>
                      ))}
                      <tr style={{ background: '#F8F9FA', fontWeight: 700 }}>
                        <td style={S.td}>Annual</td>
                        <td style={S.td}>{fmt(annualGHI, 0)}</td>
                        <td style={S.td}>{fmt(prData.reduce((s, m) => s + m.dni, 0), 0)}</td>
                        <td style={S.td}>{fmt(prData.reduce((s, m) => s + m.dhi, 0), 0)}</td>
                        <td style={S.td}>{fmt(loc.tempAvg, 1)}</td>
                        <td style={S.td}>—</td>
                        <td style={S.td}>{fmt(prData.reduce((s, m) => s + m.clearness, 0) / 12, 2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Tab 2: Temperature ── */}
            {activeTab === 2 && (
              <>
                <div style={S.grid2}>
                  <div style={S.card}>
                    <div style={S.cardTitle}>Monthly Ambient & Cell Temperature</div>
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={prData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        <Line dataKey="temp" stroke={T.blue} name="Ambient °C" dot={false} strokeWidth={2} />
                        <Line dataKey="tCell" stroke={T.red} name="Cell °C (est.)" dot={false} strokeWidth={2} strokeDasharray="4 2" />
                        <ReferenceLine y={25} stroke={T.accent} strokeDasharray="4 2" label={{ value: 'STC 25°C', fontSize: 10 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={S.card}>
                    <div style={S.cardTitle}>Temperature Loss by Month</div>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={prData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} unit="%" />
                        <Tooltip />
                        <Bar dataKey="tempLoss" fill={T.red} name="Temp Loss %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Temperature Coefficient Comparison — {techKey} temp coeff: {(tech.tempCoeff * 100).toFixed(3)}%/°C</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={Array.from({ length: 41 }, (_, i) => {
                      const t = i;
                      return {
                        temp: t,
                        ...Object.fromEntries(Object.entries(MODULE_TECHS).map(([k, tc]) => [k, +(100 + tc.tempCoeff * (t - 25) * 100).toFixed(2)])),
                      };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="temp" tick={{ fontSize: 10 }} label={{ value: 'Cell Temp (°C)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={[85, 102]} unit="%" />
                      <Tooltip />
                      <Legend />
                      <ReferenceLine x={25} stroke={T.accent} strokeDasharray="3 3" />
                      {Object.keys(MODULE_TECHS).map((k, i) => (
                        <Line key={k} dataKey={k} stroke={COLORS[i]} name={MODULE_TECHS[k].label} dot={false} strokeWidth={1.5} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* ── Tab 3: PR Analysis ── */}
            {activeTab === 3 && (
              <>
                <div style={S.grid3}>
                  {[
                    { label: 'Annual PR', val: `${fmt(annualPR, 1)}%`, sub: 'IEC 61724-1', col: T.indigo },
                    { label: 'Summer PR', val: `${fmt(prData.slice(5, 8).reduce((s, m) => s + m.pr, 0) / 3, 1)}%`, sub: 'Jun–Aug avg', col: T.red },
                    { label: 'Winter PR', val: `${fmt(prData.slice(11, 12).concat(prData.slice(0, 2)).reduce((s, m) => s + m.pr, 0) / 3, 1)}%`, sub: 'Dec–Feb avg', col: T.blue },
                  ].map(({ label, val, sub, col }) => (
                    <div key={label} style={S.kpiCard}>
                      <div style={{ ...S.kpiVal, color: col }}>{val}</div>
                      <div style={S.kpiLbl}>{label}</div>
                      <div style={{ color: T.sub, fontSize: 10, marginTop: 2 }}>{sub}</div>
                    </div>
                  ))}
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Loss Waterfall (kWh/m²)</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={lossWaterfall} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="bar" fill={T.indigo} name="kWh/m²">
                        {lossWaterfall.map((d, i) => (
                          <Cell key={i} fill={d.bar < 0 ? T.red : d.name === 'Net Yield' ? T.green : d.name === '+ Bifacial' ? T.teal : T.indigo} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Loss Budget Summary</div>
                  <table style={S.table}>
                    <thead><tr><th style={S.th}>Loss Component</th><th style={S.th}>Setting</th><th style={S.th}>Annual kWh/m² Lost</th><th style={S.th}>% of GHI</th></tr></thead>
                    <tbody>
                      {[
                        ['Temperature', `${(tech.tempCoeff * 100).toFixed(3)}%/°C`, annualGHI * Math.abs(tech.tempCoeff) * 5, null],
                        ['Soiling', `${soilingAnnual}%/yr`, annualGHI * soilingAnnual / 100, null],
                        ['DC Wiring', `${wiringLoss}%`, annualGHI * wiringLoss / 100, null],
                        ['Mismatch', `${mismatchLoss}%`, annualGHI * mismatchLoss / 100, null],
                        ['Shading', `${shadingLoss}%`, annualGHI * shadingLoss / 100, null],
                        ['Inverter', `${(100 - inverterEff).toFixed(1)}%`, annualGHI * (1 - inverterEff / 100), null],
                        ['Availability', `${availabilityLoss}%`, annualGHI * availabilityLoss / 100, null],
                      ].map(([n, s, v]) => (
                        <tr key={n}><td style={S.td}>{n}</td><td style={S.td}>{s}</td>
                          <td style={S.td}>{v.toFixed(1)}</td><td style={S.td}>{(v / annualGHI * 100).toFixed(2)}%</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Tab 4: Energy Yield ── */}
            {activeTab === 4 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>Monthly Energy Yield — {siteCapMW} MW System</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={prData.map(m => ({ ...m, mwh: +(m.ghi * (m.pr / 100) * siteCapMW * 1000 / 1000 / 12).toFixed(0) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} label={{ value: 'MWh', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="mwh" fill={T.solar} name="Monthly MWh">
                        {prData.map((_, i) => <Cell key={i} fill={i >= 5 && i <= 7 ? T.accent : T.solar} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.grid2}>
                  <div style={S.card}>
                    <div style={S.cardTitle}>Revenue by Month</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={prData.map(m => ({ month: m.month, rev: +(m.ghi * (m.pr / 100) * siteCapMW * 1000 / 1000 / 12 * ppaPriceMWh / 1e6).toFixed(3) }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} unit="M$" />
                        <Tooltip />
                        <Bar dataKey="rev" fill={T.green} name="Revenue $M" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={S.card}>
                    <div style={S.cardTitle}>{analysisYears}-Year Revenue with Escalation</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={revenueCurve.slice(1)}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} unit="M$" />
                        <Tooltip />
                        <Area dataKey="rev" fill={T.indigo} stroke={T.indigo} fillOpacity={0.15} name="Annual Rev $M" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* ── Tab 5: Technology Compare ── */}
            {activeTab === 5 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>Technology Comparison — 25-yr Lifetime Energy</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={techCompare} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="label" type="category" width={110} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="energy25" fill={T.indigo} name="25-yr MWh">
                        {techCompare.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Technology Scorecard</div>
                  <table style={S.table}>
                    <thead>
                      <tr>{['Technology','Efficiency','Temp Coeff','Annual Deg.','Bifacial','25yr Yield','Module $/Wp','Value (MWh/$)'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {techCompare.map(tc => (
                        <tr key={tc.key} style={{ background: tc.key === techKey ? '#EEF2FF' : 'white' }}>
                          <td style={{ ...S.td, fontWeight: 600 }}>{tc.label} {tc.key === techKey && <span style={S.pill(T.indigo)}>ACTIVE</span>}</td>
                          <td style={S.td}>{tc.eff.toFixed(1)}%</td>
                          <td style={S.td}>{tc.tempCoeff.toFixed(3)}%/°C</td>
                          <td style={S.td}>{tc.annualDeg.toFixed(3)}%/yr</td>
                          <td style={S.td}><span style={S.pill(tc.bifacial ? T.green : T.sub)}>{tc.bifacial ? 'Yes' : 'No'}</span></td>
                          <td style={S.td}>{fmt(tc.yield25, 0)} kWh/kWp</td>
                          <td style={S.td}>{tc.cost ? `$${tc.cost}` : 'Emerging'}</td>
                          <td style={S.td}>{tc.relValue ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Tab 6: Degradation ── */}
            {activeTab === 6 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>Power Degradation Curve — {tech.label} ({(tech.annualDeg * 100).toFixed(3)}%/yr)</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={degCurve}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: 'Year', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                      <YAxis domain={[70, 102]} tick={{ fontSize: 10 }} unit="%" />
                      <Tooltip />
                      <ReferenceLine y={tech.warranty25 ?? 80} stroke={T.red} strokeDasharray="4 2" label={{ value: `Warranty ${tech.warranty25 ?? 80}%`, fontSize: 10 }} />
                      <Line dataKey="factor" stroke={T.solar} strokeWidth={2} name="Power %" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.grid2}>
                  <div style={S.card}>
                    <div style={S.cardTitle}>Degradation Key Points</div>
                    <table style={S.table}>
                      <tbody>
                        {[1, 5, 10, 15, 20, 25, analysisYears].filter((v, i, a) => a.indexOf(v) === i).filter(y => y <= analysisYears).map(y => {
                          const d = degCurve[Math.min(y, degCurve.length - 1)];
                          return (
                            <tr key={y}>
                              <td style={S.td}>Year {y}</td>
                              <td style={S.td}>{d?.factor.toFixed(2)}%</td>
                              <td style={S.td}>{d?.loss.toFixed(2)}% cumulative loss</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={S.card}>
                    <div style={S.cardTitle}>Cumulative Energy Loss</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={degCurve.slice(1)}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} unit="%" />
                        <Tooltip />
                        <Area dataKey="loss" fill={T.red} stroke={T.red} fillOpacity={0.2} name="Cumulative Loss %" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* ── Tab 7: Soiling & Loss ── */}
            {activeTab === 7 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>Monthly Soiling Loss vs Rainfall — {loc.name}</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={soilingMonthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="l" tick={{ fontSize: 10 }} unit="%" />
                      <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} unit="mm" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="l" dataKey="soiling" fill={T.amber} name="Soiling Loss %" />
                      <Line yAxisId="r" dataKey="rain" stroke={T.blue} name="Rainfall mm" dot={false} strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Cleaning Schedule Optimization</div>
                  <p style={{ color: T.sub, fontSize: 12, marginBottom: 12 }}>
                    At {soilingAnnual}% annual soiling, estimated revenue loss: <strong style={{ color: T.red }}>${fmt(annualMWh * ppaPriceMWh * soilingAnnual / 100 / 1e6, 2)}M/yr</strong>.
                    Cleaning cost assumption: $1,200/MW per cleaning event.
                  </p>
                  <table style={S.table}>
                    <thead><tr><th style={S.th}>Cleanings/Year</th><th style={S.th}>Revenue Recovery $M</th><th style={S.th}>Cleaning Cost $K</th><th style={S.th}>Net Benefit $K</th><th style={S.th}>Optimal?</th></tr></thead>
                    <tbody>
                      {[1, 2, 3, 4, 6, 12].map(n => {
                        const rec = annualMWh * ppaPriceMWh * soilingAnnual / 100 / 1e6 * (n / (n + 1));
                        const cost = n * siteCapMW * 1200 / 1e6;
                        const net = (rec - cost) * 1000;
                        return (
                          <tr key={n} style={{ background: n === 3 ? '#F0FDF4' : 'white' }}>
                            <td style={S.td}>{n}×</td>
                            <td style={S.td}>${fmt(rec, 3)}M</td>
                            <td style={S.td}>${fmt(cost * 1000, 0)}K</td>
                            <td style={{ ...S.td, color: net > 0 ? T.green : T.red, fontWeight: 600 }}>${fmt(net, 0)}K</td>
                            <td style={S.td}>{n === 3 ? <span style={S.pill(T.green)}>✓ OPTIMAL</span> : ''}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Tab 8: P50/P90 ── */}
            {activeTab === 8 && (
              <>
                <div style={S.grid3}>
                  {[
                    { label: 'P50 (Most Likely)', val: `${fmt(p50, 0)} MWh`, color: T.green },
                    { label: 'P75', val: `${fmt(p75, 0)} MWh`, color: T.indigo },
                    { label: 'P90 (Lender Case)', val: `${fmt(p90, 0)} MWh`, color: T.amber },
                    { label: 'P90 Haircut', val: `${fmt((1 - p90 / p50) * 100, 1)}%`, color: T.red },
                    { label: 'P99', val: `${fmt(p99, 0)} MWh`, color: T.red },
                    { label: 'Interannual σ', val: `${p90Sigma}%`, color: T.teal },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={S.kpiCard}>
                      <div style={{ ...S.kpiVal, color }}>{val}</div>
                      <div style={S.kpiLbl}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Probabilistic Yield Distribution (Lognormal)</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={Array.from({ length: 60 }, (_, i) => {
                      const x = p50 * (0.70 + i * 0.015);
                      const z = (Math.log(x / p50)) / (p90Sigma / 100);
                      const pdf = Math.exp(-0.5 * z * z) / (x * (p90Sigma / 100) * Math.sqrt(2 * Math.PI));
                      return { yield: +x.toFixed(0), prob: +(pdf * 1000).toFixed(4) };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="yield" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Area dataKey="prob" fill={T.indigo} stroke={T.indigo} fillOpacity={0.2} name="Probability Density" />
                      <ReferenceLine x={p50} stroke={T.green} label={{ value: 'P50', fontSize: 10 }} />
                      <ReferenceLine x={p90} stroke={T.red} strokeDasharray="4 2" label={{ value: 'P90', fontSize: 10 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Uncertainty Sources</div>
                  <table style={S.table}>
                    <thead><tr><th style={S.th}>Source</th><th style={S.th}>Uncertainty (1σ)</th><th style={S.th}>Type</th></tr></thead>
                    <tbody>
                      {[
                        ['Interannual GHI variability', `${p90Sigma.toFixed(1)}%`, 'Aleatory'],
                        ['Satellite data accuracy', `${satelliteUncert.toFixed(1)}%`, 'Epistemic'],
                        ['Module degradation uncertainty', '1.0%', 'Epistemic'],
                        ['Soiling model uncertainty', '0.8%', 'Aleatory'],
                        ['Measurement bias (if ground)', groundTruth ? `${Math.abs(groundBias).toFixed(1)}%` : 'N/A', 'Systematic'],
                        ['Combined (RSS)', `${Math.sqrt(p90Sigma ** 2 + satelliteUncert ** 2 + 1.0 ** 2 + 0.8 ** 2).toFixed(1)}%`, 'Combined'],
                      ].map(([n, u, t]) => (
                        <tr key={n}><td style={S.td}>{n}</td><td style={S.td}>{u}</td><td style={S.td}><span style={S.pill(t === 'Aleatory' ? T.blue : t === 'Epistemic' ? T.amber : T.teal)}>{t}</span></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Tab 9: Bifacial ── */}
            {activeTab === 9 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>Bifacial Gain Analysis — Albedo {albedo} · BF {bifacialFactor}</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={Array.from({ length: 21 }, (_, i) => {
                      const a = 0.10 + i * 0.02;
                      return {
                        albedo: a.toFixed(2),
                        ...Object.fromEntries(Object.entries(MODULE_TECHS).filter(([, tc]) => tc.bifacial).map(([k, tc]) => [k, +(tc.bifGain * bifacialFactor * a * 100).toFixed(2)])),
                      };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="albedo" tick={{ fontSize: 10 }} label={{ value: 'Albedo', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} unit="%" />
                      <Tooltip />
                      <Legend />
                      <ReferenceLine x={albedo.toFixed(2)} stroke={T.accent} strokeDasharray="3 3" />
                      {Object.entries(MODULE_TECHS).filter(([, tc]) => tc.bifacial).map(([k], i) => (
                        <Line key={k} dataKey={k} stroke={COLORS[i]} name={MODULE_TECHS[k].label} strokeWidth={2} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Bifacial vs Monofacial — Revenue Impact ({analysisYears} yr)</div>
                  <table style={S.table}>
                    <thead><tr><th style={S.th}>Scenario</th><th style={S.th}>Annual MWh</th><th style={S.th}>Bifacial Gain %</th><th style={S.th}>Extra Revenue {analysisYears}yr</th></tr></thead>
                    <tbody>
                      {[
                        { s: 'No Bifacial', bf: 0 },
                        { s: `Albedo 0.10 (dark soil)`, bf: tech.bifGain * bifacialFactor * 0.10 },
                        { s: `Albedo ${albedo} (current)`, bf: bifGain },
                        { s: `Albedo 0.35 (white gravel)`, bf: tech.bifGain * bifacialFactor * 0.35 },
                        { s: `Albedo 0.50 (snow/white membrane)`, bf: tech.bifGain * bifacialFactor * 0.50 },
                      ].map(({ s, bf }) => {
                        const mwh = specificYield * (1 + bf) * siteCapMW * 1000 / 1000;
                        const extraRev = (mwh - annualMWh) * ppaPriceMWh * analysisYears / 1e6;
                        return (
                          <tr key={s} style={{ background: s.includes('current') ? '#EEF2FF' : 'white' }}>
                            <td style={S.td}>{s}</td>
                            <td style={S.td}>{fmt(mwh, 0)}</td>
                            <td style={S.td}>{fmt(bf * 100, 2)}%</td>
                            <td style={{ ...S.td, color: extraRev > 0 ? T.green : T.sub, fontWeight: 600 }}>${fmt(extraRev, 2)}M</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Tab 10: Tilt Optimization ── */}
            {activeTab === 10 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>Tilt Optimization — Optimal: {optTilt.toFixed(1)}° (lat × 0.87 + 4°)</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={tiltCurve}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="tilt" tick={{ fontSize: 10 }} label={{ value: 'Tilt (°)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Area dataKey="gain" fill={T.solar} stroke={T.solar} fillOpacity={0.2} name="Annual GHI (kWh/m²)" />
                      <ReferenceLine x={Math.round(optTilt)} stroke={T.red} strokeDasharray="4 2" label={{ value: 'Optimum', fontSize: 10 }} />
                      <ReferenceLine x={tiltDeg} stroke={T.indigo} label={{ value: 'Current', fontSize: 10 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Seasonal Optimal Tilt</div>
                  <table style={S.table}>
                    <thead><tr><th style={S.th}>Season</th><th style={S.th}>Optimal Tilt</th><th style={S.th}>GHI Gain vs Fixed</th></tr></thead>
                    <tbody>
                      {[
                        ['Winter (Dec–Feb)', (Math.abs(lat) * 0.87 + 4 + 15).toFixed(0), 4.2],
                        ['Spring (Mar–May)', (Math.abs(lat) * 0.87 + 4).toFixed(0), 0],
                        ['Summer (Jun–Aug)', (Math.abs(lat) * 0.87 + 4 - 15).toFixed(0), 3.8],
                        ['Autumn (Sep–Nov)', (Math.abs(lat) * 0.87 + 4).toFixed(0), 0],
                      ].map(([s, t, g]) => (
                        <tr key={s}><td style={S.td}>{s}</td><td style={S.td}>{t}°</td><td style={S.td}>{g > 0 ? `+${g}%` : '—'}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Tab 11: Tracker vs Fixed ── */}
            {activeTab === 11 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>Monthly POA: Fixed vs Single-Axis vs Dual-Axis Tracker</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={trackerCompare}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} label={{ value: 'kWh/m²/day', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Line dataKey="fixed" stroke={T.sub} strokeWidth={2} dot={false} name="Fixed Tilt" />
                      <Line dataKey="singleAxis" stroke={T.solar} strokeWidth={2} dot={false} name="Single-Axis (+22%)" />
                      <Line dataKey="dualAxis" stroke={T.indigo} strokeWidth={2} dot={false} name="Dual-Axis (+35%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Tracker Economics ({analysisYears}-yr NPV)</div>
                  <table style={S.table}>
                    <thead><tr><th style={S.th}>Configuration</th><th style={S.th}>Energy Gain</th><th style={S.th}>Incremental Rev</th><th style={S.th}>Incremental Cost</th><th style={S.th}>Net NPV</th></tr></thead>
                    <tbody>
                      {[
                        { c: 'Fixed Tilt', gain: 0, costInc: 0 },
                        { c: 'Single-Axis (SAT)', gain: 0.22, costInc: siteCapMW * 1000 * 0.03 },
                        { c: 'Dual-Axis (DAT)', gain: 0.35, costInc: siteCapMW * 1000 * 0.08 },
                      ].map(({ c, gain, costInc }) => {
                        const revInc = annualMWh * gain * ppaPriceMWh * analysisYears / 1e6;
                        const npv = revInc - costInc / 1e6;
                        return (
                          <tr key={c}>
                            <td style={S.td}>{c}</td>
                            <td style={S.td}>{gain > 0 ? `+${(gain * 100).toFixed(0)}%` : 'Baseline'}</td>
                            <td style={S.td}>{gain > 0 ? `$${fmt(revInc, 1)}M` : '—'}</td>
                            <td style={S.td}>{gain > 0 ? `$${fmt(costInc / 1e6, 1)}M` : '—'}</td>
                            <td style={{ ...S.td, color: npv > 0 ? T.green : T.red, fontWeight: 600 }}>{gain > 0 ? `$${fmt(npv, 1)}M` : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Tab 12: Shading Analysis ── */}
            {activeTab === 12 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>Hourly Irradiance & Shading — GCR {gcr}</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <ComposedChart data={shadingHourly}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
                      <YAxis yAxisId="l" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="l" dataKey="irr" fill={T.solar} name="POA Irradiance (W/m²)" fillOpacity={0.7} />
                      <Line yAxisId="r" dataKey="shading" stroke={T.red} dot={false} name="Shading Loss %" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>GCR Sensitivity — Annual Shading Loss</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={Array.from({ length: 11 }, (_, i) => {
                      const g = 0.20 + i * 0.05;
                      const shade = shadingLoss * Math.max(0, (g - 0.35) / 0.35) * 2;
                      return { gcr: g.toFixed(2), shading: +shade.toFixed(2) };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="gcr" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} unit="%" />
                      <Tooltip />
                      <ReferenceLine x={gcr.toFixed(2)} stroke={T.accent} label={{ value: 'Current', fontSize: 10 }} />
                      <Line dataKey="shading" stroke={T.red} strokeWidth={2} dot={false} name="Shading Loss %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* ── Tab 13: Inverter Performance ── */}
            {activeTab === 13 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>Inverter Efficiency Curve — CEC/Euro Weighted</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={invEffCurve}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="load" tick={{ fontSize: 10 }} label={{ value: 'Load (%)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                      <YAxis domain={[88, 100]} tick={{ fontSize: 10 }} unit="%" />
                      <Tooltip />
                      <ReferenceLine y={inverterEff} stroke={T.accent} strokeDasharray="4 2" label={{ value: `Peak ${inverterEff}%`, fontSize: 10 }} />
                      <Line dataKey="eff" stroke={T.indigo} strokeWidth={2} dot={false} name="Inverter Eff %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Clipping Analysis — DC/AC Ratio {dclacRatio}x</div>
                  <table style={S.table}>
                    <thead><tr><th style={S.th}>Metric</th><th style={S.th}>Value</th><th style={S.th}>Notes</th></tr></thead>
                    <tbody>
                      {[
                        ['DC/AC Ratio', `${dclacRatio}x`, 'IEC 62109 max rec. 1.3×'],
                        ['Estimated Clipping Loss', `${((dclacRatio - 1) * 3.2).toFixed(1)}%`, 'Higher at low-latitude high GHI sites'],
                        ['Euro-Weighted Efficiency', `${(inverterEff - 0.8).toFixed(1)}%`, 'Weighted across load profile'],
                        ['CEC Efficiency', `${(inverterEff - 0.3).toFixed(1)}%`, 'California Energy Commission'],
                        ['Night Standby Consumption', '0.04% of rated', 'Annual self-consumption'],
                      ].map(([n, v, note]) => (
                        <tr key={n}><td style={S.td}>{n}</td><td style={S.td}>{v}</td><td style={{ ...S.td, color: T.sub }}>{note}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Tab 14: Long-Run Trend ── */}
            {activeTab === 14 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>10-Year Historical GHI Trend — {loc.name}</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={longRunTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} label={{ value: 'Annual GHI kWh/m²', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="ghi" fill={T.solar} fillOpacity={0.6} name="Annual GHI" />
                      <Line dataKey="trend" stroke={T.indigo} strokeWidth={2} dot={false} name="Linear Trend" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Climate Change Impact on Resource (2025–2050 Projection)</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={Array.from({ length: 6 }, (_, i) => {
                      const y = 2025 + i * 5;
                      const rcp26 = annualGHI * (1 + i * 0.003);
                      const rcp45 = annualGHI * (1 - i * 0.005);
                      const rcp85 = annualGHI * (1 - i * 0.012);
                      return { year: y, 'RCP 2.6': +rcp26.toFixed(0), 'RCP 4.5': +rcp45.toFixed(0), 'RCP 8.5': +rcp85.toFixed(0) };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Line dataKey="RCP 2.6" stroke={T.green} strokeWidth={2} dot={false} />
                      <Line dataKey="RCP 4.5" stroke={T.amber} strokeWidth={2} dot={false} />
                      <Line dataKey="RCP 8.5" stroke={T.red} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* ── Tab 15: Satellite vs Ground ── */}
            {activeTab === 15 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>Satellite vs NASA POWER vs Ground Station (if available)</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={nasaCompare}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} label={{ value: 'GHI kWh/m²/d', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Line dataKey="satellite" stroke={T.indigo} strokeWidth={2} dot={false} name="Satellite (SolarAnywhere/Solargis)" />
                      <Line dataKey="nasa" stroke={T.solar} strokeWidth={2} dot={false} strokeDasharray="4 2" name="NASA POWER" />
                      {groundTruth && <Line dataKey="ground" stroke={T.green} strokeWidth={2} dot={{ r: 3 }} name="Ground Station" />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Data Source Uncertainty Budget</div>
                  <table style={S.table}>
                    <thead><tr><th style={S.th}>Source</th><th style={S.th}>Resolution</th><th style={S.th}>Bias (%)</th><th style={S.th}>Random Error (%)</th><th style={S.th}>WMO Class</th></tr></thead>
                    <tbody>
                      {[
                        ['Solargis (v3.1)', '250m / 15min', '±2.0', '±3.5', 'A'],
                        ['SolarAnywhere', '1km / 30min', '±2.5', '±4.0', 'A'],
                        ['NASA POWER (v2.3)', '0.5° / hourly', `±${satelliteUncert}`, '±5.0', 'B'],
                        ['MERRA-2 Reanalysis', '0.625° / hourly', '±4.0', '±6.0', 'B'],
                        ...(groundTruth ? [['Ground Station (CMP11)', '1 min', `±${Math.abs(groundBias)}`, '±0.5', 'A+']] : []),
                      ].map(([n, r, b, e, w]) => (
                        <tr key={n}><td style={S.td}>{n}</td><td style={S.td}>{r}</td><td style={S.td}>{b}%</td><td style={S.td}>{e}%</td>
                          <td style={S.td}><span style={S.pill(w.startsWith('A') ? T.green : T.amber)}>{w}</span></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Tab 16: NASA POWER Live ── */}
            {activeTab === 16 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>🛰️ NASA POWER API — Live Data Fetch</div>
                  <div style={{ background: '#0F172A', borderRadius: 6, padding: 12, marginBottom: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#94A3B8' }}>
                    GET {`https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${lon.toFixed(4)}&latitude=${lat.toFixed(4)}&start=2020&end=2023&format=JSON`}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                    <button
                      onClick={fetchNASA}
                      disabled={nasaLoading}
                      style={{ padding: '8px 18px', background: nasaLoading ? '#334155' : T.accent, color: '#fff', border: 'none', borderRadius: 4, cursor: nasaLoading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600 }}>
                      {nasaLoading ? '⏳ Fetching...' : '🛰 Fetch NASA POWER Data'}
                    </button>
                    {nasaData && <span style={S.pill(T.green)}>✓ Data loaded — {MONTHS.length} months</span>}
                    {nasaError && <span style={{ color: T.red, fontSize: 12 }}>⚠ {nasaError}</span>}
                  </div>
                  {nasaData && (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={MONTHS.map((m, i) => ({ month: m, nasa: nasaData[i] ? +nasaData[i].toFixed(2) : null, model: prData[i].ghi }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="nasa" fill={T.solar} name="NASA POWER (kWh/m²/d)" />
                        <Bar dataKey="model" fill={T.indigo} name="Seeded Model" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {!nasaData && (
                    <div style={{ background: '#1E293B', borderRadius: 6, padding: 24, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                      Click "Fetch NASA POWER Data" to load live irradiance data for {loc.name} (lat {lat.toFixed(2)}, lon {lon.toFixed(2)})
                    </div>
                  )}
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>NASA POWER Parameters Reference</div>
                  <table style={S.table}>
                    <thead><tr><th style={S.th}>Parameter</th><th style={S.th}>Description</th><th style={S.th}>Unit</th></tr></thead>
                    <tbody>
                      {[
                        ['ALLSKY_SFC_SW_DWN', 'All-sky surface shortwave downward irradiance (GHI)', 'kWh/m²/day'],
                        ['CLRSKY_SFC_SW_DWN', 'Clear-sky surface shortwave downward irradiance', 'kWh/m²/day'],
                        ['ALLSKY_SFC_SW_DIFF', 'All-sky diffuse horizontal irradiance (DHI)', 'kWh/m²/day'],
                        ['ALLSKY_NKT', 'All-sky clearness index (Kt)', 'dimensionless'],
                        ['T2M', '2m air temperature', '°C'],
                        ['WS10M', '10m wind speed', 'm/s'],
                        ['PRECTOTCORR', 'Precipitation (for soiling model)', 'mm/day'],
                      ].map(([p, d, u]) => (
                        <tr key={p}><td style={{ ...S.td, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{p}</td><td style={S.td}>{d}</td><td style={S.td}>{u}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Tab 17: Summary Report ── */}
            {activeTab === 17 && (
              <>
                <div style={S.card}>
                  <div style={S.cardTitle}>📋 Resource & Performance Assessment Summary</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 8, color: T.text }}>System Configuration</div>
                      <table style={S.table}>
                        <tbody>
                          {[
                            ['Site', loc.name],
                            ['Coordinates', `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`],
                            ['Capacity', `${siteCapMW} MW-ac`],
                            ['Technology', tech.label],
                            ['Mounting', trackerType === 'fixed' ? `Fixed ${tiltDeg}°` : trackerType === 'singleAxis' ? 'SAT' : 'DAT'],
                            ['DC/AC', `${dclacRatio}×`],
                          ].map(([k, v]) => <tr key={k}><td style={{ ...S.td, fontWeight: 600, width: 130 }}>{k}</td><td style={S.td}>{v}</td></tr>)}
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 8, color: T.text }}>Key Results</div>
                      <table style={S.table}>
                        <tbody>
                          {[
                            ['Annual GHI', `${fmt(annualGHI, 0)} kWh/m²`],
                            ['Specific Yield', `${fmt(specificYield, 0)} kWh/kWp`],
                            ['P50 Generation', `${fmt(annualMWh, 0)} MWh/yr`],
                            ['P90 Generation', `${fmt(p90, 0)} MWh/yr`],
                            ['Performance Ratio', `${fmt(annualPR, 1)}%`],
                            ['Capacity Factor', `${fmt(cfPct, 1)}%`],
                          ].map(([k, v]) => <tr key={k}><td style={{ ...S.td, fontWeight: 600, width: 150 }}>{k}</td><td style={S.td}>{v}</td></tr>)}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>Financial Projections ({analysisYears}-year)</div>
                  <div style={S.grid3}>
                    {[
                      { label: 'Gross Revenue', val: `$${fmt(totalRevM, 1)}M`, col: T.green },
                      { label: 'NPV of Revenue', val: `$${fmt(npvFactor, 1)}M`, col: T.indigo },
                      { label: 'Year-1 Revenue', val: `$${fmt(annualMWh * ppaPriceMWh / 1e6, 2)}M`, col: T.teal },
                    ].map(({ label, val, col }) => (
                      <div key={label} style={S.kpiCard}>
                        <div style={{ ...S.kpiVal, color: col }}>{val}</div>
                        <div style={S.kpiLbl}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={S.card}>
                  <div style={S.cardTitle}>IEC 61724 Compliance Checklist</div>
                  <table style={S.table}>
                    <tbody>
                      {[
                        ['PR Calculation Method', 'IEC 61724-1:2021 §7.3', true],
                        ['Temperature-corrected PR', 'IEC 61724-1 §7.4', true],
                        ['Data Quality Flag (DQF)', 'IEC 61724-1 Annex A', true],
                        ['P50/P90 Exceedance Probability', 'IEC 61724-3:2016', true],
                        ['Measurement Uncertainty (ISO GUM)', 'GUM:1995', true],
                        ['Satellite Data Validation', 'IEA PVPS Task 16', true],
                        ['Ground Station Calibration', 'ISO 9060 Class A', groundTruth],
                      ].map(([item, ref, ok]) => (
                        <tr key={item}>
                          <td style={S.td}><span style={{ color: ok ? T.green : T.amber, fontWeight: 600 }}>{ok ? '✓' : '○'}</span> {item}</td>
                          <td style={{ ...S.td, color: T.sub, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{ref}</td>
                          <td style={S.td}><span style={S.pill(ok ? T.green : T.amber)}>{ok ? 'Compliant' : 'Conditional'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
      <EnergyAdvancedAnalytics T={T} moduleCode="EP-RE2" title="Solar Resource & Performance — MC Yield, Tornado & NGFS Derate Suite"
        mcModel={{ title: 'MC Annual Yield (GWh) · 100 MWac Plant', unit: ' GWh', fmt: (n) => n.toFixed(1),
        vars: { ghi: { min: 1600, mode: 1950, max: 2300 }, pr: { min: 0.74, mode: 0.80, max: 0.85 }, soiling: { min: 0.005, mode: 0.015, max: 0.035 }, degrad: { min: 0.004, mode: 0.006, max: 0.010 } },
        compute: (v) => (v.ghi * 100 * v.pr * (1 - v.soiling) * (1 - v.degrad * 5)) / 1000 }}
      tornadoModel={{ title: 'Tornado — Yield Drivers', unit: ' GWh', fmt: (n) => `${n.toFixed(0)} GWh`,
        inputs: { ghi: 1950, pr: 0.80, soiling: 0.015, degrad: 0.006 },
        compute: (v) => (v.ghi * 100 * v.pr * (1 - v.soiling) * (1 - v.degrad * 5)) / 1000 }}
      scenarioImpact={(p) => 156 * (1 - 0.0002 * Math.max(0, p - 50))} scenarioFmt={(v) => `${v.toFixed(0)} GWh`}
      scenarioTitle="Carbon Price × NGFS Pathway — Yield under heat stress (GWh)"
      peers={{ cols: [{ k: 'site', label: 'Region/Site' }, { k: 'ghi', label: 'GHI (kWh/m²/yr)' }, { k: 'pr', label: 'PR (%)', fmt: (v) => `${(v*100).toFixed(1)}%` }, { k: 'soil', label: 'Soiling (%)', fmt: (v) => `${(v*100).toFixed(1)}%` }, { k: 'deg', label: 'Degrad (%/yr)', fmt: (v) => `${(v*100).toFixed(2)}%` }],
        rows: [{ site: 'Rajasthan IN', ghi: 2150, pr: 0.79, soil: 0.028, deg: 0.006 }, { site: 'Atacama CL', ghi: 2550, pr: 0.82, soil: 0.018, deg: 0.004 }, { site: 'NV / SW US', ghi: 2100, pr: 0.83, soil: 0.012, deg: 0.005 }, { site: 'Andalusia ES', ghi: 1850, pr: 0.81, soil: 0.010, deg: 0.005 }, { site: 'Queensland AU', ghi: 1980, pr: 0.80, soil: 0.015, deg: 0.006 }, { site: 'Riyadh SA', ghi: 2250, pr: 0.77, soil: 0.040, deg: 0.007 }] }}
        indiaContext={{
          subtitle: 'NISE · MNRE PSS · IMD solar radiation stations',
          regulations: [
            { tag: 'NISE / MNRE PQM spec', status: 'active' },
            { tag: 'IS/IEC 61724-1 PR std', status: 'active' },
            { tag: 'CEA DSM regulations', status: 'active' },
            { tag: 'BIS IS 14286 / 16221', status: 'active' },
            { tag: 'CPRI module testing', status: 'active' },
          ],
          kpis: [
            { label: 'Avg GHI (Rajasthan)', value: '2,150 kWh/m²' },
            { label: 'Avg India PR', value: '78–82%', detail: 'Lower in humid SE' },
            { label: 'Soiling loss (avg)', value: '2.8%/yr', detail: 'Up to 6% pre-monsoon' },
            { label: 'Degrad (India field)', value: '0.65%/yr', detail: 'vs 0.5%/yr nameplate' },
          ],
          peers: { title: 'INDIAN SITE BENCHMARKS',
            cols: [{ k: 'site', label: 'Site/State' }, { k: 'ghi', label: 'GHI (kWh/m²)' }, { k: 'pr', label: 'PR (%)' }, { k: 'soil', label: 'Soiling (%)' }, { k: 'deg', label: 'Degrad (%/yr)' }],
            rows: [
              { site: 'Bhadla (RJ)', ghi: 2200, pr: 79, soil: 4.2, deg: 0.7 },
              { site: 'Pavagada (KA)', ghi: 1980, pr: 80, soil: 2.5, deg: 0.6 },
              { site: 'Kurnool (AP)', ghi: 1950, pr: 81, soil: 2.1, deg: 0.55 },
              { site: 'Rewa (MP)', ghi: 1880, pr: 80, soil: 2.8, deg: 0.65 },
              { site: 'Charanka (GJ)', ghi: 2050, pr: 79, soil: 3.5, deg: 0.68 },
              { site: 'Kadapa (AP)', ghi: 1920, pr: 81, soil: 2.3, deg: 0.6 },
            ] },
          notes: 'Indian PV plants see 50–100 bps higher degradation than IEC nameplate due to heat, humidity and dust. Pre-monsoon soiling in Rajasthan/Gujarat can exceed 6% without robotic cleaning.',
        }}
      />
    </div>
  );
}
