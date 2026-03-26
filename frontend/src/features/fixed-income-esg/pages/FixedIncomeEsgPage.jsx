import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie, ReferenceLine, AreaChart, Area, ScatterChart, Scatter, ZAxis } from 'recharts';
import { GLOBAL_COMPANY_MASTER, EXCHANGES, globalSearch } from '../../../data/globalCompanyMaster';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

/* ══════════════════════════════════════════════════════════════
   BOND TYPES — 11 categories per ICMA / CBI taxonomy
   ══════════════════════════════════════════════════════════════ */
const BOND_TYPES = {
  'Green Bond': { color: '#16a34a', description: 'Use of proceeds for green projects per ICMA GBP' },
  'Social Bond': { color: '#7c3aed', description: 'Use of proceeds for social projects per ICMA SBP' },
  'Sustainability Bond': { color: '#0d9488', description: 'Combined green + social per ICMA SBG' },
  'SLB': { color: '#d97706', description: 'Sustainability-Linked Bond with KPI targets per ICMA SLBP' },
  'Transition Bond': { color: '#dc2626', description: 'Finance transition to lower carbon for hard-to-abate sectors' },
  'Blue Bond': { color: '#2563eb', description: 'Ocean and marine conservation projects' },
  'Sovereign Green': { color: '#1b3a5c', description: 'Government-issued green bond' },
  'Sovereign Sustainability': { color: '#4b5563', description: 'Government-issued sustainability bond' },
  'Climate Awareness Bond': { color: '#0284c7', description: 'MDB climate finance' },
  'Gender Bond': { color: '#ec4899', description: 'Advance gender equality objectives' },
  'SDG Bond': { color: '#f59e0b', description: 'Aligned to specific UN Sustainable Development Goals' },
};

const BOND_TYPE_COLORS = {};
Object.entries(BOND_TYPES).forEach(([k, v]) => { BOND_TYPE_COLORS[k] = v.color; });

const PIE_COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#0284c7','#7c3aed','#0d9488','#d97706','#dc2626','#2563eb','#ec4899','#f59e0b','#4b5563','#6b7280'];

/* ══════════════════════════════════════════════════════════════
   CBI TAXONOMY SECTORS (all 8 + Multiple)
   ══════════════════════════════════════════════════════════════ */
const CBI_SECTORS = ['All','Energy','Transport','Water','Buildings','Land Use & Marine','Industry','Waste & Pollution','ICT','Multiple'];

/* ══════════════════════════════════════════════════════════════
   FRAMEWORK COMPLIANCE KEYS
   ══════════════════════════════════════════════════════════════ */
const FRAMEWORKS = ['ICMA GBP','ICMA SBP','ICMA SBG','ICMA SLBP','CBI Standard','EU GBS','PBoC Catalogue'];

/* ══════════════════════════════════════════════════════════════
   80+ BOND UNIVERSE — organised by CBI taxonomy
   Every bond: id, issuer, type, subtype, cbi_sector, cbi_certified, currency, coupon, maturity, size_mn, rating, esgScore, useOfProceeds, framework, spo, greenium_bps, yield, country, issue_year, isin_prefix, sdgs, frameworks_compliance
   ══════════════════════════════════════════════════════════════ */
