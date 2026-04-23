import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const sr = (s) => Math.abs(Math.sin(s * 9301 + 49297) * 233280) % 1;

const BASINS = Array.from({ length: 20 }, (_, i) => ({
  name: ['Indus','Yellow River','Tigris-Euphrates','Colorado','Murray-Darling','Ganges','Nile','Niger','Volta','Jordan',
    'Amu Darya','Mekong','Yangtze','Rhine','Danube','Senegal','Okavango','Zambezi','São Francisco','Paraná'][i],
  region: ['South Asia','East Asia','Middle East','N. America','Oceania','South Asia','Africa','Africa','Africa','Middle East',
    'Central Asia','SE Asia','East Asia','Europe','Europe','Africa','Africa','Africa','S. America','S. America'][i],
  waterStress: +(sr(i * 7) * 4 + 1).toFixed(1),
  irrigationShare: +(sr(i * 11) * 70 + 20).toFixed(0),
  energyForWater: +(sr(i * 13) * 30 + 5).toFixed(1),
  foodCalorieRisk: +(sr(i * 17) * 50 + 10).toFixed(0),
  population: +(sr(i * 19) * 400 + 20).toFixed(0),
  gdpPerCapita: +(sr(i * 23) * 20000 + 2000).toFixed(0),
}));

const SSP_SCENARIOS = [
  { name: 'SSP1-2.6 (Sust.)', color: '#22c55e', waterDemand2050: +8, foodCalories2050: -5, energyIntensity2050: -25 },
  { name: 'SSP2-4.5 (Mid.)', color: '#f59e0b', waterDemand2050: +18, foodCalories2050: -12, energyIntensity2050: +5 },
  { name: 'SSP3-7.0 (Reg.)', color: '#ef4444', waterDemand2050: +32, foodCalories2050: -22, energyIntensity2050: +18 },
  { name: 'SSP5-8.5 (Fossil)', color: '#dc2626', waterDemand2050: +45, foodCalories2050: -35, energyIntensity2050: +30 },
];

const NEXUS_YEARS = [2020, 2022, 2024, 2026, 2028, 2030, 2035, 2040, 2045, 2050];

const ADAPT_MEASURES = [
  { name: 'Drip Irrigation', waterSave: 40, energySave: 25, foodGain: 12, cost: 800, coverage: 18 },
  { name: 'Rainwater Harvesting', waterSave: 22, energySave: 18, foodGain: 8, cost: 200, coverage: 35 },
  { name: 'Treated Wastewater Reuse', waterSave: 35, energySave: -10, foodGain: 15, cost: 1200, coverage: 12 },
  { name: 'Desalination (solar)', waterSave: 60, energySave: -5, foodGain: 20, cost: 3500, coverage: 5 },
  { name: 'Solar Irrigation Pumps', waterSave: 12, energySave: 55, foodGain: 10, cost: 650, coverage: 22 },
  { name: 'Aquifer Recharge', waterSave: 28, energySave: 20, foodGain: 7, cost: 400, coverage: 14 },
  { name: 'Crop Diversification', waterSave: 18, energySave: 8, foodGain: 18, cost: 120, coverage: 40 },
  { name: 'Precision Fertilization', waterSave: 10, energySave: 15, foodGain: 14, cost: 350, coverage: 28 },
];

const STRESS_SCENARIOS = [
  { scenario: 'Baseline 2024', water: 4.0, food: 0, energy: 0 },
  { scenario: '+2°C by 2050', water: 4.8, food: -8, energy: +12 },
  { scenario: '+3°C by 2070', water: 5.6, food: -18, energy: +22 },
  { scenario: 'Drought + Heat', water: 6.2, food: -28, energy: +18 },
  { scenario: 'Population +3Bn', water: 6.8, food: -32, energy: +30 },
  { scenario: 'Combined Stress', water: 7.4, food: -42, energy: +38 },
];

const T = { bg: '#0f1117', surface: '#1a1d2e', surfaceH: '#252840', border: '#2e3148',
  navy: '#3b4fd8', navyL: '#5a6de8', gold: '#d4a017', goldL: '#e8b830', sage: '#2d7a4f',
  sageL: '#3a9962', teal: '#0d9488', text: '#e8eaf0', textSec: '#9ca3af', textMut: '#6b7280',
  red: '#ef4444', green: '#22c55e', amber: '#f59e0b', font: "'Inter','sans-serif'", mono: "'JetBrains Mono','monospace'" };

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px' }}>
    <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.text, fontFamily: T.mono }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{sub}</div>}
  </div>
);

