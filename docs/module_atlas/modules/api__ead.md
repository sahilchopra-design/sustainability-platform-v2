# Api::Ead
**Module ID:** `api::ead` · **Route:** `/api/v1/ead` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/ead/calculate` | `calculate_ead` | api/v1/routes/ead.py |
| POST | `/api/v1/ead/calculate-batch` | `calculate_ead_batch` | api/v1/routes/ead.py |
| GET | `/api/v1/ead/ccf-matrix` | `get_ccf_matrix` | api/v1/routes/ead.py |
| GET | `/api/v1/ead/ccf/{asset_class}/{facility_type}` | `get_specific_ccf` | api/v1/routes/ead.py |
| GET | `/api/v1/ead/climate-stress` | `get_climate_stress_factors` | api/v1/routes/ead.py |
| GET | `/api/v1/ead/facility-types` | `list_facility_types` | api/v1/routes/ead.py |
| GET | `/api/v1/ead/asset-classes` | `list_asset_classes` | api/v1/routes/ead.py |

### 2.3 Engine `ead_calculator` (services/ead_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `_build_regulatory_ccf` |  | Build nested dict from flat CCF_TABLE for easy lookups. |
| `get_ccf` | asset_class, facility_type | Utility: look up the CCF for a given asset class and facility type. Returns the regulatory CCF from the flat CCF_TABLE. Falls back to CORPORATE for the same facility type, then to 1.00 (conservative). Args: asset_class: Basel asset class string (e.g. 'CORPORATE') facility_type: Facility type string (e.g. 'UNDRAWN_COMMITMENT') Returns: CCF as a float in [0, 1]. |
| `get_maturity_adjustment` | pd, maturity | Basel III Art. 153(1) / Art. 162 full maturity adjustment. b(PD) = (0.11852 - 0.05478 * ln(PD))^2 MA = (1 + (M - 2.5) * b) / (1 - 1.5 * b) Effective maturity M is clamped to [1, 5] per Art. 162. PD is floored at 0.0003 (3 bps) to avoid log(0) and ensure the formula remains well-defined. Args: pd: Probability of default (0-1). Floored at 0.0003. maturity: Remaining maturity in years. Returns: Matur |
| `EADCalculator.calculate` | outstanding_balance, total_commitment, facility_type, asset_class, remaining_maturity_years, sector, is_short_maturity, derivative_notional | Calculate EAD for a single exposure. When *use_pd_maturity_adjustment* is True the full Basel III b(PD) maturity adjustment formula is applied: b = (0.11852 - 0.05478 * ln(PD))^2 MA = (1 + (M-2.5)*b) / (1 - 1.5*b) Otherwise a simplified linear scaling is used (backward-compatible). Args: outstanding_balance: Current drawn/outstanding amount total_commitment: Total committed facility amount (drawn  |
| `EADCalculator.calculate_from_input` | inp | Calculate EAD from a typed EADInput dataclass. Convenience wrapper that unpacks the dataclass fields into keyword arguments for :meth:`calculate`. |
| `EADCalculator.calculate_batch` | exposures, apply_climate_stress | Batch EAD calculation for a loan book. Args: exposures: List of dicts with keys matching calculate() parameters. Required keys: outstanding_balance, total_commitment, facility_type, asset_class apply_climate_stress: Whether to apply climate drawdown overlay Returns: EADBatchResult with aggregated stats and individual results |
| `EADCalculator.calculate_batch_from_inputs` | inputs | Batch EAD calculation from a list of EADInput dataclasses. Converts EADInput list to dict list and delegates to calculate_batch. |
| `EADCalculator._get_ccf` | facility_type, asset_class, is_short_maturity | Look up CCF from the regulatory table. Falls back to: 1. Short maturity override if applicable 2. Exact (facility_type, asset_class) match 3. Facility type default (CORPORATE asset class) 4. 100% (conservative fallback) |
| `EADCalculator._get_guarantee_ccf` | facility_type, asset_class | Get CCF for guarantee/LC facilities. |
| `EADCalculator._calculate_saccr_addon` | notional, derivative_asset_class, maturity_years | Simplified SA-CCR add-on calculation. CRR Art. 274: EAD = alpha * (RC + PFE) Simplified: EAD = 1.4 * (MtM + add-on_factor * notional * maturity_factor) We use the simplified approach (no netting, no margin): Add-on = supervisory_factor * notional * maturity_factor Maturity factor = sqrt(min(M, 1) / 1) for M < 1; else sqrt(min(M,5)/5) * scaling |
| `EADCalculator._calculate_maturity_adjustment` | remaining_maturity, asset_class | Simplified maturity adjustment (backward-compatible). At M=2.5 (benchmark), factor = 1.0 Each year above 2.5 adds ~2.5%; each year below reduces by ~2.5%. Retail exposures: no maturity adjustment (Art. 162(1)). |
| `EADCalculator._calculate_pd_maturity_adjustment` | remaining_maturity, asset_class, pd | Full Basel III Art. 153(1) / Art. 162 maturity adjustment. b(PD) = (0.11852 - 0.05478 * ln(PD))^2 MA = (1 + (M - 2.5) * b) / (1 - 1.5 * b) Retail exposures: no maturity adjustment per Art. 162(1). |
| `EADCalculator._get_climate_drawdown_stress` | sector | Get climate-driven drawdown stress percentage. Under stress scenarios, corporates draw down committed lines faster. EBA GL/2022/16 Section 4.3: Climate as driver of credit deterioration. |
| `EADCalculator.get_ccf_table` |  | Return the full CCF lookup table for API consumption. |
| `EADCalculator.get_supported_facility_types` |  | Return list of supported facility types. |
| `EADCalculator.get_supported_asset_classes` |  | Return list of supported asset classes. |
| `EADCalculator.get_climate_stress_factors` |  | Return climate drawdown stress factors by sector. |
| `EADCalculator.get_scenario_info` |  | Return current scenario configuration. |

**Engine `ead_calculator` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `MATURITY_CAPS` | `{'min': 1.0, 'max': 5.0, 'benchmark': 2.5}` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/ead/asset-classes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['asset_classes', 'descriptions'], 'n_keys': 2}`

