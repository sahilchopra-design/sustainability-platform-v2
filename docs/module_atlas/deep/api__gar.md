## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded in
`backend/services/gar_calculator.py`, `backend/services/counterparty_climate_scorer.py`,
`backend/services/gar_db_service.py`, and `backend/api/v1/routes/gar.py`. This is the platform's
**CRR Art. 449a Pillar-3 GAR** engine; a sibling Art. 8 Delegated Act engine lives in the
`eu_taxonomy_gar` domain.)*

### 7.1 What the domain computes

Three cooperating engines:

**1. `GARCalculator` — Green Asset Ratio per CRR Art. 449a / EBA ITS 2022/01:**

```
GAR_stock    = aligned_assets / covered_assets
GAR_eligible = eligible_assets / covered_assets
GAR_flow     = aligned new originations / covered new originations
covered_assets = total assets − exclusions {SOVEREIGN, CENTRAL_BANK, INTERBANK, HEDGING_DERIVATIVE}
```

with breakdowns by the 6 Taxonomy objectives (Arts 10–15), by CRR2 ITS KPI type
(Turnover/CapEx/OpEx — summed from per-exposure aligned/eligible amounts over the shared
covered-asset denominator), and by asset type.

**2. `CounterpartyClimateScorer` — composite climate score, 0–100 higher = better:**

```
composite = 0.40 × TransitionRisk + 0.30 × PhysicalRisk + 0.20 × Alignment + 0.10 × DataQuality
```

mapped to letters A+ (90–100) … D− (0–29). Custom weights allowed but must sum to 1 ± 0.01.

**3. `GARDBService` — auto-calculation** (`GET /auto-calculate/{entity_id}`, `/by-lei/{lei}`):
builds `GARExposure` records from stored `eu_taxonomy_activities` (per-activity SC/DNSH/MSS
flags) and loan-book tables, then runs `GARCalculator` and persists the result.

Reference endpoints expose the alignment classifications, excluded asset types, KPI types,
scorer rating scale, sector risk map, and default weights.

### 7.2 Parameterisation

**Classification resolution** (`_resolve_classification`, priority order): explicit
classification → household auto-assessment → NACE eligibility → NOT_ELIGIBLE.

| Auto-assessment rule | Result | Basis |
|---|---|---|
| Mortgage EPC A | TAXONOMY_ALIGNED | Taxonomy TSC 7.7 proxy (top-15% / NZEB evidence) |
| Mortgage EPC B–C | TAXONOMY_ELIGIBLE | eligible activity, alignment unproven |
| Mortgage EPC D–G | NOT_ELIGIBLE | fails screening proxy |
| Auto loan `is_ev_loan` | TAXONOMY_ALIGNED | TSC 6.5 zero-tailpipe proxy |
| Renovation loan flag | TAXONOMY_ALIGNED | TSC 7.2 proxy (no 30% PED test computed) |
| NACE in 32-code map | TAXONOMY_ELIGIBLE | Climate DA 2021/2139 + Env DA 2023/2486 activity list |

The NACE→objective map covers 32 activities (e.g. `D35.11` power generation →
{mitigation, adaptation}; `C23.51` cement → mitigation; `E38.32` materials recovery →
circular economy).

**Scorer rubric:**

| Component (weight) | Sub-scores (sub-weights) | Missing-data defaults |
|---|---|---|
| Transition 40% | carbon-intensity rank 30%, sector risk 25%, policy exposure 25%, tech readiness 20% | sector lookup (low 80 / medium 55 / high 30 / very_high 10); tech 50 |
| Physical 30% | flood, heat, water, supply-chain — 25% each (100 = lowest risk) | 60 each |
| Alignment 20% | SBTi +20 · taxonomy% → 0–40 · transition-plan 1–5 → 0–40 | 0 |
| Data quality 10% | disclosure (none 0/partial 50/full 100)×0.40 + recency (0–5 yr inverse)×0.30 + verified +30 flat | recency 20 ("assume stale") |

22 sectors carry a transition-risk level (Oil & Gas / Coal = very_high; Power, Steel, Cement,
Airlines, Shipping = high; Tech/Health/Financials = low). Weights and sub-weights are platform
design values inspired by EBA GL/2022/16 and the ECB Guide — not regulator-prescribed numbers.

### 7.3 Calculation walkthrough

`GARCalculator.calculate` iterates exposures once: excluded types accrue to `excluded_assets`
only; covered exposures are classified, ALIGNED contributes its full carrying amount to both
numerator and eligible total; ELIGIBLE only to the eligible total; objective totals accrue by
`primary_objective` (secondary objectives also receive the aligned amount — so objective rows
can *double-count* across objectives by design; the headline GAR does not). Methodology notes
record every aggregate. The DB service maps SC+DNSH+MSS flags → ALIGNED, eligible-only →
ELIGIBLE, and for denormalised sector books derives `turnover_eligible = EAD × aligned_pct × 1.5`
(a synthetic 1.5× eligible-to-aligned assumption).

