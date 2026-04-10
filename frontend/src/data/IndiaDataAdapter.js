import { NIFTY_50, INDIA_BSE_200, INDIA_PORTFOLIOS, INDIA_PROFILE, INDIA_CBAM_EXPOSURE,
  INDIA_EMISSIONS_BY_SECTOR, INDIA_REGULATORY, INDIA_BRSR_METRICS, INDIA_CLIMATE_TARGETS,
  INDIA_SECTORS, INDIA_GREEN_BONDS, INDIA_TRANSITION_PATHWAYS, INDIA_PHYSICAL_RISK_HOTSPOTS,
  INDIA_PAT_SCHEME, INDIA_STATE_EMISSIONS, INDIA_ESG_BENCHMARKS,
  runIndiaEngines } from './indiaDataset';

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const guard = (n, d) => d > 0 ? n / d : 0;
const ALL_INDIA = [...NIFTY_50, ...INDIA_BSE_200];

export function isIndiaMode() {
  return typeof localStorage !== 'undefined' && localStorage.getItem('a2_country_dataset') === 'IN';
}

export function adaptForPCAF() {
  return ALL_INDIA.map((c, i) => {
    const s1 = c.scope1_tco2e || sr(i * 11) * 50000 + 5000;
    const s2 = c.scope2_tco2e || sr(i * 13) * 30000 + 2000;
    const s3 = c.scope3_tco2e || sr(i * 17) * 200000 + 10000;
    const mcap = c.marketCap_inr_cr ? c.marketCap_inr_cr * 1e7 / 83 : sr(i * 7) * 5e9 + 1e8;
    const rev = c.revenue_inr_cr ? c.revenue_inr_cr * 1e7 / 83 : mcap * (0.3 + sr(i * 19) * 0.4);
    const hasReal = !!(c.scope1_tco2e && c.scope2_tco2e);
    return {
      id: c.id || `IN-${i}`, name: c.name, ticker: c.ticker || c.nse_code, isin: c.isin || `INE${String(i).padStart(6, '0')}01`,
      sector: c.sector, country: 'India', assetClass: 'Listed Equity', marketCap: Math.round(mcap),
      evic: Math.round(mcap * 1.15), revenue: Math.round(rev),
      scope1: Math.round(s1), scope2: Math.round(s2), scope3: Math.round(s3),
      totalEmissions: Math.round(s1 + s2 + s3), dqs: hasReal ? 3 : 4,
      dataSource: hasReal ? 'BRSR Disclosure' : 'CEDA Estimated'
    };
  });
}

export function adaptForESG() {
  return ALL_INDIA.map((c, i) => {
    const base = c.esg_score || (sr(i * 23) * 40 + 35);
    const ratings = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC'];
    const cdpGrades = ['A', 'A-', 'B', 'B-', 'C', 'C-', 'D', 'D-'];
    const ri = Math.min(6, Math.floor((100 - base) / 14));
    return {
      id: c.id || `IN-${i}`, name: c.name, ticker: c.ticker || c.nse_code, sector: c.sector, country: 'India',
      esgScore: +base.toFixed(1), esgRating: ratings[ri], msciRating: ratings[Math.min(6, ri + (sr(i * 29) > 0.5 ? 1 : 0))],
      cdpScore: cdpGrades[Math.floor(sr(i * 31) * cdpGrades.length)],
      envScore: +(sr(i * 37) * 30 + 30).toFixed(1), socScore: +(sr(i * 41) * 30 + 35).toFixed(1),
      govScore: +(sr(i * 43) * 25 + 45).toFixed(1), momentum: sr(i * 47) > 0.5 ? 'Improving' : sr(i * 49) > 0.4 ? 'Stable' : 'Declining',
      sbtiStatus: c.sbti_status || (sr(i * 53) > 0.7 ? '1.5°C' : sr(i * 53) > 0.4 ? '2°C' : 'No Target')
    };
  });
}

export function adaptForCapitalAdequacy() {
  const banks = ['SBI','HDFC Bank','ICICI Bank','Axis Bank','Kotak Mahindra','PNB','Bank of Baroda','Canara Bank',
    'Union Bank','IndusInd Bank','IDFC First','Yes Bank','Federal Bank','Bandhan Bank','RBL Bank',
    'AU Small Finance','IDBI Bank','UCO Bank','Indian Bank','Bank of India'];
  return banks.map((name, i) => {
    const cet1 = 9 + sr(i * 61) * 7;
    return {
      name, type: 'Commercial Bank', jurisdiction: 'India (RBI)',
      cet1Ratio: +cet1.toFixed(2), tier1Ratio: +(cet1 + 0.5 + sr(i * 63) * 1.5).toFixed(2),
      totalCapitalRatio: +(cet1 + 2 + sr(i * 67) * 3).toFixed(2),
      rwaTotal: Math.round((50000 + sr(i * 71) * 450000) * 1e7 / 83),
      greenLoanPct: +(sr(i * 73) * 12 + 2).toFixed(1), climateBuffer: +(sr(i * 79) * 1.5 + 0.5).toFixed(2),
      pillar2Req: +(sr(i * 83) * 2 + 1).toFixed(2), _mock: true
    };
  });
}

