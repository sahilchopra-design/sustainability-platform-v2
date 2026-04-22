import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = (seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };
const T = { bg: '#0f1117', surface: '#1a1d27', surfaceH: '#22263a', border: '#2a2f45', borderL: '#1e2235', navy: '#1e3a5f', gold: '#d4a843', sage: '#2d6a4f', teal: '#0d4f5c', text: '#e8e0d0', textSec: '#a89880', textMut: '#6b6050', red: '#c0392b', green: '#27ae60', amber: '#e67e22', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace" };

const SECTORS = [
  { id: 'salmon', name: 'Atlantic Salmon (Cage)', country: 'Norway/Chile/Canada', productionMt: 2.8, climRiskScore: 72, acidRisk: 68, tempRisk: 74, stormRisk: 55, feedCost: 42, certPremium: 18, ascCert: 68, mscCert: 0, co2KgPerKg: 3.2, financingGbn: 4.8 },
  { id: 'shrimp', name: 'Shrimp (Tropical)', country: 'Vietnam/Indonesia/Thailand', productionMt: 5.4, climRiskScore: 81, acidRisk: 44, tempRisk: 88, stormRisk: 76, feedCost: 38, certPremium: 12, ascCert: 22, mscCert: 0, co2KgPerKg: 5.1, financingGbn: 3.2 },
  { id: 'oyster', name: 'Pacific Oyster (Shell)', country: 'France/USA/Japan', productionMt: 0.65, climRiskScore: 88, acidRisk: 95, tempRisk: 72, stormRisk: 58, feedCost: 8, certPremium: 22, ascCert: 31, mscCert: 45, co2KgPerKg: 0.6, financingGbn: 0.5 },
  { id: 'tilapia', name: 'Tilapia (Freshwater)', country: 'China/Egypt/Indonesia', productionMt: 7.2, climRiskScore: 61, acidRisk: 12, tempRisk: 68, stormRisk: 42, feedCost: 28, certPremium: 8, ascCert: 14, mscCert: 0, co2KgPerKg: 1.8, financingGbn: 2.1 },
  { id: 'seaweed', name: 'Seaweed (Kelp/Dulse)', country: 'China/Indonesia/Korea', productionMt: 35.0, climRiskScore: 44, acidRisk: 38, tempRisk: 48, stormRisk: 32, feedCost: 2, certPremium: 35, ascCert: 8, mscCert: 22, co2KgPerKg: -1.2, financingGbn: 1.8 },
  { id: 'mussels', name: 'Blue Mussels (Rope)', country: 'Spain/Denmark/NZ', productionMt: 0.82, climRiskScore: 66, acidRisk: 72, tempRisk: 54, stormRisk: 62, feedCost: 6, certPremium: 16, ascCert: 44, mscCert: 38, co2KgPerKg: 0.3, financingGbn: 0.4 },
];

const ACID_SCENARIOS = [
  { year: 2025, ph: 8.05, aragoniteSat: 2.8, shellformationImpact: -5 },
  { year: 2030, ph: 8.01, aragoniteSat: 2.4, shellformationImpact: -12 },
  { year: 2040, ph: 7.95, aragoniteSat: 2.0, shellformationImpact: -22 },
  { year: 2050, ph: 7.89, aragoniteSat: 1.6, shellformationImpact: -35 },
  { year: 2060, ph: 7.82, aragoniteSat: 1.2, shellformationImpact: -52 },
  { year: 2075, ph: 7.74, aragoniteSat: 0.9, shellformationImpact: -72 },
  { year: 2100, ph: 7.65, aragoniteSat: 0.6, shellformationImpact: -90 },
];

const FINANCE_INSTRUMENTS = [
  { name: 'ASC/MSC-Linked Green Loan', rate: 'SOFR+180-280bps', trigger: 'ASC/MSC certification maintained', size: '$5–100M', tenor: '7yr' },
  { name: 'Aquaculture Improvement Project (AIP) Loan', rate: 'SOFR+220-320bps', trigger: 'AIP milestone delivery', size: '$2–30M', tenor: '5yr' },
  { name: 'IFC / ADB Blue Finance', rate: 'Fixed 4.5-6.5%', trigger: 'Responsible Fisheries Standards', size: '$10–150M', tenor: '10yr' },
  { name: 'FAO Blue Finance Facility', rate: 'Concessional 2-3%', trigger: 'SIDS / developing nations', size: '$1–20M', tenor: '15yr' },
  { name: 'Catastrophe Bond (Aquaculture)', rate: 'Fixed 8-14%', trigger: 'Parametric storm/temp trigger', size: '$10–200M', tenor: '3yr' },
  { name: 'Sustainability-Linked Bond', rate: 'Fixed ± step-up', trigger: 'CO2/kg reduction + ASC target', size: '$100M+', tenor: '5-10yr' },
];

const CERTIFICATION_PREMIUM = [
  { cert: 'ASC (Aquaculture)', premiumPct: 18, marketAccess: 'EU/US retail premium', yearsToAchieve: 2.5, costKUsd: 45 },
  { cert: 'MSC (Wild Capture)', premiumPct: 14, marketAccess: 'Global premium retail', yearsToAchieve: 3.0, costKUsd: 65 },
  { cert: 'Best Aquaculture Practices (BAP)', premiumPct: 10, marketAccess: 'US foodservice', yearsToAchieve: 1.5, costKUsd: 22 },
  { cert: 'Organic Aquaculture (EU)', premiumPct: 32, marketAccess: 'EU organic market', yearsToAchieve: 3.0, costKUsd: 55 },
  { cert: 'GlobalG.A.P.', premiumPct: 8, marketAccess: 'European supermarkets', yearsToAchieve: 1.0, costKUsd: 18 },
  { cert: 'Friend of the Sea', premiumPct: 6, marketAccess: 'Italy/Spain/Brazil', yearsToAchieve: 0.5, costKUsd: 8 },
];

const TEMP_STRESS_CURVE = [
  { tempC: 14, salmonGrowthIdx: 100, shrimpGrowthIdx: 42, mortRisk: 2 },
  { tempC: 16, salmonGrowthIdx: 112, shrimpGrowthIdx: 68, mortRisk: 3 },
  { tempC: 18, salmonGrowthIdx: 108, shrimpGrowthIdx: 88, mortRisk: 5 },
  { tempC: 20, salmonGrowthIdx: 88, shrimpGrowthIdx: 100, mortRisk: 8 },
  { tempC: 22, salmonGrowthIdx: 62, shrimpGrowthIdx: 98, mortRisk: 14 },
  { tempC: 24, salmonGrowthIdx: 28, shrimpGrowthIdx: 88, mortRisk: 28 },
  { tempC: 26, salmonGrowthIdx: 8, shrimpGrowthIdx: 68, mortRisk: 48 },
  { tempC: 28, salmonGrowthIdx: 2, shrimpGrowthIdx: 42, mortRisk: 72 },
];

const TABS = ['Overview', 'Sector Analysis', 'Acidification Risk', 'Temperature Stress', 'Certification Premium', 'Finance Instruments', 'Carbon Intensity', 'Feed & Input Risk', 'Stress Scenario', 'Deal Screener'];

function calcAscLoanSaving({ loanSize, baseRate, certPremium }) {
  const annSaving = loanSize * (certPremium / 10000);
  return annSaving;
}
function calcCarbonCost({ productionT, co2KgPerKg, carbonPrice }) {
  return productionT * 1000 * co2KgPerKg * carbonPrice / 1e6;
}

const Kpi = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.gold, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

export default function AquacultureClimateFinancePage() {
  const [tab, setTab] = useState(0);
  const [selSector, setSelSector] = useState('salmon');
  const [loanSize, setLoanSize] = useState(50);
  const [carbonPrice, setCarbonPrice] = useState(100);
  const [productionT, setProductionT] = useState(5000);

  const sec = SECTORS.find(s => s.id === selSector) || SECTORS[0];
  const carbonCost = calcCarbonCost({ productionT, co2KgPerKg: sec.co2KgPerKg, carbonPrice });
  const totalProduction = SECTORS.reduce((s, x) => s + x.productionMt, 0);
  const avgClimRisk = SECTORS.length > 0 ? SECTORS.reduce((s, x) => s + x.climRiskScore, 0) / SECTORS.length : 0;
  const riskColor = (s) => s >= 75 ? T.red : s >= 60 ? T.amber : T.green;

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, padding: 24 }}>
      <div style={{ borderBottom: `2px solid ${T.gold}`, paddingBottom: 12, marginBottom: 20 }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, letterSpacing: 2 }}>EP-DZ4 · OCEAN & BLUE ECONOMY FINANCE</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0', color: T.text }}>Aquaculture & Ocean Food System Finance</h1>
        <div style={{ fontSize: 12, color: T.textSec }}>ASC/MSC Certification · Ocean Acidification Risk · Temperature Stress · Carbon Intensity · Sustainable Seafood Finance · 10 Tabs</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Kpi label="GLOBAL AQUACULTURE" value={`${totalProduction.toFixed(0)}Mt/yr`} sub="6 sectors tracked" />
        <Kpi label="AVG CLIMATE RISK" value={`${avgClimRisk.toFixed(0)}/100`} sub="Weighted severity" color={riskColor(avgClimRisk)} />
        <Kpi label="ASC CERTIFIED" value="~30%" sub="Global production volume" color={T.sage} />
        <Kpi label="SEAWEED CO₂" value="-1.2 kgCO₂/kg" sub="Carbon-negative food source" color={T.green} />
        <Kpi label="FINANCING TRACKED" value="$12.8Bn" sub="Across 6 sectors" color={T.teal} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '6px 14px', borderRadius: 4, border: `1px solid ${tab === i ? T.gold : T.border}`, background: tab === i ? T.navy : T.surface, color: tab === i ? T.gold : T.textSec, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>CLIMATE RISK BY SECTOR</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SECTORS}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize: 8 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} domain={[0, 100]} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Bar dataKey="climRiskScore" fill={T.amber} name="Climate Risk (0-100)" /></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>OCEAN ACIDIFICATION PATHWAY (pH)</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={ACID_SCENARIOS}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} domain={[7.5, 8.2]} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><ReferenceLine y={7.8} stroke={T.red} strokeDasharray="3 3" label={{ value: 'Critical pH 7.8', fill: T.red, fontSize: 10 }} /><Line type="monotone" dataKey="ph" stroke={T.teal} strokeWidth={2} dot={{ fill: T.teal, r: 4 }} name="Ocean pH (SSP5-8.5)" /></LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, gridColumn: '1/-1' }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>SECTOR DASHBOARD</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {SECTORS.map((s, i) => (
                <div key={i} style={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: T.textMut, marginTop: 2 }}>{s.country}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <div><div style={{ fontSize: 10, color: T.textMut }}>Output</div><div style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: T.mono }}>{s.productionMt}Mt</div></div>
                    <div><div style={{ fontSize: 10, color: T.textMut }}>Risk</div><div style={{ fontSize: 14, fontWeight: 700, color: riskColor(s.climRiskScore), fontFamily: T.mono }}>{s.climRiskScore}</div></div>
                    <div><div style={{ fontSize: 10, color: T.textMut }}>CO₂/kg</div><div style={{ fontSize: 14, fontWeight: 700, color: s.co2KgPerKg < 0 ? T.green : T.amber, fontFamily: T.mono }}>{s.co2KgPerKg}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SECTORS.map(s => (
              <button key={s.id} onClick={() => setSelSector(s.id)} style={{ padding: '6px 12px', borderRadius: 4, border: `1px solid ${selSector === s.id ? T.gold : T.border}`, background: selSector === s.id ? T.navy : T.surface, color: selSector === s.id ? T.gold : T.text, fontFamily: T.mono, fontSize: 11, cursor: 'pointer' }}>{s.name.split(' ')[0]}</button>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold, marginBottom: 4 }}>{sec.name}</div>
            <div style={{ fontSize: 11, color: T.textSec, marginBottom: 16 }}>{sec.country}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <Kpi label="PRODUCTION" value={`${sec.productionMt}Mt/yr`} sub="Global output" />
              <Kpi label="CLIMATE RISK" value={`${sec.climRiskScore}/100`} sub="Composite score" color={riskColor(sec.climRiskScore)} />
              <Kpi label="CO₂ INTENSITY" value={`${sec.co2KgPerKg} kg/kg`} sub="Farm-gate" color={sec.co2KgPerKg < 0 ? T.green : T.amber} />
              <Kpi label="FINANCING" value={`$${sec.financingGbn}Bn`} sub="Tracked deals" color={T.teal} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
              {[['Acidification Risk', sec.acidRisk], ['Temperature Risk', sec.tempRisk], ['Storm Risk', sec.stormRisk]].map(([label, val]) => (
                <div key={label} style={{ background: T.surfaceH, borderRadius: 6, padding: 12 }}>
                  <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: riskColor(val), fontFamily: T.mono }}>{val}/100</div>
                  <div style={{ background: T.borderL, borderRadius: 4, height: 6, marginTop: 6 }}><div style={{ background: riskColor(val), width: `${val}%`, height: 6, borderRadius: 4 }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>OCEAN ACIDIFICATION — pH TRAJECTORY & SHELL FORMATION IMPACT</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={ACID_SCENARIOS}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" stroke={T.textMut} tick={{ fontSize: 10 }} /><YAxis yAxisId="left" stroke={T.textMut} tick={{ fontSize: 10 }} domain={[7.5, 8.2]} /><YAxis yAxisId="right" orientation="right" stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><ReferenceLine yAxisId="left" y={7.8} stroke={T.red} strokeDasharray="3 3" /><Line yAxisId="left" type="monotone" dataKey="ph" stroke={T.teal} strokeWidth={2} name="Ocean pH" /><Line yAxisId="right" type="monotone" dataKey="shellformationImpact" stroke={T.amber} strokeWidth={2} name="Shell Formation Impact (%)" /></LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[['Oysters (highest risk)', sec.acidRisk, T.red], ['Mussels (high risk)', 72, T.amber], ['Salmon (medium risk)', 68, T.amber], ['Shrimp (lower risk)', 44, T.sage], ['Tilapia (freshwater, minimal)', 12, T.green], ['Seaweed (may benefit)', 38, T.teal]].map(([label, risk, color]) => (
              <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: 12, color: T.text }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: T.mono, marginTop: 6 }}>{risk}/100</div>
                <div style={{ background: T.borderL, borderRadius: 4, height: 6, marginTop: 6 }}><div style={{ background: color, width: `${risk}%`, height: 6, borderRadius: 4 }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>TEMPERATURE STRESS CURVES — GROWTH INDEX & MORTALITY RISK</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={TEMP_STRESS_CURVE}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="tempC" stroke={T.textMut} tick={{ fontSize: 10 }} label={{ value: '°C', position: 'insideBottom', offset: -5, fill: T.textMut, fontSize: 10 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Legend /><Line type="monotone" dataKey="salmonGrowthIdx" stroke={T.teal} strokeWidth={2} name="Salmon Growth Index" /><Line type="monotone" dataKey="shrimpGrowthIdx" stroke={T.amber} strokeWidth={2} name="Shrimp Growth Index" /><Line type="monotone" dataKey="mortRisk" stroke={T.red} strokeWidth={2} strokeDasharray="4 2" name="Mortality Risk (%)" /></LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[['Salmon Optimal', '14-18°C', T.teal, 'Exceeding causes lice, algal blooms'], ['Shrimp Optimal', '20-26°C', T.amber, 'Below 18°C slows metabolism 40%'], ['Critical Threshold', '>28°C', T.red, 'Mass mortality events >50% likely'], ['SSP5-8.5 2050', '+1.8°C avg', T.sage, 'All cage sites face major impact']].map(([label, val, color, note]) => (
              <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: T.mono, marginTop: 6 }}>{val}</div>
                <div style={{ fontSize: 10, color: T.textSec, marginTop: 6 }}>{note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>CERTIFICATION PREMIUM ANALYSIS</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={CERTIFICATION_PREMIUM}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="cert" stroke={T.textMut} tick={{ fontSize: 8 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Bar dataKey="premiumPct" fill={T.sage} name="Price Premium (%)" /></BarChart>
            </ResponsiveContainer>
          </div>
          {CERTIFICATION_PREMIUM.map((c, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: T.mono, fontSize: 12, color: T.gold }}>{c.cert}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{c.marketAccess}</div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: T.textMut }}>PREMIUM</div><div style={{ fontSize: 18, fontWeight: 700, color: T.green, fontFamily: T.mono }}>{c.premiumPct}%</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: T.textMut }}>YEARS</div><div style={{ fontSize: 18, fontWeight: 700, color: T.amber, fontFamily: T.mono }}>{c.yearsToAchieve}</div></div>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: T.textMut }}>COST</div><div style={{ fontSize: 18, fontWeight: 700, color: T.teal, fontFamily: T.mono }}>${c.costKUsd}K</div></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {FINANCE_INSTRUMENTS.map((fi, i) => (
            <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontFamily: T.mono, fontSize: 13, color: T.gold, marginBottom: 8 }}>{fi.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[['RATE', fi.rate], ['SIZE', fi.size], ['TENOR', fi.tenor], ['TRIGGER', fi.trigger]].map(([label, val]) => (
                  <div key={label} style={{ background: T.surfaceH, borderRadius: 4, padding: 10 }}>
                    <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>{label}</div>
                    <div style={{ fontSize: 11, color: T.text, marginTop: 3 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 6 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 16 }}>CARBON COST CALCULATOR</div>
            {[['Annual Production (tonnes)', productionT, setProductionT, 100, 100000, 100], ['Carbon Price ($/tCO₂)', carbonPrice, setCarbonPrice, 20, 300]].map(([label, val, set, min, max, step = 1]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: T.textMut, marginBottom: 4, fontFamily: T.mono }}>{label}: <span style={{ color: T.gold }}>{val.toLocaleString()}</span></div>
                <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(Number(e.target.value))} style={{ width: '100%', accentColor: T.gold }} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.textMut, marginBottom: 6, fontFamily: T.mono }}>SECTOR</div>
              <select value={selSector} onChange={e => setSelSector(e.target.value)} style={{ background: T.surfaceH, color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 10px', width: '100%', fontFamily: T.mono, fontSize: 11 }}>
                {SECTORS.map(s => <option key={s.id} value={s.id}>{s.name} ({s.co2KgPerKg} kg CO₂/kg)</option>)}
              </select>
            </div>
            <div style={{ background: T.navy, borderRadius: 8, padding: 16 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textMut, marginBottom: 8 }}>CARBON EXPOSURE</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Total CO₂</div><div style={{ fontSize: 18, fontWeight: 700, color: sec.co2KgPerKg < 0 ? T.green : T.amber, fontFamily: T.mono }}>{(productionT * sec.co2KgPerKg / 1000).toFixed(1)} tCO₂</div></div>
                <div><div style={{ fontSize: 10, color: T.textMut }}>Carbon Cost</div><div style={{ fontSize: 18, fontWeight: 700, color: sec.co2KgPerKg < 0 ? T.green : T.red, fontFamily: T.mono }}>{sec.co2KgPerKg < 0 ? '+$' : '$'}{Math.abs(carbonCost).toFixed(2)}M</div></div>
              </div>
            </div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>CO₂ INTENSITY BY SECTOR (kgCO₂/kg protein)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SECTORS}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize: 8 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><ReferenceLine y={0} stroke={T.border} /><Bar dataKey="co2KgPerKg" fill={T.teal} name="CO₂/kg" /></BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12, background: T.surfaceH, borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.mono, marginBottom: 6 }}>BENCHMARK COMPARISON</div>
              {[['Beef', 27.0, T.red], ['Pork', 7.6, T.amber], ['Chicken', 6.9, T.amber], ['Salmon (farmed)', 3.2, T.sage], ['Mussels', 0.3, T.green], ['Seaweed', -1.2, T.teal]].map(([label, co2, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: T.textSec }}>{label}</span><span style={{ color, fontFamily: T.mono }}>{co2} kg CO₂/kg</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 7 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>FEED & INPUT RISK</div>
            {[['Wild Fishmeal Price Volatility', 'Annual: ±35% · Trend: Rising · Driver: El Niño/stock collapse', T.amber], ['Soy Meal (Climate Transition)', 'Amazon deforestation nexus · EUDR compliance risk 2025', T.red], ['Omega-3 Supply (Fish Oil)', '80% from wild capture · At risk from acidification + temp', T.amber], ['Alternative Proteins (Insect/Algae)', 'Cost parity 2028–2030 est. · Climate-resilient supply', T.green], ['Water Availability (Freshwater)', 'RCP8.5: 30% of inland farms face water stress by 2050', T.red], ['Energy Costs (Recirculating)', 'RAS systems: 40-60% OPEX = energy · Grid decarbonization key', T.teal]].map(([label, desc, color]) => (
              <div key={label} style={{ background: T.surfaceH, borderRadius: 6, padding: 12, marginBottom: 10 }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, color }}>{label}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 14 }}>FEED COST AS % OPEX</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SECTORS}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize: 8 }} /><YAxis stroke={T.textMut} tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6 }} /><Bar dataKey="feedCost" fill={T.amber} name="Feed Cost (% OPEX)" /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 8 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>CLIMATE STRESS SCENARIO MATRIX</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Scenario', 'Temp Rise', 'pH Drop', 'Salmon Impact', 'Shrimp Impact', 'Oyster Impact', 'Revenue Hit'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textMut, fontFamily: T.mono }}>{h}</th>)}
              </tr></thead>
              <tbody>{[
                ['Orderly (1.5°C)', '+0.8°C', '-0.1', '-8%', '+5%', '-15%', '-3%'],
                ['Disorderly (2.0°C)', '+1.2°C', '-0.18', '-18%', '+2%', '-28%', '-9%'],
                ['Hot House (3.0°C)', '+2.0°C', '-0.28', '-38%', '-12%', '-52%', '-22%'],
                ['Catastrophic (4.0°C+)', '+3.2°C', '-0.45', '-68%', '-35%', '-85%', '-45%'],
              ].map(([scenario, temp, ph, salmon, shrimp, oyster, revenue], i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                  <td style={{ padding: '8px 10px', color: T.gold, fontFamily: T.mono }}>{scenario}</td>
                  <td style={{ padding: '8px 10px', color: T.amber, fontFamily: T.mono }}>{temp}</td>
                  <td style={{ padding: '8px 10px', color: T.teal, fontFamily: T.mono }}>{ph}</td>
                  <td style={{ padding: '8px 10px', color: T.textSec }}>{salmon}</td>
                  <td style={{ padding: '8px 10px', color: T.textSec }}>{shrimp}</td>
                  <td style={{ padding: '8px 10px', color: T.red }}>{oyster}</td>
                  <td style={{ padding: '8px 10px', color: T.red, fontFamily: T.mono }}>{revenue}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 9 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.gold, marginBottom: 12 }}>DEAL SCREENER — AQUACULTURE CREDIT ASSESSMENT</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Borrower', 'Sector', 'Country', 'Production', 'ASC%', 'Clim Risk', 'CO₂/kg', 'Financing', 'Status'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textMut, fontFamily: T.mono }}>{h}</th>)}
              </tr></thead>
              <tbody>{SECTORS.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${T.borderL}`, background: i % 2 === 0 ? 'transparent' : T.surfaceH }}>
                  <td style={{ padding: '8px 10px', color: T.gold, fontFamily: T.mono }}>{s.name.split(' ')[0]} Co.</td>
                  <td style={{ padding: '8px 10px', color: T.text }}>{s.name.split(' ')[0]}</td>
                  <td style={{ padding: '8px 10px', color: T.textSec }}>{s.country.split('/')[0]}</td>
                  <td style={{ padding: '8px 10px', color: T.text, fontFamily: T.mono }}>{s.productionMt}Mt</td>
                  <td style={{ padding: '8px 10px', color: s.ascCert > 30 ? T.green : T.amber, fontFamily: T.mono }}>{s.ascCert}%</td>
                  <td style={{ padding: '8px 10px', color: riskColor(s.climRiskScore), fontFamily: T.mono }}>{s.climRiskScore}</td>
                  <td style={{ padding: '8px 10px', color: s.co2KgPerKg < 0 ? T.green : T.amber, fontFamily: T.mono }}>{s.co2KgPerKg}</td>
                  <td style={{ padding: '8px 10px', color: T.teal, fontFamily: T.mono }}>${s.financingGbn}Bn</td>
                  <td style={{ padding: '8px 10px', color: s.climRiskScore < 65 ? T.green : s.climRiskScore < 78 ? T.amber : T.red }}>{s.climRiskScore < 65 ? 'ELIGIBLE' : s.climRiskScore < 78 ? 'CONDITIONAL' : 'WATCH'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
