# NbS Finance
**Module ID:** `nbs-finance` · **Route:** `/nbs-finance` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses the financing landscape for Nature-based Solutions including blue carbon, green carbon, biodiversity credits, ecosystem service payments, and blended finance structures.

> **Business value:** Enables development finance institutions, conservation funds, and impact investors to evaluate, structure, and monitor NbS investments that deliver combined climate, biodiversity, and social co-benefits.

**How an analyst works this module:**
- Identify NbS project categories: afforestation, mangrove restoration, peatland conservation, grassland management
- Model carbon sequestration potential using IPCC Tier 2/3 land-use emission factors
- Quantify co-benefits: biodiversity, water regulation, coastal protection, livelihood
- Structure blended finance: grant de-risking, first-loss tranche, carbon credit pre-purchase

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `BIOME_OPTIONS`, `Badge`, `Btn`, `Inp`, `KpiCard`, `PIE_COLORS`, `PROJECT_OPTIONS`, `Row`, `Section`, `Sel`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `BIOME_OPTIONS` | 9 | `label` |
| `PROJECT_OPTIONS` | 8 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `TABS` | `['IUCN NbS Standard', 'Carbon Co-benefits', 'Biodiversity & Water', 'Economics & Finance', 'Blended Finance'];` |
| `composite` | `Math.round(criteria.reduce((s, c) => s + c.score, 0) / criteria.length);` |
| `seqRate` | `Math.round(seed(bi * 37 + pi * 3) * 8 + 2);` |
| `areaHa` | `Math.round(seed(bi * 41 + pi * 7) * 40000 + 5000);` |
| `seqTotal` | `Math.round((seqRate * areaHa) / 1000);` |
| `creditEligible` | `Math.round(seqTotal * (seed(bi * 43) * 0.3 + 0.6));` |
| `priceUsd` | `Math.round(seed(bi * 47 + pi * 11) * 30 + 8);` |
| `species` | `Math.round(seed(bi * 53 + pi * 3) * 200 + 50);` |
| `habitatHa` | `Math.round(seed(bi * 57 + pi * 7) * 15000 + 1000);` |
| `msaUplift` | `parseFloat((seed(bi * 59 + pi * 11) * 25 + 5).toFixed(1));` |
| `watershedM3` | `Math.round(seed(bi * 61 + pi * 13) * 500000 + 50000);` |
| `gbfContribution` | `Math.round(seed(bi * 67 + pi * 17) * 30 + 50);` |
| `totalInv` | `parseFloat((seed(bi * 71 + pi * 3) * 80 + 20).toFixed(1));` |
| `carbonRev` | `parseFloat((seed(bi * 73 + pi * 7) * 15 + 3).toFixed(1));` |
| `ecoSvcRev` | `parseFloat((seed(bi * 79 + pi * 11) * 10 + 2).toFixed(1));` |
| `npv` | `parseFloat(((carbonRev + ecoSvcRev) * 12 - totalInv).toFixed(1));` |
| `irr` | `parseFloat((seed(bi * 83 + pi * 13) * 10 + 5).toFixed(1));` |
| `payback` | `parseFloat((totalInv / (carbonRev + ecoSvcRev)).toFixed(1));` |
| `total` | `parseFloat((seed(bi * 89 + pi * 3) * 60 + 15).toFixed(1));` |
| `publicM` | `parseFloat((total * (seed(bi * 97) * 0.2 + 0.3)).toFixed(1));` |
| `philM` | `parseFloat((total * (seed(bi * 101) * 0.1 + 0.1)).toFixed(1));` |
| `privateM` | `parseFloat((total - publicM - philM).toFixed(1));` |
| `gcfEligible` | `seed(bi * 103 + pi) > 0.35;` |
| `bankability` | `seed(bi * 107 + pi) > 0.6 ? 'Investment Grade' : seed(bi * 107 + pi) > 0.35 ? 'Near Bankable' : 'Pre-Bankable';` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/nbs-finance/blended-finance` | `blended_finance` | api/v1/routes/nbs_finance.py |
| GET | `/api/v1/nbs-finance/ref/iucn-criteria` | `ref_iucn_criteria` | api/v1/routes/nbs_finance.py |
| GET | `/api/v1/nbs-finance/ref/nbs-categories` | `ref_nbs_categories` | api/v1/routes/nbs_finance.py |
| GET | `/api/v1/nbs-finance/ref/gbf-target-2` | `ref_gbf_target_2` | api/v1/routes/nbs_finance.py |

### 2.3 Engine `nbs_finance_engine` (services/nbs_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_iucn_composite` | scores | Calculate IUCN composite score and assign NbS tier. |
| `_carbon_cobenefit` | category, area_ha, duration_years, standard_key, seq_rate_override, credit_price_override | Calculate carbon co-benefit metrics. Sequestration rate and credit price default to the category/standard empirical 'typical' values (documented model defaults from the reference tables above) and can be overridden with measured/contracted values supplied by the caller. |
| `_biodiversity_cobenefit` | category, area_ha, iucn_tier, species_density_per_100ha, red_list_species, habitat_quality_score | Calculate biodiversity co-benefit metrics. MSA uplift is a deterministic function of the category biodiversity rating and the IUCN tier (documented model constants). Species counts and habitat-quality require a survey input; when absent they are reported as null rather than fabricated. |
| `_water_cobenefit` | category, area_ha, flood_risk_reduction_ha, groundwater_recharge_m3_yr, erosion_reduction_tonnes_yr | Calculate water co-benefit metrics. Watershed protection uses a per-hectare yield keyed to the category water rating (documented model constant). Flood/groundwater/erosion figures require a hydrological estimate; when absent they are reported as null rather than fabricated. |
| `_social_cobenefit` | category, area_ha, has_indigenous_lands, fpic_obtained, livelihoods_supported, gender_inclusion_score, jobs_created_direct, jobs_created_indirect | Calculate social co-benefit metrics. 'communities_benefited' uses the category social rating (documented model constant). Livelihoods, gender score, and job counts are project-reported figures; when absent they are reported as null rather than fabricated. |
| `_vcmi_assessment` | iucn_composite, has_mrv, ndc_aligned | Derive VCMI integrity score and claim tier. Deterministic: score = 0.7*IUCN composite + MRV bonus + NDC bonus. The former random +/-5 noise term (which made the headline integrity score non-reproducible) has been removed. |
| `_economics` | total_investment_m, annual_maintenance_m, carbon_seq_tco2_yr, vcm_price, area_ha, duration_years, ecosystem_service_revenue_m_yr |  |
| `_irr_estimate` | capex_m, annual_cashflow_m, years | Estimate IRR via bisection method. |
| `_blended_finance_structure` | total_cost_m, public_m, private_m, philanthropic_m, gcf_eligible, category_key, country |  |
| `_convergence_archetype` | ratio |  |
| `_nbs_quality_score` | iucn_composite, has_mrv, ndc_aligned, fpic_obtained, economics | Overall NbS quality score and bankability tier. |
| `assess_nbs_project` | req | Full IUCN NbS v2.0 assessment with all co-benefits and economics. |
| `_compliance_flags` | req, iucn_tier |  |
| `_generate_recommendations` | iucn_composite, econ, vcmi, req |  |
| `calculate_blended_finance` | req | Blended finance structuring for NbS projects. |
| `get_nbs_benchmarks` |  | Return NbS category benchmarks and reference data. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `IUCN`, `__future__` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `BIOME_OPTIONS`, `PIE_COLORS`, `PROJECT_OPTIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| NbS Investment Gap (2030) | — | UNEP Finance for Nature 2023 | Annual NbS investment shortfall relative to what is required to achieve biodiversity and climate targets by 2030. |
| Blue Carbon Credit Value | — | Ecosystem Marketplace 2024 | Market price range for high-quality blue carbon (mangrove, seagrass, salt marsh) credits in voluntary markets. |
- **Project documentation, IPCC land-use emission factors, carbon registry data, biodiversity credit prices** → Sequestration modelling, co-benefit quantification, blended finance structuring → **Project finance models, NbS credit analytics, blended finance structure templates**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/nbs-finance/ref/gbf-target-2** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['gbf_target_2', 'gcf_nbs_support', 'cross_framework_links'], 'n_keys': 3}`

