## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry claims the page implements the Ellen
> MacArthur Foundation **Material Circularity Indicator** — `MCI = 1 − LFI; LFI = (V + W)/(2F +
> 0.09); F = M − V − W` — with an "MCI Calculator tab", "Product Lifetime utility adjustment" and
> "5 supply chain tiers". **None of this exists in the code.** The actual tabs are Dashboard ·
> Company Screening · Material Flow · Waste Analytics; there is no MCI, LFI, utility factor, or
> supply-chain-tier logic anywhere in `CircularEconomyTrackerPage.jsx`. Every company score is a
> seeded-PRNG draw. Note the domain's backend (`circular_economy_engine.calculate_mci`) *does*
> implement a real (simplified) MCI, reachable at `POST /api/v1/circular-economy/mci` — but this
> page never calls it. The guide's LFI formula is also non-standard (EMF's published denominator
> is `2M + (W_F − W_C)/2`, not `2F + 0.09`). Sections below document the code as-is.

### 7.1 What the module computes

A 60-company circularity screener (real corporate names — Unilever, IKEA, Interface, Philips,
Apple, Veolia… — mapped to 10 sectors) with 18 synthetic metrics per company, all of the form
`lo + sr(i·k)·range` on the platform PRNG `sr(s)=frac(sin(s+1)·10⁴)`:

| Field | Formula | Range |
|---|---|---|
| `circularityScore` | `round(10 + sr(i·7)·80)` | 10–90 % |
| `wasteDiv` | `round(15 + sr(i·11)·80)` | 15–95 % |
| `recycledInput` | `round(5 + sr(i·13)·70)` | 5–75 % |
| `recyclability` | `round(20 + sr(i·17)·75)` | 20–95 % |
| `landfillPct` | `round(5 + sr(i·29)·50)` | 5–55 % |
| `eprCompliance` | `round(40 + sr(i·43)·55)` | 40–95 % |
| `totalWaste` / `diverted` | `100 + sr(i·61)·9900` / `50 + sr(i·67)·5000` | t |

Rating is a quantile rubric on the **same seed** as `circularityScore`
(`sr(i·7)`): `<0.15 Leader, <0.35 Advanced, <0.55 Progressing, <0.8 Developing, else Lagging` —
so rating and score are perfectly rank-correlated by construction (Leader ⇔ score < 22, since
low `sr(i·7)` gives a *low* score: the rating scale is **inverted** relative to the score —
"Leaders" are the *lowest*-scoring companies. A latent bug worth noting for refinement).

### 7.2 Static reference blocks

- **`MATERIALS`** (10 rows): recycled-vs-virgin split and flow (kt) per material — e.g.
  Plastics 32/68 (4,200 kt), Paper/Card 65/35, Textiles 12/88, Chemicals 8/92, Metals 58/42.
  Broadly consistent with published EU recycling rates but uncited; synthetic demo values.
- **`TREND`** (24 months, 2023-01…2024-12): drifting series with PRNG noise, e.g.
  `circularity = round(22 + i·0.8 + sr(i·7)·8)` — a deliberate upward drift (+0.8pp/month) with
  ±8pp noise; `landfill = 45 − i·0.5 + sr(i·17)·8` drifts down.
- **`WASTE_TYPES`**: Recycled 38 / Composted 12 / Energy Recovery 15 / Landfill 28 /
  Incinerated 7 (%; sums to 100).

### 7.3 Calculation walkthrough

1. **Dashboard KPIs** — full-universe means: `avg(k) = round(Σ COMPANIES[k]/60)` for
   circularity, diversion, recycled input, landfill; `leaders` counts rating ∈ {Leader, Advanced}.
2. **Sector chart** — group-by-sector means of circularity and diversion (accumulator map,
   divided by group count `n`).
3. **Radar** — universe means across 6 dimensions (circularityScore, wasteDiv, recycledInput,
   recyclability, materialEfficiency, designCircularity), fullMark 100.
4. **Screening table** — search/sector/rating filters, single-column sort on a **copied** array
   (`[...COMPANIES]`, no in-place mutation), 15-row pagination, expandable row with an 11-metric
   detail panel, per-company radar, and a waste-destination bar. CSV export via Blob download.
5. Colour badges use threshold triples, e.g. circularity `[25, 50, 70]` → red/amber/gold/green.

### 7.4 Worked example — company i = 0 (Unilever plc)

All seeds are `sr(0) ≈ 0.7098` where the multiplier is 0: `circularityScore = round(10 +
sr(0)·80) = round(10 + 56.8)` = **67%** (gold badge: 50 ≤ 67 < 70); rating uses the same draw
`sr(0)=0.7098` → falls in `[0.55, 0.8)` → **Developing** — despite the 67% score sitting in the
upper half, illustrating the inversion noted in §7.1. Dashboard KPI contribution: 67 enters the
60-company mean. If Unilever were the only "Consumer Goods" row, the sector bar would read 67.

### 7.5 Data provenance & limitations

