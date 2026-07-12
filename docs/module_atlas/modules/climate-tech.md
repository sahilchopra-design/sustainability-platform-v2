# Climate Tech Intelligence
**Module ID:** `climate-tech` · **Route:** `/climate-tech` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses the climate technology investment landscape including venture capital flows, patent activity, startup ecosystem mapping, and technology readiness progression across mitigation and adaptation sectors.

> **Business value:** Provides climate investors, corporate strategists, and policy makers with data-driven intelligence on the climate technology ecosystem to guide investment allocation, partnership decisions, and innovation policy.

**How an analyst works this module:**
- Map climate tech sectors: solar, wind, storage, hydrogen, EV, carbon removal, sustainable food, adaptation
- Track VC and PE investment flows by stage (seed, Series A–D, growth), geography, and technology category
- Monitor patent activity as leading indicator of technology maturity using EPO and USPTO databases
- Score startups on technology readiness, commercial traction, and climate impact potential

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COMPANIES`, `CO_NAMES`, `CPC_CLASSES`, `GEOS`, `KpiCard`, `MARKET_TAM`, `MATURITY`, `PATENT_DATA`, `PIE_C`, `Panel`, `RISK_LEVELS`, `Row`, `SECTORS`, `STAGES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `STAGES` | `['Seed', 'Series A', 'Series B', 'Series C+', 'Growth', 'Pre-IPO', 'Public'];` |
| `stage` | `STAGES[Math.floor(sr(i * 7) * STAGES.length)];` |
| `geo` | `GEOS[Math.floor(sr(i * 11) * GEOS.length)];` |
| `founded` | `2010 + Math.floor(sr(i * 13) * 15);` |
| `trl` | `1 + Math.floor(sr(i * 17) * 9);` |
| `funding` | `Math.round(5 + sr(i * 19) * 995);` |
| `irr` | `Math.round(4 + sr(i * 23) * 36);` |
| `co2AvoidedMtpa` | `Math.round((0.01 + sr(i * 29) * 4.99) * 100) / 100;` |
| `waterSavedMn` | `Math.round(sr(i * 31) * 500);` |
| `jobsCreated` | `Math.round(50 + sr(i * 37) * 4950);` |
| `landHaMn` | `Math.round((sr(i * 41) * 2) * 100) / 100;` |
| `ipoReadiness` | `Math.round(10 + sr(i * 43) * 88);` |
| `revenue` | `Math.round(1 + sr(i * 47) * 499);` |
| `scalabilityScore` | `Math.round(15 + sr(i * 53) * 84);` |
| `patentCount` | `Math.round(sr(i * 59) * 120);` |
| `techRisk` | `RISK_LEVELS[Math.floor(sr(i * 61) * 3)];` |
| `marketRisk` | `RISK_LEVELS[Math.floor(sr(i * 67) * 3)];` |
| `policyRisk` | `RISK_LEVELS[Math.floor(sr(i * 71) * 3)];` |
| `lastRoundSize` | `Math.round(1 + sr(i * 73) * 199);` |
| `sbtiAligned` | `sr(i * 79) > 0.45;` |
| `climateImpactScore` | `Math.round(20 + sr(i * 83) * 79);` |
| `name` | `CO_NAMES[i] \|\| `ClimateTech Co ${i + 1}`;` |
| `MARKET_TAM` | `SECTORS.map((s, i) => ({` |
| `csv` | `[h.join(','), ...rows.map(r => h.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');` |
| `totalFunding` | `COMPANIES.reduce((a, c) => a + c.funding, 0);` |
| `avgTrl` | `Math.round(COMPANIES.reduce((a, c) => a + c.trl, 0) / COMPANIES.length * 10) / 10;` |
| `trlDist` | `Array.from({ length: 9 }, (_, i) => ({ name: `TRL ${i + 1}`, count: COMPANIES.filter(c => c.trl === i + 1).length }));` |
| `sectorDist` | `SECTORS.map(s => { const cs = COMPANIES.filter(c => c.sector === s); return { name: s.slice(0, 16), count: cs.length, avgTrl: cs.length ? Math.round(cs.reduce((a, c) => a + c.trl, 0) / cs.length * 10) / 10 : 0 }; });` |
| `stageDist` | `STAGES.map(s => { const cs = COMPANIES.filter(c => c.stage === s); return { name: s, count: cs.length, funding: Math.round(cs.reduce((a, c) => a + c.funding, 0)), avgIrr: cs.length ? Math.round(cs.reduce((a, c) => a + c.` |
| `topFunded` | `[...COMPANIES].sort((a, b) => b.funding - a.funding).slice(0, 15).map(c => ({ name: c.name.slice(0, 18), funding: c.funding, irr: c.irr }));` |
| `yearlyFunding` | `[2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map((y, i) => ({ year: y, total: Math.round(totalFunding * [0.04, 0.06, 0.07, 0.10, 0.14, 0.18, 0.22, 0.19][i]) }));` |
| `stageSectorHeat` | `STAGES.map(s => { const obj = { stage: s }; SECTORS.slice(0, 7).forEach(sec => { const cs = COMPANIES.filter(c => c.stage === s && c.sector === sec); obj[sec.slice(0, 8)] = cs.length ? Math.round(cs.reduce((a, c) => a + ` |
| `avgRound` | `COMPANIES.length ? Math.round(COMPANIES.reduce((a, c) => a + c.lastRoundSize, 0) / COMPANIES.length) : 0;` |
| `totalCO2` | `COMPANIES.reduce((a, c) => a + c.co2AvoidedMtpa, 0);` |
| `sectorImpact` | `SECTORS.map(s => { const cs = COMPANIES.filter(c => c.sector === s); return { name: s.slice(0, 14), co2: cs.length ? Math.round(cs.reduce((a, c) => a + c.co2AvoidedMtpa, 0) * 100) / 100 : 0, jobs: cs.length ? Math.round(` |
| `topImpact` | `[...COMPANIES].sort((a, b) => b.climateImpactScore - a.climateImpactScore).slice(0, 20).map(c => ({ name: c.name.slice(0, 18), score: c.climateImpactScore, co2: c.co2AvoidedMtpa }));` |
| `scatterData` | `COMPANIES.slice(0, 80).map(c => ({ name: c.name, x: c.waterSavedMn, y: c.jobsCreated, z: c.co2AvoidedMtpa, sector: c.sector }));` |
| `portfolioValue` | `Math.round(totalCO2 * carbonPrice * 1000000 / 1e9);` |
| `sectorAlloc` | `SECTORS.map(s => { const cs = portfolio.filter(c => c.sector === s); return { name: s.slice(0, 14), value: cs.length, pct: portfolio.length ? Math.round(cs.length / portfolio.length * 1000) / 10 : 0 }; }).filter(s => s.v` |
| `riskMatrix` | `portfolio.slice(0, 60).map(c => ({ name: c.name, x: ['Low', 'Medium', 'High'].indexOf(c.techRisk) + 1 + sr(c.id * 3) * 0.6 - 0.3, y: ['Low', 'Medium', 'High'].indexOf(c.marketRisk) + 1 + sr(c.id * 7) * 0.6 - 0.3, funding` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/climate-tech/assess-technology` | `assess_technology` | api/v1/routes/climate_tech.py |
| POST | `/api/v1/climate-tech/investment-opportunity` | `analyse_investment_opportunity` | api/v1/routes/climate_tech.py |
| POST | `/api/v1/climate-tech/portfolio-analysis` | `build_portfolio_analysis` | api/v1/routes/climate_tech.py |
| POST | `/api/v1/climate-tech/learning-curve` | `calculate_learning_curve` | api/v1/routes/climate_tech.py |
| GET | `/api/v1/climate-tech/ref/ctvc-taxonomy` | `get_ctvc_taxonomy` | api/v1/routes/climate_tech.py |
| GET | `/api/v1/climate-tech/ref/iea-deployment` | `get_iea_deployment` | api/v1/routes/climate_tech.py |
| GET | `/api/v1/climate-tech/ref/mac-curves` | `get_mac_curves` | api/v1/routes/climate_tech.py |
| GET | `/api/v1/climate-tech/ref/vc-market-data` | `get_vc_market_data` | api/v1/routes/climate_tech.py |

### 2.3 Engine `climate_tech_engine` (services/climate_tech_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ClimateTechEngine.assess_technology` | technology_name, category | Assess a climate technology: TRL, costs, abatement, MAC, IEA NZE gap, attractiveness. |
| `ClimateTechEngine.analyse_investment_opportunity` | technology, stage, geography, investment_size_usd | VC/PE market context, comparable deal multiples, patent position, risk-return. |
| `ClimateTechEngine.build_portfolio_analysis` | technology_list, investment_amounts | Diversification across CTVC sectors, combined abatement, portfolio MAC, EU Taxonomy alignment. |
| `ClimateTechEngine.calculate_learning_curve` | technology, current_cumulative_capacity, target_cumulative_capacity | Project cost at target cumulative capacity using Wright's Law. |
| `ClimateTechEngine._get_technology_risks` | tech_key, trl, mac, deployment_gap |  |
| `ClimateTechEngine._get_technology_opportunities` | tech_key, abatement, learning_rate, trl |  |
| `ClimateTechEngine._build_investment_thesis` | tech_key, stage, ctvc_sector, trl |  |
| `ClimateTechEngine._generate_rebalancing_suggestions` | sector_alloc, eu_pct, avg_trl, abatement |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `most`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CO_NAMES`, `CPC_CLASSES`, `GEOS`, `MATURITY`, `PIE_C`, `RISK_LEVELS`, `SECTORS`, `STAGES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Climate Tech VC Investment (2023) | — | Bloomberg NEF 2024 | Total venture and growth equity invested in climate technology companies globally in 2023. |
| Patent Filings Growth (Clean Energy) | — | EPO Patent Index 2024 | Compound annual growth rate in clean energy patent applications filed with major patent offices. |
- **Crunchbase/Dealroom VC data, EPO/USPTO patent databases, startup self-reporting, BNEF market intelligence** → Investment flow aggregation, patent trend analysis, TRL scoring, ecosystem mapping → **Investment dashboards, patent heat maps, startup scorecards, sector maturity curves**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-tech/ref/ctvc-taxonomy** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'sector_count', 'sectors'], 'n_keys': 3}`

**GET /api/v1/climate-tech/ref/iea-deployment** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'reporting_year', 'technology_count', 'technologies'], 'n_keys': 4}`

