# Bioenergy LCOE Economics
**Module ID:** `bioenergy-lcoe-economics` · **Route:** `/bioenergy-lcoe-economics` · **Tier:** B (frontend-computed) · **EP code:** EP-DX3 · **Sprint:** DX

## 1 · Overview
Bioenergy LCOE analysis covering dedicated biomass, co-firing, biogas, and biomethane pathways. Models feedstock cost ($/GJ), conversion efficiency, RED II sustainability certification, and LCOE benchmarking against wind and solar. Data from IRENA.

> **Business value:** Delivers granular bioenergy LCOE decomposition across pathways with RED II sustainability compliance checking and competitive benchmarking against solar/wind, enabling investment decisions.

**How an analyst works this module:**
- Calculate LCOE for each bioenergy pathway (dedicated, co-firing, biogas, biomethane) using technology-specific parameters
- Decompose LCOE into CAPEX, fixed OPEX, variable OPEX, and feedstock cost shares
- Apply RED II GHG saving calculation to verify sustainability certification eligibility
- Benchmark bioenergy LCOE against wind and solar comparators and identify competitiveness conditions

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FEEDSTOCK_TYPES`, `LCOE_COMPARISON`, `POLICY_SUPPORT`, `SUSTAINABILITY_CRITERIA`, `TABS`, `TECH_TYPES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TECH_TYPES` | 8 | `name`, `capexMwh`, `opexMwyr`, `cf`, `efficiency`, `lifetime`, `feedstockUsd`, `heatRate`, `co2Factor`, `scope` |
| `FEEDSTOCK_TYPES` | 8 | `source`, `costUsd`, `energyGjt`, `landUseHaGJ`, `waterM3GJ`, `availability`, `sustainCert`, `co2kgGJ` |
| `POLICY_SUPPORT` | 7 | `mechanism`, `level`, `supportBps`, `co2Price`, `renewTarget`, `comment` |
| `LCOE_COMPARISON` | 10 | `lcoe`, `range` |
| `SUSTAINABILITY_CRITERIA` | 6 | `threshold`, `weight`, `scope` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annMwh` | `powerMw * (cf / 100) * 8760;` |
| `capexTotal` | `capexMwh * powerMw * 1000;` |
| `annuity` | `w / (1 - Math.pow(1 + w, -lifetime));` |
| `capexAnn` | `capexTotal * annuity;` |
| `opexAnn` | `opexMwyr * powerMw * 1000;` |
| `feedstockGjMwh` | `heatRate / (efficiency / 100);` |
| `feedstockAnn` | `annMwh * feedstockGjMwh * feedstockUsd / 1000;` |
| `lcoe` | `annMwh > 0 ? (capexAnn + opexAnn + feedstockAnn) / annMwh : 0;` |
| `feedstockShare` | `feedstockAnn / (capexAnn + opexAnn + feedstockAnn);` |
| `npv` | `cashflows.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0);` |
| `dnpv` | `cashflows.reduce((s, c, t) => s - t * c / Math.pow(1 + r, t + 1), 0);` |
| `tech` | `useMemo(() => TECH_TYPES.find(t => t.id === selectedTech) \|\| TECH_TYPES[0], [selectedTech]);  const lcoeResult = useMemo(() => calcBioenergyLcoe({ capexMwh: tech.capexMwh, powerMw, cf: tech.cf, opexMwyr: tech.opexMwyr, feedstockUsd: tech.feedstockUsd + feedstockAdj, heatRate: tech.heatRate, wacc, lifetime: tech.lifetime, efficiency: tech.` |
| `carbonCredits` | `useMemo(() => { const annMwh = parseFloat(lcoeResult.annMwh) * 1000;` |
| `annCreds` | `annMwh * (fossilBaseline - bioEmissions) / 1000;` |
| `creditRevMyr` | `annCreds * carbonPrice / 1e6;` |
| `adjustedLcoe` | `parseFloat(lcoeResult.lcoe) - creditRevMyr * 1e6 / (annMwh \|\| 1);` |
| `irrResult` | `useMemo(() => { const annMwh = powerMw * (tech.cf / 100) * 8760;` |
| `revenue` | `annMwh * parseFloat(lcoeResult.lcoe) / 1000 + parseFloat(carbonCredits.creditRevMyr) * 1e6;` |
| `opex` | `parseFloat(lcoeResult.opexAnn) * 1e6 + parseFloat(lcoeResult.feedstockAnn) * 1e6;` |
| `cfs` | `[-capexTotal, ...Array.from({ length: tech.lifetime }, (_, i) => revenue - opex - (i === tech.lifetime - 1 ? 0 : 0))];` |
| `sensitivityData` | `useMemo(() => [ { param: 'WACC -2%', lcoe: parseFloat(calcBioenergyLcoe({ ...tech, powerMw, wacc: wacc - 2, feedstockUsd: tech.feedstockUsd + feedstockAdj }).lcoe) }, { param: 'WACC -1%', lcoe: parseFloat(calcBioenergyLcoe({ ...tech, powerMw, wacc: wacc - 1, feedstockUsd: tech.feedstockUsd + feedstockAdj }).lcoe) }, { param: 'Base', lcoe:` |
| `learningCurve` | `useMemo(() => [2010, 2015, 2020, 2025, 2030, 2035, 2040].map((yr, i) => ({` |
| `carbonIntensityData` | `useMemo(() => TECH_TYPES.map(t => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FEEDSTOCK_TYPES`, `LCOE_COMPARISON`, `POLICY_SUPPORT`, `SUSTAINABILITY_CRITERIA`, `TABS`, `TECH_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Dedicated Biomass LCOE | `(CAPEX×CRF + Fixed OPEX) / AEP + Feedstock / Efficiency` | IRENA LCOE database 2023 | Range $80-160/MWh depending on feedstock cost; competitive vs gas peaker but above solar/wind |
| Feedstock Cost Share | `Feedstock cost component / total LCOE` | IRENA biomass cost analysis | Dominant cost driver; pellet prices $200-300/t (2023 volatility); supply chain diversification critical |
| RED II GHG Saving | `Life-cycle GHG saving vs 35.7 gCO2e/MJ fossil fuel comparator` | RED II calculation methodology | Minimum 70% required for existing plants post-2021; 80% for new plants post-2026; determines subsidy eligibility |
- **IRENA LCOE database** → Technology-specific CAPEX, OPEX, capacity factor data by region → LCOE calculation → **LCOE benchmarking table**
- **Feedstock market data (S&P Commodity Insights, Argus)** → Pellet, chip, and biogas feedstock prices by region → feedstock cost component → **LCOE sensitivity to feedstock price**
- **RED II GHG calculation tool (EC)** → Lifecycle emission factors by feedstock and conversion pathway → sustainability check → **RED II eligibility determination**

## 5 · Intermediate Transformation Logic
**Methodology:** Bioenergy LCOE Decomposition
**Headline formula:** `LCOE = (CAPEX × CRF + Fixed OPEX) / AEP + Variable OPEX + Feedstock Cost / Efficiency; Feedstock Cost Share = (Feedstock $/GJ / Efficiency) / LCOE`

Levelised cost decomposition separating capital, fixed operating, and feedstock components to identify cost reduction levers

**Standards:** ['IRENA Renewable Power Generation Costs 2023', 'EU RED II Directive — Bioenergy Sustainability', 'IEA World Energy Outlook 2023']
**Reference documents:** IRENA (2023) Renewable Power Generation Costs Report; EU RED II Directive 2018/2001 — Bioenergy Sustainability Criteria and GHG Calculation; IEA (2023) World Energy Outlook — Bioenergy Chapter; Ember (2023) Global Electricity Review — Bioenergy Cost Trends

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

This is one of the more genuinely quantitative pages: `calcBioenergyLcoe` is a real
annuitised LCOE decomposition, and `irr` a correct Newton-Raphson solver.

```js
annMwh        = powerMw × (cf/100) × 8760
capexTotal    = capexMwh × powerMw × 1000
annuity       = w / (1 − (1+w)^-lifetime)          // capital recovery factor, w = wacc/100
capexAnn      = capexTotal × annuity
opexAnn       = opexMwyr × powerMw × 1000
feedstockGjMwh = heatRate / (efficiency/100)        // GJ feedstock per MWh
feedstockAnn  = annMwh × feedstockGjMwh × feedstockUsd / 1000
lcoe          = (capexAnn + opexAnn + feedstockAnn) / annMwh          // $/MWh
feedstockShare = feedstockAnn / (capexAnn + opexAnn + feedstockAnn)
```

A carbon-credit overlay reduces the effective LCOE:
`annCreds = annMwh×1000 × (fossilBaseline − bioEmissions)/1000`,
`adjustedLcoe = lcoe − annCreds×carbonPrice/annMwh`.

### 7.2 Parameterisation / technology table

`TECH_TYPES` (8 rows) carry real bioenergy techno-economics (CAPEX $/MWh capacity,
fixed OPEX $/MW-yr, capacity factor %, efficiency %, life, feedstock $/t, heat rate
GJ/MWh):

| Technology | CAPEX $/MWh | CF % | Eff % | Feedstock $/t | Heat rate |
|---|---|---|---|---|---|
| Dedicated biomass | 3,800 | 85 | 28 | 42 | 12.2 |
| Coal co-firing (20%) | 480 | 72 | 38 | 38 | 9.0 |
| Biomass CHP | 4,200 | 82 | 82 | 45 | 4.4 |
| Biogas power (AD) | 2,800 | 90 | 40 | 28 | 9.0 |
| Biomethane | 1,800 | 92 | 65 | 30 | 5.5 |
| Advanced biofuel | 5,200 | 88 | 45 | 85 | 8.0 |
| SAF (HEFA/AtJ/FT) | 7,800 | 90 | 55 | 120 | 6.5 |

`FEEDSTOCK_TYPES` (7) hold cost $/t (including **negative** gate fees for MSW −15,
organic waste −25), energy GJ/t, land-use ha/GJ, water m³/GJ and lifecycle CO₂ kg/GJ.
`LCOE_COMPARISON` benchmarks against solar PV ($38), onshore wind ($45), CCGT ($68).
`POLICY_SUPPORT` (6 countries) and `SUSTAINABILITY_CRITERIA` (RED III ≥65% GHG,
no-deforestation, water, biodiversity, food-vs-fuel weights 30/25/15/20/10) are
descriptive tables, **not wired** into LCOE.

### 7.3 Calculation walkthrough

1. Select technology → its parameter row; feedstock-cost slider (`feedstockAdj`)
   perturbs `feedstockUsd`.
2. `calcBioenergyLcoe` returns the three annual cost buckets, LCOE, feedstock share
   and annual GWh.
3. Carbon-credit tab converts avoided fossil emissions to credits and nets them off.
4. IRR tab builds `[−capexTotal, ...life × (revenue − opex)]` and solves.
5. Sensitivity fans WACC ±2%; a learning-curve and carbon-intensity chart complete
   the view.

### 7.4 Worked example

Biomass CHP, `powerMw = 50`, WACC 8%, feedstock $45/t:

| Step | Computation | Result |
|---|---|---|
| Annual MWh | 50 × 0.82 × 8760 | 359,160 MWh |
| CAPEX total | 4,200 × 50 × 1000 | $210M |
| Annuity (8%, 25y) | 0.08/(1−1.08⁻²⁵) | 0.09368 |
| CAPEX annual | 210M × 0.09368 | $19.67M |
| OPEX annual | 105 × 50 × 1000 | $5.25M |
| Feedstock GJ/MWh | 4.4 / 0.82 | 5.37 GJ/MWh |
| Feedstock annual | 359,160 × 5.37 × 45/1000 | $86.8M |
| LCOE | (19.67+5.25+86.8)M / 359,160 | **≈$311/MWh** |

The CHP heat-rate/efficiency combination makes feedstock ~78% of LCOE — matching the
guide's message that feedstock cost is the dominant, most volatile driver. (Note the
model prices *all* thermal fuel to electricity output, so CHP looks expensive on a
power-only LCOE unless heat credit is applied.)

### 7.5 Data provenance & limitations

- The LCOE and IRR maths are **real** and correct; `TECH_TYPES`/`FEEDSTOCK_TYPES`
  values are plausible IRENA/IEA-consistent benchmarks (hard-coded, not seeded — the
  `sr()` present is used only for minor chart jitter).
- **RED II/III GHG saving is not computed** — the guide's "74% GHG saving" data point
  has no implementation; `SUSTAINABILITY_CRITERIA` only *display* the thresholds.
- CHP heat output is not credited, so its LCOE is overstated on a power-only basis.
- Carbon-credit netting uses a flat fossil baseline minus bio emissions with no
  lifecycle (upstream feedstock) accounting.

**Framework alignment:** IRENA Renewable Power Generation Costs (LCOE annuity
decomposition) · IEA WEO bioenergy · EU RED III sustainability & GHG-saving criteria
(displayed, not calculated) · IRA §45/§45Q and EU ETS carbon pricing (in the policy
table and the credit overlay).

## 8 · Model Specification

**Status: specification — not yet implemented in code.** (LCOE is real; this spec
covers the missing RED III GHG-saving / lifecycle-emissions model behind the "74%"
claim.)

**8.1 Purpose & scope.** Compute the certified lifecycle GHG saving of a bioenergy
pathway versus the fossil comparator, determining RED III subsidy eligibility and
the true carbon intensity used in the LCOE credit overlay.

**8.2 Conceptual approach.** Implement the **EU RED III Annex VI** actual-value GHG
methodology (the legal standard) with **GREET/BioGrace** emission factors,
benchmarked against **EPA RFS** and **ISCC/RSB** certified pathway defaults.

**8.3 Mathematical specification.**
```
E = e_ec + e_l + e_p + e_td + e_u − e_sca − e_ccs − e_ccr        (gCO₂e/MJ)
  e_ec cultivation, e_l land-use-change (annualised over 20y), e_p processing,
  e_td transport, e_u use; e_sca soil-carbon accumulation, e_ccs capture, e_ccr replacement
