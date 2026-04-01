import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Line, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis,
} from "recharts";

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  navy:"#0a1628", cream:"#f5f0e8", gold:"#c9a84c", goldLight:"#e8d5a3",
  slate:"#1e3a5f", steel:"#2d5282", muted:"#6b7280", white:"#ffffff",
  green:"#059669", red:"#dc2626", amber:"#d97706", teal:"#0e7490",
  indigo:"#4338ca", purple:"#7c3aed", hub:"#312e81",
  font:"'DM Sans', sans-serif", mono:"'JetBrains Mono', monospace",
};

// ─── Seed Data ────────────────────────────────────────────────────────────────
// 60 countries with full sovereign ESG + physical risk + NDC + debt metrics
const COUNTRIES = [
  { iso2:"NO", name:"Norway",         region:"Europe",  esgScore:88, physicalRisk:22, ndcRating:"A",  ndcScore:85, debtToGdp:43.0, climateVuln:28, carbonRev:12.1, debtRisk:18, greenBondBnUSD:4.8,  sovereignRating:"AAA" },
  { iso2:"SE", name:"Sweden",         region:"Europe",  esgScore:86, physicalRisk:24, ndcRating:"A",  ndcScore:83, debtToGdp:33.0, climateVuln:26, carbonRev:8.4,  debtRisk:16, greenBondBnUSD:6.2,  sovereignRating:"AAA" },
  { iso2:"DK", name:"Denmark",        region:"Europe",  esgScore:85, physicalRisk:26, ndcRating:"A",  ndcScore:82, debtToGdp:30.2, climateVuln:30, carbonRev:5.2,  debtRisk:15, greenBondBnUSD:8.1,  sovereignRating:"AAA" },
  { iso2:"NL", name:"Netherlands",    region:"Europe",  esgScore:84, physicalRisk:42, ndcRating:"A-", ndcScore:78, debtToGdp:50.1, climateVuln:48, carbonRev:6.8,  debtRisk:22, greenBondBnUSD:12.4, sovereignRating:"AAA" },
  { iso2:"DE", name:"Germany",        region:"Europe",  esgScore:82, physicalRisk:32, ndcRating:"A-", ndcScore:76, debtToGdp:65.9, climateVuln:34, carbonRev:18.2, debtRisk:24, greenBondBnUSD:38.8, sovereignRating:"AAA" },
  { iso2:"FR", name:"France",         region:"Europe",  esgScore:80, physicalRisk:38, ndcRating:"B+", ndcScore:72, debtToGdp:111.8,climateVuln:42, carbonRev:9.4,  debtRisk:34, greenBondBnUSD:42.6, sovereignRating:"AA-" },
  { iso2:"GB", name:"UK",             region:"Europe",  esgScore:79, physicalRisk:34, ndcRating:"A-", ndcScore:77, debtToGdp:101.2,climateVuln:38, carbonRev:8.2,  debtRisk:32, greenBondBnUSD:26.8, sovereignRating:"AA-" },
  { iso2:"CH", name:"Switzerland",    region:"Europe",  esgScore:87, physicalRisk:28, ndcRating:"A",  ndcScore:84, debtToGdp:40.5, climateVuln:32, carbonRev:4.1,  debtRisk:14, greenBondBnUSD:3.2,  sovereignRating:"AAA" },
  { iso2:"AU", name:"Australia",      region:"Pacific", esgScore:74, physicalRisk:62, ndcRating:"C+", ndcScore:48, debtToGdp:46.8, climateVuln:58, carbonRev:22.4, debtRisk:28, greenBondBnUSD:14.2, sovereignRating:"AAA" },
  { iso2:"NZ", name:"New Zealand",    region:"Pacific", esgScore:78, physicalRisk:58, ndcRating:"B",  ndcScore:64, debtToGdp:46.6, climateVuln:52, carbonRev:4.8,  debtRisk:22, greenBondBnUSD:5.1,  sovereignRating:"AAA" },
  { iso2:"JP", name:"Japan",          region:"Asia-DM", esgScore:73, physicalRisk:55, ndcRating:"B",  ndcScore:62, debtToGdp:261.3,climateVuln:54, carbonRev:18.2, debtRisk:42, greenBondBnUSD:18.4, sovereignRating:"A+" },
  { iso2:"KR", name:"South Korea",    region:"Asia-DM", esgScore:72, physicalRisk:46, ndcRating:"B+", ndcScore:68, debtToGdp:53.8, climateVuln:44, carbonRev:12.8, debtRisk:26, greenBondBnUSD:8.6,  sovereignRating:"AA-" },
  { iso2:"SG", name:"Singapore",      region:"Asia-DM", esgScore:76, physicalRisk:48, ndcRating:"B+", ndcScore:70, debtToGdp:169.5,climateVuln:56, carbonRev:2.1,  debtRisk:36, greenBondBnUSD:2.8,  sovereignRating:"AAA" },
  { iso2:"US", name:"USA",            region:"N America",esgScore:68, physicalRisk:52, ndcRating:"C+", ndcScore:52, debtToGdp:129.0,climateVuln:46, carbonRev:88.4, debtRisk:38, greenBondBnUSD:62.4, sovereignRating:"AA+" },
  { iso2:"CA", name:"Canada",         region:"N America",esgScore:75, physicalRisk:48, ndcRating:"C+", ndcScore:54, debtToGdp:106.4,climateVuln:42, carbonRev:32.8, debtRisk:30, greenBondBnUSD:16.2, sovereignRating:"AAA" },
  { iso2:"BR", name:"Brazil",         region:"LAC",     esgScore:54, physicalRisk:62, ndcRating:"B-", ndcScore:58, debtToGdp:88.1, climateVuln:58, carbonRev:22.4, debtRisk:54, greenBondBnUSD:9.8,  sovereignRating:"BB-" },
  { iso2:"MX", name:"Mexico",         region:"LAC",     esgScore:52, physicalRisk:58, ndcRating:"C",  ndcScore:48, debtToGdp:54.5, climateVuln:52, carbonRev:8.1,  debtRisk:41, greenBondBnUSD:5.4,  sovereignRating:"BBB-" },
  { iso2:"CL", name:"Chile",          region:"LAC",     esgScore:64, physicalRisk:52, ndcRating:"B",  ndcScore:65, debtToGdp:38.1, climateVuln:45, carbonRev:4.1,  debtRisk:29, greenBondBnUSD:3.2,  sovereignRating:"A-" },
  { iso2:"CO", name:"Colombia",       region:"LAC",     esgScore:51, physicalRisk:66, ndcRating:"B-", ndcScore:56, debtToGdp:61.2, climateVuln:63, carbonRev:5.2,  debtRisk:62, greenBondBnUSD:2.1,  sovereignRating:"BB+" },
  { iso2:"PE", name:"Peru",           region:"LAC",     esgScore:53, physicalRisk:68, ndcRating:"B",  ndcScore:62, debtToGdp:33.9, climateVuln:67, carbonRev:3.8,  debtRisk:38, greenBondBnUSD:1.0,  sovereignRating:"BBB" },
  { iso2:"IN", name:"India",          region:"Asia-EM", esgScore:48, physicalRisk:74, ndcRating:"C+", ndcScore:52, debtToGdp:83.0, climateVuln:71, carbonRev:41.2, debtRisk:58, greenBondBnUSD:7.5,  sovereignRating:"BBB-" },
  { iso2:"ID", name:"Indonesia",      region:"Asia-EM", esgScore:50, physicalRisk:76, ndcRating:"C+", ndcScore:50, debtToGdp:39.2, climateVuln:74, carbonRev:18.3, debtRisk:61, greenBondBnUSD:4.2,  sovereignRating:"BBB" },
  { iso2:"PH", name:"Philippines",    region:"Asia-EM", esgScore:46, physicalRisk:84, ndcRating:"B-", ndcScore:55, debtToGdp:57.2, climateVuln:82, carbonRev:3.1,  debtRisk:71, greenBondBnUSD:1.8,  sovereignRating:"BBB+" },
  { iso2:"TH", name:"Thailand",       region:"Asia-EM", esgScore:55, physicalRisk:62, ndcRating:"C+", ndcScore:50, debtToGdp:61.5, climateVuln:60, carbonRev:6.8,  debtRisk:44, greenBondBnUSD:2.4,  sovereignRating:"BBB+" },
  { iso2:"MY", name:"Malaysia",       region:"Asia-EM", esgScore:58, physicalRisk:56, ndcRating:"B-", ndcScore:58, debtToGdp:65.8, climateVuln:55, carbonRev:7.2,  debtRisk:33, greenBondBnUSD:3.1,  sovereignRating:"A-" },
  { iso2:"VN", name:"Vietnam",        region:"Asia-EM", esgScore:44, physicalRisk:78, ndcRating:"C",  ndcScore:44, debtToGdp:37.0, climateVuln:76, carbonRev:5.4,  debtRisk:64, greenBondBnUSD:0.9,  sovereignRating:"BB+" },
  { iso2:"BD", name:"Bangladesh",     region:"Asia-EM", esgScore:38, physicalRisk:90, ndcRating:"C",  ndcScore:42, debtToGdp:40.2, climateVuln:88, carbonRev:1.2,  debtRisk:82, greenBondBnUSD:0.3,  sovereignRating:"B+" },
  { iso2:"PK", name:"Pakistan",       region:"Asia-EM", esgScore:32, physicalRisk:87, ndcRating:"D",  ndcScore:28, debtToGdp:78.4, climateVuln:85, carbonRev:2.1,  debtRisk:88, greenBondBnUSD:0.5,  sovereignRating:"CCC+" },
  { iso2:"CN", name:"China",          region:"Asia-EM", esgScore:46, physicalRisk:58, ndcRating:"C",  ndcScore:46, debtToGdp:77.1, climateVuln:54, carbonRev:148.2,debtRisk:44, greenBondBnUSD:28.4, sovereignRating:"A+" },
  { iso2:"ZA", name:"South Africa",   region:"Africa",  esgScore:45, physicalRisk:68, ndcRating:"C+", ndcScore:50, debtToGdp:71.4, climateVuln:66, carbonRev:8.4,  debtRisk:65, greenBondBnUSD:2.8,  sovereignRating:"BB-" },
  { iso2:"KE", name:"Kenya",          region:"Africa",  esgScore:42, physicalRisk:80, ndcRating:"C+", ndcScore:52, debtToGdp:67.1, climateVuln:78, carbonRev:2.3,  debtRisk:76, greenBondBnUSD:0.5,  sovereignRating:"B" },
  { iso2:"NG", name:"Nigeria",        region:"Africa",  esgScore:36, physicalRisk:81, ndcRating:"D",  ndcScore:30, debtToGdp:39.1, climateVuln:79, carbonRev:6.1,  debtRisk:74, greenBondBnUSD:0.8,  sovereignRating:"B-" },
  { iso2:"ET", name:"Ethiopia",       region:"Africa",  esgScore:30, physicalRisk:86, ndcRating:"D",  ndcScore:26, debtToGdp:52.3, climateVuln:84, carbonRev:1.8,  debtRisk:89, greenBondBnUSD:0.1,  sovereignRating:"SD" },
  { iso2:"GH", name:"Ghana",          region:"Africa",  esgScore:34, physicalRisk:74, ndcRating:"D",  ndcScore:28, debtToGdp:92.4, climateVuln:72, carbonRev:1.4,  debtRisk:91, greenBondBnUSD:0.2,  sovereignRating:"SD" },
  { iso2:"EG", name:"Egypt",          region:"MENA",    esgScore:38, physicalRisk:72, ndcRating:"C",  ndcScore:44, debtToGdp:92.7, climateVuln:70, carbonRev:4.2,  debtRisk:78, greenBondBnUSD:1.4,  sovereignRating:"B-" },
  { iso2:"MA", name:"Morocco",        region:"MENA",    esgScore:48, physicalRisk:64, ndcRating:"B-", ndcScore:58, debtToGdp:71.5, climateVuln:62, carbonRev:3.5,  debtRisk:56, greenBondBnUSD:1.8,  sovereignRating:"BB+" },
  { iso2:"SA", name:"Saudi Arabia",   region:"MENA",    esgScore:42, physicalRisk:74, ndcRating:"C",  ndcScore:40, debtToGdp:26.2, climateVuln:76, carbonRev:44.2, debtRisk:28, greenBondBnUSD:5.6,  sovereignRating:"A+" },
  { iso2:"AE", name:"UAE",            region:"MENA",    esgScore:46, physicalRisk:72, ndcRating:"C",  ndcScore:44, debtToGdp:30.8, climateVuln:74, carbonRev:22.4, debtRisk:24, greenBondBnUSD:3.2,  sovereignRating:"AA-" },
  { iso2:"TR", name:"Turkey",         region:"EMEA-EM", esgScore:44, physicalRisk:56, ndcRating:"C",  ndcScore:44, debtToGdp:34.2, climateVuln:54, carbonRev:7.9,  debtRisk:48, greenBondBnUSD:3.5,  sovereignRating:"BB-" },
  { iso2:"PL", name:"Poland",         region:"Europe",  esgScore:64, physicalRisk:38, ndcRating:"B",  ndcScore:66, debtToGdp:49.0, climateVuln:38, carbonRev:9.1,  debtRisk:24, greenBondBnUSD:5.2,  sovereignRating:"A-" },
  { iso2:"RO", name:"Romania",        region:"Europe",  esgScore:58, physicalRisk:44, ndcRating:"B-", ndcScore:60, debtToGdp:48.8, climateVuln:44, carbonRev:4.2,  debtRisk:32, greenBondBnUSD:2.1,  sovereignRating:"BBB-" },
  { iso2:"HU", name:"Hungary",        region:"Europe",  esgScore:56, physicalRisk:40, ndcRating:"B",  ndcScore:62, debtToGdp:73.6, climateVuln:41, carbonRev:5.1,  debtRisk:28, greenBondBnUSD:3.4,  sovereignRating:"BBB" },
  { iso2:"UA", name:"Ukraine",        region:"EMEA-EM", esgScore:36, physicalRisk:58, ndcRating:"D",  ndcScore:32, debtToGdp:88.8, climateVuln:59, carbonRev:3.8,  debtRisk:77, greenBondBnUSD:0.4,  sovereignRating:"CCC" },
  { iso2:"RU", name:"Russia",         region:"EMEA-EM", esgScore:28, physicalRisk:52, ndcRating:"D",  ndcScore:22, debtToGdp:17.2, climateVuln:44, carbonRev:62.4, debtRisk:44, greenBondBnUSD:0.2,  sovereignRating:"CC" },
  { iso2:"IL", name:"Israel",         region:"MENA",    esgScore:66, physicalRisk:54, ndcRating:"B",  ndcScore:64, debtToGdp:61.2, climateVuln:52, carbonRev:4.2,  debtRisk:30, greenBondBnUSD:1.8,  sovereignRating:"A+" },
  { iso2:"ZM", name:"Zambia",         region:"Africa",  esgScore:28, physicalRisk:78, ndcRating:"D",  ndcScore:22, debtToGdp:141.2,climateVuln:77, carbonRev:1.1,  debtRisk:96, greenBondBnUSD:0.0,  sovereignRating:"SD" },
  { iso2:"EC", name:"Ecuador",        region:"LAC",     esgScore:42, physicalRisk:70, ndcRating:"C",  ndcScore:44, debtToGdp:58.4, climateVuln:69, carbonRev:4.8,  debtRisk:70, greenBondBnUSD:0.6,  sovereignRating:"B-" },
  { iso2:"AR", name:"Argentina",      region:"LAC",     esgScore:38, physicalRisk:64, ndcRating:"C-", ndcScore:36, debtToGdp:102.4,climateVuln:58, carbonRev:8.8,  debtRisk:82, greenBondBnUSD:0.4,  sovereignRating:"SD" },
  { iso2:"VE", name:"Venezuela",      region:"LAC",     esgScore:18, physicalRisk:72, ndcRating:"D",  ndcScore:12, debtToGdp:242.0,climateVuln:68, carbonRev:12.4, debtRisk:98, greenBondBnUSD:0.0,  sovereignRating:"SD" },
  { iso2:"LB", name:"Lebanon",        region:"MENA",    esgScore:20, physicalRisk:74, ndcRating:"D",  ndcScore:14, debtToGdp:182.0,climateVuln:72, carbonRev:0.4,  debtRisk:98, greenBondBnUSD:0.0,  sovereignRating:"SD" },
  { iso2:"LK", name:"Sri Lanka",      region:"Asia-EM", esgScore:34, physicalRisk:82, ndcRating:"C-", ndcScore:38, debtToGdp:115.0,climateVuln:80, carbonRev:0.8,  debtRisk:94, greenBondBnUSD:0.0,  sovereignRating:"SD" },
  { iso2:"FI", name:"Finland",        region:"Europe",  esgScore:88, physicalRisk:24, ndcRating:"A",  ndcScore:86, debtToGdp:75.8, climateVuln:26, carbonRev:4.8,  debtRisk:18, greenBondBnUSD:6.4,  sovereignRating:"AAA" },
  { iso2:"AT", name:"Austria",        region:"Europe",  esgScore:82, physicalRisk:34, ndcRating:"A-", ndcScore:78, debtToGdp:78.4, climateVuln:36, carbonRev:5.8,  debtRisk:22, greenBondBnUSD:4.2,  sovereignRating:"AA+" },
  { iso2:"BE", name:"Belgium",        region:"Europe",  esgScore:78, physicalRisk:38, ndcRating:"B+", ndcScore:72, debtToGdp:105.1,climateVuln:40, carbonRev:4.2,  debtRisk:30, greenBondBnUSD:8.6,  sovereignRating:"AA-" },
  { iso2:"ES", name:"Spain",          region:"Europe",  esgScore:74, physicalRisk:58, ndcRating:"B+", ndcScore:70, debtToGdp:112.8,climateVuln:62, carbonRev:8.2,  debtRisk:34, greenBondBnUSD:14.4, sovereignRating:"A-" },
  { iso2:"IT", name:"Italy",          region:"Europe",  esgScore:68, physicalRisk:56, ndcRating:"B",  ndcScore:65, debtToGdp:144.4,climateVuln:58, carbonRev:7.8,  debtRisk:40, greenBondBnUSD:10.2, sovereignRating:"BBB-" },
  { iso2:"PT", name:"Portugal",       region:"Europe",  esgScore:72, physicalRisk:52, ndcRating:"A-", ndcScore:78, debtToGdp:115.6,climateVuln:54, carbonRev:4.2,  debtRisk:32, greenBondBnUSD:5.4,  sovereignRating:"BBB+" },
  { iso2:"GR", name:"Greece",         region:"Europe",  esgScore:62, physicalRisk:62, ndcRating:"B-", ndcScore:62, debtToGdp:160.9,climateVuln:64, carbonRev:3.2,  debtRisk:44, greenBondBnUSD:2.8,  sovereignRating:"BBB-" },
  { iso2:"IE", name:"Ireland",        region:"Europe",  esgScore:83, physicalRisk:28, ndcRating:"A-", ndcScore:80, debtToGdp:42.8, climateVuln:30, carbonRev:3.8,  debtRisk:18, greenBondBnUSD:4.2,  sovereignRating:"AA-" },
  { iso2:"KZ", name:"Kazakhstan",     region:"EMEA-EM", esgScore:40, physicalRisk:52, ndcRating:"C",  ndcScore:40, debtToGdp:24.1, climateVuln:51, carbonRev:4.8,  debtRisk:38, greenBondBnUSD:0.8,  sovereignRating:"BBB-" },
];

