## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula is `Resilience = Diversification ×
> ClimateAdaptation × BusinessContinuity / SupplyConcentration`. **No such quotient is computed.**
> `resilience` is an independently-seeded random field (`Math.round(15+sr(i*29)*80)`) with no
> arithmetic link to diversification, adaptation, continuity, or concentration data elsewhere on the
> page. Likewise, the "Monte Carlo Expected Annual Loss" chart in the disruption-modelling tab is a
> **50-point random scatter** (`sr(i*severity*77)*500*(severity/3)`), not a converged simulation
> output, and `eal = totalRevAtRisk × 0.15` is a flat 15% haircut rather than a probability-weighted
> expected loss. Sections below document the calculations that genuinely exist — HHI-style
> criticality, RCP/horizon hazard scaling, and the adaptation cost-benefit calculator — which are
> real, internally consistent formulas even though the headline "resilience" and "EAL" figures are
> not.

### 7.1 What the module computes

100 synthetic supply-chain nodes (`NODES`) across 30 countries, 4 types (Factory/Warehouse/Port/
Logistics Hub), each independently `sr()`-seeded for `throughput` (100–1000), `substitutability`
(10–100), `resilience` (15–95), an 8-hazard profile (`HAZARDS`, 5–95 each), historical disruption
count (0–8), and adaptation measures adopted (8 possible, threshold `sr()>0.55`). 60 synthetic
companies (`COMPANIES`) link to nodes via `companyLinks`. A 12-quarter disruption history
(`DISRUPTION_HISTORY`) and a 30-country × 8-hazard exposure matrix (`COUNTRY_HAZARD_MAP`) round out
the reference data.

### 7.2 Genuine formulas in the code

```js
// Node criticality — a real compound formula (not random)
criticality = (throughput / 10) × (100 − substitutability) / 100

// Single Point of Failure (SPOF) screen
isSPOF = substitutability < 25 && throughput > 500

// Climate scenario hazard scaling (Tab 3)
multiplier   = scenario === 'RCP 8.5' ? 1.35 : 1.0                 // vs RCP 4.5 baseline
horizonMult  = horizon === 2040 ? 1.15 : horizon === 2050 ? 1.35 : 1.0   // vs 2030 baseline
adjustedHazardScore = min(100, baseHazardScore × multiplier × horizonMult)