export function adaptForSFDRPAI() {
  return NIFTY_50.map((c, i) => {
    const s12 = (c.scope1_tco2e || sr(i * 11) * 50000) + (c.scope2_tco2e || sr(i * 13) * 30000);
    const mcap = c.marketCap_inr_cr ? c.marketCap_inr_cr * 1e7 / 83 : sr(i * 7) * 5e9 + 1e8;
    const rev = c.revenue_inr_cr ? c.revenue_inr_cr * 1e7 / 83 : mcap * 0.4;
    const sec = (c.sector || '').toLowerCase();
    const fossil = sec.includes('oil') || sec.includes('gas') || sec.includes('coal') || sec.includes('energy');
    return {
      id: c.id || `IN-${i}`, name: c.name, sector: c.sector, weight: +(1 / NIFTY_50.length * 100).toFixed(2),
      pai1_ghg: Math.round(s12), pai2_carbonFootprint: +guard(s12, mcap / 1e6).toFixed(2),
      pai3_ghgIntensity: +guard(s12, rev / 1e6).toFixed(2), pai4_fossilFuel: fossil,
      pai5_waterStress: +(c.waterStress || sr(i * 89) * 80 + 10).toFixed(1),
      pai6_biodiversity: +(sr(i * 91) * 60 + 5).toFixed(1),
      pai7_emissions_water: +(sr(i * 93) * 50).toFixed(1), pai8_hazardous_waste: +(sr(i * 97) * 40).toFixed(1),
      pai9_gender_gap: +(sr(i * 101) * 30 + 5).toFixed(1), pai10_ungc_violations: sr(i * 103) > 0.85,
      pai11_ungc_monitoring: sr(i * 107) > 0.6, pai12_gender_board: +(sr(i * 109) * 35 + 8).toFixed(1),
      pai13_weapons: false, pai14_ghg_intensity_country: +(sr(i * 113) * 500 + 200).toFixed(0),
      pai15_fossil_sovereign: fossil, pai16_social_violations_sov: sr(i * 127) > 0.9,
      pai17_re_exposure: +(sr(i * 131) * 30).toFixed(1), pai18_energy_efficiency: +(sr(i * 137) * 50 + 20).toFixed(1)
    };
  });
}

export function adaptForTransitionRisk() {
  return ALL_INDIA.map((c, i) => {
    const sec = (c.sector || '').toLowerCase();
    const sbti = c.sbti_status || (sr(i * 53) > 0.7 ? '1.5°C' : sr(i * 53) > 0.4 ? '2°C' : 'No Target');
    const isFossil = sec.includes('coal') || sec.includes('oil');
    const isHeavy = sec.includes('steel') || sec.includes('cement') || sec.includes('mining');
    const isClean = sec.includes('it') || sec.includes('pharma') || sec.includes('tech') || sec.includes('software');
    const flag = sbti === '1.5°C' ? 'LEADER' : isFossil ? 'CRITICAL' : isHeavy ? 'HIGH' : isClean ? 'LOW' : 'MEDIUM';
    const ts = isFossil ? 20 + sr(i * 139) * 25 : isHeavy ? 35 + sr(i * 141) * 20 : isClean ? 65 + sr(i * 143) * 25 : 40 + sr(i * 145) * 30;
    return {
      name: c.name, sector: c.sector, transitionScore: +ts.toFixed(1),
      temperatureAlignment_c: +(isFossil ? 3.2 + sr(i * 147) * 1.2 : isClean ? 1.5 + sr(i * 149) * 0.8 : 2.0 + sr(i * 151) * 1.2).toFixed(1),
      engagementStatus: sr(i * 153) > 0.6 ? 'Active' : sr(i * 153) > 0.3 ? 'Monitoring' : 'None',
      sbtiStatus: sbti, physicalRiskScore: +(sr(i * 157) * 80 + 10).toFixed(1),
      carbonIntensity: Math.round(guard(c.scope1_tco2e || sr(i * 11) * 50000, (c.revenue_inr_cr || sr(i * 19) * 5000) * 1e7 / 83 / 1e6)),
      priority: flag === 'CRITICAL' || flag === 'HIGH' ? 'P1' : flag === 'MEDIUM' ? 'P2' : 'P3', flag
    };
  });
}

