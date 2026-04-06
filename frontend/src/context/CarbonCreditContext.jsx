/**
 * CarbonCreditContext — Cross-Module Data Bus for Carbon Credit Engine
 *
 * Provides shared state for all 21 CC modules (BQ–BW) and adapter functions
 * for consuming modules (PCAF, Portfolio, ESG Ratings, EE, CSRD, SFDR, ISSB).
 *
 * State: projects, calculations, credits, retirements, aggregates
 * Persistence: localStorage key 'cc_engine_state'
 * Seed: 819 real Verra registry projects (CCB + SD VISta + PWR) on first mount
 */
import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import { VERRA_PROJECTS, VERRA_STATS } from '../data/verraRegistryData';

/* ── Seeded random (same as all CC pages) ── */
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ══════════════════════════════════════════════════════════════════
   SEED DATA — 40 projects across 7 families, pre-populated credits
   ══════════════════════════════════════════════════════════════════ */
const FAMILIES = ['nature','agriculture','energy','waste','industrial','cdr','retirement'];
const FAMILY_LABELS = { nature:'Nature-Based', agriculture:'Agriculture & Soil', energy:'Energy Transition', waste:'Waste & Circular', industrial:'Industrial Process', cdr:'Engineered CDR', retirement:'Cross-Family' };
const CLUSTERS = {
  nature: ['ARR','IFM','REDD+','Wetlands/Blue Carbon'],
  agriculture: ['Soil Carbon','Livestock Methane','Rice Cultivation'],
  energy: ['Grid Renewables','Clean Cooking','Energy Efficiency','Distributed Energy'],
  waste: ['Landfill Gas','Wastewater Methane','Organic Waste'],
  industrial: ['Industrial Gases','CCS/CCUS','Biochar'],
  cdr: ['Mineralization/ERW','DAC','BiCRS'],
  retirement: ['Multi-Registry'],
};
const METHODOLOGIES = {
  nature: ['VM0047','VM0010','VM0007','VM0033'],
  agriculture: ['VM0042','AMS-III.BF','AMS-III.AU'],
  energy: ['ACM0002','AMS-II.G','AMS-II.C','AMS-I.D'],
  waste: ['ACM0001','AMS-III.H','AMS-III.E'],
  industrial: ['AM0001','VM0040','Puro-Biochar'],
  cdr: ['Puro-ERW','Iso-DAC','Iso-BiCRS'],
  retirement: ['Multi'],
};
const REGISTRIES = ['Verra VCS','Gold Standard','ACR','Puro.earth','Isometric','CAR'];
const COUNTRIES = ['Brazil','Indonesia','India','Kenya','Colombia','Peru','USA','Germany','China','Cambodia','DRC','Honduras','Chile','New Zealand','Finland','Belize','Vietnam','Thailand','Ethiopia','Australia','UK','Japan','Mexico','Senegal','Madagascar','Bolivia','Myanmar','Fiji','Tanzania','Cameroon','Ecuador','Gabon','Canada','Sweden','Philippines','Nepal','Laos','Malaysia','Papua NG','Nigeria'];

