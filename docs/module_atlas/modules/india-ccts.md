# India Carbon Credit Trading Scheme (CCTS)
**Module ID:** `india-ccts` · **Route:** `/india-ccts` · **Tier:** B (frontend-computed) · **EP code:** EP-IN2 · **Sprint:** IN

## 1 · Overview
Ultra-detailed India CCTS compliance, trading, and financial impact module covering all 9 BEE-approved offset methodologies (BM-EN01 through BM-FR05), 18 approved calculation tools (BM-T-001 through BM-T-AR-0006), 740 designated entities across 9 sectors, carbon pricing scenarios, CBAM linkage analysis, PAT scheme transition, and full calculation engine with assurance-ready audit trails per ISO 14064/14065.

> **Business value:** This module is the definitive tool for navigating India's Carbon Credit Trading Scheme — from compliance obligation assessment through methodology selection, emission reduction calculation, CCC issuance, and market trading strategy. Critical for: (1) Obligated entities in 9 CCTS sectors needing to calculate compliance costs and identify abatement opportunities; (2) Financial institutions assessing credit risk exposure to CCTS-obligated borrowers; (3) Carbon market participants evaluating trading strategies across IEX/PXIL/HPOWERT; (4) Exporters needing to offset CBAM liability with domestic CCC purchases; (5) Offset project developers registering under BEE's 9 approved methodologies.