GHG_saving% = (E_fossil − E) / E_fossil × 100      E_fossil = 94 gCO₂e/MJ (electricity comparator)
Eligible = GHG_saving% ≥ threshold (65% existing / 70–80% new plants)
CI_bio (for credit overlay) = E · conversion to kgCO₂/MWh
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Cultivation EF | e_ec | GREET / BioGrace / RED III defaults |
| iLUC / dLUC | e_l | RED III Annex VIII; GLOBIOM iLUC values |
| Fossil comparator | E_fossil | RED III (94 gCO₂e/MJ elec; 183 heat) |
| Soil carbon | e_sca | IPCC Tier-1/2 SOC change |

**8.4 Data requirements.** Feedstock type & origin, cultivation inputs, transport
distances, conversion efficiency, land-use history, any CCS. Platform holds
feedstock CO₂ kg/GJ and technology efficiency; the Annex-VI term structure and iLUC
factors are new.

**8.5 Validation & benchmarking.** Reconcile pathway CI against BioGrace tool and
certified ISCC/RSB pathway values (±5%); verify the 65/70/80% eligibility gates
reproduce RED III worked examples; cross-check the resulting CI feeds the LCOE credit
overlay consistently.

**8.6 Limitations & model risk.** iLUC is highly uncertain and politically contested;
soil-carbon credits are site-specific; upstream methane leakage for biogas can flip
the saving. Conservative fallback: use RED III conservative default values and
exclude soil-carbon credit unless independently verified.