**GET /api/v1/climate-tech/ref/mac-curves** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'technology_count', 'total_abatement_potential_2030_gtco2', 'total_abatement_potential_2050_gtco2', 'cost_tiers', 'curves'], 'n_keys': 6}`

**GET /api/v1/climate-tech/ref/vc-market-data** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'reporting_year', 'total_climate_tech_investment_usd_bn', 'total_deal_count', 'sectors', 'bnef_learning_curve_count', 'patent_intensity_technologies', 'trl_definitions', 'green_taxonomy_mappings'], 'n_keys': 9}`

**POST /api/v1/climate-tech/assess-technology** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-tech/investment-opportunity** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-tech/learning-curve** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-tech/portfolio-analysis** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Tech Investment Growth Rate
**Headline formula:** `CTIGR = (Investmentₜ – Investmentₜ₋₁) / Investmentₜ₋₁ × 100`

Year-on-year percentage growth in climate tech venture and growth capital deployment by sector and geography.

**Standards:** ['Bloomberg NEF ClimateTech 2024', 'PwC State of Climate Tech 2023']
**Reference documents:** Bloomberg NEF ClimateTech 2024 Report; PwC State of Climate Tech 2023; European Patent Office Insights on Climate Technologies 2024; IEA Energy Technology Perspectives 2023

