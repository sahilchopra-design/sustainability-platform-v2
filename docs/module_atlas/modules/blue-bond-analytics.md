# Blue Bond Market Analytics
**Module ID:** `blue-bond-analytics` · **Route:** `/blue-bond-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DZ2 · **Sprint:** DZ

## 1 · Overview
Blue bond market analytics covering sovereign and corporate issuance, sustainable ocean economy use-of-proceeds (fisheries, maritime transport, coastal resilience), ICMA Blue Bond Principles, and World Bank/ADB blue bond structures.

> **Business value:** Delivers comprehensive blue bond market analytics integrating ICMA alignment scoring, pricing premium analysis, and sustainable ocean economy use-of-proceeds assessment across sovereign and corporate issuers.

**How an analyst works this module:**
- Map use-of-proceeds across ICMA Blue Bond Principles categories (fisheries, aquaculture, shipping, coastal, ocean energy, waste)
- Score alignment against sustainable ocean economy criteria and DNSH considerations
- Calculate pricing premium by constructing issuer vanilla yield curve and comparing to blue bond yield
- Benchmark against World Bank/ADB blue bond structures for best-practice framework design

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FRAMEWORKS`, `ISSUERS`, `Kpi`, `MARKET_GROWTH`, `OCEAN_RISKS`, `TABS`, `USE_OF_PROCEEDS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ISSUERS` | 9 | `name`, `type`, `rating`, `sizeGbn`, `greeniumBps`, `coupon`, `maturity`, `oceanFocus`, `iswgAligned`, `cbiCertified`, `country` |
| `USE_OF_PROCEEDS` | 7 | `share`, `avgIrr`, `co2Mt`, `description` |
| `MARKET_GROWTH` | 9 | `issuanceGbn`, `deals`, `avgGreeniumBps` |
| `FRAMEWORKS` | 6 | `body`, `pillars`, `mandatory`, `greeniumBps` |
| `OCEAN_RISKS` | 7 | `severity`, `trend`, `linkedAssets` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annSaving` | `faceValue * (greeniumBps / 10000);` |
| `totalIssuance` | `ISSUERS.reduce((s, i) => s + i.sizeGbn, 0);` |
| `avgGreenium` | `ISSUERS.length > 0 ? ISSUERS.reduce((s, i) => s + i.greeniumBps, 0) / ISSUERS.length : 0;` |
| `totalCo2Impact` | `USE_OF_PROCEEDS.reduce((s, u) => s + u.co2Mt, 0);` |
| `scatterData` | `ISSUERS.map(i => ({ x: i.sizeGbn, y: i.greeniumBps, name: i.name, rating: i.rating }));` |
| `portfolioTotal` | `portfolio.reduce((s, p) => s + p.amount, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FRAMEWORKS`, `ISSUERS`, `MARKET_GROWTH`, `OCEAN_RISKS`, `TABS`, `USE_OF_PROCEEDS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Blue Bond Issuance | `Cumulative blue bond issuance (sovereign + corporate, 2018-2023)` | Climate Bonds Initiative Blue Bond Database | Fastest growing sustainable bond segment; Seychelles (2018) sovereign first; ADB, World Bank leading MDB issuers |
| Blue Bond Alignment Score | `Weighted average use-of-proceeds alignment across ICMA Blue Bond Principles categories` | External review / SPO assessment | Scores above 80 qualify for CBI Climate Bonds certification; 70-80 standard green-equivalent; below 70 risks greenwashing |
| Blue Greenium vs Vanilla | `Yield differential for blue vs conventional bond by matched issuer/maturity` | Bloomberg BVAL | Emerging premium as investor demand grows; sovereign blue bonds show larger premium than corporate |
- **Climate Bonds Initiative blue bond database** → Issuance terms, use-of-proceeds, impact data → market benchmarking and alignment scoring → **Peer comparison and best practice identification**
- **Bloomberg BVAL and secondary market data** → Real-time pricing for blue and conventional bonds by issuer → greenium calculation → **Pricing premium analysis**
- **FAO fisheries sustainability data** → Stock status, fishing pressure by species → sustainable fisheries eligibility assessment → **Use-of-proceeds alignment scoring**

## 5 · Intermediate Transformation Logic
**Methodology:** Blue Bond Impact & Pricing Analytics
**Headline formula:** `Blue Bond Alignment Score = Σ(Category Weight × Category Compliance); Blue Premium = Yield(conventional) - Yield(blue) in bps`

Measures blue bond quality via use-of-proceeds alignment scoring and pricing premium analysis relative to vanilla issuer comparables

**Standards:** ['ICMA Blue Bond Principles 2023', 'World Bank Blue Bond Framework', 'Sustainable Ocean Economy Finance Principles (UNEP FI)']
**Reference documents:** ICMA (2023) Blue Bond Principles — Voluntary Process Guidelines; World Bank (2018) Blue Bond Framework and Impact Report; UNEP FI (2022) Sustainable Ocean Economy Finance Principles; Climate Bonds Initiative (2023) Marine and Fisheries Criteria

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

A blue-bond market explorer. Almost all figures are read from static seed tables; the
only live arithmetic is a trivial coupon-saving identity and market aggregates:

```js
annSaving      = faceValue × (greeniumBps / 10000)          // $ saved per year from the greenium
totalIssuance  = Σ ISSUERS.sizeGbn
avgGreenium    = Σ ISSUERS.greeniumBps / n
totalCo2Impact = Σ USE_OF_PROCEEDS.co2Mt
scatterData    = ISSUERS → {x: size, y: greeniumBps, rating}
```

The greenium (`greeniumBps`) is a **stored per-issuer field**, not estimated from a
yield-curve comparison — the page displays it and multiplies by face value.

### 7.2 Parameterisation

`ISSUERS` (9 rows) — name, type, rating, size $Bn, greenium bps, coupon, maturity,
ocean focus, ISWG alignment, CBI certification, country. `USE_OF_PROCEEDS` (7 rows)
carry share %, average IRR and CO₂ impact (Mt) per category (fisheries, shipping,
coastal resilience, ocean energy, waste, etc.). `MARKET_GROWTH` (9 rows) tracks
issuance $Bn, deal count and average greenium bps over time. `FRAMEWORKS` (6 rows:
ICMA Blue Bond Principles, World Bank, ADB, UNEP FI, CBI, etc. — pillars, mandatory
flag, greenium bps) and `OCEAN_RISKS` (7 rows: severity, trend, linked assets) are
descriptive. Guide anchors: global issuance ~$5.8Bn, alignment score 81/100, blue
greenium −4.8 bps.

### 7.3 Calculation walkthrough

1. Aggregate issuance, mean greenium and total CO₂ impact across the seed tables.
2. Scatter size vs greenium (with rating) to show the pricing-premium pattern.
3. Portfolio tab sums holding amounts; `annSaving` shows the coupon benefit of the
   greenium on a chosen face value.

### 7.4 Worked example

A $500M blue bond with a stored greenium of `−5 bps` (issuer pays 5 bps *less* than a
vanilla comparable):

| Step | Computation | Result |
|---|---|---|
| Annual saving | 500,000,000 × (5/10000) | **$250,000/yr** |
| Over 10-yr tenor | 250,000 × 10 | $2.5M |

So a 5 bp greenium on a half-billion-dollar issue is worth ~$250k/yr of reduced
funding cost — the economic rationale for pursuing the "blue" label despite second-
party-opinion and reporting costs.

### 7.5 Data provenance & limitations

- The greenium is **seed data**, not measured — there is no matched vanilla curve,
  no regression controlling for rating/tenor/liquidity, so the −4.8 bps headline is
  illustrative.
- Alignment score (81/100) is a stated benchmark, not computed from use-of-proceeds
  scoring on this page.
- CO₂ impact figures are stored per category, not derived from proceeds allocation.

**Framework alignment:** ICMA Blue Bond Principles 2023 (use-of-proceeds, management,
reporting — the `FRAMEWORKS`/`USE_OF_PROCEEDS` tables) · World Bank / ADB blue-bond
structures · UNEP FI Sustainable Blue Economy Finance Principles · Climate Bonds
Initiative marine criteria (CBI certification flag). The greenium concept is standard
(yield of green/blue minus matched conventional), but here it is asserted rather than
estimated.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Estimate the *actual* blue/greenium for a bond by controlling
for rating, tenor, currency and liquidity, and score use-of-proceeds alignment — for
issuers pricing new deals and investors screening the label.

**8.2 Conceptual approach.** A **matched-pair / curve-based greenium estimator** (the
CBI and Climate Bonds greenium methodology) plus a fixed-effects regression to isolate
the label premium — benchmarked against **CBI Green Bond Pricing reports** and
**Bloomberg BVAL** secondary spreads.

**8.3 Mathematical specification.**
```
Greenium_bps = YTM_blue − YTM_synthetic_vanilla
  YTM_synthetic_vanilla from same-issuer curve interpolated to blue-bond tenor
Panel regression: spread_i = α + β·Blue_i + γ·Rating_i + δ·Tenor_i + ζ·Liquidity_i + ε_i
  β̂ = estimated greenium (bps), with confidence interval
Alignment = Σ_k w_k · category_compliance_k   (ICMA BBP categories, SPO-scored)
AnnSaving = face · |Greenium| / 10000 ;  NPV_saving = Σ_t AnnSaving/(1+r)^t
```

| Parameter | Source |
|---|---|
| Yield/spread data | Bloomberg BVAL / ICE, secondary market |
| Issuer curve | Same-issuer vanilla bonds (interpolated) |
| Control factors | Rating (agencies), tenor, bid-ask liquidity |
| Alignment weights | ICMA Blue Bond Principles + SPO |

**8.4 Data requirements.** Bond-level yields/spreads, issuer curve constituents,
rating/tenor/liquidity, use-of-proceeds allocation, SPO. None currently ingested;
platform holds only the seed tables.

**8.5 Validation & benchmarking.** Reconcile estimated greenium against CBI Green
Bond Pricing report ranges; test regression stability across sub-samples
(sovereign vs corporate); check sign/magnitude vs the −1 to −10 bps literature.

**8.6 Limitations & model risk.** Thin blue-bond universe → few matched pairs and wide
CIs; liquidity is hard to control; greenium is time-varying and demand-driven.
Conservative fallback: report the greenium as a range with its CI and flag when the
sample is too small for a significant estimate.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the greenium and alignment score instead of storing them (analytics ladder: rung 1 → 3)

**What.** The page is a market explorer where the two headline analytics are pre-baked: the greenium is a **stored per-issuer field** (`greeniumBps`), not derived from a yield-curve comparison, and the alignment score is described but the page only aggregates static `USE_OF_PROCEEDS` shares. The 9 issuers, market-growth series, and framework/risk tables are all seed constants. Evolution A implements the two computations the module's methodology names (`Blue Premium = Yield(conventional) − Yield(blue)` and `Alignment = Σ category_weight × compliance`).

**How.** (1) Real greenium: construct the issuer's vanilla yield curve from comparable conventional bonds (the platform's market-data seed / yfinance-style feeds carry govvie and corporate yields) and compute the blue-vs-matched-maturity spread — the module's own formula, currently short-circuited by a stored field. (2) Alignment scoring as a real weighted computation over ICMA Blue Bond Principles categories with a documented per-category compliance rubric, flagging the <70 greenwashing-risk band the §7.2 note cites. (3) Use-of-proceeds CO₂ impact and IRR sourced or clearly labelled rather than seeded. (4) Rung 3: benchmark computed greeniums against the Climate Bonds Initiative blue-bond database (a real dataset) and report the fit. As a backend vertical this becomes `POST /api/v1/blue-bonds/greenium` and `/alignment`.

