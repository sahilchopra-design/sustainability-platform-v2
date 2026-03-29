/**
 * moduleDataInjector.js — Pre-populated data hooks for domain modules
 *
 * Each hook pulls from the shared PortfolioContext and returns
 * domain-specific data slices adapted for the target module family.
 * Modules call these instead of generating their own inline mock data.
 *
 * Usage:
 *   import { useEsgRatingsData } from '../data/moduleDataInjector';
 *   const ratings = useEsgRatingsData();
 */

import { useMemo } from 'react';
import { usePortfolio } from '../context/PortfolioContext';

// ── Deterministic seed helper (matches masterUniverse) ──────────────────
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const num = (v, fb = 0) => (v != null && !isNaN(v) ? +v : fb);
const pick = (arr, seed) => arr[Math.floor(sr(seed) * arr.length)];


// ═══════════════════════════════════════════════════════════════════════════
// 1. ESG Ratings modules (Comparator, Migration, Greenwashing, etc.)
// ═══════════════════════════════════════════════════════════════════════════

export function useEsgRatingsData() {
  const { equities, adaptForEsgRatings } = usePortfolio();
  return useMemo(() => adaptForEsgRatings(equities.slice(0, 150)), [equities, adaptForEsgRatings]);
}


// ═══════════════════════════════════════════════════════════════════════════
// 2. PCAF Financed Emissions modules
// ═══════════════════════════════════════════════════════════════════════════

export function usePcafData() {
  const { securities, holdings, adaptForPcaf } = usePortfolio();
  return useMemo(() => adaptForPcaf(securities, holdings), [securities, holdings, adaptForPcaf]);
}


// ═══════════════════════════════════════════════════════════════════════════
// 3. Climate Stress Test modules
// ═══════════════════════════════════════════════════════════════════════════

export function useStressTestData() {
  const { securities, ngfsScenarios, adaptForStressTest } = usePortfolio();
  return useMemo(() => ({
    companies: adaptForStressTest(securities.slice(0, 80)),
    scenarios: ngfsScenarios,
  }), [securities, ngfsScenarios, adaptForStressTest]);
}


// ═══════════════════════════════════════════════════════════════════════════
// 4. Regulatory modules (CSRD, SFDR, ISSB, UK SDR, SEC)
// ═══════════════════════════════════════════════════════════════════════════

export function useRegulatoryData() {
  const { securities, regulatoryThresholds, taxonomyThresholds } = usePortfolio();
  return useMemo(() => {
    const slice = securities.slice(0, 120);
    return {
      companies: slice.map((c, i) => ({
        id: c.id, name: c.name, sector: c.sector, country: c.country,
        revenue: num(c.revenue),
        taxonomyAligned: num(c.taxonomyAlignment, sr(i * 31) * 60),
        csrdReady: sr(i * 43) > 0.4,
        sfdrPai: c.totalEmissions > 0,
        issReporting: sr(i * 57) > 0.5,
        scope1: num(c.scope1Emissions),
        scope2: num(c.scope2Emissions),
        scope3: num(c.scope3Emissions),
        totalEmissions: num(c.totalEmissions),
        waterWithdrawal: +(sr(i * 71) * 500).toFixed(1),
        wasteGenerated: +(sr(i * 73) * 200).toFixed(1),
        genderPayGap: +(sr(i * 79) * 25).toFixed(1),
        boardDiversity: num(c.boardDiversity, +(sr(i * 83) * 50).toFixed(1)),
      })),
      thresholds: regulatoryThresholds,
      taxonomy: taxonomyThresholds,
    };
  }, [securities, regulatoryThresholds, taxonomyThresholds]);
}


// ═══════════════════════════════════════════════════════════════════════════
// 5. Transport & Maritime modules (CII, CORSIA)
// ═══════════════════════════════════════════════════════════════════════════

