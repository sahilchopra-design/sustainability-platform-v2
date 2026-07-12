# Corporate Nature Strategy
**Module ID:** `corporate-nature-strategy` · **Route:** `/corporate-nature-strategy` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Assesses corporate nature strategies against TNFD LEAP framework and SBTN corporate targets, mapping business dependencies and impacts on nature across freshwater, terrestrial, marine, and atmospheric systems. Provides gap analysis against nature-positive commitments and biodiversity target pathways.

> **Business value:** Enables sustainability strategy teams to build and disclose credible nature strategies aligned with TNFD disclosure requirements and SBTN corporate targets, responding to growing investor demand for nature-positive commitments.

**How an analyst works this module:**
- Configure business activities and operational sites in the Settings panel
- LEAP Framework tab guides through Locate, Evaluate, Assess, Prepare stages
- Dependency Map tab shows ecosystem service dependencies by business segment and geography
- Impact Assessment tab quantifies MSA footprint and links to SBTN corporate targets
- Nature Strategy Gap Analysis compares commitments to TNFD/SBTN requirements
- Report Builder generates TNFD-aligned nature disclosure narrative and data tables

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `ITEMS`, `RATING_BY_TIER`, `REGION_TO_COUNTRY`, `SECTOR_TO_ENGINE_KEY`, `SECTOR_TO_HABITAT`, `SECTOR_TO_LAND_USE`, `StatusBadge`, `TNFD_GOV_KEYS`, `TNFD_METRIC_KEYS`, `TNFD_RISK_KEYS`, `TNFD_STRAT_KEYS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';const NATURE_API=`${API}/api/v1/corporate-nature-strategy`;` |
| `ITEMS` | `Array.from({length:55},(_,i)=>({id:i+1,name:'Nature Strategy '+(i+1),sector:F1[Math.floor(sr(i*3)*F1.length)],region:F2[Math.floor(sr(i*7)*F2.length)],score:+(sr(i*11)*40+50).toFixed(1),rating:['AAA','AA','A','BBB','BB',` |
| `REGION_TO_COUNTRY` | `{'North America':'US','Europe':'DE','Asia-Pacific':'SG','Latin America':'BR','Africa':'ZA','Oceania':'AU'};` |
| `TNFD_STRAT_KEYS` | `['nature-related_risks_and_opportunities','business_model_impacts','scenario_analysis','transition_planning'];` |
| `TNFD_METRIC_KEYS` | `['land/water/ocean_use_metrics','biodiversity_footprint','ecosystem_services_dependency','targets_and_progress'];` |
| `areaHa` | `Math.round(item.value*0.6+item.pct1*8);` |
| `gapsCount` | `(tnfd.mandatory_gaps_count\|\|0)+(tnfd.optional_gaps_count\|\|0);` |
| `settled` | `await Promise.allSettled(ITEMS.map(item=>axios.post(`${NATURE_API}/full-assessment`,itemToNaturePayload(item),{timeout:15000})));` |
| `filtered` | `useMemo(()=>{let d=[...enrichedItems];if(search)d=d.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));if(f1!=='All')d=d.filter(x=>x.sector===f1);if(f2!=='All')d=d.filter(x=>x.region===f2);d.sort((a,b)=>sortDir==='asc'?((a[sortCol]>b[sortCol])?1:-1):((a[sortCol]<b[sortCol])?1:-1));return d;},[enrichedItems,search,sortCol,sortD` |
| `kpis` | `useMemo(()=>{const n=filtered.length\|\|1;return[{l:'Companies',v:filtered.length},{l:'Avg Score',v:(filtered.reduce((s,x)=>s+parseFloat(x.score),0)/n).toFixed(1)},{l:'Avg Coverage',v:(filtered.reduce((s,x)=>s+parseFloat(x` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/corporate-nature-strategy/sbtn-steps` | `sbtn_steps` | api/v1/routes/corporate_nature_strategy.py |
| POST | `/api/v1/corporate-nature-strategy/tnfd-disclosure` | `tnfd_disclosure` | api/v1/routes/corporate_nature_strategy.py |
| POST | `/api/v1/corporate-nature-strategy/nrl-exposure` | `nrl_exposure` | api/v1/routes/corporate_nature_strategy.py |
| POST | `/api/v1/corporate-nature-strategy/encore-dependencies` | `encore_dependencies` | api/v1/routes/corporate_nature_strategy.py |
| POST | `/api/v1/corporate-nature-strategy/full-assessment` | `full_assessment` | api/v1/routes/corporate_nature_strategy.py |
| GET | `/api/v1/corporate-nature-strategy/ref/sbtn-sectors` | `ref_sbtn_sectors` | api/v1/routes/corporate_nature_strategy.py |
| GET | `/api/v1/corporate-nature-strategy/ref/tnfd-metrics` | `ref_tnfd_metrics` | api/v1/routes/corporate_nature_strategy.py |
| GET | `/api/v1/corporate-nature-strategy/ref/nrl-habitats` | `ref_nrl_habitats` | api/v1/routes/corporate_nature_strategy.py |
| GET | `/api/v1/corporate-nature-strategy/ref/encore-services` | `ref_encore_services` | api/v1/routes/corporate_nature_strategy.py |
| GET | `/api/v1/corporate-nature-strategy/ref/gbf-countries` | `ref_gbf_countries` | api/v1/routes/corporate_nature_strategy.py |
| GET | `/api/v1/corporate-nature-strategy/ref/maturity-tiers` | `ref_maturity_tiers` | api/v1/routes/corporate_nature_strategy.py |

### 2.3 Engine `corporate_nature_strategy_engine` (services/corporate_nature_strategy_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CorporateNatureStrategyEngine.assess_sbtn_steps` | entity_id, sectors, locations, current_targets, disclosures | Score SBTN 5-step readiness (Assess/Interpret/Measure/Set/Disclose). Each step scored 0-100. MSA.km² footprint estimated from locations. High-impact sectors and material locations flagged. SBTN Step Guidance v1.1 (2023): Step 1 Assess — prioritise with SBTN materiality tool Step 2 Interpret — understand state of nature at material locations Step 3 Measure — measure baseline biodiversity state Step |
| `CorporateNatureStrategyEngine.assess_tnfd_disclosure` | entity_id, governance_data, strategy_data, risk_data, metrics_data | Score TNFD v1.0 disclosure across 4 pillars and 14 core metrics. Returns pillar scores (0-100), composite TNFD score, and gap list. TNFD v1.0 Sep 2023: 4 pillars, 14 recommended disclosures R1-R14. |
| `CorporateNatureStrategyEngine.assess_nrl_exposure` | entity_id, operations, supply_chain_countries | Assess EU Nature Restoration Law 2024/1991 habitat exposure. Estimates restoration liability and compliance timeline per Art 4-12. |
| `CorporateNatureStrategyEngine.assess_gbf_target3` | entity_id, portfolio_locations | Assess portfolio exposure within 30x30 protected areas per GBF Target 3. Returns % exposure in protected zones by country and financial exposure estimate. GBF Target 3 (KM-GBF 2022): 30% of land and 30% of oceans under effective protection by 2030. |
| `CorporateNatureStrategyEngine.assess_encore_dependencies` | entity_id, sector, operations_data | Score 21 ENCORE ecosystem service dependencies and impacts. Returns dependency/impact scores and financial exposure matrix. ENCORE v2.1 (2023): Natural Capital Finance Alliance / UNEP-WCMC. Maps sector activities to ecosystem service dependencies and impacts. |
| `CorporateNatureStrategyEngine.run_full_assessment` | entity_id, request_data | Orchestrate all 5 sub-assessments and compute composite nature_strategy_score. Weights: SBTN 35% + TNFD 30% + NRL 15% + GBF 10% + ENCORE 10% |
| `CorporateNatureStrategyEngine.ref_sbtn_sectors` |  |  |
| `CorporateNatureStrategyEngine.ref_tnfd_metrics` |  |  |
| `CorporateNatureStrategyEngine.ref_nrl_habitats` |  |  |
| `CorporateNatureStrategyEngine.ref_encore_services` |  |  |
| `CorporateNatureStrategyEngine.ref_gbf_countries` |  |  |
| `CorporateNatureStrategyEngine.ref_maturity_tiers` |  |  |
| `get_engine` |  | Return a module-level singleton engine. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `TNFD_GOV_KEYS`, `TNFD_METRIC_KEYS`, `TNFD_RISK_KEYS`, `TNFD_STRAT_KEYS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Nature Dependency Score | — | TNFD LEAP / ENCORE | Composite score of business dependency on ecosystem services across value chain |
| Biodiversity Footprint | — | GLOBIO/IBAT | Mean Species Abundance impact area in km², measuring terrestrial biodiversity footprint |
| High-Value Biodiversity Sites | — | KBA Database / IBAT | Number of Key Biodiversity Areas within 50km of company operational sites |
| SBTN Target Gap | — | SBTN Framework | Gap between current nature impact trajectory and science-based nature target by 2030 |
| Ecosystem Service Dependency | — | ENCORE Tool | Proportion of business revenue dependent on high-to-very-high ecosystem service sensitivity |
- **IBAT / KBA database** → Match operational sites to biodiversity sensitivity and KBA proximity → **Site-level biodiversity exposure scores**
- **ENCORE ecosystem service tool** → Map business activities to ecosystem service dependencies by sector → **Dependency scores per business segment**
- **SBTN target pathways** → Compare impact trajectory to sector-specific targets, compute gap → **SBTN target gap % and nature strategy alignment score**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/corporate-nature-strategy/ref/encore-services** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'encore_services', 'total_services', 'source'], 'n_keys': 4}`

