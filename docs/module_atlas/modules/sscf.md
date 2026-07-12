# SSCF – Sustainable Supply Chain Finance
**Module ID:** `sscf` · **Route:** `/sscf` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG-linked supply chain finance platform that dynamically adjusts financing rates for suppliers based on real-time ESG performance scores, incentivising supply chain sustainability improvements.

> **Business value:** SSCF programmes have demonstrated 15–25% ESG score improvements among enrolled suppliers within two years, with lower default rates than conventional supply chain finance.

**How an analyst works this module:**
- Onboard suppliers and baseline ESG scores
- Define scoring bands and corresponding spread adjustments
- Monitor quarterly ESG re-assessments
- Apply rate adjustments on next financing cycle
- Report aggregate ESG improvement and cost of finance savings

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ADVERSE_IMPACTS`, `API`, `Badge`, `Btn`, `CRITERIA_SCORES`, `Inp`, `KpiCard`, `MOCK_SUPPLIERS`, `PIE_COLORS`, `Row`, `SPTS`, `Section`, `Sel`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MOCK_SUPPLIERS` | 9 | `country`, `tier`, `risk` |
| `SPTS` | 6 | `threshold`, `bps` |
| `ADVERSE_IMPACTS` | 7 | `severity`, `suppliers` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `hashStr` | `(s) => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `seededRandom` | `(seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };` |
| `seed` | `hashStr(buyer + progType + framework + sizeStr);` |
| `overallScore` | `Math.round(sr(seed, 1) * 25 + 60);` |
| `oecdStep` | `Math.min(5, Math.ceil(sr(seed, 3) * 5));` |
| `scope3Coverage` | `Math.round(sr(seed, 5) * 30 + 45);` |
| `criteriaData` | `CRITERIA_SCORES.map((name, i) => ({` |
| `suppliers` | `MOCK_SUPPLIERS.map((s, i) => ({` |
| `baseRate` | `5.25 + sr(seed, 91) * 1.5;` |
| `ratchetYears` | `['2024', '2025', '2026', '2027'].map((yr, i) => {` |
| `sptAdjust` | `-(sr(seed, i * 19 + 95) * 0.3 + 0.05);` |
| `csdddScore` | `Math.round(oecdSteps.reduce((s, o) => s + o.value, 0) / 5);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/sscf/ref/sscf-frameworks` | `get_sscf_frameworks_ref` | api/v1/routes/sscf.py |
| GET | `/api/v1/sscf/ref/sector-risk-profiles` | `get_sector_risk_profiles_ref` | api/v1/routes/sscf.py |
| GET | `/api/v1/sscf/ref/oecd-ddg` | `get_oecd_ddg_ref` | api/v1/routes/sscf.py |
| POST | `/api/v1/sscf/assess` | `assess_programme` | api/v1/routes/sscf.py |
| POST | `/api/v1/sscf/supplier-score` | `compute_supplier_score` | api/v1/routes/sscf.py |
| POST | `/api/v1/sscf/margin-ratchet` | `compute_margin_ratchet` | api/v1/routes/sscf.py |
| POST | `/api/v1/sscf/dynamic-discount` | `compute_dynamic_discount` | api/v1/routes/sscf.py |

### 2.3 Engine `sscf_engine` (services/sscf_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_score_kpi` | kpi_id, value | Score a KPI value on a 0-100 scale based on direction and benchmark. Returns 0-100 where 100 = fully meets SPT target. |
| `_derive_risk_tier` | overall_score, cahra_flag, conflict_mineral_flag | Classify supplier into risk tier based on ESG score and red flags. |
| `_check_csddd_cascades` | kpi_data, kpi_selections | Return list of CSDDD adverse impact categories triggered by low KPI scores. |
| `_score_oecd_ddg` | kpi_data, supplier_profiles | Score OECD DDG 5 steps based on available KPI data. |
| `score_supplier_esg` | request | Score a single supplier across all provided KPI data. Returns per-KPI scores, group averages, risk tier and recommended margin. |
| `calculate_margin_ratchet` | base_rate_bps, spts_met, spts_total | Calculate SPT-linked margin ratchet for sustainability-linked SCF programme. Step-down schedule: - 100% SPTs met → -50 bps - 80-99% → -30 bps - 60-79% → -15 bps - 40-59% → -5 bps - 20-39% → 0 bps (no adjustment — grace period) - 0-19% → +10 bps (step-up penalty) - 0 SPTs met → +25 bps |
| `calculate_dynamic_discount` | buyer_wacc_pct, days_early, invoice_amount | Calculate early payment dynamic discount for a supplier invoice. Formula (GSCFF standard): annualised_rate = buyer_WACC × (days_early / 360) discount_amount = invoice_amount × annualised_rate floor = 0.5% annualised; cap = 8.0% annualised |
| `assess_sscf_programme` | request | Full SSCF programme assessment covering: - Framework eligibility check - KPI materiality scoring - OECD DDG 5-step compliance - CSDDD adverse impact cascade check - Scope 3 Cat1 coverage - Margin ratchet economics - Per-supplier ESG scoring - Overall programme score and eligible flag |
| `get_sscf_benchmarks` |  | Return framework profiles, KPI definitions and reference data. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `policies`, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ADVERSE_IMPACTS`, `CRITERIA_SCORES`, `MOCK_SUPPLIERS`, `PIE_COLORS`, `SPTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Avg Supplier ESG Score | — | ESG Assessments | Portfolio-weighted mean ESG score across all active SSCF suppliers. |
| Rate Benefit Distributed | — | Finance Ledger | Average spread reduction passed to suppliers with improving ESG scores. |
| Suppliers Enrolled | — | Programme Database | Total suppliers participating in the ESG-linked finance programme. |
- **Supplier ESG Assessments, Invoice Finance Flows** → Score banding + spread adjustment engine → **Rate schedules, ESG improvement reports, programme analytics**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sscf/ref/kpi-library** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['kpi_library', 'kpi_count', 'grouped_by_category', 'environmental_kpi_count', 'social_kpi_count', 'governance_kpi_count', 'verification_required_kpis', 'sbt_aligned_kpis'], 'n_keys': 8}`

**GET /api/v1/sscf/ref/oecd-ddg** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['oecd_ddg_5_steps', 'step_count', 'total_weight_pct', 'csddd_adverse_impact_categories', 'csddd_human_rights_categories', 'csddd_environmental_categories', 'cascade_applicable_categories', 'reference_standards'], 'n_keys': 8}`

**GET /api/v1/sscf/ref/sector-risk-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_risk_profiles', 'sector_count', 'sector_ids', 'risk_tier_distribution', 'eudr_exposed_sectors', 'cahra_exposed_sectors', 'conflict_mineral_sectors'], 'n_keys': 7}`

**GET /api/v1/sscf/ref/sscf-frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks', 'framework_count', 'framework_ids'], 'n_keys': 3}`

**POST /api/v1/sscf/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sscf/dynamic-discount** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sscf/margin-ratchet** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sscf/supplier-score** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** ESG-Linked Rate Adjustment
**Headline formula:** `Rate = BaseRate – (ΔESG × SpreadStep)`

For each ESG score improvement band the financing spread is reduced; deterioration triggers spread widening.

**Standards:** ['IFC SSCF Guidelines 2022', 'LMA Green Loan Principles']
**Reference documents:** IFC Sustainable Supply Chain Finance 2022; LMA Green & Sustainability-Linked Loan Principles; UNEP FI Supply Chain Finance Guidelines

**Engine `sscf_engine` — extracted transformation lines:**
```python
score = max(0.0, 100.0 - math.log1p(v) * 12)
step_score = sum(_score_kpi(k, kpi_data[k]) for k in available_kpis) / len(available_kpis)
overall_score = (env_score * 0.40 + soc_score * 0.35 + gov_score * 0.25)
achievement_pct = (spts_met / spts_total) * 100
adjustment_bps = max(adjustment_bps, -75)
adjustment_bps = min(adjustment_bps, +50)
new_rate_bps = base_rate_bps + adjustment_bps
annualised_rate = buyer_WACC × (days_early / 360)
buyer_wacc_decimal = buyer_wacc_pct / 100
annualised_discount_rate = capped_rate * (days_early / 360)
discount_amount = invoice_amount * annualised_discount_rate
settlement_amount = invoice_amount - discount_amount
weighted_score = sum(s * w for s, w in supplier_scores_for_kpi) / sum(w for _, w in supplier_scores_for_kpi)
simulated_spts_met = int((avg_programme_score / 100) * len(request.kpi_selections))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Consume the response instead of discarding it, and fix the failing routes (analytics ladder: rung 1 → 3)

**What.** Like `sovereign-swf`, this is a fire-and-forget disconnect: a real 1,560-line backend engine (`sscf_engine`) implements OECD DDG 5-step due-diligence scoring, CSDDD adverse-impact cascade detection, an SPT-linked margin-ratchet step schedule, and a GSCFF-standard dynamic-discounting formula — and the frontend **calls `POST /assess` but throws the response away** (`await axios.post(...)` with no assignment; the catch block only comments "API fallback to seed data"). Every number comes from `buildData()`, a hash-seeded client-side generator. The lineage sweep records `/assess`, `/dynamic-discount`, and `/margin-ratchet` as **failed**. And `MOCK_SUPPLIERS.risk` (Low/Medium/High) is never used to compute the ESG score, so a "High" risk supplier can draw a high synthetic score. Evolution A wires the response and fixes the routes.

**How.** (1) Triage the three failing POST routes. (2) Assign and render the `/assess`, `/supplier-score`, `/margin-ratchet`, and `/dynamic-discount` responses into component state, replacing `buildData()` — the backend's discrete margin-ratchet step function and log-curve KPI scoring are materially more defensible than the frontend's continuous linear approximations and already exist in production Python. (3) Wire `MOCK_SUPPLIERS.risk` into the supplier scoring so risk labels are consistent with ESG scores. (4) Surface the OECD DDG 5-step and CSDDD adverse-impact cascade the engine computes but the UI hides.

**Prerequisites.** The three route failures are the gate; the fix is wiring plus rendering, not a new model. **Acceptance:** the page's scores come from the engine responses, not `buildData()`; all three POST routes pass the sweep; a High-risk supplier can no longer show a top ESG score.

### 9.2 Evolution B — Supply-chain-finance structuring analyst (LLM tier 2)

**What.** A tool-calling analyst over the repaired engine: "score this supplier's ESG for a rate adjustment", "compute the margin ratchet for these SPTs", "run OECD due-diligence on this programme", "what's the dynamic discount at this ESG score?" — each a call to a real endpoint, narrating the margin-ratchet step schedule, the OECD DDG 5-step verdict, and the CSDDD adverse-impact flags, never inventing spreads.

**How.** Tool schemas from the module's OpenAPI operations (4 POST compute + 3 GET ref for frameworks, sector-risk, OECD-DDG); grounding corpus = this Atlas record plus the reference payloads. The due-diligence narrative cites the specific OECD DDG step and any CSDDD adverse impact; the no-fabrication validator checks every bps against tool output. IFC SSCF / LMA SLLP framework grounding.

**Prerequisites (hard).** Evolution A — the compute endpoints currently fail and the page discards responses, so there is no working surface to narrate. **Acceptance:** every rate/discount/score traces to an engine call; due-diligence findings cite the OECD DDG step; a supplier lacking KPI data returns "insufficient data to score," not a fabricated rate.