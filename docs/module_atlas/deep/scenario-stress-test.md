## 7 · Methodology Deep Dive

This is the most methodologically sophisticated module in this deep-dive batch. Unlike most peers,
it implements genuine empirical VaR/CVaR statistics, a coherent transition/physical decomposition,
and a real (if simplified) regulatory capital buffer test — layered over a synthetic 50-holding
portfolio and 8-scenario universe.

### 7.1 What the module computes

For each of 8 scenarios, portfolio losses are the **cross-sectional distribution of per-holding
losses** (50 holdings, one realised loss each under the scenario) rather than a time-series of
portfolio returns — an empirical/historical-simulation-style VaR using the holding population as
the sample:

```
losses          = PORTFOLIO.map(h => h.scenImpacts[scenario].loss_pct x h.market_value / 100)
totalLoss       = Sum(losses)
sortedLosses    = sort(losses)
VaR95           = sortedLosses[floor(n x 0.95)]        // 95th percentile single-holding loss
VaR99           = sortedLosses[floor(n x 0.99)]
ES95            = mean(sortedLosses[floor(n x 0.95):])  // Expected Shortfall = mean of tail beyond VaR95
capital_impact_pct = totalLoss/TOTAL_MV x 100 x 1.25 + noise    // regulatory capital multiplier
CET1_post       = 12.5 - capital_impact_pct              // stressed capital ratio
buffer_vs_8pct  = CET1_post - 8.0                        // Basel III minimum CET1 buffer
buffer_vs_10.5pct = CET1_post - 10.5                      // + capital conservation buffer
```
This VaR95/VaR99/ES95 methodology is **textbook-correct** for an empirical/historical VaR
calculation (sort realisations, take the percentile, average the tail for ES) — the only
simplification is that the "sample" is 50 cross-sectional holdings under one scenario realisation
rather than a full time series or Monte Carlo path ensemble (partially addressed separately by the
Monte Carlo reverse-stress-test tab, §7.5).

### 7.2 Parameterisation

| Scenario | Warming | Carbon price 2050 | GDP impact | Physical damage | Transition cost | Framework |
|---|---|---|---|---|---|---|
| Net Zero 2050 | 1.5C | $420/t | -2.1% | 3.2% | 4.8% | NGFS |
| Below 2C | 1.7C | $300/t | -3.0% | 4.5% | 3.5% | NGFS |
| Divergent Net Zero | 1.5C | $500/t | -4.5% | 3.8% | 6.2% | NGFS |
| Delayed Transition | 1.8C | $450/t | -5.8% | 5.5% | 7.1% | NGFS |
| NDCs | 2.5C | $80/t | -7.2% | 9.8% | 2.1% | NGFS |
| Current Policies | 3.0C | $25/t | -10.5% | 14.2% | 1.0% | NGFS |
| Policy Shock (custom) | 1.6C | $500/t | -6.0% | 3.0% | 9.5% | Custom |
| Tech Disruption (custom) | 1.4C | $120/t | -1.5% | 2.8% | 3.0% | Custom |

This table is directionally excellent NGFS characterisation: orderly 1.5C scenarios show low
physical damage/high transition cost; Current Policies correctly shows the **worst** GDP impact
(-10.5%) and highest physical damage (14.2%) despite the "lowest" nominal warming-related policy
effort — matching the real NGFS insight that hot-house-world scenarios are worse for the economy
overall than orderly transition, even though transition costs are individually higher in orderly
scenarios.

| Constant | Value | Provenance |
|---|---|---|
| `transExp` by sector tercile | 0.70 (Energy/Materials/Industrials), 0.30 (mid sectors), 0.15 (defensive) | Reasonable GICS-based transition-exposure tiering |
| `physExp` by sector tercile | 0.60 (Real Estate/Oil&Gas/Metals&Mining/Chemicals/Transport), 0.25 (Utilities-adjacent), 0.40 (remainder) | Plausible physical-exposure tiering, though the specific tercile boundaries are author judgement |
| Capital multiplier | 1.25x portfolio loss % | Simplified RWA-scaling proxy, not a real Basel risk-weighted-asset calculation |
| Starting CET1 | 12.5% | Reasonable illustrative starting capital ratio for a well-capitalised bank |
| Basel minimums | 8.0% (Pillar 1 minimum) / 10.5% (+ 2.5% capital conservation buffer) | Correct real Basel III minimum CET1 thresholds |

### 7.3 Calculation walkthrough

1. `genSectorImpacts()` builds a 15-sector × 8-scenario impact matrix: `revenue_impact_pct`
   combines a sector's transition exposure (`base × 15 × transExp`, negative) with scenario
   physical damage (`× physExp × 0.5`, negative) plus small idiosyncratic noise — correctly
   signed so higher-transition-exposure sectors lose more revenue under high-carbon-price
   scenarios, and higher-physical-exposure sectors lose more under high-physical-damage scenarios.