- **All 60 company scorecards are synthetic** (`sr()` seeded) yet labelled with real corporate
  names; none reflect the companies' actual CDP/ESRS waste disclosures.
- The rating rubric contradicts the score (inverted mapping), and rating shares are fixed by
  the PRNG quantiles (~15% Leader, 20% Advanced, 20% Progressing, 25% Developing, 20% Lagging).
- `MATERIALS`, `WASTE_TYPES` are static snapshots; `TREND` is drift + noise, not history.
- No MCI/LFI despite the guide; no API call to the backend MCI endpoint; no supply-chain tiers.

### 7.6 Framework alignment

- **EMF MCI v1.3** — the guide's referenced framework. Actual EMF MCI:
  `MCI = max(0, 1 − LFI·F(X))` with `LFI = (V + W)/(2M + (W_F − W_C)/2)`, utility
  `F(X) = 0.9/X`, `X = (L/L_av)·(U/U_av)` — virgin feedstock V, unrecoverable waste W, mass M,
  lifetime/intensity ratios. Implemented (simplified) only in the backend engine.
- **GRI 306 (Waste 2020)** — the Waste Analytics tab's destination split (recycle/compost/
  recovery/landfill/incineration) matches GRI 306-4/306-5 categories conceptually.
- **EU CEAP 2020** — the 25% recycled-content ambition appears in the backend material-flow
  compliance check (`recycling_target_25pct`), not on this page.
- **ISO 14044** — cited in guide; LCA exists only backend-side (`perform_lca`).

## 8 · Model Specification — Entity MCI & Waste-Flow Measurement Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Replace synthetic company scorecards with measured circularity: product/entity MCI, waste
diversion, and recycled-content KPIs for the 60-name consumer/industrial universe, supporting
ESRS E5 benchmarking and engagement screening.

### 8.2 Conceptual approach

Adopt the **EMF MCI (Granta Design methodology v1.3)** at product level, aggregated to entity
level by mass or revenue weights, cross-checked against **WBCSD CTI v4.0 %-circular-inflow/
outflow** — the two dominant industry measurement frameworks. Waste destination series follow
**GRI 306** categories sourced from corporate filings, mirroring how S&P Trucost and CDP build
waste datasets.

### 8.3 Mathematical specification

```
V_p  = M_p·(1 − F_R − F_U − F_B)                 // virgin feedstock (mass M, recycled F_R,
W_0p = M_p·(1 − C_R − C_U − C_C − C_E)           //    reused F_U, biological F_B fractions)
W_Fp = M_p·(1 − E_F)·F_R ;  W_Cp = M_p·C_R·(1 − E_C)
LFI_p = (V_p + W_0p + (W_Fp + W_Cp)/2) / (2M_p + (W_Fp − W_Cp)/2)
X_p  = (L_p/L_av)·(U_p/U_av) ;  MCI_p = max(0, 1 − LFI_p·0.9/X_p)
MCI_entity = Σ_p w_p·MCI_p ,  w_p = mass or revenue share
Diversion = 1 − Landfill_t/TotalWaste_t          // GRI 306-5
```

| Parameter | Calibration source |
|---|---|
| Recycling process efficiencies `E_F, E_C` | EMF MCI methodology defaults (0.6–0.9 by material); Eurostat recycling-efficiency stats |
| Industry-average lifetime `L_av`, intensity `U_av` | EMF sector tables; Eurostat product-lifetime studies |
| Company fractions `F_R, C_R…` | CSRD ESRS E5-4/E5-5 datapoints; CDP water/waste modules; sustainability reports |
| Material recycled-content baselines | Eurostat `env_wasrt`, EPA Facts & Figures (free) — replaces static `MATERIALS` |
| Sector benchmarks | Circle Economy Circularity Gap Report; backend `MCI_BENCHMARKS` retained as fallback |

### 8.4 Data requirements

Entity: material inflow mass by feedstock type, waste by destination, product lifetimes —
extractable from ESRS E5 XBRL filings (2025+ wave) and CDP responses; vendor alternative: S&P
Trucost, Bloomberg ESG fields. Platform reuse: `calculate_mci` and `analyse_material_flows`
already accept exactly these inputs; only the ingestion + page wiring layer is missing.

### 8.5 Validation & benchmarking plan

Reconcile entity MCI against companies' self-published MCI/Circulytics scores (Interface,
Philips publish these; tolerance ±0.1); cross-validate diversion rates against GRI 306 tables in
annual reports for a 10-company sample; stability test: MCI must be monotone in F_R and C_R;
benchmark distribution against Circularity Gap Report's 7.2% global baseline.

### 8.6 Limitations & model risk

Corporate waste disclosure is inconsistent (boundary and unit differences); mass-based
aggregation is disclosure-limited, forcing revenue weights that distort material-heavy
segments; MCI ignores toxicity and downcycling quality. Fallbacks: PCAF-style data-quality
score (1–5) per entity, sector-median imputation flagged as estimated, and suppression of the
rating badge when >50% of inputs are imputed.
