import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis, LineChart, Line,
} from 'recharts';

import { useCarbonCredit } from '../../../context/CarbonCreditContext';

const API = 'http://localhost:8001';
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ border: `1px solid ${accent || T.border}`, borderRadius: 8, padding: '16px 20px', background: T.surface }}>
    <div style={{ fontSize: 12, color: T.textMut, marginBottom: 4, fontFamily: T.mono }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);
const Section = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontSize: 16, fontWeight: 600, color: T.navy, marginBottom: 12, paddingBottom: 8, borderBottom: `2px solid ${T.gold}` }}>{title}</div>
    {children}
  </div>
);
const Row = ({ children, gap = 12 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${React.Children.count(children)},1fr)`, gap }}>{children}</div>
);
const Badge = ({ label, color }) => {
  const colors = { green: { bg: '#d1fae5', text: '#065f46' }, yellow: { bg: '#fef3c7', text: '#92400e' }, red: { bg: '#fee2e2', text: '#991b1b' }, blue: { bg: '#dbeafe', text: '#1e40af' }, gray: { bg: '#f3f4f6', text: '#374151' }, purple: { bg: '#ede9fe', text: '#5b21b6' }, orange: { bg: '#ffedd5', text: '#9a3412' }, teal: { bg: '#ccfbf1', text: '#115e59' } };
  const c = colors[color] || colors.gray;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: c.bg, color: c.text }}>{label}</span>;
};
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 20, overflowX: 'auto' }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)}
        style={{ padding: '10px 18px', border: 'none', borderBottom: active === t ? `3px solid ${T.gold}` : '3px solid transparent',
          background: 'none', cursor: 'pointer', fontWeight: active === t ? 700 : 500,
          color: active === t ? T.navy : T.textMut, fontSize: 13, fontFamily: T.font, whiteSpace: 'nowrap' }}>
        {t}
      </button>
    ))}
  </div>
);

const TABS = ['Portfolio Overview', 'Risk Analysis', 'Performance Attribution', 'Geographic Distribution', 'Vintage & Maturity', 'Export & Reporting'];
const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
const FAMILIES = ['Nature-Based', 'Agriculture & Soil', 'Energy Transition', 'Waste & Circular', 'Industrial Process', 'Carbon Dioxide Removal', 'Community & Cookstoves'];
const REGIONS = ['Latin America', 'Sub-Saharan Africa', 'Southeast Asia', 'South Asia', 'North America', 'Europe'];
const VINTAGES = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

const genPositions = () => {
  const names = ['Madre de Dios REDD+','Kasigau Corridor','Cerrado Reforestation','Mekong Blue Carbon','Gujarat Solar Farm',
    'Punjab Biogas','Accra Landfill Gas','Iowa Soil Carbon','Oregon Biochar','Texas DAC Alpha',
    'Sundarbans Mangrove','Rimba Raya REDD','Lake Turkana Wind','Sichuan Hydro','Tamil Nadu Stoves',
    'Kenya Safe Water','Rwanda Cookstoves','Chile Reforestation','Sumatra Rice Methane','Norway GeoCCS',
    'Yaeda REDD+','Cairo Compost','Congo BECCS','Atlantic Forest','Borneo Peat'];
  return names.map((n, i) => {
    const fi = Math.floor(sr(i * 7) * FAMILIES.length);
    const ri = Math.floor(sr(i * 11) * REGIONS.length);
    const vi = Math.floor(sr(i * 13) * VINTAGES.length);
    const credits = Math.round(sr(i * 17) * 180000 + 20000);
    const price = parseFloat((sr(i * 19) * 40 + 3).toFixed(2));
    const retired = Math.round(credits * (sr(i * 23) * 0.6 + 0.1));
    return {
      id: i + 1, name: n, family: FAMILIES[fi], region: REGIONS[ri], vintage: VINTAGES[vi],
      credits, retired, active: credits - retired, priceAcquired: price,
      priceCurrent: parseFloat((price * (1 + sr(i * 29) * 0.6 - 0.1)).toFixed(2)),
      value: Math.round(credits * price),
      reversalRisk: parseFloat((sr(i * 31) * 0.15 + 0.02).toFixed(3)),
      regulatoryRisk: parseFloat((sr(i * 37) * 0.2 + 0.05).toFixed(3)),
      integrityScore: Math.round(sr(i * 41) * 30 + 60),
      coBenefits: Math.round(sr(i * 43) * 5 + 1),
    };
  });
};

const POSITIONS = genPositions();

export default function CcPortfolioAnalyticsPage() {
  const ccData = useCarbonCredit(); const ccPortfolio = ccData.adaptForPortfolio();
  const [tab, setTab] = useState(TABS[0]);

  const portfolio = useMemo(() => {
    const totalValue = POSITIONS.reduce((s, p) => s + p.value, 0);
    const totalCredits = POSITIONS.reduce((s, p) => s + p.credits, 0);
    const totalRetired = POSITIONS.reduce((s, p) => s + p.retired, 0);
    const retirementRate = ((totalRetired / totalCredits) * 100).toFixed(1);
    const avgAge = (POSITIONS.reduce((s, p) => s + (2026 - p.vintage), 0) / (POSITIONS.length || 1)).toFixed(1);
    return { totalValue, totalCredits, totalRetired, retirementRate, avgAge };
  }, []);

  const familyDonut = useMemo(() => FAMILIES.map(f => ({
    name: f, value: POSITIONS.filter(p => p.family === f).reduce((s, p) => s + p.value, 0)
  })).filter(d => d.value > 0), []);

  const vintageBar = useMemo(() => VINTAGES.map(v => ({
    year: String(v),
    credits: POSITIONS.filter(p => p.vintage === v).reduce((s, p) => s + p.credits, 0),
    value: POSITIONS.filter(p => p.vintage === v).reduce((s, p) => s + p.value, 0),
  })), []);

  const riskMetrics = useMemo(() => {
    const avgReversal = parseFloat((POSITIONS.reduce((s, p) => s + p.reversalRisk, 0) / (POSITIONS.length || 1) * 100).toFixed(1));
    const avgRegulatory = parseFloat((POSITIONS.reduce((s, p) => s + p.regulatoryRisk, 0) / (POSITIONS.length || 1) * 100).toFixed(1));
    // Guard priceAcquired: use Math.max(..., 0.01) so real-data positions with priceAcquired=0 don't produce Infinity
    const priceVol = parseFloat((POSITIONS.reduce((s, p) => s + Math.abs(p.priceCurrent - p.priceAcquired) / Math.max(p.priceAcquired, 0.01), 0) / (POSITIONS.length || 1) * 100).toFixed(1));

    const tv = portfolio.totalValue || 1; // guard: avoid Infinity/NaN in HHI shares when portfolio is empty
    const familyShares = FAMILIES.map(f => {
      const fv = POSITIONS.filter(p => p.family === f).reduce((s, p) => s + p.value, 0);
      return fv / tv;
    });
    const hhiFamily = Math.round(familyShares.reduce((s, sh) => s + sh * sh, 0) * 10000);

    const geoShares = REGIONS.map(r => {
      const rv = POSITIONS.filter(p => p.region === r).reduce((s, p) => s + p.value, 0);
      return rv / tv;
    });
    const hhiGeo = Math.round(geoShares.reduce((s, sh) => s + sh * sh, 0) * 10000);

    const vintShares = VINTAGES.map(v => {
      const vv = POSITIONS.filter(p => p.vintage === v).reduce((s, p) => s + p.value, 0);
      return vv / tv;
    });
    const hhiVintage = Math.round(vintShares.reduce((s, sh) => s + sh * sh, 0) * 10000);

    const radarData = [
      { axis: 'Reversal Risk', value: avgReversal },
      { axis: 'Regulatory Risk', value: avgRegulatory },
      { axis: 'Price Volatility', value: priceVol },
      { axis: 'Family Conc. (HHI/100)', value: hhiFamily / 100 },
      { axis: 'Geo Conc. (HHI/100)', value: hhiGeo / 100 },
      { axis: 'Vintage Conc. (HHI/100)', value: hhiVintage / 100 },
    ];
    return { avgReversal, avgRegulatory, priceVol, hhiFamily, hhiGeo, hhiVintage, radarData };
  }, [portfolio.totalValue]);

  const attribution = useMemo(() => {
    const priceMov = parseFloat((POSITIONS.reduce((s, p) => s + (p.priceCurrent - p.priceAcquired) * p.credits, 0) / (portfolio.totalValue || 1) * 100).toFixed(1));
    const vintageAging = parseFloat((sr(201) * 3 + 1).toFixed(1));
    const methQuality = parseFloat((sr(203) * 2.5 + 0.5).toFixed(1));
    const registryPremium = parseFloat((sr(207) * 1.5 + 0.3).toFixed(1));
    const coBenefitPremium = parseFloat((sr(209) * 2 + 0.2).toFixed(1));
    const totalReturn = parseFloat((priceMov + vintageAging + methQuality + registryPremium + coBenefitPremium).toFixed(1));

    const waterfall = [
      { name: 'Price Movement', value: priceMov, fill: priceMov >= 0 ? '#059669' : '#dc2626' },
      { name: 'Vintage Aging', value: vintageAging, fill: '#3b82f6' },
      { name: 'Methodology Quality', value: methQuality, fill: '#8b5cf6' },
      { name: 'Registry Premium', value: registryPremium, fill: '#f59e0b' },
      { name: 'Co-Benefit Premium', value: coBenefitPremium, fill: '#ec4899' },
      { name: 'Total Return', value: totalReturn, fill: T.navy },
    ];
    return { priceMov, vintageAging, methQuality, registryPremium, coBenefitPremium, totalReturn, waterfall };
  }, [portfolio.totalValue]);

  const geoData = useMemo(() => {
    const byContinent = { Americas: ['Latin America', 'North America'], Africa: ['Sub-Saharan Africa'], Asia: ['Southeast Asia', 'South Asia'], Europe: ['Europe'] };
    const continentData = Object.entries(byContinent).map(([cont, regs]) => {
      const cp = POSITIONS.filter(p => regs.includes(p.region));
      return { continent: cont, credits: cp.reduce((s, p) => s + p.credits, 0), value: cp.reduce((s, p) => s + p.value, 0), positions: cp.length };
    });
    const countryData = REGIONS.map(r => {
      const rp = POSITIONS.filter(p => p.region === r);
      return { region: r, credits: rp.reduce((s, p) => s + p.credits, 0), value: rp.reduce((s, p) => s + p.value, 0), positions: rp.length, avgPrice: rp.length ? parseFloat((rp.reduce((s, p) => s + p.priceCurrent, 0) / rp.length).toFixed(2)) : 0, avgIntegrity: rp.length ? Math.round(rp.reduce((s, p) => s + p.integrityScore, 0) / rp.length) : 0 };
    });
    return { continentData, countryData };
  }, []);

  const vintageAnalysis = useMemo(() => {
    const cohorts = VINTAGES.map((v, vi) => {
      const vp = POSITIONS.filter(p => p.vintage === v);
      const avgAcquired = vp.length ? parseFloat((vp.reduce((s, p) => s + p.priceAcquired, 0) / vp.length).toFixed(2)) : 0;
      const avgCurrent = vp.length ? parseFloat((vp.reduce((s, p) => s + p.priceCurrent, 0) / vp.length).toFixed(2)) : 0;
      const totalVol = vp.reduce((s, p) => s + p.credits, 0);
      return { vintage: String(v), avgAcquired, avgCurrent, appreciation: parseFloat(((avgCurrent - avgAcquired) / Math.max(avgAcquired, 0.01) * 100).toFixed(1)), volume: totalVol, age: 2026 - v };
    });
    const scatterData = POSITIONS.map((p, i) => ({
      x: 2026 - p.vintage, y: p.priceCurrent, z: p.credits / 1000, name: p.name
    }));
    return { cohorts, scatterData };
  }, []);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.navy, margin: 0 }}>Portfolio Analytics & Reporting</h1>
          <div style={{ fontSize: 13, color: T.textSec, fontFamily: T.mono, marginTop: 4 }}>EP-BW2 | 25 positions, 8 vintages, 6 regions | Portfolio-level risk, attribution & geographic analytics</div>
        </div>

        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {tab === 'Portfolio Overview' && (
          <>
            <Row>
              <KpiCard label="TOTAL PORTFOLIO VALUE" value={'$' + ((ccPortfolio.totalValue || portfolio.totalValue) / 1e6).toFixed(2) + 'M'} sub="Mark-to-market" accent={T.gold} />
              <KpiCard label="TOTAL CREDITS" value={((ccPortfolio.totalCredits || portfolio.totalCredits) / 1e6).toFixed(2) + 'M'} sub="tCO2e across 25 positions" />
              <KpiCard label="RETIREMENT RATE" value={(ccPortfolio.retirementRate || portfolio.retirementRate) + '%'} sub={`${((ccPortfolio.totalRetired || portfolio.totalRetired) / 1e6).toFixed(2)}M retired`} />
              <KpiCard label="AVG CREDIT AGE" value={portfolio.avgAge + ' yrs'} sub="Weighted by volume" />
            </Row>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
              <Section title="Allocation by Family">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={familyDonut} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={110} label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                      {familyDonut.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => '$' + (v / 1e6).toFixed(3) + 'M'} />
                  </PieChart>
                </ResponsiveContainer>
              </Section>
              <Section title="Credits by Vintage">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vintageBar}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="year" style={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => (v / 1e3).toFixed(0) + 'k'} style={{ fontSize: 11 }} />
                    <Tooltip formatter={v => (v / 1e3).toFixed(1) + 'k'} />
                    <Legend />
                    <Bar dataKey="credits" name="Credits (tCO2e)" fill={T.sage} />
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            </div>

            <Section title="Position Detail">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {['#', 'Position', 'Family', 'Region', 'Vintage', 'Credits', 'Retired', 'Price Acq.', 'Price Now', 'Value', 'Integrity'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: T.textMut, fontWeight: 600, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {POSITIONS.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ padding: '6px 8px', fontFamily: T.mono, color: T.textMut }}>{p.id}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                        <td style={{ padding: '6px 8px', fontSize: 11 }}>{p.family.split(' ')[0]}</td>
                        <td style={{ padding: '6px 8px', fontSize: 11 }}>{p.region}</td>
                        <td style={{ padding: '6px 8px', fontFamily: T.mono }}>{p.vintage}</td>
                        <td style={{ padding: '6px 8px', fontFamily: T.mono }}>{(p.credits / 1e3).toFixed(0)}k</td>
                        <td style={{ padding: '6px 8px', fontFamily: T.mono }}>{(p.retired / 1e3).toFixed(0)}k</td>
                        <td style={{ padding: '6px 8px', fontFamily: T.mono }}>${p.priceAcquired}</td>
                        <td style={{ padding: '6px 8px', fontFamily: T.mono, color: p.priceCurrent >= p.priceAcquired ? T.green : T.red }}>${p.priceCurrent}</td>
                        <td style={{ padding: '6px 8px', fontFamily: T.mono }}>${(p.value / 1e3).toFixed(0)}k</td>
                        <td style={{ padding: '6px 8px' }}><Badge label={p.integrityScore} color={p.integrityScore >= 80 ? 'green' : p.integrityScore >= 65 ? 'yellow' : 'red'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}

        {tab === 'Risk Analysis' && (
          <>
            <Row>
              <KpiCard label="AVG REVERSAL RISK" value={riskMetrics.avgReversal + '%'} sub="Non-permanence buffer" accent={riskMetrics.avgReversal > 8 ? T.red : T.border} />
              <KpiCard label="AVG REGULATORY RISK" value={riskMetrics.avgRegulatory + '%'} sub="Policy uncertainty" />
              <KpiCard label="PRICE VOLATILITY" value={riskMetrics.priceVol + '%'} sub="Avg price delta" />
              <KpiCard label="FAMILY HHI" value={riskMetrics.hhiFamily} sub={riskMetrics.hhiFamily > 2500 ? 'Concentrated' : 'Moderate'} accent={riskMetrics.hhiFamily > 2500 ? T.amber : T.border} />
            </Row>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
              <Section title="Risk Radar">
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={riskMetrics.radarData}>
                    <PolarGrid stroke={T.borderL} />
                    <PolarAngleAxis dataKey="axis" style={{ fontSize: 10 }} />
                    <PolarRadiusAxis style={{ fontSize: 9 }} />
                    <Radar name="Risk Profile" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </Section>
              <Section title="Concentration Analysis (HHI)">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={[
                    { dim: 'Family', hhi: riskMetrics.hhiFamily },
                    { dim: 'Geography', hhi: riskMetrics.hhiGeo },
                    { dim: 'Vintage', hhi: riskMetrics.hhiVintage },
                  ]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis type="number" domain={[0, 5000]} style={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="dim" width={90} style={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="hhi" name="HHI Index" fill={T.gold}>
                      {[riskMetrics.hhiFamily, riskMetrics.hhiGeo, riskMetrics.hhiVintage].map((v, i) => (
                        <Cell key={i} fill={v > 2500 ? T.red : v > 1500 ? T.amber : T.green} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>
                  HHI: &lt;1500 = Diversified | 1500-2500 = Moderate | &gt;2500 = Concentrated
                </div>
              </Section>
            </div>

            <Section title="Position-Level Risk">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {['Position', 'Reversal %', 'Regulatory %', 'Integrity', 'Co-Benefits', 'Risk Rating'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: T.textMut, fontWeight: 600, fontFamily: T.mono, fontSize: 10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {POSITIONS.map((p, i) => {
                      const riskScore = p.reversalRisk * 100 + p.regulatoryRisk * 100 - p.integrityScore * 0.3;
                      const rating = riskScore < 5 ? 'Low' : riskScore < 12 ? 'Medium' : 'High';
                      return (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                          <td style={{ padding: '6px 8px', fontWeight: 600 }}>{p.name}</td>
                          <td style={{ padding: '6px 8px', fontFamily: T.mono }}>{(p.reversalRisk * 100).toFixed(1)}%</td>
                          <td style={{ padding: '6px 8px', fontFamily: T.mono }}>{(p.regulatoryRisk * 100).toFixed(1)}%</td>
                          <td style={{ padding: '6px 8px' }}><Badge label={p.integrityScore} color={p.integrityScore >= 80 ? 'green' : p.integrityScore >= 65 ? 'yellow' : 'red'} /></td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>{p.coBenefits}/6</td>
                          <td style={{ padding: '6px 8px' }}><Badge label={rating} color={rating === 'Low' ? 'green' : rating === 'Medium' ? 'yellow' : 'red'} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}

        {tab === 'Performance Attribution' && (
          <>
            <Row>
              <KpiCard label="TOTAL RETURN" value={attribution.totalReturn + '%'} sub="All factors combined" accent={T.gold} />
              <KpiCard label="PRICE MOVEMENT" value={attribution.priceMov + '%'} sub="Market price delta" />
              <KpiCard label="VINTAGE AGING" value={'+' + attribution.vintageAging + '%'} sub="Maturity premium" />
              <KpiCard label="CO-BENEFIT PREMIUM" value={'+' + attribution.coBenefitPremium + '%'} sub="SDG contribution value" />
            </Row>

            <Section title="Return Attribution Waterfall">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={attribution.waterfall}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" style={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                  <YAxis style={{ fontSize: 11 }} tickFormatter={v => v + '%'} />
                  <Tooltip formatter={v => v.toFixed(1) + '%'} />
                  <Bar dataKey="value" name="Return %">
                    {attribution.waterfall.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Attribution Detail">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {attribution.waterfall.slice(0, 5).map(w => (
                  <div key={w.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: `1px solid ${T.border}`, borderRadius: 8, background: T.surface }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.navy }}>{w.name}</div>
                      <div style={{ fontSize: 11, color: T.textMut }}>Factor contribution</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: w.value >= 0 ? T.green : T.red, fontFamily: T.mono }}>
                      {w.value >= 0 ? '+' : ''}{w.value.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {tab === 'Geographic Distribution' && (
          <>
            <Section title="Continent Summary">
              <Row>
                {geoData.continentData.map(c => (
                  <KpiCard key={c.continent} label={c.continent.toUpperCase()} value={'$' + (c.value / 1e6).toFixed(2) + 'M'} sub={`${c.positions} positions | ${(c.credits / 1e3).toFixed(0)}k credits`} />
                ))}
              </Row>
            </Section>

            <Section title="Regional Breakdown">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {['Region', 'Positions', 'Credits', 'Value', 'Avg Price', 'Avg Integrity', 'Share'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: T.textMut, fontWeight: 600, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {geoData.countryData.map((r, i) => (
                      <tr key={r.region} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.region}</td>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{r.positions}</td>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{(r.credits / 1e3).toFixed(0)}k</td>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono }}>${(r.value / 1e6).toFixed(2)}M</td>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono }}>${r.avgPrice}</td>
                        <td style={{ padding: '8px 10px' }}><Badge label={r.avgIntegrity} color={r.avgIntegrity >= 75 ? 'green' : r.avgIntegrity >= 60 ? 'yellow' : 'red'} /></td>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{(r.value / portfolio.totalValue * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Regional Value Distribution">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={geoData.countryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="region" style={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                  <YAxis tickFormatter={v => '$' + (v / 1e6).toFixed(1) + 'M'} style={{ fontSize: 11 }} />
                  <Tooltip formatter={v => '$' + (v / 1e6).toFixed(3) + 'M'} />
                  <Bar dataKey="value" name="Value" fill={T.sage} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </>
        )}

        {tab === 'Vintage & Maturity' && (
          <>
            <Section title="Cohort Analysis">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                      {['Vintage', 'Age (yrs)', 'Volume', 'Avg Acquired', 'Avg Current', 'Appreciation'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: T.textMut, fontWeight: 600, fontFamily: T.mono, fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vintageAnalysis.cohorts.map((c, i) => (
                      <tr key={c.vintage} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ padding: '8px 10px', fontWeight: 700, fontFamily: T.mono }}>{c.vintage}</td>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{c.age}</td>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono }}>{(c.volume / 1e3).toFixed(0)}k</td>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono }}>${c.avgAcquired}</td>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono }}>${c.avgCurrent}</td>
                        <td style={{ padding: '8px 10px', fontFamily: T.mono, color: c.appreciation >= 0 ? T.green : T.red }}>{c.appreciation >= 0 ? '+' : ''}{c.appreciation}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Price vs Age (bubble = volume)">
              <ResponsiveContainer width="100%" height={340}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="x" name="Age (yrs)" type="number" style={{ fontSize: 11 }} label={{ value: 'Credit Age (years)', position: 'bottom', style: { fontSize: 11 } }} />
                  <YAxis dataKey="y" name="Price $/t" type="number" style={{ fontSize: 11 }} label={{ value: 'Price $/tCO2e', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                  <ZAxis dataKey="z" range={[40, 400]} name="Volume (k)" />
                  <Tooltip formatter={(v, n) => n === 'Price $/t' ? '$' + v.toFixed(2) : n === 'Volume (k)' ? v.toFixed(0) + 'k' : v} />
                  <Scatter name="Positions" data={vintageAnalysis.scatterData} fill={T.navy} fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Price Evolution by Vintage">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={vintageAnalysis.cohorts}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="vintage" style={{ fontSize: 11 }} />
                  <YAxis style={{ fontSize: 11 }} tickFormatter={v => '$' + v} />
                  <Tooltip formatter={v => '$' + v} />
                  <Legend />
                  <Bar dataKey="avgAcquired" name="Acquired Price" fill={T.borderL} />
                  <Bar dataKey="avgCurrent" name="Current Price" fill={T.navy} />
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </>
        )}

        {tab === 'Export & Reporting' && (
          <Section title="Report Generation">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[
                { title: 'Portfolio Summary Report', desc: 'Top-level KPIs, allocation breakdown, risk metrics, and vintage analysis', format: 'PDF', status: 'Ready' },
                { title: 'Position-Level Export', desc: 'All 25 positions with full detail columns: credits, pricing, risk, integrity', format: 'CSV', status: 'Ready' },
                { title: 'Risk & Attribution Report', desc: 'HHI concentration, reversal/regulatory risk, performance attribution waterfall', format: 'PDF', status: 'Ready' },
                { title: 'Geographic Distribution', desc: 'Regional breakdown with continent aggregation, integrity scores, pricing', format: 'XLSX', status: 'Ready' },
                { title: 'Vintage Cohort Analysis', desc: 'Price evolution, aging curves, appreciation metrics by vintage year', format: 'CSV', status: 'Ready' },
                { title: 'Regulatory Filing Pack', desc: 'VCMI Claims Code alignment, ICVCM CCP assessment, SBTi BVCM tracker', format: 'PDF', status: 'Draft' },
              ].map((r, i) => (
                <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, background: T.surface }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{r.title}</div>
                    <Badge label={r.format} color="blue" />
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>{r.desc}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Badge label={r.status} color={r.status === 'Ready' ? 'green' : 'yellow'} />
                    <span style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono }}>Last: 2026-03-28</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