const generateSeedProjects = () => {
  // Use real Verra registry data (819 projects from CCB + SD VISta + PWR)
  return VERRA_PROJECTS.map((vp, idx) => {
    const meths = METHODOLOGIES[vp.family] || METHODOLOGIES.nature;
    const meth = vp.methodology || meths[idx % meths.length];
    const area = Math.round(2000 + sr(idx * 11) * 198000);
    const creditingYrs = Math.round(15 + sr(idx * 13) * 25);
    const annualCredits = Math.round(area * (3 + sr(idx * 17) * 15));
    const totalCredits = annualCredits * creditingYrs;
    const retired = Math.round(totalCredits * (0.1 + sr(idx * 19) * 0.5));
    const vintage = 2016 + Math.floor(sr(idx * 23) * 8);
    const price = Math.round((5 + sr(idx * 29) * 30) * 10) / 10;

    // Map Verra status to platform status
    const statusMap = { 'Verification approved':'Active', 'Under validation':'Pipeline', 'Under Verification':'Verification', 'Under validation and verification':'Pipeline', 'Validation expired':'Suspended', 'Project withdrawn':'Suspended', 'Rejected by Administrator':'Suspended' };
    const mappedStatus = statusMap[vp.status] || (vp.status.includes('approved') ? 'Active' : vp.status.includes('Under') ? 'Pipeline' : 'Pipeline');

    // Merge real co-benefits with generated ones
    const realCoBenefits = vp.coBenefits || [];
    const genCoBenefits = ['Community','Biodiversity','Water','Gender','Health'].filter((_, bi) => sr(idx * 61 + bi) > 0.4);
    const allCoBenefits = [...new Set([...realCoBenefits, ...genCoBenefits])];

    return {
      id: `VERRA-${vp.id}`,
      verra_id: vp.id,
      name: vp.name,
      proponent: vp.proponent,
      family: vp.family,
      familyLabel: FAMILY_LABELS[vp.family] || vp.family,
      cluster: vp.cluster,
      project_type: vp.type,
      methodology: meth,
      registry: vp.registry,
      standard: vp.standard,
      country: vp.country,
      region: vp.region,
      area_ha: area,
      crediting_period_yrs: creditingYrs,
      start_year: vintage,
      status: mappedStatus,
      original_status: vp.status,
      // Credit summary (seeded — deterministic from Verra ID)
      total_credits_tco2e: totalCredits,
      annual_credits_tco2e: annualCredits,
      credits_retired_tco2e: retired,
      credits_available_tco2e: totalCredits - retired,
      avg_price_usd: price,
      total_value_usd: Math.round(totalCredits * price),
      vintage_year: vintage,
      registration_date: vp.regDate,
      // Quality metrics (seeded)
      additionality_score: Math.round(55 + sr(idx * 41) * 40),
      permanence_score: Math.round(50 + sr(idx * 43) * 45),
      mrv_quality: Math.round(60 + sr(idx * 47) * 35),
      leakage_risk: Math.round(5 + sr(idx * 53) * 25),
      buffer_pct: Math.round(10 + sr(idx * 59) * 20),
      co_benefits: allCoBenefits,
      sdgs: vp.sdgs || [],
      // Regulatory mapping
      csrd_esrs_e1: sr(idx * 67) > 0.3,
      sfdr_pai: sr(idx * 71) > 0.4,
      issb_s2: sr(idx * 73) > 0.35,
      eu_taxonomy_aligned: sr(idx * 79) > 0.5,
    };
  });
};

const generateSeedCalculations = (projects) => {
  return projects.filter(p => p.status === 'Active').map((p, i) => ({
    id: `CALC-${String(i + 1).padStart(4, '0')}`,
    projectId: p.id,
    methodology: p.methodology,
    family: p.family,
    cluster: p.cluster,
    calcType: 'FULL',
    inputs: {
      area_ha: p.area_ha,
      crediting_period: p.crediting_period_yrs,
      baseline_rate: Math.round((8 + sr(i * 83) * 40) * 10) / 10,
      project_rate: Math.round((0.5 + sr(i * 89) * 5) * 10) / 10,
      leakage_pct: p.leakage_risk,
      buffer_pct: p.buffer_pct,
      uncertainty_pct: Math.round(5 + sr(i * 97) * 12),
    },
    outputs: {
      gross_tco2e: Math.round(p.total_credits_tco2e * 1.35),
      leakage_tco2e: Math.round(p.total_credits_tco2e * 0.12),
      buffer_tco2e: Math.round(p.total_credits_tco2e * 0.15),
      uncertainty_tco2e: Math.round(p.total_credits_tco2e * 0.08),
      net_tco2e: p.total_credits_tco2e,
    },
    net_tco2e: p.total_credits_tco2e,
    timestamp: Date.now() - Math.floor(sr(i * 101) * 86400000 * 30),
  }));
};

