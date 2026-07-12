# Api::Nature_Capital
**Module ID:** `api::nature_capital` · **Route:** `/api/v1/nature-capital` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/nature-capital/disclosure-score` | `disclosure_score_endpoint` | api/v1/routes/nature_capital.py |
| GET | `/api/v1/nature-capital/ref/ecosystem-types` | `get_ecosystem_types` | api/v1/routes/nature_capital.py |
| GET | `/api/v1/nature-capital/ref/seea-accounts` | `get_seea_accounts` | api/v1/routes/nature_capital.py |
| GET | `/api/v1/nature-capital/ref/encore-services` | `get_encore_services` | api/v1/routes/nature_capital.py |
| GET | `/api/v1/nature-capital/ref/tnfd-disclosures` | `get_tnfd_disclosures` | api/v1/routes/nature_capital.py |
| GET | `/api/v1/nature-capital/ref/biome-values` | `get_biome_values` | api/v1/routes/nature_capital.py |

### 2.3 Engine `nature_capital_engine` (services/nature_capital_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_bool_evidence_score` | items | Fraction of items marked True, scored ONLY over items with evidence. Returns None (insufficient_data) when no item in the group has evidence, so absence of data can never be reported as a 0% or fabricated score. |
| `_weighted_present_mean` | pairs | Weighted mean over (value, weight) pairs, skipping None values. Weights are re-normalised across the present values so a missing framework does not drag the composite toward zero. Returns None if nothing is present. |
| `assess_natural_capital` | entity_id, asset_name, ecosystem_type, extent_ha, location_country, condition_score, dependency_score, impact_score | Assess natural capital for an ecosystem asset. Monetary valuation is a genuine benefit-transfer computation from TEEB/IPBES biome unit values scaled by the caller-supplied ecosystem *condition_score* (0-1, reference state = 1.0). Entity-specific TNFD dependency/impact scores, the MSA biodiversity index, and CBD GBF Target-15 sub-element status are reported only when the caller supplies them; absen |
| `valuate_ecosystem_services` | entity_id, ecosystem_type, extent_ha, services_list, condition_multiplier | Valuate ecosystem services via benefit transfer from TEEB/IPBES biome values. Each service is priced by its ENCORE category's share of the biome total unit value, split evenly across the services in that category (an explicit equal- allocation model rule applied absent service-specific primary-study weights). The result is scaled by the caller-supplied *condition_multiplier* (0-1); when it is not  |
| `calculate_dependency_score` | entity_id, sector, operations_description, revenue_usd, substitutability_score, operations_in_sensitive_areas | Calculate sector nature-dependency score from the ENCORE sector matrix. The sector dependency score, key services, and revenue-at-risk *percentage* are genuine reference-data lookups (SECTOR_NATURE_DEPENDENCY). Revenue-at-risk in USD is computed only when the caller supplies actual *revenue_usd*; without it the amount is null. Entity/site-specific figures that are not in reference data (per-depend |
| `score_natural_capital_disclosure` | entity_id, reporting_standard, disclosure_evidence | Score natural-capital disclosure completeness from caller-supplied evidence. This is an evidence-driven assessment: scores are computed only from a *disclosure_evidence* mapping the caller provides. Expected shape:: { "tnfd": {"TNFD-G1": 0.9, "TNFD-S1": 0.5, ...}, # per-disclosure 0-1 "seea": {"extent_account": True, "condition_account": False, ...}, "gri304": {"304-1_operational_sites": True, ... |
| `generate_nature_balance_sheet` | entity_id, assets, restoration_investment_usd | Generate a SEEA EA 2021 natural-capital balance sheet from reported assets. Stock values are a genuine capitalisation (10× annual biome service flow) of caller-reported extent and condition. Each asset must carry ``extent_ha`` and an opening condition (``opening_condition`` or ``condition_score``, 0-1); closing extent/condition default to the opening values (no-reported-change) unless the asset su |

**Engine `nature_capital_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `SEEA_EA_ACCOUNT_TYPES` | `[{'id': 'EA-1', 'name': 'Ecosystem Extent Account', 'description': 'Area of each ecosystem type at start and end of accounting period', 'unit': 'hectares'}, {'id': 'EA-2', 'name': 'Ecosystem Condition Account', 'description': 'Condition of each ecosystem measured against reference state', 'unit': 'c` |
| `BIOME_UNIT_VALUES` | `{'tropical_forest': {'total_usd_ha_yr': 5264, 'provisioning': 1200, 'regulating': 3200, 'cultural': 864, 'source': 'TEEB 2010 / Costanza et al 2014'}, 'temperate_forest': {'total_usd_ha_yr': 3137, 'provisioning': 980, 'regulating': 1800, 'cultural': 357, 'source': 'TEEB 2010'}, 'boreal_forest': {'to` |
| `ENCORE_ECOSYSTEM_SERVICES` | `{'provisioning': [{'id': 'ES-P01', 'name': 'Cultivated terrestrial plants for nutrition', 'sector_dependencies': ['agriculture', 'food_beverage']}, {'id': 'ES-P02', 'name': 'Cultivated aquatic plants for nutrition', 'sector_dependencies': ['fishing', 'food_beverage']}, {'id': 'ES-P03', 'name': 'Rear` |
| `TNFD_DISCLOSURE_TOPICS` | `[{'id': 'TNFD-G1', 'pillar': 'Governance', 'topic': 'Board oversight of nature-related dependencies, impacts, risks and opportunities'}, {'id': 'TNFD-G2', 'pillar': 'Governance', 'topic': "Management's role in assessing and managing nature-related issues"}, {'id': 'TNFD-S1', 'pillar': 'Strategy', 't` |
| `SECTOR_NATURE_DEPENDENCY` | `{'agriculture': {'dependency_score': 0.92, 'key_services': ['ES-P01', 'ES-R11', 'ES-R05', 'ES-R07'], 'revenue_at_risk_pct': 45}, 'food_beverage': {'dependency_score': 0.88, 'key_services': ['ES-P01', 'ES-P03', 'ES-R11', 'ES-R06'], 'revenue_at_risk_pct': 38}, 'forestry': {'dependency_score': 0.95, 'k` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `nature`, `primary`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/nature-capital/ref/biome-values** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['methodology', 'price_year', 'currency', 'caveat', 'biome_count', 'biomes'], 'n_keys': 6}`

**GET /api/v1/nature-capital/ref/ecosystem-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'ecosystem_count', 'ecosystems'], 'n_keys': 3}`

**GET /api/v1/nature-capital/ref/encore-services** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'version', 'total_services', 'categories'], 'n_keys': 4}`

**GET /api/v1/nature-capital/ref/seea-accounts** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'adopted_by_un', 'accounts_count', 'accounts'], 'n_keys': 4}`

**GET /api/v1/nature-capital/ref/tnfd-disclosures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'version', 'published', 'total_disclosures', 'pillars', 'all_disclosures', 'leap_approach'], 'n_keys': 7}`

**POST /api/v1/nature-capital/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/nature-capital/balance-sheet** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/nature-capital/dependency-score** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `nature_capital_engine` — extracted transformation lines:**
```python
unit_value = (cat_unit_value / n_in_cat) * condition_multiplier
annual_flow = unit_value * extent_ha
dep_gt = (dep_score or 0)  # null-safe threshold comparisons below
pillars_status[p] = round(sum(vals) / len(vals), 3) if vals else None
extent_change = close_extent - open_extent
value_change = close_value - open_value
net_change = closing_stock_usd - opening_stock_usd
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — the engine header ("E77 Nature Capital Accounting") is the methodology statement; nothing to reconcile.)*

