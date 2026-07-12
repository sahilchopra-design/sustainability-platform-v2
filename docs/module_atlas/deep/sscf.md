## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch — fire-and-forget API call, not missing model.** As with `sovereign-swf`,
> a real backend engine exists (`backend/services/sscf_engine.py`, 1,560 lines: OECD DDG 5-step
> due-diligence scoring, CSDDD adverse-impact cascade detection, an SPT-linked margin-ratchet
> step-schedule, and a GSCFF-standard dynamic-discounting formula). **The frontend calls
> `POST /api/v1/sscf/assess` but discards the response** (`await axios.post(...)` with no assignment,
> and even the `catch` block does nothing but comment "API fallback to seed data"). Every number on
> the page — for every tab — comes from `buildData()`, a purely client-side hash-seeded generator
> that runs synchronously on every render and never consults the backend's actual OECD DDG/CSDDD/
> margin-ratchet logic. Sections 7.1–7.4 document the frontend's `buildData()`; §7.5 documents the
> real backend engine it fails to use.

### 7.1 What the frontend computes

`buildData(buyer, progType, framework, sizeStr)` derives a deterministic hash `seed =
hashStr(buyer+progType+framework+sizeStr)` (a 32-bit Java-style string hash, `hashStr = (a,c) =>
(31×a + charCode)|0`), then feeds `seed+offset` into `sr()` for every field:

```
overallScore    = round(sr(seed,1)×25 + 60)          // 60–85
oecdStep        = min(5, ceil(sr(seed,3)×5))          // 1–5, cosmetic "current DDG step" marker
scope3Coverage  = round(sr(seed,5)×30 + 45)           // 45–75%
eligible        = overallScore ≥ 65
criteriaData[i] = round(sr(seed, i×7+10)×35 + 50)     // 8 named criteria (OECD DDG steps 1-5, ICMA GBP, LMA SLLP, Scope3 Cat1)
kpiCategories   = 6 ESG sub-scores, each round(sr(seed,offset)×range + base)
suppliers[i]    = esgScore, discountBps — per of 8 named mock suppliers
baseRate        = 5.25 + sr(seed,91)×1.5              // 5.25–6.75%
ratchetYears[i] = adjustedRate = baseRate + sptAdjust×(i+1),  sptAdjust = −(sr()×0.3+0.05)
csdddScore      = mean(oecdSteps[0..4])                // average of 5 synthetic OECD-DDG step scores
```

Because `buyer`/`progType`/`framework`/`sizeStr` are hashed into a single seed, the **entire page is
a deterministic (but not meaningful) function of the input form** — typing a different buyer name
produces a completely different but internally-consistent-looking set of scores, with no actual
assessment logic behind the change.

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `overallScore` | 60–85 | Synthetic; deliberately biased high (min 60) so most inputs appear "eligible" |
| `criteriaData` (8 criteria incl. OECD DDG steps 1-5, ICMA GBP, LMA SLLP, Scope3 Cat1) | 50–85 | Synthetic — real criteria names, fake scores |
| `baseRate` | 5.25–6.75% | Synthetic; plausible reverse-factoring base rate order of magnitude |
| `sptAdjust` per ratchet year | −0.05 to −0.35 pp | Synthetic; loosely resembles real SLL margin ratchets but not tied to the backend's actual −50/−30/−15/−5bp step schedule |
| `SPTS` (5 named sustainability performance targets, bps values 8–20) | Real-sounding SPT categories (GHG intensity, renewable %, water intensity, supplier audit coverage, deforestation-free) | Descriptive reference table, not wired into `ratchetYears`' actual computation |

### 7.3 Calculation walkthrough (frontend)

1. **Hash seed** — `buildData()` runs on every render (not memoised), deriving all outputs from the
   4 form inputs via `hashStr`.
2. **Programme Assessment tab** — `overallScore`, `oecdStep`, `scope3Coverage`, `eligible` badge.
3. **ESG KPI Library tab** — `kpiCategories` (6 pillars) and `topKPIs` (10 named real Scope
   1+2/Scope 3 Cat1/renewable%/etc. KPIs), each independently `sr()`-scored.
4. **Supplier Scorecards tab** — the 8 `MOCK_SUPPLIERS` (real-sounding names/countries/tiers) each
   get an `esgScore` and `discountBps`, both independent `sr()` draws unconnected to the tier/risk
   fields hand-set in `MOCK_SUPPLIERS`.
