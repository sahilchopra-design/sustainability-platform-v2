## 7 · Methodology Deep Dive

An **Indigenous Rights & FPIC tracker** covering 20 named real-world projects in indigenous
territories, scored on Free-Prior-Informed-Consent status and three rights frameworks (UNDRIP, ILO 169,
IFC PS7), with cultural-heritage, benefit-sharing and grievance data. The dataset is **hand-authored
from real projects** (Standing Rock/Dakota Access, Adani/Wangan-Jagalingou, Sami wind, Belo Monte…) —
no PRNG. The guide (EP-CO4) names a weighted FPIC compliance score which the code stores per-project as
component fields but does **not** compute as a single formula; documented below.

> ⚠️ **Guide↔code note.** The guide's `FPICScore = ConsentStatus(30) + ProcessQuality(25) +
> BenefitSharing(25) + GrievanceMech(20)` weighted composite is **not implemented as a formula**. The
> `PROJECTS` table carries the raw components (a `fpic` status string, UNDRIP/ILO169/IFC-PS7 sub-scores,
> benefit-sharing `revPct`, grievance counts) but there is no line that combines them into the 0–100
> weighted score. Views filter/aggregate the raw fields instead.

### 7.1 What the module computes

The module is primarily a **filtered dataset with aggregations**. The only derived quantities are
distributions and simple ratios:

```js
filtered   = fpicFilter==='All' ? PROJECTS : PROJECTS.filter(p=>p.fpic===fpicFilter)
FPIC_DIST  = counts by consent status  (Obtained 5, Pending 3, Contested 3, Withheld 3, Not Sought 4, Partial 2)
grievance resolution = resolved / grievances   (per project)
```

Rights-framework compliance is displayed directly from the three per-project sub-scores; cultural-
heritage risk from `sacredSites` count and `tkImpact` band.

### 7.2 Parameterisation — the PROJECTS table (real cases)

| Field | Meaning | Provenance |
|---|---|---|
| `fpic` | Consent status: Obtained / Pending / Contested / Withheld / Not Sought / Partial | Hand-coded per real case |
| `undrip`, `ilo169`, `ifcPs7` | 0–100 compliance sub-scores | Curated judgement against the three frameworks |
| `sacredSites` | count of affected sacred sites | Curated |
| `tkImpact` | Traditional-knowledge impact: Low…Critical | Curated |
| `revPct` | community revenue-share % | Curated benefit-sharing |
| `grievances` / `resolved` | grievance counts | Curated |

Representative rows: Māori Geothermal (NZ) — Obtained, UNDRIP 95, revPct 8.0, 1 grievance resolved;
Salween Dam (Myanmar) — Not Sought, UNDRIP 10, 12 sacred sites, 55 grievances, 0 resolved. The
correlation between consent status and compliance scores (obtained→high, not-sought→low) is
deliberately consistent — a curated dataset, not random.

### 7.3 Calculation walkthrough

`FPIC_DIST` tallies consent status for the donut chart. The dashboard KPIs count Obtained vs
Withheld/Not-Sought projects, average the three framework scores, and sum grievances/resolutions.
Rights-framework and cultural-heritage tabs read the sub-scores directly. There is no scoring engine —
the analytics are aggregations over the curated table.

### 7.4 Worked example (Pilbara Iron Ore Expansion)

| Field | Value | Guide-formula reconstruction (not in code) |
|---|---|---|
| fpic | Contested | ConsentStatus ≈ partial credit |
| UNDRIP / ILO169 / IFC-PS7 | 45 / 38 / 42 | avg ProcessQuality ≈ 42 |
| revPct | 2.0% | BenefitSharing low |
| grievances / resolved | 15 / 6 | GrievanceMech = 40% resolution |

Applying the guide's weights *as documentation* (not code): ConsentStatus≈15/30 + ProcessQuality
(42/100·25≈10.5) + BenefitSharing (low ≈8/25) + GrievanceMech (0.40·20=8) ≈ **41.5/100** — a
below-threshold FPIC score consistent with the "Contested" label. The code shows the components; it
does not run this sum.

### 7.5 Data provenance & limitations

- **Data is curated from real projects** — a genuine strength; **no `sr()` PRNG** anywhere. The specific
  0–100 sub-scores are the author's judgement, not sourced to a published benchmark (e.g. a
  case-by-case FPIC audit).
- The guide's **weighted FPIC score is not computed** — a reader wanting a single comparable score must
  combine the components manually.
- No temporal tracking (consent can be withdrawn); no linkage of grievance severity to financial risk.

**Framework alignment:** **UNDRIP** (Arts. 10, 19, 32 — FPIC as consent, not mere consultation) ·
**ILO Convention 169** (consultation + participation of indigenous peoples) · **IFC Performance
Standard 7** (which requires FPIC for projects with adverse impacts on indigenous lands, cultural
heritage or relocation). The module scores each project against all three and tracks consent status,
sacred-site and grievance data — the raw material for a FPIC compliance rating, which a production
version would formalise into the guide's weighted score with documented sub-criteria.
