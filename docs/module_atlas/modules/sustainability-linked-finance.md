# Sustainability-Linked Finance Analytics
**Module ID:** `sustainability-linked-finance` · **Route:** `/sustainability-linked-finance` · **Tier:** A (backend vertical) · **EP code:** EP-DW3 · **Sprint:** DW

## 1 · Overview
Sustainability-Linked Loan (SLL) and Bond (SLB) analytics covering SPT calibration methodology, KPI universe (carbon intensity, renewable energy %, water use, LTIFR), margin ratchet modelling, and LMA/ICMA Principles compliance.

> **Business value:** Provides rigorous SLL/SLB analytics integrating ICMA KPI materiality scoring, SPT ambition calibration against sector pathways, and margin ratchet NPV modelling to prevent greenwashing and optimise SLF structures.

**How an analyst works this module:**
- Select material KPIs from ICMA KPI Registry matched to issuer sector and sustainability strategy
- Calibrate SPTs against historical performance trajectory, sector SBTi pathway, and peer benchmarks
- Model margin ratchet NPV under base, optimistic, and stress SPT achievement scenarios
- Score LMA/ICMA Principles compliance across five components: KPI selection, SPT calibration, loan characteristics, reporting, verification

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEFAULTS`, `INSTRUMENTS`, `RATINGS`, `SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `INSTRUMENTS` | `['Green Bond', 'Sustainability-Linked Bond', 'Sustainability-Linked Loan', 'Transition Bond', 'Blue Bond'];` |
| `span` | `k.spt - k.baseline;` |
| `moved` | `k.achieved - k.baseline;` |
| `weighted` | `useMemo(() => { const totW = s.kpis.reduce((x, k) => x + k.weight, 0) \|\| 1;` |
| `annualIntBase` | `(s.notional * s.coupon) / 100;` |
| `greenium` | `(s.notional * s.greeniumBps / 10000) * s.tenor;` |
| `stepUpPenalty` | `onTrack ? 0 : (s.notional * s.stepUpBps / 10000) * Math.max(0, s.tenor - 2);` |
| `stepDownBenefit` | `s.twoWay && weighted >= 85 ? (s.notional * s.stepDownBps / 10000) * Math.max(0, s.tenor - 2) : 0;` |
| `netBenefit` | `greenium - stepUpPenalty + stepDownBenefit;` |
| `trancheRows` | `useMemo(() => s.tranches.map(tr => {` |
| `baseInt` | `(tr.notional * tr.couponPct) / 100;` |
| `trGreenium` | `(tr.notional * tr.greeniumBps / 10000) * tr.tenor;` |
| `trStepUp` | `onTrack ? 0 : (tr.notional * tr.stepUpBps / 10000) * Math.max(0, tr.tenor - 2);` |
| `trancheTotal` | `trancheRows.reduce((x, r) => x + r.trNet, 0);` |
| `slbpScore` | `useMemo(() => { return SLBP_COMPONENTS.reduce((x, c) => x + (s.slbp[c.id] \|\| 0) * c.weight / 100, 0);` |
| `totW` | `s.kpis.reduce((x, k) => x + k.weight, 0) \|\| 1;` |
| `forecast` | `s.kpis.reduce((x, k) => {` |
| `yearsToSpt` | `Math.max(1, k.year - new Date().getFullYear());` |
| `currentMoved` | `k.achieved - k.baseline;` |
| `projected` | `currentMoved + (span * (k.trend \|\| 0.08) * yearsToSpt * trendMult) + volShock * span * 0.1;` |
| `peerDeals` | `useMemo(() => SLF_PEER_DEALS.filter(d => d.sector === s.sector \|\| d.sector.includes(s.sector.split(' ')[0])), [s.sector]); const peerAvgGreenium = peerDeals.length ? peerDeals.reduce((x, d) => x + d.greeniumBps, 0) / peerDeals.length : null;` |
| `peerAvgStepUp` | `peerDeals.length ? peerDeals.reduce((x, d) => x + d.stepUp, 0) / peerDeals.length : null;` |
| `updKpi` | `(i, k, v) => sc.update({ kpis: s.kpis.map((x, j) => j === i ? { ...x, [k]: v } : x) });` |
| `updTr` | `(i, k, v) => sc.update({ tranches: s.tranches.map((x, j) => j === i ? { ...x, [k]: v } : x) });` |
| `sbtiChecks` | `s.kpis.map(k => sbtiAmbitionCheck(s.sector, k.baseline, k.spt, k.year));` |

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
**Frontend seed datasets:** `INSTRUMENTS`, `RATINGS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| SPT Ambition Score | `Assessed against sector decarbonisation pathway pace and historical peer performance` | ICMA/LMA SPT calibration guidance | Scores below 60 raise greenwashing concerns; ICMA requires SPTs to represent material improvement, not business-as-usual |
| Ratchet NPV (Borrower) | `Σ[P(Hit) × Step-Down bps × Notional / (1+r)^t] - Σ[P(Miss) × Step-Up bps × Notional / (1+r)^t]` | Monte Carlo SPT achievement probability model | Positive NPV indicates borrower expects to achieve SPTs; symmetric ratchets (±5 bps) typical per LMA market convention |
| KPI Materiality Score | `Relevance of selected KPIs to core business model and sustainability strategy` | LMA ICMA KPI materiality assessment | Material KPIs specific to issuer sector; carbon intensity most common (35%); renewable energy share (28%); water use (15%) |
- **ICMA KPI Registry** → Universe of sector-appropriate KPIs with calibration guidance → KPI selection and materiality scoring → **KPI shortlist and materiality score**
- **Company historical ESG data (Bloomberg, Sustainalytics)** → Historical KPI performance trends → SPT baseline and ambition calibration → **SPT ambition score**
- **LMA/ICMA market survey data** → Market convention for ratchet size, KPI mix, verification agent standards → compliance benchmarking → **Principles compliance score and peer comparison**

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
**Methodology:** SPT Calibration & Margin Ratchet Modelling
**Headline formula:** `SPT Ambition = (Base Year KPI - Target KPI) / Base Year KPI × 100; Ratchet NPV = Σ[(P(Miss) × Step-Up bps × Notional) / (1+r)^t]; Compliance Score = SPTs meeting LMA/ICMA calibration criteria / total SPTs`

SPT ambition scoring and margin ratchet NPV calculation combining KPI materiality, calibration ambition, and probability-weighted coupon adjustment

**Standards:** ['LMA/APLMA/LSTA Sustainability-Linked Loan Principles 2023', 'ICMA Sustainability-Linked Bond Principles 2023', 'ICMA KPI Registry for Sustainability-Linked Finance']
**Reference documents:** LMA/APLMA/LSTA (2023) Sustainability-Linked Loan Principles — Updated Guidance; ICMA (2023) Sustainability-Linked Bond Principles and Appendix 1 — KPI Registry; LSEG/Refinitiv (2023) Sustainability-Linked Finance Market Report; ESMA (2024) Guidelines on SLB Naming and Disclosure

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
| `sustainability-linked-instruments` | engine:sustainability_calculator, table:JLL, table:decimal, table:research, table:schemas, table:uncertified |
| `sustainability-report-builder` | engine:sustainability_calculator, table:JLL, table:decimal, table:research, table:schemas, table:uncertified |
| `portfolio-stress-test-drilldown` | table:decimal, table:schemas, table:uuid |
| `portfolio-transition-alignment` | table:decimal, table:schemas, table:uuid |
| `portfolio-climate-var` | table:decimal, table:schemas, table:uuid |
| `portfolio-dashboard` | table:decimal, table:schemas, table:uuid |
| `portfolio-climate-pulse` | table:decimal, table:schemas, table:uuid |
| `portfolio-manager` | table:decimal, table:schemas, table:uuid |
| `real-estate-valuation` | table:decimal, table:schemas, table:uuid |
| `portfolio-optimizer` | table:decimal, table:schemas, table:uuid |
**Shared UI wrappers:** `AdvisoryReference`, `AdvisoryToolkit`

## 7 · Methodology Deep Dive

This module is one of the platform's **AdvisoryToolkit-family tools** — it does not use the
`sustainability_calculator.py` backend engine listed in its route file (that engine implements
LEED/BREEAM/GRESB certification scoring, unrelated to sustainability-linked debt); all SLB/SLL
economics are computed client-side against curated reference tables in
`frontend/src/features/_shared/AdvisoryReference.js`. Unlike most modules in this batch, the guide's
formulas are **substantially implemented** — SPT calibration against a real SBTi sectoral
decarbonisation pathway, a two-way coupon ratchet, an SLBP 5-component scorecard, and a genuine
Monte Carlo achievement-probability simulation. The one material gap: the guide's Ratchet-NPV formula
specifies discounting (`/(1+r)^t`), but the code's greenium/step-up/step-down cashflows are
**undiscounted** notional sums — flagged in §7.3.

### 7.1 What the module computes

For a user-configured issuer/instrument (Green Bond, SLB, SLL, Transition Bond, Blue Bond), the tool
computes: (1) weighted KPI progress toward Sustainability Performance Targets (SPTs), (2) two-way
coupon economics (greenium, step-up penalty, step-down benefit), (3) multi-tranche aggregation,
(4) an ICMA SLBP 5-component compliance scorecard, (5) a Monte Carlo probability of SPT achievement,
(6) a tornado sensitivity of net financing benefit, and (7) peer-deal benchmarking against 8 real
disclosed SLB/SLL transactions.

### 7.2 Core formulas

```js
progressPct(k) = clip(0,100, (achieved − baseline) / (spt − baseline) × 100)     // per KPI
weighted        = Σ progressPct(k) × weight_k / Σ weight_k                        // portfolio SPT progress
onTrack         = weighted >= 70