const TABS = ['Overview', 'Water Stress', 'Energy-Food', 'Irrigation', 'Nexus Risk', 'Stress Tests', 'Adaptation'];
const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 };
const h2 = { fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 16, marginTop: 0 };
const grid = (cols) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 24 });
const select = { background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: '6px 10px', fontSize: 12 };
const stressColor = (v) => v >= 5 ? T.red : v >= 3.5 ? T.amber : v >= 2.5 ? T.gold : T.green;

export default function WaterFoodEnergyNexusPage() {
  const [tab, setTab] = useState('Overview');
  const [region, setRegion] = useState('All');
  const [scenario, setScenario] = useState('SSP2-4.5 (Mid.)');

  const regions = ['All', ...new Set(BASINS.map(b => b.region))];
  const filteredBasins = region === 'All' ? BASINS : BASINS.filter(b => b.region === region);

  const stressData = useMemo(() => [...filteredBasins]
    .sort((a, b) => b.waterStress - a.waterStress)
    .slice(0, 10)
    .map(b => ({ name: b.name.split('-')[0].slice(0, 8), stress: b.waterStress, irrigShare: b.irrigationShare })),
    [filteredBasins]);

  const nexusData = useMemo(() => {
    const sc = SSP_SCENARIOS.find(s => s.name === scenario) || SSP_SCENARIOS[1];
    return NEXUS_YEARS.map((yr, i) => {
      const frac = (yr - 2020) / 30;
      return {
        year: yr,
        water: +(4.0 + frac * sc.waterDemand2050 / 10).toFixed(2),
        food: +(frac * sc.foodCalories2050).toFixed(1),
        energy: +(frac * sc.energyIntensity2050).toFixed(1),
      };
    });
  }, [scenario]);

  const adaptData = useMemo(() => ADAPT_MEASURES.map(m => ({
    name: m.name.split(' ').slice(0, 2).join(' '),
    waterSave: m.waterSave, energySave: m.energySave, foodGain: m.foodGain,
  })), []);

  const tabBar = { display: 'flex', gap: 4, marginBottom: 28, borderBottom: `1px solid ${T.border}` };
  const tabBtn = (active) => ({ padding: '10px 18px', fontSize: 13, fontWeight: active ? 600 : 400,
    color: active ? T.navyL : T.textSec, borderBottom: active ? `2px solid ${T.navyL}` : '2px solid transparent',
    cursor: 'pointer', background: 'none', border: 'none', marginBottom: -1 });

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: T.font, padding: '24px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: T.text }}>Water–Food–Energy Nexus</h1>
        <p style={{ margin: 0, color: T.textSec, fontSize: 13 }}>Water stress, irrigation efficiency &amp; cross-sector nexus risk across global river basins under climate scenarios</p>
      </div>
      <div style={tabBar}>{TABS.map(t => <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>{t}</button>)}</div>

      {tab === 'Overview' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="High Water Stress Basins" value={BASINS.filter(b => b.waterStress >= 4).length} sub={`of ${BASINS.length} tracked — severe/extreme`} color={T.red} />
            <KpiCard label="Avg Irrigation Share" value={`${(BASINS.reduce((a, b) => a + b.irrigationShare, 0) / BASINS.length).toFixed(0)}%`} sub="Water withdrawals for agriculture" color={T.teal} />
            <KpiCard label="Ag Energy Use" value="~30%" sub="Global energy in food & water systems" color={T.amber} />
            <KpiCard label="At-Risk Population" value={`${BASINS.filter(b => b.waterStress >= 3.5).reduce((a, b) => a + +b.population, 0).toLocaleString()}M`} sub="In high-stress basins" color={T.navy} />
          </div>
          <div style={card}>
            <h2 style={h2}>Top 10 High Water Stress Basins</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stressData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 7]} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="stress" name="Water Stress Score (0–7)" fill={T.red} radius={[3, 3, 0, 0]} />
                <Bar dataKey="irrigShare" name="Irrigation Share %" fill={T.teal} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Basin Water Stress Overview</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Basin','Region','Water Stress','Irrigation %','Energy/Water','Food Risk','Pop. (M)'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                  ))}</tr></thead>
                <tbody>{BASINS.slice(0, 12).map(b => (
                  <tr key={b.name} style={{ borderBottom: `1px solid ${T.border}22` }}>
                    <td style={{ padding: '4px 8px', color: T.text, fontWeight: 500 }}>{b.name}</td>
                    <td style={{ padding: '4px 8px', color: T.textSec, fontSize: 10 }}>{b.region}</td>
                    <td style={{ padding: '4px 8px', fontFamily: T.mono, fontWeight: 700, color: stressColor(b.waterStress) }}>{b.waterStress}</td>
                    <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.teal }}>{b.irrigationShare}%</td>
                    <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.amber }}>{b.energyForWater}%</td>
                    <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.red }}>{b.foodCalorieRisk}%</td>
                    <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.textSec }}>{b.population}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'Water Stress' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Region:</label>
            <select style={select} value={region} onChange={e => setRegion(e.target.value)}>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={grid(3)}>
            <KpiCard label="Basins Filtered" value={filteredBasins.length} sub={`${region} region`} color={T.navy} />
            <KpiCard label="Avg Water Stress" value={filteredBasins.length > 0 ? (filteredBasins.reduce((a, b) => a + b.waterStress, 0) / filteredBasins.length).toFixed(1) : '–'} sub="0–7 WRI Aqueduct scale" color={T.red} />
            <KpiCard label="At-Risk Pop." value={`${filteredBasins.reduce((a, b) => a + +b.population, 0).toLocaleString()}M`} sub="Total population in filtered basins" color={T.amber} />
          </div>
          <div style={card}>
            <h2 style={h2}>Water Stress vs Food Calorie Risk — Nexus Scatter</h2>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="waterStress" name="Water Stress" label={{ value: 'Water Stress (0–7)', position: 'insideBottom', offset: -5, fill: T.textSec, fontSize: 11 }} tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis dataKey="foodCalorieRisk" name="Food Calorie Risk %" label={{ value: 'Food Calorie Risk %', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Scatter data={filteredBasins} fill={T.red} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Basin Detail Table</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Basin','Region','Water Stress','Irrig %','Energy %','Food Risk %','Pop (M)','GDP/capita'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '5px 8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{filteredBasins.map(b => (
                <tr key={b.name} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '4px 8px', color: T.text, fontWeight: 500 }}>{b.name}</td>
                  <td style={{ padding: '4px 8px', color: T.textSec, fontSize: 10 }}>{b.region}</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, fontWeight: 700, color: stressColor(b.waterStress) }}>{b.waterStress}</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.teal }}>{b.irrigationShare}%</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.amber }}>{b.energyForWater}%</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.red }}>{b.foodCalorieRisk}%</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.textSec }}>{b.population}</td>
                  <td style={{ padding: '4px 8px', fontFamily: T.mono, color: T.textSec }}>${b.gdpPerCapita.toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Energy-Food' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="Energy for Irrigation" value="~10%" sub="Global electricity for water pumping" color={T.amber} />
            <KpiCard label="Food System Energy" value="~30%" sub="Share of global final energy" color={T.navy} />
            <KpiCard label="Avg Energy/Water" value={`${(BASINS.reduce((a, b) => a + b.energyForWater, 0) / BASINS.length).toFixed(1)}%`} sub="Energy as % of water op cost" color={T.gold} />
            <KpiCard label="Solar Pump Potential" value="$23Bn" sub="Global addressable market" color={T.green} />
          </div>
          <div style={card}>
            <h2 style={h2}>Energy Intensity by Basin (% of water opex)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={BASINS.slice(0, 12).map(b => ({ name: b.name.split('-')[0].slice(0, 8), energy: b.energyForWater, stress: b.waterStress * 10 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar yAxisId="left" dataKey="energy" name="Energy Intensity %" fill={T.amber} radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="stress" name="Water Stress ×10" fill={T.red} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Energy-Food-Water Nexus Trade-offs by Intervention</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={adaptData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="waterSave" name="Water Saved %" fill={T.teal} radius={[3, 3, 0, 0]} />
                <Bar dataKey="energySave" name="Energy Saved %" fill={T.amber} radius={[3, 3, 0, 0]} />
                <Bar dataKey="foodGain" name="Food Gain %" fill={T.green} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === 'Irrigation' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="Global Irrigated Area" value="324 Mha" sub="~20% of cropland, ~40% of production" color={T.teal} />
            <KpiCard label="Efficiency Gap" value="~45%" sub="Potential water savings via modernization" color={T.amber} />
            <KpiCard label="Drip Irrigation" value="18%" sub="Current global adoption rate" color={T.green} />
            <KpiCard label="Groundwater Share" value="~43%" sub="Of global irrigation withdrawals" color={T.navy} />
          </div>
          <div style={card}>
            <h2 style={h2}>Irrigation Share by Basin</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={BASINS.slice(0, 14).map(b => ({ name: b.name.split('-')[0].slice(0, 7), share: b.irrigationShare }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Bar dataKey="share" name="Irrigation %" fill={T.teal} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Irrigation Technology Comparison</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Technology','Efficiency %','Water Saving %','Energy Req.','Cost ($/ha)','Adoption %'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{[
                { tech: 'Flood Irrigation', eff: 45, waterSave: 0, energy: 'Low', cost: 50, adopt: 42 },
                { tech: 'Sprinkler', eff: 75, waterSave: 30, energy: 'Medium', cost: 450, adopt: 28 },
                { tech: 'Drip (Surface)', eff: 88, waterSave: 43, energy: 'Low', cost: 800, adopt: 12 },
                { tech: 'Micro-drip', eff: 95, waterSave: 50, energy: 'Low', cost: 1200, adopt: 6 },
                { tech: 'Subsurface Drip', eff: 97, waterSave: 52, energy: 'Low', cost: 2400, adopt: 3 },
                { tech: 'Precision Smart', eff: 95, waterSave: 50, energy: 'Medium', cost: 3500, adopt: 2 },
              ].map(t => (
                <tr key={t.tech} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '7px 8px', color: T.text, fontWeight: 500 }}>{t.tech}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.teal }}>{t.eff}%</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.green }}>{t.waterSave > 0 ? `+${t.waterSave}%` : '–'}</td>
                  <td style={{ padding: '7px 8px', color: T.textSec }}>{t.energy}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.amber }}>${t.cost}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.navyL }}>{t.adopt}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Nexus Risk' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: T.textSec }}>Scenario:</label>
            <select style={select} value={scenario} onChange={e => setScenario(e.target.value)}>
              {SSP_SCENARIOS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div style={card}>
            <h2 style={h2}>Water–Food–Energy Nexus Pathway to 2050</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={nexusData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="water" name="Water Stress Score" stroke={T.teal} fill={`${T.teal}33`} strokeWidth={2} />
                <Area yAxisId="right" type="monotone" dataKey="food" name="Food Calorie Change %" stroke={T.red} fill={`${T.red}22`} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="energy" name="Energy Intensity Δ%" stroke={T.amber} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Scenario Nexus Impact Comparison</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Scenario','Water Demand 2050','Food Calories 2050','Energy Intensity 2050'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{SSP_SCENARIOS.map(sc => (
                <tr key={sc.name} style={{ borderBottom: `1px solid ${T.border}22` }}>
                  <td style={{ padding: '7px 8px', color: sc.color, fontWeight: 600 }}>{sc.name}</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: sc.waterDemand2050 > 25 ? T.red : T.amber }}>{sc.waterDemand2050 > 0 ? '+' : ''}{sc.waterDemand2050}%</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.red }}>{sc.foodCalories2050}%</td>
                  <td style={{ padding: '7px 8px', fontFamily: T.mono, color: sc.energyIntensity2050 > 0 ? T.amber : T.green }}>{sc.energyIntensity2050 > 0 ? '+' : ''}{sc.energyIntensity2050}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Stress Tests' && (
        <>
          <div style={grid(3)}>
            <KpiCard label="Worst Case Water Stress" value={`${Math.max(...STRESS_SCENARIOS.map(s => s.water)).toFixed(1)}`} sub="Combined stress scenario (0–7 scale)" color={T.red} />
            <KpiCard label="Max Food Loss" value={`${Math.min(...STRESS_SCENARIOS.map(s => s.food))}%`} sub="Calorie availability reduction" color={T.amber} />
            <KpiCard label="Max Energy Premium" value={`+${Math.max(...STRESS_SCENARIOS.map(s => s.energy))}%`} sub="Energy intensity increase" color={T.navy} />
          </div>
          <div style={card}>
            <h2 style={h2}>Nexus Stress Scenario Comparison</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={STRESS_SCENARIOS.map(s => ({ name: s.scenario.split(' ').slice(0, 2).join(' '), water: s.water, food: Math.abs(s.food), energy: s.energy }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar yAxisId="left" dataKey="water" name="Water Stress Score" fill={T.teal} radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="food" name="|Food Loss %|" fill={T.red} radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="energy" name="Energy Δ%" fill={T.amber} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Stress Scenario Detail</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Scenario','Water Stress','Food Calorie Δ','Energy Intensity Δ','Severity'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px', color: T.textMut, fontWeight: 500 }}>{h}</th>
                ))}</tr></thead>
              <tbody>{STRESS_SCENARIOS.map(s => {
                const sev = s.water >= 7 ? 'Critical' : s.water >= 6 ? 'Severe' : s.water >= 5 ? 'High' : 'Moderate';
                return (
                  <tr key={s.scenario} style={{ borderBottom: `1px solid ${T.border}22` }}>
                    <td style={{ padding: '7px 8px', color: T.text, fontWeight: 500 }}>{s.scenario}</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono, color: stressColor(s.water) }}>{s.water}</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono, color: T.red }}>{s.food}%</td>
                    <td style={{ padding: '7px 8px', fontFamily: T.mono, color: s.energy > 0 ? T.amber : T.green }}>{s.energy > 0 ? '+' : ''}{s.energy}%</td>
                    <td style={{ padding: '7px 8px', fontWeight: 600, color: stressColor(s.water) }}>{sev}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Adaptation' && (
        <>
          <div style={grid(4)}>
            <KpiCard label="Top Water Saving" value={`${Math.max(...ADAPT_MEASURES.map(m => m.waterSave))}%`} sub="Best-in-class intervention" color={T.teal} />
            <KpiCard label="Top Energy Saving" value={`${Math.max(...ADAPT_MEASURES.map(m => m.energySave))}%`} sub="Solar pumps & efficiency" color={T.amber} />
            <KpiCard label="Max Food Uplift" value={`+${Math.max(...ADAPT_MEASURES.map(m => m.foodGain))}%`} sub="Calorie production gain" color={T.green} />
            <KpiCard label="Avg Payback" value="~4.5 yr" sub="Across adaptation portfolio" color={T.navy} />
          </div>
          <div style={card}>
            <h2 style={h2}>Adaptation Measure Co-Benefits (Water / Energy / Food)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={adaptData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
                <Tooltip contentStyle={{ background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="waterSave" name="Water Saved %" fill={T.teal} radius={[3, 3, 0, 0]} />
                <Bar dataKey="energySave" name="Energy Saved %" fill={T.amber} radius={[3, 3, 0, 0]} />
                <Bar dataKey="foodGain" name="Food Gain %" fill={T.green} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={card}>
            <h2 style={h2}>Adaptation Finance Landscape</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {ADAPT_MEASURES.map(m => (
                <div key={m.name} style={{ background: T.surfaceH, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 600, color: T.teal, fontSize: 12, marginBottom: 8 }}>{m.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                    {[{ label: 'Water −%', val: `${m.waterSave}%`, color: T.teal }, { label: 'Food +%', val: `+${m.foodGain}%`, color: T.green },
                      { label: 'Cost/ha', val: `$${m.cost}`, color: T.amber }, { label: 'Adoption', val: `${m.coverage}%`, color: T.navy }].map(f => (
                      <div key={f.label}>
                        <div style={{ fontSize: 9, color: T.textMut }}>{f.label}</div>
                        <div style={{ fontFamily: T.mono, fontSize: 12, color: f.color, fontWeight: 700 }}>{f.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
