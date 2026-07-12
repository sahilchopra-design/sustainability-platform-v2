# Sustainability-Linked Instruments Analytics
**Module ID:** `sustainability-linked-instruments` · **Route:** `/sustainability-linked-instruments` · **Tier:** A (backend vertical) · **EP code:** EP-DW6 · **Sprint:** DW

## 1 · Overview
Analytics platform for Sustainability-Linked Loans, Bonds, Derivatives and Insurance covering SPT calibration, KPI universe, margin ratchet modelling, second-party opinion scoring and ICMA/LMA/ISDA framework compliance.

> **Business value:** Sustainability-linked instruments have grown to >$1.5 trillion outstanding (2023) and require rigorous SPT calibration at sector top-quartile or science-based trajectory level; margin ratchets of 25-50bps on SLBs and 10-25bps on SLLs are market standard, with ICMA 2023 Principles tightening SPT ambition requirements to reduce greenwashing risk.

**How an analyst works this module:**
- Select 1-5 KPIs from ICMA-recommended universe (500+ metrics) aligned to issuer material ESG topics
- Calibrate SPT ambition level against sector science-based trajectory and top-quartile peer performance
- Model margin ratchet economics: issuer cost savings on SPT achievement vs penalty on miss
- Obtain second-party opinion and structure external verification protocol (annually, by accredited verifier)

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ISSUER_SECTORS`, `KPI_TEMPLATES`, `KpiCard`, `SLB_MARKET`, `SLL_MARKET`, `Slider`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `KPI_TEMPLATES` | 9 | `sector`, `unit`, `spt`, `ratchet`, `frequency`, `verifier` |
| `SLB_MARKET` | 7 | `volume`, `count`, `avgSize` |
| `SLL_MARKET` | 7 | `volume`, `growth` |
| `ISSUER_SECTORS` | 9 | `slbShare`, `sllShare`, `typicalKpi`, `greenium` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `expectedStepUp` | `ratchetBps * stepUpProb / 100;` |
| `expectedStepDown` | `ratchetBps * (1 - stepUpProb / 100);` |
| `annCoupon` | `notionalM * (baseSpread + expectedStepUp - expectedStepDown) / 10000;` |
| `ratchetSensitivity` | `useMemo(() => Array.from({ length: 11 }, (_, i) => { const prob = i * 10;` |
| `ratchetBySize` | `useMemo(() => [2.5, 5, 7.5, 10, 12.5, 15, 20].map(r => ({` |
| `fiRevenue` | `useMemo(() => { const arrangementFee = notional * 0.0035;` |
| `annualAdmin` | `notional * 0.0008;` |
| `kpiMonitoring` | `numKpis * 25000 / 1e3;` |
| `verificationFee` | `numKpis * 35000 / 1e3;` |
| `totalLifetime` | `arrangementFee + (annualAdmin + kpiMonitoring + verificationFee) * maturity;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/sustainability/dashboard` | `get_dashboard_kpis` | api/v1/routes/sustainability.py |
| GET | `/api/v1/sustainability/certifications` | `list_certifications` | api/v1/routes/sustainability.py |
| GET | `/api/v1/sustainability/certifications/{certification_id}` | `get_certification` | api/v1/routes/sustainability.py |
| POST | `/api/v1/sustainability/certifications` | `create_certification` | api/v1/routes/sustainability.py |
| POST | `/api/v1/sustainability/gresb/assess` | `calculate_gresb_assessment` | api/v1/routes/sustainability.py |
| GET | `/api/v1/sustainability/gresb/benchmarks` | `get_gresb_benchmarks` | api/v1/routes/sustainability.py |
| POST | `/api/v1/sustainability/leed/assess` | `calculate_leed_assessment` | api/v1/routes/sustainability.py |
| GET | `/api/v1/sustainability/leed/thresholds` | `get_leed_thresholds` | api/v1/routes/sustainability.py |
| POST | `/api/v1/sustainability/breeam/assess` | `calculate_breeam_assessment` | api/v1/routes/sustainability.py |
| GET | `/api/v1/sustainability/breeam/weights` | `get_breeam_weights` | api/v1/routes/sustainability.py |
| POST | `/api/v1/sustainability/value-impact` | `calculate_value_impact` | api/v1/routes/sustainability.py |
| GET | `/api/v1/sustainability/benchmarks` | `list_benchmarks` | api/v1/routes/sustainability.py |
| POST | `/api/v1/sustainability/portfolio/analyze` | `analyze_portfolio_sustainability` | api/v1/routes/sustainability.py |
| POST | `/api/v1/sustainability/compare` | `compare_certifications` | api/v1/routes/sustainability.py |
| GET | `/api/v1/sustainability/enums` | `get_enum_values` | api/v1/routes/sustainability.py |

### 2.3 Engine `sustainability_calculator` (services/sustainability_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `GRESBCalculator.calculate_assessment` | request | Calculate GRESB score and value impact. |
| `GRESBCalculator._get_star_rating` | score | Determine GRESB star rating from score. |
| `GRESBCalculator._calculate_percentile` | score, benchmark | Estimate percentile rank based on benchmark data. |
| `GRESBCalculator._calculate_gresb_rent_premium` | rating, region | Calculate rent premium based on GRESB rating. |
| `GRESBCalculator._calculate_gresb_cap_compression` | rating | Calculate cap rate compression in basis points. |
| `GRESBCalculator._score_to_next_star` | current_score, current_rating | Calculate points needed for next star rating. |
| `GRESBCalculator._generate_gresb_recommendations` | scores, total | Generate improvement recommendations. |
| `GRESBCalculator._identify_priority_areas` | scores | Identify priority improvement areas with potential points. |
| `LEEDCalculator.calculate_assessment` | request | Calculate LEED points and value impact. |
| `LEEDCalculator._get_certification_level` | points | Determine LEED certification level from points. |
| `LEEDCalculator._points_to_next_level` | current, level | Calculate points needed for next certification level. |
| `LEEDCalculator._analyze_categories` | scores | Analyze category performance. |
| `LEEDCalculator._calculate_market_percentile` | points | Estimate market percentile based on points. |
| `BREEAMCalculator.calculate_assessment` | request | Calculate BREEAM score and value impact. |
| `BREEAMCalculator._get_rating` | score | Determine BREEAM rating from weighted score. |
| `BREEAMCalculator._points_to_next_level` | current, level | Calculate points to next BREEAM level. |
| `BREEAMCalculator._identify_highest_performing` | scores | Identify top performing categories. |
| `BREEAMCalculator._identify_improvements` | scores, weights | Identify improvement priorities with impact analysis. |
| `BREEAMCalculator._calculate_percentile` | score, regional_avg | Estimate percentile based on score. |
| `ValueImpactCalculator.calculate_value_impact` | request | Calculate value impact of certification. |
| `ValueImpactCalculator._get_cap_rate_compression` | cert_type, level | Get cap rate compression for certification. |
| `ValueImpactCalculator._get_source_studies` | cert_type | Get academic/industry source studies for premiums. |
| `PortfolioSustainabilityCalculator.analyze_portfolio` | request | Analyze portfolio sustainability metrics. |
| `PortfolioSustainabilityCalculator._generate_recommendations` | coverage, score, by_type, uncertified | Generate portfolio improvement recommendations. |
| `SustainabilityEngine.calculate_gresb` | request |  |
| `SustainabilityEngine.calculate_leed` | request |  |
| `SustainabilityEngine.calculate_breeam` | request |  |
| `SustainabilityEngine.calculate_value_impact` | request |  |
| `SustainabilityEngine.analyze_portfolio` | request |  |

**Engine `sustainability_calculator` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `RENT_PREMIUMS` | `{CertificationType.LEED: {LEEDLevel.CERTIFIED: {'low': Decimal('2.0'), 'mid': Decimal('4.0'), 'high': Decimal('6.0')}, LEEDLevel.SILVER: {'low': Decimal('4.0'), 'mid': Decimal('6.0'), 'high': Decimal('8.0')}, LEEDLevel.GOLD: {'low': Decimal('6.0'), 'mid': Decimal('9.0'), 'high': Decimal('12.0')}, LE` |
| `CAP_RATE_COMPRESSION` | `{CertificationType.LEED: {LEEDLevel.CERTIFIED: 15, LEEDLevel.SILVER: 25, LEEDLevel.GOLD: 40, LEEDLevel.PLATINUM: 60}, CertificationType.BREEAM: {BREEAMLevel.PASS: 10, BREEAMLevel.GOOD: 20, BREEAMLevel.VERY_GOOD: 35, BREEAMLevel.EXCELLENT: 50, BREEAMLevel.OUTSTANDING: 70}}` |
| `OPERATING_COST_SAVINGS` | `{CertificationType.LEED: Decimal('8.0'), CertificationType.BREEAM: Decimal('7.0'), CertificationType.ENERGY_STAR: Decimal('10.0'), CertificationType.WELL: Decimal('3.0')}` |
| `GRESB_BENCHMARKS` | `{Region.NORTH_AMERICA: {'peer_avg_score': Decimal('72'), 'top_quartile_threshold': Decimal('82'), 'bottom_quartile_threshold': Decimal('60'), 'num_peers': 450}, Region.EUROPE: {'peer_avg_score': Decimal('76'), 'top_quartile_threshold': Decimal('86'), 'bottom_quartile_threshold': Decimal('65'), 'num_` |
| `GRESB_RATING_THRESHOLDS` | `{GRESBRating.FIVE_STAR: 80, GRESBRating.FOUR_STAR: 60, GRESBRating.THREE_STAR: 40, GRESBRating.TWO_STAR: 20, GRESBRating.ONE_STAR: 0}` |
| `LEED_LEVEL_THRESHOLDS` | `{LEEDLevel.PLATINUM: 80, LEEDLevel.GOLD: 60, LEEDLevel.SILVER: 50, LEEDLevel.CERTIFIED: 40}` |
| `BREEAM_LEVEL_THRESHOLDS` | `{BREEAMLevel.OUTSTANDING: Decimal('85'), BREEAMLevel.EXCELLENT: Decimal('70'), BREEAMLevel.VERY_GOOD: Decimal('55'), BREEAMLevel.GOOD: Decimal('45'), BREEAMLevel.PASS: Decimal('30')}` |
| `REGIONAL_ADJUSTMENTS` | `{Region.NORTH_AMERICA: Decimal('1.0'), Region.EUROPE: Decimal('1.1'), Region.ASIA_PACIFIC: Decimal('0.9'), Region.MIDDLE_EAST: Decimal('0.85'), Region.LATIN_AMERICA: Decimal('0.75'), Region.AFRICA: Decimal('0.7')}` |
| `SECTOR_ADJUSTMENTS` | `{PropertySector.OFFICE: Decimal('1.0'), PropertySector.RETAIL: Decimal('0.85'), PropertySector.INDUSTRIAL: Decimal('0.7'), PropertySector.MULTIFAMILY: Decimal('0.9'), PropertySector.HOTEL: Decimal('0.8'), PropertySector.HEALTHCARE: Decimal('0.95'), PropertySector.DATA_CENTER: Decimal('0.6'), Propert` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`, `mock-sample`

**Database tables:** `JLL` *(shared)*, `datetime` *(shared)*, `decimal` *(shared)*, `fastapi` *(shared)*, `research` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `typing` *(shared)*, `uncertified` *(shared)*, `uuid` *(shared)*
**Frontend seed datasets:** `ISSUER_SECTORS`, `KPI_TEMPLATES`, `SLB_MARKET`, `SLL_MARKET`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| SPT Ambition Score | `Score = f(sector_benchmark_percentile, SBTi_alignment, baseline_year)` | ICMA SPO Framework 2023 | Ambitious SPTs benchmarked at top 15-25% of sector peers; SBTi alignment adds 1 score point; 2030 interim targets required for long-dated instruments. |
| Margin Ratchet | `Rate_adj = ±ratchet_bps if KPI_outcome vs SPT target` | LMA 2023 | SLL margin step-up 5-25bps on SPT miss; SLB coupon step-up 25-50bps; asymmetric ratchets (penalty>reward) gaining market acceptance. |
| Second-Party Opinion Score | `SPO_score = Σ(KPI_relevance + SPT_ambition + reporting + verification)` | Sustainalytics / ISS-ESG / Vigeo | SPO score >75/100 typically required for ESG index inclusion; ISS and Sustainalytics account for 60%+ of global SPO market. |
- **ICMA KPI registry** → → SPT selection → **500+ metrics by sector and ESG pillar**
- **Peer SPT database** → → ambition benchmarking → **Target levels and timelines by sector**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sustainability/benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['items', 'total'], 'n_keys': 2}`

**GET /api/v1/sustainability/breeam/weights** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scheme', 'weights', 'rating_thresholds'], 'n_keys': 3}`

**GET /api/v1/sustainability/certifications** — status `passed`, provenance ['mock-sample'], source tables: —
Output: `{'type': 'object', 'keys': ['items', 'total', 'page', 'page_size'], 'n_keys': 4}`

**GET /api/v1/sustainability/certifications/{certification_id}** — status `passed`, provenance ['mock-sample'], source tables: —
Output: `{'type': 'object', 'keys': ['certification_type', 'property_id', 'property_name', 'property_sector', 'region', 'certification_level', 'score', 'certification_date', 'expiration_date', 'version', 'gross_floor_area_m2', 'year_built', 'current_value', 'noi', 'id', 'value_premium_percent', 'rent_premium`

**GET /api/v1/sustainability/dashboard** — status `passed`, provenance ['mock-sample'], source tables: —
Output: `{'type': 'object', 'keys': ['total_certified_properties', 'total_uncertified_properties', 'certification_coverage_percent', 'by_certification_type', 'by_level', 'total_certified_value', 'avg_value_premium_captured', 'potential_value_uplift', 'avg_gresb_score', 'avg_leed_points', 'avg_breeam_score', `

**GET /api/v1/sustainability/enums** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['certification_types', 'leed_levels', 'breeam_levels', 'gresb_ratings', 'property_sectors', 'regions'], 'n_keys': 6}`

**GET /api/v1/sustainability/gresb/benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['benchmarks', 'total', 'year'], 'n_keys': 3}`

**GET /api/v1/sustainability/leed/thresholds** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['levels', 'max_points', 'categories'], 'n_keys': 3}`

## 5 · Intermediate Transformation Logic
**Methodology:** SPT Calibration Methodology
**Headline formula:** `SPT_ambition = (Baseline_KPI - Target_KPI) / Baseline_KPI × 100%; benchmark against sector leaders and science-based trajectories`

SPTs must be material, ambitious relative to sector benchmarks and aligned to science-based trajectories; ICMA requires external review confirming ambition level; margin ratchet of 5-50bps is market standard.

**Standards:** ['ICMA SLB Principles 2023', 'LMA Sustainability Linked Loan Principles 2023', 'ISDA SL Derivatives Definitions 2022']
**Reference documents:** ICMA Sustainability-Linked Bond Principles June 2023; LMA/APLMA/LSTA Sustainability Linked Loan Principles March 2023; ISDA Sustainability-Linked Derivatives Definitions 2022

**Engine `sustainability_calculator` — extracted transformation lines:**
```python
management_score = scores.management + scores.policy + scores.risk_management
performance_score = scores.stakeholder_engagement + scores.performance_indicators
value_premium = rent_premium * VALUE_PREMIUM_MULTIPLIER
yoy_change = total_score - request.prior_year_score
potential = max_val - current
value_premium = rent_premium * VALUE_PREMIUM_MULTIPLIER
rent_premium = rent_premium * regional_adj * sector_adj
value_premium = value_premium * regional_adj * sector_adj
percentages[cat] = (current / max_val) * 100 if max_val > 0 else 0
weakest = [cat for cat, pct in sorted_cats[-3:] if pct < 70]
remaining = max_val - current
value_premium = rent_premium * VALUE_PREMIUM_MULTIPLIER
rent_premium = rent_premium * regional_adj * sector_adj
value_premium = value_premium * regional_adj * sector_adj
rent_premium = rent_mid * regional_adj * sector_adj
value_premium = rent_premium * VALUE_PREMIUM_MULTIPLIER
annual_rent_increase = rent_premium_psf * request.gross_floor_area_sf
coverage = (len(certified_assets) / total_assets * 100) if total_assets > 0 else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **37** other module(s).
**Shared engines (edits propagate!):** `sustainability_calculator` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `sustainability-linked-finance` | engine:sustainability_calculator, table:JLL, table:decimal, table:research, table:schemas, table:uncertified |
| `sustainability-report-builder` | engine:sustainability_calculator, table:JLL, table:decimal, table:research, table:schemas, table:uncertified |
| `portfolio-stress-test-drilldown` | table:decimal, table:schemas, table:uuid |
| `portfolio-transition-alignment` | table:decimal, table:schemas, table:uuid |
| `portfolio-climate-var` | table:decimal, table:schemas, table:uuid |
| `portfolio-dashboard` | table:decimal, table:schemas, table:uuid |
| `portfolio-climate-pulse` | table:decimal, table:schemas, table:uuid |
| `portfolio-manager` | table:decimal, table:schemas, table:uuid |
| `real-estate-valuation` | table:decimal, table:schemas, table:uuid |
| `portfolio-optimizer` | table:decimal, table:schemas, table:uuid |

## 7 · Methodology Deep Dive

This module implements a genuine **discounted bond-pricing engine** for SLL/SLB ratchet economics —
notably stronger than the sibling `sustainability-linked-finance` module (which computes undiscounted
lifetime cashflow sums). No guide↔code mismatch blockquote is triggered: the guide's formula set
(`SPT Ambition`, `Ratchet NPV`, `Compliance Score`) is broadly represented, with the important nuance
that here it is expressed as a **present-value bond price**, not a standalone NPV-of-ratchet
calculation.

### 7.1 What the module computes

A 10-tab tool (`TABS`) spanning instrument overview, an interactive SLL pricing engine, a KPI
framework library (8 template KPIs across GHG intensity, renewable share, water intensity, gender
diversity, safety, Scope 3, biodiversity, EV fleet), SPT calibration guidance, ratchet-mechanics
sensitivity, real historical SLB/SLL market-volume series (2019–2024), sector analysis, a
greenwashing-risk due-diligence checklist, documentation requirements, and a financial-institution
(FI) fee-revenue model.

### 7.2 Core pricing formula

```js
function calcSllPricing({ notionalM, baseSpread, ratchetBps, stepUpProb, maturityYr, wacc }) {
  const w = wacc / 100;
  expectedStepUp   = ratchetBps × stepUpProb / 100
  expectedStepDown = ratchetBps × (1 − stepUpProb / 100)
  annCoupon = notionalM × (baseSpread + expectedStepUp − expectedStepDown) / 10000
  pv = Σ_{y=1..maturityYr} annCoupon / (1+w)^y  +  notionalM / (1+w)^maturityYr
  return { expectedStepUp, expectedStepDown, annCoupon, pv, greeniumBps: expectedStepDown }
}
```

This is a **standard discounted-bond present-value formula**: the sum of discounted coupon
cashflows plus the discounted terminal principal repayment, exactly the structure used to price a
plain-vanilla fixed-rate bond, with the coupon itself made *probability-weighted* by blending
`expectedStepUp` and `expectedStepDown` via `stepUpProb` (the modelled probability the SPT is
missed). This directly answers the guide's `Ratchet NPV = Σ[(P(Miss)×Step-Up bps×Notional)/(1+r)^t]`
intent — probability-weighting and discounting are both present, unlike the sibling
`sustainability-linked-finance` tool.

### 7.3 Parameterisation

| Parameter | Range/Default | Provenance |
|---|---|---|
| `wacc` (discount rate) | 5.5% default, slider | User input — should equal issuer's own WACC/cost of debt in production use |
| `baseSpread` | 180 bps default | User input, representing the non-ESG credit spread |
| `ratchetBps` | 7.5 bps default, 2.5–20 bps sensitivity range | User input; sensitivity table (`ratchetBySize`) spans typical market ratchet sizes |
| `stepUpProb` | 0–100%, 30% default | User-set SPT-miss probability — a direct input, not derived from a KPI-trajectory model (contrast with `sustainability-linked-finance`'s Monte Carlo-derived `sptProb`) |
| KPI ratchet sizes (8 templates) | 4.0–8.0 bps | Illustrative, roughly ordered by KPI materiality (Scope 3: 8.0 bps highest; safety LTIR: 4.0 bps lowest) |
| FI arrangement fee | 0.35% of notional | Synthetic demo value, in line with typical loan arrangement fee ranges (25–50bps) |
| FI KPI monitoring / verification fees | $25K / $35K per KPI | Synthetic demo values |

### 7.4 Calculation walkthrough

1. **Pricing engine** (Tab 2) — live recompute of `pv`, `annCoupon`, `greeniumBps` as the user moves
   notional/spread/ratchet/stepUpProb/maturity/WACC sliders.
2. **Ratchet sensitivity** (`ratchetSensitivity`) — recomputes the full pricing at `stepUpProb =
   0,10,...,100` holding other inputs fixed, producing an 11-point greenium/coupon curve — a genuine
   one-dimensional sensitivity sweep.
3. **Ratchet-by-size** (`ratchetBySize`) — for 7 illustrative ratchet sizes (2.5–20 bps), splits into
   greenium (`r×(1−stepUpProb/100)`) and step-up (`r×stepUpProb/100`) components at the *current*
   `stepUpProb` — a decomposition chart, not a re-optimisation.
4. **FI revenue model** (`fiRevenue`) — sums arrangement fee (one-off), plus annual admin + KPI
   monitoring + verification fees compounded over `maturity` years (undiscounted lifetime total,
   unlike the coupon PV calculation — an internal inconsistency: bond cashflows are discounted but FI
   fee revenue is not).
5. **Static reference tabs** — KPI Framework, SPT Calibration, Market Intelligence, Sector Analysis,
   Greenwashing Risk, and Documentation tabs are hand-authored tables (real historical SLB/SLL market
   volumes 2019–2024 sourced in style from Climate Bonds Initiative/BNEF market reports, though not
   live-linked) — descriptive content, not computed from the pricing engine's live state.

### 7.5 Worked example

`notionalM=500`, `baseSpread=180`, `ratchetBps=7.5`, `stepUpProb=30`, `maturityYr=5`, `wacc=5.5%`:

| Step | Computation | Result |
|---|---|---|
| expectedStepUp | 7.5 × 30/100 | 2.25 bps |
| expectedStepDown (greenium) | 7.5 × (1−0.30) | 5.25 bps |
| Coupon spread | 180 + 2.25 − 5.25 | 177.0 bps |
| annCoupon | 500 × 177.0/10000 | $8.85M/yr |
| PV of coupons (5yr @5.5%) | Σ 8.85/(1.055)^y, y=1..5 | ≈ $37.75M |
| PV of principal | 500/(1.055)^5 | ≈ $383.97M |
| **Bond PV** | 37.75+383.97 | **≈ $421.7M** |

The `greeniumBps=5.25` output means the issuer's **net** effective spread (177.0 bps) sits *below*
the base spread (180 bps) because at a 30% miss-probability, the probability-weighted expected
step-down benefit (5.25 bps) outweighs the expected step-up cost (2.25 bps) — correctly capturing
that a *low* miss-probability makes an SLL cheaper for the issuer on an expected-value basis, even
though ratchets are nominally symmetric in bps size.

### 7.6 Data provenance & limitations

- `stepUpProb` is a **direct user slider input**, not derived from any KPI trajectory or historical
  base-rate — unlike `sustainability-linked-finance`'s Monte Carlo-simulated `sptProb`. A production
  tool should link the two: feed a modelled miss-probability into `calcSllPricing` rather than
  requiring the user to guess it.
- FI revenue totals are undiscounted while bond cashflows are discounted — an internal inconsistency
  that understates the time-value-adjusted cost of the fee stream relative to the coupon PV on the
  same page.
- Market-volume series (`SLB_MARKET`, `SLL_MARKET`) and sector greenium benchmarks (`ISSUER_SECTORS`)
  are static reference tables styled on real CBI/BNEF market reporting but not live-sourced; treat as
  illustrative historical context, not a live data feed.
- KPI ratchet-size templates (4.0–8.0 bps) are illustrative orderings, not calibrated against a
  materiality-weighted methodology.

**Framework alignment:** LMA/APLMA/LSTA SLL Principles and ICMA SLB Principles are represented via
the Documentation and SPT Calibration tabs' checklist content (SPO/second-party-opinion requirement,
annual KPI reporting, independent verification). SBTi Sectoral Decarbonisation Approach, IEA NZE, RE100,
WRI Aqueduct, TNFD LEAP/GBF are named as calibration bases per KPI type in the SPT Calibration table —
correct real-world benchmark attribution, presented as guidance text rather than wired into the pricing
engine's live calculation.

## 9 · Future Evolution

### 9.1 Evolution A — Model-derived SPT-miss probability with calibrated ratchet pricing (analytics ladder: rung 2 → 3)

**What.** The page's `calcSllPricing` engine is genuinely scenario-capable (11-point `ratchetSensitivity` sweep, 7-size `ratchetBySize` decomposition) but its single most important input — `stepUpProb` — is a raw user slider, not a modelled quantity (§7.6). Replace the guessed miss-probability with a KPI-trajectory-derived one, and calibrate it against observed SLB step-up events, moving the module from what-if to benchmarked.

**How.** (1) Reuse the Monte Carlo `sptProb` machinery the sibling `sustainability-linked-finance` module already has (both share `sustainability_calculator` per §6): simulate the selected KPI's path from baseline to target date using sector decarbonisation rates from the 8 `KPI_TEMPLATES`, output P(miss) with a confidence band. (2) Feed that probability into `calcSllPricing` as the default, keeping the slider as an override with a "modelled vs assumed" badge. (3) Calibrate against the public record of SLB coupon step-up events (Enel, PKN Orlen et al.) as a small curated table; report calibration error. (4) Fix the documented internal inconsistency: discount the FI fee stream (`fiRevenue`) at the same `wacc` used for coupon PV.

**Prerequisites.** A backend home for the pricing calc — today the whole engine lives in the React page; the mapped `sustainability.py` endpoints are real-estate certification calculators, not SLI pricing. **Acceptance:** with slider untouched, changing KPI/sector changes the priced greenium; a `bench_quant` pin reproduces the §7.5 worked example ($421.7M PV at 30%/5.5%) exactly.

### 9.2 Evolution B — SLL structuring analyst with tool-called term-sheet what-ifs (LLM tier 2)

**What.** A copilot on the 10-tab page that answers "why is the greenium 5.25 bps?" by citing the live `calcSllPricing` decomposition (expectedStepUp/StepDown, coupon spread vs base spread), and executes structuring what-ifs — "price this at 20 bps ratchet, 7-year tenor", "which of the 8 template KPIs gives the largest expected step-down at my miss probability?" — as tool calls, never by inventing numbers.

**How.** First shippable slice is tier 1: explanation-only, grounded in this Atlas page (§7.2 formula, §7.5 worked example, §7.4 tab walkthrough as corpus) plus the page's computed state — no backend needed. Tier 2 requires Evolution A's prerequisite: a Pydantic-typed `POST /api/v1/sli/price` wrapping `calcSllPricing` server-side, exposed via the OpenAPI-derived tool schema per the Tier-2 pattern. The ICMA/LMA checklist tabs (greenwashing due-diligence, documentation requirements) become a retrieval corpus so the copilot can answer "does this structure meet ICMA 2023 SPT ambition requirements?" with citations to the checklist rows, flagging that SPO scoring is guidance text, not computed.

**Prerequisites.** The endpoint-map mismatch must be corrected in the Atlas registry — tool schemas auto-generated from the currently-mapped certification endpoints would give the copilot the wrong tools entirely. **Acceptance:** every numeric in an answer traces to a tool response or a named static table (`SLB_MARKET`, `ISSUER_SECTORS`); the copilot refuses to output an SPO score, which this module does not compute.