**GET /api/v1/ead/ccf-matrix** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ccf_table', 'facility_types', 'asset_classes', 'short_maturity_overrides'], 'n_keys': 4}`

**GET /api/v1/ead/ccf/{asset_class}/{facility_type}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['asset_class', 'facility_type', 'ccf', 'saccr_alpha', 'maturity_caps'], 'n_keys': 5}`

**GET /api/v1/ead/climate-stress** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scenario', 'scenario_multiplier', 'available_scenarios', 'sector_stress_factors'], 'n_keys': 4}`

**GET /api/v1/ead/facility-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['facility_types', 'descriptions'], 'n_keys': 2}`

**POST /api/v1/ead/calculate** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/ead/calculate-batch** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `ead_calculator` — extracted transformation lines:**
```python
MA    = (1 + (M - 2.5) * b) / (1 - 1.5 * b)
b = (0.11852 - 0.05478 * math.log(pd_safe)) ** 2
denominator = 1.0 - 1.5 * b
ma = (1.0 + (m_eff - 2.5) * b) / denominator
b  = (0.11852 - 0.05478 * ln(PD))^2
MA = (1 + (M-2.5)*b) / (1 - 1.5*b)
undrawn_amount = max(total_commitment - outstanding_balance, 0.0)
undrawn_commitment_ead = undrawn_amount * ccf
guarantee_exposure = guarantee_amount * guarantee_ccf
climate_ead_uplift = undrawn_amount * climate_stress_pct
ead_post_climate = ead_pre_climate + climate_ead_uplift
off_bal = reg_ead - result.outstanding_balance * result.maturity_adjustment_factor
addon = SACCR_ALPHA * factor * notional * maturity_factor
MA     = (1 + (M - 2.5) * b) / (1 - 1.5 * b)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/ead` wraps the **EAD Calculator** (`backend/services/ead_calculator.py`, v2.0.0), a
Basel III/IV Exposure-at-Default engine for the Standardised Approach with a climate drawdown
overlay. Its module docstring cites CRR Art. 111/166–168, Basel III Art. 153(1)/162, BCBS d424
(Dec 2017) and BCBS d279 (SA-CCR). Core formula, quoted from the code:

```
EAD = Outstanding_Balance
    + CCF × Undrawn_Commitment          (undrawn_amount = max(commitment − outstanding, 0))
    + Guarantee_CCF × Guarantee_Amount
    + SA-CCR_AddOn(Derivatives)
    + Climate_Drawdown_Uplift           (undrawn × sector stress × scenario multiplier)
