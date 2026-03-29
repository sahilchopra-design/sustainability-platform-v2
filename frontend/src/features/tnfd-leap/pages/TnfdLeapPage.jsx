import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const PIE_COLORS = [T.navy, T.gold, T.sage, T.red, T.amber, '#7c3aed', '#0d9488', '#ec4899', '#6366f1', '#f43f5e', '#14b8a6'];

/* ================================================================
   SECTOR NATURE INTERFACES — 11 GICS sectors (ENCORE methodology)
   ================================================================ */
const SECTOR_NATURE_INTERFACES = {
  Energy: {
    biomes: ['Marine', 'Terrestrial', 'Freshwater'],
    ecosystems: ['Oceans', 'Forests', 'Wetlands', 'Grasslands'],
    dependencies: [
      { service: 'Water provision', criticality: 'High', description: 'Cooling water for thermal generation' },
      { service: 'Climate regulation', criticality: 'High', description: 'Stable weather for operations' },
      { service: 'Flood protection', criticality: 'Medium', description: 'Infrastructure protection' },
      { service: 'Soil stability', criticality: 'Medium', description: 'Pipeline and infrastructure foundation' },
    ],
    impacts: [
      { type: 'GHG emissions', severity: 'Very High', pathway: 'Combustion -> atmosphere -> climate change' },
      { type: 'Water pollution', severity: 'High', pathway: 'Discharge -> waterways -> ecosystem damage' },
      { type: 'Habitat destruction', severity: 'High', pathway: 'Exploration -> land clearing -> biodiversity loss' },
      { type: 'Oil spills', severity: 'Very High', pathway: 'Leaks -> marine/soil contamination' },
    ],
    risks: [
      { category: 'Physical', risk: 'Water scarcity reducing cooling capacity', likelihood: 'High', impact: 'High' },
      { category: 'Transition', risk: 'Carbon pricing increasing operating costs', likelihood: 'Very High', impact: 'Very High' },
      { category: 'Systemic', risk: 'Ecosystem collapse disrupting supply chains', likelihood: 'Medium', impact: 'Very High' },
    ],
    opportunities: [
      { type: 'Renewable transition', potential: 'High', description: 'Shift to solar/wind reduces nature impact' },
      { type: 'Ecosystem restoration', potential: 'Medium', description: 'Biodiversity offsets and carbon credits' },
    ],
    dep_score: 78, impact_score: 85,
  },
  Materials: {
    biomes: ['Terrestrial', 'Freshwater'],
    ecosystems: ['Forests', 'Mountains', 'Rivers'],
    dependencies: [
      { service: 'Raw materials', criticality: 'Very High', description: 'Minerals, metals, timber extraction' },
      { service: 'Water provision', criticality: 'High', description: 'Processing and refining' },
      { service: 'Soil formation', criticality: 'Medium', description: 'Mining site rehabilitation' },
    ],
    impacts: [
      { type: 'Land use change', severity: 'Very High', pathway: 'Mining -> deforestation -> habitat loss' },
      { type: 'Water contamination', severity: 'High', pathway: 'Tailings -> waterways -> aquatic damage' },
      { type: 'Biodiversity loss', severity: 'Very High', pathway: 'Extraction -> species displacement' },
    ],
    risks: [
      { category: 'Physical', risk: 'Resource depletion limiting operations', likelihood: 'High', impact: 'High' },
      { category: 'Transition', risk: 'Stricter mining and extraction regulations', likelihood: 'High', impact: 'Medium' },
      { category: 'Litigation', risk: 'Community lawsuits for environmental damage', likelihood: 'Medium', impact: 'High' },
    ],
    opportunities: [
      { type: 'Circular economy', potential: 'High', description: 'Recycling reduces virgin extraction' },
      { type: 'Mine rehabilitation', potential: 'Medium', description: 'Biodiversity credits from site restoration' },
    ],
    dep_score: 82, impact_score: 90,
  },
  Industrials: {
    biomes: ['Terrestrial', 'Freshwater'],
    ecosystems: ['Urban', 'Rivers', 'Forests'],
    dependencies: [
      { service: 'Water provision', criticality: 'Medium', description: 'Manufacturing and cooling processes' },
      { service: 'Climate regulation', criticality: 'Medium', description: 'Stable operations and logistics' },
      { service: 'Raw materials', criticality: 'High', description: 'Steel, cement, chemical feedstock' },
    ],
    impacts: [
      { type: 'Air pollution', severity: 'High', pathway: 'Manufacturing -> emissions -> respiratory harm' },
      { type: 'Waste generation', severity: 'Medium', pathway: 'Production -> landfill -> soil/water contamination' },
      { type: 'Land use', severity: 'Medium', pathway: 'Facility construction -> habitat fragmentation' },
    ],
    risks: [
      { category: 'Physical', risk: 'Extreme weather disrupting logistics', likelihood: 'High', impact: 'Medium' },
      { category: 'Transition', risk: 'Circular economy regulations increasing costs', likelihood: 'Medium', impact: 'Medium' },
      { category: 'Systemic', risk: 'Supply chain nature dependencies cascading', likelihood: 'Medium', impact: 'High' },
    ],
    opportunities: [
      { type: 'Green infrastructure', potential: 'High', description: 'Nature-based solutions in construction' },
      { type: 'Efficiency gains', potential: 'Medium', description: 'Reduced resource intensity' },
    ],
    dep_score: 55, impact_score: 58,
  },
  Utilities: {
    biomes: ['Freshwater', 'Terrestrial', 'Marine'],
    ecosystems: ['Rivers', 'Wetlands', 'Reservoirs', 'Coastal'],
    dependencies: [
      { service: 'Water provision', criticality: 'Very High', description: 'Hydropower and cooling' },
      { service: 'Climate regulation', criticality: 'High', description: 'Predictable rainfall for hydro' },
      { service: 'Flood protection', criticality: 'High', description: 'Dam and infrastructure safety' },
      { service: 'Pollination', criticality: 'Low', description: 'Vegetation management around lines' },
    ],
    impacts: [
      { type: 'Water abstraction', severity: 'Very High', pathway: 'Extraction -> flow alteration -> aquatic loss' },
      { type: 'Habitat fragmentation', severity: 'High', pathway: 'Dams/lines -> migration barriers' },
      { type: 'Thermal pollution', severity: 'Medium', pathway: 'Discharge -> aquatic temperature rise' },
    ],
    risks: [
      { category: 'Physical', risk: 'Drought reducing hydro generation capacity', likelihood: 'High', impact: 'Very High' },
      { category: 'Transition', risk: 'Water use restrictions for ecosystem flows', likelihood: 'Medium', impact: 'High' },
      { category: 'Systemic', risk: 'Watershed degradation reducing water quality', likelihood: 'Medium', impact: 'High' },
    ],
    opportunities: [
      { type: 'Watershed payments', potential: 'High', description: 'Pay for upstream ecosystem services' },
      { type: 'Green tariffs', potential: 'Medium', description: 'Nature-positive energy premiums' },
    ],
    dep_score: 80, impact_score: 72,
  },
  Financials: {
    biomes: ['All (indirect)'],
    ecosystems: ['All via lending/investment'],
    dependencies: [
      { service: 'Ecosystem stability', criticality: 'High', description: 'Collateral valuations depend on nature' },
      { service: 'Climate regulation', criticality: 'Medium', description: 'Weather risk to insurance portfolios' },
    ],
    impacts: [
      { type: 'Financed deforestation', severity: 'High', pathway: 'Lending -> extractive sectors -> habitat loss' },
      { type: 'Portfolio emissions', severity: 'High', pathway: 'Investment -> high-impact sectors -> climate' },
    ],
    risks: [
      { category: 'Physical', risk: 'Nature-related asset devaluation in portfolios', likelihood: 'Medium', impact: 'High' },
      { category: 'Transition', risk: 'Nature-related policy tightening impacting borrowers', likelihood: 'High', impact: 'High' },
      { category: 'Litigation', risk: 'Greenwashing claims on biodiversity commitments', likelihood: 'Medium', impact: 'Medium' },
    ],
    opportunities: [
      { type: 'Nature-positive finance', potential: 'Very High', description: 'Green bonds, biodiversity credits' },
      { type: 'Risk differentiation', potential: 'High', description: 'Nature-aware lending terms' },
    ],
    dep_score: 35, impact_score: 42,
  },
  'Information Technology': {
    biomes: ['Terrestrial'],
    ecosystems: ['Urban', 'Mountains (mining)'],
    dependencies: [
      { service: 'Raw materials', criticality: 'High', description: 'Rare earth minerals for electronics' },
      { service: 'Water provision', criticality: 'Medium', description: 'Data center cooling' },
    ],
    impacts: [
      { type: 'E-waste pollution', severity: 'Medium', pathway: 'Disposal -> soil/water heavy metal contamination' },
      { type: 'Mining impacts', severity: 'High', pathway: 'Mineral extraction -> habitat destruction' },
    ],
    risks: [
      { category: 'Physical', risk: 'Water scarcity for data center operations', likelihood: 'Medium', impact: 'Medium' },
      { category: 'Transition', risk: 'Critical mineral supply chain regulations', likelihood: 'High', impact: 'Medium' },
      { category: 'Systemic', risk: 'Rare earth supply disruption from mine closures', likelihood: 'Medium', impact: 'High' },
    ],
    opportunities: [
      { type: 'Green computing', potential: 'High', description: 'Energy-efficient and nature-positive data centers' },
      { type: 'Biodiversity monitoring tech', potential: 'Medium', description: 'AI/IoT for ecosystem monitoring' },
    ],
    dep_score: 28, impact_score: 32,
  },
  'Health Care': {
    biomes: ['Terrestrial', 'Freshwater', 'Marine'],
    ecosystems: ['Forests', 'Rivers', 'Oceans'],
    dependencies: [
      { service: 'Genetic resources', criticality: 'Very High', description: 'Natural compounds for drug discovery' },
      { service: 'Water provision', criticality: 'High', description: 'Pharmaceutical manufacturing' },
      { service: 'Pollination', criticality: 'Medium', description: 'Medicinal plant cultivation' },
    ],
    impacts: [
      { type: 'Pharmaceutical pollution', severity: 'High', pathway: 'Manufacturing -> waterways -> aquatic ecosystem disruption' },
      { type: 'Bioprospecting pressure', severity: 'Medium', pathway: 'Collection -> species depletion' },
    ],
    risks: [
      { category: 'Physical', risk: 'Loss of genetic resources reducing drug pipeline', likelihood: 'Medium', impact: 'Very High' },
      { category: 'Transition', risk: 'Nagoya Protocol compliance costs for bioresources', likelihood: 'High', impact: 'Medium' },
      { category: 'Systemic', risk: 'Antimicrobial resistance from environmental pollution', likelihood: 'Medium', impact: 'High' },
    ],
    opportunities: [
      { type: 'Bio-inspired innovation', potential: 'Very High', description: 'Nature-derived therapeutic discovery' },
      { type: 'Green chemistry', potential: 'High', description: 'Reduced environmental footprint of manufacturing' },
    ],
    dep_score: 48, impact_score: 38,
  },
  'Consumer Discretionary': {
    biomes: ['Terrestrial', 'Marine'],
    ecosystems: ['Forests', 'Oceans', 'Rivers'],
    dependencies: [
      { service: 'Raw materials', criticality: 'High', description: 'Cotton, leather, rubber, wood' },
      { service: 'Water provision', criticality: 'High', description: 'Textile dyeing and processing' },
    ],
    impacts: [
      { type: 'Textile pollution', severity: 'High', pathway: 'Dyeing -> waterways -> aquatic contamination' },
      { type: 'Microplastic release', severity: 'High', pathway: 'Synthetic textiles -> marine ecosystems' },
      { type: 'Deforestation', severity: 'Medium', pathway: 'Leather/rubber sourcing -> forest clearing' },
    ],
    risks: [
      { category: 'Physical', risk: 'Cotton water stress reducing supply availability', likelihood: 'High', impact: 'Medium' },
      { category: 'Transition', risk: 'Extended producer responsibility regulations', likelihood: 'High', impact: 'Medium' },
      { category: 'Litigation', risk: 'Supply chain deforestation lawsuits', likelihood: 'Medium', impact: 'Medium' },
    ],
    opportunities: [
      { type: 'Sustainable materials', potential: 'High', description: 'Bio-based and recycled alternatives' },
      { type: 'Circular fashion', potential: 'Medium', description: 'Take-back and resale programs' },
    ],
    dep_score: 52, impact_score: 55,
  },
  'Consumer Staples': {
    biomes: ['Terrestrial', 'Freshwater', 'Marine'],
    ecosystems: ['Forests', 'Croplands', 'Rivers', 'Oceans'],
    dependencies: [
      { service: 'Pollination', criticality: 'Very High', description: '75% of food crops depend on pollinators' },
      { service: 'Soil formation', criticality: 'Very High', description: 'Crop productivity foundation' },
      { service: 'Water provision', criticality: 'Very High', description: 'Irrigation and processing' },
      { service: 'Pest control', criticality: 'High', description: 'Natural predators for crop protection' },
    ],
    impacts: [
      { type: 'Deforestation', severity: 'Very High', pathway: 'Agricultural expansion -> forest clearing -> habitat loss' },
      { type: 'Pesticide pollution', severity: 'High', pathway: 'Application -> soil/water -> pollinator decline' },
      { type: 'Soil degradation', severity: 'High', pathway: 'Intensive farming -> erosion -> productivity loss' },
    ],
    risks: [
      { category: 'Physical', risk: 'Pollinator decline reducing crop yields', likelihood: 'High', impact: 'Very High' },
      { category: 'Transition', risk: 'Deforestation-free supply chain requirements', likelihood: 'Very High', impact: 'High' },
      { category: 'Systemic', risk: 'Soil degradation reducing global food production', likelihood: 'High', impact: 'Very High' },
    ],
    opportunities: [
      { type: 'Regenerative agriculture', potential: 'Very High', description: 'Soil health restores nature and productivity' },
      { type: 'Nature-positive sourcing', potential: 'High', description: 'Certified deforestation-free supply chains' },
    ],
    dep_score: 92, impact_score: 88,
  },
  'Communication Services': {
    biomes: ['Terrestrial'],
    ecosystems: ['Urban', 'Forests (towers)'],
    dependencies: [
      { service: 'Climate regulation', criticality: 'Low', description: 'Stable weather for infrastructure' },
    ],
    impacts: [
      { type: 'Tower/cable impact', severity: 'Low', pathway: 'Infrastructure -> bird collisions, habitat fragmentation' },
      { type: 'E-waste', severity: 'Medium', pathway: 'Device obsolescence -> heavy metal contamination' },
    ],
    risks: [
      { category: 'Physical', risk: 'Extreme weather damaging network infrastructure', likelihood: 'Medium', impact: 'Medium' },
      { category: 'Transition', risk: 'E-waste regulations increasing disposal costs', likelihood: 'Medium', impact: 'Low' },
      { category: 'Systemic', risk: 'Low direct nature dependency risk', likelihood: 'Low', impact: 'Low' },
    ],
    opportunities: [
      { type: 'Environmental monitoring platforms', potential: 'Medium', description: 'Satellite and IoT nature monitoring' },
      { type: 'Awareness campaigns', potential: 'Low', description: 'Content driving conservation behavior' },
    ],
    dep_score: 15, impact_score: 18,
  },
  'Real Estate': {
    biomes: ['Terrestrial', 'Freshwater'],
    ecosystems: ['Urban', 'Wetlands', 'Forests'],
    dependencies: [
      { service: 'Flood protection', criticality: 'High', description: 'Natural flood management for properties' },
      { service: 'Climate regulation', criticality: 'High', description: 'Urban heat island mitigation via green space' },
      { service: 'Water purification', criticality: 'Medium', description: 'Natural filtration for potable water' },
    ],
    impacts: [
      { type: 'Habitat fragmentation', severity: 'High', pathway: 'Development -> greenfield loss -> species isolation' },
      { type: 'Soil sealing', severity: 'High', pathway: 'Construction -> surface impermeability -> runoff' },
      { type: 'Urban heat', severity: 'Medium', pathway: 'Development -> canopy loss -> temperature rise' },
    ],
    risks: [
      { category: 'Physical', risk: 'Flood damage from lost natural barriers', likelihood: 'High', impact: 'High' },
      { category: 'Transition', risk: 'Biodiversity net gain requirements for permits', likelihood: 'High', impact: 'Medium' },
      { category: 'Litigation', risk: 'Environmental impact lawsuits from communities', likelihood: 'Medium', impact: 'Medium' },
    ],
    opportunities: [
      { type: 'Green buildings', potential: 'High', description: 'Biodiversity-integrated design (green roofs/walls)' },
      { type: 'Nature-based solutions', potential: 'High', description: 'Sustainable urban drainage and green corridors' },
    ],
    dep_score: 60, impact_score: 62,
  },
};

