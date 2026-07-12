## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch + confirmed defect.** The guide's formula is `Combined_result =
> Σ(test_i × weight_i)` across parallel regulator-specific test runs (ECB/BoE/Fed/APRA methodologies)
> — none of that multi-framework aggregation exists here. More importantly, **a real bug was found
> while grounding this section in code**: the severity multiplier used for both sector- and
> holding-level impact draws is `s.severity.length` — the **character count of the severity label
> string**, not a severity-ordered numeric scale. `'Medium'.length=6 > 'High'.length=4`, so scenarios
> labelled "Medium" severity are structurally capable of *larger* simulated impacts than scenarios
> labelled "High" severity — the exact opposite of the intended ordering.

### 7.1 What the module computes

8 scenarios (`SCENARIOS`) mixing real NGFS names (Net Zero 2050, Delayed Transition, Current
Policies, Below 2°C), real IEA names (Net Zero, Stated Policies), and 2 custom scenarios (Sudden
Carbon Tax, Physical Risk Extreme), each with a real-plausible `carbonPrice`, `tempC`, `gdpImpact`,
and a categorical `severity` (Low/Medium/High/Critical).

```
sectorImpact[scenario][sector]  = (sr(scenario.id×100 + sectorIdx×7) − 0.5) × severity.length × 4
holding.impacts[scenario]       = (sr(scenario.id×100 + holdingIdx×7) − 0.5) × 20  −  severity.length × 1.5
```

40 real-named holdings (Apple, Microsoft, JPMorgan, ExxonMobil, Shell, BHP, Tesla, NVIDIA, etc.),
each with a plausible sector, portfolio weight (0.5–3.5%), and current value ($50–550M), and one
`impact %` per scenario computed with the buggy severity term above.

### 7.2 Parameterisation

| Scenario | Real name? | `severity` label | `.length` (the bug's actual multiplier) | Intended severity rank |
|---|---|---|---|---|
| NGFS Below 2°C | Real | Low | 3 | 1 (mildest) |
| NGFS Delayed Transition | Real | High | 4 | 3 |
| NGFS Net Zero 2050 | Real | Medium | 6 | 2 |
| NGFS Current Policies | Real | Critical | 8 | 4 (worst) |
| IEA Net Zero | Real | Medium | 6 | 2 |
| IEA Stated Policies | Real | High | 4 | 3 |
| Sudden Carbon Tax | Custom | Critical | 8 | 4 |
| Physical Risk Extreme | Custom | Critical | 8 | 4 |

The `.length`-derived multiplier sequence by *label* is `Low=3 < High=4 < Medium=6 < Critical=8` —
**"Medium" (6) exceeds "High" (4)**, inverting the intended `Low<Medium<High<Critical` severity
ordering for two of the eight scenario cards.

### 7.3 Calculation walkthrough

1. **Scenario Dashboard** — KPI strip (temperature, carbon price, GDP impact, portfolio impact
   `Σ(holding.impact×weight/100)`, count "at risk" `<-10%`) plus a scenario-comparison table and two
   charts (sector impact bar, scenario-type pie).
2. **Portfolio Impact tab** — sortable/searchable 40-holding table with per-scenario impact %,
   CSV export, and a drill-down side panel showing one holding's impact across all 8 scenarios.
3. **Sector Stress tab** — `SECTOR_IMPACT` (precomputed for all 8 scenarios × 10 sectors) rendered
   as a stacked bar (first 5 sectors) and a "most vulnerable sectors" radar for the currently
   selected scenario, plus a carbon-price-vs-GDP-impact scatter across the 8 scenarios (using the
   scenarios' real, non-buggy `carbonPrice`/`gdpImpact` fields).
4. **Historical Comparison tab** — a static bar chart comparing "Climate Stress" (computed as
   `curScenario.gdpImpact×5`, an arbitrary ×5 scaling with no stated rationale) against 5 real
   historical crisis GDP/market impacts (GFC 2008 −37%, COVID 2020 −34%, Tech Bust 2000 −45%, etc.)
   — the historical figures are real reference points; the climate-scenario comparator is an ad-hoc
   scalar multiple of the scenario's own GDP-impact field.

### 7.4 Worked example — the severity-multiplier bug in numbers

Theoretical maximum |impact| for the sector-impact formula (`sr()∈[0,1]` so `|sr()−0.5|≤0.5`):

| Severity label | `.length` | Max |sectorImpact| = `0.5×length×4` |
|---|---|---|
| Low | 3 | **6.0** |
| High | 4 | **8.0** |
| Medium | 6 | **12.0** |
| Critical | 8 | **16.0** |

A "Medium"-severity scenario (max amplitude ±12.0) can swing sector impacts **50% further** than a
"High"-severity scenario (max amplitude ±8.0) purely because the word "Medium" has more characters
than the word "High" — a defect entirely orthogonal to actual climate-transition severity, and one
that would mislead any user comparing NGFS Net Zero 2050 (labelled Medium) against NGFS Delayed
Transition or IEA Stated Policies (both labelled High) using this page's sector/holding impact
figures.

### 7.5 Companion analytics

- **Scenario comparison table** — real `carbonPrice`/`tempC`/`gdpImpact` fields per scenario, all
  unaffected by the severity-length bug (only the sector/holding *impact* draws use it).
- **Temperature pathway chart** — 3 stylised 2025–2060 warming trajectories (Net Zero, Delayed,
  Current Policies) at fixed annual slopes (0.04/0.08/0.25°C per 5-yr step) — illustrative, not
  IPCC-AR6-sourced.

### 7.6 Data provenance & limitations

- **Confirmed defect:** fix `s.severity.length` to a proper ordinal map (e.g.
  `{Low:1, Medium:2, High:3, Critical:4}`) before this module's sector/holding impact figures can be
  trusted for relative-severity comparison.
- Sector- and holding-level impacts are otherwise `sr()`-fabricated, not derived from any factor
  model or the real `carbonPrice`/`tempC`/`gdpImpact` fields on the same scenario record.
- "Climate Stress" in the historical-comparison chart is an arbitrary ×5 scalar of `gdpImpact`, not a
  methodologically comparable figure to the real historical crisis impacts it's plotted alongside.

**Framework alignment:** NGFS Phase-consistent scenario names (real, correctly labelled) · IEA WEO
scenario names (real) · ECB SREP / BoE PRA SS3/19 / Fed DFAST / APRA CPG 229 (named in guide as the
multi-framework aggregation this module is supposed to orchestrate — not implemented; see the
disconnected real DFAST/CBES-style logic potentially present in
`backend/services/stress_test_orchestrator_engine.py`, not reviewed in this pass).
