## 7 · Methodology Deep Dive

### 7.1 What the module computes

Like its sibling `regional-climate-impact`, this module's core dataset — 10 named fossil-dependent
regions (Appalachia, Ruhr Valley, Silesia, Queensland, Alberta, Mpumalanga, Shanxi, Jharkhand,
Kuznetsk, Yorkshire) — is **hand-curated**, with no PRNG in the file. The only live arithmetic is
a user-adjustable I/O multiplier applied to one time-series chart, plus a simple fiscal-gap
subtraction:

```js
fiscalGap = royaltiesLost - greenTaxBase                        // $Bn, per region
indirect_scaled = MULTIPLIER_DATA.indirect × (userMultiplier / 1.8)   // rescale vs 1.8x baseline
induced_scaled  = MULTIPLIER_DATA.induced  × (userMultiplier / 1.8)
totalDirect = Σ filtered.directJobs
totalRoyalties = Σ filtered.royaltiesLost
```

**Important limitation**: the user-adjustable "I/O multiplier" slider (1.0×–3.0×, default 1.8×)
only rescales the separate `MULTIPLIER_DATA` time-series chart (a stylised 2025–2040 job-loss
trajectory) — it does **not** recompute each region's own `indirectJobs`/`inducedJobs` fields,
which remain fixed regardless of the slider position. A user who sets the multiplier to 3.0× will
see the trajectory chart change but the regional employment table stay static, an internal
inconsistency for a tool centred on "Input-Output Model" as a named tab.

### 7.2 Parameterisation — the 10-region dataset

| Region | GDP ($Bn) | Fossil share | Direct jobs | Royalties lost ($Bn) | Gini now→proj. | Migration rate |
|---|---|---|---|---|---|---|
| Appalachia US | 42 | 28% | 18,500 | 1.8 | 0.42→0.47 | −2.8% |
| Ruhr Valley DE | 118 | 8% | 12,200 | 0.6 | 0.31→0.33 | −0.8% |
| Silesia PL | 38 | 22% | 42,000 | 1.2 | 0.34→0.39 | −3.5% |
| Queensland AU | 95 | 18% | 28,000 | 4.2 | 0.33→0.36 | −1.5% |
| Alberta CA | 210 | 25% | 65,000 | 8.5 | 0.35→0.40 | −2.2% |
| Mpumalanga ZA | 15 | 42% | 82,000 | 1.5 | **0.63→0.68** | −5.1% |
| Shanxi CN | 68 | 35% | 320,000 | 3.8 | 0.38→0.42 | −3.8% |
| Jharkhand IN | 22 | 38% | 180,000 | 0.8 | 0.36→0.43 | −4.5% |
| Kuznetsk RU | 28 | 45% | 95,000 | 2.1 | 0.41→0.48 | −4.2% |
| Yorkshire UK | 82 | 4% | 3,200 | 0.2 | 0.33→0.34 | −0.3% |

Directionally plausible and internally consistent: regions with the highest fossil-fuel GDP share
(Kuznetsk 45%, Mpumalanga 42%) also show the largest projected Gini deterioration and steepest
population outflow, matching the just-transition literature's expectation that fossil-dependent
regions face compounding inequality and out-migration risk. Absolute figures are illustrative
(guide labels "Analysis"/"Model" rather than a specific dataset) and should not be cited as
verified statistics without independent confirmation.

### 7.3 Calculation walkthrough

1. **Regional Economy Dashboard**: filterable KPI band (`totalDirect`, `totalRoyalties` — simple
   sums over `filtered`, which is either all 10 regions or one selected region).
2. **Input-Output Model tab**: stacked bar of `directJobs`/`indirectJobs`/`inducedJobs` per region
   (static values, unaffected by the multiplier slider), plus a separate `MULTIPLIER_DATA`
   2025–2040 area chart that *is* rescaled live: `indirect/induced × (multiplier/1.8)` against the
   fixed `direct` series (never rescaled — implying the direct effect is treated as a policy-fixed
   baseline while the multiplier only stresses the second/third-round effects).
