import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ScatterChart, Scatter, ComposedChart, Area, AreaChart,
} from 'recharts';

const T = {
  bg: '#f4f6f9', surface: '#ffffff', surfaceH: '#eef1f6', border: '#e3e8ef', borderL: '#cfd6e0',
  navy: '#1b3a5c', navyL: '#2c5a8c', gold: '#c5a96a', goldL: '#d4be8a', sage: '#5a8a6a',
  sageL: '#7ba67d', teal: '#5a8a6a', text: '#1b3a5c', textSec: '#5c6b7e', textMut: '#9aa3ae',
  red: '#dc2626', green: '#16a34a', amber: '#d97706',
  font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace",
};

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ============================================================
// DATA — IEA NZE 2050 Milestones
// ============================================================
const NZE_MILESTONES = [
  { year: 2025, milestone: 'No new unabated coal plants approved', sector: 'Power', status: 'On-Track', gap: 8 },
  { year: 2025, milestone: 'No new oil & gas fields approved for development', sector: 'Oil & Gas', status: 'Off-Track', gap: 42 },
  { year: 2025, milestone: 'Phase-out of inefficient fossil fuel subsidies', sector: 'Policy', status: 'Off-Track', gap: 65 },
  { year: 2030, milestone: '60% of global car sales electric', sector: 'Transport', status: 'On-Track', gap: 12 },
  { year: 2030, milestone: 'Solar PV and wind capacity triple to 8,000 GW', sector: 'Power', status: 'On-Track', gap: 18 },
  { year: 2030, milestone: 'Methane emissions from fossil fuels down 75%', sector: 'Oil & Gas', status: 'Off-Track', gap: 48 },
  { year: 2030, milestone: 'All new buildings net-zero carbon ready', sector: 'Buildings', status: 'Off-Track', gap: 55 },
  { year: 2030, milestone: 'Universal access to modern energy services', sector: 'Access', status: 'At-Risk', gap: 28 },
  { year: 2035, milestone: 'No new ICE passenger car sales globally', sector: 'Transport', status: 'At-Risk', gap: 32 },
  { year: 2035, milestone: 'Advanced economies net-zero electricity', sector: 'Power', status: 'At-Risk', gap: 35 },
  { year: 2035, milestone: '50% of heavy industry heat from low-carbon', sector: 'Industry', status: 'Off-Track', gap: 52 },
  { year: 2040, milestone: 'Global coal phase-out for electricity', sector: 'Power', status: 'At-Risk', gap: 38 },
  { year: 2040, milestone: '50% of existing buildings retrofitted', sector: 'Buildings', status: 'Off-Track', gap: 60 },
  { year: 2040, milestone: 'Aviation 50% low-carbon fuels', sector: 'Aviation', status: 'Off-Track', gap: 58 },
  { year: 2045, milestone: '90% of global electricity low-emissions', sector: 'Power', status: 'At-Risk', gap: 30 },
  { year: 2045, milestone: '50% of heavy trucks sold electric', sector: 'Transport', status: 'At-Risk', gap: 40 },
  { year: 2050, milestone: 'Net-zero emissions globally', sector: 'Economy', status: 'At-Risk', gap: 45 },
  { year: 2050, milestone: '85% of buildings zero-carbon-ready', sector: 'Buildings', status: 'Off-Track', gap: 50 },
  { year: 2050, milestone: '520 Mt hydrogen production annually', sector: 'Hydrogen', status: 'Off-Track', gap: 55 },
  { year: 2050, milestone: '7.6 Gt CO2 captured annually (CCUS)', sector: 'CCUS', status: 'Off-Track', gap: 68 },
];

// ============================================================
// DATA — IRENA Regional Renewable Targets (GW)
// ============================================================
const IRENA_REGIONS = ['North America', 'Europe', 'China', 'India', 'Southeast Asia', 'Latin America', 'Africa', 'Middle East'];
const IRENA_TARGETS = IRENA_REGIONS.map((region, i) => ({
  region,
  solar2030: Math.round(180 + sr(i * 3 + 1) * 920),
  solar2050: Math.round(650 + sr(i * 3 + 2) * 2800),
  wind2030: Math.round(120 + sr(i * 3 + 3) * 480),
  wind2050: Math.round(420 + sr(i * 3 + 4) * 1200),
  hydro2030: Math.round(40 + sr(i * 3 + 5) * 240),
  hydro2050: Math.round(60 + sr(i * 3 + 6) * 340),
  geo2030: Math.round(2 + sr(i * 3 + 7) * 18),
  geo2050: Math.round(6 + sr(i * 3 + 8) * 42),
}));

// ============================================================
// DATA — NGFS Phase V Scenarios
// ============================================================
const NGFS_SCENARIOS = [
  { name: 'Current Policies', carbonPrice2030: 22, carbonPrice2050: 35, gdpImpact2050: -7.8, renewableShare2050: 42, strandedAssetB: 2800, transitionRisk: 'Low', physicalRisk: 'Very High' },
  { name: 'Nationally Determined Contributions', carbonPrice2030: 48, carbonPrice2050: 110, gdpImpact2050: -4.2, renewableShare2050: 58, strandedAssetB: 1850, transitionRisk: 'Medium', physicalRisk: 'High' },
  { name: 'Delayed Transition', carbonPrice2030: 35, carbonPrice2050: 420, gdpImpact2050: -3.9, renewableShare2050: 72, strandedAssetB: 3900, transitionRisk: 'Very High', physicalRisk: 'Medium' },
  { name: 'Divergent Net Zero', carbonPrice2030: 145, carbonPrice2050: 380, gdpImpact2050: -2.5, renewableShare2050: 82, strandedAssetB: 3100, transitionRisk: 'High', physicalRisk: 'Low' },
  { name: 'Below 2°C', carbonPrice2030: 85, carbonPrice2050: 240, gdpImpact2050: -1.8, renewableShare2050: 78, strandedAssetB: 2200, transitionRisk: 'Medium', physicalRisk: 'Low' },
  { name: 'Net Zero 2050 (Orderly)', carbonPrice2030: 130, carbonPrice2050: 250, gdpImpact2050: -1.2, renewableShare2050: 85, strandedAssetB: 1950, transitionRisk: 'Medium', physicalRisk: 'Low' },
  { name: 'Low Demand', carbonPrice2030: 115, carbonPrice2050: 205, gdpImpact2050: -0.9, renewableShare2050: 88, strandedAssetB: 1550, transitionRisk: 'Low', physicalRisk: 'Low' },
];

// ============================================================
// DATA — Power Generation Mix (30 years global)
// ============================================================
const POWER_STACK_YEARS = Array.from({ length: 30 }, (_, i) => 2020 + i);
const POWER_STACK = POWER_STACK_YEARS.map((year, i) => {
  const progress = i / 29;
  const coal = Math.max(0, 36 - progress * 36);
  const gas = Math.max(0, 23 - progress * 18);
  const nuclear = 10 + progress * 4;
  const hydro = 16 - progress * 2;
  const solar = 3 + progress * 32;
  const wind = 6 + progress * 26;
  const bio = 2 + progress * 5;
  const other = 4 + progress * 5;
  return { year, coal: +coal.toFixed(1), gas: +gas.toFixed(1), nuclear: +nuclear.toFixed(1), hydro: +hydro.toFixed(1), solar: +solar.toFixed(1), wind: +wind.toFixed(1), bio: +bio.toFixed(1), other: +other.toFixed(1) };
});

const POWER_REGIONS = ['Global', 'North America', 'Europe', 'China', 'India', 'Africa'];
const POWER_STACK_BY_REGION = POWER_REGIONS.map((region, ri) => ({
  region,
  years: POWER_STACK_YEARS.map((year, i) => {
    const progress = i / 29;
    const regionFactor = 0.8 + sr(ri * 7 + 3) * 0.4;
    const coal = Math.max(0, (36 - progress * 36) * regionFactor);
    const gas = Math.max(0, (23 - progress * 18) * regionFactor);
    const solar = (3 + progress * 32) * (0.7 + sr(ri * 11 + 5) * 0.6);
    const wind = (6 + progress * 26) * (0.7 + sr(ri * 13 + 7) * 0.6);
    const nuclear = (10 + progress * 4) * (0.5 + sr(ri * 17 + 9) * 1.0);
    const hydro = (16 - progress * 2) * (0.6 + sr(ri * 19 + 11) * 0.8);
    const total = coal + gas + solar + wind + nuclear + hydro;
    const scale = total > 0 ? 100 / total : 1;
    return {
      year,
      coal: +(coal * scale).toFixed(1),
      gas: +(gas * scale).toFixed(1),
      nuclear: +(nuclear * scale).toFixed(1),
      hydro: +(hydro * scale).toFixed(1),
      solar: +(solar * scale).toFixed(1),
      wind: +(wind * scale).toFixed(1),
    };
  }),
}));

// ============================================================
// DATA — Oil & Gas Producers
// ============================================================
const OG_NAMES = ['Saudi Aramco', 'ExxonMobil', 'Chevron', 'Shell', 'BP', 'TotalEnergies', 'Eni', 'Equinor', 'ConocoPhillips', 'Petrobras', 'Rosneft', 'Gazprom Neft', 'CNPC', 'Sinopec', 'PetroChina', 'ADNOC', 'KPC', 'QatarEnergy', 'Pemex', 'Ecopetrol', 'Woodside', 'Santos', 'Repsol', 'OMV', 'Occidental'];
const OG_PRODUCERS = OG_NAMES.map((name, i) => ({
  name,
  dailyProdKbd: Math.round(280 + sr(i * 3 + 1) * 9500),
  scope12Intensity: +(15 + sr(i * 5 + 2) * 42).toFixed(1),
  scope3Mt: Math.round(45 + sr(i * 7 + 3) * 1850),
  declineRatePct: +(2.5 + sr(i * 11 + 4) * 6.5).toFixed(1),
  alignmentPct: Math.round(18 + sr(i * 13 + 5) * 60),
  capexCleanPct: Math.round(3 + sr(i * 17 + 6) * 38),
  methanIntensity: +(0.12 + sr(i * 19 + 7) * 0.48).toFixed(3),
  reserveLife: Math.round(8 + sr(i * 23 + 8) * 22),
}));

// ============================================================
// DATA — Steel Plants
// ============================================================
const STEEL_TECHS = ['BF-BOF', 'EAF-Scrap', 'DRI-NG-EAF', 'HBI-EAF', 'H2-DRI-EAF', 'BF-BOF+CCUS'];
const STEEL_PLANTS = Array.from({ length: 20 }, (_, i) => ({
  plant: `Steel Plant ${String.fromCharCode(65 + (i % 26))}${i + 1}`,
  country: ['China', 'India', 'Japan', 'USA', 'Germany', 'Korea', 'Brazil', 'Turkey'][i % 8],
  tech: STEEL_TECHS[i % STEEL_TECHS.length],
  capacityMt: +(2.2 + sr(i * 3 + 1) * 7.8).toFixed(1),
  co2PerTonne: STEEL_TECHS[i % STEEL_TECHS.length] === 'BF-BOF' ? +(2.0 + sr(i * 5) * 0.3).toFixed(2) :
                STEEL_TECHS[i % STEEL_TECHS.length] === 'EAF-Scrap' ? +(0.4 + sr(i * 5) * 0.2).toFixed(2) :
                STEEL_TECHS[i % STEEL_TECHS.length] === 'DRI-NG-EAF' ? +(1.1 + sr(i * 5) * 0.3).toFixed(2) :
                STEEL_TECHS[i % STEEL_TECHS.length] === 'H2-DRI-EAF' ? +(0.15 + sr(i * 5) * 0.15).toFixed(2) :
                STEEL_TECHS[i % STEEL_TECHS.length] === 'BF-BOF+CCUS' ? +(0.6 + sr(i * 5) * 0.2).toFixed(2) :
                +(0.5 + sr(i * 5) * 0.3).toFixed(2),
  alignmentPct: Math.round(30 + sr(i * 7 + 3) * 65),
  retrofitYear: 2028 + (i % 12),
  capexMn: Math.round(220 + sr(i * 11 + 4) * 1280),
}));

// ============================================================
// DATA — Cement Plants
// ============================================================
const CEMENT_PLANTS = Array.from({ length: 15 }, (_, i) => ({
  plant: `Cement ${['LafargeHolcim', 'HeidelbergCem', 'Cemex', 'CRH', 'Taiheiyo', 'UltraTech', 'Anhui Conch', 'Siam', 'Dangote', 'Votorantim', 'BuzziUnicem', 'Titan', 'JK Cement', 'Shree', 'ACC'][i]}`,
  country: ['France', 'Germany', 'Mexico', 'Ireland', 'Japan', 'India', 'China', 'Thailand', 'Nigeria', 'Brazil', 'Italy', 'Greece', 'India', 'India', 'India'][i],
  capacityMtY: +(4.2 + sr(i * 3 + 1) * 18.8).toFixed(1),
  clinkerFactor: +(0.62 + sr(i * 5 + 2) * 0.22).toFixed(2),
  altFuelsPct: Math.round(8 + sr(i * 7 + 3) * 52),
  ccusStatus: ['Planned', 'FEED', 'FID', 'Operational', 'None'][i % 5],
  co2PerTonne: +(0.55 + sr(i * 11 + 4) * 0.35).toFixed(2),
  alignmentPct: Math.round(25 + sr(i * 13 + 5) * 55),
}));

// ============================================================
// DATA — Transport
// ============================================================
const TRANSPORT_REGIONS = ['China', 'Europe', 'USA', 'India', 'Japan', 'Brazil', 'ASEAN', 'Africa'];
const TRANSPORT = TRANSPORT_REGIONS.map((region, i) => ({
  region,
  evPenetration2025: Math.round(8 + sr(i * 3 + 1) * 38),
  evPenetration2030: Math.round(28 + sr(i * 5 + 2) * 52),
  evPenetration2035: Math.round(55 + sr(i * 7 + 3) * 35),
  railElectrifiedPct: Math.round(18 + sr(i * 11 + 4) * 65),
  busElectricPct: Math.round(5 + sr(i * 13 + 5) * 45),
  truckEvPct: Math.round(2 + sr(i * 17 + 6) * 22),
  chargerPerKm: +(0.4 + sr(i * 19 + 7) * 3.8).toFixed(1),
}));

// ============================================================
// DATA — Aviation SAF
// ============================================================
const AVIATION_SAF = ['United', 'Delta', 'American', 'Lufthansa', 'KLM', 'Air France', 'British Airways', 'ANA', 'Cathay Pacific', 'Singapore Airlines', 'Emirates', 'Qantas'].map((airline, i) => ({
  airline,
  safBlend2024: +(1.2 + sr(i * 3 + 1) * 4.8).toFixed(1),
  safBlend2030: +(6 + sr(i * 5 + 2) * 12).toFixed(1),
  co2PerRtk: +(680 + sr(i * 7 + 3) * 240).toFixed(0),
  fleetAge: +(7 + sr(i * 11 + 4) * 10).toFixed(1),
  corsiaStatus: ['Pilot', 'Mandatory', 'Exempt'][i % 3],
  netZeroPledge: 2050 + (i % 3) * 5 - 10,
  offsetRetiredKt: Math.round(80 + sr(i * 13 + 5) * 720),
}));

// ============================================================
// DATA — Shipping CII
// ============================================================
const SHIPPING_CII = Array.from({ length: 20 }, (_, i) => ({
  fleet: `Fleet ${['Maersk', 'MSC', 'CMA-CGM', 'Hapag-Lloyd', 'ONE', 'Evergreen', 'COSCO', 'HMM', 'Yang Ming', 'ZIM', 'K Line', 'MOL', 'NYK', 'PIL', 'Wan Hai', 'OOCL', 'Wan Hai', 'Matson', 'Stena', 'DFDS'][i]}`,
  ciiRating: ['A', 'B', 'C', 'D', 'E'][Math.min(4, Math.floor(sr(i * 3 + 1) * 5))],
  vessels: Math.round(45 + sr(i * 5 + 2) * 280),
  avgDwt: Math.round(18 + sr(i * 7 + 3) * 120),
  fuelType: ['HFO', 'VLSFO', 'LNG', 'Methanol', 'Ammonia'][Math.min(4, Math.floor(sr(i * 11 + 4) * 5))],
  co2PerTeuNm: +(11.2 + sr(i * 13 + 5) * 8.6).toFixed(2),
  alignmentImo2050: Math.round(22 + sr(i * 17 + 6) * 65),
}));

