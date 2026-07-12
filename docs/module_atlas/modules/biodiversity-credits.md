# Biodiversity Credit Market
**Module ID:** `biodiversity-credits` · **Route:** `/biodiversity-credits` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Voluntary biodiversity credit pricing, trading analytics, and ecosystem unit metrics covering habitat banking, species biodiversity units (BDUs), and nature-based solution credits. Integrates TNFD LEAP locate-evaluate outputs, IUCN habitat condition scoring, and UK BNG (Biodiversity Net Gain) metric. Tracks market liquidity, price discovery, and jurisdictional legal frameworks.

> **Business value:** Biodiversity credits are transitioning from voluntary to mandatory mechanisms in multiple jurisdictions. UK mandatory BNG has created the first statutory biodiversity credit market; similar frameworks are emerging in Australia (ACCUs), EU (NBSAP obligations), and Singapore. Investors in development assets face growing BDU procurement obligations that directly affect project economics.

**How an analyst works this module:**
- Habitat Library shows BDU values for 100+ UK and global habitat types
- Project Assessment tab calculates pre- and post-development BDU for a site
- BNG Net Gain tab verifies mandatory 10% gain requirement
- Market Prices tab tracks BDU spot prices by habitat type and condition tier
- Portfolio Analytics aggregates biodiversity credit holdings and BDU balance
- TNFD D4 Export maps credits to nature-related dependency disclosures

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `HABITAT_DISTINCTIVENESS`, `HABITAT_TYPES`, `Inp`, `KpiCard`, `PIE_COLORS`, `Row`, `Section`, `Sel`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `HABITAT_TYPES` | 9 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `_BIO_MAP` | `Object.fromEntries(BIODIVERSITY_COUNTRY_DATA.map(d => [d.country, d]));` |
| `_HS_MAP` | `Object.fromEntries(BIODIVERSITY_HOTSPOTS.map(d => [d.name, d]));` |
| `baselineUnits` | `parseFloat((areaNum * dist * preC * 0.3).toFixed(2));` |
| `postUnits` | `parseFloat((areaNum * dist * postC * 0.28).toFixed(2));` |
| `bngPct` | `parseFloat(((postUnits - baselineUnits) / Math.max(baselineUnits, 0.01) * 100).toFixed(1));` |
| `habitatBreakdown` | `HABITAT_TYPES.map((h, i) => ({` |
| `composite` | `Math.round(pillars.reduce((s, p) => s + p.score, 0) / pillars.length);` |
| `totalVal` | `services.reduce((s, sv) => s + sv.value, 0);` |
| `highLowBar` | `services.map(sv => ({` |
| `disclosureScore` | `Math.round(subTargets.reduce((s, t) => s + t.score, 0) / 6);` |
| `topCredit` | `[...creditTypes].sort((a, b) => b.price - a.price)[0];` |
| `avgPrice` | `Math.round(creditTypes.reduce((s, c) => s + c.price, 0) / creditTypes.length);` |
| `additionalityScore` | `Math.round(seed(141) * 25 + 60);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/biodiversity-credits/bng-metric` | `bng_metric` | api/v1/routes/biodiversity_credits.py |
| POST | `/api/v1/biodiversity-credits/tnfd-disclosure` | `tnfd_disclosure` | api/v1/routes/biodiversity_credits.py |
| POST | `/api/v1/biodiversity-credits/ecosystem-services` | `ecosystem_services` | api/v1/routes/biodiversity_credits.py |
| POST | `/api/v1/biodiversity-credits/gbf-target15` | `gbf_target15` | api/v1/routes/biodiversity_credits.py |
| POST | `/api/v1/biodiversity-credits/credit-quality` | `credit_quality` | api/v1/routes/biodiversity_credits.py |
| GET | `/api/v1/biodiversity-credits/ref/credit-standards` | `ref_credit_standards` | api/v1/routes/biodiversity_credits.py |
| GET | `/api/v1/biodiversity-credits/ref/habitat-tiers` | `ref_habitat_tiers` | api/v1/routes/biodiversity_credits.py |
| GET | `/api/v1/biodiversity-credits/ref/ecosystem-services` | `ref_ecosystem_services` | api/v1/routes/biodiversity_credits.py |
| GET | `/api/v1/biodiversity-credits/ref/price-benchmarks` | `ref_price_benchmarks` | api/v1/routes/biodiversity_credits.py |

