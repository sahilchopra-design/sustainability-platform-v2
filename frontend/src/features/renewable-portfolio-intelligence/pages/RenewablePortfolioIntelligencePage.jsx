import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

// ─── Platform Standards ───────────────────────────────────────────────────────
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = {
  bg: '#FAFAF7', card: '#FFFFFF', border: '#E5E2D9', text: '#1A1A2E',
  sub: '#6B7280', accent: '#B8860B', indigo: '#4F46E5', green: '#065F46',
  red: '#991B1B', blue: '#1E40AF', amber: '#92400E', teal: '#0F766E'
};
const CHART_COLORS = ['#4F46E5', '#B8860B', '#065F46', '#991B1B', '#0F766E', '#1E40AF', '#92400E', '#6B7280'];

// ─── Seed Data ────────────────────────────────────────────────────────────────
const TECHNOLOGIES = ['Solar PV', 'Onshore Wind', 'Offshore Wind', 'Solar+BESS', 'Hydro', 'Geothermal'];
const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa'];
const STATUS = ['Operating', 'Operating', 'Operating', 'Construction', 'Development'];

const ASSETS = Array.from({ length: 50 }, (_, i) => {
  const tech = TECHNOLOGIES[Math.floor(sr(i * 7) * TECHNOLOGIES.length)];
  const region = REGIONS[Math.floor(sr(i * 11) * REGIONS.length)];
  const status = STATUS[Math.floor(sr(i * 13) * STATUS.length)];
  const capacityMW = Math.round(50 + sr(i * 3) * 450);
  const cfMap = {
    'Solar PV': 0.17 + sr(i * 17) * 0.12,
    'Onshore Wind': 0.28 + sr(i * 19) * 0.17,
    'Offshore Wind': 0.38 + sr(i * 23) * 0.17,
    'Solar+BESS': 0.19 + sr(i * 29) * 0.10,
    'Hydro': 0.35 + sr(i * 31) * 0.25,
    'Geothermal': 0.80 + sr(i * 37) * 0.10
  };
  const cf = cfMap[tech] || 0.25;
  const annualGWh = capacityMW * cf * 8760 / 1000;
  const capexPerW = tech === 'Offshore Wind' ? 2.8 + sr(i * 41) * 0.8 : tech === 'Solar PV' ? 0.75 + sr(i * 43) * 0.35 : 1.2 + sr(i * 47) * 0.8;
  const totalCapexM = capacityMW * 1000 * capexPerW / 1e6;
  const codYear = 2018 + Math.floor(sr(i * 53) * 8);
  const ppaPriceMWh = 35 + sr(i * 59) * 30;
  const annualRevM = annualGWh * 1000 * ppaPriceMWh / 1e6;
  const ebitdaMargin = 0.72 + sr(i * 61) * 0.12;
  const equityIRR = 0.09 + sr(i * 67) * 0.08;
  const projectDSCR = 1.20 + sr(i * 71) * 0.30;
  const avoidedCO2tpy = annualGWh * 1000 * 0.42;
  const performanceRatio = 0.76 + sr(i * 73) * 0.10;
  const availabilityPct = 0.96 + sr(i * 79) * 0.03;
  return {
    id: i + 1,
    name: `${region.split(' ')[0]} ${tech.split(' ')[0]} ${capacityMW}`,
    tech, region, status, capacityMW, cf: parseFloat(cf.toFixed(3)),
    annualGWh: parseFloat(annualGWh.toFixed(1)),
    totalCapexM: parseFloat(totalCapexM.toFixed(1)),
    capexPerW: parseFloat(capexPerW.toFixed(2)),
    codYear, ppaPriceMWh: parseFloat(ppaPriceMWh.toFixed(1)),
    annualRevM: parseFloat(annualRevM.toFixed(1)),
    ebitdaMargin: parseFloat(ebitdaMargin.toFixed(3)),
    equityIRR: parseFloat(equityIRR.toFixed(3)),
    projectDSCR: parseFloat(projectDSCR.toFixed(2)),
    avoidedCO2tpy: parseFloat(avoidedCO2tpy.toFixed(0)),
    performanceRatio: parseFloat(performanceRatio.toFixed(3)),
    availabilityPct: parseFloat(availabilityPct.toFixed(3)),
    debtPct: 0.65 + sr(i * 83) * 0.15,
    country: region
  };
});

const TABS = [
  'Portfolio Dashboard', 'Technology Mix', 'Geographic Intelligence',
  'Capacity Factor Analytics', 'Financial Benchmarking', 'Correlation & Risk',
  'Vintage & Maturity', 'Operational KPIs', 'ESG & Carbon', 'Peer Benchmarking'
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Sub-components ───────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = T.indigo, large = false }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: large ? '20px 24px' : '16px 20px', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 11, color: T.sub, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: large ? 28 : 22, fontWeight: 700, color: T.text, fontFamily: 'DM Sans, sans-serif' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: 'DM Sans, sans-serif' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

function FilterButton({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: 6, border: `1px solid ${active ? T.indigo : T.border}`,
      background: active ? T.indigo : T.card, color: active ? '#fff' : T.text,
      fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
    }}>{label}</button>
  );
}

function ChartCard({ title, children, span = 1 }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '20px', gridColumn: span > 1 ? `span ${span}` : undefined }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 16, fontFamily: 'DM Sans, sans-serif' }}>{title}</div>
      {children}
    </div>
  );
}

