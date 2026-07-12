# Green Securitisation Analytics
**Module ID:** `green-securitization` · **Route:** `/green-securitization` · **Tier:** B (frontend-computed) · **EP code:** EP-DW5 · **Sprint:** DW

## 1 · Overview
Green securitisation analytics covering green ABS (solar/EV/PACE), green RMBS (energy-efficient mortgages), green CLO (green loans), use-of-proceeds waterfall, SPV structuring, greenium quantification and EU Green Bond Standard applicability.

> **Business value:** Green securitisation commands a 5–10 bps greenium across solar ABS, EV lease ABS and energy-efficient RMBS; EU Green Bond Standard applicability requires full EU Taxonomy alignment of the underlying asset pool, raising the bar versus ICMA GBP self-labelling.

**How an analyst works this module:**
- Screen underlying asset pool for green eligibility by asset class (solar/EV/PACE/mortgages/green loans)
- Structure SPV with use-of-proceeds waterfall separating green and non-green tranches
- Apply ICMA GBP or EU GBS framework for second-party opinion and pre-issuance disclosure
- Quantify expected greenium and model impact on all-in financing cost vs conventional securitisation

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_CLASSES`, `CREDIT_ENHANCE`, `GREEN_FRAMEWORKS`, `INVESTOR_BASE`, `MARKET_ISSUANCE`, `TABS`, `TRANCHES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ASSET_CLASSES` | 7 | `name`, `type`, `assetType`, `avgBalance`, `fico`, `ltv`, `yieldSpr`, `greenPct`, `carbonAvoid`, `poolSize` |
| `TRANCHES` | 7 | `rating`, `attachPct`, `detachPct`, `couponSpr`, `size`, `lossAbsorb`, `creditEnhance` |
| `CREDIT_ENHANCE` | 7 | `typical`, `cost`, `effect`, `mechanic` |
| `GREEN_FRAMEWORKS` | 7 | `scope`, `eligibility`, `verification`, `greenium`, `coverage` |
| `MARKET_ISSUANCE` | 7 | `greenAbs`, `greenRmbs`, `greenCmbs`, `pace`, `total` |
| `INVESTOR_BASE` | 7 | `aum`, `demandGrowth`, `greeniumSensitivity`, `kpiRequirements`, `typical` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annLoss` | `poolBal * (cdrPct / 100) * (lgdPct / 100);` |
| `annPrepay` | `poolBal * (cprPct / 100);` |
| `totalInterest` | `poolBal * (poolYield / 100);` |
| `notional` | `poolBal * t.size / 100;` |
| `lossRate` | `notional > 0 ? absorbed / notional : 0;` |
| `coupon` | `t.couponSpr !== null ? notional * (t.couponSpr / 10000) : 0;` |
| `excessSpread` | `Math.max(0, totalInterest - results.reduce((s, r) => s + r.coupon * 1000, 0)) / 1e6;` |
| `seniorNotional` | `poolM * 0.82;` |
| `mezzNotional` | `poolM * 0.165;` |
| `equityNotional` | `poolM * 0.015;` |
| `seniorCost` | `seniorNotional * (seniorSpr - greeniumBps * greenPct / 100) / 10000;` |
| `mezzCost` | `mezzNotional * mezzSpr / 10000;` |
| `wac` | `(seniorCost + mezzCost) / (poolM * 0.985);` |
| `greenBenefit` | `poolM * greeniumBps * greenPct / 100 / 10000;` |
| `pricing` | `useMemo(() => calcGreenPricing({ poolM: poolM * 1e6, greenPct: asset.greenPct, framework, wacc: 5.5, seniorSpr, mezzSpr }), [poolM, asset, framework, seniorSpr, mezzSpr]);` |
| `trancheChart` | `useMemo(() => TRANCHES.map(t => ({` |
| `stressLossData` | `useMemo(() => [ { scenario: 'Base', cdr: cdrPct, loss: parseFloat(calcWaterfall({ poolBal: poolM * 1e6, poolYield: 7, cprPct, cdrPct, lgdPct, tranches: TRANCHES }).annLossMm) }, { scenario: 'Mild', cdr: cdrPct * 2, loss: parseFloat(calcWaterfall({ poolBal: poolM * 1e6, poolYield: 7, cprPct, cdrPct: cdrPct * 2, lgdPct, tranches: TRANCHES }` |
| `poolComposition` | `useMemo(() => ASSET_CLASSES.map((a, i) => ({` |
| `carbonImpact` | `useMemo(() => ({ annCO2Avoided: (asset.carbonAvoid * poolM / 100).toFixed(1), lifetimeCO2: (asset.carbonAvoid * poolM / 100 * 20).toFixed(0), equivalentCars: Math.round(asset.carbonAvoid * poolM / 100 * 1000 / 4.6), }), [asset, poolM]);` |
| `arrangementFee` | `poolM * 1e6 * arrangementBps / 10000 / 1e3;` |
| `annualServicing` | `poolM * 1e6 * 0.0012 / 1e3;` |
| `lifetimeRev` | `arrangementFee + (annualServicing + reportingFee) * 5;` |
| `badge` | `(c) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: c === 'AAA' ? '#065f46' : c === 'AA' ? '#1e40af' : c === 'A' ? '#1d4ed8' : c === 'BBB' ? '#92400e' : c ==` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_CLASSES`, `CREDIT_ENHANCE`, `GREEN_FRAMEWORKS`, `INVESTOR_BASE`, `MARKET_ISSUANCE`, `TABS`, `TRANCHES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Greenium (Green Premium) | `Greenium = YTM_Conv − YTM_Green on matched-maturity, same-credit tranches` | ICMA STS Green ABS / Bloomberg data | Investor demand premium for labelled green securitisations; varies by asset class and ESG mandate penetration. |
| Solar ABS Green Eligibility | `Eligibility = Loan Purpose × Taxonomy SC Check` | ICMA GBP + EU GBS Criteria | Solar consumer loans and leases are core eligible asset class; EU GBS requires Taxonomy alignment. |
| EV Lease ABS Green Eligibility | `Eligibility = Vehicle Category × Emissions Standard` | EU Taxonomy 6.5 + ICMA GBP | BEV and FCEV lease receivables fully eligible; PHEV eligibility dependent on utility factor methodology. |
- **Loan-level asset pool data + ICMA/EU GBS eligibility criteria** → Use-of-proceeds waterfall → greenium pricing model → **Green securitisation structuring and analytics dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** Greenium Calculation
**Headline formula:** `Greenium = YTM_Conventional_Comparable − YTM_Green_Equivalent (bps)`

