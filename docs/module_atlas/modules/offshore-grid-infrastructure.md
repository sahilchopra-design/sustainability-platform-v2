# Offshore Grid & Cable Infrastructure Analytics
**Module ID:** `offshore-grid-infrastructure` · **Route:** `/offshore-grid-infrastructure` · **Tier:** B (frontend-computed) · **EP code:** EP-DR4 · **Sprint:** DR

## 1 · Overview
Engineering economics analytics for offshore wind grid connection covering AC vs HVDC technology selection, cable sizing and loss calculation, offshore substation platform design, grid code compliance by country, reliability and outage modelling, congestion and curtailment risk, and offshore hub topology design across 18 analytical tabs.

> **Business value:** Designed for offshore wind grid engineers, project developers, and transmission system operators evaluating offshore grid connection strategy. Covers the full grid infrastructure decision stack from cable sizing and AC vs HVDC selection through offshore substation design, grid code compliance, and reliability modelling — replacing the combination of PSCAD/DIgSILENT simulations and Excel cost models typically used in pre-FEED offshore grid studies.

**How an analyst works this module:**
- Set farm capacity, distance to shore, and voltage level in the left Site panel; AC vs HVDC recommendation appears immediately in the quick stats bar
- Open "Cable Sizing" tab to view current rating vs conductor area, resistance/reactance/capacitance table, and optimal conductor selection for the specified power and voltage
- Navigate to "AC vs HVDC Analysis" for the technology comparison: losses by distance, cost crossover chart (~80km breakeven at 1GW), HVDC-LCC vs VSC vs AC comparison table
- Check "Grid Loss Model" tab for annual energy loss calculation (I²R model), monetized loss at PPA price, and cable loss % sensitivity to loading factor
- Open "Cable Cost Model" for CAPEX waterfall: cable supply → installation vessel → burial → protection → J-tubes → offshore substation → onshore substation; distance sensitivity curve
- Review "Offshore Substation" tab for platform type comparison (jacket/monopile/floating based on depth), transformer configuration, and harmonic filter requirements
- Navigate "Grid Code Compliance" for country-specific requirements (UK Grid Code, ENTSO-E NC RfG, NERC, AEMO); "Reliability & Outage" tab for MTBF-based availability and annual energy not delivered
- Check "Curtailment & Congestion" tab for grid-caused curtailment by season and "Frequency Regulation" for synthetic inertia and FFR revenue potential
- Open "Future-Proofing" tab for capacity expansion pathway, hydrogen export option, and digital substation upgrade; "Hub Topology" for energy island/centralized hub economics
- Review "Country Grid" for grid connection regimes by country (UK OREI, German TSO, Dutch hub model, US BOEM/FERC); "Summary Report" for the grid infrastructure investment recommendation

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CABLE_VOLTAGES`, `CONDUCTOR_DATA`, `CONDUCTOR_MATERIALS`, `COUNTRIES`, `ChartBox`, `EXPORT_TYPES`, `GRID_VOLTAGES`, `KpiCard`, `PLATFORM_TYPES`, `Section`, `SideInput`, `SideSelect`, `TABS`, `TENDER_DATA`, `Table`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CONDUCTOR_DATA` | 9 | `cuRating`, `alRating`, `resistance33`, `resistance66`, `resistance132` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `currentkA` | `voltagekV > 0 ? powerMW / (Math.sqrt(3) * voltagekV) : 0;` |
| `lossKw` | `3 * Math.pow(currentkA * 1000, 2) * resistancePerkm / 1e6 * lengthkm;` |
| `lossPct` | `powerMW > 0 ? lossKw / (powerMW * 1000) * 100 : 0;` |
| `hvdcLoss` | `1.4 + 0.0020 * km;` |
| `result` | `cableLoss(capacityMW / numCables, exportVoltage, resistance, distanceKm);` |
| `annualGenGWh` | `capacityMW * (loadFactor / 100) * 8760 / 1000;` |
| `annualEnergyLossGWh` | `annualGenGWh * lossPct / 100;` |
| `ppaPriceMWh` | `55 + sr(capacityMW * 3) * 30;` |
| `annualRevenueLossM` | `annualEnergyLossGWh * ppaPriceMWh / 1000;` |
| `cableLengthM` | `distanceKm * 1000 * numCables * 1.08;` |
| `cableSupplyCostM` | `cableLengthM * cableCostPerM / 1e6;` |
| `installationCostM` | `distanceKm * numCables * 0.8;` |
| `totalCableCostM` | `cableSupplyCostM + installationCostM;` |
| `onshoreSsCostM` | `substationCostM * 0.6 + landCostM;` |
| `offshoreSsCostM` | `platformCostM * numPlatforms;` |
| `totalCapexM` | `totalCableCostM + onshoreSsCostM + offshoreSsCostM;` |
| `expectedFaults` | `faultPer100 * distanceKm * numCables / 100;` |
| `repairHours` | `repairDays * 24;` |
| `annualOutageHrs` | `expectedFaults * repairHours;` |
| `availability` | `Math.max(0, Math.min(100, (1 - annualOutageHrs / 8760) * 100));` |
| `annualCapexCharge` | `totalCapexM * (discountRate / 100) / (1 - Math.pow(1 + discountRate / 100, -assetLife));` |
| `annualOMCostM` | `totalCapexM * annualOM / 100;` |
| `gridLcoe` | `annualGenGWh > 0 ? (annualCapexCharge + annualOMCostM + annualRevenueLossM) / annualGenGWh : 0;` |
| `pvFactor` | `annualOM > 0 ? (1 - Math.pow(1 + discountRate / 100, -assetLife)) / (discountRate / 100) : assetLife;` |
| `npvLossM` | `annualRevenueLossM * pvFactor;` |
| `voltageDrop` | `CONDUCTOR_DATA.map(c => {` |
| `loss` | `cableLoss(capacityMW / numCables, v, c.resistance33, distanceKm);` |
| `currentLoad` | `capacityMW / numCables / (Math.sqrt(3) * calcs.exportVoltage);` |
| `thermalData` | `CONDUCTOR_DATA.map(c => ({` |
| `load` | `capacityMW / numCables / (Math.sqrt(3) * calcs.exportVoltage) * 1000;` |
| `voltDropChart` | `vLevels.map(v => ({` |
| `acLossNow` | `cableLoss(capacityMW / numCables, 220, 0.028, distanceKm).lossPct * numCables;` |
| `hvdcLossNow` | `1.4 + 0.002 * distanceKm;` |
| `annualSavingM` | `Math.max(0, acLossNow - hvdcLossNow) / 100 * calcs.annualGenGWh * calcs.ppaPriceMWh / 1000;` |
| `hvdcPremiumM` | `calcs.totalCableCostM * 0.30;` |
| `paybackYrs` | `annualSavingM > 0 ? hvdcPremiumM / annualSavingM : 999;` |
| `costDiffData` | `breakeven.filter((_, i) => i % 3 === 0).map(b => ({` |
| `lossGWh` | `calcs.annualGenGWh * loss / 100;` |
| `costM` | `lossGWh * calcs.ppaPriceMWh / 1000;` |
| `peakLoss` | `cableLoss(capacityMW / numCables, calcs.exportVoltage, 0.028, distanceKm);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CABLE_VOLTAGES`, `CONDUCTOR_DATA`, `CONDUCTOR_MATERIALS`, `COUNTRIES`, `EXPORT_TYPES`, `GRID_VOLTAGES`, `MONTHS`, `PIE_COLORS`, `PLATFORM_TYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Cable Loss (AC 132kV) | `P_loss = 3I²R×L / P_rated` | IEC 60228 | 66kV array cable: ~0.5% per km; 132kV export: ~0.3% per km; 220kV export: ~0.15% per km; HVDC export: ~0.003%/km + fixed terminal losses |
| HVDC Breakeven Distance | `AC total cost = HVDC total cost` | HVDC converter + cable cost model | HVDC economically superior beyond ~80km at 1GW; at 500MW: ~100km; at 2GW: ~60km; DC cost higher at short distances due to converter station cost premium (~$150–250M per terminal) |
| Grid CAPEX (%) | `Cable + substation + connection` | Project finance breakdown | Offshore substation (jacket platform + transformers): $150–400M; export cable supply + install: $0.5–2M/km (33–220kV AC), $1.5–4M/km (HVDC); onshore substation: $50–150M |
| Cable Reliability | `Industry fault rate (CIGRÉ TB 379)` | Cable joint + HDD failure data | HVDC submarine cable: ~0.08 faults/100km/yr; repair takes 30–90 days; N-1 redundancy (spare cable) costs 20–40% premium but eliminates full outage risk |
| Offshore Substation | `Platform + transformer + secondary systems` | Engineering cost studies | Jacket platform (20–60m): $150–250M; includes GIS 220/33kV transformers, reactive compensation, protection, control, accommodation; second platform for N-1 redundancy costs 30% less than first |
| Grid Code Compliance | `Frequency range, reactive power, FRT, ROCOF` | ENTSO-E / UK Grid Code / NERC | Key requirements: fault ride-through (0.25s at 0V), reactive power capability Q/P ≥ 0.33, ROCOF immunity (UK: 1Hz/s), synthetic inertia (UK 2026+ mandate for grid-forming inverters) |
- **Farm capacity, distance, voltage level → cable cross-section sizing (thermal + voltage drop), cable type selection** → AC cable loss: I²R; HVDC loss: terminal + 0.003%/km; total loss comparison → **Cable loss %, annual GWh loss, revenue impact, AC vs HVDC recommendation**
- **Fault rate per 100km, MTTR, load factor → MTBF model** → Availability = 1 − (fault_rate × MTTR/8760) → **Fleet availability %, annual energy not delivered, revenue risk from outage**
- **Country grid code requirements (UK/EU/US/TW) + project parameters** → Compliance check against requirements → **Grid code compliance status, required reactive power range, frequency response capability**

## 5 · Intermediate Transformation Logic
**Methodology:** Cable Loss (I²R) + AC vs HVDC Breakeven + Availability (MTBF) Model
**Headline formula:** `P_loss = 3I²R×L; I = P/(√3×V); HVDC_loss = P_terminal + α×L; Breakeven: L* = (P_terminal − ΔP_terminal) / (R_AC − R_HVDC); Availability = 1 − f_fault × MTTR / 8760`

AC cable losses: P_loss = 3 × I² × R per km × length; I = P_MW × 1000 / (√3 × V_kV); cable resistance R varies by conductor area (300mm² Cu ≈ 0.060 Ω/km; 1200mm² Cu ≈ 0.015 Ω/km). Reactive charging current limits AC cable length: 132kV → max ~80km; 220kV → max ~120km without reactive compensation. HVDC losses: fixed terminal conversion loss (~0.6% each end) + cable loss ~0.003%/km; HVDC breakeven vs AC ≈ 80–100km at 1GW. Offshore substation platform: jacket-mounted for 20–60m; monopile for <40m; floating for >60m water depth.

**Standards:** ['ENTSO-E Network Code RfG', 'UK Grid Code (National Grid ESO)', 'IEC 60228 — Conductors for Insulated Cables', 'IEEE 1885-2023 Offshore Wind']
**Reference documents:** CIGRÉ TB 379 — Update of Service Experience of HV Underground and Submarine Cable Systems (2013); ENTSO-E — Network Code on Requirements for Grid Connection of Generators (RfG); National Grid ESO — Grid Code CC.6 — Offshore Wind Connection (2024); DNV — Offshore Electrical Systems (DNVGL-RP-0286:2019); WindEurope — Offshore Wind Grid Infrastructure: Towards a Meshed Offshore Grid (2023)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

An engineering-economics model for offshore wind grid connection, computing AC cable I²R loss,
HVDC terminal loss, an AC-vs-HVDC cost breakeven distance, CAPEX waterfall, and MTBF-style
availability — matching the guide's stated formula set closely.

```
I (kA)        = P_MW / (√3 × V_kV)                          // per-cable current
P_loss (kW)   = 3 × (I×1000)² × R_per_km / 1e6 × length_km   // AC cable I²R loss
lossPct       = P_loss / (P_MW × 1000) × 100
HVDC_loss (%) = 1.4 + 0.0020 × km                            // fixed terminal + linear cable term
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| HVDC terminal loss | 1.4% fixed | Matches guide's "~0.6% each end" terminal conversion range order-of-magnitude; hard-coded, not derived from a converter datasheet |
| HVDC cable loss slope | 0.0020%/km | Guide cites ~0.003%/km; code uses 0.0020, a modelling simplification not reconciled to the guide's own number |
| Conductor resistance table (`CONDUCTOR_DATA`, 9 rows) | Ω/km by voltage (33/66/132kV) and material (Cu/Al) | IEC 60228-consistent structure; values not individually cited but plausible for submarine XLPE cable |
| PPA price | `55 + sr(capacityMW×3)×30` → $55–85/MWh | Synthetic demo value |
| HVDC cost premium | 30% of cable CAPEX | Synthetic demo value, order-of-magnitude consistent with guide's converter-station cost premium note |
| Cable install cost | `distanceKm × numCables × 0.8` ($M) | Synthetic demo value |
| Fault rate | `faultPer100` × distance/100 × numCables | Seed input; guide cites CIGRÉ TB 379 (~0.08 faults/100km/yr for HVDC) as the real-world benchmark |

