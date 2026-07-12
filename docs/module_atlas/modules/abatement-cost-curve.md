# Abatement Cost Curve
**Module ID:** `abatement-cost-curve` · **Route:** `/abatement-cost-curve` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Marginal abatement cost (MAC) curves ranking decarbonisation technologies from cheapest (negative cost) to most expensive (DAC $300+/tCO2). Covers 50+ abatement measures across energy, transport, buildings, industry, and land use.

> **Business value:** The MAC curve is the foundational tool for cost-optimal decarbonisation planning. It shows where to invest first (negative-cost measures) and what level of carbon price is needed to unlock progressively more expensive abatement options.

**How an analyst works this module:**
- MAC Curve shows ranked measures with cost and potential
- Sector Filter narrows to specific abatement domain
- Portfolio Builder selects lowest-cost pathway to target

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CARBON_PRICES`, `CarbonPriceScenariosTab`, `KpiCard`, `MACCTooltip`, `MACCVisualisationTab`, `MEASURES`, `MeasureLibraryTab`, `PortfolioBuilderTab`, `SBTI_TARGET_GAP`, `SECTOR_COLORS`, `SectorBadge`, `SectorComparisonTab`, `TRLBadge`, `TabBar`, `TimelineBadge`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CARBON_PRICES` | 6 | `price`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SBTI_TARGET_GAP` | `12.6; // GtCO2e/yr remaining gap` |
| `map` | `{ near: { label:'Near-term', color: T.green }, medium: { label:'Medium', color: T.amber }, long: { label:'Long-term', color: T.red } };` |
| `sorted` | `useMemo(() => [...measures].sort((a, b) => a.mac - b.mac), [measures]);` |
| `radarData` | `useMemo(() => sectorStats.map(s => ({` |
| `viabilityData` | `useMemo(() => scenarioPrices.map(price => {` |
| `totalPotential` | `viable.reduce((s, m) => s + m.potential, 0);` |
| `totalPot` | `viable.reduce((s, m) => s + m.potential, 0);` |
| `pct` | `Math.round((viable.length / (measures.length \|\| 1)) * 100);` |
| `totalCost` | `portfolio.reduce((s, m) => s + m.mac * m.potential, 0);` |
| `portfolioMAC` | `totalPotential > 0 ? Math.round(totalCost / totalPotential) : 0;` |
| `sbtiCoverage` | `Math.min(100, Math.round((totalPotential / sbtiGap) * 100));` |
| `entries` | `Object.entries(sMap).sort((a, b) => b[1] - a[1]);` |
| `highestPotential` | `MEASURES.reduce((a, b) => a.potential > b.potential ? a : b);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CARBON_PRICES`, `MEASURES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Measures | — | IPCC AR6 | From negative-cost efficiency to high-cost CDR |
| Cost Range | — | Literature | Wide range from negative to high-cost abatement |
- **Technology cost data** → Annualised cost calculation → **MAC per technology**
- **Emission reduction potential** → Opportunity ranking → **MACC visualisation**

## 5 · Intermediate Transformation Logic
**Methodology:** Marginal abatement cost ranking
**Headline formula:** `MAC = Annualised_cost_change / Annual_emission_reduction`

Negative cost measures: insulation, LED lighting, fuel switching — save money AND reduce emissions. Positive: CCS, DAC, green hydrogen production — cost money. MACC shows potential vs cost tradeoff across measures.

**Standards:** ['McKinsey MACC', 'IPCC AR6 WGIII']
**Reference documents:** McKinsey Global Abatement Cost Curve; IPCC AR6 WGIII Chapter 6

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Backend MACC engine with real annualisation (analytics ladder: rung 1 → 2)

**What.** Today this is a tier-B frontend-only page: 30 hand-authored measures in a constant
`MEASURES` array, MAC values pre-baked (the §5 formula `MAC = ΔAnnualised_cost / ΔAnnual_abatement`
is never actually computed), and a header KPI (38.4 Gt) that contradicts the seed sum (49.9 Gt).
Evolution A builds the module's first backend vertical: an `abatement_measures` reference table
with per-measure capex/opex/lifetime/abatement fields and per-row citations (IEA WEO, AR6 WGIII
Ch.6 price bands), plus a MACC engine that derives MAC properly — capex annuity at a
user-supplied discount rate plus opex delta, divided by annual abatement.

**How.** New route pair `GET /api/v1/macc/measures` and `POST /api/v1/macc/curve` accepting
`{discount_rate, year, sector_filter, carbon_price_grid}`; the engine returns the ranked curve
with cumulative potential (so bar width can finally encode potential, fixing the stylised-MACC
caveat in §7.3) and the viability-vs-price supply curve the page currently computes client-side.
Rung 2 arrives via parameter sweeps: discount-rate sensitivity (3–12%) and year-indexed MACs
using simple learning-curve declines for CCS/DAC/H₂.

**Prerequisites.** Fix the 38.4-vs-49.9 header reconciliation and the "50+ measures" guide claim
during migration; Alembic migration for the reference table; per-measure source citations are
mandatory (the current footer attribution is decorative). **Acceptance:** portfolio MAC for the
§7.4 worked example reproduces −13 $/tCO₂e at the legacy assumptions, and changing the discount
rate from 5% to 10% visibly reorders at least the capital-intensive measures.

### 9.2 Evolution B — MACC copilot grounded in the measure library (LLM tier 1)

**What.** A chat panel answering "why is heat-pump deployment +35 $/t while insulation is −45?",
"what carbon price unlocks 20 Gt?", and "what's excluded from this curve?" strictly from this
Atlas page and the live page state — the sorted curve, the Tab 4 supply-curve array, and the
Portfolio Builder selection. Because the module currently exposes zero endpoints, tier 1
(explanation-only) is the honest scope; the copilot must volunteer the documented limitations
(no discount rate, no measure interaction/overlap deflation, static MACs) rather than imply
McKinsey-grade rigor.

**How.** Per-module system prompt assembled from this page's §5/§7 sections embedded in
`llm_corpus_chunks` per the roadmap Tier-1 pattern; page state (selected measures, active
carbon-price scenario) passed as structured context so answers cite actual on-screen numbers;
served via `POST /api/v1/copilot/abatement-cost-curve/ask` with the standard refusal path for
questions the module cannot answer (e.g. company-specific MACs). Once Evolution A ships, the
same panel graduates to tier 2 by tool-calling `POST /macc/curve` for what-ifs ("re-rank at 8%
discount rate").

**Prerequisites.** Atlas corpus embedded (roadmap D3 pgvector tables); the copilot's grounding
must note that measure values are synthetic literature-order-of-magnitude, not sourced datapoints,
until Evolution A's cited table lands. **Acceptance:** every numeric in an answer traces to the
page state or an Atlas section; asking "what is the MAC of offshore wind in Germany?" produces a
refusal naming the module's global-static scope.