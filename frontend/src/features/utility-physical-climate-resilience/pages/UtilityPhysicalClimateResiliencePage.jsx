import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A',
  sub: '#64748B', accent: '#10B981', blue: '#2563EB', indigo: '#4F46E5',
  green: '#059669', amber: '#D97706', red: '#DC2626', purple: '#7C3AED',
  teal: '#0D9488', sky: '#0284C7', muted: '#94A3B8',
};

const ASSETS = [
  { id:1, name:'Coastal Transmission Substation A', type:'Substation', region:'Gulf Coast', flood_risk:0.82, heat_risk:0.74, wind_risk:0.88, wildfire:0.12, ice_storm:0.08, rav:$85, hardening_capex:12.4, insurance_coverage:0.65, aep_loss_pct:3.2, saidi_impact:42, adaptation_roi:2.8, rcp45_loss:4.1, rcp85_loss:8.9 },
  { id:2, name:'Inland Gas Compressor Station B', type:'Gas Infra', region:'Texas Plains', flood_risk:0.28, heat_risk:0.91, wind_risk:0.62, wildfire:0.38, ice_storm:0.44, rav:62, hardening_capex:6.8, insurance_coverage:0.72, aep_loss_pct:1.8, saidi_impact:18, adaptation_roi:3.4, rcp45_loss:2.2, rcp85_loss:5.4 },
  { id:3, name:'Mountain Hydroelectric Dam C', type:'Generation', region:'Pacific NW', flood_risk:0.72, heat_risk:0.31, wind_risk:0.22, wildfire:0.68, ice_storm:0.15, rav:210, hardening_capex:28.2, insurance_coverage:0.80, aep_loss_pct:2.4, saidi_impact:0, adaptation_roi:2.1, rcp45_loss:3.2, rcp85_loss:7.8 },
  { id:4, name:'Urban Water Treatment Plant D', type:'Water', region:'Northeast US', flood_risk:0.68, heat_risk:0.55, wind_risk:0.48, wildfire:0.05, ice_storm:0.72, rav:145, hardening_capex:18.6, insurance_coverage:0.58, aep_loss_pct:2.1, saidi_impact:0, adaptation_roi:3.1, rcp45_loss:2.8, rcp85_loss:6.5 },
  { id:5, name:'Offshore Wind Array Foundation E', type:'Renewables', region:'North Sea', flood_risk:0.15, heat_risk:0.18, wind_risk:0.94, wildfire:0.02, ice_storm:0.28, rav:380, hardening_capex:42.1, insurance_coverage:0.85, aep_loss_pct:1.4, saidi_impact:0, adaptation_roi:1.9, rcp45_loss:1.8, rcp85_loss:4.2 },
  { id:6, name:'Desert Solar Farm F', type:'Renewables', region:'Mojave Desert', flood_risk:0.18, heat_risk:0.96, wind_risk:0.38, wildfire:0.28, ice_storm:0.02, rav:95, hardening_capex:8.4, insurance_coverage:0.70, aep_loss_pct:1.6, saidi_impact:0, adaptation_roi:2.6, rcp45_loss:2.0, rcp85_loss:5.1 },
  { id:7, name:'River Crossing Pipeline G', type:'Gas Infra', region:'Midwest', flood_risk:0.78, heat_risk:0.42, wind_risk:0.32, wildfire:0.14, ice_storm:0.55, rav:38, hardening_capex:5.2, insurance_coverage:0.60, aep_loss_pct:2.8, saidi_impact:0, adaptation_roi:3.8, rcp45_loss:3.5, rcp85_loss:8.2 },
  { id:8, name:'Northern Transmission Tower Line H', type:'T&D', region:'Canada', flood_risk:0.22, heat_risk:0.24, wind_risk:0.58, wildfire:0.52, ice_storm:0.88, rav:72, hardening_capex:9.8, insurance_coverage:0.68, aep_loss_pct:2.6, saidi_impact:68, adaptation_roi:2.4, rcp45_loss:3.1, rcp85_loss:6.8 },
  { id:9, name:'Coastal Gas Terminal I', type:'Gas Infra', region:'Louisiana', flood_risk:0.94, heat_risk:0.78, wind_risk:0.92, wildfire:0.08, ice_storm:0.05, rav:520, hardening_capex:65.4, insurance_coverage:0.72, aep_loss_pct:4.8, saidi_impact:0, adaptation_roi:2.2, rcp45_loss:5.8, rcp85_loss:12.4 },
  { id:10, name:'Urban Distribution Network J', type:'T&D', region:'Miami', flood_risk:0.86, heat_risk:0.82, wind_risk:0.84, wildfire:0.04, ice_storm:0.02, rav:180, hardening_capex:24.8, insurance_coverage:0.62, aep_loss_pct:3.4, saidi_impact:95, adaptation_roi:3.2, rcp45_loss:4.2, rcp85_loss:9.6 },
  { id:11, name:'Alpine Pumped Storage K', type:'Generation', region:'Alps', flood_risk:0.42, heat_risk:0.28, wind_risk:0.35, wildfire:0.22, ice_storm:0.64, rav:290, hardening_capex:22.1, insurance_coverage:0.78, aep_loss_pct:1.2, saidi_impact:0, adaptation_roi:2.8, rcp45_loss:1.8, rcp85_loss:4.4 },
  { id:12, name:'Peat Wetland Pipeline L', type:'Gas Infra', region:'UK North', flood_risk:0.58, heat_risk:0.18, wind_risk:0.44, wildfire:0.15, ice_storm:0.38, rav:28, hardening_capex:3.8, insurance_coverage:0.55, aep_loss_pct:1.9, saidi_impact:0, adaptation_roi:4.2, rcp45_loss:2.4, rcp85_loss:5.6 },
  { id:13, name:'Nuclear Power Plant M', type:'Generation', region:'Southeast US', flood_risk:0.62, heat_risk:0.68, wind_risk:0.58, wildfire:0.08, ice_storm:0.12, rav:4200, hardening_capex:180.0, insurance_coverage:0.95, aep_loss_pct:0.8, saidi_impact:0, adaptation_roi:1.6, rcp45_loss:1.2, rcp85_loss:3.2 },
  { id:14, name:'Smart Grid Control Centre N', type:'T&D', region:'Chicago', flood_risk:0.34, heat_risk:0.62, wind_risk:0.44, wildfire:0.06, ice_storm:0.78, rav:42, hardening_capex:5.6, insurance_coverage:0.82, aep_loss_pct:1.6, saidi_impact:210, adaptation_roi:5.8, rcp45_loss:2.1, rcp85_loss:4.8 },
  { id:15, name:'Tidal Barrier Pump Station O', type:'Water', region:'Thames Estuary', flood_risk:0.74, heat_risk:0.28, wind_risk:0.62, wildfire:0.04, ice_storm:0.22, rav:68, hardening_capex:9.2, insurance_coverage:0.75, aep_loss_pct:2.2, saidi_impact:0, adaptation_roi:4.6, rcp45_loss:2.8, rcp85_loss:6.4 },
];

