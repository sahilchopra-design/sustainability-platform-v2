# Urban Mobility Transition Finance
**Module ID:** `urban-mobility-transition` · **Route:** `/urban-mobility-transition` · **Tier:** B (frontend-computed) · **EP code:** EP-DM4 · **Sprint:** DM

## 1 · Overview
Analyses the investment economics of urban transport decarbonisation — electric buses, metro/rail, cycling infrastructure, and congestion pricing. Models modal shift impacts on GHG emissions, urban air quality, and the financial sustainability of public transport operators.

> **Business value:** Directly applicable to city transport departments, transit operators issuing green bonds, and infrastructure funds investing in urban mobility. Provides social cost-benefit analysis capturing health and GHG co-benefits for public finance justification and green bond impact reporting.

**How an analyst works this module:**
- Select city and transport mode for transition analysis
- Model modal shift from car to public transit/cycling
- Calculate GHG, air quality, and congestion co-benefits
- Assess public transport operator financial sustainability
- Generate C40/SLOCAT-aligned urban mobility transition plan

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CITIES`, `CITY_NAMES`, `KpiCard`, `REGIONS`, `TABS`, `TRANSITION_LEVELS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa'];` |
| `level` | `TRANSITION_LEVELS[Math.floor(sr(i * 7) * 4)];` |
| `evShare` | `+(5 + sr(i * 3) * 75).toFixed(1);` |
| `evFleet` | `+(2 + sr(i * 11) * 48).toFixed(1);` |
| `transitShare` | `+(10 + sr(i * 13) * 60).toFixed(1);` |
| `cycling` | `Math.round(20 + sr(i * 17) * 980);` |
| `carFree` | `+(0.5 + sr(i * 19) * 29.5).toFixed(1);` |
| `congCharge` | `sr(i * 23) > 0.6;` |
| `lez` | `sr(i * 29) > 0.4;` |
| `emissions` | `+(0.5 + sr(i * 31) * 9.5).toFixed(2);` |
| `transScore` | `Math.round(20 + sr(i * 37) * 80);` |
| `chargingPts` | `+(5 + sr(i * 41) * 145).toFixed(0);` |
| `activeScore` | `+(2 + sr(i * 43) * 8).toFixed(1);` |
| `mobInv` | `+(0.2 + sr(i * 47) * 9.8).toFixed(1);` |
| `emisRed` | `+(5 + sr(i * 53) * 55).toFixed(1);` |
| `avgEV` | `filtered.length ? (filtered.reduce((s, c) => s + c.evShareNewSales, 0) / filtered.length).toFixed(1) : '0';` |
| `avgTransit` | `filtered.length ? (filtered.reduce((s, c) => s + c.publicTransitShare, 0) / filtered.length).toFixed(1) : '0';` |
| `totalMobInv` | `filtered.reduce((s, c) => s + c.mobilityInvestment, 0).toFixed(1);` |
| `avgEmisRed` | `filtered.length ? (filtered.reduce((s, c) => s + c.emissionsReduction, 0) / filtered.length).toFixed(1) : '0';` |
| `regionEV` | `REGIONS.map(r => {` |
| `scatterTransit` | `filtered.map(c => ({ x: c.publicTransitShare, y: c.emissionsReduction, name: c.name }));` |
| `topCharging` | `[...filtered].sort((a, b) => b.chargingPointsPer100k - a.chargingPointsPer100k).slice(0, 15)` |
| `emissionTrend` | `[2019, 2020, 2021, 2022, 2023, 2024].map((yr, yi) => {` |
| `avg` | `filtered.length ? filtered.reduce((s, c) => s + c.transportEmissions * (1 - yr * 0.02 * (c.transitionScore / 100)), 0) / filtered.length : 0;` |
| `gap` | `evTarget - c.evShareNewSales;` |
| `pct` | `arr.length ? Math.round(arr.filter(c => c.lowEmissionZone).length / arr.length * 100) : 0;` |
| `inv` | `arr.reduce((s, c) => s + c.mobilityInvestment, 0).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITY_NAMES`, `REGIONS`, `TABS`, `TRANSITION_LEVELS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Urban Transport Emissions Share | — | IEA Transport 2023 | Urban transport accounts for 40% of road transport emissions — buses and private cars are primary targets |
| Electric Bus Cost Premium | — | BloombergNEF EV Market 2024 | Electric bus upfront cost 20–30% more than diesel — but TCO parity in 3–5 years from fuel savings |
| Urban Cycling Investment BCR | — | WHO Cycling Evidence Brief 2023 | Urban cycling infrastructure delivers 5:1 benefit-cost ratio including health, environment, and congestion |
- **City transport mode share + vehicle fleet data** → Emissions baseline → **Transport sector GHG inventory by mode**
- **Transport investment cost databases (UITP, CODATU)** → Investment modelling → **CapEx and OpEx per passenger-km by mode**
- **Air quality and health impact data (WHO HIA)** → Co-benefit valuation → **Annual health co-benefit from air quality improvement**

## 5 · Intermediate Transformation Logic
**Methodology:** Urban Mobility Transition NPV
**Headline formula:** `MobilityNPV = Σ [(FuelSavings_t + HealthCoBenefit_t + CarbonSavings_t × CarbonPrice + CongestionRelief_t - CapEx_t - OpEx_t) / (1+r)^t]; GHGReduction = ModalShift × (ICEfactor - EVfactor) × VKT`

NPV includes health co-benefits (WHO air quality valuation) in social cost-benefit; GHG reduction from modal shift × emission factor differential × vehicle kilometres travelled

**Standards:** ['IEA Future of Urban Mobility 2023', 'IPCC AR6 WGIII Chapter 10 — Transport', 'C40 Electric Bus Declaration', 'SLOCAT Transport and Climate Change Global Status Report']
**Reference documents:** IEA Future of Urban Mobility 2023; C40 Cities — Global Electric Bus Declaration; SLOCAT Transport and Climate Change Global Status Report 2021; IPCC AR6 WGIII Chapter 10 — Transport

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

60 real named cities (Oslo, Amsterdam, Copenhagen, Tokyo, Singapore, New York, São Paulo, Nairobi,
Dubai...) are each assigned a mobility-transition profile via the seeded PRNG
`sr(s)=frac(sin(s+1)×10⁴)`. Every field — EV share, transit share, cycling infrastructure,
transition score, emissions, mobility investment — is an **independent** random draw; no formula
combines the underlying adoption metrics into the headline `transitionScore` or `emissionsReduction`
figures.

```js
country = region.split(' ').pop()     // ⚠️ see §7.4 — this does not produce a real country name
transitionScore = round(20 + sr(i×37) × 80)   // independent of evShare, transitShare, cycling, etc.
```

### 7.2 Parameterisation

| Field | Formula | Range | Provenance |
|---|---|---|---|
| `CITY_NAMES` (60) | Real cities grouped loosely by region in the source list order | — | Real city names, correctly reflecting genuine mobility-transition leaders (Oslo, Amsterdam, Copenhagen, Zurich, Stockholm appear first — consistent with these cities' real-world reputation as EV/cycling leaders) |
| `region` | `REGIONS[i % 5]` | Round-robin cycling through 5 regions | Assigns region by array position, not by the city's actual geography |
| `country` | `region.split(' ').pop()` | **"America", "Europe", "Pacific", "America" (Latin America), "Africa" (Middle East & Africa)** | **Bug**: this derives a pseudo-country string from the *region* name's last word, not the city's real country — see §7.4 |
| `evShareNewSales` | `5+sr(i×3)×75` | 5–80% | Synthetic |
| `transitionLevel` | `TRANSITION_LEVELS[⌊sr(i×7)×4⌋]` | Early/Developing/Advanced/Leader | Synthetic, independent of `transitionScore` |
| `transitionScore` | `20+sr(i×37)×80` | 20–100 | Synthetic, independent of every other field on the same row (EV share, transit share, cycling km, emissions) |
| `congestionCharge` / `lowEmissionZone` | `sr()>0.6` / `sr()>0.4` (~40%/~60% true) | boolean | Synthetic |

### 7.3 Calculation walkthrough

1. **City generation**: 15 independent PRNG draws per city populate EV share/fleet, transit share,
   cycling km, car-free zone area, congestion charge/LEZ flags, transport emissions, transition
   score, charging points, active-transport score, mobility investment, and emissions reduction —
   all statistically unrelated to each other despite appearing together as if they described one
   coherent city profile.
2. **Portfolio aggregation**: `avgEV`, `avgTransit`, `totalMobInv`, `avgEmisRed` computed as simple
   means/sums over the filtered city set.
3. **Regional EV breakdown** (`regionEV`): groups the 60 cities by (bugged) `region` field and
   averages EV share per region.
4. **Emission trend** (2019–2024): `avg = Σ transportEmissions × (1 − yr×0.02×transitionScore/100)`
   — a genuine formula linking a city's emissions to its transitionScore (higher transition score →
   faster assumed emissions decline), one of the few places two independently-seeded fields are
   actually combined arithmetically.
5. **Top Charging Infrastructure**: ranks cities by `chargingPointsPer100k`.
6. **LEZ adoption %**: `arr.filter(lowEmissionZone).length / arr.length × 100` per filtered group.

### 7.4 Worked example (City #1, `i=0`, "Oslo")

| Field | Computation | Result |
|---|---|---|
| Region | `REGIONS[0]` | **North America** |
| Country (bugged) | `'North America'.split(' ').pop()` | **"America"** |
| Transition level | `⌊sr(7)×4⌋=2` | **Advanced** |
| EV share of new sales | `5+sr(3)×75` | **58.2%** |
| Transit share | `10+sr(13)×60` | **52.6%** |
| Cycling infrastructure | `20+sr(17)×980` | **716 km** |
| Transition score | `20+sr(37)×80` | **77** |

Oslo — the real-world global leader in EV adoption (>80% of new car sales are electric as of recent
years) — is here mislabelled as being located in "**North America**" with country "**America**",
purely because it is the first city in the array and region assignment is round-robin by index, not
by actual geography. This is a clear, verifiable data-integrity defect: any regional aggregation
(e.g. "North America EV adoption") drawn from this table will silently include European and Asian
cities mislabelled into the wrong region, and no city in the dataset is ever assigned a real country
name (only "America," "Europe," "Pacific," or "Africa" are possible values).

### 7.5 Companion analytics

- **Emission trend chart** (2019–2024) — the one place `transitionScore` and `transportEmissions`
  are combined into a derived trajectory, via the formula in §7.3 step 4.
- **EV Gap tab**: `gap = evTarget − c.evShareNewSales` — compares each city's current EV share
  against a user-set target, a straightforward and genuinely useful gap calculation.
- **Scatter (Transit Share vs Emissions Reduction)**: plots two independently-seeded fields against
  each other; any apparent correlation in the resulting chart is a PRNG artefact, not a real
  relationship.

### 7.6 Data provenance & limitations

- **All 60 cities' mobility metrics are synthetic**, generated by `sr()` — real city names are used,
  but EV share, transit share, cycling infrastructure, and transition score are not sourced from any
  actual municipal transport authority or IEA/C40 dataset.
- **The `region`/`country` assignment is a confirmed logic defect**, not merely "synthetic data" —
  the code produces geographically nonsensical labels for every single city (e.g. Oslo in "America"),
  which would make any regional rollup or map visualization built on this field actively misleading
  rather than just imprecise.
- `transitionScore` (the module's headline maturity metric) is statistically independent of the
  underlying adoption metrics it is supposed to summarise (EV share, transit share, cycling
  infrastructure) — a city could show a low `transitionScore` while having a very high `evShare`, or
  vice versa, with no consistency check.
- `transitionLevel` (categorical: Early/Developing/Advanced/Leader) and `transitionScore` (numeric
  20–100) are two more independently-drawn fields describing the same underlying concept, with no
  guarantee that, e.g., a "Leader"-level city actually has a `transitionScore` in the top quartile.

### 7.7 Framework alignment

- **IEA Future of Urban Mobility (2023)**: cited for the real statistic that urban transport is ~40%
  of road transport emissions; the module's per-city emissions field is not derived from this figure.
- **C40 Cities Global Electric Bus Declaration**: referenced as governing context for EV transition
  ambition; not independently modelled (no bus-specific metric exists, only aggregate `evShareNewSales`
  covering all vehicle types).
- **SLOCAT Transport and Climate Change Global Status Report**: cited as a reference; the module's
  regional aggregation (which is undermined by the `country`/`region` bug described in §7.4) would
  need correction before it could be meaningfully compared against SLOCAT's real regional transport
  emissions breakdowns.
- **Low Emission Zone (LEZ) / congestion charging**: correctly modelled as independent policy-flag
  booleans consistent with how these two distinct urban mobility policy instruments are tracked in
  real municipal transport policy databases.

## 9 · Future Evolution

### 9.1 Evolution A — Real city geography and a coherent transition index (analytics ladder: rung 1 → 2)

**What.** Two documented defects gate everything else: §7.4 shows the region/country
assignment is round-robin by array index, so Oslo lands in "North America" with
country "America" — every regional rollup is actively misleading — and §7.6 shows the
headline `transitionScore` is statistically independent of the adoption metrics it
supposedly summarises (a city can score 25 with 80% EV share). Evolution A fixes
geography with a real city→country→region lookup table, then makes `transitionScore` a
derived composite of the fields already on the row (weighted EV share, transit share,
cycling km per capita, LEZ/congestion-charge flags), with `transitionLevel` bucketed
from the score instead of drawn separately. The advertised but absent NPV methodology
(`MobilityNPV` with WHO health co-benefits per §5) gets its first implementation: a
modal-shift calculator computing GHG reduction as
`shift × (ICE_factor − EV_factor) × VKT` using the refdata emission-factor layer.

**How.** (1) Static `CITY_GEO` table (60 rows, real countries) replacing
`region.split(' ').pop()`. (2) A small backend route `POST /api/v1/urban-mobility/npv`
(module is Tier B, EP-DM4) implementing the §5 formula with cited WHO/BNEF cost
constants. (3) Delete the scatter of two independent PRNG fields or derive one from
the other, per §7.5's artefact warning.

**Prerequisites.** Acknowledge the geography bug and score-incoherence as fabrication-
adjacent defects; emission-factor refdata keys for transport modes. **Acceptance:**
Oslo aggregates under Europe/Norway; sorting cities by transitionScore and by EV share
produces visibly correlated rankings; the NPV endpoint reproduces a hand-checked
worked example.

### 9.2 Evolution B — Transition-plan copilot for city transport teams (LLM tier 1)

**What.** The module's stated output is a C40/SLOCAT-aligned urban mobility transition
plan. Evolution B adds a copilot that drafts that plan from the selected city's
profile: it reads the current page state (EV gap vs target from the existing EV Gap
tab, LEZ/congestion status, transit share) plus the Atlas record, and produces a
structured plan narrative — where the city stands, which levers close the gap, what
the C40 Electric Bus Declaration and SLOCAT reporting expect — clearly labelling all
figures as demo data until Evolution A replaces the synthetic profiles.

**How.** Tier-1 stack per the roadmap: embed this Atlas page into `llm_corpus_chunks`;
`POST /api/v1/copilot/urban-mobility-transition/ask`; per-module system prompt carries
§7.6's limitations verbatim so the copilot's honesty is structural, not optional. Once
Evolution A's `POST /npv` exists, upgrade to tier 2 with that single tool so "what's
the NPV of shifting 10% of car trips to transit in Jakarta?" is answered by a tool
call, not generation.

**Prerequisites.** pgvector corpus; the geography fix, so the copilot never describes
Oslo as North American. **Acceptance:** every plan section cites either page state or
a tool response; asked for a city's actual (real-world) EV share, the copilot
distinguishes the module's synthetic figure from real published data and refuses to
conflate them.