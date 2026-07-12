## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial-mismatch flag.** The guide states a **Geopolitical Supply Risk Index**
> `GSRI = Σ_i (HHI_i × Governance_Risk_i × Trade_Concentration_i) / n`. **The HHI half is genuinely
> computed** — the code calculates the Herfindahl-Hirschman Index correctly from real per-country mining
> and processing shares (`HHI = Σ share²`). **But the full GSRI product is not formed:** the governance-
> risk term is `sr()`-seeded (not World Bank WGI), the trade-concentration multiplier is not multiplied
> in, and no single `GSRI` score is produced. The 80 downstream companies are fully seeded. So this is the
> strongest of the three critical-mineral modules — a real concentration analysis on real data — but the
> governance-weighted composite the guide describes is only half-built. §8 specifies the complete GSRI.

### 7.1 What the module computes

The real computation is per-mineral HHI over curated country shares, plus friendshoring/reshoring metrics:

```js
miningHHI     = Σ_c share_mining(c)²          // Herfindahl-Hirschman Index, 0–10,000
processingHHI = Σ_c share_processing(c)²
chinaProcess  = processing.China || 0
friendshoreScore = 100 − chinaProcess
// friendshoring detail:
alliedPct    = 100 − processing.China
reshoreTarget= min(100, floor((100 − chinaProcess) × 1.5))
reshoreGapPct= max(0, floor(chinaProcess − 30))
costPremium  = floor(chinaProcess × 0.4) + '%'
```

`governanceScore = floor(sr(country.length·17+3)·80 + 20)` — **seeded**, keyed only to country name length,
so it is not a real governance measure. The 80 companies' risk fields (`concentrationRisk`,
`chinaProcessingDep`, `diversificationScore`, `geoRiskScore`…) are all `sr()`-seeded.

### 7.2 Parameterisation / scoring rubric

**Curated mineral data (15 minerals, real per-country shares):**

| Mineral | Mining (top) | Processing China | Supply risk |
|---|---|---|---|
| Rare Earths | China 60%, Myanmar 12% | 90% | Critical |
| Graphite | China 65%, Mozambique 12% | 93% | Critical |
| Gallium | China 80% | 98% | Critical |
| Cobalt | DRC 74% | 73% | Critical |
| Tungsten | China 82% | 85% | Critical |
| Lithium | Chile 28%, Australia 24% | 65% | High |
| PGMs (Pt) | South Africa 72% | 55% | Medium |

| Field | Formula | Provenance |
|---|---|---|
| `miningHHI`, `processingHHI` | `Σ share²` | **Real HHI** over curated shares |
| `friendshoreScore`, `reshoreTarget`, `costPremium` | derived from `chinaProcess` | Real transforms |
| `governanceScore` | `floor(sr(len·17+3)·80+20)` | **Synthetic seeded PRNG** |
| 80 companies' risk fields | `floor(sr·range)` | Synthetic seeded PRNG |

`EXPORT_CONTROLS` (11) are real events (China Ga/Ge/graphite licensing 2023, Indonesia nickel ore ban 2020,
DRC cobalt royalty 3.5→10% 2024, Russia sanctions…) with real price-impact estimates.

### 7.3 Calculation walkthrough

1. `mineralHHI` computes mining and processing HHI per mineral from the curated share maps, sorts by
   processing HHI (most concentrated first).
2. `friendshoringByMineral` derives allied/China-dependence, a reshore target (×1.5 of allied share,
   capped), a reshore gap (China share − 30), and a cost premium (China share × 0.4%).
3. KPIs: 15 minerals, 40 countries, avg China processing, critical-risk count, avg processing HHI, avg
   2030 demand multiple.
4. The 80-company table (seeded) is filterable/sortable/paginated for portfolio mineral risk.

### 7.4 Worked example

