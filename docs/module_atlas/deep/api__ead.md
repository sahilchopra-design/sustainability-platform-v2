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
