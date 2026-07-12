# Satellite Climate Monitor
**Module ID:** `satellite-climate-monitor` · **Route:** `/satellite-climate-monitor` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Satellite-derived climate hazard monitoring providing near-real-time physical risk signals including fire, flood, drought, and sea-level anomaly indicators for portfolio assets.

> **Business value:** Provides near-real-time satellite-derived physical risk signals linked directly to portfolio asset locations.

**How an analyst works this module:**
- Geocode portfolio assets and define monitoring perimeters.
- Ingest satellite feeds: Sentinel-1/2 (flood/fire), MODIS/VIIRS (fire), Landsat (drought index).
- Compute hazard anomaly indices against 10-year baselines and flag threshold breaches.
- Publish asset-level alerts and aggregate portfolio exposure summaries.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `ASSET_TYPES`, `Badge`, `COMMODITIES`, `COUNTRIES`, `Card`, `FOREST_ZONES`, `FilterBar`, `METHANE_FACILITIES`, `MONTHS`, `MiniBar`, `OWNERS`, `PORTFOLIO_COMPANIES`, `RISK_TIERS`, `SAT_TYPES`, `SECTORS_OG`, `SectionTitle`, `Stat`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `anomalies` | `tier==='Critical'?Math.floor(8+s2*12):tier==='High'?Math.floor(4+s2*6):` |
| `daysAgo` | `Math.floor(1+s3*14);` |
| `scanDate` | `new Date(2026,2,28-daysAgo);` |
| `baseEmission` | `50+sr(i*43)*200;` |
| `leakRate` | `parseFloat((0.5+s*80).toFixed(2));` |
| `hectaresLost` | `parseFloat((50+s*4950).toFixed(0));` |
| `reportedEmissions` | `parseFloat((100+s*900).toFixed(0));` |
| `satelliteEmissions` | `parseFloat((reportedEmissions*(0.85+s2*0.6)).toFixed(0));` |
| `discrepancy` | `parseFloat((((satelliteEmissions-reportedEmissions)/reportedEmissions)*100).toFixed(1));` |
| `totalAnomalies` | `ASSETS.reduce((s,a)=>s+a.anomalies,0);` |
| `avgDataQuality` | `parseFloat((ASSETS.reduce((s,a)=>s+a.dataQuality,0)/100).toFixed(0));` |
| `methaneMonthlyAgg` | `useMemo(()=>{ return MONTHS.map((m,mi)=>{ const total=METHANE_FACILITIES.reduce((s,f)=>s+f.monthlyLeaks[mi].detected,0);` |
| `avgRate` | `parseFloat((METHANE_FACILITIES.reduce((s,f)=>s+f.monthlyLeaks[mi].rate,0)/40).toFixed(1));` |
| `totalPlumes` | `METHANE_FACILITIES.reduce((s,f)=>s+f.monthlyLeaks[mi].plumes,0);` |
| `sectorBenchmarks` | `useMemo(()=>{ return SECTORS_OG.map(sec=>{ const facs=METHANE_FACILITIES.filter(f=>f.sector===sec);` |
| `avg` | `facs.length?parseFloat((facs.reduce((s,f)=>s+f.leakRate,0)/facs.length).toFixed(1)):0;` |
| `max` | `facs.length?parseFloat(Math.max(...facs.map(f=>f.leakRate)).toFixed(1)):0;` |
| `deforestationByComm` | `useMemo(()=>{ return COMMODITIES.map(c=>{ const zones=FOREST_ZONES.filter(z=>z.commodity===c);` |
| `total` | `zones.reduce((s,z)=>s+z.hectaresLost,0);` |
| `avgSeverity` | `zones.length?parseFloat((zones.reduce((s,z)=>s+z.supplyChainRisk,0)/zones.length).toFixed(0)):0;` |
| `riskTierDistribution` | `useMemo(()=>RISK_TIERS.map(t=>({` |
| `rows` | `PORTFOLIO_COMPANIES.map(c=>[c.company,c.sector,c.weight,c.reportedEmissions,` |
| `csv` | `[headers,...rows].map(r=>r.join(',')).join('\n');` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_TYPES`, `COMMODITIES`, `COUNTRIES`, `MONTHS`, `OWNERS`, `RISK_TIERS`, `SAT_TYPES`, `SECTORS_OG`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Assets Monitored | — | Asset register | Portfolio assets with satellite hazard monitoring coverage as of latest mosaic date. |
| Active Alerts | — | Copernicus/FIRMS | Assets currently within a declared hazard anomaly zone above 2σ threshold. |
| Mosaic Refresh | — | ESA Sentinel-2 | Average time between satellite image acquisitions for monitored asset locations. |
- **Satellite image feeds, asset geocodes, historical baselines** → Raster processing, anomaly detection, perimeter intersection → **Asset-level hazard alerts, portfolio exposure maps, time-series charts**

## 5 · Intermediate Transformation Logic
**Methodology:** Hazard Anomaly Index
**Headline formula:** `(Current Reading – Baseline Mean) ÷ Baseline σ`

Z-score of current satellite-derived hazard reading relative to historical baseline, flagging statistically significant anomalies.

**Standards:** ['ESA Copernicus', 'NASA FIRMS', 'NOAA']
**Reference documents:** ESA Copernicus Emergency Management Service; NASA FIRMS Fire Information for Resource Management; NOAA Global Surface Temperature Anomalies; UN-SPIDER Knowledge Portal

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine states `Hazard Anomaly Index =
> (Current Reading - Baseline Mean) / Baseline sigma` — a genuine statistical z-score against a
> historical baseline. **No z-score, standard deviation, or statistical anomaly test exists
> anywhere in the code.** `thermalAnomaly` is a flat 30%-probability coin-flip
> (`sr(i x 67) > 0.7`); the "baseline" plotted alongside each asset's emissions trend is simply
> `baseEmission x 0.8` (a fixed 80% ratio of the asset's own randomly-generated base value, not an
> independently observed historical mean); and monthly "anomaly counts" are seeded PRNG draws, not
> derived from any reading-vs-baseline comparison.

### 7.1 What the module computes

100 synthetic monitored assets, tiered by a single seed draw:
```
tier      = s<0.10 ? 'Critical' : s<0.35 ? 'High' : s<0.70 ? 'Medium' : 'Low'    // s = sr(i x 7)
anomalies = tier-dependent range: Critical 8-20, High 4-10, Medium 1-4, Low 0-2
baseline  = baseEmission x 0.8                          // fixed ratio, not a historical mean
emissionsTrend[m] = baseEmission + sr((i+1)(m+1)x3) x 80 - 40    // +/-40 monthly noise band
thermalAnomaly    = sr(i x 67) > 0.7                     // ~30% flat probability, no threshold logic
dataQuality       = 60 + sr(i x 71) x 39                  // 60-99
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `tier` thresholds | Critical <10%, High <35%, Medium <70%, Low remainder | Author-chosen tier split, not calibrated to any real anomaly-severity distribution |
| `anomalies` count | Critical 8-20, High 4-10, Medium 1-4, Low 0-2 | Synthetic demo, tier-conditioned but not derived from a real detection algorithm |
| `baseEmission` | 50-250 (units unspecified) | Synthetic demo |
| `ndvi` | 0.2-0.8 | Plausible NDVI (Normalised Difference Vegetation Index) range for vegetated land, correctly bounded [0,1]-ish, but seeded not measured |
| `dataQuality` | 60-99 | Synthetic demo |
| `ASSET_TYPES` (20), `OWNERS` (30) | Real asset-class and real company names (ExxonMobil, Shell, Vale, Glencore, Rio Tinto, Sinar Mas, JBS, Vestas, etc.) | Real, recognisable entities attached to synthetic per-asset monitoring data — same "real name, fabricated numbers" pattern seen elsewhere in this batch |
| `SAT_TYPES` (5) | Optical, SAR Radar, Methane Spectral, Thermal Infrared, Multispectral | Correct real satellite-sensing modality taxonomy |

