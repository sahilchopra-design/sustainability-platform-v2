# Insurance Portfolio Climate
**Module ID:** `insurance-portfolio-climate` · **Route:** `/insurance-portfolio-climate` · **Tier:** A (backend vertical) · **EP code:** EP-CI5 · **Sprint:** CI

## 1 · Overview
Insurance portfolio climate analytics covering investment side, underwriting stress, reserve adequacy, ORSA climate module, and Solvency II SCR.

**How an analyst works this module:**
- Investment Portfolio shows transition + physical risk on assets
- Underwriting Stress models claims under warming
- Reserve Adequacy checks provisions vs climate-adjusted needs
- ORSA Module provides regulatory-aligned climate assessment

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `ASSET_CLASSES`, `ESG_PILLARS`, `INSURANCE_API`, `ORSA_DIMS`, `ORSA_SCORES`, `SOLVENCY_RISKS`, `TABS`, `UW_LINES`, `WARMING`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ASSET_CLASSES` | 7 | `allocation`, `transRisk`, `physRisk`, `climateScore` |
| `UW_LINES` | 7 | `premium`, `claimsRatio`, `climateAdj`, `freqTrend`, `sevTrend`, `reserveGap` |
| `SOLVENCY_RISKS` | 6 | `baseSCR`, `climateAddon`, `total` |
| `ESG_PILLARS` | 4 | `weight`, `score` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `INSURANCE_API` | ``${API}/api/v1/insurance`;` |
| `claimsTrend` | `WARMING.map(w => ({` |
| `totalPremium` | `UW_LINES.reduce((s, l) => s + l.premium, 0);` |
| `totalSCR` | `SOLVENCY_RISKS.reduce((s, r) => s + r.total, 0);` |
| `baseSCR` | `SOLVENCY_RISKS.reduce((s, r) => s + r.baseSCR, 0);` |
| `climateAddon` | `SOLVENCY_RISKS.reduce((s, r) => s + r.climateAddon, 0);` |
| `reserveData` | `UW_LINES.map(l => {` |
| `gapAdj` | `l.reserveGap * factor;` |
| `orsaRadar` | `ORSA_DIMS.map((d, i) => ({ dim: d, score: orsaOverrides[d] \|\| ORSA_SCORES[i] }));` |
| `overallOrsa` | `Math.round(orsaRadar.reduce((s, d) => s + d.score, 0) / orsaRadar.length);` |
| `esgTotal` | `ESG_PILLARS.reduce((s, p) => s + p.score * p.weight / 100, 0).toFixed(1);` |
| `fmtM` | `(eur) => `$${(eur / 1e6).toFixed(1)}M`;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/insurance/calculate` | `calculate_insurance` | api/v1/routes/insurance.py |
| GET | `/api/v1/insurance/reference-data` | `reference_data` | api/v1/routes/insurance.py |
| GET | `/api/v1/insurance/assessments` | `list_assessments` | api/v1/routes/insurance.py |
| GET | `/api/v1/insurance/assessments/{assessment_id}` | `get_assessment` | api/v1/routes/insurance.py |

### 2.3 Engine `insurance_climate_risk` (services/insurance_climate_risk.py)
| Function | Args | Purpose |
|---|---|---|
| `calculate_insurance_climate_risk` | inp, scenario, horizon_year | Full insurance climate risk assessment. Steps: 1. Apply peril × scenario CAT loss multiplier to baseline loss estimates 2. Net for reinsurance retention 3. Compute Solvency II CAT SCR add-on 4. Compute TP uplift under scenario 5. Assess reserve adequacy (TP vs. climate-adjusted loss) 6. Compute protection gap 7. Score ESG underwriting policy |
| `get_reference_data` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `insurance_climate_assessments` *(shared)*, `insurance_climate_entities` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ASSET_CLASSES`, `ESG_PILLARS`, `ORSA_DIMS`, `ORSA_SCORES`, `PERILS`, `SOLVENCY_RISKS`, `TABS`, `UW_LINES`, `WARMING`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Reserve Gap | `Climate-adjusted claims - Current reserves` | Model | Potential reserve shortfall under warming scenarios |
| SCR Climate Addon | `Scenario-dependent` | EIOPA | Additional capital requirement for climate risk |

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/insurance/assessments** — status `passed`, provenance ['db-empty'], source tables: `insurance_climate_assessments`, `insurance_climate_entities`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/insurance/assessments/{assessment_id}** — status `failed`, provenance ['db-empty'], source tables: `insurance_climate_assessments`, `insurance_climate_entities`
Output: `None`

**GET /api/v1/insurance/reference-data** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cat_loss_multipliers', 'solvency_ii_cat_factors', 'tp_uplift_by_scenario', 'supported_perils', 'supported_scenarios', 'sources'], 'n_keys': 6}`

**POST /api/v1/insurance/calculate** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** ORSA climate risk assessment
**Headline formula:** `SCR_climate = SCR_base + ClimateAddon(scenario)`

Investment side: transition + physical risk on insurer's asset portfolio. Underwriting: claims frequency/severity trends under warming. Reserve adequacy: current provisions vs climate-adjusted expected claims. ORSA: Own Risk and Solvency Assessment with climate scenarios.

**Standards:** ['EIOPA', 'NAIC', 'Solvency II']
**Reference documents:** EIOPA Climate Stress Test; Lloyd's Climate Scenarios; Solvency II Standard Formula

**Engine `insurance_climate_risk` — extracted transformation lines:**
```python
gross_1in100 = inp.gross_loss_1in100_baseline_eur * multiplier
gross_1in250 = inp.gross_loss_1in250_baseline_eur * multiplier
aal          = inp.average_annual_loss_baseline_eur * multiplier
pml          = inp.probable_max_loss_baseline_eur * multiplier
cat_change_pct = (multiplier - 1.0) * 100.0
net_1in100 = gross_1in100 * ret
net_1in250 = gross_1in250 * ret
ri_limit = inp.reinsurance_limit_eur or (gross_1in250 * (1 - ret) * 1.1)
ri_gap    = max(0.0, gross_1in250 * (1 - ret) - ri_limit)
climate_scr_factor = base_cat_scr_factor * max(0, multiplier - 1.0)
scr_addon = inp.gross_written_premium_eur * climate_scr_factor
total_scr  = inp.scr_eur + scr_addon
sol_ratio_pre  = inp.own_funds_eur / inp.scr_eur if inp.scr_eur > 0 else 0.0
sol_ratio_post = inp.own_funds_eur / total_scr    if total_scr > 0  else 0.0
climate_adj_tp   = inp.technical_provisions_eur * (1 + tp_uplift_frac)
tp_uplift_pct    = tp_uplift_frac * 100.0
reserve_benchmark = max(aal * 1.15, net_1in100 * 0.5)
reserve_deficiency = reserve_benchmark - climate_adj_tp
prot_gap_eur  = max(0.0, econ_loss - insured_loss)
prot_gap_pct  = prot_gap_eur / econ_loss * 100.0 if econ_loss > 0 else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **81** other module(s).
**Shared engines (edits propagate!):** `insurance_climate_risk` (used by 5 modules)

| Connected module | Shared via |
|---|---|
| `insurance-transition` | engine:insurance_climate_risk, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities, table:sqlalchemy |
| `insurance-protection-gap` | engine:insurance_climate_risk, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities, table:sqlalchemy |
| `climate-underwriting-workbench` | engine:insurance_climate_risk, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities, table:sqlalchemy |
| `insurance-climate-hub` | engine:insurance_climate_risk, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities, table:sqlalchemy |
| `supply-chain-esg-hub` | table:exc, table:sqlalchemy |
| `supply-chain-resilience` | table:exc, table:sqlalchemy |
| `supply-chain-contagion` | table:exc, table:sqlalchemy |
| `supply-chain-emissions-mapper` | table:exc, table:sqlalchemy |
| `supply-chain-carbon` | table:exc, table:sqlalchemy |
| `supply-chain-map` | table:exc, table:sqlalchemy |

## 7 · Methodology Deep Dive

The MODULE_GUIDES entry here is broadly accurate: the page does implement an investment-side climate
screen, an underwriting warming-stress, reserve adequacy, an ORSA radar, a Solvency II SCR view, and
an insurance ESG rating. The caveat is that the inputs are **curated constants** (6 asset classes, 6
underwriting lines, 5 SCR modules) and the "climate add-ons" are **hard-coded**, not derived — the
genuine computations are the warming-stress power curves and the scenario-scaled reserve gap. The
backend `insurance_climate_risk.py` (which *does* compute SCR add-ons properly) is not called by this
page.

### 7.1 What the module computes

**Underwriting warming stress** — quadratic escalation of claims ratio with warming:

```js
property     = 68 × (1 + (w−1)×0.12)^2       // w = warming °C
liability    = 55 × (1 + (w−1)×0.06)^2
business_int = 45 × (1 + (w−1)×0.15)^2
```

**Reserve adequacy** — scenario-scaled reserve gap and needed reserve:

```js
factor       = optimistic 0.7 | central 1.0 | pessimistic 1.4
adjGap       = reserveGap × factor
currentReserve = premium × claimsRatio/100
needed         = premium × climateAdj/100          // climateAdj > claimsRatio ⇒ shortfall
```

**Portfolio / capital roll-ups:**

```js
totalPremium = Σ UW_LINES.premium
totalSCR = Σ SOLVENCY_RISKS.total ; baseSCR = Σ baseSCR ; climateAddon = Σ climateAddon
overallOrsa = round(Σ orsaRadar.score / 5)
esgTotal = Σ ESG_PILLARS.score × weight/100          // weighted E/S/G
```

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| `ASSET_CLASSES` (allocation, transRisk, physRisk, climateScore) | 6 curated rows (Govt 35%…Alternatives 7%) | Hand-set; RE physRisk 42 highest |
| `UW_LINES` (premium, claimsRatio, climateAdj, freqTrend, sevTrend, reserveGap) | 6 curated lines | Property climateAdj 82 vs claims 68 ⇒ loading |
| Warming-stress exponents | property 0.12, liability 0.06, BI 0.15 (all squared) | Author heuristic; peril sensitivity ordering |
| Reserve scenario factors | 0.7 / 1.0 / 1.4 | Optimistic / central / pessimistic |
| `SOLVENCY_RISKS` baseSCR + climateAddon | 5 curated modules | **Add-ons hard-coded** (e.g. Non-Life 620+185) |
| `ORSA_SCORES` | [72,58,45,65,52] | Curated 5-dimension radar |
| `ESG_PILLARS` weights/scores | E40/S30/G30; 62/71/78 | Curated weighted rating |
| `WARMING` levels | 1.0–4.0 °C | Stress grid |

### 7.3 Calculation walkthrough

1. Investment screen renders `ASSET_CLASSES` transition/physical risk and climate score by allocation.
2. Underwriting stress computes `claimsTrend` power curves across the warming grid; a slider picks
   `warmingLevel`.
3. Reserve tab scales each line's `reserveGap` by the scenario factor and compares
   `currentReserve` vs `needed`.
4. ORSA radar averages 5 dimension scores (user-overridable); Solvency tab sums base SCR + climate
   add-on; ESG tab computes the weighted pillar rating.

### 7.4 Worked example (Property line, +2 °C, pessimistic reserves)

| Step | Computation | Result |
|---|---|---|
| Warming claims ratio | 68 × (1 + (2−1)×0.12)^2 = 68 × 1.2544 | **85.3%** |
| Current reserve | 4200 × 68/100 | **$2,856M** |
| Needed (climateAdj) | 4200 × 82/100 | **$3,444M** |
| Reserve shortfall | 3444 − 2856 | **$588M** |
| Adjusted gap (pessimistic) | 14 × 1.4 | **19.6** |

Capital view: `climateAddon = 120+185+25+35+40 = $405M` on `baseSCR = $1,980M` → total SCR $2,385M,
i.e. a ~20% climate uplift — but these add-ons are stored, not modelled.

### 7.5 Companion analytics on the page

- **10-year frequency/severity trend** (`1.06^i`, `1.09^i`, combined) illustrating loss-cost drift.
- **ORSA module** — editable 5-dimension climate risk radar with overall score.
- **Solvency II SCR** — base + climate add-on by risk module.
- **Insurance ESG rating** — weighted E/S/G composite.

### 7.6 Data provenance & limitations

- **All inputs curated static demo data** — no PRNG, but not real portfolio data.
- The Solvency II climate SCR **add-ons are hard-coded**, not computed from a CAT-scenario model
  (unlike `insurance_climate_risk.py`, which derives them from Annex XIII factors × loss multipliers).
- Reserve "needed" uses a stored `climateAdj` ratio rather than a projected climate-adjusted loss.
- Warming-stress exponents are heuristic, not calibrated to a cat model.

**Framework alignment:** *EIOPA / Solvency II* — the SCR-module structure (Market, Non-Life UW,
Counterparty, Operational, Health) mirrors the Solvency II standard-formula risk modules, and the
ORSA radar reflects the Own Risk & Solvency Assessment's climate dimension. *NAIC* — referenced for
US climate risk disclosure. The climate add-on and reserve loading are directionally sensible but not
derived from a calibrated CAT/scenario engine.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Derive the Solvency II climate SCR add-on, climate-adjusted technical provisions, and reserve
adequacy from a calibrated CAT/scenario engine rather than hard-coded numbers — for the insurer's
ORSA and Pillar-2 capital buffer.

### 8.2 Conceptual approach
Two-sided: (a) **liability side** — peril×scenario loss multipliers → climate-adjusted loss ratios →
TP uplift and CAT-SCR add-on, per EIOPA CCRST 2022 and Solvency II Delegated Reg. Annex XIII (already
implemented in the platform's `insurance_climate_risk.py`); (b) **asset side** — NGFS-scenario
repricing of the investment book (market-risk SCR climate module), mirroring EIOPA's 2022 insurer
stress test and NGFS Phase IV.

### 8.3 Mathematical specification
Per LOB *l*, peril *p*, scenario *s*; asset class *c*:

```
LossRatio_l(s) = base_l · (1 + Σ_p share_{l,p}(m_p(s) − 1))
TP_l^adj(s)    = TP_l · (1 + uplift(s))                       // uplift from _TP_UPLIFT_PCT
CATSCR_l(s)    = GWP_l · Σ_p f_p^{SII} · max(0, m_p(s)−1)
MktSCR^clim(s) = Σ_c Alloc_c · (ΔValue_c(s))                  // NGFS repricing shock
SCR_total(s)   = SCR_base + Σ_l CATSCR_l(s) + MktSCR^clim(s)
ReserveGap_l(s)= max(0, NeededReserve_l(s) − TP_l^adj(s))
```

| Parameter | Source |
|---|---|
| Loss multipliers `m_p(s)` | Swiss Re sigma; EIOPA CCRST 2022 (in engine) |
| SII CAT factors `f_p^{SII}` | Delegated Reg. Annex XIII (in engine) |
| TP uplift `uplift(s)` | EIOPA Supervisory Statement 2024 (in engine) |
| Asset repricing `ΔValue_c(s)` | NGFS Phase IV transition shocks |

### 8.4 Data requirements
Portfolio by LOB × peril (GWP, base loss ratio, TPs), investment book by asset class with transition
sensitivity, own funds, base SCR by module. Platform has: multiplier/factor/uplift tables and a full
CAT engine; needs the page wired to `POST /api/v1/insurance/calculate` and an NGFS asset-repricing
feed.

### 8.5 Validation & benchmarking plan
Reconcile SCR add-on and TP uplift against EIOPA CCRST published aggregates; backtest reserve gaps
against realised catastrophe reserving; sensitivity of solvency ratio to peril mix and NGFS scenario.

### 8.6 Limitations & model risk
Standard-formula CAT factors are coarse vs an internal model; asset-side repricing depends on the
NGFS transmission assumptions; correlation across market and underwriting climate shocks is omitted.
Fallback: present SCR and reserve gaps as scenario ranges and flag solvency ratios below 120%.

## 9 · Future Evolution

### 9.1 Evolution A — Derive the SCR add-ons and reserve needs from the shared engine (analytics ladder: rung 2 → 3)

**What.** The page's structure is faithful to the guide — investment screen, quadratic underwriting warming-stress (`68·(1+(w−1)·0.12)²` for property), scenario-scaled reserve gaps, ORSA radar, Solvency II SCR view — but §7.6 pins the gap: the climate SCR add-ons are **hard-coded constants** (Non-Life 620+185) even though the platform's own `insurance_climate_risk.py` derives them properly from Annex XIII factors × peril multipliers; the "needed reserve" uses a stored `climateAdj` ratio, not a projected climate-adjusted loss; and the warming exponents are uncalibrated heuristics. Evolution A wires the page to `POST /api/v1/insurance/calculate` (declared on this module but failing/uncalled per the lineage trace) so `scr_addon`, `climate_adj_tp`, `reserve_deficiency` and `sol_ratio_post` come from the engine, and adds the asset-side NGFS repricing term (`MktSCR^clim = Σ Alloc_c·ΔValue_c(s)`) the §8 spec defines — the one piece neither page nor engine currently has.

**How.** (1) A portfolio-input flow persisting to the shared-but-empty `insurance_climate_entities`/`insurance_climate_assessments` tables (coordinate with the insurance-climate-hub evolution — one intake serves all 5 engine-sharing modules). (2) The `SOLVENCY_RISKS` constants become the engine's computed add-ons with the standard-formula module structure retained. (3) Warming-stress exponents calibrated against the engine's peril multipliers so the slider view and the engine agree directionally. (4) NGFS asset shocks from the platform's Phase 5 extract map to the 6 `ASSET_CLASSES`. Blast radius: 81 modules via shared tables — additive changes only, sibling regressions first.

**Prerequisites.** Shared intake design across the insurance family; NGFS transition-shock mapping documented per §8.6. **Acceptance:** the ~20% climate SCR uplift in §7.4 becomes a derived output that moves with scenario and peril mix; `POST /calculate` passes in the lineage sweep; stored vs computed add-ons reconciled.

### 9.2 Evolution B — ORSA-drafting analyst for the climate module (LLM tier 2)

**What.** ORSA is a narrative-plus-numbers regulatory document — the exact tier-2 shape. The copilot answers "draft the ORSA climate-scenario section for our book", "why does property's claims ratio hit 85.3% at +2°C?", "what does the pessimistic reserve factor do to the Property line's shortfall?" (the §7.4 walkthrough — $588M — is the template), and "which Solvency II module drives our climate add-on?"

**How.** Tool schemas over the wired `/calculate` and `/reference-data` routes; the ORSA template maps to the 5 `ORSA_DIMS` with each dimension's narrative grounded in computed inputs rather than the current curated radar scores. Actuarial discipline: engine-sourced numbers carry their reference-data source strings; the warming-stress curves are labeled screening heuristics vs the engine's peril-multiplier results wherever both appear (the two mechanisms must be distinguished, mirroring the hub module's dual-mechanism caveat); §8.6's omitted correlation between market and underwriting climate shocks is stated in any aggregate-capital narrative. The editable ORSA radar remains a management-judgement input — the copilot records overrides as such, never blends judgement into computed figures.

**Prerequisites (hard).** Evolution A's engine wiring — an ORSA drafted over hard-coded add-ons and curated radar scores would misrepresent management's risk assessment. Phase 2 tooling. **Acceptance:** ORSA-section figures 100% tool-traceable; judgement vs computed provenance explicit per number; scenario ranges (not points) presented per §8.6.