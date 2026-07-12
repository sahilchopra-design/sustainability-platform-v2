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
