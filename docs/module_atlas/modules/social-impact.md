# Social Impact Analytics
**Module ID:** `social-impact` · **Route:** `/social-impact` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
SDG impact measurement across portfolio companies. Covers IRIS+ metrics, impact-weighted accounts, stakeholder theory analysis, and IMP 5-dimension impact framework.

> **Business value:** Institutional investors are increasingly required to demonstrate positive real-world impact, not just ESG scores. IMP framework and IRIS+ metrics provide the structured approach to measure whether investments generate meaningful improvements in people's lives and the environment.

**How an analyst works this module:**
- Portfolio Overview shows SDG impact heat map by company
- IMP Assessment walks through 5 impact dimensions
- IRIS+ Metrics shows standard metric values per company
- Impact-Weighted P&L shows social cost/benefit in financial terms
- SROI Calculator computes social return on investment ratio

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `Card`, `IMPACT_BENCHMARKS`, `KpiCard`, `LS_KEY`, `LS_SDG_TARGETS`, `PIE_COLORS`, `SDG_FRAMEWORK`, `SDG_SECTOR_WEIGHTS`, `Section`, `SortTh`, `TABS`, `TabBar`, `UNGC_PRINCIPLES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SDG_FRAMEWORK` | 18 | `name`, `icon`, `color`, `metrics`, `sectors` |
| `UNGC_PRINCIPLES` | 11 | `area`, `principle` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `baseSeed` | `seed(idx * 17 + sdg.id * 7);` |
| `companyAction` | `Math.round(baseSeed * 35);` |
| `revenueAlign` | `Math.round(seed(idx * 13 + sdg.id * 11) * 25);` |
| `diversityBonus` | `sdg.id === 5 && (company.female_board_pct \|\| seed(idx * 31) * 40) > 30 ? 12 : 0;` |
| `raw` | `sectorBonus + companyAction + revenueAlign + sbtiBonus + diversityBonus;` |
| `enriched` | `useMemo(() => holdings.map((h, i) => {` |
| `avgScore` | `Math.round(Object.values(sdgScores).reduce((a, b) => a + b, 0) / 17);` |
| `topSDG` | `Object.entries(sdgScores).sort((a, b) => b[1] - a[1])[0];` |
| `botSDG` | `Object.entries(sdgScores).sort((a, b) => a[1] - b[1])[0];` |
| `avgRevAlign` | `Math.round(Object.values(revAlign).reduce((a, b) => a + b, 0) / 17);` |
| `allScores` | `enriched.map(e => e.avgScore);` |
| `avgAlign` | `Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);` |
| `topSDGId` | `Object.entries(sdgAgg).sort((a, b) => b[1] - a[1])[0];` |
| `botSDGId` | `Object.entries(sdgAgg).sort((a, b) => a[1] - b[1])[0];` |
| `socialScore` | `Math.round(avgAlign * 0.5 + avgRevAlign * 0.3 + sdgsAbove50 / 17 * 100 * 0.2);` |
| `dataCov` | `Math.round(enriched.filter(e => e.avgScore > 15).length / enriched.length * 100);` |
| `header` | `['Company', 'Sector', 'Avg SDG Score', 'Revenue Alignment %', ...SDG_FRAMEWORK.map(s => `SDG ${s.id}`)];` |
| `rows` | `enriched.map(e => [e.company_name \|\| e.name, e.sector \|\| e.gics_sector, e.avgScore, e.avgRevAlign, ...SDG_FRAMEWORK.map(s => e.sdgScores[s.id])]);` |
| `csv` | `[header, ...rows].map(r => r.join(',')).join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);` |
| `data` | `{ generated: new Date().toISOString(), portfolio_count: enriched.length, sdg_aggregate: kpis.sdgAgg, holdings: enriched.map(e => ({ name: e.company_name \|\| e.name, sector: e.sector \|\| e.gics_sector, sdgScores: e.sdgScore` |
| `sectorSDGMap` | `useMemo(() => { const sectors = [...new Set(enriched.map(e => e.sector \|\| e.gics_sector \|\| 'Unknown'))];` |
| `contributeHarmAgg` | `useMemo(() => { return SDG_FRAMEWORK.map(sdg => { const contrib = enriched.filter(e => e.contributeHarm[sdg.id] === 'contribute').length;` |
| `benchmarkData` | `useMemo(() => { return SDG_FRAMEWORK.map(sdg => ({ sdg: `SDG ${sdg.id}`, portfolio: kpis.sdgAgg ? kpis.sdgAgg[sdg.id] : 0, esgFundAvg: Math.round(seed(sdg.id * 41) * 25 + 35), target: sdgTargets[sdg.id] \|\| 0, }));` |
| `top3` | `Object.entries(e.sdgScores).sort((a, b) => b[1] - a[1]).slice(0, 3);` |
| `compliance` | `Math.round(seed(idx * 43 + 7) * 25 + 65);` |
| `compliant` | `Math.round(enriched.length * compliance / 100);` |
| `avg` | `Math.round(principles.reduce((s, p, j) => s + seed((j + i) * 43 + 7) * 25 + 65, 0) / principles.length);` |
| `gap` | `target > 0 ? target - current : 0;` |
| `progress` | `target > 0 ? Math.min(100, Math.round(current / target * 100)) : 0;` |
| `revContrib` | `enriched.length > 0 ? Math.round(enriched.reduce((s, e) => s + (e.revAlign[sdg.id] \|\| 0), 0) / enriched.length) : 0;` |
| `top5` | `[...SDG_FRAMEWORK].sort((a, b) => (kpis.sdgAgg?.[b.id] \|\| 0) - (kpis.sdgAgg?.[a.id] \|\| 0)).slice(0, 5);` |
| `base` | `(kpis.sdgAgg?.[sdg.id] \|\| 40) - 15 + qi * 3;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PIE_COLORS`, `SDG_FRAMEWORK`, `TABS`, `UNGC_PRINCIPLES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| IRIS+ Metrics | — | GIIN | Standardised impact measurement metrics |
| SDGs Covered | — | UN | All Sustainable Development Goals with linked metrics |
| Social Return on Investment | — | SROI Network | Monetised social value per £1 invested |
- **Company activity data** → IRIS+ metric calculation → **Impact metric values**
- **Shadow prices** → Social value monetisation → **Impact-weighted accounts**
- **Impact scores** → IMP 5-dimension → **Portfolio impact profile**

## 5 · Intermediate Transformation Logic
**Methodology:** IMP 5-dimension impact scoring
**Headline formula:** `Impact = What(25) + Who(20) + How Much(30) + Contribution(15) + Risk(10)`

IMP framework: What (outcome type, valence), Who (stakeholders affected), How Much (depth, breadth, duration), Contribution (counterfactual), Risk (impact risk). Impact-weighted accounts: monetises social impacts in financial P&L using social shadow prices.

**Standards:** ['Impact Management Project', 'GIIN IRIS+', 'ILO Social Dialogue']
**Reference documents:** Impact Management Project 5 Dimensions; GIIN IRIS+ Impact Measurement Catalogue; Harvard Business School Impact-Weighted Accounts; SROI Network Guide

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine is the **Impact Management Project (IMP)
> 5-dimension framework** — `Impact = What(25) + Who(20) + How Much(30) + Contribution(15) + Risk(10)` — plus
> IRIS+ metrics and impact-weighted accounts (shadow-price P&L monetisation). **None of this is implemented.**
> The code instead runs a **17-SDG sector-relevance scoring engine** with a different, simpler portfolio
> aggregation formula. IRIS+, impact-weighted accounts, and SROI are named in the guide's `userInteraction`
> list but have zero corresponding UI tab or calculation. Documented below as implemented.

### 7.1 What the module computes

For each of up to 30 portfolio holdings (from `localStorage` or a `GLOBAL_COMPANY_MASTER` fallback slice),
the module scores alignment against all 17 UN SDGs using a **sector-relevance matrix** (`SDG_SECTOR_WEIGHTS`,
a hand-built 11-sector × 17-SDG binary relevance table) combined with per-company synthetic signal:

```js
sectorRelevant = sdg.sectors.includes('All') || sdg.sectors.includes(company.sector)
sectorBonus    = sectorRelevant ? 20 : 0
companyAction  = round(seed(idx*17 + sdg.id*7) × 35)
revenueAlign   = round(seed(idx*13 + sdg.id*11) × 25)
sbtiBonus      = (sdg.id===13 && company.sbti_status==='Approved') ? 15 : 0        // SDG 13 = Climate Action
diversityBonus = (sdg.id===5 && femaleBoardPct>30) ? 12 : 0                        // SDG 5 = Gender Equality
SDGScore[sdg]  = clamp(sectorBonus + companyAction + revenueAlign + sbtiBonus + diversityBonus, 0, 100)
```

A second, independent function computes `revAlign[sdg]` (% of company revenue attributable to the SDG) via a
**separately seeded** draw: `relevant ? round(seed(idx*23+sdg.id*19)×30+5) : round(seed(...)×8)` — sector-
relevant SDGs get a 5–35% revenue-alignment band, non-relevant SDGs 0–8%.

### 7.2 Parameterisation

| Component | Value | Provenance |
|---|---|---|
| `SDG_SECTOR_WEIGHTS` | 11-sector × 17-SDG binary matrix | hand-authored, plausible sector-materiality mapping (e.g. Energy relevant to SDG 7/13/14/15; Health Care to SDG 3) |
| `sectorBonus` | +20 points if sector-relevant | hand-set weight |
| `companyAction` range | 0–35 | synthetic |
| `revenueAlign` range | 0–25 | synthetic |
| `sbtiBonus` | +15 for SDG 13 if `sbti_status==='Approved'` | the **one genuinely data-driven bonus** — ties to an actual company attribute rather than a pure random draw, if `sbti_status` is populated from real SBTi data elsewhere in the platform |
| `diversityBonus` | +12 for SDG 5 if female board % > 30 | similarly data-driven if `female_board_pct` is populated; otherwise falls back to `seed(idx*31)×40` |
| `IMPACT_BENCHMARKS` (jobs/patients/GW/water/hectares per $Bn revenue by sector) | hand-set constants (e.g. 850 jobs/$Bn revenue, 12,000 patients/$Bn healthcare revenue) | plausible order-of-magnitude figures, **defined but never referenced in any rendered calculation** in the code read |

### 7.3 Calculation walkthrough

- **Per-holding aggregation**: `avgScore` = mean of the 17 `sdgScores`; `topSDG`/`botSDG` = highest/lowest-
  scoring SDG; `avgRevAlign` = mean of the 17 `revAlign` values; `contributeHarm[sdg]` = `'contribute'` if
  score ≥ 40 else `'harm'` — a simple threshold-based SDG contribution/harm classifier (loosely echoing the
  IMP framework's "Contribution" dimension, but as a binary threshold, not IMP's contribution taxonomy).
- **Portfolio KPIs** (`kpis`): `sdgAgg[sdg]` = mean score per SDG across holdings; `avgAlign` = mean of
  per-holding `avgScore`; `sdgsAbove50` = count of SDGs with portfolio-mean score ≥ 50;
  ```
  socialScore = round(avgAlign×0.5 + avgRevAlign×0.3 + (sdgsAbove50/17×100)×0.2)
  ```
  This is the module's actual headline composite — **not** the guide's IMP 5-dimension formula.
- **Heatmap tab**: renders `sdgAgg` per SDG, filterable by a minimum-score threshold.
- **UNGC Compliance tab**: cross-references the 10 UN Global Compact principles descriptively (no scoring
  tied to holdings).
- **Targets & Benchmark tab**: lets users set per-SDG portfolio targets (persisted to `localStorage`) and
  compares current `sdgAgg` against them — the only genuinely interactive/stateful calculation in the module.

### 7.4 Worked example

Holding `idx=3`, sector = "Energy" (SDG relevance: 5,7,8,13,14,15,16,17 per `SDG_SECTOR_WEIGHTS['Energy']`),
evaluating SDG 13 (Climate Action) assuming `sbti_status='Approved'`:

| Step | Computation | Result |
|---|---|---|
| `sectorRelevant` | Energy ∈ SDG13.sectors ('All') | true |
| `sectorBonus` | 20 | 20 |
| `companyAction` | `round(seed(3×17+13×7)×35)` = `round(seed(142)×35)` | 0–35 |
| `revenueAlign` | `round(seed(3×13+13×11)×25)` = `round(seed(182)×25)` | 0–25 |
| `sbtiBonus` | SDG13 + Approved | +15 |
| `diversityBonus` | not SDG5 | 0 |
| **SDG 13 score** | 20 + companyAction + revenueAlign + 15 (clamped 0-100) | up to **95** (near-ceiling given the SBTi bonus) |

If the same holding scores similarly across its other 7 relevant SDGs (~55–70 range) and near-floor
(~sectorBonus 0, small random draws, ~10–20) on the 9 non-relevant SDGs, `avgScore` across all 17 lands
roughly in the 35–45 range — illustrating how sector relevance, not actual disclosed SDG contribution data,
is the dominant driver of the headline alignment score.

### 7.5 Contribute/Harm classification

| Rule | Classification |
|---|---|
| `SDGScore[sdg] ≥ 40` | "Contribute" |
| `SDGScore[sdg] < 40` | "Harm" |

This binary 40-point cut is a simplification of the IMP framework's actual **A/B/C contribution classes**
("Acts to Avoid Harm" / "Benefits Stakeholders" / "Contributes to Solutions") and does not distinguish
between neutral/no-impact and genuinely harmful activity — both fall into "Harm" under this rule.

### 7.6 Data provenance & limitations

- **Most SDG and revenue-alignment scores are synthetic**, generated by `seed(s)=frac(sin(s+1)×10⁴)`; the
  `SDG_SECTOR_WEIGHTS` relevance matrix and `sbtiBonus`/`diversityBonus` conditional logic are the only
  components that would respond to genuinely different real company data if it were populated.
- The guide's headline **IMP 5-dimension framework and IRIS+ metric catalogue are entirely unimplemented**
  — no "What/Who/How Much/Contribution/Risk" scoring exists anywhere in the file.
- **Impact-weighted accounts / SROI** (named in the guide's `dataPoints` and `userInteraction`) have **no
  corresponding tab or calculation** — no shadow-price monetisation of any kind occurs.
- `IMPACT_BENCHMARKS` (jobs/patients/GW per $Bn revenue) is defined but dead code in the reviewed source —
  not wired into any displayed metric.

### 7.7 Framework alignment

- **UN SDG framework** — the 17-goal structure, icons, and per-goal target metrics list are faithful to the
  UN's own SDG framework; scoring against them is sector-relevance-weighted synthetic data, not measured
  outcomes.
- **UN Global Compact (UNGC) 10 Principles** — correctly enumerated (Human Rights 1-2, Labour 3-6,
  Environment 7-9, Anti-Corruption 10) and displayed descriptively; no per-holding UNGC compliance scoring
  exists despite the guide implying "UNGC Ten Principles" as a live standard.
- **GIIN IRIS+ / Harvard Impact-Weighted Accounts / SROI Network** — all referenced in the guide as sources;
  none implemented. A genuine build would need real per-company outcome data (patients served, jobs created,
  etc., ideally sourced from IRIS+-aligned issuer disclosures) to make the `IMPACT_BENCHMARKS` constants
  meaningful.

## 9 · Future Evolution

### 9.1 Evolution A — Build the IMP 5-dimension and IRIS+ engine the guide promises (analytics ladder: rung 1 → 2)

**What.** The §7 mismatch is comprehensive: the guide advertises the Impact Management Project 5-dimension framework (`What 25 + Who 20 + How Much 30 + Contribution 15 + Risk 10`), IRIS+ metrics, impact-weighted accounts (shadow-price P&L), and an SROI calculator — **none implemented**. What the code actually runs is a 17-SDG sector-relevance scorer with a hand-built 11-sector × 17-SDG relevance matrix plus synthetic per-company signal, and `IMPACT_BENCHMARKS` (jobs/patients/GW per $Bn revenue) is defined but dead. Evolution A builds the promised measurement layer, keeping the genuinely useful `SDG_SECTOR_WEIGHTS` matrix and the real `sbtiBonus`/`diversityBonus` conditionals as the two components that already respond to real data.

**How.** (1) Implement the IMP 5-dimension scorer as the headline engine: structured inputs per holding (outcome type/valence, stakeholder identity, depth/breadth/duration, counterfactual, impact risk) → the weighted 25/20/30/15/10 composite. (2) Wire `IMPACT_BENCHMARKS` into an IRIS+-style metric layer (jobs created, patients served, MWh) computed from real revenue/sector data rather than left dead. (3) Add the SROI calculator (social value ÷ investment) and a minimal impact-weighted-accounts view using published social shadow prices (Harvard IWA / SROI Network references the guide already cites). (4) Make `revAlign` (SDG revenue alignment) sourced from disclosure rather than a separate seed.

**Prerequisites.** IMP inputs require per-holding qualitative data collection (a form or issuer disclosure); shadow-price tables need sourcing. **Acceptance:** an IMP score responds to changing any of the 5 dimensions; the SROI ratio and at least one IRIS+ metric compute from real inputs; no headline tab is a bare `sr()` draw.

### 9.2 Evolution B — IMP-assessment guided-elicitation copilot (LLM tier 1)

**What.** The IMP framework is fundamentally a structured qualitative interview — the ideal LLM elicitation task. Evolution B walks an analyst through the 5 dimensions for a holding ("who is affected, and were they underserved before?", "what would have happened anyway — the counterfactual?"), proposes dimension scores with rationale tied to the IMP rubric, and assembles the composite via the Evolution-A engine. It also answers "which SDGs is this holding most material to?" from the real `SDG_SECTOR_WEIGHTS` matrix.

**How.** Tier-1 structured-elicitation pattern: `POST /api/v1/copilot/social-impact/ask`, corpus = this Atlas record plus the IMP 5-dimension definitions and IRIS+ catalogue references. Each proposed dimension score cites the IMP rubric criterion and requires user-provided evidence; the final composite is computed by the engine, not the LLM. SDG-materiality answers read the sector-relevance matrix directly.

**Prerequisites.** Evolution A's IMP engine so the composite is real; a session store for in-progress assessments. **Acceptance:** every proposed dimension score quotes an IMP rubric criterion and cites user evidence; empty evidence yields "insufficient input," not a default; SDG-materiality claims match the relevance matrix.