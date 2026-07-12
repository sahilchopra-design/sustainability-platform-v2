# Enablement Methodology
**Module ID:** `enablement-methodology` · **Route:** `/enablement-methodology` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Implements the PCAF Scope 3 Category 15 investment enablement methodology for financed emissions attribution across asset classes. Quantifies the proportion of an investee's emissions enabled or avoided through financing activity, applying PCAF data quality scoring and economic attribution logic. Supports alignment with PCAF Standard Part A and Part B for banks, asset managers, and insurers.

> **Business value:** Provides financial institutions with a regulatory-grade financed emissions calculation engine that satisfies PCAF Standard requirements, supports SBTi FI target-setting, and generates audit-ready Cat.15 disclosure tables for TCFD and CDP responses.

**How an analyst works this module:**
- Load portfolio holdings with outstanding loan or investment balance and investee EVIC data.
- Map each position to the PCAF asset class category (listed equity, corporate bonds, loans, project finance, etc.).
- Review attribution factors and verify GHG inventory data quality scores; flag Score 4â€“5 positions for improvement.
- Export PCAF-format financed emissions report with data quality distribution and avoided emissions annex.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AdditionalityAssessment`, `Badge`, `CATEGORIES`, `CAT_COLORS`, `Card`, `EnablementScorer`, `ISSUERS`, `KPI`, `PORTFOLIO_TREND`, `PRODUCTS`, `PROJECTS`, `PortfolioEnablement`, `Q_LABELS`, `REGULATIONS`, `REPORT_SECTIONS`, `ReportingDisclosure`, `SECTORS`, `SECTOR_STACK`, `TABS`, `TYPES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REGULATIONS` | 9 | `body`, `standard`, `status`, `date`, `coverage`, `alignment`, `notes` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['Green Bond','Sustainability-Linked Loan','Climate Fund','Project Finance','Green Loan','Transition Bond','Social Bond','Blue Bond'];` |
| `CATEGORIES` | `['Renewable Energy','Energy Efficiency','Clean Transport','Sustainable Agriculture','Waste Management','Water','Circular Economy','Nature-Based Solutions'];` |
| `type` | `TYPES[Math.floor(s1*TYPES.length)];` |
| `cat` | `CATEGORIES[Math.floor(s2*CATEGORIES.length)];` |
| `sector` | `SECTORS[Math.floor(s3*SECTORS.length)];` |
| `issuer` | `ISSUERS[Math.floor(s4*ISSUERS.length)];` |
| `volume` | `Math.round(50+s5*950);` |
| `enabledReduction` | `Math.round(1000+s6*49000);` |
| `financedEmissions` | `Math.round(500+s7*25000);` |
| `ratio` | `parseFloat((enabledReduction/Math.max(financedEmissions,1)).toFixed(2));` |
| `additionality` | `Math.round(20+s8*80);` |
| `vintage` | `2020+Math.floor(sr(i*31)*6);` |
| `maturity` | `vintage+Math.floor(3+sr(i*37)*12);` |
| `coupon` | `parseFloat((1.5+sr(i*41)*4.5).toFixed(2));` |
| `Q_LABELS` | `['Q1-22','Q2-22','Q3-22','Q4-22','Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24'];` |
| `PORTFOLIO_TREND` | `Q_LABELS.map((q,i)=>({quarter:q,` |
| `SECTOR_STACK` | `Q_LABELS.map((q,i)=>({quarter:q,` |
| `REPORT_SECTIONS` | `['Executive Summary','Portfolio Enablement Overview','Product-Level Analysis','Additionality Assessment','PCAF Facilitated Emissions','GFANZ Alignment','Double-Counting Prevention','Sector Breakdown','Methodology Notes',` |
| `fmt` | `n=>{if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(0)+'K';return String(n);};` |
| `fmtPct` | `n=>n>=0?`+${n.toFixed(1)}%`:`${n.toFixed(1)}%`;` |
| `peerData` | `selected?PRODUCTS.filter(p=>p.category===selected.category).sort((a,b)=>b.ratio-a.ratio).slice(0,10).map(p=>({name:p.name.slice(0,18),ratio:p.ratio,isCurrent:p.id===selected.id})):[];` |
| `totalAlloc` | `Object.values(allocationAdj).reduce((a,b)=>a+b,0);` |
| `totalFinanced` | `PORTFOLIO_TREND[PORTFOLIO_TREND.length-1].financedEmissions;` |
| `totalEnabled` | `PORTFOLIO_TREND[PORTFOLIO_TREND.length-1].enabledAvoided;` |
| `netImpact` | `totalEnabled-totalFinanced;` |
| `currentRatio` | `PORTFOLIO_TREND[PORTFOLIO_TREND.length-1].ratio;` |
| `topEnablers` | `[...PRODUCTS].sort((a,b)=>b.enabledReduction-a.enabledReduction).slice(0,8);` |
| `topEmitters` | `[...PRODUCTS].sort((a,b)=>b.financedEmissions-a.financedEmissions).slice(0,8);` |
| `pcafData` | `CATEGORIES.map((c,i)=>{` |
| `totalE` | `prods.reduce((a,p)=>a+p.enabledReduction,0);` |
| `totalF` | `prods.reduce((a,p)=>a+p.financedEmissions,0);` |
| `withFIAvg` | `(PROJECTS.reduce((a,p)=>a+p.withFI,0)/PROJECTS.length).toFixed(1);` |
| `withoutFIAvg` | `(PROJECTS.reduce((a,p)=>a+p.withoutFI,0)/PROJECTS.length).toFixed(1);` |
| `points` | `criteria.map((c,i)=>{` |
| `angle` | `(i*90-90)*Math.PI/180;` |
| `dist` | `r*c.score/100;` |
| `polygon` | `points.map(p=>`${p.x},${p.y}`).join(' ');` |
| `alignedCount` | `Math.round(totalProducts*0.72);` |
| `partialCount` | `Math.round(totalProducts*0.18);` |
| `gapCount` | `totalProducts-alignedCount-partialCount;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `CAT_COLORS`, `ISSUERS`, `Q_LABELS`, `REGULATIONS`, `REPORT_SECTIONS`, `SECTORS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Attribution Factor (%) | — | PCAF Standard Part A | Financing share of EVIC; determines proportion of investee GHG inventory attributed to the financier. |
| Financed Emissions (tCO2e) | — | PCAF/GHG Protocol | Absolute attributed emissions from lending or investment activity; primary PCAF reporting metric. |
| PCAF Data Quality Score | — | PCAF DQ Framework | Score 1 = highest quality (audited Scope 1+2); Score 5 = proxy/estimated; affects disclosure confidence band. |
| Avoided Emissions (tCO2e) | — | PCAF Part B | Emissions avoided by enabling clean energy or efficiency projects; reduces net portfolio footprint. |
- **Portfolio management system (holdings + balances)** → Match to PCAF asset class; compute EVIC-based attribution factor → **Attribution factor per position (%)**
- **Investee GHG inventories (CDP/Trucost/estimated)** → Assign PCAF DQ score 1â€“5; apply sector proxy where actuals unavailable → **Financed emissions per investee (tCO2e)**
- **Renewable project finance records** → Calculate avoided emissions vs. grid displacement factor → **Avoided emissions portfolio total (tCO2e)**

