# Transition Finance Screener
**Module ID:** `transition-finance-screener` · **Route:** `/transition-finance-screener` · **Tier:** A (backend vertical) · **EP code:** EP-CC3 · **Sprint:** CC

## 1 · Overview
8 green/sustainability/SLB instruments screened against ICMA Principles, EU Taxonomy alignment, greenium analysis, DNSH assessment across 6 environmental objectives, and SLB KPI tracking with step-up mechanism.

**How an analyst works this module:**
- Instrument Universe shows 8 bonds with type, issuer, greenium, and screening result
- Taxonomy Alignment shows per-instrument EU Taxonomy aligned % and eligible %
- Greenium Analysis compares green vs conventional yield spread
- KPI Tracking monitors SLB sustainability targets with step-up trigger
- Portfolio Screening classifies instruments as Pass/Watch/Fail

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `INSTRUMENTS`, `SCREENING_COLORS`, `TABS`, `TYPE_COLORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `INSTRUMENTS` | 31 | `name`, `issuer`, `type`, `isin`, `issue`, `maturity`, `face_value`, `coupon`, `greenium`, `label`, `review`, `taxonomy_aligned`, `taxonomy_eligible`, `paris_aligned`, `itr`, `screening`, `dnsh`, `climate`, `water`, `bio` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPE_COLORS` | `{ 'Green Bond': T.green, 'Sustainability-Linked Bond': T.blue, 'Transition Bond': T.amber, 'Blue Bond': T.teal, 'Sustainability Bond': T.sage };` |
| `totalFaceValue` | `INSTRUMENTS.reduce((s, i) => s + i.face_value, 0);` |
| `avgTaxonomy` | `Math.round(INSTRUMENTS.reduce((s, i) => s + i.taxonomy_aligned, 0) / INSTRUMENTS.length);` |
| `avgGreenium` | `(INSTRUMENTS.reduce((s, i) => s + i.greenium, 0) / INSTRUMENTS.length).toFixed(1);` |
| `pieData` | `Object.entries(TYPE_COLORS).map(([type, color]) => ({` |
| `val` | `INSTRUMENTS.filter(i => i.screening === result).reduce((s, i) => s + i.face_value, 0);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/transition-finance/assess` | `assess_credibility` | api/v1/routes/transition_finance.py |
| POST | `/api/v1/transition-finance/portfolio-temperature` | `portfolio_temperature` | api/v1/routes/transition_finance.py |
| POST | `/api/v1/transition-finance/instrument-screen` | `instrument_screen` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/tpt-elements` | `ref_tpt_elements` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/sbti-criteria` | `ref_sbti_criteria` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/race-to-zero` | `ref_race_to_zero` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/sector-pathways` | `ref_sector_pathways` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/gfanz-expectations` | `ref_gfanz_expectations` | api/v1/routes/transition_finance.py |

### 2.3 Engine `transition_finance_engine` (services/transition_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_score_tpt_element` | element_id, element_inputs | Score a single TPT element 0-1 from user-provided sub-element scores or qualitative tier. element_inputs: dict with optional keys 'score' (float 0-1) or 'sub_scores' (list of floats). |
| `_get_quality_tier` | score |  |
| `_calculate_waci` | holdings | WACI = Σ(weight_i × tCO2e_i / revenue_i_M) holdings: list of {weight: float, tco2e: float, revenue_usd_mn: float} |
| `_implied_temperature` | waci | Estimate implied portfolio temperature from WACI using linear interpolation between benchmark anchors: WACI 100 → 1.5°C WACI 300 → 2.5°C WACI 600 → 3.5°C Simplified proxy; full TCFD/SBTi approach requires sector-specific SDA. |
| `_detect_red_flags` | tpt_score, sbti_score, rtz_score, tpt_inputs, sbti_inputs | Identify greenwash / credibility red flags. |
| `assess_transition_finance_credibility` | entity_name, sector, tpt_inputs, sbti_inputs, rtz_inputs, portfolio_inputs, tnfd_inputs | Full transition finance credibility assessment. Scores: - TPT 6-element composite (weighted) - SBTi validation criteria - Race to Zero 5 Cs - Portfolio temperature alignment (WACI-based) - TNFD LEAP nature integration - Overall credibility composite + red flags |
| `calculate_portfolio_temperature` | holdings, engagement_coverage_pct, paris_aligned_pct | Calculate portfolio temperature alignment using WACI and implied temperature. holdings: list of { name: str, weight: float (sum to 1.0), tco2e: float, revenue_usd_mn: float, has_sbti: bool (optional), sbti_temperature: float (optional) } |
| `screen_transition_instrument` | instrument_type, entity_name, sector, kpis, spts, has_transition_plan, transition_plan_tier, sbti_status | Screen a transition finance instrument against applicable credibility criteria. instrument_type: transition_bond / sustainability_linked_loan / transition_loan_facility / blended_finance_transition |
| `get_transition_benchmarks` |  | Return consolidated benchmark and reference data for transition finance analysis. |

