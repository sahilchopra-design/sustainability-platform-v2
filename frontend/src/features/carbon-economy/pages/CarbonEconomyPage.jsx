import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

/* ── Data ──────────────────────────────────────────────────────────── */
const CARBON_PRICE_TAGS = {
  daily_activities: [
    { activity: 'Morning coffee', carbon_kg: 0.21, money_cost: 4.50, carbon_price_at_51: 0.011, frequency: 'daily', annual_carbon: 77 },
    { activity: 'Drive to work (20km)', carbon_kg: 4.2, money_cost: 3.50, carbon_price_at_51: 0.214, frequency: 'daily (weekdays)', annual_carbon: 1092 },
    { activity: 'Train commute (20km)', carbon_kg: 0.82, money_cost: 5.00, carbon_price_at_51: 0.042, frequency: 'daily (weekdays)', annual_carbon: 213 },
    { activity: 'Lunch (burger + fries)', carbon_kg: 3.8, money_cost: 12.00, carbon_price_at_51: 0.194, frequency: 'daily', annual_carbon: 1387 },
    { activity: 'Lunch (vegetarian)', carbon_kg: 0.9, money_cost: 10.00, carbon_price_at_51: 0.046, frequency: 'daily', annual_carbon: 329 },
    { activity: 'Netflix (2 hours)', carbon_kg: 0.072, money_cost: 0.50, carbon_price_at_51: 0.004, frequency: 'daily', annual_carbon: 26 },
    { activity: 'Hot shower (8 min)', carbon_kg: 1.5, money_cost: 0.30, carbon_price_at_51: 0.077, frequency: 'daily', annual_carbon: 548 },
    { activity: 'Washing machine load', carbon_kg: 0.6, money_cost: 0.20, carbon_price_at_51: 0.031, frequency: '3x weekly', annual_carbon: 94 },
  ],
  weekly_activities: [
    { activity: 'Weekly grocery shop', carbon_kg: 15.0, money_cost: 100, annual_carbon: 780, frequency: 'weekly' },
    { activity: 'Fill up car (50L petrol)', carbon_kg: 115.5, money_cost: 75, annual_carbon: 6006, frequency: 'weekly' },
    { activity: 'New clothing item (fast fashion)', carbon_kg: 12.0, money_cost: 30, annual_carbon: 624, frequency: 'weekly' },
  ],
  annual_activities: [
    { activity: 'Return flight London to NYC', carbon_kg: 1100, money_cost: 600, carbon_price_at_51: 56.1 },
    { activity: 'New smartphone', carbon_kg: 70, money_cost: 999, carbon_price_at_51: 3.57 },
    { activity: 'New laptop', carbon_kg: 350, money_cost: 1200, carbon_price_at_51: 17.85 },
    { activity: 'Year of driving (15,000 km)', carbon_kg: 3150, money_cost: 2500, carbon_price_at_51: 160.65 },
    { activity: 'Year of vegan diet', carbon_kg: 580, money_cost: 4000, carbon_price_at_51: 29.58 },
    { activity: 'Year of avg Western diet', carbon_kg: 2500, money_cost: 5000, carbon_price_at_51: 127.5 },
  ],
};

const COUNTRY_FOOTPRINTS = [
  { country: 'USA', per_capita_t: 15.5, breakdown: { transport: 29, home_energy: 25, food: 18, goods: 15, services: 13 } },
  { country: 'UK', per_capita_t: 5.6, breakdown: { transport: 22, home_energy: 28, food: 20, goods: 18, services: 12 } },
  { country: 'India', per_capita_t: 1.9, breakdown: { transport: 12, home_energy: 35, food: 28, goods: 15, services: 10 } },
  { country: 'Germany', per_capita_t: 8.1, breakdown: { transport: 20, home_energy: 30, food: 18, goods: 18, services: 14 } },
  { country: 'China', per_capita_t: 7.4, breakdown: { transport: 15, home_energy: 35, food: 16, goods: 22, services: 12 } },
  { country: 'Japan', per_capita_t: 8.5, breakdown: { transport: 18, home_energy: 32, food: 20, goods: 18, services: 12 } },
  { country: 'Brazil', per_capita_t: 2.2, breakdown: { transport: 20, home_energy: 15, food: 35, goods: 18, services: 12 } },
  { country: 'France', per_capita_t: 4.6, breakdown: { transport: 30, home_energy: 15, food: 25, goods: 18, services: 12 } },
  { country: 'Australia', per_capita_t: 15.0, breakdown: { transport: 25, home_energy: 28, food: 17, goods: 17, services: 13 } },
  { country: 'Canada', per_capita_t: 14.2, breakdown: { transport: 28, home_energy: 26, food: 16, goods: 17, services: 13 } },
  { country: 'South Korea', per_capita_t: 11.6, breakdown: { transport: 16, home_energy: 34, food: 18, goods: 20, services: 12 } },
  { country: 'Mexico', per_capita_t: 3.7, breakdown: { transport: 24, home_energy: 20, food: 28, goods: 16, services: 12 } },
  { country: 'Italy', per_capita_t: 5.5, breakdown: { transport: 26, home_energy: 22, food: 24, goods: 16, services: 12 } },
  { country: 'South Africa', per_capita_t: 7.5, breakdown: { transport: 14, home_energy: 40, food: 20, goods: 15, services: 11 } },
  { country: 'Indonesia', per_capita_t: 2.0, breakdown: { transport: 18, home_energy: 25, food: 30, goods: 16, services: 11 } },
  { country: 'Nigeria', per_capita_t: 0.6, breakdown: { transport: 15, home_energy: 30, food: 32, goods: 13, services: 10 } },
  { country: 'Sweden', per_capita_t: 3.8, breakdown: { transport: 32, home_energy: 12, food: 25, goods: 18, services: 13 } },
  { country: 'Saudi Arabia', per_capita_t: 18.0, breakdown: { transport: 22, home_energy: 38, food: 14, goods: 15, services: 11 } },
  { country: 'Russia', per_capita_t: 11.4, breakdown: { transport: 16, home_energy: 38, food: 18, goods: 17, services: 11 } },
  { country: 'Argentina', per_capita_t: 4.0, breakdown: { transport: 22, home_energy: 18, food: 34, goods: 15, services: 11 } },
];

const CARBON_EQUIVALENTS = [
  { label: '1 kg CO2e', driving_km: 4.76, cups_tea: 40, netflix_hrs: 13.9, showers_min: 5.3 },
];

const SECTOR_INTENSITY = [
  { sector: 'Electricity & Heat', kg_per_dollar: 1.82 },
  { sector: 'Agriculture', kg_per_dollar: 1.45 },
  { sector: 'Steel & Cement', kg_per_dollar: 1.21 },
  { sector: 'Transport', kg_per_dollar: 0.95 },
  { sector: 'Chemicals', kg_per_dollar: 0.78 },
  { sector: 'Mining', kg_per_dollar: 0.65 },
  { sector: 'Construction', kg_per_dollar: 0.52 },
  { sector: 'Retail', kg_per_dollar: 0.28 },
  { sector: 'Healthcare', kg_per_dollar: 0.22 },
  { sector: 'Finance & Insurance', kg_per_dollar: 0.08 },
];

