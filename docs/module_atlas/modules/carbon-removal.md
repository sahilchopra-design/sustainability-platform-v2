# Carbon Removal Analytics
**Module ID:** `carbon-removal` · **Route:** `/carbon-removal` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
CDR (Carbon Dioxide Removal) portfolio analytics. Covers BECCS, DAC, enhanced weathering, ocean CDR, biochar, and afforestation. Includes permanence, co-benefits, MRV quality, and cost comparison.

> **Business value:** CDR is unavoidable for Paris Agreement compliance — IPCC scenarios require 5-16 GtCO2/yr of removal by 2050. Companies need CDR for residual emissions in net-zero claims. This module enables rigorous CDR selection, ensuring high permanence and robust MRV before purchase and retirement.

**How an analyst works this module:**
- Technology Overview compares 6 CDR approaches on cost, permanence, co-benefits, scalability
- Portfolio Builder designs CDR credit purchase portfolio
- Permanence Risk assesses reversal probability for nature-based CDR
- MRV Quality scores monitoring and verification approaches
- Cost Curve shows CDR scaling trajectory to 2050 net-zero needs

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CDR_POLICY`, `CDR_TECHNOLOGIES`, `COLORS`, `CORPORATE_BUYERS`, `INTEGRITY_DIMENSIONS`, `KpiCard`, `MARKET_DATA`, `PRICE_HISTORY`, `PROJECTS`, `PROJECT_NAMES_BASE`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CDR_TECHNOLOGIES` | 13 | `name`, `category`, `maturity`, `costLow`, `costHigh`, `potential2030`, `potential2050`, `permanence`, `additionality`, `lca`, `trl`, `energyIntensity`, `water`, `land`, `cobenefits`, `companies`, `scalingRisk`, `annualGrowth` |
| `CORPORATE_BUYERS` | 26 | `sector`, `target2030`, `target2050`, `budget`, `techPref`, `spent`, `credits`, `premium`, `commitment`, `rating` |
| `CDR_POLICY` | 13 | `type`, `region`, `value`, `status`, `enacted`, `mechanism`, `admin` |
| `INTEGRITY_DIMENSIONS` | 7 | `daccs`, `beccs`, `biochar`, `ew`, `afforestation`, `soil`, `desc` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `MARKET_DATA` | `['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'].map((yr, i) => ({` |
| `PRICE_HISTORY` | `['Q1-22', 'Q2-22', 'Q3-22', 'Q4-22', 'Q1-23', 'Q2-23', 'Q3-23', 'Q4-23', 'Q1-24', 'Q2-24', 'Q3-24', 'Q4-24'].map((q, i) => ({` |
| `categories` | `['All', 'Engineered', 'Nature-Based', 'Geochemical', 'Hybrid'];` |
| `standards` | `['All', 'Verra VCU', 'Gold Standard', 'Puro.earth', 'Plan Vivo', 'SBTi CDR', 'ISO 14064-2', 'BeZero'];` |
| `filteredBuyers` | `useMemo(() => buyerSectorF === 'All' ? CORPORATE_BUYERS : CORPORATE_BUYERS.filter(b => b.sector === buyerSectorF), [buyerSectorF]);  const kpis = useMemo(() => { const n = Math.max(1, filteredProjects.length);` |
| `totalCap` | `filteredProjects.reduce((s, p) => s + p.capacityKtY, 0);` |
| `avgCost` | `filteredProjects.reduce((s, p) => s + p.costPerTon, 0) / n;` |
| `totalPot2050` | `CDR_TECHNOLOGIES.reduce((s, t) => s + t.potential2050, 0);` |
| `totalRemoved` | `filteredProjects.reduce((s, p) => s + p.co2Removed, 0);` |
| `yearIndex` | `calcYear - 2024;` |
| `yearFactor` | `Math.max(0.4, 1 - yearIndex * 0.04);` |
| `midCost` | `(tech.costLow + tech.costHigh) / 2;` |
| `costAtYear` | `+(midCost * yearFactor).toFixed(0);` |
| `buyerSectors` | `['All', ...Array.from(new Set(CORPORATE_BUYERS.map(b => b.sector)))];` |
| `catColor` | `c => ({ 'Engineered': T.navy, 'Nature-Based': T.sage, 'Geochemical': T.teal, 'Hybrid': T.gold }[c] \|\| T.textSec);` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => `"${r[k]}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/carbon-removal/assess` | `run_full_assessment` | api/v1/routes/carbon_removal.py |
| POST | `/api/v1/carbon-removal/technology-assessment` | `assess_technology` | api/v1/routes/carbon_removal.py |
| POST | `/api/v1/carbon-removal/oxford-principles` | `score_oxford_principles` | api/v1/routes/carbon_removal.py |
| POST | `/api/v1/carbon-removal/article-64` | `assess_article64` | api/v1/routes/carbon_removal.py |
| POST | `/api/v1/carbon-removal/cdr-economics` | `calculate_economics` | api/v1/routes/carbon_removal.py |
| POST | `/api/v1/carbon-removal/market-eligibility` | `assess_market_eligibility` | api/v1/routes/carbon_removal.py |
| GET | `/api/v1/carbon-removal/ref/technology-profiles` | `get_technology_profiles` | api/v1/routes/carbon_removal.py |
| GET | `/api/v1/carbon-removal/ref/oxford-principles` | `get_oxford_principles` | api/v1/routes/carbon_removal.py |
| GET | `/api/v1/carbon-removal/ref/market-benchmarks` | `get_market_benchmarks` | api/v1/routes/carbon_removal.py |
| GET | `/api/v1/carbon-removal/ref/frontier-criteria` | `get_frontier_criteria` | api/v1/routes/carbon_removal.py |

