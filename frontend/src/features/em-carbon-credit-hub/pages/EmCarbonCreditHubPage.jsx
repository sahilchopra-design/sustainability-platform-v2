import React, { useState, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell, ReferenceLine, PieChart, Pie, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter
} from 'recharts';

/* ── deterministic PRNG ── */
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

/* ── theme ── */
const T = { surface: '#fafaf7', border: '#e2e0d8', navy: '#1b2a4a', gold: '#b8962e', text: '#1a1a2e', sub: '#64748b', card: '#ffffff', indigo: '#4f46e5', green: '#065f46', red: '#991b1b', amber: '#92400e' };
const COLORS = [T.indigo, T.green, T.gold, T.red, T.amber, '#2563eb', '#7c3aed', '#0891b2', '#ea580c', '#16a34a', '#dc2626', '#d97706'];
const font = "'DM Sans','SF Pro Display',system-ui,sans-serif";
const mono = "'JetBrains Mono','SF Mono','Fira Code',monospace";

/* ── tab names ── */
const TABS = [
  'EM Carbon Market Map', 'Article 6.2 Tracker', 'ITMO Pricing Intelligence',
  'CA Deep-Dive', 'NDC Gap & Offset Demand', 'ACMI Initiative',
  'JCM & Bilateral Programs', 'MRV & Integrity', 'EM Country Profiles',
  'Investment & Blended Finance'
];

/* ── module-level data ── */
const BILATERAL_DEALS = [
  { id: 1, buyer: 'Switzerland', seller: 'Peru', sector: 'Forestry', itmoVolume: 2.5, priceUsd: 18, caApplied: true, caStatus: 'applied', mechanism: 'Art6.2', startYear: 2020, endYear: 2030, verifier: 'Gold Standard', ndcSector: 'LULUCF', additionalityProof: 'Investment barrier' },
  { id: 2, buyer: 'Switzerland', seller: 'Ghana', sector: 'Cookstove', itmoVolume: 1.8, priceUsd: 15, caApplied: true, caStatus: 'applied', mechanism: 'Art6.2', startYear: 2020, endYear: 2029, verifier: 'Verra', ndcSector: 'Energy', additionalityProof: 'Common practice' },
  { id: 3, buyer: 'Switzerland', seller: 'Thailand', sector: 'Renewable', itmoVolume: 0.8, priceUsd: 20, caApplied: true, caStatus: 'applied', mechanism: 'Art6.2', startYear: 2022, endYear: 2030, verifier: 'Gold Standard', ndcSector: 'Energy', additionalityProof: 'Investment barrier' },
  { id: 4, buyer: 'Switzerland', seller: 'Vanuatu', sector: 'Renewable', itmoVolume: 0.3, priceUsd: 22, caApplied: true, caStatus: 'applied', mechanism: 'Art6.2', startYear: 2021, endYear: 2028, verifier: 'Gold Standard', ndcSector: 'Energy', additionalityProof: 'Technology barrier' },
  { id: 5, buyer: 'Japan', seller: 'Mongolia', sector: 'Renewable', itmoVolume: 1.2, priceUsd: 12, caApplied: true, caStatus: 'applied', mechanism: 'JCM', startYear: 2021, endYear: 2030, verifier: 'JCM Registry', ndcSector: 'Energy', additionalityProof: 'Financial additionality' },
  { id: 6, buyer: 'Japan', seller: 'Bangladesh', sector: 'Waste', itmoVolume: 0.6, priceUsd: 10, caApplied: false, caStatus: 'pending', mechanism: 'JCM', startYear: 2022, endYear: 2031, verifier: 'JCM Registry', ndcSector: 'Waste', additionalityProof: 'Technology barrier' },
  { id: 7, buyer: 'Japan', seller: 'Kenya', sector: 'Renewable', itmoVolume: 0.4, priceUsd: 14, caApplied: false, caStatus: 'pending', mechanism: 'JCM', startYear: 2023, endYear: 2032, verifier: 'JCM Registry', ndcSector: 'Energy', additionalityProof: 'Financial additionality' },
  { id: 8, buyer: 'Singapore', seller: 'Papua New Guinea', sector: 'Forestry', itmoVolume: 2.0, priceUsd: 8, caApplied: true, caStatus: 'applied', mechanism: 'bilateral', startYear: 2023, endYear: 2033, verifier: 'Verra', ndcSector: 'LULUCF', additionalityProof: 'Common practice' },
  { id: 9, buyer: 'Singapore', seller: 'Ghana', sector: 'Cookstove', itmoVolume: 1.0, priceUsd: 12, caApplied: true, caStatus: 'applied', mechanism: 'bilateral', startYear: 2023, endYear: 2030, verifier: 'Gold Standard', ndcSector: 'Energy', additionalityProof: 'Investment barrier' },
  { id: 10, buyer: 'Singapore', seller: 'Paraguay', sector: 'Forestry', itmoVolume: 0.5, priceUsd: 10, caApplied: false, caStatus: 'pending', mechanism: 'bilateral', startYear: 2024, endYear: 2032, verifier: 'Verra', ndcSector: 'LULUCF', additionalityProof: 'Technology barrier' },
  { id: 11, buyer: 'South Korea', seller: 'Peru', sector: 'Forestry', itmoVolume: 1.5, priceUsd: 16, caApplied: false, caStatus: 'pending', mechanism: 'Art6.2', startYear: 2023, endYear: 2031, verifier: 'Gold Standard', ndcSector: 'LULUCF', additionalityProof: 'Investment barrier' },
  { id: 12, buyer: 'Sweden', seller: 'Nepal', sector: 'Renewable', itmoVolume: 0.3, priceUsd: 25, caApplied: false, caStatus: 'pending', mechanism: 'Art6.2', startYear: 2024, endYear: 2033, verifier: 'Gold Standard', ndcSector: 'Energy', additionalityProof: 'Financial additionality' },
  { id: 13, buyer: 'Germany', seller: 'Namibia', sector: 'Industrial', itmoVolume: 0.8, priceUsd: 22, caApplied: false, caStatus: 'pending', mechanism: 'Art6.2', startYear: 2024, endYear: 2034, verifier: 'TUV SUD', ndcSector: 'Industry', additionalityProof: 'Technology barrier' },
  { id: 14, buyer: 'Norway', seller: 'Colombia', sector: 'Forestry', itmoVolume: 1.2, priceUsd: 15, caApplied: false, caStatus: 'pending', mechanism: 'Art6.2', startYear: 2024, endYear: 2033, verifier: 'Verra', ndcSector: 'LULUCF', additionalityProof: 'Common practice' },
  { id: 15, buyer: 'UK', seller: 'Rwanda', sector: 'Cookstove', itmoVolume: 0.4, priceUsd: 18, caApplied: false, caStatus: 'pending', mechanism: 'bilateral', startYear: 2024, endYear: 2031, verifier: 'Gold Standard', ndcSector: 'Energy', additionalityProof: 'Investment barrier' },
  { id: 16, buyer: 'Japan', seller: 'Vietnam', sector: 'Renewable', itmoVolume: 1.8, priceUsd: 11, caApplied: true, caStatus: 'applied', mechanism: 'JCM', startYear: 2022, endYear: 2031, verifier: 'JCM Registry', ndcSector: 'Energy', additionalityProof: 'Financial additionality' },
  { id: 17, buyer: 'Japan', seller: 'Indonesia', sector: 'Methane', itmoVolume: 2.2, priceUsd: 13, caApplied: false, caStatus: 'rejected', mechanism: 'JCM', startYear: 2023, endYear: 2032, verifier: 'JCM Registry', ndcSector: 'Waste', additionalityProof: 'Technology barrier' },
  { id: 18, buyer: 'Switzerland', seller: 'Senegal', sector: 'Agriculture', itmoVolume: 0.6, priceUsd: 19, caApplied: true, caStatus: 'applied', mechanism: 'Art6.2', startYear: 2023, endYear: 2031, verifier: 'Gold Standard', ndcSector: 'Agriculture', additionalityProof: 'Common practice' },
  { id: 19, buyer: 'Germany', seller: 'Morocco', sector: 'Renewable', itmoVolume: 1.4, priceUsd: 17, caApplied: false, caStatus: 'exempt', mechanism: 'Art6.4', startYear: 2024, endYear: 2033, verifier: 'UN Art6.4 Body', ndcSector: 'Energy', additionalityProof: 'Financial additionality' },
  { id: 20, buyer: 'Canada', seller: 'Costa Rica', sector: 'Forestry', itmoVolume: 0.9, priceUsd: 21, caApplied: true, caStatus: 'applied', mechanism: 'Art6.2', startYear: 2024, endYear: 2034, verifier: 'Verra', ndcSector: 'LULUCF', additionalityProof: 'Investment barrier' },
  { id: 21, buyer: 'France', seller: 'Madagascar', sector: 'Agriculture', itmoVolume: 0.7, priceUsd: 14, caApplied: false, caStatus: 'pending', mechanism: 'bilateral', startYear: 2024, endYear: 2032, verifier: 'Gold Standard', ndcSector: 'Agriculture', additionalityProof: 'Common practice' },
  { id: 22, buyer: 'Netherlands', seller: 'Ethiopia', sector: 'Cookstove', itmoVolume: 1.1, priceUsd: 16, caApplied: false, caStatus: 'pending', mechanism: 'Art6.2', startYear: 2025, endYear: 2034, verifier: 'Gold Standard', ndcSector: 'Energy', additionalityProof: 'Investment barrier' },
  { id: 23, buyer: 'Denmark', seller: 'Uganda', sector: 'Transport', itmoVolume: 0.5, priceUsd: 24, caApplied: false, caStatus: 'pending', mechanism: 'Art6.4', startYear: 2025, endYear: 2035, verifier: 'UN Art6.4 Body', ndcSector: 'Transport', additionalityProof: 'Technology barrier' },
  { id: 24, buyer: 'Australia', seller: 'Fiji', sector: 'Renewable', itmoVolume: 0.2, priceUsd: 28, caApplied: true, caStatus: 'applied', mechanism: 'bilateral', startYear: 2024, endYear: 2032, verifier: 'Gold Standard', ndcSector: 'Energy', additionalityProof: 'Financial additionality' },
  { id: 25, buyer: 'South Korea', seller: 'Cambodia', sector: 'Methane', itmoVolume: 0.8, priceUsd: 9, caApplied: false, caStatus: 'pending', mechanism: 'bilateral', startYear: 2025, endYear: 2034, verifier: 'Verra', ndcSector: 'Waste', additionalityProof: 'Common practice' },
];