const PERSONAL_ACTIONS = [
  { action: 'Go car-free', savings_t: 2.4, difficulty: 'Hard' },
  { action: 'One fewer long-haul flight/yr', savings_t: 1.6, difficulty: 'Medium' },
  { action: 'Switch to plant-based diet', savings_t: 0.8, difficulty: 'Medium' },
  { action: 'Switch to green electricity', savings_t: 1.5, difficulty: 'Easy' },
  { action: 'Insulate your home', savings_t: 0.9, difficulty: 'Medium' },
  { action: 'Buy fewer new clothes', savings_t: 0.3, difficulty: 'Easy' },
  { action: 'Reduce food waste by 50%', savings_t: 0.4, difficulty: 'Easy' },
  { action: 'Switch to heat pump', savings_t: 1.0, difficulty: 'Hard' },
  { action: 'Work from home 3 days/wk', savings_t: 0.5, difficulty: 'Easy' },
  { action: 'Buy refurbished electronics', savings_t: 0.2, difficulty: 'Easy' },
];

const CARBON_INFLATION = [
  { year: 2015, coffee_g: 250, streaming_g: 110, ev_charge_g: 320, laundry_g: 700 },
  { year: 2017, coffee_g: 240, streaming_g: 95, ev_charge_g: 280, laundry_g: 670 },
  { year: 2019, coffee_g: 230, streaming_g: 82, ev_charge_g: 240, laundry_g: 640 },
  { year: 2021, coffee_g: 220, streaming_g: 72, ev_charge_g: 200, laundry_g: 620 },
  { year: 2023, coffee_g: 215, streaming_g: 65, ev_charge_g: 170, laundry_g: 600 },
  { year: 2025, coffee_g: 210, streaming_g: 58, ev_charge_g: 140, laundry_g: 580 },
];

const CARBON_DIET_COMPARISON = [
  { food: 'Beef steak (200g)', carbon_kg: 5.4, protein_g: 50, carbon_per_protein: 0.108 },
  { food: 'Chicken breast (200g)', carbon_kg: 1.4, protein_g: 62, carbon_per_protein: 0.023 },
  { food: 'Salmon (200g)', carbon_kg: 2.4, protein_g: 40, carbon_per_protein: 0.060 },
  { food: 'Tofu (200g)', carbon_kg: 0.4, protein_g: 20, carbon_per_protein: 0.020 },
  { food: 'Lentils (200g cooked)', carbon_kg: 0.18, protein_g: 18, carbon_per_protein: 0.010 },
  { food: 'Eggs (3 large)', carbon_kg: 0.72, protein_g: 18, carbon_per_protein: 0.040 },
  { food: 'Milk (500ml)', carbon_kg: 1.6, protein_g: 17, carbon_per_protein: 0.094 },
  { food: 'Oat milk (500ml)', carbon_kg: 0.45, protein_g: 5, carbon_per_protein: 0.090 },
  { food: 'Cheese (100g)', carbon_kg: 2.1, protein_g: 25, carbon_per_protein: 0.084 },
  { food: 'Rice (200g cooked)', carbon_kg: 0.56, protein_g: 5, carbon_per_protein: 0.112 },
  { food: 'Pasta (200g cooked)', carbon_kg: 0.28, protein_g: 7, carbon_per_protein: 0.040 },
  { food: 'Avocado (1 medium)', carbon_kg: 0.42, protein_g: 3, carbon_per_protein: 0.140 },
];

const TRANSPORT_COMPARISON = [
  { mode: 'Walking', g_per_km: 0, cost_per_km: 0, time_min_10km: 120 },
  { mode: 'Cycling', g_per_km: 5, cost_per_km: 0.05, time_min_10km: 30 },
  { mode: 'E-bike', g_per_km: 12, cost_per_km: 0.08, time_min_10km: 25 },
  { mode: 'E-scooter', g_per_km: 25, cost_per_km: 0.15, time_min_10km: 22 },
  { mode: 'Bus', g_per_km: 82, cost_per_km: 0.20, time_min_10km: 35 },
  { mode: 'Train', g_per_km: 41, cost_per_km: 0.25, time_min_10km: 15 },
  { mode: 'Electric car', g_per_km: 53, cost_per_km: 0.12, time_min_10km: 12 },
  { mode: 'Hybrid car', g_per_km: 120, cost_per_km: 0.18, time_min_10km: 12 },
  { mode: 'Petrol car', g_per_km: 210, cost_per_km: 0.25, time_min_10km: 12 },
  { mode: 'Motorcycle', g_per_km: 103, cost_per_km: 0.10, time_min_10km: 10 },
  { mode: 'Taxi/Rideshare', g_per_km: 250, cost_per_km: 1.80, time_min_10km: 14 },
  { mode: 'Domestic flight', g_per_km: 255, cost_per_km: 0.15, time_min_10km: 6 },
];

const HOUSING_CARBON = [
  { type: 'Studio apartment (gas)', annual_kg: 1200, monthly_cost: 80 },
  { type: 'Studio apartment (electric)', annual_kg: 600, monthly_cost: 95 },
  { type: '2-bed house (gas)', annual_kg: 2800, monthly_cost: 150 },
  { type: '2-bed house (heat pump)', annual_kg: 900, monthly_cost: 120 },
  { type: '4-bed house (gas)', annual_kg: 4500, monthly_cost: 220 },
  { type: '4-bed house (solar + heat pump)', annual_kg: 400, monthly_cost: 60 },
  { type: 'Off-grid tiny home', annual_kg: 150, monthly_cost: 30 },
];

const GLOBAL_CARBON_CLOCK = {
  budget_remaining_Gt: 250,
  annual_emissions_Gt: 36.8,
  years_at_current_rate: 6.8,
  ppm_current: 421,
  ppm_pre_industrial: 280,
  temp_rise_current: 1.2,
};

const DAY_TIMELINE = [
  { time: '06:00', activity: 'Wake up, shower', carbon_kg: 1.5, cumulative: 1.5 },
  { time: '06:30', activity: 'Breakfast + coffee', carbon_kg: 0.51, cumulative: 2.01 },
  { time: '07:00', activity: 'Drive to work', carbon_kg: 4.2, cumulative: 6.21 },
  { time: '09:00', activity: 'Morning at office', carbon_kg: 0.8, cumulative: 7.01 },
  { time: '12:00', activity: 'Lunch (burger)', carbon_kg: 3.8, cumulative: 10.81 },
  { time: '14:00', activity: 'Afternoon work', carbon_kg: 0.8, cumulative: 11.61 },
  { time: '17:00', activity: 'Drive home', carbon_kg: 4.2, cumulative: 15.81 },
  { time: '18:00', activity: 'Cook dinner', carbon_kg: 1.8, cumulative: 17.61 },
  { time: '19:00', activity: 'Laundry', carbon_kg: 0.6, cumulative: 18.21 },
  { time: '20:00', activity: 'Netflix 2 hrs', carbon_kg: 0.072, cumulative: 18.28 },
  { time: '22:00', activity: 'Charge devices', carbon_kg: 0.15, cumulative: 18.43 },
];

