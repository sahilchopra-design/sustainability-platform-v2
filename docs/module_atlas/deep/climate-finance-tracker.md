## 7 · Methodology Deep Dive

> ⚠️ **Engine↔page divergence.** Like `climate-finance-hub`, this tier-A page is backed by the same
> rigorous OECD-CRS engine (`climate_finance_engine.py`, E78 — Rio-marker counting, DAC mobilisation,
> honest-NULL policy) **but does not call it.** The page is a mostly-static climate-finance-flows
> dashboard: hard-coded (realistic) fund, donor and pipeline tables, plus a 50-row `sr()`-seeded
> transaction ledger and a seeded annual trend. It aggregates and sorts these on-page; it computes no
> Rio-marker attribution. The sections below document the page; §7.6 notes the engine.

### 7.1 What the module computes

The page's live logic is filtering, sorting, and aggregation over four datasets:

```
flows (50, seeded)  → filter by purpose/channel + search → sort → sum amountMn
FUNDS (6, real)     → per-fund pledged/disbursed/adaptation-mitigation split
DONOR_FLOWS (12)    → public/private/adapt/mitig/NCQG pledge per donor
PIPELINE (15)       → blended %, return %, risk, stage per project
annualTrend (8, seeded) → public/private/adaptation/total per year 2018–2025
targetSlider        → scales an NCQG progress view
```

The only arithmetic is sums, sorts, and CSV export — no financial model.

### 7.2 Parameterisation / provenance

| Dataset | Nature | Provenance |
|---|---|---|
| `flows` (50 rows) | type/channel/sector/amount/grantElement/coFinancingRatio | **`sr()`-seeded** (real category names) |
| `FUNDS` (6) | GCF $12.8 Bn pledged / $4.2 Bn disbursed / 228 projects… | **Hard-coded realistic** (GCF, AF, GEF, CIF, LDCF, L&D Fund) |
| `DONOR_FLOWS` (12) | USA $29.6 Bn total, Japan NCQG $20 Bn… | Hard-coded realistic donor figures |
| `PIPELINE` (15) | Sahel Solar $450M, blended 35 %, return 8.2 %… | Hard-coded illustrative deals |
| `annualTrend` | `55 + sr(i·3)×15 + i×5` etc. | **Seeded** with linear growth |
| `grantElement` | `20 + sr(i·47)×70` | Seeded (20–90 %) |
| `coFinancingRatio` | `1 + sr(i·53)×9` | Seeded leverage 1–10× |

### 7.3 Calculation walkthrough

1. **Global Dashboard** — headline stats from `FUNDS`/`DONOR_FLOWS`/`annualTrend`; public vs private
   area chart; the `targetSlider` scales a delivered-vs-target NCQG view.
2. **Fund-Level Analytics** — selects a fund; renders its adaptation/mitigation/cross-cutting split
   and disbursement ratio.
3. **Country-Level Flows** — sortable `DONOR_FLOWS` table; per-donor public/private and NCQG pledge.
4. **Investment Pipeline** — sortable `PIPELINE` filtered by stage; blended-finance % and return.
5. **Flow ledger** — the seeded 50-row transaction table, filter/sort/export.

### 7.4 Worked example — a fund's disbursement ratio

Green Climate Fund (`totalPledgedBn = 12.8`, `disbursedBn = 4.2`, adaptation 42 % / mitigation 38 % /
cross 20 %):

| Metric | Computation | Result |
|---|---|---|
| Disbursement ratio | 4.2 / 12.8 | **32.8 %** |
| Adaptation allocation | 12.8 × 0.42 | $5.38 Bn |
| Mitigation allocation | 12.8 × 0.38 | $4.86 Bn |
| Cross-cutting | 12.8 × 0.20 | $2.56 Bn |

These are read/derived from the hard-coded fund record — realistic but static, not tracked from live
CRS reporting.

### 7.5 Data provenance & limitations

- **Mixed provenance**: fund/donor/pipeline tables are hard-coded realistic figures; the 50-row flow
  ledger, annual trend, grant elements and co-financing ratios are **`sr()`-seeded**
  (`sr(seed) = frac(sin(seed+1)×10⁴)`).
- **The page does not invoke the E78 engine** — no Rio-marker counting, no DAC mobilisation
  multiplier, no honest-NULL. Co-financing "leverage" is a seeded 1–10× scalar.
- Reference figures (GCF pledges, NCQG donor pledges) are point-in-time and will age.

### 7.6 The available (unused) engine

`climate_finance_engine.py` implements CRS Rio-marker attribution (principal 100 % / significant
50 %), cross-cutting netting, OECD DAC mobilisation with observed-multiplier preference, Art. 2.1(c)
alignment, and NCQG contribution accounting — with a strict "real computation or honest NULL, no
RNG" policy. Wiring this page to it (as specified in §8) would replace the seeded ledger with
CRS-counted flows.

**Framework alignment:** OECD CRS Rio Markers, OECD DAC mobilisation, CPI Global Landscape 2023, NCQG
$300 Bn COP29 Baku, GCF/AF/GEF/CIF/LDCF/Loss & Damage fund architecture, UNFCCC Art. 2.1(c). The page
*presents* against these frameworks; the engine *implements* them.

## 8 · Model Specification — CRS-Counted Flow Ledger for the Tracker

**Status: specification — not yet implemented in code.** The page runs on seeded flows; this
specifies replacing them with engine-computed CRS attribution.

### 8.1 Purpose & scope
Replace the 50-row seeded ledger and seeded co-financing ratios with OECD-CRS-counted climate-finance
flows and DAC-mobilisation-based leverage, sourced from the E78 engine.

### 8.2 Conceptual approach
Consume `track_climate_finance` + `measure_mobilisation`, applying honest-NULL where inputs are
missing. Benchmarks: OECD CRS/DAC methodology and CPI Global Landscape accounting.

### 8.3 Mathematical specification
```
ClimateRelevant_flow = amount·(ccm==2?1: ccm==1?0.5:0) + amount·(cca==2?1: cca==1?0.5:0)
                       − min(mit, adapt)                         (cross-cut netting)
Mobilisation_ratio   = private_mobilised / public_committed      (observed preferred, else OECD typical)
NCQG_progress        = Σ delivered / donor NCQG_pledge
GrantEquivalent      = Σ flow · grant_element%
```
| Parameter | Source |
|---|---|
| ccm/cca markers | Reporting-entity CRS coding |
| Mobilisation multiplier | Observed or OECD DAC typical |
| Donor NCQG pledges | COP29 Baku pledges (already hard-coded) |

### 8.4 Data requirements
Instrument-level flows with Rio markers and public/private split fed to the engine; the fund/donor
reference tables already exist. The engine computes everything — the page needs an API call.

### 8.5 Validation & benchmarking plan
Reconcile CRS-counted totals against OECD DAC published climate-finance figures; verify honest-NULL
propagation; cross-check against CPI 2023 sector/geography shares and donor NCQG pledges.

### 8.6 Limitations & model risk
CRS self-reporting over-counts; mobilisation multipliers contested; NCQG pledges are political not
delivered. Conservative fallback: count significant markers at 50 % and show NULL rather than a
seeded co-financing ratio where mobilisation data is absent.
