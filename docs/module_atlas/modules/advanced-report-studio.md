# Advanced Report Studio
**Module ID:** `advanced-report-studio` · **Route:** `/advanced-report-studio` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Drag-and-drop sustainability report builder supporting multi-framework simultaneous export across GRI, TCFD, CSRD ESRS, ISSB S1/S2, and SFDR. Provides a pre-built template library, module-level content blocks, and version-controlled disclosure management. Enables compliance officers to assemble investor-grade reports without manual data re-entry.

> **Business value:** The Report Studio eliminates the double-entry burden of multi-framework reporting by maintaining a single source of truth mapped to all major standards. Version control and audit trails satisfy ISAE 3000 assurance requirements and reduce external auditor review time by providing traceable data lineage for every reported figure.

**How an analyst works this module:**
- Choose primary reporting framework and target disclosure year
- Drag content blocks onto report canvas from the module palette
- Auto-populate data fields from connected platform modules
- Review coverage score per framework and resolve gaps
- Export as XBRL, PDF, or structured JSON for regulator submission

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEMO_HOLDINGS`, `FRAMEWORKS`, `GLOSSARY`, `METHODOLOGY_NOTES`, `NGFS_SCENARIOS`, `SECTOR_COLORS`, `YOY_DATA`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `NGFS_SCENARIOS` | 5 | `category`, `color`, `temp`, `carbon2030`, `sectorShocks`, `Energy`, `Materials`, `Industrials`, `Utilities`, `Financials`, `IT` |
| `YOY_DATA` | 4 | `waci`, `sbtiPct`, `scope12`, `impliedTemp` |
| `METHODOLOGY_NOTES` | 7 | `text` |
| `GLOSSARY` | 18 | `definition` |
| `DEMO_HOLDINGS` | 13 | `company`, `ticker`, `name`, `exchange`, `sector`, `scope1_mt`, `scope2_mt`, `revenue_usd_mn`, `market_cap_usd_mn`, `evic_usd_mn`, `esg_score`, `transition_risk_score`, `sbti_committed`, `carbon_neutral_target_year` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmtN` | `(n, d = 1) => (typeof n === 'number' && isFinite(n)) ? n.toFixed(d) : 'N/A';` |
| `totalExp` | `holdings.reduce((s, h) => s + (h.exposure_usd_mn \|\| 0), 0);` |
| `sbtiPct` | `(sbtiCount / (holdings.length \|\| 1)) * 100;` |
| `dataCoverage` | `(dataCount / (holdings.length \|\| 1)) * 100;` |
| `totalWeight` | `holdings.reduce((s, h) => s + (h.weight \|\| 0), 0) \|\| 100;` |
| `totalWeightedRev` | `holdings.reduce((s, h) => s + (h.weight / totalWeight) * (h.company?.revenue_usd_mn \|\| 0), 0);` |
| `carbonEfficiency` | `totalS12 > 0 ? (totalWeightedRev / (totalS12 * 1000)) : 0;` |
| `TRANSITION_SHOCKS` | `{ Energy: -0.35, Materials: -0.22, Utilities: -0.28, Industrials: -0.15, Financials: -0.08, IT: 0.12, 'Health Care': 0.05, 'Consumer Discretionary': -0.10, 'Consumer Staples': -0.05, 'Real Estate': -0.18, 'Communication ` |
| `PHYSICAL_SHOCKS` | `{ Energy: -0.08, Materials: -0.12, Utilities: -0.06, Industrials: -0.05, Financials: -0.10, IT: -0.02, 'Health Care': -0.04, 'Consumer Discretionary': -0.08, 'Consumer Staples': -0.15, 'Real Estate': -0.20, 'Communicatio` |
| `combinedCVaR` | `z * Math.sqrt(transVar * transVar + physVar * physVar + 2 * rho * transVar * physVar);` |
| `cvarPct` | `totalExp > 0 ? (combinedCVaR / totalExp) * 100 : 0;` |
| `yearsTo2030` | `Math.max(1, 2030 - new Date().getFullYear());` |
| `requiredAnnualDecline` | `waci > 0 ? (1 - Math.pow(targetWaci2030 / waci, 1 / yearsTo2030)) * 100 : 0;` |
| `carbonBudgetOvershoot` | `waci > budgetAlignedWaci ? ((waci - budgetAlignedWaci) / budgetAlignedWaci) * 100 : 0;` |
| `sbtiScore` | `(sbtiCount / n) * 40;` |
| `nzScore` | `(nzBefore2050 / n) * 30;` |
| `greenScore` | `Math.min(greenRevShare, 100) * 0.3;` |
| `transitionReadinessIndex` | `Math.min(100, sbtiScore + nzScore + greenScore);` |
| `greenBrownRatio` | `greenRevShare > 0 ? (greenRevShare / Math.max(brownWeight, 1)) : 0;` |
| `strandingRiskPct` | `(strandingExposure / totalExp) * 100;` |
| `controversialPct` | `(controversialCount / n) * 100;` |
| `esgScores` | `holdings.map(h => h.company?.esg_score \|\| 50);` |
| `esgMean` | `esgScores.reduce((a, b) => a + b, 0) / n;` |
| `esgStdDev` | `Math.sqrt(esgScores.reduce((s, v) => s + Math.pow(v - esgMean, 2), 0) / n);` |
| `dataQualityScore` | `(dqCount / n) * 100;` |
| `sortedSectors` | `Object.values(sectorWeights).sort((a, b) => b - a);` |
| `top3SectorConcentration` | `sortedSectors.slice(0, 3).reduce((s, v) => s + v, 0);` |
| `maxWeight` | `Math.max(...holdings.map(h => h.weight \|\| 0), 0);` |
| `uniqueExchanges` | `new Set(holdings.map(h => h.company?.exchange)).size;` |
| `now` | `new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });` |
| `fmtNum` | `(n, d = 1) => (typeof n === 'number' && isFinite(n)) ? n.toFixed(d) : 'N/A';` |
| `ghgInt` | `c.revenue_usd_mn ? ((c.scope1_mt + c.scope2_mt) / c.revenue_usd_mn * 1000).toFixed(1) : 'N/A';` |
| `secWeight` | `hList.filter(h => (h.company?.sector \|\| '') === sec).reduce((s, h) => s + (h.weight \|\| 0), 0) / 100;` |
| `impact` | `secWeight * shock;` |
| `impactPct` | `(totalImpact * 100).toFixed(2);` |
| `varVal` | `(Math.abs(totalImpact) * totalExp).toFixed(1);` |
| `yoyData` | `YOY_DATA.map(y => ({` |
| `sectorPieData` | `useMemo(() => { const totalExp = effectiveHoldings.reduce((s, h) => s + (h.exposure_usd_mn \|\| 0), 0);` |
| `transRiskData` | `useMemo(() => { const buckets = [ { name: 'Low (0-25)', count: 0, color: T.green }, { name: 'Med (25-50)', count: 0, color: T.amber }, { name: 'High (50-75)', count: 0, color: '#f97316' }, { name: 'V.High (75-100)', count: 0, color: T.red }, ];` |
| `exchangeData` | `useMemo(() => { const totalW = effectiveHoldings.reduce((s, h) => s + (h.weight \|\| 0), 0);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pcaf/advanced/securities` | `assess_securities` | api/v1/routes/pcaf_advanced.py |
| POST | `/api/v1/pcaf/advanced/fund` | `assess_fund` | api/v1/routes/pcaf_advanced.py |
| POST | `/api/v1/pcaf/advanced/portfolio` | `assess_portfolio` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/indices` | `list_indices` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/indices/{index_key}` | `get_index_profile` | api/v1/routes/pcaf_advanced.py |
| POST | `/api/v1/pcaf/advanced/compare-to-index` | `compare_portfolio_to_index` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/gics-sub-sectors` | `list_gics_sub_sectors` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/sovereign-coverage` | `list_sovereign_coverage` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/nze-pathways` | `list_nze_pathways` | api/v1/routes/pcaf_advanced.py |
| GET | `/api/v1/pcaf/advanced/nace-gics-mapping` | `list_nace_gics_mapping` | api/v1/routes/pcaf_advanced.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `EDGAR` *(shared)*, `MSCI` *(shared)*, `active` *(shared)*, `broad` *(shared)*, `core` *(shared)*, `data` *(shared)*, `datetime` *(shared)*, `energy` *(shared)*, `fastapi` *(shared)*, `instrument_type` *(shared)*, `investee` *(shared)*, `pydantic` *(shared)*, `security` *(shared)*, `typing` *(shared)*, `underlying` *(shared)*
**Frontend seed datasets:** `DEMO_HOLDINGS`, `GLOSSARY`, `LOW_WAGE_SECTORS`, `METHODOLOGY_NOTES`, `NGFS_SCENARIOS`, `SECTOR_COLORS`, `YOY_DATA`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Frameworks Supported | — | Platform | GRI, TCFD, CSRD ESRS, ISSB S1/S2, SFDR PAI, UK TPT |
| Coverage Score | `Disclosed / Required × 100` | Platform audit | Percentage of mandatory disclosure items populated for selected framework |
- **Platform module outputs** → Map data fields to framework disclosure items via cross-walk matrix → **Populated report sections with coverage gap flags**
- **User-uploaded documents** → Parse and attach to relevant disclosure blocks → **Version-controlled report with audit trail**

## 5 · Intermediate Transformation Logic
**Methodology:** Template-driven multi-framework mapping
**Headline formula:** `Coverage_score = Disclosed_disclosures / Required_disclosures × 100`

Each content block is tagged to one or more framework disclosure requirements. A cross-walk matrix maps platform data fields to framework items, auto-populating narrative sections and tables. Coverage score tracks completeness per framework and flags mandatory items outstanding.

**Standards:** ['GRI Universal Standards 2021', 'ISSB IFRS S1/S2', 'CSRD ESRS Set 1']
**Reference documents:** GRI Universal Standards 2021; ISSB IFRS S1/S2 (2023); CSRD ESRS Set 1 (EU 2023/2772); SFDR Annex I PAI disclosure templates

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **3** other module(s).

| Connected module | Shared via |
|---|---|
| `advanced-reactor-finance` | table:EDGAR, table:MSCI, table:active, table:broad, table:core, table:data |
| `benchmark-analytics` | table:EDGAR |
| `financial-modeling-studio` | table:data |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

A **multi-framework sustainability report generator**: the user picks one of 10 hard-coded
framework definitions (TCFD, SFDR, CSRD/ESRS, ISSB S1/S2, PCAF, GRI, PRI, TNFD, CDP-style and
others in `FRAMEWORKS`), the page computes portfolio climate metrics from holdings (live
portfolio if loaded, else 6 `DEMO_HOLDINGS` NSE-listed names), auto-populates per-disclosure
narrative strings, and renders/export an HTML report. Two computation layers:

**`computePortfolioMetrics(holdings)` — headline metrics.**

```
WACI      = Σ w_i × (scope1_i + scope2_i)/revenue_i × 1000    // t CO₂e / $M revenue,
                                                              // w_i = exposure share
