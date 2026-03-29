import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const TABS = [
  'Portfolio Overview',
  'CRREM Pathway Analysis',
  'Physical Risk Valuation',
  'Stranded Asset Timeline',
  'Agricultural & Timberland',
  'Climate Appraisal Engine',
];

// ── Portfolio data ─────────────────────────────────────────────────────────────
const PORTFOLIO = [
  // Commercial RE
  { id: 1, name: 'Canary Wharf Tower', type: 'Office', location: 'London, UK', gav: 420, epc: 'D', crrem: 'stranded', physRisk: 8.1, capRate: 5.8, noi: 22.1 },
  { id: 2, name: 'Broadgate EC2 Office', type: 'Office', location: 'London, UK', gav: 310, epc: 'E', crrem: 'stranded', physRisk: 7.4, capRate: 6.1, noi: 17.2 },
  { id: 3, name: 'Hudson Yards Tower', type: 'Office', location: 'New York, USA', gav: 380, epc: 'D', crrem: 'stranded', physRisk: 7.8, capRate: 5.9, noi: 20.4 },
  { id: 4, name: 'Rotterdam Waterfront', type: 'Office', location: 'Rotterdam, NL', gav: 185, epc: 'C', crrem: 'at-risk', physRisk: 6.2, capRate: 5.2, noi: 10.1 },
  { id: 5, name: 'Munich CBD Office', type: 'Office', location: 'Munich, DE', gav: 220, epc: 'B', crrem: 'aligned', physRisk: 3.4, capRate: 4.8, noi: 12.8 },
  { id: 6, name: 'Westfield London', type: 'Retail', location: 'London, UK', gav: 290, epc: 'C', crrem: 'at-risk', physRisk: 5.9, capRate: 6.4, noi: 16.3 },
  { id: 7, name: 'Trafford Centre', type: 'Retail', location: 'Manchester, UK', gav: 175, epc: 'D', crrem: 'at-risk', physRisk: 5.1, capRate: 6.8, noi: 9.8 },
  { id: 8, name: 'Coastal SC Miami', type: 'Retail', location: 'Miami, USA', gav: 145, epc: 'E', crrem: 'stranded', physRisk: 8.9, capRate: 7.2, noi: 7.6 },
  { id: 9, name: 'Hamburg Logistics Hub', type: 'Logistics', location: 'Hamburg, DE', gav: 160, epc: 'B', crrem: 'aligned', physRisk: 4.2, capRate: 4.6, noi: 9.2 },
  { id: 10, name: 'Tilbury Logistics Park', type: 'Logistics', location: 'Essex, UK', gav: 135, epc: 'C', crrem: 'aligned', physRisk: 4.8, capRate: 5.1, noi: 7.4 },
  { id: 11, name: 'Phoenix Industrial', type: 'Logistics', location: 'Phoenix, USA', gav: 98, epc: 'D', crrem: 'at-risk', physRisk: 6.6, capRate: 5.8, noi: 5.4 },
  { id: 12, name: 'Cannes Residences', type: 'Residential', location: 'Cannes, FR', gav: 112, epc: 'C', crrem: 'aligned', physRisk: 4.4, capRate: 4.2, noi: 5.8 },
  { id: 13, name: 'Berlin Mixed Resi', type: 'Residential', location: 'Berlin, DE', gav: 88, epc: 'B', crrem: 'aligned', physRisk: 2.8, capRate: 4.0, noi: 4.6 },
  { id: 14, name: 'Dubai Luxury Hotel', type: 'Hotel', location: 'Dubai, UAE', gav: 210, epc: 'E', crrem: 'at-risk', physRisk: 7.6, capRate: 7.5, noi: 12.4 },
  { id: 15, name: 'Edinburgh Boutique Hotel', type: 'Hotel', location: 'Edinburgh, UK', gav: 65, epc: 'C', crrem: 'aligned', physRisk: 3.1, capRate: 5.4, noi: 3.9 },
  // Farmland/Timberland
  { id: 16, name: 'Yorkshire Farmland A', type: 'Farmland', location: 'Yorkshire, UK', gav: 42, epc: 'N/A', crrem: 'N/A', physRisk: 3.8, capRate: 3.6, noi: 1.7 },
  { id: 17, name: 'Yorkshire Farmland B', type: 'Farmland', location: 'Yorkshire, UK', gav: 38, epc: 'N/A', crrem: 'N/A', physRisk: 3.6, capRate: 3.5, noi: 1.4 },
  { id: 18, name: 'Cerrado Soya Estate', type: 'Farmland', location: 'Bahia, BR', gav: 95, epc: 'N/A', crrem: 'N/A', physRisk: 7.2, capRate: 6.1, noi: 5.6 },
  { id: 19, name: 'Darling Downs Station', type: 'Farmland', location: 'Queensland, AU', gav: 58, epc: 'N/A', crrem: 'N/A', physRisk: 8.4, capRate: 4.8, noi: 2.8 },
  { id: 20, name: 'Illinois Corn Farm', type: 'Farmland', location: 'Illinois, USA', gav: 72, epc: 'N/A', crrem: 'N/A', physRisk: 4.1, capRate: 4.2, noi: 3.4 },
  { id: 21, name: 'Iowa Soya Farm', type: 'Farmland', location: 'Iowa, USA', gav: 68, epc: 'N/A', crrem: 'N/A', physRisk: 4.4, capRate: 4.0, noi: 3.1 },
  { id: 22, name: 'Waikato Dairy Farm', type: 'Farmland', location: 'Waikato, NZ', gav: 52, epc: 'N/A', crrem: 'N/A', physRisk: 3.9, capRate: 3.8, noi: 2.2 },
  { id: 23, name: 'Sumatra Palm Oil', type: 'Timberland', location: 'Sumatra, ID', gav: 84, epc: 'N/A', crrem: 'N/A', physRisk: 7.8, capRate: 6.8, noi: 5.2 },
  // Infrastructure-adjacent
  { id: 24, name: 'LDN Data Centre I', type: 'Data Centre', location: 'Slough, UK', gav: 195, epc: 'B', crrem: 'aligned', physRisk: 4.1, capRate: 4.4, noi: 11.8 },
  { id: 25, name: 'AMS Data Centre', type: 'Data Centre', location: 'Amsterdam, NL', gav: 180, epc: 'A', crrem: 'aligned', physRisk: 5.2, capRate: 4.2, noi: 10.8 },
  { id: 26, name: 'UK Self-Storage Portfolio', type: 'Self-Storage', location: 'Various, UK', gav: 88, epc: 'C', crrem: 'aligned', physRisk: 3.4, capRate: 5.6, noi: 5.4 },
  { id: 27, name: 'Tower Crown Portfolio', type: 'Cell Tower', location: 'Various, EU', gav: 145, epc: 'N/A', crrem: 'aligned', physRisk: 2.2, capRate: 4.8, noi: 8.2 },
  { id: 28, name: 'Nordic Cell Towers', type: 'Cell Tower', location: 'Nordics', gav: 118, epc: 'N/A', crrem: 'aligned', physRisk: 2.0, capRate: 4.6, noi: 6.6 },
];