**Prerequisites.** A comparable-bond yield source for the vanilla curve (the hardest input — sovereign blue issuers like Seychelles have thin comparables, which the model must acknowledge with wide confidence); CBI database access. **Acceptance:** greenium is computed from a constructed curve, not read from a field; two issuers with different UoP mixes get different alignment scores; a sub-70 score triggers the greenwashing-risk flag.

### 9.2 Evolution B — Blue-bond framework-alignment copilot (LLM tier 1 → 2)

**What.** Tier 1: a copilot explaining the blue-bond market and ICMA principles — "what use-of-proceeds categories qualify?", "why does this sovereign bond show a larger greenium than the corporate one?", "what's the difference between CBI certification and standard green-equivalent?" — grounded in this Atlas record with the disclosure that greeniums and scores are currently stored demo values (until Evolution A). Tier 2 runs the alignment and greenium engines as tools for real issuer assessment.

**How.** Tier-1 corpus from this record (§7.2 issuer/framework tables, the ICMA Blue Bond Principles and UNEP FI Sustainable Ocean Economy references in §5). The refusal path matters pre-Evolution-A: asked "what's this bond's real greenium?", the copilot states the figure is a stored demo value, not a computed spread. Tier 2 tool schemas over the new greenium/alignment routes; the copilot drafts an SPO-style alignment narrative citing per-category compliance, every score tool-traced, with the thin-comparables caveat surfaced for sovereign issuers.

**Prerequisites.** Copilot router (tier 1); Evolution A's computation routes (tier 2). **Acceptance:** tier-1 answers label greeniums/scores as stored demo values; tier-2 alignment assessments trace every category score to a tool response; sovereign greeniums carry the comparable-scarcity caveat.