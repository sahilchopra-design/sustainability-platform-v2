## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial mismatch.** The guide's formula chain —
> `StressedNAV = BaseNAV × (1+ΔLTV) × (1+ΔNOI/CapRate)`, `Stressed_CapRate = BaseCapRate+Δcap_rate`,
> `StressedValue = StressedNOI / StressedCapRate` — describes a full income-capitalisation
> revaluation. **Only the LTV term is actually implemented** (`stressedValue = portfolioValue ×
> (1 + ltv_impact/100)`); NOI, cap-rate, and vacancy impacts are displayed as standalone KPI cards
> but never combined into the stressed NAV formula. Additionally, the **20-asset portfolio table is
> scenario-invariant** — each asset's `physStress`/`transStress`/`totalImpact` is seeded once at
> module load and does not change when the user switches NGFS scenarios, even though it renders
> directly beneath the scenario selector.

### 7.1 What the module computes

**Scenario selection** drives exactly one live number:
```js
sel           = SCENARIOS.find(s => s.id === scenario)
stressedValue = portfolioValue × (1 + sel.ltv_impact / 100)      // the ONLY formula using `sel`
```
`portfolioValue = Σ PORTFOLIO[].value` (20 assets, fixed `sr()`-seeded values €20–200M each,
summing to a constant ≈€2.1Bn regardless of scenario). The other four scenario fields
(`noi_impact`, `capRate_impact`, `vacancy_impact`, `physTemp`) are read directly into KPI cards
but never enter `stressedValue` or any other computed quantity.

**Portfolio heatmap** (20 assets): `physStress = sr(i·23)×30`, `transStress = sr(i·31)×45`,
`totalImpact = −sr(i·37)×28` — three **independent per-asset seeds set once at module load**,
outside any scenario-dependent function, so they are identical whichever of the 4 NGFS scenarios
is selected.

### 7.2 Parameterisation

| Scenario | Warming | LTV impact | NOI impact | Cap rate | Vacancy Δ | Provenance |
|---|---|---|---|---|---|---|
| Net Zero 2050 | 1.5°C | −3.2% | −1.8% | +0.25% | +0.5% | Directionally consistent with NGFS orderly-transition framing (mildest impact) |
| Below 2°C (Delayed) | 1.8°C | −8.5% | −5.2% | +0.65% | +2.2% | Disorderly-transition framing — plausible magnitude escalation |
| Nationally Determined | 2.7°C | −15.0% | −9.5% | +1.10% | +4.8% | Hot-house-adjacent framing |
| Current Policies (3.5°C) | 3.5°C | −28.0% | −18.0% | +2.20% | +10.5% | Worst-case — magnitude order (−28% LTV, +10.5pp vacancy) exceeds even the ECB 2022 stress test's severe-scenario CRE losses (~10-15%), i.e. more punitive than the cited benchmark |
| `SECTOR_RISK` (6 property types) | — | — | — | — | — | Static physical/transition/EPC/flood/heat risk scores per sector, correctly ranked (Secondary Office highest transition risk 80 — EPC-exposed older stock; Logistics lowest — newer, more efficient) |

### 7.3 Calculation walkthrough

Selecting a scenario updates 5 KPI cards (Warming Pathway, LTV Impact, NOI Impact, Cap Rate Shift,
Vacancy Delta) by simple object-field lookup, and recomputes `stressedValue` from `ltv_impact`
only. The **Portfolio Heatmap tab (Tab 0)** — the only tab with asset-level granularity — does not
re-render its numbers on scenario change; a user comparing "Net Zero 2050" vs "Current Policies"
side-by-side would see identical per-asset stress figures despite the scenario banner and KPI
cards changing dramatically above the table.

### 7.4 Worked example

`portfolioValue = Σ 20 assets ≈` (illustrative, since exact `sr()` outputs require running the
code) **€2,100M** for this example. Switching from Net Zero 2050 to Current Policies:
```
NZ2050:    stressedValue = 2,100 × (1 − 0.032) = 2,100 × 0.968 = €2,032.8M   (−€67.2M)
Below2:    stressedValue = 2,100 × (1 − 0.085) = 2,100 × 0.915 = €1,921.5M   (−€178.5M)
NDC:       stressedValue = 2,100 × (1 − 0.150) = 2,100 × 0.850 = €1,785.0M   (−€315.0M)
HotHouse:  stressedValue = 2,100 × (1 − 0.280) = 2,100 × 0.720 = €1,512.0M   (−€588.0M)
```
This progression is directionally sensible (worse scenario → larger value haircut). But the
20-row table below it would show the *same* twenty `physStress`/`transStress`/`totalImpact`
values in all four cases — so an analyst drilling from the portfolio-level number into "which
assets are driving this" finds no scenario-consistent asset-level attribution.

### 7.5 Companion analytics on the page

- **Sector Risk Radar** — plots the 6 `SECTOR_RISK` property types across `physRisk`, `transRisk`,
  `epcExposure`, `floodExposure`, `heatExposure` on a single static radar (not scenario-adjusted).
- **Physical Risk / Transition Risk tabs** — further slice the same static `PORTFOLIO` and
  `SECTOR_RISK` arrays; still scenario-invariant.
- **Reporting tab** — presumably assembles the above into an export view (not scenario-computed).

### 7.6 Data provenance & limitations

- The 20-asset portfolio is entirely `sr()`-seeded and **does not respond to the scenario
  selector** — this is the most significant functional gap: the module's central use case
  (compare asset-level stress under different NGFS pathways) is not actually implemented.
- `stressedValue` implements only the LTV term of the guide's four-term formula; NOI, cap-rate
  compression, and vacancy are shown but not combined into any NAV or DSCR calculation.
- The "Current Policies" scenario's −28% LTV impact is more severe than the ECB 2022 stress test's
  published severe-scenario CRE loss range, which the guide itself cites as a benchmark
  (10–15% additional LGD) — worth reconciling if this module is meant to align with that study.

### 7.7 Framework alignment

**NGFS Climate Scenarios** — the 4-scenario framing (orderly → disorderly → hot-house) is
correctly ordered by severity and warming pathway. **TCFD Scenario Analysis Guidance** — the
LTV/NOI/cap-rate/vacancy stress-parameter set is the right set of real-estate-specific transmission
channels TCFD scenario analysis calls for, even though only one (LTV) is wired into a computed
output. **ECB Climate Stress Test (2022)** — cited as the source for the "10-15% additional LGD"
benchmark; the module's own Current Policies scenario exceeds this, which should be reconciled or
explicitly justified as a more severe internal house scenario. A full implementation should apply
`Stressed_NOI = NOI×(1+noi_impact)`, `Stressed_CapRate = CapRate+capRate_impact`,
`Stressed_Value = Stressed_NOI/Stressed_CapRate` per-asset (using each asset's own EPC/flood-zone-
adjusted sensitivity), replacing the current single portfolio-level LTV-only haircut and the
scenario-invariant per-asset table.
