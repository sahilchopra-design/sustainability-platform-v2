import React, { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie, ComposedChart } from 'recharts';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const T = {
  bg: '#0f172a', surface: '#1e293b', surfaceH: '#263248', border: '#334155', borderL: '#2d3f55',
  navy: '#60a5fa', navyL: '#93c5fd', gold: '#fbbf24', goldL: '#fcd34d',
  sage: '#34d399', sageL: '#6ee7b7', teal: '#2dd4bf', text: '#f1f5f9',
  textSec: '#94a3b8', textMut: '#64748b', red: '#f87171', green: '#4ade80',
  amber: '#fb923c', font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const COLORS = [T.navy, T.gold, T.sage, T.teal, T.amber, T.red, T.navyL, T.goldL, '#a78bfa', '#f472b6'];
const tip = { contentStyle: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, fontFamily: T.font }, labelStyle: { color: T.textSec, fontSize: 10 } };

const KpiCard = ({ label, value, sub, color = T.navy }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);
const cS = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 };

const CDR_TECHNOLOGIES = [
  { id: 'daccs', name: 'Direct Air Carbon Capture (DACCS)', category: 'Engineered', maturity: 'Scaling', costLow: 250, costHigh: 600, potential2030: 0.05, potential2050: 5.0, permanence: 10000, additionality: 'Very High', lca: 0.02, trl: 7, energyIntensity: 'High Electric', water: 'Low', land: 'Very Low', cobenefits: 'None', companies: ['Climeworks', 'Carbon Engineering', '1PointFive', 'Global Thermostat', 'Sustaera'], scalingRisk: 'High', annualGrowth: 120 },
  { id: 'beccs', name: 'Bioenergy + CCS (BECCS)', category: 'Hybrid', maturity: 'Demonstration', costLow: 80, costHigh: 200, potential2030: 0.5, potential2050: 5.0, permanence: 1000, additionality: 'High', lca: 0.08, trl: 6, energyIntensity: 'Bioenergy', water: 'High', land: 'High', cobenefits: 'Energy', companies: ['Drax', 'Stockholm Exergi', 'SaskPower', 'Boundary Dam', 'Storegga'], scalingRisk: 'Medium', annualGrowth: 45 },
  { id: 'biochar', name: 'Biochar', category: 'Nature-Based', maturity: 'Scaling', costLow: 60, costHigh: 200, potential2030: 0.3, potential2050: 2.0, permanence: 500, additionality: 'High', lca: 0.12, trl: 8, energyIntensity: 'Low', water: 'Very Low', land: 'Low', cobenefits: 'Soil health', companies: ['Carbofex', 'Biochar Now', 'Pyreg', 'Airex Energy', 'Kina'], scalingRisk: 'Low', annualGrowth: 65 },
  { id: 'ew', name: 'Enhanced Weathering', category: 'Geochemical', maturity: 'Pilot', costLow: 50, costHigh: 200, potential2030: 0.2, potential2050: 4.0, permanence: 10000, additionality: 'Very High', lca: 0.15, trl: 5, energyIntensity: 'Medium', water: 'Low', land: 'Low', cobenefits: 'Soil pH', companies: ['UNDO', 'Eion', 'Lithos Carbon', 'Arca Climate', 'CAOP'], scalingRisk: 'Medium', annualGrowth: 90 },
  { id: 'ocean-alk', name: 'Ocean Alkalinity Enhancement', category: 'Geochemical', maturity: 'Research', costLow: 40, costHigh: 250, potential2030: 0.1, potential2050: 8.0, permanence: 10000, additionality: 'Very High', lca: 0.10, trl: 3, energyIntensity: 'Medium', water: 'Ocean', land: 'Very Low', cobenefits: 'Ocean pH', companies: ['Planetary Tech', 'Ebb Carbon', 'Reefblocks', 'Captura', 'Calcarea'], scalingRisk: 'Very High', annualGrowth: 150 },
  { id: 'afforestation', name: 'Afforestation/Reforestation', category: 'Nature-Based', maturity: 'Proven', costLow: 5, costHigh: 50, potential2030: 3.5, potential2050: 10.0, permanence: 100, additionality: 'Medium', lca: 0.02, trl: 9, energyIntensity: 'Very Low', water: 'Medium', land: 'High', cobenefits: 'Biodiversity, water', companies: ['Land Life', 'Terraformation', 'Pachama', 'South Pole', 'Wildlife Works'], scalingRisk: 'Low', annualGrowth: 18 },
  { id: 'soil', name: 'Soil Carbon Sequestration', category: 'Nature-Based', maturity: 'Scaling', costLow: 10, costHigh: 100, potential2030: 1.5, potential2050: 5.0, permanence: 50, additionality: 'Medium', lca: 0.05, trl: 7, energyIntensity: 'Very Low', water: 'Low', land: 'High', cobenefits: 'Soil health, yield', companies: ['Indigo Ag', 'Nori', 'Regen Network', 'Agreena', 'Soil Capital'], scalingRisk: 'Low', annualGrowth: 40 },
  { id: 'blue-carbon', name: 'Blue Carbon (Mangroves/Seagrass)', category: 'Nature-Based', maturity: 'Scaling', costLow: 20, costHigh: 100, potential2030: 0.8, potential2050: 3.0, permanence: 100, additionality: 'High', lca: 0.04, trl: 8, energyIntensity: 'Very Low', water: 'Coastal', land: 'Low', cobenefits: 'Coastal resilience', companies: ['South Pole', 'Verra', 'Plan Vivo', 'Blue Carbon Initiative', 'Kelp Blue'], scalingRisk: 'Medium', annualGrowth: 35 },
  { id: 'mineralization', name: 'Mineral Carbonation', category: 'Geochemical', maturity: 'Pilot', costLow: 100, costHigh: 300, potential2030: 0.05, potential2050: 3.0, permanence: 10000, additionality: 'Very High', lca: 0.08, trl: 5, energyIntensity: 'Low', water: 'Low', land: 'Very Low', cobenefits: 'Building materials', companies: ['CarbonCure', 'Solidia', 'Carbon Clean', 'Carbonaide', 'Blue Planet'], scalingRisk: 'Medium', annualGrowth: 55 },
  { id: 'kelp', name: 'Macroalgae / Kelp Farming', category: 'Nature-Based', maturity: 'Research', costLow: 100, costHigh: 400, potential2030: 0.1, potential2050: 1.5, permanence: 50, additionality: 'Medium', lca: 0.06, trl: 4, energyIntensity: 'Low', water: 'Ocean', land: 'None', cobenefits: 'Marine food, feed', companies: ['Running Tide', 'Phykos', 'SeaForester', 'GreenWave', 'Seafields'], scalingRisk: 'High', annualGrowth: 200 },
  { id: 'wetlands', name: 'Wetland/Peatland Restoration', category: 'Nature-Based', maturity: 'Scaling', costLow: 15, costHigh: 80, potential2030: 0.6, potential2050: 3.5, permanence: 200, additionality: 'High', lca: 0.03, trl: 8, energyIntensity: 'Very Low', water: 'Wetland', land: 'Medium', cobenefits: 'Flood protection, biodiversity', companies: ['Deltares', 'Wetlands International', 'IUCN', 'Birdlife', 'CGIAR'], scalingRisk: 'Low', annualGrowth: 25 },
  { id: 'saildrone', name: 'Subsurface Ocean CDR', category: 'Geochemical', maturity: 'Research', costLow: 80, costHigh: 350, potential2030: 0.02, potential2050: 2.0, permanence: 5000, additionality: 'Very High', lca: 0.09, trl: 3, energyIntensity: 'Medium', water: 'Ocean', land: 'None', cobenefits: 'None', companies: ['Saildrone', 'Ocean-Based Climate', 'Climos', 'Woods Hole', 'MBARI'], scalingRisk: 'Very High', annualGrowth: 300 },
];