### 7.1 What the module computes

`backend/services/nature_capital_engine.py` implements five functions spanning **SEEA-EA natural-capital accounting, TEEB benefit-transfer valuation, ENCORE dependency scoring and multi-framework disclosure assessment**, exposed via `api/v1/routes/nature_capital.py` (`POST /assess`, `/dependency-score`, `/balance-sheet`; `GET /ref/{biome-values, ecosystem-types, encore-services, seea-accounts, tnfd-disclosures}`):

1. **`assess_natural_capital`** — one ecosystem asset: monetary value = biome unit value × condition × extent, plus TNFD dependency/impact, MSA and GBF Target-15 pass-throughs.
2. **`valuate_ecosystem_services`** — service-level benefit transfer with equal intra-category allocation.
3. **`calculate_dependency_score`** — ENCORE-style sector dependency lookup + TNFD LEAP scaffold.
4. **`score_natural_capital_disclosure`** — evidence-driven completeness across TNFD/SEEA/GRI 304/ESRS E4/GBF-T15 with a renormalised composite.
5. **`generate_nature_balance_sheet`** — SEEA EA opening/closing stock accounts (capitalised at 10× annual flow) with an integrated-P&L block.

### 7.2 Parameterisation

**Biome unit values** (`BIOME_UNIT_VALUES`, USD/ha/yr, per-row source strings citing TEEB 2010 / Costanza et al. 2014 / De Groot et al. / IPBES 2019 — "conservative estimates from academic literature"), 19 biomes split provisioning/regulating/cultural. Extremes: coral reef $352,249 · mangrove $33,750 · coastal wetland $28,916 · seagrass $19,004 … desert $43. These magnitudes track the published Costanza/de-Groot ecosystem-service value syntheses (coral reefs ≈ $350k/ha/yr in 2011-USD updates). Unknown ecosystem types fall back to `temperate_forest` ($3,137).

