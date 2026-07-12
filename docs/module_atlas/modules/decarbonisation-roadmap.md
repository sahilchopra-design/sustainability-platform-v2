# Decarbonisation Roadmap
**Module ID:** `decarbonisation-roadmap` · **Route:** `/decarbonisation-roadmap` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Science-based decarbonisation pathway builder that maps emission reductions to specific technologies, costs, and delivery timelines through to net zero. Marginal abatement cost curves rank interventions by cost-effectiveness. Scenario comparison allows evaluation of accelerated vs. delayed action paths.

> **Business value:** Translates a net-zero commitment into a costed, technology-specific action plan that finance and operations teams can execute. The MAC curve discipline ensures capital is directed to the highest-return abatement opportunities first.

**How an analyst works this module:**
- Define the baseline emission profile by Scope and sector, and set the net-zero target year
- Add technology levers with CapEx, OpEx, savings, and abatement estimates; the MAC curve auto-populates
- Sort levers by MAC and drag them into the prioritised implementation timeline
- Run scenario comparison to quantify cost and emission differences between accelerated and delayed action paths

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ABATEMENT_LEVERS`, `CARBON_PRICE_SCENARIOS`, `COLORS`, `CORPORATES`, `INVESTMENT_DATA`, `KpiCard`, `MILESTONES`, `PATHWAY_TREND`, `REGION_F`, `SECTOR_F`, `SECTOR_PROFILES`, `STATUS_F`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CORPORATES` | 60 | `sector`, `region`, `baseYear`, `baseline`, `target2030`, `target2050`, `current`, `netZeroYear`, `sbti`, `carbonPrice`, `investMn`, `abatement`, `status`, `scope3`, `reductionPct` |
| `ABATEMENT_LEVERS` | 31 | `sector`, `potentialMtY`, `costPerTon`, `maturity`, `adoption`, `description`, `abatementBy2030`, `abatementBy2050` |
| `SECTOR_PROFILES` | 13 | `co2Mt`, `targetMt`, `trlReadiness`, `capexBn`, `opexSavings`, `keyTech`, `carbonPrice`, `decarb2030`, `decarb2050` |
| `CARBON_PRICE_SCENARIOS` | 10 | `EU_ETS`, `UK_ETS`, `CA_CnT`, `RGGI`, `SBTi_Internal`, `NZ_Required` |
| `MILESTONES` | 15 | `event`, `status`, `type` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `INVESTMENT_DATA` | `SECTOR_PROFILES.map((s, i) => ({` |
| `SECTOR_F` | `['All', ...new Set(CORPORATES.map(c => c.sector))];` |
| `REGION_F` | `['All', 'North America', 'Europe', 'Asia-Pacific'];` |
| `kpis` | `useMemo(() => { const n = Math.max(1, filtered.length);` |
| `avgCarbonPrice` | `Math.round(filtered.reduce((s, c) => s + c.carbonPrice, 0) / n);` |
| `totalInvest` | `Math.round(filtered.reduce((s, c) => s + c.investMn, 0) / 1000);` |
| `factor` | `(carbonPriceWif / 100) * (adoptionWif / 50);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ABATEMENT_LEVERS`, `CARBON_PRICE_SCENARIOS`, `COLORS`, `CORPORATES`, `MILESTONES`, `REGION_F`, `SECTOR_F`, `SECTOR_PROFILES`, `STATUS_F`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Required Annual Reduction | — | SBTi 1.5°C linear pathway | Minimum year-on-year absolute Scope 1+2 reduction rate to remain on a 1.5°C-aligned trajectory |
| Lowest-MAC Lever | — | MAC curve analysis | Cheapest abatement lever identified; negative MAC indicates net cost saving |
| Technical Abatement Potential | — | Technology assessment | Maximum emission reduction achievable using all identified technologies at current maturity |
| Residual Emissions (2040) | — | Pathway model | Residual hard-to-abate emissions requiring carbon removal or offset by target year |
- **GHG inventory (Scope 1/2/3 baseline by activity)** → Decomposition into abatable activity segments → **Emission reduction potential per segment**
- **Technology cost database (CapEx, OpEx, savings, lifetime)** → MAC calculation per lever: (CapEx + OpEx − savings) / lifetime abatement → **Ranked MAC curve with abatement volume waterfall**
- **SBTi pathway tool outputs (required reduction trajectory)** → Gap analysis: required reductions vs. identified lever stack → **Residual emission gap and offset/removal requirement**

## 5 · Intermediate Transformation Logic
**Methodology:** Marginal Abatement Cost
**Headline formula:** `MAC = ΔCost / ΔEmissions Reduced (€/tCO₂e)`

Each decarbonisation lever is evaluated by dividing the net incremental cost (CapEx + OpEx − savings) by the lifetime emission reduction in tCO₂e. Levers are ranked from lowest to highest MAC to construct an abatement priority stack that maximises emission reduction per unit of capital.

