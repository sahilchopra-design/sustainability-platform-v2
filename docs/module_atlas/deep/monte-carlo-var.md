## 7 · Methodology Deep Dive

This module's client-side engine is genuinely well-built — real Cholesky decomposition over an
11-sector GICS correlation matrix, correlated normal shocks, full portfolio revaluation per
simulation path, and proper tail statistics. It does **not**, however, call the platform's backend
`monte_carlo_engine.py` (a separate, real, Vasicek-VaR / NGFS-PD-calibrated engine) despite the guide
describing capabilities (ICAAP/ORSA regulatory submission, factor-attribution SHAP) that live only in
that unconnected backend. No mismatch blockquote is needed for the core simulation mechanics — they
match the guide closely — but the backend disconnect is a material limitation documented in §7.6.

### 7.1 What the module computes

```js
// Box-Muller (deterministic, sr()-seeded)
boxMuller() = sqrt(-2·ln(u1))·cos(2π·u2)

// Cholesky decomposition, standard algorithm, of the 11×11 SECTOR_CORRELATIONS.matrix
L[i][j] via forward substitution; L[i][i] = sqrt(matrix[i][i] − Σ_{k<j} L[i][k]²)

// Per simulation: 11 independent standard normals z, correlated via L
correlatedZ[i] = Σ_{j≤i} L[i][j] × z[j]                        // correlatedZ = L·z

// Per sector with nonzero exposure:
sectorReturn = mean_sector×horizon + vol_sector×√horizon × correlatedZ[sector]
portfolioReturn += (exposure_sector/totalExposure) × sectorReturn
portfolioLoss = −portfolioReturn × totalExposure

// Across all simulations:
VaR(level) = sortedLosses[floor(iterations×(1−level))]          // sortedLosses descending
CVaR95 = mean(sortedLosses[0 : floor(iterations×0.05)])          // worst 5% average
mean, variance, std computed via running sums; histogram via equal-width binning
```

Sector exposures are aggregated from real (or session-loaded) portfolio holdings via
`GLOBAL_COMPANY_MASTER`, mapped to one of 11 GICS-like sectors via `sectorIndex()` (with an
alias table for friendly sector names, defaulting to Financials if unmapped).

### 7.2 Parameterisation

| Structure | Values | Provenance |
|---|---|---|
| `SECTOR_CORRELATIONS.matrix` (11×11) | e.g. Energy×Materials = 0.72, Energy×Utilities = 0.68, IT×CommServices = 0.65 | Hand-calibrated correlation structure; directionally sensible (carbon-intensive sectors cluster; IT/Comm Services cluster; Health Care/Cons Staples are low-correlation defensives) — not fit to observed historical sector-return correlations |
| `SCENARIO_PARAMS` (3 scenarios: transition/physical/combined) | per-sector annual mean shocks −0.32 to +0.08, vols 0.05–0.20 | Directionally correct (Energy/Utilities/Materials hit hardest under transition; Utilities/RealEstate hit hardest under physical) — magnitudes are illustrative, not calibrated to a specific NGFS/IPCC pathway |
| `combined` scenario means | = roughly `transition + physical` per sector (e.g. Energy: −0.30 ≈ −0.25 + −0.10 with some non-additivity) | Approximates additive combination of the two risk channels, not a jointly-modelled interaction |
| Confidence levels | 95%/99%/99.9% (implicit via `varAtLevel`) | Standard regulatory VaR reporting levels |

### 7.3 Calculation walkthrough

1. **Portfolio setup** — holdings enriched via `enrichHolding()`, sector-mapped, exposures aggregated
   into an 11-bucket vector.
2. **Simulation** — for each of `iterations` runs (user-configurable, capped at 5,000 for the
   scenario-comparison sweep per line: `Math.min(baseConfig.iterations, 5000)`), draw 11 independent
   normals, correlate via `L`, compute each exposed sector's shocked return, weight by exposure share,
   sum to portfolio return, negate to get loss.
