/**
 * CEA Grid Emission Factors — India
 * Source: Central Electricity Authority, CO2 Baseline Database (v19, 2024)
 * URL: https://cea.nic.in/wp-content/uploads/baseline/2024/01/Approved_report_V19.pdf
 * Unit: tCO2/MWh (or kgCO2/kWh)
 */

// National weighted average grid emission factor (combined margin)
export const CEA_NATIONAL_GRID_EF = {
  // Historical series (tCO2/MWh)
  2014: 0.82, 2015: 0.82, 2016: 0.82, 2017: 0.79, 2018: 0.79,
  2019: 0.76, 2020: 0.73, 2021: 0.71, 2022: 0.71, 2023: 0.69, 2024: 0.67,
  // Projections (estimated based on India's RE trajectory)
  2025: 0.65, 2026: 0.62, 2027: 0.59, 2028: 0.55, 2029: 0.51, 2030: 0.47,
  unit: 'tCO2/MWh',
  source: 'CEA CO2 Baseline Database v19 (2024) + projections',
  dataSource: 'real (historical) / estimated (projections)',
};

// Regional grid emission factors (5 Indian grids, now unified as one national grid since 2014)
// But state-level variation exists due to generation mix
export const CEA_STATE_GRID_EF = [
  // High RE states (lower EF)
  { state: 'Karnataka', code: 'KA', ef_tco2_mwh: 0.52, re_share_pct: 65, source: 'real' },
  { state: 'Tamil Nadu', code: 'TN', ef_tco2_mwh: 0.55, re_share_pct: 55, source: 'real' },
  { state: 'Gujarat', code: 'GJ', ef_tco2_mwh: 0.58, re_share_pct: 48, source: 'real' },
  { state: 'Rajasthan', code: 'RJ', ef_tco2_mwh: 0.56, re_share_pct: 52, source: 'real' },
  { state: 'Andhra Pradesh', code: 'AP', ef_tco2_mwh: 0.54, re_share_pct: 58, source: 'real' },
  { state: 'Maharashtra', code: 'MH', ef_tco2_mwh: 0.62, re_share_pct: 38, source: 'estimated' },
  { state: 'Madhya Pradesh', code: 'MP', ef_tco2_mwh: 0.68, re_share_pct: 28, source: 'estimated' },
  { state: 'Telangana', code: 'TS', ef_tco2_mwh: 0.60, re_share_pct: 40, source: 'estimated' },
  // Coal-heavy states (higher EF)
  { state: 'Chhattisgarh', code: 'CG', ef_tco2_mwh: 0.88, re_share_pct: 8, source: 'estimated' },
  { state: 'Jharkhand', code: 'JH', ef_tco2_mwh: 0.90, re_share_pct: 5, source: 'estimated' },
  { state: 'Odisha', code: 'OD', ef_tco2_mwh: 0.85, re_share_pct: 10, source: 'estimated' },
  { state: 'West Bengal', code: 'WB', ef_tco2_mwh: 0.82, re_share_pct: 12, source: 'estimated' },
  { state: 'Uttar Pradesh', code: 'UP', ef_tco2_mwh: 0.78, re_share_pct: 18, source: 'estimated' },
  { state: 'Bihar', code: 'BR', ef_tco2_mwh: 0.84, re_share_pct: 8, source: 'estimated' },
  { state: 'Punjab', code: 'PB', ef_tco2_mwh: 0.72, re_share_pct: 22, source: 'estimated' },
  { state: 'Haryana', code: 'HR', ef_tco2_mwh: 0.74, re_share_pct: 20, source: 'estimated' },
  // Hydro-dominated (very low EF)
  { state: 'Himachal Pradesh', code: 'HP', ef_tco2_mwh: 0.15, re_share_pct: 92, source: 'estimated' },
  { state: 'Sikkim', code: 'SK', ef_tco2_mwh: 0.10, re_share_pct: 98, source: 'estimated' },
  { state: 'Arunachal Pradesh', code: 'AR', ef_tco2_mwh: 0.12, re_share_pct: 95, source: 'estimated' },
  { state: 'Uttarakhand', code: 'UK', ef_tco2_mwh: 0.22, re_share_pct: 85, source: 'estimated' },
  { state: 'Kerala', code: 'KL', ef_tco2_mwh: 0.38, re_share_pct: 60, source: 'estimated' },
  { state: 'Delhi', code: 'DL', ef_tco2_mwh: 0.75, re_share_pct: 15, source: 'estimated' },
];

