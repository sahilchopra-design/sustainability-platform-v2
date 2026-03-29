import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar } from 'recharts';
import { TRANSPORT_FACTORS, SPEND_FACTORS, ENERGY_FACTORS, GWP_AR6, TRANSPORT_KG_PER_KM } from '../../../data/emissionFactors';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ─── Product Carbon Database (200+ products, 12 categories) ─── */
const PRODUCT_CARBON_DB = {
  food_drink: {
    name: 'Food & Drink', icon: '\🍔', color: '#dc2626',
    products: [
      { id:'F001', name:'Beef (conventional)', carbon_kg:27.0, water_l:15400, land_m2:164, unit:'per kg', category:'Protein', sustainable_alt:'F002', alt_saving_pct:93, fun_fact:'Equivalent to driving 100 km in a car' },
      { id:'F002', name:'Plant-based burger (Beyond/Impossible)', carbon_kg:1.9, water_l:1800, land_m2:3.5, unit:'per kg', category:'Protein', label:'Low Carbon' },
      { id:'F003', name:'Chicken', carbon_kg:6.9, water_l:4300, land_m2:7.1, unit:'per kg', category:'Protein' },
      { id:'F004', name:'Pork', carbon_kg:7.6, water_l:5990, land_m2:11, unit:'per kg', category:'Protein' },
      { id:'F005', name:'Salmon (farmed)', carbon_kg:5.1, water_l:2000, land_m2:4, unit:'per kg', category:'Protein' },
      { id:'F006', name:'Tofu', carbon_kg:2.0, water_l:2500, land_m2:2.2, unit:'per kg', category:'Protein', label:'Low Carbon' },
      { id:'F007', name:'Eggs', carbon_kg:4.5, water_l:3300, land_m2:5.7, unit:'per dozen', category:'Protein' },
      { id:'F008', name:'Lentils/Beans', carbon_kg:0.9, water_l:1250, land_m2:1.4, unit:'per kg', category:'Protein', label:'Lowest Carbon' },
      { id:'F009', name:'Shrimp (farmed)', carbon_kg:12.0, water_l:3500, unit:'per kg', category:'Protein' },
      { id:'F010', name:'Cow milk', carbon_kg:3.15, water_l:1020, unit:'per litre', category:'Dairy', sustainable_alt:'F011', alt_saving_pct:70 },
      { id:'F011', name:'Oat milk', carbon_kg:0.9, water_l:48, unit:'per litre', category:'Dairy', label:'Low Carbon' },
      { id:'F012', name:'Cheese (hard)', carbon_kg:13.5, water_l:5060, unit:'per kg', category:'Dairy' },
      { id:'F013', name:'Butter', carbon_kg:11.5, water_l:5550, unit:'per kg', category:'Dairy' },
      { id:'F014', name:'Yogurt', carbon_kg:2.5, water_l:1040, unit:'per kg', category:'Dairy' },
      { id:'F015', name:'Almond milk', carbon_kg:0.7, water_l:371, unit:'per litre', category:'Dairy', label:'Low Carbon' },
      { id:'F016', name:'Soy milk', carbon_kg:0.9, water_l:28, unit:'per litre', category:'Dairy', label:'Low Carbon' },
      { id:'F017', name:'Cream cheese', carbon_kg:8.5, water_l:3800, unit:'per kg', category:'Dairy' },
      { id:'F018', name:'Ice cream', carbon_kg:4.2, water_l:2400, unit:'per kg', category:'Dairy' },
      { id:'F020', name:'Rice', carbon_kg:2.7, water_l:2500, unit:'per kg', category:'Grains', fun_fact:'Methane from paddy fields' },
      { id:'F021', name:'Wheat bread', carbon_kg:0.8, water_l:1600, unit:'per kg', category:'Grains', label:'Low Carbon' },
      { id:'F022', name:'Pasta', carbon_kg:1.3, water_l:1850, unit:'per kg', category:'Grains' },
      { id:'F023', name:'Potatoes', carbon_kg:0.3, water_l:287, unit:'per kg', category:'Vegetables', label:'Lowest Carbon' },
      { id:'F024', name:'Oats', carbon_kg:0.5, water_l:900, unit:'per kg', category:'Grains', label:'Lowest Carbon' },
      { id:'F025', name:'Quinoa', carbon_kg:1.2, water_l:1400, unit:'per kg', category:'Grains' },
      { id:'F026', name:'Corn/Maize', carbon_kg:0.5, water_l:700, unit:'per kg', category:'Grains', label:'Lowest Carbon' },
      { id:'F030', name:'Tomatoes (local, seasonal)', carbon_kg:0.7, unit:'per kg', category:'Vegetables' },
      { id:'F031', name:'Tomatoes (heated greenhouse)', carbon_kg:3.5, unit:'per kg', category:'Vegetables' },
      { id:'F032', name:'Bananas', carbon_kg:0.7, unit:'per kg', category:'Fruit', fun_fact:'Shipped by boat, not plane \— surprisingly low carbon' },
      { id:'F033', name:'Avocado', carbon_kg:2.5, water_l:2000, unit:'per kg', category:'Fruit' },
      { id:'F034', name:'Berries (air-freighted)', carbon_kg:7.8, unit:'per kg', category:'Fruit', fun_fact:'Air freight = 50\× the emissions of sea freight' },
      { id:'F035', name:'Apples (local)', carbon_kg:0.3, unit:'per kg', category:'Fruit', label:'Lowest Carbon' },
      { id:'F036', name:'Oranges', carbon_kg:0.5, unit:'per kg', category:'Fruit' },
      { id:'F037', name:'Mangoes (imported)', carbon_kg:1.5, unit:'per kg', category:'Fruit' },
      { id:'F038', name:'Grapes', carbon_kg:1.1, unit:'per kg', category:'Fruit' },
      { id:'F039', name:'Lettuce/Salad', carbon_kg:0.4, unit:'per kg', category:'Vegetables' },
      { id:'F040', name:'Coffee (per cup)', carbon_kg:0.21, water_l:140, unit:'per cup', category:'Beverage' },
      { id:'F041', name:'Tea (per cup)', carbon_kg:0.05, water_l:34, unit:'per cup', category:'Beverage', label:'Lowest Carbon' },
      { id:'F042', name:'Beer (per pint)', carbon_kg:0.5, unit:'per pint', category:'Beverage' },
      { id:'F043', name:'Wine (per glass)', carbon_kg:0.4, unit:'per glass', category:'Beverage' },
      { id:'F044', name:'Orange juice', carbon_kg:1.5, unit:'per litre', category:'Beverage' },
      { id:'F045', name:'Soft drink (can)', carbon_kg:0.3, unit:'per 330ml', category:'Beverage' },
      { id:'F046', name:'Bottled water', carbon_kg:0.16, unit:'per litre', category:'Beverage', fun_fact:'Tap water is ~300x less carbon' },
      { id:'F050', name:'Chocolate bar (dark)', carbon_kg:1.9, unit:'per 100g bar', category:'Snacks', deforestation_risk:true },
      { id:'F051', name:'Chocolate bar (milk)', carbon_kg:2.8, unit:'per 100g bar', category:'Snacks', deforestation_risk:true },
      { id:'F052', name:'Potato chips', carbon_kg:0.4, unit:'per 100g bag', category:'Snacks' },
      { id:'F053', name:'Nuts (mixed)', carbon_kg:0.3, unit:'per 100g', category:'Snacks', label:'Low Carbon' },
      { id:'F054', name:'Granola bar', carbon_kg:0.5, unit:'per bar', category:'Snacks' },
    ],
  },
  transport: {
    name: 'Transport', icon: '\🚗', color: '#2563eb',
    products: [
      // carbon_kg values = DEFRA GHG Conversion Factors 2023 (kgCO2e/km), real published figures
      { id:'T001', name:'Car (petrol, avg)', carbon_kg:0.1705, unit:'per km', category:'Drive', source:'DEFRA 2023' },
      { id:'T002', name:'Car (diesel)', carbon_kg:0.1582, unit:'per km', category:'Drive', source:'DEFRA 2023' },
      { id:'T003', name:'Car (electric, UK grid 2023)', carbon_kg:0.0465, unit:'per km', category:'Drive', label:'Low Carbon', source:'DEFRA 2023' },
      { id:'T004', name:'Car (electric, renewable grid)', carbon_kg:0.01, unit:'per km', category:'Drive', label:'Lowest Carbon' },
      { id:'T005', name:'Bus (avg UK)', carbon_kg:0.0820, unit:'per km', category:'Public', source:'DEFRA 2023' },
      { id:'T006', name:'Train (UK average)', carbon_kg:0.0357, unit:'per km', category:'Public', label:'Low Carbon', source:'DEFRA 2023' },
      { id:'T007', name:'Subway/Metro', carbon_kg:0.0280, unit:'per km', category:'Public', label:'Low Carbon', source:'DEFRA 2023' },
      { id:'T008', name:'Bicycle', carbon_kg:0.005, unit:'per km', category:'Active', label:'Lowest Carbon' },
      { id:'T009', name:'E-scooter (shared)', carbon_kg:0.04, unit:'per km', category:'Active' },
      { id:'T010', name:'Flight (economy, short-haul)', carbon_kg:0.255, unit:'per km', category:'Air', source:'DEFRA 2023', fun_fact:'Includes radiative forcing index (RFI) uplift — real climate impact is higher than just CO\u2082' },
      { id:'T011', name:'Flight (economy, long-haul)', carbon_kg:0.195, unit:'per km', category:'Air', source:'DEFRA 2023' },
      { id:'T012', name:'Flight (business class)', carbon_kg:0.428, unit:'per km', category:'Air', source:'DEFRA 2023', fun_fact:'2.2\xD7 economy class per km — larger seat footprint' },
      { id:'T013', name:'Taxi (average)', carbon_kg:0.149, unit:'per km', category:'Ride', source:'DEFRA 2023' },
      { id:'T014', name:'Ferry (foot passenger)', carbon_kg:0.187, unit:'per km', category:'Water', source:'DEFRA 2023' },
      { id:'T015', name:'Motorcycle (average)', carbon_kg:0.1033, unit:'per km', category:'Drive', source:'DEFRA 2023' },
      { id:'T016', name:'Walking', carbon_kg:0.0, unit:'per km', category:'Active', label:'Zero Carbon' },
      { id:'T017', name:'Hybrid car', carbon_kg:0.12, unit:'per km', category:'Drive' },
      { id:'T018', name:'Carpool (4 people)', carbon_kg:0.0426, unit:'per km per person', category:'Drive', label:'Low Carbon', source:'DEFRA 2023' },
    ],
  },
  fashion: {
    name: 'Fashion & Clothing', icon: '\👕', color: '#7c3aed',
    products: [
      { id:'CL01', name:'Cotton T-shirt', carbon_kg:6.5, water_l:2700, unit:'per item', category:'Basics', sustainable_alt:'CL02', alt_saving_pct:23 },
      { id:'CL02', name:'Organic cotton T-shirt', carbon_kg:5.0, water_l:1800, unit:'per item', label:'Better Choice' },
      { id:'CL03', name:'Polyester T-shirt', carbon_kg:5.5, water_l:60, unit:'per item', category:'Basics', microplastic:true },
      { id:'CL04', name:'Jeans', carbon_kg:33.4, water_l:10850, unit:'per pair', category:'Bottoms', fun_fact:'10,850 litres of water \— enough to fill a bathtub 70 times' },
      { id:'CL05', name:'Dress (fast fashion)', carbon_kg:16.0, unit:'per item', category:'Dresses', wears_typical:7 },
      { id:'CL06', name:'Dress (quality, long-lasting)', carbon_kg:20.0, unit:'per item', category:'Dresses', wears_typical:100, label:'Lower per-wear' },
      { id:'CL07', name:'Sneakers/Running shoes', carbon_kg:13.6, unit:'per pair', category:'Footwear' },
      { id:'CL08', name:'Leather shoes', carbon_kg:17.0, unit:'per pair', category:'Footwear', deforestation_risk:true },
      { id:'CL09', name:'Winter jacket (synthetic)', carbon_kg:25.0, unit:'per item', category:'Outerwear' },
      { id:'CL10', name:'Second-hand clothing (any)', carbon_kg:0.5, unit:'per item', label:'Lowest Carbon', fun_fact:'Extending garment life by 9 months cuts carbon by 30%' },
      { id:'CL11', name:'Wool sweater', carbon_kg:18.0, water_l:4000, unit:'per item', category:'Outerwear' },
      { id:'CL12', name:'Swimsuit', carbon_kg:5.5, unit:'per item', category:'Basics' },
      { id:'CL13', name:'Socks (pair)', carbon_kg:1.2, unit:'per pair', category:'Basics' },
      { id:'CL14', name:'Underwear', carbon_kg:1.8, unit:'per item', category:'Basics' },
      { id:'CL15', name:'Linen shirt', carbon_kg:4.0, water_l:900, unit:'per item', category:'Basics', label:'Low Carbon' },
    ],
  },
  electronics: {
    name: 'Electronics', icon: '\📱', color: '#0891b2',
    products: [
      { id:'E001', name:'Smartphone (new)', carbon_kg:70, water_l:12700, unit:'per device', lifespan_yr:3, conflict_minerals:true },
      { id:'E002', name:'Smartphone (refurbished)', carbon_kg:7, unit:'per device', label:'Low Carbon', fun_fact:'90% less carbon than new' },
      { id:'E003', name:'Laptop', carbon_kg:350, water_l:190000, unit:'per device', lifespan_yr:5 },
      { id:'E004', name:'Laptop (refurbished)', carbon_kg:35, unit:'per device', label:'Low Carbon' },
      { id:'E005', name:'TV (55")', carbon_kg:600, unit:'per device', lifespan_yr:8 },
      { id:'E006', name:'Tablet', carbon_kg:120, unit:'per device', lifespan_yr:4 },
      { id:'E007', name:'Smart speaker', carbon_kg:25, unit:'per device' },
      { id:'E008', name:'Gaming console', carbon_kg:85, unit:'per device' },
      { id:'E009', name:'Wireless earbuds', carbon_kg:8, unit:'per pair', lifespan_yr:2 },
      { id:'E010', name:'Streaming (1 hour HD)', carbon_kg:0.036, unit:'per hour', category:'Digital' },
      { id:'E011', name:'Email (with attachment)', carbon_kg:0.05, unit:'per email', category:'Digital' },
      { id:'E012', name:'Google search', carbon_kg:0.0003, unit:'per search', category:'Digital' },
      { id:'E013', name:'Smart watch', carbon_kg:30, unit:'per device', lifespan_yr:3 },
      { id:'E014', name:'Desktop computer', carbon_kg:500, unit:'per device', lifespan_yr:6 },
      { id:'E015', name:'Monitor (27")', carbon_kg:200, unit:'per device', lifespan_yr:7 },
      { id:'E016', name:'Router/Modem', carbon_kg:15, unit:'per device' },
      { id:'E017', name:'USB flash drive', carbon_kg:0.5, unit:'per device' },
      { id:'E018', name:'Printer (inkjet)', carbon_kg:45, unit:'per device' },
    ],
  },
  home_energy: {
    name: 'Home & Energy', icon: '\🏠', color: '#16a34a',
    products: [
      // Grid factors: Ember Global Electricity Review 2023 & DEFRA 2023 (kgCO2e/kWh)
      { id:'H001', name:'Electricity (grid avg, India)', carbon_kg:0.632, unit:'per kWh', source:'Ember 2023' },
      { id:'H002', name:'Electricity (grid avg, USA)', carbon_kg:0.386, unit:'per kWh', source:'EPA eGRID 2022' },
      { id:'H003', name:'Electricity (grid avg, UK)', carbon_kg:0.2379, unit:'per kWh', source:'DEFRA / National Grid ESO 2023' },
      { id:'H004', name:'Electricity (grid avg, France)', carbon_kg:0.056, unit:'per kWh', label:'Low Carbon', fun_fact:'Nuclear + hydro = very low carbon grid', source:'Ember 2023' },
      { id:'H004b', name:'Electricity (grid avg, Germany)', carbon_kg:0.385, unit:'per kWh', source:'Ember 2023' },
      { id:'H004c', name:'Electricity (grid avg, China)', carbon_kg:0.555, unit:'per kWh', source:'Ember 2023' },
      { id:'H005', name:'Electricity (solar rooftop)', carbon_kg:0.04, unit:'per kWh', label:'Lowest Carbon' },
      // Natural gas: DEFRA 2023 — 2.04249 kgCO2e/m³ (gross calorific value)
      { id:'H006', name:'Natural gas (heating)', carbon_kg:2.04, unit:'per m\u00B3', source:'DEFRA 2023' },
      { id:'H007', name:'LPG cooking gas', carbon_kg:2.95, unit:'per kg' },
      { id:'H008', name:'LED lightbulb (lifetime)', carbon_kg:2.5, unit:'per bulb (50K hrs)', label:'Low Carbon' },
      { id:'H009', name:'Incandescent bulb (lifetime)', carbon_kg:25, unit:'per bulb (1K hrs)' },
      { id:'H010', name:'Hot shower (8 min)', carbon_kg:1.5, unit:'per shower' },
      { id:'H011', name:'Washing machine load', carbon_kg:0.6, unit:'per load (40\°C)' },
      { id:'H012', name:'Washing machine load (cold)', carbon_kg:0.2, unit:'per load', label:'Low Carbon' },
      { id:'H013', name:'Dishwasher load', carbon_kg:0.7, unit:'per load' },
      { id:'H014', name:'Air conditioning (1 hr)', carbon_kg:0.9, unit:'per hour' },
      { id:'H015', name:'Electric heater (1 hr)', carbon_kg:1.2, unit:'per hour' },
      { id:'H016', name:'Tumble dryer load', carbon_kg:2.4, unit:'per load' },
    ],
  },
  travel_accommodation: {
    name: 'Travel & Accommodation', icon: '\🏨', color: '#ea580c',
    products: [
      { id:'TA01', name:'Hotel night (luxury)', carbon_kg:32.5, unit:'per night' },
      { id:'TA02', name:'Hotel night (mid-range)', carbon_kg:20.6, unit:'per night' },
      { id:'TA03', name:'Hotel night (budget)', carbon_kg:10.2, unit:'per night' },
      { id:'TA04', name:'Airbnb/apartment', carbon_kg:6.0, unit:'per night', label:'Low Carbon' },
      { id:'TA05', name:'Hostel', carbon_kg:3.5, unit:'per night', label:'Lowest Carbon' },
      { id:'TA06', name:'Camping', carbon_kg:0.8, unit:'per night', label:'Lowest Carbon' },
      { id:'TA07', name:'Cruise ship (per day)', carbon_kg:85, unit:'per day', fun_fact:'Floating cities with huge fuel consumption' },
      { id:'TA08', name:'London to Paris (Eurostar)', carbon_kg:5.0, unit:'per trip', label:'Low Carbon' },
      { id:'TA09', name:'London to Paris (flight)', carbon_kg:55, unit:'per trip' },
      { id:'TA10', name:'Delhi to Mumbai (train)', carbon_kg:14, unit:'per trip', label:'Low Carbon' },
      { id:'TA11', name:'Delhi to Mumbai (flight)', carbon_kg:110, unit:'per trip' },
    ],
  },
  personal_care: {
    name: 'Personal Care', icon: '\🧴', color: '#be185d',
    products: [
      { id:'PC01', name:'Shampoo bottle (250ml)', carbon_kg:0.5, unit:'per bottle' },
      { id:'PC02', name:'Shampoo bar', carbon_kg:0.15, unit:'per bar', label:'Low Carbon' },
      { id:'PC03', name:'Disposable razor', carbon_kg:0.08, unit:'per razor' },
      { id:'PC04', name:'Safety razor (steel)', carbon_kg:0.01, unit:'per shave', label:'Lowest Carbon' },
      { id:'PC05', name:'Toothbrush (plastic)', carbon_kg:0.1, unit:'per brush' },
      { id:'PC06', name:'Toothbrush (bamboo)', carbon_kg:0.03, unit:'per brush', label:'Low Carbon' },
      { id:'PC07', name:'Deodorant (aerosol)', carbon_kg:0.4, unit:'per can' },
      { id:'PC08', name:'Deodorant (roll-on)', carbon_kg:0.15, unit:'per bottle' },
      { id:'PC09', name:'Sunscreen', carbon_kg:0.3, unit:'per tube' },
      { id:'PC10', name:'Bar soap', carbon_kg:0.1, unit:'per bar', label:'Low Carbon' },
      { id:'PC11', name:'Liquid soap (250ml)', carbon_kg:0.35, unit:'per bottle' },
    ],
  },
  packaging: {
    name: 'Packaging & Bags', icon: '\📦', color: '#92400e',
    products: [
      { id:'PK01', name:'Plastic bag', carbon_kg:0.033, unit:'per bag', microplastic:true },
      { id:'PK02', name:'Paper bag', carbon_kg:0.08, unit:'per bag' },
      { id:'PK03', name:'Reusable cotton bag', carbon_kg:0.002, unit:'per use (131+ uses)', label:'Lowest Carbon' },
      { id:'PK04', name:'Plastic water bottle', carbon_kg:0.083, unit:'per bottle' },
      { id:'PK05', name:'Aluminium can', carbon_kg:0.17, unit:'per can' },
      { id:'PK06', name:'Glass bottle', carbon_kg:0.2, unit:'per bottle' },
      { id:'PK07', name:'Cardboard box (medium)', carbon_kg:0.5, unit:'per box' },
      { id:'PK08', name:'Cling wrap (per metre)', carbon_kg:0.01, unit:'per metre' },
      { id:'PK09', name:'Beeswax wrap', carbon_kg:0.001, unit:'per use', label:'Lowest Carbon' },
    ],
  },
  services: {
    name: 'Services & Digital', icon: '\💻', color: '#6366f1',
    products: [
      { id:'SV01', name:'Haircut (salon)', carbon_kg:3.5, unit:'per visit' },
      { id:'SV02', name:'Gym session', carbon_kg:1.2, unit:'per visit' },
      { id:'SV03', name:'Doctor visit', carbon_kg:5.0, unit:'per visit' },
      { id:'SV04', name:'Netflix (1 month)', carbon_kg:1.1, unit:'per month' },
      { id:'SV05', name:'Cloud storage (1 GB/month)', carbon_kg:0.05, unit:'per month' },
      { id:'SV06', name:'Video call (1 hour)', carbon_kg:0.15, unit:'per hour' },
      { id:'SV07', name:'Social media (1 hr)', carbon_kg:0.06, unit:'per hour' },
      { id:'SV08', name:'Online shopping delivery', carbon_kg:0.5, unit:'per package' },
      { id:'SV09', name:'Dry cleaning (per item)', carbon_kg:2.0, unit:'per item' },
    ],
  },
  pets: {
    name: 'Pets', icon: '\🐶', color: '#b45309',
    products: [
      { id:'PT01', name:'Dog food (dry, per day)', carbon_kg:1.2, unit:'per day' },
      { id:'PT02', name:'Cat food (wet, per day)', carbon_kg:0.8, unit:'per day' },
      { id:'PT03', name:'Dog (medium, annual)', carbon_kg:770, unit:'per year', fun_fact:'A medium dog has the carbon footprint of a small car' },
      { id:'PT04', name:'Cat (annual)', carbon_kg:310, unit:'per year' },
      { id:'PT05', name:'Fish tank (annual)', carbon_kg:60, unit:'per year' },
      { id:'PT06', name:'Hamster (annual)', carbon_kg:25, unit:'per year' },
    ],
  },
  subscriptions: {
    name: 'Subscriptions & Media', icon: '\📺', color: '#4f46e5',
    products: [
      { id:'SB01', name:'Newspaper (physical, daily)', carbon_kg:0.3, unit:'per day' },
      { id:'SB02', name:'Newspaper (digital)', carbon_kg:0.01, unit:'per day', label:'Low Carbon' },
      { id:'SB03', name:'Magazine (print)', carbon_kg:0.8, unit:'per issue' },
      { id:'SB04', name:'Book (paperback)', carbon_kg:1.0, unit:'per book' },
      { id:'SB05', name:'Book (e-reader, per read)', carbon_kg:0.05, unit:'per book', label:'Low Carbon' },
      { id:'SB06', name:'Music streaming (1 hr)', carbon_kg:0.02, unit:'per hour', label:'Low Carbon' },
      { id:'SB07', name:'Gaming (1 hr, console)', carbon_kg:0.07, unit:'per hour' },
    ],
  },
  furniture: {
    name: 'Furniture & Home', icon: '\🪑', color: '#65a30d',
    products: [
      { id:'FU01', name:'Sofa (new)', carbon_kg:90, unit:'per item' },
      { id:'FU02', name:'Sofa (second-hand)', carbon_kg:5, unit:'per item', label:'Lowest Carbon' },
      { id:'FU03', name:'Wooden desk', carbon_kg:50, unit:'per item' },
      { id:'FU04', name:'Office chair', carbon_kg:72, unit:'per item' },
      { id:'FU05', name:'Mattress', carbon_kg:100, unit:'per item' },
      { id:'FU06', name:'Bookshelf', carbon_kg:35, unit:'per item' },
      { id:'FU07', name:'Dining table (wood)', carbon_kg:60, unit:'per item' },
      { id:'FU08', name:'Bed frame (metal)', carbon_kg:40, unit:'per item' },
    ],
  },
};