const BY_TYPE = ['Office', 'Retail', 'Logistics', 'Residential', 'Hotel', 'Farmland', 'Timberland', 'Data Centre', 'Self-Storage', 'Cell Tower'];

function avgByType(field) {
  return BY_TYPE.map(t => {
    const assets = PORTFOLIO.filter(a => a.type === t);
    const avg = assets.length ? (assets.reduce((s, a) => s + a[field], 0) / assets.length).toFixed(2) : 0;
    return { type: t, value: parseFloat(avg) };
  }).filter(x => x.value > 0);
}

// ── CRREM data ─────────────────────────────────────────────────────────────────
const CRREM_ASSETS = [
  { id: 1, name: 'Canary Wharf Tower', type: 'Office', location: 'London, UK', intensity: 148, target15_2030: 40, target20_2030: 55, gap: +170, strandYear: 2031, greenCapex: 18, payback: 7, npv: 45 },
  { id: 2, name: 'Broadgate EC2', type: 'Office', location: 'London, UK', intensity: 162, target15_2030: 40, target20_2030: 55, gap: +195, strandYear: 2029, greenCapex: 22, payback: 8, npv: 52 },
  { id: 3, name: 'Hudson Yards Tower', type: 'Office', location: 'New York, USA', intensity: 155, target15_2030: 45, target20_2030: 62, gap: +150, strandYear: 2032, greenCapex: 20, payback: 7.5, npv: 48 },
  { id: 4, name: 'Rotterdam Waterfront', type: 'Office', location: 'Rotterdam, NL', intensity: 98, target15_2030: 38, target20_2030: 52, gap: +88, strandYear: 2036, greenCapex: 12, payback: 9, npv: 22 },
  { id: 5, name: 'Munich CBD Office', type: 'Office', location: 'Munich, DE', intensity: 52, target15_2030: 38, target20_2030: 52, gap: +2, strandYear: null, greenCapex: 4, payback: 12, npv: 8 },
  { id: 6, name: 'Westfield London', type: 'Retail', location: 'London, UK', intensity: 115, target15_2030: 50, target20_2030: 68, gap: +69, strandYear: 2034, greenCapex: 14, payback: 10, npv: 28 },
  { id: 7, name: 'Trafford Centre', type: 'Retail', location: 'Manchester, UK', intensity: 122, target15_2030: 50, target20_2030: 68, gap: +80, strandYear: 2033, greenCapex: 15, payback: 9, npv: 30 },
  { id: 8, name: 'Coastal SC Miami', type: 'Retail', location: 'Miami, USA', intensity: 138, target15_2030: 55, target20_2030: 72, gap: +92, strandYear: 2030, greenCapex: 18, payback: 7, npv: 38 },
  { id: 9, name: 'Hamburg Logistics', type: 'Logistics', location: 'Hamburg, DE', intensity: 45, target15_2030: 35, target20_2030: 48, gap: +6, strandYear: null, greenCapex: 3, payback: 14, npv: 5 },
  { id: 10, name: 'Tilbury Logistics', type: 'Logistics', location: 'Essex, UK', intensity: 58, target15_2030: 35, target20_2030: 48, gap: +21, strandYear: 2038, greenCapex: 6, payback: 11, npv: 10 },
  { id: 11, name: 'Phoenix Industrial', type: 'Logistics', location: 'Phoenix, USA', intensity: 88, target15_2030: 38, target20_2030: 52, gap: +70, strandYear: 2033, greenCapex: 10, payback: 8, npv: 20 },
  { id: 12, name: 'Cannes Residences', type: 'Residential', location: 'Cannes, FR', intensity: 62, target15_2030: 30, target20_2030: 45, gap: +38, strandYear: 2037, greenCapex: 8, payback: 12, npv: 14 },
  { id: 13, name: 'Berlin Mixed Resi', type: 'Residential', location: 'Berlin, DE', intensity: 38, target15_2030: 30, target20_2030: 45, gap: -5, strandYear: null, greenCapex: 2, payback: 18, npv: 4 },
  { id: 14, name: 'Dubai Luxury Hotel', type: 'Hotel', location: 'Dubai, UAE', intensity: 245, target15_2030: 85, target20_2030: 115, gap: +113, strandYear: 2030, greenCapex: 32, payback: 6, npv: 72 },
  { id: 15, name: 'Edinburgh Hotel', type: 'Hotel', location: 'Edinburgh, UK', intensity: 78, target15_2030: 55, target20_2030: 72, gap: +8, strandYear: null, greenCapex: 5, payback: 15, npv: 9 },
];

const CRREM_TRAJECTORIES = [
  { year: 2024, canary: 148, broadgate: 162, hudson: 155, munich: 52, dubai: 245, path15: 120, path20: 160 },
  { year: 2026, canary: 140, broadgate: 155, hudson: 148, munich: 50, dubai: 230, path15: 100, path20: 138 },
  { year: 2028, canary: 128, broadgate: 142, hudson: 136, munich: 48, dubai: 210, path15: 80, path20: 115 },
  { year: 2030, canary: 112, broadgate: 125, hudson: 118, munich: 45, dubai: 185, path15: 40, path20: 55 },
  { year: 2033, canary: 94, broadgate: 105, hudson: 98, munich: 41, dubai: 155, path15: 30, path20: 42 },
  { year: 2037, canary: 75, broadgate: 84, hudson: 78, munich: 36, dubai: 118, path15: 22, path20: 32 },
  { year: 2042, canary: 52, broadgate: 60, hudson: 55, munich: 28, dubai: 80, path15: 15, path20: 22 },
  { year: 2050, canary: 30, broadgate: 38, hudson: 32, munich: 18, dubai: 48, path15: 5, path20: 12 },
];

