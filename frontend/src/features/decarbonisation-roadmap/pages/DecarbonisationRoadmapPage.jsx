import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart } from 'recharts';

const T = {
  bg: '#0f172a', surface: '#1e293b', surfaceH: '#263248', border: '#334155', borderL: '#2d3f55',
  navy: '#60a5fa', navyL: '#93c5fd', gold: '#fbbf24', goldL: '#fcd34d',
  sage: '#34d399', sageL: '#6ee7b7', teal: '#2dd4bf', text: '#f1f5f9',
  textSec: '#94a3b8', textMut: '#64748b', red: '#f87171', green: '#4ade80',
  amber: '#fb923c', font: "'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",
  mono: "'JetBrains Mono','SF Mono','Fira Code',monospace"
};
const sr = (s) => Math.abs(Math.sin(s * 9301 + 49297) * 233280) % 1;
const COLORS = [T.navy, T.gold, T.sage, T.teal, T.amber, T.red, T.navyL, T.goldL, '#a78bfa', '#f472b6'];
const tip = { contentStyle: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, fontFamily: T.font }, labelStyle: { color: T.textSec, fontSize: 10 } };
const cS = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 };

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.mono, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const CORPORATES = [
  { name: 'Shell', sector: 'Energy', region: 'Europe', baseYear: 2019, baseline: 1620, target2030: 810, target2050: 0, current: 1240, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 65, investMn: 2800, abatement: 'Fuel Switching+CCS', status: 'On Track', scope3: 1450, reductionPct: 23 },
  { name: 'BP', sector: 'Energy', region: 'Europe', baseYear: 2019, baseline: 1450, target2030: 580, target2050: 0, current: 1120, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 58, investMn: 3200, abatement: 'Renewables+Electrification', status: 'Behind', scope3: 1300, reductionPct: 22 },
  { name: 'TotalEnergies', sector: 'Energy', region: 'Europe', baseYear: 2015, baseline: 1180, target2030: 590, target2050: 0, current: 980, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 72, investMn: 2100, abatement: 'NbS+CCS', status: 'On Track', scope3: 980, reductionPct: 17 },
  { name: 'ExxonMobil', sector: 'Energy', region: 'North America', baseYear: 2016, baseline: 122, target2030: 91, target2050: 0, current: 108, netZeroYear: 2050, sbti: 'None', carbonPrice: 40, investMn: 17000, abatement: 'CCS+Hydrogen', status: 'Behind', scope3: 560, reductionPct: 11 },
  { name: 'Chevron', sector: 'Energy', region: 'North America', baseYear: 2016, baseline: 70, target2030: 56, target2050: 0, current: 64, netZeroYear: 2050, sbti: 'None', carbonPrice: 45, investMn: 10000, abatement: 'Methane Abatement', status: 'Behind', scope3: 480, reductionPct: 9 },
  { name: 'Equinor', sector: 'Energy', region: 'Europe', baseYear: 2019, baseline: 14, target2030: 10, target2050: 0, current: 12, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 80, investMn: 5000, abatement: 'Offshore RE', status: 'On Track', scope3: 240, reductionPct: 14 },
  { name: 'ArcelorMittal', sector: 'Steel', region: 'Europe', baseYear: 2018, baseline: 208, target2030: 167, target2050: 0, current: 192, netZeroYear: 2050, sbti: 'Approved', carbonPrice: 90, investMn: 4400, abatement: 'Hydrogen DRI', status: 'On Track', scope3: 18, reductionPct: 8 },
  { name: 'Thyssenkrupp', sector: 'Steel', region: 'Europe', baseYear: 2018, baseline: 18, target2030: 10, target2050: 0, current: 15, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 80, investMn: 2200, abatement: 'H2 DRI+EAF', status: 'On Track', scope3: 10, reductionPct: 17 },
  { name: 'SSAB', sector: 'Steel', region: 'Europe', baseYear: 2019, baseline: 7.1, target2030: 1.4, target2050: 0, current: 5.8, netZeroYear: 2045, sbti: 'Approved', carbonPrice: 120, investMn: 4800, abatement: 'HYBRIT (fossil-free)', status: 'Ahead', scope3: 8, reductionPct: 18 },
  { name: 'HeidelbergCement', sector: 'Cement', region: 'Europe', baseYear: 1990, baseline: 800, target2030: 560, target2050: 0, current: 640, netZeroYear: 2050, sbti: 'Approved', carbonPrice: 85, investMn: 1800, abatement: 'CCS+Alt Fuels', status: 'On Track', scope3: 20, reductionPct: 20 },
  { name: 'Lafarge Holcim', sector: 'Cement', region: 'Europe', baseYear: 1990, baseline: 680, target2030: 475, target2050: 0, current: 560, netZeroYear: 2050, sbti: 'Approved', carbonPrice: 78, investMn: 2600, abatement: 'Low-C Cement+CCS', status: 'On Track', scope3: 22, reductionPct: 18 },
  { name: 'Maersk', sector: 'Shipping', region: 'Europe', baseYear: 2020, baseline: 10600, target2030: 10100, target2050: 0, current: 10300, netZeroYear: 2040, sbti: 'Approved', carbonPrice: 110, investMn: 5600, abatement: 'Green Methanol', status: 'Ahead', scope3: 3200, reductionPct: 3 },
  { name: 'MSC', sector: 'Shipping', region: 'Europe', baseYear: 2020, baseline: 9800, target2030: 9310, target2050: 0, current: 9600, netZeroYear: 2050, sbti: 'None', carbonPrice: 55, investMn: 3800, abatement: 'LNG Bridge', status: 'On Track', scope3: 2800, reductionPct: 2 },
  { name: 'CMA CGM', sector: 'Shipping', region: 'Europe', baseYear: 2020, baseline: 8400, target2030: 7560, target2050: 0, current: 8100, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 60, investMn: 4200, abatement: 'Bio-LNG+Ammonia', status: 'On Track', scope3: 2400, reductionPct: 4 },
  { name: 'Volkswagen', sector: 'Auto', region: 'Europe', baseYear: 2018, baseline: 82, target2030: 45, target2050: 0, current: 68, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 50, investMn: 8900, abatement: 'EV Transition', status: 'On Track', scope3: 260, reductionPct: 17 },
  { name: 'BMW', sector: 'Auto', region: 'Europe', baseYear: 2019, baseline: 45, target2030: 22, target2050: 0, current: 36, netZeroYear: 2050, sbti: 'Approved', carbonPrice: 65, investMn: 5800, abatement: 'EV+Circular', status: 'Ahead', scope3: 180, reductionPct: 20 },
  { name: 'Ford', sector: 'Auto', region: 'North America', baseYear: 2017, baseline: 12.6, target2030: 6.3, target2050: 0, current: 10.2, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 48, investMn: 11000, abatement: 'EV Transition', status: 'On Track', scope3: 210, reductionPct: 19 },
  { name: 'Toyota', sector: 'Auto', region: 'Asia-Pacific', baseYear: 2019, baseline: 11.8, target2030: 9.4, target2050: 0, current: 10.8, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 42, investMn: 13500, abatement: 'Hybrid+H2+EV', status: 'Behind', scope3: 310, reductionPct: 8 },
  { name: 'Microsoft', sector: 'Technology', region: 'North America', baseYear: 2020, baseline: 14, target2030: 7, target2050: -14, current: 11, netZeroYear: 2030, sbti: 'Approved', carbonPrice: 145, investMn: 1200, abatement: 'DACCS+Biochar', status: 'Ahead', scope3: 12, reductionPct: 21 },
  { name: 'Apple', sector: 'Technology', region: 'North America', baseYear: 2019, baseline: 25, target2030: 10, target2050: 0, current: 18, netZeroYear: 2030, sbti: 'Approved', carbonPrice: 200, investMn: 4500, abatement: 'Renewable+Suppliers', status: 'Ahead', scope3: 20, reductionPct: 28 },
  { name: 'Google', sector: 'Technology', region: 'North America', baseYear: 2019, baseline: 12, target2030: 0, target2050: 0, current: 8, netZeroYear: 2030, sbti: 'Approved', carbonPrice: 180, investMn: 3200, abatement: '24/7 CFE', status: 'Ahead', scope3: 9, reductionPct: 33 },
  { name: 'Amazon', sector: 'Technology', region: 'North America', baseYear: 2019, baseline: 51.2, target2030: 20.5, target2050: 0, current: 40.1, netZeroYear: 2040, sbti: 'Approved', carbonPrice: 95, investMn: 6800, abatement: 'RE+Fleet Electrification', status: 'On Track', scope3: 48, reductionPct: 22 },
  { name: 'Meta', sector: 'Technology', region: 'North America', baseYear: 2019, baseline: 8.5, target2030: 0, target2050: 0, current: 5.2, netZeroYear: 2030, sbti: 'Approved', carbonPrice: 160, investMn: 1100, abatement: '100% RE+Supply Chain', status: 'Ahead', scope3: 7, reductionPct: 39 },
  { name: 'SAP', sector: 'Technology', region: 'Europe', baseYear: 2020, baseline: 1.76, target2030: 0, target2050: 0, current: 0.98, netZeroYear: 2030, sbti: 'Approved', carbonPrice: 250, investMn: 400, abatement: 'RE+Efficiency', status: 'Ahead', scope3: 2, reductionPct: 44 },
  { name: 'Unilever', sector: 'Consumer', region: 'Europe', baseYear: 2015, baseline: 56, target2030: 28, target2050: 0, current: 42, netZeroYear: 2039, sbti: 'Approved', carbonPrice: 68, investMn: 950, abatement: 'Supply Chain+NbS', status: 'On Track', scope3: 52, reductionPct: 25 },
  { name: 'Nestle', sector: 'Consumer', region: 'Europe', baseYear: 2018, baseline: 92, target2030: 37, target2050: 0, current: 71, netZeroYear: 2050, sbti: 'Approved', carbonPrice: 62, investMn: 1400, abatement: 'Agri+Packaging', status: 'Behind', scope3: 87, reductionPct: 23 },
  { name: 'P&G', sector: 'Consumer', region: 'North America', baseYear: 2010, baseline: 2.9, target2030: 1.45, target2050: 0, current: 2.1, netZeroYear: 2040, sbti: 'Approved', carbonPrice: 55, investMn: 1200, abatement: 'RE+Circular', status: 'On Track', scope3: 38, reductionPct: 28 },
  { name: 'Walmart', sector: 'Consumer', region: 'North America', baseYear: 2015, baseline: 28.5, target2030: 14.3, target2050: 0, current: 22.4, netZeroYear: 2040, sbti: 'Approved', carbonPrice: 50, investMn: 2500, abatement: 'RE+Fleet+Supplier', status: 'On Track', scope3: 250, reductionPct: 21 },
  { name: 'Tesco', sector: 'Consumer', region: 'Europe', baseYear: 2015, baseline: 4.8, target2030: 2.4, target2050: 0, current: 3.6, netZeroYear: 2035, sbti: 'Approved', carbonPrice: 58, investMn: 680, abatement: 'RE+Refrigerants', status: 'On Track', scope3: 28, reductionPct: 25 },
  { name: 'JPMorgan', sector: 'Finance', region: 'North America', baseYear: 2020, baseline: 0.56, target2030: 0.22, target2050: 0, current: 0.44, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 40, investMn: 2200, abatement: 'Financed Emissions (PCAF)', status: 'On Track', scope3: 0.5, reductionPct: 21 },
  { name: 'HSBC', sector: 'Finance', region: 'Europe', baseYear: 2019, baseline: 0.32, target2030: 0.13, target2050: 0, current: 0.26, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 42, investMn: 1800, abatement: 'Portfolio Alignment', status: 'Behind', scope3: 0.3, reductionPct: 19 },
  { name: 'BNP Paribas', sector: 'Finance', region: 'Europe', baseYear: 2020, baseline: 0.28, target2030: 0.11, target2050: 0, current: 0.22, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 38, investMn: 1600, abatement: 'Sector Pathways', status: 'On Track', scope3: 0.25, reductionPct: 21 },
  { name: 'Rio Tinto', sector: 'Mining', region: 'Europe', baseYear: 2018, baseline: 32, target2030: 22, target2050: 0, current: 28, netZeroYear: 2050, sbti: 'Approved', carbonPrice: 75, investMn: 7500, abatement: 'Electrification+H2', status: 'On Track', scope3: 85, reductionPct: 13 },
  { name: 'BHP', sector: 'Mining', region: 'Asia-Pacific', baseYear: 2020, baseline: 15, target2030: 11.3, target2050: 0, current: 13.5, netZeroYear: 2050, sbti: 'Approved', carbonPrice: 70, investMn: 4800, abatement: 'Electrification', status: 'On Track', scope3: 65, reductionPct: 10 },
  { name: 'Glencore', sector: 'Mining', region: 'Europe', baseYear: 2019, baseline: 57, target2030: 40, target2050: 0, current: 50, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 60, investMn: 3200, abatement: 'Coal Phase-out', status: 'On Track', scope3: 350, reductionPct: 12 },
  { name: 'Holcim', sector: 'Cement', region: 'Europe', baseYear: 1990, baseline: 720, target2030: 504, target2050: 0, current: 588, netZeroYear: 2050, sbti: 'Approved', carbonPrice: 82, investMn: 2000, abatement: 'CCUS+Low-C clinker', status: 'On Track', scope3: 24, reductionPct: 18 },
  { name: 'Bayer', sector: 'Chemicals', region: 'Europe', baseYear: 2019, baseline: 6.2, target2030: 4.2, target2050: 0, current: 5.5, netZeroYear: 2050, sbti: 'Approved', carbonPrice: 68, investMn: 820, abatement: 'RE+Process Efficiency', status: 'On Track', scope3: 42, reductionPct: 11 },
  { name: 'BASF', sector: 'Chemicals', region: 'Europe', baseYear: 2018, baseline: 21.9, target2030: 17.5, target2050: 0, current: 19.8, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 75, investMn: 4600, abatement: 'Verbund+H2', status: 'On Track', scope3: 180, reductionPct: 10 },
  { name: 'Dow', sector: 'Chemicals', region: 'North America', baseYear: 2005, baseline: 38, target2030: 15, target2050: 0, current: 19.4, netZeroYear: 2050, sbti: 'Approved', carbonPrice: 65, investMn: 3800, abatement: 'Electrification+CCS', status: 'Ahead', scope3: 150, reductionPct: 49 },
  { name: 'Delta Air Lines', sector: 'Aviation', region: 'North America', baseYear: 2019, baseline: 45.5, target2030: 36.4, target2050: 0, current: 42.1, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 55, investMn: 3500, abatement: 'SAF+Fleet Renewal', status: 'On Track', scope3: 41, reductionPct: 7 },
  { name: 'Lufthansa', sector: 'Aviation', region: 'Europe', baseYear: 2019, baseline: 24.6, target2030: 18.5, target2050: 0, current: 22.8, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 65, investMn: 2400, abatement: 'SAF+New Aircraft', status: 'On Track', scope3: 22, reductionPct: 7 },
  { name: 'IAG (British Airways)', sector: 'Aviation', region: 'Europe', baseYear: 2019, baseline: 21.4, target2030: 14.9, target2050: 0, current: 19.6, netZeroYear: 2050, sbti: 'Approved', carbonPrice: 70, investMn: 2000, abatement: 'SAF 10% by 2030', status: 'On Track', scope3: 19, reductionPct: 8 },
  { name: 'Siemens', sector: 'Industrials', region: 'Europe', baseYear: 2019, baseline: 2.3, target2030: 0, target2050: 0, current: 1.1, netZeroYear: 2030, sbti: 'Approved', carbonPrice: 95, investMn: 900, abatement: '100% RE+Efficiency', status: 'Ahead', scope3: 28, reductionPct: 52 },
  { name: 'Schneider Electric', sector: 'Industrials', region: 'Europe', baseYear: 2017, baseline: 1.7, target2030: 0, target2050: 0, current: 0.7, netZeroYear: 2030, sbti: 'Approved', carbonPrice: 110, investMn: 750, abatement: 'RE+Supplier Engagement', status: 'Ahead', scope3: 58, reductionPct: 59 },
  { name: 'Caterpillar', sector: 'Industrials', region: 'North America', baseYear: 2018, baseline: 2.2, target2030: 1.54, target2050: 0, current: 1.95, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 52, investMn: 1100, abatement: 'Electrification+H2', status: 'On Track', scope3: 145, reductionPct: 11 },
  { name: 'NextEra Energy', sector: 'Utilities', region: 'North America', baseYear: 2005, baseline: 42, target2030: 21, target2050: 0, current: 28, netZeroYear: 2045, sbti: 'Approved', carbonPrice: 58, investMn: 14000, abatement: 'RE Growth', status: 'Ahead', scope3: 30, reductionPct: 33 },
  { name: 'Enel', sector: 'Utilities', region: 'Europe', baseYear: 2017, baseline: 79, target2030: 31, target2050: 0, current: 52, netZeroYear: 2050, sbti: 'Approved', carbonPrice: 62, investMn: 22000, abatement: 'Coal Phase-out+RE', status: 'Ahead', scope3: 45, reductionPct: 34 },
  { name: 'Iberdrola', sector: 'Utilities', region: 'Europe', baseYear: 2017, baseline: 46, target2030: 0, target2050: 0, current: 22, netZeroYear: 2030, sbti: 'Approved', carbonPrice: 75, investMn: 16000, abatement: 'Coal Exit+Offshore Wind', status: 'Ahead', scope3: 20, reductionPct: 52 },
  { name: 'Orsted', sector: 'Utilities', region: 'Europe', baseYear: 2006, baseline: 10.5, target2030: 0.84, target2050: 0, current: 3.8, netZeroYear: 2025, sbti: 'Approved', carbonPrice: 140, investMn: 8000, abatement: 'Offshore Wind Pivot', status: 'Ahead', scope3: 4, reductionPct: 64 },
  { name: 'Duke Energy', sector: 'Utilities', region: 'North America', baseYear: 2005, baseline: 114, target2030: 80, target2050: 0, current: 95, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 45, investMn: 12000, abatement: 'Coal Retirement', status: 'On Track', scope3: 88, reductionPct: 17 },
  { name: 'Johnson & Johnson', sector: 'Healthcare', region: 'North America', baseYear: 2016, baseline: 1.9, target2030: 0, target2050: 0, current: 1.1, netZeroYear: 2045, sbti: 'Approved', carbonPrice: 82, investMn: 380, abatement: '100% RE+Efficiency', status: 'Ahead', scope3: 18, reductionPct: 42 },
  { name: 'Novartis', sector: 'Healthcare', region: 'Europe', baseYear: 2016, baseline: 1.5, target2030: 0, target2050: 0, current: 0.7, netZeroYear: 2030, sbti: 'Approved', carbonPrice: 98, investMn: 320, abatement: 'RE+CHP', status: 'Ahead', scope3: 14, reductionPct: 53 },
  { name: 'Roche', sector: 'Healthcare', region: 'Europe', baseYear: 2019, baseline: 1.1, target2030: 0, target2050: 0, current: 0.58, netZeroYear: 2030, sbti: 'Approved', carbonPrice: 105, investMn: 280, abatement: 'RE+Heat Recovery', status: 'Ahead', scope3: 10, reductionPct: 47 },
  { name: 'IKEA', sector: 'Consumer', region: 'Europe', baseYear: 2016, baseline: 26, target2030: 15, target2050: 0, current: 21, netZeroYear: 2030, sbti: 'Approved', carbonPrice: 72, investMn: 2800, abatement: 'RE+Wood Circularity', status: 'On Track', scope3: 24, reductionPct: 19 },
  { name: 'H&M', sector: 'Consumer', region: 'Europe', baseYear: 2019, baseline: 5.8, target2030: 2.9, target2050: 0, current: 4.4, netZeroYear: 2040, sbti: 'Approved', carbonPrice: 58, investMn: 440, abatement: 'RE+Circular Fashion', status: 'On Track', scope3: 5.5, reductionPct: 24 },
  { name: 'Air Liquide', sector: 'Chemicals', region: 'Europe', baseYear: 2017, baseline: 47, target2030: 33, target2050: 0, current: 41, netZeroYear: 2050, sbti: 'Approved', carbonPrice: 70, investMn: 3600, abatement: 'Low-C H2+CCUS', status: 'On Track', scope3: 38, reductionPct: 13 },
  { name: 'Linde', sector: 'Chemicals', region: 'Europe', baseYear: 2021, baseline: 29.8, target2030: 23.8, target2050: 0, current: 27.5, netZeroYear: 2050, sbti: 'Approved', carbonPrice: 68, investMn: 3200, abatement: 'Clean H2+CCUS', status: 'On Track', scope3: 25, reductionPct: 8 },
  { name: 'Tata Steel', sector: 'Steel', region: 'Asia-Pacific', baseYear: 2005, baseline: 29, target2030: 22, target2050: 0, current: 25.8, netZeroYear: 2045, sbti: 'Committed', carbonPrice: 55, investMn: 1800, abatement: 'Scrap EAF+H2', status: 'On Track', scope3: 20, reductionPct: 11 },
  { name: 'POSCO', sector: 'Steel', region: 'Asia-Pacific', baseYear: 2018, baseline: 78, target2030: 60, target2050: 0, current: 72, netZeroYear: 2050, sbti: 'Committed', carbonPrice: 50, investMn: 3900, abatement: 'HyREX+CCS', status: 'Behind', scope3: 50, reductionPct: 8 },
];

