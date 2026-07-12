# Api::Blue_Economy
**Module ID:** `api::blue_economy` · **Route:** `/api/v1/blue-economy` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/blue-economy/screen-bond` | `screen_bond_endpoint` | api/v1/routes/blue_economy.py |
| POST | `/api/v1/blue-economy/blue-carbon` | `blue_carbon_endpoint` | api/v1/routes/blue_economy.py |
| POST | `/api/v1/blue-economy/bbnj-compliance` | `bbnj_compliance_endpoint` | api/v1/routes/blue_economy.py |
| POST | `/api/v1/blue-economy/ocean-acidification` | `ocean_acidification_endpoint` | api/v1/routes/blue_economy.py |
| POST | `/api/v1/blue-economy/ocean-portfolio` | `ocean_portfolio_endpoint` | api/v1/routes/blue_economy.py |
| POST | `/api/v1/blue-economy/sof-assessment` | `sof_assessment_endpoint` | api/v1/routes/blue_economy.py |
| GET | `/api/v1/blue-economy/ref/ecosystems` | `ref_ecosystems` | api/v1/routes/blue_economy.py |
| GET | `/api/v1/blue-economy/ref/use-of-proceeds` | `ref_use_of_proceeds` | api/v1/routes/blue_economy.py |
| GET | `/api/v1/blue-economy/ref/bbnj-articles` | `ref_bbnj_articles` | api/v1/routes/blue_economy.py |
| GET | `/api/v1/blue-economy/ref/sof-pillars` | `ref_sof_pillars` | api/v1/routes/blue_economy.py |
| GET | `/api/v1/blue-economy/ref/ocean-markets` | `ref_ocean_markets` | api/v1/routes/blue_economy.py |

### 2.3 Engine `blue_economy_engine` (services/blue_economy_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `screen_blue_bond` | bond_data | Screen a bond against ICMA Blue Bond Principles 2023 and SOF framework. ICMA alignment is computed deterministically from the reference alignment scores of the declared eligible categories (BLUE_BOND_USE_OF_PROCEEDS). ``greenium_bps`` is a market-observed figure: it is returned only when the caller supplies ``observed_greenium_bps`` (or a target), otherwise None. |
| `assess_blue_carbon` | project_data | Calculate blue carbon sequestration, additionality, permanence, and credit economics. Sequestration uses the ecosystem reference mean rate (IPCC/Blue Carbon Initiative — a deterministic model parameter). Area, project quality scores (threat/tenure/baseline/governance) and carbon price are caller-supplied inputs; when absent the dependent metrics are returned as honest nulls with a data flag rather |
| `assess_bbnj_compliance` | entity_data | Assess compliance with the High Seas Treaty BBNJ 2023 across 5 key article areas. Article scores are entity-disclosed data. Only articles for which the caller supplies a score are scored; undisclosed articles are returned as None (honest null) and the overall score is the weight-renormalised aggregate over disclosed articles. If nothing is disclosed the overall score is None and the level is ``ins |
| `assess_ocean_acidification_risk` | portfolio_data | Assess portfolio exposure to ocean acidification under IPCC AR6 RCP scenarios. The physical impact factors (pH change, aragonite saturation, fisheries revenue impact, coral mortality) are drawn from the IPCC AR6 RCP reference table — the genuine core. Portfolio exposure and its sector split are caller inputs; when exposure is absent all VaR figures are honest nulls. ``adaptation_cost_ratio`` defau |
| `aggregate_ocean_portfolio` | portfolio_data | Aggregate portfolio-level SOF score, blue bond allocation, and ocean risk metrics. Every returned figure is derived from caller-supplied holdings and disclosed data, or returned as an honest null. Holdings drive total_blue_assets and the top-sector table; SOF pillar scores come from caller-disclosed ``sof_pillar_scores``; blue-bond allocation, blue-carbon credits and MPA financing are entity-repor |
| `assess_sof_alignment` | entity_data | Comprehensive UNEP-FI Sustainable Ocean Finance alignment assessment. Pillar scores are entity-disclosed (``declared_sof_scores``). Undisclosed pillars carry a null score; the overall SOF score is the weight- renormalised aggregate over disclosed pillars, or None if nothing is disclosed. ``entity_contribution_pct`` is returned only when supplied. |

**Engine `blue_economy_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `DEFAULT_ADAPTATION_COST_RATIO` | `0.25` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `force` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/blue-economy/ref/bbnj-articles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['articles', 'treaty_name', 'adoption_date', 'signatory_threshold_for_entry_into_force', 'note'], 'n_keys': 5}`

**GET /api/v1/blue-economy/ref/ecosystems** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ecosystems', 'total_sequestration_potential_bn_tco2', 'source', 'note'], 'n_keys': 4}`

