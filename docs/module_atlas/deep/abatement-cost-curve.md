## 7 · Methodology Deep Dive

### 7.1 What the module computes

A McKinsey-style Marginal Abatement Cost Curve (MACC) over a **static library of 30 abatement
measures** across 8 sectors (Power, Transport, Buildings, Industry, Agriculture, Waste, Land Use,
Carbon Removal). Each measure carries five hand-authored attributes:

| Field | Range in seed | Meaning |
|---|---|---|
| `mac` | −85 … +290 $/tCO₂e | Marginal abatement cost (negative = profitable) |
| `potential` | 0.3 … 8.2 GtCO₂e/yr | Global technical abatement potential |
| `trl` | 4 … 9 | Technology readiness level |
| `timeline` | near / medium / long | Deployment horizon |
| `policy` | High / Medium / Low | Policy support rating |

The MAC values themselves are **not computed** — the guide's formula
`MAC = Annualised_cost_change / Annual_emission_reduction` describes how the seeded numbers were
conceptually derived, but the page performs no annualisation. All analytics are aggregations over
the constant `MEASURES` array. Note also the guide claims "50+ measures"; the code ships exactly 30.

### 7.2 Parameterisation

**Carbon-price reference lines** (`CARBON_PRICES`, drawn on both MACC and scenario charts):

| Reference | $/tCO₂e | Provenance |
|---|---|---|
| RGGI | 15 | US Regional Greenhouse Gas Initiative allowance price (approx.) |
| CA Cap | 30 | California cap-and-trade floor (approx.) |
| EU ETS | 65 | EU allowance price level (approx. 2023–24) |
| IEA 1.5C | 130 | IEA Net-Zero 2050 advanced-economy 2030 carbon price |
| SCC | 185 | US EPA 2023 social cost of carbon central estimate ($190 ≈ 185) |

**Other constants:** `SBTI_TARGET_GAP = 12.6` GtCO₂e/yr (inline comment: "GtCO2e/yr remaining
gap") — used as the denominator of the Portfolio Builder coverage bar. The header KPI "Total
Technical Potential 38.4 GtCO₂e/yr" is a **hard-coded string**; summing the 30 seeded potentials
actually gives **49.9 GtCO₂e/yr**, so the headline figure does not reconcile with the dataset.

### 7.3 Calculation walkthrough

- **MACC (Tab 1):** `sorted = [...measures].sort((a,b) => a.mac - b.mac)`, then a cumulative-
  potential scan assigns each bar `cumStart/cumEnd`. Rendered as equal-width bars ordered by MAC
  (a stylised MACC — bar width does *not* encode potential despite the caption).
- **Sector stats (Tab 3):** per sector,
  `weightedMAC = Σ(mac × potential) / Σ(potential)` (potential-weighted average cost) and
  `avgTRL = mean(trl)`. Radar normalisations: `Potential = totalPotential/10 × 100`,
  `CostEfficiency = (300 − weightedMAC)/450 × 100` (clamped ≥ 0), `TRL = avgTRL/9 × 100`,
  `PolicySupport = 25 × count(policy = 'High')`, and `Speed` is a hard-coded lookup
  (Power/Buildings 90, Carbon Removal 20, else 55).
- **Carbon-price scenarios (Tab 4):** for each price P in `[0,15,30,…,250]`,
  `viable = measures.filter(m => m.mac <= P)`; report `count` and `Σ potential` — i.e. the
  classic "abatement unlocked at carbon price P" supply curve.
- **Portfolio Builder (Tab 5):**
  `portfolioMAC = Σ(mac_i × potential_i) / Σ(potential_i)` over selected measures (guarded to 0
  when empty), and `sbtiCoverage = min(100, round(Σ potential / 12.6 × 100))`.
- **Header KPIs:** count of negative-MAC measures, their mean MAC, count viable at $100/t,
  arg-min MAC, arg-max potential — all simple reduces over `MEASURES`.

### 7.4 Worked example — portfolio of three measures

Select LED Lighting Retrofit (mac −85, pot 0.8), Building Insulation (−45, 1.5) and Heat Pump
Deployment (+35, 2.2):

| Step | Computation | Result |
|---|---|---|
| Total potential | 0.8 + 1.5 + 2.2 | **4.5 GtCO₂e/yr** |
| Total cost | (−85×0.8) + (−45×1.5) + (35×2.2) = −68 − 67.5 + 77 | **−58.5 $M-equivalent units** |
| Portfolio MAC | round(−58.5 / 4.5) | **−13 $/tCO₂e** |
| SBTi coverage | min(100, round(4.5 / 12.6 × 100)) | **36%** |

The portfolio is net-profitable (negative weighted MAC) yet covers only 36% of the assumed
12.6 GtCO₂e/yr SBTi gap — the intended pedagogical takeaway of the tab.

### 7.5 Companion analytics

- **Measure Library (Tab 2):** filter/sort table (search, sector, timeline; numeric sort on
  mac/potential/trl) with TRL badges colour-thresholded at ≥8 green, ≥6 amber, else red.
- **Cross-tab highlighting:** clicking a bar or row sets a shared `highlighted` id that dims the
  other bars — no numeric effect.
- The page imports `SECTOR_BENCHMARKS` from `data/referenceData` but never uses it.

### 7.6 Data provenance & limitations

- All 30 measures are **hand-authored synthetic demo values**. The footer attributes them to
  "IEA WEO 2024 · IPCC AR6 WG3 · McKinsey Global GHG Abatement Cost Curve · Project Drawdown
  2023", but no per-measure citation exists in code; treat the numbers as plausible literature-
  order-of-magnitude, not sourced datapoints.
- The platform PRNG `sr(seed) = frac(sin(seed+1)×10⁴)` is defined but **unused** — this module
  contains no random generation at all; outputs are fully deterministic from the constant array.
- Simplifications vs production MACC practice: no discount rate, technology learning curves,
  capacity constraints, or interaction effects between measures (real MACCs deflate overlapping
  potentials); MAC is static, not year-indexed; bar widths do not encode potential; and the
  headline 38.4 Gt figure conflicts with the 49.9 Gt seed sum.
- Guide↔code deltas worth noting (not a methodology mismatch): 30 measures vs guide's "50+";
  guide's cost range "−$100 to $300+" vs actual −85 to +290.

### 7.7 Framework alignment

- **McKinsey Global GHG Abatement Cost Curve** — the module reproduces the canonical presentation:
  measures ranked by $/tCO₂e with cumulative potential on the x-axis; McKinsey derives each MAC as
  annualised incremental cost (capex annuity + opex delta) divided by annual abatement vs a
  reference technology. Here the ranking logic is faithful; the cost derivation is pre-baked.
- **IPCC AR6 WGIII Ch.6/12** — AR6 presents sectoral abatement potentials at <$0, <$20, <$50,
  <$100/tCO₂e price bands; Tab 4's viability-vs-price curve is the same construct with a finer
  price grid.
- **SBTi** — the 12.6 Gt "target gap" frames portfolio coverage against a science-based global
  reduction need; SBTi itself validates company-level targets against sectoral decarbonisation
  pathways rather than publishing a single gap number, so this constant is a stylised anchor.
- **IEA NZE 2050** — the $130 reference line matches IEA's 2030 carbon-price assumption for
  advanced economies in the Net-Zero Emissions scenario.
- **US EPA SCC (2023)** — the $185 line approximates the EPA's updated ~$190/tCO₂ (2% discount
  rate) social cost of carbon.
