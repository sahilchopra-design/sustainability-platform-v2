# Commercial RE Climate Risk
**Module ID:** `commercial-re-climate-risk` · **Route:** `/commercial-re-climate-risk` · **Tier:** A (backend vertical) · **EP code:** EP-EI2 · **Sprint:** EI

## 1 · Overview
CRREM-aligned stranded asset analytics for commercial real estate: EPC band distribution with stranding risk, 24-asset CRREM gap and stranding year analysis, 4 NGFS scenario stress testing (LTV/NOI/cap rate/vacancy), CRREM pathways by sector, carbon price sensitivity on retrofit payback.

> **Business value:** Used by real estate lenders stress-testing mortgage book under NGFS scenarios, institutional investors screening for stranded asset exposure, and REIT teams managing CRREM pathway compliance.

**How an analyst works this module:**
- Filter by EPC band to identify high-stranding-risk properties (EPC E–G)
- Review CRREM pathways for Office/Retail/Logistics/Hotel sectors with scenario overlays
- Model 4 NGFS scenarios to stress-test portfolio LTV, NOI, cap rate and vacancy impacts
- Use carbon price slider to analyse how rising carbon costs affect retrofit business case payback

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CRREM_PATHWAY`, `EPC_RATINGS`, `KpiCard`, `NGFS_SCENARIOS`, `PROPERTIES`, `Pill`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `EPC_RATINGS` | 8 | `pct`, `rentPremium`, `strandedRisk`, `euTaxonomy`, `crremAligned` |
| `NGFS_SCENARIOS` | 5 | `physicalRisk`, `transitionRisk`, `strandedAssets`, `avgValuationImpact` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `strandedPct` | `Math.round((filtered.filter(p => p.epc >= 'D').length / n) * 100);` |
| `avgRetrofit` | `Math.round(filtered.reduce((a, p) => a + p.retrofitCost, 0) / n);` |
| `avgValRisk` | `(filtered.reduce((a, p) => a + parseFloat(p.valuationRisk), 0) / n).toFixed(1);` |
| `annualSaving` | `(r.energySave * 0.15) + (r.carbonSave * carbonPrice / 1000);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/commercial-re/crrem` | `crrem` | api/v1/routes/commercial_re.py |
| POST | `/api/v1/commercial-re/epc-epbd` | `epc_epbd` | api/v1/routes/commercial_re.py |
| POST | `/api/v1/commercial-re/gresb` | `gresb` | api/v1/routes/commercial_re.py |
| POST | `/api/v1/commercial-re/refi` | `refi` | api/v1/routes/commercial_re.py |
| POST | `/api/v1/commercial-re/nabers` | `nabers` | api/v1/routes/commercial_re.py |
| POST | `/api/v1/commercial-re/green-lease` | `green_lease` | api/v1/routes/commercial_re.py |
| POST | `/api/v1/commercial-re/retrofit` | `retrofit` | api/v1/routes/commercial_re.py |
| POST | `/api/v1/commercial-re/full-assessment` | `full_assessment` | api/v1/routes/commercial_re.py |
| GET | `/api/v1/commercial-re/ref/crrem-pathways` | `ref_crrem_pathways` | api/v1/routes/commercial_re.py |
| GET | `/api/v1/commercial-re/ref/epc-thresholds` | `ref_epc_thresholds` | api/v1/routes/commercial_re.py |
| GET | `/api/v1/commercial-re/ref/retrofit-measures` | `ref_retrofit_measures` | api/v1/routes/commercial_re.py |
| GET | `/api/v1/commercial-re/ref/green-premium` | `ref_green_premium` | api/v1/routes/commercial_re.py |

### 2.3 Engine `commercial_re_engine` (services/commercial_re_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CommercialREEngine.assess_crrem` | entity_id, asset_type, country, energy_intensity_kwh_m2, co2_intensity_kgco2_m2 |  |
| `CommercialREEngine.assess_epc_epbd` | entity_id, country, building_type, primary_energy_kwh_m2 |  |
| `CommercialREEngine.calculate_gresb_score` | entity_id, management_data, performance_data, peer_percentile | GRESB Real Estate score from supplied management/performance criteria. Only criteria actually provided by the caller are scored; missing criteria are omitted rather than fabricated. ``peer_percentile`` is an honest passthrough of a caller-supplied GRESB cohort rank (0-100) and is ``None`` when unknown — it is never invented from a random draw. |
| `CommercialREEngine.assess_refi` | entity_id, physical_risk_inputs, transition_risk_inputs | REFI Protocol physical + transition risk tiering. Each sub-factor is scored only when the caller supplies it; the REFI weights are renormalised over the factors actually present so a partial input set still yields a defensible 0-100 dimension score. A dimension with no supplied factors is returned as ``None`` (insufficient data) rather than filled with a random draw. |
| `CommercialREEngine.calculate_nabers` | entity_id, asset_type, annual_energy_kwh, gross_area_m2, hours_pa, annual_water_kl, indoor_stars_rating | NABERS star ratings. Energy stars are computed from metered energy intensity against the NABERS Energy benchmark. Water stars are computed from ``annual_water_kl`` (metered water) against the NABERS Water benchmark when supplied, else ``None``. Indoor Environment stars require a certified IEQ assessment and are an honest passthrough of ``indoor_stars_rating`` (``None`` when not provided) — neither |
| `CommercialREEngine.assess_green_lease` | entity_id, lease_clauses_present |  |
| `CommercialREEngine.model_retrofit` | entity_id, asset_type, current_energy_kwh_m2, floor_area_m2, discount_rate, energy_price_kwh |  |
| `CommercialREEngine.generate_full_assessment` | entity_id, asset_data |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `EPC_RATINGS`, `NGFS_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EPC G stranding risk | `Of EPC G assets stranded by 2030` | CRREM v2.0 2023 analysis | EPC G buildings have highest CRREM gap; UK MEES regulations already prohibit new lettings on EPC F/G from 2023. |
| NGFS Hot House LTV impact | `LTV deterioration under 4°C scenario` | NGFS Physical Risk Financial Impacts 2023 | Property values decline as transition costs rise and physical damage increases; lenders must stress-test LTVs under NGFS scenarios. |
| CRREM Office net zero pathway | `By 2050 EU average` | CRREM v2.0 Office Pathway | Current average EU office EUI ~180 kWh/m²/yr; 86% reduction required requiring systematic deep retrofit programme. |
- **CRREM v2.0 + NGFS 2023 + EPC UK/EU + EU Taxonomy + TCFD Real Assets** → Stranding year analysis + NGFS stress test + CRREM pathway chart + carbon price sensitivity + EPC filter → **Real estate lenders, institutional investors, REIT ESG teams, and climate risk managers**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/commercial-re/ref/crrem-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/commercial-re/ref/epc-thresholds** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/commercial-re/ref/green-premium** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/commercial-re/ref/retrofit-measures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**POST /api/v1/commercial-re/crrem** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/commercial-re/epc-epbd** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/commercial-re/full-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/commercial-re/green-lease** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** CRREM Stranding Year
**Headline formula:** `CRREM_Gap = AssetEUI − Pathway_EUI(year); StrandingYear = t where AssetEUI > CRREM_Pathway(t); RetrofitPayback = RetrofitCost / (EnergySaving + RentPremium + AvoidedStrandingLoss)`

Assets with EUI more than 20% above CRREM pathway face imminent stranding risk; institutional investors are already pricing stranding discount.

**Standards:** ['CRREM v2.0 (2023)', 'NGFS Climate Scenarios 2023', 'EU Taxonomy Art. 7.7']
**Reference documents:** CRREM (2023) – Carbon Risk Real Estate Monitor v2.0 Pathways; NGFS (2023) – Physical Risk Financial Impacts on Real Estate; JLL (2023) – Stranded Assets: The Ticking Clock in Real Estate

**Engine `commercial_re_engine` — extracted transformation lines:**
```python
years_to_stranding = yr - 2025
overconsumption_gap = max(0.0, co2_intensity_kgco2_m2 - pathway_2030)
epc_rating = list(thresholds.keys())[-1]  # worst rating by default
current_idx = rating_order.index(epc_rating) if epc_rating in rating_order else len(rating_order) - 1
total_score = management_score + performance_score
score = sum(float(inputs[k]) * w for k, w in present.items()) / total_w
composite_score = min(100.0, max(0.0, sum(present_dims) / len(present_dims)))
energy_intensity = annual_energy_kwh / max(gross_area_m2, 1.0)  # kWh/m²
energy_stars = 1.0 + t * 2.0
energy_stars = 3.0 + t * 2.0
energy_stars = 5.0 + t * 1.0
water_intensity = float(annual_water_kl) / max(gross_area_m2, 1.0)  # kL/m²
ws = 1.0 + t * 2.0
ws = 3.0 + t * 2.0
ws = 5.0 + t * 1.0
score = present_weight / max(total_weight, 1.0) * 100.0
current_energy_total = current_energy_kwh_m2 * floor_area_m2
annual_saving_value = energy_saving_pa * energy_price_kwh
payback = capex / max(annual_saving_value, 0.01)
irr_guess = annual_saving_value / capex
disc = (1.0 + irr_guess) ** yr
crrem_year_improvement = int(total_co2_saving / max(floor_area_m2, 1.0) / 5.0)  # rough years
portfolio_irr = total_annual_value_top5 / max(total_capex_top5, 1.0)
portfolio_irr=round(portfolio_irr * 100.0, 2),
annual_energy = energy_intensity * floor_area
refi_term = refi.composite_score * 0.30 if refi.composite_score is not None else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Per-asset stranding years from real EPC certificates (analytics ladder: rung 2 → 3)

