## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch (substantial).** The guide describes an **enterprise carbon-credit portfolio /
> retirement ledger**: "Net_balance = Purchased − Retired − Transferred", SHA-256 retirement certificates,
> Verra/Gold-Standard registry reconciliation, chain-of-custody, ICVCM CCP quality scoring, ISAE 3000-
> auditable records. **None of that exists in the code.** The actual module is a **personal / consumer
> carbon-footprint budget tracker**: it estimates the CO₂ of individual *spending* transactions (spend ×
> carbon-intensity by merchant-category), tracks that footprint against a per-capita Paris-pathway budget,
> and gamifies reduction with badges and savings tips. There is no credit inventory, no retirement, no
> registry, no SHA-256, no VCU. Sections below document the consumer footprint tracker as coded; §8
> specifies the enterprise credit wallet the guide describes.

### 7.1 What the module computes

A spend-based consumer footprint against a carbon budget:

```js
carbon_kg     = amount_usd × SPENDING_CARBON_INTENSITY[category].carbon_per_usd   // per transaction
totalCarbon   = Σ periodTxns.carbon_kg
totalSpend    = Σ periodTxns.amount_usd
carbonPerUsd  = totalCarbon / totalSpend                       // footprint efficiency
periodBudget  = budget.daily_kg × daysInPeriod                 // Paris-pathway allowance
budgetUsedPct = totalCarbon / periodBudget × 100
treesNeeded   = totalCarbon / 22                               // 22 kg CO2/tree/yr offset proxy
projectedAnnual = ratePerDay × 365 / 1000                      // tonnes/yr run-rate
offsetCost    = tonnes × OFFSET_PRICE_PER_TONNE ($15/t)
```

### 7.2 Parameterisation

**Carbon budgets** (`CARBON_BUDGETS` — provenance: real per-capita figures): Paris 1.5 °C = 2.3 t/yr
(6.3 kg/day), Paris 2 °C = 4.0 t/yr, global avg 4.7 t, India 1.9 t, USA 15.5 t, EU 6.8 t. These are accurate
per-capita emission levels.

**Spending carbon intensities** (`SPENDING_CARBON_INTENSITY`, kgCO₂e per $ by merchant category — real EEIO-
style factors, mapped to MCC codes):

| Category | kgCO₂/$ | Category | kgCO₂/$ |
|---|---|---|---|
| Fuel | 2.31 | Groceries | 0.75 |
| Airlines | 1.85 | Restaurants | 0.68 |
| Electricity | 1.42 | Home improvement | 0.55 |
| Clothing | 0.45 | Public transport | 0.25 |
| Electronics | 0.35 | Subscriptions | 0.08 |

**Savings tips** (`SAVINGS_TIPS`, real reduction figures: train vs short-haul flight saves 115 kg/1000km;
beef→plant-based 25.1 kg/kg) and **badges** (gamification). The `OFFSET_PRICE_PER_TONNE = $15` is a voluntary-
market retail-offset proxy.

**Synthetic seed data** (`sr()` via `_sc` counter): demo transactions (category, amount $5–125, days-ago).

### 7.3 Calculation walkthrough

Each transaction's carbon = amount × the category's intensity (or a manual override). The period view sums
carbon and spend, compares to the daily-budget × days allowance, and derives budget-used %, carbon-per-$,
trees-needed, and a projected annual run-rate. A peer-percentile places the user's annualised rate against
the budget benchmarks. Badges fire on transaction counts and low-carbon streaks.

### 7.4 Worked example (a month of spending)

Transactions: $200 fuel, $400 groceries, $150 airlines, $100 electricity.
- Fuel: `200 × 2.31 = 462 kg`; Groceries: `400 × 0.75 = 300 kg`; Airlines: `150 × 1.85 = 277.5 kg`;
  Electricity: `100 × 1.42 = 142 kg`. `totalCarbon = 1,181.5 kg`; `totalSpend = $850`.