**GET /api/v1/nbs-finance/ref/iucn-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['standard', 'edition', 'total_criteria', 'scoring_note', 'criteria'], 'n_keys': 5}`

**GET /api/v1/nbs-finance/ref/nbs-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['nbs_categories', 'carbon_credit_standards', 'global_nbs_market'], 'n_keys': 3}`

**GET /api/v1/nbs-finance/ref/vcmi-claims** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'version', 'published', 'purpose', 'integrity_score_range', 'claims'], 'n_keys': 6}`

**POST /api/v1/nbs-finance/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/nbs-finance/blended-finance** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** NbS Return on Conservation
**Headline formula:** `NbS-ROC = (EcosystemServiceValue + CarbonRevenue + BiodiversityCredits) / ConservationCost`

Total economic return on NbS investment combining carbon credit revenue, biodiversity credit income, and ecosystem service payments relative to conservation and restoration expenditure.

**Standards:** ['IUCN NbS Standard 2020', 'Taskforce on Nature Markets 2023']
**Reference documents:** IUCN Global Standard for Nature-based Solutions 2020; UNEP State of Finance for Nature 2023; Ecosystem Marketplace Voluntary Carbon Market Insights 2024; Taskforce on Nature Markets Blueprint 2023

**Engine `nbs_finance_engine` — extracted transformation lines:**
```python
composite = sum(raw[k] * weights[k] for k in raw)
annual_seq = seq_rate * area_ha
total_seq = annual_seq * duration_years
creditable_seq = total_seq * (1 - buffer_pct)
base = iucn_composite * 0.7
vcmi_score = min(100, max(0, base + mrv_bonus + ndc_bonus))
carbon_rev_yr = carbon_seq_tco2_yr * vcm_price / 1_000_000  # USD M
annual_income = carbon_rev_yr + ecosystem_rev_yr
irr = _irr_estimate(total_investment_m, annual_income - annual_cost, duration_years)
payback = total_investment_m / max(annual_income - annual_cost, 0.001)
mid = (lo + hi) / 2
committed = public_m + private_m + philanthropic_m
gap_m = max(0.0, total_cost_m - committed)
gcf_grant_m = min(total_cost_m * 0.40, gap_m) if gcf_eligible else 0.0
catalytic = public_m + philanthropic_m + gcf_grant_m
mob_ratio = private_m / catalytic if catalytic > 0 else 0.0
score = iucn_composite * 0.45
annual_rev = annual_carbon_rev + req.ecosystem_service_revenue_m
net_cashflow_m = annual_rev - req.annual_operating_cost_m
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **46** other module(s).