**What.** EP-EI2 is a real vertical — `commercial_re_engine` behind 12 routes, with the
four ref GETs (CRREM pathways, EPC thresholds, retrofit measures, green premium)
passing the harness — but the page's stranding logic is a static `epc >= 'D'` cut over
seeded assets rather than the per-asset CRREM-pathway-crossing year the backend can
compute (§7.5). Evolution A closes the loop: real building data in, engine-computed
stranding years out. The platform already integrated the UK EPC register (data-sources
wave 1) — this module is its natural consumer.

**How.** (1) Frontend swap: the 24-asset seed panel loads from ingested EPC
certificates (floor area, band, EUI where derivable), and `POST /commercial-re/crrem`
computes `CRREM_Gap = AssetEUI − Pathway_EUI(year)` and stranding year per asset —
replacing the `epc >= 'D'` proxy with actual pathway crossings. (2) Triage the harness
gaps: `/full-assessment` shows status `failed` and the core POSTs (`/crrem`,
`/epc-epbd`, `/green-lease`) were only `skipped` — they need payload fixtures and a
passing sweep before the frontend depends on them. (3) Retrofit payback: revisit the
`carbonSave·carbonPrice/1000` term §7.5 flags as scaling carbon value to near-nothing
(£9.6/yr vs £60,000 energy in the worked example) — verify units (t vs kg) and make
the rent-premium and avoided-stranding-loss terms from the guide's formula real
inputs. (4) Pin the corrected worked example in `bench_quant.py`.

