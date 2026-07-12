# Temperature Alignment Waterfall
**Module ID:** `temperature-alignment-waterfall` · **Route:** `/temperature-alignment-waterfall` · **Tier:** A (backend vertical) · **EP code:** EP-CM2 · **Sprint:** CM

## 1 · Overview
Portfolio ITR decomposition showing sector → company → scope contribution with what-if simulator.

**How an analyst works this module:**
- ITR Waterfall shows additive decomposition
- What-If Simulator lets you toggle holdings on/off

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BASE_ITR`, `COMPANIES`, `PORTFOLIO_ITR`, `SECTORS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SECTORS` | 11 | `weight`, `itrContrib`, `scope1`, `scope2`, `scope3`, `color` |
| `COMPANIES` | 13 | `sector`, `itr`, `weight`, `scope1`, `scope2`, `scope3` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['ITR Waterfall','Sector Contribution','Company Drill-Down','Scope Decomposition','What-If Simulator','Target Gap Analysis'];` |
| `gapData` | `SECTORS.map(s => ({` |
| `scopeDecomp` | `SECTORS.map(s => ({ sector: s.name, scope1: s.scope1, scope2: s.scope2, scope3: s.scope3 }));` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/temperature-alignment/assess` | `assess_temperature_alignment` | api/v1/routes/temperature_alignment.py |
| POST | `/api/v1/temperature-alignment/waci` | `calculate_waci` | api/v1/routes/temperature_alignment.py |
| POST | `/api/v1/temperature-alignment/itr` | `calculate_itr` | api/v1/routes/temperature_alignment.py |
| POST | `/api/v1/temperature-alignment/sbti-fi` | `assess_sbti_fi` | api/v1/routes/temperature_alignment.py |
| POST | `/api/v1/temperature-alignment/sector-alignment` | `sector_alignment` | api/v1/routes/temperature_alignment.py |
| GET | `/api/v1/temperature-alignment/ref/sbti-fi-criteria` | `ref_sbti_fi_criteria` | api/v1/routes/temperature_alignment.py |
| GET | `/api/v1/temperature-alignment/ref/sector-pathways` | `ref_sector_pathways` | api/v1/routes/temperature_alignment.py |
| GET | `/api/v1/temperature-alignment/ref/itr-table` | `ref_itr_table` | api/v1/routes/temperature_alignment.py |
| GET | `/api/v1/temperature-alignment/ref/asset-class-methods` | `ref_asset_class_methods` | api/v1/routes/temperature_alignment.py |
| GET | `/api/v1/temperature-alignment/ref/pcaf-dqs` | `ref_pcaf_dqs` | api/v1/routes/temperature_alignment.py |
| GET | `/api/v1/temperature-alignment/ref/sector-profiles` | `ref_sector_profiles` | api/v1/routes/temperature_alignment.py |

### 2.3 Engine `temperature_alignment_engine` (services/temperature_alignment_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `TemperatureAlignmentEngine.assess_temperature_alignment` | portfolio_name, fi_type, total_aum_bn, holdings, methodology, base_year, sbti_targets | Full portfolio temperature alignment assessment. Computes: - WACI (exposure-weighted average carbon intensity) tCO2/$mn - Portfolio-level ITR via WACI interpolation - Sector-level WACI, ITR, and PACTA alignment % - PCAF DQS exposure-weighted quality score - SBTi FI criteria assessment (if targets provided) - Engagement priority list by sector |
| `TemperatureAlignmentEngine.calculate_waci` | holdings | WACI = sum(portfolio_weight_i x scope12_emissions_i / revenue_i_mn). Exposure-weighted average carbon intensity in tCO2e per USD million revenue. |
| `TemperatureAlignmentEngine.calculate_itr` | waci | Interpolate ITR from WACI using MSCI/Carbon Delta anchor table. Linear interpolation between table anchor points. Returns temperature in degrees Celsius. |
| `TemperatureAlignmentEngine.calculate_pcaf_dqs` | holdings | Exposure-weighted PCAF DQS score 1-5. DQS 1 = best (verified); DQS 5 = worst (EEIO estimate). |
| `TemperatureAlignmentEngine.assess_sbti_fi_criteria` | portfolio_waci, scope1_financed, scope2_financed, scope3_financed, base_year, target_year, sbti_targets, portfolio_name | Score portfolio against all 6 SBTi FI Net-Zero Standard v1.0 criteria. Returns per-criterion compliance status and overall score. |
| `TemperatureAlignmentEngine.calculate_sector_alignment` | sector, current_value, base_year | PACTA % alignment for a single sector vs IEA NZE 2050 trajectory. Returns alignment percentage and gap to 2030 NZE benchmark. |
| `TemperatureAlignmentEngine.get_alignment_benchmarks` |  | Return all sector pathways and ITR interpolation table. |
| `TemperatureAlignmentEngine._pacta_alignment_pct` | current, nze_target, lower_is_better | Calculate % alignment relative to NZE 2030 target. |
| `TemperatureAlignmentEngine._engagement_priority` | itr, weight_pct |  |
| `TemperatureAlignmentEngine._score_sbti_criterion` | crit_id, crit_meta, total_s12, scope3_financed, portfolio_waci, sbti_targets, flag_exposure_pct, companies_with_sbti_pct | Return (score 0-1, status, notes) for a single SBTi FI criterion. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `WACI` *(shared)*, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COMPANIES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio ITR | `Budget method` | PACTA | Implies 2.4°C warming |
| Energy Contribution | `Sector pull` | Model | Largest positive contributor to ITR |

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/temperature-alignment/ref/asset-class-methods** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['asset_class_methods', 'total_asset_classes', 'pcaf_standard', 'sbti_standard'], 'n_keys': 4}`

