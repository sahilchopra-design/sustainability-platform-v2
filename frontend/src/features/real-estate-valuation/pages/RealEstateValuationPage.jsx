import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PieChart, Pie, Cell, Legend, ReferenceLine
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const T = { navy: '#1b3a5c', gold: '#c5a96a', cream: '#f7f4ef', teal: '#0f766e', red: '#991b1b', green: '#065f46', gray: '#6b7280', amber: '#b45309' };

const PROP_TYPES = ['Office', 'Retail', 'Industrial', 'Hotel', 'Student', 'Mixed'];
const LOCATIONS = ['London City', 'London West End', 'Manchester', 'Edinburgh', 'Birmingham', 'Bristol'];
const EPC_RATINGS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const BREEAM = ['Outstanding', 'Excellent', 'Very Good', 'Good', 'Pass', 'Unrated'];

const EPC_PREMIUM = { A: 0.08, B: 0.04, C: 0, D: -0.02, E: -0.06, F: -0.10, G: -0.15 };
const BREEAM_PREMIUM = { Outstanding: 0.05, Excellent: 0.03, 'Very Good': 0.01, Good: 0, Pass: -0.01, Unrated: -0.02 };

const LOC_CAP_ADJ = { 'London City': 0.0, 'London West End': -0.3, Manchester: 0.8, Edinburgh: 0.6, Birmingham: 0.9, Bristol: 0.7 };

const CLIMATE_SCENARIO_FACTORS = {
  Current: { flood: 1.0, heat: 1.0, subsidence: 1.0, coastal: 1.0, wildfire: 1.0 },
  'RCP4.5': { flood: 1.3, heat: 1.5, subsidence: 1.2, coastal: 1.4, wildfire: 1.6 },
  'RCP8.5': { flood: 1.8, heat: 2.2, subsidence: 1.5, coastal: 2.0, wildfire: 2.5 },
  NZ2050: { flood: 1.1, heat: 1.2, subsidence: 1.0, coastal: 1.1, wildfire: 1.2 },
};

const PORTFOLIO = Array.from({ length: 30 }, (_, i) => {
  const type = PROP_TYPES[Math.floor(sr(i * 3 + 1) * PROP_TYPES.length)];
  const loc = LOCATIONS[Math.floor(sr(i * 5 + 2) * LOCATIONS.length)];
  const epc = EPC_RATINGS[Math.floor(sr(i * 7 + 3) * EPC_RATINGS.length)];
  const breeam = BREEAM[Math.floor(sr(i * 11 + 4) * BREEAM.length)];
  const baseCapRate = 4.5 + sr(i * 13 + 5) * 4 + LOC_CAP_ADJ[loc];
  const noi = +(1 + sr(i * 17 + 6) * 12).toFixed(2);
  const climateHaircut = +(1 + sr(i * 19 + 7) * 12).toFixed(1);
  const baseRisk = { flood: +(10 + sr(i * 23 + 8) * 70), heat: +(10 + sr(i * 29 + 9) * 70), subsidence: +(5 + sr(i * 31 + 10) * 60), coastal: +(5 + sr(i * 37 + 11) * 65), wildfire: +(5 + sr(i * 41 + 12) * 45) };
  const totalRisk = +(Object.values(baseRisk).reduce((a, b) => a + b, 0) / 5).toFixed(1);
  const names = ['1 Poultry EC2', 'Kings Cross Central', 'MediaCityUK Block A', 'Edinburgh Waverley Gate', 'Brindleyplace B5', 'Harbourside Bristol', 'Canary Wharf TW2', 'Oxford Street 220', 'Piccadilly 45', 'Manchester Spinningfields', 'Victoria Square Bham', 'St Andrews Square Edin', 'Temple Quay Bristol', 'Broadgate Circle EC2', 'Regent Quarter N1', 'York House Leeds', 'Central Sq Cardiff', 'Angel Square Manc', 'Capital Quarter Cardiff', 'Quartermile Edin', 'Snowhill Bham', 'Colmore Row Bham', 'Eldon Square Newcastle', 'The Forum Norwich', 'Arndale Centre Manc', 'One Deansgate', 'Pacific Quay Glasgow', 'Tollcross Edin', 'Temple Meads Bristol', 'Croydon Gateway'];
  return { id: i, name: names[i], type, loc, epc, breeam, baseCapRate: +baseCapRate.toFixed(2), noi, climateHaircut, baseRisk, totalRisk };
});