// 20 portfolio positions
const PORTFOLIO = [
  { country:"Germany",      iso2:"DE", weightPct:8.4,  esgScore:82, physicalRisk:32, ndcRating:"A-", greenBondExposureMnUSD:2840 },
  { country:"France",       iso2:"FR", weightPct:7.2,  esgScore:80, physicalRisk:38, ndcRating:"B+", greenBondExposureMnUSD:2210 },
  { country:"Netherlands",  iso2:"NL", weightPct:5.8,  esgScore:84, physicalRisk:42, ndcRating:"A-", greenBondExposureMnUSD:1840 },
  { country:"UK",           iso2:"GB", weightPct:6.4,  esgScore:79, physicalRisk:34, ndcRating:"A-", greenBondExposureMnUSD:1920 },
  { country:"Japan",        iso2:"JP", weightPct:9.2,  esgScore:73, physicalRisk:55, ndcRating:"B",  greenBondExposureMnUSD:980  },
  { country:"South Korea",  iso2:"KR", weightPct:4.8,  esgScore:72, physicalRisk:46, ndcRating:"B+", greenBondExposureMnUSD:620  },
  { country:"Australia",    iso2:"AU", weightPct:5.2,  esgScore:74, physicalRisk:62, ndcRating:"C+", greenBondExposureMnUSD:540  },
  { country:"USA",          iso2:"US", weightPct:12.8, esgScore:68, physicalRisk:52, ndcRating:"C+", greenBondExposureMnUSD:1840 },
  { country:"Canada",       iso2:"CA", weightPct:4.4,  esgScore:75, physicalRisk:48, ndcRating:"C+", greenBondExposureMnUSD:480  },
  { country:"India",        iso2:"IN", weightPct:6.2,  esgScore:48, physicalRisk:74, ndcRating:"C+", greenBondExposureMnUSD:320  },
  { country:"Brazil",       iso2:"BR", weightPct:3.8,  esgScore:54, physicalRisk:62, ndcRating:"B-", greenBondExposureMnUSD:240  },
  { country:"China",        iso2:"CN", weightPct:8.8,  esgScore:46, physicalRisk:58, ndcRating:"C",  greenBondExposureMnUSD:480  },
  { country:"Mexico",       iso2:"MX", weightPct:2.4,  esgScore:52, physicalRisk:58, ndcRating:"C",  greenBondExposureMnUSD:120  },
  { country:"Poland",       iso2:"PL", weightPct:2.8,  esgScore:64, physicalRisk:38, ndcRating:"B",  greenBondExposureMnUSD:210  },
  { country:"Italy",        iso2:"IT", weightPct:4.2,  esgScore:68, physicalRisk:56, ndcRating:"B",  greenBondExposureMnUSD:280  },
  { country:"Spain",        iso2:"ES", weightPct:3.6,  esgScore:74, physicalRisk:58, ndcRating:"B+", greenBondExposureMnUSD:320  },
  { country:"South Africa", iso2:"ZA", weightPct:1.8,  esgScore:45, physicalRisk:68, ndcRating:"C+", greenBondExposureMnUSD:80   },
  { country:"Indonesia",    iso2:"ID", weightPct:2.2,  esgScore:50, physicalRisk:76, ndcRating:"C+", greenBondExposureMnUSD:96   },
  { country:"Saudi Arabia", iso2:"SA", weightPct:3.4,  esgScore:42, physicalRisk:74, ndcRating:"C",  greenBondExposureMnUSD:140  },
  { country:"Turkey",       iso2:"TR", weightPct:1.4,  esgScore:44, physicalRisk:56, ndcRating:"C",  greenBondExposureMnUSD:60   },
];