const PROJECT_NAMES_BASE = ['Alpine', 'Arctic', 'Atlantic', 'Borneo', 'Cascade', 'Congo', 'Coral', 'Dakota', 'Delta', 'Desert', 'Evergreen', 'Fjord', 'Glacier', 'Grassland', 'Highland', 'Kelp', 'Lagoon', 'Mesa', 'Nordic', 'Patagonia', 'Prairie', 'Redwood', 'Sahel', 'Savanna', 'Sierra', 'Sonoran', 'Steppe', 'Summit', 'Tundra', 'Valley', 'Volcano', 'Wetland', 'Woodland', 'Boreal', 'Cerrado', 'Dolomite', 'Fynbos', 'Karoo', 'Mato', 'Pampas', 'Pantanal', 'Pilbara', 'Savannah', 'Sequoia', 'Taiga', 'Veldt', 'Wadi', 'Yucatan', 'Zagros', 'Zambezi', 'Andean', 'Appalachian', 'Caspian', 'Danube', 'Euphrates', 'Ganges', 'Himalayan', 'Indus', 'Kalahari', 'Lena', 'Mackenzie', 'Nile', 'Orinoco', 'Parana', 'Qinghai', 'Rhine', 'Senegal', 'Tigris', 'Uruguay', 'Volga', 'Yangtze', 'Zambezi', 'Amazonia', 'Borneo2', 'Carpathian', 'Danakil', 'Ethiopian', 'Fergana', 'Gobi', 'Huang', 'Iceland', 'Java', 'Kazakh', 'Limpopo'];
const PROJECTS = Array.from({ length: 80 }, (_, i) => {
  const tech = CDR_TECHNOLOGIES[i % CDR_TECHNOLOGIES.length];
  return {
    id: i + 1,
    name: `${PROJECT_NAMES_BASE[i % PROJECT_NAMES_BASE.length]} ${tech.name.split(' ')[0]} Initiative`,
    technology: tech.id,
    techName: tech.name.split('(')[0].trim(),
    category: tech.category,
    region: ['North America', 'Europe', 'Asia', 'Africa', 'Latin America', 'Oceania'][Math.floor(sr(i * 7) * 6)],
    country: ['USA', 'UK', 'Germany', 'Kenya', 'Brazil', 'Australia', 'India', 'Iceland', 'Canada', 'Chile', 'Norway', 'Indonesia'][Math.floor(sr(i * 9) * 12)],
    capacityKtY: +(sr(i * 11) * 80 + 5).toFixed(1),
    costPerTon: Math.round(tech.costLow + sr(i * 13) * (tech.costHigh - tech.costLow)),
    qualityScore: +(sr(i * 17) * 3 + 7).toFixed(1),
    standard: ['Verra VCU', 'Gold Standard', 'Puro.earth', 'Plan Vivo', 'SBTi CDR', 'ISO 14064-2', 'BeZero'][Math.floor(sr(i * 19) * 7)],
    status: ['Active', 'Pipeline', 'Operational', 'Development', 'Under Review'][Math.floor(sr(i * 23) * 5)],
    vintage: 2023 + Math.floor(sr(i * 29) * 3),
    buyerType: ['Corporate', 'Government', 'Voluntary', 'Compliance'][Math.floor(sr(i * 31) * 4)],
    permanence: tech.permanence,
    additionality: tech.additionality,
    co2Removed: +(sr(i * 37) * 20 + 1).toFixed(1),
    price: Math.round(tech.costLow * 1.3 + sr(i * 41) * (tech.costHigh * 1.5 - tech.costLow * 1.3)),
    trl: tech.trl,
    devPhase: sr(i * 43) < 0.3 ? 'Feasibility' : sr(i * 43) < 0.6 ? 'Construction' : 'Operation',
    certification: sr(i * 47) < 0.5 ? 'Certified' : 'In Assessment',
    cobenefits: tech.cobenefits,
  };
});