const ABATEMENT_LEVERS = [
  { lever: 'Solar + Storage', sector: 'Cross-Sector', potentialMtY: 8.4, costPerTon: -35, maturity: 'Proven', adoption: 72, description: 'Utility+distributed PV with 4h battery', abatementBy2030: 6.2, abatementBy2050: 14.8 },
  { lever: 'Onshore Wind', sector: 'Power', potentialMtY: 7.2, costPerTon: -28, maturity: 'Proven', adoption: 68, description: 'Levelised cost below gas peaker in all regions', abatementBy2030: 5.8, abatementBy2050: 12.1 },
  { lever: 'Offshore Wind', sector: 'Power', potentialMtY: 4.8, costPerTon: -10, maturity: 'Proven', adoption: 55, description: 'Fixed + floating; North Sea, East Asia, US East', abatementBy2030: 3.4, abatementBy2050: 9.6 },
  { lever: 'Green Hydrogen DRI', sector: 'Steel', potentialMtY: 1.8, costPerTon: 120, maturity: 'Demonstration', adoption: 8, description: 'Replace coking coal blast furnace with H2-DRI+EAF', abatementBy2030: 0.2, abatementBy2050: 3.2 },
  { lever: 'Carbon Capture (Point Source)', sector: 'Industry', potentialMtY: 3.2, costPerTon: 80, maturity: 'Scaling', adoption: 18, description: 'Post-combustion capture at cement/steel/power', abatementBy2030: 1.2, abatementBy2050: 6.5 },
  { lever: 'CCUS (Industrial Clusters)', sector: 'Industry', potentialMtY: 2.4, costPerTon: 65, maturity: 'Scaling', adoption: 15, description: 'Shared transport+storage infrastructure', abatementBy2030: 0.8, abatementBy2050: 4.8 },
  { lever: 'EV Passenger Cars', sector: 'Transport', potentialMtY: 5.6, costPerTon: -8, maturity: 'Proven', adoption: 52, description: 'BEV + PHEV fleet transition; charged on clean grid', abatementBy2030: 3.4, abatementBy2050: 9.2 },
  { lever: 'Electric Trucks & HGV', sector: 'Transport', potentialMtY: 2.1, costPerTon: 45, maturity: 'Scaling', adoption: 12, description: 'BEV < 200km; H2 FCEV > 200km', abatementBy2030: 0.6, abatementBy2050: 3.8 },
  { lever: 'Sustainable Aviation Fuel (SAF)', sector: 'Aviation', potentialMtY: 0.8, costPerTon: 280, maturity: 'Scaling', adoption: 4, description: 'HVO, HEFA, e-fuel (Power-to-Liquid)', abatementBy2030: 0.08, abatementBy2050: 1.4 },
  { lever: 'Green Ammonia Shipping', sector: 'Shipping', potentialMtY: 1.4, costPerTon: 220, maturity: 'Demonstration', adoption: 3, description: 'NH3 dual-fuel engines; co-produced green H2', abatementBy2030: 0.05, abatementBy2050: 2.1 },
  { lever: 'Building Retrofits (Heat Pumps)', sector: 'Buildings', potentialMtY: 3.8, costPerTon: 15, maturity: 'Proven', adoption: 38, description: 'Air+ground source HP replacing gas boilers', abatementBy2030: 1.8, abatementBy2050: 6.4 },
  { lever: 'Methane Capture (Oil & Gas)', sector: 'Energy', potentialMtY: 4.2, costPerTon: -5, maturity: 'Proven', adoption: 42, description: 'Leak detection+repair; flaring reduction', abatementBy2030: 2.8, abatementBy2050: 5.0 },
  { lever: 'Electrification (Industrial Heat)', sector: 'Industry', potentialMtY: 2.2, costPerTon: 55, maturity: 'Scaling', adoption: 14, description: 'Electric arc furnaces, industrial heat pumps', abatementBy2030: 0.6, abatementBy2050: 3.8 },
  { lever: 'Low-Carbon Cement (CCSC)', sector: 'Cement', potentialMtY: 0.9, costPerTon: 40, maturity: 'Scaling', adoption: 16, description: 'SCM substitution; calcined clay; carbon-cured', abatementBy2030: 0.3, abatementBy2050: 1.6 },
  { lever: 'Nature-Based Solutions (NbS)', sector: 'Land Use', potentialMtY: 6.5, costPerTon: 12, maturity: 'Proven', adoption: 28, description: 'Forest protection, soil carbon, blue carbon', abatementBy2030: 3.2, abatementBy2050: 8.8 },
  { lever: 'Food System Decarbonisation', sector: 'Agriculture', potentialMtY: 4.8, costPerTon: 22, maturity: 'Scaling', adoption: 22, description: 'Reduced livestock methane; precision ag; diet shift', abatementBy2030: 1.6, abatementBy2050: 6.2 },
  { lever: 'Green Hydrogen (Power)', sector: 'Power', potentialMtY: 1.8, costPerTon: 70, maturity: 'Scaling', adoption: 8, description: 'Long-duration storage; peaking plant replacement', abatementBy2030: 0.4, abatementBy2050: 2.8 },
  { lever: 'Nuclear (Existing + New)', sector: 'Power', potentialMtY: 2.1, costPerTon: 5, maturity: 'Proven', adoption: 20, description: 'LTO + Gen III+ + SMR pipeline', abatementBy2030: 1.2, abatementBy2050: 3.5 },
  { lever: 'Industrial Efficiency (Process)', sector: 'Industry', potentialMtY: 2.8, costPerTon: -12, maturity: 'Proven', adoption: 55, description: 'Motor systems, heat integration, AI optimisation', abatementBy2030: 1.8, abatementBy2050: 3.2 },
  { lever: 'Reforestation (Tropical)', sector: 'Land Use', potentialMtY: 3.2, costPerTon: 8, maturity: 'Proven', adoption: 35, description: 'Native species reforestation; REDD+ aligned', abatementBy2030: 1.4, abatementBy2050: 5.4 },
  { lever: 'Bioenergy + CCUS (BECCS)', sector: 'Cross-Sector', potentialMtY: 1.5, costPerTon: 150, maturity: 'Demonstration', adoption: 2, description: 'Negative emissions via bioenergy+CCS', abatementBy2030: 0.1, abatementBy2050: 2.4 },
  { lever: 'Carbon Border Adjustment (CBAM)', sector: 'Policy', potentialMtY: 0.6, costPerTon: 0, maturity: 'Proven', adoption: 30, description: 'EU CBAM driving import abatement', abatementBy2030: 0.3, abatementBy2050: 0.8 },
  { lever: 'Corporate PPAs', sector: 'Cross-Sector', potentialMtY: 1.2, costPerTon: -20, maturity: 'Proven', adoption: 48, description: 'Additionality from long-term RE procurement', abatementBy2030: 0.8, abatementBy2050: 1.8 },
  { lever: 'Sustainable Agriculture (Regen)', sector: 'Agriculture', potentialMtY: 2.6, costPerTon: 18, maturity: 'Scaling', adoption: 18, description: 'Regenerative practices; cover crops; agroforestry', abatementBy2030: 0.9, abatementBy2050: 3.4 },
  { lever: 'Direct Air Capture (DACCS)', sector: 'Carbon Removal', potentialMtY: 0.05, costPerTon: 420, maturity: 'Scaling', adoption: 1, description: 'Point-of-atmosphere removal; solid/liquid sorbent', abatementBy2030: 0.05, abatementBy2050: 5.0 },
  { lever: 'Electric Rail Freight', sector: 'Transport', potentialMtY: 0.6, costPerTon: 12, maturity: 'Proven', adoption: 32, description: 'Modal shift road→rail + grid electrification', abatementBy2030: 0.3, abatementBy2050: 1.0 },
  { lever: 'Smart Buildings / BMS', sector: 'Buildings', potentialMtY: 1.4, costPerTon: -18, maturity: 'Proven', adoption: 44, description: 'AI-driven HVAC; occupancy-based control', abatementBy2030: 0.9, abatementBy2050: 2.2 },
  { lever: 'Circular Economy (Materials)', sector: 'Industry', potentialMtY: 1.8, costPerTon: -8, maturity: 'Scaling', adoption: 28, description: 'Reduce primary material demand; recycling', abatementBy2030: 0.8, abatementBy2050: 2.6 },
  { lever: 'Waste Methane Capture', sector: 'Waste', potentialMtY: 1.2, costPerTon: -25, maturity: 'Proven', adoption: 38, description: 'Landfill gas; wastewater biogas', abatementBy2030: 0.8, abatementBy2050: 1.6 },
  { lever: 'Carbon Pricing (ETS)', sector: 'Policy', potentialMtY: 2.4, costPerTon: 0, maturity: 'Proven', adoption: 25, description: 'EU ETS, UK ETS, RGGI, California Cap-and-Trade', abatementBy2030: 1.2, abatementBy2050: 3.2 },
];