### 7.3 Calculation walkthrough

1. **Cable loss (`cableLoss` fn)**: current is derived from power and voltage via the standard
   three-phase relation, then I²R loss is computed per km and scaled by cable length — textbook AC
   transmission-loss physics, correctly implemented.
2. **AC vs HVDC comparison**: `annualSavingM = max(0, acLossNow − hvdcLossNow)/100 × annualGenGWh ×
   ppaPriceMWh/1000` nets the annual revenue benefit of switching technology; `paybackYrs =
   hvdcPremiumM / annualSavingM` (999 sentinel when saving ≤ 0) determines whether the ~30% HVDC
   CAPEX premium pays back within project life — this is the module's version of the guide's ~80km
   breakeven distance, computed dynamically per site parameters rather than as a fixed constant.
3. **CAPEX waterfall**: cable supply (`cableLengthM × costPerM`) + installation (`distanceKm ×
   numCables × 0.8`) + onshore substation (`substationCostM×0.6 + landCostM`) + offshore
   substation (`platformCostM × numPlatforms`) sum to `totalCapexM`.
4. **Availability (MTBF-style)**: `expectedFaults = faultPer100 × distanceKm × numCables / 100`,
   `annualOutageHrs = expectedFaults × repairDays×24`, `availability = max(0, min(100, (1 −
   annualOutageHrs/8760)×100))` — the standard reliability formula the guide cites
   (`Availability = 1 − f_fault × MTTR / 8760`), correctly bounded to [0,100].
