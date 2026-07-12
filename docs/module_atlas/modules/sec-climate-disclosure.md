# SEC Climate Disclosure
**Module ID:** `sec-climate-disclosure` · **Route:** `/sec-climate-disclosure` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
US SEC climate disclosure rule compliance analytics tracking Scope 1/2 emission reporting, material climate risk disclosure, and scenario analysis obligations for registrants.

> **Business value:** Measures registrant readiness against SEC climate disclosure rule requirements and prioritises remediation actions.

**How an analyst works this module:**
- Map registrant obligations under SEC Final Rule 33-11275 by filer category (LAF/AF/SRC).
- Assess current Scope 1/2 GHG inventory, material risk disclosure and governance documentation.
- Identify gaps across financial statement footnote, scenario analysis and transition plan items.
- Build remediation roadmap aligned to phased compliance dates.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `CrossReference`, `FILER_TYPES`, `ITEMS`, `IssuerRegistry`, `ItemsOverview`, `RADAR_BASE`, `RescissionBanner`, `SCENARIO_DATA`, `SECTORS`, `ScenarioAnalysis`, `SectionHeader`, `TABS`, `TCFD_MAP`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FILER_TYPES` | 5 | `float`, `scope12Deadline`, `scope3Deadline`, `assurance` |
| `ITEMS` | 8 | `title`, `form`, `tcfd`, `issb`, `desc` |
| `TCFD_MAP` | 5 | `items`, `color` |
| `SCENARIO_DATA` | 10 | `orderly`, `delayed`, `hot`, `disorderly` |
| `RADAR_BASE` | 7 | `value` |
| `TABS` | 5 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `scope1` | `Math.round(50 + sr(i * 7) * 4900);` |
| `scope2loc` | `Math.round(scope1 * (0.3 + sr(i * 13) * 0.5));` |
| `scope2mkt` | `Math.round(scope2loc * (0.6 + sr(i * 17) * 0.35));` |
| `revenue` | `Math.round(500 + sr(i * 11) * 49500);` |
| `intensity` | `+((scope1 + scope2mkt) / revenue * 1000).toFixed(1);` |
| `readiness` | `Math.round(20 + sr(i * 3) * 75);` |
| `hasSbti` | `sr(i * 5) > 0.5;` |
| `targetYear` | `hasSbti ? (2040 + Math.round(sr(i * 19) * 10)) : null;` |
| `totals` | `useMemo(() => ({ scope1: filtered.reduce((s, c) => s + c.scope1, 0), scope2: filtered.reduce((s, c) => s + c.scope2mkt, 0), sbti:   filtered.filter(c => c.hasSbti).length, trans:  filtered.filter(c => c.hasTransitionPlan).length, }), [filtered]);` |
| `physData` | `useMemo(() => SCENARIO_DATA.map(d => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sec-climate/filer-assessment` | `filer_assessment` | api/v1/routes/sec_climate.py |
| POST | `/api/v1/sec-climate/ghg-disclosure` | `ghg_disclosure` | api/v1/routes/sec_climate.py |
| POST | `/api/v1/sec-climate/financial-effects` | `financial_effects` | api/v1/routes/sec_climate.py |
| POST | `/api/v1/sec-climate/materiality` | `materiality_assessment` | api/v1/routes/sec_climate.py |
| GET | `/api/v1/sec-climate/ref/filer-categories` | `ref_filer_categories` | api/v1/routes/sec_climate.py |
| GET | `/api/v1/sec-climate/ref/reg-sk-items` | `ref_reg_sk` | api/v1/routes/sec_climate.py |
| GET | `/api/v1/sec-climate/ref/reg-sx-items` | `ref_reg_sx` | api/v1/routes/sec_climate.py |
| GET | `/api/v1/sec-climate/ref/attestation` | `ref_attestation` | api/v1/routes/sec_climate.py |
| GET | `/api/v1/sec-climate/ref/safe-harbor` | `ref_safe_harbor` | api/v1/routes/sec_climate.py |
| GET | `/api/v1/sec-climate/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/sec_climate.py |

### 2.3 Engine `sec_climate_engine` (services/sec_climate_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SECClimateEngine.assess_filer` | registrant_name, cik, filer_category, fiscal_year, governance_score, strategy_score, risk_management_score, targets_goals_score | Assess SEC climate disclosure compliance for a registrant. |
| `SECClimateEngine.assess_ghg_disclosure` | registrant_name, fiscal_year, scope_1_total_co2e_mt, scope_1_by_gas, scope_1_methodology, scope_2_location_co2e_mt, scope_2_market_co2e_mt, scope_2_methodology | Assess GHG emissions disclosure completeness and attestation readiness. |
| `SECClimateEngine.assess_financial_effects` | registrant_name, fiscal_year, pre_tax_income_usd, total_equity_usd, severe_weather_losses_usd, severe_weather_events, carbon_offset_expenses_usd, rec_expenses_usd | Assess Reg S-X 14-02 financial statement effects of climate events. |
| `SECClimateEngine.assess_materiality` | registrant_name, fiscal_year, physical_risks, transition_risks, scenario_analysis_used, internal_carbon_price_usd_per_tco2e, strategy_resilience_assessment | Assess materiality of climate risks under SEC Items 1502 and 1503. |
| `SECClimateEngine._generate_recommendations` | gaps, ghg_required, assurance_required, assurance_level, has_limited, has_reasonable |  |
| `SECClimateEngine.get_filer_categories` |  |  |
| `SECClimateEngine.get_reg_sk_items` |  |  |
| `SECClimateEngine.get_reg_sx_items` |  |  |
| `SECClimateEngine.get_attestation_requirements` |  |  |
| `SECClimateEngine.get_safe_harbor` |  |  |
| `SECClimateEngine.get_cross_framework_map` |  |  |
| `SECClimateEngine.get_rule_status` |  | Return P1-10 advisory: rule rescission status for UI/API consumers. |

**Engine `sec_climate_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `SEC_RULE_STATUS` | `{'rule_reference': 'SEC Release 33-11275', 'rule_title': 'The Enhancement and Standardization of Climate-Related Disclosures for Investors', 'adopted_date': '2024-03-06', 'stayed_date': '2024-04-04', 'rescinded_date': '2025-03-27', 'current_status': 'RESCINDED', 'legal_force': False, 'advisory_only'` |
| `FILER_CATEGORIES` | `{'large_accelerated_filer': {'label': 'Large Accelerated Filer (LAF)', 'public_float_min_usd': 700000000, 'ghg_disclosure_start_fy': 2025, 'limited_assurance_fy': 2027, 'reasonable_assurance_fy': 2029, 'climate_risk_disclosure_required': True, 'scope_12_required': True, 'scope_3_required': False, 'f` |
| `REG_SK_ITEMS` | `[{'item': '1501', 'title': 'Governance', 'description': 'Board oversight and management role in climate-related risk governance', 'sub_items': ['1501(a) Board oversight of climate risks', '1501(b) Management role in assessing/managing climate risks'], 'required_for': ['all_filers']}, {'item': '1502'` |
| `REG_SX_ITEMS` | `[{'item': '14-02(a)', 'title': 'Severe weather events & natural conditions', 'description': 'Expenditures and losses from severe weather events if material (>1% pre-tax income or equity)', 'threshold_pct': 1.0}, {'item': '14-02(b)', 'title': 'Transition activities', 'description': 'Expenses and capi` |
| `ATTESTATION_REQUIREMENTS` | `{'limited_assurance': {'standard': 'AICPA AT-C 105/210 or PCAOB equivalent', 'level': 'limited', 'description': 'Limited assurance on Scope 1 & 2 GHG emissions'}, 'reasonable_assurance': {'standard': 'AICPA AT-C 105/205 or PCAOB equivalent', 'level': 'reasonable', 'description': 'Reasonable assuranc` |
| `SAFE_HARBOR` | `{'forward_looking': True, 'covered_items': ['Transition plans', 'Climate targets and goals (Item 1504)', 'Scenario analysis (Item 1502(c))', 'Internal carbon price (Item 1502(d))'], 'not_covered': ['Historical GHG emissions (Item 1505)', 'Financial statement effects (Reg S-X 14-02)'], 'note': 'PSLRA` |
| `SEC_CROSS_FRAMEWORK_MAP` | `[{'sec_item': 'Item 1501 (Governance)', 'tcfd': 'Governance (a)(b)', 'issb_s2': 'IFRS S2 para 5-6', 'csrd_esrs': 'ESRS 2 GOV-1, GOV-2'}, {'sec_item': 'Item 1502 (Strategy)', 'tcfd': 'Strategy (a)(b)(c)', 'issb_s2': 'IFRS S2 para 8-15', 'csrd_esrs': 'ESRS E1 SBM-3'}, {'sec_item': 'Item 1503 (Risk Man` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `FILER_TYPES`, `ITEMS`, `RADAR_BASE`, `SCENARIO_DATA`, `SECTORS`, `TABS`, `TCFD_MAP`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Rule Items Assessed | — | SEC 33-11275 | Total disclosure requirements assessed under the SEC final climate disclosure rule. |
| Readiness Score | — | Gap analysis | Current compliance readiness across all assessed registrant obligations. |
| Scope 1+2 Coverage | — | GHG inventory | Share of consolidated entities with verified Scope 1 and 2 GHG data for SEC reporting. |
- **SEC filing data, GHG inventory, material risk assessments** → Rule item mapping, gap scoring, filer category classification → **Readiness scores, gap reports, remediation plans**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sec-climate/ref/attestation** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['attestation'], 'n_keys': 1}`

**GET /api/v1/sec-climate/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cross_framework'], 'n_keys': 1}`

**GET /api/v1/sec-climate/ref/filer-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['filer_categories'], 'n_keys': 1}`

**GET /api/v1/sec-climate/ref/reg-sk-items** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['reg_sk_items'], 'n_keys': 1}`

**GET /api/v1/sec-climate/ref/reg-sx-items** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['reg_sx_items'], 'n_keys': 1}`

**GET /api/v1/sec-climate/ref/safe-harbor** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['safe_harbor'], 'n_keys': 1}`

**POST /api/v1/sec-climate/filer-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sec-climate/financial-effects** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Disclosure Readiness Score
**Headline formula:** `Completed SEC Requirements ÷ Total SEC Requirements × 100`

Percentage of SEC climate disclosure obligations met based on rule item-by-item gap analysis.

**Standards:** ['SEC Final Rule 33-11275', 'GHG Protocol']
**Reference documents:** SEC Final Rule 33-11275 The Enhancement and Standardization of Climate-Related Disclosures 2024; GHG Protocol Corporate Standard; TCFD Final Recommendations 2017; SEC Staff Guidance on Climate Disclosures

**Engine `sec_climate_engine` — extracted transformation lines:**
```python
notes = [rescission_note] + notes
yoy_s1 = ((scope_1_total_co2e_mt - prior_year_scope_1) / prior_year_scope_1 * 100
yoy_s2 = ((scope_2_location_co2e_mt - prior_year_scope_2) / prior_year_scope_2 * 100
total_ghg = scope_1_total_co2e_mt + scope_2_location_co2e_mt
intensity_value = round(total_ghg / revenue_or_denominator, 2)
threshold = base * 0.01 if base > 0 else 0
total_transition = (carbon_offset_expenses_usd + rec_expenses_usd +
total_estimates = climate_impairments_usd + climate_contingencies_usd
total_impact = severe_weather_losses_usd + total_transition + total_estimates + transition_capex_usd
all_risks = physical_risks + transition_risks
material_count=len(material_physical) + len(material_transition),
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `sec_climate_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `sec-climate-rule` | engine:sec_climate_engine |

## 7 · Methodology Deep Dive

> ⚠️ **Regulatory status note (not a guide↔code mismatch, but material).** The SEC's climate disclosure rule
> (Release 33-11275, adopted March 2024) was voluntarily stayed in April 2024 and then **formally rescinded
> by SEC vote on 27 March 2025** — it never took legal effect and currently imposes no obligation on any
> filer. The MODULE_GUIDES entry (dataPoints like "Readiness Score 72%", "Scope 1+2 Coverage 89%") reads as
> if the rule is a live compliance requirement; it is not. Both the frontend page (a banner comment at the
> top of the file) and the backend engine (`SEC_RULE_STATUS` dict, `current_status: "RESCINDED"`,
> `legal_force: False`) correctly caveat this — the engine is explicitly maintained as a **voluntary/
> educational TCFD-and-ISSB-S2-aligned framework**, not an SEC compliance tool. Readers should treat every
> "compliance," "readiness," or "gap" figure below as advisory self-assessment against a defunct rule text,
> not a legal requirement.

### 7.1 What the module computes

40 synthetic companies (`genCompanies`, seeded `sr(s)=frac(sin(s+1)×10⁴)`) are distributed across 10
sectors and 3 filer tiers (`i<15`→LAF, `i<28`→AF, else NAF — a fixed positional split, not a real
public-float classification). Each carries Scope 1, location- and market-based Scope 2, revenue, an
intensity metric, and several boolean readiness flags:

```js
scope2loc = scope1 × (0.3 + sr()×0.5)                       // location-based always higher than market-based ceiling
scope2mkt = scope2loc × (0.6 + sr()×0.35)                    // market-based always ≤ location-based by construction
intensity = (scope1 + scope2mkt) / revenue × 1000            // tCO2e per $1,000 revenue
readiness = round(20 + sr()×75)                              // 20–95, independent of the other flags
```

`hasSbti`, `hasTransitionPlan`, `physRiskMat`, `tranRiskMat` are independent `sr()>threshold` booleans;
`assuranceLevel` is only assigned for the first 15 (LAF) companies.

### 7.2 Parameterisation

| Reg S-K item | TCFD pillar | ISSB IFRS S2 §§ | Content |
|---|---|---|---|
| Item 1500 | Risk Management | §10–19 | Climate risk identification (physical/transition) |
| Item 1501 | Governance | §6–9 | Board oversight |
| Item 1502 | Strategy | §10–19 | Material impacts on business model |
| Item 1503 | Risk Management | §20–25 | ERM integration process |
| Item 1504 | Metrics & Targets | §29–37 | Scope 1 & 2 GHG (location + market-based) |
| Item 1505 | Metrics & Targets | §38–41 | Targets, transition plans, offsets/RECs |
| Reg S-X §14 | Strategy (financial) | §26–28 | Financial statement effects >1% of line items |

This cross-mapping table (7 items × TCFD pillar × ISSB section) is **real regulatory content** — it
accurately reflects the actual (rescinded) rule's structure and its genuine overlap with TCFD's 4 pillars
and ISSB IFRS S2's paragraph numbering, independently corroborated by the backend engine's docstring
(§1500–1505, Reg S-X §14-02).

| Filer tier | Public float | Scope 1/2 phase-in (as adopted, now moot) | Assurance |
|---|---|---|---|
| Large Accelerated Filer | ≥$700M | FY2025 | Limited FY2027 → Reasonable FY2029 |
| Accelerated Filer | $75M–$700M | FY2026 | Limited FY2028 → Reasonable FY2031 |
| Non-Accelerated/SRC/EGC | <$75M | Exempt from Scope 1/2 | None |

### 7.3 Calculation walkthrough

1. `filtered` narrows the 40-company array by sector/filer-type UI selectors.
2. `kpis = useMemo(() => { const n = Math.max(1, filtered.length); ... })` — guarded portfolio KPI means
   (avg readiness, avg intensity, SBTi %, transition-plan %) computed over `filtered`.
3. **Financial-effects calculator** (interactive tool): `scope3Add = calcScope3 ? base×0.6 : 0`,
   `revenueScale = log10(max(1,calcRevenue)) / log10(100)` (a log-dampened revenue scaling factor —
   larger companies get a sub-linear multiplier), `total = base×revenueScale + scope3Add` — a heuristic
   sizing tool for illustrative "what would financial-statement-effects disclosure look like," not a
   genuine cost model.
4. **TREND** (12-quarter Q3-22→Q2-25 series) and **SECTOR_BENCHMARKS** are `SECTORS.map()`-derived synthetic
   series layered onto the same company pool, used for the readiness-over-time and sector-comparison charts.

### 7.4 Worked example

Company `i=3` (Industrials, LAF), illustrative draw: `scope1 = round(50+sr(21)×4900) ≈ 2,340`,
`scope2loc = 2,340×(0.3+sr(39)×0.5) ≈ 2,340×0.62 ≈ 1,451`, `scope2mkt = 1,451×(0.6+sr(51)×0.35) ≈
1,451×0.78 ≈ 1,132`, `revenue = round(500+sr(33)×49500) ≈ 18,200`.

| KPI | Computation | Result |
|---|---|---|
| Intensity | `(2,340+1,132)/18,200×1000` | 190.8 tCO₂e / $1,000 revenue |
| Readiness | `round(20+sr(9)×75)` | e.g. 63/100 |
| Scope 2 gap | `scope2loc − scope2mkt` | 319 (market-based always lower — illustrates RECs/PPA effect, though mechanically forced by the `×0.6-0.95` multiplier rather than actual contract data) |

### 7.5 Companion analytics on the page

- **TCFD cross-map radar** (`RADAR_BASE`, 6 hardcoded axis scores 41–84) is a single static illustrative
  snapshot, not computed from the 40-company dataset.
- **Scenario adoption trajectory** (`SCENARIO_DATA`, 2025→2050, 4 named pathways Orderly/Delayed/Hot-house/
  Disorderly) is a fixed hand-authored curve set, illustrating NGFS-style scenario-naming conventions
  without being tied to NGFS's actual published trajectories.

### 7.6 Data provenance & limitations

- **All 40 companies and every quantitative field are synthetic**, generated via `sr(seed)=frac(sin(seed+1)×
10⁴)`; filer-tier assignment is a fixed positional split (first 15/13/12), not based on any real public-float
figure.
- `scope2mkt < scope2loc` is guaranteed by construction of the multiplier ranges (`0.6–0.95× scope2loc`),
  not because the company actually purchased RECs/PPAs — a real market-based Scope 2 figure could equal or
  exceed the location-based figure.
- `readiness` is an independent random draw, uncorrelated with `hasSbti`/`hasTransitionPlan`/assurance flags
  — a "95% ready" company could still show `hasTransitionPlan: false`.
- The regulatory item↔TCFD↔ISSB cross-mapping table (§7.2) is the module's most reliably grounded content —
  it reflects the actual rule text structure and should survive as reference material even though the rule
  itself is defunct.

**Framework alignment:** SEC Release 33-11275 (Reg S-K Items 1500–1505, Reg S-X §14) — **rescinded 27 March
2025, advisory-only per the engine's own `SEC_RULE_STATUS`** · TCFD 4-pillar structure (Governance, Strategy,
Risk Management, Metrics & Targets) — genuinely mapped, still a valid voluntary framework · ISSB IFRS S2
paragraph references — genuinely mapped, still current and increasingly the global convergence standard the
former SEC rule was modelled on.

## 9 · Future Evolution

### 9.1 Evolution A — EDGAR-calibrated disclosure benchmarking across live regimes (analytics ladder: rung 1 → 3)

**What.** The module already has a real backend vertical (10 routes in `api/v1/routes/sec_climate.py`, `sec_climate_engine` with honest YoY/intensity math) and — correctly — treats Release 33-11275 as rescinded (`SEC_RULE_STATUS`, `legal_force: False`), positioning itself as a voluntary TCFD/ISSB-S2 framework. What it lacks is any observed data: the 40 frontend companies are `sr()`-synthetic with a fixed positional filer split, and `readiness` is a random draw uncorrelated with the disclosure flags. Evolution A calibrates readiness scoring against actual filings: ingest climate-related sections of real 10-Ks via SEC EDGAR full-text search (free, keyless) and score real registrants item-by-item against the Reg S-K 1500–1505 ↔ TCFD ↔ ISSB S2 cross-mapping the page already carries (its "most reliably grounded content" per §7.6).

**How.** (1) An `edgar_climate_ingester` following the platform's 19-ingester scaffold, populating `sec_filing_climate_sections`. (2) Extend `POST /materiality` and `/filer-assessment` to accept an actual CIK, deriving disclosure booleans from filing evidence rather than user assertion. (3) Sector-level benchmark distributions (real disclosure rates per S-K item) replacing the synthetic 40-company roster.

**Prerequisites.** EDGAR rate-limit handling (10 req/s, User-Agent header); the frontend must drop the `sr()` company generator once real distributions exist. **Acceptance:** readiness score for a named registrant cites specific filing excerpts; `hasTransitionPlan` can no longer be true while readiness contradicts it.

### 9.2 Evolution B — Disclosure-drafting analyst over the ref endpoints (LLM tier 2)

**What.** The module's six `GET /ref/*` endpoints (filer-categories, reg-sk-items, reg-sx-items, attestation, safe-harbor, cross-framework) are a structured regulatory corpus ideally shaped for tool-calling. Evolution B is a copilot that answers "what would Item 1502(a) have required of an LAF, and what is the ISSB S2 equivalent I should disclose voluntarily?" by calling those endpoints, and drafts gap-remediation language grounded in the registrant's own `filer-assessment` response — always carrying the engine's rescission note forward so no answer implies live SEC obligation.

**How.** Tool schemas from the module's OpenAPI operations (all read-only except the four POST assessments, which are compute-only, no mutation); system prompt assembled from this Atlas page with the §7 regulatory-status note pinned as a non-negotiable preamble. The fabrication validator checks numerics against tool outputs; the rescission caveat is asserted by a post-response check (answer must not contain "required by the SEC" without the qualifier).

**Prerequisites.** None hard — the backend already exists and correctly caveats status; the copilot inherits that honesty. **Acceptance:** every cited rule item traces to a `/ref/*` response; asking "when is my Scope 3 filing due to the SEC?" yields the rescission explanation, not a date.