2. `genPortfolio()` assigns each of 50 holdings to a sector, then derives per-scenario
   `loss_pct = |revenue_impact| × 0.6 + stranded_pct × 0.15 + idiosyncratic_noise` — a genuine
   composition of the sector-level transition/stranding signal plus holding-specific noise
   (`idio = sr(...)×4-2`, ±2pp).
3. `genStressResults()` (§7.1) aggregates holding-level losses into portfolio VaR/ES and splits
   the loss into `transition_share`/`physical_share` via `safeDivide` (correctly guarded against
   division by zero when `totalLoss=0`).
4. `genMacro()` produces 30-year (2025-2055) GDP growth/carbon price/inflation/unemployment/
   interest-rate paths per scenario, each interpolating linearly toward the scenario's 2050
   carbon price and physical/transition cost endpoints, with small annual noise — a reasonable
   scenario-conditioned macro trajectory, though the interpolation is linear rather than
   econometrically modelled.
5. **Monte Carlo reverse-stress-test tab**: `shock = sr(p×1000+step×7)×6-2` generates a random
   walk of shocks per simulated path; `mcSummary` aggregates final losses across paths (mean, and
   presumably percentiles) — genuine Monte Carlo path simulation, adding a time-series dimension
   the main VaR calculation lacks.
6. **Reverse stress test**: `breachScenarios` filters `STRESS_RESULTS` to scenarios where
   `portfolio_loss_pct >= reverseThreshold` (user-set, default 20%) — correctly implements the
   reverse-stress-test concept of "which scenarios breach an unacceptable loss threshold."

### 7.4 Worked example

Under "Current Policies" (worst GDP impact scenario), suppose the 50-holding loss distribution
sorts to `sortedLosses[47] = $18.2M` (95th percentile, `floor(50×0.95)=47`) and
`sortedLosses[49] = $24.1M` (99th percentile, `floor(50×0.99)=49`), with `totalLoss=$310M` against
`TOTAL_MV≈$12,750M` (50 holdings averaging ~$255M each):
```
portfolio_loss_pct = 310/12,750 x 100 = 2.43%
VaR95 = $18.2M, VaR99 = $24.1M
ES95  = mean(sortedLosses[47:50]) = mean($18.2M, ~$21M, $24.1M) ~= $21.1M
capital_impact_pct = 2.43 x 1.25 + noise ~= 3.04% + 0.8% = 3.84%
CET1_post = 12.5 - 3.84 = 8.66%
buffer_vs_10.5% = 8.66 - 10.5 = -1.84pp   -> breaches the capital conservation buffer
buffer_vs_8%    = 8.66 - 8.0  = +0.66pp   -> still above the hard Pillar 1 minimum
```
This is a realistic-looking regulatory capital stress narrative: the bank stays solvent (above the
8% hard floor) but breaches its capital conservation buffer, triggering distribution restrictions
under Basel III — a genuinely useful illustration of how climate stress could bind on bank capital
even without triggering outright insolvency.

### 7.5 Data provenance & limitations

- VaR95/VaR99/ES95 are correctly computed empirical statistics, and the transition/physical
  decomposition is internally consistent (sector exposure tiers drive both channels coherently).
- All underlying data (50 holdings, 15-sector impact matrix, macro paths) is synthetic
  (`sr()`-seeded); the *methodology* is sound but the *inputs* are not calibrated to a real
  portfolio or real NGFS model output.
- `capital_impact_pct`'s 1.25x multiplier is an illustrative RWA-scaling proxy, not a true
  Basel risk-weighted-asset recalculation (which would require asset-class-specific risk weights
  and a full capital-adequacy waterfall).
- The empirical VaR is computed **cross-sectionally** (across 50 holdings under one scenario draw)
  rather than as a time-series/Monte-Carlo distribution of portfolio outcomes — a materially
  different (and less standard for regulatory VaR) sampling approach, though the Monte Carlo
  reverse-stress-test tab partially compensates by adding a path-simulation dimension.
- Macro trajectory interpolation is linear, not derived from an actual macro-econometric model
  (e.g. NiGEM, GVAR) as real central-bank climate stress tests (ECB CST, BoE CBES) would use.

**Framework alignment:** NGFS Phase 5 scenario framework (scenario characterisation is directionally
excellent and internally consistent) · ECB Climate Stress Test 2024 / BoE CBES methodology
(transition + physical channel decomposition and capital-impact framing conceptually mirrors these
regulatory exercises) · Basel III CET1 minimum (8%) and capital conservation buffer (10.5%)
thresholds (correctly applied) · standard historical/empirical VaR and Expected Shortfall
methodology (correctly implemented, applied to a cross-sectional rather than time-series sample).
