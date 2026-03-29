import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  PieChart, Pie, ScatterChart, Scatter, ZAxis, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ═══════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════ */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const PIE_COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#0284c7','#7c3aed','#0d9488','#d97706','#dc2626','#2563eb','#ec4899','#f59e0b','#4b5563','#6b7280','#16a34a','#9333ea'];

const STAGES = ['Screening','Due Diligence','Term Sheet','IC Approval','Closing','Portfolio','Exit'];
const STAGE_COLORS = { Screening:'#0284c7', 'Due Diligence':'#d97706', 'Term Sheet':'#7c3aed', 'IC Approval':'#c5a96a', Closing:'#5a8a6a', Portfolio:'#1b3a5c', Exit:'#16a34a' };

/* ═══════════════════════════════════════════════════════════════
   DEAL PIPELINE DATA — 20 Deals
   ═══════════════════════════════════════════════════════════════ */
const DEAL_PIPELINE_INIT = [
  { id:'PE001', company:'GreenTech Solar', sector:'Renewable Energy', stage:'Due Diligence', vintage:2024, geography:'India', fund:'Climate Fund I', dealSize_mn:45, equity_mn:25, evMultiple:8.5, irrTarget:22, esgScore:72, carbonIntensity:35, employees:280, revenue_mn:18, ebitda_mn:4.2, status:'Active', sdgs:[7,9,13], impactMetrics:{ jobs_created:150, mwh_clean_energy:45000, co2_avoided_t:28000, women_employed_pct:38 } },
  { id:'PE002', company:'MedLife Diagnostics', sector:'Healthcare', stage:'Term Sheet', vintage:2024, geography:'India', fund:'Growth Fund II', dealSize_mn:120, equity_mn:80, evMultiple:12.0, irrTarget:18, esgScore:65, carbonIntensity:12, employees:1500, revenue_mn:85, ebitda_mn:15, status:'Active', sdgs:[3,8], impactMetrics:{ patients_served:500000, rural_clinics:45, female_employees_pct:62, training_hours:12000 } },
  { id:'PE003', company:'CircularPack', sector:'Circular Economy', stage:'Screening', vintage:2025, geography:'Germany', fund:'Impact Fund III', dealSize_mn:30, equity_mn:20, evMultiple:6.0, irrTarget:25, esgScore:78, carbonIntensity:85, employees:120, revenue_mn:12, ebitda_mn:2.5, status:'Active', sdgs:[12,13,14], impactMetrics:{ plastic_diverted_t:5000, recycling_rate_pct:85, packaging_replaced_mn_units:15, suppliers_audited:42 } },
  { id:'PE004', company:'PayBridge FinTech', sector:'FinTech', stage:'IC Approval', vintage:2024, geography:'Singapore', fund:'Growth Fund II', dealSize_mn:95, equity_mn:60, evMultiple:15.0, irrTarget:28, esgScore:58, carbonIntensity:5, employees:320, revenue_mn:40, ebitda_mn:8, status:'Active', sdgs:[1,8,10], impactMetrics:{ unbanked_served:200000, sme_loans_disbursed:3500, digital_literacy_trained:8000, fraud_prevented_mn:12 } },
  { id:'PE005', company:'LearnLoop EdTech', sector:'EdTech', stage:'Due Diligence', vintage:2025, geography:'India', fund:'Impact Fund III', dealSize_mn:25, equity_mn:18, evMultiple:10.0, irrTarget:30, esgScore:82, carbonIntensity:3, employees:180, revenue_mn:9, ebitda_mn:1.8, status:'Active', sdgs:[4,5,10], impactMetrics:{ students_reached:750000, rural_students_pct:45, female_students_pct:52, teachers_trained:4200 } },
  { id:'PE006', company:'AgroSense', sector:'AgriTech', stage:'Portfolio', vintage:2023, geography:'Brazil', fund:'Climate Fund I', dealSize_mn:35, equity_mn:22, evMultiple:7.0, irrTarget:20, esgScore:70, carbonIntensity:45, employees:95, revenue_mn:14, ebitda_mn:3.2, status:'Active', sdgs:[2,13,15], impactMetrics:{ farmers_reached:25000, yield_improvement_pct:18, water_saved_mn_liters:850, soil_health_improved_ha:12000 } },
  { id:'PE007', company:'HydroGen Systems', sector:'CleanTech', stage:'Closing', vintage:2024, geography:'US', fund:'Climate Fund I', dealSize_mn:200, equity_mn:120, evMultiple:18.0, irrTarget:15, esgScore:85, carbonIntensity:8, employees:450, revenue_mn:55, ebitda_mn:11, status:'Active', sdgs:[7,9,13], impactMetrics:{ h2_produced_t:5000, co2_avoided_t:62000, patents_filed:28, green_jobs_created:320 } },
  { id:'PE008', company:'GenomicaRx', sector:'BioTech', stage:'Screening', vintage:2025, geography:'UK', fund:'Growth Fund II', dealSize_mn:150, equity_mn:100, evMultiple:25.0, irrTarget:35, esgScore:60, carbonIntensity:15, employees:280, revenue_mn:22, ebitda_mn:0, status:'Active', sdgs:[3,9], impactMetrics:{ clinical_trials:8, rare_diseases_addressed:5, affordable_therapy_access_pct:30, phd_researchers:65 } },
  { id:'PE009', company:'FleetZero Logistics', sector:'Logistics', stage:'Due Diligence', vintage:2024, geography:'US', fund:'Climate Fund I', dealSize_mn:80, equity_mn:50, evMultiple:9.0, irrTarget:20, esgScore:68, carbonIntensity:120, employees:600, revenue_mn:65, ebitda_mn:10, status:'Active', sdgs:[9,11,13], impactMetrics:{ ev_trucks_deployed:150, diesel_replaced_mn_liters:8, route_optimization_pct:25, driver_safety_incidents_reduction:40 } },
  { id:'PE010', company:'AquaPure Solutions', sector:'Water', stage:'Term Sheet', vintage:2024, geography:'Kenya', fund:'Impact Fund III', dealSize_mn:20, equity_mn:14, evMultiple:5.5, irrTarget:18, esgScore:88, carbonIntensity:10, employees:85, revenue_mn:6, ebitda_mn:1.5, status:'Active', sdgs:[6,3,11], impactMetrics:{ people_served_clean_water:350000, communities_connected:120, water_purified_mn_liters:2500, cholera_cases_reduced_pct:70 } },
  { id:'PE011', company:'VoltDrive EV', sector:'EV', stage:'Portfolio', vintage:2023, geography:'India', fund:'Climate Fund I', dealSize_mn:110, equity_mn:70, evMultiple:14.0, irrTarget:24, esgScore:76, carbonIntensity:22, employees:800, revenue_mn:95, ebitda_mn:12, status:'Active', sdgs:[7,9,11,13], impactMetrics:{ evs_sold:8500, co2_avoided_t:18000, charging_stations_installed:250, km_electric_mn:120 } },
  { id:'PE012', company:'Empower Social', sector:'Social Enterprise', stage:'IC Approval', vintage:2024, geography:'India', fund:'Impact Fund III', dealSize_mn:15, equity_mn:10, evMultiple:4.0, irrTarget:12, esgScore:92, carbonIntensity:8, employees:220, revenue_mn:5, ebitda_mn:0.8, status:'Active', sdgs:[1,5,8,10], impactMetrics:{ women_entrepreneurs_supported:12000, microloans_disbursed:45000, livelihoods_created:8500, financial_literacy_trained:25000 } },
  { id:'PE013', company:'CloudMatrix SaaS', sector:'SaaS', stage:'Exit', vintage:2021, geography:'US', fund:'Growth Fund I', dealSize_mn:60, equity_mn:35, evMultiple:20.0, irrTarget:30, esgScore:55, carbonIntensity:4, employees:250, revenue_mn:38, ebitda_mn:9, status:'Exited', sdgs:[8,9], impactMetrics:{ enterprise_clients:180, data_centers_renewable_pct:65, employee_satisfaction_pct:82, uptime_pct:99.95 } },
  { id:'PE014', company:'NanoCell BioTech', sector:'BioTech', stage:'Screening', vintage:2025, geography:'Japan', fund:'Growth Fund II', dealSize_mn:180, equity_mn:110, evMultiple:30.0, irrTarget:38, esgScore:63, carbonIntensity:18, employees:340, revenue_mn:28, ebitda_mn:-2, status:'Active', sdgs:[3,9], impactMetrics:{ pipeline_drugs:12, orphan_drug_designations:3, global_partnerships:7, lab_energy_efficiency_pct:45 } },
  { id:'PE015', company:'TerraBuild Green', sector:'CleanTech', stage:'Due Diligence', vintage:2025, geography:'Australia', fund:'Climate Fund I', dealSize_mn:55, equity_mn:35, evMultiple:8.0, irrTarget:19, esgScore:80, carbonIntensity:65, employees:190, revenue_mn:22, ebitda_mn:4, status:'Active', sdgs:[9,11,12,13], impactMetrics:{ green_buildings_certified:35, embodied_carbon_reduced_pct:40, recycled_materials_pct:60, construction_waste_diverted_t:2800 } },
  { id:'PE016', company:'SafeHarvest Agri', sector:'AgriTech', stage:'Portfolio', vintage:2022, geography:'France', fund:'Impact Fund III', dealSize_mn:40, equity_mn:28, evMultiple:7.5, irrTarget:16, esgScore:74, carbonIntensity:50, employees:160, revenue_mn:20, ebitda_mn:4.5, status:'Active', sdgs:[2,12,15], impactMetrics:{ organic_farms_supported:800, pesticide_reduction_pct:55, food_waste_prevented_t:3200, biodiversity_corridors_ha:450 } },
  { id:'PE017', company:'EduBridge Global', sector:'EdTech', stage:'Term Sheet', vintage:2024, geography:'UK', fund:'Growth Fund II', dealSize_mn:70, equity_mn:45, evMultiple:11.0, irrTarget:22, esgScore:71, carbonIntensity:4, employees:400, revenue_mn:32, ebitda_mn:5.5, status:'Active', sdgs:[4,8,10], impactMetrics:{ learners_enrolled:1200000, countries_active:28, completion_rate_pct:78, career_placement_pct:65 } },
  { id:'PE018', company:'GridFlex Energy', sector:'Renewable Energy', stage:'Closing', vintage:2024, geography:'Germany', fund:'Climate Fund I', dealSize_mn:160, equity_mn:95, evMultiple:10.0, irrTarget:17, esgScore:83, carbonIntensity:12, employees:520, revenue_mn:72, ebitda_mn:16, status:'Active', sdgs:[7,9,13], impactMetrics:{ mwh_stored:125000, grid_stability_events_prevented:45, renewable_integration_pct:92, co2_avoided_t:85000 } },
  { id:'PE019', company:'UrbanMobility', sector:'EV', stage:'Exit', vintage:2020, geography:'Singapore', fund:'Growth Fund I', dealSize_mn:50, equity_mn:30, evMultiple:12.0, irrTarget:25, esgScore:69, carbonIntensity:18, employees:350, revenue_mn:42, ebitda_mn:7.5, status:'Exited', sdgs:[9,11,13], impactMetrics:{ rides_completed_mn:45, co2_avoided_t:9500, cities_active:12, driver_livelihoods:6000 } },
  { id:'PE020', company:'FinInclusion Corp', sector:'FinTech', stage:'Portfolio', vintage:2023, geography:'Brazil', fund:'Impact Fund III', dealSize_mn:65, equity_mn:42, evMultiple:9.5, irrTarget:21, esgScore:77, carbonIntensity:6, employees:280, revenue_mn:35, ebitda_mn:7, status:'Active', sdgs:[1,8,10], impactMetrics:{ unbanked_served:680000, credit_scores_created:420000, savings_accounts_opened:310000, insurance_policies_issued:85000 } },
];

