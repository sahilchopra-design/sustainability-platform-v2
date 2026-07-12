# Power Purchase Agreement Analytics
**Module ID:** `ppa-analytics` · **Route:** `/ppa-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DO5 · **Sprint:** DO

## 1 · Overview
Analyses corporate and utility Power Purchase Agreements (PPAs) — price risk, volume risk, basis risk, and contract structure optimisation. Models PPA vs merchant price comparison, renewable energy certificate (REC) value, and additionality for corporate net zero claims.

> **Business value:** Essential for corporate energy procurement teams, RE100 members, and treasury departments managing electricity price risk. Provides rigorous PPA value analysis and GHG Protocol Scope 2 market-based emission reduction verification for net zero claims.

**How an analyst works this module:**
- Input PPA terms (price, volume, tenor, structure)
- Model PPA value vs merchant price forecast scenarios
- Calculate VaR and basis risk
- Assess GHG Protocol Scope 2 market-based credit eligibility
- Analyse additionality for corporate net zero claims

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CONTRACTS`, `CREDIT_RATINGS`, `GEOGRAPHIES`, `KpiCard`, `MiniBar`, `OFFTAKER_SECTORS`, `PPA_STRUCTURES`, `TABS`, `TECH_TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PPA_STRUCTURES` | `['Physical PPA','Virtual/Financial PPA','Sleeved PPA','Proxy Revenue Swap','Green Tariff','Corporate CfD'];` |
| `CREDIT_RATINGS` | `['AAA','AA','A','BBB+','BBB','BBB-'];` |
| `TECH_TYPES` | `['Solar PV','Wind Onshore','Wind Offshore','Hybrid Solar+Storage'];` |
| `structure` | `PPA_STRUCTURES[Math.floor(sr(i*7+1)*PPA_STRUCTURES.length)];` |
| `sector` | `OFFTAKER_SECTORS[Math.floor(sr(i*11+2)*OFFTAKER_SECTORS.length)];` |
| `rating` | `CREDIT_RATINGS[Math.floor(sr(i*13+3)*CREDIT_RATINGS.length)];` |
| `tech` | `TECH_TYPES[Math.floor(sr(i*17+4)*TECH_TYPES.length)];` |
| `geo` | `GEOGRAPHIES[Math.floor(sr(i*19+5)*GEOGRAPHIES.length)];` |
| `volumeMwh` | `Math.round(10000 + sr(i*23+6)*490000);` |
| `priceFloor` | `parseFloat((25 + sr(i*29+7)*55).toFixed(1));` |
| `contractPrice` | `parseFloat((priceFloor + 5 + sr(i*31+8)*45).toFixed(1));` |
| `termYears` | `Math.round(5 + sr(i*37+9)*20);` |
| `startYear` | `2022 + Math.floor(sr(i*41+1)*5);` |
| `offtakerRisk` | `parseFloat((10 + sr(i*43+2)*75).toFixed(0));` |
| `volumeRisk` | `parseFloat((5 + sr(i*47+3)*50).toFixed(0));` |
| `priceRisk` | `parseFloat((10 + sr(i*53+4)*60).toFixed(0));` |
| `pvRatio` | `parseFloat((0.8 + sr(i*59+5)*0.6).toFixed(2));` |
| `markToMarket` | `parseFloat(((sr(i*61+6)-0.5)*20).toFixed(1));` |
| `creditExposure` | `parseFloat((0.5 + sr(i*67+7)*49.5).toFixed(1));` |
| `greenAdditionality` | `sr(i*71+8) > 0.5;` |
| `TABS` | `['Portfolio Overview','Contract Register','Offtake Risk','Price Floor Analysis','Corporate PPA','Virtual PPA','Credit Exposure','Mark-to-Market'];` |
| `avgPrice` | `filtered.reduce((s, c) => s + c.contractPrice, 0) / n;` |
| `avgFloor` | `filtered.reduce((s, c) => s + c.priceFloor, 0) / n;` |
| `totalCredit` | `filtered.reduce((s, c) => s + c.creditExposure, 0);` |
| `avgMtM` | `filtered.reduce((s, c) => s + c.markToMarket, 0) / n;` |
| `byStructure` | `PPA_STRUCTURES.map(s => {` |
| `avgCP` | `arr.length ? arr.reduce((ss, c) => ss + c.contractPrice, 0) / arr.length : 0;` |
| `avgOR` | `arr.length ? arr.reduce((ss,c)=>ss+c.offtakerRisk,0)/arr.length : 0;` |
| `avgCr` | `arr.length ? arr.reduce((ss,c)=>ss+c.creditExposure,0)/arr.length : 0;` |
| `avgRating` | `arr.length ? arr[Math.floor(arr.length/2)]?.rating \|\| 'N/A' : 'N/A';` |
| `total` | `arr.reduce((s,c)=>s+c.creditExposure,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CREDIT_RATINGS`, `GEOGRAPHIES`, `OFFTAKER_SECTORS`, `PPA_STRUCTURES`, `TABS`, `TECH_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Corporate PPA Market | — | BloombergNEF Corporate PPA 2024 | Corporate offtakers contracted 35 GW of renewable PPAs in 2023 — US 55%, Europe 30%, APAC 15% |
| Average PPA Tenor | — | RE100 PPA Data 2023 | Typical corporate PPA contract length — sufficient for project finance debt tenor (10–14 years) |
| PPA Discount to Merchant | — | BloombergNEF PPA Pricing 2024 | Corporate PPAs typically priced 5–15% below expected merchant spot — market volatility premium for certainty |
- **Power market price forward curves by region** → PPA value calculation → **PPA NPV and VaR under various price scenarios**
- **Wind/solar generation profiles vs hub prices** → Basis risk analysis → **Capture price vs hub price differential for virtual PPAs**
- **GHG Protocol Scope 2 quality criteria** → Additionality assessment → **Renewable energy claim quality for net zero reporting**

## 5 · Intermediate Transformation Logic
**Methodology:** PPA Value-at-Risk
**Headline formula:** `PPANetValue = Σ [(PPAprice - MerchantPrice_t) × Volume_t / (1+r)^t]; VaR_PPA = PPANetValue - PPANetValue(P05); BasisRisk = CapturePrice - HubPrice`

PPA net value is the NPV of price hedge benefit vs merchant; VaR measures downside if electricity prices fall below PPA strike; basis risk captures location differential — key for CFD vs physical PPAs

**Standards:** ['IRENA Corporate PPA Guide 2023', 'RE-Source Platform — Understanding PPAs 2023', 'GHG Protocol Scope 2 Guidance — Market-Based Method', 'EAC Council — Renewable Energy Certificates']
**Reference documents:** IRENA Renewable Power Purchase Agreements: Features and Trends 2023; RE-Source Platform — Understanding Corporate PPAs 2023; GHG Protocol Scope 2 Guidance (2015) — Market-Based Method; RE100 Corporate Renewable Energy Procurement Guidelines

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide gives explicit formulas for PPA valuation
> (`PPANetValue = Σ[(PPAprice − MerchantPrice_t) × Volume_t / (1+r)^t]`), a percentile-based
> `VaR_PPA = PPANetValue − PPANetValue(P05)`, and `BasisRisk = CapturePrice − HubPrice`. **None of
> these are computed.** Every risk/valuation field on a contract (`markToMarket`, `creditExposure`,
> `offtakerRisk`, `volumeRisk`, `priceRisk`) is an independent `sr()`-seeded constant — there is no
> merchant-price forward curve, no discounting, and no basis-risk decomposition anywhere in the
> code.

### 7.1 What the module computes

65 synthetic PPA contracts, each with independently-drawn fields; the only genuine computation is
portfolio-level averaging/summation over whatever subset the user has filtered:

```js
avgPrice     = Σ contractPrice / n
avgFloor     = Σ priceFloor / n
totalCredit  = Σ creditExposure                       // sum of independent random draws
avgMtM       = Σ markToMarket / n                      // sum of independent random draws
atRiskContracts = count(priceScenario < priceFloor)     // real comparison, but against a random floor
```

### 7.2 Parameterisation

| Field | Formula | Range | Provenance |
|---|---|---|---|
| `contractPrice` | `priceFloor + 5 + sr()×45` | Floor+5 to Floor+50 $/MWh | Synthetic, floor-anchored so price ≥ floor by construction |
| `priceFloor` | `25 + sr()×55` | $25–80/MWh | Synthetic |
| `markToMarket` | `(sr()−0.5)×20` | −$10 to +$10/MWh | **Fabricated** — labelled "vs current market" but no market curve exists |
| `creditExposure` | `0.5 + sr()×49.5` | $0.5–50M | **Fabricated** — labelled counterparty credit exposure, not derived from offtaker rating or volume |
| `offtakerRisk`/`volumeRisk`/`priceRisk` | `10-85`/`5-55`/`10-70` (0–100 scale) | Independent `sr()` draws | Synthetic, uncorrelated with the contract's actual `rating` field |
| `pvRatio` | `0.8 + sr()×0.6` | 0.8–1.4 | Synthetic "PPA value ratio", not computed from a discounted cash flow |
| `greenAdditionality` | `sr() > 0.5` | boolean | Synthetic coin-flip, not tied to any additionality assessment criteria |

Note `offtakerRisk` is drawn independently of the contract's `rating` field (AAA…BBB-), so a AAA-
rated offtaker can show a higher `offtakerRisk` score than a BBB- offtaker — an internal
inconsistency a real credit-risk model would not produce.

### 7.3 Calculation walkthrough

1. 65 contracts generated once at module load, each field independently seeded.
2. Filters (structure / sector / geography) narrow `filtered`; sort toggles any numeric column.
3. **Price Scenario slider** ($20–100/MWh) drives `atRiskContracts = count(priceScenario <
   priceFloor)` — a genuine comparison, but `priceFloor` itself carries no economic meaning beyond
   being a random number the contract's `contractPrice` was anchored above by construction.
4. **By-structure aggregation** (`byStructure`): groups the full 65-contract universe (not the
   filtered subset) by PPA structure type, averaging `contractPrice` and summing `creditExposure`
   per structure — real aggregation over synthetic per-contract inputs.

### 7.4 Worked example

Filtered to 3 contracts: A (price=$65, floor=$40, MtM=+$3.2, credit=$12M), B (price=$52, floor=$35,
MtM=−$1.5, credit=$8M), C (price=$78, floor=$55, MtM=+$5.0, credit=$22M).

| Output | Computation | Result |
|---|---|---|
| avgPrice | (65+52+78)/3 | $65.0/MWh |
| avgFloor | (40+35+55)/3 | $43.3/MWh |
| totalCredit | 12+8+22 | $42M |
| avgMtM | (3.2−1.5+5.0)/3 | +$2.23/MWh |
| atRiskContracts @ priceScenario=$50 | count(50<40, 50<35, 50<55) | 1 (only C) |

The "at risk" flag is a real inequality check, but since `priceFloor` is a random number rather than
a contract-specific strike derived from actual negotiated terms, the count has no forecasting value.

### 7.5 Data provenance & limitations

- **All 65 contracts are entirely synthetic**, `sr()`-seeded independently field-by-field; no two
  fields on a contract are causally linked (e.g. `creditExposure` does not scale with `volumeMwh` or
  respond to `rating`).
- No merchant/hub price forward curve exists on the platform for this module to discount against —
  the guide's NPV and VaR formulas cannot be computed without one.
- `greenAdditionality` and GHG Protocol Scope 2 market-based-method eligibility are asserted by coin
  flip, not assessed against the guide's cited quality criteria (vintage, geographic/temporal
  matching, EAC/REC/GOO type).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute genuine PPA economic value, downside VaR, and basis risk for corporate/utility renewable
offtake contracts, replacing today's per-contract random fields — supporting corporate energy
procurement, treasury hedge accounting, and RE100/Scope-2 market-based reporting decisions.

### 8.2 Conceptual approach
A **forward-curve discounted cash-flow hedge-value model**, the standard commodity-hedge valuation
approach used by utility risk desks and consistent with IRENA's Corporate PPA Guide framing of a PPA
as a financial hedge against merchant price risk; basis risk follows the standard "capture price vs
hub price" decomposition used for virtual/CfD-style PPAs (mirrors how ISO/RTO congestion-hedge
desks and RE-Source Platform materials frame VPPA risk).

### 8.3 Mathematical specification
```
PPANetValue = Σ_t [ (PPAprice − MerchantForward_t) × Volume_t ] / (1+r)^t
VaR_PPA,α   = PPANetValue(median path) − quantile_α( PPANetValue | MonteCarlo merchant-price paths )
BasisRisk_t = CapturePrice_t − HubPrice_t     # generation-weighted realised price vs settlement hub
CreditExposure = max(0, PPANetValue) × PD(offtaker_rating) × LGD      # counterparty credit risk, IFRS 9-consistent
```

| Parameter | Calibration source |
|---|---|
| `MerchantForward_t` | Regional power forward curve (ICE/EEX/PJM published forwards, or vendor) |
| Volatility for Monte Carlo | Historical merchant-price return volatility by region |
| `PD(rating)` | Standard corporate PD-by-rating table (S&P/Moody's, or platform's existing credit-risk engine) |
| `CapturePrice_t` | Generation-profile-weighted average realised price (needs asset generation shape) |
| `r` | Contract discount rate / counterparty cost of capital |

### 8.4 Data requirements
Regional forward price curves (new — not currently on platform), generation shape by technology
(solar/wind capacity factor profiles), offtaker credit ratings (present as a static field, needs PD
mapping), contract cash-flow schedule. The platform's existing credit-risk / PD-mapping engines
(used elsewhere for corporate bond pricing) could be reused for the `PD(rating)` term.

### 8.5 Validation & benchmarking plan
Reconcile `PPANetValue` against independently-priced hedge value for a known reference contract;
backtest `BasisRisk` against realised capture-price data for wind/solar generation in a liquid
market (e.g. ERCOT, EU day-ahead); stress `VaR_PPA` under historical extreme merchant-price events
(2021-22 European power crisis) as a tail-risk sanity check.

### 8.6 Limitations & model risk
Forward curves beyond 5–7 years are illiquid/extrapolated; generation-shape assumptions for capture
price are asset-specific and uncertain pre-construction; counterparty PD tables are cross-sector
averages, not offtaker-specific. Conservative fallback: present VaR as a scenario range (P10/P50/P90
merchant-price paths) rather than a single point estimate, and flag contracts beyond the liquid
forward-curve horizon as "extrapolated valuation — lower confidence."

## Framework alignment

**IRENA Renewable PPA Guide (2023)** — the hedge-value framing (PPA price vs merchant price
differential) is the correct conceptual model; not implemented in code. **GHG Protocol Scope 2
Guidance (Market-Based Method)** — the guide correctly names the criteria (vintage, geographic
matching, EAC delivery) that determine additionality/quality; the code's `greenAdditionality` field
is a coin flip, not an assessment against these criteria. **RE100 Procurement Guidelines** — cited
correctly as context for corporate PPA tenor norms (12–15 years); not tied to any contract-level
computation.

## 9 · Future Evolution

### 9.1 Evolution A — Forward-curve hedge valuation replacing seeded-random risk fields (analytics ladder: rung 1 → 3)

**What.** Today this is a tier-B frontend page whose only genuine computation is filtering/averaging over 65 synthetic contracts; §7 flags that the guide's own formulas (`PPANetValue`, `VaR_PPA`, `BasisRisk`) are never computed, and `markToMarket`, `creditExposure`, `offtakerRisk` etc. are independent `sr()` draws — a AAA offtaker can score riskier than a BBB-. Evolution A implements the §8 model spec as this module's first backend vertical: a forward-curve DCF hedge-value engine with Monte-Carlo VaR and capture-vs-hub basis decomposition.

**How.** (1) New `api/v1/routes/ppa_valuation.py` with `POST /value` computing `Σ[(PPAprice − MerchantForward_t) × Volume_t/(1+r)^t]`, `POST /var` (merchant-price path simulation), and `GET /forward-curves`. (2) Seed a `ref_power_forward_curves` table per §8.4 (regional forwards — the platform has none today; EIA/ENTSO-E ingesters are the natural feed) plus a PD-by-rating table so `creditExposure = max(0, NPV) × PD(rating) × LGD` finally responds to the contract's `rating` field. (3) Replace per-contract random fields with engine-derived values; `greenAdditionality` becomes a criteria checklist (vintage/geography/EAC type per GHG Protocol Scope 2), not a coin flip.

**Prerequisites.** Forward-curve data source secured (hard prerequisite — §7.5 states the NPV formula "cannot be computed without one"); contract register persisted (new table) instead of load-time generation. **Acceptance:** two contracts differing only in offtaker rating produce ordered credit exposures; bench_quant pins one reference contract's NPV/VaR.

### 9.2 Evolution B — Procurement copilot for RE100/Scope-2 claims (LLM tier 1)

**What.** A copilot for corporate energy-procurement users answering "is this PPA structure eligible for market-based Scope 2 claims?", "what drives this contract's at-risk flag?", and "explain sleeved vs virtual PPA for our treasury memo" — grounded strictly in this module's Atlas record and the GHG Protocol Scope 2 market-based criteria the guide already cites (§5 standards list).

**How.** Standard tier-1 pattern: `POST /api/v1/copilot/ppa-analytics/ask` over pgvector chunks of this page (§4.1 metric interpretations, §7 limitations, §8 spec). Critically, until Evolution A ships the copilot's system prompt must carry the §7 mismatch flag verbatim: it may explain the price-scenario slider's genuine inequality check (`priceScenario < priceFloor`) but must refuse to interpret `markToMarket` or `creditExposure` as economic quantities, stating they are synthetic placeholders. After Evolution A, upgrade to tier-2 tool-calling against `/value` and `/var` for "re-value at $40/MWh forwards" what-ifs.

**Prerequisites.** Atlas corpus embedded (D3 pgvector stage); refusal-path eval cases written from §7.5's fabrication list. **Acceptance:** copilot refuses to attribute meaning to any field §7.2 marks "Fabricated" and cites GHG Protocol criteria (not the coin-flip field) when asked about additionality.