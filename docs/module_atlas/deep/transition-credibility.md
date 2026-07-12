## 7 · Methodology Deep Dive

### 7.1 What the module computes

100 synthetic companies are scored on 12 transition-credibility KPIs (CapEx Green Ratio, Lobbying
Consistency, Exec Pay Linkage, Fossil Expansion, Carbon Lock-in, Scope 3 Coverage, Offset
Dependency, Short-term Targets, Governance Oversight, Just Transition, R&D Allocation, Disclosure
Quality), all generated once at module load by the seeded PRNG `sr(s)=frac(sin(s+1)×10⁴)`. The
guide describes a weighted composite (`TCS = Σ(Criterion × Weight) / ΣWeight`); the code implements
the **equal-weight special case** of that formula:

```
composite = round( Σ(12 KPI scores) / 12 )        // unweighted mean — all weights = 1
tier = composite≥72 'Credible' | ≥55 'Moderate' | ≥38 'Questionable' | else 'Incredible'
```

### 7.2 Parameterisation

| Element | Formula | Range | Provenance |
|---|---|---|---|
| KPI score (each of 12) | `round(sr(i×13+ki×17)×60+20+sr(i+ki)×20)`, clamped 0–100 | ~20–100 (two-PRNG blend) | Synthetic demo value |
| Composite tier thresholds | 72 / 55 / 38 | — | Platform-defined 4-tier scale (Credible / Moderate / Questionable / Incredible), no external standard cited |
| `greenCapex` / `transCapex` / `brownCapex` | `sr(i×19)×40+10`, `sr(i×23)×25+5`, `100−green−trans` | 10–50% / 5–30% / remainder | Synthetic 3-way capex split; brown is a plug so the three always sum to exactly 100% |
| `lobbyScore` / `commitScore` | `sr(i×31)×80+10`, `sr(i×37)×80+10` | 10–90 | Synthetic, independent of each other — this pairing feeds the "Say-Do Gap" flag (§7.5) |
| `netZeroClaim` | `sr(i×83) > 0.3` | ~70% true | Synthetic boolean |
| `sbtiStatus` | `['Committed','Target Set','None'][⌊sr(i×91)×3⌋]` | 3 categories | Real SBTi status taxonomy, randomly assigned |
| `capexTrend` (5-year, 2021–2025) | Green/trans/brown drift from the base split by further PRNG terms scaled by year index | — | Synthetic 5-year trajectory, not a real reported capex history |

### 7.3 Calculation walkthrough

1. **Composite & tier**: unweighted mean of the 12 KPI scores maps to one of 4 tiers via fixed
   cutoffs; this is the module's single "credibility score."
2. **CapEx alignment**: `greenCapex + transCapex + brownCapex = 100` by construction (brown is the
   residual), so the split is always internally consistent, but the specific 3-way ratio for any
   company is arbitrary rather than sourced from a capex disclosure.
3. **"Say-Do Gap" flag** (`sayDoFlags`): companies with `commitScore > 60` AND `lobbyScore < 35` are
   flagged — i.e. a company claiming strong climate commitment while showing weak lobbying alignment
   (a real, well-known transition-credibility red flag pattern used by InfluenceMap and similar
   trackers), computed here from two independently-seeded synthetic scores.
4. **Misaligned companies**: `netZeroClaim && brownCapex > 30` — flags net-zero claimants whose own
   generated capex split still shows >30% brown spend, again a real-world-relevant pattern applied
   to synthetic inputs.
5. **Sector/portfolio benchmarking**: `sectorBenchmarks` and `alignmentTrend` average composite,
   green/trans/brown capex by sector and by year across all 100 companies.
6. **Trade association scoring**: a separate 12-row static-ish table (`TRADE_ASSOCS`) scores
   member count, average lobby alignment, and climate alignment per association via further
   independent PRNG draws — not linked back to which companies belong to which association.