const generateSeedCredits = (projects) => {
  let serialCounter = 1000;
  return projects.filter(p => p.status === 'Active').flatMap((p, i) => {
    const batches = Math.ceil(sr(i * 103) * 3) + 1;
    return Array.from({ length: batches }, (_, b) => {
      const qty = Math.round(p.total_credits_tco2e / batches);
      const start = serialCounter;
      serialCounter += qty;
      return {
        id: `CRD-${String(i * 10 + b + 1).padStart(5, '0')}`,
        projectId: p.id,
        serial_start: `${p.registry.replace(/[^A-Z]/g, '').slice(0, 3)}-${p.vintage_year}-${String(start).padStart(8, '0')}`,
        serial_end: `${p.registry.replace(/[^A-Z]/g, '').slice(0, 3)}-${p.vintage_year}-${String(start + qty - 1).padStart(8, '0')}`,
        vintage_year: p.vintage_year,
        quantity_tco2e: qty,
        methodology: p.methodology,
        registry: p.registry,
        status: b === 0 && sr(i * 107) > 0.5 ? 'Retired' : 'Available',
        co_benefits: p.co_benefits,
      };
    });
  });
};

const generateSeedRetirements = (credits) => {
  const retired = credits.filter(c => c.status === 'Retired');
  const beneficiaries = [
    { id: 'BEN-001', name: 'Global Climate Fund', type: 'Organization' },
    { id: 'BEN-002', name: 'Tech Corp Net Zero', type: 'Organization' },
    { id: 'BEN-003', name: 'CORSIA Compliance Pool', type: 'Compliance' },
    { id: 'BEN-004', name: 'EU ETS Surrender', type: 'Compliance' },
    { id: 'BEN-005', name: 'Voluntary Carbon Market', type: 'Voluntary' },
  ];
  const purposes = ['Voluntary Offset - Scope 1', 'Voluntary Offset - Scope 2', 'Voluntary Offset - Scope 3', 'CORSIA Compliance', 'Carbon Neutral Product', 'Event Offset', 'Supply Chain Decarbonisation'];

  return retired.map((c, i) => ({
    id: `RET-${String(i + 1).padStart(4, '0')}`,
    creditId: c.id,
    projectId: c.projectId,
    beneficiary: beneficiaries[i % beneficiaries.length],
    quantity_tco2e: c.quantity_tco2e,
    purpose: purposes[i % purposes.length],
    registry: c.registry,
    status: 'Completed',
    retirement_date: `2024-${String(1 + (i % 12)).padStart(2, '0')}-${String(5 + (i % 20)).padStart(2, '0')}`,
    confirmation_id: `${c.registry.replace(/[^A-Z]/g, '').slice(0, 3)}-RET-${String(100000 + i)}`,
  }));
};

/* ══════════════════════════════════════════════════════════════════
   REDUCER
   ══════════════════════════════════════════════════════════════════ */
const ACTIONS = {
  INIT_SEED: 'INIT_SEED',
  ADD_PROJECT: 'ADD_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  SET_ACTIVE_PROJECT: 'SET_ACTIVE_PROJECT',
  ADD_CALCULATION: 'ADD_CALCULATION',
  ADD_CREDITS: 'ADD_CREDITS',
  RETIRE_CREDITS: 'RETIRE_CREDITS',
  ADD_RETIREMENT: 'ADD_RETIREMENT',
  SET_EE_SCORES: 'SET_EE_SCORES',
  RESET: 'RESET',
};

