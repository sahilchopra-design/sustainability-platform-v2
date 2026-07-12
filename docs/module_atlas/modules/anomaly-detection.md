# Anomaly Detection
**Module ID:** `anomaly-detection` · **Route:** `/anomaly-detection` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ML-powered ESG data anomaly detection engine that flags statistical outliers, data entry errors, and implausible trend breaks across platform datasets. Uses isolation forest, z-score, and time-series decomposition models to surface quality alerts, enabling data stewards to investigate and remediate before they propagate into disclosures. Tracks anomaly resolution rates and data quality KPIs.

> **Business value:** Proactive anomaly detection prevents erroneous ESG data from flowing into regulatory disclosures, carbon accounting reports, and investment decisions. By catching implausible emissions spikes or carbon intensity inversions at ingestion, the engine reduces material misstatement risk and supports ISAE 3000 limited assurance engagements.

**How an analyst works this module:**
- Configure anomaly sensitivity thresholds per data category
- Alert Dashboard shows open anomalies ranked by severity and data impact
- Drill down into flagged record with z-score and isolation score detail
- Assign anomaly to data steward for investigation
- Mark resolved with remediation notes for audit trail
- Data Quality KPI tab tracks rolling anomaly rate and resolution SLA compliance

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COLORS`, `KpiCard`, `LS_ANOM`, `LS_PORT`, `MONITOR_FIELDS`, `Section`, `SortIcon`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MONITOR_FIELDS` | 11 | `label`, `unit` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `pct` | `(n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `mean` | `valid.reduce((s, v) => s + v, 0) / valid.length;` |
| `std` | `Math.sqrt(valid.reduce((s, v) => s + (v - mean) ** 2, 0) / valid.length);` |
| `sorted` | `[...valid].sort((a, b) => a - b);` |
| `lower` | `q1 - multiplier * iqr;` |
| `upper` | `q3 + multiplier * iqr;` |
| `fields` | `MONITOR_FIELDS.map(f => f.key);` |
| `peerValues` | `sectorPeers.map(p => p[f]).filter(v => v !== undefined && v !== null && !isNaN(v));` |
| `dev` | `Math.abs((val - mean) / std);` |
| `holdings` | `useMemo(() => { if (!portfolioRaw.length) return GLOBAL_COMPANY_MASTER.slice(0, 656).map((c, i) => enrichAnomaly(c, i));` |
| `values` | `holdings.map(h => h[field.key]);` |
| `isoScores` | `holdings.map((h, i) => {` |
| `heatmapData` | `useMemo(() => { return holdings.map((h, i) => { const row = { company: h.company_name, sector: h.sector, idx: i };` |
| `mostAnomalousField` | `Object.entries(fieldCounts).sort((a, b) => b[1] - a[1])[0]?.[0] \|\| '---';` |
| `mostAnomalousCompany` | `Object.entries(compCounts).sort((a, b) => b[1] - a[1])[0]?.[0] \|\| '---';` |
| `avgIso` | `isoScores.length ? (isoScores.reduce((s, i) => s + i.score, 0) / isoScores.length).toFixed(2) : '0';` |
| `topSector` | `Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] \|\| '---';` |
| `isoRanking` | `useMemo(() => [...isoScores].sort((a, b) => b.score - a.score).slice(0, 20), [isoScores]);` |
| `header` | `'Company,Sector,Field,Value,Sector Mean,Z-Score,Method,Severity\n';` |
| `rows` | `anomalies.map(a => `"${a.company}","${a.sector}","${a.field}",${fmt(a.value)},${fmt(a.sectorMean)},${a.zScore?.toFixed(2) \|\| ''},${a.method},${a.severity}`).join('\n');` |
| `blob` | `new Blob([header + rows], { type: 'text/csv' });` |
| `vals` | `peers.map(h => h[anom.fieldKey]).filter(v => v !== null && v !== undefined && !isNaN(v)).sort((a, b) => a - b);` |
| `median` | `vals[Math.floor(vals.length / 2)];` |
| `peerVals` | `peers.map(h => h[a.fieldKey]).filter(v => v !== null && v !== undefined && !isNaN(v));` |
| `peerMean` | `peerVals.length ? peerVals.reduce((s, v) => s + v, 0) / peerVals.length : 0;` |
| `peerMin` | `peerVals.length ? Math.min(...peerVals) : 0;` |
| `peerMax` | `peerVals.length ? Math.max(...peerVals) : 0;` |
| `fieldIdx` | `Math.floor(sRand(s) * MONITOR_FIELDS.length);` |
| `prev` | `curr * (0.5 + sRand(s + 1) * 1.0);` |
| `changePct` | `prev ? ((curr - prev) / prev * 100) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `MONITOR_FIELDS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Anomaly Detection Rate | — | Platform ML pipeline | Frequency of anomalous observations per thousand ESG data points ingested |
| False Positive Rate | — | Data steward review | Proportion of model-flagged anomalies confirmed as legitimate on manual review |
| Resolution SLA | — | Platform governance policy | Target time for data stewards to investigate and resolve high-priority anomaly alerts |
- **Platform ESG data ingestion pipeline** → Apply z-score and Isolation Forest models; ensemble vote for alert threshold → **Prioritised anomaly alert queue with scores, source fields, and drill-down links**
- **Historical data quality review logs** → Train Isolation Forest on clean baseline; update model quarterly → **Updated anomaly model with recalibrated sensitivity thresholds**

## 5 · Intermediate Transformation Logic
**Methodology:** Isolation Forest + z-score ensemble
**Headline formula:** `z_score = (x – μ) / σ; AnomalyScore = avg(IsoForest_score, z_score_flag); IF_score = 2^(–E[h(x)]/c(n))`

Isolation Forest assigns anomaly scores by measuring average path length to isolate an observation; shorter paths indicate outliers. Z-score flags values beyond 3σ from rolling mean. Time-series STL decomposition identifies structural breaks. Ensemble vote requires both models to agree before raising high-priority alert.

**Standards:** ['ISO 8000 Data Quality', 'GHG Protocol Data Quality', 'PCAF DQ Scale']
**Reference documents:** ISO 8000-8 Data Quality Characteristics; GHG Protocol Data Quality Management Guidance; PCAF Data Quality Scale 1–5

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** The MODULE_GUIDES entry describes an *Isolation Forest
> + STL ensemble* — `IF_score = 2^(−E[h(x)]/c(n))`, time-series STL decomposition, and an ensemble
> vote requiring both models to agree. **The code implements none of those.** What it *does*
> implement is real, self-contained statistics: a population **z-score detector**, a **Tukey IQR
> fence detector**, and a self-described "Isolation Score (simplified)" that is actually the *mean
> absolute sector-peer z-score across 10 fields* — a peer-deviation composite, not a tree-based
> Isolation Forest. The temporal-break table is simulated. Unlike most tier-B pages, the detection
> math here runs live on real input data when a user portfolio exists.

### 7.1 What the module computes

The page monitors 10 fields per company (`MONITOR_FIELDS`): ESG score, GHG intensity
(tCO₂e/$Mn), transition risk score, Scope 1/2 (MT), revenue, market cap, employees, EVIC and
data-quality score. Holdings come from the saved portfolio in `localStorage['ra_portfolio_v1']`;
if none exists it falls back to the first **656 rows of `GLOBAL_COMPANY_MASTER`** (a shared
platform dataset), gap-filled by `enrichAnomaly` (§7.5). Three detectors then run per field:

```js
// Z-score (population, threshold slider default 3)
z = (v − mean) / (std || 1);  anomaly if |z| > threshold

// IQR (Tukey fences, multiplier slider default 1.5)
q1 = sorted[floor(n·0.25)]; q3 = sorted[floor(n·0.75)]
anomaly if v < q1 − k·IQR  or  v > q3 + k·IQR

// "Isolation Score" = mean over fields of |value − sectorPeerMean| / sectorPeerStd
score = Σ_f |z_sector,f| / fieldsChecked;  flag if score > 2
```

### 7.2 Parameterisation / severity rubric

| Parameter | Value | Provenance |
|---|---|---|
| Z threshold | slider, default 3σ | Standard 3-sigma rule (the guide's "beyond 3σ") |
| Z severity | > 4σ Critical · > 3σ High · else Medium | Hardcoded rubric |
| IQR multiplier | slider, default 1.5 | Tukey's classic fence constant |
| IQR severity | always Medium | Hardcoded (IQR is treated as the weaker signal) |
| Isolation flag / severity | score > 2 flags; > 3.5 Critical · > 2.5 High · else Medium | Hardcoded rubric on the mean-|z| composite |
| Peer minimum | ≥ 3 valid peer values per field, else field skipped | Guard in `isolationScore` |
| Temporal break flag | \|Δ%\| > 50 flagged; > 80 red | Hardcoded on the simulated YoY table |
| Dedup rule | IQR hit suppressed if the same (company, field) already flagged by Z-score; isolation hit deduped per company | `results.find(...)` guards |

Two implementation notes: std uses the *population* formula (÷ n, not n−1), and the quartiles use
simple index floors rather than interpolation — both fine at n ≈ 656 but biased for tiny sectors.

### 7.3 Calculation walkthrough

1. **Holdings assembly** — portfolio rows are joined to `GLOBAL_COMPANY_MASTER` by lowercased
   company name; `enrichAnomaly` fills any missing field with a deterministic draw from the
   djb2-hash seed of the company name (`seed()` → `sRand(n) = frac(sin(n+1)×10⁴)`), e.g.
   `esg_score = 20 + sRand(s+1)·70`, `ghg_intensity = 5 + sRand(s+2)·800`.
2. **Cross-sectional sweep** — for each of the 10 fields, the z-score and IQR detectors run over
   the whole universe; every hit becomes an anomaly record (company, field, value, z, method,
   severity). The "Isolation" detector then runs per company against *sector* peers only.
3. **KPIs** — total anomalies, Critical count, most-anomalous field/company (argmax of counts),
   average isolation score, top sector.
4. **Heatmap** — universe-wide |z| per company × field (25 companies/page), colour-scaled;
   this reuses population mean/std over *all* holdings (not sector).
5. **Investigation drill-down** — clicking an anomaly shows peer stats (mean, median via
   `vals[floor(n/2)]`, min/max) and the flagged value in context.
6. **Temporal check (simulated)** — for 15 companies a pseudo "previous period" is invented as
   `prev = curr × (0.5 + sRand(s+1)·1.0)`, i.e. ±50 % of current, then
   `changePct = (curr − prev)/prev`; |Δ| > 50 % is FLAGGED. The 12-month anomaly trend area chart
   is likewise simulated.
7. **CSV export** — anomaly queue serialised with company/sector/field/value/mean/z/method/severity.

### 7.4 Worked example (z-score path)

Suppose the ESG-score column over the universe has mean μ = 55.0 and population σ = 16.0, and a
company reports `esg_score = 8`:

| Step | Computation | Result |
|---|---|---|
| z | (8 − 55.0) / 16.0 | −2.94 |
| Z-detector (threshold 3) | \|−2.94\| > 3 ? | **not flagged** |
| IQR (q1 = 44, q3 = 67, IQR = 23, k = 1.5) | lower fence = 44 − 34.5 = 9.5 | 8 < 9.5 → **flagged, bound "below", Medium** |
| Isolation (sector peers: μ = 58, σ = 12 for ESG; suppose other 9 fields average \|z\| = 1.6) | field z = 4.17; score = (4.17 + 9×1.6)/10 | 1.86 → **below 2, not flagged** |

The example shows the intended complementarity: IQR catches moderate tail values that 3σ misses,
while the isolation composite only fires on *multi-field* outliers.

### 7.5 Data provenance & limitations

- **Detection math is genuine and runs on live inputs** (user portfolio via localStorage), but the
  default universe is `GLOBAL_COMPANY_MASTER` with `enrichAnomaly` **synthetically back-filling
  every missing metric** via the seeded PRNG — so in the no-portfolio state, most anomalies are
  artefacts of uniform random fills, not data-quality events.
- The "Isolation Score" is a z-score composite; it has none of Isolation Forest's properties
  (no axis-parallel splits, no path-length normalisation `c(n)`, no contamination control).
- Temporal/trend analytics are wholly simulated (`prev` invented from `curr`); no historical
  snapshots are stored, so real trend breaks cannot be detected.
- Population σ and floor-index quartiles bias small-sector stats; means (not medians) make the
  z-detector itself sensitive to the outliers it hunts.
- No steward workflow persistence beyond `localStorage['ra_anomaly_detection_v1']` (settings
  only); resolution SLAs from the guide are not tracked.

### 7.6 Framework alignment

- **3-sigma rule / Tukey fences** — both classic outlier tests are correctly implemented
  (thresholds 3σ and 1.5×IQR are the textbook defaults).
- **Isolation Forest (Liu et al. 2008)** — the real algorithm isolates points via random
  recursive partitioning; anomaly score `2^(−E[h(x)]/c(n))` where `h` is path length. Named in
  the guide and mimicked here only in spirit (peer deviation).
- **PCAF Data Quality Scale / GHG Protocol data quality** — the monitored `data_quality_score`
  field echoes PCAF's 1–5 scoring concept (lower = better evidence); the module treats it as just
  another numeric column.
- **ISO 8000 / ISAE 3000** — cited by the guide as the data-quality and assurance context; the
  module's anomaly queue is the kind of exception report such engagements consume, but no
  control framework logic is coded.

## 9 · Future Evolution

### 9.1 Evolution A — Backend Isolation Forest + STL over stored history (analytics ladder: rung 2 → 4)

**What.** This module already runs genuine statistics live on real inputs — a population z-score
detector and Tukey IQR fences over the user portfolio or `GLOBAL_COMPANY_MASTER` — which puts it
ahead of most tier-B pages. But per the §7 partial-mismatch flag, its "Isolation Score" is not
Isolation Forest (it is a mean absolute sector-peer z-score composite, lacking path-length
normalisation `c(n)` and contamination control), the STL time-series decomposition the guide names
is absent, and the temporal-break check is simulated (`prev = curr × (0.5 + sRand·1.0)`, ±50% of
current) because no historical snapshots are stored. Evolution A moves detection server-side with a
real sklearn `IsolationForest(contamination=c)` ensemble plus STL structural-break detection over
**stored data-version history**, and makes the ensemble vote (both models agree → high priority)
the guide describes real.

**How.** `POST /api/v1/anomaly/scan` (portfolio → anomaly records with true IF score, z, IQR flag,
STL break) and a data-snapshot table so YoY change is measured, not invented; the existing severity
rubrics (>4σ Critical, IQR Medium, IF cutoff by contamination) carry over. Rung 4 (predictive): STL
trend/seasonal decomposition forecasts expected ranges so a value is flagged against its predicted
band, not just a static mean.

**Prerequisites (hard).** Stop `enrichAnomaly` synthetically back-filling every missing metric via
`sRand` (§7.5) — in the no-portfolio state, most "anomalies" are artefacts of uniform random fills;
per the no-fabricated-random guardrail, missing fields must be honest nulls the detector skips.
Store real historical snapshots. **Acceptance:** the §7.4 z/IQR worked example reproduces; the IF
score has path-length normalisation (contamination slider changes the flagged count); a real YoY
break is detected from stored snapshots, not a `prev` invented from `curr`.

### 9.2 Evolution B — Data-quality steward copilot over the anomaly queue (LLM tier 2)

**What.** A copilot for data stewards answering "what are today's critical anomalies and why?",
"is this GHG-intensity outlier a real error or a sector artefact?" (walking the z, IQR and
peer-deviation evidence), and "draft a remediation note for this flagged record" — tool-calling the
scan engine and narrating real detector output. It fits the ISAE 3000 assurance context the guide
cites: an auditable exception report with LLM-drafted, human-approved resolution notes.

**How.** Tool schema over Evolution A's `POST /anomaly/scan` plus a peer-stats lookup; the
no-fabrication validator checks every z-score, mean and threshold against tool output. The copilot
distinguishes the three detectors' signals (3σ misses moderate tails IQR catches; IF fires only on
multi-field outliers — the complementarity §7.4 illustrates) and routes each anomaly to a steward
with a suggested severity and SLA, persisting resolution notes to an audit trail (the guide's
resolution-SLA tracking, currently unimplemented).

**Prerequisites.** Evolution A (real detectors, stored history) so the copilot narrates genuine
signals not random-fill artefacts; Atlas corpus embedded (roadmap D3). **Acceptance:** every
statistic in an answer traces to a scan tool output; an anomaly caused by a null-fill is correctly
identified as a data-completeness gap, not a data-quality event; resolution notes persist to the
audit log with actor and timestamp.