3. **Fiscal Impact tab**: `gap = royaltiesLost − greenTaxBase` per region — a simple net-fiscal-
   position bar (positive gap = net fiscal loss from the fossil-to-green transition; every region
   in the dataset has `royaltiesLost > greenTaxBase`, so every gap is positive/adverse).
4. **Diversification Pathways tab**: 6 static pathways (Renewable Energy, Advanced Manufacturing,
   Tourism & Heritage, Data Centres, Green Hydrogen, Circular Economy) each with a hand-set
   `potential`/`readiness` score (0–100) and an indicative timeline window — descriptive, not
   computed per selected region (i.e. the same 6-pathway scorecard shows regardless of which
   region is filtered).
5. **Migration Dynamics tab**: `MIGRATION_PROJ`, a static 2025–2040 outflow/inflow curve
   (outflow peaking ~2031 at 5.2%, inflow overtaking outflow by ~2037) — a stylised transition
   curve, not region-specific or driven by the `migrationRate` field shown in the regional table.
6. **Inequality Analysis tab**: displays `giniNow`/`giniProjected` per region directly from the
   static table — no computed Gini methodology (e.g. Lorenz curve integration) exists in the file;
   the two numbers are simply pre-set endpoints.

### 7.4 Worked example

Multiplier slider set to `2.4×` (vs 1.8× baseline), year 2030 row of `MULTIPLIER_DATA`
(`direct=-55, indirect=-72, induced=-42`):

| Field | Formula | Result |
|---|---|---|
| `direct` | unchanged | **−55** (thousand jobs, illustrative) |
| `indirect_scaled` | `-72 × (2.4/1.8)` | **−96.0** |
| `induced_scaled` | `-42 × (2.4/1.8)` | **−56.0** |
| Implied total multiplier at 2.4× | `(55+96+56)/55` | **3.76×** total-to-direct ratio |

Fiscal gap for Alberta CA: `8.5 − 2.1 = **$6.4Bn**` net annual fiscal shortfall from lost fossil
royalties not yet offset by green tax base — the largest absolute gap in the dataset, consistent
with Alberta having both the highest GDP and highest royalties-lost figure.

### 7.5 Companion analytics

Regional Economy Dashboard (KPI band + region table), Input-Output Model (stacked jobs bar +
adjustable multiplier trajectory), Fiscal Impact (royalties-lost vs green-tax-base gap bar),
Diversification Pathways (6-pathway potential/readiness scorecard), Migration Dynamics (2025–2040
outflow/inflow curve), Inequality Analysis (Gini now vs projected table).

### 7.6 Data provenance & limitations

- **All region and pathway figures are hand-curated constants**, not derived from ILO/World Bank
  live data despite those being the guide's cited sources — treat as illustrative, not verified
  statistics, until cross-checked against ILO's actual Just Transition employment data or World
  Bank WDI regional GDP figures.
- **The I/O multiplier slider only affects one auxiliary chart**, not the region table's own
  direct/indirect/induced job figures — a genuine input-output model would recompute
  `indirectJobs = directJobs × (multiplier − 1) × indirectShare` (or similar) live for the
  selected region(s); this module does not.
- Diversification pathway scores and the migration curve are the same for every region — no
  region-specific diversification potential or migration trajectory exists despite the dashboard
  implying region-level analysis throughout.
- No actual Gini-coefficient calculation (e.g. from an income/wealth distribution) exists — the
  "now" and "projected" values are pre-set constants.

**Framework alignment:** ILO World Employment Report — cited as guide source for the just-
transition employment framing; the direct/indirect/induced jobs categorisation matches standard
I/O impact-analysis terminology (Leontief input-output multiplier framework), though the actual
Leontief inverse / multiplier matrix is not computed — the "2.4×" implied ratio in the worked
example is a scalar convenience, not a matrix-derived multiplier · World Bank WDI — referenced for
GDP/inequality context, not linked programmatically to any live data feed.
