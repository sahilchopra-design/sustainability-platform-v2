# Sovereign ESG Scorer
**Module ID:** `sovereign-esg` · **Route:** `/sovereign-esg` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
6-dimension ESG assessment for 80 sovereigns using World Bank WGI, Freedom House, Environmental Performance Index, and social indicators. Custom weight configuration.

> **Business value:** Sovereign ESG integration is growing across $5T+ of fixed income portfolios. This module enables systematic, multi-source sovereign ESG assessment beyond simple governance ratings, supporting both exclusion screening and ESG-tilted sovereign allocation.

**How an analyst works this module:**
- Country Ranking sorts 80 sovereigns by composite ESG score
- Pillar Radar shows E/S/G breakdown per country
- WGI Dimensions tab shows all 6 governance indicators
- Custom Weights lets you adjust E/S/G weighting
- Peer Comparison shows regional groupings

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COUNTRY_MAP`, `Card`, `KpiCard`, `LS_PORTFOLIO`, `PIE_COLORS`, `REGION_COLORS`, `SOVEREIGN_DB`, `Section`, `SortTh`, `SovereignEsgPage`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGION_COLORS` | `{ Europe: T.navy, Americas: T.sage, 'Asia-Pacific': T.gold, Africa: '#7c3aed', MENA: '#0d9488' };` |
| `body` | `rows.map(r => cols.map(c => { const v = typeof c.key === 'function' ? c.key(r) : r[c.key]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v; }).join(',')).join('\n');` |
| `blob` | `new Blob([hdr + '\n' + body], { type: 'text/csv' });` |
| `avg` | `(arr, key) => arr.length ? arr.reduce((s, r) => s + (r[key] \|\| 0), 0) / arr.length : 0;` |
| `scatterData` | `useMemo(() => SOVEREIGN_DB.map(c => ({ name: c.name, region: c.region, x: c.ndgain_vulnerability, y: c.ndgain_readiness, z: Math.sqrt(c.gdp_bn) * 3, iso2: c.iso2 })), []);` |
| `emissionsSorted` | `useMemo(() => [...SOVEREIGN_DB].sort((a, b) => b.emissions_per_capita - a.emissions_per_capita), []);` |
| `greenBondSorted` | `useMemo(() => [...SOVEREIGN_DB].sort((a, b) => b.green_bond_volume_bn - a.green_bond_volume_bn).slice(0, 20), []);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PIE_COLORS`, `SOVEREIGN_DB`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Countries | — | Sovereign universe | Global sovereign coverage |
| WGI Dimensions | — | World Bank | Annual governance indicators, -2.5 to +2.5 scale |
| EPI Score | — | Yale EPI | Environmental Performance Index composite |
- **World Bank WGI data** → Governance scoring → **Sovereign governance pillar**
- **Yale EPI data** → Environmental scoring → **Sovereign environmental pillar**
- **UNDP HDI data** → Social scoring → **Sovereign social pillar**

## 5 · Intermediate Transformation Logic
**Methodology:** WGI-based ESG composite
**Headline formula:** `Composite = w_E×Environmental + w_S×Social + w_G×Governance (WGI 6 dims)`

Governance = average of 6 WGI dimensions (Voice, Stability, Effectiveness, Regulatory, Rule of Law, Corruption). Environmental = EPI score + carbon intensity. Social = HDI + inequality + social protection.

**Standards:** ['World Bank WGI', 'EPI Yale', 'Freedom House']
**Reference documents:** World Bank Worldwide Governance Indicators; Yale Environmental Performance Index; Freedom House Freedom in the World; UNDP Human Development Index

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Live WGI 6-dimension governance and full 80-country coverage (analytics ladder: rung 1 → 3)

**What.** This is one of the batch's most extensively researched hand-authored tables — `SOVEREIGN_DB` (no `sr()` anywhere) carries real macro, real ND-GAIN vulnerability/readiness sub-indices, genuine Climate Action Tracker 5-tier ratings, real CPI/press-freedom/rule-of-law/HDI/Gini values, and a composite verified as `(climate+social+governance)/3`. But two §7 gaps limit it: it covers **40 countries, not the 80** the guide claims, and the governance/climate/social pillar scores are **pre-computed constants embedded in the seed**, not calculated from sub-indicators — in particular the WGI 6 dimensions (Voice, Stability, Effectiveness, Regulatory, Rule of Law, Corruption) the guide names don't exist as separate fields. Evolution A computes the pillars from real sub-indicators and extends coverage.

**How.** (1) Ingest the actual WGI dataset (World Bank, free) and compute the governance pillar as the real 6-dimension average, exposing each sub-dimension — delivering the "WGI Dimensions tab" the guide promises. (2) Compute the environmental pillar from EPI + carbon intensity and the social pillar from HDI + Gini + social protection as the guide describes, rather than hand-typed constants — so the composite responds to real data updates. (3) Extend to 80 sovereigns (the guide's claim; WGI/EPI/ND-GAIN cover far more). (4) Preserve the genuinely-correct CAT rating integration and ND-GAIN two-axis structure. (5) Keep the custom-weights feature but apply it to computed pillars.

**Prerequisites.** WGI/EPI/HDI/Gini ingestion (all free public sources); the composite arithmetic already works, only the pillar inputs change. **Acceptance:** the WGI tab shows 6 computed sub-dimensions; changing a source indicator moves the pillar and composite; coverage reaches 80 countries.

### 9.2 Evolution B — Sovereign-ESG allocation copilot (LLM tier 1)

**What.** A copilot for the $5T+ sovereign-fixed-income use case the module targets: "rank my sovereign universe by ESG composite under a governance-tilted weighting", "why does this country score poorly on governance?", "which sovereigns fail a 1.5°C-compatible CAT screen for exclusion?" — answered from the computed pillars, the real CAT ratings, and the WGI sub-dimensions.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sovereign-esg/ask`, corpus = this Atlas record (the pillar structure, the composite formula, WGI/EPI/CAT framework notes) plus live page state including the user's custom weights. Governance explanations cite the specific WGI sub-dimension (post-Evolution-A); exclusion screens read the real CAT category; rankings narrate deterministic sorts under the chosen weights. Refusal for sovereigns outside coverage.

**Prerequisites.** Evolution A's computed pillars so governance explanations can cite real WGI sub-dimensions rather than a single opaque constant. **Acceptance:** every pillar/composite figure matches the page's computation under the active weights; governance explanations reference WGI sub-dimensions; a CAT-based screen uses the country's real tracker rating.