Rare Earths processing shares `{China: 90, Estonia: 2, Japan: 2, Other: 6}`:
`processingHHI = 90² + 2² + 2² + 6² = 8100 + 4 + 4 + 36 = 8,144` — far above the 4,000 "critical
chokepoint" threshold, correctly flagging REE as the most concentrated. Its `friendshoreScore = 100 − 90 =
10`; `reshoreTarget = min(100, floor(10 × 1.5)) = 15`; `reshoreGapPct = max(0, 90 − 30) = 60`;
`costPremium = floor(90 × 0.4) = 36%`. Gallium (98% China processing) gives
`processingHHI = 98² + 1 + 1 = 9,606` — the highest chokepoint. These HHI values are **real**; the
per-country `governanceScore` shown in the radar (e.g. China `floor(sr(5·17+3)·80+20)`) is seeded.

### 7.5 Companion analytics on the page

Four tabs: concentration dashboard (mining vs processing HHI bars, China-processing ranking, demand-growth
ranking), friendshoring & de-risking (allied vs China, reshore targets, cost premiums), export controls &
nationalism (the 11 real events + 9 friendshoring policies), and portfolio mineral risk (80 seeded
companies). No backend engine or route — client-side.

### 7.6 Data provenance & limitations

- **Mineral shares and HHI are real** — 15 minerals with curated USGS/IEA-consistent per-country mining and
  processing shares; the HHI computation is a correct `Σ share²`. Export controls are real events.
- **Governance scores and the 80 companies are synthetic**, from `sr(seed)=frac(sin(seed+1)×10⁴)`. The
  governance term is keyed only to country-name length — meaningless as a governance measure.
- **The full GSRI product is not formed** — HHI is computed but not multiplied by governance and trade
  concentration into the guide's `Σ(HHI × Gov × Trade)/n` index; the module stops at HHI + friendshoring.

**Framework alignment:** *HHI* (Herfindahl-Hirschman Index) — correctly implemented; >2,500 concentrated,
>4,000 critical chokepoint, exactly as the guide states. *IEA Critical Minerals Report 2024* and *USGS*
underpin the share data. *EU Critical Raw Materials Act* frames the reshore/de-risking targets. *World Bank
WGI* (rule of law, political stability) is cited as the governance-weight source but **not used** — the
governance term is seeded instead. The GSRI composite completing this is specified below.

---

## 8 · Model Specification — Geopolitical Supply Risk Index (GSRI)

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Complete the guide's GSRI: combine the (already-computed) HHI with real supplier-governance risk and trade
concentration into one 0–10,000-scaled index per mineral, and roll it up to portfolio exposure. Coverage:
the 15 curated minerals and any portfolio mapped to them.

### 8.2 Conceptual approach
Extend the working HHI with a **share-weighted World Bank WGI** governance term and a single-processor
trade-concentration multiplier, per the guide's product form and the **EU CRMA** supply-risk methodology
(concentration × governance × substitutability). This is the standard supply-risk index construction
(IEA, EU CRMA, British Geological Survey risk list).

### 8.3 Mathematical specification
```
HHI_proc_m   = Σ_c share_proc(c)²                               (already computed)
Gov_m        = Σ_c share_proc(c)/100 · (1 − WGI_norm(c))        WGI_norm ∈ [0,1]
Trade_m      = max_c share_proc(c) / 100                        (single-processor reliance)
GSRI_m       = HHI_proc_m · (1 + Gov_m) · (1 + Trade_m) / scale
Portfolio GSRI = Σ_m exposure_m · GSRI_m / Σ exposure_m
Bands: >2500 concentrated · >4000 critical chokepoint (on HHI leg)
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Processing shares | `share_proc` | USGS/IEA (already curated) |
| Governance | `WGI_norm(c)` | World Bank WGI rule-of-law + political-stability, min-max normalised |
| Trade concentration | `Trade_m` | Dominant-processor share |
| Scale | `scale` | Normalise GSRI to interpretable range |

### 8.4 Data requirements
The curated processing/mining share vectors (present) and a WGI table per supplier country (free, World
Bank — replaces the seeded `governanceScore`). Portfolio exposure by mineral (the 80-company table would
supply real weights once its fields are sourced).

### 8.5 Validation & benchmarking plan
Reconcile GSRI rankings against EU CRMA and BGS risk-list orderings (REE, gallium, graphite should top);
backtest whether high-GSRI minerals saw the largest supply disruptions / export controls (the
`EXPORT_CONTROLS` events). Sensitivity on the governance and trade weights.

### 8.6 Limitations & model risk
HHI ignores stockpiles, recycling, and substitution — pair with the constraint module's recycling/
substitution data as mitigants. WGI is slow-moving and can miss sudden export controls (overlay the real
`EXPORT_CONTROLS`). Governance keyed to name-length (current code) must be replaced with real WGI.
Conservative fallback: report HHI + China-processing share directly (as the module already does correctly)
so the concentration signal is not obscured by an uncertain governance weight.