const SECTOR_PROFILES = [
  { sector: 'Energy', co2Mt: 14200, targetMt: 7100, trlReadiness: 78, capexBn: 8200, opexSavings: 3400, keyTech: 'RE+H2+CCS', carbonPrice: 85, decarb2030: 28, decarb2050: 85 },
  { sector: 'Transport', co2Mt: 8400, targetMt: 4200, trlReadiness: 65, capexBn: 5600, opexSavings: 1800, keyTech: 'EV+H2+SAF', carbonPrice: 62, decarb2030: 18, decarb2050: 72 },
  { sector: 'Industry', co2Mt: 6800, targetMt: 3400, trlReadiness: 52, capexBn: 9400, opexSavings: 2100, keyTech: 'CCUS+H2+Electrification', carbonPrice: 90, decarb2030: 15, decarb2050: 68 },
  { sector: 'Buildings', co2Mt: 4200, targetMt: 2100, trlReadiness: 72, capexBn: 3200, opexSavings: 1600, keyTech: 'Heat Pumps+Efficiency', carbonPrice: 38, decarb2030: 22, decarb2050: 78 },
  { sector: 'Agriculture', co2Mt: 5800, targetMt: 3480, trlReadiness: 44, capexBn: 1800, opexSavings: 600, keyTech: 'Precision Ag+Regen', carbonPrice: 28, decarb2030: 12, decarb2050: 52 },
  { sector: 'Aviation', co2Mt: 920, targetMt: 460, trlReadiness: 38, capexBn: 1400, opexSavings: 280, keyTech: 'SAF+ZEW+Efficiency', carbonPrice: 180, decarb2030: 8, decarb2050: 62 },
  { sector: 'Shipping', co2Mt: 1080, targetMt: 432, trlReadiness: 42, capexBn: 2200, opexSavings: 380, keyTech: 'NH3+Methanol+H2', carbonPrice: 220, decarb2030: 5, decarb2050: 58 },
  { sector: 'Steel', co2Mt: 2800, targetMt: 1400, trlReadiness: 55, capexBn: 4800, opexSavings: 900, keyTech: 'H2 DRI+EAF', carbonPrice: 120, decarb2030: 14, decarb2050: 72 },
  { sector: 'Cement', co2Mt: 2600, targetMt: 1300, trlReadiness: 48, capexBn: 3200, opexSavings: 620, keyTech: 'CCUS+Alt Binders', carbonPrice: 95, decarb2030: 12, decarb2050: 65 },
  { sector: 'Chemicals', co2Mt: 2200, targetMt: 1100, trlReadiness: 58, capexBn: 3800, opexSavings: 1200, keyTech: 'Green H2+Electrification', carbonPrice: 78, decarb2030: 16, decarb2050: 68 },
  { sector: 'Waste', co2Mt: 1600, targetMt: 640, trlReadiness: 68, capexBn: 900, opexSavings: 420, keyTech: 'Methane Capture+WtE', carbonPrice: 32, decarb2030: 24, decarb2050: 75 },
  { sector: 'Land Use', co2Mt: 5400, targetMt: 2700, trlReadiness: 62, capexBn: 1200, opexSavings: 480, keyTech: 'NbS+Regen Ag', carbonPrice: 18, decarb2030: 20, decarb2050: 80 },
];

