# Carbon Credit Engine Hub
**Module ID:** `cc-engine-hub` · **Route:** `/cc-engine-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Central orchestration hub for all 21 carbon credit methodology engines. Provides cross-methodology portfolio analytics, credit quality scoring, methodology comparison, and integration with the CarbonCreditContext data bus for downstream module consumption.

> **Business value:** Portfolio quality score aggregates 21 methodology engines on 4 ICVCM dimensions. ICVCM CCP screen filters credits below 60-point quality threshold.

**How an analyst works this module:**
- Dashboard shows portfolio summary across all 21 methodology engines
- Quality Matrix tab scores each methodology on 4 ICVCM dimensions
- Methodology Comparison tab ranks methodologies by quality and cost
- Data Bus tab shows CarbonCreditContext integration status
- Analytics tab runs portfolio-level concentration and vintage analysis

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `DualInput`, `FAMILIES`, `FAMILY_COLORS`, `Inp`, `KpiCard`, `METHODOLOGIES`, `PIE_COLORS`, `PROJECTS`, `REGIONS`, `REGISTRIES`, `Row`, `Section`, `Sel`, `TABS`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `METHODOLOGIES` | 21 | `name`, `family`, `cluster`, `registry`, `complexity` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `FAMILIES` | `['Nature-Based', 'Agriculture & Soil', 'Energy Transition', 'Waste & Circular', 'Industrial Process', 'Carbon Dioxide Removal', 'Community & Cookstoves'];` |
| `FAMILY_COLORS` | `{ 'Nature-Based': '#059669', 'Agriculture & Soil': '#84cc16', 'Energy Transition': '#3b82f6', 'Waste & Circular': '#f59e0b', 'Industrial Process': '#8b5cf6', 'Carbon Dioxide Removal': '#06b6d4', 'Community & Cookstoves':` |
| `REGIONS` | `['Latin America', 'Sub-Saharan Africa', 'Southeast Asia', 'South Asia', 'East Asia', 'North America', 'Europe', 'Oceania'];` |
| `meth` | `meths[Math.floor(sr(i * 13) * meths.length)] \|\| METHODOLOGIES[0];` |
| `totals` | `useMemo(() => { const issued = PROJECTS.reduce((s, p) => s + p.creditsIssued, 0);` |
| `retired` | `PROJECTS.reduce((s, p) => s + p.creditsRetired, 0);` |
| `available` | `PROJECTS.reduce((s, p) => s + p.creditsAvailable, 0);` |
| `familyChart` | `useMemo(() => FAMILIES.map(f => {` |
| `geoChart` | `useMemo(() => REGIONS.map((r, i) => ({` |
| `recentActivity` | `useMemo(() => PROJECTS.slice(0, 8).map((p, i) => ({` |
| `familyNav` | `useMemo(() => FAMILIES.map(f => {` |
| `calcClusters` | `useMemo(() => [...new Set(METHODOLOGIES.filter(m => m.family === calcFamily).map(m => m.cluster))], [calcFamily]);` |
| `familyYield` | `{ 'Nature-Based': 8.5, 'Agriculture & Soil': 3.2, 'Energy Transition': 12.1, 'Waste & Circular': 6.8, 'Industrial Process': 15.4, 'Carbon Dioxide Removal': 2.1, 'Community & Cookstoves': 4.5 };` |
| `annualCredits` | `Math.round(area * baseYield * mul);` |
| `totalCredits` | `annualCredits * period;` |
| `avgPrice` | `parseFloat((sr(METHODOLOGIES.indexOf(meth) * 43) * 30 + 5).toFixed(2));` |
| `totalValue` | `Math.round(totalCredits * avgPrice);` |
| `marketOverview` | `useMemo(() => { const byRegistry = REGISTRIES.map((r, i) => ({ name: r, projects: PROJECTS.filter(p => p.registry === r).length, volume: PROJECTS.filter(p => p.registry === r).reduce((s, p) => s + p.creditsIssued, 0), avgPrice: parseFloat((sr(i * 53) * 25 + 5).toFixed(2)) }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FAMILIES`, `METHODOLOGIES`, `PIE_COLORS`, `REGIONS`, `REGISTRIES`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Quality Score | `Weighted avg of methodology scores` | Model output | Overall quality rating of carbon credit portfolio |
| ICVCM CCP Pass Rate | `Credits meeting CCP threshold / total` | ICVCM assessment | Share of portfolio credits passing Core Carbon Principles screen |
| Methodology Diversification | `Σ(share_i²)` | Portfolio analytics | Concentration metric; lower HHI = more diversified methodology mix |
| Credit Volume by Methodology | `Σ issuance per methodology` | Registry data | Breakdown of portfolio by credit type and standard |
- **21 methodology engines** → Credit issuance data → CarbonCreditContext → **Portfolio positions**
- **ICVCM assessment database** → CCP scores → quality filter → **CCP-aligned credit share**

## 5 · Intermediate Transformation Logic
**Methodology:** Portfolio-level credit aggregation and quality scoring
**Headline formula:** `PortfolioScore = Σ(w_i × QualityScore_i); QualityScore = f(Additionality, Permanence, MRV_Rigor, CobenefitCount)`

Quality score for each methodology engine based on 4 dimensions: additionality stringency (0–30pts), permanence horizon (0–25pts), MRV rigor (0–25pts), and co-benefit count (0–20pts). Portfolio-level score = weighted average by credit volume. ICVCM CCPs applied as minimum threshold screen (score ≥ 60 to pass CCP bar).

**Standards:** ['Verra VCS', 'Gold Standard', 'ICVCM Core Carbon Principles', 'BeZero Carbon Ratings']
**Reference documents:** ICVCM Core Carbon Principles 2023; Verra VCS Program Guide; Gold Standard Theory of Change; Ecosystem Marketplace State of Voluntary Carbon Markets 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a *credit-quality scoring engine*:
> `QualityScore = f(Additionality, Permanence, MRV_Rigor, CobenefitCount)` on a 0–100 scale, a
> portfolio-weighted quality score, an **ICVCM CCP pass-rate** (score ≥ 60 screen), and a methodology
> HHI diversification metric. **None of the scoring logic exists in the code.** The page is a
> portfolio-orchestration *dashboard* over 40 synthetic projects — credit-volume rollups by family,
> region, and registry, a methodology library (20 real methodology codes), a synthetic market
> overview, and a crude "Quick Calculator" (`area × familyYield × price`). No quality score, no CCP
> screen, no HHI are computed. Sections below document the code; §8 specifies the missing quality model.

### 7.1 What the module computes

Everything reduces to aggregations over the seeded `PROJECTS` array (40 projects):

```js
totals.issued     = Σ creditsIssued        // + retired, available, pipeline count
familyChart[f]    = Σ credits by family (issued/retired/available)
geoChart[r]       = Σ credits by region
marketOverview[r] = { projects, volume, avgPrice: sr(i·53)×25 + 5 }   // synthetic price
// Quick Calculator (Tab 6)
annualCredits = round(area × familyYield[family] × mul)
totalCredits  = annualCredits × period
avgPrice      = sr(methIndex×43)×30 + 5                                // synthetic $/t
totalValue    = round(totalCredits × avgPrice)
```

`familyYield` is a hard-coded per-family credit yield (tCO₂e/ha/yr): Nature-Based 8.5, Ag & Soil 3.2,
Energy 12.1, Waste 6.8, Industrial 15.4, CDR 2.1, Cookstoves 4.5.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `METHODOLOGIES` | 20 real codes (VM0047, VM0009, ACM0002, Puro-Biochar, Iso-DAC…) with family/cluster/registry/complexity | Real registry methodology identifiers; complexity is a hand label |
| `familyYield` | 8.5 / 3.2 / 12.1 / 6.8 / 15.4 / 2.1 / 4.5 tCO₂e per unit | Hard-coded heuristic yields |
| `creditsIssued/Retired/Available` | `sr(i·k)×range + base` | Synthetic PRNG |
| `pricePerCredit` | `sr(i·37)×45 + 3` ($3–48) | Synthetic; spans real VCM range |
| `avgPrice` (calculator/market) | `sr(idx)×25–30 + 5` | Synthetic |
| Registries / regions / families | Verra, GS, ACR, CAR, Puro, Isometric / 8 regions / 7 families | Real taxonomy |

### 7.3 Calculation walkthrough

1. **Executive Dashboard** — total issued/retired/available across projects; family and geography
   bar charts; recent-activity feed (first 8 projects).
2. **Project Pipeline / Family Navigator** — filter and group the 40 synthetic projects.
3. **Methodology Library** — searchable table of the 20 methodology records.
4. **Credit Market Overview** — per-registry project count, volume, and *synthetic* average price.
5. **Quick Calculator** — `area × familyYield × period × synthetic price` → indicative credits and $.
6. Reads the shared `CarbonCreditContext` summary (`getSummary()`) to surface live calculations
   pushed by sibling `cc-*` modules.

### 7.4 Worked example — Quick Calculator

Nature-Based family (familyYield 8.5), area 500 ha, period 10 yr, `mul` = 1, synthetic avgPrice
say $18/t:

| Step | Computation | Result |
|---|---|---|
| Annual credits | 500 × 8.5 × 1 | 4,250 tCO₂e/yr |
| Total credits | 4,250 × 10 | 42,500 tCO₂e |
| Total value | 42,500 × 18 | **$765,000** |

The price is a PRNG draw, so the dollar figure is illustrative, not a valuation.

### 7.5 Data provenance & limitations

- **Entirely synthetic portfolio.** All project volumes, prices, and the market overview use the PRNG
  `sr(seed)=frac(sin(seed+1)×10⁴)`. Only the methodology taxonomy is real.
- **No quality model.** Despite the guide, there is no additionality/permanence/MRV/co-benefit scoring,
  no ICVCM CCP threshold, and no HHI diversification calculation.
- `familyYield` is a single scalar per family — real yields vary by geography, species, baseline, and
  methodology by an order of magnitude.
- The Quick Calculator ignores baseline, leakage, buffer, and permanence — the very deductions the
  sibling `cc-arr-reforestation`, `cc-dac`, etc. calculators implement.

**Framework alignment (as coded):** references Verra/Gold Standard/ACR/CAR/Puro/Isometric registries
and 20 real methodology codes, but performs no ICVCM/BeZero-style assessment. The guide's ICVCM Core
Carbon Principles screen and quality scoring are unimplemented (see §8).

## 8 · Model Specification — Carbon-Credit Quality Score & ICVCM CCP Screen

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Score every credit / methodology in the portfolio on integrity dimensions, produce a portfolio-weighted
quality score, an ICVCM-CCP pass-rate, and a methodology-concentration (HHI) metric — supporting
buy-side procurement and portfolio construction across all 21 methodology families.

### 8.2 Conceptual approach

A multi-criteria integrity model calibrated to the two dominant third-party rating frameworks —
**BeZero Carbon** (AAA–D letter scale from additionality, over-crediting, permanence, co-benefit,
policy risk) and **Sylvera** (carbon score + additionality + permanence + co-benefits) — with a
hard ICVCM Core Carbon Principles gate. This mirrors how MSCI and S&P Trucost aggregate ESG/carbon
sub-scores into a composite with a minimum-threshold overlay.

### 8.3 Mathematical specification

```
QualityScore_m = 100 × Σ_d w_d · rating_{m,d}          d ∈ {Additionality, Permanence, MRV, Co-benefit}
                 w = (0.30, 0.25, 0.25, 0.20)            rating_{m,d} ∈ [0,1]
CCP_pass_m     = 1 if QualityScore_m ≥ 60 AND all CCP-essential criteria met, else 0
PortfolioScore = Σ_m (vol_m / Σvol) · QualityScore_m
CCP_pass_rate  = Σ_m vol_m·CCP_pass_m / Σ_m vol_m
HHI            = Σ_m (vol_m / Σvol)²                     // 1/N (diversified) → 1 (concentrated)
```

| Parameter | Calibration source |
|---|---|
| Dimension weights `w_d` | ICVCM CCP category emphasis; BeZero/Sylvera factor loadings |
| `rating_{m,d}` | Methodology-level assessment: ICVCM CCP category-level approvals, BeZero/Sylvera public ratings, Verra/GS methodology audits |
| CCP gate criteria | ICVCM Core Carbon Principles Assessment Framework (10 CCPs, program + methodology-category level) |
| Buffer/reversal inputs | Registry non-permanence risk tools (Verra AFOLU, CAR) |

ICVCM derives CCP eligibility by assessing each *carbon-crediting program* and *methodology category*
against 10 Core Carbon Principles across three pillars (Governance, Emissions Impact, Sustainable
Development); a category earns the CCP label only if it clears every essential criterion — hence the
AND-gate above, not a pure score threshold.

### 8.4 Data requirements

Per methodology: ICVCM CCP assessment status (public), BeZero/Sylvera rating (vendor), registry
buffer rate, MRV frequency, verified co-benefit certifications. Per credit: methodology, vintage,
volume, registry serial. Platform already holds the methodology taxonomy and credit volumes; ratings
must be sourced from ICVCM/BeZero/Sylvera.

### 8.5 Validation & benchmarking plan

Reconcile `QualityScore` ordering against BeZero letter grades (rank correlation ≥ 0.7 target);
verify CCP pass-rate against ICVCM's published approved-category list; sensitivity of PortfolioScore
to each weight; HHI sanity vs an equal-weight benchmark.

### 8.6 Limitations & model risk

Third-party ratings disagree materially (BeZero vs Sylvera divergence is well documented) — treat the
composite as ordinal and disclose vendor source. ICVCM CCP coverage is incomplete across methodologies;
un-assessed categories must be flagged "not rated", never defaulted to pass. Synthetic-price valuation
must be replaced with observed CBL/registry transaction prices before any procurement use.

## 9 · Future Evolution

### 9.1 Evolution A — Build the missing ICVCM quality-scoring engine (analytics ladder: rung 1 → 2)

**What.** The §7 mismatch flag is unambiguous: the guide describes a
`QualityScore = f(Additionality, Permanence, MRV_Rigor, CobenefitCount)` engine with a
portfolio-weighted score, an ICVCM CCP ≥60 screen, and a methodology HHI — and **none
of it exists in code**. The page is volume rollups over 40 synthetic projects plus a
crude `area × familyYield × price` quick calculator. Evolution A implements the scoring
model the atlas §8 already specifies: per-methodology scores on the four dimensions
(0–30/0–25/0–25/0–20), volume-weighted portfolio score, CCP pass-rate, and HHI
concentration — computed over the CarbonCreditContext bus so the 21 downstream cc-*
methodology engines feed it real per-engine outputs rather than seeds.

**How.** (1) Score rubric as a data table (21 methodologies × 4 dimensions) with
citations to ICVCM CCP 2023 assessments, not invented weights. (2)
`portfolioScore = Σ w_i × QualityScore_i` and `HHI = Σ share_i²` as pure functions,
unit-tested. (3) Quality Matrix tab switches from decorative to computed; the CCP
screen filters the live project list.

**Prerequisites.** The mismatch flag governs sequencing — the scoring engine must land
before any copilot narrates "quality" on this page; rubric sources documented per §8.
**Acceptance:** removing a methodology from the portfolio moves both the weighted score
and HHI in the arithmetically-correct direction; a methodology scored 58 fails the CCP
screen visibly.

### 9.2 Evolution B — Carbon desk orchestrator entry point (LLM tier 3)

**What.** This hub is the natural desk-orchestration surface for the whole cc-* family:
it already aggregates 21 methodology engines over the CarbonCreditContext bus. Evolution
B makes it the tier-3 router — "screen our book for CCP-failing exposure and propose
replacement supply" decomposes into quality-screen (this module, post-Evolution A) →
per-methodology deep-dives (cc-redd-wetlands-hub, cc-soil-carbon, etc.) → retirement
planning (cc-retirement-workflow), synthesized into one memo.

**How.** Routing knowledge from `module_tags.json` plus the atlas interconnection graph
(§6 lists this hub's blast-radius edges to the cc-* family); each sub-question answered
by that module's own copilot/tools, never by the orchestrator improvising; output
rendered through the report-studio layer per the tier-3 pattern.

**Prerequisites (hard).** Evolution A first — orchestrating over a quality score that
does not exist would be narrating fiction; sibling cc-* modules need at least tier-1
copilots. **Acceptance:** a desk query produces a memo where every quality figure
traces to the scoring engine and every methodology fact to the owning module's corpus;
the orchestrator refuses portfolio-optimization asks until a real optimizer exists.