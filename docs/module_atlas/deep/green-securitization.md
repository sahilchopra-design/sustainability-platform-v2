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
