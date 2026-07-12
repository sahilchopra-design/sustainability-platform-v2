# Materiality Trends
**Module ID:** `materiality-trends` · **Route:** `/materiality-trends` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses the historical evolution of ESG topic materiality by sector using longitudinal data from SASB standards revisions, investor engagement priorities, regulatory activity, and academic ESG materiality research. Identifies topics experiencing rapid materiality growth (emerging), declining relevance (fading), or structural shifts driven by regulatory catalysts. Informs dynamic materiality assessment and strategic ESG topic prioritisation.

> **Business value:** Equips ESG strategists and investor relations teams with a quantitative materiality trend database that anticipates where investor and regulatory attention is heading, enabling proactive disclosure investment and strategic ESG priority alignment.

**How an analyst works this module:**
- Select sector and geographic scope to filter the materiality trend database to comparable peer universe
- Review MTI time series chart for topics of interest to identify inflection points and trend reversals
- Rank topics by trend velocity to surface rapidly emerging materiality concerns ahead of mainstream adoption
- Cross-reference regulatory catalyst event overlay with MTI spikes to understand materiality drivers
- Export trend analysis to support dynamic materiality assessment documentation and investor communications

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_DRIVERS`, `Badge`, `Btn`, `CHART_COLORS`, `CustomTooltip`, `ESRS_TOPICS`, `KpiCard`, `LS_PORT`, `LS_PREFS`, `SECTOR_SENSITIVITY`, `STRENGTH_COLOR`, `STRENGTH_LABEL`, `STRENGTH_MAP`, `Section`, `SortHeader`, `TREND_COLOR_MAP`, `TREND_DRIVERS`, `TREND_ICON`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ESRS_TOPICS` | 11 | `label`, `category`, `baseScore` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `multiplied` | `d.category === 'regulatory' ? base * regMultiplier : base;` |
| `direction` | `d.trend === 'increasing' ? 1 : -1;` |
| `holdings` | `useMemo(() => { return portfolio.map(h => { const match = GLOBAL_COMPANY_MASTER.find(c => c.isin === h.isin \|\| c.ticker === h.ticker \|\| c.company_name === h.company_name);` |
| `topicForecasts` | `useMemo(() => { return ESRS_TOPICS.map(t => { const y2025 = t.baseScore;` |
| `delta2035` | `y2035 - y2025;` |
| `keyDrivers` | `ALL_DRIVERS.filter(d => d.impact_topics.includes(t.id)).sort((a, b) => STRENGTH_MAP[b.strength] - STRENGTH_MAP[a.strength]).slice(0, 3);` |
| `avgStrength` | `(ALL_DRIVERS.reduce((s, d) => s + STRENGTH_MAP[d.strength], 0) / ALL_DRIVERS.length).toFixed(1);` |
| `mostDynamic` | `[...topicForecasts].sort((a, b) => Math.abs(b.delta2035) - Math.abs(a.delta2035))[0];` |
| `heatmapData` | `useMemo(() => { return ALL_DRIVERS.map(d => { const row = { driver: d.id, driverLabel: d.driver.substring(0, 40), category: d.category };` |
| `adjusted` | `Math.min(100, t.baseScore * mult);` |
| `base` | `Math.min(100, t.baseScore * mult);` |
| `score` | `forecastMateriality(t.id, base, ALL_DRIVERS, y - 2025, regMultiplier);` |
| `historicalComparison` | `useMemo(() => { return ESRS_TOPICS.map(t => ({ topic: t.id, label: t.label, score2020: Math.max(10, t.baseScore - 15 - Math.floor(sr(hashStr(t.id), 99) * 10)), score2025: t.baseScore, score2035: topicForecasts.find(f => f.id === t.id)?.y2035 \|\| t.baseScore, }));` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => { const v = r[k]; return typeof v === 'object' ? `"${JSON.stringify(v)}"` : `"${v}"`; }).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `delta5yr` | `h.score2025 - h.score2020;` |
| `delta10yr` | `h.score2035 - h.score2025;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_DRIVERS`, `CHART_COLORS`, `ESRS_TOPICS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| MTI Score (0–100) | — | Composite of investor, regulatory, and litigation signals | Current materiality trend strength; above 70 indicates a rapidly emerging or highly active topic |
| Trend Velocity (MTI/yr) | — | 12-month MTI delta | Rate of materiality change; high positive velocity signals accelerating investor and regulatory attention |
| Regulatory Catalyst Events | — | Legislative tracker database | Number of significant regulatory proposals or enactments affecting the topic in the past 12 months |
| Sector Materiality Consensus (%) | — | SASB cross-sector materiality map | Proportion of companies in the sector for which the topic is deemed financially material by SASB |
- **SASB standards revision history database** → Track topic additions, removals, and metric changes across standard revisions; code directionality → **Longitudinal materiality consensus time series by sector and topic**
- **Investor engagement letter tracker** → Classify letters by topic and AUM of signatory; aggregate monthly priority score → **Investor priority signal time series per topic**
- **Regulatory pipeline database** → Monitor legislative activity by topic and jurisdiction; compute regulatory activity score → **Regulatory catalyst event log and activity score time series**

## 5 · Intermediate Transformation Logic
**Methodology:** Materiality Trend Index
**Headline formula:** `MTIᵢₜ = (Investor Priority Scoreᵢₜ + Regulatory Activity Scoreᵢₜ + Litigation Risk Scoreᵢₜ) / 3`

The Materiality Trend Index aggregates three signal dimensions: investor priority (engagement letter frequency and AUM of requesting investors), regulatory activity (volume of new rules and consultation responses), and litigation risk (ESG-related legal action frequency and damages quantum). Monthly scores are smoothed with a 6-month exponential moving average.

**Standards:** ['SASB Standards Evolution Database', 'Harvard Law School Forum on Corporate Governance ESG Survey', 'Bloomberg ESG Engagement Trend Data', 'RepRisk Issue Severity Index']
**Reference documents:** SASB Standards and Materiality Map 2023; Khan, Serafeim, Yoon â€” Corporate Sustainability: First Evidence on Materiality (2016); Eccles & Serafeim â€” The Performance Frontier: Innovating for a Sustainable Strategy (2013); Harvard Law School Forum on Corporate Governance ESG Annual Survey 2023; RepRisk ESG Risk Platform Methodology

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a **Materiality Trend Index**
> `MTI = (Investor Priority + Regulatory Activity + Litigation Risk) / 3` with 6-month EMA smoothing,
> investor-engagement letter tracking and RepRisk severity signals. **None of those three signal
> streams exist in the code.** What the module actually runs is a *driver-additive forecast*:
> a fixed database of 17 named regulatory/scientific/market drivers, each with a `strength` (1–5) and
> `trend` (increasing/decreasing), is summed against a hand-set base score per ESRS topic to project
> the topic's materiality 10 years forward. There is no investor letter feed, no litigation feed and
> no EMA. Documented below is the driver-forecast model as built.

### 7.1 What the module computes

The core is `forecastMateriality`: each topic's future score is its base score plus a linear,
time-scaled sum of the strengths of every driver that touches it:

```js
adjustment = Σ_drivers[ direction · strength · regMultiplier · (yearsForward / 5) ]
             where direction  = (trend === 'increasing' ? +1 : -1)
                   strength    = STRENGTH_MAP[d.strength]   // very_high:5, high:3, medium:2, low:1
                   regMultiplier applies only to category === 'regulatory'