const CORPORATE_BUYERS = [
  { company: 'Microsoft', sector: 'Technology', target2030: 1.0, target2050: 'Carbon Negative', budget: 1000, techPref: 'DACCS, BECCS', spent: 445, credits: 820, premium: 'High', commitment: 'MSFT $1B Climate Fund', rating: 'AAA' },
  { company: 'Stripe', sector: 'Technology', target2030: 0.1, target2050: 'Net Zero', budget: 50, techPref: 'Mixed portfolio', spent: 32, credits: 65, premium: 'High', commitment: 'Frontier buyer', rating: 'AA' },
  { company: 'Shopify', sector: 'Technology', target2030: 0.05, target2050: 'Net Zero', budget: 25, techPref: 'Engineered CDR', spent: 14, credits: 28, premium: 'Very High', commitment: 'Sustainability Fund $5M/yr', rating: 'AA' },
  { company: 'Alphabet', sector: 'Technology', target2030: 0.5, target2050: 'Net Zero', budget: 200, techPref: 'Biochar, DACCS', spent: 120, credits: 210, premium: 'High', commitment: 'CFE + CDR portfolio', rating: 'AAA' },
  { company: 'Meta', sector: 'Technology', target2030: 0.2, target2050: 'Net Zero', budget: 150, techPref: 'Nature-Based + Engineered', spent: 85, credits: 165, premium: 'Medium', commitment: 'Net Zero 2030 pledge', rating: 'AA' },
  { company: 'Amazon', sector: 'Technology', target2030: 1.0, target2050: 'Net Zero', budget: 500, techPref: 'Mixed', spent: 210, credits: 380, premium: 'Medium', commitment: 'Climate Pledge 2040', rating: 'AAA' },
  { company: 'Apple', sector: 'Technology', target2030: 0.3, target2050: 'Carbon Neutral', budget: 300, techPref: 'Nature-Based', spent: 175, credits: 290, premium: 'High', commitment: '2030 carbon neutral supply chain', rating: 'AAA' },
  { company: 'Salesforce', sector: 'Technology', target2030: 0.1, target2050: 'Net Zero', budget: 80, techPref: 'Frontier CDR', spent: 45, credits: 90, premium: 'Very High', commitment: 'Net Zero Cloud by 2030', rating: 'AA' },
  { company: 'McKinsey', sector: 'Consulting', target2030: 0.05, target2050: 'Net Zero', budget: 60, techPref: 'DACCS', spent: 30, credits: 58, premium: 'Very High', commitment: 'Frontier member', rating: 'A' },
  { company: 'Workday', sector: 'Technology', target2030: 0.02, target2050: 'Net Zero', budget: 30, techPref: 'Biochar, EW', spent: 18, credits: 35, premium: 'High', commitment: 'Frontier member', rating: 'AA' },
  { company: 'H&M Group', sector: 'Retail', target2030: 0.2, target2050: 'Net Zero', budget: 100, techPref: 'NbS + Biochar', spent: 55, credits: 105, premium: 'Medium', commitment: 'Fashion for Good partnership', rating: 'A' },
  { company: 'Unilever', sector: 'Consumer', target2030: 0.5, target2050: 'Net Zero', budget: 200, techPref: 'Nature-Based, BECCS', spent: 110, credits: 195, premium: 'Medium', commitment: 'Climate & Nature Fund', rating: 'AA' },
  { company: 'JPMorgan', sector: 'Finance', target2030: 0.3, target2050: 'Net Zero', budget: 300, techPref: 'Engineered CDR', spent: 90, credits: 165, premium: 'Medium', commitment: 'NZBA signatory CDR investment', rating: 'AAA' },
  { company: 'Goldman Sachs', sector: 'Finance', target2030: 0.2, target2050: 'Net Zero', budget: 250, techPref: 'Mixed portfolio', spent: 70, credits: 130, premium: 'Medium', commitment: 'Sustainable Finance advisory', rating: 'AAA' },
  { company: 'Swiss Re', sector: 'Insurance', target2030: 0.1, target2050: 'Net Zero', budget: 80, techPref: 'NbS + BECCS', spent: 35, credits: 68, premium: 'High', commitment: 'CDF member', rating: 'AA' },
  { company: 'Delta Airlines', sector: 'Aviation', target2030: 0.5, target2050: 'Net Zero', budget: 400, techPref: 'SAF + CDR', spent: 180, credits: 320, premium: 'Medium', commitment: '$1B decarbonisation pledge', rating: 'A' },
  { company: 'Nestle', sector: 'Food', target2030: 0.5, target2050: 'Net Zero', budget: 250, techPref: 'Soil Carbon, NbS', spent: 120, credits: 215, premium: 'Medium', commitment: 'Regenerative ag programme', rating: 'AA' },
  { company: 'Patagonia', sector: 'Retail', target2030: 0.05, target2050: 'Carbon Neutral', budget: 20, techPref: 'Biochar, soil', spent: 12, credits: 22, premium: 'Very High', commitment: 'Frontier + self-funded', rating: 'A' },
  { company: 'Levi Strauss', sector: 'Retail', target2030: 0.1, target2050: 'Net Zero', budget: 45, techPref: 'NbS', spent: 25, credits: 45, premium: 'Medium', commitment: 'SBTi Approved', rating: 'A' },
  { company: 'Autodesk', sector: 'Technology', target2030: 0.05, target2050: 'Net Zero', budget: 40, techPref: 'Frontier CDR', spent: 20, credits: 38, premium: 'Very High', commitment: 'Frontier member', rating: 'AA' },
  { company: 'Airbus', sector: 'Aviation', target2030: 0.3, target2050: 'Net Zero', budget: 200, techPref: 'SAF + DACCS', spent: 80, credits: 145, premium: 'High', commitment: 'Destination 2050 roadmap', rating: 'AA' },
  { company: 'Siemens', sector: 'Industrials', target2030: 0.2, target2050: 'Net Zero', budget: 150, techPref: 'BECCS + EW', spent: 65, credits: 120, premium: 'Medium', commitment: 'Degree of Change programme', rating: 'AA' },
  { company: 'Spotify', sector: 'Technology', target2030: 0.01, target2050: 'Net Zero', budget: 15, techPref: 'Biochar', spent: 8, credits: 15, premium: 'High', commitment: 'Green Audio campaign', rating: 'A' },
  { company: 'Blackrock', sector: 'Finance', target2030: 0.3, target2050: 'Net Zero', budget: 300, techPref: 'Mixed portfolio', spent: 100, credits: 185, premium: 'Medium', commitment: 'NZAM signatory', rating: 'AAA' },
  { company: 'ING Bank', sector: 'Finance', target2030: 0.15, target2050: 'Net Zero', budget: 100, techPref: 'EW + Biochar', spent: 40, credits: 75, premium: 'High', commitment: 'Terra Initiative', rating: 'AA' },
];

const CDR_POLICY = [
  { name: '45Q Tax Credit (US)', type: 'Tax Incentive', region: 'USA', value: '$85/t DAC, $60/t geological', status: 'Active', enacted: 2022, mechanism: 'Tax credit per tCO₂ permanently stored', admin: 'IRS/DOE' },
  { name: 'DOE Carbon Negative Shot', type: 'R&D Funding', region: 'USA', value: '$100M+', status: 'Active', enacted: 2021, mechanism: 'Direct funding for <$100/t DAC by 2030', admin: 'DOE ARPA-E' },
  { name: 'EU Innovation Fund', type: 'Grant', region: 'EU', value: '€40Bn 2021–2030', status: 'Active', enacted: 2020, mechanism: 'Grants for low-carbon tech including CDR', admin: 'EC' },
  { name: 'CarbonSAFE (US)', type: 'R&D Funding', region: 'USA', value: '$400M', status: 'Active', enacted: 2017, mechanism: 'Storage development for geological CCS', admin: 'DOE' },
  { name: 'BECCS in EU ETS', type: 'Market Mechanism', region: 'EU', value: 'EUA price (~€65/t)', status: 'Under Discussion', enacted: 2024, mechanism: 'Potential CDR credit in EU ETS for negative emissions', admin: 'EC/EEA' },
  { name: 'UK CCUS Cluster', type: 'Industrial Policy', region: 'UK', value: '£20Bn over 10 yrs', status: 'Active', enacted: 2021, mechanism: 'Industrial cluster CCS + BECCS', admin: 'DESNZ' },
  { name: 'Swiss Carbon Levy + CDR', type: 'Carbon Tax', region: 'Switzerland', value: 'CHF 120/t CO₂', status: 'Active', enacted: 2023, mechanism: 'Partial revenue directed to CDR projects', admin: 'BAFU' },
  { name: 'NZ Offshore Storage Bill', type: 'Enabling Legislation', region: 'New Zealand', value: 'N/A', status: 'Passed', enacted: 2023, mechanism: 'Legal framework for geological CO₂ storage', admin: 'MBIE' },
  { name: 'Norway Longship CCS', type: 'Public Investment', region: 'Norway', value: 'NOK 7.5Bn', status: 'Active', enacted: 2020, mechanism: 'Full-scale CCS chain from industrial emitters', admin: 'Gassnova' },
  { name: 'Japan GI Fund (Green Innovation)', type: 'R&D Funding', region: 'Japan', value: '¥2T over 10 yrs', status: 'Active', enacted: 2021, mechanism: 'Low-carbon tech including CDR', admin: 'METI/NEDO' },
  { name: 'Australia CER Carbon Method', type: 'Market Mechanism', region: 'Australia', value: 'A$33+/t (ACCU)', status: 'Active', enacted: 2023, mechanism: 'Australian Carbon Credit Units for CDR', admin: 'Clean Energy Regulator' },
  { name: 'Voluntary Carbon Market Integrity (VCMI)', type: 'Market Standard', region: 'Global', value: 'N/A', status: 'Active', enacted: 2022, mechanism: 'Quality standards for corporate CDR claims', admin: 'VCMI' },
];

