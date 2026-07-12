# Gas Network Decarbonisation Finance
**Module ID:** `gas-network-decarbonisation` · **Route:** `/gas-network-decarbonisation` · **Tier:** B (frontend-computed) · **EP code:** EP-EL4 · **Sprint:** EL

## 1 · Overview
Decarbonisation pathway analysis for 8 European gas DSOs/TSOs (UK/France/Belgium/Netherlands/Germany), H2 blending economics (0–20% cost/emission/HHV curves), biomethane injection pipeline (6 projects), stranded asset NPV modelling at 2030/2035/2040 horizons, gas demand forecasting by scenario (baseline/H2 blend/biomethane/electrification), and network H2-readiness scorecard.

> **Business value:** Used by gas network investors assessing stranded asset risk, infrastructure debt teams evaluating H2 capex regulatory treatment, and energy transition advisors structuring green finance for gas-to-hydrogen conversion programmes.

**How an analyst works this module:**
- Select a gas network to view its RAB, H2 readiness score, biomethane injection capacity, and demand decline trajectory
- On Decarbonisation Pathways tab, compare 6 pathways on capex, feasibility, CO₂ abatement cost, and emission reduction %
- Use H2 Blending tab and blend level slider to model cost uplift, emission reduction, and material upgrade costs at your chosen blend %
- On Stranded Asset tab, select 2030/2035/2040 horizon to see per-network and total stranded RAB exposure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BIOMETHANE_PIPELINE`, `BLENDING_ECONOMICS`, `DEMAND_FORECAST`, `H2_PATHWAYS`, `KpiCard`, `NETWORKS`, `Pill`, `RADAR_READINESS`, `STRANDED_ASSET`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `NETWORKS` | 9 | `name`, `country`, `rab`, `length_km`, `connections`, `hydrogen_ready`, `biomethane_injection`, `h2_blend_max`, `stranded_risk_2040`, `demand_decline`, `opex`, `regulatory`, `age_yrs`, `replacement_rate` |
| `H2_PATHWAYS` | 7 | `opex_delta`, `capex_req`, `hhv_impact`, `emis_reduction`, `network_life_ext`, `regulatory_status`, `co2_abatement`, `feasibility` |
| `BIOMETHANE_PIPELINE` | 7 | `capacity_gwh`, `feedstock`, `status`, `cost_km`, `tariff`, `irr` |
| `RADAR_READINESS` | 7 | `value` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `declineRate` | `network.demand_decline / 100;` |
| `totalRAB` | `useMemo(() => NETWORKS.reduce((s,n)=>s+n.rab,0),[]);` |
| `avgH2Ready` | `useMemo(() => (NETWORKS.reduce((s,n)=>s+n.hydrogen_ready,0)/NETWORKS.length*100).toFixed(0),[]);` |
| `totalBiomethane` | `useMemo(() => NETWORKS.reduce((s,n)=>s+n.biomethane_injection,0).toFixed(1),[]);` |
| `avgDecline` | `useMemo(() => (NETWORKS.reduce((s,n)=>s+n.demand_decline,0)/NETWORKS.length).toFixed(1),[]);` |
| `blendPoint` | `BLENDING_ECONOMICS.find(b => b.h2_pct === (Math.round(h2Blend/2)*2)) \|\| BLENDING_ECONOMICS[5];` |
| `totalStranded` | `STRANDED_ASSET.reduce((s,n) => s+n[strandedKey], 0);` |
| `score` | `Math.round(n.hydrogen_ready*40 + n.h2_blend_max/20*20 + n.biomethane_injection/5.2*20 + (3-n.demand_decline)/3*20);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BIOMETHANE_PIPELINE`, `H2_PATHWAYS`, `NETWORKS`, `RADAR_READINESS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| UK biomethane grid injection (2023) | `Injected into the gas distribution network` | GGSS/National Grid ESO 2023 | Target: 35 TWh/yr by 2030 per UK Biomass Strategy; requires 600+ new AD/landfill/WWTP connections; grid injection tariff under GGSS. |
| European H2 backbone (2040) | `Planned pure-H2 pipeline network across Europe` | European Hydrogen Backbone Report 2022 | 70% repurposed existing gas pipelines; 30% new build; Gasunie, Fluxys, Enagás as anchor TSOs; €80–143Bn total investment estimate. |
| Gas demand decline (UK heating) | `Structural decline from heat pump uptake and efficiency` | National Grid FES 2023 — Leading the Way scenario | UK Climate Compatibility Checkpoint: no new gas boilers after 2035; gas demand for heating to fall 85% by 2050 in net zero scenario. |
- **Ofgem RIIO-GD2 + EU Hydrogen Strategy + UK H2 Strategy + HydrogenEurope EHB + BEIS Biomass Strategy + NGN annual report + GRTgaz transition plan** → 8-network RAB comparison + pathway analysis + H2 blending economics + demand forecasting + stranded asset model + biomethane pipeline + readiness scorecard → **Gas network investors assessing transition risk, infrastructure debt teams modelling regulatory treatment of H2 capex, and energy transition advisors structuring JETP/green finance for gas network decarbonisation**