**ENCORE services:** 49 encoded services (20 provisioning ES-P, 23 regulating ES-R, 6 cultural ES-C) with sector-dependency tags — a condensation of ENCORE's published service taxonomy (header claims the 62-service framing). **Sector dependency matrix** (12 sectors, "simplified, 58 sectors → 12 illustrative"): forestry 0.95/55% revenue-at-risk, agriculture 0.92/45%, fishing 0.90/60%, food & beverage 0.88/38% … manufacturing 0.50/15%. **TNFD:** the 14 recommended disclosures across the four pillars (G1-2, S1-4, RM1-3, MT1-4 + LEAP). **Disclosure composite weights:** TNFD 0.35 · SEEA 0.20 · ESRS E4 0.20 · GRI 304 0.15 · GBF-T15 0.10 (platform convention), renormalised over frameworks with evidence. **WAVES metadata:** 4% discount rate; NPV factor 17.3 (≈ 30-yr annuity at 4%); balance-sheet capitalisation multiple **10×** annual flow.

**Data-integrity contract** (docstrings): condition, dependency/impact, MSA, GBF flags, revenue, evidence and restoration investment are entity inputs — absent inputs yield honest nulls with `data_notes`; helpers `_bool_evidence_score` and `_weighted_present_mean` score only over supplied evidence "so absence of data can never be reported as a 0%".

### 7.3 Calculation walkthrough

**Asset assessment:** `monetary_value = total_usd_ha_yr × condition × extent_ha`; per-category flows scale the same way. SEEA account label: EA-4 (monetary) when condition known, else EA-2 (condition account still to populate).

**Service valuation:** each selected service is priced `category_unit_value / n_selected_in_category × condition`; total flow = Σ over services × extent; NPV₃₀ = flow × 17.3. Confidence: `reference_state` when condition unsupplied (multiplier 1.0), else medium (> 0.75) / low.

**Dependency score:** reference lookups (score, key services, revenue-at-risk %); `revenue_at_risk_usd = revenue × pct/100` only with real revenue; LEAP L/E/A/P scaffold populated from thresholds (supply-chain exposure high if score > 0.75; impact drivers expand if > 0.7), with the Assess step's risk magnitudes explicitly `insufficient_data`. A stylised 2030 nature-loss scenario scales revenue-at-risk ×1.4 (BAU) / ×0.6 (1.5 °C-aligned).

**Disclosure scoring:** TNFD per-disclosure 0–1 evidence (complete ≥ 0.8 / partial ≥ 0.5 / missing), pillar means, SEEA 6 accounts + GRI 304-1..4 + ESRS E4-1..6 + GBF-T15 a–f as boolean-evidence fractions; composite = weighted mean over present frameworks.

**Balance sheet:** per asset, `stock = biome_value × condition × extent × 10` at opening and closing (closing defaults to opening = "no reported change"); `depreciation_rate = (1 − close_cond/open_cond) × 100`; integrated P&L reports recognised annual service flow, negative value changes as natural-capital depreciation, and net change; assets missing extent/condition are excluded and listed.

### 7.4 Worked example — mangrove asset, balance sheet

One asset: mangrove, 1,200 ha, opening condition 0.85, closing condition 0.80 (degradation), extent unchanged. Biome value $33,750/ha/yr.

| Quantity | Computation | Result |
|---|---|---|
| Opening stock | 33,750 × 0.85 × 1,200 × 10 | **$344.25M** |
| Closing stock | 33,750 × 0.80 × 1,200 × 10 | **$324.0M** |
| Net change | 324.0 − 344.25 | **−$20.25M** (−5.88%) |
| Annual service flow | 33,750 × 0.80 × 1,200 | **$32.4M** |
| Depreciation rate | (1 − 0.80/0.85) × 100 | **5.88%** |

Companion single-asset assessment at condition 0.80: monetary value = 33,750 × 0.80 × 1,200 = $32.4M/yr, split provisioning 5,200×0.8 = $4,160/ha, regulating $20,000/ha, cultural $2,840/ha. Dependency view for an agriculture counterparty with $500M revenue: score 0.92, revenue at risk 45% → **$225M**; BAU-2030 63%, 1.5 °C-aligned 27%.

### 7.5 Data provenance & limitations