const INTEGRITY_DIMENSIONS = [
  { dim: 'Additionality', daccs: 9.5, beccs: 8.0, biochar: 7.5, ew: 9.0, afforestation: 5.5, soil: 5.0, desc: 'Would removal have occurred without credit payment?' },
  { dim: 'Permanence', daccs: 9.8, beccs: 7.0, biochar: 6.5, ew: 9.5, afforestation: 4.0, soil: 3.5, desc: 'How durable is the carbon storage?' },
  { dim: 'Measurability', daccs: 9.9, beccs: 8.5, biochar: 7.0, ew: 6.5, afforestation: 5.0, soil: 4.5, desc: 'How precisely can removal be quantified?' },
  { dim: 'Co-benefits', daccs: 2.0, beccs: 5.0, biochar: 8.0, ew: 7.5, afforestation: 9.0, soil: 8.5, desc: 'Biodiversity, livelihoods, resilience co-benefits' },
  { dim: 'Scalability', daccs: 7.0, beccs: 6.0, biochar: 7.5, ew: 8.0, afforestation: 9.5, soil: 8.5, desc: '2050 Gt-scale deployment potential' },
  { dim: 'Cost Competitiveness', daccs: 3.0, beccs: 6.5, biochar: 7.5, ew: 8.0, afforestation: 9.5, soil: 9.0, desc: 'Cost per tonne vs alternatives' },
];

const MARKET_DATA = ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'].map((yr, i) => ({
  year: yr,
  'Engineered CDR': +(0.01 * Math.pow(2.4, i) + sr(i) * 0.01).toFixed(3),
  'Nature-Based': +(0.1 + i * 0.22 + sr(i + 11) * 0.05).toFixed(2),
  'Hybrid (BECCS)': +(0.05 + i * 0.09 + sr(i + 22) * 0.03).toFixed(2),
  'Geochemical': +(0.005 + i * 0.03 + sr(i + 33) * 0.01).toFixed(3),
  'Total Demand': +(0.165 + i * 0.37 + sr(i + 44) * 0.06).toFixed(2),
}));

const PRICE_HISTORY = ['Q1-22', 'Q2-22', 'Q3-22', 'Q4-22', 'Q1-23', 'Q2-23', 'Q3-23', 'Q4-23', 'Q1-24', 'Q2-24', 'Q3-24', 'Q4-24'].map((q, i) => ({
  quarter: q,
  'DACCS': Math.round(470 - i * 15 + sr(i * 7) * 20),
  'BECCS': Math.round(160 - i * 5 + sr(i * 11) * 12),
  'Biochar': Math.round(130 - i * 4 + sr(i * 13) * 10),
  'Nature-Based': Math.round(45 + i * 2 + sr(i * 17) * 8),
  'EW': Math.round(155 - i * 6 + sr(i * 19) * 14),
}));

const TABS = ['Overview', 'CDR Registry', 'Technology Assessment', 'Market Outlook', 'Cost Curves', 'Quality Standards', 'Corporate Buyers', 'Policy Landscape', 'CDR Integrity', 'Price Calculator', 'Portfolio'];