const GREEN_BOND_UNIVERSE = [
  // ── SOVEREIGN BONDS (15) ──
  { id:'SV001', issuer:'Republic of France (OAT Verte)', type:'Sovereign Green', subtype:'Sovereign', cbi_sector:'Multiple', cbi_certified:false, currency:'EUR', coupon:1.75, maturity:'2039', size_mn:32400, rating:'AA', esgScore:82, useOfProceeds:'Energy efficiency, renewable energy, biodiversity, transport', framework:'ICMA GBP', spo:"Moody's", greenium_bps:-8, yield:2.85, country:'France', issue_year:2021, isin_prefix:'FR00', sdgs:[7,11,13,15], frameworks_compliance:['ICMA GBP','EU GBS'] },
  { id:'SV002', issuer:'Federal Republic of Germany (Green Bund)', type:'Sovereign Green', subtype:'Sovereign', cbi_sector:'Multiple', cbi_certified:false, currency:'EUR', coupon:0.00, maturity:'2031', size_mn:11500, rating:'AAA', esgScore:90, useOfProceeds:'Transport, energy, international cooperation', framework:'Twin Bond + ICMA GBP', spo:'ISS ESG', greenium_bps:-6, yield:2.38, country:'Germany', issue_year:2020, isin_prefix:'DE00', sdgs:[7,9,13], frameworks_compliance:['ICMA GBP','EU GBS'] },
  { id:'SV003', issuer:'United Kingdom (Green Gilt)', type:'Sovereign Green', subtype:'Sovereign', cbi_sector:'Multiple', cbi_certified:false, currency:'GBP', coupon:0.875, maturity:'2033', size_mn:16000, rating:'AA', esgScore:80, useOfProceeds:'Clean transport, renewables, nature-based solutions', framework:'UK Green Financing Framework', spo:'Vigeo Eiris', greenium_bps:-7, yield:3.92, country:'UK', issue_year:2021, isin_prefix:'GB00', sdgs:[7,11,13,15], frameworks_compliance:['ICMA GBP'] },
  { id:'SV004', issuer:'Republic of Italy (BTP Green)', type:'Sovereign Green', subtype:'Sovereign', cbi_sector:'Multiple', cbi_certified:false, currency:'EUR', coupon:1.50, maturity:'2045', size_mn:8500, rating:'BBB', esgScore:68, useOfProceeds:'Renewable energy, transport, research, biodiversity', framework:'ICMA GBP', spo:'Vigeo Eiris', greenium_bps:-5, yield:4.12, country:'Italy', issue_year:2021, isin_prefix:'IT00', sdgs:[7,9,13], frameworks_compliance:['ICMA GBP','EU GBS'] },
  { id:'SV005', issuer:'Kingdom of Spain (Green Bond)', type:'Sovereign Green', subtype:'Sovereign', cbi_sector:'Multiple', cbi_certified:false, currency:'EUR', coupon:1.00, maturity:'2042', size_mn:5000, rating:'A', esgScore:74, useOfProceeds:'Sustainable transport, renewable energy, energy efficiency', framework:'ICMA GBP', spo:'Sustainalytics', greenium_bps:-5, yield:3.68, country:'Spain', issue_year:2022, isin_prefix:'ES00', sdgs:[7,11,13], frameworks_compliance:['ICMA GBP','EU GBS'] },
  { id:'SV006', issuer:'Kingdom of Netherlands (Green Bond)', type:'Sovereign Green', subtype:'Sovereign', cbi_sector:'Multiple', cbi_certified:false, currency:'EUR', coupon:0.50, maturity:'2040', size_mn:21300, rating:'AAA', esgScore:88, useOfProceeds:'Climate adaptation, renewable energy, biodiversity', framework:'ICMA GBP', spo:'Sustainalytics', greenium_bps:-10, yield:2.68, country:'Netherlands', issue_year:2019, isin_prefix:'NL00', sdgs:[6,7,13,15], frameworks_compliance:['ICMA GBP','EU GBS'] },
  { id:'SV007', issuer:'Republic of Chile (Green Bond)', type:'Sovereign Green', subtype:'Sovereign', cbi_sector:'Multiple', cbi_certified:false, currency:'USD', coupon:3.25, maturity:'2032', size_mn:4200, rating:'A', esgScore:71, useOfProceeds:'Clean transport, renewable energy, water management', framework:'ICMA GBP', spo:'Sustainalytics', greenium_bps:-6, yield:4.45, country:'Chile', issue_year:2022, isin_prefix:'CL00', sdgs:[6,7,11,13], frameworks_compliance:['ICMA GBP'] },
  { id:'SV008', issuer:'Republic of Indonesia (SDG Bond)', type:'SDG Bond', subtype:'Sovereign', cbi_sector:'Multiple', cbi_certified:false, currency:'USD', coupon:4.15, maturity:'2031', size_mn:1750, rating:'BBB', esgScore:55, useOfProceeds:'Education, health, renewable energy, poverty reduction', framework:'SDG Government Securities Framework', spo:'CICERO', greenium_bps:-3, yield:5.35, country:'Indonesia', issue_year:2023, isin_prefix:'ID00', sdgs:[1,3,4,7], frameworks_compliance:['ICMA GBP','ICMA SBG'] },
  { id:'SV009', issuer:'United Mexican States (Sustainability)', type:'Sovereign Sustainability', subtype:'Sovereign', cbi_sector:'Multiple', cbi_certified:false, currency:'EUR', coupon:1.35, maturity:'2034', size_mn:1500, rating:'BBB', esgScore:56, useOfProceeds:'Social programs, clean transport, renewable energy', framework:'ICMA SBG', spo:'Sustainalytics', greenium_bps:-4, yield:4.85, country:'Mexico', issue_year:2023, isin_prefix:'MX00', sdgs:[1,7,10,11], frameworks_compliance:['ICMA SBG'] },
  { id:'SV010', issuer:'Arab Republic of Egypt (Green Bond)', type:'Sovereign Green', subtype:'Sovereign', cbi_sector:'Transport', cbi_certified:false, currency:'USD', coupon:5.25, maturity:'2027', size_mn:750, rating:'B+', esgScore:42, useOfProceeds:'Clean transport (Cairo monorail), water treatment', framework:'ICMA GBP', spo:'Vigeo Eiris', greenium_bps:-2, yield:8.15, country:'Egypt', issue_year:2020, isin_prefix:'EG00', sdgs:[6,7,11], frameworks_compliance:['ICMA GBP'] },
  { id:'SV011', issuer:'Republic of Colombia (Green Bond)', type:'Sovereign Green', subtype:'Sovereign', cbi_sector:'Multiple', cbi_certified:false, currency:'USD', coupon:3.875, maturity:'2031', size_mn:1500, rating:'BB+', esgScore:54, useOfProceeds:'Biodiversity protection, sustainable transport, reforestation', framework:'ICMA GBP', spo:'Sustainalytics', greenium_bps:-3, yield:6.25, country:'Colombia', issue_year:2023, isin_prefix:'CO00', sdgs:[11,13,15], frameworks_compliance:['ICMA GBP'] },
  { id:'SV012', issuer:'Republic of Kenya (Sustainability)', type:'Sovereign Sustainability', subtype:'Sovereign', cbi_sector:'Multiple', cbi_certified:false, currency:'USD', coupon:6.30, maturity:'2034', size_mn:500, rating:'B', esgScore:40, useOfProceeds:'Solar energy, water infrastructure, education', framework:'ICMA SBG', spo:'CICERO', greenium_bps:-2, yield:9.45, country:'Kenya', issue_year:2024, isin_prefix:'KE00', sdgs:[4,6,7], frameworks_compliance:['ICMA SBG'] },
  { id:'SV013', issuer:'Republic of Singapore (Green Bond)', type:'Sovereign Green', subtype:'Sovereign', cbi_sector:'Buildings', cbi_certified:false, currency:'SGD', coupon:2.25, maturity:'2032', size_mn:2400, rating:'AAA', esgScore:86, useOfProceeds:'Green buildings, sustainable transport, coastal protection', framework:'Singapore Green Bond Framework', spo:'Sustainalytics', greenium_bps:-5, yield:2.82, country:'Singapore', issue_year:2022, isin_prefix:'SG00', sdgs:[9,11,13], frameworks_compliance:['ICMA GBP'] },
  { id:'SV014', issuer:'Government of Japan (GX Transition Bond)', type:'Transition Bond', subtype:'Sovereign', cbi_sector:'Energy', cbi_certified:false, currency:'JPY', coupon:0.50, maturity:'2033', size_mn:1600000, rating:'A+', esgScore:72, useOfProceeds:'GX strategy: hydrogen, ammonia, nuclear, CCS', framework:'Japan GX Economy Transition Bonds', spo:'DNV', greenium_bps:-3, yield:0.92, country:'Japan', issue_year:2024, isin_prefix:'JP00', sdgs:[7,9,13], frameworks_compliance:['ICMA GBP'] },
  { id:'SV015', issuer:'Republic of Korea (Green Bond)', type:'Sovereign Green', subtype:'Sovereign', cbi_sector:'Energy', cbi_certified:false, currency:'KRW', coupon:3.10, maturity:'2032', size_mn:3000000, rating:'AA', esgScore:78, useOfProceeds:'Renewables, EV infrastructure, green buildings', framework:'Korea Green Bond Framework', spo:'Sustainalytics', greenium_bps:-4, yield:3.45, country:'South Korea', issue_year:2023, isin_prefix:'KR00', sdgs:[7,9,11], frameworks_compliance:['ICMA GBP'] },

  // ── MDB / SUPRANATIONAL (8) ──
  { id:'MDB01', issuer:'World Bank (IBRD)', type:'Green Bond', subtype:'Supranational', cbi_sector:'Multiple', cbi_certified:true, currency:'USD', coupon:2.50, maturity:'2028', size_mn:5000, rating:'AAA', esgScore:95, useOfProceeds:'Climate change mitigation and adaptation globally', framework:'World Bank Green Bond Framework', spo:'CICERO', greenium_bps:-15, yield:3.18, country:'Supranational', issue_year:2022, isin_prefix:'XS00', sdgs:[7,13], frameworks_compliance:['ICMA GBP','CBI Standard'] },
  { id:'MDB02', issuer:'European Investment Bank (CAB)', type:'Climate Awareness Bond', subtype:'Supranational', cbi_sector:'Multiple', cbi_certified:true, currency:'EUR', coupon:0.50, maturity:'2033', size_mn:15000, rating:'AAA', esgScore:93, useOfProceeds:'Renewable energy, energy efficiency across EU', framework:'EIB CAB Framework', spo:'CICERO', greenium_bps:-12, yield:2.42, country:'Supranational', issue_year:2021, isin_prefix:'XS00', sdgs:[7,9,13], frameworks_compliance:['ICMA GBP','CBI Standard'] },
  { id:'MDB03', issuer:'International Finance Corporation', type:'Green Bond', subtype:'Supranational', cbi_sector:'Multiple', cbi_certified:true, currency:'USD', coupon:2.75, maturity:'2029', size_mn:2000, rating:'AAA', esgScore:91, useOfProceeds:'Private sector climate investments in emerging markets', framework:'IFC Green Bond Framework', spo:'CICERO', greenium_bps:-11, yield:3.35, country:'Supranational', issue_year:2023, isin_prefix:'XS00', sdgs:[7,8,13], frameworks_compliance:['ICMA GBP','CBI Standard'] },
  { id:'MDB04', issuer:'Asian Development Bank', type:'Green Bond', subtype:'Supranational', cbi_sector:'Multiple', cbi_certified:true, currency:'USD', coupon:2.25, maturity:'2030', size_mn:3500, rating:'AAA', esgScore:90, useOfProceeds:'Clean energy, sustainable transport in Asia-Pacific', framework:'ADB Green Bond Framework', spo:'CICERO', greenium_bps:-10, yield:3.28, country:'Supranational', issue_year:2023, isin_prefix:'XS00', sdgs:[7,11,13], frameworks_compliance:['ICMA GBP','CBI Standard'] },
  { id:'MDB05', issuer:'European Bank for Reconstruction and Development', type:'Green Bond', subtype:'Supranational', cbi_sector:'Multiple', cbi_certified:true, currency:'EUR', coupon:1.00, maturity:'2031', size_mn:1500, rating:'AAA', esgScore:89, useOfProceeds:'Green economy transition in emerging Europe', framework:'EBRD Green Bond Framework', spo:'CICERO', greenium_bps:-9, yield:2.55, country:'Supranational', issue_year:2022, isin_prefix:'XS00', sdgs:[7,9,13], frameworks_compliance:['ICMA GBP'] },
  { id:'MDB06', issuer:'African Development Bank', type:'Social Bond', subtype:'Supranational', cbi_sector:'Multiple', cbi_certified:false, currency:'USD', coupon:3.00, maturity:'2029', size_mn:750, rating:'AAA', esgScore:87, useOfProceeds:'Healthcare, education, food security in Africa', framework:'AfDB Social Bond Framework', spo:'Sustainalytics', greenium_bps:-8, yield:3.62, country:'Supranational', issue_year:2023, isin_prefix:'XS00', sdgs:[1,2,3,4], frameworks_compliance:['ICMA SBP'] },
  { id:'MDB07', issuer:'New Development Bank (BRICS)', type:'Sustainability Bond', subtype:'Supranational', cbi_sector:'Multiple', cbi_certified:false, currency:'USD', coupon:3.50, maturity:'2030', size_mn:1500, rating:'AA+', esgScore:78, useOfProceeds:'Green infrastructure and social development in BRICS', framework:'NDB Sustainability Bond Framework', spo:'Sustainalytics', greenium_bps:-6, yield:3.95, country:'Supranational', issue_year:2024, isin_prefix:'XS00', sdgs:[6,7,9,11], frameworks_compliance:['ICMA SBG'] },
  { id:'MDB08', issuer:'Asian Infrastructure Investment Bank', type:'Green Bond', subtype:'Supranational', cbi_sector:'Multiple', cbi_certified:true, currency:'USD', coupon:2.60, maturity:'2031', size_mn:2500, rating:'AAA', esgScore:88, useOfProceeds:'Sustainable infrastructure in Asia', framework:'AIIB Sustainable Development Bond Framework', spo:'CICERO', greenium_bps:-9, yield:3.22, country:'Supranational', issue_year:2023, isin_prefix:'XS00', sdgs:[7,9,11], frameworks_compliance:['ICMA GBP','CBI Standard'] },

  // ── CORPORATE GREEN BONDS (25) ──
  { id:'CG001', issuer:'Apple Inc.', type:'Green Bond', subtype:'Corporate', cbi_sector:'Energy', cbi_certified:false, currency:'USD', coupon:2.05, maturity:'2030', size_mn:4700, rating:'AA+', esgScore:76, useOfProceeds:'Clean energy, energy efficiency, green buildings, recycling', framework:'ICMA GBP', spo:'Sustainalytics', greenium_bps:-5, yield:3.82, country:'USA', issue_year:2022, isin_prefix:'US03', sdgs:[7,12,13], frameworks_compliance:['ICMA GBP'] },
  { id:'CG002', issuer:'Iberdrola S.A.', type:'Green Bond', subtype:'Corporate', cbi_sector:'Energy', cbi_certified:true, currency:'EUR', coupon:1.25, maturity:'2031', size_mn:1800, rating:'BBB+', esgScore:79, useOfProceeds:'Onshore/offshore wind, solar PV installations', framework:'ICMA GBP + CBI', spo:'Vigeo Eiris', greenium_bps:-7, yield:3.65, country:'Spain', issue_year:2021, isin_prefix:'XS00', sdgs:[7,13], frameworks_compliance:['ICMA GBP','CBI Standard'] },
  { id:'CG003', issuer:'Orsted A/S', type:'Green Bond', subtype:'Corporate', cbi_sector:'Energy', cbi_certified:true, currency:'EUR', coupon:1.50, maturity:'2030', size_mn:1200, rating:'BBB+', esgScore:85, useOfProceeds:'Offshore wind farm development globally', framework:'ICMA GBP + CBI', spo:'CICERO', greenium_bps:-9, yield:3.42, country:'Denmark', issue_year:2021, isin_prefix:'XS00', sdgs:[7,13,14], frameworks_compliance:['ICMA GBP','CBI Standard'] },
  { id:'CG004', issuer:'Engie S.A.', type:'Green Bond', subtype:'Corporate', cbi_sector:'Energy', cbi_certified:false, currency:'EUR', coupon:1.625, maturity:'2032', size_mn:2500, rating:'BBB+', esgScore:73, useOfProceeds:'Renewables, green hydrogen production, storage', framework:'ICMA GBP', spo:'Sustainalytics', greenium_bps:-5, yield:3.78, country:'France', issue_year:2022, isin_prefix:'FR00', sdgs:[7,9,13], frameworks_compliance:['ICMA GBP'] },
  { id:'CG005', issuer:'NextEra Energy Inc.', type:'Green Bond', subtype:'Corporate', cbi_sector:'Energy', cbi_certified:false, currency:'USD', coupon:3.50, maturity:'2033', size_mn:2000, rating:'A-', esgScore:77, useOfProceeds:'Solar, wind capacity expansion across US', framework:'ICMA GBP', spo:'Sustainalytics', greenium_bps:-6, yield:4.15, country:'USA', issue_year:2023, isin_prefix:'US65', sdgs:[7,13], frameworks_compliance:['ICMA GBP'] },
  { id:'CG006', issuer:'Enel S.p.A.', type:'Green Bond', subtype:'Corporate', cbi_sector:'Energy', cbi_certified:false, currency:'EUR', coupon:1.875, maturity:'2029', size_mn:3000, rating:'BBB+', esgScore:72, useOfProceeds:'Grid modernization, renewable energy capacity', framework:'ICMA GBP', spo:'Vigeo Eiris', greenium_bps:-4, yield:3.52, country:'Italy', issue_year:2022, isin_prefix:'XS00', sdgs:[7,9,13], frameworks_compliance:['ICMA GBP'] },
  { id:'CG007', issuer:'Toyota Motor Corp.', type:'Green Bond', subtype:'Corporate', cbi_sector:'Transport', cbi_certified:false, currency:'JPY', coupon:0.37, maturity:'2029', size_mn:2800, rating:'A+', esgScore:65, useOfProceeds:'EV development, hybrid vehicle electrification', framework:'ICMA GBP', spo:'DNV', greenium_bps:-4, yield:0.95, country:'Japan', issue_year:2022, isin_prefix:'JP00', sdgs:[9,11,13], frameworks_compliance:['ICMA GBP'] },
  { id:'CG008', issuer:'Volkswagen AG', type:'Green Bond', subtype:'Corporate', cbi_sector:'Transport', cbi_certified:false, currency:'EUR', coupon:2.125, maturity:'2028', size_mn:2000, rating:'BBB+', esgScore:60, useOfProceeds:'MEB/SSP EV platform development, battery manufacturing', framework:'Volkswagen Green Finance Framework', spo:'ISS ESG', greenium_bps:-3, yield:3.85, country:'Germany', issue_year:2022, isin_prefix:'XS00', sdgs:[9,11,13], frameworks_compliance:['ICMA GBP'] },
  { id:'CG009', issuer:'Volvo Group', type:'Green Bond', subtype:'Corporate', cbi_sector:'Transport', cbi_certified:true, currency:'SEK', coupon:1.75, maturity:'2030', size_mn:5000, rating:'A-', esgScore:75, useOfProceeds:'Electric truck/bus development, zero-emission logistics', framework:'ICMA GBP + CBI', spo:'CICERO', greenium_bps:-6, yield:3.12, country:'Sweden', issue_year:2023, isin_prefix:'SE00', sdgs:[9,11,13], frameworks_compliance:['ICMA GBP','CBI Standard'] },
  { id:'CG010', issuer:'ICICI Bank Ltd.', type:'Green Bond', subtype:'Corporate', cbi_sector:'Energy', cbi_certified:false, currency:'USD', coupon:3.80, maturity:'2027', size_mn:500, rating:'BBB-', esgScore:52, useOfProceeds:'Renewable energy project lending across India', framework:'ICMA GBP', spo:'KPMG', greenium_bps:-2, yield:5.12, country:'India', issue_year:2022, isin_prefix:'XS00', sdgs:[7,13], frameworks_compliance:['ICMA GBP'] },
  { id:'CG011', issuer:'State Bank of India', type:'Green Bond', subtype:'Corporate', cbi_sector:'Energy', cbi_certified:false, currency:'USD', coupon:4.00, maturity:'2029', size_mn:800, rating:'BBB-', esgScore:50, useOfProceeds:'Green infrastructure, solar/wind project finance', framework:'ICMA GBP', spo:'Sustainalytics', greenium_bps:-2, yield:5.35, country:'India', issue_year:2023, isin_prefix:'XS00', sdgs:[7,9], frameworks_compliance:['ICMA GBP'] },
  { id:'CG012', issuer:'Bank of China Ltd.', type:'Green Bond', subtype:'Corporate', cbi_sector:'Buildings', cbi_certified:false, currency:'CNY', coupon:3.05, maturity:'2026', size_mn:6200, rating:'A', esgScore:48, useOfProceeds:'Green buildings, green infrastructure lending', framework:'CBI + PBoC Green Bond Catalogue', spo:'Deloitte', greenium_bps:-1, yield:3.28, country:'China', issue_year:2021, isin_prefix:'XS00', sdgs:[9,11], frameworks_compliance:['ICMA GBP','PBoC Catalogue'] },
  { id:'CG013', issuer:'HSBC Holdings plc', type:'Green Bond', subtype:'Corporate', cbi_sector:'Buildings', cbi_certified:false, currency:'GBP', coupon:2.25, maturity:'2032', size_mn:1500, rating:'A+', esgScore:68, useOfProceeds:'Green mortgage portfolio, energy-efficient buildings', framework:'ICMA GBP', spo:'Sustainalytics', greenium_bps:-4, yield:4.25, country:'UK', issue_year:2022, isin_prefix:'XS00', sdgs:[7,11], frameworks_compliance:['ICMA GBP'] },
  { id:'CG014', issuer:'BNP Paribas S.A.', type:'Green Bond', subtype:'Corporate', cbi_sector:'Multiple', cbi_certified:false, currency:'EUR', coupon:1.125, maturity:'2031', size_mn:1250, rating:'A+', esgScore:70, useOfProceeds:'Sustainable agriculture, green buildings, renewables', framework:'ICMA GBP', spo:'Vigeo Eiris', greenium_bps:-5, yield:3.45, country:'France', issue_year:2022, isin_prefix:'FR00', sdgs:[2,7,11], frameworks_compliance:['ICMA GBP'] },
  { id:'CG015', issuer:'Mitsubishi UFJ Financial Group', type:'Green Bond', subtype:'Corporate', cbi_sector:'Buildings', cbi_certified:false, currency:'JPY', coupon:0.42, maturity:'2028', size_mn:500000, rating:'A', esgScore:64, useOfProceeds:'Green buildings, renewable energy lending', framework:'ICMA GBP', spo:'DNV', greenium_bps:-3, yield:0.88, country:'Japan', issue_year:2023, isin_prefix:'JP00', sdgs:[7,9,11], frameworks_compliance:['ICMA GBP'] },
  { id:'CG016', issuer:'CLP Holdings Ltd.', type:'Green Bond', subtype:'Corporate', cbi_sector:'Energy', cbi_certified:false, currency:'HKD', coupon:2.875, maturity:'2030', size_mn:1000, rating:'A', esgScore:67, useOfProceeds:'Onshore wind, solar farms in Greater China', framework:'ICMA GBP', spo:'Sustainalytics', greenium_bps:-3, yield:3.55, country:'Hong Kong', issue_year:2023, isin_prefix:'XS00', sdgs:[7,13], frameworks_compliance:['ICMA GBP'] },
  { id:'CG017', issuer:'Tata Power Company', type:'Green Bond', subtype:'Corporate', cbi_sector:'Energy', cbi_certified:false, currency:'INR', coupon:7.85, maturity:'2028', size_mn:500, rating:'BBB-', esgScore:55, useOfProceeds:'Solar capacity expansion, rooftop solar installations', framework:'ICMA GBP', spo:'KPMG', greenium_bps:-2, yield:8.25, country:'India', issue_year:2023, isin_prefix:'INE0', sdgs:[7,13], frameworks_compliance:['ICMA GBP'] },
  { id:'CG018', issuer:'NTPC Ltd.', type:'Green Bond', subtype:'Corporate', cbi_sector:'Energy', cbi_certified:false, currency:'INR', coupon:7.48, maturity:'2032', size_mn:800, rating:'AAA(ind)', esgScore:47, useOfProceeds:'Solar and wind capacity addition, green hydrogen', framework:'ICMA GBP', spo:'Sustainalytics', greenium_bps:-2, yield:7.85, country:'India', issue_year:2022, isin_prefix:'INE7', sdgs:[7,13], frameworks_compliance:['ICMA GBP'] },
  { id:'CG019', issuer:'Reliance Industries Ltd.', type:'Green Bond', subtype:'Corporate', cbi_sector:'Energy', cbi_certified:false, currency:'USD', coupon:3.625, maturity:'2031', size_mn:1000, rating:'BBB', esgScore:54, useOfProceeds:'Green hydrogen, solar giga-factory, battery storage', framework:'ICMA GBP', spo:'Sustainalytics', greenium_bps:-3, yield:4.95, country:'India', issue_year:2024, isin_prefix:'XS00', sdgs:[7,9,12], frameworks_compliance:['ICMA GBP'] },
  { id:'CG020', issuer:'Samsung SDI Co. Ltd.', type:'Green Bond', subtype:'Corporate', cbi_sector:'Industry', cbi_certified:false, currency:'KRW', coupon:3.25, maturity:'2029', size_mn:1000000, rating:'A+', esgScore:69, useOfProceeds:'EV battery manufacturing, next-gen solid-state R&D', framework:'ICMA GBP', spo:'Sustainalytics', greenium_bps:-4, yield:3.68, country:'South Korea', issue_year:2023, isin_prefix:'KR70', sdgs:[7,9,12], frameworks_compliance:['ICMA GBP'] },
  { id:'CG021', issuer:'Suzano S.A.', type:'Green Bond', subtype:'Corporate', cbi_sector:'Land Use & Marine', cbi_certified:true, currency:'USD', coupon:3.125, maturity:'2032', size_mn:1250, rating:'BBB-', esgScore:62, useOfProceeds:'Sustainable eucalyptus forestry, biodiversity corridors', framework:'ICMA GBP + CBI', spo:'Sustainalytics', greenium_bps:-4, yield:5.45, country:'Brazil', issue_year:2022, isin_prefix:'XS00', sdgs:[12,13,15], frameworks_compliance:['ICMA GBP','CBI Standard'] },
  { id:'CG022', issuer:'Stora Enso Oyj', type:'Green Bond', subtype:'Corporate', cbi_sector:'Land Use & Marine', cbi_certified:false, currency:'EUR', coupon:1.375, maturity:'2030', size_mn:500, rating:'BBB', esgScore:71, useOfProceeds:'Sustainable packaging innovation, certified forestry', framework:'ICMA GBP', spo:'CICERO', greenium_bps:-5, yield:3.35, country:'Finland', issue_year:2022, isin_prefix:'XS00', sdgs:[12,13,15], frameworks_compliance:['ICMA GBP'] },
  { id:'CG023', issuer:'CRH plc', type:'Green Bond', subtype:'Corporate', cbi_sector:'Industry', cbi_certified:false, currency:'EUR', coupon:2.00, maturity:'2033', size_mn:750, rating:'BBB+', esgScore:58, useOfProceeds:'Low-carbon cement, supplementary cementitious materials', framework:'ICMA GBP', spo:'Sustainalytics', greenium_bps:-3, yield:3.82, country:'Ireland', issue_year:2023, isin_prefix:'XS00', sdgs:[9,12,13], frameworks_compliance:['ICMA GBP'] },
  { id:'CG024', issuer:'Holcim Ltd.', type:'Green Bond', subtype:'Corporate', cbi_sector:'Industry', cbi_certified:false, currency:'CHF', coupon:1.50, maturity:'2032', size_mn:850, rating:'BBB', esgScore:56, useOfProceeds:'CCUS deployment, low-carbon concrete, alternative fuels', framework:'ICMA GBP', spo:'ISS ESG', greenium_bps:-3, yield:2.45, country:'Switzerland', issue_year:2023, isin_prefix:'CH00', sdgs:[9,12,13], frameworks_compliance:['ICMA GBP'] },
  { id:'CG025', issuer:'Digital Realty Trust', type:'Green Bond', subtype:'Corporate', cbi_sector:'ICT', cbi_certified:false, currency:'USD', coupon:3.25, maturity:'2031', size_mn:1000, rating:'BBB', esgScore:66, useOfProceeds:'Green data centres, 100% renewable energy procurement', framework:'ICMA GBP', spo:'Sustainalytics', greenium_bps:-4, yield:4.35, country:'USA', issue_year:2023, isin_prefix:'US25', sdgs:[7,9,13], frameworks_compliance:['ICMA GBP'] },
  { id:'CG026', issuer:'Equinix Inc.', type:'Green Bond', subtype:'Corporate', cbi_sector:'ICT', cbi_certified:false, currency:'USD', coupon:3.00, maturity:'2032', size_mn:1200, rating:'BBB+', esgScore:70, useOfProceeds:'Energy-efficient data centres, smart grid integration, cooling innovation', framework:'ICMA GBP', spo:'Sustainalytics', greenium_bps:-4, yield:4.08, country:'USA', issue_year:2023, isin_prefix:'US29', sdgs:[7,9,13], frameworks_compliance:['ICMA GBP'] },
  { id:'CG027', issuer:'Schneider Electric SE', type:'Green Bond', subtype:'Corporate', cbi_sector:'ICT', cbi_certified:true, currency:'EUR', coupon:1.50, maturity:'2030', size_mn:600, rating:'A-', esgScore:82, useOfProceeds:'Energy management systems, smart grid technology, building automation', framework:'ICMA GBP + CBI', spo:'CICERO', greenium_bps:-6, yield:3.18, country:'France', issue_year:2022, isin_prefix:'FR00', sdgs:[7,9,11,13], frameworks_compliance:['ICMA GBP','CBI Standard'] },

  // ── SUSTAINABILITY-LINKED BONDS (10) ──
  { id:'SLB01', issuer:'Enel S.p.A. (SLB)', type:'SLB', subtype:'Corporate SLB', cbi_sector:'Energy', cbi_certified:false, currency:'EUR', coupon:2.65, maturity:'2028', size_mn:3500, rating:'BBB+', esgScore:68, useOfProceeds:'KPI: GHG Scope 1 reduction -70% by 2030 vs 2017 baseline', framework:'ICMA SLBP', spo:'Vigeo Eiris', greenium_bps:-3, yield:3.95, country:'Italy', issue_year:2021, isin_prefix:'XS00', sdgs:[7,13], frameworks_compliance:['ICMA SLBP'] },
  { id:'SLB02', issuer:'Suzano S.A. (SLB)', type:'SLB', subtype:'Corporate SLB', cbi_sector:'Land Use & Marine', cbi_certified:false, currency:'USD', coupon:3.75, maturity:'2031', size_mn:1250, rating:'BBB-', esgScore:58, useOfProceeds:'KPI: Water consumption -10.4%, GHG intensity -15% by 2030', framework:'ICMA SLBP', spo:'Sustainalytics', greenium_bps:-3, yield:5.82, country:'Brazil', issue_year:2021, isin_prefix:'XS00', sdgs:[6,12,13,15], frameworks_compliance:['ICMA SLBP'] },
  { id:'SLB03', issuer:'Tesco plc (SLB)', type:'SLB', subtype:'Corporate SLB', cbi_sector:'Buildings', cbi_certified:false, currency:'GBP', coupon:2.75, maturity:'2030', size_mn:750, rating:'BBB', esgScore:62, useOfProceeds:'KPI: Scope 1+2 GHG reduction -60% by 2030 vs 2015', framework:'ICMA SLBP', spo:'ISS ESG', greenium_bps:-2, yield:4.45, country:'UK', issue_year:2022, isin_prefix:'XS00', sdgs:[12,13], frameworks_compliance:['ICMA SLBP'] },
  { id:'SLB04', issuer:'Carrefour S.A. (SLB)', type:'SLB', subtype:'Corporate SLB', cbi_sector:'Waste & Pollution', cbi_certified:false, currency:'EUR', coupon:1.875, maturity:'2029', size_mn:1000, rating:'BBB+', esgScore:61, useOfProceeds:'KPI: Food waste -50% by 2030, 100% recyclable packaging', framework:'ICMA SLBP', spo:'Sustainalytics', greenium_bps:-2, yield:3.65, country:'France', issue_year:2022, isin_prefix:'FR00', sdgs:[2,12,13], frameworks_compliance:['ICMA SLBP'] },
  { id:'SLB05', issuer:'HeidelbergCement AG (SLB)', type:'SLB', subtype:'Corporate SLB', cbi_sector:'Industry', cbi_certified:false, currency:'EUR', coupon:2.25, maturity:'2031', size_mn:600, rating:'BBB', esgScore:50, useOfProceeds:'KPI: CO2/tonne cement < 500 kg by 2030', framework:'ICMA SLBP', spo:'ISS ESG', greenium_bps:-2, yield:3.92, country:'Germany', issue_year:2021, isin_prefix:'XS00', sdgs:[9,12,13], frameworks_compliance:['ICMA SLBP'] },
  { id:'SLB06', issuer:'JBS S.A. (SLB)', type:'SLB', subtype:'Corporate SLB', cbi_sector:'Land Use & Marine', cbi_certified:false, currency:'USD', coupon:5.00, maturity:'2032', size_mn:1000, rating:'BBB-', esgScore:42, useOfProceeds:'KPI: Deforestation-free supply chain by 2030, net zero by 2040', framework:'ICMA SLBP', spo:'Sustainalytics', greenium_bps:-1, yield:6.45, country:'Brazil', issue_year:2022, isin_prefix:'XS00', sdgs:[2,12,13,15], frameworks_compliance:['ICMA SLBP'] },
  { id:'SLB07', issuer:'Puma SE (SLB)', type:'SLB', subtype:'Corporate SLB', cbi_sector:'Industry', cbi_certified:false, currency:'EUR', coupon:1.625, maturity:'2029', size_mn:500, rating:'BBB', esgScore:66, useOfProceeds:'KPI: Science-based targets across value chain, recycled polyester', framework:'ICMA SLBP', spo:'ISS ESG', greenium_bps:-2, yield:3.35, country:'Germany', issue_year:2022, isin_prefix:'XS00', sdgs:[12,13], frameworks_compliance:['ICMA SLBP'] },
  { id:'SLB08', issuer:'PEMEX (SLB)', type:'SLB', subtype:'Corporate SLB', cbi_sector:'Energy', cbi_certified:false, currency:'USD', coupon:6.50, maturity:'2027', size_mn:2000, rating:'BB', esgScore:32, useOfProceeds:'KPI: Methane intensity reduction -40% by 2025, flaring -50%', framework:'ICMA SLBP', spo:'Sustainalytics', greenium_bps:-1, yield:9.85, country:'Mexico', issue_year:2022, isin_prefix:'XS00', sdgs:[7,13], frameworks_compliance:['ICMA SLBP'] },
  { id:'SLB09', issuer:'Etihad Airways PJSC (SLB)', type:'SLB', subtype:'Corporate SLB', cbi_sector:'Transport', cbi_certified:false, currency:'USD', coupon:4.50, maturity:'2028', size_mn:600, rating:'BBB-', esgScore:48, useOfProceeds:'KPI: CO2/RPK reduction -20% by 2028, SAF adoption 5%+', framework:'ICMA SLBP', spo:'DNV', greenium_bps:-1, yield:5.65, country:'UAE', issue_year:2023, isin_prefix:'XS00', sdgs:[9,13], frameworks_compliance:['ICMA SLBP'] },
  { id:'SLB10', issuer:'UPM-Kymmene Corp. (SLB)', type:'SLB', subtype:'Corporate SLB', cbi_sector:'Industry', cbi_certified:false, currency:'EUR', coupon:1.50, maturity:'2030', size_mn:750, rating:'BBB+', esgScore:72, useOfProceeds:'KPI: Fossil-free production target, 100% certified fibre', framework:'ICMA SLBP', spo:'CICERO', greenium_bps:-3, yield:3.28, country:'Finland', issue_year:2022, isin_prefix:'XS00', sdgs:[12,13,15], frameworks_compliance:['ICMA SLBP'] },

  // ── SOCIAL & SUSTAINABILITY BONDS (10) ──
  { id:'SOC01', issuer:'Pfizer Inc.', type:'Social Bond', subtype:'Corporate Social', cbi_sector:'Multiple', cbi_certified:false, currency:'USD', coupon:2.75, maturity:'2030', size_mn:1250, rating:'A+', esgScore:70, useOfProceeds:'Affordable medicine access, vaccine distribution globally', framework:'ICMA SBP', spo:'Sustainalytics', greenium_bps:-3, yield:3.95, country:'USA', issue_year:2022, isin_prefix:'US71', sdgs:[3,10], frameworks_compliance:['ICMA SBP'] },
  { id:'SOC02', issuer:'Unilever plc', type:'Sustainability Bond', subtype:'Corporate Sustainability', cbi_sector:'Multiple', cbi_certified:false, currency:'EUR', coupon:1.375, maturity:'2032', size_mn:1000, rating:'A+', esgScore:75, useOfProceeds:'Living wage programme, plastic waste reduction, regenerative agriculture', framework:'ICMA SBG', spo:'Sustainalytics', greenium_bps:-4, yield:3.25, country:'UK', issue_year:2022, isin_prefix:'XS00', sdgs:[2,8,12,14], frameworks_compliance:['ICMA SBG'] },
  { id:'SOC03', issuer:'BBVA S.A.', type:'Social Bond', subtype:'Corporate Social', cbi_sector:'Multiple', cbi_certified:false, currency:'EUR', coupon:1.75, maturity:'2029', size_mn:1000, rating:'A', esgScore:64, useOfProceeds:'Financial inclusion, SME lending in underserved communities', framework:'ICMA SBP', spo:'Vigeo Eiris', greenium_bps:-3, yield:3.55, country:'Spain', issue_year:2022, isin_prefix:'XS00', sdgs:[1,8,10], frameworks_compliance:['ICMA SBP'] },
  { id:'SOC04', issuer:'Danone S.A.', type:'Sustainability Bond', subtype:'Corporate Sustainability', cbi_sector:'Land Use & Marine', cbi_certified:false, currency:'EUR', coupon:1.25, maturity:'2030', size_mn:800, rating:'BBB+', esgScore:73, useOfProceeds:'Regenerative agriculture, recyclable packaging, social inclusion', framework:'ICMA SBG', spo:'Vigeo Eiris', greenium_bps:-4, yield:3.42, country:'France', issue_year:2021, isin_prefix:'FR00', sdgs:[2,3,12,15], frameworks_compliance:['ICMA SBG'] },
  { id:'SOC05', issuer:'NatWest Group plc', type:'Social Bond', subtype:'Corporate Social', cbi_sector:'Buildings', cbi_certified:false, currency:'GBP', coupon:2.50, maturity:'2028', size_mn:750, rating:'BBB+', esgScore:63, useOfProceeds:'Affordable housing finance in UK, first-time buyers', framework:'ICMA SBP', spo:'Sustainalytics', greenium_bps:-2, yield:4.32, country:'UK', issue_year:2022, isin_prefix:'XS00', sdgs:[1,10,11], frameworks_compliance:['ICMA SBP'] },
  { id:'SOC06', issuer:'CADES (Caisse Amortissement Dette Sociale)', type:'Social Bond', subtype:'Agency Social', cbi_sector:'Multiple', cbi_certified:false, currency:'EUR', coupon:0.75, maturity:'2034', size_mn:10000, rating:'AA', esgScore:80, useOfProceeds:'French social security refinancing: health, pensions, family', framework:'ICMA SBP', spo:'Vigeo Eiris', greenium_bps:-6, yield:2.85, country:'France', issue_year:2022, isin_prefix:'FR00', sdgs:[1,3,10], frameworks_compliance:['ICMA SBP'] },
  { id:'SOC07', issuer:'IFFIm (International Finance Facility for Immunisation)', type:'Social Bond', subtype:'Supranational Social', cbi_sector:'Multiple', cbi_certified:false, currency:'USD', coupon:3.125, maturity:'2029', size_mn:500, rating:'AA', esgScore:88, useOfProceeds:'GAVI immunisation programmes in 73 developing countries', framework:'ICMA SBP', spo:'Sustainalytics', greenium_bps:-5, yield:3.65, country:'Supranational', issue_year:2023, isin_prefix:'XS00', sdgs:[3,10], frameworks_compliance:['ICMA SBP'] },
  { id:'SOC08', issuer:'CAF (Development Bank of Latin America)', type:'Social Bond', subtype:'Supranational Social', cbi_sector:'Multiple', cbi_certified:false, currency:'USD', coupon:3.375, maturity:'2031', size_mn:750, rating:'AA-', esgScore:76, useOfProceeds:'Social infrastructure: education, healthcare in LATAM', framework:'ICMA SBP', spo:'Sustainalytics', greenium_bps:-4, yield:3.85, country:'Supranational', issue_year:2023, isin_prefix:'XS00', sdgs:[3,4,10,11], frameworks_compliance:['ICMA SBP'] },
  { id:'SOC09', issuer:'KfW Bankengruppe', type:'Social Bond', subtype:'Agency Social', cbi_sector:'Buildings', cbi_certified:false, currency:'EUR', coupon:0.625, maturity:'2032', size_mn:3000, rating:'AAA', esgScore:91, useOfProceeds:'Social housing, education infrastructure, sustainable SMEs', framework:'ICMA SBP', spo:'ISS ESG', greenium_bps:-8, yield:2.32, country:'Germany', issue_year:2022, isin_prefix:'DE00', sdgs:[1,4,8,11], frameworks_compliance:['ICMA SBP'] },
  { id:'SOC10', issuer:'Korea Housing Finance Corporation', type:'Social Bond', subtype:'Agency Social', cbi_sector:'Buildings', cbi_certified:false, currency:'KRW', coupon:3.40, maturity:'2029', size_mn:2000000, rating:'AA', esgScore:74, useOfProceeds:'Affordable housing for low-income households in Korea', framework:'ICMA SBP', spo:'Sustainalytics', greenium_bps:-3, yield:3.65, country:'South Korea', issue_year:2023, isin_prefix:'KR60', sdgs:[1,10,11], frameworks_compliance:['ICMA SBP'] },

  // ── TRANSITION & BLUE BONDS (7) ──
  { id:'TB001', issuer:'Republic of Seychelles (Blue Bond)', type:'Blue Bond', subtype:'Sovereign Blue', cbi_sector:'Land Use & Marine', cbi_certified:false, currency:'USD', coupon:6.50, maturity:'2029', size_mn:15, rating:'B+', esgScore:60, useOfProceeds:'Marine protected areas, sustainable fisheries management', framework:'World Bank Blue Bond Framework', spo:'CICERO', greenium_bps:-2, yield:8.75, country:'Seychelles', issue_year:2018, isin_prefix:'SC00', sdgs:[14], frameworks_compliance:['ICMA GBP'] },
  { id:'TB002', issuer:'World Bank (Blue Bond)', type:'Blue Bond', subtype:'Supranational Blue', cbi_sector:'Land Use & Marine', cbi_certified:false, currency:'USD', coupon:2.75, maturity:'2030', size_mn:250, rating:'AAA', esgScore:92, useOfProceeds:'Sustainable ocean fisheries, marine pollution reduction', framework:'World Bank Sustainable Development Bond', spo:'CICERO', greenium_bps:-10, yield:3.25, country:'Supranational', issue_year:2023, isin_prefix:'XS00', sdgs:[14], frameworks_compliance:['ICMA GBP'] },
  { id:'TB003', issuer:'Nordic Investment Bank (Blue Bond)', type:'Blue Bond', subtype:'Supranational Blue', cbi_sector:'Water', cbi_certified:false, currency:'SEK', coupon:1.25, maturity:'2031', size_mn:2000, rating:'AAA', esgScore:89, useOfProceeds:'Baltic Sea protection, Nordic marine sustainability', framework:'NIB Environmental Bond Framework', spo:'CICERO', greenium_bps:-7, yield:2.85, country:'Supranational', issue_year:2022, isin_prefix:'XS00', sdgs:[6,14], frameworks_compliance:['ICMA GBP'] },
  { id:'TB004', issuer:'Bank of China (Blue Bond)', type:'Blue Bond', subtype:'Corporate Blue', cbi_sector:'Land Use & Marine', cbi_certified:false, currency:'CNY', coupon:3.15, maturity:'2028', size_mn:500, rating:'A', esgScore:46, useOfProceeds:'Marine resource preservation, offshore wind in coastal areas', framework:'PBoC + ICMA GBP', spo:'Deloitte', greenium_bps:-1, yield:3.42, country:'China', issue_year:2022, isin_prefix:'XS00', sdgs:[7,14], frameworks_compliance:['ICMA GBP','PBoC Catalogue'] },
  { id:'TB005', issuer:'JSW Steel Ltd. (Transition)', type:'Transition Bond', subtype:'Corporate Transition', cbi_sector:'Industry', cbi_certified:false, currency:'USD', coupon:5.25, maturity:'2032', size_mn:500, rating:'BB+', esgScore:44, useOfProceeds:'Steel decarbonization: DRI-EAF route, scrap recycling', framework:'ICMA Climate Transition Finance Handbook', spo:'DNV', greenium_bps:-1, yield:6.85, country:'India', issue_year:2024, isin_prefix:'XS00', sdgs:[9,12,13], frameworks_compliance:['ICMA GBP'] },
  { id:'TB006', issuer:'ArcelorMittal S.A. (Transition)', type:'Transition Bond', subtype:'Corporate Transition', cbi_sector:'Industry', cbi_certified:false, currency:'EUR', coupon:2.50, maturity:'2033', size_mn:1000, rating:'BBB', esgScore:50, useOfProceeds:'DRI + hydrogen steelmaking at Hamburg/Sestao, Smart Carbon', framework:'ICMA Climate Transition Finance Handbook', spo:'DNV', greenium_bps:-2, yield:4.25, country:'Luxembourg', issue_year:2023, isin_prefix:'XS00', sdgs:[9,12,13], frameworks_compliance:['ICMA GBP'] },
  { id:'TB007', issuer:'Holcim Ltd. (Transition)', type:'Transition Bond', subtype:'Corporate Transition', cbi_sector:'Industry', cbi_certified:false, currency:'CHF', coupon:1.75, maturity:'2034', size_mn:500, rating:'BBB', esgScore:52, useOfProceeds:'CCUS at cement plants, alternative fuels >50%, clinker ratio reduction', framework:'ICMA Climate Transition Finance Handbook', spo:'ISS ESG', greenium_bps:-2, yield:2.65, country:'Switzerland', issue_year:2024, isin_prefix:'CH00', sdgs:[9,12,13], frameworks_compliance:['ICMA GBP'] },

  // ── GENDER BONDS (3) ──
  { id:'GEN01', issuer:'IFC (Gender Bond)', type:'Gender Bond', subtype:'Supranational Gender', cbi_sector:'Multiple', cbi_certified:false, currency:'USD', coupon:2.50, maturity:'2028', size_mn:300, rating:'AAA', esgScore:90, useOfProceeds:'Women-led businesses, gender-lens investing in emerging markets', framework:'IFC Gender Bond Framework', spo:'CICERO', greenium_bps:-6, yield:3.35, country:'Supranational', issue_year:2022, isin_prefix:'XS00', sdgs:[5,8,10], frameworks_compliance:['ICMA SBP'] },
  { id:'GEN02', issuer:'QNB (Qatar National Bank)', type:'Gender Bond', subtype:'Corporate Gender', cbi_sector:'Multiple', cbi_certified:false, currency:'USD', coupon:3.75, maturity:'2029', size_mn:600, rating:'A', esgScore:58, useOfProceeds:'Women financial inclusion MENA, women-owned SME lending', framework:'QNB Gender Bond Framework', spo:'Sustainalytics', greenium_bps:-2, yield:4.35, country:'Qatar', issue_year:2023, isin_prefix:'XS00', sdgs:[5,8,10], frameworks_compliance:['ICMA SBP'] },
  { id:'GEN03', issuer:'Asian Development Bank (Gender Bond)', type:'Gender Bond', subtype:'Supranational Gender', cbi_sector:'Multiple', cbi_certified:false, currency:'USD', coupon:2.375, maturity:'2030', size_mn:500, rating:'AAA', esgScore:89, useOfProceeds:'Gender equality projects: education, health, economic empowerment', framework:'ADB Gender Bond Framework', spo:'CICERO', greenium_bps:-5, yield:3.18, country:'Supranational', issue_year:2023, isin_prefix:'XS00', sdgs:[4,5,8,10], frameworks_compliance:['ICMA SBP'] },
];

