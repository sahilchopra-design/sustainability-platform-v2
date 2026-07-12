# Employee Wellbeing Analytics
**Module ID:** `employee-wellbeing` · **Route:** `/employee-wellbeing` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Aggregates and analyses workforce health, engagement, and mental wellbeing metrics to support S-pillar ESG disclosure and strategic people risk management. Integrates HR system data on absenteeism, turnover, employee assistance programme utilisation, and engagement survey scores. Aligns output with GRI 401/403, SASB Human Capital standards, and the emerging SEC human capital disclosure rules.

> **Business value:** Enables HR leaders and ESG teams to monitor workforce health risks, benchmark against sector peers, and produce audit-ready S-pillar disclosures that satisfy GRI 403, SASB HC, and investor human capital questionnaires.

**How an analyst works this module:**
- Connect HR data source or upload workforce metrics export for the reporting period.
- Configure Wellbeing Index weights to reflect organisational priorities and sector benchmarks.
- Drill into departmental or geographic breakdowns to identify workforce wellbeing hotspots.
- Generate GRI 403 and SASB HC disclosure tables and export for integrated report or ESG data room.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BAR_COLORS`, `Badge`, `Btn`, `ENGAGEMENT_TREND`, `EmployeeWellbeingPage`, `KpiCard`, `SECTOR_HC_BENCHMARKS`, `SECTOR_KEYS`, `Section`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ENGAGEMENT_TREND` | 8 | `score`, `benchmark` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `n => n == null ? '-' : typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n;` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `scoredHoldings` | `useMemo(() => { return portfolio.map(c => { const sector = c.gics_sector \|\| c.sector \|\| 'Financials';` |
| `employees` | `c.employees \|\| c.total_employees \|\| 5000 + (h % 80000);` |
| `weight` | `c.weight_pct \|\| c.portfolio_weight \|\| 2 + (h % 6);` |
| `sliderAdj` | `overrideSliders[c.isin \|\| c.company_name] != null ? overrideSliders[c.isin \|\| c.company_name] / 100 : 1;` |
| `turnover` | `clamp(+(bm.turnover_pct * (0.7 + (h % 60) / 100) * sliderAdj).toFixed(1), 3, 40);` |
| `safety` | `clamp(+(bm.safety_incident_rate * (0.5 + (h % 100) / 100) * sliderAdj).toFixed(2), 0, 8);` |
| `training` | `clamp(Math.round(bm.training_hrs_per_emp * (0.6 + (h % 80) / 100)), 5, 80);` |
| `engagement` | `clamp(Math.round(bm.engagement_score + (h % 20) - 10), 35, 95);` |
| `absenteeism` | `clamp(+(bm.absenteeism_pct * (0.6 + (h % 80) / 100)).toFixed(1), 1, 10);` |
| `female` | `clamp(Math.round(bm.female_workforce_pct + (h % 20) - 10), 5, 65);` |
| `temp` | `clamp(Math.round(bm.temp_worker_pct + (h % 15) - 7), 2, 50);` |
| `tenure` | `clamp(+(bm.avg_tenure_yr + (h % 6) - 3).toFixed(1), 1, 18);` |
| `unionized` | `clamp(Math.round(bm.unionized_pct + (h % 25) - 12), 0, 85);` |
| `fatality` | `clamp(+(bm.fatality_rate_per_100k * (0.3 + (h % 140) / 100)).toFixed(1), 0, 12);` |
| `totalW` | `scoredHoldings.reduce((s, h) => s + wt(h), 0);` |
| `wavg` | `(key) => (scoredHoldings.reduce((s, h) => s + h[key] * wt(h), 0) / totalW).toFixed(1);` |
| `avg` | `key => scoredHoldings.reduce((s, h) => s + h[key], 0) / scoredHoldings.length;` |
| `safetyBySector` | `useMemo(() => SECTOR_KEYS.map(s => ({` |
| `scatterData` | `useMemo(() => scoredHoldings.map(h => ({` |
| `workforceComp` | `useMemo(() => SECTOR_KEYS.map(s => ({` |
| `trainingData` | `useMemo(() => { const portAvg = scoredHoldings.length > 0 ? Math.round(scoredHoldings.reduce((s, h) => s + h.training, 0) / scoredHoldings.length) : 0;` |
| `flaggedHoldings` | `useMemo(() => scoredHoldings.filter(h => h.flags.length > 0).sort((a, b) => b.flags.length - a.flags.length), [scoredHoldings]);` |
| `rows` | `sortedHoldings.map(h => [h.company_name, h.isin, h.sector, h.employees, h.turnover, h.safety, h.training, h.engagement, h.female, h.temp, h.tenure, h.unionized, h.fatality, h.absenteeism, h.flags.join('; '), h.weight]);` |
| `csv` | `[headers, ...rows].map(r => r.join(',')).join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `clampedWB` | `Math.max(10, Math.min(95, wellbeing));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BAR_COLORS`, `ENGAGEMENT_TREND`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Absenteeism Rate (%) | — | HR System / CIPD | Unplanned absence days as % of scheduled working days; WHO-linked productivity loss above 3.5%. |
| Engagement Score (%) | — | Engagement Survey | Favourable response rate to core engagement questions; Gallup global median 23% engaged. |
| EAP Utilisation Rate (%) | — | EAP Provider Data | Proportion of employees accessing mental health support; below 3% may indicate stigma or awareness gap. |
| Voluntary Turnover Rate (%) | — | HRIS | Annualised voluntary leavers as % of average headcount; elevated rates signal retention and culture risk. |
- **HRIS export (headcount, absence, turnover)** → Aggregate to monthly cohorts; normalise by FTE and region → **Absenteeism and turnover KPIs by business unit**
- **Engagement survey platform API** → Extract question-level scores; compute favourable response rate → **Engagement score with trend vs. prior period**
- **EAP provider utilisation report** → Normalise by total eligible employees; segment by service type → **EAP utilisation rate and presenting issue breakdown**

## 5 · Intermediate Transformation Logic
**Methodology:** Wellbeing Index
**Headline formula:** `WBI = w₁×Engagement + w₂×(1−AbsenteeismRate) + w₃×(1−TurnoverRate) + w₄×MHUtilisation`

Composite index weighting four normalised sub-dimensions, each scored 0â€“100. Default weights (0.35/0.25/0.25/0.15) can be adjusted by users. Absenteeism and turnover are inverse-scored so that higher values represent better outcomes. Mental health utilisation is scored relative to benchmark EAP participation rate.

**Standards:** ['GRI 403:2018', 'ISO 45003:2021', 'SASB HC-100']
**Reference documents:** GRI 403:2018 â€” Occupational Health and Safety; ISO 45003:2021 â€” Psychological Health and Safety at Work; SASB Human Capital Bulletin 2023; WHO Mental Health at Work Policy Brief 2022; Gallup State of the Global Workplace 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide defines the Wellbeing Index as
> `WBI = 0.35·Engagement + 0.25·(1−Absenteeism) + 0.25·(1−Turnover) + 0.15·MH-Utilisation`.
> **The code uses different dimensions and weights.** The implemented composite is
> `0.30·Engagement + 0.15·(100−12·Absenteeism) + 0.20·(100−15·Safety) + 0.15·min(100,10·Tenure) +
> 0.20·min(100,2·Training)`. It drops **turnover** and **mental-health/EAP utilisation** entirely
> (there is no EAP data field anywhere in the module) and adds **safety, tenure, training** instead.
> The guide's GRI 403 / ISO 45003 framing is directionally right, but the specific formula and the
> "MH utilisation" input it advertises are not in the code. Documented below as written.

### 7.1 What the module computes

The module takes the user's portfolio (from `localStorage['ra_portfolio_v1']`, falling back to the
first 25 of `GLOBAL_COMPANY_MASTER`) and synthesises 10 human-capital metrics per holding by
**perturbing a sector benchmark with a deterministic company hash**:

```js
h = hash(isin || company_name)          // signed-int string hash, |·|
bm = SECTOR_HC_BENCHMARKS[sector]        // 11 sectors × 10 metrics
turnover    = clamp(bm.turnover_pct   × (0.7 + (h%60)/100) × sliderAdj, 3, 40)
safety      = clamp(bm.safety_incident_rate × (0.5 + (h%100)/100) × sliderAdj, 0, 8)
training    = clamp(round(bm.training_hrs × (0.6 + (h%80)/100)), 5, 80)
engagement  = clamp(round(bm.engagement_score + (h%20) − 10), 35, 95)
absenteeism = clamp(bm.absenteeism_pct × (0.6 + (h%80)/100), 1, 10)
female,temp,tenure,unionized,fatality  // analogous hash-perturbations
```

The **Wellbeing Index Composite** (§7 headline metric):
```js
wellbeing = 0.30·engagement
          + 0.15·(100 − 12·absenteeism)
          + 0.20·(100 − 15·safety)
          + 0.15·min(100, 10·tenure)
          + 0.20·min(100, 2·training)