Yield differential between green and conventional ABS/RMBS/CLO tranches with matched risk profiles.

**Standards:** ['ICMA — Green Bond Principles 2021', 'EBA — Discussion Paper on Green Bonds (2020)']
**Reference documents:** ICMA — Green Bond Principles (2021); EBA — Discussion Paper on the Role of Environmental Risks in the Prudential Framework (2020); SFA — ESG in Securitisation Market Practice Guidelines (2022)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ℹ️ **Guide↔code note.** The guide (EP-DW5) frames this as a *greenium calculator*
> (`Greenium = YTM_conv − YTM_green`). The page is broader: a 10-tab green-ABS/RMBS/CMBS structuring
> suite whose two live engines are (a) a sequential loss-waterfall (`calcWaterfall`) and (b) a green
> all-in-cost pricer (`calcGreenPricing`). The greenium appears as a fixed per-framework lookup, not
> a matched-pair yield differential — so the guide's headline formula is *approximated*, not literally
> implemented. Everything else on the page is either the two engines or static reference tables.

### 7.1 What the module computes

**Waterfall engine** (`calcWaterfall`) — reverse-order sequential loss allocation:

```js
annLoss       = poolBal × (cdrPct/100) × (lgdPct/100)     // annual credit loss
totalInterest = poolBal × (poolYield/100)
// iterate tranches bottom-up (junior first):
notional  = poolBal × t.size/100
absorbed  = min(remaining, notional)                      // this tranche eats losses
lossRate  = absorbed / notional
coupon    = notional × (t.couponSpr/10000)                // spread-only coupon
remaining = max(0, remaining − notional)
excessSpread = max(0, totalInterest − Σ coupon)
```

**Green pricing engine** (`calcGreenPricing`) — all-in weighted-average cost with greenium credit:

```js
greeniumBps = {EU GBS:6, ICMA GBP:3, CBS:5, SFDR Art9:2, Fannie Green:9, PACE:12}[framework] ?? 4
seniorCost  = (poolM×0.82) × (seniorSpr − greeniumBps × greenPct/100) / 10000
mezzCost    = (poolM×0.165) × mezzSpr / 10000
wac         = (seniorCost + mezzCost) / (poolM×0.985)          // reported in bps
greenBenefit= poolM × greeniumBps × greenPct/100 / 10000       // $ saved
```

The greenium only reduces the **senior** spread, scaled by `greenPct` (pool green share).

### 7.2 Parameterisation / structural constants

`TRANCHES` — 6-class waterfall (provenance: standard STS ABS structure, illustrative spreads):

