## 7 · Methodology Deep Dive

### 7.1 What the module computes

For 80 synthetic properties across 6 sectors, the module builds a **whole-life carbon** profile
(operational + embodied) and derives CRREM alignment, PCAF-style attributed financed emissions,
and net-zero gap metrics — genuinely matching the guide's PCAF/CRREM/RICS framing, with one
material gap (§7.2).

```
WholeLifeCarbon = OperationalCarbonTotal + EmbodiedCarbonTotal
OperationalCarbonTotal = OCI × GIA × 60yr / 1000                       (t, 60-year assessment period)
EmbodiedCarbonTotal    = (A1A3 + A4A5 + B_maint + C_demolition + D_reuse) × GIA / 1000
PCAF_Attributed        = WholeLifeCarbon × OwnershipPct / 100
```

`OCI` = operational carbon intensity (kgCO₂/m²/yr), driven by EPC grade; `GIA` = gross internal
area (m²). The backend engine (`backend/services/real_estate_carbon_analytics_engine.py`) is a
17-line stub (`summarise()` — count/total/avg only, tagged `TODO(owner): add the module's real
scenario/what-if methods`); **all of the above logic lives client-side** in
`RealEstateCarbonAnalyticsPage.jsx`.

### 7.2 Parameterisation — constants and their provenance

| Constant | Values | Provenance |
|---|---|---|
| `EPC_OCI` (kgCO₂/m²/yr by grade) | A:18, B:32, C:55, D:82, E:115, F:155, G:200 | Synthetic demo scale — ordinally correct (worse EPC ⇒ higher OCI) but not sourced from a national EPC methodology (e.g. UK SAP) |
| `EMBODY_BENCH` (A1-A3 / A4-A5, kgCO₂e/m²) | Office 380/95, Retail 340/80, Industrial 260/65, Residential 420/105, Hotel 450/115, Mixed-Use 400/100 | Synthetic sector benchmarks; broadly consistent with published RICS WLC benchmark *ranges* but presented as point values |
| `CRREM` budgets (kgCO₂/m²/yr, 2025) | Office 35/45 (1.5°C/2°C), Retail 40/52, Industrial 60/78, Residential 25/33, Hotel 45/58, Mixed-Use 38/49 | Labelled "CRREM 1.5°C and 2°C pathways" but are synthetic placeholders, not the actual CRREM v2 published per-country/sector budget table |
| Carbon price sensitivity | £50/75/100/150/200 per tCO₂ | Matches guide's "€50–150/tCO₂ pricing scenarios" range (converted to £) |
| Assessment period | 60 years | RICS Whole Life Carbon Assessment standard convention |
| B-stage maintenance | `120 + sr()×180` kgCO₂e/m² | Synthetic — no maintenance-schedule model behind it |
| D-stage reuse credit | `−(10 + sr()×50)` kgCO₂e/m² | Synthetic negative (EN 15978 "Module D" benefit convention correctly applied as a credit) |

**Gap vs guide:** the guide's headline data point "PCAF DQ Score Target ≤2.5 (PCAF Standard Part C
2022)" is **not implemented anywhere in the code** — no `dqScore`/data-quality field exists on any
property record. The PCAF attribution formula itself is also simplified: the guide states
`Attribution_i = OutstandingLoan_i / PropertyValue_i` (a lender's loan-to-value share), but the
code instead uses a synthetic `ownershipPct` (5–100%, `round(5 + sr(i*29)*95)`) directly as the
attribution fraction — a reasonable equity-ownership proxy, but not the loan-based PCAF formula
the guide quotes. See §8 for a specification closing the DQ-score gap.

### 7.3 Calculation walkthrough

1. **Per-property build** (seed, 80 rows): sector/region/EPC/GIA/age/ownership drawn from `sr()`;
   embodied stages computed off sector benchmarks ± noise; OCI off EPC base ± noise (`0.88–1.12×`).
2. **CRREM overshoot**: `overshoot15 = max(0, OCI − budget15)`; `aligned15 = (overshoot15 === 0)`.
   Stranding year is a closed-form decay approximation: `strandYr15 = min(2045, 2025 + (budget15 /
   (overshoot15+1))×6 + noise)` when not aligned, else fixed at 2060 — an algebraic proxy for "how
   fast does the gap close," not an actual pathway-intersection solve.
3. **PCAF attribution**: `pcafAttr = wholeLifeCarbon × ownershipPct/100`; `pcafPerM2 = pcafAttr ×
   1000 / gia`.
4. **Valuation**: `valuePerM2 = 3000 + epcIdx×(−200) + sr()×4000` (£/m²) — EPC grade lowers
   value-per-m² linearly by £200/notch, consistent with the "green premium" literature direction
   though the £200/notch figure is a synthetic constant, not fitted to market data.
5. **Carbon cost**: `annualOpCarbon × {50,100,150}` (£) at three carbon-price points, plus a
   5-point sensitivity table (`costSensData`) at £50/75/100/150/200.
6. **Portfolio aggregation** (`totals`): simple means/sums over `filtered` (sector/region/EPC
   filters applied) — `pctAligned15/20`, `avgNzGap15`, `totalCarbonCost = totalAnnualOp × carbonPx`
   (carbonPx is a user-adjustable slider, default £100).
7. **CRREM pathway chart** (`crremPathway`): portfolio-average OCI decayed by an assumed **35%
   improvement by 2050** (`decay = (i/5)×0.35`) against budget lines that themselves decay
   geometrically (`budget15 × 0.965^(5i)`, `budget20 × 0.975^(5i)`) — two independently-decaying
   series whose crossover is illustrative, not solved from a real retrofit capex schedule.
8. **Net-zero timeline** (`nzTimeline`): `avgNzGap15 × (1 − (i/5)×0.40)` — an assumed **40% gap
   closure by 2050**, distinct from the pathway chart's 35% OCI improvement assumption (the two
   "improvement" figures are not reconciled with each other).