**GET /api/v1/temperature-alignment/ref/itr-table** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['itr_table', 'total_anchors', 'waci_unit', 'temperature_unit', 'methodology', 'key_thresholds', 'engagement_thresholds'], 'n_keys': 7}`

**GET /api/v1/temperature-alignment/ref/pcaf-dqs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pcaf_dqs', 'source', 'note'], 'n_keys': 3}`

**GET /api/v1/temperature-alignment/ref/sbti-fi-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sbti_fi_criteria', 'total_criteria', 'standard', 'validation_body', 'eligible_asset_classes'], 'n_keys': 5}`

**GET /api/v1/temperature-alignment/ref/sector-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_pathways', 'sda_benchmarks', 'total_sectors', 'source', 'methodology'], 'n_keys': 5}`

**GET /api/v1/temperature-alignment/ref/sector-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_profiles', 'total_profiles', 'note'], 'n_keys': 3}`

**POST /api/v1/temperature-alignment/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/temperature-alignment/itr** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Additive ITR waterfall decomposition
**Headline formula:** `ITR = 1.5°C_base + Σ(sector_i_contribution) where contribution = weight × (company_ITR - 1.5)`

Waterfall shows how each sector pulls portfolio ITR above or below 1.5°C target. Energy sector typically adds +0.8°C, Technology reduces -0.2°C. What-if simulator: remove/add holdings and see ITR impact instantly.

**Standards:** ['PACTA', 'GFANZ']
**Reference documents:** PACTA Methodology; GFANZ Sector Pathways

**Engine `temperature_alignment_engine` — extracted transformation lines:**
```python
s_weight_pct = (s_exposure / total_aum_bn) * 100 if total_aum_bn > 0 else 0.0
WACI = sum(portfolio_weight_i x scope12_emissions_i / revenue_i_mn).
weight_norm = h.portfolio_weight_pct / total_weight
total_emissions = h.scope1_emissions_tco2 + h.scope2_emissions_tco2
idx = bisect.bisect_right(_ITR_WACI_LIST, waci) - 1
idx = max(0, min(idx, len(_ITR_WACI_LIST) - 2))
frac = (waci - w0) / (w1 - w0) if (w1 - w0) > 0 else 0.0
weighted_dqs = sum(h.data_quality_score * h.exposure_bn for h in holdings)
total_s12 = scope1_financed + scope2_financed
overall_score = weighted_score / total_weight if total_weight > 0 else 0.0
gap_to_nze_2030 = current_value - nze_2030
gap_to_threshold = current_value - threshold
alignment_pct = max(0.0, 100.0 - ((current_value - nze_2030) / max(cps_2030 - nze_2030, 0.001)) * 100)
gap_to_nze_2030 = nze_2030 - current_value
gap_to_threshold = threshold - current_value
alignment_pct = min(100.0, (current_value / max(nze_2030, 0.001)) * 100)
score = min(sbti_targets.long_term_reduction_pct / req, 1.0)
score = min(sbti_targets.long_term_reduction_pct / req, 1.0) * 0.9
score = min(sbti_targets.near_term_reduction_pct / req, 1.0)
score = max(0.0, 1.0 - (portfolio_waci / 200))
total = total_s12 + scope3_financed
s3_share = (scope3_financed / total * 100) if total > 0 else 0
score = min(s3_share / req, 1.0) * 0.6  # engagement is directional
score = min(companies_with_sbti_pct / req, 1.0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `temperature_alignment_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `temperature-alignment` | engine:temperature_alignment_engine, table:WACI |

## 7 · Methodology Deep Dive