// 15 alerts
const ALERTS = [
  { id:"A001", type:"Downgrade",    country:"Pakistan",    iso2:"PK", severity:"high",   date:"2026-03-28", description:"S&P downgrades Pakistan to CCC+ on climate-fiscal double stress" },
  { id:"A002", type:"NdCRevision",  country:"India",       iso2:"IN", severity:"medium", date:"2026-03-25", description:"India revises NDC target — 50% non-fossil power by 2030" },
  { id:"A003", type:"DebtStress",   country:"Zambia",      iso2:"ZM", severity:"high",   date:"2026-03-22", description:"Zambia restructuring delayed — climate vulnerability cited in IMF review" },
  { id:"A004", type:"PhysicalEvent",country:"Bangladesh",  iso2:"BD", severity:"high",   date:"2026-03-20", description:"Cyclone Remal causes $4.2bn damage — sovereign credit watch negative" },
  { id:"A005", type:"Upgrade",      country:"Denmark",     iso2:"DK", severity:"low",    date:"2026-03-18", description:"Denmark achieves 2025 renewable target ahead of schedule" },
  { id:"A006", type:"PhysicalEvent",country:"Philippines", iso2:"PH", severity:"high",   date:"2026-03-15", description:"Super Typhoon season outlook: 38% higher intensity vs historical" },
  { id:"A007", type:"NdCRevision",  country:"Brazil",      iso2:"BR", severity:"medium", date:"2026-03-12", description:"Brazil strengthens NDC — net zero 2050 formally ratified" },
  { id:"A008", type:"Downgrade",    country:"Ghana",       iso2:"GH", severity:"high",   date:"2026-03-10", description:"Ghana SD rating maintained — debt restructuring milestone missed" },
  { id:"A009", type:"Upgrade",      country:"Chile",       iso2:"CL", severity:"low",    date:"2026-03-08", description:"Chile rated A- by S&P citing green bond success & NDC performance" },
  { id:"A010", type:"DebtStress",   country:"Egypt",       iso2:"EG", severity:"medium", date:"2026-03-05", description:"Egypt climate finance gap widens — IMF facility drawn $3.2bn" },
  { id:"A011", type:"PhysicalEvent",country:"Kenya",       iso2:"KE", severity:"medium", date:"2026-03-02", description:"East Africa drought — Kenya crop insurance trigger activated" },
  { id:"A012", type:"Upgrade",      country:"Morocco",     iso2:"MA", severity:"low",    date:"2026-02-28", description:"Morocco green bond oversubscribed 4.2x — investor confidence high" },
  { id:"A013", type:"NdCRevision",  country:"Indonesia",   iso2:"ID", severity:"medium", date:"2026-02-24", description:"Indonesia announces enhanced NDC — 43% emissions reduction by 2030" },
  { id:"A014", type:"DebtStress",   country:"Sri Lanka",   iso2:"LK", severity:"high",   date:"2026-02-20", description:"Sri Lanka restructuring — IMF flags climate vulnerability as risk multiplier" },
  { id:"A015", type:"PhysicalEvent",country:"Vietnam",     iso2:"VN", severity:"medium", date:"2026-02-18", description:"Mekong Delta salinity intrusion — agricultural output loss 12% projected" },
];