**GET /api/v1/corporate-nature-strategy/ref/gbf-countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'gbf_target3_countries', 'total_countries', 'target'], 'n_keys': 4}`

**GET /api/v1/corporate-nature-strategy/ref/maturity-tiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'maturity_tiers'], 'n_keys': 2}`

**GET /api/v1/corporate-nature-strategy/ref/nrl-habitats** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'nrl_habitats', 'regulation'], 'n_keys': 3}`

**GET /api/v1/corporate-nature-strategy/ref/sbtn-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'sbtn_sector_impact_map'], 'n_keys': 2}`

**GET /api/v1/corporate-nature-strategy/ref/tnfd-metrics** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'tnfd_metrics', 'total_metrics'], 'n_keys': 3}`

**POST /api/v1/corporate-nature-strategy/encore-dependencies** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/corporate-nature-strategy/full-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** TNFD LEAP Nature Risk Assessment
**Headline formula:** `Nature_exposure = Σ_i (Dependency_i × Ecosystem_condition_i × Location_sensitivity_i)`

LEAP (Locate, Evaluate, Assess, Prepare) methodology structures the nature risk process. Dependency scores assess materiality of each ecosystem service to business operations (water provision, pollination, climate regulation, soil quality). Ecosystem condition sourced from WWF Living Planet Index and IBAT biodiversity sensitivity layers. Location sensitivity weights dependencies by proximity to high-biodiversity-value areas.

**Standards:** ['TNFD v1.0 2023', 'SBTN Corporate Targets 2023', 'IPBES Global Assessment']
**Reference documents:** TNFD Nature-Related Financial Disclosures v1.0 (2023); SBTN Step 2 Corporate Targets for Nature (2023); IPBES Global Assessment on Biodiversity and Ecosystem Services (2019); WWF Living Planet Index 2024; ENCORE Exploring Natural Capital Opportunities, Risks and Exposure Tool

**Engine `corporate_nature_strategy_engine` — extracted transformation lines:**
```python
area_km2 = area_ha / 100.0
mandatory_score = (mandatory_met / mandatory_total * 80) if mandatory_total > 0 else 0
optional_score = (optional_met / optional_total * 20) if optional_total > 0 else 20
pillar_scores[pillar] = round(mandatory_score + optional_score, 1)
composite_score = round(sum(pillar_scores.values()) / len(pillar_scores), 1)
liability_ha = area_ha * degradation_assumed * restoration_pct_2030
estimated_financial_liability_eur = total_restoration_liability_ha * restoration_cost_per_ha
in_protected = exposure_m * (protected_pct / 100.0)
portfolio_protected_pct = (in_protected_zone_m / total_exposure_m * 100) if total_exposure_m > 0 else 0
gbf_score = round(100 - (risk_countries_count / total_countries * 40), 1) if total_countries > 0 else 100
base_dependency = min(100, base_dependency * 1.8)
impact_score = round(min(100, dependency_score * (1.5 if is_affected else 0.4)), 1)
mid_val_usd_ha_yr = (low_val + high_val) / 2.0
financial_exposure_m = (operational_area_ha * mid_val_usd_ha_yr / 1_000_000.0) * (dependency_score / 100.0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (frontend↔engine disconnect).** This is a tier-A module with a genuinely
> production-grade backend (`corporate_nature_strategy_engine.py`) implementing SBTN 5-step scoring, TNFD
> LEAP disclosure scoring, ENCORE dependency weights, MSA.km² footprint, EU NRL exposure, and a weighted
> composite (SBTN 35% + TNFD 30% + NRL 15% + GBF 10% + ENCORE 10%). **But the frontend page does not call
> that engine.** `CorporateNatureStrategyPage.jsx` renders **55 generic `sr()`-seeded "Nature Strategy N"
> items** — every displayed score, coverage %, TNFD score, risk, and dependency is a random draw, and the
> named ref/assessment routes (`/full-assessment`, `/encore-dependencies`, `/ref/*`) are not wired into
> the page. So the guide's TNFD-LEAP methodology is *real in the engine* but *absent from the UI*, which
> shows fabricated numbers. §7.1–7.4 document the seeded frontend; §7.5–7.6 document the real engine (the
> model the page *should* surface — no separate §8 needed, the model exists).

### 7.1 What the frontend computes (seeded)

The page generates 55 items with all fields independently `sr()`-seeded, then averages the filtered set:

```js
score      = sr(i·11)·40 + 50        // 50–90
coverage   = sr(i·17)·30 + 60        // 60–90 %
risk       = sr(i·19)·50 + 10        // 10–60
compliance = sr(i·23)·40 + 50        // "TNFD Score" 50–90
impact     = sr(i·29)·60 + 20
rating     = ['AAA'..'B'][floor(sr(i·13)·6)]
kpis.avgScore = mean(score); kpis.aligned = |compliance > 70|
```

There is no LEAP, no dependency matrix, no MSA footprint — the "TNFD Score" is `sr(i·23)·40+50`, a random
number. The 12-point trend series (`TS`) is likewise seeded.

### 7.2 Parameterisation (frontend)

| Field | Generator | Provenance |
|---|---|---|
| `score`, `coverage`, `risk`, `compliance`, `impact` | `sr(i·k)·span + base` | Synthetic seeded PRNG |
| `rating` | `['AAA','AA','A','BBB','BB','B'][floor(sr·6)]` | Synthetic seeded PRNG |
| `pct1` (biodiversity dep), `pct2` (ecosystem service) | `sr()`-scaled | Synthetic seeded PRNG |
| `flag1` (TNFD aligned), `flag2` (SBTN committed) | `sr() > threshold` | Synthetic seeded PRNG |
| sector / region | `F1/F2[floor(sr·len)]` | Synthetic assignment |

### 7.3 Calculation walkthrough (frontend)

`ITEMS` seeded once → `filtered` (search/sector/region) → `kpis` average the seeded fields → four tabs
(dashboard, company table with expandable radar, TNFD alignment charts, action tracker) render the
constants. No user action changes a score; filters only subset the seeded universe.

### 7.4 Worked example (frontend)

Item `i = 1`: `score = sr(11)·40 + 50`. `sr(11) = frac(sin(12)·10⁴)`; `sin(12 rad) = −0.5366`, ×10⁴ =
−5365.7, frac ≈ 0.434 ⇒ `score = 0.434·40 + 50 = 67.4`. Its `compliance` ("TNFD Score") uses `sr(1·23)`,
an unrelated seed → an independent 50–90 value. The radar in the drill-down plots these seeded fields
against a fixed 0–100 axis; none reflect a real nature assessment.

### 7.5 The real engine (what the module *should* surface)

`corporate_nature_strategy_engine.py` implements the guide's methodology faithfully:

- **SBTN 5-step scoring** (each step 0–100, from *disclosure booleans*, not random): Step 1 Assess
  (`materiality_screening +40`, `leap_locate +30`, `min(30, locations·5)`); Step 2 Interpret (ENCORE
  dependency +35, state-of-nature +35, scenario +30); Step 3 Measure (MSA footprint +40, biodiversity +35,
  water +25); Step 4 Set targets (SBTN target +30, land +35, freshwater +35); Step 5 Disclose (TNFD +40,
  annual progress +35, third-party verification +25).
- **MSA.km² footprint:** `Σ_loc (area_ha/100) × (1 − MSA_factor(land_use))` — GLOBIO-style mean-species-
  abundance loss, with land-use MSA factors (intensive agriculture 0.30, pasture 0.35…).
- **ENCORE dependency weights** per sector (financial_dependency_weight 0.02–0.14) and a
  **`SBTN_SECTOR_IMPACT_MAP`** classifying 11 sectors by primary/secondary impact drivers (land use, water,
  pollution, overexploitation, invasive species, climate change) and tier-1/tier-2 SBTN priority.
- **Composite:** `SBTN 0.35 + TNFD 0.30 + NRL 0.15 + GBF 0.10 + ENCORE 0.10`, bucketed into 5 maturity
  tiers (80–100 leader … 0–19 nascent).
- Routes expose `/ref/sbtn-sectors`, `/ref/tnfd-metrics`, `/ref/encore-services`, `/ref/gbf-countries`,
  `/ref/nrl-habitats`, `/ref/maturity-tiers`, `POST /encore-dependencies`, `POST /full-assessment`.

### 7.6 Data provenance & limitations

- **Frontend: 100% synthetic**, from `sr(seed)=frac(sin(seed+1)×10⁴)`. The displayed "TNFD Score" is not
  a TNFD score — it is a random draw. This is the module's central defect: a real engine exists but is
  bypassed.
- **Engine: standards-based and disclosure-driven** — scores derive from company disclosure booleans and
  location/target data, not random numbers. It is production-ready but requires real company disclosures as
  input; MSA factors and dependency weights are literature-sourced (GLOBIO, ENCORE v2.1).
- Remediation: wire the page's table to `POST /full-assessment` and the `/ref/*` endpoints so displayed
  scores are engine outputs, not seeded placeholders.

**Framework alignment:** *TNFD v1.0 (Sep 2023)* — the LEAP approach (Locate, Evaluate, Assess, Prepare) and
14 disclosure metrics are scored in the engine. *SBTN Step Guidance v1.1 (2023)* — the 5-step Assess→
Interpret→Measure→Set→Disclose process is the engine's spine. *ENCORE v2.1* (UNEP-WCMC/NCFA) supplies
ecosystem-service dependency materiality by sector. *CBD Kunming-Montreal GBF Target 3 (30×30)* and *EU
Nature Restoration Law (EU) 2024/1991* provide the NRL/GBF exposure legs. *GLOBIO/MSA* underpins the
biodiversity-footprint metric. The engine calculates all of these; the frontend currently displays none of
them.

## 9 · Future Evolution

### 9.1 Evolution A — Surface the production-grade engine the page ignores (analytics ladder: rung 1 → 2)

**What.** §7 documents a frontend↔engine disconnect: the backend
(`corporate_nature_strategy_engine.py`) faithfully implements the guide — SBTN 5-step
disclosure-boolean scoring, GLOBIO-style MSA.km² footprint
(`Σ (area_ha/100)×(1−MSA_factor)`), ENCORE sector dependency weights, EU NRL
exposure, and the 35/30/15/10/10 composite with maturity tiers — while the page
renders 55 `sr()`-seeded "Nature Strategy N" items whose displayed "TNFD Score" is
literally a random draw. §7.6 names the remediation: wire the table to
`POST /full-assessment` and the six `/ref/*` endpoints (all of which already pass the
harness). Evolution A is that wiring plus a real input path.

**How.** (1) Fix `POST /full-assessment` (harness status `failed`) and fixture
`/encore-dependencies` (skipped). (2) Replace the seeded ITEMS array with an
assessment workflow: the Settings panel's business-activities/sites configuration
becomes the engine's input payload (locations, land-use classes for MSA, disclosure
booleans per SBTN step); scores render from the engine response with the composite's
five components inspectable. (3) LEAP tab drives the four stages against
`/ref/tnfd-metrics` and `/ref/encore-services` reference data instead of decoration.
(4) Scenario step (rung 2): the engine's Step-2 scenario input becomes a real toggle —
GBF-country policy stringency from `/ref/gbf-countries` varying the NRL/GBF
components. (5) Persist assessments so maturity progression is trackable.

