# Pandemic-Climate Nexus
**Module ID:** `pandemic-climate-nexus` · **Route:** `/pandemic-climate-nexus` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Combined pandemic and climate systemic risk analysis. Covers zoonotic disease spillover, supply chain double disruption, health system stress, and portfolio compound shock assessment.

> **Business value:** The COVID-19 pandemic demonstrated how biological and physical risks can compound with climate-driven disruptions. The same deforestation driving climate change increases zoonotic spillover risk. This module enables scenario planning for the next compound systemic shock combining pandemic and climate crises.

**How an analyst works this module:**
- Risk Overview shows combined pandemic-climate risk matrix
- Zoonotic Spillover Map shows deforestation-disease nexus hotspots
- Health System Stress models climate + pandemic compound load
- Portfolio Impact shows double-disruption scenarios
- One Health Framework integrates human, animal, and environmental health

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES`, `COUNTRY_NAMES`, `DISEASES`, `HORIZONS`, `QUARTERS`, `RCP_SCENARIOS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `deforestKm2` | `Math.floor(s1*50000+100);` |
| `habitatFragPct` | `+(s2*80+10).toFixed(1);` |
| `wildlifeTradePct` | `+(s3*60+5).toFixed(1);` |
| `spilloverRisk` | `Math.floor(s4*100);` |
| `ghsIndex` | `+(20+s5*60).toFixed(1);` |
| `healthcareCapacityBeds` | `Math.floor(sr(i*31+313)*800+50);` |
| `pharmaSupplyVuln` | `Math.floor(sr(i*37+317)*100);` |
| `popM` | `+(sr(i*41+319)*250+2).toFixed(1);` |
| `amrIndex` | `Math.floor(sr(i*43+321)*100);` |
| `diseaseRange` | `DISEASES.map((d,di)=>({` |
| `qTrend` | `QUARTERS.map((_,qi)=>({q:QUARTERS[qi],spillover:Math.floor(spilloverRisk*(0.85+qi*0.02+sr(i*59+qi*7)*0.1)),ghs:+(ghsIndex+sr(i*61+qi*11)*2-1).toFixed(1)}));` |
| `pharmaExposure` | `Math.floor(sr(i*67+327)*5000+100);` |
| `healthInfraGapM` | `Math.floor(sr(i*71+329)*10000+200);` |
| `pandemicBondM` | `Math.floor(sr(i*73+331)*2000);` |
| `oneHealthInvestM` | `Math.floor(sr(i*79+333)*1500+50);` |
| `fmt` | `(n)=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);` |
| `TABS` | `['Zoonotic Risk Map','Vector-Borne Disease Expansion','Pandemic Preparedness','Investment Implications'];` |
| `topKPIs` | `useMemo(()=>({ criticalCount:COUNTRIES.filter(c=>c.riskTier==='Critical').length, avgSpillover:Math.floor(COUNTRIES.reduce((s,c)=>s+c.spilloverRisk,0)/Math.max(1,COUNTRIES.length)), totalDeforest:COUNTRIES.reduce((s,c)=>s+c.deforestKm2,0), avgGHS:+(COUNTRIES.reduce((s,c)=>s+c.ghsIndex,0)/Math.max(1,COUNTRIES.length)).toFixed(1) }),[]);` |
| `scatterData` | `useMemo(()=>COUNTRIES.map(c=>({name:c.name,x:c.deforestKm2,y:c.spilloverRisk,z:c.popM,tier:c.riskTier})),[]);` |
| `diseaseAgg` | `useMemo(()=>DISEASES.map(d=>{` |
| `totalCurrent` | `COUNTRIES.reduce((s,c)=>{const dr=c.diseaseRange.find(x=>x.disease===d);return s+(dr?+dr.currentPopAtRiskM:0);},0);` |
| `projections` | `RCP_SCENARIOS.map((_,ri)=>HORIZONS.map((_,hi)=>COUNTRIES.reduce((s,c)=>{const dr=c.diseaseRange.find(x=>x.disease===d);return s+(dr?+dr.rcpProjections[ri][hi]:0);},0)));` |
| `ghsData` | `useMemo(()=>[...COUNTRIES].sort((a,b)=>b.ghsIndex-a.ghsIndex).map(c=>({name:c.name,ghs:c.ghsIndex,capacity:c.healthcareCapacityBeds/10,pharmaVuln:c.pharmaSupplyVuln})),[]);` |
| `investData` | `useMemo(()=>{ const totalPharma=COUNTRIES.reduce((s,c)=>s+c.pharmaExposure,0);` |
| `totalInfra` | `COUNTRIES.reduce((s,c)=>s+c.healthInfraGapM,0);` |
| `totalBonds` | `COUNTRIES.reduce((s,c)=>s+c.pandemicBondM,0);` |
| `totalOneHealth` | `COUNTRIES.reduce((s,c)=>s+c.oneHealthInvestM,0);` |
| `total` | `c.diseaseRange.reduce((s,d)=>s+ +d.rcpProjections[rcpIdx][horizonIdx],0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRY_NAMES`, `DISEASES`, `HORIZONS`, `QUARTERS`, `RCP_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Zoonotic Risk Drivers | — | WHO/EcoHealth Alliance | Environmental factors increasing spillover probability |
| Health System Stress | — | IPCC WGII | Compound climate-health system overload |
| Supply Chain Impact | — | Model | Combined pandemic + climate > sum of parts |
- **Deforestation data** → Habitat-spillover risk model → **Zoonotic emergence risk**
- **Climate health projections** → Health system capacity overlay → **Compound stress score**
- **Portfolio exposure** → Compound shock simulation → **Double disruption P&L impact**

## 5 · Intermediate Transformation Logic
**Methodology:** Compound systemic risk model
**Headline formula:** `CompoundImpact = max(Pandemic, Climate) + Interaction_term × Correlation`

Zoonotic spillover: deforestation and habitat loss increases human-animal contact and disease spillover risk. Climate-health nexus: heat increases respiratory illness, flooding spreads waterborne disease. Compound event: pandemic coinciding with climate catastrophe overwhelms response capacity.

**Standards:** ['WHO', 'IPCC AR6 WGII Ch.7', 'CEPI']
**Reference documents:** WHO Health and Climate Change Special Report; IPCC AR6 WGII Chapter 7 (Health); EcoHealth Alliance Disease Emergence; One Health High-Level Expert Panel Report

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide names a *compound systemic risk* engine
> `CompoundImpact = max(Pandemic, Climate) + Interaction_term × Correlation`. **That formula does not
> exist in the code.** There is no compound-impact aggregation, no correlation term, and no
> portfolio double-hit P&L. What the page implements is a **40-country zoonotic-hazard table** plus a
> **vector-borne-disease range-expansion projector** driven by RCP × horizon multipliers — every
> field seeded by the platform PRNG. The sections below document the actual computation.

### 7.1 What the module computes

`genCountries(40)` builds one row per country (names from a fixed 40-country tropical/subtropical
list). Each row draws its drivers from `sr()`:

```js
deforestKm2  = floor(s1·50000 + 100)      // 100–50,100 km²
habitatFragPct = s2·80 + 10               // 10–90 %
wildlifeTradePct = s3·60 + 5              // 5–65 %
spilloverRisk = floor(s4·100)             // 0–100 (drives risk tier)
ghsIndex     = 20 + s5·60                  // 20–80 Global Health Security index
riskTier: spilloverRisk >75 Critical, >50 High, >25 Medium, else Low
```

The **vector-borne disease** engine is the one place with structured dynamics. For each of 6 diseases
(Malaria, Dengue, Zika, Chikungunya, Lyme, West Nile) it projects population-at-risk across 3 RCPs ×
3 horizons:

```js
currentPopAtRiskM = sr(...)·popM·0.4
rcpProjections[ri][hi] = sr(...)·popM·0.6·(1 + ri·0.2 + hi·0.15)
```

so the projection **grows monotonically** with both RCP index `ri` (0/1/2 → +0/20/40 %) and horizon
index `hi` (2030/2040/2050 → +0/15/30 %). This RCP×horizon uplift is the only genuine model logic.

### 7.2 Parameterisation / scoring rubric

| Quantity | Formula | Provenance |
|---|---|---|
| Deforestation | `sr·50000+100` km² | Synthetic demo value |
| Spillover risk | `floor(sr·100)` | Synthetic; sets risk tier |
| GHS index | `20 + sr·60` | Synthetic; label references real GHS Index (Johns Hopkins/NTI) |
| RCP uplift | `1 + ri·0.2` | Heuristic: +20 % per RCP step (RCP 2.6→4.5→8.5) |
| Horizon uplift | `1 + hi·0.15` | Heuristic: +15 % per decade to 2050 |
| Healthcare beds | `floor(sr·800+50)` | Synthetic |
| Pandemic bond capacity | `floor(sr·2000)` $M | Synthetic |
| One Health investment | `floor(sr·1500+50)` $M | Synthetic |

Risk-tier thresholds (75/50/25) and the RCP/horizon uplift coefficients are hand-chosen; the
directional monotonicity is defensible (warmer + later ⇒ wider vector range, per IPCC AR6) but the
magnitudes are not calibrated.

### 7.3 Calculation walkthrough

1. 40 country rows generated once. `topKPIs` = critical count, mean spillover, total deforestation,
   mean GHS (all guarded by `Math.max(1, length)`).
2. Tab 2 (`diseaseAgg`): for each disease, sum `currentPopAtRiskM` across countries, and sum
   `rcpProjections[ri][hi]` across countries for every RCP/horizon cell → a 3×3 projection surface.
3. Tab 3 (`ghsData`): countries sorted by GHS descending, plotted against healthcare capacity and
   pharma-supply vulnerability.
4. Tab 4 (`investData`): totals of pharma exposure, health-infra gap, pandemic bonds, One Health
   investment across all countries.

### 7.4 Worked example

Dengue population-at-risk in one country with `popM = 100 M`, under **RCP 8.5 (`ri=2`), 2050
(`hi=2`)**:

```
uplift   = 1 + 2·0.2 + 2·0.15 = 1 + 0.4 + 0.3 = 1.70
projected = sr(seed)·100·0.6·1.70 = sr(seed)·102 M
```

If `sr(seed) ≈ 0.50`, projected pop-at-risk ≈ **51 M**, versus a current
`sr·100·0.4 ≈ 20 M` — a 2.5× expansion driven entirely by the deterministic RCP×horizon multiplier.
Aggregating this cell across all 40 countries gives the headline "population at risk under RCP 8.5 by
2050" figure for dengue.

### 7.5 Companion analytics

- **Scatter** (deforestation-km² vs spillover-risk, bubble = population): a visual habitat-loss ↔
  spillover narrative, but the two axes are independent `sr()` draws — no correlation is fitted.
- **Quarterly trend** `qTrend`: spillover drifts up `+2 %/quarter` plus noise; GHS jitters ±1 — a
  cosmetic time series, not a fitted model.

### 7.6 Data provenance & limitations

- **All country data synthetic** via `sr(seed) = frac(sin(seed+1)×10⁴)`.
- The advertised compound-shock / correlation engine is absent — there is no interaction between the
  pandemic and climate layers beyond shared RNG seeds.
- Vector range-expansion uses fixed linear uplifts, not species-specific climate-suitability
  (e.g. *Aedes aegypti* R0 temperature response) curves.

**Framework alignment:** WHO *Health and Climate Change* special report · IPCC AR6 WGII Ch.7 (vector
range shifts under warming — the qualitative basis for the RCP×horizon uplift) · EcoHealth Alliance
disease-emergence work (deforestation → spillover narrative) · One Health HLEP (integration framing).
The module reflects these qualitatively; it does not implement their quantitative suitability or
spillover-hazard models.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The page shows a "compound systemic risk"
metric and vector-range projections with no calibrated model.

**8.1 Purpose & scope.** Produce (a) a climate-conditioned vector-borne-disease *population-at-risk*
surface by country/disease/RCP/horizon, and (b) a portfolio *compound (pandemic × climate) tail-loss*
for stress testing. Coverage: tropical/subtropical sovereign and corporate exposures.

**8.2 Conceptual approach.** For vectors, a climate-suitability envelope model (mirroring the
Lancet Countdown *vectorial capacity* index and WHO/TDR suitability maps). For compound loss, a
copula-linked bivariate tail model (transition/physical CVaR combination, per ECB CST 2024 and NGFS
double-materiality guidance) — at least two benchmarks: **Lancet Countdown vectorial capacity** and
**ECB economy-wide climate stress test** correlation treatment.

**8.3 Mathematical specification.**

```
Vectorial capacity uplift (disease d, country c, scenario s):
  VC(T) ∝ a(T)² · b(T) · exp(−μ(T)/EIR(T)) / μ(T)      (Macdonald–Ross form)
  PopAtRisk_{d,c,s,t} = Pop_c · Suit_d(T_{c,s,t})       Suit = suitability ∈ [0,1]
    T_{c,s,t} from downscaled CMIP6 for RCP/SSP s, year t

