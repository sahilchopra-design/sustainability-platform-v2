## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry promises a *WHO DALY-based health
> co-benefit NPV engine* — `NPV_coBenefit = Σ_t [DALY_avoided(t) × VSL / (1+r)^t]`, country-specific
> VSLs, concentration–response functions and IPCC AR6 social-cost-of-carbon add-ons. **None of that
> exists in the code.** There is no NPV, no discounting, no VSL table, no concentration–response
> function and no user input of project profiles. What the page actually implements is a
> *descriptive air-quality exposure dashboard*: 50 synthetic cities with heuristic health-cost
> scalars, 80 synthetic companies with air-pollutant emissions and regulatory-risk scores, and a
> 10-technology abatement catalogue with cost/effectiveness/payback attributes. The guide should be
> rewritten; the sections below document the code as shipped.

### 7.1 What the module computes

Two generator functions build the entire dataset at module load, both driven by the seeded PRNG
`sr(s) = frac(sin(s+1)×10⁴)`:

**`genCities(50)`** — per city `i`:

```js
pm25 = floor(5 + s1·150)                       // 5–155 µg/m³
pm10 = floor(pm25·1.3 + s2·40)                 // coupled to PM2.5
no2  = floor(10 + s3·80);  o3 = floor(20 + s4·100)
so2  = floor(3 + sr(i·31+5)·60);  co = floor(200 + sr(i·37+9)·2000)
whoCompliance = (pm25≤15 && no2≤25 && o3≤60) ? 100 : pm25≤25 ? 75 : pm25≤50 ? 50 : pm25≤100 ? 25 : 0
popM = 0.5 + s5·25                             // population, millions
mortalityCostM = floor(pm25·popM·0.8 + s1·200) // $M
morbidityCostM = floor(mortalityCostM·0.6 + s2·100)
dalys          = floor(pm25·popM·15 + s3·5000)
prodLossPct    = pm25·0.03 + s4·1              // % productivity loss
```

**`genCompanies(80)`** — per company: `scope1AirPollutants = floor(s4·50000 + 500)` (tonnes),
`regRisk = sr(·)·100`, `abatementCostM = floor(sr(·)·200 + 5)`, `airQualityScore = floor(sr(·)·100)`,
plus a 6-way pollutant breakdown and 12-quarter emissions trend with mild upward drift
(`0.9 + qi·0.01 + noise·0.08`).

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| PM2.5 city tiering | > 100 Severe · > 50 Very Unhealthy · > 25 Unhealthy · > 15 Moderate · else Good | Loosely mirrors WHO 2021 interim targets (IT-1 = 35 annual is *not* used; the 15/25/50/100 cutpoints are demo values) |
| WHO compliance test | PM2.5 ≤ 15 **and** NO₂ ≤ 25 **and** O₃ ≤ 60 → 100 % | NB: WHO AQG 2021 annual guidelines are PM2.5 = 5, NO₂ = 10; the code's 15/25 are the WHO *24-hour* guideline levels applied as if annual |
| Mortality cost scalar | 0.8 $M per (µg/m³ × M people) | Synthetic demo value (no VSL source) |
| Morbidity ratio | 60 % of mortality cost | Synthetic demo value |
| DALY scalar | 15 DALYs per (µg/m³ × M people) | Synthetic demo value |
| Productivity loss | 0.03 %/µg/m³ PM2.5 | Synthetic demo value |
| Company compliance | regRisk > 70 Non-Compliant · > 40 At Risk · else Compliant | Demo thresholds |
| Abatement techs | 10 named (ESP, scrubbers, SCR, DPF …), cost $5–105M, effectiveness 50–90 %, payback 1–9 yrs, co-benefit 0–100 | Technology names are real control equipment; all numbers are `sr()` draws |

### 7.3 Calculation walkthrough