const GRESB_FUNDS = Array.from({ length: 20 }, (_, i) => {
  const names = ['British Land REIT', 'Land Securities Group', 'Derwent London', 'Great Portland Estates', 'Workspace Group', 'Shaftesbury Capital', 'LondonMetric Property', 'Supermarket Income REIT', 'Tritax Big Box REIT', 'SEGRO plc', 'Unite Students REIT', 'GCP Student Living', 'Helical plc', 'NewRiver REIT', 'Capital & Regional', 'Palace Capital', 'Target Healthcare REIT', 'Assura plc', 'Primary Health Properties', 'Hammerson plc'];
  const sectors = ['Office', 'Office', 'Office', 'Office', 'Office', 'Retail', 'Logistics', 'Retail', 'Logistics', 'Industrial', 'Student', 'Student', 'Office', 'Retail', 'Retail', 'Mixed', 'Healthcare', 'Healthcare', 'Healthcare', 'Retail'];
  const gresb = Math.floor(55 + sr(i * 7 + 1) * 45);
  const mgmt = Math.floor(50 + sr(i * 11 + 2) * 50);
  const perf = Math.floor(45 + sr(i * 13 + 3) * 55);
  return {
    id: i, name: names[i], sector: sectors[i], gresb, mgmt, perf,
    carbonIntensity: +(20 + sr(i * 17 + 4) * 80).toFixed(1),
    energyIntensity: +(80 + sr(i * 19 + 5) * 200).toFixed(0),
    waterIntensity: +(0.3 + sr(i * 23 + 6) * 1.5).toFixed(2),
  };
});