### 7.3 Calculation walkthrough

1. `ASSETS` (100 rows) generated once; each asset's `riskTier` deterministically drives its
   `anomalies` count range, but the count itself within that range is a further independent PRNG
   draw — there is no underlying physical reading being compared to a threshold.
2. **Methane intelligence tab**: `METHANE_FACILITIES` monthly leak data aggregates
   `Sum(monthlyLeaks[mi].detected)` and mean `leakRate` across 40 facilities per month/sector —
   real aggregation, but over synthetic per-facility leak rates (0.5-80.5 range).
3. **Deforestation tab**: `deforestationByComm` sums `hectaresLost` per commodity across
   `FOREST_ZONES`, and computes mean `supplyChainRisk` per commodity — genuine group-by
   aggregation over synthetic zone-level data.
4. **Portfolio overlay tab**: `discrepancy = (satelliteEmissions - reportedEmissions) /
   reportedEmissions x 100` compares a company's self-reported emissions to a synthetic "satellite
   estimate" (`reportedEmissions x (0.85 + sr()×0.6)`, i.e. satellite reading is a random ±15-45%
   perturbation of the reported figure) — this correctly implements the *concept* of an
   independent-verification gap (the same idea Climate TRACE uses), but the "satellite" side of the
   comparison is fabricated rather than derived from actual remote-sensing data.

### 7.4 Worked example