const PIE_COLORS = [T.navy, T.gold, T.sage, T.navyL, T.red, T.amber, '#8b5cf6', '#ec4899'];

/* ── Helpers ────────────────────────────────────────────────────────── */
const fmt = (n, d=1) => n >= 1000 ? (n/1000).toFixed(d)+'k' : Number(n).toFixed(d);
const fmtMoney = n => n >= 1000 ? '$'+fmt(n,1) : '$'+Number(n).toFixed(2);
const GLOBAL_EMISSIONS_PER_SEC = 1169; // ~36.8 Gt / year

const downloadCSV = (rows, filename) => {
  if (!rows.length) return;
  const hdr = Object.keys(rows[0]).join(',');
  const body = rows.map(r => Object.values(r).join(',')).join('\n');
  const blob = new Blob([hdr+'\n'+body], { type:'text/csv' });
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
};

const downloadJSON = (obj, filename) => {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type:'application/json' });
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
};

/* ── Shared Styles ──────────────────────────────────────────────────── */
const card = { background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: 28, marginBottom: 24 };
const sectionTitle = { fontSize: 22, fontWeight: 700, color: T.navy, margin: '0 0 8px 0', fontFamily: T.font };
const sectionSub = { fontSize: 14, color: T.textSec, margin: '0 0 20px 0', lineHeight: 1.5 };
const badge = (bg, color) => ({ display:'inline-block', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:bg, color });
const btnPrimary = { padding:'10px 22px', borderRadius:10, border:'none', background:T.navy, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:T.font };
const btnOutline = { ...btnPrimary, background:'transparent', border:`1.5px solid ${T.border}`, color:T.navy };
const grid = (cols, gap=20) => ({ display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap });
const kpiBox = { background: T.surfaceH, borderRadius: 10, padding: '16px 20px', textAlign: 'center' };