/* ══════════════════════════════════════════════════════════════
   SOVEREIGN ESG — 20 countries
   ══════════════════════════════════════════════════════════════ */
const SOVEREIGN_ESG = [
  { country:'Germany', score:90, climate:88, social:92, governance:91, ndgain:72.0, rating:'AAA' },
  { country:'Netherlands', score:88, climate:86, social:90, governance:89, ndgain:73.2, rating:'AAA' },
  { country:'Singapore', score:86, climate:82, social:88, governance:92, ndgain:74.5, rating:'AAA' },
  { country:'Norway', score:87, climate:90, social:88, governance:86, ndgain:75.8, rating:'AAA' },
  { country:'Sweden', score:86, climate:89, social:87, governance:85, ndgain:74.2, rating:'AAA' },
  { country:'France', score:82, climate:80, social:84, governance:83, ndgain:68.5, rating:'AA' },
  { country:'UK', score:80, climate:78, social:82, governance:81, ndgain:69.8, rating:'AA' },
  { country:'South Korea', score:78, climate:72, social:80, governance:82, ndgain:68.2, rating:'AA' },
  { country:'Australia', score:76, climate:62, social:82, governance:84, ndgain:71.5, rating:'AAA' },
  { country:'Canada', score:77, climate:65, social:84, governance:83, ndgain:72.8, rating:'AAA' },
  { country:'Japan', score:75, climate:72, social:78, governance:76, ndgain:67.8, rating:'A+' },
  { country:'Spain', score:74, climate:74, social:74, governance:74, ndgain:66.4, rating:'A' },
  { country:'Chile', score:71, climate:68, social:70, governance:75, ndgain:58.2, rating:'A' },
  { country:'USA', score:68, climate:55, social:72, governance:78, ndgain:69.5, rating:'AA+' },
  { country:'Mexico', score:56, climate:52, social:58, governance:60, ndgain:52.5, rating:'BBB' },
  { country:'Indonesia', score:55, climate:48, social:56, governance:62, ndgain:48.2, rating:'BBB' },
  { country:'Colombia', score:54, climate:56, social:52, governance:55, ndgain:50.5, rating:'BB+' },
  { country:'Brazil', score:52, climate:55, social:48, governance:53, ndgain:48.9, rating:'BB-' },
  { country:'China', score:48, climate:42, social:50, governance:52, ndgain:52.8, rating:'A+' },
  { country:'India', score:45, climate:38, social:48, governance:50, ndgain:43.5, rating:'BBB-' },
  { country:'South Africa', score:50, climate:46, social:52, governance:53, ndgain:44.2, rating:'BB-' },
  { country:'Egypt', score:42, climate:38, social:42, governance:46, ndgain:38.5, rating:'B+' },
  { country:'Kenya', score:40, climate:42, social:38, governance:40, ndgain:35.8, rating:'B' },
];

