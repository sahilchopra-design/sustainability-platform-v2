import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell, Legend, ScatterChart, Scatter,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, ReferenceLine
} from 'recharts';

/* ══════════════════════════════════════════════════════════════
   Theme & PRNG
   ══════════════════════════════════════════════════════════════ */
const T = {
  surface: '#fafaf7', border: '#e2e0d8', navy: '#1b2a4a', gold: '#b8962e',
  text: '#1a1a2e', sub: '#64748b', card: '#ffffff', indigo: '#4f46e5',
  green: '#065f46', red: '#991b1b', amber: '#92400e'
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const fmt = n =>
  n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' :
  n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' :
  n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' :
  typeof n === 'number' ? n.toFixed(1) : n;

const pct = n => typeof n === 'number' ? n.toFixed(1) + '%' : '--';

const TABS = [
  'Cat Model Dashboard', 'Peril Analysis', 'Event Set Explorer',
  'EP Curve Builder', 'Regional Exposure', "Lloyd's RDS",
  'Climate Scenarios', 'Portfolio Analytics', 'Loss Development',
  'Climate Stress Test'
];

const COLORS = [
  T.navy, T.indigo, T.green, T.red, T.amber, T.gold,
  '#7c3aed', '#0891b2', '#be185d', '#4338ca',
  '#059669', '#b45309', '#6d28d9', '#0d9488', '#dc2626'
];

/* ══════════════════════════════════════════════════════════════
   PERILS — 15 climate perils (RMS/AIR/CoreLogic taxonomy)
   ══════════════════════════════════════════════════════════════ */
const PERILS = [
  { name: 'Hurricane/Typhoon', category: 'atmospheric',
    avgAnnualLoss_mn: 42000, volatility: 0.85, trend_pct_decade: 8.2,
    modelConfidence: 'High', climateInfluence: 'Dominant',
    returnPeriod100yr_mn: 180000, returnPeriod250yr_mn: 310000, returnPeriod500yr_mn: 420000 },
  { name: 'Earthquake', category: 'geological',
    avgAnnualLoss_mn: 28000, volatility: 0.92, trend_pct_decade: 0.5,
    modelConfidence: 'Medium', climateInfluence: 'Limited',
    returnPeriod100yr_mn: 250000, returnPeriod250yr_mn: 480000, returnPeriod500yr_mn: 680000 },
  { name: 'Flood (Riverine)', category: 'hydrological',
    avgAnnualLoss_mn: 35000, volatility: 0.65, trend_pct_decade: 12.1,
    modelConfidence: 'Medium', climateInfluence: 'Dominant',
    returnPeriod100yr_mn: 120000, returnPeriod250yr_mn: 200000, returnPeriod500yr_mn: 290000 },
  { name: 'Flood (Pluvial)', category: 'hydrological',
    avgAnnualLoss_mn: 18000, volatility: 0.70, trend_pct_decade: 14.5,
    modelConfidence: 'Low', climateInfluence: 'Dominant',
    returnPeriod100yr_mn: 65000, returnPeriod250yr_mn: 110000, returnPeriod500yr_mn: 160000 },
  { name: 'Wildfire', category: 'atmospheric',
    avgAnnualLoss_mn: 22000, volatility: 0.88, trend_pct_decade: 18.7,
    modelConfidence: 'Low', climateInfluence: 'Dominant',
    returnPeriod100yr_mn: 95000, returnPeriod250yr_mn: 170000, returnPeriod500yr_mn: 250000 },
  { name: 'Severe Convective Storm', category: 'atmospheric',
    avgAnnualLoss_mn: 38000, volatility: 0.55, trend_pct_decade: 5.8,
    modelConfidence: 'High', climateInfluence: 'Significant',
    returnPeriod100yr_mn: 85000, returnPeriod250yr_mn: 130000, returnPeriod500yr_mn: 175000 },
  { name: 'Winter Storm / Freeze', category: 'atmospheric',
    avgAnnualLoss_mn: 15000, volatility: 0.60, trend_pct_decade: -2.1,
    modelConfidence: 'High', climateInfluence: 'Moderate',
    returnPeriod100yr_mn: 55000, returnPeriod250yr_mn: 90000, returnPeriod500yr_mn: 130000 },
  { name: 'Tsunami', category: 'geological',
    avgAnnualLoss_mn: 3500, volatility: 0.95, trend_pct_decade: 0.2,
    modelConfidence: 'Medium', climateInfluence: 'Limited',
    returnPeriod100yr_mn: 85000, returnPeriod250yr_mn: 200000, returnPeriod500yr_mn: 350000 },
  { name: 'Storm Surge', category: 'hydrological',
    avgAnnualLoss_mn: 12000, volatility: 0.80, trend_pct_decade: 9.4,
    modelConfidence: 'Medium', climateInfluence: 'Dominant',
    returnPeriod100yr_mn: 75000, returnPeriod250yr_mn: 140000, returnPeriod500yr_mn: 210000 },
  { name: 'Drought', category: 'climate-compound',
    avgAnnualLoss_mn: 8000, volatility: 0.72, trend_pct_decade: 11.3,
    modelConfidence: 'Low', climateInfluence: 'Dominant',
    returnPeriod100yr_mn: 40000, returnPeriod250yr_mn: 70000, returnPeriod500yr_mn: 95000 },
  { name: 'Volcanic Eruption', category: 'geological',
    avgAnnualLoss_mn: 2000, volatility: 0.98, trend_pct_decade: 0.0,
    modelConfidence: 'Low', climateInfluence: 'Limited',
    returnPeriod100yr_mn: 45000, returnPeriod250yr_mn: 120000, returnPeriod500yr_mn: 250000 },
  { name: 'Tornado', category: 'atmospheric',
    avgAnnualLoss_mn: 16000, volatility: 0.75, trend_pct_decade: 3.2,
    modelConfidence: 'Medium', climateInfluence: 'Moderate',
    returnPeriod100yr_mn: 45000, returnPeriod250yr_mn: 72000, returnPeriod500yr_mn: 100000 },
  { name: 'Hail', category: 'atmospheric',
    avgAnnualLoss_mn: 14000, volatility: 0.58, trend_pct_decade: 6.5,
    modelConfidence: 'Medium', climateInfluence: 'Significant',
    returnPeriod100yr_mn: 38000, returnPeriod250yr_mn: 60000, returnPeriod500yr_mn: 82000 },
  { name: 'Coastal Flood / SLR', category: 'climate-compound',
    avgAnnualLoss_mn: 9000, volatility: 0.68, trend_pct_decade: 22.0,
    modelConfidence: 'Medium', climateInfluence: 'Dominant',
    returnPeriod100yr_mn: 50000, returnPeriod250yr_mn: 95000, returnPeriod500yr_mn: 150000 },
  { name: 'Compound Heat-Drought', category: 'climate-compound',
    avgAnnualLoss_mn: 6000, volatility: 0.78, trend_pct_decade: 25.0,
    modelConfidence: 'Low', climateInfluence: 'Dominant',
    returnPeriod100yr_mn: 30000, returnPeriod250yr_mn: 55000, returnPeriod500yr_mn: 80000 },
];

/* ══════════════════════════════════════════════════════════════
   REGIONS — 20 global regions
   ══════════════════════════════════════════════════════════════ */
const REGIONS = [
  { name: 'US Southeast', exposedValue_bn: 4200,
    topPerils: ['Hurricane/Typhoon', 'Flood (Riverine)', 'Storm Surge'],
    trendMultiplier: 1.15,
    climateScenarioImpact: { rcp26: 1.08, rcp45: 1.18, rcp85: 1.42 },
    insurancePenetration_pct: 72, protectionGap_pct: 28 },
  { name: 'US Northeast', exposedValue_bn: 3800,
    topPerils: ['Winter Storm / Freeze', 'Flood (Pluvial)', 'Severe Convective Storm'],
    trendMultiplier: 1.08,
    climateScenarioImpact: { rcp26: 1.05, rcp45: 1.12, rcp85: 1.28 },
    insurancePenetration_pct: 78, protectionGap_pct: 22 },
  { name: 'US West Coast', exposedValue_bn: 5100,
    topPerils: ['Earthquake', 'Wildfire', 'Drought'],
    trendMultiplier: 1.22,
    climateScenarioImpact: { rcp26: 1.10, rcp45: 1.22, rcp85: 1.55 },
    insurancePenetration_pct: 58, protectionGap_pct: 42 },
  { name: 'US Midwest', exposedValue_bn: 2900,
    topPerils: ['Tornado', 'Severe Convective Storm', 'Hail'],
    trendMultiplier: 1.06,
    climateScenarioImpact: { rcp26: 1.04, rcp45: 1.10, rcp85: 1.22 },
    insurancePenetration_pct: 82, protectionGap_pct: 18 },
  { name: 'Caribbean', exposedValue_bn: 800,
    topPerils: ['Hurricane/Typhoon', 'Storm Surge', 'Earthquake'],
    trendMultiplier: 1.25,
    climateScenarioImpact: { rcp26: 1.12, rcp45: 1.28, rcp85: 1.60 },
    insurancePenetration_pct: 32, protectionGap_pct: 68 },
  { name: 'Western Europe', exposedValue_bn: 4500,
    topPerils: ['Flood (Riverine)', 'Winter Storm / Freeze', 'Hail'],
    trendMultiplier: 1.10,
    climateScenarioImpact: { rcp26: 1.06, rcp45: 1.15, rcp85: 1.35 },
    insurancePenetration_pct: 75, protectionGap_pct: 25 },
  { name: 'Southern Europe', exposedValue_bn: 2200,
    topPerils: ['Earthquake', 'Wildfire', 'Drought'],
    trendMultiplier: 1.18,
    climateScenarioImpact: { rcp26: 1.08, rcp45: 1.20, rcp85: 1.48 },
    insurancePenetration_pct: 45, protectionGap_pct: 55 },
  { name: 'Northern Europe', exposedValue_bn: 1800,
    topPerils: ['Winter Storm / Freeze', 'Flood (Pluvial)', 'Coastal Flood / SLR'],
    trendMultiplier: 1.05,
    climateScenarioImpact: { rcp26: 1.03, rcp45: 1.08, rcp85: 1.20 },
    insurancePenetration_pct: 85, protectionGap_pct: 15 },
  { name: 'Japan', exposedValue_bn: 3200,
    topPerils: ['Earthquake', 'Tsunami', 'Hurricane/Typhoon'],
    trendMultiplier: 1.12,
    climateScenarioImpact: { rcp26: 1.06, rcp45: 1.14, rcp85: 1.32 },
    insurancePenetration_pct: 52, protectionGap_pct: 48 },
  { name: 'China East Coast', exposedValue_bn: 4800,
    topPerils: ['Hurricane/Typhoon', 'Flood (Riverine)', 'Earthquake'],
    trendMultiplier: 1.20,
    climateScenarioImpact: { rcp26: 1.10, rcp45: 1.22, rcp85: 1.50 },
    insurancePenetration_pct: 18, protectionGap_pct: 82 },
  { name: 'South Asia', exposedValue_bn: 2100,
    topPerils: ['Flood (Riverine)', 'Hurricane/Typhoon', 'Compound Heat-Drought'],
    trendMultiplier: 1.28,
    climateScenarioImpact: { rcp26: 1.14, rcp45: 1.30, rcp85: 1.65 },
    insurancePenetration_pct: 12, protectionGap_pct: 88 },
  { name: 'Southeast Asia', exposedValue_bn: 1900,
    topPerils: ['Hurricane/Typhoon', 'Flood (Riverine)', 'Earthquake'],
    trendMultiplier: 1.22,
    climateScenarioImpact: { rcp26: 1.10, rcp45: 1.24, rcp85: 1.52 },
    insurancePenetration_pct: 15, protectionGap_pct: 85 },
  { name: 'Australia / NZ', exposedValue_bn: 2400,
    topPerils: ['Wildfire', 'Severe Convective Storm', 'Flood (Riverine)'],
    trendMultiplier: 1.20,
    climateScenarioImpact: { rcp26: 1.08, rcp45: 1.20, rcp85: 1.45 },
    insurancePenetration_pct: 65, protectionGap_pct: 35 },
  { name: 'Latin America North', exposedValue_bn: 1400,
    topPerils: ['Earthquake', 'Hurricane/Typhoon', 'Volcanic Eruption'],
    trendMultiplier: 1.14,
    climateScenarioImpact: { rcp26: 1.06, rcp45: 1.16, rcp85: 1.38 },
    insurancePenetration_pct: 22, protectionGap_pct: 78 },
  { name: 'Latin America South', exposedValue_bn: 1200,
    topPerils: ['Earthquake', 'Flood (Riverine)', 'Drought'],
    trendMultiplier: 1.10,
    climateScenarioImpact: { rcp26: 1.05, rcp45: 1.12, rcp85: 1.30 },
    insurancePenetration_pct: 28, protectionGap_pct: 72 },
  { name: 'Middle East / N Africa', exposedValue_bn: 1600,
    topPerils: ['Earthquake', 'Compound Heat-Drought', 'Flood (Pluvial)'],
    trendMultiplier: 1.16,
    climateScenarioImpact: { rcp26: 1.08, rcp45: 1.18, rcp85: 1.45 },
    insurancePenetration_pct: 20, protectionGap_pct: 80 },
  { name: 'Sub-Saharan Africa', exposedValue_bn: 600,
    topPerils: ['Drought', 'Flood (Riverine)', 'Compound Heat-Drought'],
    trendMultiplier: 1.30,
    climateScenarioImpact: { rcp26: 1.15, rcp45: 1.32, rcp85: 1.70 },
    insurancePenetration_pct: 5, protectionGap_pct: 95 },
  { name: 'Central Asia', exposedValue_bn: 500,
    topPerils: ['Earthquake', 'Drought', 'Flood (Riverine)'],
    trendMultiplier: 1.12,
    climateScenarioImpact: { rcp26: 1.06, rcp45: 1.14, rcp85: 1.35 },
    insurancePenetration_pct: 10, protectionGap_pct: 90 },
  { name: 'Pacific Islands', exposedValue_bn: 200,
    topPerils: ['Hurricane/Typhoon', 'Coastal Flood / SLR', 'Volcanic Eruption'],
    trendMultiplier: 1.35,
    climateScenarioImpact: { rcp26: 1.18, rcp45: 1.38, rcp85: 1.80 },
    insurancePenetration_pct: 8, protectionGap_pct: 92 },
  { name: 'UK / Ireland', exposedValue_bn: 2800,
    topPerils: ['Flood (Riverine)', 'Winter Storm / Freeze', 'Coastal Flood / SLR'],
    trendMultiplier: 1.09,
    climateScenarioImpact: { rcp26: 1.05, rcp45: 1.12, rcp85: 1.28 },
    insurancePenetration_pct: 80, protectionGap_pct: 20 },
];

/* ══════════════════════════════════════════════════════════════
   EVENT SET — 50 modeled events
   ══════════════════════════════════════════════════════════════ */
const EVENT_NAMES = [
  'Cat Event', 'Major Loss', 'Storm System', 'Seismic Event', 'Climate Event',
  'Weather System', 'Extreme Event', 'Natural Disaster', 'Climate Shock', 'Hazard Event'
];

const EVENT_SET = Array.from({ length: 50 }, (_, i) => {
  const s1 = sr(i * 11 + 1);
  const s2 = sr(i * 11 + 2);
  const s3 = sr(i * 11 + 3);
  const s4 = sr(i * 11 + 4);
  const s5 = sr(i * 11 + 5);
  const s6 = sr(i * 11 + 6);
  const perilIdx = Math.floor(s1 * PERILS.length);
  const regionIdx = Math.floor(s2 * REGIONS.length);
  const peril = PERILS[perilIdx].name;
  const region = REGIONS[regionIdx].name;
  const year = 1990 + Math.floor(s3 * 35);
  const grossLoss_mn = Math.round(500 + s4 * 120000);
  const insuredRatio = 0.15 + s5 * 0.65;
  const insuredLoss_mn = Math.round(grossLoss_mn * insuredRatio);
  const fatalities = Math.round(s6 * s6 * 15000);
  const influence = PERILS[perilIdx].climateInfluence;
  const climateAttribution_pct = Math.round(
    influence === 'Dominant' ? 30 + s5 * 50 :
    influence === 'Significant' ? 15 + s5 * 35 :
    influence === 'Moderate' ? 5 + s5 * 20 :
    s5 * 10
  );
  const returnPeriod_est = Math.round(10 + s4 * s4 * 500);
  const isHistorical = s6 > 0.35;

  return {
    id: i + 1,
    name: `${EVENT_NAMES[i % EVENT_NAMES.length]} ${String(year).slice(2)}-${String(i + 1).padStart(2, '0')}`,
    peril, region, year, grossLoss_mn, insuredLoss_mn,
    fatalities, climateAttribution_pct, returnPeriod_est, isHistorical
  };
});

/* ══════════════════════════════════════════════════════════════
   PORTFOLIOS — 3 sample insurance portfolios
   ══════════════════════════════════════════════════════════════ */
const PORTFOLIOS = [
  {
    name: 'Primary Insurance', type: 'primary',
    totalExposure_bn: 85, aalRatio_bps: 145,
    limits_bn: 5.0, deductible_mn: 50, reinstatements: 2,
    regionExposure: REGIONS.slice(0, 10).map((r, i) => ({
      region: r.name,
      exposure_bn: +(r.exposedValue_bn * 0.012 * (1 + sr(i * 31) * 0.5)).toFixed(1)
    })),
    perilExposure: PERILS.map((p, i) => ({
      peril: p.name,
      exposure_pct: +(4 + sr(i * 37) * 10).toFixed(1)
    }))
  },
  {
    name: 'Reinsurance Treaty', type: 'reinsurance',
    totalExposure_bn: 220, aalRatio_bps: 85,
    limits_bn: 15.0, deductible_mn: 250, reinstatements: 1,
    regionExposure: REGIONS.slice(0, 10).map((r, i) => ({
      region: r.name,
      exposure_bn: +(r.exposedValue_bn * 0.035 * (1 + sr(i * 41) * 0.4)).toFixed(1)
    })),
    perilExposure: PERILS.map((p, i) => ({
      peril: p.name,
      exposure_pct: +(3 + sr(i * 43) * 12).toFixed(1)
    }))
  },
  {
    name: 'ILS Cat Bond Fund', type: 'ils',
    totalExposure_bn: 12, aalRatio_bps: 250,
    limits_bn: 2.0, deductible_mn: 500, reinstatements: 0,
    regionExposure: REGIONS.slice(0, 10).map((r, i) => ({
      region: r.name,
      exposure_bn: +(r.exposedValue_bn * 0.002 * (1 + sr(i * 47) * 0.6)).toFixed(1)
    })),
    perilExposure: PERILS.map((p, i) => ({
      peril: p.name,
      exposure_pct: +(2 + sr(i * 53) * 14).toFixed(1)
    }))
  },
];

/* ══════════════════════════════════════════════════════════════
   EP CURVE DATA — 100 points per portfolio
   ══════════════════════════════════════════════════════════════ */
const EP_CURVE_DATA = PORTFOLIOS.map((port, pi) => {
  const base = port.totalExposure_bn * 1000;
  return Array.from({ length: 100 }, (_, j) => {
    const ep = (100 - j) / 100;
    const rp = 1 / Math.max(ep, 0.001);
    const oepLoss = base * (0.001 + Math.pow(1 - ep, 2.5) * (0.15 + sr(pi * 100 + j) * 0.08));
    const aepLoss = oepLoss * (0.7 + sr(pi * 100 + j + 50) * 0.2);
    const climateAdj15 = oepLoss * (1.08 + sr(pi * 100 + j + 200) * 0.04);
    const climateAdj20 = oepLoss * (1.18 + sr(pi * 100 + j + 300) * 0.06);
    const climateAdj30 = oepLoss * (1.35 + sr(pi * 100 + j + 400) * 0.10);
    const climateAdj40 = oepLoss * (1.55 + sr(pi * 100 + j + 500) * 0.15);
    return {
      ep: +(ep * 100).toFixed(1),
      rp: Math.round(rp),
      oepLoss_mn: Math.round(oepLoss),
      aepLoss_mn: Math.round(aepLoss),
      climateAdj15_mn: Math.round(climateAdj15),
      climateAdj20_mn: Math.round(climateAdj20),
      climateAdj30_mn: Math.round(climateAdj30),
      climateAdj40_mn: Math.round(climateAdj40)
    };
  });
});

/* ══════════════════════════════════════════════════════════════
   RDS SCENARIOS — 8 Lloyd's Realistic Disaster Scenarios
   ══════════════════════════════════════════════════════════════ */
const RDS_SCENARIOS = [
  { name: 'US Windstorm (Miami Landfall Cat 5)',
    description: 'Major hurricane making landfall in Miami-Dade as Category 5 with $250bn+ industry loss',
    industry_loss_bn: 280, modeled_loss_mn: 4200, return_period: 120, climate_factor: 1.22 },
  { name: 'US Earthquake (SF Bay M7.9)',
    description: 'Magnitude 7.9 earthquake on San Andreas fault affecting San Francisco Bay Area',
    industry_loss_bn: 320, modeled_loss_mn: 3800, return_period: 200, climate_factor: 1.00 },
  { name: 'European Windstorm (Lothar-class)',
    description: 'Extratropical cyclone tracking across France, Germany, Switzerland with widespread damage',
    industry_loss_bn: 45, modeled_loss_mn: 1200, return_period: 80, climate_factor: 1.12 },
  { name: 'Japan Earthquake & Tsunami (Tokai)',
    description: 'M8.5+ subduction earthquake triggering Pacific-wide tsunami affecting Tokai industrial belt',
    industry_loss_bn: 180, modeled_loss_mn: 2800, return_period: 150, climate_factor: 1.00 },
  { name: 'US Severe Convective Outbreak',
    description: 'Multi-day severe convective storm outbreak across US Midwest and Southeast',
    industry_loss_bn: 55, modeled_loss_mn: 1800, return_period: 50, climate_factor: 1.15 },
  { name: 'Global Pandemic + Climate',
    description: 'Compound pandemic event with concurrent climate extremes disrupting supply chains globally',
    industry_loss_bn: 120, modeled_loss_mn: 2200, return_period: 100, climate_factor: 1.30 },
  { name: 'Caribbean Hurricane Cluster',
    description: 'Three major hurricanes in single season affecting Caribbean, Gulf Coast, and Eastern Seaboard',
    industry_loss_bn: 150, modeled_loss_mn: 3500, return_period: 75, climate_factor: 1.28 },
  { name: 'Australian Bushfire Mega-Season',
    description: 'Extended bushfire season across southeast Australia with urban interface destruction',
    industry_loss_bn: 35, modeled_loss_mn: 900, return_period: 60, climate_factor: 1.45 },
];

/* ══════════════════════════════════════════════════════════════
   CLIMATE FACTORS — peril x warming level adjustment matrix
   ══════════════════════════════════════════════════════════════ */
const WARMING_LEVELS = ['Current', '+1.5C', '+2.0C', '+3.0C', '+4.0C'];

const CLIMATE_FACTORS = PERILS.map((p, i) => {
  const base =
    p.climateInfluence === 'Dominant'    ? [1.0, 1.15, 1.30, 1.55, 1.85] :
    p.climateInfluence === 'Significant' ? [1.0, 1.08, 1.18, 1.32, 1.50] :
    p.climateInfluence === 'Moderate'    ? [1.0, 1.04, 1.10, 1.18, 1.28] :
                                           [1.0, 1.01, 1.02, 1.04, 1.06];
  return {
    peril: p.name,
    category: p.category,
    ...WARMING_LEVELS.reduce((acc, w, wi) => ({
      ...acc,
      [w]: +(base[wi] + sr(i * 7 + wi) * 0.05).toFixed(2)
    }), {})
  };
});

/* ══════════════════════════════════════════════════════════════
   LOSS DEVELOPMENT — 30-year historical triangle
   ══════════════════════════════════════════════════════════════ */
const LOSS_DEVELOPMENT = Array.from({ length: 30 }, (_, yr) => {
  const accYr = 1995 + yr;
  const ultimate = Math.round(8000 + sr(yr * 19) * 22000);
  const factors = [0.35, 0.55, 0.68, 0.78, 0.85, 0.90, 0.94, 0.97, 0.99, 1.00];
  const devYears = factors.map((f, di) => {
    if (yr + di >= 30) return null;
    return Math.round(ultimate * (f + sr(yr * 10 + di) * 0.05));
  });
  const latestIdx = Math.min(29 - yr, 9);
  return {
    accidentYear: accYr,
    ultimate,
    paid: devYears,
    ibnr: Math.round(ultimate * (1 - factors[latestIdx]) * (1 + sr(yr * 23) * 0.1))
  };
});

/* ══════════════════════════════════════════════════════════════
   Derived aggregates (division-guarded)
   ══════════════════════════════════════════════════════════════ */
const totalExposure = REGIONS.reduce((a, r) => a + r.exposedValue_bn, 0);
const totalAAL = PERILS.reduce((a, p) => a + p.avgAnnualLoss_mn, 0);
const avgTrend = PERILS.length
  ? PERILS.reduce((a, p) => a + p.trend_pct_decade, 0) / PERILS.length
  : 0;
const avgProtGap = REGIONS.length
  ? REGIONS.reduce((a, r) => a + r.protectionGap_pct, 0) / REGIONS.length
  : 0;
const pml100 = PERILS.reduce((a, p) => a + p.returnPeriod100yr_mn, 0);
const pml250 = PERILS.reduce((a, p) => a + p.returnPeriod250yr_mn, 0);

/* ══════════════════════════════════════════════════════════════
   Styles
   ══════════════════════════════════════════════════════════════ */
const sCard = {
  background: T.card, borderRadius: 10,
  border: `1px solid ${T.border}`, padding: 16
};
const sKpi = { ...sCard, textAlign: 'center', flex: 1, minWidth: 140 };
const sLabel = {
  fontSize: 11, color: T.sub, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: 0.5
};
const sVal = { fontSize: 22, fontWeight: 700, color: T.navy, marginTop: 2 };
const sTab = (a) => ({
  padding: '8px 18px', fontSize: 12, fontWeight: a ? 700 : 500,
  color: a ? T.card : T.navy, background: a ? T.navy : 'transparent',
  border: `1px solid ${a ? T.navy : T.border}`,
  borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap'
});
const sBadge = (c) => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 4,
  fontSize: 10, fontWeight: 700, color: T.card, background: c
});
const sSelect = {
  padding: '6px 10px', borderRadius: 6,
  border: `1px solid ${T.border}`, fontSize: 12,
  background: T.card, color: T.text
};