**GET /api/v1/blue-economy/ref/ocean-markets** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['global_ocean_economy_gdp_bn_usd', 'ocean_economy_potential_2030_bn_usd', 'sdg14_annual_financing_gap_bn_usd', 'blue_bond_issuance_2023_bn_usd', 'blue_carbon_market_2023_mn_usd', 'offshore_wind_installed_gw', 'offshore_wind_pipeline_2030_gw', 'mpa_coverage_pct_ocean', 'ta`

**GET /api/v1/blue-economy/ref/sof-pillars** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pillars', 'framework', 'total_pillars', 'sdg_alignment'], 'n_keys': 4}`

**GET /api/v1/blue-economy/ref/use-of-proceeds** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['categories', 'standard', 'total_categories', 'external_review_required_threshold_usd'], 'n_keys': 4}`

**POST /api/v1/blue-economy/bbnj-compliance** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/blue-economy/blue-carbon** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/blue-economy/ocean-acidification** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `blue_economy_engine` — extracted transformation lines:**
```python
sof_pillar_coverage = {k: round(v / total_pillar, 3) for k, v in sof_pillar_coverage.items()}
use_of_proceeds_breakdown = {k: round(v / total_alloc * 100, 1) for k, v in use_of_proceeds_breakdown.items()}
total_annual = area_ha * seq_rate
total_lifetime = total_annual * lifetime_years
permanence_score = round((eco_stability * 0.5 + float(governance_score) * 0.5), 4)
risk_buffer_pct = round(max(10.0, min(30.0, (1 - permanence_score) * 60)), 1)
net_sequestration = total_annual * (1 - risk_buffer_pct / 100)
carbon_credit_value_usd = round(net_sequestration * float(carbon_price_usd_tco2), 2)
net_revenue = round(carbon_credit_value_usd - (monitoring_cost or 0.0), 2)
key=lambda x: x[1] * x[2]
fisheries_exposure = total_ocean_economy_exposure * fisheries_pct
coral_reef_exposure = total_ocean_economy_exposure * coral_reef_pct
aquaculture_exposure = total_ocean_economy_exposure * aquaculture_pct
coral_at_risk = coral_reef_exposure * coral_mortality_factor
total_oa_var = fisheries_at_risk + coral_at_risk + aquaculture_at_risk
adaptation_cost = total_oa_var * adaptation_ratio
mpa_financing = round(total_blue * float(mpa_share), 2)
ocean_risk_score = round(1 - sof_score * 0.7, 4) if sof_score is not None else None
sdg14_score = round(sof_score * 0.85, 4) if sof_score is not None else None
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

Grounded in `backend/services/blue_economy_engine.py` (E68; routes:
`api/v1/routes/blue_economy.py`). Five ocean-finance calculators: ICMA Blue Bond screening, blue
carbon project economics, BBNJ (High Seas Treaty) compliance, ocean-acidification VaR, and a
portfolio SOF (Sustainable Ocean Finance) aggregator, plus a standalone SOF alignment assessment.

### 7.1 What the domain computes