## 5 · Intermediate Transformation Logic
**Methodology:** Enabled Emissions Attribution
**Headline formula:** `EE = (Financing / EVIC) × Investee_GHG`

Attributable financed emissions are computed by multiplying the outstanding financing amount divided by Enterprise Value Including Cash by the investee's total GHG inventory (Scope 1+2, Scope 3 where available). EVIC serves as the economic attribution denominator per PCAF Part A. Avoided emissions from enabling renewable energy projects are reported separately as positive impact.

**Standards:** ['PCAF Global Standard 2022', 'GHG Protocol Scope 3 Cat.15', 'TCFD']
**Reference documents:** PCAF Global GHG Accounting and Reporting Standard for the Financial Industry 2022; GHG Protocol Corporate Value Chain (Scope 3) Standard 2011; TCFD Guidance on Metrics, Targets and Transition Plans 2021; SBTi Financial Sector Science-Based Targets Guidance 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide advertises the PCAF facilitated/financed-emissions
> attribution engine — `EE = (Financing / EVIC) × Investee_GHG`, with PCAF data-quality scoring 1–5.
> **The code computes none of this.** No EVIC, no attribution-from-EVIC, no PCAF DQ score, no
> Scope 1+2+3 inventory is present. Instead each of 100 products carries a **pre-drawn random**
> `financedEmissions`, `enabledReduction` and `attributionFactor`, and the only headline computation
> is the ratio `enabledReduction / financedEmissions`. The regulatory-alignment table (PCAF Part C,
> GFANZ, ISSB S2…) is a static hand-authored list, not a live assessment. Documented below as written;
> §8 specifies the PCAF facilitated-emissions model the guide describes.

