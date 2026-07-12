import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, LineChart, Line, ComposedChart, Area, ReferenceLine,
} from 'recharts';

// ---------------------------------------------------------------------------
// CBAM Trade Exposure Mapper
// HS-code-level EU import exposure for the 6 CBAM-covered sectors
// (Regulation (EU) 2023/956): iron & steel, aluminium, cement, fertilisers,
// hydrogen, electricity.
//
// WIRED to the existing backend CBAM engine (backend/services/cbam_service.py
// + backend/api/v1/routes/cbam.py):
//   GET  /api/v1/cbam/free-allocation-schedule  -> phase-in 2026-2034
//   GET  /api/v1/cbam/ets-price-scenarios       -> ETS price paths
//   POST /api/v1/cbam/calculate-cost            -> net CBAM cost per origin
// Local fallbacks mirror the engine formula exactly and are labelled Demo.
// ---------------------------------------------------------------------------

const API = 'http://localhost:8001';
const CBAM_API = `${API}/api/v1/cbam`;
const COMTRADE_API = `${API}/api/v1/un-comtrade`;

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f4f6f9',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

// ---------------------------------------------------------------------------
// Engine fallbacks — verbatim copies of backend/services/cbam_service.py
// constants, used ONLY when the API is unreachable (Demo badge shown).
// ---------------------------------------------------------------------------
const FREE_ALLOC_FALLBACK = {
  2026: 97.5, 2027: 95.0, 2028: 90.0, 2029: 77.5, 2030: 51.5,
  2031: 39.0, 2032: 26.5, 2033: 14.0, 2034: 0.0,
};
const ETS_SCENARIOS_FALLBACK = {
  'Current Trend': { 2025: 70, 2026: 75, 2027: 80, 2028: 85, 2030: 95, 2035: 120, 2040: 150, 2050: 200 },
  'Ambitious': { 2025: 80, 2026: 90, 2027: 105, 2028: 120, 2030: 160, 2035: 250, 2040: 350, 2050: 500 },
  'Conservative': { 2025: 65, 2026: 68, 2027: 70, 2028: 72, 2030: 78, 2035: 90, 2040: 105, 2050: 130 },
};

// Linear interpolation across sparse {year: price} paths (mirrors backend
// CBAMCostProjector._interpolate_price).
const interpPrice = (prices, year) => {
  const years = Object.keys(prices).map(Number).sort((a, b) => a - b);
  if (!years.length) return 0;
  if (prices[year] !== undefined) return prices[year];
  if (year < years[0]) return prices[years[0]];
  if (year > years[years.length - 1]) return prices[years[years.length - 1]];
  const prev = Math.max(...years.filter(y => y <= year));
  const next = Math.min(...years.filter(y => y >= year));
  if (prev === next) return prices[prev];
  const frac = (year - prev) / (next - prev);
  return prices[prev] + frac * (prices[next] - prices[prev]);
};

// Mirror of backend calculate_cbam_cost() — Demo fallback only.
const localCbamCost = (emissionsT, etsPrice, domesticPrice, freePct) => {
  const gross = emissionsT * etsPrice;
  const domCredit = emissionsT * domesticPrice;
  const freeRed = gross * (freePct / 100);
  return {
    gross_cost_eur: gross,
    domestic_credit_eur: domCredit,
    free_allocation_reduction_eur: freeRed,
    net_cbam_cost_eur: Math.max(0, gross - domCredit - freeRed),
  };
};

// ---------------------------------------------------------------------------
// REAL TRADE-PATTERN EXTRACT — hand-compiled from UN Comtrade / Eurostat
// COMEXT aggregate patterns (~2023-24). Values are APPROXIMATE (rounded,
// order-of-magnitude-correct); refresh from CEPII BACI bulk download for
// production precision. Carbon intensities are approximate production-route
// figures with the basis noted per row.
//
// CBAM emissions scope per Annex II, Regulation (EU) 2023/956:
//   - Iron & steel, aluminium, hydrogen  -> DIRECT emissions only (indirect
//     inclusion deferred pending Commission review)
//   - Cement, fertilisers, electricity   -> direct + indirect
// The cost engine below uses the scope-correct intensity per sector; the
// total (direct+indirect) figure is shown for context.
//
// flags: 'exempt'         — EEA/EFTA countries in (or linked to) the EU ETS
//                           (Norway, Iceland, Switzerland; Annex III)
//        'exempt-pending' — UK: EU-UK ETS linkage agreed in principle
//                           (May 2025); exemption expected once linked
//        'sanction'       — flow affected by EU sanctions (see note)
//        'note'           — other material caveat
// carbonPriceEur: approximate EFFECTIVE carbon price paid on export
// production (deductible under CBAM Art. 9) — conservative estimates after
// free allocation in the origin scheme.
// ---------------------------------------------------------------------------
const DATA_LABEL = 'Real trade-pattern extract (UN Comtrade / Eurostat COMEXT aggregates, ~2023-24, hand-compiled approximations) — refresh from CEPII BACI bulk for production precision';

