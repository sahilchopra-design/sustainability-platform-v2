# EM Debt Climate Risk
**Module ID:** `em-debt-climate-risk` · **Route:** `/em-debt-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Prices climate transition and physical risk into emerging market sovereign and corporate debt spreads. Integrates NGFS scenario pathways with country-level vulnerability indices and issuer-level carbon intensity to derive climate-adjusted credit spreads. Supports portfolio construction, relative value analysis, and regulatory stress testing across EM fixed income universes.

> **Business value:** Enables fixed income portfolio managers to identify climate-mispriced EM debt, tilt allocations toward NDC-aligned issuers, and satisfy TCFD Pillar 2 disclosure requirements for climate risk in investment portfolios.

**How an analyst works this module:**
- Select sovereign or corporate issuer universe and apply country or sector filters.
- Choose NGFS scenario (Orderly/Disorderly/Hot House) and time horizon (2030/2040/2050).
- Review climate-adjusted OAS decomposition and identify issuers with largest unpriced risk premium.
- Run stress scenario to project spread widening under tail physical risk event and export to portfolio risk system.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CustomTooltip`, `DNS_DEALS`, `EM_COUNTRIES`, `GREEN_BOND_ISSUANCES`, `KpiCard`, `RATING_COLORS`, `REGION_COLORS`, `SPREAD_COLORS`, `SPREAD_DATA`, `SectionHeader`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `EM_COUNTRIES` | 51 | `name`, `region`, `debtToGdpPct`, `fiscalBalancePct`, `foreignCurrencyDebtPct`, `climateVulnerabilityScore`, `creditRating`, `climateCreditRiskAdj`, `greenBondIssuedBnUSD`, `sustainabilityLinkedBondBnUSD`, `debtForNatureSwapCompleted`, `debtForNatureSwapSizeMnUSD`, `carbonRevenuePotentialBnUSD`, `ndcFinancingGapBnUSD`, `climateDebtRiskScore`, `gdpBnUSD` |
| `GREEN_BOND_ISSUANCES` | 21 | `amount`, `year`, `coupon`, `tenor`, `useOfProceeds`, `oversubscription` |
| `DNS_DEALS` | 13 | `debtRelievedMnUSD`, `conservationCommitmentMnUSD`, `partner`, `year`, `ecosystemType`, `co2SequesteredMtpa` |
| `SPREAD_DATA` | 9 | `Brazil`, `Colombia`, `Indonesia`, `Pakistan`, `Egypt`, `SriLanka`, `Ghana`, `Turkey`, `India`, `Philippines` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `["Overview","Debt Sustainability","Green Bond Market","Debt-for-Nature Swaps","Sovereign Credit Risk","Transition Finance","Country Profiles"];` |
| `dir` | `sortDir === "asc" ? 1 : -1;` |
| `scatterData` | `useMemo(() => EM_COUNTRIES.map(c => ({` |
| `totalGreenBonds` | `EM_COUNTRIES.reduce((s,c) => s+c.greenBondIssuedBnUSD, 0);` |
| `totalDNSMn` | `DNS_DEALS.reduce((s,d) => s+d.debtRelievedMnUSD, 0);` |
| `avgClimateRisk` | `(EM_COUNTRIES.reduce((s,c) => s+c.climateDebtRiskScore, 0)/ Math.max(1, EM_COUNTRIES.length)).toFixed(1);` |
| `totalNdcGap` | `EM_COUNTRIES.reduce((s,c) => s+c.ndcFinancingGapBnUSD, 0).toFixed(0);` |
| `totalCarbon` | `EM_COUNTRIES.reduce((s,c) => s+c.carbonRevenuePotentialBnUSD, 0).toFixed(0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DNS_DEALS`, `EM_COUNTRIES`, `GREEN_BOND_ISSUANCES`, `SPREAD_DATA`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate Risk Premium (bps) | — | NGFS/IMF | Incremental spread attributable to unpriced climate risk; high values signal mispriced sovereign paper. |
| NDC Alignment Score | — | UNFCCC NDC Registry | Measures issuer decarbonisation trajectory vs. Paris-compatible pathway; below 40 indicates high transition risk. |
| Physical Vulnerability Index | — | ND-GAIN 2024 | Country-level composite of exposure, sensitivity, and adaptive capacity; above 0.7 triggers spread overlay. |
| Carbon Intensity (tCO2e/$M Rev) | — | Trucost/CDP | Corporate issuer emission intensity; benchmarked against sector median and 1.5Â°C budget ceiling. |
- **NGFS scenario database** → Map GDP and carbon price paths to country credit fundamentals → **Transition risk beta by country/sector**
- **ND-GAIN vulnerability scores** → Normalise to 0â€“1 scale and apply hazard-specific weights → **Physical risk premium overlay (bps)**
- **Issuer carbon intensity data (Trucost)** → Benchmark vs. sector 1.5Â°C budget; compute deviation → **Corporate climate spread adjustment**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted Spread Model
**Headline formula:** `OAS_climate = OAS_base + β_trans × TransitionRisk + β_phys × PhysicalRisk`

