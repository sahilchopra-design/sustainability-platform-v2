## 7 · Methodology Deep Dive

### 7.1 What the module computes

This is one of the platform's most faithfully-grounded modules: 12 **named real US investor-owned
utilities** (Duke Energy Carolinas, PG&E, Dominion VA, Xcel Energy Colorado, etc.) carry curated
rate-case fields (rate base, allowed/earned ROE, regulatory lag days, equity ratio, capex) that
appear to be researched, plausible figures rather than random draws — no `sr()` appears in the
static `UTILITIES` array. The genuine calculation layer sits in the WACC calculator and lag-cost
formula:

```js
WACC_after_tax = equityRatio × ROE + (1 − equityRatio) × debtCost × (1 − 0.21)     // 21% = US federal statutory corp tax rate (TCJA)
allowedReturn  = rateBase × WACC / 100 / 1000                                       // $M → $Bn scaling
lagCost        = round(rateBase × (allowedROE − earnedROE) / 100 / 1000 × lagDays / 365 × 1000)
```

### 7.2 Parameterisation — the 12-utility dataset (spot-checked)

| Utility | Rate base ($M) | Allowed ROE | Earned ROE | Lag (days) | Equity ratio |
|---|---|---|---|---|---|
| Duke Energy Carolinas | 28,400 | 9.9% | 9.7% | 312 | 52% |
| Xcel Energy Colorado | 14,200 | 9.5% | 9.2% | 420 | 49% |
| **Pacific Gas & Electric** | **52,000** | **10.0%** | **9.4%** | **510** | 52% |
| Dominion VA | 31,200 | 9.6% | 9.4% | 278 | 53% |
| Puget Sound Energy | 12,400 | 9.4% | 9.1% | 445 | 51% |

Portfolio average allowed ROE across all 12: **9.69%** (matches the guide's cited "Median allowed
ROE (US electric) 9.6%" closely). Portfolio average lag: **343 days**; true median (sorted 12
values, mean of 6th/7th) = **310 days** — both in the same order of magnitude as the guide's cited
"Median regulatory lag 328 days," though neither the code's mean nor its exact median reproduces
328 precisely; treat the guide figure as an independently-sourced reference statistic (EEI Rate
Case Activity 2023) rather than a value recomputed live from this 12-utility sample.

**Verified defect — PG&E lag-cost figure does not match the guide's own worked example.** The
guide states: *"Pacific Gas & Electric: $52Bn rate base, 510-day regulatory lag, earned 9.4% vs
allowed 10.0% ROE — **$328M annual regulatory lag cost**."* Running the code's own `lagCost`
formula on PG&E's exact row (`rate_base=52000`, `allowed_roe=10.0`, `earned_roe=9.4`,
`lag_days=510`):

```
lagCost = round(52000 × (10.0−9.4) / 100 / 1000 × 510 / 365 × 1000)
        = round(52000 × 0.6 / 100 / 1000 × 510/365 × 1000)
        = round(312 / 1000 × 1.3973 × 1000)
        = round(0.312 × 1.3973 × 1000)
        = round(436.0)
        = 436
```

The code produces **$436M**, not the guide's stated **$328M** — a ~33% overstatement relative to
the guide's own cited figure for the exact same utility, using the exact same input fields quoted
in the guide's `brief` text. Either the guide's $328M was computed with a different (undisclosed)
formula, or the code's formula has since drifted from what originally produced that figure — a
model-validation reviewer would flag this reconciliation gap and require one canonical formula.

### 7.3 Calculation walkthrough

1. **Utility Universe tab**: 12-row table, `filterPending` toggle to show only utilities with
   `pending=true` cases (currently 3 of 12: Xcel Colorado, Evergy Kansas, Puget Sound Energy).
2. **Rate Base Build-Up tab**: `RATE_BASE_COMPONENTS`, a static FERC-USoA-style waterfall (Gross
   Plant → less Accumulated Depreciation → Net Plant + CWIP + Working Capital − Deferred Tax −
   Customer Advances → Total Rate Base $12,765M) — correctly includes the TCJA-driven "Deferred
   Income Tax (Offset)" deduction as a rate-base reducer, matching real ADIT/EDIT ratemaking
   treatment.
