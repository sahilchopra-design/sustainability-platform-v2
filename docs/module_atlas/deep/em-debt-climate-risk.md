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