## 5 · Intermediate Transformation Logic
**Methodology:** H2 Blending Economics & Stranded Asset NPV
**Headline formula:** `Blend_Cost_Uplift = H2_Pct × (H2_Price − CH4_Price) / Gas_LHV_Mix; HHV_Reduction = H2_Pct × 0.37; Biomethane_IRR = Σ(Tariff × GWh_t) / (1+r)^t − Capex; Stranded_NPV = Σ(RAB_decline_t × WACC) / (1+r)^t; Network_Readiness = 0.40×H2_Material + 0.20×Blend_Approved + 0.20×Biomethane + 0.20×Demand_Retention`

Gasunie Netherlands: 55% H2-ready network, 0% blend (converting entire backbone to pure H2), biomethane 3.6TWh — leading European gas-to-hydrogen transition; HyWay27 project converts 1,200km of gas pipeline to H2.

**Standards:** ['Ofgem RIIO-GD2 Price Control 2021–2026', 'EU Hydrogen Strategy COM/2020/301', 'UK Hydrogen Strategy 2021 (BEIS)']
**Reference documents:** Ofgem (2021) – RIIO-GD2 Final Determinations; European Hydrogen Backbone (2022) – A European Hydrogen Infrastructure Vision; BEIS (2021) – UK Hydrogen Strategy

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The Gas Network Decarbonisation module (EP-EL4) blends **real European gas-network data** (8 DSOs/TSOs
with real RAB, length, connections) with a mix of computed and curated decarbonisation economics. It
implements the guide's **HHV-reduction formula exactly** (`hhv = h2_pct × 0.37`) but simplifies the
guide's discounted stranded-asset NPV (`Σ RAB_decline × WACC / (1+r)^t`) into a **linear
`RAB × declineRate × years × factor` heuristic** with no discounting or WACC term. Blending economics
and demand forecasts carry small `sr()` noise; network and pathway data are curated real values.

### 7.1 What the module computes

```js
totalRAB      = Σ NETWORKS.rab                                   // £B aggregate regulated asset base
avgH2Ready    = mean(hydrogen_ready) × 100
totalBiomethane = Σ biomethane_injection                        // TWh
// Stranded asset (per network, per horizon) — LINEAR heuristic, no discounting:
stranded_2030 = round(rab × (demand_decline/100) × 5  × 0.6)
stranded_2035 = round(rab × (demand_decline/100) × 10 × 0.7)
stranded_2040 = round(rab × (demand_decline/100) × 15 × 0.8)
// H2 blending economics (per H2 %):
hhv_reduction = h2_pct × 0.37                                    // ← matches guide exactly
cost_delta    = h2_pct·0.4 + sr()·0.4  (per 2% step: i·0.8 + noise)
material_upgrade = h2_pct > 10 ? (step−5)·180 : 0               // upgrades kick in above ~10%
```

The **HHV-reduction 0.37 factor** is physically correct: hydrogen's volumetric energy density is ~1/3
that of methane, so a 20% H₂ blend cuts calorific value by ~7.4% (20 × 0.37) — the module's `-4.5`/`-74`
HHV impacts for 20%/100% blends are in the right range.

### 7.2 Parameterisation / scoring rubric

**Networks** (`NETWORKS`, 8 real gas operators — curated real data):

| Network | Country | RAB £M | Length km | H2-ready | Biomethane TWh | Demand decline %/yr |
|---|---|---|---|---|---|---|
| Cadent Gas | UK | 9,400 | 82,000 | 18% | 2.4 | 2.1 |
| GRTgaz | France | 14,200 | 32,000 | 32% | 4.8 | 1.5 |
| Gasunie | Netherlands | 8,200 | 12,400 | 55% | 3.6 | 0.8 |
| Open Grid Europe | Germany | 11,800 | 12,000 | 48% | 5.2 | 1.0 |