5. **Grid LCOE**: `annualCapexCharge` (annuitised via the standard capital-recovery factor
   `r(1+r)^n/((1+r)^n−1)`) plus O&M and revenue-loss cost, divided by annual generation, produces a
   $/MWh grid-connection LCOE add-on — a genuine annuity-based levelised-cost calculation.

### 7.4 Worked example

1 GW farm, 100 km to shore, 220 kV AC export, 2 cables, discount rate 8%, 25-year life:

| Step | Computation | Result |
|---|---|---|
| Current per cable | 500 MW / (√3 × 220) | 1.31 kA |
| AC loss % (220kV, R≈0.028Ω/km) | `cableLoss()` per formula | ≈ 2.8 % (2 cables combined) |
| HVDC loss % | 1.4 + 0.0020×100 | **1.60%** |
| AC vs HVDC gap | 2.8% − 1.6% | 1.2 pp favouring HVDC |
| Annual generation (45% CF) | 1000×0.45×8760/1000 | 3,942 GWh |
| Annual saving (HVDC) | 1.2%/100 × 3,942 × $65/MWh /1000 | **≈ $3.1M/yr** |
| HVDC premium | 30% × total cable CAPEX | project-specific $M |
| Payback | premium ÷ saving | site-dependent, illustrating the ~80–100km breakeven the guide describes |

