import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, ComposedChart, Line, ResponsiveContainer, Cell, LabelList,
} from "recharts";

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  navy:"#0a1628", cream:"#f5f0e8", gold:"#c9a84c", goldLight:"#e8d5a3",
  slate:"#1e3a5f", steel:"#2d5282", muted:"#6b7280", white:"#ffffff",
  green:"#059669", red:"#dc2626", amber:"#d97706", teal:"#0e7490",
  indigo:"#4338ca", purple:"#7c3aed",
  card:'#ffffff',sub:'#5c6b7e',indigo:'#4f46e5',font:"'DM Sans', sans-serif", mono:"'JetBrains Mono', monospace",
};

// ─── Seed Data ────────────────────────────────────────────────────────────────
const MDBS = [
  { id:"WBG",  name:"World Bank Group", totalAnnualLendingBnUSD:104.4, climateLendingBnUSD:35.2, climateSharePct:33.7, mitigationBnUSD:22.1, adaptationBnUSD:13.1, mobilisationRatio:1.8, parisAlignedPct:100, greenBondIssuedBnUSD:18.2, focusRegions:["Global","Sub-Saharan Africa","South Asia"], creditRating:"AAA", headcountThousands:16.5, color:"#3b82f6" },
  { id:"ADB",  name:"Asian Dev Bank",   totalAnnualLendingBnUSD:32.8,  climateLendingBnUSD:13.6, climateSharePct:41.5, mitigationBnUSD:9.4,  adaptationBnUSD:4.2,  mobilisationRatio:2.2, parisAlignedPct:100, greenBondIssuedBnUSD:9.1,  focusRegions:["Asia-Pacific","Central Asia"],             creditRating:"AAA", headcountThousands:3.8, color:"#10b981" },
  { id:"AIIB", name:"AIIB",             totalAnnualLendingBnUSD:6.8,   climateLendingBnUSD:3.4,  climateSharePct:50.0, mitigationBnUSD:2.4,  adaptationBnUSD:1.0,  mobilisationRatio:2.8, parisAlignedPct:87,  greenBondIssuedBnUSD:2.1,  focusRegions:["Asia","Belt & Road"],                      creditRating:"AAA", headcountThousands:0.6, color:"#f59e0b" },
  { id:"EIB",  name:"European Inv Bank",totalAnnualLendingBnUSD:72.1,  climateLendingBnUSD:36.1, climateSharePct:50.1, mitigationBnUSD:27.8, adaptationBnUSD:8.3,  mobilisationRatio:3.1, parisAlignedPct:100, greenBondIssuedBnUSD:54.8, focusRegions:["Europe","Global"],                         creditRating:"AAA", headcountThousands:4.1, color:"#8b5cf6" },
  { id:"AfDB", name:"African Dev Bank", totalAnnualLendingBnUSD:8.9,   climateLendingBnUSD:3.9,  climateSharePct:43.8, mitigationBnUSD:2.2,  adaptationBnUSD:1.7,  mobilisationRatio:1.4, parisAlignedPct:96,  greenBondIssuedBnUSD:2.8,  focusRegions:["Sub-Saharan Africa","North Africa"],      creditRating:"AAA", headcountThousands:2.0, color:"#ef4444" },
  { id:"IADB", name:"IADB",             totalAnnualLendingBnUSD:20.4,  climateLendingBnUSD:8.2,  climateSharePct:40.2, mitigationBnUSD:5.8,  adaptationBnUSD:2.4,  mobilisationRatio:1.9, parisAlignedPct:100, greenBondIssuedBnUSD:6.4,  focusRegions:["Latin America","Caribbean"],               creditRating:"AAA", headcountThousands:2.3, color:"#06b6d4" },
  { id:"EBRD", name:"EBRD",             totalAnnualLendingBnUSD:13.1,  climateLendingBnUSD:5.2,  climateSharePct:39.7, mitigationBnUSD:3.9,  adaptationBnUSD:1.3,  mobilisationRatio:2.4, parisAlignedPct:100, greenBondIssuedBnUSD:4.2,  focusRegions:["Central & Eastern Europe","Central Asia"], creditRating:"AAA", headcountThousands:3.5, color:"#84cc16" },
  { id:"NDB",  name:"New Dev Bank",     totalAnnualLendingBnUSD:3.8,   climateLendingBnUSD:1.8,  climateSharePct:47.4, mitigationBnUSD:1.3,  adaptationBnUSD:0.5,  mobilisationRatio:1.2, parisAlignedPct:74,  greenBondIssuedBnUSD:0.8,  focusRegions:["BRICS","Emerging Markets"],                 creditRating:"AA+", headcountThousands:0.4, color:"#f97316" },
];

// Annual climate finance 2015-2023 per MDB ($bn)
const ANNUAL_CF = [
  { year:2015, WBG:16.2, ADB:3.8,  AIIB:0.0,  EIB:18.4, AfDB:1.4, IADB:3.1, EBRD:1.9, NDB:0.0  },
  { year:2016, WBG:18.6, ADB:4.3,  AIIB:0.5,  EIB:19.2, AfDB:1.6, IADB:3.5, EBRD:2.2, NDB:0.2  },
  { year:2017, WBG:20.5, ADB:5.1,  AIIB:0.8,  EIB:21.4, AfDB:1.9, IADB:3.8, EBRD:2.6, NDB:0.4  },
  { year:2018, WBG:22.4, ADB:6.4,  AIIB:1.2,  EIB:23.5, AfDB:2.2, IADB:4.2, EBRD:3.0, NDB:0.6  },
  { year:2019, WBG:25.1, ADB:7.2,  AIIB:1.6,  EIB:25.8, AfDB:2.5, IADB:4.8, EBRD:3.4, NDB:0.8  },
  { year:2020, WBG:26.8, ADB:8.4,  AIIB:1.9,  EIB:27.4, AfDB:2.8, IADB:5.4, EBRD:3.8, NDB:1.0  },
  { year:2021, WBG:29.6, ADB:10.1, AIIB:2.3,  EIB:30.2, AfDB:3.1, IADB:6.4, EBRD:4.2, NDB:1.2  },
  { year:2022, WBG:31.7, ADB:11.4, AIIB:2.8,  EIB:33.6, AfDB:3.5, IADB:7.1, EBRD:4.7, NDB:1.5  },
  { year:2023, WBG:35.2, ADB:13.6, AIIB:3.4,  EIB:36.1, AfDB:3.9, IADB:8.2, EBRD:5.2, NDB:1.8  },
];

