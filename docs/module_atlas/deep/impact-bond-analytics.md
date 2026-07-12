## 7 · Methodology Deep Dive

An **impact-bond universe** page (15 SIBs/DIBs/development/sustainability bonds) tracking SROI,
outcome achievement (actual vs target) and additionality. Unusually for the impact family, the bond
data is a **hand-authored table of real instruments** (Peterborough SIB, Educate Girls DIB, IFFIm
Vaccine Bond…), not PRNG-generated — so the module is descriptive rather than computational. Code and
guide (EP-CQ6) agree.

### 7.1 What the module computes

There is very little derived computation — the page is a curated dataset with filter/aggregate views.
The only headline "formula" is the guide's SROI ratio, which is stored per-bond (`sroi`), not computed:

```
SROI = SocialValue_created / Investment_amount        (stored as bond.sroi, e.g. 3.2×)
Outcome achievement = outcomeActual / outcomeTarget    (e.g. 82/75 = 109%)
```

Portfolio views: type filter (`BONDS.filter(b=>b.type===typeFilter)`), type distribution pie, an
`SROI_DIMS` radar (6 fixed dimension scores), and per-bond outcome/additionality bars.

### 7.2 Parameterisation — the BONDS table (real instruments)

| Bond | Type | Amount ($M) | SROI | Actual/Target | Additionality | Sector |
|---|---|---|---|---|---|---|
| Peterborough SIB | SIB | 5 | 3.2× | 82/75 | 85 | Criminal Justice |
| IFFIm Vaccine Bond | Development | 6 500 | 4.5× | 95/90 | 92 | Health |
| Educate Girls DIB | DIB | 0.27 | 5.8× | 116/100 | 88 | Education |
| Cameroon Cataract Bond | DIB | 2 | 6.2× | 105/95 | 90 | Health |
| DC Water EIB | EIB | 25 | 2.8× | 78/80 | 72 | Water/Env |
| … (15 total) | | | | | | |

`SROI_DIMS` (Social Value 82, Cost Efficiency 75, Beneficiary Reach 88, Outcome Sustainability 68,
Stakeholder Satisfaction 78, Scalability 62) are **fixed portfolio-level scores**, not per-bond.
`TYPE_DIST` counts (SIB 5, DIB 4, Sustainability 3, Development 2, EIB 1) tally the 15 bonds.

These are recognisable real-world impact bonds with broadly plausible published SROI figures — the
data is curated, not fabricated, though the specific SROI/additionality numbers are indicative.

### 7.3 Calculation walkthrough

`types` de-dupes the bond-type set for the filter dropdown. `filtered` applies the type filter.
Aggregate KPIs (average SROI, average additionality, total volume) are simple reductions over
`filtered`. Charts read the bond fields directly — there is no attribution, discounting or
counterfactual model.

### 7.4 Worked example (Educate Girls DIB)

| Field | Value | Reading |
|---|---|---|
| SROI | 5.8× | $1 invested → $5.80 social value (stored, not recomputed) |
| Outcome | 116 / 100 | **116%** of target learning-outcome gain achieved |
| Additionality | 88 | high — outcomes attributed to the DIB vs counterfactual |

Portfolio average SROI across the 15 bonds ≈ 3.9× (guide quotes 3.2× as an illustrative average).

### 7.5 Data provenance & limitations

- Bond data is **hand-authored from real instruments** — no `sr()` PRNG in this module. This is a
  strength; the caveat is that the SROI/additionality figures are indicative snapshots, not sourced
  to each bond's published evaluation.
- **SROI is stored, not modelled** — there is no social-value monetisation, discount rate, deadweight
  or attribution calculation behind the ratio. A production SROI engine would compute
  `Σ(outcome × financial proxy × (1−deadweight) × attribution) / investment` per the SROI Network
  methodology.
- Additionality is a single 0–100 score, not decomposed into enterprise vs investor additionality.

**Framework alignment:** **SROI** (Social Value International / SROI Network) — the ratio the module
displays is the SROI framework's headline metric; a full SROI is derived by monetising outcomes with
financial proxies, netting deadweight/attribution/drop-off, and discounting future value ·
**Impact Management Project (IMP)** five dimensions and **GIIN IRIS+** inform the outcome/additionality
framing. The module is a credible universe tracker; the SROI and additionality numbers would need
bond-level evaluation reports to be decision-grade.