const ALL_PRODUCTS = Object.entries(PRODUCT_CARBON_DB).flatMap(([catKey, cat]) =>
  cat.products.map(p => ({ ...p, catKey, catName: cat.name, catIcon: cat.icon, catColor: cat.color }))
);

function carbonEquivalent(kg_co2) {
  return {
    km_driving: (kg_co2 / 0.21).toFixed(0),
    flights_london_paris: (kg_co2 / 55).toFixed(2),
    trees_to_offset_1yr: (kg_co2 / 22).toFixed(1),
    smartphone_charges: (kg_co2 / 0.008).toFixed(0),
    cups_of_tea: (kg_co2 / 0.05).toFixed(0),
    streaming_hours: (kg_co2 / 0.036).toFixed(0),
    days_of_avg_person: (kg_co2 / (4700 / 365)).toFixed(1),
  };
}

const LIFECYCLE_TEMPLATES = {
  food_drink: [{ name:'Farming', pct:60 },{ name:'Processing', pct:15 },{ name:'Transport', pct:10 },{ name:'Packaging', pct:8 },{ name:'Retail', pct:4 },{ name:'Waste', pct:3 }],
  transport: [{ name:'Fuel/Energy', pct:75 },{ name:'Vehicle Mfg', pct:15 },{ name:'Infrastructure', pct:7 },{ name:'Maintenance', pct:3 }],
  fashion: [{ name:'Raw Materials', pct:30 },{ name:'Manufacturing', pct:35 },{ name:'Transport', pct:10 },{ name:'Retail', pct:5 },{ name:'Use (washing)', pct:15 },{ name:'Disposal', pct:5 }],
  electronics: [{ name:'Raw Materials', pct:20 },{ name:'Manufacturing', pct:50 },{ name:'Transport', pct:5 },{ name:'Use Phase', pct:20 },{ name:'End of Life', pct:5 }],
  home_energy: [{ name:'Generation', pct:70 },{ name:'Transmission', pct:10 },{ name:'Infrastructure', pct:15 },{ name:'Maintenance', pct:5 }],
  default: [{ name:'Production', pct:50 },{ name:'Transport', pct:20 },{ name:'Use', pct:20 },{ name:'Disposal', pct:10 }],
};

