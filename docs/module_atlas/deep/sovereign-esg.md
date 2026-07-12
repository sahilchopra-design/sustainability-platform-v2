## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (scale).** The guide states "80 sovereigns" and describes a governance
> pillar built from "6 WGI dimensions" computed live. The code's `SOVEREIGN_DB` covers **40 countries**
> (not 80), and while the guide implies a live WGI 6-dimension governance calculation, the module's
> `governance_score` (and `climate_score`/`social_score`) are **hand-typed constants**, not computed from
> individual WGI Voice/Stability/Effectiveness/Regulatory/RuleOfLaw/Corruption sub-scores — no such 6
> sub-dimensions exist as separate fields anywhere in the file.

### 7.1 What the module computes

`SOVEREIGN_DB` is a **40-country, hand-curated, real-data-grounded** dataset (**no `sr()` PRNG anywhere in
the file**) — genuinely one of the most extensively researched hand-authored tables in this batch. Each
country carries real macro data (GDP, GDP/capita, population), real climate data (ND-GAIN score, ND-GAIN
vulnerability/readiness sub-indices, emissions Mt and per-capita, renewable %, forest cover %), a real
**Climate Action Tracker (CAT) rating** using CAT's actual category labels ("1.5°C Compatible",
"Almost Sufficient", "Insufficient", "Highly Insufficient", "Critically Insufficient"), real governance
proxies (CPI corruption score, press freedom, rule of law), real social data (HDI, Gini), and real financial
data (debt/GDP, green bond volume $Bn, sovereign credit rating). Three pillar scores
(`climate_score`/`social_score`/`governance_score`, 0–100) and a `composite` are attached per country as
**pre-computed constants embedded in the seed data**, not calculated by a JS formula at render time.

### 7.2 Reverse-engineering the composite formula

Cross-checking `composite` against the three pillar scores for every row in the dataset shows:

```
composite ≈ round( (climate_score + social_score + governance_score) / 3 )
```

Verified exactly or within ±1 (rounding) across all 40 rows, e.g.:

| Country | climate | social | governance | Simple average | Stated `composite` |
|---|---|---|---|---|---|
| Denmark | 92 | 94 | 93 | 93.0 | 93 ✓ |
| Norway | 85 | 95 | 96 | 92.0 | 92 ✓ |
| United Kingdom | 72 | 82 | 80 | 78.0 | 78 ✓ |
| United States | 55 | 72 | 78 | 68.3 | 68 ✓ |
| China | 45 | 48 | 38 | 43.7 | 44 ✓ |
| Nigeria | 32 | 30 | 28 | 30.0 | 30 ✓ |

So the module's actual methodology is an **equal-weighted (1/3, 1/3, 1/3) average of the three pillars**,
baked into the data rather than computed live — a real, reproducible, auditable pattern (unlike modules
where composites are unrelated to their stated sub-components), just not exposed as a formula in the UI or
implemented as a running calculation.

### 7.3 Parameterisation

| Field | Values (illustrative) | Provenance |
|---|---|---|
| `climate_score`/`social_score`/`governance_score` | hand-typed 0–100 per country | plausible relative-to-peers judgments, directionally consistent with the real underlying data on the same row (e.g. Denmark's 82% renewable share and "1.5°C Compatible" CAT rating support a high 92 climate_score) but **not derived from those fields via a visible formula** |
| CAT rating | real CAT category set: 1.5°C Compatible, Almost Sufficient, Insufficient, Highly Insufficient, Critically Insufficient | genuinely accurate use of Climate Action Tracker's actual 5-tier rating taxonomy |
| `ndgain_vulnerability`/`ndgain_readiness` | e.g. Denmark 28.5/82.1, Nigeria 60.0/28.5 | consistent with the real ND-GAIN index's two-axis structure (lower vulnerability + higher readiness = better) |
| `cpi_score` (Transparency International Corruption Perceptions Index, 0–100) | Denmark 90 (near-best), Nigeria 25 (poor) | consistent with real-world CPI rankings |
| `hdi`, `gini` | Denmark 0.952/28.2, Nigeria 0.535/35.1 | consistent with real UNDP HDI and World Bank Gini figures for these countries |

### 7.4 Calculation walkthrough

- **Rankings & KPIs / Climate & Emissions / Governance & Social tabs**: filtered/sorted rendering of the
  pre-computed pillar scores and their underlying real-data fields — the module's primary value is as a
  **structured reference dataset** with correct real-world labelling (CAT ratings, ND-GAIN sub-indices,
  CPI, HDI, Gini) rather than a live-computed scoring engine.
- **Portfolio Exposure tab**: aggregates a sample portfolio's `composite`/`climate_score` exposure — likely
  a weighted average by holding, consistent with the `avg(arr, key)` helper defined in the file.
- **Compare & Export tab**: side-by-side country comparison with CSV/JSON export — direct use of the
  underlying dataset.

### 7.5 Data provenance & limitations

- **This module's underlying real-world fields (ND-GAIN, CAT ratings, CPI, HDI, Gini, green bond volumes,
  sovereign ratings) are genuinely well-researched and internally consistent** with each other and with
  known real-world facts for the 40 named countries — a strong evidentiary basis relative to most modules in
  this batch, even though the data is a static, hand-curated snapshot rather than a live feed.
- **The three pillar scores are hand-typed, not computed from a documented sub-indicator weighting** — a
  user cannot verify, say, why Germany's `governance_score=91` specifically follows from its CPI/rule-of-
  law/press-freedom values shown on the same row; the pillar-to-composite aggregation (simple 1/3 average)
  is reproducible, but the pillar scores themselves are not.
- The guide's claim of "80 sovereigns" and a live "6 WGI dimension" governance calculation do not match the
  code (40 countries, no 6-dimension WGI breakdown) — see the mismatch flag.

### 7.6 Framework alignment

- **Climate Action Tracker (CAT)** — genuinely correct use of CAT's real 5-tier rating taxonomy per country,
  a meaningfully accurate integration of a real external framework's categorical output.
- **ND-GAIN Country Index** — the vulnerability/readiness two-axis structure is correctly represented as
  distinct fields, consistent with ND-GAIN's actual index architecture.
- **Transparency International CPI / UNDP HDI / World Bank Gini** — all three real indices are correctly
  labelled and populated with directionally accurate values.
- **World Bank Worldwide Governance Indicators (WGI)** — named in the guide as the governance-pillar basis;
  the module does not expose WGI's actual 6 sub-dimensions (Voice & Accountability, Political Stability,
  Government Effectiveness, Regulatory Quality, Rule of Law, Control of Corruption) as separate fields, only
  a single aggregated `governance_score`.
