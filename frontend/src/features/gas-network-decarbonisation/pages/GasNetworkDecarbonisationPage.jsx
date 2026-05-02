import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A',
  sub: '#64748B', accent: '#F59E0B', blue: '#2563EB', indigo: '#4F46E5',
  green: '#059669', amber: '#D97706', red: '#DC2626', purple: '#7C3AED',
  teal: '#0D9488', sky: '#0284C7', muted: '#94A3B8',
};

const NETWORKS = [
  { id:1, name:'Cadent Gas (UK)', country:'UK', rab:9400, length_km:82000, connections:4.4e6, hydrogen_ready:0.18, biomethane_injection:2.4, h2_blend_max:20, stranded_risk_2040:'Medium', demand_decline:2.1, opex:520, regulatory:'Ofgem', age_yrs:48, replacement_rate:0.9 },
  { id:2, name:'NGN (UK)', country:'UK', rab:2800, length_km:37000, connections:2.7e6, hydrogen_ready:0.22, biomethane_injection:1.8, h2_blend_max:20, stranded_risk_2040:'Medium', demand_decline:2.3, opex:165, regulatory:'Ofgem', age_yrs:52, replacement_rate:1.0 },
  { id:3, name:'SGN (UK)', country:'UK', rab:3600, length_km:74000, connections:3.9e6, hydrogen_ready:0.14, biomethane_injection:1.2, h2_blend_max:20, stranded_risk_2040:'High', demand_decline:2.8, opex:210, regulatory:'Ofgem', age_yrs:54, replacement_rate:0.8 },
  { id:4, name:'Wales & West (UK)', country:'UK', rab:2400, length_km:35000, connections:2.5e6, hydrogen_ready:0.28, biomethane_injection:0.9, h2_blend_max:20, stranded_risk_2040:'Low', demand_decline:1.9, opex:145, regulatory:'Ofgem', age_yrs:46, replacement_rate:1.1 },
  { id:5, name:'GRTgaz (France)', country:'France', rab:14200, length_km:32000, connections:8.2e6, hydrogen_ready:0.32, biomethane_injection:4.8, h2_blend_max:10, stranded_risk_2040:'Low', demand_decline:1.5, opex:820, regulatory:'CRE', age_yrs:41, replacement_rate:1.4 },
  { id:6, name:'Fluxys Belgium', country:'Belgium', rab:4800, length_km:4000, connections:1.1e6, hydrogen_ready:0.41, biomethane_injection:2.1, h2_blend_max:10, stranded_risk_2040:'Low', demand_decline:1.2, opex:240, regulatory:'CREG', age_yrs:38, replacement_rate:1.6 },
  { id:7, name:'Gasunie (Netherlands)', country:'Netherlands', rab:8200, length_km:12400, connections:7.8e6, hydrogen_ready:0.55, biomethane_injection:3.6, h2_blend_max:0, stranded_risk_2040:'Low', demand_decline:0.8, opex:480, regulatory:'ACM', age_yrs:35, replacement_rate:2.1 },
  { id:8, name:'Open Grid Europe', country:'Germany', rab:11800, length_km:12000, connections:3.2e6, hydrogen_ready:0.48, biomethane_injection:5.2, h2_blend_max:10, stranded_risk_2040:'Low', demand_decline:1.0, opex:680, regulatory:'BNetzA', age_yrs:42, replacement_rate:1.8 },
];

const H2_PATHWAYS = [
  { pathway: '20% Hydrogen Blend', opex_delta: 85, capex_req: 2400, hhv_impact: -4.5, emis_reduction: 7, network_life_ext: 15, regulatory_status: 'Approved UK', co2_abatement: 28, feasibility: 92 },
  { pathway: '100% Hydrogen Conversion', opex_delta: 220, capex_req: 14800, hhv_impact: -74, emis_reduction: 100, network_life_ext: 40, regulatory_status: 'Pilot Phase', co2_abatement: 380, feasibility: 58 },
  { pathway: 'Biomethane Injection', opex_delta: -40, capex_req: 1200, hhv_impact: 0, emis_reduction: 28, network_life_ext: 0, regulatory_status: 'Fully Operational', co2_abatement: 95, feasibility: 98 },
  { pathway: 'Synthetic Methane (e-gas)', opex_delta: 180, capex_req: 4200, hhv_impact: 0, emis_reduction: 80, network_life_ext: 0, regulatory_status: 'Demonstration', co2_abatement: 270, feasibility: 65 },
  { pathway: 'Network Repurposing H2 TSO', opex_delta: 60, capex_req: 3800, hhv_impact: -74, emis_reduction: 100, network_life_ext: 35, regulatory_status: 'Planning', co2_abatement: 320, feasibility: 72 },
  { pathway: 'Managed Decline + Electrification', opex_delta: -120, capex_req: 0, hhv_impact: 0, emis_reduction: 100, network_life_ext: -20, regulatory_status: 'Policy Direction', co2_abatement: 380, feasibility: 80 },
];