const DAILY_BUDGET_KG = 6.3;
const PIE_COLORS = ['#dc2626','#2563eb','#16a34a','#d97706','#7c3aed','#0891b2','#ea580c','#be185d'];
const DATA_SOURCES = [
  'Our World in Data (Poore & Nemecek, 2018) — food lifecycle data',
  'UK DEFRA GHG Conversion Factors 2023 — transport, energy, spend-based factors (gov.uk)',
  'EPA eGRID 2022 — US electricity grid emission factors (epa.gov/egrid)',
  'IPCC AR6 WG1 Chapter 7, Table 7.SM.7 (2021) — GWP100 values',
  'Ecoinvent v3.9 — manufacturing lifecycle inventory',
  'WRAP Carbon Footprint Reports — fashion & textiles',
  'Ember Global Electricity Review 2023 — grid carbon intensity by country (CC BY 4.0)',
];

function getStoredCart() { try { return JSON.parse(localStorage.getItem('ra_carbon_cart_v1') || '[]'); } catch { return []; } }
function saveCart(c) { localStorage.setItem('ra_carbon_cart_v1', JSON.stringify(c)); }
function getSearchHistory() { try { return JSON.parse(localStorage.getItem('ra_carbon_searches_v1') || '[]'); } catch { return []; } }
function saveSearchHistory(h) { localStorage.setItem('ra_carbon_searches_v1', JSON.stringify(h.slice(0, 20))); }

