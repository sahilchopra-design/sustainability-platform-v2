# Social Taxonomy
**Module ID:** `social-taxonomy` · **Route:** `/social-taxonomy` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
EU social taxonomy alignment analytics mapping company activities to adequate wages, access to essential services, inclusive employment and fair working conditions criteria.

> **Business value:** Assesses portfolio company alignment with the EU social taxonomy framework across adequate wages, inclusion and access criteria.

**How an analyst works this module:**
- Map company economic activities to EU social taxonomy activity list.
- Assess alignment against technical screening criteria: adequate wages, access, inclusion.
- Calculate aligned revenue share and DNSH assessment for social objectives.
- Report social taxonomy alignment at company and portfolio levels.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTIVITIES`, `BONDS`, `KpiCard`, `PROGRESS`, `REGIONS`, `SOCIAL_OBJECTIVES`, `TABS`, `YEARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SOCIAL_OBJECTIVES` | 9 | `name`, `sdg`, `budget`, `alignedPct`, `eligiblePct` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['EU','UK','US','Asia-Pacific','Emerging Markets','Nordic','Switzerland'];` |
| `PROGRESS` | `YEARS => YEARS.map((yr, i) => ({` |
| `progressData` | `useMemo(() => PROGRESS(YEARS), []);  const objBarData = useMemo(() => SOCIAL_OBJECTIVES.map(o => ({ name: o.name.split(' ').slice(0, 2).join(' '), aligned: o.alignedPct, eligible: o.eligiblePct, })), []);` |
| `bondData` | `useMemo(() => BONDS.slice(0, 10).map(b => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/social-taxonomy/assess` | `assess` | api/v1/routes/social_taxonomy.py |
| POST | `/api/v1/social-taxonomy/hrdd` | `hrdd` | api/v1/routes/social_taxonomy.py |
| POST | `/api/v1/social-taxonomy/supply-chain-screen` | `supply_chain_screen` | api/v1/routes/social_taxonomy.py |
| GET | `/api/v1/social-taxonomy/ref/eu-social-taxonomy` | `ref_eu_social_taxonomy` | api/v1/routes/social_taxonomy.py |
| GET | `/api/v1/social-taxonomy/ref/ilo-conventions` | `ref_ilo_conventions` | api/v1/routes/social_taxonomy.py |
| GET | `/api/v1/social-taxonomy/ref/decent-work` | `ref_decent_work` | api/v1/routes/social_taxonomy.py |
| GET | `/api/v1/social-taxonomy/ref/country-labour-risk` | `ref_country_labour_risk` | api/v1/routes/social_taxonomy.py |

### 2.3 Engine `social_taxonomy_engine` (services/social_taxonomy_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_score_ilo_compliance` | supplier_countries | Compute ILO compliance score for a set of supplier countries. |
| `_score_ungp_hrdd` | policy_commitment, value_chain_mapping, corrective_actions, grievance_mechanism, annual_reporting, board_oversight | Score UNGP HRDD across 6 steps. |
| `_score_social_taxonomy_objectives` | obj1_inputs, obj2_inputs, obj3_inputs | Score EU Social Taxonomy 3 objectives + DNSH checks. |
| `assess_social_taxonomy` | entity_name, nace_code, sector, country_of_operations, living_wage_compliance_pct, h_and_s_score, permanent_contract_pct, collective_bargaining_coverage_pct | Full EU Social Taxonomy assessment for an entity. Scores 3 EU Social Taxonomy objectives (Decent Work, Adequate Living Standards, Inclusive Communities), applies DNSH cross-checks, evaluates UNGP HRDD maturity, ILO convention compliance across the supply chain, and determines taxonomy alignment. |
| `conduct_hrdd` | company_name, supplier_countries, supply_chain_tiers, sector, policy_commitment, salient_issues_mapped, corrective_action_plans, grievance_mechanism | Human Rights Due Diligence assessment per UNGP / CSDDD / OECD DDG. Returns UNGP step scores, country risk breakdown, CSDDD adverse impact likelihood matrix, OECD DDG 5-step alignment, and risk priority recommendations. |
| `get_social_taxonomy_criteria` |  | Return all reference data for the EU Social Taxonomy and related frameworks. Returns ------- dict EU Social Taxonomy objectives, ILO conventions, CSDDD social categories, UNGP steps, Decent Work indicators, and country labour risk profiles. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `REGIONS`, `SOCIAL_OBJECTIVES`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Activities Assessed | — | EU Social Taxonomy | Number of economic activities assessed against EU social taxonomy criteria across portfolio. |
| Avg Alignment Rate | — | Calculated | Mean social taxonomy alignment across assessed portfolio companies weighted by revenue. |
| Living Wage Coverage | — | WageIndicator | Share of employees in assessed companies earning at or above national living wage benchmarks. |
- **Company revenue data, EU social taxonomy activity list, wage data** → Activity mapping, TSC assessment, alignment calculation → **Social taxonomy alignment reports, living wage gap analysis**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/social-taxonomy/ref/country-labour-risk** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['countries_covered', 'risk_tier_definitions', 'tier_summary', 'profiles', 'cahra_countries_note'], 'n_keys': 5}`

**GET /api/v1/social-taxonomy/ref/decent-work** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'sdg_target', 'related_ilo_documents', 'indicators', 'composite_note'], 'n_keys': 5}`

