## 7 · Methodology Deep Dive

### 7.1 What the module computes

The core is a natural-capital-accounting (NCA) valuation engine, `calcNcaValue`,
that turns land area and ecosystem condition into an annual ecosystem-service value
and its NPV:

```js
totalEsHaYr    = Σ ES_CATEGORIES.valueUsdHaYr             // 950+2100+380+520 = 3950 $/ha/yr
adjustedEsHaYr = totalEsHaYr × ecoMult × (bioIdx/100) × (waterQuality/100)
annValue       = landHa × adjustedEsHaYr
npv            = Σ_{y=1..H} annValue / (1+disc)^y          // ecosystem-service NPV
annCarbonValue = landHa × carbonSeq × 30                   // $30/tCO₂ flat
carbonNpv      = Σ_{y=1..H} annCarbonValue / (1+disc)^y
bioRichness    = round(bioIdx×0.85 + sr(landHa%100)×15)
```

`ecoMult` (forest 1.4, wetland 2.1, grassland 0.7, marine 1.6, agricultural 0.5,
urban 0.4) scales the base per-ha value by ecosystem type.

### 7.2 Parameterisation

`ES_CATEGORIES` — SEEA-EA service groups with benefit-transfer $/ha/yr:

| Category | $/ha/yr | Portion | Provenance |
|---|---|---|---|
| Regulating (carbon, water, flood, pollination) | 2,100 | 0.53 | TEEB-style benefit transfer |
| Provisioning (food, water, timber) | 950 | 0.24 | TEEB |
| Supporting (soil, nutrient, habitat) | 520 | 0.13 | TEEB |
| Cultural (recreation, spiritual) | 380 | 0.10 | TEEB |

Other reference tables are real and descriptive: `BIO_STANDARDS` (8 rows — UK BNG
£15k–60k/unit, Australia BioCredit, EU Nature Restoration, Verra CCB/VM0048,
Terrasos, IBAT/ENCORE, NCSA), `SECTOR_DEPENDENCIES` (ENCORE-style deps/impact scores),
`GBF_TARGETS` (Kunming-Montreal), `FI_BIO_PRODUCTS` (BLL, nature performance bonds,
BNG forwards). The `$30/t` carbon price and the `ecoMult` scalars are undocumented
model constants.

### 7.3 Calculation walkthrough

1. User sets land ha (default 10,000), ecosystem type (forest), water quality (75),
   carbon sequestration (3.2 tCO₂/ha/yr), biodiversity index (72), discount (5%),
   horizon.
2. `adjustedEsHaYr` down-weights the $3,950/ha base by ecosystem multiplier and by
   the biodiversity-index and water-quality fractions (both 0–1).
3. Annual ES value = area × adjusted per-ha; carbon add-on = area × seq × $30.
4. Both streams discounted to NPV over the horizon; totals reported in $M.

### 7.4 Worked example

10,000 ha forest, bioIdx 72, waterQuality 75, carbonSeq 3.2, disc 5%, horizon 30 yr:

| Step | Computation | Result |
|---|---|---|
| Base ES/ha | 950+2100+380+520 | $3,950/ha/yr |
| eco × bio × water | 1.4 × 0.72 × 0.75 | 0.756 |
| Adjusted ES/ha | 3,950 × 0.756 | $2,986/ha/yr |
| Annual ES value | 10,000 × 2,986 | $29.86M/yr |
| ES NPV (annuity 15.372) | 29.86M × 15.372 | ~$459M |
| Annual carbon | 10,000 × 3.2 × 30 | $0.96M/yr |
| Carbon NPV | 0.96M × 15.372 | ~$14.8M |
| Total NPV | 459 + 14.8 | **≈$474M** |

(30-yr @5% annuity factor `(1−1.05⁻³⁰)/0.05 = 15.372`.) ES flows dwarf carbon here
because the $3,950/ha base is ~40× the $96/ha carbon value.

### 7.5 Data provenance & limitations

- The four `valueUsdHaYr` benefit-transfer figures and the ecosystem multipliers are
  **hard-coded point estimates** — TEEB-flavoured but not sourced to a specific study
  or region, so the absolute NPV is indicative only.
- `bioRichness` mixes the input index with an `sr()` PRNG term — a cosmetic synthetic
  jitter; the valuation itself is deterministic.
- Carbon priced at a flat $30/t (below current EU ETS / social cost of carbon); no
  condition-account depreciation of the stock over the horizon; ES flow held constant
  (no degradation/restoration trajectory).

**Framework alignment:** UN SEEA-EA (extent × condition × unit value — approximated
by land × ecoMult × condition fractions × benefit-transfer $/ha) · TEEB (ecosystem-
service valuation categories) · TNFD LEAP (the `TNFD_LEAP` steps table) · GLOBIO/MSA
(named in guide but the page values services, it does not compute an MSA footprint) ·
UK BNG Metric (referenced in `BIO_STANDARDS`, not computed here).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Produce a defensible SEEA-EA natural-capital account —
opening stock, ecosystem-service flow, condition-adjusted NPV and depreciation — for
a landholding, supporting corporate NCA disclosure and conservation-finance underwriting.

**8.2 Conceptual approach.** Follow the **UN SEEA-EA** extent/condition/monetary
account structure (the statistical standard) with **TEEB / ONS Natural Capital
Accounts** benefit-transfer valuation and a stock-depreciation term, benchmarked
against **Natural Capital Protocol** and **CDC Biodiversité GBS** practice.

**8.3 Mathematical specification.**
```
Stock_value = Σ_e Extent_e · Condition_e · UnitValue_e
Flow_t      = Σ_s Q_{s,t} · P_{s,t}            (service quantity × price)
Condition_t = Condition_0 · (1 − degrade_rate + restore_rate)^t
NPV = Σ_t Flow_t · Condition_t / (1+r)^t  −  Σ_t Depreciation_t/(1+r)^t
Carbon flow = seq_t · SCC_t                    SCC = social cost of carbon path
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Unit values | UnitValue_e | TEEB / ONS / regional benefit-transfer meta-analyses |
| Service quantities | Q_s | Field survey / InVEST / remote sensing |
| Condition score | Condition | SEEA-EA condition indicators (biophysical) |
| Degrade/restore | rates | Land-management plan + ecological monitoring |
| Discount rate | r | Social discount rate (e.g. HM Treasury Green Book 3.5%) |
| Carbon price | SCC_t | US-IWG SCC / EU ETS forward |

**8.4 Data requirements.** Ecosystem extent (ha by type), condition indicators,
service-flow quantities, region-matched unit values, sequestration rate, SCC path,
discount rate. Platform holds the ES category values and standards table; condition
indicators, InVEST flows and SCC path are new.

**8.5 Validation & benchmarking.** Reconcile against ONS UK Natural Capital Accounts
per-ha values by habitat; sensitivity on discount rate and condition trajectory;
cross-check carbon leg against the platform's carbon-price engines; benefit-transfer
uncertainty bands via Monte Carlo over source studies.

**8.6 Limitations & model risk.** Benefit transfer imports value from non-analogous
sites; double-counting across overlapping services is a known SEEA hazard; condition
dynamics are uncertain. Conservative fallback: lower-bound unit values, exclude
cultural services where willingness-to-pay is unmeasured, and report a value *range*
not a point.