### 2.3 Engine `biodiversity_credit_engine` (services/biodiversity_credit_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `BiodiversityCreditEngine.assess_bng_metric` | project_data | DEFRA BNG Metric 4.0 — calculate pre/post habitat units, determine whether the 10% mandatory net gain threshold is met, and estimate saleable credits. Expected keys (all optional with defaults): habitat_type, pre_condition, post_condition, area_ha, distinctiveness_tier, strategic_significance, offsite_distance_km, legal_agreement_years, irreplaceability_flag |
| `BiodiversityCreditEngine.assess_tnfd_disclosure` | entity_data | TNFD v1.0 LEAP process assessment. Scores 14 core metrics across 4 pillars: Governance, Strategy, Risk Management, Metrics & Targets. Expected keys: entity_id, sector, country, pillar_scores dict, has_location_data, has_scenario_analysis, sbtn_aligned, gbf_aligned, leap_stage_reached |
| `BiodiversityCreditEngine.value_ecosystem_services` | project_data | TEEB / SEEA-EA ecosystem service valuation. Values all 12 service categories, computes total economic value (TEV), identifies key dependencies, and maps to ENCORE categories. Expected keys: project_id, area_ha, ecosystem_type, service_quantities dict (service → quantity per ha), use_high_estimate bool |
| `BiodiversityCreditEngine.assess_gbf_target15` | entity_data | Kunming-Montreal GBF Target 15 disclosure assessment. Evaluates all 6 sub-targets (a-f), produces completeness score, identifies gaps, and provides peer comparison. Expected keys: entity_id, sector, revenue_usd_m, sub_target_status dict (a-f → completion 0-100), has_tnfd_disclosure, has_csrd_esrs_e4, has_gri_304, peer_sector_avg_score |
| `BiodiversityCreditEngine.assess_credit_quality` | credit_data | Biodiversity credit quality assessment: - Additionality check - Permanence risk scoring (0-100; lower = less risky) - Reversal buffer adequacy - CORSIA eligibility - Price benchmarking vs market Expected keys: credit_id, standard, credit_type, project_country, permanence_years, has_additionality_demonstration, reversal_buffer_pct, risk_factors list, asking_price_usd, co_benefits list |
| `BiodiversityCreditEngine.run_full_assessment` | entity_data | Orchestrates all sub-assessments and produces a consolidated biodiversity credit & nature markets report. Expected keys: All keys from sub-methods, plus: project_data dict, credit_data dict |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `HABITAT_TYPES`, `PIE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Biodiversity Unit (BDU) | `Area × Condition × Distinctiveness × Connectivity` | UK BNG metric | Standardised measure of biodiversity value per hectare of habitat |
| BNG Credit Price | — | Habitat bank market | Market price per biodiversity unit in registered UK statutory BNG market |
| Net Gain Achievement | `Post – Pre BDU / Pre BDU` | UK EA BNG register | Percentage biodiversity net gain delivered by development project vs pre-development baseline |
- **UK Habitat Bank Registry / IUCN habitat data** → Score each habitat parcel on BNG metric; compute pre- and post-development BDU → **Site-level BDU balance and net gain percentage**
- **Habitat bank market price feeds** → Track BDU spot prices by habitat type; compute portfolio credit valuation → **Market price analytics and portfolio BDU holding valuation**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/biodiversity-credits/ref/credit-standards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['credit_standards', 'count', 'source'], 'n_keys': 3}`

**GET /api/v1/biodiversity-credits/ref/ecosystem-services** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ecosystem_services', 'count', 'source'], 'n_keys': 3}`

**GET /api/v1/biodiversity-credits/ref/habitat-tiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['habitat_distinctiveness_tiers', 'count', 'source'], 'n_keys': 3}`

**GET /api/v1/biodiversity-credits/ref/price-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['price_benchmarks', 'count', 'source'], 'n_keys': 3}`

**POST /api/v1/biodiversity-credits/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/biodiversity-credits/bng-metric** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/biodiversity-credits/credit-quality** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/biodiversity-credits/ecosystem-services** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** BNG biodiversity unit valuation model
**Headline formula:** `BDU = Habitat_area × Condition_score × Distinctiveness_score × Connectivity_multiplier; BNG_net_gain = Post_development_BDU – Pre_development_BDU`

Biodiversity units follow the UK BNG statutory metric which scores habitat parcels on condition (0–1), distinctiveness (0–1), and connectivity. Mandatory 10% BNG requires post-development BDU > pre-development BDU by at least 10%. Credit price is set by supply/demand in registered habitat bank market.

**Standards:** ['UK Environment Act 2021 (BNG)', 'TNFD LEAP v2', 'IUCN Habitat Classification v3.1']
**Reference documents:** UK Environment Act 2021 Biodiversity Net Gain; TNFD LEAP Approach v2 (2023); IUCN Habitat Classification Scheme v3.1; SEBI Voluntary Biodiversity Credit Framework 2023

