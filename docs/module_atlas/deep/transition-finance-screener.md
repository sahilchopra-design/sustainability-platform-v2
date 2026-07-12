## 7 · Methodology Deep Dive

### 7.1 What the module computes

8 hand-curated, named real-world green/sustainability/SLB/transition/blue bonds (EIB Green Bond,
Enel SLB, TotalEnergies Transition Bond, Apple Green Bond, ADB Blue Bond, Unilever Sustainability
Bond, Saudi Aramco Green Bond, Volkswagen SLB) are each screened across ICMA framework alignment, EU
Taxonomy alignment %, greenium, implied temperature rise (ITR), and a 6-objective DNSH boolean
matrix. There is no PRNG and no backend engine — every field, including the final `screening`
verdict (pass/watch/fail), is a **manually assigned value in the static array**, not the output of
a scoring rule.

### 7.2 Parameterisation

| Field | Meaning | Provenance |
|---|---|---|
| `taxonomy_aligned` / `taxonomy_eligible` | % of proceeds meeting EU Taxonomy substantial-contribution criteria vs. merely activity-eligible | Manually assigned per bond; Apple (88%/98%) and EIB (78%/95%) highest, Saudi Aramco (8%/18%) lowest — directionally consistent with real-world taxonomy assessments of these issuer types |
| `greenium` (bps) | Yield discount vs. comparable conventional bond | Manually assigned, all negative (investor pays a premium / accepts lower yield) except Saudi Aramco (+0.4bps, i.e. no greenium) — correctly reflects the real pattern that low-credibility green bonds do not command a greenium |
| `itr` (°C) | Bond/issuer implied temperature rise | Manually assigned, 1.4°C (Apple) to 4.2°C (Saudi Aramco) |
| `dnsh` | 6-objective boolean (climate, water, bio, circular, pollution, ecosystems) | Manually assigned per bond; Saudi Aramco fails 5/6, TotalEnergies fails 3/6, all others pass 6/6 or 5/6 |
| `screening` | pass / watch / fail | **Manually assigned outcome label — no threshold rule links it to `taxonomy_aligned`, `dnsh`, or `itr` in code** |
| `step_up` (SLBs only) | Coupon step-up in bps if KPI missed | Manually assigned (25bps for both SLBs in the universe) |
| `kpis` (SLBs only) | Named baseline→target KPI pairs with target year | Real, plausible KPI structures (Enel: Renewable Capacity 46%→60% by 2025; VW: EV Share 5%→20%, CO₂/vehicle 118→95 g/km by 2025) |

### 7.3 Calculation walkthrough

1. **Portfolio KPIs**: `totalFaceValue` (sum of 8 face values), `passCount` (count where
   `screening==='pass'`), `avgTaxonomy` (simple mean of `taxonomy_aligned` across all 8),
   `avgGreenium` (simple mean of `greenium`) — all straightforward aggregations over the static
   array, no PRNG involved.
2. **Filters**: type (Green Bond/SLB/Transition Bond/Blue Bond/Sustainability Bond) and screening
   result, applied as simple array filters.
3. **DNSH matrix view**: renders the 6-objective pass/fail grid per bond — a direct pass-through of
   the hardcoded `dnsh` object, not a computed assessment against actual environmental data.
4. **Portfolio Screening tab**: buckets the 8 bonds by `screening` result and sums face value per
   bucket (`pieData`-style aggregation) for the pass/watch/fail distribution chart.

### 7.4 Worked example (portfolio aggregates)

| Metric | Computation | Result |
|---|---|---|
| Total face value | Σ 8 bonds' `face_value` (2500+1000+1200+1000+300+750+1250+1000) | **$9.0Bn** |
| Pass rate | 6 of 8 bonds `screening==='pass'` (TotalEnergies=watch, Saudi Aramco=fail) | **6/8 (75%)** |
| Avg taxonomy alignment | `(78+0+22+88+65+52+8+0)/8` | **39%** |
| Avg greenium | `(−8.2−6.4−2.8−12.4−9.8−11.2+0.4−5.6)/8` | **−7.0bps** |

The wide spread in `taxonomy_aligned` (0% for both SLBs — because SLB proceeds are general-purpose
and thus not taxonomy-eligible by design — to 88% for Apple's ring-fenced green bond) correctly
reflects a real structural distinction: use-of-proceeds instruments (Green/Blue/Sustainability
Bonds) can show high taxonomy alignment, while SLBs (general corporate purposes, KPI-linked
coupon) structurally cannot.

### 7.5 Companion analytics

- **KPI Tracking tab** — renders the 2 SLBs' named KPI baseline→target pairs with target years, a
  direct pass-through of the hardcoded `kpis` array.
- **Greenium Analysis tab** — bar/scatter of greenium by bond, useful for seeing which structures
  and issuers command the largest investor premium.

### 7.6 Data provenance & limitations

- The 8 instruments use **real issuer names and plausible ISIN-format identifiers** but are
  **illustrative constructions**, not live data pulled from a bond database or the issuers' actual
  prospectuses — coupon, greenium, and taxonomy-alignment figures should be read as representative
  examples, not current market terms.
- **The `screening` (pass/watch/fail) verdict is not derived from any visible rule.** A production
  version would need an explicit decision rule (e.g. `fail` if `dnsh` has ≥2 objectives false OR
  `taxonomy_aligned < 20%` OR `itr > 3.0°C`) so the verdict is auditable and reproducible rather than
  a hand-set label.
- DNSH assessment is a static boolean per objective per bond — no evidence trail (which specific
  activity or emissions data triggered a "false") is retained.

### 7.7 Framework alignment

- **ICMA Green Bond Principles / Social Bond Principles / Sustainability-Linked Bond Principles**:
  `label` field correctly cites the applicable ICMA principle set (EU GBS, ICMA SLB, ICMA GBP, CBI
  Certified, ASEAN SBF, ICMA SBP) per bond, matching real market-standard nomenclature.
- **EU Taxonomy Regulation (EU) 2020/852**: `taxonomy_aligned`/`taxonomy_eligible` and the 6-objective
  DNSH matrix (climate mitigation/adaptation collapsed to "climate" here, water, biodiversity,
  circular economy, pollution, ecosystems) mirror the Taxonomy's real 6 environmental objectives.
- **EU Green Bond Standard (Regulation (EU) 2023/2631)**: the EIB bond's "EU GBS" label reflects the
  real, newly-operative EU GBS regime requiring ≥85% taxonomy-aligned proceeds allocation.
- **Implied Temperature Rise (ITR)**: consistent with PACTA/CDP-style ITR methodology in concept
  (portfolio or issuer warming potential in °C), though the module does not show how the 1.4–4.2°C
  figures were derived from underlying emissions/target data.
