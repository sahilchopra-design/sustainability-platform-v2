import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, Cell,
} from 'recharts';

// Backend E93 Critical Minerals & Transition Metals Risk engine (IEA CRM 2024 /
// EU CRM Act 2024/1252 / IRMA Standard v1.0 / OECD DDG 5-step / conflict minerals).
// See backend/services/critical_minerals_engine.py + backend/api/v1/routes/critical_minerals.py
const API = 'http://localhost:8001';
const CRM_API = `${API}/api/v1/critical-minerals`;

// Frontend option values -> exact backend IEA_CRITICAL_MINERALS_2024 keys
// (backend uses "silicon_metal"/"platinum_group_metals"; frontend keeps shorter
// option values for the EU CRMA Annex sets below, so map on request only).
const MINERAL_TO_BACKEND = {
  silicon: 'silicon_metal',
  platinum_group: 'platinum_group_metals',
};
const toBackendMineral = (m) => MINERAL_TO_BACKEND[m] || m;

const SECTOR_OPTIONS = [
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'automotive', label: 'Automotive / EV' },
  { value: 'renewable_energy', label: 'Renewable Energy' },
  { value: 'technology', label: 'Technology / Electronics' },
  { value: 'mining', label: 'Mining & Metals' },
];
const T={bg:'#f4f6f9',surface:'#ffffff',surfaceH:'#eef1f6',border:'#e3e8ef',borderL:'#cfd6e0',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const seed = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ border: `1px solid ${accent ? '#059669' : '#e5e7eb'}`, borderRadius: 8, padding: '16px 20px', background: 'white' }}>
    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: '#1b3a5c' }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{sub}</div>}
  </div>
);
const Btn = ({ children, onClick }) => (
  <button onClick={onClick} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#059669', color: 'white', fontWeight: 600, fontSize: 14 }}>{children}</button>
);
const Inp = ({ label, value, onChange, type = 'text' }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{label}</div>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, background: 'white', boxSizing: 'border-box' }} />
  </div>
);
const Sel = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, background: 'white' }}>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  </div>
);
const Section = ({ title, children, status }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontSize: 16, fontWeight: 600, color: '#1b3a5c', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #059669', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span>{title}</span>
      {status === 'live' && <LiveBadge label="● Live — /api/v1/critical-minerals" tone="live" />}
      {status === 'demo' && <LiveBadge label="○ Demo Data — API unavailable" tone="demo" />}
      {status === 'loading' && <LiveBadge label="Connecting…" tone="loading" />}
    </div>
    {children}
  </div>
);
const LiveBadge = ({ label, tone }) => {
  const styles = {
    live: { bg: '#dcfce7', text: '#166534' },
    demo: { bg: '#fef3c7', text: '#92400e' },
    loading: { bg: '#f3f4f6', text: '#6b7280' },
  }[tone];
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: styles.bg, color: styles.text }}>{label}</span>;
};
const Row = ({ children, gap = 12 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${React.Children.count(children)},1fr)`, gap }}>{children}</div>
);
const Badge = ({ label, color }) => {
  const colors = { green: { bg: '#d1fae5', text: '#065f46' }, yellow: { bg: '#fef3c7', text: '#92400e' }, red: { bg: '#fee2e2', text: '#991b1b' }, blue: { bg: '#dbeafe', text: '#1e40af' }, gray: { bg: '#f3f4f6', text: '#374151' }, purple: { bg: '#ede9fe', text: '#5b21b6' }, orange: { bg: '#ffedd5', text: '#9a3412' } };
  const c = colors[color] || colors.gray;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: c.bg, color: c.text }}>{label}</span>;
};

const TABS = ['IEA Criticality', 'EU CRM Act', 'IRMA Responsible Mining', 'Supply Chain Risk', 'Overall CRM Risk'];

const MINERAL_OPTIONS = [
  { value: 'lithium', label: 'Lithium (Li)' },
  { value: 'cobalt', label: 'Cobalt (Co)' },
  { value: 'nickel', label: 'Nickel (Ni)' },
  { value: 'copper', label: 'Copper (Cu)' },
  { value: 'rare_earths', label: 'Rare Earth Elements (REE)' },
  { value: 'manganese', label: 'Manganese (Mn)' },
  { value: 'graphite', label: 'Graphite (C)' },
  { value: 'platinum_group', label: 'Platinum Group Metals (PGM)' },
  { value: 'silicon', label: 'Silicon Metal (Si)' },
  { value: 'gallium', label: 'Gallium (Ga)' },
];

const TECH_OPTIONS = [
  { value: 'ev_battery', label: 'EV Battery Technology' },
  { value: 'solar_pv', label: 'Solar PV (Crystalline)' },
  { value: 'wind_offshore', label: 'Offshore Wind Turbines' },
  { value: 'grid_storage', label: 'Grid-Scale Storage' },
  { value: 'fuel_cell', label: 'Hydrogen Fuel Cells' },
];

// EU Critical Raw Materials Act — Regulation (EU) 2024/1252
// Annex I: Strategic Raw Materials (17 materials — supply-side critical for green & digital)
const EU_CRMA_ANNEX_I_STRATEGIC = new Set([
  'lithium','cobalt','nickel','copper','rare_earths','manganese',
  'graphite','platinum_group','silicon','gallium','germanium',
  'tungsten','titanium','antimony','bismuth','boron','arsenic',
]);
// Annex II: Critical Raw Materials (34 materials — includes all Annex I + additional)
const EU_CRMA_ANNEX_II_CRITICAL = new Set([
  // All Annex I (Strategic) are also Critical
  ...EU_CRMA_ANNEX_I_STRATEGIC,
  // Additional Annex II — critical but not yet strategic tier
  'barite','beryllium','chromium','coking_coal','feldspar',
  'fluorspar','hafnium','indium','magnesium','phosphate',
  'scandium','strontium','tantalum','vanadium','natural_rubber',
  'phosphorus', // hafnium deduplicated — already in Annex I Strategic set above
]);

const getIeaData = (mineral) => {
  const mi = MINERAL_OPTIONS.findIndex(m => m.value === mineral) + 1;
  const subScores = [
    { name: 'Demand Growth', key: 'demand_growth', value: Math.round(seed(mi * 7) * 40 + 55) },
    { name: 'Supply Concentration', key: 'supply_concentration', value: Math.round(seed(mi * 11) * 35 + 50) },
    { name: 'Geopolitical Risk', key: 'geopolitical_risk', value: Math.round(seed(mi * 13) * 38 + 45) },
    { name: 'Substitutability', key: 'substitutability', value: Math.round(seed(mi * 17) * 30 + 40) },
  ];
  const composite = Math.round(subScores.reduce((s, x) => s + x.value, 0) / 4);
  const tier = composite >= 80 ? 'Critical' : composite >= 65 ? 'High' : composite >= 50 ? 'Medium' : 'Low';
  const tierColor = composite >= 80 ? 'red' : composite >= 65 ? 'orange' : composite >= 50 ? 'yellow' : 'green';
  return { subScores, composite, tier, tierColor };
};

const getEuCrmData = (mineral) => {
  const mi = MINERAL_OPTIONS.findIndex(m => m.value === mineral) + 1;
  // Official EU CRMA (Regulation EU 2024/1252) Annex I/II classification
  const strategic = EU_CRMA_ANNEX_I_STRATEGIC.has(mineral); // Annex I: Strategic
  const critical = EU_CRMA_ANNEX_II_CRITICAL.has(mineral);   // Annex II: Critical
  const compliance = Math.round(seed(mi * 29) * 35 + 50);
  const gaps = [
    { name: 'Domestic Production', value: Math.round(seed(mi * 31) * 40 + 20) },
    { name: 'Recycling Capacity', value: Math.round(seed(mi * 37) * 35 + 25) },
    { name: 'Stockpile Adequacy', value: Math.round(seed(mi * 41) * 30 + 30) },
    { name: 'Import Diversification', value: Math.round(seed(mi * 43) * 38 + 28) },
    { name: 'R&D Investment', value: Math.round(seed(mi * 47) * 25 + 35) },
  ];
  return { strategic, critical, compliance, gaps };
};

const getIrmaData = (mineral) => {
  const mi = MINERAL_OPTIONS.findIndex(m => m.value === mineral) + 1;
  const areas = [
    { dimension: 'Business Integrity', score: Math.round(seed(mi * 53) * 30 + 50) },
    { dimension: 'Community', score: Math.round(seed(mi * 57) * 28 + 48) },
    { dimension: 'Labour Rights', score: Math.round(seed(mi * 59) * 32 + 45) },
    { dimension: 'Environment', score: Math.round(seed(mi * 61) * 30 + 47) },
    { dimension: 'Mining Lifecycle', score: Math.round(seed(mi * 67) * 28 + 50) },
    { dimension: 'Indigenous Rights', score: Math.round(seed(mi * 71) * 35 + 42) },
  ];
  const composite = Math.round(areas.reduce((s, a) => s + a.score, 0) / areas.length);
  const tier = composite >= 80 ? 'IRMA 100' : composite >= 65 ? 'IRMA 75' : composite >= 50 ? 'IRMA 50' : 'IRMA 25';
  const tierColor = composite >= 80 ? 'green' : composite >= 65 ? 'blue' : composite >= 50 ? 'yellow' : 'red';
  return { areas, composite, tier, tierColor };
};

const getSupplyChainData = (mineral) => {
  const mi = MINERAL_OPTIONS.findIndex(m => m.value === mineral) + 1;
  const exposures = [
    { name: 'EV Battery', value: parseFloat((seed(mi * 73) * 80 + 20).toFixed(1)) },
    { name: 'Solar PV', value: parseFloat((seed(mi * 79) * 60 + 15).toFixed(1)) },
    { name: 'Wind Turbine', value: parseFloat((seed(mi * 83) * 50 + 10).toFixed(1)) },
    { name: 'Grid Storage', value: parseFloat((seed(mi * 89) * 40 + 10).toFixed(1)) },
    { name: 'Fuel Cells', value: parseFloat((seed(mi * 97) * 30 + 5).toFixed(1)) },
  ];
  const total = parseFloat(exposures.reduce((s, e) => s + e.value, 0).toFixed(1));
  const hhi = total > 0 ? parseFloat((exposures.reduce((s, e) => s + Math.pow(e.value / total, 2), 0) * 10000).toFixed(0)) : 0;
  const hhiTier = hhi >= 2500 ? 'High Concentration' : hhi >= 1500 ? 'Moderate' : 'Diversified';
  const hhiColor = hhi >= 2500 ? 'red' : hhi >= 1500 ? 'yellow' : 'green';
  return { exposures, total, hhi, hhiTier, hhiColor };
};

const getOverallData = (mineral) => {
  const mi = MINERAL_OPTIONS.findIndex(m => m.value === mineral) + 1;
  const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2030];
  const priceVolatility = years.map((yr, i) => ({
    year: yr,
    score: Math.round(seed(mi * 101 + i * 7) * 40 + 45),
  }));
  const supplyDisruptionProb = Math.round(seed(mi * 107) * 35 + 15);
  const top3CountryShare = Math.round(seed(mi * 109) * 30 + 55);
  const riskTier = top3CountryShare >= 80 ? 'Very High' : top3CountryShare >= 65 ? 'High' : top3CountryShare >= 50 ? 'Medium' : 'Low';
  const riskColor = top3CountryShare >= 80 ? 'red' : top3CountryShare >= 65 ? 'orange' : top3CountryShare >= 50 ? 'yellow' : 'green';
  return { priceVolatility, supplyDisruptionProb, top3CountryShare, riskTier, riskColor };
};

export default function CriticalMineralsPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mineral, setMineral] = useState('lithium');
  const [techFocus, setTechFocus] = useState('ev_battery');
  const [entityName, setEntityName] = useState('Demo EV Manufacturer');
  const [sector, setSector] = useState('manufacturing');
  const [evExposure, setEvExposure] = useState('500');
  const [solarExposure, setSolarExposure] = useState('120');
  const [windExposure, setWindExposure] = useState('80');
  const [gridExposure, setGridExposure] = useState('60');
  const [annualVolume, setAnnualVolume] = useState('5000');

  // Demo (seeded) data — used only as fallback when the live engine is unreachable
  const ieaDemo = getIeaData(mineral);
  const euCrmDemo = getEuCrmData(mineral);
  const irmaDemo = getIrmaData(mineral);
  const supplyDemo = getSupplyChainData(mineral);
  const overallDemo = getOverallData(mineral);

  // --- Live backend wiring (E93 Critical Minerals Engine) -------------------
  // POST /api/v1/critical-minerals/assess — full IEA/EU CRM Act/IRMA/OECD DDG assessment
  const [assessLive, setAssessLive] = useState(null);
  const [assessStatus, setAssessStatus] = useState('loading');
  useEffect(() => {
    let cancelled = false;
    setAssessStatus('loading');
    const t = setTimeout(async () => {
      try {
        const { data } = await axios.post(`${CRM_API}/assess`, {
          entity_id: 'demo-001',
          entity_name: entityName || 'Demo Entity',
          sector,
          minerals_exposed: [toBackendMineral(mineral)],
          ev_battery_exposure_m: parseFloat(evExposure) || 0,
          solar_pv_exposure_m: parseFloat(solarExposure) || 0,
          wind_turbine_exposure_m: parseFloat(windExposure) || 0,
          grid_storage_exposure_m: parseFloat(gridExposure) || 0,
          eu_crm_act_applicable: true,
          eu_strategic_minerals_sourced: [toBackendMineral(mineral)],
          eu_crm_audit_completed: false,
        }, { timeout: 10000 });
        if (!cancelled) { setAssessLive(data); setAssessStatus('live'); }
      } catch (e) {
        if (!cancelled) { setAssessLive(null); setAssessStatus('demo'); }
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [mineral, sector, entityName, evExposure, solarExposure, windExposure, gridExposure]);

  // POST /api/v1/critical-minerals/supply-chain-map — per-mineral country/conflict risk
  const [supplyMapLive, setSupplyMapLive] = useState(null);
  const [supplyMapStatus, setSupplyMapStatus] = useState('loading');
  useEffect(() => {
    let cancelled = false;
    setSupplyMapStatus('loading');
    const t = setTimeout(async () => {
      try {
        const { data } = await axios.post(`${CRM_API}/supply-chain-map`, {
          entity_id: 'demo-001',
          entity_name: entityName || 'Demo Entity',
          mineral: toBackendMineral(mineral),
          technology_application: techFocus,
          annual_volume_tonnes: parseFloat(annualVolume) || 1000,
          smelter_audit_completed: false,
        }, { timeout: 10000 });
        if (!cancelled) { setSupplyMapLive(data); setSupplyMapStatus('live'); }
      } catch (e) {
        if (!cancelled) { setSupplyMapLive(null); setSupplyMapStatus('demo'); }
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [mineral, techFocus, annualVolume, entityName]);

  // --- Derive display data: live values when available, seeded demo otherwise
  const iea = assessStatus === 'live' && assessLive ? {
    subScores: [
      { name: 'Demand Growth', key: 'demand_growth', value: Math.round(assessLive.iea_crm_2024.demand_growth_score) },
      { name: 'Supply Concentration', key: 'supply_concentration', value: Math.round(assessLive.iea_crm_2024.supply_concentration) },
      { name: 'Geopolitical Risk', key: 'geopolitical_risk', value: Math.round(assessLive.iea_crm_2024.geopolitical_risk) },
      { name: 'Substitutability', key: 'substitutability', value: Math.round(assessLive.iea_crm_2024.substitutability) },
    ],
    composite: Math.round(assessLive.iea_crm_2024.criticality_composite),
    tier: assessLive.iea_crm_2024.criticality_composite >= 80 ? 'Critical' : assessLive.iea_crm_2024.criticality_composite >= 65 ? 'High' : assessLive.iea_crm_2024.criticality_composite >= 50 ? 'Medium' : 'Low',
    tierColor: assessLive.iea_crm_2024.criticality_composite >= 80 ? 'red' : assessLive.iea_crm_2024.criticality_composite >= 65 ? 'orange' : assessLive.iea_crm_2024.criticality_composite >= 50 ? 'yellow' : 'green',
  } : ieaDemo;

  const euCrm = assessStatus === 'live' && assessLive ? {
    strategic: EU_CRMA_ANNEX_I_STRATEGIC.has(mineral),
    critical: EU_CRMA_ANNEX_II_CRITICAL.has(mineral),
    compliance: Math.round(assessLive.eu_crm_act.compliance_score * 100),
    gaps: assessLive.eu_crm_act.gaps,
    auditRequired: assessLive.eu_crm_act.audit_required,
  } : { ...euCrmDemo, gaps: euCrmDemo.gaps, auditRequired: null };

  const irma = assessStatus === 'live' && assessLive ? {
    areas: irmaDemo.areas, // engine returns a composite + gaps only, not a per-chapter breakdown — radar stays illustrative
    composite: Math.round(assessLive.irma.score * 100),
    tier: (assessLive.irma.tier || 'not_rated').replace('_', ' ').toUpperCase(),
    tierColor: assessLive.irma.tier === 'tier_3' ? 'green' : assessLive.irma.tier === 'tier_2' ? 'blue' : assessLive.irma.tier === 'tier_1' ? 'yellow' : 'red',
    gaps: assessLive.irma.gaps,
  } : irmaDemo;

  const supply = assessStatus === 'live' && assessLive ? {
    exposures: supplyDemo.exposures, // illustrative technology split; live totals/HHI below are real
    total: Math.round(assessLive.transition_exposure.total_transition_exposure_m),
    hhi: Math.round(assessLive.supply_chain_metrics.concentration_hhi),
    hhiTier: assessLive.supply_chain_metrics.concentration_hhi >= 2500 ? 'High Concentration' : assessLive.supply_chain_metrics.concentration_hhi >= 1500 ? 'Moderate' : 'Diversified',
    hhiColor: assessLive.supply_chain_metrics.concentration_hhi >= 2500 ? 'red' : assessLive.supply_chain_metrics.concentration_hhi >= 1500 ? 'yellow' : 'green',
  } : supplyDemo;

  const overall = assessStatus === 'live' && assessLive ? {
    priceVolatility: overallDemo.priceVolatility, // no live time-series equivalent — illustrative forecast
    supplyDisruptionProb: Math.round(assessLive.supply_chain_metrics.supply_disruption_prob_pct),
    top3CountryShare: Math.round(assessLive.supply_chain_metrics.top3_country_share_pct),
    riskTier: assessLive.overall.crm_risk_tier.charAt(0).toUpperCase() + assessLive.overall.crm_risk_tier.slice(1),
    riskColor: assessLive.overall.crm_risk_tier === 'critical' ? 'red' : assessLive.overall.crm_risk_tier === 'high' ? 'orange' : assessLive.overall.crm_risk_tier === 'medium' ? 'yellow' : 'green',
  } : overallDemo;

  const runAssess = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await axios.post(`${CRM_API}/assess`, {
        entity_id: 'demo-001', entity_name: entityName || 'Demo Entity', sector,
        minerals_exposed: [toBackendMineral(mineral)],
        ev_battery_exposure_m: parseFloat(evExposure) || 0,
        solar_pv_exposure_m: parseFloat(solarExposure) || 0,
        wind_turbine_exposure_m: parseFloat(windExposure) || 0,
        grid_storage_exposure_m: parseFloat(gridExposure) || 0,
        eu_crm_act_applicable: true,
        eu_strategic_minerals_sourced: [toBackendMineral(mineral)],
        eu_crm_audit_completed: false,
      });
      setAssessLive(data); setAssessStatus('live');
    } catch {
      setAssessLive(null); setAssessStatus('demo');
      setError('Live CRM engine unavailable — showing demo data below.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1b3a5c', margin: 0 }}>Critical Minerals & Transition Metals</h1>
        <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>IEA CRM 2024 · EU CRM Act · IRMA · OECD DDG</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'none', color: tab === i ? '#059669' : '#6b7280', borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {error && <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#92400e', fontSize: 14 }}>{error}</div>}

      <Section title="Assessment Parameters" status={assessStatus}>
        <Row>
          <Sel label="Critical Mineral" value={mineral} onChange={setMineral} options={MINERAL_OPTIONS} />
          <Sel label="Technology Focus" value={techFocus} onChange={setTechFocus} options={TECH_OPTIONS} />
          <Sel label="Sector" value={sector} onChange={setSector} options={SECTOR_OPTIONS} />
        </Row>
        <Row>
          <Inp label="Entity Name" value={entityName} onChange={setEntityName} />
          <Inp label="EV Battery Exposure ($M)" value={evExposure} onChange={setEvExposure} type="number" />
          <Inp label="Solar PV Exposure ($M)" value={solarExposure} onChange={setSolarExposure} type="number" />
        </Row>
        <Row>
          <Inp label="Wind Turbine Exposure ($M)" value={windExposure} onChange={setWindExposure} type="number" />
          <Inp label="Grid Storage Exposure ($M)" value={gridExposure} onChange={setGridExposure} type="number" />
          <Inp label="Annual Sourcing Volume (tonnes)" value={annualVolume} onChange={setAnnualVolume} type="number" />
        </Row>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Btn onClick={runAssess}>{loading ? 'Running…' : 'Run CRM Assessment'}</Btn>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Assessment auto-refreshes from the live E93 engine as inputs change.</span>
        </div>
      </Section>

      {/* TAB 1 — IEA Criticality */}
      {tab === 0 && (
        <div>
          <Section title="IEA Critical Minerals Outlook 2024 — Criticality Assessment" status={assessStatus}>
            <Row gap={12}>
              <KpiCard label="IEA Criticality Composite" value={`${iea.composite}/100`} sub="4-indicator weighted composite" accent />
              <KpiCard label="Criticality Tier" value={<Badge label={iea.tier} color={iea.tierColor} />} sub="IEA 2024 classification" />
              <KpiCard label="Highest Sub-Score" value={[...iea.subScores].sort((a, b) => b.value - a.value)[0].name} sub={`Score: ${[...iea.subScores].sort((a, b) => b.value - a.value)[0].value}/100`} />
              <KpiCard label="Supply Concentration" value={`${iea.subScores[1].value}/100`} sub="HHI-based geographic concentration" />
            </Row>
          </Section>

          <Section title="IEA Criticality Sub-Indicators" status={assessStatus}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={iea.subScores}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(val) => `${val}/100`} />
                <Bar dataKey="value" name="Criticality Score" radius={[4, 4, 0, 0]}>
                  {iea.subScores.map((s, i) => (
                    <Cell key={i} fill={s.value >= 75 ? '#ef4444' : s.value >= 60 ? '#f59e0b' : '#059669'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="IEA Criticality Framework — Reference">
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: 16 }}>
              {[
                { indicator: 'Demand Growth', weight: '30%', desc: 'Clean energy transition demand trajectory (IEA NZE 2050)' },
                { indicator: 'Supply Concentration', weight: '30%', desc: 'Top-3 country production share (HHI > 2500 = high risk)' },
                { indicator: 'Geopolitical Risk', weight: '25%', desc: 'Producer country WGI + OECD geopolitical exposure index' },
                { indicator: 'Substitutability', weight: '15%', desc: 'Technical substitutability in key clean energy applications' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: i < 3 ? '1px solid #fde68a' : 'none' }}>
                  <span style={{ fontWeight: 700, color: '#92400e', minWidth: 180, fontSize: 13 }}>{item.indicator}</span>
                  <span style={{ color: '#78350f', fontWeight: 600, minWidth: 40, fontSize: 13 }}>{item.weight}</span>
                  <span style={{ color: '#374151', fontSize: 13 }}>{item.desc}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TAB 2 — EU CRM Act */}
      {tab === 1 && (
        <div>
          <Section title="EU Critical Raw Materials Act (Regulation (EU) 2024/1252)" status={assessStatus}>
            <Row gap={12}>
              <KpiCard label="EU Strategic Mineral" value={<Badge label={euCrm.strategic ? 'Yes — Strategic' : 'No'} color={euCrm.strategic ? 'green' : 'gray'} />} sub="Annex I — Strategic Raw Materials (EU CRMA 2024/1252)" accent />
              <KpiCard label="EU Critical Mineral" value={<Badge label={euCrm.critical ? 'Yes — Critical' : 'No'} color={euCrm.critical ? 'blue' : 'gray'} />} sub="Annex II — Critical Raw Materials (EU CRMA 2024/1252)" />
              <KpiCard label="CRM Compliance Score" value={`${euCrm.compliance}/100`} sub={assessStatus === 'live' ? 'Live Art 5/14 compliance score' : 'Across 5 compliance dimensions (demo)'} />
              <KpiCard label="Compliance Status" value={<Badge label={euCrm.compliance >= 70 ? 'Compliant' : euCrm.compliance >= 50 ? 'Partial' : 'Non-Compliant'} color={euCrm.compliance >= 70 ? 'green' : euCrm.compliance >= 50 ? 'yellow' : 'red'} />} sub="EU CRM Act Art 5 & 6 assessment" />
            </Row>
          </Section>

          <Section title="EU CRM Act Compliance Gap Analysis" status={assessStatus}>
            {assessStatus === 'live' && assessLive ? (
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: 16 }}>
                {euCrm.gaps.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>No compliance gaps identified for the current inputs.</div>
                ) : euCrm.gaps.map((g, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < euCrm.gaps.length - 1 ? '1px solid #fed7aa' : 'none' }}>
                    <span style={{ color: '#c2410c', fontWeight: 700 }}>{i + 1}.</span>
                    <span style={{ fontSize: 13, color: '#7c2d12' }}>{g}</span>
                  </div>
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={euCrm.gaps}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-10} textAnchor="end" height={45} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <Bar dataKey="value" name="Compliance Score" radius={[4, 4, 0, 0]}>
                    {euCrm.gaps.map((g, i) => (
                      <Cell key={i} fill={g.value >= 65 ? '#059669' : g.value >= 45 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Section>

          <Section title="EU CRM Act Benchmarks (Art 5 Targets by 2030)">
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 16 }}>
              {[
                { target: '10% domestic extraction', desc: 'EU annual consumption of strategic CRMs' },
                { target: '40% domestic processing', desc: 'Processing capacity for strategic CRMs' },
                { target: '25% recycled content', desc: 'Recycling capacity from end-of-life waste' },
                { target: 'No >65% single country', desc: 'Import concentration cap for any strategic CRM' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? '1px solid #dbeafe' : 'none' }}>
                  <span style={{ fontWeight: 700, color: '#1e40af', fontSize: 13 }}>{item.target}</span>
                  <span style={{ fontSize: 13, color: '#374151' }}>{item.desc}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* TAB 3 — IRMA Responsible Mining */}
      {tab === 2 && (
        <div>
          <Section title="Initiative for Responsible Mining Assurance (IRMA) Standard for Responsible Mining" status={assessStatus}>
            <Row gap={12}>
              <KpiCard label="IRMA Score" value={`${irma.composite}/100`} sub="6-area weighted composite" accent />
              <KpiCard label="IRMA Tier" value={<Badge label={irma.tier} color={irma.tierColor} />} sub="IRMA 25 / 50 / 75 / 100" />
              <KpiCard label="Weakest Area" value={[...irma.areas].sort((a, b) => a.score - b.score)[0].dimension} sub={`Score: ${[...irma.areas].sort((a, b) => a.score - b.score)[0].score}/100 (illustrative breakdown)`} />
              <KpiCard label="OECD DDG Aligned" value={<Badge label={irma.composite >= 65 ? 'Aligned' : 'Gaps Identified'} color={irma.composite >= 65 ? 'green' : 'yellow'} />} sub="OECD Due Diligence Guidance alignment" />
            </Row>
          </Section>

          <Row>
            <Section title="IRMA Assessment Areas — Radar" status={assessStatus === 'live' ? undefined : assessStatus}>
              {assessStatus === 'live' && <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>Composite/tier above are live; the engine does not expose a per-chapter breakdown, so this radar is an illustrative 6-area split.</div>}
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={irma.areas} cx="50%" cy="50%" outerRadius={110}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="IRMA Score" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                </RadarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="IRMA Area Scores">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={irma.areas} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="dimension" width={130} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => `${val}/100`} />
                  <Bar dataKey="score" name="IRMA Score" radius={[0, 4, 4, 0]}>
                    {irma.areas.map((a, i) => (
                      <Cell key={i} fill={a.score >= 70 ? '#059669' : a.score >= 55 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
          </Row>

          {assessStatus === 'live' && assessLive && irma.gaps?.length > 0 && (
            <Section title="IRMA Gaps Identified" status="live">
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
                {irma.gaps.map((g, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < irma.gaps.length - 1 ? '1px solid #d1fae5' : 'none' }}>
                    <span style={{ color: '#059669', fontWeight: 700 }}>{i + 1}.</span>
                    <span style={{ fontSize: 13, color: '#065f46' }}>{g}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* TAB 4 — Supply Chain Risk */}
      {tab === 3 && (
        <div>
          <Section title="Transition Technology Exposure Analysis ($M)" status={assessStatus}>
            <Row gap={12}>
              <KpiCard label="Total Transition Exposure" value={`$${supply.total}M`} sub="Aggregate across 5 tech categories" accent />
              <KpiCard label="Concentration HHI" value={supply.hhi.toLocaleString()} sub="Herfindahl-Hirschman Index" />
              <KpiCard label="Concentration Level" value={<Badge label={supply.hhiTier} color={supply.hhiColor} />} sub="HHI > 2500 = high concentration" />
              <KpiCard label="Top Technology Exposure" value={[...supply.exposures].sort((a, b) => b.value - a.value)[0].name} sub={`$${[...supply.exposures].sort((a, b) => b.value - a.value)[0].value}M exposure`} />
            </Row>
          </Section>

          <Section title="Transition Technology Exposure by Application ($M)">
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>Illustrative per-technology split — totals and HHI above reflect live inputs when the engine is reachable.</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={supply.exposures}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis unit="M" />
                <Tooltip formatter={(val) => `$${val}M`} />
                <Bar dataKey="value" name="Exposure ($M)" radius={[4, 4, 0, 0]}>
                  {supply.exposures.map((e, i) => (
                    <Cell key={i} fill={['#059669', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Key Producer Countries & Risk Exposure" status={supplyMapStatus}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Country', 'Production Share', 'Conflict / Geopolitical Risk', 'OECD CAHRA'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(supplyMapStatus === 'live' && supplyMapLive
                  ? Object.entries(supplyMapLive.mineral_profile.top3_country_share_pct || {}).map(([country, share]) => {
                      const risk = (supplyMapLive.supply_chain_assessment.tier1_country_risks || []).find(r => r.country === country);
                      const geo = risk ? risk.conflict_risk.replace('_', ' ') : 'n/a';
                      return { country, share: `${share}%`, geo, cahra: risk?.oecd_cahra ?? false };
                    })
                  : [
                      { country: 'China', share: `${Math.round(seed(supplyDemo.total * 3) * 30 + 40)}%`, geo: 'high', cahra: false },
                      { country: 'DRC', share: `${Math.round(seed(supplyDemo.total * 5) * 20 + 15)}%`, geo: 'very high', cahra: true },
                      { country: 'Australia', share: `${Math.round(seed(supplyDemo.total * 7) * 15 + 8)}%`, geo: 'low', cahra: false },
                      { country: 'Chile', share: `${Math.round(seed(supplyDemo.total * 11) * 12 + 6)}%`, geo: 'medium', cahra: false },
                      { country: 'Russia', share: `${Math.round(seed(supplyDemo.total * 13) * 10 + 5)}%`, geo: 'very high', cahra: false },
                    ]
                ).map((row, i) => {
                  const geoLabel = row.geo.replace(/^\w/, c => c.toUpperCase());
                  const geoColor = /very high/i.test(row.geo) ? 'red' : /high/i.test(row.geo) ? 'orange' : /medium/i.test(row.geo) ? 'yellow' : 'green';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#374151' }}>{row.country}</td>
                      <td style={{ padding: '8px 12px', color: '#1b3a5c' }}>{row.share}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <Badge label={geoLabel} color={geoColor} />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <Badge label={row.cahra ? 'Flagged' : 'Clear'} color={row.cahra ? 'red' : 'green'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 5 — Overall CRM Risk */}
      {tab === 4 && (
        <div>
          <Section title="Overall CRM Risk Profile — Summary" status={assessStatus}>
            <Row gap={12}>
              <KpiCard label="Supply Disruption Probability" value={`${overall.supplyDisruptionProb}%`} sub="12-month horizon (IEA methodology)" accent />
              <KpiCard label="Top-3 Country Share" value={`${overall.top3CountryShare}%`} sub="Production concentration metric" />
              <KpiCard label="CRM Risk Tier" value={<Badge label={overall.riskTier} color={overall.riskColor} />} sub="Composite IEA / EU CRM risk tier" />
              <KpiCard label="Price Volatility Trend" value={overall.priceVolatility[overall.priceVolatility.length - 1].score > overall.priceVolatility[0].score ? 'Increasing' : 'Decreasing'} sub="2020–2030 trajectory (illustrative forecast)" />
            </Row>
          </Section>

          <Section title="Price Volatility Score — 2020 to 2030 (Illustrative Forecast — Demo)">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={overall.priceVolatility}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(val) => `${val}/100 volatility score`} />
                <Area type="monotone" dataKey="score" stroke="#059669" fill="url(#volGrad)" strokeWidth={2} name="Price Volatility Score" />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          <Section title="CRM Risk Mitigation Strategy" status={assessStatus}>
            {assessStatus === 'live' && assessLive ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#065f46', textTransform: 'uppercase', marginBottom: 8 }}>Live Recommendations — E93 Engine</div>
                {(assessLive.recommendations || []).map((rec, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < assessLive.recommendations.length - 1 ? '1px solid #d1fae5' : 'none' }}>
                    <span style={{ color: '#059669', fontWeight: 700 }}>{i + 1}.</span>
                    <span style={{ fontSize: 13, color: '#065f46' }}>{rec}</span>
                  </div>
                ))}
                {assessLive.key_findings?.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#065f46', textTransform: 'uppercase', margin: '14px 0 8px' }}>Key Findings</div>
                    {assessLive.key_findings.map((f, i) => (
                      <div key={i} style={{ fontSize: 12, color: '#374151', padding: '4px 0' }}>• {f}</div>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
                {[
                  { action: 'Geographic Diversification', desc: 'Expand sourcing to Australia, Canada, Chile to reduce China/DRC dependency', urgency: 'Immediate' },
                  { action: 'Circular Economy Integration', desc: 'Urban mining + battery recycling pathways to reduce primary demand', urgency: 'Short-term' },
                  { action: 'Strategic Stockpiling', desc: 'Minimum 3-month supply buffer aligned to EU CRM Act requirements', urgency: 'Short-term' },
                  { action: 'Long-term Offtake Agreements', desc: 'IRMA-certified mine supply contracts with price floor/ceiling mechanisms', urgency: 'Medium-term' },
                  { action: 'Substitution R&D Investment', desc: 'Fund alternatives research (e.g. sodium-ion, LFP, REE-free magnets)', urgency: 'Long-term' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '10px 0', borderBottom: i < 4 ? '1px solid #d1fae5' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: '#065f46', fontSize: 13 }}>{item.action}</span>
                      <Badge label={item.urgency} color={item.urgency === 'Immediate' ? 'red' : item.urgency === 'Short-term' ? 'yellow' : item.urgency === 'Medium-term' ? 'blue' : 'gray'} />
                    </div>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{item.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}
