# Residential RE Assessment
**Module ID:** `residential-re-assessment` · **Route:** `/residential-re-assessment` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Residential property climate risk and energy performance analytics integrating EPC ratings, flood and heat exposure, and mortgage portfolio vulnerability scoring.

> **Business value:** Provides lenders with property-level climate risk and energy efficiency analytics for residential mortgage books.

**How an analyst works this module:**
- Geocode mortgage portfolio and overlay EPC registry data.
- Intersect with flood, heat stress and subsidence hazard layers.
- Compute climate haircuts by hazard scenario and property type.
- Score mortgage book by climate-adjusted LTV and flag remediation priorities.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `ClimatePhysicalRisk`, `EPC_GRADES`, `EpcEnergyTransition`, `GBP_EUR`, `MortgageStress`, `PRICE_TREND`, `PROPERTIES`, `PROP_TYPES`, `PortfolioOverview`, `REGIONS`, `RESIDENTIAL_API`, `STRESS_SCENARIOS`, `TABS`, `TENURE`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PRICE_TREND` | 11 | `london`, `ukAvg`, `northWest`, `scotland` |
| `STRESS_SCENARIOS` | 8 | `hpi`, `mortgageRate`, `affordPct` |
| `TABS` | 5 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `"http://localhost:8001";` |
| `RESIDENTIAL_API` | ``${API}/api/v1/residential-re`;` |
| `pick` | `(arr, s) => arr[Math.floor(sr(s) * arr.length)];` |
| `PROP_TYPES` | `["Terraced","Semi-Detached","Detached","Flat/Apartment","Bungalow"];` |
| `TENURE` | `["Owner-Occupied","Buy-to-Let","Social Housing","Shared Ownership"];` |
| `epcIdx` | `Math.min(6, Math.floor(sr(i * 7) * 7));` |
| `value` | `Math.round(150 + sr(i * 11) * 1350);  // £k` |
| `ltv` | `+(0.45 + sr(i * 13) * 0.45).toFixed(2);` |
| `physRisk` | `Math.round(10 + sr(i * 17) * 80);` |
| `floodZ` | `sr(i * 19) > 0.75;` |
| `costToC` | `epcIdx > 2 ? Math.round(5 + sr(i * 23) * 35) : 0; // £k to reach C` |
| `stranded` | `epcIdx >= 5 && sr(i * 31) > 0.4;` |
| `totalValue` | `PROPERTIES.reduce((s,p) => s + p.value, 0);` |
| `avgLtv` | `(PROPERTIES.reduce((s,p) => s + p.ltv, 0) / (PROPERTIES.length \|\| 1) * 100).toFixed(1);` |
| `regionAgg` | `REGIONS.map(r => {` |
| `epcDist` | `EPC_GRADES.map(g => ({` |
| `scatterData` | `PROPERTIES.map(p => ({` |
| `totalRetrofitCost` | `PROPERTIES.filter(p => p.epcIdx > 2).reduce((s, p) => s + p.costToC, 0);` |
| `energyByEpc` | `EPC_GRADES.map(g => {` |
| `greenPremiumData` | `PROPERTIES.filter(p => p.greenPrem > 0).slice(0, 15).map(p => ({` |
| `RETROFIT_COSTS` | `EPC_GRADES.map((g, i) => ({` |
| `stressedLtv` | `useMemo(() => { const hpiAdj = -0.05 * Math.max(0, rate - 4.5);` |
| `affordData` | `[3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0].map(r => {` |
| `hpi` | `-0.05 * Math.max(0, r - 4.5);` |
| `afford` | `28 + (r - 3.5) * 5.5;` |
| `byId` | `new Map(liveResult.property_results.map(r => [r.property_id, r]));` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/residential-re/value-property` | `value_property` | api/v1/routes/residential_re.py |
| POST | `/api/v1/residential-re/mortgage-portfolio` | `assess_mortgage_portfolio` | api/v1/routes/residential_re.py |
| POST | `/api/v1/residential-re/decarb-pathway` | `decarb_pathway` | api/v1/routes/residential_re.py |
| GET | `/api/v1/residential-re/ref/epc-energy` | `ref_epc_energy` | api/v1/routes/residential_re.py |
| GET | `/api/v1/residential-re/ref/mees-timelines` | `ref_mees_timelines` | api/v1/routes/residential_re.py |
| GET | `/api/v1/residential-re/ref/crrem-pathway` | `ref_crrem_pathway` | api/v1/routes/residential_re.py |
| GET | `/api/v1/residential-re/ref/retrofit-costs` | `ref_retrofit_costs` | api/v1/routes/residential_re.py |
| GET | `/api/v1/residential-re/ref/decarb-measures` | `ref_decarb_measures` | api/v1/routes/residential_re.py |
| GET | `/api/v1/residential-re/ref/hedonic-coefficients` | `ref_hedonic_coefficients` | api/v1/routes/residential_re.py |

### 2.3 Engine `residential_re_engine` (services/residential_re_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ResidentialRealEstateEngine.value_property` | inp | Hedonic regression-based valuation with EPC premium/discount, CRREM stranding year, MEES compliance, and climate-adjusted LTV. |
| `ResidentialRealEstateEngine.assess_mortgage_portfolio` | inp | Portfolio-level mortgage climate risk: EPC distribution, stranding exposure, LTV stress, and aggregate retrofit cost. |
| `ResidentialRealEstateEngine.decarb_pathway` | units, target_epc, energy_cost_eur_kwh, grid_ef_kgco2_kwh | Generate decarbonisation pathway for a social/affordable housing stock. units: list of {"unit_id", "floor_area_m2", "epc_rating", "property_type"} |
| `ResidentialRealEstateEngine.get_epc_energy_map` |  |  |
| `ResidentialRealEstateEngine.get_mees_timelines` |  |  |
| `ResidentialRealEstateEngine.get_crrem_residential_pathway` |  |  |
| `ResidentialRealEstateEngine.get_retrofit_cost_matrix` |  |  |
| `ResidentialRealEstateEngine.get_decarb_measures` |  |  |
| `ResidentialRealEstateEngine.get_hedonic_coefficients` |  |  |
| `ResidentialRealEstateEngine._estimate_retrofit_cost` | from_epc, to_epc, area_m2 | Estimate total retrofit cost to improve from one EPC band to another. |