const initialState = {
  projects: [],
  activeProjectId: null,
  calculations: [],
  latestCalcByProject: {},
  credits: [],
  retirements: [],
  eeIntegrityScores: {},
  initialized: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.INIT_SEED: {
      const { projects, calculations, credits, retirements } = action.payload;
      const latestCalcByProject = {};
      calculations.forEach(c => {
        if (!latestCalcByProject[c.projectId] || c.timestamp > latestCalcByProject[c.projectId].timestamp) {
          latestCalcByProject[c.projectId] = c;
        }
      });
      return { ...state, projects, calculations, credits, retirements, latestCalcByProject, initialized: true };
    }
    case ACTIONS.ADD_PROJECT:
      return { ...state, projects: [...state.projects, action.payload] };
    case ACTIONS.UPDATE_PROJECT:
      return { ...state, projects: state.projects.map(p => p.id === action.payload.id ? { ...p, ...action.payload.updates } : p) };
    case ACTIONS.SET_ACTIVE_PROJECT:
      return { ...state, activeProjectId: action.payload };
    case ACTIONS.ADD_CALCULATION: {
      const calc = action.payload;
      return {
        ...state,
        calculations: [...state.calculations, calc],
        latestCalcByProject: { ...state.latestCalcByProject, [calc.projectId]: calc },
      };
    }
    case ACTIONS.ADD_CREDITS:
      return { ...state, credits: [...state.credits, ...action.payload] };
    case ACTIONS.RETIRE_CREDITS:
      return {
        ...state,
        credits: state.credits.map(c => action.payload.creditIds.includes(c.id) ? { ...c, status: 'Retired' } : c),
      };
    case ACTIONS.ADD_RETIREMENT:
      return { ...state, retirements: [...state.retirements, action.payload] };
    case ACTIONS.SET_EE_SCORES:
      return { ...state, eeIntegrityScores: { ...state.eeIntegrityScores, ...action.payload } };
    case ACTIONS.RESET:
      return { ...initialState };
    default:
      return state;
  }
};

/* ══════════════════════════════════════════════════════════════════
   CONTEXT & PROVIDER
   ══════════════════════════════════════════════════════════════════ */
const CarbonCreditContext = createContext(null);

const LS_KEY = 'cc_engine_state';