**Standards:** ['McKinsey MAC Curve Methodology', 'IEA MACC Framework', 'SBTi Pathway Tools']
**Reference documents:** IEA (2023) Net Zero by 2050 â€” A Roadmap for the Global Energy Sector; SBTi (2023) Corporate Net-Zero Standard v1.2 â€” Annex on Residual Emissions; McKinsey (2023) Global Energy Perspective â€” Marginal Abatement Cost Curves; IPCC AR6 WG3 (2022) Mitigation of Climate Change â€” Chapter 12

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module implements its guide well: a **marginal-abatement-cost (MAC) roadmap** over a curated,
largely **real** dataset — 60 named corporates with genuine baselines/targets/investments and a 30-row
abatement-lever library with real per-lever cost ($/tCO₂) and abatement potentials. The MAC formula
`MAC = ΔCost / ΔEmissions` is represented by the levers' `costPerTon` field, and the SBTi 4.2 %/yr
reference and multi-pathway trend are present. The synthetic content is confined to a small
noise term on the pathway trend line. No ⚠️ mismatch on methodology.

### 7.1 What the module computes

```js
kpis: avgCarbonPrice = Σ c.carbonPrice / n
      totalInvest    = Σ c.investMn / 1000            // $Bn
      onTrack        = count(status ∈ {On Track, Ahead})
scenarioAbatement (what-if on a chosen lever):
      base    = lever.abatementBy2030
      factor  = (carbonPriceWif/100) × (adoptionWif/50)
      scenario = base × factor
INVESTMENT_DATA: roi = opexSavings / max(1,capexBn) × 100      // % ROI per sector
reductionPct (per corporate) = curated (baseline→current progress)
```

The corporate tracker filters/sorts 60 firms; the abatement tab ranks the 30 levers by `costPerTon`
(negative = net-saving) to form the MAC stack; the carbon-pricing tab plots 9-year ETS trajectories;
the scenario planner scales a lever's 2030 abatement by a carbon-price × adoption factor.

### 7.2 Parameterisation / data provenance

| Dataset | rows | key fields | provenance |
|---|---|---|---|
| `CORPORATES` | 60 | baseline, target2030/50, current, netZeroYear, sbti, carbonPrice, investMn, reductionPct | **real** company disclosures (Shell 1620→810 MtCO₂e 2030, Ørsted 10.5→0.84, Apple 25→10 …) |
| `ABATEMENT_LEVERS` | 30 | costPerTon (−35…420), potentialMtY, maturity, abatement 2030/2050 | industry MAC estimates (Solar+Storage −$35/t, DACCS +$420/t, SAF +$280/t) |
| `SECTOR_PROFILES` | 12 | co2Mt, targetMt, trlReadiness, capexBn, opexSavings, carbonPrice, decarb2030/50 | sector-level estimates |
| `CARBON_PRICE_SCENARIOS` | 9 | EU_ETS, UK_ETS, CA_CnT, RGGI, SBTi_Internal, NZ_Required | **real** ETS prints (EU ETS 2022 €78, 2023 €85…) + NZ-required glide |
| `MILESTONES` | 14 | Fit-for-55, CBAM, CSDDD, IMO GHG, CORSIA, ICE-ban 2035 | **real** policy calendar |

Lever `costPerTon` signs are economically correct: mature renewables and efficiency carry **negative**
MAC (net savings), while H₂-DRI (+120), CCUS (+65–80), SAF (+280), green ammonia (+220) and DACCS
(+420) are strongly positive — mirroring published McKinsey/IEA MAC curves.

### 7.3 Calculation walkthrough

Corporate KPIs aggregate the filtered set. The MAC stack sorts levers ascending by `costPerTon` and
accumulates `potentialMtY` to build the classic left-to-right abatement waterfall (cheapest first).
The pathway-analysis tab overlays five trajectories (Committed / Current Pace / 1.5 °C / 2 °C / Best
Practice) all indexed to 54,000 MtCO₂e and declining at scenario-specific slopes. `INVESTMENT_DATA`
computes ROI = OpEx savings ÷ CapEx per sector. The scenario planner reprices a single lever's 2030
abatement by the what-if carbon-price/adoption factor.

### 7.4 Worked example

**MAC stack**: sorting levers by `costPerTon` puts Solar+Storage (−$35), Onshore Wind (−$28), Waste
Methane (−$25), Corporate PPAs (−$20)… at the front (all net-saving), pushing SAF (+$280) and DACCS
(+$420) to the far right. Cumulative abatement after the first four = `8.4 + 7.2 + 1.2 + 1.2 = 18.0
MtCO₂/yr` at *negative* net cost — the "no-regret" wedge.

**Scenario planner**: lever = "Green Hydrogen DRI" (`abatementBy2030 = 0.2`), carbon-price what-if
150, adoption what-if 75:
`factor = (150/100) × (75/50) = 1.5 × 1.5 = 2.25`; `scenario = 0.2 × 2.25 = 0.45 MtCO₂/yr` — i.e. a
higher carbon price and adoption more than doubles the deployable 2030 abatement of H₂-DRI, capturing
the economic-signal → deployment link.