### 7.4 Worked example

Property with `sector=Office` (`EMBODY_BENCH` a1a3=380, a4a5=95), `epc=D` (`EPC_OCI[D]=82`),
`gia=5,000 m²`, `ownershipPct=60%`, synthetic noise draws all at their midpoint (~1.0×):

| Step | Formula | Result |
|---|---|---|
| A1-A3 | `380 × 1.0` | 380 kgCO₂e/m² |
| A4-A5 | `95 × 1.0` | 95 kgCO₂e/m² |
| B maintenance | `120 + 0.5×180` | 210 kgCO₂e/m² |
| C demolition | `15 + 0.5×40` | 35 kgCO₂e/m² |
| D reuse | `−(10 + 0.5×50)` | −35 kgCO₂e/m² |
| Embodied total | `380+95+210+35−35` | **685 kgCO₂e/m²** |
| OCI | `82 × 1.0` | 82 kgCO₂/m²/yr |
| Op. carbon (60yr) | `82 × 5,000 × 60 / 1000` | 24,600 t |
| Emb. carbon | `685 × 5,000 / 1000` | 3,425 t |
| **Whole-life carbon** | `24,600 + 3,425` | **28,025 t** |
| CRREM 1.5°C overshoot | `82 − 35` | 47 kgCO₂/m²/yr (not aligned) |
| PCAF attributed | `28,025 × 0.60` | **16,815 t** |
| Annual op. carbon | `82 × 5,000/1000` | 410 t/yr |
| Cost at £100/t | `410 × 100` | **£41,000/yr** |

### 7.5 CRREM alignment & net-zero gap rubric

| Metric | Rule |
|---|---|
| `aligned15` | `OCI ≤ budget15[sector]` |
| `nzGap15` | `round(overshoot15 / OCI × 100)` when not aligned, else 0 — i.e. the % of current intensity that must be cut |
| Stranding year (1.5°C) | closed-form proxy, capped 2025–2045 |

### 7.6 Companion analytics

Sector summary table, EPC-vs-OCI bar, embodied-carbon lifecycle stage breakdown (A1-A3/A4-A5/
B/C/D), carbon-price sensitivity, PCAF-by-sector bar, GIA-vs-whole-life-carbon scatter (first 50
filtered properties), and a **Regulatory** tab listing 7 real frameworks (TCFD, SFDR, CSRD, UK
SDR, GRESB, NABERS, UKGBC Net Zero Carbon Buildings) with status flags — descriptive, not wired
into any calculation.

### 7.7 Data provenance & limitations

- **All 80 property records are synthetic**, generated by `sr(seed)=frac(sin(seed+1)×10⁴)`. The
  fallback dataset also seeds `backend/scripts/data/real_estate_carbon_analytics.json`; when the
  API is reachable the page renders DB rows instead of the inline `PROPERTIES_SEED`, but the DB
  seed itself was generated by the same PRNG.