export function useTransportData() {
  const { emissionFactors, ciiThresholds, corsiaBaselines } = usePortfolio();
  const SHIP_TYPES = ['Bulk Carrier', 'Container Ship', 'Oil Tanker', 'LNG Carrier', 'Ro-Ro', 'General Cargo'];
  const ROUTES = ['Asia-Europe', 'Trans-Pacific', 'Trans-Atlantic', 'Intra-Asia', 'Middle East-Asia'];

  return useMemo(() => ({
    vessels: Array.from({ length: 40 }, (_, i) => ({
      id: `V-${1001 + i}`,
      name: `MV ${pick(['Pacific', 'Atlantic', 'Nordic', 'Orient', 'Southern', 'Arctic'], i)} ${pick(['Star', 'Spirit', 'Dawn', 'Voyager', 'Eagle', 'Pioneer'], i + 50)}`,
      imo: `${9200000 + i * 137}`,
      type: pick(SHIP_TYPES, i * 7),
      dwt: Math.round(20000 + sr(i * 11) * 180000),
      route: pick(ROUTES, i * 13),
      fuelConsumption: +(50 + sr(i * 17) * 200).toFixed(1),
      co2Emissions: +(500 + sr(i * 19) * 4500).toFixed(0),
      ciiRating: pick(['A', 'B', 'C', 'D', 'E'], i * 23),
      attainedCII: +(3 + sr(i * 29) * 12).toFixed(2),
    })),
    emissionFactors: emissionFactors.transport,
    ciiThresholds,
    corsiaBaselines,
    airlines: Array.from({ length: 20 }, (_, i) => ({
      id: `AL-${100 + i}`,
      name: pick(['Global Air', 'SkyWest', 'EuroJet', 'Pacific Wings', 'Atlas Air', 'Nordic Flight'], i),
      rtkMillions: Math.round(1000 + sr(i * 37) * 9000),
      co2Intensity: +(0.5 + sr(i * 41) * 0.4).toFixed(3),
      corsiaOffset: Math.round(sr(i * 43) * 50000),
    })),
  }), [emissionFactors, ciiThresholds, corsiaBaselines]);
}


// ═══════════════════════════════════════════════════════════════════════════
// 6. Sovereign / Country-level modules
// ═══════════════════════════════════════════════════════════════════════════

export function useSovereignData() {
  const { sovereignHoldings, gridIntensity, carbonPrices, temperaturePathways } = usePortfolio();
  return useMemo(() => ({
    holdings: sovereignHoldings,
    countries: gridIntensity.map((g, i) => ({
      ...g,
      ndcTarget: +(20 + sr(i * 51) * 60).toFixed(0),
      ndcBaseYear: 2005 + Math.floor(sr(i * 53) * 10),
      debtToGdp: +(30 + sr(i * 59) * 90).toFixed(1),
      greenBondIssuance: +(sr(i * 61) * 15).toFixed(2),
      climateVulnerability: +(sr(i * 67) * 100).toFixed(1),
    })),
    carbonPrices,
    temperaturePathways,
  }), [sovereignHoldings, gridIntensity, carbonPrices, temperaturePathways]);
}


// ═══════════════════════════════════════════════════════════════════════════
// 7. Real Estate modules (CRREM, Green Building)
// ═══════════════════════════════════════════════════════════════════════════

export function useRealEstateData() {
  const { reHoldings } = usePortfolio();
  const TYPES = ['Office', 'Retail', 'Industrial', 'Residential', 'Mixed-Use', 'Data Centre'];
  const CERTS = ['BREEAM Outstanding', 'BREEAM Excellent', 'LEED Platinum', 'LEED Gold', 'NABERS 5-Star', 'None'];

  return useMemo(() => ({
    holdings: reHoldings,
    properties: Array.from({ length: 50 }, (_, i) => ({
      id: `RE-${2001 + i}`,
      name: `${pick(['Tower', 'Plaza', 'Centre', 'Park', 'House', 'Court'], i)} ${pick(['One', 'Two', 'West', 'East', 'North', 'Central'], i + 30)}`,
      type: pick(TYPES, i * 7),
      sqm: Math.round(2000 + sr(i * 11) * 48000),
      country: pick(['UK', 'DE', 'FR', 'NL', 'US', 'SG', 'AU'], i * 13),
      epcRating: pick(['A', 'B', 'C', 'D', 'E'], i * 17),
      energyIntensity: +(80 + sr(i * 19) * 220).toFixed(1),
      co2Intensity: +(15 + sr(i * 23) * 85).toFixed(1),
      certification: pick(CERTS, i * 29),
      strandingYear: 2025 + Math.floor(sr(i * 31) * 20),
      retrofitCost: +(sr(i * 37) * 5).toFixed(2),
    })),
  }), [reHoldings]);
}


// ═══════════════════════════════════════════════════════════════════════════
// 8. Nature & Biodiversity modules
// ═══════════════════════════════════════════════════════════════════════════

