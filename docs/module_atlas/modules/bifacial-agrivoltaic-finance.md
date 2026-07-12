# Bifacial & Agrivoltaic Finance Analytics
**Module ID:** `bifacial-agrivoltaic-finance` · **Route:** `/bifacial-agrivoltaic-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-EC1 · **Sprint:** EC

## 1 · Overview
Bifacial PV module and agrivoltaic co-location project finance analytics. Quantifies bifacial energy gain from rear-side irradiance, agrivoltaic crop yield retention by type, dual land revenue economics, and financing structures for solar-agriculture co-deployment.

> **Business value:** Used by solar developers, agricultural landowners, DFIs, and project finance banks to evaluate bifacial and agrivoltaic projects combining solar electricity with continued agricultural land use.

**How an analyst works this module:**
- Select project or country filter to explore bifacial gain distribution
- Review agrivoltaic co-benefits tab for crop yield analysis
- Analyse land economics tab for dual revenue stream comparison
- Use financing structure tab to model equity/debt ratios and DSCR

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CF_BY_COUNTRY`, `COUNTRIES`, `CROP_TYPES`, `IRRIGATION_SYSTEMS`, `KPI_CARD`, `POLICY_DATA`, `PROJECTS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `POLICY_DATA` | 9 | `policy`, `tariff`, `year`, `status` |
| `TABS` | 7 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `capacityMw` | `5 + Math.round(sr(i * 7) * 145);` |
| `bifacialGainPct` | `3 + sr(i * 13) * 9;` |
| `albedoCoeff` | `0.15 + sr(i * 17) * 0.30;` |
| `groundClearanceM` | `1.5 + sr(i * 11) * 2.0;` |
| `agriYieldRetentionPct` | `60 + sr(i * 19) * 25;` |
| `lcoe` | `28 + sr(i * 23) * 27;` |
| `irr` | `6.5 + sr(i * 29) * 7.0;` |
| `irrigationSaving` | `15 + sr(i * 31) * 35;` |
| `cropRevenue` | `800 + sr(i * 37) * 2200;` |
| `solarRevenue` | `capacityMw * (38 + sr(i * 41) * 22) * 1000;` |
| `kpis` | `useMemo(() => { const totalMw = filtered.reduce((s, p) => s + p.capacityMw, 0);` |
| `avgBifacialGain` | `filtered.length ? filtered.reduce((s, p) => s + p.bifacialGainPct, 0) / filtered.length : 0;` |
| `avgLcoe` | `filtered.length ? filtered.reduce((s, p) => s + p.lcoe, 0) / filtered.length : 0;` |
| `avgIrr` | `filtered.length ? filtered.reduce((s, p) => s + p.irr, 0) / filtered.length : 0;` |
| `avgAgriRetention` | `filtered.length ? filtered.reduce((s, p) => s + p.agriYieldRetentionPct, 0) / filtered.length : 0;` |
| `totalLandHa` | `filtered.reduce((s, p) => s + p.landAreaHa, 0);` |
| `bifacialGainData` | `useMemo(() => filtered.map(p => { const cf = CF_BY_COUNTRY[p.country] \|\| 0.15;` |
| `baseAep` | `p.capacityMw * cf * 8760;` |
| `bifacialAep` | `baseAep * (1 + p.bifacialGainPct / 100);` |
| `albedoScatter` | `useMemo(() => filtered.map(p => ({ albedo: p.albedoCoeff, gain: p.bifacialGainPct, name: p.name })), [filtered]);` |
| `landEconomicsData` | `useMemo(() => filtered.slice(0, 12).map(p => { const solarRev = p.solarRevenue / 1e6;` |
| `cropRev` | `(p.cropRevenue * p.landAreaHa * p.agriYieldRetentionPct / 100) / 1e6;` |
| `cobenefitsData` | `useMemo(() => [ { benefit: 'Irrigation Savings', value: +(filtered.length ? filtered.reduce((s, p) => s + p.irrigationSaving, 0) / filtered.length : 0).toFixed(1), unit: '% Water Saved' }, { benefit: 'Agri Yield Retention', value: +(filtered.length ? filtered.reduce((s, p) => s + p.agriYieldRetentionPct, 0) / filtered.length : 0).toFixed(` |
| `irrSensitivity` | `useMemo(() => [ { scenario: 'Base', irr: kpis.avgIrr.toFixed(1) }, { scenario: '+5% Bifacial', irr: (kpis.avgIrr * 1.03).toFixed(1) }, { scenario: '+10% Crop Rev', irr: (kpis.avgIrr * 1.04).toFixed(1) }, { scenario: '-10% CAPEX', irr: (kpis.avgIrr * 1.06).toFixed(1) }, { scenario: 'Combined Upside', irr: (kpis.avgIrr * 1.12).toFixed(1) },` |
| `avg` | `ps.length ? ps.reduce((s, p) => s + p.irrigationSaving, 0) / ps.length : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `CROP_TYPES`, `IRRIGATION_SYSTEMS`, `POLICY_DATA`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Bifacial Energy Gain (%) | `AEP_uplift = bifaciality_factor × GHI_rear/GHI_front × base_AEP` | IEA PVPS Task 13 | Depends on ground albedo, module elevation, row spacing; higher albedo and elevated mounts maximise rear-side irradiance. |
| Agri Yield Retention (%) | `yield_retained = crop_yield_full × (1 - shade_loss_factor)` | Fraunhofer ISE agrivoltaic trials | Shade-tolerant crops retain 80-95%; cereal crops 60-75%; optimal panel height and E-W orientation minimise yield loss. |
| LCOE ($/MWh) | `(CAPEX × CRF + OPEX) / AEP + agri_credit` | IEA WEO 2024 | IRA dual-use land credit reduces effective LCOE by $5-15/MWh in the US. |
- **Irradiance + albedo + crop yield trials + land cost data** → Bifacial gain model + agri yield retention + dual revenue stack → **Project LCOE, IRR, NPV for bifacial agrivoltaic project finance**

## 5 · Intermediate Transformation Logic
**Methodology:** Bifacial Gain & Agrivoltaic Dual Revenue
**Headline formula:** `AEP_uplift = base_AEP × bifaciality_factor × GHI_rear/GHI_front; Land_revenue = solar_$/ha + crop_$/ha`

Bifacial gain modelled using bifacial factor (0.65-0.85) × rear/front irradiance ratio from albedo and mounting height. Agrivoltaic yield retention is crop-type dependent: shade-tolerant crops (herbs, lettuce) retain 80-95% yield; field crops (wheat, soy) 60-75%. Dual land revenue: solar lease plus retained agricultural income.

**Standards:** ['IEA PVPS Task 13 – Bifacial PV', 'EU Agrivoltaic Pilot Guidelines', 'India KUSUM Scheme PM-KUSUM']
**Reference documents:** IEA PVPS Task 13 (2021) – Bifacial Solar Technologies; Fraunhofer ISE Agrivoltaic Study 2022; India PM-KUSUM Scheme Guidelines

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Physics-grounded bifacial gain and crop-response modelling (analytics ladder: rung 1 → 2)

**What.** The only computed physics today is `baseAep = MW × CF × 8760` scaled by a *random* bifacial gain — every project attribute (`bifacialGainPct` 3–12%, `albedoCoeff`, `agriYieldRetentionPct`, `lcoe`, `irr`) is a seeded PRNG draw in a plausible band, and the IRR "sensitivity" tab is fixed multipliers on the average (`+5% Bifacial → ×1.03`). The albedo-vs-gain scatter plots two *independent* random fields, implying a relationship the data doesn't contain. Evolution A computes what is currently drawn: gain from albedo/geometry, yield retention from crop type, LCOE/IRR from the revenue stack.

**How.** (1) Bifacial gain per the guide's own formula: `gain = bifaciality_factor × (rear/front irradiance)`, with rear irradiance derived from `albedoCoeff` and `groundClearanceM` (a simplified view-factor model per IEA PVPS Task 13; both inputs already exist per project) — making the albedo scatter a real relationship. (2) Yield retention from a `CROP_TYPES`-keyed table sourced to Fraunhofer ISE trial ranges (shade-tolerant 80–95%, cereals 60–75%) instead of a uniform 60–85% draw. (3) LCOE/IRR assembled from the dual revenue stack (`solarRev + cropRev`) and a capex input, replacing independent random draws — so the sensitivity tab re-runs the model rather than multiplying the average. (4) Site irradiance from the platform's NASA-POWER/Open-Meteo integrations where coordinates exist, upgrading `CF_BY_COUNTRY` constants (rung 2: site-and-scenario-parameterised).

**Prerequisites.** A sourced crop-response mini-table (Fraunhofer/NREL InSPIRE publish ranges); the 20 synthetic projects stay clearly badged illustrative or are replaced by user-entered projects. **Acceptance:** raising albedo or clearance raises computed gain monotonically; lettuce vs wheat produce different retention with citations; the sensitivity tab's "+10% crop revenue" case equals a genuine model re-run, not ×1.04.

### 9.2 Evolution B — Agrivoltaic feasibility copilot (LLM tier 1 → 2)

**What.** Tier 1: a copilot explaining the module's genuinely useful reference content — the `POLICY_DATA` table of real named schemes (EEG agrivoltaics premium, Japan solar sharing FIT, PM-KUSUM, France AO Agrivoltaïque) and the dual-revenue framing — while disclosing that project figures are synthetic demo draws (§7.2's provenance table is the grounding). Tier 2, after Evolution A: "screen a 50 MW tracker site in Rajasthan with chickpea cultivation" runs the gain + yield + revenue model as tool calls and narrates LCOE/IRR with the policy scheme applicable to the country.

**How.** Tier-1 corpus from this Atlas record; refusal path for site-specific feasibility while data is synthetic ("this module cannot yet price your site — its projects are illustrative"). Tier 2 tool schemas over the Evolution-A backend route; the copilot chains gain model → yield table → revenue stack → policy overlay, each step's number from the tool response, and flags when a crop or country falls outside the sourced tables rather than interpolating. Policy-scheme details cite the reference table with its curated-not-wired caveat until tariffs are formally linked to the finance math.

**Prerequisites.** Copilot router (tier 1); Evolution A (tier 2). **Acceptance:** tier-1 answers label all project figures as synthetic; tier-2 site screens trace every MWh, $/MWh, and retention percentage to tool output; an unsupported crop yields an honest gap statement.