**Engine `residential_re_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `EPC_ORDER` | `['A', 'B', 'C', 'D', 'E', 'F', 'G']` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `EPC_GRADES`, `PRICE_TREND`, `PROP_TYPES`, `REGIONS`, `STRESS_SCENARIOS`, `TABS`, `TENURE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EPC A/B Share | — | EPC Register | Proportion of residential portfolio with Energy Performance Certificate rating A or B. |
| Flood Zone Exposure | — | EA Flood Map | Share of mortgaged properties in high or medium flood risk zones. |
| Avg Climate Haircut | — | NGFS model | Average property value reduction attributable to physical climate risk under RCP 4.5 by 2035. |
- **Mortgage register, EPC data, hazard raster layers** → Geocoding, hazard overlay, climate haircut modelling → **Climate-adjusted LTV scores, EPC upgrade flags, portfolio heatmaps**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/residential-re/ref/crrem-pathway** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['crrem_pathway'], 'n_keys': 1}`

**GET /api/v1/residential-re/ref/decarb-measures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['measures'], 'n_keys': 1}`

**GET /api/v1/residential-re/ref/epc-energy** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['epc_energy_map'], 'n_keys': 1}`

**GET /api/v1/residential-re/ref/hedonic-coefficients** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['coefficients'], 'n_keys': 1}`

**GET /api/v1/residential-re/ref/mees-timelines** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['mees_timelines'], 'n_keys': 1}`

**GET /api/v1/residential-re/ref/retrofit-costs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['retrofit_costs'], 'n_keys': 1}`

**POST /api/v1/residential-re/decarb-pathway** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/residential-re/mortgage-portfolio** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted LTV
**Headline formula:** `Loan Balance ÷ (Property Value × (1 – Climate Haircut))`

Adjusts loan-to-value ratio for estimated physical climate risk depreciation on individual properties.

