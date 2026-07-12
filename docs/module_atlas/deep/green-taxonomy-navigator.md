## 7 · Methodology Deep Dive

> ℹ️ **Guide↔code note.** The guide's headline is a Jaccard index
> `CTAI = |Aᵢ∩Aⱼ| / |Aᵢ∪Aⱼ|`. The code computes overlap as `intersection / total_activities`
> (a fixed denominator of 25 mapped activities), **not** intersection/union — so it is a *co-eligibility
> rate over the shared activity library*, not a true Jaccard similarity. The published per-pair
> alignment figures in the guide (EU-UK 78%, EU-China 52%) are ICMA/IPSF sourced and are **not**
> reproduced by the code's overlap counter; they differ.

### 7.1 What the module computes

Four tabs over a curated activity × taxonomy eligibility matrix (25 activities × 8 taxonomies).

**Interoperability overlap** (`interopMatrix`) — for every ordered taxonomy pair:
```js
overlap = ACTIVITIES.filter(a => a[t1]==='Eligible' && a[t2]==='Eligible').length
pct     = round(overlap / ACTIVITIES.length × 100)     // denominator = 25, fixed
```

**Portfolio screening** (`portfolioScreened`) — per company, share of its activities that are
Eligible *or* Transition under each selected taxonomy:
```js
eligible = count(activities where a[tid] ∈ {Eligible, Transition})
results[tid] = round(eligible / p.activities.length × 100)
```

**Radar profile** (`radarData`) — normalises each taxonomy to 6 dimensions:
```js
Activities   = round(t.activities/1018 × 100)   // EU=1018 is the max anchor
Env Objectives = round(t.envObj/6 × 100)        // 6 EU objectives = full marks
DNSH / Social Min = t.dnsh ? 90 : 30            // binary → 90/30
Interop      = t.interop                         // stored field
Maturity     = (2026 − t.year) × 15             // older = more mature
```

### 7.2 Taxonomy parameterisation (`TAXONOMIES`, 8 rows)

Provenance: real taxonomy attributes (year in force, objective count, screening status).

| Taxonomy | Year | Env obj | Activities | Screening | DNSH | Interop |
|---|---|---|---|---|---|---|
| EU Taxonomy | 2020 | 6 | 1018 | Mandatory | ✓ | 85 |
| China Green Bond Catalogue | 2021 | 3 | 211 | Mandatory | ✗ | 60 |
| ASEAN Taxonomy | 2023 | 4 | 270 | Voluntary | ✗ | 68 |
| UK Green Taxonomy | 2023 | 4 | 196 | Voluntary | ✓ | 80 |
| Colombia | 2022 | 5 | 132 | Voluntary | ✓ | 55 |
| Canada SFAF | 2024 | 4 | 82 | Voluntary | ✗ | 72 |
| India | 2024 | 3 | 150 | Proposed | ✗ | 55 |
| South Africa | 2024 | 3 | 65 | Proposed | ✗ | 48 |

The `interop` field (48–85) is a hard-coded prior, not derived from the activity matrix. Each of the
25 `ACTIVITIES` carries an eligibility label per taxonomy ∈ {Eligible, Transition, Amber, Review,
Proposed, Not Eligible, Excluded, N/A} — e.g. Nuclear is `Transition` in EU, `Eligible` in UK/Canada/
India, `N/A` in China/ASEAN, capturing real divergence.

### 7.3 Calculation walkthrough

The comparison tab filters `TAXONOMIES` by user selection and renders the radar. The interoperability
tab computes all 56 ordered-pair overlaps once (`useMemo`). The activity classifier filters the matrix
by search/sector. Portfolio screening maps 15 companies (each with 2–3 named activities) to per-
taxonomy eligibility percentages, treating both `Eligible` and `Transition` as passing.

### 7.4 Worked example (EU ↔ UK overlap)

Count activities Eligible in *both* EU and UK across the 25-row matrix: Solar PV, Onshore Wind,
Offshore Wind, Green H₂, Hydropower, Geothermal, EV Manufacturing, Rail, Green Buildings, Building
Renovation, Sustainable Forestry, Waste Management, Water Treatment, CCS, Battery Storage, Smart Grid,
Marine Energy ≈ 17 dual-Eligible (Nuclear is EU-Transition/UK-Eligible → excluded; Cement/Steel are
EU-Transition → excluded).

```
pct = round(17 / 25 × 100) = 68%
```

Note this ~68% is the code's co-eligibility rate; the guide cites ICMA's 78% EU-UK figure — the two
are computed on different bases (the guide counts Transition activities and uses IPSF's larger library).

### 7.5 Data provenance & limitations

- The activity eligibility matrix is **curated/illustrative** (25 activities), not the full ~1,000-
  activity EU Taxonomy. Overlap percentages therefore reflect this sample, not the actual taxonomies.
- Overlap uses a **fixed denominator** (`/25`), so it is not a Jaccard union — a pair where both
  taxonomies cover few activities is penalised the same as one where both cover many.
- The radar's Maturity `(2026−year)×15` and binary DNSH 90/30 are display heuristics, not measured.
- `TAXONOMY_THRESHOLDS` is imported from `referenceData` but the interactive tabs use the inline
  `ACTIVITIES` matrix.

### 7.6 Framework alignment

**EU Taxonomy (Reg (EU) 2020/852)** — 6 environmental objectives, technical screening criteria (TSC),
DNSH and Minimum Safeguards; the page's `envObj/6` and DNSH flags encode this structure. **UK Green
Taxonomy** — 4 objectives, voluntary. **MAS/ASEAN Taxonomy** — traffic-light (green/amber/red) for
transition; captured by the `Amber` label. **China Green Bond Catalogue (2021)** — removed clean coal
in the 2021 edition; the matrix marks Coal `Excluded` for China. **IPSF Common Ground Taxonomy** — the
EU-China mapping the guide's 52% figure comes from, assessing activity-level TSC comparability. The
guide's published pairwise alignments derive from ICMA/IPSF expert mapping of TSC stringency, which the
page approximates with a binary co-eligibility count.

*(No §8 model spec: this is a reference/comparison tool over curated categorical data, not a financial/
risk quantity requiring a production model. The one quantitative output — overlap % — is a transparent
set-intersection count, appropriately caveated above as a sample-based approximation of the true
IPSF-style TSC comparison.)*