**Engine `biodiversity_credit_engine` — extracted transformation lines:**
```python
distinctiveness_score = (low_s + high_s) / 2.0 if high_s > 0 else 0.0
temporal_factor = min(1.0, legal_agreement_years / 30.0)
net_gain_units = post_units - pre_units
net_gain_pct = (net_gain_units / pre_units * 100.0) if pre_units > 0 else 100.0
mandatory_threshold_units = pre_units * 1.10
saleable_credits = max(0.0, post_units - mandatory_threshold_units)
credit_value_usd = saleable_credits * mid_price
metric_score = min(100.0, p_score * mod)
raw_composite = sum(all_metric_scores) / len(all_metric_scores) if all_metric_scores else 0.0
tnfd_composite = round(raw_composite * 0.8 + leap_score * 100 * 0.2, 2)
value_ha = qty_per_ha * price
total_value = value_ha * area_ha
tev_m = tev_usd / 1_000_000.0
adjusted = min(100.0, completion + boost)
overall_score = round(total_score / n, 2)
vs_peer = round(overall_score - peer_avg, 2)
perm_years_score = min(100.0, (permanence_years / max(min_perm, 1)) * 100.0)
permanence_risk_score = max(0.0, 100.0 - risk_penalty)
buffer_score = min(100.0, (reversal_buffer_pct / 20.0) * 100.0)
price_mid = (price_low + price_high) / 2.0
price_vs_market = round(asking_price - price_mid, 2)
co_benefit_premium_pct = min(40.0, len(co_benefits) * 5.0)
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

> ⚠️ **Guide↔code mismatch flag.** A rigorous backend engine
> (`biodiversity_credit_engine.py`, E88) implements the full DEFRA BNG Metric 4.0
> (distinctiveness × condition × strategic-significance × temporal × proximity ×
> irreplaceability), TNFD LEAP 14-metric scoring, TEEB/SEEA-EA ecosystem valuation,
> GBF Target-15 and a 5-factor credit-quality tier. **The React page does not call
> those methods for its headline numbers** — it computes a *simplified* BNG on the
> client and fills TNFD/ecosystem-service/credit-quality panels with the seeded PRNG
> `seed(s)=frac(sin(s+1)×10⁴)`. The engine is real; the page is a demo. §7 documents
> both, §8 specifies the production wiring.

### 7.1 What the module computes (client side)

The page's on-screen BNG uses a reduced formula, not the engine's:

```js
dist          = HABITAT_DISTINCTIVENESS[habitat]          // 3 (farmland) … 8 (grassland/wetland/coastal)
preC, postC   = condition maps (poor=1 … very_good=4, restored=5)
baselineUnits = area × dist × preC × 0.30
postUnits     = area × dist × postC × 0.28
bngPct        = (postUnits − baselineUnits) / max(baselineUnits, 0.01) × 100
tenPctMet     = bngPct ≥ 10
```

TNFD, ecosystem services, GBF Target-15 and credit-quality panels are all
`seed()`-generated (e.g. TNFD pillar scores `seed(21..31)×25+55`; additionality
`seed(141)×25+60`), then aggregated by real weightings.

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| Distinctiveness | woodland 6, grassland 8, wetland 8, heathland 7, coastal 8, freshwater 7, farmland 3, urban 4 | Client tier map (loosely DEFRA) |
| Baseline/post factors | ×0.30 / ×0.28 | Undocumented client scalars |
| Engine distinctiveness multipliers | high 3.5, medium 2.0, low 1.0, very-low 0.5, degraded 0.1, built 0.0 | DEFRA Metric 4.0 tiers (engine) |
| Engine condition multipliers | poor 0.5, moderate 0.7, good 1.0, excellent 1.3 | DEFRA Metric 4.0 (engine) |
| Engine credit-quality weights | additionality 0.30, permanence-risk 0.25, perm-years 0.15, buffer 0.15, CORSIA 0.15 | Engine `assess_credit_quality` |
| BNG market price | $1,200–18,000/unit (mid used for value) | `NATURE_MARKET_PRICE_BENCHMARKS` |

The page also fetches real reference tables from the API
(`/ref/credit-standards`, `/ref/ecosystem-services`, `/ref/habitat-tiers`,
`/ref/price-benchmarks`), which come from the engine's constant blocks.

### 7.3 Calculation walkthrough — engine (the intended path)

`assess_bng_metric`:
```
pre_units  = area · dist_score · pre_cond_mult · strategic_sig
post_units = area · dist_score · post_cond_mult · strategic_sig · temporal · proximity · irreplace
net_gain_% = (post − pre)/pre × 100 ;  compliant = ≥10%
saleable   = max(0, post − pre×1.10)
value_usd  = saleable × mid(BNG_habitat_unit price)
```
`temporal = min(1, legal_years/30)`, `proximity` steps 1.0/0.95/0.85/0.75 by
distance, `irreplace = 1.25` if flagged. Credit quality blends additionality,
permanence-risk (`100 − Σ risk_factor×100`), permanence-years, reversal buffer
(adequate ≥10%) and CORSIA eligibility into tiers A ≥80, B ≥65, C ≥45, D else.

### 7.4 Worked example (engine BNG)

Grassland, area 10 ha, medium distinctiveness (score 0.545 = mid of 0.4–0.69),
pre `poor`(0.5)→post `good`(1.0), strategic significance 1.15, 30-yr agreement
(temporal 1.0), onsite (proximity 1.0), not irreplaceable:

| Step | Computation | Result |
|---|---|---|
| Pre units | 10 × 0.545 × 0.5 × 1.15 | 3.134 |
| Post units | 10 × 0.545 × 1.0 × 1.15 × 1 × 1 | 6.268 |
| Net gain % | (6.268 − 3.134)/3.134 | **+100%** |
| 10% threshold units | 3.134 × 1.10 | 3.447 |
| Saleable | 6.268 − 3.447 | 2.821 units |
| Value | 2.821 × $9,600 mid | **≈$27,080** |

The same site under the *client* formula (dist 8, pre 1, post 3):
baseline `10×8×1×0.30 = 24`, post `10×8×3×0.28 = 67.2`, bng% `+180%` — a materially
different answer, which is why the wiring in §8 matters.

### 7.5 Data provenance & limitations

- Client BNG uses a **non-DEFRA simplification**; TNFD, ecosystem-service and
  credit-quality figures on the page are **synthetic** (`seed()`), not engine
  outputs. Reference tables (standards, prices, habitat tiers) are real.
- The engine itself is deterministic and does **not** use `random` for scores
  (the `import random` is unused); it returns honest structure from real inputs.
- No connectivity multiplier in the client formula (guide's BDU formula includes
  it); `radialData` connectivity is a `seed()` placeholder.

**Framework alignment:** UK Environment Act 2021 / DEFRA Biodiversity Metric 4.0
(habitat units = area × distinctiveness × condition × strategic significance, with
temporal & spatial risk multipliers and a mandatory 10% net gain — implemented in
the engine, approximated on the page) · TNFD v1.0 LEAP (14 core metrics across 4
pillars; the engine scores them and blends LEAP-stage completion) · Kunming-Montreal
GBF Target 15 (6 sub-targets a–f; engine applies TNFD/CSRD/GRI boosts) · TEEB/SEEA-EA
(12 ecosystem services valued at benefit-transfer $/ha) · ICROA (≥10–20% reversal
buffer; CORSIA eligibility set for Verra/ART/Gold Standard).

## 8 · Model Specification

**Status: specification — not yet implemented in code** (as the *page*'s live model;
much already exists server-side in `biodiversity_credit_engine.py`).

**8.1 Purpose & scope.** Deliver a bankable BNG unit count, saleable-credit estimate
and credit-quality tier for a habitat parcel or purchased credit — for developers
meeting statutory 10% BNG, habitat banks, and TNFD-reporting FIs.

**8.2 Conceptual approach.** Adopt the statutory **DEFRA Metric 4.0** unit algebra
(the authoritative UK method) for BNG and a **weighted multi-criteria quality score**
for voluntary credits, benchmarked against **Verra VM0033/CCB** integrity screening
and **ICVCM Core Carbon Principles**-style durability discounting. Wire the page to
the existing engine rather than the client heuristic.

**8.3 Mathematical specification.**
```
Units = A · D · C · S · T · P · I
  D distinctiveness score, C condition mult, S strategic-sig, T=min(1,yrs/30),
  P proximity step, I irreplaceability
