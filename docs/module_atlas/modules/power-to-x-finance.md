# Power-to-X Project Finance
**Module ID:** `power-to-x-finance` · **Route:** `/power-to-x-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DS5 · **Sprint:** DS

## 1 · Overview
Project finance for Power-to-X conversion chains: green H2 to green ammonia, methanol, e-SAF and direct reduced iron, with EU subsidy modelling and carbon credit revenue stacking.

> **Business value:** Power-to-X economics require EU H2Global subsidies plus carbon credit revenue to reach bankable IRR of 8-10%; e-SAF and green ammonia are the nearest-term bankable PtX applications given EU regulatory mandates through 2035.

**How an analyst works this module:**
- Map full conversion chain efficiency from renewable electricity to PtX product
- Model EU H2Global and Innovation Fund subsidy eligibility and auction clearing price
- Stack carbon credit revenue (CBAM savings, voluntary carbon market) on top of product revenue
- Calculate project IRR with and without subsidy to determine bankability threshold

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CO2_SOURCES`, `HHV_H2`, `KpiCard`, `LHV_H2`, `PTX_PRODUCTS`, `Slider`, `TABS`, `YEARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PTX_PRODUCTS` | 7 | `label`, `formula`, `h2Kg`, `temp`, `pressure`, `efficiency`, `capexPerTpa`, `opexPct`, `lhvKwhPerKg`, `markets`, `price2025`, `color` |
| `CO2_SOURCES` | 6 | `label`, `cost2025`, `cost2030`, `cost2035`, `purity`, `scalable`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `LHV_H2` | `33.3;   // kWh/kg` |
| `HHV_H2` | `39.4;   // kWh/kg` |
| `YEARS` | `Array.from({ length: 11 }, (_, i) => 2025 + i);` |
| `h2Cost` | `lcohEur * h2Kg;` |
| `co2CostKg` | `(co2Cost / 1000) * co2Kg;` |
| `elecCostKg` | `elecCost / 1000 * elecKwh;` |
| `capexAnnKg` | `(capexPerTpa * (wacc / 100) / (1 - Math.pow(1 + wacc / 100, -lifetime)));` |
| `opexKg` | `capexPerTpa * opexPct / 100;` |
| `allLcop` | `useMemo(() => PTX_PRODUCTS.map(p => ({` |
| `demandData` | `useMemo(() => YEARS.map((y, i) => ({` |
| `co2Projection` | `useMemo(() => YEARS.map((y, i) => {` |
| `ghgData` | `PTX_PRODUCTS.map((p, i) => ({` |
| `waterfallData` | `useMemo(() => [ { name: 'H₂ feedstock', value: +(lcohEur * product.h2Kg).toFixed(2), fill: T.blue }, { name: 'CO₂ feedstock', value: +((co2Cost / 1000) * product.co2Kg).toFixed(2), fill: T.amber }, { name: 'Electricity (BOP)', value: +(elecCostPtx / 1000 * product.elecKwh).toFixed(2), fill: T.teal }, { name: 'Capex (annualised)', value: +` |
| `panelStyle` | `{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text };` |
| `gridStyle` | `{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 };` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CO2_SOURCES`, `PTX_PRODUCTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Green Ammonia LCOP | `LCOH($/kgH2)×0.178+Haber-Bosch CAPEX` | IRENA 2022 | Green NH3 at $800/t is 2-3× grey NH3 at $250-350/t; requires $400-600/t carbon price or subsidy for parity. |
| e-SAF Production Cost | `LCOH×H2_intensity+CO2_capture+FT_CAPEX` | ICAO CORSIA | e-SAF is 3-5× conventional jet fuel; EU mandate 2% by 2030, 6% by 2035 creates guaranteed demand. |
| H2Global Subsidy Impact | `Subsidy = (offtake_price - import_price) × volume` | EU H2Global 2023 | EU H2Global auction mechanism bridges import/offtake price differential; first auctions cleared 2023. |
- **EU subsidy auction results** → → revenue model → **Clearing price and volume by PtX product**
- **Carbon credit price curve** → → revenue stacking model → **VCM and compliance price by year**

## 5 · Intermediate Transformation Logic
**Methodology:** PtX Conversion Chain Economics
**Headline formula:** `PtX_LCOP = LCOH × conversion_ratio + CAPEX_converter×CRF/output + OPEX`

Conversion efficiency chain from renewable electricity to final product determines cost competitiveness; carbon credit revenue and EU H2Global subsidies bridge the gap to fossil incumbent prices.