const CBAM_SECTORS = [
  {
    key: 'steel', name: 'Iron & Steel', hs: 'HS 72 + selected 73', unit: 'Mt', intensityUnit: 'tCO2/t',
    scope: 'direct', color: T.navy,
    euComparator: { label: 'EU-27 avg (route mix, direct)', value: 1.2 },
    benchmarkNote: 'EU ETS product benchmarks: hot metal 1.288 tCO2/t; EAF carbon steel 0.215 tCO2/t (direct). EU BF-BOF avg ≈1.9 direct; EAF scrap route ≈0.2-0.4 direct.',
    origins: [
      { name: 'Turkey', iso: 'TR', tradeEurBn: 5.6, volume: 5.5, intensityDirect: 0.8, intensityTotal: 1.35, carbonPriceEur: 0, basis: '≈70% EAF scrap route (low direct); total raised by carbon-intensive grid (~0.42 tCO2/MWh). Turkish ETS pilot planned ~2026.', flags: [] },
      { name: 'India', iso: 'IN', tradeEurBn: 3.2, volume: 3.6, intensityDirect: 2.4, intensityTotal: 2.9, carbonPriceEur: 0, basis: 'BF-BOF + coal-based DRI dominant — among highest steel intensities globally. CCTS not yet an absolute price.', flags: [] },
      { name: 'South Korea', iso: 'KR', tradeEurBn: 3.5, volume: 3.3, intensityDirect: 1.9, intensityTotal: 2.1, carbonPriceEur: 5, basis: 'BF-BOF (POSCO / Hyundai Steel). K-ETS price low with high free allocation — effective paid ≈€5/t.', flags: [] },
      { name: 'China', iso: 'CN', tradeEurBn: 4.0, volume: 3.0, intensityDirect: 2.0, intensityTotal: 2.3, carbonPriceEur: 2, basis: '≈90% BF-BOF. National ETS extended to steel (2024-25); intensity-based with large free allocation — effective paid ≈€1-3/t.', flags: [] },
      { name: 'Ukraine', iso: 'UA', tradeEurBn: 1.7, volume: 2.0, intensityDirect: 2.1, intensityTotal: 2.3, carbonPriceEur: 0.75, basis: 'BF-BOF (Metinvest). Volumes war-reduced from ~4.5 Mt pre-2022. Small CO2 tax (~€0.75/t).', flags: ['note'], note: 'War-affected: volumes roughly halved vs pre-2022.' },
      { name: 'Japan', iso: 'JP', tradeEurBn: 1.5, volume: 1.3, intensityDirect: 1.9, intensityTotal: 2.0, carbonPriceEur: 0, basis: 'BF-BOF; GX-ETS voluntary phase — no effective mandatory price yet.', flags: [] },
      { name: 'Taiwan', iso: 'TW', tradeEurBn: 1.2, volume: 1.2, intensityDirect: 1.8, intensityTotal: 2.1, carbonPriceEur: 9, basis: 'BF-BOF (China Steel). Carbon fee from 2025 (~NT$300 ≈ €9/t).', flags: [] },
      { name: 'Vietnam', iso: 'VN', tradeEurBn: 1.1, volume: 1.3, intensityDirect: 2.2, intensityTotal: 2.5, carbonPriceEur: 0, basis: 'Growing BF-BOF capacity (Hoa Phat); coal-heavy.', flags: [] },
      { name: 'United Kingdom', iso: 'GB', tradeEurBn: 1.5, volume: 1.0, intensityDirect: 1.6, intensityTotal: 1.8, carbonPriceEur: 45, basis: 'BF-BOF transitioning to EAF (Port Talbot). UK ETS ≈€40-50/t.', flags: ['exempt-pending'], note: 'EU-UK ETS linkage agreed in principle (May 2025) — exemption expected once linked.' },
      { name: 'Russia', iso: 'RU', tradeEurBn: 0.8, volume: 1.3, intensityDirect: 1.9, intensityTotal: 2.1, carbonPriceEur: 0, basis: 'BF-BOF. Pre-sanction ~4 Mt/yr.', flags: ['sanction'], note: 'Finished steel banned (Mar 2022 packages); residual semi-finished (slab/pig iron) quota phases out by 2028.' },
    ],
  },
  {
    key: 'aluminium', name: 'Aluminium', hs: 'HS 76', unit: 'Mt', intensityUnit: 'tCO2/t',
    scope: 'direct', color: T.teal,
    euComparator: { label: 'EU-27 primary avg (direct)', value: 1.5 },
    benchmarkNote: 'Smelting direct emissions (anode consumption + PFCs) ≈1.5-1.9 tCO2/t regardless of power source; electricity is INDIRECT and currently outside CBAM scope for aluminium — the total column shows how much the pending indirect review matters (hydro ~2-3 vs coal ~15-19 total).',
    origins: [
      { name: 'Norway', iso: 'NO', tradeEurBn: 3.4, volume: 1.3, intensityDirect: 1.6, intensityTotal: 2.8, carbonPriceEur: 0, basis: 'Hydro-powered smelters (Hydro, Alcoa). In EU ETS via EEA.', flags: ['exempt'], note: 'EEA member in EU ETS — outside CBAM scope (Annex III).' },
      { name: 'UAE', iso: 'AE', tradeEurBn: 2.5, volume: 1.0, intensityDirect: 1.7, intensityTotal: 7.8, carbonPriceEur: 0, basis: 'EGA — gas-fired captive power; total intensity dominated by indirect (currently out of CBAM scope).', flags: [] },
      { name: 'Iceland', iso: 'IS', tradeEurBn: 1.5, volume: 0.65, intensityDirect: 1.6, intensityTotal: 1.9, carbonPriceEur: 0, basis: 'Hydro/geothermal power (Alcoa, Rio Tinto, Century).', flags: ['exempt'], note: 'EEA member in EU ETS — outside CBAM scope.' },
      { name: 'China', iso: 'CN', tradeEurBn: 1.8, volume: 0.6, intensityDirect: 1.8, intensityTotal: 14.5, carbonPriceEur: 2, basis: 'Mostly semis; coal-heavy grid. National ETS extended to aluminium smelting (2024-25) — effective paid low.', flags: [] },
      { name: 'India', iso: 'IN', tradeEurBn: 1.2, volume: 0.5, intensityDirect: 1.9, intensityTotal: 18.5, carbonPriceEur: 0, basis: 'Captive coal power (Vedanta, Hindalco) — among highest total intensities globally.', flags: [] },
      { name: 'Turkey', iso: 'TR', tradeEurBn: 1.0, volume: 0.35, intensityDirect: 1.6, intensityTotal: 6.5, carbonPriceEur: 0, basis: 'Mostly semis/extrusions; grid-powered remelt + some primary.', flags: [] },
      { name: 'Mozambique', iso: 'MZ', tradeEurBn: 0.8, volume: 0.35, intensityDirect: 1.7, intensityTotal: 2.6, carbonPriceEur: 0, basis: 'Mozal smelter — Cahora Bassa hydro via Motraco (some South African coal wheeling).', flags: [] },
      { name: 'Bahrain', iso: 'BH', tradeEurBn: 0.5, volume: 0.2, intensityDirect: 1.7, intensityTotal: 8.2, carbonPriceEur: 0, basis: 'Alba — gas-fired captive power.', flags: [] },
      { name: 'Russia', iso: 'RU', tradeEurBn: 0.6, volume: 0.3, intensityDirect: 1.6, intensityTotal: 4.2, carbonPriceEur: 0, basis: 'Rusal — largely Siberian hydro. Pre-sanction ~0.9 Mt/yr.', flags: ['sanction'], note: 'Primary aluminium banned under 16th sanctions package (Feb 2025) with ~275 kt import-quota phase-out.' },
    ],
  },
  {
    key: 'cement', name: 'Cement', hs: 'HS 2523', unit: 'Mt', intensityUnit: 'tCO2/t',
    scope: 'direct+indirect', color: T.amber,
    euComparator: { label: 'EU-27 avg grey cement', value: 0.60 },
    benchmarkNote: 'EU ETS clinker benchmark ≈0.693 tCO2/t clinker. Cement intensity depends on clinker ratio; world average ≈0.6 tCO2/t cement. Indirect emissions ARE in CBAM scope for cement.',
    origins: [
      { name: 'Turkey', iso: 'TR', tradeEurBn: 0.45, volume: 6.5, intensityDirect: 0.60, intensityTotal: 0.65, carbonPriceEur: 0, basis: 'Dominant EU supplier (~half of extra-EU cement imports); modern dry kilns, coal/petcoke-fired.', flags: [] },
      { name: 'Ukraine', iso: 'UA', tradeEurBn: 0.09, volume: 1.4, intensityDirect: 0.65, intensityTotal: 0.70, carbonPriceEur: 0.75, basis: 'Clinker + cement to eastern EU members.', flags: [] },
      { name: 'Algeria', iso: 'DZ', tradeEurBn: 0.08, volume: 1.2, intensityDirect: 0.64, intensityTotal: 0.70, carbonPriceEur: 0, basis: 'Gas-fired kilns; export surplus capacity.', flags: [] },
      { name: 'Egypt', iso: 'EG', tradeEurBn: 0.05, volume: 0.8, intensityDirect: 0.68, intensityTotal: 0.75, carbonPriceEur: 0, basis: 'Coal/gas kilns; growing clinker exports.', flags: [] },
      { name: 'United Kingdom', iso: 'GB', tradeEurBn: 0.06, volume: 0.6, intensityDirect: 0.55, intensityTotal: 0.60, carbonPriceEur: 45, basis: 'Cross-Channel/Irish Sea flows. UK ETS priced.', flags: ['exempt-pending'], note: 'Expected exemption on EU-UK ETS linkage.' },
      { name: 'Morocco', iso: 'MA', tradeEurBn: 0.03, volume: 0.5, intensityDirect: 0.62, intensityTotal: 0.68, carbonPriceEur: 0, basis: 'To Iberia; modern kilns.', flags: [] },
      { name: 'Vietnam', iso: 'VN', tradeEurBn: 0.03, volume: 0.45, intensityDirect: 0.65, intensityTotal: 0.72, carbonPriceEur: 0, basis: 'World-scale export clinker capacity; long haul to EU.', flags: [] },
      { name: 'Tunisia', iso: 'TN', tradeEurBn: 0.025, volume: 0.4, intensityDirect: 0.64, intensityTotal: 0.70, carbonPriceEur: 0, basis: 'To southern EU.', flags: [] },
    ],
  },
  {
    key: 'fertilisers', name: 'Fertilisers', hs: 'HS 2808, 2814, 2834, 3102, 3105', unit: 'Mt', intensityUnit: 'tCO2/t',
    scope: 'direct+indirect', color: T.green,
    euComparator: { label: 'EU-27 modern gas urea', value: 1.3 },
    benchmarkNote: 'Gas-based ammonia ≈1.8-2.4 tCO2/t NH3 (SMR incl. process CO2); urea nets some CO2 into product (~1.4-1.8 tCO2/t典 for modern plants). Potash (KCl) is NOT a CBAM good — Belarus/Russia potash flows excluded here. Indirect IS in scope for fertilisers.',
    origins: [
      { name: 'Russia', iso: 'RU', tradeEurBn: 1.6, volume: 4.5, intensityDirect: 1.75, intensityTotal: 1.9, carbonPriceEur: 0, basis: 'Urea / AN / UAN from older gas-based plants. Largest single EU supplier of nitrogen fertilisers.', flags: ['note'], note: 'NOT sanctioned (food-security carve-out), but EU tariffs from Jul 2025 escalate to prohibitive levels by ~2028 — flows expected to redirect.' },
      { name: 'Egypt', iso: 'EG', tradeEurBn: 1.0, volume: 2.5, intensityDirect: 1.4, intensityTotal: 1.5, carbonPriceEur: 0, basis: 'Modern gas-based urea (MOPCO, Abu Qir) — relatively low intensity.', flags: [] },
      { name: 'Algeria', iso: 'DZ', tradeEurBn: 0.7, volume: 1.8, intensityDirect: 1.45, intensityTotal: 1.55, carbonPriceEur: 0, basis: 'Gas-based urea/ammonia (Sorfert, AOA).', flags: [] },
      { name: 'Morocco', iso: 'MA', tradeEurBn: 0.8, volume: 1.5, intensityDirect: 0.8, intensityTotal: 0.9, carbonPriceEur: 0, basis: 'OCP — mostly phosphate/NPK; only the nitrogen share of mixed fertilisers is CBAM-scoped, lowering effective intensity.', flags: ['note'], note: 'Phosphate rock & pure phosphates largely outside CBAM scope; NPK partially scoped.' },
      { name: 'Trinidad & Tobago', iso: 'TT', tradeEurBn: 0.3, volume: 0.8, intensityDirect: 2.0, intensityTotal: 2.1, carbonPriceEur: 0, basis: 'Ammonia / UAN — ammonia carries full process CO2 (no urea netting).', flags: [] },
      { name: 'Nigeria', iso: 'NG', tradeEurBn: 0.3, volume: 0.7, intensityDirect: 1.3, intensityTotal: 1.4, carbonPriceEur: 0, basis: 'New world-scale urea trains (Dangote, Indorama) — efficient.', flags: [] },
      { name: 'United States', iso: 'US', tradeEurBn: 0.25, volume: 0.6, intensityDirect: 1.6, intensityTotal: 1.7, carbonPriceEur: 0, basis: 'UAN; some plants adding 45Q-supported CCS which would cut deliverable intensity.', flags: [] },
      { name: 'Oman', iso: 'OM', tradeEurBn: 0.2, volume: 0.5, intensityDirect: 1.35, intensityTotal: 1.45, carbonPriceEur: 0, basis: 'Modern gas urea (OMIFCO).', flags: [] },
    ],
  },
  {
    key: 'hydrogen', name: 'Hydrogen', hs: 'HS 2804 10', unit: 'Mt', intensityUnit: 'tCO2/t',
    scope: 'direct', color: T.purple,
    euComparator: { label: 'EU grey H2 (SMR, direct)', value: 9.0 },
    benchmarkNote: 'Merchant cross-border hydrogen trade into the EU is NEGLIGIBLE today (<€50m/yr — hydrogen is produced at point of use). Rows are placeholders for announced import corridors; grey SMR H2 ≈9-11 tCO2/t direct, electrolytic ≈0 direct.',
    origins: [
      { name: 'Norway', iso: 'NO', tradeEurBn: 0.005, volume: 0.002, intensityDirect: 9.0, intensityTotal: 10.5, carbonPriceEur: 0, basis: 'Small industrial SMR flows; future blue-H2 pipeline corridor proposed.', flags: ['exempt'], note: 'EEA — outside CBAM scope.' },
      { name: 'United Kingdom', iso: 'GB', tradeEurBn: 0.003, volume: 0.001, intensityDirect: 9.5, intensityTotal: 11.0, carbonPriceEur: 45, basis: 'Trace industrial flows.', flags: ['exempt-pending'], note: 'Expected exemption on ETS linkage.' },
      { name: 'Algeria', iso: 'DZ', tradeEurBn: 0.0, volume: 0.0, intensityDirect: 10.0, intensityTotal: 11.5, carbonPriceEur: 0, basis: 'No flows today — SoutH2 pipeline corridor (via Italy) announced for 2030s.', flags: ['note'], note: 'Future corridor placeholder — zero current trade.' },
      { name: 'Morocco', iso: 'MA', tradeEurBn: 0.0, volume: 0.0, intensityDirect: 0.5, intensityTotal: 1.0, carbonPriceEur: 0, basis: 'No flows today — green ammonia/H2 export projects announced (electrolytic, near-zero direct).', flags: ['note'], note: 'Future corridor placeholder — zero current trade.' },
    ],
  },
  {
    key: 'electricity', name: 'Electricity', hs: 'HS 2716', unit: 'TWh', intensityUnit: 'tCO2/MWh',
    scope: 'direct+indirect', color: T.orange,
    euComparator: { label: 'EU-27 avg generation mix', value: 0.25 },
    benchmarkNote: 'Embedded emissions default to the origin grid/CBAM default EF. Russia/Belarus commercial flows halted 2022; Baltic desynchronisation completed Feb 2025. Energy Community members (Western Balkans, UA, MD) may earn conditional exemption via market coupling + carbon pricing commitments (Art. 2) — deadline pressure to ~2030.',
    origins: [
      { name: 'United Kingdom', iso: 'GB', tradeEurBn: 1.4, volume: 16.0, intensityDirect: 0.20, intensityTotal: 0.20, carbonPriceEur: 45, basis: 'Interconnector flows (IFA, BritNed, NSL-linked market). UK ETS priced.', flags: ['exempt-pending'], note: 'EU-UK ETS linkage agreed in principle (May 2025) — would remove CBAM on electricity.' },
      { name: 'Norway', iso: 'NO', tradeEurBn: 0.4, volume: 5.0, intensityDirect: 0.02, intensityTotal: 0.02, carbonPriceEur: 0, basis: 'Hydro; internal energy market + EEA.', flags: ['exempt'], note: 'EEA — outside CBAM scope.' },
      { name: 'Bosnia & Herzegovina', iso: 'BA', tradeEurBn: 0.30, volume: 3.5, intensityDirect: 0.75, intensityTotal: 0.75, carbonPriceEur: 0, basis: 'Lignite-heavy mix (~60% coal); consistent net exporter to EU.', flags: ['note'], note: 'Energy Community — conditional exemption pathway if carbon pricing + market coupling delivered.' },
      { name: 'Serbia', iso: 'RS', tradeEurBn: 0.17, volume: 2.0, intensityDirect: 0.70, intensityTotal: 0.70, carbonPriceEur: 0, basis: 'Lignite-heavy (EPS); flows vary with hydrology.', flags: ['note'], note: 'Energy Community conditional-exemption pathway.' },
      { name: 'Turkey', iso: 'TR', tradeEurBn: 0.13, volume: 1.5, intensityDirect: 0.42, intensityTotal: 0.42, carbonPriceEur: 0, basis: 'To Bulgaria/Greece; gas+coal+renewables mix.', flags: [] },
      { name: 'Ukraine', iso: 'UA', tradeEurBn: 0.12, volume: 1.5, intensityDirect: 0.30, intensityTotal: 0.30, carbonPriceEur: 0.75, basis: 'Nuclear/hydro-heavy mix; emergency-synchronised 2022, wartime bidirectional flows.', flags: ['note'], note: 'Wartime flows highly variable; Energy Community pathway.' },
      { name: 'Montenegro', iso: 'ME', tradeEurBn: 0.07, volume: 0.8, intensityDirect: 0.40, intensityTotal: 0.40, carbonPriceEur: 0, basis: 'Hydro + Pljevlja lignite; Italy interconnector.', flags: ['note'], note: 'Energy Community pathway.' },
      { name: 'North Macedonia', iso: 'MK', tradeEurBn: 0.04, volume: 0.5, intensityDirect: 0.60, intensityTotal: 0.60, carbonPriceEur: 0, basis: 'Lignite + imports; small net flows.', flags: ['note'], note: 'Energy Community pathway.' },
    ],
  },
];