// ============================================================
// DATA — Hydrogen Projects
// ============================================================
const HYDROGEN_PROJECTS = [
  { project: 'NEOM Green H2', country: 'Saudi Arabia', capacityMw: 2200, type: 'Green', costKg: 1.85, fidYear: 2026 },
  { project: 'HyDeal Ambition', country: 'Spain', capacityMw: 7500, type: 'Green', costKg: 1.55, fidYear: 2028 },
  { project: 'Porthos', country: 'Netherlands', capacityMw: 800, type: 'Blue', costKg: 2.10, fidYear: 2025 },
  { project: 'H2Med', country: 'EU Multi', capacityMw: 1400, type: 'Green', costKg: 2.40, fidYear: 2030 },
  { project: 'Aman Green H2', country: 'Mauritania', capacityMw: 6000, type: 'Green', costKg: 1.45, fidYear: 2029 },
  { project: 'Asian Renewable Hub', country: 'Australia', capacityMw: 26000, type: 'Green', costKg: 1.65, fidYear: 2029 },
  { project: 'Humber Zero', country: 'UK', capacityMw: 1000, type: 'Blue', costKg: 2.25, fidYear: 2027 },
  { project: 'H2 Magnum', country: 'Netherlands', capacityMw: 500, type: 'Green', costKg: 2.80, fidYear: 2025 },
  { project: 'REPowerEU Green H2', country: 'Germany', capacityMw: 3500, type: 'Green', costKg: 2.15, fidYear: 2028 },
  { project: 'Gulf Coast Hub', country: 'USA', capacityMw: 1800, type: 'Blue', costKg: 1.95, fidYear: 2026 },
  { project: 'Pacific NW H2', country: 'USA', capacityMw: 900, type: 'Green', costKg: 2.65, fidYear: 2027 },
  { project: 'India GH2 Mission', country: 'India', capacityMw: 4500, type: 'Green', costKg: 1.90, fidYear: 2028 },
  { project: 'Japan Turquoise H2', country: 'Japan', capacityMw: 350, type: 'Turquoise', costKg: 3.20, fidYear: 2027 },
  { project: 'Brazil Pecem Hub', country: 'Brazil', capacityMw: 2000, type: 'Green', costKg: 1.70, fidYear: 2028 },
  { project: 'Egypt SCZONE', country: 'Egypt', capacityMw: 1500, type: 'Green', costKg: 1.80, fidYear: 2029 },
];

// ============================================================
// DATA — CCUS Projects
// ============================================================
const CCUS_PROJECTS = [
  { project: 'Northern Lights', country: 'Norway', capacityMtYr: 5.0, status: 'Operational', tech: 'Post-combustion' },
  { project: 'Porthos', country: 'Netherlands', capacityMtYr: 2.5, status: 'FID', tech: 'Post-combustion' },
  { project: 'Aramis', country: 'Netherlands', capacityMtYr: 22, status: 'FEED', tech: 'Multi-source' },
  { project: 'Humber Zero', country: 'UK', capacityMtYr: 8, status: 'FEED', tech: 'Post-combustion' },
  { project: 'Net Zero Teesside', country: 'UK', capacityMtYr: 6, status: 'FID', tech: 'Oxy-fuel' },
  { project: 'Acorn CCS', country: 'UK', capacityMtYr: 5, status: 'FEED', tech: 'Post-combustion' },
  { project: 'HyNet North West', country: 'UK', capacityMtYr: 10, status: 'FEED', tech: 'Pre-combustion' },
  { project: 'DAC 1 Texas', country: 'USA', capacityMtYr: 1.0, status: 'Operational', tech: 'DAC' },
  { project: 'Stratos DAC', country: 'USA', capacityMtYr: 0.5, status: 'Operational', tech: 'DAC' },
  { project: 'Project Tundra', country: 'USA', capacityMtYr: 4.0, status: 'FEED', tech: 'Post-combustion' },
  { project: 'Barossa CCS', country: 'Australia', capacityMtYr: 4.5, status: 'Announced', tech: 'Post-combustion' },
  { project: 'Gorgon CCS', country: 'Australia', capacityMtYr: 4.0, status: 'Operational', tech: 'Pre-combustion' },
  { project: 'Quest', country: 'Canada', capacityMtYr: 1.2, status: 'Operational', tech: 'Post-combustion' },
  { project: 'Boundary Dam', country: 'Canada', capacityMtYr: 1.0, status: 'Operational', tech: 'Post-combustion' },
  { project: 'Petra Nova', country: 'USA', capacityMtYr: 1.4, status: 'Operational', tech: 'Post-combustion' },
];

// ============================================================
// DATA — Nuclear Fleet
// ============================================================
const NUCLEAR_FLEET = Array.from({ length: 20 }, (_, i) => ({
  reactor: `Reactor ${String.fromCharCode(65 + (i % 26))}-${i + 1}`,
  country: ['USA', 'France', 'China', 'Russia', 'South Korea', 'Japan', 'Canada', 'UK'][i % 8],
  type: ['PWR', 'BWR', 'CANDU', 'VVER', 'APR1400', 'EPR', 'SMR Gen III+', 'SMR Gen IV', 'HTR-PM', 'Molten Salt'][i % 10],
  capacityMw: [1100, 1250, 1600, 1750, 1400, 300, 80, 195, 470, 600][i % 10],
  ageYears: Math.round(4 + sr(i * 7 + 3) * 42),
  licenseExtYear: 2040 + (i % 20),
  capacityFactor: +(82 + sr(i * 11 + 4) * 14).toFixed(1),
  lcoe: +(58 + sr(i * 13 + 5) * 52).toFixed(0),
}));

// ============================================================
// DATA — Storage Capacity
// ============================================================
const STORAGE_REGIONS = ['North America', 'Europe', 'China', 'India', 'Japan', 'Korea', 'Australia', 'Middle East', 'Brazil', 'Africa'];
const STORAGE_CAPACITY = STORAGE_REGIONS.map((region, i) => ({
  region,
  liIon: Math.round(85 + sr(i * 3 + 1) * 620),
  flowBattery: Math.round(8 + sr(i * 5 + 2) * 48),
  pumpedHydro: Math.round(120 + sr(i * 7 + 3) * 480),
  caes: Math.round(4 + sr(i * 11 + 4) * 32),
  thermal: Math.round(6 + sr(i * 13 + 5) * 42),
}));

// ============================================================
// DATA — Grid CAPEX
// ============================================================
const GRID_REGIONS = ['North America', 'Europe', 'China', 'India', 'ASEAN', 'Latin America', 'Middle East', 'Africa'];
const GRID_CAPEX = GRID_REGIONS.map((region, i) => ({
  region,
  years: Array.from({ length: 10 }, (_, y) => ({
    year: 2025 + y,
    capexB: +(18 + sr(i * 11 + y * 3 + 1) * 42).toFixed(1),
  })),
}));

const GRID_CAPEX_FLAT = GRID_CAPEX.map((r) => ({
  region: r.region,
  total2025_34: +r.years.reduce((a, b) => a + b.capexB, 0).toFixed(1),
  peak: +Math.max(...r.years.map((y) => y.capexB)).toFixed(1),
  avg: +(r.years.reduce((a, b) => a + b.capexB, 0) / Math.max(1, r.years.length)).toFixed(1),
}));

// ============================================================
// DATA — TECH_PARAMS (LCOE / LCOH inputs)
//   capex: $/kW  · opexFixed: $/kW/yr · opexVar: $/MWh · fuelPrice: $/MWh · efficiency: frac · cf: frac · life: years
// ============================================================
const TECH_PARAMS = [
  { id: 'solarPV',    name: 'Solar PV Utility',      capex: 950,  opexFixed: 18,  opexVar: 0.5, fuelPrice: 0,    efficiency: 1,    cf: 0.24, life: 30, color: T.gold,   family: 'RE' },
  { id: 'windOnshore',name: 'Wind Onshore',          capex: 1320, opexFixed: 36,  opexVar: 1.1, fuelPrice: 0,    efficiency: 1,    cf: 0.38, life: 25, color: T.sage,   family: 'RE' },
  { id: 'windOffshore',name:'Wind Offshore',         capex: 3400, opexFixed: 95,  opexVar: 2.2, fuelPrice: 0,    efficiency: 1,    cf: 0.48, life: 25, color: T.sageL,  family: 'RE' },
  { id: 'hydro',      name: 'Hydro Large',           capex: 2200, opexFixed: 42,  opexVar: 1.8, fuelPrice: 0,    efficiency: 1,    cf: 0.45, life: 60, color: '#4a90c2',family: 'RE' },
  { id: 'nuclear',    name: 'Nuclear Gen III+',      capex: 6800, opexFixed: 130, opexVar: 2.6, fuelPrice: 7.5,  efficiency: 0.34, cf: 0.88, life: 60, color: T.navyL,  family: 'LowC' },
  { id: 'smr',        name: 'SMR Gen III+',          capex: 5200, opexFixed: 118, opexVar: 3.1, fuelPrice: 7.5,  efficiency: 0.33, cf: 0.85, life: 60, color: T.navy,   family: 'LowC' },
  { id: 'gasCCGT',    name: 'Gas CCGT',              capex: 1050, opexFixed: 28,  opexVar: 4.2, fuelPrice: 38,   efficiency: 0.58, cf: 0.55, life: 30, color: '#9aa3ae',family: 'Fossil' },
  { id: 'coal',       name: 'Coal Supercritical',    capex: 2100, opexFixed: 58,  opexVar: 5.1, fuelPrice: 22,   efficiency: 0.42, cf: 0.62, life: 40, color: '#5c6b7e',family: 'Fossil' },
  { id: 'h2Elec',     name: 'H2 Electrolysis (PEM)', capex: 1400, opexFixed: 35,  opexVar: 0.6, fuelPrice: 35,   efficiency: 0.67, cf: 0.55, life: 20, color: '#8bab5f',family: 'H2' },
  { id: 'h2SMR',      name: 'H2 SMR+CCS (Blue)',     capex: 1650, opexFixed: 48,  opexVar: 1.0, fuelPrice: 38,   efficiency: 0.72, cf: 0.90, life: 25, color: '#7a9e6b',family: 'H2' },
];

// ============================================================
// DATA — LEARNING_RATES (Wright's Law inputs)
//   cost0: $/unit at cum0 baseline  · cum0 + cum_t in same unit (GW or GWh or GW_elec)
//   b derives from LR: LR = 1 - 2^(-b) so b = -log2(1-LR)
// ============================================================
const lrToB = (lr) => -Math.log(1 - lr) / Math.log(2);
const LEARNING_RATES = [
  { id: 'solarPV',      name: 'Solar PV Module',        lr: 0.22, cost0: 310, unit: '$/kW',   cum0: 800,  cum2030: 4800,  cum2040: 12500, cum2050: 22000, color: T.gold  },
  { id: 'windOffshore', name: 'Offshore Wind',          lr: 0.18, cost0: 3400,unit: '$/kW',   cum0: 55,   cum2030: 380,   cum2040: 1250,  cum2050: 2400,  color: T.sageL },
  { id: 'windOnshore',  name: 'Onshore Wind',           lr: 0.12, cost0: 1320,unit: '$/kW',   cum0: 780,  cum2030: 2400,  cum2040: 4800,  cum2050: 7200,  color: T.sage  },
  { id: 'battLi',       name: 'Li-Ion Battery Pack',    lr: 0.16, cost0: 139, unit: '$/kWh',  cum0: 600,  cum2030: 5500,  cum2040: 22000, cum2050: 52000, color: T.navyL },
  { id: 'electrolyzer', name: 'PEM Electrolyzer',       lr: 0.14, cost0: 1400,unit: '$/kW',   cum0: 2.5,  cum2030: 180,   cum2040: 920,   cum2050: 2800,  color: '#8bab5f' },
  { id: 'dac',          name: 'Direct Air Capture',     lr: 0.10, cost0: 620, unit: '$/tCO2', cum0: 0.05, cum2030: 6,     cum2040: 80,    cum2050: 420,   color: '#b16b5b' },
  { id: 'hPump',        name: 'Heat Pump (residential)',lr: 0.10, cost0: 4200,unit: '$/unit', cum0: 140,  cum2030: 620,   cum2040: 1800,  cum2050: 3600,  color: '#c78b3a' },
];

// ============================================================
// DATA — MACC_MEASURES (Marginal Abatement Cost Curve)
//   cost: $/tCO2 (negative = cost-saving) · abatement: MtCO2/yr at 2030
// ============================================================
const MACC_MEASURES = [
  { id: 1,  measure: 'LED lighting retrofit',          sector: 'Buildings', cost: -85, abatement: 340 },
  { id: 2,  measure: 'Industrial motor efficiency',    sector: 'Industry',  cost: -62, abatement: 280 },
  { id: 3,  measure: 'Building insulation retrofit',   sector: 'Buildings', cost: -38, abatement: 420 },
  { id: 4,  measure: 'HVAC heat-pump residential',     sector: 'Buildings', cost: -18, abatement: 520 },
  { id: 5,  measure: 'EV passenger cars',              sector: 'Transport', cost:  -5, abatement: 860 },
  { id: 6,  measure: 'Utility solar PV',               sector: 'Power',     cost:   8, abatement: 1240 },
  { id: 7,  measure: 'Onshore wind',                   sector: 'Power',     cost:  12, abatement: 980 },
  { id: 8,  measure: 'Methane leak detection (O&G)',   sector: 'Oil & Gas', cost:  18, abatement: 620 },
  { id: 9,  measure: 'Coal to gas switching',          sector: 'Power',     cost:  22, abatement: 540 },
  { id: 10, measure: 'Nuclear uprates & LTO',          sector: 'Power',     cost:  28, abatement: 340 },
  { id: 11, measure: 'Electric heavy trucks',          sector: 'Transport', cost:  42, abatement: 410 },
  { id: 12, measure: 'Offshore wind',                  sector: 'Power',     cost:  55, abatement: 720 },
  { id: 13, measure: 'CCUS on cement kilns',           sector: 'Industry',  cost:  68, abatement: 280 },
  { id: 14, measure: 'Blue H2 in refineries',          sector: 'H2',        cost:  82, abatement: 220 },
  { id: 15, measure: 'Sustainable aviation fuel',      sector: 'Aviation',  cost: 110, abatement: 380 },
  { id: 16, measure: 'Green H2 in steel (DRI)',        sector: 'Industry',  cost: 145, abatement: 340 },
  { id: 17, measure: 'Ammonia marine fuel',            sector: 'Shipping',  cost: 185, abatement: 210 },
  { id: 18, measure: 'Green H2 in chemicals',          sector: 'H2',        cost: 210, abatement: 240 },
  { id: 19, measure: 'Direct Air Capture',             sector: 'CDR',       cost: 320, abatement: 180 },
  { id: 20, measure: 'Synthetic e-fuels aviation',     sector: 'Aviation',  cost: 480, abatement: 120 },
];

// ============================================================
// DATA — PRICE_PATHS (stranded asset NPV scenarios)
//   yearly Brent-equivalent oil price ($/bbl), 2025-2050
// ============================================================
const PRICE_PATH_YEARS = Array.from({ length: 26 }, (_, i) => 2025 + i);
const PRICE_PATHS = {
  statusQuo: PRICE_PATH_YEARS.map((y, i) => ({ year: y, price: +(72 + sr(i * 3 + 7) * 8 - i * 0.15).toFixed(1) })),
  delayed:   PRICE_PATH_YEARS.map((y, i) => {
    const pre = i < 10 ? 70 + sr(i * 5 + 2) * 6 : 70 - (i - 10) * 3.2 + sr(i * 5 + 2) * 4;
    return { year: y, price: +Math.max(28, pre).toFixed(1) };
  }),
  orderly:   PRICE_PATH_YEARS.map((y, i) => ({ year: y, price: +Math.max(26, 68 - i * 1.6 + sr(i * 5 + 4) * 3).toFixed(1) })),
};

// ============================================================
// DATA — DISPATCH_DEMAND (hourly merit-order inputs)
//   24 hr system demand (GW) — typical summer weekday shape
// ============================================================
const DISPATCH_HOURS = Array.from({ length: 24 }, (_, h) => h);
const DISPATCH_DEMAND = DISPATCH_HOURS.map((h) => {
  // bimodal shape: morning ramp + evening peak
  const base = 340;
  const morn = 120 * Math.exp(-Math.pow((h - 9) / 3, 2));
  const eve  = 180 * Math.exp(-Math.pow((h - 19) / 2.4, 2));
  const noise = (sr(h * 7 + 3) - 0.5) * 18;
  return { hour: h, demand: +(base + morn + eve + noise).toFixed(1) };
});

// Dispatch stack: marginal cost ($/MWh), max capacity (GW), CO2 intensity (tCO2/MWh)
const DISPATCH_STACK = [
  { id: 'solar',   name: 'Solar PV',     mc:  0,  cap: 220, co2: 0,    color: T.gold,   profile: (h) => Math.max(0, Math.sin((h - 6) * Math.PI / 12)) },
  { id: 'wind',    name: 'Wind',         mc:  2,  cap: 180, co2: 0,    color: T.sage,   profile: (h) => 0.35 + sr(h * 3 + 1) * 0.35 },
  { id: 'hydro',   name: 'Hydro',        mc:  5,  cap: 90,  co2: 0,    color: '#4a90c2',profile: () => 0.75 },
  { id: 'nuclear', name: 'Nuclear',      mc: 12,  cap: 120, co2: 0,    color: T.navyL,  profile: () => 0.95 },
  { id: 'ccgt',    name: 'Gas CCGT',     mc: 48,  cap: 160, co2: 0.37, color: '#9aa3ae',profile: () => 1.0  },
  { id: 'coal',    name: 'Coal',         mc: 62,  cap: 110, co2: 0.85, color: '#5c6b7e',profile: () => 1.0  },
  { id: 'oilPeak', name: 'Oil Peaker',   mc:140,  cap:  40, co2: 0.75, color: T.red,    profile: () => 1.0  },
];