**Engine `climate_tech_engine` — extracted transformation lines:**
```python
cost_reduction_2030 = round((cost_2024 - cost_2030) / max(cost_2024, 1) * 100, 1)
cost_reduction_2050 = round((cost_2024 - cost_2050) / max(cost_2024, 1) * 100, 1)
weight = amount / total_investment
eu_taxonomy_pct = round(eu_taxonomy_count / max(len(technology_list), 1) * 100, 1)
hhi = sum(v ** 2 for v in sector_allocation.values())
diversification_score = round((1 - hhi) * 100, 1)
avg_trl = round(sum(trl_values) / max(len(trl_values), 1), 1)
temperature_contribution = round(max(0.05, 2.0 - total_abatement_2050 * 0.15), 2)
ctvc_sector_allocation={k: round(v * 100, 1) for k, v in sector_allocation.items()},
capacity_ratio = target_cumulative_capacity / current_cumulative_capacity
projected_cost = current_cost * (capacity_ratio ** learning_exp)
cost_reduction_pct = round((current_cost - projected_cost) / max(current_cost, 1) * 100, 1)
lcoe_current = round(current_cost * lcoe_factor / 1000, 2)
lcoe_target = round(projected_cost * lcoe_factor / 1000, 2)
lcoe_current = round(current_cost * 0.12, 2)
lcoe_target = round(projected_cost * 0.12, 2)
cap_at_d = current_cumulative_capacity * (2 ** d)
cost_at_d = round(current_cost * ((2 ** d) ** learning_exp), 4)
years_est = max(1, int(math.log(capacity_ratio) / math.log(1.20)))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide names a **Climate Tech Investment Growth Rate** (`CTIGR = (Inv_t − Inv_{t−1})/Inv_{t−1}·100`). The
page is a **climate-tech company/ecosystem explorer**: it seeds a company universe with funding, TRL, IRR,
impact and risk fields, then aggregates by sector/stage/TRL and offers a portfolio-construction tab. The
growth rate exists only as a stored `yearlyFunding` allocation vector, not an estimated series; all company
data is `sr()` seeded.

### 7.1 What the module computes

Per synthetic company, ~20 seeded attributes drive the dashboards:
```js
trl        = 1 + floor(sr(i·17)·9)                 // TRL 1–9
funding    = round(5 + sr(i·19)·995)               // $M
irr        = round(4 + sr(i·23)·36)                // 4–40%
co2AvoidedMtpa = round((0.01 + sr(i·29)·4.99)·100)/100
climateImpactScore = round(20 + sr(i·83)·79)
sbtiAligned = sr(i·79) > 0.45                       // ~55% aligned
```
Aggregations:
```js
avgTrl     = round(Σ trl / n · 10)/10
yearlyFunding = years.map((y,i) => totalFunding · [0.04,0.06,0.07,0.10,0.14,0.18,0.22,0.19][i])
portfolioValue = round( totalCO2·carbonPrice·1e6 / 1e9 )   // $B, CO2 monetised at slider price
```

### 7.2 Parameterisation / scoring rubric

| Quantity | Generation | Provenance |
|---|---|---|
| `funding`, `irr`, `trl`, `revenue` | `sr()` seeded ranges | synthetic demo value |
| `co2AvoidedMtpa`, `waterSavedMn`, `jobsCreated`, `landHaMn` | `sr()` seeded | synthetic impact metrics |
| `sbtiAligned` threshold | `sr > 0.45` | heuristic (~55% aligned) |
| `yearlyFunding` shares | fixed `[0.04…0.19]` 2018–25 | curated growth curve (BNEF-shaped) |
| `MARKET_TAM` | per sector | curated TAM |
| Risk levels (tech/market/policy) | 3-level pick | synthetic |

Guide anchors: global climate-tech VC $63B (2023, BNEF); clean-energy patent +15% CAGR (EPO).

### 7.3 Calculation walkthrough

Seeds → company universe (name, sector, stage, geo, TRL, funding, IRR, impact, risk) → sector/stage/TRL
distributions → `topFunded`/`topImpact` rankings → `yearlyFunding` reconstructs a funding time series by
applying the fixed share vector to total funding → CTIGR is read off consecutive years. Portfolio tab filters
companies, monetises aggregate CO₂ avoided at a `carbonPrice` slider into `portfolioValue`, and plots a
risk matrix (`techRisk` × `marketRisk` with jitter).

### 7.4 Worked example

Suppose `totalFunding = $20,000M`. The stored yearly shares give:
```
2022 funding = 20,000·0.14 = $2,800M ;  2023 = 20,000·0.18 = $3,600M
CTIGR(2023) = (3,600 − 2,800)/2,800·100 = +28.6%
```
Portfolio of companies totalling `totalCO2 = 40 Mtpa` at `carbonPrice = $80/t`:
```
portfolioValue = 40·80·1e6 / 1e9 = $3.2B   (annual avoided-emissions value)
```
So a 40-Mtpa avoided-emissions portfolio is valued at $3.2B/yr of carbon benefit at $80/t — the impact-to-
value bridge the module illustrates.

### 7.5 Data provenance & limitations

- **All company data synthetic** (`sr()` PRNG); only the `yearlyFunding` share vector and `MARKET_TAM` are
  curated to BNEF-shaped magnitudes.
- CTIGR is not estimated from real deal flow — it is the ratio of stored shares; TRL/IRR/impact are
  independent random draws with no internal consistency (a TRL-3 seed can carry a high IRR).
- `portfolioValue` monetises CO₂ avoided but is not a financial NPV — no cost, no probability of success.

**Framework alignment:** Bloomberg NEF ClimateTech ($63B 2023) · PwC State of Climate Tech · EPO patent
index (+15% CAGR) · IEA Energy Technology Perspectives (TRL framework, 1–9). SBTi alignment flag references
Science-Based Targets validation. The four `/climate-tech` endpoints (CTVC taxonomy, IEA deployment, MAC
curves, VC market data) are wired in the backend but not the source of the on-page seeded universe.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Track real climate-tech capital deployment (CTIGR by sector/stage/geo), maturity
progression (TRL curves) and portfolio impact-adjusted value, for VC/PE allocation and policy monitoring.

**8.2 Conceptual approach.** Aggregate a **deal-level investment panel** (Crunchbase/Dealroom/BNEF) into
sector-stage cohorts, fit patent-activity leading indicators (EPO/USPTO) to TRL progression, and value
impact via an abatement-monetisation bridge — mirroring BNEF climate-tech tracking and PwC State of Climate
Tech taxonomy.

**8.3 Mathematical specification.**
```
CTIGR_{s,t} = (Inv_{s,t} − Inv_{s,t−1}) / Inv_{s,t−1} · 100         (from deal panel)
TRL_progression: P(TRL↑ | patents, funding) = logistic(θ0 + θ1·PatentGrowth + θ2·log Funding)
ImpactValue = Σ_c abatement_c(tCO₂e/yr) · SCC · P(success_c)         (risk-adjusted)
P(success | stage, TRL) from historical stage-transition survival rates
```

| Parameter | Source |
|---|---|
| Deal panel Inv_{s,t} | Crunchbase/Dealroom/BNEF |
| Patent growth | EPO/USPTO climate-tech classifications |
| SCC | EPA/IWG social cost of carbon |
| Stage-success rates | VC exit/survival databases (Pitchbook) |

**8.4 Data requirements.** Round-level funding by company/date/stage/geo; patent counts; abatement per
company; exit outcomes. Vendor: Crunchbase/Pitchbook/BNEF; free: EPO patent index, EPA SCC.

**8.5 Validation & benchmarking.** Reconcile total CTIGR against BNEF $63B and PwC figures; backtest
TRL-progression predictions; check impact-value against realised abatement disclosures.

**8.6 Limitations & model risk.** Private-deal data lags and gaps; self-reported impact optimism; success
probabilities regime-dependent. Fallback: report CTIGR and TRL distributions without impact-value when
abatement/success data is missing.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its own engine and ingest real patent flow (analytics ladder: rung 1 → 3)

**What.** §7.5 states the on-page company universe is entirely `sr()`-seeded — TRL,
funding, IRR and impact are independent random draws ("a TRL-3 seed can carry a high
IRR") — while a real backend exists and is ignored: `climate_tech_engine` behind 8
routes, whose 4 ref GETs (`/ref/ctvc-taxonomy`, `/ref/iea-deployment`, `/ref/mac-curves`,
`/ref/vc-market-data`) already pass the lineage harness. Evolution A retires the seeded
universe: sector dashboards read the CTVC taxonomy and VC market data from the engine,
the learning-curve endpoint powers cost-decline analytics, and patent activity — the
overview's "leading indicator" — comes from a real EPO OPS ingest (free, keyless tier)
instead of seeded `CPC_CLASSES` counts.

**How.** (1) Fix the four failing POSTs (`/assess-technology`,
`/investment-opportunity`, `/portfolio-analysis`, `/learning-curve`) — harness status
`failed` needs triage before anything narrates them. (2) Frontend swap: `SECTORS`
funding/TAM panels → `/ref/vc-market-data`; TRL distributions → `/ref/iea-deployment`;
CTIGR computed from the ingested series rather than the fixed
`[0.04…0.19]` share vector. (3) New 20th-ingester-pattern job pulling EPO CPC Y02
patent counts by class and year into a `climate_patent_activity` table; benchmark the
computed CAGR against the EPO's published +15% figure. (4) Enforce internal
consistency: TRL bounds stage/IRR priors in `assess-technology`.

**Prerequisites.** POST-endpoint triage; EPO OPS registration (free but throttled —
respect the ingestion framework's rate-limit learnings). **Acceptance:** zero `sr()`
company attributes rendered; patent CAGR by sector reproducible from the ingested
table; CTIGR recomputes when the ingest updates.

### 9.2 Evolution B — Investment-screening analyst over the assessment endpoints (LLM tier 2)

**What.** A tool-calling analyst for climate investors: "assess a Series B green
hydrogen electrolyzer company, 2 MtCO₂e/yr avoided at scale" invokes
`POST /assess-technology` and `/investment-opportunity`, then situates the result
against `/ref/mac-curves` (where does it sit on the abatement cost curve?) and
`/ref/iea-deployment` (is deployment ahead of or behind the NZE trajectory?) — a
synthesis the page's tabs currently leave to the analyst's eye. Portfolio questions
("how concentrated is my TRL risk?") route to `/portfolio-analysis`.

**How.** Tool schemas from the module's 8 OpenAPI operations, ref GETs unrestricted,
assessment POSTs read-only in effect (no persistence). Grounding: §5 (CTIGR
definition), §7's provenance table so the copilot knows which numbers are curated
(BNEF-shaped `yearlyFunding`, `MARKET_TAM`) versus computed. The learning-curve
endpoint gives the copilot a legitimate forward-looking tool — cost projections come
from Wright's-law math in the engine, never from the model's own priors.

**Prerequisites (hard).** All four assessment POSTs passing; Evolution A's de-seeding,
since an analyst summarizing randomly-drawn IRRs would launder fabrication through
fluent prose. **Acceptance:** every numeric in an assessment memo traces to a tool
output; asked about a company not in the data, the copilot runs a fresh assessment or
declines — it never retrieves a synthetic seed row.