export function CarbonCreditProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  /* ── Initialize seed data on first mount ── */
  useEffect(() => {
    if (state.initialized) return;
    // Try loading from localStorage
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.projects && parsed.projects.length > 0) {
          dispatch({ type: ACTIONS.INIT_SEED, payload: parsed });
          return;
        }
      }
    } catch (e) { /* ignore parse errors */ }

    // Generate seed data
    const projects = generateSeedProjects();
    const calculations = generateSeedCalculations(projects);
    const credits = generateSeedCredits(projects);
    const retirements = generateSeedRetirements(credits);
    dispatch({ type: ACTIONS.INIT_SEED, payload: { projects, calculations, credits, retirements } });
  }, [state.initialized]);

  /* ── Persist to localStorage on changes ── */
  useEffect(() => {
    if (!state.initialized) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        projects: state.projects,
        calculations: state.calculations.slice(-200), // keep last 200
        credits: state.credits,
        retirements: state.retirements,
      }));
    } catch (e) { /* quota exceeded — silent fail */ }
  }, [state.projects, state.calculations, state.credits, state.retirements, state.initialized]);

  /* ── Action dispatchers ── */
  const addProject = useCallback((project) => dispatch({ type: ACTIONS.ADD_PROJECT, payload: project }), []);
  const updateProject = useCallback((id, updates) => dispatch({ type: ACTIONS.UPDATE_PROJECT, payload: { id, updates } }), []);
  const setActiveProject = useCallback((id) => dispatch({ type: ACTIONS.SET_ACTIVE_PROJECT, payload: id }), []);
  const addCalculation = useCallback((calc) => dispatch({ type: ACTIONS.ADD_CALCULATION, payload: { ...calc, id: `CALC-${Date.now()}`, timestamp: Date.now() } }), []);
  const addCredits = useCallback((credits) => dispatch({ type: ACTIONS.ADD_CREDITS, payload: credits }), []);
  const retireCredits = useCallback((creditIds, beneficiary, purpose) => {
    dispatch({ type: ACTIONS.RETIRE_CREDITS, payload: { creditIds } });
    dispatch({ type: ACTIONS.ADD_RETIREMENT, payload: { id: `RET-${Date.now()}`, creditIds, beneficiary, purpose, status: 'Completed', retirement_date: new Date().toISOString().slice(0, 10) } });
  }, []);
  const setEeScores = useCallback((scores) => dispatch({ type: ACTIONS.SET_EE_SCORES, payload: scores }), []);
  const getLatestCalc = useCallback((projectId) => state.latestCalcByProject[projectId] || null, [state.latestCalcByProject]);
  const reset = useCallback(() => { localStorage.removeItem(LS_KEY); dispatch({ type: ACTIONS.RESET }); }, []);

  /* ══════════════════════════════════════════════════════════════
     COMPUTED AGGREGATES
     ══════════════════════════════════════════════════════════════ */
  const aggregates = useMemo(() => {
    const byFamily = {};
    const byMethodology = {};
    const byRegistry = {};

    state.projects.forEach(p => {
      // By family
      if (!byFamily[p.family]) byFamily[p.family] = { label: p.familyLabel, projects: 0, totalCredits: 0, retired: 0, available: 0, totalValue: 0 };
      byFamily[p.family].projects++;
      byFamily[p.family].totalCredits += p.total_credits_tco2e || 0;
      byFamily[p.family].retired += p.credits_retired_tco2e || 0;
      byFamily[p.family].available += p.credits_available_tco2e || 0;
      byFamily[p.family].totalValue += p.total_value_usd || 0;

      // By methodology
      if (!byMethodology[p.methodology]) byMethodology[p.methodology] = { projects: 0, totalCredits: 0, avgPrice: 0, family: p.family };
      byMethodology[p.methodology].projects++;
      byMethodology[p.methodology].totalCredits += p.total_credits_tco2e || 0;

      // By registry
      if (!byRegistry[p.registry]) byRegistry[p.registry] = { projects: 0, totalCredits: 0, retired: 0 };
      byRegistry[p.registry].projects++;
      byRegistry[p.registry].totalCredits += p.total_credits_tco2e || 0;
      byRegistry[p.registry].retired += p.credits_retired_tco2e || 0;
    });

    const totalCreditsIssued = state.projects.reduce((s, p) => s + (p.total_credits_tco2e || 0), 0);
    const totalCreditsRetired = state.projects.reduce((s, p) => s + (p.credits_retired_tco2e || 0), 0);
    const totalCreditsAvailable = totalCreditsIssued - totalCreditsRetired;
    const totalValue = state.projects.reduce((s, p) => s + (p.total_value_usd || 0), 0);

    return { byFamily, byMethodology, byRegistry, totalCreditsIssued, totalCreditsRetired, totalCreditsAvailable, totalValue };
  }, [state.projects]);

  /* ══════════════════════════════════════════════════════════════
     ADAPTER FUNCTIONS — shape CC data for consuming modules
     ══════════════════════════════════════════════════════════════ */

  /** PCAF adapter: CC credit exposure per holding for financed emissions */
  const adaptForPcaf = useCallback(() => {
    return {
      totalFinancedCredits: aggregates.totalCreditsIssued,
      retiredCredits: aggregates.totalCreditsRetired,
      byAssetClass: Object.entries(aggregates.byFamily).map(([fam, data]) => ({
        assetClass: data.label,
        credits_tco2e: data.totalCredits,
        retired_tco2e: data.retired,
        value_usd: data.totalValue,
        projects: data.projects,
      })),
      creditQualityBreakdown: state.projects.reduce((acc, p) => {
        const tier = p.additionality_score >= 85 ? 'Gold' : p.additionality_score >= 70 ? 'Silver' : p.additionality_score >= 55 ? 'Bronze' : 'Standard';
        acc[tier] = (acc[tier] || 0) + (p.total_credits_tco2e || 0);
        return acc;
      }, {}),
      dataQualityScore: Math.round(state.projects.reduce((s, p) => s + (p.mrv_quality || 0), 0) / Math.max(state.projects.length, 1)),
    };
  }, [aggregates, state.projects]);

  /** Portfolio adapter: CC data for portfolio analytics overlay */
  const adaptForPortfolio = useCallback(() => {
    return {
      summary: {
        totalProjects: state.projects.length,
        totalCredits: aggregates.totalCreditsIssued,
        totalRetired: aggregates.totalCreditsRetired,
        totalAvailable: aggregates.totalCreditsAvailable,
        totalValue: aggregates.totalValue,
        retirementRate: aggregates.totalCreditsIssued > 0 ? Math.round(aggregates.totalCreditsRetired / aggregates.totalCreditsIssued * 100) : 0,
        avgCreditAge: Math.round(state.projects.reduce((s, p) => s + (2026 - (p.vintage_year || 2020)), 0) / Math.max(state.projects.length, 1) * 10) / 10,
      },
      byFamily: Object.entries(aggregates.byFamily).map(([fam, data]) => ({ family: fam, ...data })),
      byRegistry: Object.entries(aggregates.byRegistry).map(([reg, data]) => ({ registry: reg, ...data })),
      byVintage: Array.from({ length: 9 }, (_, i) => {
        const yr = 2016 + i;
        const ps = state.projects.filter(p => p.vintage_year === yr);
        return { vintage: yr, credits: ps.reduce((s, p) => s + (p.total_credits_tco2e || 0), 0), projects: ps.length, avgPrice: ps.length > 0 ? Math.round(ps.reduce((s, p) => s + (p.avg_price_usd || 0), 0) / ps.length * 10) / 10 : 0 };
      }),
      topProjects: [...state.projects].sort((a, b) => (b.total_credits_tco2e || 0) - (a.total_credits_tco2e || 0)).slice(0, 10),
    };
  }, [aggregates, state.projects]);

  /** ESG Ratings adapter: CC credit quality for ESG rating overlay */
  const adaptForEsgRatings = useCallback(() => {
    return {
      avgAdditionality: Math.round(state.projects.reduce((s, p) => s + (p.additionality_score || 0), 0) / Math.max(state.projects.length, 1)),
      avgPermanence: Math.round(state.projects.reduce((s, p) => s + (p.permanence_score || 0), 0) / Math.max(state.projects.length, 1)),
      avgMrvQuality: Math.round(state.projects.reduce((s, p) => s + (p.mrv_quality || 0), 0) / Math.max(state.projects.length, 1)),
      avgLeakageRisk: Math.round(state.projects.reduce((s, p) => s + (p.leakage_risk || 0), 0) / Math.max(state.projects.length, 1)),
      integrityTiers: state.projects.reduce((acc, p) => {
        const tier = p.additionality_score >= 85 ? 'Gold' : p.additionality_score >= 70 ? 'Silver' : p.additionality_score >= 55 ? 'Bronze' : 'Standard';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {}),
      cobenefitsCoverage: ['Community', 'Biodiversity', 'Water', 'Gender', 'Health'].map(cb => ({
        cobenefit: cb,
        projects: state.projects.filter(p => (p.co_benefits || []).includes(cb)).length,
        pct: Math.round(state.projects.filter(p => (p.co_benefits || []).includes(cb)).length / Math.max(state.projects.length, 1) * 100),
      })),
    };
  }, [state.projects]);

  /** Equitable Earth adapter: bidirectional CC↔EE data flow */
  const adaptForEquitableEarth = useCallback(() => {
    const natureProjects = state.projects.filter(p => p.family === 'nature');
    return {
      projectsForScoring: natureProjects.map(p => ({
        id: p.id,
        name: p.name,
        methodology: p.methodology,
        country: p.country,
        area_ha: p.area_ha,
        credits: p.total_credits_tco2e,
        additionality: p.additionality_score,
        permanence: p.permanence_score,
        mrv: p.mrv_quality,
        leakage: p.leakage_risk,
        buffer: p.buffer_pct,
        co_benefits: p.co_benefits,
      })),
      eeScores: state.eeIntegrityScores,
      totalNatureCredits: natureProjects.reduce((s, p) => s + (p.total_credits_tco2e || 0), 0),
    };
  }, [state.projects, state.eeIntegrityScores]);

  /** Regulatory adapter: CC data for CSRD/SFDR/ISSB disclosure */
  const adaptForRegulatory = useCallback(() => {
    return {
      csrd_esrs_e1: {
        total_credits_retired: aggregates.totalCreditsRetired,
        total_credits_purchased: aggregates.totalCreditsIssued,
        projects_with_e1_alignment: state.projects.filter(p => p.csrd_esrs_e1).length,
        removal_credits: state.projects.filter(p => ['nature', 'cdr', 'agriculture'].includes(p.family)).reduce((s, p) => s + (p.total_credits_tco2e || 0), 0),
        reduction_credits: state.projects.filter(p => ['energy', 'waste', 'industrial'].includes(p.family)).reduce((s, p) => s + (p.total_credits_tco2e || 0), 0),
        evidence: state.retirements.map(r => ({ id: r.id, date: r.retirement_date, quantity: r.quantity_tco2e, purpose: r.purpose, confirmation: r.confirmation_id })),
      },
      sfdr_pai: {
        pai_1_ghg_offset: aggregates.totalCreditsRetired,
        pai_6_energy_intensity_offset: state.projects.filter(p => p.family === 'energy').reduce((s, p) => s + (p.total_credits_tco2e || 0), 0),
        taxonomy_aligned_pct: Math.round(state.projects.filter(p => p.eu_taxonomy_aligned).length / Math.max(state.projects.length, 1) * 100),
        sdg_contribution: state.projects.reduce((acc, p) => { (p.co_benefits || []).forEach(cb => { acc[cb] = (acc[cb] || 0) + 1; }); return acc; }, {}),
      },
      issb_s2: {
        scope1_offsets: state.projects.filter(p => state.retirements.some(r => r.projectId === p.id && r.purpose?.includes('Scope 1'))).reduce((s, p) => s + (p.credits_retired_tco2e || 0), 0),
        scope2_offsets: state.projects.filter(p => state.retirements.some(r => r.projectId === p.id && r.purpose?.includes('Scope 2'))).reduce((s, p) => s + (p.credits_retired_tco2e || 0), 0),
        scope3_offsets: state.projects.filter(p => state.retirements.some(r => r.projectId === p.id && r.purpose?.includes('Scope 3'))).reduce((s, p) => s + (p.credits_retired_tco2e || 0), 0),
        total_retired: aggregates.totalCreditsRetired,
        projects_with_issb_alignment: state.projects.filter(p => p.issb_s2).length,
      },
    };
  }, [aggregates, state.projects, state.retirements]);

  /** Climate Stress Test adapter
   * @param {string|null} selectedScenario — NGFS Phase 4 scenario name from TestDataContext;
   *   if provided, the matching scenario is listed first. Defaults to 'Current Policies'.
   */
  const adaptForClimateStressTest = useCallback((selectedScenario = null) => {
    // NGFS Phase 4 calibrated scenario risk factors for voluntary carbon markets
    // Source: NGFS Phase 4 (2023), MSCI Climate VaR, BloombergNEF Carbon Outlook 2024
    const NGFS_SCENARIOS = [
      {
        scenario: 'Current Policies',
        // Low carbon price ⇒ low VCM price pressure; high physical reversal risk
        valueAtRiskPct: 0.08,   // 8% of portfolio AUM at risk
        priceImpactPct: -12.0,  // VCM prices fall ~12% (low demand signal)
        reversalRiskPct: 0.06,  // 6% reversal risk (high physical damage)
      },
      {
        scenario: 'Net Zero 2050',
        // High carbon ambition ⇒ strong VCM demand; low reversal in orderly transition
        valueAtRiskPct: 0.05,
        priceImpactPct: +28.0,  // VCM prices rise ~28% (high compliance demand)
        reversalRiskPct: 0.02,
      },
      {
        scenario: 'Delayed Transition',
        // Late policy shock ⇒ volatile VCM prices; moderate reversal risk
        valueAtRiskPct: 0.18,
        priceImpactPct: -8.0,   // Near-term price suppression before shock
        reversalRiskPct: 0.04,
      },
      {
        scenario: 'Hot House World',
        // No transition ⇒ high physical damage, nature-based reversals surge
        valueAtRiskPct: 0.32,
        priceImpactPct: -25.0,  // Demand collapses as compliance markets fail
        reversalRiskPct: 0.14,
      },
    ];

    // If a selectedScenario is provided (from TestDataContext), surface it first
    const ordered = selectedScenario
      ? [...NGFS_SCENARIOS].sort((a, b) => (a.scenario === selectedScenario ? -1 : b.scenario === selectedScenario ? 1 : 0))
      : NGFS_SCENARIOS;

    return {
      ccExposureByScenario: ordered.map(s => ({
        scenario: s.scenario,
        creditValueAtRisk: Math.round(aggregates.totalValue * s.valueAtRiskPct),
        priceImpactPct: s.priceImpactPct,
        reversalRisk: Math.round(aggregates.totalCreditsIssued * s.reversalRiskPct),
        isSelected: selectedScenario ? s.scenario === selectedScenario : s.scenario === 'Current Policies',
      })),
      permanenceRisk: {
        nature: Math.round(state.projects.filter(p => p.family === 'nature').reduce((s, p) => s + (p.total_credits_tco2e || 0) * (1 - (p.permanence_score || 70) / 100), 0)),
        cdr: Math.round(state.projects.filter(p => p.family === 'cdr').reduce((s, p) => s + (p.total_credits_tco2e || 0) * (1 - (p.permanence_score || 70) / 100), 0)),
      },
    };
  }, [aggregates, state.projects]);

  /** Summary getter */
  const getSummary = useCallback(() => ({
    totalProjects: state.projects.length,
    totalCalculations: state.calculations.length,
    totalCreditsIssued: aggregates.totalCreditsIssued,
    totalCreditsRetired: aggregates.totalCreditsRetired,
    totalCreditsAvailable: aggregates.totalCreditsAvailable,
    totalValue: aggregates.totalValue,
    families: Object.keys(aggregates.byFamily).length,
    methodologies: Object.keys(aggregates.byMethodology).length,
    registries: Object.keys(aggregates.byRegistry).length,
    retirements: state.retirements.length,
  }), [state, aggregates]);

  const getByFamily = useCallback((family) => ({
    projects: state.projects.filter(p => p.family === family),
    calculations: state.calculations.filter(c => c.family === family),
    credits: state.credits.filter(c => state.projects.find(p => p.id === c.projectId)?.family === family),
    ...(aggregates.byFamily[family] || {}),
  }), [state, aggregates]);

  const getByRegistry = useCallback((registry) => ({
    projects: state.projects.filter(p => p.registry === registry),
    credits: state.credits.filter(c => c.registry === registry),
    ...(aggregates.byRegistry[registry] || {}),
  }), [state, aggregates]);

  const getAvailableCredits = useCallback((filters = {}) => {
    let filtered = state.credits.filter(c => c.status === 'Available');
    if (filters.family) filtered = filtered.filter(c => state.projects.find(p => p.id === c.projectId)?.family === filters.family);
    if (filters.registry) filtered = filtered.filter(c => c.registry === filters.registry);
    if (filters.vintage) filtered = filtered.filter(c => c.vintage_year === filters.vintage);
    if (filters.methodology) filtered = filtered.filter(c => c.methodology === filters.methodology);
    return filtered;
  }, [state.credits, state.projects]);

  const value = useMemo(() => ({
    // State
    ...state,
    aggregates,
    // Actions
    addProject, updateProject, setActiveProject,
    addCalculation, getLatestCalc,
    addCredits, retireCredits, getAvailableCredits,
    setEeScores,
    reset,
    // Adapters
    adaptForPcaf, adaptForPortfolio, adaptForEsgRatings,
    adaptForEquitableEarth, adaptForRegulatory, adaptForClimateStressTest,
    // Getters
    getSummary, getByFamily, getByRegistry,
  }), [state, aggregates, addProject, updateProject, setActiveProject, addCalculation, getLatestCalc, addCredits, retireCredits, getAvailableCredits, setEeScores, reset, adaptForPcaf, adaptForPortfolio, adaptForEsgRatings, adaptForEquitableEarth, adaptForRegulatory, adaptForClimateStressTest, getSummary, getByFamily, getByRegistry]);

  return (
    <CarbonCreditContext.Provider value={value}>
      {children}
    </CarbonCreditContext.Provider>
  );
}

export function useCarbonCredit() {
  const ctx = useContext(CarbonCreditContext);
  if (!ctx) throw new Error('useCarbonCredit must be used within CarbonCreditProvider');
  return ctx;
}

export default CarbonCreditContext;