**Prerequisites (hard).** Full frontend PRNG purge; the `/full-assessment` fix; a
disclosure-input UX (the engine needs real company disclosures — honest empty states
until entered). **Acceptance:** every displayed score reproduces via
`POST /full-assessment`; the §7.5 composite weights are visible in the drill-down;
entering a third-party-verification boolean moves Step 5 by exactly +25.

### 9.2 Evolution B — TNFD disclosure drafter over LEAP outputs (LLM tier 2)

**What.** The overview's last promise — "Report Builder generates TNFD-aligned nature
disclosure narrative" — is the canonical tier-2 drafting task, and this module is
unusually ready for it: the engine's `tnfd-disclosure` endpoint already scores the
four TNFD pillars from disclosure data. Evolution B drafts the narrative: governance,
strategy, risk-and-impact management, and metrics sections written from the
(post-Evolution A) assessment payload — dependency materiality from the ENCORE
weights, MSA footprint with its land-use decomposition, SBTN target status — each
number quoted from the engine, gaps disclosed as gaps.

**How.** Tool-calling over the module's 11 operations: the drafter runs
`POST /full-assessment` and `POST /tnfd-disclosure`, then writes sections only where
component scores evidence content, using `/ref/tnfd-metrics` as the disclosure-
requirement checklist. The fabrication validator covers hectares, MSA.km², and
percentages. Rendering through the report-studio layer; drafts versioned with the
engine's composite so a re-assessment visibly changes the narrative.

**Prerequisites (hard).** Evolution A — drafting TNFD disclosures from the current
seeded page would fabricate a regulatory document; real company disclosure inputs
entered. **Acceptance:** every numeric in a draft matches the assessment payload;
LEAP stages without data produce explicit "not yet assessed" language; the draft's
metric table enumerates exactly the `/ref/tnfd-metrics` core metrics with values or
honest nulls.