Portfolio company with `reportedEmissions = 500` (kt CO2e, illustrative units), and seed draw
`s2 = 0.42`: `satelliteEmissions = round(500 x (0.85 + 0.42x0.6)) = round(500 x 1.102) =
551`. `discrepancy = (551-500)/500 x 100 = +10.2%` — flagged as a moderate under-reporting gap.
Because `s2` is an independent PRNG draw rather than an actual satellite reading, this discrepancy
carries no evidentiary weight; it is illustrative of what the analysis *would* look like with real
satellite data.

### 7.5 Data provenance & limitations

- No z-score, standard-deviation, or baseline-comparison statistical test exists despite being the
  guide's headline methodology — "anomaly" flags and counts are unconditioned PRNG draws (tier-
  scaled ranges for the count, flat probability for the thermal flag).
- Real company names (ExxonMobil, Shell, Vale, Glencore, JBS, Vestas, etc.) are attached to
  entirely fabricated per-asset emissions, leak-rate, and deforestation data — this is the module's
  primary risk of misinterpretation if presented outside a clearly-labelled demo context.
- The reported-vs-satellite emissions discrepancy calculation is methodologically sound in form
  (matches how Climate TRACE-style independent verification works) but both sides of the
  comparison in this implementation are synthetic.

**Framework alignment:** ESA Copernicus / Sentinel-1/2, NASA FIRMS, NOAA (satellite programme names
correctly cited as data-source references, none are actually queried) · Climate TRACE-style
independent emissions verification (conceptually correct discrepancy formula, fabricated inputs
on both sides) · standard NDVI vegetation-health index (correctly bounded field, seeded not
measured).

## 9 · Future Evolution

### 9.1 Evolution A — Real anomaly z-scores over ingested observation series (analytics ladder: rung 1 → 3)

**What.** §7 flags a double fabrication: no z-score/baseline statistics exist despite the guide's `(Current − BaselineMean)/σ` methodology — `thermalAnomaly` is a 30% coin-flip and "baseline" is just 0.8× the asset's own random base value — and real company names (ExxonMobil, Shell, Vale, JBS) are attached to fabricated emissions, leak-rate, and deforestation figures, which §7.5 calls the module's primary misinterpretation risk. The platform's data estate makes an honest version feasible: GWIS fire data already populates the wildfire digital-twin grid, and NASA POWER / Open-Meteo supply per-coordinate meteorological series. Evolution A builds real anomaly detection on those feeds.

**How.** (1) Per monitored asset (user-entered coordinates), maintain observation series from the ingestible sources — fire detections within radius (GWIS/FIRMS), temperature/precipitation (NASA POWER daily), drought proxies (precipitation deficit) — in an `asset_observations` table. (2) Implement the guide's formula properly: rolling baseline mean/σ per asset per indicator (multi-year window), anomaly index as the z-score, flags at documented thresholds — the statistical machinery is a few honest lines once real series exist. (3) Real-name fabrication removed: assets are user-registered locations; no pre-seeded corporate attributions. (4) The reported-vs-satellite emissions comparison (§7.5 notes the form is sound, Climate-TRACE-style) is deferred to `sbti-climate-trace`'s facility-level evolution rather than duplicated here with fake operands.

**Prerequisites.** Ingestion cadence per source (daily FIRMS, daily POWER); baseline-window convention documented. **Acceptance:** an asset's anomaly index recomputes as `(reading − baseline)/σ` verifiably from stored observations; injecting a synthetic heat spike into the test series triggers the flag at the documented threshold; no pre-seeded company names remain.

### 9.2 Evolution B — Alert-triage copilot for portfolio monitoring (LLM tier 2)

**What.** Once anomalies are real, the workflow is triage: "three assets flagged this week — summarize each anomaly (indicator, magnitude, duration, nearby fire detections) and which portfolio exposures they touch", "is the Brazil facility's drought signal a trend or noise?" (answerable from the z-score series and baseline window), "draft the weekly physical-risk monitoring note".

**How.** Tier-2 tool calls over the observation/anomaly endpoints and the portfolio linkage; trend-vs-noise answers quote the statistical context (consecutive periods above threshold, magnitude vs σ) rather than gut feel — the module's own machinery provides the discipline. Monitoring notes render via report studio with per-alert source data (satellite product, observation dates). Guardrails: no causal attribution beyond the data (a thermal anomaly is not "a methane leak" without a measurement that says so); indicator coverage limits stated per asset (e.g. no flood indicator where grid coverage is sparse); severity language mapped to documented threshold bands only.

**Prerequisites (hard).** Evolution A — triaging coin-flip alerts attached to real company names is the exact failure §7.5 warns about; alert persistence. **Acceptance:** every alert fact in a note traces to stored observations; trend claims cite the consecutive-period count; coverage disclaimers appear for missing indicators.