// Adaptation cost-benefit calculator (Tab 4)
totalCost        = Σ_measures (slider% × costPerUnit × node.throughput / 100)
resilienceGain    = Σ_measures (slider% × resilienceGainRate) / 100
newResilience     = min(100, node.resilience + resilienceGain)
ROI               = (node.revenueAtRisk × resilienceGain/100) / totalCost × 100
```

`criticality` correctly captures the textbook resilience-engineering intuition: a high-throughput
node with low substitutability is maximally critical (both terms scale it up). The RCP/horizon
scaling is a genuine two-factor multiplicative stress applied uniformly to every hazard score.

### 7.3 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| RCP 8.5 multiplier | ×1.35 vs RCP 4.5 baseline | Loosely consistent with IPCC AR6 relative forcing gap between RCP4.5/8.5, but not derived from a cited physical model |
| 2040 / 2050 horizon multiplier | ×1.15 / ×1.35 vs 2030 | Synthetic demo value — linear-ish escalation, no cited climate-hazard trajectory |
| SPOF thresholds | substitutability<25, throughput>500 | Synthetic demo values |
| Adaptation cost/unit (4 measures) | $0.08–$0.20 per throughput-unit-% | Synthetic demo values; relative ordering (hardening priciest, buffering cheapest) is directionally reasonable |
| Adaptation resilience-gain rate | 0.20 (buffer) – 0.40 (hardening) | Synthetic demo values |
| EAL haircut | ×0.15 of revenue-at-risk | Synthetic demo value — not a fitted loss-given-disruption ratio |

### 7.4 Calculation walkthrough

1. **Tab 1 (Node Registry)** — filters/sorts 100 nodes by country/type/criticality/resilience;
   distribution histogram bins `resilience` into 10-point buckets; "Top 10 Most Vulnerable" sorts
   ascending by `resilience`.
2. **Tab 2 (Disruption Simulator)** — user selects hazard/location/severity/duration; `runModel`
   filters nodes in the chosen country whose selected-hazard score > 40, unions their linked
   companies, and computes per-company impact:
   `revImpact = company.revenue × severity × 0.03 × (duration/30)` — i.e. **linear** in both
   severity (1–5 slider) and duration relative to a 30-day reference period, at a flat 3%-of-revenue
   per severity-point rate. `eal = totalRevAtRisk × 0.15` is then a static multiplier, not an
   integral over a loss-probability distribution — despite being labelled "Expected Annual Loss," a
   term with a specific actuarial meaning (probability-weighted mean of the annual loss
   distribution).
3. **Tab 3 (Climate Scenario Explorer)** — applies `multiplier × horizonMult` to the static
   `COUNTRY_HAZARD_MAP`; `companyPhysicalRisk` averages each company's linked-node hazard scores
   (mean across 8 hazards, then across nodes) and applies the same scenario scaling;
   `compoundData` counts countries where **both** hazards in 6 pre-selected pairs (e.g.
   Drought+Heatwave) exceed 50 — a real compound-hazard co-occurrence screen.
4. **Tab 4 (Adaptation Planner)** — interactive four-lever cost-benefit calculator (diversification,
   buffering, routing, hardening) per selected node, computing cost, resilience gain, and ROI as
   shown in §7.2. `insuranceGaps` (nodes with `resilience<40`) computes a random `covered` vs
   `needed` coverage gap — both `sr()`-seeded, not derived from actual insurance policy data.

### 7.5 Worked example

Node `i=10`: `throughput = round(100+sr(10*67)*900) = round(100+sr(670)*900)`. `sr(670) =
frac(sin(671)×10⁴)`; `sin(671 rad)≈0.554`, ×10⁴=5540, frac≈0.0 (illustrative — exact value depends
on floating-point reduction of 671 rad mod 2π). Taking the displayed-style values as representative:
suppose `throughput=620`, `substitutability=18` (a SPOF candidate since <25). `criticality =
(620/10) × (100−18)/100 = 62 × 0.82 = 50.8 → 51`. This node also satisfies the SPOF filter
(`substitutability<25 AND throughput>500` → 18<25 ✓, 620>500 ✓), so it appears in the "Single Point
of Failure" table with both a high criticality score and the SPOF flag — the two independent
screens agree in this case, though they need not always (a node can be SPOF-flagged on low
substitutability even at modest throughput, or vice versa).

Adaptation example: for this node with `revenueAtRisk` say $200M, setting all four adaptation
sliders to 50%: `totalCost = 50×(0.12+0.08+0.15+0.20)×620/100 = 50×0.55×6.2 = 170.5→$170.5M` — note
this likely overshoots realistic budgets because all four cost-per-unit rates apply **simultaneously
and independently** to the same `throughput` base rather than being netted against overlapping scope
— a modelling simplification worth flagging to any user relying on the absolute cost figure.
`resilienceGain = 50×(0.35+0.20+0.25+0.40)/100 = 50×1.20/100 = 0.6 → round to 1`. `ROI =
(200×1/100)/170.5×100 ≈ 1.2%` — the calculator can produce very low ROI figures once all four
levers are engaged simultaneously, correctly reflecting diminishing practical value of maxing out
every adaptation lever at once versus prioritising the highest resilience-gain-per-dollar measure
(hardening: 0.40/0.20=2.0 gain-per-$ vs buffering: 0.20/0.08=2.5 gain-per-$ — buffering is actually
the most cost-efficient single lever in this parameterisation).

### 7.6 Companion analytics

- **Sector vulnerability ranking** (`SECTOR_VULN`) — independently-seeded vulnerability/exposure/
  adaptation-gap per of 10 sectors; not derived from the node/company data.
- **Redesign scenarios** (`redesignScenarios`) — 5 hand-scripted strategic options (Nearshoring,
  Dual Sourcing, Regional Hub Model, Digital Twin, Climate-Resilient Sites) with `sr()`-seeded cost
  and fixed `resilienceImprove`/`timeMonths` — illustrative strategy cards, not optimised against
  the node network.
- **CSV export** — full node registry export including top hazard, adopted measures, and revenue at
  risk; client-side only.

### 7.7 Data provenance & limitations

- **100% synthetic data** — all 100 nodes, 60 companies, the 12-quarter disruption history, and the
  country×hazard matrix are `sr()`-seeded.
- The guide's `Diversification × ClimateAdaptation × BusinessContinuity / SupplyConcentration`
  resilience formula and the "Monte Carlo" EAL simulation are not implemented — see §8.
- `eal = revenue-at-risk × 0.15` conflates *loss given disruption* with *expected annual loss*; a
  true EAL requires integrating loss × probability of occurrence over a full year, not a flat
  haircut on a single scenario's point-estimate impact.
- RCP/horizon multipliers are directionally plausible (RCP8.5 > RCP4.5; longer horizon > shorter)
  but not calibrated to a specific NGFS or IPCC damage function.

**Framework alignment:** ISO 22301 (Business Continuity Management) and WEF Global Risks framing are
cited in the guide as the conceptual basis; the module's SPOF and criticality screens are consistent
with ISO 22301's business-impact-analysis concept of identifying single points of failure, but no
BCP-testing-frequency or continuity-plan-coverage data is actually ingested. IPCC AR6 RCP scenario
labels are used correctly as scenario names but the hazard-scaling multipliers are not sourced from
AR6 regional projections.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Deliver the guide's intended composite Resilience Index and a genuine probabilistic Expected Annual
Loss (EAL) for supply-chain disruption, to support capital allocation for adaptation investment and
insurance/reinsurance placement decisions across the full node network.

### 8.2 Conceptual approach

Model resilience as a **ratio composite** (numerator = capability factors, denominator = concentration
risk), the architecture implied by the guide and consistent with **BCI's (Business Continuity
Institute) Supply Chain Resilience Index** methodology, and separately compute EAL via a
**frequency–severity actuarial model** (Poisson event frequency × lognormal severity), the standard
catastrophe-modelling architecture used by AIR/RMS/Verisk cat models and Swiss Re sigma loss
estimation — replacing the current flat 15% haircut with an actual loss distribution.

### 8.3 Mathematical specification

```
# Resilience Index (per guide's intended ratio form)
Diversification(node)     = 1 − HHI(supplier_sources) / 10000        ∈[0,1]  (1 = fully diversified)
ClimateAdaptation(node)   = measuresInPlace.length / 8                ∈[0,1]  (share of 8 measures adopted)
BusinessContinuity(node)  = BCP_tested ? 1.0 : BCP_exists ? 0.5 : 0    ∈{0,0.5,1}
SupplyConcentration(node) = criticality / 100                          ∈[0,1]  (existing formula, reused)

