import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ComposedChart,
  Cell, ScatterChart, Scatter, RadarChart, PolarGrid,
  PolarAngleAxis, Radar
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9',
  text: '#1A1A2E', sub: '#6B7280', accent: '#B8860B',
  indigo: '#4F46E5', green: '#065F46', red: '#991B1B',
  blue: '#1E40AF', amber: '#92400E', teal: '#0F766E', navy: '#0F172A'
};

// ── Core physics helpers ──────────────────────────────────────────────────────
function weibullPdf(v, k, lambda) {
  if (v <= 0 || lambda <= 0 || k <= 0) return 0;
  return (k / lambda) * Math.pow(v / lambda, k - 1) * Math.exp(-Math.pow(v / lambda, k));
}
function weibullCdf(v, k, lambda) {
  if (v <= 0) return 0;
  return 1 - Math.exp(-Math.pow(v / lambda, k));
}
function jensenWake(U0, Ct, k, x, D) {
  if (x <= 0 || D <= 0) return U0;
  const deficit = (1 - Math.sqrt(1 - Ct)) * Math.pow(D / (D + 2 * k * x), 2);
  return U0 * (1 - deficit);
}
function p90Val(p50, sigma) {
  return p50 * Math.exp(-1.282 * sigma);
}
function p75Val(p50, sigma) {
  return p50 * Math.exp(-0.674 * sigma);
}
function p99Val(p50, sigma) {
  return p50 * Math.exp(-2.326 * sigma);
}

// ── Turbine catalogue ─────────────────────────────────────────────────────────
const TURBINES = [
  { label: '8 MW / 174m', mw: 8,  D: 174, hh: 100, cutIn: 3, rated: 12, cutOut: 25 },
  { label: '10 MW / 190m', mw: 10, D: 190, hh: 119, cutIn: 3, rated: 12, cutOut: 25 },
  { label: '12 MW / 220m', mw: 12, D: 220, hh: 130, cutIn: 3, rated: 11.5, cutOut: 25 },
  { label: '15 MW / 236m', mw: 15, D: 236, hh: 150, cutIn: 3, rated: 11,   cutOut: 25 },
  { label: '18 MW / 260m', mw: 18, D: 260, hh: 170, cutIn: 3, rated: 10.5, cutOut: 25 },
];

const SITES = [
  { label: 'North Sea',      lat: 56.0, lon: 4.0,   vRef: 9.5, k: 2.1, depth: 35, shore: 80  },
  { label: 'US East Coast',  lat: 39.5, lon: -73.5, vRef: 8.8, k: 2.0, depth: 28, shore: 35  },
  { label: 'Taiwan Strait',  lat: 24.0, lon: 119.5, vRef: 9.2, k: 2.3, depth: 25, shore: 15  },
  { label: 'Baltic Sea',     lat: 55.5, lon: 14.0,  vRef: 8.5, k: 2.2, depth: 22, shore: 20  },
  { label: 'South Australia',lat: -34.5,lon: 137.5, vRef: 8.0, k: 1.9, depth: 30, shore: 60  },
  { label: 'Brazil NE',      lat: -4.5, lon: -37.5, vRef: 8.3, k: 2.4, depth: 20, shore: 12  },
];