annualIntBase   = notional × coupon / 100
greenium        = notional × greeniumBps/10000 × tenor                            // lifetime, undiscounted
stepUpPenalty   = onTrack ? 0 : notional × stepUpBps/10000 × max(0, tenor−2)      // 2yr grace period
stepDownBenefit = (twoWay && weighted>=85) ? notional × stepDownBps/10000 × max(0,tenor−2) : 0
netBenefit      = greenium − stepUpPenalty + stepDownBenefit

slbpScore = Σ_components (userScore_c × weight_c / 100)                           // 5 × 20% weights
```

`progressPct` is clipped to [0,100] and handles the zero-span edge case (`spt===baseline` → 100%),
correctly avoiding a NaN/Infinity when a KPI has no required movement. The 2-year grace period
(`tenor−2`) before ratchets bite reflects standard SLB/SLL market convention (LMA guidance: the first
observation date is typically 2–3 years post-issuance, not year 1).

### 7.3 SPT ambition & the Ratchet-NPV gap

`sbtiAmbitionCheck(sector, baseline, spt, year)` (in `AdvisoryReference.js`) computes:

```js
requiredReduction = 1 − (1 − sectorSDArate)^(year−2024)      // compounded SBTi Sectoral Decarbonisation Approach rate
actualReduction   = (baseline − spt) / max(1, baseline)
aligned           = actualReduction >= requiredReduction
```

Sector SDA rates are hard-coded per sector: Utilities-Power 4.2%, Cement 2.5%, Steel 3.5%, Banks
4.2%, Real Estate 4.8%, Oil & Gas 2.9% — annual linear-equivalent reduction rates consistent with
SBTi's published Sectoral Decarbonisation Approach pathways for a 1.5°C trajectory. This **is** a
genuine SPT-ambition check against a named, sector-specific external benchmark — a materially
stronger implementation than most modules in this deep-dive batch.

**Where the code diverges from the guide:** the guide's `Ratchet NPV =
Σ[(P(Miss)×Step-Up bps×Notional)/(1+r)^t]` implies (a) a probability-weighted expectation and (b) time
value of money. The code's `greenium`/`stepUpPenalty`/`stepDownBenefit` are **deterministic,
undiscounted** point estimates — `notional × bps/10000 × tenor`, not a discounted sum over
annual observation dates, and not probability-weighted (the binary `onTrack` flag substitutes for
`P(Miss)`). The Monte Carlo module (§7.4) *does* produce a genuine achievement probability
(`sptProb`), but that probability is never fed back into `netBenefit` — the two live as parallel,
unreconciled outputs on the same page.

### 7.4 Monte Carlo SPT achievement probability

```js
projected = currentMoved + span×trend×yearsToSpt×trendMult + volShock×span×0.1
p         = clip(0,100, projected/span × 100)
forecast  = Σ p×weight / Σweight                    // per-simulation weighted progress
sptProb   = share of simulations where forecast >= 100
```

`trendMult ~ Triangular(0.75, 1.00, 1.20)` and `volShock ~ Triangular(−1.0, 0, 1.0)` — both triangular
distributions (min/mode/max), a standard low-data-requirement Monte Carlo input shape. Each KPI's
own historic `trend` rate (default 8%/yr, user-editable) drives its own projected trajectory,
compounded over `yearsToSpt = SPT_year − current_year`. This is a genuine simulation (`s.mcRuns`,
default 2,000 draws) with a re-sample button — not a decorative "Monte Carlo" label as seen in the
sibling `supply-chain-resilience` module's EAL chart.

### 7.5 Worked example

Sector "Utilities — Power" loaded via `loadSector`: KPI "Scope 1+2 emissions intensity" baseline=620,
SPT=310 (kgCO₂e/MWh), achieved=465, weight=40. `progressPct = (465−620)/(310−620)×100 =
(−155)/(−310)×100 = 50.0%`. With the other two KPIs (Renewable share: baseline 12→SPT 65,
achieved 28 → `(28−12)/(65−12)×100=30.2%`; Water: baseline 100→SPT 70, achieved 88 →
`(88−100)/(70−100)×100=40.0%`) at weights 35 and 25: `weighted = (50.0×40 + 30.2×35 + 40.0×25)/100 =
(2000+1057+1000)/100 = 40.57%` → below the 70% on-track threshold, so `onTrack=false` and the full
`stepUpPenalty` applies. At notional=₹5,000 Cr, `stepUpBps=25`, `tenor=7`:
`stepUpPenalty = 5000×25/10000×(7−2) = 12.5×5 = ₹62.5 Cr`. `greenium = 5000×5/10000×7 = 2.5×7 = ₹17.5
Cr`. `netBenefit = 17.5 − 62.5 + 0 = −₹45.0 Cr` — the tool correctly shows this structuring as
**net negative** for the issuer given current off-track progress, exactly the economic signal an SLB
ratchet is designed to produce.

SBTi check for the same KPI at `year=2030`: `requiredReduction = 1−(1−0.042)^(2030−2024) =
1−0.958^6 = 1−0.7649 = 23.5%`; `actualReduction = (620−310)/620 = 50.0%` → `50.0% ≥ 23.5%` →
**aligned**. This KPI clears the SBTi ambition bar even though current *progress* toward it is
lagging (40.6% weighted) — ambition and delivery are correctly modelled as separate dimensions.

### 7.6 Companion analytics

- **Multi-tranche structure** — independent notional/tenor/coupon/greenium/step-up per tranche,
  aggregated via the same undiscounted formula; `trancheTotal` sums net benefit across tranches.
- **Tornado sensitivity** — ±20% one-at-a-time perturbation of notional, coupon, greenium, step-up,
  tenor against `netBenefit` (excluding coupon from the calculation itself, i.e. testing but not
  using it — coupon is included in the input set but `outputFn` never references `v.coupon`, so its
  tornado bar will show zero range).
- **Peer deal comps** — 8 real disclosed transactions (ENEL, Tesco, H&M, JBS, UltraTech, Vedanta,
  JSW Steel, HDFC Bank) with actual reported greenium/step-up bps, filtered by sector match.

### 7.7 Data provenance & limitations

- SBTi SDA rates, ICMA KPI library baselines/SPTs, and CBI greenium-by-rating tables are the tool's
  own curated reference data (`AdvisoryReference.js`) — realistic and internally consistent, but not
  live-linked to Bloomberg/Refinitiv or SBTi's API; treat as **illustrative benchmarks**, not
  verified real-time market data.
- The Ratchet-NPV gap (§7.3): reported cashflow figures are undiscounted lifetime totals, not
  time-value-adjusted NPVs; a production credit/treasury use case should discount each annual
  ratchet observation at the issuer's cost of debt.
- Tornado's `coupon` input has no effect on the tested `netBenefit` output function — a latent no-op
  in the sensitivity display.
- Default KPI `trend` values (8–10%/yr) are illustrative starting points, editable per KPI but not
  derived from the company's actual historic KPI trajectory.

**Framework alignment:** ICMA Sustainability-Linked Bond Principles 2024 — the 5-component SLBP
scorecard (KPI Selection, SPT Calibration, Bond Characteristics, Reporting, Verification, each 20%
weight) matches ICMA's own structuring guidance components. SBTi Sectoral Decarbonisation Approach —
correctly implemented as compounded-rate required reduction, sector-specific. LMA/APLMA/LSTA
Sustainability-Linked Loan Principles — reflected in the two-way ratchet and grace-period design, not
in a named calculation. Climate Bonds Initiative greenium data — used directly as the default
greenium input by sector/rating.

## 9 · Future Evolution

### 9.1 Evolution A — Discount the ratchet cashflows and history-calibrate SPTs (analytics ladder: rung 2 → 3)

**What.** This is one of the batch's stronger AdvisoryToolkit modules: the guide's formulas are substantially implemented — SPT calibration against a real SBTi sectoral decarbonisation pathway, a two-way coupon ratchet, an ICMA SLBP 5-component scorecard, a genuine Monte Carlo achievement probability, tornado sensitivity, and 8 real disclosed peer deals (ENEL, Tesco, H&M, JBS, UltraTech, Vedanta, JSW Steel, HDFC Bank) with actual reported greenium/step-up bps. Its curated `AdvisoryReference.js` (SBTi SDA rates, ICMA KPI baselines, CBI greenium tables) is realistic and internally consistent. Three §7 gaps hold it at rung 2: the guide's Ratchet-NPV specifies discounting (`/(1+r)^t`) but the code uses **undiscounted** lifetime notional sums; the tornado's `coupon` input is a no-op (never referenced by the output function); and default KPI trends (8–10%/yr) aren't derived from the company's actual history.

**How.** (1) Discount the ratchet cashflows: each annual greenium/step-up/step-down observation at the issuer's cost of debt, delivering the true NPV the guide's formula specifies — the single highest-value fix for treasury use. (2) Fix the tornado no-op: either wire `coupon` into `netBenefit` or remove it from the tested input set. (3) History-calibrate SPTs: derive the KPI trend from the issuer's actual historic trajectory (the sibling `slb-structurer` has a `calibrate-history` ln-OLS approach to share) rather than illustrative 8–10% defaults. (4) Optionally link the curated SBTi/CBI reference tables to live sources, or stamp them as illustrative benchmarks with vintages. (5) Bench-pin the ratchet-NPV.

**Prerequisites.** A cost-of-debt input per issuer; issuer KPI history for calibration. **Acceptance:** ratchet cashflows are discounted to NPV; the tornado's coupon bar shows real range or is removed; SPT calibration reflects the issuer's actual trajectory.

### 9.2 Evolution B — SLL/SLB structuring analyst (LLM tier 1)

**What.** A copilot for the sustainable-finance structurer: "calibrate a carbon-intensity SPT for this steel issuer against SBTi", "what's the net financing benefit under the stress achievement scenario?", "how does this structure score against the ICMA SLBP 5 components?", "show me comparable disclosed deals" — answered from the module's genuine SPT calibration, ratchet economics, 5-component scorecard, and the 8 real peer deals.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sustainability-linked-finance/ask`, corpus = this Atlas record (§7.2 core formulas, the SLBP scorecard, the curated SBTi/CBI reference tables) plus live tool state. SPT-ambition and ratchet answers narrate the computed figures; the 5-component compliance narrative cites each SLBP component; peer-comp answers reference the real disclosed transactions with their actual bps. The copilot flags the undiscounted caveat pre-Evolution-A.

**Prerequisites.** Evolution A's discounting so financing-benefit answers are NPV-correct rather than undiscounted totals. Shippable as explanation-only against current outputs with the undiscounted caveat stated. **Acceptance:** every SPT/greenium/step-up figure traces to the module's computation; the SLBP score cites its 5 components; peer-deal figures match the real disclosed transactions, not invented terms.