```

An in-code correction note (step 10) is important: the **maturity adjustment is computed but
deliberately excluded from EAD** — "maturity adjustment belongs to the RWA risk-weight (inside K),
NOT to EAD (Basel CRR Art. 166). Multiplying it here overstated EAD by up to ~70%… maturity_adj
is retained for reference." Every calculation returns `methodology_notes`, a step-by-step audit
trail string list.

### 7.2 Parameterisation — CCF tables and overlays

**CCF matrix** (`CCF_TABLE`, keyed facility_type × asset_class; provenance comment: "CRR Art. 111,
Annex I; BCBS d424 Table 12"). Representative rows:

| Facility type | Typical CCF | Notes from code |
|---|---|---|
| TERM_LOAN | 100% (all classes) | Fully drawn, on-balance-sheet |
| REVOLVING_CREDIT / UNDRAWN_COMMITMENT | 50% corporate, 40% retail-revolving/other | UNDRAWN_COMMITMENT: 40% sovereign/bank, 75% specialised lending |
| UNCONDITIONALLY_CANCELLABLE | 10% (all classes) | "Basel IV: 10% (up from 0%)" — the final-Basel-III removal of the 0% CCF |
| TRADE_LETTER_OF_CREDIT | 20% (10% sovereign) | Short-term self-liquidating |
| STANDBY_LETTER_OF_CREDIT / TRANSACTION_CONTINGENCY | 50% | Performance contingencies |
| GUARANTEE | 75% (100% specialised lending) | Direct credit substitutes |
| FINANCIAL_GUARANTEE / REPO_STYLE / MARGIN_LENDING | 100% | Full conversion |
| NOTE_ISSUANCE_FACILITY | 40% | NIFs/RUFs |

Short-maturity overrides (`SHORT_MATURITY_CCF_OVERRIDES`, original maturity < 1y): UNDRAWN_COMMITMENT
20%, REVOLVING_CREDIT 40%, NOTE_ISSUANCE_FACILITY 20%, TRANSACTION_CONTINGENCY 20%. Lookup fallback
chain: short-maturity override → exact (facility, class) → (facility, CORPORATE) → 1.00 conservative.

**SA-CCR add-on factors** (`SACCR_ADDON_FACTORS`, comment cites "CRR Art. 274-280, Table 2 of BCBS
d279", simplified): interest_rate 0.5%, credit 1%, fx 4%, commodity 18%, equity 32% of notional;
α = 1.4 (`SACCR_ALPHA`). Maturity factor `sqrt(clamp(M, 0.25, 5))` for IR/credit only, else 1.0:
`addon = 1.4 × factor × notional × maturity_factor`.

**Climate drawdown stress** (`CLIMATE_DRAWDOWN_STRESS`, per sector; code cites EBA GL/2022/16 §4.3
"Climate as driver of credit deterioration" — these are **synthetic expert-judgement values**, not
published factors): Oil & Gas 25%, Airlines 22%, Metals & Mining/Shipping 20%, Automotive 18%,
Power Gen/Chemicals 15%, Construction 14%, Real Estate 12%, Agriculture/Utilities 10%,
Financial/Retail 8%, Technology 5%, Telecom 4%, Healthcare 3%; default 5%. Scenario multipliers:
optimistic ×0.5, base ×1.0, adverse ×1.5, severe ×2.0.

**Maturity adjustment** (reference-only output): simplified mode
`MA = 1 + (clamp(M,1,5) − 2.5) × 0.025`, floored at 0.85, retail = 1.0; full Basel mode
`b = (0.11852 − 0.05478·ln(PD))²`, `MA = (1 + (M−2.5)·b)/(1 − 1.5·b)` with PD floored at 3bp and
M clamped to [1, 5] per Art. 162.

### 7.3 Calculation walkthrough

`POST /calculate` (single) and `POST /calculate-batch` (up to 10,000 exposures) run the 10-step
sequence: (1) undrawn = max(commitment − outstanding, 0); (2) CCF lookup; (3) undrawn EAD =
undrawn × CCF; (4) guarantee exposure = guarantee_amount × guarantee CCF (only for the four
guarantee/LC facility types, default 0.75); (5) SA-CCR add-on if derivative notional > 0;
(6) maturity adjustment (simplified or b(PD)); (7) `ead_pre_climate` = sum of 1+3+4+5;
(8) climate uplift = undrawn × sector stress × scenario multiplier (only if `apply_climate_stress`
and undrawn > 0); (9) `ead_post_climate`; (10) `regulatory_ead = max(ead_post_climate, 0)`.
Batch aggregates: total EAD, on-balance total, undrawn-weighted average CCF
(`Σ CCF·undrawn / Σ undrawn`), and EAD grouped by asset class and facility type.
Reference endpoints expose the tables: `GET /ccf-matrix`, `GET /ccf/{asset_class}/{facility_type}`,
`GET /asset-classes`, `GET /facility-types`, `GET /climate-stress`.

### 7.4 Worked example

Corporate revolving credit: outstanding $60M, commitment $100M, sector Oil & Gas, scenario
**adverse**, no derivatives/guarantees.

| Step | Computation | Result |
|---|---|---|
| Undrawn | 100 − 60 | $40M |
| CCF | (REVOLVING_CREDIT, CORPORATE) | 50% |
| Undrawn EAD | 40 × 0.50 | $20M |
| EAD pre-climate | 60 + 20 | **$80M** |
| Climate stress % | 0.25 (Oil & Gas) × 1.5 (adverse) | 37.5% |
| Climate uplift | 40 × 0.375 | $15M |
| **Regulatory EAD** | 80 + 15 | **$95M** |

The climate overlay effectively lifts the drawn-equivalent CCF on the undrawn tranche from 50% to
87.5% under the adverse scenario — encoding the observed crisis behaviour that stressed obligors
draw committed lines.

### 7.5 Interconnections

Per the class docstring, "EAD output feeds directly into ECL engine (ECL = PD × LGD × EAD)" — the
sibling `/api/v1/ecl` domain consumes `regulatory_ead`. The `EADInput` dataclass mirrors the
PDResult/PDContribution pattern of `pd_calculator.py`, keeping typed handoffs between the PD, LGD
and EAD engines consistent.

### 7.6 Data provenance & limitations

- **No synthetic seed data**: the engine is a pure calculator over caller-supplied exposures. The
  CCF matrix values track the Basel III standardised CCF ladder (10/20/40/50/75/100%), though the
  per-asset-class refinements (e.g. 40% retail revolving vs 50% corporate) are platform choices
  within that ladder rather than a verbatim regulatory table.
- Climate drawdown factors and scenario multipliers are **synthetic demo calibrations** motivated
  by, but not published in, EBA GL/2022/16.
- SA-CCR is heavily simplified: no replacement cost (MtM assumed 0), no netting sets, no margining,
  single supervisory factor per class — production SA-CCR computes `EAD = α(RC + PFE)` with
  multiplier, hedging-set aggregation and maturity-factor formulas per BCBS d279.
- Maturity adjustment is reported but unused; downstream consumers must apply it inside the RWA
  risk-weight function, not EAD.

### 7.7 Framework alignment

- **Basel III/IV (BCBS d424, final standardised approach):** CCF ladder including the 10% CCF on
  unconditionally cancellable commitments (Basel IV change from 0%); implemented as the lookup table.
- **CRR Art. 111 / Annex I & Art. 166:** on- plus CCF-converted off-balance exposure; EAD excludes
  the maturity term per the in-code correction.
- **Basel III Art. 153(1)/162:** the b(PD) maturity-adjustment formula is implemented verbatim
  (with 3bp PD floor and M∈[1,5]); retail exemption honoured.
- **BCBS d279 (SA-CCR):** α = 1.4 and per-class supervisory factors approximated; PFE-only simplification.
- **IFRS 9 B5.5.32:** expected-drawdown logic motivates the climate uplift on undrawn commitments
  feeding lifetime ECL.
- **EBA GL/2022/16 (ESG risk management guidelines):** rationale for treating climate stress as a
  drawdown-acceleration driver; calibration is illustrative.

## 9 · Future Evolution

### 9.1 Evolution A — Full SA-CCR, calibrated climate drawdown, and asset-class-faithful CCFs (analytics ladder: rung 2 → 3)

**What.** A Basel III/IV Exposure-at-Default engine (v2.0.0) with a climate drawdown overlay — CCF
conversion of undrawn commitments, guarantee/LC handling, an SA-CCR add-on, and the correct exclusion
of the maturity adjustment from EAD (a documented in-code fix that previously overstated EAD ~70%).
Already rung 2 (scenario multipliers optimistic→severe). §7.6 names the deepening targets: SA-CCR is
**heavily simplified** (no replacement cost — MtM assumed 0, no netting sets, no margining, single
supervisory factor per class) versus the full BCBS d279 `EAD = α(RC + PFE)` with hedging-set
aggregation; the climate drawdown factors and scenario multipliers are **synthetic expert-judgement**
values motivated by but not published in EBA GL/2022/16; and the per-asset-class CCF refinements are
platform choices within the Basel ladder. Evolution A implements full SA-CCR and calibrates the
climate overlay.

**How.** `_calculate_saccr_addon` gains replacement cost, netting sets and margining per d279;
`_get_climate_drawdown_stress` factors are calibrated against observed crisis-period drawdown data
(the platform has facility utilisation history via `data_intake`); the CCF table is reconciled
cell-by-cell against the ITS. Rung 3: the climate overlay conditions on NGFS scenario paths rather
than flat optimistic/base/adverse/severe multipliers, tying it to the platform's scenario data.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /calculate` and
`/calculate-batch` both **failed** (need input payloads to trace); preserve the documented
maturity-adjustment exclusion (it belongs in the RWA risk-weight, not EAD). **Acceptance:** the §7.4
worked example (Oil & Gas revolving, £95M regulatory EAD under adverse) reproduces at legacy climate
factors; full SA-CCR produces a different add-on than the PFE-only simplification for a margined
derivative; the failing POST endpoints pass the harness.