const ITMO_PRICING = [
  { type: 'REDD+ (High Integrity)', minPrice: 15, maxPrice: 28, avgPrice: 21, volume: 48, trend: 'up', liquidityScore: 72, registryCount: 14 },
  { type: 'Clean Cooking', minPrice: 8, maxPrice: 19, avgPrice: 14, volume: 34, trend: 'up', liquidityScore: 68, registryCount: 11 },
  { type: 'Renewable Energy', minPrice: 5, maxPrice: 16, avgPrice: 10, volume: 65, trend: 'stable', liquidityScore: 85, registryCount: 22 },
  { type: 'Soil Carbon', minPrice: 12, maxPrice: 24, avgPrice: 18, volume: 16, trend: 'up', liquidityScore: 42, registryCount: 6 },
  { type: 'Afforestation/Reforestation', minPrice: 10, maxPrice: 22, avgPrice: 16, volume: 28, trend: 'up', liquidityScore: 55, registryCount: 9 },
  { type: 'Methane Avoidance', minPrice: 8, maxPrice: 17, avgPrice: 12, volume: 22, trend: 'stable', liquidityScore: 61, registryCount: 8 },
  { type: 'Blue Carbon (Mangroves)', minPrice: 18, maxPrice: 35, avgPrice: 26, volume: 6, trend: 'up', liquidityScore: 28, registryCount: 4 },
  { type: 'Industrial Efficiency', minPrice: 4, maxPrice: 12, avgPrice: 8, volume: 40, trend: 'down', liquidityScore: 78, registryCount: 18 },
  { type: 'Transport Electrification', minPrice: 7, maxPrice: 18, avgPrice: 12, volume: 14, trend: 'up', liquidityScore: 35, registryCount: 5 },
  { type: 'Waste-to-Energy', minPrice: 6, maxPrice: 14, avgPrice: 10, volume: 19, trend: 'stable', liquidityScore: 52, registryCount: 7 },
  { type: 'Agriculture (Regenerative)', minPrice: 11, maxPrice: 25, avgPrice: 17, volume: 12, trend: 'up', liquidityScore: 30, registryCount: 5 },
  { type: 'Green Hydrogen', minPrice: 20, maxPrice: 40, avgPrice: 30, volume: 3, trend: 'up', liquidityScore: 15, registryCount: 2 },
];

const CA_STATUS = [
  { country: 'Switzerland', region: 'Europe', caFramework: 'yes', creditVolume: 8.5, registeredProjects: 42, ndcTarget: -50, ndcGap: 12, article6Ready: true, domesticEts: true, carbonTax: true },
  { country: 'Singapore', region: 'Asia', caFramework: 'yes', creditVolume: 4.2, registeredProjects: 18, ndcTarget: -36, ndcGap: 8, article6Ready: true, domesticEts: true, carbonTax: true },
  { country: 'Japan', region: 'Asia', caFramework: 'yes', creditVolume: 6.8, registeredProjects: 65, ndcTarget: -46, ndcGap: 15, article6Ready: true, domesticEts: true, carbonTax: true },
  { country: 'Ghana', region: 'Africa', caFramework: 'yes', creditVolume: 2.8, registeredProjects: 24, ndcTarget: -45, ndcGap: 22, article6Ready: true, domesticEts: false, carbonTax: false },
  { country: 'Peru', region: 'LatAm', caFramework: 'yes', creditVolume: 2.5, registeredProjects: 19, ndcTarget: -40, ndcGap: 18, article6Ready: true, domesticEts: false, carbonTax: false },
  { country: 'Thailand', region: 'Asia', caFramework: 'partial', creditVolume: 1.2, registeredProjects: 12, ndcTarget: -30, ndcGap: 14, article6Ready: false, domesticEts: false, carbonTax: false },
  { country: 'Indonesia', region: 'Asia', caFramework: 'no', creditVolume: 0.5, registeredProjects: 8, ndcTarget: -31, ndcGap: 20, article6Ready: false, domesticEts: false, carbonTax: true },
  { country: 'Brazil', region: 'LatAm', caFramework: 'no', creditVolume: 0.0, registeredProjects: 0, ndcTarget: -50, ndcGap: 25, article6Ready: false, domesticEts: false, carbonTax: false },
  { country: 'Kenya', region: 'Africa', caFramework: 'partial', creditVolume: 1.8, registeredProjects: 15, ndcTarget: -32, ndcGap: 16, article6Ready: false, domesticEts: false, carbonTax: false },
  { country: 'Vietnam', region: 'Asia', caFramework: 'partial', creditVolume: 2.1, registeredProjects: 20, ndcTarget: -27, ndcGap: 11, article6Ready: false, domesticEts: true, carbonTax: false },
  { country: 'Colombia', region: 'LatAm', caFramework: 'partial', creditVolume: 1.5, registeredProjects: 14, ndcTarget: -51, ndcGap: 24, article6Ready: false, domesticEts: false, carbonTax: true },
  { country: 'Morocco', region: 'MENA', caFramework: 'partial', creditVolume: 0.9, registeredProjects: 7, ndcTarget: -45, ndcGap: 19, article6Ready: false, domesticEts: false, carbonTax: false },
  { country: 'Rwanda', region: 'Africa', caFramework: 'yes', creditVolume: 0.8, registeredProjects: 9, ndcTarget: -38, ndcGap: 21, article6Ready: true, domesticEts: false, carbonTax: false },
  { country: 'Senegal', region: 'Africa', caFramework: 'partial', creditVolume: 0.6, registeredProjects: 6, ndcTarget: -25, ndcGap: 13, article6Ready: false, domesticEts: false, carbonTax: false },
  { country: 'Costa Rica', region: 'LatAm', caFramework: 'yes', creditVolume: 1.1, registeredProjects: 11, ndcTarget: -44, ndcGap: 10, article6Ready: true, domesticEts: false, carbonTax: true },
];

const ACMI_DATA = {
  targets: [
    { year: 2024, credits: 25, revenue: 0.5, projects: 180 },
    { year: 2025, credits: 50, revenue: 1.2, projects: 350 },
    { year: 2026, credits: 85, revenue: 2.2, projects: 520 },
    { year: 2027, credits: 125, revenue: 3.8, projects: 720 },
    { year: 2028, credits: 180, revenue: 5.5, projects: 960 },
    { year: 2029, credits: 240, revenue: 7.8, projects: 1220 },
    { year: 2030, credits: 300, revenue: 10.0, projects: 1500 },
    { year: 2031, credits: 370, revenue: 13.0, projects: 1800 },
    { year: 2032, credits: 450, revenue: 16.5, projects: 2100 },
    { year: 2033, credits: 540, revenue: 20.5, projects: 2450 },
    { year: 2034, credits: 640, revenue: 25.0, projects: 2850 },
    { year: 2035, credits: 750, revenue: 30.0, projects: 3300 },
  ],
  sectors: [
    { name: 'Clean Cooking', share: 26, credits: 78 },
    { name: 'Forestry/REDD+', share: 21, credits: 63 },
    { name: 'Renewables', share: 17, credits: 51 },
    { name: 'Agriculture', share: 12, credits: 36 },
    { name: 'Waste Management', share: 8, credits: 24 },
    { name: 'Industrial Efficiency', share: 6, credits: 18 },
    { name: 'Transport', share: 5, credits: 15 },
    { name: 'Methane Capture', share: 5, credits: 15 },
  ],
  countrySpotlights: [
    { country: 'Kenya', credits2024: 8.2, pipeline: 45, avgPrice: 14.5, flagSector: 'Clean Cooking', governanceScore: 3.8 },
    { country: 'Ghana', credits2024: 6.5, pipeline: 38, avgPrice: 13.2, flagSector: 'Cookstove/Forestry', governanceScore: 3.5 },
    { country: 'Rwanda', credits2024: 2.8, pipeline: 22, avgPrice: 16.8, flagSector: 'Forestry', governanceScore: 4.1 },
    { country: 'Nigeria', credits2024: 4.1, pipeline: 30, avgPrice: 9.8, flagSector: 'Waste/Methane', governanceScore: 2.4 },
    { country: 'Mozambique', credits2024: 3.2, pipeline: 18, avgPrice: 11.5, flagSector: 'Forestry/REDD+', governanceScore: 2.8 },
  ],
  financingPipeline: [
    { source: 'Multilateral DFIs', amount: 2.8 },
    { source: 'Bilateral Aid', amount: 1.5 },
    { source: 'Private Carbon Funds', amount: 3.2 },
    { source: 'Philanthropic', amount: 0.8 },
    { source: 'Corporate Offtake', amount: 1.9 },
    { source: 'Blended Finance', amount: 1.2 },
  ],
};

const MRV_CHALLENGES = [
  { category: 'Remote Sensing Gaps', severity: 'Critical', region: 'Sub-Saharan Africa', mitigationStatus: 'In Progress', technologySolution: 'Sentinel-2 + LiDAR fusion', costEstimate: 2.5 },
  { category: 'Ground Truth Verification', severity: 'Critical', region: 'Southeast Asia', mitigationStatus: 'Pilot Phase', technologySolution: 'IoT sensor networks', costEstimate: 4.2 },
  { category: 'Baseline Data Scarcity', severity: 'High', region: 'All EM', mitigationStatus: 'Partial', technologySolution: 'ML-based proxy estimation', costEstimate: 1.8 },
  { category: 'Permanence Monitoring', severity: 'High', region: 'Amazon/Congo Basin', mitigationStatus: 'Early Stage', technologySolution: 'Blockchain + satellite alerts', costEstimate: 3.5 },
  { category: 'Leakage Quantification', severity: 'High', region: 'Latin America', mitigationStatus: 'Methodology Gap', technologySolution: 'Regional displacement modeling', costEstimate: 2.1 },
  { category: 'Community Engagement', severity: 'Medium', region: 'Africa/Pacific', mitigationStatus: 'Active', technologySolution: 'Mobile-based FPIC platforms', costEstimate: 0.9 },
  { category: 'Additionality Testing', severity: 'High', region: 'Asia', mitigationStatus: 'Under Review', technologySolution: 'Counterfactual AI models', costEstimate: 1.5 },
  { category: 'Double Counting Prevention', severity: 'Critical', region: 'All EM', mitigationStatus: 'Framework Stage', technologySolution: 'UNFCCC centralized registry', costEstimate: 5.0 },
  { category: 'Methodology Standardization', severity: 'Medium', region: 'MENA', mitigationStatus: 'Consultation', technologySolution: 'Harmonized CDM/VCS protocols', costEstimate: 1.2 },
  { category: 'Third-Party Audit Capacity', severity: 'High', region: 'Africa', mitigationStatus: 'Scaling', technologySolution: 'Regional auditor training programs', costEstimate: 3.0 },
];