**Standards:** ['NGFS Physical Risk', 'EBA LOM Guidelines']
**Reference documents:** EBA Loan Origination and Monitoring Guidelines 2020; NGFS Physical Risk Assessment Framework; EU Energy Performance of Buildings Directive (EPBD) 2023

**Engine `residential_re_engine` — extracted transformation lines:**
```python
base = max(base, area * 500)  # floor: at least 500 EUR/m²
band_diff = d_idx - epc_idx  # positive = better than D
value_m2 = round(hedonic_value / area, 2) if area else 0
years_to_strand = max(0, stranding_year - 2026)
transition_haircut = 0.05 + (2035 - stranding_year) * 0.01
climate_adj_value = round(hedonic_value * (1 - transition_haircut), 2)
mortgage = inp.mortgage_balance_eur if inp.mortgage_balance_eur > 0 else actual_value * inp.mortgage_ltv
climate_ltv = round(mortgage / climate_adj_value, 4) if climate_adj_value > 0 else 0
base_ltv = round(mortgage / actual_value, 4) if actual_value > 0 else 0
ltv_stress = round((climate_ltv - base_ltv) * 10000, 1)  # bps
epc_premium_pct=round(epc_pct * 100, 2),
flood_discount_pct=round(flood_pct * 100, 2),
res.ltv_stress_bps = round(res.ltv_stress_bps * stress_mult, 1)
avg_ltv = round(total_ltv / n, 4)
avg_climate_ltv = round(total_climate_ltv / n, 4)
avg_stress = round(total_stress / n, 1)
avg_energy = round(total_energy / n, 1)
below_pct = round(below_mees / n * 100, 1)
strand_pct = round(strand_2030 / n * 100, 1)
energy_gap = current_energy - target_energy
saving_eur = saving_kwh * energy_cost_eur_kwh
co2_saved = saving_kwh * grid_ef_kgco2_kwh / 1000  # tCO2
avg_energy = total_energy_sum / total_units if total_units else 0
payback = total_capex / total_savings if total_savings > 0 else 0
energy_gap_kwh_m2=round(max(0, avg_energy - target_energy), 1),
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** A genuine, well-built backend engine exists
> (`backend/services/residential_re_engine.py`, hedonic regression + CRREM stranding + MEES
> compliance + climate-adjusted LTV, exposed at `api/v1/routes/residential_re.py` with the 8
> endpoints listed in `trace_labels`) — but **the frontend page never calls it.** `grep -i "fetch\|
> axios\|api/v1"` over `ResidentialReAssessmentPage.jsx` returns zero matches. The page instead
> builds its own **independent, simplified synthetic dataset** via `sr()` seeds (`PROPERTIES` array
> with `epcIdx`, `value`, `ltv`, `physRisk`, `floodZ`, `costToC`, `stranded` all drawn from
> uncorrelated PRNG calls) that does **not** replicate the backend's hedonic coefficients, CRREM
> pathway, or MEES-compliance logic. §7.1–7.4 document what the frontend actually renders; §7.5
> documents the disconnected backend engine, which is the more rigorous of the two and should be
> the wiring target for a future fix.

### 7.1 What the frontend computes

A synthetic portfolio of properties, each independently seeded (no cross-field correlation):

```
epcIdx    = min(6, floor(sr(i×7) × 7))              // 0=A … 6=G
value     = round(150 + sr(i×11) × 1350)   // £k
ltv       = 0.45 + sr(i×13) × 0.45                  // 45–90%
physRisk  = round(10 + sr(i×17) × 80)               // 10–90
floodZ    = sr(i×19) > 0.75                          // ~25% of stock flagged
costToC   = epcIdx > 2 ? round(5 + sr(i×23) × 35) : 0   // £k retrofit cost, only if EPC < C
stranded  = epcIdx >= 5 && sr(i×31) > 0.4            // EPC F/G, ~60% chance flagged stranded
```
Because `epcIdx`, `value`, `ltv`, `physRisk`, and `floodZ` are drawn from independent seeds, there
is **no relationship in this synthetic dataset** between EPC rating and property value (an EPC-G
1930s house is exactly as likely to be a £1.5M property as an EPC-A new-build), unlike the real
backend engine's EPC-value premium.

