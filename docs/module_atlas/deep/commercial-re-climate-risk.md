## 7 · Methodology Deep Dive

This module (EP-EI2) is a **CRREM stranded-asset** analytics page. It aligns reasonably with its guide: it
uses EPC bands, CRREM pathway logic and NGFS scenario stress. The page-level `computed` set is small
(portfolio KPIs), with the CRREM gap / stranding-year logic and pathway data held in seed schemas and the
backend `commercial_re_engine.py`.

### 7.1 What the module computes

Portfolio KPIs over a filtered asset set (`n` assets):
```js
strandedPct = round( count(p.epc >= 'D') / n · 100 )      // share of D–G stranded-risk assets
avgRetrofit = round( Σ retrofitCost / n )
avgValRisk  = ( Σ parseFloat(valuationRisk) / n ).toFixed(1)
annualSaving = r.energySave·0.15 + r.carbonSave·carbonPrice/1000   // retrofit payback numerator
```
The `annualSaving` combines an energy-cost saving (£0.15/kWh implied) with a carbon saving valued at the
user's `carbonPrice` — this drives the retrofit-payback business case (guide's `RetrofitPayback =
RetrofitCost / (EnergySaving + RentPremium + AvoidedStrandingLoss)`).

### 7.2 Parameterisation / scoring rubric

| Seed schema / constant | Fields | Provenance |
|---|---|---|
| `EPC_RATINGS` (8) | pct, rentPremium, strandedRisk, euTaxonomy, crremAligned | CRREM v2.0 + EU Taxonomy Art. 7.7 |
| `NGFS_SCENARIOS` (5) | physicalRisk, transitionRisk, strandedAssets, avgValuationImpact | NGFS 2023 scenario set |
| Energy price | `0.15` £/kWh (in annualSaving) | heuristic UK commercial tariff |
| Carbon saving value | `carbonSave·carbonPrice/1000` | user carbon price × tCO₂e |
| EPC stranding threshold | `epc >= 'D'` | heuristic (D–G at CRREM risk) |

Guide anchors: EPC G 94% stranded by 2030 (CRREM v2.0); NGFS Hot House LTV −12%; CRREM office net-zero
pathway 25 kWh/m²/yr by 2050 (from ~180 today, 86% cut).

### 7.3 Calculation walkthrough

EPC-band filter subsets assets → `strandedPct` measures the D–G share → `avgRetrofit`/`avgValRisk` roll up
cost and valuation-at-risk → the retrofit tab computes `annualSaving` and divides `retrofitCost` by it for
payback, with a `carbonPrice` slider shifting the carbon-value term. NGFS scenario overlays apply the stored
`avgValuationImpact`/`strandedAssets` per scenario to stress LTV/NOI/cap-rate/vacancy. The backend
`/crrem`, `/epc-epbd`, `/green-lease`, `/full-assessment` endpoints provide the CRREM gap and stranding-year
engine.

### 7.4 Worked example

Retrofit: `retrofitCost = £500k`, `energySave = 400,000 kWh/yr`, `carbonSave = 120 tCO₂e/yr`,
`carbonPrice = £80/t`:
```
annualSaving = 400,000·0.15 + 120·80/1000
             = 60,000 + 9.6 = £60,009.6/yr
payback = 500,000 / 60,010 ≈ 8.3 years
```
Raising the carbon price to £200/t adds `120·200/1000 = £24` (the /1000 scaling makes the carbon term small
here relative to energy) — so in this configuration energy savings dominate payback. An EPC-G asset in the
filter contributes to `strandedPct`; under the NGFS Hot House scenario its valuation is stressed by the
stored −12% LTV impact.

### 7.5 Data provenance & limitations

- EPC and NGFS datasets are **curated** to CRREM v2.0 / NGFS 2023 figures; asset-level attributes feeding the
  KPIs are seeded. The stranding-year engine lives in the backend, not the page's `computed` block.
- The `annualSaving` carbon term uses `/1000`, making carbon value small relative to the £0.15/kWh energy
  term — a scaling choice worth flagging when interpreting payback sensitivity to carbon price.
- `strandedPct` uses a static `epc >= 'D'` cut rather than a CRREM-pathway-crossing year per asset on-page.

**Framework alignment:** CRREM v2.0 (stranding = asset EUI exceeds sector/country pathway; office 25
kWh/m²/yr by 2050) · NGFS 2023 (Orderly/Disorderly/Hot House valuation impacts) · EU Taxonomy Art. 7.7
(building screening) · UK MEES (F/G letting ban, expanding to E by 2028). The retrofit-payback and stranding
logic mirror JLL/CRREM stranded-asset practice.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Per-asset CRREM stranding year, climate-adjusted valuation and retrofit
prioritisation for a commercial real-estate book, feeding lender LTV stress and REIT transition planning.

**8.2 Conceptual approach.** CRREM decarbonisation-pathway crossing for stranding, plus a DCF revaluation
that prices stranding discount and retrofit capex into value — mirroring CRREM v2.0 methodology and JLL/
MSCI real-assets climate-VaR revaluation.

**8.3 Mathematical specification.**
```
StrandingYear_a = min t : AssetEUI_a(t) > CRREM_Pathway_{sector,country}(t)
   AssetEUI_a(t) declines with retrofits; pathway declines to net-zero by 2050
ValueImpact_a = − PV( stranding-period NOI loss + carbon-cost exposure + capex-to-comply )
RetrofitPayback = RetrofitCost / (EnergySaving + RentPremium_EPC + AvoidedStrandingLoss)
NGFS overlay:  LTV_stressed = Loan / (Value·(1 + avgValuationImpact_scenario))
```

| Parameter | Source |
|---|---|
| CRREM pathways | CRREM v2.0 sector/country EUI curves |
| EPC rent premium | BoE/JLL EPC-premium research |
| Carbon cost | EU-ETS / UK-ETS price path |
| NGFS valuation impacts | NGFS 2023 physical/transition scenarios |

**8.4 Data requirements.** Asset EUI, floor area, EPC, sector, country, NOI, loan balance; CRREM pathways
(platform `/crrem` ref); carbon price. Free: CRREM public pathways; vendor: EPC register, valuation feeds.

**8.5 Validation & benchmarking.** Reconcile stranding-year distribution vs CRREM published (EPC G 94% by
2030); DCF revaluation vs MSCI climate-VaR; retrofit-payback sensitivity to carbon and energy price.

**8.6 Limitations & model risk.** EUI data quality; pathway-country coverage gaps; behavioural rent
response uncertain. Fallback: EPC-band-average stranding proxy when asset EUI is unavailable.
