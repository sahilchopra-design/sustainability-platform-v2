# Paris Alignment Score
**Module ID:** `paris-alignment` · **Route:** `/paris-alignment` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Portfolio-level Paris Agreement 1.5°C alignment assessment using Implied Temperature Rise (ITR) methodology. Includes sector decomposition, forward emissions trajectory, and engagement prioritisation.

> **Business value:** The core metric for institutional investors to demonstrate Paris Agreement alignment. ITR enables "temperature-tagging" of portfolios and is increasingly required by regulators, clients, and net-zero alliances including NZAM and GFANZ.

**How an analyst works this module:**
- Dashboard shows portfolio ITR with peer benchmark
- Sector Decomposition breaks ITR contribution by GICS sector
- Company Drill-Down ranks holdings by ITR with engagement flags
- Trajectory compares portfolio emissions path to 1.5°C budget
- Engagement List identifies highest ITR companies for stewardship

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CARBON_BUDGET`, `COUNTRY_PARIS`, `Card`, `HISTORICAL_EMISSIONS`, `ISO2_TO_ISO3`, `KpiCard`, `LS_PORTFOLIO`, `NZ_QUALITY_TIERS`, `SECTOR_BENCHMARKS`, `STOCKTAKE_FINDINGS`, `Section`, `SortTh`, `TABS`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COUNTRY_PARIS` | 31 | `country`, `ndc_target`, `progress_pct`, `on_track`, `gap_pct`, `policies_sufficient`, `net_zero`, `nz_in_law`, `cumulative_gt`, `emissions_mt` |
| `STOCKTAKE_FINDINGS` | 7 | `finding`, `gap_severity`, `score` |
| `HISTORICAL_EMISSIONS` | 11 | `cumulative_gt`, `share_pct` |
| `NZ_QUALITY_TIERS` | 5 | `score`, `color`, `desc` |
| `SECTOR_BENCHMARKS` | 11 | `itr_1_5`, `itr_2_0`, `required_reduction` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `_CDP_PA` | `Object.fromEntries((CDP_COMPANY_EMISSIONS\|\|[]).map(c=>[(c.name\|\|'').toLowerCase(),c]));` |
| `enriched` | `useMemo(() => { return holdings.map((h, i) => { const s = seed(i + 7);` |
| `annualEmissions` | `cdp ? (cdp.scope1_2_total_mtco2e\|\|0)*1e6 : ((h.scope1_co2e \|\| 50000) + (h.scope2_co2e \|\| 20000));` |
| `budgetUsed` | `+(20 + s * 60).toFixed(1);` |
| `nzYear` | `h.carbon_neutral_target_year \|\| (sbti?.y) \|\| (s > 0.3 ? (2035 + Math.floor(s * 25)) : null);` |
| `nzQuality` | `nzYear && hasSBTi ? (s > 0.7 ? 'Law-Backed' : 'SBTi-Verified') : nzYear ? 'Pledged' : 'None';` |
| `budgetShare` | `+(annualEmissions / 40e9 * 100).toFixed(6);` |
| `_wDenom` | `enriched.reduce((s, e) => s + (e.weight \|\| 1/n), 0);` |
| `wtdITR` | `_wDenom ? enriched.reduce((s, e) => s + e.itr * (e.weight \|\| 1/n), 0) / _wDenom : 0;` |
| `sbtiPct` | `enriched.filter(e => e.hasSBTi).length / n * 100;` |
| `nzPct` | `enriched.filter(e => e.nzYear).length / n * 100;` |
| `totalEmissions` | `enriched.reduce((s, e) => s + e.annualEmissions, 0);` |
| `portfolioBudgetShare` | `totalEmissions / 40e9 * 100;` |
| `yearsUntilExhaust` | `Math.max(0, Math.round(CARBON_BUDGET.remaining_1_5.gt / (totalEmissions / 1e9)));` |
| `ndcAligned` | `enriched.filter(e => e.ndcAligned).length / n * 100;` |
| `sectors` | `useMemo(() => ['All', ...new Set(enriched.map(e => e.sector))].sort(), [enriched]);` |
| `countries` | `useMemo(() => ['All', ...new Set(enriched.map(e => e.country))].sort(), [enriched]);` |
| `current` | `Math.max(0, CARBON_BUDGET.remaining_1_5.gt - t * CARBON_BUDGET.current_annual_global);` |
| `moderate` | `Math.max(0, CARBON_BUDGET.remaining_1_5.gt - t * CARBON_BUDGET.current_annual_global * Math.pow(0.958, t));` |
| `paris` | `Math.max(0, CARBON_BUDGET.remaining_1_5.gt - t * CARBON_BUDGET.current_annual_global * Math.pow(0.924, t));` |
| `sectorAlignment` | `useMemo(() => { return SECTOR_BENCHMARKS.map(sb => { const sectorHoldings = enriched.filter(e => e.sector === sb.sector);` |
| `avgITR` | `sectorHoldings.length ? sectorHoldings.reduce((s, e) => s + e.itr, 0) / sectorHoldings.length : 2.5;` |
| `nzDistribution` | `useMemo(() => { return NZ_QUALITY_TIERS.map(t => ({ ...t, count: enriched.filter(e => e.nzQuality === t.tier).length }));` |
| `engagementPriority` | `useMemo(() => { return [...enriched].filter(e => e.itr > 2.0).sort((a, b) => b.itr - a.itr).slice(0, 15);` |
| `rows` | `enriched.map(e => [e.company_name \|\| e.name, e.sector, e.country, e.itr, e.budgetUsed, e.hasSBTi, e.nzYear \|\| 'N/A', e.onTrack15 ? 'Yes' : 'No', e.nzQuality, Math.round(e.annualEmissions)]);` |
| `csv` | `[header, ...rows].map(r => r.join(',')).join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);` |
| `data` | `{ generated: new Date().toISOString(), carbonBudget: CARBON_BUDGET, aggregates: agg, holdingsCount: enriched.length, holdings: enriched.map(e => ({ name: e.company_name \|\| e.name, itr: e.itr, budgetUsed: e.budgetUsed, ha` |
| `totalE` | `enriched.reduce((s, e) => s + e.annualEmissions, 0);` |
| `yrs` | `Math.round(b.gt * 1e9 / totalE);` |
| `pct` | `Math.min(100, (2024 - 1850) / (2024 - 1850 + yrs) * 100);` |
| `gap` | `+(h.itr - 1.5).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRY_PARIS`, `HISTORICAL_EMISSIONS`, `NZ_QUALITY_TIERS`, `SECTOR_BENCHMARKS`, `STOCKTAKE_FINDINGS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio ITR | `AUM-weighted` | PACTA | Current portfolio temperature alignment |
| 1.5°C Aligned % | `Holdings with ITR ≤ 1.5` | Screening | Fraction of portfolio aligned to Paris 1.5°C |
| High-Carbon Exposure | `AUM in ITR > 3°C companies` | Portfolio data | Exposure to severely misaligned companies |
- **Company emissions data** → ITR calculation → **Portfolio temperature score**
- **Carbon budget allocation** → Sector pathway → **Alignment gap**
- **Engagement register** → Escalation trigger → **Stewardship actions**

## 5 · Intermediate Transformation Logic
**Methodology:** Implied Temperature Rise (ITR)
**Headline formula:** `ITR = GlobalBudget_remaining × (PortfolioEmissions / GlobalEmissions) / PortfolioShare_globalGDP`

ITR measures the temperature outcome implied if all companies emitted at the same rate as the portfolio company. Aggregation: AUM-weighted average ITR across holdings. 1.5°C aligned = ITR ≤ 1.5.

**Standards:** ['PACTA 2.0', 'CA100+ Net Zero Benchmark', 'Paris Agreement Art. 2.1(a)']
**Reference documents:** PACTA Methodology 2.0; CA100+ Net Zero Company Benchmark; Paris Agreement Article 2.1(a); IPCC AR6 Carbon Budgets

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Compute PACTA-style ITR, not just SBTi lookup + fallback (analytics ladder: rung 2 → 3)

**What.** §7's partial mismatch: the guide states a PACTA budget-share ITR (`ITR = GlobalBudget_remaining × (PortfolioEmissions/GlobalEmissions) / PortfolioShare_globalGDP`), but the code assigns ITR per holding from a real SBTi commitment-tier lookup (`sbti-companies.json`: 1.5C→1.5, WB2C→1.7, Committed→1.8) with a sector-benchmark-bounded synthetic fallback where no SBTi match exists. Notably, two previously-logged P0/P1 bugs are already fixed (`onTrack15 = itr <= 1.5` correct, `wtdITR` zero-guarded). The budget-share numbers the guide's formula needs *are* computed for the Carbon Budget visual — just not combined into a per-holding ITR. Evolution A closes that gap.

**How.** (1) Implement the documented budget-share ITR as an alternative/complementary method to the SBTi lookup: for holdings without an SBTi commitment, compute ITR from the company's emissions trajectory against its sector carbon budget (the SBTi Temperature Scoring methodology and PACTA 2.0 named in §5) rather than the `1.4 + seed×2.6` synthetic fallback — removing the seeded component. (2) Reconcile the two methods, reporting which holdings use SBTi-lookup vs computed ITR (a provenance field). (3) Ground portfolio emissions in real PCAF/reported data (shared with the financed-emissions modules) so the Carbon Budget trajectory reflects real holdings.

**Prerequisites.** Sector carbon budgets and company emission trajectories (SBTi/PACTA inputs); the SBTi lookup already works — extend, don't replace it. **Acceptance:** holdings without SBTi commitments get a computed budget-share ITR, not a seeded fallback; the method (lookup vs computed) is visible per holding; portfolio ITR reproduces from real emissions.

### 9.2 Evolution B — Portfolio-alignment & stewardship copilot (LLM tier 2)

**What.** A copilot for the institutional-investor users §1 targets: "what's my portfolio ITR and is it Paris-aligned?", "which sectors contribute most to overshoot?", "rank my top-10 engagement targets by ITR", "how does dropping the worst holding change portfolio ITR?" — executed against the ITR engine, decomposing the AUM-weighted portfolio ITR into per-holding and per-sector contributions.

**How.** Tool calls to endpoints wrapping the ITR assignment, sector decomposition, and weighted-portfolio-ITR functions; system prompt from this Atlas page's §5/§7.1 and the PACTA 2.0 / CA100+ / Paris Article 2.1(a) references named in §5. The engagement list (highest-ITR holdings for stewardship, §1) is a tool call returning ranked holdings; the "drop the worst holding" what-if is a recomputation. Fabrication validator matches every temperature figure to a tool response; the copilot must distinguish SBTi-lookup ITRs (real commitment data) from computed/fallback ITRs in provenance, and convey that ITR is model-dependent and not comparable across methodologies.

**Prerequisites.** Compute endpoints; Evolution A for computed ITR (the SBTi-lookup path works today). **Acceptance:** every ITR figure traces to a tool call with method provenance; sector contributions sum to portfolio ITR; the engagement ranking reflects real ITRs; the copilot flags method-dependence.