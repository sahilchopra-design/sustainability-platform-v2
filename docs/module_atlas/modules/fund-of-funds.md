# Fund of Funds ESG
**Module ID:** `fund-of-funds` · **Route:** `/fund-of-funds` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Aggregates ESG metrics and carbon footprint across fund-of-fund holdings using look-through methodology, penetrating sub-fund layers to compute portfolio-level weighted averages. Supports SFDR Article 8/9 classification at the FoF level and PAI indicator aggregation across underlying funds with varying data availability.

> **Business value:** Enables fund-of-fund managers to demonstrate SFDR compliance at the product level despite one or two layers of fund intermediation, produce PCAF-aligned financed emissions disclosures, and identify sub-funds that constrain the FoF ESG profile through low transparency or high carbon intensity.

**How an analyst works this module:**
- Load sub-fund holdings using available transparency reports and SFDR periodic disclosures.
- Apply look-through weights to aggregate holding-level ESG scores and emissions to the FoF level.
- Review data quality dashboard to identify sub-funds with low look-through coverage and apply proxy adjustments.
- Generate SFDR PAI template with aggregated indicators and data quality notes for annual report disclosure.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Card`, `DEFAULT_FUNDS`, `LS_KEY`, `PIE_COLORS`, `SortIcon`, `TYPE_COLORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DEFAULT_FUNDS` | 13 | `name`, `type`, `vintage`, `aum_mn`, `currency`, `geography`, `strategy`, `commitment_mn`, `nav_mn`, `dpi`, `tvpi`, `irr`, `esg_score`, `carbon_intensity`, `sfdr_article`, `gresb_score`, `num_holdings`, `gp`, `sector_focus` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalW` | `funds.reduce((s,f) => s + (f[weight]\|\|0), 0);` |
| `types` | `useMemo(() => ['All', ...new Set(funds.map(f => f.type))], [funds]);` |
| `totalCommit` | `f.reduce((s,x) => s+x.commitment_mn,0);` |
| `totalNav` | `f.reduce((s,x) => s+x.nav_mn,0);` |
| `totalAUM` | `f.reduce((s,x) => s+x.aum_mn,0);` |
| `totalHoldings` | `f.reduce((s,x) => s+x.num_holdings,0);` |
| `geos` | `new Set(f.map(x => x.geography)).size;` |
| `fundTypes` | `new Set(f.map(x => x.type)).size;` |
| `scatterData` | `useMemo(() => funds.filter(f => f.irr != null).map(f => ({ name:f.name, x:f.esg_score, y:f.irr, z:f.commitment_mn, type:f.type })), [funds]);` |
| `distPct` | `y >= 3 ? Math.min((y-3)/7, 1) * 0.35 : 0;` |
| `dists` | `kpis.totalCommit * (y >= 3 ? Math.min((y-3)/5, 1) * 0.25 : 0);` |
| `net` | `calls + dists;` |
| `saveEdit` | `() => { setFunds(p => p.map(f => f.id === editId ? { ...editData } : f)); setEditId(null); setEditData(null); };` |
| `rows` | `filtered.map(f => Object.values(f).map(v => v == null ? '' : `"${v}"`).join(',')).join('\n');` |
| `blob` | `new Blob([hdr + '\n' + rows], { type:'text/csv' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DEFAULT_FUNDS`, `PIE_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Look-Through Coverage (%) | — | Sub-fund transparency reports | Percentage of FoF NAV for which full holding-level data is available; below 70% triggers proxy-based estimation. |
| Weighted Avg Carbon Intensity (tCO2e/$M) | — | PCAF / Sub-fund SFDR data | Revenue-normalised Scope 1+2 carbon intensity aggregated across all look-through positions. |
| SFDR PAI Coverage (%) | — | Sub-fund SFDR disclosures | Share of mandatory PAI indicators computable from available sub-fund disclosures without estimation. |
| Sub-Fund ESG Classification | — | SFDR product classification | Distribution of sub-funds by SFDR article; FoF Article 9 status requires all sub-funds to be Article 8 or above. |
- **Sub-fund transparency reports and holdings files** → Apply look-through weights, map to ISIN universe → **Holding-level ESG and emissions data**
- **SFDR PAI disclosures from underlying funds** → Aggregate PAI indicators weighted by FoF allocation → **FoF-level PAI summary table**
- **Fund NAV and allocation data** → Compute FoF weights, apply PCAF look-through formula → **Weighted average carbon footprint and intensity**

## 5 · Intermediate Transformation Logic
**Methodology:** Look-Through Carbon Footprint
**Headline formula:** `CF_FoF = Σ_f (w_f × Σ_i (w_fi × EVIC_fi⁻¹ × Emissions_fi))`

Applies PCAF look-through methodology by weighting each underlying fund by its FoF allocation, then weighting each underlying holding by its sub-fund weight, normalising financed emissions by EVIC at each level. Where sub-fund holdings are unavailable, fund-level carbon intensity proxies are applied with a data quality score penalty.

**Standards:** ['SFDR Delegated Regulation Annex I', 'TCFD Portfolio Alignment', 'PCAF Standard Part A']
**Reference documents:** SFDR Delegated Regulation (EU) 2022/1288 â€” Annex I/II; PCAF Global Standard Part A (2022); ESMA Q&A on SFDR Application (2023); UNPRI Fund-of-Funds ESG Integration Guide (2021)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide specifies a **two-level PCAF look-through**
> `CF_FoF = Σ_f w_f × Σ_i (w_fi × EVIC_fi⁻¹ × Emissions_fi)` — weighting each fund by its FoF allocation,
> then each underlying holding by its sub-fund weight, normalising by EVIC at both levels. **The code
> implements only the first level:** a commitment-weighted average of each fund's stored
> `carbon_intensity`. There is no holding-level roll-up, no EVIC normalisation — the sub-fund look-
> through is absent. The rest of the module (TVPI/IRR/ESG aggregation, SFDR/GRESB analytics, editable
> portfolio) is genuine and correctly weighted.

### 7.1 What the module computes

A commitment-weighted PE fund-of-funds engine over 12 funds (editable, localStorage-persisted):

```js
wAvg(funds, field) = Σ(field_f × commitment_f) / Σ commitment_f      // commitment-weighted
wTVPI   = wAvg(tvpi)
wIRR    = wAvg(irr) over funds with irr ≠ null
wESG    = wAvg(esg_score)
wCarbon = wAvg(carbon_intensity)          // ← the "look-through carbon footprint" (single level)
art89pct = #(sfdr_article ≥ 8) / count × 100
```

The IRR aggregation correctly **excludes null-IRR funds** (early-vintage funds without a meaningful IRR)
before weighting — a proper treatment. TVPI, DPI, ESG and carbon are all commitment-weighted.

### 7.2 Parameterisation / scoring rubric — the fund book

`DEFAULT_FUNDS` (12) carry realistic PE/RE/Infra/Credit/VC attributes:

| Fund | Type | Commit $M | TVPI | IRR | ESG | Carbon int. | SFDR |
|---|---|---|---|---|---|---|---|
| Climate Transition I | PE | 50 | 1.18 | 14.5 | 74 | 45 | 9 |
| NA Buyout V | PE | 150 | 1.32 | 18.5 | 55 | 155 | 6 |
| Global Equity ESG Leaders | Listed Eq | 200 | 1.85 | 12.8 | 76 | 68 | 8 |
| Impact Ventures I | VC | 15 | 1.05 | null | 82 | 18 | 9 |
| Japan Transition | PE | 60 | 1.05 | 8.0 | 70 | 180 | 8 |

`carbon_intensity` values are plausible (heavy-industry Japan Transition 180, Impact Ventures 18) but
are **stored per fund**, not derived from underlying holdings. SFDR Article (6/8/9), GRESB score
(populated for RE/Infra funds), DPI/TVPI/vintage are all realistic. Data is curated demo, no PRNG.

`esgColor`: ≥75 green, ≥60 amber, else red. `sfdrBadge`: Art 9 green / Art 8 amber / Art 6 red.

### 7.3 Calculation walkthrough

1. Load funds (localStorage or defaults); filter by type/SFDR/ESG floor; sort.
2. `kpis`: total commitment/NAV/AUM, commitment-weighted TVPI/IRR/ESG/carbon, Art 8+9 %, GRESB %.
3. Charts: asset allocation by type (commitment), ESG-vs-IRR scatter (bubble = commitment), SFDR
   buckets, geography and vintage distributions.
4. Add/edit funds → recompute + persist.

### 7.4 Worked example (commitment-weighted carbon)

Three funds: Climate Transition ($50M, carbon 45), NA Buyout ($150M, carbon 155), Impact Ventures
($15M, carbon 18):
```
totalCommit = 50 + 150 + 15 = 215
wCarbon = (45·50 + 155·150 + 18·15) / 215 = (2250 + 23250 + 270) / 215 = 25,770 / 215 = 119.9
```
So the portfolio carbon intensity is 119.9, dominated by the large NA Buyout commitment — the correct
commitment-weighted result. But note this treats each fund's `carbon_intensity` as a black box; the
guide's method would instead roll up from each fund's holdings, normalising each holding's emissions by
its EVIC, which would surface *which portfolio companies* drive the 119.9.

### 7.5 Data provenance & limitations

- **Curated demo funds** (12, realistic PE metrics); editable and localStorage-persisted; no PRNG.
- **Carbon look-through is single-level only** — commitment-weighted fund carbon intensity, not the
  guide's two-level holding × EVIC roll-up.
- Carbon intensities are stored per fund, not computed from underlying positions.
- IRR excludes null funds (correct); TVPI/ESG include all funds.

**Framework alignment:** PCAF Financed Emissions (the guide's look-through — PCAF requires FoF investors
to weight underlying-fund emissions by their allocation and normalise by EVIC/AUM at each level) · SFDR
Article 6/8/9 product classification · GRESB (real-asset ESG benchmark) · standard PE performance metrics
(TVPI = total value/paid-in, DPI = distributions/paid-in, IRR). The performance and classification
analytics are sound; the carbon method is a simplification of the PCAF look-through.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The carbon footprint is a single-level fund-
weighted average; the PCAF two-level look-through is unbuilt. Below is the production model.

### 8.1 Purpose & scope
Compute a fund-of-funds financed-emissions footprint via full PCAF look-through to underlying holdings,
with data-quality scoring — for LP climate reporting (PCAF, SFDR PAI, CSRD).

### 8.2 Conceptual approach
The **PCAF two-level attribution** for funds/FoFs, benchmarked against **PCAF's Facilitated Emissions /
Fund investment guidance** and **MSCI/S&P Trucost** fund-carbon datasets, with a DQ score that degrades
where holding-level data is missing (fund-average proxy).

### 8.3 Mathematical specification
```
FE_fund_f = Σ_i AF_fi · (S1+S2+S3)_fi ,   AF_fi = Investment_fi / EVIC_fi        holding attribution
w_f       = Commitment_f / Σ Commitment                                          FoF weight
FE_FoF    = Σ_f w_f · FE_fund_f
Carbon_FoF= FE_FoF / Σ_f (w_f · NAV_f)                                           WACI-style intensity
DQ_FoF    = Σ_f w_f · DQ_f  ,  DQ_f = holding-weighted PCAF data-quality (1–5)
   fund-average fallback when holdings unavailable → DQ 5
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| S1/S2/S3_fi | holding emissions | CDP / vendor / EXIOBASE proxy |
| EVIC_fi | holding enterprise value | Bloomberg / Refinitiv |
| Commitment_f, NAV_f | FoF allocation | LP records (present) |
| DQ_f | PCAF data quality | PCAF DQ table |