3. **Tail statistics** — `sortedLosses` (descending) indexed at `floor(N×(1−level))` for VaR; average
   of the worst 5% for CVaR95 — both standard, correctly-implemented empirical quantile estimators.
4. **Sector attribution** — `sectorVarContrib` computes each sector's marginal/component VaR
   (`marginalVar = sectorVol×zScore×exposure`; `componentVar = (exposure/totalExp)×totalVar`) — a
   real (if simplified, delta-normal-style) VaR decomposition, not a full Euler-allocation from the
   simulated distribution itself.
5. **Scenario comparison** — re-runs the full simulation for each of the 3 scenarios to produce a
   side-by-side comparison table.
6. **Export** — CSV export of histogram bins and summary statistics.

### 7.4 Worked example

Two-sector illustrative portfolio: 60% Energy, 40% Utilities exposure, `transition` scenario,
`horizon=1`. `Energy`: mean=−0.25, vol=0.15. `Utilities`: mean=−0.20, vol=0.14.
`SECTOR_CORRELATIONS.matrix[Energy][Utilities] = 0.68`. Cholesky of the 2×2 submatrix
`[[1,0.68],[0.68,1]]`: `L = [[1,0],[0.68, sqrt(1−0.68²)]] = [[1,0],[0.68, 0.733]]`.
For one draw `z=[0.5, −0.3]` (illustrative standard normals): `correlatedZ_Energy = 1×0.5 = 0.5`;
`correlatedZ_Utilities = 0.68×0.5 + 0.733×(−0.3) = 0.34 − 0.220 = 0.120`.
`Energy return = −0.25 + 0.15×0.5 = −0.175`. `Utilities return = −0.20 + 0.14×0.120 = −0.183`.
`Portfolio return = 0.6×(−0.175) + 0.4×(−0.183) = −0.105 − 0.0732 = −0.1782`.
`Loss (per $1 exposure) = +0.1782`, i.e. **17.8% loss** for this single simulated path — repeating
across thousands of paths and taking the 5th percentile produces the reported VaR95.

### 7.5 Companion analytics

- **Fairness/attribution tables** absent here (that pattern lives in `ml-risk-scorer`); this module's
  companion analytics are the sector VaR contribution table and the 3-scenario comparison, both
  genuinely computed.

### 7.6 Data provenance & limitations

- **Correlation matrix and scenario means/vols are hand-calibrated, not empirically fit** — directionally
  reasonable but should not be presented as measured from historical sector returns or NGFS model
  output without independent calibration.
- **Does not call the backend `monte_carlo_engine.py`**, which independently implements a real
  Vasicek one-factor VaR with NGFS-Phase-IV-calibrated PD via `PDAdjustmentCalculator`, Gelman-Rubin
  convergence diagnostics, and Basel Pillar 2-aligned methodology documentation. The two engines are
  methodologically different (this page: correlated-shock full-revaluation on portfolio *returns*;
  backend: Vasicek asset-value model on *credit losses*) and should not be assumed interchangeable —
  a genuine integration would need to decide which model is authoritative for which use case (market
  risk vs credit risk framing).
- Sector VaR contribution uses a simplified marginal-VaR formula rather than deriving contributions
  directly from the simulated joint distribution (e.g. via conditional expectation given the tail
  event) — acceptable as an approximation but should be labelled as such in any regulatory submission.

**Framework alignment:** BCBS Climate-related Financial Risks Principles 2021 (portfolio VaR/CVaR
framing consistent) · Glasserman *Monte Carlo Methods in Financial Engineering* (Cholesky-correlated
shock methodology is textbook-correct per Glasserman Ch. 2–3) · NGFS scenario taxonomy (transition/
physical/combined scenario framing correctly reflects NGFS's core scenario axes, though calibration
is illustrative) · ICAAP/ORSA (named in guide as the regulatory use case; this module produces the
right *type* of output — VaR/CVaR distribution — but the backend engine, not this frontend page, is
the one built to the Basel Pillar 2/Vasicek standard a real ICAAP submission would require).