**Engine `transition_finance_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `WACI_UNIT` | `'tCO2e / USD mn revenue'` |
| `IMPLIED_TEMP_BASE_WACI` | `300.0` |
| `IMPLIED_TEMP_15C_WACI` | `100.0` |
| `IMPLIED_TEMP_3C_WACI` | `600.0` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `INSTRUMENTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Green Bond Greenium | `YTM_green - YTM_conventional` | Market data | Green bonds trade at lower yield (premium) vs conventional |
| Taxonomy Aligned % | `Aligned proceeds / Total proceeds` | EU Taxonomy | Fraction of bond proceeds meeting EU Taxonomy criteria |
| DNSH Pass Rate | `Per environmental objective` | EU TEG | Do No Significant Harm assessment across all 6 EU objectives |
| SLB Step-Up | `Triggered if KPI missed` | Bond prospectus | Coupon increase if issuer fails to meet sustainability KPI |

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/transition-finance/ref/gfanz-expectations** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'version', 'expectations', 'transition_instrument_criteria', 'credibility_framework_weights', 'greenwash_red_flags'], 'n_keys': 6}`

**GET /api/v1/transition-finance/ref/race-to-zero** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'overview', 'five_cs', 'membership_categories', 'key_requirements_summary', 'total_members_2023', 'financial_assets_committed_usd_tn'], 'n_keys': 7}`

**GET /api/v1/transition-finance/ref/sbti-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'standard_version', 'criteria', 'validation_process', 'near_term_requirements', 'long_term_requirements', 'sector_specific_pathways'], 'n_keys': 7}`

**GET /api/v1/transition-finance/ref/sector-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'note', 'pathways', 'high_climate_impact_sectors', 'sector_count', 'key_milestones'], 'n_keys': 6}`