const EM_COUNTRY_PROFILES = Array.from({ length: 20 }, (_, i) => {
  const names = ['Kenya', 'Ghana', 'Peru', 'Vietnam', 'Colombia', 'Rwanda', 'Indonesia', 'Morocco', 'Senegal', 'Costa Rica', 'Ethiopia', 'Nigeria', 'Bangladesh', 'Cambodia', 'Madagascar', 'Uganda', 'Nepal', 'Fiji', 'Papua New Guinea', 'Mozambique'];
  const regions = ['Africa', 'Africa', 'LatAm', 'Asia', 'LatAm', 'Africa', 'Asia', 'MENA', 'Africa', 'LatAm', 'Africa', 'Africa', 'Asia', 'Asia', 'Africa', 'Africa', 'Asia', 'Pacific', 'Pacific', 'Africa'];
  const ratings = ['BB+', 'B+', 'BBB-', 'BB', 'BB+', 'B+', 'BBB-', 'BB+', 'B', 'BB', 'B-', 'B-', 'BB-', 'B+', 'B-', 'B', 'B+', 'B+', 'B-', 'B'];
  return {
    country: names[i], region: regions[i],
    ndcTarget2030: -(25 + Math.round(sr(i * 71) * 30)),
    currentEmissions: Math.round(50 + sr(i * 53) * 400),
    reductionAchieved: Math.round(sr(i * 37) * 25),
    creditPipeline: Math.round(5 + sr(i * 89) * 55),
    policyMaturity: Math.round(1 + sr(i * 43) * 4),
    investmentGrade: sr(i * 61) > 0.5,
    sovereignRating: ratings[i],
    deforestationRate: +(sr(i * 79) * 3.5).toFixed(2),
    renewableCapacity: Math.round(200 + sr(i * 97) * 4000),
  };
});

const JCM_PROJECTS = [
  { project: 'Solar PV Rooftop Program', hostCountry: 'Vietnam', partnerCountry: 'Japan', sector: 'Renewable', credits: 1.8, methodology: 'JCM-VN001', status: 'Issuing' },
  { project: 'Waste Heat Recovery', hostCountry: 'Indonesia', partnerCountry: 'Japan', sector: 'Industrial', credits: 2.2, methodology: 'JCM-ID003', status: 'Registered' },
  { project: 'LED Street Lighting', hostCountry: 'Mongolia', partnerCountry: 'Japan', sector: 'Industrial', credits: 0.4, methodology: 'JCM-MN002', status: 'Issuing' },
  { project: 'Biomass Power Plant', hostCountry: 'Thailand', partnerCountry: 'Japan', sector: 'Renewable', credits: 1.1, methodology: 'JCM-TH005', status: 'Registered' },
  { project: 'Efficient AC Systems', hostCountry: 'Bangladesh', partnerCountry: 'Japan', sector: 'Industrial', credits: 0.6, methodology: 'JCM-BD001', status: 'Pipeline' },
  { project: 'Geothermal Exploration', hostCountry: 'Kenya', partnerCountry: 'Japan', sector: 'Renewable', credits: 3.5, methodology: 'JCM-KE001', status: 'Pipeline' },
  { project: 'EV Bus Fleet', hostCountry: 'Thailand', partnerCountry: 'Japan', sector: 'Transport', credits: 0.3, methodology: 'JCM-TH008', status: 'Pipeline' },
  { project: 'Mini-grid Solar', hostCountry: 'Myanmar', partnerCountry: 'Japan', sector: 'Renewable', credits: 0.5, methodology: 'JCM-MM001', status: 'Registered' },
  { project: 'Industrial Boiler Upgrade', hostCountry: 'Cambodia', partnerCountry: 'Japan', sector: 'Industrial', credits: 0.7, methodology: 'JCM-KH002', status: 'Issuing' },
  { project: 'Wind Farm Development', hostCountry: 'Mongolia', partnerCountry: 'Japan', sector: 'Renewable', credits: 2.0, methodology: 'JCM-MN005', status: 'Pipeline' },
  { project: 'Biogas from Palm Oil', hostCountry: 'Indonesia', partnerCountry: 'Japan', sector: 'Methane', credits: 1.4, methodology: 'JCM-ID007', status: 'Registered' },
  { project: 'Solar Water Pumping', hostCountry: 'Ethiopia', partnerCountry: 'Japan', sector: 'Renewable', credits: 0.8, methodology: 'JCM-ET001', status: 'Pipeline' },
  { project: 'Landfill Gas Capture', hostCountry: 'Vietnam', partnerCountry: 'Japan', sector: 'Methane', credits: 1.6, methodology: 'JCM-VN004', status: 'Issuing' },
  { project: 'Efficient Chillers', hostCountry: 'Philippines', partnerCountry: 'Japan', sector: 'Industrial', credits: 0.3, methodology: 'JCM-PH002', status: 'Registered' },
  { project: 'Cookstove Distribution', hostCountry: 'Laos', partnerCountry: 'Japan', sector: 'Cookstove', credits: 0.5, methodology: 'JCM-LA001', status: 'Pipeline' },
];

const NDC_GAP_ANALYSIS = Array.from({ length: 20 }, (_, i) => {
  const names = ['Kenya', 'Ghana', 'Peru', 'Vietnam', 'Colombia', 'Rwanda', 'Indonesia', 'Morocco', 'Senegal', 'Costa Rica', 'Ethiopia', 'Nigeria', 'Bangladesh', 'Cambodia', 'Madagascar', 'Uganda', 'Nepal', 'Fiji', 'Papua New Guinea', 'Mozambique'];
  const uncond = Math.round(15 + sr(i * 31) * 20);
  const cond = uncond + Math.round(5 + sr(i * 47) * 15);
  const current = Math.round(sr(i * 59) * uncond * 0.6);
  const gap = uncond - current;
  return {
    country: names[i],
    unconditionalTarget: uncond,
    conditionalTarget: cond,
    currentTrajectory: current,
    gapMtCO2: Math.round(10 + sr(i * 67) * 80),
    offsetPotential: Math.round(5 + sr(i * 73) * 40),
    financingNeed: +(0.2 + sr(i * 83) * 3.5).toFixed(1),
  };
});

const BLENDED_FINANCE_DEALS = Array.from({ length: 15 }, (_, i) => {
  const names = ['Africa Green Bond I', 'ACMI Catalyst Fund', 'SE Asia REDD+ Vehicle', 'LatAm Cookstove SPV', 'Pacific Blue Carbon Trust', 'Sahel Agroforestry Fund', 'MENA Solar Credit Facility', 'Congo Basin REDD+ Pool', 'India Waste-to-Energy', 'Caribbean Climate Fund', 'Central Asia Wind Credits', 'East Africa Methane Fund', 'Andean Reforestation SPV', 'Indo-Pacific Mangrove Trust', 'West Africa Clean Cooking'];
  const types = ['Green Bond', 'Blended Fund', 'SPV', 'Trust', 'Facility', 'Fund', 'SPV', 'Pool', 'SPV', 'Fund', 'Facility', 'Fund', 'SPV', 'Trust', 'Fund'];
  return {
    deal: names[i], type: types[i],
    totalSize: +(20 + sr(i * 41) * 180).toFixed(0),
    concessional: Math.round(20 + sr(i * 51) * 40),
    commercial: Math.round(30 + sr(i * 61) * 40),
    philanthropic: Math.round(5 + sr(i * 71) * 20),
    region: ['Africa', 'Africa', 'Asia', 'LatAm', 'Pacific', 'Africa', 'MENA', 'Africa', 'Asia', 'LatAm', 'Asia', 'Africa', 'LatAm', 'Pacific', 'Africa'][i],
    expectedIRR: +(3 + sr(i * 81) * 12).toFixed(1),
    tenorYears: Math.round(5 + sr(i * 91) * 10),
    creditRating: ['BB', 'B+', 'BB-', 'B', 'B+', 'B-', 'BB', 'B+', 'BB-', 'B', 'BB+', 'B-', 'B+', 'B', 'B'][i],
  };
});

