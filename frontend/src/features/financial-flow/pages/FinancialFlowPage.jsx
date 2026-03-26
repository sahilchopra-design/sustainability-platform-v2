import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  PieChart, Pie, LineChart, Line, AreaChart, Area, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* =================================================================
   THEME
   ================================================================= */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const PIE_COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#0284c7','#7c3aed','#0d9488','#d97706','#dc2626','#2563eb','#ec4899','#f59e0b','#4b5563','#16a34a','#9333ea','#06b6d4'];

/* =================================================================
   EXTERNALITY PRICING (full 5-category)
   ================================================================= */
const EXTERNALITY_PRICES = {
  carbon: { price: 51, unit: 'USD/tonne CO\u2082e', source: 'EPA Social Cost of Carbon (2024)', color: '#dc2626' },
  water: { price: 2.5, unit: 'USD/megalitre', source: 'Shadow price in stressed regions', color: '#06b6d4' },
  air_pollution: { price: 8.5, unit: 'USD/tonne SOx/NOx', source: 'WHO health cost estimates', color: '#d97706' },
  biodiversity: { price: 15, unit: 'USD/hectare-year', source: 'Ecosystem service valuation (TEEB)', color: '#16a34a' },
  waste_disposal: { price: 75, unit: 'USD/tonne', source: 'Landfill + collection cost', color: '#7c3aed' },
};

/* =================================================================
   FINANCIAL FLOW MODEL (15 products with full BOM)
   ================================================================= */
