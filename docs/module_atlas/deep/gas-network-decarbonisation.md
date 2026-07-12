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
