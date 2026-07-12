# Waste-to-Energy Finance Analytics
**Module ID:** `waste-to-energy-finance` · **Route:** `/waste-to-energy-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DL2 · **Sprint:** DL

## 1 · Overview
Models the economics of waste-to-energy (WtE) projects including incineration-with-energy-recovery, anaerobic digestion, gasification, and landfill gas. Calculates gate fees, tipping revenue, electricity/heat sales, carbon credits, and regulatory compliance under EU ETS.

> **Business value:** Applicable to WtE project developers and lenders, municipal waste authorities procurement teams, and infrastructure funds. Provides bankable project financial model incorporating EU ETS inclusion impact and biomethane RED III value for anaerobic digestion projects.

**How an analyst works this module:**
- Input waste composition and annual throughput
- Calculate gate fee, energy revenue, and carbon credit streams
- Model EU ETS carbon cost impact from 2026
- Assess biogas/biomethane project economics for organics
- Generate lender-grade WtE project financial model

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COUNTRIES`, `KpiCard`, `PROJECTS`, `REGIONS`, `STATUSES`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `type` | `TYPES[Math.floor(sr(i * 7) * TYPES.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];` |
| `region` | `REGIONS[Math.floor(sr(i * 13) * REGIONS.length)];` |
| `status` | `STATUSES[Math.floor(sr(i * 17) * STATUSES.length)];` |
| `capacityMW` | `Math.round(5 + sr(i * 3) * 295);` |
| `wasteProcessed` | `Math.round(50 + sr(i * 5) * 950);` |
| `energyOutput` | `Math.round(capacityMW * (2000 + sr(i * 19) * 3000) / 1000);` |
| `totalCapacity` | `filtered.reduce((s, p) => s + p.capacityMW, 0);` |
| `totalWaste` | `filtered.reduce((s, p) => s + p.wasteProcessed, 0);` |
| `totalEnergy` | `filtered.reduce((s, p) => s + p.energyOutput, 0);` |
| `avgLcoe` | `(filtered.reduce((s, p) => s + p.lcoe, 0) / n).toFixed(0);` |
| `totalCredits` | `filtered.reduce((s, p) => s + p.carbonCredits, 0);` |
| `creditValue` | `((totalCredits * carbonPrice) / 1000).toFixed(1);` |
| `gateRevenue` | `((totalWaste * gateFee) / 1000).toFixed(0);` |
| `typeCapData` | `TYPES.map(t => {` |
| `typeLcoeData` | `TYPES.map(t => {` |
| `typeCreditData` | `TYPES.map(t => {` |
| `scatterData` | `filtered.map(p => ({ x: p.wasteProcessed, y: p.energyOutput, name: p.name }));` |
| `pct` | `n > 0 ? (ps.length / n) * 100 : 0;` |
| `tot` | `filtered.filter(p => p.type === t).reduce((s, p) => s + p.wasteProcessed, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `REGIONS`, `STATUSES`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EU WtE Capacity | — | ISWA WtE Stats 2023 | 500 WtE facilities in EU processing 97 Mt municipal waste/yr — with energy recovery rate 83% |
| Typical WtE Gate Fee | — | Eunomia WtE Market Analysis 2023 | Municipal solid waste gate fee for large WtE — varies by country, waste quality, and alternative tipping costs |
| EU ETS WtE Impact | — | European Commission ETS Review 2023 | WtE inclusion in EU ETS from 2026 adds €50–80/tonne carbon cost based on current EUA price |
- **Waste characterisation studies + tonnage data** → Revenue and energy yield calculation → **Gate fee sensitivity and energy production forecast**
- **Carbon market price projections + EU ETS rules** → Carbon cost/revenue modelling → **Net carbon position under ETS inclusion from 2026**
- **Competing waste treatment costs (landfill, recycling)** → Market positioning analysis → **Gate fee competitiveness vs alternative disposal options**

## 5 · Intermediate Transformation Logic
**Methodology:** WtE Project Economics
**Headline formula:** `WtE_NPV = Σ [(GateFee + EnergyRevenue + CarbonCredit - CapEx/n - OpEx - CarbonCost) / (1+r)^t]; BiogasYield = OrganicFraction × VS × BMP × ConversionEfficiency`

Gate fee is primary revenue for municipal WtE; energy revenue secondary; biogenic fraction exemption under EU ETS until 2026 after which carbon cost becomes material

**Standards:** ['EU ETS WtE Inclusion 2026 Rules', 'IEA Bioenergy WtE Task 36', 'ISWA Guidelines on Waste-to-Energy 2022', 'EU Renewable Energy Directive (RED III) Biomethane']
**Reference documents:** IEA Bioenergy — Waste-to-Energy: Considerations for Informed Decision-Making (2020); ISWA Guidelines for Waste-to-Energy in Developing Countries (2022); EU ETS Review 2023 — Municipal Waste Incineration Inclusion; EU RED III Biomethane Blending Targets

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry gives an NPV formula
> (`WtE_NPV = Σ[(GateFee+EnergyRevenue+CarbonCredit−CapEx/n−OpEx−CarbonCost)/(1+r)^t]`) and a biogas
> yield formula (`BiogasYield = OrganicFraction × VS × BMP × ConversionEfficiency`). **Neither is
> implemented.** There is no discount rate, no multi-year cash-flow loop, and no biogas-yield
> calculation anywhere in the file. The module is a 55-project synthetic directory with two simple
> portfolio aggregates (gate-fee revenue, carbon-credit value) computed from user-adjustable sliders.
> This module significantly overlaps the sibling `waste-to-energy-biogas-finance` module (which has
> a similar gap — see its deep dive for the recommended production project-finance model, §8; not
> repeated here to avoid duplication).

### 7.1 What the module computes

55 synthetic projects (`PROJECTS`) across 6 technology types (Incineration, AD, Gasification,
Landfill Gas, Pyrolysis, Biomass), 6 regions, 12 countries, with independent `sr()`-seeded fields:
`capacityMW` (5–300), `wasteProcessed` (50–1,000 kt/yr), `energyOutput = capacityMW × (2000+sr·3000)
/1000` (GWh, an implied 2,000–5,000 full-load-hour range per project), `projectValue`, `lcoe`
($60–200/MWh), `carbonCredits` (5–150 kt), `co2Intensity`, `irr` (4–22%), `subsidyEligible` (boolean).

Two genuinely-computed portfolio aggregates respond to sliders:

```js
gateRevenue = totalWaste × gateFee / 1000            // $M, gateFee slider $/tonne (default 45)
creditValue = totalCredits × carbonPrice / 1000       // $M, carbonPrice slider $/tCO2e (default 55)
avgLcoe     = Σ lcoe_i / n                             // simple mean of filtered projects' random lcoe field
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `capacityMW` | 5–300 | `5 + sr(i·3)·295`, synthetic uniform |
| `energyOutput` implied full-load-hours | 2,000–5,000 h/yr | `2000 + sr(i·19)·3000`, synthetic uniform — plausible but not technology-specific (a 300MW EfW plant and a 5MW LFG unit draw from the same distribution) |
| `lcoe` | $60–200/MWh | `60 + sr(i·31)·140`, synthetic uniform, independent of `type` |
| `irr` | 4–22% | `4 + sr(i·43)·18`, synthetic uniform, independent of `capacityMW`/`lcoe`/`subsidyEligible` |
| `subsidyEligible` | ~60% True | `sr(i·47) > 0.4` |