| Connected module | Shared via |
|---|---|
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `green-hydrogen-lcoh` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |
| `supply-chain-resilience` | table:exc |
| `crrem` | table:exc |
| `climate-underwriting-workbench` | table:exc |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial mismatch.** This tier-A route has a **real backend engine**
> (`nbs_finance_engine.py`) implementing IUCN NbS Global Standard v2.0 (8 weighted criteria), the VCMI
> Core Carbon Claims framework, and GBF Target 2 — reached via `POST /api/v1/nbs-finance/assess` and
> `/blended-finance`. But the **visible frontend page generates its IUCN, carbon, biodiversity/water and
> economics numbers from the `seed()` PRNG**, not from the engine's methodology. So the guide's "NbS
> Return on Conservation" and empirical sequestration story is real in the backend but *synthetic in the
> rendered UI*. Below documents both layers and flags the divergence.

### 7.1 What the module computes

**Frontend (rendered)** — biome × project index drives seeded scores:

```js
bi = BIOME_OPTIONS.index+1;  pi = PROJECT_OPTIONS.index+1
IUCN criterion score = round(seed(bi·k1 + pi·k2)·range + floor)     // 8 criteria, ~45–85
composite = mean(criteria);  tier = ≥80 Transformative / ≥65 Effective / ≥50 Adequate / else Basic
seqRate   = round(seed(bi·37+pi·3)·8 + 2)          // 2–10 tCO₂/ha/yr
seqTotal  = seqRate·areaHa/1000
priceUsd  = round(seed(bi·47+pi·11)·30 + 8)        // $8–38/tCO₂
vcmiTier  = priceUsd≥30 Gold / ≥18 Silver / else Bronze
```

**Backend (`nbs_finance_engine.py`)** — real IUCN GS v2.0: 8 weighted criteria (criterion_1 weight 0.14,
criterion_3 "Biodiversity Net Gain" 0.15 …) scored against key questions, plus a VCMI claim tier
(no_claim/bronze/silver/gold/platinum) and GBF 30×30 alignment.

### 7.2 Parameterisation / scoring rubric

| Layer | Construct | Provenance |
|---|---|---|
| Frontend | All 8 IUCN criterion scores, seqRate, area, price | **Synthetic** (`seed(s)=frac(sin(s+1)·10⁴)`) |
| Frontend | Tier thresholds 80/65/50 | Author (note: 4-tier, differs from IUCN 3-tier Gold/Silver/Bronze) |
| Frontend | VCMI tier by price (≥30 Gold, ≥18 Silver) | Author heuristic — VCMI is **not** price-based (see limitations) |
| Backend | IUCN criterion weights (0.12–0.15, sum 1.0) | IUCN Global Standard v2.0 |
| Backend | VCMI claim tiers | VCMI Core Carbon Claims Framework v1.0 |
| Backend | GBF Target 2 (30×30) | Kunming-Montreal GBF 2022 |

