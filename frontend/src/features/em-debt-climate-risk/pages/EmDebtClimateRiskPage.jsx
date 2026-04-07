import React, { useState, useMemo } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ComposedChart, Line, Area, ResponsiveContainer, Cell, LabelList,
} from "recharts";

// ─── Theme ───────────────────────────────────────────────────────────────────
const T = {
  navy: "#0a1628", cream: "#f5f0e8", gold: "#c9a84c", goldLight: "#e8d5a3",
  slate: "#1e3a5f", steel: "#2d5282", muted: "#6b7280", white: "#ffffff",
  green: "#059669", red: "#dc2626", amber: "#d97706", teal: "#0e7490",
  indigo: "#4338ca", purple: "#7c3aed",
  card: '#ffffff', sub: '#5c6b7e', indigo: '#4f46e5', font: "'DM Sans', sans-serif", mono: "'JetBrains Mono', monospace",
};

// ─── Seed Data ────────────────────────────────────────────────────────────────
const EM_COUNTRIES = [
  { iso2:"BR", name:"Brazil",       region:"LAC",  debtToGdpPct:88.1,  fiscalBalancePct:-8.1,  foreignCurrencyDebtPct:34, climateVulnerabilityScore:58, creditRating:"BB-",  climateCreditRiskAdj:42,  greenBondIssuedBnUSD:9.8,  sustainabilityLinkedBondBnUSD:4.2, debtForNatureSwapCompleted:true,  debtForNatureSwapSizeMnUSD:180,  carbonRevenuePotentialBnUSD:22.4, ndcFinancingGapBnUSD:61,  climateDebtRiskScore:54, gdpBnUSD:2080 },
  { iso2:"MX", name:"Mexico",       region:"LAC",  debtToGdpPct:54.5,  fiscalBalancePct:-3.8,  foreignCurrencyDebtPct:41, climateVulnerabilityScore:52, creditRating:"BBB-", climateCreditRiskAdj:28,  greenBondIssuedBnUSD:5.4,  sustainabilityLinkedBondBnUSD:2.1, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:8.1,  ndcFinancingGapBnUSD:43,  climateDebtRiskScore:41, gdpBnUSD:1323 },
  { iso2:"CO", name:"Colombia",     region:"LAC",  debtToGdpPct:61.2,  fiscalBalancePct:-4.5,  foreignCurrencyDebtPct:52, climateVulnerabilityScore:63, creditRating:"BB+",  climateCreditRiskAdj:55,  greenBondIssuedBnUSD:2.1,  sustainabilityLinkedBondBnUSD:0.8, debtForNatureSwapCompleted:true,  debtForNatureSwapSizeMnUSD:245,  carbonRevenuePotentialBnUSD:5.2,  ndcFinancingGapBnUSD:28,  climateDebtRiskScore:62, gdpBnUSD:344 },
  { iso2:"PE", name:"Peru",         region:"LAC",  debtToGdpPct:33.9,  fiscalBalancePct:-2.7,  foreignCurrencyDebtPct:47, climateVulnerabilityScore:67, creditRating:"BBB",  climateCreditRiskAdj:22,  greenBondIssuedBnUSD:1.0,  sustainabilityLinkedBondBnUSD:0.3, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:3.8,  ndcFinancingGapBnUSD:15,  climateDebtRiskScore:38, gdpBnUSD:242 },
  { iso2:"CL", name:"Chile",        region:"LAC",  debtToGdpPct:38.1,  fiscalBalancePct:-3.1,  foreignCurrencyDebtPct:55, climateVulnerabilityScore:45, creditRating:"A-",   climateCreditRiskAdj:18,  greenBondIssuedBnUSD:3.2,  sustainabilityLinkedBondBnUSD:1.4, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:4.1,  ndcFinancingGapBnUSD:12,  climateDebtRiskScore:29, gdpBnUSD:317 },
  { iso2:"IN", name:"India",        region:"Asia", debtToGdpPct:83.0,  fiscalBalancePct:-6.4,  foreignCurrencyDebtPct:19, climateVulnerabilityScore:71, creditRating:"BBB-", climateCreditRiskAdj:38,  greenBondIssuedBnUSD:7.5,  sustainabilityLinkedBondBnUSD:3.1, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:41.2, ndcFinancingGapBnUSD:182, climateDebtRiskScore:58, gdpBnUSD:3750 },
  { iso2:"ID", name:"Indonesia",    region:"Asia", debtToGdpPct:39.2,  fiscalBalancePct:-2.8,  foreignCurrencyDebtPct:38, climateVulnerabilityScore:74, creditRating:"BBB",  climateCreditRiskAdj:44,  greenBondIssuedBnUSD:4.2,  sustainabilityLinkedBondBnUSD:1.9, debtForNatureSwapCompleted:true,  debtForNatureSwapSizeMnUSD:485,  carbonRevenuePotentialBnUSD:18.3, ndcFinancingGapBnUSD:97,  climateDebtRiskScore:61, gdpBnUSD:1319 },
  { iso2:"PH", name:"Philippines",  region:"Asia", debtToGdpPct:57.2,  fiscalBalancePct:-5.1,  foreignCurrencyDebtPct:44, climateVulnerabilityScore:82, creditRating:"BBB+", climateCreditRiskAdj:52,  greenBondIssuedBnUSD:1.8,  sustainabilityLinkedBondBnUSD:0.6, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:3.1,  ndcFinancingGapBnUSD:41,  climateDebtRiskScore:71, gdpBnUSD:405 },
  { iso2:"VN", name:"Vietnam",      region:"Asia", debtToGdpPct:37.0,  fiscalBalancePct:-2.9,  foreignCurrencyDebtPct:29, climateVulnerabilityScore:76, creditRating:"BB+",  climateCreditRiskAdj:46,  greenBondIssuedBnUSD:0.9,  sustainabilityLinkedBondBnUSD:0.2, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:5.4,  ndcFinancingGapBnUSD:52,  climateDebtRiskScore:64, gdpBnUSD:409 },
  { iso2:"TH", name:"Thailand",     region:"Asia", debtToGdpPct:61.5,  fiscalBalancePct:-3.4,  foreignCurrencyDebtPct:33, climateVulnerabilityScore:60, creditRating:"BBB+", climateCreditRiskAdj:24,  greenBondIssuedBnUSD:2.4,  sustainabilityLinkedBondBnUSD:0.9, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:6.8,  ndcFinancingGapBnUSD:34,  climateDebtRiskScore:44, gdpBnUSD:544 },
  { iso2:"MY", name:"Malaysia",     region:"Asia", debtToGdpPct:65.8,  fiscalBalancePct:-3.5,  foreignCurrencyDebtPct:30, climateVulnerabilityScore:55, creditRating:"A-",   climateCreditRiskAdj:19,  greenBondIssuedBnUSD:3.1,  sustainabilityLinkedBondBnUSD:1.2, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:7.2,  ndcFinancingGapBnUSD:18,  climateDebtRiskScore:33, gdpBnUSD:400 },
  { iso2:"BD", name:"Bangladesh",   region:"Asia", debtToGdpPct:40.2,  fiscalBalancePct:-5.2,  foreignCurrencyDebtPct:48, climateVulnerabilityScore:88, creditRating:"B+",   climateCreditRiskAdj:91,  greenBondIssuedBnUSD:0.3,  sustainabilityLinkedBondBnUSD:0.1, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:1.2,  ndcFinancingGapBnUSD:38,  climateDebtRiskScore:82, gdpBnUSD:460 },
  { iso2:"PK", name:"Pakistan",     region:"Asia", debtToGdpPct:78.4,  fiscalBalancePct:-7.6,  foreignCurrencyDebtPct:54, climateVulnerabilityScore:85, creditRating:"CCC+", climateCreditRiskAdj:145, greenBondIssuedBnUSD:0.5,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:2.1,  ndcFinancingGapBnUSD:29,  climateDebtRiskScore:88, gdpBnUSD:338 },
  { iso2:"LK", name:"Sri Lanka",    region:"Asia", debtToGdpPct:115.0, fiscalBalancePct:-9.8,  foreignCurrencyDebtPct:62, climateVulnerabilityScore:80, creditRating:"SD",   climateCreditRiskAdj:210, greenBondIssuedBnUSD:0.0,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:0.8,  ndcFinancingGapBnUSD:12,  climateDebtRiskScore:94, gdpBnUSD:84 },
  { iso2:"ZA", name:"South Africa", region:"Africa", debtToGdpPct:71.4, fiscalBalancePct:-5.8, foreignCurrencyDebtPct:38, climateVulnerabilityScore:66, creditRating:"BB-",  climateCreditRiskAdj:68,  greenBondIssuedBnUSD:2.8,  sustainabilityLinkedBondBnUSD:1.1, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:8.4,  ndcFinancingGapBnUSD:21,  climateDebtRiskScore:65, gdpBnUSD:399 },
  { iso2:"KE", name:"Kenya",        region:"Africa", debtToGdpPct:67.1, fiscalBalancePct:-5.4, foreignCurrencyDebtPct:59, climateVulnerabilityScore:78, creditRating:"B",    climateCreditRiskAdj:118, greenBondIssuedBnUSD:0.5,  sustainabilityLinkedBondBnUSD:0.2, debtForNatureSwapCompleted:true,  debtForNatureSwapSizeMnUSD:149,  carbonRevenuePotentialBnUSD:2.3,  ndcFinancingGapBnUSD:19,  climateDebtRiskScore:76, gdpBnUSD:110 },
  { iso2:"ET", name:"Ethiopia",     region:"Africa", debtToGdpPct:52.3, fiscalBalancePct:-3.9, foreignCurrencyDebtPct:65, climateVulnerabilityScore:84, creditRating:"SD",   climateCreditRiskAdj:195, greenBondIssuedBnUSD:0.1,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:1.8,  ndcFinancingGapBnUSD:24,  climateDebtRiskScore:89, gdpBnUSD:126 },
  { iso2:"GH", name:"Ghana",        region:"Africa", debtToGdpPct:92.4, fiscalBalancePct:-8.2, foreignCurrencyDebtPct:58, climateVulnerabilityScore:72, creditRating:"SD",   climateCreditRiskAdj:202, greenBondIssuedBnUSD:0.2,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:1.4,  ndcFinancingGapBnUSD:9,   climateDebtRiskScore:91, gdpBnUSD:75 },
  { iso2:"EG", name:"Egypt",        region:"MENA",  debtToGdpPct:92.7, fiscalBalancePct:-6.1, foreignCurrencyDebtPct:49, climateVulnerabilityScore:70, creditRating:"B-",   climateCreditRiskAdj:104, greenBondIssuedBnUSD:1.4,  sustainabilityLinkedBondBnUSD:0.5, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:4.2,  ndcFinancingGapBnUSD:34,  climateDebtRiskScore:78, gdpBnUSD:475 },
  { iso2:"MA", name:"Morocco",      region:"MENA",  debtToGdpPct:71.5, fiscalBalancePct:-4.2, foreignCurrencyDebtPct:44, climateVulnerabilityScore:62, creditRating:"BB+",  climateCreditRiskAdj:48,  greenBondIssuedBnUSD:1.8,  sustainabilityLinkedBondBnUSD:0.7, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:3.5,  ndcFinancingGapBnUSD:22,  climateDebtRiskScore:56, gdpBnUSD:142 },
  { iso2:"TN", name:"Tunisia",      region:"MENA",  debtToGdpPct:84.3, fiscalBalancePct:-8.8, foreignCurrencyDebtPct:55, climateVulnerabilityScore:65, creditRating:"CCC+", climateCreditRiskAdj:158, greenBondIssuedBnUSD:0.3,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:0.9,  ndcFinancingGapBnUSD:8,   climateDebtRiskScore:82, gdpBnUSD:46 },
  { iso2:"TR", name:"Turkey",       region:"EMEA",  debtToGdpPct:34.2, fiscalBalancePct:-3.6, foreignCurrencyDebtPct:60, climateVulnerabilityScore:54, creditRating:"BB-",  climateCreditRiskAdj:61,  greenBondIssuedBnUSD:3.5,  sustainabilityLinkedBondBnUSD:1.8, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:7.9,  ndcFinancingGapBnUSD:38,  climateDebtRiskScore:48, gdpBnUSD:905 },
  { iso2:"PL", name:"Poland",       region:"EMEA",  debtToGdpPct:49.0, fiscalBalancePct:-5.4, foreignCurrencyDebtPct:28, climateVulnerabilityScore:38, creditRating:"A-",   climateCreditRiskAdj:14,  greenBondIssuedBnUSD:5.2,  sustainabilityLinkedBondBnUSD:2.3, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:9.1,  ndcFinancingGapBnUSD:28,  climateDebtRiskScore:24, gdpBnUSD:748 },
  { iso2:"RO", name:"Romania",      region:"EMEA",  debtToGdpPct:48.8, fiscalBalancePct:-5.7, foreignCurrencyDebtPct:42, climateVulnerabilityScore:44, creditRating:"BBB-", climateCreditRiskAdj:21,  greenBondIssuedBnUSD:2.1,  sustainabilityLinkedBondBnUSD:0.8, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:4.2,  ndcFinancingGapBnUSD:14,  climateDebtRiskScore:32, gdpBnUSD:348 },
  { iso2:"HU", name:"Hungary",      region:"EMEA",  debtToGdpPct:73.6, fiscalBalancePct:-4.9, foreignCurrencyDebtPct:35, climateVulnerabilityScore:41, creditRating:"BBB",  climateCreditRiskAdj:18,  greenBondIssuedBnUSD:3.4,  sustainabilityLinkedBondBnUSD:1.1, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:5.1,  ndcFinancingGapBnUSD:16,  climateDebtRiskScore:28, gdpBnUSD:196 },
  { iso2:"UA", name:"Ukraine",      region:"EMEA",  debtToGdpPct:88.8, fiscalBalancePct:-16.4, foreignCurrencyDebtPct:67, climateVulnerabilityScore:59, creditRating:"CCC",  climateCreditRiskAdj:178, greenBondIssuedBnUSD:0.4,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:3.8,  ndcFinancingGapBnUSD:18,  climateDebtRiskScore:77, gdpBnUSD:178 },
  { iso2:"NG", name:"Nigeria",      region:"Africa", debtToGdpPct:39.1, fiscalBalancePct:-4.7, foreignCurrencyDebtPct:43, climateVulnerabilityScore:79, creditRating:"B-",   climateCreditRiskAdj:122, greenBondIssuedBnUSD:0.8,  sustainabilityLinkedBondBnUSD:0.2, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:6.1,  ndcFinancingGapBnUSD:29,  climateDebtRiskScore:74, gdpBnUSD:477 },
  { iso2:"AO", name:"Angola",       region:"Africa", debtToGdpPct:67.2, fiscalBalancePct:-2.8, foreignCurrencyDebtPct:71, climateVulnerabilityScore:75, creditRating:"B-",   climateCreditRiskAdj:131, greenBondIssuedBnUSD:0.1,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:2.4,  ndcFinancingGapBnUSD:11,  climateDebtRiskScore:79, gdpBnUSD:124 },
  { iso2:"ZM", name:"Zambia",       region:"Africa", debtToGdpPct:141.2,fiscalBalancePct:-11.2,foreignCurrencyDebtPct:74, climateVulnerabilityScore:77, creditRating:"SD",   climateCreditRiskAdj:228, greenBondIssuedBnUSD:0.0,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:true,  debtForNatureSwapSizeMnUSD:55,   carbonRevenuePotentialBnUSD:1.1,  ndcFinancingGapBnUSD:7,   climateDebtRiskScore:96, gdpBnUSD:29 },
  { iso2:"EC", name:"Ecuador",      region:"LAC",  debtToGdpPct:58.4,  fiscalBalancePct:-3.2,  foreignCurrencyDebtPct:56, climateVulnerabilityScore:69, creditRating:"B-",   climateCreditRiskAdj:115, greenBondIssuedBnUSD:0.6,  sustainabilityLinkedBondBnUSD:0.2, debtForNatureSwapCompleted:true,  debtForNatureSwapSizeMnUSD:1632, carbonRevenuePotentialBnUSD:4.8,  ndcFinancingGapBnUSD:16,  climateDebtRiskScore:70, gdpBnUSD:115 },
  { iso2:"GT", name:"Guatemala",    region:"LAC",  debtToGdpPct:30.2,  fiscalBalancePct:-1.8,  foreignCurrencyDebtPct:49, climateVulnerabilityScore:73, creditRating:"BB-",  climateCreditRiskAdj:72,  greenBondIssuedBnUSD:0.2,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:1.5,  ndcFinancingGapBnUSD:8,   climateDebtRiskScore:66, gdpBnUSD:95 },
  { iso2:"KH", name:"Cambodia",     region:"Asia", debtToGdpPct:34.1,  fiscalBalancePct:-4.4,  foreignCurrencyDebtPct:72, climateVulnerabilityScore:81, creditRating:"B+",   climateCreditRiskAdj:88,  greenBondIssuedBnUSD:0.1,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:1.2,  ndcFinancingGapBnUSD:9,   climateDebtRiskScore:78, gdpBnUSD:29 },
  { iso2:"MN", name:"Mongolia",     region:"Asia", debtToGdpPct:81.2,  fiscalBalancePct:-4.2,  foreignCurrencyDebtPct:79, climateVulnerabilityScore:56, creditRating:"B",    climateCreditRiskAdj:94,  greenBondIssuedBnUSD:0.2,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:1.8,  ndcFinancingGapBnUSD:4,   climateDebtRiskScore:68, gdpBnUSD:18 },
  { iso2:"GE", name:"Georgia",      region:"EMEA",  debtToGdpPct:43.2, fiscalBalancePct:-2.8, foreignCurrencyDebtPct:64, climateVulnerabilityScore:48, creditRating:"BB",   climateCreditRiskAdj:42,  greenBondIssuedBnUSD:0.3,  sustainabilityLinkedBondBnUSD:0.1, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:1.2,  ndcFinancingGapBnUSD:5,   climateDebtRiskScore:39, gdpBnUSD:25 },
  { iso2:"JO", name:"Jordan",       region:"MENA",  debtToGdpPct:92.1, fiscalBalancePct:-3.5, foreignCurrencyDebtPct:58, climateVulnerabilityScore:68, creditRating:"BB-",  climateCreditRiskAdj:72,  greenBondIssuedBnUSD:0.6,  sustainabilityLinkedBondBnUSD:0.2, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:1.4,  ndcFinancingGapBnUSD:8,   climateDebtRiskScore:66, gdpBnUSD:47 },
  { iso2:"LB", name:"Lebanon",      region:"MENA",  debtToGdpPct:182.0,fiscalBalancePct:-4.2, foreignCurrencyDebtPct:66, climateVulnerabilityScore:72, creditRating:"SD",   climateCreditRiskAdj:350, greenBondIssuedBnUSD:0.0,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:0.4,  ndcFinancingGapBnUSD:5,   climateDebtRiskScore:98, gdpBnUSD:23 },
  { iso2:"UZ", name:"Uzbekistan",   region:"EMEA",  debtToGdpPct:36.5, fiscalBalancePct:-3.8, foreignCurrencyDebtPct:61, climateVulnerabilityScore:58, creditRating:"BB-",  climateCreditRiskAdj:52,  greenBondIssuedBnUSD:0.4,  sustainabilityLinkedBondBnUSD:0.1, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:2.1,  ndcFinancingGapBnUSD:12,  climateDebtRiskScore:48, gdpBnUSD:80 },
  { iso2:"KZ", name:"Kazakhstan",   region:"EMEA",  debtToGdpPct:24.1, fiscalBalancePct:-1.9, foreignCurrencyDebtPct:42, climateVulnerabilityScore:51, creditRating:"BBB-", climateCreditRiskAdj:29,  greenBondIssuedBnUSD:0.8,  sustainabilityLinkedBondBnUSD:0.3, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:4.8,  ndcFinancingGapBnUSD:18,  climateDebtRiskScore:38, gdpBnUSD:259 },
  { iso2:"AZ", name:"Azerbaijan",   region:"EMEA",  debtToGdpPct:18.2, fiscalBalancePct:2.8,  foreignCurrencyDebtPct:47, climateVulnerabilityScore:54, creditRating:"BB+",  climateCreditRiskAdj:36,  greenBondIssuedBnUSD:0.2,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:2.2,  ndcFinancingGapBnUSD:7,   climateDebtRiskScore:42, gdpBnUSD:78 },
  { iso2:"TZ", name:"Tanzania",     region:"Africa", debtToGdpPct:41.2, fiscalBalancePct:-3.2, foreignCurrencyDebtPct:56, climateVulnerabilityScore:80, creditRating:"B+",   climateCreditRiskAdj:98,  greenBondIssuedBnUSD:0.2,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:true,  debtForNatureSwapSizeMnUSD:82,   carbonRevenuePotentialBnUSD:2.8,  ndcFinancingGapBnUSD:14,  climateDebtRiskScore:78, gdpBnUSD:79 },
  { iso2:"UG", name:"Uganda",       region:"Africa", debtToGdpPct:49.1, fiscalBalancePct:-5.9, foreignCurrencyDebtPct:62, climateVulnerabilityScore:82, creditRating:"B+",   climateCreditRiskAdj:112, greenBondIssuedBnUSD:0.1,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:1.6,  ndcFinancingGapBnUSD:10,  climateDebtRiskScore:80, gdpBnUSD:47 },
  { iso2:"MZ", name:"Mozambique",   region:"Africa", debtToGdpPct:102.1,fiscalBalancePct:-7.4, foreignCurrencyDebtPct:71, climateVulnerabilityScore:87, creditRating:"CCC+", climateCreditRiskAdj:188, greenBondIssuedBnUSD:0.1,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:1.2,  ndcFinancingGapBnUSD:8,   climateDebtRiskScore:93, gdpBnUSD:18 },
  { iso2:"RW", name:"Rwanda",       region:"Africa", debtToGdpPct:71.4, fiscalBalancePct:-6.1, foreignCurrencyDebtPct:64, climateVulnerabilityScore:74, creditRating:"B+",   climateCreditRiskAdj:102, greenBondIssuedBnUSD:0.3,  sustainabilityLinkedBondBnUSD:0.1, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:0.8,  ndcFinancingGapBnUSD:6,   climateDebtRiskScore:72, gdpBnUSD:14 },
  { iso2:"SN", name:"Senegal",      region:"Africa", debtToGdpPct:72.6, fiscalBalancePct:-5.3, foreignCurrencyDebtPct:60, climateVulnerabilityScore:76, creditRating:"B+",   climateCreditRiskAdj:108, greenBondIssuedBnUSD:0.2,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:1.4,  ndcFinancingGapBnUSD:9,   climateDebtRiskScore:74, gdpBnUSD:31 },
  { iso2:"CI", name:"Côte d'Ivoire",region:"Africa", debtToGdpPct:58.4, fiscalBalancePct:-4.1, foreignCurrencyDebtPct:55, climateVulnerabilityScore:73, creditRating:"B+",   climateCreditRiskAdj:95,  greenBondIssuedBnUSD:0.3,  sustainabilityLinkedBondBnUSD:0.1, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:1.9,  ndcFinancingGapBnUSD:11,  climateDebtRiskScore:71, gdpBnUSD:70 },
  { iso2:"HN", name:"Honduras",     region:"LAC",  debtToGdpPct:50.4,  fiscalBalancePct:-3.6,  foreignCurrencyDebtPct:62, climateVulnerabilityScore:78, creditRating:"BB-",  climateCreditRiskAdj:82,  greenBondIssuedBnUSD:0.1,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:0.9,  ndcFinancingGapBnUSD:6,   climateDebtRiskScore:74, gdpBnUSD:34 },
  { iso2:"NP", name:"Nepal",        region:"Asia", debtToGdpPct:44.8,  fiscalBalancePct:-4.6,  foreignCurrencyDebtPct:58, climateVulnerabilityScore:83, creditRating:"B",    climateCreditRiskAdj:106, greenBondIssuedBnUSD:0.0,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:0.6,  ndcFinancingGapBnUSD:8,   climateDebtRiskScore:81, gdpBnUSD:42 },
  { iso2:"MM", name:"Myanmar",      region:"Asia", debtToGdpPct:55.1,  fiscalBalancePct:-5.8,  foreignCurrencyDebtPct:58, climateVulnerabilityScore:83, creditRating:"B",    climateCreditRiskAdj:132, greenBondIssuedBnUSD:0.0,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:2.1,  ndcFinancingGapBnUSD:14,  climateDebtRiskScore:84, gdpBnUSD:65 },
  { iso2:"AM", name:"Armenia",      region:"EMEA",  debtToGdpPct:49.8, fiscalBalancePct:-3.5, foreignCurrencyDebtPct:68, climateVulnerabilityScore:50, creditRating:"BB-",  climateCreditRiskAdj:48,  greenBondIssuedBnUSD:0.1,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:0.7,  ndcFinancingGapBnUSD:3,   climateDebtRiskScore:41, gdpBnUSD:20 },
  { iso2:"TL", name:"Timor-Leste",  region:"Asia", debtToGdpPct:12.1,  fiscalBalancePct:-11.4, foreignCurrencyDebtPct:80, climateVulnerabilityScore:86, creditRating:"B",    climateCreditRiskAdj:122, greenBondIssuedBnUSD:0.0,  sustainabilityLinkedBondBnUSD:0.0, debtForNatureSwapCompleted:false, debtForNatureSwapSizeMnUSD:0,    carbonRevenuePotentialBnUSD:0.3,  ndcFinancingGapBnUSD:2,   climateDebtRiskScore:82, gdpBnUSD:4 },
];