| Function | Core formula |
|---|---|
| `screen_blue_bond` | `icma_alignment = Σ (category_score / n)` over declared eligible categories; verdict fully ≥0.85 / partial ≥0.65 / not aligned |
| `assess_blue_carbon` | `annual_seq = area × seq_rate`; `net_seq = annual × (1 − risk_buffer%)`; `credit_value = net_seq × price`; additionality = `0.4·threat + 0.3·tenure + 0.3·baseline` |
| `assess_bbnj_compliance` | weight-renormalised `Σ score_k·w_k / Σ w_k` over disclosed articles |
| `assess_ocean_acidification_risk` | `VaR = fisheries·|impact%| + coral·mortality + aqua·mortality`; `adaptation = VaR × 0.25` |
| `aggregate_ocean_portfolio` | `sof_score = Σ pillar·w / Σ w`; `ocean_risk = 1 − 0.7·sof`; `sdg14 = 0.85·sof` |

### 7.2 Parameterisation (all reference constants cited to standards in code)

**Blue carbon ecosystems** (IPCC / Blue Carbon Initiative sequestration rates):

| Ecosystem | Mean seq (tCO₂/ha/yr) | Soil C stock (tCO₂/ha) | Permanence risk | Verra method |
|---|---|---|---|---|
| Mangrove | 7.0 | 860 | medium | VM0007 / VM0033 |
| Saltmarsh | 3.0 | 430 | medium-low | VM0033 |
| Seagrass | 0.6 | 140 | high | VM0033 |
| Kelp | 0.3 | 0 (exported) | high | Under development |

Permanence: `eco_stability = 1 − (0.30 high / 0.15 medium / 0.05 low)`; risk buffer =
`clamp((1 − permanence)·60, 10, 30)%` (Verra-style buffer pool). Monitoring cost $35–120/ha/yr.

**Blue bond use-of-proceeds** — 8 categories with ICMA alignment scores 0.75–0.95 (marine
conservation highest 0.95, OA mitigation lowest 0.75), each mapped to a SOF pillar and SDG14
targets, with typical allocation %.

**BBNJ articles** (High Seas Treaty 2023) — 5 areas with weights summing to 1.0: Art. 9 MGR
(0.25), Art. 17 EIA (0.25), Art. 22 ABMT/MPA (0.20), Art. 43 capacity building (0.15), Art. 52
financial mechanism (0.15). Compliant ≥0.75 / partial ≥0.50 / non-compliant below.

**Ocean acidification RCP table** (IPCC AR6 Ch.3): pH change by 2100 −0.06 (RCP2.6) to −0.33
(RCP8.5); aragonite saturation Ω 2.8 → 1.2; fisheries revenue impact −2.5% → −18.5%. Coral
mortality factor = `max(0, (2.5 − Ω)/2.5) × 0.8`; aquaculture = `max(0, (2.5 − Ω)/2.0) × 0.5`.

**SOF pillars** (UNEP-FI) — 6 pillars weighted 0.22/0.20/0.20/0.18/0.12/0.08 (ocean health →
blue energy). `DEFAULT_ADAPTATION_COST_RATIO = 0.25` (OECD Ocean Finance Framework 2022 central
estimate). SDG14 financing gap $175bn/yr (OECD reference).

### 7.3 Calculation walkthrough

The whole module follows the platform's **honest-null discipline** — every entity-specific input
(area, allocation, article scores, exposure, pillar scores, greenium) is caller-supplied or
returned as `None` with a `data_flags` entry; only IPCC/ICMA/Verra reference constants are
embedded. Notable flows:

- **Blue bond:** alignment is the mean reference ICMA score of declared eligible categories;
  use-of-proceeds breakdown uses issuer-declared splits when supplied, else ICMA "typical"
  allocations (flagged). External review triggered when bond ≥ $100M or alignment < 0.75.
  `greenium_bps` is only market-observed input — never derived from alignment.
- **Blue carbon:** sequestration volume, additionality, permanence, buffer, credit value and
  eligibility each require their specific inputs; missing any yields honest nulls. Verra-eligible
  requires additionality ≥ 0.6, permanence ≥ 0.5 and an available methodology; Gold Standard
  additionally needs additionality ≥ 0.70 and eco_stability ≥ 0.75.