Decomposes observed OAS into a base credit component and two additive climate risk premia. Transition beta is calibrated from sector carbon intensity relative to national NDC targets. Physical beta incorporates ND-GAIN country vulnerability scores and asset-level hazard exposure.

**Standards:** ['NGFS Phase IV', 'TCFD', 'IMF Climate Spillovers 2023']
**Reference documents:** NGFS Phase IV Scenarios 2023; IMF WP/23/145 â€” Climate and Sovereign Risk; ND-GAIN Country Index, Notre Dame 2024; BIS Working Paper 1089 â€” Climate Risk and Bond Spreads

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

EM Debt Climate Risk analyses **sovereign debt through a climate lens** across 51 emerging-market
countries: debt/GDP, fiscal balance, FX-debt share, climate vulnerability, a climate credit-risk spread
adjustment (bps), green/sustainability-linked bond issuance, debt-for-nature swaps, EMBI spreads, and NDC
financing gaps. The data is largely **curated real-world values**; the page's derived quantities are
aggregations and a composite climate-debt risk score. No guide record supplied → no mismatch flag.

### 7.1 What the module computes

Each country carries a per-country **`climateDebtRiskScore` (0–100)** and **`climateCreditRiskAdj` (bps)**
as **authored fields** — they are not derived by an in-page formula; the page consumes them. Derived
analytics are aggregations:
```
Portfolio climate-debt risk = weighted mean of climateDebtRiskScore (by GDP or exposure)
Spread vs climate-vulnerability scatter (EMBI spread × climateVulnerabilityScore, bubble = debt/GDP)
DNS impact = Σ DNS_DEALS.debtRelievedMnUSD ; Σ conservationCommitment ; Σ co2SequesteredMtpa
Green-bond depth = Σ greenBondIssuedBnUSD by region/country
NDC financing gap = Σ ndcFinancingGapBnUSD
```

### 7.2 Parameterisation / data tables

| Table | Rows | Contents |
|---|---|---|
| `EM_COUNTRIES` | 51 | debt/GDP, fiscal balance, FX-debt %, climate vulnerability, credit rating, **climateCreditRiskAdj (bps)**, green/SLB issuance, DNS completed/size, carbon-revenue potential, NDC gap, **climateDebtRiskScore**, GDP |
| `GREEN_BOND_ISSUANCES` | 20 | sovereign green bonds: amount, year, coupon, tenor, use of proceeds, oversubscription |
| `DNS_DEALS` | 12 | debt-for-nature swaps: debt relieved, conservation commitment, partner (TNC/WWF), ecosystem, CO₂ Mtpa |
| `SPREAD_DATA` | 8 | quarterly EMBI-style spreads (bps) for 10 countries Q1-22→Q4-23 |

The `climateCreditRiskAdj` values track real distress signals: Lebanon 350bps, Zambia 228, Sri Lanka 210,
Ghana 202 (all in default/SD), vs Poland 14, Chile 18, Hungary 18 (investment-grade, low climate spread).
The **EMBI spreads are real historical magnitudes** (Sri Lanka blowing out to 3,890bps in Q4-22 during
default; Pakistan spiking to 1,312bps in Q1-23). Green-bond and DNS deals are real transactions (Ecuador
Galápagos $1,632M swap, Belize $364M, Indonesia $485M).