const GREEN_BOND_ISSUANCES = [
  { country:"Indonesia",   amount:3.00, year:2018, coupon:3.75, tenor:5,  useOfProceeds:"Renewable Energy",            oversubscription:3.8 },
  { country:"Indonesia",   amount:1.25, year:2019, coupon:2.15, tenor:5,  useOfProceeds:"Green Projects",              oversubscription:4.2 },
  { country:"Brazil",      amount:2.50, year:2020, coupon:4.50, tenor:10, useOfProceeds:"Sustainable Agriculture",     oversubscription:2.1 },
  { country:"Egypt",       amount:0.75, year:2020, coupon:5.25, tenor:5,  useOfProceeds:"Clean Transport",             oversubscription:4.8 },
  { country:"Chile",       amount:1.20, year:2019, coupon:2.45, tenor:30, useOfProceeds:"Green Bond Framework",        oversubscription:3.4 },
  { country:"Chile",       amount:2.00, year:2021, coupon:2.89, tenor:30, useOfProceeds:"Renewable Energy/Transport",  oversubscription:2.9 },
  { country:"Mexico",      amount:1.00, year:2020, coupon:4.75, tenor:20, useOfProceeds:"Sustainable Development",     oversubscription:2.2 },
  { country:"Poland",      amount:2.00, year:2016, coupon:1.14, tenor:5,  useOfProceeds:"Clean Energy/Transport",      oversubscription:1.8 },
  { country:"Poland",      amount:3.00, year:2017, coupon:1.13, tenor:10, useOfProceeds:"Low-Carbon Economy",          oversubscription:2.4 },
  { country:"India",       amount:1.00, year:2022, coupon:7.10, tenor:5,  useOfProceeds:"Sovereign Green Bond",        oversubscription:3.1 },
  { country:"India",       amount:2.00, year:2023, coupon:7.29, tenor:10, useOfProceeds:"Solar/Wind Projects",         oversubscription:2.6 },
  { country:"South Africa",amount:0.50, year:2022, coupon:10.25,tenor:10, useOfProceeds:"Renewable Energy",            oversubscription:2.8 },
  { country:"Thailand",    amount:1.00, year:2020, coupon:2.00, tenor:3,  useOfProceeds:"COVID-Green Hybrid",          oversubscription:3.5 },
  { country:"Malaysia",    amount:0.80, year:2021, coupon:3.30, tenor:10, useOfProceeds:"Green/Sustainable Projects",  oversubscription:4.1 },
  { country:"Colombia",    amount:0.75, year:2021, coupon:3.88, tenor:7,  useOfProceeds:"Sustainability Bond",         oversubscription:3.3 },
  { country:"Hungary",     amount:1.50, year:2020, coupon:1.75, tenor:10, useOfProceeds:"Green Bond Framework",        oversubscription:2.7 },
  { country:"Kenya",       amount:0.40, year:2019, coupon:8.25, tenor:5,  useOfProceeds:"Green Energy Projects",       oversubscription:2.0 },
  { country:"Turkey",      amount:1.20, year:2021, coupon:5.88, tenor:7,  useOfProceeds:"Sustainable Projects",        oversubscription:2.9 },
  { country:"Vietnam",     amount:0.50, year:2023, coupon:4.20, tenor:10, useOfProceeds:"Green Transition",            oversubscription:3.6 },
  { country:"Morocco",     amount:0.60, year:2016, coupon:4.00, tenor:5,  useOfProceeds:"Renewable Energy",            oversubscription:2.3 },
];

