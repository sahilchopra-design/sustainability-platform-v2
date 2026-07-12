## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/scope3-categories` (engine E21, `scope3_categories_engine.py`) implements a **GHG Protocol
Scope 3 category screening and SBTi-coverage assessment**. Given an entity (id, NACE code, revenue,
headcount, sector type, optional portfolio AUM), it produces a 15-category breakdown, a materiality
flag per category, an SBTi 40 %-coverage verdict, a weighted data-quality score (DQS), an optional
FLAG split, and an optional PCAF Category-15 portfolio block:

```
total_scope3 = total_scope3_tco2e                              (if supplied)
             = revenue_bn × 1000 × intensity (tCO2e/EUR M)     (if intensity supplied)
             = None                                            (otherwise — honest null)
tco2e(cat)   = total × share(cat)          share defaults to GHG Protocol typical share
is_material  = share > 0.05
coverage %   = Σ material tco2e / total × 100   (or Σ material shares when total is null)
meets_40pct  = coverage ≥ 40
weighted_DQS = Σ w·dqs / Σ w               w = tco2e (or published share when total null)
```

### 7.2 Parameterisation

**Category shares** (`SCOPE3_CATEGORIES.typical_pct`, engine comment: "published GHG Protocol
typical share (documented benchmark, NOT a random draw)"):

| Cat | Name | Stream | Typical share | Material (>5 %)? |
|---|---|---|---|---|
| C1 | Purchased goods & services | up | 30 % | yes |
| C11 | Use of sold products | down | 25 % | yes |
| C15 | Investments (PCAF) | down | 9 % | yes |
| C10 | Processing of sold products | down | 6 % | yes |
| C2 | Capital goods | up | 5 % | no (strict >) |
| C4, C9 | Up/downstream transport | — | 4 % each | no |
| C3, C12 | FERA / End-of-life | — | 3 % each | no |
| C6, C7, C8, C13, C14 | Travel, commuting, leased, franchises | — | 2 % each | no |
| C5 | Waste | up | 1 % | no |

**Calculation-method DQS ladder** (`CALCULATION_METHODS`, PCAF-style 1=best…5=worst scale):
supplier_specific = 1, hybrid = 2, pcaf_standard = 2, average_data = 3 (screening default),
spend_based = 4. Methods `spend_based`/`average_data` auto-append the data gap "No primary
supplier data — recommend supplier engagement programme".

**Other constants:** `COVERAGE_THRESHOLD = 0.40` (SBTi near-term Scope 3 coverage rule);
`SBTI_SECTORS_FLAG` = agriculture, forestry, land_use, food_beverage, consumer_goods_agri, paper,
real_estate_agri; materiality screen thresholds `>0.06` likely-material, `>0.15` high significance.

### 7.3 Calculation walkthrough

1. **Total.** The route's `AssessRequest` exposes only the basic fields, so via the API the
   optional intensity/total/shares parameters are never populated → `total = None` and the engine
   emits the warning "No entity Scope 3 total or intensity supplied — per-category tCO2e reported
   as null; percentages reflect GHG Protocol typical shares only". Programmatic callers can supply
   real data.
2. **Category loop.** Each of the 15 categories gets its share (override or typical), tCO₂e
   (null-safe), materiality flag, method and DQS.
3. **SBTi coverage.** With defaults, material categories are C1+C11+C10+C15 = 30+25+6+9 = 70 % →
   `meets_40pct_rule = True`.
4. **FLAG split** only computed when the sector is FLAG **and** both `total` and `flag_share` are
   supplied; otherwise a warning ("FLAG vs non-FLAG split not computed (insufficient_data)").
5. **C15 block** (`PortfolioScope3`) when `portfolio_aum_bn > 0`: attributed emissions
   `AUM_bn × 1000 × portfolio intensity` only if an intensity is supplied, else null + warning;
   PCAF DQS and portfolio temperature score are pass-through fields.
6. **Recommendations**: expand boundary if coverage < 40 %; supplier data collection if weighted
   DQS > 3.5; apply PCAF if C15 material but no portfolio block.

### 7.4 Worked example — default screening assessment

`POST /assess` with `revenue_bn = 2.0`, no intensity (typical API call):

| Output | Computation | Result |
|---|---|---|
| `total_scope3_tco2e` | no data supplied | **null** (+ warning) |
| Material categories | shares > 5 % | **C1, C10, C11, C15** |
| `sbti_coverage_pct` | 30 + 6 + 25 + 9 | **70.0 %** → meets 40 % rule |
| Weighted DQS | all methods default `average_data` (DQS 3), weights = shares | Σ(w×3)/Σw = **3.00** |
| Recommendation | C15 material, no portfolio | "apply PCAF standard attribution methodology" |

If instead a caller supplies `scope3_intensity = 350 tCO2e/EUR M`: total = 2.0 × 1000 × 350 =
**700,000 tCO₂e**; C1 = 700,000 × 0.30 = 210,000 tCO₂e; C11 = 175,000; coverage unchanged at 70 %.

### 7.5 Reference endpoints

`GET /ref/*` return static reference payloads: the category table; the method/DQS ladder; the SBTi
coverage rule; PCAF C15 metadata including the attribution formula string
`Financed Emissions = (Outstanding Amount / EVIC) x Company Emissions` and DQS range 1–5; the FLAG
sector list; and GHG Protocol metadata (upstream C1–C8, downstream C9–C15). Note the PCAF formula
is *documented* here but not *executed* — attribution maths lives in the PCAF modules.

### 7.6 Data provenance & limitations

- **No synthetic PRNG data.** This engine is notable for its "honest null" design: every derived
  tonnage is null unless the caller supplies real data, with explicit `insufficient_data`
  warnings (comments repeatedly state "no fabricated split", "no random intensity").
- The `typical_pct` shares are labelled a published GHG Protocol cross-sector benchmark; they are
  plausible but sector-invariant — a software company and a steelmaker get the same default
  profile. The GHG Protocol standard itself does not prescribe fixed percentages; treat these as
  the platform's benchmark encoding.
- Materiality uses a pure share threshold (>5 %); the GHG Protocol's materiality criteria
  (size, influence, risk, stakeholders, outsourcing, sector guidance) are collapsed to size only.
- `nace_code` and `headcount` are stored but never used in any computation.
- The HTTP layer cannot reach the richer optional parameters (intensity, shares, methods,
  FLAG share, portfolio intensity) — a production wiring gap.

### 7.7 Framework alignment

- **GHG Protocol Corporate Value Chain (Scope 3) Standard (2011)** — defines the 15 categories and
  requires screening all of them; the engine reproduces the taxonomy and upstream/downstream split
  exactly.
- **SBTi Corporate Near-Term Criteria** — where Scope 3 is ≥40 % of total emissions, targets must
  cover at least ⅔ of Scope 3 under current criteria; the engine encodes the older/simplified
  "cover ≥40 % of Scope 3" boundary rule as stated in its own ref endpoint.
- **SBTi FLAG Guidance** — FLAG-sector companies must set separate Forest, Land & Agriculture
  targets; the engine flags applicability and computes a FLAG/non-FLAG tonnage split when data
  permits.
- **PCAF Global GHG Accounting Standard (Part A/C)** — Category 15 financed emissions use the
  outstanding/EVIC attribution and a 1–5 data-quality score; here PCAF appears as metadata and a
  pass-through DQS, not a re-implementation.
