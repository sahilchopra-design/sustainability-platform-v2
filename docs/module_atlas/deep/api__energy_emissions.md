## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/api/v1/energy-emissions` bundles **three sibling engines** behind one route file
(`backend/api/v1/routes/energy_emissions.py`):

1. **Scope 3 Category 11 — Use of Sold Products** (`scope3_cat11.py`): downstream emissions from
   sold fuels and energy-using products, per the GHG Protocol Scope 3 Standard.
2. **Methane Monitoring / OGMP 2.0** (`methane_ogmp.py`): oil & gas methane inventory with OGMP
   level classification, GWP conversion, and a marginal-abatement reduction pathway.
3. **CSRD Auto-Populate** (`csrd_auto_populate.py`): maps platform module outputs into ~35 ESRS
   E1–E5 / S2–S4 data-point slots and scores disclosure readiness (`POST /csrd-auto-populate`).

Core formulas, quoted from code:

```
Cat-11 fuels:     tCO₂ = volume_sold × EF(fuel)                          (10-fuel EF table)
Cat-11 products:  annual = kWh × grid_EF/1000 + fuel_litres × EF + gas_mcf × EF
                  lifetime_total = annual × lifetime_years × units_sold
Methane:          tCH₄ = measured (L4/5) | activity_bcm × custom_EF | activity_bcm × default_EF
                  tCO₂e = tCH₄ × 28 (GWP-100) and × 82.5 (GWP-20)
                  intensity = Σ tCH₄ / activity_bcm
CSRD:             population_rate = populated_DPs / 35 mappable × 100
```

### 7.2 Parameterisation

**Fuel combustion EFs** (`FUEL_COMBUSTION_EF`, tCO₂/unit — magnitudes consistent with EPA/IPCC
default combustion factors, no explicit per-value citation): crude oil 0.43/bbl, natural gas
0.053/MCF, LNG 2.75/t, thermal coal 2.42/t, coking coal 3.10/t, diesel 0.00267/L, gasoline
0.00231/L, jet fuel 0.00254/L, LPG 2.98/t, naphtha 3.14/t. Exposed at
`GET /ref/fuel-combustion-efs`.

**Product use profiles** (`PRODUCT_USE_PROFILES`, `GET /ref/product-use-profiles`) — synthetic
typical-use assumptions: ICE car 1,200 L petrol/yr × 12 yr; BEV 3,500 kWh/yr; commercial vehicle
8,000 L diesel/yr × 10 yr; gas boiler 15,000 kWh + 500 MCF gas/yr × 15 yr; heat pump 4,000 kWh ×
18 yr; industrial motor 50,000 kWh × 20 yr; data server 8,760 kWh (= 1 kW continuous) × 5 yr;
appliance 400 kWh × 10 yr. Default grid EF 0.40 tCO₂/MWh (caller-overridable).

**Methane constants**: GWP-100 = 28 (in-code comment: IPCC AR5), GWP-20 = 82.5 (comment: AR6).
OGMP 2.0 levels 1–5 (`GET /ref/ogmp-levels`): generic EFs → country EFs → facility engineering
estimates → site measurement → source-level measurement. Ten source categories
(`GET /ref/methane-source-categories`) with default EFs (tCH₄ per bcm throughput; e.g. venting
0.40, fugitive wellhead 0.15, pneumatics 0.06) and abatement potentials (50–95%). Six abatement
measures (`GET /ref/abatement-measures`) with €/tCH₄ costs and reduction %: e.g. LDAR €2,500 @60%,
vapour recovery €4,000 @90%, instrument-air conversion €3,000 @95%, enclosed combustion €1,500 @98%.
All these numeric calibrations are **synthetic demo values** shaped by, not copied from, OGMP/IEA
marginal-abatement literature.

**CSRD**: 35 data-point mappings (13 environmental incl. PCAF financed emissions + WACI; 12 S2,
8 S3, 7 S4 — added per the in-code "Sprint 2 — P1-4" note), each carrying ESRS standard, DR,
paragraph, unit and `source_module.source_field` provenance. `ESRS_MINIMUMS` phase-in minimum DP
counts per standard (`GET /ref/esrs-minimums`): E1 15, S2 12, S3 8… Readiness: ≥70% high,
≥40% medium, else low.

### 7.3 Calculation walkthrough

- **Cat 11**: unknown fuel/product keys are silently skipped; fuel totals + product lifetime
  totals sum to `total_cat11_tco2`; top contributor and share reported; intensity per €M revenue
  if provided. Note products count *full lifetime* emissions of the reporting year's sales — the
  GHG Protocol's required treatment (all expected use-phase emissions booked in year of sale).