const SECTOR_KEYS = Object.keys(SECTOR_NATURE_INTERFACES);

/* ================================================================
   TNFD 14 DISCLOSURE RECOMMENDATIONS
   ================================================================ */
const TNFD_DISCLOSURES_INIT = [
  { id: 'G-A', pillar: 'Governance', recommendation: 'Board oversight of nature-related dependencies, impacts, risks and opportunities', status: 'pending' },
  { id: 'G-B', pillar: 'Governance', recommendation: 'Management role in assessing and managing nature-related issues', status: 'pending' },
  { id: 'G-C', pillar: 'Governance', recommendation: 'Human rights policies and engagement with Indigenous Peoples', status: 'pending' },
  { id: 'S-A', pillar: 'Strategy', recommendation: 'Nature-related dependencies, impacts, risks and opportunities identified', status: 'pending' },
  { id: 'S-B', pillar: 'Strategy', recommendation: 'Effect on business model, strategy and financial planning', status: 'pending' },
  { id: 'S-C', pillar: 'Strategy', recommendation: 'Resilience of strategy under different nature-related scenarios', status: 'pending' },
  { id: 'S-D', pillar: 'Strategy', recommendation: 'Nature-related targets and performance against targets', status: 'pending' },
  { id: 'R-A', pillar: 'Risk & Impact', recommendation: 'Process for identifying and assessing nature-related risks', status: 'pending' },
  { id: 'R-B', pillar: 'Risk & Impact', recommendation: 'Process for managing nature-related risks', status: 'pending' },
  { id: 'R-C', pillar: 'Risk & Impact', recommendation: 'Integration into overall risk management', status: 'pending' },
  { id: 'M-A', pillar: 'Metrics & Targets', recommendation: 'Metrics on nature-related dependencies, impacts, risks', status: 'pending' },
  { id: 'M-B', pillar: 'Metrics & Targets', recommendation: 'Metrics on nature-related opportunities', status: 'pending' },
  { id: 'M-C', pillar: 'Metrics & Targets', recommendation: 'Targets and performance against targets', status: 'pending' },
  { id: 'M-D', pillar: 'Metrics & Targets', recommendation: 'Nature-related financial disclosures', status: 'pending' },
];

