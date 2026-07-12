## 7 · Methodology Deep Dive

> ⚠️ **Engine↔page divergence.** This tier-A module has **two layers that do not connect**. The
> backend engine (`climate_finance_engine.py`, E78) is genuinely rigorous — it implements OECD CRS
> Rio-marker counting (principal = 100 %, significant = 50 %), OECD DAC mobilisation multipliers, and
> an explicit *"no metric from a random number generator; honest NULL when input absent"* policy,
> with real CPI 2023 / NCQG reference data. **The React page does not call that engine.** Instead the
> page builds **60 `sr()`-seeded projects** across real fund names (GCF, AF, GEF, CIF…) with
> fabricated approved/disbursed/co-finance figures. So the platform *has* a real climate-finance
> tracking model, but the hub page you see is a seeded dashboard. Both layers are documented below.

### 7.1 What the backend engine computes (rigorous)

`track_climate_finance` — OECD CRS Rio-marker attribution over caller-supplied instruments:
```
ccm/cca_marker ∈ {0,1,2}    (unreported defaults to 0 — conservative, not random)
mitigation_counted = amount            if ccm==2
                   = amount × 0.5       if ccm==1
                   = 0                  if ccm==0
adaptation_counted = same logic on cca_marker
cross-cutting: min(mit, adapt) counted once; remainder split to mit/adapt buckets
climate_relevant = round(mitigation_counted + adaptation_counted)
```
`measure_mobilisation` prefers a **caller-observed** multiplier; only falls back to OECD DAC typical
multipliers (grants 1.5×, etc.) and returns **honest NULL** when the input is absent —
`calculate_ncqg_contribution` likewise nulls total-mobilised without a supplied multiplier.

### 7.2 What the page computes (seeded)

```
approved     = sr(i·19)×500 + 10                 ($10–510 M)
disbursed    = approved × (sr(i·23)×0.6 + 0.2)   (20–80 % of approved)
cofinance    = approved × (sr(i·29)×2 + 0.5)     (0.5–2.5× leverage — seeded, not OECD-derived)
emissions    = round(sr(i·41)×50 + 5)            (MtCO₂ avoided)
yearly[5]    = seeded approved/disbursed path per year
```

### 7.3 Parameterisation / provenance

| Data | Nature | Provenance |
|---|---|---|
| Engine `OECD_RIO_MARKERS` (12) | CCM/CCA/BD/… markers 0/1/2 | **Real** OECD CRS Rio-marker taxonomy |
| Engine `CPI_2023_DATA` | $1,265 Bn total, $4,300 Bn 2030 need, $3,035 Bn gap | **Real** CPI Global Landscape 2023 |
| Engine `MDB_INSTITUTIONS` (8) | WBG/ADB/EIB… climate share % | Real MDB climate finance data |
| Engine mobilisation multipliers | grants 1.0–2.5 (typ 1.5) | OECD DAC methodology |
| Page `FUNDS` (30) | GCF, AF, GEF… | Real fund names |
| Page `PROJECTS` (60) | approved/disbursed/cofinance/emissions | **`sr()`-seeded** |
| Page project type | Mitigation/Adaptation/Cross-cutting/Loss & Damage | Seeded pick |

### 7.4 Worked example — CRS Rio-marker counting (engine)

Instrument: `amount = $100M`, `ccm_marker = 1` (significant mitigation), `cca_marker = 2` (principal
adaptation):

| Step | Computation | Result |
|---|---|---|
| mitigation_counted | 100 × 0.5 (ccm=1 significant) | $50 M |
| adaptation_counted | 100 (cca=2 principal) | $100 M |
| cross-cutting | min(50, 100) counted once | $50 M |
| net mitigation | 50 − 50 | $0 M |
| net adaptation | 100 − 50 | $50 M |
| climate_relevant | round(50 + 100) | **$150 M** |

This correctly applies CRS avoidance of double-counting: the overlapping $50 M is booked as
cross-cutting, not double-counted into both mitigation and adaptation totals.

### 7.5 Data provenance & limitations

- **The engine follows a strict data-integrity policy** (real computation or honest NULL, no RNG) —
  a model of good practice.
- **The page is `sr()`-seeded** (`sr(seed) = frac(sin(seed+1)×10⁴)`) with real fund names but
  fabricated financials; its co-finance "leverage" (0.5–2.5×) is a seeded scalar, not an OECD DAC
  mobilisation multiplier computed by the engine.
- The page does **not invoke** `track_climate_finance` / `measure_mobilisation`, so the rigorous
  Rio-marker and mobilisation logic never reaches the UI.
- Reference figures (CPI $1,265 Bn, NCQG $300 Bn Baku) are point-in-time and will age.

**Framework alignment:** OECD CRS Rio Markers (the engine implements the 0/1/2 significance counting
exactly); OECD DAC mobilisation methodology (multipliers for private-finance leverage); UNFCCC Art.
2.1(c) alignment (`assess_article21c_alignment`); CPI Global Landscape 2023 and NCQG $300 Bn COP29
Baku reference data; MDB Joint Report tracking. The engine needs no §8 (it is already a valid model);
the production gap is **wiring the page to the engine** so the dashboard shows CRS-counted, honest-
NULL-aware figures instead of seeded projects.

## 8 · Model Specification — Wire the Hub Page to the CRS Tracking Engine

**Status: specification — not yet implemented in code.** The rigorous engine exists but the page runs
on seeded data; this specifies the integration and the mobilisation model the page should surface.

### 8.1 Purpose & scope
Replace the page's seeded `PROJECTS` with engine-computed climate-finance flows: CRS-counted
mitigation/adaptation, OECD DAC private mobilisation, and NCQG contribution accounting.

### 8.2 Conceptual approach
Consume `track_climate_finance` + `measure_mobilisation` from the E78 engine, presenting honest-NULL
where inputs are missing. Benchmarks: OECD CRS/DAC methodology and CPI Global Landscape accounting.

### 8.3 Mathematical specification
```
ClimateRelevant = Σ_inst [ amount·(ccm==2?1: ccm==1?0.5:0) + amount·(cca==2?1: cca==1?0.5:0)
                           − min(mit_i, adapt_i) ]                       (cross-cut netting)
PrivateMobilised = Σ_inst public_i · multiplier_i    (observed multiplier preferred, else OECD typical)
NCQG_contribution= grant_equiv + mobilised_private   (null if multiplier unsupplied)
FossilExposure   = Σ inst.fossil_fuel_amount_usd     (caller-supplied only)
```
| Parameter | Source |
|---|---|
| ccm/cca markers | Reporting entity CRS coding |
| Mobilisation multiplier | Observed (reported) or OECD DAC typical |
| Reference totals | CPI 2023 / NCQG $300 Bn |

### 8.4 Data requirements
Real instrument-level flows with Rio markers, public/private split, and (where available) observed
mobilisation multipliers — fed to the existing engine endpoints. The engine already computes
everything; the page needs an API call, not new maths.

### 8.5 Validation & benchmarking plan
Reconcile engine output against a reporting entity's published CRS climate-finance total; verify
honest-NULL propagation to the UI (no fabricated fills); cross-check aggregate against CPI 2023
sector shares.

### 8.6 Limitations & model risk
CRS marker self-reporting is known to over-count; mobilisation multipliers are contested. Conservative
fallback: display significant-marker flows at 50 % and show NULL rather than a seeded estimate where
mobilisation data is absent — exactly the engine's existing behaviour.