### 7.3 Calculation walkthrough

1. Load the 51-country table and the green-bond / DNS / spread tables.
2. Risk map: scatter climate-vulnerability vs EMBI spread (bubble = debt/GDP), coloured by region.
3. Green-finance tab: aggregate issuance, oversubscription and coupon trends.
4. DNS tab: sum debt relieved / conservation commitment / CO₂ sequestered; leverage ratio =
   conservation commitment / debt relieved.
5. NDC gap tab: rank countries by financing gap vs GDP.

### 7.4 Worked example (debt-for-nature swap leverage)

Ecuador DNS: debt relieved $1,632M, conservation commitment $450M, CO₂ 2.1 Mtpa.
```
Conservation leverage = 450 / 1632 = 27.6% of debt relief redirected to conservation
Debt reduction realised = 1632 − 450 = $1,182M net fiscal space freed
Cost-effectiveness = 450 / 2.1 = $214M per MtCO₂e-yr protected
```
This is the real Galápagos Marine "Bond" swap (2023, TNC-arranged) — the module reproduces its structure:
a haircut on distressed sovereign debt, with a portion earmarked for marine conservation.

### 7.5 Data provenance & limitations

- **Country and deal data are curated real-world values** (IMF debt/GDP, EMBI spreads, sovereign green
  bonds, TNC/WWF DNS deals) — a strong, realistic snapshot.
- **`climateDebtRiskScore` and `climateCreditRiskAdj` are authored per-country scores**, not derived from
  a documented model — they are the module's key "climate spread" outputs and lack a transparent
  derivation (the §8 spec below fills this gap).
- Spreads are a fixed historical panel (Q1-22→Q4-23), not live.
- Only 10 of 51 countries have the quarterly spread series.

**Framework alignment:** **sovereign climate-risk** analysis in the style of the **NGFS sovereign work**
and **World Bank Sovereign ESG**; **EMBI** (JPMorgan Emerging Market Bond Index) spreads; **debt-for-nature
swaps** (TNC "blue/green bond" conversions of distressed sovereign debt); **sovereign green/sustainability-
linked bonds** (ICMA Green Bond Principles); **NDC financing gaps** (UNFCCC/CPI). The climate-vulnerability
scores echo **ND-GAIN** country vulnerability.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code (climate sovereign spread model).**

### 8.1 Purpose & scope
Derive the `climateCreditRiskAdj` (climate component of the sovereign spread, in bps) and
`climateDebtRiskScore` from a transparent model rather than authored values — supporting EM sovereign
credit allocation and climate-adjusted fair-value spread estimation. Scope: the 51 EM sovereigns.

### 8.2 Conceptual approach
A **two-part sovereign model**: (a) a **base credit spread** from rating/fiscal fundamentals, and (b) a
**climate spread overlay** decomposing physical (ND-GAIN vulnerability, EM-DAT losses) and transition
(fossil dependency, stranded fiscal revenue) channels, conditioned on debt sustainability. Benchmarks:
NGFS sovereign climate risk, World Bank/IMF debt-sustainability analysis (DSA), Moody's/S&P sovereign ESG
methodologies, academic sovereign-climate-spread studies (e.g. Beirne et al.).