const DEMAND_FORECAST = Array.from({ length: 16 }, (_, i) => ({
  year: 2025 + i,
  baseline: Math.round(580 - i*12 + sr(i*7)*25),
  h2_blend: Math.round(580 - i*8 + sr(i*11)*20),
  electrification: Math.round(580 - i*22 + sr(i*9)*15),
  biomethane: Math.round(580 - i*10 + sr(i*13)*22),
}));

const STRANDED_ASSET = Array.from({ length: 8 }, (_, i) => {
  const network = NETWORKS[i];
  const declineRate = network.demand_decline / 100;
  return {
    name: network.name.split(' ')[0],
    rab: network.rab,
    stranded_2030: Math.round(network.rab * declineRate * 5 * 0.6),
    stranded_2035: Math.round(network.rab * declineRate * 10 * 0.7),
    stranded_2040: Math.round(network.rab * declineRate * 15 * 0.8),
  };
});

const BLENDING_ECONOMICS = Array.from({ length: 11 }, (_, i) => ({
  h2_pct: i * 2,
  cost_delta_pct: parseFloat((i * 0.8 + sr(i*7)*0.4).toFixed(1)),
  emission_reduction: parseFloat((i * 0.35 + sr(i*9)*0.1).toFixed(1)),
  hhv_reduction: parseFloat((i * 0.37).toFixed(1)),
  material_upgrade_cost: Math.round(i > 5 ? (i-5) * 180 : 0),
}));

const BIOMETHANE_PIPELINE = [
  { project:'Holbrook Farm AD',capacity_gwh:18,feedstock:'Cattle slurry',status:'Operational',cost_km:2.4,tariff:82,irr:7.8},
  { project:'East Anglian Digestate',capacity_gwh:42,feedstock:'Maize + slurry',status:'Operational',cost_km:4.1,tariff:78,irr:7.2},
  { project:'Scottish Borders AD',capacity_gwh:28,feedstock:'Food waste',status:'Under Construction',cost_km:3.2,tariff:85,irr:8.1},
  { project:'Lincolnshire WWTP Gas',capacity_gwh:35,feedstock:'Sewage sludge',status:'Operational',cost_km:1.8,tariff:76,irr:6.9},
  { project:'Welsh Landfill Recovery',capacity_gwh:22,feedstock:'Landfill gas',status:'Operational',cost_km:0.9,tariff:71,irr:6.4},
  { project:'Yorkshire Energy Crops',capacity_gwh:54,feedstock:'Energy crops',status:'Planning',cost_km:5.8,tariff:88,irr:8.4},
];

