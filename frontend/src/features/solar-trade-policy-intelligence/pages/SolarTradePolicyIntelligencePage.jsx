import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie,
  ScatterChart, Scatter, ZAxis,
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

const COUNTRIES = [
  { id: 1, country: 'USA', iraDomesticBonus: 10, adCvdTariff: 254, nziaTarget: 0, cbamRisk: 2, importDependency: 82, annualInstall: 32, localMfg: 5.8, policyScore: 88 },
  { id: 2, country: 'EU', iraDomesticBonus: 0, adCvdTariff: 0, nziaTarget: 40, cbamRisk: 6, importDependency: 95, annualInstall: 58, localMfg: 4.2, policyScore: 72 },
  { id: 3, country: 'China', iraDomesticBonus: 0, adCvdTariff: 0, nziaTarget: 0, cbamRisk: 8, importDependency: 0, annualInstall: 217, localMfg: 640, policyScore: 95 },
  { id: 4, country: 'India', iraDomesticBonus: 0, adCvdTariff: 40, nziaTarget: 0, cbamRisk: 5, importDependency: 75, annualInstall: 18, localMfg: 12, policyScore: 78 },
  { id: 5, country: 'Germany', iraDomesticBonus: 0, adCvdTariff: 0, nziaTarget: 40, cbamRisk: 5, importDependency: 97, annualInstall: 14, localMfg: 0.8, policyScore: 65 },
  { id: 6, country: 'Japan', iraDomesticBonus: 0, adCvdTariff: 0, nziaTarget: 0, cbamRisk: 4, importDependency: 88, annualInstall: 11, localMfg: 2.5, policyScore: 62 },
  { id: 7, country: 'South Korea', iraDomesticBonus: 0, adCvdTariff: 0, nziaTarget: 0, cbamRisk: 4, importDependency: 70, annualInstall: 5, localMfg: 4.0, policyScore: 68 },
  { id: 8, country: 'Australia', iraDomesticBonus: 0, adCvdTariff: 0, nziaTarget: 0, cbamRisk: 3, importDependency: 92, annualInstall: 6, localMfg: 0.5, policyScore: 55 },
  { id: 9, country: 'Brazil', iraDomesticBonus: 0, adCvdTariff: 12, nziaTarget: 0, cbamRisk: 6, importDependency: 72, annualInstall: 10, localMfg: 2.8, policyScore: 60 },
  { id: 10, country: 'Vietnam', iraDomesticBonus: 0, adCvdTariff: 15, nziaTarget: 0, cbamRisk: 7, importDependency: 20, annualInstall: 3, localMfg: 28, policyScore: 52 },
  { id: 11, country: 'Malaysia', iraDomesticBonus: 0, adCvdTariff: 15, nziaTarget: 0, cbamRisk: 7, importDependency: 15, annualInstall: 1, localMfg: 22, policyScore: 48 },
  { id: 12, country: 'Thailand', iraDomesticBonus: 0, adCvdTariff: 15, nziaTarget: 0, cbamRisk: 7, importDependency: 22, annualInstall: 2, localMfg: 16, policyScore: 45 },
  { id: 13, country: 'UK', iraDomesticBonus: 0, adCvdTariff: 0, nziaTarget: 0, cbamRisk: 5, importDependency: 96, annualInstall: 4, localMfg: 0.2, policyScore: 58 },
  { id: 14, country: 'Spain', iraDomesticBonus: 0, adCvdTariff: 0, nziaTarget: 40, cbamRisk: 5, importDependency: 96, annualInstall: 6, localMfg: 0.4, policyScore: 63 },
  { id: 15, country: 'Italy', iraDomesticBonus: 0, adCvdTariff: 0, nziaTarget: 40, cbamRisk: 5, importDependency: 97, annualInstall: 5, localMfg: 0.3, policyScore: 61 },
  { id: 16, country: 'Mexico', iraDomesticBonus: 10, adCvdTariff: 0, nziaTarget: 0, cbamRisk: 4, importDependency: 86, annualInstall: 4, localMfg: 1.8, policyScore: 66 },
  { id: 17, country: 'Canada', iraDomesticBonus: 10, adCvdTariff: 0, nziaTarget: 0, cbamRisk: 3, importDependency: 80, annualInstall: 3.5, localMfg: 1.2, policyScore: 70 },
  { id: 18, country: 'Saudi Arabia', iraDomesticBonus: 0, adCvdTariff: 0, nziaTarget: 0, cbamRisk: 5, importDependency: 98, annualInstall: 5, localMfg: 0.5, policyScore: 55 },
  { id: 19, country: 'South Africa', iraDomesticBonus: 0, adCvdTariff: 0, nziaTarget: 0, cbamRisk: 6, importDependency: 94, annualInstall: 3, localMfg: 0.4, policyScore: 48 },
  { id: 20, country: 'Poland', iraDomesticBonus: 0, adCvdTariff: 0, nziaTarget: 40, cbamRisk: 5, importDependency: 98, annualInstall: 4, localMfg: 0.6, policyScore: 60 },
];