// ── Physical risk data ─────────────────────────────────────────────────────────
const PHYSICAL_RISK = [
  { name: 'Canary Wharf Tower', type: 'Office', baseNOI: 24.2, floodAdj: -4.2, heatAdj: -1.1, adjNOI: 18.9, baseCapRate: 5.0, climatePrem: 85, adjCapRate: 5.85, baseValue: 420, adjValue: 391, impact: -29, impactPct: -6.9 },
  { name: 'Broadgate EC2', type: 'Office', baseNOI: 18.8, floodAdj: -3.5, heatAdj: -0.9, adjNOI: 14.4, baseCapRate: 5.2, climatePrem: 90, adjCapRate: 6.1, baseValue: 310, adjValue: 285, impact: -25, impactPct: -8.1 },
  { name: 'Hudson Yards', type: 'Office', baseNOI: 22.4, floodAdj: -2.8, heatAdj: -1.4, adjNOI: 18.2, baseCapRate: 5.0, climatePrem: 80, adjCapRate: 5.8, baseValue: 380, adjValue: 357, impact: -23, impactPct: -6.1 },
  { name: 'Rotterdam Waterfront', type: 'Office', baseNOI: 11.0, floodAdj: -2.4, heatAdj: -0.5, adjNOI: 8.1, baseCapRate: 4.8, climatePrem: 55, adjCapRate: 5.35, baseValue: 185, adjValue: 174, impact: -11, impactPct: -5.9 },
  { name: 'Munich CBD', type: 'Office', baseNOI: 13.2, floodAdj: -0.4, heatAdj: -0.3, adjNOI: 12.5, baseCapRate: 4.5, climatePrem: 20, adjCapRate: 4.7, baseValue: 220, adjValue: 217, impact: -3, impactPct: -1.4 },
  { name: 'Westfield London', type: 'Retail', baseNOI: 18.0, floodAdj: -1.8, heatAdj: -1.1, adjNOI: 15.1, baseCapRate: 5.8, climatePrem: 70, adjCapRate: 6.5, baseValue: 290, adjValue: 264, impact: -26, impactPct: -9.0 },
  { name: 'Coastal SC Miami', type: 'Retail', baseNOI: 8.8, floodAdj: -3.1, heatAdj: -1.2, adjNOI: 4.5, baseCapRate: 6.5, climatePrem: 120, adjCapRate: 7.7, baseValue: 145, adjValue: 119, impact: -26, impactPct: -17.9 },
  { name: 'Hamburg Logistics', type: 'Logistics', baseNOI: 9.6, floodAdj: -0.6, heatAdj: -0.2, adjNOI: 8.8, baseCapRate: 4.4, climatePrem: 18, adjCapRate: 4.58, baseValue: 160, adjValue: 157, impact: -3, impactPct: -1.9 },
  { name: 'Phoenix Industrial', type: 'Logistics', baseNOI: 5.8, floodAdj: -0.2, heatAdj: -0.8, adjNOI: 4.8, baseCapRate: 5.5, climatePrem: 45, adjCapRate: 5.95, baseValue: 98, adjValue: 90, impact: -8, impactPct: -8.2 },
  { name: 'Dubai Luxury Hotel', type: 'Hotel', baseNOI: 13.8, floodAdj: -0.4, heatAdj: -2.2, adjNOI: 11.2, baseCapRate: 7.0, climatePrem: 95, adjCapRate: 7.95, baseValue: 210, adjValue: 188, impact: -22, impactPct: -10.5 },
];

const SCENARIO_IMPACT = [
  { scenario: 'SSP1-2.6 (Orderly)', office: -3.2, retail: -4.1, logistics: -1.4, residential: -1.0, hotel: -3.8 },
  { scenario: 'SSP2-4.5 (Intermediate)', office: -5.8, retail: -8.2, logistics: -3.1, residential: -2.1, hotel: -6.5 },
  { scenario: 'SSP5-8.5 (High Emissions)', office: -10.4, retail: -16.2, logistics: -5.8, residential: -4.4, hotel: -12.1 },
];

const VALUE_BY_TYPE = [
  { type: 'Coastal Retail', impact: -8.2 },
  { type: 'Office', impact: -5.4 },
  { type: 'Hotel', impact: -7.1 },
  { type: 'Logistics', impact: -3.1 },
  { type: 'Residential', impact: -2.1 },
  { type: 'Farmland', impact: -4.5 },
];

// ── Stranded asset timeline data ───────────────────────────────────────────────
const STRANDED_ASSETS = [
  { name: 'Canary Wharf Tower', type: 'Office', location: 'London', epc: 'D', ambitious: 2030, moderate: 2033, current: 2038, brownDiscount: -22 },
  { name: 'Broadgate EC2', type: 'Office', location: 'London', epc: 'E', ambitious: 2028, moderate: 2031, current: 2036, brownDiscount: -28 },
  { name: 'Hudson Yards', type: 'Office', location: 'New York', epc: 'D', ambitious: 2031, moderate: 2035, current: 2040, brownDiscount: -18 },
  { name: 'Rotterdam Waterfront', type: 'Office', location: 'Rotterdam', epc: 'C', ambitious: 2034, moderate: 2037, current: 2042, brownDiscount: -12 },
  { name: 'Den Haag Commercial', type: 'Office', location: 'The Hague', epc: 'D', ambitious: 2028, moderate: 2032, current: 2038, brownDiscount: -20 },
  { name: 'Westfield London', type: 'Retail', location: 'London', epc: 'C', ambitious: 2033, moderate: 2036, current: 2041, brownDiscount: -15 },
  { name: 'Coastal SC Miami', type: 'Retail', location: 'Miami', epc: 'E', ambitious: 2029, moderate: 2032, current: 2036, brownDiscount: -30 },
  { name: 'Trafford Centre', type: 'Retail', location: 'Manchester', epc: 'D', ambitious: 2032, moderate: 2035, current: 2039, brownDiscount: -19 },
  { name: 'Phoenix Industrial', type: 'Logistics', location: 'Phoenix', epc: 'D', ambitious: 2032, moderate: 2036, current: 2041, brownDiscount: -14 },
  { name: 'Dubai Luxury Hotel', type: 'Hotel', location: 'Dubai', epc: 'E', ambitious: 2030, moderate: 2033, current: 2037, brownDiscount: -25 },
];