const FINANCIAL_FLOWS = {
  ev_battery: {
    name: 'EV Battery Pack (75 kWh NMC811)', icon: '\ud83d\udd0b', sector: 'Automotive',
    stages: [
      { stage:'Raw Materials', cost_usd:3800, components:[
        { material:'Lithium Carbonate', quantity_kg:8.9, price_per_kg:12.5, cost:111, commodity_id:'LITHIUM', origin:'Chile' },
        { material:'Cobalt Sulfate', quantity_kg:4.4, price_per_kg:28.0, cost:123, commodity_id:'COBALT', origin:'DRC' },
        { material:'Nickel Sulfate', quantity_kg:39.0, price_per_kg:16.2, cost:632, commodity_id:'NICKEL', origin:'Indonesia' },
        { material:'Synthetic Graphite', quantity_kg:53.0, price_per_kg:0.65, cost:34, commodity_id:'GRAPHITE', origin:'China' },
        { material:'Copper Foil', quantity_kg:22.0, price_per_kg:8.95, cost:197, commodity_id:'COPPER', origin:'Chile' },
        { material:'Aluminum Casing', quantity_kg:35.0, price_per_kg:2.35, cost:82, commodity_id:'ALUMINUM', origin:'Australia' },
        { material:'Electrolyte (LiPF6)', quantity_kg:12.0, price_per_kg:18.5, cost:222, commodity_id:'ELECTROLYTE', origin:'Japan' },
        { material:'Separator Film', quantity_kg:4.5, price_per_kg:35.0, cost:157, commodity_id:'SEPARATOR', origin:'South Korea' },
        { material:'NMP Solvent', quantity_kg:8.0, price_per_kg:3.2, cost:25.6, commodity_id:'NMP', origin:'China' },
        { material:'Other (binders, tabs, casing)', quantity_kg:null, price_per_kg:null, cost:2216.4 },
      ]},
      { stage:'Cell Manufacturing', cost_usd:2200, value_add:2200, labor_pct:15, energy_pct:25, depreciation_pct:30, margin_pct:12 },
      { stage:'Pack Assembly & BMS', cost_usd:800, value_add:800, labor_pct:20, energy_pct:10, depreciation_pct:15, margin_pct:8 },
      { stage:'Distribution & Logistics', cost_usd:400, value_add:400, labor_pct:8, energy_pct:5, depreciation_pct:2, margin_pct:5 },
      { stage:'OEM Integration', cost_usd:1500, value_add:1500, labor_pct:12, energy_pct:8, depreciation_pct:15, margin_pct:18 },
    ],
    final_price_usd:8700, gwp_total_kg:8350, water_total_l:88500, waste_kg:45, land_ha:0.001,
    end_of_life_value_usd:650, scrap_value_usd:120,
  },
  solar_panel: {
    name: 'Solar Panel (400W Mono-Si)', icon: '\u2600\ufe0f', sector: 'Energy',
    stages: [
      { stage:'Raw Materials', cost_usd:45, components:[
        { material:'Silicon Wafer', quantity_kg:1.8, price_per_kg:8.5, cost:15, commodity_id:'SILICON', origin:'China' },
        { material:'Silver Paste', quantity_kg:0.02, price_per_kg:850, cost:17, commodity_id:'SILVER', origin:'Mexico' },
        { material:'Copper Ribbon', quantity_kg:0.15, price_per_kg:8.95, cost:1.3, commodity_id:'COPPER', origin:'Chile' },
        { material:'Aluminum Frame', quantity_kg:2.5, price_per_kg:2.35, cost:5.9, commodity_id:'ALUMINUM', origin:'Australia' },
        { material:'Tempered Glass', quantity_kg:8.0, price_per_kg:0.4, cost:3.2, commodity_id:'GLASS', origin:'China' },
        { material:'EVA Encapsulant', quantity_kg:0.8, price_per_kg:1.8, cost:1.44, commodity_id:'EVA', origin:'South Korea' },
        { material:'Backsheet Film', quantity_kg:0.3, price_per_kg:4.5, cost:1.35, commodity_id:'BACKSHEET', origin:'Japan' },
        { material:'Junction Box & Cable', quantity_kg:null, price_per_kg:null, cost:-0.19 },
      ]},
      { stage:'Cell Manufacturing', cost_usd:35, value_add:35, labor_pct:12, energy_pct:35, depreciation_pct:28, margin_pct:10 },
      { stage:'Module Assembly', cost_usd:25, value_add:25, labor_pct:18, energy_pct:8, depreciation_pct:10, margin_pct:12 },
      { stage:'Distribution & Logistics', cost_usd:15, value_add:15, labor_pct:6, energy_pct:4, depreciation_pct:2, margin_pct:6 },
      { stage:'Installation', cost_usd:80, value_add:80, labor_pct:55, energy_pct:3, depreciation_pct:5, margin_pct:15 },
    ],
    final_price_usd:200, gwp_total_kg:580, water_total_l:15300, waste_kg:2.5, land_ha:0.0001,
    end_of_life_value_usd:8, scrap_value_usd:2,
  },
  steel_beam: {
    name: 'Structural Steel Beam (1 tonne)', icon: '\ud83c\udfd7\ufe0f', sector: 'Construction',
    stages: [
      { stage:'Raw Materials', cost_usd:180, components:[
        { material:'Iron Ore', quantity_kg:1600, price_per_kg:0.08, cost:128, commodity_id:'IRON_ORE', origin:'Australia' },
        { material:'Coking Coal', quantity_kg:450, price_per_kg:0.09, cost:40.5, commodity_id:'COAL', origin:'Australia' },
        { material:'Limestone Flux', quantity_kg:80, price_per_kg:0.02, cost:1.6, commodity_id:'LIMESTONE', origin:'USA' },
        { material:'Manganese', quantity_kg:15, price_per_kg:0.45, cost:6.75, commodity_id:'MANGANESE', origin:'South Africa' },
        { material:'Chromium', quantity_kg:5, price_per_kg:0.35, cost:1.75, commodity_id:'CHROMIUM', origin:'India' },
        { material:'Other (alloys, scrap)', quantity_kg:null, price_per_kg:null, cost:1.40 },
      ]},
      { stage:'Steelmaking (BF-BOF)', cost_usd:280, value_add:280, labor_pct:10, energy_pct:40, depreciation_pct:25, margin_pct:8 },
      { stage:'Rolling & Finishing', cost_usd:120, value_add:120, labor_pct:15, energy_pct:20, depreciation_pct:12, margin_pct:10 },
      { stage:'Distribution', cost_usd:65, value_add:65, labor_pct:8, energy_pct:6, depreciation_pct:3, margin_pct:7 },
      { stage:'Construction Integration', cost_usd:155, value_add:155, labor_pct:35, energy_pct:5, depreciation_pct:8, margin_pct:14 },
    ],
    final_price_usd:800, gwp_total_kg:2130, water_total_l:33200, waste_kg:180, land_ha:0.0003,
    end_of_life_value_usd:280, scrap_value_usd:180,
  },
  palm_oil_tonne: {
    name: 'Crude Palm Oil (1 tonne)', icon: '\ud83c\udf34', sector: 'Agriculture',
    stages: [
      { stage:'Plantation & Harvest', cost_usd:220, components:[
        { material:'Fresh Fruit Bunches', quantity_kg:5000, price_per_kg:0.035, cost:175, commodity_id:'PALM_FRUIT', origin:'Indonesia' },
        { material:'NPK Fertilizer', quantity_kg:120, price_per_kg:0.30, cost:36, commodity_id:'FERTILIZER', origin:'Malaysia' },
        { material:'Diesel (machinery)', quantity_kg:15, price_per_kg:0.60, cost:9, commodity_id:'DIESEL', origin:'Singapore' },
      ]},
      { stage:'Milling & Extraction', cost_usd:85, value_add:85, labor_pct:20, energy_pct:30, depreciation_pct:15, margin_pct:10 },
      { stage:'Refining', cost_usd:65, value_add:65, labor_pct:10, energy_pct:25, depreciation_pct:20, margin_pct:12 },
      { stage:'Shipping & Trade', cost_usd:130, value_add:130, labor_pct:5, energy_pct:8, depreciation_pct:3, margin_pct:8 },
      { stage:'Food Processing', cost_usd:200, value_add:200, labor_pct:15, energy_pct:12, depreciation_pct:10, margin_pct:18 },
    ],
    final_price_usd:700, gwp_total_kg:3000, water_total_l:28300, waste_kg:350, land_ha:2.5,
    end_of_life_value_usd:25, scrap_value_usd:5,
  },
  cotton_tshirt: {
    name: 'Cotton T-Shirt', icon: '\ud83d\udc55', sector: 'Textiles',
    stages: [
      { stage:'Raw Cotton', cost_usd:1.20, components:[
        { material:'Raw Cotton Lint', quantity_kg:0.25, price_per_kg:2.80, cost:0.70, commodity_id:'COTTON', origin:'India' },
        { material:'Polyester Thread', quantity_kg:0.02, price_per_kg:1.50, cost:0.03, commodity_id:'POLYESTER', origin:'China' },
        { material:'Reactive Dyes', quantity_kg:0.02, price_per_kg:12.0, cost:0.24, commodity_id:'DYES', origin:'China' },
        { material:'Fixing Agents', quantity_kg:0.01, price_per_kg:8.0, cost:0.08, commodity_id:'CHEMICALS', origin:'Germany' },
        { material:'Other (labels, buttons)', quantity_kg:null, price_per_kg:null, cost:0.15 },
      ]},
      { stage:'Spinning & Weaving', cost_usd:1.80, value_add:1.80, labor_pct:25, energy_pct:20, depreciation_pct:15, margin_pct:8 },
      { stage:'Dyeing & Finishing', cost_usd:1.50, value_add:1.50, labor_pct:20, energy_pct:30, depreciation_pct:15, margin_pct:10 },
      { stage:'Garment Assembly', cost_usd:2.50, value_add:2.50, labor_pct:60, energy_pct:5, depreciation_pct:5, margin_pct:5 },
      { stage:'Brand/Retail Markup', cost_usd:18.00, value_add:18.00, labor_pct:5, energy_pct:2, depreciation_pct:3, margin_pct:55 },
    ],
    final_price_usd:25.00, gwp_total_kg:10.3, water_total_l:7750, waste_kg:0.15, land_ha:0.006,
    end_of_life_value_usd:0.15, scrap_value_usd:0.02,
  },
  smartphone: {
    name: 'Smartphone (Mid-Range)', icon: '\ud83d\udcf1', sector: 'Electronics',
    stages: [
      { stage:'Raw Materials', cost_usd:38, components:[
        { material:'Cobalt (battery cathode)', quantity_kg:0.008, price_per_kg:28, cost:0.22, commodity_id:'COBALT', origin:'DRC' },
        { material:'Lithium (battery)', quantity_kg:0.003, price_per_kg:12.5, cost:0.04, commodity_id:'LITHIUM', origin:'Australia' },
        { material:'Copper (PCB traces)', quantity_kg:0.015, price_per_kg:8.95, cost:0.13, commodity_id:'COPPER', origin:'Chile' },
        { material:'Gold (wire bonds)', quantity_kg:0.00003, price_per_kg:65000, cost:1.95, commodity_id:'GOLD', origin:'South Africa' },
        { material:'Tantalum (capacitors)', quantity_kg:0.0004, price_per_kg:280, cost:0.11, commodity_id:'TANTALUM', origin:'Rwanda' },
        { material:'Rare Earths (vibration motor)', quantity_kg:0.001, price_per_kg:45, cost:0.05, commodity_id:'RARE_EARTHS', origin:'China' },
        { material:'Gorilla Glass', quantity_kg:0.035, price_per_kg:15, cost:0.53, commodity_id:'GLASS', origin:'USA' },
        { material:'Other (silicon, plastics, PCB)', quantity_kg:null, price_per_kg:null, cost:34.97 },
      ]},
      { stage:'Component Manufacturing', cost_usd:85, value_add:85, labor_pct:8, energy_pct:15, depreciation_pct:40, margin_pct:15 },
      { stage:'Device Assembly', cost_usd:22, value_add:22, labor_pct:55, energy_pct:5, depreciation_pct:8, margin_pct:6 },
      { stage:'Distribution & Retail', cost_usd:55, value_add:55, labor_pct:10, energy_pct:3, depreciation_pct:5, margin_pct:25 },
      { stage:'Brand Premium & R&D', cost_usd:200, value_add:200, labor_pct:5, energy_pct:1, depreciation_pct:2, margin_pct:65 },
    ],
    final_price_usd:400, gwp_total_kg:78, water_total_l:6980, waste_kg:0.18, land_ha:0.0001,
    end_of_life_value_usd:12, scrap_value_usd:1.50,
  },
  /* ---- NEW: 9 additional product financial flows ---- */
  wind_turbine: {
    name: 'Wind Turbine (3 MW)', icon: '\ud83c\udf2c\ufe0f', sector: 'Energy',
    stages: [
      { stage:'Raw Materials', cost_usd:450000, components:[
        { material:'Structural Steel', quantity_kg:140000, price_per_kg:0.80, cost:112000, commodity_id:'STEEL', origin:'Germany' },
        { material:'Copper Winding', quantity_kg:4500, price_per_kg:8.95, cost:40275, commodity_id:'COPPER', origin:'Chile' },
        { material:'Fiberglass Composite', quantity_kg:18000, price_per_kg:3.50, cost:63000, commodity_id:'FIBERGLASS', origin:'China' },
        { material:'Concrete (foundation)', quantity_kg:800000, price_per_kg:0.08, cost:64000, commodity_id:'CONCRETE', origin:'Local' },
        { material:'Rare Earth Magnets (NdFeB)', quantity_kg:600, price_per_kg:85, cost:51000, commodity_id:'RARE_EARTHS', origin:'China' },
        { material:'Epoxy Resin', quantity_kg:5000, price_per_kg:4.20, cost:21000, commodity_id:'EPOXY', origin:'USA' },
        { material:'Carbon Fiber (blade spar)', quantity_kg:2800, price_per_kg:18, cost:50400, commodity_id:'CARBON_FIBER', origin:'Japan' },
        { material:'Zinc Coating', quantity_kg:1200, price_per_kg:2.80, cost:3360, commodity_id:'ZINC', origin:'Australia' },
        { material:'Bolts & Fasteners', quantity_kg:3500, price_per_kg:1.50, cost:5250, commodity_id:'BOLTS', origin:'Germany' },
        { material:'Lubricants & Sealants', quantity_kg:800, price_per_kg:6.0, cost:4800, commodity_id:'LUBRICANT', origin:'Netherlands' },
        { material:'Other (electronics, cables)', quantity_kg:null, price_per_kg:null, cost:34915 },
      ]},
      { stage:'Nacelle & Tower Manufacturing', cost_usd:380000, value_add:380000, labor_pct:18, energy_pct:22, depreciation_pct:25, margin_pct:10 },
      { stage:'Blade Manufacturing', cost_usd:220000, value_add:220000, labor_pct:15, energy_pct:20, depreciation_pct:28, margin_pct:12 },
      { stage:'Transport & Installation', cost_usd:350000, value_add:350000, labor_pct:35, energy_pct:15, depreciation_pct:8, margin_pct:8 },
      { stage:'Grid Connection & Commissioning', cost_usd:100000, value_add:100000, labor_pct:25, energy_pct:10, depreciation_pct:5, margin_pct:15 },
    ],
    final_price_usd:1500000, gwp_total_kg:420000, water_total_l:5150000, waste_kg:12000, land_ha:0.5,
    end_of_life_value_usd:85000, scrap_value_usd:45000,
  },
  data_center_server: {
    name: 'Data Center Server (2U)', icon: '\ud83d\udda5\ufe0f', sector: 'Technology',
    stages: [
      { stage:'Raw Materials', cost_usd:1200, components:[
        { material:'Silicon Chips (CPU/RAM)', quantity_kg:0.12, price_per_kg:3500, cost:420, commodity_id:'SILICON', origin:'Taiwan' },
        { material:'Copper (PCB, connectors)', quantity_kg:0.45, price_per_kg:8.95, cost:4.03, commodity_id:'COPPER', origin:'Chile' },
        { material:'Aluminum (heatsinks)', quantity_kg:1.8, price_per_kg:2.35, cost:4.23, commodity_id:'ALUMINUM', origin:'Australia' },
        { material:'Steel (chassis)', quantity_kg:8.5, price_per_kg:0.80, cost:6.80, commodity_id:'STEEL', origin:'China' },
        { material:'Gold (contacts)', quantity_kg:0.0002, price_per_kg:65000, cost:13, commodity_id:'GOLD', origin:'South Africa' },
        { material:'Tin (solder)', quantity_kg:0.05, price_per_kg:25, cost:1.25, commodity_id:'TIN', origin:'Indonesia' },
        { material:'Tantalum (capacitors)', quantity_kg:0.001, price_per_kg:280, cost:0.28, commodity_id:'TANTALUM', origin:'Rwanda' },
        { material:'SSD/HDD Storage', quantity_kg:0.8, price_per_kg:350, cost:280, commodity_id:'STORAGE', origin:'South Korea' },
        { material:'Other (plastics, cables, fans)', quantity_kg:null, price_per_kg:null, cost:470.41 },
      ]},
      { stage:'Board Manufacturing (SMT)', cost_usd:850, value_add:850, labor_pct:8, energy_pct:18, depreciation_pct:42, margin_pct:15 },
      { stage:'System Assembly & Test', cost_usd:400, value_add:400, labor_pct:30, energy_pct:10, depreciation_pct:12, margin_pct:10 },
      { stage:'Distribution', cost_usd:150, value_add:150, labor_pct:8, energy_pct:5, depreciation_pct:3, margin_pct:12 },
      { stage:'Enterprise Sales & Support', cost_usd:1400, value_add:1400, labor_pct:15, energy_pct:2, depreciation_pct:5, margin_pct:45 },
    ],
    final_price_usd:4000, gwp_total_kg:850, water_total_l:18500, waste_kg:2.5, land_ha:0.00001,
    end_of_life_value_usd:120, scrap_value_usd:35,
  },
  fast_fashion_dress: {
    name: 'Fast Fashion Dress', icon: '\ud83d\udc57', sector: 'Textiles',
    stages: [
      { stage:'Raw Materials', cost_usd:2.50, components:[
        { material:'Polyester Fabric', quantity_kg:0.35, price_per_kg:1.50, cost:0.53, commodity_id:'POLYESTER', origin:'China' },
        { material:'Viscose Blend', quantity_kg:0.15, price_per_kg:2.20, cost:0.33, commodity_id:'VISCOSE', origin:'India' },
        { material:'Elastane (Spandex)', quantity_kg:0.05, price_per_kg:5.00, cost:0.25, commodity_id:'ELASTANE', origin:'China' },
        { material:'Zipper & Buttons', quantity_kg:0.03, price_per_kg:8.00, cost:0.24, commodity_id:'METAL_TRIM', origin:'China' },
        { material:'Dyes & Finishing Agents', quantity_kg:0.04, price_per_kg:10.0, cost:0.40, commodity_id:'DYES', origin:'India' },
        { material:'Labels & Tags', quantity_kg:null, price_per_kg:null, cost:0.12 },
        { material:'Packaging (polybag)', quantity_kg:null, price_per_kg:null, cost:0.08 },
        { material:'Thread & Interfacing', quantity_kg:0.02, price_per_kg:3.0, cost:0.06, commodity_id:'THREAD', origin:'Vietnam' },
        { material:'Other (hangers, tissue)', quantity_kg:null, price_per_kg:null, cost:0.49 },
      ]},
      { stage:'Cut & Sew (Garment)', cost_usd:3.50, value_add:3.50, labor_pct:65, energy_pct:5, depreciation_pct:5, margin_pct:3 },
      { stage:'Quality & Finishing', cost_usd:0.80, value_add:0.80, labor_pct:50, energy_pct:10, depreciation_pct:5, margin_pct:5 },
      { stage:'Shipping & Warehousing', cost_usd:2.20, value_add:2.20, labor_pct:8, energy_pct:12, depreciation_pct:5, margin_pct:8 },
      { stage:'Brand/Retail Markup', cost_usd:41.00, value_add:41.00, labor_pct:5, energy_pct:2, depreciation_pct:8, margin_pct:62 },
    ],
    final_price_usd:50.00, gwp_total_kg:15.8, water_total_l:9200, waste_kg:0.25, land_ha:0.003,
    end_of_life_value_usd:0.20, scrap_value_usd:0.03,
  },
  chocolate_bar: {
    name: 'Chocolate Bar (100g)', icon: '\ud83c\udf6b', sector: 'Food',
    stages: [
      { stage:'Raw Materials', cost_usd:0.45, components:[
        { material:'Cocoa Beans', quantity_kg:0.04, price_per_kg:3.50, cost:0.14, commodity_id:'COCOA', origin:'Ghana' },
        { material:'Sugar', quantity_kg:0.045, price_per_kg:0.40, cost:0.018, commodity_id:'SUGAR', origin:'Brazil' },
        { material:'Cocoa Butter', quantity_kg:0.03, price_per_kg:5.50, cost:0.165, commodity_id:'COCOA_BUTTER', origin:'Cote d\'Ivoire' },
        { material:'Milk Powder', quantity_kg:0.02, price_per_kg:3.00, cost:0.06, commodity_id:'MILK_POWDER', origin:'New Zealand' },
        { material:'Soy Lecithin', quantity_kg:0.003, price_per_kg:1.80, cost:0.005, commodity_id:'SOY', origin:'Brazil' },
        { material:'Vanilla Extract', quantity_kg:0.0005, price_per_kg:35, cost:0.018, commodity_id:'VANILLA', origin:'Madagascar' },
        { material:'Aluminum Foil Wrap', quantity_kg:0.003, price_per_kg:4.50, cost:0.014, commodity_id:'ALUMINUM', origin:'Australia' },
        { material:'Paper/Card Packaging', quantity_kg:0.008, price_per_kg:0.80, cost:0.006, commodity_id:'PAPER', origin:'Finland' },
        { material:'Other (additives)', quantity_kg:null, price_per_kg:null, cost:0.024 },
      ]},
      { stage:'Roasting & Conching', cost_usd:0.25, value_add:0.25, labor_pct:15, energy_pct:35, depreciation_pct:25, margin_pct:10 },
      { stage:'Moulding & Packaging', cost_usd:0.20, value_add:0.20, labor_pct:20, energy_pct:15, depreciation_pct:25, margin_pct:12 },
      { stage:'Distribution & Cold Chain', cost_usd:0.30, value_add:0.30, labor_pct:10, energy_pct:20, depreciation_pct:5, margin_pct:10 },
      { stage:'Retail & Brand', cost_usd:1.80, value_add:1.80, labor_pct:8, energy_pct:3, depreciation_pct:5, margin_pct:55 },
    ],
    final_price_usd:3.00, gwp_total_kg:0.85, water_total_l:1700, waste_kg:0.02, land_ha:0.002,
    end_of_life_value_usd:0.01, scrap_value_usd:0,
  },
  electric_bus: {
    name: 'Electric Bus (12m)', icon: '\ud83d\ude8c', sector: 'Transport',
    stages: [
      { stage:'Raw Materials', cost_usd:85000, components:[
        { material:'Steel Frame & Body', quantity_kg:6000, price_per_kg:0.80, cost:4800, commodity_id:'STEEL', origin:'China' },
        { material:'Aluminum Panels', quantity_kg:1500, price_per_kg:2.35, cost:3525, commodity_id:'ALUMINUM', origin:'Australia' },
        { material:'Lithium Battery Pack', quantity_kg:2800, price_per_kg:12.5, cost:35000, commodity_id:'LITHIUM', origin:'Chile' },
        { material:'Copper Wiring & Motors', quantity_kg:450, price_per_kg:8.95, cost:4028, commodity_id:'COPPER', origin:'Chile' },
        { material:'Safety Glass', quantity_kg:350, price_per_kg:1.20, cost:420, commodity_id:'GLASS', origin:'China' },
        { material:'Rubber (tires & seals)', quantity_kg:400, price_per_kg:1.80, cost:720, commodity_id:'RUBBER', origin:'Thailand' },
        { material:'Carbon Fiber Components', quantity_kg:120, price_per_kg:18, cost:2160, commodity_id:'CARBON_FIBER', origin:'Japan' },
        { material:'Rare Earth Motors', quantity_kg:25, price_per_kg:85, cost:2125, commodity_id:'RARE_EARTHS', origin:'China' },
        { material:'Interior Plastics & Foam', quantity_kg:800, price_per_kg:2.50, cost:2000, commodity_id:'PLASTICS', origin:'Germany' },
        { material:'Electronics (BMS, HVAC)', quantity_kg:null, price_per_kg:null, cost:15000 },
        { material:'Other (fasteners, paint)', quantity_kg:null, price_per_kg:null, cost:15222 },
      ]},
      { stage:'Chassis & Drivetrain Assembly', cost_usd:45000, value_add:45000, labor_pct:22, energy_pct:18, depreciation_pct:25, margin_pct:10 },
      { stage:'Body Assembly & Interior', cost_usd:35000, value_add:35000, labor_pct:30, energy_pct:12, depreciation_pct:18, margin_pct:8 },
      { stage:'Testing & Certification', cost_usd:15000, value_add:15000, labor_pct:40, energy_pct:8, depreciation_pct:10, margin_pct:12 },
      { stage:'Delivery & Commissioning', cost_usd:20000, value_add:20000, labor_pct:25, energy_pct:10, depreciation_pct:5, margin_pct:15 },
    ],
    final_price_usd:200000, gwp_total_kg:79500, water_total_l:533000, waste_kg:2500, land_ha:0.01,
    end_of_life_value_usd:18000, scrap_value_usd:8500,
  },
  pharma_drug: {
    name: 'Pharmaceutical Drug (1000 tablets)', icon: '\ud83d\udc8a', sector: 'Pharma',
    stages: [
      { stage:'Raw Materials (API + Excipients)', cost_usd:8.50, components:[
        { material:'Active Pharmaceutical Ingredient', quantity_kg:0.05, price_per_kg:120, cost:6.00, commodity_id:'API', origin:'India' },
        { material:'Microcrystalline Cellulose', quantity_kg:0.12, price_per_kg:3.50, cost:0.42, commodity_id:'MCC', origin:'USA' },
        { material:'Lactose Monohydrate', quantity_kg:0.08, price_per_kg:1.80, cost:0.14, commodity_id:'LACTOSE', origin:'New Zealand' },
        { material:'Magnesium Stearate', quantity_kg:0.005, price_per_kg:5.00, cost:0.025, commodity_id:'MG_STEARATE', origin:'China' },
        { material:'Croscarmellose Sodium', quantity_kg:0.01, price_per_kg:8.00, cost:0.08, commodity_id:'CROSCARMELLOSE', origin:'Germany' },
        { material:'Titanium Dioxide (coating)', quantity_kg:0.003, price_per_kg:3.50, cost:0.011, commodity_id:'TIO2', origin:'Australia' },
        { material:'HPMC Film Coating', quantity_kg:0.008, price_per_kg:12, cost:0.096, commodity_id:'HPMC', origin:'Japan' },
        { material:'Blister Foil (Al/PVC)', quantity_kg:0.05, price_per_kg:6.5, cost:0.325, commodity_id:'BLISTER', origin:'Germany' },
        { material:'Carton Packaging', quantity_kg:0.08, price_per_kg:1.2, cost:0.096, commodity_id:'CARTON', origin:'Finland' },
        { material:'Other (ink, leaflet)', quantity_kg:null, price_per_kg:null, cost:1.297 },
      ]},
      { stage:'Granulation & Tableting', cost_usd:3.50, value_add:3.50, labor_pct:12, energy_pct:15, depreciation_pct:35, margin_pct:15 },
      { stage:'Coating & Packaging', cost_usd:2.00, value_add:2.00, labor_pct:18, energy_pct:10, depreciation_pct:25, margin_pct:12 },
      { stage:'Quality Control & Batch Release', cost_usd:4.00, value_add:4.00, labor_pct:45, energy_pct:8, depreciation_pct:15, margin_pct:10 },
      { stage:'Distribution & Pharmacy Margin', cost_usd:32.00, value_add:32.00, labor_pct:8, energy_pct:3, depreciation_pct:5, margin_pct:55 },
    ],
    final_price_usd:50.00, gwp_total_kg:20.8, water_total_l:2700, waste_kg:0.35, land_ha:0.0001,
    end_of_life_value_usd:0.10, scrap_value_usd:0.01,
  },
  glass_bottle: {
    name: 'Glass Bottle (750ml wine)', icon: '\ud83c\udf77', sector: 'Packaging',
    stages: [
      { stage:'Raw Materials', cost_usd:0.12, components:[
        { material:'Silica Sand', quantity_kg:0.38, price_per_kg:0.05, cost:0.019, commodity_id:'SILICA', origin:'Belgium' },
        { material:'Soda Ash', quantity_kg:0.12, price_per_kg:0.18, cost:0.022, commodity_id:'SODA_ASH', origin:'USA' },
        { material:'Limestone', quantity_kg:0.08, price_per_kg:0.02, cost:0.002, commodity_id:'LIMESTONE', origin:'France' },
        { material:'Cullet (recycled glass)', quantity_kg:0.25, price_per_kg:0.03, cost:0.008, commodity_id:'CULLET', origin:'Local' },
        { material:'Alumina', quantity_kg:0.01, price_per_kg:0.35, cost:0.004, commodity_id:'ALUMINA', origin:'Australia' },
        { material:'Colorants (iron oxide)', quantity_kg:0.005, price_per_kg:0.80, cost:0.004, commodity_id:'COLORANT', origin:'Germany' },
        { material:'Natural Gas (furnace)', quantity_kg:null, price_per_kg:null, cost:0.045 },
        { material:'Label & Closure', quantity_kg:null, price_per_kg:null, cost:0.016 },
      ]},
      { stage:'Glass Melting & Forming', cost_usd:0.08, value_add:0.08, labor_pct:10, energy_pct:55, depreciation_pct:20, margin_pct:8 },
      { stage:'Annealing & Inspection', cost_usd:0.04, value_add:0.04, labor_pct:15, energy_pct:25, depreciation_pct:18, margin_pct:10 },
      { stage:'Packaging & Palletising', cost_usd:0.03, value_add:0.03, labor_pct:20, energy_pct:5, depreciation_pct:10, margin_pct:12 },
      { stage:'Distribution to Winery', cost_usd:0.05, value_add:0.05, labor_pct:8, energy_pct:15, depreciation_pct:3, margin_pct:8 },
    ],
    final_price_usd:0.32, gwp_total_kg:0.52, water_total_l:8.5, waste_kg:0.05, land_ha:0.0000005,
    end_of_life_value_usd:0.02, scrap_value_usd:0.005,
  },
  concrete_slab: {
    name: 'Concrete Slab (1 m\u00b3 C30)', icon: '\ud83e\uddf1', sector: 'Construction',
    stages: [
      { stage:'Raw Materials', cost_usd:45, components:[
        { material:'Portland Cement', quantity_kg:350, price_per_kg:0.08, cost:28, commodity_id:'CEMENT', origin:'Local' },
        { material:'Coarse Aggregate', quantity_kg:1050, price_per_kg:0.008, cost:8.4, commodity_id:'GRAVEL', origin:'Local' },
        { material:'Fine Aggregate (Sand)', quantity_kg:700, price_per_kg:0.005, cost:3.5, commodity_id:'SAND', origin:'Local' },
        { material:'Water', quantity_kg:175, price_per_kg:0.001, cost:0.175, commodity_id:'WATER', origin:'Local' },
        { material:'Steel Rebar (embedded)', quantity_kg:80, price_per_kg:0.80, cost:64, commodity_id:'REBAR', origin:'China' },
        { material:'Admixtures (plasticiser)', quantity_kg:3.5, price_per_kg:2.50, cost:8.75, commodity_id:'ADMIXTURE', origin:'Germany' },
        { material:'Fly Ash (SCM)', quantity_kg:50, price_per_kg:0.03, cost:1.5, commodity_id:'FLY_ASH', origin:'Local' },
        { material:'Other (curing, formwork rental)', quantity_kg:null, price_per_kg:null, cost:-69.325 },
      ]},
      { stage:'Batching & Mixing', cost_usd:15, value_add:15, labor_pct:15, energy_pct:25, depreciation_pct:30, margin_pct:10 },
      { stage:'Transit Mix Delivery', cost_usd:25, value_add:25, labor_pct:18, energy_pct:30, depreciation_pct:12, margin_pct:8 },
      { stage:'Placing & Finishing', cost_usd:35, value_add:35, labor_pct:55, energy_pct:5, depreciation_pct:8, margin_pct:10 },
      { stage:'Curing & Inspection', cost_usd:10, value_add:10, labor_pct:25, energy_pct:5, depreciation_pct:5, margin_pct:15 },
    ],
    final_price_usd:130, gwp_total_kg:320, water_total_l:850, waste_kg:25, land_ha:0.0002,
    end_of_life_value_usd:8, scrap_value_usd:3,
  },
  leather_shoes: {
    name: 'Leather Shoes (pair)', icon: '\ud83d\udc5e', sector: 'Textiles',
    stages: [
      { stage:'Raw Materials', cost_usd:8.50, components:[
        { material:'Bovine Leather', quantity_kg:0.8, price_per_kg:5.50, cost:4.40, commodity_id:'LEATHER', origin:'Italy' },
        { material:'Rubber Sole', quantity_kg:0.3, price_per_kg:2.80, cost:0.84, commodity_id:'RUBBER', origin:'Thailand' },
        { material:'Synthetic Lining', quantity_kg:0.15, price_per_kg:2.00, cost:0.30, commodity_id:'POLYESTER', origin:'China' },
        { material:'Thread & Adhesive', quantity_kg:0.05, price_per_kg:8.00, cost:0.40, commodity_id:'ADHESIVE', origin:'Germany' },
        { material:'Steel Shank', quantity_kg:0.08, price_per_kg:0.80, cost:0.064, commodity_id:'STEEL', origin:'China' },
        { material:'Cork Insole', quantity_kg:0.06, price_per_kg:12, cost:0.72, commodity_id:'CORK', origin:'Portugal' },
        { material:'Eyelets & Hardware', quantity_kg:0.02, price_per_kg:15, cost:0.30, commodity_id:'BRASS', origin:'India' },
        { material:'Box & Tissue', quantity_kg:null, price_per_kg:null, cost:0.35 },
        { material:'Other (dyes, wax, finish)', quantity_kg:null, price_per_kg:null, cost:1.126 },
      ]},
      { stage:'Tanning & Cutting', cost_usd:6.00, value_add:6.00, labor_pct:30, energy_pct:20, depreciation_pct:15, margin_pct:8 },
      { stage:'Stitching & Assembly', cost_usd:8.50, value_add:8.50, labor_pct:60, energy_pct:5, depreciation_pct:8, margin_pct:5 },
      { stage:'Finishing & QC', cost_usd:3.00, value_add:3.00, labor_pct:40, energy_pct:10, depreciation_pct:10, margin_pct:10 },
      { stage:'Brand/Retail Markup', cost_usd:74.00, value_add:74.00, labor_pct:5, energy_pct:2, depreciation_pct:8, margin_pct:58 },
    ],
    final_price_usd:100.00, gwp_total_kg:14.2, water_total_l:8500, waste_kg:0.35, land_ha:0.015,
    end_of_life_value_usd:0.50, scrap_value_usd:0.05,
  },
};

