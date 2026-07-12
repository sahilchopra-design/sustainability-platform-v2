# Climate Revenue Bond Modeller
**Module ID:** `climate-revenue-bond-modeler` · **Route:** `/climate-revenue-bond-modeler` · **Tier:** B (frontend-computed) · **EP code:** EP-DY2 · **Sprint:** DY

## 1 · Overview
Climate revenue bond modelling with dedicated revenue stream analysis (toll, utility, tax increment), debt service coverage calculation, climate risk to revenue base assessment, and green certification premium. Covers MSRB and CDFA frameworks.

> **Business value:** Enables rigorous climate revenue bond modelling integrating DSCR analysis, physical risk revenue discounting, and green certification premium to support issuance structuring and investor credit assessment.

**How an analyst works this module:**
- Model dedicated revenue stream (toll, utility rate, tax increment, special assessment) under base and stress scenarios
- Calculate DSCR under current, climate-stressed, and rate-adjustment scenarios
- Apply physical climate risk discounts to revenue projections using scenario-specific impact factors
- Assess green/climate certification eligibility and compute pricing premium benefit vs SPO cost

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOND_SECTORS`, `COVENANT_TYPES`, `GREEN_STANDARDS`, `Kpi`, `STRESS_SCENARIOS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `BOND_SECTORS` | 7 | `name`, `icon`, `revenueSource`, `rating`, `dscr`, `greenShare`, `coupon`, `spread`, `resilience`, `issuanceGbn`, `taxStatus` |
| `COVENANT_TYPES` | 7 | `description`, `typical`, `strength` |
| `GREEN_STANDARDS` | 6 | `focus`, `coverage`, `certBody`, `greenium` |
| `STRESS_SCENARIOS` | 7 | `revenueChg`, `dscrResult`, `rateIncrease`, `feasible` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `netRevenue` | `annualRevenue - annualOm;` |
| `totalIssuance` | `BOND_SECTORS.reduce((s, b) => s + b.issuanceGbn, 0);` |
| `revenueProjection` | `useMemo(() => Array.from({ length: 10 }, (_, i) => ({ year: 2025 + i, revenue: (annRevenue * Math.pow(1 + (rateIncrease / 100), i)).toFixed(1), om: (annOm * Math.pow(1.03, i)).toFixed(1), ds: annDebtService.toFixed(1), dscr: ((annRevenue * Math.pow(1 + rateIncrease / 100, i) - annOm * Math.pow(1.03, i)) / annDebtService).toFixed(2), })), ` |
| `stressData` | `STRESS_SCENARIOS.map(s => ({` |
| `issuanceData` | `[...BOND_SECTORS].sort((a, b) => b.issuanceGbn - a.issuanceGbn).map(s => ({ sector: s.name.split(' ')[0], issuance: s.issuanceGbn, greenShare: s.greenShare }));` |
| `eScore` | `Math.round(s.greenShare * 0.8 + sr(i * 11) * 20);` |
| `sScore` | `Math.round(70 + sr(i * 17) * 25);` |
| `gScore` | `Math.round(75 + sr(i * 23) * 20);` |
| `overall` | `Math.round((eScore + sScore + gScore) / 3);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BOND_SECTORS`, `COVENANT_TYPES`, `GREEN_STANDARDS`, `STRESS_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Debt Service Coverage Ratio | `Net pledged revenue / annual debt service (principal + interest)` | Municipal financial statements | Investment grade threshold typically 1.25x; strong revenue bonds 1.5x+; climate risk stress requires 1.35x+ floor |
| Climate Risk Revenue Discount | `Physical risk scenario reduction to pledged revenue base over bond term` | Moody's Climate Risk Assessment | Flood, drought, or extreme heat can reduce toll, utility, or TIF revenue; quantified using RCP 4.5/8.5 scenarios |
| Green Certification Premium | `Yield differential for CBI-certified vs uncertified revenue bond` | Bloomberg BVAL | Smaller than GO greenium due to structure complexity; emerging as infrastructure green finance matures |
- **Municipal financial statements and rate studies** → Historical pledged revenue, DSCR, rate covenant compliance → base case model → **Revenue bond credit metrics**
- **Physical climate risk models (RMS, AIR, Moody's)** → Asset-level physical risk exposure by peril and scenario → revenue impact factors → **Climate-adjusted DSCR**
- **Bloomberg BVAL and EMMA disclosure data** → Market pricing and disclosure for comparable revenue bonds → greenium benchmarking → **Pricing premium analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** Debt Service Coverage & Climate Risk Adjustment
**Headline formula:** `DSCR = Net Revenue / Annual Debt Service; Climate-Adjusted Revenue = Base Revenue × (1 - Physical Risk Discount) × (1 + Green Premium)`

Forward-looking revenue bond model incorporating climate physical risk discounts to revenue streams and green certification premium

**Standards:** ['MSRB Revenue Bond Disclosure Guidelines', 'CDFA Climate-Resilient Infrastructure Finance Toolkit', "Moody's Revenue Bond Rating Methodology 2022"]
**Reference documents:** MSRB (2023) Revenue Bond Disclosure and Market Practice; CDFA (2023) Climate-Resilient Infrastructure Finance Toolkit; Moody's (2022) Revenue Bonds Rating Methodology; S&P (2023) Environmental Credit Factors in US Municipal Finance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module (EP-DY2) is closer to guide↔code alignment than most: it genuinely computes **DSCR** and a
revenue projection with a climate-stress overlay. The main gap is that the "climate risk revenue discount"
and ESG scores are seeded/stress-table values, not derived from a physical-risk model.

### 7.1 What the module computes

Debt-service coverage and its 10-year projection:
```js
netRevenue = annualRevenue − annualOm
dscr(year) = (annRevenue·(1+rateIncrease/100)^i − annOm·(1.03)^i) / annDebtService
```
Revenue grows at a user `rateIncrease`; O&M inflates at a fixed 3%; debt service is level. A stress panel
(`stressData` over `STRESS_SCENARIOS`) recomputes DSCR under revenue shocks, and a synthetic ESG block:
```js
eScore = round(greenShare·0.8 + sr(i·11)·20)      // env tied to green-use-of-proceeds share
sScore = round(70 + sr(i·17)·25)                   // social 70–95
gScore = round(75 + sr(i·23)·20)                   // governance 75–95
overall = round((eScore + sScore + gScore)/3)
```

### 7.2 Parameterisation / scoring rubric

| Quantity | Source | Provenance |
|---|---|---|
| `BOND_SECTORS` (7 rows: dscr, greenShare, coupon, spread, resilience, issuanceGbn) | seed schema | curated demo (toll/utility/TIF sectors) |
| O&M inflation | fixed `1.03` p.a. | heuristic (3% inflation) |
| `STRESS_SCENARIOS` (revenueChg, dscrResult, rateIncrease, feasible) | seed schema | scenario demo values |
| `GREEN_STANDARDS` (certBody, greenium) | seed schema | CBI/ICMA labelling reference |
| ESG sub-scores | `sr()` seeded, E linked to greenShare | synthetic demo value |

DSCR reading follows the guide: 1.25× IG threshold, 1.5×+ strong, 1.35× climate-stress floor.

### 7.3 Calculation walkthrough

User sets `rateIncrease` → `revenueProjection` builds year-by-year revenue (geometric), O&M (3% geometric),
level debt service, and DSCR each year. `totalIssuance` sums sector issuance; `issuanceData` sorts sectors
by size with green share. ESG scores are computed per sector for the ratings view.

### 7.4 Worked example

`annRevenue=$100M`, `annOm=$30M`, `annDebtService=$45M`, `rateIncrease=2%`:

| Year i | Revenue | O&M | Net | DSCR |
|---|---|---|---|---|
| 0 | 100.0 | 30.0 | 70.0 | 70.0/45 = **1.56×** |
| 5 | 100·1.02⁵=110.4 | 30·1.03⁵=34.8 | 75.6 | **1.68×** |
| 10 | 100·1.02¹⁰=121.9 | 30·1.03¹⁰=40.3 | 81.6 | **1.81×** |

Because O&M inflates faster in year 0 but revenue growth (2%) < is offset over time, coverage strengthens.
A stress scenario with `revenueChg=−15%` drops year-0 DSCR to (85−30)/45 = **1.22×**, below the 1.25× IG
threshold — exactly the covenant-breach test the module surfaces.

### 7.5 Data provenance & limitations

- Sector/stress/ESG data are **curated demo + `sr()` seeded** — not real municipal financials or BVAL
  greenium. The E-score's link to `greenShare` is the only non-random driver.
- The "climate risk revenue discount" the guide describes (RCP-scenario reduction to pledged revenue) is
  represented by static stress-scenario `revenueChg` rows, not a physical-risk model on the revenue base.
- Level debt service and fixed 3% O&M inflation ignore refinancing, sculpting, and rate-covenant dynamics.

**Framework alignment:** MSRB revenue-bond disclosure practice · CDFA Climate-Resilient Infrastructure
Finance Toolkit · Moody's Revenue Bond Rating Methodology (DSCR + rate-covenant credit factors). DSCR and
the 1.25×/1.35× thresholds mirror rating-agency conventions; ICMA/CBI labelling underlies `GREEN_STANDARDS`.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Price and stress a dedicated-revenue climate bond (toll, utility rate, TIF,
special assessment), producing scenario DSCR, climate-adjusted coverage, and a greenium-net-of-SPO benefit,
to support issuance structuring and investor credit assessment.

**8.2 Conceptual approach.** A **project-finance cash-flow waterfall** (Moody's/S&P revenue-bond method)
with a physical-climate revenue-attenuation overlay derived from asset-level catastrophe modelling
(Moody's RMS climate), plus a greenium estimate from a matched-maturity yield-curve comparison (BIS/OECD
sovereign-greenium approach transposed to munis).

**8.3 Mathematical specification.**
```
Revenue_climate,t = Revenue_base,t · (1 − PhysRiskDiscount_t) · (1 + GreenPremium)
PhysRiskDiscount_t = Σ_peril  P(peril)·RevenueSensitivity_peril   (scenario RCP4.5/8.5)
DSCR_t = (Revenue_climate,t − O&M_t) / DebtService_t
Greenium = YTM_conventional(dur) − YTM_green(dur)     (interpolated curve)
NetGreenBenefit = |Greenium|·Duration·Notional − SPO_cost
```

| Parameter | Source |
|---|---|
| Revenue sensitivity to peril | sector rate-study + RMS/AIR hazard on service area |
| RCP scenario paths | NGFS / IPCC AR6 regional |
| Yield curves | Bloomberg BVAL, MSRB EMMA |
| SPO cost | CBI/ICMA verifier fee schedules |

**8.4 Data requirements.** Pledged-revenue history, rate covenants, service-area geocode, debt schedule;
comparable conventional/green yields (EMMA/BVAL). Free: EMMA disclosure; vendor: BVAL, RMS.

**8.5 Validation & benchmarking.** Backtest DSCR forecast vs realised; reconcile greenium against
BIS/OECD −1 to −5 bp sovereign range and CBI muni evidence; peril-sensitivity stress.

**8.6 Limitations & model risk.** Thin muni greenium data; revenue-elasticity to climate hard to identify;
TIF district growth uncertain. Fallback: rating-implied spread and conservative flat 5% climate discount.

## 9 · Future Evolution

### 9.1 Evolution A — Backend revenue-bond vertical with physical-risk revenue attenuation (analytics ladder: rung 2 → 3)

**What.** EP-DY2 is a tier-B frontend-computed module today: the DSCR math and 10-year
`revenueProjection` are genuine in-page calculations, but the "climate risk revenue
discount" is a static `STRESS_SCENARIOS` table and the ESG sub-scores are `sr()`-seeded.
Evolution A implements the §8 specification (explicitly marked "not yet implemented"):
a backend vertical computing `PhysRiskDiscount_t = Σ_peril P(peril)·RevenueSensitivity_peril`
from the platform's own hazard grids instead of hand-written `revenueChg` rows.

**How.** (1) New route pair (`POST /api/v1/revenue-bond/model`, `/stress`) housing the
waterfall: pledged revenue, user `rateIncrease`, 3%-inflating O&M, level debt service —
porting the existing `revenueProjection` expression verbatim so frontend and backend
agree. (2) Service-area geocode → composite peril scores from the digital-twin
`ref_*_zones` grids → per-peril revenue-sensitivity vector by sector (toll vs utility
vs TIF differ materially). (3) Replace the seeded `eScore/sScore/gScore` block with the
greenium-net-of-SPO calc from §8.3 (`NetGreenBenefit = |Greenium|·Duration·Notional −
SPO_cost`), sourcing greenium bounds from the documented BIS/OECD −1 to −5 bp range as
an honest curated table.

**Prerequisites.** Acknowledge and remove the §7.5-documented `sr()` seeding; flood and
sea-level grids still have thin coverage (48/152 rows), so the peril cascade must report
`resolution_tier` and fall back honestly. **Acceptance:** two bonds with identical
financials but different service-area coordinates produce different climate-adjusted
DSCR; year-0 worked example (1.56×) reproduces exactly.

### 9.2 Evolution B — Issuance-structuring copilot over live DSCR runs (LLM tier 1 → 2)

**What.** A copilot on the EP-DY2 page that explains coverage outcomes in
rating-agency language — "why did the −15% stress breach the 1.25× IG threshold?" —
grounded in the page's computed `revenueProjection` and `stressData`, and (tier 2, once
Evolution A lands) executes structuring what-ifs as tool calls: "sculpt debt service so
climate-stressed DSCR holds 1.35×", "size the issue at the covenant floor".

**How.** Tier 1 needs no new backend: the grounding corpus is this Atlas record (§5
headline formula, §7.4 worked example, the 1.25×/1.35×/1.5× threshold conventions) plus
the current page state serialized into the prompt; answers must cite which stress row
or projection year they reference. Tier 2 derives tool schemas from the Evolution A
OpenAPI operations, with the no-fabrication validator checking every DSCR figure in the
answer against tool outputs in-conversation.

**Prerequisites.** Tier 2 is blocked on Evolution A — today there are no module
endpoints to call, and a copilot must not narrate the seeded ESG scores as if they were
computed. **Acceptance:** copilot refuses greenium questions beyond the documented
BIS/OECD range evidence; every numeric traceable to page state or a tool call; the
covenant-breach explanation cites the exact stress scenario row that produced it.