Compound portfolio loss (Gaussian copula, correlation ρ_sector):
  L_compound = VaR_α( L_pandemic , L_physical ; ρ )
  ρ_sector from ECB CST sector table (Energy high, Tech low)
```

| Parameter | Source |
|---|---|
| Temperature response a,b,μ,EIR | Mordecai et al. (2019) trait-based *Aedes/Anopheles* thermal curves |
| Downscaled T by RCP/year | CMIP6 / IPCC AR6 Interactive Atlas (free) |
| Sector compound-ρ | ECB Climate Stress Test 2024 sector interaction table |
| Pandemic loss margin | Swiss Re sigma pandemic frequency–severity |

**8.4 Data requirements.** Gridded CMIP6 temperature by RCP (free, Copernicus), population rasters
(WorldPop, free), disease-specific thermal-response parameters (peer-reviewed), sector exposure +
ρ table (ECB, internal). Platform already exposes NGFS/SSP scenario deltas; the thermal curves and
population rasters are new feeds.

**8.5 Validation & benchmarking.** Reconcile projected suitability against Lancet Countdown's
published vectorial-capacity trends (dengue/malaria); backtest against WHO reported incidence range
shifts 1990–2020; benchmark compound CVaR against the ECB CST double-hit outputs.

**8.6 Limitations & model risk.** Suitability ≠ incidence (ignores control programmes, immunity).
Copula ρ is unstable in the tail and hard to estimate for pandemic–climate joint events (essentially
one data point: COVID). Conservative fallback: report suitability bands, not point incidence, and
stress ρ at {0, 0.5, 0.9}.

## 9 · Future Evolution

### 9.1 Evolution A — Build the compound-impact model over real spatial data (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide names a compound systemic-risk engine (`CompoundImpact = max(Pandemic, Climate) + Interaction_term × Correlation`), but no compound aggregation, correlation term, or portfolio double-hit P&L exists. The page renders a 40-country zoonotic-hazard table (deforestation, habitat fragmentation, wildlife trade, spillover risk — all `sr()`-seeded) plus a vector-borne-disease range projector (6 diseases × 3 RCP × 3 horizons, the one place with structured RCP×horizon dynamics, though still seeded). Evolution A builds the compound model and grounds the hazard drivers.

**How.** (1) Ground the zoonotic-hazard table in real data: deforestation/habitat-fragmentation from Global Forest Watch (joinable to the geographic layer), Global Health Security Index (a real published country index — replace the seeded `ghsIndex`), and wildlife-trade proxies from CITES/published datasets. (2) Implement the compound-impact formula the guide specifies: combine a pandemic-hazard score and a climate-hazard score (the latter available from the platform's physical-risk modules) with an interaction term, producing the compound systemic risk §1 describes. (3) Ground the vector-borne range projections in published disease-range-expansion models under RCP scenarios (IPCC AR6 WGII Ch.7, named in §5) rather than `sr()·popM` bands.

**Prerequisites.** GFW/GHS/disease-range data ingestion (mostly public; disease-range models are research-grade — document uncertainty per Atlas §8); cross-module wiring to physical-risk hazard scores. Remove `sr()` per platform rule. **Acceptance:** compound impact decomposes into pandemic, climate, and interaction terms; zoonotic drivers trace to GFW/GHS data; no `sr()` in hazard fields.

### 9.2 Evolution B — Compound-shock scenario copilot (LLM tier 1 → 2, scoped honestly)

**What.** Near-term, a One-Health/compound-risk guidance copilot grounded in the WHO Health & Climate, IPCC AR6 WGII Ch.7, and One Health HLEP references named in §5: "how does deforestation drive spillover?", "which regions face compound pandemic-climate risk?", "what's the One Health framework?" It must not quantify compound risk for the user's exposure until Evolution A exists, because today's country table and projections are seeded.

**How.** Tier 1 over the standards corpus (roadmap `llm_corpus_chunks`): the copilot explains the zoonotic-climate nexus, compound-event dynamics, and One Health integration with citations. System prompt encodes the honest current state so it refuses "quantify my portfolio's compound shock" with a pointer to the (post-Evolution-A) compound-impact endpoint — a hard refusal, since the current numbers are fabricated. Tier 2 with Evolution A: tool calls to the compound-impact and vector-range models, fabrication validator matching every score to outputs, provenance citing GFW/GHS/IPCC sources.

**Prerequisites.** Standards ingestion; explicit current-state statement. Quantification gated on Evolution A. **Acceptance:** framework answers cite named references; compound-risk quantification refuses until the engine exists, then traces to tool calls with source provenance.