const CARBON_PRICE_SCENARIOS = [
  { year: '2020', EU_ETS: 28, UK_ETS: 42, CA_CnT: 22, RGGI: 8, SBTi_Internal: 25, NZ_Required: 80 },
  { year: '2021', EU_ETS: 50, UK_ETS: 62, CA_CnT: 28, RGGI: 10, SBTi_Internal: 38, NZ_Required: 95 },
  { year: '2022', EU_ETS: 78, UK_ETS: 72, CA_CnT: 34, RGGI: 13, SBTi_Internal: 52, NZ_Required: 110 },
  { year: '2023', EU_ETS: 85, UK_ETS: 48, CA_CnT: 38, RGGI: 14, SBTi_Internal: 65, NZ_Required: 130 },
  { year: '2024', EU_ETS: 65, UK_ETS: 50, CA_CnT: 42, RGGI: 15, SBTi_Internal: 80, NZ_Required: 150 },
  { year: '2025', EU_ETS: 72, UK_ETS: 55, CA_CnT: 46, RGGI: 16, SBTi_Internal: 95, NZ_Required: 170 },
  { year: '2030', EU_ETS: 130, UK_ETS: 90, CA_CnT: 75, RGGI: 25, SBTi_Internal: 150, NZ_Required: 250 },
  { year: '2035', EU_ETS: 180, UK_ETS: 120, CA_CnT: 100, RGGI: 35, SBTi_Internal: 200, NZ_Required: 350 },
  { year: '2040', EU_ETS: 250, UK_ETS: 160, CA_CnT: 130, RGGI: 50, SBTi_Internal: 280, NZ_Required: 500 },
];

