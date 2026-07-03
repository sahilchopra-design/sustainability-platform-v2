# Baseline & Additionality Analyzer
**Module ID:** `baseline-additionality-analyzer` · **Route:** `/baseline-additionality-analyzer` · **Tier:** B (frontend-computed) · **EP code:** EP-DQ2 · **Sprint:** DQ

## 1 · Overview
Implements the UNFCCC additionality and baseline methodology suite — TOOL01 (project additionality), TOOL02 (financial analysis), TOOL21 (suppressed demand), and TOOL07 baseline emission factors. Provides barrier analysis, investment analysis (IRR/NPV with bisection), and regulatory surplus demonstration.

> **Business value:** Required for all CDM, GS4GG, VCS, and Article 6.4 project registration. Provides UNFCCC TOOL01/TOOL02-grade additionality analysis with bisection IRR calculation and audit-ready documentation for validation/verification body review.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ASSESSORS`, `BARRIERS`, `COUNTRIES`, `KpiCard`, `PENETRATION`, `PROJECTS`, `PROJ_TYPES`, `RegBox`, `ResultBadge`, `SDG_OPTIONS`, `SliderRow`, `TABS`, `TECH_TYPES`, `TOOL07_DATA`, `TOOLS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TOOLS` | `['TOOL01','TOOL02','TOOL07','TOOL21','TOOL01+TOOL02'];` |
| `BARRIERS` | `['Investment','Technological','Prevailing Practice','Institutional/Regulatory'];` |
| `wacc` | `8 + sr(i * 7 + 1) * 7;` |
| `irr` | `4 + sr(i * 11 + 2) * 16;` |
| `capex` | `500000 + sr(i * 13 + 3) * 9500000;` |
| `rev` | `80000 + sr(i * 17 + 4) * 1920000;` |
| `pen` | `sr(i * 19 + 5) * 25;` |
| `PENETRATION` | `COUNTRIES.map((c, ci) => ({` |
| `TOOL07_DATA` | `COUNTRIES.map((c, ci) => ({` |
| `TABS` | `['Assessment Pipeline','TOOL01 Investment Analysis','TOOL02 Common Practice','TOOL07 Grid EF','TOOL21 Small-Scale','Barrier Analysis Matrix','Sensitiv` |
| `fmt` | `(n, d = 0) => n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });` |
| `fmtM` | `n => `$${(n / 1e6).toFixed(2)}M`;` |
| `fmtK` | `n => `$${(n / 1000).toFixed(0)}K`;` |
| `map` | `{ Additional: T.green, 'Non-Additional': T.red, Pending: T.amber };` |
| `noAdd` | `PROJECTS.filter(p => p.additionalityResult === 'Non-Additional').length;` |
| `avgIRR` | `PROJECTS.reduce((s, p) => s + p.irr, 0) / Math.max(1, PROJECTS.length);` |
| `avgWACC` | `PROJECTS.reduce((s, p) => s + p.wacc, 0) / Math.max(1, PROJECTS.length);` |
| `carbonRev` | `t1Credits * t1Price;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSESSORS`, `BARRIERS`, `COUNTRIES`, `EVID_ITEMS`, `PEN_RANGE`, `PRICE_RANGE`, `PROJ_TYPES`, `SDG_OPTIONS`, `TABS`, `TECH_TYPES`, `TOOLS`, `WACC_RANGE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Additionality Rejection Rate | — | UNFCCC CDM Review Statistics 2023 | ~15% of CDM projects rejected at validation for insufficient additionality demonstration |
| Financial Test IRR Threshold | — | TOOL02 v6 Guidance 2012 | Investment barrier established if project IRR without carbon finance < (WACC - 2%); sensitivity tested at ±20% |
| Barrier Test Coverage | — | UNFCCC CDM EB Analysis 2022 | 70%+ of registered CDM projects rely on barrier analysis — most common: first-of-its-kind, technology risk |
- **Project financial model (CapEx, OpEx, revenue)** → TOOL02 investment analysis → **Project IRR/NPV with and without carbon finance**
- **Regulatory compliance records** → Step 1 regulatory surplus → **Evidence project exceeds legal requirements**
- **Technology deployment data in sector/region** → Common practice analysis → **Market penetration rate vs 20% threshold for non-common practice**

## 5 · Intermediate Transformation Logic
**Methodology:** TOOL01 Additionality Assessment
**Headline formula:** `Additionality: Project not viable without CDM/VCM revenue; IRR_withoutCarbon < WACC; NPV_withoutCarbon < 0; BarrierIdentified; NotCommonPractice`
**Standards:** ['TOOL01 v8 — Tool for the Demonstration of Additionality 2012', 'TOOL02 v6 — Tool for the Assessment of the Investment Barrier 2012', 'TOOL21 v1 — Suppressed Demand Baseline 2010', 'UNFCCC Decision 4/CMP.1 — Additionality Guidance']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).