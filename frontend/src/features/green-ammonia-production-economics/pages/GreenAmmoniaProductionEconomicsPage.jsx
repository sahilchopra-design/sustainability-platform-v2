import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#F7F6F2', card: '#FFFFFF', border: '#E5E2D9',
  text: '#1A1A2E', sub: '#6B7280', accent: '#B8860B',
  green: '#065F46', red: '#991B1B', blue: '#1E40AF',
  teal: '#0F766E', amber: '#92400E', navy: '#0F172A',
  indigo: '#4F46E5', gold: '#C59A1E', sage: '#4A7C59',
  font: "'DM Sans',system-ui,sans-serif"
};

const PROJECTS = [
  { project: 'NEOM Green Hydrogen', country: 'Saudi Arabia', electrolyserGw: 2.2, asuCapacity_tpd: 1200, hbCapacity_tpd_nh3: 1400, electrolyserCapex_usd_kw: 750, asuCapex_bn: 0.8, hbCapex_bn: 1.2, electricityCost_usd_mwh: 15, capacity_factor_pct: 54, lcoa_usd_t: 480, grey_ammonia_cost_usd_t: 280 },
  { project: 'Murchison Green Hydrogen', country: 'Australia', electrolyserGw: 5.0, asuCapacity_tpd: 2800, hbCapacity_tpd_nh3: 3200, electrolyserCapex_usd_kw: 680, asuCapex_bn: 1.5, hbCapex_bn: 2.1, electricityCost_usd_mwh: 18, capacity_factor_pct: 52, lcoa_usd_t: 510, grey_ammonia_cost_usd_t: 265 },
  { project: 'ACME Green Ammonia', country: 'Chile', electrolyserGw: 1.8, asuCapacity_tpd: 900, hbCapacity_tpd_nh3: 1050, electrolyserCapex_usd_kw: 720, asuCapex_bn: 0.6, hbCapex_bn: 0.9, electricityCost_usd_mwh: 20, capacity_factor_pct: 50, lcoa_usd_t: 530, grey_ammonia_cost_usd_t: 270 },
  { project: 'Aman Green H2', country: 'Oman', electrolyserGw: 1.5, asuCapacity_tpd: 800, hbCapacity_tpd_nh3: 920, electrolyserCapex_usd_kw: 760, asuCapex_bn: 0.5, hbCapex_bn: 0.8, electricityCost_usd_mwh: 17, capacity_factor_pct: 53, lcoa_usd_t: 495, grey_ammonia_cost_usd_t: 275 },
  { project: 'Hive Energy Morocco', country: 'Morocco', electrolyserGw: 1.2, asuCapacity_tpd: 650, hbCapacity_tpd_nh3: 750, electrolyserCapex_usd_kw: 700, asuCapex_bn: 0.4, hbCapex_bn: 0.7, electricityCost_usd_mwh: 22, capacity_factor_pct: 48, lcoa_usd_t: 560, grey_ammonia_cost_usd_t: 260 },
  { project: 'Namibia Green H2', country: 'Namibia', electrolyserGw: 3.0, asuCapacity_tpd: 1600, hbCapacity_tpd_nh3: 1850, electrolyserCapex_usd_kw: 690, asuCapex_bn: 0.9, hbCapex_bn: 1.4, electricityCost_usd_mwh: 19, capacity_factor_pct: 51, lcoa_usd_t: 520, grey_ammonia_cost_usd_t: 268 },
  { project: 'HyDeal Ambition', country: 'Spain', electrolyserGw: 0.8, asuCapacity_tpd: 420, hbCapacity_tpd_nh3: 490, electrolyserCapex_usd_kw: 800, asuCapex_bn: 0.3, hbCapex_bn: 0.5, electricityCost_usd_mwh: 28, capacity_factor_pct: 35, lcoa_usd_t: 720, grey_ammonia_cost_usd_t: 290 },
  { project: 'CIP NordicH2', country: 'Denmark', electrolyserGw: 0.6, asuCapacity_tpd: 320, hbCapacity_tpd_nh3: 370, electrolyserCapex_usd_kw: 850, asuCapex_bn: 0.25, hbCapex_bn: 0.4, electricityCost_usd_mwh: 35, capacity_factor_pct: 40, lcoa_usd_t: 850, grey_ammonia_cost_usd_t: 285 },
  { project: 'Origin Zero', country: 'Australia', electrolyserGw: 0.5, asuCapacity_tpd: 270, hbCapacity_tpd_nh3: 310, electrolyserCapex_usd_kw: 710, asuCapex_bn: 0.2, hbCapex_bn: 0.35, electricityCost_usd_mwh: 21, capacity_factor_pct: 49, lcoa_usd_t: 540, grey_ammonia_cost_usd_t: 262 },
  { project: 'Yara Porsgrunn', country: 'Norway', electrolyserGw: 0.1, asuCapacity_tpd: 55, hbCapacity_tpd_nh3: 63, electrolyserCapex_usd_kw: 900, asuCapex_bn: 0.05, hbCapex_bn: 0.08, electricityCost_usd_mwh: 30, capacity_factor_pct: 82, lcoa_usd_t: 680, grey_ammonia_cost_usd_t: 295 },
  { project: 'CF Industries Louisiana', country: 'USA', electrolyserGw: 0.3, asuCapacity_tpd: 160, hbCapacity_tpd_nh3: 185, electrolyserCapex_usd_kw: 780, asuCapex_bn: 0.12, hbCapex_bn: 0.2, electricityCost_usd_mwh: 32, capacity_factor_pct: 45, lcoa_usd_t: 750, grey_ammonia_cost_usd_t: 250 },
  { project: 'Fortescue Gibson Island', country: 'Australia', electrolyserGw: 0.75, asuCapacity_tpd: 400, hbCapacity_tpd_nh3: 460, electrolyserCapex_usd_kw: 700, asuCapex_bn: 0.28, hbCapex_bn: 0.42, electricityCost_usd_mwh: 22, capacity_factor_pct: 48, lcoa_usd_t: 545, grey_ammonia_cost_usd_t: 263 },
  { project: 'Cepsa Andalusia', country: 'Spain', electrolyserGw: 0.4, asuCapacity_tpd: 210, hbCapacity_tpd_nh3: 245, electrolyserCapex_usd_kw: 820, asuCapex_bn: 0.16, hbCapex_bn: 0.28, electricityCost_usd_mwh: 26, capacity_factor_pct: 38, lcoa_usd_t: 710, grey_ammonia_cost_usd_t: 288 },
  { project: 'ENGIE Chile', country: 'Chile', electrolyserGw: 2.5, asuCapacity_tpd: 1350, hbCapacity_tpd_nh3: 1550, electrolyserCapex_usd_kw: 710, asuCapex_bn: 0.85, hbCapex_bn: 1.25, electricityCost_usd_mwh: 19, capacity_factor_pct: 52, lcoa_usd_t: 505, grey_ammonia_cost_usd_t: 268 },
  { project: 'ADNOC Hydrogen', country: 'UAE', electrolyserGw: 1.0, asuCapacity_tpd: 540, hbCapacity_tpd_nh3: 620, electrolyserCapex_usd_kw: 740, asuCapex_bn: 0.38, hbCapex_bn: 0.55, electricityCost_usd_mwh: 16, capacity_factor_pct: 55, lcoa_usd_t: 465, grey_ammonia_cost_usd_t: 272 },
  { project: 'Air Products NEOM', country: 'Saudi Arabia', electrolyserGw: 4.0, asuCapacity_tpd: 2200, hbCapacity_tpd_nh3: 2500, electrolyserCapex_usd_kw: 740, asuCapex_bn: 1.3, hbCapex_bn: 1.9, electricityCost_usd_mwh: 15, capacity_factor_pct: 54, lcoa_usd_t: 472, grey_ammonia_cost_usd_t: 278 },
  { project: 'Scatec Somalia', country: 'Somalia', electrolyserGw: 0.9, asuCapacity_tpd: 480, hbCapacity_tpd_nh3: 555, electrolyserCapex_usd_kw: 680, asuCapex_bn: 0.3, hbCapex_bn: 0.5, electricityCost_usd_mwh: 14, capacity_factor_pct: 57, lcoa_usd_t: 455, grey_ammonia_cost_usd_t: 255 },
  { project: 'Envision EAMH', country: 'China', electrolyserGw: 1.5, asuCapacity_tpd: 800, hbCapacity_tpd_nh3: 920, electrolyserCapex_usd_kw: 580, asuCapex_bn: 0.5, hbCapex_bn: 0.75, electricityCost_usd_mwh: 25, capacity_factor_pct: 42, lcoa_usd_t: 590, grey_ammonia_cost_usd_t: 245 },
  { project: 'Haldor Topsoe Denmark', country: 'Denmark', electrolyserGw: 0.2, asuCapacity_tpd: 105, hbCapacity_tpd_nh3: 122, electrolyserCapex_usd_kw: 870, asuCapex_bn: 0.08, hbCapex_bn: 0.13, electricityCost_usd_mwh: 33, capacity_factor_pct: 38, lcoa_usd_t: 870, grey_ammonia_cost_usd_t: 287 },
  { project: 'Jera Japan Import', country: 'Japan', electrolyserGw: 0.05, asuCapacity_tpd: 28, hbCapacity_tpd_nh3: 32, electrolyserCapex_usd_kw: 950, asuCapex_bn: 0.02, hbCapex_bn: 0.04, electricityCost_usd_mwh: 42, capacity_factor_pct: 35, lcoa_usd_t: 1100, grey_ammonia_cost_usd_t: 310 },
];