/* ═══════════════════════════════════════════════════════════════
   ESG DD CHECKLIST
   ═══════════════════════════════════════════════════════════════ */
const PE_DD_CHECKLIST = {
  environmental: [
    'Carbon footprint baseline (Scope 1+2)', 'Scope 3 materiality assessment',
    'Climate transition plan / net zero pathway', 'Environmental compliance & permits',
    'Pollution & waste management', 'Water usage & efficiency',
    'Biodiversity impact assessment', 'Circular economy integration',
    'Energy efficiency measures', 'Environmental litigation history',
  ],
  social: [
    'Employee health & safety record', 'Diversity, equity & inclusion metrics',
    'Living wage compliance', 'Supply chain labor standards',
    'Community impact assessment', 'Customer data privacy & protection',
    'Product safety record', 'Human rights due diligence',
    'Employee turnover & satisfaction', 'Stakeholder engagement process',
  ],
  governance: [
    'Board composition & independence', 'ESG governance structure',
    'Anti-corruption & bribery policies', 'Tax transparency & compliance',
    'Executive compensation alignment with ESG', 'Whistleblower protection mechanism',
    'Cybersecurity framework', 'IP protection & ethical AI use',
    'Regulatory compliance track record', 'Shareholder rights & minority protection',
  ],
};
const ALL_DD_ITEMS = [...PE_DD_CHECKLIST.environmental, ...PE_DD_CHECKLIST.social, ...PE_DD_CHECKLIST.governance];

const LS_KEY = 'ra_pe_dd_v1';
const LS_DEALS_KEY = 'ra_pe_deals_v1';

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
const fmt = (n, d=1) => n == null ? '-' : Number(n).toFixed(d);
const fmtI = n => n == null ? '-' : Math.round(n).toLocaleString();
const fmtM = n => n == null ? '-' : `$${Number(n).toFixed(1)}M`;
const pct = n => n == null ? '-' : `${Number(n).toFixed(1)}%`;
const badge = (label, color, bg) => ({ display:'inline-block', padding:'2px 8px', borderRadius:9999, fontSize:11, fontWeight:600, color, background:bg, marginRight:4, marginBottom:2 });

function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => { const v = r[k]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? ''; }).join(','))].join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}