const DNS_DEALS = [
  { country:"Ecuador",         debtRelievedMnUSD:1632, conservationCommitmentMnUSD:450, partner:"TNC",          year:2023, ecosystemType:"Marine/Galapagos",     co2SequesteredMtpa:2.1 },
  { country:"Belize",          debtRelievedMnUSD:364,  conservationCommitmentMnUSD:184, partner:"TNC",          year:2021, ecosystemType:"Marine/Coral Reef",    co2SequesteredMtpa:0.9 },
  { country:"Barbados",        debtRelievedMnUSD:150,  conservationCommitmentMnUSD:50,  partner:"TNC/NWF",      year:2022, ecosystemType:"Marine",               co2SequesteredMtpa:0.3 },
  { country:"Colombia",        debtRelievedMnUSD:245,  conservationCommitmentMnUSD:80,  partner:"WWF",          year:2023, ecosystemType:"Amazon Forest",        co2SequesteredMtpa:3.2 },
  { country:"Indonesia",       debtRelievedMnUSD:485,  conservationCommitmentMnUSD:120, partner:"WWF/TNC",      year:2023, ecosystemType:"Mangrove/Rainforest",   co2SequesteredMtpa:4.8 },
  { country:"Kenya",           debtRelievedMnUSD:149,  conservationCommitmentMnUSD:64,  partner:"TNC",          year:2023, ecosystemType:"Marine/Coastal",       co2SequesteredMtpa:0.8 },
  { country:"Tanzania",        debtRelievedMnUSD:82,   conservationCommitmentMnUSD:33,  partner:"TNC/WWF",      year:2023, ecosystemType:"Coastal/Savanna",      co2SequesteredMtpa:0.5 },
  { country:"Brazil",          debtRelievedMnUSD:180,  conservationCommitmentMnUSD:55,  partner:"Amazon Fund",  year:2023, ecosystemType:"Amazon Rainforest",    co2SequesteredMtpa:5.8 },
  { country:"Zambia",          debtRelievedMnUSD:55,   conservationCommitmentMnUSD:22,  partner:"WWF",          year:2023, ecosystemType:"Savanna/Wetlands",     co2SequesteredMtpa:0.4 },
  { country:"Papua New Guinea",debtRelievedMnUSD:210,  conservationCommitmentMnUSD:78,  partner:"TNC",          year:2022, ecosystemType:"Tropical Rainforest",  co2SequesteredMtpa:3.1 },
  { country:"El Salvador",     debtRelievedMnUSD:35,   conservationCommitmentMnUSD:14,  partner:"TNC",          year:2022, ecosystemType:"Marine/Reef",          co2SequesteredMtpa:0.2 },
  { country:"Sri Lanka",       debtRelievedMnUSD:0,    conservationCommitmentMnUSD:0,   partner:"Negotiating",  year:2024, ecosystemType:"Marine/Forest",        co2SequesteredMtpa:0.0 },
];