sbtiPct   = count(sbti_committed)/n × 100
dataCoverage = count(S1>0 or S2>0)/n × 100
impliedTemp  = 1.6 if WACI<120 · 1.9 <180 · 2.4 <250 · 2.8 <320 · else 3.2   (°C lookup)
waciReduction = max(0, (300 − WACI)/300 × 100)
```

**`computeAdvancedKPIs(holdings)` — 18 KPIs in 6 dimensions** (climate, transition readiness,
nature, social, governance/data-quality, portfolio risk). Highlights:

```
Climate VaR (95%, delta-normal, comment in code):
  T = Σ exposure_i × |transition_shock(sector_i)|
  P = Σ exposure_i × |physical_shock(sector_i)|
  CVaR = 1.645 × √(T² + P² + 2·0.25·T·P)          // ρ = 0.25 transition-physical correlation

Required decarbonisation:  (1 − (100/WACI)^(1/yearsTo2030)) × 100   // to WACI 100 by 2030
Carbon budget overshoot:   (WACI − 100)/100 × 100  when WACI > 100
Transition Readiness Index = min(100, 40·sbtiShare + 30·nz2050Share + 0.3·greenRevShare)
HHI = Σ (w_i·100)²;  top-3 sector concentration;  ESG mean/σ
```

### 7.2 Parameterisation

**Sector shock tables** (fraction of value, 11 GICS sectors):

| Sector | Transition shock | Physical shock |
|---|---|---|
| Energy | −0.35 | −0.08 |
| Materials | −0.22 | −0.12 |
| Utilities | −0.28 | −0.06 |
| Industrials | −0.15 | −0.05 |
| Financials | −0.08 | −0.10 |
| IT | +0.12 | −0.02 |
| Real Estate | −0.18 | −0.20 |
| Consumer Staples | −0.05 | −0.15 |
| (default) | −0.10 | −0.05 |

**NGFS scenario table** (`NGFS_SCENARIOS`) — four scenarios with 2030 carbon price and
per-sector equity shocks: Net Zero 2050 (Orderly, 1.5°C, $250; Energy −35%), Below 2°C
(Orderly, $150), Delayed Transition (Disorderly, $120; Energy −55% — the harshest transition
repricing, consistent with NGFS disorderly logic), Hot House World (3.5°C+, $30; damage
loaded onto Staples −22%, Financials −20%). Other constants: `targetWaci2030 = 100` and
`budgetAlignedWaci = 100` t/$M (stylised 1.5°C-aligned WACI anchor), MSCI ACWI benchmark
WACI 185 (narrative), `NATURE_DEPENDENCY` sector scores (Energy 85 … Comm. Services 12),
`boardDiversity = 32.4` (hard-coded), fallback metrics (WACI 210, implied temp 2.8 °C) when no
holdings exist, and `YOY_DATA` (FY2022 WACI 320 → FY2023 265 → current computed).

### 7.3 Calculation walkthrough

1. Holdings (live or demo) → `computePortfolioMetrics` → WACI, SBTi %, coverage, implied
   temperature (threshold lookup, not a regression-based ITR).
2. The same holdings → `computeAdvancedKPIs` → 18-metric panel; every return value is
   `isFinite`-guarded with explicit fallbacks.
3. Framework selection → per-disclosure narrative templates interpolate the computed metrics
   (e.g. SFDR PAI-2 renders "WACI: … t CO₂e/USD Mn Revenue. Benchmark: MSCI ACWI at 185";
   ISSB S2-M1 estimates Scope 3 as `(S1+S2) × 3.2`; PCAF-2 derives an invested-capital
   intensity as `WACI × 0.85`).
4. `generateHTMLReport` assembles cover, executive summary, KPI boxes, YoY table (nulls in
   FY2024 filled with current computed values), NGFS stress-test section, data-lineage table
   and glossary into a downloadable HTML document; a Markdown export path mirrors it.

### 7.4 Worked example — demo portfolio WACI and CVaR

Using the 6 demo holdings (total exposure = 24.5+31.2+28.0+21.0+19.5+14.0 = $138.2M):

- Reliance intensity = (28.5+6.2)/94,500 × 1000 = 0.3672 kt/$M → ×1000 = **367.2 t/$M**;
  weight 24.5/138.2 = 0.1773 → contribution 65.1. TCS: (0.40/27,800)×1000×0.2258 ≈ 0.0032.
  Summing all six gives **WACI ≈ 66 t CO₂e/$M** — dominated entirely by Reliance.
- CVaR: T = 24.5×0.35 + (31.2+21.0)×0.12 + (28.0+19.5)×0.08 + 14.0×0.05 = 8.575+6.264+3.80+0.70
  = **$19.34M**; P = 24.5×0.08+52.2×0.02+47.5×0.10+14.0×0.15 = 1.96+1.044+4.75+2.10 = **$9.85M**;
  CVaR = 1.645×√(19.34² + 9.85² + 2×0.25×19.34×9.85) = 1.645×√(374.0+97.0+95.3) = 1.645×23.80 =
  **$39.2M ≈ 28% of exposure**.
- Required decarbonisation (2026, 4 years to 2030, WACI 66 < 100) → exponent negative →
  0% (already below the 100 t/$M target); carbon budget overshoot = 0.

### 7.5 Data provenance & limitations

- Demo holdings are **hand-authored approximations of six real Indian large-caps** (tickers,
  revenues, emissions of plausible magnitude) — not sourced disclosures. No PRNG is used in
  the metric path; YoY history and board diversity are hard-coded.
- The "CVaR" is not a conditional VaR from a loss distribution: it is a delta-normal-style
  combination of two deterministic exposure-weighted shock aggregates. Because shocks enter as
  absolute values, diversification between long positions in winners (IT +12%) and losers is
  ignored — the figure is conservative by construction.
- Implied temperature is a 5-bucket WACI lookup, not an ITR model (no company-level pathway
  regression); Scope 3 in narratives is a flat ×3.2 multiplier of S1+S2; PCAF DQ score is a
  hard-coded 2.3 in text; the WACI-100 "1.5°C-aligned" anchor is a stylised platform choice.
- Narrative auto-population asserts compliance language ("compliant"/"partial") from these
  simplified metrics — a production report would require assured underlying data (ISAE 3000)
  and true disclosed/required coverage math (the guide's `Coverage_score` formula is not
  implemented; `dataCoverage` measures emissions-data availability, not disclosure coverage).
  No XBRL/JSON export exists despite the guide mentioning it — exports are HTML and Markdown.

### 7.6 Framework alignment

- **TCFD / ISSB IFRS S2** — the four-pillar structure (Governance/Strategy/Risk
  Management/Metrics & Targets) is reproduced in the framework definitions; S2 narratives
  cover cross-industry metric categories (GHG, transition/physical risk amounts, targets).
- **SFDR** — PAI-style indicators 1–3 (GHG, carbon footprint, GHG intensity) auto-fill from
  the WACI computation; benchmark comparison follows Annex I presentation conventions.
- **CSRD/ESRS E1** — E1-4 (targets) and E1-6 (gross Scope 1/2) narrative slots map to the
  actual ESRS datapoint numbering.
- **PCAF** — financed-emissions attribution appears in the KPI engine as
  `af = exposure/EVIC` × company emissions, which is PCAF's listed-equity attribution formula;
  the data-quality score (1–5 scale, 1 = reported & verified) follows PCAF's DQ hierarchy but
  is asserted, not computed.
- **NGFS** — the four-scenario set with orderly/disorderly/hot-house categories and harsher
  shocks under Delayed Transition mirrors NGFS Phase III/IV narrative logic; shock magnitudes
  are platform-stylised.
- **GRI 305 / PRI / TNFD** — additional narrative templates exist per framework; TNFD content
  uses the sector nature-dependency heuristic (ENCORE-style dependency scoring, simplified to
  one number per sector).

## 9 · Future Evolution

### 9.1 Evolution A — True disclosure-coverage math and regulator-grade export (analytics ladder: rung 2 → 3)

**What.** The studio already computes real portfolio metrics (WACI, 18 advanced KPIs) and
carries NGFS scenario shock tables — rung 2 — but §7.5 lists the honest gaps: the guide's
`Coverage_score = Disclosed/Required × 100` is **not implemented** (`dataCoverage` measures
emissions-data availability, not disclosure coverage), Scope 3 in narratives is a flat
×3.2 multiplier, implied temperature is a 5-bucket WACI lookup rather than an ITR model,
the PCAF DQ score is a hard-coded 2.3 in text, and exports are HTML/Markdown despite the
guide promising XBRL/JSON. Evolution A implements per-framework disclosure registries
(ESRS Set 1 datapoints, ISSB S2 metric categories, SFDR PAI Annex I items) as reference
tables, computes real disclosed/required coverage with mandatory-item gap flags, and adds
a structured JSON export keyed to those datapoint IDs (XBRL tagging as the stretch goal).

**How.** `report_frameworks` + `framework_datapoints` tables seeded from the cited
standards (ESRS EU 2023/2772 numbering already used in the E1-4/E1-6 slots); a coverage
engine walks the assembled report's populated blocks against required datapoints per
framework. Calibration (rung 3) comes from replacing the WACI-bucket implied temperature
with the platform's benchmark data via the `/api/v1/pcaf/advanced/indices` +
`/nze-pathways` endpoints, and computing PCAF DQ from holdings' actual data tiers instead
of asserting 2.3.

**Prerequisites.** Demo holdings clearly labelled as hand-authored approximations of
Indian large-caps (§7.5); compliance-language templates ("compliant"/"partial") reworded
until coverage math exists — asserting compliance from unimplemented math is the module's
biggest credibility risk. **Acceptance:** removing a mandatory ESRS E1-6 block drops the
CSRD coverage score and raises a gap flag; the JSON export validates against the datapoint
registry; PCAF DQ changes when holdings' data quality changes.

### 9.2 Evolution B — Render layer for LLM-drafted, engine-sourced narratives (LLM tier 3)

**What.** The productization roadmap explicitly names the report studio as the render
layer for desk-orchestrator output. Evolution B makes each disclosure block's narrative
LLM-drafted but engine-sourced: the orchestrator pulls WACI/CVaR/TRI from
`computeAdvancedKPIs`, NGFS stress results from the scenario tables, and financed-
emissions attribution from the PCAF endpoints, then drafts the SFDR PAI-2 or ISSB S2-M1
narrative around those exact values — replacing today's fixed string-interpolation
templates with framework-toned prose that still contains only computed numbers.

**How.** Per-block drafting tool: input = block's framework datapoint ID + the computed
metric payload + the framework's disclosure requirements from Evolution A's registry;
output = narrative with every numeric span annotated to its source metric (the
no-fabrication validator rejects unannotated numerics). Cross-module sourcing uses the
tier-3 routing artifacts (module_tags.json, Atlas interconnection graph) so a physical-
risk paragraph cites the digital-twin engine rather than this page's stylised sector
shocks. Human-in-the-loop: drafts land as suggestions with a diff view; version control
already fits the studio's audit-trail claim.

**Prerequisites (hard).** Evolution A's coverage registry (so the LLM knows what each
block must contain); the no-fabrication validator productionised; ISAE 3000 framing means
LLM drafts must be visibly marked unassured. **Acceptance:** every numeric in a generated
narrative traces to a named engine output or endpoint response; a block whose upstream
metric is unavailable renders an honest data-gap statement, never an invented figure.