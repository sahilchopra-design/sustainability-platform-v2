## 7 · Methodology Deep Dive

The Carbon Removal Analytics module is a CDR technology-comparison and portfolio tool that aligns with its
guide. It ships a rich, largely-real CDR technology library (cost, permanence, TRL, scalability, named
companies) and a backend engine (`carbon_removal_engine.py`) exposing Oxford Principles / Frontier-criteria
reference data. The per-project instances are synthetic; the technology parameters are real. No missing-
model gap is triggered — the net-removal formula is transparent — so there is no §8.

### 7.1 What the module computes

Portfolio KPIs over filtered projects, plus a technology cost-decline projection:

```js
totalCap    = Σ project.capacityKtY
avgCost     = Σ project.costPerTon / n
totalPot2050= Σ CDR_TECHNOLOGIES.potential2050        // GtCO2/yr sustainable potential
yearFactor  = max(0.4, 1 − (calcYear−2024)×0.04)      // 4%/yr learning-curve decline, floored at 0.4
costAtYear  = midCost × yearFactor                     // projected cost per tonne
```

The guide's net-removal formula `NetRemoval = GrossCapture − StorageLeakage − EnergyEmissions` is
represented by each technology's LCA field (life-cycle emissions per tonne removed, e.g. DACCS `lca=0.02`
tCO₂ emitted per tonne removed) rather than a live subtraction.

### 7.2 Parameterisation

**CDR technology library** (`CDR_TECHNOLOGIES`, 13 rows — provenance: **real** IPCC AR6 / CDR.fyi /
Frontier data; company lists are actual firms):

| Tech | Category | Cost $/t | Permanence (yr) | 2050 potential (Gt) | TRL |
|---|---|---|---|---|---|
| DACCS | Engineered | 250–600 | 10,000 | 5.0 | 7 |
| BECCS | Hybrid | 80–200 | 1,000 | 5.0 | 6 |
| Biochar | Nature-based | 60–200 | 500 | 2.0 | 8 |
| Enhanced Weathering | Geochemical | 50–200 | 10,000 | 4.0 | 5 |
| Ocean Alkalinity | Geochemical | 40–250 | 10,000 | 8.0 | 3 |
| Afforestation | Nature-based | 5–50 | 100 | 10.0 | 9 |
| Soil Carbon | Nature-based | 10–100 | 50 | 5.0 | 7 |
| Blue Carbon | Nature-based | 20–100 | 100 | 3.0 | 8 |
| Mineralization | Geochemical | 100–300 | 10,000 | 3.0 | 5 |

The permanence spectrum (geological 10,000 yr → soil 50 yr) and cost bands match the guide and published
CDR literature. Named companies (Climeworks, Drax, UNDO, Running Tide…) are real.

**Synthetic per-project fields** (`sr()`-seeded, 80 projects): capacity (5–85 ktCO₂/yr), cost-per-ton
(within the technology's band), quality score (7–10), region/country/standard/status/vintage/buyer-type,
CO₂-removed. Technology is round-robin (`i % 13`).

### 7.3 Calculation walkthrough

Projects are filtered by category/standard → KPIs sum capacity, average cost, count removed. The cost-curve
tab applies a 4%/yr learning-curve decline (floored at 40% of today's cost) from the technology midpoint.
Corporate-buyer and policy panels roll up `CORPORATE_BUYERS` (26 rows) and `CDR_POLICY` (13 rows) reference
data. The integrity radar uses `INTEGRITY_DIMENSIONS` scoring each pathway (DACCS/BECCS/biochar/EW/
afforestation/soil) on 7 dimensions. The backend engine additionally exposes Oxford Principles and Frontier
procurement criteria via `/carbon-removal/ref/*` endpoints.

### 7.4 Worked example (cost projection + portfolio)

DACCS midpoint cost = (250+600)/2 = $425/t. Project year 2035 → `yearFactor = max(0.4, 1 − 11×0.04) =
max(0.4, 0.56) = 0.56` → `costAtYear = 425 × 0.56 = $238/t` (consistent with IEA's DAC-cost-decline
projections). Enhanced-weathering by the 0.4 floor: at 2040, `yearFactor` would compute to `1−16×0.04 =
0.36 → floored to 0.40`, so cost never drops below 40% of today's — a deliberate learning-curve floor.

Portfolio: 10 filtered DACCS projects summing 400 ktCO₂/yr capacity at average $310/t → `totalCap = 400`,
`avgCost = 310`.

### 7.5 Data provenance & limitations

- **Technology library is real** (costs, permanence, TRL, 2050 potential, company names); project instances
  are **synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`).
- Net-removal is captured via a static LCA field per technology, not a live gross-minus-leakage-minus-energy
  subtraction; permanence is a single number, not a reversal-probability distribution.
- The learning-curve decline is a flat 4%/yr with a 0.4 floor — a simplification of technology-specific
  experience curves (Wright's law).

**Framework alignment:** IPCC AR6 WGIII Ch.12 — the CDR taxonomy and 2050 potential estimates (5–16 GtCO₂/yr
of removal needed) · Oxford Principles for Net-Zero Aligned Offsetting — the shift toward durable removals,
exposed via the backend `oxford-principles` endpoint · Frontier Climate — advance-market-commitment
procurement criteria (`frontier-criteria` endpoint) · CDR.fyi / Puro.earth — the market benchmark data ·
SBTi CDR guidance — the removal-vs-avoidance and permanence-tier distinctions used to score credit quality.