NetGain% = (post−pre)/pre·100 ; Saleable = max(0, post − 1.10·pre)
Quality = 0.30·Add + 0.25·PermRisk + 0.15·PermYr + 0.15·Buffer + 0.15·CORSIA
PermRisk = 100 − Σ_f risk_factor_f·100   (wildfire .15, tenure .18, political .20 …)
Value = Saleable · price_mid(habitat_unit)
```

| Parameter | Source |
|---|---|
| D, C, S multipliers | DEFRA Statutory Biodiversity Metric 4.0 |
| Reversal buffer floor | ICROA / registry rule (≥10%) |
| Risk factors | Engine `_PERMANENCE_RISK_FACTORS` (calibrate to registry reversal data) |
| Unit price | Real habitat-bank transactions / DEFRA credit tariff |

**8.4 Data requirements.** Habitat type & area, pre/post condition survey, legal
agreement term, offsite distance, irreplaceability flag, additionality evidence,
buffer %, risk-factor register, market price feed. All exist as engine inputs; the
page must POST them to `/assess`, `/bng-metric`, `/credit-quality` instead of
seeding.

**8.5 Validation & benchmarking.** Reconcile unit counts against DEFRA's official
metric spreadsheet on canonical test parcels (±0 tolerance — it is deterministic);
quality tiers against Verra/BeZero ratings; prices against DEFRA statutory credit
tariff and habitat-bank comparables.

**8.6 Limitations & model risk.** DEFRA multipliers are policy-fixed but revised
(Metric 4.0→ later versions); strategic significance and condition are surveyor
judgements; permanence risk factors are subjective. Conservative fallback: use
statutory metric verbatim, apply the maximum buffer, and treat voluntary co-benefit
premia as upside only.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its substantive engine and calibrate BNG to real habitat data (analytics ladder: rung 1 → 3)

**What.** The backend is real and rich: `biodiversity_credit_engine` implements DEFRA BNG Metric 4.0, TNFD v1.0 LEAP scoring, TEEB/SEEA-EA ecosystem valuation, GBF Target 15, and credit-quality assessment across 5 POST routes and 4 ref endpoints. But the frontend computes its own simplified BNG (`baselineUnits = area × dist × preC × 0.3`) with a seeded `additionalityScore = seed(141)×25+60`, and the harness shows `/assess` **failing** while the other POSTs are `skipped`. Evolution A connects the page to the engine and grounds the habitat data.

**How.** (1) Replace the frontend's local BNG math with `POST /bng-metric` (the engine implements the full Metric 4.0 with distinctiveness tiers, strategic significance, spatial-risk and temporal-risk multipliers — the page's `× 0.3` is a crude stand-in) and retire the seeded additionality score in favour of `/credit-quality`'s real additionality/permanence assessment. (2) Triage the failing `/assess` and skipped POSTs (the REQUIRE_AUTH POST blocker documented 2026-07-05 vs payload bugs) so the write surface is exercised in the harness. (3) Back the habitat library with the UK statutory BNG metric's published habitat-distinctiveness table (DEFRA publishes it) rather than the 9-row `HABITAT_TYPES` seed; price benchmarks from the actual habitat-bank register where available (rung 3: BDU prices calibrated to registered transactions). (4) The engine's ref endpoints already pass and are real — expose their sources in the UI.

**Prerequisites.** POST-failure triage; DEFRA metric table ingestion; habitat-bank price data licensing. **Acceptance:** the BNG tab's units match `/bng-metric` output for the same site (not the local `×0.3` approximation); additionality is engine-derived, not seeded; all five POSTs pass the harness.

### 9.2 Evolution B — Nature-markets assessment copilot (LLM tier 2)

**What.** The engine's `run_full_assessment` already orchestrates BNG + TNFD + ecosystem valuation + GBF + credit quality into a consolidated report — exactly the composite a nature-markets analyst wants. Evolution B is a copilot that drives it: "assess this 40 ha grassland development for BNG compliance and price the credit obligation" runs `/bng-metric` then `/credit-quality`, narrating whether the 10% mandatory gain is met and the credit's permanence/additionality/CORSIA-eligibility verdicts — every unit and price from engine output.

**How.** Tool schemas from the 5 POST + 4 GET routes; grounding corpus is this Atlas record plus the ref endpoints' own source lists (credit standards, habitat tiers, ecosystem services, price benchmarks — all real, all harness-passing). The engine's expected-keys documentation (per §2.3) becomes the copilot's input-gathering script: it asks for habitat type, conditions, area, distinctiveness tier before calling `/bng-metric`, rather than guessing defaults. TNFD/GBF disclosure drafting composes into the report layer. The refusal path: the copilot reports credit quality as the engine scored it and never asserts registry certification.

**Prerequisites.** Evolution A's POST triage (a copilot that can't call `/bng-metric` is useless); input-gathering UX for the engine's many expected keys. **Acceptance:** every BDU, price, and quality score in an answer traces to an engine response; a sub-10% gain project is reported non-compliant with the shortfall; missing required inputs trigger a request, not a fabricated default.