**GET /api/v1/transition-finance/ref/tpt-elements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'elements', 'quality_tiers', 'total_weight', 'element_weights_summary', 'composite_scoring'], 'n_keys': 6}`

**POST /api/v1/transition-finance/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/transition-finance/instrument-screen** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/transition-finance/portfolio-temperature** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** ICMA + EU Taxonomy alignment screening
**Headline formula:** `Greenium = YTM_green - YTM_comparable_conventional (bps)`

Each instrument screened against: (1) ICMA framework alignment (GBP for green bonds, SBP for social, SLB Principles for sustainability-linked), (2) EU Taxonomy substantial contribution to 1+ of 6 environmental objectives + DNSH for remaining 5, (3) Greenium quantification (negative spread = investor pays premium for green). SLB KPI tracking monitors whether issuer meets sustainability targets.

**Standards:** ['ICMA GBP/SBP/SLB Principles', 'EU Taxonomy Regulation', 'EU GBS']
**Reference documents:** ICMA Green Bond Principles (2021); ICMA SLB Principles (2020); EU Taxonomy Regulation (EU) 2020/852; EU Green Bond Standard Regulation (EU) 2023/2631

**Engine `transition_finance_engine` — extracted transformation lines:**
```python
score = sum(scores) / len(scores) if scores else 0.0
WACI = Σ(weight_i × tCO2e_i / revenue_i_M)
frac = (waci - IMPLIED_TEMP_15C_WACI) / (IMPLIED_TEMP_BASE_WACI - IMPLIED_TEMP_15C_WACI)
frac = (waci - IMPLIED_TEMP_BASE_WACI) / (IMPLIED_TEMP_3C_WACI - IMPLIED_TEMP_BASE_WACI)
score = 1.0  # full marks for N/A criteria (e.g. FLAG for non-land sector)
leap_score = len(leap_stages_completed) / max_leap
sbtn_score = sbtn_steps / 5
tnfd_score = round((leap_score + sbtn_score) / 2.0, 3)
composite = score_sum / n_checks if n_checks > 0 else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **46** other module(s).
**Shared engines (edits propagate!):** `transition_finance_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `transition-finance` | engine:transition_finance_engine, table:exc |
| `transition-finance-engine` | engine:transition_finance_engine, table:exc |
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `green-hydrogen-lcoh` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |
| `supply-chain-resilience` | table:exc |

## 7 · Methodology Deep Dive

### 7.1 What the module computes

8 hand-curated, named real-world green/sustainability/SLB/transition/blue bonds (EIB Green Bond,
Enel SLB, TotalEnergies Transition Bond, Apple Green Bond, ADB Blue Bond, Unilever Sustainability
Bond, Saudi Aramco Green Bond, Volkswagen SLB) are each screened across ICMA framework alignment, EU
Taxonomy alignment %, greenium, implied temperature rise (ITR), and a 6-objective DNSH boolean
matrix. There is no PRNG and no backend engine — every field, including the final `screening`
verdict (pass/watch/fail), is a **manually assigned value in the static array**, not the output of
a scoring rule.

### 7.2 Parameterisation

| Field | Meaning | Provenance |
|---|---|---|
| `taxonomy_aligned` / `taxonomy_eligible` | % of proceeds meeting EU Taxonomy substantial-contribution criteria vs. merely activity-eligible | Manually assigned per bond; Apple (88%/98%) and EIB (78%/95%) highest, Saudi Aramco (8%/18%) lowest — directionally consistent with real-world taxonomy assessments of these issuer types |
| `greenium` (bps) | Yield discount vs. comparable conventional bond | Manually assigned, all negative (investor pays a premium / accepts lower yield) except Saudi Aramco (+0.4bps, i.e. no greenium) — correctly reflects the real pattern that low-credibility green bonds do not command a greenium |
| `itr` (°C) | Bond/issuer implied temperature rise | Manually assigned, 1.4°C (Apple) to 4.2°C (Saudi Aramco) |
| `dnsh` | 6-objective boolean (climate, water, bio, circular, pollution, ecosystems) | Manually assigned per bond; Saudi Aramco fails 5/6, TotalEnergies fails 3/6, all others pass 6/6 or 5/6 |
| `screening` | pass / watch / fail | **Manually assigned outcome label — no threshold rule links it to `taxonomy_aligned`, `dnsh`, or `itr` in code** |
| `step_up` (SLBs only) | Coupon step-up in bps if KPI missed | Manually assigned (25bps for both SLBs in the universe) |
| `kpis` (SLBs only) | Named baseline→target KPI pairs with target year | Real, plausible KPI structures (Enel: Renewable Capacity 46%→60% by 2025; VW: EV Share 5%→20%, CO₂/vehicle 118→95 g/km by 2025) |

### 7.3 Calculation walkthrough

1. **Portfolio KPIs**: `totalFaceValue` (sum of 8 face values), `passCount` (count where
   `screening==='pass'`), `avgTaxonomy` (simple mean of `taxonomy_aligned` across all 8),
   `avgGreenium` (simple mean of `greenium`) — all straightforward aggregations over the static
   array, no PRNG involved.
2. **Filters**: type (Green Bond/SLB/Transition Bond/Blue Bond/Sustainability Bond) and screening
   result, applied as simple array filters.
3. **DNSH matrix view**: renders the 6-objective pass/fail grid per bond — a direct pass-through of
   the hardcoded `dnsh` object, not a computed assessment against actual environmental data.
4. **Portfolio Screening tab**: buckets the 8 bonds by `screening` result and sums face value per
   bucket (`pieData`-style aggregation) for the pass/watch/fail distribution chart.

### 7.4 Worked example (portfolio aggregates)

| Metric | Computation | Result |
|---|---|---|
| Total face value | Σ 8 bonds' `face_value` (2500+1000+1200+1000+300+750+1250+1000) | **$9.0Bn** |
| Pass rate | 6 of 8 bonds `screening==='pass'` (TotalEnergies=watch, Saudi Aramco=fail) | **6/8 (75%)** |
| Avg taxonomy alignment | `(78+0+22+88+65+52+8+0)/8` | **39%** |
| Avg greenium | `(−8.2−6.4−2.8−12.4−9.8−11.2+0.4−5.6)/8` | **−7.0bps** |

The wide spread in `taxonomy_aligned` (0% for both SLBs — because SLB proceeds are general-purpose
and thus not taxonomy-eligible by design — to 88% for Apple's ring-fenced green bond) correctly
reflects a real structural distinction: use-of-proceeds instruments (Green/Blue/Sustainability
Bonds) can show high taxonomy alignment, while SLBs (general corporate purposes, KPI-linked
coupon) structurally cannot.

### 7.5 Companion analytics

- **KPI Tracking tab** — renders the 2 SLBs' named KPI baseline→target pairs with target years, a
  direct pass-through of the hardcoded `kpis` array.
- **Greenium Analysis tab** — bar/scatter of greenium by bond, useful for seeing which structures
  and issuers command the largest investor premium.

### 7.6 Data provenance & limitations

- The 8 instruments use **real issuer names and plausible ISIN-format identifiers** but are
  **illustrative constructions**, not live data pulled from a bond database or the issuers' actual
  prospectuses — coupon, greenium, and taxonomy-alignment figures should be read as representative
  examples, not current market terms.
- **The `screening` (pass/watch/fail) verdict is not derived from any visible rule.** A production
  version would need an explicit decision rule (e.g. `fail` if `dnsh` has ≥2 objectives false OR
  `taxonomy_aligned < 20%` OR `itr > 3.0°C`) so the verdict is auditable and reproducible rather than
  a hand-set label.
- DNSH assessment is a static boolean per objective per bond — no evidence trail (which specific
  activity or emissions data triggered a "false") is retained.

### 7.7 Framework alignment

- **ICMA Green Bond Principles / Social Bond Principles / Sustainability-Linked Bond Principles**:
  `label` field correctly cites the applicable ICMA principle set (EU GBS, ICMA SLB, ICMA GBP, CBI
  Certified, ASEAN SBF, ICMA SBP) per bond, matching real market-standard nomenclature.
- **EU Taxonomy Regulation (EU) 2020/852**: `taxonomy_aligned`/`taxonomy_eligible` and the 6-objective
  DNSH matrix (climate mitigation/adaptation collapsed to "climate" here, water, biodiversity,
  circular economy, pollution, ecosystems) mirror the Taxonomy's real 6 environmental objectives.
- **EU Green Bond Standard (Regulation (EU) 2023/2631)**: the EIB bond's "EU GBS" label reflects the
  real, newly-operative EU GBS regime requiring ≥85% taxonomy-aligned proceeds allocation.
- **Implied Temperature Rise (ITR)**: consistent with PACTA/CDP-style ITR methodology in concept
  (portfolio or issuer warming potential in °C), though the module does not show how the 1.4–4.2°C
  figures were derived from underlying emissions/target data.

## 9 · Future Evolution

### 9.1 Evolution A — An auditable screening rule and live instrument-screen calls (analytics ladder: rung 1 → 3)

**What.** The module screens 8 hand-curated real bonds (EIB, Enel SLB, Saudi Aramco...) with no PRNG — the directional data is sound (Apple 88% taxonomy-aligned, Saudi Aramco 8%; SLBs correctly 0% since proceeds are general-purpose). But §7.6 documents the core gap: the `screening` pass/watch/fail verdict is a **hand-set label with no rule linking it to** `taxonomy_aligned`, `dnsh`, or `itr` — it's not auditable or reproducible. Meanwhile the mapped `POST /instrument-screen` engine endpoint (which computes exactly this) is never called and currently traces `failed`. Evolution A makes the verdict a rule and wires the engine.

**How.** (1) Define an explicit, auditable screening rule per §7.6's suggestion — e.g. `fail` if DNSH fails ≥2 objectives OR taxonomy_aligned <20% OR ITR >3.0°C; `watch`/`pass` bands below — so the verdict derives from the fields, reproducibly. (2) Fix and call `POST /instrument-screen` (traces failed today; shared with the `transition-finance`/`transition-finance-engine` siblings — the whole `transition_finance_engine` family's POSTs are broken). (3) Replace the 8 illustrative bonds with a real feed: EU GBS/ICMA-labelled bonds from the Climate Bonds Initiative database; retain DNSH as an evidence-linked assessment (§7.6 notes no evidence trail exists for a "false"). (4) Derive ITR from issuer emissions/target data rather than hand-setting the 1.4–4.2°C figures (§7.7).

**Prerequisites.** The `instrument-screen` POST failure root-caused; a labelled-bond data source; 46-module blast radius via the shared engine (§6). **Acceptance:** every pass/watch/fail verdict reproduces from the stated rule over the bond's own fields; identical inputs to `/instrument-screen` give identical verdicts front and back; DNSH "false" flags carry an evidence reference.

### 9.2 Evolution B — Bond-screening copilot for ESG fixed-income desks (LLM tier 1 → 2)

**What.** A copilot answering "why did TotalEnergies' transition bond screen as Watch not Pass?" (DNSH fails 3/6 objectives per the data), "which instruments command the largest greenium and why?", and "does this SLB's KPI structure meet ICMA SLBP?" — grounded in the accurate ICMA/EU-GBS labelling (§7.7) and, at tier 2, executing `/instrument-screen`.

**How.** Tier 1 on the module's genuinely-real curated data plus this Atlas record: the copilot explains the structural distinction the data correctly encodes (use-of-proceeds bonds can be taxonomy-aligned; SLBs structurally can't, §7.4) and the greenium pattern (low-credibility green bonds command no greenium — Saudi Aramco +0.4bps). It must disclose per §7.6 that the 8 bonds are illustrative constructions with representative terms, not live prospectus data, and — critically pre-Evolution-A — that the screening verdict is currently a hand-set label, not a rule output. Tier 2 arrives with Evolution A's screening endpoint: the copilot runs the auditable rule and cites the specific failing criterion, with the "show work" expander exposing the DNSH objective that triggered a Watch/Fail.

**Prerequisites.** Evolution A's rule and endpoint fix for tier 2; tier-1 explanation ships now with the illustrative-data and hand-set-verdict caveats. **Acceptance:** every screening explanation names the specific criterion; the SLB/UoP taxonomy distinction is never blurred; verdicts are labelled hand-set until Evolution A, then rule-traced.