const IRA_SCENARIOS = [
  { scenario: 'Base ITC 30%', itcPct: 30, netCost: 0.70, applicability: 'All qualifying systems' },
  { scenario: '+ Domestic Content +10%', itcPct: 40, netCost: 0.60, applicability: 'US-mfg modules+racking' },
  { scenario: '+ Energy Community +10%', itcPct: 40, netCost: 0.60, applicability: 'Former fossil fuel areas' },
  { scenario: '+ Low Income +10%', itcPct: 40, netCost: 0.60, applicability: 'Qualified census tracts' },
  { scenario: 'Domestic + Comm.', itcPct: 50, netCost: 0.50, applicability: 'Combined 2 adders' },
  { scenario: 'Dom + Comm + LI', itcPct: 60, netCost: 0.40, applicability: 'All 3 adders combined' },
  { scenario: '+ Prevailing Wage Bonus', itcPct: 30, netCost: 0.70, applicability: 'Davis-Bacon wages paid' },
  { scenario: 'Maximum Stack ITC', itcPct: 70, netCost: 0.30, applicability: '§48E + all adders max' },
];

const TABS = [
  'Policy Landscape', 'IRA Incentive Optimizer', 'Anti-Dumping Tariffs',
  'EU NZIA Analysis', 'CBAM Impact', 'Trade Flow Map'
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function SolarTradePolicyIntelligencePage() {
  const [tab, setTab] = useState(0);
  const [regionFilter, setRegionFilter] = useState('All');
  const [iraSizeKw, setIraSizeKw] = useState(5000);
  const [iraAdders, setIraAdders] = useState({ domestic: false, energyCommunity: false, lowIncome: false, prevailingWage: true });

  const computedITC = useMemo(() => {
    let itc = 6;
    if (iraAdders.prevailingWage) itc = 30;
    if (iraAdders.domestic) itc += 10;
    if (iraAdders.energyCommunity) itc += 10;
    if (iraAdders.lowIncome) itc += 10;
    return Math.min(itc, 70);
  }, [iraAdders]);

  const iraCredit = useMemo(() => (iraSizeKw * 0.001 * 1800 * computedITC / 100).toFixed(0), [iraSizeKw, computedITC]);

  const highTariffCountries = useMemo(() => COUNTRIES.filter(c => c.adCvdTariff > 10).length, []);
  const nziaCountries = useMemo(() => COUNTRIES.filter(c => c.nziaTarget > 0).length, []);
  const avgCbam = useMemo(() => COUNTRIES.length ? (COUNTRIES.reduce((a, c) => a + c.cbamRisk, 0) / COUNTRIES.length).toFixed(1) : '0.0', []);

  const filteredCountries = useMemo(() => {
    if (regionFilter === 'All') return COUNTRIES;
    if (regionFilter === 'Americas') return COUNTRIES.filter(c => ['USA', 'Canada', 'Mexico', 'Brazil'].includes(c.country));
    if (regionFilter === 'Europe') return COUNTRIES.filter(c => ['EU', 'Germany', 'Spain', 'Italy', 'UK', 'Poland'].includes(c.country));
    if (regionFilter === 'Asia') return COUNTRIES.filter(c => ['China', 'India', 'Japan', 'South Korea', 'Vietnam', 'Malaysia', 'Thailand'].includes(c.country));
    if (regionFilter === 'Other') return COUNTRIES.filter(c => ['Australia', 'Saudi Arabia', 'South Africa'].includes(c.country));
    return COUNTRIES;
  }, [regionFilter]);

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 28px', color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>EP-ED5 · SEIA / IEA Policies DB / WTO / EU Commission NZIA Tracker</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: T.navy }}>Solar Trade & Policy Intelligence</h1>
        <p style={{ color: T.sub, marginTop: 6, fontSize: 13 }}>IRA §48C/48E up to 70% ITC · EU NZIA 40% local content target 2030 · US AD/CVD up to 254% on China/SEA · India BCD 40%</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Max IRA ITC Stack" value="70%" sub="§48E + all adders combined" color={T.green} />
        <KpiCard label="EU NZIA Target" value="40%" sub="local content by 2030" color={T.blue} />
        <KpiCard label="High Tariff Markets" value={highTariffCountries} sub="countries with AD/CVD >10%" color={T.red} />
        <KpiCard label="NZIA-Covered Markets" value={nziaCountries} sub="EU member states" color={T.teal} />
        <KpiCard label="Avg CBAM Risk" value={`${avgCbam}/10`} sub="cross-border adjustment score" color={T.amber} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: tab === i ? 700 : 500,
            background: tab === i ? T.navy : T.card, color: tab === i ? '#FFF' : T.sub,
            border: `1px solid ${tab === i ? T.navy : T.border}`, cursor: 'pointer'
          }}>{t}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['All', 'Americas', 'Europe', 'Asia', 'Other'].map(r => (
          <button key={r} onClick={() => setRegionFilter(r)} style={{
            padding: '5px 12px', borderRadius: 14, fontSize: 12, fontWeight: regionFilter === r ? 700 : 400,
            background: regionFilter === r ? T.indigo : T.card, color: regionFilter === r ? '#FFF' : T.sub,
            border: `1px solid ${regionFilter === r ? T.indigo : T.border}`, cursor: 'pointer'
          }}>{r}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Policy Score by Country</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filteredCountries].sort((a, b) => b.policyScore - a.policyScore).slice(0, 12)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="country" width={80} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}/100`, 'Policy Score']} />
                <Bar dataKey="policyScore" radius={[0, 4, 4, 0]}>
                  {[...filteredCountries].sort((a, b) => b.policyScore - a.policyScore).slice(0, 12).map((c, i) => (
                    <Cell key={i} fill={c.policyScore >= 80 ? T.green : c.policyScore >= 60 ? T.teal : T.amber} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Annual Installations vs Local Manufacturing (GW)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="annualInstall" name="Annual Install (GW)" label={{ value: 'Installations (GW)', position: 'insideBottom', offset: -4, fontSize: 11 }} tick={{ fontSize: 11 }} />
                <YAxis dataKey="localMfg" name="Local Mfg (GW)" label={{ value: 'Local Mfg (GW)', angle: -90, position: 'insideLeft', fontSize: 11 }} tick={{ fontSize: 11 }} />
                <ZAxis dataKey="policyScore" range={[30, 200]} />
                <Tooltip content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 700 }}>{d.country}</div>
                      <div>Install: {d.annualInstall} GW</div>
                      <div>Local Mfg: {d.localMfg} GW</div>
                      <div>Import Dep: {d.importDependency}%</div>
                    </div>
                  );
                }} />
                <Scatter data={filteredCountries} fill={T.blue} opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}`, gridColumn: '1/-1' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700 }}>Country Policy Details</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg }}>
                    {['Country', 'IRA Dom. Bonus', 'AD/CVD Tariff', 'NZIA Target', 'CBAM Risk', 'Import Dep.', 'Installs (GW)', 'Local Mfg (GW)', 'Policy Score'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCountries.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? T.card : T.bg }}>
                      <td style={{ padding: '7px 10px', fontWeight: 700 }}>{c.country}</td>
                      <td style={{ padding: '7px 10px', color: c.iraDomesticBonus > 0 ? T.green : T.sub }}>{c.iraDomesticBonus > 0 ? `+${c.iraDomesticBonus}%` : '—'}</td>
                      <td style={{ padding: '7px 10px', color: c.adCvdTariff > 100 ? T.red : c.adCvdTariff > 10 ? T.amber : T.sub, fontWeight: c.adCvdTariff > 0 ? 700 : 400 }}>{c.adCvdTariff > 0 ? `${c.adCvdTariff}%` : '—'}</td>
                      <td style={{ padding: '7px 10px', color: c.nziaTarget > 0 ? T.blue : T.sub }}>{c.nziaTarget > 0 ? `${c.nziaTarget}%` : '—'}</td>
                      <td style={{ padding: '7px 10px', color: c.cbamRisk >= 7 ? T.red : c.cbamRisk >= 5 ? T.amber : T.green }}>{c.cbamRisk}/10</td>
                      <td style={{ padding: '7px 10px' }}>{c.importDependency}%</td>
                      <td style={{ padding: '7px 10px' }}>{c.annualInstall}</td>
                      <td style={{ padding: '7px 10px' }}>{c.localMfg}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 700, color: c.policyScore >= 80 ? T.green : c.policyScore >= 60 ? T.teal : T.amber }}>{c.policyScore}/100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>IRA Incentive Calculator</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: T.sub, display: 'block', marginBottom: 6 }}>System Size (kW): {iraSizeKw.toLocaleString()}</label>
              <input type="range" min={100} max={500000} step={100} value={iraSizeKw}
                onChange={e => setIraSizeKw(Number(e.target.value))}
                style={{ width: '100%', accentColor: T.green }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {[
                { key: 'prevailingWage', label: 'Prevailing Wage & Apprenticeship (base 30%)' },
                { key: 'domestic', label: 'Domestic Content Adder (+10%)' },
                { key: 'energyCommunity', label: 'Energy Community Adder (+10%)' },
                { key: 'lowIncome', label: 'Low-Income Community Adder (+10%)' },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={iraAdders[key]}
                    onChange={e => setIraAdders(prev => ({ ...prev, [key]: e.target.checked }))}
                    style={{ accentColor: T.green, width: 16, height: 16 }} />
                  {label}
                </label>
              ))}
            </div>
            <div style={{ background: `${T.green}15`, borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: T.sub, marginBottom: 4 }}>Applicable ITC Rate</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: T.green }}>{computedITC}%</div>
              <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Estimated Credit: <strong style={{ color: T.text }}>${Number(iraCredit).toLocaleString()}</strong></div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>Based on $1,800/kW installed cost assumption</div>
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>IRA Scenario Comparison</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={IRA_SCENARIOS} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 80]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="scenario" width={150} tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'ITC Rate']} />
                <Bar dataKey="itcPct" radius={[0, 4, 4, 0]}>
                  {IRA_SCENARIOS.map((s, i) => (
                    <Cell key={i} fill={s.itcPct >= 60 ? T.green : s.itcPct >= 40 ? T.teal : T.blue} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>AD/CVD Tariff Rates by Market (%)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filteredCountries].filter(c => c.adCvdTariff > 0).sort((a, b) => b.adCvdTariff - a.adCvdTariff)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="country" width={80} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'AD/CVD Tariff']} />
                <Bar dataKey="adCvdTariff" radius={[0, 4, 4, 0]}>
                  {filteredCountries.filter(c => c.adCvdTariff > 0).sort((a, b) => b.adCvdTariff - a.adCvdTariff).map((c, i) => (
                    <Cell key={i} fill={c.adCvdTariff >= 100 ? T.red : c.adCvdTariff >= 30 ? T.amber : T.gold} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>US AD/CVD Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { year: '2012', event: 'USITC initial AD/CVD duties — China cells/modules; avg ~30%', color: T.amber },
                { year: '2015', event: 'Second round duties expanded; China ~165% combined rate', color: T.red },
                { year: '2018', event: 'Section 201 safeguard tariffs — additional 30% on all origins', color: T.red },
                { year: '2022', event: 'Biden expands tariffs to Vietnam/Malaysia/Thailand/Cambodia ~15%', color: T.amber },
                { year: '2022', event: 'Uyghur UFLPA enforcement tightened import screening', color: T.indigo },
                { year: '2024', event: 'AD/CVD expanded; SE Asia evasion investigations; peak ~254% combined', color: T.red },
                { year: '2025', event: 'Section 301 list updated; IRA domestic content incentives activated', color: T.green },
              ].map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '7px 12px', borderRadius: 7, background: T.bg, borderLeft: `3px solid ${e.color}` }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: e.color, whiteSpace: 'nowrap' }}>{e.year}</span>
                  <span style={{ fontSize: 11, color: T.sub }}>{e.event}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>EU NZIA 40% Local Content Progress</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { metric: 'Target 2030', target: 40, current: 6 },
                { metric: 'Cell Production', target: 40, current: 3 },
                { metric: 'Module Assembly', target: 40, current: 9 },
                { metric: 'Wafer Production', target: 40, current: 1.5 },
                { metric: 'Inverters', target: 40, current: 18 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="metric" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: '%', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="target" name="NZIA 2030 Target (%)" fill={T.border} radius={[4, 4, 0, 0]} />
                <Bar dataKey="current" name="Current EU Share (%)" fill={T.blue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>NZIA Key Provisions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Regulation', val: 'EU Net-Zero Industry Act (NZIA)', color: T.navy },
                { label: 'Target', val: '40% domestic manufacturing by 2030', color: T.blue },
                { label: 'Scope', val: 'Solar PV, wind, batteries, heat pumps, electrolysers', color: T.teal },
                { label: 'Strategic Projects', val: 'Fast-track permitting <18 months', color: T.green },
                { label: 'Public Procurement', val: 'Resilience criteria in tender scoring', color: T.indigo },
                { label: 'Challenge', val: 'Chinese modules 70%+ below EU cost of mfg', color: T.red },
                { label: 'Investment needed', val: '€20bn+ to reach 40% EU cell production', color: T.amber },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderRadius: 6, background: T.bg, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: T.sub }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: r.color, maxWidth: 220, textAlign: 'right' }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>CBAM Risk Score by Country</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filteredCountries].sort((a, b) => b.cbamRisk - a.cbamRisk)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="country" width={80} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}/10`, 'CBAM Risk']} />
                <Bar dataKey="cbamRisk" radius={[0, 4, 4, 0]}>
                  {[...filteredCountries].sort((a, b) => b.cbamRisk - a.cbamRisk).map((c, i) => (
                    <Cell key={i} fill={c.cbamRisk >= 7 ? T.red : c.cbamRisk >= 5 ? T.amber : T.green} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>CBAM Solar PV Implications</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'CBAM Phase-in', val: 'Reporting phase 2023–2025', color: T.amber },
                { label: 'Full enforcement', val: 'From January 2026', color: T.red },
                { label: 'Solar PV scope', val: 'Wafers/cells classified under CBAM Annex I', color: T.navy },
                { label: 'Carbon price', val: '~€65/tCO2e (EU ETS 2024)', color: T.blue },
                { label: 'China module impact', val: '~€0.02–0.04/Wp additional cost', color: T.amber },
                { label: 'REC/Green H2', val: 'Certifiable to reduce CBAM liability', color: T.green },
                { label: 'Exemption', val: 'RE-powered manufacturing may qualify', color: T.teal },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderRadius: 6, background: T.bg, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: T.sub }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: r.color }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Import Dependency vs Local Manufacturing</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="importDependency" name="Import Dependency (%)" label={{ value: 'Import Dependency (%)', position: 'insideBottom', offset: -4, fontSize: 11 }} tick={{ fontSize: 11 }} />
                <YAxis dataKey="localMfg" name="Local Mfg (GW)" label={{ value: 'Local Mfg (GW)', angle: -90, position: 'insideLeft', fontSize: 11 }} tick={{ fontSize: 11 }} />
                <Tooltip content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0]?.payload;
                  return <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}><div style={{ fontWeight: 700 }}>{d.country}</div><div>Import Dep: {d.importDependency}%</div><div>Local Mfg: {d.localMfg} GW</div></div>;
                }} />
                <Scatter data={filteredCountries} fill={T.teal} opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.card, borderRadius: 12, padding: 20, border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>2024 Global Installation Leaders (GW)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...filteredCountries].sort((a, b) => b.annualInstall - a.annualInstall).slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="country" width={80} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} GW`, 'Annual Install']} />
                <Bar dataKey="annualInstall" radius={[0, 4, 4, 0]}>
                  {[...filteredCountries].sort((a, b) => b.annualInstall - a.annualInstall).slice(0, 10).map((c, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

const COLORS = [T.blue, T.teal, T.red, T.green, T.indigo, T.amber, T.gold, T.sage, T.navy, T.sub];