export default function RealEstateValuationPage() {
  const [activeTab, setActiveTab] = useState(0);

  // Property Valuation state
  const [propType, setPropType] = useState('Office');
  const [propLoc, setPropLoc] = useState('London City');
  const [propGIA, setPropGIA] = useState(50000);
  const [propNOI, setPropNOI] = useState(3.5);
  const [capRate, setCapRate] = useState(5.0);
  const [epcRating, setEpcRating] = useState('C');
  const [breeamRating, setBreeamRating] = useState('Very Good');
  const [yearBuilt, setYearBuilt] = useState(2015);
  const [greenApplied, setGreenApplied] = useState(false);

  // Climate Risk state
  const [selectedPropId, setSelectedPropId] = useState(0);
  const [climateScenario, setClimateScenario] = useState('Current');
  const [showBulk, setShowBulk] = useState(false);

  // GRESB state
  const [selectedFund, setSelectedFund] = useState(0);

  const epcAdj = EPC_PREMIUM[epcRating] || 0;
  const breeamAdj = BREEAM_PREMIUM[breeamRating] || 0;
  const greenAdj = greenApplied ? epcAdj + breeamAdj : 0;
  const adjustedCapRate = Math.max(2.5, capRate - greenAdj * capRate);

  const grossValue = propNOI / (capRate / 100);
  const adjustedValue = propNOI / (adjustedCapRate / 100);
  const greenDelta = adjustedValue - grossValue;
  const climateHaircutPct = +(2 + sr(propGIA * 0.001 + 1) * 8).toFixed(1);
  const climateAdjValue = adjustedValue * (1 - climateHaircutPct / 100);

  const compEvidence = useMemo(() => {
    return PORTFOLIO.filter(p => p.type === propType && p.loc === propLoc).slice(0, 5)
      .concat(PORTFOLIO.filter(p => p.type === propType).slice(0, 3))
      .slice(0, 5)
      .map(p => ({ name: p.name, capRate: p.baseCapRate, noi: p.noi, value: +(p.noi / (p.baseCapRate / 100)).toFixed(1), epc: p.epc }));
  }, [propType, propLoc]);

  const selectedProp = PORTFOLIO[selectedPropId];
  const scenarioFactors = CLIMATE_SCENARIO_FACTORS[climateScenario];

  const climateRiskScores = useMemo(() => {
    const base = selectedProp.baseRisk;
    return {
      flood: Math.min(100, +(base.flood * scenarioFactors.flood).toFixed(0)),
      heat: Math.min(100, +(base.heat * scenarioFactors.heat).toFixed(0)),
      subsidence: Math.min(100, +(base.subsidence * scenarioFactors.subsidence).toFixed(0)),
      coastal: Math.min(100, +(base.coastal * scenarioFactors.coastal).toFixed(0)),
      wildfire: Math.min(100, +(base.wildfire * scenarioFactors.wildfire).toFixed(0)),
    };
  }, [selectedProp, scenarioFactors]);

  const totalClimateRisk = +(Object.values(climateRiskScores).reduce((a, b) => a + b, 0) / 5).toFixed(1);
  const riskColor = totalClimateRisk > 60 ? T.red : totalClimateRisk > 30 ? T.amber : T.green;

  const radarData = [
    { subject: 'Flood', score: climateRiskScores.flood },
    { subject: 'Heat Stress', score: climateRiskScores.heat },
    { subject: 'Subsidence', score: climateRiskScores.subsidence },
    { subject: 'Coastal', score: climateRiskScores.coastal },
    { subject: 'Wildfire', score: climateRiskScores.wildfire },
  ];

  const scenarioHaircuts = Object.entries(CLIMATE_SCENARIO_FACTORS).map(([sc, fac]) => ({
    scenario: sc,
    haircut: +(Object.values(fac).reduce((a, b) => a + b, 0) / 5 * selectedProp.climateHaircut * 0.4).toFixed(1)
  }));

  const bulkRanked = useMemo(() => [...PORTFOLIO].sort((a, b) => b.totalRisk - a.totalRisk), []);

  const fund = GRESB_FUNDS[selectedFund];
  const gresb2030Target = 85;
  const yearsTo2030 = 4;
  const annualGap = Math.max(0, (gresb2030Target - fund.gresb) / yearsTo2030);

  const peerRank = useMemo(() => {
    const sorted = [...GRESB_FUNDS].filter(f => f.sector === fund.sector).sort((a, b) => b.gresb - a.gresb);
    const pos = sorted.findIndex(f => f.id === fund.id) + 1;
    return { pos, total: sorted.length };
  }, [fund]);

  const epcColor = (e) => ({ A: '#065f46', B: '#0f766e', C: '#15803d', D: '#ca8a04', E: '#ea580c', F: '#dc2626', G: '#7f1d1d' }[e] || T.gray);

  const SliderRow = ({ label, min, max, step, value, onChange, fmt }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.navy, fontWeight: 600, marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color: T.gold, fontFamily: 'monospace' }}>{fmt ? fmt(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: T.navy }} />
    </div>
  );

  const tabs = ['Property Valuation', 'Climate Risk Overlay', 'GRESB Benchmarking', 'Methodology'];

  return (
    <div style={{ background: T.cream, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 4 }}>EP-BK3 · REAL ESTATE VALUATION</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Real Estate Valuation & Climate Risk Engine</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>EPC/BREEAM green premium · TCFD climate overlay · GRESB benchmarking · CRREM alignment</div>
      </div>

      <div style={{ display: 'flex', background: '#fff', borderBottom: `2px solid ${T.gold}` }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            style={{ padding: '12px 24px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              background: activeTab === i ? T.navy : 'transparent',
              color: activeTab === i ? T.gold : T.gray,
              borderBottom: activeTab === i ? `2px solid ${T.gold}` : '2px solid transparent' }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ padding: 24 }}>

        {/* TAB 1: Property Valuation */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, marginBottom: 24 }}>
              {/* Left Form */}
              <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16, borderBottom: `1px solid ${T.gold}40`, paddingBottom: 8 }}>PROPERTY INPUTS</div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, display: 'block', marginBottom: 4 }}>Property Type</label>
                  <select value={propType} onChange={e => setPropType(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', border: `1px solid ${T.gold}50`, borderRadius: 4, fontSize: 13, fontFamily: 'inherit' }}>
                    {PROP_TYPES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, display: 'block', marginBottom: 4 }}>Location</label>
                  <select value={propLoc} onChange={e => setPropLoc(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', border: `1px solid ${T.gold}50`, borderRadius: 4, fontSize: 13, fontFamily: 'inherit' }}>
                    {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, display: 'block', marginBottom: 4 }}>GIA (sq ft)</label>
                  <input type="number" value={propGIA} onChange={e => setPropGIA(+e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', border: `1px solid ${T.gold}50`, borderRadius: 4, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, display: 'block', marginBottom: 4 }}>Net Operating Income (£m p.a.)</label>
                  <input type="number" step={0.1} value={propNOI} onChange={e => setPropNOI(Math.max(0.01, +e.target.value))}
                    style={{ width: '100%', padding: '6px 10px', border: `1px solid ${T.gold}50`, borderRadius: 4, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>

                <SliderRow label="Cap Rate (%)" min={3.0} max={9.0} step={0.05} value={capRate} onChange={setCapRate} fmt={v => `${v.toFixed(2)}%`} />

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginBottom: 6 }}>EPC Rating</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {EPC_RATINGS.map(r => (
                      <button key={r} onClick={() => setEpcRating(r)}
                        style={{ flex: 1, padding: '6px 0', border: `1px solid ${epcColor(r)}`, borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                          background: epcRating === r ? epcColor(r) : '#fff', color: epcRating === r ? '#fff' : epcColor(r) }}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginBottom: 6 }}>BREEAM Rating</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {BREEAM.map(r => (
                      <button key={r} onClick={() => setBreeamRating(r)}
                        style={{ padding: '4px 8px', border: `1px solid ${T.navy}`, borderRadius: 4, cursor: 'pointer', fontSize: 10, fontWeight: 600,
                          background: breeamRating === r ? T.navy : '#fff', color: breeamRating === r ? T.gold : T.navy }}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, display: 'block', marginBottom: 4 }}>Year Built</label>
                  <input type="number" value={yearBuilt} onChange={e => setYearBuilt(+e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', border: `1px solid ${T.gold}50`, borderRadius: 4, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>

                <button onClick={() => setGreenApplied(g => !g)}
                  style={{ width: '100%', padding: '10px', background: greenApplied ? T.green : T.navy, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
                  {greenApplied ? '✓ Green Premium Applied' : 'APPLY GREEN PREMIUM'}
                </button>
              </div>

              {/* Right Results */}
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: '#fff', border: `2px solid ${T.navy}`, borderRadius: 8, padding: 18, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: T.gray, fontWeight: 600, marginBottom: 4 }}>GROSS VALUE</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: T.navy, fontFamily: 'monospace' }}>£{grossValue.toFixed(1)}m</div>
                    <div style={{ fontSize: 11, color: T.gray }}>NOI / Cap Rate (unadjusted)</div>
                  </div>

                  <div style={{ background: '#fff', border: `2px solid ${greenDelta > 0 ? T.green : T.red}`, borderRadius: 8, padding: 18, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: T.gray, fontWeight: 600, marginBottom: 4 }}>GREEN/BROWN ADJ</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: greenApplied ? (greenDelta > 0 ? T.green : T.red) : T.gray, fontFamily: 'monospace' }}>
                      {greenApplied ? (grossValue > 0 ? `${greenDelta >= 0 ? '+' : ''}${((greenDelta / grossValue) * 100).toFixed(1)}%` : 'N/A') : 'Not Applied'}
                    </div>
                    <div style={{ fontSize: 11, color: T.gray }}>EPC {epcRating} ({EPC_PREMIUM[epcRating] >= 0 ? '+' : ''}{(EPC_PREMIUM[epcRating] * 100).toFixed(0)}%) + BREEAM {breeamRating}</div>
                  </div>

                  <div style={{ background: '#fff', border: `2px solid ${T.teal}`, borderRadius: 8, padding: 18, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: T.gray, fontWeight: 600, marginBottom: 4 }}>CLIMATE-ADJUSTED VALUE</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: T.teal, fontFamily: 'monospace' }}>£{climateAdjValue.toFixed(1)}m</div>
                    <div style={{ fontSize: 11, color: T.gray }}>After {climateHaircutPct}% physical risk haircut</div>
                  </div>
                </div>

                {/* Comparable evidence */}
                <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Comparable Evidence — {propType} in {propLoc}</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: T.navy }}>
                        {['Property', 'Cap Rate', 'NOI (£m)', 'Value (£m)', 'EPC'].map(h => (
                          <th key={h} style={{ padding: '6px 10px', color: T.gold, textAlign: 'left', fontWeight: 600, fontSize: 11 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {compEvidence.map((c, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#f9f7f3' : '#fff', borderBottom: `1px solid ${T.gold}15` }}>
                          <td style={{ padding: '6px 10px', fontWeight: 600, color: T.navy }}>{c.name}</td>
                          <td style={{ padding: '6px 10px', fontFamily: 'monospace' }}>{c.capRate}%</td>
                          <td style={{ padding: '6px 10px', fontFamily: 'monospace' }}>£{c.noi}m</td>
                          <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: T.teal, fontWeight: 600 }}>£{c.value}m</td>
                          <td style={{ padding: '6px 10px' }}>
                            <span style={{ background: epcColor(c.epc), color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{c.epc}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Portfolio Table */}
            <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.gold}30`, fontSize: 13, fontWeight: 700, color: T.navy }}>
                30-Property Portfolio Overview
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.navy }}>
                    {['Property', 'Type', 'Location', 'EPC', 'BREEAM', 'Cap Rate %', 'NOI (£m)', 'Value (£m)', 'Climate Haircut %'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', color: T.gold, textAlign: 'left', fontWeight: 600, fontSize: 10, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PORTFOLIO.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? '#f9f7f3' : '#fff', borderBottom: `1px solid ${T.gold}15` }}>
                      <td style={{ padding: '5px 8px', fontWeight: 600, color: T.navy }}>{p.name}</td>
                      <td style={{ padding: '5px 8px', color: T.gray }}>{p.type}</td>
                      <td style={{ padding: '5px 8px', color: T.gray }}>{p.loc}</td>
                      <td style={{ padding: '5px 8px' }}><span style={{ background: epcColor(p.epc), color: '#fff', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{p.epc}</span></td>
                      <td style={{ padding: '5px 8px', fontSize: 10, color: T.gray }}>{p.breeam}</td>
                      <td style={{ padding: '5px 8px', fontFamily: 'monospace' }}>{p.baseCapRate}%</td>
                      <td style={{ padding: '5px 8px', fontFamily: 'monospace' }}>£{p.noi}m</td>
                      <td style={{ padding: '5px 8px', fontFamily: 'monospace', color: T.teal, fontWeight: 600 }}>£{+(p.noi / (p.baseCapRate / 100)).toFixed(1)}m</td>
                      <td style={{ padding: '5px 8px' }}>
                        <span style={{ color: p.climateHaircut > 8 ? T.red : p.climateHaircut > 4 ? T.amber : T.green, fontFamily: 'monospace', fontWeight: 600 }}>{p.climateHaircut}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Climate Risk Overlay */}
        {activeTab === 1 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
              <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16, borderBottom: `1px solid ${T.gold}40`, paddingBottom: 8 }}>PROPERTY SELECTOR</div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, display: 'block', marginBottom: 4 }}>Select Property</label>
                  <select value={selectedPropId} onChange={e => setSelectedPropId(+e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', border: `1px solid ${T.gold}50`, borderRadius: 4, fontSize: 12, fontFamily: 'inherit' }}>
                    {PORTFOLIO.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 14, padding: '8px 12px', background: `${T.navy}06`, borderRadius: 4 }}>
                  <div style={{ fontSize: 11, color: T.gray }}>Type: <strong style={{ color: T.navy }}>{selectedProp.type}</strong></div>
                  <div style={{ fontSize: 11, color: T.gray }}>Location: <strong style={{ color: T.navy }}>{selectedProp.loc}</strong></div>
                  <div style={{ fontSize: 11, color: T.gray }}>EPC: <strong><span style={{ color: epcColor(selectedProp.epc) }}>{selectedProp.epc}</span></strong></div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginBottom: 6 }}>Climate Scenario</div>
                  {Object.keys(CLIMATE_SCENARIO_FACTORS).map(sc => (
                    <button key={sc} onClick={() => setClimateScenario(sc)}
                      style={{ display: 'block', width: '100%', padding: '7px 12px', marginBottom: 4, border: `1px solid ${T.navy}`, borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600, textAlign: 'left',
                        background: climateScenario === sc ? T.navy : '#fff', color: climateScenario === sc ? T.gold : T.navy }}>
                      {sc}
                    </button>
                  ))}
                </div>
                <div style={{ padding: '12px', background: `${riskColor}15`, borderRadius: 6, border: `1px solid ${riskColor}30`, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.gray, marginBottom: 4 }}>TOTAL CLIMATE RISK SCORE</div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: riskColor, fontFamily: 'monospace' }}>{totalClimateRisk}</div>
                  <div style={{ fontSize: 11, color: riskColor, fontWeight: 600 }}>{totalClimateRisk > 60 ? 'HIGH RISK' : totalClimateRisk > 30 ? 'MEDIUM RISK' : 'LOW RISK'}</div>
                </div>
                <button onClick={() => setShowBulk(b => !b)}
                  style={{ width: '100%', marginTop: 12, padding: '10px', background: T.teal, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
                  {showBulk ? 'Show Single Property' : 'BULK SCREEN PORTFOLIO'}
                </button>
              </div>

              <div>
                {!showBulk ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                      <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Physical Risk Radar — {climateScenario}</div>
                        <ResponsiveContainer width="100%" height={240}>
                          <RadarChart data={radarData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                            <PolarGrid stroke={`${T.navy}20`} />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: T.navy }} />
                            <Radar name="Risk Score" dataKey="score" stroke={riskColor} fill={riskColor} fillOpacity={0.3} strokeWidth={2} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Valuation Haircut by Scenario (£m / %)</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: T.navy }}>
                              <th style={{ padding: '6px 10px', color: T.gold, textAlign: 'left', fontSize: 11 }}>Scenario</th>
                              <th style={{ padding: '6px 10px', color: T.gold, textAlign: 'center', fontSize: 11 }}>Haircut %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scenarioHaircuts.map((s, i) => (
                              <tr key={s.scenario} style={{ background: s.scenario === climateScenario ? `${T.navy}08` : i % 2 === 0 ? '#f9f7f3' : '#fff',
                                borderLeft: s.scenario === climateScenario ? `3px solid ${T.gold}` : '3px solid transparent' }}>
                                <td style={{ padding: '7px 10px', fontWeight: s.scenario === climateScenario ? 700 : 400, color: T.navy }}>{s.scenario}</td>
                                <td style={{ padding: '7px 10px', textAlign: 'center', fontFamily: 'monospace',
                                  color: s.haircut > 8 ? T.red : s.haircut > 4 ? T.amber : T.green, fontWeight: 600 }}>{s.haircut}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ marginTop: 16, padding: 12, background: `${T.navy}06`, borderRadius: 6 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 8 }}>TCFD Physical Risk Disclosure Template</div>
                          <div style={{ fontSize: 11, color: T.gray, lineHeight: 1.6 }}>
                            Property: <strong>{selectedProp.name}</strong>. Under the {climateScenario} climate scenario, this asset faces a composite physical risk score of {totalClimateRisk}/100, primarily driven by {Object.entries(climateRiskScores).sort((a, b) => b[1] - a[1])[0][0]} risk ({Object.entries(climateRiskScores).sort((a, b) => b[1] - a[1])[0][1]}/100). Estimated valuation haircut: {scenarioHaircuts.find(s => s.scenario === climateScenario)?.haircut}%. Management actions include flood resilience upgrades, energy efficiency improvements (target EPC B by 2028), and insurance review.
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.gold}30` }}>
                      Portfolio Physical Risk Ranking — {climateScenario}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr style={{ background: T.navy }}>
                          {['#', 'Property', 'Type', 'EPC', 'Flood', 'Heat', 'Subsidence', 'Coastal', 'Wildfire', 'Total Score'].map(h => (
                            <th key={h} style={{ padding: '6px 8px', color: T.gold, textAlign: 'left', fontWeight: 600, fontSize: 10 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRanked.map((p, i) => {
                          const fac = scenarioFactors;
                          const scores = {
                            flood: Math.min(100, +(p.baseRisk.flood * fac.flood).toFixed(0)),
                            heat: Math.min(100, +(p.baseRisk.heat * fac.heat).toFixed(0)),
                            subsidence: Math.min(100, +(p.baseRisk.subsidence * fac.subsidence).toFixed(0)),
                            coastal: Math.min(100, +(p.baseRisk.coastal * fac.coastal).toFixed(0)),
                            wildfire: Math.min(100, +(p.baseRisk.wildfire * fac.wildfire).toFixed(0)),
                          };
                          const total = +(Object.values(scores).reduce((a, b) => a + b, 0) / 5).toFixed(1);
                          const rc = total > 60 ? T.red : total > 30 ? T.amber : T.green;
                          return (
                            <tr key={p.id} style={{ background: i % 2 === 0 ? '#f9f7f3' : '#fff', borderBottom: `1px solid ${T.gold}15` }}>
                              <td style={{ padding: '5px 8px', fontFamily: 'monospace', color: T.gray }}>{i + 1}</td>
                              <td style={{ padding: '5px 8px', fontWeight: 600, color: T.navy }}>{p.name}</td>
                              <td style={{ padding: '5px 8px', color: T.gray }}>{p.type}</td>
                              <td style={{ padding: '5px 8px' }}><span style={{ background: epcColor(p.epc), color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{p.epc}</span></td>
                              {[scores.flood, scores.heat, scores.subsidence, scores.coastal, scores.wildfire].map((s, j) => (
                                <td key={j} style={{ padding: '5px 8px', fontFamily: 'monospace', color: s > 60 ? T.red : s > 30 ? T.amber : T.green }}>{s}</td>
                              ))}
                              <td style={{ padding: '5px 8px' }}><span style={{ background: rc, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{total}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GRESB Benchmarking */}
        {activeTab === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
              <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16, borderBottom: `1px solid ${T.gold}40`, paddingBottom: 8 }}>FUND SELECTOR</div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.navy, display: 'block', marginBottom: 4 }}>Fund / REIT</label>
                  <select value={selectedFund} onChange={e => setSelectedFund(+e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', border: `1px solid ${T.gold}50`, borderRadius: 4, fontSize: 12, fontFamily: 'inherit' }}>
                    {GRESB_FUNDS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>

                {/* Animated Gauge */}
                <div style={{ textAlign: 'center', padding: '20px 0', position: 'relative' }}>
                  <svg width={180} height={100} viewBox="0 0 180 100" style={{ overflow: 'visible' }}>
                    <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="#e5e7eb" strokeWidth={16} strokeLinecap="round" />
                    <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none"
                      stroke={fund.gresb > 75 ? T.green : fund.gresb > 50 ? T.amber : T.red}
                      strokeWidth={16} strokeLinecap="round"
                      strokeDasharray={`${fund.gresb / 100 * 220} 220`}
                      style={{ transition: 'stroke-dasharray 0.8s ease-in-out' }} />
                    <text x={90} y={85} textAnchor="middle" style={{ fontSize: 28, fontWeight: 700, fill: T.navy, fontFamily: 'monospace' }}>{fund.gresb}</text>
                    <text x={90} y={105} textAnchor="middle" style={{ fontSize: 11, fill: T.gray }}>GRESB Score</text>
                  </svg>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  <div style={{ padding: 10, background: `${T.teal}10`, borderRadius: 6, textAlign: 'center', border: `1px solid ${T.teal}30` }}>
                    <div style={{ fontSize: 10, color: T.gray, fontWeight: 600 }}>Management</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: T.teal, fontFamily: 'monospace' }}>{fund.mgmt}</div>
                  </div>
                  <div style={{ padding: 10, background: `${T.navy}08`, borderRadius: 6, textAlign: 'center', border: `1px solid ${T.navy}20` }}>
                    <div style={{ fontSize: 10, color: T.gray, fontWeight: 600 }}>Performance</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: T.navy, fontFamily: 'monospace' }}>{fund.perf}</div>
                  </div>
                </div>

                <div style={{ padding: '10px 14px', background: `${T.gold}15`, borderRadius: 6, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: T.gray, fontWeight: 600 }}>Peer Ranking ({fund.sector})</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.navy, fontFamily: 'monospace' }}>#{peerRank.pos} of {peerRank.total}</div>
                </div>

                <div style={{ padding: '10px 14px', background: `${T.amber}10`, borderRadius: 6, border: `1px solid ${T.amber}30` }}>
                  <div style={{ fontSize: 11, color: T.gray, fontWeight: 600 }}>2030 Target Gap</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: fund.gresb >= gresb2030Target ? T.green : T.amber, fontFamily: 'monospace' }}>
                    {fund.gresb >= gresb2030Target ? 'Target Met ✓' : `+${annualGap.toFixed(1)} pts/yr needed`}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Management vs Performance — Fund Breakdown</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[{ name: fund.name.split(' ').slice(0, 2).join(' '), management: fund.mgmt, performance: fund.perf, total: fund.gresb }]} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="management" name="Management" fill={T.teal} />
                      <Bar dataKey="performance" name="Performance" fill={T.navy} />
                      <Bar dataKey="total" name="Total GRESB" fill={T.gold} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                  {[
                    { label: 'Carbon Intensity', val: fund.carbonIntensity, unit: 'kgCO₂/m²', target: 25, color: T.navy },
                    { label: 'Energy Intensity', val: fund.energyIntensity, unit: 'kWh/m²', target: 100, color: T.teal },
                    { label: 'Water Intensity', val: fund.waterIntensity, unit: 'm³/m²', target: 0.5, color: T.amber },
                  ].map((kpi, i) => (
                    <div key={i} style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16 }}>
                      <div style={{ fontSize: 11, color: T.gray, fontWeight: 600, marginBottom: 6 }}>{kpi.label}</div>
                      <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color, fontFamily: 'monospace' }}>{kpi.val}</div>
                      <div style={{ fontSize: 10, color: T.gray, marginBottom: 8 }}>{kpi.unit}</div>
                      <div style={{ background: '#e5e7eb', borderRadius: 4, height: 4 }}>
                        <div style={{ background: kpi.val <= kpi.target ? T.green : T.red, borderRadius: 4, height: 4, width: `${Math.min(100, (kpi.target / kpi.val) * 100).toFixed(0)}%` }} />
                      </div>
                      <div style={{ fontSize: 10, color: kpi.val <= kpi.target ? T.green : T.red, marginTop: 4 }}>
                        {kpi.val <= kpi.target ? '✓ 2030 target met' : `Need ${Math.abs(((kpi.val - kpi.target) / kpi.val) * 100).toFixed(0)}% reduction by 2030`}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sector peer chart */}
                <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>GRESB Score — All Funds</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={GRESB_FUNDS.map(f => ({ name: f.name.split(' ').slice(0, 1)[0], score: f.gresb, highlight: f.id === selectedFund }))}
                      margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => [v, 'GRESB Score']} />
                      <ReferenceLine y={gresb2030Target} stroke={T.gold} strokeDasharray="5 5" label={{ value: '2030 Target', fill: T.gold, fontSize: 10 }} />
                      <Bar dataKey="score">
                        {GRESB_FUNDS.map((f, i) => <Cell key={i} fill={f.id === selectedFund ? T.gold : f.gresb >= gresb2030Target ? T.green : T.navy} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Methodology */}
        {activeTab === 3 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { title: 'RICS Red Book 2024 VPS 4', body: 'Valuation Practice Statement 4 requires valuers to consider climate-related risks as material factors. EPC ratings, flood risk, energy performance must be disclosed in valuation reports from January 2024.' },
                { title: 'TCFD Real Estate Guidance', body: 'Task Force on Climate-related Financial Disclosures: physical risk assessment (flood, heat, subsidence, coastal, wildfire), transition risk (EPC/MEES regulatory trajectory), scenario analysis at 2°C and 4°C.' },
                { title: 'EPC / MEES 2030 Trajectory', body: 'Minimum Energy Efficiency Standards: All commercial property must reach EPC B by 2030. Properties at EPC E/F/G face stranding risk. JLL 2023: EPC A/B assets trade at 5-10% premium; EPC E/F/G assets face 8-15% discount.' },
                { title: 'GRESB Scoring Framework', body: 'Global Real Estate Sustainability Benchmark: Management component (40pts) covers policies, targets, data management. Performance component (60pts) covers energy, GHG, water, waste, certifications.' },
                { title: 'EU Taxonomy Article 7', body: 'Sustainable use and protection of water and marine resources. Real estate must demonstrate climate change adaptation measures and substantial contribution to circular economy in new construction and major renovation.' },
                { title: 'CRREM Pathway', body: 'Carbon Risk Real Estate Monitor: asset-level decarbonisation pathways for 1.5°C and 2°C. Stranding analysis identifies when assets exceed carbon budgets. Used by Allianz, PGGM, APG, and 300+ asset managers.' },
              ].map((c, i) => (
                <div key={i} style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8, borderBottom: `1px solid ${T.gold}30`, paddingBottom: 8 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: T.gray, lineHeight: 1.6 }}>{c.body}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', border: `1px solid ${T.gold}30`, borderRadius: 8, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 16 }}>Interactive EPC Premium / Discount Table — JLL 2023 Green Premium Research</div>
              <div style={{ marginBottom: 12, fontSize: 12, color: T.gray, lineHeight: 1.6 }}>
                JLL Research (2023): "EPC A/B assets trade at a 5-10% premium versus EPC C benchmark. EPC E/F/G assets face growing brown discounts of 8-15% driven by MEES regulatory risk and occupier preference for high-quality sustainable space. Premium differential expected to widen to 15-20% by 2027 as MEES B threshold approaches."
              </div>
              <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: `1px solid ${T.gold}30` }}>
                {EPC_RATINGS.map((r, i) => (
                  <div key={r} style={{ flex: 1, padding: '16px 8px', textAlign: 'center', background: `${epcColor(r)}15`, borderRight: i < EPC_RATINGS.length - 1 ? `1px solid ${T.gold}20` : 'none' }}>
                    <div style={{ background: epcColor(r), color: '#fff', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontWeight: 700, fontSize: 16 }}>{r}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: EPC_PREMIUM[r] > 0 ? T.green : EPC_PREMIUM[r] < 0 ? T.red : T.gray, fontFamily: 'monospace' }}>
                      {EPC_PREMIUM[r] > 0 ? '+' : ''}{(EPC_PREMIUM[r] * 100).toFixed(0)}%
                    </div>
                    <div style={{ fontSize: 10, color: T.gray, marginTop: 4 }}>{EPC_PREMIUM[r] > 0 ? 'Premium' : EPC_PREMIUM[r] < 0 ? 'Discount' : 'Benchmark'}</div>
                    <div style={{ fontSize: 10, color: T.gray, marginTop: 2 }}>vs EPC C</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