Unlike its sibling `temperature-alignment` module (which draws ITR from a random number with no
formula), this module **genuinely implements the guide's additive waterfall formula**: `ITR =
1.5°C_base + Σ(sector_i_contribution)`. No mismatch blockquote is triggered — the core calculation
matches the guide exactly. The underlying per-sector `itrContrib` values are hand-authored static
literals rather than derived from a live carbon-budget model, and the backend
`temperature_alignment_engine.py` (also linked to this module) is not called from this page either —
both worth noting, but neither contradicts what the guide claims this specific page does (an additive
decomposition *display*, not a from-scratch ITR computation).

### 7.1 What the module computes

10 sectors (`SECTORS`: Energy, Materials, Industrials, Utilities, Consumer Disc., Consumer Staples,
Healthcare, Technology, Financials, Real Estate) each with a portfolio `weight` %, a static
`itrContrib` (°C contribution to portfolio ITR above the 1.5°C base), and a Scope 1/2/3 breakdown of
that contribution. 12 real named companies (ExxonMobil, Chevron, Shell, BASF, HeidelbergCement,
Microsoft, Apple, NextEra, RWE, JPMorgan, Nestle, Amazon) with individual ITR, portfolio weight, and
scope breakdown, used for sector drill-down.

### 7.2 Core formula (genuinely implemented)

```js
BASE_ITR = 1.5
portfolioITR = BASE_ITR + Σ_{sectors not excluded} itrContrib(sector)
```

This is computed live via `useMemo`, correctly recalculating whenever the user's `excludeList`
(toggled sectors) changes — the What-If Simulator genuinely removes a sector's `itrContrib` from the
running sum and the header KPI ("Portfolio ITR") updates in real time, exactly matching the guide's
description of instant recalculation on holding toggle.

### 7.3 Waterfall construction

```js
waterfallData: running = BASE_ITR
  sorted_sectors = [...SECTORS].sort(desc by itrContrib)          // largest positive pull first
  for each active sector: running += itrContrib; push {name, value: itrContrib, running}
  final bar: {name:'Portfolio ITR', value: running, color: running>2.0?red: running>1.8?amber:green}