### 7.2 Parameterisation (frontend)

| Field | Range | Provenance |
|---|---|---|
| `value` | £150k–£1.5M | Synthetic demo |
| `ltv` | 45–90% | Synthetic demo |
| `physRisk` | 10–90 | Synthetic demo, unrelated to `floodZ` |
| `costToC` | £5k–£40k (only if EPC worse than C) | Synthetic demo, roughly in line with the backend's real `RETROFIT_COST_PER_M2` scale but not computed from it |
| `stranded` flag | EPC F/G with 60% conditional probability | Ad hoc proxy for CRREM stranding, disconnected from the real CRREM pathway table below |
| Stress-test affordability curve | `afford = 28 + (rate−3.5)×5.5`; `hpiAdj = −0.05 × max(0, rate−4.5)` | Hand-fit linear approximations of mortgage-rate sensitivity, not calibrated to a published affordability model |

### 7.3 Calculation walkthrough (frontend)

1. `PROPERTIES` (N synthetic rows) built once at load; `totalValue = Σ value`, `avgLtv = Σ ltv / n
   × 100`.
2. `regionAgg` groups by `REGIONS`, computing mean value/LTV/physRisk per region.
3. `totalRetrofitCost = Σ costToC` for properties with `epcIdx > 2` (worse than EPC C).
4. `stressedLtv` applies a mortgage-rate shock: `hpiAdj` depresses property values (linear in rate
   above 4.5%), which mechanically raises LTV (`balance / (value×(1+hpiAdj))`) since the numerator
   is unchanged; `affordData` sweeps rates 3.5–7.0% against the `afford` linear formula.

### 7.4 Worked example (frontend)

At `rate = 6.0%`: `hpiAdj = −0.05 × (6.0−4.5) = −0.075` (−7.5% house-price fall);
`afford = 28 + (6.0−3.5)×5.5 = 28 + 13.75 = 41.75%` (mortgage-payment-to-income). For a property
with `value = £400k`, `ltv = 0.70` (balance = £280k): stressed value = `400 × 0.925 = £370k`;
stressed LTV = `280 / 370 = 75.7%`, up from the origination 70.0% — a **+570bp LTV stress**, purely
mechanical (numerator fixed, denominator shrinks with the HPI haircut).

### 7.5 The disconnected backend engine (real methodology, not wired to this page)

`ResidentialRealEstateEngine.value_property()` implements a genuine multi-factor hedonic model:
```
base = floor_area×€2,800/m² + bedrooms×€15,000 + bathrooms×€12,000 − age×€500
     + garden×€120/m² + parking×€20,000 − transport_km×€5,000
base ×= (1 + epc_pct)          // epc_pct = (D_idx − epc_idx) × 3% per band vs EPC D
base ×= (1 + flood_pct)        // flood_pct = −8% if in flood zone
hedonic_value = max(base, area × €500)      // floor value
```
CRREM stranding year = first year in the 2020–2050 pathway (`120→18 kWh/m²/yr`) where the
property's `energy_kwh_m2_yr` exceeds the pathway target; MEES compliance checks GB EPC rating
against the 2025/2028 minimum-C timeline. Transition haircut = `5% + (2035 − stranding_year)×1%`
(capped 25%) plus `+3%` if MEES non-compliant; `climate_ltv = mortgage / (hedonic_value ×
(1−haircut))`; portfolio risk band (`low/medium/high/critical`) thresholds on average stress bps
and % stranding-before-2030. This is a coherent, source-referenced (RICS Red Book VPS 5/VPGA 12,
UK MEES 2015, EU EPBD 2024/1275, CRREM v2.3) production-grade model — it is simply not called by
the page that is supposed to expose it.

### 7.6 Data provenance & limitations

- Frontend `PROPERTIES` are entirely synthetic and internally uncorrelated (EPC vs. value vs.
  flood risk are independent draws) — misleading for any user assuming the scatter plots reflect
  real EPC-value relationships.
