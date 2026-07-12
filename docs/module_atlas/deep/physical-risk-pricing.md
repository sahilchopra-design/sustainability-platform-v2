## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** This is a tier-A module with a genuinely well-built backend
> engine — `backend/services/physical_risk_pricing_engine.py` implements real trapezoidal
> exceedance-probability integration, 30-country baseline peril profiles sourced from INFORM
> Risk Index / ND-GAIN / Swiss Re CatNet, NGFS Phase-IV physical damage amplifiers, and a logistic
> stranding-probability function. **But the frontend page never calls it for anything it displays.**
> `PhysicalRiskPricingPage.jsx` imports `axios` and POSTs to `/price` on button click, but the
> response is discarded (`catch { void 0 /* API fallback to seed data */ }`) and every number shown
> — peril scores, loss tables, EAL/PML/Climate-VaR, stranding probabilities — comes from a separate
> `hashStr(country+assetClass+ngfs) % 997` seeded-random generator local to the page. The sections
> below document what actually renders; §7.6 documents the real engine that exists but is unwired.

### 7.1 What the module computes (as rendered)

A deterministic hash of the three selected inputs seeds a local `s(n) = seededRandom(base+n)`
generator; every displayed figure is `s(n)` scaled into a plausible-looking range — there is no
dependency on real country hazard data:

```js
base = hashStr(country + assetClass + ngfsScenario) % 997
composite = mean(9 peril scores), each peril = round(s(i)×60 + 30)   // 20-100 band, uncalibrated
ealPct    = s(10) × 0.8 + 0.1                                          // 0.1%-0.9% of asset value
pml100    = s(2) × 0.15 + 0.05                                         // 5%-20% of asset value
climateVaR = (lossDist[25yr] / assetValue) × 100                       // relabeled loss-table entry
riskPremium = round(s(4) × 80 + 20)                                    // 20-100 bps
```

### 7.2 Parameterisation (frontend, illustrative)

| Quantity | Range | Provenance |
|---|---|---|
| 9 acute/chronic peril scores | 15–95 (varies by peril) | `sr()`-seeded, hash keyed on country+assetClass+scenario — stable per selection but not tied to real hazard maps |
| EAL | 0.1%–0.9% of asset value | Arbitrary band |
| PML(100yr) | 5%–20% of asset value | Arbitrary band |
| Risk premium | 20–100 bps | Arbitrary band |
| Stranding probability | 10%–60% per scenario×horizon cell | Arbitrary band |

### 7.3 Calculation walkthrough (frontend)

1. User selects country / asset class / NGFS scenario / horizon.
2. `hashStr()` folds the three strings into an integer seed `base`.
3. Five independent generator functions (`getPerilData`, `getNatCatData`, `getFinancialData`,
   `getStrandingData`, `getNGFSData`) each derive their own `s(n)` sequence from `base` and produce
   tab-specific numbers — none of the five functions share state or reconcile with each other (e.g.
   the "Composite Risk Score" on tab 1 and the "EAL" on tab 3 are drawn from unrelated seed offsets).
4. "Run Physical Risk Pricing" fires a POST to the backend engine but the UI does not read the
   response — clicking the button changes nothing on screen.

### 7.4 Worked example

Country = United Kingdom, assetClass = property, ngfsScenario = orderly →
`base = hashStr("UKpropertyorderly") % 997` (a fixed integer, call it `b`).
`peril.composite` = round(mean of 9 values, each `round(s(i)*60+30)` for i=1..9) — e.g. if the 9
draws average ≈0.55, composite ≈ round(30 + 0.55×60) = **63/100 → "High" tier** (composite≥55).
`ealPct = s(10)×0.8+0.1` — if `s(10)≈0.4`, `ealPct = 0.42` → displayed as "0.42% of AV" ≈
$21,000 on a $5M reference asset. None of these numbers change if the user swaps United Kingdom for
Bangladesh unless the hash happens to differ meaningfully — country choice has no causal link to
INFORM/ND-GAIN reality in this rendering path.

### 7.5 Regulatory-readiness checklist (tab 5)
8 checklist items, 2 hard-coded `true` ("Physical risk quantification", "NGFS scenario coverage"),
6 driven by `s(20)`..`s(25)` thresholds (e.g. "Insurance gap analysis" ready if `s(21)>0.35`) — a
cosmetic readiness score, not a real audit.

### 7.6 The real, unwired backend engine

`backend/services/physical_risk_pricing_engine.py` (1,103 lines) is a legitimate physical-risk
pricing model:
- **30-country baseline risk profiles** (flood/cyclone/wildfire/drought/heatwave/SLR/earthquake,
  0–1 scale) sourced from INFORM Risk Index 2023, ND-GAIN 2023, Swiss Re CatNet, IPCC AR6.