const HARDENING_MEASURES = [
  { measure:'Flood Barriers & Berms', cost_per_site:2.4, peril:'Flood', risk_reduction:0.72, payback_yrs:6.2, ercot_credit:true },
  { measure:'Storm-Hardened Transmission Lines', cost_per_site:8.8, peril:'Wind', risk_reduction:0.58, payback_yrs:9.4, ercot_credit:false },
  { measure:'Elevated Substation Equipment', cost_per_site:1.8, peril:'Flood', risk_reduction:0.65, payback_yrs:5.8, ercot_credit:true },
  { measure:'Cooling System Upgrades', cost_per_site:1.2, peril:'Heat', risk_reduction:0.81, payback_yrs:4.1, ercot_credit:false },
  { measure:'Wildfire Mitigation (PSPS)', cost_per_site:3.6, peril:'Wildfire', risk_reduction:0.68, payback_yrs:7.8, ercot_credit:true },
  { measure:'Underground Cable Conversion', cost_per_site:12.4, peril:'Wind/Ice', risk_reduction:0.88, payback_yrs:14.2, ercot_credit:false },
  { measure:'Backup Generation / Microgrids', cost_per_site:4.2, peril:'Multi-peril', risk_reduction:0.62, payback_yrs:8.6, ercot_credit:true },
  { measure:'Ice Storm Protection (De-icing)', cost_per_site:2.8, peril:'Ice', risk_reduction:0.74, payback_yrs:7.2, ercot_credit:false },
  { measure:'Seismic Bracing', cost_per_site:1.6, peril:'Seismic', risk_reduction:0.85, payback_yrs:15.8, ercot_credit:false },
  { measure:'Data Centre Climate Control', cost_per_site:0.8, peril:'Heat', risk_reduction:0.92, payback_yrs:3.2, ercot_credit:false },
];