/* ══════════════════════════════════════════════════════════════
   Shared sub-components
   ══════════════════════════════════════════════════════════════ */
const KPI = ({ label, value, sub: s2, color }) => (
  <div style={sKpi}>
    <div style={sLabel}>{label}</div>
    <div style={{ ...sVal, color: color || T.navy }}>{value}</div>
    {s2 && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{s2}</div>}
  </div>
);

const Badge = ({ text, color }) => (
  <span style={sBadge(color || T.indigo)}>{text}</span>
);

const ConfBadge = ({ level }) => {
  const c = level === 'High' ? T.green : level === 'Medium' ? T.amber : T.red;
  return <Badge text={level} color={c} />;
};

const TrendArrow = ({ val }) => {
  const c = val > 0 ? T.red : val < 0 ? T.green : T.sub;
  const arr = val > 0 ? '\u2191' : val < 0 ? '\u2193' : '\u2192';
  return <span style={{ color: c, fontWeight: 700, fontSize: 13 }}>{arr}{Math.abs(val).toFixed(1)}%</span>;
};

const catColor = (cat) =>
  cat === 'atmospheric' ? T.indigo :
  cat === 'hydrological' ? '#0891b2' :
  cat === 'geological' ? T.amber : T.green;

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function CatastropheModellingPage() {
  /* ── All hooks at top ──────────────────────────────────── */
  const [tab, setTab] = useState(0);
  const [selPerils, setSelPerils] = useState([]);
  const [selRegion, setSelRegion] = useState('All');
  const [selPortfolio, setSelPortfolio] = useState(0);
  const [warmingLevel, setWarmingLevel] = useState(2);
  const [epType, setEpType] = useState('OEP');
  const [showCI, setShowCI] = useState(false);
  const [eventSort, setEventSort] = useState('grossLoss_mn');
  const [eventFilter, setEventFilter] = useState('all');
  const [rdsClimateAdj, setRdsClimateAdj] = useState(true);

  const togglePeril = useCallback((p) => {
    setSelPerils(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }, []);

  /* Filtered events */
  const filteredEvents = useMemo(() => {
    let evts = [...EVENT_SET];
    if (eventFilter === 'historical') evts = evts.filter(e => e.isHistorical);
    if (eventFilter === 'modeled') evts = evts.filter(e => !e.isHistorical);
    if (selPerils.length) evts = evts.filter(e => selPerils.includes(e.peril));
    if (selRegion !== 'All') evts = evts.filter(e => e.region === selRegion);
    return [...evts].sort((a, b) => (b[eventSort] || 0) - (a[eventSort] || 0));
  }, [eventFilter, selPerils, selRegion, eventSort]);

  /* EP curve for selected portfolio */
  const epData = useMemo(() => {
    const raw = EP_CURVE_DATA[selPortfolio] || [];
    return raw.filter(d => d.ep >= 0.1 && d.ep <= 99);
  }, [selPortfolio]);

  /* Climate-adjusted AAL */
  const warmingKeys = ['Current', '+1.5C', '+2.0C', '+3.0C', '+4.0C'];
  const warmingKey = warmingKeys[warmingLevel] || 'Current';

  const climateAdjAAL = useMemo(() => {
    return PERILS.map((p, i) => {
      const cf = CLIMATE_FACTORS[i] ? CLIMATE_FACTORS[i][warmingKey] : 1;
      return { ...p, adjustedAAL_mn: Math.round(p.avgAnnualLoss_mn * (cf || 1)) };
    });
  }, [warmingKey]);

  const totalClimAAL = climateAdjAAL.reduce((a, p) => a + p.adjustedAAL_mn, 0);

  /* Dev factors for loss triangle */
  const devFactors = useMemo(() => {
    return Array.from({ length: 9 }, (_, i) => {
      const pairs = LOSS_DEVELOPMENT.filter(r => r.paid[i] != null && r.paid[i + 1] != null);
      if (!pairs.length) return { devYear: i + 1, factor: 1.0, selected: 1.0 };
      const avg = pairs.reduce((a, r) =>
        a + (r.paid[i + 1] || 1) / Math.max(r.paid[i], 1), 0
      ) / pairs.length;
      return { devYear: i + 1, factor: +avg.toFixed(4), selected: +avg.toFixed(4) };
    });
  }, []);

  /* ══════════════════════════════════════════════════════════
     TAB 0: Cat Model Dashboard
     ══════════════════════════════════════════════════════════ */
  const renderDashboard = () => {
    const perilPie = PERILS.map((p, i) => ({
      name: p.name, value: p.avgAnnualLoss_mn, fill: COLORS[i % COLORS.length]
    }));

    const regionBar = [...REGIONS]
      .sort((a, b) => b.exposedValue_bn - a.exposedValue_bn)
      .slice(0, 12)
      .map(r => ({
        name: r.name.length > 14 ? r.name.slice(0, 14) + '...' : r.name,
        exposure: r.exposedValue_bn,
        aal: Math.round(r.exposedValue_bn * 0.008 * (1 + r.trendMultiplier))
      }));

    const epPreview = (EP_CURVE_DATA[0] || []).filter(d => d.ep >= 1 && d.ep <= 50);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* KPI Row */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <KPI label="Total Exposed Value" value={'$' + fmt(totalExposure * 1e9)} sub="20 regions" />
          <KPI label="Industry AAL" value={'$' + fmt(totalAAL * 1e6)} sub="15 perils" />
          <KPI label="1-in-100yr PML" value={'$' + fmt(pml100 * 1e6)} color={T.red} />
          <KPI label="1-in-250yr PML" value={'$' + fmt(pml250 * 1e6)} color={T.red} />
          <KPI label="Avg Climate Trend" value={pct(avgTrend) + ' /decade'} color={T.amber} sub="cross-peril" />
          <KPI label="Avg Protection Gap" value={pct(avgProtGap)} color={T.indigo} sub="insured vs economic" />
        </div>

        {/* EP Curve + Peril Pie */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={sCard}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
              Exceedance Probability (OEP) - Primary Portfolio
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={epPreview}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="ep" tick={{ fontSize: 10 }}
                  label={{ value: 'Exceedance Probability %', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                <Tooltip formatter={v => fmt(v) + ' mn'} />
                <Area type="monotone" dataKey="oepLoss_mn" stroke={T.navy}
                  fill={T.navy} fillOpacity={0.15} name="OEP Loss" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={sCard}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>AAL by Peril</div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={perilPie} cx="50%" cy="50%" outerRadius={90} innerRadius={40}
                  dataKey="value"
                  label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false} fontSize={9}>
                  {perilPie.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip formatter={v => '$' + fmt(v * 1e6)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Exposure */}
        <div style={sCard}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
            Regional Exposure vs AAL (Top 12)
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={regionBar}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={60} />
              <YAxis yAxisId="l" tick={{ fontSize: 10 }} tickFormatter={v => fmt(v) + 'B'} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} tickFormatter={v => fmt(v) + 'M'} />
              <Tooltip />
              <Bar yAxisId="l" dataKey="exposure" fill={T.navy} name="Exposure ($bn)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="r" type="monotone" dataKey="aal" stroke={T.red}
                strokeWidth={2} name="Est. AAL ($mn)" dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════
     TAB 1: Peril Analysis
     ══════════════════════════════════════════════════════════ */
  const renderPerilAnalysis = () => {
    const aalBar = PERILS.map((p, i) => ({
      name: p.name.length > 18 ? p.name.slice(0, 18) + '...' : p.name,
      aal: p.avgAnnualLoss_mn, trend: p.trend_pct_decade,
      fill: COLORS[i % COLORS.length]
    }));

    const rpCompare = PERILS.map((p, i) => ({
      name: p.name.length > 12 ? p.name.slice(0, 12) + '..' : p.name,
      rp100: p.returnPeriod100yr_mn,
      rp250: p.returnPeriod250yr_mn,
      rp500: p.returnPeriod500yr_mn
    }));

    const radarData = PERILS
      .filter(p => p.category === 'atmospheric' || p.category === 'climate-compound')
      .map(p => ({
        peril: p.name.split(' ')[0],
        volatility: Math.round(p.volatility * 100),
        trend: Math.round(Math.abs(p.trend_pct_decade) * 5),
        confidence: p.modelConfidence === 'High' ? 90 : p.modelConfidence === 'Medium' ? 60 : 30,
        climate: p.climateInfluence === 'Dominant' ? 95 :
          p.climateInfluence === 'Significant' ? 70 :
          p.climateInfluence === 'Moderate' ? 45 : 20
      }));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={sCard}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
            Average Annual Loss by Peril ($mn)
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aalBar} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
              <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => '$' + fmt(v * 1e6)} />
              <Bar dataKey="aal" radius={[0, 4, 4, 0]}>
                {aalBar.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div style={sCard}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
              Return Period Comparison ($mn)
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rpCompare}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                <Tooltip formatter={v => '$' + fmt(v * 1e6)} />
                <Legend />
                <Bar dataKey="rp100" fill={T.navy} name="1-in-100yr" radius={[2, 2, 0, 0]} />
                <Bar dataKey="rp250" fill={T.indigo} name="1-in-250yr" radius={[2, 2, 0, 0]} />
                <Bar dataKey="rp500" fill={T.red} name="1-in-500yr" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={sCard}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
              Climate Influence Radar
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="peril" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis tick={{ fontSize: 8 }} domain={[0, 100]} />
                <Radar name="Volatility" dataKey="volatility" stroke={T.red} fill={T.red} fillOpacity={0.1} />
                <Radar name="Climate" dataKey="climate" stroke={T.green} fill={T.green} fillOpacity={0.1} />
                <Radar name="Confidence" dataKey="confidence" stroke={T.indigo} fill={T.indigo} fillOpacity={0.1} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detail Grid */}
        <div style={sCard}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>Peril Detail Grid</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Peril', 'Category', 'AAL ($mn)', 'Volatility', 'Trend/Decade', '100yr PML', '250yr PML', 'Confidence', 'Climate'].map(h =>
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {PERILS.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600, color: T.navy }}>{p.name}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <Badge text={p.category} color={catColor(p.category)} />
                    </td>
                    <td style={{ padding: '6px 8px' }}>{fmt(p.avgAnnualLoss_mn)}</td>
                    <td style={{ padding: '6px 8px' }}>{(p.volatility * 100).toFixed(0)}%</td>
                    <td style={{ padding: '6px 8px' }}><TrendArrow val={p.trend_pct_decade} /></td>
                    <td style={{ padding: '6px 8px' }}>${fmt(p.returnPeriod100yr_mn * 1e6)}</td>
                    <td style={{ padding: '6px 8px' }}>${fmt(p.returnPeriod250yr_mn * 1e6)}</td>
                    <td style={{ padding: '6px 8px' }}><ConfBadge level={p.modelConfidence} /></td>
                    <td style={{ padding: '6px 8px' }}>
                      <Badge text={p.climateInfluence}
                        color={p.climateInfluence === 'Dominant' ? T.red : p.climateInfluence === 'Significant' ? T.amber : T.sub} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════
     TAB 2: Event Set Explorer
     ══════════════════════════════════════════════════════════ */
  const renderEventExplorer = () => {
    const top10 = [...filteredEvents].slice(0, 10);
    const scatterData = filteredEvents.map(e => ({
      x: e.returnPeriod_est, y: e.grossLoss_mn, z: e.climateAttribution_pct,
      name: e.name, peril: e.peril
    }));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Filter:</span>
          {['all', 'historical', 'modeled'].map(f =>
            <button key={f} onClick={() => setEventFilter(f)} style={sTab(eventFilter === f)}>
              {f === 'all' ? 'All Events' : f === 'historical' ? 'Historical' : 'Modeled'}
            </button>
          )}
          <select value={selRegion} onChange={e => setSelRegion(e.target.value)} style={sSelect}>
            <option value="All">All Regions</option>
            {REGIONS.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
          </select>
          <span style={{ fontSize: 12, color: T.sub }}>Sort:</span>
          <select value={eventSort} onChange={e => setEventSort(e.target.value)} style={sSelect}>
            <option value="grossLoss_mn">Gross Loss</option>
            <option value="insuredLoss_mn">Insured Loss</option>
            <option value="returnPeriod_est">Return Period</option>
            <option value="climateAttribution_pct">Climate Attribution</option>
            <option value="fatalities">Fatalities</option>
          </select>
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={sCard}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
              Loss vs Return Period (size = climate attribution)
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="x" name="Return Period" tick={{ fontSize: 10 }}
                  label={{ value: 'Return Period (yr)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                <YAxis dataKey="y" name="Gross Loss" tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                <Tooltip formatter={(v, n) => n === 'Gross Loss' ? '$' + fmt(v * 1e6) : v}
                  cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={scatterData} fill={T.indigo} fillOpacity={0.6}>
                  {scatterData.map((e, i) =>
                    <Cell key={i}
                      fill={COLORS[PERILS.findIndex(p => p.name === e.peril) % COLORS.length]}
                      r={3 + e.z * 0.12} />
                  )}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div style={sCard}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
              Top 10 Costliest Events
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={top10} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 9 }} />
                <Tooltip formatter={v => '$' + fmt(v * 1e6)} />
                <Bar dataKey="grossLoss_mn" fill={T.red} name="Gross Loss ($mn)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="insuredLoss_mn" fill={T.navy} name="Insured Loss ($mn)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div style={sCard}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
            Event Set ({filteredEvents.length} events)
          </div>
          <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead style={{ position: 'sticky', top: 0, background: T.card }}>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['#', 'Event', 'Peril', 'Region', 'Year', 'Gross Loss ($mn)', 'Insured ($mn)', 'Climate %', 'RP (yr)', 'Type'].map(h =>
                    <th key={h} style={{ padding: '5px 6px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredEvents.slice(0, 50).map((e, i) => (
                  <tr key={e.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? T.card : T.surface }}>
                    <td style={{ padding: '5px 6px', color: T.sub }}>{e.id}</td>
                    <td style={{ padding: '5px 6px', fontWeight: 600, color: T.navy }}>{e.name}</td>
                    <td style={{ padding: '5px 6px' }}>{e.peril}</td>
                    <td style={{ padding: '5px 6px' }}>{e.region}</td>
                    <td style={{ padding: '5px 6px' }}>{e.year}</td>
                    <td style={{ padding: '5px 6px', fontWeight: 600 }}>{fmt(e.grossLoss_mn)}</td>
                    <td style={{ padding: '5px 6px' }}>{fmt(e.insuredLoss_mn)}</td>
                    <td style={{ padding: '5px 6px' }}>
                      <span style={{ color: e.climateAttribution_pct > 40 ? T.red : e.climateAttribution_pct > 20 ? T.amber : T.green }}>
                        {e.climateAttribution_pct}%
                      </span>
                    </td>
                    <td style={{ padding: '5px 6px' }}>{e.returnPeriod_est}</td>
                    <td style={{ padding: '5px 6px' }}>
                      <Badge text={e.isHistorical ? 'Historical' : 'Modeled'}
                        color={e.isHistorical ? T.green : T.indigo} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════
     TAB 3: EP Curve Builder
     ══════════════════════════════════════════════════════════ */
  const renderEPCurve = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Portfolio:</span>
          {PORTFOLIOS.map((p, i) =>
            <button key={i} onClick={() => setSelPortfolio(i)} style={sTab(selPortfolio === i)}>
              {p.name}
            </button>
          )}
          <span style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginLeft: 10 }}>Type:</span>
          {['OEP', 'AEP'].map(t =>
            <button key={t} onClick={() => setEpType(t)} style={sTab(epType === t)}>{t}</button>
          )}
          <label style={{ fontSize: 12, color: T.sub, marginLeft: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={showCI} onChange={() => setShowCI(!showCI)} />
            {' '}Confidence Intervals
          </label>
        </div>

        {/* Main EP Chart */}
        <div style={sCard}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 4 }}>
            Exceedance Probability Curve - {PORTFOLIOS[selPortfolio].name} ({epType})
          </div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>
            Climate overlay: warming levels from current to +4.0C
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={epData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="ep" tick={{ fontSize: 10 }} reversed
                label={{ value: 'Exceedance Probability (%)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)}
                label={{ value: 'Loss ($mn)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              <Tooltip formatter={v => '$' + fmt(v) + 'mn'} />
              <Area type="monotone" dataKey={epType === 'OEP' ? 'oepLoss_mn' : 'aepLoss_mn'}
                stroke={T.navy} fill={T.navy} fillOpacity={0.12} strokeWidth={2}
                name={epType + ' (Current)'} />
              <Line type="monotone" dataKey="climateAdj15_mn" stroke={T.gold}
                strokeWidth={1.5} dot={false} name="+1.5C" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="climateAdj20_mn" stroke={T.amber}
                strokeWidth={1.5} dot={false} name="+2.0C" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="climateAdj30_mn" stroke={T.red}
                strokeWidth={1.5} dot={false} name="+3.0C" strokeDasharray="6 3" />
              <Line type="monotone" dataKey="climateAdj40_mn" stroke="#7c3aed"
                strokeWidth={1.5} dot={false} name="+4.0C" strokeDasharray="6 3" />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Key EP Points */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[{ rp: '1-in-100yr', ep: 1 }, { rp: '1-in-250yr', ep: 0.4 }, { rp: '1-in-500yr', ep: 0.2 }].map(({ rp, ep }) => {
            const pt = epData.find(d => Math.abs(d.ep - ep) < 0.3) || { oepLoss_mn: 0, aepLoss_mn: 0 };
            const val = epType === 'OEP' ? pt.oepLoss_mn : pt.aepLoss_mn;
            return <KPI key={rp} label={`${rp} ${epType}`} value={'$' + fmt(val) + 'mn'} sub={PORTFOLIOS[selPortfolio].name} />;
          })}
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════
     TAB 4: Regional Exposure
     ══════════════════════════════════════════════════════════ */
  const renderRegional = () => {
    const sorted = [...REGIONS].sort((a, b) => b.exposedValue_bn - a.exposedValue_bn);

    const gapData = sorted.map(r => ({
      name: r.name.length > 14 ? r.name.slice(0, 14) + '..' : r.name,
      insured: Math.round(r.exposedValue_bn * (r.insurancePenetration_pct / 100)),
      gap: Math.round(r.exposedValue_bn * (r.protectionGap_pct / 100))
    }));

    const scenarioData = sorted.slice(0, 10).map(r => ({
      name: r.name.length > 14 ? r.name.slice(0, 14) + '..' : r.name,
      rcp26: +((r.climateScenarioImpact.rcp26 - 1) * 100).toFixed(1),
      rcp45: +((r.climateScenarioImpact.rcp45 - 1) * 100).toFixed(1),
      rcp85: +((r.climateScenarioImpact.rcp85 - 1) * 100).toFixed(1)
    }));

    const top5 = [...REGIONS].sort((a, b) => b.protectionGap_pct - a.protectionGap_pct).slice(0, 5);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={sCard}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
            Exposed Value: Insured vs Protection Gap ($bn)
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={gapData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
              <Tooltip formatter={v => '$' + fmt(v) + 'bn'} />
              <Legend />
              <Bar dataKey="insured" stackId="a" fill={T.green} name="Insured ($bn)" />
              <Bar dataKey="gap" stackId="a" fill={T.red} name="Protection Gap ($bn)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div style={sCard}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
              Climate Scenario Impact by Region (% increase)
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={scenarioData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} unit="%" />
                <Tooltip formatter={v => v + '%'} />
                <Legend />
                <Bar dataKey="rcp26" fill={T.green} name="RCP 2.6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="rcp45" fill={T.amber} name="RCP 4.5" radius={[2, 2, 0, 0]} />
                <Bar dataKey="rcp85" fill={T.red} name="RCP 8.5" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={sCard}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>
              Most Vulnerable Regions
            </div>
            {top5.map((r, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: i < 4 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: T.navy, fontSize: 12 }}>{i + 1}. {r.name}</span>
                  <span style={{ fontWeight: 700, color: T.red, fontSize: 13 }}>{r.protectionGap_pct}% gap</span>
                </div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>
                  Top: {r.topPerils.slice(0, 2).join(', ')}
                </div>
                <div style={{ background: T.border, borderRadius: 4, height: 6, marginTop: 4 }}>
                  <div style={{ background: T.red, borderRadius: 4, height: 6, width: `${r.protectionGap_pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════
     TAB 5: Lloyd's RDS
     ══════════════════════════════════════════════════════════ */
  const renderRDS = () => {
    const waterfall = RDS_SCENARIOS.map(r => ({
      name: r.name.length > 20 ? r.name.slice(0, 20) + '..' : r.name,
      loss: rdsClimateAdj ? Math.round(r.modeled_loss_mn * r.climate_factor) : r.modeled_loss_mn,
      industry: r.industry_loss_bn * 1000,
      rp: r.return_period
    }));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>
            Lloyd's Realistic Disaster Scenarios
          </span>
          <label style={{ fontSize: 12, color: T.sub, marginLeft: 'auto', cursor: 'pointer' }}>
            <input type="checkbox" checked={rdsClimateAdj} onChange={() => setRdsClimateAdj(!rdsClimateAdj)} />
            {' '}Climate-Adjusted
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {RDS_SCENARIOS.map((r, i) => {
            const adjLoss = rdsClimateAdj
              ? Math.round(r.modeled_loss_mn * r.climate_factor)
              : r.modeled_loss_mn;
            return (
              <div key={i} style={{ ...sCard, borderLeft: `4px solid ${COLORS[i % COLORS.length]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: T.navy, fontSize: 13 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 4, lineHeight: 1.4 }}>
                      {r.description}
                    </div>
                  </div>
                  <Badge text={`RP ${r.return_period}yr`}
                    color={r.return_period >= 150 ? T.red : r.return_period >= 100 ? T.amber : T.indigo} />
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                  <div>
                    <div style={sLabel}>Modeled Loss</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>${fmt(adjLoss)}mn</div>
                  </div>
                  <div>
                    <div style={sLabel}>Industry Loss</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.sub }}>${r.industry_loss_bn}bn</div>
                  </div>
                  <div>
                    <div style={sLabel}>Climate Factor</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: r.climate_factor > 1.1 ? T.red : T.green }}>
                      {r.climate_factor.toFixed(2)}x
                    </div>
                  </div>
                  <div>
                    <div style={sLabel}>Share of Industry</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.indigo }}>
                      {r.industry_loss_bn > 0 ? (adjLoss / (r.industry_loss_bn * 10)).toFixed(2) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={sCard}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
            RDS Portfolio Impact Comparison
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={waterfall}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
              <Tooltip formatter={v => '$' + fmt(v) + 'mn'} />
              <Legend />
              <Bar dataKey="loss" fill={T.red} name="Portfolio Loss ($mn)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════
     TAB 6: Climate Scenarios
     ══════════════════════════════════════════════════════════ */
  const renderClimateScenarios = () => {
    const projBar = climateAdjAAL.map((p, i) => ({
      name: p.name.length > 14 ? p.name.slice(0, 14) + '..' : p.name,
      current: p.avgAnnualLoss_mn,
      adjusted: p.adjustedAAL_mn,
      delta: p.adjustedAAL_mn - p.avgAnnualLoss_mn
    }));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Warming Slider + KPIs */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>Warming Level:</span>
          <input type="range" min={0} max={4} step={1} value={warmingLevel}
            onChange={e => setWarmingLevel(+e.target.value)} style={{ width: 200 }} />
          <span style={{
            fontSize: 14, fontWeight: 700,
            color: warmingLevel >= 3 ? T.red : warmingLevel >= 2 ? T.amber : T.green
          }}>
            {warmingKeys[warmingLevel]}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
            <KPI label="Current AAL" value={'$' + fmt(totalAAL) + 'mn'} />
            <KPI label="Adjusted AAL" value={'$' + fmt(totalClimAAL) + 'mn'}
              color={totalClimAAL > totalAAL ? T.red : T.green} />
            <KPI label="Change"
              value={totalAAL > 0 ? ((totalClimAAL / totalAAL - 1) * 100).toFixed(1) + '%' : '0%'}
              color={T.red} />
          </div>
        </div>

        {/* Climate Factor Heatmap */}
        <div style={sCard}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
            Climate Factor Heatmap (15 perils x 5 warming levels)
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ padding: 6, textAlign: 'left', color: T.sub }}>Peril</th>
                  <th style={{ padding: 6, color: T.sub }}>Category</th>
                  {WARMING_LEVELS.map(w =>
                    <th key={w} style={{ padding: 6, textAlign: 'center', color: T.sub }}>{w}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {CLIMATE_FACTORS.map((cf, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 6, fontWeight: 600, color: T.navy }}>{cf.peril}</td>
                    <td style={{ padding: 6 }}>
                      <Badge text={cf.category} color={catColor(cf.category)} />
                    </td>
                    {WARMING_LEVELS.map(w => {
                      const v = cf[w];
                      const intensity = Math.min(1, (v - 1) * 3);
                      const rgb = v > 1.2 ? '153,27,27' : v > 1.1 ? '146,64,14' : '6,95,70';
                      return (
                        <td key={w} style={{
                          padding: 6, textAlign: 'center', fontWeight: 600, color: T.card,
                          background: `rgba(${rgb},${(0.3 + intensity * 0.6).toFixed(2)})`,
                          borderRadius: 2
                        }}>
                          {v.toFixed(2)}x
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AAL Comparison Bar */}
        <div style={sCard}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
            AAL: Current vs Climate-Adjusted ({warmingKeys[warmingLevel]})
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={projBar}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
              <Tooltip formatter={v => '$' + fmt(v * 1e6)} />
              <Legend />
              <Bar dataKey="current" fill={T.navy} name="Current AAL ($mn)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="adjusted" fill={T.red} name="Adjusted AAL ($mn)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════
     TAB 7: Portfolio Analytics
     ══════════════════════════════════════════════════════════ */
  const renderPortfolioAnalytics = () => {
    const compMetrics = PORTFOLIOS.map((p, i) => {
      const aal = p.totalExposure_bn * p.aalRatio_bps / 10000;
      const roe = 12 + sr(i * 71) * 15;
      const combinedRatio = 85 + sr(i * 73) * 25;
      const reinEff = 60 + sr(i * 77) * 30;
      return {
        name: p.name, exposure: p.totalExposure_bn, aal: +aal.toFixed(1),
        aalRatio: p.aalRatio_bps, limits: p.limits_bn, deductible: p.deductible_mn,
        reinstatements: p.reinstatements, roe: +roe.toFixed(1),
        combinedRatio: +combinedRatio.toFixed(1), reinEff: +reinEff.toFixed(1)
      };
    });

    const epOverlay = EP_CURVE_DATA.map((curve, ci) =>
      curve.filter(d => d.ep >= 0.5 && d.ep <= 30)
        .map(d => ({ ep: d.ep, [`oep_${ci}`]: d.oepLoss_mn }))
    ).reduce((merged, curve) => {
      curve.forEach((pt, j) => {
        if (!merged[j]) merged[j] = { ep: pt.ep };
        Object.assign(merged[j], pt);
      });
      return merged;
    }, []);

    const perilAlloc = PERILS.slice(0, 8).map((p, i) => ({
      name: p.name.split(' ')[0],
      primary: PORTFOLIOS[0].perilExposure[i]?.exposure_pct || 0,
      reinsurance: PORTFOLIOS[1].perilExposure[i]?.exposure_pct || 0,
      ils: PORTFOLIOS[2].perilExposure[i]?.exposure_pct || 0
    }));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={sCard}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>
            Portfolio Comparison
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Portfolio', 'Type', 'Exposure ($bn)', 'AAL ($bn)', 'AAL (bps)',
                    'Limit ($bn)', 'Deductible ($mn)', 'Reinst.', 'ROE %',
                    'Combined Ratio', 'Reins. Eff.'].map(h =>
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {compMetrics.map((m, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '6px 8px', fontWeight: 700, color: T.navy }}>{m.name}</td>
                    <td style={{ padding: '6px 8px' }}><Badge text={PORTFOLIOS[i].type} /></td>
                    <td style={{ padding: '6px 8px' }}>${m.exposure}</td>
                    <td style={{ padding: '6px 8px' }}>${m.aal}</td>
                    <td style={{ padding: '6px 8px' }}>{m.aalRatio}</td>
                    <td style={{ padding: '6px 8px' }}>${m.limits}</td>
                    <td style={{ padding: '6px 8px' }}>${m.deductible}</td>
                    <td style={{ padding: '6px 8px' }}>{m.reinstatements}</td>
                    <td style={{ padding: '6px 8px', color: m.roe > 15 ? T.green : T.amber }}>{m.roe}%</td>
                    <td style={{ padding: '6px 8px', color: m.combinedRatio > 100 ? T.red : T.green }}>
                      {m.combinedRatio}%
                    </td>
                    <td style={{ padding: '6px 8px' }}>{m.reinEff}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={sCard}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
              EP Curves Overlaid (OEP)
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={epOverlay}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="ep" tick={{ fontSize: 10 }} reversed />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                <Tooltip formatter={v => '$' + fmt(v) + 'mn'} />
                <Legend />
                <Line type="monotone" dataKey="oep_0" stroke={T.navy} strokeWidth={2} dot={false} name="Primary" />
                <Line type="monotone" dataKey="oep_1" stroke={T.indigo} strokeWidth={2} dot={false} name="Reinsurance" />
                <Line type="monotone" dataKey="oep_2" stroke={T.gold} strokeWidth={2} dot={false} name="ILS Fund" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={sCard}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
              Capital Allocation by Peril
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={perilAlloc}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="%" />
                <Tooltip />
                <Legend />
                <Bar dataKey="primary" fill={T.navy} name="Primary" radius={[2, 2, 0, 0]} />
                <Bar dataKey="reinsurance" fill={T.indigo} name="Reinsurance" radius={[2, 2, 0, 0]} />
                <Bar dataKey="ils" fill={T.gold} name="ILS" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════
     TAB 8: Loss Development
     ══════════════════════════════════════════════════════════ */
  const renderLossDev = () => {
    const triangle = LOSS_DEVELOPMENT.slice(-15);

    const paidVsIncurred = LOSS_DEVELOPMENT.slice(-20).map(r => ({
      year: r.accidentYear,
      paid: r.paid[Math.min(29 - (r.accidentYear - 1995), 9)] || 0,
      ultimate: r.ultimate,
      ibnr: r.ibnr
    }));

    const avgUltimate = LOSS_DEVELOPMENT.length
      ? LOSS_DEVELOPMENT.reduce((a, r) => a + r.ultimate, 0) / LOSS_DEVELOPMENT.length
      : 0;

    const totalIBNR = LOSS_DEVELOPMENT.reduce((a, r) => a + r.ibnr, 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <KPI label="Avg Ultimate Loss" value={'$' + fmt(avgUltimate) + 'mn'} sub="30-year average" />
          <KPI label="Total IBNR Reserve" value={'$' + fmt(totalIBNR) + 'mn'} color={T.amber} />
          <KPI label="Avg Dev Factor (12-24m)" value={devFactors[0] ? devFactors[0].factor.toFixed(3) : '--'} />
          <KPI label="Avg Dev Factor (24-36m)" value={devFactors[1] ? devFactors[1].factor.toFixed(3) : '--'} />
        </div>

        {/* Triangle Table */}
        <div style={sCard}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
            Loss Development Triangle (Last 15 Accident Years)
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ padding: 4, textAlign: 'left', color: T.sub }}>Acc. Year</th>
                  {Array.from({ length: 10 }, (_, d) =>
                    <th key={d} style={{ padding: 4, textAlign: 'right', color: T.sub }}>Dev {d + 1}</th>
                  )}
                  <th style={{ padding: 4, textAlign: 'right', color: T.sub }}>Ultimate</th>
                  <th style={{ padding: 4, textAlign: 'right', color: T.sub }}>IBNR</th>
                </tr>
              </thead>
              <tbody>
                {triangle.map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 4, fontWeight: 600, color: T.navy }}>{r.accidentYear}</td>
                    {r.paid.map((v, d) => (
                      <td key={d} style={{
                        padding: 4, textAlign: 'right',
                        color: v == null ? T.border : T.text, fontSize: 10
                      }}>
                        {v != null ? fmt(v) : '-'}
                      </td>
                    ))}
                    <td style={{ padding: 4, textAlign: 'right', fontWeight: 700, color: T.navy }}>
                      {fmt(r.ultimate)}
                    </td>
                    <td style={{ padding: 4, textAlign: 'right', fontWeight: 600, color: T.amber }}>
                      {fmt(r.ibnr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={sCard}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
              Paid vs Ultimate vs IBNR
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={paidVsIncurred}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                <Tooltip formatter={v => '$' + fmt(v) + 'mn'} />
                <Legend />
                <Bar dataKey="paid" fill={T.navy} name="Paid ($mn)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="ibnr" fill={T.amber} name="IBNR ($mn)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="ultimate" fill={T.sub} name="Ultimate ($mn)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={sCard}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
              Development Factors
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={devFactors}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="devYear" tick={{ fontSize: 10 }}
                  label={{ value: 'Dev Year', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[1, 2]} />
                <Tooltip />
                <ReferenceLine y={1} stroke={T.sub} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="factor" stroke={T.indigo}
                  strokeWidth={2} name="Avg Factor" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════
     TAB 9: Climate Stress Test
     ══════════════════════════════════════════════════════════ */
  const renderClimateStress = () => {
    const stressScenarios = [
      { name: 'IAIS GIMAR - Acute Physical', type: 'IAIS',
        freqAdj: 1.35, sevAdj: 1.28, capitalImpact_pct: 8.5, reserveAdequacy_pct: 88 },
      { name: 'IAIS GIMAR - Chronic Physical', type: 'IAIS',
        freqAdj: 1.15, sevAdj: 1.45, capitalImpact_pct: 12.2, reserveAdequacy_pct: 82 },
      { name: 'IAIS GIMAR - Transition (Orderly)', type: 'IAIS',
        freqAdj: 1.05, sevAdj: 1.08, capitalImpact_pct: 3.8, reserveAdequacy_pct: 96 },
      { name: 'IAIS GIMAR - Transition (Disorderly)', type: 'IAIS',
        freqAdj: 1.12, sevAdj: 1.22, capitalImpact_pct: 6.5, reserveAdequacy_pct: 91 },
      { name: 'PRA SS3/19 - Physical', type: 'PRA',
        freqAdj: 1.40, sevAdj: 1.35, capitalImpact_pct: 10.8, reserveAdequacy_pct: 85 },
      { name: 'PRA SS3/19 - Transition', type: 'PRA',
        freqAdj: 1.08, sevAdj: 1.15, capitalImpact_pct: 5.2, reserveAdequacy_pct: 93 },
      { name: 'NGFS Hot House World', type: 'NGFS',
        freqAdj: 1.55, sevAdj: 1.60, capitalImpact_pct: 18.5, reserveAdequacy_pct: 72 },
      { name: 'NGFS Below 2C (Orderly)', type: 'NGFS',
        freqAdj: 1.10, sevAdj: 1.12, capitalImpact_pct: 4.0, reserveAdequacy_pct: 95 },
    ];

    const waterfallData = stressScenarios.map(s => ({
      name: s.name.length > 22 ? s.name.slice(0, 22) + '..' : s.name,
      impact: s.capitalImpact_pct
    }));

    const reserveBar = stressScenarios.map(s => ({
      name: s.name.length > 22 ? s.name.slice(0, 22) + '..' : s.name,
      adequacy: s.reserveAdequacy_pct,
      shortfall: 100 - s.reserveAdequacy_pct
    }));

    const port = PORTFOLIOS[selPortfolio];
    const baseAAL = port.totalExposure_bn * port.aalRatio_bps / 10000;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>
            Climate Stress Test - IAIS GIMAR / PRA SS3/19 / NGFS
          </span>
          <select value={selPortfolio} onChange={e => setSelPortfolio(+e.target.value)}
            style={{ ...sSelect, marginLeft: 'auto' }}>
            {PORTFOLIOS.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
          </select>
        </div>

        {/* Stress Scenario Table */}
        <div style={sCard}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 12 }}>
            Stress Scenario Detail
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {['Scenario', 'Framework', 'Freq Adj', 'Severity Adj', 'Stressed AAL ($bn)',
                    'Capital Impact', 'Reserve Adequacy'].map(h =>
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.sub, fontWeight: 600 }}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {stressScenarios.map((s, i) => {
                  const stressedAAL = +(baseAAL * s.freqAdj * s.sevAdj).toFixed(2);
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, color: T.navy }}>{s.name}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <Badge text={s.type}
                          color={s.type === 'IAIS' ? T.indigo : s.type === 'PRA' ? T.green : T.amber} />
                      </td>
                      <td style={{ padding: '6px 8px' }}>{s.freqAdj.toFixed(2)}x</td>
                      <td style={{ padding: '6px 8px' }}>{s.sevAdj.toFixed(2)}x</td>
                      <td style={{ padding: '6px 8px', fontWeight: 700 }}>${stressedAAL}bn</td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{
                          color: s.capitalImpact_pct > 10 ? T.red : s.capitalImpact_pct > 5 ? T.amber : T.green,
                          fontWeight: 700
                        }}>
                          -{s.capitalImpact_pct}%
                        </span>
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ background: T.border, borderRadius: 4, height: 8, width: 80, flex: 'none' }}>
                            <div style={{
                              background: s.reserveAdequacy_pct > 90 ? T.green :
                                s.reserveAdequacy_pct > 80 ? T.amber : T.red,
                              borderRadius: 4, height: 8,
                              width: `${s.reserveAdequacy_pct}%`
                            }} />
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: s.reserveAdequacy_pct > 90 ? T.green :
                              s.reserveAdequacy_pct > 80 ? T.amber : T.red
                          }}>
                            {s.reserveAdequacy_pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={sCard}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
              Capital Impact Waterfall (%)
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={waterfallData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} unit="%" />
                <Tooltip formatter={v => v + '%'} />
                <Bar dataKey="impact" name="Capital Impact %" radius={[4, 4, 0, 0]}>
                  {waterfallData.map((e, i) =>
                    <Cell key={i} fill={e.impact > 10 ? T.red : e.impact > 5 ? T.amber : T.green} />
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={sCard}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>
              Reserve Adequacy Under Stress
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={reserveBar}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                <Tooltip formatter={v => v + '%'} />
                <Legend />
                <Bar dataKey="adequacy" stackId="a" fill={T.green} name="Adequate" />
                <Bar dataKey="shortfall" stackId="a" fill={T.red} name="Shortfall" />
                <ReferenceLine y={90} stroke={T.navy} strokeDasharray="3 3"
                  label={{ value: 'Target 90%', position: 'top', fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════ */
  const panels = [
    renderDashboard, renderPerilAnalysis, renderEventExplorer, renderEPCurve,
    renderRegional, renderRDS, renderClimateScenarios, renderPortfolioAnalytics,
    renderLossDev, renderClimateStress
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1440, margin: '0 auto', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.navy, margin: 0 }}>
          Catastrophe Modelling & Climate Risk
        </h1>
        <p style={{ fontSize: 13, color: T.sub, margin: '4px 0 0' }}>
          RMS/AIR/CoreLogic standards | IAIS GIMAR | Lloyd's RDS | PRA SS3/19
        </p>
      </div>

      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20,
        borderBottom: `1px solid ${T.border}`, paddingBottom: 12
      }}>
        {TABS.map((t, i) =>
          <button key={i} onClick={() => setTab(i)} style={sTab(tab === i)}>{t}</button>
        )}
      </div>

      {panels[tab]()}
    </div>
  );
}