1. **Tab 1 — AQ Index Dashboard.** KPIs: WHO-compliant count (`whoCompliance === 100`), global mean
   PM2.5 and NO₂ (simple averages over 50 cities), Severe-city count. Charts: horizontal PM2.5 bar
   (top 25 by current sort), global pollutant-sum pie, regional averages, and a 12-quarter trend
   averaging each city's `qTrend` (built with drift `0.85 + qi·0.02 + noise·0.15`, so PM2.5 trends
   *up* ~2 %/quarter in expectation).
2. **Tab 2 — Corporate Exposure.** Sector aggregation sums `scope1AirPollutants` and averages
   `regRisk` per sector; companies sortable by emissions/risk/abatement cost.
3. **Tab 3 — Health Cost Externalities.** `healthAgg` sums mortality/morbidity $M and DALYs across
   all 50 cities and averages `prodLossPct`; per-city detail shows the four health metrics.
4. **Tab 4 — Clean Air Investment.** Aggregates the `ABATEMENTS` catalogue: green-bond-eligible
   count (Bernoulli 0.5 per tech), average payback `Σ paybackYrs / 10`, cost-vs-effectiveness
   bars. No investment cash-flow model — payback is an input attribute, not computed.

### 7.4 Worked example (city i = 0, Beijing)

Seeds: `s1 = sr(3) = 0.2073`, `s2 = sr(7) = 0.9894`, `s3 = sr(11) = 0.4634`,
`s4 = sr(17) = 0.2510`, `s5 = sr(19) = 0.9129`.

| Step | Computation | Result |
|---|---|---|
| PM2.5 | `floor(5 + 0.2073·150)` | **36 µg/m³** |
| PM10 | `floor(36·1.3 + 0.9894·40)` | **86** |
| NO₂ | `floor(10 + 0.4634·80)` | **47** |
| WHO compliance | 36 > 25 and ≤ 50 | **50 %** |
| Tier | 25 < 36 ≤ 50 | **Very Unhealthy** |
| Population | `0.5 + 0.9129·25` | **23.3 M** |
| Mortality cost | `floor(36·23.3·0.8 + 0.2073·200)` | **$712 M** |
| Morbidity cost | `floor(712·0.6 + 0.9894·100)` | **$526 M** |
| DALYs | `floor(36·23.3·15 + 0.4634·5000)` | **14,899** |
| Productivity loss | `36·0.03 + 0.2510·1` | **1.3 %** |

### 7.5 Data provenance & limitations

- **All cities, companies and abatement figures are synthetic**, generated by `sr()` at load;
  city names are real megacities but the pollutant readings attached to them are random (Beijing's
  36 µg/m³ above is a draw, not an observation).
- Health costs are single-scalar heuristics; production practice (per the guide's own references)
  would use GBD/WHO concentration–response functions, country VSLs and discounted NPV.
- The WHO compliance test conflates 24-hour and annual guideline levels and ignores PM10/SO₂/CO.
- Region assignment is positional (first 20 city slots = Asia …), not geographic lookup.
- No backend, no persistence, no cross-module wiring — the module is self-contained JSX.

### 7.6 Framework alignment

- **WHO Air Quality Guidelines 2021** — the real framework sets annual guideline levels
  (PM2.5 = 5, PM10 = 15, NO₂ = 10 µg/m³) plus four interim targets (PM2.5 IT-1…IT-4 =
  35/25/15/10); the module borrows the *concept* of guideline exceedance tiers but with
  non-standard cutpoints.
- **DALY (WHO/GBD)** — properly computed as YLL + YLD via cause-specific relative risks from
  concentration–response functions; here approximated by a linear `pm25 × pop × 15` scalar.
- **IFC Performance Standard 3** — cited by the guide (resource efficiency & pollution
  prevention); nothing in the code references it beyond the abatement-technology theme.
- **Green bond use-of-proceeds (ICMA GBP)** — the "Green Bond Eligible" flag gestures at
  clean-air project eligibility, assigned randomly rather than by criteria.