/* ================================================================
   ECOSYSTEM SERVICES for ENCORE matrix
   ================================================================ */
const ECOSYSTEM_SERVICES = ['Water provision', 'Climate regulation', 'Pollination', 'Soil formation', 'Flood protection', 'Genetic resources', 'Air quality', 'Nutrient cycling'];

/* ================================================================
   COUNTRY BIODIVERSITY INTACTNESS INDEX
   ================================================================ */
const COUNTRY_BII = [
  { code: 'BR', name: 'Brazil', bii: 0.73, biomes: 'Amazon, Cerrado, Atlantic Forest', holdings_exposed: 0 },
  { code: 'ID', name: 'Indonesia', bii: 0.62, biomes: 'Tropical Rainforest, Mangrove', holdings_exposed: 0 },
  { code: 'US', name: 'United States', bii: 0.78, biomes: 'Temperate Forest, Grassland, Desert', holdings_exposed: 0 },
  { code: 'IN', name: 'India', bii: 0.56, biomes: 'Tropical Forest, Mangrove, Grassland', holdings_exposed: 0 },
  { code: 'CN', name: 'China', bii: 0.52, biomes: 'Temperate Forest, Steppe, Subtropical', holdings_exposed: 0 },
  { code: 'AU', name: 'Australia', bii: 0.82, biomes: 'Savanna, Temperate Forest, Reef', holdings_exposed: 0 },
  { code: 'DE', name: 'Germany', bii: 0.68, biomes: 'Temperate Forest, Wetlands', holdings_exposed: 0 },
  { code: 'GB', name: 'United Kingdom', bii: 0.55, biomes: 'Temperate Grassland, Moorland', holdings_exposed: 0 },
  { code: 'JP', name: 'Japan', bii: 0.65, biomes: 'Temperate Forest, Coastal', holdings_exposed: 0 },
  { code: 'ZA', name: 'South Africa', bii: 0.74, biomes: 'Fynbos, Savanna, Grassland', holdings_exposed: 0 },
  { code: 'CG', name: 'DR Congo', bii: 0.81, biomes: 'Tropical Rainforest, Swamp Forest', holdings_exposed: 0 },
  { code: 'CA', name: 'Canada', bii: 0.88, biomes: 'Boreal Forest, Tundra, Temperate', holdings_exposed: 0 },
];

/* ================================================================
   NATURE SCENARIOS
   ================================================================ */
const NATURE_SCENARIOS = [
  { id: 'bau', name: 'Business as Usual', description: 'Continued ecosystem degradation at current trajectory. No new policy interventions.', bii_2030: 0.58, portfolio_loss_pct: 4.2, nature_risk_delta: '+35%' },
  { id: 'recovery', name: 'Nature Recovery (Kunming-Montreal)', description: '30x30 targets met, harmful subsidies reformed, $200B/yr biodiversity finance.', bii_2030: 0.72, portfolio_loss_pct: 1.1, nature_risk_delta: '-18%' },
  { id: 'collapse', name: 'Ecosystem Collapse', description: 'Tipping points breached: Amazon dieback, coral collapse, pollinator crash.', bii_2030: 0.38, portfolio_loss_pct: 12.8, nature_risk_delta: '+85%' },
];

const SCENARIO_TREND = [
  { year: 2024, bau: 0.65, recovery: 0.65, collapse: 0.65 },
  { year: 2025, bau: 0.64, recovery: 0.66, collapse: 0.62 },
  { year: 2026, bau: 0.63, recovery: 0.67, collapse: 0.58 },
  { year: 2027, bau: 0.62, recovery: 0.68, collapse: 0.52 },
  { year: 2028, bau: 0.61, recovery: 0.70, collapse: 0.46 },
  { year: 2029, bau: 0.59, recovery: 0.71, collapse: 0.42 },
  { year: 2030, bau: 0.58, recovery: 0.72, collapse: 0.38 },
];

/* ================================================================
   HELPERS
   ================================================================ */