const PATHWAY_TREND = Array.from({ length: 11 }, (_, i) => {
  const yr = 2020 + i * 2;
  return {
    year: `${yr}`,
    'Committed Path': Math.round(54000 - i * 3800 + sr(i * 7) * 400),
    'Current Pace': Math.round(54000 - i * 1800 + sr(i * 11) * 500),
    '1.5°C Required': Math.round(54000 - i * 4800),
    '2°C Required': Math.round(54000 - i * 3600),
    'Best Practice': Math.round(54000 - i * 5800 + sr(i * 13) * 300),
  };
});

const INVESTMENT_DATA = SECTOR_PROFILES.map((s, i) => ({
  sector: s.sector,
  capex: s.capexBn,
  savings: s.opexSavings,
  roi: +(s.opexSavings / Math.max(1, s.capexBn) * 100).toFixed(1),
}));

const MILESTONES = [
  { year: 2023, event: 'EU ETS reform: linear reduction 4.3% p.a.; Innovation Fund €38Bn', status: 'Completed', type: 'Policy' },
  { year: 2024, event: 'EU CBAM enters transitional phase; free allowances phase-out begins', status: 'Completed', type: 'Policy' },
  { year: 2025, event: 'EU EUDR deforestation regulation enforcement begins', status: 'Active', type: 'Policy' },
  { year: 2025, event: 'SBTi: >10,000 companies with approved targets (current ~8,500)', status: 'Active', type: 'Corporate' },
  { year: 2026, event: 'EU CSDDD supply chain due diligence in force for large companies', status: 'Upcoming', type: 'Policy' },
  { year: 2027, event: 'IMO GHG strategy: 5% zero/near-zero shipping fuels target', status: 'Upcoming', type: 'Sectoral' },
  { year: 2028, event: 'CORSIA Phase 1: aviation offsetting for international growth above 2020', status: 'Upcoming', type: 'Sectoral' },
  { year: 2030, event: 'Net zero by 2030 cohort: 400+ companies committed (Tech/Finance leaders)', status: 'Target', type: 'Corporate' },
  { year: 2030, event: 'EU 55% GHG reduction from 1990 (Fit for 55 package)', status: 'Target', type: 'Policy' },
  { year: 2030, event: 'IEA Net Zero: no new oil/gas/coal fields beyond committed projects', status: 'Target', type: 'Sectoral' },
  { year: 2035, event: 'EU ICE passenger car sales ban (Zero-emission vehicle regulation)', status: 'Target', type: 'Policy' },
  { year: 2040, event: 'Nordic countries + UK target net zero (earlier than global 2050)', status: 'Target', type: 'Corporate' },
  { year: 2045, event: 'Germany legally binding net zero (Climate Protection Act)', status: 'Target', type: 'Policy' },
  { year: 2050, event: 'Global net zero GHG emissions (UNFCCC Paris Agreement)', status: 'Target', type: 'Policy' },
];

const TABS = ['Overview', 'Corporate Tracker', 'Abatement Levers', 'Technology Roadmap', 'Sector Benchmarks', 'Pathway Analysis', 'Investment', 'Carbon Pricing', 'Scenario Planner', 'Milestones', 'Net Zero Registry'];
const SECTOR_F = ['All', ...new Set(CORPORATES.map(c => c.sector))];
const REGION_F = ['All', 'North America', 'Europe', 'Asia-Pacific'];
const STATUS_F = ['All', 'Ahead', 'On Track', 'Behind', 'Off Track'];

const statusColor = s => ({ Ahead: T.green, 'On Track': T.sage, Behind: T.amber, 'Off Track': T.red }[s] || T.textSec);
const maturityColor = m => ({ Proven: T.green, Scaling: T.teal, Demonstration: T.amber, Pilot: T.gold, Research: T.textSec }[m] || T.textSec);
const milestoneColor = s => ({ Completed: T.green, Active: T.sage, Upcoming: T.amber, Target: T.navy }[s] || T.textSec);