**Standards:** ['IRENA Innovation Outlook: Electrofuels', 'EU Innovation Fund Guidelines', 'Hydrogen Council PtX Roadmap']
**Reference documents:** IRENA Innovation Outlook Electrofuels 2021; EU Innovation Fund Technical Guidance 2023; Hydrogen Council Power-to-X Roadmap 2021

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`

## 7 · Methodology Deep Dive

This module is genuinely grounded in chemical-process economics: each of the 6 PtX products carries
a real reaction stoichiometry, and the LCOP (levelised cost of product) calculator applies a
standard capital-recovery-factor annuitisation — not a synthetic scaling. The guide and code broadly
agree; the main gap is that market-price benchmarks and demand-growth curves are illustrative
constants, not sourced from a live market feed.

### 7.1 What the module computes

**Levelised Cost of Product (LCOP)** — real annuitised project-economics formula:

```js
h2Cost     = LCOH_€/kg × h2Kg_per_kgProduct                    // stoichiometric H2 input cost
co2CostKg  = (CO2Cost_€/t / 1000) × co2Kg_per_kgProduct         // stoichiometric CO2 input cost
elecCostKg = (ElecCost_€/MWh / 1000) × elecKwh_per_kgProduct    // balance-of-plant electricity
capexAnnKg = CapexPerTpa × [ WACC / (1 − (1+WACC)^−lifetime) ]  // capital recovery factor (CRF)
opexKg     = CapexPerTpa × OpexPct
LCOP       = h2Cost + co2CostKg + elecCostKg + capexAnnKg + opexKg
```
The CRF term `WACC/(1-(1+WACC)^-lifetime)` is the standard annuity factor used to convert a lump-sum
CAPEX into an equivalent annual charge — the same formula underlying LCOE/LCOH calculations
throughout the platform's other energy-finance modules.

### 7.2 Parameterisation

| Product | Reaction | H₂ (kg/kg product) | CO₂ (kg/kg product) | Efficiency | Capex (€/tpa) | Provenance |
|---|---|---|---|---|---|---|
| e-Methanol | CO₂ + 3H₂ → CH₃OH + H₂O | 0.187 | 1.375 | 72% | 850 | Real stoichiometric ratios (44g CO₂ + 3×2g H₂ → 32g CH₃OH mass balance ≈ matches) |
| e-Ammonia | N₂ + 3H₂ → 2NH₃ | 0.178 | 0 | 68% | 700 | Haber-Bosch stoichiometry (17g NH₃ needs 3/2×2g H₂ per mol → 0.178 kg H₂/kg NH₃ is correct) |
| e-SAF (via FT) | CO + 2H₂ → (–CH₂–)ₙ + H₂O | 0.31 | 3.16 | 47% | 2,400 | Fischer-Tropsch via RWGS, illustrative CO₂ intensity for jet-range hydrocarbons |
| e-Diesel (via FT) | CO + 2H₂ → CₙH₂ₙ₊₂ | 0.29 | 3.05 | 48% | 2,200 | Fischer-Tropsch, diesel-range |
| e-Methane (SNG) | CO₂ + 4H₂ → CH₄ + 2H₂O | 0.50 | 2.75 | 78% | 500 | Sabatier reaction — 4:1 H₂:CO₂ molar ratio scaled to mass is directionally consistent |
| e-Methanol (marine) | Same as e-Methanol, marine-grade | 0.187 | 1.375 | 71% | 950 | Same chemistry, higher capex for marine-fuel purification spec |
| LHV/HHV H₂ | 33.3 / 39.4 kWh/kg | — | — | — | — | Correct published hydrogen heating values |

CAPEX, OPEX%, and 2025/2030 market prices are illustrative but plausible figures (e.g. e-SAF
$2,800/t 2025 → $1,800/t 2030, consistent with the guide's cited $2.5–6.0/litre band once converted).

### 7.3 Calculation walkthrough

1. User selects a product and adjusts 6 sliders (LCOH, CO₂ cost, electricity cost, scale, WACC,
   lifetime).
2. `calcLcoP()` runs the 5-term cost build-up (§7.1) for the selected product and, separately, for
   all 6 products simultaneously (`allLcop`) to populate the comparison chart against each product's
   static 2025 market price.
3. **CO₂ source cost projection** (tab 3) linearly interpolates each of 5 CO₂ sources (DAC,
   Biogenic, Industrial, BECCS, Cement) between 2025/2030/2035 anchor costs — genuine piecewise-
   linear interpolation, static anchor values.
4. **Demand projections** (tab 6) use a compound-growth formula
   `demand(year_i) = base × (1+growthRate)^i` per product — a real exponential-growth model, with
   `base`/`growthRate` pairs chosen illustratively (e.g. e-SAF: base=0.05, growth=60%/yr).

### 7.4 Worked example

e-Ammonia, LCOH=€3.5/kg, CO₂Cost=€150/t (unused, co2Kg=0), ElecCost=€60/MWh, Capex=€700/tpa,
Opex%=3.5, WACC=8%, lifetime=20yr:

| Step | Computation | Result |
|---|---|---|
| h2Cost | 3.5 × 0.178 | €0.623/kg |
| co2CostKg | (150/1000) × 0 | €0.00/kg |
| elecCostKg | (60/1000) × 0.6 | €0.036/kg |
| CRF | 0.08 / (1 − 1.08⁻²⁰) = 0.08/(1−0.2145) | 0.1019 |
| capexAnnKg | 700 × 0.1019 | €71.3/tonne → €0.0713/kg |
| opexKg | 700 × 0.035 | €24.5/tonne → €0.0245/kg |
| **LCOP** | 0.623+0+0.036+0.0713+0.0245 | **€0.755/kg ≈ €755/t** |

Against the static 2025 market price of $480/t for grey/blue ammonia benchmark, this green ammonia
LCOP (~€755/t, roughly $810/t at typical EUR/USD) is meaningfully above the fossil incumbent —
consistent with the guide's cited 2–3× cost gap needing carbon-price or subsidy support.

### 7.5 Data provenance & limitations

- **Chemistry (stoichiometric H₂/CO₂ ratios, reaction formulas) is genuinely accurate** and grounded
  in real process engineering (Haber-Bosch, Fischer-Tropsch, Sabatier, methanol synthesis).
- **CAPEX/OPEX/efficiency/market-price figures are illustrative point estimates**, not sourced to a
  specific IRENA/BNEF/Hydrogen Council table row-by-row (though broadly consistent with the guide's
  cited ranges).
- No project-finance layer beyond LCOP — no debt sizing, no DSCR, no subsidy-stacking calculation
  despite the guide's claim of "carbon credit revenue stacking" and "H2Global subsidy modelling";
  these appear as descriptive tab labels without a corresponding computed subsidy bridge.
- CO₂ source cost interpolation and demand-growth curves are real formulas over illustrative anchor
  constants.

## Framework alignment

**IRENA Innovation Outlook: Electrofuels** — the LCOP cost-stacking approach (feedstock + capex
annuity + opex) mirrors IRENA's PtX costing methodology; anchor cost figures are illustrative rather
than sourced line-by-line from the report. **EU Innovation Fund / H2Global** — named as the subsidy
mechanisms that bridge green-fossil cost gaps; no subsidy calculation is implemented in code.
**ICAO CORSIA / EU ReFuelEU** — cited correctly as the demand-mandate drivers behind e-SAF's
aggressive growth-rate assumption (60%/yr) in the demand projection.

## 9 · Future Evolution

### 9.1 Evolution A — Subsidy-stacking backend with auction-calibrated prices (analytics ladder: rung 2 → 3)

**What.** The page is tier-B frontend-only: the LCOP build-up (`calcLcoP()`, CRF annuity, real Haber-Bosch/Fischer-Tropsch/Sabatier stoichiometry in `PTX_PRODUCTS`) is genuine, but §7.5 documents that "H2Global subsidy modelling" and "carbon credit revenue stacking" exist only as tab labels — no computed subsidy bridge — and market prices/demand growth are illustrative constants. Evolution A builds the module's first backend vertical: a PtX economics engine that adds the missing revenue side (H2Global two-sided auction spread, Innovation Fund €/tCO₂-avoided grant, CBAM savings, VCM credits) and calibrates price anchors to published H2Global auction clearings and EU ETS/CBAM curves.

**How.** (1) New route `api/v1/routes/ptx_finance.py` with `POST /lcop` (porting the 5-term cost build-up so bench_quant can pin the §7.4 worked example, €755/t e-ammonia) and `POST /subsidy-bridge` computing `subsidy = (offtake − import_price) × volume` per the §4.1 formula that today has no implementation. (2) Seed a `ref_ptx_market_anchors` table with dated H2Global auction results and product price benchmarks replacing the in-page `price2025` constants. (3) Frontend keeps sliders; numbers come from the engine with `source` provenance per row.

**Prerequisites.** Anchor dataset curated from public H2Global/Innovation Fund publications; bench_quant reference case added. **Acceptance:** engine LCOP reproduces the §7.4 walkthrough to the cent, and the subsidy bridge returns a non-null bankability gap for e-ammonia that changes when auction clearing price changes.

### 9.2 Evolution B — Bankability copilot over the conversion chain (LLM tier 1 → 2)

**What.** A copilot on the PtX page that explains the cost stack an analyst is looking at — "why is e-SAF 3× jet fuel?" answered from the module's own decomposition (h2Cost/co2CostKg/elecCostKg/capexAnnKg/opexKg shares, FT efficiency 47%, capex €2,400/tpa) — and, once Evolution A ships, runs what-ifs ("LCOH at €2/kg, WACC 6%, DAC CO₂") as tool calls against `POST /lcop` and `/subsidy-bridge` rather than generating numbers.

**How.** Tier 1 first: RAG over this Atlas record (§5 methodology, §7.1–7.4 formulas and worked example are the grounding corpus) via the standard `POST /api/v1/copilot/{module_id}/ask` router with pgvector chunks; the copilot must state plainly that market prices and demand curves are illustrative — the honest-limitations text in §7.5 becomes part of its refusal context. Tier 2 upgrade auto-generates tool schemas from the new engine's OpenAPI operations; the no-fabrication validator checks every numeric against tool outputs.

**Prerequisites.** Tier 2 requires Evolution A's backend (there are no endpoints today to tool-call). **Acceptance:** copilot correctly attributes each €/kg term to its formula and refuses questions the module doesn't compute (e.g. DSCR or debt sizing, explicitly absent per §7.5).