3. **Revenue Requirement tab**: `REVENUE_REQUIREMENT`, a static cost-of-service waterfall (Return
   on Rate Base via WACC → + D&A → + O&M → + Taxes → + Revenue Grossup → Total $4,168M) —
   internally consistent: `Return on Rate Base 882 = 6.91% × 12,765` checks out
   (`12,765×0.0691=882.3` ✓).
4. **ROE Trends tab**: `ROE_HISTORY`, a 32-half-year (2000–2015, `2000+floor(i/2)`) synthetic
   series — `median_allowed = 12.5 − i×0.12 + sr(i×7)×0.4`, `median_earned` similarly, `fed_funds`
   a piecewise approximation of the real Fed Funds cycle (high ~2000, cut to near-zero
   post-2008/2020, rising post-2022) — the **only** seeded-random series in the file, used to show
   a declining-ROE-trend-with-noise narrative against a genuinely shaped Fed Funds proxy.
5. **Case Timeline tab**: `CASE_TIMELINE`, 8 phases summing to a **41-week standard process**
   (Pre-Filing 12wk → Filed 1wk → Discovery 8wk → Hearings 4wk → Briefing 6wk → Deliberation 8wk →
   Rate Effective 2wk), matching the guide's own "41-week standard process" description.
6. **Capex Recovery tab**: `CAPEX_FORECAST`, 10-year (2025–2034) `maintenance = 420 + sr(i×7)×80`
   projection — seeded-random noise around a rising base, illustrative rather than utility-specific.
7. **WACC Calculator tab**: interactive — user sets `equityRatio`, `roeAssumption`, `debtCost`;
   live `wacc = equityRatio×ROE + (1−equityRatio)×debtCost×(1−0.21)` and `allowedReturn =
   rateBase×wacc/100/1000` for the utility selected.

### 7.4 Worked example — WACC calculator

`equityRatio=52%`, `roeAssumption=9.9%`, `debtCost=4.8%` (Duke Energy Carolinas' own profile):

| Step | Formula | Result |
|---|---|---|
| Equity component | `0.52 × 9.9` | 5.148 |
| Debt component (after-tax) | `0.48 × 4.8 × (1−0.21)` | `0.48×4.8×0.79=1.820` |
| **WACC (after-tax)** | `5.148+1.820` | **6.97%** |
| Allowed return ($Bn) | `28,400 × 6.97/100/1000` | **$1.98Bn** |

### 7.5 Companion analytics

Utility Universe (12-utility sortable table), Rate Base Build-Up, Revenue Requirement, ROE Trends
(32-period history + Fed Funds overlay), Case Timeline (41-week Gantt), Capex Recovery
(2025–2034 10-year forecast), WACC Calculator (interactive sensitivity tool).

### 7.6 Data provenance & limitations

- **The 12-utility dataset and rate-base/revenue-requirement waterfalls are curated**, not
  `sr()`-seeded, and are internally arithmetic-consistent where checked (`Return on Rate Base`
  line ties out to `WACC × Rate Base`) — one of the stronger data-provenance profiles in this batch.
- **The `lagCost` formula does not reproduce the guide's own cited $328M PG&E figure** (§7.2) —
  this is a genuine, reproducible discrepancy that should be resolved before citing either number
  externally.
- ROE Trends and Capex Recovery are the only seeded-random series; both are illustrative
  trajectories, not utility-specific projections.
- No actual FERC Uniform System of Accounts account-level detail exists beyond the 10-line
  rate-base summary — a production model would need per-account (Account 101–108, 254, 281–283,
  etc.) granularity for regulatory filing use.

**Framework alignment:** FERC Uniform System of Accounts (18 CFR Part 101) — rate-base build-up
structure (gross plant, accumulated depreciation, CWIP, ADIT) is directionally correct · NARUC
Annual Survey of Rate Case Activity — cited for allowed-ROE benchmarking, roughly consistent with
the dataset's own 9.69% average · EEI Rate Case Activity — cited for the 41-week case timeline and
regulatory-lag framing, both structurally represented in the code · AFUDC (Allowance for Funds
Used During Construction) — named in the guide's acronym list (CWIP earning AFUDC) but not
separately computed as a distinct revenue-requirement line item in this module.