### 8.3 Mathematical specification
```
Base spread s0 = f(rating, debt/GDP, fiscalBalance, FXdebt%)      (rating-implied + fundamentals)
Physical premium  = γ_phys · vulnerability · (1 + debtStress)      vulnerability = ND-GAIN, EM-DAT loss/GDP
Transition premium = γ_trans · fossilRevShare · carbonPriceExposure
climateCreditRiskAdj (bps) = physical premium + transition premium − greenFinanceOffset
climateDebtRiskScore = clamp( w1·debtStress + w2·vulnerability + w3·transitionExposure )
greenFinanceOffset = min(cap, β·greenBondDepth + δ·DNS_reliefShare)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Base spread map | s0 | rating→spread curve (EMBI history) |
| Physical elasticity | γ_phys | Beirne et al. / IMF climate-spread estimates |
| Transition elasticity | γ_trans | NGFS transition fiscal-revenue loss |
| Vulnerability | — | ND-GAIN, EM-DAT loss/GDP |
| Green offset | β, δ | observed greenium + DNS leverage |

### 8.4 Data requirements
Sovereign fundamentals (IMF WEO debt/GDP, fiscal balance, FX-debt), rating, ND-GAIN vulnerability, EM-DAT
disaster losses, fossil fiscal-revenue share, green-bond and DNS records. Free: IMF WEO, ND-GAIN, EM-DAT,
World Bank; the module already holds the country panel, green-bond, DNS and spread tables.

### 8.5 Validation & benchmarking plan
Regress modelled climate spread on realised EMBI spread controlling for rating (target significant climate
coefficient); reconcile against IMF/NGFS sovereign climate-spread estimates; backtest that rising
vulnerability leads spread widening; sensitivity of the green offset to greenium assumptions.

### 8.6 Limitations & model risk
Sovereign climate spreads are confounded by macro/political factors and hard to isolate; distressed
sovereigns (SD) have discontinuous spreads. Conservative fallback: bound the climate overlay (e.g. ≤150bps
for non-distressed) and disclose the physical/transition decomposition rather than a single opaque number.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the spread adjustment instead of authoring it (analytics ladder: rung 1 → 3)

**What.** The page's 51-country dataset is genuinely curated (debt/GDP, FX-debt share, green/SLB issuance, 12 real debt-for-nature deals, quarterly EMBI-style spreads), but its two headline outputs — `climateCreditRiskAdj` (bps) and `climateDebtRiskScore` — are **authored fields the page merely consumes**; the guide's model `OAS_climate = OAS_base + β_trans·TransitionRisk + β_phys·PhysicalRisk` is not implemented anywhere. Evolution A implements it, and calibrates the betas rather than asserting them.

**How.** (1) Backend `services/em_debt_spread_engine.py`: physical risk from ND-GAIN scores (already an ETL source), transition risk from fossil-export dependence and NDC ambition (shareable with `em-climate-risk`'s engine profiles — these two modules should consume one country table, not two divergent ones). (2) Calibrate β_trans/β_phys by panel regression of the observed EMBI spreads on the vulnerability measures, following the module's own cited BIS WP 1089 / IMF WP/23/145 designs; report R² and confidence intervals in the response instead of presenting point adjustments as fact — this calibration is what earns rung 3. (3) The curated tables move to DB rows with `source`/`as_of_date`; `SPREAD_DATA` extends past its current Q4-23 endpoint via a market-data ingester. (4) The "unpriced risk premium" screen in the workflow becomes computable: observed spread minus model spread, per issuer.

**Prerequisites.** Spread data licensing (EMBI is proprietary — decide on a public proxy like FRED EMBI aggregates or licensed feed); coordination with `em-climate-risk` on the shared country table. **Acceptance:** the displayed bps adjustment for a fixture country equals the regression model's output with published fit statistics; DNS and green-bond aggregations reconcile to sourced rows.

### 9.2 Evolution B — EM relative-value screener with model-vs-market narration (LLM tier 2)

**What.** The module's stated purpose — "identify climate-mispriced EM debt" — as a tool-calling analyst: "which single-B sovereigns trade tighter than their climate-adjusted fair value implies, and what's the vulnerability driver?" It queries Evolution A's model-spread endpoint, computes the mispricing gap per issuer from tool outputs, and drafts the relative-value note including the DNS/green-issuance context the page already curates (e.g. flagging when a candidate has an executed debt-for-nature swap that changes its effective debt service).

**How.** Tools: `get_model_spread(country, scenario, horizon)`, `get_observed_spreads`, `query_countries(filters)`, `get_dns_deals(country)`. Grounding corpus = this Atlas record's §5 formula and §7.2 table definitions, plus the calibration statistics so the analyst can honestly caveat low-R² regions ("the model explains 40% of spread variance in Sub-Saharan Africa — treat gaps as screening signals, not alpha"). Every bps figure validator-checked; scenario definitions quoted from the NGFS metadata, not memory.

**Prerequisites (hard).** Evolution A — today the copilot would present authored bps adjustments as model output, misrepresenting curation as calculation. **Acceptance:** a golden screen's mispricing list reproduces from scripted tool calls; the note always discloses model fit for the relevant region; countries without observed spread data are excluded with a stated reason, not imputed.