# Controversy Rating Impact
**Module ID:** `controversy-rating-impact` · **Route:** `/controversy-rating-impact` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies the effect of ESG controversy events on third-party ESG rating movements, modelling rating agency response lags, severity thresholds for downgrade triggers, and the portfolio-level rating drift attributable to controversies. Supports prediction of future rating changes and proactive engagement planning.

> **Business value:** Enables portfolio managers to anticipate ESG rating changes triggered by controversy events, prepare stewardship responses ahead of agency reviews, and manage index inclusion risk for ESG-constrained mandates.

**How an analyst works this module:**
- Select company and controversy event to model rating impact
- Rating Agency Response tab shows predicted score change and confidence interval per agency
- Portfolio Impact tab aggregates expected rating drift across all holdings with active controversies
- Sector Materiality Overlay adjusts predictions based on SASB topic relevance
- Timeline View shows predicted score trajectory under different remediation speed assumptions
- Export impact assessment for stewardship team and investment committee briefings

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_EVENTS`, `Btn`, `COMPANIES`, `CONTROVERSY_DATA`, `ControversyFeed`, `CustomTooltip`, `GEOS`, `ImpactPropagation`, `PILLARS`, `PROVIDERS`, `Pill`, `PredictiveEngine`, `REAL_EVENTS`, `RecoveryAnalytics`, `SECTORS`, `SEV_COLORS`, `SevBadge`, `StatCard`, `TYPES`, `TYPE_COLORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REAL_EVENTS` | 31 | `id`, `company`, `event`, `type`, `sector`, `severity`, `subLevel`, `date`, `geo`, `pillar` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `GEOS` | `['North America','Europe','Asia-Pacific','Latin America','Middle East & Africa','Global'];` |
| `company` | `COMPANIES[Math.floor(s*COMPANIES.length)%COMPANIES.length];` |
| `type` | `TYPES[Math.floor(s2*TYPES.length)%TYPES.length];` |
| `sector` | `SECTORS[Math.floor(s3*SECTORS.length)%SECTORS.length];` |
| `sev` | `Math.min(5,Math.max(1,Math.floor(s4*5)+1));` |
| `subLevel` | `Math.floor(s5*10)/10;` |
| `geo` | `GEOS[Math.floor(sr(i*37+2)*GEOS.length)%GEOS.length];` |
| `year` | `2015+Math.floor(sr(i*41+9)*10);` |
| `month` | `Math.min(12,Math.max(1,Math.floor(sr(i*43+13)*12)+1));` |
| `day` | `Math.min(28,Math.max(1,Math.floor(sr(i*47+19)*28)+1));` |
| `pillar` | `PILLARS[Math.floor(sr(i*53+23)*3)%3];` |
| `desc` | `descriptions[Math.floor(sr(i*59+29)*descriptions.length)%descriptions.length];` |
| `ratings` | `PROVIDERS.map((p,pi)=>{` |
| `base` | `50+Math.floor(sr(i*61+pi*7)*40);` |
| `qSeed` | `sr(i*67+pi*11+q*3);` |
| `preRatings` | `PROVIDERS.map((p,pi)=>50+Math.floor(sr(i*71+pi*13)*40));` |
| `detectQ` | `PROVIDERS.map((p,pi)=>Math.max(0,Math.floor(sr(i*73+pi*17)*4)));` |
| `recoverQ` | `PROVIDERS.map((p,pi)=>Math.max(1,Math.floor(sr(i*79+pi*19)*12)));` |
| `pageEvents` | `filtered.slice(page*PER_PAGE,(page+1)*PER_PAGE);` |
| `totalPages` | `Math.ceil(filtered.length/PER_PAGE);` |
| `avgSev` | `filtered.length?(filtered.reduce((a,e)=>a+e.severity,0)/filtered.length).toFixed(1):0;` |
| `sectorCounts` | `{};filtered.forEach(e=>{sectorCounts[e.sector]=(sectorCounts[e.sector]\|\|0)+1;});` |
| `topSector` | `Object.entries(sectorCounts).sort((a,b)=>b[1]-a[1])[0];` |
| `fastestProvider` | `PROVIDERS.reduce((best,p,pi)=>{` |
| `avgDetect` | `filtered.reduce((a,e)=>a+e.detectQ[pi],0)/(filtered.length\|\|1);` |
| `toggleInvestigated` | `(id)=>{setEvents(prev=>prev.map(e=>e.id===id?{...e,investigated:!e.investigated}:e));};` |
| `setNotes` | `(id,notes)=>{setEvents(prev=>prev.map(e=>e.id===id?{...e,notes}:e));};` |
| `waterfallData` | `useMemo(()=>{ const stages=['Pre','Event','+1Q','+2Q','+3Q','+6Q','Current'];` |
| `radarData` | `useMemo(()=>{ return PILLARS.map(pillar=>{ const row={pillar};` |
| `relevance` | `ev.pillar===pillar?ev.preRatings[pi]-ev.ratings[pi][3]:Math.floor(sr(ev.id*97+pi*7)*5);` |
| `scatterData` | `useMemo(()=>{ return events.map(e=>{ const avgImpact=PROVIDERS.reduce((sum,_,pi)=>sum+(e.preRatings[pi]-e.ratings[pi][3]),0)/PROVIDERS.length;` |
| `betaData` | `useMemo(()=>{ return PROVIDERS.map((p,pi)=>{ const points=events.map(e=>({x:e.severity,y:e.preRatings[pi]-e.ratings[pi][3]}));` |
| `sumXY` | `points.reduce((a,pt)=>a+pt.x*pt.y,0);const sumX2=points.reduce((a,pt)=>a+pt.x*pt.x,0);` |
| `beta` | `(n*sumXY-sumX*sumY)/(n*sumX2-sumX*sumX\|\|1);` |
| `residuals` | `points.map(pt=>pt.y-(beta*pt.x));` |
| `stdErr` | `Math.sqrt(residuals.reduce((a,r)=>a+r*r,0)/(n-2\|\|1))/Math.sqrt(sumX2-sumX*sumX/n\|\|1);` |
| `filtered` | `useMemo(()=>sevFilter===0?events:events.filter(e=>e.severity===sevFilter),[events,sevFilter]);  const recoveryCurveData=useMemo(()=>{ return Array.from({length:12},(_,q)=>{ const row={quarter:`Q${q+1}`};` |
| `vals` | `filtered.map(e=>e.ratings[pi][q]-e.ratings[pi][0]);` |
| `mean` | `vals.length?vals.reduce((a,v)=>a+v,0)/vals.length:0;` |
| `std` | `vals.length>1?Math.sqrt(vals.reduce((a,v)=>a+(v-mean)**2,0)/(vals.length-1)):0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANIES`, `GEOS`, `PILLARS`, `PROVIDERS`, `PROV_COLORS`, `REAL_EVENTS`, `SECTORS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Rating Downgrade Probability (Sev.4) | — | Model calibration | Probability of at least one ESG rating notch downgrade within 12 months of severity-4 controversy |
| Agency Response Lag | — | Historical analysis | Typical delay between controversy onset and ESG rating agency score adjustment |
| Portfolio Rating Drift | — | Aggregated model output | Expected ESG rating drift across portfolio holdings due to active controversies |
| Downgrade Severity Threshold | — | Regression calibration | Controversy severity score above which downgrade probability exceeds 80% |
| Score Recovery Time | — | Historical tracking | Typical time for ESG rating to recover to pre-controversy level following resolution |
- **RepRisk/MSCI controversy severity history** → Match controversy events to rating change dates, compute lags → **Controversy-to-rating-change event dataset**
- **MSCI/Sustainalytics/S&P rating time series** → Regress rating changes on severity, persistence, sector materiality → **Calibrated β coefficients per agency**
- **Portfolio holdings and rating data** → Apply model per holding, aggregate portfolio drift → **Portfolio-level expected rating drift**

## 5 · Intermediate Transformation Logic
**Methodology:** Controversy-Driven Rating Drift Model
**Headline formula:** `Rating_change = α + β₁×Severity + β₂×Persistence + β₃×Sector_materiality + ε`

OLS regression calibrated on 5,000+ company-controversy-rating events (2015–2024). Response lag modelled as agency-specific: MSCI typical lag 3–6 months, Sustainalytics 2–4 months, S&P CSA 0–2 months (annual update cycle). Severity threshold for downgrade: Severity ≥4 with sector materiality >0.6 triggers >80% probability of at least one notch downgrade within 12 months.

**Standards:** ['MSCI ESG Ratings Methodology', 'Sustainalytics Controversy Research', 'S&P ESG Scores']
**Reference documents:** MSCI ESG Ratings Methodology 2024; Sustainalytics ESG Risk Ratings Methodology; S&P Global ESG Scores Methodology 2024; Dimson, Karakas & Li (2015) Active Ownership

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial-mismatch flag.** The guide describes a **Controversy-Driven Rating Drift Model**:
> an OLS regression `Rating_change = α + β₁·Severity + β₂·Persistence + β₃·Sector_materiality + ε`
> calibrated on *5,000+ real company-controversy-rating events (2015–2024)*, with agency-specific response
> lags (MSCI 3–6 mo, Sustainalytics 2–4 mo, S&P CSA 0–2 mo). **The code does fit an OLS β — but on
> synthetically generated rating trajectories, not observed data.** The 12-quarter rating paths per
> provider are *manufactured* by a fixed impact-decay formula seeded from the platform PRNG, and the β the
> page reports is then a least-squares fit *to that manufactured relationship*. So the regression is real
> code but circular: it recovers the decay function that generated the data. The 30 anchor events (BP
> Deepwater Horizon, VW Dieselgate, Boeing 737 MAX…) are real incidents with real severity, but their
> rating drops are simulated. Sections below document the mechanics; §8 specifies the empirical model.

### 7.1 What the module computes

Each of 90 events carries, per rating provider (6), a synthetic 12-quarter rating trajectory generated by
a severity-scaled, quarter-dependent impact:

```js
base = 50 + floor( sr(i·61+pi·7)·40 )                    // pre-event rating 50–90
impact(q) = q<3 ? −sev·(2 + qSeed·3)                      // acute drop, Q0–2
          : q<6 ? −sev·(1 + qSeed·2)·(1 − q/12)           // partial recovery, Q3–5
          :       −sev·qSeed·(1 − q/10)                    // tail recovery, Q6–11
rating(q) = clamp( round(base + impact(q)) , 0 , 100 )
```

From these paths the page derives an **OLS β of rating drop vs. severity** per provider:
```js
beta   = (n·Σxy − Σx·Σy) / (n·Σx² − (Σx)²)               // x = severity, y = preRating − rating[3]
stdErr = sqrt( Σresidual² / (n−2) ) / sqrt( Σx² − (Σx)²/n )
```
plus a recovery curve (mean rating change per quarter) and a waterfall of the average trajectory.

### 7.2 Parameterisation / scoring rubric

| Quantity | Formula | Provenance |
|---|---|---|
| `severity` (real events) | curated 1–5 | Real incidents (BP=5, Boeing=5, DWS=3…) |
| `severity` (events 30–89) | `min(5,max(1,floor(sr·5)+1))` | Synthetic seeded PRNG |
| `base` rating | `50 + floor(sr·40)` (real: 55 + sr·35) | Synthetic seeded PRNG |
| impact decay | 3-phase formula above | Hard-coded synthetic generator |
| `detectQ` | `floor(sr·4)` quarters | Synthetic "agency detection lag" |
| `recoverQ` | `max(1, floor(sr·12))` | Synthetic "recovery time" |
| `beta`, `stdErr` | OLS on synthetic (x=sev, y=drop) | **Regression on manufactured data** |

The impact-decay coefficients (2+qSeed·3 acute, 1+qSeed·2 partial, etc.) are the *de facto* model — the β
regression simply re-estimates the severity slope those coefficients baked in.

### 7.3 Calculation walkthrough

1. `REAL_EVENTS` (30 curated) + `CONTROVERSY_DATA[30..89]` (60 seeded) → `ALL_EVENTS`.
2. For every event × provider, the impact-decay generator fills a 12-quarter rating path plus `preRatings`.
3. `betaData` runs OLS of `(preRating − rating[Q3])` on `severity` across events, per provider → slope +
   standard error. `waterfallData` and `recoveryCurveData` average the trajectories across events.
4. `scatterData` plots severity vs. average impact; the fastest-detecting provider is `min(mean detectQ)`.

### 7.4 Worked example

Take VW Dieselgate (event 1, severity 5). For provider MSCI (pi=0): `base = 55 + floor(sr(1·61+0)·35)`.
`sr(61) = frac(sin(62)·10⁴)`; `sin(62 rad) = −0.7395`, ×10⁴ = −7394.7, frac ≈ 0.304, so
`base = 55 + floor(0.304·35) = 55 + 10 = 65`. At Q0: `impact = −5·(2.5 + qSeed·3.5)`; if `qSeed ≈ 0.4`,
`impact = −5·(2.5+1.4) = −19.5`, so `rating[0] = clamp(round(65 − 19.5)) = 45` — a 20-point ESG-score
drop. By Q11 the tail-recovery term shrinks the impact toward ~0, so the score climbs back toward 65. The
β regression across all 90 events recovers roughly the acute-phase slope (≈ −2.5 to −4 points per severity
unit) that the generator imposed — a **self-fulfilling** estimate.

### 7.5 Companion analytics on the page

Event browser (filter by severity, paginate), rating-agency response table (detect/recover quarters),
per-provider OLS β with standard error, severity-vs-impact scatter, quarterly recovery curve, and an
average-trajectory waterfall (Pre → Event → +1Q…+6Q → Current). Investigate/notes flags persist per event.
No backend engine or route — all client-side.

### 7.6 Data provenance & limitations

- **Rating trajectories are 100% synthetic**, from `sr(seed)=frac(sin(seed+1)×10⁴)`; only the 30 anchor
  events' identities/severities are real. The provider rating movements were never observed.
- **The OLS β is circular** — it fits synthetic data generated by a known severity-scaled decay, so its
  β and R² reflect the generator, not any market relationship. This is the module's central limitation.
- Detection lags, recovery times, and pre-ratings are all seeded; no real agency methodology is applied.

**Framework alignment:** The provider list is real — *MSCI ESG Ratings* (AAA–CCC key-issue model),
*Sustainalytics ESG Risk Ratings* (unmanaged-risk 0–40+), *S&P Global CSA/ESG Scores* (annual
questionnaire → DJSI), *ISS ESG*, *CDP*, *Refinitiv*. The stated regression form (`α + β₁Sev + β₂Persist +
β₃Materiality`) is a sound OLS specification and mirrors *Dimson, Karakaş & Li (2015)* active-ownership
event studies — but the calibration data must be real for the β to be meaningful (see §8).

---

## 8 · Model Specification — Empirical Controversy→Rating Drift Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Predict the direction, magnitude, and timing of ESG-rating changes following a controversy, per agency, so
PMs managing ESG-constrained mandates can anticipate index-inclusion risk and pre-empt downgrades. Coverage:
issuers rated by ≥1 major ESG agency with a controversy history.

### 8.2 Conceptual approach
Estimate an **event-study panel regression** of *observed* agency rating changes on controversy features,
with agency fixed effects and a hazard model for timing. This is the standard academic approach (Dimson-
Karakaş-Li; MSCI/Sustainalytics methodology notes) and the guide's own specification — the fix is to
calibrate on *real* MSCI/Sustainalytics/S&P rating time series rather than synthetic paths.

### 8.3 Mathematical specification
```
ΔRating_{i,a} = α_a + β1·Severity_i + β2·Persistence_i + β3·Materiality_{i,sector} + β4·Pillar_i + ε
Persistence_i = Σ_m 0.5^{m/H} · Coverage_{i,m}                      (media-coverage decay)
Timing (hazard):  h_a(t) = h0_a(t) · exp(γ1·Severity + γ2·AgencyCycle_a)
P(downgrade ≥1 notch within 12m) = 1 − exp(−∫_0^12 h_a(t)dt)
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Agency intercept/lag | `α_a`, cycle | MSCI (3–6mo), Sustainalytics (2–4mo), S&P CSA (annual) |
| Severity slope | `β1` | Event-study panel on real rating changes |
| Materiality | `β3` | SASB material-topic flag × sector |
| Persistence half-life | `H` | RepRisk media-coverage decay (~6mo) |
| Downgrade hazard | `γ` | Cox model on observed downgrades |

### 8.4 Data requirements
Panel of controversy events (RepRisk/MSCI: date, severity, type, sector) joined to *observed* agency rating
histories (MSCI, Sustainalytics, S&P — licensed). SASB materiality map (free). The platform holds the
event schema (severity, type, sector, pillar, date) and provider list; the missing asset is the licensed
rating time series to replace the synthetic trajectories.

### 8.5 Validation & benchmarking plan
Out-of-sample: train pre-2022, test post-2022 — check predicted vs. realised rating changes (sign accuracy,
RMSE in notches) and downgrade-probability calibration (reliability curve). Benchmark timing against
published agency lags. Reconcile portfolio drift against realised index reconstitutions.

### 8.6 Limitations & model risk
Agency methodologies change over the sample (regime breaks) — include time fixed effects. Ratings are
sticky and censored (bounded 0–100), so use a Tobit/ordered specification. Survivorship and coverage bias
in event feeds must be corrected. Conservative fallback: report agency-specific ranges keyed to severity
tier (the guide's 65–85% downgrade band for Sev-4) rather than a single point when β confidence is low.

## 9 · Future Evolution

### 9.1 Evolution A — Break the circle: calibrate the drift model on observed rating history (analytics ladder: rung 1 → 4)

**What.** §7 documents the module's central defect precisely: the OLS regression code
is real, but it fits *manufactured* data — 12-quarter rating trajectories generated by
a hard-coded severity-scaled decay seeded from the PRNG — so the reported β and R²
merely recover the generator ("the regression is real code but circular"). Only the 30
anchor events' identities and severities are real; their rating drops were never
observed. Evolution A makes the regression mean something: calibrate
`Rating_change = α + β₁·Severity + β₂·Persistence + β₃·Sector_materiality + ε` on
actual rating movements, then use it for the prediction the module's name promises.

**How.** (1) Data: build a `rating_history` table from obtainable sources —
Sustainalytics/MSCI scores are licensed, but S&P Global ESG scores and Refinitiv have
public/lookup tiers, and the 80-company real dataset in `company-profiles` already
carries vendor ratings that can be snapshotted quarterly going forward; retrospective
depth grows with time. (2) Join the 30 real anchor events (plus new events from
`controversy-monitor`'s ingest) to rating paths; estimate the regression with honest
N, standard errors, and agency-specific detection lags measured rather than seeded.
(3) Delete the synthetic trajectory generator and the 60 padding events (30–89) —
small-N-real beats large-N-fabricated. (4) Prediction (rung 4): downgrade probability
within 12 months per the guide's threshold logic, with out-of-time validation as
events accumulate.

**Prerequisites (hard).** Rating-history licensing review; the synthetic generator
purge; patience — the model card must state the calibration N and refuse
sector-level splits until data supports them. **Acceptance:** β carries a real
standard error from observed data; a backtest page shows predicted vs realized
rating changes; zero `sr()` calls remain in any trajectory.

### 9.2 Evolution B — Pre-review stewardship planner (LLM tier 1)

**What.** The module's stated purpose is anticipatory: prepare stewardship responses
*before* agency reviews. Evolution B drafts the pre-review engagement plan for a
holding with an active controversy: which agencies are likely to move and when (from
the measured detection lags), what drives the predicted magnitude (severity, sector
materiality — the model's own coefficients, explained), what remediation evidence
would most change the trajectory, and the index-inclusion risk for ESG-constrained
mandates. Grounded in the (post-Evolution A) model outputs and the real event record.

**How.** Tier-1 RAG over this Atlas record, the agency-methodology references §5
cites (MSCI key-issue model, Sustainalytics unmanaged-risk structure), and the
model's prediction payload passed as context. The honesty constraint is severe here:
until Evolution A lands, the copilot must not quote the circular β or any synthetic
trajectory — the current numbers describe the generator, not the market, and §7.6
says so. Tier 2 arrives when predictions are served from a backend: "re-run assuming
remediation completes in Q2" becomes a tool call.

**Prerequisites (hard).** Evolution A — this is the slice's clearest case where the
LLM layer is blocked by data integrity, not engineering; agency methodology texts in
the corpus. **Acceptance:** plans quote only observed-data model outputs with their
confidence intervals; agencies without measured lags get "insufficient history"
rather than the guide's asserted 3–6 month figures; every event referenced exists in
the store.