### 7.1 What the module computes

**Products (100)** — every economic quantity is an independent PRNG draw
(`sr(s)=frac(sin(s+1)×10⁴)`):

```js
volume            = 50   + s5×950        // $M issuance
enabledReduction  = 1000 + s6×49000      // tCO₂e avoided/enabled
financedEmissions = 500  + s7×25000      // tCO₂e financed
ratio             = enabledReduction / max(financedEmissions, 1)   // headline "enablement ratio"
additionality     = 20   + s8×80         // 0–100
attributionFactor = 0.3  + sr(i·47)×0.6  // 0.3–0.9  (drawn, NOT Financing/EVIC)
baselineEmissions = financedEmissions×1.4 + sr(i·43)×5000
```

**Projects (60)** — the additionality assessment is the one genuine composite:
```js
totalAdditionality = round( (financialAdditionality
                           + regulatoryAdditionality
                           + technologyAdditionality
                           + marketTransformation) / 4 )
```
Each sub-score is itself a random draw (15–100, 10–100, 5–100, 10–100). `withFI` vs `withoutFI`
(scenario emissions with/without the financing) drive the additionality "wedge" chart.

**Portfolio trend** — 12 static quarters with a rising `enabledAvoided`, falling `financedEmissions`
and an improving `ratio` (`0.35 + i·0.04 + noise`), i.e. a scripted improving trajectory.

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| `TYPES` (8) | Green Bond, SLL, Climate Fund, Project Finance, Green/Transition/Social/Blue | Instrument taxonomy |
| `CATEGORIES` (8) | Renewables, Efficiency, Clean Transport, Agri, Waste, Water, Circular, NbS | ICMA/CBI use-of-proceeds categories |
| `enabledReduction` 1k–50k tCO₂e | synthetic | random draw |
| `financedEmissions` 0.5k–25k tCO₂e | synthetic | random draw |
| `attributionFactor` 0.3–0.9 | synthetic | should be Financing/EVIC per PCAF — here random |
| `baselineEmissions` = FE×1.4 + noise | heuristic | fixed 1.4× multiplier |
| Additionality sub-weights | equal (¼ each) | design choice, not a published rubric |
| `REGULATIONS` (8 rows) | PCAF Part C, GFANZ, SEC S7-10-22, ESMA SFDR RTS, FCA SDR, ISSB S2, TCFD, EU Taxonomy | real standards, **static status labels** |

### 7.3 Calculation walkthrough

Product input → the "enablement ratio" `ratio = enabledReduction/financedEmissions` is the sort key
and the KPI headline. Portfolio net impact = `enabledAvoided − financedEmissions` at the latest
quarter. Additionality: four sub-scores averaged to `totalAdditionality`, rendered on a radar; a
project is flagged (`riskFlags`) when `sr()>0.7` ("Low additionality evidence") or `>0.5`
("Regulatory baseline unclear"). PCAF-category rollups sum `enabledReduction` and `financedEmissions`
per use-of-proceeds category.

### 7.4 Worked example

Product **i = 5**. Seeds: `s6=sr(95)`, `s7=sr(115)`. Evaluate `sr(95)=frac(sin(96)×10⁴)`: sin(96 rad)
≈ 0.9835, ×10⁴ = 9834.7, frac ≈ 0.47 → `enabledReduction = 1000 + 0.47×49000 ≈ 24,030 tCO₂e`.
`sr(115)=frac(sin(116)×10⁴)`: sin(116) ≈ 0.9494 → 0.94 → `financedEmissions = 500 + 0.94×25000 ≈
24,000 tCO₂e`. Then:
```
ratio = 24030 / 24000 ≈ 1.00
```
A ratio ≈ 1 means the product's enabled/avoided emissions roughly offset its financed emissions —
but because the two figures are independent random draws, this "net-neutral" reading is coincidental,
not a modelled relationship. (Exact digits depend on JS float; the mechanism is the point.)

