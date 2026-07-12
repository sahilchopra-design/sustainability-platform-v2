## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** MODULE_GUIDES states the headline formula
> `ITR = GlobalBudget_remaining × (PortfolioEmissions/GlobalEmissions) / PortfolioShare_globalGDP` —
> a PACTA-style budget-share calculation. **The code does not compute ITR this way.** Instead, ITR
> is assigned per holding from a **real SBTi commitment-tier lookup** (`sbti-companies.json`) where
> available, falling back to a **sector-benchmark-bounded synthetic draw**. The underlying carbon
> budget and portfolio-emissions-share numbers the guide's formula would need (§7.3) *are* computed
> elsewhere on the page for the "Carbon Budget" visual, just not combined into a per-holding ITR the
> way the guide describes. Sections below document the code as it behaves; the P0/P1 bugs
> previously logged in project memory (1.8°C `onTrack15` threshold, `wtdITR` divide-by-zero) have
> both been **fixed** in the current source — `onTrack15 = itr <= 1.5` (correct Paris Article 2
> threshold) and `wtdITR` is guarded by `_wDenom ? … : 0`.

### 7.1 What the module computes

For each holding, an Implied Temperature Rise is assigned via a three-tier lookup, using real data
where it exists:

```js
sbti = SBTI_LOOKUP[company_name]                       // real SBTi database match
if (sbti)      itr = sbti.commitment==='1.5C' ? 1.5
                    : sbti.commitment==='WB2C' ? 1.7
                    : sbti.status==='Committed' ? 1.8
                    : sectorBenchmarkTemp
else           itr = min(sectorBenchmarkTemp, 1.4 + seed×2.6)   // bounded synthetic fallback

onTrack15 = itr <= 1.5        // Paris Agreement Art. 2.1(a) 1.5°C threshold — correct
onTrack20 = itr <= 2.2
wtdITR    = Σ(itr × weight) / Σ(weight)     // AUM-weighted portfolio ITR, zero-guarded
```

Emissions come from **CDP_COMPANY_EMISSIONS** (`_CDP_PA` lookup by lowercased company name) when a
match exists — real reported Scope 1+2 data — otherwise a fallback of `(scope1_co2e||50000) +
(scope2_co2e||20000)` synthetic defaults.

### 7.2 Parameterisation