Critically, **`lcoe` and `irr` are independent random draws per project, not functions of `type`** —
an Incineration project and a Landfill Gas project have the same expected LCOE distribution in code,
even though the guide's own reference data (and the sibling biogas module) show LFG should be
materially cheaper than mass-burn EfW.

### 7.3 Calculation walkthrough

1. Filters (`typeFilter`, `regionFilter`, `statusFilter`) reduce `PROJECTS` (55) to `filtered`.
2. `totalCapacity`, `totalWaste`, `totalEnergy`, `totalCredits` are simple sums over `filtered`.
3. `avgLcoe = Σlcoe/n` — an unweighted mean (a $5MW project and a $300MW project count equally).
4. `gateRevenue` and `creditValue` respond live to the `gateFee`/`carbonPrice` sliders, multiplying
   the *filtered* portfolio's `totalWaste`/`totalCredits` by the slider value — this is the only
   slider-reactive calculation in the module.
5. `typeCapData`/`typeLcoeData`/`typeCreditData` group `filtered` by technology type for bar charts —
   `typeLcoeData` averages the random `lcoe` field per type, which (given point 7.2's independence
   from `type`) produces a chart that looks like a genuine technology cost comparison but is
   statistical noise around a common mean, not a true technology cost curve.
6. `scatterData` plots `wasteProcessed` vs `energyOutput` per project — since `energyOutput` is
   derived from `capacityMW` (not `wasteProcessed`) via the full-load-hours formula, and
   `wasteProcessed` is an independent random draw, the scatter shows no structural correlation
   despite waste throughput and energy output being causally linked in reality.

### 7.4 Worked example

At default sliders (`gateFee=$45/t`, `carbonPrice=$55/tCO2e`), if `filtered` (all 55 projects)
totals `totalWaste = 28,500 kt` and `totalCredits = 4,200 kt`:

```
gateRevenue = 28,500 × 45 / 1000 = $1,282.5M
creditValue = 4,200 × 55 / 1000 = $231.0M
```

These are portfolio-level, not per-project, figures — useful as an order-of-magnitude market-sizing
view but not attributable to any single project's bankability.

### 7.5 Data provenance & limitations

- **All 55 projects are synthetic**, with real-sounding operator-style names (Thames/Biffa/Veolia-
  style prefixes) but no correspondence to actual WtE facilities.
- **LCOE and IRR are technology-independent random draws** — the single largest limitation, since the
  guide's own methodology (and industry data) shows LCOE varies 3× across WtE technologies (LFG
  ~$48/MWh vs Plasma Arc ~$165/MWh per the sibling module's `TECHNOLOGIES` table).
- No discount-rate/NPV, biogas-yield, or EU ETS carbon-cost-post-2026 calculation exists despite
  being the guide's headline formulas.

**Framework alignment:** EU ETS WtE Inclusion 2026 Rules, IEA Bioenergy WtE Task 36, ISWA WtE
Guidelines 2022, and EU RED III Biomethane (all named in the guide) are **not implemented** as
calculations — they appear only in the guide text, not in any code-level EF/tariff/threshold value.
See `waste-to-energy-biogas-finance`'s §8 Model Specification for the recommended production
project-finance cash-flow model, which applies equally to this module's project universe.

## 9 · Future Evolution

### 9.1 Evolution A — Technology-conditioned economics via the sibling's project-finance engine (analytics ladder: rung 1 → 2)

**What.** The module is a 55-project synthetic directory whose two slider aggregates
(`gateRevenue`, `creditValue`) are its only reactive math; §7's flag documents that
the advertised NPV and biogas-yield formulas are unimplemented, and — the single
largest limitation per §7.5 — `lcoe` and `irr` are technology-*independent* random
draws, so the per-type LCOE chart "looks like a genuine technology cost comparison but
is statistical noise around a common mean". Evolution A conditions everything on
technology: LCOE/IRR distributions anchored to the sibling
`waste-to-energy-biogas-finance` module's 8-technology matrix (LFG ~$48/MWh vs Plasma
Arc ~$165/MWh), `energyOutput` derived from `wasteProcessed` and per-type conversion
efficiency (fixing §7.3's scatter that shows no correlation between causally-linked
quantities), and an EU-ETS-from-2026 carbon-cost term
(`fossilFraction × tonnage × EUA price`) so the module's headline regulatory story is
finally computed. Per its own §7.5 recommendation, project-level economics reuse the
sibling module's planned cash-flow waterfall engine rather than building a second one.

**How.** Point this page at the sibling's `POST /api/v1/wte-finance/project-model`
once built (or build it here first — the two modules share one §8 spec); the ETS term
is a pure frontend formula using the existing `carbonPrice` slider plus a per-type
biogenic-fraction constant (ISWA-cited).

**Prerequisites.** The sibling's engine (shared dependency, coordinate to avoid
duplication); biogenic-fraction reference values per technology. **Acceptance:** the
per-type LCOE chart shows LFG materially below Incineration by construction; the
waste-vs-energy scatter shows positive correlation; toggling ETS-2026 reduces
incineration project economics but not AD.

### 9.2 Evolution B — Market-sizing copilot for municipal procurement (LLM tier 1)

**What.** Unlike the sibling (deal-level screening), this module's aggregates are
portfolio/market-level — §7.4 itself notes the slider outputs are "an order-of-
magnitude market-sizing view". Evolution B leans into that: a copilot for municipal
waste authorities and market analysts that explains the filtered portfolio state —
"what does €80/t gate fee do to the EU incineration revenue pool?", "how much
carbon-credit value is at stake if EUA hits €100?" — by reading the current slider
values and filtered totals from page state, grounded in the Atlas record, with
clear labelling that the 55 projects are synthetic and the answer is directional.

**How.** Tier-1 stack per the roadmap: embed this page into `llm_corpus_chunks`;
`POST /api/v1/copilot/waste-to-energy-finance/ask`; system prompt carries §7.5's
limitations verbatim (synthetic projects, technology-independent draws until
Evolution A) so honesty is baked in. Upgrade to tier 2 only after Evolution A gives
it a real engine tool to call — before that, there is nothing trustworthy to execute.

**Prerequisites.** pgvector corpus (roadmap D3); coordination with the sibling
module's copilot so the two WtE assistants share grounding and don't give conflicting
technology figures. **Acceptance:** every figure in an answer matches page state
arithmetic; asked for a specific facility's real gate fee, the copilot states the
directory is synthetic; ETS questions cite the 2026 inclusion rule with the module's
reference framing, not invented EUA forecasts.