// Private finance mobilisation 2019-2023 per MDB ($bn)
const MOBILISATION = [
  { year:2019, WBG:42.1, ADB:14.8, AIIB:3.8, EIB:72.4, AfDB:3.2, IADB:8.4,  EBRD:7.8, NDB:0.8 },
  { year:2020, WBG:43.8, ADB:16.2, AIIB:4.4, EIB:74.2, AfDB:3.5, IADB:9.1,  EBRD:8.2, NDB:0.9 },
  { year:2021, WBG:51.2, ADB:20.4, AIIB:5.6, EIB:88.3, AfDB:4.1, IADB:11.2, EBRD:10.1,NDB:1.2 },
  { year:2022, WBG:55.4, ADB:22.8, AIIB:6.8, EIB:94.6, AfDB:4.6, IADB:12.4, EBRD:11.4,NDB:1.4 },
  { year:2023, WBG:63.4, ADB:29.9, AIIB:9.5, EIB:112.1,AfDB:5.5, IADB:15.6, EBRD:12.5,NDB:2.2 },
];

// 40 project pipeline entries
const PROJECTS = [
  { id:"P001", mdb:"WBG",  country:"India",       sector:"Energy",      sizeMnUSD:850,  stage:"Disbursing",  co2ImpactMtpa:4.2, adaptationBeneficiariesM:0,   status:"On Track" },
  { id:"P002", mdb:"ADB",  country:"Vietnam",     sector:"Energy",      sizeMnUSD:420,  stage:"Approved",    co2ImpactMtpa:2.1, adaptationBeneficiariesM:0,   status:"On Track" },
  { id:"P003", mdb:"EIB",  country:"Morocco",     sector:"Energy",      sizeMnUSD:680,  stage:"Disbursing",  co2ImpactMtpa:3.4, adaptationBeneficiariesM:0,   status:"On Track" },
  { id:"P004", mdb:"AfDB", country:"Kenya",       sector:"Energy",      sizeMnUSD:220,  stage:"Approved",    co2ImpactMtpa:1.1, adaptationBeneficiariesM:0,   status:"On Track" },
  { id:"P005", mdb:"IADB", country:"Colombia",    sector:"Energy",      sizeMnUSD:310,  stage:"Pipeline",    co2ImpactMtpa:1.8, adaptationBeneficiariesM:0,   status:"In Review" },
  { id:"P006", mdb:"EBRD", country:"Kazakhstan",  sector:"Energy",      sizeMnUSD:290,  stage:"Pipeline",    co2ImpactMtpa:1.4, adaptationBeneficiariesM:0,   status:"In Review" },
  { id:"P007", mdb:"WBG",  country:"Bangladesh",  sector:"Water",       sizeMnUSD:380,  stage:"Approved",    co2ImpactMtpa:0.2, adaptationBeneficiariesM:8.4, status:"On Track" },
  { id:"P008", mdb:"ADB",  country:"Philippines", sector:"Water",       sizeMnUSD:250,  stage:"Disbursing",  co2ImpactMtpa:0.3, adaptationBeneficiariesM:4.2, status:"On Track" },
  { id:"P009", mdb:"AfDB", country:"Ethiopia",    sector:"Water",       sizeMnUSD:180,  stage:"Pipeline",    co2ImpactMtpa:0.1, adaptationBeneficiariesM:6.1, status:"Under Review" },
  { id:"P010", mdb:"IADB", country:"Peru",        sector:"Water",       sizeMnUSD:140,  stage:"Approved",    co2ImpactMtpa:0.1, adaptationBeneficiariesM:2.8, status:"On Track" },
  { id:"P011", mdb:"WBG",  country:"Indonesia",   sector:"Transport",   sizeMnUSD:740,  stage:"Disbursing",  co2ImpactMtpa:2.8, adaptationBeneficiariesM:0,   status:"Delayed" },
  { id:"P012", mdb:"EIB",  country:"Poland",      sector:"Transport",   sizeMnUSD:920,  stage:"Disbursing",  co2ImpactMtpa:3.1, adaptationBeneficiariesM:0,   status:"On Track" },
  { id:"P013", mdb:"ADB",  country:"Thailand",    sector:"Transport",   sizeMnUSD:560,  stage:"Approved",    co2ImpactMtpa:2.0, adaptationBeneficiariesM:0,   status:"On Track" },
  { id:"P014", mdb:"EBRD", country:"Romania",     sector:"Transport",   sizeMnUSD:440,  stage:"Pipeline",    co2ImpactMtpa:1.6, adaptationBeneficiariesM:0,   status:"In Review" },
  { id:"P015", mdb:"IADB", country:"Brazil",      sector:"Transport",   sizeMnUSD:610,  stage:"Disbursing",  co2ImpactMtpa:2.4, adaptationBeneficiariesM:0,   status:"On Track" },
  { id:"P016", mdb:"WBG",  country:"Pakistan",    sector:"Agriculture", sizeMnUSD:320,  stage:"Approved",    co2ImpactMtpa:0.8, adaptationBeneficiariesM:12.1,status:"On Track" },
  { id:"P017", mdb:"AfDB", country:"Tanzania",    sector:"Agriculture", sizeMnUSD:190,  stage:"Pipeline",    co2ImpactMtpa:0.5, adaptationBeneficiariesM:5.4, status:"In Review" },
  { id:"P018", mdb:"ADB",  country:"Cambodia",    sector:"Agriculture", sizeMnUSD:110,  stage:"Approved",    co2ImpactMtpa:0.3, adaptationBeneficiariesM:3.2, status:"On Track" },
  { id:"P019", mdb:"IADB", country:"Guatemala",   sector:"Agriculture", sizeMnUSD:95,   stage:"Pipeline",    co2ImpactMtpa:0.2, adaptationBeneficiariesM:2.1, status:"Under Review" },
  { id:"P020", mdb:"WBG",  country:"Egypt",       sector:"Cities",      sizeMnUSD:490,  stage:"Disbursing",  co2ImpactMtpa:1.8, adaptationBeneficiariesM:3.4, status:"On Track" },
  { id:"P021", mdb:"EIB",  country:"Turkey",      sector:"Cities",      sizeMnUSD:380,  stage:"Approved",    co2ImpactMtpa:1.4, adaptationBeneficiariesM:1.8, status:"On Track" },
  { id:"P022", mdb:"ADB",  country:"India",       sector:"Cities",      sizeMnUSD:680,  stage:"Disbursing",  co2ImpactMtpa:2.6, adaptationBeneficiariesM:4.8, status:"On Track" },
  { id:"P023", mdb:"EBRD", country:"Ukraine",     sector:"Cities",      sizeMnUSD:210,  stage:"Pipeline",    co2ImpactMtpa:0.8, adaptationBeneficiariesM:1.2, status:"Suspended" },
  { id:"P024", mdb:"AfDB", country:"Nigeria",     sector:"Cities",      sizeMnUSD:280,  stage:"Approved",    co2ImpactMtpa:1.0, adaptationBeneficiariesM:2.6, status:"On Track" },
  { id:"P025", mdb:"WBG",  country:"Kenya",       sector:"Energy",      sizeMnUSD:190,  stage:"Completed",   co2ImpactMtpa:0.9, adaptationBeneficiariesM:0,   status:"Completed" },
  { id:"P026", mdb:"ADB",  country:"Malaysia",    sector:"Energy",      sizeMnUSD:380,  stage:"Completed",   co2ImpactMtpa:1.8, adaptationBeneficiariesM:0,   status:"Completed" },
  { id:"P027", mdb:"EIB",  country:"Hungary",     sector:"Energy",      sizeMnUSD:520,  stage:"Completed",   co2ImpactMtpa:2.4, adaptationBeneficiariesM:0,   status:"Completed" },
  { id:"P028", mdb:"IADB", country:"Chile",       sector:"Energy",      sizeMnUSD:340,  stage:"Completed",   co2ImpactMtpa:1.6, adaptationBeneficiariesM:0,   status:"Completed" },
  { id:"P029", mdb:"WBG",  country:"South Africa",sector:"Energy",      sizeMnUSD:425,  stage:"Approved",    co2ImpactMtpa:2.1, adaptationBeneficiariesM:0,   status:"On Track" },
  { id:"P030", mdb:"AIIB", country:"India",       sector:"Energy",      sizeMnUSD:880,  stage:"Disbursing",  co2ImpactMtpa:4.8, adaptationBeneficiariesM:0,   status:"On Track" },
  { id:"P031", mdb:"AIIB", country:"China",       sector:"Transport",   sizeMnUSD:650,  stage:"Completed",   co2ImpactMtpa:2.8, adaptationBeneficiariesM:0,   status:"Completed" },
  { id:"P032", mdb:"NDB",  country:"Brazil",      sector:"Water",       sizeMnUSD:420,  stage:"Disbursing",  co2ImpactMtpa:0.3, adaptationBeneficiariesM:7.2, status:"On Track" },
  { id:"P033", mdb:"NDB",  country:"South Africa",sector:"Energy",      sizeMnUSD:310,  stage:"Approved",    co2ImpactMtpa:1.4, adaptationBeneficiariesM:0,   status:"On Track" },
  { id:"P034", mdb:"WBG",  country:"Vietnam",     sector:"Agriculture", sizeMnUSD:280,  stage:"Approved",    co2ImpactMtpa:0.6, adaptationBeneficiariesM:8.8, status:"On Track" },
  { id:"P035", mdb:"AfDB", country:"Rwanda",      sector:"Cities",      sizeMnUSD:120,  stage:"Pipeline",    co2ImpactMtpa:0.4, adaptationBeneficiariesM:1.4, status:"In Review" },
  { id:"P036", mdb:"EBRD", country:"Georgia",     sector:"Energy",      sizeMnUSD:88,   stage:"Approved",    co2ImpactMtpa:0.4, adaptationBeneficiariesM:0,   status:"On Track" },
  { id:"P037", mdb:"ADB",  country:"Indonesia",   sector:"Agriculture", sizeMnUSD:220,  stage:"Disbursing",  co2ImpactMtpa:0.7, adaptationBeneficiariesM:6.4, status:"Delayed" },
  { id:"P038", mdb:"EIB",  country:"Jordan",      sector:"Water",       sizeMnUSD:165,  stage:"Approved",    co2ImpactMtpa:0.1, adaptationBeneficiariesM:2.2, status:"On Track" },
  { id:"P039", mdb:"WBG",  country:"Mozambique",  sector:"Agriculture", sizeMnUSD:145,  stage:"Pipeline",    co2ImpactMtpa:0.3, adaptationBeneficiariesM:4.8, status:"Under Review" },
  { id:"P040", mdb:"IADB", country:"Mexico",      sector:"Cities",      sizeMnUSD:580,  stage:"Disbursing",  co2ImpactMtpa:2.2, adaptationBeneficiariesM:2.8, status:"On Track" },
];