/* =================================================================
   GREEN PREMIUMS
   ================================================================= */
const GREEN_PREMIUMS = [
  { product:'Green Steel (H2-DRI)', conventional:'Steel Beam', premium_pct:25, co2_reduction_pct:90, status:'Pilot (SSAB, H2GS)' },
  { product:'Organic Cotton T-Shirt', conventional:'Cotton T-Shirt', premium_pct:40, co2_reduction_pct:46, status:'Available' },
  { product:'Recycled Li-ion Battery', conventional:'EV Battery', premium_pct:12, co2_reduction_pct:70, status:'Scaling (Redwood, Li-Cycle)' },
  { product:'Recycled Solar Panel', conventional:'Solar Panel', premium_pct:8, co2_reduction_pct:35, status:'Emerging' },
  { product:'RSPO Certified Palm Oil', conventional:'Palm Oil', premium_pct:15, co2_reduction_pct:55, status:'Available' },
  { product:'Fairphone (Modular)', conventional:'Smartphone', premium_pct:35, co2_reduction_pct:30, status:'Available' },
  { product:'Recycled PET Bottle', conventional:'Glass Bottle', premium_pct:5, co2_reduction_pct:60, status:'Available' },
  { product:'Low-Carbon Concrete', conventional:'Concrete Slab', premium_pct:18, co2_reduction_pct:40, status:'Scaling' },
  { product:'Vegan Leather Shoes', conventional:'Leather Shoes', premium_pct:10, co2_reduction_pct:50, status:'Available' },
];

/* =================================================================
   HELPERS
   ================================================================= */