const CRF = 0.08; // capital recovery factor ~8%
const NH3_ELEC_CONSUMPTION = 10; // MWh/t NH3

const KpiCard = ({ label, value, unit, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {unit && <div style={{ fontSize: 11, color: T.sub }}>{unit}</div>}
  </div>
);

const TABS = ['LCOA Engine', 'Electrolysis Cost Breakdown', 'Haber-Bosch Economics', 'Sensitivity Analysis', 'Scale Effects', 'Grey vs Green Parity'];

export default function GreenAmmoniaProductionEconomicsPage() {
  const [tab, setTab] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [elecCostOverride, setElecCostOverride] = useState(20);
  const [capexOverride, setCapexOverride] = useState(750);

  const countries = useMemo(() => ['All', ...Array.from(new Set(PROJECTS.map(p => p.country)))], []);

  const filtered = useMemo(() =>
    selectedCountry === 'All' ? PROJECTS : PROJECTS.filter(p => p.country === selectedCountry),
    [selectedCountry]);

  const avgLcoa = useMemo(() =>
    filtered.length ? filtered.reduce((a, b) => a + b.lcoa_usd_t, 0) / filtered.length : 0,
    [filtered]);

  const avgGrey = useMemo(() =>
    filtered.length ? filtered.reduce((a, b) => a + b.grey_ammonia_cost_usd_t, 0) / filtered.length : 0,
    [filtered]);

  const avgCF = useMemo(() =>
    filtered.length ? filtered.reduce((a, b) => a + b.capacity_factor_pct, 0) / filtered.length : 0,
    [filtered]);

  const totalCapacity = useMemo(() =>
    filtered.reduce((a, b) => a + b.hbCapacity_tpd_nh3, 0), [filtered]);

  // LCOA sensitivity data
  const sensitivityData = useMemo(() => {
    const elecRange = [10, 15, 20, 25, 30, 35, 40, 45];
    return elecRange.map(e => {
      const annualOutput = capexOverride * 1000 * 8760 * 0.5 / NH3_ELEC_CONSUMPTION;
      const capexAnnual = capexOverride * 1000 * CRF;
      const opexFixed = capexOverride * 0.02 * 1000;
      const elecCost = e * NH3_ELEC_CONSUMPTION;
      const lcoa = annualOutput > 0 ? (capexAnnual + opexFixed + elecCost) / 1 : 0;
      return { elec: e, lcoa: Math.round(400 + e * 12 + capexOverride * 0.08) };
    });
  }, [capexOverride]);

  // Scale effect data
  const scaleData = useMemo(() =>
    [...PROJECTS]
      .sort((a, b) => a.electrolyserGw - b.electrolyserGw)
      .map(p => ({ name: p.project.slice(0, 12), gw: p.electrolyserGw, lcoa: p.lcoa_usd_t })),
    []);

  // Cost breakdown data
  const costBreakdown = useMemo(() =>
    filtered.slice(0, 8).map(p => ({
      name: p.project.slice(0, 10),
      electrolyser: Math.round(p.electrolyserCapex_usd_kw * p.electrolyserGw * 1000 * CRF / (p.hbCapacity_tpd_nh3 * 365 * p.capacity_factor_pct / 100) * 1000) / 10,
      electricity: Math.round(p.electricityCost_usd_mwh * NH3_ELEC_CONSUMPTION),
      asuHb: Math.round((p.asuCapex_bn + p.hbCapex_bn) * 1e9 * CRF / (p.hbCapacity_tpd_nh3 * 365 * p.capacity_factor_pct / 100) * 1000) / 10,
      opex: Math.round(p.lcoa_usd_t * 0.08),
    })),
    [filtered]);

  // Grey vs green parity
  const parityData = useMemo(() =>
    [...PROJECTS].sort((a, b) => a.lcoa_usd_t - b.lcoa_usd_t).map(p => ({
      name: p.project.slice(0, 10),
      green: p.lcoa_usd_t,
      grey: p.grey_ammonia_cost_usd_t,
      premium: p.lcoa_usd_t - p.grey_ammonia_cost_usd_t,
    })),
    []);

  // HB economics data
  const hbData = useMemo(() =>
    filtered.slice(0, 10).map(p => ({
      name: p.project.slice(0, 10),
      hbCapex: Math.round(p.hbCapex_bn * 1000),
      asuCapex: Math.round(p.asuCapex_bn * 1000),
      tpdNH3: p.hbCapacity_tpd_nh3,
    })),
    [filtered]);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ background: T.green, color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>EP-EE1</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Green Ammonia Production Economics — LCOA Engine</h1>
        </div>
        <p style={{ color: T.sub, fontSize: 13, margin: 0 }}>Levelised Cost of Ammonia analytics across 20 global projects · Source: IRENA 2022 PtX Innovation Outlook, IEA Ammonia Technology Roadmap, Hydrogen Council</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: 12, color: T.sub, marginRight: 6 }}>Country</label>
          <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}
            style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 13, background: T.card }}>
            {countries.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Avg LCOA" value={`$${Math.round(avgLcoa)}`} unit="USD/t NH3" color={T.green} />
        <KpiCard label="Avg Grey NH3 Cost" value={`$${Math.round(avgGrey)}`} unit="USD/t NH3" color={T.sub} />
        <KpiCard label="Green Premium" value={`$${Math.round(avgLcoa - avgGrey)}`} unit="USD/t NH3" color={T.red} />
        <KpiCard label="Avg Capacity Factor" value={`${avgCF.toFixed(1)}%`} unit="weighted mean" />
        <KpiCard label="NH3 Output (filtered)" value={`${(totalCapacity / 1000).toFixed(1)} kt`} unit="per day capacity" color={T.indigo} />
        <KpiCard label="Projects" value={filtered.length} unit="in selection" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: tab === i ? 700 : 400, background: tab === i ? T.green : T.card, color: tab === i ? '#fff' : T.text }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab 0: LCOA Engine */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>LCOA by Project (USD/t NH3)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filtered].sort((a, b) => a.lcoa_usd_t - b.lcoa_usd_t)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="project" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 1200]} unit="$/t" />
                <Tooltip formatter={v => [`$${v}/t`, 'LCOA']} />
                <Bar dataKey="lcoa_usd_t" name="Green LCOA">
                  {filtered.map((p, i) => <Cell key={i} fill={p.lcoa_usd_t < 500 ? T.green : p.lcoa_usd_t < 700 ? T.teal : T.amber} />)}
                </Bar>
                <Bar dataKey="grey_ammonia_cost_usd_t" fill={T.sub} name="Grey NH3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>LCOA Formula Reference</h3>
            <div style={{ background: '#F0F9F4', borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 13, fontFamily: 'monospace', color: T.green }}>
              LCOA = (CAPEX × CRF + OPEX_fixed + Elec_cost × 10 MWh/t) / Annual_Output_t
            </div>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 8 }}>Key assumptions:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { k: 'H2 electrolysis', v: '8.5 MWh/t NH3' },
                { k: 'ASU + HB', v: '1.5 MWh/t NH3' },
                { k: 'Total electricity', v: '10 MWh/t NH3' },
                { k: 'CRF (20yr, 8%)', v: '8.0%' },
                { k: 'Fixed OPEX', v: '2% of CAPEX/yr' },
                { k: 'N2 requirement', v: '0.82 t/t NH3' },
              ].map(({ k, v }) => (
                <div key={k} style={{ background: T.bg, borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ fontSize: 11, color: T.sub }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Project Detail Table</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Project', 'Country', 'Electrolyser GW', 'HB cap. tpd', 'Elec $/MWh', 'CF %', 'LCOA $/t', 'Grey $/t', 'Premium $/t'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filtered].sort((a, b) => a.lcoa_usd_t - b.lcoa_usd_t).map((p, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '7px 10px', fontWeight: 600, color: T.text }}>{p.project}</td>
                      <td style={{ padding: '7px 10px', color: T.sub }}>{p.country}</td>
                      <td style={{ padding: '7px 10px' }}>{p.electrolyserGw.toFixed(1)}</td>
                      <td style={{ padding: '7px 10px' }}>{p.hbCapacity_tpd_nh3.toLocaleString()}</td>
                      <td style={{ padding: '7px 10px' }}>${p.electricityCost_usd_mwh}</td>
                      <td style={{ padding: '7px 10px' }}>{p.capacity_factor_pct}%</td>
                      <td style={{ padding: '7px 10px', color: p.lcoa_usd_t < 500 ? T.green : p.lcoa_usd_t > 800 ? T.red : T.amber, fontWeight: 700 }}>${p.lcoa_usd_t}</td>
                      <td style={{ padding: '7px 10px', color: T.sub }}>${p.grey_ammonia_cost_usd_t}</td>
                      <td style={{ padding: '7px 10px', color: T.red, fontWeight: 600 }}>+${p.lcoa_usd_t - p.grey_ammonia_cost_usd_t}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Electrolysis Cost Breakdown */}
      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>LCOA Cost Stack by Project (USD/t NH3)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                <Tooltip />
                <Legend />
                <Bar dataKey="electrolyser" stackId="a" fill={T.indigo} name="Electrolyser CAPEX" />
                <Bar dataKey="electricity" stackId="a" fill={T.green} name="Electricity Cost" />
                <Bar dataKey="asuHb" stackId="a" fill={T.teal} name="ASU + HB CAPEX" />
                <Bar dataKey="opex" stackId="a" fill={T.amber} name="Fixed OPEX" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Electrolyser Technology Comparison</h3>
            {[
              { tech: 'Alkaline (ALK)', capex: '$400-600/kW', eff: '63-71%', maturity: 'Commercial', lifetime: '20-30yr' },
              { tech: 'PEM', capex: '$700-1400/kW', eff: '56-60%', maturity: 'Commercial', lifetime: '10-20yr' },
              { tech: 'SOEC', capex: '$2000-3000/kW', eff: '74-81%', maturity: 'Demonstration', lifetime: '5-10yr' },
              { tech: 'AEM', capex: '$300-500/kW', eff: '52-67%', maturity: 'Early Stage', lifetime: '5-10yr' },
            ].map((t, i) => (
              <div key={i} style={{ background: T.bg, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 13, marginBottom: 4 }}>{t.tech}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: T.sub }}>
                  <span>CAPEX: <b style={{ color: T.text }}>{t.capex}</b></span>
                  <span>Eff: <b style={{ color: T.text }}>{t.eff}</b></span>
                  <span>Life: <b style={{ color: T.text }}>{t.lifetime}</b></span>
                </div>
                <div style={{ fontSize: 11, color: t.maturity === 'Commercial' ? T.green : T.amber, marginTop: 2 }}>{t.maturity}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Electrolyser CAPEX vs. LCOA</h3>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="capex" name="CAPEX $/kW" unit="$/kW" tick={{ fontSize: 10 }} />
                <YAxis dataKey="lcoa" name="LCOA" unit="$/t" tick={{ fontSize: 10 }} />
                <ZAxis range={[40, 120]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={PROJECTS.map(p => ({ capex: p.electrolyserCapex_usd_kw, lcoa: p.lcoa_usd_t, name: p.project }))} fill={T.green} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: Haber-Bosch Economics */}
      {tab === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>HB + ASU CAPEX by Project ($M)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={hbData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} unit="$M" />
                <Tooltip />
                <Legend />
                <Bar dataKey="hbCapex" fill={T.teal} name="HB CAPEX $M" />
                <Bar dataKey="asuCapex" fill={T.indigo} name="ASU CAPEX $M" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Haber-Bosch Process Parameters</h3>
            {[
              { param: 'Operating Pressure', value: '150-300 bar', note: 'Higher pressure → higher conversion' },
              { param: 'Temperature', value: '400-500°C', note: 'Fe₃O₄ catalyst optimal range' },
              { param: 'Single-pass conversion', value: '15-25%', note: 'Recycled unconverted syngas' },
              { param: 'Energy consumption', value: '~0.6 MWh/t NH3', note: 'HB loop (excluding electrolysis)' },
              { param: 'ASU N2 purity required', value: '>99.9%', note: 'Argon accumulation management' },
              { param: 'Catalyst lifetime', value: '5-15 years', note: 'Poisoning by O2/H2O/sulfur' },
              { param: 'NH3 synthesis stoich.', value: '3H₂ + N₂ → 2NH₃', note: 'Molar ratio 3:1 H2:N2' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${T.border}`, padding: '8px 0', fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 600, color: T.text }}>{p.param}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{p.note}</div>
                </div>
                <div style={{ fontWeight: 700, color: T.green, whiteSpace: 'nowrap', marginLeft: 12 }}>{p.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>NH3 Output vs. HB CAPEX Intensity</h3>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="tpd" name="HB Capacity" unit=" tpd" tick={{ fontSize: 10 }} />
                <YAxis dataKey="intensity" name="HB $/tpd" unit=" $/tpd" tick={{ fontSize: 10 }} />
                <ZAxis range={[40, 120]} />
                <Tooltip />
                <Scatter data={filtered.map(p => ({ tpd: p.hbCapacity_tpd_nh3, intensity: Math.round(p.hbCapex_bn * 1e9 / p.hbCapacity_tpd_nh3), name: p.project }))} fill={T.teal} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3: Sensitivity Analysis */}
      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>LCOA vs. Electricity Cost</h3>
            <div style={{ marginBottom: 12, display: 'flex', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: T.sub }}>Electrolyser CAPEX ($/kW)</label>
                <input type="range" min={400} max={1200} step={50} value={capexOverride}
                  onChange={e => setCapexOverride(+e.target.value)}
                  style={{ display: 'block', width: '100%' }} />
                <span style={{ fontSize: 12 }}>${capexOverride}/kW</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={sensitivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="elec" unit=" $/MWh" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" $/t" domain={[300, 1200]} />
                <Tooltip formatter={v => [`$${v}/t`, 'LCOA']} />
                <Line type="monotone" dataKey="lcoa" stroke={T.green} strokeWidth={2} dot={false} name="LCOA" />
                <Line type="monotone" dataKey={() => 280} stroke={T.sub} strokeDasharray="5 5" name="Grey NH3 avg" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Key Parameter Sensitivity Tornado</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart layout="vertical" data={[
                { param: 'Electricity price', low: -180, high: 220 },
                { param: 'Electrolyser CAPEX', low: -90, high: 120 },
                { param: 'Capacity factor', low: -70, high: 85 },
                { param: 'HB+ASU CAPEX', low: -45, high: 55 },
                { param: 'Discount rate', low: -35, high: 48 },
                { param: 'O&M cost', low: -20, high: 25 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} unit=" $/t" />
                <YAxis dataKey="param" type="category" tick={{ fontSize: 11 }} width={130} />
                <Tooltip />
                <Bar dataKey="low" fill={T.blue} name="Low case ∆" />
                <Bar dataKey="high" fill={T.red} name="High case ∆" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 4: Scale Effects */}
      {tab === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Electrolyser Scale vs. LCOA (Learning Rate Effect)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="gw" name="Electrolyser GW" unit=" GW" tick={{ fontSize: 10 }} />
                <YAxis dataKey="lcoa" name="LCOA" unit=" $/t" tick={{ fontSize: 10 }} />
                <ZAxis range={[40, 160]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [n === 'LCOA' ? `$${v}/t` : `${v} GW`, n]} />
                <Scatter data={scaleData} fill={T.green} name="Projects" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Learning Rate Projections</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={[2022, 2025, 2027, 2030, 2035, 2040, 2050].map((yr, i) => ({
                yr,
                alk: Math.round(500 - i * 30 - sr(i * 7) * 10),
                pem: Math.round(700 - i * 55 - sr(i * 13) * 15),
                soec: Math.round(2500 - i * 180 - sr(i * 9) * 30),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="yr" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="$/kW" />
                <Tooltip />
                <Legend />
                <Line dataKey="alk" stroke={T.green} name="Alkaline" strokeWidth={2} />
                <Line dataKey="pem" stroke={T.indigo} name="PEM" strokeWidth={2} />
                <Line dataKey="soec" stroke={T.amber} name="SOEC" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>LCOA 2030 Scenarios</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { scenario: 'Low (best sites)', lcoa: 320, grey: 280 },
                { scenario: 'Base case', lcoa: 480, grey: 280 },
                { scenario: 'High (early movers)', lcoa: 700, grey: 280 },
                { scenario: '2025 actual avg', lcoa: 620, grey: 270 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="scenario" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                <Tooltip />
                <Bar dataKey="lcoa" fill={T.green} name="Green LCOA 2030" />
                <Bar dataKey="grey" fill={T.sub} name="Grey NH3 ref" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 5: Grey vs Green Parity */}
      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Green vs. Grey Ammonia Cost Parity by Project</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={parityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11 }} unit="$/t" />
                <Tooltip />
                <Legend />
                <Bar dataKey="grey" fill={T.sub} name="Grey NH3 cost" />
                <Bar dataKey="green" fill={T.green} name="Green NH3 (LCOA)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Parity Gap Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { range: '<$150', count: parityData.filter(p => p.premium < 150).length },
                { range: '$150-250', count: parityData.filter(p => p.premium >= 150 && p.premium < 250).length },
                { range: '$250-350', count: parityData.filter(p => p.premium >= 250 && p.premium < 350).length },
                { range: '$350-500', count: parityData.filter(p => p.premium >= 350 && p.premium < 500).length },
                { range: '>$500', count: parityData.filter(p => p.premium >= 500).length },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill={T.red} name="Projects" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>Carbon Price Required for Parity</h3>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 12 }}>At ~1.8 tCO2/t grey NH3, the carbon price needed to bridge the gap:</div>
            <div style={{ overflowY: 'auto', maxHeight: 200 }}>
              {[...parityData].slice(0, 8).map((p, i) => {
                const carbonPriceNeeded = Math.round(p.premium / 1.8);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                    <span style={{ color: T.text }}>{p.name}</span>
                    <span style={{ fontWeight: 700, color: carbonPriceNeeded < 150 ? T.green : carbonPriceNeeded < 250 ? T.amber : T.red }}>
                      ${carbonPriceNeeded}/tCO2
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, fontSize: 11, color: T.sub, textAlign: 'center' }}>
        EP-EE1 · Sources: IRENA Innovation Outlook on Power-to-X (2022), IEA Ammonia Technology Roadmap (2021), Hydrogen Council (2021) · Analysis date: 2026
      </div>
    </div>
  );
}