| Field | Value | Provenance |
|---|---|---|
| SBTi 1.5°C commitment → ITR | 1.5 | Direct from real `sbti-companies.json` commitment field |
| SBTi Well-Below-2°C → ITR | 1.7 | Direct from real SBTi data |
| SBTi "Committed" (not yet validated) → ITR | 1.8 | Real SBTi status, heuristic ITR assignment (SBTi itself does not publish an ITR number for "Committed"-only status — this is the module's own convention) |
| Sector benchmark table (`SECTOR_BENCHMARKS`, 11 rows) | `itr_1_5`, `itr_2_0`, `required_reduction` per GICS sector | Seed table; all sectors set `itr_1_5=1.5`/`itr_2_0=2.0` uniformly — i.e. the *benchmark bounds* don't vary by sector even though `required_reduction` does |
| Fallback ITR range | 1.4–4.0 (`1.4 + s×2.6`) | Synthetic demo value bounded by sector benchmark when available |
| Global carbon budget | 420 GtCO₂ remaining (1.5°C), 1,150 GtCO₂ (2.0°C) | **Real: IPCC AR6 WG1 SPM Table SPM.2**, 50th-percentile 2020-baseline remaining budget, cited inline in source comment |
| Current annual global emissions | 40 GtCO₂/yr | Real order-of-magnitude (global CO₂ ~37–40 Gt/yr) |

### 7.3 Calculation walkthrough

1. **Enrichment** (`enriched`): each holding is matched against SBTi and CDP data by lowercased
   name; `annualEmissions` prefers CDP `scope1_2_total_mtco2e×1e6` over holding-supplied or
   synthetic-default Scope 1/2 sums.
2. **Budget share**: `budgetShare = annualEmissions / 40e9 × 100` expresses one holding's emissions
   as a fraction of the current global annual budget — this *is* a piece of the guide's stated
   formula, but it feeds portfolio-level KPIs (`portfolioBudgetShare`, `yearsUntilExhaust =
   remaining_1.5.gt / (totalEmissions/1e9)`), not the per-holding ITR.
3. **Net-zero quality tiering**: `nzQuality` = 'Law-Backed' (SBTi + high synthetic confidence),
   'SBTi-Verified', 'Pledged' (has a target year but no SBTi backing), or 'None' — a categorical
   trust-tier over the net-zero year field.
4. **Sector alignment / engagement priority**: `sectorAlignment` averages ITR per sector against
   `SECTOR_BENCHMARKS`; `engagementPriority` filters holdings with `itr > 2.0`, sorted descending —
   the standard "escalate the worst offenders" stewardship pattern.
5. **Carbon budget trajectory chart**: three depletion curves (`current`, `moderate` at 4.2%/yr
   reduction, `paris` at 7.6%/yr reduction) trace `remaining_1.5.gt − t×annual×decay^t` — these
   decay rates (0.958, 0.924) are `1 − annual_reduction_needed` from `CARBON_BUDGET`, i.e. genuinely
   derived from the IPCC-sourced reduction-rate constants, not arbitrary.

### 7.4 Worked example

A holding matched to SBTi with `commitment='1.5C'`, CDP-reported `scope1_2_total_mtco2e = 2.4`:

| Step | Computation | Result |
|---|---|---|
| ITR | SBTi lookup, 1.5C commitment | **1.5 °C** |
| annualEmissions | 2.4 × 1e6 | 2,400,000 tCO₂e |
| onTrack15 | 1.5 ≤ 1.5 | **true** |
| Budget share | 2,400,000 / 40e9 × 100 | 0.006% of global annual budget |

A second, unmatched holding with `sectorHash → sectorBenchmarkTemp=2.0`, seed `s=0.62`:

| Step | Computation | Result |
|---|---|---|
| ITR | min(2.0, 1.4+0.62×2.6) | min(2.0, 3.01) = **2.0 °C** |
| onTrack15 | 2.0 ≤ 1.5 | **false** |
| onTrack20 | 2.0 ≤ 2.2 | **true** |

### 7.5 Companion analytics

- **Country NDC table** (`COUNTRY_PARIS`, 31 rows) — real 2030 NDC targets, progress %, net-zero
  years, and law-backed status for each country, used in a separate country-level tracker (distinct
  from the company-level ITR table).
- **COP28 Global Stocktake findings** (`STOCKTAKE_FINDINGS`, 7 rows) — real pillar-level scoring
  narrative from the actual COP28 outcome text, descriptive not computed.
- **Historical cumulative emissions** (`HISTORICAL_EMISSIONS`, 11 rows) — real top-10 historical
  cumulative-emissions shares (US 19.9%, China 11.1%, etc.), consistent with published Carbon Brief/
  Our World in Data country cumulative-emissions rankings.

### 7.6 Data provenance & limitations

- **Real SBTi commitment data and real CDP emissions data are used where matches exist** — this
  module is materially better-grounded than most peers in this batch, which typically use pure
  seeded PRNG throughout.
- Unmatched holdings still fall back to `1.4 + seed×2.6`, a bounded random ITR — roughly half the
  portfolio in a typical demo dataset will show this fallback rather than a data-grounded number.
- `SECTOR_BENCHMARKS.itr_1_5`/`itr_2_0` are uniform 1.5/2.0 across all 11 sectors, meaning the
  sector "benchmark" only differentiates via `required_reduction`, not via a differentiated
  temperature pathway per sector (real PACTA sector pathways do differ, e.g. steel/cement 1.5°C
  trajectories are shaped differently from power-sector trajectories).

**Framework alignment:** PACTA 2.0 — cited but not implemented as the guide describes (no
sector-production-alignment trajectory matching); CA100+ Net Zero Company Benchmark — the
Law-Backed/SBTi-Verified/Pledged/None tiering is a reasonable proxy for CA100+'s disclosure-quality
assessment; Paris Agreement Art. 2.1(a) 1.5°C threshold — correctly implemented at `itr <= 1.5`;
IPCC AR6 carbon budgets — the 420/1,150 Gt figures are the real SPM Table SPM.2 values, correctly
cited and used in the depletion-trajectory chart.