```

This is a textbook waterfall-chart construction: starting bar at the 1.5°C base, each subsequent bar
adds (or, for Technology's negative contribution, subtracts) that sector's pull, ending at the total
portfolio ITR — with sectors sorted by contribution magnitude for visual clarity (largest positive
pull, Energy at +0.82°C, shown first). The colour-banding on the final bar (red >2.0°C, amber
1.8–2.0°C, green <1.8°C) gives a quick Paris-alignment read.

### 7.4 Worked example

Summing all 10 sectors' `itrContrib`: Energy +0.82, Materials +0.31, Industrials +0.18, Utilities
+0.24, Consumer Disc. +0.12, Consumer Staples +0.08, Healthcare +0.04, Technology **−0.18**,
Financials +0.06, Real Estate +0.08. Total: `0.82+0.31+0.18+0.24+0.12+0.08+0.04−0.18+0.06+0.08 =
1.75`. `portfolioITR = 1.5+1.75 = 3.25°C` — notably higher than the guide's own stated headline
figure of "2.4°C" for this module, indicating the guide's example data point and the actual
`SECTORS` array's summed contributions are **not reconciled** (either the guide's example predates
a later edit to `itrContrib` values, or the two were never cross-checked against each other).
Excluding Energy from the portfolio via the What-If Simulator: `portfolioITR_excl_energy = 3.25 −
0.82 = 2.43°C` — much closer to the guide's cited 2.4°C figure, suggesting the guide's example may
implicitly assume an Energy-light portfolio configuration rather than the full 10-sector default.

### 7.5 Companion analytics

- **Target Gap Analysis** — `gapData[sector] = {current: 1.5+itrContrib, target: 1.5, gap:
  max(0,itrContrib)}` — correctly floors the gap at zero for Technology (the one sector with negative
  contribution, i.e. already below the 1.5°C base contribution), a sound guard against a
  "negative gap" being displayed as if it were a shortfall.
- **Scope Decomposition** — `scopeDecomp` passes through each sector's static Scope 1/2/3
  contribution fields directly for a stacked-bar view; Energy's Scope 1 (0.35) and Scope 3 (0.35)
  are equally weighted contributors in this dataset, both dwarfing Scope 2 (0.12) — a plausible
  pattern for an integrated oil major (direct combustion + downstream product use both material,
  purchased-electricity comparatively minor).
- **Company Drill-Down** — filters the 12-company roster by `selectedSector`; company-level `itr`
  values are independent static literals (e.g. ExxonMobil 3.2°C, Microsoft 1.3°C), not derived from
  or reconciled against the sector-level `itrContrib` waterfall.

### 7.6 Data provenance & limitations

- **Dead code**: a module-scope `const PORTFOLIO_ITR = useMemoCalc()` (line 45) computes the
  unfiltered-portfolio ITR once at module load but is **never referenced anywhere else in the file**
  — the actual displayed value comes from the component-scoped `useMemo` version. Harmless but
  vestigial; the confusing `useMemoCalc` naming (styled like a React hook despite being a plain
  function called outside any component) is worth cleaning up.
- All `itrContrib`, per-sector weights, and Scope 1/2/3 splits are **hand-authored static
  literals**, not derived from a live carbon-budget/emissions-trajectory calculation — a production
  version would compute each sector's contribution from constituent companies' actual ITR × sector
  weight, consistently with the sibling `temperature-alignment` page's (currently synthetic)
  company-level ITR data, rather than maintaining two independent static datasets.
- The guide's own "2.4°C" and "+0.8°C Energy contribution" example figures don't exactly reconcile
  with the current `SECTORS` array's summed total (§7.4) — worth a data refresh to keep the
  documentation and the shipped constants in sync.
- Backend `temperature_alignment_engine.py` / `POST /itr` / `POST /assess` routes associated with
  this module are not called from this page.

**Framework alignment:** PACTA's sector-pathway decomposition concept and GFANZ's sector-level
transition framing are reflected in the sector-contribution structure, though the specific
`itrContrib` values are illustrative rather than computed from PACTA's actual production-alignment
methodology. The additive waterfall architecture itself (`base + Σcontributions`) is a sound,
correctly-implemented representation of how sector-level emissions pull a portfolio's aggregate ITR
away from a 1.5°C baseline.

## 9 · Future Evolution

### 9.1 Evolution A — Sector contributions computed from holdings, not hand-authored (analytics ladder: rung 2 → 3)

**What.** The additive waterfall is genuinely implemented — `portfolioITR = 1.5 + Σ itrContrib` recomputes live as the What-If Simulator toggles sectors (§7.2), a real scenario capability. But per §7.6 the ten `itrContrib` values are hand-authored literals, the 12-company drill-down carries independent static ITRs unreconciled with the sector layer, the shared `temperature_alignment_engine` is never called, and §7.4 exposes a documentation drift: the guide's headline "2.4°C" doesn't reconcile with the array's actual 3.25°C sum. Evolution A derives every waterfall bar from the engine.

**How.** (1) Compute per-sector contribution bottom-up: `itrContrib(sector) = Σ_companies weight_i × (ITR_i − 1.5)` using company-level ITR from `POST /itr` (WACI-interpolated via the engine's MSCI/Carbon Delta anchor table), so sector bars, company drill-down, and scope splits are one consistent dataset instead of two static layers. (2) The What-If Simulator gains company-granularity toggles (the module's stated purpose — "toggle holdings on/off" — currently only works at sector level). (3) Fix the two documented code smells: the dead module-scope `PORTFOLIO_ITR = useMemoCalc()` (§7.6) and the misleading hook-style naming. (4) Refresh the guide's 2.4°C example from the computed default portfolio, closing the §7.4 reconciliation gap.

**Prerequisites.** Shared with the sibling module: the traced `POST /itr`/`POST /assess` failures fixed, and a seeded demo portfolio with emissions/revenue per holding. Edits to `temperature_alignment_engine` propagate to `temperature-alignment` (§6) — coordinate. **Acceptance:** sum of company contributions per sector equals the sector bar; toggling any single holding moves the headline ITR; guide example matches computed output.

### 9.2 Evolution B — Attribution copilot narrating the waterfall (LLM tier 1 → 2)

**What.** Decomposition displays beg "why" questions. The copilot answers "why does Energy add +0.82°C?" (weight × excess-ITR arithmetic, Scope 1/3 dominance from the scope decomposition), "what single exclusion gets us under 2°C?" (evaluate each toggle against the additive sum), and "what would GFANZ sector-pathway alignment require here?" from the engine's `ref/sector-pathways` reference payload.

**How.** Tier 1 works today because the waterfall math is transparent and on-page: grounding is this Atlas record (§7.2–7.4 document the formula, construction, and worked sums) plus live component state; exclusion what-ifs are simple additive arithmetic the copilot can verify against the recomputed KPI rather than generate. Tier 2 binds the module's 11 mapped engine routes as tools once Evolution A wires them — then "re-run the waterfall assuming Utilities halve their WACI" is an executed `POST /assess` call, and answers can cite PACTA alignment percentages the engine computes. Until then, the copilot must state that sector contributions are illustrative hand-authored values (§7.6), not PACTA-derived.

**Prerequisites.** None for the tier-1 slice; Evolution A for tool-called what-ifs. **Acceptance:** every °C figure in an answer reproduces from `1.5 + Σ active contributions`; exclusion recommendations are exhaustively verified against all single-toggle outcomes; pre-Evolution-A answers carry the static-data caveat verbatim.