### 9.2 Evolution B — EAD/credit-exposure analyst with tool-called calculation (LLM tier 2)

**What.** A tool-calling analyst for credit-risk teams: "compute EAD for this revolving facility under
an adverse climate scenario" (`/calculate` → undrawn CCF conversion + climate uplift + methodology
audit trail), "run our whole loan book" (`/calculate-batch` up to 10,000 exposures → undrawn-weighted
CCF, EAD by asset class/facility type), and "what CCF applies to a standby LC?" (the reference
endpoints) — narrating the engine's real Basel outputs and its step-by-step `methodology_notes`.

**How.** Tool schemas over the 2 POST + 5 GET operations; the reference endpoints (CCF matrix,
climate-stress factors, facility types, asset classes) are ideal RAG grounding for "what's the Basel
IV CCF for an unconditionally cancellable commitment?" questions. The no-fabrication validator checks
every EAD, CCF and uplift against tool output. Because EAD feeds the sibling ECL engine
(`ECL = PD×LGD×EAD`), this is a natural node in a Financial-desk credit-risk orchestrator alongside
`ecl_climate` and `banking_risk`.

**Prerequisites.** Evolution A's harness fixes (working calculate endpoints for tool-calling); Atlas +
reference corpus embedded (roadmap D3). **Acceptance:** every figure cited traces to an engine tool
call; the EAD matches `/calculate` including the climate uplift; the copilot surfaces the
methodology-notes audit trail and states that climate drawdown factors are illustrative until
Evolution A calibrates them.