## 9 · Future Evolution

### 9.1 Evolution A — Regionalise the LCOE and implement the RED II GHG check (analytics ladder: rung 2 → 3)

**What.** This is one of the more genuinely quantitative pages — `calcBioenergyLcoe` is a real annuitised LCOE decomposition (CRF-annualised capex + fixed opex + feedstock/efficiency), a correct Newton–Raphson IRR, a carbon-credit overlay, and WACC sensitivity sweeps (rung 2). The `TECH_TYPES` and `FEEDSTOCK_TYPES` tables carry defensible IRENA-magnitude techno-economics. What is claimed but not computed: the RED II GHG-saving check (the overview and §4.1 promise a "≥70% saving vs 35.7 gCO₂e/MJ fossil comparator" eligibility test) exists only as a static `SUSTAINABILITY_CRITERIA` table, and all cost data is global-average, not regional. Evolution A completes the sustainability engine and regionalises costs.

**How.** (1) Implement the RED II lifecycle-GHG calculation: per feedstock/pathway emission factors (the `FEEDSTOCK_TYPES` table already carries `co2kgGJ`) summed to a well-to-electricity intensity, compared to the 35.7 gCO₂e/MJ comparator, returning the saving % and the pass/fail against the 70%/80% thresholds — the actual subsidy-eligibility gate the module advertises. (2) Regional feedstock prices from real series (pellet/chip indices where licensable, else labelled regional bands) replacing single `feedstockUsd` values — feedstock is the dominant LCOE driver per the module's own thesis, so regionalisation matters most here. (3) Rung 3: calibrate the LCOE outputs against IRENA's published bioenergy LCOE ranges per pathway and report the deviation; pin a reference pathway in bench_quant. (4) The `learningCurve` (currently curated points) refit against IRENA cost-trend data or relabelled.