### 7.5 Data provenance & limitations

- Conductor resistance table and fault-rate benchmarks are **seed constants styled on IEC 60228 /
  CIGRÉ TB 379** but not literal values reproduced from those standards.
- PPA price and cable/substation unit costs are **synthetic demo values** (`sr()`-seeded or fixed),
  not sourced from a live market-price feed.
- HVDC cable-loss slope (0.0020%/km in code vs 0.003%/km cited in the guide) is an internal
  inconsistency — worth reconciling since it directly moves the AC/HVDC breakeven distance.
- No stochastic treatment of fault occurrence (Poisson-style event modelling) — `expectedFaults` is
  a deterministic expectation, not a simulated count with variance.

**Framework alignment:** IEC 60228 (conductor sizing) and ENTSO-E/UK Grid Code RfG (grid-code
compliance tables elsewhere in the page) are correctly used as structural references; DNVGL-RP-0286
(offshore electrical systems) motivates the substation-platform-type logic but platform selection
by water depth (jacket <60m / floating >60m) is not present in the extracted `computed` formulas
(likely a static lookup elsewhere in the page, not independently verified here).

## 9 · Future Evolution

### 9.1 Evolution A — Reconcile the loss constants and back the cost model with real data (analytics ladder: rung 2 → 3)

**What.** §7 shows a genuinely correct engineering engine: three-phase current (`I = P/(√3·V)`), AC cable I²R loss, HVDC terminal + linear cable loss, AC-vs-HVDC cost breakeven (~80km at 1GW), and MTBF availability — all matching the guide's physics. Two honest gaps flagged in §7.2: the HVDC cable-loss slope is coded 0.0020%/km while the guide's own text says ~0.003%/km (unreconciled), and the cost inputs (PPA `55 + sr()×30`, install cost `distance×cables×0.8`, HVDC 30% premium) are synthetic demo values. Evolution A reconciles the physics constants and grounds the economics.