function DataTable({ headers, rows, striped = true }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: '#F3F4F6' }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '8px 12px', textAlign: i === 0 ? 'left' : 'right', color: T.sub, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: striped && ri % 2 === 1 ? '#FAFAF7' : T.card, borderBottom: `1px solid ${T.border}` }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '8px 12px', textAlign: ci === 0 ? 'left' : 'right', color: T.text, whiteSpace: 'nowrap' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RenewablePortfolioIntelligencePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [techFilter, setTechFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [wbData, setWbData] = useState(null);
  const [wbLoading, setWbLoading] = useState(true);
  const abortRef = useRef(null);

  // ── World Bank API ──────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    setWbLoading(true);
    fetch('https://api.worldbank.org/v2/country/all/indicator/EG.ELC.RNEW.ZS?format=json&mrv=1&per_page=60', { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data[1]) {
          const valid = data[1].filter(d => d.value !== null).slice(0, 10);
          setWbData(valid);
        }
        setWbLoading(false);
      })
      .catch(() => setWbLoading(false));
    return () => controller.abort();
  }, []);

  // ── Filtered Assets ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return ASSETS.filter(a => {
      const tOk = techFilter === 'All' || a.tech === techFilter;
      const rOk = regionFilter === 'All' || a.region === regionFilter;
      return tOk && rOk;
    });
  }, [techFilter, regionFilter]);

  // ── Portfolio Metrics ───────────────────────────────────────────────────────
  const portfolio = useMemo(() => {
    const operating = ASSETS.filter(a => a.status === 'Operating');
    const totalCapacityMW = ASSETS.reduce((s, a) => s + a.capacityMW, 0);
    const totalCapexM = ASSETS.reduce((s, a) => s + a.totalCapexM, 0);
    const totalAnnualGWh = ASSETS.reduce((s, a) => s + a.annualGWh, 0);
    const totalRevM = ASSETS.reduce((s, a) => s + a.annualRevM, 0);
    const wacf = ASSETS.reduce((s, a) => s + a.cf * a.capacityMW, 0) / Math.max(1, totalCapacityMW);
    const wairr = ASSETS.reduce((s, a) => s + a.equityIRR * a.totalCapexM, 0) / Math.max(1, totalCapexM);
    const minDSCR = operating.length ? Math.min(...operating.map(a => a.projectDSCR)) : 0;
    const totalCO2 = ASSETS.reduce((s, a) => s + a.avoidedCO2tpy, 0);
    const techShares = TECHNOLOGIES.map(t => {
      const cap = ASSETS.filter(a => a.tech === t).reduce((s, a) => s + a.capacityMW, 0);
      return cap / Math.max(1, totalCapacityMW);
    });
    const hhiTech = techShares.reduce((s, sh) => s + sh * sh, 0);
    return { totalCapacityMW, totalCapexM, totalAnnualGWh, totalRevM, wacf, wairr, minDSCR, totalCO2, hhiTech, operatingCount: operating.length };
  }, []);

  // ─── TAB 1: Portfolio Dashboard ────────────────────────────────────────────
  const tab1Data = useMemo(() => {
    const byTech = TECHNOLOGIES.map(t => ({
      name: t, value: ASSETS.filter(a => a.tech === t).reduce((s, a) => s + a.capacityMW, 0)
    })).filter(d => d.value > 0);
    const byRegion = REGIONS.map(r => ({
      name: r.split(' ')[0], value: ASSETS.filter(a => a.region === r).reduce((s, a) => s + a.capacityMW, 0)
    })).filter(d => d.value > 0);
    const byStatus = STATUS.filter((s, i, a) => a.indexOf(s) === i).map(s => ({
      name: s, MW: ASSETS.filter(a => a.status === s).reduce((sum, a) => sum + a.capacityMW, 0)
    }));
    const hhiLabel = portfolio.hhiTech < 0.15 ? 'Well Diversified' : portfolio.hhiTech < 0.25 ? 'Moderately Concentrated' : 'Concentrated';
    const hhiColor = portfolio.hhiTech < 0.15 ? T.green : portfolio.hhiTech < 0.25 ? T.amber : T.red;
    return { byTech, byRegion, byStatus, hhiLabel, hhiColor };
  }, [portfolio.hhiTech]);

  // ─── TAB 2: Technology Mix ─────────────────────────────────────────────────
  const tab2Data = useMemo(() => {
    const techMetrics = TECHNOLOGIES.map(t => {
      const assets = ASSETS.filter(a => a.tech === t);
      if (!assets.length) return null;
      const totalMW = assets.reduce((s, a) => s + a.capacityMW, 0);
      const totalGWh = assets.reduce((s, a) => s + a.annualGWh, 0);
      const totalRev = assets.reduce((s, a) => s + a.annualRevM, 0);
      const totalCapex = assets.reduce((s, a) => s + a.totalCapexM, 0);
      const avgEbitda = assets.reduce((s, a) => s + a.ebitdaMargin, 0) / Math.max(1, assets.length);
      const avgIRR = assets.reduce((s, a) => s + a.equityIRR, 0) / Math.max(1, assets.length);
      const avgCF = assets.reduce((s, a) => s + a.cf, 0) / Math.max(1, assets.length);
      return { tech: t, count: assets.length, totalMW, totalGWh, totalRev, totalCapex, avgEbitda, avgIRR, avgCF };
    }).filter(Boolean);

    const byYear = Array.from({ length: 8 }, (_, i) => {
      const year = 2018 + i;
      const obj = { year };
      TECHNOLOGIES.forEach(t => {
        obj[t] = ASSETS.filter(a => a.tech === t && a.codYear === year).reduce((s, a) => s + a.capacityMW, 0);
      });
      return obj;
    });

    const lcoeBenchmark = [
      { tech: 'Solar PV', min: 25, max: 35, label: '$25–35' },
      { tech: 'Onshore Wind', min: 26, max: 44, label: '$26–44' },
      { tech: 'Offshore Wind', min: 60, max: 90, label: '$60–90' },
      { tech: 'Hydro', min: 30, max: 60, label: '$30–60' },
      { tech: 'Geothermal', min: 40, max: 75, label: '$40–75' },
      { tech: 'Solar+BESS', min: 45, max: 80, label: '$45–80' }
    ];
    return { techMetrics, byYear, lcoeBenchmark };
  }, []);

  // ─── TAB 3: Geographic Intelligence ───────────────────────────────────────
  const tab3Data = useMemo(() => {
    const regionMetrics = REGIONS.map((r, ri) => {
      const assets = ASSETS.filter(a => a.region === r);
      if (!assets.length) return null;
      const totalMW = assets.reduce((s, a) => s + a.capacityMW, 0);
      const totalRev = assets.reduce((s, a) => s + a.annualRevM, 0);
      const avgCF = assets.reduce((s, a) => s + a.cf, 0) / Math.max(1, assets.length);
      const regScore = (60 + sr(ri * 13) * 35).toFixed(0);
      return { region: r, assets: assets.length, totalMW, totalRev, avgCF, regScore };
    }).filter(Boolean);

    const pestleDims = ['Political', 'Economic', 'Social', 'Tech', 'Legal', 'Environmental'];
    const pestleData = REGIONS.map((r, ri) => {
      const obj = { region: r.split(' ')[0] };
      pestleDims.forEach((d, di) => { obj[d] = parseFloat((1 + sr(ri * 17 + di * 7) * 4).toFixed(1)); });
      return obj;
    });

    const heatmapDims = ['Stability', 'RE Policy', 'Grid', 'Currency', 'PPA'];
    const heatmap = REGIONS.map((r, ri) => ({
      region: r.split(' ')[0],
      scores: heatmapDims.map((d, di) => parseFloat((1 + sr(ri * 23 + di * 11) * 4).toFixed(1)))
    }));

    return { regionMetrics, pestleData, pestleDims, heatmap, heatmapDims };
  }, []);

  // ─── TAB 4: Capacity Factor Analytics ─────────────────────────────────────
  const tab4Data = useMemo(() => {
    const seasonal = MONTHS.map((m, mi) => {
      const obj = { month: m };
      ['Solar PV', 'Onshore Wind', 'Offshore Wind'].forEach(t => {
        const base = t === 'Solar PV' ? 0.18 + Math.sin((mi - 2) * Math.PI / 6) * 0.08
          : t === 'Onshore Wind' ? 0.32 + Math.sin((mi + 4) * Math.PI / 6) * 0.05
          : 0.42 + Math.sin((mi + 3) * Math.PI / 6) * 0.06;
        obj[t] = parseFloat(Math.max(0, base + sr(mi * 31 + TECHNOLOGIES.indexOf(t)) * 0.03).toFixed(3));
      });
      return obj;
    });

    const cfBenchmark = ASSETS.filter(a => a.status === 'Operating').map(a => {
      const expected = { 'Solar PV': 0.22, 'Onshore Wind': 0.33, 'Offshore Wind': 0.44, 'Solar+BESS': 0.23, 'Hydro': 0.48, 'Geothermal': 0.85 }[a.tech] || 0.30;
      return { name: a.name, actual: a.cf, expected, deviation: parseFloat((a.cf - expected).toFixed(3)), tech: a.tech };
    });

    const cfHistogram = TECHNOLOGIES.map(t => {
      const assets = ASSETS.filter(a => a.tech === t);
      const avgCF = assets.length ? assets.reduce((s, a) => s + a.cf, 0) / assets.length : 0;
      const minCF = assets.length ? Math.min(...assets.map(a => a.cf)) : 0;
      const maxCF = assets.length ? Math.max(...assets.map(a => a.cf)) : 0;
      return { tech: t, avg: avgCF, min: minCF, max: maxCF, p25: minCF + (maxCF - minCF) * 0.25, p75: minCF + (maxCF - minCF) * 0.75 };
    });

    return { seasonal, cfBenchmark, cfHistogram };
  }, []);

  // ─── TAB 5: Financial Benchmarking ─────────────────────────────────────────
  const tab5Data = useMemo(() => {
    const lcoeData = [...ASSETS].sort((a, b) => a.ppaPriceMWh - b.ppaPriceMWh).map((a, i) => ({
      rank: i + 1, name: a.name.substring(0, 12), lcoe: a.ppaPriceMWh, tech: a.tech
    }));

    const irrHistogram = Array.from({ length: 10 }, (_, i) => {
      const low = 0.08 + i * 0.012;
      const high = low + 0.012;
      const count = ASSETS.filter(a => a.equityIRR >= low && a.equityIRR < high).length;
      return { range: `${(low * 100).toFixed(1)}–${(high * 100).toFixed(1)}%`, count };
    });

    const capexByVintage = Array.from({ length: 8 }, (_, i) => {
      const year = 2018 + i;
      const assets = ASSETS.filter(a => a.codYear === year);
      const avgCapex = assets.length ? assets.reduce((s, a) => s + a.capexPerW, 0) / assets.length : 0;
      return { year, avgCapex: parseFloat(avgCapex.toFixed(2)), count: assets.length };
    });

    return { lcoeData, irrHistogram, capexByVintage };
  }, []);

  // ─── TAB 6: Correlation & Risk ─────────────────────────────────────────────
  const tab6Data = useMemo(() => {
    const corrMatrix = TECHNOLOGIES.map((t1, i) => {
      const row = { tech: t1 };
      TECHNOLOGIES.forEach((t2, j) => {
        if (i === j) row[t2] = 1.0;
        else {
          const base = i < j ? 0.3 + sr(i * 13 + j * 7) * 0.4 : 0.3 + sr(j * 13 + i * 7) * 0.4;
          row[t2] = parseFloat(base.toFixed(2));
        }
      });
      return row;
    });

    const sigma = 0.08 + sr(99) * 0.06;
    const portfolioVaR = sigma * 1.645 * portfolio.totalRevM;
    const undivSigma = 0.14 + sr(88) * 0.04;
    const divRatio = undivSigma / Math.max(0.01, sigma);

    const frontier = Array.from({ length: 20 }, (_, i) => ({
      risk: parseFloat((0.05 + sr(i * 7) * 0.12).toFixed(3)),
      return: parseFloat((0.08 + sr(i * 11) * 0.09).toFixed(3))
    }));

    const marginalRisk = TECHNOLOGIES.map((t, i) => {
      const cap = ASSETS.filter(a => a.tech === t).reduce((s, a) => s + a.capacityMW, 0);
      const share = cap / Math.max(1, portfolio.totalCapacityMW);
      return { tech: t, contribution: parseFloat((share * (1 + sr(i * 17) * 0.5)).toFixed(3)), share: parseFloat(share.toFixed(3)) };
    });

    return { corrMatrix, portfolioVaR, divRatio, sigma, undivSigma, frontier, marginalRisk };
  }, [portfolio]);

  // ─── TAB 7: Vintage & Maturity ─────────────────────────────────────────────
  const tab7Data = useMemo(() => {
    const irrByVintage = Array.from({ length: 8 }, (_, i) => {
      const year = 2018 + i;
      const assets = ASSETS.filter(a => a.codYear === year);
      const avgIRR = assets.length ? assets.reduce((s, a) => s + a.equityIRR, 0) / assets.length : 0;
      return { year, avgIRR: parseFloat((avgIRR * 100).toFixed(2)), count: assets.length };
    });

    const debtExpiry = Array.from({ length: 17 }, (_, i) => {
      const year = 2024 + i;
      const maturing = ASSETS.filter(a => {
        const debtTerm = 15 + Math.floor(sr(a.id * 61) * 5);
        return a.codYear + debtTerm === year;
      });
      return { year, MW: maturing.reduce((s, a) => s + a.capacityMW, 0), count: maturing.length };
    });

    const ppaExpiry = Array.from({ length: 12 }, (_, i) => {
      const year = 2025 + i;
      const expiring = ASSETS.filter(a => {
        const ppaTerm = 15 + Math.floor(sr(a.id * 73) * 10);
        return a.codYear + ppaTerm === year;
      });
      return { year, GWh: parseFloat(expiring.reduce((s, a) => s + a.annualGWh, 0).toFixed(0)), count: expiring.length };
    });

    return { irrByVintage, debtExpiry, ppaExpiry };
  }, []);

  // ─── TAB 8: Operational KPIs ───────────────────────────────────────────────
  const tab8Data = useMemo(() => {
    const operating = ASSETS.filter(a => a.status === 'Operating');
    const kpiTrend = MONTHS.map((m, mi) => ({
      month: m,
      availability: parseFloat((0.965 + sr(mi * 37) * 0.02).toFixed(3)),
      performanceRatio: parseFloat((0.82 + sr(mi * 41) * 0.04).toFixed(3)),
      curtailment: parseFloat((sr(mi * 43) * 0.08).toFixed(3))
    }));

    const healthScores = operating.map(a => ({
      name: a.name.substring(0, 14),
      health: parseFloat((a.availabilityPct * a.performanceRatio * 100).toFixed(1)),
      availability: parseFloat((a.availabilityPct * 100).toFixed(1)),
      pr: parseFloat((a.performanceRatio * 100).toFixed(1))
    }));

    const curtailmentByRegion = REGIONS.map((r, ri) => ({
      region: r.split(' ')[0],
      curtailmentPct: parseFloat((sr(ri * 53) * 8).toFixed(1))
    }));

    return { kpiTrend, healthScores, curtailmentByRegion };
  }, []);

  // ─── TAB 9: ESG & Carbon ──────────────────────────────────────────────────
  const tab9Data = useMemo(() => {
    const sdgData = [
      { sdg: 'SDG 7 — Clean Energy', score: 94, indicator: 'GWh Clean Generation', value: (portfolio.totalAnnualGWh / 1000).toFixed(2) + ' TWh' },
      { sdg: 'SDG 13 — Climate Action', score: 91, indicator: 'tCO₂/yr Avoided', value: (portfolio.totalCO2 / 1e6).toFixed(2) + ' MtCO₂' },
      { sdg: 'SDG 8 — Decent Work', score: 72, indicator: 'FTE Jobs Created', value: Math.round(ASSETS.length * 45).toLocaleString() },
      { sdg: 'SDG 11 — Sustainable Cities', score: 68, indicator: 'Urban RE Coverage', value: '31 cities' }
    ];

    const eByTech = TECHNOLOGIES.map((t, i) => ({
      tech: t,
      recs: ASSETS.filter(a => a.tech === t).reduce((s, a) => s + a.annualGWh, 0),
      eScore: parseFloat((70 + sr(i * 29) * 25).toFixed(0)),
      sScore: parseFloat((55 + sr(i * 31) * 30).toFixed(0)),
      gScore: parseFloat((60 + sr(i * 37) * 25).toFixed(0))
    })).map(d => ({
      ...d,
      esgScore: parseFloat((d.eScore * 0.6 + d.sScore * 0.2 + d.gScore * 0.2).toFixed(0))
    }));

    const tcfdData = [
      { category: 'Physical Risk', score: 34, trend: 'Stable', note: 'Coastal/flood exposure at 8% of portfolio' },
      { category: 'Transition Opportunity', score: 82, trend: 'Improving', note: 'Policy tailwinds in EU, APAC' },
      { category: 'Carbon Intensity', score: 91, trend: 'Improving', note: '2.1 gCO₂/kWh vs 420 grid average' },
      { category: 'Climate Governance', score: 76, trend: 'Stable', note: 'Board-level climate committee active' }
    ];

    const cumOffset = Array.from({ length: 6 }, (_, i) => ({
      year: 2025 + i * 5,
      GtCO2: parseFloat(((portfolio.totalCO2 / 1e9) * (i + 1) * 5 * 0.95).toFixed(3))
    }));

    return { sdgData, eByTech, tcfdData, cumOffset };
  }, [portfolio]);

  // ─── TAB 10: Peer Benchmarking ─────────────────────────────────────────────
  const tab10Data = useMemo(() => {
    const portGW = portfolio.totalCapacityMW / 1000;
    const portAUM = portfolio.totalCapexM / 1000;
    const portIRR = portfolio.wairr * 100;
    const portCF = portfolio.wacf * 100;
    const portDiversification = portfolio.hhiTech < 0.15 ? 'High' : portfolio.hhiTech < 0.25 ? 'Medium' : 'Low';

    const peers = [
      { fund: 'Brookfield Renewable', aum: 85, gw: 34, irr: 12.5, cf: 31, div: 'High', tech: 'All' },
      { fund: 'NextEra Energy Partners', aum: 22, gw: 6.5, irr: 11.8, cf: 29, div: 'Medium', tech: 'Solar/Wind' },
      { fund: 'Ørsted', aum: 48, gw: 15, irr: 10.2, cf: 38, div: 'Medium', tech: 'Offshore Wind' },
      { fund: 'Macquarie GIG', aum: 30, gw: 9, irr: 13.1, cf: 28, div: 'High', tech: 'All' },
      { fund: 'Copenhagen Infrastructure', aum: 19, gw: 7, irr: 11.5, cf: 35, div: 'Medium', tech: 'Wind' },
      { fund: 'This Portfolio', aum: parseFloat(portAUM.toFixed(1)), gw: parseFloat(portGW.toFixed(2)), irr: parseFloat(portIRR.toFixed(1)), cf: parseFloat(portCF.toFixed(1)), div: portDiversification, tech: 'All' }
    ];

    const radarData = ['IRR Rank', 'CF Rank', 'AUM Rank', 'GW Rank', 'Diversification'].map(dim => {
      const obj = { dim };
      peers.forEach(p => { obj[p.fund.split(' ')[0]] = parseFloat((50 + sr(peers.indexOf(p) * 7 + ['IRR','CF','AUM','GW','Div'].indexOf(dim.split(' ')[0])) * 50).toFixed(0)); });
      return obj;
    });

    return { peers, radarData };
  }, [portfolio]);

  // ─── Render Helpers ────────────────────────────────────────────────────────
  // ─── What-If Calculator State ──────────────────────────────────────────────
  const [whatIfCF, setWhatIfCF] = useState(0);
  const [whatIfPPA, setWhatIfPPA] = useState(0);
  const [whatIfCapex, setWhatIfCapex] = useState(0);

  const whatIfResult = useMemo(() => {
    const adjGWh = portfolio.totalAnnualGWh * (1 + whatIfCF / 100);
    const adjRevM = adjGWh * 1000 * (portfolio.totalRevM / Math.max(1, portfolio.totalAnnualGWh) / 1000) * (1 + whatIfPPA / 100);
    const adjCapex = portfolio.totalCapexM * (1 + whatIfCapex / 100);
    const adjIRR = portfolio.wairr + (whatIfPPA / 100) * 0.4 + (whatIfCF / 100) * 0.3 - (whatIfCapex / 100) * 0.25;
    return { adjGWh, adjRevM, adjCapex, adjIRR };
  }, [whatIfCF, whatIfPPA, whatIfCapex, portfolio]);

  const renderTab1 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
        <KpiCard label="Total Capacity" value={`${(portfolio.totalCapacityMW / 1000).toFixed(2)} GW`} sub={`${ASSETS.length} assets`} color={T.indigo} />
        <KpiCard label="Total AUM" value={`$${(portfolio.totalCapexM / 1000).toFixed(1)}B`} sub="CAPEX basis" color={T.accent} />
        <KpiCard label="Total Assets" value={ASSETS.length} sub={`${portfolio.operatingCount} operating`} color={T.blue} />
        <KpiCard label="Annual Generation" value={`${(portfolio.totalAnnualGWh / 1000).toFixed(2)} TWh`} sub="Gross production" color={T.green} />
        <KpiCard label="Portfolio WACF" value={`${(portfolio.wacf * 100).toFixed(1)}%`} sub="Weighted avg capacity factor" color={T.teal} />
        <KpiCard label="Portfolio WAIRR" value={`${(portfolio.wairr * 100).toFixed(1)}%`} sub="Weighted avg equity IRR" color={T.accent} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <KpiCard label="Avoided CO₂" value={`${(portfolio.totalCO2 / 1e6).toFixed(2)} MtCO₂/yr`} sub="vs grid baseline 0.42 tCO₂/MWh" color={T.green} />
        <KpiCard label="Min Portfolio DSCR" value={portfolio.minDSCR.toFixed(2)} sub="Debt service coverage ratio" color={portfolio.minDSCR > 1.25 ? T.green : T.red} />
        <KpiCard label="Operating Assets" value={portfolio.operatingCount} sub={`${((portfolio.operatingCount / ASSETS.length) * 100).toFixed(0)}% of portfolio`} color={T.blue} />
        <KpiCard label="YTD vs Budget" value={`+${(2.3 + sr(77) * 4).toFixed(1)}%`} sub="Generation outperformance" color={T.green} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <ChartCard title="Technology Mix (MW)">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={tab1Data.byTech} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {tab1Data.byTech.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => [`${v.toFixed(0)} MW`]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Geographic Breakdown (MW)">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={tab1Data.byRegion} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {tab1Data.byRegion.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => [`${v.toFixed(0)} MW`]} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Status Pipeline (MW)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tab1Data.byStatus} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={v => [`${v.toFixed(0)} MW`]} />
              <Bar dataKey="MW" fill={T.indigo} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartCard title="Concentration Risk (HHI)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: tab1Data.hhiColor }}>{portfolio.hhiTech.toFixed(3)}</div>
              <div style={{ fontSize: 13, color: tab1Data.hhiColor, fontWeight: 600 }}>{tab1Data.hhiLabel}</div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Herfindahl-Hirschman Index</div>
            </div>
            <div style={{ flex: 1, fontSize: 12, color: T.sub }}>
              <div style={{ padding: '6px 0', borderBottom: `1px solid ${T.border}` }}><span style={{ color: T.green, fontWeight: 600 }}>Below 0.15</span> — Well Diversified</div>
              <div style={{ padding: '6px 0', borderBottom: `1px solid ${T.border}` }}><span style={{ color: T.amber, fontWeight: 600 }}>0.15–0.25</span> — Moderate Concentration</div>
              <div style={{ padding: '6px 0' }}><span style={{ color: T.red, fontWeight: 600 }}>Above 0.25</span> — Concentrated Risk</div>
            </div>
          </div>
        </ChartCard>
        <ChartCard title="World Bank Renewable Electricity %">
          {wbLoading ? (
            <div style={{ textAlign: 'center', color: T.sub, padding: 40 }}>Loading World Bank data...</div>
          ) : wbData && wbData.length ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F3F4F6' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', color: T.sub }}>Country</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', color: T.sub }}>Renewable %</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', color: T.sub }}>Year</th>
                  </tr>
                </thead>
                <tbody>
                  {wbData.map((d, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 10px', color: T.text }}>{d.country?.value || d.countryiso3code}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: d.value > 50 ? T.green : T.text, fontWeight: d.value > 50 ? 600 : 400 }}>{d.value?.toFixed(1)}%</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: T.sub }}>{d.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: T.sub, padding: 20 }}>Using seed data — World Bank API unavailable</div>
          )}
        </ChartCard>
      </div>

      {/* What-If Calculator */}
      <ChartCard title="Portfolio What-If Calculator">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}>Capacity Factor Shock (%)</div>
            <input type="range" min={-20} max={20} value={whatIfCF} onChange={e => setWhatIfCF(Number(e.target.value))} style={{ width: '100%' }} />
            <div style={{ fontSize: 12, fontWeight: 600, color: whatIfCF >= 0 ? T.green : T.red, textAlign: 'center' }}>{whatIfCF >= 0 ? '+' : ''}{whatIfCF}%</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}>PPA Price Change (%)</div>
            <input type="range" min={-30} max={30} value={whatIfPPA} onChange={e => setWhatIfPPA(Number(e.target.value))} style={{ width: '100%' }} />
            <div style={{ fontSize: 12, fontWeight: 600, color: whatIfPPA >= 0 ? T.green : T.red, textAlign: 'center' }}>{whatIfPPA >= 0 ? '+' : ''}{whatIfPPA}%</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}>CAPEX Overrun (%)</div>
            <input type="range" min={0} max={30} value={whatIfCapex} onChange={e => setWhatIfCapex(Number(e.target.value))} style={{ width: '100%' }} />
            <div style={{ fontSize: 12, fontWeight: 600, color: whatIfCapex > 0 ? T.red : T.green, textAlign: 'center' }}>{whatIfCapex > 0 ? '+' : ''}{whatIfCapex}%</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: '#F3F4F6', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: T.sub }}>Adj. Generation</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{(whatIfResult.adjGWh / 1000).toFixed(2)} TWh</div>
            </div>
            <div style={{ background: '#F3F4F6', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: T.sub }}>Adj. Revenue</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>${whatIfResult.adjRevM.toFixed(0)}M</div>
            </div>
            <div style={{ background: '#F3F4F6', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: T.sub }}>Adj. CAPEX</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>${(whatIfResult.adjCapex / 1000).toFixed(1)}B</div>
            </div>
            <div style={{ background: '#F3F4F6', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: T.sub }}>Adj. IRR</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: whatIfResult.adjIRR > portfolio.wairr ? T.green : T.red }}>{(whatIfResult.adjIRR * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Full Asset Table */}
      <ChartCard title="Full Portfolio Asset Register">
        <DataTable
          headers={['ID', 'Asset Name', 'Technology', 'Region', 'Status', 'MW', 'Ann. GWh', 'CF', 'PPA $/MWh', 'Rev $M', 'IRR', 'DSCR']}
          rows={ASSETS.slice(0, 20).map(a => [
            a.id, a.name.substring(0, 18), a.tech, a.region.split(' ')[0], a.status,
            a.capacityMW, a.annualGWh.toFixed(0),
            `${(a.cf * 100).toFixed(1)}%`,
            `$${a.ppaPriceMWh.toFixed(1)}`,
            `$${a.annualRevM.toFixed(1)}M`,
            `${(a.equityIRR * 100).toFixed(1)}%`,
            <span key={a.id} style={{ color: a.projectDSCR >= 1.3 ? T.green : a.projectDSCR >= 1.2 ? T.amber : T.red, fontWeight: 600 }}>{a.projectDSCR.toFixed(2)}</span>
          ])}
        />
        <div style={{ fontSize: 11, color: T.sub, marginTop: 8 }}>Showing 20 of {ASSETS.length} assets · Sort by IRR, DSCR, or MW in full view</div>
      </ChartCard>

      {/* Methodology Callout */}
      <div style={{ background: '#EFF6FF', border: `1px solid #BFDBFE`, borderRadius: 8, padding: '14px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 20 }}>ℹ</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.blue, marginBottom: 4 }}>Methodology — Portfolio Metrics</div>
          <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7 }}>
            WACF (Weighted Average Capacity Factor) is capacity-weighted across all 50 assets. WAIRR (Weighted Average IRR) is CAPEX-weighted.
            Avoided CO₂ uses a marginal grid emission factor of 0.42 tCO₂/MWh per IEA 2023. DSCR is calculated as EBITDA / Debt Service using 15–20yr project finance tenors.
            HHI measures technology concentration: sum of squared technology market shares by installed MW.
            What-If scenarios apply linear sensitivities — actual non-linear effects are modelled in full scenario engine.
          </div>
        </div>
      </div>
    </div>
  );

  const renderTab2 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['All', ...TECHNOLOGIES].map(t => <FilterButton key={t} label={t} active={techFilter === t} onClick={() => setTechFilter(t)} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartCard title="Capacity (MW) by Technology">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tab2Data.techMetrics} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="tech" tick={{ fontSize: 10 }} width={90} />
              <Tooltip formatter={v => [`${v.toFixed(0)} MW`]} />
              <Bar dataKey="totalMW" fill={T.indigo} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Annual Revenue ($M) by Technology">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tab2Data.techMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="tech" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`$${v.toFixed(1)}M`]} />
              <Bar dataKey="totalRev" fill={T.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard title="Technology Metrics Summary">
        <DataTable
          headers={['Technology', 'Count', 'MW', 'GWh/yr', 'Revenue $M', 'CAPEX $M', 'EBITDA %', 'Avg IRR', 'Avg CF']}
          rows={tab2Data.techMetrics.map(t => [
            t.tech, t.count, t.totalMW.toFixed(0),
            t.totalGWh.toFixed(0), `$${t.totalRev.toFixed(1)}M`,
            `$${t.totalCapex.toFixed(0)}M`, `${(t.avgEbitda * 100).toFixed(1)}%`,
            `${(t.avgIRR * 100).toFixed(1)}%`, `${(t.avgCF * 100).toFixed(1)}%`
          ])}
        />
      </ChartCard>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartCard title="Technology Additions by Year (MW)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tab2Data.byYear}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {TECHNOLOGIES.map((t, i) => <Bar key={t} dataKey={t} stackId="a" fill={CHART_COLORS[i]} />)}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="LCOE Benchmark vs Portfolio PPA ($/MWh)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tab2Data.lcoeBenchmark.map(l => {
              const techAssets = ASSETS.filter(a => a.tech === l.tech);
              const avgPPA = techAssets.length ? techAssets.reduce((s, a) => s + a.ppaPriceMWh, 0) / techAssets.length : 0;
              return { ...l, avgPPA: parseFloat(avgPPA.toFixed(1)), midBenchmark: (l.min + l.max) / 2 };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="tech" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="min" name="IRENA Low" fill="#D1FAE5" />
              <Bar dataKey="max" name="IRENA High" fill="#A7F3D0" />
              <Bar dataKey="avgPPA" name="Portfolio Avg PPA" fill={T.accent} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* IRR by Technology Detail */}
      <ChartCard title="Average Equity IRR by Technology">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={tab2Data.techMetrics}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="tech" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
            <Tooltip formatter={v => [`${(v * 100).toFixed(1)}%`, 'Avg Equity IRR']} />
            <Bar dataKey="avgIRR" name="Avg Equity IRR" fill={T.indigo} radius={[4, 4, 0, 0]}>
              {tab2Data.techMetrics.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Technology Target Allocation */}
      <ChartCard title="Target vs Actual Allocation — Technology Mix Strategy">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {TECHNOLOGIES.map((t, i) => {
            const actual = ASSETS.filter(a => a.tech === t).reduce((s, a) => s + a.capacityMW, 0) / Math.max(1, portfolio.totalCapacityMW) * 100;
            const target = [25, 20, 20, 10, 15, 10][i]; // Strategic targets
            const diff = actual - target;
            return (
              <div key={t} style={{ background: '#F3F4F6', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: T.sub, marginBottom: 6 }}>{t}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: CHART_COLORS[i] }}>{actual.toFixed(1)}%</div>
                <div style={{ fontSize: 10, color: T.sub }}>Target: {target}%</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: Math.abs(diff) < 5 ? T.green : diff > 0 ? T.amber : T.red, marginTop: 4 }}>
                  {diff >= 0 ? '+' : ''}{diff.toFixed(1)}% vs target
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );

  const renderTab3 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['All', ...REGIONS].map(r => <FilterButton key={r} label={r.split(' ')[0]} active={regionFilter === (r === 'All' ? 'All' : r)} onClick={() => setRegionFilter(r === 'All' ? 'All' : r)} />)}
      </div>
      <ChartCard title="Regional Portfolio Summary">
        <DataTable
          headers={['Region', 'Assets', 'Capacity MW', 'Revenue $M/yr', 'Avg CF', 'Reg. Score']}
          rows={tab3Data.regionMetrics.map(r => [
            r.region, r.assets, r.totalMW.toFixed(0),
            `$${r.totalRev.toFixed(1)}M`,
            `${(r.avgCF * 100).toFixed(1)}%`,
            <span key={r.region} style={{ color: Number(r.regScore) > 75 ? T.green : Number(r.regScore) > 50 ? T.amber : T.red, fontWeight: 600 }}>{r.regScore}/100</span>
          ])}
        />
      </ChartCard>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartCard title="Country Regulatory Heatmap">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#F3F4F6' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', color: T.sub }}>Region</th>
                  {tab3Data.heatmapDims.map(d => <th key={d} style={{ padding: '6px 8px', textAlign: 'center', color: T.sub }}>{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {tab3Data.heatmap.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 8px', color: T.text, fontWeight: 600 }}>{row.region}</td>
                    {row.scores.map((s, si) => {
                      const bg = s >= 4 ? '#D1FAE5' : s >= 3 ? '#FEF3C7' : '#FEE2E2';
                      const col = s >= 4 ? T.green : s >= 3 ? T.amber : T.red;
                      return <td key={si} style={{ padding: '6px 8px', textAlign: 'center', background: bg, color: col, fontWeight: 600 }}>{s.toFixed(1)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
        <ChartCard title="PESTLE Risk Scores by Region">
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={tab3Data.pestleData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="region" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 9 }} />
              {tab3Data.pestleDims.map((d, i) => <Radar key={d} name={d} dataKey={d} stroke={CHART_COLORS[i]} fill={CHART_COLORS[i]} fillOpacity={0.1} />)}
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard title="Capacity by Region (MW)">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={tab3Data.regionMetrics}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="region" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => [`${v.toFixed(0)} MW`]} />
            <Bar dataKey="totalMW" fill={T.indigo} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Cross-border diversification */}
      <ChartCard title="Cross-Border Diversification — Weather Return Correlation Matrix">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#F3F4F6' }}>
                <th style={{ padding: '5px 8px', textAlign: 'left', color: T.sub }}>Region</th>
                {REGIONS.map(r => <th key={r} style={{ padding: '5px 6px', textAlign: 'center', color: T.sub, fontSize: 9 }}>{r.split(' ')[0]}</th>)}
              </tr>
            </thead>
            <tbody>
              {REGIONS.map((r1, ri) => (
                <tr key={ri} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '5px 8px', color: T.text, fontWeight: 600, fontSize: 10 }}>{r1.split(' ')[0]}</td>
                  {REGIONS.map((r2, ci) => {
                    const corr = ri === ci ? 1.0 : parseFloat((0.05 + sr(ri * 19 + ci * 11) * 0.35).toFixed(2));
                    const bg = ri === ci ? '#E0E7FF' : corr < 0.15 ? '#D1FAE5' : corr < 0.25 ? '#FEF3C7' : '#FEE2E2';
                    return <td key={ci} style={{ padding: '5px 6px', textAlign: 'center', background: bg, fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{corr.toFixed(2)}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 11, color: T.sub, marginTop: 8 }}>Lower correlation = greater weather diversification benefit. Green {'<'} 0.15, Yellow 0.15–0.25, Red {'>'} 0.25.</div>
        </div>
      </ChartCard>

      {/* Revenue by Region */}
      <ChartCard title="Revenue ($M/yr) by Region">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={tab3Data.regionMetrics}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="region" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v.toFixed(0)}M`} />
            <Tooltip formatter={v => [`$${v.toFixed(1)}M`, 'Annual Revenue']} />
            <Bar dataKey="totalRev" fill={T.accent} radius={[4, 4, 0, 0]}>
              {tab3Data.regionMetrics.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );

  const renderTab4 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartCard title="Seasonal CF Pattern (Solar/Wind)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={tab4Data.seasonal}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
              <Tooltip formatter={v => [`${(v * 100).toFixed(1)}%`]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="Solar PV" stroke={T.accent} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Onshore Wind" stroke={T.indigo} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Offshore Wind" stroke={T.teal} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="CF Range by Technology (P25/Avg/P75)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tab4Data.cfHistogram} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="tech" tick={{ fontSize: 10 }} width={90} />
              <Tooltip formatter={v => [`${(v * 100).toFixed(1)}%`]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="p25" name="P25" fill="#93C5FD" stackId="none" />
              <Bar dataKey="avg" name="Avg" fill={T.indigo} stackId="none" />
              <Bar dataKey="p75" name="P75" fill="#1E3A8A" stackId="none" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard title="CF vs Expected — Operating Asset Deviation">
        <DataTable
          headers={['Asset', 'Technology', 'Actual CF', 'Expected CF', 'Deviation', 'Status']}
          rows={[...tab4Data.cfBenchmark].sort((a, b) => a.deviation - b.deviation).slice(0, 15).map(a => [
            a.name.substring(0, 16), a.tech,
            `${(a.actual * 100).toFixed(1)}%`, `${(a.expected * 100).toFixed(1)}%`,
            <span key={a.name} style={{ color: a.deviation >= 0 ? T.green : T.red, fontWeight: 600 }}>{a.deviation >= 0 ? '+' : ''}{(a.deviation * 100).toFixed(1)}%</span>,
            <span key={`s-${a.name}`} style={{ color: a.deviation >= 0 ? T.green : T.red }}>{a.deviation >= 0 ? 'Outperforming' : 'Underperforming'}</span>
          ])}
        />
      </ChartCard>
      <ChartCard title="CF Scatter: Actual vs Expected by Technology">
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="expected" name="Expected CF" tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} label={{ value: 'Expected CF', position: 'insideBottom', offset: -5, fontSize: 11 }} />
            <YAxis dataKey="actual" name="Actual CF" tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => [`${(v * 100).toFixed(1)}%`]} />
            <Scatter data={tab4Data.cfBenchmark} fill={T.indigo} opacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* P50/P75/P90 Analysis */}
      <ChartCard title="P50 / P75 / P90 Generation Exceedance Analysis by Technology">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {TECHNOLOGIES.map((t, i) => {
            const assets = ASSETS.filter(a => a.tech === t);
            if (!assets.length) return null;
            const sorted = [...assets.map(a => a.annualGWh)].sort((a, b) => b - a);
            const p50idx = Math.floor(sorted.length * 0.5);
            const p75idx = Math.floor(sorted.length * 0.75);
            const p90idx = Math.floor(sorted.length * 0.90);
            const p50 = sorted[p50idx] || sorted[sorted.length - 1];
            const p75 = sorted[p75idx] || sorted[sorted.length - 1];
            const p90 = sorted[p90idx] || sorted[sorted.length - 1];
            return (
              <div key={t} style={{ background: '#F8FAFC', border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: T.sub, marginBottom: 8, fontWeight: 600 }}>{t}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: T.green, fontWeight: 600 }}>P50</span>
                    <span style={{ color: T.text }}>{p50.toFixed(0)} GWh</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: T.amber, fontWeight: 600 }}>P75</span>
                    <span style={{ color: T.text }}>{p75.toFixed(0)} GWh</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: T.red, fontWeight: 600 }}>P90</span>
                    <span style={{ color: T.text }}>{p90.toFixed(0)} GWh</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ChartCard>

      {/* Degradation Analysis */}
      <ChartCard title="Asset Degradation Analysis — CF vs Operating Age">
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="age" name="Operating Age (yrs)" tick={{ fontSize: 11 }} label={{ value: 'Operating Age (yrs)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
            <YAxis dataKey="cf" name="Capacity Factor" tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} label={{ value: 'CF', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip formatter={(v, name) => [name === 'Operating Age (yrs)' ? `${v} yrs` : `${(v * 100).toFixed(1)}%`, name]} />
            <Scatter
              data={ASSETS.filter(a => a.status === 'Operating').map(a => ({ age: 2026 - a.codYear, cf: a.cf, tech: a.tech }))}
              fill={T.teal} opacity={0.65}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );

  const renderTab5 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartCard title="PPA Price Distribution — Sorted Low to High ($/MWh)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tab5Data.lcoeData.slice(0, 25)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="rank" tick={{ fontSize: 9 }} label={{ value: 'Asset Rank', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: '$/MWh', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip formatter={v => [`$${v.toFixed(1)}/MWh`]} labelFormatter={l => `Asset Rank #${l}`} />
              <Bar dataKey="lcoe" fill={T.indigo} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Equity IRR Distribution">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tab5Data.irrHistogram}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="range" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: '# Assets', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill={T.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard title="CAPEX Intensity ($/W) by COD Year — Cost Deflation Trend">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={tab5Data.capexByVintage}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v.toFixed(2)}/W`} />
            <Tooltip formatter={v => [`$${v.toFixed(2)}/W`]} />
            <Line type="monotone" dataKey="avgCapex" stroke={T.indigo} strokeWidth={2} dot={{ r: 5, fill: T.indigo }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartCard title="EBITDA Margin by Technology">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tab2Data.techMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="tech" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
              <Tooltip formatter={v => [`${(v * 100).toFixed(1)}%`]} />
              <Bar dataKey="avgEbitda" fill={T.green} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Revenue per Asset ($/MWh vs MW)">
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="capacityMW" name="MW" tick={{ fontSize: 11 }} label={{ value: 'Capacity (MW)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis dataKey="ppaPriceMWh" name="$/MWh" tick={{ fontSize: 11 }} label={{ value: '$/MWh', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip formatter={(v, name) => [name === 'MW' ? `${v} MW` : `$${v}/MWh`, name]} />
              <Scatter data={ASSETS} fill={T.teal} opacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Financial Summary by Asset — Full Register */}
      <ChartCard title="Top Assets by IRR — Financial Performance Register">
        <DataTable
          headers={['Asset', 'Technology', 'Status', 'CAPEX $M', '$/W', 'PPA $/MWh', 'Revenue $M', 'EBITDA %', 'IRR', 'DSCR']}
          rows={[...ASSETS].sort((a, b) => b.equityIRR - a.equityIRR).slice(0, 15).map(a => [
            a.name.substring(0, 16), a.tech, a.status,
            `$${a.totalCapexM.toFixed(0)}M`,
            `$${a.capexPerW.toFixed(2)}/W`,
            `$${a.ppaPriceMWh.toFixed(1)}`,
            `$${a.annualRevM.toFixed(1)}M`,
            `${(a.ebitdaMargin * 100).toFixed(1)}%`,
            <span key={a.id} style={{ color: a.equityIRR >= 0.13 ? T.green : a.equityIRR >= 0.11 ? T.text : T.red, fontWeight: 600 }}>{(a.equityIRR * 100).toFixed(1)}%</span>,
            <span key={`dscr-${a.id}`} style={{ color: a.projectDSCR >= 1.3 ? T.green : a.projectDSCR >= 1.2 ? T.amber : T.red, fontWeight: 600 }}>{a.projectDSCR.toFixed(2)}x</span>
          ])}
        />
      </ChartCard>

      {/* Debt Structure Analysis */}
      <ChartCard title="Debt Structure Summary">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {[
            { label: 'Total Debt', value: `$${(ASSETS.reduce((s, a) => s + a.totalCapexM * a.debtPct, 0) / 1000).toFixed(1)}B` },
            { label: 'Avg Debt %', value: `${(ASSETS.reduce((s, a) => s + a.debtPct, 0) / ASSETS.length * 100).toFixed(1)}%` },
            { label: 'Total Equity', value: `$${(ASSETS.reduce((s, a) => s + a.totalCapexM * (1 - a.debtPct), 0) / 1000).toFixed(1)}B` },
            { label: 'Avg DSCR', value: `${(ASSETS.filter(a => a.status === 'Operating').reduce((s, a) => s + a.projectDSCR, 0) / Math.max(1, ASSETS.filter(a => a.status === 'Operating').length)).toFixed(2)}x` },
            { label: 'Assets w/ DSCR < 1.25', value: ASSETS.filter(a => a.status === 'Operating' && a.projectDSCR < 1.25).length }
          ].map((item, i) => (
            <div key={i} style={{ background: '#F3F4F6', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: T.sub, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{item.value}</div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );

  const renderTab6 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <KpiCard label="Portfolio σ (Volatility)" value={`${(tab6Data.sigma * 100).toFixed(1)}%`} sub="Weighted return vol" color={T.blue} />
        <KpiCard label="VaR (95%, Annual)" value={`$${tab6Data.portfolioVaR.toFixed(1)}M`} sub="σ × 1.645 × Revenue" color={T.red} />
        <KpiCard label="Diversification Ratio" value={tab6Data.divRatio.toFixed(2)}x sub="Undiversified σ / Portfolio σ" color={T.green} />
        <KpiCard label="HHI (Tech Concentration)" value={portfolio.hhiTech.toFixed(3)} sub={portfolio.hhiTech < 0.15 ? 'Well diversified' : 'Monitor'} color={portfolio.hhiTech < 0.15 ? T.green : T.amber} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartCard title="Technology Return Correlation Matrix">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#F3F4F6' }}>
                  <th style={{ padding: '5px 8px', textAlign: 'left', color: T.sub, fontSize: 10 }}>Tech</th>
                  {TECHNOLOGIES.map(t => <th key={t} style={{ padding: '5px 6px', textAlign: 'center', color: T.sub, fontSize: 9 }}>{t.split(' ')[0]}</th>)}
                </tr>
              </thead>
              <tbody>
                {tab6Data.corrMatrix.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '5px 8px', color: T.text, fontWeight: 600, fontSize: 10 }}>{row.tech.split(' ')[0]}</td>
                    {TECHNOLOGIES.map((t, ci) => {
                      const val = row[t];
                      const intensity = Math.abs(val);
                      const bg = val === 1 ? '#E0E7FF' : val > 0.7 ? '#FEE2E2' : val > 0.5 ? '#FEF3C7' : '#D1FAE5';
                      return <td key={ci} style={{ padding: '5px 6px', textAlign: 'center', background: bg, fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{val.toFixed(2)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
        <ChartCard title="Efficient Frontier (Simulated Portfolios)">
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="risk" name="Risk (σ)" tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} label={{ value: 'Portfolio Risk (σ)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis dataKey="return" name="Return" tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} label={{ value: 'Return', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip formatter={(v, name) => [`${(v * 100).toFixed(1)}%`, name]} />
              <Scatter data={tab6Data.frontier} fill={T.indigo} opacity={0.7} />
              <Scatter data={[{ risk: tab6Data.sigma, return: portfolio.wairr }]} fill={T.accent} name="This Portfolio" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard title="Marginal Risk Contribution by Technology">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={tab6Data.marginalRisk}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="tech" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
            <Tooltip formatter={v => [`${(v * 100).toFixed(1)}%`]} />
            <Bar dataKey="contribution" name="Marginal Risk %" fill={T.red} radius={[4, 4, 0, 0]} />
            <Bar dataKey="share" name="Capital Share %" fill={T.indigo} radius={[4, 4, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Stress Scenarios */}
      <ChartCard title="Portfolio Stress Test Scenarios — Revenue Impact">
        <DataTable
          headers={['Scenario', 'CF Shock', 'PPA Shock', 'Revenue Impact', 'VaR Change', 'DSCR Impact', 'Severity']}
          rows={[
            ['Base Case', '—', '—', `$${portfolio.totalRevM.toFixed(0)}M`, `$${tab6Data.portfolioVaR.toFixed(1)}M`, `${portfolio.minDSCR.toFixed(2)}x`, <span key="base" style={{ color: T.green }}>Normal</span>],
            ['Mild Wind Year (P75)', '-8%', '—', `$${(portfolio.totalRevM * 0.92).toFixed(0)}M`, `$${(tab6Data.portfolioVaR * 1.08).toFixed(1)}M`, `${(portfolio.minDSCR * 0.96).toFixed(2)}x`, <span key="mild" style={{ color: T.amber }}>Mild</span>],
            ['PPA Renegotiation', '—', '-15%', `$${(portfolio.totalRevM * 0.85).toFixed(0)}M`, `$${(tab6Data.portfolioVaR * 1.15).toFixed(1)}M`, `${(portfolio.minDSCR * 0.91).toFixed(2)}x`, <span key="ppa" style={{ color: T.amber }}>Moderate</span>],
            ['Severe Drought (Hydro)', '-25%', '—', `$${(portfolio.totalRevM * 0.88).toFixed(0)}M`, `$${(tab6Data.portfolioVaR * 1.25).toFixed(1)}M`, `${(portfolio.minDSCR * 0.88).toFixed(2)}x`, <span key="drought" style={{ color: T.red }}>Severe</span>],
            ['Curtailment Surge', '-12%', '—', `$${(portfolio.totalRevM * 0.88).toFixed(0)}M`, `$${(tab6Data.portfolioVaR * 1.18).toFixed(1)}M`, `${(portfolio.minDSCR * 0.90).toFixed(2)}x`, <span key="curt" style={{ color: T.amber }}>Moderate</span>],
            ['Policy Reversal', '-5%', '-20%', `$${(portfolio.totalRevM * 0.76).toFixed(0)}M`, `$${(tab6Data.portfolioVaR * 1.35).toFixed(1)}M`, `${(portfolio.minDSCR * 0.82).toFixed(2)}x`, <span key="policy" style={{ color: T.red }}>Extreme</span>]
          ]}
        />
      </ChartCard>

      {/* Concentration Metrics Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <KpiCard label="Top-5 Concentration" value={`${(ASSETS.slice().sort((a, b) => b.capacityMW - a.capacityMW).slice(0, 5).reduce((s, a) => s + a.capacityMW, 0) / portfolio.totalCapacityMW * 100).toFixed(1)}%`} sub="Top-5 assets by MW" color={T.amber} />
        <KpiCard label="Single-Asset Max %" value={`${(Math.max(...ASSETS.map(a => a.capacityMW)) / portfolio.totalCapacityMW * 100).toFixed(1)}%`} sub="Largest single asset" color={T.blue} />
        <KpiCard label="Diversification Benefit" value={`$${((tab6Data.divRatio - 1) * tab6Data.portfolioVaR).toFixed(0)}M`} sub="Capital saved vs undiversified" color={T.green} />
        <KpiCard label="Region Count" value={REGIONS.length} sub="Geographic spread" color={T.teal} />
      </div>
    </div>
  );

  const renderTab7 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartCard title="IRR by COD Vintage Year">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tab7Data.irrByVintage}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={v => [`${v.toFixed(2)}%`, 'Avg Equity IRR']} />
              <Bar dataKey="avgIRR" fill={T.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="CAPEX per W by Vintage (Cost Deflation)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={tab5Data.capexByVintage}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v.toFixed(1)}/W`} domain={['auto', 'auto']} />
              <Tooltip formatter={v => [`$${v.toFixed(2)}/W`]} />
              <Line type="monotone" dataKey="avgCapex" stroke={T.blue} strokeWidth={2} dot={{ r: 4, fill: T.blue }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartCard title="Debt Maturity Waterfall (2024–2040)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tab7Data.debtExpiry}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: 'MW', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip formatter={(v, n) => [n === 'MW' ? `${v.toFixed(0)} MW` : `${v} assets`, n]} />
              <Bar dataKey="MW" fill={T.red} radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="PPA Re-Contracting Risk (GWh Going Merchant)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tab7Data.ppaExpiry}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: 'GWh', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip formatter={v => [`${v.toFixed(0)} GWh`, 'Merchant exposure']} />
              <Bar dataKey="GWh" fill={T.amber} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard title="Asset Age & Maturity Analysis">
        <DataTable
          headers={['Asset', 'COD Year', 'Age (yrs)', 'Technology', 'Status', 'DSCR', 'Life Extension Risk']}
          rows={[...ASSETS].sort((a, b) => a.codYear - b.codYear).slice(0, 15).map(a => {
            const age = 2026 - a.codYear;
            const lifeRisk = age >= 20 ? 'High' : age >= 15 ? 'Monitor' : 'Low';
            const lifeColor = age >= 20 ? T.red : age >= 15 ? T.amber : T.green;
            return [
              a.name.substring(0, 16), a.codYear, age, a.tech, a.status,
              a.projectDSCR.toFixed(2),
              <span key={a.id} style={{ color: lifeColor, fontWeight: 600 }}>{lifeRisk}</span>
            ];
          })}
        />
      </ChartCard>

      {/* Age Distribution */}
      <ChartCard title="Portfolio Age Distribution — Asset Count by Operating Year">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={Array.from({ length: 8 }, (_, i) => {
            const year = 2018 + i;
            return { year, count: ASSETS.filter(a => a.codYear === year).length, MW: ASSETS.filter(a => a.codYear === year).reduce((s, a) => s + a.capacityMW, 0) };
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar yAxisId="left" dataKey="count" name="Asset Count" fill={T.indigo} radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="MW" name="MW Online" fill={T.teal} radius={[4, 4, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Cohort Performance */}
      <ChartCard title="Cohort Performance vs Underwriting — P50 Actual vs Modeled">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[2018, 2019, 2020, 2021].map((year, i) => {
            const cohort = ASSETS.filter(a => a.codYear === year && a.status === 'Operating');
            const avgActualCF = cohort.length ? cohort.reduce((s, a) => s + a.cf, 0) / cohort.length : 0;
            const modeledCF = avgActualCF * (0.95 + sr(i * 23) * 0.08);
            const outperf = ((avgActualCF - modeledCF) / Math.max(0.001, modeledCF) * 100);
            return (
              <div key={year} style={{ background: '#F8FAFC', border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>Vintage {year}</div>
                <div style={{ fontSize: 11, color: T.text }}>Actual CF: <strong>{(avgActualCF * 100).toFixed(1)}%</strong></div>
                <div style={{ fontSize: 11, color: T.text }}>Modeled P50: <strong>{(modeledCF * 100).toFixed(1)}%</strong></div>
                <div style={{ fontSize: 12, fontWeight: 700, color: outperf >= 0 ? T.green : T.red, marginTop: 6 }}>
                  {outperf >= 0 ? '+' : ''}{outperf.toFixed(1)}% vs P50
                </div>
                <div style={{ fontSize: 10, color: T.sub }}>{cohort.length} assets in cohort</div>
              </div>
            );
          })}
        </div>
      </ChartCard>
    </div>
  );

  const renderTab8 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <KpiCard label="Avg Portfolio Availability" value={`${(ASSETS.filter(a => a.status === 'Operating').reduce((s, a) => s + a.availabilityPct, 0) / Math.max(1, ASSETS.filter(a => a.status === 'Operating').length) * 100).toFixed(1)}%`} sub="Target: 96–99%" color={T.green} />
        <KpiCard label="Avg Performance Ratio" value={`${(ASSETS.filter(a => a.status === 'Operating').reduce((s, a) => s + a.performanceRatio, 0) / Math.max(1, ASSETS.filter(a => a.status === 'Operating').length) * 100).toFixed(1)}%`} sub="IEC 61724 benchmark" color={T.blue} />
        <KpiCard label="Curtailment (Avg)" value={`${(sr(42) * 6).toFixed(1)}%`} sub="Grid curtailment rate" color={T.amber} />
        <KpiCard label="Assets Below Target" value={ASSETS.filter(a => a.status === 'Operating' && a.availabilityPct < 0.97).length} sub="Availability < 97%" color={T.red} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartCard title="Portfolio KPI Trend (Monthly)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={tab8Data.kpiTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={['auto', 'auto']} />
              <Tooltip formatter={v => [`${(v * 100).toFixed(1)}%`]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="availability" name="Availability" stroke={T.green} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="performanceRatio" name="Perf. Ratio" stroke={T.indigo} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="curtailment" name="Curtailment" stroke={T.red} strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Grid Curtailment by Region">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tab8Data.curtailmentByRegion} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="region" tick={{ fontSize: 10 }} width={80} />
              <Tooltip formatter={v => [`${v.toFixed(1)}%`, 'Curtailment']} />
              <Bar dataKey="curtailmentPct" fill={T.red} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard title="Asset Health Dashboard (Top 20 Operating Assets)">
        <DataTable
          headers={['Asset', 'Technology', 'Availability %', 'Perf. Ratio %', 'Health Score', 'Status']}
          rows={[...tab8Data.healthScores].sort((a, b) => b.health - a.health).slice(0, 20).map(a => {
            const status = a.health >= 90 ? 'Excellent' : a.health >= 80 ? 'Good' : a.health >= 70 ? 'Monitor' : 'Alert';
            const color = a.health >= 90 ? T.green : a.health >= 80 ? T.blue : a.health >= 70 ? T.amber : T.red;
            return [
              a.name, ASSETS.find(asset => asset.name.startsWith(a.name.substring(0, 6)))?.tech || '—',
              `${a.availability.toFixed(1)}%`, `${a.pr.toFixed(1)}%`,
              <span key={a.name} style={{ color, fontWeight: 700 }}>{a.health.toFixed(1)}</span>,
              <span key={`st-${a.name}`} style={{ color, fontWeight: 600 }}>{status}</span>
            ];
          })}
        />
      </ChartCard>

      {/* Availability Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartCard title="Availability Factor Distribution by Technology">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={TECHNOLOGIES.map(t => {
              const ops = ASSETS.filter(a => a.tech === t && a.status === 'Operating');
              const avgAvail = ops.length ? ops.reduce((s, a) => s + a.availabilityPct, 0) / ops.length * 100 : 0;
              return { tech: t.split(' ')[0], avgAvail: parseFloat(avgAvail.toFixed(2)), target: t.includes('Solar') ? 98 : 96 };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="tech" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[90, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={v => [`${v.toFixed(2)}%`]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="avgAvail" name="Avg Availability" fill={T.teal} radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name="Target" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="O&M Cost Benchmarking ($/kW/yr by Technology)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={TECHNOLOGIES.map((t, i) => {
              const omActual = { 'Solar PV': 12, 'Onshore Wind': 38, 'Offshore Wind': 95, 'Solar+BESS': 18, 'Hydro': 22, 'Geothermal': 65 }[t] || 30;
              const omIrena = { 'Solar PV': 10, 'Onshore Wind': 35, 'Offshore Wind': 90, 'Solar+BESS': 20, 'Hydro': 20, 'Geothermal': 60 }[t] || 28;
              return { tech: t.split(' ')[0], actual: omActual + sr(i * 43) * 8, benchmark: omIrena };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="tech" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: '$/kW/yr', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip formatter={v => [`$${v.toFixed(0)}/kW/yr`]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="actual" name="Portfolio" fill={T.indigo} radius={[4, 4, 0, 0]} />
              <Bar dataKey="benchmark" name="IRENA Benchmark" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Forced Outage Bubble Chart Approximation */}
      <ChartCard title="Forced Outage Impact by Asset (Bubble = Energy Lost MWh)">
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="availPct" name="Availability %" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} label={{ value: 'Availability %', position: 'insideBottom', offset: -5, fontSize: 11 }} />
            <YAxis dataKey="prPct" name="Performance Ratio %" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} label={{ value: 'Perf. Ratio %', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip formatter={(v, name) => [`${v.toFixed(1)}%`, name]} />
            <Scatter
              data={ASSETS.filter(a => a.status === 'Operating').map(a => ({
                availPct: parseFloat((a.availabilityPct * 100).toFixed(2)),
                prPct: parseFloat((a.performanceRatio * 100).toFixed(2)),
                lostMWh: parseFloat(((1 - a.availabilityPct) * a.annualGWh * 1000).toFixed(0))
              }))}
              fill={T.red} opacity={0.65}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );

  const renderTab9 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <KpiCard label="Annual Avoided CO₂" value={`${(portfolio.totalCO2 / 1e6).toFixed(2)} MtCO₂`} sub="vs 420 tCO₂/MWh grid" color={T.green} />
        <KpiCard label="Carbon Intensity" value="2.1 gCO₂/kWh" sub="vs 420 gCO₂/kWh grid avg" color={T.green} />
        <KpiCard label="ESG Composite Score" value={`${(72 + sr(99) * 15).toFixed(0)}/100`} sub="E×0.6 + S×0.2 + G×0.2" color={T.indigo} />
        <KpiCard label="REC Production" value={`${(portfolio.totalAnnualGWh / 1000).toFixed(2)} TWh`} sub="Eligible for I-REC/GO" color={T.teal} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartCard title="SDG Contribution Assessment">
          <DataTable
            headers={['SDG', 'Score', 'Key Indicator', 'Value']}
            rows={tab9Data.sdgData.map(s => [
              s.sdg,
              <div key={s.sdg} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 60, height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${s.score}%`, height: '100%', background: s.score >= 80 ? T.green : T.indigo, borderRadius: 4 }} />
                </div>
                <span style={{ color: T.text, fontWeight: 600 }}>{s.score}</span>
              </div>,
              s.indicator, s.value
            ])}
          />
        </ChartCard>
        <ChartCard title="TCFD Climate Metrics">
          <DataTable
            headers={['Category', 'Score', 'Trend', 'Note']}
            rows={tab9Data.tcfdData.map(t => [
              t.category,
              <span key={t.category} style={{ color: t.score >= 70 ? T.green : t.score >= 50 ? T.amber : T.red, fontWeight: 700 }}>{t.score}/100</span>,
              <span key={`tr-${t.category}`} style={{ color: t.trend === 'Improving' ? T.green : T.sub }}>{t.trend}</span>,
              t.note
            ])}
          />
        </ChartCard>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartCard title="ESG Score Breakdown by Technology">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tab9Data.eByTech}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="tech" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="eScore" name="E Score" fill={T.green} />
              <Bar dataKey="sScore" name="S Score" fill={T.blue} />
              <Bar dataKey="gScore" name="G Score" fill={T.indigo} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Cumulative CO₂ Offset Through 2050 (GtCO₂)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={tab9Data.cumOffset}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v.toFixed(2)} Gt`} />
              <Tooltip formatter={v => [`${v.toFixed(3)} GtCO₂`]} />
              <Line type="monotone" dataKey="GtCO2" stroke={T.green} strokeWidth={2} dot={{ r: 5, fill: T.green }} name="Cumulative Offset" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* REC Production by Market */}
      <ChartCard title="REC / Green Certificate Production by Technology & Market">
        <DataTable
          headers={['Technology', 'Annual GWh', 'US SREC', 'EU GO (MWh)', 'I-REC (MWh)', 'REC Price Est.', 'Annual REC Revenue']}
          rows={tab9Data.eByTech.map((t, i) => {
            const assets = ASSETS.filter(a => a.tech === t.tech);
            const gwh = assets.reduce((s, a) => s + a.annualGWh, 0);
            const srecPct = t.tech.includes('Solar') ? 0.45 : 0.0;
            const goPct = 0.35;
            const irecPct = 0.20;
            const recPrice = 5 + sr(i * 47) * 15;
            const recRev = gwh * 1000 * recPrice / 1e6;
            return [
              t.tech,
              `${gwh.toFixed(0)} GWh`,
              t.tech.includes('Solar') ? `${(gwh * 1000 * srecPct).toFixed(0)}` : '—',
              `${(gwh * 1000 * goPct).toFixed(0)}`,
              `${(gwh * 1000 * irecPct).toFixed(0)}`,
              `$${recPrice.toFixed(1)}/MWh`,
              `$${recRev.toFixed(1)}M`
            ];
          })}
        />
      </ChartCard>

      {/* IPCC Pathway Comparison */}
      <ChartCard title="Portfolio CO₂ Avoidance vs IPCC 1.5°C Pathway">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[
                { label: 'This Portfolio', value: portfolio.totalCO2 / 1e6, color: T.green },
                { label: 'IPCC 1.5°C Need', value: portfolio.totalCO2 / 1e6 * 1.8, color: '#E5E7EB' },
                { label: 'Net Zero 2050', value: portfolio.totalCO2 / 1e6 * 2.5, color: '#E5E7EB' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v.toFixed(1)} Mt`} />
                <Tooltip formatter={v => [`${v.toFixed(2)} MtCO₂/yr`]} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {[T.green, '#94A3B8', '#CBD5E1'].map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
            <div style={{ background: '#D1FAE5', borderRadius: 8, padding: 14, borderLeft: `4px solid ${T.green}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.green }}>Pathway Alignment: On Track</div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>Portfolio avoids {(portfolio.totalCO2 / 1e6).toFixed(2)} MtCO₂/yr — equivalent to removing {Math.round(portfolio.totalCO2 / 4600).toLocaleString()} cars from roads annually.</div>
            </div>
            <div style={{ background: '#EFF6FF', borderRadius: 8, padding: 14, borderLeft: `4px solid ${T.blue}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.blue }}>Grid Decarbonisation Contribution</div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>Generating {(portfolio.totalAnnualGWh / 1000).toFixed(2)} TWh of zero-carbon power, displacing {(portfolio.totalCO2 / 1e6).toFixed(2)} MtCO₂ that would be emitted by the marginal fossil fuel generation mix.</div>
            </div>
          </div>
        </div>
      </ChartCard>
    </div>
  );

  const renderTab10 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ChartCard title="Global Renewable Fund Benchmarking">
        <DataTable
          headers={['Fund', 'AUM ($B)', 'GW', 'Avg IRR', 'Avg CF', 'Diversification', 'Technologies']}
          rows={tab10Data.peers.map((p, i) => {
            const isThis = p.fund === 'This Portfolio';
            return [
              <span key={p.fund} style={{ fontWeight: isThis ? 700 : 400, color: isThis ? T.accent : T.text }}>{isThis ? '★ ' : ''}{p.fund}</span>,
              <span key={`aum-${i}`} style={{ fontWeight: isThis ? 700 : 400 }}>${p.aum}B</span>,
              <span key={`gw-${i}`} style={{ fontWeight: isThis ? 700 : 400 }}>{p.gw}</span>,
              <span key={`irr-${i}`} style={{ fontWeight: isThis ? 700 : 400, color: p.irr >= 12 ? T.green : T.text }}>{p.irr}%</span>,
              <span key={`cf-${i}`} style={{ fontWeight: isThis ? 700 : 400 }}>{p.cf}%</span>,
              <span key={`div-${i}`} style={{ color: p.div === 'High' ? T.green : p.div === 'Medium' ? T.amber : T.red, fontWeight: 600 }}>{p.div}</span>,
              p.tech
            ];
          })}
        />
      </ChartCard>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ChartCard title="AUM Comparison ($B)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tab10Data.peers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}B`} />
              <YAxis type="category" dataKey="fund" tick={{ fontSize: 9 }} width={130} />
              <Tooltip formatter={v => [`$${v}B`, 'AUM']} />
              <Bar dataKey="aum" fill={T.indigo} radius={[0, 4, 4, 0]}>
                {tab10Data.peers.map((p, i) => <Cell key={i} fill={p.fund === 'This Portfolio' ? T.accent : T.indigo} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="IRR vs Capacity Factor — Peer Scatter">
          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="cf" name="Capacity Factor %" tick={{ fontSize: 11 }} label={{ value: 'Avg CF (%)', position: 'insideBottom', offset: -5, fontSize: 11 }} />
              <YAxis dataKey="irr" name="IRR %" tick={{ fontSize: 11 }} label={{ value: 'IRR (%)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <Tooltip formatter={(v, name) => [`${v}${name === 'Capacity Factor %' ? '%' : '%'}`, name]} />
              <Scatter data={tab10Data.peers.map((p, i) => ({ ...p, fill: p.fund === 'This Portfolio' ? T.accent : T.indigo }))} fill={T.indigo}>
                {tab10Data.peers.map((p, i) => <Cell key={i} fill={p.fund === 'This Portfolio' ? T.accent : T.indigo} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { title: 'Competitive Advantage: Cost', body: `CAPEX at $${ASSETS.reduce((s, a) => s + a.capexPerW, 0) / ASSETS.length < 1.5 ? 'below' : 'at'} market median — positioned for lower LCOE vs offshore-heavy peers.`, color: T.green },
          { title: 'Risk Profile: Diversified', body: `HHI of ${portfolio.hhiTech.toFixed(3)} indicates ${portfolio.hhiTech < 0.15 ? 'superior' : 'moderate'} technology diversification. Multi-region presence reduces weather correlation.`, color: T.blue },
          { title: 'IRR vs Peers', body: `Weighted IRR of ${(portfolio.wairr * 100).toFixed(1)}% ${portfolio.wairr > 0.12 ? 'outperforms' : 'inline with'} peer median of 11.8%. Strong vintage 2020-2022 cohort boosts returns.`, color: T.accent }
        ].map((card, i) => (
          <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, borderLeft: `4px solid ${card.color}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8 }}>{card.title}</div>
            <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.6 }}>{card.body}</div>
          </div>
        ))}
      </div>

      {/* Peer Ranking Detail */}
      <ChartCard title="Peer Ranking Analysis — Dimension by Dimension">
        <DataTable
          headers={['Dimension', 'Metric', 'This Portfolio', 'Peer Median', 'Peer Best', 'Rank vs Peers', 'vs Best-in-Class']}
          rows={[
            ['Scale', 'GW Installed', `${(portfolio.totalCapacityMW / 1000).toFixed(2)} GW`, '9.0 GW', '34 GW', '#4/6', portfolio.totalCapacityMW / 1000 >= 9 ? <span style={{ color: T.green }}>At/Above Median</span> : <span style={{ color: T.amber }}>Below Median</span>],
            ['Returns', 'Equity IRR', `${(portfolio.wairr * 100).toFixed(1)}%`, '11.8%', '13.1%', portfolio.wairr > 0.118 ? '#1-2/6' : '#3-4/6', portfolio.wairr >= 0.13 ? <span style={{ color: T.green }}>Best-in-Class</span> : <span style={{ color: T.amber }}>Near Median</span>],
            ['CF Quality', 'Avg CF', `${(portfolio.wacf * 100).toFixed(1)}%`, '31%', '38%', '#3/6', <span style={{ color: T.blue }}>Competitive</span>],
            ['Diversification', 'HHI', portfolio.hhiTech.toFixed(3), '0.18', '0.11', portfolio.hhiTech < 0.15 ? '#1/6' : '#2/6', portfolio.hhiTech < 0.15 ? <span style={{ color: T.green }}>Best-in-Class</span> : <span style={{ color: T.amber }}>Strong</span>],
            ['AUM', '$B AUM', `$${(portfolio.totalCapexM / 1000).toFixed(1)}B`, '$30B', '$85B', '#5/6', <span style={{ color: T.blue }}>Growth Opportunity</span>],
            ['Carbon', 'MtCO₂/yr', `${(portfolio.totalCO2 / 1e6).toFixed(2)} Mt`, '3.2 Mt', '12.1 Mt', '#3/6', <span style={{ color: T.green }}>Strong Impact</span>]
          ]}
        />
      </ChartCard>

      {/* Peer Radar Chart */}
      <ChartCard title="Peer Benchmarking Radar — Relative Positioning (0–100 normalized)">
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={[
            { dim: 'AUM Scale', portfolio: Math.min(100, portfolio.totalCapexM / 1000 / 0.85 * 100), brookfield: 100, nextera: 26, macquarie: 35 },
            { dim: 'Equity IRR', portfolio: Math.min(100, (portfolio.wairr * 100 - 9) / (13.1 - 9) * 100), brookfield: 82, nextera: 70, macquarie: 96 },
            { dim: 'Capacity Factor', portfolio: Math.min(100, (portfolio.wacf * 100 - 25) / (38 - 25) * 100), brookfield: 46, nextera: 31, macquarie: 23 },
            { dim: 'Diversification', portfolio: portfolio.hhiTech < 0.15 ? 90 : 60, brookfield: 88, nextera: 55, macquarie: 85 },
            { dim: 'GW Scale', portfolio: Math.min(100, portfolio.totalCapacityMW / 1000 / 34 * 100), brookfield: 100, nextera: 19, macquarie: 26 },
            { dim: 'Tech Breadth', portfolio: 85, brookfield: 95, nextera: 50, macquarie: 90 }
          ]}>
            <PolarGrid />
            <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
            <Radar name="This Portfolio" dataKey="portfolio" stroke={T.accent} fill={T.accent} fillOpacity={0.25} />
            <Radar name="Brookfield" dataKey="brookfield" stroke={T.indigo} fill={T.indigo} fillOpacity={0.1} />
            <Radar name="Macquarie GIG" dataKey="macquarie" stroke={T.teal} fill={T.teal} fillOpacity={0.1} />
            <Radar name="NextEra" dataKey="nextera" stroke={T.red} fill={T.red} fillOpacity={0.1} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 0: return renderTab1();
      case 1: return renderTab2();
      case 2: return renderTab3();
      case 3: return renderTab4();
      case 4: return renderTab5();
      case 5: return renderTab6();
      case 6: return renderTab7();
      case 7: return renderTab8();
      case 8: return renderTab9();
      case 9: return renderTab10();
      default: return null;
    }
  };

  // ─── Main Render ───────────────────────────────────────────────────────────
  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0F172A', borderBottom: `3px solid ${T.accent}`, padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                ⚡
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', letterSpacing: -0.3 }}>Renewable Portfolio Intelligence</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>RE-PORT1 · {ASSETS.length} Assets · {(portfolio.totalCapacityMW / 1000).toFixed(2)} GW · ${(portfolio.totalCapexM / 1000).toFixed(1)}B AUM</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>PORTFOLIO WAIRR</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: T.accent }}>{(portfolio.wairr * 100).toFixed(1)}%</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>ANNUAL GENERATION</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#60A5FA' }}>{(portfolio.totalAnnualGWh / 1000).toFixed(2)} TWh</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>AVOIDED CO₂</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#34D399' }}>{(portfolio.totalCO2 / 1e6).toFixed(1)} Mt</div>
            </div>
          </div>
        </div>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: '12px 18px', border: 'none', background: 'transparent',
              color: activeTab === i ? T.accent : '#94A3B8',
              borderBottom: activeTab === i ? `2px solid ${T.accent}` : '2px solid transparent',
              fontSize: 12, fontWeight: activeTab === i ? 700 : 400, cursor: 'pointer',
              whiteSpace: 'nowrap', fontFamily: 'DM Sans, sans-serif', transition: 'color 0.15s'
            }}>
              {i + 1}. {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 32px' }}>
        {renderActiveTab()}
      </div>

      {/* Status bar */}
      <div style={{ background: '#0F172A', padding: '8px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid #1E293B` }}>
        <div style={{ fontSize: 10, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
          RE-PORT1 · Infrastructure PE Fund Analytics Platform · {ASSETS.length} assets across {REGIONS.length} regions
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <span style={{ fontSize: 10, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
            WACF: {(portfolio.wacf * 100).toFixed(1)}% · MIN DSCR: {portfolio.minDSCR.toFixed(2)} · HHI: {portfolio.hhiTech.toFixed(3)}
          </span>
          <span style={{ fontSize: 10, color: wbData ? '#34D399' : '#F59E0B', fontFamily: 'JetBrains Mono, monospace' }}>
            {wbLoading ? '● WB API LOADING' : wbData ? '● LIVE DATA' : '● SEED DATA'}
          </span>
        </div>
      </div>
    </div>
  );
}
