## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide gives the standard WBGT composite formula
> (`WBGT = 0.7×T_wetbulb + 0.2×T_globe + 0.1×T_air`). **This formula is never computed.** There is no
> wet-bulb, globe, or dry-bulb temperature input anywhere in the file — `wbgt` (in the quarterly
> trend) is a synthetic value directly drawn from the seeded PRNG (`26 + quarter×0.3 + noise`), not a
> weighted composite of component temperatures. `wbgtExposureHrs` (a separate field, hours of
> exposure) is also an independent random draw.

### 7.1 What the module computes

100 synthetic companies (`genCompanies(100)`) across 10 heat-exposed sectors (Construction,
Agriculture, Mining, Military, Oil & Gas, etc.) and 20 countries, each with: `totalWorkforce`
(500–50,500), `outdoorPct` (10–80%), `outdoorWorkers = totalWorkforce × outdoorPct/100`,
`wbgtExposureHrs` (100–2,100 hrs/yr, random), `prodLossPct` (1–13%, random), `annualCostM`,
`litigationRisk` (0–100), three regulatory compliance scores (ILO/OSHA/EU, each 0–100, random,
independently drawn), `overallCompScore = mean(ILO,OSHA,EU)`, a 12-quarter `qTrend` (synthetic
`wbgt`/`incidents`/`prodLoss` series), and `regScores` across 8 named heat-stress regulations.

```js
overallCompScore = floor((iloComplianceScore + oshaComplianceScore + euComplianceScore) / 3)
engagementPriority = litigationRisk>70 ? 'Critical' : >40 ? 'High' : >20 ? 'Medium' : 'Low'
riskTier = (same thresholds as engagementPriority, applied to litigationRisk)
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `wbgtExposureHrs` | 100–2,100 hrs/yr | `sr(i·29+511)×2000+100`, synthetic, not derived from sector/climate |
| `qTrend.wbgt` | ~26–33°C (rising over 12 quarters) | `26 + quarter×0.3 + noise` — a smoothed upward trend, not a real WBGT calculation, and unrelated to `wbgtExposureHrs` or `country` |
| `prodLossPct` | 1–13% | `sr(i·37+515)×12+1`, synthetic uniform |
| `litigationRisk` | 0–100 | `sr(i·43+519)×100`, synthetic, drives `riskTier`/`engagementPriority` thresholds (>70/>40/>20) — the only genuinely tiered/thresholded field in the module |
| ILO/OSHA/EU compliance scores | 0–100 each | Independent random draws, not derived from any actual named regulation's specific requirements |

### 7.3 Calculation walkthrough

1. `topKPIs` aggregates `COMPANIES`: `totalOutdoor` (Σ outdoor workers), `criticalCount` (# with
   `riskTier==='Critical'`), `avgWBGT` (mean of `wbgtExposureHrs`, mislabelled as "WBGT" when it's
   actually exposure *hours*, a different unit than the WBGT temperature index itself),
   `avgProdLoss`.
2. `sectorBenchmarks` groups `COMPANIES` by sector for cost/loss comparison.
3. `gdpLossBySector` maps `sectorBenchmarks` to `totalCostM`/`avgLoss` per sector.
4. `regAgg` averages each of the 8 named regulations' `score` field across all 100 companies.
5. `portfolioData` sorts by `litigationRisk` descending, takes top 30, for the risk-prioritisation
   table — the only genuinely rank-ordered output in the module.
6. **`shiftOpt`** (shift-optimisation recommendation) picks between two fixed shift patterns
   (`sr(i·79+529)>0.5` coin-flip) with a random `potentialSaving` — not derived from the company's
   actual WBGT exposure pattern or productivity-loss curve.

### 7.4 Worked example

Under the guide's real WBGT formula, given illustrative component temperatures
`T_wetbulb=27°C`, `T_globe=34°C`, `T_air=32°C`:

```
WBGT = 0.7×27 + 0.2×34 + 0.1×32 = 18.9 + 6.8 + 3.2 = 28.9°C
```

At 28.9°C, per ISO 7243/ACGIH TLV guidance, heavy continuous outdoor work would already require
work/rest cycling. **None of this arithmetic exists in the code** — the closest analogue,
`qTrend.wbgt`, is generated directly as a number in the 26–33°C range without ever combining
component temperatures, so while the *displayed* number happens to fall in a plausible WBGT range,
it cannot be traced to any actual weather/humidity/radiation input and cannot respond to a change in
location, season, or climate scenario.

### 7.5 Data provenance & limitations

- **All 100 companies and every metric are synthetic** (`sr()`-seeded); no real workforce geocode,
  weather station, or NOAA/ERA5 temperature/humidity data underlies any figure, despite the guide
  citing exactly those sources.
- **The core WBGT formula the guide names is entirely absent** — this is the module's most consequential
  gap, since WBGT is the specific, standardised metric (ISO 7243) that occupational-safety regulators
  actually reference for heat-stress work/rest thresholds; a synthetic "WBGT-like" number cannot
  support a genuine ISO 7243 compliance claim.
- Compliance scores (ILO/OSHA/EU) are independent random draws with no linkage to the actual specific
  requirements of those three regulatory regimes (which differ materially — the EU Heat Directive
  proposal, OSHA's proposed rule, and ILO guidance have different trigger thresholds and coverage).

**Framework alignment:** ILO *Working on a Warmer Planet* (2019) and ISO 7243 (both named in the
guide) are **not implemented** as calculations — the module lists them as regulation names in the
static `REGULATIONS` array and scores compliance against them randomly, without encoding any of their
actual WBGT action-limit thresholds.
