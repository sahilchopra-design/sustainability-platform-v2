## 7 · Methodology Deep Dive

The `net_zero_targets` domain (`/api/v1/net-zero-targets`) is powered by
`net_zero_targets_engine.py` (E33). It validates corporate/FI decarbonisation targets
against SBTi, SBTi FLAG, NZBA, NZAMI and NZAOA, derives an implied temperature score, and
generates a year-by-year decarbonisation pathway.

### 7.1 What the module computes

Four deterministic operations, all pure functions of caller inputs:

1. **Pathway classification** (`_derive_pathway`) — maps a near-term reduction % to an SBTi
   pathway by threshold.
2. **Temperature score** (`_derive_temperature_score`) — a lookup from 2030 reduction % to
   an implied warming °C.
3. **Pathway generation** (`generate_pathway`) — linear interpolation of a required-emissions
   glidepath between base year, the 2030 milestone, and net-zero.
4. **Compliance check** (`check_framework_compliance`) — a penalty-based 0–100 compliance %.

The engine's docstring stresses honesty: any metric requiring data the caller has **not**
supplied (Scope-3 coverage, abatement cost, achieved-vs-required projection) is returned as
`None` / `"insufficient_data"` rather than fabricated.

### 7.2 Parameterisation / scoring rubric

**SBTi pathway minimums** (`SBTI_PATHWAYS`):

| Pathway | Near-term min % | Long-term min % | Residual max % | Implied °C |
|---|---|---|---|---|
| 1.5 °C | 50 | 90 | 10 | 1.5 |
| Well-below 2 °C | 30 | 80 | 20 | 1.7 |
| 2 °C | 25 | 70 | 30 | 2.0 |

**Temperature benchmarks** (`TEMPERATURE_SCORE_BENCHMARKS`, first threshold that a 2030
reduction % meets or exceeds):

| 2030 reduction ≥ | Implied °C | Classification |
|---|---|---|
| 60% | 1.5 | 1.5 °C aligned |
| 45% | 1.7 | Well-below 2 °C |
| 30% | 2.0 | 2 °C aligned |
| 20% | 2.5 | Below 3 °C |
| 10% | 3.0 | 3 °C pathway |
| 0% | 4.0 | No credible target |

**Framework configs** (`FRAMEWORK_CONFIGS`) set per-framework minimums and eligible entity
types — e.g. SBTi Corporate near-term 42% / long-term 90% (validation required); SBTi FLAG
30% / 72% (land-sink credits allowed); NZBA banks-only with 2030 financed-emissions coverage.
**Sector pathways** (`SECTOR_PATHWAYS`) carry IEA/SBTi 2030/2040/2050 decarbonisation % for
12 sectors (power 45/80/100, oil & gas 15/40/60, steel 20/50/90 …). **Provenance:** values
are the public SBTi/NZBA/IEA-NZE headline figures encoded as constants.

### 7.3 Calculation walkthrough

`assess_targets` derives `sbti_pathway` and `temperature_score` from `near_term_reduction_pct`,
computes `pathway_gap_pct = max(0, framework_near_min − near_term_pct)`, then accumulates
validation issues (below-minimum reduction, ineligible entity type, net-zero year beyond the
framework deadline). `framework_compliant = (len(issues) == 0)`.

`generate_pathway` builds records at 5-year steps. Required reduction is piecewise linear:

```
yr ≤ 2030:  required = reduction_2030 · (yr−base)/(2030−base)
yr > 2030:  required = reduction_2030 + (reduction_2050−reduction_2030)·(yr−2030)/(nz−2030)
required_emissions = base_emissions · (1 − required/100)
```

When the caller supplies no per-year projection, `projected == required` (on-track, gap = 0)
— no fabricated deviation.

`check_framework_compliance`: `compliance_pct = max(0, 100 − 20·gaps − 5·warnings)`;
compliant when ≥ 80.

### 7.4 Worked example

Corporate, framework `sbti`, base year 2019, base emissions 1,000,000 tCO₂e,
near-term reduction 55% by 2030, long-term 92% by 2050, net-zero 2050.

- **Pathway:** 55 ≥ 50 → **1.5 °C**. **Temperature:** 55 < 60 but ≥ 45 → **1.7 °C /
  "Well-below 2 °C"**. (The 55% target *classifies* as 1.5 °C pathway but its 2030 depth maps
  to 1.7 °C implied warming — the two lookups are intentionally distinct.)
- **Pathway gap:** `max(0, 42 − 55) = 0`. No near-term issue.
- **Glidepath 2030:** required `= 55·(2030−2019)/(2030−2019) = 55%` → `1,000,000·0.45 =
  450,000 tCO₂e`. **2050:** `55 + (92−55)·1 = 92%` → `80,000 tCO₂e`.
- **Compliance:** near-term 55 ≥ 42 OK; long-term 92 ≥ 90 OK; if `sbti_validated` not
  confirmed and validation required → 1 gap → `100 − 20 = 80` → **compliant (=80)**.

### 7.5 Data provenance & limitations

- **No synthetic-PRNG fabrication.** All outputs are deterministic; missing inputs surface as
  explicit nulls / `insufficient_data`.
- Temperature scoring is a coarse 6-band step function of the 2030 reduction only; it does not
  integrate the full emissions trajectory or overshoot, as a genuine ITR model would.
- Pathway interpolation is linear between three anchor points — no sectoral decarbonisation
  curve conditioning even though `SECTOR_PATHWAYS` is available as reference data.
- Validation status is a lifecycle stage (committed/submitted), not a live SBTi registry lookup.

**Framework alignment:** **SBTi Corporate Net-Zero Standard** — near-term ≥42% (1.5 °C
cross-sector) and long-term ≥90% with ≤10% residual offsetting are the actual standard's
thresholds. **SBTi FLAG** — land-sector guidance with land-sink removals. **NZBA / NZAMI /
NZAOA** — the three finance-sector alliances; the engine encodes their coverage and interim
targets (NZAOA's 5-year interim, NZBA's 2030 financed-emissions coverage). Implied
temperature scoring approximates the **SBTi/CDP temperature-rating** approach of mapping
target ambition to a warming outcome.
