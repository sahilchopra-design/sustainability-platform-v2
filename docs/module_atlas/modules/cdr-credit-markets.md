# CDR Credit Markets & Permanence Platform
**Module ID:** `cdr-credit-markets` · **Route:** `/cdr-credit-markets` · **Tier:** B (frontend-computed) · **EP code:** EP-EH5 · **Sprint:** EH

## 1 · Overview
High-durability carbon removal credit market intelligence: 7 credit types (DAC-Geological, BECCS, Biochar, EW-Basalt, OAE, Kelp), permanence tier framework (Tier 1–4), 20-buyer intelligence profiles, OTC price history 2024, and registry landscape (Puro.earth, VERRA, Gold Standard, EBC, UNDO, Eion).

> **Business value:** Used by corporate sustainability teams building CDR portfolios, carbon market traders pricing permanence risk, CDR developers selecting registries, and investors evaluating credit quality and price trajectory.

**How an analyst works this module:**
- Review market overview for 7 credit types with volume and price 2024 vs 2030
- Examine credit type table for permanence, registry, and additionality by type
- Use buyer intelligence table for 20 corporate buyers with price cap and permanence requirements
- Analyse OTC price history for 2024 monthly trends across credit types

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BUYERS`, `CREDIT_TYPES`, `KpiCard`, `PERMANENCE_SPECTRUM`, `PRICE_HISTORY`, `Pill`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CREDIT_TYPES` | 8 | `name`, `permanence`, `price2024`, `price2030`, `volume2024`, `volume2030`, `registry`, `additionality` |
| `PERMANENCE_SPECTRUM` | 5 | `duration`, `examples`, `price`, `marketShare` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalCommitment` | `useMemo(() => Math.round(BUYERS.reduce((a, b) => a + b.commitment2030, 0) / 1000), []);` |
| `avgMaxPrice` | `useMemo(() => Math.round(BUYERS.reduce((a, b) => a + b.maxPrice, 0) / BUYERS.length), []);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CREDIT_TYPES`, `PERMANENCE_SPECTRUM`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CDR market CAGR 2024–2030 (%) | `From ~$1B to ~$50–100B market` | BNEF CDR Market Outlook 2024 | Driven by SBTi NET-Zero Standard requiring permanent CDR for residual emissions; corporate net-zero commitments. |
| Puro.earth registry fee (%) | `Revenue share from credit issuance` | Puro.earth commercial terms | Highest fee CDR registry; vertical integration with MRV service; premium brand justifies fee vs VERRA 2–5%. |
| Stripe Frontier avg purchase price ($/tCO₂) | `Blended across portfolio 2024` | Stripe Frontier public reporting | Highest price buyer in market; pre-commercial focus; paying premium to fund scale-up and MRV development. |
- **ICVCM CCPs + Oxford Principles + Puro/VERRA/EBC registry data + Stripe Frontier disclosures** → 7 credit type intelligence + permanence tiers + 20 buyer profiles + OTC price history + registry landscape → **Carbon buyers structuring CDR portfolios, registries developing methodologies, and investors in CDR project developers**

## 5 · Intermediate Transformation Logic
**Methodology:** CDR Credit Permanence-Adjusted Pricing
**Headline formula:** `Permanence_adjusted_price = Nominal_price × permanence_discount_factor; discount = 1 − (leakage_rate × years_discounted)`

Tier 1 permanent (>10,000 yr): $300–700/t; Tier 3 medium (100–1,000 yr): $80–200/t; price gap reflects permanence risk and buyer net-zero credibility requirements.

**Standards:** ['ICVCM Core Carbon Principles', 'Oxford Principles for Net-Zero Aligned Carbon Offsetting', 'Puro.earth Permanence Framework']
**Reference documents:** ICVCM (2023) – Core Carbon Principles for High-Quality Credits; Oxford (2022) – Oxford Principles for Net-Zero Aligned Carbon Offsetting; Stripe (2024) – Frontier Annual Report on CDR Purchases

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Implement permanence-adjusted pricing on disclosed purchase data (analytics ladder: rung 1 → 2)

**What.** §7 classifies this as a market-intelligence display: the guide's headline
formula (`Permanence_adjusted_price = Nominal · (1 − leakage·years)`) is **not
implemented**, and only two aggregations exist (`totalCommitment`, `avgMaxPrice` over
the 20 `BUYERS`). The seed economics are realistic but hand-typed and will stale.
Evolution A does two things: implements the advertised permanence-adjustment
calculation as a real function over the credit-type table (durability years, reversal
rate → risk-discounted price, benchmarked against the observed Tier-1-vs-Tier-3 price
gap the `PERMANENCE_SPECTRUM` already encodes), and re-bases the market data on
disclosed CDR purchases — the CDR.fyi public dataset and Frontier's published deals
(§5 already cites Stripe/Frontier 2024) give real transaction volumes and prices per
pathway.

**How.** (1) `ref_cdr_purchases(date, buyer, supplier, pathway, tonnes, price_usd_t,
source)` reference table from CDR.fyi exports; the OTC price-history chart switches
from hard-coded 2024 monthlies to aggregates over it. (2) `permanenceAdjust(nominal,
durability, leakage_rate)` implemented per the guide formula, unit-tested, with the
implied leakage rate back-solved from observed tier spreads as a calibration check.
(3) 2030 price columns clearly labelled as scenario projections, separated from
observed data.

**Prerequisites.** CDR.fyi licensing/attribution confirmed; mismatch flag clears when
the formula exists in code. **Acceptance:** the adjusted price of a 100-year biochar
credit reproduces the formula by hand; the price-history chart cites row counts per
month from the purchases table.

### 9.2 Evolution B — CDR procurement copilot (LLM tier 1)

**What.** A copilot for buyer-side questions the page's data can actually answer:
"which pathways fit a buyer with a $200/t cap and >1,000-year durability requirement?"
(a filter over `CREDIT_TYPES` × `PERMANENCE_SPECTRUM`), "what did comparable buyers
commit?" (the 20 buyer profiles), "why does DAC-Geo trade at 4x biochar?" (permanence
tiers, §5 Oxford Principles framing). Explanation and filter-narration only — the
module computes almost nothing today, and tier 2 requires Evolution A's functions.

**How.** Tier-1 pattern: atlas record plus the seed/reference tables in
`llm_corpus_chunks`; screening answers restate which rows pass stated constraints,
verifiable against the rendered tables; the prompt distinguishes observed-2024 data
from 2030 scenario columns explicitly.

**Prerequisites.** Evolution A's purchase table strongly preferred first — narrating
hand-typed prices as "market intelligence" is defensible only with the demo caveat
stated. **Acceptance:** every price cited matches a table cell with its
observed-vs-scenario status named; a request for a live quote is refused.