const sev = v => v === 'Very High' ? 4 : v === 'High' ? 3 : v === 'Medium' ? 2 : 1;
const likI = v => v === 'Very High' ? 5 : v === 'High' ? 4 : v === 'Medium' ? 3 : v === 'Low' ? 2 : 1;
const sevClr = v => v === 'Very High' ? T.red : v === 'High' ? T.amber : v === 'Medium' ? T.gold : T.sage;
const statusClr = s => s === 'compliant' ? T.green : s === 'partial' ? T.amber : s === 'gap' ? T.red : T.textMut;
const statusLabel = s => s === 'compliant' ? 'Compliant' : s === 'partial' ? 'Partial' : s === 'gap' ? 'Gap' : s === 'na' ? 'N/A' : 'Pending';
const mapSector = s => {
  if (s === 'IT') return 'Information Technology';
  return s;
};
const getSectorData = s => SECTOR_NATURE_INTERFACES[mapSector(s)] || SECTOR_NATURE_INTERFACES['Financials'];
const fmt = n => n == null ? '-' : typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : n;

/* ================================================================
   STYLED COMPONENTS (inline)
   ================================================================ */
const Section = ({ title, sub, children, style }) => (
  <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20, ...style }}>
    <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: sub ? 2 : 12, fontFamily: T.font }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: T.textMut, marginBottom: 14 }}>{sub}</div>}
    {children}
  </div>
);

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '16px 18px', minWidth: 150, flex: '1 1 170px' }}>
    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6, fontFamily: T.font }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: color || T.navy, fontFamily: T.font }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sub}</div>}
  </div>
);

const Btn = ({ children, onClick, active, small, style }) => (
  <button onClick={onClick} style={{ padding: small ? '5px 12px' : '8px 18px', borderRadius: 8, border: `1px solid ${active ? T.navy : T.border}`, background: active ? T.navy : T.surface, color: active ? '#fff' : T.text, fontSize: small ? 12 : 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.font, transition: 'all .15s', ...style }}>{children}</button>
);