| Class | Rating | Attach–Detach % | Size % | Coupon spread (bps) |
|---|---|---|---|---|
| A | AAA | 18–100 | 82 | 45 |
| B | AA | 12–18 | 6 | 90 |
| C | A | 7–12 | 5 | 150 |
| D | BBB | 4–7 | 3 | 250 |
| E | BB | 1.5–4 | 2.5 | 450 |
| F/Equity | NR | 0–1.5 | 1.5 | — (first loss) |

`ASSET_CLASSES` (6 rows) carry real market-plausible tape stats — Solar ABS FICO 742, greenPct 100%,
carbonAvoid 4.2 t/$100K; Green RMBS avgBalance $385K, LTV 72%. `GREEN_FRAMEWORKS` greenium ranges
(EU GBS 3–8 bps, ICMA GBP 2–5, PACE 8–15) match CBI/market observation. `MARKET_ISSUANCE` 2019–2024
is a hard-coded trend ($62B→$231B). Stress multipliers on CDR: base 1×, mild 2×, severe 4×, extreme 7×.

### 7.3 Calculation walkthrough

`poolM` (slider), CPR, CDR, LGD and the selected framework feed both engines. `waterfall` applies a
scenario multiplier to CDR (`base/mild/severe/extreme`), sets pool yield = `asset.yieldSpr/100 + 4.5`
(spread + a 4.5% base rate), then runs `calcWaterfall`. `pricing` runs `calcGreenPricing` on the
selected asset's `greenPct`. Carbon impact: `annCO2Avoided = carbonAvoid × poolM / 100`, lifetime ×20,
car-equivalent ÷4.6 t/car/yr.

### 7.4 Worked example (Solar ABS, base case)

`poolM = 500` (→ poolBal $500M), CDR 1.8%, LGD 35%, framework ICMA GBP, greenPct 100%,
seniorSpr 55, mezzSpr 185:

| Step | Computation | Result |
|---|---|---|
| annLoss | 500M × 0.018 × 0.35 | $3.15M |
| junior class F notional | 500M × 1.5% | $7.5M |
| F absorbs | min(3.15, 7.5) | $3.15M (loss rate 42%) |
| remaining after F | max(0, 3.15 − 7.5) | $0 — senior classes untouched |
| greenium (ICMA GBP) | lookup | 3 bps |
| senior effective spread | 55 − 3×100/100 | 52 bps |
| seniorCost | 500M×0.82 × 52/10000 | $2.13M |
| mezzCost | 500M×0.165 × 185/10000 | $1.53M |
| WAC | (2.13+1.53)/(500M×0.985) | ≈74 bps |
| greenBenefit | 500M × 3 × 100/100 / 10000 | $0.15M |
| annCO2Avoided | 4.2 × 500/100 | 21.0 ktCO₂/yr |

The $3.15M annual loss is fully absorbed by the 1.5% equity tranche — the structure survives base case
with untouched mezz/senior, and the greenium saves $150K/yr on senior funding.

### 7.5 Data provenance & limitations

- **Pool composition percentages are seeded** (`sr(i*13+7)*25+5`); the rest of the tape, tranche
  structure and market-issuance series are hard-coded illustrative values, not a live deal.
- The waterfall is a **single-period, static-loss** model: it applies one annualised loss figure and
  allocates it in one pass. No multi-period amortisation, no prepayment-driven balance run-off despite
  CPR being an input (CPR only feeds `annPrepay`, which is computed but unused in loss allocation).
- Greenium is a fixed per-framework constant, not a matched-pair ASW differential — so the guide's
  `YTM_conv − YTM_green` is approximated by a table.

### 8 · Model Specification

**Status: specification — not yet implemented in code** (the waterfall is single-period; a production
cash-flow model amortises over the deal life).

**8.1 Purpose & scope.** Multi-period cash-flow waterfall + greenium estimation for green ABS/RMBS/CMBS
tranches, supporting all-in-cost and tranche loss/rating analysis.

**8.2 Conceptual approach.** A monthly cash-flow engine à la Intex/Bloomberg SF, driving CPR/CDR/LGD
vectors through a sequential (or pro-rata) waterfall; greenium estimated by matched-pair regression
per ICMA Greenium WG / ECB OP 285, not a lookup.