**Prerequisites.** RED II Annex VI default emission factors (published) mapped to the feedstock rows; feedstock price series licensing. **Acceptance:** a high-intensity pathway fails the RED II 70% check with the computed saving shown; the same technology in two regions produces different feedstock-driven LCOE; outputs land within IRENA's cited pathway ranges.

### 9.2 Evolution B — Bioenergy investment-screening copilot (LLM tier 2)

**What.** The module answers a real diligence question — "is this biomass project competitive and RED-II-compliant?" — that combines LCOE, sustainability, and policy. Evolution B is a copilot that runs the engine as tools: "LCOE for a 50 MW dedicated-biomass plant on wood pellets at $250/t, and does it pass RED II?" triggers `calcBioenergyLcoe` and the Evolution-A GHG check, then benchmarks against the solar/wind comparators in `LCOE_COMPARISON` and overlays the applicable `POLICY_SUPPORT` mechanism — every $/MWh and gCO₂e/MJ from tool output.

**How.** Backend extraction of the LCOE + IRR + GHG functions (`POST /api/v1/bioenergy/lcoe`); tool schemas from it. Grounding corpus: this Atlas record — §7.1's formula block and §7.2's technology table — plus the RED II threshold logic so compliance explanations cite the directive's 70%/80% rules as encoded. The carbon-credit overlay's honest framing matters: `adjustedLcoe` assumes a credit price and a fossil baseline, so the copilot states both assumptions rather than presenting the net figure as unconditional. Solar/wind comparisons cite the `LCOE_COMPARISON` reference with its vintage.

**Prerequisites (hard).** Evolution A's RED II implementation — a copilot asserting sustainability compliance from a static table would fabricate the regulatory verdict; the backend extraction for tool-calling. **Acceptance:** every LCOE, IRR, and GHG-saving figure traces to a tool response; RED II verdicts cite the computed saving vs threshold; carbon-credit-adjusted LCOE states its price and baseline assumptions.