/* ── style helpers ── */
const card = { background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 };
const badge = (c) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c + '18', color: c });
const kpiBox = (label, val, col) => (
  <div key={label} style={card}>
    <div style={{ fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: col, fontFamily: mono, marginTop: 4 }}>{val}</div>
  </div>
);
const sectionTitle = (text) => <h3 style={{ margin: '0 0 12px', color: T.navy, fontSize: 15, fontWeight: 700 }}>{text}</h3>;
const tableHeader = (headers) => (
  <thead><tr style={{ background: T.surface }}>
    {headers.map(h => <th key={h} style={{ padding: '7px 8px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.sub, fontSize: 11, fontWeight: 600 }}>{h}</th>)}
  </tr></thead>
);
const tCell = (v, opts = {}) => <td style={{ padding: '7px 8px', fontSize: 11, fontFamily: opts.mono ? mono : 'inherit', fontWeight: opts.bold ? 600 : 400, color: opts.color || T.text, ...opts.style }}>{v}</td>;

/* ══════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════ */
function EmCarbonCreditHubPage() {
  /* ── all hooks at top ── */
  const [tab, setTab] = useState(0);
  const [regionFilter, setRegionFilter] = useState('All');
  const [mechanismFilter, setMechanismFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState([]);
  const [dealMechFilter, setDealMechFilter] = useState('All');
  const [dealSectorFilter, setDealSectorFilter] = useState('All');
  const [dealCaFilter, setDealCaFilter] = useState('All');
  const [carbonTaxSlider, setCarbonTaxSlider] = useState(25);
  const [caReadinessFilter, setCaReadinessFilter] = useState('All');
  const [ndcAmbitionToggle, setNdcAmbitionToggle] = useState('unconditional');
  const [integritySliders, setIntegritySliders] = useState({ satellite: 60, groundTruth: 40, audit: 50 });
  const [expandedCountry, setExpandedCountry] = useState(null);
  const [governanceSlider, setGovernanceSlider] = useState(3);
  const [dealSort, setDealSort] = useState({ key: 'itmoVolume', asc: false });
  const [countrySort, setCountrySort] = useState({ key: 'creditPipeline', asc: false });

  /* ── derived data ── */
  const filteredDeals = useMemo(() => {
    let d = [...BILATERAL_DEALS];
    if (dealMechFilter !== 'All') d = d.filter(x => x.mechanism === dealMechFilter);
    if (dealSectorFilter !== 'All') d = d.filter(x => x.sector === dealSectorFilter);
    if (dealCaFilter !== 'All') d = d.filter(x => x.caStatus === dealCaFilter);
    d.sort((a, b) => dealSort.asc ? (a[dealSort.key] > b[dealSort.key] ? 1 : -1) : (a[dealSort.key] < b[dealSort.key] ? 1 : -1));
    return d;
  }, [dealMechFilter, dealSectorFilter, dealCaFilter, dealSort]);

  const filteredCA = useMemo(() => {
    if (caReadinessFilter === 'All') return CA_STATUS;
    if (caReadinessFilter === 'ready') return CA_STATUS.filter(c => c.caFramework === 'yes');
    if (caReadinessFilter === 'partial') return CA_STATUS.filter(c => c.caFramework === 'partial');
    return CA_STATUS.filter(c => c.caFramework === 'no');
  }, [caReadinessFilter]);

  const sortedCountries = useMemo(() => {
    return [...EM_COUNTRY_PROFILES].sort((a, b) => countrySort.asc ? (a[countrySort.key] > b[countrySort.key] ? 1 : -1) : (a[countrySort.key] < b[countrySort.key] ? 1 : -1));
  }, [countrySort]);

  const totalPipeline = useMemo(() => BILATERAL_DEALS.reduce((s, d) => s + d.itmoVolume, 0).toFixed(1), []);
  const avgItmoPrice = useMemo(() => { const p = ITMO_PRICING; return p.length ? (p.reduce((s, x) => s + x.avgPrice, 0) / p.length).toFixed(1) : '0'; }, []);
  const art6Count = useMemo(() => BILATERAL_DEALS.filter(d => d.mechanism.startsWith('Art6')).length, []);
  const caAdoptionRate = useMemo(() => { const total = CA_STATUS.length; return total ? Math.round(CA_STATUS.filter(c => c.caFramework === 'yes').length / total * 100) : 0; }, []);
  const acmiProgress = useMemo(() => { const t = ACMI_DATA.targets; return t.length ? Math.round(t[0].credits / (t[t.length - 1].credits || 1) * 100) : 0; }, []);
  const ndcGapTotal = useMemo(() => NDC_GAP_ANALYSIS.reduce((s, c) => s + c.gapMtCO2, 0), []);

  const itmoMonthlyPrices = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((m, mi) => {
      const obj = { month: m };
      ITMO_PRICING.slice(0, 6).forEach((p, pi) => {
        obj[p.type.split(' ')[0]] = +(p.avgPrice * (0.85 + sr(mi * 13 + pi * 7) * 0.3)).toFixed(1);
      });
      return obj;
    });
  }, []);

  const integrityScore = useMemo(() => {
    const { satellite, groundTruth, audit } = integritySliders;
    return Math.round(satellite * 0.4 + groundTruth * 0.35 + audit * 0.25);
  }, [integritySliders]);

  const politicalRiskPremium = useMemo(() => {
    return +(5 - governanceSlider * 0.8 + sr(governanceSlider * 17) * 1.5).toFixed(2);
  }, [governanceSlider]);

  const toggleDealSort = useCallback((key) => {
    setDealSort(prev => ({ key, asc: prev.key === key ? !prev.asc : false }));
  }, []);

  const toggleCountrySort = useCallback((key) => {
    setCountrySort(prev => ({ key, asc: prev.key === key ? !prev.asc : false }));
  }, []);

  /* ── chart data generators ── */
  const regionVolumePie = useMemo(() => [
    { name: 'Africa', value: 42 }, { name: 'Asia', value: 38 }, { name: 'LatAm', value: 28 },
    { name: 'Pacific', value: 6 }, { name: 'MENA', value: 4 },
  ], []);

  const countryPipelineBar = useMemo(() =>
    [...EM_COUNTRY_PROFILES].sort((a, b) => b.creditPipeline - a.creditPipeline).slice(0, 15).map(c => ({ country: c.country, pipeline: c.creditPipeline })),
  []);

  const dealFlowArea = useMemo(() => {
    return [2020, 2021, 2022, 2023, 2024, 2025].map((yr, yi) => ({
      year: yr,
      'Art6.2': Math.round(2 + yi * 1.5 + sr(yi * 11) * 3),
      'JCM': Math.round(1 + yi * 1.2 + sr(yi * 23) * 2),
      'Bilateral': Math.round(0.5 + yi * 0.8 + sr(yi * 37) * 2),
      'Art6.4': Math.round(sr(yi * 47) * yi * 0.8),
    }));
  }, []);

  const dealValueComposed = useMemo(() => {
    return filteredDeals.slice(0, 15).map(d => ({
      label: `${d.buyer}-${d.seller}`.substring(0, 16),
      volume: d.itmoVolume,
      price: d.priceUsd,
      value: +(d.itmoVolume * d.priceUsd).toFixed(1),
    }));
  }, [filteredDeals]);

  /* ══════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: font, background: T.surface, minHeight: '100vh', color: T.text }}>
      {/* ── header ── */}
      <div style={{ background: T.navy, padding: '24px 32px 0', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ color: T.gold, fontFamily: mono, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>EP-CJ3 :: EM CARBON CREDIT INTELLIGENCE</div>
            <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Emerging Market Carbon Credit Intelligence Hub</h1>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              Article 6.2 Bilateral Tracker | ITMO Pricing | CA Deep-Dive | NDC Gap | ACMI | JCM | MRV Integrity | Country Profiles | Blended Finance
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 420 }}>
            {[
              { label: 'EM Pipeline', val: `${totalPipeline}Mt`, col: T.green },
              { label: 'Avg ITMO', val: `$${avgItmoPrice}/t`, col: T.gold },
              { label: 'Art 6 Deals', val: String(art6Count), col: '#2563eb' },
            ].map(x => (
              <div key={x.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 14px', textAlign: 'right' }}>
                <div style={{ color: '#94a3b8', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>{x.label}</div>
                <div style={{ color: x.col, fontSize: 17, fontWeight: 700, fontFamily: mono }}>{x.val}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map((t2, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === i ? T.gold : '#94a3b8', fontWeight: tab === i ? 700 : 400, fontSize: 11,
              borderBottom: tab === i ? `2px solid ${T.gold}` : '2px solid transparent', whiteSpace: 'nowrap'
            }}>{t2}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px' }}>

        {/* ═══════════════════════════════════════
           TAB 0 — EM Carbon Market Map
           ═══════════════════════════════════════ */}
        {tab === 0 && (
          <div style={{ paddingTop: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
              {kpiBox('Total EM Credit Pipeline', `${totalPipeline} MtCO2`, T.green)}
              {kpiBox('Avg ITMO Price', `$${avgItmoPrice}/t`, T.gold)}
              {kpiBox('Article 6 Deal Count', String(art6Count), '#2563eb')}
              {kpiBox('CA Adoption Rate', `${caAdoptionRate}%`, T.indigo)}
              {kpiBox('ACMI 2030 Progress', `${acmiProgress}%`, T.amber)}
              {kpiBox('NDC Gap Aggregate', `${ndcGapTotal} MtCO2`, T.red)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                {sectionTitle('Regional Credit Volume Distribution')}
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={regionVolumePie} cx="50%" cy="50%" outerRadius={85} dataKey="value" nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {regionVolumePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                {sectionTitle('Country Credit Pipeline (Top 15, MtCO2)')}
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={countryPipelineBar} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="country" type="category" tick={{ fontSize: 10 }} width={90} />
                    <Tooltip />
                    <Bar dataKey="pipeline" fill={T.green} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={card}>
              {sectionTitle('Deal Flow by Mechanism Type (2020-2025)')}
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={dealFlowArea}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="Art6.2" stackId="1" fill={T.indigo} stroke={T.indigo} fillOpacity={0.7} />
                  <Area type="monotone" dataKey="JCM" stackId="1" fill={T.green} stroke={T.green} fillOpacity={0.7} />
                  <Area type="monotone" dataKey="Bilateral" stackId="1" fill={T.gold} stroke={T.gold} fillOpacity={0.7} />
                  <Area type="monotone" dataKey="Art6.4" stackId="1" fill={T.amber} stroke={T.amber} fillOpacity={0.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                {sectionTitle('Buyer Country Concentration')}
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={(() => {
                      const map = {};
                      BILATERAL_DEALS.forEach(d => { map[d.buyer] = (map[d.buyer] || 0) + d.itmoVolume; });
                      return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ name: k, value: +v.toFixed(1) }));
                    })()} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {BILATERAL_DEALS.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                {sectionTitle('Sector Volume Distribution (MtCO2)')}
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={(() => {
                    const map = {};
                    BILATERAL_DEALS.forEach(d => { map[d.sector] = (map[d.sector] || 0) + d.itmoVolume; });
                    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ sector: k, volume: +v.toFixed(1) }));
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="volume" fill={T.green} name="Volume (Mt)" radius={[4, 4, 0, 0]}>
                      {Array.from({ length: 8 }).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
           TAB 1 — Article 6.2 Tracker
           ═══════════════════════════════════════ */}
        {tab === 1 && (
          <div style={{ paddingTop: 20 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: T.sub, lineHeight: '28px', marginRight: 4 }}>Mechanism:</span>
              {['All', 'Art6.2', 'Art6.4', 'JCM', 'bilateral'].map(f => (
                <button key={f} onClick={() => setDealMechFilter(f)} style={{
                  padding: '4px 12px', borderRadius: 14, border: `1px solid ${dealMechFilter === f ? T.indigo : T.border}`,
                  background: dealMechFilter === f ? T.indigo + '18' : T.card, color: dealMechFilter === f ? T.indigo : T.sub,
                  cursor: 'pointer', fontSize: 11, fontWeight: 600
                }}>{f}</button>
              ))}
              <span style={{ fontSize: 11, color: T.sub, lineHeight: '28px', margin: '0 8px 0 16px' }}>Sector:</span>
              {['All', 'Forestry', 'Renewable', 'Cookstove', 'Methane', 'Agriculture', 'Industrial', 'Transport', 'Waste'].map(f => (
                <button key={f} onClick={() => setDealSectorFilter(f)} style={{
                  padding: '4px 12px', borderRadius: 14, border: `1px solid ${dealSectorFilter === f ? T.green : T.border}`,
                  background: dealSectorFilter === f ? T.green + '18' : T.card, color: dealSectorFilter === f ? T.green : T.sub,
                  cursor: 'pointer', fontSize: 11, fontWeight: 600
                }}>{f}</button>
              ))}
              <span style={{ fontSize: 11, color: T.sub, lineHeight: '28px', margin: '0 8px 0 16px' }}>CA:</span>
              {['All', 'applied', 'pending', 'rejected', 'exempt'].map(f => (
                <button key={f} onClick={() => setDealCaFilter(f)} style={{
                  padding: '4px 12px', borderRadius: 14, border: `1px solid ${dealCaFilter === f ? T.gold : T.border}`,
                  background: dealCaFilter === f ? T.gold + '18' : T.card, color: dealCaFilter === f ? T.gold : T.sub,
                  cursor: 'pointer', fontSize: 11, fontWeight: 600, textTransform: 'capitalize'
                }}>{f}</button>
              ))}
            </div>
            <div style={card}>
              {sectionTitle(`Article 6.2 Bilateral Agreements (${filteredDeals.length} deals)`)}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  {tableHeader(['Buyer', 'Seller', 'Sector', 'Mechanism', 'Volume (Mt)', 'Price ($/t)', 'Value ($M)', 'CA Status', 'Verifier', 'NDC Sector', 'Period', 'Additionality'])}
                  <tbody>
                    {filteredDeals.map(d => (
                      <tr key={d.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                        {tCell(d.buyer, { bold: true })}
                        {tCell(d.seller)}
                        {tCell(d.sector)}
                        {tCell(d.mechanism, { mono: true })}
                        {tCell(d.itmoVolume.toFixed(1), { mono: true })}
                        {tCell(`$${d.priceUsd}`, { mono: true })}
                        {tCell(`$${(d.itmoVolume * d.priceUsd).toFixed(1)}M`, { mono: true, color: T.green })}
                        <td style={{ padding: '7px 8px' }}>
                          <span style={badge(d.caStatus === 'applied' ? T.green : d.caStatus === 'rejected' ? T.red : d.caStatus === 'exempt' ? T.indigo : T.amber)}>{d.caStatus}</span>
                        </td>
                        {tCell(d.verifier, { style: { fontSize: 10 } })}
                        {tCell(d.ndcSector)}
                        {tCell(`${d.startYear}-${d.endYear}`, { mono: true })}
                        {tCell(d.additionalityProof, { style: { fontSize: 10, color: T.sub } })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                {sectionTitle('Deal Flow by Mechanism Type')}
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={[
                      { name: 'Art6.2', value: BILATERAL_DEALS.filter(d => d.mechanism === 'Art6.2').length },
                      { name: 'JCM', value: BILATERAL_DEALS.filter(d => d.mechanism === 'JCM').length },
                      { name: 'Bilateral', value: BILATERAL_DEALS.filter(d => d.mechanism === 'bilateral').length },
                      { name: 'Art6.4', value: BILATERAL_DEALS.filter(d => d.mechanism === 'Art6.4').length },
                    ]} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name"
                      label={({ name, value }) => `${name}: ${value}`}>
                      {[T.indigo, T.green, T.gold, T.amber].map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                {sectionTitle('Deal Value by Volume x Price (Top 15)')}
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={dealValueComposed}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="label" tick={{ fontSize: 8 }} angle={-30} textAnchor="end" height={50} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="volume" fill={T.indigo} name="Volume (Mt)" radius={[3, 3, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="price" stroke={T.red} strokeWidth={2} name="Price ($/t)" dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
           TAB 2 — ITMO Pricing Intelligence
           ═══════════════════════════════════════ */}
        {tab === 2 && (
          <div style={{ paddingTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, background: T.card, padding: 14, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <label style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>Carbon Tax Impact Slider ($/tCO2):</label>
              <input type="range" min={0} max={100} value={carbonTaxSlider} onChange={e => setCarbonTaxSlider(+e.target.value)} style={{ flex: 1, maxWidth: 300, accentColor: T.indigo }} />
              <span style={{ fontFamily: mono, fontSize: 16, color: T.navy, fontWeight: 700, minWidth: 50 }}>${carbonTaxSlider}</span>
              <span style={{ fontSize: 11, color: T.sub }}>Estimated ITMO premium uplift: +{Math.round(carbonTaxSlider * 0.35)}%</span>
            </div>
            <div style={card}>
              {sectionTitle('ITMO Price Ranges by Project Type ($/tCO2)')}
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={ITMO_PRICING} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 45]} />
                  <YAxis dataKey="type" type="category" tick={{ fontSize: 9 }} width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="minPrice" fill={T.indigo + '50'} name="Min" stackId="a" />
                  <Bar dataKey="avgPrice" fill={T.green} name="Avg" />
                  <Bar dataKey="maxPrice" fill={T.red + '50'} name="Max" />
                  <ReferenceLine x={carbonTaxSlider} stroke={T.gold} strokeWidth={2} strokeDasharray="5 5" label={{ value: `Tax $${carbonTaxSlider}`, fontSize: 10, fill: T.gold }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                {sectionTitle('12-Month Price Trend (Selected Types)')}
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={itmoMonthlyPrices}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 'auto']} />
                    <Tooltip />
                    <Legend />
                    {ITMO_PRICING.slice(0, 6).map((p, i) => (
                      <Line key={p.type} type="monotone" dataKey={p.type.split(' ')[0]} stroke={COLORS[i]} strokeWidth={2} dot={{ r: 2 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                {sectionTitle('Liquidity vs Price Scatter')}
                <ResponsiveContainer width="100%" height={240}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="liquidityScore" name="Liquidity" tick={{ fontSize: 10 }} label={{ value: 'Liquidity Score', position: 'bottom', fontSize: 10 }} />
                    <YAxis dataKey="avgPrice" name="Avg Price" tick={{ fontSize: 10 }} label={{ value: '$/tCO2', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(val, name) => [name === 'Avg Price' ? `$${val}` : val, name]} />
                    <Scatter data={ITMO_PRICING} fill={T.indigo}>
                      {ITMO_PRICING.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={card}>
              {sectionTitle('Forward Price Estimate with Carbon Tax Impact')}
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ITMO_PRICING.map(p => ({
                  type: p.type.length > 20 ? p.type.substring(0, 18) + '..' : p.type,
                  current: p.avgPrice,
                  withTax: +(p.avgPrice * (1 + carbonTaxSlider * 0.0035)).toFixed(1),
                  vcmDiscount: +(p.avgPrice * 0.65).toFixed(1),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize: 8 }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" fill={T.indigo} name="Current ITMO" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="withTax" fill={T.green} name={`With $${carbonTaxSlider} Tax`} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="vcmDiscount" fill={T.sub + '60'} name="VCM Equivalent" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
           TAB 3 — Corresponding Adjustments Deep-Dive
           ═══════════════════════════════════════ */}
        {tab === 3 && (
          <div style={{ paddingTop: 20 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: T.sub, lineHeight: '28px' }}>CA Readiness:</span>
              {['All', 'ready', 'partial', 'not ready'].map(f => (
                <button key={f} onClick={() => setCaReadinessFilter(f === 'not ready' ? 'no' : f)} style={{
                  padding: '4px 12px', borderRadius: 14, border: `1px solid ${caReadinessFilter === (f === 'not ready' ? 'no' : f) ? T.indigo : T.border}`,
                  background: caReadinessFilter === (f === 'not ready' ? 'no' : f) ? T.indigo + '18' : T.card, color: caReadinessFilter === (f === 'not ready' ? 'no' : f) ? T.indigo : T.sub,
                  cursor: 'pointer', fontSize: 11, fontWeight: 600, textTransform: 'capitalize'
                }}>{f === 'All' ? 'All Countries' : f}</button>
              ))}
            </div>
            <div style={card}>
              {sectionTitle(`CA Readiness Status (${filteredCA.length} countries)`)}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  {tableHeader(['Country', 'Region', 'CA Framework', 'Credits (Mt)', 'Projects', 'NDC Target', 'NDC Gap', 'Art6 Ready', 'Domestic ETS', 'Carbon Tax'])}
                  <tbody>
                    {filteredCA.map((c, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                        {tCell(c.country, { bold: true })}
                        {tCell(c.region)}
                        <td style={{ padding: '7px 8px' }}>
                          <span style={badge(c.caFramework === 'yes' ? T.green : c.caFramework === 'partial' ? T.amber : T.red)}>{c.caFramework}</span>
                        </td>
                        {tCell(c.creditVolume.toFixed(1), { mono: true })}
                        {tCell(c.registeredProjects, { mono: true })}
                        {tCell(`${c.ndcTarget}%`, { mono: true })}
                        {tCell(`${c.ndcGap}%`, { mono: true, color: T.red })}
                        <td style={{ padding: '7px 8px' }}>
                          <span style={badge(c.article6Ready ? T.green : T.red)}>{c.article6Ready ? 'Yes' : 'No'}</span>
                        </td>
                        <td style={{ padding: '7px 8px' }}>
                          <span style={badge(c.domesticEts ? T.green : T.sub)}>{c.domesticEts ? 'Yes' : 'No'}</span>
                        </td>
                        <td style={{ padding: '7px 8px' }}>
                          <span style={badge(c.carbonTax ? T.green : T.sub)}>{c.carbonTax ? 'Yes' : 'No'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                {sectionTitle('CA Framework Comparison (Selected Countries)')}
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={[
                    { dimension: 'Legal Framework', ...Object.fromEntries(CA_STATUS.filter(c => c.caFramework === 'yes').slice(0, 4).map(c => [c.country, Math.round(50 + sr(c.country.length * 7) * 50)])) },
                    { dimension: 'Registry System', ...Object.fromEntries(CA_STATUS.filter(c => c.caFramework === 'yes').slice(0, 4).map(c => [c.country, Math.round(40 + sr(c.country.length * 11) * 55)])) },
                    { dimension: 'MRV Capacity', ...Object.fromEntries(CA_STATUS.filter(c => c.caFramework === 'yes').slice(0, 4).map(c => [c.country, Math.round(30 + sr(c.country.length * 13) * 60)])) },
                    { dimension: 'NDC Accounting', ...Object.fromEntries(CA_STATUS.filter(c => c.caFramework === 'yes').slice(0, 4).map(c => [c.country, Math.round(45 + sr(c.country.length * 17) * 50)])) },
                    { dimension: 'Stakeholder Buy-in', ...Object.fromEntries(CA_STATUS.filter(c => c.caFramework === 'yes').slice(0, 4).map(c => [c.country, Math.round(35 + sr(c.country.length * 19) * 55)])) },
                  ]}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 9 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    {CA_STATUS.filter(c => c.caFramework === 'yes').slice(0, 4).map((c, ci) => (
                      <Radar key={c.country} name={c.country} dataKey={c.country} stroke={COLORS[ci]} fill={COLORS[ci]} fillOpacity={0.15} />
                    ))}
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                {sectionTitle('CA Implementation Timeline (Years to Full CA)')}
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={CA_STATUS.map(c => ({
                    country: c.country,
                    yearsToCA: c.caFramework === 'yes' ? 0 : c.caFramework === 'partial' ? Math.round(1 + sr(c.country.length * 23) * 3) : Math.round(3 + sr(c.country.length * 29) * 5),
                  }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 8]} label={{ value: 'Years to Full CA', position: 'bottom', fontSize: 10 }} />
                    <YAxis dataKey="country" type="category" tick={{ fontSize: 9 }} width={90} />
                    <Tooltip />
                    <Bar dataKey="yearsToCA" name="Years to Full CA" radius={[0, 4, 4, 0]}>
                      {CA_STATUS.map((c, i) => <Cell key={i} fill={c.caFramework === 'yes' ? T.green : c.caFramework === 'partial' ? T.amber : T.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={card}>
              {sectionTitle('Double-Counting Risk Matrix (Region x Framework Status)')}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  {tableHeader(['Region', 'Full CA', 'Partial CA', 'No CA', 'Avg Risk Score'])}
                  <tbody>
                    {['Africa', 'Asia', 'LatAm', 'Pacific', 'MENA'].map((r, ri) => {
                      const full = CA_STATUS.filter(c => c.region === r && c.caFramework === 'yes').length;
                      const partial = CA_STATUS.filter(c => c.region === r && c.caFramework === 'partial').length;
                      const none = CA_STATUS.filter(c => c.region === r && c.caFramework === 'no').length;
                      const total = full + partial + none;
                      const riskScore = total > 0 ? Math.round((none * 90 + partial * 50 + full * 10) / total) : 50;
                      return (
                        <tr key={r} style={{ borderBottom: `1px solid ${T.border}` }}>
                          {tCell(r, { bold: true })}
                          {tCell(full, { mono: true, color: T.green })}
                          {tCell(partial, { mono: true, color: T.amber })}
                          {tCell(none, { mono: true, color: T.red })}
                          <td style={{ padding: '7px 8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ background: T.border, borderRadius: 4, height: 8, width: 60 }}>
                                <div style={{ background: riskScore > 60 ? T.red : riskScore > 35 ? T.amber : T.green, borderRadius: 4, height: 8, width: `${riskScore}%` }} />
                              </div>
                              <span style={{ fontFamily: mono, fontSize: 10, color: riskScore > 60 ? T.red : riskScore > 35 ? T.amber : T.green }}>{riskScore}/100</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
           TAB 4 — NDC Gap & Offset Demand
           ═══════════════════════════════════════ */}
        {tab === 4 && (
          <div style={{ paddingTop: 20 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: T.sub, lineHeight: '28px' }}>Ambition Level:</span>
              {['unconditional', 'conditional'].map(f => (
                <button key={f} onClick={() => setNdcAmbitionToggle(f)} style={{
                  padding: '5px 14px', borderRadius: 14, border: `1px solid ${ndcAmbitionToggle === f ? T.indigo : T.border}`,
                  background: ndcAmbitionToggle === f ? T.indigo + '18' : T.card, color: ndcAmbitionToggle === f ? T.indigo : T.sub,
                  cursor: 'pointer', fontSize: 11, fontWeight: 600, textTransform: 'capitalize'
                }}>{f} Targets</button>
              ))}
            </div>
            <div style={card}>
              {sectionTitle(`NDC Gap Waterfall — ${ndcAmbitionToggle === 'unconditional' ? 'Unconditional' : 'Conditional'} Targets`)}
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={NDC_GAP_ANALYSIS.map(c => ({
                  country: c.country,
                  target: ndcAmbitionToggle === 'unconditional' ? c.unconditionalTarget : c.conditionalTarget,
                  achieved: c.currentTrajectory,
                  gap: (ndcAmbitionToggle === 'unconditional' ? c.unconditionalTarget : c.conditionalTarget) - c.currentTrajectory,
                  offset: c.offsetPotential,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="achieved" stackId="a" fill={T.green} name="Achieved (%)" />
                  <Bar dataKey="gap" stackId="a" fill={T.red + '70'} name="Remaining Gap (%)" />
                  <Bar dataKey="offset" fill={T.indigo + '50'} name="Offset Potential (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                {sectionTitle('Financing Need vs Available Carbon Finance ($B)')}
                <ResponsiveContainer width="100%" height={240}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="financingNeed" name="Financing Need ($B)" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="offsetPotential" name="Offset Potential (MtCO2)" tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(val, name) => [name.includes('$') ? `$${val}B` : `${val} Mt`, name]} />
                    <Scatter data={NDC_GAP_ANALYSIS} fill={T.indigo}>
                      {NDC_GAP_ANALYSIS.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                {sectionTitle('Supply-Demand Balance by Region')}
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={['Africa', 'Asia', 'LatAm', 'Pacific', 'MENA'].map((r, ri) => ({
                    region: r,
                    demand: Math.round(80 + sr(ri * 41) * 120),
                    supply: Math.round(40 + sr(ri * 53) * 100),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="demand" fill={T.red + '70'} name="Demand (MtCO2)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="supply" fill={T.green} name="Supply (MtCO2)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
           TAB 5 — Africa Carbon Markets Initiative
           ═══════════════════════════════════════ */}
        {tab === 5 && (
          <div style={{ paddingTop: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {kpiBox('2030 Credit Target', '300M/yr', T.green)}
              {kpiBox('2035 Revenue Target', '$30B/yr', T.gold)}
              {kpiBox('Current Pipeline', '180 projects', '#2563eb')}
              {kpiBox('Sector Coverage', '8 sectors', T.indigo)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                {sectionTitle('ACMI 2024-2035 Credit Projections')}
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={ACMI_DATA.targets}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="credits" fill={T.green} stroke={T.green} fillOpacity={0.3} name="Credits (MtCO2)" />
                    <Area type="monotone" dataKey="revenue" fill={T.gold} stroke={T.gold} fillOpacity={0.3} name="Revenue ($B)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                {sectionTitle('Sector Breakdown (2030 Target)')}
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={ACMI_DATA.sectors}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="share" name="Share (%)" radius={[4, 4, 0, 0]}>
                      {ACMI_DATA.sectors.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {ACMI_DATA.countrySpotlights.map(c => (
                <div key={c.country} style={card}>
                  <div style={{ fontWeight: 700, color: T.navy, fontSize: 14, marginBottom: 8 }}>{c.country}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>2024 Credits: <span style={{ fontFamily: mono, color: T.green }}>{c.credits2024} Mt</span></div>
                  <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>Pipeline: <span style={{ fontFamily: mono, color: T.indigo }}>{c.pipeline} projects</span></div>
                  <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>Avg Price: <span style={{ fontFamily: mono, color: T.gold }}>${c.avgPrice}/t</span></div>
                  <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>Lead Sector: <span style={{ fontWeight: 600 }}>{c.flagSector}</span></div>
                  <div style={{ fontSize: 11, color: T.sub }}>Governance: <span style={{ fontFamily: mono, color: c.governanceScore >= 3.5 ? T.green : T.amber }}>{c.governanceScore}/5</span></div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                {sectionTitle('Financing Pipeline by Source ($B)')}
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={ACMI_DATA.financingPipeline} cx="50%" cy="50%" outerRadius={80} dataKey="amount" nameKey="source"
                      label={({ source, amount }) => `${source}: $${amount}B`}>
                      {ACMI_DATA.financingPipeline.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                {sectionTitle('ACMI Milestone Tracker')}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  {tableHeader(['Milestone', 'Target Date', 'Status', 'Progress'])}
                  <tbody>
                    {[
                      { milestone: 'Governance Framework Adopted', date: '2024 Q2', status: 'Complete', pct: 100 },
                      { milestone: '10 Country Partnerships Signed', date: '2024 Q4', status: 'On Track', pct: 80 },
                      { milestone: '50M Credits Pipeline', date: '2025 Q2', status: 'On Track', pct: 65 },
                      { milestone: 'Standardized MRV Protocol', date: '2025 Q4', status: 'In Progress', pct: 40 },
                      { milestone: 'Regional Registry Launched', date: '2026 Q2', status: 'Planned', pct: 15 },
                      { milestone: 'First ITMO Transfer Under ACMI', date: '2026 Q4', status: 'Planned', pct: 5 },
                      { milestone: '300M Annual Credit Target', date: '2030', status: 'Long-term', pct: 8 },
                    ].map((m, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                        {tCell(m.milestone, { bold: true })}
                        {tCell(m.date, { mono: true })}
                        <td style={{ padding: '7px 8px' }}>
                          <span style={badge(m.status === 'Complete' ? T.green : m.status === 'On Track' ? '#2563eb' : m.status === 'In Progress' ? T.amber : T.sub)}>{m.status}</span>
                        </td>
                        <td style={{ padding: '7px 8px' }}>
                          <div style={{ background: T.border, borderRadius: 4, height: 8, width: 80 }}>
                            <div style={{ background: m.pct >= 80 ? T.green : m.pct >= 40 ? T.amber : T.sub, borderRadius: 4, height: 8, width: `${m.pct}%` }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
           TAB 6 — JCM & Bilateral Programs
           ═══════════════════════════════════════ */}
        {tab === 6 && (
          <div style={{ paddingTop: 20 }}>
            <div style={card}>
              {sectionTitle(`Joint Crediting Mechanism Projects (${JCM_PROJECTS.length})`)}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                {tableHeader(['Project', 'Host Country', 'Partner', 'Sector', 'Credits (Mt)', 'Methodology', 'Status'])}
                <tbody>
                  {JCM_PROJECTS.map((p, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      {tCell(p.project, { bold: true })}
                      {tCell(p.hostCountry)}
                      {tCell(p.partnerCountry)}
                      {tCell(p.sector)}
                      {tCell(p.credits.toFixed(1), { mono: true })}
                      {tCell(p.methodology, { mono: true, style: { fontSize: 10 } })}
                      <td style={{ padding: '7px 8px' }}>
                        <span style={badge(p.status === 'Issuing' ? T.green : p.status === 'Registered' ? '#2563eb' : T.amber)}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                {sectionTitle('JCM Credits by Host Country')}
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={(() => {
                    const map = {};
                    JCM_PROJECTS.forEach(p => { map[p.hostCountry] = (map[p.hostCountry] || 0) + p.credits; });
                    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([c, v]) => ({ country: c, credits: +v.toFixed(1) }));
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="country" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={45} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="credits" fill={T.green} name="Credits (Mt)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                {sectionTitle('Project Pipeline by Status')}
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={[
                      { name: 'Pipeline', value: JCM_PROJECTS.filter(p => p.status === 'Pipeline').length },
                      { name: 'Registered', value: JCM_PROJECTS.filter(p => p.status === 'Registered').length },
                      { name: 'Issuing', value: JCM_PROJECTS.filter(p => p.status === 'Issuing').length },
                    ]} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name"
                      label={({ name, value }) => `${name}: ${value}`}>
                      {[T.amber, '#2563eb', T.green].map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={card}>
              {sectionTitle('Mechanism Comparison: JCM vs Art 6.2 vs Art 6.4')}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                {tableHeader(['Feature', 'JCM (Japan)', 'Article 6.2', 'Article 6.4'])}
                <tbody>
                  {[
                    { feature: 'Governance', jcm: 'Bilateral committee', a62: 'Bilateral agreement', a64: 'UN Supervisory Body' },
                    { feature: 'Host Country Approval', jcm: 'Required', a62: 'Required + CA', a64: 'Required + CA' },
                    { feature: 'Methodology', jcm: 'JCM-specific', a62: 'Flexible/bilateral', a64: 'Centralized/standardized' },
                    { feature: 'Registry', jcm: 'JCM Registry', a62: 'National registries', a64: 'International registry' },
                    { feature: 'Share of Proceeds', jcm: 'None', a62: 'None', a64: '5% to Adaptation Fund' },
                    { feature: 'OMGE', jcm: 'Voluntary', a62: 'Voluntary', a64: '2% mandatory cancellation' },
                    { feature: 'Active Projects', jcm: String(JCM_PROJECTS.length), a62: String(BILATERAL_DEALS.filter(d => d.mechanism === 'Art6.2').length), a64: String(BILATERAL_DEALS.filter(d => d.mechanism === 'Art6.4').length) },
                  ].map((r, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      {tCell(r.feature, { bold: true })}
                      {tCell(r.jcm)}
                      {tCell(r.a62)}
                      {tCell(r.a64)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={card}>
              {sectionTitle('Credit Issuance Forecast by Year')}
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr, yi) => ({
                  year: yr,
                  JCM: +(2 + yi * 1.8 + sr(yi * 17) * 2).toFixed(1),
                  'Art6.2': +(3 + yi * 2.5 + sr(yi * 23) * 3).toFixed(1),
                  'Art6.4': +(0.5 + yi * 1.2 + sr(yi * 31) * 1.5).toFixed(1),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="JCM" stroke={T.green} strokeWidth={2} />
                  <Line type="monotone" dataKey="Art6.2" stroke={T.indigo} strokeWidth={2} />
                  <Line type="monotone" dataKey="Art6.4" stroke={T.gold} strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
           TAB 7 — MRV & Integrity Challenges
           ═══════════════════════════════════════ */}
        {tab === 7 && (
          <div style={{ paddingTop: 20 }}>
            <div style={{ background: T.card, padding: 16, borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: T.navy, fontSize: 14, marginBottom: 10 }}>Integrity Scoring Model</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { label: 'Satellite Coverage', key: 'satellite', color: T.indigo },
                  { label: 'Ground Truth Verification', key: 'groundTruth', color: T.green },
                  { label: 'Third-Party Audit', key: 'audit', color: T.gold },
                ].map(s => (
                  <div key={s.key}>
                    <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{s.label}: <span style={{ fontFamily: mono, color: s.color, fontWeight: 700 }}>{integritySliders[s.key]}%</span></div>
                    <input type="range" min={0} max={100} value={integritySliders[s.key]}
                      onChange={e => setIntegritySliders(prev => ({ ...prev, [s.key]: +e.target.value }))}
                      style={{ width: '100%', accentColor: s.color }} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: integrityScore >= 60 ? T.green : integrityScore >= 40 ? T.amber : T.red }}>
                Composite Integrity Score: <span style={{ fontFamily: mono, fontSize: 20 }}>{integrityScore}/100</span>
                <span style={{ marginLeft: 12, fontSize: 11, fontWeight: 400 }}>
                  ({integrityScore >= 70 ? 'High Integrity' : integrityScore >= 50 ? 'Moderate Integrity' : integrityScore >= 30 ? 'Low Integrity' : 'Insufficient'})
                </span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {MRV_CHALLENGES.map((c, i) => (
                <div key={i} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: T.navy, fontSize: 13 }}>{c.category}</div>
                    <span style={badge(c.severity === 'Critical' ? T.red : c.severity === 'High' ? T.amber : T.green)}>{c.severity}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>Region: {c.region}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>Mitigation: <span style={badge(c.mitigationStatus === 'Active' ? T.green : c.mitigationStatus === 'Pilot Phase' ? '#2563eb' : T.amber)}>{c.mitigationStatus}</span></div>
                  <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>Technology: {c.technologySolution}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>Est. Cost: <span style={{ fontFamily: mono, color: T.gold }}>${c.costEstimate}M</span></div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                {sectionTitle('Technology Solutions Coverage (Radar)')}
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={MRV_CHALLENGES.slice(0, 8).map(c => ({
                    category: c.category.length > 15 ? c.category.substring(0, 13) + '..' : c.category,
                    coverage: Math.round(20 + sr(c.category.length * 7) * 70),
                    cost: Math.round(c.costEstimate * 20),
                  }))}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 8 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar name="Coverage (%)" dataKey="coverage" stroke={T.indigo} fill={T.indigo} fillOpacity={0.3} />
                    <Radar name="Relative Cost" dataKey="cost" stroke={T.red} fill={T.red} fillOpacity={0.15} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                {sectionTitle('Cost of MRV by Method ($M)')}
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={MRV_CHALLENGES.map(c => ({ category: c.category.length > 18 ? c.category.substring(0, 16) + '..' : c.category, cost: c.costEstimate }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 8 }} width={130} />
                    <Tooltip />
                    <Bar dataKey="cost" name="Cost ($M)" radius={[0, 4, 4, 0]}>
                      {MRV_CHALLENGES.map((c, i) => <Cell key={i} fill={c.severity === 'Critical' ? T.red : c.severity === 'High' ? T.amber : T.green} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={card}>
              {sectionTitle('Fraud Risk Matrix (Methodology x Region)')}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr style={{ background: T.surface }}>
                    <th style={{ padding: '7px 8px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.sub, fontSize: 10 }}>Methodology</th>
                    {['Africa', 'Asia', 'LatAm', 'Pacific', 'MENA'].map(r => (
                      <th key={r} style={{ padding: '7px 8px', textAlign: 'center', borderBottom: `1px solid ${T.border}`, color: T.sub, fontSize: 10 }}>{r}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {['REDD+', 'Clean Cooking', 'Renewable Energy', 'Soil Carbon', 'Methane', 'Blue Carbon'].map((m, mi) => (
                      <tr key={m} style={{ borderBottom: `1px solid ${T.border}` }}>
                        {tCell(m, { bold: true })}
                        {['Africa', 'Asia', 'LatAm', 'Pacific', 'MENA'].map((r, ri) => {
                          const risk = Math.round(15 + sr(mi * 11 + ri * 7) * 70);
                          return (
                            <td key={r} style={{ padding: '7px 8px', textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-block', width: 28, height: 28, lineHeight: '28px', borderRadius: 6,
                                fontSize: 10, fontWeight: 700, fontFamily: mono,
                                background: risk > 65 ? T.red + '20' : risk > 40 ? T.amber + '20' : T.green + '20',
                                color: risk > 65 ? T.red : risk > 40 ? T.amber : T.green,
                              }}>{risk}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 10, color: T.sub, marginTop: 8 }}>Scale: 0-30 Low Risk | 31-65 Medium Risk | 66-100 High Risk</div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
           TAB 8 — EM Country Profiles
           ═══════════════════════════════════════ */}
        {tab === 8 && (
          <div style={{ paddingTop: 20 }}>
            <div style={card}>
              {sectionTitle(`EM Country Profiles (${EM_COUNTRY_PROFILES.length} countries) — click row to expand`)}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr style={{ background: T.surface }}>
                    {['Country', 'Region', 'NDC Target', 'Emissions (Mt)', 'Reduction %', 'Pipeline (Mt)', 'Policy (1-5)', 'Inv. Grade', 'Rating', 'Deforest. %', 'RE Cap (MW)'].map(h => (
                      <th key={h} onClick={() => {
                        const keyMap = { 'Country': 'country', 'Region': 'region', 'NDC Target': 'ndcTarget2030', 'Emissions (Mt)': 'currentEmissions', 'Reduction %': 'reductionAchieved', 'Pipeline (Mt)': 'creditPipeline', 'Policy (1-5)': 'policyMaturity', 'Rating': 'sovereignRating', 'Deforest. %': 'deforestationRate', 'RE Cap (MW)': 'renewableCapacity' };
                        if (keyMap[h]) toggleCountrySort(keyMap[h]);
                      }} style={{ padding: '7px 8px', textAlign: 'left', borderBottom: `1px solid ${T.border}`, color: T.sub, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {sortedCountries.map((c, i) => (
                      <React.Fragment key={i}>
                        <tr onClick={() => setExpandedCountry(expandedCountry === c.country ? null : c.country)}
                          style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: expandedCountry === c.country ? T.indigo + '08' : 'transparent' }}>
                          {tCell(c.country, { bold: true })}
                          {tCell(c.region)}
                          {tCell(`${c.ndcTarget2030}%`, { mono: true })}
                          {tCell(c.currentEmissions, { mono: true })}
                          {tCell(`${c.reductionAchieved}%`, { mono: true, color: c.reductionAchieved > 15 ? T.green : T.amber })}
                          {tCell(`${c.creditPipeline}`, { mono: true })}
                          {tCell(c.policyMaturity, { mono: true, color: c.policyMaturity >= 4 ? T.green : c.policyMaturity >= 2 ? T.amber : T.red })}
                          <td style={{ padding: '7px 8px' }}>
                            <span style={badge(c.investmentGrade ? T.green : T.red)}>{c.investmentGrade ? 'Yes' : 'No'}</span>
                          </td>
                          {tCell(c.sovereignRating, { mono: true })}
                          {tCell(`${c.deforestationRate}%`, { mono: true, color: c.deforestationRate > 2 ? T.red : T.green })}
                          {tCell(c.renewableCapacity.toLocaleString(), { mono: true })}
                        </tr>
                        {expandedCountry === c.country && (
                          <tr><td colSpan={11} style={{ padding: '12px 16px', background: T.surface, borderBottom: `1px solid ${T.border}` }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                              <div>
                                <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>{c.country} — Policy & NDC Summary</div>
                                <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.8 }}>
                                  NDC 2030 Target: <span style={{ fontFamily: mono, fontWeight: 600 }}>{c.ndcTarget2030}%</span> reduction from BAU<br />
                                  Current Emissions: <span style={{ fontFamily: mono }}>{c.currentEmissions} MtCO2e/yr</span><br />
                                  Reduction Achieved: <span style={{ fontFamily: mono, color: T.green }}>{c.reductionAchieved}%</span><br />
                                  Credit Pipeline: <span style={{ fontFamily: mono }}>{c.creditPipeline} MtCO2</span><br />
                                  Sovereign Rating: <span style={{ fontFamily: mono }}>{c.sovereignRating}</span> | Deforestation: <span style={{ fontFamily: mono }}>{c.deforestationRate}%/yr</span>
                                </div>
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: T.navy, marginBottom: 8 }}>Investment Climate Radar</div>
                                <ResponsiveContainer width="100%" height={180}>
                                  <RadarChart data={[
                                    { dim: 'Policy', val: c.policyMaturity * 20 },
                                    { dim: 'MRV', val: Math.round(30 + sr(c.country.length * 11) * 50) },
                                    { dim: 'Finance', val: c.investmentGrade ? 70 : 35 },
                                    { dim: 'Registry', val: Math.round(20 + sr(c.country.length * 13) * 60) },
                                    { dim: 'Demand', val: Math.round(40 + sr(c.country.length * 17) * 50) },
                                  ]}>
                                    <PolarGrid stroke={T.border} />
                                    <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                                    <Radar dataKey="val" stroke={T.indigo} fill={T.indigo} fillOpacity={0.3} />
                                    <Tooltip />
                                  </RadarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </td></tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
           TAB 9 — Investment & Blended Finance
           ═══════════════════════════════════════ */}
        {tab === 9 && (
          <div style={{ paddingTop: 20 }}>
            <div style={{ background: T.card, padding: 16, borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <label style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>Governance Score (Political Risk Premium Calculator):</label>
                <input type="range" min={1} max={5} step={0.1} value={governanceSlider} onChange={e => setGovernanceSlider(+e.target.value)} style={{ flex: 1, maxWidth: 300, accentColor: T.indigo }} />
                <span style={{ fontFamily: mono, fontSize: 16, color: T.navy, fontWeight: 700 }}>{governanceSlider.toFixed(1)}/5</span>
                <span style={{ fontSize: 12, color: T.red, fontWeight: 600, fontFamily: mono }}>Risk Premium: +{politicalRiskPremium}%</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={card}>
                {sectionTitle('Investment Landscape Split')}
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={[
                      { name: 'Concessional', value: 35 },
                      { name: 'Commercial', value: 42 },
                      { name: 'Philanthropic', value: 12 },
                      { name: 'Blended', value: 11 },
                    ]} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {[T.green, T.indigo, T.gold, T.amber].map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                {sectionTitle('Risk-Return by EM Region')}
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="risk" name="Risk Score" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="ret" name="Expected Return (%)" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Scatter data={[
                      { region: 'Africa', risk: 72, ret: 11.5 },
                      { region: 'SE Asia', risk: 55, ret: 8.2 },
                      { region: 'LatAm', risk: 60, ret: 9.1 },
                      { region: 'Pacific', risk: 68, ret: 10.8 },
                      { region: 'MENA', risk: 50, ret: 7.5 },
                    ]} fill={T.indigo}>
                      {[T.green, T.indigo, T.gold, T.amber, T.red].map((c, i) => <Cell key={i} fill={c} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                {sectionTitle('Currency Risk Overlay')}
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    { region: 'Africa', fxVol: 18.5, hedgeCost: 4.2 },
                    { region: 'SE Asia', fxVol: 11.2, hedgeCost: 2.1 },
                    { region: 'LatAm', fxVol: 14.8, hedgeCost: 3.5 },
                    { region: 'Pacific', fxVol: 8.5, hedgeCost: 1.8 },
                    { region: 'MENA', fxVol: 6.2, hedgeCost: 1.2 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="fxVol" fill={T.red + '70'} name="FX Volatility (%)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="hedgeCost" fill={T.indigo} name="Hedge Cost (%)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={card}>
              {sectionTitle(`Blended Finance Deal Tracker (${BLENDED_FINANCE_DEALS.length} deals)`)}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  {tableHeader(['Deal', 'Type', 'Size ($M)', 'Concess. %', 'Commercial %', 'Philanth. %', 'Region', 'Expected IRR', 'Tenor (yr)', 'Rating'])}
                  <tbody>
                    {BLENDED_FINANCE_DEALS.map((d, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                        {tCell(d.deal, { bold: true })}
                        {tCell(d.type)}
                        {tCell(`$${d.totalSize}M`, { mono: true })}
                        {tCell(`${d.concessional}%`, { mono: true })}
                        {tCell(`${d.commercial}%`, { mono: true })}
                        {tCell(`${d.philanthropic}%`, { mono: true })}
                        {tCell(d.region)}
                        {tCell(`${d.expectedIRR}%`, { mono: true, color: d.expectedIRR > 8 ? T.green : T.amber })}
                        {tCell(`${d.tenorYears}yr`, { mono: true })}
                        {tCell(d.creditRating, { mono: true })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                {sectionTitle('Deal Size Distribution by Region')}
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={['Africa', 'Asia', 'LatAm', 'Pacific', 'MENA'].map((r, ri) => ({
                    region: r,
                    small: Math.round(3 + sr(ri * 51) * 8),
                    medium: Math.round(2 + sr(ri * 61) * 5),
                    large: Math.round(sr(ri * 71) * 3),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="small" stackId="a" fill={T.green} name="<$50M" />
                    <Bar dataKey="medium" stackId="a" fill={T.indigo} name="$50-150M" />
                    <Bar dataKey="large" stackId="a" fill={T.gold} name=">$150M" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={card}>
                {sectionTitle('Concessional Capital Mobilization Ratio')}
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={[2020, 2021, 2022, 2023, 2024, 2025].map((yr, yi) => ({
                    year: yr,
                    concessional: +(0.8 + yi * 0.4 + sr(yi * 33) * 0.3).toFixed(1),
                    mobilized: +(1.5 + yi * 1.2 + sr(yi * 43) * 0.8).toFixed(1),
                    ratio: +((1.5 + yi * 1.2) / Math.max(0.1, 0.8 + yi * 0.4)).toFixed(1),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="concessional" fill={T.green} name="Concessional ($B)" radius={[3, 3, 0, 0]} />
                    <Bar yAxisId="left" dataKey="mobilized" fill={T.indigo} name="Mobilized ($B)" radius={[3, 3, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="ratio" stroke={T.gold} strokeWidth={2} name="Mobilization Ratio" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={card}>
              {sectionTitle('IRR Sensitivity to Governance Score')}
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(g => ({
                  governance: g,
                  baseIRR: +(4 + g * 1.8).toFixed(1),
                  withPremium: +(4 + g * 1.8 + (5 - g) * 0.8 + sr(Math.round(g * 10)) * 1.5).toFixed(1),
                  riskAdjusted: +(2 + g * 2.2 - sr(Math.round(g * 13)) * 0.8).toFixed(1),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="governance" tick={{ fontSize: 10 }} label={{ value: 'Governance Score', position: 'bottom', fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: 'IRR (%)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="baseIRR" stroke={T.green} strokeWidth={2} name="Base IRR" />
                  <Line type="monotone" dataKey="withPremium" stroke={T.red} strokeWidth={2} name="With Risk Premium" />
                  <Line type="monotone" dataKey="riskAdjusted" stroke={T.indigo} strokeWidth={2} strokeDasharray="5 5" name="Risk-Adjusted" />
                  <ReferenceLine x={governanceSlider} stroke={T.gold} strokeWidth={2} label={{ value: 'Current', fontSize: 10, fill: T.gold }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default EmCarbonCreditHubPage;
