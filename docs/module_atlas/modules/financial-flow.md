# Financial Flow Analytics
**Module ID:** `financial-flow` · **Route:** `/financial-flow` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks and analyses global capital flows into sustainable finance instruments including green bonds, sustainability-linked loans, ESG equity funds, blended finance, and climate-aligned infrastructure. Maps Paris-aligned investment volumes against estimated climate finance needs from IPCC and UNFCCC, quantifying the annual green finance gap by sector and region. Supports capital mobilisation strategy, regulatory reporting, and investor stewardship on sustainable finance market development.

> **Business value:** Provides policymakers, development finance institutions, and impact investors with a comprehensive, data-driven view of where sustainable capital is flowing and where the critical gaps to Paris alignment remain â€” enabling evidence-based capital mobilisation strategy and green finance market development prioritisation.

**How an analyst works this module:**
- Select geography and sector focus and load the latest sustainable finance flow data from integrated market databases.
- Review Paris finance gap waterfall by sector comparing tracked flows against IPCC needs at current and 2030 targets.
- Analyse blended finance mobilisation ratios and identify instrument types with highest private capital leverage.
- Export sustainable finance market development report for government, DFI, or investor strategy alignment review.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Btn`, `EXTERNALITY_PRICES`, `FINANCIAL_FLOWS`, `GREEN_PREMIUMS`, `KPI`, `LS_FF`, `LS_PORT`, `PIE_COLORS`, `Section`, `SortHeader`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `GREEN_PREMIUMS` | 10 | `conventional`, `premium_pct`, `co2_reduction_pct`, `status` |
| `CROSS_NAV` | 6 | `path` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `fmtUSD` | `(n) => n == null ? '\u2014' : Math.abs(n) >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : Math.abs(n) >= 1000 ? `$${(n/1000).toFixed(1)}K` : Math.abs(n) >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(3)}`;` |
| `holdings` | `useMemo(() => { if (!portfolioRaw.length) return GLOBAL_COMPANY_MASTER.slice(0, 30).map((c, i) => ({ ...c, company_name: c.company_name \|\| c.company \|\| `Company ${i+1}`, sector: c.sector \|\| 'Diversified', weight: c.weight \|\| 1, commodity_sensitivity: Math.round(5 + seed(i*31) * 35), revenue_mn: Math.round(500 + seed(i*37) * 9500), }));` |
| `scenarioMultiplier` | `scenarioMode === 'bull' ? 50 : scenarioMode === 'bear' ? -50 : 0;` |
| `slider` | `userSlider + scenarioMultiplier;` |
| `factor` | `1 + slider / 100;` |
| `newPrice` | `c.price_per_kg ? c.price_per_kg * factor : null;` |
| `newCost` | `c.price_per_kg ? c.quantity_kg * newPrice : c.cost;` |
| `adjustedRawTotal` | `useMemo(() => adjustedBOM.reduce((s, c) => s + (c.adjusted_cost \|\| 0), 0), [adjustedBOM]);` |
| `originalRawTotal` | `useMemo(() => flow?.stages?.[0]?.cost_usd \|\| 0, [flow]); const rawDelta = adjustedRawTotal - originalRawTotal;` |
| `adjustedFinalPrice` | `useMemo(() => (flow?.final_price_usd \|\| 0) + rawDelta, [flow, rawDelta]);` |
| `carbon` | `(f.gwp_total_kg / 1000) * EXTERNALITY_PRICES.carbon.price;` |
| `water` | `(f.water_total_l / 1e6) * EXTERNALITY_PRICES.water.price * 1000;` |
| `air` | `(f.gwp_total_kg / 1000) * 0.15 * EXTERNALITY_PRICES.air_pollution.price;` |
| `biodiversity` | `EXTERNALITY_PRICES.biodiversity.price * (f.land_ha \|\| 0.5);` |
| `waste` | `(f.waste_kg \|\| 0) / 1000 * EXTERNALITY_PRICES.waste_disposal.price;` |
| `total` | `carbon + water + air + biodiversity + waste;` |
| `totalExternality` | `useMemo(() => externalityBreakdown.reduce((s, e) => s + e.cost, 0), [externalityBreakdown]);` |
| `allProductExternalities` | `useMemo(() => { return PRODUCT_KEYS.map(k => { const f = FINANCIAL_FLOWS[k];` |
| `bars` | `flow.stages.map((s, i) => {` |
| `bear` | `c.quantity_kg * c.price_per_kg * 0.5;` |
| `bull` | `c.quantity_kg * c.price_per_kg * 1.5;` |
| `portfolioSensitivity` | `useMemo(() => { return holdings.slice(0, 15).map((h, i) => ({ company: h.company_name, sector: h.sector, sensitivity: h.commodity_sensitivity, revenue_mn: h.revenue_mn, impact_mn: Math.round(h.revenue_mn * h.commodity_sensitivity / 1000), top_commodity: ['Lithium','Copper','Nickel','Steel','Palm Oil','Cotton','Gold','Cobalt','Aluminum','S` |
| `rows` | `flow.stages.map(s => [s.stage, s.cost_usd, s.value_add\|\|'', s.labor_pct\|\|'', s.energy_pct\|\|'', s.margin_pct\|\|'']);` |
| `csv` | `[headers.join(','), ...rows.map(r => r.join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type:'text/csv' });` |
| `pctGap` | `flow ? (gap / flow.final_price_usd * 100) : 0;` |
| `marginDollar` | `(s.value_add \|\| 0) * (s.margin_pct \|\| 0) / 100;` |
| `totalMargin` | `flow.stages.reduce((sum, st) => sum + (st.value_add \|\| 0) * (st.margin_pct \|\| 0) / 100, 0);` |
| `share` | `totalMargin > 0 ? (margin$ / totalMargin * 100) : 0;` |
| `size` | `Math.max(50, Math.round(share * 400));` |
| `rawPct` | `adjustedRawTotal / adjustedFinalPrice * 100;` |
| `totalMarginPct` | `flow?.stages?.reduce((s, st) => s + (st.margin_pct \|\| 0), 0) / (flow?.stages?.length \|\| 1);` |
| `eolPct` | `flow ? (flow.end_of_life_value_usd / flow.final_price_usd * 100) : 0;` |
| `laborInt` | `flow?.stages?.reduce((s, st) => s + (st.labor_pct \|\| 0), 0) / (flow?.stages?.length \|\| 1);` |
| `avgExt` | `allProductExternalities.reduce((s, p) => s + p.gapPct, 0) / allProductExternalities.length;` |
| `bearPrice` | `f.final_price_usd - rawCost * 0.5;` |
| `bullPrice` | `f.final_price_usd + rawCost * 0.5;` |
| `maxPrice` | `Math.max(...PRODUCT_KEYS.map(k => FINANCIAL_FLOWS[k].final_price_usd));` |
| `maxBOM` | `Math.max(...PRODUCT_KEYS.map(k => (FINANCIAL_FLOWS[k].stages.find(s => s.components)?.components?.length \|\| 0)));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CROSS_NAV`, `GREEN_PREMIUMS`, `PIE_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Annual Green Bond Issuance ($Bn) | — | ICMA Green Bond Database / Bloomberg | Total labelled green bond volume; 2023 issuance exceeded $575Bn; IPCC estimates $4.5Tn/year needed by 2030. |
| Climate Finance Gap ($Tn/year) | — | CPI Global Landscape 2023 | Estimated shortfall between climate investment needs and tracked flows; CPI estimates $4.1Tn annual gap to 2030. |
| SLL Volume ($Bn) | — | LMA/Bloomberg | Sustainability-linked loan issuance; key instrument for emerging market corporate climate finance. |
| Blended Finance Mobilisation Ratio (x) | — | OECD/Convergence | Private capital mobilised per dollar of public/concessional capital deployed; target ratio >3x for EM climate finance. |
- **ICMA green/social/sustainability bond database and Bloomberg BICS** → Aggregate labelled bond issuance by use-of-proceeds category, issuer type, geography, and tenor → **Green bond flow time series by sector and region ($Bn/year)**
- **OECD CRS climate ODA data and DFI annual reports** → Tag bilateral and multilateral climate finance flows; compute additionality and concessionality metrics → **Public climate finance by institution and recipient region ($Bn/year)**
- **CPI/IPCC climate investment need estimates** → Align need estimates by sector and region to tracked flow categories; compute residual gap at current trajectory → **Paris finance gap by sector ($Tn/year) and gap-to-need ratio (%)**

## 5 · Intermediate Transformation Logic
**Methodology:** Paris Finance Gap Model
**Headline formula:** `Gap = ClimateNeed − Σ(GreenBond + SLL + BlendedFinance + PublicClimate + ESGEquity)`

Estimates the annual green finance gap by subtracting tracked sustainable finance flows from IPCC-estimated climate investment needs by sector (energy system, transport, buildings, agriculture, nature) and region. Sustainable finance flows are aggregated from ICMA-labelled bond data, LMA-labelled loan data, OECD climate ODA, and Morningstar ESG fund flow data. Gap is expressed in absolute terms ($Bn/year) and as % of need.

**Standards:** ['IPCC AR6 WGIII Finance Chapter 2022', 'UNFCCC Standing Committee on Finance 2023', 'CPI Global Landscape of Climate Finance 2023']
**Reference documents:** IPCC AR6 Working Group III â€” Chapter 15: Finance and Investment 2022; Climate Policy Initiative â€” Global Landscape of Climate Finance 2023; UNFCCC Standing Committee on Finance Biennial Assessment 2023; ICMA Green Bond Principles 2021; OECD Convergence Data on Blended Finance 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Validated externality pricing with uncertainty bands (analytics ladder: rung 2 → 3)

**What.** §7 re-identifies this module honestly: despite its guide's Paris-finance-gap framing (which belongs elsewhere), the code is a product-level true-cost engine — 15 products with BOM stage breakdowns, commodity-price sensitivity with bull/bear scenarios, and five monetised externalities in the Kering-EP&L style. Its flagged weaknesses: the air-pollution term is an unvalidated `0.15×GWP` proxy, externalities are single-point estimates with no uncertainty, the portfolio `commodity_sensitivity`/`revenue_mn` fields are `seed()`-synthetic with `top_commodity` assigned by index position. Evolution A hardens the pricing: replace the air proxy with pollutant-specific damage costs (EPA/EEA marginal damage values per PM2.5/NOx/SO2, requiring per-product pollutant estimates rather than a GWP scalar), attach low/central/high ranges to each shadow price (the SCC alone spans $51–$190 across vintages), and render true cost as a band.

**How.** (1) Move `EXTERNALITY_PRICES` to a versioned refdata table with source, vintage, and range columns. (2) Compute the externality breakdown at three price points; the waterfall shows central with whiskers. (3) Either wire portfolio sensitivity to real company commodity exposure (via the platform's company master and trade data) or remove the tab — the current seeded scoring is a §7-flagged fabrication.

**Prerequisites.** The seeded portfolio fields must not survive into a calibrated release; guide text re-pointed so §5 describes the true-cost model actually built. **Acceptance:** each externality line cites its price source and vintage; true-cost totals recompute correctly at all three price points; no `seed()` remains in any displayed metric.

### 9.2 Evolution B — True-cost explainer for product strategists (LLM tier 1 → 2)

**What.** A copilot that answers "why is the true cost of this EV battery 31% above its market price, and which stage drives it?" from the module's own computed surface: the externality breakdown (carbon/water/air/biodiversity/waste), the BOM stage margins (`marginDollar`, `totalMargin`, share treemap), and the commodity sensitivity sliders. Tier-2 slice: what-ifs run through the page's existing scenario machinery exposed as an endpoint — "reprice at SCC $190 and lithium +50%" returns engine-computed deltas.

**How.** Tier 1 grounds on this atlas record — §7.1's formulas and §7.5's caveats (demo BOM data, proxy air term) must appear in the copilot's framing so it never presents true cost as audited fact. Tier 2 wraps the adjusted-BOM computation (currently a `useMemo` chain) in a small backend route with commodity-factor and price-vintage overrides, so counterfactuals are computed, not narrated from memory.

**Prerequisites.** Evolution A's refdata table for price-vintage what-ifs; the BOM computation ported server-side for tier 2 (module is tier-B today). **Acceptance:** every dollar figure in an answer matches a logged tool response or the rendered page state; the copilot volunteers the air-proxy caveat when the air-pollution line is material to its answer.