// Scope-correct CBAM intensity for an origin within a sector.
const cbamIntensity = (sector, o) => (sector.scope === 'direct' ? o.intensityDirect : o.intensityTotal);
const isExempt = (o) => o.flags.includes('exempt');
// tCO2 embedded: Mt product x tCO2/t x 1e6 == TWh x tCO2/MWh x 1e6 — same factor.
const embeddedT = (sector, o) => o.volume * cbamIntensity(sector, o) * 1e6;
const unitValueEur = (o) => (o.volume > 0 ? (o.tradeEurBn * 1e9) / (o.volume * 1e6) : 0);

// ---------------------------------------------------------------------------
// LIVE UN COMTRADE VERIFICATION — a representative HS code per sector, used
// to call the platform's new /api/v1/un-comtrade/trade-flow proxy (thin
// wrapper over UN Comtrade's free/keyless "preview" tier) and show that
// figure alongside the hand-compiled seeded extract above, for the same
// origin. This is additive verification/upgrade-path — it does NOT replace
// or recompute anything the seeded extract drives (cost projections,
// substitution analyzer, etc. are untouched).
// The preview tier allows exactly ONE period per call and is tightly rate
// limited (observed live 2026-07-05: 429 after a handful of rapid calls) —
// the panel below makes exactly one call per user click, never polls.
// ---------------------------------------------------------------------------
const SECTOR_HS_QUERY = {
  steel: { hs: '7208', label: 'HS 7208 — hot-rolled flat steel (representative of HS 72)' },
  aluminium: { hs: '76', label: 'HS 76 — aluminium (chapter-level)' },
  cement: { hs: '2523', label: 'HS 2523 — cement' },
  fertilisers: { hs: '3102', label: 'HS 3102 — nitrogenous fertilisers (representative of the sector\'s HS list)' },
  hydrogen: { hs: '280410', label: 'HS 280410 — hydrogen' },
  electricity: { hs: '2716', label: 'HS 2716 — electrical energy' },
};