- **Methane** (`assess_facility`): per-source method waterfall (measured → custom EF → default EF
  → zero/"No data"); facility intensity divides by summed activity (falling back to
  `production_bcm_yr`); emissions-weighted OGMP level; EU Methane Regulation flag = **all**
  sources at Level ≥ 3 (code comment: "Level 3+ required by 2027"); reduction pathway lists each
  applicable measure per source with `cost_eur = reduction × cost_per_tCH₄`, sorted ascending by
  €/tCO₂e — a marginal abatement cost curve.
- **CSRD populate**: exact `(module, field)` key match → populated DP (confidence "high"); misses
  become gap records with reasons; per-ESRS coverage percentages; readiness rating.

### 7.4 Worked example (Cat 11, one fuel + one product)

Refiner sells 1,000,000 bbl crude and 10,000 ICE cars (grid EF irrelevant, petrol path):

| Step | Computation | Result |
|---|---|---|
| Crude | 1,000,000 × 0.43 | 430,000 tCO₂ |
| Car annual/unit | 1,200 L × 0.00231 | 2.772 tCO₂ |
| Car lifetime/unit | 2.772 × 12 | 33.26 tCO₂ |
| Cars total | 33.26 × 10,000 | 332,640 tCO₂ |
| **Cat 11 total** | 430,000 + 332,640 | **762,640 tCO₂** |
| Top contributor | Crude Oil | 56.4% |

Methane cross-check: a wellhead source with 2 bcm/yr at Level 2 → 2 × 0.15 = 0.30 tCH₄ (the EF
table is denominated in tCH₄ per bcm) → 8.4 tCO₂e (GWP-100) / 24.75 tCO₂e (GWP-20); LDAR pathway entry:
reduction 0.18 tCH₄, cost €450, €/tCO₂e = 450/(0.18×28) = **€89.3**.

### 7.5 Data provenance & limitations

- **No PRNG/seeded data in any of the three engines** — pure calculators over caller inputs; the
  numeric tables above are hardcoded reference constants. Fuel EFs are realistic public-domain
  magnitudes; product-use profiles and methane cost/abatement tables are synthetic calibrations.
- **GWP labelling nuance**: 28 is AR5 GWP-100 (AR6 fossil CH₄ is 29.8); 82.5 matches AR6 GWP-20 —
  the engine intentionally mixes vintages, as documented in its header.
- Cat 11 covers only *direct* use-phase emissions (GHG Protocol also defines an indirect tier);
  no product-mix degradation, regional grid decarbonisation trajectories, or fuel-in-use vs
  feedstock split for naphtha.
- The EU Methane Regulation compliance flag is a single boolean on OGMP level; the actual
  Regulation (EU) 2024/1787 imposes MRV timelines, LDAR frequencies and venting/flaring bans not
  modelled here.
- CSRD population is presence-based key matching; it validates neither values nor units, and its
  35 mappable DPs are a small subset of the >1,100 ESRS data points in EFRAG's IG3 list —
  `ESRS_MINIMUMS` gestures at phase-in minimums but is not enforced in scoring.

### 7.6 Framework alignment

- **GHG Protocol Scope 3 Standard, Category 11:** requires lifetime use-phase emissions of
  products sold in the reporting year — implemented for both fuels-sold (combustion EF × volume)
  and energy-using products (annual energy × lifetime), the Standard's two prescribed approaches.
- **OGMP 2.0 (UNEP/CCAC):** the 5-level reporting ladder is implemented faithfully; OGMP's "Gold
  Standard" pathway expects Level 4/5 site+source reconciliation, approximated here by the
  measured-data branch and the emissions-weighted level metric.
- **EU Methane Regulation 2024/1787:** MRV escalation deadlines motivate the Level-3+ compliance
  flag.
- **IPCC AR5/AR6 GWPs:** CH₄→CO₂e conversion at both 100-yr and 20-yr horizons, surfacing the
  short-term-potency framing used in methane finance.
- **CSRD / ESRS (EFRAG Set 1 2023, IG3):** data points are addressed by standard/DR/paragraph
  (e.g. E1-6 §44(a) gross Scope 1); the auto-populate pattern mirrors ESAP-ready digital tagging
  workflows. PCAF financed emissions and WACI are mapped into E1 as financial-sector metrics.
- **SBTi adjacency:** Cat 11 output is the dominant scope-3 category for fossil producers, the
  input to SBTi's well-below-2°C scope-3 coverage tests.