- **NGFS Physical Damage Amplifiers** — scenario(`orderly`/`disorderly`/`hot_house`) × horizon
  (2030/2040/2050) multiplier tables per peril, e.g. hot-house 2050 heatwave amplifier = 2.20×.
- **EAL via trapezoidal EP-curve integration** (`_expected_annual_loss`) over 6 return periods
  (10–500yr), combining `RETURN_PERIOD_LOSS_TABLES` × country baseline × NGFS amplifier ×
  `VULNERABILITY_COEFFICIENTS` (asset-class-specific damage sensitivity).
- **Climate VaR** = `max(PML(100yr) × climate_var_pct_of_tier, EAL×3)` — a 3×-EAL floor plus a
  tier-based percentage-of-asset-value ceiling from `RISK_PREMIUM_TABLE`.
- **Stranding probability** — logistic function `1/(1+exp(-10×(chronic_composite-0.5)))` on an
  asset-class-weighted blend of SLR/drought/heatwave/flood chronic stressors.
- **Insurance protection gaps** by country×peril, Swiss Re sigma / Munich Re NatCatSERVICE sourced.

This is close to production-grade methodology and should be the target the frontend calls.

### 7.7 Data provenance & limitations

- **Frontend rendering path is 100% synthetic**, seeded by `hashStr()+sr()`, despite tab labels
  ("NGFS-aligned physical risk classification", "TCFD / NGFS / ECB CST 2022 aligned") implying
  regulatory rigor.
- **Backend engine is real but disconnected** — `/api/v1/physical-risk-pricing/price` and 7 sibling
  routes exist (`api/v1/routes/physical_risk_pricing.py`) and are POSTed to, but the response is
  never read into component state.
- No caching/versioning of NGFS amplifier vintage — engine uses NGFS Phase IV (2023) tables that
  should be refreshed on each NGFS scenario release.

## 8 · Model Specification

**Status: implemented in `backend/services/physical_risk_pricing_engine.py` — not yet wired to
this page's UI.** This section specifies the wiring, not a new model.

### 8.1 Purpose & scope
Deliver asset-level EAL / PML(100yr) / Climate-VaR(95%) / risk-premium-bps / stranding-probability
for a single asset, replacing the page's disconnected synthetic renderer with the real engine's
output — coverage: property, infrastructure, agriculture, energy, marine asset classes across the
engine's 30 supported countries.

### 8.2 Conceptual approach
No new methodology is needed — the engine already mirrors the RMS/AIR/Verisk EP-curve architecture
(§7.6) and the NGFS CGFI physical-risk assessment framework used by ECB's economy-wide climate
stress test. The gap is purely an integration gap.

### 8.3 Wiring specification

```
onSubmit → POST /api/v1/physical-risk-pricing/price {entity_id, asset_class, country_iso,
           asset_value_usd, ngfs_scenario, time_horizon, lat, lng}
        → setState(engineResponse)
        → replace getPerilData/getNatCatData/getFinancialData/getStrandingData/getNGFSData
          local generators with engineResponse.{acute_peril_breakdown, chronic_stressor_breakdown,
          expected_annual_loss_usd, pml_100yr_usd, climate_var_95pct_usd, risk_premium_bps,
          risk_tier}
        → GET /ref/return-period-losses for the NatCat Loss Table tab (calculate_return_period_losses)
        → GET /ref/stranding for the Stranding Analysis tab (calculate_stranding_probability)
```
Country codes must be reconciled: the frontend `COUNTRIES` list uses full names ("United Kingdom")
while the engine keys on ISO3 (`GBR`) — a lookup table is required.

### 8.4 Data requirements
All required reference data (country profiles, damage functions, amplifiers, insurance gaps,
premium table) already exists in the engine module; no new ingestion needed.

### 8.5 Validation & benchmarking plan
Once wired, validate that displayed EAL/PML change monotonically and consistently with country
selection (e.g. Bangladesh > United Kingdom for flood-driven EAL) — a property the current
synthetic path does not guarantee. Reconcile engine PML(100yr) against RMS/AIR public benchmark
loss ratios where available.

### 8.6 Limitations & model risk
Trapezoidal EP integration with only 6 return-period points is coarse relative to full event-set
catastrophe models; vulnerability coefficients are single scalars per peril×class, not
depth-damage curves; wiring the real engine will change every number on the page materially versus
current demo values, which should be communicated to users as a methodology change, not a bug fix.

## Framework alignment

**NGFS CGFI Physical Risk Assessment (2021/2023)** — genuinely implemented in the engine
(amplifier tables), absent from the rendered UI. **TCFD Physical Risk Guidance** — engine's
EAL/PML/stranding triad matches TCFD's recommended physical-risk metrics; UI currently displays
disconnected demo numbers under TCFD-branded labels. **ECB Climate Risk Stress Test 2022** — cited
correctly as the source for hazard-adjusted spread methodology; engine's risk-premium table
structure is consistent with ECB/PRA supervisory expectations for climate-adjusted credit pricing.
