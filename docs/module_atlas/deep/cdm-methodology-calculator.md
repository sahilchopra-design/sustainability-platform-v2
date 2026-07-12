## 7 · Methodology Deep Dive

The MODULE_GUIDES entry is faithful and detailed: the code implements CDM emission-reduction
calculators (ACM0002 grid electricity via TOOL07 combined-margin, ACM0014 waste-sector FOD, an
AMS small-scale suite), an IPCC GWP table (AR4/AR5/AR6), a grid-EF database, and a portfolio NPV. The
calculators are genuine CDM formulas; the 50-project portfolio is synthetic.

### 7.1 What the module computes

**ACM0002 grid electricity** (`acm2`):
```
BE_y = EG_y · EF_grid                       // baseline emissions
ER_y = BE_y − PE_y − LE_y                    // net emission reduction
EF_grid (combined margin) = w_OM·OM + (1−w_OM)·BM
```

**ACM0014 / waste (FOD baseline)** — the IPCC first-order landfill methane:
```
base = wasteTonnes · DOC · DOCf · F · (16/12) · MCF · (1 − oxidFactor)
```

**AMS small-scale suite** (`amsCalcs`):
```
amsID   = max(0, EG · EF − 500)                              // I.D grid renewable, minus baseline
amsIIC  = max(0, (BEC − PEC) · 0.00065 · hours)              // II.C demand-side EE
amsIIIF = animals · VS · B0 · MCF · 27.9 · 0.9 · 0.67 · 365 / 1000   // III.F manure methane
```

**Registry issuance netting:** `verified = submitted·(1−unc%)`, `net = verified·(1−unc%/2)`.

### 7.2 Parameterisation / scoring rubric

| Parameter | Value | Provenance |
|---|---|---|
| GWP100 (AR6) | CH₄ 27.9, N₂O 273 | `GWP_TABLE` — code/guide cite IPCC AR6 (note: 27.9, biogenic-inclusive) |
| Grid EF OM/BM/CM | India 0.820/0.740/0.780, China 0.680/0.610/0.650, Brazil 0.140/0.120/0.130 tCO₂/MWh | `GRID_EF` — realistic 2022 combined-margin values |
| Combined-margin weights | w_OM user-set (default 0.5/0.5) | CDM TOOL07 (0.5/0.5 for wind/solar) |
| FOD factors (DOC, DOCf, F 0.5, 16/12, MCF, oxid) | user-set | IPCC 2019 Waste |
| Registry price bands | CDM $2–3, GS $15–20, VCS $8–10 | `REG_PRICE` — realistic VCM/CER spot |
| 50 `PROJECTS` (ER, price, DQ, issued) | `sr()`-seeded | **Synthetic** PRNG demo data |

### 7.3 Calculation walkthrough

ACM0002 multiplies annual generation by a combined-margin grid EF (user-weighted OM/BM), then nets
project and leakage emissions. The country grid-EF row supplies OM/BM/CM. The waste calculator runs
the IPCC FOD baseline. The AMS suite computes three small-scale methodologies from their respective
inputs. The GWP tab shows AR4→AR6 percentage shifts (`(ar6/ar4−1)·100`). The portfolio NPV discounts
each project's carbon revenue over its crediting period. Monitoring-compliance status is `sr()`-gated.

### 7.4 Worked example (ACM0002, Indian wind farm)

`EG_y = 300,000 MWh`, India combined-margin EF (w_OM=0.75 for wind per TOOL07):
`EF_grid = 0.75·0.820 + 0.25·0.740 = 0.800 tCO₂/MWh`.

| Step | Computation | Result |
|---|---|---|
| Baseline BE_y | 300,000·0.800 | 240,000 tCO₂e |
| Project PE_y (wind ≈ 0) | — | ~0 |
| Leakage LE_y | ~0 | ~0 |
| **ER_y** | 240,000 − 0 − 0 | **240,000 tCO₂e/yr** |
| Carbon revenue (CER $2.5) | 240,000·2.5 | $600,000/yr |
| NPV (7 yr, ~5% disc, annuity 5.79) | 600,000·5.79 | ≈ **$3.47M** |

The ER matches the CDM ACM0002 baseline-minus-project logic exactly; the low CER price reflects the
guide's noted $0.5–2/tCO₂e CDM spot reality.

### 7.5 Data provenance & limitations
- Grid-EF and GWP tables are **real reference data**; the 50-project portfolio and monitoring status
  are **synthetic `sr()`-seeded** demo data.
- Combined margin is a user-weighted OM/BM, not a data-derived dispatch-based OM (TOOL07's "simple
  OM" vs "dispatch data OM"); build margin is a single value, not a 5-most-recent-capacity sample.
- No vintage-specific EF decay, no suppressed-demand adjustment for AMS methodologies, and leakage is
  user-entered rather than modelled.

**Framework alignment:** **CDM ACM0002 v20** (grid-connected electricity) and **TOOL07 v4**
(combined-margin grid EF) — the `w_OM·OM + (1−w_OM)·BM` structure is TOOL07's core. **CDM EB47 Annex
II** defines the combined-margin method. **IPCC AR6 GWP100** populates the GWP table. **AMS-I.D /
II.C / III.F** small-scale methodologies are implemented in `amsCalcs`. The Article 6.4 successor
(higher $5–30 prices noted in the guide) is referenced but not modelled.