const SPREAD_DATA = [
  { q:"Q1-22", Brazil:312, Colombia:348, Indonesia:218, Pakistan:412, Egypt:518, SriLanka:1820, Ghana:812, Turkey:512, India:178, Philippines:145 },
  { q:"Q2-22", Brazil:335, Colombia:368, Indonesia:238, Pakistan:488, Egypt:568, SriLanka:2480, Ghana:1020, Turkey:558, India:195, Philippines:158 },
  { q:"Q3-22", Brazil:358, Colombia:398, Indonesia:248, Pakistan:612, Egypt:624, SriLanka:3100, Ghana:1480, Turkey:618, India:212, Philippines:168 },
  { q:"Q4-22", Brazil:342, Colombia:378, Indonesia:228, Pakistan:1124,Egypt:698, SriLanka:3890, Ghana:1920, Turkey:578, India:198, Philippines:155 },
  { q:"Q1-23", Brazil:328, Colombia:361, Indonesia:215, Pakistan:1312,Egypt:778, SriLanka:3200, Ghana:2100, Turkey:541, India:181, Philippines:148 },
  { q:"Q2-23", Brazil:302, Colombia:342, Indonesia:202, Pakistan:985, Egypt:818, SriLanka:2900, Ghana:1800, Turkey:514, India:168, Philippines:138 },
  { q:"Q3-23", Brazil:288, Colombia:325, Indonesia:191, Pakistan:868, Egypt:895, SriLanka:2600, Ghana:1650, Turkey:498, India:159, Philippines:132 },
  { q:"Q4-23", Brazil:268, Colombia:308, Indonesia:182, Pakistan:812, Egypt:942, SriLanka:2480, Ghana:1580, Turkey:482, India:148, Philippines:128 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const REGION_COLORS = { LAC:"#3b82f6", Asia:"#10b981", Africa:"#f59e0b", MENA:"#8b5cf6", EMEA:"#06b6d4" };
const RATING_COLORS = { AAA:"#059669",AA:"#10b981",A:"#34d399",BBB:"#f59e0b",BB:"#f97316",B:"#ef4444",CCC:"#dc2626",SD:"#7f1d1d",D:"#450a0a" };
const SPREAD_COLORS = { Brazil:"#3b82f6",Colombia:"#10b981",Indonesia:"#f59e0b",Pakistan:"#ef4444",Egypt:"#8b5cf6",SriLanka:"#ec4899",Ghana:"#f97316",Turkey:"#06b6d4",India:"#84cc16",Philippines:"#a78bfa" };

const KpiCard = ({ label, value, sub, color = T.gold }) => (
  <div style={{ background: T.slate, border:`1px solid ${color}30`, borderRadius:6, padding:"14px 18px", minWidth:155 }}>
    <div style={{ fontFamily:T.mono, fontSize:22, fontWeight:700, color }}>{value}</div>
    <div style={{ fontSize:12, color:T.goldLight, marginTop:2 }}>{label}</div>
    {sub && <div style={{ fontFamily:T.mono, fontSize:10, color:T.muted, marginTop:3 }}>{sub}</div>}
  </div>
);

const Badge = ({ label, color = T.gold }) => (
  <span style={{ background:`${color}22`, color, border:`1px solid ${color}55`, borderRadius:4, padding:"2px 7px", fontSize:10, fontFamily:T.mono, fontWeight:700, whiteSpace:"nowrap" }}>{label}</span>
);

const SectionHeader = ({ title }) => (
  <div style={{ fontFamily:T.mono, fontSize:11, color:T.gold, letterSpacing:"0.12em", textTransform:"uppercase", borderBottom:`1px solid ${T.gold}40`, paddingBottom:6, marginBottom:14 }}>{title}</div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:T.slate, border:`1px solid ${T.gold}60`, borderRadius:6, padding:"10px 14px", fontFamily:T.mono, fontSize:11 }}>
      <div style={{ color:T.gold, fontWeight:700, marginBottom:4 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color || T.goldLight }}>
          {p.name}: <strong>{typeof p.value==="number" ? p.value.toLocaleString() : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EmDebtClimateRiskPage() {
  const [activeTab, setActiveTab]           = useState(0);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [filterRegion, setFilterRegion]     = useState("All");
  const [sortField, setSortField]           = useState("climateDebtRiskScore");
  const [sortDir, setSortDir]               = useState("desc");
  const [spreadCountries, setSpreadCountries] = useState(["Brazil","Indonesia","India"]);

  const TABS = ["Overview","Debt Sustainability","Green Bond Market","Debt-for-Nature Swaps","Sovereign Credit Risk","Transition Finance","Country Profiles"];

  const filteredCountries = useMemo(() => {
    let c = [...EM_COUNTRIES];
    if (filterRegion !== "All") c = c.filter(x => x.region === filterRegion);
    c.sort((a, b) => {
      const av = a[sortField], bv = b[sortField];
      const dir = sortDir === "asc" ? 1 : -1;
      if (typeof av === "string") return av.localeCompare(bv) * dir;
      return (av - bv) * dir;
    });
    return c;
  }, [filterRegion, sortField, sortDir]);

  const scatterData = useMemo(() => EM_COUNTRIES.map(c => ({
    x: c.debtToGdpPct, y: c.climateVulnerabilityScore,
    z: Math.max(40, Math.sqrt(c.gdpBnUSD) * 2.8),
    name: c.name, region: c.region, rating: c.creditRating, score: c.climateDebtRiskScore,
  })), []);

  const greenBondByYear = useMemo(() => {
    const map = {};
    GREEN_BOND_ISSUANCES.forEach(g => {
      if (!map[g.year]) map[g.year] = { year:g.year, total:0, count:0 };
      map[g.year].total = +(map[g.year].total + g.amount).toFixed(2);
      map[g.year].count += 1;
    });
    return Object.values(map).sort((a,b) => a.year-b.year);
  }, []);

  const ratingDistribution = useMemo(() => {
    const map = {};
    EM_COUNTRIES.forEach(c => {
      const tier = c.climateDebtRiskScore > 75 ? "High Risk" : c.climateDebtRiskScore > 50 ? "Med Risk" : "Low Risk";
      const rg = c.creditRating.replace(/[+-]/,"");
      if (!map[rg]) map[rg] = { rating:rg, "High Risk":0, "Med Risk":0, "Low Risk":0 };
      map[rg][tier]++;
    });
    const order = ["A","BBB","BB","B","CCC","SD","D"];
    return order.filter(r => map[r]).map(r => map[r]);
  }, []);

  const totalGreenBonds     = EM_COUNTRIES.reduce((s,c) => s+c.greenBondIssuedBnUSD, 0);
  const totalDNSMn          = DNS_DEALS.reduce((s,d) => s+d.debtRelievedMnUSD, 0);
  const avgClimateRisk      = (EM_COUNTRIES.reduce((s,c) => s+c.climateDebtRiskScore, 0)/EM_COUNTRIES.length).toFixed(1);
  const totalNdcGap         = EM_COUNTRIES.reduce((s,c) => s+c.ndcFinancingGapBnUSD, 0).toFixed(0);
  const totalCarbon         = EM_COUNTRIES.reduce((s,c) => s+c.carbonRevenuePotentialBnUSD, 0).toFixed(0);
  const allSpreadKeys       = ["Brazil","Colombia","Indonesia","Pakistan","Egypt","SriLanka","Ghana","Turkey","India","Philippines"];

  const S = {
    page:    { background:T.cream, minHeight:"100vh", fontFamily:T.font },
    header:  { background:T.navy, padding:"20px 28px", borderBottom:`3px solid ${T.gold}` },
    modTag:  { fontFamily:T.mono, fontSize:10, color:T.gold, background:`${T.gold}18`, border:`1px solid ${T.gold}44`, borderRadius:4, padding:"2px 8px" },
    tabs:    { display:"flex", background:T.navy, borderBottom:`1px solid ${T.gold}40`, overflowX:"auto" },
    tab:     (a) => ({ padding:"10px 20px", cursor:"pointer", fontFamily:T.mono, fontSize:11, letterSpacing:"0.05em", color:a?T.gold:T.muted, borderBottom:a?`2px solid ${T.gold}`:"2px solid transparent", whiteSpace:"nowrap" }),
    body:    { padding:"22px 28px" },
    card:    { background:T.white, border:"1px solid #e5ddd0", borderRadius:8, padding:"18px 20px", marginBottom:18, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" },
    kpiRow:  { display:"flex", gap:14, flexWrap:"wrap", marginBottom:20 },
    grid2:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 },
    th:      { padding:"8px 12px", fontFamily:T.mono, fontSize:10, color:T.gold, textAlign:"left", background:T.navy, cursor:"pointer", whiteSpace:"nowrap" },
    td:      { padding:"7px 12px", fontSize:12, borderBottom:"1px solid #f0ece4" },
    statusBar:{ background:T.navy, borderTop:`1px solid ${T.gold}30`, padding:"6px 28px", display:"flex", gap:20, justifyContent:"flex-end" },
  };

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
          <span style={S.modTag}>EP-AX4</span>
          <span style={{ color:T.gold, fontFamily:T.mono, fontSize:11 }}>SOVEREIGN CLIMATE RISK INTELLIGENCE</span>
        </div>
        <h1 style={{ margin:0, color:T.white, fontSize:22, fontWeight:700 }}>EM Debt &amp; Climate Risk</h1>
        <div style={{ color:"#94a3b8", fontSize:12, marginTop:4 }}>
          50 emerging market sovereigns · Debt sustainability · Green bond markets · Debt-for-nature swaps
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {TABS.map((t,i) => <div key={i} style={S.tab(activeTab===i)} onClick={() => setActiveTab(i)}>{t}</div>)}
      </div>

      <div style={S.body}>

        {/* ══ TAB 0: OVERVIEW ══ */}
        {activeTab === 0 && (
          <>
            <div style={S.kpiRow}>
              <KpiCard label="EM Countries Tracked"   value="50"                         sub="5 regions covered" />
              <KpiCard label="Avg Climate Debt Risk"  value={avgClimateRisk}             sub="Score /100"         color={T.amber} />
              <KpiCard label="EM Sovereign Green Bonds" value={`$${totalGreenBonds.toFixed(1)}bn`} sub="Cumulative issuances" color={T.green} />
              <KpiCard label="Debt-for-Nature Swaps"  value={`$${(totalDNSMn/1000).toFixed(2)}bn`} sub="12 deals tracked" color={T.teal} />
              <KpiCard label="NdC Financing Gap"      value={`$${totalNdcGap}bn`}        sub="Aggregate 50 EM"    color={T.red} />
            </div>

            <div style={S.card}>
              <SectionHeader title="EM Debt/GDP vs Climate Vulnerability — Bubble = GDP Size" />
              <ResponsiveContainer width="100%" height={380}>
                <ScatterChart margin={{ top:10, right:30, bottom:20, left:10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                  <XAxis dataKey="x" name="Debt/GDP %" type="number" tick={{ fontFamily:T.mono, fontSize:10 }}
                    label={{ value:"Debt/GDP %", position:"insideBottom", offset:-8, style:{ fontFamily:T.mono, fontSize:10, fill:T.muted } }} />
                  <YAxis dataKey="y" name="Climate Vulnerability" tick={{ fontFamily:T.mono, fontSize:10 }}
                    label={{ value:"Climate Vulnerability Score", angle:-90, position:"insideLeft", style:{ fontFamily:T.mono, fontSize:10, fill:T.muted } }} />
                  <ZAxis dataKey="z" range={[40,900]} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div style={{ background:T.navy, border:`1px solid ${T.gold}`, borderRadius:6, padding:"10px 14px", fontFamily:T.mono, fontSize:11, color:T.white }}>
                        <div style={{ color:T.gold, fontWeight:700 }}>{d.name}</div>
                        <div>Debt/GDP: {d.x}%</div>
                        <div>Climate Vuln: {d.y}/100</div>
                        <div>Rating: {d.rating}</div>
                        <div>Climate Risk: {d.score}/100</div>
                      </div>
                    );
                  }} />
                  {Object.keys(REGION_COLORS).map(region => (
                    <Scatter key={region} name={region}
                      data={scatterData.filter(d => d.region === region)}
                      fill={REGION_COLORS[region]} fillOpacity={0.72} />
                  ))}
                  <Legend formatter={v => <span style={{ fontFamily:T.mono, fontSize:10 }}>{v}</span>} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div style={S.grid2}>
              <div style={S.card}>
                <SectionHeader title="Top 10 — Highest Climate Debt Risk Score" />
                {[...EM_COUNTRIES].sort((a,b) => b.climateDebtRiskScore-a.climateDebtRiskScore).slice(0,10).map((c,i) => (
                  <div key={c.iso2} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", borderBottom:"1px solid #f0ece4" }}>
                    <span style={{ fontFamily:T.mono, fontSize:11, color:T.muted, width:18 }}>{i+1}</span>
                    <span style={{ flex:1, fontSize:12, fontWeight:600, cursor:"pointer", color:T.indigo }} onClick={() => { setSelectedCountry(c); setActiveTab(6); }}>{c.name}</span>
                    <Badge label={c.creditRating} color={c.climateDebtRiskScore>75 ? T.red : T.amber} />
                    <div style={{ width:76, textAlign:"right" }}>
                      <div style={{ fontFamily:T.mono, fontSize:13, fontWeight:700, color:c.climateDebtRiskScore>75?T.red:T.amber }}>{c.climateDebtRiskScore}</div>
                      <div style={{ background:"#fee2e2", height:4, borderRadius:2, marginTop:2 }}>
                        <div style={{ background:T.red, height:"100%", width:`${c.climateDebtRiskScore}%`, borderRadius:2 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={S.card}>
                <SectionHeader title="Green Bond Leaders — Cumulative Issuance ($bn)" />
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[...EM_COUNTRIES].filter(c=>c.greenBondIssuedBnUSD>0.4).sort((a,b)=>b.greenBondIssuedBnUSD-a.greenBondIssuedBnUSD).slice(0,12).map(c=>({ name:c.iso2, value:c.greenBondIssuedBnUSD, region:c.region }))}
                    margin={{ top:5, right:10, bottom:5, left:-20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                    <XAxis dataKey="name" tick={{ fontFamily:T.mono, fontSize:10 }} />
                    <YAxis tick={{ fontFamily:T.mono, fontSize:10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Green Bonds ($bn)" radius={[3,3,0,0]}>
                      {[...EM_COUNTRIES].filter(c=>c.greenBondIssuedBnUSD>0.4).sort((a,b)=>b.greenBondIssuedBnUSD-a.greenBondIssuedBnUSD).slice(0,12).map((c,i) => (
                        <Cell key={i} fill={REGION_COLORS[c.region]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* ══ TAB 1: DEBT SUSTAINABILITY ══ */}
        {activeTab === 1 && (
          <>
            <div style={S.kpiRow}>
              <KpiCard label="Countries >80% Debt/GDP"  value={EM_COUNTRIES.filter(c=>c.debtToGdpPct>80).length}  sub="Elevated burden" color={T.red} />
              <KpiCard label="Avg FX Debt Share"         value={`${(EM_COUNTRIES.reduce((s,c)=>s+c.foreignCurrencyDebtPct,0)/EM_COUNTRIES.length).toFixed(0)}%`} sub="Currency risk" color={T.amber} />
              <KpiCard label="Distressed Ratings"        value={EM_COUNTRIES.filter(c=>["SD","D","CCC+","CCC","CCC-"].includes(c.creditRating)).length} sub="SD / D / CCC" color={T.red} />
              <KpiCard label="Avg Fiscal Balance"        value={`${(EM_COUNTRIES.reduce((s,c)=>s+c.fiscalBalancePct,0)/EM_COUNTRIES.length).toFixed(1)}%`} sub="% of GDP" color={T.amber} />
            </div>
            <div style={S.card}>
              <SectionHeader title="Debt/GDP vs Fiscal Balance — All 50 EM Sovereigns" />
              <ResponsiveContainer width="100%" height={340}>
                <ScatterChart margin={{ top:10, right:30, bottom:20, left:10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                  <XAxis dataKey="x" name="Debt/GDP %" type="number" tick={{ fontFamily:T.mono, fontSize:10 }}
                    label={{ value:"Debt/GDP %", position:"insideBottom", offset:-8, style:{ fontFamily:T.mono, fontSize:10, fill:T.muted } }} />
                  <YAxis dataKey="y" name="Fiscal Balance %" tick={{ fontFamily:T.mono, fontSize:10 }}
                    label={{ value:"Fiscal Balance % GDP", angle:-90, position:"insideLeft", style:{ fontFamily:T.mono, fontSize:10, fill:T.muted } }} />
                  <ZAxis dataKey="z" range={[30,200]} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div style={{ background:T.navy, border:`1px solid ${T.gold}`, borderRadius:6, padding:"10px 14px", fontFamily:T.mono, fontSize:11, color:T.white }}>
                        <div style={{ color:T.gold, fontWeight:700 }}>{d.name}</div>
                        <div>Debt/GDP: {d.x}%</div>
                        <div>Fiscal Balance: {d.y}%</div>
                        <div>FX Debt: {d.fx}%</div>
                        <div>Climate Risk: {d.cr}/100</div>
                      </div>
                    );
                  }} />
                  <Scatter name="Countries"
                    data={EM_COUNTRIES.map(c => ({ x:c.debtToGdpPct, y:c.fiscalBalancePct, z:60, name:c.name, fx:c.foreignCurrencyDebtPct, cr:c.climateDebtRiskScore }))}
                    fill={T.gold} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={S.card}>
              <SectionHeader title="Full Debt Sustainability Table — Click Header to Sort" />
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      {[["Country","name"],["Region","region"],["Debt/GDP %","debtToGdpPct"],["Fiscal Bal %","fiscalBalancePct"],["FX Debt %","foreignCurrencyDebtPct"],["Rating","creditRating"],["Climate Risk","climateDebtRiskScore"]].map(([h,f]) => (
                        <th key={h} style={S.th} onClick={() => toggleSort(f)}>
                          {h}{sortField===f ? (sortDir==="asc"?" ↑":" ↓") : ""}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCountries.map((c,i) => (
                      <tr key={c.iso2} style={{ background:i%2===0?T.white:"#faf8f4" }}>
                        <td style={S.td}><strong style={{ cursor:"pointer", color:T.indigo }} onClick={() => { setSelectedCountry(c); setActiveTab(6); }}>{c.name}</strong></td>
                        <td style={S.td}><Badge label={c.region} color={REGION_COLORS[c.region]} /></td>
                        <td style={{ ...S.td, fontFamily:T.mono, color:c.debtToGdpPct>90?T.red:c.debtToGdpPct>60?T.amber:T.green }}>{c.debtToGdpPct.toFixed(1)}%</td>
                        <td style={{ ...S.td, fontFamily:T.mono, color:c.fiscalBalancePct<-6?T.red:T.muted }}>{c.fiscalBalancePct.toFixed(1)}%</td>
                        <td style={{ ...S.td, fontFamily:T.mono }}>{c.foreignCurrencyDebtPct}%</td>
                        <td style={S.td}><Badge label={c.creditRating} color={RATING_COLORS[c.creditRating.replace(/[+-]/,"")]||T.muted} /></td>
                        <td style={S.td}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <div style={{ flex:1, background:"#f0ece4", borderRadius:2, height:6 }}>
                              <div style={{ background:c.climateDebtRiskScore>75?T.red:c.climateDebtRiskScore>50?T.amber:T.green, width:`${c.climateDebtRiskScore}%`, height:"100%", borderRadius:2 }} />
                            </div>
                            <span style={{ fontFamily:T.mono, fontSize:11, width:28 }}>{c.climateDebtRiskScore}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ TAB 2: GREEN BOND MARKET ══ */}
        {activeTab === 2 && (
          <>
            <div style={S.kpiRow}>
              <KpiCard label="Total Sovereign Green Bonds" value={`$${totalGreenBonds.toFixed(1)}bn`} sub="50 EM sovereigns" color={T.green} />
              <KpiCard label="Issuances Tracked"      value={GREEN_BOND_ISSUANCES.length} sub="2016–2023" />
              <KpiCard label="Avg Oversubscription"   value={`${(GREEN_BOND_ISSUANCES.reduce((s,g)=>s+g.oversubscription,0)/GREEN_BOND_ISSUANCES.length).toFixed(1)}x`} sub="Investor demand" color={T.teal} />
              <KpiCard label="Largest Deal"           value="$3.0bn" sub="Indonesia 2018" color={T.gold} />
            </div>
            <div style={S.card}>
              <SectionHeader title="Annual Green Bond Issuance Volume ($bn)" />
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={greenBondByYear} margin={{ top:5, right:10, bottom:5, left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                  <XAxis dataKey="year" tick={{ fontFamily:T.mono, fontSize:10 }} />
                  <YAxis tick={{ fontFamily:T.mono, fontSize:10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Volume ($bn)" fill={T.green} radius={[3,3,0,0]}>
                    <LabelList dataKey="count" position="top" style={{ fontFamily:T.mono, fontSize:9, fill:T.muted }} formatter={v => `${v} deals`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={S.card}>
              <SectionHeader title="All Sovereign Green Bond Issuances" />
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>{["Country","Year","Amount ($bn)","Coupon (%)","Tenor (yrs)","Use of Proceeds","Oversubscription"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {[...GREEN_BOND_ISSUANCES].sort((a,b)=>b.year-a.year).map((g,i) => (
                      <tr key={i} style={{ background:i%2===0?T.white:"#faf8f4" }}>
                        <td style={{ ...S.td, fontWeight:600 }}>{g.country}</td>
                        <td style={{ ...S.td, fontFamily:T.mono }}>{g.year}</td>
                        <td style={{ ...S.td, fontFamily:T.mono, color:T.green }}>${g.amount.toFixed(2)}</td>
                        <td style={{ ...S.td, fontFamily:T.mono }}>{g.coupon.toFixed(2)}%</td>
                        <td style={{ ...S.td, fontFamily:T.mono }}>{g.tenor}y</td>
                        <td style={S.td}>{g.useOfProceeds}</td>
                        <td style={{ ...S.td, fontFamily:T.mono, color:g.oversubscription>3?T.green:T.muted }}>{g.oversubscription.toFixed(1)}x</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ TAB 3: DEBT-FOR-NATURE SWAPS ══ */}
        {activeTab === 3 && (
          <>
            <div style={S.kpiRow}>
              <KpiCard label="Total Debt Relieved"      value={`$${(totalDNSMn/1000).toFixed(2)}bn`} sub="12 deals tracked" color={T.teal} />
              <KpiCard label="Conservation Committed"   value={`$${(DNS_DEALS.reduce((s,d)=>s+d.conservationCommitmentMnUSD,0)/1000).toFixed(2)}bn`} sub="Ring-fenced" color={T.green} />
              <KpiCard label="CO₂ Sequestered"          value={`${DNS_DEALS.reduce((s,d)=>s+d.co2SequesteredMtpa,0).toFixed(1)} Mtpa`} sub="Annual removal" color={T.green} />
              <KpiCard label="Largest Deal"             value="Ecuador $1.6bn" sub="Galapagos 2023" color={T.gold} />
            </div>
            <div style={S.grid2}>
              <div style={S.card}>
                <SectionHeader title="Deal Size — Debt Relieved vs Conservation Committed ($mn)" />
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={DNS_DEALS.filter(d=>d.debtRelievedMnUSD>0).sort((a,b)=>b.debtRelievedMnUSD-a.debtRelievedMnUSD)}
                    margin={{ top:5, right:10, bottom:30, left:10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                    <XAxis dataKey="country" tick={{ fontFamily:T.mono, fontSize:8, angle:-30, textAnchor:"end" }} />
                    <YAxis tick={{ fontFamily:T.mono, fontSize:9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={v=><span style={{ fontFamily:T.mono, fontSize:10 }}>{v}</span>} />
                    <Bar dataKey="debtRelievedMnUSD"          name="Debt Relieved ($mn)"     fill={T.teal}  radius={[3,3,0,0]} />
                    <Bar dataKey="conservationCommitmentMnUSD" name="Conservation ($mn)"    fill={T.green} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <SectionHeader title="CO₂ Sequestration by Deal (Mtpa)" />
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={DNS_DEALS.filter(d=>d.co2SequesteredMtpa>0).sort((a,b)=>b.co2SequesteredMtpa-a.co2SequesteredMtpa)}
                    layout="vertical" margin={{ top:5, right:20, bottom:5, left:60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                    <XAxis type="number" tick={{ fontFamily:T.mono, fontSize:9 }} />
                    <YAxis dataKey="country" type="category" tick={{ fontFamily:T.mono, fontSize:9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="co2SequesteredMtpa" name="CO₂ Seq (Mtpa)" fill={T.green} radius={[0,3,3,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={S.card}>
              <SectionHeader title="All Debt-for-Nature Swap Deals" />
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>{["Country","Year","Debt Relieved ($mn)","Conservation ($mn)","Partner","Ecosystem","CO₂ Seq (Mtpa)","Relief Ratio"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {DNS_DEALS.map((d,i) => (
                      <tr key={i} style={{ background:i%2===0?T.white:"#faf8f4" }}>
                        <td style={{ ...S.td, fontWeight:600 }}>{d.country}</td>
                        <td style={{ ...S.td, fontFamily:T.mono }}>{d.year}</td>
                        <td style={{ ...S.td, fontFamily:T.mono, color:T.teal }}>${d.debtRelievedMnUSD.toLocaleString()}</td>
                        <td style={{ ...S.td, fontFamily:T.mono, color:T.green }}>${d.conservationCommitmentMnUSD.toLocaleString()}</td>
                        <td style={S.td}><Badge label={d.partner} color={T.indigo} /></td>
                        <td style={S.td}>{d.ecosystemType}</td>
                        <td style={{ ...S.td, fontFamily:T.mono }}>{d.co2SequesteredMtpa.toFixed(1)}</td>
                        <td style={{ ...S.td, fontFamily:T.mono, color:T.gold }}>
                          {d.debtRelievedMnUSD>0 ? `${((d.conservationCommitmentMnUSD/d.debtRelievedMnUSD)*100).toFixed(0)}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ TAB 4: SOVEREIGN CREDIT RISK ══ */}
        {activeTab === 4 && (
          <>
            <div style={S.kpiRow}>
              <KpiCard label="Avg Climate Spread Premium" value="88 bps" sub="10 tracked sovereigns" color={T.amber} />
              <KpiCard label="Highest Adj Spread"         value="Lebanon 350bps" sub="Climate-adjusted" color={T.red} />
              <KpiCard label="Investment Grade EM"        value={EM_COUNTRIES.filter(c=>["A-","A","A+","BBB","BBB-","BBB+"].some(r=>c.creditRating===r)).length} sub="IG-rated countries" color={T.green} />
              <KpiCard label="Distressed Sovereigns"      value={EM_COUNTRIES.filter(c=>c.climateDebtRiskScore>80).length} sub="Risk score >80" color={T.red} />
            </div>

            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.muted }}>Toggle spreads:</span>
              {allSpreadKeys.map(c => (
                <button key={c} onClick={() => setSpreadCountries(prev => prev.includes(c) ? prev.filter(x=>x!==c) : [...prev,c])}
                  style={{ padding:"4px 10px", borderRadius:4, border:`1px solid ${spreadCountries.includes(c)?SPREAD_COLORS[c]:"#ccc"}`, background:spreadCountries.includes(c)?`${SPREAD_COLORS[c]}22`:T.white, color:spreadCountries.includes(c)?SPREAD_COLORS[c]:T.muted, fontFamily:T.mono, fontSize:10, cursor:"pointer" }}>
                  {c}
                </button>
              ))}
            </div>

            <div style={S.card}>
              <SectionHeader title="Sovereign Spread Evolution — Q1 2022 to Q4 2023 (bps)" />
              <ResponsiveContainer width="100%" height={340}>
                <ComposedChart data={SPREAD_DATA} margin={{ top:10, right:20, bottom:5, left:10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                  <XAxis dataKey="q" tick={{ fontFamily:T.mono, fontSize:10 }} />
                  <YAxis tick={{ fontFamily:T.mono, fontSize:10 }} label={{ value:"Spread (bps)", angle:-90, position:"insideLeft", style:{ fontFamily:T.mono, fontSize:10, fill:T.muted } }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={v=><span style={{ fontFamily:T.mono, fontSize:10 }}>{v}</span>} />
                  {allSpreadKeys.filter(c=>spreadCountries.includes(c)).map(c => (
                    <Line key={c} type="monotone" dataKey={c} stroke={SPREAD_COLORS[c]} dot={false} strokeWidth={2} />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={S.card}>
              <SectionHeader title="Credit Rating Distribution by Climate Risk Tier" />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ratingDistribution} margin={{ top:5, right:10, bottom:5, left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                  <XAxis dataKey="rating" tick={{ fontFamily:T.mono, fontSize:10 }} />
                  <YAxis tick={{ fontFamily:T.mono, fontSize:10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={v=><span style={{ fontFamily:T.mono, fontSize:10 }}>{v}</span>} />
                  <Bar dataKey="Low Risk" stackId="a" fill={T.green} />
                  <Bar dataKey="Med Risk" stackId="a" fill={T.amber} />
                  <Bar dataKey="High Risk" stackId="a" fill={T.red} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ══ TAB 5: TRANSITION FINANCE ══ */}
        {activeTab === 5 && (
          <>
            <div style={S.kpiRow}>
              <KpiCard label="Total Carbon Rev Potential" value={`$${totalCarbon}bn`}     sub="50 EM countries" color={T.green} />
              <KpiCard label="Aggregate NdC Gap"          value={`$${totalNdcGap}bn`}     sub="Annual financing gap" color={T.red} />
              <KpiCard label="SLB Issuances"              value={`$${EM_COUNTRIES.reduce((s,c)=>s+c.sustainabilityLinkedBondBnUSD,0).toFixed(1)}bn`} sub="Sustainability-linked" color={T.teal} />
              <KpiCard label="DNS Completed"              value={EM_COUNTRIES.filter(c=>c.debtForNatureSwapCompleted).length} sub="Countries with DNS" color={T.gold} />
            </div>
            <div style={S.card}>
              <SectionHeader title="NdC Financing Gap vs Carbon Revenue Potential — Top 15 EM ($bn)" />
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart
                  data={[...EM_COUNTRIES].sort((a,b)=>b.ndcFinancingGapBnUSD-a.ndcFinancingGapBnUSD).slice(0,15).map(c=>({
                    name:c.iso2, gap:c.ndcFinancingGapBnUSD, carbon:c.carbonRevenuePotentialBnUSD,
                    coverage:+((c.carbonRevenuePotentialBnUSD/c.ndcFinancingGapBnUSD)*100).toFixed(0),
                  }))}
                  margin={{ top:5, right:40, bottom:5, left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                  <XAxis dataKey="name" tick={{ fontFamily:T.mono, fontSize:10 }} />
                  <YAxis yAxisId="left"  tick={{ fontFamily:T.mono, fontSize:10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontFamily:T.mono, fontSize:9 }} label={{ value:"Coverage %", angle:90, position:"insideRight", style:{ fontFamily:T.mono, fontSize:9, fill:T.muted } }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={v=><span style={{ fontFamily:T.mono, fontSize:10 }}>{v}</span>} />
                  <Bar yAxisId="left" dataKey="gap"    name="NdC Gap ($bn)"      fill={`${T.red}88`}   radius={[3,3,0,0]} />
                  <Bar yAxisId="left" dataKey="carbon" name="Carbon Revenue ($bn)" fill={`${T.green}88`} radius={[3,3,0,0]} />
                  <Line yAxisId="right" type="monotone" dataKey="coverage" name="Coverage %" stroke={T.gold} dot={false} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={S.card}>
              <SectionHeader title="Transition Finance Readiness Matrix" />
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>{["Country","Green Bonds ($bn)","SLB ($bn)","Carbon Potential ($bn)","NdC Gap ($bn)","Coverage %","DNS"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {[...EM_COUNTRIES].sort((a,b)=>b.carbonRevenuePotentialBnUSD-a.carbonRevenuePotentialBnUSD).map((c,i) => (
                      <tr key={c.iso2} style={{ background:i%2===0?T.white:"#faf8f4" }}>
                        <td style={{ ...S.td, fontWeight:600 }}>{c.name}</td>
                        <td style={{ ...S.td, fontFamily:T.mono, color:T.green }}>${c.greenBondIssuedBnUSD.toFixed(1)}</td>
                        <td style={{ ...S.td, fontFamily:T.mono }}>${c.sustainabilityLinkedBondBnUSD.toFixed(1)}</td>
                        <td style={{ ...S.td, fontFamily:T.mono, color:T.teal }}>${c.carbonRevenuePotentialBnUSD.toFixed(1)}</td>
                        <td style={{ ...S.td, fontFamily:T.mono, color:T.red }}>${c.ndcFinancingGapBnUSD}</td>
                        <td style={{ ...S.td, fontFamily:T.mono, color:(c.carbonRevenuePotentialBnUSD/c.ndcFinancingGapBnUSD)>0.3?T.green:T.amber }}>
                          {((c.carbonRevenuePotentialBnUSD/c.ndcFinancingGapBnUSD)*100).toFixed(0)}%
                        </td>
                        <td style={S.td}>
                          {c.debtForNatureSwapCompleted ? <Badge label={`$${c.debtForNatureSwapSizeMnUSD.toLocaleString()}mn`} color={T.teal} /> : <span style={{ color:T.muted, fontSize:11 }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ TAB 6: COUNTRY PROFILES ══ */}
        {activeTab === 6 && (
          <>
            <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
              <select onChange={e => setSelectedCountry(EM_COUNTRIES.find(c=>c.iso2===e.target.value)||null)}
                value={selectedCountry?.iso2||""}
                style={{ padding:"7px 12px", borderRadius:6, border:`1px solid ${T.gold}`, fontFamily:T.mono, fontSize:11, background:T.white }}>
                <option value="">— Select Country —</option>
                {EM_COUNTRIES.map(c => <option key={c.iso2} value={c.iso2}>{c.name} ({c.iso2})</option>)}
              </select>
              {["All","LAC","Asia","Africa","MENA","EMEA"].map(r => (
                <button key={r} onClick={() => setFilterRegion(r)}
                  style={{ padding:"6px 12px", borderRadius:4, border:`1px solid ${filterRegion===r?T.gold:"#ccc"}`, background:filterRegion===r?`${T.gold}22`:T.white, color:filterRegion===r?T.gold:T.muted, fontFamily:T.mono, fontSize:10, cursor:"pointer" }}>
                  {r}
                </button>
              ))}
            </div>

            {selectedCountry ? (
              <div style={S.card}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                  <div>
                    <h2 style={{ margin:0, fontSize:20 }}>{selectedCountry.name} <span style={{ fontFamily:T.mono, fontSize:14, color:T.muted }}>({selectedCountry.iso2})</span></h2>
                    <div style={{ display:"flex", gap:8, marginTop:6 }}>
                      <Badge label={selectedCountry.region} color={REGION_COLORS[selectedCountry.region]} />
                      <Badge label={selectedCountry.creditRating} color={RATING_COLORS[selectedCountry.creditRating.replace(/[+-]/,"")]||T.muted} />
                      <Badge label={`Climate Risk: ${selectedCountry.climateDebtRiskScore}/100`} color={selectedCountry.climateDebtRiskScore>75?T.red:T.amber} />
                    </div>
                  </div>
                  <button onClick={() => setSelectedCountry(null)}
                    style={{ padding:"4px 10px", borderRadius:4, border:`1px solid ${T.muted}`, background:T.white, cursor:"pointer", fontFamily:T.mono, fontSize:10 }}>
                    Clear
                  </button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:18 }}>
                  {[
                    ["Debt/GDP",             `${selectedCountry.debtToGdpPct}%`,                     T.amber],
                    ["Fiscal Balance",       `${selectedCountry.fiscalBalancePct}%`,                  selectedCountry.fiscalBalancePct<-5?T.red:T.muted],
                    ["FX Debt Share",        `${selectedCountry.foreignCurrencyDebtPct}%`,            T.muted],
                    ["Climate Vulnerability",`${selectedCountry.climateVulnerabilityScore}/100`,      T.amber],
                    ["Climate Spread Adj",   `+${selectedCountry.climateCreditRiskAdj} bps`,          T.red],
                    ["Green Bonds",          `$${selectedCountry.greenBondIssuedBnUSD}bn`,            T.green],
                    ["Carbon Rev Potential", `$${selectedCountry.carbonRevenuePotentialBnUSD}bn`,     T.teal],
                    ["NdC Financing Gap",    `$${selectedCountry.ndcFinancingGapBnUSD}bn`,            T.red],
                  ].map(([label,value,color]) => (
                    <div key={label} style={{ background:"#faf8f4", borderRadius:6, padding:"12px 14px", border:"1px solid #e5ddd0" }}>
                      <div style={{ fontFamily:T.mono, fontSize:18, fontWeight:700, color }}>{value}</div>
                      <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{label}</div>
                    </div>
                  ))}
                </div>
                {selectedCountry.debtForNatureSwapCompleted && (
                  <div style={{ background:`${T.teal}11`, border:`1px solid ${T.teal}44`, borderRadius:6, padding:"10px 14px", marginTop:8 }}>
                    <Badge label="Debt-for-Nature Swap Completed" color={T.teal} />
                    <span style={{ fontFamily:T.mono, fontSize:11, color:T.teal, marginLeft:10 }}>
                      ${selectedCountry.debtForNatureSwapSizeMnUSD.toLocaleString()}mn debt relieved
                    </span>
                  </div>
                )}
                <div style={{ marginTop:14 }}>
                  <div style={{ fontFamily:T.mono, fontSize:11, color:T.muted, marginBottom:6 }}>CLIMATE RISK COMPOSITE SCORE</div>
                  <div style={{ background:"#f0ece4", height:12, borderRadius:6 }}>
                    <div style={{ background:selectedCountry.climateDebtRiskScore>75?T.red:selectedCountry.climateDebtRiskScore>50?T.amber:T.green, height:"100%", width:`${selectedCountry.climateDebtRiskScore}%`, borderRadius:6, transition:"width 0.4s" }} />
                  </div>
                  <div style={{ fontFamily:T.mono, fontSize:12, marginTop:4, color:T.muted }}>{selectedCountry.climateDebtRiskScore} / 100</div>
                </div>
              </div>
            ) : (
              <div style={S.card}>
                <SectionHeader title={`Country Directory${filterRegion!=="All"?" — "+filterRegion:""} (${(filterRegion==="All"?EM_COUNTRIES:EM_COUNTRIES.filter(c=>c.region===filterRegion)).length} countries)`} />
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:10 }}>
                  {(filterRegion==="All"?EM_COUNTRIES:EM_COUNTRIES.filter(c=>c.region===filterRegion)).map(c => (
                    <div key={c.iso2} onClick={() => setSelectedCountry(c)}
                      style={{ background:"#faf8f4", border:"1px solid #e5ddd0", borderRadius:6, padding:"12px 14px", cursor:"pointer" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor=T.gold}
                      onMouseLeave={e => e.currentTarget.style.borderColor="#e5ddd0"}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                        <span style={{ fontWeight:700, fontSize:13 }}>{c.name}</span>
                        <Badge label={c.creditRating} color={RATING_COLORS[c.creditRating.replace(/[+-]/,"")]||T.muted} />
                      </div>
                      <div style={{ fontFamily:T.mono, fontSize:11, color:T.muted, marginBottom:4 }}>Debt: {c.debtToGdpPct}% GDP</div>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ flex:1, background:"#e5ddd0", height:4, borderRadius:2 }}>
                          <div style={{ background:c.climateDebtRiskScore>75?T.red:c.climateDebtRiskScore>50?T.amber:T.green, width:`${c.climateDebtRiskScore}%`, height:"100%", borderRadius:2 }} />
                        </div>
                        <span style={{ fontFamily:T.mono, fontSize:10, color:T.muted }}>{c.climateDebtRiskScore}/100</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Status bar */}
      <div style={S.statusBar}>
        {[["MODULE","EP-AX4"],["COUNTRIES","50"],["BONDS",`${GREEN_BOND_ISSUANCES.length}`],["DNS DEALS",`${DNS_DEALS.length}`],["UPDATED","2026-Q1"]].map(([k,v]) => (
          <span key={k} style={{ fontFamily:T.mono, fontSize:9, color:T.muted }}>{k}: <span style={{ color:T.gold }}>{v}</span></span>
        ))}
      </div>
    </div>
  );
}
