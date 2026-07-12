## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formulas —
> `L&D_Economic = DirectLoss + IndirectLoss + NonEconomicLoss`,
> `DirectLoss = AssetDamage + BusinessInterruption`, and
> `ParametricPayout = max(0, (TriggerIndex − Threshold) × PayoutRate × SumInsured)` — are **not
> computed anywhere in the code**. There is no direct/indirect loss decomposition and no parametric
> insurance trigger-payout model. What the code actually implements is a static 55-country V20/LDC
> panel with `sr()`-seeded loss figures and a single real interactive feature: a temperature-scenario
> multiplier applied uniformly to economic losses. Sections below document the code as it actually
> behaves.

### 7.1 What the module computes

55 named V20/LDC (Vulnerable Twenty / Least Developed Country) nations — Bangladesh, Pakistan,
Nepal, Ethiopia, Kenya, Haiti, Maldives, Vanuatu, and 47 more real, correctly-classified vulnerable
countries — each with 10 synthetic loss/exposure metrics generated once via `sr(i×k)`:

```js
lossesEconomic        = 0.1  + sr(i*11)*9.9     // $0.1-10Bn/yr
lossesNonEconomic     = 1    + sr(i*13)*9        // 1-10 (index, unit unspecified)
climateAttributedLosses = 20 + sr(i*17)*75        // 20-95% attribution share
gcfAccess             = sr(i*19) > 0.4            // boolean GCF (Green Climate Fund) access flag
ldFundEligible        = sr(i*23) > 0.35           // boolean L&D Fund eligibility flag
adaptationDeficit     = 0.2  + sr(i*29)*7.8        // $0.2-8Bn
displacedPersons      = 0.01 + sr(i*31)*3.99       // 0.01-4M
extremeEventFrequency = 2    + sr(i*37)*28         // 2-30 events/yr
gdpLossClimate        = 0.5  + sr(i*41)*14.5        // 0.5-15% of GDP
insuranceCoverage     = 1    + sr(i*43)*49          // 1-50%
humanDevelopmentIndex = 0.3  + sr(i*7)*0.5           // 0.3-0.8 (shares seed sr(i*7) with region assignment)
```

### 7.2 The one real calculation: temperature-scenario multiplier

```js
tempMultiplier = tempScenario<=1.5 ? 1.0 : tempScenario<=2.0 ? 1.4 : tempScenario<=3.0 ? 2.1 : 3.2
```
A user-controlled slider (1.5°C–4°C in 0.5° steps) scales every displayed economic-loss figure by
this step function. This is the module's only genuinely interactive, deterministic (non-random)
calculation, applied consistently across the KPI card, Top-15-losses chart, and HDI-vs-losses
scatter.

### 7.3 Parameterisation

| Field | Provenance |
|---|---|
| 55 country names, region assignment (6 regions) | **Real** — V20 members and other LDCs correctly named and grouped |
| All 10 quantitative attributes per country | Synthetic demo values, `sr()`-seeded per country index |
| `tempMultiplier` step function (1.0/1.4/2.1/3.2 at 1.5/2.0/3.0/4.0°C) | Author-chosen scaling factors; directionally consistent with the physical expectation that loss severity accelerates super-linearly with warming, but not calibrated to a specific IPCC/NGFS damage function |
| `finMobilisation` slider ($10–400Bn) | Present in the UI but **not read by any of the code shown** in the loss/KPI calculations — appears to be a display-only or as-yet-unwired control |

### 7.4 Calculation walkthrough

- **KPIs**: `totalEconomicLoss × tempMultiplier` for the headline "$XBn/yr" figure;
  `avgGdpLoss = mean(gdpLossClimate)` (not temperature-scaled); `ldEligiblePct =
  count(ldFundEligible)/n×100`; `totalDisplaced = Σ displacedPersons` (also not temperature-scaled,
  an inconsistency — displacement risk under a hotter scenario is not modelled to increase even
  though economic loss is).
- **Top-15 Losses chart**: ranks filtered countries by `lossesEconomic`, applies `tempMultiplier` to
  each before charting.
- **HDI vs Losses scatter**: `x = humanDevelopmentIndex`, `y = lossesEconomic × tempMultiplier` — lets
  a user visually explore whether lower-HDI countries show higher climate losses; since both axes are
  independently `sr()`-seeded (HDI shares a seed with region assignment, not with losses), any visual
  pattern is coincidental rather than modelled.
- **Adaptation Deficit by Region**: `Σ adaptationDeficit` grouped by region — a straightforward sum,
  not temperature-scaled.
- **Insurance Gap chart**: `gap = 100 − insuranceCoverage` for the 15 least-covered countries — a
  correct, if trivial, complement calculation.

### 7.5 Worked example

Bangladesh (`i=0`): `lossesEconomic = 0.1 + sr(0)×9.9`. `sr(0) = frac(sin(1)×10000) = 0.7095` →
`lossesEconomic ≈ 0.1 + 0.7095×9.9 = 7.13` ($Bn/yr). At the default 1.5°C scenario
(`tempMultiplier=1.0`), the displayed figure is $7.13Bn; moving the slider to 3.0°C
(`tempMultiplier=2.1`) instantly re-displays it as $14.97Bn — a 2.1× jump with no underlying change
to the country's actual modelled vulnerability, since the multiplier is applied uniformly to all 55
countries regardless of their individual exposure profile.

### 7.6 Data provenance & limitations

- **All 55 countries' loss, displacement, adaptation-deficit, and insurance-coverage figures are
  synthetic**, generated by `sr(seed)=frac(sin(seed+1)×10⁴)` — none reflect real EM-DAT disaster-loss
  data, GCF portfolio figures, or actual insurance-penetration statistics for these countries.
- The uniform `tempMultiplier` applied identically to all 55 countries ignores that climate damage
  functions are highly heterogeneous by geography (e.g. SIDS face disproportionate sea-level-rise
  exposure vs Sahel countries facing drought) — a single scalar cannot capture this.
- `finMobilisation` slider appears cosmetic/unwired in the reviewed code path.
- No parametric insurance trigger-payout model exists despite the guide's detailed formula and the
  "Insurance Gap" tab name — the tab only shows a static coverage-complement chart.

**Framework alignment:** UNFCCC L&D Fund (COP27/28), Santiago Network, and the V20 Group are real,
correctly-referenced institutions; the country panel correctly reflects V20/LDC membership. ARC and
CCRIF parametric insurance frameworks are named in the guide but have no corresponding trigger/payout
calculation in code. The IPCC AR6 WGII attribution-science framing is referenced by the
`climateAttributedLosses` field name but the field itself is a random draw, not an attribution-study
output.