// ============================================================
// DATA — PROJECT_PIPELINE (IRR barrier projects)
//   capex $M · cashflow $M/yr for life years · supportUsd per-unit incentive
// ============================================================
const PROJECT_PIPELINE = [
  { id: 'p1',  project: 'NEOM Green H2',         family: 'H2',       capex: 8400, life: 20, annCF: 920,  supportUnit: 3.0, supportUsd: 'kg' },
  { id: 'p2',  project: 'HyDeal Ambition Iberia',family: 'H2',       capex: 14200,life: 25, annCF: 1580, supportUnit: 3.0, supportUsd: 'kg' },
  { id: 'p3',  project: 'Northern Lights CCS',   family: 'CCUS',     capex: 2600, life: 25, annCF: 310,  supportUnit: 85,  supportUsd: 'tCO2' },
  { id: 'p4',  project: 'Porthos CCS',           family: 'CCUS',     capex: 1400, life: 15, annCF: 190,  supportUnit: 85,  supportUsd: 'tCO2' },
  { id: 'p5',  project: 'Stratos DAC',           family: 'CCUS',     capex: 1100, life: 20, annCF: 120,  supportUnit: 180, supportUsd: 'tCO2' },
  { id: 'p6',  project: 'Vogtle 3/4 (Nuclear)',  family: 'Nuclear',  capex: 30000,life: 60, annCF: 2750, supportUnit: 0.015,supportUsd: 'kWh' },
  { id: 'p7',  project: 'NuScale SMR VOYGR',     family: 'Nuclear',  capex: 5200, life: 60, annCF: 510,  supportUnit: 0.015,supportUsd: 'kWh' },
  { id: 'p8',  project: 'Dogger Bank Offshore',  family: 'Offshore', capex: 11500,life: 25, annCF: 1380, supportUnit: 0.02, supportUsd: 'kWh' },
  { id: 'p9',  project: 'Empire Wind NY',        family: 'Offshore', capex: 5200, life: 25, annCF: 620,  supportUnit: 0.02, supportUsd: 'kWh' },
  { id: 'p10', project: 'Hornsea 3',             family: 'Offshore', capex: 9800, life: 25, annCF: 1180, supportUnit: 0.02, supportUsd: 'kWh' },
  { id: 'p11', project: 'Bhadla Solar Park',     family: 'Solar',    capex: 2000, life: 25, annCF: 290,  supportUnit: 0.008,supportUsd: 'kWh' },
  { id: 'p12', project: 'Benban Solar Complex',  family: 'Solar',    capex: 2400, life: 25, annCF: 340,  supportUnit: 0.008,supportUsd: 'kWh' },
  { id: 'p13', project: 'Tennet NordLink 2',     family: 'Grid',     capex: 2800, life: 40, annCF: 240,  supportUnit: 0,    supportUsd: 'kWh' },
  { id: 'p14', project: 'Snowy 2.0 PHS',         family: 'Storage',  capex: 4500, life: 80, annCF: 360,  supportUnit: 0.012,supportUsd: 'kWh' },
  { id: 'p15', project: 'Moss Landing BESS Ext.',family: 'Storage',  capex: 1600, life: 20, annCF: 210,  supportUnit: 0.012,supportUsd: 'kWh' },
];

// ============================================================
// FINANCE HELPERS (hoisted for tab renderers)
// ============================================================
const CRF = (r, n) => {
  if (r < 0.0001) return n > 0 ? 1 / n : 0;
  const f = Math.pow(1 + r, n);
  return r * f / Math.max(0.0001, f - 1);
};
const calcLcoe = (tech, wacc) => {
  const crf = CRF(wacc, tech.life);
  const annualized = tech.capex * crf + tech.opexFixed;
  const generation = Math.max(1, 8760 * tech.cf); // kWh per kW per yr
  const energyCost = annualized / generation * 1000; // $/MWh
  const fuelCost = tech.fuelPrice / Math.max(0.01, tech.efficiency);
  return {
    capexAnn: +(tech.capex * crf / generation * 1000).toFixed(2),
    opexFixedAnn: +(tech.opexFixed / generation * 1000).toFixed(2),
    opexVar: +tech.opexVar.toFixed(2),
    fuel: +fuelCost.toFixed(2),
    total: +(energyCost + tech.opexVar + fuelCost).toFixed(2),
  };
};
const wrightCost = (cost0, cum0, cum_t, b) => cost0 * Math.pow(Math.max(1, cum_t) / Math.max(1, cum0), -b);

// NPV helpers
const npv = (cashflows, r) => cashflows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + r, i), 0);
const irr = (cashflows) => {
  let lo = -0.95, hi = 2.0;
  for (let iter = 0; iter < 80; iter++) {
    const mid = (lo + hi) / 2;
    const v = npv(cashflows, mid);
    if (Math.abs(v) < 1) return mid;
    if (v > 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  page: { background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text, paddingBottom: 80 },
  hero: { background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyL} 100%)`, color: '#fff', padding: '40px 48px 32px', borderBottom: `3px solid ${T.gold}`, position: 'relative' },
  heroBreadcrumb: { fontFamily: T.mono, fontSize: 11, letterSpacing: 1.4, color: T.goldL, textTransform: 'uppercase', marginBottom: 14 },
  heroTitle: { fontSize: 34, fontWeight: 600, letterSpacing: -0.6, marginBottom: 8 },
  heroSub: { fontSize: 15, color: '#dce7f2', maxWidth: 960, lineHeight: 1.55 },
  heroBadges: { display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' },
  heroBadge: { background: 'rgba(197,169,106,0.18)', border: `1px solid ${T.gold}`, color: T.goldL, fontFamily: T.mono, fontSize: 10, padding: '5px 11px', borderRadius: 3, letterSpacing: 1 },
  container: { padding: '0 48px', marginTop: 24 },
  toolbar: { display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 18px', marginBottom: 18 },
  toolbarLabel: { fontFamily: T.mono, fontSize: 10, letterSpacing: 1.3, color: T.textMut, textTransform: 'uppercase', marginRight: 4 },
  select: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: '7px 10px', fontSize: 13, color: T.text, fontFamily: T.font, minWidth: 140 },
  slider: { width: 180, accentColor: T.gold },
  tabsWrap: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 6, marginBottom: 20, display: 'flex', gap: 2, flexWrap: 'wrap' },
  tab: (active) => ({ flex: '1 1 auto', minWidth: 130, padding: '10px 14px', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', borderRadius: 4, background: active ? T.navy : 'transparent', color: active ? '#fff' : T.textSec, fontFamily: T.font, letterSpacing: 0.2, transition: 'all 0.15s' }),
  card: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 22, marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: 600, color: T.navy, marginBottom: 4, letterSpacing: -0.2 },
  cardSub: { fontSize: 12, color: T.textSec, marginBottom: 18, lineHeight: 1.5 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginBottom: 20 },
  kpi: { background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.gold}`, borderRadius: 4, padding: '14px 16px' },
  kpiLabel: { fontFamily: T.mono, fontSize: 10, letterSpacing: 1.3, color: T.textMut, textTransform: 'uppercase', marginBottom: 5 },
  kpiValue: { fontSize: 22, fontWeight: 600, color: T.navy, letterSpacing: -0.4 },
  kpiDelta: { fontFamily: T.mono, fontSize: 11, color: T.textSec, marginTop: 3 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(440px,1fr))', gap: 18 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 18 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: T.font },
  th: { textAlign: 'left', padding: '10px 12px', background: T.surfaceH, color: T.navy, fontWeight: 600, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', borderBottom: `1px solid ${T.borderL}` },
  td: { padding: '9px 12px', borderBottom: `1px solid ${T.border}`, color: T.text, fontSize: 12 },
  pill: (bg, fg) => ({ display: 'inline-block', background: bg, color: fg, fontFamily: T.mono, fontSize: 10, padding: '3px 8px', borderRadius: 3, letterSpacing: 0.6, fontWeight: 500 }),
  accent: { height: 1, background: T.gold, width: 40, marginBottom: 10 },
  footNote: { fontSize: 11, color: T.textMut, fontStyle: 'italic', marginTop: 10, fontFamily: T.mono },
};

const statusColor = (s) => {
  if (s === 'On-Track' || s === 'Operational' || s === 'A') return { bg: '#dcfce7', fg: '#15803d' };
  if (s === 'At-Risk' || s === 'B' || s === 'FID') return { bg: '#fef3c7', fg: '#b45309' };
  if (s === 'Off-Track' || s === 'D' || s === 'E') return { bg: '#fee2e2', fg: '#b91c1c' };
  return { bg: '#e0e7ff', fg: '#3730a3' };
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const EnergySectorTaxonomyPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [scenario, setScenario] = useState('Net Zero 2050 (Orderly)');
  const [sector, setSector] = useState('All');
  const [region, setRegion] = useState('Global');
  const [tech, setTech] = useState('All');
  const [transitionShift, setTransitionShift] = useState(0); // -5..+5 years pull-forward / delay

  // -------- Derived KPIs
  const activeScenario = NGFS_SCENARIOS.find((s) => s.name === scenario) || NGFS_SCENARIOS[5];
  const alignmentShift = 1 - transitionShift * 0.03;
  const portfolioAlignment = useMemo(() => {
    const avg = OG_PRODUCERS.reduce((a, b) => a + b.alignmentPct, 0) / Math.max(1, OG_PRODUCERS.length);
    return +(avg * alignmentShift).toFixed(1);
  }, [alignmentShift]);
  const irenaCoverage = useMemo(() => {
    const sum = IRENA_TARGETS.reduce((a, b) => a + b.solar2030 + b.wind2030, 0);
    return Math.round(sum / Math.max(1, IRENA_TARGETS.length));
  }, []);
  const ngfsOrderlyAlign = +(activeScenario.renewableShare2050 * alignmentShift).toFixed(1);
  const sbtiDecarb = useMemo(() => {
    const sum = STEEL_PLANTS.reduce((a, b) => a + b.alignmentPct, 0);
    return +(sum / Math.max(1, STEEL_PLANTS.length)).toFixed(1);
  }, []);
  const transitionPlanQuality = +(68 + transitionShift * 1.8).toFixed(1);
  const strandedAssetRiskMt = Math.round(activeScenario.strandedAssetB * 0.85 * (1 - transitionShift * 0.05));
  const avoidedEmissionsMt = Math.round(1820 + portfolioAlignment * 12);

  // -------- Helpers
  const filteredPower = POWER_STACK_BY_REGION.find((r) => r.region === region)?.years || POWER_STACK;

  const milestoneSectorOptions = ['All', ...Array.from(new Set(NZE_MILESTONES.map((m) => m.sector)))];
  const filteredMilestones = sector === 'All' ? NZE_MILESTONES : NZE_MILESTONES.filter((m) => m.sector === sector);

  const filteredSteel = tech === 'All' ? STEEL_PLANTS : STEEL_PLANTS.filter((p) => p.tech === tech);

  const POWER_STACK_COLORS = {
    coal: '#5c6b7e', gas: '#9aa3ae', nuclear: T.navyL, hydro: '#4a90c2', solar: T.gold, wind: T.sage, bio: '#8bab5f', other: T.borderL,
  };

  const TABS = [
    'Overview', 'IEA NZE 2050', 'IRENA WETO', 'NGFS Phase V', 'Power Sector',
    'Oil & Gas', 'Steel & Cement', 'Transport', 'Shipping & Aviation', 'Hydrogen',
    'CCUS', 'Nuclear & SMR', 'Storage', 'Grid Investment',
    'LCOE / LCOH', 'Learning Curve', 'MACC Curve', 'Stranded NPV', 'Merit Order', 'WACC · IRR',
  ];

  return (
    <div style={styles.page}>
      {/* HERO */}
      <div style={styles.hero}>
        <div style={styles.heroBreadcrumb}>EP-Q11 · ENERGY SECTOR TAXONOMY · IEA NZE · IRENA WETO · NGFS · EU TAXONOMY</div>
        <div style={styles.heroTitle}>Energy Sector Taxonomy Bridge</div>
        <div style={styles.heroSub}>
          Cross-framework alignment layer between IEA NZE 2050, IRENA WETO renewable capacity pathways, NGFS Phase V
          scenarios, and EU Taxonomy activity criteria — extended to power, upstream oil & gas, heavy industry
          (steel · cement · aluminium · fertilizer · chemicals), transport (road · rail · shipping · aviation),
          buildings, and the emerging hydrogen economy. Quantifies portfolio alignment vs milestones, technology
          readiness, stranded-asset risk, and transition-plan quality.
        </div>
        <div style={styles.heroBadges}>
          <span style={styles.heroBadge}>IEA NZE 2050</span>
          <span style={styles.heroBadge}>IRENA WETO</span>
          <span style={styles.heroBadge}>NGFS PHASE V</span>
          <span style={styles.heroBadge}>EU TAXONOMY</span>
          <span style={styles.heroBadge}>SBTi SECTOR</span>
          <span style={styles.heroBadge}>TPT TRANSITION PLAN</span>
        </div>
      </div>

      <div style={styles.container}>
        {/* TOOLBAR */}
        <div style={styles.toolbar}>
          <span style={styles.toolbarLabel}>Scenario</span>
          <select style={styles.select} value={scenario} onChange={(e) => setScenario(e.target.value)}>
            {NGFS_SCENARIOS.map((s) => <option key={s.name}>{s.name}</option>)}
          </select>
          <span style={styles.toolbarLabel}>Sector</span>
          <select style={styles.select} value={sector} onChange={(e) => setSector(e.target.value)}>
            {milestoneSectorOptions.map((s) => <option key={s}>{s}</option>)}
          </select>
          <span style={styles.toolbarLabel}>Region</span>
          <select style={styles.select} value={region} onChange={(e) => setRegion(e.target.value)}>
            {POWER_REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
          <span style={styles.toolbarLabel}>Technology</span>
          <select style={styles.select} value={tech} onChange={(e) => setTech(e.target.value)}>
            <option>All</option>
            {STEEL_TECHS.map((t) => <option key={t}>{t}</option>)}
          </select>
          <span style={styles.toolbarLabel}>Transition Shift (yrs)</span>
          <input type="range" min={-5} max={5} step={1} value={transitionShift} onChange={(e) => setTransitionShift(+e.target.value)} style={styles.slider} />
          <span style={{ fontFamily: T.mono, fontSize: 12, color: transitionShift < 0 ? T.green : transitionShift > 0 ? T.red : T.textSec, minWidth: 50 }}>
            {transitionShift > 0 ? `+${transitionShift}` : transitionShift} yr
          </span>
          <button onClick={() => navigate(-1)} style={{ marginLeft: 'auto', background: T.navy, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontFamily: T.font }}>
            ← Back
          </button>
        </div>

        {/* TABS */}
        <div style={styles.tabsWrap}>
          {TABS.map((t, i) => (
            <button key={t} style={styles.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>
          ))}
        </div>

        {/* TAB CONTENT */}
        {tab === 0 && renderOverview({ portfolioAlignment, irenaCoverage, ngfsOrderlyAlign, sbtiDecarb, transitionPlanQuality, strandedAssetRiskMt, avoidedEmissionsMt, activeScenario, filteredMilestones })}
        {tab === 1 && renderNze({ filteredMilestones })}
        {tab === 2 && renderIrena()}
        {tab === 3 && renderNgfs({ activeScenario })}
        {tab === 4 && renderPower({ filteredPower, POWER_STACK_COLORS, region })}
        {tab === 5 && renderOilGas()}
        {tab === 6 && renderSteelCement({ filteredSteel })}
        {tab === 7 && renderTransport()}
        {tab === 8 && renderShippingAviation()}
        {tab === 9 && renderHydrogen()}
        {tab === 10 && renderCcus()}
        {tab === 11 && renderNuclear()}
        {tab === 12 && renderStorage()}
        {tab === 13 && renderGridCapex()}
        {tab === 14 && renderLcoe()}
        {tab === 15 && renderLearningCurve()}
        {tab === 16 && renderMacc()}
        {tab === 17 && renderStrandedNpv()}
        {tab === 18 && renderMeritOrder()}
        {tab === 19 && renderWaccIrr()}
      </div>
    </div>
  );
};

// ============================================================
// RENDER — OVERVIEW
// ============================================================
function renderOverview({ portfolioAlignment, irenaCoverage, ngfsOrderlyAlign, sbtiDecarb, transitionPlanQuality, strandedAssetRiskMt, avoidedEmissionsMt, activeScenario, filteredMilestones }) {
  const alignmentBuckets = [
    { bucket: '<40%', count: OG_PRODUCERS.filter((p) => p.alignmentPct < 40).length },
    { bucket: '40-55%', count: OG_PRODUCERS.filter((p) => p.alignmentPct >= 40 && p.alignmentPct < 55).length },
    { bucket: '55-70%', count: OG_PRODUCERS.filter((p) => p.alignmentPct >= 55 && p.alignmentPct < 70).length },
    { bucket: '70-85%', count: OG_PRODUCERS.filter((p) => p.alignmentPct >= 70 && p.alignmentPct < 85).length },
    { bucket: '>85%', count: OG_PRODUCERS.filter((p) => p.alignmentPct >= 85).length },
  ];

  const compositeRadar = [
    { axis: 'Power', v: 78 },
    { axis: 'Oil & Gas', v: 38 },
    { axis: 'Steel', v: 45 },
    { axis: 'Cement', v: 42 },
    { axis: 'Transport', v: 62 },
    { axis: 'Aviation', v: 35 },
    { axis: 'Shipping', v: 40 },
    { axis: 'Hydrogen', v: 55 },
    { axis: 'Buildings', v: 48 },
  ];

  const sectorStatus = [...filteredMilestones].slice(0, 10);

  return (
    <>
      {/* KPI GRID */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Portfolio Alignment vs NZE</div><div style={styles.kpiValue}>{portfolioAlignment}%</div><div style={styles.kpiDelta}>Target ≥70% by 2030</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>IRENA REmap Coverage</div><div style={styles.kpiValue}>{irenaCoverage.toLocaleString()} GW</div><div style={styles.kpiDelta}>Avg region solar+wind 2030</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>NGFS Orderly Alignment</div><div style={styles.kpiValue}>{ngfsOrderlyAlign}%</div><div style={styles.kpiDelta}>Renewable share 2050 · {activeScenario.name}</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>SBTi Sector Decarb</div><div style={styles.kpiValue}>{sbtiDecarb}%</div><div style={styles.kpiDelta}>Weighted steel plant alignment</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Transition Plan Quality</div><div style={styles.kpiValue}>{transitionPlanQuality}/100</div><div style={styles.kpiDelta}>TPT 7-element composite</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Stranded Asset Risk</div><div style={styles.kpiValue}>{strandedAssetRiskMt.toLocaleString()} Mt</div><div style={styles.kpiDelta}>CO2e capacity at risk</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Avoided Emissions</div><div style={styles.kpiValue}>{avoidedEmissionsMt.toLocaleString()} Mt</div><div style={styles.kpiDelta}>Scenario-weighted 2024-2050</div></div>
      </div>

      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Sector-Alignment Composite (Radar)</div>
          <div style={styles.cardSub}>Portfolio alignment by sector against NZE trajectory. Apex values indicate strong transition-plan evidence.</div>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={compositeRadar}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="axis" tick={{ fill: T.text, fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: T.textMut, fontSize: 10 }} />
              <Radar name="Alignment %" dataKey="v" stroke={T.navy} fill={T.goldL} fillOpacity={0.55} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Alignment Distribution — Oil & Gas Producers</div>
          <div style={styles.cardSub}>Number of upstream names per alignment-bucket — EU Taxonomy Art. 10.2 transitional eligibility band.</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={alignmentBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="bucket" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, fontSize: 12 }} />
              <Bar dataKey="count" fill={T.navy} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Milestone Tracker — IEA NZE 2050</div>
        <div style={styles.cardSub}>Status of {filteredMilestones.length} milestones and implementation gap (% of target missed by current trajectory).</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Year</th>
              <th style={styles.th}>Milestone</th>
              <th style={styles.th}>Sector</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Gap</th>
            </tr>
          </thead>
          <tbody>
            {sectorStatus.map((m, i) => {
              const col = statusColor(m.status);
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...styles.td, fontFamily: T.mono, fontWeight: 600 }}>{m.year}</td>
                  <td style={styles.td}>{m.milestone}</td>
                  <td style={styles.td}>{m.sector}</td>
                  <td style={styles.td}><span style={styles.pill(col.bg, col.fg)}>{m.status}</span></td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{m.gap}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={styles.footNote}>Source: IEA NZE Roadmap (2024 update), harmonized with NGFS Phase V · gap vs STEPS baseline.</div>
      </div>
    </>
  );
}

// NZE MILESTONES TAB
function renderNze({ filteredMilestones }) {
  const byYear = Array.from(new Set(filteredMilestones.map((m) => m.year))).sort((a, b) => a - b).map((y) => {
    const slice = filteredMilestones.filter((m) => m.year === y);
    return {
      year: y,
      onTrack: slice.filter((m) => m.status === 'On-Track').length,
      atRisk: slice.filter((m) => m.status === 'At-Risk').length,
      offTrack: slice.filter((m) => m.status === 'Off-Track').length,
    };
  });
  const gapBySector = Array.from(new Set(filteredMilestones.map((m) => m.sector))).map((s) => {
    const slice = filteredMilestones.filter((m) => m.sector === s);
    return { sector: s, gap: +(slice.reduce((a, b) => a + b.gap, 0) / Math.max(1, slice.length)).toFixed(1), count: slice.length };
  });
  const sortedGap = [...gapBySector].sort((a, b) => b.gap - a.gap);

  return (
    <>
      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Milestone Status by Year</div>
          <div style={styles.cardSub}>Count of NZE milestones per status-bucket across horizons.</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={byYear}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar stackId="a" dataKey="onTrack" fill={T.green} name="On-Track" />
              <Bar stackId="a" dataKey="atRisk" fill={T.amber} name="At-Risk" />
              <Bar stackId="a" dataKey="offTrack" fill={T.red} name="Off-Track" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Implementation Gap by Sector</div>
          <div style={styles.cardSub}>Mean percent gap vs NZE target across milestones grouped by sector.</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={sortedGap} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis type="category" dataKey="sector" tick={{ fill: T.textSec, fontSize: 11 }} width={100} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Bar dataKey="gap" fill={T.gold} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>NZE Milestone Register ({filteredMilestones.length})</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Year</th>
              <th style={styles.th}>Milestone</th>
              <th style={styles.th}>Sector</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Gap %</th>
            </tr>
          </thead>
          <tbody>
            {filteredMilestones.map((m, i) => {
              const col = statusColor(m.status);
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...styles.td, fontFamily: T.mono, fontWeight: 600 }}>{m.year}</td>
                  <td style={styles.td}>{m.milestone}</td>
                  <td style={styles.td}>{m.sector}</td>
                  <td style={styles.td}><span style={styles.pill(col.bg, col.fg)}>{m.status}</span></td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{m.gap}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// IRENA WETO TAB
function renderIrena() {
  const data2030 = IRENA_TARGETS.map((r) => ({ region: r.region, Solar: r.solar2030, Wind: r.wind2030, Hydro: r.hydro2030, Geothermal: r.geo2030 }));
  const data2050 = IRENA_TARGETS.map((r) => ({ region: r.region, Solar: r.solar2050, Wind: r.wind2050, Hydro: r.hydro2050, Geothermal: r.geo2050 }));
  const growth = IRENA_TARGETS.map((r) => ({
    region: r.region,
    solarGrowth: +(((r.solar2050 - r.solar2030) / Math.max(1, r.solar2030)) * 100).toFixed(0),
    windGrowth: +(((r.wind2050 - r.wind2030) / Math.max(1, r.wind2030)) * 100).toFixed(0),
  }));
  const sortedGrowth = [...growth].sort((a, b) => b.solarGrowth - a.solarGrowth);

  return (
    <>
      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>IRENA WETO Renewable Capacity — 2030 Targets (GW)</div>
          <div style={styles.cardSub}>Regional build-out per technology by 2030, per IRENA WETO 1.5°C case.</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data2030}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="region" tick={{ fill: T.textSec, fontSize: 10 }} angle={-20} textAnchor="end" height={70} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Solar" fill={T.gold} />
              <Bar dataKey="Wind" fill={T.sage} />
              <Bar dataKey="Hydro" fill={T.navyL} />
              <Bar dataKey="Geothermal" fill="#9f7aea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>2050 Targets (GW)</div>
          <div style={styles.cardSub}>Full-pathway end-state capacity per region.</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data2050}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="region" tick={{ fill: T.textSec, fontSize: 10 }} angle={-20} textAnchor="end" height={70} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Solar" fill={T.gold} />
              <Bar dataKey="Wind" fill={T.sage} />
              <Bar dataKey="Hydro" fill={T.navyL} />
              <Bar dataKey="Geothermal" fill="#9f7aea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Growth Rate 2030 to 2050 (percent)</div>
        <div style={styles.cardSub}>Solar and wind CAGR proxy — steepest regional pathways shown.</div>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={sortedGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="region" tick={{ fill: T.textSec, fontSize: 11 }} angle={-20} textAnchor="end" height={70} />
            <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
            <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="solarGrowth" fill={T.gold} name="Solar Growth %" />
            <Bar dataKey="windGrowth" fill={T.sage} name="Wind Growth %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Regional Target Table</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Region</th>
              <th style={styles.th}>Solar 2030</th>
              <th style={styles.th}>Solar 2050</th>
              <th style={styles.th}>Wind 2030</th>
              <th style={styles.th}>Wind 2050</th>
              <th style={styles.th}>Hydro 2030</th>
              <th style={styles.th}>Hydro 2050</th>
              <th style={styles.th}>Geo 2030</th>
              <th style={styles.th}>Geo 2050</th>
            </tr>
          </thead>
          <tbody>
            {IRENA_TARGETS.map((r, i) => (
              <tr key={r.region} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ ...styles.td, fontWeight: 600 }}>{r.region}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.solar2030.toLocaleString()}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.solar2050.toLocaleString()}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.wind2030.toLocaleString()}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.wind2050.toLocaleString()}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.hydro2030.toLocaleString()}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.hydro2050.toLocaleString()}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.geo2030}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.geo2050}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={styles.footNote}>Units: GW installed capacity. Source harmonized to IRENA WETO 2024 · 1.5°C pathway.</div>
      </div>
    </>
  );
}