- **OA risk:** physical factors always reported; monetary VaR only when
  `ocean_economy_exposure_usd` is supplied; sector shares absent → treated as 0 exposure (flagged,
  not fabricated).
- **Portfolio SOF:** the OA sub-call reuses total blue assets as the ocean-economy exposure;
  ocean_risk_score = `1 − 0.7·sof`, SDG14 = `0.85·sof`; Poseidon Principles aligned if sof ≥ 0.65.

### 7.4 Worked example (blue carbon, 1,000 ha mangrove)

Inputs: mangrove (seq_rate 7.0, lifetime 30y, monitoring $45/ha/yr, medium permanence →
eco_stability 0.85); area 1,000 ha; threat 0.8, tenure 0.7, baseline 0.6; governance 0.7;
carbon price $15/tCO₂:

| Step | Computation | Result |
|---|---|---|
| Annual sequestration | 1,000 × 7.0 | 7,000 tCO₂/yr |
| Lifetime | 7,000 × 30 | 210,000 tCO₂ |
| Additionality | 0.4×0.8 + 0.3×0.7 + 0.3×0.6 | 0.71 |
| Permanence | 0.85×0.5 + 0.7×0.5 | 0.775 |
| Risk buffer | clamp((1 − 0.775)×60, 10, 30) | 13.5% |
| Net sequestration | 7,000 × (1 − 0.135) | 6,055 tCO₂/yr |
| Credit value | 6,055 × $15 | **$90,825/yr** |
| Monitoring cost | 1,000 × $45 | $45,000/yr |
| **Net revenue** | 90,825 − 45,000 | **$45,825/yr** |
| Verra eligible | additionality 0.71 ≥ 0.6, permanence 0.775 ≥ 0.5, VM0007 available | **Yes** |
| Gold Standard | additionality 0.71 ≥ 0.70, eco_stability 0.85 ≥ 0.75 | **Yes** |

### 7.5 Data provenance & limitations

- **No synthetic/PRNG data.** Module-level comment declares all embedded numbers "deterministic
  model parameters — NOT entity-reported figures"; the only non-standard `hash()` use is a stable
  synthetic bond label when no `bond_id` is given (not a numeric input).
- Sequestration uses the ecosystem *mean* rate only — no site-specific measurement, soil-core
  data, or age-dependent accumulation curves; kelp/seagrass permanence is scientifically
  contested and flagged "Under development" for methodology.
- OA VaR uses linear damage factors keyed only to aragonite saturation and a single fisheries
  impact %; no depth/latitude resolution, species mix, or temporal path.
