## 7 · Methodology Deep Dive

This is a **CDR market-intelligence display** module, not a calculation engine. The MODULE_GUIDES
entry describes a "permanence-adjusted pricing" formula
(`Permanence_adjusted_price = Nominal · (1 − leakage·years)`) — **this formula is not implemented in
code.** The module presents hard-coded (realistic) credit-type economics, a permanence-tier framework,
20 buyer profiles, and a 2024 OTC price history, with only two trivial aggregations computed.

### 7.1 What the module computes

Only two derived values:
```
totalCommitment = round( Σ BUYERS.commitment2030 / 1000 )   // Mt CDR committed by 2030
avgMaxPrice     = round( Σ BUYERS.maxPrice / BUYERS.length ) // $/tCO2 average price cap
```
Everything else (credit-type table, permanence spectrum, price history charts, registry landscape) is
a direct render of seed data.

### 7.2 Parameterisation / data rubric

| Element | Value | Provenance |
|---|---|---|
| Credit types (7) | DAC-Geo $600→$350, BECCS $200→$140, Biochar $150→$90, EW $180→$100, OAE $250→$120 | `CREDIT_TYPES` — hard-coded, **realistic 2024→2030 CDR prices** |
| Permanence tiers | T1 >10,000 yr ($300–700, 15% share) → T4 <100 yr ($20–80, 20%) | `PERMANENCE_SPECTRUM` — literature-consistent |
| Buyers (Microsoft, Stripe Frontier, Google, Swiss Re…) | names/sectors hard-coded; commitment & maxPrice `sr()`-seeded | Real buyers, **synthetic** commitment values |
| Price history (Jan–Dec 2024) | trend-plus-`sr()` | **Synthetic** with realistic downward drift |
| Registry landscape | Puro.earth, VERRA, Gold Standard, EBC, UNDO, Eion | Hard-coded, real registries |

### 7.3 Calculation walkthrough

Buyer commitments (each drawn from `50 + sr(i·19)·950` kt) are summed and divided by 1,000 to a Mt
total; max prices (`150 + sr(i·29)·850`) are averaged. The credit-type and permanence tables drive
the overview charts and a price-vs-permanence scatter. No user-input calculation path exists — the
module is a curated market briefing.

### 7.4 Worked example (portfolio commitment)

With 20 buyers each committing a mean ≈ 50 + 0.5·950 ≈ 525 kt by 2030, `Σ commitment2030 ≈ 10,500 kt`
→ `totalCommitment ≈ 11 Mt`. Mean max price ≈ 150 + 0.5·850 ≈ $575/t → `avgMaxPrice ≈ $575`. Exact
values are deterministic given the `sr()` seeds; the ranges are consistent with the durable-CDR
buyers' club (Frontier/NextGen) scale and premium pricing.

### 7.5 Data provenance & limitations
- Credit-type prices, permanence tiers and registry list are **hard-coded, realistic** market data;
  buyer commitments and price history are **synthetic `sr()`-seeded**.
- The guide's permanence-adjusted pricing model is **not computed** — permanence is presented as tier
  labels, not applied as a discount factor to price (see §8).
- No liquidity, bid-ask, or forward-curve modelling; price paths are illustrative trends.

**Framework alignment:** **ICVCM Core Carbon Principles** and **Oxford Principles for Net-Zero Aligned
Offsetting** (shift from avoidance to durable removal over time) frame the permanence tiers. **Puro.earth
Permanence Framework** underpins the >100-yr durability categories. **VCMI** claim tiers and **Stripe
Frontier** disclosures inform the buyer intelligence. The tier→price gap ($300–700 permanent vs
$20–80 low-durability) *is* the permanence-risk premium the guide describes, shown descriptively.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The module displays a "permanence-adjusted
price" concept without a computing model.

**8.1 Purpose & scope.** Convert nominal CDR credit prices into permanence- and delivery-risk-adjusted
prices comparable across durability classes, to support buyer portfolio construction and price
benchmarking.

**8.2 Conceptual approach.** A durability-discounting model in the spirit of the **Oxford Principles**
(prefer high durability) and **CarbonPlan**'s permanence/leakage accounting, converting a stored-carbon
price into a "tonne-year" or "risk-of-reversal"-adjusted equivalent.

**8.3 Mathematical specification.**
```
Reversal-risk adjustment (annualised leakage λ over horizon H):
  survival(H) = e^(−λ·H)                        // fraction still stored at horizon
  P_adj = P_nominal · [ w·survival(H_target) + (1−w)·(1 − buffer_rate) ]
Ton-year equivalence (alternative):
  P_ton-year = P_nominal · min(1, actual_permanence / required_permanence)
Delivery-risk (forward credits):
  P_risk = P_nominal · (1 − PD_developer) · (1 − MRV_uncertainty)
```
| Parameter | Value | Source |
|---|---|---|
| λ (annual reversal) by type | biochar ~0.3–1%/yr, geologic ~0 | CarbonPlan / Puro MRV |
| buffer_rate | 5–20% | registry non-permanence buffers |
| required_permanence | 100 / 1,000 / 10,000 yr | Oxford durability tiers |
| PD_developer | project-specific | pre-commercial CDR delivery track record |

**8.4 Data requirements.** Per credit type: nominal price, measured/claimed permanence, annualised
reversal rate, buffer contribution, developer delivery risk, MRV uncertainty. Sources: Puro/VERRA MRV,
CarbonPlan permanence estimates, Frontier/NextGen contract data.

**8.5 Validation & benchmarking plan.** Confirm P_adj reproduces the observed price ordering across
permanence tiers; benchmark against CarbonPlan permanence-adjusted prices and Frontier's stated price caps.

**8.6 Limitations & model risk.** Reversal rates for novel CDR (OAE, kelp) are deeply uncertain; a
single λ understates fat-tailed reversal. Conservative fallback: apply a durability floor (credit only
against the required-permanence horizon) and a wide buffer for pre-commercial pathways.