RAB, length and regulator (Ofgem/CRE/ACM/BNetzA) are accurate; Gasunie's 55% H2-readiness reflects its
real HyWay27 backbone-conversion lead. **H2 pathways** (`H2_PATHWAYS`, 6) carry OPEX delta, CAPEX, HHV
impact, emissions reduction, CO₂ abatement and feasibility — 100% conversion HHV −74 (correct: pure H₂
≈ 0.37× methane calorific value → ~63% reduction per unit... the −74 reflects the volumetric energy gap).
**Biomethane pipeline** lists real-style AD projects with IRR 6.4–8.4% and tariffs £71–88/MWh.

**Stranded-asset factors** (0.6/0.7/0.8 for 2030/35/40) are illustrative realisation ratios; the
`declineRate × years` term makes stranding grow with horizon and demand decline.

### 7.3 Calculation walkthrough

1. Aggregate RAB, H2-readiness, biomethane, demand decline across 8 networks.
2. Stranded-asset tab: linear `RAB × declineRate × years × factor` per horizon; sum for total.
3. H2 blending tab: slider selects H2 %, look up cost/emission/HHV; material upgrade above ~10%.
4. Demand forecast: 16-year paths (baseline/H2/electrification/biomethane) with small `sr()` noise.
5. Pathways, biomethane pipeline, readiness radar (curated).

### 7.4 Worked example (Cadent stranded asset + 20% blend)

Cadent: RAB £9,400M, demand decline 2.1%/yr:
```
stranded_2040 = round(9400 × 0.021 × 15 × 0.8) = round(2,369) = £2,369M
```
So ~£2.37B of Cadent's £9.4B RAB (25%) is flagged stranded by 2040 under this heuristic. At a 20% H₂
blend:
```
hhv_reduction = 20 × 0.37 = 7.4%     (matches the −4.5 to −7 pathway range)
```
Note the stranded figure is **undiscounted** — it linearly scales RAB by decline × horizon × a
realisation factor, whereas a real stranded-asset NPV would discount the year-by-year RAB write-downs at
the regulatory WACC (§8), typically producing a smaller present value.

### 7.5 Data provenance & limitations

- **Network data is curated real-world** (Cadent, Gasunie, GRTgaz RAB/length/regulator) — a strength.
- **Stranded-asset value is a linear heuristic**, not the guide's discounted NPV (`Σ RAB_decline ×
  WACC / (1+r)^t`); no WACC, no discounting.
- HHV-reduction (0.37/unit H₂) is physically correct and matches the guide.
- Demand forecast and blending economics carry small `sr()` noise; pathway/biomethane data curated.
- Network-readiness radar values are hand-set, not the guide's weighted `0.40·H2 + 0.20·Blend + …`.

**Framework alignment:** Ofgem RIIO-GD3 price-control / RAB regulation (the stranded-asset concept —
RAB is the regulated capital on which the network earns a WACC return; stranding = un-recoverable RAB) ·
hydrogen blending standards (UK 20% HyDeploy, EU 10%) · biomethane injection economics · HyWay27 /
network-repurposing pathways. The HHV physics is right; the stranded-asset and readiness scores are
simplifications of the guide's discounted/weighted formulae.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Stranded-asset value is an undiscounted linear
heuristic and network readiness is hand-set. Below is the production stranded-asset NPV + H2 economics
model.

### 8.1 Purpose & scope
Value the stranded-asset risk of a regulated gas network under demand-decline scenarios, and the
economics of H2 blending / biomethane / repurposing pathways — for RIIO price-control and network-
investment decisions.

### 8.2 Conceptual approach
A **regulated-asset-base run-off model** with discounted un-recoverable RAB, benchmarked against
**Ofgem RIIO** depreciation profiles and **National Grid / Gas Distribution** stranded-asset studies,
plus an H2 blending cost model grounded in hydrogen thermodynamics and pipeline-material limits.

### 8.3 Mathematical specification
```
Demand_t   = Demand_0 · (1 − declineRate)^t                    scenario demand path
RAB_recoverable_t = RAB_t · (Demand_t / Demand_0)             usage-linked recovery
RAB_decline_t = RAB_t − RAB_recoverable_t
Stranded_NPV = Σ_t RAB_decline_t · WACC / (1 + WACC)^t         discounted un-earned return
Blend_Cost_Uplift = H2_pct · (H2_price − CH4_price) / LHV_mix
HHV_reduction = H2_pct · 0.37                                  (implemented correctly today)
Biomethane_IRR: solve Σ_t (Tariff·GWh_t)/(1+r)^t = Capex
Readiness = 0.40·H2_material + 0.20·Blend_approved + 0.20·Biomethane + 0.20·Demand_retention
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| declineRate | annual demand fall | NGFS/national heat-pump rollout scenarios |
| WACC | regulated return | Ofgem RIIO-GD3 allowed WACC (~3–4% real) |
| H2_price, CH4_price | fuel costs | IEA / market gas & hydrogen prices |
| LHV_mix | blend lower heating value | H₂/CH₄ thermodynamics |
| Tariff, Capex | biomethane economics | RHI/GGSS scheme + project data |