### 7.4 Worked example — 4-exposure book

| Exposure | Type | €M | Classification path |
|---|---|---|---|
| Wind-farm loan | NFC_LOAN | 200 | explicit ALIGNED (obj: mitigation) |
| Mortgage EPC B | HOUSEHOLD_MORTGAGE | 100 | auto → ELIGIBLE |
| Cement loan, NACE C23.51 | NFC_LOAN | 150 | NACE map → ELIGIBLE |
| Government bond | SOVEREIGN | 300 | **excluded** |

- Total assets 750; excluded 300; **covered = 450**.
- Aligned = 200 → **GAR = 200/450 = 44.44%**; eligible = 200+100+150 = 450 → eligible ratio 100%.
- Mitigation objective row: aligned 200 (44.44% of covered).
- Scorer cross-check: an Oil & Gas counterparty with carbon rank 25, policy 30, tech 40,
  physical inputs {40,50,60,45}, SBTi ✓, taxonomy 10%, plan quality 2, partial disclosure,
  1-yr-old verified data:
  TR = 25×0.30+10×0.25+30×0.25+40×0.20 = 25.5 → 10.20 weighted;
  PR = (40+50+60+45)/4 = 48.75 ≈ 48.8 → 14.63;
  AL = 20+4+10 = 34 → 6.80; DQ = 50×0.4+80×0.3+30 = 74 → 7.40;
  **composite = 39.0 → rating "D+" (Poor climate posture)**.

### 7.5 Stock vs flow, and the two GAR engines

`GAR_flow` repeats the stock logic over `flow_exposures` (new originations) — the EBA templates
require both. Platform note: this domain (`/api/v1/gar`) implements the **CRR Art. 449a
Pillar-3** view with the correct broad denominator (only sovereign/central-bank/interbank/hedging
derivatives excluded), while `eu_taxonomy_gar` implements the Art. 8 Delegated Act view with a
narrower eligible-classes-only denominator; reconciling the two is a known interpretation gap.

### 7.6 Data provenance & limitations

- No synthetic PRNG. Inputs are caller-supplied exposures or DB rows
  (`eu_taxonomy_activities`, loan-book tables); the NACE map, EPC map, sector-risk levels,
  and all scorer weights are hardcoded platform calibrations.
- Alignment is binary at exposure level (full carrying amount in or out); the real EBA templates
  allow *proportional* alignment (e.g. specialised-lending percentage splits) — the DB service's
  sector path partially does this via `EAD × aligned_pct` but only for the Turnover KPI column.
- `not_assessed_count` is initialised and reported but **never incremented** — `assessed_pct`
  always returns 1.0; a data-quality metric in name only.
- The 1.5× eligible multiplier in `_denormalized_loan_book_to_exposures` is an uncited synthetic
  assumption. EPC-B/C eligibility and EV/renovation auto-alignment skip DNSH/MSS evidence.
- Scorer sub-weights, defaults (60 physical, 50 tech, 20 recency), and the A+…D− band edges are
  platform choices; missing-band gap: scores in (89,90), (79,80)… fall through to exact integer
  bands but pass because scores are rounded to 0.1 and bands use ≤ comparisons — scores like 89.5
  match **no** band and fall through to "D-". (Edge case worth a fix.)

### 7.7 Framework alignment

- **CRR Art. 449a + EBA ITS/2022/01 (Pillar 3 ESG)** — GAR stock/flow with the prescribed
  denominator exclusions and Annex XI Turnover/CapEx/OpEx KPI dimensions.
- **EU Taxonomy Regulation 2020/852** — alignment = substantial contribution + DNSH + minimum
  safeguards; the DB service consumes exactly those three per-activity flags; objective labels
  cite Arts 10–15.
- **Climate DA 2021/2139 / Environmental DA 2023/2486** — the NACE eligibility map transcribes a
  32-activity subset of the delegated acts' activity lists.
- **EBA GL/2022/16, ECB Guide (Nov 2020), BCBS Principles (2022)** — cited as the design basis
  for the composite counterparty score; these require institutions to embed climate factors in
  counterparty assessment but do not prescribe the 40/30/20/10 weights — those are this module's
  calibration.
- **SBTi** — a validated/committed science-based target earns a flat +20 alignment bonus;
  in SBTi's own framework, commitment means a public pledge with target validation to follow
  within 24 months.