export default function DecarbonisationRoadmapPage() {
  const [tab, setTab] = useState('Overview');
  const [sectorF, setSectorF] = useState('All');
  const [regionF, setRegionF] = useState('All');
  const [statusF, setStatusF] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [carbonPriceWif, setCarbonPriceWif] = useState(100);
  const [adoptionWif, setAdoptionWif] = useState(50);
  const [techLever, setTechLever] = useState('Solar + Storage');

  const filtered = useMemo(() => CORPORATES.filter(c => {
    const bySector = sectorF === 'All' || c.sector === sectorF;
    const byRegion = regionF === 'All' || c.region === regionF;
    const byStatus = statusF === 'All' || c.status === statusF;
    const bySearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return bySector && byRegion && byStatus && bySearch;
  }), [sectorF, regionF, statusF, search]);

  const kpis = useMemo(() => {
    const n = Math.max(1, filtered.length);
    const sbtiApproved = filtered.filter(c => c.sbti === 'Approved').length;
    const onTrack = filtered.filter(c => c.status === 'On Track' || c.status === 'Ahead').length;
    const avgCarbonPrice = Math.round(filtered.reduce((s, c) => s + c.carbonPrice, 0) / n);
    const totalInvest = Math.round(filtered.reduce((s, c) => s + c.investMn, 0) / 1000);
    return { count: n, sbtiApproved, onTrack, avgCarbonPrice, totalInvest };
  }, [filtered]);

  const scenarioAbatement = useMemo(() => {
    const lever = ABATEMENT_LEVERS.find(l => l.lever === techLever);
    if (!lever) return { base: 0, scenario: 0 };
    const base = lever.abatementBy2030;
    const factor = (carbonPriceWif / 100) * (adoptionWif / 50);
    return { base, scenario: +(base * factor).toFixed(2), lever };
  }, [carbonPriceWif, adoptionWif, techLever]);

  const tabBtn = t => ({
    padding: '6px 14px', border: `1px solid ${tab === t ? T.navy : T.border}`,
    borderRadius: 6, fontSize: 11, fontFamily: T.font, cursor: 'pointer',
    background: tab === t ? T.navy : T.surface, color: tab === t ? '#0f172a' : T.textSec, fontWeight: tab === t ? 600 : 400,
  });
  const thS = { padding: '8px 10px', fontSize: 11, fontFamily: T.mono, color: T.textSec, borderBottom: `1px solid ${T.border}`, textAlign: 'left', background: T.surfaceH };
  const tdS = { padding: '7px 10px', fontSize: 12, fontFamily: T.font, borderBottom: `1px solid ${T.border}`, color: T.text };
  const selS = { padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, fontFamily: T.font, background: T.surface, color: T.text };
  const inpS = { padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, fontFamily: T.font, background: T.surface, color: T.text, outline: 'none', width: 170 };
  const slS = { width: '100%', accentColor: T.navy };

  return (
    <div style={{ padding: '24px 32px', fontFamily: T.font, background: T.bg, minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0 }}>Decarbonisation Roadmap Intelligence</h1>
        <p style={{ fontSize: 12, color: T.textSec, margin: '4px 0 0' }}>60 corporates · 30 abatement levers · 12 sector profiles · Carbon pricing engine · Scenario planner</p>
      </div>
      <div style={{ display: 'flex', gap: 7, marginBottom: 18, flexWrap: 'wrap' }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={tabBtn(t)}>{t}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company..." style={inpS} />
        <select value={sectorF} onChange={e => setSectorF(e.target.value)} style={selS}>{SECTOR_F.map(s => <option key={s}>{s}</option>)}</select>
        <select value={regionF} onChange={e => setRegionF(e.target.value)} style={selS}>{REGION_F.map(r => <option key={r}>{r}</option>)}</select>
        <select value={statusF} onChange={e => setStatusF(e.target.value)} style={selS}>{STATUS_F.map(s => <option key={s}>{s}</option>)}</select>
        <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.mono }}>{kpis.count} companies</span>
      </div>

      {tab === 'Overview' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Companies" value={kpis.count} />
            <KpiCard label="SBTi Approved" value={kpis.sbtiApproved} color={T.green} sub={`${Math.round(kpis.sbtiApproved/Math.max(1,kpis.count)*100)}% of filtered`} />
            <KpiCard label="On Track / Ahead" value={kpis.onTrack} color={T.sage} />
            <KpiCard label="Avg Internal Carbon Price" value={`$${kpis.avgCarbonPrice}`} color={T.gold} sub="$/tCO₂e" />
            <KpiCard label="Total Decarbonisation CAPEX" value={`$${kpis.totalInvest}Bn`} color={T.teal} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Status Distribution</div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={[
                    { n: 'Ahead', v: filtered.filter(c => c.status === 'Ahead').length },
                    { n: 'On Track', v: filtered.filter(c => c.status === 'On Track').length },
                    { n: 'Behind', v: filtered.filter(c => c.status === 'Behind').length },
                    { n: 'Off Track', v: filtered.filter(c => c.status === 'Off Track').length },
                  ].filter(d => d.v > 0)} cx="50%" cy="50%" outerRadius={90} dataKey="v" nameKey="n" label={({ n, v }) => `${n}: ${v}`}>
                    {[T.green, T.sage, T.amber, T.red].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip {...tip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Investment by Sector ($Mn)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={Object.entries(filtered.reduce((m, c) => { m[c.sector] = (m[c.sector] || 0) + c.investMn; return m; }, {})).map(([sector, investMn]) => ({ sector, investMn })).sort((a, b) => b.investMn - a.investMn).slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 8, fill: T.textSec }} angle={-20} textAnchor="end" height={44} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="investMn" fill={T.navy} radius={[4, 4, 0, 0]} name="Investment $Mn" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Global Emissions Pathway — Committed vs Required</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={PATHWAY_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} unit=" MtCO₂" />
                <Tooltip {...tip} />
                <Legend />
                <Line type="monotone" dataKey="Committed Path" stroke={T.navy} strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="Current Pace" stroke={T.red} strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="1.5°C Required" stroke={T.green} strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="2°C Required" stroke={T.amber} strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="Best Practice" stroke={T.sage} strokeWidth={1} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Corporate Tracker' && (
        <div style={{ ...cS, padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Company', 'Sector', 'Region', 'Baseline MtCO₂', 'Current', '2030 Target', 'Net Zero Yr', 'SBTi', 'Carbon Price $', 'Investment $Mn', 'Abatement Strategy', 'Status'].map(h => <th key={h} style={thS}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} onClick={() => setSelected(selected?.name === c.name ? null : c)} style={{ cursor: 'pointer', background: selected?.name === c.name ? T.surfaceH : 'transparent' }}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{c.name}</td>
                  <td style={tdS}>{c.sector}</td>
                  <td style={tdS}>{c.region}</td>
                  <td style={{ ...tdS, fontFamily: T.mono }}>{c.baseline.toLocaleString()}</td>
                  <td style={{ ...tdS, fontFamily: T.mono }}>{c.current.toLocaleString()}</td>
                  <td style={{ ...tdS, fontFamily: T.mono }}>{c.target2030.toLocaleString()}</td>
                  <td style={{ ...tdS, fontFamily: T.mono }}>{c.netZeroYear}</td>
                  <td style={tdS}><span style={{ color: c.sbti === 'Approved' ? T.green : c.sbti === 'Committed' ? T.amber : T.textMut, fontSize: 11 }}>{c.sbti}</span></td>
                  <td style={{ ...tdS, fontFamily: T.mono }}>${c.carbonPrice}</td>
                  <td style={{ ...tdS, fontFamily: T.mono }}>{c.investMn.toLocaleString()}</td>
                  <td style={{ ...tdS, fontSize: 10 }}>{c.abatement}</td>
                  <td style={tdS}><span style={{ color: statusColor(c.status), fontWeight: 600, fontSize: 11 }}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {selected && (
            <div style={{ padding: 16, borderTop: `1px solid ${T.border}`, background: T.surfaceH }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>{selected.name} — {selected.sector}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {[['Baseline', selected.baseline.toLocaleString() + ' Mt'], ['Current', selected.current.toLocaleString() + ' Mt'], ['2030 Target', selected.target2030.toLocaleString() + ' Mt'], ['Net Zero', selected.netZeroYear], ['Scope 3', selected.scope3 + ' Mt'], ['Reduction %', selected.reductionPct + '%'], ['Carbon Price', '$' + selected.carbonPrice]].map(([k, v], j) => (
                  <div key={j} style={{ background: T.surface, borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, color: T.textMut, fontFamily: T.mono }}>{k}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'Abatement Levers' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Abatement Potential 2030 (MtCO₂/yr) — Top 20</div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={[...ABATEMENT_LEVERS].sort((a, b) => b.abatementBy2030 - a.abatementBy2030).slice(0, 20)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis type="category" dataKey="lever" tick={{ fontSize: 8, fill: T.textSec }} width={160} />
                  <Tooltip {...tip} />
                  <Bar dataKey="abatementBy2030" radius={[0, 4, 4, 0]}>
                    {[...ABATEMENT_LEVERS].sort((a, b) => b.abatementBy2030 - a.abatementBy2030).slice(0, 20).map((l, i) => <Cell key={i} fill={l.costPerTon < 0 ? T.green : l.costPerTon < 50 ? T.sage : l.costPerTon < 150 ? T.amber : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Abatement Cost vs Potential (Marginal Cost Curve)</div>
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Potential MtCO₂" tick={{ fontSize: 9, fill: T.textSec }} label={{ value: 'Potential (MtCO₂/yr)', position: 'bottom', fontSize: 9, fill: T.textSec }} />
                  <YAxis dataKey="y" name="Cost $/tCO₂" tick={{ fontSize: 9, fill: T.textSec }} label={{ value: '$/tCO₂', angle: -90, position: 'left', fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} content={({ active, payload }) => active && payload?.length ? (
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 11 }}>
                      <div style={{ color: T.text, fontWeight: 600 }}>{payload[0]?.payload?.name}</div>
                      <div style={{ color: T.textSec }}>Potential: {payload[0]?.payload?.x} Mt | Cost: ${payload[0]?.payload?.y}/t</div>
                    </div>
                  ) : null} />
                  <Scatter data={ABATEMENT_LEVERS.map(l => ({ name: l.lever, x: l.abatementBy2030, y: l.costPerTon }))} fill={T.teal} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ ...cS, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Lever', 'Sector', 'Potential Mt/yr', 'Cost $/t', 'Maturity', 'Adoption %', '2030 Abatement Mt', '2050 Potential Mt'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {ABATEMENT_LEVERS.map((l, i) => (
                  <tr key={i}>
                    <td style={{ ...tdS, fontWeight: 600, fontSize: 11 }}>{l.lever}</td>
                    <td style={tdS}>{l.sector}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{l.potentialMtY}</td>
                    <td style={{ ...tdS, fontFamily: T.mono, color: l.costPerTon < 0 ? T.green : l.costPerTon < 50 ? T.sage : l.costPerTon < 150 ? T.amber : T.red }}>${l.costPerTon}</td>
                    <td style={tdS}><span style={{ color: maturityColor(l.maturity), fontSize: 11 }}>{l.maturity}</span></td>
                    <td style={tdS}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 50, height: 4, background: T.border, borderRadius: 2 }}><div style={{ width: `${l.adoption}%`, height: '100%', background: T.teal, borderRadius: 2 }} /></div><span style={{ fontSize: 10 }}>{l.adoption}%</span></div></td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{l.abatementBy2030}</td>
                    <td style={{ ...tdS, fontFamily: T.mono }}>{l.abatementBy2050}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Technology Roadmap' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Technology Readiness by Sector</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={SECTOR_PROFILES}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 8, fill: T.textSec }} angle={-20} textAnchor="end" height={44} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} domain={[0, 100]} />
                  <Tooltip {...tip} />
                  <Bar dataKey="trlReadiness" radius={[4, 4, 0, 0]} name="TRL Readiness %">
                    {SECTOR_PROFILES.map((s, i) => <Cell key={i} fill={s.trlReadiness > 65 ? T.green : s.trlReadiness > 50 ? T.sage : s.trlReadiness > 40 ? T.amber : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>2030 vs 2050 Decarbonisation Progress (%)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={SECTOR_PROFILES}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 8, fill: T.textSec }} angle={-20} textAnchor="end" height={44} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} domain={[0, 100]} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Bar dataKey="decarb2030" fill={T.amber} name="2030 %" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="decarb2050" fill={T.sage} name="2050 %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>Sector Technology Profiles</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {SECTOR_PROFILES.map((s, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${COLORS[i % COLORS.length]}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{s.sector}</div>
                  <div style={{ fontSize: 10, color: T.textSec, marginTop: 4 }}>Key Tech: <span style={{ color: T.text }}>{s.keyTech}</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 6 }}>
                    {[['Emissions', `${s.co2Mt.toLocaleString()} Mt`], ['2030 Target', `${s.targetMt.toLocaleString()} Mt`], ['CAPEX', `$${s.capexBn}Bn`], ['C Price', `$${s.carbonPrice}/t`]].map(([k, v], j) => (
                      <div key={j} style={{ fontSize: 9, color: T.textMut }}>{k}: <span style={{ color: T.text, fontWeight: 600 }}>{v}</span></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Sector Benchmarks' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Avg Internal Carbon Price by Sector ($)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(filtered.reduce((m, c) => { if (!m[c.sector]) m[c.sector] = []; m[c.sector].push(c.carbonPrice); return m; }, {})).map(([sector, prices]) => ({ sector, avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) })).sort((a, b) => b.avg - a.avg)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 8, fill: T.textSec }} angle={-20} textAnchor="end" height={44} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="avg" fill={T.gold} radius={[4, 4, 0, 0]} name="Avg Carbon Price $" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Carbon Price vs Investment ($Mn) per Company</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Carbon Price" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis dataKey="y" name="Investment" tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} content={({ active, payload }) => active && payload?.length ? (
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 11 }}>
                      <div style={{ color: T.text, fontWeight: 600 }}>{payload[0]?.payload?.name}</div>
                      <div style={{ color: T.textSec }}>Carbon Price: ${payload[0]?.payload?.x} | Invest: ${payload[0]?.payload?.y}Mn</div>
                    </div>
                  ) : null} />
                  <Scatter data={filtered.map(c => ({ name: c.name, x: c.carbonPrice, y: c.investMn }))} fill={T.teal} fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Pathway Analysis' && (
        <div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Global GHG Pathway 2020–2040 (MtCO₂e)</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={PATHWAY_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Legend />
                <Line type="monotone" dataKey="Committed Path" stroke={T.navy} strokeWidth={2} />
                <Line type="monotone" dataKey="Current Pace" stroke={T.red} strokeWidth={2} />
                <Line type="monotone" dataKey="1.5°C Required" stroke={T.green} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="2°C Required" stroke={T.amber} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="Best Practice" stroke={T.sage} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...cS, marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Emission Gap 2030 — Committed vs 1.5°C Required</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SECTOR_PROFILES.map(s => ({ sector: s.sector, required: Math.round(s.co2Mt * (1 - s.decarb2030 / 100)), committed: Math.round(s.targetMt), gap: Math.round(s.targetMt - s.co2Mt * (1 - s.decarb2030 / 100)) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 8, fill: T.textSec }} angle={-15} textAnchor="end" height={44} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Legend />
                <Bar dataKey="required" fill={T.sage} name="1.5°C Required" radius={[4, 4, 0, 0]} />
                <Bar dataKey="committed" fill={T.navy} name="Committed Target" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Investment' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Total CAPEX (filtered)" value={`$${(filtered.reduce((s, c) => s + c.investMn, 0) / 1000).toFixed(0)}Bn`} color={T.navy} />
            <KpiCard label="Avg CAPEX per Company" value={`$${Math.round(filtered.reduce((s, c) => s + c.investMn, 0) / Math.max(1, filtered.length))}Mn`} color={T.teal} />
            <KpiCard label="Sector CAPEX (Total)" value={`$${(SECTOR_PROFILES.reduce((s, p) => s + p.capexBn, 0)).toLocaleString()}Bn`} color={T.gold} sub="global estimate" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Sector CAPEX vs OPEX Savings ($Bn)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={INVESTMENT_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 8, fill: T.textSec }} angle={-20} textAnchor="end" height={44} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Bar dataKey="capex" fill={T.navy} name="CAPEX $Bn" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="savings" fill={T.sage} name="OPEX Savings $Bn" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>ROI on Decarbonisation CAPEX (%)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={INVESTMENT_DATA.sort((a, b) => b.roi - a.roi)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis type="category" dataKey="sector" tick={{ fontSize: 9, fill: T.textSec }} width={80} />
                  <Tooltip {...tip} />
                  <Bar dataKey="roi" fill={T.gold} radius={[0, 4, 4, 0]} name="ROI %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Carbon Pricing' && (
        <div>
          <div style={cS}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Carbon Price Trajectory 2020–2040 ($/tCO₂e)</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={CARBON_PRICE_SCENARIOS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="year" tick={{ fontSize: 9, fill: T.textSec }} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Legend />
                <Line type="monotone" dataKey="EU_ETS" stroke={T.navy} strokeWidth={2} name="EU ETS" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="UK_ETS" stroke={T.teal} strokeWidth={2} name="UK ETS" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="CA_CnT" stroke={T.sage} strokeWidth={2} name="CA Cap & Trade" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="SBTi_Internal" stroke={T.gold} strokeWidth={2} name="SBTi Internal" dot={{ r: 3 }} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="NZ_Required" stroke={T.red} strokeWidth={1.5} name="NZ Required" dot={false} strokeDasharray="2 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...cS, marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>Internal Carbon Price by Company (Top 30)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[...filtered].sort((a, b) => b.carbonPrice - a.carbonPrice).slice(0, 25)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: T.textSec }} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                <Tooltip {...tip} />
                <Bar dataKey="carbonPrice" radius={[4, 4, 0, 0]} name="Internal C Price $">
                  {[...filtered].sort((a, b) => b.carbonPrice - a.carbonPrice).slice(0, 25).map((c, i) => <Cell key={i} fill={c.carbonPrice > 100 ? T.green : c.carbonPrice > 60 ? T.sage : c.carbonPrice > 40 ? T.amber : T.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Scenario Planner' && (
        <div>
          <div style={{ ...cS, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 14 }}>Abatement Lever What-If Calculator</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Select Lever</div>
                <select value={techLever} onChange={e => setTechLever(e.target.value)} style={{ ...selS, width: '100%' }}>
                  {ABATEMENT_LEVERS.map(l => <option key={l.lever}>{l.lever}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Carbon Price Scenario: <strong style={{ color: T.text }}>${carbonPriceWif}/t</strong></div>
                <input type="range" min={20} max={500} value={carbonPriceWif} onChange={e => setCarbonPriceWif(+e.target.value)} style={slS} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Adoption Acceleration: <strong style={{ color: T.text }}>{adoptionWif}%</strong></div>
                <input type="range" min={10} max={100} value={adoptionWif} onChange={e => setAdoptionWif(+e.target.value)} style={slS} />
              </div>
            </div>
            {scenarioAbatement.lever && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <KpiCard label="Base Abatement 2030" value={`${scenarioAbatement.base} Mt`} color={T.textSec} />
                <KpiCard label="Scenario Abatement 2030" value={`${scenarioAbatement.scenario} Mt`} color={scenarioAbatement.scenario > scenarioAbatement.base ? T.green : T.amber} />
                <KpiCard label="Delta" value={`${(scenarioAbatement.scenario - scenarioAbatement.base).toFixed(2)} Mt`} color={scenarioAbatement.scenario > scenarioAbatement.base ? T.green : T.red} />
                <KpiCard label="Required Carbon Price" value={`$${Math.max(0, scenarioAbatement.lever.costPerTon)}/t`} color={T.gold} />
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Scenario Comparison: 1.5°C vs 2°C vs Current Policies (GtCO₂)</div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={Array.from({ length: 11 }, (_, i) => ({
                  year: `${2020 + i * 3}`,
                  '1.5°C Pathway': +(54 - i * 4.6).toFixed(1),
                  '2°C Pathway': +(54 - i * 3.2).toFixed(1),
                  'Current Policies': +(54 + i * 0.4).toFixed(1),
                  'Announced Pledges': +(54 - i * 1.8).toFixed(1),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Area type="monotone" dataKey="Current Policies" stroke={T.red} fill={T.red} fillOpacity={0.15} />
                  <Area type="monotone" dataKey="Announced Pledges" stroke={T.amber} fill={T.amber} fillOpacity={0.15} />
                  <Area type="monotone" dataKey="2°C Pathway" stroke={T.sage} fill={T.sage} fillOpacity={0.2} />
                  <Area type="monotone" dataKey="1.5°C Pathway" stroke={T.green} fill={T.green} fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Emissions Gap by Scenario (GtCO₂ in 2030)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { scenario: 'Current Policies', gap: 20, required: 27, actual: 57 },
                  { scenario: 'Announced Pledges', gap: 11, required: 27, actual: 45 },
                  { scenario: 'NDCs (Cond.)', gap: 6, required: 27, actual: 40 },
                  { scenario: '2°C Pathway', gap: 0, required: 34, actual: 34 },
                  { scenario: '1.5°C Pathway', gap: 0, required: 27, actual: 27 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="scenario" tick={{ fontSize: 8, fill: T.textSec }} angle={-15} textAnchor="end" height={48} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} />
                  <Legend />
                  <Bar dataKey="actual" fill={T.red} name="Projected GtCO₂" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="required" fill={T.green} name="Required GtCO₂" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Milestones' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>Net Zero Milestone Timeline</div>
              {MILESTONES.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 38, fontFamily: T.mono, fontSize: 11, color: T.gold, fontWeight: 700 }}>{m.year}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: T.text }}>{m.event}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <span style={{ background: milestoneColor(m.status) + '20', color: milestoneColor(m.status), padding: '1px 6px', borderRadius: 4, fontSize: 9, fontFamily: T.mono }}>{m.status}</span>
                      <span style={{ background: T.border, color: T.textSec, padding: '1px 6px', borderRadius: 4, fontSize: 9, fontFamily: T.mono }}>{m.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Net Zero Target Year Distribution</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={[
                    { n: '≤2030', v: filtered.filter(c => c.netZeroYear <= 2030).length },
                    { n: '2031–2039', v: filtered.filter(c => c.netZeroYear > 2030 && c.netZeroYear < 2040).length },
                    { n: '2040–2049', v: filtered.filter(c => c.netZeroYear >= 2040 && c.netZeroYear < 2050).length },
                    { n: '2050', v: filtered.filter(c => c.netZeroYear === 2050).length },
                    { n: '>2050', v: filtered.filter(c => c.netZeroYear > 2050).length },
                  ].filter(d => d.v > 0)} cx="50%" cy="50%" outerRadius={95} dataKey="v" nameKey="n" label={({ n, v }) => `${n}: ${v}`}>
                    {[T.green, T.sage, T.teal, T.amber, T.red].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip {...tip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'Net Zero Registry' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <KpiCard label="Total Commitments" value={filtered.length} />
            <KpiCard label="SBTi Science-Based" value={filtered.filter(c => c.sbti !== 'None').length} color={T.green} />
            <KpiCard label="Avg Reduction Pace" value={`${(filtered.reduce((s, c) => s + c.reductionPct, 0) / Math.max(1, filtered.length)).toFixed(1)}%`} color={T.sage} sub="YoY" />
            <KpiCard label="Committed Total CAPEX" value={`$${(filtered.reduce((s, c) => s + c.investMn, 0) / 1000).toFixed(0)}Bn`} color={T.gold} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Scope 3 vs Scope 1+2 Emissions</div>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="x" name="Scope 1+2" tick={{ fontSize: 9, fill: T.textSec }} />
                  <YAxis dataKey="y" name="Scope 3" tick={{ fontSize: 9, fill: T.textSec }} />
                  <Tooltip {...tip} content={({ active, payload }) => active && payload?.length ? (
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, fontSize: 11 }}>
                      <div style={{ color: T.text, fontWeight: 600 }}>{payload[0]?.payload?.name}</div>
                      <div style={{ color: T.textSec }}>S1+2: {payload[0]?.payload?.x} Mt | S3: {payload[0]?.payload?.y} Mt</div>
                    </div>
                  ) : null} />
                  <Scatter data={filtered.map(c => ({ name: c.name, x: c.current, y: c.scope3 }))} fill={T.navy} fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={cS}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Reduction Progress (Current vs 2030 Target)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[...filtered].sort((a, b) => (1 - b.current / Math.max(1, b.baseline)) - (1 - a.current / Math.max(1, a.baseline))).slice(0, 20)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: T.textSec }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 9, fill: T.textSec }} domain={[0, 100]} unit="%" />
                  <Tooltip {...tip} />
                  <Legend />
                  <Bar dataKey="reductionPct" fill={T.sage} name="Achieved Reduction %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