### 8.4 Data requirements
Per fund: holding list with investment amount, EVIC, S1/S2/S3, or (fallback) a reported fund carbon
intensity + DQ. Sources: GP ESG reports, PCAF-aligned fund disclosures, MSCI/Trucost. The module already
holds commitment/NAV; it needs the holding-level layer.

### 8.5 Validation & benchmarking plan
Reconcile FE_FoF against GP-reported fund emissions and MSCI fund carbon data; validate the look-through
against a manual holding roll-up for one fund; track DQ improvement as holding data is sourced; check
SFDR PAI-1 consistency.

### 8.6 Limitations & model risk
Holding-level data from GPs is sparse (drives DQ to 5); EVIC timing distorts attribution; double-counting
across funds. Conservative fallback: use the fund-average intensity with DQ 5 where holdings are missing,
and flag the % of the book on proxy data.

## 9 · Future Evolution

### 9.1 Evolution A — Complete the two-level PCAF look-through (analytics ladder: rung 1 → 2)

**What.** §7 flags one precise gap in an otherwise sound module: the guide specifies a two-level PCAF look-through (`CF_FoF = Σ_f w_f × Σ_i (w_fi × EVIC_fi⁻¹ × Emissions_fi)`), weighting each fund by its FoF allocation and each underlying holding by its sub-fund weight with EVIC normalisation at both levels, but the code implements only the first level — a commitment-weighted average of each fund's stored `carbon_intensity`, with no holding-level roll-up and no EVIC normalisation. The rest (commitment-weighted TVPI/IRR/ESG, SFDR/GRESB analytics, editable localStorage portfolio) is genuine and correctly weighted. Evolution A builds the missing second level: ingest sub-fund holdings and compute financed emissions bottom-up per PCAF, weighting holdings by sub-fund weight and normalising by EVIC, with a documented proxy-with-DQ-penalty path where holdings are unavailable (the guide's own fallback).