// Fuel-specific emission factors (for Scope 1)
export const INDIA_FUEL_EF = [
  { fuel: 'Coal (Indian avg)', ef_kgco2_kg: 2.42, ef_kgco2_kwh: 0.98, unit: 'kgCO2/kg', source: 'CEA/IPCC' },
  { fuel: 'Lignite', ef_kgco2_kg: 1.89, ef_kgco2_kwh: 1.15, unit: 'kgCO2/kg', source: 'CEA' },
  { fuel: 'Natural Gas', ef_kgco2_m3: 2.02, ef_kgco2_kwh: 0.42, unit: 'kgCO2/m\u00B3', source: 'IPCC' },
  { fuel: 'Diesel', ef_kgco2_l: 2.68, unit: 'kgCO2/litre', source: 'IPCC' },
  { fuel: 'Petrol', ef_kgco2_l: 2.31, unit: 'kgCO2/litre', source: 'IPCC' },
  { fuel: 'LPG', ef_kgco2_kg: 2.98, unit: 'kgCO2/kg', source: 'IPCC' },
  { fuel: 'Fuel Oil', ef_kgco2_l: 3.10, unit: 'kgCO2/litre', source: 'IPCC' },
  { fuel: 'Kerosene', ef_kgco2_l: 2.54, unit: 'kgCO2/litre', source: 'IPCC' },
  { fuel: 'Biomass (carbon neutral)', ef_kgco2_kg: 0, unit: 'kgCO2/kg', source: 'GHG Protocol' },
  { fuel: 'Solar PV', ef_kgco2_kwh: 0.02, unit: 'kgCO2/kWh lifecycle', source: 'IPCC AR6' },
  { fuel: 'Wind', ef_kgco2_kwh: 0.01, unit: 'kgCO2/kWh lifecycle', source: 'IPCC AR6' },
  { fuel: 'Nuclear', ef_kgco2_kwh: 0.005, unit: 'kgCO2/kWh lifecycle', source: 'IPCC AR6' },
];

// PAT scheme sector-specific energy benchmarks
export const PAT_SECTOR_BENCHMARKS = [
  { sector: 'Thermal Power', secCode: 'TPP', benchmark_mtoe: 0.868, unit: 'tOE/MWh', entities: 144 },
  { sector: 'Iron & Steel', secCode: 'ISP', benchmark_gj: 5.67, unit: 'GJ/tonne crude steel', entities: 67 },
  { sector: 'Cement', secCode: 'CEM', benchmark_kwh: 72, unit: 'kWh/tonne clinker', entities: 85 },
  { sector: 'Aluminum', secCode: 'ALU', benchmark_kwh: 14800, unit: 'kWh/tonne', entities: 10 },
  { sector: 'Fertilizer', secCode: 'FER', benchmark_gcal: 5.5, unit: 'Gcal/tonne urea', entities: 29 },
  { sector: 'Textiles', secCode: 'TEX', benchmark_toe: 0.034, unit: 'tOE/tonne production', entities: 90 },
  { sector: 'Pulp & Paper', secCode: 'PAP', benchmark_toe: 0.38, unit: 'tOE/tonne', entities: 31 },
  { sector: 'Petrochemicals', secCode: 'PET', benchmark_toe: 0.55, unit: 'tOE/tonne', entities: 39 },
  { sector: 'Chlor-Alkali', secCode: 'CHL', benchmark_kwh: 2600, unit: 'kWh/tonne caustic', entities: 22 },
  { sector: 'Railways', secCode: 'RLY', benchmark_kwh: 19, unit: 'kWh/1000 NTKM', entities: 1 },
  { sector: 'DISCOMs', secCode: 'DIS', benchmark_pct: 18.5, unit: '% AT&C losses', entities: 72 },
  { sector: 'Petroleum Refining', secCode: 'REF', benchmark_mbt: 64, unit: 'MBT/BBL', entities: 18 },
];

// Lookup functions
export function getGridEF(year) {
  return CEA_NATIONAL_GRID_EF[year] || CEA_NATIONAL_GRID_EF[2024];
}

export function getStateGridEF(stateCode) {
  return CEA_STATE_GRID_EF.find(s => s.code === stateCode) || { ef_tco2_mwh: CEA_NATIONAL_GRID_EF[2024] };
}

export function getFuelEF(fuelName) {
  return INDIA_FUEL_EF.find(f => f.fuel.toLowerCase().includes(fuelName.toLowerCase())) || null;
}

export function getPATBenchmark(sectorCode) {
  return PAT_SECTOR_BENCHMARKS.find(s => s.secCode === sectorCode) || null;
}

export default { CEA_NATIONAL_GRID_EF, CEA_STATE_GRID_EF, INDIA_FUEL_EF, PAT_SECTOR_BENCHMARKS, getGridEF, getStateGridEF, getFuelEF, getPATBenchmark };