clampedWB = clamp(wellbeing, 10, 95)
```

### 7.2 Parameterisation / scoring rubric

The **sector benchmarks are hand-authored and realistic** (the one genuine external-knowledge input):

| Sector | Turnover% | Safety rate | Training h | Engagement | Fatality/100k | Union% |
|---|---|---|---|---|---|---|
| Energy | 12 | 1.8 | 35 | 68 | 4.5 | 45 |
| Materials | 14 | 2.5 | 28 | 62 | 6.8 | 55 |
| Health Care | 19 | 1.0 | 42 | 71 | 0.5 | 20 |
| Financials | 18 | 0.2 | 40 | 70 | 0.1 | 15 |
| Information Technology | 22 | 0.3 | 45 | 72 | 0.2 | 5 |
| Utilities | 10 | 1.6 | 38 | 67 | 3.8 | 60 |

(11 sectors total; values track SASB/GRI human-capital norms — e.g. IT high turnover/low fatality,
Materials high fatality/high unionisation.)

| WBI component | Weight | Transform | Basis |
|---|---|---|---|
| Engagement | 0.30 | direct (0–100) | higher = better |
| Absenteeism | 0.15 | `100 − 12·abs` | inverse-scored |
| Safety | 0.20 | `100 − 15·rate` | inverse-scored |
| Tenure | 0.15 | `min(100, 10·yr)` | 10 yr ⇒ 100 |
| Training | 0.20 | `min(100, 2·hrs)` | 50 h ⇒ 100 |

Risk flags: turnover > 25 → *High Turnover*; safety > 3.0 → *Safety Risk*; engagement < 55 → *Low
Engagement*; female < 15 → *Low Diversity*; fatality > 5 → *Fatality Concern*.

### 7.3 Calculation walkthrough

Portfolio load → per holding, resolve GICS sector → look up 10-metric benchmark → hash the ISIN and
perturb each metric within a clamp band (optionally scaled by a saved user slider `sliderAdj = pct/100`)
→ derive risk flags → compute the 5-input WBI → aggregate portfolio-weighted averages `wavg(key) =
Σ metric·weight / Σ weight`.

### 7.4 Worked example

Take a **Financials** holding whose ISIN hashes to `h = 137`. Benchmark: engagement 70, absenteeism
3.5, safety 0.2, tenure 5.0, training 40; slider = default (adj = 1).

| Metric | Computation | Value |
|---|---|---|
| engagement | clamp(round(70 + (137%20) − 10), 35, 95) = round(70 + 17 − 10) | **77** |
| absenteeism | clamp(3.5 × (0.6 + (137%80)/100), 1, 10) = 3.5 × (0.6 + 0.57) | **4.1** |
| safety | clamp(0.2 × (0.5 + (137%100)/100), 0, 8) = 0.2 × (0.5 + 0.37) | **0.17** |
| tenure | clamp(5.0 + (137%6) − 3, 1, 18) = 5.0 + 5 − 3 | **7.0** |
| training | clamp(round(40 × (0.6 + (137%80)/100)), 5, 80) = round(40 × 1.17) | **47** |

WBI:
```
0.30·77 = 23.1
0.15·(100 − 12·4.1) = 0.15·50.8 = 7.6
0.20·(100 − 15·0.17) = 0.20·97.5 = 19.5
0.15·min(100, 10·7.0) = 0.15·70 = 10.5
0.20·min(100, 2·47) = 0.20·94 = 18.8
Σ = 79.5 → clampedWB = 80  (green, ≥65)
```

### 7.5 Companion analytics

- **Portfolio-weighted KPIs** (`wavg`) for all 10 metrics; portfolio weight = holding weight or a
  hash-derived `2 + (h%6)` default.
- **Safety-by-sector**, **workforce composition**, **training vs portfolio-average**, **scatter**
  (engagement vs turnover, bubble = employees).
- **Flagged holdings** table sorted by flag count; CSV export of all 16 columns.
- **Engagement trend** — a static 7-point series (2019–2025) vs benchmark; explicitly labelled
  "simulated portfolio-weighted".

### 7.6 Data provenance & limitations

- **Sector benchmarks are real hand-authored HC norms**; **every company-level metric is synthetic**,
  produced by a deterministic string hash `hash(isin)` rather than the platform's `sr()` PRNG — stable
  per company but not actual disclosed data.
- No EAP/mental-health-utilisation field exists, so the guide's `MH-Utilisation` WBI term cannot be
  and is not computed; turnover is also excluded from the WBI despite the guide.
- The `sliderAdj` override lets users nudge turnover/safety per holding; it is persisted to
  `localStorage`, not a data source.

**Framework alignment:** **GRI 403 (2018)** — the safety-incident-rate, fatality-rate and
absenteeism fields map to GRI 403 OHS disclosures (403-9/403-10 injury and fatality metrics);
**ISO 45003 (2021)** — the psychological-health framing motivates the engagement/absenteeism inputs,
though ISO 45003's psychosocial-hazard controls are not modelled; **SASB HC-100** — the human-capital
metric set (turnover, training hours, diversity) mirrors SASB's human-capital dimensions. The WBI
itself is a bespoke platform composite, not a standardised index.

## 9 · Future Evolution

### 9.1 Evolution A — One WBI formula, real workforce data behind it (analytics ladder: rung 1 → 2)

**What.** The §7 flag documents a formula fork: the guide's `WBI = 0.35·Engagement + 0.25·(1−Absenteeism) + 0.25·(1−Turnover) + 0.15·MH-Utilisation` vs the code's `0.30·Engagement + 0.15·absenteeism-term + 0.20·safety-term + 0.15·tenure + 0.20·training` — turnover and EAP utilisation (the advertised mental-health input) don't exist in the module at all. Meanwhile per-company metrics are hash-perturbed sector benchmarks (`turnover = bm.turnover_pct × (0.7 + h%60/100)`), i.e. synthetic variations around the real `SECTOR_HC_BENCHMARKS` table. Evolution A resolves the fork and builds the data path.

**How.** (1) Decide the index: adopt the guide's four-dimension WBI (it matches the ISO 45003/GRI 403 framing better), add the missing `turnover` and `eap_utilisation` fields, and update the Atlas §5 if dimensions change — one formula, documented, with user-adjustable weights persisted per org. (2) Backend vertical: `wellbeing_metrics` table (org × period × metric), CSV/HRIS upload per the stated workflow, and a `services/wellbeing_engine.py` computing WBI and the GRI 403/SASB HC disclosure tables from stored data. (3) Benchmarks stay — but as *benchmarks*: portfolio companies without reported data show sector benchmark with a "benchmark, not reported" badge instead of hash-noise disguised as company data. (4) Rung 2: weight-sensitivity view (how rankings shift as weights move) over real records.

**Prerequisites.** RBAC on workforce data (same sensitivity class as the DEI module's payroll microdata); benchmark table sourced and dated (Gallup/CIPD figures cited in §4 need as-of dates). **Acceptance:** WBI for a fixture company reproduces the documented formula by hand; reported vs benchmark provenance visible per cell; zero hash-perturbation in company-attributed figures.

### 9.2 Evolution B — S-pillar disclosure drafter with strict provenance (LLM tier 2)

**What.** The workflow ends at "generate GRI 403 and SASB HC disclosure tables" — a drafting task with a hard correctness bar. A tool-calling assistant pulls Evolution A's stored metrics, maps them to the specific GRI 403 disclosures (403-9 injury rates, 403-10 ill health) and SASB HC metrics, drafts the narrative sections around the tables, and flags every disclosure the org lacks data for as an explicit gap with the collection step needed — turning the module into the "audit-ready S-pillar" tool the overview claims.

**How.** Tools: `get_metrics(org, period)`, `compute_wbi(org, weights)`, `get_benchmark(sector)`, plus GRI/SASB catalog lookups from the refdata layer (the ESRS/GRI catalogs are already in the DB). The prompt enforces the reported-vs-benchmark distinction from Evolution A: benchmark values may contextualize but never populate a disclosure cell. The validator checks each table figure against tool output; the fatality-rate and injury-rate fields get an extra consistency check (per-100k vs per-200k-hours units are a classic drafting error).

**Prerequisites (hard).** Evolution A — drafting GRI 403 tables from the current hash-perturbed pseudo-data would fabricate injury statistics attributed to real portfolio names. **Acceptance:** every numeric in a golden org's draft matches a stored metric; missing EAP data yields a gap note, not a Gallup-median stand-in; unit labels validated against the metric definitions.