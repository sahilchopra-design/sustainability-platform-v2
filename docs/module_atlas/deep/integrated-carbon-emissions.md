## 7 · Methodology Deep Dive

This module is materially more grounded than most: it imports the platform's **public reference-data
layer** (`EMISSION_FACTORS`, `GRID_INTENSITY`, `SECTOR_BENCHMARKS`, `CARBON_PRICES`, `NGFS_SCENARIOS`,
`TEMPERATURE_PATHWAYS`) and a `MOCK_PORTFOLIO` of ~150 holdings joined to `SECURITY_UNIVERSE`, and it
computes genuine PCAF-style financed-emissions and WACI metrics. The `sr()` PRNG is used only as a
**fallback** where a security lacks a real field. The guide is accurate.

### 7.1 What the module computes

Per holding (real field first, `range()` fallback second), it builds Scope 1/2/3, financed emissions,
and a WACI contribution:

```js
s1 = sec.scope1 || round(range(1000, 5e6, seed))       // fallback only if missing
total = s1 + s2 + s3
intensity   = sec.carbonIntensity || total/(revenueBn·1e6)·1e6       // tCO2e/$M revenue
waci_contrib= weight/100 · intensity                                  // PCAF WACI attribution
financedEm  = round(total · weight/100)                               // financed (attributed) emissions
carbonCostEU= financedEm · 65.2 / 1000                                // €65.2/t EU ETS × financed
```

Portfolio aggregates (over the built rows `d`):

```js
totalGHG   = totalS1 + totalS2 + totalS3
waci       = Σ waci_contrib                                    // Σ weightᵢ·intensityᵢ
avgTemp    = Σ tempᵢ·weightᵢ / max(totalWeight, 1)             // weighted implied temp
carbonIntensity = totalGHG/(totalMktVal·1e6)·1e6              // portfolio intensity
carbonFootprint = financedTotal / totalMktVal                 // tCO2e/$M invested
budgetUsedPct   = financedTotal/((TEMPERATURE_PATHWAYS.budgets_GtCO2['1.5C_50pct']·1e9)·0.00001)·100
```

### 7.2 Parameterisation / provenance

| Element | Value / source | Provenance |
|---|---|---|
| `EMISSION_FACTORS`, `GRID_INTENSITY` | imported `referenceData` | Public factor tables (platform reference layer) |
| `TEMPERATURE_PATHWAYS.budgets_GtCO2['1.5C_50pct']` | imported | IPCC AR6 remaining carbon budget |
| `NGFS_SCENARIOS`, `SECTOR_BENCHMARKS` | imported | NGFS Phase IV; sector intensity benchmarks |
| EU ETS carbon price | €65.2/t | Hard-coded (matches CARBON_PRICES-era EU ETS) |
| Avoided-emissions factor | `totalGHG × 0.08` | Hard-coded 8% heuristic |
| `MOCK_PORTFOLIO` / `SECURITY_UNIVERSE` | imported | Platform demo portfolio + security master |
| `range()`/`pick()` fallbacks | `sr()`-seeded | Only used where a security field is null |
| DQS | `rangeInt(1,5)` | PCAF data-quality score (synthetic here) |

### 7.3 Calculation walkthrough

1. `buildPortfolioEmissions` joins the first 150 `MOCK_PORTFOLIO` holdings to `SECURITY_UNIVERSE`,
   taking real Scope 1/2/3, weight, market value, intensity, temperature and SBTi where present,
   and `range()`-filling only the gaps.
2. WACI contribution per holding = `weight% × intensity`; portfolio WACI = Σ contributions.
3. Financed emissions per holding = `total × weight%`; portfolio financed total = Σ.
4. Regulatory-mapping tab cross-walks each metric to GHG Protocol / CSRD E1 / SFDR PAI / TCFD / CDP /
   SEC / UK SDR references.
5. Pathway tab compares financed emissions to the 1.5 °C carbon budget (`budgetUsedPct`).
6. Quarterly trend applies `range(−0.12..0.05)` seasonal noise to each scope for a 12-period series.

### 7.4 Worked example (one holding)

Holding with `s1=2.0M, s2=0.8M, s3=12.0M tCO2e`, `weight=1.5%`, `revenueBn=$8B`, `mktVal=$400M`:

| Step | Computation | Result |
|---|---|---|
| Total emissions | 2.0M + 0.8M + 12.0M | 14.8M tCO2e |
| Intensity | 14.8e6/(8·1e6)·1e6 / 1e6 ... = total/(revenueBn) | **1,850 tCO2e/$M rev** |
| WACI contribution | 1.5/100 × 1850 | **27.75** |
| Financed emissions | 14.8M × 1.5/100 | **222,000 tCO2e** |
| EU carbon cost | 222,000 × 65.2 / 1000 | **€14,474k ≈ €14.5M** |

Portfolio WACI = Σ of each holding's 27.75-type contribution; implied temperature = weight-weighted
mean of holding `temp` scores.

### 7.5 Companion analytics on the page

- **Scope waterfall** — S1/S2/S3 decomposition with market- vs location-based Scope 2.
- **Regulatory mapping** — GHG Protocol chapter / CSRD DR / SFDR PAI / TCFD / CDP / SEC / UK SDR
  cross-walk per data point with DQS.
- **Carbon pricing & cost** — financed emissions × EU ETS price.
- **Pathway & budget** — financed emissions vs 1.5 °C remaining budget; SBTi on-track %.
- **Alerts** — SBTi off-track, CBAM deadline, etc.

### 7.6 Data provenance & limitations

- **Hybrid data**: real reference-data layer + `MOCK_PORTFOLIO`/`SECURITY_UNIVERSE`, with `sr()`
  fallbacks only for missing security fields — flag any holding relying on the fallback path.
- The EU ETS price (€65.2/t) and the 8% avoided-emissions factor are hard-coded, not live.
- DQS is synthetic (`rangeInt(1,5)`) rather than derived from actual PCAF data-quality tiers.
- `budgetUsedPct` scaling includes a `0.00001` normalising constant whose units should be verified in
  production (portfolio-share-of-budget semantics).

**Framework alignment:** *PCAF Global GHG Standard* — WACI (`Σ weightᵢ·intensityᵢ`) and financed
emissions (`total × weight%`, attribution) follow PCAF's attribution methodology; DQS mirrors PCAF's
1–5 data-quality hierarchy. *GHG Protocol* — Scope 1/2/3 with market- vs location-based Scope 2 per
the Scope 2 Guidance. *TCFD Metrics & Targets* — WACI and implied temperature are TCFD-recommended
portfolio metrics. *IPCC AR6* — the 1.5 °C carbon budget anchors the pathway tab. Because the core
financed-emissions and WACI maths are genuine PCAF formulas over a real reference-data layer, no
production model specification is required for this module.
