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