### 7.4 Worked example (Company #1, `i=0`, "Meridian Energy")

| Step | Computation | Result |
|---|---|---|
| Sector | `⌊sr(0)×10⌋=7` | **Consumer** |
| Country | `⌊sr(11)×15⌋=10` | **Norway** |
| 12 KPI scores | `sr(13+ki×17)×60+20+sr(ki)×20` per KPI, clamped | 77, 47, 34, 56, 44, 62, 90, 38, 75, 84, 76, 71 |
| Composite | `round(Σ/12)` | **63** |
| Tier | `55 ≤ 63 < 72` | **Moderate** |
| Green / Trans / Brown capex | `sr(19)×40+10`, `sr(23)×25+5`, residual | 38% / 23% / 39% |
| Lobby / Commit score | `sr(31)×80+10`, `sr(37)×80+10` | 67 / 67 (no Say-Do gap flag here since both are equal) |
| Net-zero claim | `sr(83)=0.71 > 0.3` | **True** |
| Misaligned flag | `netZeroClaim && brownCapex(39%) > 30%` | **Flagged** — claims net zero but 39% of capex is still brown |

### 7.5 Companion analytics

- **Portfolio credibility tab** — aggregates a hypothetical portfolio's `weight`-weighted composite
  score across whichever companies are selected, using the per-company `weight` field
  (`sr(i×53)×3+0.2`, a synthetic 0.2–3.2% position size).
- **Trade association table** — separate synthetic scoring of 12 industry associations
  (member count, average lobbying score, climate alignment), used to contextualise the Lobbying &
  Advocacy tab independent of the company-level Say-Do Gap analysis.
- **Radar comparison** — selected company's 12 KPI scores plotted against sector peer average and
  sector best, useful for relative positioning even though all three series are synthetic.

### 7.6 Data provenance & limitations

- **100% synthetic demo data.** All 100 companies (fictional names), sectors, countries, KPI
  scores, capex splits, lobbying scores, and net-zero claims are generated by
  `sr(s)=frac(sin(s+1)×10⁴)` — no real corporate disclosures, CDP submissions, or InfluenceMap
  scores are ingested.
- The composite score is an **unweighted** mean of 12 KPIs, whereas the guide's formula implies a
  genuinely weighted aggregation (some criteria — e.g. Fossil Expansion, Carbon Lock-in — would
  typically carry more weight in a real GFANZ-aligned assessment than, say, R&D Allocation). No
  weight vector is exposed in the code or UI.
- The Say-Do Gap and net-zero/brown-capex misalignment flags implement genuinely useful,
  real-world-relevant screening logic, but because both sides of each flag are independently random
  draws, the flagged companies in this demo do not represent any actual detected greenwashing
  pattern — they are illustrative of the *type* of red flag a production version would surface.
- No confidence bands, data-quality scores, or source citations accompany any individual KPI value.

### 7.7 Framework alignment

- **GFANZ Transition Finance Frameworks (2023)**: the credibility-tier structure (Credible/
  Moderate/Questionable/Incredible) and the multi-dimension KPI set (ambition, governance,
  financing alignment) mirror GFANZ's credibility criteria conceptually, though GFANZ does not
  itself prescribe these exact 12 KPIs or these exact score cutoffs.
- **IPCC AR6 WGIII mitigation pathways**: referenced in the guide as a comparison benchmark for
  capex trajectories; not implemented — the module's capex splits are not checked against any
  sector decarbonisation pathway.
- **ISSB IFRS S2 transition-plan disclosure requirements** and **TCFD transition-plan guidance**:
  the `tcfdAligned` boolean flag references TCFD alignment status but is itself a synthetic draw,
  not a real disclosure-completeness assessment.
- **"Say-do gap" methodology** (as used by InfluenceMap's Climate Lobbying tracker): the module's
  commitment-vs-lobbying screening logic is directionally faithful to this real, established
  practice of cross-checking public commitments against political-influence activity.