const LOSS_TIMELINE = Array.from({ length: 20 }, (_, i) => ({
  year: 2025 + i,
  rcp26: parseFloat((1.2 + i*0.04 + sr(i*7)*0.3).toFixed(2)),
  rcp45: parseFloat((1.4 + i*0.08 + sr(i*11)*0.3).toFixed(2)),
  rcp85: parseFloat((1.8 + i*0.18 + sr(i*9)*0.4).toFixed(2)),
  insured: parseFloat((0.8 + i*0.03 + sr(i*13)*0.2).toFixed(2)),
}));

const INSURANCE_GAP = Array.from({ length: 8 }, (_, i) => ({
  type: ASSETS[i].type,
  name: ASSETS[i].name.split(' ').slice(0,3).join(' '),
  total_exposure: ASSETS[i].rav,
  insured: Math.round(ASSETS[i].rav * ASSETS[i].insurance_coverage),
  gap: Math.round(ASSETS[i].rav * (1 - ASSETS[i].insurance_coverage)),
  gap_pct: Math.round((1 - ASSETS[i].insurance_coverage) * 100),
}));

const SAIDI_IMPROVEMENT = [
  { intervention: 'Underground Cables', saidi_before: 142, saidi_after: 28, cost: 12.4, bcr: 3.8 },
  { intervention: 'Smart Switches', saidi_before: 142, saidi_after: 82, cost: 2.8, bcr: 5.2 },
  { intervention: 'Vegetation Mgmt', saidi_before: 142, saidi_after: 105, cost: 1.4, bcr: 4.1 },
  { intervention: 'Storm Hardening', saidi_before: 142, saidi_after: 68, cost: 8.2, bcr: 3.2 },
  { intervention: 'Microgrids', saidi_before: 142, saidi_after: 38, cost: 6.8, bcr: 2.8 },
  { intervention: 'ADMS Deployment', saidi_before: 142, saidi_after: 55, cost: 4.2, bcr: 4.4 },
];

const PERIL_RADAR = [
  { axis: 'Flood Risk', value: Math.round(ASSETS.reduce((s,a)=>s+a.flood_risk,0)/ASSETS.length*100) },
  { axis: 'Heat Risk', value: Math.round(ASSETS.reduce((s,a)=>s+a.heat_risk,0)/ASSETS.length*100) },
  { axis: 'Wind/Storm', value: Math.round(ASSETS.reduce((s,a)=>s+a.wind_risk,0)/ASSETS.length*100) },
  { axis: 'Wildfire', value: Math.round(ASSETS.reduce((s,a)=>s+a.wildfire,0)/ASSETS.length*100) },
  { axis: 'Ice Storm', value: Math.round(ASSETS.reduce((s,a)=>s+a.ice_storm,0)/ASSETS.length*100) },
];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Pill = ({ label, color }) => (
  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: `${color}20`, color, border: `1px solid ${color}40`, marginRight: 4 }}>{label}</span>
);

