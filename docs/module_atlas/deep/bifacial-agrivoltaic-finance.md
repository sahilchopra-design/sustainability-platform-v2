## 7 · Methodology Deep Dive

### 7.1 What the module computes

For 20 synthetic agrivoltaic projects across 10 countries, the page models three
linked quantities — bifacial energy uplift, agrivoltaic dual-land revenue, and an
IRR sensitivity fan. The only *computed* physics is the bifacial energy calculation:

```js
baseAep     = capacityMw × CF_BY_COUNTRY[country] × 8760      // MWh/yr
bifacialAep = baseAep × (1 + bifacialGainPct / 100)
```

Every project attribute (`capacityMw`, `bifacialGainPct`, `albedoCoeff`,
`groundClearanceM`, `agriYieldRetentionPct`, `lcoe`, `irr`, `cropRevenue`,
`solarRevenue`) is drawn from the seeded PRNG `sr(seed) = frac(sin(seed+1)×10⁴)`.
Land economics stacks the two revenue streams:

```js
solarRevM = solarRevenue / 1e6
cropRevM  = cropRevenue × landAreaHa × (agriYieldRetentionPct / 100) / 1e6
```

### 7.2 Parameterisation

| Constant | Value(s) | Provenance |
|---|---|---|
| `bifacialGainPct` | `3 + sr()×9` → 3–12% | Synthetic; matches IEA PVPS Task 13 empirical range |
| `albedoCoeff` | `0.15 + sr()×0.30` → 0.15–0.45 | Synthetic; plausible bare-soil/gravel albedo |
| `agriYieldRetentionPct` | `60 + sr()×25` → 60–85% | Synthetic; Fraunhofer ISE trials cite 60–95% |
| `lcoe` | `28 + sr()×27` → $28–55/MWh | Synthetic; guide cites IEA WEO 2024 |
| `CF_BY_COUNTRY` | 0.10 (NL) – 0.21 (AU) | Hard-coded capacity factors, physically ordered by latitude/insolation |
| `landAreaHa` | `capacityMw × (0.9 + sr()×0.6)` | ~0.9–1.5 ha/MW, realistic AV land intensity |

`POLICY_DATA` (8 rows: EEG Agrivoltaics Premium €12.5, Japan Solar Sharing FIT
€18.0, PM-KUSUM, France AO Agrivoltaïque, SDE++, etc.) are real named schemes with
plausible tariff values — a descriptive reference table, not wired to the finance.

### 7.3 Calculation walkthrough

1. Filter projects by country → `filtered`.
2. Portfolio KPIs: total MW, mean bifacial gain, mean LCOE, mean IRR, mean agri
   retention, total land ha — all simple `reduce/length` averages.
3. Bifacial chart: apply the `baseAep → bifacialAep` uplift per project.
4. Land economics: stack solar $ and retained-crop $ per hectare.
5. IRR sensitivity multiplies the portfolio-mean IRR by fixed scalars
   (`×1.03` +5% bifacial, `×1.04` +10% crop rev, `×1.06` −10% CAPEX, `×1.12`
   combined upside) — heuristic scenario scalars, not a re-run cash-flow model.

### 7.4 Worked example

Project in USA, `capacityMw = 80`, `bifacialGainPct = 8.0`, `CF = 0.20`,
`landAreaHa = 96`, `cropRevenue = 1,800 $/ha`, `agriYieldRetentionPct = 75`,
`solarRevenue = 80 × 50 × 1000 = $4.0M`:

| Step | Computation | Result |
|---|---|---|
| Base AEP | 80 × 0.20 × 8760 | 140,160 MWh |
| Bifacial AEP | 140,160 × 1.08 | 151,373 MWh |
| Energy uplift | +11,213 MWh/yr | ~+8% |
| Solar rev | 4.0 | $4.0M |
| Crop rev | 1,800 × 96 × 0.75 / 1e6 | $0.130M |
| Dual-land total | 4.0 + 0.13 | **$4.13M** |