**How an analyst works this module:**
- Start at CCTS Overview tab to see the 8 KPI cards covering 740 entities, 9 sectors, pricing, and market size
- Use Compliance Framework tab to understand the 7-body institutional architecture (NSCICM → BEE → CERC → GCI) and annual compliance cycle
- Sector Deep-Dive tab lets you select any of 9 CCTS sectors to see entity counts, emission intensity benchmarks, top companies, and reduction targets
- Approved Methodologies tab shows all 9 BM codes with applicability, baseline approach, and crediting periods — filter by sector or category
- Approved Tools tab lists all 18 BM-T tools with dependency matrix showing which tools are required for which methodologies
- Carbon Pricing tab has an interactive INR 500-5,000 slider showing revenue by sector and comparison with EU ETS, UK ETS, California, Korea
- Financial Impact Simulator lets you select a NIFTY 50 industrial company and model compliance cost, margin impact, and NPV of technology investment vs penalty
- CBAM Linkage tab shows dual sliders (India CCC price vs EU CBAM price) with offset calculation and export competitiveness analysis
- Navigate to "🔢 Calculate & Validate" tab to run the full CCTS engine — select a methodology, enter project data, get CCC count + audit trail + assurance checklist
- The "📋 Assurance Report" tab generates an ISO 14064/14065 compliant report from your calculation that can be exported for verification

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CBAM_SECTORS`, `COMPLIANCE`, `COMPLIANCE_STEPS`, `COVERAGE_PCT`, `INDUSTRIAL_COMPANIES`, `INSTITUTIONS`, `INTL_CARBON_PRICES`, `JCM_AGREEMENTS`, `METHODOLOGIES`, `NATIONAL_EMISSIONS_MT`, `PAT_HISTORY`, `PRICING`, `REAL_NON_SOLAR_REC_INR`, `REAL_PAC_PRICE_INR`, `REAL_SOLAR_REC_INR`, `SECTORS`, `TABS`, `TOOLS`, `TOOL_METH_MAP`, `TOTAL_AVOIDED_MT`, `TOTAL_BASELINE_MT`, `TOTAL_ENTITIES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `METHODOLOGIES` | 10 | `sector`, `title`, `category`, `applicability`, `baseline`, `crediting_period_yrs`, `renewable`, `source` |
| `TOOLS` | 18 | `title`, `category`, `scope` |
| `INSTITUTIONS` | 8 | `fullName`, `role`, `chair` |
| `SECTORS` | 20 | `code`, `entities`, `baselineEmissions_mt`, `bauProjection2027_mt`, `targetPostCCTS_mt`, `avoidedEmissions_mt`, `reduction_pct`, `phaseNotification`, `benchmarks`, `type`, `intensity`, `unit` |
| `INTL_CARBON_PRICES` | 7 | `price_usd`, `currency`, `year` |
| `PAT_HISTORY` | 8 | `period`, `entities`, `targetSaving_mtoe`, `achievedSaving_mtoe`, `escerts`, `pct` |
| `COMPLIANCE_STEPS` | 8 | `title`, `desc`, `duration` |
| `JCM_AGREEMENTS` | 7 | `status`, `date`, `scope`, `itmo_eligible` |
| `CONNECTED_MODULES` | 11 | `label`, `desc` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `_SEED_LATEST_REC` | `INDIA_REC_PRICES.length ? INDIA_REC_PRICES[INDIA_REC_PRICES.length - 1] : null;` |
| `_SEED_LATEST_PAC` | `INDIA_PAC_CYCLE_RESULTS.length ? INDIA_PAC_CYCLE_RESULTS[INDIA_PAC_CYCLE_RESULTS.length - 1] : null;` |
| `guard` | `(n, d, fb = 0) => d > 0 ? n / d : fb;` |
| `pct` | `(n, d) => d > 0 ? +((n / d) * 100).toFixed(1) : 0;` |
| `fmtN` | `v => typeof v === 'number' ? (Math.abs(v) >= 1e9 ? (v / 1e9).toFixed(1) + 'B' : Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : Math.abs(v) >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : v.toFixed(1)) : v;` |
| `badgeS` | `(bg, color) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: bg, color });` |
| `cycleNum` | `parseInt(row.cycle.replace(/[^0-9]/g, ''), 10);` |
| `TOTAL_ENTITIES` | `SECTORS.reduce((s, sec) => s + sec.entities, 0);` |
| `TOTAL_BASELINE_MT` | `SECTORS.reduce((s, sec) => s + sec.baselineEmissions_mt, 0);` |
| `TOTAL_AVOIDED_MT` | `SECTORS.reduce((s, sec) => s + sec.avoidedEmissions_mt, 0);` |
| `csv` | `[h.join(','), ...data.map(r => h.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');` |
| `growth` | `1 + 0.15 * t + 0.02 * t * t;` |
| `low` | `Math.round(base * growth * 0.7);` |
| `mid` | `Math.round(base * growth);` |
| `high` | `Math.round(base * growth * 1.4);` |
| `sectorRevenue` | `useMemo(() => { return SECTORS.map(sec => { const surplus_mt = sec.avoidedEmissions_mt;` |
| `revInr` | `surplus_mt * 1e6 * cccPrice;` |
| `totalEmissions` | `scope1 + scope2;` |
| `complianceCostInr` | `totalEmissions * cccPrice;` |
| `marginImpact` | `pct(complianceCostInr / 1e7, revCr);` |
| `techReductionPct` | `Math.min(0.4, techInvestment * 0.0004);` |
| `reducedEmissions` | `Math.round(totalEmissions * (1 - techReductionPct));` |
| `surplusCCC` | `Math.max(0, Math.round(totalEmissions * 0.85 - reducedEmissions));` |
| `surplusRevenue` | `surplusCCC * cccPrice;` |
| `penaltyCost` | `totalEmissions * cccPrice * 2;` |
| `npvInvestment` | `techInvestment * 1e7;` |
| `npvSavings` | `surplusRevenue * ((1 - Math.pow(1.1, -projectionYears)) / 0.1);` |
| `cbamLiability` | `item.emissions_tco2 * euCbamPrice;` |
| `domesticPayment` | `item.emissions_tco2 * indiaCccPriceCbam;` |
| `netCbamCost` | `Math.max(0, cbamLiability - domesticPayment);` |
| `savings` | `cbamLiability - netCbamCost;` |
| `seed` | `si * 71 + 13;` |
| `offsetProjects` | `useMemo(() => { return METHODOLOGIES.map((m, mi) => { const seed = mi * 47 + 31;` |
| `capacity` | `m.sector === 'Forestry' ? Math.round(500 + sr(seed) * 4500) : Math.round(5000 + sr(seed) * 50000);` |
| `annualCredits` | `m.sector === 'Forestry' ? Math.round(capacity * (3 + sr(seed + 1) * 7)) : Math.round(capacity * (0.5 + sr(seed + 1) * 2));` |
| `sectorPie` | `SECTORS.map(s => ({ name: s.name, value: s.entities }));` |
| `emissionsBar` | `SECTORS.map(s => ({ name: s.name.length > 12 ? s.name.slice(0, 12) + '..' : s.name, baseline: s.baselineEmissions_mt, avoided: s.avoidedEmissions_mt, bau: (s.bauProjection2027_mt \|\| 0) }));` |
| `methSectors` | `['All', ...new Set(METHODOLOGIES.map(m => m.sector))];` |
| `categories` | `[...new Set(TOOLS.map(t => t.category))];` |
| `baseSupply` | `TOTAL_AVOIDED_MT * (1 + t * 0.05);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPLIANCE_STEPS`, `CONNECTED_MODULES`, `INSTITUTIONS`, `INTL_CARBON_PRICES`, `JCM_AGREEMENTS`, `METHODOLOGIES`, `PAT_HISTORY`, `SECTORS`, `TABS`, `TOOLS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Designated Entities | — | BEE/MoP Gazette | 9 sectors: Iron & Steel (253), Textiles (90), Cement (50+), Petrochemicals (39), Pulp & Paper (30+), Chlor-Alkali (30+), Fertiliser (29), Petroleum Refining (21), Aluminium (13) |
| Covered Emissions | — | BEE | ~16% of India national emissions; Iron & Steel + Cement = 76% of CCTS-covered emissions |
| Approved Methodologies | — | BEE CCTS | BM-EN01.001/002 (Energy), BM-IN02.001/002 (Industry), BM-WA03.001/002 (Waste), BM-AG04.001 (Agriculture), BM-FR05.001/002 (Forestry) |
| Approved Tools | — | BEE CCTS | 13 general (BM-T-001 to BM-T-015) + 5 forestry (BM-T-AR-0002 to BM-T-AR-0006) |
| CCC Price Estimate | — | S&P Global/Industry | ~USD 7-15/tCO2e at initial trading; 2x penalty for non-compliance |
| Market Size 2030 | — | Industry estimates | India total carbon market including compliance + voluntary |
| CBAM Overlap | — | EU CBAM Regulation | Steel, Aluminium, Cement, Fertiliser, Hydrogen — domestic CCC payment offsets CBAM liability |
| Compliance Cycle | — | CCTS Rules 2023 | Baseline FY 2023-24, first compliance FY 2025-26, CCC trading expected Oct-Nov 2026 |
| Exchanges | — | CERC | IEX, PXIL, HPOWERT — regulated by CERC under March 2026 regulations |
| MRV Standard | — | BEE | Mandatory third-party verification by BEE-accredited ACVAs |
| PAT Legacy | — | BEE PAT | 9 of 13 PAT sectors transition to CCTS; 4 remain PAT-only (thermal power, railways, DISCOMs, ports) |
| Article 6.2 Bilateral | — | PIB Aug 2025 | Signed 29 Aug 2025; Singapore/Sweden/Korea in negotiation |
- **Project activity data (generation MWh, fuel consumption, production tonnes)** → Methodology engine (BM-EN/IN/WA/AG/FR) → **Baseline, project, and leakage emissions quantified per BEE methodology**
- **CEA grid emission factor + IPCC Tier 2 factors** → Tool calculations (BM-T-001 through BM-T-015) → **Emission factors applied to baseline and project scenarios**
- **Verified emission reduction (tCO2e)** → CCC issuance calculation → **Carbon Credit Certificates issued (1 CCC = 1 tCO2e, rounded down)**
- **CCC issuance + market price** → Financial impact model → **Compliance cost, surplus revenue, CBAM offset value, NPV of investment**
- **Assurance checklist + MRV compliance flags** → Audit trail generator → **ISO 14064/14065 compliant assurance report with step-by-step calculation chain**
- **CCTS sector targets + CBAM commodity data** → Cross-module linkage → **Financial exposure flowing to PCAF, Capital Adequacy, Transition Risk, RBI Climate modules**

## 5 · Intermediate Transformation Logic
**Methodology:** BEE CCTS Methodology Engine (9 methodologies × 18 tools)
**Headline formula:** `ER_y = Baseline_y - Project_y - Leakage_y; CCC = floor(ER_y); Value = CCC × Price_INR`

The engine implements all 9 BEE-approved methodologies end-to-end: (1) BM-EN01.001/002 for grid-connected and captive renewable energy using CEA grid emission factors; (2) BM-IN02.001/002 for industrial fuel switching and process emissions reduction with sector-specific benchmarks (cement clinker ratio, steel scrap ratio); (3) BM-WA03.001/002 for landfill methane recovery and waste-to-energy using IPCC Tier 2 FOD model; (4) BM-AG04.001 for agricultural residue methane avoidance; (5) BM-FR05.001/002 for mangrove and terrestrial afforestation/reforestation with 30-year crediting and buffer pools. Each methodology pipeline: Data Capture → Validation → Baseline Calc → Project Calc → Leakage Calc → Net Reduction → CCC Issuance → Audit Trail → Assurance Checklist.

**Standards:** ['Energy Conservation (Amendment) Act 2022', 'CCTS Rules 2023 (S.O. 2825(E))', 'BEE Offset Mechanism Procedure 2025', 'ISO 14064-2:2019', 'ISO 14065:2020', 'CEA CO2 Baseline Database v19', 'IPCC Guidelines 2006']
**Reference documents:** Energy Conservation (Amendment) Act, 2022 (No. 19 of 2022); Carbon Credit Trading Scheme, 2023 — S.O. 2825(E), 28 June 2023; BEE Detailed Procedure for Offset Mechanism under CCTS (March 2025); CERC Terms and Conditions for Purchase and Sale of CCCs Regulations, 2026; CEA CO2 Baseline Database for Indian Power Sector v19 (2024); ICAP ETS Map — Indian Carbon Credit Trading Scheme Profile; CEEW Analysis: How India's Final Emission Reduction Targets Shape Carbon Market Dynamics (2025); S&P Global: Industry Sees Initial Carbon Credits Priced Around $10/mtCO2e in India (2024); India-Japan Joint Crediting Mechanism Bilateral Agreement (29 August 2025); CSEP Working Paper: India's CBAM Challenge — Strategic Response and Policy Options (2025)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This is one of the platform's most **substantially-grounded** modules: a 14-tab India Carbon Credit
Trading Scheme (CCTS) workbench that imports a real methodology engine (`cctsEngine`) implementing the
9 BEE-approved offset methodologies and 18 tools, plus real reference data (CEA grid factors, PAT
benchmarks, NIFTY-50, India REC/PAC prices). The emission-reduction and financial-impact formulas are
genuine BEE-methodology arithmetic; only the offset-project pipeline sizing uses seeded PRNG. Code and
guide (EP-IN2) agree closely — no mismatch flag.

### 7.1 What the module computes

**Emission reduction / CCC issuance** (guide + engine):

```
ER_y  = Baseline_y − Project_y − Leakage_y        (per BEE methodology)
CCC   = floor(ER_y)                                (1 CCC = 1 tCO₂e, rounded down)
Value = CCC × Price_INR
```

**Sector surplus revenue** and **compliance cost** (on-page financial model):

```js
revInr             = surplus_mt · 1e6 · cccPrice
complianceCostInr  = totalEmissions · cccPrice
marginImpact       = pct(complianceCostInr/1e7, revCr)     // % of revenue (₹ crore)
```

**Technology-investment abatement + NPV** (Financial Impact Simulator):

```js
techReductionPct = min(0.4, techInvestment · 0.0004)       // capped 40% abatement
reducedEmissions = round(totalEmissions · (1 − techReductionPct))
surplusCCC       = max(0, round(totalEmissions·0.85 − reducedEmissions))
penaltyCost      = totalEmissions · cccPrice · 2            // 2× non-compliance penalty
npvSavings       = surplusRevenue · (1 − 1.1^−projectionYears)/0.1   // 10% discount annuity
```

**CBAM linkage** — domestic CCC payment offsets EU CBAM liability:

```js
cbamLiability   = emissions_tco2 · euCbamPrice
domesticPayment = emissions_tco2 · indiaCccPriceCbam
netCbamCost     = max(0, cbamLiability − domesticPayment)
savings         = cbamLiability − netCbamCost
```

### 7.2 Parameterisation (real reference data)

| Table / constant | Value | Provenance |
|---|---|---|
| `SECTORS` (20 rows) | entity counts, baseline/avoided emissions | BEE/MoP Gazette — 740 designated entities, 9 sectors |
| CEA grid EF | national grid emission factor | `CEA_NATIONAL_GRID_EF` (CEA CO₂ Baseline DB v19) |
| PAT benchmarks | sector emission-intensity targets | `PAT_SECTOR_BENCHMARKS` |
| REC / PAC prices | latest clearing prices | `INDIA_REC_PRICES`, `INDIA_PAC_CYCLE_RESULTS` (real seed; PAC fallback ₹710) |
| CCC price | ₹500–5 000 slider (₹600–1 200 base ≈ $7–15/tCO₂e) | S&P Global / industry |
| Non-compliance penalty | 2× CCC price | CCTS Rules 2023 |
| Tech abatement | `min(0.4, invest·0.0004)` | Synthetic scaling (₹ crore → % abatement) |
| Methodology engine | 9 methodologies × 18 tools | `cctsEngine` (BEE Offset Procedure 2025, ISO 14064/14065) |
| `FX` | ₹83.5/USD | Fixed |

Offset-project *pipeline* sizing uses PRNG (`sr(seed)`): forestry capacity `500 + sr·4500`, non-forestry
`5 000 + sr·50 000`, with annual-credit multipliers — the only synthetic quantities.

### 7.3 Calculation walkthrough

`TOTAL_ENTITIES`, `TOTAL_BASELINE_MT`, `TOTAL_AVOIDED_MT` sum the real `SECTORS` table. The Calculate &
Validate tab runs the imported engine: `validateInputs` → `METHODOLOGY_ENGINES[m]` computes
baseline/project/leakage → CCC issuance → `generateAssuranceReport` produces an ISO 14064/14065 audit
trail. `sectorRevenue` monetises each sector's avoided emissions at the CCC price slider. The Financial
Impact Simulator selects a NIFTY-50 company, computes compliance cost, margin impact, surplus-CCC
revenue from a tech investment, penalty cost and a 10%-discounted NPV of savings. CBAM tab runs the
dual-price offset.

### 7.4 Worked example (Financial Impact Simulator)

Company: `scope1+scope2 = 5 000 000 tCO₂e`, `revenue = ₹50 000 crore`, CCC price ₹900, tech investment
₹500 crore, 10-yr projection:

| Step | Computation | Result |
|---|---|---|
| complianceCost | 5e6 × 900 | ₹450 crore |
| marginImpact | pct(450e7/1e7, 50000) | (450/50 000)·100 = **0.9%** of revenue |
| techReductionPct | min(0.4, 500·0.0004) | 0.20 (20%) |
| reducedEmissions | 5e6·0.80 | 4 000 000 t |
| surplusCCC | max(0, 5e6·0.85 − 4e6) | max(0, 250 000) = **250 000 CCC** |
| surplusRevenue | 250 000 × 900 | ₹22.5 crore/yr |
| npvSavings | 22.5·(1−1.1⁻¹⁰)/0.1 | 22.5·6.145 = **₹138 crore** |
| penaltyCost (avoided) | 5e6·900·2 | ₹900 crore |

The tech investment (₹500 cr) yields ₹138 cr NPV of surplus-CCC revenue and, crucially, avoids the 2×
penalty exposure — the module's core abatement-vs-penalty decision.

### 7.5 Companion analytics & interconnections

- **11 approved methodologies / 18 tools** tabs with dependency matrix (real BM codes).
- **PAT-to-CCTS transition** (7 completed PAT cycles; 9 of 13 sectors transition).
- **International linkage** — India-Japan JCM (Article 6.2, signed 29 Aug 2025).
- `CONNECTED_MODULES` (11) route CCTS exposure to PCAF, Capital Adequacy, Transition Risk, RBI Climate.

### 7.6 Data provenance & limitations

- **Largely real**: reference data (CEA grid EF, PAT benchmarks, REC/PAC prices, NIFTY-50, CBAM
  exposure) and the methodology engine are imported modules, not fabricated. Regulatory citations
  (EC Amendment Act 2022, CCTS Rules 2023 S.O. 2825(E), BEE Procedure 2025) are accurate.
- **Synthetic elements**: the offset-project pipeline sizing (`sr()`) and the tech-abatement scaling
  (`invest·0.0004`, capped 40%) are heuristic, not engineering-costed abatement curves.
- Sector baseline/BAU/target figures are BEE estimates; forward CCC price is a user slider, not a
  market model.

**Framework alignment:** Energy Conservation (Amendment) Act 2022 · CCTS Rules 2023 · BEE Offset
Mechanism Procedure 2025 · ISO 14064-2 / 14065 (MRV, verification) · CEA CO₂ Baseline DB v19 · IPCC
2006 Guidelines (Tier-2 FOD for landfill). The engine implements the ER = Baseline − Project − Leakage
identity per methodology; CBAM linkage follows the EU CBAM Regulation's domestic-carbon-price credit.
The abatement-cost curve (tech investment → % reduction) is the one quantity that would benefit from a
real marginal-abatement-cost model rather than the linear scaling used.

## 9 · Future Evolution

### 9.1 Evolution A — Sector MACCs and a CCC price model replacing the two heuristics (analytics ladder: rung 2 → 3)

**What.** This is one of the platform's most grounded modules — a real `cctsEngine` implementing all 9 BEE methodologies and 18 tools with ISO 14064/14065 audit trails, real CEA grid factors, PAT benchmarks and live REC/PAC prices. §7.6 isolates exactly two synthetic elements: the offset-project pipeline sizing (`sr(seed)` capacities and credit multipliers) and the Financial Impact Simulator's tech-abatement scaling (`techReductionPct = min(0.4, invest·0.0004)` — a linear ₹-to-% heuristic the deep-dive itself says "would benefit from a real marginal-abatement-cost model"). Evolution A replaces both: sector MACCs (steel scrap/EAF, cement clinker substitution, per the CCTS benchmark intensities already in `SECTORS`) drive the investment→abatement mapping, and the forward CCC price becomes a supply/demand model instead of a bare slider.

**How.** (1) An abatement-lever table per CCTS sector (CAPEX, ₹/tCO₂e, potential) sourced from CEEW/BEE sector studies; the simulator deploys levers in ascending cost against the entity's compliance gap. (2) CCC price scenarios derived from aggregate sector surplus/deficit (the module already computes `TOTAL_AVOIDED_MT` and per-sector targets) with the S&P $7–15 band as the calibration anchor. (3) Offset pipeline re-seeded from actual BEE-registered project announcements as they publish, honest-empty until then. (4) Pin the §7.4 worked example (₹450 cr compliance cost, ₹138 cr NPV) in bench_quant before refactoring.

**Prerequisites.** Sector abatement-cost data collection; the `sr()` pipeline draws removed. **Acceptance:** the simulator's investment→abatement curve is piecewise (lever-ordered), not linear; a documented lever list backs every abatement %; CCC price scenarios respond to the sector-target inputs.

### 9.2 Evolution B — CCTS compliance analyst over the methodology engine (LLM tier 2)

**What.** The module's 14-tab breadth is exactly what a copilot compresses: "am I an obligated entity, and what's my FY 2025-26 target?", "which BM methodology fits a 25 MW captive solar project, and which BM-T tools does it require?", "run the CCC calculation for this landfill-gas project and draft the assurance checklist", "how much CBAM liability does ₹900 CCC pricing offset for my steel exports?" Tier 2 tool-calls the real `cctsEngine` (validate → baseline/project/leakage → CCC issuance → assurance report) rather than reciting regulation from memory.

**How.** Expose the frontend-imported engine as a backend route (`POST /india-ccts/calculate`) so it becomes tool-callable — the engine logic already exists, this is transport. Tool schemas also cover the CBAM dual-price offset and the financial simulator. The system prompt grounds on this page's exceptional regulatory corpus (§5's methodology pipeline, the `INSTITUTIONS`/`COMPLIANCE_STEPS`/`JCM_AGREEMENTS` tables); every statutory citation (CCTS Rules 2023 S.O. 2825(E), 2× penalty, Oct-Nov 2026 trading start) must quote the curated rows, never free recall — Indian carbon regulation is moving fast and the tables carry the vintage. Methodology selection answers must cite the `TOOL_METH_MAP` dependency matrix.

**Prerequisites.** Engine route extraction; Phase 2 tool-calling. **Acceptance:** a CCC calculation answer reproduces the engine's audit trail verbatim; every regulatory fact traces to a seed-table row; out-of-scope sectors (thermal power — PAT-only) get correct refusals.