const LS_PORT = 'ra_portfolio_v1';
const LS_FF   = 'ra_financial_flow_v1';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const seed = (s) => { let x = Math.sin(s * 9973 + 7) * 10000; return x - Math.floor(x); };
const fmt = (n, d=1) => n == null ? '\u2014' : Number(n).toFixed(d);
const fmtUSD = (n) => n == null ? '\u2014' : Math.abs(n) >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : Math.abs(n) >= 1000 ? `$${(n/1000).toFixed(1)}K` : Math.abs(n) >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(3)}`;
const pct = (n) => n == null ? '\u2014' : `${(n).toFixed(1)}%`;

/* =================================================================
   UI COMPONENTS
   ================================================================= */
const KPI = ({ label, value, sub, accent }) => (
  <div style={{ background:T.surface, border:`1px solid ${accent||T.border}`, borderRadius:10, padding:'14px 16px', borderTop:`3px solid ${accent||T.gold}` }}>
    <div style={{ fontSize:10, color:T.textMut, fontWeight:600, letterSpacing:0.5, textTransform:'uppercase', marginBottom:3, fontFamily:T.font }}>{label}</div>
    <div style={{ fontSize:20, fontWeight:700, color:T.navy, fontFamily:T.font }}>{value}</div>
    {sub && <div style={{ fontSize:10, color:T.textSec, marginTop:2 }}>{sub}</div>}
  </div>
);

const Btn = ({ children, onClick, active, small, style:sx }) => (
  <button onClick={onClick} style={{ padding:small?'5px 12px':'8px 18px', borderRadius:8, border:`1px solid ${active?T.navy:T.border}`, background:active?T.navy:T.surface, color:active?'#fff':T.text, fontWeight:600, fontSize:small?12:13, cursor:'pointer', fontFamily:T.font, transition:'all .15s', ...sx }}>{children}</button>
);

const Section = ({ title, children, badge }) => (
  <div style={{ marginBottom:28 }}>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, paddingBottom:8, borderBottom:`2px solid ${T.gold}` }}>
      <span style={{ fontSize:16, fontWeight:700, color:T.navy, fontFamily:T.font }}>{title}</span>
      {badge && <span style={{ fontSize:11, padding:'2px 10px', borderRadius:20, background:T.gold+'22', color:T.gold, fontWeight:700, fontFamily:T.font }}>{badge}</span>}
    </div>
    {children}
  </div>
);

const SortHeader = ({ label, col, sortCol, sortDir, onSort }) => (
  <th onClick={() => onSort(col)} style={{ padding:'8px 10px', fontSize:11, fontWeight:700, color:T.navy, cursor:'pointer', userSelect:'none', borderBottom:`2px solid ${T.gold}`, textAlign:'left', fontFamily:T.font, whiteSpace:'nowrap' }}>
    {label} {sortCol === col ? (sortDir === 'asc' ? '\u25b2' : '\u25bc') : '\u25bd'}
  </th>
);

/* =================================================================
   MAIN COMPONENT
   ================================================================= */
export default function FinancialFlowPage() {
  const navigate = useNavigate();

  /* ---- portfolio -------------------------------------------------- */
  const portfolioRaw = useMemo(() => {
    const saved = loadLS(LS_PORT);
    const data = saved || { portfolios:{}, activePortfolio:null };
    return data.portfolios?.[data.activePortfolio]?.holdings || [];
  }, []);

  const holdings = useMemo(() => {
    if (!portfolioRaw.length) return GLOBAL_COMPANY_MASTER.slice(0, 30).map((c, i) => ({
      ...c, company_name: c.company_name || c.company || `Company ${i+1}`,
      sector: c.sector || 'Diversified', weight: c.weight || 1,
      commodity_sensitivity: Math.round(5 + seed(i*31) * 35),
      revenue_mn: Math.round(500 + seed(i*37) * 9500),
    }));
    const lookup = {};
    GLOBAL_COMPANY_MASTER.forEach(c => { const k = (c.company_name || '').toLowerCase(); lookup[k] = c; });
    return portfolioRaw.map((h, i) => {
      const master = lookup[(h.company || '').toLowerCase()] || {};
      return { ...master, ...h, company_name: h.company || master.company_name, sector: h.sector || master.sector, weight: h.weight || 1,
        commodity_sensitivity: Math.round(5 + seed(i*31) * 35), revenue_mn: Math.round(500 + seed(i*37) * 9500) };
    });
  }, [portfolioRaw]);

  /* ---- state ------------------------------------------------------ */
  const [selectedProduct, setSelectedProduct] = useState('ev_battery');
  const [sortCol, setSortCol] = useState('cost');
  const [sortDir, setSortDir] = useState('desc');
  const [priceSliders, setPriceSliders] = useState({});
  const [scenarioMode, setScenarioMode] = useState('base'); // 'base' | 'bull' | 'bear'
  const PRODUCT_KEYS = useMemo(() => Object.keys(FINANCIAL_FLOWS), []);

  const flow = useMemo(() => FINANCIAL_FLOWS[selectedProduct], [selectedProduct]);

  /* ---- commodity price sensitivity with scenario ------------------- */
  const scenarioMultiplier = scenarioMode === 'bull' ? 50 : scenarioMode === 'bear' ? -50 : 0;

  const adjustedBOM = useMemo(() => {
    if (!flow) return [];
    const rawStage = flow.stages.find(s => s.components);
    if (!rawStage) return [];
    return rawStage.components.map(c => {
      const userSlider = priceSliders[c.commodity_id] ?? 0;
      const slider = userSlider + scenarioMultiplier;
      const factor = 1 + slider / 100;
      const newPrice = c.price_per_kg ? c.price_per_kg * factor : null;
      const newCost = c.price_per_kg ? c.quantity_kg * newPrice : c.cost;
      return { ...c, adjusted_price: newPrice, adjusted_cost: newCost, change_pct: slider };
    });
  }, [flow, priceSliders, scenarioMultiplier]);

  const adjustedRawTotal = useMemo(() => adjustedBOM.reduce((s, c) => s + (c.adjusted_cost || 0), 0), [adjustedBOM]);
  const originalRawTotal = useMemo(() => flow?.stages?.[0]?.cost_usd || 0, [flow]);
  const rawDelta = adjustedRawTotal - originalRawTotal;
  const adjustedFinalPrice = useMemo(() => (flow?.final_price_usd || 0) + rawDelta, [flow, rawDelta]);

  /* ---- full externality pricing for ALL products ------------------- */
  const computeExternality = useCallback((f) => {
    if (!f) return { carbon: 0, water: 0, air: 0, biodiversity: 0, waste: 0, total: 0 };
    const carbon = (f.gwp_total_kg / 1000) * EXTERNALITY_PRICES.carbon.price;
    const water = (f.water_total_l / 1e6) * EXTERNALITY_PRICES.water.price * 1000;
    const air = (f.gwp_total_kg / 1000) * 0.15 * EXTERNALITY_PRICES.air_pollution.price;
    const biodiversity = EXTERNALITY_PRICES.biodiversity.price * (f.land_ha || 0.5);
    const waste = (f.waste_kg || 0) / 1000 * EXTERNALITY_PRICES.waste_disposal.price;
    const total = carbon + water + air + biodiversity + waste;
    return { carbon: Math.round(carbon * 100) / 100, water: Math.round(water * 100) / 100, air: Math.round(air * 100) / 100, biodiversity: Math.round(biodiversity * 100) / 100, waste: Math.round(waste * 100) / 100, total: Math.round(total * 100) / 100 };
  }, []);

  const externalityBreakdown = useMemo(() => {
    const ext = computeExternality(flow);
    return [
      { category: 'Carbon (CO\u2082e)', cost: ext.carbon, color: EXTERNALITY_PRICES.carbon.color },
      { category: 'Water Use', cost: ext.water, color: EXTERNALITY_PRICES.water.color },
      { category: 'Air Pollution', cost: ext.air, color: EXTERNALITY_PRICES.air_pollution.color },
      { category: 'Biodiversity', cost: ext.biodiversity, color: EXTERNALITY_PRICES.biodiversity.color },
      { category: 'Waste Disposal', cost: ext.waste, color: EXTERNALITY_PRICES.waste_disposal.color },
    ];
  }, [flow, computeExternality]);

  const totalExternality = useMemo(() => externalityBreakdown.reduce((s, e) => s + e.cost, 0), [externalityBreakdown]);

  /* ---- all-products externality comparison ------------------------- */
  const allProductExternalities = useMemo(() => {
    return PRODUCT_KEYS.map(k => {
      const f = FINANCIAL_FLOWS[k];
      const ext = computeExternality(f);
      return { name: f.name.split('(')[0].trim(), icon: f.icon, price: f.final_price_usd, externality: ext.total, trueCost: f.final_price_usd + ext.total, gapPct: (ext.total / f.final_price_usd * 100), ...ext };
    }).sort((a, b) => b.gapPct - a.gapPct);
  }, [PRODUCT_KEYS, computeExternality]);

  /* ---- waterfall chart data --------------------------------------- */
  const waterfallData = useMemo(() => {
    if (!flow) return [];
    let running = 0;
    const bars = flow.stages.map((s, i) => {
      const val = i === 0 ? adjustedRawTotal : s.cost_usd;
      const start = running;
      running += val;
      return { name: s.stage, value: val, start, end: running, color: PIE_COLORS[i % PIE_COLORS.length] };
    });
    bars.push({ name: 'Final Price', value: adjustedFinalPrice, start: 0, end: adjustedFinalPrice, color: T.navy });
    return bars;
  }, [flow, adjustedRawTotal, adjustedFinalPrice]);

  /* ---- value-add distribution ------------------------------------- */
  const valueAddData = useMemo(() => {
    if (!flow) return [];
    return flow.stages.filter(s => s.value_add || s.components).map(s => ({
      name: s.stage, materials: s.components ? adjustedRawTotal : 0,
      labor: (s.value_add || 0) * (s.labor_pct || 0) / 100,
      energy: (s.value_add || 0) * (s.energy_pct || 0) / 100,
      capital: (s.value_add || 0) * (s.depreciation_pct || 0) / 100,
      margin: (s.value_add || 0) * (s.margin_pct || 0) / 100,
    }));
  }, [flow, adjustedRawTotal]);

  /* ---- supply chain margin waterfall (country) --------------------- */
  const marginByCountry = useMemo(() => {
    if (!flow) return [];
    const origins = {};
    const rawStage = flow.stages.find(s => s.components);
    if (rawStage) {
      rawStage.components.forEach(c => {
        const o = c.origin || 'Unknown';
        if (!origins[o]) origins[o] = { country: o, extraction: 0, processing: 0, manufacturing: 0 };
        origins[o].extraction += (c.adjusted_cost || c.cost || 0);
      });
    }
    flow.stages.forEach((s, i) => {
      if (i === 0) return;
      const countries = ['China','Germany','USA','Japan','South Korea','India','Mexico','Brazil','Indonesia','Taiwan'];
      const c = countries[i % countries.length];
      if (!origins[c]) origins[c] = { country: c, extraction: 0, processing: 0, manufacturing: 0 };
      if (i <= 2) origins[c].processing += (s.cost_usd || 0);
      else origins[c].manufacturing += (s.cost_usd || 0);
    });
    return Object.values(origins).map(o => ({
      ...o,
      total: o.extraction + o.processing + o.manufacturing,
      pct: ((o.extraction + o.processing + o.manufacturing) / adjustedFinalPrice * 100),
    })).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [flow, adjustedFinalPrice]);

  /* ---- commodity sensitivity scenario analysis --------------------- */
  const scenarioData = useMemo(() => {
    if (!flow) return [];
    const rawStage = flow.stages.find(s => s.components);
    if (!rawStage) return [];
    const commodities = rawStage.components.filter(c => c.commodity_id && c.price_per_kg);
    return commodities.map(c => {
      const base = c.cost;
      const bear = c.quantity_kg * c.price_per_kg * 0.5;
      const bull = c.quantity_kg * c.price_per_kg * 1.5;
      return { material: c.material.split('(')[0].trim(), base, bear50: bear, bull50: bull, commodity: c.commodity_id, origin: c.origin };
    });
  }, [flow]);

  /* ---- portfolio commodity sensitivity ---------------------------- */
  const portfolioSensitivity = useMemo(() => {
    return holdings.slice(0, 15).map((h, i) => ({
      company: h.company_name,
      sector: h.sector,
      sensitivity: h.commodity_sensitivity,
      revenue_mn: h.revenue_mn,
      impact_mn: Math.round(h.revenue_mn * h.commodity_sensitivity / 1000),
      top_commodity: ['Lithium','Copper','Nickel','Steel','Palm Oil','Cotton','Gold','Cobalt','Aluminum','Silver','Silicon','Rubber','Cement','Cocoa','Glass'][i % 15],
    }));
  }, [holdings]);

  /* ---- sort handler ----------------------------------------------- */
  const handleSort = useCallback((col) => {
    setSortDir(prev => sortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'desc');
    setSortCol(col);
  }, [sortCol]);

  const sortedBOM = useMemo(() => {
    return [...adjustedBOM].sort((a, b) => {
      const av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0;
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [adjustedBOM, sortCol, sortDir]);

  /* ---- exports ---------------------------------------------------- */
  const exportCSV = useCallback(() => {
    const headers = ['Stage','Cost USD','Value Add','Labor %','Energy %','Margin %'];
    const rows = flow.stages.map(s => [s.stage, s.cost_usd, s.value_add||'', s.labor_pct||'', s.energy_pct||'', s.margin_pct||'']);
    rows.push(['FINAL PRICE', adjustedFinalPrice,'','','','']);
    rows.push(['EXTERNALITY COST', totalExternality,'','','','']);
    rows.push(['TRUE COST', adjustedFinalPrice + totalExternality,'','','','']);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Financial_Flow_${flow?.name || 'product'}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [flow, adjustedFinalPrice, totalExternality]);

  const exportJSON = useCallback(() => {
    const data = { product: flow?.name, stages: flow?.stages, adjustedBOM, finalPrice: adjustedFinalPrice, externalityCost: totalExternality, trueCost: adjustedFinalPrice + totalExternality, externalityBreakdown, endOfLifeValue: flow?.end_of_life_value_usd, scrapValue: flow?.scrap_value_usd, timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `True_Cost_${flow?.name || 'product'}.json`; a.click();
    URL.revokeObjectURL(url);
  }, [flow, adjustedBOM, adjustedFinalPrice, totalExternality, externalityBreakdown]);

  const exportPrint = useCallback(() => window.print(), []);

  /* ---- derived KPIs ----------------------------------------------- */
  const trueCostGap = useMemo(() => {
    const gap = totalExternality;
    const pctGap = flow ? (gap / flow.final_price_usd * 100) : 0;
    return { gap, pctGap };
  }, [flow, totalExternality]);

  const CROSS_NAV = [
    { label:'Commodity Intelligence', path:'/commodity-intelligence' },
    { label:'Lifecycle Assessment', path:'/lifecycle-assessment' },
    { label:'Supply Chain', path:'/supply-chain' },
    { label:'IWA Classification', path:'/iwa-classification' },
    { label:'Carbon Budget', path:'/carbon-budget' },
  ];

  /* ================================================================= */
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px', color:T.text }}>
      {/* 1. Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:T.navy, margin:0 }}>Financial Flow Analyzer</h1>
          <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
            {['15 Products','Full BOM','5-Category Externalities','True Cost Accounting','\u00b150% Scenarios','Country Waterfall'].map(b => (
              <span key={b} style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:T.gold+'20', color:T.gold, fontWeight:700 }}>{b}</span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <Btn small onClick={exportCSV}>Export CSV</Btn>
          <Btn small onClick={exportJSON}>Export JSON</Btn>
          <Btn small onClick={exportPrint}>Print</Btn>
        </div>
      </div>

      {/* 2. Product Selector */}
      <Section title="Product Financial Flow Selector" badge={`${PRODUCT_KEYS.length} Products`}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(190px, 1fr))', gap:10 }}>
          {PRODUCT_KEYS.map(k => {
            const f = FINANCIAL_FLOWS[k];
            return (
              <div key={k} onClick={() => { setSelectedProduct(k); setPriceSliders({}); setScenarioMode('base'); }}
                style={{ background: selectedProduct===k ? T.navy : T.surface, color: selectedProduct===k ? '#fff' : T.text, border:`1px solid ${selectedProduct===k?T.navy:T.border}`, borderRadius:10, padding:'10px 12px', cursor:'pointer', transition:'all .15s' }}>
                <div style={{ fontSize:18, marginBottom:3 }}>{f.icon}</div>
                <div style={{ fontSize:11, fontWeight:700 }}>{f.name}</div>
                <div style={{ fontSize:10, opacity:0.7, marginTop:2 }}>Final: {fmtUSD(f.final_price_usd)}</div>
                <div style={{ fontSize:9, opacity:0.6 }}>{f.sector}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 3. KPI Cards (10) */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(165px, 1fr))', gap:12, marginBottom:24 }}>
        <KPI label="Raw Material Cost" value={fmtUSD(adjustedRawTotal)} sub={`${((adjustedRawTotal/(adjustedFinalPrice||1))*100).toFixed(0)}% of final price`} accent={T.navy} />
        <KPI label="Total Value-Add" value={fmtUSD(adjustedFinalPrice - adjustedRawTotal)} sub="Processing through retail" accent={T.gold} />
        <KPI label="Final Market Price" value={fmtUSD(adjustedFinalPrice)} sub={rawDelta !== 0 ? `${rawDelta > 0 ? '+' : ''}${fmtUSD(rawDelta)} from base` : 'At base price'} accent={T.sage} />
        <KPI label="True Cost (w/ Ext.)" value={fmtUSD(adjustedFinalPrice + totalExternality)} sub="Market + environment" accent={T.red} />
        <KPI label="Externality Cost" value={fmtUSD(totalExternality)} sub={`${trueCostGap.pctGap.toFixed(1)}% hidden cost`} accent={T.amber} />
        <KPI label="End-of-Life Value" value={fmtUSD(flow?.end_of_life_value_usd)} sub="Recycled material recovery" accent={T.green} />
        <KPI label="Scrap Value" value={fmtUSD(flow?.scrap_value_usd)} sub="If landfilled" accent={T.textMut} />
        <KPI label="True Cost Gap" value={`${trueCostGap.pctGap.toFixed(1)}%`} sub="Price vs true cost" accent={T.red} />
        <KPI label="BOM Components" value={adjustedBOM.length} sub="Line items" accent={T.navyL} />
        <KPI label="Scenario" value={scenarioMode === 'bull' ? '+50%' : scenarioMode === 'bear' ? '-50%' : 'Base'} sub="Commodity scenario" accent={scenarioMode === 'bull' ? T.red : scenarioMode === 'bear' ? T.green : T.navy} />
      </div>

      {/* 4. Scenario Toggle */}
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center' }}>
        <span style={{ fontSize:12, fontWeight:600 }}>Commodity Scenario:</span>
        <Btn small active={scenarioMode==='bear'} onClick={() => setScenarioMode('bear')}>Bear (-50%)</Btn>
        <Btn small active={scenarioMode==='base'} onClick={() => setScenarioMode('base')}>Base</Btn>
        <Btn small active={scenarioMode==='bull'} onClick={() => setScenarioMode('bull')}>Bull (+50%)</Btn>
      </div>

      {/* 5. Financial Flow Waterfall */}
      <Section title="Financial Flow Waterfall" badge={`Cost Build-Up (${scenarioMode})`}>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={waterfallData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="name" tick={{ fontSize:10, fill:T.textSec }} angle={-15} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize:11, fill:T.textSec }} />
            <Tooltip formatter={(v) => fmtUSD(v)} contentStyle={{ borderRadius:8, border:`1px solid ${T.border}` }} />
            <Bar dataKey="value" name="Cost (USD)">
              {waterfallData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
            <Line dataKey="end" type="stepAfter" stroke={T.red} strokeWidth={2} dot={false} name="Cumulative" />
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ display:'flex', gap:12, marginTop:10, alignItems:'center' }}>
          <div style={{ height:12, flex:`0 0 ${Math.min(80, trueCostGap.pctGap * 2)}%`, background:`${T.red}30`, borderRadius:6, border:`1px solid ${T.red}40`, position:'relative' }}>
            <div style={{ position:'absolute', right:8, top:-1, fontSize:10, fontWeight:700, color:T.red }}>+{fmtUSD(totalExternality)} externalities</div>
          </div>
        </div>
      </Section>

      {/* 6. Bill of Materials Table */}
      <Section title="Bill of Materials" badge={`${adjustedBOM.length} Components`}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr>
                <SortHeader label="Material" col="material" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Qty (kg)" col="quantity_kg" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Unit Price ($/kg)" col="price_per_kg" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Adj. Price" col="adjusted_price" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Cost (USD)" col="adjusted_cost" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <th style={{ padding:'8px 10px', fontSize:11, fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.gold}` }}>% of Total</th>
                <th style={{ padding:'8px 10px', fontSize:11, fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.gold}` }}>Origin</th>
                <th style={{ padding:'8px 10px', fontSize:11, fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.gold}` }}>Commodity</th>
              </tr>
            </thead>
            <tbody>
              {sortedBOM.map((c, i) => (
                <tr key={i} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding:'8px 10px', fontWeight:600 }}>{c.material}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right' }}>{c.quantity_kg ? fmt(c.quantity_kg, 3) : '\u2014'}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right' }}>{c.price_per_kg ? fmtUSD(c.price_per_kg) : '\u2014'}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', color: c.change_pct > 0 ? T.red : c.change_pct < 0 ? T.green : T.text }}>
                    {c.adjusted_price ? fmtUSD(c.adjusted_price) : '\u2014'}
                    {c.change_pct !== 0 && <span style={{ fontSize:9, marginLeft:4 }}>({c.change_pct > 0 ? '+' : ''}{c.change_pct}%)</span>}
                  </td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700 }}>{fmtUSD(c.adjusted_cost)}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right' }}>{adjustedRawTotal > 0 ? (c.adjusted_cost / adjustedRawTotal * 100).toFixed(1) : '0.0'}%</td>
                  <td style={{ padding:'8px 10px', fontSize:10, color:T.textSec }}>{c.origin || '\u2014'}</td>
                  <td style={{ padding:'8px 10px' }}>
                    {c.commodity_id ? <span style={{ fontSize:10, padding:'2px 8px', borderRadius:12, background:T.navy+'15', color:T.navy, fontWeight:600 }}>{c.commodity_id}</span> : '\u2014'}
                  </td>
                </tr>
              ))}
              <tr style={{ background:T.navy+'10', fontWeight:700 }}>
                <td style={{ padding:'8px 10px' }}>TOTAL RAW MATERIALS</td>
                <td colSpan={3}></td>
                <td style={{ padding:'8px 10px', textAlign:'right', color: rawDelta > 0 ? T.red : rawDelta < 0 ? T.green : T.navy }}>{fmtUSD(adjustedRawTotal)}</td>
                <td style={{ padding:'8px 10px', textAlign:'right' }}>100%</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* 7. Commodity Price Sensitivity Sliders */}
      <Section title="Commodity Price Sensitivity" badge="Interactive Sliders">
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
          <div style={{ fontSize:12, color:T.textSec, marginBottom:14 }}>Adjust commodity prices to see impact on final product cost (on top of scenario):</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 }}>
            {adjustedBOM.filter(c => c.commodity_id).map(c => (
              <div key={c.commodity_id} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:11, fontWeight:600, minWidth:80 }}>{c.material.split('(')[0].trim()}</span>
                <input type="range" min={-50} max={50} step={5} value={priceSliders[c.commodity_id] ?? 0}
                  onChange={e => setPriceSliders(prev => ({ ...prev, [c.commodity_id]: parseInt(e.target.value) }))}
                  style={{ flex:1, accentColor:T.gold }} />
                <span style={{ fontSize:12, fontWeight:700, minWidth:45, textAlign:'right', color: (priceSliders[c.commodity_id]??0) > 0 ? T.red : (priceSliders[c.commodity_id]??0) < 0 ? T.green : T.textSec }}>
                  {(priceSliders[c.commodity_id]??0) > 0 ? '+' : ''}{priceSliders[c.commodity_id] ?? 0}%
                </span>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginTop:16 }}>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center' }}>
              <div style={{ fontSize:10, color:T.textMut }}>Original Price</div>
              <div style={{ fontSize:16, fontWeight:700, color:T.navy }}>{fmtUSD(flow?.final_price_usd)}</div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center' }}>
              <div style={{ fontSize:10, color:T.textMut }}>Adjusted Price</div>
              <div style={{ fontSize:16, fontWeight:700, color: rawDelta > 0 ? T.red : rawDelta < 0 ? T.green : T.navy }}>{fmtUSD(adjustedFinalPrice)}</div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center' }}>
              <div style={{ fontSize:10, color:T.textMut }}>Price Delta</div>
              <div style={{ fontSize:16, fontWeight:700, color: rawDelta > 0 ? T.red : rawDelta < 0 ? T.green : T.textSec }}>{rawDelta > 0 ? '+' : ''}{fmtUSD(rawDelta)}</div>
            </div>
          </div>
          <div style={{ marginTop:10, textAlign:'right' }}>
            <Btn small onClick={() => { setPriceSliders({}); setScenarioMode('base'); }}>Reset All</Btn>
          </div>
        </div>
      </Section>

      {/* 8. Commodity Scenario Analysis (\u00b150%) */}
      <Section title="Commodity Price Scenario Analysis" badge="\u00b150% Each Material">
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr>
                {['Material','Origin','Commodity','Base Cost','Bear (-50%)','Bull (+50%)','Swing Range'].map(h => (
                  <th key={h} style={{ padding:'8px 10px', fontSize:11, fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.gold}`, textAlign:'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scenarioData.map((s, i) => (
                <tr key={i} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding:'8px 10px', fontWeight:600 }}>{s.material}</td>
                  <td style={{ padding:'8px 10px', fontSize:10, color:T.textSec }}>{s.origin}</td>
                  <td style={{ padding:'8px 10px' }}><span style={{ fontSize:10, padding:'2px 8px', borderRadius:12, background:T.navy+'15', color:T.navy, fontWeight:600 }}>{s.commodity}</span></td>
                  <td style={{ padding:'8px 10px', textAlign:'right' }}>{fmtUSD(s.base)}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', color:T.green, fontWeight:600 }}>{fmtUSD(s.bear50)}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', color:T.red, fontWeight:600 }}>{fmtUSD(s.bull50)}</td>
                  <td style={{ padding:'8px 10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:80, height:6, background:T.surfaceH, borderRadius:3, overflow:'hidden', position:'relative' }}>
                        <div style={{ position:'absolute', left:'25%', width:'50%', height:'100%', background:T.gold, borderRadius:3 }} />
                      </div>
                      <span style={{ fontSize:10, color:T.textSec }}>{fmtUSD(s.bull50 - s.bear50)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 9. Value-Add Distribution */}
      <Section title="Value-Add Distribution" badge="Where Margin Is Captured">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={(() => {
                const totals = { Materials:0, Labor:0, Energy:0, Capital:0, Margin:0 };
                valueAddData.forEach(v => { totals.Materials += v.materials; totals.Labor += v.labor; totals.Energy += v.energy; totals.Capital += v.capital; totals.Margin += v.margin; });
                return Object.entries(totals).filter(([,v]) => v > 0).map(([k, v]) => ({ name:k, value:Math.round(v*100)/100 }));
              })()} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={{ stroke:T.textMut }}>
                {[T.navy, T.gold, T.red, T.sage, T.amber].map((c,i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip formatter={(v) => fmtUSD(v)} contentStyle={{ borderRadius:8 }} />
            </PieChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={valueAddData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize:9, fill:T.textSec }} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize:11, fill:T.textSec }} />
              <Tooltip formatter={(v) => fmtUSD(v)} contentStyle={{ borderRadius:8 }} />
              <Legend />
              <Bar dataKey="labor" stackId="a" fill={T.gold} name="Labor" />
              <Bar dataKey="energy" stackId="a" fill={T.red} name="Energy" />
              <Bar dataKey="capital" stackId="a" fill={T.sage} name="Capital" />
              <Bar dataKey="margin" stackId="a" fill={T.navy} name="Margin" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* 10. Full Externality Cost Breakdown */}
      <Section title="Externality Cost Breakdown (5 Categories)" badge={`Total: ${fmtUSD(totalExternality)}`}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={externalityBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis type="number" tick={{ fontSize:11, fill:T.textSec }} />
              <YAxis dataKey="category" type="category" width={120} tick={{ fontSize:11, fill:T.textSec }} />
              <Tooltip formatter={(v) => fmtUSD(v)} contentStyle={{ borderRadius:8 }} />
              <Bar dataKey="cost" name="Externality Cost (USD)" radius={[0,4,4,0]}>
                {externalityBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:10 }}>Externality Price References</div>
            {Object.entries(EXTERNALITY_PRICES).map(([key, ep]) => (
              <div key={key} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${T.borderL}`, fontSize:12 }}>
                <span style={{ fontWeight:600, textTransform:'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                <span style={{ color:T.textSec }}>{ep.price !== null ? `${fmtUSD(ep.price)} ${ep.unit}` : ep.unit}</span>
              </div>
            ))}
            <div style={{ marginTop:12, fontSize:11, color:T.textSec }}>
              Carbon: $51/t CO\u2082e | Water: $2.50/ML | Air: $8.50/t | Biodiversity: $15/ha | Waste: $75/t
            </div>
          </div>
        </div>
      </Section>

      {/* 11. True Cost Accounting */}
      <Section title="True Cost Accounting" badge="Market + Hidden Costs">
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
          <div style={{ display:'flex', borderRadius:8, overflow:'hidden', height:36, marginBottom:12 }}>
            <div style={{ width:`${(adjustedFinalPrice/(adjustedFinalPrice+totalExternality))*100}%`, background:T.navy, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:700 }}>
              Market: {fmtUSD(adjustedFinalPrice)}
            </div>
            <div style={{ width:`${(totalExternality/(adjustedFinalPrice+totalExternality))*100}%`, background:T.red, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:700 }}>
              Hidden: {fmtUSD(totalExternality)}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center', borderLeft:`4px solid ${T.navy}` }}>
              <div style={{ fontSize:10, color:T.textMut }}>Market Price</div>
              <div style={{ fontSize:18, fontWeight:700, color:T.navy }}>{fmtUSD(adjustedFinalPrice)}</div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center', borderLeft:`4px solid ${T.red}` }}>
              <div style={{ fontSize:10, color:T.textMut }}>Externality Cost</div>
              <div style={{ fontSize:18, fontWeight:700, color:T.red }}>{fmtUSD(totalExternality)}</div>
            </div>
            <div style={{ background:T.surfaceH, borderRadius:8, padding:12, textAlign:'center', borderLeft:`4px solid ${T.amber}` }}>
              <div style={{ fontSize:10, color:T.textMut }}>TRUE COST</div>
              <div style={{ fontSize:18, fontWeight:700, color:T.amber }}>{fmtUSD(adjustedFinalPrice + totalExternality)}</div>
            </div>
          </div>
        </div>
      </Section>

      {/* 12. All-Products Externality Comparison */}
      <Section title="Cross-Product Externality Comparison" badge={`${PRODUCT_KEYS.length} Products`}>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={allProductExternalities}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="name" tick={{ fontSize:9, fill:T.textSec }} angle={-25} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize:11, fill:T.textSec }} />
            <Tooltip formatter={(v) => typeof v === 'number' ? (v >= 1 ? fmtUSD(v) : `${v.toFixed(1)}%`) : v} contentStyle={{ borderRadius:8 }} />
            <Legend />
            <Bar dataKey="price" name="Market Price" fill={T.navy} radius={[4,4,0,0]} />
            <Bar dataKey="externality" name="Externality Cost" fill={T.red} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ overflowX:'auto', marginTop:12 }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr>
                {['Product','Market Price','Carbon','Water','Air','Biodiv.','Waste','Total Ext.','True Cost','Gap %'].map(h => (
                  <th key={h} style={{ padding:'6px 8px', fontSize:10, fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.gold}`, textAlign:'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allProductExternalities.map((p, i) => (
                <tr key={i} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding:'6px 8px', fontWeight:600, textAlign:'left' }}>{p.icon} {p.name}</td>
                  <td style={{ padding:'6px 8px', textAlign:'right' }}>{fmtUSD(p.price)}</td>
                  <td style={{ padding:'6px 8px', textAlign:'right', color:T.red }}>{fmtUSD(p.carbon)}</td>
                  <td style={{ padding:'6px 8px', textAlign:'right', color:'#06b6d4' }}>{fmtUSD(p.water)}</td>
                  <td style={{ padding:'6px 8px', textAlign:'right', color:T.amber }}>{fmtUSD(p.air)}</td>
                  <td style={{ padding:'6px 8px', textAlign:'right', color:T.green }}>{fmtUSD(p.biodiversity)}</td>
                  <td style={{ padding:'6px 8px', textAlign:'right', color:'#7c3aed' }}>{fmtUSD(p.waste)}</td>
                  <td style={{ padding:'6px 8px', textAlign:'right', fontWeight:700, color:T.red }}>{fmtUSD(p.externality)}</td>
                  <td style={{ padding:'6px 8px', textAlign:'right', fontWeight:700 }}>{fmtUSD(p.trueCost)}</td>
                  <td style={{ padding:'6px 8px', textAlign:'right', fontWeight:700, color:T.amber }}>{p.gapPct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 13. Supply Chain Margin Waterfall */}
      <Section title="Supply Chain Value Capture by Country" badge="Country Waterfall">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={marginByCountry} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis type="number" tick={{ fontSize:11, fill:T.textSec }} />
            <YAxis dataKey="country" type="category" width={90} tick={{ fontSize:11, fill:T.textSec }} />
            <Tooltip formatter={(v) => fmtUSD(v)} contentStyle={{ borderRadius:8 }} />
            <Legend />
            <Bar dataKey="extraction" stackId="a" fill={T.navy} name="Raw Materials" radius={[0,0,0,0]} />
            <Bar dataKey="processing" stackId="a" fill={T.gold} name="Processing" />
            <Bar dataKey="manufacturing" stackId="a" fill={T.sage} name="Manufacturing" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* 14. End-of-Life Value Analysis */}
      <Section title="End-of-Life Value Analysis" badge="Recycle vs Landfill">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={PRODUCT_KEYS.map(k => {
              const f = FINANCIAL_FLOWS[k];
              return { name: f.name.split('(')[0].trim(), recycle: f.end_of_life_value_usd, landfill: f.scrap_value_usd };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize:9, fill:T.textSec }} angle={-25} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize:11, fill:T.textSec }} />
              <Tooltip formatter={(v) => fmtUSD(v)} contentStyle={{ borderRadius:8 }} />
              <Legend />
              <Bar dataKey="recycle" fill={T.green} name="Recycle Value" radius={[4,4,0,0]} />
              <Bar dataKey="landfill" fill={T.textMut} name="Landfill/Scrap" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:10 }}>Selected: {flow?.name}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ background:T.green+'15', borderRadius:10, padding:16, textAlign:'center', border:`1px solid ${T.green}30` }}>
                <div style={{ fontSize:10, color:T.textMut }}>Recycled Value</div>
                <div style={{ fontSize:22, fontWeight:700, color:T.green }}>{fmtUSD(flow?.end_of_life_value_usd)}</div>
                <div style={{ fontSize:10, color:T.textSec, marginTop:4 }}>{flow ? ((flow.end_of_life_value_usd / flow.final_price_usd) * 100).toFixed(1) : 0}% of original</div>
              </div>
              <div style={{ background:T.textMut+'15', borderRadius:10, padding:16, textAlign:'center', border:`1px solid ${T.textMut}30` }}>
                <div style={{ fontSize:10, color:T.textMut }}>Landfill Scrap</div>
                <div style={{ fontSize:22, fontWeight:700, color:T.textMut }}>{fmtUSD(flow?.scrap_value_usd)}</div>
                <div style={{ fontSize:10, color:T.textSec, marginTop:4 }}>{flow ? ((flow.scrap_value_usd / flow.final_price_usd) * 100).toFixed(2) : 0}% of original</div>
              </div>
            </div>
            <div style={{ marginTop:12, fontSize:12, color:T.green, fontWeight:700, background:T.green+'10', padding:'8px 12px', borderRadius:8, textAlign:'center' }}>
              Recycling premium: {fmtUSD((flow?.end_of_life_value_usd || 0) - (flow?.scrap_value_usd || 0))} (+{(((flow?.end_of_life_value_usd || 1) / (flow?.scrap_value_usd || 1) - 1) * 100).toFixed(0)}%)
            </div>
          </div>
        </div>
      </Section>

      {/* 15. Portfolio Commodity Sensitivity */}
      <Section title="Commodity Price Impact on Portfolio Revenue" badge={`${portfolioSensitivity.length} Holdings`}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr>
                {['Company','Sector','Top Commodity','Sensitivity %','Revenue ($Mn)','Impact ($Mn)'].map(h => (
                  <th key={h} style={{ padding:'8px 10px', fontSize:11, fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.gold}`, textAlign:'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolioSensitivity.map((h, i) => (
                <tr key={i} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                  <td style={{ padding:'8px 10px', fontWeight:600 }}>{h.company}</td>
                  <td style={{ padding:'8px 10px', color:T.textSec }}>{h.sector}</td>
                  <td style={{ padding:'8px 10px' }}>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:12, background:T.navy+'15', color:T.navy, fontWeight:600 }}>{h.top_commodity}</span>
                  </td>
                  <td style={{ padding:'8px 10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:80, height:6, background:T.surfaceH, borderRadius:3, overflow:'hidden' }}>
                        <div style={{ width:`${h.sensitivity * 2}%`, height:'100%', background: h.sensitivity > 25 ? T.red : h.sensitivity > 15 ? T.amber : T.green, borderRadius:3 }} />
                      </div>
                      <span style={{ fontWeight:600, color: h.sensitivity > 25 ? T.red : h.sensitivity > 15 ? T.amber : T.green }}>{h.sensitivity}%</span>
                    </div>
                  </td>
                  <td style={{ padding:'8px 10px', textAlign:'right' }}>${h.revenue_mn.toLocaleString()}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700, color:T.red }}>${h.impact_mn.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 16. BOM Origin Map (Table) */}
      <Section title="BOM Supply Chain Origin Map" badge={`${adjustedBOM.filter(c=>c.origin).length} Origins`}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12 }}>
          {(() => {
            const byOrigin = {};
            adjustedBOM.filter(c => c.origin).forEach(c => {
              if (!byOrigin[c.origin]) byOrigin[c.origin] = { country: c.origin, materials: [], totalCost: 0, count: 0 };
              byOrigin[c.origin].materials.push(c.material.split('(')[0].trim());
              byOrigin[c.origin].totalCost += (c.adjusted_cost || 0);
              byOrigin[c.origin].count++;
            });
            return Object.values(byOrigin).sort((a, b) => b.totalCost - a.totalCost).map(o => (
              <div key={o.country} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:14, borderLeft:`4px solid ${T.navy}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:T.navy }}>{o.country}</div>
                  <span style={{ fontSize:10, fontWeight:700, color:T.gold }}>{o.count} items</span>
                </div>
                <div style={{ fontSize:16, fontWeight:700, color:T.navy, marginBottom:4 }}>{fmtUSD(o.totalCost)}</div>
                <div style={{ fontSize:10, color:T.textSec }}>{o.materials.join(', ')}</div>
                <div style={{ height:4, background:T.surfaceH, borderRadius:2, marginTop:6, overflow:'hidden' }}>
                  <div style={{ width:`${Math.min(100, (o.totalCost / adjustedRawTotal) * 100)}%`, height:'100%', background:T.navy, borderRadius:2 }} />
                </div>
                <div style={{ fontSize:9, color:T.textMut, marginTop:2 }}>{adjustedRawTotal > 0 ? ((o.totalCost / adjustedRawTotal) * 100).toFixed(1) : 0}% of raw cost</div>
              </div>
            ));
          })()}
        </div>
      </Section>

      {/* 17. Stage Cost Breakdown Detail */}
      <Section title="Stage-by-Stage Cost & Margin Detail" badge={`${flow?.stages?.length || 0} Stages`}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr>
                {['Stage','Cost (USD)','Labor %','Energy %','Capital %','Margin %','Value Add','Margin $'].map(h => (
                  <th key={h} style={{ padding:'8px 10px', fontSize:11, fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.gold}`, textAlign:'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flow?.stages?.map((s, i) => {
                const marginDollar = (s.value_add || 0) * (s.margin_pct || 0) / 100;
                return (
                  <tr key={i} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding:'8px 10px', fontWeight:600 }}>{s.stage}</td>
                    <td style={{ padding:'8px 10px', fontWeight:700 }}>{fmtUSD(i === 0 ? adjustedRawTotal : s.cost_usd)}</td>
                    <td style={{ padding:'8px 10px', textAlign:'center' }}>{s.labor_pct ? `${s.labor_pct}%` : '\u2014'}</td>
                    <td style={{ padding:'8px 10px', textAlign:'center' }}>{s.energy_pct ? `${s.energy_pct}%` : '\u2014'}</td>
                    <td style={{ padding:'8px 10px', textAlign:'center' }}>{s.depreciation_pct ? `${s.depreciation_pct}%` : '\u2014'}</td>
                    <td style={{ padding:'8px 10px', textAlign:'center' }}>
                      {s.margin_pct ? (
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:12, background: s.margin_pct > 30 ? T.green+'20' : s.margin_pct > 10 ? T.amber+'20' : T.red+'20', color: s.margin_pct > 30 ? T.green : s.margin_pct > 10 ? T.amber : T.red }}>{s.margin_pct}%</span>
                      ) : '\u2014'}
                    </td>
                    <td style={{ padding:'8px 10px', textAlign:'right' }}>{s.value_add ? fmtUSD(s.value_add) : '\u2014'}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700, color:T.green }}>{marginDollar > 0 ? fmtUSD(marginDollar) : '\u2014'}</td>
                  </tr>
                );
              })}
              <tr style={{ background:T.navy+'10', fontWeight:700 }}>
                <td style={{ padding:'8px 10px' }}>TOTAL</td>
                <td style={{ padding:'8px 10px' }}>{fmtUSD(adjustedFinalPrice)}</td>
                <td colSpan={4}></td>
                <td style={{ padding:'8px 10px', textAlign:'right' }}>{fmtUSD(adjustedFinalPrice - adjustedRawTotal)}</td>
                <td style={{ padding:'8px 10px', textAlign:'right', color:T.green }}>
                  {fmtUSD(flow?.stages?.reduce((s, st) => s + (st.value_add || 0) * (st.margin_pct || 0) / 100, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* 18. Margin Concentration Analysis */}
      <Section title="Margin Concentration Analysis" badge="Where Profit Lives">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={flow?.stages?.filter(s => s.margin_pct && s.value_add).map(s => ({
                name: s.stage.split(' ').slice(0, 2).join(' '),
                value: Math.round(s.value_add * s.margin_pct / 100 * 100) / 100,
              })) || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={{ stroke:T.textMut }}>
                {(flow?.stages || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmtUSD(v)} contentStyle={{ borderRadius:8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>Margin Distribution</div>
            {flow?.stages?.filter(s => s.margin_pct && s.value_add).map((s, i) => {
              const margin$ = s.value_add * s.margin_pct / 100;
              const totalMargin = flow.stages.reduce((sum, st) => sum + (st.value_add || 0) * (st.margin_pct || 0) / 100, 0);
              const share = totalMargin > 0 ? (margin$ / totalMargin * 100) : 0;
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:`1px solid ${T.borderL}` }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:PIE_COLORS[i % PIE_COLORS.length], flexShrink:0 }} />
                  <span style={{ flex:1, fontSize:12, fontWeight:600 }}>{s.stage}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:T.green, minWidth:60, textAlign:'right' }}>{fmtUSD(margin$)}</span>
                  <span style={{ fontSize:10, color:T.textSec, minWidth:40, textAlign:'right' }}>{share.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* 19. Cross-Product True Cost Gap Ranking */}
      <Section title="True Cost Gap Ranking" badge="All Products by Hidden Cost %">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={allProductExternalities} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis type="number" tick={{ fontSize:11, fill:T.textSec }} />
            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize:10, fill:T.textSec }} />
            <Tooltip formatter={(v) => typeof v === 'number' ? `${v.toFixed(1)}%` : v} contentStyle={{ borderRadius:8 }} />
            <Bar dataKey="gapPct" name="True Cost Gap %" radius={[0,4,4,0]}>
              {allProductExternalities.map((d, i) => <Cell key={i} fill={d.gapPct > 30 ? T.red : d.gapPct > 10 ? T.amber : T.green} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* 20. Product Environmental Footprint Summary */}
      <Section title="Product Environmental Footprint Summary" badge={`${PRODUCT_KEYS.length} Products`}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11, fontFamily:T.font }}>
            <thead>
              <tr>
                {['Product','Sector','GWP (kg)','Water (L)','Waste (kg)','Land (ha)','EOL Value','Scrap','Recycling Premium'].map(h => (
                  <th key={h} style={{ padding:'6px 8px', fontSize:10, fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.gold}`, textAlign:'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRODUCT_KEYS.map((k, i) => {
                const f = FINANCIAL_FLOWS[k];
                return (
                  <tr key={k} style={{ background: k === selectedProduct ? T.gold+'15' : i%2===0 ? T.surface : T.surfaceH, cursor:'pointer' }} onClick={() => { setSelectedProduct(k); setPriceSliders({}); }}>
                    <td style={{ padding:'6px 8px', fontWeight:600, textAlign:'left' }}>{f.icon} {f.name.split('(')[0].trim()}</td>
                    <td style={{ padding:'6px 8px', textAlign:'left', color:T.textSec, fontSize:10 }}>{f.sector}</td>
                    <td style={{ padding:'6px 8px', textAlign:'right', color:T.red }}>{f.gwp_total_kg?.toLocaleString()}</td>
                    <td style={{ padding:'6px 8px', textAlign:'right', color:'#06b6d4' }}>{f.water_total_l?.toLocaleString()}</td>
                    <td style={{ padding:'6px 8px', textAlign:'right' }}>{f.waste_kg}</td>
                    <td style={{ padding:'6px 8px', textAlign:'right' }}>{f.land_ha}</td>
                    <td style={{ padding:'6px 8px', textAlign:'right', color:T.green, fontWeight:600 }}>{fmtUSD(f.end_of_life_value_usd)}</td>
                    <td style={{ padding:'6px 8px', textAlign:'right', color:T.textMut }}>{fmtUSD(f.scrap_value_usd)}</td>
                    <td style={{ padding:'6px 8px', textAlign:'right', fontWeight:700, color:T.green }}>{fmtUSD(f.end_of_life_value_usd - f.scrap_value_usd)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 21. Material Cost Treemap (Flat Table Visualization) */}
      <Section title="Material Cost Concentration" badge="BOM Treemap">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:4 }}>
          {sortedBOM.filter(c => c.adjusted_cost > 0).map((c, i) => {
            const share = adjustedRawTotal > 0 ? c.adjusted_cost / adjustedRawTotal : 0;
            const size = Math.max(50, Math.round(share * 400));
            return (
              <div key={i} style={{ background:PIE_COLORS[i % PIE_COLORS.length]+'25', border:`1px solid ${PIE_COLORS[i % PIE_COLORS.length]}40`, borderRadius:8, padding:8, minHeight:size/4, display:'flex', flexDirection:'column', justifyContent:'center' }}>
                <div style={{ fontSize:9, fontWeight:700, color:T.navy }}>{c.material.split('(')[0].trim()}</div>
                <div style={{ fontSize:12, fontWeight:700, color:PIE_COLORS[i % PIE_COLORS.length] }}>{fmtUSD(c.adjusted_cost)}</div>
                <div style={{ fontSize:8, color:T.textMut }}>{(share * 100).toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 22. Green Premium Calculator */}
      <Section title="Green Premium Calculator" badge="Sustainable Alternatives">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:14 }}>
          {GREEN_PREMIUMS.map(gp => (
            <div key={gp.product} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:16, borderLeft:`4px solid ${T.green}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ fontWeight:700, fontSize:13, color:T.navy }}>{gp.product}</div>
                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:12, background: gp.status==='Available' ? T.green+'20' : T.amber+'20', color: gp.status==='Available' ? T.green : T.amber, fontWeight:600 }}>{gp.status}</span>
              </div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:8 }}>vs {gp.conventional}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div style={{ background:T.amber+'10', borderRadius:6, padding:8, textAlign:'center' }}>
                  <div style={{ fontSize:10, color:T.textMut }}>Green Premium</div>
                  <div style={{ fontSize:16, fontWeight:700, color:T.amber }}>+{gp.premium_pct}%</div>
                </div>
                <div style={{ background:T.green+'10', borderRadius:6, padding:8, textAlign:'center' }}>
                  <div style={{ fontSize:10, color:T.textMut }}>CO\u2082 Reduction</div>
                  <div style={{ fontSize:16, fontWeight:700, color:T.green }}>-{gp.co2_reduction_pct}%</div>
                </div>
              </div>
              <div style={{ marginTop:8, fontSize:11, color:T.textSec }}>
                Cost/tonne CO\u2082 avoided: ~${Math.round(gp.premium_pct * 10 / (gp.co2_reduction_pct / 100))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 23. Externality Price Reference Table */}
      <Section title="Externality Pricing Methodology" badge="5 Categories">
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr>
                {['Category','Price','Unit','Source','Application Method','Selected Product Impact'].map(h => (
                  <th key={h} style={{ padding:'8px 10px', fontSize:11, fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.gold}`, textAlign:'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(EXTERNALITY_PRICES).map(([key, ep], i) => {
                const extItem = externalityBreakdown.find(e => e.category.toLowerCase().includes(key.split('_')[0]));
                return (
                  <tr key={key} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                    <td style={{ padding:'8px 10px', fontWeight:600 }}>
                      <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:ep.color, marginRight:6 }} />
                      {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </td>
                    <td style={{ padding:'8px 10px', fontWeight:700, color:T.navy }}>${ep.price}</td>
                    <td style={{ padding:'8px 10px', color:T.textSec }}>{ep.unit}</td>
                    <td style={{ padding:'8px 10px', fontSize:10, color:T.textSec }}>{ep.source}</td>
                    <td style={{ padding:'8px 10px', fontSize:10 }}>
                      {key === 'carbon' ? `GWP/1000 x $${ep.price}` :
                       key === 'water' ? `Water/1M L x $${ep.price} x 1000` :
                       key === 'air_pollution' ? 'GWP/1000 x 0.15 x price' :
                       key === 'biodiversity' ? 'Land (ha) x price' :
                       'Waste (t) x price'}
                    </td>
                    <td style={{ padding:'8px 10px', fontWeight:700, color:ep.color }}>{fmtUSD(extItem?.cost || 0)}</td>
                  </tr>
                );
              })}
              <tr style={{ background:T.navy+'10', fontWeight:700 }}>
                <td style={{ padding:'8px 10px' }}>TOTAL EXTERNALITY</td>
                <td colSpan={4}></td>
                <td style={{ padding:'8px 10px', fontWeight:700, color:T.red }}>{fmtUSD(totalExternality)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* 24. Cross-Product Cost Efficiency Radar */}
      <Section title="Cost Efficiency Radar" badge="Selected vs Average">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={(() => {
              const metrics = [
                { key: 'raw_pct', label: 'Raw Material %' },
                { key: 'margin_pct', label: 'Margin %' },
                { key: 'ext_gap_pct', label: 'Hidden Cost %' },
                { key: 'eol_pct', label: 'EOL Recovery %' },
                { key: 'labor_intensity', label: 'Labor Intensity' },
              ];
              const rawPct = adjustedRawTotal / adjustedFinalPrice * 100;
              const totalMarginPct = flow?.stages?.reduce((s, st) => s + (st.margin_pct || 0), 0) / (flow?.stages?.length || 1);
              const eolPct = flow ? (flow.end_of_life_value_usd / flow.final_price_usd * 100) : 0;
              const laborInt = flow?.stages?.reduce((s, st) => s + (st.labor_pct || 0), 0) / (flow?.stages?.length || 1);
              const avgExt = allProductExternalities.reduce((s, p) => s + p.gapPct, 0) / allProductExternalities.length;
              return metrics.map((m, i) => {
                const selected = i === 0 ? rawPct : i === 1 ? totalMarginPct : i === 2 ? trueCostGap.pctGap : i === 3 ? eolPct : laborInt;
                const avg = i === 0 ? 35 : i === 1 ? 20 : i === 2 ? avgExt : i === 3 ? 5 : 25;
                return { metric: m.label, selected: Math.round(selected), average: Math.round(avg) };
              });
            })()}>
              <PolarGrid stroke={T.borderL} />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize:10, fill:T.textSec }} />
              <PolarRadiusAxis tick={{ fontSize:9, fill:T.textMut }} />
              <Radar name="Selected Product" dataKey="selected" stroke={T.navy} fill={T.navy} fillOpacity={0.2} />
              <Radar name="Average (All Products)" dataKey="average" stroke={T.gold} fill={T.gold} fillOpacity={0.2} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:12 }}>Cost Structure Analysis</div>
            {[
              { label: 'Raw Material Share', value: `${(adjustedRawTotal / adjustedFinalPrice * 100).toFixed(1)}%`, benchmark: '~35% avg', color: T.navy },
              { label: 'Value-Add Multiple', value: `${(adjustedFinalPrice / adjustedRawTotal).toFixed(1)}x`, benchmark: '2-5x typical', color: T.gold },
              { label: 'Hidden Cost Burden', value: `${trueCostGap.pctGap.toFixed(1)}%`, benchmark: `~${(allProductExternalities.reduce((s,p)=>s+p.gapPct,0)/allProductExternalities.length).toFixed(0)}% avg`, color: T.red },
              { label: 'End-of-Life Recovery', value: `${flow ? ((flow.end_of_life_value_usd / flow.final_price_usd) * 100).toFixed(1) : 0}%`, benchmark: '5-10% typical', color: T.green },
              { label: 'Recycling Premium', value: fmtUSD((flow?.end_of_life_value_usd || 0) - (flow?.scrap_value_usd || 0)), benchmark: 'vs landfill scrap', color: T.sage },
              { label: 'Total Margin Captured', value: fmtUSD(flow?.stages?.reduce((s, st) => s + (st.value_add || 0) * (st.margin_pct || 0) / 100, 0)), benchmark: 'All stages combined', color: T.amber },
            ].map(item => (
              <div key={item.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${T.borderL}`, fontSize:12 }}>
                <span style={{ color:T.textSec }}>{item.label}</span>
                <div style={{ textAlign:'right' }}>
                  <span style={{ fontWeight:700, color:item.color }}>{item.value}</span>
                  <div style={{ fontSize:9, color:T.textMut }}>{item.benchmark}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 25. Price Elasticity Impact Summary */}
      <Section title="Price Elasticity Impact Summary" badge="Scenario Comparison">
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr>
                {['Product','Base Price','Bear (-50%)','Bull (+50%)','Swing ($)','Swing (%)','Ext. Cost','True Cost Range'].map(h => (
                  <th key={h} style={{ padding:'8px 10px', fontSize:11, fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.gold}`, textAlign:'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRODUCT_KEYS.map((k, i) => {
                const f = FINANCIAL_FLOWS[k];
                const rawStage = f.stages.find(s => s.components);
                const rawCost = rawStage?.cost_usd || 0;
                const bearPrice = f.final_price_usd - rawCost * 0.5;
                const bullPrice = f.final_price_usd + rawCost * 0.5;
                const ext = computeExternality(f);
                return (
                  <tr key={k} style={{ background: k === selectedProduct ? T.gold+'15' : i%2===0 ? T.surface : T.surfaceH, cursor:'pointer' }} onClick={() => { setSelectedProduct(k); setPriceSliders({}); }}>
                    <td style={{ padding:'8px 10px', fontWeight:600, textAlign:'left' }}>{f.icon} {f.name.split('(')[0].trim()}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right' }}>{fmtUSD(f.final_price_usd)}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', color:T.green }}>{fmtUSD(bearPrice)}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', color:T.red }}>{fmtUSD(bullPrice)}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700 }}>{fmtUSD(bullPrice - bearPrice)}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right' }}>{f.final_price_usd > 0 ? ((rawCost / f.final_price_usd) * 100).toFixed(0) : 0}%</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', color:T.red }}>{fmtUSD(ext.total)}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:600, color:T.amber }}>{fmtUSD(bearPrice + ext.total)} - {fmtUSD(bullPrice + ext.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 26. Product Lifecycle Cost Curve */}
      <Section title="Product Lifecycle Cost Curve" badge="Cumulative Stage Cost">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={(() => {
            if (!flow) return [];
            let cumulative = 0;
            return flow.stages.map((s, i) => {
              const val = i === 0 ? adjustedRawTotal : s.cost_usd;
              cumulative += val;
              return { stage: s.stage.split(' ').slice(0, 2).join(' '), cost: val, cumulative, pctOfTotal: (cumulative / adjustedFinalPrice * 100) };
            });
          })()}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="stage" tick={{ fontSize:10, fill:T.textSec }} />
            <YAxis tick={{ fontSize:11, fill:T.textSec }} />
            <Tooltip formatter={(v, name) => [name === 'cumulative' ? fmtUSD(v) : name === 'pctOfTotal' ? `${v.toFixed(0)}%` : fmtUSD(v), name]} contentStyle={{ borderRadius:8 }} />
            <Area type="monotone" dataKey="cumulative" stroke={T.navy} fill={T.navy} fillOpacity={0.15} name="Cumulative Cost" />
            <Line dataKey="cost" stroke={T.gold} strokeWidth={2} dot={{ r:4, fill:T.gold }} name="Stage Cost" />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      {/* 27. Comparative Product Radar */}
      <Section title="Cross-Product Financial Radar" badge="All Products">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={(() => {
            const metrics = ['Price', 'BOM Items', 'Ext Gap %', 'EOL Value', 'Stages'];
            const maxPrice = Math.max(...PRODUCT_KEYS.map(k => FINANCIAL_FLOWS[k].final_price_usd));
            const maxBOM = Math.max(...PRODUCT_KEYS.map(k => (FINANCIAL_FLOWS[k].stages.find(s => s.components)?.components?.length || 0)));
            const maxGap = Math.max(...allProductExternalities.map(p => p.gapPct));
            const maxEOL = Math.max(...PRODUCT_KEYS.map(k => FINANCIAL_FLOWS[k].end_of_life_value_usd));
            return metrics.map((m, i) => {
              const selected = flow ? (
                i === 0 ? flow.final_price_usd / maxPrice * 100 :
                i === 1 ? adjustedBOM.length / maxBOM * 100 :
                i === 2 ? trueCostGap.pctGap / maxGap * 100 :
                i === 3 ? flow.end_of_life_value_usd / maxEOL * 100 :
                flow.stages.length / 5 * 100
              ) : 0;
              return { metric: m, value: Math.round(selected) };
            });
          })()}>
            <PolarGrid stroke={T.borderL} />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize:10, fill:T.textSec }} />
            <PolarRadiusAxis tick={{ fontSize:9, fill:T.textMut }} domain={[0, 100]} />
            <Radar name={flow?.name?.split('(')[0]?.trim()} dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.3} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </Section>

      {/* 28. Key Assumptions & Methodology */}
      <Section title="Key Assumptions & Methodology" badge="Transparency">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:12 }}>
          {[
            { title: 'Carbon Pricing', detail: 'EPA Social Cost of Carbon at $51/tonne CO\u2082e (2024 estimate, 3% discount rate)', source: 'EPA Technical Support Document' },
            { title: 'Water Valuation', detail: 'Shadow pricing at $2.50/megalitre for water-stressed regions, weighted by basin stress index', source: 'World Resources Institute Aqueduct' },
            { title: 'Air Pollution', detail: 'WHO health cost estimate at $8.50/tonne SOx/NOx equivalent, based on DALY methodology', source: 'WHO Global Health Estimates' },
            { title: 'Biodiversity', detail: 'Ecosystem service valuation at $15/hectare-year using TEEB framework', source: 'TEEB for Business & Enterprise' },
            { title: 'Waste Disposal', detail: 'Full lifecycle cost at $75/tonne including collection, transport, and landfill/incineration', source: 'World Bank What a Waste 2.0' },
            { title: 'Commodity Prices', detail: 'Base prices from LME/CME spot markets (March 2026). Scenario analysis applies \u00b150% uniform shock', source: 'Bloomberg Commodity Index' },
            { title: 'BOM Data', detail: 'Material quantities from published EPDs, industry databases (Ecoinvent 3.10), and manufacturer disclosures', source: 'Ecoinvent, GaBi, SimaPro' },
            { title: 'End-of-Life Value', detail: 'Based on current recycled material commodity prices minus collection and processing costs', source: 'ISRI Scrap Specifications' },
          ].map((a, i) => (
            <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:14 }}>
              <div style={{ fontWeight:700, fontSize:12, color:T.navy, marginBottom:4 }}>{a.title}</div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>{a.detail}</div>
              <div style={{ fontSize:9, color:T.textMut, fontStyle:'italic' }}>Source: {a.source}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* 29. Sector-Level Financial Comparison */}
      <Section title="Sector-Level Financial Comparison" badge={`${[...new Set(PRODUCT_KEYS.map(k => FINANCIAL_FLOWS[k].sector))].length} Sectors`}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr>
                {['Sector','# Products','Avg Price','Avg Raw %','Avg Ext %','Avg EOL %','Total Market Value'].map(h => (
                  <th key={h} style={{ padding:'8px 10px', fontSize:11, fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.gold}`, textAlign:'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const sectors = {};
                PRODUCT_KEYS.forEach(k => {
                  const f = FINANCIAL_FLOWS[k];
                  if (!sectors[f.sector]) sectors[f.sector] = { sector: f.sector, products: [], totalPrice: 0, totalRaw: 0, totalExt: 0, totalEOL: 0 };
                  const rawStage = f.stages.find(s => s.components);
                  const rawCost = rawStage?.cost_usd || 0;
                  const ext = computeExternality(f);
                  sectors[f.sector].products.push(k);
                  sectors[f.sector].totalPrice += f.final_price_usd;
                  sectors[f.sector].totalRaw += rawCost;
                  sectors[f.sector].totalExt += ext.total;
                  sectors[f.sector].totalEOL += f.end_of_life_value_usd;
                });
                return Object.values(sectors).sort((a, b) => b.totalPrice - a.totalPrice).map((s, i) => {
                  const n = s.products.length;
                  const avgPrice = s.totalPrice / n;
                  const avgRawPct = (s.totalRaw / s.totalPrice * 100);
                  const avgExtPct = (s.totalExt / s.totalPrice * 100);
                  const avgEOLPct = (s.totalEOL / s.totalPrice * 100);
                  return (
                    <tr key={s.sector} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding:'8px 10px', fontWeight:700 }}>{s.sector}</td>
                      <td style={{ padding:'8px 10px', textAlign:'center' }}>{n}</td>
                      <td style={{ padding:'8px 10px', textAlign:'right' }}>{fmtUSD(avgPrice)}</td>
                      <td style={{ padding:'8px 10px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:60, height:6, background:T.surfaceH, borderRadius:3, overflow:'hidden' }}>
                            <div style={{ width:`${Math.min(100, avgRawPct)}%`, height:'100%', background:T.navy, borderRadius:3 }} />
                          </div>
                          <span style={{ fontSize:10 }}>{avgRawPct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td style={{ padding:'8px 10px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:60, height:6, background:T.surfaceH, borderRadius:3, overflow:'hidden' }}>
                            <div style={{ width:`${Math.min(100, avgExtPct * 2)}%`, height:'100%', background:T.red, borderRadius:3 }} />
                          </div>
                          <span style={{ fontSize:10, color:T.red }}>{avgExtPct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td style={{ padding:'8px 10px', textAlign:'right', color:T.green }}>{avgEOLPct.toFixed(1)}%</td>
                      <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700 }}>{fmtUSD(s.totalPrice)}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 30. BOM Complexity Index */}
      <Section title="BOM Complexity Index" badge="All Products">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={PRODUCT_KEYS.map(k => {
            const f = FINANCIAL_FLOWS[k];
            const rawStage = f.stages.find(s => s.components);
            const items = rawStage?.components?.length || 0;
            const origins = [...new Set((rawStage?.components || []).map(c => c.origin).filter(Boolean))].length;
            const commodities = (rawStage?.components || []).filter(c => c.commodity_id).length;
            return { name: f.name.split('(')[0].trim().substring(0, 12), items, origins, commodities };
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="name" tick={{ fontSize:9, fill:T.textSec }} angle={-25} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize:11, fill:T.textSec }} />
            <Tooltip contentStyle={{ borderRadius:8 }} />
            <Legend />
            <Bar dataKey="items" fill={T.navy} name="BOM Line Items" radius={[4,4,0,0]} />
            <Bar dataKey="origins" fill={T.gold} name="Unique Origins" radius={[4,4,0,0]} />
            <Bar dataKey="commodities" fill={T.sage} name="Tracked Commodities" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* 31. Value Chain Margin Waterfall for Selected Product */}
      <Section title="Value Chain Margin Waterfall" badge={flow?.name?.split('(')[0]?.trim()}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={(() => {
            if (!flow) return [];
            return flow.stages.filter(s => s.margin_pct && s.value_add).map(s => {
              const margin$ = s.value_add * s.margin_pct / 100;
              const labor$ = s.value_add * (s.labor_pct || 0) / 100;
              const energy$ = s.value_add * (s.energy_pct || 0) / 100;
              const capital$ = s.value_add * (s.depreciation_pct || 0) / 100;
              const other$ = s.value_add - margin$ - labor$ - energy$ - capital$;
              return { stage: s.stage.split(' ').slice(0, 2).join(' '), margin: margin$, labor: labor$, energy: energy$, capital: capital$, other: Math.max(0, other$) };
            });
          })()}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="stage" tick={{ fontSize:10, fill:T.textSec }} angle={-10} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize:11, fill:T.textSec }} />
            <Tooltip formatter={(v) => fmtUSD(v)} contentStyle={{ borderRadius:8 }} />
            <Legend />
            <Bar dataKey="labor" stackId="a" fill={T.gold} name="Labor" />
            <Bar dataKey="energy" stackId="a" fill={T.red} name="Energy" />
            <Bar dataKey="capital" stackId="a" fill={T.sage} name="Depreciation" />
            <Bar dataKey="margin" stackId="a" fill={T.navy} name="Margin" />
            <Bar dataKey="other" stackId="a" fill={T.textMut} name="Other" />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* 32. Sustainability Improvement Recommendations */}
      <Section title="Sustainability-Linked Cost Improvement" badge="Actionable">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
          {[
            { area: 'Material Substitution', action: 'Replace high-externality materials with recycled/bio-based alternatives', saving: `${fmtUSD(totalExternality * 0.25)} externality reduction`, feasibility: 'Medium', timeline: '1-3 years', color: T.sage },
            { area: 'Process Electrification', action: 'Transition manufacturing energy from fossil to renewable sources', saving: `${fmtUSD(totalExternality * 0.15)} carbon cost avoided`, feasibility: 'High', timeline: '2-5 years', color: T.green },
            { area: 'Circular Design', action: 'Design for disassembly to improve end-of-life material recovery', saving: `${fmtUSD((flow?.end_of_life_value_usd || 0) * 0.5)} additional EOL value`, feasibility: 'Medium', timeline: '3-5 years', color: T.gold },
            { area: 'Supply Chain Localization', action: 'Reduce transport emissions by sourcing from closer origins', saving: `${fmtUSD(adjustedFinalPrice * 0.02)} logistics cost reduction`, feasibility: 'High', timeline: '1-2 years', color: T.navy },
            { area: 'Water Stewardship', action: 'Implement closed-loop water systems in processing stages', saving: `${fmtUSD(totalExternality * 0.08)} water externality reduction`, feasibility: 'Medium', timeline: '2-4 years', color: '#06b6d4' },
            { area: 'Waste Minimization', action: 'Zero-waste manufacturing target with by-product valorization', saving: `${fmtUSD(totalExternality * 0.05)} waste externality reduction`, feasibility: 'High', timeline: '1-3 years', color: '#7c3aed' },
          ].map((rec, i) => (
            <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:14, borderLeft:`4px solid ${rec.color}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <div style={{ fontWeight:700, fontSize:12, color:T.navy }}>{rec.area}</div>
                <span style={{ fontSize:9, padding:'2px 6px', borderRadius:10, background:rec.feasibility==='High' ? T.green+'20' : T.amber+'20', color:rec.feasibility==='High' ? T.green : T.amber, fontWeight:600 }}>{rec.feasibility}</span>
              </div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:6 }}>{rec.action}</div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10 }}>
                <span style={{ color:T.green, fontWeight:700 }}>{rec.saving}</span>
                <span style={{ color:T.textMut }}>{rec.timeline}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 33. Material Price Volatility Heat Map */}
      <Section title="Material Price Volatility Assessment" badge="All Products">
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11, fontFamily:T.font }}>
            <thead>
              <tr>
                {['Commodity','Base Price','Bear -50%','Bull +50%','Swing','Volatility Risk','Affected Products'].map(h => (
                  <th key={h} style={{ padding:'6px 8px', fontSize:10, fontWeight:700, color:T.navy, borderBottom:`2px solid ${T.gold}`, textAlign:'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const commodities = {};
                PRODUCT_KEYS.forEach(k => {
                  const f = FINANCIAL_FLOWS[k];
                  const rawStage = f.stages.find(s => s.components);
                  (rawStage?.components || []).filter(c => c.commodity_id && c.price_per_kg).forEach(c => {
                    if (!commodities[c.commodity_id]) commodities[c.commodity_id] = { id: c.commodity_id, price: c.price_per_kg, products: new Set(), totalExposure: 0 };
                    commodities[c.commodity_id].products.add(f.name.split('(')[0].trim());
                    commodities[c.commodity_id].totalExposure += c.cost;
                  });
                });
                return Object.values(commodities).sort((a, b) => b.totalExposure - a.totalExposure).slice(0, 15).map((c, i) => {
                  const bear = c.price * 0.5;
                  const bull = c.price * 1.5;
                  const swing = bull - bear;
                  const risk = swing / c.price > 0.8 ? 'High' : swing / c.price > 0.5 ? 'Medium' : 'Low';
                  const rColor = risk === 'High' ? T.red : risk === 'Medium' ? T.amber : T.green;
                  return (
                    <tr key={c.id} style={{ background: i%2===0 ? T.surface : T.surfaceH }}>
                      <td style={{ padding:'6px 8px', fontWeight:600 }}>
                        <span style={{ fontSize:10, padding:'2px 6px', borderRadius:10, background:T.navy+'15', color:T.navy, fontWeight:600 }}>{c.id}</span>
                      </td>
                      <td style={{ padding:'6px 8px', textAlign:'right' }}>${c.price >= 1 ? c.price.toFixed(2) : c.price.toFixed(4)}/kg</td>
                      <td style={{ padding:'6px 8px', textAlign:'right', color:T.green }}>${bear >= 1 ? bear.toFixed(2) : bear.toFixed(4)}</td>
                      <td style={{ padding:'6px 8px', textAlign:'right', color:T.red }}>${bull >= 1 ? bull.toFixed(2) : bull.toFixed(4)}</td>
                      <td style={{ padding:'6px 8px', textAlign:'right' }}>${swing >= 1 ? swing.toFixed(2) : swing.toFixed(4)}</td>
                      <td style={{ padding:'6px 8px' }}>
                        <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:10, background:rColor+'20', color:rColor }}>{risk}</span>
                      </td>
                      <td style={{ padding:'6px 8px', fontSize:9, color:T.textSec }}>{[...c.products].slice(0, 3).join(', ')}{c.products.size > 3 ? ` +${c.products.size - 3}` : ''}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 34. True Cost vs Market Price Scatter */}
      <Section title="True Cost vs Market Price Analysis" badge="All Products">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={allProductExternalities}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="name" tick={{ fontSize:9, fill:T.textSec }} angle={-25} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize:11, fill:T.textSec }} />
            <Tooltip formatter={(v) => typeof v === 'number' ? fmtUSD(v) : v} contentStyle={{ borderRadius:8 }} />
            <Legend />
            <Bar dataKey="price" fill={T.navy} name="Market Price" radius={[4,4,0,0]} opacity={0.6} />
            <Bar dataKey="trueCost" fill={T.red} name="True Cost" radius={[4,4,0,0]} opacity={0.4} />
            <Line dataKey="gapPct" stroke={T.amber} strokeWidth={2} dot={{ r:3 }} name="Gap %" yAxisId="right" />
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ fontSize:10, color:T.textMut, marginTop:4 }}>True cost = market price + all 5 externality categories (carbon, water, air, biodiversity, waste). Gap % shows the hidden cost as percentage of market price.</div>
      </Section>

      {/* 35. Portfolio Summary Statistics */}
      <Section title="Financial Flow Summary Statistics" badge={`${PRODUCT_KEYS.length} Products`}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12 }}>
          {(() => {
            const prices = PRODUCT_KEYS.map(k => FINANCIAL_FLOWS[k].final_price_usd);
            const exts = allProductExternalities.map(p => p.externality);
            const gaps = allProductExternalities.map(p => p.gapPct);
            const eols = PRODUCT_KEYS.map(k => FINANCIAL_FLOWS[k].end_of_life_value_usd);
            const stats = [
              { label: 'Total Products', value: PRODUCT_KEYS.length, color: T.navy },
              { label: 'Sectors Covered', value: [...new Set(PRODUCT_KEYS.map(k => FINANCIAL_FLOWS[k].sector))].length, color: T.gold },
              { label: 'Highest True Cost Gap', value: `${Math.max(...gaps).toFixed(0)}%`, color: T.red },
              { label: 'Lowest True Cost Gap', value: `${Math.min(...gaps).toFixed(1)}%`, color: T.green },
              { label: 'Total Externality Sum', value: fmtUSD(exts.reduce((s, v) => s + v, 0)), color: T.red },
              { label: 'Avg Recycling Premium', value: fmtUSD(PRODUCT_KEYS.reduce((s, k) => s + FINANCIAL_FLOWS[k].end_of_life_value_usd - FINANCIAL_FLOWS[k].scrap_value_usd, 0) / PRODUCT_KEYS.length), color: T.sage },
              { label: 'Max BOM Items', value: Math.max(...PRODUCT_KEYS.map(k => (FINANCIAL_FLOWS[k].stages.find(s => s.components)?.components?.length || 0))), color: T.navyL },
              { label: 'Green Alternatives', value: GREEN_PREMIUMS.length, color: T.green },
            ];
            return stats.map(s => (
              <div key={s.label} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:14, borderTop:`3px solid ${s.color}` }}>
                <div style={{ fontSize:10, color:T.textMut, fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:18, fontWeight:700, color:T.navy }}>{s.value}</div>
              </div>
            ));
          })()}
        </div>
      </Section>

      {/* 36. Product Cost Composition Comparison */}
      <Section title="Product Cost Composition Comparison" badge="All Products">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={PRODUCT_KEYS.map(k => {
            const f = FINANCIAL_FLOWS[k];
            const rawStage = f.stages.find(s => s.components);
            const rawCost = rawStage?.cost_usd || 0;
            const rawPct = rawCost / f.final_price_usd * 100;
            const marginTotal = f.stages.reduce((s, st) => s + (st.value_add || 0) * (st.margin_pct || 0) / 100, 0);
            const marginPct = marginTotal / f.final_price_usd * 100;
            const laborTotal = f.stages.reduce((s, st) => s + (st.value_add || 0) * (st.labor_pct || 0) / 100, 0);
            const laborPct = laborTotal / f.final_price_usd * 100;
            const energyTotal = f.stages.reduce((s, st) => s + (st.value_add || 0) * (st.energy_pct || 0) / 100, 0);
            const energyPct = energyTotal / f.final_price_usd * 100;
            return { name: f.name.split('(')[0].trim().substring(0, 12), raw: Math.round(rawPct), margin: Math.round(marginPct), labor: Math.round(laborPct), energy: Math.round(energyPct) };
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
            <XAxis dataKey="name" tick={{ fontSize:8, fill:T.textSec }} angle={-25} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize:11, fill:T.textSec }} domain={[0, 100]} />
            <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius:8 }} />
            <Legend />
            <Bar dataKey="raw" stackId="a" fill={T.navy} name="Raw Material %" />
            <Bar dataKey="labor" stackId="a" fill={T.gold} name="Labor %" />
            <Bar dataKey="energy" stackId="a" fill={T.red} name="Energy %" />
            <Bar dataKey="margin" stackId="a" fill={T.sage} name="Margin %" />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ fontSize:10, color:T.textMut, marginTop:4 }}>Shows how each product's final price is distributed across cost categories. Products with high margin % (e.g., branded goods) have significant value-add beyond raw inputs.</div>
      </Section>

      {/* 37. Data Export Summary Panel */}
      <Section title="Data Export Summary" badge={`${PRODUCT_KEYS.length} x 5 stages`}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:12 }}>
            <div style={{ background:T.navy+'10', borderRadius:8, padding:10, textAlign:'center' }}>
              <div style={{ fontSize:10, color:T.textMut }}>Total BOM Items</div>
              <div style={{ fontSize:18, fontWeight:700, color:T.navy }}>{PRODUCT_KEYS.reduce((s, k) => s + (FINANCIAL_FLOWS[k].stages.find(st => st.components)?.components?.length || 0), 0)}</div>
            </div>
            <div style={{ background:T.gold+'10', borderRadius:8, padding:10, textAlign:'center' }}>
              <div style={{ fontSize:10, color:T.textMut }}>Unique Commodities</div>
              <div style={{ fontSize:18, fontWeight:700, color:T.gold }}>
                {(() => {
                  const set = new Set();
                  PRODUCT_KEYS.forEach(k => {
                    const rawStage = FINANCIAL_FLOWS[k].stages.find(s => s.components);
                    (rawStage?.components || []).forEach(c => { if (c.commodity_id) set.add(c.commodity_id); });
                  });
                  return set.size;
                })()}
              </div>
            </div>
            <div style={{ background:T.sage+'10', borderRadius:8, padding:10, textAlign:'center' }}>
              <div style={{ fontSize:10, color:T.textMut }}>Source Countries</div>
              <div style={{ fontSize:18, fontWeight:700, color:T.sage }}>
                {(() => {
                  const set = new Set();
                  PRODUCT_KEYS.forEach(k => {
                    const rawStage = FINANCIAL_FLOWS[k].stages.find(s => s.components);
                    (rawStage?.components || []).forEach(c => { if (c.origin) set.add(c.origin); });
                  });
                  return set.size;
                })()}
              </div>
            </div>
            <div style={{ background:T.red+'10', borderRadius:8, padding:10, textAlign:'center' }}>
              <div style={{ fontSize:10, color:T.textMut }}>Ext. Categories</div>
              <div style={{ fontSize:18, fontWeight:700, color:T.red }}>{Object.keys(EXTERNALITY_PRICES).length}</div>
            </div>
          </div>
          <div style={{ fontSize:11, color:T.textSec }}>
            Complete financial flow dataset: {PRODUCT_KEYS.length} products with full bill-of-materials ({PRODUCT_KEYS.reduce((s, k) => s + (FINANCIAL_FLOWS[k].stages.find(st => st.components)?.components?.length || 0), 0)} line items),
            commodity price linkage, {Object.keys(EXTERNALITY_PRICES).length}-category externality pricing, \u00b150% scenario analysis, supply chain origin mapping,
            and {GREEN_PREMIUMS.length} green premium alternatives. Export via CSV or JSON for external modeling.
          </div>
        </div>
      </Section>

      {/* 38. Cross-Navigation */}
      <Section title="Cross-Module Navigation">
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {CROSS_NAV.map(n => (
            <Btn key={n.path} small onClick={() => navigate(n.path)} style={{ background:T.surfaceH }}>{n.label} {'\u2192'}</Btn>
          ))}
        </div>
      </Section>

      <div style={{ textAlign:'center', padding:'20px 0', borderTop:`1px solid ${T.border}`, fontSize:11, color:T.textMut }}>
        Financial Flow Analyzer v6.0 | {PRODUCT_KEYS.length} Product Flows | 5-Category Externality Pricing | True Cost Accounting | \u00b150% Scenario Analysis | Country Value Waterfall | {GREEN_PREMIUMS.length} Green Alternatives
      </div>

      {/* Disclaimer */}
      <div style={{ textAlign:'center', padding:'8px 0', fontSize:9, color:T.textMut, lineHeight:1.5 }}>
        Externality prices based on EPA SCC ($51/t CO\u2082e, 2024), WHO health costs ($8.50/t), WRI Aqueduct ($2.50/ML), TEEB ($15/ha), World Bank ($75/t waste).
        Commodity prices reflect LME/CME spot (Mar 2026). BOM data from EPDs, Ecoinvent 3.10, and manufacturer disclosures.
        Scenario analysis applies uniform \u00b150% price shocks. Green premium data from published industry reports.
        This tool is for informational purposes. Actual costs may vary by region, supplier, and market conditions.
      </div>
    </div>
  );
}