// 30 country allocations (top recipients)
const COUNTRY_ALLOCS = [
  { country:"India",        total:4850, WBG:2200, ADB:1400, EIB:0,   AfDB:0,   IADB:0,   EBRD:0,  AIIB:1250 },
  { country:"Indonesia",    total:2840, WBG:980,  ADB:880,  EIB:0,   AfDB:0,   IADB:0,   EBRD:0,  AIIB:980  },
  { country:"Brazil",       total:2160, WBG:680,  ADB:0,    EIB:0,   AfDB:0,   IADB:1480,EBRD:0,  AIIB:0    },
  { country:"Egypt",        total:1820, WBG:920,  ADB:0,    EIB:540, AfDB:360, IADB:0,   EBRD:0,  AIIB:0    },
  { country:"Vietnam",      total:1580, WBG:680,  ADB:680,  EIB:0,   AfDB:0,   IADB:0,   EBRD:0,  AIIB:220  },
  { country:"South Africa", total:1440, WBG:720,  ADB:0,    EIB:0,   AfDB:410, IADB:0,   EBRD:0,  NDB:310   },
  { country:"Kenya",        total:1290, WBG:680,  ADB:0,    EIB:0,   AfDB:610, IADB:0,   EBRD:0,  AIIB:0    },
  { country:"Bangladesh",   total:1240, WBG:920,  ADB:320,  EIB:0,   AfDB:0,   IADB:0,   EBRD:0,  AIIB:0    },
  { country:"Morocco",      total:1180, WBG:340,  ADB:0,    EIB:680, AfDB:160, IADB:0,   EBRD:0,  AIIB:0    },
  { country:"Philippines",  total:1080, WBG:380,  ADB:700,  EIB:0,   AfDB:0,   IADB:0,   EBRD:0,  AIIB:0    },
  { country:"Colombia",     total:980,  WBG:320,  ADB:0,    EIB:0,   AfDB:0,   IADB:660, EBRD:0,  AIIB:0    },
  { country:"Mexico",       total:920,  WBG:340,  ADB:0,    EIB:0,   AfDB:0,   IADB:580, EBRD:0,  AIIB:0    },
  { country:"Poland",       total:1480, WBG:0,    ADB:0,    EIB:1480,AfDB:0,   IADB:0,   EBRD:0,  AIIB:0    },
  { country:"Romania",      total:880,  WBG:0,    ADB:0,    EIB:440, AfDB:0,   IADB:0,   EBRD:440,AIIB:0    },
  { country:"Turkey",       total:1240, WBG:0,    ADB:0,    EIB:840, AfDB:0,   IADB:0,   EBRD:400,AIIB:0    },
  { country:"Pakistan",     total:880,  WBG:620,  ADB:260,  EIB:0,   AfDB:0,   IADB:0,   EBRD:0,  AIIB:0    },
  { country:"Nigeria",      total:760,  WBG:380,  ADB:0,    EIB:0,   AfDB:380, IADB:0,   EBRD:0,  AIIB:0    },
  { country:"Ethiopia",     total:620,  WBG:380,  ADB:0,    EIB:0,   AfDB:240, IADB:0,   EBRD:0,  AIIB:0    },
  { country:"Tanzania",     total:480,  WBG:280,  ADB:0,    EIB:0,   AfDB:200, IADB:0,   EBRD:0,  AIIB:0    },
  { country:"Ghana",        total:440,  WBG:240,  ADB:0,    EIB:0,   AfDB:200, IADB:0,   EBRD:0,  AIIB:0    },
  { country:"Peru",         total:420,  WBG:180,  ADB:0,    EIB:0,   AfDB:0,   IADB:240, EBRD:0,  AIIB:0    },
  { country:"Chile",        total:680,  WBG:80,   ADB:0,    EIB:0,   AfDB:0,   IADB:600, EBRD:0,  AIIB:0    },
  { country:"Thailand",     total:860,  WBG:180,  ADB:560,  EIB:0,   AfDB:0,   IADB:0,   EBRD:0,  AIIB:120  },
  { country:"Malaysia",     total:640,  WBG:80,   ADB:440,  EIB:0,   AfDB:0,   IADB:0,   EBRD:0,  AIIB:120  },
  { country:"Kazakhstan",   total:480,  WBG:120,  ADB:60,   EIB:0,   AfDB:0,   IADB:0,   EBRD:300,AIIB:0    },
  { country:"Georgia",      total:220,  WBG:80,   ADB:0,    EIB:0,   AfDB:0,   IADB:0,   EBRD:140,AIIB:0    },
  { country:"Jordan",       total:380,  WBG:120,  ADB:0,    EIB:165, AfDB:0,   IADB:0,   EBRD:0,  AIIB:95   },
  { country:"Rwanda",       total:280,  WBG:100,  ADB:0,    EIB:0,   AfDB:180, IADB:0,   EBRD:0,  AIIB:0    },
  { country:"Mozambique",   total:320,  WBG:245,  ADB:0,    EIB:0,   AfDB:75,  IADB:0,   EBRD:0,  AIIB:0    },
  { country:"Uganda",       total:260,  WBG:160,  ADB:0,    EIB:0,   AfDB:100, IADB:0,   EBRD:0,  AIIB:0    },
];

