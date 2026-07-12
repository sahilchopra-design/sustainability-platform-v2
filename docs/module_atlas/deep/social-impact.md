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