- ICMA alignment is a simple category-average — it does not test actual project-level use of
  proceeds, management, or reporting quality (the ICMA Principles' four components).
- BBNJ scores are entity-self-disclosed 0–1 values, not independently assessed; the treaty is not
  yet in force (entry-into-force targets 2025–2026 in the reference data).
- Adaptation cost is a flat 25% of VaR; SDG14 gap and greenium recommendations are heuristics.

### 7.6 Framework alignment

- **ICMA Blue Bond Principles (2023)** — use-of-proceeds category eligibility, external-review
  trigger and reporting-frequency ladder mirror the four Green/Blue Bond Principle components;
  the engine scores category alignment, not full process conformance.
- **UNEP-FI Sustainable Ocean Finance (2021)** — 6 SOF pillars with weighted aggregation; tiers
  leader/progressing/emerging; Poseidon Principles and Sustainable Blue Economy (SEA) pledge
  eligibility flags.
- **Blue Carbon Initiative / IPCC AR6 & SROCC** — ecosystem sequestration rates and carbon
  stocks are the published mangrove/seagrass/saltmarsh figures; Verra VM0007/VM0033 methodology
  references; buffer-pool risk deduction as Verra requires.
- **BBNJ / High Seas Treaty (2023)** — the five substantive article areas (MGR & benefit-sharing,
  EIA, ABMT/MPA, capacity building, financial mechanism) scored against self-reported indicators.
- **IPCC AR6 Chapter 3 (Ocean)** — RCP pH-change and aragonite-saturation trajectories drive the
  physical impact factors behind the OA VaR.
- **OECD Ocean Finance Framework (2022)** — adaptation-cost ratio (25% of loss) and the $175bn
  SDG14 financing gap.
- **Kunming-Montreal GBF Target 3 (30×30)** — referenced in the MPA use-of-proceeds category.

## 9 · Future Evolution

### 9.1 Evolution A — Site-specific blue carbon and depth-resolved OA VaR (analytics ladder: rung 1 → 3)

**What.** A clean tier-A domain (E68): five ocean-finance calculators (ICMA Blue Bond screening,
blue carbon economics, BBNJ compliance, ocean-acidification VaR, SOF portfolio aggregation) on
strict honest-null discipline — every entity input is caller-supplied or returned `None` with a
`data_flags` entry, and the module comment declares all embedded numbers "deterministic model
parameters, NOT entity-reported." §7.5 names the deepening targets: blue-carbon sequestration uses
the ecosystem *mean* rate only (no site-specific measurement, soil-core data, or age-dependent
accumulation curves); the OA VaR uses linear damage factors keyed only to aragonite saturation and
a single fisheries impact %, with no depth/latitude/species resolution; and ICMA alignment is a
category-average that doesn't test project-level process conformance. Evolution A adds site-specific
blue-carbon inputs (measured seq rates, age curves) and a depth/latitude-resolved OA damage model.

**How.** `assess_blue_carbon` accepts optional measured sequestration and an accumulation curve
(overriding the ecosystem mean); `assess_ocean_acidification_risk` gains regional/depth resolution
in the aragonite-to-damage mapping and a species-mix input. Rung 3: calibrate sequestration rates
against Verra VM0007/VM0033 project data and OA damage factors against IPCC AR6 Ch.3 regional
projections (the reference table is already faithfully encoded).

**Prerequisites (hard).** Fix the lineage-harness failures — §4.2 shows `POST /bbnj-compliance`,
`/blue-carbon`, `/ocean-acidification` all **skipped** (they need input payloads to trace); the
kelp/seagrass permanence is scientifically contested and correctly flagged "Under development" —
keep that flag. **Acceptance:** the §7.4 mangrove worked example ($45,825/yr net revenue, Verra +
Gold Standard eligible) reproduces at the ecosystem mean; supplying a measured seq rate overrides
the mean; OA VaR responds to region/depth, not just aragonite saturation.

### 9.2 Evolution B — Ocean-finance analyst with tool-called screening (LLM tier 2)

**What.** A tool-calling analyst for blue-finance teams: "screen this blue bond against ICMA
Principles" (`/screen-bond`), "value this mangrove blue-carbon project" (`/blue-carbon`), "assess
BBNJ compliance" (`/bbnj-compliance`), "what's our ocean-acidification VaR under RCP8.5?" (`/ocean-
acidification`), and "aggregate our SOF portfolio score" (`/ocean-portfolio`) — narrating the
engine's real outputs and its honest nulls (greenium is only market-observed input, never derived;
OA VaR is null without exposure).

**How.** Tool schemas from the 6 POST + 5 GET operations; the five reference endpoints (ecosystems,
use-of-proceeds, BBNJ articles, SOF pillars, ocean markets) are ideal RAG grounding for "what's the
mangrove sequestration rate?" or "what does BBNJ Art. 17 require?" questions — a tier-1 explainer
over a tier-2 operator. The no-fabrication validator checks every tCO₂, dollar and score against
tool output; the copilot must respect the engine's honest-null design (e.g. it cannot state a
greenium unless the caller observed one).

**Prerequisites.** Evolution A's harness traces (working POST endpoints for tool-calling); Atlas +
reference corpus embedded (roadmap D3). **Acceptance:** every figure cited traces to an engine tool
call; the blue-carbon net revenue matches `/blue-carbon` exactly; a greenium question without an
observed input returns the engine's null with the copilot explaining greenium requires market
observation, not derivation from alignment.