/* ── Derived filter lists ── */
const ESG_TIERS = ['All','Tier 1 (>=75)','Tier 2 (50-74)','Tier 3 (<50)'];
const ALL_TYPES = ['All', ...new Set(GREEN_BOND_UNIVERSE.map(b => b.type))];
const ALL_CURRENCIES = ['All', ...new Set(GREEN_BOND_UNIVERSE.map(b => b.currency))];
const ALL_RATINGS = ['All', ...new Set(GREEN_BOND_UNIVERSE.map(b => b.rating))];
const ALL_COUNTRIES = ['All', ...new Set(GREEN_BOND_UNIVERSE.map(b => b.country))];
const ALL_SUBTYPES = ['All', ...new Set(GREEN_BOND_UNIVERSE.map(b => b.subtype))];

/* ── Issuer cross-reference to GLOBAL_COMPANY_MASTER ── */
const matchIssuer = (issuerName) => {
  if (!issuerName) return null;
  const lower = issuerName.toLowerCase();
  return GLOBAL_COMPANY_MASTER.find(c => {
    const cLower = (c.name || '').toLowerCase();
    const first = cLower.split(' ')[0];
    return (first.length > 2 && lower.includes(first)) || (lower.split(' ')[0].length > 2 && cLower.includes(lower.split(' ')[0]));
  }) || null;
};