// 10 research reports
const RESEARCH = [
  { id:"R001", title:"Sovereign Climate Vulnerability 2026 Annual Outlook", author:"S&P Global Ratings", date:"2026-03-15", topic:"Physical Risk", keyFindings:["65% of EM sovereigns face material climate credit risk","Adaptation finance needs exceed $400bn annually","AAA-rated sovereigns face rising transition exposure"] },
  { id:"R002", title:"MDB Climate Finance Mobilisation — Closing the Gap", author:"World Bank Research", date:"2026-03-10", topic:"MDB Finance", keyFindings:["$236bn MDB climate lending in 2023","Mobilisation ratio improving to 2.3x","Adaptation underfunded relative to mitigation"] },
  { id:"R003", title:"NDC Alignment & Sovereign Bond Spreads", author:"OECD Climate Finance", date:"2026-03-05", topic:"NDC/Spreads", keyFindings:["40bps average climate premium for laggard NDCs","Strong NDC alignment correlates with -22bps spread benefit","D-rated NDC countries pay 180bps premium"] },
  { id:"R004", title:"Debt-for-Nature Swaps: Scaling to $100bn by 2030", author:"TNC/IEEFA", date:"2026-02-28", topic:"DNS Markets", keyFindings:["$3.7bn swaps completed 2020-2025","Pipeline of 28 deals under negotiation","IDA eligibility unlocks new frontier markets"] },
  { id:"R005", title:"Sovereign Green Bond Market 2025 Review", author:"Climate Bonds Initiative", date:"2026-02-20", topic:"Green Bonds", keyFindings:["$220bn sovereign green bonds outstanding","35 sovereign issuers globally","Use-of-proceeds: 48% energy, 28% transport"] },
  { id:"R006", title:"Asian Sovereign Climate Risk: Physical Exposure Deep Dive", author:"ADB Economics", date:"2026-02-15", topic:"Physical Risk", keyFindings:["Bangladesh, Philippines, Vietnam face >80 vulnerability scores","GDP-at-risk from physical events: 3-8% annually","Adaptation finance gap: $97bn annually in Asia"] },
  { id:"R007", title:"EM Debt Restructuring & Climate Nexus", author:"IMF Fiscal Affairs", date:"2026-02-10", topic:"Debt/Climate", keyFindings:["Climate-vulnerable countries 2.4x more likely to seek restructuring","G20 Common Framework needs climate clause","IMF climate conditionality emerging"] },
  { id:"R008", title:"Net Zero Sovereign Portfolio Construction", author:"MSCI ESG Research", date:"2026-02-05", topic:"Portfolio", keyFindings:["Paris-aligned sovereign portfolios outperform by 0.8% annually","NDC alignment better predictor than ESG scores","Physical risk overlay adds 15% portfolio diversification"] },
  { id:"R009", title:"Carbon Revenue & Fiscal Sustainability in EM", author:"Carbon Tracker", date:"2026-01-28", topic:"Carbon/Fiscal", keyFindings:["EM sovereigns have $480bn annual carbon revenue potential","Forest economies most undervalued in traditional ratings","Voluntary carbon market key for low-income countries"] },
  { id:"R010", title:"Sovereign ESG Rating Divergence — Why Do Providers Disagree?", author:"ECMI Brussels", date:"2026-01-20", topic:"ESG Ratings", keyFindings:["Average pairwise correlation: 0.62 across 5 providers","Social score most divergent dimension","Climate data quality key driver of disagreement"] },
];