**GET /api/v1/social-taxonomy/ref/eu-social-taxonomy** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'body', 'report_date', 'supplementary_report_date', 'status', 'objectives', 'dnsh_rule', 'minimum_safeguards', 'taxonomy_alignment_tiers'], 'n_keys': 9}`

**GET /api/v1/social-taxonomy/ref/ilo-conventions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'adopted', 'body', 'core_conventions_count', 'four_categories', 'conventions', 'compliance_scoring_note'], 'n_keys': 7}`

**POST /api/v1/social-taxonomy/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/social-taxonomy/hrdd** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/social-taxonomy/supply-chain-screen** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Social Taxonomy Alignment
**Headline formula:** `Revenue from Socially Aligned Activities ÷ Total Revenue × 100`

Proportion of company revenue attributable to activities meeting EU social taxonomy technical screening criteria.

**Standards:** ['EU Platform on Sustainable Finance Social Taxonomy', 'ILO Living Wage']
**Reference documents:** EU Platform on Sustainable Finance Social Taxonomy Report 2022; ILO Living Wage Methodology; EU Adequate Minimum Wages Directive 2022/2041; UNGP Reporting Framework

**Engine `social_taxonomy_engine` — extracted transformation lines:**
```python
base = ratified / 8
base = min(1.0, base + 0.10)
score = max(0.0, base - tier_penalty)
ilo_composite = weighted_sum / total_weight if total_weight > 0 else 0
composite = (s1 * 0.40) + (s2 * 0.35) + (s3 * 0.25)
risk_score = round(min(1.0, base_likelihood) * severity, 4)
oecd_score = sum(1 for v in oecd_steps.values() if v) / len(oecd_steps)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states the calculation engine is
> `Revenue from Socially Aligned Activities ÷ Total Revenue × 100`. **No revenue-based alignment calculation
> exists in the code.** The `alignedPct`/`eligiblePct` figures shown per social objective (e.g. "Affordable
> Housing: 38% aligned") are **hand-set constants** baked into the `SOCIAL_OBJECTIVES` seed array, not
> computed from any company revenue split. Per-activity `alignmentScore`, `dnsScore` (DNSH), and `msscScore`
> (Minimum Social Safeguards) are independently-seeded random numbers, not outputs of the "Three-Test
> Alignment Framework" the page itself describes in the Alignment Scoring tab. The sections below document
> what the code actually renders.

### 7.1 What the module computes

The page is built around two hand-authored reference tables — `SOCIAL_OBJECTIVES` (8 EU Social Taxonomy
categories: affordable housing, healthcare, education, employment, financial inclusion, digital access,
gender equality, food security, each tagged to one UN SDG and a fixed `budget`/`alignedPct`/`eligiblePct`)
and `ACTIVITIES` (20 named real-world-style activities, e.g. "Social housing construction", each mapped to
one objective, a region, and a **hand-picked eligibility label** from a fixed 20-element array cycling
`Eligible`/`Not Eligible`/`Review Required`). A separate `BONDS` array lists 12 real European supranational
/agency issuers (EIB, European Commission, AFD, KfW, EBRD, IFC…) with synthetic volume and a deterministic
`taxonomyAligned = (i % 3 !== 0)` flag (two-thirds of bonds "aligned", by index position, not by any
assessed criterion).

### 7.2 Parameterisation

| Field | Rule | Provenance |
|---|---|---|
| `SOCIAL_OBJECTIVES.alignedPct` / `.eligiblePct` | fixed per-objective constant (33–78%) | **hand-authored, not calculated** |
| `ACTIVITIES.eligibility` | fixed 20-element cyclic array | **hand-authored**, not derived from `alignmentScore`/`dnsScore`/`msscScore` |
| `alignmentScore` | `sr(i*7)×40+45` → 45–85 | synthetic |
| `dnsScore` (DNSH) | `sr(i*11)×30+60` → 60–90 | synthetic |
| `msscScore` (Min. Social Safeguards) | `sr(i*17)×35+55` → 55–90 | synthetic |
| `capexMn` | `sr(i*23)×200+20` → $20–220M | synthetic |
| `BONDS.taxonomyAligned` | `index % 3 !== 0` | deterministic pattern, not assessed |
| `PROGRESS` (2020–2025 time series) | linear trend (+8pp/yr eligible, +6pp/yr aligned) + `sr()` noise | hand-authored trajectory, not fit to real disclosure data |

### 7.3 Calculation walkthrough

- **Overview KPIs**: `Avg Eligible %`/`Avg Aligned %` are plain means of the 8 fixed `SOCIAL_OBJECTIVES`
  constants — an average of hard-coded numbers, not a computed portfolio statistic.
- **Activity Screener**: filters `ACTIVITIES` by objective/region; eligibility counts are tallies of the
  fixed `eligibility` label array. `alignmentScore`/`dnsScore`/`msscScore` are displayed per row but are
  **not used to derive the `eligibility` label** — the two are independent data sources on the same row.
- **DNSH & MSSC scatter** (Eligibility tab): plots `dnsScore` vs `msscScore` per activity — a visual, not a
  pass/fail gate; no threshold logic converts these scores into the eligibility flag.
- **Social bonds tab**: counts `taxonomyAligned` bonds and sums `volume`; no per-bond alignment assessment.

### 7.4 Worked example

For "Social housing construction" (activity index 0, objective `affordable-housing`):

| Field | Formula | Result |
|---|---|---|
| `alignmentScore` | `sr(0×7)×40+45 = sr(0)×40+45` | ≈ **45 + 40×sr(0)** |
| `dnsScore` | `sr(0×11)×30+60` | ≈ **60 + 30×sr(0)** |
| `msscScore` | `sr(0×17)×35+55` | ≈ **55 + 35×sr(0)** |
| `capexMn` | `sr(0×23)×200+20` | ≈ **$20 + 200×sr(0)M** |
| `eligibility` (hand-picked, index 0) | fixed array position | **"Eligible"** |

Because `sr(0)` is the same seed input (`Math.sin(1)*10000` fractional part) across all four scaled
formulas, the four scores are not independent random draws in a statistical sense — they are perfectly
correlated transformations of one underlying `sr()` call at index 0, a subtlety not visible in the UI.

### 7.5 Three-Test Alignment Framework (descriptive only)

The Alignment Scoring tab documents the real EU Platform on Sustainable Finance's proposed **three-test
structure** for social taxonomy alignment — this is accurately named but not wired to any pass/fail logic:

| Test | Definition (as displayed) |
|---|---|
| Substantial Contribution (SC) | Activity makes a measurable positive contribution to ≥1 social objective |
| Do No Significant Harm (DNSH) | Activity does not significantly harm any other social/environmental objective |
| Minimum Social Safeguards (MSSC) | Baseline UNGP/ILO/anti-corruption/tax-transparency protections |

### 7.6 Data provenance & limitations

- **All eligibility labels, alignment percentages, and scores are synthetic or hand-authored constants** —
  none derive from actual company revenue, capex, or opex splits (which is what EU Taxonomy alignment
  legally requires). The `sr(seed) = frac(sin(seed+1)×10⁴)` PRNG generates the numeric scores; the
  categorical eligibility array is manually written.
- The three-test framework is **displayed as an explainer, not implemented as a scoring pipeline** — there
  is no code path that takes an activity's SC/DNSH/MSSC scores and derives its eligibility status.
- Bond `taxonomyAligned` uses an arbitrary index-modulo rule, not the issuer's actual use-of-proceeds
  framework.
- No revenue, capex, or opex KPI (the EU Taxonomy Article 8 disclosure basis) exists anywhere in the module.

### 7.7 Framework alignment

- **EU Platform on Sustainable Finance Social Taxonomy Report (2022)** — the module's objective set (8
  categories) and three-test structure are faithful to the report's proposed architecture; no technical
  screening criteria (TSC) thresholds are implemented.
- **ILO Living Wage Methodology / EU Adequate Minimum Wages Directive 2022/2041** — referenced in the guide;
  not used in any calculation (no wage data field exists in the seed).
- **UNGP Reporting Framework** — the MSSC test description cites UNGP/ILO/anti-corruption baseline; again
  descriptive only.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Support portfolio-level EU Social Taxonomy alignment disclosure (analogous to Article 8 Taxonomy Regulation
KPIs, once social technical screening criteria are finalised) for asset managers reporting under SFDR and
CSRD/ESRS S1–S4. Scope: corporate revenue/capex/opex splits mapped to the 8 social objectives.

### 8.2 Conceptual approach

Mirror the **environmental EU Taxonomy alignment pipeline already in production practice** (as implemented
by MSCI, ISS, Clarity AI Taxonomy modules): (1) NACE/ISIC activity-code mapping to eligible activities, (2)
per-activity technical screening criteria (TSC) pass/fail against disclosed KPIs, (3) DNSH cross-check
against the other objectives, (4) MSSC gate via a binary UNGP/ILO compliance flag, (5) revenue-weighted
roll-up to a portfolio alignment %. This is the same architecture Clarity AI and ISS ESG already run for
environmental Taxonomy; the social pillar swaps in the EU Platform's proposed social TSCs once finalised.

### 8.3 Mathematical specification

```
EligibleRevenue_c   = Σ_a Revenue_{c,a}                for activities a in the EU Social Activity List
AlignedRevenue_c    = Σ_a Revenue_{c,a} × 1{SC_pass_a ∧ DNSH_pass_a ∧ MSSC_pass_c}
CompanyAlignment_c  = AlignedRevenue_c / TotalRevenue_c
PortfolioAlignment  = Σ_c Weight_c × CompanyAlignment_c
```
`SC_pass_a` = activity KPI (e.g. % of housing units at below-market rent) ≥ published TSC threshold;
`DNSH_pass_a` = no breach flagged on any of the other 3 EU Taxonomy environmental objectives + remaining
social objectives; `MSSC_pass_c` = company-level binary (UNGP due-diligence process in place, no severe
controversy flag, ILO core convention non-breach).

| Parameter | Calibration source |
|---|---|
| EU Social Activity List / TSCs | EU Platform on Sustainable Finance Social Taxonomy Report (final, once adopted) |
| MSSC controversy flag | Refinitiv/Sustainalytics controversy severity feed, or platform's existing controversy engine |
| Activity → NACE mapping | EU Taxonomy Compass (already a platform reference-data source per MEMORY.md GAP wiring) |

### 8.4 Data requirements

Company-level revenue/capex/opex by NACE activity code (financial statement segmentation — often the
hardest input to source; proxy via revenue-segment disclosure or third-party activity-mapping vendors),
UNGP/ILO compliance flags (Sustainalytics/RepRisk controversy feeds), portfolio holdings/weights (already in
platform contexts). The EU Taxonomy Compass reference table already wired into the platform (per
`docs/module_atlas` reference-data layer notes) covers the *environmental* activity list and could be
extended with the social activity list once the Commission adopts final TSCs.

### 8.5 Validation & benchmarking plan

Reconcile `CompanyAlignment_c` for large-cap EU issuers against their own CSRD/Taxonomy disclosures once
mandatory social-pillar reporting begins (phase-in expected post-2026). Cross-check against ISS ESG/Clarity
AI vendor Taxonomy-alignment figures where the environmental pillar overlaps (data-pipeline validation even
before the social TSCs are final).

### 8.6 Limitations & model risk

The EU social taxonomy TSCs are **not yet finalised in EU law** — any implementation must clearly flag
alignment figures as based on the Platform's *draft* 2022 proposal, subject to change. Revenue-segment data
at the activity-code granularity required is frequently unavailable for non-EU issuers; the model should
degrade to an "eligible but alignment unknown" state rather than defaulting to 0% or 100%.

## 9 · Future Evolution

### 9.1 Evolution A — Fix the failing endpoints and implement revenue-based three-test alignment (analytics ladder: rung 1 → 2)

**What.** The engine (`social_taxonomy_engine`) has genuine ILO-composite and three-objective weighting logic (`composite = s1×0.40 + s2×0.35 + s3×0.25`), but the lineage sweep records `POST /assess` and `/supply-chain-screen` as **failed** and `/hrdd` skipped, so the backend is unexercised — and the frontend is worse: §7 flags that the guide's headline `Revenue from Socially Aligned Activities ÷ Total Revenue × 100` is **not implemented**, the per-objective `alignedPct`/`eligiblePct` are hand-set constants, per-activity SC/DNSH/MSSC scores are independent `sr()` draws, and bond `taxonomyAligned` is an arbitrary `index % 3` pattern. No revenue/capex/opex KPI — the EU Taxonomy Article 8 disclosure basis — exists anywhere. Evolution A repairs the routes and builds the real three-test pipeline.

**How.** (1) Triage the two failing POST routes. (2) Implement the three-test scoring pipeline the page only displays as an explainer: an activity's Substantial-Contribution, DNSH, and Minimum-Social-Safeguards scores must derive its eligibility status via a code path, not a hand-set label. (3) Add revenue/capex/opex inputs per activity and compute the aligned-revenue-share headline the guide promises. (4) Replace the `index % 3` bond flag with an assessment against each issuer's actual use-of-proceeds framework. (5) Wire the `ref/country-labour-risk` and `ref/ilo-conventions` tables (which pass) into the MSSC test as real inputs.

**Prerequisites.** The `/assess` and `/supply-chain-screen` failures are the gate; TSC thresholds need encoding from the EU Platform 2022 report; wage data fields must be added to support the adequate-wage objective. **Acceptance:** all three POST routes pass the sweep; an activity's eligibility recomputes from its SC/DNSH/MSSC scores; aligned-revenue-share is computed from a revenue split, not a constant.

### 9.2 Evolution B — Social-taxonomy screening analyst (LLM tier 2)

**What.** A tool-calling analyst over the repaired endpoints: "is this company's activity socially aligned?", "run human-rights due diligence on this supply chain", "which ILO conventions gate this jurisdiction". It calls `POST /assess`, `/hrdd`, and `/supply-chain-screen`, narrating the three-test result and citing the specific ILO convention or decent-work criterion from `GET /ref/ilo-conventions` and `/ref/decent-work`.

**How.** Tool schemas from the module's OpenAPI operations (3 POST compute + 4 GET ref); grounding corpus = this Atlas record plus the four reference payloads. The HRDD narrative cites country-labour-risk tiers from the `/ref/country-labour-risk` endpoint; every alignment percentage is validated against tool output. Framework grounding in the EU Platform Social Taxonomy Report and the Adequate Minimum Wages Directive.

**Prerequisites (hard).** Evolution A — `/assess` and `/supply-chain-screen` currently 500, and the alignment percentages are hand-set constants, so there is nothing real to narrate. **Acceptance:** every alignment figure traces to a tool response; each ILO-convention citation matches a `/ref/ilo-conventions` entry; a company with no revenue data yields "cannot assess alignment," not a fabricated percentage.