### 2.3 Engine `carbon_removal_engine` (services/carbon_removal_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CarbonRemovalEngine.assess_cdr_technology` | project_data | Match project to CDR technology profile, assess TRL, cost trajectory, scalability, and co-benefit scoring. |
| `CarbonRemovalEngine.score_oxford_principles` | project_data | Score all 4 Oxford CDR Principles. Returns composite 0-100 score, quality tier, and gap analysis. |
| `CarbonRemovalEngine.assess_article64_eligibility` | project_data | Check all 6 Paris Agreement Article 6.4 requirements. Returns ITMO eligibility, corresponding adjustment requirement, and gap analysis. |
| `CarbonRemovalEngine.calculate_cdr_economics` | project_data | Model CAPEX/OPEX, LCOE ($/tCO2), NPV/IRR at credit price scenarios, break-even price, and blended finance uplift. |
| `CarbonRemovalEngine.assess_market_eligibility` | project_data | Assess CORSIA eligibility, Frontier AMC eligibility, voluntary market tier, and identify optimal buyer type with credit price benchmark. |
| `CarbonRemovalEngine.run_full_assessment` | project_data | Comprehensive CDR project assessment producing composite cdr_quality_score, tier, Oxford score, Art 6.4 eligibility, LCOE, Frontier eligibility, and credit price benchmark. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `cdr_quality_score` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CDR_POLICY`, `CDR_TECHNOLOGIES`, `COLORS`, `CORPORATE_BUYERS`, `INTEGRITY_DIMENSIONS`, `MARKET_DATA`, `PRICE_HISTORY`, `PROJECT_NAMES_BASE`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CDR Technologies | — | Taxonomy | BECCS, DAC, EW, ocean CDR, biochar, afforestation |
| Cost Range | — | Market | Wide range from low-tech afforestation to high-tech DAC |
| Permanence | — | Technology | Key quality differentiator between CDR approaches |
- **CDR project data** → Technology assessment → **Quality score per CDR type**
- **Permanence projections** → Net removal calculation → **Adjusted CDR credit value**
- **Cost curves** → Portfolio optimisation → **Lowest-cost CDR mix meeting quality thresholds**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/carbon-removal/ref/frontier-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frontier_eligibility_criteria', 'criteria_count', 'total_weight', 'eligibility_threshold', 'founding_members', 'commitment_size_usd', 'source', 'excluded_project_types'], 'n_keys': 8}`