// Board pack top risks
const BOARD_RISKS = [
  { rank:1, risk:"Bangladesh/Vietnam physical risk escalation",         severity:"Critical", action:"Reduce exposure >1.5% portfolio weight", module:"AX1/AX2" },
  { rank:2, risk:"Pakistan debt-climate spiral — rating collapse risk", severity:"High",     action:"Monitor CDS spread weekly, exit trigger at 200bps",   module:"AX3/AX4" },
  { rank:3, risk:"MDB mobilisation gap — adaptation underfunding",      severity:"High",     action:"Engage ADB/WBG on adaptation pipeline acceleration",   module:"AX5" },
  { rank:4, risk:"NDC revision calendar 2026 — 38 countries due",      severity:"Medium",   action:"Pre-position in high-conviction upgraders (Chile, Morocco)", module:"AX3" },
  { rank:5, risk:"Green bond spread compression — supply surge risk",   severity:"Medium",   action:"Extend duration on EIB/WBG issuances, limit EM exposure", module:"AX4/AX5" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const REGION_COLORS = { Europe:"#3b82f6","Asia-DM":"#10b981","Asia-EM":"#06b6d4","N America":"#8b5cf6",LAC:"#f59e0b",Africa:"#ef4444",MENA:"#ec4899","EMEA-EM":"#f97316",Pacific:"#84cc16" };
const SEVERITY_COLORS = { high:T.red, medium:T.amber, low:T.green };
const ALERT_TYPE_COLORS = { Upgrade:T.green, Downgrade:T.red, NdCRevision:T.indigo, DebtStress:T.amber, PhysicalEvent:T.teal };
const NDC_COLORS = { A:T.green,"A-":"#34d399","B+":"#86efac",B:T.amber,"B-":"#fcd34d","C+":"#fb923c",C:"#f97316","C-":"#ef4444",D:T.red };

const KpiCard = ({ label, value, sub, color=T.gold, onClick, route }) => (
  <div onClick={onClick} style={{ background:T.hub, border:`1px solid ${color}30`, borderRadius:8, padding:"16px 20px", minWidth:165, cursor:onClick?"pointer":"default", position:"relative" }}
    onMouseEnter={e => onClick && (e.currentTarget.style.borderColor=color)}
    onMouseLeave={e => onClick && (e.currentTarget.style.borderColor=`${color}30`)}>
    <div style={{ fontFamily:T.mono, fontSize:22, fontWeight:700, color }}>{value}</div>
    <div style={{ fontSize:12, color:T.goldLight, marginTop:2 }}>{label}</div>
    {sub && <div style={{ fontFamily:T.mono, fontSize:10, color:"#9ca3af", marginTop:3 }}>{sub}</div>}
    {route && <span style={{ position:"absolute", top:10, right:10, fontFamily:T.mono, fontSize:9, color:color, background:`${color}22`, border:`1px solid ${color}44`, borderRadius:3, padding:"1px 5px" }}>{route}</span>}
  </div>
);

const Badge = ({ label, color=T.gold }) => (
  <span style={{ background:`${color}22`, color, border:`1px solid ${color}55`, borderRadius:4, padding:"2px 7px", fontSize:10, fontFamily:T.mono, fontWeight:700, whiteSpace:"nowrap" }}>{label}</span>
);

const SectionHeader = ({ title }) => (
  <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold, letterSpacing:"0.12em", textTransform:"uppercase", borderBottom:`1px solid ${T.gold}40`, paddingBottom:6, marginBottom:14 }}>{title}</div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:T.hub, border:`1px solid ${T.gold}60`, borderRadius:6, padding:"10px 14px", fontFamily:T.mono, fontSize:11 }}>
      <div style={{ color:T.gold, fontWeight:700, marginBottom:4 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color||T.goldLight }}>
          {p.name}: <strong>{typeof p.value==="number" ? p.value.toLocaleString() : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SovereignEsgHubPage() {
  const [activeTab, setActiveTab]         = useState(0);
  const [sortField, setSortField]         = useState("esgScore");
  const [sortDir, setSortDir]             = useState("desc");
  const [regionFilter, setRegionFilter]   = useState("All");
  const [comparatorA, setComparatorA]     = useState("NO");
  const [comparatorB, setComparatorB]     = useState("IN");
  const [comparatorC, setComparatorC]     = useState("ZA");
  const [comparatorD, setComparatorD]     = useState("BR");
  const [alertFilter, setAlertFilter]     = useState("All");
  const [searchQuery, setSearchQuery]     = useState("");

  const TABS = ["Hub Overview","Global Heatmap Data","Country Comparator","Portfolio Overlay","Alert Monitor","Research Library","Board Pack"];

  const filteredCountries = useMemo(() => {
    let c = [...COUNTRIES];
    if (regionFilter !== "All") c = c.filter(x => x.region === regionFilter);
    if (searchQuery) c = c.filter(x => x.name.toLowerCase().includes(searchQuery.toLowerCase()) || x.iso2.toLowerCase().includes(searchQuery.toLowerCase()));
    c.sort((a,b) => {
      const av = a[sortField], bv = b[sortField];
      const dir = sortDir === "asc" ? 1 : -1;
      if (typeof av === "string") return av.localeCompare(bv) * dir;
      return (av - bv) * dir;
    });
    return c;
  }, [regionFilter, searchQuery, sortField, sortDir]);

  const portfolioEsgAvg = (PORTFOLIO.reduce((s,p) => s+(p.esgScore*p.weightPct),0)/PORTFOLIO.reduce((s,p)=>s+p.weightPct,0)).toFixed(1);
  const portfolioPhysAvg= (PORTFOLIO.reduce((s,p) => s+(p.physicalRisk*p.weightPct),0)/PORTFOLIO.reduce((s,p)=>s+p.weightPct,0)).toFixed(1);
  const totalGreenExposure= (PORTFOLIO.reduce((s,p)=>s+p.greenBondExposureMnUSD,0)/1000).toFixed(1);

  const comparatorCountries = [comparatorA,comparatorB,comparatorC,comparatorD].map(iso2 => COUNTRIES.find(c=>c.iso2===iso2)).filter(Boolean);

  const radarData = useMemo(() => [
    { axis:"ESG Score",     ...Object.fromEntries(comparatorCountries.map(c => [c.iso2, c.esgScore])) },
    { axis:"NDC Score",     ...Object.fromEntries(comparatorCountries.map(c => [c.iso2, c.ndcScore])) },
    { axis:"Phys Safety",   ...Object.fromEntries(comparatorCountries.map(c => [c.iso2, 100-c.physicalRisk])) },
    { axis:"Debt Safety",   ...Object.fromEntries(comparatorCountries.map(c => [c.iso2, 100-c.debtRisk])) },
    { axis:"Carbon Rev",    ...Object.fromEntries(comparatorCountries.map(c => [c.iso2, Math.min(100,c.carbonRev*1.5)])) },
    { axis:"Green Bonds",   ...Object.fromEntries(comparatorCountries.map(c => [c.iso2, Math.min(100,c.greenBondBnUSD*3)])) },
  ], [comparatorCountries]);

  const COMP_COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444"];

  const highAlerts = ALERTS.filter(a => a.severity==="high").length;
  const uniqueRegions = [...new Set(COUNTRIES.map(c=>c.region))];

  const toggleSort = (field) => {
    if (sortField===field) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const S = {
    page:    { background:T.cream, minHeight:"100vh", fontFamily:T.font },
    header:  { background:T.hub, padding:"20px 28px", borderBottom:`3px solid ${T.gold}` },
    modTag:  { fontFamily:T.mono, fontSize:10, color:T.gold, background:`${T.gold}18`, border:`1px solid ${T.gold}44`, borderRadius:4, padding:"2px 8px" },
    tabs:    { display:"flex", background:T.hub, borderBottom:`1px solid ${T.gold}40`, overflowX:"auto" },
    tab:     (a) => ({ padding:"10px 20px", cursor:"pointer", fontFamily:T.mono, fontSize:11, letterSpacing:"0.05em", color:a?T.gold:T.muted, borderBottom:a?`2px solid ${T.gold}`:"2px solid transparent", whiteSpace:"nowrap" }),
    body:    { padding:"22px 28px" },
    card:    { background:T.white, border:"1px solid #e5ddd0", borderRadius:8, padding:"18px 20px", marginBottom:18, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" },
    kpiRow:  { display:"flex", gap:14, flexWrap:"wrap", marginBottom:20 },
    grid2:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 },
    th:      { padding:"8px 12px", fontFamily:T.mono, fontSize:10, color:T.gold, textAlign:"left", background:T.hub, cursor:"pointer", whiteSpace:"nowrap" },
    td:      { padding:"7px 12px", fontSize:12, borderBottom:"1px solid #f0ece4" },
    statusBar:{ background:T.hub, borderTop:`1px solid ${T.gold}30`, padding:"6px 28px", display:"flex", gap:20, justifyContent:"flex-end" },
    input:   { padding:"7px 12px", borderRadius:6, border:`1px solid ${T.gold}60`, fontFamily:T.mono, fontSize:11, background:T.white, outline:"none" },
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
          <span style={S.modTag}>EP-AX6</span>
          <span style={{ color:T.gold, fontFamily:T.mono, fontSize:11 }}>SOVEREIGN CLIMATE RISK INTELLIGENCE — HUB</span>
        </div>
        <h1 style={{ margin:0, color:T.white, fontSize:22, fontWeight:700 }}>Sovereign ESG Hub</h1>
        <div style={{ color:"#94a3b8", fontSize:12, marginTop:4 }}>
          60 countries · All 5 AX modules integrated · Portfolio overlay · Alert monitor · Board pack
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {TABS.map((t,i) => <div key={i} style={S.tab(activeTab===i)} onClick={() => setActiveTab(i)}>{t}</div>)}
      </div>

      <div style={S.body}>

        {/* ══ TAB 0: HUB OVERVIEW ══ */}
        {activeTab === 0 && (
          <>
            <div style={{ background:T.hub, border:`1px solid ${T.gold}40`, borderRadius:8, padding:"14px 20px", marginBottom:18, display:"flex", gap:12, alignItems:"center" }}>
              <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold }}>SPRINT AX — SOVEREIGN & COUNTRY CLIMATE RISK INTELLIGENCE</div>
              <Badge label={`${highAlerts} High Alerts`} color={T.red} />
              <Badge label={`60 Countries`} color={T.teal} />
              <Badge label={`$${totalGreenExposure}bn Green Exposure`} color={T.green} />
            </div>

            <div style={S.kpiRow}>
              {[
                { label:"Sovereign Physical Risk", value:"EP-AX1", sub:"58 country physical scores", color:"#0891b2", route:"AX1" },
                { label:"NDC Alignment Tracker",   value:"EP-AX2", sub:"60 NDC ratings + targets",   color:"#059669", route:"AX2" },
                { label:"Sovereign ESG Scorer",    value:"EP-AX3", sub:"Multi-dim ESG scoring",       color:"#7c3aed", route:"AX3" },
                { label:"EM Debt & Climate Risk",  value:"EP-AX4", sub:"50 EM debt + green bonds",   color:"#d97706", route:"AX4" },
                { label:"MDB Climate Finance",     value:"EP-AX5", sub:"8 MDBs · 40 projects",       color:"#3b82f6", route:"AX5" },
                { label:"Sovereign ESG Hub",       value:"EP-AX6", sub:"This dashboard",             color:T.gold,   route:"AX6" },
              ].map(m => <KpiCard key={m.route} {...m} />)}
            </div>

            <div style={S.grid2}>
              <div style={S.card}>
                <SectionHeader title="Global ESG Score Distribution — 60 Countries" />
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={[
                    { range:"80-100", count:COUNTRIES.filter(c=>c.esgScore>=80).length,  label:"High ESG",  color:T.green  },
                    { range:"60-79",  count:COUNTRIES.filter(c=>c.esgScore>=60&&c.esgScore<80).length, label:"Good ESG", color:T.teal },
                    { range:"40-59",  count:COUNTRIES.filter(c=>c.esgScore>=40&&c.esgScore<60).length, label:"Mid ESG",  color:T.amber },
                    { range:"0-39",   count:COUNTRIES.filter(c=>c.esgScore<40).length,  label:"Low ESG",   color:T.red   },
                  ]} margin={{ top:5, right:10, bottom:5, left:-10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                    <XAxis dataKey="range" tick={{ fontFamily:T.mono, fontSize:10 }} />
                    <YAxis tick={{ fontFamily:T.mono, fontSize:10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Countries" radius={[4,4,0,0]}>
                      {[T.green,T.teal,T.amber,T.red].map((c,i) => <Cell key={i} fill={c} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={S.card}>
                <SectionHeader title="Top 5 Alerts — Active" />
                {ALERTS.filter(a=>a.severity==="high").slice(0,5).map(a => (
                  <div key={a.id} style={{ display:"flex", gap:10, padding:"8px 0", borderBottom:"1px solid #f0ece4", alignItems:"flex-start" }}>
                    <Badge label={a.type} color={ALERT_TYPE_COLORS[a.type]} />
                    <div>
                      <div style={{ fontSize:12, fontWeight:600 }}>{a.country}</div>
                      <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{a.description.slice(0,70)}…</div>
                    </div>
                    <Badge label={a.severity} color={SEVERITY_COLORS[a.severity]} />
                  </div>
                ))}
                <div onClick={() => setActiveTab(4)} style={{ marginTop:10, fontFamily:T.mono, fontSize:11, color:T.gold, cursor:"pointer" }}>
                  View all {ALERTS.length} alerts →
                </div>
              </div>
            </div>

            <div style={S.card}>
              <SectionHeader title="ESG Score vs Physical Risk — 60 Sovereigns (Bubble = Green Bond Volume)" />
              <ResponsiveContainer width="100%" height={340}>
                <ScatterChart margin={{ top:10, right:30, bottom:20, left:10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                  <XAxis dataKey="x" name="Physical Risk" type="number" tick={{ fontFamily:T.mono, fontSize:10 }}
                    label={{ value:"Physical Risk Score", position:"insideBottom", offset:-8, style:{ fontFamily:T.mono, fontSize:10, fill:T.muted } }} />
                  <YAxis dataKey="y" name="ESG Score" tick={{ fontFamily:T.mono, fontSize:10 }}
                    label={{ value:"ESG Score", angle:-90, position:"insideLeft", style:{ fontFamily:T.mono, fontSize:10, fill:T.muted } }} />
                  <ZAxis dataKey="z" range={[20,600]} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div style={{ background:T.hub, border:`1px solid ${T.gold}`, borderRadius:6, padding:"10px 14px", fontFamily:T.mono, fontSize:11, color:T.white }}>
                        <div style={{ color:T.gold, fontWeight:700 }}>{d.name} ({d.iso2})</div>
                        <div>ESG Score: {d.y}</div>
                        <div>Physical Risk: {d.x}</div>
                        <div>NDC Rating: {d.ndc}</div>
                        <div>Green Bonds: ${d.gb}bn</div>
                      </div>
                    );
                  }} />
                  {uniqueRegions.map(region => (
                    <Scatter key={region} name={region}
                      data={COUNTRIES.filter(c=>c.region===region).map(c=>({ x:c.physicalRisk, y:c.esgScore, z:Math.max(20,c.greenBondBnUSD*8), name:c.name, iso2:c.iso2, ndc:c.ndcRating, gb:c.greenBondBnUSD }))}
                      fill={REGION_COLORS[region]} fillOpacity={0.72} />
                  ))}
                  <Legend formatter={v=><span style={{ fontFamily:T.mono, fontSize:10 }}>{v}</span>} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ══ TAB 1: GLOBAL HEATMAP DATA ══ */}
        {activeTab === 1 && (
          <>
            <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
              <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                placeholder="Search country or ISO…" style={S.input} />
              {["All",...uniqueRegions].map(r => (
                <button key={r} onClick={() => setRegionFilter(r)}
                  style={{ padding:"5px 10px", borderRadius:4, border:`1px solid ${regionFilter===r?T.gold:"#ccc"}`, background:regionFilter===r?`${T.gold}22`:T.white, color:regionFilter===r?T.gold:T.muted, fontFamily:T.mono, fontSize:10, cursor:"pointer", whiteSpace:"nowrap" }}>
                  {r}
                </button>
              ))}
              <span style={{ fontFamily:T.mono, fontSize:10, color:T.muted }}>{filteredCountries.length} of {COUNTRIES.length}</span>
            </div>
            <div style={S.card}>
              <SectionHeader title="Sovereign ESG Global Data Table — Click Header to Sort" />
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      {[["Country","name"],["Region","region"],["ESG Score","esgScore"],["Physical Risk","physicalRisk"],["NDC Rating","ndcRating"],["Debt/GDP","debtToGdp"],["Climate Vuln","climateVuln"],["Debt Risk","debtRisk"],["Green Bonds","greenBondBnUSD"],["Rating","sovereignRating"]].map(([h,f])=>(
                        <th key={h} style={S.th} onClick={()=>toggleSort(f)}>
                          {h}{sortField===f?(sortDir==="asc"?" ↑":" ↓"):""}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCountries.map((c,i) => (
                      <tr key={c.iso2} style={{ background:i%2===0?T.white:"#faf8f4" }}>
                        <td style={{ ...S.td, fontWeight:600, whiteSpace:"nowrap" }}>{c.name}</td>
                        <td style={S.td}><Badge label={c.region} color={REGION_COLORS[c.region]} /></td>
                        <td style={{ ...S.td, fontFamily:T.mono, color:c.esgScore>=70?T.green:c.esgScore>=50?T.amber:T.red }}>{c.esgScore}</td>
                        <td style={{ ...S.td, fontFamily:T.mono, color:c.physicalRisk>=70?T.red:c.physicalRisk>=50?T.amber:T.green }}>{c.physicalRisk}</td>
                        <td style={S.td}><Badge label={c.ndcRating} color={NDC_COLORS[c.ndcRating]||T.muted} /></td>
                        <td style={{ ...S.td, fontFamily:T.mono, color:c.debtToGdp>=120?T.red:c.debtToGdp>=80?T.amber:T.green }}>{c.debtToGdp.toFixed(1)}%</td>
                        <td style={{ ...S.td, fontFamily:T.mono, color:c.climateVuln>=70?T.red:T.muted }}>{c.climateVuln}</td>
                        <td style={S.td}>
                          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                            <div style={{ width:40, background:"#f0ece4", height:5, borderRadius:2 }}>
                              <div style={{ background:c.debtRisk>75?T.red:c.debtRisk>50?T.amber:T.green, width:`${c.debtRisk}%`, height:"100%", borderRadius:2 }} />
                            </div>
                            <span style={{ fontFamily:T.mono, fontSize:10 }}>{c.debtRisk}</span>
                          </div>
                        </td>
                        <td style={{ ...S.td, fontFamily:T.mono, color:T.green }}>${c.greenBondBnUSD}</td>
                        <td style={S.td}><Badge label={c.sovereignRating} color={c.esgScore>=70?T.green:c.esgScore>=50?T.amber:T.red} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ TAB 2: COUNTRY COMPARATOR ══ */}
        {activeTab === 2 && (
          <>
            <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
              {[["Country A",comparatorA,setComparatorA,COMP_COLORS[0]],["Country B",comparatorB,setComparatorB,COMP_COLORS[1]],["Country C",comparatorC,setComparatorC,COMP_COLORS[2]],["Country D",comparatorD,setComparatorD,COMP_COLORS[3]]].map(([label,val,setter,color])=>(
                <div key={label}>
                  <div style={{ fontFamily:T.mono, fontSize:10, color, marginBottom:4 }}>{label}</div>
                  <select value={val} onChange={e=>setter(e.target.value)}
                    style={{ padding:"7px 12px", borderRadius:6, border:`1px solid ${color}`, fontFamily:T.mono, fontSize:11, background:T.white }}>
                    {COUNTRIES.map(c=><option key={c.iso2} value={c.iso2}>{c.name}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div style={S.card}>
              <SectionHeader title="Multi-Dimension Radar Comparison" />
              <ResponsiveContainer width="100%" height={360}>
                <RadarChart data={radarData} margin={{ top:20, right:40, bottom:20, left:40 }}>
                  <PolarGrid stroke="#e5ddd0" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontFamily:T.mono, fontSize:10 }} />
                  <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fontFamily:T.mono, fontSize:9 }} />
                  <Tooltip content={<CustomTooltip />} />
                  {comparatorCountries.map((c,i) => (
                    <Radar key={c.iso2} name={c.name} dataKey={c.iso2} stroke={COMP_COLORS[i]} fill={COMP_COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
                  ))}
                  <Legend formatter={v=><span style={{ fontFamily:T.mono, fontSize:10 }}>{v}</span>} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div style={S.card}>
              <SectionHeader title="Side-by-Side Metric Comparison" />
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      <th style={S.th}>Metric</th>
                      {comparatorCountries.map((c,i) => <th key={c.iso2} style={{ ...S.th, color:COMP_COLORS[i] }}>{c.name}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["ESG Score",              c=>c.esgScore,        v=>v>=70?T.green:v>=50?T.amber:T.red],
                      ["Physical Risk",          c=>c.physicalRisk,    v=>v>=70?T.red:v>=50?T.amber:T.green],
                      ["NDC Rating",             c=>c.ndcRating,       ()=>T.indigo],
                      ["NDC Score",              c=>c.ndcScore,        v=>v>=70?T.green:v>=50?T.amber:T.red],
                      ["Debt/GDP %",             c=>`${c.debtToGdp}%`, ()=>T.muted],
                      ["Climate Vulnerability",  c=>c.climateVuln,     v=>v>=70?T.red:v>=50?T.amber:T.green],
                      ["Carbon Rev Potential",   c=>`$${c.carbonRev}bn`,()=>T.teal],
                      ["Debt Risk Score",        c=>c.debtRisk,        v=>v>=70?T.red:v>=50?T.amber:T.green],
                      ["Green Bonds Issued",     c=>`$${c.greenBondBnUSD}bn`,()=>T.green],
                      ["Sovereign Rating",       c=>c.sovereignRating, ()=>T.gold],
                    ].map(([metric,valFn,colorFn],ri) => (
                      <tr key={metric} style={{ background:ri%2===0?T.white:"#faf8f4" }}>
                        <td style={{ ...S.td, fontFamily:T.mono, fontSize:11, color:T.muted, fontWeight:600 }}>{metric}</td>
                        {comparatorCountries.map((c,i) => {
                          const val = valFn(c);
                          const color = colorFn(typeof val==="number"?val:0);
                          return <td key={c.iso2} style={{ ...S.td, fontFamily:T.mono, fontWeight:700, color }}>{val}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ TAB 3: PORTFOLIO OVERLAY ══ */}
        {activeTab === 3 && (
          <>
            <div style={S.kpiRow}>
              <KpiCard label="Portfolio ESG Score (wt avg)"   value={portfolioEsgAvg}  sub="vs global avg 58.1" color={T.green} />
              <KpiCard label="Portfolio Physical Risk (wt avg)" value={portfolioPhysAvg} sub="vs global avg 55.2" color={T.amber} />
              <KpiCard label="Green Bond Exposure"            value={`$${totalGreenExposure}bn`} sub="20 positions" color={T.teal} />
              <KpiCard label="Portfolio Countries"            value={PORTFOLIO.length}   sub="Sovereign positions" />
            </div>
            <div style={S.card}>
              <SectionHeader title="Portfolio Positions — ESG Score vs Physical Risk by Weight" />
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={PORTFOLIO.sort((a,b)=>b.weightPct-a.weightPct)} margin={{ top:5, right:20, bottom:30, left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                  <XAxis dataKey="country" tick={{ fontFamily:T.mono, fontSize:9, angle:-35, textAnchor:"end" }} />
                  <YAxis yAxisId="left"  tick={{ fontFamily:T.mono, fontSize:9 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontFamily:T.mono, fontSize:9 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={v=><span style={{ fontFamily:T.mono, fontSize:10 }}>{v}</span>} />
                  <Bar yAxisId="left" dataKey="esgScore"    name="ESG Score"     fill={`${T.green}88`} radius={[3,3,0,0]} />
                  <Bar yAxisId="left" dataKey="physicalRisk" name="Physical Risk" fill={`${T.red}88`}   radius={[3,3,0,0]} />
                  <Line yAxisId="right" type="monotone" dataKey="weightPct" name="Weight %" stroke={T.gold} strokeWidth={2} dot={{ fill:T.gold, r:3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={S.card}>
              <SectionHeader title="Portfolio Holdings Detail" />
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>{["Country","Weight %","ESG Score","Physical Risk","NDC Rating","Green Bond Exposure ($mn)","Risk Flag"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {[...PORTFOLIO].sort((a,b)=>b.weightPct-a.weightPct).map((p,i) => {
                      const riskFlag = p.physicalRisk>70?"High Physical":p.esgScore<50?"Low ESG":p.ndcRating==="C+"||p.ndcRating==="C"?"NDC Laggard":"—";
                      return (
                        <tr key={p.iso2} style={{ background:i%2===0?T.white:"#faf8f4" }}>
                          <td style={{ ...S.td, fontWeight:600 }}>{p.country}</td>
                          <td style={{ ...S.td, fontFamily:T.mono, color:T.gold }}>{p.weightPct.toFixed(1)}%</td>
                          <td style={{ ...S.td, fontFamily:T.mono, color:p.esgScore>=70?T.green:p.esgScore>=50?T.amber:T.red }}>{p.esgScore}</td>
                          <td style={{ ...S.td, fontFamily:T.mono, color:p.physicalRisk>=70?T.red:p.physicalRisk>=50?T.amber:T.green }}>{p.physicalRisk}</td>
                          <td style={S.td}><Badge label={p.ndcRating} color={NDC_COLORS[p.ndcRating]||T.muted} /></td>
                          <td style={{ ...S.td, fontFamily:T.mono, color:p.greenBondExposureMnUSD>500?T.green:T.muted }}>${p.greenBondExposureMnUSD.toLocaleString()}</td>
                          <td style={S.td}>{riskFlag!=="—"?<Badge label={riskFlag} color={T.amber} />:<span style={{ color:T.muted, fontSize:11 }}>—</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ TAB 4: ALERT MONITOR ══ */}
        {activeTab === 4 && (
          <>
            <div style={S.kpiRow}>
              <KpiCard label="Total Active Alerts"     value={ALERTS.length}    sub="Last 45 days" />
              <KpiCard label="High Severity"           value={ALERTS.filter(a=>a.severity==="high").length}   sub="Immediate attention" color={T.red} />
              <KpiCard label="Medium Severity"         value={ALERTS.filter(a=>a.severity==="medium").length} sub="Monitor closely"     color={T.amber} />
              <KpiCard label="Upgrades"                value={ALERTS.filter(a=>a.type==="Upgrade").length}    sub="Positive signals"   color={T.green} />
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
              {["All","Upgrade","Downgrade","NdCRevision","DebtStress","PhysicalEvent"].map(t => (
                <button key={t} onClick={()=>setAlertFilter(t)}
                  style={{ padding:"5px 11px", borderRadius:4, border:`1px solid ${alertFilter===t?ALERT_TYPE_COLORS[t]||T.gold:"#ccc"}`, background:alertFilter===t?`${ALERT_TYPE_COLORS[t]||T.gold}22`:T.white, color:alertFilter===t?ALERT_TYPE_COLORS[t]||T.gold:T.muted, fontFamily:T.mono, fontSize:10, cursor:"pointer" }}>
                  {t}
                </button>
              ))}
            </div>
            <div style={S.card}>
              <SectionHeader title="Alert Feed" />
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {ALERTS.filter(a=>alertFilter==="All"||a.type===alertFilter).map(a => (
                  <div key={a.id} style={{ background:"#faf8f4", border:`1px solid ${SEVERITY_COLORS[a.severity]}33`, borderLeft:`4px solid ${SEVERITY_COLORS[a.severity]}`, borderRadius:6, padding:"12px 16px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <Badge label={a.type} color={ALERT_TYPE_COLORS[a.type]} />
                        <span style={{ fontWeight:700, fontSize:13 }}>{a.country}</span>
                        <Badge label={a.iso2} color={T.muted} />
                      </div>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <Badge label={a.severity.toUpperCase()} color={SEVERITY_COLORS[a.severity]} />
                        <span style={{ fontFamily:T.mono, fontSize:10, color:T.muted }}>{a.date}</span>
                      </div>
                    </div>
                    <div style={{ fontSize:12, color:"#374151" }}>{a.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══ TAB 5: RESEARCH LIBRARY ══ */}
        {activeTab === 5 && (
          <>
            <div style={S.kpiRow}>
              <KpiCard label="Research Reports"    value={RESEARCH.length} sub="Current quarter" />
              <KpiCard label="Topics Covered"      value="10" sub="Physical, NDC, Finance, Debt" color={T.teal} />
              <KpiCard label="Latest Publication"  value="2026-03-15" sub="S&P Sovereign Climate" color={T.gold} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:14 }}>
              {RESEARCH.map(r => (
                <div key={r.id} style={{ background:T.white, border:"1px solid #e5ddd0", borderRadius:8, padding:"16px 18px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <Badge label={r.topic} color={T.indigo} />
                    <span style={{ fontFamily:T.mono, fontSize:10, color:T.muted }}>{r.date}</span>
                  </div>
                  <h3 style={{ margin:"0 0 6px", fontSize:13, lineHeight:1.4 }}>{r.title}</h3>
                  <div style={{ fontFamily:T.mono, fontSize:10, color:T.muted, marginBottom:10 }}>{r.author}</div>
                  <div style={{ fontSize:11, color:"#374151" }}>
                    <div style={{ fontFamily:T.mono, fontSize:10, color:T.gold, marginBottom:4 }}>KEY FINDINGS</div>
                    {r.keyFindings.map((f,i) => (
                      <div key={i} style={{ display:"flex", gap:6, marginBottom:3 }}>
                        <span style={{ color:T.gold, flexShrink:0 }}>▸</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══ TAB 6: BOARD PACK ══ */}
        {activeTab === 6 && (
          <>
            <div style={{ background:T.hub, border:`1px solid ${T.gold}`, borderRadius:8, padding:"16px 22px", marginBottom:18 }}>
              <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold, marginBottom:4 }}>SOVEREIGN ESG HUB — Q1 2026 BOARD SUMMARY</div>
              <div style={{ color:T.white, fontSize:14 }}>Prepared for Investment Committee · 2026-04-01 · Confidential</div>
            </div>

            <div style={S.kpiRow}>
              <KpiCard label="Portfolio ESG (wt avg)"    value={portfolioEsgAvg}         sub="vs benchmark 61.2 (+0.9)" color={T.green} />
              <KpiCard label="Physical Risk Exposure"     value={portfolioPhysAvg}        sub="vs benchmark 52.8 (+2.1)" color={T.amber} />
              <KpiCard label="Green Bond Exposure"        value={`$${totalGreenExposure}bn`} sub="18.4% of sovereign book" color={T.teal} />
              <KpiCard label="High Severity Alerts"       value={highAlerts}             sub="Require immediate action" color={T.red} />
              <KpiCard label="Countries on Watch"         value={ALERTS.filter(a=>a.severity==="high").length} sub="Negative outlook" color={T.amber} />
            </div>

            <div style={S.grid2}>
              <div style={S.card}>
                <SectionHeader title="Portfolio vs Benchmark — Key Metrics" />
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={[
                    { metric:"ESG Score",       portfolio:parseFloat(portfolioEsgAvg), benchmark:61.2 },
                    { metric:"NDC Alignment",   portfolio:64, benchmark:58 },
                    { metric:"Physical Safety", portfolio:100-parseFloat(portfolioPhysAvg), benchmark:47.2 },
                    { metric:"Debt Safety",     portfolio:58, benchmark:52 },
                    { metric:"Green Bonds %",   portfolio:18.4, benchmark:12.1 },
                  ]} layout="vertical" margin={{ top:5, right:30, bottom:5, left:80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                    <XAxis type="number" tick={{ fontFamily:T.mono, fontSize:9 }} domain={[0,100]} />
                    <YAxis dataKey="metric" type="category" tick={{ fontFamily:T.mono, fontSize:9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={v=><span style={{ fontFamily:T.mono, fontSize:10 }}>{v}</span>} />
                    <Bar dataKey="portfolio"  name="Portfolio"  fill={T.indigo} radius={[0,3,3,0]} />
                    <Bar dataKey="benchmark"  name="Benchmark"  fill={`${T.muted}66`} radius={[0,3,3,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={S.card}>
                <SectionHeader title="Sovereign ESG Radar — Portfolio Composite vs Benchmark" />
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={[
                    { axis:"ESG Score",     portfolio:parseFloat(portfolioEsgAvg), benchmark:61 },
                    { axis:"NDC Align",     portfolio:64, benchmark:58 },
                    { axis:"Phys Safety",   portfolio:100-parseFloat(portfolioPhysAvg), benchmark:47 },
                    { axis:"Debt Safety",   portfolio:58, benchmark:52 },
                    { axis:"Green Bonds",   portfolio:72, benchmark:48 },
                    { axis:"Transparency",  portfolio:68, benchmark:61 },
                  ]} margin={{ top:10, right:30, bottom:10, left:30 }}>
                    <PolarGrid stroke="#e5ddd0" />
                    <PolarAngleAxis dataKey="axis" tick={{ fontFamily:T.mono, fontSize:9 }} />
                    <PolarRadiusAxis angle={30} domain={[0,100]} tick={false} />
                    <Radar name="Portfolio"  dataKey="portfolio"  stroke={T.indigo} fill={T.indigo} fillOpacity={0.3} />
                    <Radar name="Benchmark"  dataKey="benchmark"  stroke={T.muted}  fill={T.muted}  fillOpacity={0.15} />
                    <Legend formatter={v=><span style={{ fontFamily:T.mono, fontSize:10 }}>{v}</span>} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={S.card}>
              <SectionHeader title="Top 5 Risks — Requires Board Attention" />
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {BOARD_RISKS.map(r => (
                  <div key={r.rank} style={{ background:"#faf8f4", border:`1px solid ${r.severity==="Critical"?T.red:r.severity==="High"?T.amber:T.muted}33`, borderLeft:`4px solid ${r.severity==="Critical"?T.red:r.severity==="High"?T.amber:T.muted}`, borderRadius:6, padding:"12px 16px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <span style={{ fontFamily:T.mono, fontSize:12, color:T.muted }}>#{r.rank}</span>
                        <Badge label={r.severity} color={r.severity==="Critical"?T.red:r.severity==="High"?T.amber:T.green} />
                        <Badge label={r.module} color={T.indigo} />
                      </div>
                    </div>
                    <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>{r.risk}</div>
                    <div style={{ fontFamily:T.mono, fontSize:11, color:T.teal }}>Action: {r.action}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <SectionHeader title="Opportunities — Positive Signals This Quarter" />
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                {[
                  { title:"Chile ESG Upgrade", desc:"A- rating confirmed, NDC outperformance — consider increasing weight", color:T.green },
                  { title:"Morocco Green Bond", desc:"4.2x oversubscribed deal — strong signal for renewable transition", color:T.teal },
                  { title:"Brazil NDC Ratification", desc:"Net-zero 2050 locked in law — positive for long-duration exposure", color:T.indigo },
                  { title:"Denmark 2025 Target", desc:"Renewable target achieved early — quality ESG leader position", color:T.green },
                  { title:"Indonesia Enhanced NDC", desc:"43% reduction target strengthened — climate finance flows accelerating", color:T.teal },
                  { title:"EIB Green Bond Demand", desc:"$112bn mobilised — co-invest alongside MDB for blended returns", color:T.indigo },
                ].map((op,i) => (
                  <div key={i} style={{ background:`${op.color}0f`, border:`1px solid ${op.color}33`, borderRadius:6, padding:"12px 14px" }}>
                    <div style={{ display:"flex", gap:6, marginBottom:6 }}>
                      <span style={{ color:op.color, fontSize:14 }}>▲</span>
                      <span style={{ fontWeight:700, fontSize:12 }}>{op.title}</span>
                    </div>
                    <div style={{ fontSize:11, color:"#374151" }}>{op.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Status bar */}
      <div style={S.statusBar}>
        {[["MODULE","EP-AX6"],["COUNTRIES","60"],["PORTFOLIO","20"],["ALERTS",`${ALERTS.length}`],["REPORTS",`${RESEARCH.length}`],["UPDATED","2026-Q1"]].map(([k,v]) => (
          <span key={k} style={{ fontFamily:T.mono, fontSize:9, color:T.muted }}>{k}: <span style={{ color:T.gold }}>{v}</span></span>
        ))}
      </div>
    </div>
  );
}
