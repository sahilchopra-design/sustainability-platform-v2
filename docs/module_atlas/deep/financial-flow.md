## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *Paris Finance Gap Model*
> (`Gap = ClimateNeed − Σ(GreenBond + SLL + BlendedFinance + …)`) tracking sustainable-finance flows
> against IPCC needs. **None of that exists in this module.** What the code actually implements is a
> **product-level financial-flow / true-cost engine**: for 15 physical products it holds a full
> bill-of-materials (BOM) cost breakdown by value-chain stage, runs commodity-price sensitivity, prices
> five environmental externalities to compute a "true cost", and (using a company master) scores
> portfolio commodity sensitivity. The guide's green-bond/finance-gap framework should be re-pointed
> at a different module; the sections below document the code as built.

### 7.1 What the module computes

**True cost via externality pricing.** For each product `f`, five externalities are monetised:

```js
carbon       = (gwp_total_kg / 1000) × 51                       // $/tCO₂e (EPA SCC 2024)
water        = (water_total_l / 1e6) × 2.5 × 1000               // $/ML shadow price
air          = (gwp_total_kg / 1000) × 0.15 × 8.5               // SOx/NOx proxy = 0.15× GWP
biodiversity = 15 × (land_ha || 0.5)                            // $/ha-yr (TEEB)
waste        = (waste_kg / 1000) × 75                           // $/tonne
total        = carbon + water + air + biodiversity + waste
trueCost     = final_price_usd + total
gapPct       = total / final_price_usd × 100                    // externality as % of price
```

**BOM cost sensitivity.** A price slider (+scenario ±50%) rescales each raw material:

```js
factor       = 1 + (userSlider + scenarioMultiplier)/100
newPrice     = price_per_kg × factor
newCost      = quantity_kg × newPrice
rawDelta     = Σ adjusted_cost − original raw total
adjFinalPrice= final_price_usd + rawDelta
```

**Value-chain margin distribution.** Per stage `margin$ = value_add × margin_pct/100`; each stage's
share of total margin drives a treemap size.

**Portfolio commodity sensitivity.** Over holdings from `GLOBAL_COMPANY_MASTER`:
`impact_mn = revenue_mn × commodity_sensitivity / 1000`.

### 7.2 Parameterisation / scoring rubric

**Externality shadow prices** (`EXTERNALITY_PRICES`):

| Externality | Price | Unit | Source (in code) |
|---|---|---|---|
| Carbon | 51 | USD/tCO₂e | EPA Social Cost of Carbon (2024) |
| Water | 2.5 | USD/ML | Shadow price, stressed regions |
| Air pollution | 8.5 | USD/t SOx/NOx | WHO health-cost estimates |
| Biodiversity | 15 | USD/ha-yr | Ecosystem service valuation (TEEB) |
| Waste disposal | 75 | USD/tonne | Landfill + collection cost |

These are real, citable shadow-price anchors. The **air-pollution proxy** `0.15 × GWP` is a heuristic
(assumes SOx/NOx tonnage ≈ 15% of CO₂e tonnage) rather than a measured pollutant inventory.

**Product BOM data** (15 products — EV battery, solar panel, steel beam, palm oil, cotton T-shirt, …)
carries genuine engineering-grade figures: material quantities (kg), prices ($/kg), origins,
stage-level labour/energy/depreciation/margin %, and per-product GWP, water, waste, land totals. These
are curated demo values (realistic, e.g. 75 kWh NMC811 pack: 8.9 kg Li₂CO₃, 39 kg NiSO₄), not PRNG.

**Portfolio sensitivity** fields ARE synthetic: `commodity_sensitivity = round(5 + seed(i·31)·35)`
(5–40) and `revenue_mn = round(500 + seed(i·37)·9500)` via the platform seeded PRNG.

### 7.3 Calculation walkthrough

1. Pick a product → `flow`. Compute externality breakdown → `totalExternality` → true cost + gapPct.
2. BOM tab: slider/scenario rescales raw material costs → `rawDelta` → adjusted final price.
3. Margin tab: per-stage `margin$` and treemap share.
4. All-products tab: externality + gapPct for each of 15 products, sorted by gapPct.
5. Portfolio tab: holdings (real master ∪ synthetic sensitivity) → `impact_mn`.

### 7.4 Worked example (Palm Oil, true cost)

Crude palm oil (1 t): `gwp_total_kg = 3000`, `water_total_l = 28,300`, `waste_kg = 350`,
`land_ha = 2.5`, `final_price = $700`:

| Externality | Computation | $ |
|---|---|---|
| Carbon | (3000/1000)×51 | 153.0 |
| Water | (28,300/1e6)×2.5×1000 | 70.75 |
| Air | (3000/1000)×0.15×8.5 | 3.83 |
| Biodiversity | 15 × 2.5 | 37.5 |
| Waste | (350/1000)×75 | 26.25 |
| **Total externality** | | **≈$291** |
| True cost | 700 + 291 | **$991** |
| gapPct | 291/700 | **41.6%** |

Palm oil's high land-use (2.5 ha, driving the biodiversity term) and carbon push its externality to
~42% of market price — one of the highest "true-cost gaps" in the 15-product set.

### 7.5 Data provenance & limitations

- **Externality shadow prices are real citations** (EPA SCC $51, TEEB, WHO); the **air-pollution
  0.15×GWP proxy** is an unvalidated heuristic and would overstate/understate by sector.
- Product BOM data is curated demo data (engineering-plausible, not sourced from a live LCA database).
- **Portfolio `commodity_sensitivity` and `revenue_mn` are synthetic** (`seed()` PRNG); `top_commodity`
  is assigned by index position, not by actual company exposure.
- The all-products externality comparison uses per-product single-point estimates, no uncertainty.

**Framework alignment:** True-cost / natural-capital accounting (Natural Capital Protocol, TEEB) ·
EPA Social Cost of Carbon (carbon term) · GHG Protocol product LCA (GWP totals) · this is *not* a
climate-finance-flow model despite the guide. The methodology approximates a **product environmental
P&L** (à la Kering EP&L / Trucost natural-capital valuation).

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The externality engine uses single shadow-
price points and a crude air-pollution proxy; portfolio commodity sensitivity is `seed()`-synthetic.
Below is the production model for a defensible environmental-P&L / commodity-risk overlay.

### 8.1 Purpose & scope
Quantify (i) a product/portfolio **environmental profit-and-loss** (monetised externalities across the
value chain) and (ii) **commodity-price transmission risk** to corporate revenue, supporting
supply-chain and transition-risk decisions.

### 8.2 Conceptual approach
Two blocks: an **environmental P&L** mirroring **Trucost natural-capital valuation** and the **Kering
EP&L** (life-cycle emissions/water/land/pollution × region-specific shadow prices), and a **commodity
factor model** mapping input-cost shocks to margin, à la a **Goldman Marquee-style factor** repricing.

### 8.3 Mathematical specification
```
EnvPL_p   = Σ_e Σ_r  Q_{e,p,r} · shadowPrice_{e,r}            e∈{CO₂,water,air,land,waste}, region r
   air pollutants use a measured inventory (SOx,NOx,PM) not a GWP proxy
TrueCost_p= MarketPrice_p + EnvPL_p ;  Gap_p = EnvPL_p / MarketPrice_p
MarginΔ_c = − Σ_m (inputCost_{m,c}/Revenue_c) · Δprice_m       commodity pass-through
CommoditySensitivity_c = Σ_m (inputCost_{m,c}/Revenue_c)       input-cost intensity
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| shadowPrice_{CO₂} | social cost of carbon | EPA SCC / IWG; region-adjusted |
| shadowPrice_{water,r} | regional water scarcity value | WRI Aqueduct + shadow-price literature |
| air pollutant costs | SOx/NOx/PM₂.₅ health cost | WHO / US-EPA BenMAP |
| land value | ecosystem service | TEEB / ELD region factors |
| Q_{e,p,r} | per-unit LCA quantities | ecoinvent / GaBi LCA database |
| inputCost_{m,c} | material spend by company | company COGS disclosures / EXIOBASE MRIO |

### 8.4 Data requirements
Per product: full LCA inventory by region (ecoinvent). Per company: revenue, COGS by commodity
(EXIOBASE multi-region input-output), commodity price series. Already on platform: `GLOBAL_COMPANY_MASTER`,
commodity price fields in the BOM. Add: regional shadow-price tables, LCA inventory.

### 8.5 Validation & benchmarking plan
Reconcile EnvPL against published Trucost/Kering EP&L for overlapping products (target same order of
magnitude); backtest commodity margin sensitivity against realised gross-margin moves during commodity
shocks (e.g. 2022 nickel/lithium spikes); sensitivity-test shadow prices (SCC $51 vs $185 high case).

### 8.6 Limitations & model risk
Shadow prices are contested and region-coarse; LCA data has ±30% uncertainty; the air-proxy must be
replaced by a real pollutant inventory. Conservative fallback: report EnvPL as a range across low/central/
high shadow-price sets and disclose the SCC assumption prominently.