future_score = clamp(0, 100, currentScore + adjustment)
```

The `yearsForward / 5` factor means each driver delivers one "strength unit" of score movement per
five years — a crude linear ramp. `regMultiplier` (a user slider) lets the analyst stress the
regulatory drivers only.

### 7.2 Parameterisation / scoring rubric

**`ESRS_TOPICS` base scores** — hand-set 0–100 literals reflecting today's consensus materiality
(Climate E1 = 78, Business Conduct G1 = 70, Own Workforce S1 = 65, Circular Economy E5 = 38).
**Editorial demo values**, not derived.

**`TREND_DRIVERS`** — 17 drivers across three categories, each **a real, named external development**
with an assigned strength/trend:

| Category | Example driver | Topics | Strength | Trend |
|---|---|---|---|---|
| regulatory | CSRD/ESRS mandatory reporting (2025-2028) | all 10 | very_high (5) | ↑ |
| regulatory | EU CBAM (2026) | E1 | high (3) | ↑ |
| regulatory | CSDDD supply-chain DD (2027-2029) | S2,S3,G1 | high (3) | ↑ |
| scientific | Planetary boundaries — 6 of 9 exceeded | E3,E4,E2 | very_high (5) | ↑ |
| scientific | Biodiversity tipping points (coral, Amazon) | E4 | very_high (5) | ↑ |
| market | GFANZ net-zero ($150T AUM) | E1 | very_high (5) | ↑ |
| market | Anti-ESG political backlash (US) | E1,S1 | medium (2) | ↓ |

The driver *names, timelines and topic mappings are factually grounded*; the strength ratings are
editorial. `STRENGTH_MAP = {very_high:5, high:3, medium:2, low:1}` is the only conversion table.

**`SECTOR_SENSITIVITY`** — an 8-sector × 10-topic multiplier matrix (Energy E1 = 1.8, Financials
G1 = 1.5, Utilities E3 = 1.5). **Synthetic sector-tilt demo values** used to sector-adjust the
base score before forecasting.

### 7.3 Calculation walkthrough

1. `holdings` maps any saved portfolio to `GLOBAL_COMPANY_MASTER` to derive a sector mix (used for
   sector sensitivity tilt).
2. `topicForecasts` computes `y2025 = baseScore`, then `y2035` via `forecastMateriality(..., 10yrs)`;
   `delta2035 = y2035 − y2025` is the headline trend magnitude.
3. `keyDrivers` per topic = the top-3 drivers touching it, sorted by strength.
4. `heatmapData` builds a driver × topic grid; `historicalComparison` back-casts a 2020 score as
   `max(10, baseScore − 15 − sr()·10)` (a *fabricated* past point) so the UI can show 2020→2025→2035.
5. KPIs: `avgStrength` (mean driver strength), `mostDynamic` (topic with largest \|delta2035\|).

### 7.4 Worked example (E1 Climate Change, 10 years forward, regMultiplier = 1.0)

E1 `baseScore = 78`. Drivers touching E1: REG01 (very_high, ↑, regulatory), REG02 (high, ↑, reg),
REG04 (very_high, ↑, reg), SCI01 (high, ↑), MKT01 (very_high, ↑), MKT02 (medium, ↑), MKT03 (medium,
↓), MKT04 (high, ↑). With `yearsForward/5 = 2` and regMultiplier = 1:

| Driver | strength | dir | contribution (str·2·dir) |
|---|---|---|---|
| REG01 | 5 | +1 | +10 |
| REG02 | 3 | +1 | +6 |
| REG04 | 5 | +1 | +10 |
| SCI01 | 3 | +1 | +6 |
| MKT01 | 5 | +1 | +10 |
| MKT02 | 2 | +1 | +4 |
| MKT03 | 2 | −1 | −4 |
| MKT04 | 3 | +1 | +6 |
| **Σ adjustment** | | | **+48** |

`future = clamp(0,100, 78 + 48) = 100` (ceiling hit). `delta2035 = 100 − 78 = +22`. The clamp
saturates E1 — a limitation of the unbounded additive model on an already-high base score.

### 7.5 Data provenance & limitations

- **Base scores, strengths and sector multipliers are demo values.** Driver *identities* are real
  (CSRD, CBAM, CSDDD, ISSB S2, GFANZ, planetary boundaries) but their quantitative weights are
  hand-assigned, and the 2020 back-cast is seeded via `sr(seed)=frac(sin(seed+1)×10⁴)`.
- **The guide's MTI (investor/regulatory/litigation composite + EMA) is not implemented** — no
  investor-letter feed, no RepRisk severity, no time-series smoothing. The forecast is a static
  linear driver-sum, not a monthly signal index.
- The `yearsForward/5` ramp is linear and un-discounted; drivers with defined end-timelines
  (e.g. anti-ESG backlash 2024-2026) still contribute across the full 10-year horizon. Score clamps
  at 100 suppress differentiation among already-high topics.

**Framework alignment:** SASB / dynamic-materiality — the module operationalises the "dynamic
materiality" thesis (Khan-Serafeim-Yoon; SASB standards evolution) that topic materiality drifts with
regulatory and scientific developments; it approximates this with an expert-weighted driver sum.
CSRD/ESRS, ISSB S2, CSDDD, CBAM, EUDR are correctly named as the regulatory catalysts. TCFD/ISSB
scenario framing is implicit in the market drivers. No standard's *quantitative* index (e.g. RepRisk
Issue Severity, which scores adverse-media incidents 0–100 on reach × novelty × severity) is
reproduced — those names are references, not computations.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A materiality-trend index that tracks, per ESRS topic and sector, the *pace and direction* of
materiality change from real investor, regulatory and litigation signal streams, and projects
emergence lead-time for currently sub-threshold topics. Scope: 10 ESRS topics × ~11 GICS sectors,
monthly cadence, 10-year forward projection.

### 8.2 Conceptual approach
A composite signal index with exponential smoothing, benchmarked against RepRisk's Issue Severity
methodology (adverse-media incident scoring) and SASB's standards-evolution tracking. Three
independent monthly signals are normalised and blended, then a velocity term drives a bounded
logistic (not linear) forecast so already-high topics saturate gracefully rather than clamping.

### 8.3 Mathematical specification

```
MTI_{t,m} = (Inv_{t,m} + Reg_{t,m} + Lit_{t,m}) / 3                     // 0–100 monthly
MTI_smooth = α·MTI_{t,m} + (1−α)·MTI_smooth,{m−1}                        // α = 2/(6+1) (6-mo EMA)
Velocity_t = MTI_smooth,m − MTI_smooth,{m−12}                            // MTI/yr
Forecast_{t,y} = θ / (1 + e^{ −k(base_t + v_t·y − θ0) })                 // logistic, bounded [0,θ]
LeadTime_t = min{ y : Forecast_{t,y} ≥ material_threshold }
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Investor signal | Inv | Engagement-letter count × requester AUM (13F, GFANZ) |
| Regulatory signal | Reg | New-rule / consultation volume (EUR-Lex, Fed Register) |
| Litigation signal | Lit | ESG case count × damages (Sabin Climate Litigation DB) |
| EMA factor | α | 2/(N+1), N = 6 months |
| Logistic slope/ceiling | k, θ | Fit to historical topic trajectories |