export default function CarbonRemovalPage() {
  const [tab, setTab] = useState('Overview');
  const [techFilter, setTechFilter] = useState('All');
  const [catFilter, setCatFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [standardFilter, setStandardFilter] = useState('All');
  const [buyerSectorF, setBuyerSectorF] = useState('All');
  const [search, setSearch] = useState('');
  const [calcVolume, setCalcVolume] = useState(100);
  const [calcTech, setCalcTech] = useState('daccs');
  const [calcYear, setCalcYear] = useState(2025);

  const categories = ['All', 'Engineered', 'Nature-Based', 'Geochemical', 'Hybrid'];
  const regions = ['All', 'North America', 'Europe', 'Asia', 'Africa', 'Latin America', 'Oceania'];
  const standards = ['All', 'Verra VCU', 'Gold Standard', 'Puro.earth', 'Plan Vivo', 'SBTi CDR', 'ISO 14064-2', 'BeZero'];

  const filteredTech = useMemo(() => catFilter === 'All' ? CDR_TECHNOLOGIES : CDR_TECHNOLOGIES.filter(t => t.category === catFilter), [catFilter]);

  const filteredProjects = useMemo(() => {
    let d = PROJECTS;
    if (techFilter !== 'All') d = d.filter(p => p.technology === techFilter);
    if (catFilter !== 'All') d = d.filter(p => p.category === catFilter);
    if (regionFilter !== 'All') d = d.filter(p => p.region === regionFilter);
    if (standardFilter !== 'All') d = d.filter(p => p.standard === standardFilter);
    if (search) d = d.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    return d;
  }, [techFilter, catFilter, regionFilter, standardFilter, search]);

  const filteredBuyers = useMemo(() => buyerSectorF === 'All' ? CORPORATE_BUYERS : CORPORATE_BUYERS.filter(b => b.sector === buyerSectorF), [buyerSectorF]);

  const kpis = useMemo(() => {
    const n = Math.max(1, filteredProjects.length);
    const totalCap = filteredProjects.reduce((s, p) => s + p.capacityKtY, 0);
    const avgCost = filteredProjects.reduce((s, p) => s + p.costPerTon, 0) / n;
    const totalPot2050 = CDR_TECHNOLOGIES.reduce((s, t) => s + t.potential2050, 0);
    const totalRemoved = filteredProjects.reduce((s, p) => s + p.co2Removed, 0);
    return {
      count: filteredProjects.length,
      totalCapMt: (totalCap / 1000).toFixed(2),
      avgCost: avgCost.toFixed(0),
      totalPot2050: totalPot2050.toFixed(1),
      totalRemoved: totalRemoved.toFixed(1),
      avgQuality: (filteredProjects.reduce((s, p) => s + p.qualityScore, 0) / n).toFixed(1),
    };
  }, [filteredProjects]);

  const calcPrice = useMemo(() => {
    const tech = CDR_TECHNOLOGIES.find(t => t.id === calcTech);
    if (!tech) return { cost: 0, total: 0, costAtYear: 0 };
    const yearIndex = calcYear - 2024;
    const yearFactor = Math.max(0.4, 1 - yearIndex * 0.04);
    const midCost = (tech.costLow + tech.costHigh) / 2;
    const costAtYear = +(midCost * yearFactor).toFixed(0);
    return {
      cost: costAtYear,
      total: (costAtYear * calcVolume).toFixed(0),
      savings: (midCost - costAtYear).toFixed(0),
      breakeven: `${Math.round(2024 + (midCost - 80) / (midCost * 0.04))}`,
    };
  }, [calcTech, calcVolume, calcYear]);

  const categoryTotals = useMemo(() => {
    const m = {};
    filteredProjects.forEach(p => { m[p.category] = (m[p.category] || 0) + p.capacityKtY; });
    return Object.entries(m).map(([cat, cap]) => ({ cat, cap: +(cap / 1000).toFixed(2) }));
  }, [filteredProjects]);

  const buyerSectors = ['All', ...Array.from(new Set(CORPORATE_BUYERS.map(b => b.sector)))];

  const tabBtn = t => ({
    padding: '7px 14px', border: `1px solid ${tab === t ? T.navy : T.border}`,
    borderRadius: 6, fontSize: 12, fontFamily: T.font, cursor: 'pointer',
    background: tab === t ? T.navy : T.surface, color: tab === t ? '#0f172a' : T.textSec, fontWeight: tab === t ? 600 : 400,
  });
  const selS = { padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, fontFamily: T.font, background: T.surface, color: T.text };
  const inpS = { padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: T.font, background: T.surface, color: T.text, outline: 'none', width: 200 };
  const thS = { padding: '8px 10px', fontSize: 11, fontFamily: T.mono, color: T.textSec, borderBottom: `1px solid ${T.border}`, textAlign: 'left', background: T.surfaceH };
  const tdS = { padding: '7px 10px', fontSize: 12, fontFamily: T.font, borderBottom: `1px solid ${T.border}`, color: T.text };
  const matColor = m => ({ 'Proven': T.green, 'Scaling': T.teal, 'Demonstration': T.amber, 'Pilot': T.gold, 'Research': T.red }[m] || T.textSec);
  const catColor = c => ({ 'Engineered': T.navy, 'Nature-Based': T.sage, 'Geochemical': T.teal, 'Hybrid': T.gold }[c] || T.textSec);

  const exportCSV = useCallback((data, fn) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(r => keys.map(k => `"${r[k]}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fn; a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div style={{ padding: '24px 32px', fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Carbon Removal Intelligence</h1>
        <p style={{ fontSize: 12, color: T.textSec, margin: '4px 0 0' }}>12 CDR pathways · 80 projects · 25 corporate buyers · policy landscape · price calculator — EP-DI2</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={tabBtn(t)}>{t}</button>)}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiCard label="CDR Technologies" value={CDR_TECHNOLOGIES.length} sub="tracked pathways" />
        <KpiCard label="Projects Tracked" value={kpis.count} sub={`${kpis.totalCapMt} MtCO₂/yr capacity`} color={T.sage} />
        <KpiCard label="Avg Cost" value={`$${kpis.avgCost}/t`} sub="across filtered projects" color={T.gold} />
        <KpiCard label="2050 CDR Potential" value={`${kpis.totalPot2050} Gt/yr`} sub="all technologies combined" color={T.teal} />
        <KpiCard label="Avg Quality Score" value={kpis.avgQuality} sub="out of 10" color={T.amber} />
        <KpiCard label="Gap to 1.5°C Need" value="~9 Gt/yr" sub="vs current 0.04 Gt deployed" color={T.red} />
      </div>

      {tab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>2050 CDR Potential by Technology (GtCO₂/yr)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...CDR_TECHNOLOGIES].sort((a, b) => b.potential2050 - a.potential2050)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 8, fill: T.textSec }} width={160} tickFormatter={v => v.length > 24 ? v.slice(0, 24) + '…' : v} />
                <Tooltip {...tip} />
                <Bar dataKey="potential2050" radius={[0, 4, 4, 0]}>
                  {[...CDR_TECHNOLOGIES].sort((a, b) => b.potential2050 - a.potential2050).map((e, i) => <Cell key={i} fill={catColor(e.category)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>CDR Market Growth Trajectory (GtCO₂/yr)</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={MARKET_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Legend />
                <Area type="monotone" dataKey="Nature-Based" stroke={T.sage} fill={T.sage} fillOpacity={0.25} stackId="a" />
                <Area type="monotone" dataKey="Hybrid (BECCS)" stroke={T.gold} fill={T.gold} fillOpacity={0.25} stackId="a" />
                <Area type="monotone" dataKey="Geochemical" stroke={T.teal} fill={T.teal} fillOpacity={0.25} stackId="a" />
                <Area type="monotone" dataKey="Engineered CDR" stroke={T.navy} fill={T.navy} fillOpacity={0.25} stackId="a" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Cost vs Permanence by Technology</div>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Cost ($/t)" tick={{ fontSize: 9, fill: T.textSec }} label={{ value: 'Mid Cost ($/tCO₂)', position: 'insideBottom', offset: -4, fill: T.textSec, fontSize: 10 }} />
                <YAxis dataKey="y" name="Permanence (yrs)" tick={{ fontSize: 9, fill: T.textSec }} scale="log" domain={['auto', 'auto']} label={{ value: 'Permanence (yrs)', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 10 }} />
                <Tooltip {...tip} content={({ active, payload }) => active && payload?.length ? (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 11 }}>
                    <div style={{ color: T.text, fontWeight: 600 }}>{payload[0]?.payload?.name}</div>
                    <div style={{ color: T.textSec }}>Cost: ${payload[0]?.payload?.x}/t | Permanence: {payload[0]?.payload?.y?.toLocaleString()} yrs</div>
                  </div>
                ) : null} />
                <Scatter data={CDR_TECHNOLOGIES.map(t => ({ name: t.name.split('(')[0].trim(), x: (t.costLow + t.costHigh) / 2, y: t.permanence }))} fill={T.amber} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>TRL Readiness by Technology</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[...CDR_TECHNOLOGIES].sort((a, b) => b.trl - a.trl)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 9]} tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 8, fill: T.textSec }} width={160} tickFormatter={v => v.length > 24 ? v.slice(0, 24) + '…' : v} />
                <Tooltip {...tip} />
                <Bar dataKey="trl" radius={[0, 4, 4, 0]}>
                  {[...CDR_TECHNOLOGIES].sort((a, b) => b.trl - a.trl).map((e, i) => <Cell key={i} fill={e.trl >= 8 ? T.green : e.trl >= 6 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'CDR Registry' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search project..." style={inpS} />
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={selS}>{categories.map(c => <option key={c}>{c}</option>)}</select>
            <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={selS}>{regions.map(r => <option key={r}>{r}</option>)}</select>
            <select value={standardFilter} onChange={e => setStandardFilter(e.target.value)} style={selS}>{standards.map(s => <option key={s}>{s}</option>)}</select>
            <select value={techFilter} onChange={e => setTechFilter(e.target.value)} style={selS}>
              <option value="All">All Technologies</option>
              {CDR_TECHNOLOGIES.map(t => <option key={t.id} value={t.id}>{t.name.split('(')[0].trim()}</option>)}
            </select>
            <button onClick={() => exportCSV(filteredProjects, 'cdr_registry.csv')} style={{ padding: '6px 14px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, background: T.surface, color: T.text, cursor: 'pointer' }}>Export CSV</button>
            <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono }}>{filteredProjects.length} projects</span>
          </div>
          <div style={{ overflowX: 'auto', ...cS, padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Project', 'Technology', 'Region', 'Country', 'Capacity (kt/yr)', 'CO₂ Removed', 'Cost ($/t)', 'Market Price', 'Standard', 'Quality', 'Status', 'Vintage', 'Buyer'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filteredProjects.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? T.surface : 'transparent' }}>
                    <td style={{ ...tdS, fontWeight: 600, fontSize: 11, color: T.navy }}>{p.name}</td>
                    <td style={{ ...tdS, fontSize: 10 }}><span style={{ color: catColor(p.category) }}>{p.techName}</span></td>
                    <td style={tdS}>{p.region}</td>
                    <td style={{ ...tdS, fontSize: 10 }}>{p.country}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{p.capacityKtY}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{p.co2Removed}kt</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: T.gold }}>${p.costPerTon}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: T.amber }}>${p.price}</td>
                    <td style={{ ...tdS, fontSize: 10, color: T.teal }}>{p.standard}</td>
                    <td style={{ ...tdS, fontWeight: 600, color: p.qualityScore >= 9 ? T.green : T.amber }}>{p.qualityScore}</td>
                    <td style={tdS}><span style={{ color: p.status === 'Operational' ? T.green : p.status === 'Active' ? T.teal : T.amber, fontSize: 11 }}>{p.status}</span></td>
                    <td style={{ ...tdS, fontFamily: T.mono, fontSize: 10 }}>{p.vintage}</td>
                    <td style={{ ...tdS, fontSize: 10 }}>{p.buyerType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Technology Assessment' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {categories.map(c => <button key={c} onClick={() => setCatFilter(c)} style={{ ...tabBtn(c), background: catFilter === c ? T.teal : T.surface, color: catFilter === c ? '#fff' : T.textSec, border: `1px solid ${catFilter === c ? T.teal : T.border}` }}>{c}</button>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 14 }}>
            {filteredTech.map(t => (
              <div key={t.id} style={{ ...cS, borderTop: `3px solid ${catColor(t.category)}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{t.name}</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, color: catColor(t.category), background: catColor(t.category) + '20', padding: '2px 7px', borderRadius: 4 }}>{t.category}</span>
                  <span style={{ fontSize: 10, color: matColor(t.maturity), background: matColor(t.maturity) + '20', padding: '2px 7px', borderRadius: 4 }}>{t.maturity}</span>
                  <span style={{ fontSize: 10, color: T.navy, background: T.navy + '20', padding: '2px 7px', borderRadius: 4 }}>TRL {t.trl}</span>
                  <span style={{ fontSize: 10, color: T.gold, background: T.gold + '20', padding: '2px 7px', borderRadius: 4 }}>+{t.annualGrowth}%/yr</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                  {[['Cost Range', `$${t.costLow}–$${t.costHigh}/t`], ['2030 Potential', `${t.potential2030} Gt`], ['2050 Potential', `${t.potential2050} Gt`], ['Permanence', `${t.permanence.toLocaleString()} yrs`], ['Additionality', t.additionality], ['Energy', t.energyIntensity], ['Water Use', t.water], ['Land Use', t.land], ['Co-benefits', t.cobenefits || 'None']].map(([k, v]) => (
                    <div key={k} style={{ background: T.surfaceH, borderRadius: 6, padding: '6px 8px' }}>
                      <div style={{ fontSize: 9, color: T.textMut }}>{k}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: T.textSec }}>Key players: {t.companies.slice(0, 4).join(' · ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Market Outlook' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Total CDR Market Demand Growth (GtCO₂/yr)</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={MARKET_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Legend />
                <Line type="monotone" dataKey="Total Demand" stroke={T.navy} strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Nature-Based" stroke={T.sage} strokeWidth={2} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="Engineered CDR" stroke={T.teal} strokeWidth={2} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="Hybrid (BECCS)" stroke={T.gold} strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Cost Reduction Trajectory ($/tCO₂)</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={['2024', '2026', '2028', '2030', '2035', '2040', '2050'].map((yr, i) => ({
                year: yr, 'DACCS': Math.max(100, 450 - i * 45 + sr(i) * 20),
                'BECCS': Math.max(60, 150 - i * 12 + sr(i + 7) * 10),
                'Biochar': Math.max(40, 120 - i * 10 + sr(i + 14) * 8),
                'Enh. Weathering': Math.max(30, 130 - i * 14 + sr(i + 21) * 12),
                'Ocean Alk.': Math.max(35, 180 - i * 18 + sr(i + 28) * 15),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Legend />
                {['DACCS', 'BECCS', 'Biochar', 'Enh. Weathering', 'Ocean Alk.'].map((k, i) => (
                  <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Spot Price History by Technology ($/t)</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={PRICE_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="quarter" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Legend />
                {['DACCS', 'BECCS', 'Biochar', 'EW', 'Nature-Based'].map((k, i) => (
                  <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Project Capacity by Category (MtCO₂/yr)</div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryTotals} cx="50%" cy="50%" outerRadius={100} dataKey="cap" nameKey="cat" label={({ cat, cap }) => `${cat}: ${cap}Mt`}>
                  {categoryTotals.map((e, i) => <Cell key={i} fill={catColor(e.cat)} />)}
                </Pie>
                <Tooltip {...tip} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Cost Curves' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Marginal Abatement Cost Curve — CDR ($/tCO₂)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={[...CDR_TECHNOLOGIES].sort((a, b) => (a.costLow + a.costHigh) / 2 - (b.costLow + b.costHigh) / 2)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: T.textSec }} angle={-35} textAnchor="end" height={70} tickFormatter={v => v.split(' ')[0]} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} label={{ value: '$/tCO₂', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 10 }} />
                <Tooltip {...tip} />
                <Bar dataKey="costLow" fill={T.sage} name="Cost Low" stackId="a" />
                <Bar dataKey="costHigh" fill={T.navy} name="Cost High" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Cost vs 2050 Potential Scatter</div>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Mid Cost" tick={{ fontSize: 9, fill: T.textSec }} label={{ value: 'Mid Cost ($/t)', position: 'insideBottom', offset: -4, fill: T.textSec, fontSize: 10 }} />
                <YAxis dataKey="y" name="Potential 2050" tick={{ fontSize: 9, fill: T.textSec }} label={{ value: 'Potential (Gt)', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 10 }} />
                <Tooltip {...tip} content={({ active, payload }) => active && payload?.length ? (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 11 }}>
                    <div style={{ color: T.text, fontWeight: 600 }}>{payload[0]?.payload?.name}</div>
                    <div style={{ color: T.textSec }}>Cost: ${payload[0]?.payload?.x}/t | Potential: {payload[0]?.payload?.y} Gt</div>
                  </div>
                ) : null} />
                <Scatter data={CDR_TECHNOLOGIES.map(t => ({ name: t.name.split(' ')[0], x: (t.costLow + t.costHigh) / 2, y: t.potential2050, category: t.category }))} fill={T.amber} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Quality Standards' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { name: 'Puro.earth', focus: 'Engineered CDR', criteria: ['Quantification protocol', 'Additionality', 'Permanence ≥50yr', 'Leakage assessment', 'MRV protocol', 'Carbon Worker'], strength: 'Best for biochar/DACCS/EW', color: T.navy },
              { name: 'Verra (VCS + CCB)', focus: 'Nature-Based', criteria: ['Third-party verification', 'Buffer pool', 'Co-benefits', 'SD VISta', 'REDD+ compatible', 'AFOLU methodologies'], strength: 'Largest voluntary registry', color: T.sage },
              { name: 'Gold Standard', focus: 'Mixed CDR', criteria: ['SDG impact scoring', 'Impact quantification', 'Third-party audit', 'Registry transparency', 'Social safeguards', 'Contribution claims'], strength: 'SDG alignment leader', color: T.gold },
              { name: 'Plan Vivo', focus: 'Community NbS', criteria: ['Community ownership', 'Co-design', 'MRV light', 'Buffer pool', 'Smallholder focus', 'Long-term covenant'], strength: 'Community & equity focus', color: T.teal },
              { name: 'BeZero Carbon Ratings', focus: 'Credit Rating', criteria: ['Carbon rating A–D', 'Additionality score', 'Permanence score', 'SDG alignment', 'Registry audit', 'Independent research'], strength: 'Independent quality rating', color: T.amber },
              { name: 'ISO 14064-2', focus: 'Engineered', criteria: ['GHG project standard', 'Baseline methodology', 'Leakage calculation', 'Monitoring plan', 'Third-party assurance', 'IPCC compatible'], strength: 'International ISO standard', color: T.red },
            ].map(s => (
              <div key={s.name} style={{ ...cS, borderTop: `3px solid ${s.color}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 10 }}>{s.focus}</div>
                {s.criteria.map((c, i) => <div key={i} style={{ fontSize: 11, color: T.textSec, padding: '3px 0', borderBottom: `1px solid ${T.border}` }}>✓ {c}</div>)}
                <div style={{ fontSize: 11, color: s.color, marginTop: 10, fontStyle: 'italic' }}>{s.strength}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Corporate Buyers' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: T.textSec }}>Sector:</span>
            {buyerSectors.map(s => <button key={s} onClick={() => setBuyerSectorF(s)} style={{ ...tabBtn(s), background: buyerSectorF === s ? T.teal : T.surface, color: buyerSectorF === s ? '#fff' : T.textSec, border: `1px solid ${buyerSectorF === s ? T.teal : T.border}`, fontSize: 11 }}>{s}</button>)}
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <KpiCard label="Buyers Tracked" value={filteredBuyers.length} />
            <KpiCard label="Total Budget" value={`$${filteredBuyers.reduce((s, b) => s + b.budget, 0)}M`} color={T.gold} />
            <KpiCard label="Spent to Date" value={`$${filteredBuyers.reduce((s, b) => s + b.spent, 0)}M`} color={T.sage} />
            <KpiCard label="Credits Purchased" value={`${filteredBuyers.reduce((s, b) => s + b.credits, 0)}kt`} color={T.teal} />
          </div>
          <div style={{ overflowX: 'auto', ...cS, padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Company', 'Sector', 'Target 2030 (Mt)', 'Target 2050', 'Budget ($M)', 'Spent ($M)', 'Credits (kt)', 'Premium Tier', 'Tech Preference', 'Commitment'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {filteredBuyers.map((b, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : 'transparent' }}>
                    <td style={{ ...tdS, fontWeight: 600, color: T.navy }}>{b.company}</td>
                    <td style={tdS}>{b.sector}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{b.target2030}</td>
                    <td style={{ ...tdS, fontSize: 11 }}>{b.target2050}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: T.gold }}>{b.budget}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: T.sage }}>{b.spent}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{b.credits}</td>
                    <td style={tdS}><span style={{ color: b.premium === 'Very High' ? T.red : b.premium === 'High' ? T.amber : T.sage, fontSize: 11 }}>{b.premium}</span></td>
                    <td style={{ ...tdS, fontSize: 10 }}>{b.techPref}</td>
                    <td style={{ ...tdS, fontSize: 10, color: T.textSec }}>{b.commitment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Policy Landscape' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <KpiCard label="Policy Instruments" value={CDR_POLICY.length} sub="tracked globally" />
            <KpiCard label="Active Programmes" value={CDR_POLICY.filter(p => p.status === 'Active').length} color={T.green} />
            <KpiCard label="US 45Q Credit" value="$85/t" sub="DACCS geological storage" color={T.gold} />
            <KpiCard label="EU Innovation Fund" value="€40Bn" sub="2021–2030 total" color={T.navy} />
          </div>
          <div style={{ overflowX: 'auto', ...cS, padding: 0, marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Policy Name', 'Type', 'Region', 'Value', 'Status', 'Enacted', 'Mechanism', 'Administrator'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {CDR_POLICY.map((p, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surface : 'transparent' }}>
                    <td style={{ ...tdS, fontWeight: 600, fontSize: 12 }}>{p.name}</td>
                    <td style={{ ...tdS, color: T.teal, fontSize: 11 }}>{p.type}</td>
                    <td style={tdS}>{p.region}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: T.gold, fontSize: 11 }}>{p.value}</td>
                    <td style={tdS}><span style={{ color: p.status === 'Active' ? T.green : p.status === 'Passed' ? T.teal : T.amber, fontWeight: 600, fontSize: 11 }}>{p.status}</span></td>
                    <td style={{ ...tdS, fontFamily: T.mono, fontSize: 10 }}>{p.enacted}</td>
                    <td style={{ ...tdS, fontSize: 10, color: T.textSec }}>{p.mechanism}</td>
                    <td style={{ ...tdS, fontSize: 10 }}>{p.admin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>Policy Timeline</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[2015, 2017, 2020, 2021, 2022, 2023, 2024, 2025].map(yr => {
                const policies = CDR_POLICY.filter(p => p.enacted === yr);
                return policies.length > 0 ? (
                  <div key={yr} style={{ background: T.surfaceH, borderRadius: 8, padding: '8px 12px', borderLeft: `3px solid ${T.navy}` }}>
                    <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono }}>{yr}</div>
                    {policies.map((p, j) => <div key={j} style={{ fontSize: 11, color: T.text, marginTop: 3 }}>{p.name}</div>)}
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'CDR Integrity' && (
        <div>
          <div style={{ ...cS, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>CDR Integrity Framework</div>
            <div style={{ fontSize: 11, color: T.textSec }}>Scoring dimensions: Additionality · Permanence · Measurability · Co-benefits · Scalability · Cost Competitiveness (1–10 scale)</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Integrity Dimensions — Key Technologies</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={INTEGRITY_DIMENSIONS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis type="category" dataKey="dim" tick={{ fontSize: 9, fill: T.textSec }} width={100} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Bar dataKey="daccs" fill={T.navy} name="DACCS" />
                  <Bar dataKey="afforestation" fill={T.sage} name="Afforestation" />
                  <Bar dataKey="ew" fill={T.teal} name="Enh. Weathering" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>Integrity Scores by Dimension</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {INTEGRITY_DIMENSIONS.map((d, i) => (
                  <div key={i} style={{ padding: '10px 12px', background: T.surfaceH, borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{d.dim}</span>
                      <span style={{ fontSize: 10, color: T.textSec, fontFamily: T.mono }}>DACCS:{d.daccs} | NbS:{d.afforestation}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec }}>{d.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'Price Calculator' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={cS}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>CDR Procurement Price Calculator</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 6 }}>Technology</div>
                <select value={calcTech} onChange={e => setCalcTech(e.target.value)} style={{ ...selS, width: '100%', fontSize: 12 }}>
                  {CDR_TECHNOLOGIES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Volume (ktCO₂): <strong style={{ color: T.text }}>{calcVolume}</strong></div>
                <input type="range" min={1} max={500} value={calcVolume} onChange={e => setCalcVolume(+e.target.value)} style={{ width: '100%', accentColor: T.navy }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Delivery Year: <strong style={{ color: T.text }}>{calcYear}</strong></div>
                <input type="range" min={2024} max={2040} value={calcYear} onChange={e => setCalcYear(+e.target.value)} style={{ width: '100%', accentColor: T.teal }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                {[['Estimated Cost/t', `$${calcPrice.cost}`], ['Total Contract', `$${Number(calcPrice.total).toLocaleString()}`], ['Cost Savings vs Today', `$${calcPrice.savings}/t`], ['Cost Breakeven Year', calcPrice.breakeven]].map(([k, v]) => (
                  <div key={k} style={{ background: T.surfaceH, borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: T.textSec, marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.navy }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Price Forecast: {CDR_TECHNOLOGIES.find(t => t.id === calcTech)?.name.split('(')[0]}</div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={[2024, 2026, 2028, 2030, 2032, 2034, 2036, 2038, 2040].map((yr, i) => {
                const tech = CDR_TECHNOLOGIES.find(t => t.id === calcTech);
                const midCost = tech ? (tech.costLow + tech.costHigh) / 2 : 200;
                return { year: yr, price: Math.max(50, Math.round(midCost * Math.max(0.4, 1 - i * 0.04) + sr(i * 7) * 20)), low: Math.max(40, Math.round(midCost * 0.9 * Math.max(0.4, 1 - i * 0.04))), high: Math.round(midCost * 1.15 * Math.max(0.4, 1 - i * 0.04) + sr(i * 11) * 30) };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} label={{ value: '$/tCO₂', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 10 }} />
                <Tooltip {...tip} />
                <Legend />
                <Line type="monotone" dataKey="high" stroke={T.red} strokeWidth={1} strokeDasharray="3 3" name="High Case" dot={false} />
                <Line type="monotone" dataKey="price" stroke={T.navy} strokeWidth={2} name="Base Case" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="low" stroke={T.sage} strokeWidth={1} strokeDasharray="3 3" name="Low Case" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Portfolio' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Project Pipeline by Technology</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={CDR_TECHNOLOGIES.map(t => ({
                name: t.name.split(' ')[0],
                count: PROJECTS.filter(p => p.technology === t.id).length,
                capacity: +PROJECTS.filter(p => p.technology === t.id).reduce((s, p) => s + p.capacityKtY, 0).toFixed(0),
              })).filter(d => d.count > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-20} textAnchor="end" height={45} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Legend />
                <Bar dataKey="count" fill={T.navy} name="Projects" radius={[4, 4, 0, 0]} />
                <Bar dataKey="capacity" fill={T.teal} name="Capacity (kt/yr)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Quality Score Distribution</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[
                { range: '7.0–7.5', count: PROJECTS.filter(p => p.qualityScore >= 7 && p.qualityScore < 7.5).length },
                { range: '7.5–8.0', count: PROJECTS.filter(p => p.qualityScore >= 7.5 && p.qualityScore < 8).length },
                { range: '8.0–8.5', count: PROJECTS.filter(p => p.qualityScore >= 8 && p.qualityScore < 8.5).length },
                { range: '8.5–9.0', count: PROJECTS.filter(p => p.qualityScore >= 8.5 && p.qualityScore < 9).length },
                { range: '9.0+', count: PROJECTS.filter(p => p.qualityScore >= 9).length },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="range" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Bar dataKey="count" fill={T.sage} radius={[4, 4, 0, 0]} name="Projects" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Project Status by Region</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={['North America', 'Europe', 'Asia', 'Africa', 'Latin America', 'Oceania'].map(r => ({
                region: r,
                operational: PROJECTS.filter(p => p.region === r && p.status === 'Operational').length,
                active: PROJECTS.filter(p => p.region === r && p.status === 'Active').length,
                pipeline: PROJECTS.filter(p => p.region === r && (p.status === 'Pipeline' || p.status === 'Development')).length,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="region" tick={{ fontSize: 8, fill: T.textSec }} angle={-15} textAnchor="end" height={45} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Legend />
                <Bar dataKey="operational" fill={T.green} stackId="a" name="Operational" />
                <Bar dataKey="active" fill={T.teal} stackId="a" name="Active" />
                <Bar dataKey="pipeline" fill={T.amber} stackId="a" name="Pipeline" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Additionality Rating Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={['Very High', 'High', 'Medium'].map(a => ({
                  name: a,
                  value: PROJECTS.filter(p => p.additionality === a).length,
                })).filter(d => d.value > 0)} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                  {['Very High', 'High', 'Medium'].map((_, i) => <Cell key={i} fill={[T.green, T.teal, T.amber][i]} />)}
                </Pie>
                <Tooltip {...tip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