ResilienceIndex(node) = 100 × [Diversification × ClimateAdaptation × BusinessContinuity]
                             / max(0.05, SupplyConcentration)          (floor avoids div/0 at conc→0)

# Expected Annual Loss — frequency-severity (actuarial standard form)
λ(node)  = historicalDisruptions / 3   (Poisson annual event rate, 3-yr lookback)
Severity(node) ~ Lognormal(μ, σ)  fit to  [0.03×severity×revenue×(duration/30)] impact samples
EAL(node) = λ(node) × E[Severity(node)]
Portfolio EAL = Σ_node EAL(node)   (assuming independence; add correlation via compound-hazard
                                     co-occurrence matrix (§7.4) for a more realistic tail)
```

| Parameter | Value | Calibration source |
|---|---|---|
| Diversification | 1−HHI/10000 | Standard normalised-HHI diversification transform (DOJ/FTC concentration convention) |
| BCP status weights | 0 / 0.5 / 1.0 | ISO 22301 maturity staging (no plan / plan exists / plan tested) |
| Poisson λ | disruptions/3yr | Standard cat-model frequency estimation from historical event count |
| Severity distribution | Lognormal | Standard catastrophe-loss severity assumption (right-skewed, non-negative) — fit params from historical `costM` series in `DISRUPTION_HISTORY` |
| Correlation adjustment | compound-hazard co-occurrence | Existing `compoundData` screen (§7.4) already identifies correlated hazard pairs — reuse as a correlation proxy rather than assuming independence |

### 8.4 Data requirements

- True supplier-source HHI per node (currently no source-level data — only aggregate
  `substitutability`).
- BCP existence/testing status per node (currently absent).
- Historical loss severity samples (currently only aggregate quarterly `costM`, not node-level).
- NGFS/IPCC-sourced hazard-scaling factors by RCP/SSP and horizon (replace the current 1.0/1.15/1.35
  synthetic multipliers).

### 8.5 Validation & benchmarking plan

Backtest Portfolio EAL against the realised 12-quarter `DISRUPTION_HISTORY.costM` series (should
reconcile within a stated confidence band); sensitivity-test the Resilience Index to ±20% shifts in
each of the four sub-factors; benchmark hazard-scaling multipliers against NGFS Phase IV physical-risk
damage functions for the same RCP/SSP combinations.

### 8.6 Limitations & model risk

Treating node-level EAL as independent overstates diversification benefit when hazards are
geographically correlated (e.g. a regional flood hits multiple nodes simultaneously) — the compound-
hazard matrix should be converted into an explicit correlation/copula structure for portfolio-level
tail-risk (99th percentile PML), not just summed independently. The Resilience Index's floor-guarded
division (`max(0.05, SupplyConcentration)`) is a modelling convenience that compresses the score range
for very-low-concentration nodes; document this explicitly if reported externally.