### 8.4 Data requirements
Monthly investor-engagement letters (topic-tagged, with signatory AUM); legislative-pipeline volume
by topic/jurisdiction; ESG litigation tracker (Sabin/Columbia — free). Platform assets:
`GLOBAL_COMPANY_MASTER` for sector mix; the existing `ALL_DRIVERS` database can seed the regulatory
signal; `climate-litigation-*` modules can supply the Lit stream.

### 8.5 Validation & benchmarking plan
Back-test: do topics with high past velocity subsequently appear more often in SASB standard
revisions and CSRD DMAs? Reconcile the litigation signal against the Sabin database counts.
Sensitivity-test α (3/6/12-month) and logistic k for forecast stability.

### 8.6 Limitations & model risk
Signal streams are noisy and lag real materiality; investor-AUM weighting can over-index on a few
mega-asset-managers. The logistic ceiling assumes no structural regime break. Conservative fallback:
report velocity confidence bands and never issue a single-point emergence date without the band.

## 9 · Future Evolution

### 9.1 Evolution A — Measured signal streams behind the driver forecast (analytics ladder: rung 2 → 3)

**What.** The implemented model — 17 real, named drivers with strength/trend assignments, summed linearly (`Σ direction·strength·regMultiplier·(years/5)`) against hand-set topic base scores — is a defensible expert-judgement forecast, but §7 flags what the guide oversells: the promised MTI (`(InvestorPriority + RegulatoryActivity + LitigationRisk)/3` with 6-month EMA) has none of its three signal streams; the historical 2020 comparison points are seeded backcasts (`baseScore − 15 − sr·10`); and the linear one-strength-unit-per-five-years ramp is uncalibrated. Evolution A builds the measurable third of the MTI first: **regulatory activity** is genuinely trackable — the platform's regulatory-calendar module and public legislative trackers provide event counts per topic per jurisdiction — so the regulatory signal becomes a computed monthly series with the EMA smoothing the guide specifies. Litigation counts can follow from the public Sabin/Grantham climate-litigation database (topic-taggable). Investor-priority signals (engagement letters weighted by AUM) remain honestly out of scope until a data source exists — stated, not simulated.