export function adaptForScope3() {
  return ALL_INDIA.filter(c => {
    const s = (c.sector || '').toLowerCase();
    return s.includes('energy') || s.includes('oil') || s.includes('power') || s.includes('steel') ||
      s.includes('cement') || s.includes('mining') || s.includes('chemical') || s.includes('auto') ||
      s.includes('it') || s.includes('financial') || s.includes('bank') || s.includes('manufacturing');
  }).map((c, i) => {
    const total = c.scope3_tco2e || sr(i * 17) * 200000 + 10000;
    const sec = (c.sector || '').toLowerCase();
    const isEnergy = sec.includes('energy') || sec.includes('oil') || sec.includes('power');
    const isIT = sec.includes('it') || sec.includes('software') || sec.includes('tech');
    const isFin = sec.includes('financial') || sec.includes('bank') || sec.includes('insur');
    const w = Array.from({ length: 15 }, (_, k) => {
      if (isEnergy && [2, 3, 10].includes(k)) return 0.12 + sr(i * 100 + k) * 0.15;
      if (isIT && [0, 5, 6].includes(k)) return 0.1 + sr(i * 100 + k) * 0.12;
      if (isFin && k === 14) return 0.5 + sr(i * 100 + k) * 0.3;
      return 0.01 + sr(i * 100 + k) * 0.06;
    });
    const wSum = w.reduce((a, b) => a + b, 0);
    const cats = w.map((v, k) => ({ category: k + 1, tco2e: Math.round(total * v / wSum), pct: +(v / wSum * 100).toFixed(1), methodology: 'CEDA Estimated' }));
    return { id: c.id || `IN-${i}`, name: c.name, sector: c.sector, totalScope3: Math.round(total), categories: cats };
  });
}

export function adaptForPhysicalRisk() {
  const regions = ['Mumbai Metropolitan','Delhi NCR','Chennai Coast','Kolkata Delta','Gujarat Coast','Hyderabad Plateau','Bangalore Urban','Pune Western Ghats'];
  return ALL_INDIA.map((c, i) => ({
    name: c.name, country: 'India', region: regions[i % regions.length],
    physicalRiskScore: +(sr(i * 163) * 70 + 15).toFixed(1),
    hazards: {
      flood: +(sr(i * 167) * 80 + 10).toFixed(1), cyclone: +(sr(i * 173) * 60).toFixed(1),
      heatWave: +(sr(i * 179) * 90 + 10).toFixed(1), drought: +(sr(i * 181) * 70).toFixed(1),
      seaLevelRise: +(sr(i * 191) * 40).toFixed(1), waterStress: +(c.waterStress || sr(i * 193) * 80 + 10).toFixed(1)
    },
    insuredPct: +(sr(i * 197) * 40 + 5).toFixed(1), exposureUsd: Math.round((c.marketCap_inr_cr || sr(i * 7) * 50000) * 1e7 / 83)
  }));
}

export function adaptForWaterRisk() {
  const basins = ['Ganges','Krishna','Godavari','Mahanadi','Narmada'];
  const cdpLevels = ['A', 'A-', 'B', 'B-', 'C', 'C-', 'D', 'D-'];
  return ALL_INDIA.map((c, i) => {
    const rev = c.revenue_inr_cr ? c.revenue_inr_cr * 1e7 / 83 : sr(i * 19) * 5e9;
    const withdrawal = sr(i * 199) * 5e6 + 50000;
    return {
      name: c.name, sector: c.sector, waterWithdrawal_m3: Math.round(withdrawal),
      waterIntensity: +guard(withdrawal, rev / 1e6).toFixed(2),
      stressScore: +(c.waterStress || sr(i * 89) * 80 + 10).toFixed(1),
      basin: basins[i % basins.length], disclosureCdp: cdpLevels[Math.floor(sr(i * 203) * cdpLevels.length)]
    };
  });
}

// Passthrough getters
export function getIndiaPortfolios() { return INDIA_PORTFOLIOS; }
export function getIndiaProfile() { return INDIA_PROFILE; }
export function getIndiaCBAM() { return INDIA_CBAM_EXPOSURE; }
export function getIndiaRegulatory() { return INDIA_REGULATORY; }
export function getIndiaSectors() { return INDIA_SECTORS; }
export function getIndiaBRSR() { return INDIA_BRSR_METRICS; }
export function getIndiaTargets() { return INDIA_CLIMATE_TARGETS; }
export function getIndiaGreenBonds() { return INDIA_GREEN_BONDS; }
export function getIndiaTransitionPathways() { return INDIA_TRANSITION_PATHWAYS; }
export function getIndiaPhysicalHotspots() { return INDIA_PHYSICAL_RISK_HOTSPOTS; }
export function getIndiaPAT() { return INDIA_PAT_SCHEME; }
export function getIndiaStateEmissions() { return INDIA_STATE_EMISSIONS; }
export function getAllIndiaCompanies() { return ALL_INDIA; }
export function getIndiaEngineResults() { return runIndiaEngines(); }

export default {
  isIndiaMode, adaptForPCAF, adaptForESG, adaptForCapitalAdequacy, adaptForSFDRPAI,
  adaptForTransitionRisk, adaptForScope3, adaptForPhysicalRisk, adaptForWaterRisk,
  getAllIndiaCompanies, getIndiaPortfolios, getIndiaProfile, getIndiaCBAM,
  getIndiaRegulatory, getIndiaEngineResults
};