Retained agriculture adds ~3% to project top-line here — small vs solar, but the
co-location avoids the land-opportunity cost that standalone PV incurs.

### 7.5 Data provenance & limitations

- **All 20 projects are synthetic** seeded demo data; the bifacial `baseAep→AEP`
  uplift is the only real physics and it takes the (synthetic) gain % as given
  rather than deriving it from albedo/clearance.
- The albedo-vs-gain scatter suggests a relationship that the model does **not**
  actually compute (gain and albedo are independent `sr()` draws), so the visual
  correlation is coincidental.
- IRR is a static seeded number; sensitivity is scalar multiplication, not a
  discounted-cash-flow re-solve. No CAPEX/OPEX/DSCR engine exists despite the
  "Financing Structure" tab.

**Framework alignment:** IEA PVPS Task 13 (bifacial gain from rear-side
irradiance, bifaciality × GHIrear/GHIfront) — approximated by a flat gain %.
Fraunhofer ISE / EU agrivoltaic guidelines (crop-type shade-loss factors) —
represented only through the retention % band. PM-KUSUM / IRA dual-use ITC bonus —
named in the policy table but not monetised in LCOE.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Produce a defensible bankability pack for a bifacial
agrivoltaic project: rear-side energy yield, crop-yield retention, dual-revenue
LCOE and equity IRR/DSCR — for developers, ag-landowners and project-finance banks.

**8.2 Conceptual approach.** Two coupled physical models feeding one cash-flow
engine. (i) A bifacial yield model in the tradition of the **NREL SAM bifacial /
pvlib `infinite_sheds`** view factor method and **IEA PVPS Task 13**; (ii) a
crop-shade model per **Fraunhofer ISE agrivoltaic** light-competition curves. Cash
flow follows standard project-finance LCOE (NREL ATB annuity method).

**8.3 Mathematical specification.**
```
Bifacial gain  φ = β · (GHI_rear / GHI_front)
GHI_rear = ρ_albedo · SVF(h, pitch) · GHI_front      (SVF = sky-view factor)
AEP = P_dc · (1 - loss) · (PSH·365) · (1 + φ)
Crop_yield = Y_ref · f_shade(DLI_shaded / DLI_open)   f_shade from crop response curve
LCOE = (CAPEX·CRF + OPEX_fixed) / AEP + OPEX_var - agri_credit
CRF = w / (1 - (1+w)^-N)
Equity IRR from levered cash-flow with DSCR sculpting
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Bifaciality factor | β | Module datasheet (0.65–0.85), IEC 60904-1-2 |
| Albedo | ρ | Ground-cover measurement / Copernicus albedo |
| Sky-view factor | SVF | pvlib `infinite_sheds` from clearance h, row pitch |
| Peak sun hours | PSH | PVGIS / NASA POWER by site |
| Shade response | f_shade | Fraunhofer ISE crop DLI curves |
| WACC | w | Deal-specific capital stack |

**8.4 Data requirements.** Site GHI/DNI/DHI time series (PVGIS, NSRDB), ground
albedo, module bifaciality, mounting geometry, crop DLI-response curve, CAPEX/OPEX,
tariff/ITC schedule. Platform already holds country capacity factors and policy
tariffs; irradiance and crop curves are new.

**8.5 Validation & benchmarking.** Backtest AEP against metered bifacial plants
(±3% target); reconcile LCOE against IRENA Renewable Power Generation Costs and
IEA WEO bands; sensitivity on albedo and clearance (dominant gain drivers).

**8.6 Limitations & model risk.** View-factor gain is site-specific and degrades
under soiling/snow; crop-shade curves are species- and latitude-specific; dual-use
credits (IRA, PM-KUSUM) are jurisdiction-contingent. Conservative fallback: floor
φ at 0 and treat agri revenue as an option, not base-case, until offtake is signed.