export function useNatureData() {
  const { securities } = usePortfolio();
  const BIOMES = ['Tropical Forest', 'Temperate Forest', 'Grassland', 'Wetland', 'Marine', 'Freshwater', 'Coral Reef'];
  const DRIVERS = ['Land Use Change', 'Overexploitation', 'Pollution', 'Invasive Species', 'Climate Change'];

  return useMemo(() => {
    const slice = securities.slice(0, 100);
    return {
      companies: slice.map((c, i) => ({
        id: c.id, name: c.name, sector: c.sector, country: c.country,
        biodiversityFootprint: +(sr(i * 41) * 1000).toFixed(0),
        deforestationRisk: pick(['High', 'Medium', 'Low', 'Negligible'], i * 43),
        waterStress: pick(['Extremely High', 'High', 'Medium-High', 'Low-Medium', 'Low'], i * 47),
        dependencyScore: +(sr(i * 51) * 100).toFixed(1),
        impactScore: +(sr(i * 53) * 100).toFixed(1),
        primaryBiome: pick(BIOMES, i * 57),
        primaryDriver: pick(DRIVERS, i * 59),
        tnfdAligned: sr(i * 61) > 0.6,
        sbtnCommitted: sr(i * 67) > 0.7,
      })),
      biomes: BIOMES,
      drivers: DRIVERS,
    };
  }, [securities]);
}


// ═══════════════════════════════════════════════════════════════════════════
// 9. Insurance modules (Climate Underwriting)
// ═══════════════════════════════════════════════════════════════════════════

export function useInsuranceData() {
  const { securities } = usePortfolio();
  const PERILS = ['Flood', 'Wildfire', 'Hurricane', 'Drought', 'Sea-Level Rise', 'Heatwave'];
  const LINES = ['Property', 'Casualty', 'Marine', 'Energy', 'Agriculture', 'D&O'];

  return useMemo(() => ({
    exposures: Array.from({ length: 60 }, (_, i) => ({
      id: `INS-${3001 + i}`,
      insured: securities[i % securities.length]?.name || `Entity ${i}`,
      line: pick(LINES, i * 7),
      peril: pick(PERILS, i * 11),
      grossExposure: +(10 + sr(i * 13) * 490).toFixed(1),
      expectedLoss: +(0.5 + sr(i * 17) * 20).toFixed(2),
      climateLoadingPct: +(sr(i * 19) * 35).toFixed(1),
      riskScore: +(sr(i * 23) * 100).toFixed(0),
      region: pick(['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Africa'], i * 29),
      returnPeriod: pick([10, 25, 50, 100, 200, 500], i * 31),
    })),
    perils: PERILS,
    linesOfBusiness: LINES,
  }), [securities]);
}


// ═══════════════════════════════════════════════════════════════════════════
// 10. Supply Chain modules
// ═══════════════════════════════════════════════════════════════════════════

export function useSupplyChainData() {
  const { securities } = usePortfolio();
  const TIERS = ['Tier 1 Direct', 'Tier 2 Sub-supplier', 'Tier 3 Raw Material'];
  const RISKS = ['Forced Labour', 'Child Labour', 'Environmental Damage', 'Corruption', 'Health & Safety'];

  return useMemo(() => {
    const slice = securities.slice(0, 80);
    return {
      companies: slice.map((c, i) => ({
        id: c.id, name: c.name, sector: c.sector, country: c.country,
        supplierCount: Math.round(50 + sr(i * 41) * 950),
        scope3Pct: +(sr(i * 43) * 85 + 10).toFixed(1),
        riskHotspots: Math.round(sr(i * 47) * 12),
        traceabilityPct: +(sr(i * 51) * 80 + 10).toFixed(1),
      })),
      suppliers: Array.from({ length: 120 }, (_, i) => ({
        id: `SUP-${5001 + i}`,
        name: `${pick(['Global', 'Eastern', 'Western', 'Pacific', 'Nordic'], i)} ${pick(['Materials', 'Components', 'Industries', 'Resources', 'Trade'], i + 20)}`,
        tier: pick(TIERS, i * 7),
        country: pick(['CN', 'IN', 'VN', 'BD', 'ID', 'TH', 'MX', 'BR', 'TR', 'PH'], i * 11),
        riskType: pick(RISKS, i * 13),
        riskScore: +(sr(i * 17) * 100).toFixed(0),
        auditDate: `2024-${String(1 + Math.floor(sr(i * 19) * 12)).padStart(2, '0')}-${String(1 + Math.floor(sr(i * 23) * 28)).padStart(2, '0')}`,
        compliant: sr(i * 29) > 0.35,
      })),
      tiers: TIERS,
      riskCategories: RISKS,
    };
  }, [securities]);
}