**Prerequisites.** UK EPC ingest coverage for the demo portfolio's geographies;
harness fixtures for the skipped POSTs. **Acceptance:** two assets in the same EPC
band with different EUIs get different stranding years; the carbon-price slider moves
payback by a defensible magnitude after the units audit; `/full-assessment` passes the
lineage sweep.

### 9.2 Evolution B — Mortgage-book stress analyst for RE lenders (LLM tier 2)

**What.** The module's first stated user is "real estate lenders stress-testing
mortgage book under NGFS scenarios". Evolution B gives them a tool-calling analyst:
"stress the logistics book under Hot House and flag refinancing risk" runs
`POST /commercial-re/full-assessment` (and `/refi` for the refinancing lens) per asset,
then reports LTV/NOI/cap-rate impacts, stranding-year distribution, and which loans
breach covenant thresholds — every figure from tool output. Retrofit questions ("is it
worth funding this borrower's retrofit?") call `/retrofit` and narrate the computed
payback against the green-premium reference data.

**How.** Tool schemas from the module's 12 OpenAPI operations; the four ref GETs serve
as citable grounding (CRREM pathway values, EPC thresholds) so the analyst quotes
pathway numbers from the engine, not from memory. System prompt from §5 (stranding
formula, CRREM v2.0/NGFS standards) and §7.2's parameter provenance so it discloses
which scenario impacts are curated NGFS figures. No-fabrication validator on all
basis-point and year figures.

**Prerequisites (hard).** Evolution A's endpoint triage — `/full-assessment` currently
fails and cannot anchor an analyst; real asset data so narratives describe an actual
book. **Acceptance:** a book-level stress memo where every LTV delta and stranding
year matches a tool response; the analyst refuses to opine on asset classes the CRREM
pathways don't cover rather than borrowing an adjacent pathway silently.