**Sector ROI**: Energy `opexSavings 3400 / capexBn 8200 × 100 = 41.5%`; Chemicals `1200/3800 = 31.6%`.

### 7.5 Data provenance & limitations

- Corporate baselines/targets, ETS prices, and the policy milestone calendar are **real**; the only
  synthetic touch is a small `sr()` noise term (`+ sr(i·7)·400`) on three of the pathway-trend series.
- The scenario-planner `factor` is a linear price×adoption scalar, not a supply-curve or elasticity
  model — a real deployment model would use a technology-specific price-response elasticity and a
  capacity-constraint ceiling.
- Lever MAC values are static point estimates (no learning-curve time dependence), and `potentialMtY`
  is portfolio-agnostic (not derived from the 60 corporates' specific abatement needs).

**Framework alignment:** McKinsey/IEA **MAC curve** methodology — the lever library is a direct
implementation: levers ranked by €/tCO₂, abatement volume on the x-axis. **SBTi** Corporate Net-Zero
Standard — the 1.5 °C-required pathway and per-company sbti status/targets reference SBTi's absolute-
contraction approach (1.5 °C ⇒ ≥4.2 %/yr linear reduction). **IEA NZE 2050** informs the sector
CapEx/decarb profiles and the "no new oil/gas fields" milestone; **IPCC AR6 WG3 Ch.12** underpins the
technology cost/potential estimates. **EU ETS / CBAM / Fit-for-55** drive the carbon-price and policy
calendars.

## 9 · Future Evolution

### 9.1 Evolution A — Portfolio-specific MAC with learning curves and constraints (analytics ladder: rung 2 → 3)

**What.** §7 rates this one of the healthier modules: real corporate disclosures
(Shell 1620→810, Ørsted 10.5→0.84), a 30-lever library whose MAC signs and
magnitudes mirror published McKinsey/IEA curves (Solar+Storage −$35/t through
DACCS +$420/t), real ETS prints and a real policy calendar — with only a small
`sr()` noise term on three trend series. The documented ceilings: lever MACs are
static point estimates (no learning-curve time dependence), `potentialMtY` is
portfolio-agnostic, and the scenario planner's `price × adoption` factor is a
linear scalar, not a supply-curve model. Evolution A makes the MAC stack
entity-specific and dynamic.

**How.** (1) Portfolio-specific potentials: intersect each lever with the entity's
actual emission profile (sector, scope split, geography) so the MAC waterfall
shows *addressable* abatement, not global constants — the baseline-profile input
the workflow already describes. (2) Learning curves: per-lever cost decline via
Wright's-law rates from published sources (solar/wind/electrolyzer learning rates
are well-documented), making the accelerated-vs-delayed comparison honest about
cost timing — delay is cheaper per ton for immature levers, the real trade-off.
(3) Constraint layer: capacity ceilings and deployment ramp limits per lever
replacing the linear what-if factor. (4) Remove the residual `sr()` noise; pin
the MAC-stack ordering in a regression test. (5) Serve as the lever library for
`decarbonisation-hub` per that module's evolution.

**Prerequisites.** Learning-rate curation with citations; entity emission
profiles (from the hub's programme registry or BRSR data). **Acceptance:** the
same lever shows different addressable potential for a steel company vs a bank;
delaying a high-learning-rate lever visibly reduces its 2035 MAC; the waterfall
still orders ascending by cost.

### 9.2 Evolution B — Costed transition-plan drafter (LLM tier 1 → 2)

**What.** The module's pitch — "translates a net-zero commitment into a costed,
technology-specific action plan finance and operations can execute" — ends in a
document: the transition plan. Evolution B drafts it from computed state: the
selected MAC stack with per-lever costs and timing, the pathway-vs-SBTi-4.2%/yr
alignment arithmetic, the policy-calendar dependencies (CBAM, Fit-for-55 dates
from the real milestone table), and the residual-emissions statement per the SBTi
Net-Zero Standard annex §5 cites — every number from the lever library and
scenario planner, every policy date from the curated calendar.

**How.** Tier 1 over page state plus this Atlas record and the SBTi/IEA reference
texts; tier 2 when the MAC engine is served, so "re-plan with DACCS excluded and a
2040 target" executes as a scenario call the drafter then documents. CSRD E1-1
transition-plan disclosure structure is the natural output template (linking to
the CSRD family's report machinery). Fabrication validation on all $/t, MtCO₂e,
and dates.

**Prerequisites.** Evolution A's entity-specific potentials (a generic global MAC
stack drafted into a company's plan would be strategy-by-template); corpus
embedding. **Acceptance:** every lever figure in a draft matches the library;
pathway-alignment claims reproduce from the 4.2%/yr arithmetic; policy dates
match the milestone table exactly.