- `carbonPerUsd = 1,181.5 / 850 = 1.39 kg/$`.
- Budget (Paris 1.5 °C, 30 days): `6.3 × 30 = 189 kg`. `budgetUsedPct = 1,181.5 / 189 × 100 = 625%` — 6.25×
  over the 1.5 °C personal allowance.
- `treesNeeded = 1,181.5 / 22 = 53.7 trees`; offset at $15/t: `1.18t × 15 = $17.7`.

### 7.5 Data provenance & limitations

- **Budgets, spend intensities, and savings figures are real** (per-capita emissions, EEIO spend factors);
  demo transactions are synthetic (`sr(seed)=frac(sin(seed+1)×10⁴)`).
- **This is a consumer footprint tool, not the enterprise credit ledger the guide claims** — none of the
  retirement/registry/certificate functionality exists.
- Spend-based estimation is inherently low-precision (EEIO averages); real merchant-level product carbon is
  not modelled.

**Framework alignment:** GHG Protocol Scope 3 (spend-based method) — the spend × EEIO-factor estimation is the
personal-footprint analogue of Scope 3 Category 1 spend-based accounting · IPCC per-capita carbon budgets —
the Paris 1.5 °C (2.3 t) / 2 °C (4.0 t) personal allowances. The guide's ICVCM CCP scoring, Verra/GS registry
rules, and SBTi Net-Zero retirement standards are **not** implemented — see §8.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's enterprise credit wallet is absent; this
specifies it (distinct from the consumer tool that ships).

### 8.1 Purpose & scope
Maintain an enterprise carbon-credit inventory across registries (Verra VCU, Gold Standard GS-VER, EUAs,
CORSIA units), execute irreversible retirements with auditable certificates, reconcile the internal ledger
against live registry balances, and score portfolio quality against ICVCM CCPs — for net-zero-claim
substantiation.

### 8.2 Conceptual approach
Double-entry credit ledger + append-only retirement log, benchmarked against Verra/Gold Standard registry
rules and Watershed/Sylvera credit-management platforms. Retirement generates a hash-committed certificate;
reconciliation compares ledger positions to registry API balances.

### 8.3 Mathematical specification

```
NetBalance   = Σ Purchased − Σ Retired − Σ Transferred        per serial / vintage / registry
RetireCert   = SHA256( serial ‖ entity ‖ date ‖ tCO2e ‖ beneficiary ‖ claimType )
Reconcile    : |LedgerBalance_r − RegistryBalance_r| = 0  ∀ registry r   (else flag gap)
QualityScore = Σ_p w_p · CCP_p(credit)                        ICVCM 10 CCPs, weighted
ClaimCover   = RetiredForClaim / ResidualEmissions            SBTi neutralisation coverage
```

| Parameter | Symbol | Source |
|---|---|---|
| CCP weights | w_p | ICVCM Core Carbon Principles v4 |
| Registry balances | RegistryBalance | Verra / Gold Standard registry APIs |
| Hash | SHA-256 | FIPS 180-4 |
| Claim standard | — | SBTi Net-Zero neutralisation |

### 8.4 Data requirements
Credit serial numbers with project/vintage/methodology/VVB metadata, registry API access, ICVCM CCP flags,
residual-emissions figure for claim coverage. Platform holds credit metadata schemas (via CarbonCreditContext)
and pricing/quality modules; missing: registry API integration, retirement store, SHA-256.

### 8.5 Validation & benchmarking plan
Reconciliation must reach zero gap against Verra/GS registry balances. Retirement irreversibility tested
(retired serials cannot re-enter inventory). Certificate hash verified against payload. Benchmark CCP quality
score against BeZero/Sylvera ratings for overlapping credits.

### 8.6 Limitations & model risk
Registry API latency/availability is the main operational risk — cache with staleness flags. Retirement is
irreversible, so pre-retirement validation must be strict (serial uniqueness, no double-retire). CCP scoring
depends on ICVCM assessment coverage, which is incomplete across methodologies — flag unassessed credits
rather than defaulting them to high quality.
