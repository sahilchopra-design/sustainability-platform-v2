# Climate Credit Risk Analytics
**Module ID:** `climate-credit-risk-analytics` · **Route:** `/climate-credit-risk-analytics` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate-adjusted credit risk analytics for loan and bond portfolios. Covers PD/LGD climate overlay, sector-specific scoring adjustments, watchlist integration, and IFRS 9 climate staging.

> **Business value:** Climate change is modifying credit risk but is not yet systematically captured in bank credit models. ECB and BoE supervisors are requiring climate integration in ICAAP and SREP. This module provides the technical infrastructure to embed climate into IFRS 9 models and credit watchlist processes.

**How an analyst works this module:**
- Credit Portfolio Overview shows climate-adjusted PD/LGD by sector
- Transition Risk Scores adjusts credit ratings for carbon exposure
- Physical Risk Overlay reduces collateral values in hazard zones
- IFRS 9 Climate Staging flags Stage 2 deterioration from climate risk
- Watchlist Manager prioritises high-climate-risk borrowers for review

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AUDIT_TRAIL`, `BORROWERS`, `BorrowerPortfolioTab`, `BorrowerSidePanel`, `CLIMATE_MIGRATION_MULT`, `CLIMATE_VAR_CONFIDENCE`, `CLIMATE_VAR_DATA`, `COLLATERAL_ADJUSTMENTS`, `CONCENTRATION_LIMITS`, `COUNTRIES`, `COUNTRY_CLIMATE_PREMIUM`, `COVENANT_DATA`, `CREDIT_MIGRATION_MATRIX`, `CRREM_PATHWAYS`, `DECARB_PATHWAY`, `DQS_FRAMEWORK`, `ECL_BACKTEST`, `ECL_SENSITIVITY`, `ENGAGEMENT_TRACKER`, `EPCRealEstateTab`, `EPC_BANDS`, `EPC_LGD_HAIRCUT`, `EPC_MEES_RISK`, `EPC_RETROFIT_COST`, `FORWARD_LOOKING_INDICATORS`, `HAZARDS`, `IFRS9ECLTab`, `IR_SENSITIVITY`, `LLP_WATERFALL`, `MATURITY_BUCKET_ECL`, `METHODOLOGY_DOCS`, `MODEL_VALIDATION`, `PEER_BANKS`, `PROPERTIES`, `PhysicalRiskTab`, `RATINGS`, `RECOVERY_ANALYSIS`, `REGULATORY_ITEMS`, `RETROFIT_PROGRAMME`, `RegulatoryExportTab`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TABS` | 8 | `id`, `label`, `icon` |
| `REGULATORY_ITEMS` | 13 | `id`, `regulator`, `ref`, `section`, `requirement`, `deadline`, `status`, `compliance` |
| `PEER_BANKS` | 11 | `name`, `gar`, `fe`, `tempScore`, `cet1Impact`, `eclOverlay` |
| `VINTAGE_DATA` | 8 | `originations`, `defaultRate`, `climateAdjDefault`, `lossRate`, `avgPD`, `avgLGD` |
| `SICR_TRIGGERS` | 11 | `trigger`, `type`, `category`, `description`, `threshold`, `unit` |
| `ECL_BACKTEST` | 13 | `predicted`, `actual`, `variance`, `coverage`, `pass` |
| `COVENANT_DATA` | 13 | `covenant`, `baseline`, `current`, `target`, `status`, `nextReview` |
| `MATURITY_BUCKET_ECL` | 6 | `exposure`, `ecl_base`, `ecl_climate`, `pd_avg`, `lgd_avg`, `count` |
| `LLP_WATERFALL` | 13 | `value`, `cumulative`, `type` |
| `DQS_FRAMEWORK` | 6 | `label`, `description`, `pctPortfolio`, `exposure` |
| `FORWARD_LOOKING_INDICATORS` | 11 | `current`, `forecast_2025`, `forecast_2030`, `trend`, `impact`, `signal` |
| `ECL_SENSITIVITY` | 13 | `eclChange`, `pctChange`, `direction` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(a,s)=>a[Math.floor(sr(s)*a.length)];` |
| `range` | `(lo,hi,s)=>+(lo+sr(s)*(hi-lo)).toFixed(2);` |
| `rangeInt` | `(lo,hi,s)=>Math.floor(lo+sr(s)*(hi-lo+1));` |
| `fmt` | `(n,d=1)=>n>=1e9?(n/1e9).toFixed(d)+'bn':n>=1e6?(n/1e6).toFixed(d)+'M':n>=1e3?(n/1e3).toFixed(d)+'k':n.toFixed(d);` |
| `fmtPct` | `(n,d=2)=>(n*100).toFixed(d)+'%';` |
| `fmtGBP` | `(n)=>'£'+fmt(n);` |
| `RATINGS` | `['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B','B-','CCC+','CCC'];` |
| `EPC_MEES_RISK` | `{A:'Compliant all horizons',B:'Compliant all horizons',C:'Compliant to 2027',D:'At risk post-2027',E:'Non-compliant post-2025',F:'Non-compliant now (grace period)',G:'Non-compliant — stranded risk'};` |
| `exposure` | `range(10,800,seed)*1e6;` |
| `basePD` | `range(0.001,0.085,seed+1);` |
| `baseLGD` | `range(0.25,0.65,seed+2);` |
| `ead` | `exposure*range(0.85,1.05,seed+3);` |
| `ratingIdx` | `Math.min(17,Math.max(0,Math.floor(basePD*200)));` |
| `scope1` | `range(500,ss.carbonIntBase*2000,seed+4);` |
| `scope2` | `scope1*range(0.08,0.35,seed+5);` |
| `carbonIntensity` | `range(ss.carbonIntBase*0.5,ss.carbonIntBase*1.8,seed+6);` |
| `ebitda` | `exposure*ss.ebitdaMargin*range(0.6,1.4,seed+7);` |
| `epc` | `(sector==='Real Estate')?EPC_BANDS[rangeInt(0,6,seed+8)]:null;` |
| `physScores` | `HAZARDS.map((_,hi)=>rangeInt(1,5,seed+10+hi));` |
| `physRiskScore` | `+(physScores.reduce((a,b)=>a+b,0)/HAZARDS.length).toFixed(1);` |
| `collateralValue` | `(sector==='Real Estate')?exposure*range(1.1,1.8,seed+20):exposure*range(0.3,0.8,seed+20);` |
| `sbti` | `pick(['Committed','Target Set — 1.5°C','Target Set — WB2C','None','None'],seed+21);` |
| `dqs` | `rangeInt(1,5,seed+22);` |
| `value` | `range(5,120,seed+1)*1e6;` |
| `ltv` | `range(0.45,0.85,seed+2);` |
| `yearBuilt` | `rangeInt(1960,2022,seed+3);` |
| `sqm` | `rangeInt(800,25000,seed+4);` |
| `annualRent` | `value*range(0.04,0.08,seed+5);` |
| `occupancy` | `range(0.65,0.99,seed+6);` |
| `priceShock` | `carbonPrice/100;` |
| `physMult` | `1+(scen.peakWarming_c-1.5)*0.05;` |
| `climatePD` | `Math.min(0.99,basePD*(1+transSens*priceShock)*physMult);` |
| `physHaircut` | `(physRiskScore-2.5)*0.02;` |
| `warmingHaircut` | `(scen.peakWarming_c-1.5)*0.03;` |
| `survProb` | `Math.pow(1-pd,y-1);` |
| `totalExposure` | `filtered.reduce((s,b)=>s+b.exposure,0);` |
| `avgPD` | `filtered.length?filtered.reduce((s,b)=>s+b.basePD,0)/filtered.length:0;` |
| `avgLGD` | `filtered.length?filtered.reduce((s,b)=>s+b.baseLGD,0)/filtered.length:0;` |
| `climatePDs` | `NGFS_SCENARIOS.slice(0,4).map(scen=>({` |
| `climateLGDs` | `NGFS_SCENARIOS.slice(0,4).map(scen=>({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AUDIT_TRAIL`, `CLIMATE_VAR_CONFIDENCE`, `COUNTRIES`, `COVENANT_DATA`, `CRREM_PATHWAYS`, `DECARB_PATHWAY`, `DQS_FRAMEWORK`, `ECL_BACKTEST`, `ECL_SENSITIVITY`, `ENGAGEMENT_TRACKER`, `EPC_BANDS`, `FORWARD_LOOKING_INDICATORS`, `HAZARDS`, `IR_SENSITIVITY`, `LLP_WATERFALL`, `MATURITY_BUCKET_ECL`, `METHODOLOGY_DOCS`, `PEER_BANKS`, `RATINGS`, `RECOVERY_ANALYSIS`, `REGULATORY_ITEMS`, `RETROFIT_PROGRAMME`, `SECTORS`, `SICR_TRIGGERS`, `STRESS_HORIZONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PD Uplift (High Exposure) | — | ECB CST | Probability of default increase for energy/utilities under NZ2050 |
| LGD Uplift (Physical) | — | Physical risk model | LGD increase from collateral value decline in hazard zones |
| ECL Uplift (stressed) | — | Regulatory stress | Increase in expected credit loss under climate stress |
- **Loan/bond portfolio** → Climate PD/LGD adjustment → **Climate-adjusted credit parameters**
- **Sector transition scores** → IFRS 9 staging trigger → **Stage 2 migration alerts**
- **Physical hazard data** → Collateral value adjustment → **Climate-adjusted LGD**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-conditional credit risk
**Headline formula:** `PD_climate = PD_base × exp(β × ΔCarbonPrice + γ × HazardIntensity)`

Two channels: (1) Transition channel — carbon price increase → sector EBITDA decline → higher PD, (2) Physical channel — hazard damage → collateral value decline → higher LGD. Combined: multi-factor climate-conditional PD/LGD model.

**Standards:** ['IFRS 9', 'ECB Climate Stress Test', 'BCBS 530']
**Reference documents:** IFRS 9 Financial Instruments; ECB Climate Stress Test Methodology 2024; BCBS 530 Principles for Climate Risk; EBA Guidelines on Climate Risk Management

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This is a **substantive climate credit-risk module** implementing a real two-channel climate overlay
on IFRS 9 expected credit loss: a transition channel (carbon-price → PD uplift) and a physical
channel (hazard + EPC → LGD haircut), with a lifetime-ECL engine, NGFS-scenario conditioning, and a
UK MEES / EPC real-estate stranding view. It aligns with its guide (the guide's
`PD_climate = PD_base × exp(β·ΔCarbonPrice + γ·HazardIntensity)` is realised multiplicatively rather
than as an exponential — a modelling choice, not a mismatch). The 80-borrower portfolio is
`sr()`-seeded synthetic data.

### 7.1 What the module computes

**Climate PD** (`calcClimatePD`):
```
priceShock = carbonPrice / 100
physMult   = 1 + (peakWarming_c − 1.5) × 0.05
climatePD  = min(0.99, basePD × (1 + transSens × priceShock) × physMult)
uplift     = climatePD / basePD − 1
```

**Climate LGD** (`calcClimateLGD`):
```
epcHaircut     = EPC_LGD_HAIRCUT[epc]                     (A:0 … G:0.25)
physHaircut    = (physRiskScore − 2.5) × 0.02
warmingHaircut = (peakWarming_c − 1.5) × 0.03
climateLGD     = min(0.99, baseLGD + epcHaircut + physHaircut + warmingHaircut)
```

**Lifetime ECL** (Stage-2/3 IFRS 9):
```
ECL_lifetime = Σ_{y=1}^{T} PD · (1−PD)^{y−1} · LGD · EAD · (1+discountRate)^{−y}
```
This is a proper survival-probability-weighted, discounted lifetime ECL — `(1−PD)^{y−1}` is the
probability of surviving to year `y`, `PD` the marginal default, discounted by `df = 1/(1+r)^y`.

### 7.2 Parameterisation / provenance

| Constant | Value | Provenance |
|---|---|---|
| `SECTOR_SENSITIVITY.transSens` | 0.05 (Financials) → 0.85 (Oil & Gas) | Hard-coded sector transition betas |
| `carbonIntBase` | 4 (Financials) → 720 (Cement) tCO₂e | Hard-coded sector carbon intensity |
| `physMult` slope | `(warming−1.5)×0.05` | Design scalar (5 %/°C above 1.5) |
| `EPC_LGD_HAIRCUT` | A:0, C:0.05, E:0.12, G:0.25 | UK MEES-linked LGD haircut ladder |
| `EPC_MEES_RISK` | C compliant to 2027, E non-compliant post-2025, G stranded | UK Minimum Energy Efficiency Standards |
| `EPC_RETROFIT_COST` | £0 (A) → £250k (G) | Hard-coded retrofit cost ladder |
| `physHaircut` slope | `(score−2.5)×0.02` | Design scalar around mid-hazard 2.5 |
| NGFS `peakWarming_c` | per scenario | `referenceData` NGFS scenario set |
| 80 borrowers | exposure, PD, LGD, scope1/2, EPC… | **`sr()`-seeded** via `range`/`rangeInt` |

### 7.3 Calculation walkthrough

1. `generateBorrowers` builds 80 borrowers: `basePD` 0.1–8.5 %, `baseLGD` 25–65 %, EAD, sector,
   carbon intensity, EPC (real-estate only), 8-hazard physical scores, SBTi, DQS.
2. **Transition tab**: `climatePD` scales base PD by carbon-price shock × sector `transSens` × warming
   multiplier; the uplift table compares 4 NGFS scenarios.
3. **Physical tab**: `climateLGD` adds EPC, physical and warming haircuts to base LGD.
4. **ECL engine**: 1-yr ECL `= PD·LGD·EAD` for Stage 1; lifetime ECL (above) for Stage 2/3.
5. **EPC & Real Estate**: MEES compliance horizon and retrofit cost per band; stranded-asset flags.

### 7.4 Worked example — Oil & Gas borrower under a hot-house scenario

Borrower: `basePD = 2.0 %`, `baseLGD = 45 %`, `EAD = $200M`, `transSens = 0.85` (Oil & Gas),
`physRiskScore = 3.2`, EPC n/a. Scenario `peakWarming_c = 3.0`, `carbonPrice = 130`:

| Step | Computation | Result |
|---|---|---|
| priceShock | 130/100 | 1.30 |
| physMult | 1 + (3.0−1.5)×0.05 | 1.075 |
| climatePD | min(0.99, 0.02 × (1 + 0.85×1.30) × 1.075) | **0.0454 (4.54 %)** |
| PD uplift | 0.0454/0.02 − 1 | **+127 %** |
| physHaircut | (3.2−2.5)×0.02 | 0.014 |
| warmingHaircut | (3.0−1.5)×0.03 | 0.045 |
| climateLGD | min(0.99, 0.45 + 0 + 0.014 + 0.045) | **0.509 (50.9 %)** |
| 1-yr ECL climate | 0.0454 × 0.509 × 200 | **$4.62M** (vs base 0.02×0.45×200 = $1.80M) |

A high-transition-sensitivity fossil borrower more than doubles its PD and lifts LGD ~6 pp under a
hot-house scenario — the intended two-channel amplification.

### 7.5 Companion analytics

- **IFRS 9 staging** — SICR triggers table (`SICR_TRIGGERS`), maturity-bucket ECL, ECL backtest,
  LLP waterfall, ECL sensitivity — most are hard-coded demonstration tables.
- **EPC / MEES** — retrofit programme, compliance horizons, stranding risk by band.
- **Regulatory** — peer-bank comparison, DQS framework (PCAF 1–5), forward-looking indicators.

### 7.6 Data provenance & limitations

- **All 80 borrowers and most staging tables are synthetic**, generated by
  `sr(seed) = frac(sin(seed+1)×10⁴)`. The PD/LGD/ECL *methodology* is real and correctly implemented.
- Climate PD uses a **multiplicative** shock (not the guide's exponential form); the physical channel
  enters PD only via a scalar warming multiplier (`(warming−1.5)×0.05`), not hazard-specific damage.
- Lifetime ECL assumes a **constant marginal PD** across years (no PD term structure) and a single
  discount rate — a standard simplification vs a full NGFS-conditioned PD curve.
- EPC haircuts apply only to Real Estate borrowers; MEES horizons are UK-specific.

**Framework alignment:** IFRS 9 §5.5 (1-yr vs lifetime ECL, SICR staging); NGFS Phase IV (scenario
`peakWarming_c` drives PD/LGD multipliers); UK MEES / EPC (the `EPC_LGD_HAIRCUT` ladder and
compliance horizons directly encode the 2025/2027/2030 minimum-standard stranding timeline); ECB
climate stress-test and BoE CBES practice for the PD-uplift design; PCAF DQS 1–5 for data quality.
Because the ECL engine is genuinely implemented, no §8 model specification is required — the
production gap is real borrower data and a scenario-conditioned PD term structure, not methodology.

## 9 · Future Evolution

### 9.1 Evolution A — Real borrower book with EPC-grounded collateral haircuts (analytics ladder: rung 2 → 3)

**What.** §7 rates this a substantive module: a real two-channel overlay
(`climatePD = basePD × (1 + transSens×priceShock) × physMult`, LGD haircuts stacking
EPC band + physical + warming), lifetime ECL, NGFS conditioning, and a UK MEES/EPC
stranding view — aligned with its guide, with the 80-borrower portfolio the only
synthetic layer. Evolution A replaces the two weakest inputs with platform data that
already exists: the UK EPC register feed (wired during the data-sources wave) grounds
the `EPC_LGD_HAIRCUT` channel in actual property-level certificates rather than
assumed band distributions, and the physical-risk scores come from the Physical Risk
Digital Twin's composite engine at collateral coordinates instead of seeded values.

**How.** (1) `borrower_book` table (or fixtures with per-field provenance) joining
collateral postcodes → EPC register records → band-based haircut, with the register's
actual band and lodgement date displayed. (2) Physical scores via the digital twin's
scoring endpoints with `resolution_tier` carried into the LGD panel. (3) Calibration
pass on the stacked haircut coefficients (EPC A:0→G:0.25, 0.02/physical point,
0.03/warming degree) against published MEES-discount and flood-discount studies —
document fit or label expert-set, per §8 model-card convention.

**Prerequisites.** EPC feed auth is the known-changed item from the data-sources wave
(verify current access route); coordinates required per collateral for twin lookups.
**Acceptance:** a G-rated fixture property shows the register-sourced band driving
its haircut; two same-sector borrowers with different collateral locations produce
different climate LGDs traceable to grid values.

### 9.2 Evolution B — Watchlist-triage analyst (LLM tier 2)

**What.** The module already has watchlist, SICR staging, covenant, and engagement
machinery — the natural assistant is a triage analyst: "which borrowers newly qualify
for Stage 2 under Disorderly at $130 carbon, and why?", "summarise the climate case
on borrower X for the credit committee" (PD/LGD decomposition, EPC status, covenant
headroom, engagement history — all fields the page carries), "what's the retrofit
economics for our G-band exposures?" (the retrofit-programme table). Re-runs execute
as client-side tool calls over `calcClimatePD`/`calcClimateLGD`/the lifetime-ECL
engine.

**How.** Tool schemas over the three calculators plus watchlist filters; the
validator ties every PD, LGD, ECL, and bps figure to invocations; committee-summary
drafts follow a fixed structure (exposure, channels, staging, actions) with each
number sourced; supervisory-framework questions cite the §5 corpus (ECB stress-test
methodology, BCBS 530).

**Prerequisites.** Evolution A preferred so summaries concern real collateral — with
synthetic borrowers the assistant must label outputs as demonstration; RBAC scoping
for borrower-level data. **Acceptance:** a Stage-2 triage list reproduces exactly on
re-run with stated parameters; a committee draft contains no numeric absent from tool
returns.