- The backend "engine" does not implement the module's real calculations — everything (embodied
  carbon, CRREM alignment, PCAF attribution, carbon cost) is computed client-side, so there is no
  server-side, auditable, single source of truth for these numbers as the engine file's own
  docstring claims to provide.
- No PCAF Data Quality (1–5) score is computed despite being a named guide data point — see §8.
- CRREM budgets are illustrative constants, not the actual CRREM v2 pathway file values.
- Two independent "improvement by 2050" assumptions (35% OCI decay vs 40% gap closure) are not
  reconciled — a retrofit capex-linked single improvement trajectory would be more defensible.

**Framework alignment:** PCAF Standard Part C (Real Estate, 2022) — attribution concept present,
loan-based formula substituted with an ownership-percentage proxy · CRREM v2 — pathway concept and
1.5°C/2°C dual budgets present, values are placeholders · RICS Whole Life Carbon Assessment / EN
15978 — A1-A5/B/C/D staging correctly structured, including the Module D credit sign convention ·
SBTi Buildings sector guidance — referenced in guide, not separately computed (no SBTi target
pathway distinct from CRREM appears in code) · TCFD/CSRD/SFDR/UK SDR/GRESB/NABERS — listed as
regulatory context, not computationally wired in.

## 8 · Model Specification — PCAF Data Quality Score

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce the PCAF Data Quality (DQ) score (1 = best, 5 = worst) per property and portfolio-weighted,
so financed-emissions disclosures meet PCAF's own reporting requirement to disclose the quality of
underlying data — currently entirely absent despite being a named guide data point ("PCAF DQ Score
Target ≤2.5"). Scope: same 80-asset real estate book as the rest of the module.

### 8.2 Conceptual approach
Implement PCAF Part C's **5-tier data quality hierarchy** directly, mirroring how PCAF Financed
Emissions is already scored elsewhere on this platform (`pcaf-financed-emissions` module's `avgDqs`
pattern) — reuse that scoring convention here for consistency across PCAF-branded modules, and
benchmark against **CRREM's own data-confidence tiering** (measured vs estimated vs default-factor
energy data) which uses an analogous concept for building-level pathway inputs.

### 8.3 Mathematical specification

```
DQ_i = 1   if OCI from sub-metered energy bills + verified GIA + independently audited EPC
DQ_i = 2   if OCI from utility billing data + verified GIA
DQ_i = 3   if OCI from EPC estimate (asset rating, not actual consumption) + verified GIA   ← default for this module's synthetic EPC-derived OCI
DQ_i = 4   if OCI from sector-average/default factor + estimated GIA
DQ_i = 5   if OCI wholly modelled, no site data

Portfolio_DQ = Σ_i (PCAF_Attributed_i × DQ_i) / Σ_i PCAF_Attributed_i        (financed-emissions-weighted average)
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| Tier definitions | 1–5 hierarchy of energy-data provenance | PCAF Global GHG Accounting Standard, Part C (2022), Table 3 |
| Weighting basis | attributed emissions, not floor area | PCAF Standard §3.4 (portfolio DQ score is emissions-weighted) |

### 8.4 Data requirements
- A `dataSource` field per property (`metered` / `billed` / `epc_estimate` / `sector_default` /
  `modelled`) — not currently in `PROPERTIES_SEED`; would need one categorical field added to the
  seed generator and the DB schema (`backend/scripts/data/real_estate_carbon_analytics.json`).
- No external data needed beyond the PCAF tier table itself (public, free).

### 8.5 Validation & benchmarking plan
- Confirm portfolio DQ score falls in PCAF's reportable range (1.0–5.0) and that the ≤2.5 target
  stated in the guide is achievable only when ≥50% of the book is on tier 1-2 (metered) data —
  cross-check against the platform's own `pcaf-financed-emissions` module DQ distribution for
  consistency of DQ tiering logic across modules.
- Sensitivity: show how Portfolio_DQ moves if EPC-estimate properties (tier 3, currently the
  module's implicit default) are progressively replaced by metered data.

### 8.6 Limitations & model risk
- Without real per-property metadata on how OCI was actually sourced, any DQ score assigned to
  synthetic demo data is itself illustrative — the honest interim step is to hard-code DQ=3 for
  every synthetic property (EPC-estimate tier, matching how `OCI` is actually derived in this
  module today) rather than presenting an unearned 1 or 2.
- Portfolio DQ should never be lower (better) than the tier of its lowest-quality material
  holding without disclosure — a single "average" figure can mask concentrated data-quality risk
  in the largest attributed-emissions properties.
