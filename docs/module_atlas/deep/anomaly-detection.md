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