const RADAR_READINESS = [
  { axis: 'H2 Material Readiness', value: 65 },
  { axis: 'Regulatory Framework', value: 72 },
  { axis: 'Biomethane Capacity', value: 81 },
  { axis: 'Demand Signal Clarity', value: 48 },
  { axis: 'Capex Pipeline', value: 70 },
  { axis: 'Stranded Asset Management', value: 58 },
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

export default function GasNetworkDecarbonisationPage() {
  const [tab, setTab] = useState(0);
  const [selNet, setSelNet] = useState(0);
  const [h2Blend, setH2Blend] = useState(20);
  const [declineScenario, setDeclineScenario] = useState('baseline');
  const [strandedYear, setStrandedYear] = useState(2035);

  const net = NETWORKS[selNet];
  const totalRAB = useMemo(() => NETWORKS.reduce((s,n)=>s+n.rab,0),[]);
  const avgH2Ready = useMemo(() => (NETWORKS.reduce((s,n)=>s+n.hydrogen_ready,0)/NETWORKS.length*100).toFixed(0),[]);
  const totalBiomethane = useMemo(() => NETWORKS.reduce((s,n)=>s+n.biomethane_injection,0).toFixed(1),[]);
  const avgDecline = useMemo(() => (NETWORKS.reduce((s,n)=>s+n.demand_decline,0)/NETWORKS.length).toFixed(1),[]);

  const blendPoint = BLENDING_ECONOMICS.find(b => b.h2_pct === (Math.round(h2Blend/2)*2)) || BLENDING_ECONOMICS[5];
  const strandedKey = strandedYear === 2030 ? 'stranded_2030' : strandedYear === 2035 ? 'stranded_2035' : 'stranded_2040';
  const totalStranded = STRANDED_ASSET.reduce((s,n) => s+n[strandedKey], 0);

  const tabs = ['Network Universe', 'Decarbonisation Pathways', 'Demand Forecasting', 'H2 Blending Economics', 'Stranded Asset Risk', 'Biomethane Pipeline', 'Network Readiness'];

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: T.bg, minHeight: '100vh', padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔥</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Gas Network Decarbonisation Finance</h1>
            <p style={{ margin: 0, fontSize: 13, color: T.sub }}>EP-EL4 · H2 blending · Biomethane injection · Network repurposing · Stranded asset risk · RIIO-GD3 / Ofgem</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <KpiCard label="Aggregate RAB" value={`£${(totalRAB/1000).toFixed(1)}B`} sub="8 gas DSOs/TSOs" color={T.accent} />
        <KpiCard label="Avg H2 Readiness" value={`${avgH2Ready}%`} sub="Network assets ready" color={T.green} />
        <KpiCard label="Biomethane Injected" value={`${totalBiomethane} TWh`} sub="Annual biomethane total" color={T.teal} />
        <KpiCard label="Avg Demand Decline" value={`${avgDecline}%/yr`} sub="Structural gas demand" color={T.red} />
        <KpiCard label="UK H2 Town Trials" value="3 Active" sub="Hydrogen Living Lab etc." color={T.purple} />
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
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20, overflowX: 'auto' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Gas Distribution & Transmission Networks</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  {['Network','Country','RAB £M','Length km','Connections M','H2 Ready %','Biomethane TWh','Max H2 Blend','Demand Decline','Stranded Risk','Regulator'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NETWORKS.map((n, i) => (
                  <tr key={n.id} onClick={() => setSelNet(i)} style={{ cursor: 'pointer', background: selNet === i ? `${T.accent}10` : 'transparent', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.text }}>{n.name}</td>
                    <td style={{ padding: '8px 10px', color: T.sub }}>{n.country}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: T.accent }}>{n.rab.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px' }}>{n.length_km.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px' }}>{(n.connections/1e6).toFixed(1)}</td>
                    <td style={{ padding: '8px 10px', color: n.hydrogen_ready > 0.4 ? T.green : T.amber }}>{(n.hydrogen_ready*100).toFixed(0)}%</td>
                    <td style={{ padding: '8px 10px', color: T.teal }}>{n.biomethane_injection} TWh</td>
                    <td style={{ padding: '8px 10px' }}>{n.h2_blend_max > 0 ? `${n.h2_blend_max}%` : 'H2 Pure'}</td>
                    <td style={{ padding: '8px 10px', color: n.demand_decline > 2 ? T.red : T.amber }}>{n.demand_decline}%/yr</td>
                    <td style={{ padding: '8px 10px' }}><Pill label={n.stranded_risk_2040} color={n.stranded_risk_2040==='Low' ? T.green : n.stranded_risk_2040==='Medium' ? T.amber : T.red} /></td>
                    <td style={{ padding: '8px 10px', color: T.sub }}>{n.regulatory}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>RAB vs H2 Readiness</h3>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="hydrogen_ready" name="H2 Ready %" tick={{ fontSize:10, fill:T.sub }} tickFormatter={v=>`${(v*100).toFixed(0)}%`} />
                  <YAxis dataKey="rab" name="RAB £M" tick={{ fontSize:10, fill:T.sub }} />
                  <Tooltip cursor={{ strokeDasharray:'3 3' }} contentStyle={{ fontSize:11 }} />
                  <Scatter data={NETWORKS} fill={T.accent} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Network Readiness Radar</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={RADAR_READINESS}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize:9, fill:T.sub }} />
                  <Radar name="Score" dataKey="value" stroke={T.accent} fill={T.accent} fillOpacity={0.2} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20, overflowX: 'auto' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Decarbonisation Pathway Comparison</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  {['Pathway','Opex Δ £M','Capex Req £M','HHV Impact','Emissions Red.','Net Life Ext.','CO₂ Abatement £/t','Feasibility','Status'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {H2_PATHWAYS.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.text }}>{p.pathway}</td>
                    <td style={{ padding: '8px 10px', color: p.opex_delta < 0 ? T.green : T.red }}>{p.opex_delta > 0 ? '+' : ''}{p.opex_delta}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: T.accent }}>{p.capex_req > 0 ? p.capex_req.toLocaleString() : '—'}</td>
                    <td style={{ padding: '8px 10px', color: p.hhv_impact < 0 ? T.red : T.sub }}>{p.hhv_impact}%</td>
                    <td style={{ padding: '8px 10px', color: T.green }}>{p.emis_reduction}%</td>
                    <td style={{ padding: '8px 10px', color: p.network_life_ext > 0 ? T.green : T.red }}>{p.network_life_ext > 0 ? `+${p.network_life_ext}yr` : `${p.network_life_ext}yr`}</td>
                    <td style={{ padding: '8px 10px' }}>£{p.co2_abatement}/t</td>
                    <td style={{ padding: '8px 10px', color: p.feasibility >= 80 ? T.green : T.amber }}>{p.feasibility}%</td>
                    <td style={{ padding: '8px 10px' }}><Pill label={p.regulatory_status} color={p.regulatory_status.includes('Operational') ? T.green : p.regulatory_status.includes('Pilot') ? T.teal : T.amber} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Capex vs CO₂ Abatement Cost</h3>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="capex_req" name="Capex £M" tick={{ fontSize:10, fill:T.sub }} />
                  <YAxis dataKey="co2_abatement" name="Abatement £/t" tick={{ fontSize:10, fill:T.sub }} />
                  <Tooltip cursor={{ strokeDasharray:'3 3' }} contentStyle={{ fontSize:11 }} />
                  <Scatter data={H2_PATHWAYS} fill={T.green} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Pathway Feasibility vs Emission Reduction</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={H2_PATHWAYS} margin={{ top:0, right:8, left:0, bottom:60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="pathway" tick={{ fontSize:8, fill:T.sub }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize:10, fill:T.sub }} />
                  <Tooltip contentStyle={{ fontSize:12 }} />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                  <Bar dataKey="feasibility" name="Feasibility %" fill={T.accent} radius={[2,2,0,0]} />
                  <Bar dataKey="emis_reduction" name="Emission Red. %" fill={T.green} radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {['baseline','h2_blend','electrification','biomethane'].map(s => (
              <button key={s} onClick={() => setDeclineScenario(s)} style={{ padding:'6px 14px', borderRadius:20, border:`1px solid ${T.border}`, cursor:'pointer', fontSize:12, fontWeight:600, background: declineScenario===s ? T.accent : T.card, color: declineScenario===s ? '#fff' : T.sub }}>
                {s === 'h2_blend' ? 'H2 Blend' : s.charAt(0).toUpperCase()+s.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Gas Demand Forecast by Decarbonisation Scenario (2025–2040)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={DEMAND_FORECAST} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize:11, fill:T.sub }} />
                <YAxis tick={{ fontSize:11, fill:T.sub }} unit="TWh" />
                <Tooltip contentStyle={{ fontSize:12 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Area type="monotone" dataKey="baseline" name="Baseline" stroke={T.sub} fill={`${T.sub}15`} strokeDasharray="6 3" />
                <Area type="monotone" dataKey="h2_blend" name="H2 Blend" stroke={T.accent} fill={`${T.accent}20`} />
                <Area type="monotone" dataKey="biomethane" name="Biomethane Switch" stroke={T.green} fill={`${T.green}20`} />
                <Area type="monotone" dataKey="electrification" name="Electrification" stroke={T.red} fill={`${T.red}15`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[['Baseline (ETS-driven)','-12% by 2035','Policy inertia — ETS carbon price drives gradual fuel switching'],['H2 Blend (20%)','-8% by 2035','Hydrogen substitution offsets demand decline via industrial H2'],['Biomethane Scale-Up','-10% by 2035','Biomethane growth sustains volumes, offsets residential heat pump roll'],['Rapid Electrification','-35% by 2035','UK Climate Compatibility Checkpoint — ban on new gas boilers by 2035']].map(([s,d,desc]) => (
              <div key={s} style={{ flex:1, background: T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 16px', minWidth:200 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:4 }}>{s}</div>
                <div style={{ fontSize:20, fontWeight:700, color:T.accent, marginBottom:4 }}>{d}</div>
                <div style={{ fontSize:11, color:T.sub }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>H2 Blending Cost & Impact Curve</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={BLENDING_ECONOMICS} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="h2_pct" tick={{ fontSize:11, fill:T.sub }} unit="%" label={{ value:'H2 Blend %', position:'insideBottom', offset:-2, style:{fontSize:11} }} />
                <YAxis yAxisId="left" tick={{ fontSize:11, fill:T.sub }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fill:T.sub }} />
                <Tooltip contentStyle={{ fontSize:12 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Line yAxisId="left" type="monotone" dataKey="cost_delta_pct" name="Cost Increase %" stroke={T.red} strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="emission_reduction" name="Emis. Reduction %" stroke={T.green} strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="hhv_reduction" name="HHV Reduction %" stroke={T.amber} strokeWidth={2} dot={false} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Blend Level Simulator — {net.name}</h3>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: T.sub }}>H2 Blend Target: <strong>{h2Blend}%</strong></label>
                <input type="range" min={2} max={20} step={2} value={h2Blend} onChange={e => setH2Blend(+e.target.value)} style={{ width:'100%', marginTop:4 }} />
              </div>
              <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '14px 16px' }}>
                {[['Network', net.name],['Max Approved Blend', `${net.h2_blend_max}%`],['Selected Blend', `${h2Blend}%`],['Cost Uplift', `+${blendPoint.cost_delta_pct}%`],['Emission Reduction', `${blendPoint.emission_reduction}%`],['HHV Impact', `-${blendPoint.hhv_reduction}%`],['Material Upgrade Cost', blendPoint.material_upgrade_cost > 0 ? `£${blendPoint.material_upgrade_cost}M` : 'None required']].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid #FDE68A`, fontSize:12 }}>
                    <span style={{ color:T.sub }}>{l}</span><span style={{ fontWeight:700, color:T.text }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Material Upgrade Requirements by Blend Level</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={BLENDING_ECONOMICS.filter(b=>b.h2_pct>0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="h2_pct" tick={{ fontSize:10, fill:T.sub }} unit="%" />
                  <YAxis tick={{ fontSize:10, fill:T.sub }} />
                  <Tooltip contentStyle={{ fontSize:12 }} />
                  <Bar dataKey="material_upgrade_cost" name="Upgrade Cost £M" fill={T.accent} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <span style={{ fontSize:12, color:T.sub }}>Stranded Asset Horizon:</span>
            {[2030, 2035, 2040].map(yr => (
              <button key={yr} onClick={() => setStrandedYear(yr)} style={{ padding:'6px 14px', borderRadius:20, border:`1px solid ${T.border}`, cursor:'pointer', fontSize:12, fontWeight:600, background: strandedYear===yr ? T.red : T.card, color: strandedYear===yr ? '#fff' : T.sub }}>{yr}</button>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: T.text }}>Stranded RAB Exposure — {strandedYear} Forecast</h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: T.sub }}>Total potential stranded value: <strong style={{ color: T.red }}>£{(totalStranded/1000).toFixed(1)}B</strong> across 8 networks</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={STRANDED_ASSET} margin={{ top:0, right:8, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:11, fill:T.sub }} />
                <YAxis tick={{ fontSize:11, fill:T.sub }} />
                <Tooltip contentStyle={{ fontSize:12 }} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Bar dataKey="rab" name="Total RAB £M" fill={T.sub} fillOpacity={0.3} radius={[2,2,0,0]} />
                <Bar dataKey={strandedKey} name="Stranded £M" fill={T.red} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: '#FFF1F2', border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: T.red }}>Stranded Asset Risk Factors</h3>
              {[['Policy acceleration','Government ban on gas boilers (2035) pulls forward demand decline by 5–7 years'],['Heat pump cost parity','Electric heat pump running costs already lower than gas in high ETS price scenario'],['Financial covenant breach','Gearing ratios breach if RAB declines force writedowns before debt maturity'],['Regulatory ringfencing','Ofgem considering separate regulatory ringfence for at-risk gas assets'],['Customer affordability','Network charges rise as fixed cost spread over smaller customer base'],['Investor ESG screens','Gas network bonds excluded from Paris-aligned fixed income indices']].map(([t,d],i) => (
                <div key={i} style={{ marginBottom:8, fontSize:12 }}>
                  <span style={{ fontWeight:700, color:T.text }}>{t}: </span><span style={{ color:T.sub }}>{d}</span>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, background: '#F0FDF4', border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: T.green }}>Stranded Asset Mitigation Strategies</h3>
              {[['Hydrogen repurposing','Convert network to 100% H2 — avoids stranding, preserves RAB value'],['Accelerated depreciation','Front-load depreciation to recover more RAB before asset demand falls'],['Social tariff ring-fence','Propose regulatory mechanism to spread costs across all energy bills'],['Network right-sizing','Proactively decommission low-utilisation rural spur lines; costs recoverable'],['Gas-hydrogen swap','CCUS + SMR plant co-location — network becomes H2 distribution asset'],['Long-term debt match','Issue 30+ year bonds to match infrastructure life — manages refinancing']].map(([t,d],i) => (
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
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Biomethane Injection Projects Pipeline</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  {['Project','Capacity GWh','Feedstock','Status','Cost £/km','Tariff £/MWh','IRR'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BIOMETHANE_PIPELINE.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.text }}>{p.project}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: T.accent }}>{p.capacity_gwh}</td>
                    <td style={{ padding: '8px 10px', color: T.sub }}>{p.feedstock}</td>
                    <td style={{ padding: '8px 10px' }}><Pill label={p.status} color={p.status==='Operational' ? T.green : p.status==='Under Construction' ? T.accent : T.amber} /></td>
                    <td style={{ padding: '8px 10px' }}>£{p.cost_km}M</td>
                    <td style={{ padding: '8px 10px', color: T.teal }}>£{p.tariff}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: T.green }}>{p.irr}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Biomethane Capacity by Network</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[...NETWORKS].sort((a,b)=>b.biomethane_injection-a.biomethane_injection)} layout="vertical" margin={{ top:0, right:16, left:110, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize:10, fill:T.sub }} unit="TWh" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize:9, fill:T.sub }} width={110} />
                  <Tooltip contentStyle={{ fontSize:12 }} />
                  <Bar dataKey="biomethane_injection" name="Biomethane TWh" fill={T.green} radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>IRR vs Capacity</h3>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="capacity_gwh" name="Capacity GWh" tick={{ fontSize:10, fill:T.sub }} />
                  <YAxis dataKey="irr" name="IRR %" tick={{ fontSize:10, fill:T.sub }} />
                  <Tooltip cursor={{ strokeDasharray:'3 3' }} contentStyle={{ fontSize:11 }} />
                  <Scatter data={BIOMETHANE_PIPELINE} fill={T.teal} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 300 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Network H2-Readiness Scorecard</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  {['Network','H2 Ready','Blend Max','Biomethane','Demand Δ','Score'].map(h => (
                    <th key={h} style={{ padding: '7px 8px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NETWORKS.map((n,i) => {
                  const score = Math.round(n.hydrogen_ready*40 + n.h2_blend_max/20*20 + n.biomethane_injection/5.2*20 + (3-n.demand_decline)/3*20);
                  return (
                    <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'7px 8px', fontWeight:600, color:T.text, fontSize:11 }}>{n.name.split(' ')[0]}</td>
                      <td style={{ padding:'7px 8px', color:T.green }}>{(n.hydrogen_ready*100).toFixed(0)}%</td>
                      <td style={{ padding:'7px 8px' }}>{n.h2_blend_max > 0 ? `${n.h2_blend_max}%` : 'H2'}</td>
                      <td style={{ padding:'7px 8px', color:T.teal }}>{n.biomethane_injection}TWh</td>
                      <td style={{ padding:'7px 8px', color:T.red }}>-{n.demand_decline}%</td>
                      <td style={{ padding:'7px 8px', fontWeight:700, color: score>=60 ? T.green : score>=45 ? T.amber : T.red }}>{score}/100</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, minWidth: 280 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: T.text }}>Investor Considerations — Gas Networks</h3>
            {[['Regulatory visibility','RIIO-GD3 (2026-31) will set framework for transition capex recovery — key binary risk'],['Hydrogen Economy upside','Networks positioning as H2 distribution backbone — option value not in RAB'],['Biomethane as bridge','Green gas certificates + GGSS subsidy support near-term investment case'],['Debt maturity mismatch','30-40yr infrastructure life vs 15-20yr assumed gas demand — structural tension'],['ESG classification','Ofgem\'s Net Zero Obligation — networks may qualify as EU Taxonomy aligned (art. 10.6)'],['Climate TCFD disclosure','Ofgem mandatory TCFD reporting from 2022 — scenario analysis required'],['Stranded asset provision','Some networks provisioning for accelerated depreciation — watch EPS impact'],['M&A angle','Potential consolidation of UK gas networks post-PR24 if valuations compress']].map(([t,d],i) => (
              <div key={i} style={{ marginBottom:8, fontSize:12 }}>
                <span style={{ fontWeight:700, color:T.text }}>{t}: </span><span style={{ color:T.sub }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