5. **Margin Ratchet & Economics tab** — `baseRate` plus a 4-year `ratchetYears` schedule where the
   adjustment compounds linearly by year index (`sptAdjust×(i+1)`) rather than following the
   backend's discrete tier step-function.
6. **CSDDD & OECD DDG tab** — `oecdSteps` (5 synthetic step scores) averaged into `csdddScore`.
7. **`runAssess()`** — posts the 4 form fields to the real backend `/assess` endpoint, awaits the
   response, and then **does nothing with it** — no state update, no re-render with backend data.

### 7.4 Worked example — default form state

`buyer='Siemens AG'`, `progType='reverse_factoring'`, `framework='LMA_SSCF_2023'`, `size='500'` →
`seed = hashStr(...) = 124,595,509`.

| Output | Formula | Result |
|---|---|---|
| `overallScore` | `round(sr(seed,1)×25+60)` | **75** → `eligible=true` |
| `oecdStep` | `min(5,ceil(sr(seed,3)×5))` | **2** |
| `scope3Coverage` | `round(sr(seed,5)×30+45)` | **68%** |
| `baseRate` | `5.25+sr(seed,91)×1.5` | **5.33%** |
| `oecdSteps` (5) | per-step formulas | 71, 75, 64, 48, 52 |
| `csdddScore` | mean of the 5 | **62** |

Changing only `size` from `'500'` to `'501'` changes the entire 32-bit hash and every downstream
score — there is no continuity or sensitivity relationship between programme size and any output,
even though a real SSCF economics model would show monotonic relationships (e.g. larger programmes
→ different discount economics via the backend's actual `calculate_dynamic_discount`).

### 7.5 The real (disconnected) backend methodology

- **`_score_kpi`** — scores each of the KPI library's indicators 0–100: binary KPIs are 0/100;
  "lower-is-better" KPIs (GHG intensity, LTIFR, water intensity, etc. — 11 named indicators) score
  via `100 − log1p(value)×12` (diminishing-penalty log curve, floor 0); percentage KPIs pass through
  clamped to [0,100]; a few frequency-based KPIs (audit count, training hours) use fixed linear
  scalers.
- **`_score_oecd_ddg`** — maps each of the real **OECD Due Diligence Guidance's 5 steps** (Management
  Systems, Risk Identification, Risk Mitigation, Third-Party Audit, Reporting) to its own KPI subset,
  averages available KPI scores per step (defaulting to 30/100 "minimal compliance assumed" if no
  data), weights by `step_info["weight_pct"]`, and flags `oecd_ddg_compliant = weighted_total≥55.0`.
- **`_check_csddd_cascades`** — flags real CSDDD adverse-impact categories (forced labour,
  deforestation, etc.) whenever a trigger KPI scores below 40 — genuine cascade logic, not a fixed
  count as shown in the frontend's static `ADVERSE_IMPACTS` table.
- **`calculate_margin_ratchet`** — a real discrete SPT-achievement step schedule: 100% SPTs met →
  **−50bps**; 80–99% → **−30bps**; 60–79% → **−15bps**; 40–59% → **−5bps**; 20–39% → **0bps** (grace
  period); 0–19% → **+10bps**; 0% → **+25bps**; capped at [−75, +50]bps — materially different from
  the frontend's continuous linear `sptAdjust×(i+1)` approximation.
- **`calculate_dynamic_discount`** — the genuine GSCFF-standard formula: `annualised_rate =
  clamp(buyer_WACC, 0.5%, 8.0%) × (days_early/360)`; `discount_amount = invoice × annualised_rate`.

### 7.6 Data provenance & limitations

- Frontend outputs are 100% synthetic, hash-seeded per form input; the backend response from
  `runAssess()` is thrown away.
- The real backend's discrete margin-ratchet step function and log-curve KPI scoring are materially
  more defensible than the frontend's continuous linear approximations, and already exist in
  production Python — the fix here is wiring the response into component state, not building a new
  model.
- `MOCK_SUPPLIERS`' `risk` field (Low/Medium/High) is never used to compute `esgScore` — a supplier
  hand-labelled "High" risk can still draw a high synthetic ESG score.

**Framework alignment:** OECD Due Diligence Guidance for Responsible Business Conduct (real 5-step
structure, genuinely implemented server-side in `_score_oecd_ddg`) · EU CSDDD adverse-impact taxonomy
(genuinely cascaded server-side) · LMA Sustainability-Linked Loan Principles / GSCFF Standard
Definitions (real margin-ratchet and dynamic-discount formulas server-side) · ICMA Green Bond
Principles (named as a criterion, not scored against real framework text in either layer).