const SDG_NAMES = { 1:'No Poverty',2:'Zero Hunger',3:'Good Health',4:'Quality Education',5:'Gender Equality',6:'Clean Water',7:'Affordable Energy',8:'Decent Work',9:'Industry & Innovation',10:'Reduced Inequalities',11:'Sustainable Cities',12:'Responsible Consumption',13:'Climate Action',14:'Life Below Water',15:'Life on Land',16:'Peace & Justice',17:'Partnerships' };
const SDG_COLORS = { 1:'#e5243b',2:'#DDA63A',3:'#4C9F38',4:'#C5192D',5:'#FF3A21',6:'#26BDE2',7:'#FCC30B',8:'#A21942',9:'#FD6925',10:'#DD1367',11:'#FD9D24',12:'#BF8B2E',13:'#3F7E44',14:'#0A97D9',15:'#56C02B',16:'#00689D',17:'#19486A' };

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function PeVcEsgPage() {
  const nav = useNavigate();

  /* — Deal state with localStorage persistence — */
  const [deals, setDeals] = useState(() => {
    try { const s = localStorage.getItem(LS_DEALS_KEY); if (s) return JSON.parse(s); } catch {}
    return DEAL_PIPELINE_INIT;
  });
  useEffect(() => { try { localStorage.setItem(LS_DEALS_KEY, JSON.stringify(deals)); } catch {} }, [deals]);

  /* — DD Checklist state — */
  const [ddState, setDdState] = useState(() => {
    try { const s = localStorage.getItem(LS_KEY); if (s) return JSON.parse(s); } catch {}
    return {};
  });
  useEffect(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(ddState)); } catch {} }, [ddState]);

  const updateDD = useCallback((dealId, itemIdx, field, value) => {
    setDdState(prev => {
      const key = `${dealId}_${itemIdx}`;
      return { ...prev, [key]: { ...(prev[key] || {}), [field]: value } };
    });
  }, []);

  /* — UI State — */
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [activeTab, setActiveTab] = useState('kanban');
  const [compareIds, setCompareIds] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editDealId, setEditDealId] = useState(null);
  const [sortCol, setSortCol] = useState('esgScore');
  const [sortDir, setSortDir] = useState('desc');

  /* — Add Deal Form State — */
  const emptyForm = { company:'', sector:'Renewable Energy', stage:'Screening', vintage:2025, geography:'India', fund:'Climate Fund I', dealSize_mn:'', equity_mn:'', evMultiple:'', irrTarget:'', esgScore:'', carbonIntensity:'', employees:'', revenue_mn:'', ebitda_mn:'', sdgs:[], impactDesc:'' };
  const [formData, setFormData] = useState(emptyForm);
  const SECTORS = [...new Set(DEAL_PIPELINE_INIT.map(d => d.sector))].sort();
  const GEOS = [...new Set(DEAL_PIPELINE_INIT.map(d => d.geography))].sort();
  const FUNDS = [...new Set(DEAL_PIPELINE_INIT.map(d => d.fund))].sort();

  /* — KPIs — */
  const kpis = useMemo(() => {
    const active = deals.filter(d => d.status === 'Active');
    const totalVal = deals.reduce((s, d) => s + d.dealSize_mn, 0);
    const avgESG = active.length ? active.reduce((s, d) => s + d.esgScore, 0) / active.length : 0;
    const avgIRR = active.length ? active.reduce((s, d) => s + d.irrTarget, 0) / active.length : 0;
    const inDD = deals.filter(d => d.stage === 'Due Diligence').length;
    const icPipe = deals.filter(d => d.stage === 'IC Approval').length;
    const portfolio = deals.filter(d => d.stage === 'Portfolio').length;
    const wESG = totalVal > 0 ? deals.reduce((s, d) => s + d.esgScore * d.dealSize_mn, 0) / totalVal : 0;
    const totalCO2 = deals.reduce((s, d) => s + (d.impactMetrics.co2_avoided_t || 0), 0);
    const totalJobs = deals.reduce((s, d) => s + (d.impactMetrics.jobs_created || d.impactMetrics.green_jobs_created || d.impactMetrics.livelihoods_created || 0), 0);
    const allSDGs = new Set(deals.flatMap(d => d.sdgs));
    const ddItems = deals.length * 30;
    const ddDone = Object.values(ddState).filter(v => v.status === 'Complete').length;
    return { active: active.length, totalVal, avgESG, avgIRR, inDD, icPipe, portfolio, wESG, totalCO2, totalJobs, sdgCount: allSDGs.size, ddPct: ddItems ? (ddDone / ddItems * 100) : 0 };
  }, [deals, ddState]);

  /* — Sort deals for table — */
  const sortedDeals = useMemo(() => {
    return [...deals].sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? (va - vb) : (vb - va);
    });
  }, [deals, sortCol, sortDir]);

  /* — Chart data — */
  const sectorByCount = useMemo(() => {
    const m = {};
    deals.forEach(d => { m[d.sector] = (m[d.sector] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [deals]);

  const sectorByValue = useMemo(() => {
    const m = {};
    deals.forEach(d => { m[d.sector] = (m[d.sector] || 0) + d.dealSize_mn; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [deals]);

  const geoData = useMemo(() => {
    const m = {};
    deals.forEach(d => { m[d.geography] = (m[d.geography] || 0) + 1; });
    return Object.entries(m).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [deals]);

  const vintageData = useMemo(() => {
    const m = {};
    deals.forEach(d => { m[d.vintage] = (m[d.vintage] || 0) + 1; });
    return Object.entries(m).sort().map(([name, count]) => ({ name, count }));
  }, [deals]);

  const esgDistribution = useMemo(() => {
    const bins = [{ range:'<50', min:0, max:50 }, { range:'50-60', min:50, max:60 }, { range:'60-70', min:60, max:70 }, { range:'70-80', min:70, max:80 }, { range:'80-90', min:80, max:90 }, { range:'90+', min:90, max:101 }];
    return bins.map(b => ({ name: b.range, count: deals.filter(d => d.esgScore >= b.min && d.esgScore < b.max).length }));
  }, [deals]);

  const scatterData = useMemo(() => deals.map(d => ({ name: d.company, esg: d.esgScore, irr: d.irrTarget, size: d.dealSize_mn })), [deals]);

  /* — Deal CRUD — */
  const addDeal = () => {
    const newDeal = {
      id: `PE${String(deals.length + 1).padStart(3,'0')}`,
      company: formData.company,
      sector: formData.sector,
      stage: formData.stage,
      vintage: Number(formData.vintage),
      geography: formData.geography,
      fund: formData.fund,
      dealSize_mn: Number(formData.dealSize_mn) || 0,
      equity_mn: Number(formData.equity_mn) || 0,
      evMultiple: Number(formData.evMultiple) || 0,
      irrTarget: Number(formData.irrTarget) || 0,
      esgScore: Number(formData.esgScore) || 50,
      carbonIntensity: Number(formData.carbonIntensity) || 0,
      employees: Number(formData.employees) || 0,
      revenue_mn: Number(formData.revenue_mn) || 0,
      ebitda_mn: Number(formData.ebitda_mn) || 0,
      status: 'Active',
      sdgs: formData.sdgs,
      impactMetrics: {},
    };
    if (!newDeal.company) return;
    setDeals(prev => [...prev, newDeal]);
    setFormData(emptyForm);
    setShowAddForm(false);
  };

  const deleteDeal = (id) => {
    if (!window.confirm(`Delete deal ${id}?`)) return;
    setDeals(prev => prev.filter(d => d.id !== id));
    if (selectedDeal?.id === id) setSelectedDeal(null);
  };

  const moveDealStage = (dealId, newStage) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d));
  };

  const toggleCompare = (id) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  /* — DD heatmap data — */
  const ddHeatmap = useMemo(() => {
    return deals.map(d => {
      const dims = { E:0, S:0, G:0 };
      const totals = { E: PE_DD_CHECKLIST.environmental.length, S: PE_DD_CHECKLIST.social.length, G: PE_DD_CHECKLIST.governance.length };
      ALL_DD_ITEMS.forEach((item, idx) => {
        const st = ddState[`${d.id}_${idx}`];
        const dim = idx < 10 ? 'E' : idx < 20 ? 'S' : 'G';
        if (st?.status === 'Complete') dims[dim]++;
      });
      return { id: d.id, company: d.company, E: Math.round(dims.E / totals.E * 100), S: Math.round(dims.S / totals.S * 100), G: Math.round(dims.G / totals.G * 100) };
    });
  }, [deals, ddState]);

  /* — Impact aggregation — */
  const impactAgg = useMemo(() => {
    const agg = {};
    deals.forEach(d => {
      Object.entries(d.impactMetrics).forEach(([k, v]) => {
        agg[k] = (agg[k] || 0) + v;
      });
    });
    return agg;
  }, [deals]);

  /* — Export functions — */
  const exportPipeline = () => {
    downloadCSV('pe_vc_pipeline.csv', deals.map(d => ({
      ID: d.id, Company: d.company, Sector: d.sector, Stage: d.stage, Vintage: d.vintage,
      Geography: d.geography, Fund: d.fund, 'Deal Size ($M)': d.dealSize_mn, 'Equity ($M)': d.equity_mn,
      'EV Multiple': d.evMultiple, 'IRR Target %': d.irrTarget, 'ESG Score': d.esgScore,
      'Carbon Intensity': d.carbonIntensity, Employees: d.employees, 'Revenue ($M)': d.revenue_mn,
      'EBITDA ($M)': d.ebitda_mn, Status: d.status, SDGs: d.sdgs.join(';'),
    })));
  };

  const exportDD = () => {
    const rows = [];
    deals.forEach(d => {
      ALL_DD_ITEMS.forEach((item, idx) => {
        const st = ddState[`${d.id}_${idx}`] || {};
        rows.push({ Deal: d.company, Category: idx < 10 ? 'Environmental' : idx < 20 ? 'Social' : 'Governance', Item: item, Status: st.status || 'Not Started', Owner: st.owner || '', Evidence: st.evidence || '', DueDate: st.dueDate || '' });
      });
    });
    downloadCSV('pe_dd_status.csv', rows);
  };

  const exportImpact = () => {
    const rows = deals.map(d => {
      const base = { Company: d.company, Sector: d.sector, 'ESG Score': d.esgScore };
      Object.entries(d.impactMetrics).forEach(([k, v]) => { base[k] = v; });
      return base;
    });
    downloadCSV('pe_impact_report.csv', rows);
  };

  /* ═══════════════ STYLES ═══════════════ */
  const s = {
    page: { fontFamily: T.font, background: T.bg, minHeight:'100vh', padding:24, color: T.text },
    card: { background: T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, marginBottom:16 },
    kpi: { background: T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, textAlign:'center', flex:'1 1 140px', minWidth:140 },
    kpiVal: { fontSize:22, fontWeight:700, color: T.navy },
    kpiLbl: { fontSize:11, color: T.textMut, marginTop:2, textTransform:'uppercase', letterSpacing:0.5 },
    btn: { padding:'7px 16px', borderRadius:6, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, background: T.navy, color:'#fff' },
    btnGold: { padding:'7px 16px', borderRadius:6, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, background: T.gold, color:'#fff' },
    btnOutline: { padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, cursor:'pointer', fontSize:12, fontWeight:600, background:'transparent', color: T.text },
    tab: (active) => ({ padding:'8px 18px', borderRadius:6, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background: active ? T.navy : 'transparent', color: active ? '#fff' : T.textSec, marginRight:4 }),
    th: { padding:'8px 10px', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5, color: T.textMut, borderBottom:`2px solid ${T.border}`, cursor:'pointer', userSelect:'none', textAlign:'left' },
    td: { padding:'8px 10px', fontSize:12, borderBottom:`1px solid ${T.border}`, verticalAlign:'top' },
    input: { padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily: T.font, width:'100%', boxSizing:'border-box' },
    select: { padding:'6px 10px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily: T.font, background:'#fff' },
    esgBadge: (score) => {
      const c = score >= 80 ? T.green : score >= 60 ? T.gold : T.red;
      return { display:'inline-block', padding:'2px 8px', borderRadius:9999, fontSize:11, fontWeight:700, color:'#fff', background: c };
    },
  };

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, color:T.navy, margin:0 }}>PE/VC ESG Due Diligence Pipeline</h1>
          <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
            <span style={badge('20 Deals', T.navy, T.surfaceH)}>20 Deals</span>
            <span style={badge('7 Stages', '#7c3aed', '#f3f0ff')}>7 Stages</span>
            <span style={badge('30 DD Items', T.gold, '#fdf6e3')}>30 DD Items</span>
            <span style={badge('Impact Metrics', T.sage, '#f0fdf4')}>Impact Metrics</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <button style={s.btn} onClick={exportPipeline}>Export Pipeline CSV</button>
          <button style={s.btnGold} onClick={exportDD}>Export DD Status CSV</button>
          <button style={{...s.btn, background:T.sage}} onClick={exportImpact}>Export Impact CSV</button>
          <button style={s.btnOutline} onClick={() => nav('/portfolio-suite')}>Portfolio Suite</button>
          <button style={s.btnOutline} onClick={() => nav('/fixed-income-esg')}>FI ESG</button>
          <button style={s.btnOutline} onClick={() => nav('/risk-attribution')}>Risk Attribution</button>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ display:'flex', gap:2, marginBottom:20, flexWrap:'wrap' }}>
        {['kanban','table','dd','heatmap','compare','impact','charts','addDeal'].map(t => (
          <button key={t} style={s.tab(activeTab === t)} onClick={() => setActiveTab(t)}>
            {{ kanban:'Pipeline Kanban', table:'Deal Table', dd:'DD Checklist', heatmap:'DD Heatmap', compare:'Compare', impact:'Impact', charts:'Analytics', addDeal:'+ Add Deal' }[t]}
          </button>
        ))}
      </div>

      {/* KPI ROW */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
        {[
          { label:'Active Deals', val:kpis.active },
          { label:'Total Deal Value', val:fmtM(kpis.totalVal) },
          { label:'Avg ESG Score', val:fmt(kpis.avgESG, 0) },
          { label:'Avg IRR Target', val:`${fmt(kpis.avgIRR, 1)}%` },
          { label:'Deals in DD', val:kpis.inDD },
          { label:'IC Pipeline', val:kpis.icPipe },
          { label:'Portfolio Cos', val:kpis.portfolio },
          { label:'Wtd ESG Score', val:fmt(kpis.wESG, 1) },
          { label:'CO2 Avoided (t)', val:fmtI(kpis.totalCO2) },
          { label:'Jobs Created', val:fmtI(kpis.totalJobs) },
          { label:'SDG Coverage', val:`${kpis.sdgCount}/17` },
          { label:'DD Completion', val:pct(kpis.ddPct) },
        ].map((k, i) => (
          <div key={i} style={s.kpi}>
            <div style={s.kpiVal}>{k.val}</div>
            <div style={s.kpiLbl}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ═══════════════ KANBAN ═══════════════ */}
      {activeTab === 'kanban' && (
        <div style={s.card}>
          <h3 style={{ margin:'0 0 16px', fontSize:16, fontWeight:700, color:T.navy }}>Pipeline Kanban View</h3>
          <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:8 }}>
            {STAGES.map(stage => {
              const stageDeals = deals.filter(d => d.stage === stage);
              return (
                <div key={stage} style={{ minWidth:200, flex:'1 0 200px', background:T.surfaceH, borderRadius:8, padding:10 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:STAGE_COLORS[stage], marginBottom:8, display:'flex', justifyContent:'space-between' }}>
                    <span>{stage}</span>
                    <span style={{ background:STAGE_COLORS[stage], color:'#fff', borderRadius:9999, padding:'1px 8px', fontSize:10 }}>{stageDeals.length}</span>
                  </div>
                  {stageDeals.length === 0 && <div style={{ fontSize:11, color:T.textMut, fontStyle:'italic', padding:8 }}>No deals</div>}
                  {stageDeals.map(d => (
                    <div key={d.id} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:10, marginBottom:8, cursor:'pointer', borderLeft:`3px solid ${STAGE_COLORS[stage]}` }}
                      onClick={() => { setSelectedDeal(d); setActiveTab('table'); }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{d.company}</div>
                      <div style={{ fontSize:11, color:T.textSec }}>{d.sector} | {d.geography}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, alignItems:'center' }}>
                        <span style={{ fontSize:11, color:T.textMut }}>{fmtM(d.dealSize_mn)}</span>
                        <span style={s.esgBadge(d.esgScore)}>{d.esgScore}</span>
                      </div>
                      {/* Move stage buttons */}
                      <div style={{ display:'flex', gap:2, marginTop:6, flexWrap:'wrap' }}>
                        {STAGES.filter(st => st !== stage).slice(0, 3).map(st => (
                          <button key={st} style={{ fontSize:9, padding:'2px 5px', borderRadius:4, border:`1px solid ${T.borderL}`, background:'transparent', color:T.textSec, cursor:'pointer' }}
                            onClick={(e) => { e.stopPropagation(); moveDealStage(d.id, st); }}>{st.slice(0, 8)}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════ DEAL TABLE ═══════════════ */}
      {activeTab === 'table' && (
        <div style={s.card}>
          <h3 style={{ margin:'0 0 12px', fontSize:16, fontWeight:700, color:T.navy }}>Deal Pipeline — Sortable Table</h3>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {[
                    { key:'id', label:'ID' }, { key:'company', label:'Company' }, { key:'sector', label:'Sector' },
                    { key:'stage', label:'Stage' }, { key:'geography', label:'Geo' }, { key:'fund', label:'Fund' },
                    { key:'dealSize_mn', label:'Deal ($M)' }, { key:'equity_mn', label:'Equity ($M)' },
                    { key:'evMultiple', label:'EV/EBITDA' }, { key:'irrTarget', label:'IRR %' },
                    { key:'esgScore', label:'ESG' }, { key:'carbonIntensity', label:'Carbon Int.' },
                    { key:'employees', label:'Empl.' }, { key:'revenue_mn', label:'Rev ($M)' },
                  ].map(c => (
                    <th key={c.key} style={s.th} onClick={() => { setSortCol(c.key); setSortDir(prev => sortCol === c.key ? (prev === 'asc' ? 'desc' : 'asc') : 'desc'); }}>
                      {c.label} {sortCol === c.key ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
                    </th>
                  ))}
                  <th style={s.th}>Compare</th>
                  <th style={s.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedDeals.map(d => (
                  <tr key={d.id} style={{ background: selectedDeal?.id === d.id ? T.surfaceH : 'transparent', cursor:'pointer' }}
                    onClick={() => setSelectedDeal(d)}>
                    <td style={s.td}>{d.id}</td>
                    <td style={{...s.td, fontWeight:600}}>{d.company}</td>
                    <td style={s.td}>{d.sector}</td>
                    <td style={s.td}><span style={{ ...badge(d.stage, '#fff', STAGE_COLORS[d.stage]) }}>{d.stage}</span></td>
                    <td style={s.td}>{d.geography}</td>
                    <td style={s.td}>{d.fund}</td>
                    <td style={{...s.td, textAlign:'right'}}>{fmt(d.dealSize_mn, 0)}</td>
                    <td style={{...s.td, textAlign:'right'}}>{fmt(d.equity_mn, 0)}</td>
                    <td style={{...s.td, textAlign:'right'}}>{fmt(d.evMultiple, 1)}x</td>
                    <td style={{...s.td, textAlign:'right'}}>{d.irrTarget}%</td>
                    <td style={s.td}><span style={s.esgBadge(d.esgScore)}>{d.esgScore}</span></td>
                    <td style={{...s.td, textAlign:'right'}}>{d.carbonIntensity}</td>
                    <td style={{...s.td, textAlign:'right'}}>{fmtI(d.employees)}</td>
                    <td style={{...s.td, textAlign:'right'}}>{fmt(d.revenue_mn, 0)}</td>
                    <td style={s.td}><input type="checkbox" checked={compareIds.includes(d.id)} onChange={() => toggleCompare(d.id)} onClick={e => e.stopPropagation()} /></td>
                    <td style={s.td}>
                      <button style={{ fontSize:10, padding:'2px 6px', borderRadius:4, border:`1px solid ${T.red}`, background:'transparent', color:T.red, cursor:'pointer' }}
                        onClick={(e) => { e.stopPropagation(); deleteDeal(d.id); }}>Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* DEAL DETAIL PANEL */}
          {selectedDeal && (
            <div style={{ marginTop:20, padding:20, background:T.surfaceH, borderRadius:10, border:`1px solid ${T.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <h4 style={{ margin:0, fontSize:18, fontWeight:700, color:T.navy }}>{selectedDeal.company} — {selectedDeal.id}</h4>
                <button style={s.btnOutline} onClick={() => setSelectedDeal(null)}>Close</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12 }}>
                {[
                  ['Sector', selectedDeal.sector], ['Stage', selectedDeal.stage], ['Vintage', selectedDeal.vintage],
                  ['Geography', selectedDeal.geography], ['Fund', selectedDeal.fund], ['Deal Size', fmtM(selectedDeal.dealSize_mn)],
                  ['Equity', fmtM(selectedDeal.equity_mn)], ['EV/EBITDA', `${selectedDeal.evMultiple}x`],
                  ['IRR Target', `${selectedDeal.irrTarget}%`], ['Carbon Intensity', selectedDeal.carbonIntensity],
                  ['Employees', fmtI(selectedDeal.employees)], ['Revenue', fmtM(selectedDeal.revenue_mn)],
                  ['EBITDA', fmtM(selectedDeal.ebitda_mn)], ['Status', selectedDeal.status],
                ].map(([l, v], i) => (
                  <div key={i}>
                    <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase' }}>{l}</div>
                    <div style={{ fontSize:14, fontWeight:600 }}>{v}</div>
                  </div>
                ))}
              </div>
              {/* ESG Gauge */}
              <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:80, height:80, borderRadius:'50%', border:`4px solid ${selectedDeal.esgScore >= 80 ? T.green : selectedDeal.esgScore >= 60 ? T.gold : T.red}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:24, fontWeight:800, color: selectedDeal.esgScore >= 80 ? T.green : selectedDeal.esgScore >= 60 ? T.gold : T.red }}>{selectedDeal.esgScore}</span>
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:T.navy }}>ESG Score</div>
                  <div style={{ fontSize:11, color:T.textSec }}>{selectedDeal.esgScore >= 80 ? 'Strong' : selectedDeal.esgScore >= 60 ? 'Moderate' : 'Needs Improvement'}</div>
                </div>
              </div>
              {/* SDG Badges */}
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:11, fontWeight:600, color:T.textSec, marginBottom:4 }}>SDG Alignment:</div>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {selectedDeal.sdgs.map(n => (
                    <span key={n} style={{ display:'inline-block', padding:'3px 10px', borderRadius:9999, fontSize:10, fontWeight:700, color:'#fff', background:SDG_COLORS[n] || T.navy }}>
                      SDG {n}: {SDG_NAMES[n]}
                    </span>
                  ))}
                </div>
              </div>
              {/* Impact Metrics */}
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:11, fontWeight:600, color:T.textSec, marginBottom:4 }}>Impact Metrics:</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {Object.entries(selectedDeal.impactMetrics).map(([k, v]) => (
                    <div key={k} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'8px 14px' }}>
                      <div style={{ fontSize:14, fontWeight:700, color:T.sage }}>{typeof v === 'number' ? fmtI(v) : v}</div>
                      <div style={{ fontSize:10, color:T.textMut }}>{k.replace(/_/g, ' ')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ DD CHECKLIST ═══════════════ */}
      {activeTab === 'dd' && (
        <div style={s.card}>
          <h3 style={{ margin:'0 0 4px', fontSize:16, fontWeight:700, color:T.navy }}>ESG Due Diligence Checklist</h3>
          <p style={{ fontSize:12, color:T.textSec, marginBottom:16 }}>Select a deal to manage its 30-item DD checklist. All changes are auto-saved.</p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            {deals.filter(d => d.status === 'Active').map(d => (
              <button key={d.id} style={selectedDeal?.id === d.id ? s.btn : s.btnOutline} onClick={() => setSelectedDeal(d)}>
                {d.company}
              </button>
            ))}
          </div>
          {!selectedDeal && <div style={{ padding:40, textAlign:'center', color:T.textMut, fontSize:14 }}>Select a deal above to view its DD checklist</div>}
          {selectedDeal && ['environmental','social','governance'].map((cat, catIdx) => (
            <div key={cat} style={{ marginBottom:20 }}>
              <h4 style={{ fontSize:14, fontWeight:700, color: catIdx === 0 ? T.sage : catIdx === 1 ? '#7c3aed' : T.gold, textTransform:'capitalize', margin:'0 0 8px' }}>
                {cat} ({PE_DD_CHECKLIST[cat].length} items)
              </h4>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    <th style={{...s.th, width:30}}>#</th>
                    <th style={s.th}>Item</th>
                    <th style={{...s.th, width:120}}>Status</th>
                    <th style={{...s.th, width:140}}>Owner</th>
                    <th style={{...s.th, width:200}}>Evidence / Notes</th>
                    <th style={{...s.th, width:120}}>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {PE_DD_CHECKLIST[cat].map((item, i) => {
                    const globalIdx = catIdx * 10 + i;
                    const st = ddState[`${selectedDeal.id}_${globalIdx}`] || {};
                    return (
                      <tr key={i}>
                        <td style={s.td}>{globalIdx + 1}</td>
                        <td style={{...s.td, fontSize:12}}>{item}</td>
                        <td style={s.td}>
                          <select value={st.status || 'Not Started'} style={s.select}
                            onChange={e => updateDD(selectedDeal.id, globalIdx, 'status', e.target.value)}>
                            {['Not Started','In Progress','Complete','N/A'].map(o => <option key={o}>{o}</option>)}
                          </select>
                        </td>
                        <td style={s.td}>
                          <input style={s.input} placeholder="Owner" value={st.owner || ''}
                            onChange={e => updateDD(selectedDeal.id, globalIdx, 'owner', e.target.value)} />
                        </td>
                        <td style={s.td}>
                          <input style={s.input} placeholder="Evidence / notes" value={st.evidence || ''}
                            onChange={e => updateDD(selectedDeal.id, globalIdx, 'evidence', e.target.value)} />
                        </td>
                        <td style={s.td}>
                          <input type="date" style={s.input} value={st.dueDate || ''}
                            onChange={e => updateDD(selectedDeal.id, globalIdx, 'dueDate', e.target.value)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════ DD HEATMAP ═══════════════ */}
      {activeTab === 'heatmap' && (
        <div style={s.card}>
          <h3 style={{ margin:'0 0 12px', fontSize:16, fontWeight:700, color:T.navy }}>DD Completion Heatmap (Deals x E/S/G)</h3>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={s.th}>Company</th>
                  <th style={{...s.th, textAlign:'center'}}>Environmental %</th>
                  <th style={{...s.th, textAlign:'center'}}>Social %</th>
                  <th style={{...s.th, textAlign:'center'}}>Governance %</th>
                  <th style={{...s.th, textAlign:'center'}}>Overall %</th>
                </tr>
              </thead>
              <tbody>
                {ddHeatmap.map(row => {
                  const overall = Math.round((row.E + row.S + row.G) / 3);
                  const cellBg = (v) => v >= 80 ? '#dcfce7' : v >= 50 ? '#fef9c3' : v >= 20 ? '#ffedd5' : v > 0 ? '#fee2e2' : T.surfaceH;
                  const cellColor = (v) => v >= 80 ? T.green : v >= 50 ? T.amber : v > 0 ? T.red : T.textMut;
                  return (
                    <tr key={row.id}>
                      <td style={{...s.td, fontWeight:600}}>{row.company}</td>
                      {[row.E, row.S, row.G, overall].map((v, ci) => (
                        <td key={ci} style={{...s.td, textAlign:'center', background:cellBg(v), color:cellColor(v), fontWeight:700, fontSize:13 }}>
                          {v}%
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════ COMPARE MODE ═══════════════ */}
      {activeTab === 'compare' && (
        <div style={s.card}>
          <h3 style={{ margin:'0 0 12px', fontSize:16, fontWeight:700, color:T.navy }}>Deal Comparison Mode</h3>
          {compareIds.length < 2 ? (
            <div style={{ padding:40, textAlign:'center', color:T.textMut }}>
              Select 2-3 deals from the Deal Table (checkbox column) to compare side-by-side.
              <br /><span style={{ fontSize:12 }}>Currently selected: {compareIds.length}/3</span>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    <th style={s.th}>Metric</th>
                    {compareIds.map(id => {
                      const d = deals.find(x => x.id === id);
                      return <th key={id} style={{...s.th, textAlign:'center'}}>{d?.company || id}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Sector', d => d.sector], ['Stage', d => d.stage], ['Geography', d => d.geography],
                    ['Fund', d => d.fund], ['Deal Size ($M)', d => fmt(d.dealSize_mn, 0)],
                    ['Equity ($M)', d => fmt(d.equity_mn, 0)], ['EV Multiple', d => `${d.evMultiple}x`],
                    ['IRR Target', d => `${d.irrTarget}%`], ['ESG Score', d => d.esgScore],
                    ['Carbon Intensity', d => d.carbonIntensity], ['Employees', d => fmtI(d.employees)],
                    ['Revenue ($M)', d => fmt(d.revenue_mn, 1)], ['EBITDA ($M)', d => fmt(d.ebitda_mn, 1)],
                    ['SDGs', d => d.sdgs.join(', ')], ['Status', d => d.status],
                  ].map(([label, fn], i) => (
                    <tr key={i}>
                      <td style={{...s.td, fontWeight:600, background:T.surfaceH}}>{label}</td>
                      {compareIds.map(id => {
                        const d = deals.find(x => x.id === id);
                        return <td key={id} style={{...s.td, textAlign:'center'}}>{d ? fn(d) : '-'}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ IMPACT ═══════════════ */}
      {activeTab === 'impact' && (
        <div style={s.card}>
          <h3 style={{ margin:'0 0 16px', fontSize:16, fontWeight:700, color:T.navy }}>Portfolio Impact Metrics Dashboard</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12, marginBottom:24 }}>
            {Object.entries(impactAgg).map(([k, v]) => (
              <div key={k} style={{ background:T.surfaceH, borderRadius:8, padding:14, textAlign:'center', border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:20, fontWeight:700, color:T.sage }}>{fmtI(v)}</div>
                <div style={{ fontSize:10, color:T.textMut, textTransform:'uppercase', marginTop:2 }}>{k.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
          {/* Per-deal impact table */}
          <h4 style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:8 }}>Impact by Deal</h4>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={s.th}>Company</th>
                  <th style={s.th}>Sector</th>
                  <th style={s.th}>ESG</th>
                  {['co2_avoided_t','jobs_created','mwh_clean_energy','patients_served','people_served_clean_water','students_reached','unbanked_served'].map(k => (
                    <th key={k} style={{...s.th, textAlign:'right'}}>{k.replace(/_/g, ' ').slice(0, 18)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deals.map(d => (
                  <tr key={d.id}>
                    <td style={{...s.td, fontWeight:600}}>{d.company}</td>
                    <td style={s.td}>{d.sector}</td>
                    <td style={s.td}><span style={s.esgBadge(d.esgScore)}>{d.esgScore}</span></td>
                    {['co2_avoided_t','jobs_created','mwh_clean_energy','patients_served','people_served_clean_water','students_reached','unbanked_served'].map(k => (
                      <td key={k} style={{...s.td, textAlign:'right'}}>{d.impactMetrics[k] ? fmtI(d.impactMetrics[k]) : '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════ CHARTS ═══════════════ */}
      {activeTab === 'charts' && (
        <>
          {/* Sector by Count + Value */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div style={s.card}>
              <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>Sector Distribution (Deal Count)</h4>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={sectorByCount} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                    {sectorByCount.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={s.card}>
              <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>Sector Distribution (Deal Value $M)</h4>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={sectorByValue} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: $${value}M`}>
                    {sectorByValue.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Geography + Vintage */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div style={s.card}>
              <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>Geography Distribution</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={geoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:T.textSec }} />
                  <YAxis tick={{ fontSize:11, fill:T.textSec }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.navy} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={s.card}>
              <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>Vintage Year Distribution</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={vintageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:T.textSec }} />
                  <YAxis tick={{ fontSize:11, fill:T.textSec }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={T.gold} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ESG Distribution + Scatter */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div style={s.card}>
              <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>ESG Score Distribution</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={esgDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:T.textSec }} />
                  <YAxis tick={{ fontSize:11, fill:T.textSec }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4,4,0,0]}>
                    {esgDistribution.map((_, i) => <Cell key={i} fill={[T.red, T.red, T.amber, T.gold, T.sage, T.green][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={s.card}>
              <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>IRR Target vs ESG Score</h4>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="esg" name="ESG Score" tick={{ fontSize:11, fill:T.textSec }} label={{ value:'ESG Score', position:'insideBottom', offset:-5, fontSize:11 }} />
                  <YAxis dataKey="irr" name="IRR Target %" tick={{ fontSize:11, fill:T.textSec }} label={{ value:'IRR %', angle:-90, position:'insideLeft', fontSize:11 }} />
                  <ZAxis dataKey="size" range={[40, 400]} name="Deal Size ($M)" />
                  <Tooltip cursor={{ strokeDasharray:'3 3' }} formatter={(v, name) => [name === 'Deal Size ($M)' ? `$${v}M` : v, name]} />
                  <Scatter data={scatterData} fill={T.navyL}>
                    {scatterData.map((d, i) => <Cell key={i} fill={d.esg >= 80 ? T.green : d.esg >= 60 ? T.gold : T.red} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════ ADD DEAL FORM ═══════════════ */}
      {activeTab === 'addDeal' && (
        <div style={s.card}>
          <h3 style={{ margin:'0 0 16px', fontSize:16, fontWeight:700, color:T.navy }}>Add New Deal</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Company Name *</label>
              <input style={s.input} value={formData.company} onChange={e => setFormData(p => ({...p, company:e.target.value}))} placeholder="Company name" />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Sector</label>
              <select style={{...s.select, width:'100%'}} value={formData.sector} onChange={e => setFormData(p => ({...p, sector:e.target.value}))}>
                {SECTORS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Stage</label>
              <select style={{...s.select, width:'100%'}} value={formData.stage} onChange={e => setFormData(p => ({...p, stage:e.target.value}))}>
                {STAGES.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Vintage</label>
              <input style={s.input} type="number" value={formData.vintage} onChange={e => setFormData(p => ({...p, vintage:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Geography</label>
              <select style={{...s.select, width:'100%'}} value={formData.geography} onChange={e => setFormData(p => ({...p, geography:e.target.value}))}>
                {GEOS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Fund</label>
              <select style={{...s.select, width:'100%'}} value={formData.fund} onChange={e => setFormData(p => ({...p, fund:e.target.value}))}>
                {FUNDS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Deal Size ($M)</label>
              <input style={s.input} type="number" value={formData.dealSize_mn} onChange={e => setFormData(p => ({...p, dealSize_mn:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Equity ($M)</label>
              <input style={s.input} type="number" value={formData.equity_mn} onChange={e => setFormData(p => ({...p, equity_mn:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>EV Multiple</label>
              <input style={s.input} type="number" step="0.1" value={formData.evMultiple} onChange={e => setFormData(p => ({...p, evMultiple:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>IRR Target %</label>
              <input style={s.input} type="number" value={formData.irrTarget} onChange={e => setFormData(p => ({...p, irrTarget:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>ESG Score (0-100)</label>
              <input style={s.input} type="number" min="0" max="100" value={formData.esgScore} onChange={e => setFormData(p => ({...p, esgScore:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Carbon Intensity</label>
              <input style={s.input} type="number" value={formData.carbonIntensity} onChange={e => setFormData(p => ({...p, carbonIntensity:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Employees</label>
              <input style={s.input} type="number" value={formData.employees} onChange={e => setFormData(p => ({...p, employees:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>Revenue ($M)</label>
              <input style={s.input} type="number" step="0.1" value={formData.revenue_mn} onChange={e => setFormData(p => ({...p, revenue_mn:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>EBITDA ($M)</label>
              <input style={s.input} type="number" step="0.1" value={formData.ebitda_mn} onChange={e => setFormData(p => ({...p, ebitda_mn:e.target.value}))} />
            </div>
          </div>
          {/* SDG multi-select */}
          <div style={{ marginTop:12 }}>
            <label style={{ fontSize:11, fontWeight:600, color:T.textSec }}>SDG Alignment (click to toggle)</label>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:4 }}>
              {Object.entries(SDG_NAMES).map(([n, name]) => {
                const num = Number(n);
                const sel = formData.sdgs.includes(num);
                return (
                  <button key={n} onClick={() => setFormData(p => ({ ...p, sdgs: sel ? p.sdgs.filter(x => x !== num) : [...p.sdgs, num] }))}
                    style={{ padding:'4px 10px', borderRadius:9999, fontSize:10, fontWeight:600, border: sel ? 'none' : `1px solid ${T.border}`, background: sel ? (SDG_COLORS[num] || T.navy) : 'transparent', color: sel ? '#fff' : T.textSec, cursor:'pointer' }}>
                    {n}: {name}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop:16, display:'flex', gap:8 }}>
            <button style={s.btn} onClick={addDeal}>Add Deal</button>
            <button style={s.btnOutline} onClick={() => { setFormData(emptyForm); }}>Reset</button>
          </div>
        </div>
      )}

      {/* ═══════════════ FUND PERFORMANCE SUMMARY ═══════════════ */}
      {activeTab === 'charts' && (() => {
        const fundPerf = useMemo(() => {
          const funds = {};
          deals.forEach(d => {
            if (!funds[d.fund]) funds[d.fund] = { name: d.fund, deals: 0, totalValue: 0, avgESG: 0, avgIRR: 0, sectors: new Set(), geos: new Set(), totalCO2: 0, esgSum: 0, irrSum: 0 };
            const f = funds[d.fund];
            f.deals++; f.totalValue += d.dealSize_mn; f.esgSum += d.esgScore; f.irrSum += d.irrTarget;
            f.sectors.add(d.sector); f.geos.add(d.geography);
            f.totalCO2 += (d.impactMetrics.co2_avoided_t || 0);
          });
          return Object.values(funds).map(f => ({ ...f, avgESG: f.esgSum / f.deals, avgIRR: f.irrSum / f.deals, sectors: f.sectors.size, geos: f.geos.size }));
        }, [deals]);
        return (
          <div style={s.card}>
            <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>Fund Performance Summary</h4>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={s.th}>Fund</th>
                  <th style={{...s.th, textAlign:'right'}}>Deals</th>
                  <th style={{...s.th, textAlign:'right'}}>Total Value ($M)</th>
                  <th style={{...s.th, textAlign:'right'}}>Avg ESG</th>
                  <th style={{...s.th, textAlign:'right'}}>Avg IRR %</th>
                  <th style={{...s.th, textAlign:'right'}}>Sectors</th>
                  <th style={{...s.th, textAlign:'right'}}>Geographies</th>
                  <th style={{...s.th, textAlign:'right'}}>CO2 Avoided (t)</th>
                </tr>
              </thead>
              <tbody>
                {fundPerf.map((f, i) => (
                  <tr key={i}>
                    <td style={{...s.td, fontWeight:600}}>{f.name}</td>
                    <td style={{...s.td, textAlign:'right'}}>{f.deals}</td>
                    <td style={{...s.td, textAlign:'right'}}>{fmtM(f.totalValue)}</td>
                    <td style={{...s.td, textAlign:'right'}}><span style={s.esgBadge(f.avgESG)}>{fmt(f.avgESG, 0)}</span></td>
                    <td style={{...s.td, textAlign:'right'}}>{fmt(f.avgIRR, 1)}%</td>
                    <td style={{...s.td, textAlign:'right'}}>{f.sectors}</td>
                    <td style={{...s.td, textAlign:'right'}}>{f.geos}</td>
                    <td style={{...s.td, textAlign:'right'}}>{fmtI(f.totalCO2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* ═══════════════ STAGE PROGRESSION TIMELINE ═══════════════ */}
      {activeTab === 'charts' && (() => {
        const stageProgression = STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage);
          const totalValue = stageDeals.reduce((s, d) => s + d.dealSize_mn, 0);
          const avgESG = stageDeals.length > 0 ? stageDeals.reduce((s, d) => s + d.esgScore, 0) / stageDeals.length : 0;
          return { stage, count: stageDeals.length, totalValue, avgESG };
        });
        return (
          <div style={s.card}>
            <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>Pipeline Stage Progression</h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stageProgression}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="stage" tick={{ fontSize:10, fill:T.textSec }} />
                <YAxis yAxisId="left" tick={{ fontSize:11, fill:T.textSec }} label={{ value:'Deal Count', angle:-90, position:'insideLeft', fontSize:11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fill:T.textSec }} label={{ value:'Value ($M)', angle:90, position:'insideRight', fontSize:11 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="Deal Count" fill={T.navy} radius={[4,4,0,0]} />
                <Bar yAxisId="right" dataKey="totalValue" name="Total Value ($M)" fill={T.gold} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

      {/* ═══════════════ ESG RADAR BY STAGE ═══════════════ */}
      {activeTab === 'charts' && (() => {
        const radarData = STAGES.filter(st => deals.some(d => d.stage === st)).map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage);
          const avgESG = stageDeals.reduce((s, d) => s + d.esgScore, 0) / stageDeals.length;
          const avgIRR = stageDeals.reduce((s, d) => s + d.irrTarget, 0) / stageDeals.length;
          const avgCarbon = stageDeals.reduce((s, d) => s + d.carbonIntensity, 0) / stageDeals.length;
          const avgSize = stageDeals.reduce((s, d) => s + d.dealSize_mn, 0) / stageDeals.length;
          return { stage, 'Avg ESG': Math.round(avgESG), 'Avg IRR': Math.round(avgIRR), 'Avg Carbon Int': Math.round(avgCarbon), 'Avg Deal Size': Math.round(avgSize) };
        });
        return (
          <div style={s.card}>
            <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>Stage-Level Metrics Comparison</h4>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    <th style={s.th}>Stage</th>
                    <th style={{...s.th, textAlign:'right'}}>Avg ESG Score</th>
                    <th style={{...s.th, textAlign:'right'}}>Avg IRR Target %</th>
                    <th style={{...s.th, textAlign:'right'}}>Avg Carbon Intensity</th>
                    <th style={{...s.th, textAlign:'right'}}>Avg Deal Size ($M)</th>
                    <th style={{...s.th, textAlign:'right'}}>Deal Count</th>
                  </tr>
                </thead>
                <tbody>
                  {radarData.map((r, i) => (
                    <tr key={i}>
                      <td style={{...s.td, fontWeight:600}}>
                        <span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:STAGE_COLORS[r.stage], marginRight:6 }} />
                        {r.stage}
                      </td>
                      <td style={{...s.td, textAlign:'right'}}><span style={s.esgBadge(r['Avg ESG'])}>{r['Avg ESG']}</span></td>
                      <td style={{...s.td, textAlign:'right'}}>{r['Avg IRR']}%</td>
                      <td style={{...s.td, textAlign:'right'}}>{r['Avg Carbon Int']}</td>
                      <td style={{...s.td, textAlign:'right'}}>{fmtM(r['Avg Deal Size'])}</td>
                      <td style={{...s.td, textAlign:'right'}}>{deals.filter(d => d.stage === r.stage).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════ SDG COVERAGE MATRIX ═══════════════ */}
      {activeTab === 'impact' && (() => {
        const sdgCoverage = Object.keys(SDG_NAMES).map(Number).map(sdg => {
          const sdgDeals = deals.filter(d => d.sdgs.includes(sdg));
          return { sdg, name: SDG_NAMES[sdg], count: sdgDeals.length, totalValue: sdgDeals.reduce((s, d) => s + d.dealSize_mn, 0) };
        }).filter(x => x.count > 0).sort((a, b) => b.count - a.count);
        return (
          <div style={s.card}>
            <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>SDG Coverage Matrix</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sdgCoverage}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize:9, fill:T.textSec, angle:-20 }} interval={0} height={60} />
                <YAxis tick={{ fontSize:11, fill:T.textSec }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Deal Count" fill={T.sage} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop:12, display:'flex', gap:6, flexWrap:'wrap' }}>
              {sdgCoverage.map(s => (
                <div key={s.sdg} style={{ background:SDG_COLORS[s.sdg], color:'#fff', borderRadius:8, padding:'6px 12px', fontSize:11, fontWeight:600 }}>
                  SDG {s.sdg}: {s.name} ({s.count} deals, {fmtM(s.totalValue)})
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ═══════════════ DEAL RISK-RETURN QUADRANT ═══════════════ */}
      {activeTab === 'charts' && (
        <div style={s.card}>
          <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>Risk-Return Quadrant Analysis</h4>
          <p style={{ fontSize:11, color:T.textSec, marginBottom:8 }}>Quadrants: High ESG + High IRR (top-right) = ideal; Low ESG + Low IRR (bottom-left) = avoid</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginBottom:16 }}>
            {[
              { label:'High ESG + High IRR', filter: d => d.esgScore >= 70 && d.irrTarget >= 22, color:T.green, bg:'#f0fdf4' },
              { label:'High ESG + Low IRR', filter: d => d.esgScore >= 70 && d.irrTarget < 22, color:T.sage, bg:'#f0fdf4' },
              { label:'Low ESG + High IRR', filter: d => d.esgScore < 70 && d.irrTarget >= 22, color:T.amber, bg:'#fef9c3' },
              { label:'Low ESG + Low IRR', filter: d => d.esgScore < 70 && d.irrTarget < 22, color:T.red, bg:'#fee2e2' },
            ].map((q, i) => {
              const qDeals = deals.filter(q.filter);
              return (
                <div key={i} style={{ background:q.bg, borderRadius:8, padding:12, border:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:11, fontWeight:700, color:q.color, marginBottom:6 }}>{q.label}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:q.color }}>{qDeals.length}</div>
                  <div style={{ fontSize:10, color:T.textMut }}>deals ({fmtM(qDeals.reduce((s, d) => s + d.dealSize_mn, 0))})</div>
                  {qDeals.slice(0, 3).map(d => (
                    <div key={d.id} style={{ fontSize:10, color:T.textSec, marginTop:2 }}>{d.company}</div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════ EDIT DEAL MODAL (inline) ═══════════════ */}
      {activeTab === 'table' && selectedDeal && (
        <div style={{ ...s.card, borderLeft:`4px solid ${T.gold}` }}>
          <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>Quick Edit — {selectedDeal.company}</h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:10 }}>
            {[
              { key:'esgScore', label:'ESG Score', type:'number' },
              { key:'irrTarget', label:'IRR Target %', type:'number' },
              { key:'dealSize_mn', label:'Deal Size ($M)', type:'number' },
              { key:'equity_mn', label:'Equity ($M)', type:'number' },
              { key:'carbonIntensity', label:'Carbon Intensity', type:'number' },
              { key:'employees', label:'Employees', type:'number' },
              { key:'revenue_mn', label:'Revenue ($M)', type:'number' },
              { key:'ebitda_mn', label:'EBITDA ($M)', type:'number' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize:10, color:T.textMut }}>{f.label}</label>
                <input style={s.input} type={f.type} value={selectedDeal[f.key]}
                  onChange={e => {
                    const val = f.type === 'number' ? Number(e.target.value) : e.target.value;
                    setDeals(prev => prev.map(d => d.id === selectedDeal.id ? { ...d, [f.key]: val } : d));
                    setSelectedDeal(prev => ({ ...prev, [f.key]: val }));
                  }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize:10, color:T.textMut }}>Stage</label>
              <select style={{...s.select, width:'100%'}} value={selectedDeal.stage}
                onChange={e => {
                  setDeals(prev => prev.map(d => d.id === selectedDeal.id ? { ...d, stage: e.target.value } : d));
                  setSelectedDeal(prev => ({ ...prev, stage: e.target.value }));
                }}>
                {STAGES.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:10, color:T.textMut }}>Status</label>
              <select style={{...s.select, width:'100%'}} value={selectedDeal.status}
                onChange={e => {
                  setDeals(prev => prev.map(d => d.id === selectedDeal.id ? { ...d, status: e.target.value } : d));
                  setSelectedDeal(prev => ({ ...prev, status: e.target.value }));
                }}>
                <option>Active</option><option>Exited</option><option>On Hold</option><option>Declined</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop:8, fontSize:11, color:T.textMut }}>Changes are auto-saved to localStorage.</div>
        </div>
      )}

      {/* ═══════════════ ESG IMPROVEMENT TRACKER ═══════════════ */}
      {activeTab === 'impact' && (
        <div style={s.card}>
          <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>ESG Score Ranking & Value Creation Opportunity</h4>
          <p style={{ fontSize:11, color:T.textSec, marginBottom:8 }}>Sorted by ESG score ascending - bottom-ranked deals have the most room for ESG improvement and value creation through active ownership.</p>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={s.th}>#</th>
                <th style={s.th}>Company</th>
                <th style={s.th}>Sector</th>
                <th style={{...s.th, textAlign:'center'}}>Current ESG</th>
                <th style={{...s.th, textAlign:'center'}}>Target ESG (+15)</th>
                <th style={{...s.th, textAlign:'right'}}>Deal Size ($M)</th>
                <th style={{...s.th, textAlign:'right'}}>IRR Target %</th>
                <th style={s.th}>Priority Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...deals].sort((a, b) => a.esgScore - b.esgScore).slice(0, 10).map((d, i) => {
                const target = Math.min(d.esgScore + 15, 100);
                const actions = d.esgScore < 60 ? 'Governance audit, Environmental baseline, Social policy review' :
                  d.esgScore < 70 ? 'Climate transition plan, DEI targets, Board ESG committee' :
                  'Continuous improvement, Reporting enhancement';
                return (
                  <tr key={d.id}>
                    <td style={s.td}>{i + 1}</td>
                    <td style={{...s.td, fontWeight:600}}>{d.company}</td>
                    <td style={s.td}>{d.sector}</td>
                    <td style={{...s.td, textAlign:'center'}}><span style={s.esgBadge(d.esgScore)}>{d.esgScore}</span></td>
                    <td style={{...s.td, textAlign:'center'}}><span style={s.esgBadge(target)}>{target}</span></td>
                    <td style={{...s.td, textAlign:'right'}}>{fmtM(d.dealSize_mn)}</td>
                    <td style={{...s.td, textAlign:'right'}}>{d.irrTarget}%</td>
                    <td style={{...s.td, fontSize:11, color:T.textSec}}>{actions}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════ PORTFOLIO CONCENTRATION METRICS ═══════════════ */}
      {activeTab === 'charts' && (
        <div style={s.card}>
          <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:T.navy }}>Portfolio Concentration Analysis</h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
            {/* Top 5 by value */}
            <div>
              <h5 style={{ fontSize:12, fontWeight:700, color:T.textSec, marginBottom:8 }}>Top 5 by Deal Value</h5>
              {[...deals].sort((a, b) => b.dealSize_mn - a.dealSize_mn).slice(0, 5).map((d, i) => {
                const pctOfTotal = kpis.totalVal > 0 ? (d.dealSize_mn / kpis.totalVal * 100) : 0;
                return (
                  <div key={d.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <span style={{ fontSize:11 }}>{i + 1}. {d.company}</span>
                    <span style={{ fontSize:11, fontWeight:700 }}>{fmtM(d.dealSize_mn)} ({pct(pctOfTotal)})</span>
                  </div>
                );
              })}
            </div>
            {/* Sector HHI */}
            <div>
              <h5 style={{ fontSize:12, fontWeight:700, color:T.textSec, marginBottom:8 }}>Sector Concentration (HHI)</h5>
              {(() => {
                const sectorShares = {};
                deals.forEach(d => { sectorShares[d.sector] = (sectorShares[d.sector] || 0) + d.dealSize_mn; });
                const totalVal = kpis.totalVal || 1;
                const hhi = Object.values(sectorShares).reduce((s, v) => s + Math.pow(v / totalVal * 100, 2), 0);
                const conc = hhi > 2500 ? 'Highly Concentrated' : hhi > 1500 ? 'Moderately Concentrated' : 'Diversified';
                const color = hhi > 2500 ? T.red : hhi > 1500 ? T.amber : T.green;
                return (
                  <>
                    <div style={{ fontSize:28, fontWeight:800, color }}>{Math.round(hhi)}</div>
                    <div style={{ fontSize:11, color }}>{conc}</div>
                    <div style={{ fontSize:10, color:T.textMut, marginTop:4 }}>HHI &lt; 1500 = Diversified, 1500-2500 = Moderate, &gt; 2500 = High</div>
                  </>
                );
              })()}
            </div>
            {/* Geography HHI */}
            <div>
              <h5 style={{ fontSize:12, fontWeight:700, color:T.textSec, marginBottom:8 }}>Geographic Concentration</h5>
              {(() => {
                const geoShares = {};
                deals.forEach(d => { geoShares[d.geography] = (geoShares[d.geography] || 0) + d.dealSize_mn; });
                const totalVal = kpis.totalVal || 1;
                const hhi = Object.values(geoShares).reduce((s, v) => s + Math.pow(v / totalVal * 100, 2), 0);
                const conc = hhi > 2500 ? 'Highly Concentrated' : hhi > 1500 ? 'Moderately Concentrated' : 'Diversified';
                const color = hhi > 2500 ? T.red : hhi > 1500 ? T.amber : T.green;
                return (
                  <>
                    <div style={{ fontSize:28, fontWeight:800, color }}>{Math.round(hhi)}</div>
                    <div style={{ fontSize:11, color }}>{conc}</div>
                    <div style={{ fontSize:10, color:T.textMut, marginTop:4 }}>Herfindahl-Hirschman Index by geography</div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ CROSS-NAV FOOTER ═══════════════ */}
      <div style={{ ...s.card, display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginTop:24 }}>
        <span style={{ fontSize:12, fontWeight:600, color:T.textSec, marginRight:8, alignSelf:'center' }}>Navigate:</span>
        {[
          ['Portfolio Suite', '/portfolio-suite'], ['Fixed Income ESG', '/fixed-income-esg'],
          ['Risk Attribution', '/risk-attribution'], ['Private Credit ESG', '/private-credit'],
          ['Infra ESG DD', '/infra-esg-dd'], ['SFDR Art 9', '/sfdr-art9'],
          ['Supply Chain', '/supply-chain-map'], ['Climate VaR', '/portfolio-climate-var'],
          ['Sector Benchmarking', '/sector-benchmarking'], ['ESG Screener', '/esg-screener'],
        ].map(([label, path]) => (
          <button key={path} style={s.btnOutline} onClick={() => nav(path)}>{label}</button>
        ))}
      </div>
    </div>
  );
}