// ═══════════════════════════════════════════════════════════════════════════
// 11. Carbon Markets modules (Article 6, Voluntary, ETS)
// ═══════════════════════════════════════════════════════════════════════════

export function useCarbonMarketData() {
  const { carbonPrices } = usePortfolio();
  const PROJECT_TYPES = ['Renewable Energy', 'Forestry/REDD+', 'Cookstoves', 'Methane Capture', 'Direct Air Capture', 'Blue Carbon'];
  const STANDARDS = ['Verra VCS', 'Gold Standard', 'ACR', 'CAR', 'CDM', 'Article 6.4'];
  const VINTAGES = [2019, 2020, 2021, 2022, 2023, 2024];

  return useMemo(() => ({
    compliancePrices: carbonPrices,
    credits: Array.from({ length: 80 }, (_, i) => ({
      id: `CC-${6001 + i}`,
      projectName: `${pick(['Kalimantan', 'Amazon', 'Sahel', 'Ganges', 'Mekong', 'Congo'], i)} ${pick(PROJECT_TYPES, i * 7)}`,
      type: pick(PROJECT_TYPES, i * 11),
      standard: pick(STANDARDS, i * 13),
      vintage: pick(VINTAGES, i * 17),
      volume: Math.round(1000 + sr(i * 19) * 99000),
      price: +(2 + sr(i * 23) * 48).toFixed(2),
      country: pick(['BR', 'ID', 'IN', 'KE', 'CO', 'PE', 'MZ', 'PG'], i * 29),
      additionalityScore: +(sr(i * 31) * 100).toFixed(0),
      permanenceRisk: pick(['Low', 'Medium', 'High'], i * 37),
      cobenefits: Math.round(1 + sr(i * 41) * 7),
    })),
    projectTypes: PROJECT_TYPES,
    standards: STANDARDS,
  }), [carbonPrices]);
}


// ═══════════════════════════════════════════════════════════════════════════
// 12. Temperature / Net-Zero Alignment modules
// ═══════════════════════════════════════════════════════════════════════════

export function useTemperatureAlignmentData() {
  const { securities, holdings, adaptForTemperatureScore, temperaturePathways } = usePortfolio();
  return useMemo(() => ({
    scored: adaptForTemperatureScore(securities, holdings),
    pathways: temperaturePathways,
  }), [securities, holdings, adaptForTemperatureScore, temperaturePathways]);
}


// ═══════════════════════════════════════════════════════════════════════════
// 13. Governance modules (Board, Executive Pay, Proxy Voting)
// ═══════════════════════════════════════════════════════════════════════════

export function useGovernanceData() {
  const { securities } = usePortfolio();
  const ROLES = ['Chair', 'CEO', 'CFO', 'CRO', 'Lead Independent', 'Audit Chair', 'Non-Executive Director'];

  return useMemo(() => {
    const slice = securities.slice(0, 100);
    return {
      companies: slice.map((c, i) => ({
        id: c.id, name: c.name, sector: c.sector, country: c.country,
        boardSize: Math.round(7 + sr(i * 41) * 8),
        independentPct: +(40 + sr(i * 43) * 55).toFixed(1),
        femalePct: num(c.boardDiversity, +(15 + sr(i * 47) * 40).toFixed(1)),
        avgTenure: +(3 + sr(i * 51) * 9).toFixed(1),
        ceoPayRatio: Math.round(50 + sr(i * 53) * 350),
        sayOnPaySupport: +(60 + sr(i * 57) * 38).toFixed(1),
        esgLinkedPay: sr(i * 59) > 0.45,
        separateChairCeo: sr(i * 61) > 0.5,
      })),
      directors: Array.from({ length: 200 }, (_, i) => ({
        id: `DIR-${7001 + i}`,
        name: `Director ${i + 1}`,
        role: pick(ROLES, i * 7),
        companyId: slice[i % slice.length]?.id,
        company: slice[i % slice.length]?.name,
        independent: sr(i * 11) > 0.4,
        tenure: +(1 + sr(i * 13) * 14).toFixed(1),
        otherBoards: Math.round(sr(i * 17) * 4),
        esgExpertise: sr(i * 19) > 0.5,
        female: sr(i * 23) > 0.5,
      })),
    };
  }, [securities]);
}