// Paris alignment scorecard
const PARIS_SCORES = [
  { mdb:"WBG",  overall:100, mitigation:100, adaptation:100, mobilisation:88,  taxonomyAlign:92, reporting:100 },
  { mdb:"ADB",  overall:100, mitigation:100, adaptation:100, mobilisation:82,  taxonomyAlign:88, reporting:96  },
  { mdb:"AIIB", overall:87,  mitigation:90,  adaptation:80,  mobilisation:74,  taxonomyAlign:78, reporting:84  },
  { mdb:"EIB",  overall:100, mitigation:100, adaptation:100, mobilisation:94,  taxonomyAlign:98, reporting:100 },
  { mdb:"AfDB", overall:96,  mitigation:94,  adaptation:98,  mobilisation:72,  taxonomyAlign:82, reporting:90  },
  { mdb:"IADB", overall:100, mitigation:100, adaptation:100, mobilisation:86,  taxonomyAlign:90, reporting:98  },
  { mdb:"EBRD", overall:100, mitigation:100, adaptation:100, mobilisation:88,  taxonomyAlign:92, reporting:98  },
  { mdb:"NDB",  overall:74,  mitigation:76,  adaptation:70,  mobilisation:58,  taxonomyAlign:68, reporting:72  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MDB_COLORS = { WBG:"#3b82f6",ADB:"#10b981",AIIB:"#f59e0b",EIB:"#8b5cf6",AfDB:"#ef4444",IADB:"#06b6d4",EBRD:"#84cc16",NDB:"#f97316" };
const STAGE_COLORS = { Pipeline:"#94a3b8", Approved:"#3b82f6", Disbursing:"#10b981", Completed:"#059669", Suspended:"#dc2626" };
const SECTOR_COLORS = { Energy:"#f59e0b",Transport:"#3b82f6",Water:"#06b6d4",Cities:"#8b5cf6",Agriculture:"#10b981" };

const KpiCard = ({ label, value, sub, color=T.gold }) => (
  <div style={{ background:T.slate, border:`1px solid ${color}30`, borderRadius:6, padding:"14px 18px", minWidth:155 }}>
    <div style={{ fontFamily:T.mono, fontSize:22, fontWeight:700, color }}>{value}</div>
    <div style={{ fontSize:12, color:T.goldLight, marginTop:2 }}>{label}</div>
    {sub && <div style={{ fontFamily:T.mono, fontSize:10, color:T.muted, marginTop:3 }}>{sub}</div>}
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
    <div style={{ background:T.slate, border:`1px solid ${T.gold}60`, borderRadius:6, padding:"10px 14px", fontFamily:T.mono, fontSize:11 }}>
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
export default function MdbClimateFinancePage() {
  const [activeTab, setActiveTab]       = useState(0);
  const [selectedMdb, setSelectedMdb]   = useState(null);
  const [stageFilter, setStageFilter]   = useState("All");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [mdbFilter, setMdbFilter]       = useState("All");
  const [countrySort, setCountrySort]   = useState("total");

  const TABS = ["MDB Overview","Climate Finance Flows","Mobilisation Analytics","Country Allocations","Project Pipeline","Paris Alignment","Impact Dashboard"];

  const filteredProjects = useMemo(() => {
    let p = [...PROJECTS];
    if (stageFilter !== "All") p = p.filter(x => x.stage === stageFilter);
    if (sectorFilter !== "All") p = p.filter(x => x.sector === sectorFilter);
    if (mdbFilter !== "All") p = p.filter(x => x.mdb === mdbFilter);
    return p;
  }, [stageFilter, sectorFilter, mdbFilter]);

  const totalClimateLending  = MDBS.reduce((s,m) => s+m.climateLendingBnUSD, 0).toFixed(1);
  const totalGreenBonds      = MDBS.reduce((s,m) => s+m.greenBondIssuedBnUSD, 0).toFixed(1);
  const avgMobilisation      = (MDBS.reduce((s,m) => s+m.mobilisationRatio, 0)/MDBS.length).toFixed(1);
  const totalGhgAvoided      = PROJECTS.reduce((s,p) => s+p.co2ImpactMtpa, 0).toFixed(1);
  const totalBeneficiaries   = PROJECTS.reduce((s,p) => s+p.adaptationBeneficiariesM, 0).toFixed(1);
  const adaptationProjects   = PROJECTS.filter(p => p.adaptationBeneficiariesM > 0).length;

  const latestMobilisation   = MOBILISATION[MOBILISATION.length-1];
  const totalMobilised2023   = Object.keys(MDB_COLORS).reduce((s,k) => s+(latestMobilisation[k]||0), 0).toFixed(0);

  // Stacked area data: annotate year total
  const areaData = ANNUAL_CF.map(row => ({ ...row, total: Object.keys(MDB_COLORS).reduce((s,k) => s+(row[k]||0), 0) }));

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
    th:      { padding:"8px 12px", fontFamily:T.mono, fontSize:10, color:T.gold, textAlign:"left", background:T.navy, whiteSpace:"nowrap" },
    td:      { padding:"7px 12px", fontSize:12, borderBottom:"1px solid #f0ece4" },
    statusBar:{ background:T.navy, borderTop:`1px solid ${T.gold}30`, padding:"6px 28px", display:"flex", gap:20, justifyContent:"flex-end" },
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
          <span style={S.modTag}>EP-AX5</span>
          <span style={{ color:T.gold, fontFamily:T.mono, fontSize:11 }}>SOVEREIGN CLIMATE RISK INTELLIGENCE</span>
        </div>
        <h1 style={{ margin:0, color:T.white, fontSize:22, fontWeight:700 }}>Multilateral Development Bank Climate Finance</h1>
        <div style={{ color:"#94a3b8", fontSize:12, marginTop:4 }}>
          8 MDBs · Climate finance flows 2015–2023 · Project pipeline · Paris alignment · Mobilisation analytics
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {TABS.map((t,i) => <div key={i} style={S.tab(activeTab===i)} onClick={() => setActiveTab(i)}>{t}</div>)}
      </div>

      <div style={S.body}>

        {/* ══ TAB 0: MDB OVERVIEW ══ */}
        {activeTab === 0 && (
          <>
            <div style={S.kpiRow}>
              <KpiCard label="Total MDB Climate Lending" value={`$${totalClimateLending}bn`}  sub="Annual 2023" color={T.green} />
              <KpiCard label="MDB Green Bonds Issued"    value={`$${totalGreenBonds}bn`}       sub="Cumulative all MDBs" color={T.teal} />
              <KpiCard label="Avg Mobilisation Ratio"    value={`${avgMobilisation}x`}          sub="Private $ per MDB $" color={T.gold} />
              <KpiCard label="Total GHG Avoided"         value={`${totalGhgAvoided} Mtpa`}      sub="Pipeline projects" color={T.green} />
              <KpiCard label="MDBs Tracked"              value="8"                              sub="Global + regional" />
            </div>

            <div style={S.card}>
              <SectionHeader title="MDB Climate Lending 2023 — Volume & Climate Share %" />
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={MDBS.map(m => ({ name:m.id, climate:m.climateLendingBnUSD, total:m.totalAnnualLendingBnUSD, share:m.climateSharePct }))}
                  margin={{ top:10, right:40, bottom:5, left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                  <XAxis dataKey="name" tick={{ fontFamily:T.mono, fontSize:10 }} />
                  <YAxis yAxisId="left"  tick={{ fontFamily:T.mono, fontSize:10 }} label={{ value:"$bn", angle:-90, position:"insideLeft", style:{ fontFamily:T.mono, fontSize:10, fill:T.muted } }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontFamily:T.mono, fontSize:10 }} label={{ value:"Share %", angle:90, position:"insideRight", style:{ fontFamily:T.mono, fontSize:10, fill:T.muted } }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={v=><span style={{ fontFamily:T.mono, fontSize:10 }}>{v}</span>} />
                  <Bar yAxisId="left" dataKey="total"   name="Total Lending ($bn)"   fill={`${T.slate}88`} radius={[3,3,0,0]} />
                  <Bar yAxisId="left" dataKey="climate" name="Climate Lending ($bn)"  fill={T.green} radius={[3,3,0,0]} />
                  <Line yAxisId="right" type="monotone" dataKey="share" name="Climate Share %" stroke={T.gold} strokeWidth={2} dot={{ fill:T.gold, r:4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
              {MDBS.map(m => (
                <div key={m.id} onClick={() => { setSelectedMdb(m); setActiveTab(1); }}
                  style={{ background:T.white, border:`1px solid ${m.color}44`, borderRadius:8, padding:"14px 16px", cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor=m.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor=`${m.color}44`}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <span style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:m.color }}>{m.id}</span>
                    <Badge label={m.creditRating} color={T.green} />
                  </div>
                  <div style={{ fontSize:11, color:T.muted, marginBottom:4 }}>{m.name}</div>
                  <div style={{ fontFamily:T.mono, fontSize:18, fontWeight:700, color:T.navy }}>${m.climateLendingBnUSD}bn</div>
                  <div style={{ fontSize:10, color:T.muted }}>Climate lending · {m.climateSharePct}% of portfolio</div>
                  <div style={{ background:"#f0ece4", height:4, borderRadius:2, marginTop:8 }}>
                    <div style={{ background:m.color, width:`${m.climateSharePct}%`, height:"100%", borderRadius:2 }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══ TAB 1: CLIMATE FINANCE FLOWS ══ */}
        {activeTab === 1 && (
          <>
            <div style={S.kpiRow}>
              <KpiCard label="2023 Total MDB Climate" value={`$${areaData[8]?.total?.toFixed(1)}bn`} sub="All 8 MDBs" color={T.green} />
              <KpiCard label="2015 Baseline"          value={`$${areaData[0]?.total?.toFixed(1)}bn`} sub="Starting point" color={T.muted} />
              <KpiCard label="CAGR 2015–2023"         value={`${((Math.pow(areaData[8]?.total/areaData[0]?.total,1/8)-1)*100).toFixed(1)}%`} sub="Compound growth" color={T.gold} />
              <KpiCard label="EIB Climate 2023"       value="$36.1bn" sub="Largest MDB climate lender" color={T.purple} />
            </div>
            <div style={S.card}>
              <SectionHeader title="Total MDB Climate Finance by Institution 2015–2023 ($bn Stacked)" />
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={areaData} margin={{ top:10, right:20, bottom:5, left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                  <XAxis dataKey="year" tick={{ fontFamily:T.mono, fontSize:10 }} />
                  <YAxis tick={{ fontFamily:T.mono, fontSize:10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={v=><span style={{ fontFamily:T.mono, fontSize:10 }}>{v}</span>} />
                  {Object.keys(MDB_COLORS).map(k => (
                    <Area key={k} type="monotone" dataKey={k} stackId="1" stroke={MDB_COLORS[k]} fill={`${MDB_COLORS[k]}88`} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={S.card}>
              <SectionHeader title="Mitigation vs Adaptation Split 2023 ($bn)" />
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={MDBS.map(m=>({ name:m.id, Mitigation:m.mitigationBnUSD, Adaptation:m.adaptationBnUSD }))}
                  margin={{ top:5, right:10, bottom:5, left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                  <XAxis dataKey="name" tick={{ fontFamily:T.mono, fontSize:10 }} />
                  <YAxis tick={{ fontFamily:T.mono, fontSize:10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={v=><span style={{ fontFamily:T.mono, fontSize:10 }}>{v}</span>} />
                  <Bar dataKey="Mitigation" stackId="a" fill={T.green} radius={[0,0,0,0]} />
                  <Bar dataKey="Adaptation" stackId="a" fill={T.teal}  radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ══ TAB 2: MOBILISATION ANALYTICS ══ */}
        {activeTab === 2 && (
          <>
            <div style={S.kpiRow}>
              <KpiCard label="Total Private Finance Mobilised" value={`$${totalMobilised2023}bn`} sub="2023 — all MDBs" color={T.gold} />
              <KpiCard label="EIB Mobilisation (2023)"         value="$112.1bn" sub="Largest mobiliser" color={T.purple} />
              <KpiCard label="Best Mobilisation Ratio"          value="3.1x" sub="EIB private per $" color={T.green} />
              <KpiCard label="NDB Mobilisation Ratio"           value="1.2x" sub="Needs improvement" color={T.amber} />
            </div>
            <div style={S.card}>
              <SectionHeader title="Private Finance Mobilisation by MDB 2019–2023 ($bn)" />
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={MOBILISATION} margin={{ top:10, right:20, bottom:5, left:10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                  <XAxis dataKey="year" tick={{ fontFamily:T.mono, fontSize:10 }} />
                  <YAxis tick={{ fontFamily:T.mono, fontSize:10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={v=><span style={{ fontFamily:T.mono, fontSize:10 }}>{v}</span>} />
                  {Object.keys(MDB_COLORS).map(k => (
                    <Line key={k} type="monotone" dataKey={k} stroke={MDB_COLORS[k]} strokeWidth={2} dot={false} />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={S.card}>
              <SectionHeader title="Mobilisation Ratio — Private $ per $1 MDB Climate Lending" />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={MDBS.map(m=>({ name:m.id, ratio:m.mobilisationRatio, color:m.color }))}
                  layout="vertical" margin={{ top:5, right:30, bottom:5, left:40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                  <XAxis type="number" tick={{ fontFamily:T.mono, fontSize:10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontFamily:T.mono, fontSize:10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="ratio" name="Mobilisation Ratio (x)" radius={[0,3,3,0]}>
                    <LabelList dataKey="ratio" position="right" style={{ fontFamily:T.mono, fontSize:10, fill:T.muted }} formatter={v=>`${v}x`} />
                    {MDBS.map((m,i) => <Cell key={i} fill={m.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ══ TAB 3: COUNTRY ALLOCATIONS ══ */}
        {activeTab === 3 && (
          <>
            <div style={S.kpiRow}>
              <KpiCard label="Countries with Allocations" value={COUNTRY_ALLOCS.length} sub="Top 30 recipients" />
              <KpiCard label="Largest Recipient"          value="India $4.85bn" sub="2023 aggregate MDB" color={T.gold} />
              <KpiCard label="Africa Recipients"          value={COUNTRY_ALLOCS.filter(c=>["Kenya","Ethiopia","Ghana","Nigeria","Tanzania","Rwanda","Uganda","Mozambique","South Africa"].includes(c.country)).length} sub="AfDB-dominated" color={T.amber} />
            </div>
            <div style={S.card}>
              <SectionHeader title="Top 20 Country Allocations by MDB ($mn) — 2023" />
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={[...COUNTRY_ALLOCS].sort((a,b)=>b.total-a.total).slice(0,20).map(c => ({ name:c.country.length>10?c.country.slice(0,10)+"…":c.country, WBG:c.WBG||0, ADB:c.ADB||0, AIIB:c.AIIB||0, EIB:c.EIB||0, AfDB:c.AfDB||0, IADB:c.IADB||0, EBRD:c.EBRD||0, NDB:c.NDB||0 }))}
                  margin={{ top:5, right:10, bottom:40, left:10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                  <XAxis dataKey="name" tick={{ fontFamily:T.mono, fontSize:8, angle:-35, textAnchor:"end" }} />
                  <YAxis tick={{ fontFamily:T.mono, fontSize:9 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={v=><span style={{ fontFamily:T.mono, fontSize:10 }}>{v}</span>} />
                  {Object.keys(MDB_COLORS).map(k => <Bar key={k} dataKey={k} stackId="a" fill={MDB_COLORS[k]} />)}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={S.card}>
              <SectionHeader title="Country Allocation Detail" />
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>{["Country","Total ($mn)","WBG","ADB","AIIB","EIB","AfDB","IADB","EBRD"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {[...COUNTRY_ALLOCS].sort((a,b)=>b[countrySort]-a[countrySort]).map((c,i) => (
                      <tr key={c.country} style={{ background:i%2===0?T.white:"#faf8f4" }}>
                        <td style={{ ...S.td, fontWeight:600 }}>{c.country}</td>
                        <td style={{ ...S.td, fontFamily:T.mono, color:T.gold, fontWeight:700 }}>${c.total.toLocaleString()}</td>
                        {["WBG","ADB","AIIB","EIB","AfDB","IADB","EBRD"].map(k => (
                          <td key={k} style={{ ...S.td, fontFamily:T.mono, color:c[k]>0?MDB_COLORS[k]:T.muted, fontSize:11 }}>
                            {c[k]>0 ? `$${c[k]}` : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ TAB 4: PROJECT PIPELINE ══ */}
        {activeTab === 4 && (
          <>
            <div style={S.kpiRow}>
              <KpiCard label="Total Projects"     value={PROJECTS.length}        sub="40 pipeline entries" />
              <KpiCard label="Active Disbursing"  value={PROJECTS.filter(p=>p.stage==="Disbursing").length} sub="Funds deployed" color={T.green} />
              <KpiCard label="Pipeline Value"     value={`$${(PROJECTS.reduce((s,p)=>s+p.sizeMnUSD,0)/1000).toFixed(1)}bn`} sub="Aggregate" color={T.gold} />
              <KpiCard label="Completed"          value={PROJECTS.filter(p=>p.stage==="Completed").length} sub="Projects closed" color={T.teal} />
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
              {["All","Pipeline","Approved","Disbursing","Completed"].map(s => (
                <button key={s} onClick={() => setStageFilter(s)}
                  style={{ padding:"5px 11px", borderRadius:4, border:`1px solid ${stageFilter===s?STAGE_COLORS[s]||T.gold:"#ccc"}`, background:stageFilter===s?`${STAGE_COLORS[s]||T.gold}22`:T.white, color:stageFilter===s?STAGE_COLORS[s]||T.gold:T.muted, fontFamily:T.mono, fontSize:10, cursor:"pointer" }}>
                  {s}
                </button>
              ))}
              <span style={{ color:T.muted, fontSize:10, fontFamily:T.mono, alignSelf:"center", marginLeft:4 }}>|</span>
              {["All","Energy","Transport","Water","Cities","Agriculture"].map(s => (
                <button key={s} onClick={() => setSectorFilter(s)}
                  style={{ padding:"5px 11px", borderRadius:4, border:`1px solid ${sectorFilter===s?SECTOR_COLORS[s]||T.gold:"#ccc"}`, background:sectorFilter===s?`${SECTOR_COLORS[s]||T.gold}22`:T.white, color:sectorFilter===s?SECTOR_COLORS[s]||T.gold:T.muted, fontFamily:T.mono, fontSize:10, cursor:"pointer" }}>
                  {s}
                </button>
              ))}
            </div>
            <div style={S.card}>
              <SectionHeader title={`Project Pipeline — ${filteredProjects.length} projects shown`} />
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>{["ID","MDB","Country","Sector","Size ($mn)","Stage","CO₂ (Mtpa)","Adap. Benef (M)","Status"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((p,i) => (
                      <tr key={p.id} style={{ background:i%2===0?T.white:"#faf8f4" }}>
                        <td style={{ ...S.td, fontFamily:T.mono, fontSize:10, color:T.muted }}>{p.id}</td>
                        <td style={S.td}><Badge label={p.mdb} color={MDB_COLORS[p.mdb]} /></td>
                        <td style={{ ...S.td, fontWeight:600 }}>{p.country}</td>
                        <td style={S.td}><Badge label={p.sector} color={SECTOR_COLORS[p.sector]} /></td>
                        <td style={{ ...S.td, fontFamily:T.mono, color:T.gold }}>${p.sizeMnUSD.toLocaleString()}</td>
                        <td style={S.td}><Badge label={p.stage} color={STAGE_COLORS[p.stage]||T.muted} /></td>
                        <td style={{ ...S.td, fontFamily:T.mono, color:T.green }}>{p.co2ImpactMtpa.toFixed(1)}</td>
                        <td style={{ ...S.td, fontFamily:T.mono }}>{p.adaptationBeneficiariesM>0?p.adaptationBeneficiariesM.toFixed(1):"—"}</td>
                        <td style={S.td}><Badge label={p.status} color={p.status==="On Track"?T.green:p.status==="Delayed"?T.amber:p.status==="Completed"?T.teal:T.red} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ TAB 5: PARIS ALIGNMENT ══ */}
        {activeTab === 5 && (
          <>
            <div style={S.kpiRow}>
              <KpiCard label="100% Paris-Aligned MDBs" value={MDBS.filter(m=>m.parisAlignedPct===100).length} sub="of 8 institutions" color={T.green} />
              <KpiCard label="Lowest Alignment"        value="NDB 74%" sub="Needs improvement" color={T.amber} />
              <KpiCard label="MDB Green Bonds Total"   value={`$${totalGreenBonds}bn`} sub="Cumulative issued" color={T.teal} />
            </div>
            <div style={S.card}>
              <SectionHeader title="Paris Alignment Scorecard by Dimension" />
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>{["MDB","Overall %","Mitigation","Adaptation","Mobilisation","Taxonomy Align","Reporting","Green Bonds ($bn)"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {PARIS_SCORES.map((ps,i) => {
                      const mdb = MDBS.find(m=>m.id===ps.mdb);
                      return (
                        <tr key={ps.mdb} style={{ background:i%2===0?T.white:"#faf8f4" }}>
                          <td style={S.td}><Badge label={ps.mdb} color={MDB_COLORS[ps.mdb]} /></td>
                          {[ps.overall,ps.mitigation,ps.adaptation,ps.mobilisation,ps.taxonomyAlign,ps.reporting].map((v,j) => (
                            <td key={j} style={{ ...S.td, fontFamily:T.mono, color:v>=95?T.green:v>=80?T.amber:T.red }}>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <div style={{ width:50, background:"#f0ece4", height:5, borderRadius:2 }}>
                                  <div style={{ background:v>=95?T.green:v>=80?T.amber:T.red, width:`${v}%`, height:"100%", borderRadius:2 }} />
                                </div>
                                <span>{v}%</span>
                              </div>
                            </td>
                          ))}
                          <td style={{ ...S.td, fontFamily:T.mono, color:T.gold }}>${mdb?.greenBondIssuedBnUSD}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={S.card}>
              <SectionHeader title="MDB Green Bond Issuances — Cumulative ($bn)" />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[...MDBS].sort((a,b)=>b.greenBondIssuedBnUSD-a.greenBondIssuedBnUSD)}
                  margin={{ top:5, right:10, bottom:5, left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                  <XAxis dataKey="id" tick={{ fontFamily:T.mono, fontSize:10 }} />
                  <YAxis tick={{ fontFamily:T.mono, fontSize:10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="greenBondIssuedBnUSD" name="Green Bonds ($bn)" radius={[3,3,0,0]}>
                    {MDBS.map((m,i) => <Cell key={i} fill={m.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ══ TAB 6: IMPACT DASHBOARD ══ */}
        {activeTab === 6 && (
          <>
            <div style={S.kpiRow}>
              <KpiCard label="Total GHG Avoided"       value={`${totalGhgAvoided} Mtpa`} sub="Pipeline projects" color={T.green} />
              <KpiCard label="Adaptation Beneficiaries" value={`${totalBeneficiaries}M`} sub="People protected" color={T.teal} />
              <KpiCard label="Adaptation Projects"      value={adaptationProjects} sub="With beneficiary data" color={T.indigo} />
              <KpiCard label="Largest CO₂ Impact"       value="4.8 Mtpa" sub="AIIB India P030" color={T.green} />
              <KpiCard label="Total Projects"           value={PROJECTS.length} sub="Across 8 MDBs" />
            </div>

            <div style={S.grid2}>
              <div style={S.card}>
                <SectionHeader title="CO₂ Impact by MDB — Top 15 Projects (Mtpa)" />
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[...PROJECTS].sort((a,b)=>b.co2ImpactMtpa-a.co2ImpactMtpa).slice(0,15).map(p=>({ name:p.id, value:p.co2ImpactMtpa, mdb:p.mdb }))}
                    layout="vertical" margin={{ top:5, right:40, bottom:5, left:40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                    <XAxis type="number" tick={{ fontFamily:T.mono, fontSize:9 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontFamily:T.mono, fontSize:9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="CO₂ Impact (Mtpa)" radius={[0,3,3,0]}>
                      {[...PROJECTS].sort((a,b)=>b.co2ImpactMtpa-a.co2ImpactMtpa).slice(0,15).map((p,i) => <Cell key={i} fill={MDB_COLORS[p.mdb]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={S.card}>
                <SectionHeader title="Adaptation Beneficiaries by Project (Top 12, Millions)" />
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[...PROJECTS].filter(p=>p.adaptationBeneficiariesM>0).sort((a,b)=>b.adaptationBeneficiariesM-a.adaptationBeneficiariesM).slice(0,12).map(p=>({ name:p.id, value:p.adaptationBeneficiariesM, mdb:p.mdb }))}
                    layout="vertical" margin={{ top:5, right:40, bottom:5, left:40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5ddd0" />
                    <XAxis type="number" tick={{ fontFamily:T.mono, fontSize:9 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontFamily:T.mono, fontSize:9 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Beneficiaries (M)" radius={[0,3,3,0]}>
                      {[...PROJECTS].filter(p=>p.adaptationBeneficiariesM>0).sort((a,b)=>b.adaptationBeneficiariesM-a.adaptationBeneficiariesM).slice(0,12).map((p,i) => <Cell key={i} fill={MDB_COLORS[p.mdb]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={S.card}>
              <SectionHeader title="Impact KPI Summary by MDB" />
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                {MDBS.map(m => {
                  const mdbProjs = PROJECTS.filter(p=>p.mdb===m.id);
                  const co2 = mdbProjs.reduce((s,p)=>s+p.co2ImpactMtpa,0).toFixed(1);
                  const benef = mdbProjs.reduce((s,p)=>s+p.adaptationBeneficiariesM,0).toFixed(1);
                  const totalSz = (mdbProjs.reduce((s,p)=>s+p.sizeMnUSD,0)/1000).toFixed(1);
                  return (
                    <div key={m.id} style={{ background:"#faf8f4", borderRadius:6, padding:"12px 14px", border:`1px solid ${m.color}33` }}>
                      <Badge label={m.id} color={m.color} />
                      <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:4 }}>
                        <div style={{ fontFamily:T.mono, fontSize:11, color:T.muted }}>GHG Avoided: <span style={{ color:T.green }}>{co2} Mtpa</span></div>
                        <div style={{ fontFamily:T.mono, fontSize:11, color:T.muted }}>Beneficiaries: <span style={{ color:T.teal }}>{benef}M</span></div>
                        <div style={{ fontFamily:T.mono, fontSize:11, color:T.muted }}>Project Vol: <span style={{ color:T.gold }}>${totalSz}bn</span></div>
                        <div style={{ fontFamily:T.mono, fontSize:11, color:T.muted }}>Projects: <span style={{ color:T.navy }}>{mdbProjs.length}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Status bar */}
      <div style={S.statusBar}>
        {[["MODULE","EP-AX5"],["MDBS","8"],["PROJECTS","40"],["COUNTRIES","30"],["UPDATED","2026-Q1"]].map(([k,v]) => (
          <span key={k} style={{ fontFamily:T.mono, fontSize:9, color:T.muted }}>{k}: <span style={{ color:T.gold }}>{v}</span></span>
        ))}
      </div>
    </div>
  );
}
