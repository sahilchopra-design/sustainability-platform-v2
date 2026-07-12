# SDG Bond Impact
**Module ID:** `sdg-bond-impact` · **Route:** `/sdg-bond-impact` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
SDG-aligned bond impact reporting and use-of-proceeds tracking mapping green, social and sustainability bond allocations to UN Sustainable Development Goal outcomes.

> **Business value:** Tracks bond proceeds allocation against SDG targets and quantifies impact outcomes for ESG fixed income portfolios.

**How an analyst works this module:**
- Collect use-of-proceeds allocation reports from issuers per ICMA Green Bond Principles.
- Map each project category to primary and secondary UN SDG targets.
- Quantify impact metrics (e.g. MWh renewable capacity, affordable homes) per SDG.
- Compute alignment scores and generate impact reports for investors and regulators.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOND_IMPACT_METRICS`, `Badge`, `Btn`, `CATEGORIES`, `Card`, `KPI`, `PIE_COLORS`, `SDG_COLORS`, `SDG_NAMES`, `SdgBondImpactPage`, `Section`, `SortHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `pct` | `(v) => (v * 100).toFixed(1) + '%';` |
| `bonds` | `useMemo(() => generateBonds(fiPortfolio), [fiPortfolio]);  /* ── Sort state ── */ const [sortCol, setSortCol] = useState('size_mn');` |
| `totalInvested` | `useMemo(() => bonds.reduce((s, b) => s + b.size_mn, 0), [bonds]);` |
| `avgImpact` | `useMemo(() => bonds.length ? Math.round(bonds.reduce((s, b) => s + b.impactScore, 0) / bonds.length) : 0, [bonds]);` |
| `pieCatData` | `useMemo(() => CATEGORIES.map(c => ({ name: c, value: categoryTotals[c]?.invested \|\| 0 })).filter(d => d.value > 0), [categoryTotals]);` |
| `scatterData` | `useMemo(() => bonds.map(b => ({ x: b.yield, y: b.impactScore, z: b.size_mn, name: b.issuer, category: b.category })), [bonds]);` |
| `rows` | `bonds.map(b => `${b.id},${b.issuer},${b.category},${b.size_mn},${b.yield},${b.impactScore},${b.verified},${b.additionality},${b.icma_compliant},${b.sdgs.join(';')}`);` |
| `blob` | `new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });` |
| `total` | `m.benchmark * (categoryTotals[selectedCategory]?.invested \|\| 0);` |
| `impactVal` | `primaryMetric ? primaryMetric.benchmark * b.size_mn : 0;` |
| `val` | `m.benchmark * invested;` |
| `pctVal` | `bonds.length ? (cnt / bonds.length * 100) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PIE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Bonds Tracked | — | Bond register | Total SDG-labelled bonds under active impact monitoring. |
| Proceeds Allocated | — | Issuer reports | Cumulative use-of-proceeds allocations reported by issuers in tracking period. |
| Avg SDG Alignment | — | Calculated | Mean SDG alignment score across all tracked bonds weighted by proceeds volume. |
- **Issuer allocation reports, SDG taxonomy, bond prospectus data** → Proceeds mapping, SDG alignment scoring, impact metric aggregation → **SDG impact reports, alignment dashboards, investor disclosures**

## 5 · Intermediate Transformation Logic
**Methodology:** SDG Alignment Score
**Headline formula:** `Σ (Proceeds to SDG Project × SDG Weight) ÷ Total Proceeds × 100`

Weighted share of bond proceeds allocated to projects with verified SDG alignment, adjusted by impact significance.

**Standards:** ['ICMA GBP', 'UN SDG Taxonomy', 'MDB Harmonised Framework']
**Reference documents:** ICMA Green Bond Principles 2021; ICMA Social Bond Principles 2021; UN SDG Impact Standards for Bond Issuers; MDB Harmonised Framework for Impact Reporting

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

20 named, real-issuer-style bonds (`generateBonds`, e.g. "Iberdrola Green 2031," "World Bank Edu 2028")
are hardcoded with plausible `size_mn`/`yield` pairs, then enriched with `sr()`-seeded (`seed(s)=frac(sin(s+1)×10⁴)`)
qualitative fields — `verified`, `additionality`, `icma_compliant`, `impactScore`. Each bond's category maps
to a fixed `BOND_IMPACT_METRICS` lookup of per-$Mn impact benchmarks (e.g. Renewable Energy: 2.5 MW, 4.2 GWh,
2,800 tCO₂e avoided, 850 households powered — **all per USD Mn invested**), and impact is computed by
straight linear scaling:

```js
impactVal = metric.benchmark × bond.size_mn                 // e.g. GHG avoided = 2,800 × size_mn tCO2e
total(metric, category) = metric.benchmark × categoryTotals[category].invested
```

### 7.2 Parameterisation — impact benchmark table (per USD Mn invested)

| Category | Key metric | Benchmark | SDGs tagged |
|---|---|---|---|
| Renewable Energy | GHG Emissions Avoided | 2,800 tCO₂e | 7, 13 |
| Clean Transport | GHG Emissions Avoided | 1,500 tCO₂e | 9, 11, 13 |
| Green Buildings | GHG Emissions Avoided | 80 tCO₂e | 11, 13 |
| Water Management | Water Treated | 500 megalitres/yr | 6, 14 |
| Social Housing | Affordable Units Created | 8 units | 1, 11 |
| Healthcare Access | Patients Served Annually | 5,000 | 3 |
| Education | Students Supported | 500 | 4 |

Provenance: these look like the "harmonised impact reporting indicators" style used by MDBs (World Bank,
IFC, ADB Green/Social Bond impact reports) and ICMA's Harmonized Framework for Impact Reporting, and the
relative ordering across categories is directionally sensible (Renewable Energy avoids far more CO₂e per
dollar than Green Buildings retrofits), but **no citation ties any specific numeric benchmark to a named
MDB or ICMA report** in the code — treat as illustrative, not audit-ready.

| Field | Formula | Provenance |
|---|---|---|
| `verified` | `seed(i)>0.35 ⇒ 'Verified'`, else `>0.5 ⇒ 'Estimated'`, else `'Pending'` | Synthetic tiering |
| `additionality` | `seed>0.3⇒High / >0.5⇒Medium / else Low` | Synthetic |
| `icma_compliant` | `seed>0.25` → ~75% compliant | Synthetic boolean |
| `impactScore` | `round(seed×30+60)` → 60–90 | Synthetic composite, not derived from the other 3 fields |

### 7.3 Calculation walkthrough

1. `bonds = generateBonds(fiPortfolio)` — 20 fixed bond records, each carrying a real-sounding issuer name
   and category; qualitative flags (`verified`, `additionality`, `icma_compliant`, `impactScore`) are
   independently `seed()`-drawn per bond, so (as with sibling modules) a "Verified" bond can still show Low
   additionality or a below-average `impactScore` — the four dimensions are uncorrelated by construction.
2. `totalInvested = Σ size_mn`; `avgImpact = round(Σ impactScore / N)`.
3. `categoryTotals` (implicit from `pieCatData`) sums `size_mn` per category — feeds the allocation pie
   chart.
4. Per-metric impact totals: for the selected category, each of its benchmark metrics is multiplied by that
   category's aggregate invested amount: `total = metric.benchmark × categoryTotals[category].invested` —
   a pure linear extrapolation with no diminishing-returns, capacity-constraint, or double-counting
   adjustment (e.g. summing "Households Powered" and "GHG Avoided" as if independent, when in reality both
   derive from the same underlying generation capacity).
5. `scatterData` plots `yield` vs `impactScore` sized by `size_mn` — a yield/impact trade-off visualisation,
   descriptive only (no regression or correlation statistic computed).

### 7.4 Worked example

"Iberdrola Green 2031": `size_mn = 180`, category = Renewable Energy.

| Metric | Benchmark (per $Mn) | Bond impact = benchmark × 180 |
|---|---|---|
| Clean Energy Capacity Installed | 2.5 MW | 450 MW |
| Annual Clean Energy Generated | 4.2 GWh | 756 GWh |
| GHG Emissions Avoided | 2,800 tCO₂e | 504,000 tCO₂e |
| Households Powered | 850 | 153,000 households |

If the whole Renewable Energy category totals `invested = 800` ($Mn, summing Iberdrola + Orsted + NextEra +
Enel from the fixed list = 180+120+200+300 = 800): category-level GHG avoided = `2,800 × 800 =
2,240,000 tCO₂e`.

### 7.5 Companion analytics on the page

- **Verification/Additionality/ICMA-compliance badges** per bond — a 3-flag credibility snapshot, though
  (per §7.2) uncorrelated by construction, so a bond can be simultaneously "Verified," "Low additionality,"
  and "not ICMA compliant."
- **Yield-vs-impact scatter** — visualises whether higher-yielding (riskier) bonds also score lower on
  impact, a legitimate question for impact-linked fixed income, but purely illustrative here since both axes
  are independently sourced (yield hardcoded, impact `seed()`-random).

### 7.6 Data provenance & limitations

- **Bond names, sizes and yields are hand-curated** (not `sr()`-random) and resemble real issuers/instruments,
  but the specific size/yield pairings are illustrative, not sourced from a live bond database.
- **Impact benchmark coefficients are unsourced constants.** A production system would source per-category
  benchmarks from ICMA's Harmonized Framework for Impact Reporting (green bonds), the Harmonized Framework
  for Impact Reporting for Social Bonds, or issuer-specific allocation/impact reports, with per-project
  granularity rather than a single flat per-$Mn multiplier applied uniformly across all issuers in a
  category.
- **Impact metrics are not mutually exclusive** — GHG avoided, households powered, and MW installed for the
  same Renewable Energy bond are all derived independently from the same benchmark table rather than from a
  single underlying generation-capacity figure, so they should not be read as internally consistent
  (e.g. 756 GWh generated does not necessarily imply exactly 153,000 households powered at the stated 850/
  $Mn rate — both are separately-benchmarked proxies).
- `verified`/`additionality`/`icma_compliant`/`impactScore` are drawn from independent seeds and can produce
  internally inconsistent combinations (see §7.2), which a real impact-verification workflow would not
  permit (ICMA-compliant + High additionality should structurally correlate with Verified status).

**Framework alignment:** ICMA Green Bond Principles / Social Bond Principles / Harmonized Framework for
Impact Reporting — informs the metric taxonomy (capacity installed, GHG avoided, beneficiaries served) and
the `icma_compliant` flag, though compliance is a random draw, not a rule-based check against the actual
ICMA criteria (use-of-proceeds eligibility, process for project evaluation, management of proceeds, and
reporting) · UN SDG taxonomy for the `sdgs` tags per category, using the correct official SDG numbers and
colours · MDB Harmonised Framework informs the "impact per $Mn invested" convention used throughout.

## 9 · Future Evolution

### 9.1 Evolution A — Sourced impact coefficients with internally consistent metrics (analytics ladder: rung 1 → 3)

**What.** The module is tier-B frontend-only: 20 hand-curated bonds scaled linearly against a `BOND_IMPACT_METRICS` table whose per-$Mn benchmarks (e.g. Renewable Energy 2,800 tCO₂e/$Mn) are, per §7.2, "illustrative, not audit-ready" — no citation ties any coefficient to a named MDB or ICMA report, and §7.6 notes the metrics for a single bond are not mutually consistent (GHG avoided, GWh, and households powered are independent multiplications, not derived from one capacity figure). Evolution A builds the first backend vertical with cited, internally consistent coefficients.

**How.** (1) A `ref_bond_impact_benchmarks` table seeded from the ICMA Harmonised Framework for Impact Reporting and published MDB green-bond impact reports (World Bank/IFC/ADB), each row carrying source, vintage, and geography. (2) Derive dependent metrics from a single physical anchor per category — capacity (MW) → generation (GWh via sourced capacity factors) → tCO₂e (grid EF) → households (per-household consumption) — so the numbers reconcile. (3) `POST /api/v1/sdg-bonds/impact` computing per-bond and portfolio impact with a benchmark-range (P25/P50/P75) instead of a point coefficient. (4) Make `verified`/`additionality`/`icma_compliant` rule-derived, fixing the §7.6 finding that these independent seeds produce impossible combinations.

**Prerequisites.** Coefficient sourcing effort (one-time literature pass); grid-EF reference data (already in `referenceData.js` lineage). **Acceptance:** every coefficient row cites a named report+year; for any Renewable Energy bond, GWh × grid-EF reproduces the stated tCO₂e within rounding.

### 9.2 Evolution B — Allocation-report reader copilot (LLM tier 2)

**What.** Issuer use-of-proceeds allocation reports are PDFs with heterogeneous tables — exactly the extraction task LLMs handle well and the current module skips entirely (bonds are hardcoded). Evolution B lets an analyst drop an issuer's allocation/impact report into the module; the copilot extracts project-level allocations, maps categories to the SDG taxonomy the page already carries, runs the impact calculation via the Evolution-A endpoint as a tool call, and flags divergence between issuer-reported impact and benchmark-implied impact.

**How.** Tool-calling pattern per the Tier-2 architecture: extraction returns a structured allocation table the user confirms before any calculation; the copilot then calls `POST /api/v1/sdg-bonds/impact` and narrates only the returned figures. The comparison verdict ("issuer reports 3,900 tCO₂e/$Mn vs. benchmark P75 of 3,200") cites both sources explicitly. Refusal path for bonds without an allocation report — no impact estimate from the bond name alone.

**Prerequisites (hard).** Evolution A must land first: benchmark-vs-issuer comparison is meaningless while coefficients are unsourced constants. **Acceptance:** on a real published World Bank green bond impact report, extracted allocations sum to the reported total, and every numeric in the copilot's answer traces to either the document or the tool response.