**GET /api/v1/carbon-removal/ref/market-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['market_benchmarks', 'buyer_count', 'article_64_eligibility', 'total_vcm_volume_2024_tco2', 'source'], 'n_keys': 5}`

**GET /api/v1/carbon-removal/ref/oxford-principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['oxford_cdr_principles', 'source', 'quality_tiers', 'article_64_synergy'], 'n_keys': 4}`

**GET /api/v1/carbon-removal/ref/technology-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['technology_profiles', 'count', 'source', 'trl_scale', 'scalability_ratings', 'ipcc_categories'], 'n_keys': 6}`

**POST /api/v1/carbon-removal/article-64** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/carbon-removal/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/carbon-removal/cdr-economics** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/carbon-removal/market-eligibility** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** CDR technology comparison
**Headline formula:** `NetRemoval = GrossCapture - StorageLeakage - EnergyEmissions`

Permanence spectrum: geological storage (10,000yr) > biochar (100yr) > afforestation (50-100yr subject to reversal) > enhanced weathering (uncertain). Cost range: afforestation $5-50/tCO2, biochar $60-200, enhanced weathering $100-300, DAC $300-1000+ currently.

**Standards:** ['IPCC AR6 WGIII Ch.12', 'CDR.fyi', 'DOE CDR Prize']
**Reference documents:** IPCC AR6 WGIII Chapter 12 (CDR); CDR.fyi Database; Frontier CDR Advance Market Commitment; Oxford Principles for Net Zero Aligned Carbon Offsetting

**Engine `carbon_removal_engine` — extracted transformation lines:**
```python
cost_reduction_pct = ((cost_current - cost_2050) / cost_current * 100) if cost_current > 0 else 0
co_benefit_score = min(len(co_benefits) * 2.0, 10.0)
trl_score = (trl / 9) * 50
technology_readiness_score = round(trl_score + scalability_score * 0.5 + co_benefit_score * 0.5, 1)
perm = min(perm + 3.0, 25.0)
perm = min(perm + 2.0, 25.0)
annual_capex = capex / project_life if project_life > 0 else capex
total_annual_cost = annual_capex + annual_opex
lcoe = total_annual_cost / annual_removal
blended_grant = capex * blended_finance_grant_pct
effective_capex = capex - blended_grant
lcoe_blended = ((effective_capex / project_life) + annual_opex) / annual_removal if project_life > 0 else lcoe
annual_revenue = credit_price * annual_removal
annual_net_cf = annual_revenue - annual_opex
pv_annuity = annual_net_cf * (1 - (1 + discount_rate) ** (-project_life)) / discount_rate
pv_annuity = annual_net_cf * project_life
annual_revenue = credit_price * annual_removal
annual_net_cf = annual_revenue - annual_opex
mid = (low + high) / 2
pv = sum(annual_net_cf / (1 + mid) ** t for t in range(1, project_life + 1))
cost_reduction = (cost_current - cost_2050) / cost_current
oxford_contribution = oxford.composite_score * 0.40
tech_contribution = tech.technology_readiness_score * 0.25
art64_contribution = (art64.requirements_met / art64.total_requirements) * 20.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `carbon_removal_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `carbon-removal-markets` | engine:carbon_removal_engine, table:cdr_quality_score |

## 7 · Methodology Deep Dive

The Carbon Removal Analytics module is a CDR technology-comparison and portfolio tool that aligns with its
guide. It ships a rich, largely-real CDR technology library (cost, permanence, TRL, scalability, named
companies) and a backend engine (`carbon_removal_engine.py`) exposing Oxford Principles / Frontier-criteria
reference data. The per-project instances are synthetic; the technology parameters are real. No missing-
model gap is triggered — the net-removal formula is transparent — so there is no §8.

### 7.1 What the module computes

Portfolio KPIs over filtered projects, plus a technology cost-decline projection:

```js
totalCap    = Σ project.capacityKtY
avgCost     = Σ project.costPerTon / n
totalPot2050= Σ CDR_TECHNOLOGIES.potential2050        // GtCO2/yr sustainable potential
yearFactor  = max(0.4, 1 − (calcYear−2024)×0.04)      // 4%/yr learning-curve decline, floored at 0.4
costAtYear  = midCost × yearFactor                     // projected cost per tonne
```

The guide's net-removal formula `NetRemoval = GrossCapture − StorageLeakage − EnergyEmissions` is
represented by each technology's LCA field (life-cycle emissions per tonne removed, e.g. DACCS `lca=0.02`
tCO₂ emitted per tonne removed) rather than a live subtraction.

### 7.2 Parameterisation

**CDR technology library** (`CDR_TECHNOLOGIES`, 13 rows — provenance: **real** IPCC AR6 / CDR.fyi /
Frontier data; company lists are actual firms):

| Tech | Category | Cost $/t | Permanence (yr) | 2050 potential (Gt) | TRL |
|---|---|---|---|---|---|
| DACCS | Engineered | 250–600 | 10,000 | 5.0 | 7 |
| BECCS | Hybrid | 80–200 | 1,000 | 5.0 | 6 |
| Biochar | Nature-based | 60–200 | 500 | 2.0 | 8 |
| Enhanced Weathering | Geochemical | 50–200 | 10,000 | 4.0 | 5 |
| Ocean Alkalinity | Geochemical | 40–250 | 10,000 | 8.0 | 3 |
| Afforestation | Nature-based | 5–50 | 100 | 10.0 | 9 |
| Soil Carbon | Nature-based | 10–100 | 50 | 5.0 | 7 |
| Blue Carbon | Nature-based | 20–100 | 100 | 3.0 | 8 |
| Mineralization | Geochemical | 100–300 | 10,000 | 3.0 | 5 |

The permanence spectrum (geological 10,000 yr → soil 50 yr) and cost bands match the guide and published
CDR literature. Named companies (Climeworks, Drax, UNDO, Running Tide…) are real.

**Synthetic per-project fields** (`sr()`-seeded, 80 projects): capacity (5–85 ktCO₂/yr), cost-per-ton
(within the technology's band), quality score (7–10), region/country/standard/status/vintage/buyer-type,
CO₂-removed. Technology is round-robin (`i % 13`).

### 7.3 Calculation walkthrough

Projects are filtered by category/standard → KPIs sum capacity, average cost, count removed. The cost-curve
tab applies a 4%/yr learning-curve decline (floored at 40% of today's cost) from the technology midpoint.
Corporate-buyer and policy panels roll up `CORPORATE_BUYERS` (26 rows) and `CDR_POLICY` (13 rows) reference
data. The integrity radar uses `INTEGRITY_DIMENSIONS` scoring each pathway (DACCS/BECCS/biochar/EW/
afforestation/soil) on 7 dimensions. The backend engine additionally exposes Oxford Principles and Frontier
procurement criteria via `/carbon-removal/ref/*` endpoints.

### 7.4 Worked example (cost projection + portfolio)

DACCS midpoint cost = (250+600)/2 = $425/t. Project year 2035 → `yearFactor = max(0.4, 1 − 11×0.04) =
max(0.4, 0.56) = 0.56` → `costAtYear = 425 × 0.56 = $238/t` (consistent with IEA's DAC-cost-decline
projections). Enhanced-weathering by the 0.4 floor: at 2040, `yearFactor` would compute to `1−16×0.04 =
0.36 → floored to 0.40`, so cost never drops below 40% of today's — a deliberate learning-curve floor.

Portfolio: 10 filtered DACCS projects summing 400 ktCO₂/yr capacity at average $310/t → `totalCap = 400`,
`avgCost = 310`.

### 7.5 Data provenance & limitations

- **Technology library is real** (costs, permanence, TRL, 2050 potential, company names); project instances
  are **synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`).
- Net-removal is captured via a static LCA field per technology, not a live gross-minus-leakage-minus-energy
  subtraction; permanence is a single number, not a reversal-probability distribution.
- The learning-curve decline is a flat 4%/yr with a 0.4 floor — a simplification of technology-specific
  experience curves (Wright's law).

**Framework alignment:** IPCC AR6 WGIII Ch.12 — the CDR taxonomy and 2050 potential estimates (5–16 GtCO₂/yr
of removal needed) · Oxford Principles for Net-Zero Aligned Offsetting — the shift toward durable removals,
exposed via the backend `oxford-principles` endpoint · Frontier Climate — advance-market-commitment
procurement criteria (`frontier-criteria` endpoint) · CDR.fyi / Puro.earth — the market benchmark data ·
SBTi CDR guidance — the removal-vs-avoidance and permanence-tier distinctions used to score credit quality.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its real CDR engine and ground the market data (analytics ladder: rung 1 → 3)

**What.** This module has a genuinely substantive backend — `carbon_removal_engine` with `assess_cdr_technology`, `score_oxford_principles` (the 4 Oxford CDR Principles), `assess_article64_eligibility`, `calculate_cdr_economics` (CAPEX/OPEX, LCOE, NPV/IRR, break-even), `assess_market_eligibility` (CORSIA, Frontier AMC), and `run_full_assessment`, exposed at 6 POST + 4 GET routes. But the frontend renders seeded/curated tables (`CDR_TECHNOLOGIES` cost ranges, `CORPORATE_BUYERS`, `MARKET_DATA` growth, `PRICE_HISTORY`) and computes only shallow aggregates (`costAtYear = midCost × yearFactor`) — it doesn't call the real engine. Evolution A connects them and grounds the market data.

**How.** (1) The Technology Overview, Portfolio Builder, and Permanence/MRV tabs call the real engine routes (`assess_cdr_technology`, `score_oxford_principles`, `assess_market_eligibility`) instead of rendering seed tables — the engine already produces the quality/permanence/economics scores the page fakes. (2) CDR cost trajectories and market data from real sources (CDR.fyi, Frontier AMC, Puro.earth registry are the CDR-market references) with vintages, replacing the curated `CDR_TECHNOLOGIES` ranges and `MARKET_DATA`. (3) Corporate buyer commitments from public CDR purchase data (CDR.fyi tracks these). (4) The cost curve to 2050 net-zero uses the engine's cost-trajectory model against IPCC removal-need scenarios. (5) Rung 3: LCOE/economics benchmarked against published CDR project costs; the Oxford Principles and Article 6.4 scoring are real engine assessments. Triage any skipped POST routes.

**Prerequisites.** CDR market data sourcing (CDR.fyi/Frontier — partly public); the engine is ready. **Acceptance:** technology and quality scores come from the real engine, not seed tables; cost/market data carry sources and vintages; Oxford Principles and Article 6.4 scores are engine-computed; LCOE benchmarks against published costs.

### 9.2 Evolution B — CDR procurement and quality copilot (LLM tier 2)

**What.** Net-zero teams buying CDR for residual emissions ask "assess this DAC project on the Oxford Principles", "what's the LCOE and break-even credit price?", "is it Frontier-AMC eligible?", "compare BECCS vs enhanced weathering on permanence and cost" — the copilot runs the real `carbon_removal_engine` via `run_full_assessment` and the component routes, reporting the composite CDR quality score, permanence, Oxford score, Article 6.4 eligibility, and economics, every figure tool-traced.

**How.** Tool schemas from the 6 POST + 4 GET routes (all computational); grounding corpus is this Atlas record plus the engine's real reference endpoints (technology profiles, Oxford Principles, market benchmarks, Frontier criteria — all substantive). The copilot's honesty duty is central to CDR integrity: permanence is the defining CDR quality axis (a durable DACCS removal vs a reversible afforestation credit), so it always reports the durability class and reversal risk, and never conflates removal with avoidance. MRV quality and additionality come from the engine's assessment, not asserted. Procurement shortlists compose into the report layer.

**Prerequisites.** POST-route triage; Evolution A's market-data grounding improves benchmarks but the engine is callable today. **Acceptance:** every quality score, LCOE, and eligibility verdict traces to an engine response; permanence/durability is reported per technology; removal is distinguished from avoidance; Oxford and Article 6.4 scores are engine-computed.