**How.** (1) A `materiality_signals` table (topic × month × signal type × value × source); the regulatory stream joins the platform's regulatory-calendar events tagged to ESRS topics. (2) The driver database stays as the forward-looking layer but gains calibration: driver strengths back-tested against the measured regulatory series (did "CSRD enforcement" as a driver actually track measured activity?). (3) The seeded 2020 backcast replaced by the measured series where it exists, dropped where it doesn't. (4) Velocity computed as the guide's 12-month delta on measured MTI components.

**Prerequisites.** Topic-tagging of regulatory-calendar events; litigation-database ingestion; the seeded historical points removed. **Acceptance:** the regulatory signal is a computed monthly series with EMA; velocity derives from stored deltas; the MTI displays which components are measured vs judgement, per topic.

### 9.2 Evolution B — Emerging-topic radar copilot for ESG strategists (LLM tier 2)

**What.** The module's user promise — anticipate where regulatory and investor attention is heading — is a monitoring-and-briefing loop: "which topics show accelerating regulatory activity this quarter, and what events drove it?", "why does the model forecast E4 biodiversity rising 14 points by 2030 — which drivers, at what strengths?", "brief the disclosure committee on topics likely to cross materiality thresholds within our planning horizon." Answers decompose the forecast into its named drivers — the model's linear additivity, a limitation analytically, is a *feature* for explanation.

**How.** Tier 2 over the forecast/signal routes: driver decompositions show each contributing driver, strength, and category with the regulatory-multiplier state; measured-signal claims cite the underlying events ("4 EU consultations + 2 enactments tagged E4 in Q2"); forecast claims always distinguish measured-signal extrapolation from expert-judgement drivers — the §7-documented gap between the advertised MTI and the built forecast becomes a provenance label the copilot enforces sentence by sentence. Threshold-crossing briefings connect to materiality-scenarios for the scenario-conditional view, with the module boundary stated (trends = signal-driven baseline drift; scenarios = discrete futures).

**Prerequisites.** Evolution A's measured regulatory stream (a radar narrating seeded backcasts would manufacture trend history); Phase 2 tooling. **Acceptance:** every trend claim labels measured vs judgement provenance; driver decompositions sum to the forecast delta; event citations resolve to calendar records.