**How.** (1) A holdings table per sub-fund; a look-through function computing `Σ_i w_fi·EVIC_fi⁻¹·Emissions_fi` per fund, then the outer commitment weighting. (2) A data-quality dashboard showing per-fund look-through coverage %, applying fund-level intensity proxies with a PCAF DQ penalty where coverage is low. (3) SFDR PAI aggregation reads the bottom-up figures.

**Prerequisites.** Sub-fund holdings data (even a curated demo set); EVIC/emissions for underlying names via the platform company master. **Acceptance:** the FoF carbon footprint recomputes from holding-level positions reproducing the two-level formula; funds with missing holdings show a coverage % and a DQ-penalised proxy, not a silent single-level average.

### 9.2 Evolution B — SFDR look-through disclosure copilot (LLM tier 2)

**What.** A copilot for FoF managers: "which sub-funds are dragging our FoF carbon intensity and transparency, and can we still classify Article 8?" tool-calls the Evolution A look-through and coverage endpoints, ranks sub-funds by contribution and by look-through gap, and drafts the SFDR PAI template with data-quality notes.

**How.** Tier-2 tool-calling over the look-through/PAI endpoints; the grounding corpus is §5/§7, which accurately encode the SFDR Delegated Regulation Annex I, PCAF Part A look-through, and PE performance metrics. The copilot's value is diagnosing which intermediated funds constrain the FoF ESG profile (low transparency or high intensity) and drafting compliant disclosure text with the coverage caveats explicit. Every intensity and coverage figure validated against tool output.

**Prerequisites.** Evolution A (single-level today can't answer holding-level attribution); RBAC-scoped fund data. **Acceptance:** every carbon-intensity, contribution, and coverage figure in a PAI draft traces to a tool call; the copilot flags sub-funds below a look-through threshold rather than presenting a proxy as measured.