const RiskBar = ({ value, label }) => {
  const color = value > 0.7 ? T.red : value > 0.45 ? T.amber : T.green;
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 2 }}>{label}</div>
      <div style={{ background: '#E2E8F0', borderRadius: 4, height: 8 }}>
        <div style={{ width: `${value*100}%`, background: color, borderRadius: 4, height: '100%' }} />
      </div>
    </div>
  );
};

export default function UtilityPhysicalClimateResiliencePage() {
  const [tab, setTab] = useState(0);
  const [selAsset, setSelAsset] = useState(0);
  const [filterType, setFilterType] = useState('All');
  const [rcp, setRcp] = useState('rcp85');
  const [hardeningBudget, setHardeningBudget] = useState(50);

  const asset = ASSETS[selAsset];
  const types = ['All', ...new Set(ASSETS.map(a => a.type))];
  const filtered = useMemo(() => filterType === 'All' ? ASSETS : ASSETS.filter(a => a.type === filterType), [filterType]);

  const totalRAV = useMemo(() => ASSETS.reduce((s,a)=>s+a.rav,0),[]);
  const totalHardening = useMemo(() => ASSETS.reduce((s,a)=>s+a.hardening_capex,0).toFixed(0),[]);
  const avgInsGap = useMemo(() => Math.round(ASSETS.reduce((s,a)=>s+(1-a.insurance_coverage),0)/ASSETS.length*100),[]);
  const totalAAEL = useMemo(() => (ASSETS.reduce((s,a)=>s+a.rav*a.aep_loss_pct/100,0)/1000).toFixed(1),[]);

  const tabs = ['Asset Universe', 'Physical Risk Map', 'Hardening Economics', 'Loss Trajectory', 'Insurance Gap', 'SAIDI/Reliability', 'Adaptation Finance'];

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: T.bg, minHeight: '100vh', padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🛡️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Utility Physical Climate Risk & Asset Resilience</h1>
            <p style={{ margin: 0, fontSize: 13, color: T.sub }}>EP-EL5 · Multi-peril physical risk · SAIDI/SAIFI · Hardening capex ROI · Insurance gap · RCP 2.6/4.5/8.5 loss modelling</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <KpiCard label="Total Asset RAV" value={`$${(totalRAV/1000).toFixed(1)}B`} sub="15 utility assets" color={T.accent} />
        <KpiCard label="Total Hardening Need" value={`$${totalHardening}M`} sub="Capital investment required" color={T.amber} />
        <KpiCard label="Avg Insurance Gap" value={`${avgInsGap}%`} sub="Uninsured physical exposure" color={T.red} />
        <KpiCard label="Portfolio AAEL" value={`$${totalAAEL}B`} sub="Average annual expected loss" color={T.purple} />
        <KpiCard label="High-Risk Assets" value={ASSETS.filter(a=>a.flood_risk>0.7||a.wind_risk>0.8).length} sub="Flood or wind risk >70%" color={T.red} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: tab === i ? T.accent : T.card, color: tab === i ? '#fff' : T.sub,
            boxShadow: tab === i ? `0 2px 8px ${T.accent}40` : 'none',
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {types.map(t => (
              <button key={t} onClick={() => setFilterType(t)} style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${T.border}`, cursor:'pointer', fontSize:12, fontWeight:600, background: filterType===t ? T.accent : T.card, color: filterType===t ? '#fff' : T.sub }}>{t}</button>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  {['Asset','Type','Region','RAV $M','Flood','Heat','Wind','Wildfire','Ice','Hardening $M','Insured %','AAEL%','Adapt ROI'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={a.id} onClick={() => setSelAsset(ASSETS.indexOf(a))} style={{ cursor: 'pointer', background: selAsset === ASSETS.indexOf(a) ? `${T.accent}10` : 'transparent', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.text, fontSize: 11 }}>{a.name}</td>
                    <td style={{ padding: '8px 10px' }}><Pill label={a.type} color={T.teal} /></td>
                    <td style={{ padding: '8px 10px', color: T.sub, fontSize: 11 }}>{a.region}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: T.accent }}>{a.rav}</td>
                    {[a.flood_risk, a.heat_risk, a.wind_risk, a.wildfire, a.ice_storm].map((v, ri) => (
                      <td key={ri} style={{ padding: '8px 10px', color: v > 0.7 ? T.red : v > 0.45 ? T.amber : T.green }}>{(v*100).toFixed(0)}%</td>
                    ))}
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{a.hardening_capex}</td>
                    <td style={{ padding: '8px 10px', color: a.insurance_coverage < 0.65 ? T.red : T.green }}>{(a.insurance_coverage*100).toFixed(0)}%</td>
                    <td style={{ padding: '8px 10px', color: a.aep_loss_pct > 3 ? T.red : T.amber }}>{a.aep_loss_pct}%</td>
                    <td style={{ padding: '8px 10px', color: T.green, fontWeight: 600 }}>{a.adaptation_roi}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 340 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Multi-Peril Risk Profile — Selected Asset: {asset.name}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <RiskBar value={asset.flood_risk} label={`Flood Risk — ${(asset.flood_risk*100).toFixed(0)}%`} />
                  <RiskBar value={asset.heat_risk} label={`Heat/Drought — ${(asset.heat_risk*100).toFixed(0)}%`} />
                  <RiskBar value={asset.wind_risk} label={`Wind/Storm — ${(asset.wind_risk*100).toFixed(0)}%`} />
                </div>
                <div>
                  <RiskBar value={asset.wildfire} label={`Wildfire — ${(asset.wildfire*100).toFixed(0)}%`} />
                  <RiskBar value={asset.ice_storm} label={`Ice Storm — ${(asset.ice_storm*100).toFixed(0)}%`} />
                  <RiskBar value={asset.aep_loss_pct/6} label={`AAEL% — ${asset.aep_loss_pct}%`} />
                </div>
              </div>
              <div style={{ background: '#F0FDF4', borderRadius: 8, padding: '12px 14px' }}>
                {[['Asset RAV', `$${asset.rav}M`],['Hardening Budget Needed', `$${asset.hardening_capex}M`],['Insurance Coverage', `${(asset.insurance_coverage*100).toFixed(0)}%`],['RCP4.5 Loss %', `${asset.rcp45_loss}%`],['RCP8.5 Loss %', `${asset.rcp85_loss}%`],['Adaptation ROI', `${asset.adaptation_roi}×`]].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid #BBF7D0`, fontSize:12 }}>
                    <span style={{ color:T.sub }}>{l}</span><span style={{ fontWeight:700, color:T.text }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 260 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Portfolio Average Peril Exposure</h3>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={PERIL_RADAR}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: T.sub }} />
                  <Radar name="Risk %" dataKey="value" stroke={T.red} fill={T.red} fillOpacity={0.2} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>RCP4.5 vs RCP8.5 Asset Loss Comparison</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ASSETS.map(a => ({ name: a.name.split(' ').slice(0,2).join(' '), rcp45: a.rcp45_loss, rcp85: a.rcp85_loss }))} margin={{ top:0, right:8, left:0, bottom:60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:8, fill:T.sub }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize:10, fill:T.sub }} unit="%" />
                <Tooltip contentStyle={{ fontSize:12 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Bar dataKey="rcp45" name="RCP4.5 Loss%" fill={T.amber} radius={[2,2,0,0]} />
                <Bar dataKey="rcp85" name="RCP8.5 Loss%" fill={T.red} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>Hardening Measure Economics — Cost, Risk Reduction & BCR</h3>
              <div style={{ fontSize: 12, color: T.sub }}>Budget: <strong>${hardeningBudget}M+</strong> <input type="range" min={0} max={15} step={1} value={hardeningBudget} onChange={e=>setHardeningBudget(+e.target.value*10/1.5)} style={{ width: 120 }} /></div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  {['Hardening Measure','Peril','Cost per Site $M','Risk Reduction','Payback Years','ERCOT Credit','Priority'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...HARDENING_MEASURES].sort((a,b)=>b.risk_reduction-a.risk_reduction).map((m, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.text }}>{m.measure}</td>
                    <td style={{ padding: '8px 10px' }}><Pill label={m.peril} color={m.peril.includes('Flood') ? T.blue : m.peril.includes('Heat') ? T.red : T.amber} /></td>
                    <td style={{ padding: '8px 10px', color: T.accent }}>${m.cost_per_site}M</td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:60, background:'#E2E8F0', borderRadius:4, height:8 }}>
                          <div style={{ width:`${m.risk_reduction*100}%`, background: m.risk_reduction>0.75?T.green:T.amber, borderRadius:4, height:'100%' }} />
                        </div>
                        <span style={{ color: m.risk_reduction>0.75?T.green:T.amber }}>{(m.risk_reduction*100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', color: m.payback_yrs < 7 ? T.green : T.amber }}>{m.payback_yrs} yrs</td>
                    <td style={{ padding: '8px 10px' }}><Pill label={m.ercot_credit ? 'Eligible' : 'N/A'} color={m.ercot_credit ? T.green : T.muted} /></td>
                    <td style={{ padding: '8px 10px', color: i < 3 ? T.red : T.sub }}>{i < 3 ? 'High' : i < 6 ? 'Medium' : 'Low'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Cost vs Risk Reduction Trade-off</h3>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="cost_per_site" name="Cost $M/site" tick={{ fontSize:10, fill:T.sub }} />
                  <YAxis dataKey="risk_reduction" name="Risk Reduction" tick={{ fontSize:10, fill:T.sub }} tickFormatter={v=>`${(v*100).toFixed(0)}%`} />
                  <Tooltip cursor={{ strokeDasharray:'3 3' }} contentStyle={{ fontSize:11 }} />
                  <Scatter data={HARDENING_MEASURES} fill={T.accent} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Adaptation ROI by Asset</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[...ASSETS].sort((a,b)=>b.adaptation_roi-a.adaptation_roi).slice(0,10)} layout="vertical" margin={{ top:0, right:16, left:90, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize:10, fill:T.sub }} unit="×" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize:8, fill:T.sub }} width={90} tickFormatter={v=>v.split(' ').slice(0,2).join(' ')} />
                  <Tooltip contentStyle={{ fontSize:11 }} formatter={v=>[`${v}×`,'ROI']} />
                  <Bar dataKey="adaptation_roi" name="Adapt ROI" fill={T.green} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['rcp26','rcp45','rcp85'].map(r => (
              <button key={r} onClick={() => setRcp(r)} style={{ padding:'6px 14px', borderRadius:20, border:`1px solid ${T.border}`, cursor:'pointer', fontSize:12, fontWeight:600, background: rcp===r ? T.accent : T.card, color: rcp===r ? '#fff' : T.sub }}>
                {r === 'rcp26' ? 'RCP 2.6' : r === 'rcp45' ? 'RCP 4.5' : 'RCP 8.5'}
              </button>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Annual Loss % Trajectory — Physical Climate Scenarios (2025–2044)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={LOSS_TIMELINE} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11, fill:T.sub }} />
                <YAxis tick={{ fontSize:11, fill:T.sub }} unit="%" />
                <Tooltip contentStyle={{ fontSize:12 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Area type="monotone" dataKey="rcp26" name="RCP 2.6 Loss%" stroke={T.green} fill={`${T.green}15`} />
                <Area type="monotone" dataKey="rcp45" name="RCP 4.5 Loss%" stroke={T.amber} fill={`${T.amber}15`} />
                <Area type="monotone" dataKey="rcp85" name="RCP 8.5 Loss%" stroke={T.red} fill={`${T.red}15`} />
                <Area type="monotone" dataKey="insured" name="Insured Loss%" stroke={T.accent} fill={`${T.accent}20`} strokeDasharray="5 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[['RCP 2.6 (2°C)', `+${(1.2+20*0.04).toFixed(1)}% by 2044`,'Paris-aligned — significant but manageable physical risk increase', T.green],
              ['RCP 4.5 (2.5°C)', `+${(1.4+20*0.08).toFixed(1)}% by 2044`,'Delayed mitigation — requires systematic hardening programme', T.amber],
              ['RCP 8.5 (4°C)', `+${(1.8+20*0.18).toFixed(1)}% by 2044`,'Business-as-usual — material balance sheet impairment risk', T.red]].map(([sc,v,d,c]) => (
              <div key={sc} style={{ flex:1, background: T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 16px', minWidth:200 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:4 }}>{sc}</div>
                <div style={{ fontSize:20, fontWeight:700, color:c, marginBottom:4 }}>{v}</div>
                <div style={{ fontSize:11, color:T.sub }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Insurance Coverage Gap — Asset Level</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={INSURANCE_GAP} margin={{ top:0, right:8, left:0, bottom:80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:8, fill:T.sub }} angle={-30} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize:10, fill:T.sub }} unit="$M" />
                <Tooltip contentStyle={{ fontSize:12 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Bar dataKey="insured" name="Insured $M" fill={T.green} stackId="a" radius={[0,0,0,0]} />
                <Bar dataKey="gap" name="Gap $M" fill={T.red} stackId="a" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Coverage Gap % vs AAEL</h3>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="gap_pct" name="Gap %" tick={{ fontSize:10, fill:T.sub }} unit="%" />
                  <YAxis dataKey="total_exposure" name="RAV $M" tick={{ fontSize:10, fill:T.sub }} />
                  <Tooltip cursor={{ strokeDasharray:'3 3' }} contentStyle={{ fontSize:11 }} />
                  <Scatter data={INSURANCE_GAP} fill={T.red} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Insurance Gap Mitigation</h3>
              {[['Parametric triggers','Index-based instruments pay quickly without loss adjustment — reduce basis risk for physical events'],['Captive insurer','Utility self-insurance captive — pool risk across asset classes, reduce external premium'],['Cat bond issuance','Transfer tail risk to capital markets — $500M+ threshold for cost efficiency'],['Multi-year policy','Lock in rates 3–5 years ahead of deteriorating climate trajectory'],['Government backstop','FEMA BRIC grants, UK FCERM FDGiA — reduces need for commercial coverage'],['Deductible optimisation','Higher retention with hardening investment — premium savings fund capex']].map(([t,d],i) => (
                <div key={i} style={{ marginBottom:8, fontSize:12 }}>
                  <span style={{ fontWeight:700, color:T.text }}>{t}: </span><span style={{ color:T.sub }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>SAIDI Improvement by Grid Hardening Intervention</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={SAIDI_IMPROVEMENT} margin={{ top:0, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="intervention" tick={{ fontSize:10, fill:T.sub }} />
                <YAxis tick={{ fontSize:11, fill:T.sub }} unit=" min" />
                <Tooltip contentStyle={{ fontSize:12 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Bar dataKey="saidi_before" name="SAIDI Before (min/yr)" fill={T.red} radius={[2,2,0,0]} />
                <Bar dataKey="saidi_after" name="SAIDI After (min/yr)" fill={T.green} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>BCR vs Cost — Hardening Interventions</h3>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="cost" name="Cost $M" tick={{ fontSize:10, fill:T.sub }} />
                  <YAxis dataKey="bcr" name="BCR" tick={{ fontSize:10, fill:T.sub }} />
                  <Tooltip cursor={{ strokeDasharray:'3 3' }} contentStyle={{ fontSize:11 }} />
                  <Scatter data={SAIDI_IMPROVEMENT} fill={T.accent} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Asset SAIDI Impact by Type</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ASSETS.filter(a=>a.saidi_impact>0)} layout="vertical" margin={{ top:0, right:16, left:100, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize:10, fill:T.sub }} unit="min" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize:8, fill:T.sub }} width={100} tickFormatter={v=>v.split(' ').slice(0,2).join(' ')} />
                  <Tooltip contentStyle={{ fontSize:11 }} />
                  <Bar dataKey="saidi_impact" name="SAIDI Impact min/yr" fill={T.amber} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 300 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Adaptation Finance Structures</h3>
            {[
              { name: 'Green Use-of-Proceeds Bond', size: '$500M', tenor: '15yr', rate: 'T+85bps', use: 'Grid hardening, flood defences, cooling upgrades', certified: true },
              { name: 'Sustainability-Linked Bond', size: '$300M', tenor: '10yr', rate: 'T+95bps (step-up if KPI missed)', use: 'Linked to SAIDI reduction KPI (-30% by 2028)', certified: true },
              { name: 'ERCOT Securitisation', size: '$180M', tenor: '20yr', rate: 'AAA T+22bps', use: 'Recoverable storm costs — Winter Storm Uri precedent', certified: false },
              { name: 'FEMA BRIC Grant', size: '$45M', tenor: 'N/A', rate: 'Non-dilutive grant', use: 'Pre-disaster mitigation — competitive federal programme', certified: false },
              { name: 'Resilience Cat Bond', size: '$250M', tenor: '3yr', rate: 'L+650bps', use: 'Transfer flood/storm tail risk >$1B event', certified: false },
              { name: 'IFC/WB Climate Loan', size: '$120M', tenor: '18yr', rate: 'T+45bps concessional', use: 'Emerging market utility adaptation — climate co-benefits', certified: true },
            ].map((f, i) => (
              <div key={i} style={{ background: '#F8FAFC', borderRadius: 8, padding: '12px 14px', marginBottom: 10, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{f.name}</span>
                  {f.certified && <Pill label="Certified" color={T.green} />}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 12 }}>
                  <span><strong style={{ color: T.accent }}>{f.size}</strong></span>
                  <span style={{ color: T.sub }}>{f.tenor}</span>
                  <span style={{ color: T.green }}>{f.rate}</span>
                </div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{f.use}</div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Adaptation Finance Market Sizing</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { segment: 'Grid Hardening', value: 180 },
                { segment: 'Water Infrastructure', value: 95 },
                { segment: 'Gas Network', value: 42 },
                { segment: 'Renewables Resilience', value: 68 },
                { segment: 'Control Systems', value: 28 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="segment" tick={{ fontSize:9, fill:T.sub }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize:10, fill:T.sub }} unit="$B" />
                <Tooltip contentStyle={{ fontSize:12 }} />
                <Bar dataKey="value" name="Investment Need $B" fill={T.accent} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop:16 }}>
              <h4 style={{ margin:'0 0 10px', fontSize:13, fontWeight:700, color:T.text }}>Key Frameworks & Standards</h4>
              {[['TCFD Physical Risk','Scenario analysis mandatory for UK listed utilities — NGFS RCP mapping'],['EU Taxonomy Art.10','Climate adaptation activities eligible — includes grid hardening capex'],['FERC Order 2023','Grid interconnection reform — resilience requirements for new connections'],['NERC CIP-014','Physical security standards — adapt to climate-driven threat landscape'],['NIST CSF','Cybersecurity + physical resilience framework — dual-threat utilities'],['S&P Climate Risk','Physical risk now explicitly scored in utility credit methodology']].map(([t,d],i) => (
                <div key={i} style={{ marginBottom:7, fontSize:11 }}>
                  <span style={{ fontWeight:700, color:T.text }}>{t}: </span><span style={{ color:T.sub }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