/* ── CSV helper ── */
const downloadCSV = (rows, filename) => {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => {
    const v = r[k]; return typeof v === 'string' && (v.includes(',') || v.includes('"')) ? `"${v.replace(/"/g,'""')}"` : (v ?? '');
  }).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
function FixedIncomeEsgPage() {
  const navigate = useNavigate();

  /* ── Equity portfolio from localStorage ── */
  const [portfolioData] = useState(() => {
    try { const s = localStorage.getItem('ra_portfolio_v1'); return s ? JSON.parse(s) : { portfolios: {}, activePortfolio: null }; } catch { return { portfolios: {}, activePortfolio: null }; }
  });
  const equityHoldings = portfolioData.portfolios?.[portfolioData.activePortfolio]?.holdings || [];

  /* ── FI Portfolio (localStorage ra_fi_portfolio_v1) ── */
  const [fiPortfolio, setFiPortfolio] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ra_fi_portfolio_v1') || '[]'); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('ra_fi_portfolio_v1', JSON.stringify(fiPortfolio)); }, [fiPortfolio]);

  const addToFiPortfolio = useCallback((bondId, notional) => {
    setFiPortfolio(prev => {
      if (prev.find(p => p.bondId === bondId)) return prev;
      return [...prev, { bondId, notional: parseFloat(notional) || 10 }];
    });
  }, []);
  const removeFromFiPortfolio = useCallback((bondId) => {
    setFiPortfolio(prev => prev.filter(p => p.bondId !== bondId));
  }, []);
  const updateNotional = useCallback((bondId, notional) => {
    setFiPortfolio(prev => prev.map(p => p.bondId === bondId ? { ...p, notional: parseFloat(notional) || 0 } : p));
  }, []);

  /* ── Add-bond modal state ── */
  const [addingBondId, setAddingBondId] = useState(null);
  const [addNotionalInput, setAddNotionalInput] = useState('10');

  /* ── Sort state ── */
  const [sortCol, setSortCol] = useState('esgScore');
  const [sortDir, setSortDir] = useState('desc');
  const [sovSortCol, setSovSortCol] = useState('score');
  const [sovSortDir, setSovSortDir] = useState('desc');

  /* ── Filter state ── */
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [currencyFilter, setCurrencyFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [cbiSectorFilter, setCbiSectorFilter] = useState('All');
  const [cbiCertifiedOnly, setCbiCertifiedOnly] = useState(false);
  const [countryFilter, setCountryFilter] = useState('All');

  /* ── Greenium calculator ── */
  const [greeniumMultiplier, setGreeniumMultiplier] = useState(100);

  /* ── Tabs ── */
  const [activeTab, setActiveTab] = useState('universe');

  const toggleSort = (col) => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('desc'); } };
  const toggleSovSort = (col) => { if (sovSortCol === col) setSovSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSovSortCol(col); setSovSortDir('desc'); } };

  /* ── Filtered bonds ── */
  const filteredBonds = useMemo(() => {
    let arr = [...GREEN_BOND_UNIVERSE];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      arr = arr.filter(b => b.issuer.toLowerCase().includes(q) || b.type.toLowerCase().includes(q) || b.currency.toLowerCase().includes(q) || b.framework.toLowerCase().includes(q) || b.useOfProceeds.toLowerCase().includes(q) || b.country.toLowerCase().includes(q) || (b.cbi_sector||'').toLowerCase().includes(q));
    }
    if (typeFilter !== 'All') arr = arr.filter(b => b.type === typeFilter);
    if (currencyFilter !== 'All') arr = arr.filter(b => b.currency === currencyFilter);
    if (ratingFilter !== 'All') arr = arr.filter(b => b.rating === ratingFilter);
    if (cbiSectorFilter !== 'All') arr = arr.filter(b => b.cbi_sector === cbiSectorFilter);
    if (cbiCertifiedOnly) arr = arr.filter(b => b.cbi_certified);
    if (countryFilter !== 'All') arr = arr.filter(b => b.country === countryFilter);
    if (tierFilter !== 'All') {
      if (tierFilter.includes('>=75')) arr = arr.filter(b => b.esgScore >= 75);
      else if (tierFilter.includes('50-74')) arr = arr.filter(b => b.esgScore >= 50 && b.esgScore < 75);
      else if (tierFilter.includes('<50')) arr = arr.filter(b => b.esgScore < 50);
    }
    arr.sort((a, b) => { let va = a[sortCol], vb = b[sortCol]; if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va); return sortDir === 'asc' ? va - vb : vb - va; });
    return arr;
  }, [sortCol, sortDir, searchTerm, typeFilter, tierFilter, currencyFilter, ratingFilter, cbiSectorFilter, cbiCertifiedOnly, countryFilter]);

  const sortedSovereign = useMemo(() => {
    const arr = [...SOVEREIGN_ESG];
    arr.sort((a, b) => { let va = a[sovSortCol], vb = b[sovSortCol]; if (typeof va === 'string') return sovSortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va); return sovSortDir === 'asc' ? va - vb : vb - va; });
    return arr;
  }, [sovSortCol, sovSortDir]);

  /* ── FI Portfolio Analytics ── */
  const fiAnalytics = useMemo(() => {
    if (!fiPortfolio.length) return null;
    const items = fiPortfolio.map(p => ({ ...p, bond: GREEN_BOND_UNIVERSE.find(b => b.id === p.bondId) })).filter(p => p.bond);
    const totalNotional = items.reduce((s, p) => s + p.notional, 0);
    if (totalNotional === 0) return null;
    const wAvgEsg = items.reduce((s, p) => s + p.bond.esgScore * p.notional, 0) / totalNotional;
    const wAvgGreenium = items.reduce((s, p) => s + p.bond.greenium_bps * p.notional, 0) / totalNotional;
    const wAvgYield = items.reduce((s, p) => s + p.bond.yield * p.notional, 0) / totalNotional;
    const greenNotional = items.filter(p => ['Green Bond','Sovereign Green','Climate Awareness Bond','Blue Bond'].includes(p.bond.type)).reduce((s, p) => s + p.notional, 0);
    const slbNotional = items.filter(p => p.bond.type === 'SLB').reduce((s, p) => s + p.notional, 0);
    const socialNotional = items.filter(p => ['Social Bond','Sustainability Bond','Gender Bond','SDG Bond','Sovereign Sustainability'].includes(p.bond.type)).reduce((s, p) => s + p.notional, 0);
    return {
      totalNotional, wAvgEsg, wAvgGreenium, wAvgYield, items,
      greenSharePct: (greenNotional / totalNotional * 100),
      slbSharePct: (slbNotional / totalNotional * 100),
      socialSharePct: (socialNotional / totalNotional * 100),
    };
  }, [fiPortfolio]);

  /* ── Universe-level KPIs (reactive to filters) ── */
  const universeKpis = useMemo(() => {
    const bonds = filteredBonds;
    const totalSizeBn = bonds.reduce((s, b) => s + b.size_mn, 0) / 1000;
    const avgGreenium = bonds.length ? bonds.reduce((s, b) => s + b.greenium_bps, 0) / bonds.length : 0;
    const avgEsg = bonds.length ? bonds.reduce((s, b) => s + b.esgScore, 0) / bonds.length : 0;
    const highestRated = bonds.length ? bonds.reduce((best, b) => b.esgScore > best.esgScore ? b : best, bonds[0]) : null;
    const slbCount = bonds.filter(b => b.type === 'SLB').length;
    const cbiCertCount = bonds.filter(b => b.cbi_certified).length;
    const cbiCertVol = bonds.filter(b => b.cbi_certified).reduce((s, b) => s + b.size_mn, 0) / 1000;
    const sovCount = bonds.filter(b => b.subtype === 'Sovereign').length;
    const socialVol = bonds.filter(b => ['Social Bond','Sustainability Bond','Gender Bond','SDG Bond','Sovereign Sustainability'].includes(b.type)).reduce((s, b) => s + b.size_mn, 0) / 1000;
    const blueVol = bonds.filter(b => b.type === 'Blue Bond').reduce((s, b) => s + b.size_mn, 0) / 1000;
    const avgCoupon = bonds.length ? bonds.reduce((s, b) => s + b.coupon, 0) / bonds.length : 0;
    const currencies = new Set(bonds.map(b => b.currency)).size;
    const countries = new Set(bonds.map(b => b.country)).size;
    const greenCount = bonds.filter(b => ['Green Bond','Sovereign Green','Climate Awareness Bond'].includes(b.type)).length;
    const socialCount = bonds.filter(b => ['Social Bond','Gender Bond'].includes(b.type)).length;
    const susCount = bonds.filter(b => ['Sustainability Bond','Sovereign Sustainability','SDG Bond'].includes(b.type)).length;
    const newIssuance2025 = bonds.filter(b => b.issue_year >= 2024).length;
    const avgMatYr = bonds.length ? bonds.reduce((s, b) => s + parseInt(b.maturity), 0) / bonds.length : 0;
    return {
      totalSizeBn, avgGreenium, avgEsg, highestRated,
      slbCount, slbShare: bonds.length ? ((slbCount / bonds.length) * 100).toFixed(1) : '0',
      cbiCertCount, cbiCertPct: bonds.length ? ((cbiCertCount / bonds.length) * 100).toFixed(1) : '0',
      cbiCertVol, sovCount, sovShare: bonds.length ? ((sovCount / bonds.length) * 100).toFixed(1) : '0',
      socialVol, blueVol, avgCoupon, currencies, countries,
      greenCount, socialCount, susCount, newIssuance2025,
      avgMatYr: avgMatYr.toFixed(0),
    };
  }, [filteredBonds]);

  /* ── Chart data (reactive to filters) ── */
  const tierData = useMemo(() => {
    const tiers = [
      { name: 'Tier 1 (ESG >= 75)', bonds: filteredBonds.filter(b => b.esgScore >= 75) },
      { name: 'Tier 2 (ESG 50-74)', bonds: filteredBonds.filter(b => b.esgScore >= 50 && b.esgScore < 75) },
      { name: 'Tier 3 (ESG < 50)', bonds: filteredBonds.filter(b => b.esgScore < 50) },
    ];
    return tiers.map(t => ({ name: t.name, avgYield: t.bonds.length > 0 ? parseFloat((t.bonds.reduce((s, b) => s + b.yield, 0) / t.bonds.length).toFixed(2)) : 0, count: t.bonds.length }));
  }, [filteredBonds]);
  const yieldSpread = tierData.length >= 3 ? parseFloat((tierData[2].avgYield - tierData[0].avgYield).toFixed(2)) : 0;

  const greeniumData = useMemo(() => {
    return [...filteredBonds].sort((a, b) => a.greenium_bps - b.greenium_bps).slice(0, 30).map(b => ({
      issuer: b.issuer.length > 18 ? b.issuer.slice(0, 16) + '..' : b.issuer, greenium: b.greenium_bps, type: b.type, fullIssuer: b.issuer,
    }));
  }, [filteredBonds]);

  const bondTypeDistribution = useMemo(() => {
    const map = {};
    filteredBonds.forEach(b => { if (!map[b.type]) map[b.type] = { name: b.type, count: 0, totalSize: 0 }; map[b.type].count += 1; map[b.type].totalSize += b.size_mn; });
    return Object.values(map).sort((a, b) => b.totalSize - a.totalSize);
  }, [filteredBonds]);

  const proceedsData = useMemo(() => {
    const keywords = {};
    const keywordList = ['renewable energy','energy efficiency','clean transport','green buildings','biodiversity','climate adaptation','wind','solar','green infrastructure','electrification','offshore wind','green hydrogen','water','marine','education','healthcare','affordable housing','sustainable forestry','battery','recycling','ccus','hydrogen','deforestation','women'];
    filteredBonds.forEach(b => { const lower = b.useOfProceeds.toLowerCase(); keywordList.forEach(kw => { if (lower.includes(kw)) { const display = kw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '); keywords[display] = (keywords[display] || 0) + 1; } }); });
    return Object.entries(keywords).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name, count]) => ({ name, count }));
  }, [filteredBonds]);

  /* ── CBI Sector distribution chart data ── */
  const cbiSectorData = useMemo(() => {
    const map = {};
    filteredBonds.forEach(b => {
      const sec = b.cbi_sector || 'Unclassified';
      if (!map[sec]) map[sec] = { name: sec, count: 0, volume: 0 };
      map[sec].count += 1;
      map[sec].volume += b.size_mn;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [filteredBonds]);

  /* ── Issuance timeline by year and type ── */
  const issuanceTimeline = useMemo(() => {
    const yearMap = {};
    filteredBonds.forEach(b => {
      const yr = b.issue_year;
      if (!yearMap[yr]) yearMap[yr] = { year: yr };
      const cat = ['Green Bond','Sovereign Green','Climate Awareness Bond'].includes(b.type) ? 'Green'
        : b.type === 'SLB' ? 'SLB'
        : ['Social Bond','Gender Bond'].includes(b.type) ? 'Social'
        : ['Sustainability Bond','SDG Bond','Sovereign Sustainability'].includes(b.type) ? 'Sustainability'
        : ['Transition Bond'].includes(b.type) ? 'Transition'
        : 'Blue';
      yearMap[yr][cat] = (yearMap[yr][cat] || 0) + 1;
    });
    return Object.values(yearMap).sort((a, b) => a.year - b.year);
  }, [filteredBonds]);

  /* ── Geographic distribution ── */
  const geoData = useMemo(() => {
    const map = {};
    filteredBonds.forEach(b => {
      if (!map[b.country]) map[b.country] = { country: b.country, count: 0, volume: 0, greeniumSum: 0 };
      map[b.country].count += 1;
      map[b.country].volume += b.size_mn;
      map[b.country].greeniumSum += b.greenium_bps;
    });
    return Object.values(map).map(g => ({ ...g, avgGreenium: (g.greeniumSum / g.count).toFixed(1), volumeBn: (g.volume / 1000).toFixed(1) })).sort((a, b) => b.volume - a.volume);
  }, [filteredBonds]);

  /* ── Greenium by bond type ── */
  const greeniumByType = useMemo(() => {
    const map = {};
    filteredBonds.forEach(b => {
      if (!map[b.type]) map[b.type] = { type: b.type, sum: 0, count: 0 };
      map[b.type].sum += b.greenium_bps;
      map[b.type].count += 1;
    });
    return Object.values(map).map(g => ({ type: g.type.length > 16 ? g.type.slice(0,14)+'..' : g.type, fullType: g.type, avgGreenium: parseFloat((g.sum / g.count).toFixed(1)), count: g.count })).sort((a, b) => a.avgGreenium - b.avgGreenium);
  }, [filteredBonds]);

  /* ── SDG alignment matrix data ── */
  const sdgMatrix = useMemo(() => {
    const matrix = {};
    const types = [...new Set(filteredBonds.map(b => b.type))];
    types.forEach(t => { matrix[t] = {}; for (let i = 1; i <= 17; i++) matrix[t][i] = 0; });
    filteredBonds.forEach(b => { (b.sdgs || []).forEach(sdg => { if (matrix[b.type]) matrix[b.type][sdg] = (matrix[b.type][sdg] || 0) + 1; }); });
    return { matrix, types };
  }, [filteredBonds]);

  const sovBarData = useMemo(() => SOVEREIGN_ESG.map(s => ({ country: s.country, Climate: s.climate, Social: s.social, Governance: s.governance })), []);

  /* ── Greenium calculator data ── */
  const greeniumCalcData = useMemo(() => {
    if (!fiAnalytics) return [];
    return fiAnalytics.items.map(p => {
      const savingsPerMn = Math.abs(p.bond.greenium_bps) * 0.01 * 0.01;
      return { issuer: p.bond.issuer, greenium_bps: p.bond.greenium_bps, notional: p.notional, annualSaving: p.notional * savingsPerMn * 1000000 / 1000000 };
    });
  }, [fiAnalytics]);

  /* ── Combined equity + FI WACI ── */
  const combinedWaci = useMemo(() => {
    const equityWaci = equityHoldings.length > 0
      ? equityHoldings.reduce((s, h) => { const c = h.company || {}; return s + (c.ghg_intensity_tco2e_cr || 0) * ((h.weight || 0) / 100); }, 0)
      : null;
    const fiWaci = fiAnalytics ? fiAnalytics.wAvgEsg : null;
    return { equityWaci, fiWaci };
  }, [equityHoldings, fiAnalytics]);

  /* ── Issuer match cache ── */
  const issuerMatches = useMemo(() => {
    const map = {};
    GREEN_BOND_UNIVERSE.forEach(b => { map[b.id] = matchIssuer(b.issuer); });
    return map;
  }, []);

  /* ── Export helpers ── */
  const exportFiPortfolio = () => {
    if (!fiAnalytics) return;
    const rows = fiAnalytics.items.map(p => ({
      BondID: p.bond.id, Issuer: p.bond.issuer, Type: p.bond.type, Subtype: p.bond.subtype, CBI_Sector: p.bond.cbi_sector, CBI_Certified: p.bond.cbi_certified, Currency: p.bond.currency,
      Coupon: p.bond.coupon, Maturity: p.bond.maturity, Rating: p.bond.rating, ESGScore: p.bond.esgScore, Greenium_bps: p.bond.greenium_bps, Yield: p.bond.yield,
      Notional_USD_Mn: p.notional, Framework: p.bond.framework, Country: p.bond.country, SDGs: (p.bond.sdgs||[]).join(';'),
    }));
    downloadCSV(rows, `fi_portfolio_${new Date().toISOString().slice(0,10)}.csv`);
  };
  const exportGreenBondUniverse = () => {
    const rows = filteredBonds.map(b => ({
      BondID: b.id, Issuer: b.issuer, Type: b.type, Subtype: b.subtype, CBI_Sector: b.cbi_sector, CBI_Certified: b.cbi_certified, Currency: b.currency,
      Coupon: b.coupon, Maturity: b.maturity, Size_Mn: b.size_mn, Rating: b.rating, ESGScore: b.esgScore, Greenium_bps: b.greenium_bps, Yield: b.yield,
      UseOfProceeds: b.useOfProceeds, Framework: b.framework, SPO: b.spo, Country: b.country, Issue_Year: b.issue_year, ISIN_Prefix: b.isin_prefix, SDGs: (b.sdgs||[]).join(';'),
    }));
    downloadCSV(rows, `green_bond_universe_${new Date().toISOString().slice(0,10)}.csv`);
  };
  const exportFrameworkMatrix = () => {
    const rows = filteredBonds.map(b => {
      const row = { Issuer: b.issuer, Type: b.type };
      FRAMEWORKS.forEach(fw => { row[fw] = (b.frameworks_compliance || []).includes(fw) ? 'Yes' : '-'; });
      return row;
    });
    downloadCSV(rows, `framework_compliance_${new Date().toISOString().slice(0,10)}.csv`);
  };

  /* ── Helpers ── */
  const scoreColor = (v) => v >= 75 ? T.green : v >= 50 ? T.amber : T.red;
  const greeniumColor = (v) => { const abs = Math.abs(v); if (abs >= 10) return '#14532d'; if (abs >= 6) return '#166534'; if (abs >= 3) return '#22c55e'; return '#86efac'; };
  const arrow = (col, cs, cd) => col === cs ? (cd === 'asc' ? ' \u25B2' : ' \u25BC') : '';
  const isInFiPortfolio = (bondId) => fiPortfolio.some(p => p.bondId === bondId);

  /* ── Styles ── */
  const sectionStyle = { background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '24px 28px', marginBottom: 24 };
  const sectionTitle = { fontSize: 16, fontWeight: 700, color: T.navy, marginBottom: 16 };
  const thStyle = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.6, borderBottom: `2px solid ${T.border}`, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '9px 12px', fontSize: 13, color: T.text, borderBottom: `1px solid ${T.border}` };
  const btnPrimary = { padding: '6px 14px', borderRadius: 8, border: 'none', background: T.navy, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.font };
  const btnSecondary = { padding: '6px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.textSec, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: T.font };
  const selectStyle = { padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, fontFamily: T.font, color: T.text, background: T.bg, cursor: 'pointer' };
  const inputStyle = { padding: '7px 12px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, fontFamily: T.font, color: T.text, outline: 'none', background: T.bg };
  const kpiCard = { flex: '1 1 0', minWidth: 130, background: T.surface, borderRadius: 10, padding: '14px 16px', border: `1px solid ${T.border}`, textAlign: 'center' };
  const kpiLabel = { fontSize: 9, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 };
  const kpiValue = { fontSize: 22, fontWeight: 700, color: T.navy };
  const kpiSub = { fontSize: 10, color: T.textSec, marginTop: 2 };
  const tabBtn = (active) => ({ padding: '8px 20px', borderRadius: '8px 8px 0 0', border: `1px solid ${active ? T.navy : T.border}`, borderBottom: active ? `2px solid ${T.navy}` : `1px solid ${T.border}`, background: active ? T.surface : T.surfaceH, color: active ? T.navy : T.textMut, fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: T.font, marginRight: 4 });
  const chipStyle = (active) => ({ padding: '4px 12px', borderRadius: 20, border: `1px solid ${active ? T.navy : T.border}`, background: active ? `${T.navy}12` : T.surface, color: active ? T.navy : T.textMut, fontSize: 11, fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: T.font, whiteSpace: 'nowrap' });

  const hasActiveFilters = searchTerm || typeFilter !== 'All' || tierFilter !== 'All' || currencyFilter !== 'All' || ratingFilter !== 'All' || cbiSectorFilter !== 'All' || cbiCertifiedOnly || countryFilter !== 'All';

  const sdgNames = { 1:'No Poverty',2:'Zero Hunger',3:'Good Health',4:'Quality Education',5:'Gender Equality',6:'Clean Water',7:'Affordable Energy',8:'Decent Work',9:'Industry & Innovation',10:'Reduced Inequalities',11:'Sustainable Cities',12:'Responsible Consumption',13:'Climate Action',14:'Life Below Water',15:'Life on Land',16:'Peace & Justice',17:'Partnerships' };
  const sdgColors = { 1:'#e5243b',2:'#dda63a',3:'#4c9f38',4:'#c5192d',5:'#ff3a21',6:'#26bde2',7:'#fcc30b',8:'#a21942',9:'#fd6925',10:'#dd1367',11:'#fd9d24',12:'#bf8b2e',13:'#3f7e44',14:'#0a97d9',15:'#56c02b',16:'#00689d',17:'#19486a' };

  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: 0 }}>Fixed Income &amp; Sustainable Bond Analytics</h1>
            <span style={{ background: `${T.sage}18`, color: T.sage, fontSize: 10, fontWeight: 600, padding: '4px 12px', borderRadius: 20, letterSpacing: 0.3 }}>CBI Taxonomy &middot; ICMA GBP/SBP/SBG/SLBP &middot; Greenium &middot; SDG Alignment</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate('/portfolio-manager')} style={btnSecondary}>View Equity Portfolio</button>
            <button onClick={exportGreenBondUniverse} style={btnSecondary}>Export Universe</button>
            <button onClick={exportFrameworkMatrix} style={btnSecondary}>Export Frameworks</button>
            {fiAnalytics && <button onClick={exportFiPortfolio} style={btnPrimary}>Export FI Portfolio</button>}
          </div>
        </div>
        <p style={{ fontSize: 13, color: T.textSec, margin: 0 }}>{GREEN_BOND_UNIVERSE.length}-bond universe across {Object.keys(BOND_TYPES).length} bond types, 8 CBI taxonomy sectors, {ALL_CURRENCIES.length - 1} currencies, {ALL_COUNTRIES.length - 1} countries</p>
      </div>

      {/* ── KPI STRIP — Row 1 (8 KPIs) ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'Universe Size', val: filteredBonds.length, sub: `of ${GREEN_BOND_UNIVERSE.length} total`, color: T.navy },
          { label: 'Total Volume', val: `$${universeKpis.totalSizeBn.toFixed(1)}Bn`, sub: 'across all bonds', color: T.navy },
          { label: 'CBI Certified', val: `${universeKpis.cbiCertPct}%`, sub: `${universeKpis.cbiCertCount} bonds / $${universeKpis.cbiCertVol.toFixed(1)}Bn`, color: T.sage },
          { label: 'Avg Greenium', val: `${universeKpis.avgGreenium.toFixed(1)} bps`, sub: 'vs conventional', color: T.green },
          { label: 'Avg ESG Score', val: universeKpis.avgEsg.toFixed(1), sub: 'universe weighted', color: scoreColor(universeKpis.avgEsg) },
          { label: 'Top Rated', val: universeKpis.highestRated?.issuer?.split('(')[0]?.trim()?.slice(0,20) || '-', sub: universeKpis.highestRated ? `ESG ${universeKpis.highestRated.esgScore}/100` : '-', color: T.navy, fontSize: 14 },
          { label: 'Sovereign Share', val: `${universeKpis.sovShare}%`, sub: `${universeKpis.sovCount} sovereign bonds`, color: T.navyL },
          { label: 'SLB Share', val: `${universeKpis.slbShare}%`, sub: `${universeKpis.slbCount} SLBs`, color: T.amber },
        ].map((m, i) => (
          <div key={i} style={kpiCard}>
            <div style={kpiLabel}>{m.label}</div>
            <div style={{ ...kpiValue, color: m.color, fontSize: m.fontSize || 22 }}>{m.val}</div>
            <div style={kpiSub}>{m.sub}</div>
          </div>
        ))}
      </div>
      {/* ── KPI STRIP — Row 2 (8 KPIs) ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Social Bond Vol.', val: `$${universeKpis.socialVol.toFixed(1)}Bn`, sub: `${universeKpis.socialCount} social bonds`, color: '#7c3aed' },
          { label: 'Blue Bond Vol.', val: `$${universeKpis.blueVol.toFixed(1)}Bn`, sub: 'ocean & marine', color: '#2563eb' },
          { label: 'Avg Coupon', val: `${universeKpis.avgCoupon.toFixed(2)}%`, sub: 'across universe', color: T.navy },
          { label: 'Currencies', val: universeKpis.currencies, sub: 'covered', color: T.navy },
          { label: 'Countries', val: universeKpis.countries, sub: 'represented', color: T.navy },
          { label: 'G / S / Sus Split', val: `${universeKpis.greenCount}/${universeKpis.socialCount}/${universeKpis.susCount}`, sub: 'Green / Social / Sus', color: T.sage },
          { label: 'New Issuance 2024+', val: universeKpis.newIssuance2025, sub: 'bonds issued', color: T.gold },
          { label: 'Avg Maturity', val: universeKpis.avgMatYr, sub: 'maturity year', color: T.navy },
        ].map((m, i) => (
          <div key={i} style={kpiCard}>
            <div style={kpiLabel}>{m.label}</div>
            <div style={{ ...kpiValue, color: m.color, fontSize: 20 }}>{m.val}</div>
            <div style={kpiSub}>{m.sub}</div>
          </div>
        ))}
        {fiAnalytics && (
          <div style={{ ...kpiCard, border: `1px solid ${T.sage}40`, background: `${T.sage}06` }}>
            <div style={kpiLabel}>FI Portfolio</div>
            <div style={{ ...kpiValue, color: T.sage }}>{fiAnalytics.totalNotional.toFixed(0)}</div>
            <div style={kpiSub}>USD Mn / {fiAnalytics.items.length} bonds</div>
          </div>
        )}
      </div>

      {/* FI Portfolio Analytics Panel */}
      {fiAnalytics && (
        <div style={{ ...sectionStyle, border: `1px solid ${T.sage}40`, background: `${T.sage}04` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={sectionTitle}>FI Portfolio Analytics</div>
            <button onClick={exportFiPortfolio} style={btnPrimary}>Export FI Portfolio CSV</button>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Notional', val: `${fiAnalytics.totalNotional.toFixed(1)} USD Mn`, color: T.navy },
              { label: 'Wtd Avg ESG', val: fiAnalytics.wAvgEsg.toFixed(1), color: scoreColor(fiAnalytics.wAvgEsg) },
              { label: 'Wtd Avg Greenium', val: `${fiAnalytics.wAvgGreenium.toFixed(1)} bps`, color: T.green },
              { label: 'Wtd Avg Yield', val: `${fiAnalytics.wAvgYield.toFixed(2)}%`, color: T.navy },
              { label: 'Green Share', val: `${fiAnalytics.greenSharePct.toFixed(1)}%`, color: T.sage },
              { label: 'SLB Share', val: `${fiAnalytics.slbSharePct.toFixed(1)}%`, color: T.amber },
              { label: 'Social Share', val: `${fiAnalytics.socialSharePct.toFixed(1)}%`, color: '#7c3aed' },
            ].map((m, i) => (
              <div key={i} style={{ flex: '1 1 0', minWidth: 120, background: T.surface, borderRadius: 8, padding: '10px 14px', border: `1px solid ${T.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: m.color }}>{m.val}</div>
              </div>
            ))}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Issuer','Type','CBI Sector','Ccy','Rating','ESG','Yield','Greenium','Notional (Mn)','Issuer Match',''].map((h, i) => (
                    <th key={i} style={{ ...thStyle, cursor: 'default', textAlign: ['ESG','Yield','Greenium','Notional (Mn)'].includes(h) ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fiAnalytics.items.map((p, i) => {
                  const b = p.bond;
                  const match = issuerMatches[b.id];
                  return (
                    <tr key={b.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ ...tdStyle, fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.issuer}</td>
                      <td style={tdStyle}><span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: `${BOND_TYPE_COLORS[b.type] || T.textMut}18`, color: BOND_TYPE_COLORS[b.type] || T.textMut }}>{b.type}</span></td>
                      <td style={{ ...tdStyle, fontSize: 11 }}>{b.cbi_sector}</td>
                      <td style={tdStyle}>{b.currency}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{b.rating}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: scoreColor(b.esgScore) }}>{b.esgScore}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{b.yield.toFixed(2)}%</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: greeniumColor(b.greenium_bps) }}>{b.greenium_bps}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <input type="number" value={p.notional} min={0} step={1} onChange={e => updateNotional(b.id, e.target.value)}
                          style={{ ...inputStyle, width: 80, textAlign: 'right', padding: '4px 6px' }} />
                      </td>
                      <td style={tdStyle}>
                        {match ? (
                          <div style={{ fontSize: 11 }}>
                            <div style={{ color: T.sage, fontWeight: 600 }}>{match.name}</div>
                            <div style={{ color: T.textMut }}>{match.sector} / SBTi: {match.sbti_committed ? 'Yes' : 'No'}</div>
                            <button onClick={() => navigate('/holdings-deep-dive')} style={{ background: 'none', border: 'none', color: T.navyL, fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: T.font, textDecoration: 'underline' }}>Holdings Deep-Dive</button>
                          </div>
                        ) : <span style={{ fontSize: 11, color: T.textMut }}>-</span>}
                      </td>
                      <td style={tdStyle}>
                        <button onClick={() => removeFromFiPortfolio(b.id)} style={{ ...btnSecondary, color: T.red, borderColor: `${T.red}40`, padding: '4px 10px', fontSize: 11 }}>Remove</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Combined Portfolio Climate Metrics */}
      {equityHoldings.length > 0 && fiAnalytics && (
        <div style={{ ...sectionStyle, border: `1px solid ${T.gold}40`, background: `${T.gold}06` }}>
          <div style={sectionTitle}>Combined Portfolio Climate Metrics (Equity + Fixed Income)</div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, padding: '14px 18px', background: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Equity Portfolio</div>
              <div style={{ fontSize: 14, color: T.text }}>{equityHoldings.length} holdings</div>
              {combinedWaci.equityWaci !== null && <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginTop: 4 }}>WACI: {combinedWaci.equityWaci.toFixed(1)} tCO2e/Cr</div>}
            </div>
            <div style={{ flex: 1, minWidth: 200, padding: '14px 18px', background: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Fixed Income Portfolio</div>
              <div style={{ fontSize: 14, color: T.text }}>{fiAnalytics.items.length} bonds / {fiAnalytics.totalNotional.toFixed(0)} USD Mn</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.sage, marginTop: 4 }}>Wtd ESG: {fiAnalytics.wAvgEsg.toFixed(1)} / Green: {fiAnalytics.greenSharePct.toFixed(0)}%</div>
            </div>
            <div style={{ flex: 1, minWidth: 200, padding: '14px 18px', background: `${T.navy}08`, borderRadius: 10, border: `1px solid ${T.navy}20` }}>
              <div style={{ fontSize: 11, color: T.textMut, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Combined View</div>
              <div style={{ fontSize: 13, color: T.text }}>Total instruments: {equityHoldings.length + fiAnalytics.items.length}</div>
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>Greenium benefit: {Math.abs(fiAnalytics.wAvgGreenium).toFixed(1)} bps on FI allocation</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: 0, flexWrap: 'wrap' }}>
        {['universe','analytics','portfolio','sovereign','frameworks'].map(tab => (
          <button key={tab} style={tabBtn(activeTab === tab)} onClick={() => setActiveTab(tab)}>
            {{ universe: 'Bond Universe', analytics: 'Analytics & Charts', portfolio: 'Greenium Calculator', sovereign: 'Sovereign ESG', frameworks: 'Framework & SDG' }[tab]}
          </button>
        ))}
      </div>

      {/* ═══════════ Tab: Universe ═══════════ */}
      {activeTab === 'universe' && (
        <>
          {/* CBI Sector Chip Bar */}
          <div style={{ ...sectionStyle, borderTopLeftRadius: 0, padding: '12px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginRight: 4 }}>CBI Sector:</span>
              {CBI_SECTORS.map(sec => (
                <button key={sec} style={chipStyle(cbiSectorFilter === sec)} onClick={() => setCbiSectorFilter(sec)}>{sec}</button>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 12, fontSize: 11, color: T.textSec, cursor: 'pointer' }}>
                <input type="checkbox" checked={cbiCertifiedOnly} onChange={e => setCbiCertifiedOnly(e.target.checked)} style={{ accentColor: T.sage }} />
                CBI Certified Only
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <input type="text" placeholder="Search issuer, type, currency, country, CBI sector..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={selectStyle}>
                {ALL_TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
              </select>
              <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} style={selectStyle}>
                {ESG_TIERS.map(t => <option key={t} value={t}>{t === 'All' ? 'All ESG Tiers' : t}</option>)}
              </select>
              <select value={currencyFilter} onChange={e => setCurrencyFilter(e.target.value)} style={selectStyle}>
                {ALL_CURRENCIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Currencies' : c}</option>)}
              </select>
              <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} style={selectStyle}>
                {ALL_RATINGS.map(r => <option key={r} value={r}>{r === 'All' ? 'All Ratings' : r}</option>)}
              </select>
              <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={selectStyle}>
                {ALL_COUNTRIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Countries' : c}</option>)}
              </select>
              {hasActiveFilters && (
                <button onClick={() => { setSearchTerm(''); setTypeFilter('All'); setTierFilter('All'); setCurrencyFilter('All'); setRatingFilter('All'); setCbiSectorFilter('All'); setCbiCertifiedOnly(false); setCountryFilter('All'); }} style={{ ...btnSecondary, padding: '6px 12px' }}>Clear All</button>
              )}
            </div>
          </div>

          {/* Bond Universe Table */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={sectionTitle}>Sustainable Bond Universe ({filteredBonds.length})</div>
              <button onClick={exportGreenBondUniverse} style={btnSecondary}>Export CSV</button>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 600, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr style={{ background: T.surface }}>
                    {[
                      { key:'issuer', label:'Issuer' },{ key:'type', label:'Type' },{ key:'cbi_sector', label:'CBI Sector' },
                      { key:'cbi_certified', label:'CBI' },{ key:'currency', label:'Ccy' },{ key:'coupon', label:'Coupon' },
                      { key:'maturity', label:'Mat.' },{ key:'size_mn', label:'Size (Mn)' },{ key:'rating', label:'Rating' },
                      { key:'esgScore', label:'ESG' },{ key:'greenium_bps', label:'Greenium' },{ key:'yield', label:'Yield' },
                      { key:'country', label:'Country' },{ key:'framework', label:'Framework' },
                    ].map(col => (
                      <th key={col.key} style={{ ...thStyle, textAlign: ['coupon','size_mn','esgScore','greenium_bps','yield'].includes(col.key) ? 'right' : 'left', background: T.surface }} onClick={() => toggleSort(col.key)}>
                        {col.label}{arrow(col.key, sortCol, sortDir)}
                      </th>
                    ))}
                    <th style={{ ...thStyle, cursor: 'default', textAlign: 'center', background: T.surface }}>Match</th>
                    <th style={{ ...thStyle, cursor: 'default', textAlign: 'center', background: T.surface }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBonds.map((b, i) => {
                    const inPortfolio = isInFiPortfolio(b.id);
                    const match = issuerMatches[b.id];
                    return (
                      <tr key={b.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ ...tdStyle, fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.issuer}>{b.issuer}</td>
                        <td style={tdStyle}><span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: `${BOND_TYPE_COLORS[b.type] || T.textMut}18`, color: BOND_TYPE_COLORS[b.type] || T.textMut, whiteSpace: 'nowrap' }}>{b.type}</span></td>
                        <td style={{ ...tdStyle, fontSize: 11 }}>{b.cbi_sector}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{b.cbi_certified ? <span style={{ color: T.sage, fontWeight: 700, fontSize: 14 }} title="CBI Certified">&#10003;</span> : <span style={{ color: T.textMut, fontSize: 11 }}>-</span>}</td>
                        <td style={{ ...tdStyle, fontWeight: 500 }}>{b.currency}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{b.coupon.toFixed(2)}%</td>
                        <td style={tdStyle}>{b.maturity}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{b.size_mn.toLocaleString()}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{b.rating}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: scoreColor(b.esgScore), fontVariantNumeric: 'tabular-nums' }}>{b.esgScore}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: greeniumColor(b.greenium_bps), fontVariantNumeric: 'tabular-nums' }}>{b.greenium_bps}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{b.yield.toFixed(2)}%</td>
                        <td style={{ ...tdStyle, fontSize: 11 }}>{b.country}</td>
                        <td style={{ ...tdStyle, fontSize: 10, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.framework}>{b.framework}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          {match ? (
                            <span title={`${match.name} | ${match.sector} | SBTi: ${match.sbti_committed ? 'Yes' : 'No'}`}
                              style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: `${T.sage}15`, color: T.sage, fontWeight: 600, cursor: 'help' }}>
                              {match.ticker || match.shortName || 'OK'}
                            </span>
                          ) : <span style={{ fontSize: 10, color: T.textMut }}>-</span>}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          {inPortfolio ? (
                            <span style={{ fontSize: 10, color: T.sage, fontWeight: 600 }}>In Portfolio</span>
                          ) : addingBondId === b.id ? (
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              <input type="number" value={addNotionalInput} min={1} step={1} onChange={e => setAddNotionalInput(e.target.value)}
                                style={{ ...inputStyle, width: 55, padding: '3px 5px', textAlign: 'right', fontSize: 11 }} placeholder="Mn" />
                              <button onClick={() => { addToFiPortfolio(b.id, addNotionalInput); setAddingBondId(null); setAddNotionalInput('10'); }}
                                style={{ ...btnPrimary, padding: '3px 8px', fontSize: 10, background: T.sage }}>Add</button>
                              <button onClick={() => { setAddingBondId(null); setAddNotionalInput('10'); }}
                                style={{ background: 'none', border: 'none', color: T.textMut, cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>&times;</button>
                            </div>
                          ) : (
                            <button onClick={() => { setAddingBondId(b.id); setAddNotionalInput('10'); }}
                              style={{ ...btnPrimary, padding: '3px 8px', fontSize: 10, background: T.sage }}>+ Portfolio</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════════ Tab: Analytics & Charts ═══════════ */}
      {activeTab === 'analytics' && (
        <>
          {/* Row 1: ESG Tier Yield + Greenium by Type */}
          <div style={{ ...sectionStyle, borderTopLeftRadius: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={sectionTitle}>ESG Tier Yield Spread</div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.navy, background: `${T.navy}10`, padding: '4px 10px', borderRadius: 8 }}>Spread: {yieldSpread} bps</span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={tierData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
                    <YAxis tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v, name) => name === 'avgYield' ? [`${v}%`, 'Avg Yield'] : [v, 'Bonds']} contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
                    <Bar dataKey="avgYield" radius={[6, 6, 0, 0]} name="Avg Yield">
                      {tierData.map((_, idx) => <Cell key={idx} fill={idx === 0 ? T.green : idx === 1 ? T.amber : T.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div style={sectionTitle}>Avg Greenium by Bond Type</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={greeniumByType} margin={{ top: 10, right: 20, left: 10, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="type" tick={{ fontSize: 9, fill: T.textSec }} angle={-35} textAnchor="end" height={70} />
                    <YAxis tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={v => `${v}`} />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const d = payload[0].payload;
                      return (<div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
                        <div style={{ fontWeight: 700 }}>{d.fullType}</div>
                        <div>Avg Greenium: {d.avgGreenium} bps</div><div>{d.count} bonds</div>
                      </div>);
                    }} />
                    <ReferenceLine y={0} stroke={T.borderL} strokeDasharray="3 3" />
                    <Bar dataKey="avgGreenium" radius={[4, 4, 0, 0]}>
                      {greeniumByType.map((entry, idx) => <Cell key={idx} fill={BOND_TYPE_COLORS[entry.fullType] || T.textMut} opacity={0.85} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2: Bond Type Pie + CBI Sector Distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div style={sectionStyle}>
              <div style={sectionTitle}>Bond Type Distribution ({Object.keys(BOND_TYPES).length} types)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ResponsiveContainer width="50%" height={300}>
                  <PieChart>
                    <Pie data={bondTypeDistribution} dataKey="totalSize" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={45} paddingAngle={2} strokeWidth={0}>
                      {bondTypeDistribution.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${(v / 1000).toFixed(1)} Bn`, 'Total Size']} contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, maxHeight: 300, overflowY: 'auto' }}>
                  {bondTypeDistribution.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: PIE_COLORS[idx % PIE_COLORS.length], flexShrink: 0 }} />
                      <div><div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{item.name}</div>
                        <div style={{ fontSize: 10, color: T.textMut }}>{item.count} bonds / {(item.totalSize / 1000).toFixed(1)} Bn</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={sectionStyle}>
              <div style={sectionTitle}>CBI Taxonomy Sector Distribution</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cbiSectorData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={120} />
                  <Tooltip formatter={(v, name) => [name === 'count' ? v : `${(v/1000).toFixed(1)} Bn`, name === 'count' ? 'Bonds' : 'Volume']} contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Bar dataKey="count" fill={T.sage} radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 3: Issuance Timeline + Geographic Distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div style={sectionStyle}>
              <div style={sectionTitle}>Issuance Timeline by Year</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={issuanceTimeline} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Green" stackId="a" fill={T.green} />
                  <Bar dataKey="Social" stackId="a" fill="#7c3aed" />
                  <Bar dataKey="Sustainability" stackId="a" fill="#0d9488" />
                  <Bar dataKey="SLB" stackId="a" fill={T.amber} />
                  <Bar dataKey="Transition" stackId="a" fill={T.red} />
                  <Bar dataKey="Blue" stackId="a" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={sectionStyle}>
              <div style={sectionTitle}>Use of Proceeds Analysis</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={proceedsData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: T.textSec }} width={140} />
                  <Tooltip formatter={(v) => [v, 'Bond Count']} contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Bar dataKey="count" fill={T.sage} radius={[0, 4, 4, 0]} barSize={16}>
                    {proceedsData.map((_, idx) => <Cell key={idx} fill={idx < 4 ? T.sage : T.sageL} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 4: Greenium by Issuer + Geographic Table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div style={sectionStyle}>
              <div style={sectionTitle}>Greenium Analysis (Top 30 Issuers)</div>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={greeniumData} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="issuer" tick={{ fontSize: 8, fill: T.textSec }} angle={-45} textAnchor="end" height={90} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={v => `${v}`} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (<div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
                      <div style={{ fontWeight: 700 }}>{d.fullIssuer}</div>
                      <div>Type: {d.type}</div><div>Greenium: {d.greenium} bps</div>
                    </div>);
                  }} />
                  <ReferenceLine y={0} stroke={T.borderL} strokeDasharray="3 3" />
                  <Bar dataKey="greenium" radius={[4, 4, 0, 0]}>
                    {greeniumData.map((entry, idx) => <Cell key={idx} fill={BOND_TYPE_COLORS[entry.type] || T.textMut} opacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                {Object.entries(BOND_TYPE_COLORS).slice(0, 8).map(([type, color]) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: T.textSec }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />{type}
                  </div>
                ))}
              </div>
            </div>

            <div style={sectionStyle}>
              <div style={sectionTitle}>Geographic Distribution ({geoData.length} countries)</div>
              <div style={{ overflowX: 'auto', maxHeight: 380, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0 }}>
                    <tr style={{ background: T.surface }}>
                      {['Country','Bonds','Volume (Bn)','Avg Greenium'].map(h => (
                        <th key={h} style={{ ...thStyle, cursor: 'default', textAlign: h === 'Country' ? 'left' : 'right', background: T.surface }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {geoData.map((g, i) => (
                      <tr key={g.country} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{g.country}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{g.count}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>${g.volumeBn}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: greeniumColor(parseFloat(g.avgGreenium)), fontWeight: 600 }}>{g.avgGreenium} bps</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════ Tab: Greenium Calculator ═══════════ */}
      {activeTab === 'portfolio' && (
        <div style={{ ...sectionStyle, borderTopLeftRadius: 0 }}>
          <div style={sectionTitle}>Interactive Greenium Calculator</div>
          {!fiAnalytics ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: T.textMut }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>&#x1F4CA;</div>
              <p style={{ fontSize: 13 }}>Add bonds to your FI Portfolio to use the Greenium Calculator.</p>
              <button onClick={() => setActiveTab('universe')} style={btnPrimary}>Go to Bond Universe</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20, padding: '16px 20px', background: T.surfaceH, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>Portfolio Scale Multiplier (USD Mn):</label>
                  <span style={{ fontSize: 18, fontWeight: 700, color: T.navy, minWidth: 60 }}>{greeniumMultiplier}</span>
                </div>
                <input type="range" min={10} max={1000} step={10} value={greeniumMultiplier} onChange={e => setGreeniumMultiplier(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: T.sage }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMut, marginTop: 4 }}>
                  <span>10 Mn</span><span>500 Mn</span><span>1,000 Mn</span>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Issuer','Type','Greenium (bps)','Notional (Mn)','Annual Saving ($)',`Scaled @ ${greeniumMultiplier}Mn ($)`].map(h => (
                        <th key={h} style={{ ...thStyle, cursor: 'default', textAlign: h === 'Issuer' || h === 'Type' ? 'left' : 'right' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {greeniumCalcData.map((r, i) => {
                      const bond = fiAnalytics.items[i]?.bond;
                      const scaleFactor = greeniumMultiplier / fiAnalytics.totalNotional;
                      const scaledSaving = r.annualSaving * scaleFactor;
                      return (
                        <tr key={i} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{r.issuer}</td>
                          <td style={tdStyle}><span style={{ padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: `${BOND_TYPE_COLORS[bond?.type] || T.textMut}18`, color: BOND_TYPE_COLORS[bond?.type] || T.textMut }}>{bond?.type}</span></td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: greeniumColor(r.greenium_bps), fontWeight: 600 }}>{r.greenium_bps}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{r.notional.toFixed(1)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: T.green }}>${(r.annualSaving * 1e6).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: T.sage }}>${(scaledSaving * 1e6).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: `${T.navy}08` }}>
                      <td style={{ ...tdStyle, fontWeight: 700, color: T.navy }} colSpan={2}>Total</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: T.navy }}>{fiAnalytics.wAvgGreenium.toFixed(1)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: T.navy }}>{fiAnalytics.totalNotional.toFixed(1)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: T.green }}>
                        ${(greeniumCalcData.reduce((s, r) => s + r.annualSaving, 0) * 1e6).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: T.sage }}>
                        ${(greeniumCalcData.reduce((s, r) => s + r.annualSaving, 0) * (greeniumMultiplier / fiAnalytics.totalNotional) * 1e6).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 16, padding: '12px 16px', background: `${T.sage}08`, borderRadius: 10, border: `1px solid ${T.sage}20`, fontSize: 12, color: T.textSec }}>
                Greenium represents the yield advantage sustainable bonds offer over conventional equivalents. At {greeniumMultiplier} USD Mn, estimated annual savings: ${(greeniumCalcData.reduce((s, r) => s + r.annualSaving, 0) * (greeniumMultiplier / fiAnalytics.totalNotional) * 1e6).toLocaleString(undefined, { maximumFractionDigits: 0 })}.
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════ Tab: Sovereign ESG ═══════════ */}
      {activeTab === 'sovereign' && (
        <div style={{ ...sectionStyle, borderTopLeftRadius: 0 }}>
          <div style={sectionTitle}>Sovereign ESG Comparison ({SOVEREIGN_ESG.length} Countries)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0 }}>
                  <tr style={{ background: T.surface }}>
                    {[
                      { key:'country', label:'Country' },{ key:'score', label:'ESG Score' },
                      { key:'climate', label:'Climate' },{ key:'social', label:'Social' },
                      { key:'governance', label:'Governance' },{ key:'ndgain', label:'ND-GAIN' },
                      { key:'rating', label:'Rating' },
                    ].map(col => (
                      <th key={col.key} style={{ ...thStyle, textAlign: ['score','climate','social','governance','ndgain'].includes(col.key) ? 'right' : 'left', background: T.surface }} onClick={() => toggleSovSort(col.key)}>
                        {col.label}{arrow(col.key, sovSortCol, sovSortDir)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedSovereign.map((s, i) => (
                    <tr key={s.country} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{s.country}</td>
                      {['score','climate','social','governance'].map(k => (
                        <td key={k} style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: scoreColor(s[k]), fontVariantNumeric: 'tabular-nums' }}>{s[k]}</td>
                      ))}
                      <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{s.ndgain.toFixed(1)}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{s.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <ResponsiveContainer width="100%" height={480}>
                <BarChart data={sovBarData} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="country" tick={{ fontSize: 9, fill: T.textSec }} angle={-35} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 11, fill: T.textSec }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Climate" fill={T.sage} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Social" fill={T.gold} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Governance" fill={T.navy} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ Tab: Framework & SDG ═══════════ */}
      {activeTab === 'frameworks' && (
        <>
          {/* Framework Compliance Matrix */}
          <div style={{ ...sectionStyle, borderTopLeftRadius: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={sectionTitle}>Framework Compliance Matrix</div>
              <button onClick={exportFrameworkMatrix} style={btnSecondary}>Export CSV</button>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr style={{ background: T.surface }}>
                    <th style={{ ...thStyle, cursor: 'default', background: T.surface, position: 'sticky', left: 0, zIndex: 3 }}>Issuer</th>
                    <th style={{ ...thStyle, cursor: 'default', background: T.surface }}>Type</th>
                    {FRAMEWORKS.map(fw => (
                      <th key={fw} style={{ ...thStyle, cursor: 'default', textAlign: 'center', background: T.surface, fontSize: 9 }}>{fw}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBonds.slice(0, 50).map((b, i) => (
                    <tr key={b.id} style={{ background: i % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ ...tdStyle, fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: i % 2 === 0 ? T.surface : T.surfaceH }} title={b.issuer}>{b.issuer}</td>
                      <td style={tdStyle}><span style={{ padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: `${BOND_TYPE_COLORS[b.type] || T.textMut}18`, color: BOND_TYPE_COLORS[b.type] || T.textMut }}>{b.type}</span></td>
                      {FRAMEWORKS.map(fw => (
                        <td key={fw} style={{ ...tdStyle, textAlign: 'center' }}>
                          {(b.frameworks_compliance || []).includes(fw)
                            ? <span style={{ color: T.sage, fontWeight: 700 }}>&#10003;</span>
                            : <span style={{ color: T.textMut }}>-</span>
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredBonds.length > 50 && <div style={{ fontSize: 11, color: T.textMut, marginTop: 8, textAlign: 'center' }}>Showing first 50 of {filteredBonds.length} bonds. Export CSV for complete data.</div>}
          </div>

          {/* SDG Alignment Heatmap */}
          <div style={sectionStyle}>
            <div style={sectionTitle}>SDG Alignment Matrix (Bond Types x SDGs)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, cursor: 'default', fontSize: 10 }}>Bond Type</th>
                    {Array.from({ length: 17 }, (_, i) => i + 1).map(sdg => (
                      <th key={sdg} style={{ ...thStyle, cursor: 'default', textAlign: 'center', fontSize: 9, padding: '6px 4px', minWidth: 36 }} title={sdgNames[sdg]}>
                        <div style={{ width: 22, height: 22, borderRadius: 4, background: sdgColors[sdg], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, margin: '0 auto 2px' }}>{sdg}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sdgMatrix.types.map((type, ti) => (
                    <tr key={type} style={{ background: ti % 2 === 0 ? T.surface : T.surfaceH }}>
                      <td style={{ ...tdStyle, fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>
                        <span style={{ padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: `${BOND_TYPE_COLORS[type] || T.textMut}18`, color: BOND_TYPE_COLORS[type] || T.textMut }}>{type}</span>
                      </td>
                      {Array.from({ length: 17 }, (_, i) => i + 1).map(sdg => {
                        const val = sdgMatrix.matrix[type]?.[sdg] || 0;
                        const maxVal = Math.max(...Object.values(sdgMatrix.matrix).map(m => m[sdg] || 0), 1);
                        const intensity = val > 0 ? Math.max(0.15, val / maxVal) : 0;
                        return (
                          <td key={sdg} style={{ ...tdStyle, textAlign: 'center', padding: '4px 2px' }}>
                            {val > 0 ? (
                              <div style={{ width: 28, height: 28, borderRadius: 6, background: `${sdgColors[sdg]}${Math.round(intensity * 200).toString(16).padStart(2, '0')}`, color: intensity > 0.5 ? '#fff' : T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, margin: '0 auto' }}>{val}</div>
                            ) : <span style={{ color: T.textMut, fontSize: 10 }}>-</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(sdgNames).map(([num, name]) => (
                <span key={num} style={{ fontSize: 9, color: T.textSec, padding: '2px 6px', borderRadius: 4, background: `${sdgColors[num]}15`, whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: 700, color: sdgColors[num] }}>{num}</span> {name}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: T.textMut }}>
        Fixed Income &amp; Sustainable Bond Analytics &middot; {GREEN_BOND_UNIVERSE.length} bonds &middot; {Object.keys(BOND_TYPES).length} bond types &middot; 8 CBI sectors &middot; {SOVEREIGN_ESG.length} sovereigns &middot; ICMA GBP/SBP/SBG/SLBP aligned &middot; Generated {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}

export default FixedIncomeEsgPage;