- The real hedonic/CRREM/MEES engine exists, is unit-testable, and cites primary standards, but
  delivers zero value to end users until the frontend calls its 8 exposed endpoints.
- Frontend `stressedLtv`/`affordData` formulas are hand-fit linear approximations with no cited
  source, unlike the backend's referenced coefficients.

**Framework alignment:** RICS Red Book 2022 VPS 5 & VPGA 12 (hedonic valuation + ESG — implemented
in the **backend only**) · UK MEES Regulations 2015 (implemented in the **backend only**) · CRREM
v2.3 residential 1.5°C pathway (implemented in the **backend only**; frontend's `stranded` flag is
an unrelated ad hoc proxy) · EU EPBD Recast 2024/1275 (referenced in backend docstring, informs the
MEES/ZEB timeline table) · NGFS physical-risk framing (frontend `physRisk` field, uncalibrated).

## 9 · Future Evolution

### 9.1 Evolution A — Wire the hedonic/CRREM/MEES engine, then feed it real EPC records (analytics ladder: rung 2 → 3)

**What.** Another documented frontend/backend disconnect (§7): a genuine engine (`residential_re_engine.py` — hedonic regression with cited coefficients, CRREM v2.3 residential 1.5°C stranding, MEES compliance, climate-adjusted LTV, 8 exposed endpoints) delivers zero user value because `ResidentialReAssessmentPage.jsx` makes no API calls, rendering instead an uncorrelated `sr()` book where EPC, value, and flood risk are independent draws — "misleading for any user assuming the scatter plots reflect real EPC-value relationships" (§7.6). Evolution A wires the page to its engine, then upgrades the engine's inputs with the UK EPC open-data source already integrated platform-side in wave 1.

**How.** (1) Replace the synthetic `PROPERTIES` generator with portfolio intake (address/postcode, balance, valuation) resolved through the 8 endpoints; the hand-fit frontend `stressedLtv`/`affordData` approximations are deleted in favour of the backend's referenced coefficients. (2) EPC enrichment: postcode-matched lookups against the ingested UK EPC register (noting the wave-1 finding that EPC auth arrangements changed — use the working integration path), so EPC ratings are records, not draws. (3) Flood exposure from the digital-twin grids at property coordinates, coverage-tier flagged given sparse flood-grid rows today. (4) bench_quant pins one property through hedonic value → MEES status → CRREM stranding year → climate-adjusted LTV.

**Prerequisites.** Intake schema for mortgage books (CSV first); EPC lookup quota handling. **Acceptance:** the EPC-value scatter shows the engine's hedonic relationship rather than noise; a property's MEES status matches its EPC record and the regulation's threshold year; no `sr()` remains in the page.

### 9.2 Evolution B — Mortgage-book climate triage copilot (LLM tier 2)

**What.** Lenders' questions over a residential book are triage-and-explain: "which loans face MEES non-lettability by 2028 and what's the aggregate balance?", "explain this property's climate-adjusted LTV — how much is flood, how much is EPC retrofit cost?", "draft the credit-committee note on our EPC F/G tail". The copilot answers via the engine's endpoints, whose decompositions (hedonic terms, CRREM overshoot, MEES year) make mechanical explanations possible.

**How.** Tier-2 tool schemas over the 8 existing operations; explanation templates grounded in the engine's cited standards (RICS VPS 5/VPGA 12, MEES 2015, CRREM v2.3 — all named in §7's framework alignment) so regulatory statements carry their basis. Aggregations (balance at risk by EPC band, stranding-year distribution) are computed queries. Guardrails: property-level outputs are model estimates on stated inputs, not valuations — the RICS-adjacent disclaimer is structural; coverage tiers (EPC record found vs estimated, flood grid resolution) accompany every property answer; consumer-facing use is out of scope (this is portfolio analytics, and the prompt says so).

**Prerequisites (hard).** Evolution A wiring — the copilot must never narrate the current uncorrelated synthetic book; per-response provenance fields. **Acceptance:** a credit-committee draft's every £ figure traces to an endpoint response; property explanations decompose into the engine's actual terms; estimated-EPC properties are flagged in any list they appear in.