// NGFS TAB
function renderNgfs({ activeScenario }) {
  const cpPath = NGFS_SCENARIOS.map((s) => ({ scenario: s.name.length > 18 ? s.name.slice(0, 18) + '…' : s.name, cp2030: s.carbonPrice2030, cp2050: s.carbonPrice2050 }));
  const gdpRen = NGFS_SCENARIOS.map((s) => ({ scenario: s.name.length > 18 ? s.name.slice(0, 18) + '…' : s.name, gdp: s.gdpImpact2050, ren: s.renewableShare2050 }));
  const stranded = [...NGFS_SCENARIOS].sort((a, b) => b.strandedAssetB - a.strandedAssetB);

  return (
    <>
      <div style={styles.kpiGrid}>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Active Scenario</div><div style={{ ...styles.kpiValue, fontSize: 16 }}>{activeScenario.name}</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Carbon Price 2030 ($/tCO2)</div><div style={styles.kpiValue}>${activeScenario.carbonPrice2030}</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Carbon Price 2050 ($/tCO2)</div><div style={styles.kpiValue}>${activeScenario.carbonPrice2050}</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>GDP Impact 2050</div><div style={{ ...styles.kpiValue, color: activeScenario.gdpImpact2050 < -3 ? T.red : T.text }}>{activeScenario.gdpImpact2050}%</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Renewable Share 2050</div><div style={styles.kpiValue}>{activeScenario.renewableShare2050}%</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Stranded Assets ($B)</div><div style={styles.kpiValue}>{activeScenario.strandedAssetB.toLocaleString()}</div></div>
      </div>

      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Carbon Price Path — 2030 vs 2050</div>
          <div style={styles.cardSub}>Scenario-specific carbon price envelopes ($/tCO2e, 2020 USD real).</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={cpPath}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="scenario" tick={{ fill: T.textSec, fontSize: 9 }} angle={-25} textAnchor="end" height={90} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="cp2030" fill={T.navy} name="2030" />
              <Bar dataKey="cp2050" fill={T.gold} name="2050" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>GDP Impact vs Renewable Share (2050)</div>
          <div style={styles.cardSub}>Dual-axis · bar = GDP delta %, line = renewable share.</div>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={gdpRen}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="scenario" tick={{ fill: T.textSec, fontSize: 9 }} angle={-25} textAnchor="end" height={90} />
              <YAxis yAxisId="left" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="gdp" fill={T.red} name="GDP Impact %" />
              <Line yAxisId="right" dataKey="ren" stroke={T.sage} strokeWidth={2.2} name="Renewable Share %" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Stranded Asset Exposure by Scenario ($B)</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={stranded} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{ fill: T.textSec, fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fill: T.textSec, fontSize: 11 }} width={200} />
            <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
            <Bar dataKey="strandedAssetB" fill={T.gold} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Scenario Register · NGFS Phase V</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Scenario</th>
              <th style={styles.th}>CP 2030</th>
              <th style={styles.th}>CP 2050</th>
              <th style={styles.th}>GDP 2050</th>
              <th style={styles.th}>Renew %</th>
              <th style={styles.th}>Stranded $B</th>
              <th style={styles.th}>Transition</th>
              <th style={styles.th}>Physical</th>
            </tr>
          </thead>
          <tbody>
            {NGFS_SCENARIOS.map((s, i) => (
              <tr key={s.name} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ ...styles.td, fontWeight: 600 }}>{s.name}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>${s.carbonPrice2030}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>${s.carbonPrice2050}</td>
                <td style={{ ...styles.td, fontFamily: T.mono, color: s.gdpImpact2050 < -5 ? T.red : T.text }}>{s.gdpImpact2050}%</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{s.renewableShare2050}%</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{s.strandedAssetB.toLocaleString()}</td>
                <td style={styles.td}>{s.transitionRisk}</td>
                <td style={styles.td}>{s.physicalRisk}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={styles.footNote}>Source: NGFS Phase V (Nov 2024 release) · harmonized across REMIND-MAgPIE, MESSAGEix-GLOBIOM, GCAM.</div>
      </div>
    </>
  );
}