const MARKETS = [
  { country: 'UK',          cf: 42, lcoe: 62, pipeline: 80,  policy: 'Auction CfD — Active' },
  { country: 'Germany',     cf: 38, lcoe: 70, pipeline: 30,  policy: 'Tender 2.0 — Active'  },
  { country: 'Netherlands', cf: 40, lcoe: 66, pipeline: 25,  policy: 'SDE++ — Active'        },
  { country: 'Denmark',     cf: 44, lcoe: 58, pipeline: 12,  policy: 'Tender — Active'       },
  { country: 'US East',     cf: 41, lcoe: 75, pipeline: 52,  policy: 'IRA §45 — Active'      },
  { country: 'Taiwan',      cf: 43, lcoe: 72, pipeline: 18,  policy: 'FIT Phase 3 — Active'  },
  { country: 'South Korea', cf: 35, lcoe: 82, pipeline: 14,  policy: 'RPS — Developing'      },
  { country: 'Australia',   cf: 37, lcoe: 80, pipeline: 10,  policy: 'CfD Pilot — Early'     },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Slider & Toggle primitives ────────────────────────────────────────────────
function Slider({ label, value, min, max, step = 1, onChange, unit = '' }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color: T.accent, fontFamily: 'monospace' }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: T.accent, cursor: 'pointer' }} />
    </div>
  );
}
function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 11, color: '#94A3B8' }}>{label}</span>
      <button onClick={() => onChange(!value)}
        style={{ padding: '2px 10px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700,
          background: value ? T.accent : '#334155', color: '#FFF' }}>
        {value ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
function SideSection({ title, children, open, onToggle }) {
  return (
    <div style={{ borderBottom: '1px solid #1E293B', paddingBottom: 8, marginBottom: 8 }}>
      <div onClick={onToggle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        cursor: 'pointer', padding: '6px 0', color: '#CBD5E1', fontSize: 12, fontWeight: 700 }}>
        <span>{title}</span>
        <span style={{ color: T.accent }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && <div style={{ paddingTop: 4 }}>{children}</div>}
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, unit, color = T.indigo, sub }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
      padding: '14px 16px', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'monospace' }}>
        {value}<span style={{ fontSize: 13, fontWeight: 500, color: T.sub, marginLeft: 3 }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Tab pill ──────────────────────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
      {tabs.map((t, i) => (
        <button key={i} onClick={() => onChange(i)}
          style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${active === i ? T.indigo : T.border}`,
            background: active === i ? T.indigo : T.card, color: active === i ? '#FFF' : T.sub,
            fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
          {t}
        </button>
      ))}
    </div>
  );
}

const TABS = [
  'Overview','Wind Resource Atlas','Weibull Analysis','Power Curve','Capacity Factor',
  'Wake Loss Model','AEP Calculator','P50/P90','Seasonal Analysis','Extreme Events',
  'IEC Turbine Class','Environmental','Grid Connection','Technology Comparison',
  'Long-Run Trend','Satellite vs Mast','Country Comparison','Summary Report'
];

// ═════════════════════════════════════════════════════════════════════════════
export default function OffshoreWindResourcePage() {
  // Sidebar open/close
  const [sec, setSec] = useState([true, true, true, true, true, false]);
  const toggleSec = i => setSec(p => p.map((v, j) => j === i ? !v : v));

  // Sidebar controls
  const [siteIdx,    setSiteIdx]    = useState(0);
  const [depth,      setDepth]      = useState(35);
  const [shore,      setShore]      = useState(80);
  const [hubHeight,  setHubHeight]  = useState(120);
  const [windClass,  setWindClass]  = useState('IEC I');
  const [vRef,       setVRef]       = useState(9.5);
  const [turbI,      setTurbI]      = useState(8);
  const [turbIdx,    setTurbIdx]    = useState(2);
  const [arrRows,    setArrRows]    = useState(5);
  const [arrCols,    setArrCols]    = useState(6);
  const [wakeModel,  setWakeModel]  = useState('Jensen');
  const [kDecay,     setKDecay]     = useState(0.04);
  const [elecLoss,   setElecLoss]   = useState(2.5);
  const [avail,      setAvail]      = useState(95);
  const [capex,      setCapex]      = useState(3200);
  const [opex,       setOpex]       = useState(85);
  const [discount,   setDiscount]   = useState(7);
  const [ppa,        setPpa]        = useState(72);
  const [projLife,   setProjLife]   = useState(25);
  const [p90Sigma,   setP90Sigma]   = useState(8);
  const [mastCorr,   setMastCorr]   = useState(true);

  const [tab, setTab] = useState(0);

  const site = SITES[siteIdx];
  const turbine = TURBINES[turbIdx];

  // ── Derived Weibull params (hub-height adjustment via shear exponent 0.11) ──
  const shearExp = 0.11;
  const vHub = useMemo(() => vRef * Math.pow(hubHeight / 80, shearExp), [vRef, hubHeight]);
  const wk = windClass === 'IEC I' ? 2.1 : windClass === 'IEC II' ? 2.0 : 1.9;
  const lambda = useMemo(() => vHub / (Math.pow(1 + 1 / wk, 1 / wk) * 0.9), [vHub, wk]);

  // ── Power curve (0.5 m/s resolution) ──────────────────────────────────────
  const powerCurve = useMemo(() => {
    const pts = [];
    for (let v = 0; v <= 25; v += 0.5) {
      let p = 0;
      if (v >= turbine.cutIn && v < turbine.rated) {
        const frac = Math.pow((v - turbine.cutIn) / (turbine.rated - turbine.cutIn), 3);
        p = turbine.mw * Math.min(1, frac);
      } else if (v >= turbine.rated && v <= turbine.cutOut) {
        p = turbine.mw;
      }
      pts.push({ v: v.toFixed(1), p: +p.toFixed(3) });
    }
    return pts;
  }, [turbine]);

  // ── AEP integration ───────────────────────────────────────────────────────
  const { grossAEP, wakeAEP, netAEP, wakeLoss, cf } = useMemo(() => {
    const n = arrRows * arrCols;
    const spacingD = 7; // typical 7D spacing
    let totalE = 0;
    for (let v = 0.5; v <= 25; v += 0.5) {
      const prob = weibullPdf(v, wk, lambda) * 0.5;
      const curve = powerCurve.find(pt => Math.abs(parseFloat(pt.v) - v) < 0.01);
      if (curve) totalE += curve.p * prob * 8760;
    }
    const gross = totalE * n;

    // Jensen wake deficit averaged across rows
    let wakeDeficit = 0;
    const Ct = 0.8;
    for (let row = 1; row < arrRows; row++) {
      const x = row * spacingD * turbine.D;
      const U_wake = jensenWake(vHub, Ct, kDecay, x, turbine.D);
      const deficit = 1 - (U_wake / vHub);
      wakeDeficit += deficit;
    }
    const avgWakeDeficit = arrRows > 1 ? wakeDeficit / (arrRows - 1) : 0;
    const effectiveWakeLoss = wakeModel === 'No Wake' ? 0
      : wakeModel === 'Gaussian' ? avgWakeDeficit * 0.85 : avgWakeDeficit;

    const wake = gross * (1 - effectiveWakeLoss);
    const net = wake * (1 - elecLoss / 100) * (avail / 100);
    const capacityFactor = (net / (turbine.mw * n * 8760)) * 100;

    return {
      grossAEP: +gross.toFixed(1),
      wakeAEP: +wake.toFixed(1),
      netAEP: +net.toFixed(1),
      wakeLoss: +(effectiveWakeLoss * 100).toFixed(1),
      cf: +capacityFactor.toFixed(1)
    };
  }, [turbine, arrRows, arrCols, wk, lambda, vHub, kDecay, elecLoss, avail, wakeModel, powerCurve]);

  // ── LCOE ──────────────────────────────────────────────────────────────────
  const lcoe = useMemo(() => {
    const capacityMW = turbine.mw * arrRows * arrCols;
    const totalCapex = capex * capacityMW * 1000; // $
    const annualOpex = opex * capacityMW * 1000;  // $/yr
    const r = discount / 100;
    const crf = r * Math.pow(1 + r, projLife) / (Math.pow(1 + r, projLife) - 1);
    const annualCapex = totalCapex * crf;
    return netAEP > 0 ? +((annualCapex + annualOpex) / (netAEP * 1000)).toFixed(2) : 0;
  }, [turbine, arrRows, arrCols, capex, opex, discount, projLife, netAEP]);

  const p90Aep = +p90Val(netAEP, p90Sigma / 100).toFixed(1);
  const p75Aep = +p75Val(netAEP, p90Sigma / 100).toFixed(1);

  // ── Sidebar ───────────────────────────────────────────────────────────────
  const Sidebar = (
    <div style={{ width: 280, minWidth: 280, background: T.navy, padding: '16px 14px',
      overflowY: 'auto', height: '100vh', position: 'sticky', top: 0 }}>
      <div style={{ color: T.accent, fontWeight: 800, fontSize: 14, marginBottom: 4, fontFamily: 'monospace' }}>
        EP-DR1
      </div>
      <div style={{ color: '#CBD5E1', fontSize: 11, marginBottom: 16 }}>
        Offshore Wind Resource & Wake Loss
      </div>

      <SideSection title="1. Site Configuration" open={sec[0]} onToggle={() => toggleSec(0)}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Preset Site</div>
          <select value={siteIdx} onChange={e => { setSiteIdx(+e.target.value); setVRef(SITES[+e.target.value].vRef); setDepth(SITES[+e.target.value].depth); setShore(SITES[+e.target.value].shore); }}
            style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0', borderRadius: 6, padding: '4px 6px', fontSize: 11 }}>
            {SITES.map((s, i) => <option key={i} value={i}>{s.label}</option>)}
          </select>
          <div style={{ fontSize: 10, color: '#64748B', marginTop: 3 }}>
            {site.lat.toFixed(1)}°, {site.lon.toFixed(1)}°
          </div>
        </div>
        <Slider label="Water Depth" value={depth} min={10} max={80} onChange={setDepth} unit=" m" />
        <Slider label="Distance to Shore" value={shore} min={5} max={200} onChange={setShore} unit=" km" />
      </SideSection>

      <SideSection title="2. Wind Resource" open={sec[1]} onToggle={() => toggleSec(1)}>
        <Slider label="Hub Height" value={hubHeight} min={80} max={160} onChange={setHubHeight} unit=" m" />
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Wind Class</div>
          <select value={windClass} onChange={e => setWindClass(e.target.value)}
            style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0', borderRadius: 6, padding: '4px 6px', fontSize: 11 }}>
            {['IEC I','IEC II','IEC III'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <Slider label="Reference Wind Speed" value={vRef} min={5} max={12} step={0.1} onChange={setVRef} unit=" m/s" />
        <Slider label="Turbulence Intensity" value={turbI} min={5} max={20} onChange={setTurbI} unit=" %" />
      </SideSection>

      <SideSection title="3. Turbine Selection" open={sec[2]} onToggle={() => toggleSec(2)}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Turbine Model</div>
          <select value={turbIdx} onChange={e => setTurbIdx(+e.target.value)}
            style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0', borderRadius: 6, padding: '4px 6px', fontSize: 11 }}>
            {TURBINES.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
          </select>
        </div>
        <Slider label="Array Rows" value={arrRows} min={2} max={12} onChange={setArrRows} />
        <Slider label="Array Columns" value={arrCols} min={2} max={15} onChange={setArrCols} />
        <div style={{ fontSize: 10, color: '#64748B' }}>
          Total: {arrRows * arrCols} turbines · {(turbine.mw * arrRows * arrCols).toFixed(0)} MW
        </div>
      </SideSection>

      <SideSection title="4. Wake & Losses" open={sec[3]} onToggle={() => toggleSec(3)}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>Wake Model</div>
          <select value={wakeModel} onChange={e => setWakeModel(e.target.value)}
            style={{ width: '100%', background: '#1E293B', border: '1px solid #334155', color: '#E2E8F0', borderRadius: 6, padding: '4px 6px', fontSize: 11 }}>
            {['Jensen','Gaussian','No Wake'].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <Slider label="Wake Decay Constant k" value={kDecay} min={0.03} max={0.07} step={0.005} onChange={setKDecay} />
        <Slider label="Electrical Loss" value={elecLoss} min={0.5} max={6} step={0.1} onChange={setElecLoss} unit=" %" />
        <Slider label="Availability" value={avail} min={80} max={99} onChange={setAvail} unit=" %" />
      </SideSection>

      <SideSection title="5. Financial" open={sec[4]} onToggle={() => toggleSec(4)}>
        <Slider label="CapEx" value={capex} min={1800} max={4500} step={50} onChange={setCapex} unit=" $/kW" />
        <Slider label="OpEx" value={opex} min={50} max={120} step={5} onChange={setOpex} unit=" $/kW/yr" />
        <Slider label="Discount Rate" value={discount} min={3} max={15} onChange={setDiscount} unit=" %" />
        <Slider label="PPA Price" value={ppa} min={30} max={160} step={2} onChange={setPpa} unit=" $/MWh" />
        <Slider label="Project Life" value={projLife} min={20} max={35} onChange={setProjLife} unit=" yr" />
      </SideSection>

      <SideSection title="6. Uncertainty" open={sec[5]} onToggle={() => toggleSec(5)}>
        <Slider label="P90 Sigma" value={p90Sigma} min={3} max={20} onChange={setP90Sigma} unit=" %" />
        <Toggle label="Mast Correlation" value={mastCorr} onChange={setMastCorr} />
      </SideSection>
    </div>
  );

  // ── Quick stats bar ───────────────────────────────────────────────────────
  const QuickStats = (
    <div style={{ background: T.navy, padding: '8px 20px', display: 'flex', gap: 32, flexWrap: 'wrap',
      borderBottom: `2px solid ${T.accent}` }}>
      {[
        { l: 'Annual AEP', v: netAEP.toFixed(0), u: 'GWh' },
        { l: 'Capacity Factor', v: cf.toFixed(1), u: '%' },
        { l: 'Wake Loss', v: wakeLoss.toFixed(1), u: '%' },
        { l: 'LCOE', v: lcoe.toFixed(1), u: '$/MWh' },
        { l: 'P90 AEP', v: p90Aep, u: 'GWh' },
        { l: 'Installed MW', v: (turbine.mw * arrRows * arrCols).toFixed(0), u: 'MW' },
      ].map(({ l, v, u }, i) => (
        <div key={i} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#94A3B8' }}>{l}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.accent, fontFamily: 'monospace' }}>
            {v} <span style={{ fontSize: 10, color: '#CBD5E1' }}>{u}</span>
          </div>
        </div>
      ))}
    </div>
  );

  // ── Monthly data ──────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => MONTHS.map((m, i) => {
    const seasonalMult = i < 2 || i > 9 ? 1.15 + sr(i * 17) * 0.1 : 0.8 + sr(i * 23) * 0.15;
    const aep = (netAEP / 12) * seasonalMult;
    const cfM = (cf * seasonalMult).toFixed(1);
    return { month: m, aep: +aep.toFixed(1), cf: +cfM, wind: +(vHub * seasonalMult).toFixed(2) };
  }), [netAEP, cf, vHub]);

  // ── Wind speed histogram ───────────────────────────────────────────────────
  const windHist = useMemo(() => {
    const bins = [];
    for (let v = 0; v <= 24; v += 1) {
      const prob = weibullCdf(v + 1, wk, lambda) - weibullCdf(v, wk, lambda);
      bins.push({ bin: `${v}-${v + 1}`, freq: +(prob * 100).toFixed(2), v: v + 0.5 });
    }
    return bins;
  }, [wk, lambda]);

  // ── Power curve chart data ─────────────────────────────────────────────────
  const powerCurveData = useMemo(() => {
    const pts = [];
    for (let v = 0; v <= 25; v += 0.5) {
      const row = { v: +v.toFixed(1) };
      TURBINES.forEach((t, ti) => {
        let p = 0;
        if (v >= t.cutIn && v < t.rated) {
          p = t.mw * Math.min(1, Math.pow((v - t.cutIn) / (t.rated - t.cutIn), 3));
        } else if (v >= t.rated && v <= t.cutOut) {
          p = t.mw;
        }
        row[`T${ti}`] = +p.toFixed(3);
      });
      pts.push(row);
    }
    return pts;
  }, []);

  // ── Wake deficit by row ────────────────────────────────────────────────────
  const wakeRowData = useMemo(() => {
    const Ct = 0.8;
    return Array.from({ length: arrRows }, (_, row) => {
      const x = row === 0 ? 0 : row * 7 * turbine.D;
      const U = row === 0 ? vHub : jensenWake(vHub, Ct, kDecay, x, turbine.D);
      const deficit = (1 - U / vHub) * 100;
      return { row: `Row ${row + 1}`, speed: +U.toFixed(2), deficit: +deficit.toFixed(1) };
    });
  }, [arrRows, turbine, vHub, kDecay]);

  // ── P50/P90 distribution ──────────────────────────────────────────────────
  const uncertaintyDist = useMemo(() => {
    const sigma = p90Sigma / 100;
    const pts = [];
    for (let i = -3.5; i <= 3.5; i += 0.1) {
      const x = netAEP * Math.exp(sigma * i);
      const pdf = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * i * i);
      pts.push({ aep: +x.toFixed(0), pdf: +pdf.toFixed(4) });
    }
    return pts;
  }, [netAEP, p90Sigma]);

  // ── Long-run trend ────────────────────────────────────────────────────────
  const trendData = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    year: 2015 + i,
    speed: +(vHub * (1 + (sr(i * 13) - 0.5) * 0.006)).toFixed(2),
    rcp26: +(vHub * (1 + i * 0.001)).toFixed(2),
    rcp45: +(vHub * (1 - i * 0.0005)).toFixed(2),
    rcp85: +(vHub * (1 - i * 0.002)).toFixed(2),
  })), [vHub]);

  // ── ERA5 vs mast ──────────────────────────────────────────────────────────
  const eraVsMast = useMemo(() => MONTHS.map((m, i) => ({
    month: m,
    era5: +(vHub * (1 + (sr(i * 7) - 0.5) * 0.12)).toFixed(2),
    mast: +(vHub * (1 + (sr(i * 11) - 0.5) * 0.06)).toFixed(2),
  })), [vHub]);

  // ── Weibull PDF curve ──────────────────────────────────────────────────────
  const weibullData = useMemo(() => {
    const pts = [];
    for (let v = 0; v <= 25; v += 0.25) {
      pts.push({
        v: +v.toFixed(2),
        pdf: +(weibullPdf(v, wk, lambda) * 100).toFixed(3),
        cdf: +(weibullCdf(v, wk, lambda) * 100).toFixed(2),
      });
    }
    return pts;
  }, [wk, lambda]);

  // ── AEP by wind speed bin ──────────────────────────────────────────────────
  const aepByBin = useMemo(() => {
    const n = arrRows * arrCols;
    return windHist.map(({ bin, v }) => {
      const prob = weibullPdf(v, wk, lambda);
      const curve = powerCurve.find(pt => Math.abs(parseFloat(pt.v) - v) < 0.01) || { p: 0 };
      return { bin, contrib: +(curve.p * prob * 8760 * n / 1000).toFixed(2) };
    });
  }, [windHist, powerCurve, wk, lambda, arrRows, arrCols]);

  // ── Year-by-year AEP with degradation ─────────────────────────────────────
  const yearlyAEP = useMemo(() => Array.from({ length: projLife }, (_, i) => ({
    year: i + 1,
    aep: +(netAEP * Math.pow(0.995, i)).toFixed(1),
  })), [netAEP, projLife]);

  // ── IEC class matrix ───────────────────────────────────────────────────────
  const iecMatrix = useMemo(() => {
    const speeds = [6, 7, 8, 9, 10, 11, 12];
    return speeds.map(v => ({
      speed: `${v} m/s`,
      TI_A: +(0.16 * (1 + 0.1 * v)).toFixed(3),
      TI_B: +(0.14 * (1 + 0.1 * v)).toFixed(3),
      TI_C: +(0.12 * (1 + 0.1 * v)).toFixed(3),
      suitability: v <= vRef + 1 ? 'Suitable' : 'Exceeds Class',
    }));
  }, [vRef]);

  // ── Colors for charts ──────────────────────────────────────────────────────
  const COLORS = [T.indigo, T.accent, T.teal, T.green, T.red];

  // ─────────────────────────────────────────────────────────────────────────
  // TAB RENDERERS
  // ─────────────────────────────────────────────────────────────────────────

  // Tab 0 — Overview
  const renderOverview = () => (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <KpiCard label="Net AEP" value={netAEP.toFixed(0)} unit="GWh" color={T.indigo} sub={`Gross: ${grossAEP.toFixed(0)} GWh`} />
        <KpiCard label="Capacity Factor" value={cf.toFixed(1)} unit="%" color={T.teal} sub="Net, availability-adjusted" />
        <KpiCard label="Wake Loss" value={wakeLoss.toFixed(1)} unit="%" color={T.accent} sub={wakeModel} />
        <KpiCard label="LCOE" value={lcoe.toFixed(1)} unit="$/MWh" color={T.green} sub={`PPA: $${ppa}/MWh`} />
        <KpiCard label="P90 AEP" value={p90Aep} unit="GWh" color={T.blue} sub={`P75: ${p75Aep} GWh`} />
        <KpiCard label="Installed MW" value={(turbine.mw * arrRows * arrCols).toFixed(0)} unit="MW" color={T.red} sub={`${arrRows * arrCols} turbines`} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 12 }}>Monthly Wind Speed</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit=" m/s" />
              <Tooltip />
              <Bar dataKey="wind" fill={T.indigo} name="Wind Speed (m/s)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, color: T.text, marginBottom: 4 }}>Site Parameters</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <tbody>
              {[
                ['Site', site.label], ['Lat/Lon', `${site.lat}°, ${site.lon}°`],
                ['Water Depth', `${depth} m`], ['Shore Distance', `${shore} km`],
                ['Hub Height', `${hubHeight} m`], ['Hub Wind Speed', `${vHub.toFixed(2)} m/s`],
                ['Weibull k', wk.toFixed(2)], ['Weibull λ', lambda.toFixed(2)],
                ['Turbine', turbine.label], ['Array', `${arrRows}×${arrCols}`],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '5px 4px', color: T.sub }}>{k}</td>
                  <td style={{ padding: '5px 4px', fontWeight: 600, color: T.text, fontFamily: 'monospace' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Tab 1 — Wind Resource Atlas
  const renderWindAtlas = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Weibull PDF</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={weibullData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="v" tick={{ fontSize: 10 }} label={{ value: 'Wind Speed (m/s)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={v => v.toFixed(3)} />
            <Area dataKey="pdf" stroke={T.indigo} fill={T.indigo} fillOpacity={0.2} name="PDF (%/m/s)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Cumulative CDF</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={weibullData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="v" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" />
            <Tooltip />
            <Line dataKey="cdf" stroke={T.teal} dot={false} name="CDF (%)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, gridColumn: '1/-1' }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Wind Speed Frequency Histogram (0–25 m/s bins)</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={windHist}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="bin" tick={{ fontSize: 9 }} interval={2} />
            <YAxis tick={{ fontSize: 10 }} unit="%" />
            <Tooltip />
            <Bar dataKey="freq" fill={T.accent} name="Frequency (%)" radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // Tab 2 — Weibull Analysis
  const renderWeibull = () => {
    const meanWind = lambda * Math.pow(1 + 1 / wk, 1 / wk);
    const powerDensity = 0.5 * 1.225 * Math.pow(meanWind, 3);
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Weibull k" value={wk.toFixed(2)} unit="" color={T.indigo} sub="Shape parameter" />
          <KpiCard label="Weibull λ" value={lambda.toFixed(2)} unit="m/s" color={T.teal} sub="Scale parameter" />
          <KpiCard label="Mean Wind Speed" value={meanWind.toFixed(2)} unit="m/s" color={T.accent} sub="Hub height adjusted" />
          <KpiCard label="Power Density" value={powerDensity.toFixed(0)} unit="W/m²" color={T.green} sub="Air density 1.225 kg/m³" />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Weibull PDF vs Histogram Overlay</div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={windHist}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="bin" tick={{ fontSize: 9 }} interval={2} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip />
              <Bar dataKey="freq" fill={T.indigo} fillOpacity={0.4} name="Histogram (%)" />
              <Line data={weibullData} dataKey="pdf" stroke={T.accent} dot={false} name="Weibull PDF" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>IEC Wind Power Density Class Boundaries</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.navy, color: '#FFF' }}>
                {['Class','V_ave (m/s)','Power Density (W/m²)','V_50yr (m/s)','Applicability'].map(h =>
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ['IEC I',   '10.0', '800+', '50', vRef >= 10 ? '✓ Site Match' : '—'],
                ['IEC II',  '8.5',  '600+', '42.5', vRef >= 8.5 && vRef < 10 ? '✓ Site Match' : '—'],
                ['IEC III', '7.5',  '400+', '37.5', vRef < 8.5 ? '✓ Site Match' : '—'],
              ].map(row => (
                <tr key={row[0]} style={{ borderBottom: `1px solid ${T.border}`, background: row[4].includes('✓') ? '#F0FDF4' : 'transparent' }}>
                  {row.map((c, ci) => <td key={ci} style={{ padding: '5px 8px', color: ci === 4 ? T.green : T.text }}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Tab 3 — Power Curve
  const renderPowerCurve = () => (
    <div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Turbine Power Curves — All 5 Models</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={powerCurveData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="v" tick={{ fontSize: 10 }} label={{ value: 'Wind Speed (m/s)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} label={{ value: 'Power (MW)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
            <Tooltip />
            <Legend />
            {TURBINES.map((t, i) => (
              <Line key={i} dataKey={`T${i}`} name={t.label} stroke={COLORS[i]} dot={false} strokeWidth={2} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>AEP Contribution by Wind Speed Bin</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={aepByBin}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="bin" tick={{ fontSize: 9 }} interval={3} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="contrib" fill={T.teal} name="AEP Contribution (GWh)" radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // Tab 4 — Capacity Factor
  const renderCF = () => {
    const cfByHub = [80,100,120,140,160].map((h, i) => {
      const v = vRef * Math.pow(h / 80, shearExp);
      const lam = v / (Math.pow(1 + 1 / wk, 1 / wk) * 0.9);
      let e = 0;
      for (let vel = 0.5; vel <= 25; vel += 0.5) {
        const prob = weibullPdf(vel, wk, lam) * 0.5;
        const crv = powerCurve.find(pt => Math.abs(parseFloat(pt.v) - vel) < 0.01) || { p: 0 };
        e += crv.p * prob * 8760;
      }
      const cfH = (e / (turbine.mw * 8760)) * 100;
      return { hub: `${h} m`, cf: +cfH.toFixed(1), seed: i };
    });
    const cfByDepth = [10,20,30,40,50,60,70,80].map((d, i) => ({
      depth: `${d} m`, cf: +(cf * (1 - (d - 35) * 0.0008 + sr(i * 19) * 0.01)).toFixed(1)
    }));
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Monthly Capacity Factor</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 70]} />
              <Tooltip />
              <ReferenceLine y={cf} stroke={T.accent} strokeDasharray="4 4" label={{ value: 'Annual Avg', fontSize: 9 }} />
              <Bar dataKey="cf" fill={T.indigo} name="CF (%)" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>CF vs Hub Height</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={cfByHub}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="hub" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip />
              <Line dataKey="cf" stroke={T.teal} dot strokeWidth={2} name="CF (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>CF vs Water Depth</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={cfByDepth}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="depth" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip />
              <Line dataKey="cf" stroke={T.accent} dot strokeWidth={2} name="CF (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>CF by Turbine Model</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.navy, color: '#FFF' }}>
                {['Model','Rating','D (m)','Est. CF (%)','LCOE est.'].map(h =>
                  <th key={h} style={{ padding: '5px 6px', textAlign: 'left' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {TURBINES.map((t, i) => {
                const cfEst = +(cf * (1 + (t.D / turbine.D - 1) * 0.4) + sr(i * 31) * 1).toFixed(1);
                const lcoeEst = +(lcoe * (1 - (t.mw - turbine.mw) * 0.005)).toFixed(1);
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i === turbIdx ? '#EEF2FF' : 'transparent' }}>
                    <td style={{ padding: '5px 6px', fontWeight: i === turbIdx ? 700 : 400 }}>{t.label}</td>
                    <td style={{ padding: '5px 6px' }}>{t.mw} MW</td>
                    <td style={{ padding: '5px 6px' }}>{t.D}</td>
                    <td style={{ padding: '5px 6px', color: T.teal, fontFamily: 'monospace' }}>{cfEst}%</td>
                    <td style={{ padding: '5px 6px', color: T.green, fontFamily: 'monospace' }}>${lcoeEst}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Tab 5 — Wake Loss Model
  const renderWake = () => {
    const heatmap = [];
    const Ct = 0.8;
    for (let r = 0; r < arrRows; r++) {
      for (let c = 0; c < arrCols; c++) {
        const xDist = r * 7 * turbine.D;
        const yDist = Math.abs(c - arrCols / 2) * 5 * turbine.D;
        const U = xDist === 0 ? vHub : jensenWake(vHub, Ct, kDecay, xDist, turbine.D);
        const lateralFactor = Math.exp(-0.5 * Math.pow(yDist / (turbine.D * 3), 2));
        const Ueff = vHub - (vHub - U) * lateralFactor;
        heatmap.push({ row: r + 1, col: c + 1, speed: +Ueff.toFixed(2), deficit: +((1 - Ueff / vHub) * 100).toFixed(1) });
      }
    }
    return (
      <div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Wake Deficit by Row (Jensen Model, {wakeModel})</div>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={wakeRowData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="row" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="speed" tick={{ fontSize: 10 }} unit=" m/s" domain={[0, 'auto']} />
              <YAxis yAxisId="def" orientation="right" tick={{ fontSize: 10 }} unit="%" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="speed" dataKey="speed" fill={T.indigo} name="Hub Speed (m/s)" opacity={0.7} />
              <Line yAxisId="def" dataKey="deficit" stroke={T.red} dot strokeWidth={2} name="Deficit (%)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Array Heatmap — Wind Speed at Each Turbine (m/s)</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 11, minWidth: 400 }}>
              <thead>
                <tr>
                  <th style={{ padding: '4px 8px', color: T.sub }}>Row\Col</th>
                  {Array.from({ length: arrCols }, (_, c) => (
                    <th key={c} style={{ padding: '4px 8px', color: T.sub }}>C{c + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: arrRows }, (_, r) => (
                  <tr key={r}>
                    <td style={{ padding: '4px 8px', fontWeight: 700, color: T.text }}>R{r + 1}</td>
                    {Array.from({ length: arrCols }, (_, c) => {
                      const cell = heatmap.find(h => h.row === r + 1 && h.col === c + 1);
                      const pct = cell ? cell.speed / vHub : 1;
                      const bg = `hsl(${220 + (1 - pct) * 60}, 70%, ${50 + pct * 20}%)`;
                      return (
                        <td key={c} style={{ padding: '4px 8px', textAlign: 'center', background: bg, color: '#FFF', fontFamily: 'monospace', fontSize: 10 }}>
                          {cell ? cell.speed : vHub.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: T.sub }}>
            Total array wake loss: <strong style={{ color: T.accent }}>{wakeLoss.toFixed(1)}%</strong> &nbsp;|&nbsp;
            Model: <strong>{wakeModel}</strong> &nbsp;|&nbsp; k = {kDecay}
          </div>
        </div>
      </div>
    );
  };

  // Tab 6 — AEP Calculator
  const renderAEP = () => {
    const electricalLossGWh = wakeAEP * (elecLoss / 100);
    const availLossGWh = (wakeAEP - electricalLossGWh) * (1 - avail / 100);
    const lifetimeAEP = yearlyAEP.reduce((s, y) => s + y.aep, 0);
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Gross AEP" value={grossAEP.toFixed(0)} unit="GWh" color={T.indigo} sub="No losses" />
          <KpiCard label="Wake-Corrected" value={wakeAEP.toFixed(0)} unit="GWh" color={T.teal} sub={`-${wakeLoss}% wake`} />
          <KpiCard label="Electrical Loss" value={electricalLossGWh.toFixed(1)} unit="GWh" color={T.amber} sub={`${elecLoss}% cable+xfmr`} />
          <KpiCard label="Net AEP (P50)" value={netAEP.toFixed(0)} unit="GWh" color={T.green} sub={`${avail}% availability`} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Year-by-Year AEP with 0.5%/yr Degradation</div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={yearlyAEP}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} label={{ value: 'Year', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit=" GWh" />
                <Tooltip />
                <Area dataKey="aep" stroke={T.indigo} fill={T.indigo} fillOpacity={0.15} name="Annual AEP (GWh)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>AEP Waterfall Summary</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <tbody>
                {[
                  ['Gross AEP (no losses)', grossAEP.toFixed(0), T.indigo],
                  ['Wake Loss', `-${(grossAEP - wakeAEP).toFixed(0)}`, T.red],
                  ['Wake-Corrected AEP', wakeAEP.toFixed(0), T.teal],
                  ['Electrical Loss', `-${electricalLossGWh.toFixed(0)}`, T.amber],
                  ['Availability Loss', `-${availLossGWh.toFixed(0)}`, T.amber],
                  ['Net AEP (P50)', netAEP.toFixed(0), T.green],
                  [`Lifetime AEP (${projLife} yr)`, lifetimeAEP.toFixed(0), T.navy],
                ].map(([l, v, c]) => (
                  <tr key={l} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 4px', color: T.sub }}>{l}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 700, color: c, fontFamily: 'monospace' }}>{v} GWh</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Tab 7 — P50/P90
  const renderUncertainty = () => {
    const sigma = p90Sigma / 100;
    const sources = [
      { source: 'Interannual Variability', sigma: 4, share: 35 },
      { source: 'Mast Correlation', sigma: mastCorr ? 3 : 6, share: 25 },
      { source: 'Wake Model Uncertainty', sigma: 3, share: 20 },
      { source: 'Long-Term Correction', sigma: 3, share: 12 },
      { source: 'Degradation', sigma: 2, share: 8 },
    ];
    const rss = Math.sqrt(sources.reduce((s, x) => s + Math.pow(x.sigma, 2), 0));
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="P50 AEP" value={netAEP.toFixed(0)} unit="GWh" color={T.indigo} />
          <KpiCard label="P75 AEP" value={p75Aep} unit="GWh" color={T.teal} sub="-0.674σ" />
          <KpiCard label="P90 AEP" value={p90Aep} unit="GWh" color={T.accent} sub="-1.282σ" />
          <KpiCard label="P99 AEP" value={p99Val(netAEP, sigma).toFixed(0)} unit="GWh" color={T.red} sub="-2.326σ" />
          <KpiCard label="RSS Sigma" value={rss.toFixed(1)} unit="%" color={T.green} sub="Combined uncertainty" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>AEP Lognormal Distribution</div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={uncertaintyDist}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="aep" tick={{ fontSize: 10 }} tickFormatter={v => Math.round(v)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, n, p) => [v.toFixed(4), 'PDF']} labelFormatter={v => `${Math.round(v)} GWh`} />
                <Area dataKey="pdf" stroke={T.indigo} fill={T.indigo} fillOpacity={0.2} name="PDF" />
                <ReferenceLine x={netAEP} stroke={T.teal} strokeDasharray="4 4" label={{ value: 'P50', fontSize: 9 }} />
                <ReferenceLine x={p90Aep} stroke={T.red} strokeDasharray="4 4" label={{ value: 'P90', fontSize: 9 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Uncertainty Source Table</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#FFF' }}>
                  {['Source','σ (%)','Share'].map(h => <th key={h} style={{ padding: '5px 6px', textAlign: 'left' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {sources.map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '5px 6px' }}>{s.source}</td>
                    <td style={{ padding: '5px 6px', fontFamily: 'monospace' }}>{s.sigma}%</td>
                    <td style={{ padding: '5px 6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: `${s.share * 2}px`, height: 8, background: COLORS[i % COLORS.length], borderRadius: 4 }} />
                        <span>{s.share}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: `2px solid ${T.border}`, fontWeight: 700 }}>
                  <td style={{ padding: '5px 6px' }}>RSS Combined</td>
                  <td style={{ padding: '5px 6px', fontFamily: 'monospace', color: T.accent }}>{rss.toFixed(1)}%</td>
                  <td style={{ padding: '5px 6px' }}>—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Tab 8 — Seasonal Analysis
  const renderSeasonal = () => {
    const quarters = [
      { q: 'Q1 (Jan–Mar)', aep: monthlyData.slice(0,3).reduce((s,m) => s+m.aep,0), cf: (monthlyData.slice(0,3).reduce((s,m) => s+m.cf,0)/3).toFixed(1) },
      { q: 'Q2 (Apr–Jun)', aep: monthlyData.slice(3,6).reduce((s,m) => s+m.aep,0), cf: (monthlyData.slice(3,6).reduce((s,m) => s+m.cf,0)/3).toFixed(1) },
      { q: 'Q3 (Jul–Sep)', aep: monthlyData.slice(6,9).reduce((s,m) => s+m.aep,0), cf: (monthlyData.slice(6,9).reduce((s,m) => s+m.cf,0)/3).toFixed(1) },
      { q: 'Q4 (Oct–Dec)', aep: monthlyData.slice(9,12).reduce((s,m) => s+m.aep,0), cf: (monthlyData.slice(9,12).reduce((s,m) => s+m.cf,0)/3).toFixed(1) },
    ];
    const bestMonth = [...monthlyData].sort((a,b) => b.aep - a.aep)[0];
    const worstMonth = [...monthlyData].sort((a,b) => a.aep - b.aep)[0];
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Best Month" value={bestMonth.month} unit="" color={T.green} sub={`${bestMonth.aep.toFixed(0)} GWh, CF ${bestMonth.cf}%`} />
          <KpiCard label="Worst Month" value={worstMonth.month} unit="" color={T.red} sub={`${worstMonth.aep.toFixed(0)} GWh, CF ${worstMonth.cf}%`} />
          <KpiCard label="Q1 AEP" value={quarters[0].aep.toFixed(0)} unit="GWh" color={T.indigo} sub={`CF ${quarters[0].cf}%`} />
          <KpiCard label="Q3 AEP" value={quarters[2].aep.toFixed(0)} unit="GWh" color={T.teal} sub={`CF ${quarters[2].cf}%`} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Monthly AEP Profile</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit=" GWh" />
              <Tooltip />
              <Bar dataKey="aep" name="AEP (GWh)" radius={[4,4,0,0]}>
                {monthlyData.map((entry, index) => (
                  <Cell key={index} fill={index < 3 || index > 9 ? T.indigo : T.teal} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11, color: T.sub, marginTop: 6 }}>
            Blue = storm season (Oct–Mar): higher resource but increased curtailment risk (North Atlantic). Teal = summer.
          </div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Quarterly Capacity Factor Summary</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={quarters}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="q" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip />
              <Bar dataKey="cf" fill={T.accent} name="CF (%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Tab 9 — Extreme Events
  const renderExtreme = () => {
    const v50yr = vRef * 1.4 * (1 + 0.11 * Math.log(50 / 50));
    const vEWM = v50yr * 1.4;
    const typhoonRisk = site.label === 'Taiwan Strait' || site.label === 'US East Coast';
    const hsThresholds = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
    const opWindows = hsThresholds.map((hs, i) => ({
      hs: `Hs < ${hs}m`,
      avail: +(60 - i * 7 + sr(i * 23) * 3).toFixed(1)
    }));
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="50-yr Return Wind" value={v50yr.toFixed(1)} unit="m/s" color={T.red} sub="IEC 61400-3 V50" />
          <KpiCard label="Extreme Wind (EWM)" value={vEWM.toFixed(1)} unit="m/s" color={T.amber} sub="10-min mean" />
          <KpiCard label="Typhoon/Hurricane" value={typhoonRisk ? 'HIGH' : 'LOW'} unit="" color={typhoonRisk ? T.red : T.green} sub={site.label} />
          <KpiCard label="Cut-Out Speed" value={turbine.cutOut} unit="m/s" color={T.indigo} sub={turbine.label} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Operational Window by Wave Height (Hs)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={opWindows}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="hs" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Bar dataKey="avail" fill={T.teal} name="Operational Availability (%)" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Extreme Event Risk Matrix</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <tbody>
                {[
                  ['IEC Turbine Class', windClass, windClass === 'IEC I' ? T.green : T.amber],
                  ['V50yr Reference', `${v50yr.toFixed(1)} m/s`, T.text],
                  ['Extreme Wind (EWM1)', `${vEWM.toFixed(1)} m/s`, T.red],
                  ['Extreme Gust (EOG50)', `${(v50yr * 0.85).toFixed(1)} m/s`, T.amber],
                  ['Typhoon Exposure', typhoonRisk ? 'High — design upgrade' : 'Low', typhoonRisk ? T.red : T.green],
                  ['Storm Season Months', 'Oct–Mar (N.Atlantic), Jun–Nov (W.Pacific)', T.sub],
                  ['Turbine Survival Mode', 'Yaw to feather at cut-out', T.text],
                ].map(([l, v, c]) => (
                  <tr key={l} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '5px 4px', color: T.sub }}>{l}</td>
                    <td style={{ padding: '5px 4px', color: c, fontWeight: 600 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Tab 10 — IEC Turbine Class
  const renderIEC = () => (
    <div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>IEC 61400-1 Turbulence Intensity by Wind Speed Bin</div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={iecMatrix}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="speed" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={[0, 0.3]} />
            <Tooltip />
            <Legend />
            <Line dataKey="TI_A" stroke={T.red} dot strokeWidth={2} name="Class A (TI)" />
            <Line dataKey="TI_B" stroke={T.accent} dot strokeWidth={2} name="Class B (TI)" />
            <Line dataKey="TI_C" stroke={T.teal} dot strokeWidth={2} name="Class C (TI)" />
            <ReferenceLine y={turbI / 100} stroke={T.indigo} strokeDasharray="5 5" label={{ value: 'Site TI', fontSize: 9 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Site-Turbine Suitability Assessment</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.navy, color: '#FFF' }}>
              {['Wind Speed','TI Class A','TI Class B','TI Class C','Site Suitability'].map(h =>
                <th key={h} style={{ padding: '5px 8px', textAlign: 'left' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {iecMatrix.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: row.suitability === 'Suitable' ? '#F0FDF4' : '#FEF2F2' }}>
                <td style={{ padding: '5px 8px', fontFamily: 'monospace' }}>{row.speed}</td>
                <td style={{ padding: '5px 8px' }}>{row.TI_A.toFixed(3)}</td>
                <td style={{ padding: '5px 8px' }}>{row.TI_B.toFixed(3)}</td>
                <td style={{ padding: '5px 8px' }}>{row.TI_C.toFixed(3)}</td>
                <td style={{ padding: '5px 8px', fontWeight: 700, color: row.suitability === 'Suitable' ? T.green : T.red }}>
                  {row.suitability}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Tab 11 — Environmental
  const renderEnvironmental = () => {
    const noiseAt500m = 45 + 10 * Math.log10(turbine.mw);
    const noiseAt1km = noiseAt500m - 6;
    const shadowHrs = 20 + sr(siteIdx * 17) * 40;
    const birdRisk = ['Low', 'Medium', 'High'][Math.floor(sr(siteIdx * 13) * 3)];
    const visualScore = Math.min(10, (shore < 30 ? 8 : shore < 60 ? 5 : 2) + sr(siteIdx * 9));
    const piling_spl = 195 + sr(depth * 0.3) * 5;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { label: 'Noise @ 500m', value: noiseAt500m.toFixed(0), unit: 'dB(A)', color: T.amber, sub: 'WHO limit: 45 dB(A)' },
          { label: 'Noise @ 1km', value: noiseAt1km.toFixed(0), unit: 'dB(A)', color: T.teal },
          { label: 'Shadow Flicker', value: shadowHrs.toFixed(0), unit: 'hrs/yr', color: T.accent, sub: 'Limit: 30 hrs/yr' },
          { label: 'Bird Collision Risk', value: birdRisk, unit: '', color: birdRisk === 'High' ? T.red : T.green },
          { label: 'Visual Impact', value: visualScore.toFixed(1), unit: '/10', color: T.indigo, sub: `${shore} km offshore` },
          { label: 'Piling SPL', value: piling_spl.toFixed(0), unit: 'dB re 1μPa', color: T.red, sub: 'Marine mammal threshold 160 dB' },
        ].map((k, i) => <KpiCard key={i} {...k} />)}
        <div style={{ gridColumn: '1/-1', background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Environmental Impact Summary</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <tbody>
              {[
                ['Noise Assessment', `${noiseAt500m.toFixed(0)} dB(A) at 500m — ${noiseAt500m > 45 ? '⚠ Exceeds WHO limit' : '✓ Within limit'}`],
                ['Shadow Flicker', `${shadowHrs.toFixed(0)} hrs/yr — ${shadowHrs > 30 ? '⚠ Mitigation required' : '✓ Acceptable'}`],
                ['Bird Migration Routes', `${birdRisk} risk — EIA survey required for High`],
                ['Marine Mammal (Piling)', `${piling_spl.toFixed(0)} dB re 1μPa — Soft-start protocol + PAM monitoring`],
                ['Visual Impact', `Score ${visualScore.toFixed(1)}/10 — ${shore >= 60 ? 'Minimal visual impact (>60km offshore)' : shore >= 30 ? 'Moderate visual impact' : 'High visual impact — coastal consultation needed'}`],
                ['Habitat Displacement', `${(turbine.D * turbine.D * 0.785 * arrRows * arrCols / 1e6).toFixed(2)} km² rotor swept area`],
                ['EMF (Cable)', `Recommended DC cable burial >1m depth for benthic protection`],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 4px', color: T.sub, width: 200 }}>{k}</td>
                  <td style={{ padding: '6px 4px', color: T.text }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Tab 12 — Grid Connection
  const renderGrid = () => {
    const isHVDC = shore > 80;
    const cableLoss = isHVDC ? (shore * 0.0003) : (shore * 0.0007);
    const substationMVA = turbine.mw * arrRows * arrCols * 1.1;
    const connectionTimeline = isHVDC ? 48 : 30;
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Cable Technology" value={isHVDC ? 'HVDC' : 'HVAC'} unit="" color={isHVDC ? T.accent : T.teal} sub={isHVDC ? '>80km threshold' : '≤80km threshold'} />
          <KpiCard label="Cable Loss" value={(cableLoss * 100).toFixed(1)} unit="%" color={T.amber} sub={`${shore} km distance`} />
          <KpiCard label="Substation" value={substationMVA.toFixed(0)} unit="MVA" color={T.indigo} />
          <KpiCard label="Connection Timeline" value={connectionTimeline} unit="months" color={T.blue} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>HVAC vs HVDC Crossover Analysis</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.navy, color: '#FFF' }}>
                {['Parameter','HVAC','HVDC','Recommended'].map(h => <th key={h} style={{ padding: '5px 8px', textAlign: 'left' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ['Break-even distance', '~80 km', '~80 km', isHVDC ? 'HVDC' : 'HVAC'],
                ['Cable loss/km', '0.07%', '0.03%', 'HVDC'],
                ['Converter losses', '—', '1.5% per end', 'HVAC short'],
                ['Infrastructure cost', 'Lower CapEx', 'Higher CapEx (+30%)', 'HVAC short'],
                ['Site distance', `${shore} km`, `${shore} km`, isHVDC ? '✓ HVDC' : '✓ HVAC'],
                ['Grid code (reactive)', 'Q control required', 'Inherent Q control', 'HVDC flexible'],
              ].map(([p, a, d, r]) => (
                <tr key={p} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '5px 8px', color: T.sub }}>{p}</td>
                  <td style={{ padding: '5px 8px' }}>{a}</td>
                  <td style={{ padding: '5px 8px' }}>{d}</td>
                  <td style={{ padding: '5px 8px', fontWeight: 700, color: T.green }}>{r}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Grid Code Requirements by Market</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.navy, color: '#FFF' }}>
                {['Market','Grid Code','FRT','LVRT','Q Range'].map(h => <th key={h} style={{ padding: '5px 8px', textAlign: 'left' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ['UK', 'National ETYS', '140ms', '0.15pu', '±0.33 pu'],
                ['Germany', 'TransmissionCode', '150ms', '0.0pu', '±0.41 pu'],
                ['Netherlands', 'Netcode', '150ms', '0.15pu', '±0.33 pu'],
                ['Denmark', 'Energinet', '100ms', '0.0pu', '±0.40 pu'],
                ['US (FERC)', 'NERC FAC-001', '150ms', '0.15pu', '±0.436 pu'],
                ['Taiwan', 'Taipower Grid', '250ms', '0.15pu', '±0.33 pu'],
              ].map(row => (
                <tr key={row[0]} style={{ borderBottom: `1px solid ${T.border}` }}>
                  {row.map((c, ci) => <td key={ci} style={{ padding: '5px 8px' }}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Tab 13 — Technology Comparison
  const renderTechComp = () => {
    const comparison = TURBINES.map((t, i) => {
      const capacityKm2 = (t.mw / (Math.pow(t.D * 7 / 1000, 2))).toFixed(1);
      const cfEst = +(cf * (1 + (t.D - turbine.D) / turbine.D * 0.4) + sr(i * 37) * 0.8).toFixed(1);
      const lcoeEst = +(lcoe * (1 - (t.mw - turbine.mw) * 0.004 + sr(i * 29) * 0.02)).toFixed(1);
      return { ...t, cfEst, lcoeEst, capacityKm2, current: i === turbIdx };
    });
    const radarData = comparison.map(t => ({
      subject: t.label.split('/')[0].trim(),
      Rating: t.mw / 18 * 100,
      RotorD: t.D / 260 * 100,
      CF: t.cfEst / 50 * 100,
      LCOE: (1 - t.lcoeEst / 120) * 100,
      Footprint: (1 - parseFloat(t.capacityKm2) / 5) * 100,
    }));
    return (
      <div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>5 Turbine Models Side-by-Side</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.navy, color: '#FFF' }}>
                  {['Model','Rating (MW)','Rotor D (m)','Hub Height (m)','Est. CF (%)','Est. LCOE ($/MWh)','MW/km²','IEC Class'].map(h =>
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {comparison.map((t, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: t.current ? '#EEF2FF' : 'transparent' }}>
                    <td style={{ padding: '6px 8px', fontWeight: t.current ? 700 : 400 }}>{t.label} {t.current ? '◀' : ''}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{t.mw}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{t.D}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{t.hh}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: T.teal }}>{t.cfEst}%</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: T.green }}>${t.lcoeEst}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{t.capacityKm2}</td>
                    <td style={{ padding: '6px 8px' }}>{t.mw >= 15 ? 'IEC I' : t.mw >= 10 ? 'IEC I/II' : 'IEC II'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Radar Comparison (normalised 0–100)</div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
              {TURBINES.map((t, i) => (
                <Radar key={i} dataKey={t.label.split('/')[0].trim()} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.08} name={t.label} />
              ))}
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Tab 14 — Long-Run Trend
  const renderTrend = () => (
    <div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>10-Year Historical Wind Speed Trend (ERA5-corrected)</div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit=" m/s" domain={['auto', 'auto']} />
            <Tooltip />
            <Legend />
            <Bar dataKey="speed" fill={T.indigo} fillOpacity={0.5} name="Observed Speed (m/s)" />
            <Line dataKey="rcp26" stroke={T.green} dot={false} strokeWidth={2} name="RCP 2.6 Projection" strokeDasharray="4 4" />
            <Line dataKey="rcp45" stroke={T.accent} dot={false} strokeWidth={2} name="RCP 4.5 Projection" strokeDasharray="4 4" />
            <Line dataKey="rcp85" stroke={T.red} dot={false} strokeWidth={2} name="RCP 8.5 Projection" strokeDasharray="4 4" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Climate Change Impact on Offshore Wind Resource</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.navy, color: '#FFF' }}>
              {['Scenario','2050 ΔV (%)','2100 ΔV (%)','AEP Impact','Confidence'].map(h =>
                <th key={h} style={{ padding: '5px 8px', textAlign: 'left' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              ['RCP 2.6 (1.5°C)','  +1.5%','  +2.0%','Slight increase at North Sea','High'],
              ['RCP 4.5 (2°C)',   '-0.5%', '-1.0%', 'Near-neutral, regional variation','Medium'],
              ['RCP 8.5 (4°C)',   '-3.0%', '-6.0%', 'Significant reduction, tropics worst','Low'],
            ].map(([s, v50, v100, imp, conf]) => (
              <tr key={s} style={{ borderBottom: `1px solid ${T.border}` }}>
                <td style={{ padding: '5px 8px' }}>{s}</td>
                <td style={{ padding: '5px 8px', fontFamily: 'monospace', color: v50.includes('-') ? T.red : T.green }}>{v50}</td>
                <td style={{ padding: '5px 8px', fontFamily: 'monospace', color: v100.includes('-') ? T.red : T.green }}>{v100}</td>
                <td style={{ padding: '5px 8px', color: T.sub }}>{imp}</td>
                <td style={{ padding: '5px 8px' }}>{conf}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Tab 15 — Satellite vs Mast
  const renderSatVsMast = () => {
    const biasData = eraVsMast.map(row => ({
      month: row.month,
      bias: +((row.era5 - row.mast) / row.mast * 100).toFixed(2),
      era5: row.era5,
      mast: row.mast,
    }));
    const rmse = Math.sqrt(biasData.reduce((s, d) => s + Math.pow(d.era5 - d.mast, 2), 0) / biasData.length);
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="ERA5 Annual Mean" value={(eraVsMast.reduce((s,d) => s+d.era5,0)/12).toFixed(2)} unit="m/s" color={T.indigo} />
          <KpiCard label="Mast Annual Mean" value={(eraVsMast.reduce((s,d) => s+d.mast,0)/12).toFixed(2)} unit="m/s" color={T.teal} />
          <KpiCard label="Monthly RMSE" value={rmse.toFixed(2)} unit="m/s" color={T.amber} sub="ERA5 vs Mast" />
          <KpiCard label="Mast Correlation" value={mastCorr ? 'Applied' : 'Not Applied'} unit="" color={mastCorr ? T.green : T.red} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>ERA5 vs Met Mast Monthly Comparison</div>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={biasData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="spd" tick={{ fontSize: 10 }} unit=" m/s" />
              <YAxis yAxisId="bias" orientation="right" tick={{ fontSize: 10 }} unit="%" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="spd" dataKey="era5" fill={T.indigo} fillOpacity={0.6} name="ERA5 (m/s)" />
              <Bar yAxisId="spd" dataKey="mast" fill={T.teal} fillOpacity={0.6} name="Mast (m/s)" />
              <Line yAxisId="bias" dataKey="bias" stroke={T.red} dot strokeWidth={2} name="Bias (%)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Data Source Uncertainty Budget</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <tbody>
              {[
                ['ERA5 reanalysis bias', '±2–4%', 'Systematic underestimation in complex terrain'],
                ['Mast extrapolation (shear)', `α = ${shearExp}`, `±3% per 40m height increment`],
                ['Mast correlation (R²)', mastCorr ? '>0.90' : 'Not applied', mastCorr ? 'Reduces uncertainty by ~30%' : 'Adds ~6% uncertainty'],
                ['Satellite (SAR) wind', '±5%', 'Applicable at heights <50m offshore'],
                ['Long-term correction', '±3%', 'Reference period choice sensitivity'],
                ['Vertical extrapolation', `Power law α=${shearExp}`, 'Logarithmic profile recommended >150m'],
              ].map(([p, v, note]) => (
                <tr key={p} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '5px 4px', color: T.sub, width: 200 }}>{p}</td>
                  <td style={{ padding: '5px 4px', fontFamily: 'monospace', color: T.accent }}>{v}</td>
                  <td style={{ padding: '5px 4px', color: T.text, fontSize: 11 }}>{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Tab 16 — Country Comparison
  const renderCountries = () => (
    <div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Average Capacity Factor by Market (%)</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={MARKETS}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="country" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 60]} />
            <Tooltip />
            <Bar dataKey="cf" name="Avg CF (%)" radius={[4,4,0,0]}>
              {MARKETS.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>LCOE Comparison ($/MWh)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[...MARKETS].sort((a,b) => a.lcoe - b.lcoe)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10 }} unit="$" />
              <YAxis dataKey="country" type="category" tick={{ fontSize: 10 }} width={80} />
              <Tooltip />
              <Bar dataKey="lcoe" fill={T.accent} name="LCOE ($/MWh)" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Offshore Wind Market Policy Status</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.navy, color: '#FFF' }}>
                {['Country','CF %','Pipeline GW','Policy'].map(h => <th key={h} style={{ padding: '5px 6px', textAlign: 'left' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {MARKETS.map((m, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '5px 6px' }}>{m.country}</td>
                  <td style={{ padding: '5px 6px', fontFamily: 'monospace', color: T.teal }}>{m.cf}%</td>
                  <td style={{ padding: '5px 6px', fontFamily: 'monospace' }}>{m.pipeline} GW</td>
                  <td style={{ padding: '5px 6px', fontSize: 10, color: m.policy.includes('Active') ? T.green : T.amber }}>{m.policy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Tab 17 — Summary Report
  const renderSummary = () => {
    const sigma = p90Sigma / 100;
    const bankable = p90Aep / netAEP > 0.85;
    return (
      <div>
        <div style={{ background: T.navy, color: '#FFF', borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: T.accent, marginBottom: 8 }}>
            IEC 61400-3 Site Characterisation — Investment Grade Summary
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 12 }}>
            {[
              ['Site', site.label], ['Coordinates', `${site.lat}°N, ${site.lon}°E`],
              ['Water Depth', `${depth} m`], ['Shore Distance', `${shore} km`],
              ['Turbine', turbine.label], ['Array', `${arrRows}×${arrCols} = ${arrRows * arrCols} units`],
              ['Installed Capacity', `${(turbine.mw * arrRows * arrCols).toFixed(0)} MW`], ['IEC Wind Class', windClass],
              ['Hub Height', `${hubHeight} m`], ['Hub Wind Speed', `${vHub.toFixed(2)} m/s`],
              ['Weibull k / λ', `${wk.toFixed(2)} / ${lambda.toFixed(2)} m/s`], ['TI', `${turbI}%`],
            ].map(([l, v]) => (
              <div key={l}>
                <div style={{ color: '#94A3B8', fontSize: 10 }}>{l}</div>
                <div style={{ color: '#E2E8F0', fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <KpiCard label="P50 AEP" value={netAEP.toFixed(0)} unit="GWh/yr" color={T.indigo} />
          <KpiCard label="P90 AEP" value={p90Aep} unit="GWh/yr" color={T.accent} sub={`σ = ${p90Sigma}%`} />
          <KpiCard label="Capacity Factor" value={cf.toFixed(1)} unit="%" color={T.teal} />
          <KpiCard label="LCOE" value={lcoe.toFixed(1)} unit="$/MWh" color={T.green} />
          <KpiCard label="Bankable?" value={bankable ? 'YES' : 'MARGINAL'} unit="" color={bankable ? T.green : T.amber} sub="P90/P50 > 0.85" />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>P50/P90 Bankability Statement</div>
          <div style={{ background: bankable ? '#F0FDF4' : '#FFFBEB', borderRadius: 8, padding: 12, fontSize: 13, color: T.text, lineHeight: 1.6 }}>
            Based on the IEC 61400-3 site characterisation analysis for <strong>{site.label}</strong> with a {turbine.mw} MW turbine
            array ({arrRows}×{arrCols}), the P50 Annual Energy Production is estimated at <strong>{netAEP.toFixed(0)} GWh/yr</strong> with a
            net capacity factor of <strong>{cf.toFixed(1)}%</strong>. The P90 exceedance estimate (probability of exceeding {p90Aep} GWh/yr
            in any given year) incorporates an RSS uncertainty of <strong>{p90Sigma}%</strong> across interannual variability, wake model
            uncertainty, mast correlation ({mastCorr ? 'applied' : 'not applied'}), and degradation. The P90/P50 ratio of{' '}
            <strong>{(p90Aep / netAEP).toFixed(3)}</strong> is <strong style={{ color: bankable ? T.green : T.amber }}>
            {bankable ? 'consistent with investment-grade bankability (≥0.85)' : 'marginal — additional mast data recommended'}</strong>.
          </div>
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Key Risks & Recommended Next Steps</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.navy, color: '#FFF' }}>
                {['Risk Category','Finding','Severity','Recommendation'].map(h =>
                  <th key={h} style={{ padding: '5px 8px', textAlign: 'left' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ['Wake Losses', `${wakeLoss.toFixed(1)}% array wake`, wakeLoss > 10 ? 'HIGH' : 'MEDIUM', 'Gaussian or LES wake validation'],
                ['Wind Resource', `${vHub.toFixed(1)} m/s hub`, vHub >= 9 ? 'LOW' : 'MEDIUM', mastCorr ? 'Mast corr. applied' : 'Deploy met mast'],
                ['Extreme Wind', `${(vRef * 1.4).toFixed(0)} m/s V50`, 'MEDIUM', 'Confirm IEC class compliance'],
                ['Grid Connection', `${shore} km — ${shore > 80 ? 'HVDC' : 'HVAC'}`, 'MEDIUM', `${shore > 80 ? 'HVDC' : 'HVAC'} design study`],
                ['Environmental', `Noise: ${(45 + 10 * Math.log10(turbine.mw)).toFixed(0)} dB(A)`, 'MEDIUM', 'Acoustic shadow study'],
                ['Financial', `LCOE $${lcoe.toFixed(0)} vs PPA $${ppa}`, lcoe < ppa ? 'LOW' : 'HIGH', lcoe < ppa ? 'Positive NPV' : 'Renegotiate PPA'],
              ].map(([cat, find, sev, rec]) => (
                <tr key={cat} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '5px 8px', fontWeight: 600 }}>{cat}</td>
                  <td style={{ padding: '5px 8px', color: T.sub }}>{find}</td>
                  <td style={{ padding: '5px 8px', fontWeight: 700, color: sev === 'HIGH' ? T.red : sev === 'MEDIUM' ? T.amber : T.green }}>{sev}</td>
                  <td style={{ padding: '5px 8px' }}>{rec}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTab = () => {
    switch (tab) {
      case 0:  return renderOverview();
      case 1:  return renderWindAtlas();
      case 2:  return renderWeibull();
      case 3:  return renderPowerCurve();
      case 4:  return renderCF();
      case 5:  return renderWake();
      case 6:  return renderAEP();
      case 7:  return renderUncertainty();
      case 8:  return renderSeasonal();
      case 9:  return renderExtreme();
      case 10: return renderIEC();
      case 11: return renderEnvironmental();
      case 12: return renderGrid();
      case 13: return renderTechComp();
      case 14: return renderTrend();
      case 15: return renderSatVsMast();
      case 16: return renderCountries();
      case 17: return renderSummary();
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'DM Sans, sans-serif' }}>
      {Sidebar}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {QuickStats}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: T.text }}>
              Offshore Wind Resource & Wake Loss Analytics
            </div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
              EP-DR1 · {site.label} · {turbine.label} · {arrRows}×{arrCols} Array · IEC 61400-3
            </div>
          </div>
          <TabBar tabs={TABS} active={tab} onChange={setTab} />
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