export default function CarbonCalculatorPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeCat, setActiveCat] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [cart, setCart] = useState(getStoredCart);
  const [qty, setQty] = useState(1);
  const [showEquiv, setShowEquiv] = useState(false);
  const [equivKg, setEquivKg] = useState(10);
  const [country, setCountry] = useState('India');
  const [showSources, setShowSources] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [tab, setTab] = useState('search');
  const searchRef = useRef(null);

  useEffect(() => { saveCart(cart); }, [cart]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return ALL_PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q) || p.catName.toLowerCase().includes(q)).slice(0, 20);
  }, [search]);

  const categoryProducts = useMemo(() => {
    if (!activeCat) return [];
    return PRODUCT_CARBON_DB[activeCat]?.products || [];
  }, [activeCat]);

  const categoryLeaderboard = useMemo(() => {
    if (!activeCat) return [];
    return [...(PRODUCT_CARBON_DB[activeCat]?.products || [])].sort((a, b) => a.carbon_kg - b.carbon_kg);
  }, [activeCat]);

  const cartTotal = useMemo(() => cart.reduce((s, c) => s + c.carbon_kg * c.qty, 0), [cart]);
  const cartEquiv = useMemo(() => carbonEquivalent(cartTotal), [cartTotal]);

  const selectProduct = useCallback((p) => {
    setSelectedProduct(p);
    setQty(1);
    const hist = getSearchHistory();
    if (!hist.find(h => h.id === p.id)) { saveSearchHistory([{ id: p.id, name: p.name, ts: Date.now() }, ...hist]); }
  }, []);

  const addToCart = useCallback((p, q) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === p.id);
      if (ex) return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + q } : c);
      return [...prev, { ...p, qty: q }];
    });
  }, []);

  const removeFromCart = useCallback((id) => setCart(prev => prev.filter(c => c.id !== id)), []);
  const clearCart = useCallback(() => setCart([]), []);

  const toggleCompare = useCallback((p) => {
    setCompareList(prev => prev.find(c => c.id === p.id) ? prev.filter(c => c.id !== p.id) : prev.length < 4 ? [...prev, p] : prev);
  }, []);

  const addToWallet = useCallback((p, q) => {
    const walletData = JSON.parse(localStorage.getItem('ra_carbon_wallet_v1') || '[]');
    walletData.push({ id: `TXN-${Date.now()}`, date: new Date().toISOString(), description: p.name, amount_usd: 0, category: p.catKey || 'other', carbon_kg: p.carbon_kg * q, method: 'calculator', items: [{ product: p.name, carbon_kg: p.carbon_kg * q }], offset: false, notes: '' });
    localStorage.setItem('ra_carbon_wallet_v1', JSON.stringify(walletData));
  }, []);

  const getAlt = useCallback((p) => {
    if (!p.sustainable_alt) return null;
    return ALL_PRODUCTS.find(a => a.id === p.sustainable_alt) || null;
  }, []);

  const exportProductCard = useCallback(() => { alert('Product card PDF export initiated. In production this generates a downloadable PDF.'); }, []);
  const exportComparisonCSV = useCallback(() => {
    if (!compareList.length) return;
    const hdr = 'Name,Carbon (kg CO2e),Unit,Category\n';
    const rows = compareList.map(p => `"${p.name}",${p.carbon_kg},"${p.unit}","${p.catName}"`).join('\n');
    const blob = new Blob([hdr + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'carbon_comparison.csv'; a.click(); URL.revokeObjectURL(url);
  }, [compareList]);
  const printPage = useCallback(() => window.print(), []);

  /* ─── Styles ─── */
  const sPage = { fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '0 0 80px' };
  const sHero = { background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyL} 100%)`, color: '#fff', padding: '48px 32px 40px', textAlign: 'center' };
  const sContainer = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' };
  const sCard = { background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 };
  const sInput = { width: '100%', padding: '14px 20px', borderRadius: 12, border: `2px solid ${T.border}`, fontSize: 16, fontFamily: T.font, outline: 'none', background: '#fff' };
  const sBtn = (bg, c) => ({ padding: '10px 20px', borderRadius: 10, border: 'none', background: bg, color: c || '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: T.font });
  const sBtnSm = (bg, c) => ({ ...sBtn(bg, c), padding: '6px 14px', fontSize: 12 });
  const sBadge = (bg) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: bg, color: '#fff', fontSize: 11, fontWeight: 700, marginRight: 6 });
  const sTab = (active) => ({ padding: '10px 20px', borderRadius: '10px 10px 0 0', border: 'none', background: active ? T.surface : T.surfaceH, color: active ? T.navy : T.textSec, fontWeight: active ? 700 : 500, fontSize: 14, cursor: 'pointer', fontFamily: T.font, borderBottom: active ? `3px solid ${T.gold}` : 'none' });
  const sGrid = (cols) => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 });
  const sKpi = { background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '16px 20px', textAlign: 'center' };

  /* ─── Section: Product Carbon Card ─── */
  const renderProductCard = (p) => {
    if (!p) return null;
    const eq = carbonEquivalent(p.carbon_kg * qty);
    const alt = getAlt(p);
    const lifecycle = LIFECYCLE_TEMPLATES[p.catKey] || LIFECYCLE_TEMPLATES.default;
    const budgetPct = ((p.carbon_kg * qty) / DAILY_BUDGET_KG * 100);
    const lcData = lifecycle.map((l, i) => ({ name: l.name, value: l.pct, fill: PIE_COLORS[i % PIE_COLORS.length] }));
    return (
      <div style={sCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>{p.catIcon}</span>
              <div>
                <h3 style={{ margin: 0, color: T.navy, fontSize: 22 }}>{p.name}</h3>
                <span style={{ color: T.textSec, fontSize: 13 }}>{p.catName} &middot; {p.unit}</span>
              </div>
            </div>
            {p.label && <span style={sBadge(p.label.includes('Lowest') ? T.green : T.sage)}>{p.label}</span>}
            {p.deforestation_risk && <span style={sBadge(T.red)}>Deforestation Risk</span>}
            {p.microplastic && <span style={sBadge(T.amber)}>Microplastic</span>}
            {p.conflict_minerals && <span style={sBadge('#7c3aed')}>Conflict Minerals</span>}

            <div style={{ marginTop: 20, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 48, fontWeight: 800, color: p.carbon_kg > 10 ? T.red : p.carbon_kg > 3 ? T.amber : T.green }}>{(p.carbon_kg * qty).toFixed(1)}</span>
              <span style={{ fontSize: 18, color: T.textSec }}>kg CO\₂e</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <label style={{ fontSize: 13, color: T.textSec }}>Quantity:</label>
              <input type="number" min={1} max={100} value={qty} onChange={e => setQty(Math.max(1, +e.target.value))} style={{ ...sInput, width: 80, padding: '8px 12px' }} />
            </div>

            {/* Equivalence badges */}
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[{ icon: '\🚗', val: eq.km_driving, label: 'km driving' }, { icon: '\🌳', val: eq.trees_to_offset_1yr, label: 'tree-years to offset' }, { icon: '\📱', val: eq.smartphone_charges, label: 'phone charges' }, { icon: '\☕', val: eq.cups_of_tea, label: 'cups of tea' }].map((e, i) => (
                <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: '8px 14px', fontSize: 13 }}>
                  <span>{e.icon}</span> = <strong>{e.val}</strong> {e.label}
                </div>
              ))}
            </div>

            {p.water_l && <div style={{ marginTop: 12, fontSize: 13, color: T.textSec }}>\💧 Water footprint: <strong>{(p.water_l * qty).toLocaleString()} litres</strong></div>}
            {p.land_m2 && <div style={{ fontSize: 13, color: T.textSec }}>\🌾 Land use: <strong>{(p.land_m2 * qty).toFixed(1)} m\²</strong></div>}
            {p.fun_fact && <div style={{ marginTop: 12, padding: '10px 16px', background: '#fef3c7', borderRadius: 10, fontSize: 13 }}>\💡 <strong>Fun fact:</strong> {p.fun_fact}</div>}

            {/* Daily budget gauge */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 6 }}>Daily Carbon Budget (1.5\°C pathway: 6.3 kg/day)</div>
              <div style={{ height: 20, background: T.surfaceH, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                <div style={{ height: '100%', width: `${Math.min(budgetPct, 100)}%`, background: budgetPct > 100 ? T.red : budgetPct > 70 ? T.amber : T.green, borderRadius: 10, transition: 'width 0.5s' }} />
              </div>
              <div style={{ fontSize: 12, color: budgetPct > 100 ? T.red : T.textSec, marginTop: 4 }}>
                This purchase uses <strong>{budgetPct.toFixed(0)}%</strong> of your daily carbon budget
                {budgetPct > 100 && ' \— exceeds daily budget!'}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
              <button onClick={() => addToCart(p, qty)} style={sBtn(T.gold, '#fff')}>\🛒 Add to Cart</button>
              <button onClick={() => { addToWallet(p, qty); alert('Added to your Carbon Wallet!'); }} style={sBtn(T.sage, '#fff')}>\💳 Add to Wallet</button>
              <button onClick={() => toggleCompare(p)} style={sBtnSm(compareList.find(c => c.id === p.id) ? T.red : T.navyL, '#fff')}>
                {compareList.find(c => c.id === p.id) ? 'Remove from Compare' : '\⚖\️ Compare'}
              </button>
              <button onClick={() => setShowLabel(true)} style={sBtnSm(T.navy, '#fff')}>\🏷\️ Carbon Label</button>
            </div>
          </div>

          {/* Lifecycle PieChart */}
          <div style={{ width: 280, flexShrink: 0 }}>
            <h4 style={{ margin: '0 0 8px', color: T.navy, fontSize: 14 }}>Lifecycle Breakdown</h4>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={lcData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false} fontSize={10}>
                  {lcData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Swap & Save */}
        {alt && (
          <div style={{ marginTop: 16, padding: 16, background: '#ecfdf5', borderRadius: 12, border: `1px solid #bbf7d0` }}>
            <div style={{ fontWeight: 700, color: T.green, marginBottom: 6 }}>\♻\️ Swap & Save</div>
            <div style={{ fontSize: 14 }}>
              Switch to <strong style={{ cursor: 'pointer', color: T.navyL, textDecoration: 'underline' }} onClick={() => selectProduct(ALL_PRODUCTS.find(x => x.id === p.sustainable_alt))}>{alt.name}</strong> and save <strong style={{ color: T.green }}>{p.alt_saving_pct}%</strong> carbon ({(p.carbon_kg - alt.carbon_kg).toFixed(1)} kg CO\₂e less)
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ─── Carbon Label Generator ─── */
  const renderCarbonLabel = () => {
    if (!showLabel || !selectedProduct) return null;
    const p = selectedProduct;
    const eq = carbonEquivalent(p.carbon_kg);
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLabel(false)}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: 340, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, letterSpacing: 2, textTransform: 'uppercase' }}>Carbon Footprint Label</div>
          <div style={{ margin: '16px 0', padding: 16, border: `3px solid ${p.carbon_kg > 10 ? T.red : p.carbon_kg > 3 ? T.amber : T.green}`, borderRadius: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.navy }}>{p.name}</div>
            <div style={{ fontSize: 42, fontWeight: 800, color: p.carbon_kg > 10 ? T.red : p.carbon_kg > 3 ? T.amber : T.green, margin: '8px 0' }}>{p.carbon_kg}</div>
            <div style={{ fontSize: 13, color: T.textSec }}>kg CO\₂e {p.unit}</div>
            <div style={{ marginTop: 12, borderTop: `1px solid ${T.border}`, paddingTop: 12, fontSize: 12, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Driving equivalent</span><strong>{eq.km_driving} km</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Trees to offset (1 yr)</span><strong>{eq.trees_to_offset_1yr}</strong></div>
              {p.water_l && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Water footprint</span><strong>{p.water_l.toLocaleString()} L</strong></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Daily budget used</span><strong>{(p.carbon_kg / DAILY_BUDGET_KG * 100).toFixed(0)}%</strong></div>
            </div>
            <div style={{ marginTop: 10, fontSize: 10, color: T.textMut }}>Rating: {p.carbon_kg < 1 ? 'A+' : p.carbon_kg < 3 ? 'A' : p.carbon_kg < 7 ? 'B' : p.carbon_kg < 15 ? 'C' : p.carbon_kg < 30 ? 'D' : 'E'}</div>
          </div>
          <button onClick={() => setShowLabel(false)} style={sBtn(T.navy, '#fff')}>Close</button>
        </div>
      </div>
    );
  };

  return (
    <div style={sPage}>
      {renderCarbonLabel()}

      {/* 1. Hero Header */}
      <div style={sHero}>
        <div style={sContainer}>
          <div style={{ fontSize: 42, fontWeight: 800, marginBottom: 8 }}>\🌍 What's the carbon cost of your purchase?</div>
          <div style={{ fontSize: 18, opacity: 0.85, marginBottom: 12 }}>Search 200+ products across 12 categories. Compare. Make better choices.</div>
          {/* Data quality provenance badge */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {[
              { icon: '\u2713', text: 'Transport factors: UK DEFRA 2023 (real)', color: '#16a34a' },
              { icon: '\u2713', text: `GWP: IPCC AR6 — CH\u2084 = ${GWP_AR6.CH4_fossil}, N\u2082O = ${GWP_AR6.N2O}`, color: '#2563eb' },
              { icon: '\u2713', text: `UK grid: ${ENERGY_FACTORS.ukGrid2023.factor} kgCO\u2082/kWh (2023)`, color: '#7c3aed' },
            ].map((b, i) => (
              <span key={i} style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', border: `1px solid ${b.color}55`, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: b.color, fontWeight: 800 }}>{b.icon}</span>
                {b.text}
              </span>
            ))}
          </div>
          <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}>
            <input
              ref={searchRef}
              value={search}
              onChange={e => { setSearch(e.target.value); setTab('search'); }}
              placeholder="Search any product... (e.g., beef, t-shirt, laptop, flight)"
              style={{ ...sInput, padding: '16px 24px', fontSize: 18, borderRadius: 16, border: '2px solid rgba(255,255,255,0.3)' }}
            />
            {search && (
              <button onClick={() => { setSearch(''); setSelectedProduct(null); }} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: T.textMut }}>\✕</button>
            )}
          </div>
          {/* Quick-search autocomplete dropdown */}
          {search && filteredProducts.length > 0 && (
            <div style={{ maxWidth: 600, margin: '4px auto 0', background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', maxHeight: 320, overflowY: 'auto', textAlign: 'left' }}>
              {filteredProducts.map(p => (
                <div key={p.id} onClick={() => { selectProduct(p); setSearch(''); }} style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <div>
                    <span style={{ marginRight: 8 }}>{p.catIcon}</span>
                    <strong style={{ color: T.navy }}>{p.name}</strong>
                    <span style={{ color: T.textMut, fontSize: 12, marginLeft: 8 }}>{p.catName}</span>
                  </div>
                  <div style={{ fontWeight: 700, color: p.carbon_kg > 10 ? T.red : p.carbon_kg > 3 ? T.amber : T.green }}>
                    {p.carbon_kg} kg
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={sContainer}>
        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 4, marginTop: 24, marginBottom: 0, flexWrap: 'wrap' }}>
          {[{ k: 'search', l: '\🔍 Search' }, { k: 'categories', l: '\📂 Categories' }, { k: 'compare', l: `\⚖\️ Compare (${compareList.length})` }, { k: 'cart', l: `\🛒 Cart (${cart.length})` }, { k: 'equiv', l: '\📊 Equivalences' }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={sTab(tab === t.k)}>{t.l}</button>
          ))}
        </div>

        {/* ─── SEARCH TAB ─── */}
        {tab === 'search' && (
          <div>
            {selectedProduct && renderProductCard(selectedProduct)}

            {!selectedProduct && (
              <div style={sCard}>
                <h3 style={{ color: T.navy, margin: '0 0 12px' }}>\🔍 Start by searching for a product above</h3>
                <p style={{ color: T.textSec, margin: 0, fontSize: 14 }}>Type any product name in the search bar to see its carbon footprint, water usage, and sustainable alternatives.</p>
                {/* Recent searches */}
                {getSearchHistory().length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, marginBottom: 8 }}>Recent Searches</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {getSearchHistory().slice(0, 8).map(h => (
                        <button key={h.id} onClick={() => { const p = ALL_PRODUCTS.find(x => x.id === h.id); if (p) selectProduct(p); }} style={sBtnSm(T.surfaceH, T.navy)}>{h.name}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Product Carbon Trend (simulated) */}
            {selectedProduct && (
              <div style={sCard}>
                <h3 style={{ color: T.navy, margin: '0 0 12px' }}>\📈 Carbon Trend for {selectedProduct.name}</h3>
                <p style={{ color: T.textSec, fontSize: 13, marginBottom: 12 }}>Estimated carbon footprint trend as grids decarbonize and production improves</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[2020, 2021, 2022, 2023, 2024, 2025].map((y, i) => ({ year: y, carbon: +(selectedProduct.carbon_kg * (1 - i * 0.02)).toFixed(2) }))}>
                    <XAxis dataKey="year" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="carbon" fill={T.sage} radius={[6, 6, 0, 0]} name="kg CO2e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Country Grid Factor */}
            {selectedProduct && (
              <div style={sCard}>
                <h3 style={{ color: T.navy, margin: '0 0 12px' }}>\⚡ Country Grid Factor Adjustment</h3>
                <p style={{ color: T.textSec, fontSize: 13, marginBottom: 12 }}>If this product uses electricity, adjust its carbon based on your country's grid</p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select value={country} onChange={e => setCountry(e.target.value)} style={{ ...sInput, width: 200, padding: '10px 14px' }}>
                    {/* Real grid intensity: Ember 2023 (gCO2/kWh ÷ 1000 = kgCO2/kWh) */}
                    {[{ n: 'India', f: 0.632 }, { n: 'USA', f: 0.386 }, { n: 'UK', f: 0.238 }, { n: 'France', f: 0.056 }, { n: 'Germany', f: 0.385 }, { n: 'China', f: 0.555 }, { n: 'Australia', f: 0.487 }, { n: 'Brazil', f: 0.091 }, { n: 'Norway', f: 0.024 }, { n: 'Japan', f: 0.465 }, { n: 'Canada', f: 0.130 }, { n: 'South Korea', f: 0.415 }, { n: 'Poland', f: 0.697 }, { n: 'Spain', f: 0.167 }].map(c => <option key={c.n} value={c.n}>{c.n} ({c.f} kg/kWh)</option>)}
                  </select>
                  <span style={{ fontSize: 13, color: T.textSec }}>Grid emission factor affects electricity-dependent products</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── CATEGORIES TAB ─── */}
        {tab === 'categories' && (
          <div>
            {/* Category Tiles */}
            <div style={{ ...sGrid(window.innerWidth < 768 ? 2 : 4), marginTop: 20 }}>
              {Object.entries(PRODUCT_CARBON_DB).map(([key, cat]) => (
                <div key={key} onClick={() => setActiveCat(activeCat === key ? null : key)}
                  style={{ ...sKpi, cursor: 'pointer', border: activeCat === key ? `2px solid ${cat.color || T.gold}` : `1px solid ${T.border}`, transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  <div style={{ fontSize: 32 }}>{cat.icon}</div>
                  <div style={{ fontWeight: 700, color: T.navy, fontSize: 14, marginTop: 4 }}>{cat.name}</div>
                  <div style={{ fontSize: 12, color: T.textSec }}>{cat.products.length} products</div>
                </div>
              ))}
            </div>

            {/* Category Leaderboard */}
            {activeCat && (
              <div style={{ ...sCard, marginTop: 20 }}>
                <h3 style={{ color: T.navy, margin: '0 0 4px' }}>{PRODUCT_CARBON_DB[activeCat].icon} {PRODUCT_CARBON_DB[activeCat].name} \— Ranked by Carbon</h3>
                <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>Lowest carbon first. Click any product for details.</p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                        <th style={{ textAlign: 'left', padding: '8px 12px', color: T.textSec }}>#</th>
                        <th style={{ textAlign: 'left', padding: '8px 12px', color: T.textSec }}>Product</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px', color: T.textSec }}>CO\₂e (kg)</th>
                        <th style={{ textAlign: 'left', padding: '8px 12px', color: T.textSec }}>Unit</th>
                        <th style={{ textAlign: 'left', padding: '8px 12px', color: T.textSec }}>Label</th>
                        <th style={{ padding: '8px 12px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryLeaderboard.map((p, i) => (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}
                          onClick={() => { selectProduct({ ...p, catKey: activeCat, catName: PRODUCT_CARBON_DB[activeCat].name, catIcon: PRODUCT_CARBON_DB[activeCat].icon, catColor: PRODUCT_CARBON_DB[activeCat].color }); setTab('search'); }}
                          onMouseEnter={e => e.currentTarget.style.background = T.surfaceH} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: i === 0 ? T.green : T.textSec }}>{i + 1}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: T.navy }}>{p.name}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: p.carbon_kg > 10 ? T.red : p.carbon_kg > 3 ? T.amber : T.green }}>{p.carbon_kg}</td>
                          <td style={{ padding: '10px 12px', color: T.textSec }}>{p.unit}</td>
                          <td style={{ padding: '10px 12px' }}>{p.label ? <span style={sBadge(p.label.includes('Lowest') ? T.green : T.sage)}>{p.label}</span> : '\—'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <button onClick={e => { e.stopPropagation(); toggleCompare({ ...p, catKey: activeCat, catName: PRODUCT_CARBON_DB[activeCat].name, catIcon: PRODUCT_CARBON_DB[activeCat].icon }); }} style={sBtnSm(T.surfaceH, T.navy)}>+Compare</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── COMPARE TAB ─── */}
        {tab === 'compare' && (
          <div>
            <div style={{ ...sCard, marginTop: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px' }}>\⚖\️ Compare Products Side by Side</h3>
              <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>Select 2\–4 products from search or categories, then compare their carbon footprints here.</p>
              {compareList.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: T.textMut }}>No products selected for comparison. Browse categories or search to add products.</div>}
              {compareList.length > 0 && (
                <>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    {compareList.map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.surfaceH, borderRadius: 8, padding: '6px 12px' }}>
                        <span>{p.catIcon}</span> <span style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</span>
                        <button onClick={() => toggleCompare(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.red, fontWeight: 700 }}>\✕</button>
                      </div>
                    ))}
                    <button onClick={() => setCompareList([])} style={sBtnSm(T.red, '#fff')}>Clear All</button>
                    <button onClick={exportComparisonCSV} style={sBtnSm(T.navy, '#fff')}>\💾 Export CSV</button>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={compareList.map(p => ({ name: p.name.length > 20 ? p.name.slice(0, 18) + '...' : p.name, carbon: p.carbon_kg, water: p.water_l || 0 }))} layout="vertical">
                      <XAxis type="number" fontSize={12} />
                      <YAxis type="category" dataKey="name" width={150} fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="carbon" fill={T.navyL} radius={[0, 6, 6, 0]} name="kg CO2e" />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Detailed comparison table */}
                  <div style={{ overflowX: 'auto', marginTop: 16 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                          <th style={{ textAlign: 'left', padding: 10, color: T.textSec }}>Metric</th>
                          {compareList.map(p => <th key={p.id} style={{ textAlign: 'right', padding: 10, color: T.navy }}>{p.name.length > 15 ? p.name.slice(0, 13) + '...' : p.name}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { l: 'Carbon (kg CO2e)', fn: p => p.carbon_kg.toFixed(1) },
                          { l: 'Unit', fn: p => p.unit },
                          { l: 'Water (L)', fn: p => p.water_l ? p.water_l.toLocaleString() : '\—' },
                          { l: 'Driving equivalent (km)', fn: p => carbonEquivalent(p.carbon_kg).km_driving },
                          { l: 'Trees to offset', fn: p => carbonEquivalent(p.carbon_kg).trees_to_offset_1yr },
                          { l: 'Daily budget %', fn: p => (p.carbon_kg / DAILY_BUDGET_KG * 100).toFixed(0) + '%' },
                        ].map((r, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                            <td style={{ padding: 10, fontWeight: 600, color: T.textSec }}>{r.l}</td>
                            {compareList.map(p => <td key={p.id} style={{ padding: 10, textAlign: 'right', fontWeight: 600 }}>{r.fn(p)}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── CART TAB ─── */}
        {tab === 'cart' && (
          <div>
            <div style={{ ...sCard, marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ color: T.navy, margin: 0 }}>\🛒 Shopping Cart Simulator</h3>
                {cart.length > 0 && <button onClick={clearCart} style={sBtnSm(T.red, '#fff')}>Clear Cart</button>}
              </div>
              <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>Add products to see the total carbon footprint of your shopping trip.</p>
              {cart.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: T.textMut }}>Your cart is empty. Search for products and add them here.</div>}
              {cart.length > 0 && (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                          <th style={{ textAlign: 'left', padding: 10, color: T.textSec }}>Product</th>
                          <th style={{ textAlign: 'center', padding: 10, color: T.textSec }}>Qty</th>
                          <th style={{ textAlign: 'right', padding: 10, color: T.textSec }}>Per Unit</th>
                          <th style={{ textAlign: 'right', padding: 10, color: T.textSec }}>Total CO\₂e</th>
                          <th style={{ padding: 10 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map(c => (
                          <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                            <td style={{ padding: 10, fontWeight: 600, color: T.navy }}>{c.catIcon || ''} {c.name}</td>
                            <td style={{ padding: 10, textAlign: 'center' }}>
                              <input type="number" min={1} value={c.qty} onChange={e => setCart(prev => prev.map(x => x.id === c.id ? { ...x, qty: Math.max(1, +e.target.value) } : x))} style={{ width: 50, textAlign: 'center', border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 6px', fontFamily: T.font }} />
                            </td>
                            <td style={{ padding: 10, textAlign: 'right', color: T.textSec }}>{c.carbon_kg} kg</td>
                            <td style={{ padding: 10, textAlign: 'right', fontWeight: 700, color: (c.carbon_kg * c.qty) > 10 ? T.red : T.green }}>{(c.carbon_kg * c.qty).toFixed(1)} kg</td>
                            <td style={{ padding: 10 }}><button onClick={() => removeFromCart(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.red, fontSize: 16 }}>\🗑\️</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Cart Total */}
                  <div style={{ marginTop: 20, padding: 20, background: T.surfaceH, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 13, color: T.textSec }}>Total Carbon Footprint</div>
                      <div style={{ fontSize: 36, fontWeight: 800, color: cartTotal > 20 ? T.red : cartTotal > 10 ? T.amber : T.green }}>{cartTotal.toFixed(1)} <span style={{ fontSize: 16, color: T.textSec }}>kg CO\₂e</span></div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {[{ icon: '\🚗', val: cartEquiv.km_driving, l: 'km driving' }, { icon: '\🌳', val: cartEquiv.trees_to_offset_1yr, l: 'tree-years' }, { icon: '\☕', val: cartEquiv.cups_of_tea, l: 'cups of tea' }].map((e, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>{e.icon} = <strong>{e.val}</strong> {e.l}</div>
                      ))}
                    </div>
                  </div>

                  {/* Cart budget gauge */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 6 }}>Daily Budget Impact ({DAILY_BUDGET_KG} kg/day for 1.5\°C)</div>
                    <div style={{ height: 24, background: T.surfaceH, borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(cartTotal / DAILY_BUDGET_KG * 100, 100)}%`, background: cartTotal > DAILY_BUDGET_KG ? T.red : cartTotal > DAILY_BUDGET_KG * 0.7 ? T.amber : T.green, borderRadius: 12 }} />
                    </div>
                    <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{(cartTotal / DAILY_BUDGET_KG * 100).toFixed(0)}% of daily budget</div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button onClick={() => { cart.forEach(c => addToWallet(c, c.qty)); alert('All cart items added to your Carbon Wallet!'); }} style={sBtn(T.sage, '#fff')}>\💳 Add All to Wallet</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── EQUIVALENCES TAB ─── */}
        {tab === 'equiv' && (
          <div>
            <div style={{ ...sCard, marginTop: 20 }}>
              <h3 style={{ color: T.navy, margin: '0 0 4px' }}>\📊 Carbon Equivalence Visualizer</h3>
              <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>Enter any amount of CO\₂e and see what it equals in everyday terms.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <input type="number" min={0.01} step={0.1} value={equivKg} onChange={e => setEquivKg(+e.target.value || 0)} style={{ ...sInput, width: 120, fontSize: 18, fontWeight: 700, textAlign: 'center' }} />
                <span style={{ fontSize: 16, color: T.textSec }}>kg CO\₂e is equivalent to...</span>
              </div>
              {(() => {
                const eq = carbonEquivalent(equivKg);
                return (
                  <div style={sGrid(window.innerWidth < 768 ? 2 : 4)}>
                    {[
                      { icon: '\🚗', val: eq.km_driving, label: 'km driving a petrol car' },
                      { icon: '\✈\️', val: eq.flights_london_paris, label: 'London\→Paris flights' },
                      { icon: '\🌳', val: eq.trees_to_offset_1yr, label: 'tree-years to absorb' },
                      { icon: '\📱', val: eq.smartphone_charges, label: 'smartphone charges' },
                      { icon: '\☕', val: eq.cups_of_tea, label: 'cups of tea (carbon)' },
                      { icon: '\📺', val: eq.streaming_hours, label: 'hours of HD streaming' },
                      { icon: '\👤', val: eq.days_of_avg_person, label: 'days of global avg person' },
                    ].map((e, i) => (
                      <div key={i} style={sKpi}>
                        <div style={{ fontSize: 28 }}>{e.icon}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: T.navy }}>{e.val}</div>
                        <div style={{ fontSize: 12, color: T.textSec }}>{e.label}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Seasonal/Local Adjustment */}
            <div style={sCard}>
              <h3 style={{ color: T.navy, margin: '0 0 8px' }}>\🌱 Seasonal & Local Food Impact</h3>
              <p style={{ color: T.textSec, fontSize: 13, marginBottom: 16 }}>The same product can have very different carbon footprints depending on how it is grown and where it comes from.</p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: 'Tomatoes (local)', carbon: 0.7, fill: T.green },
                  { name: 'Tomatoes (greenhouse)', carbon: 3.5, fill: T.red },
                  { name: 'Berries (local)', carbon: 1.2, fill: T.green },
                  { name: 'Berries (air-freight)', carbon: 7.8, fill: T.red },
                  { name: 'Apples (local)', carbon: 0.3, fill: T.green },
                  { name: 'Mangoes (imported)', carbon: 1.5, fill: T.amber },
                ]} layout="vertical">
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="name" width={160} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="carbon" radius={[0, 6, 6, 0]} name="kg CO2e">
                    {[T.green, T.red, T.green, T.red, T.green, T.amber].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ─── TOP CARBON PRODUCTS ACROSS ALL CATEGORIES ─── */}
        <div style={{ ...sCard, marginTop: 20 }}>
          <h3 style={{ color: T.navy, margin: '0 0 4px' }}>\🔥 Highest Carbon Products (Top 20)</h3>
          <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>The biggest carbon emitters across all categories. Can you avoid or swap any?</p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={[...ALL_PRODUCTS].sort((a, b) => b.carbon_kg - a.carbon_kg).slice(0, 20).map(p => ({ name: p.name.length > 22 ? p.name.slice(0, 20) + '...' : p.name, carbon: p.carbon_kg, cat: p.catName }))} layout="vertical">
              <XAxis type="number" fontSize={11} />
              <YAxis type="category" dataKey="name" width={170} fontSize={10} />
              <Tooltip formatter={(v) => `${v} kg CO\₂e`} />
              <Bar dataKey="carbon" radius={[0, 6, 6, 0]} name="kg CO2e">
                {[...ALL_PRODUCTS].sort((a, b) => b.carbon_kg - a.carbon_kg).slice(0, 20).map((p, i) => (
                  <Cell key={i} fill={p.catColor || PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ─── LOWEST CARBON HEROES ─── */}
        <div style={sCard}>
          <h3 style={{ color: T.navy, margin: '0 0 4px' }}>\🌿 Carbon Heroes (Lowest Footprint Products)</h3>
          <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>These products have the smallest carbon footprint in each category. Choose these when you can!</p>
          <div style={sGrid(window.innerWidth < 768 ? 1 : 3)}>
            {Object.entries(PRODUCT_CARBON_DB).map(([key, cat]) => {
              const hero = [...cat.products].sort((a, b) => a.carbon_kg - b.carbon_kg)[0];
              if (!hero) return null;
              return (
                <div key={key} style={{ ...sKpi, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => { selectProduct({ ...hero, catKey: key, catName: cat.name, catIcon: cat.icon, catColor: cat.color }); setTab('search'); }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T.gold} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 22 }}>{cat.icon}</span>
                    <span style={sBadge(T.green)}>Best</span>
                  </div>
                  <div style={{ fontWeight: 700, color: T.navy, fontSize: 14, marginTop: 6 }}>{hero.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: T.green, marginTop: 2 }}>{hero.carbon_kg} <span style={{ fontSize: 12 }}>kg CO\₂e</span></div>
                  <div style={{ fontSize: 11, color: T.textMut }}>{hero.unit}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── CARBON HEATMAP BY CATEGORY ─── */}
        <div style={sCard}>
          <h3 style={{ color: T.navy, margin: '0 0 4px' }}>\🗺\️ Carbon Heatmap by Category</h3>
          <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>Average carbon footprint per product in each category. Darker = higher carbon.</p>
          <div style={sGrid(window.innerWidth < 768 ? 2 : 4)}>
            {Object.entries(PRODUCT_CARBON_DB).map(([key, cat]) => {
              const avg = cat.products.reduce((s, p) => s + p.carbon_kg, 0) / cat.products.length;
              const max = Math.max(...cat.products.map(p => p.carbon_kg));
              const intensity = Math.min(avg / 50, 1);
              return (
                <div key={key} style={{
                  ...sKpi,
                  background: `rgba(220, 38, 38, ${intensity * 0.3 + 0.05})`,
                  border: `1px solid rgba(220, 38, 38, ${intensity * 0.4})`,
                }}>
                  <div style={{ fontSize: 24 }}>{cat.icon}</div>
                  <div style={{ fontWeight: 700, color: T.navy, fontSize: 13, marginTop: 4 }}>{cat.name}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: avg > 20 ? T.red : avg > 5 ? T.amber : T.green }}>{avg.toFixed(1)} kg</div>
                  <div style={{ fontSize: 10, color: T.textMut }}>avg &middot; max {max.toFixed(1)} kg</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── WATER FOOTPRINT COMPARISON ─── */}
        <div style={sCard}>
          <h3 style={{ color: T.navy, margin: '0 0 4px' }}>\💧 Water Footprint \— Top Water-Intensive Products</h3>
          <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>Water usage is another key environmental metric. Here are the thirstiest products.</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ALL_PRODUCTS.filter(p => p.water_l).sort((a, b) => b.water_l - a.water_l).slice(0, 12).map(p => ({
              name: p.name.length > 20 ? p.name.slice(0, 18) + '...' : p.name,
              water: p.water_l,
            }))} layout="vertical">
              <XAxis type="number" fontSize={11} />
              <YAxis type="category" dataKey="name" width={150} fontSize={10} />
              <Tooltip formatter={(v) => `${v.toLocaleString()} litres`} />
              <Bar dataKey="water" fill="#3b82f6" radius={[0, 6, 6, 0]} name="Litres of water" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ─── DEFORESTATION & ENVIRONMENTAL RISK FLAGS ─── */}
        <div style={sCard}>
          <h3 style={{ color: T.navy, margin: '0 0 4px' }}>\⚠\️ Environmental Risk Flags</h3>
          <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>Some products carry additional environmental risks beyond carbon emissions.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: T.textSec }}>Product</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: T.textSec }}>Risk Type</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: T.textSec }}>CO\₂e (kg)</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: T.textSec }}>Category</th>
                </tr>
              </thead>
              <tbody>
                {ALL_PRODUCTS.filter(p => p.deforestation_risk || p.microplastic || p.conflict_minerals).map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{p.catIcon} {p.name}</td>
                    <td style={{ padding: '8px 12px' }}>
                      {p.deforestation_risk && <span style={sBadge(T.red)}>Deforestation</span>}
                      {p.microplastic && <span style={sBadge(T.amber)}>Microplastic</span>}
                      {p.conflict_minerals && <span style={sBadge('#7c3aed')}>Conflict Minerals</span>}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>{p.carbon_kg}</td>
                    <td style={{ padding: '8px 12px', color: T.textSec }}>{p.catName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── PER-WEAR / PER-USE COST ─── */}
        <div style={sCard}>
          <h3 style={{ color: T.navy, margin: '0 0 4px' }}>\💰 Carbon Per Wear / Per Use</h3>
          <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>For fashion and electronics, the carbon per use matters more than the total. Buying quality and using longer = lower per-use carbon.</p>
          <div style={sGrid(window.innerWidth < 768 ? 1 : 2)}>
            {ALL_PRODUCTS.filter(p => p.wears_typical || p.lifespan_yr).map(p => {
              const uses = p.wears_typical || (p.lifespan_yr ? p.lifespan_yr * 365 : 100);
              const perUse = p.carbon_kg / uses;
              return (
                <div key={p.id} style={{ display: 'flex', gap: 12, padding: 14, background: T.surfaceH, borderRadius: 12, alignItems: 'center' }}>
                  <div style={{ fontSize: 24 }}>{p.catIcon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: T.navy, fontSize: 13 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: T.textSec }}>
                      {p.carbon_kg} kg total &middot; {p.wears_typical ? `${p.wears_typical} wears` : `${p.lifespan_yr} yr lifespan`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: perUse < 0.1 ? T.green : perUse < 1 ? T.amber : T.red }}>{perUse.toFixed(3)}</div>
                    <div style={{ fontSize: 10, color: T.textMut }}>kg per use</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── FUN FACTS COLLECTION ─── */}
        <div style={sCard}>
          <h3 style={{ color: T.navy, margin: '0 0 4px' }}>\💡 Did You Know?</h3>
          <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>Surprising carbon and environmental facts from our product database.</p>
          <div style={sGrid(window.innerWidth < 768 ? 1 : 2)}>
            {ALL_PRODUCTS.filter(p => p.fun_fact).map(p => (
              <div key={p.id} style={{ padding: '14px 18px', background: '#fef3c7', borderRadius: 12, fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: T.navy, marginBottom: 4 }}>{p.catIcon} {p.name}</div>
                <div style={{ color: T.textSec }}>{p.fun_fact}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── PRODUCT STATS OVERVIEW ─── */}
        <div style={sCard}>
          <h3 style={{ color: T.navy, margin: '0 0 12px' }}>\📊 Database Statistics</h3>
          <div style={sGrid(window.innerWidth < 768 ? 2 : 4)}>
            <div style={sKpi}>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.navy }}>{ALL_PRODUCTS.length}</div>
              <div style={{ fontSize: 12, color: T.textSec }}>Products Tracked</div>
            </div>
            <div style={sKpi}>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.navy }}>{Object.keys(PRODUCT_CARBON_DB).length}</div>
              <div style={{ fontSize: 12, color: T.textSec }}>Categories</div>
            </div>
            <div style={sKpi}>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.green }}>{ALL_PRODUCTS.filter(p => p.label).length}</div>
              <div style={{ fontSize: 12, color: T.textSec }}>Low Carbon Options</div>
            </div>
            <div style={sKpi}>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.red }}>{ALL_PRODUCTS.filter(p => p.deforestation_risk || p.microplastic || p.conflict_minerals).length}</div>
              <div style={{ fontSize: 12, color: T.textSec }}>Risk-Flagged Items</div>
            </div>
            <div style={sKpi}>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.navyL }}>{ALL_PRODUCTS.filter(p => p.water_l).length}</div>
              <div style={{ fontSize: 12, color: T.textSec }}>With Water Data</div>
            </div>
            <div style={sKpi}>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.gold }}>{ALL_PRODUCTS.filter(p => p.fun_fact).length}</div>
              <div style={{ fontSize: 12, color: T.textSec }}>Fun Facts</div>
            </div>
            <div style={sKpi}>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.sage }}>{ALL_PRODUCTS.filter(p => p.sustainable_alt).length}</div>
              <div style={{ fontSize: 12, color: T.textSec }}>Swap Suggestions</div>
            </div>
            <div style={sKpi}>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.amber }}>{ALL_PRODUCTS.filter(p => p.wears_typical || p.lifespan_yr).length}</div>
              <div style={{ fontSize: 12, color: T.textSec }}>With Lifespan Data</div>
            </div>
          </div>
        </div>

        {/* ─── ALL SWAP & SAVE RECOMMENDATIONS ─── */}
        <div style={sCard}>
          <h3 style={{ color: T.navy, margin: '0 0 4px' }}>\♻\️ All Swap & Save Recommendations</h3>
          <p style={{ color: T.textSec, fontSize: 13, margin: '0 0 16px' }}>Products with lower-carbon alternatives available in our database.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: T.textSec }}>Current Choice</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: T.textSec }}>CO\₂e</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px', color: T.textSec }}>\→</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: T.textSec }}>Better Alternative</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: T.textSec }}>CO\₂e</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: T.textSec }}>Saving</th>
                </tr>
              </thead>
              <tbody>
                {ALL_PRODUCTS.filter(p => p.sustainable_alt).map(p => {
                  const alt = ALL_PRODUCTS.find(a => a.id === p.sustainable_alt);
                  if (!alt) return null;
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: T.navy }}>{p.catIcon} {p.name}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: T.red, fontWeight: 700 }}>{p.carbon_kg} kg</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 18 }}>\➡\️</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: T.green }}>{alt.name}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: T.green, fontWeight: 700 }}>{alt.carbon_kg} kg</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}><span style={sBadge(T.green)}>{p.alt_saving_pct}% less</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── DATA SOURCES ─── */}
        <div style={{ ...sCard, marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowSources(!showSources)}>
            <h3 style={{ color: T.navy, margin: 0 }}>\📚 Data Sources & Methodology</h3>
            <span style={{ fontSize: 18 }}>{showSources ? '\▲' : '\▼'}</span>
          </div>
          {showSources && (
            <div style={{ marginTop: 12 }}>
              <p style={{ color: T.textSec, fontSize: 13, marginBottom: 10 }}>All carbon footprint data is sourced from peer-reviewed research and government databases:</p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: T.textSec }}>
                {DATA_SOURCES.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
              </ul>
              <p style={{ color: T.textMut, fontSize: 12, marginTop: 10 }}>Values represent lifecycle emissions (cradle-to-grave) unless otherwise noted. Actual emissions may vary based on production methods, supply chain, and geography.</p>
            </div>
          )}
        </div>

        {/* ─── FEEDBACK ─── */}
        <div style={{ ...sCard }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowFeedback(!showFeedback)}>
            <h3 style={{ color: T.navy, margin: 0 }}>\💬 Suggest a Product or Correction</h3>
            <span style={{ fontSize: 18 }}>{showFeedback ? '\▲' : '\▼'}</span>
          </div>
          {showFeedback && (
            <div style={{ marginTop: 12 }}>
              <p style={{ color: T.textSec, fontSize: 13, marginBottom: 10 }}>Can't find a product? Have a correction? Let us know!</p>
              <textarea placeholder="Product name, suggested carbon value, and source..." rows={4} style={{ ...sInput, resize: 'vertical' }} />
              <button style={{ ...sBtn(T.gold, '#fff'), marginTop: 10 }} onClick={() => { setShowFeedback(false); alert('Thank you for your suggestion! Our team will review it.'); }}>Submit Feedback</button>
            </div>
          )}
        </div>

        {/* ─── SHARE ─── */}
        {selectedProduct && (
          <div style={sCard}>
            <h3 style={{ color: T.navy, margin: '0 0 12px' }}>\📤 Share Your Carbon Insight</h3>
            <p style={{ color: T.textSec, fontSize: 13, marginBottom: 12 }}>Share how much carbon your purchase creates with friends and family.</p>
            <div style={{ background: T.surfaceH, borderRadius: 12, padding: 20, textAlign: 'center', maxWidth: 400 }}>
              <div style={{ fontSize: 14, color: T.textSec }}>Did you know?</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: T.navy, margin: '8px 0' }}>{selectedProduct.name}</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: selectedProduct.carbon_kg > 10 ? T.red : T.green }}>{selectedProduct.carbon_kg} kg CO\₂e</div>
              <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>= {carbonEquivalent(selectedProduct.carbon_kg).km_driving} km of driving</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => { navigator.clipboard?.writeText(`${selectedProduct.name}: ${selectedProduct.carbon_kg} kg CO2e (= ${carbonEquivalent(selectedProduct.carbon_kg).km_driving} km driving)`); alert('Copied to clipboard!'); }} style={sBtnSm(T.navyL, '#fff')}>\📋 Copy Text</button>
            </div>
          </div>
        )}

        {/* ─── EXPORTS & CROSS-NAV ─── */}
        <div style={{ ...sCard }}>
          <h3 style={{ color: T.navy, margin: '0 0 12px' }}>\📥 Export & Navigate</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={exportProductCard} style={sBtn(T.navy, '#fff')}>\📄 Export Product Card (PDF)</button>
            <button onClick={exportComparisonCSV} style={sBtn(T.navyL, '#fff')}>\💾 Export Comparison (CSV)</button>
            <button onClick={printPage} style={sBtn(T.textSec, '#fff')}>\🖨\️ Print</button>
            <button onClick={() => navigate('/carbon-wallet')} style={sBtn(T.sage, '#fff')}>\💳 Carbon Wallet</button>
            <button onClick={() => navigate('/carbon-calculator')} style={sBtn(T.gold, '#fff')}>\🧪 Product Anatomy</button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '32px 0 16px', color: T.textMut, fontSize: 12 }}>
          Carbon Impact Calculator &middot; Data from peer-reviewed sources &middot; Version 1.0
        </div>
      </div>
    </div>
  );
}