// Local copy of the main component's `selPx` select style (that const is
// scoped inside CbamTradeExposureMapperPage's function body, not module
// level, so this standalone component needs its own — kept visually
// identical rather than hoisting/touching the existing local declaration).
const _selPx = { fontSize: 13, padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, color: T.textPri };

function LiveComtradeVerificationPanel() {
  const [sectorKey, setSectorKey] = useState('steel');
  const [originIso, setOriginIso] = useState('TR');
  const [period, setPeriod] = useState('2022');
  const [status, setStatus] = useState('idle'); // idle | loading | live | error
  const [liveData, setLiveData] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  const sector = CBAM_SECTORS.find(s => s.key === sectorKey);
  const origins = sector.origins;
  const hsInfo = SECTOR_HS_QUERY[sectorKey];

  useEffect(() => {
    if (!origins.find(o => o.iso === originIso)) {
      setOriginIso(origins[0].iso);
    }
    setLiveData(null);
    setStatus('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectorKey]);

  const seededOrigin = origins.find(o => o.iso === originIso);

  const fetchLive = useCallback(async () => {
    setStatus('loading');
    setErrMsg('');
    try {
      const { data } = await axios.get(`${COMTRADE_API}/trade-flow`, {
        params: { reporter: 'EU', partner: originIso, period, hs_code: hsInfo.hs },
        timeout: 15000,
      });
      setLiveData(data);
      setStatus('live');
    } catch (e) {
      setLiveData(null);
      setStatus('error');
      // Never breaks the page: falls back to showing only the seeded figure below.
      setErrMsg(e?.response?.data?.detail || e.message || 'UN Comtrade preview tier unreachable or rate-limited.');
    }
  }, [originIso, period, hsInfo]);

  const importFlow = (liveData?.records || []).find(r => r.flow_code === 'M');
  const liveValueUsd = importFlow?.trade_value_usd ?? importFlow?.cif_value_usd ?? null;

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>Live UN Comtrade verification</div>
        {status === 'idle' && <Badge val="Not yet queried" color="#475569" bg="#e2e8f0" />}
        {status === 'loading' && <Badge val="Querying UN Comtrade…" color="#475569" bg="#e2e8f0" />}
        {status === 'live' && <Badge val="● Live — UN Comtrade preview tier" color="#166534" bg="#dcfce7" />}
        {status === 'error' && <Badge val="○ Demo only — live call failed/rate-limited" color="#92400e" bg="#fef3c7" />}
      </div>
      <div style={{ fontSize: 11.5, color: T.textSec, marginBottom: 14 }}>
        Cross-check the hand-compiled seeded extract above against a live call to UN Comtrade's free, keyless
        "preview" tier (one HS code, one reporter/partner pair, one period per call — the tier's real
        constraint, not a design choice). If the live call fails or is rate-limited, only the seeded figure
        is shown; the page is never blocked on this panel.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr auto', gap: 14, alignItems: 'end', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Sector</div>
          <select style={{ ..._selPx, width: '100%' }} value={sectorKey} onChange={e => setSectorKey(e.target.value)}>
            {CBAM_SECTORS.map(s => <option key={s.key} value={s.key}>{s.name} ({SECTOR_HS_QUERY[s.key].hs})</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Origin (partner)</div>
          <select style={{ ..._selPx, width: '100%' }} value={originIso} onChange={e => setOriginIso(e.target.value)}>
            {origins.map(o => <option key={o.iso} value={o.iso}>{o.name}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Period</div>
          <select style={{ ..._selPx, width: '100%' }} value={period} onChange={e => setPeriod(e.target.value)}>
            {['2023', '2022', '2021', '2020'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button
          onClick={fetchLive}
          disabled={status === 'loading'}
          style={{ fontSize: 12.5, fontWeight: 700, padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', background: T.indigo, color: '#fff', opacity: status === 'loading' ? 0.6 : 1, height: 34 }}
        >
          Fetch live figure
        </button>
      </div>

      <div style={{ fontSize: 10.5, color: T.textSec, marginBottom: 12 }}>Reporter fixed to EU aggregate (Comtrade reporterCode 97) · {hsInfo.label}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: T.sub, borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Seeded extract (this page)</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.textPri }}>€{seededOrigin.tradeEurBn.toFixed(2)}bn</div>
          <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{sector.name} imports from {seededOrigin.name}, ~2023-24 hand-compiled approximation</div>
        </div>
        <div style={{ background: status === 'live' ? '#f0fdf4' : T.sub, borderRadius: 8, padding: 14, border: status === 'live' ? '1px solid #bbf7d0' : 'none' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Live UN Comtrade ({period})</div>
          {status === 'live' && importFlow && (
            <>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.green }}>${(liveValueUsd / 1e9).toFixed(2)}bn</div>
              <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>EU imports from {seededOrigin.name}, flow {importFlow.flow_code} · USD, not currency-adjusted vs the EUR seeded figure</div>
            </>
          )}
          {status === 'live' && !importFlow && (
            <div style={{ fontSize: 12, color: T.textSec }}>No import (flow M) record returned for this reporter/partner/period/HS combination.</div>
          )}
          {status === 'error' && <div style={{ fontSize: 12, color: '#92400e' }}>{errMsg}</div>}
          {status === 'idle' && <div style={{ fontSize: 12, color: T.textSec }}>Click "Fetch live figure" to query UN Comtrade.</div>}
          {status === 'loading' && <div style={{ fontSize: 12, color: T.textSec }}>Querying…</div>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Importer checklist — REAL CBAM regulation dates (Regulation (EU) 2023/956,
// Implementing Regulation (EU) 2023/1773, and the 2025 "Omnibus I"
// simplification amendment). Omnibus-derived items are labelled as such.
// ---------------------------------------------------------------------------
const CBAM_TIMELINE = [
  { date: '1 Oct 2023', title: 'Transitional period begins', detail: 'CBAM reporting obligation starts for importers of covered goods — no financial obligation yet. Quarterly CBAM reports via the CBAM Transitional Registry.', status: 'past' },
  { date: '31 Jan 2024', title: 'First quarterly CBAM report due', detail: 'Report for Q4 2023 imports (embedded emissions, origin, production route). Default values permitted without limit for the first three reports.', status: 'past' },
  { date: '1 Jul 2024', title: 'Actual-data requirement tightens', detail: 'From Q3 2024 reports, default values allowed only for ≤20% of the embedded emissions of complex goods — installation-level actual data required from suppliers.', status: 'past' },
  { date: '31 Mar 2025', title: 'Authorised CBAM declarant applications open', detail: 'Importers (or indirect customs representatives) apply via the CBAM Registry for authorised-declarant status in the Member State of establishment.', status: 'past' },
  { date: '2025', title: 'Omnibus I simplification adopted', detail: 'New 50 t/yr mass-based de minimis exempts ~90% of importers (mostly SMEs) while keeping ~99% of embedded emissions in scope; annual declaration deadline moved 31 May → 31 Aug; quarterly certificate-holding requirement cut 80% → 50%; certificate sales deferred to Feb 2027. (Per 2025 Omnibus I amendment — verify final consolidated text.)', status: 'past' },
  { date: '1 Jan 2026', title: 'Definitive regime starts', detail: 'Only authorised CBAM declarants may import covered goods. CBAM factor 2.5% (free-allocation phase-out begins at 97.5%). Emissions from 2026 imports accrue certificate obligations.', status: 'active' },
  { date: 'Feb 2027', title: 'Certificate sales begin', detail: 'Sale of CBAM certificates starts (deferred from 2026 by Omnibus I); certificates priced at weekly average EU ETS auction price. Purchases cover 2026 import obligations retroactively.', status: 'future' },
  { date: '31 Aug 2027', title: 'First annual CBAM declaration', detail: 'Declaration + verified embedded emissions for calendar-2026 imports; surrender corresponding certificates (deadline moved from 31 May by Omnibus I).', status: 'future' },
  { date: '2026-2034', title: 'CBAM factor ramp', detail: 'CBAM factor: 2.5% (2026) → 5% → 10% → 22.5% → 48.5% → 61% → 73.5% → 86% → 100% (2034) as EU ETS free allocation for covered sectors phases out (Art. 31).', status: 'future' },
  { date: '1 Jan 2034', title: 'Full CBAM', detail: 'Free allocation for CBAM sectors reaches zero — importers pay the full embedded-carbon price differential.', status: 'future' },
];

const DECLARANT_OBLIGATIONS = [
  { area: 'Authorisation', items: ['Hold authorised CBAM declarant status before importing covered goods (from 1 Jan 2026)', 'Maintain EORI registration and financial-standing evidence', 'Appoint indirect customs representative if non-EU established'] },
  { area: 'Data collection', items: ['Obtain installation-level actual emissions from each non-EU supplier (direct; + indirect for cement/fertilisers/electricity)', 'Apply Commission default values (with markup) only where actuals unavailable within limits', 'Track carbon price effectively paid in origin country for Art. 9 deduction — keep payment evidence'] },
  { area: 'Verification & declaration', items: ['Have embedded emissions verified by an accredited verifier', 'Submit annual CBAM declaration by 31 Aug for the preceding year (post-Omnibus deadline)', 'Retain records 4 years'] },
  { area: 'Certificates', items: ['Buy certificates on the common central platform at weekly-average ETS auction price (sales from Feb 2027)', 'Hold certificates covering ≥50% of accrued obligation at each quarter-end (post-Omnibus, was 80%)', 'Surrender annually; excess repurchase capped at 1/3 of purchases — over-buying is a cash-flow cost'] },
];

// ---------------------------------------------------------------------------
// UI primitives (platform conventions)
// ---------------------------------------------------------------------------
const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 22px', borderLeft: accent ? `4px solid ${accent}` : undefined }}>
    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: T.textPri, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 5 }}>{sub}</div>}
  </div>
);

const SectionH = ({ title, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, borderLeft: `3px solid ${T.indigo}`, paddingLeft: 10 }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 3, paddingLeft: 13 }}>{sub}</div>}
  </div>
);

const Badge = ({ val, color, bg }) => (
  <span style={{ background: bg || '#e0e7ff', color: color || T.indigo, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{val}</span>
);

const FLAG_STYLE = {
  exempt: { label: 'ETS-linked · exempt', color: '#166534', bg: '#dcfce7' },
  'exempt-pending': { label: 'Exemption pending (ETS link)', color: '#0369a1', bg: '#e0f2fe' },
  sanction: { label: 'Sanctions-affected', color: '#991b1b', bg: '#fee2e2' },
  note: { label: 'See note', color: '#92400e', bg: '#fef3c7' },
};
const FlagChips = ({ o }) => (
  <span>
    {o.flags.map(f => {
      const s = FLAG_STYLE[f];
      return <span key={f} style={{ background: s.bg, color: s.color, padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700, marginRight: 4, whiteSpace: 'nowrap' }}>{s.label}</span>;
    })}
  </span>
);

const LiveBadge = ({ status, liveText, demoText }) => (
  <span>
    {status === 'loading' && <Badge val="Connecting to CBAM engine…" color="#64748b" bg="#e2e8f0" />}
    {status === 'live' && <Badge val={`● Live — ${liveText}`} color="#166534" bg="#dcfce7" />}
    {status === 'demo' && <Badge val={`○ Demo — ${demoText}`} color="#92400e" bg="#fef3c7" />}
  </span>
);

const fmtEur = (v) => {
  if (!isFinite(v)) return '—';
  const a = Math.abs(v);
  if (a >= 1e9) return `€${(v / 1e9).toFixed(2)}bn`;
  if (a >= 1e6) return `€${(v / 1e6).toFixed(1)}m`;
  if (a >= 1e3) return `€${(v / 1e3).toFixed(0)}k`;
  return `€${v.toFixed(0)}`;
};
const fmtMt = (v) => `${v.toFixed(2)} Mt`;

const TABS = ['Exposure Matrix', 'CBAM Cost Projection 2026-34', 'Origin Substitution Analyzer', 'Importer Checklist', 'Methodology & Data Notes'];

// ---------------------------------------------------------------------------
export default function CbamTradeExposureMapperPage() {
  const [tab, setTab] = useState(0);

  // ---- Live engine wiring: phase-in schedule + ETS price scenarios --------
  const [freeAlloc, setFreeAlloc] = useState(FREE_ALLOC_FALLBACK);
  const [etsScenarios, setEtsScenarios] = useState(ETS_SCENARIOS_FALLBACK);
  const [engineStatus, setEngineStatus] = useState('loading'); // loading | live | demo

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [schedRes, scenRes] = await Promise.all([
          axios.get(`${CBAM_API}/free-allocation-schedule`, { timeout: 10000 }),
          axios.get(`${CBAM_API}/ets-price-scenarios`, { timeout: 10000 }),
        ]);
        if (cancelled) return;
        // JSON object keys arrive as strings — normalise to numeric years.
        const sched = Object.fromEntries(Object.entries(schedRes.data || {}).map(([y, v]) => [Number(y), v]));
        const scen = Object.fromEntries(Object.entries(scenRes.data || {}).map(([name, path]) => [
          name, Object.fromEntries(Object.entries(path).map(([y, p]) => [Number(y), p])),
        ]));
        if (Object.keys(sched).length && Object.keys(scen).length) {
          setFreeAlloc(sched);
          setEtsScenarios(scen);
          setEngineStatus('live');
        } else {
          setEngineStatus('demo');
        }
      } catch (e) {
        if (!cancelled) setEngineStatus('demo');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const YEARS = useMemo(() => Object.keys(freeAlloc).map(Number).sort((a, b) => a - b), [freeAlloc]);

  // ---- Tab 0: exposure matrix ---------------------------------------------
  const [matrixSector, setMatrixSector] = useState('All');

  const sectorSummaries = useMemo(() => CBAM_SECTORS.map(s => {
    const liable = s.origins.filter(o => !isExempt(o));
    return {
      key: s.key, name: s.name, color: s.color, unit: s.unit, scope: s.scope,
      tradeEurBn: s.origins.reduce((a, o) => a + o.tradeEurBn, 0),
      liableTradeEurBn: liable.reduce((a, o) => a + o.tradeEurBn, 0),
      embeddedMt: liable.reduce((a, o) => a + embeddedT(s, o), 0) / 1e6,
      exemptEurBn: s.origins.filter(isExempt).reduce((a, o) => a + o.tradeEurBn, 0),
      sanctionEurBn: s.origins.filter(o => o.flags.includes('sanction')).reduce((a, o) => a + o.tradeEurBn, 0),
    };
  }), []);

  const totTrade = sectorSummaries.reduce((a, s) => a + s.tradeEurBn, 0);
  const totLiable = sectorSummaries.reduce((a, s) => a + s.liableTradeEurBn, 0);
  const totEmbedded = sectorSummaries.reduce((a, s) => a + s.embeddedMt, 0);
  const totExempt = sectorSummaries.reduce((a, s) => a + s.exemptEurBn, 0);

  const matrixRows = useMemo(() => CBAM_SECTORS
    .filter(s => matrixSector === 'All' || s.key === matrixSector)
    .flatMap(s => s.origins.map(o => ({
      sector: s.name, sectorKey: s.key, color: s.color, unit: s.unit, intensityUnit: s.intensityUnit, scope: s.scope,
      ...o,
      cbamInt: cbamIntensity(s, o),
      embeddedMt: isExempt(o) ? 0 : embeddedT(s, o) / 1e6,
    })))
    .sort((a, b) => b.embeddedMt - a.embeddedMt), [matrixSector]);

  // ---- Tab 1: cost projection ---------------------------------------------
  const [scenario, setScenario] = useState('Current Trend');
  const scenarioNames = Object.keys(etsScenarios);
  const activeScenario = etsScenarios[scenario] || etsScenarios[scenarioNames[0]] || {};

  // Engine formula per origin-year, summed by sector (mirrors POST
  // /calculate-cost math; the substitution tab calls the endpoint itself).
  const projection = useMemo(() => YEARS.map(year => {
    const price = interpPrice(activeScenario, year);
    const freePct = freeAlloc[year] ?? 0;
    const row = { year, etsPrice: Math.round(price * 100) / 100, cbamFactorPct: Math.round((100 - freePct) * 10) / 10 };
    let total = 0;
    CBAM_SECTORS.forEach(s => {
      let sum = 0;
      s.origins.forEach(o => {
        if (isExempt(o)) return;
        const c = localCbamCost(embeddedT(s, o), price, o.carbonPriceEur, freePct);
        sum += c.net_cbam_cost_eur;
      });
      row[s.key] = Math.round(sum / 1e6); // €m
      total += sum;
    });
    row.totalEurM = Math.round(total / 1e6);
    return row;
  }), [YEARS, activeScenario, freeAlloc]);

  const cost2026 = projection.find(p => p.year === 2026);
  const cost2030 = projection.find(p => p.year === 2030);
  const cost2034 = projection.find(p => p.year === 2034);

  // ---- Tab 2: substitution analyzer — LIVE POST /calculate-cost -----------
  const [subSectorKey, setSubSectorKey] = useState('steel');
  const [certPrice, setCertPrice] = useState(80);
  const [subYear, setSubYear] = useState(2030);
  const [uncompThreshold, setUncompThreshold] = useState(10); // % of unit value
  const [subResults, setSubResults] = useState(null);
  const [subStatus, setSubStatus] = useState('loading');

  const subSector = CBAM_SECTORS.find(s => s.key === subSectorKey);

  useEffect(() => {
    let cancelled = false;
    setSubStatus('loading');
    const freePct = freeAlloc[subYear] ?? 0;
    const t = setTimeout(async () => {
      const compute = (o, engineResult) => {
        const emissions = isExempt(o) ? 0 : embeddedT(subSector, o);
        const net = isExempt(o) ? 0 : engineResult.net_cbam_cost_eur;
        const perUnit = o.volume > 0 ? net / (o.volume * 1e6) : 0; // €/t or €/MWh
        const uv = unitValueEur(o);
        return {
          name: o.name, iso: o.iso, flags: o.flags, note: o.note,
          emissionsMt: emissions / 1e6,
          netEur: net,
          perUnit: Math.round(perUnit * 100) / 100,
          unitValue: Math.round(uv * 100) / 100,
          pctOfValue: uv > 0 ? Math.round((perUnit / uv) * 1000) / 10 : 0,
          domesticCredit: isExempt(o) ? 0 : engineResult.domestic_credit_eur,
        };
      };
      try {
        // One engine call per origin (≤10) — real POST /api/v1/cbam/calculate-cost.
        const results = await Promise.all(subSector.origins.map(o => {
          if (isExempt(o)) return Promise.resolve(null);
          return axios.post(`${CBAM_API}/calculate-cost`, {
            emissions_tco2: embeddedT(subSector, o),
            eu_ets_price: certPrice,
            domestic_carbon_price: o.carbonPriceEur,
            free_allocation_pct: freePct,
          }, { timeout: 10000 }).then(r => r.data);
        }));
        if (cancelled) return;
        setSubResults(subSector.origins.map((o, i) => compute(o, results[i] || localCbamCost(0, 0, 0, 0))));
        setSubStatus('live');
      } catch (e) {
        if (cancelled) return;
        // Demo fallback — identical formula computed locally.
        setSubResults(subSector.origins.map(o => compute(
          o, localCbamCost(embeddedT(subSector, o), certPrice, o.carbonPriceEur, freePct),
        )));
        setSubStatus('demo');
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [subSectorKey, certPrice, subYear, freeAlloc, subSector]);

  const subChart = useMemo(() => (subResults || [])
    .map(r => ({ ...r, fill: r.flags.includes('exempt') ? '#94a3b8' : (r.pctOfValue >= uncompThreshold ? T.red : subSector.color) }))
    .sort((a, b) => b.perUnit - a.perUnit), [subResults, uncompThreshold, subSector]);

  const uncompetitive = (subResults || []).filter(r => !r.flags.includes('exempt') && r.pctOfValue >= uncompThreshold);

  const selPx = { fontSize: 13, padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, color: T.textPri };
  const th = { padding: '9px 10px', textAlign: 'left', fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}`, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' };
  const td = { padding: '7px 10px', borderBottom: `1px solid ${T.borderL}`, fontSize: 12.5, color: T.textPri };
  const tdNum = { ...td, fontFamily: T.fontMono, textAlign: 'right' };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: T.gold, fontSize: 11, fontFamily: T.fontMono, letterSpacing: '0.12em', marginBottom: 4 }}>USE CASE 15 · CBAM TRADE EXPOSURE MAPPER</div>
            <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, margin: 0 }}>CBAM Trade Exposure Mapper</h1>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
              HS-code EU import exposure · 6 CBAM sectors · Regulation (EU) 2023/956 phase-in 2026-2034
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <LiveBadge status={engineStatus}
                liveText="phase-in schedule + ETS scenarios from /api/v1/cbam engine"
                demoText="CBAM engine unreachable — using local copy of the same schedule" />
              <Badge val="Trade data: real-pattern extract (Comtrade/Eurostat ~2023-24, approx.)" color="#334155" bg="#e2e8f0" />
            </div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: T.fontMono, fontSize: 11, color: '#94a3b8' }}>
            <div>{CBAM_SECTORS.length} sectors · {CBAM_SECTORS.reduce((a, s) => a + s.origins.length, 0)} origin flows</div>
            <div>In-scope trade ≈ €{totLiable.toFixed(1)}bn/yr</div>
            <div>Embedded ≈ {totEmbedded.toFixed(1)} MtCO2/yr</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, display: 'flex', overflowX: 'auto', padding: '0 24px' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '13px 18px', border: 'none', cursor: 'pointer', background: 'none', whiteSpace: 'nowrap',
            fontSize: 13, fontWeight: 600, color: tab === i ? T.indigo : T.textSec,
            borderBottom: tab === i ? `2px solid ${T.indigo}` : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: '28px 32px' }}>

        {/* ============================ TAB 0 — EXPOSURE MATRIX ============ */}
        {tab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              <KpiCard label="EU import trade tracked" value={`€${totTrade.toFixed(1)}bn`} sub="All 6 CBAM sectors, ~2023-24 approx." accent={T.indigo} />
              <KpiCard label="CBAM-liable trade" value={`€${totLiable.toFixed(1)}bn`} sub={`€${totExempt.toFixed(1)}bn exempt (EEA/ETS-linked origins)`} accent={T.amber} />
              <KpiCard label="Embedded emissions (in scope)" value={`${totEmbedded.toFixed(1)} MtCO2`} sub="Volume × scope-correct intensity, liable origins" accent={T.red} />
              <KpiCard label="Sanctions-affected flows" value={`€${sectorSummaries.reduce((a, s) => a + s.sanctionEurBn, 0).toFixed(1)}bn`} sub="RU steel (quota → 2028) · RU aluminium (16th pkg)" accent={T.purple} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Embedded emissions by sector" sub="Liable origins only — steel/aluminium/hydrogen counted DIRECT-only per Annex II" />
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={sectorSummaries} margin={{ left: 4, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={48} />
                    <YAxis tick={{ fontSize: 11 }} label={{ value: 'MtCO2/yr', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${Number(v).toFixed(2)} MtCO2`, 'Embedded']} />
                    <Bar dataKey="embeddedMt" radius={[4, 4, 0, 0]}>
                      {sectorSummaries.map(s => <Cell key={s.key} fill={s.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Trade value: liable vs exempt" sub="Norway/Iceland (EEA in EU ETS) exempt; UK pending ETS linkage" />
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={sectorSummaries} margin={{ left: 4, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={48} />
                    <YAxis tick={{ fontSize: 11 }} label={{ value: '€bn/yr', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <Tooltip formatter={(v, n) => [`€${Number(v).toFixed(2)}bn`, n === 'liableTradeEurBn' ? 'CBAM-liable' : 'Exempt (ETS-linked)']} />
                    <Legend formatter={(v) => v === 'liableTradeEurBn' ? 'CBAM-liable' : 'Exempt (ETS-linked)'} wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="liableTradeEurBn" stackId="a" fill={T.indigo} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="exemptEurBn" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>Sector × origin exposure matrix</div>
                  <div style={{ fontSize: 11.5, color: T.textSec, marginTop: 2 }}>{DATA_LABEL}</div>
                </div>
                <select style={selPx} value={matrixSector} onChange={e => setMatrixSector(e.target.value)}>
                  <option value="All">All sectors</option>
                  {CBAM_SECTORS.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 560, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: T.sub, position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th style={th}>Sector</th><th style={th}>Origin</th>
                      <th style={{ ...th, textAlign: 'right' }}>Trade (€bn)</th>
                      <th style={{ ...th, textAlign: 'right' }}>Volume</th>
                      <th style={{ ...th, textAlign: 'right' }}>CBAM intensity</th>
                      <th style={{ ...th, textAlign: 'right' }}>Total intensity</th>
                      <th style={{ ...th, textAlign: 'right' }}>Embedded (MtCO2)</th>
                      <th style={{ ...th, textAlign: 'right' }}>Carbon price paid</th>
                      <th style={th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixRows.map((r, i) => (
                      <tr key={`${r.sectorKey}-${r.iso}-${i}`} title={`${r.basis}${r.note ? ` — ${r.note}` : ''}`}>
                        <td style={td}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: r.color, marginRight: 7 }} />{r.sector}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{r.name}</td>
                        <td style={tdNum}>{r.tradeEurBn.toFixed(2)}</td>
                        <td style={tdNum}>{r.volume.toFixed(2)} {r.unit}</td>
                        <td style={tdNum}>{r.cbamInt.toFixed(2)} <span style={{ color: T.textSec, fontSize: 10 }}>{r.intensityUnit} ({r.scope === 'direct' ? 'dir.' : 'dir+ind'})</span></td>
                        <td style={tdNum}>{r.intensityTotal.toFixed(2)}</td>
                        <td style={{ ...tdNum, fontWeight: 700, color: r.embeddedMt > 5 ? T.red : T.textPri }}>{r.embeddedMt.toFixed(2)}</td>
                        <td style={tdNum}>{r.carbonPriceEur > 0 ? `€${r.carbonPriceEur}/t` : '—'}</td>
                        <td style={td}><FlagChips o={r} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '10px 20px', fontSize: 11.5, color: T.textSec, borderTop: `1px solid ${T.borderL}` }}>
                Hover any row for the intensity basis. "CBAM intensity" is scope-correct per Annex II: direct-only for iron/steel, aluminium and hydrogen (indirect inclusion under Commission review); direct + indirect for cement, fertilisers and electricity. Exempt origins carry zero embedded exposure.
              </div>
            </div>

            <LiveComtradeVerificationPanel />
          </div>
        )}

        {/* ===================== TAB 1 — COST PROJECTION =================== */}
        {tab === 1 && (
          <div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
              <LiveBadge status={engineStatus}
                liveText="free-allocation phase-out + ETS price paths served by GET /api/v1/cbam/free-allocation-schedule & /ets-price-scenarios"
                demoText="engine offline — local mirror of the identical schedule/scenarios" />
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, color: T.textSec, fontWeight: 600 }}>EU ETS price scenario</span>
                <select style={selPx} value={scenario} onChange={e => setScenario(e.target.value)}>
                  {scenarioNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              <KpiCard label="2026 net CBAM cost (all sectors)" value={cost2026 ? fmtEur(cost2026.totalEurM * 1e6) : '—'} sub={cost2026 ? `CBAM factor ${cost2026.cbamFactorPct}% · ETS €${cost2026.etsPrice}` : ''} accent={T.green} />
              <KpiCard label="2030 net CBAM cost" value={cost2030 ? fmtEur(cost2030.totalEurM * 1e6) : '—'} sub={cost2030 ? `CBAM factor ${cost2030.cbamFactorPct}% · ETS €${cost2030.etsPrice}` : ''} accent={T.amber} />
              <KpiCard label="2034 net CBAM cost (full)" value={cost2034 ? fmtEur(cost2034.totalEurM * 1e6) : '—'} sub={cost2034 ? `CBAM factor 100% · ETS €${cost2034.etsPrice}` : ''} accent={T.red} />
              <KpiCard label="Cumulative 2026-2034" value={fmtEur(projection.reduce((a, p) => a + p.totalEurM, 0) * 1e6)} sub={`Scenario: ${scenario}`} accent={T.indigo} />
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <SectionH title="Net CBAM cost by sector, 2026-2034"
                sub="Per-origin engine formula: max(0, E×P − E×P_domestic − E×P×freeAlloc%) summed over liable origins — free-allocation schedule from the CBAM engine" />
              <ResponsiveContainer width="100%" height={340}>
                <ComposedChart data={projection} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="l" tick={{ fontSize: 11 }} label={{ value: '€m/yr', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} label={{ value: 'CBAM factor %', angle: 90, position: 'insideRight', fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip formatter={(v, n) => {
                    const s = CBAM_SECTORS.find(x => x.key === n);
                    if (s) return [`€${Number(v).toLocaleString()}m`, s.name];
                    if (n === 'cbamFactorPct') return [`${v}%`, 'CBAM factor'];
                    return [`€${Number(v).toLocaleString()}m`, n];
                  }} />
                  <Legend formatter={(v) => { const s = CBAM_SECTORS.find(x => x.key === v); return s ? s.name : (v === 'cbamFactorPct' ? 'CBAM factor %' : v); }} wrapperStyle={{ fontSize: 12 }} />
                  {CBAM_SECTORS.map(s => <Bar key={s.key} yAxisId="l" dataKey={s.key} stackId="cost" fill={s.color} />)}
                  <Line yAxisId="r" type="monotone" dataKey="cbamFactorPct" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="6 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}` }}>Projection table — {scenario}</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: T.sub }}>
                    <tr>
                      <th style={th}>Year</th>
                      <th style={{ ...th, textAlign: 'right' }}>ETS price (€/t)</th>
                      <th style={{ ...th, textAlign: 'right' }}>Free alloc %</th>
                      <th style={{ ...th, textAlign: 'right' }}>CBAM factor %</th>
                      {CBAM_SECTORS.map(s => <th key={s.key} style={{ ...th, textAlign: 'right' }}>{s.name} (€m)</th>)}
                      <th style={{ ...th, textAlign: 'right' }}>Total (€m)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projection.map(p => (
                      <tr key={p.year}>
                        <td style={{ ...td, fontWeight: 700 }}>{p.year}</td>
                        <td style={tdNum}>{p.etsPrice}</td>
                        <td style={tdNum}>{(freeAlloc[p.year] ?? 0).toFixed(1)}</td>
                        <td style={{ ...tdNum, fontWeight: 700 }}>{p.cbamFactorPct}</td>
                        {CBAM_SECTORS.map(s => <td key={s.key} style={tdNum}>{p[s.key].toLocaleString()}</td>)}
                        <td style={{ ...tdNum, fontWeight: 700, color: T.red }}>{p.totalEurM.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '10px 20px', fontSize: 11.5, color: T.textSec, borderTop: `1px solid ${T.borderL}` }}>
                Certificate price proxied by weekly-avg EU ETS auction price (Art. 21). Domestic carbon prices effectively paid (UK ETS, K-ETS, China ETS, Taiwan fee, UA CO2 tax) are deducted per Art. 9. Sanctions-affected volumes are held at current residual levels — treat RU rows as upper bounds that decline with quota phase-outs.
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2 — SUBSTITUTION ANALYZER ============== */}
        {tab === 2 && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <LiveBadge status={subStatus}
                liveText="per-origin costs computed by POST /api/v1/cbam/calculate-cost (one engine call per origin)"
                demoText="engine offline — identical formula computed locally" />
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr 1.4fr', gap: 20, alignItems: 'end' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Sector</div>
                  <select style={{ ...selPx, width: '100%' }} value={subSectorKey} onChange={e => setSubSectorKey(e.target.value)}>
                    {CBAM_SECTORS.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 6 }}>CBAM certificate price: <span style={{ fontFamily: T.fontMono, color: T.indigo }}>€{certPrice}/tCO2</span></div>
                  <input type="range" min={40} max={250} step={5} value={certPrice} onChange={e => setCertPrice(Number(e.target.value))} style={{ width: '100%' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: T.textSec }}><span>€40</span><span>€250</span></div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Year (CBAM factor {((100 - (freeAlloc[subYear] ?? 0))).toFixed(1)}%)</div>
                  <select style={{ ...selPx, width: '100%' }} value={subYear} onChange={e => setSubYear(Number(e.target.value))}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 6 }}>Uncompetitive threshold: <span style={{ fontFamily: T.fontMono, color: T.red }}>{uncompThreshold}% of unit value</span></div>
                  <input type="range" min={2} max={30} step={1} value={uncompThreshold} onChange={e => setUncompThreshold(Number(e.target.value))} style={{ width: '100%' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: T.textSec }}><span>2%</span><span>30%</span></div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
              <KpiCard label="Origins turning uncompetitive" value={uncompetitive.length} sub={`CBAM premium ≥ ${uncompThreshold}% of unit trade value`} accent={T.red} />
              <KpiCard label="EU comparator intensity" value={`${subSector.euComparator.value} ${subSector.intensityUnit}`} sub={subSector.euComparator.label} accent={T.blue} />
              <KpiCard label="Emissions scope (Annex II)" value={subSector.scope === 'direct' ? 'Direct only' : 'Direct + indirect'} sub={subSector.scope === 'direct' ? 'Indirect inclusion pending Commission review' : 'Full scope from day one'} accent={T.teal} />
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <SectionH title={`Landed CBAM cost per ${subSector.unit === 'TWh' ? 'MWh' : 'tonne'} by origin — ${subSector.name}, ${subYear}`}
                sub={`net cost / import volume at €${certPrice}/certificate, CBAM factor ${(100 - (freeAlloc[subYear] ?? 0)).toFixed(1)}% — red bars breach the ${uncompThreshold}% competitiveness threshold; grey = exempt`} />
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={subChart} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} label={{ value: `€/${subSector.unit === 'TWh' ? 'MWh' : 't'}`, angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip formatter={(v, n, p) => [`€${Number(v).toFixed(2)}/${subSector.unit === 'TWh' ? 'MWh' : 't'} (${p.payload.pctOfValue}% of unit value)`, 'CBAM premium']} />
                  <Bar dataKey="perUnit" radius={[4, 4, 0, 0]}>
                    {subChart.map((r, i) => <Cell key={i} fill={r.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: T.navy, borderBottom: `1px solid ${T.border}` }}>Origin competitiveness detail</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: T.sub }}>
                    <tr>
                      <th style={th}>Origin</th>
                      <th style={{ ...th, textAlign: 'right' }}>Embedded (MtCO2)</th>
                      <th style={{ ...th, textAlign: 'right' }}>Net CBAM cost</th>
                      <th style={{ ...th, textAlign: 'right' }}>Domestic credit</th>
                      <th style={{ ...th, textAlign: 'right' }}>Premium €/{subSector.unit === 'TWh' ? 'MWh' : 't'}</th>
                      <th style={{ ...th, textAlign: 'right' }}>Unit value €/{subSector.unit === 'TWh' ? 'MWh' : 't'}</th>
                      <th style={{ ...th, textAlign: 'right' }}>% of value</th>
                      <th style={th}>Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subChart.map((r, i) => (
                      <tr key={i}>
                        <td style={{ ...td, fontWeight: 600 }}>{r.name} <FlagChips o={r} /></td>
                        <td style={tdNum}>{r.emissionsMt.toFixed(2)}</td>
                        <td style={tdNum}>{fmtEur(r.netEur)}</td>
                        <td style={tdNum}>{r.domesticCredit > 0 ? fmtEur(r.domesticCredit) : '—'}</td>
                        <td style={{ ...tdNum, fontWeight: 700 }}>{r.perUnit.toFixed(2)}</td>
                        <td style={tdNum}>{r.unitValue.toFixed(0)}</td>
                        <td style={{ ...tdNum, fontWeight: 700, color: r.pctOfValue >= uncompThreshold ? T.red : T.green }}>{r.pctOfValue.toFixed(1)}%</td>
                        <td style={td}>
                          {r.flags.includes('exempt')
                            ? <Badge val="Exempt" color="#166534" bg="#dcfce7" />
                            : r.pctOfValue >= uncompThreshold
                              ? <Badge val="Uncompetitive" color="#991b1b" bg="#fee2e2" />
                              : <Badge val="Competitive" color="#166534" bg="#dcfce7" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '10px 20px', fontSize: 11.5, color: T.textSec, borderTop: `1px solid ${T.borderL}` }}>
                {subSector.benchmarkNote}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3 — IMPORTER CHECKLIST ================ */}
        {tab === 3 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="CBAM regulatory timeline" sub="Regulation (EU) 2023/956 + Implementing Reg. 2023/1773 + 2025 Omnibus I simplification — real dates" />
                <div>
                  {CBAM_TIMELINE.map((e, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 4 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: 12, height: 12, borderRadius: 6, marginTop: 4,
                          background: e.status === 'past' ? '#94a3b8' : e.status === 'active' ? T.green : T.indigo,
                          boxShadow: e.status === 'active' ? `0 0 0 4px ${T.green}33` : 'none',
                        }} />
                        {i < CBAM_TIMELINE.length - 1 && <div style={{ width: 2, flex: 1, background: T.borderL, minHeight: 34 }} />}
                      </div>
                      <div style={{ paddingBottom: 16 }}>
                        <div style={{ fontSize: 11, fontFamily: T.fontMono, color: e.status === 'active' ? T.green : T.textSec, fontWeight: 700 }}>{e.date}{e.status === 'active' && ' · NOW'}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: T.navy }}>{e.title}</div>
                        <div style={{ fontSize: 12.5, color: T.textSec, marginTop: 2, lineHeight: 1.5 }}>{e.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                {DECLARANT_OBLIGATIONS.map((g, i) => (
                  <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: T.navy, marginBottom: 10, borderLeft: `3px solid ${T.gold}`, paddingLeft: 9 }}>{g.area}</div>
                    {g.items.map((it, j) => (
                      <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 12.5, color: T.textPri, lineHeight: 1.45 }}>
                        <span style={{ color: T.green, fontWeight: 700 }}>✓</span>{it}
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 18px', fontSize: 12.5, color: '#92400e', lineHeight: 1.5 }}>
                  <b>Omnibus caveat:</b> items marked "post-Omnibus" reflect the 2025 Omnibus I simplification package (50 t de minimis, 31 Aug declaration deadline, 50% quarterly holding, Feb 2027 certificate sales). Verify the final consolidated legal text before relying on these operationally.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================== TAB 4 — METHODOLOGY & DATA NOTES ============= */}
        {tab === 4 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Data provenance" />
                <ul style={{ fontSize: 12.5, color: T.textPri, lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
                  <li><b>Trade flows:</b> {DATA_LABEL}. Values are rounded, directionally-correct approximations of annual extra-EU-27 imports; sanction-affected flows shown at residual (post-restriction) levels.</li>
                  <li><b>Carbon intensities:</b> production-route estimates (BF-BOF vs EAF share, smelter power source, kiln fuel, SMR vs electrolysis, grid mix) — basis noted per row (hover matrix rows). Cross-checked against EU ETS product benchmarks and published route averages; use supplier installation data for real filings.</li>
                  <li><b>Domestic carbon prices:</b> conservative "effectively paid" estimates after origin-scheme free allocation (Art. 9 deduction) — not headline scheme prices.</li>
                  <li><b>Engine:</b> phase-in schedule, ETS price scenarios and the net-cost formula come from the platform CBAM engine (backend/services/cbam_service.py) via /api/v1/cbam — Live badge confirms; Demo badge means an identical local mirror was used.</li>
                </ul>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Emissions scope per sector (Annex II)" />
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: T.sub }}>
                    <tr><th style={th}>Sector</th><th style={th}>HS chapters</th><th style={th}>CBAM scope</th><th style={th}>Indirect status</th></tr>
                  </thead>
                  <tbody>
                    {CBAM_SECTORS.map(s => (
                      <tr key={s.key}>
                        <td style={{ ...td, fontWeight: 600 }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: s.color, marginRight: 7 }} />{s.name}</td>
                        <td style={{ ...td, fontFamily: T.fontMono, fontSize: 11.5 }}>{s.hs}</td>
                        <td style={td}>{s.scope === 'direct' ? 'Direct only' : 'Direct + indirect'}</td>
                        <td style={td}>{s.scope === 'direct' ? <Badge val="Under review" color="#92400e" bg="#fef3c7" /> : <Badge val="In scope" color="#166534" bg="#dcfce7" />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 11.5, color: T.textSec, marginTop: 10, lineHeight: 1.5 }}>
                  Indirect (electricity) emissions for steel, aluminium and hydrogen are deferred pending Commission review — the matrix shows both intensities so you can size that contingent exposure (e.g. Indian aluminium: 1.9 direct vs ~18.5 total tCO2/t).
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Exemptions & special regimes" />
                <ul style={{ fontSize: 12.5, color: T.textPri, lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
                  <li><b>EEA/EFTA (Norway, Iceland, Liechtenstein) + Switzerland:</b> in or linked to the EU ETS — outside CBAM scope (Annex III). Norwegian aluminium/electricity and Icelandic aluminium are exempt.</li>
                  <li><b>United Kingdom:</b> EU-UK ETS linkage agreed in principle (May 2025); once operational, UK-origin goods and electricity leave CBAM scope. UK rows flagged "exemption pending".</li>
                  <li><b>Energy Community (Western Balkans, Ukraine, Moldova) — electricity:</b> conditional exemption pathway (Art. 2) tied to market coupling and carbon-pricing commitments; otherwise fully liable.</li>
                  <li><b>Russia sanctions:</b> finished steel banned (2022), semi-finished quota phases out by 2028; primary aluminium banned with quota under the 16th package (Feb 2025). Fertilisers are NOT sanctioned (food-security carve-out) but face escalating EU tariffs from Jul 2025 — CBAM stacks on top for whatever residual flows remain.</li>
                  <li><b>De minimis:</b> post-Omnibus 50 t/yr mass threshold exempts small importers (irrelevant at the flow scale mapped here).</li>
                </ul>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <SectionH title="Known limitations" />
                <ul style={{ fontSize: 12.5, color: T.textPri, lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
                  <li>Sector aggregates hide product-level dispersion (e.g. rebar vs cold-rolled coil intensity within HS 72). Refresh from CEPII BACI at HS-6 for production precision.</li>
                  <li>Hydrogen rows are corridor placeholders — merchant EU H2 imports are effectively zero today.</li>
                  <li>Trade values and volumes move ±20-30% year-to-year with prices (esp. fertilisers post-2022 gas shock); treat ratios (intensity, % of unit value) as more stable than levels.</li>
                  <li>Substitution verdicts assume full CBAM cost pass-through to landed price and static origin mix — no supply-response modelling.</li>
                  <li>Effective domestic carbon prices are estimates; Art. 9 deductions in real filings require documented evidence of price actually paid.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