### 7.5 Companion analytics

- **Portfolio Enablement:** top-8 enablers vs top-8 emitters, per-category PCAF rollup, sector stack
  over 12 quarters.
- **Additionality Assessment:** 4-axis radar + with-FI/without-FI wedge; risk-flag list.
- **Reporting & Disclosure:** static regulatory-alignment table and a 10-section report scaffold
  (Exec Summary … Appendices) — a document template, not generated content.

### 7.6 Data provenance & limitations

- **All product and project data is synthetic**, seeded by `sr(seed)=frac(sin(seed+1)×10⁴)`.
- `attributionFactor` is a random draw, **not** the PCAF `Financing/EVIC` ratio it is labelled as;
  `financedEmissions` is not computed from any attribution × inventory product.
- The regulatory-alignment "Aligned/Partial/Monitoring" statuses are hard-coded editorial labels, not
  a live compliance check.
- No double-counting logic actually runs despite a "Double-Counting Prevention" report section.

**Framework alignment:** **PCAF Standard (2022), Part A (financed) & Part C (facilitated) emissions**
— PCAF attributes an investee's GHG inventory to the financier by `attribution = Outstanding /
EVIC` (Part A) or a facilitation share for capital-markets deals (Part C), then multiplies by the
investee's Scope 1+2(+3) emissions and assigns a **data-quality score 1–5** (1 = audited actuals, 5 =
sector-average proxy). **GHG Protocol Scope 3 Cat.15** — investments category, the accounting home of
financed emissions. **GFANZ Portfolio Alignment** and **IFRS S2** — named for disclosure context. The
module references these but implements only the enabled/financed ratio arithmetic.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute PCAF-compliant financed and facilitated emissions for a portfolio of debt and capital-markets
instruments, with attribution factors, avoided/enabled emissions, and a data-quality distribution
suitable for CSRD/TCFD/CDP disclosure. Coverage: listed equity, corporate bonds, business loans,
project finance, and underwriting/facilitation deals.

### 8.2 Conceptual approach
Standardised bottom-up attribution per the **PCAF Global GHG Accounting Standard (2022)**, the market
reference for financed-emissions accounting, cross-checked against **CDP/Trucost** inventory data and
**SBTi FI** target-setting conventions. Facilitated emissions follow **PCAF Part C** (a
weighting-factor approach for the capital-markets role vs on-balance-sheet lending).

### 8.3 Mathematical specification
Financed emissions per position i:
```
AF_i (attribution) =  Outstanding_i / EVIC_i           (listed equity / bonds, Part A)
                   =  Outstanding_i / (Debt_i+Equity_i) (business loans / unlisted)
FE_i  = AF_i × (Scope1_i + Scope2_i + Scope3_i·χ)       χ = Scope-3 inclusion flag
Facilitated_j = w × (DealShare_j / EVIC_j) × GHG_j       w = 0.33 (PCAF Part C weight)
AvoidedEmissions_k = (BaselineEF_k − ProjectEF_k) × Activity_k     (Part B, reported separately)
DQ_i ∈ {1..5};  DQ_portfolio = Σ (FE_i·DQ_i) / Σ FE_i
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Enterprise value incl. cash | `EVIC` | Bloomberg/Refinitiv fundamentals |
| Investee GHG inventory | `Scope1,2,3` | CDP, Trucost, company reports |
| Sector proxy EF (DQ 4–5) | — | PCAF emission-factor database, EXIOBASE |
| Facilitation weight | `w=0.33` | PCAF Part C (2023) |
| Grid displacement EF (avoided) | `BaselineEF` | IEA/IFI grid factors, CDM AMS methodologies |
| DQ score | `DQ 1–5` | PCAF data-quality table |

### 8.4 Data requirements
Per position: outstanding balance, EVIC or (debt+equity), investee Scope 1/2/3 (t CO₂e), sector code
for proxy fallback, and for projects: baseline vs project emission factor and activity level. Vendor:
Bloomberg/Refinitiv (EVIC), CDP/Trucost (inventories). Free: EXIOBASE sector intensities, IEA grid
factors, company sustainability reports. Platform already holds financed-emissions logic in
`pcaf-financed-emissions` and reference emission factors (`referenceData.EMISSION_FACTORS`).