- **No PRNG** — deterministic benefit transfer over caller inputs, with the platform's honest-null contract fully applied (notes enumerate every missing input; empty evidence → all-null disclosure scores).
- Biome values are static benefit-transfer constants: real TEEB/Costanza values vary by study site, income level and price year, and unit-value transfer to arbitrary sites is the weakest (though standard) valuation method; per-row source strings make provenance auditable.
- The 10× capitalisation multiple and 17.3 NPV factor are internally inconsistent as stated (a 4%/30-yr annuity is ≈ 17.3, so the balance sheet's 10× implies a much higher implicit discount rate or shorter horizon) — both are labelled model conventions.
- Equal intra-category allocation of service value is an explicit model rule ("absent service-specific primary-study weights"); ENCORE's actual materiality ratings are not encoded per service.
- Sector matrix covers 12 of ENCORE's real sector universe; unknown sectors return null rather than a guess.
- The 1.4×/0.6× 2030 scenario multipliers are unattributed narrative scalars.

### 7.6 Framework alignment

- **SEEA EA 2021 (UN System of Environmental-Economic Accounting — Ecosystem Accounting):** the five core accounts (extent, condition, physical & monetary services supply-use, asset) plus thematic accounts are encoded (EA-1..EA-6) and drive the balance-sheet structure ("Tables 5.1–5.4"); condition-scaled valuation mirrors SEEA's reference-condition concept.
- **TNFD v1.0 (Sept 2023):** all 14 recommended disclosures and the LEAP approach (Locate → Evaluate → Assess → Prepare) are implemented as the disclosure checklist and the dependency function's assessment scaffold.
- **ENCORE (Natural Capital Finance Alliance):** the ecosystem-service taxonomy and sector-dependency materiality concept; ENCORE itself rates dependency materiality per production process — here condensed into one score + key services per sector.
- **TEEB / IPBES / Costanza et al. (benefit transfer):** the unit-value-transfer valuation method with cited literature values.
- **WAVES (World Bank):** wealth-accounting framing for capitalised service flows and adjusted-savings language.
- **CBD Global Biodiversity Framework Target 15:** the a–f sub-elements (assess, disclose, reduce, restore, sustainable use, equitable sharing) as a boolean alignment checklist for corporate biodiversity action.
- **CSRD ESRS E4 & GRI 304:** E4-1..E4-6 (biodiversity transition plan through anticipated financial effects) and GRI 304-1..304-4 (sites, impacts, habitats protected, IUCN Red List species) as disclosure-coverage checklists.
- **PBAF 2023 / SBTN:** referenced in the header/`sbtn_scope` as the financial-institution biodiversity-accounting and science-based-targets-for-nature context.

## 9 · Future Evolution

### 9.1 Evolution A — Location-grounded valuation and uncertainty on benefit transfer (analytics ladder: rung 1 → 3)

**What.** The E77 engine spans SEEA-EA natural-capital accounting, TEEB benefit-transfer
valuation, ENCORE dependency scoring, multi-framework disclosure assessment, and a nature
balance sheet. Monetary value is `biome_unit_value × condition × extent`, with service
valuation using *equal intra-category allocation* — a documented simplification — and the
biome-values reference already carries a `caveat` and `price_year`, acknowledging that
benefit-transfer values are point estimates. Evolution A adds spatial grounding and
uncertainty.

**How.** (1) Resolve biome/ecosystem type and condition from the platform's spatial nature
data (`nature_data` module's WDPA/GFW layers, the digital-twin land grids) rather than
caller-asserted category, reporting an `evidence_tier`. (2) Replace equal intra-category
service allocation with a weighted allocation where evidence supports it, and attach a
value range (low/central/high) to every benefit-transfer figure — TEEB values have wide
confidence intervals that the caveat currently only mentions in prose. (3) Inflation-adjust
`biome_unit_value` from `price_year` to the assessment year. (4) Bench-pin the balance-sheet
opening/closing reconciliation.

**Prerequisites.** Spatial nature-data linkage (module exists but see its own db-empty
gaps); an inflation index for value updating. **Acceptance:** two assets in different
biomes get location-resolved values with an `evidence_tier`; every monetary figure carries
a range, not a point; balance-sheet net change reconciles and is bench-pinned.

### 9.2 Evolution B — Natural-capital accounting copilot (LLM tier 2)

**What.** A copilot that runs `/assess`, `/dependency-score`, and `/balance-sheet` for an
entity and narrates the account — "your wetland asset is valued at $X/yr (central; range
Y–Z); ENCORE flags high dependency on water provisioning; your TNFD disclosure composite
is 62% with GBF Target-15 the weakest" — each figure tool-sourced.

**How.** Three POST endpoints plus five `/ref/*` taxonomies (biome-values with methodology
and caveat, ecosystem types, ENCORE services, SEEA accounts, TNFD disclosures) that fully
ground the frameworks. The disclosure-scoring endpoint drives a gap narrative; the
balance-sheet endpoint supports period-over-period stories. The `biome-values` caveat is
exactly what the copilot must surface — it should lead valuation answers with the
benefit-transfer uncertainty, not bury it.

**Prerequisites.** None hard — engine is honest and reference-complete; stronger with
Evolution A's value ranges. **Acceptance:** every value, dependency, and disclosure score
traces to a tool response; the copilot states the benefit-transfer caveat and price-year
on every monetary figure; it refuses to present ecosystem values as market prices and
frames them as the accounting estimates the engine computes.