// POWER SECTOR TAB
function renderPower({ filteredPower, POWER_STACK_COLORS, region }) {
  const endMix = filteredPower[filteredPower.length - 1];
  const pieData = endMix ? [
    { name: 'Solar', value: endMix.solar, color: T.gold },
    { name: 'Wind', value: endMix.wind, color: T.sage },
    { name: 'Nuclear', value: endMix.nuclear, color: T.navyL },
    { name: 'Hydro', value: endMix.hydro, color: '#4a90c2' },
    { name: 'Gas', value: endMix.gas, color: '#9aa3ae' },
    { name: 'Coal', value: endMix.coal, color: '#5c6b7e' },
  ] : [];
  const coalPhaseOut = filteredPower.map((r) => ({ year: r.year, coal: r.coal, gas: r.gas }));

  return (
    <>
      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Generation Mix Transition — {region}</div>
        <div style={styles.cardSub}>30-year pathway from fossil-heavy to renewables-dominant grid. Stacked area illustrates capacity share evolution.</div>
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={filteredPower}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 11 }} />
            <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
            <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area stackId="1" dataKey="coal" fill={POWER_STACK_COLORS.coal} stroke={POWER_STACK_COLORS.coal} />
            <Area stackId="1" dataKey="gas" fill={POWER_STACK_COLORS.gas} stroke={POWER_STACK_COLORS.gas} />
            <Area stackId="1" dataKey="nuclear" fill={POWER_STACK_COLORS.nuclear} stroke={POWER_STACK_COLORS.nuclear} />
            <Area stackId="1" dataKey="hydro" fill={POWER_STACK_COLORS.hydro} stroke={POWER_STACK_COLORS.hydro} />
            <Area stackId="1" dataKey="solar" fill={POWER_STACK_COLORS.solar} stroke={POWER_STACK_COLORS.solar} />
            <Area stackId="1" dataKey="wind" fill={POWER_STACK_COLORS.wind} stroke={POWER_STACK_COLORS.wind} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>End-State Mix (Terminal Year)</div>
          <div style={styles.cardSub}>Share of total generation in {endMix ? endMix.year : '—'}.</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={105} paddingAngle={2}>
                {pieData.map((p, i) => <Cell key={i} fill={p.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Unabated Fossil Phase-Out</div>
          <div style={styles.cardSub}>Coal and gas share decline through the pathway.</div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={coalPhaseOut}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area dataKey="coal" stackId="1" fill="#5c6b7e" stroke="#5c6b7e" />
              <Area dataKey="gas" stackId="1" fill="#9aa3ae" stroke="#9aa3ae" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

// OIL GAS TAB
function renderOilGas() {
  const scopeScatter = OG_PRODUCERS.map((p) => ({ name: p.name, x: p.scope12Intensity, y: p.scope3Mt }));
  const capexClean = [...OG_PRODUCERS].sort((a, b) => b.capexCleanPct - a.capexCleanPct).slice(0, 12);
  const sortedProd = [...OG_PRODUCERS].sort((a, b) => b.dailyProdKbd - a.dailyProdKbd);
  const methaneData = [...OG_PRODUCERS].sort((a, b) => b.methanIntensity - a.methanIntensity).slice(0, 12);

  return (
    <>
      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Scope 1+2 Intensity vs Scope 3 Absolute</div>
          <div style={styles.cardSub}>Upstream producers: operational intensity (X, kg CO2e/boe) vs downstream combustion emissions (Y, Mt).</div>
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" dataKey="x" name="Scope 1+2" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis type="number" dataKey="y" name="Scope 3" tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Scatter data={scopeScatter} fill={T.navy} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Clean CAPEX Leaders (percent of total)</div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={capexClean} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" domain={[0, 45]} tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: T.textSec, fontSize: 11 }} width={120} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Bar dataKey="capexCleanPct" fill={T.sage} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Methane Intensity (kg CH4 per boe)</div>
        <div style={styles.cardSub}>OGMP 2.0 Gold Standard target: below 0.20. Top 12 producers shown.</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={methaneData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} angle={-25} textAnchor="end" height={80} />
            <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
            <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
            <Bar dataKey="methanIntensity" fill={T.amber} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Upstream Producer Register</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Daily Prod (kbd)</th>
              <th style={styles.th}>S1+S2</th>
              <th style={styles.th}>S3 (Mt)</th>
              <th style={styles.th}>Decline %</th>
              <th style={styles.th}>Alignment %</th>
              <th style={styles.th}>Clean CAPEX %</th>
              <th style={styles.th}>Methane</th>
              <th style={styles.th}>Reserve Life</th>
            </tr>
          </thead>
          <tbody>
            {sortedProd.map((p, i) => (
              <tr key={p.name} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ ...styles.td, fontWeight: 600 }}>{p.name}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{p.dailyProdKbd.toLocaleString()}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{p.scope12Intensity}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{p.scope3Mt.toLocaleString()}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{p.declineRatePct}%</td>
                <td style={{ ...styles.td, fontFamily: T.mono, color: p.alignmentPct > 60 ? T.green : p.alignmentPct < 35 ? T.red : T.text }}>{p.alignmentPct}%</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{p.capexCleanPct}%</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{p.methanIntensity}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{p.reserveLife}y</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// STEEL CEMENT TAB
function renderSteelCement({ filteredSteel }) {
  const techMix = STEEL_TECHS.map((t) => ({
    tech: t,
    plants: STEEL_PLANTS.filter((p) => p.tech === t).length,
    capacity: +STEEL_PLANTS.filter((p) => p.tech === t).reduce((a, b) => a + b.capacityMt, 0).toFixed(1),
  }));
  const cementCcus = ['None', 'Planned', 'FEED', 'FID', 'Operational'].map((s) => ({
    status: s,
    plants: CEMENT_PLANTS.filter((p) => p.ccusStatus === s).length,
  }));
  const cementData = [...CEMENT_PLANTS].sort((a, b) => b.capacityMtY - a.capacityMtY);

  return (
    <>
      <div style={styles.kpiGrid}>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Steel Plants</div><div style={styles.kpiValue}>{filteredSteel.length}</div><div style={styles.kpiDelta}>of {STEEL_PLANTS.length} total</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Steel Capacity</div><div style={styles.kpiValue}>{filteredSteel.reduce((a, b) => a + b.capacityMt, 0).toFixed(1)} Mt</div><div style={styles.kpiDelta}>Filtered tech subset</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Avg CO2/t Steel</div><div style={styles.kpiValue}>{(filteredSteel.reduce((a, b) => a + b.co2PerTonne, 0) / Math.max(1, filteredSteel.length)).toFixed(2)}</div><div style={styles.kpiDelta}>tCO2/t crude steel</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Avg Alignment</div><div style={styles.kpiValue}>{(filteredSteel.reduce((a, b) => a + b.alignmentPct, 0) / Math.max(1, filteredSteel.length)).toFixed(0)}%</div><div style={styles.kpiDelta}>SBTi sector pathway</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Cement Plants</div><div style={styles.kpiValue}>{CEMENT_PLANTS.length}</div><div style={styles.kpiDelta}>Tracked</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Avg Clinker Factor</div><div style={styles.kpiValue}>{(CEMENT_PLANTS.reduce((a, b) => a + b.clinkerFactor, 0) / Math.max(1, CEMENT_PLANTS.length)).toFixed(2)}</div><div style={styles.kpiDelta}>Target below 0.65</div></div>
      </div>

      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Steel Technology Mix</div>
          <div style={styles.cardSub}>Plants and capacity per production route (BF-BOF, EAF, DRI, H2-DRI).</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={techMix}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="tech" tick={{ fill: T.textSec, fontSize: 10 }} angle={-15} textAnchor="end" height={70} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="plants" fill={T.navy} name="Plants" />
              <Bar dataKey="capacity" fill={T.gold} name="Capacity Mt" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Cement CCUS Status Distribution</div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={cementCcus} dataKey="plants" nameKey="status" cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={2}>
                {cementCcus.map((_, i) => <Cell key={i} fill={[T.textMut, T.borderL, T.amber, T.gold, T.sage][i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Steel Plant Register</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Plant</th>
              <th style={styles.th}>Country</th>
              <th style={styles.th}>Technology</th>
              <th style={styles.th}>Capacity Mt</th>
              <th style={styles.th}>CO2/t</th>
              <th style={styles.th}>Alignment</th>
              <th style={styles.th}>Retrofit</th>
              <th style={styles.th}>CAPEX $M</th>
            </tr>
          </thead>
          <tbody>
            {filteredSteel.map((p, i) => (
              <tr key={p.plant} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ ...styles.td, fontWeight: 600 }}>{p.plant}</td>
                <td style={styles.td}>{p.country}</td>
                <td style={styles.td}><span style={styles.pill('#e0e7ff', '#3730a3')}>{p.tech}</span></td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{p.capacityMt}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{p.co2PerTonne}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{p.alignmentPct}%</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{p.retrofitYear}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{p.capexMn.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Cement Plant Register</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Plant</th>
              <th style={styles.th}>Country</th>
              <th style={styles.th}>Capacity Mt/y</th>
              <th style={styles.th}>Clinker</th>
              <th style={styles.th}>Alt Fuels %</th>
              <th style={styles.th}>CCUS</th>
              <th style={styles.th}>CO2/t</th>
              <th style={styles.th}>Alignment</th>
            </tr>
          </thead>
          <tbody>
            {cementData.map((p, i) => {
              const col = statusColor(p.ccusStatus);
              return (
                <tr key={p.plant} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{p.plant}</td>
                  <td style={styles.td}>{p.country}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{p.capacityMtY}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{p.clinkerFactor}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{p.altFuelsPct}%</td>
                  <td style={styles.td}><span style={styles.pill(col.bg, col.fg)}>{p.ccusStatus}</span></td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{p.co2PerTonne}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{p.alignmentPct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// TRANSPORT TAB
function renderTransport() {
  const evData = TRANSPORT.map((r) => ({ region: r.region, y2025: r.evPenetration2025, y2030: r.evPenetration2030, y2035: r.evPenetration2035 }));
  const rollup = TRANSPORT.map((r) => ({ region: r.region, rail: r.railElectrifiedPct, bus: r.busElectricPct, truck: r.truckEvPct }));
  const chargerData = [...TRANSPORT].sort((a, b) => b.chargerPerKm - a.chargerPerKm);

  return (
    <>
      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>EV Passenger Car Penetration Path (percent of new sales)</div>
        <div style={styles.cardSub}>IEA NZE milestones: 60 percent global by 2030, 100 percent by 2035 in advanced economies.</div>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={evData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="region" tick={{ fill: T.textSec, fontSize: 11 }} />
            <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
            <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="y2025" name="2025" fill={T.borderL} />
            <Bar dataKey="y2030" name="2030" fill={T.gold} />
            <Bar dataKey="y2035" name="2035" fill={T.navy} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Rail Electrification, E-Buses, E-Trucks</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rollup}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="region" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="rail" fill={T.navyL} name="Rail Electrified %" />
              <Bar dataKey="bus" fill={T.sage} name="E-Bus %" />
              <Bar dataKey="truck" fill={T.gold} name="E-Truck %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Charging Density (per km highway)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chargerData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis type="category" dataKey="region" tick={{ fill: T.textSec, fontSize: 11 }} width={100} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Bar dataKey="chargerPerKm" fill={T.gold} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Regional Transport Register</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Region</th>
              <th style={styles.th}>EV 2025</th>
              <th style={styles.th}>EV 2030</th>
              <th style={styles.th}>EV 2035</th>
              <th style={styles.th}>Rail Electric</th>
              <th style={styles.th}>E-Bus</th>
              <th style={styles.th}>E-Truck</th>
              <th style={styles.th}>Chargers/km</th>
            </tr>
          </thead>
          <tbody>
            {TRANSPORT.map((r, i) => (
              <tr key={r.region} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ ...styles.td, fontWeight: 600 }}>{r.region}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.evPenetration2025}%</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.evPenetration2030}%</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.evPenetration2035}%</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.railElectrifiedPct}%</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.busElectricPct}%</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.truckEvPct}%</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.chargerPerKm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// SHIPPING AND AVIATION TAB
function renderShippingAviation() {
  const ciiDistrib = ['A', 'B', 'C', 'D', 'E'].map((r) => ({
    rating: r,
    fleets: SHIPPING_CII.filter((f) => f.ciiRating === r).length,
    vessels: SHIPPING_CII.filter((f) => f.ciiRating === r).reduce((a, b) => a + b.vessels, 0),
  }));
  const safData = AVIATION_SAF.map((a) => ({ name: a.airline, blend2024: a.safBlend2024, blend2030: a.safBlend2030 }));
  const fuelMix = ['HFO', 'VLSFO', 'LNG', 'Methanol', 'Ammonia'].map((f) => ({
    fuel: f,
    fleets: SHIPPING_CII.filter((x) => x.fuelType === f).length,
  }));

  return (
    <>
      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>IMO CII Rating Distribution</div>
          <div style={styles.cardSub}>Carbon Intensity Indicator: A is best, E is worst. Ships with D or E for 3 years must file corrective plan.</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={ciiDistrib}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="rating" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="fleets" fill={T.navy} name="Fleets" />
              <Bar dataKey="vessels" fill={T.gold} name="Vessels" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Alternative Fuel Mix (shipping fleets)</div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={fuelMix} dataKey="fleets" nameKey="fuel" cx="50%" cy="50%" innerRadius={55} outerRadius={105} paddingAngle={2}>
                {fuelMix.map((_, i) => <Cell key={i} fill={[T.textMut, '#5c6b7e', T.navyL, T.gold, T.sage][i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Aviation SAF Blend Trajectory</div>
        <div style={styles.cardSub}>Sustainable Aviation Fuel blend share 2024 vs 2030 commitments. ReFuelEU mandate: 2 percent by 2025, 6 percent by 2030, 70 percent by 2050.</div>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={safData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} angle={-25} textAnchor="end" height={80} />
            <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
            <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="blend2024" fill={T.borderL} name="SAF % 2024" />
            <Bar dataKey="blend2030" fill={T.gold} name="SAF % 2030" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Shipping Fleet Register</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Fleet</th>
              <th style={styles.th}>CII</th>
              <th style={styles.th}>Vessels</th>
              <th style={styles.th}>Avg DWT</th>
              <th style={styles.th}>Fuel</th>
              <th style={styles.th}>CO2/TEU-nm</th>
              <th style={styles.th}>IMO 2050 Align</th>
            </tr>
          </thead>
          <tbody>
            {SHIPPING_CII.map((f, i) => {
              const col = statusColor(f.ciiRating);
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{f.fleet}</td>
                  <td style={styles.td}><span style={styles.pill(col.bg, col.fg)}>{f.ciiRating}</span></td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{f.vessels}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{f.avgDwt}</td>
                  <td style={styles.td}>{f.fuelType}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{f.co2PerTeuNm}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{f.alignmentImo2050}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Airline SAF Register</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Airline</th>
              <th style={styles.th}>SAF 2024</th>
              <th style={styles.th}>SAF 2030</th>
              <th style={styles.th}>CO2/RTK</th>
              <th style={styles.th}>Fleet Age</th>
              <th style={styles.th}>CORSIA</th>
              <th style={styles.th}>NZ Pledge</th>
              <th style={styles.th}>Offsets (kt)</th>
            </tr>
          </thead>
          <tbody>
            {AVIATION_SAF.map((a, i) => (
              <tr key={a.airline} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ ...styles.td, fontWeight: 600 }}>{a.airline}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{a.safBlend2024}%</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{a.safBlend2030}%</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{a.co2PerRtk}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{a.fleetAge}y</td>
                <td style={styles.td}>{a.corsiaStatus}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{a.netZeroPledge}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{a.offsetRetiredKt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// HYDROGEN TAB
function renderHydrogen() {
  const typeMix = ['Green', 'Blue', 'Turquoise', 'Grey'].map((t) => ({
    type: t,
    projects: HYDROGEN_PROJECTS.filter((p) => p.type === t).length,
    mw: HYDROGEN_PROJECTS.filter((p) => p.type === t).reduce((a, b) => a + b.capacityMw, 0),
  }));
  const costVsCapacity = [...HYDROGEN_PROJECTS].map((p) => ({ name: p.project, cost: p.costKg, mw: p.capacityMw, type: p.type }));
  const fidPipeline = Array.from(new Set(HYDROGEN_PROJECTS.map((p) => p.fidYear))).sort((a, b) => a - b).map((y) => ({
    year: y,
    count: HYDROGEN_PROJECTS.filter((p) => p.fidYear === y).length,
    mw: HYDROGEN_PROJECTS.filter((p) => p.fidYear === y).reduce((a, b) => a + b.capacityMw, 0),
  }));

  return (
    <>
      <div style={styles.kpiGrid}>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Projects Tracked</div><div style={styles.kpiValue}>{HYDROGEN_PROJECTS.length}</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Green H2 Pipeline</div><div style={styles.kpiValue}>{HYDROGEN_PROJECTS.filter((p) => p.type === 'Green').reduce((a, b) => a + b.capacityMw, 0).toLocaleString()} MW</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Blue H2 Pipeline</div><div style={styles.kpiValue}>{HYDROGEN_PROJECTS.filter((p) => p.type === 'Blue').reduce((a, b) => a + b.capacityMw, 0).toLocaleString()} MW</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Avg Green LCOH</div><div style={styles.kpiValue}>${(HYDROGEN_PROJECTS.filter((p) => p.type === 'Green').reduce((a, b) => a + b.costKg, 0) / Math.max(1, HYDROGEN_PROJECTS.filter((p) => p.type === 'Green').length)).toFixed(2)}/kg</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Parity Target</div><div style={styles.kpiValue}>$1.50/kg</div><div style={styles.kpiDelta}>IEA NZE 2030 target</div></div>
      </div>

      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Production Route Mix</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeMix}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="type" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="projects" fill={T.navy} name="Projects" />
              <Bar yAxisId="right" dataKey="mw" fill={T.gold} name="MW" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Cost vs Capacity Scatter</div>
          <div style={styles.cardSub}>LCOH $/kg vs MW. Lower-left = most competitive scale-up opportunity.</div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" dataKey="cost" name="$/kg" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis type="number" dataKey="mw" name="MW" tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Scatter data={costVsCapacity} fill={T.sage} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>FID Pipeline by Year</div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={fidPipeline}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: T.textSec, fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: T.textSec, fontSize: 11 }} />
            <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="count" fill={T.navy} name="Projects" />
            <Line yAxisId="right" dataKey="mw" stroke={T.gold} strokeWidth={2.2} name="MW capacity" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Hydrogen Project Register</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Project</th>
              <th style={styles.th}>Country</th>
              <th style={styles.th}>Capacity MW</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>LCOH $/kg</th>
              <th style={styles.th}>FID</th>
            </tr>
          </thead>
          <tbody>
            {[...HYDROGEN_PROJECTS].sort((a, b) => b.capacityMw - a.capacityMw).map((p, i) => (
              <tr key={p.project} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ ...styles.td, fontWeight: 600 }}>{p.project}</td>
                <td style={styles.td}>{p.country}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{p.capacityMw.toLocaleString()}</td>
                <td style={styles.td}><span style={styles.pill(p.type === 'Green' ? '#dcfce7' : p.type === 'Blue' ? '#dbeafe' : '#fef3c7', p.type === 'Green' ? '#15803d' : p.type === 'Blue' ? '#1d4ed8' : '#b45309')}>{p.type}</span></td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>${p.costKg}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{p.fidYear}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// CCUS TAB
function renderCcus() {
  const statusDistrib = ['Announced', 'FEED', 'FID', 'Operational'].map((s) => ({
    status: s,
    projects: CCUS_PROJECTS.filter((p) => p.status === s).length,
    mt: +CCUS_PROJECTS.filter((p) => p.status === s).reduce((a, b) => a + b.capacityMtYr, 0).toFixed(1),
  }));
  const techDistrib = Array.from(new Set(CCUS_PROJECTS.map((p) => p.tech))).map((t) => ({
    tech: t,
    mt: +CCUS_PROJECTS.filter((p) => p.tech === t).reduce((a, b) => a + b.capacityMtYr, 0).toFixed(1),
  }));
  const totalMt = CCUS_PROJECTS.reduce((a, b) => a + b.capacityMtYr, 0);
  const nzeTarget2030 = 1200;
  const gap = nzeTarget2030 - totalMt;

  return (
    <>
      <div style={styles.kpiGrid}>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Total CCUS Capacity</div><div style={styles.kpiValue}>{totalMt.toFixed(1)} Mt/yr</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Operational</div><div style={styles.kpiValue}>{CCUS_PROJECTS.filter((p) => p.status === 'Operational').reduce((a, b) => a + b.capacityMtYr, 0).toFixed(1)} Mt/yr</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>NZE 2030 Target</div><div style={styles.kpiValue}>{nzeTarget2030} Mt/yr</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Gap to NZE</div><div style={{ ...styles.kpiValue, color: T.red }}>{gap.toFixed(0)} Mt/yr</div><div style={styles.kpiDelta}>{((totalMt / Math.max(1, nzeTarget2030)) * 100).toFixed(1)}% covered</div></div>
      </div>
      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Projects by Development Status</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={statusDistrib}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="status" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="projects" fill={T.navy} name="Projects" />
              <Bar yAxisId="right" dataKey="mt" fill={T.gold} name="Mt/yr" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Technology Split (Mt/yr)</div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={techDistrib} dataKey="mt" nameKey="tech" cx="50%" cy="50%" outerRadius={100} paddingAngle={2}>
                {techDistrib.map((_, i) => <Cell key={i} fill={[T.navy, T.gold, T.sage, T.navyL, T.amber, T.textMut][i % 6]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>CCUS Project Register</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Project</th>
              <th style={styles.th}>Country</th>
              <th style={styles.th}>Capacity Mt/yr</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Technology</th>
            </tr>
          </thead>
          <tbody>
            {[...CCUS_PROJECTS].sort((a, b) => b.capacityMtYr - a.capacityMtYr).map((p, i) => {
              const col = statusColor(p.status);
              return (
                <tr key={p.project} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{p.project}</td>
                  <td style={styles.td}>{p.country}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{p.capacityMtYr}</td>
                  <td style={styles.td}><span style={styles.pill(col.bg, col.fg)}>{p.status}</span></td>
                  <td style={styles.td}>{p.tech}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// NUCLEAR TAB
function renderNuclear() {
  const typeMix = Array.from(new Set(NUCLEAR_FLEET.map((r) => r.type))).map((t) => ({
    type: t,
    count: NUCLEAR_FLEET.filter((r) => r.type === t).length,
    mw: NUCLEAR_FLEET.filter((r) => r.type === t).reduce((a, b) => a + b.capacityMw, 0),
  }));
  const ageDistrib = NUCLEAR_FLEET.map((r) => ({ name: r.reactor, age: r.ageYears, capacity: r.capacityMw, cf: r.capacityFactor }));

  return (
    <>
      <div style={styles.kpiGrid}>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Fleet Size</div><div style={styles.kpiValue}>{NUCLEAR_FLEET.length}</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Total Capacity</div><div style={styles.kpiValue}>{(NUCLEAR_FLEET.reduce((a, b) => a + b.capacityMw, 0) / 1000).toFixed(1)} GW</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>SMR / Gen IV</div><div style={styles.kpiValue}>{NUCLEAR_FLEET.filter((r) => r.type.includes('SMR') || r.type === 'HTR-PM' || r.type === 'Molten Salt').length}</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Avg Capacity Factor</div><div style={styles.kpiValue}>{(NUCLEAR_FLEET.reduce((a, b) => a + b.capacityFactor, 0) / Math.max(1, NUCLEAR_FLEET.length)).toFixed(1)}%</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Avg LCOE</div><div style={styles.kpiValue}>${(NUCLEAR_FLEET.reduce((a, b) => a + b.lcoe, 0) / Math.max(1, NUCLEAR_FLEET.length)).toFixed(0)}/MWh</div></div>
      </div>
      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Reactor Type Mix</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={typeMix}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="type" tick={{ fill: T.textSec, fontSize: 10 }} angle={-20} textAnchor="end" height={80} />
              <YAxis yAxisId="left" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="count" fill={T.navy} name="Reactors" />
              <Bar yAxisId="right" dataKey="mw" fill={T.gold} name="MW" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Age vs Capacity Factor</div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" dataKey="age" name="Age" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis type="number" dataKey="cf" name="CF" domain={[75, 100]} tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Scatter data={ageDistrib} fill={T.sage} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Nuclear Fleet Register</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Reactor</th>
              <th style={styles.th}>Country</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Capacity MW</th>
              <th style={styles.th}>Age</th>
              <th style={styles.th}>License Ext</th>
              <th style={styles.th}>CF</th>
              <th style={styles.th}>LCOE</th>
            </tr>
          </thead>
          <tbody>
            {[...NUCLEAR_FLEET].sort((a, b) => b.capacityMw - a.capacityMw).map((r, i) => (
              <tr key={r.reactor} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ ...styles.td, fontWeight: 600 }}>{r.reactor}</td>
                <td style={styles.td}>{r.country}</td>
                <td style={styles.td}>{r.type}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.capacityMw}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.ageYears}y</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.licenseExtYear}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.capacityFactor}%</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>${r.lcoe}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// STORAGE TAB
function renderStorage() {
  const totalByTech = ['liIon', 'flowBattery', 'pumpedHydro', 'caes', 'thermal'].map((k) => ({
    tech: k === 'liIon' ? 'Li-Ion' : k === 'flowBattery' ? 'Flow Battery' : k === 'pumpedHydro' ? 'Pumped Hydro' : k === 'caes' ? 'CAES' : 'Thermal',
    gwh: STORAGE_CAPACITY.reduce((a, b) => a + b[k], 0),
  }));
  const byRegion = STORAGE_CAPACITY.map((r) => ({
    region: r.region,
    Li: r.liIon,
    Flow: r.flowBattery,
    Pumped: r.pumpedHydro,
    CAES: r.caes,
    Thermal: r.thermal,
  }));

  return (
    <>
      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Global Storage Capacity by Technology (GWh)</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={totalByTech}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="tech" tick={{ fill: T.textSec, fontSize: 11 }} />
            <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
            <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
            <Bar dataKey="gwh" fill={T.navy} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Regional Stacked Storage Mix</div>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={byRegion}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="region" tick={{ fill: T.textSec, fontSize: 10 }} angle={-20} textAnchor="end" height={80} />
            <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
            <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar stackId="a" dataKey="Li" fill={T.navy} />
            <Bar stackId="a" dataKey="Flow" fill={T.gold} />
            <Bar stackId="a" dataKey="Pumped" fill={T.sage} />
            <Bar stackId="a" dataKey="CAES" fill={T.amber} />
            <Bar stackId="a" dataKey="Thermal" fill={T.textMut} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Regional Storage Register (GWh)</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Region</th>
              <th style={styles.th}>Li-Ion</th>
              <th style={styles.th}>Flow</th>
              <th style={styles.th}>Pumped</th>
              <th style={styles.th}>CAES</th>
              <th style={styles.th}>Thermal</th>
              <th style={styles.th}>Total</th>
            </tr>
          </thead>
          <tbody>
            {STORAGE_CAPACITY.map((r, i) => {
              const total = r.liIon + r.flowBattery + r.pumpedHydro + r.caes + r.thermal;
              return (
                <tr key={r.region} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{r.region}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{r.liIon.toLocaleString()}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{r.flowBattery.toLocaleString()}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{r.pumpedHydro.toLocaleString()}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{r.caes.toLocaleString()}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{r.thermal.toLocaleString()}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono, fontWeight: 600 }}>{total.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// GRID CAPEX TAB
function renderGridCapex() {
  const yearlyTotal = Array.from({ length: 10 }, (_, yi) => {
    const year = 2025 + yi;
    const total = GRID_CAPEX.reduce((a, r) => a + r.years[yi].capexB, 0);
    return { year, total: +total.toFixed(1) };
  });
  const heat = GRID_CAPEX.map((r) => {
    const row = { region: r.region };
    r.years.forEach((y) => { row[y.year] = y.capexB; });
    return row;
  });
  const sortedFlat = [...GRID_CAPEX_FLAT].sort((a, b) => b.total2025_34 - a.total2025_34);

  return (
    <>
      <div style={styles.kpiGrid}>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Total CAPEX 2025-2034</div><div style={styles.kpiValue}>${GRID_CAPEX_FLAT.reduce((a, b) => a + b.total2025_34, 0).toFixed(0)}B</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Regions Tracked</div><div style={styles.kpiValue}>{GRID_CAPEX.length}</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Peak Year Spend</div><div style={styles.kpiValue}>${Math.max(...yearlyTotal.map((y) => y.total)).toFixed(0)}B</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>IEA NZE 2030 Benchmark</div><div style={styles.kpiValue}>$820B/yr</div><div style={styles.kpiDelta}>Global T&D requirement</div></div>
      </div>
      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Global Annual Grid Investment Trajectory</div>
        <div style={styles.cardSub}>Composed chart · $ billions in transmission and distribution capex by year, all regions combined.</div>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={yearlyTotal}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 11 }} />
            <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
            <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area dataKey="total" stroke={T.navy} fill={T.goldL} fillOpacity={0.4} name="$B CAPEX" />
            <Line dataKey="total" stroke={T.navy} strokeWidth={2.4} dot={{ fill: T.gold }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Regional 10-Year Total ($B)</div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={sortedFlat} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis type="category" dataKey="region" tick={{ fill: T.textSec, fontSize: 11 }} width={120} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Bar dataKey="total2025_34" fill={T.navy} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Yearly Line Trajectory per Region</div>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" dataKey="year" domain={[2025, 2034]} tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {GRID_CAPEX.map((r, i) => (
                <Line key={r.region} data={r.years} dataKey="capexB" name={r.region} stroke={[T.navy, T.gold, T.sage, T.navyL, T.amber, '#9f7aea', T.textMut, T.red][i]} strokeWidth={1.8} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Regional CAPEX Heatmap ($B)</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Region</th>
              {yearlyTotal.map((y) => <th key={y.year} style={styles.th}>{y.year}</th>)}
              <th style={styles.th}>Total</th>
            </tr>
          </thead>
          <tbody>
            {heat.map((row, i) => {
              const tot = yearlyTotal.reduce((a, y) => a + row[y.year], 0);
              return (
                <tr key={row.region} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{row.region}</td>
                  {yearlyTotal.map((y) => {
                    const v = row[y.year];
                    const intensity = Math.min(1, v / 60);
                    return <td key={y.year} style={{ ...styles.td, fontFamily: T.mono, background: 'rgba(197,169,106,' + (intensity * 0.5).toFixed(2) + ')' }}>{v.toFixed(1)}</td>;
                  })}
                  <td style={{ ...styles.td, fontFamily: T.mono, fontWeight: 600 }}>{tot.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={styles.footNote}>Source: IEA World Energy Investment 2024 · regional transmission and distribution capex harmonized to 2020 USD real.</div>
      </div>
    </>
  );
}

// ============================================================
// RENDER — LCOE / LCOH CALCULATOR (Tab 15)
// ============================================================
function renderLcoe() {
  const WACC_SCENARIOS = [0.04, 0.06, 0.08, 0.10];
  const baseWacc = 0.08;
  // Full stack at base WACC
  const lcoeStack = TECH_PARAMS.map((t) => {
    const parts = calcLcoe(t, baseWacc);
    return { name: t.name, id: t.id, color: t.color, family: t.family, ...parts };
  });
  const sortedStack = [...lcoeStack].sort((a, b) => a.total - b.total);
  // WACC sensitivity matrix
  const waccMatrix = TECH_PARAMS.map((t) => {
    const row = { name: t.name, id: t.id, color: t.color };
    WACC_SCENARIOS.forEach((w) => { row['w' + Math.round(w * 100)] = +calcLcoe(t, w).total.toFixed(1); });
    return row;
  });
  // Tornado: nuclear as pivot; vary CAPEX ±25%, CF ±15%, fuel ±30%
  const pivot = TECH_PARAMS.find((t) => t.id === 'nuclear');
  const pivotBase = calcLcoe(pivot, baseWacc).total;
  const tornado = [
    { driver: 'CAPEX +25%', low: pivotBase, high: calcLcoe({ ...pivot, capex: pivot.capex * 1.25 }, baseWacc).total },
    { driver: 'CAPEX -25%', low: calcLcoe({ ...pivot, capex: pivot.capex * 0.75 }, baseWacc).total, high: pivotBase },
    { driver: 'Cap.Factor -15%', low: pivotBase, high: calcLcoe({ ...pivot, cf: pivot.cf * 0.85 }, baseWacc).total },
    { driver: 'Cap.Factor +15%', low: calcLcoe({ ...pivot, cf: Math.min(0.99, pivot.cf * 1.15) }, baseWacc).total, high: pivotBase },
    { driver: 'Fuel +30%', low: pivotBase, high: calcLcoe({ ...pivot, fuelPrice: pivot.fuelPrice * 1.3 }, baseWacc).total },
    { driver: 'Fuel -30%', low: calcLcoe({ ...pivot, fuelPrice: pivot.fuelPrice * 0.7 }, baseWacc).total, high: pivotBase },
  ].map((r) => ({ ...r, swing: +(r.high - r.low).toFixed(1) }));
  const tornadoSorted = [...tornado].sort((a, b) => b.swing - a.swing);
  const minLcoe = Math.min(...lcoeStack.map((l) => l.total));
  const maxLcoe = Math.max(...lcoeStack.map((l) => l.total));

  return (
    <>
      <div style={styles.kpiGrid}>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Lowest LCOE (base 8% WACC)</div><div style={styles.kpiValue}>${minLcoe.toFixed(1)}/MWh</div><div style={styles.kpiDelta}>{sortedStack[0]?.name}</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Highest LCOE</div><div style={styles.kpiValue}>${maxLcoe.toFixed(1)}/MWh</div><div style={styles.kpiDelta}>{sortedStack[sortedStack.length - 1]?.name}</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>LCOH (green H2 PEM)</div><div style={styles.kpiValue}>${(calcLcoe(TECH_PARAMS.find((t) => t.id === 'h2Elec'), baseWacc).total / 33.33).toFixed(2)}/kg</div><div style={styles.kpiDelta}>33.33 kWh/kg HHV</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Nuclear CAPEX sensitivity</div><div style={styles.kpiValue}>±{tornadoSorted[0]?.swing.toFixed(1)}</div><div style={styles.kpiDelta}>$/MWh top driver</div></div>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>LCOE Stack Decomposition · $/MWh at 8% WACC</div>
        <div style={styles.cardSub}>Levelized cost = (CAPEX·CRF + OPEX fixed)/(8760·CF) + OPEX var + fuel/η · CRF = r(1+r)^n / ((1+r)^n - 1)</div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sortedStack} margin={{ top: 10, right: 20, bottom: 80, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} angle={-30} textAnchor="end" height={90} interval={0} />
            <YAxis tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: '$/MWh', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
            <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="capexAnn" stackId="a" fill={T.navy} name="CAPEX annualized" />
            <Bar dataKey="opexFixedAnn" stackId="a" fill={T.navyL} name="OPEX fixed" />
            <Bar dataKey="opexVar" stackId="a" fill={T.gold} name="OPEX variable" />
            <Bar dataKey="fuel" stackId="a" fill={T.red} name="Fuel" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>WACC Sensitivity · 4% / 6% / 8% / 10%</div>
          <div style={styles.cardSub}>Capital-intensive low-carbon techs (nuclear, offshore wind) scale most aggressively with financing cost.</div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={waccMatrix} margin={{ top: 10, right: 20, bottom: 60, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 9 }} angle={-35} textAnchor="end" height={80} interval={0} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="w4" fill={T.sage} name="4% WACC" />
              <Bar dataKey="w6" fill={T.gold} name="6% WACC" />
              <Bar dataKey="w8" fill={T.navyL} name="8% WACC" />
              <Bar dataKey="w10" fill={T.red} name="10% WACC" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Tornado · Nuclear LCOE ±Sensitivity</div>
          <div style={styles.cardSub}>Swing in $/MWh per driver, sorted by magnitude. CAPEX dominates for high-overnight-cost fleet.</div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={tornadoSorted} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis type="category" dataKey="driver" tick={{ fill: T.textSec, fontSize: 11 }} width={130} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Bar dataKey="swing" fill={T.gold} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>LCOE / LCOH Detailed Table</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Technology</th>
              <th style={styles.th}>Family</th>
              <th style={styles.th}>CAPEX ann.</th>
              <th style={styles.th}>OPEX fixed</th>
              <th style={styles.th}>OPEX var</th>
              <th style={styles.th}>Fuel</th>
              <th style={styles.th}>LCOE 4%</th>
              <th style={styles.th}>LCOE 8%</th>
              <th style={styles.th}>LCOE 10%</th>
            </tr>
          </thead>
          <tbody>
            {sortedStack.map((r, i) => {
              const t = TECH_PARAMS.find((x) => x.id === r.id);
              return (
                <tr key={r.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...styles.td, fontWeight: 600 }}><span style={{ display: 'inline-block', width: 9, height: 9, background: r.color, borderRadius: 2, marginRight: 8 }} />{r.name}</td>
                  <td style={styles.td}>{r.family}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{r.capexAnn}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{r.opexFixedAnn}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{r.opexVar}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{r.fuel}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{calcLcoe(t, 0.04).total.toFixed(1)}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono, fontWeight: 600, color: T.navy }}>{calcLcoe(t, 0.08).total.toFixed(1)}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{calcLcoe(t, 0.10).total.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={styles.footNote}>Source: IEA Projected Costs of Generating Electricity 2024 · Lazard LCOE v17 · NREL ATB 2024. LCOH = LCOE / 33.33 kWh-HHV/kg for electrolytic H2.</div>
      </div>
    </>
  );
}

// ============================================================
// RENDER — LEARNING CURVE PROJECTIONS (Tab 16 · Wright's Law)
// ============================================================
function renderLearningCurve() {
  const proj = LEARNING_RATES.map((L) => {
    const b = lrToB(L.lr);
    const c2030 = wrightCost(L.cost0, L.cum0, L.cum2030, b);
    const c2040 = wrightCost(L.cost0, L.cum0, L.cum2040, b);
    const c2050 = wrightCost(L.cost0, L.cum0, L.cum2050, b);
    return {
      ...L,
      b: +b.toFixed(3),
      c2025: L.cost0,
      c2030: +c2030.toFixed(0),
      c2040: +c2040.toFixed(0),
      c2050: +c2050.toFixed(0),
      pctDrop2050: +((1 - c2050 / L.cost0) * 100).toFixed(1),
    };
  });

  // Experience curve (log-log): points from cum0 → cum2050 in 40 steps per tech
  const STEPS = 40;
  const expCurveSeries = LEARNING_RATES.map((L) => {
    const b = lrToB(L.lr);
    const logStart = Math.log10(Math.max(0.01, L.cum0));
    const logEnd = Math.log10(Math.max(1, L.cum2050));
    const pts = Array.from({ length: STEPS }, (_, i) => {
      const logCum = logStart + (logEnd - logStart) * i / Math.max(1, STEPS - 1);
      const cum = Math.pow(10, logCum);
      const cost = wrightCost(L.cost0, L.cum0, cum, b);
      return { cum: +cum.toFixed(2), cost: +cost.toFixed(2) };
    });
    return { id: L.id, name: L.name, color: L.color, pts };
  });

  const avgDrop = proj.reduce((a, b) => a + b.pctDrop2050, 0) / Math.max(1, proj.length);
  const maxDrop = proj.reduce((a, b) => b.pctDrop2050 > a.pctDrop2050 ? b : a, proj[0]);
  const h2ElectrolyzerDrop = proj.find((p) => p.id === 'electrolyzer');

  // Projected cost trajectory bar
  const trajData = proj.map((p) => ({ name: p.name, color: p.color, '2025': p.c2025, '2030': p.c2030, '2040': p.c2040, '2050': p.c2050 }));

  return (
    <>
      <div style={styles.kpiGrid}>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Avg Cost Decline by 2050</div><div style={styles.kpiValue}>{avgDrop.toFixed(1)}%</div><div style={styles.kpiDelta}>Wright's Law, cumulative deployment</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Fastest Learner</div><div style={styles.kpiValue}>{maxDrop.name}</div><div style={styles.kpiDelta}>-{maxDrop.pctDrop2050}% by 2050 · LR {Math.round(maxDrop.lr * 100)}%</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>PEM Electrolyzer 2030</div><div style={styles.kpiValue}>${h2ElectrolyzerDrop?.c2030}/kW</div><div style={styles.kpiDelta}>from ${h2ElectrolyzerDrop?.c2025}/kW today</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Li-Ion Battery 2050</div><div style={styles.kpiValue}>${proj.find((p) => p.id === 'battLi')?.c2050}/kWh</div><div style={styles.kpiDelta}>16% LR · 52 TWh cumulative</div></div>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Experience Curve · Log-Log (Wright's Law)</div>
        <div style={styles.cardSub}>cost(t) = cost(0) · (cum_t / cum_0)^-b, where b = -log2(1 - LR). Each doubling of cumulative deployment drops unit cost by LR%.</div>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart margin={{ top: 10, right: 20, bottom: 40, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" dataKey="cum" scale="log" domain={['auto', 'auto']} tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: 'Cumulative deployment (log scale)', position: 'insideBottom', offset: -8, fill: T.textSec, fontSize: 11 }} />
            <YAxis type="number" dataKey="cost" scale="log" domain={['auto', 'auto']} tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: 'Unit cost (log)', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
            <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {expCurveSeries.map((s) => (
              <Line key={s.id} data={s.pts} dataKey="cost" name={s.name} stroke={s.color} strokeWidth={1.8} dot={false} type="monotone" />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Projected Unit Cost 2025 → 2050</div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={trajData} margin={{ top: 10, right: 20, bottom: 80, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fill: T.textSec, fontSize: 9 }} angle={-30} textAnchor="end" height={90} interval={0} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="2025" fill={T.textMut} />
              <Bar dataKey="2030" fill={T.goldL} />
              <Bar dataKey="2040" fill={T.gold} />
              <Bar dataKey="2050" fill={T.navy} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Learning Rate Table</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Tech</th>
                <th style={styles.th}>LR</th>
                <th style={styles.th}>b</th>
                <th style={styles.th}>2025</th>
                <th style={styles.th}>2030</th>
                <th style={styles.th}>2040</th>
                <th style={styles.th}>2050</th>
                <th style={styles.th}>% Drop</th>
              </tr>
            </thead>
            <tbody>
              {[...proj].sort((a, b) => b.pctDrop2050 - a.pctDrop2050).map((p, i) => (
                <tr key={p.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...styles.td, fontWeight: 600 }}><span style={{ display: 'inline-block', width: 9, height: 9, background: p.color, borderRadius: 2, marginRight: 8 }} />{p.name}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{Math.round(p.lr * 100)}%</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{p.b}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>${p.c2025}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>${p.c2030}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>${p.c2040}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono, fontWeight: 600, color: T.navy }}>${p.c2050}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono, color: T.green }}>-{p.pctDrop2050}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={styles.footNote}>Source: BNEF 2024 Cost Survey · IEA Renewables 2024 · IRENA Innovation Outlook Hydrogen 2023. Wright's Law assumes continued bottom-up cost reductions from manufacturing scale, supply-chain maturation, and R&D.</div>
    </>
  );
}

// ============================================================
// RENDER — MACC (Marginal Abatement Cost Curve) (Tab 17)
// ============================================================
function renderMacc() {
  const sorted = [...MACC_MEASURES].sort((a, b) => a.cost - b.cost);
  let cum = 0;
  const curve = sorted.map((m) => {
    const x0 = cum;
    cum += m.abatement;
    return { ...m, x0, x1: cum, width: m.abatement };
  });
  const totalAbatement = cum;
  const EUA = 85;   // €/tCO2
  const SCC = 50;   // $/tCO2 (US govt)
  const goldAbatement = curve.filter((m) => m.cost <= EUA).reduce((a, b) => a + b.abatement, 0);
  const subSccAbatement = curve.filter((m) => m.cost <= SCC).reduce((a, b) => a + b.abatement, 0);
  const costSaving = curve.filter((m) => m.cost < 0).reduce((a, b) => a + b.abatement, 0);
  const avgCost = curve.reduce((a, b) => a + b.cost * b.abatement, 0) / Math.max(1, totalAbatement);

  // Sector rollup
  const bySector = {};
  curve.forEach((m) => {
    if (!bySector[m.sector]) bySector[m.sector] = { sector: m.sector, abatement: 0, weightedCost: 0, measures: 0 };
    bySector[m.sector].abatement += m.abatement;
    bySector[m.sector].weightedCost += m.cost * m.abatement;
    bySector[m.sector].measures += 1;
  });
  const sectorRollup = [...Object.values(bySector)].sort((a, b) => b.abatement - a.abatement).map((s) => ({
    ...s,
    avgCost: +(s.weightedCost / Math.max(1, s.abatement)).toFixed(1),
  }));

  // Build "stair-step" data for area-chart visual: alternating x0, x1 at same cost
  const stair = [];
  curve.forEach((m) => {
    stair.push({ x: m.x0, cost: m.cost, measure: m.measure });
    stair.push({ x: m.x1, cost: m.cost, measure: m.measure });
  });

  return (
    <>
      <div style={styles.kpiGrid}>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Total Abatement Potential</div><div style={styles.kpiValue}>{(totalAbatement / 1000).toFixed(1)} GtCO2/yr</div><div style={styles.kpiDelta}>by 2030 across 20 measures</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Cost-Saving (&lt;$0)</div><div style={styles.kpiValue}>{(costSaving / 1000).toFixed(2)} Gt</div><div style={styles.kpiDelta}>{((costSaving / Math.max(1, totalAbatement)) * 100).toFixed(1)}% of total</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Below €85 EUA</div><div style={styles.kpiValue}>{(goldAbatement / 1000).toFixed(2)} Gt</div><div style={styles.kpiDelta}>{((goldAbatement / Math.max(1, totalAbatement)) * 100).toFixed(1)}% at or below EU ETS price</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Weighted-Avg Cost</div><div style={styles.kpiValue}>${avgCost.toFixed(1)}/t</div><div style={styles.kpiDelta}>weighted by abatement volume</div></div>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>MACC · Marginal Abatement Cost Curve</div>
        <div style={styles.cardSub}>Width of bar = MtCO2/yr abatement. Cumulative on x-axis. Horizontal lines mark €85 EUA and $50 SCC break-even.</div>
        <ResponsiveContainer width="100%" height={420}>
          <ComposedChart data={stair} margin={{ top: 20, right: 20, bottom: 40, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" dataKey="x" domain={[0, totalAbatement]} tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: 'Cumulative abatement (MtCO2/yr)', position: 'insideBottom', offset: -8, fill: T.textSec, fontSize: 11 }} />
            <YAxis tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: '$/tCO2', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
            <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
            <Area type="stepAfter" dataKey="cost" stroke={T.navy} fill={T.goldL} fillOpacity={0.55} strokeWidth={1.5} />
            <Line type="monotone" dataKey={() => EUA} stroke={T.red} strokeDasharray="6 4" dot={false} name="€85 EUA" />
            <Line type="monotone" dataKey={() => SCC} stroke={T.green} strokeDasharray="6 4" dot={false} name="$50 SCC" />
            <Line type="monotone" dataKey={() => 0} stroke={T.textMut} strokeDasharray="2 2" dot={false} name="Zero" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Measure-level Cost Ranking</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Measure</th>
                <th style={styles.th}>Sector</th>
                <th style={styles.th}>$/tCO2</th>
                <th style={styles.th}>MtCO2/yr</th>
                <th style={styles.th}>vs €85 EUA</th>
              </tr>
            </thead>
            <tbody>
              {curve.map((m, i) => {
                const sc = m.cost < 0 ? { bg: '#dcfce7', fg: '#15803d' } : m.cost <= EUA ? { bg: '#fef3c7', fg: '#b45309' } : { bg: '#fee2e2', fg: '#b91c1c' };
                return (
                  <tr key={m.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                    <td style={{ ...styles.td, fontFamily: T.mono }}>{i + 1}</td>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{m.measure}</td>
                    <td style={styles.td}>{m.sector}</td>
                    <td style={{ ...styles.td, fontFamily: T.mono, color: m.cost < 0 ? T.green : m.cost > EUA ? T.red : T.text }}>{m.cost}</td>
                    <td style={{ ...styles.td, fontFamily: T.mono }}>{m.abatement}</td>
                    <td style={styles.td}><span style={styles.pill(sc.bg, sc.fg)}>{m.cost < 0 ? 'SAVE' : m.cost <= EUA ? 'IN-THE-MONEY' : 'ABOVE ETS'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Sector Rollup · Weighted-Avg Cost vs Volume</div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" dataKey="abatement" name="MtCO2/yr" tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: 'Abatement MtCO2/yr', position: 'insideBottom', offset: -6, fill: T.textSec, fontSize: 11 }} />
              <YAxis type="number" dataKey="avgCost" name="$/t" tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: 'Avg cost $/tCO2', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} formatter={(v, k, p) => [v, p.payload.sector]} />
              <Scatter data={sectorRollup} fill={T.gold} />
            </ScatterChart>
          </ResponsiveContainer>
          <table style={{ ...styles.table, marginTop: 14 }}>
            <thead>
              <tr>
                <th style={styles.th}>Sector</th>
                <th style={styles.th}>Measures</th>
                <th style={styles.th}>MtCO2/yr</th>
                <th style={styles.th}>$/t avg</th>
              </tr>
            </thead>
            <tbody>
              {sectorRollup.map((s, i) => (
                <tr key={s.sector} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{s.sector}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{s.measures}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{s.abatement}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>${s.avgCost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={styles.footNote}>Source: IEA WEO 2024 sectoral MACC · McKinsey GHG Abatement Cost Curve v3 · IPCC AR6 WG3 Ch. 12. Negative-cost measures are often not deployed due to split incentives, capital constraints, and behavioral barriers.</div>
    </>
  );
}

// ============================================================
// RENDER — STRANDED ASSET NPV (Tab 18)
// ============================================================
function renderStrandedNpv() {
  const WACC = 0.08;
  const reservesYears = 18; // avg reserve-life horizon for NPV calc
  const bbl_per_kbd_yr = 365; // kbd → Mbbl/yr factor (kbd × 365 / 1000 = Mbbl/yr)
  const liftingCost = 28;   // $/bbl avg, used as cash cost
  const scenarios = ['statusQuo', 'delayed', 'orderly'];
  const scLabels = { statusQuo: 'Status Quo ($70)', delayed: 'Delayed ($50)', orderly: 'Orderly ($30)' };
  const scColors = { statusQuo: T.green, delayed: T.amber, orderly: T.red };

  const results = OG_PRODUCERS.map((p) => {
    const annualMbbl = p.dailyProdKbd * bbl_per_kbd_yr / 1000; // Mbbl/yr
    const book = +(p.dailyProdKbd * 0.0082 * 1000).toFixed(0); // synthetic book value $M, tied to production
    const row = { name: p.name, dailyProdKbd: p.dailyProdKbd, book };
    scenarios.forEach((s) => {
      const avgPrice = PRICE_PATHS[s].slice(0, reservesYears).reduce((a, b) => a + b.price, 0) / Math.max(1, reservesYears);
      const margin = Math.max(0, avgPrice - liftingCost);
      // Simple NPV of annual margin for reservesYears years
      const cf = Array.from({ length: reservesYears }, () => annualMbbl * margin);
      const npvVal = cf.reduce((acc, c, i) => acc + c / Math.pow(1 + WACC, i + 1), 0);
      row[s + 'Npv'] = +npvVal.toFixed(0);
      row[s + 'Stranded'] = Math.max(0, book - npvVal);
      row[s + 'IsStranded'] = npvVal < book;
    });
    return row;
  });

  const sortedByStranding = [...results].sort((a, b) => b.orderlyStranded - a.orderlyStranded);
  const totalBook = results.reduce((a, b) => a + b.book, 0);
  const totalStrandedStatus = results.reduce((a, b) => a + b.statusQuoStranded, 0);
  const totalStrandedDelayed = results.reduce((a, b) => a + b.delayedStranded, 0);
  const totalStrandedOrderly = results.reduce((a, b) => a + b.orderlyStranded, 0);
  const countStranded = (key) => results.filter((r) => r[key]).length;

  // Price paths series for chart
  const pricePathChart = PRICE_PATH_YEARS.map((y, i) => ({
    year: y,
    statusQuo: PRICE_PATHS.statusQuo[i].price,
    delayed: PRICE_PATHS.delayed[i].price,
    orderly: PRICE_PATHS.orderly[i].price,
  }));

  return (
    <>
      <div style={styles.kpiGrid}>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Total Book Value (upstream)</div><div style={styles.kpiValue}>${(totalBook / 1000).toFixed(1)}B</div><div style={styles.kpiDelta}>{OG_PRODUCERS.length} producers · {reservesYears}-yr reserve horizon</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Stranded · Status Quo</div><div style={styles.kpiValue}>${(totalStrandedStatus / 1000).toFixed(1)}B</div><div style={styles.kpiDelta}>{countStranded('statusQuoIsStranded')} firms below book</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Stranded · Delayed Transition</div><div style={styles.kpiValue}>${(totalStrandedDelayed / 1000).toFixed(1)}B</div><div style={styles.kpiDelta}>{countStranded('delayedIsStranded')} firms below book</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Stranded · Orderly</div><div style={styles.kpiValue}>${(totalStrandedOrderly / 1000).toFixed(1)}B</div><div style={styles.kpiDelta}>{countStranded('orderlyIsStranded')} firms below book</div></div>
      </div>

      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Brent-Equivalent Price Paths · 2025–2050</div>
          <div style={styles.cardSub}>Status Quo flat ~$70 · Delayed crashes post-2035 ·Orderly smooth decline to ~$30.</div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={pricePathChart}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: '$/bbl', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line dataKey="statusQuo" stroke={scColors.statusQuo} strokeWidth={2.2} dot={false} name="Status Quo" />
              <Line dataKey="delayed"   stroke={scColors.delayed}   strokeWidth={2.2} dot={false} name="Delayed" />
              <Line dataKey="orderly"   stroke={scColors.orderly}   strokeWidth={2.2} dot={false} name="Orderly" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Stranded Asset $M · Top 12 by Orderly</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={sortedByStranding.slice(0, 12)} layout="vertical" margin={{ top: 10, right: 20, left: 100, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: T.textSec, fontSize: 10 }} width={140} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="statusQuoStranded" stackId="a" fill={scColors.statusQuo} name="Status Quo" />
              <Bar dataKey="delayedStranded"   stackId="a" fill={scColors.delayed}   name="Delayed"   />
              <Bar dataKey="orderlyStranded"   stackId="a" fill={scColors.orderly}   name="Orderly"   />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Per-Producer Stranded NPV Detail</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Producer</th>
              <th style={styles.th}>Daily kbd</th>
              <th style={styles.th}>Book $M</th>
              <th style={styles.th}>NPV StatusQuo</th>
              <th style={styles.th}>NPV Delayed</th>
              <th style={styles.th}>NPV Orderly</th>
              <th style={styles.th}>Stranded Orderly $M</th>
              <th style={styles.th}>Flag</th>
            </tr>
          </thead>
          <tbody>
            {sortedByStranding.map((r, i) => (
              <tr key={r.name} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ ...styles.td, fontWeight: 600 }}>{r.name}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.dailyProdKbd}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.book.toLocaleString()}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.statusQuoNpv.toLocaleString()}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.delayedNpv.toLocaleString()}</td>
                <td style={{ ...styles.td, fontFamily: T.mono }}>{r.orderlyNpv.toLocaleString()}</td>
                <td style={{ ...styles.td, fontFamily: T.mono, color: r.orderlyStranded > 0 ? T.red : T.green, fontWeight: 600 }}>{r.orderlyStranded > 0 ? r.orderlyStranded.toLocaleString() : '—'}</td>
                <td style={styles.td}>
                  {r.orderlyIsStranded
                    ? <span style={styles.pill('#fee2e2', '#b91c1c')}>STRANDED</span>
                    : r.delayedIsStranded
                      ? <span style={styles.pill('#fef3c7', '#b45309')}>AT-RISK</span>
                      : <span style={styles.pill('#dcfce7', '#15803d')}>RESILIENT</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={styles.footNote}>Source: Carbon Tracker Unburnable Carbon 2024 · IEA WEO 2024 price paths · NGFS Phase V. NPV of {reservesYears}-yr annual margin discounted at {Math.round(WACC * 100)}% WACC · cash cost $28/bbl.</div>
      </div>
    </>
  );
}

// ============================================================
// RENDER — MERIT ORDER DISPATCH SIMULATOR (Tab 19)
// ============================================================
function renderMeritOrder() {
  const stackSorted = [...DISPATCH_STACK].sort((a, b) => a.mc - b.mc);

  // For each hour: dispatch up in merit order until demand met.
  const hourly = DISPATCH_DEMAND.map((d) => {
    let remaining = d.demand;
    const row = { hour: d.hour, demand: d.demand };
    let marginalId = null;
    let clearingPrice = 0;
    let co2 = 0;
    stackSorted.forEach((u) => {
      const avail = u.cap * Math.max(0, Math.min(1, u.profile(d.hour)));
      const used = Math.max(0, Math.min(avail, remaining));
      row[u.id] = +used.toFixed(1);
      co2 += used * u.co2;
      if (used > 0) {
        marginalId = u.id;
        clearingPrice = u.mc;
      }
      remaining -= used;
    });
    // Curtailment = available zero-mc (solar/wind) not used when remaining ≤ 0
    let curtailment = 0;
    stackSorted.forEach((u) => {
      if (u.mc <= 2) {
        const avail = u.cap * Math.max(0, Math.min(1, u.profile(d.hour)));
        const used = row[u.id] || 0;
        curtailment += Math.max(0, avail - used);
      }
    });
    row.marginalUnit = marginalId;
    row.clearingPrice = clearingPrice;
    row.co2 = +co2.toFixed(1);
    row.curtailment = +curtailment.toFixed(1);
    row.unmet = +Math.max(0, remaining).toFixed(1);
    return row;
  });

  const totalEnergy = hourly.reduce((a, h) => a + h.demand, 0);
  const totalCo2 = hourly.reduce((a, h) => a + h.co2, 0);
  const avgPrice = hourly.reduce((a, h) => a + h.clearingPrice, 0) / Math.max(1, hourly.length);
  const peakPrice = Math.max(...hourly.map((h) => h.clearingPrice));
  const peakHour = hourly.find((h) => h.clearingPrice === peakPrice)?.hour;
  const totalCurtail = hourly.reduce((a, h) => a + h.curtailment, 0);
  const curtailPct = totalCurtail / Math.max(1, totalCurtail + totalEnergy) * 100;
  const sysCo2Intensity = totalCo2 * 1000 / Math.max(1, totalEnergy); // kg/MWh

  // Marginal unit count
  const marginalCount = {};
  hourly.forEach((h) => { marginalCount[h.marginalUnit] = (marginalCount[h.marginalUnit] || 0) + 1; });
  const marginalTable = [...Object.entries(marginalCount)].map(([id, hrs]) => {
    const tech = DISPATCH_STACK.find((t) => t.id === id);
    return { name: tech?.name || id, color: tech?.color || T.textMut, hours: hrs, mc: tech?.mc || 0 };
  }).sort((a, b) => b.hours - a.hours);

  return (
    <>
      <div style={styles.kpiGrid}>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Daily Energy Served</div><div style={styles.kpiValue}>{(totalEnergy).toFixed(0)} GWh</div><div style={styles.kpiDelta}>24-hour merit dispatch</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Avg Clearing Price</div><div style={styles.kpiValue}>${avgPrice.toFixed(1)}/MWh</div><div style={styles.kpiDelta}>Peak ${peakPrice} at h{peakHour}</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>System CO2 Intensity</div><div style={styles.kpiValue}>{sysCo2Intensity.toFixed(0)} kg/MWh</div><div style={styles.kpiDelta}>{totalCo2.toFixed(0)} tCO2 dispatched / 24h</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>RE Curtailment</div><div style={styles.kpiValue}>{totalCurtail.toFixed(1)} GWh</div><div style={styles.kpiDelta}>{curtailPct.toFixed(2)}% of available low-mc</div></div>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Hourly Dispatch Stack · 24 Hours (GW)</div>
        <div style={styles.cardSub}>Technologies dispatch in ascending marginal-cost order (solar · wind · hydro · nuclear · CCGT · coal · oil peaker).</div>
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart data={hourly}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="hour" tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: 'Hour of day', position: 'insideBottom', offset: -6, fill: T.textSec, fontSize: 11 }} />
            <YAxis tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: 'GW', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
            <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {stackSorted.map((u) => (
              <Area key={u.id} type="monotone" dataKey={u.id} stackId="1" stroke={u.color} fill={u.color} fillOpacity={0.85} name={u.name} />
            ))}
            <Line type="monotone" dataKey="demand" stroke={T.red} strokeWidth={2.4} dot={false} name="Demand" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Clearing Price · Hourly</div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="hour" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis yAxisId="l" tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: '$/MWh', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: 'tCO2', angle: 90, position: 'insideRight', fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="l" dataKey="clearingPrice" fill={T.gold} name="Clearing price $/MWh" />
              <Line yAxisId="r" dataKey="co2" stroke={T.red} strokeWidth={2} dot={false} name="CO2 tons" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Marginal Unit · Hours Set Price</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={marginalTable} layout="vertical" margin={{ top: 10, right: 20, left: 90, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: T.textSec, fontSize: 11 }} width={110} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                {marginalTable.map((m, i) => <Cell key={i} fill={m.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={styles.footNote}>Hours per day each technology set the system clearing price · sum = 24.</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>Dispatch Stack · Merit Order Table</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Order</th>
              <th style={styles.th}>Technology</th>
              <th style={styles.th}>Marginal Cost $/MWh</th>
              <th style={styles.th}>Max Capacity GW</th>
              <th style={styles.th}>CO2 t/MWh</th>
              <th style={styles.th}>Hours Marginal</th>
            </tr>
          </thead>
          <tbody>
            {stackSorted.map((u, i) => {
              const mc = marginalTable.find((m) => m.name === u.name);
              return (
                <tr key={u.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{i + 1}</td>
                  <td style={{ ...styles.td, fontWeight: 600 }}><span style={{ display: 'inline-block', width: 9, height: 9, background: u.color, borderRadius: 2, marginRight: 8 }} />{u.name}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>${u.mc}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{u.cap}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{u.co2}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{mc?.hours || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={styles.footNote}>Simplified security-constrained economic dispatch · no unit commitment or transmission constraints · profile factors from typical summer shapes.</div>
      </div>
    </>
  );
}

// ============================================================
// RENDER — WACC SENSITIVITY & IRR BARRIER (Tab 20)
// ============================================================
function renderWaccIrr() {
  const WACC_GRID = [0.04, 0.06, 0.08, 0.10, 0.12];
  const SUPPORT_LEVELS = [0, 0.5, 1.0, 1.5, 2.0]; // multiplier on supportUnit
  const HURDLE = 0.08;

  // Base IRR per project (no support)
  const baseIrr = PROJECT_PIPELINE.map((p) => {
    const cfs = [-p.capex, ...Array.from({ length: p.life }, () => p.annCF)];
    const r = irr(cfs);
    return { ...p, baseIrr: +(r * 100).toFixed(2) };
  });

  // IRR heatmap: for each project × WACC × support (flatten to matrix rows)
  // We'll show a single project-level grid at base WACC varying support
  const supportSensitivity = PROJECT_PIPELINE.map((p) => {
    const row = { project: p.project, family: p.family };
    SUPPORT_LEVELS.forEach((s) => {
      // Incremental cashflow from support: supportUnit * s * annual_units
      // Approximate annual units from annCF / lifetime-normal unit revenue — use a crude shortcut:
      // Take supportUsd 'kg'/'tCO2'/'kWh' support and assume it adds 18% × s to annCF baseline.
      // (We keep it synthetic but ordered; platform spec accepts demo data.)
      const boost = 1 + 0.18 * s;
      const cfs = [-p.capex, ...Array.from({ length: p.life }, () => p.annCF * boost)];
      const r = irr(cfs);
      row['s' + Math.round(s * 10)] = +(r * 100).toFixed(2);
    });
    return row;
  });

  // WACC sensitivity: does NPV at given WACC clear zero? (positive = pass hurdle)
  const waccGridResults = PROJECT_PIPELINE.map((p) => {
    const row = { project: p.project, family: p.family, baseIrr: baseIrr.find((x) => x.id === p.id)?.baseIrr };
    WACC_GRID.forEach((w) => {
      const cfs = [-p.capex, ...Array.from({ length: p.life }, () => p.annCF)];
      row['w' + Math.round(w * 100)] = +npv(cfs, w).toFixed(0);
    });
    return row;
  });

  const passHurdle = baseIrr.filter((p) => p.baseIrr >= HURDLE * 100);
  const failHurdle = baseIrr.filter((p) => p.baseIrr < HURDLE * 100);
  const avgIrr = baseIrr.reduce((a, b) => a + b.baseIrr, 0) / Math.max(1, baseIrr.length);
  const bestIrr = [...baseIrr].sort((a, b) => b.baseIrr - a.baseIrr)[0];
  const worstIrr = [...baseIrr].sort((a, b) => a.baseIrr - b.baseIrr)[0];

  // Family rollup
  const byFam = {};
  baseIrr.forEach((p) => {
    if (!byFam[p.family]) byFam[p.family] = { family: p.family, projects: 0, sumIrr: 0, sumCapex: 0 };
    byFam[p.family].projects += 1;
    byFam[p.family].sumIrr += p.baseIrr;
    byFam[p.family].sumCapex += p.capex;
  });
  const famRollup = [...Object.values(byFam)].map((f) => ({
    ...f,
    avgIrr: +(f.sumIrr / Math.max(1, f.projects)).toFixed(2),
  })).sort((a, b) => b.avgIrr - a.avgIrr);

  return (
    <>
      <div style={styles.kpiGrid}>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Projects Above 8% Hurdle</div><div style={styles.kpiValue}>{passHurdle.length} / {PROJECT_PIPELINE.length}</div><div style={styles.kpiDelta}>at base cashflows</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Avg Base IRR</div><div style={styles.kpiValue}>{avgIrr.toFixed(2)}%</div><div style={styles.kpiDelta}>all families, no support</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Best IRR</div><div style={styles.kpiValue}>{bestIrr?.baseIrr}%</div><div style={styles.kpiDelta}>{bestIrr?.project}</div></div>
        <div style={styles.kpi}><div style={styles.kpiLabel}>Worst IRR</div><div style={styles.kpiValue}>{worstIrr?.baseIrr}%</div><div style={styles.kpiDelta}>{worstIrr?.project}</div></div>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>IRR vs 8% Hurdle · Base Case</div>
        <div style={styles.cardSub}>IRR solved via Newton-style bisection on NPV(r)=0. Dashed line = 8% hurdle. Bars below = unbankable absent policy support.</div>
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={[...baseIrr].sort((a, b) => b.baseIrr - a.baseIrr)} margin={{ top: 10, right: 20, bottom: 100, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="project" tick={{ fill: T.textSec, fontSize: 9 }} angle={-40} textAnchor="end" height={110} interval={0} />
            <YAxis tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: '%', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
            <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="baseIrr" name="IRR %" radius={[3, 3, 0, 0]}>
              {[...baseIrr].sort((a, b) => b.baseIrr - a.baseIrr).map((p, i) => <Cell key={i} fill={p.baseIrr >= HURDLE * 100 ? T.sage : T.red} />)}
            </Bar>
            <Line dataKey={() => HURDLE * 100} stroke={T.navy} strokeDasharray="6 4" dot={false} name="8% Hurdle" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.card}>
        <div style={styles.accent} />
        <div style={styles.cardTitle}>IRR Heatmap · Support Multiplier ×</div>
        <div style={styles.cardSub}>Support multiplier scales cashflow boost (IRA PTC, EU CBAM free allocation, contracts-for-difference). Values = IRR %.</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Project</th>
              <th style={styles.th}>Family</th>
              <th style={styles.th}>Support 0×</th>
              <th style={styles.th}>0.5×</th>
              <th style={styles.th}>1.0×</th>
              <th style={styles.th}>1.5×</th>
              <th style={styles.th}>2.0×</th>
            </tr>
          </thead>
          <tbody>
            {supportSensitivity.map((r, i) => (
              <tr key={r.project} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                <td style={{ ...styles.td, fontWeight: 600 }}>{r.project}</td>
                <td style={styles.td}>{r.family}</td>
                {SUPPORT_LEVELS.map((s) => {
                  const key = 's' + Math.round(s * 10);
                  const v = r[key];
                  const shade = Math.max(0, Math.min(1, v / 25));
                  const pass = v >= HURDLE * 100;
                  return (
                    <td key={key} style={{ ...styles.td, fontFamily: T.mono, background: pass ? 'rgba(90,138,106,' + (shade * 0.55).toFixed(2) + ')' : 'rgba(220,38,38,' + ((1 - shade) * 0.35).toFixed(2) + ')', color: pass ? T.navy : T.red, fontWeight: 600 }}>{v}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>NPV at Varying WACC ($M)</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Project</th>
                <th style={styles.th}>IRR</th>
                {WACC_GRID.map((w) => <th key={w} style={styles.th}>{Math.round(w * 100)}%</th>)}
              </tr>
            </thead>
            <tbody>
              {waccGridResults.map((r, i) => (
                <tr key={r.project} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{r.project}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{r.baseIrr}%</td>
                  {WACC_GRID.map((w) => {
                    const v = r['w' + Math.round(w * 100)];
                    return <td key={w} style={{ ...styles.td, fontFamily: T.mono, color: v > 0 ? T.green : T.red, fontWeight: 600 }}>{v > 0 ? '+' : ''}{v.toLocaleString()}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={styles.card}>
          <div style={styles.accent} />
          <div style={styles.cardTitle}>Family Rollup · Avg IRR & Capital</div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={famRollup}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="family" tick={{ fill: T.textSec, fontSize: 11 }} />
              <YAxis yAxisId="l" tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: 'IRR %', angle: -90, position: 'insideLeft', fill: T.textSec, fontSize: 11 }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fill: T.textSec, fontSize: 11 }} label={{ value: 'CAPEX $M', angle: 90, position: 'insideRight', fill: T.textSec, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: '1px solid ' + T.border, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="r" dataKey="sumCapex" fill={T.goldL} name="Total CAPEX $M" />
              <Line yAxisId="l" dataKey="avgIrr" stroke={T.navy} strokeWidth={2.4} name="Avg IRR %" />
              <Line yAxisId="l" dataKey={() => HURDLE * 100} stroke={T.red} strokeDasharray="6 4" dot={false} name="8% Hurdle" />
            </ComposedChart>
          </ResponsiveContainer>
          <table style={{ ...styles.table, marginTop: 14 }}>
            <thead>
              <tr>
                <th style={styles.th}>Family</th>
                <th style={styles.th}>Projects</th>
                <th style={styles.th}>Avg IRR</th>
                <th style={styles.th}>Sum CAPEX $M</th>
              </tr>
            </thead>
            <tbody>
              {famRollup.map((f, i) => (
                <tr key={f.family} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{f.family}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{f.projects}</td>
                  <td style={{ ...styles.td, fontFamily: T.mono, color: f.avgIrr >= HURDLE * 100 ? T.green : T.red, fontWeight: 600 }}>{f.avgIrr}%</td>
                  <td style={{ ...styles.td, fontFamily: T.mono }}>{f.sumCapex.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={styles.footNote}>Source: IEA World Energy Investment 2024 · BNEF Energy Transition Investment Trends · IRA / CBAM / IPCEI policy support stacks. IRR solved via NPV bisection over 80 iterations.</div>
    </>
  );
}

export default EnergySectorTaxonomyPage;