// ── Agricultural data ──────────────────────────────────────────────────────────
const AG_ASSETS = [
  { id: 1, name: 'Yorkshire Farmland A', value: 42, commodity: 'Mixed arable', drought: 'Medium', flood: 'Low', temp: 'Low', pest: 'Medium', yield45: -4.2, yield85: -11.8, carbonVal: 180, eudr: 'N/A' },
  { id: 2, name: 'Yorkshire Farmland B', value: 38, commodity: 'Wheat/OSR', drought: 'Medium', flood: 'Medium', temp: 'Low', pest: 'Low', yield45: -3.8, yield85: -10.2, carbonVal: 165, eudr: 'N/A' },
  { id: 3, name: 'Cerrado Soya Estate', value: 95, commodity: 'Soybean', drought: 'High', flood: 'Low', temp: 'High', pest: 'High', yield45: -14.2, yield85: -34.8, carbonVal: 22, eudr: 'HIGH RISK' },
  { id: 4, name: 'Darling Downs Station', value: 58, commodity: 'Sheep/Beef', drought: 'High', flood: 'Low', temp: 'Critical', pest: 'Medium', yield45: -18.5, yield85: -42.1, carbonVal: 35, eudr: 'N/A' },
  { id: 5, name: 'Illinois Corn Farm', value: 72, commodity: 'Corn/Soya', drought: 'Medium', flood: 'Medium', temp: 'Medium', pest: 'Low', yield45: -6.8, yield85: -18.4, carbonVal: 48, eudr: 'N/A' },
  { id: 6, name: 'Iowa Soya Farm', value: 68, commodity: 'Soybean', drought: 'Medium', flood: 'High', temp: 'Low', pest: 'Low', yield45: -8.2, yield85: -20.6, carbonVal: 52, eudr: 'N/A' },
  { id: 7, name: 'Waikato Dairy Farm', value: 52, commodity: 'Dairy', drought: 'Low', flood: 'Medium', temp: 'Low', pest: 'Low', yield45: -5.1, yield85: -12.8, carbonVal: 95, eudr: 'N/A' },
  { id: 8, name: 'Sumatra Palm Oil', value: 84, commodity: 'Palm oil', drought: 'Medium', flood: 'High', temp: 'Medium', pest: 'High', yield45: -10.4, yield85: -24.2, carbonVal: 15, eudr: 'CRITICAL' },
];

const CROP_YIELD = [
  { year: 2024, yorkshire: 100, iowa: 100, illinois: 100 },
  { year: 2028, yorkshire: 98, iowa: 96, illinois: 97 },
  { year: 2032, yorkshire: 96, iowa: 92, illinois: 94 },
  { year: 2036, yorkshire: 94, iowa: 87, illinois: 90 },
  { year: 2040, yorkshire: 92, iowa: 82, illinois: 85 },
  { year: 2045, yorkshire: 90, iowa: 75, illinois: 79 },
  { year: 2050, yorkshire: 88, iowa: 68, illinois: 72 },
];

// ── DCF appraisal data ─────────────────────────────────────────────────────────
const DCF_YEARS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const DCF_NO_ACTION = [
  { year: 1, baseline: 2.42, climateAdj: 2.31 },
  { year: 2, baseline: 2.47, climateAdj: 2.24 },
  { year: 3, baseline: 2.52, climateAdj: 2.10 },
  { year: 4, baseline: 2.57, climateAdj: 1.98 },
  { year: 5, baseline: 2.62, climateAdj: 1.82 },
  { year: 6, baseline: 2.68, climateAdj: 1.68 },
  { year: 7, baseline: 2.73, climateAdj: 1.55 },
  { year: 8, baseline: 2.79, climateAdj: 1.44 },
  { year: 9, baseline: 2.85, climateAdj: 1.34 },
  { year: 10, baseline: 2.91, climateAdj: 1.22 },
];

const DCF_RETROFIT = [
  { year: 1, baseline: 2.42, climateAdj: 2.31 },
  { year: 2, baseline: 2.47, climateAdj: 2.35 },
  { year: 3, baseline: 2.52, climateAdj: 2.18 }, // CapEx year
  { year: 4, baseline: 2.57, climateAdj: 2.88 }, // post-retrofit uplift
  { year: 5, baseline: 2.62, climateAdj: 3.02 },
  { year: 6, baseline: 2.68, climateAdj: 3.18 },
  { year: 7, baseline: 2.73, climateAdj: 3.32 },
  { year: 8, baseline: 2.79, climateAdj: 3.44 },
  { year: 9, baseline: 2.85, climateAdj: 3.58 },
  { year: 10, baseline: 2.91, climateAdj: 3.72 },
];

const SENSITIVITY = [
  { carbonPrice: '£50/t', greenPremLow: '6.2%', greenPremBase: '7.4%', greenPremHigh: '8.6%' },
  { carbonPrice: '£100/t', greenPremLow: '6.8%', greenPremBase: '8.2%', greenPremHigh: '9.5%' },
  { carbonPrice: '£150/t', greenPremLow: '7.2%', greenPremBase: '8.8%', greenPremHigh: '10.1%' },
  { carbonPrice: '£200/t', greenPremLow: '7.6%', greenPremBase: '9.4%', greenPremHigh: '11.0%' },
];

// ── Reusable components ────────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, accent }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
    padding: '18px 20px', boxShadow: T.card, flex: 1, minWidth: 160,
    borderTop: `3px solid ${accent || T.navy}`,
  }}>
    <div style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec }}>{sub}</div>}
  </div>
);

const Badge = ({ text, color }) => (
  <span style={{
    background: color + '18', color, border: `1px solid ${color}40`,
    borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 700,
    whiteSpace: 'nowrap',
  }}>{text}</span>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, borderLeft: `3px solid ${T.gold}`, paddingLeft: 10, marginBottom: 12 }}>
    {children}
  </div>
);

const crremColor = s => s === 'stranded' ? T.red : s === 'at-risk' ? T.amber : s === 'aligned' ? T.green : T.textMut;
const riskColor = v => v >= 7.5 ? T.red : v >= 5 ? T.amber : T.green;
const impactColor = v => v < -6 ? T.red : v < -3 ? T.amber : T.green;

