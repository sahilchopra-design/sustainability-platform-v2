# Sustainable Forestry & Timber Project Finance
**Module ID:** `forestry-timber-finance` · **Route:** `/forestry-timber-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DX5 · **Sprint:** DX

## 1 · Overview
Sustainable forestry and timber project finance analytics covering timber REIT structures, FSC/PEFC certification premium, carbon-timber dual revenue streams, biological asset valuation under IAS 41, and climate risk to timber yield.

> **Business value:** Enables integrated timberland investment analysis combining IAS 41 biological asset valuation, FSC certification premium, and carbon-timber dual revenue with climate risk stress-testing.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CARBON_METHODOLOGIES`, `FOREST_TYPES`, `RETURN_BENCHMARKS`, `TABS`, `TIMOS_LIST`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `landCost` | `landHa * landCostHa;` |
| `plantCost` | `landHa * plantCostHa;` |
| `annMgmt` | `landHa * annMgmtHa;` |
| `mairFactor` | `mairPct / 100;` |
| `finalVolM3` | `landHa * 250 * Math.pow(1 + mairFactor, rotatYr);` |
| `timberRev` | `finalVolM3 * timberPriceM3 * (1 + fscPremPct / 100);` |
| `annCarbonRev` | `landHa * carbonSeqTha * carbonPriceT;` |
| `totalCarbonRev` | `annCarbonRev * rotatYr;` |
| `cfs` | `[-(landCost + plantCost), ...Array.from({ length: rotatYr }, (_, i) => i === rotatYr - 1 ? timberRev + annCarbonRev - annMgmt : annCarbonRev - annMgmt` |
| `npvCalc` | `cfs.reduce((s, c, t) => s + c / Math.pow(1 + wacc / 100, t), 0);` |
| `carbonSensData` | `useMemo(() => [0, 5, 10, 15, 20, 30, 40, 60].map(cp => ({` |
| `returnData` | `useMemo(() => RETURN_BENCHMARKS.map(b => ({ name: b.asset.split('(')[0].trim(), yr10: b.yr10Ann, yr20: b.yr20Ann })), []);` |
| `carbonRevData` | `useMemo(() => FOREST_TYPES.map(f => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CARBON_METHODOLOGIES`, `FOREST_TYPES`, `RETURN_BENCHMARKS`, `TABS`, `TIMOS_LIST`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Timberland IRR | `PV(timber + carbon revenue) / Timberland acquisition cost, solving for discount rate` | NCREIF Timberland Index | Historical timberland IRR 6-9%; outperforms listed equities over 20yr with low correlation; climate risk may r |
| FSC Certification Premium | `(FSC timber price - non-certified price) / non-certified price` | Forest Trends FSC price survey | Premium ranges 5-25% depending on end market (UK/EU higher); certification cost $0.5-2/ha/yr |
| Carbon-Timber Dual Revenue | `Incremental carbon stock growth per ha × carbon price` | Verra VCS improved forest management methodology | IFM additionality critical; cannot double-count with timber sale GHG accounting |
- **NCREIF Timberland Index** → Historical returns, valuations by species and region → IRR benchmarks → **Return expectations and risk calibration**
- **Forest Trends FSC price survey** → Certified vs uncertified timber price differentials by product → premium model → **Revenue uplift from certification**
- **Verra VCS IFM project database** → Carbon credit issuance rates by forest type and management practice → carbon revenue model → **Dual revenue stream analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** Biological Asset & Dual Revenue Valuation
**Headline formula:** `Timberland Value = PV(Timber Revenue) + PV(Carbon Credits) - PV(Costs); IAS 41 Fair Value = Σ(Volume_i × Price_i × (1 - Harvesting Cost%))`
**Standards:** ['IAS 41 Agriculture — Biological Assets', 'FSC Forest Management Standard', 'IPCC Good Practice Guidance for LULUCF']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).