**How.** (1) Resolve the loss-slope discrepancy — pick the CIGRÉ/DNV-sourced value and cite it, so the AC-vs-HVDC crossover is defensible (the breakeven distance is sensitive to this). (2) Replace synthetic cost inputs with a real submarine-cable + converter-station cost reference table (WindEurope/DNV cost benchmarks named in §5), dated and sourced. (3) Fault rates already reference CIGRÉ TB 379 (~0.08 faults/100km/yr HVDC) as the benchmark in §7.2 — wire that real figure into the availability model rather than a seed input. Backend-optional; can stay tier-B if inputs move to a sourced reference and the physics is unit-pinned.

**Prerequisites.** Cost-benchmark data (WindEurope/DNV — partially public); a `bench_quant` pin on the I²R loss and breakeven for a known 1GW/220kV case. **Acceptance:** HVDC loss slope matches its cited source; breakeven distance reproduces a published reference case; cost inputs carry provenance, not `sr()`.

### 9.2 Evolution B — Grid-connection design copilot (LLM tier 2)

**What.** A copilot for the offshore-grid-engineer users §1 targets: "AC or HVDC for a 1.2GW farm 90km offshore?", "size the export cable for 1GW at 220kV and give me the annual loss cost", "what platform type at 55m depth?" — executed against the engine's real functions (cable loss, breakeven, availability, platform selection), decomposing each answer into the physics terms.

**How.** Tool calls to endpoints wrapping `cableLoss`, the breakeven calc, and the platform-selection logic; system prompt from this Atlas page's §5 formula set and the ENTSO-E RfG / IEC 60228 / CIGRÉ references named in §5 so grid-code and cable-standard answers cite the right document. The AC/HVDC recommendation is a tool call returning the breakeven comparison, not an LLM judgment; sensitivity questions (distance, voltage, loading) are recomputations. Fabrication validator matches every loss %, breakeven km, and cost to a tool response; the copilot must convey that this is pre-FEED-grade (replacing PSCAD/DIgSILENT screening, not detailed design, per §1).

**Prerequisites.** Compute endpoints; Evolution A for defensible cost/loss figures. **Acceptance:** every engineering figure traces to a tool call; AC/HVDC recommendations cite the breakeven; grid-code answers cite the applicable standard; the copilot flags pre-FEED scope.