### 7.3 Calculation walkthrough

Frontend: user picks biome + project type → `getIucnData` / `getCarbonData` / `getBioWaterData` seed
scores from the two indices → composite, tier, sequestration, credits eligible, VCM price, VCMI tier →
radar, bars, pie. The economics tab computes NPV/IRR/payback from seeded investment/revenue
(`npv = (carbonRev + ecoSvcRev)·12 − totalInv`; `payback = totalInv/(carbonRev+ecoSvcRev)`). Blended-
finance tab splits a seeded total into public/philanthropic/private tranches. The backend engine (real
IUCN/VCMI math) is invoked via `/assess` but the fallback rendering path is seeded.

### 7.4 Worked example (Mangrove + Blue Carbon, frontend)

`biome=mangrove (bi=3)`, `project=blue_carbon (pi=3)`. Carbon: `seqRate = round(seed(3·37+3·3)·8+2) =
round(seed(120)·8+2)`. If `seed(120)≈0.5` → `seqRate = 6 tCO₂/ha/yr`. `areaHa = round(seed(3·41+3·7)·40000
+5000)`; if ≈20,000 → `seqTotal = 6·20000/1000 = 120 ktCO₂/yr`. `priceUsd = round(seed(3·47+3·11)·30+8)`;
if ≈$25 → **VCMI Silver** (price 18–30). Note the VCMI tier here is decided purely by price, which is not
how VCMI actually works.

### 7.5 Data provenance & limitations

- **The rendered page is PRNG-driven** (`seed()`), so the on-screen IUCN scores, sequestration rates,
  prices and finance metrics are synthetic and re-seed deterministically per biome/project pair.
- **VCMI mis-modelled in the UI:** the frontend maps VCMI tier to *carbon price*, but VCMI's Bronze/Silver/
  Gold/Platinum tiers reflect the *share of a company's residual emissions matched by high-quality credits
  plus a validated science-based target*, not the credit price. The backend engine treats VCMI correctly.
- **Frontend tier ladder (4-tier) diverges** from the IUCN GS 3-tier (Gold/Silver/Bronze) that the backend
  and the standard use.
- The real, sourced methodology lives in the backend; the value gap is wiring the UI to `/assess` rather
  than to the seeded fallback.

**Framework alignment:**
- **IUCN Global Standard for NbS v2.0** — backend: 8 weighted criteria (societal challenge, design scale,
  biodiversity net gain, economic viability, inclusive governance, …) → composite → tier; frontend: same
  criterion labels but seeded scores and a non-standard 4-tier scale.
- **VCMI Core Carbon Claims** — backend implements the claim tiers correctly (target + credit-matching);
  frontend approximates by price (incorrect).
- **GBF Kunming-Montreal Target 2 (30×30)** — restoration/protection area alignment, backend.
- **Verra VCS v4 / Gold Standard / Plan Vivo / Art 6 ITMOs** — referenced as the crediting rails.

## 8 · Model Specification

**Status: specification — not yet implemented in the rendered UI.** The backend engine is real, but the
page shows seeded IUCN/VCMI/sequestration values. The spec below is the production NbS-finance scoring the
UI should surface (largely already present server-side).

### 8.1 Purpose & scope
Assess an NbS project's IUCN GS conformance, expected verified sequestration and credit revenue, VCMI claim
eligibility, and blended-finance bankability, for conservation-fund and DFI investment decisions.

### 8.2 Conceptual approach
Weighted-criteria conformance (IUCN GS v2.0) + a biome-specific empirical sequestration model + VCMI claim
logic. Benchmarks: **IUCN Self-Assessment Tool**, **VCMI Claims Code of Practice**, and rating-agency NbS
credit quality (Sylvera/BeZero). Sequestration uses empirical per-biome ranges (IPCC Tier 2/3, VM0007/33).

### 8.3 Mathematical specification
IUCN composite `S = Σ_{c=1}^{8} w_c·s_c`, `w_c` per standard (Σw=1), `s_c ∈ [0,100]` evidenced; tier
Gold/Silver/Bronze by thresholds; standard-met `S ≥ 70` with safeguards floor. Net credits
`N = seq_rate·area·(1−leakage)·(1−buffer)`, `seq_rate` from biome empirical distribution. Revenue
`R = N·price·(1+cobenefit_premium)`. VCMI tier from `matched = credits_retired / residual_emissions` given a
validated SBT: Platinum ≥100 %, Gold ≥60 %, Silver ≥20 %, Bronze >0 %. NbS-ROC `= (carbon + biodiversity +
ecosystem-service revenue) / conservation cost`.