/* ── Component ──────────────────────────────────────────────────────── */
export default function CarbonEconomyPage() {
  const nav = useNavigate();
  const [carbonPrice, setCarbonPrice] = useState(51);
  const [selectedCountry, setSelectedCountry] = useState('USA');
  const [emissionCounter, setEmissionCounter] = useState(0);
  const [age, setAge] = useState(30);

  useEffect(() => {
    const t = setInterval(() => setEmissionCounter(p => p + GLOBAL_EMISSIONS_PER_SEC), 1000);
    return () => clearInterval(t);
  }, []);

  const countryData = useMemo(() => COUNTRY_FOOTPRINTS.find(c => c.country === selectedCountry) || COUNTRY_FOOTPRINTS[0], [selectedCountry]);

  const allActivities = useMemo(() => [
    ...CARBON_PRICE_TAGS.daily_activities,
    ...CARBON_PRICE_TAGS.weekly_activities,
    ...CARBON_PRICE_TAGS.annual_activities,
  ], []);

  const pricedActivities = useMemo(() =>
    allActivities.map(a => ({
      ...a,
      carbon_cost: (a.carbon_kg * carbonPrice) / 1000,
      true_cost: a.money_cost + (a.carbon_kg * carbonPrice) / 1000,
      carbon_per_dollar: a.carbon_kg / a.money_cost,
    })).sort((a, b) => b.carbon_per_dollar - a.carbon_per_dollar)
  , [allActivities, carbonPrice]);

  const dailyBudget_15C = 6.3; // kg per day for 1.5C pathway (2.3t / 365)
  const annualBudget_15C = 2300; // kg per year

  const countryGapData = useMemo(() =>
    COUNTRY_FOOTPRINTS.map(c => ({ country: c.country, actual: c.per_capita_t, budget: 2.3, gap: Math.max(0, c.per_capita_t - 2.3) })).sort((a, b) => b.gap - a.gap)
  , []);

  const carbonTaxData = useMemo(() =>
    [51, 100, 200].map(price => ({ price: `$${price}/t`, annual_tax: (countryData.per_capita_t * price).toFixed(0), monthly: ((countryData.per_capita_t * price) / 12).toFixed(0) }))
  , [countryData]);

  const breakdownPie = useMemo(() =>
    Object.entries(countryData.breakdown).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1).replace('_', ' '), value: v }))
  , [countryData]);

  const carbonNetWorth = useMemo(() => (age * countryData.per_capita_t).toFixed(1), [age, countryData]);

  const carbonRankings = useMemo(() => {
    const sorted = [...COUNTRY_FOOTPRINTS].sort((a, b) => b.per_capita_t - a.per_capita_t);
    const idx = sorted.findIndex(c => c.country === selectedCountry);
    return { rank: idx + 1, total: sorted.length, percentile: ((sorted.length - idx) / sorted.length * 100).toFixed(0) };
  }, [selectedCountry]);

  const lifetimeCarbonByCategory = useMemo(() =>
    Object.entries(countryData.breakdown).map(([cat, pct]) => ({
      category: cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' '),
      lifetime_t: (age * countryData.per_capita_t * pct / 100).toFixed(1),
    }))
  , [age, countryData]);

  const handleExportCSV = useCallback(() => {
    const rows = pricedActivities.map(a => ({ Activity: a.activity, Carbon_kg: a.carbon_kg, Dollar_Cost: a.money_cost, Carbon_Cost: a.carbon_cost.toFixed(3), True_Cost: a.true_cost.toFixed(2), Carbon_Per_Dollar: a.carbon_per_dollar.toFixed(3) }));
    downloadCSV(rows, 'carbon_economy_report.csv');
  }, [pricedActivities]);

  const handleExportJSON = useCallback(() => {
    downloadJSON({ country: selectedCountry, carbon_price: carbonPrice, footprint_t: countryData.per_capita_t, age, carbon_net_worth_t: carbonNetWorth, breakdown: countryData.breakdown }, 'personal_carbon_profile.json');
  }, [selectedCountry, carbonPrice, countryData, age, carbonNetWorth]);

  const handlePrint = useCallback(() => window.print(), []);

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '32px 40px 60px' }}>
      {/* ── 1. Hero ──────────────────────────────────────────────────── */}
      <div style={{ ...card, background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyL} 100%)`, color: '#fff', textAlign: 'center', padding: '52px 40px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 10px 0' }}>Welcome to the Carbon Economy</h1>
        <p style={{ fontSize: 16, opacity: 0.85, margin: '0 0 28px 0', maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
          If every product had a carbon price tag next to its dollar price tag, how would the economy look? This dashboard answers that question.
        </p>
        <div style={{ fontSize: 40, fontWeight: 800, color: T.gold, marginBottom: 6 }}>
          {(emissionCounter).toLocaleString()} tonnes
        </div>
        <p style={{ fontSize: 14, opacity: 0.7, margin: 0 }}>CO2 emitted globally since you opened this page ({GLOBAL_EMISSIONS_PER_SEC.toLocaleString()} tonnes per second)</p>
      </div>

      {/* ── 14. Country Selector (placed early for personalization) ─── */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, color: T.navy, fontSize: 16 }}>Personalize Your View</div>
        <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, fontFamily: T.font, color: T.navy }}>
          {COUNTRY_FOOTPRINTS.map(c => <option key={c.country} value={c.country}>{c.country}</option>)}
        </select>
        <span style={{ color: T.textSec, fontSize: 14 }}>Per capita: <strong style={{ color: T.navy }}>{countryData.per_capita_t} t CO2e/year</strong></span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {[51, 100, 200].map(p => (
            <button key={p} onClick={() => setCarbonPrice(p)} style={{ ...btnPrimary, background: carbonPrice === p ? T.navy : T.surfaceH, color: carbonPrice === p ? '#fff' : T.navy, fontSize: 13, padding: '7px 16px' }}>
              ${p}/t
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. "What If Carbon Had a Price Tag?" ─────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>What If Carbon Had a Price Tag?</h2>
        <p style={sectionSub}>Toggle the carbon price to see how everyday activities' "true cost" changes. Current: <strong>${carbonPrice}/tonne</strong></p>
        <div style={grid(3, 16)}>
          {CARBON_PRICE_TAGS.daily_activities.slice(0, 6).map((a, i) => {
            const cc = (a.carbon_kg * carbonPrice) / 1000;
            const tc = a.money_cost + cc;
            const pct = (cc / a.money_cost * 100).toFixed(1);
            return (
              <div key={i} style={{ background: T.surfaceH, borderRadius: 12, padding: 20, position: 'relative' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 12 }}>{a.activity}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: T.textSec }}>Dollar price</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{fmtMoney(a.money_cost)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: T.textSec }}>Carbon price</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: T.red }}>+{fmtMoney(cc)}</span>
                </div>
                <div style={{ height: 1, background: T.borderL, margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>True cost</span>
                  <span style={{ fontSize: 17, fontWeight: 800, color: T.gold }}>{fmtMoney(tc)}</span>
                </div>
                <div style={{ ...badge(pct > 10 ? '#fef2f2' : '#f0fdf4', pct > 10 ? T.red : T.green), position: 'absolute', top: 12, right: 12 }}>
                  +{pct}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Daily Carbon Budget Gauge ──────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Daily Carbon Budget Gauge</h2>
        <p style={sectionSub}>You have {dailyBudget_15C} kg of carbon to spend today (1.5C pathway). Here's how fast it goes...</p>
        <div style={{ background: T.surfaceH, borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: T.navy }}>Daily budget: {dailyBudget_15C} kg CO2e</span>
            <span style={{ fontWeight: 600, color: T.red }}>Avg {selectedCountry} day: {(countryData.per_capita_t * 1000 / 365).toFixed(1)} kg</span>
          </div>
          <div style={{ width: '100%', height: 32, background: '#e5e7eb', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
            <div style={{ width: '100%', height: '100%', background: T.green, borderRadius: 16, position: 'absolute' }} />
            {(() => {
              const used = Math.min((countryData.per_capita_t * 1000 / 365) / dailyBudget_15C * 100, 100);
              return <div style={{ width: `${used}%`, height: '100%', background: used > 100 ? T.red : T.amber, borderRadius: 16, position: 'absolute', transition: 'width 0.8s' }} />;
            })()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: T.textSec }}>
            <span>0 kg</span>
            <span style={{ color: T.green, fontWeight: 600 }}>Budget: {dailyBudget_15C} kg</span>
            <span>{(countryData.per_capita_t * 1000 / 365).toFixed(1)} kg (your avg)</span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            {[
              { act: 'Coffee', kg: 0.21 }, { act: 'Drive 20km', kg: 4.2 }, { act: 'Burger lunch', kg: 3.8 }, { act: 'Shower', kg: 1.5 },
            ].map((a, i) => (
              <div key={i} style={{ padding: '6px 14px', borderRadius: 8, background: '#fff', border: `1px solid ${T.borderL}`, fontSize: 13 }}>
                {a.act}: <strong style={{ color: T.navy }}>{a.kg} kg</strong> <span style={{ color: T.textMut }}>({(a.kg / dailyBudget_15C * 100).toFixed(0)}% of budget)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. Activity Carbon Price Tags ─────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Activity Carbon Price Tags</h2>
        <p style={sectionSub}>Every activity with BOTH its dollar price and carbon price side-by-side at ${carbonPrice}/tonne.</p>
        <div style={grid(4, 14)}>
          {allActivities.map((a, i) => {
            const cc = (a.carbon_kg * carbonPrice) / 1000;
            return (
              <div key={i} style={{ background: T.surfaceH, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.navy, marginBottom: 10, minHeight: 36 }}>{a.activity}</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <span style={{ ...badge('#e0f2fe', T.navyL) }}>${a.money_cost}</span>
                  <span style={{ ...badge('#fef2f2', T.red) }}>+${cc.toFixed(3)}</span>
                </div>
                <div style={{ fontSize: 12, color: T.textSec }}>{a.carbon_kg} kg CO2e</div>
                {a.frequency && <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>{a.frequency}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. Carbon Expensive vs Carbon Cheap ──────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Carbon Expensive vs Carbon Cheap</h2>
        <p style={sectionSub}>Ranking activities by carbon-per-dollar ratio: which spend the most carbon for the least money?</p>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: T.red, fontSize: 14, marginBottom: 12 }}>Most Carbon Expensive (High kg/$)</div>
            {pricedActivities.slice(0, 6).map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: i % 2 === 0 ? T.surfaceH : '#fff', borderRadius: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: T.navy }}>{a.activity}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.red }}>{a.carbon_per_dollar.toFixed(2)} kg/$</span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: T.green, fontSize: 14, marginBottom: 12 }}>Most Carbon Cheap (Low kg/$)</div>
            {pricedActivities.slice(-6).reverse().map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: i % 2 === 0 ? T.surfaceH : '#fff', borderRadius: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: T.navy }}>{a.activity}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.green }}>{a.carbon_per_dollar.toFixed(3)} kg/$</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 6. Country Footprint Comparison BarChart ──────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Country Footprint Comparison</h2>
        <p style={sectionSub}>Per capita emissions (tonnes CO2e/year) by country. Red dashed line = 1.5C budget (2.3t).</p>
        <div style={{ height: 420 }}>
          <ResponsiveContainer>
            <BarChart data={COUNTRY_FOOTPRINTS.sort((a, b) => b.per_capita_t - a.per_capita_t)} margin={{ top: 10, right: 20, bottom: 60, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="country" tick={{ fontSize: 11, fill: T.textSec }} angle={-40} textAnchor="end" />
              <YAxis tick={{ fontSize: 12, fill: T.textSec }} />
              <Tooltip formatter={v => `${v} t`} contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}` }} />
              <Bar dataKey="per_capita_t" fill={T.navy} radius={[4, 4, 0, 0]} name="Per Capita (t)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Country Breakdown PieChart ────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>{selectedCountry} Carbon Breakdown</h2>
        <p style={sectionSub}>Where does the average {selectedCountry} resident's carbon come from?</p>
        <div style={{ height: 320, display: 'flex', alignItems: 'center' }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={breakdownPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, value }) => `${name} ${value}%`}>
                {breakdownPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 7. Your Day in Carbon ─────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Your Day in Carbon</h2>
        <p style={sectionSub}>Interactive timeline: morning to night showing carbon accumulation from typical activities.</p>
        <div style={{ height: 320 }}>
          <ResponsiveContainer>
            <AreaChart data={DAY_TIMELINE} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 12, fill: T.textSec }} />
              <Tooltip content={({ payload }) => payload?.[0] ? (
                <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, fontSize: 13 }}>
                  <div style={{ fontWeight: 700, color: T.navy }}>{payload[0].payload.time} - {payload[0].payload.activity}</div>
                  <div style={{ color: T.textSec }}>This activity: {payload[0].payload.carbon_kg} kg CO2e</div>
                  <div style={{ color: T.red, fontWeight: 600 }}>Cumulative: {payload[0].payload.cumulative.toFixed(2)} kg</div>
                </div>
              ) : null} />
              <Area type="stepAfter" dataKey="cumulative" fill={T.navyL} fillOpacity={0.15} stroke={T.navy} strokeWidth={2} name="Cumulative CO2e (kg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
          <div style={{ height: 3, flex: 1, background: `linear-gradient(90deg, ${T.green}, ${T.amber}, ${T.red})`, borderRadius: 2 }} />
          <span style={{ fontSize: 12, color: T.red, fontWeight: 600 }}>Day total: {DAY_TIMELINE[DAY_TIMELINE.length - 1].cumulative.toFixed(1)} kg ({(DAY_TIMELINE[DAY_TIMELINE.length - 1].cumulative / dailyBudget_15C * 100).toFixed(0)}% of budget)</span>
        </div>
      </div>

      {/* ── 8. Carbon Currency Converter ──────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Carbon Currency Converter</h2>
        <p style={sectionSub}>1 kg CO2e is equivalent to...</p>
        <div style={grid(4, 16)}>
          {[
            { icon: 'car', label: 'Driving', val: '4.76 km' },
            { icon: 'cup', label: 'Cups of tea', val: '40 cups' },
            { icon: 'tv', label: 'Streaming Netflix', val: '13.9 hours' },
            { icon: 'shower', label: 'Showering', val: '5.3 minutes' },
          ].map((item, i) => (
            <div key={i} style={{ ...kpiBox, background: T.surfaceH }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.navy }}>{item.val}</div>
              <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: T.textMut }}>
          So a 1,100 kg flight = {(1100 * 4.76).toLocaleString()} km of driving = {(1100 * 40).toLocaleString()} cups of tea
        </div>
      </div>

      {/* ── 9. The Carbon Gap ────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>The Carbon Gap</h2>
        <p style={sectionSub}>The gap between the 1.5C budget (2.3 t/year) and actual per-capita footprint by country.</p>
        <div style={{ height: 400 }}>
          <ResponsiveContainer>
            <BarChart data={countryGapData.slice(0, 12)} layout="vertical" margin={{ top: 10, right: 30, bottom: 10, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 12, fill: T.textSec }} />
              <YAxis dataKey="country" type="category" tick={{ fontSize: 12, fill: T.textSec }} width={70} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}` }} />
              <Bar dataKey="budget" stackId="a" fill={T.green} name="1.5C Budget" radius={[0, 0, 0, 0]} />
              <Bar dataKey="gap" stackId="a" fill={T.red} name="Overshoot" radius={[0, 4, 4, 0]} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 10. If You Were Taxed on Carbon ──────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>If You Were Taxed on Carbon</h2>
        <p style={sectionSub}>Based on {selectedCountry}'s average per capita emissions ({countryData.per_capita_t} t/year), here's what you'd pay:</p>
        <div style={grid(3, 16)}>
          {carbonTaxData.map((d, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 12, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.textSec, marginBottom: 8 }}>Carbon price: {d.price}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: T.navy }}>${d.annual_tax}</div>
              <div style={{ fontSize: 13, color: T.textSec }}>per year</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: T.gold, marginTop: 8 }}>${d.monthly}/mo</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 11. Carbon Inflation ──────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Carbon Inflation</h2>
        <p style={sectionSub}>How has the carbon cost of products changed over time? Grid decarbonization is helping.</p>
        <div style={{ height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={CARBON_INFLATION} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 12, fill: T.textSec }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}` }} />
              <Legend />
              <Line type="monotone" dataKey="coffee_g" stroke={T.gold} strokeWidth={2} name="Coffee (g)" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="streaming_g" stroke={T.sage} strokeWidth={2} name="2hr Streaming (g)" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="ev_charge_g" stroke={T.navyL} strokeWidth={2} name="EV Charge (g)" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="laundry_g" stroke={T.red} strokeWidth={2} name="Laundry Load (g)" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 12. Sector Carbon Intensity ───────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Sector Carbon Intensity</h2>
        <p style={sectionSub}>Which economic sectors emit the most CO2 per dollar of GDP?</p>
        <div style={{ height: 380 }}>
          <ResponsiveContainer>
            <BarChart data={SECTOR_INTENSITY} layout="vertical" margin={{ top: 10, right: 30, bottom: 10, left: 130 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 12, fill: T.textSec }} />
              <YAxis dataKey="sector" type="category" tick={{ fontSize: 12, fill: T.textSec }} width={120} />
              <Tooltip formatter={v => `${v} kg/$`} contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}` }} />
              <Bar dataKey="kg_per_dollar" fill={T.gold} radius={[0, 6, 6, 0]} name="kg CO2e per $" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 13. Personal Action Leaderboard ───────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Personal Action Leaderboard</h2>
        <p style={sectionSub}>Top 10 personal actions ranked by annual carbon reduction potential.</p>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' }}>
          <thead>
            <tr>{['#','Action','Annual Savings (t CO2e)','Difficulty'].map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {PERSONAL_ACTIONS.sort((a, b) => b.savings_t - a.savings_t).map((a, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : '#fff' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: T.gold, fontSize: 16 }}>{i + 1}</td>
                <td style={{ padding: '10px 12px', fontSize: 14, color: T.navy, fontWeight: 600 }}>{a.action}</td>
                <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 700, color: T.green }}>{a.savings_t} t</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ ...badge(a.difficulty === 'Hard' ? '#fef2f2' : a.difficulty === 'Medium' ? '#fffbeb' : '#f0fdf4', a.difficulty === 'Hard' ? T.red : a.difficulty === 'Medium' ? T.amber : T.green) }}>
                    {a.difficulty}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Country Carbon Rankings ─────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Your Country's Carbon Ranking</h2>
        <p style={sectionSub}>{selectedCountry} ranks #{carbonRankings.rank} of {carbonRankings.total} countries in per-capita emissions (top {100 - parseInt(carbonRankings.percentile)}% highest).</p>
        <div style={grid(3, 16)}>
          <div style={{ ...kpiBox, background: '#fef2f2' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: T.red }}>#{carbonRankings.rank}</div>
            <div style={{ fontSize: 13, color: T.textSec }}>Global Rank (highest emitter)</div>
          </div>
          <div style={kpiBox}>
            <div style={{ fontSize: 36, fontWeight: 800, color: T.navy }}>{countryData.per_capita_t}t</div>
            <div style={{ fontSize: 13, color: T.textSec }}>Per Capita</div>
          </div>
          <div style={kpiBox}>
            <div style={{ fontSize: 36, fontWeight: 800, color: countryData.per_capita_t > 2.3 ? T.red : T.green }}>{(countryData.per_capita_t / 2.3).toFixed(1)}x</div>
            <div style={{ fontSize: 13, color: T.textSec }}>Over 1.5C Budget</div>
          </div>
        </div>
      </div>

      {/* ── Lifetime Carbon by Category ───────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Lifetime Carbon by Category</h2>
        <p style={sectionSub}>Your estimated cumulative emissions since birth ({age} years) broken down by category in {selectedCountry}.</p>
        <div style={{ height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={lifetimeCarbonByCategory} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="category" tick={{ fontSize: 12, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 12, fill: T.textSec }} />
              <Tooltip formatter={v => `${v} tonnes`} contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}` }} />
              <Bar dataKey="lifetime_t" fill={T.navy} radius={[6, 6, 0, 0]} name="Lifetime Tonnes">
                {lifetimeCarbonByCategory.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 15. Carbon Net Worth ──────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Your Carbon Net Worth</h2>
        <p style={sectionSub}>Your cumulative carbon "debt" since birth: age multiplied by your country's average annual emissions.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div>
            <label style={{ fontSize: 13, color: T.textSec, display: 'block', marginBottom: 6 }}>Your age</label>
            <input type="number" value={age} min={1} max={100} onChange={e => setAge(Math.max(1, Math.min(100, +e.target.value)))} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 16, width: 100, fontFamily: T.font }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: T.red }}>{carbonNetWorth} tonnes</div>
            <div style={{ fontSize: 14, color: T.textSec }}>Lifetime carbon debt ({age} years x {countryData.per_capita_t} t/yr in {selectedCountry})</div>
            <div style={{ fontSize: 13, color: T.textMut, marginTop: 4 }}>
              That's equivalent to {Math.round(carbonNetWorth * 4.76)} km of driving or {Math.round(carbonNetWorth / 0.022)} trees needed to offset (in 1 year)
            </div>
          </div>
        </div>
      </div>

      {/* ── Food Carbon Comparison ────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Food Carbon Comparison</h2>
        <p style={sectionSub}>Carbon footprint per food item and per gram of protein. Not all protein is equal in climate terms.</p>
        <div style={{ height: 380 }}>
          <ResponsiveContainer>
            <BarChart data={CARBON_DIET_COMPARISON} margin={{ top: 10, right: 30, bottom: 60, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="food" tick={{ fontSize: 10, fill: T.textSec }} angle={-35} textAnchor="end" />
              <YAxis tick={{ fontSize: 12, fill: T.textSec }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}` }} />
              <Legend />
              <Bar dataKey="carbon_kg" fill={T.red} name="Carbon (kg CO2e)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="protein_g" fill={T.sage} name="Protein (g)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={grid(4, 12)}>
          {CARBON_DIET_COMPARISON.slice(0, 4).map((f, i) => (
            <div key={i} style={{ ...kpiBox, background: i === 0 ? '#fef2f2' : T.surfaceH }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{f.food}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: f.carbon_kg > 2 ? T.red : T.green, marginTop: 6 }}>{f.carbon_kg} kg</div>
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{f.protein_g}g protein | {(f.carbon_per_protein * 1000).toFixed(0)}g CO2/g protein</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Transport Mode Comparison ─────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Transport Mode Comparison</h2>
        <p style={sectionSub}>Grams of CO2e per km for different transport modes. The choice of how you move matters enormously.</p>
        <div style={{ height: 380 }}>
          <ResponsiveContainer>
            <BarChart data={TRANSPORT_COMPARISON} layout="vertical" margin={{ top: 10, right: 30, bottom: 10, left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{ fontSize: 12, fill: T.textSec }} />
              <YAxis dataKey="mode" type="category" tick={{ fontSize: 12, fill: T.textSec }} width={90} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}` }} />
              <Bar dataKey="g_per_km" fill={T.navyL} radius={[0, 6, 6, 0]} name="g CO2e per km">
                {TRANSPORT_COMPARISON.map((entry, idx) => (
                  <Cell key={idx} fill={entry.g_per_km <= 20 ? T.green : entry.g_per_km <= 100 ? T.amber : T.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
          {TRANSPORT_COMPARISON.filter(t => t.g_per_km > 0).slice(0, 5).map((t, i) => (
            <div key={i} style={{ padding: '8px 16px', borderRadius: 8, background: T.surfaceH, fontSize: 13 }}>
              <strong style={{ color: T.navy }}>{t.mode}:</strong> <span style={{ color: T.textSec }}>{t.g_per_km}g/km | ${t.cost_per_km}/km | {t.time_min_10km}min for 10km</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Housing Carbon Impact ─────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Housing Carbon Impact</h2>
        <p style={sectionSub}>Annual carbon emissions by housing type. Electrification and insulation are game-changers.</p>
        <div style={grid(3, 14)}>
          {HOUSING_CARBON.map((h, i) => {
            const carbonCost = (h.annual_kg * carbonPrice / 1000).toFixed(0);
            return (
              <div key={i} style={{ background: T.surfaceH, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 10, minHeight: 36 }}>{h.type}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: T.textSec }}>Annual carbon</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: h.annual_kg > 2000 ? T.red : h.annual_kg > 800 ? T.amber : T.green }}>{(h.annual_kg / 1000).toFixed(1)} t</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: T.textSec }}>Monthly energy cost</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: T.navy }}>${h.monthly_cost}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: T.textSec }}>Carbon tax @ ${carbonPrice}/t</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: T.gold }}>${carbonCost}/yr</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Global Carbon Clock ───────────────────────────────────────── */}
      <div style={{ ...card, background: `linear-gradient(135deg, #1a1a2e 0%, ${T.navy} 100%)`, color: '#fff' }}>
        <h2 style={{ ...sectionTitle, color: '#fff' }}>Global Carbon Clock</h2>
        <p style={{ ...sectionSub, color: 'rgba(255,255,255,0.7)' }}>The remaining carbon budget for a 50% chance of staying below 1.5C of warming.</p>
        <div style={grid(3, 20)}>
          {[
            { label: 'Carbon Budget Remaining', value: `${GLOBAL_CARBON_CLOCK.budget_remaining_Gt} Gt`, sub: 'For 1.5C (50% chance)' },
            { label: 'Annual Global Emissions', value: `${GLOBAL_CARBON_CLOCK.annual_emissions_Gt} Gt`, sub: 'Current rate' },
            { label: 'Years at Current Rate', value: `${GLOBAL_CARBON_CLOCK.years_at_current_rate}`, sub: 'Until budget exhausted' },
            { label: 'Atmospheric CO2', value: `${GLOBAL_CARBON_CLOCK.ppm_current} ppm`, sub: `Pre-industrial: ${GLOBAL_CARBON_CLOCK.ppm_pre_industrial} ppm` },
            { label: 'Temperature Rise', value: `+${GLOBAL_CARBON_CLOCK.temp_rise_current}C`, sub: 'Above pre-industrial' },
            { label: 'Emissions per Second', value: `${GLOBAL_EMISSIONS_PER_SEC.toLocaleString()} t`, sub: 'Right now, every second' },
          ].map((item, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.gold }}>{item.value}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{item.label}</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Lifestyle Carbon Calculator ───────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Quick Lifestyle Carbon Estimator</h2>
        <p style={sectionSub}>Based on your country ({selectedCountry}), here's a rough lifestyle carbon breakdown by category.</p>
        <div style={grid(5, 14)}>
          {Object.entries(countryData.breakdown).map(([cat, pct], i) => {
            const catCarbon = (countryData.per_capita_t * pct / 100).toFixed(1);
            const catDaily = (countryData.per_capita_t * 1000 * pct / 100 / 365).toFixed(1);
            const catCost = (countryData.per_capita_t * pct / 100 * carbonPrice).toFixed(0);
            return (
              <div key={i} style={{ background: T.surfaceH, borderRadius: 12, padding: 18, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.textSec, textTransform: 'capitalize', marginBottom: 8 }}>{cat.replace('_', ' ')}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: T.navy }}>{catCarbon} t</div>
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{pct}% of total</div>
                <div style={{ fontSize: 12, color: T.textMut, marginTop: 2 }}>{catDaily} kg/day</div>
                <div style={{ fontSize: 12, color: T.gold, fontWeight: 600, marginTop: 4 }}>${catCost}/yr tax</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Annual vs Daily vs Hourly ─────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Carbon at Every Scale</h2>
        <p style={sectionSub}>Your {selectedCountry} per-capita footprint expressed at different time scales.</p>
        <div style={grid(4, 16)}>
          {[
            { label: 'Per Year', value: `${countryData.per_capita_t} t`, color: T.navy },
            { label: 'Per Month', value: `${(countryData.per_capita_t * 1000 / 12).toFixed(0)} kg`, color: T.navyL },
            { label: 'Per Day', value: `${(countryData.per_capita_t * 1000 / 365).toFixed(1)} kg`, color: T.gold },
            { label: 'Per Hour', value: `${(countryData.per_capita_t * 1000 / 8760).toFixed(2)} kg`, color: T.sage },
          ].map((item, i) => (
            <div key={i} style={{ ...kpiBox }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: 13, color: T.textSec, marginTop: 6 }}>{item.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: 16, background: T.surfaceH, borderRadius: 10, fontSize: 14, color: T.textSec, lineHeight: 1.6 }}>
          The 1.5C pathway requires each person on Earth to average no more than <strong style={{ color: T.green }}>2.3 tonnes per year</strong> ({(2300/365).toFixed(1)} kg/day).
          {countryData.per_capita_t > 2.3 && (
            <span> The average {selectedCountry} resident exceeds this by <strong style={{ color: T.red }}>{(countryData.per_capita_t / 2.3).toFixed(1)}x</strong>.</span>
          )}
        </div>
      </div>

      {/* ── Carbon Price Scenarios ────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Carbon Price Scenarios</h2>
        <p style={sectionSub}>How different carbon pricing levels would affect the cost of common purchases.</p>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>Item</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>Base Price</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>Carbon (kg)</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>@ $51/t</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>@ $100/t</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>@ $200/t</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>% Increase @ $200</th>
            </tr>
          </thead>
          <tbody>
            {allActivities.slice(0, 12).map((a, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : '#fff' }}>
                <td style={{ padding: '8px 12px', fontSize: 13, color: T.navy, fontWeight: 600 }}>{a.activity}</td>
                <td style={{ padding: '8px 12px', fontSize: 13, color: T.textSec, textAlign: 'right' }}>{fmtMoney(a.money_cost)}</td>
                <td style={{ padding: '8px 12px', fontSize: 13, color: T.navy, textAlign: 'right', fontWeight: 600 }}>{a.carbon_kg}</td>
                <td style={{ padding: '8px 12px', fontSize: 13, color: T.textSec, textAlign: 'right' }}>{fmtMoney(a.money_cost + a.carbon_kg * 0.051)}</td>
                <td style={{ padding: '8px 12px', fontSize: 13, color: T.amber, textAlign: 'right', fontWeight: 600 }}>{fmtMoney(a.money_cost + a.carbon_kg * 0.1)}</td>
                <td style={{ padding: '8px 12px', fontSize: 13, color: T.red, textAlign: 'right', fontWeight: 600 }}>{fmtMoney(a.money_cost + a.carbon_kg * 0.2)}</td>
                <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'right' }}>
                  <span style={{ ...badge(a.carbon_kg * 0.2 / a.money_cost > 0.1 ? '#fef2f2' : '#f0fdf4', a.carbon_kg * 0.2 / a.money_cost > 0.1 ? T.red : T.green) }}>
                    +{(a.carbon_kg * 0.2 / a.money_cost * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Top 20 Carbon Activities Sorted ─────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>The Carbon Top 20</h2>
        <p style={sectionSub}>All activities ranked by absolute annual carbon impact. These are the biggest "line items" in a typical person's carbon budget.</p>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
          <thead>
            <tr>
              {['#', 'Activity', 'Single Event (kg)', 'Annual Total (kg)', 'Annual at $'+carbonPrice+'/t', '% of 1.5C Budget'].map(h => (
                <th key={h} style={{ textAlign: h === '#' || h === 'Activity' ? 'left' : 'right', padding: '8px 12px', fontSize: 12, fontWeight: 600, color: T.textSec, borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allActivities
              .filter(a => a.annual_carbon)
              .sort((a, b) => (b.annual_carbon || 0) - (a.annual_carbon || 0))
              .slice(0, 20)
              .map((a, i) => {
                const annualCost = ((a.annual_carbon || 0) * carbonPrice / 1000).toFixed(2);
                const budgetPct = ((a.annual_carbon || 0) / annualBudget_15C * 100).toFixed(1);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.surfaceH : '#fff' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: T.gold, fontSize: 14 }}>{i + 1}</td>
                    <td style={{ padding: '8px 12px', fontSize: 13, color: T.navy, fontWeight: 600 }}>{a.activity}</td>
                    <td style={{ padding: '8px 12px', fontSize: 13, color: T.textSec, textAlign: 'right' }}>{a.carbon_kg}</td>
                    <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 700, color: T.navy, textAlign: 'right' }}>{(a.annual_carbon || 0).toLocaleString()}</td>
                    <td style={{ padding: '8px 12px', fontSize: 13, color: T.gold, textAlign: 'right', fontWeight: 600 }}>${annualCost}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <span style={{ ...badge(parseFloat(budgetPct) > 25 ? '#fef2f2' : '#f0fdf4', parseFloat(budgetPct) > 25 ? T.red : T.green) }}>
                        {budgetPct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* ── Carbon Swap Guide ─────────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Carbon Swap Guide</h2>
        <p style={sectionSub}>Simple swaps that save significant carbon. Replace high-carbon habits with low-carbon alternatives.</p>
        <div style={grid(2, 16)}>
          {[
            { from: 'Beef burger', to: 'Bean burger', from_kg: 3.8, to_kg: 0.5, save_pct: 87 },
            { from: 'Driving 20km', to: 'Cycling 20km', from_kg: 4.2, to_kg: 0.1, save_pct: 98 },
            { from: 'Long hot shower (15min)', to: 'Quick shower (5min)', from_kg: 2.8, to_kg: 0.9, save_pct: 68 },
            { from: 'Fast fashion t-shirt', to: 'Second-hand t-shirt', from_kg: 12.0, to_kg: 0.5, save_pct: 96 },
            { from: 'Tumble dryer', to: 'Air dry clothes', from_kg: 2.4, to_kg: 0, save_pct: 100 },
            { from: 'Bottled water (1L)', to: 'Tap water (1L)', from_kg: 0.16, to_kg: 0.0005, save_pct: 99.7 },
            { from: 'Domestic flight (500km)', to: 'Train (500km)', from_kg: 127.5, to_kg: 20.5, save_pct: 84 },
            { from: 'New smartphone', to: 'Refurbished smartphone', from_kg: 70, to_kg: 10, save_pct: 86 },
          ].map((sw, i) => (
            <div key={i} style={{ background: T.surfaceH, borderRadius: 12, padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: T.red, fontWeight: 600, marginBottom: 2 }}>Instead of</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.navy }}>{sw.from}</div>
                <div style={{ fontSize: 12, color: T.textMut }}>{sw.from_kg} kg CO2e</div>
              </div>
              <div style={{ fontSize: 20, color: T.green, fontWeight: 800, flexShrink: 0 }}>&rarr;</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: T.green, fontWeight: 600, marginBottom: 2 }}>Try</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.navy }}>{sw.to}</div>
                <div style={{ fontSize: 12, color: T.textMut }}>{sw.to_kg} kg CO2e</div>
              </div>
              <span style={{ ...badge('#f0fdf4', T.green), flexShrink: 0 }}>-{sw.save_pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Historical Carbon Trends (Global) ────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Global Historical Emissions Trend</h2>
        <p style={sectionSub}>Global CO2 emissions trajectory from 2005 to 2025 (approximate).</p>
        <div style={{ height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={[
              { year: '2005', emissions_Gt: 29.2 }, { year: '2007', emissions_Gt: 31.0 },
              { year: '2009', emissions_Gt: 30.5 }, { year: '2011', emissions_Gt: 33.4 },
              { year: '2013', emissions_Gt: 34.8 }, { year: '2015', emissions_Gt: 35.2 },
              { year: '2017', emissions_Gt: 36.0 }, { year: '2019', emissions_Gt: 36.7 },
              { year: '2020', emissions_Gt: 34.1 }, { year: '2021', emissions_Gt: 36.3 },
              { year: '2023', emissions_Gt: 36.8 }, { year: '2025', emissions_Gt: 37.0 },
            ]} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 12, fill: T.textSec }} domain={[28, 38]} />
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}` }} formatter={v => `${v} Gt`} />
              <Area type="monotone" dataKey="emissions_Gt" fill={T.red} fillOpacity={0.12} stroke={T.red} strokeWidth={2.5} name="Global CO2 (Gt)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ marginTop: 12, padding: 14, background: T.surfaceH, borderRadius: 8, fontSize: 13, color: T.textSec }}>
          Despite the Paris Agreement (2015) and COVID dip (2020), global emissions continue to rise. The 1.5C carbon budget is expected to be exhausted within 7 years at current rates.
        </div>
      </div>

      {/* ── Methodology & Sources ─────────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Methodology & Sources</h2>
        <p style={sectionSub}>Transparency about how these numbers are calculated.</p>
        <div style={grid(2, 20)}>
          <div>
            <div style={{ fontWeight: 700, color: T.navy, fontSize: 14, marginBottom: 10 }}>Data Sources</div>
            {[
              'Per-capita emissions: Global Carbon Project (2024)',
              'Activity factors: UK DEFRA Conversion Factors (2024)',
              'Food carbon data: Our World in Data / Poore & Nemecek (2018)',
              'Transport emissions: IEA Transport Database',
              'Carbon pricing: World Bank Carbon Pricing Dashboard',
              'Grid emission factors: Ember Climate (2024)',
            ].map((s, i) => (
              <div key={i} style={{ fontSize: 13, color: T.textSec, padding: '6px 0', borderBottom: `1px solid ${T.surfaceH}` }}>{s}</div>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: T.navy, fontSize: 14, marginBottom: 10 }}>Methodology Notes</div>
            {[
              'All figures represent lifecycle emissions where possible.',
              'Carbon prices are applied per tonne of CO2 equivalent.',
              'Country breakdowns use consumption-based accounting.',
              'Daily budget based on 2.3t annual (1.5C 50% pathway).',
              'Transport figures are per-passenger averages.',
              'Food figures include farm-to-plate supply chain.',
            ].map((s, i) => (
              <div key={i} style={{ fontSize: 13, color: T.textSec, padding: '6px 0', borderBottom: `1px solid ${T.surfaceH}` }}>{s}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 16. Export & Navigation ───────────────────────────────────── */}
      <div style={card}>
        <h2 style={sectionTitle}>Export & Navigate</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <button onClick={handleExportCSV} style={btnPrimary}>Export Carbon Economy Report (CSV)</button>
          <button onClick={handleExportJSON} style={btnOutline}>Export Personal Profile (JSON)</button>
          <button onClick={handlePrint} style={btnOutline}>Print Dashboard</button>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Navigate Sprint Z Modules</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Carbon Wallet', path: '/carbon-wallet' },
            { label: 'Carbon Calculator', path: '/carbon-calculator' },
            { label: 'Spending Analyzer', path: '/carbon-spending-analyzer' },
            { label: 'Consumer Hub', path: '/consumer-carbon-hub' },
            { label: 'Invoice Parser', path: '/carbon-invoice-parser' },
            { label: 'Product Anatomy', path: '/product-anatomy' },
            { label: 'EPD Database', path: '/epd-database' },
          ].map(n => (
            <button key={n.path} onClick={() => nav(n.path)} style={{ ...btnOutline, fontSize: 13, padding: '8px 16px' }}>
              {n.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