// ── TAB 1 ─────────────────────────────────────────────────────────────────────
const Tab1 = () => {
  const riskByType = avgByType('physRisk');
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <KPICard label="Total Portfolio GAV" value="$4.2bn" sub="28 assets across 4 categories" accent={T.navy} />
        <KPICard label="Assets Below Stranded Threshold" value="8 of 28" sub="29% — Action required" accent={T.red} />
        <KPICard label="Portfolio WACI" value="142 tCO2e/$M" sub="vs benchmark 95 tCO2e/$M" accent={T.amber} />
        <KPICard label="Climate-Adjusted IRR vs Baseline" value="-85 bps" sub="Average across all assets" accent={T.red} />
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 20, boxShadow: T.card }}>
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#92400e', fontWeight: 600 }}>
          Alert: 3 office towers (Canary Wharf, Broadgate EC2, Hudson Yards) face stranded asset risk by 2034 if no CapEx investment is committed. Estimated total at-risk value: $180M.
        </div>
        <SectionTitle>Average Physical Risk Score by Asset Type</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={riskByType} margin={{ left: 0, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="type" tick={{ fontSize: 10, fill: T.textSec }} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 10]} />
            <Tooltip />
            <Bar dataKey="value" name="Avg Physical Risk (1-10)" radius={[4, 4, 0, 0]}>
              {riskByType.map((entry, i) => (
                <Cell key={i} fill={riskColor(entry.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, boxShadow: T.card }}>
        <SectionTitle>Full Portfolio — All 28 Assets</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                {['Asset', 'Type', 'Location', 'GAV $M', 'EPC', 'CRREM', 'Phys Risk', 'Cap Rate %', 'NOI $M'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 700, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PORTFOLIO.map((a, i) => (
                <tr key={a.id} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>{a.name}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{a.type}</td>
                  <td style={{ padding: '7px 10px', color: T.textSec }}>{a.location}</td>
                  <td style={{ padding: '7px 10px', color: T.text, fontWeight: 600 }}>${a.gav}M</td>
                  <td style={{ padding: '7px 10px' }}><Badge text={a.epc} color={a.epc === 'A' || a.epc === 'B' ? T.green : a.epc === 'D' || a.epc === 'E' ? T.amber : a.epc === 'F' || a.epc === 'G' ? T.red : T.textMut} /></td>
                  <td style={{ padding: '7px 10px' }}>{a.crrem !== 'N/A' ? <Badge text={a.crrem} color={crremColor(a.crrem)} /> : <span style={{ color: T.textMut }}>N/A</span>}</td>
                  <td style={{ padding: '7px 10px', color: riskColor(a.physRisk), fontWeight: 700 }}>{a.physRisk}</td>
                  <td style={{ padding: '7px 10px', color: T.text }}>{a.capRate}%</td>
                  <td style={{ padding: '7px 10px', color: T.text }}>${a.noi}M</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── TAB 2 ─────────────────────────────────────────────────────────────────────
const Tab2 = () => (
  <div>
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 20, boxShadow: T.card }}>
      <SectionTitle>CRREM Carbon Intensity Trajectories — 5 Key Assets vs Pathways</SectionTitle>
      <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>
        Carbon intensity (kgCO2e/m²/yr) vs CRREM 1.5°C and 2°C decarbonisation pathways 2024–2050.
        Assets above pathway lines face stranding risk.
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={CRREM_TRAJECTORIES} margin={{ right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
          <YAxis tick={{ fontSize: 10, fill: T.textSec }} unit=" kg" />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <ReferenceLine y={55} stroke={T.amber} strokeDasharray="4 4" label={{ value: '2°C 2030', fontSize: 9 }} />
          <ReferenceLine y={40} stroke={T.green} strokeDasharray="4 4" label={{ value: '1.5°C 2030', fontSize: 9 }} />
          <Line dataKey="canary" name="Canary Wharf" stroke={T.red} strokeWidth={2} dot={false} />
          <Line dataKey="broadgate" name="Broadgate EC2" stroke="#e57373" strokeWidth={2} dot={false} />
          <Line dataKey="hudson" name="Hudson Yards" stroke={T.amber} strokeWidth={2} dot={false} />
          <Line dataKey="munich" name="Munich CBD" stroke={T.green} strokeWidth={2} dot={false} />
          <Line dataKey="dubai" name="Dubai Hotel" stroke={T.navy} strokeWidth={2} dot={false} />
          <Line dataKey="path15" name="CRREM 1.5°C" stroke={T.green} strokeWidth={2} strokeDasharray="6 3" dot={false} />
          <Line dataKey="path20" name="CRREM 2°C" stroke={T.amber} strokeWidth={2} strokeDasharray="6 3" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>

    <div style={{ background: '#ecfdf5', border: `1px solid ${T.sage}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: T.sage }}>
      <strong>Key finding:</strong> London Canary Wharf Tower — £18/sqft green CapEx investment aligns with CRREM 2°C pathway, avoiding £45/sqft stranding penalty. NPV of green CapEx programme: +£45M.
    </div>

    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, boxShadow: T.card }}>
      <SectionTitle>CRREM Analysis — All 15 Commercial RE Assets + Green CapEx Modelling</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Asset', 'Type', 'Location', 'kgCO2/m²', '1.5°C Target', '2°C Target', 'Gap %', 'Strand Year', 'Green CapEx £/sqft', 'Payback Yrs', 'NPV Avoided Stranding £/sqft'].map(h => (
                <th key={h} style={{ padding: '8px 8px', textAlign: 'left', color: T.textSec, fontWeight: 700, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap', fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CRREM_ASSETS.map((a, i) => (
              <tr key={a.id} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                <td style={{ padding: '7px 8px', color: T.text, fontWeight: 600 }}>{a.name}</td>
                <td style={{ padding: '7px 8px', color: T.textSec }}>{a.type}</td>
                <td style={{ padding: '7px 8px', color: T.textSec }}>{a.location}</td>
                <td style={{ padding: '7px 8px', color: a.intensity > 100 ? T.red : T.amber, fontWeight: 700 }}>{a.intensity}</td>
                <td style={{ padding: '7px 8px', color: T.textSec }}>{a.target15_2030}</td>
                <td style={{ padding: '7px 8px', color: T.textSec }}>{a.target20_2030}</td>
                <td style={{ padding: '7px 8px', color: a.gap > 50 ? T.red : a.gap > 0 ? T.amber : T.green, fontWeight: 700 }}>{a.gap > 0 ? `+${a.gap}%` : `${a.gap}%`}</td>
                <td style={{ padding: '7px 8px' }}>{a.strandYear ? <Badge text={String(a.strandYear)} color={a.strandYear < 2032 ? T.red : T.amber} /> : <span style={{ color: T.green, fontWeight: 700 }}>No risk</span>}</td>
                <td style={{ padding: '7px 8px', color: T.navy, fontWeight: 600 }}>£{a.greenCapex}</td>
                <td style={{ padding: '7px 8px', color: T.textSec }}>{a.payback} yrs</td>
                <td style={{ padding: '7px 8px', color: T.green, fontWeight: 700 }}>+£{a.npv}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ── TAB 3 ─────────────────────────────────────────────────────────────────────
const Tab3 = () => (
  <div>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
      <KPICard label="Total Value at Risk" value="$180M" sub="4.3% of total portfolio GAV" accent={T.red} />
      <KPICard label="Highest Risk Asset" value="Coastal SC Miami" sub="-17.9% climate valuation impact" accent={T.red} />
      <KPICard label="Portfolio Avg Cap Rate Impact" value="+62 bps" sub="Climate risk premium added" accent={T.amber} />
      <KPICard label="SSP5-8.5 Tail Risk" value="-$680M" sub="High-emissions scenario by 2050" accent={T.red} />
    </div>

    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 20, boxShadow: T.card }}>
      <SectionTitle>Climate Value Impact by Asset Type — SSP2-4.5 Base Case</SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={VALUE_BY_TYPE} layout="vertical" margin={{ left: 10, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} unit="%" />
          <YAxis type="category" dataKey="type" tick={{ fontSize: 10, fill: T.textSec }} width={100} />
          <Tooltip formatter={v => `${v}%`} />
          <Bar dataKey="impact" name="Value Impact %" radius={[0, 4, 4, 0]}>
            {VALUE_BY_TYPE.map((e, i) => (
              <Cell key={i} fill={impactColor(e.impact)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 20, boxShadow: T.card }}>
      <SectionTitle>Scenario Analysis — Portfolio Value Change by Asset Type (%)</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Scenario', 'Office', 'Retail', 'Logistics', 'Residential', 'Hotel'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textSec, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SCENARIO_IMPACT.map((s, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                <td style={{ padding: '8px 12px', color: T.text, fontWeight: 600 }}>{s.scenario}</td>
                {[s.office, s.retail, s.logistics, s.residential, s.hotel].map((v, j) => (
                  <td key={j} style={{ padding: '8px 12px', color: impactColor(v), fontWeight: 700 }}>{v}%</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, boxShadow: T.card }}>
      <SectionTitle>Physical Risk-Adjusted Valuation — Asset Level Detail</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Asset', 'Type', 'Base NOI $M', 'Flood Adj', 'Heat Adj', 'Adj NOI $M', 'Base Cap %', '+Climate Bps', 'Adj Cap %', 'Base Val $M', 'Adj Val $M', 'Impact $M', 'Impact %'].map(h => (
                <th key={h} style={{ padding: '8px 8px', textAlign: 'left', color: T.textSec, fontWeight: 700, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap', fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PHYSICAL_RISK.map((a, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                <td style={{ padding: '7px 8px', fontWeight: 600, color: T.text }}>{a.name}</td>
                <td style={{ padding: '7px 8px', color: T.textSec }}>{a.type}</td>
                <td style={{ padding: '7px 8px' }}>${a.baseNOI}M</td>
                <td style={{ padding: '7px 8px', color: T.red }}>{a.floodAdj}%</td>
                <td style={{ padding: '7px 8px', color: T.amber }}>{a.heatAdj}%</td>
                <td style={{ padding: '7px 8px', fontWeight: 700, color: T.navy }}>${a.adjNOI}M</td>
                <td style={{ padding: '7px 8px' }}>{a.baseCapRate}%</td>
                <td style={{ padding: '7px 8px', color: T.red }}>+{a.climatePrem} bps</td>
                <td style={{ padding: '7px 8px', fontWeight: 700, color: T.amber }}>{a.adjCapRate}%</td>
                <td style={{ padding: '7px 8px' }}>${a.baseValue}M</td>
                <td style={{ padding: '7px 8px', fontWeight: 700, color: T.navy }}>${a.adjValue}M</td>
                <td style={{ padding: '7px 8px', color: T.red, fontWeight: 700 }}>${a.impact}M</td>
                <td style={{ padding: '7px 8px', color: impactColor(a.impactPct), fontWeight: 700 }}>{a.impactPct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ── TAB 4 ─────────────────────────────────────────────────────────────────────
const Tab4 = () => (
  <div>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
      <KPICard label="Assets Stranding by 2030 (Ambitious)" value="5 assets" sub="3 UK offices, Miami retail, Dubai hotel" accent={T.red} />
      <KPICard label="Brown Discount — EPC F/G vs A/B" value="-15 to -30%" sub="Same location, same specs" accent={T.amber} />
      <KPICard label="Pre-Deadline CapEx Advantage" value="4.5x" sub="Cheaper than post-deadline remediation" accent={T.green} />
      <KPICard label="UK Offices Under Ambitious MEES" value="3 strand by 2030" sub="EPC E min → EPC B required by 2030" accent={T.red} />
    </div>

    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 20, boxShadow: T.card }}>
      <SectionTitle>Stranding Year by Asset — 3 Regulatory Scenarios</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Asset', 'Type', 'Location', 'EPC', 'Ambitious Policy', 'Moderate Policy', 'Current Trajectory', 'Brown Discount'].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STRANDED_ASSETS.map((a, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                <td style={{ padding: '7px 10px', fontWeight: 600, color: T.text }}>{a.name}</td>
                <td style={{ padding: '7px 10px', color: T.textSec }}>{a.type}</td>
                <td style={{ padding: '7px 10px', color: T.textSec }}>{a.location}</td>
                <td style={{ padding: '7px 10px' }}><Badge text={a.epc} color={a.epc === 'B' || a.epc === 'C' ? T.amber : T.red} /></td>
                <td style={{ padding: '7px 10px' }}><Badge text={String(a.ambitious)} color={a.ambitious <= 2030 ? T.red : T.amber} /></td>
                <td style={{ padding: '7px 10px' }}><Badge text={String(a.moderate)} color={a.moderate <= 2033 ? T.amber : T.gold} /></td>
                <td style={{ padding: '7px 10px' }}><Badge text={String(a.current)} color={T.textSec} /></td>
                <td style={{ padding: '7px 10px', color: T.red, fontWeight: 700 }}>{a.brownDiscount}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, boxShadow: T.card }}>
        <SectionTitle>Brown Discount Analysis</SectionTitle>
        <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>Market evidence: valuation premium/discount for EPC rating vs reference EPC C, same asset class and location.</div>
        {[
          { epc: 'A', disc: '+12%', color: T.green },
          { epc: 'B', disc: '+6%', color: T.sage },
          { epc: 'C', disc: '0% (ref)', color: T.textSec },
          { epc: 'D', disc: '-8%', color: T.amber },
          { epc: 'E', disc: '-15%', color: '#d97706' },
          { epc: 'F', disc: '-24%', color: T.red },
          { epc: 'G', disc: '-30%', color: '#991b1b' },
        ].map(row => (
          <div key={row.epc} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: row.color + '22', color: row.color, border: `1px solid ${row.color}`, borderRadius: 4, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{row.epc}</span>
              <span style={{ fontSize: 11, color: T.textSec }}>EPC Rating {row.epc}</span>
            </div>
            <span style={{ fontWeight: 700, color: row.color, fontSize: 13 }}>{row.disc}</span>
          </div>
        ))}
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, boxShadow: T.card }}>
        <SectionTitle>Green CapEx Business Case — Pre vs Post Regulatory Deadline</SectionTitle>
        <div style={{ fontSize: 11, color: T.textSec, marginBottom: 14 }}>
          Pre-emptive green CapEx before regulatory deadline is dramatically more cost-effective than post-deadline remediation.
        </div>
        {[
          { scenario: 'Pre-deadline CapEx (Year 1–3)', cost: '£18/sqft', outcome: 'Aligned with CRREM 2°C, green premium +8%', color: T.green },
          { scenario: 'Post-deadline forced remediation', cost: '£82/sqft', outcome: 'Regulatory compliance only, no rent uplift', color: T.red },
          { scenario: 'No action — stranded', cost: '-£45/sqft value loss', outcome: 'Market exit at 25% discount, rising void rate', color: '#991b1b' },
        ].map((r, i) => (
          <div key={i} style={{ background: r.color + '10', border: `1px solid ${r.color}30`, borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
            <div style={{ fontWeight: 700, color: r.color, fontSize: 12, marginBottom: 4 }}>{r.scenario}</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: r.color }}>{r.cost}</div>
            <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>{r.outcome}</div>
          </div>
        ))}
        <div style={{ background: T.navy + '10', borderRadius: 8, padding: '10px 14px', marginTop: 8, fontSize: 12, fontWeight: 700, color: T.navy }}>
          Pre-emptive investment is 4.5x cheaper than post-deadline remediation per sqft.
        </div>
      </div>
    </div>
  </div>
);

// ── TAB 5 ─────────────────────────────────────────────────────────────────────
const Tab5 = () => (
  <div>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
      <KPICard label="Total Ag & Timberland GAV" value="$507M" sub="8 assets across 6 countries" accent={T.sage} />
      <KPICard label="EUDR Critical Risk" value="2 assets" sub="Cerrado & Sumatra — immediate review needed" accent={T.red} />
      <KPICard label="UK Farmland Carbon Revenue" value="+£180/ha/yr" sub="At £65/tCO2e, sequestration credit" accent={T.green} />
      <KPICard label="Darling Downs RCP8.5 Yield Loss" value="-42.1%" sub="Critical heat stress by 2045" accent={T.red} />
    </div>

    <div style={{ background: '#fef2f2', border: `1px solid ${T.red}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#7f1d1d', fontWeight: 600 }}>
      EUDR Alert: Brazilian Cerrado (Sumatra Palm Oil) asset carries critical EUDR exposure due to deforestation activity in supply chain after December 2020 cutoff date.
      Immediate legal review and supply chain audit required. EU market access at risk.
    </div>

    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 20, boxShadow: T.card }}>
      <SectionTitle>Agricultural & Timberland Asset Climate Risk Profile</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              {['Asset', 'Value $M', 'Commodity', 'Drought', 'Flood', 'Heat', 'Pest', 'Yield RCP4.5', 'Yield RCP8.5', 'Carbon Rev £/ha/yr', 'EUDR Status'].map(h => (
                <th key={h} style={{ padding: '8px 8px', textAlign: 'left', color: T.textSec, fontWeight: 700, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap', fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AG_ASSETS.map((a, i) => (
              <tr key={a.id} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                <td style={{ padding: '7px 8px', fontWeight: 600, color: T.text }}>{a.name}</td>
                <td style={{ padding: '7px 8px', color: T.navy, fontWeight: 700 }}>${a.value}M</td>
                <td style={{ padding: '7px 8px', color: T.textSec }}>{a.commodity}</td>
                {[a.drought, a.flood, a.temp, a.pest].map((v, j) => (
                  <td key={j} style={{ padding: '7px 8px' }}>
                    <Badge text={v} color={v === 'High' || v === 'Critical' ? T.red : v === 'Medium' ? T.amber : T.green} />
                  </td>
                ))}
                <td style={{ padding: '7px 8px', color: T.amber, fontWeight: 700 }}>{a.yield45}%</td>
                <td style={{ padding: '7px 8px', color: T.red, fontWeight: 700 }}>{a.yield85}%</td>
                <td style={{ padding: '7px 8px', color: T.green, fontWeight: 600 }}>£{a.carbonVal}</td>
                <td style={{ padding: '7px 8px' }}>
                  <Badge text={a.eudr} color={a.eudr === 'CRITICAL' ? '#991b1b' : a.eudr === 'HIGH RISK' ? T.red : T.textMut} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, boxShadow: T.card }}>
      <SectionTitle>Crop Yield Projections 2024–2050 — Top 3 Farmland Assets (Base: 100)</SectionTitle>
      <div style={{ fontSize: 11, color: T.textSec, marginBottom: 12 }}>
        Index 100 = 2024 yield. UK farmland relatively resilient. US Midwest and Iowa face material yield losses under progressive warming.
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={CROP_YIELD} margin={{ right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: T.textSec }} />
          <YAxis tick={{ fontSize: 10, fill: T.textSec }} domain={[60, 105]} unit="%" />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={80} stroke={T.amber} strokeDasharray="4 4" label={{ value: 'Material loss threshold', fontSize: 9, fill: T.amber }} />
          <Line dataKey="yorkshire" name="Yorkshire Farmland" stroke={T.green} strokeWidth={2.5} dot={false} />
          <Line dataKey="illinois" name="Illinois Corn Farm" stroke={T.amber} strokeWidth={2.5} dot={false} />
          <Line dataKey="iowa" name="Iowa Soya Farm" stroke={T.red} strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// ── TAB 6 ─────────────────────────────────────────────────────────────────────
const Tab6 = () => (
  <div>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
      <KPICard label="Asset" value="London Grade A Office" sub="50,000 sqft | Current value £85M" accent={T.navy} />
      <KPICard label="No Action IRR" value="6.8%" sub="Exit value £72M — stranded" accent={T.red} />
      <KPICard label="Green Retrofit IRR" value="8.2%" sub="Exit value £98M — +£26M vs no action" accent={T.green} />
      <KPICard label="Retrofit NPV Uplift" value="+£26M" sub="vs no action scenario at exit" accent={T.green} />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, boxShadow: T.card }}>
        <SectionTitle>Asset Assumptions</SectionTitle>
        {[
          ['Current rent', '£55/sqft'],
          ['Vacancy rate', '8%'],
          ['Operating costs (OpEx)', '£12/sqft'],
          ['Green CapEx (Year 3)', '£10M (£200/sqft)'],
          ['Baseline exit cap rate', '4.5%'],
          ['Carbon price escalation', '+3%/yr from £65/tCO2e'],
          ['Flood insurance (by Year 5)', '+£8/sqft'],
          ['Green rent uplift (post-retrofit)', '+£8/sqft'],
          ['Exit cap — no action', '5.25% (+75 bps stranding)'],
          ['Exit cap — retrofitted', '4.25% (-25 bps premium)'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
            <span style={{ color: T.textSec }}>{k}</span>
            <span style={{ fontWeight: 700, color: T.navy }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, boxShadow: T.card }}>
        <SectionTitle>IRR Sensitivity Table — Green Retrofit Scenario</SectionTitle>
        <div style={{ fontSize: 11, color: T.textSec, marginBottom: 10 }}>IRR (%) by Carbon Price × Green Rent Premium</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', color: T.textSec, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>Carbon Price</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', color: T.textSec, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>Low Green Prem (£5/sqft)</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', color: T.textSec, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>Base (£8/sqft)</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', color: T.textSec, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>High (£12/sqft)</th>
            </tr>
          </thead>
          <tbody>
            {SENSITIVITY.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.bg }}>
                <td style={{ padding: '8px 10px', fontWeight: 700, color: T.navy }}>{row.carbonPrice}</td>
                <td style={{ padding: '8px 10px', textAlign: 'center', color: T.amber }}>{row.greenPremLow}</td>
                <td style={{ padding: '8px 10px', textAlign: 'center', color: T.green, fontWeight: 700 }}>{row.greenPremBase}</td>
                <td style={{ padding: '8px 10px', textAlign: 'center', color: T.sage, fontWeight: 700 }}>{row.greenPremHigh}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 14, background: T.navy + '0d', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: T.textSec }}>
          Even under low green premium and low carbon price assumptions, the green retrofit scenario outperforms no action by 140 bps IRR.
        </div>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, boxShadow: T.card }}>
        <SectionTitle>Scenario 1: No Action — Annual Climate-Adjusted NOI vs Baseline</SectionTitle>
        <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>Climate costs erode NOI progressively. Stranding discount accelerates from Year 5.</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={DCF_NO_ACTION} margin={{ right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="M" domain={[0, 3.2]} />
            <Tooltip formatter={v => `£${v}M`} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="baseline" name="Baseline NOI £M" fill={T.navy + '44'} radius={[3, 3, 0, 0]} />
            <Bar dataKey="climateAdj" name="Climate-Adj NOI £M" fill={T.red} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 10, background: '#fef2f2', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: T.red, fontWeight: 600 }}>
          No Action: IRR 6.8% | Exit Value £72M | Stranded 2034
        </div>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, boxShadow: T.card }}>
        <SectionTitle>Scenario 2: Green Retrofit (Year 3) — Annual Climate-Adjusted NOI vs Baseline</SectionTitle>
        <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8 }}>Post-retrofit, green rent premium and energy savings drive NOI well above baseline.</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={DCF_RETROFIT} margin={{ right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit="M" domain={[0, 4.2]} />
            <Tooltip formatter={v => `£${v}M`} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="baseline" name="Baseline NOI £M" fill={T.navy + '44'} radius={[3, 3, 0, 0]} />
            <Bar dataKey="climateAdj" name="Climate-Adj NOI £M" radius={[3, 3, 0, 0]}>
              {DCF_RETROFIT.map((e, i) => (
                <Cell key={i} fill={e.climateAdj > e.baseline ? T.green : T.amber} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 10, background: '#f0fdf4', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: T.green, fontWeight: 600 }}>
          Green Retrofit: IRR 8.2% | Exit Value £98M | CRREM 2°C Aligned
        </div>
      </div>
    </div>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
export default function RealAssetsClimatePage() {
  const [activeTab, setActiveTab] = useState(0);

  const BADGES = ['CRREM+', 'Physical Risk NOI', 'Stranded 2034', 'Climate Cap Rate', '$180bn at Risk'];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: T.font, color: T.text }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 28px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ background: T.gold + '22', color: T.gold, border: `1px solid ${T.gold}55`, borderRadius: 5, padding: '3px 9px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em' }}>EP-AG4</span>
              <span style={{ color: T.goldL, fontSize: 12, fontWeight: 500 }}>AA Impact Risk Analytics Platform</span>
            </div>
            <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              Real Assets Climate Valuation
            </h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {BADGES.map(b => (
                <span key={b} style={{ background: '#ffffff15', color: T.goldL, border: `1px solid #ffffff25`, borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 600 }}>{b}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[{ label: 'Portfolio GAV', val: '$4.2bn' }, { label: 'At Risk', val: '$180M' }, { label: 'Stranded', val: '8 / 28' }].map(kp => (
              <div key={kp.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>{kp.val}</div>
                <div style={{ fontSize: 10, color: T.goldL }}>{kp.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginTop: 18, overflowX: 'auto', paddingBottom: 2 }}>
          {TABS.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              style={{
                background: activeTab === i ? T.gold : 'transparent',
                color: activeTab === i ? T.navy : T.goldL,
                border: `1px solid ${activeTab === i ? T.gold : '#ffffff25'}`,
                borderRadius: '6px 6px 0 0',
                padding: '8px 14px',
                fontSize: 11,
                fontWeight: activeTab === i ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                fontFamily: T.font,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px', maxWidth: 1440 }}>
        {activeTab === 0 && <Tab1 />}
        {activeTab === 1 && <Tab2 />}
        {activeTab === 2 && <Tab3 />}
        {activeTab === 3 && <Tab4 />}
        {activeTab === 4 && <Tab5 />}
        {activeTab === 5 && <Tab6 />}
      </div>
    </div>
  );
}