### 8.4 Data requirements
Per network: RAB, depreciation schedule, demand path, allowed WACC, H2/biomethane project pipeline.
Sources: Ofgem RIIO datasets (public), operator RAB disclosures, IEA fuel prices. Network table already
holds RAB, length, demand decline.

### 8.5 Validation & benchmarking plan
Reconcile Stranded_NPV against operator/regulator stranded-asset assessments; validate demand paths
against national net-zero heat strategies; benchmark biomethane IRR against GGSS-supported projects;
check HHV physics against gas-quality standards.

### 8.6 Limitations & model risk
RAB recovery mechanics are regulator-specific; demand decline is policy-dependent; H2 conversion timing
is uncertain. Conservative fallback: discount at the allowed WACC, use the faster demand-decline scenario
for stranding, and treat 100% H2 conversion CAPEX as the downside case.

## 9 · Future Evolution

### 9.1 Evolution A — Discounted stranded-asset NPV and biomethane IRR (analytics ladder: rung 2 → 3)

**What.** §7 credits this module with real European gas-network data (8 DSOs/TSOs with real RAB, length, connections) and an exactly-implemented HHV-reduction formula (`hhv = h2_pct × 0.37`), but flags that the guide's discounted stranded-asset NPV (`Σ RAB_decline_t × WACC / (1+r)^t`) is simplified to a linear `RAB × declineRate × years × factor` heuristic with no discounting or WACC term, and blending/demand figures carry small `sr()` noise. Evolution A implements the proper discounted models: stranded-asset NPV as a real DCF over the demand-decline trajectory with a WACC input per network's regulatory regime (Ofgem RIIO-GD2 vs continental), and biomethane IRR (`Σ Tariff·GWh_t/(1+r)^t − Capex`) computed rather than stored, so the 2030/2035/2040 horizon comparison reflects time value.

**How.** (1) Replace the linear stranded heuristic with `Σ_t (RAB_decline_t · WACC)/(1+r)^t`, RAB_decline driven by the per-network demand-decline rate. (2) Compute biomethane IRR from the pipeline's tariff/capacity/capex fields via the platform's IRR routine. (3) Remove the `sr()` noise on blending economics — the H2-price/CH4-price spread is deterministic given inputs. (4) H2-blend cost uplift from the guide's `H2_Pct·(H2_Price − CH4_Price)/Gas_LHV_Mix`.

**Prerequisites.** Per-network WACC/regulatory parameters; the small `sr()` noise removed. **Acceptance:** stranded NPV changes with discount rate and horizon reproducing the DCF; two networks with identical RAB but different decline rates show different NPV; biomethane IRR recomputes from pipeline inputs.

### 9.2 Evolution B — Gas-to-hydrogen transition copilot (LLM tier 1 → 2)

**What.** A copilot for infra-debt and transition-advisory users: "what's Gasunie's stranded-RAB exposure at 2040 and how does converting the backbone to pure H2 change it?" Tier-1 narrates the network readiness scorecard, decarbonisation pathways, and H2/biomethane context from the atlas corpus; tier-2 runs the Evolution A NPV/IRR endpoints and the H2-blend model so stranded-asset and blend-cost what-ifs are computed.

**How.** Tier 1 grounds on §5/§7 (Ofgem RIIO-GD2, EU Hydrogen Strategy, European Hydrogen Backbone, the HyWay27 example are documented), and since HHV and readiness scoring are already real, an explainer ships before backend work. Tier 2 tool-calls the stranded-NPV and blend endpoints; the blend-level slider becomes a tool parameter. Every RAB, NPV, and cost-uplift figure validated against tool output.

**Prerequisites.** Evolution A for discounted what-ifs; corpus embedding. **Acceptance:** stranded-asset and blend figures in a copilot answer trace to tool calls; asked for a regulatory-approval probability for H2 capex (not modeled), the copilot refuses and points to the regulatory-status fields as the qualitative view.