### 8.5 Validation & benchmarking plan
Reconcile portfolio FE against an independent PCAF calculation (e.g. the platform's
`pcaf-financed-emissions` engine) for the same holdings; check the DQ-weighted average against PCAF's
recommended ≤3.0 disclosure quality target. Sensitivity: swap actual inventories for sector proxies
and confirm FE shifts monotonically with DQ. Avoided-emissions additionality tested against CDM/GCC
baseline rules.

### 8.6 Limitations & model risk
EVIC volatility (denominator) causes attribution instability quarter-to-quarter — PCAF recommends
period-end EVIC with disclosure of the effect. Avoided emissions must NOT net against financed
emissions in headline reporting (double-counting risk). Conservative fallback: missing inventories
default to the sector-average proxy at DQ 5 (never zero), so coverage gaps inflate rather than hide
the footprint.

## 9 · Future Evolution

### 9.1 Evolution A — A real PCAF attribution engine under the enablement framing (analytics ladder: rung 1 → 2)

**What.** The guide promises a regulatory-grade PCAF Scope 3 Cat.15 engine (`EE = Financing/EVIC × Investee_GHG`, DQ scores 1–5, avoided-emissions annex). The code computes none of it: product-level `enabledReduction` and `financedEmissions` are independent seeded draws (making the headline enablement `ratio` meaningless by construction), the quarterly trend is generated, and GFANZ alignment counts are hard-coded percentages (`alignedCount = 0.72·total`). Evolution A builds the actual attribution engine — the platform's only PCAF implementation today is a partial one inside `dme-portfolio`; this module is where the full standard belongs.

**How.** (1) `services/pcaf_engine.py` + `api/v1/routes/enablement.py`: holdings from `portfolios_pg`, EVIC and GHG inventories from the company master, attribution factor per PCAF Part A asset class (listed equity/bonds/loans/project finance mapping per position), and the 1–5 DQ score assigned by data provenance (reported+audited → 1, sector proxy → 5) — honestly, since much of the master will score 4–5. (2) Avoided emissions (Part B) computed only for positions with actual project data (grid displacement factor × generation), else null — no seeded "enabled reduction." (3) `dme-portfolio`'s PCAF tile consumes this engine rather than duplicating. (4) Rung 2: attribution-factor sensitivity (EVIC vs total-equity denominators) and portfolio what-ifs (divest top-N emitters).

**Prerequisites.** Company-master GHG coverage audit (DQ distribution will be dominated by proxies at first — disclose it); D0 demo portfolio. **Acceptance:** a fixture position's financed emissions reproduce `Financing/EVIC × GHG` by hand; the DQ distribution chart reflects actual provenance classes; the seeded PRODUCTS array and hard-coded alignment split are deleted.

### 9.2 Evolution B — PCAF data-quality improvement advisor (LLM tier 2)

**What.** PCAF's practical pain isn't the arithmetic — it's improving DQ scores position by position. A tool-calling advisor that queries Evolution A's engine for the portfolio's Score 4–5 positions (the workflow explicitly says "flag Score 4–5 for improvement"), explains per position what data would lift it a tier (reported Scope 1+2 → Score 2; verified → Score 1), estimates the financed-emissions revision range if proxies are replaced, and drafts the investee data-request letters — then assembles the PCAF-format disclosure with the DQ-weighted confidence framing the standard requires.

**How.** Tools: `get_position_dq(portfolio)`, `compute_financed_emissions(position, overrides)` (for the what-if revision ranges — real engine calls with hypothetical better data, clearly labeled hypothetical), `get_pcaf_asset_class_rules`. Grounding corpus = this Atlas record's §5 plus the PCAF 2022 standard references; the drafted disclosure tables pull only engine outputs, and revision estimates are always presented as ranges from actual recomputation, never point guesses.

**Prerequisites (hard).** Evolution A — advising DQ improvements on seeded positions would send data-request letters about holdings whose emissions were invented. **Acceptance:** the advisor's Score 4–5 list matches the engine's DQ query exactly; every revision range reproduces from the override recomputation; disclosure tables contain zero numbers absent from engine responses.