**8.3 Mathematical specification.**
```
Each month m: SMM = 1−(1−CPR)^(1/12);  MDR = 1−(1−CDR)^(1/12)
Default_m = MDR × BeginBalance_m ; Loss_m = LGD × Default_m
Prepay_m  = SMM × (BeginBalance_m − Default_m)
Allocate Loss_m junior→senior; write down tranche notionals; cure via excess spread/reserve
Tranche IRR from monthly interest+principal cash flows
Greenium_bps = β̂ from  ASWᵢ = α + β·GreenFlagᵢ + Σ γₖ·Controlₖᵢ + εᵢ  (matched pairs)
```

| Parameter | Source |
|---|---|
| CPR/CDR/LGD vectors | historical tape / rating-agency base cases |
| Reserve, OC, excess-spread rules | deal indenture |
| Greenium controls | maturity, rating, currency, sector (ICMA WG) |

**8.4 Data requirements.** Loan-level tape, deal waterfall rules, matched conventional ASW curve; the
page already holds tranche structure and framework greenium ranges as priors.

**8.5 Validation.** Reconcile tranche cash flows and WAL against Intex on a public deal; back-test
greenium β against ECB/CBI published estimates; stress CDR vectors to first-dollar-of-loss on each tranche.

**8.6 Limitations & model risk.** Prepay/default vector assumption dominates; greenium is noisy and
liquidity-dependent. Conservative fallback: report base/mild/severe/extreme static-loss bands (as the
current page does) when vector data is unavailable.

**Framework alignment:** ICMA Green Bond Principles / Securitisation Supplement — use-of-proceeds
categories; EU Green Bond Standard — DNSH + external review; SFDR Art 9 — sustainable-investment
labelling; STS Reg (EU) 2017/2402 — retention and investor reporting; ICMA Greenium WG / ECB OP 285 —
the matched-pair greenium methodology the §8 model would adopt.

## 9 · Future Evolution

### 9.1 Evolution A — Multi-period amortising cash-flow waterfall with curve-derived greenium (analytics ladder: rung 1 → 2)

**What.** §7 documents that this module's `calcWaterfall` is a genuine reverse-order sequential-loss allocation, but a single-period, static-loss one — it applies one annualised loss figure in a single pass, with no multi-period amortisation and no prepayment-driven balance run-off (§8 marked "not yet implemented"); pool composition percentages are `sr()`-seeded and the tape/tranche structure and issuance series are hard-coded illustrative values, and greenium (`YTM_conventional − YTM_green`) is a stored figure not a spread differential. Evolution A builds the production waterfall: a multi-period model amortising the collateral pool over the deal life with prepayment (CPR) and default (CDR) vectors, allocating losses period-by-period through the tranche structure — plus a curve-derived greenium from matched conventional-vs-green ABS/RMBS/CLO tranches.

**How.** (1) Extend `calcWaterfall` to a multi-period engine with CPR/CDR vectors, sequential principal amortisation, and period-by-period loss allocation. (2) A real collateral tape (or user-supplied) replacing the seeded pool percentages. (3) Greenium from a matched-tranche yield differential (reusing FRED/market curves the pricing-desk sibling pulls) rather than a stored figure. (4) EU-GBS applicability checks per the use-of-proceeds waterfall.

**Prerequisites.** A collateral tape with amortisation parameters; CPR/CDR assumptions; a conventional-tranche yield source; the seeded pool percentages replaced. **Acceptance:** the waterfall amortises over multiple periods with prepayment run-off (not a single pass); tranche losses reflect period-by-period allocation; greenium derives from a matched-tranche differential; no `sr()` pool percentage feeds the structure.

### 9.2 Evolution B — Green-ABS structuring copilot (LLM tier 2)

**What.** A copilot for structured-finance desks: "run this green solar-ABS through the waterfall at 8% CDR and 15% CPR, size the mezz tranche, and estimate the greenium vs conventional" tool-calls the Evolution A waterfall and greenium endpoints, narrating tranche cash flows and EU-GBS applicability.

**How.** Tier-2 tool-calling over the multi-period waterfall and greenium endpoints; the grounding corpus is §5/§7 (green ABS/RMBS/CLO structures, use-of-proceeds waterfall, SPV structuring, greenium, EU GBS). The copilot's value is tranche structuring under prepayment/default scenarios plus greenium estimation. Guardrail, pre-Evolution-A: the waterfall is single-period and greenium stored, so it must flag those limitations and refuse multi-period cash-flow claims. Every cash-flow and bps figure validated against tool output.

**Prerequisites.** Evolution A (single-period waterfall, seeded pool today); collateral-tape data; corpus embedding. **Acceptance:** post-Evolution-A, every tranche cash-flow and greenium figure traces to a tool call; the CPR/CDR what-ifs change the amortisation; pre-Evolution-A the copilot declines multi-period and greenium claims.