| Parameter | Source |
|---|---|
| IUCN weights w_c | IUCN GS v2.0 |
| seq_rate by biome | IPCC Tier 2/3, VM0007/VM0033 |
| leakage/buffer | VCS AFOLU Non-Permanence Risk Tool |
| VCMI thresholds | VCMI Claims Code of Practice v1 |
| co-benefit premium | Ecosystem Marketplace CCB premium |

### 8.4 Data requirements
Project documents (baseline, monitoring, SPO), biome, area, SBT status, financing structure. The backend
engine already ingests most; the gap is UI wiring away from the seeded fallback.

### 8.5 Validation & benchmarking plan
Reconcile IUCN composite against IUCN self-assessment outcomes; VCMI tier against VCMI-validated claims;
sequestration against registry-issued credits per hectare for the biome.

### 8.6 Limitations & model risk
Criterion scoring is analyst-subjective; empirical sequestration ranges are wide; VCMI tiering depends on
target validity. Conservative fallback: withhold tier when criteria are incomplete (as the sibling
`nature-based-solutions-finance` engine already does), and use lower-bound sequestration ranges.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the IUCN/VCMI engine into the UI, retire the seeded scores (analytics ladder: rung 2 → 3)

**What.** §7's partial mismatch: this tier-A route has a real backend (`nbs_finance_engine.py`) implementing IUCN NbS Global Standard v2.0 (8 weighted criteria — criterion_1 weight 0.14, criterion_3 "Biodiversity Net Gain" 0.15), the VCMI Core Carbon Claims tiering, and GBF Target 2 alignment, reachable via `POST /assess` and `/blended-finance`. But the rendered page derives its IUCN scores, sequestration, price, and VCMI tier from the `seed()` PRNG (`IUCN score = seed(...)·range + floor`), not the engine. Evolution A connects them and grounds the carbon economics.

**How.** (1) Replace the seeded biome×project score generation with `POST /assess` calls — the engine's real `_iucn_composite` (8 weighted criteria) and `composite = Σ raw[k]·weights[k]` per §5's extracted lines, with tier assignment (Transformative/Effective/Adequate/Basic) computed server-side; the four reference GETs (`/ref/iucn-criteria`, `/ref/nbs-categories`, `/ref/gbf-target-2`, `/ref/vcmi-claims`, all `passed`) drive the input pickers. (2) Ground sequestration in IPCC Tier 2 land-use factors (`annual_seq = seq_rate × area_ha`, `creditable_seq = total_seq × (1−buffer)` per §5) rather than `seed()·8+2`. (3) Feed the engine's real credit volumes into the NbS-ROC formula so return-on-conservation reflects methodology, not randoms.

**Prerequisites.** `POST /assess` currently `failed` and `/blended-finance` `skipped` in the lineage sweep — fix the live errors and REQUIRE_AUTH POST gating first; blast radius is 46 modules (shared engine) so pin regression cases before edits. **Acceptance:** IUCN composite reproduces the engine's weighted sum; no `seed()` call remains in rendered scores; page matches direct `/assess` output.

### 9.2 Evolution B — Blended-finance structuring analyst (LLM tier 2)

**What.** A tool-calling analyst for conservation-fund and DFI users: "assess this mangrove project against IUCN GS v2.0, size a blended-finance structure with 30% first-loss grant, and give me the NbS-ROC" → orchestrates `/assess` (IUCN + VCMI + GBF) then `/blended-finance`, presenting a structuring memo where the tier, criteria gaps, credit volumes, and return are all engine outputs.

**How.** Tool schemas from the module's OpenAPI operations; system prompt from this Atlas page's §5 methodology plus the IUCN GS 2020 and Taskforce on Nature Markets references named in §5. The two-step composition (assess → structure) is the tier-2 value: the analyst explains which IUCN criteria scored low and how the blended structure de-risks them, with a "show work" trail of both calls (roadmap Tier-2 provenance UX). The no-fabrication validator matches every criterion score, credit volume, and ROC figure to a tool response; the engine's honest null-handling must surface as "insufficient data" rather than an invented score.

**Prerequisites (hard).** Evolution A — the copilot must drive the engine, not the seeded frontend; the `/assess` and `/blended-finance` endpoints must return 200s under auth. **Acceptance:** every number in a structuring memo traces to a named endpoint call; requesting assessment for an NbS category outside `/ref/nbs-categories` yields a refusal.