const Badge = ({ text, color }) => (
  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${color}18`, color, fontFamily: T.font }}>{text}</span>
);

const TH = ({ children, onClick, sorted, style }) => (
  <th onClick={onClick} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: `2px solid ${T.border}`, cursor: onClick ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap', fontFamily: T.font, ...style }}>
    {children}{sorted ? (sorted === 'asc' ? ' \u25B2' : ' \u25BC') : ''}
  </th>
);

const TD = ({ children, style }) => (
  <td style={{ padding: '9px 12px', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}`, fontFamily: T.font, ...style }}>{children}</td>
);

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
const TnfdLeapPage = () => {
  const navigate = useNavigate();

  /* ── Portfolio ── */
  const portfolio = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1') || '[]');
      if (raw.length) return raw;
      return (GLOBAL_COMPANY_MASTER || []).slice(0, 25);
    } catch { return (GLOBAL_COMPANY_MASTER || []).slice(0, 25); }
  }, []);

  /* ── State ── */
  const [leapTab, setLeapTab] = useState('locate');
  const [selectedSector, setSelectedSector] = useState('Energy');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [sortCol, setSortCol] = useState('dep_score');
  const [sortDir, setSortDir] = useState('desc');
  const [disclosures, setDisclosures] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('tnfd_disclosures_v1')); return s || TNFD_DISCLOSURES_INIT; } catch { return TNFD_DISCLOSURES_INIT; }
  });
  const [scenarioSelected, setScenarioSelected] = useState('bau');

  /* ── Persist disclosures ── */
  useEffect(() => { localStorage.setItem('tnfd_disclosures_v1', JSON.stringify(disclosures)); }, [disclosures]);

  /* ── Scored holdings ── */
  const scoredHoldings = useMemo(() => {
    return portfolio.map(c => {
      const sd = getSectorData(c.gics_sector || c.sector);
      const depScore = sd.dep_score + ((c.isin || '').charCodeAt(3) % 15 - 7);
      const impScore = sd.impact_score + ((c.isin || '').charCodeAt(4) % 12 - 6);
      const topRisk = (sd.risks[0] || {}).risk || 'N/A';
      const topOpp = (sd.opportunities[0] || {}).type || 'N/A';
      const biomes = sd.biomes.join(', ');
      const physRisk = likI((sd.risks.find(r => r.category === 'Physical') || {}).likelihood || 'Low');
      const transRisk = likI((sd.risks.find(r => r.category === 'Transition') || {}).likelihood || 'Low');
      const sysRisk = likI((sd.risks.find(r => r.category === 'Systemic') || {}).likelihood || 'Low');
      const litRisk = likI((sd.risks.find(r => r.category === 'Litigation') || {}).likelihood || 'Low');
      return { ...c, dep_score: Math.max(5, Math.min(100, depScore)), impact_score: Math.max(5, Math.min(100, impScore)), topRisk, topOpp, biomes, physRisk, transRisk, sysRisk, litRisk, natureStatus: depScore > 70 ? 'High Risk' : depScore > 40 ? 'Medium' : 'Low' };
    });
  }, [portfolio]);

  /* ── KPI metrics ── */
  const metrics = useMemo(() => {
    if (!scoredHoldings.length) return {};
    const avgDep = scoredHoldings.reduce((s, h) => s + h.dep_score, 0) / scoredHoldings.length;
    const avgImp = scoredHoldings.reduce((s, h) => s + h.impact_score, 0) / scoredHoldings.length;
    const highRisk = scoredHoldings.filter(h => h.dep_score > 65).length;
    const biomeSet = new Set(); scoredHoldings.forEach(h => { const sd = getSectorData(h.gics_sector || h.sector); sd.biomes.forEach(b => biomeSet.add(b)); });
    const ecoservicesAtRisk = new Set(); scoredHoldings.forEach(h => { const sd = getSectorData(h.gics_sector || h.sector); sd.dependencies.filter(d => d.criticality === 'Very High' || d.criticality === 'High').forEach(d => ecoservicesAtRisk.add(d.service)); });
    const compliant = disclosures.filter(d => d.status === 'compliant').length;
    const physCount = scoredHoldings.filter(h => h.physRisk >= 4).length;
    const transCount = scoredHoldings.filter(h => h.transRisk >= 4).length;
    const sysCount = scoredHoldings.filter(h => h.sysRisk >= 3).length;
    const oppSectors = new Set(); SECTOR_KEYS.forEach(k => { SECTOR_NATURE_INTERFACES[k].opportunities.forEach(o => { if (o.potential === 'High' || o.potential === 'Very High') oppSectors.add(o.type); }); });
    return { avgDep: avgDep.toFixed(1), avgImp: avgImp.toFixed(1), highRisk, biomes: biomeSet.size, ecoservices: ecoservicesAtRisk.size, disclosurePct: ((compliant / 14) * 100).toFixed(0), physCount, transCount, sysCount, opportunities: oppSectors.size };
  }, [scoredHoldings, disclosures]);

  /* ── Sector aggregation ── */
  const sectorAgg = useMemo(() => {
    const map = {};
    scoredHoldings.forEach(h => {
      const s = mapSector(h.gics_sector || h.sector || 'Other');
      if (!map[s]) map[s] = { sector: s, count: 0, avgDep: 0, avgImp: 0, totalDep: 0, totalImp: 0 };
      map[s].count++;
      map[s].totalDep += h.dep_score;
      map[s].totalImp += h.impact_score;
    });
    return Object.values(map).map(v => ({ ...v, avgDep: +(v.totalDep / v.count).toFixed(1), avgImp: +(v.totalImp / v.count).toFixed(1) })).sort((a, b) => b.avgDep - a.avgDep);
  }, [scoredHoldings]);

  /* ── Biome exposure PieChart data ── */
  const biomeData = useMemo(() => {
    const map = {};
    scoredHoldings.forEach(h => {
      const sd = getSectorData(h.gics_sector || h.sector);
      sd.biomes.forEach(b => { map[b] = (map[b] || 0) + 1; });
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [scoredHoldings]);

  /* ── ENCORE dependency matrix data ── */
  const encoreMatrix = useMemo(() => {
    return SECTOR_KEYS.map(sector => {
      const sd = SECTOR_NATURE_INTERFACES[sector];
      const row = { sector };
      ECOSYSTEM_SERVICES.forEach(es => {
        const dep = sd.dependencies.find(d => d.service === es);
        row[es] = dep ? dep.criticality : 'None';
      });
      return row;
    });
  }, []);

  /* ── Radar data for ecosystem services ── */
  const radarData = useMemo(() => {
    const servCount = {};
    ECOSYSTEM_SERVICES.forEach(es => { servCount[es] = 0; });
    scoredHoldings.forEach(h => {
      const sd = getSectorData(h.gics_sector || h.sector);
      sd.dependencies.forEach(d => { if (servCount[d.service] !== undefined) servCount[d.service] += sev(d.criticality); });
    });
    return ECOSYSTEM_SERVICES.map(es => ({ service: es.length > 14 ? es.slice(0, 13) + '...' : es, fullName: es, value: servCount[es] || 0 }));
  }, [scoredHoldings]);

  /* ── Opportunities bar chart ── */
  const oppData = useMemo(() => {
    const map = {};
    SECTOR_KEYS.forEach(sector => {
      const sd = SECTOR_NATURE_INTERFACES[sector];
      sd.opportunities.forEach(o => {
        if (!map[sector]) map[sector] = { sector: sector.length > 15 ? sector.slice(0, 14) + '..' : sector, count: 0, highPotential: 0 };
        map[sector].count++;
        if (o.potential === 'High' || o.potential === 'Very High') map[sector].highPotential++;
      });
    });
    return Object.values(map).sort((a, b) => b.highPotential - a.highPotential);
  }, []);

  /* ── Sort handler ── */
  const handleSort = useCallback(col => {
    setSortDir(prev => sortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'desc');
    setSortCol(col);
  }, [sortCol]);

  const sortedHoldings = useMemo(() => {
    return [...scoredHoldings].sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [scoredHoldings, sortCol, sortDir]);

  /* ── Disclosure handlers ── */
  const cycleStatus = useCallback(id => {
    setDisclosures(prev => prev.map(d => d.id === id ? { ...d, status: d.status === 'pending' ? 'compliant' : d.status === 'compliant' ? 'partial' : d.status === 'partial' ? 'gap' : d.status === 'gap' ? 'na' : 'pending' } : d));
  }, []);

  /* ── Exports ── */
  const exportCSV = useCallback(() => {
    const headers = ['Company', 'ISIN', 'Sector', 'Nature Dep Score', 'Impact Score', 'Biomes', 'Top Risk', 'Top Opportunity', 'Status'];
    const rows = scoredHoldings.map(h => [h.company_name || h.name, h.isin, h.gics_sector || h.sector, h.dep_score, h.impact_score, h.biomes, h.topRisk, h.topOpp, h.natureStatus]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `tnfd_leap_report_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }, [scoredHoldings]);

  const exportJSON = useCallback(() => {
    const data = { assessment_date: new Date().toISOString(), disclosures, holdings: scoredHoldings.map(h => ({ name: h.company_name || h.name, isin: h.isin, sector: h.gics_sector || h.sector, dep_score: h.dep_score, impact_score: h.impact_score, biomes: h.biomes, topRisk: h.topRisk })), sector_analysis: SECTOR_KEYS.map(k => ({ sector: k, ...SECTOR_NATURE_INTERFACES[k] })) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `tnfd_leap_assessment_${new Date().toISOString().slice(0, 10)}.json`; a.click();
  }, [scoredHoldings, disclosures]);

  const handlePrint = useCallback(() => window.print(), []);

  /* ── Disclosure pillar progress ── */
  const pillarProgress = useMemo(() => {
    const pillars = ['Governance', 'Strategy', 'Risk & Impact', 'Metrics & Targets'];
    return pillars.map(p => {
      const items = disclosures.filter(d => d.pillar === p);
      const done = items.filter(d => d.status === 'compliant').length;
      return { pillar: p, total: items.length, done, partial: items.filter(d => d.status === 'partial').length, gap: items.filter(d => d.status === 'gap').length, pct: items.length ? ((done / items.length) * 100).toFixed(0) : 0 };
    });
  }, [disclosures]);

  const sd = SECTOR_NATURE_INTERFACES[selectedSector];
  const sf = col => sortCol === col ? sortDir : null;

  /* ── Empty state ── */
  if (!portfolio.length) {
    return (
      <div style={{ padding: 40, fontFamily: T.font, background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: T.surface, borderRadius: 16, padding: 48, textAlign: 'center', maxWidth: 480, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.navy, marginBottom: 8 }}>No Portfolio Loaded</div>
          <div style={{ fontSize: 14, color: T.textSec, marginBottom: 24 }}>Build a portfolio in the Portfolio Manager to begin your TNFD LEAP assessment.</div>
          <Btn onClick={() => navigate('/portfolio-manager')}>Open Portfolio Manager</Btn>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ padding: '24px 32px 60px', fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      {/* ── HEADER ── */}
      <div style={{ background: `linear-gradient(135deg, ${T.navy}, #234e78)`, borderRadius: 16, padding: '28px 32px', marginBottom: 24, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-.3px' }}>TNFD LEAP Assessment Framework</h1>
            <div style={{ fontSize: 13, opacity: .7, marginTop: 4 }}>Locate, Evaluate, Assess, Prepare | {portfolio.length} holdings</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['4 Phases', '14 Disclosures', '11 Sectors', 'ENCORE'].map(b => (
              <span key={b} style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,.15)', fontSize: 11, fontWeight: 600 }}>{b}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <Btn onClick={exportCSV} small style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.25)', color: '#fff' }}>Export CSV</Btn>
          <Btn onClick={exportJSON} small style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.25)', color: '#fff' }}>Export JSON</Btn>
          <Btn onClick={handlePrint} small style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.25)', color: '#fff' }}>Print</Btn>
        </div>
      </div>

      {/* ── LEAP Phase Tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {[{ id: 'locate', label: 'L - Locate', icon: '📍' }, { id: 'evaluate', label: 'E - Evaluate', icon: '🔬' }, { id: 'assess', label: 'A - Assess', icon: '⚖️' }, { id: 'prepare', label: 'P - Prepare', icon: '📋' }].map(t => (
          <button key={t.id} onClick={() => setLeapTab(t.id)} style={{ padding: '10px 22px', borderRadius: 10, border: `2px solid ${leapTab === t.id ? T.navy : T.border}`, background: leapTab === t.id ? T.navy : T.surface, color: leapTab === t.id ? '#fff' : T.text, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: T.font, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── 10 KPI Cards ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <KpiCard label="Nature Dependency Score" value={metrics.avgDep || '-'} sub="Portfolio-weighted avg" color={T.navy} />
        <KpiCard label="Nature Impact Score" value={metrics.avgImp || '-'} sub="Portfolio-weighted avg" color={T.red} />
        <KpiCard label="High-Risk Holdings" value={metrics.highRisk || 0} sub={`of ${portfolio.length} holdings`} color={T.amber} />
        <KpiCard label="Biomes Exposed" value={metrics.biomes || 0} sub="Unique biome types" color={T.sage} />
        <KpiCard label="Ecosystem Svc at Risk" value={metrics.ecoservices || 0} sub="High/VHigh criticality" color={T.gold} />
        <KpiCard label="TNFD Disclosure" value={`${metrics.disclosurePct || 0}%`} sub={`${disclosures.filter(d => d.status === 'compliant').length}/14 compliant`} color={T.green} />
        <KpiCard label="Physical Nature Risk" value={metrics.physCount || 0} sub="Holdings with high exposure" color={T.red} />
        <KpiCard label="Transition Nature Risk" value={metrics.transCount || 0} sub="Holdings with high exposure" color={T.amber} />
        <KpiCard label="Systemic Nature Risk" value={metrics.sysCount || 0} sub="Holdings medium+ exposure" color={T.navyL} />
        <KpiCard label="Opportunities" value={metrics.opportunities || 0} sub="High-potential identified" color={T.sage} />
      </div>

      {/* ══════════════════════════════════════════════════════════════
         LOCATE TAB
         ══════════════════════════════════════════════════════════════ */}
      {leapTab === 'locate' && (
        <>
          {/* Sector selector */}
          <Section title="Nature Interface by Sector" sub="Select a sector to explore biomes, ecosystems, and geographic nature risk">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
              {SECTOR_KEYS.map(s => (
                <Btn key={s} small active={selectedSector === s} onClick={() => setSelectedSector(s)}>{s.length > 18 ? s.slice(0, 17) + '..' : s}</Btn>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 8 }}>Biomes</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{sd.biomes.map(b => <Badge key={b} text={b} color={T.navy} />)}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 8, marginTop: 16 }}>Ecosystems</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{sd.ecosystems.map(e => <Badge key={e} text={e} color={T.sage} />)}</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 8 }}>Key Dependencies</div>
                {sd.dependencies.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                    <span style={{ color: T.text }}>{d.service}</span>
                    <Badge text={d.criticality} color={sevClr(d.criticality)} />
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Country BII table */}
          <Section title="Geographic Nature Risk — Biodiversity Intactness Index" sub="Countries where portfolio may have operational exposure">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <TH>Country</TH><TH>BII Score</TH><TH>Key Biomes</TH><TH>Risk Level</TH>
                </tr></thead>
                <tbody>{COUNTRY_BII.map(c => (
                  <tr key={c.code} style={{ background: c.bii < 0.6 ? `${T.red}08` : 'transparent' }}>
                    <TD>{c.name} ({c.code})</TD>
                    <TD><span style={{ fontWeight: 700, color: c.bii < 0.6 ? T.red : c.bii < 0.7 ? T.amber : T.green }}>{c.bii.toFixed(2)}</span></TD>
                    <TD style={{ fontSize: 12 }}>{c.biomes}</TD>
                    <TD><Badge text={c.bii < 0.6 ? 'High' : c.bii < 0.7 ? 'Medium' : 'Low'} color={c.bii < 0.6 ? T.red : c.bii < 0.7 ? T.amber : T.green} /></TD>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Section>

          {/* Biome exposure pie */}
          <Section title="Portfolio Biome Exposure" sub="Number of holdings interfacing with each biome type">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={biomeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {biomeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
         EVALUATE TAB
         ══════════════════════════════════════════════════════════════ */}
      {leapTab === 'evaluate' && (
        <>
          {/* ENCORE dependency matrix */}
          <Section title="ENCORE Dependency Matrix" sub="11 GICS sectors x 8 ecosystem services — color coded by criticality">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>
                  <TH style={{ minWidth: 150 }}>Sector</TH>
                  {ECOSYSTEM_SERVICES.map(es => <TH key={es} style={{ minWidth: 90, fontSize: 10 }}>{es}</TH>)}
                </tr></thead>
                <tbody>{encoreMatrix.map(row => (
                  <tr key={row.sector}>
                    <TD style={{ fontWeight: 600, fontSize: 12 }}>{row.sector}</TD>
                    {ECOSYSTEM_SERVICES.map(es => {
                      const v = row[es];
                      const bg = v === 'Very High' ? '#dc262622' : v === 'High' ? '#d9770622' : v === 'Medium' ? '#c5a96a22' : v === 'Low' ? '#16a34a15' : 'transparent';
                      return <TD key={es} style={{ background: bg, textAlign: 'center', fontSize: 11 }}><Badge text={v} color={sevClr(v)} /></TD>;
                    })}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Section>

          {/* Impact pathways per sector */}
          <Section title="Impact Pathways — Selected Sector" sub={`Showing impacts for: ${selectedSector}`}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {SECTOR_KEYS.map(s => <Btn key={s} small active={selectedSector === s} onClick={() => setSelectedSector(s)}>{s.length > 15 ? s.slice(0, 14) + '..' : s}</Btn>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {sd.impacts.map((imp, i) => (
                <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, background: `${sevClr(imp.severity)}08` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{imp.type}</span>
                    <Badge text={imp.severity} color={sevClr(imp.severity)} />
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>{imp.pathway}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Dependencies BarChart */}
          <Section title="Sector Nature Dependency Scores" sub="Portfolio-weighted average dependency on natural capital">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={sectorAgg} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="sector" tick={{ fontSize: 11 }} width={115} />
                <Tooltip />
                <Bar dataKey="avgDep" name="Dependency Score" radius={[0, 6, 6, 0]}>
                  {sectorAgg.map((s, i) => <Cell key={i} fill={s.avgDep > 70 ? T.red : s.avgDep > 40 ? T.amber : T.sage} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          {/* Impacts BarChart */}
          <Section title="Sector Nature Impact Scores" sub="Estimated severity of portfolio impact on natural capital">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={sectorAgg} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="sector" tick={{ fontSize: 11 }} width={115} />
                <Tooltip />
                <Bar dataKey="avgImp" name="Impact Score" radius={[0, 6, 6, 0]}>
                  {sectorAgg.map((s, i) => <Cell key={i} fill={s.avgImp > 70 ? T.red : s.avgImp > 40 ? T.amber : T.sage} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
         ASSESS TAB
         ══════════════════════════════════════════════════════════════ */}
      {leapTab === 'assess' && (
        <>
          {/* Risk matrix (likelihood x impact) */}
          <Section title="Nature Risk Matrix" sub="Likelihood vs impact across Physical, Transition, Systemic, and Litigation categories">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {['Physical', 'Transition', 'Systemic', 'Litigation'].map(cat => {
                const allRisks = [];
                SECTOR_KEYS.forEach(s => {
                  SECTOR_NATURE_INTERFACES[s].risks.filter(r => r.category === cat).forEach(r => allRisks.push({ ...r, sector: s }));
                });
                return (
                  <div key={cat} style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, background: T.surface }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 10 }}>{cat} Risks</div>
                    {allRisks.slice(0, 5).map((r, i) => (
                      <div key={i} style={{ marginBottom: 8, padding: '6px 8px', borderRadius: 6, background: `${sevClr(r.impact)}08`, border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 3 }}>{r.sector}</div>
                        <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>{r.risk}</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Badge text={`L: ${r.likelihood}`} color={sevClr(r.likelihood)} />
                          <Badge text={`I: ${r.impact}`} color={sevClr(r.impact)} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Portfolio nature risk heatmap */}
          <Section title="Portfolio Nature Risk Heatmap" sub="Holdings x 4 risk categories">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <TH>Company</TH><TH>Sector</TH><TH>Physical</TH><TH>Transition</TH><TH>Systemic</TH><TH>Litigation</TH><TH>Overall</TH>
                </tr></thead>
                <tbody>{sortedHoldings.slice(0, 20).map(h => {
                  const overall = Math.round((h.physRisk + h.transRisk + h.sysRisk + h.litRisk) / 4 * 25);
                  const rClr = v => v >= 4 ? T.red : v >= 3 ? T.amber : v >= 2 ? T.gold : T.green;
                  return (
                    <tr key={h.isin || h.company_name}>
                      <TD style={{ fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.company_name || h.name}</TD>
                      <TD style={{ fontSize: 11 }}>{h.gics_sector || h.sector}</TD>
                      <TD style={{ textAlign: 'center' }}><span style={{ display: 'inline-block', width: 24, height: 24, borderRadius: 6, background: rClr(h.physRisk), color: '#fff', textAlign: 'center', lineHeight: '24px', fontSize: 11, fontWeight: 700 }}>{h.physRisk}</span></TD>
                      <TD style={{ textAlign: 'center' }}><span style={{ display: 'inline-block', width: 24, height: 24, borderRadius: 6, background: rClr(h.transRisk), color: '#fff', textAlign: 'center', lineHeight: '24px', fontSize: 11, fontWeight: 700 }}>{h.transRisk}</span></TD>
                      <TD style={{ textAlign: 'center' }}><span style={{ display: 'inline-block', width: 24, height: 24, borderRadius: 6, background: rClr(h.sysRisk), color: '#fff', textAlign: 'center', lineHeight: '24px', fontSize: 11, fontWeight: 700 }}>{h.sysRisk}</span></TD>
                      <TD style={{ textAlign: 'center' }}><span style={{ display: 'inline-block', width: 24, height: 24, borderRadius: 6, background: rClr(h.litRisk), color: '#fff', textAlign: 'center', lineHeight: '24px', fontSize: 11, fontWeight: 700 }}>{h.litRisk}</span></TD>
                      <TD style={{ textAlign: 'center' }}><span style={{ fontWeight: 700, color: overall > 70 ? T.red : overall > 45 ? T.amber : T.green }}>{overall}%</span></TD>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </Section>

          {/* Materiality assessment */}
          <Section title="Materiality Assessment" sub="Which nature risks are financially material to the portfolio?">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
              {[
                { name: 'Water Scarcity', material: true, sectors: 'Energy, Utilities, Consumer Staples, Materials', financialImpact: 'Revenue reduction 5-15% for water-intensive sectors' },
                { name: 'Pollinator Decline', material: true, sectors: 'Consumer Staples, Health Care', financialImpact: 'Supply disruption affecting 75% of food crop production' },
                { name: 'Deforestation Regulation', material: true, sectors: 'Consumer Staples, Materials, Consumer Discretionary', financialImpact: 'Compliance costs, market access risk under EUDR' },
                { name: 'Ecosystem Collapse', material: true, sectors: 'All sectors (systemic)', financialImpact: 'GDP reduction of 2.7% by 2030 (World Bank est.)' },
                { name: 'Biodiversity Credits', material: false, sectors: 'Financials, Real Estate, Materials', financialImpact: 'Emerging market opportunity worth $2-4B by 2030' },
                { name: 'Marine Pollution', material: false, sectors: 'Energy, Consumer Discretionary', financialImpact: 'Moderate cleanup and litigation costs' },
              ].map((m, i) => (
                <div key={i} style={{ border: `1px solid ${m.material ? T.red : T.border}`, borderRadius: 10, padding: 14, background: m.material ? `${T.red}06` : T.surface }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{m.name}</span>
                    <Badge text={m.material ? 'Material' : 'Watch'} color={m.material ? T.red : T.gold} />
                  </div>
                  <div style={{ fontSize: 12, color: T.textSec, marginBottom: 4 }}>Sectors: {m.sectors}</div>
                  <div style={{ fontSize: 12, color: T.text }}>{m.financialImpact}</div>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
         PREPARE TAB
         ══════════════════════════════════════════════════════════════ */}
      {leapTab === 'prepare' && (
        <>
          {/* 14 TNFD Disclosures with status toggle */}
          <Section title="TNFD Disclosure Recommendations" sub="Click status badges to cycle: Pending -> Compliant -> Partial -> Gap -> N/A">
            {['Governance', 'Strategy', 'Risk & Impact', 'Metrics & Targets'].map(pillar => {
              const pp = pillarProgress.find(p => p.pillar === pillar);
              return (
                <div key={pillar} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: T.navy }}>{pillar}</span>
                    <span style={{ fontSize: 12, color: T.textSec }}>{pp.done}/{pp.total} compliant ({pp.pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: T.border, borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pp.pct}%`, background: T.green, borderRadius: 3, transition: 'width .3s' }} />
                  </div>
                  {disclosures.filter(d => d.pillar === pillar).map(d => (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', marginBottom: 4, borderRadius: 8, background: T.surfaceH, border: `1px solid ${T.border}` }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 700, fontSize: 12, color: T.navy, marginRight: 8 }}>{d.id}</span>
                        <span style={{ fontSize: 13, color: T.text }}>{d.recommendation}</span>
                      </div>
                      <button onClick={() => cycleStatus(d.id)} style={{ padding: '4px 14px', borderRadius: 20, border: `1px solid ${statusClr(d.status)}`, background: `${statusClr(d.status)}15`, color: statusClr(d.status), fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: T.font, minWidth: 80, textAlign: 'center' }}>{statusLabel(d.status)}</button>
                    </div>
                  ))}
                </div>
              );
            })}
          </Section>

          {/* Gap analysis */}
          <Section title="Gap Analysis & Action Items" sub="Identified gaps requiring remediation">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <TH>Disclosure</TH><TH>Status</TH><TH>Action Required</TH><TH>Owner</TH><TH>Due Date</TH>
              </tr></thead>
              <tbody>{disclosures.filter(d => d.status === 'gap' || d.status === 'partial' || d.status === 'pending').slice(0, 10).map(d => (
                <tr key={d.id}>
                  <TD style={{ fontWeight: 600 }}>{d.id}</TD>
                  <TD><Badge text={statusLabel(d.status)} color={statusClr(d.status)} /></TD>
                  <TD style={{ fontSize: 12 }}>{d.status === 'gap' ? 'Implement disclosure framework and data collection' : d.status === 'partial' ? 'Complete remaining data fields and verification' : 'Begin assessment and documentation'}</TD>
                  <TD style={{ fontSize: 12 }}>{d.pillar === 'Governance' ? 'Board Secretary' : d.pillar === 'Strategy' ? 'Chief Sustainability Officer' : d.pillar === 'Risk & Impact' ? 'CRO / Risk Team' : 'ESG Data Team'}</TD>
                  <TD style={{ fontSize: 12 }}>{d.status === 'gap' ? 'Q3 2026' : d.status === 'partial' ? 'Q2 2026' : 'Q4 2026'}</TD>
                </tr>
              ))}</tbody>
            </table>
          </Section>

          {/* TNFD Reporting Template */}
          <Section title="TNFD Reporting Template" sub="Auto-generated report structure following 14 disclosures">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {['Governance', 'Strategy', 'Risk & Impact', 'Metrics & Targets'].map(pillar => {
                const items = disclosures.filter(d => d.pillar === pillar);
                return (
                  <div key={pillar} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 8 }}>{pillar}</div>
                    {items.map(d => (
                      <div key={d.id} style={{ fontSize: 12, color: T.textSec, padding: '4px 0', borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ fontWeight: 600, color: T.text }}>{d.id}:</span> {d.recommendation.slice(0, 60)}...
                        <span style={{ float: 'right' }}><Badge text={statusLabel(d.status)} color={statusClr(d.status)} /></span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </Section>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
         ALWAYS-VISIBLE SECTIONS (below tabs)
         ══════════════════════════════════════════════════════════════ */}

      {/* Ecosystem Service Dependency RadarChart */}
      <Section title="Ecosystem Service Dependency Radar" sub="8-axis spider — aggregated criticality across portfolio holdings">
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={radarData} outerRadius={120}>
            <PolarGrid stroke={T.border} />
            <PolarAngleAxis dataKey="service" tick={{ fontSize: 11, fill: T.textSec }} />
            <PolarRadiusAxis tick={{ fontSize: 10 }} />
            <Radar name="Dependency Weight" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.25} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </Section>

      {/* Nature-Related Opportunities BarChart */}
      <Section title="Nature-Related Opportunities by Sector" sub="Count of high-potential opportunities identified per sector">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={oppData} margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="sector" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={80} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="highPotential" name="High Potential" fill={T.sage} radius={[6, 6, 0, 0]} />
            <Bar dataKey="count" name="All Opportunities" fill={T.gold} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* Sortable Holdings Table */}
      <Section title="Holdings Nature Risk Table" sub="Click column headers to sort">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <TH onClick={() => handleSort('company_name')} sorted={sf('company_name')}>Company</TH>
              <TH onClick={() => handleSort('gics_sector')} sorted={sf('gics_sector')}>Sector</TH>
              <TH onClick={() => handleSort('dep_score')} sorted={sf('dep_score')}>Dep Score</TH>
              <TH onClick={() => handleSort('impact_score')} sorted={sf('impact_score')}>Impact Score</TH>
              <TH>Biomes</TH>
              <TH>Top Risk</TH>
              <TH>Top Opportunity</TH>
              <TH onClick={() => handleSort('natureStatus')} sorted={sf('natureStatus')}>Status</TH>
            </tr></thead>
            <tbody>{sortedHoldings.map(h => (
              <tr key={h.isin || h.company_name} style={{ cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <TD style={{ fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.company_name || h.name}</TD>
                <TD style={{ fontSize: 11 }}>{h.gics_sector || h.sector}</TD>
                <TD><span style={{ fontWeight: 700, color: h.dep_score > 70 ? T.red : h.dep_score > 40 ? T.amber : T.green }}>{h.dep_score}</span></TD>
                <TD><span style={{ fontWeight: 700, color: h.impact_score > 70 ? T.red : h.impact_score > 40 ? T.amber : T.green }}>{h.impact_score}</span></TD>
                <TD style={{ fontSize: 11 }}>{h.biomes}</TD>
                <TD style={{ fontSize: 11, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.topRisk}</TD>
                <TD style={{ fontSize: 11 }}>{h.topOpp}</TD>
                <TD><Badge text={h.natureStatus} color={h.natureStatus === 'High Risk' ? T.red : h.natureStatus === 'Medium' ? T.amber : T.green} /></TD>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Section>

      {/* Scenario Analysis */}
      <Section title="Nature Scenario Analysis" sub="Portfolio impact under 3 nature futures: Business as Usual, Nature Recovery, Ecosystem Collapse">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {NATURE_SCENARIOS.map(s => (
            <Btn key={s.id} active={scenarioSelected === s.id} onClick={() => setScenarioSelected(s.id)}>{s.name}</Btn>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
          {NATURE_SCENARIOS.map(s => (
            <div key={s.id} style={{ border: `1px solid ${scenarioSelected === s.id ? T.navy : T.border}`, borderRadius: 12, padding: 16, background: scenarioSelected === s.id ? `${T.navy}08` : T.surface }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 10, lineHeight: 1.4 }}>{s.description}</div>
              <div style={{ fontSize: 12 }}><strong>BII 2030:</strong> {s.bii_2030}</div>
              <div style={{ fontSize: 12 }}><strong>Portfolio Loss:</strong> <span style={{ color: s.portfolio_loss_pct > 5 ? T.red : s.portfolio_loss_pct > 2 ? T.amber : T.green, fontWeight: 700 }}>{s.portfolio_loss_pct}%</span></div>
              <div style={{ fontSize: 12 }}><strong>Risk Delta:</strong> <span style={{ color: s.nature_risk_delta.startsWith('+') ? T.red : T.green, fontWeight: 700 }}>{s.nature_risk_delta}</span></div>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={SCENARIO_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0.3, 0.8]} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="bau" name="Business as Usual" stroke={T.amber} fill={T.amber} fillOpacity={0.15} />
            <Area type="monotone" dataKey="recovery" name="Nature Recovery" stroke={T.green} fill={T.green} fillOpacity={0.15} />
            <Area type="monotone" dataKey="collapse" name="Ecosystem Collapse" stroke={T.red} fill={T.red} fillOpacity={0.15} />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      {/* Climate Cross-Reference */}
      <Section title="Cross-Reference: Nature & Climate Risk" sub="Nature and climate risks compound — interconnected pathways">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {[
            { nature: 'Deforestation', climate: 'Carbon sink loss', compound: 'Deforestation releases stored carbon AND removes future sequestration capacity', severity: 'Very High' },
            { nature: 'Water scarcity', climate: 'Drought intensification', compound: 'Climate-driven droughts reduce ecosystem services that regulate water cycles', severity: 'High' },
            { nature: 'Pollinator decline', climate: 'Temperature shifts', compound: 'Warming disrupts pollinator-plant synchrony, reducing crop yields', severity: 'High' },
            { nature: 'Coral bleaching', climate: 'Ocean warming/acidification', compound: 'Reef loss eliminates coastal protection AND fish breeding grounds', severity: 'Very High' },
            { nature: 'Soil degradation', climate: 'Extreme precipitation', compound: 'Degraded soils increase flood risk and lose carbon storage capacity', severity: 'Medium' },
          ].map((x, i) => (
            <div key={i} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, background: `${sevClr(x.severity)}06` }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <Badge text={`Nature: ${x.nature}`} color={T.sage} />
                <Badge text={`Climate: ${x.climate}`} color={T.navy} />
              </div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5, marginBottom: 4 }}>{x.compound}</div>
              <Badge text={x.severity} color={sevClr(x.severity)} />
            </div>
          ))}
        </div>
      </Section>

      {/* Data Quality Assessment */}
      <Section title="Data Quality Assessment" sub="Per holding — nature data availability vs estimation">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <TH>Company</TH><TH>Sector</TH><TH>Biome Data</TH><TH>Dependency Data</TH><TH>Impact Data</TH><TH>Risk Data</TH><TH>Overall Quality</TH>
            </tr></thead>
            <tbody>{scoredHoldings.slice(0, 15).map((h, i) => {
              const q1 = (h.isin || '').charCodeAt(2) % 3; const q2 = (h.isin || '').charCodeAt(3) % 3; const q3 = (h.isin || '').charCodeAt(4) % 3; const q4 = (h.isin || '').charCodeAt(5) % 3;
              const qLabel = q => q === 0 ? 'Reported' : q === 1 ? 'Estimated' : 'Missing';
              const qClr = q => q === 0 ? T.green : q === 1 ? T.amber : T.red;
              const overall = Math.round(((3 - q1) + (3 - q2) + (3 - q3) + (3 - q4)) / 12 * 100);
              return (
                <tr key={h.isin || i}>
                  <TD style={{ fontWeight: 600, fontSize: 12 }}>{(h.company_name || h.name || '').slice(0, 25)}</TD>
                  <TD style={{ fontSize: 11 }}>{h.gics_sector || h.sector}</TD>
                  <TD><Badge text={qLabel(q1)} color={qClr(q1)} /></TD>
                  <TD><Badge text={qLabel(q2)} color={qClr(q2)} /></TD>
                  <TD><Badge text={qLabel(q3)} color={qClr(q3)} /></TD>
                  <TD><Badge text={qLabel(q4)} color={qClr(q4)} /></TD>
                  <TD><span style={{ fontWeight: 700, color: overall > 70 ? T.green : overall > 40 ? T.amber : T.red }}>{overall}%</span></TD>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </Section>

      {/* Cross-Navigation */}
      <Section title="Cross-Navigation" sub="Related modules in the Risk Analytics platform">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Biodiversity Footprint', path: '/biodiversity-footprint' },
            { label: 'Water Risk', path: '/water-risk' },
            { label: 'Deforestation Risk', path: '/deforestation-risk' },
            { label: 'Physical Climate Risk', path: '/climate-physical-risk' },
            { label: 'Supply Chain Map', path: '/supply-chain-map' },
            { label: 'Portfolio Manager', path: '/portfolio-manager' },
          ].map(n => (
            <Btn key={n.path} onClick={() => navigate(n.path)} small>{n.label}</Btn>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default TnfdLeapPage;
