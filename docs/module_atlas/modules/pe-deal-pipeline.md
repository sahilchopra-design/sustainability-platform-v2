# PE Deal Pipeline
**Module ID:** `pe-deal-pipeline` · **Route:** `/pe-deal-pipeline` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages and analyses the private equity deal pipeline with integrated ESG and climate screening, enabling systematic pre-screening of opportunities before full due diligence investment.

> **Business value:** Provides PE investment teams with a disciplined, data-driven pipeline screening framework that integrates ESG and climate risk signals early in the deal cycle to improve capital allocation quality.

**How an analyst works this module:**
- Capture deal pipeline: company name, sector, geography, deal stage, investment thesis
- Apply ESG screen: sector exclusions, UNGC violations, severe ESG controversies
- Overlay climate risk pre-screen: transition exposure, physical hazard, carbon intensity vs peers
- Compute CADS; triage deals into green-light, amber-watch, and red-exclude categories

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CO_INVESTS`, `CoInvestTracker`, `DEALS`, `DealPipeline`, `FUNDS`, `FUND_STRUCTS`, `FundStructure`, `GEOGRAPHIES`, `J_CURVE`, `SECTORS`, `STAGES`, `TABS`, `VintagePerformance`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TABS` | 5 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(arr, s) => arr[Math.floor(sr(s) * arr.length)];` |
| `FUNDS` | `["Flagship Fund IV","Growth Equity II","Buyout Fund III","Secondaries I","Co-Invest SPV"];` |
| `GEOGRAPHIES` | `["North America","Europe","Asia-Pacific","MENA","LatAm"];` |
| `stage` | `pick(STAGES, i * 3);` |
| `equity` | `Math.round(ev * (0.25 + sr(i * 11) * 0.35));` |
| `ebitda` | `Math.round(ev / (6 + sr(i * 13) * 6));` |
| `rev` | `Math.round(ebitda / (0.08 + sr(i * 17) * 0.22));` |
| `irr` | `+(15 + sr(i * 19) * 25).toFixed(1);` |
| `moic` | `+(1.5 + sr(i * 23) * 2.5).toFixed(2);` |
| `FUND_STRUCTS` | `FUNDS.map((f, i) => ({` |
| `base` | `-0.15 * Math.exp(-0.3 * yr) + 0.35 * (1 - Math.exp(-0.25 * yr));` |
| `funnelData` | `STAGES.map(s => ({` |
| `sectorData` | `SECTORS.map(s => ({` |
| `pmeR2k` | `+(f.irr * (0.7 + sr(i * 3) * 0.3)).toFixed(1);` |
| `pmeMsci` | `+(f.irr * (0.65 + sr(i * 7) * 0.3)).toFixed(1);` |
| `alpha` | `+(f.irr - pmeR2k).toFixed(1);` |
| `scatterData` | `DEALS.filter(d => d.stage === "Closed").map(d => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FUNDS`, `GEOGRAPHIES`, `SECTORS`, `STAGES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Screen Pass Rate | — | Internal Benchmark | Fraction of sourced deals passing initial ESG and climate screen before proceeding to full diligence, consistent with PE industry norms. |
| Climate Taxonomy Alignment Check | — | EU Taxonomy Regulation 2020 | Minimum taxonomy alignment assessment performed at pipeline stage to assess SFDR product classification implications. |
- **Deal sourcing CRM, company financial data, ESG controversy databases, climate hazard maps** → Sector exclusion screening, ESG controversy check, climate pre-score, CADS computation → **Pipeline ESG/climate scorecard, deal triage dashboard, LP reporting inputs**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted Deal Score
**Headline formula:** `CADS = α×FinancialScore + β×ESGScore + γ×ClimateRiskScore`

Weighted composite of financial attractiveness, ESG quality, and climate risk assessment; α+β+γ=1 with weights calibrated to fund mandate and LP requirements.

**Standards:** ['PRI PE ESG Integration 2023', 'ILPA ESG Roadmap 2021']
**Reference documents:** PRI Guidance on Private Equity ESG Integration 2023; ILPA ESG Roadmap 2021; EU Taxonomy Regulation (EU) 2020/852; SFDR Delegated Regulation 2022

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** MODULE_GUIDES describes a **Climate-Adjusted Deal Score (CADS)**
> — `CADS = α×FinancialScore + β×ESGScore + γ×ClimateRiskScore` — used to triage deals into
> green-light/amber-watch/red-exclude tiers. **No such composite score, weighting scheme, or triage
> logic exists in the code.** `esgScore` is a single independent random draw per deal
> (`40 + sr(i*41)×55`), never combined with a financial or climate-risk sub-score. The page actually
> implements a **conventional PE fund/deal analytics dashboard**: deal funnel by stage, IRR/MOIC by
> fund, sector allocation, and Public Market Equivalent (PME) benchmarking against Russell 2000 and
> MSCI. Sections below document the code as it behaves; §8 specifies the CADS model the guide
> describes.

### 7.1 What the module computes

```
irr           = 15 + sr(i*19)×25                 // 15–40% synthetic deal IRR
moic           = 1.5 + sr(i*23)×2.5                // 1.5–4.0x synthetic MOIC
ebitda         = ev / (6 + sr(i*13)×6)             // EV/EBITDA multiple 6–12x, inverted for EBITDA
alpha (PME)    = fund.irr − pmeR2k                 // fund IRR minus Russell 2000-equivalent IRR
```

### 7.2 Parameterisation

| Field | Value | Provenance |
|---|---|---|
| `esgScore` | 40–95 | Synthetic demo value; no weighting into any composite |
| `irr`, `moic` | 15–40% / 1.5–4.0× | Synthetic demo value, plausible PE return ranges |
| `pmeR2k`/`pmeMsci` | `fund.irr × (0.7±0.3)` / `(0.65±0.3)` | Synthetic demo value; a crude fraction-of-fund-IRR proxy rather than an actual PME (Kaplan-Schoar) calculation against real index cash flows |
| Fund vintage decay curve | `base = −0.15×e^(−0.3yr) + 0.35×(1−e^(−0.25yr))` | Synthetic demo value: a J-curve-shaped illustrative NAV/return trajectory, standard PE J-curve shape but not fitted to actual fund cash flows |

### 7.3 Calculation walkthrough

1. **Deal generation**: stage, EV, equity check, EBITDA, revenue, IRR, MOIC drawn independently per
   deal via `sr(i*k)` — no cross-field consistency enforcement (e.g. `equity = ev×(0.25+sr×0.35)` is
   internally consistent with EV, but `irr`/`moic` are unrelated to the deal's actual capital
   structure).
2. **Funnel** (`funnelData`): counts deals by `STAGES` — a standard pipeline funnel view (Sourced →
   Screened → LOI → DD → Closed, or similar), a legitimate deal-tracking mechanic.
3. **PME alpha**: `alpha = fund.irr − pmeR2k` compares fund IRR to a synthetic "public market
   equivalent" — this *label* matches a real PE performance-measurement concept (Kaplan-Schoar PME,
   Long-Nickels PME+), but the underlying `pmeR2k` is a scaled fraction of the fund's own IRR
   (`0.7±0.3× fund.irr`), not computed from actual Russell 2000 cash-flow-matched returns — so the
   "alpha" is mechanically guaranteed to look reasonable (bounded near the fund's own IRR) rather
   than reflecting genuine relative performance.
4. **ESG/climate pre-screen**: the only ESG-related field is the standalone `esgScore`; there is no
   sector-exclusion list, no UNGC-violation flag, no climate transition/physical-hazard pre-score
   visible anywhere in the extracted formulas, despite these being explicitly named in the guide's
   `userInteraction` list.

### 7.4 Worked example

A "Closed" deal with `ev=$450M`, seed-drawn `equity=$153M` (34% of EV), `irr=28.4%`, `moic=2.9×`:
these numbers are displayed as-is in the deal table and scatter chart; there is no downstream CADS
computation to trace — the guide's triage step simply does not exist as a calculation.

### 7.5 Data provenance & limitations

- **All deal, fund, and PME data is synthetic demo data**; fund names (`FUNDS`, 5 rows) are
  plausible generic PE fund labels, not real vehicles.
- **The guide's core deliverable (CADS-based deal triage) is entirely absent** — a user cannot
  reproduce green-light/amber/red classification from this page's outputs.
- PME calculation is a labelled placeholder, not a genuine index-matched cash-flow PME.

**Framework alignment:** PRI PE ESG Integration guidance and ILPA ESG Roadmap are cited but not
implemented (no ESG screening logic); EU Taxonomy/SFDR Art.8/9 alignment check is named in the guide
but has no corresponding field in the extracted code.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Provide a systematic pre-screen that combines financial attractiveness, ESG quality, and climate
risk into a single triage score at the pipeline stage, before committing full due-diligence
resources — mirrors how infrastructure/PE investors (e.g. Actis, Apollo Sustainable) run climate
pre-screens ahead of IC memo preparation, and parallels MSCI ESG's "controversy + risk" gating logic
used in listed-equity screening, adapted to deal triage.

### 8.2 Conceptual approach
A weighted linear composite over three normalised (0–100) sub-scores, benchmarked against **MSCI
ESG Fund Ratings** methodology (weighted pillar scores with sector-relative normalisation) and
**PRI's PE ESG Integration** staged-diligence framework (screen → assess → monitor).

### 8.3 Mathematical specification

```
FinancialScore  = f(IRR_target, MOIC_target, EV/EBITDA vs sector median)      // 0-100, percentile-ranked vs deal universe
ESGScore        = Σ w_topic × TopicScore_topic   (SASB sector-material topics, see pe-esg-diligence §8)
ClimateRiskScore = 100 − (TransitionExposure×0.5 + PhysicalHazard×0.3 + CarbonIntensityPercentile×0.2)

CADS = α×FinancialScore + β×ESGScore + γ×ClimateRiskScore,   α+β+γ=1
Triage: CADS ≥ 70 → Green-light | 50–70 → Amber-watch | <50 → Red-exclude
```

| Parameter | Calibration source |
|---|---|
| α, β, γ weights | Fund mandate / LPA ESG-integration terms (LP-specific, typically α≈0.5, β≈0.25, γ≈0.25 for generalist funds per PRI PE surveys) |
| TransitionExposure | Sector carbon-intensity percentile vs GICS peers (CDP/Trucost) |
| PhysicalHazard | Asset-location composite hazard score (reuse platform's `physical-hazard-map` engine, §8 spec there) |
| Carbon intensity | tCO₂e/$M revenue vs sector median (SBTi sector pathway) |

### 8.4 Data requirements
Deal financials (IRR/MOIC/multiple targets), target-company sector + asset locations (for climate
score), ESG controversy screen (RepRisk/Sustainalytics), SASB material-topic scores. Financial data
exists in-platform (deal table); ESG/climate inputs require wiring to `pe-esg-diligence` and
`physical-hazard-map`.

### 8.5 Validation & benchmarking plan
Backtest CADS tiering against realised fund IRR outcomes (do Green-light deals outperform
Red-exclude deals that were pursued anyway); benchmark ESG sub-score against Sustainalytics/MSCI
ratings where available for public comparables.

### 8.6 Limitations & model risk
Composite scores can mask a severe single-dimension risk (e.g. a high-IRR deal with a critical ESG
controversy) — recommend a hard override gate (any UNGC violation or severe controversy = automatic
Red-exclude regardless of composite score) rather than relying purely on the linear weighting.

## 9 · Future Evolution

### 9.1 Evolution A — Build the CADS triage engine and real PME (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide describes a Climate-Adjusted Deal Score (`CADS = α×Financial + β×ESG + γ×ClimateRisk`) triaging deals into green/amber/red, but no composite, weighting, or triage logic exists — `esgScore` is one independent `sr()` draw never combined with anything. The page is a conventional PE dashboard (deal funnel, IRR/MOIC by fund, sector allocation, PME) but even the PME is a crude `fund.irr × (0.7±0.3)` proxy, not a real Kaplan-Schoar calculation against index cash flows. Evolution A builds the CADS the guide promises and fixes PME.

**How.** (1) Implement CADS as the documented weighted composite: a financial sub-score (from the deal's IRR/MOIC/multiple), an ESG sub-score (from real controversy/UNGC-violation screening — the sibling ESG modules and sanctions/controversy data provide inputs), and a climate-risk sub-score (transition exposure + physical hazard from the platform's physical-risk modules), with α/β/γ configurable per fund mandate (§1). Then the green/amber/red triage on CADS thresholds. (2) Replace the fake PME with a real Kaplan-Schoar PME: discount fund cash flows by actual Russell 2000 / MSCI index returns (market data is in the platform), not a fraction-of-IRR proxy. (3) Persist real pipeline deals in a table rather than seeding 60.

**Prerequisites.** Controversy/UNGC screening data (partially available via sanctions/ESG modules); real index cash-flow series for PME; physical/transition risk wiring. Remove `sr()` from scores. **Acceptance:** CADS decomposes into three named sub-scores and drives triage; PME reproduces a Kaplan-Schoar calc against real index returns; deals persist.

### 9.2 Evolution B — Deal-screening copilot for PE teams (LLM tier 2)

**What.** A copilot for the PE investment-team users §1 targets: "screen this inbound deal — CADS, ESG flags, climate exposure", "which pipeline deals are amber-watch and why?", "what's this fund's PME vs Russell 2000?" — executed against the (Evolution-A) CADS and PME engines, decomposing each deal's triage into its financial/ESG/climate sub-scores.

**How.** Tool calls to endpoints wrapping CADS, the triage logic, and PME; system prompt from this Atlas page's §5 and the PRI PE ESG / ILPA references named in §5. Deal screening returns the CADS decomposition with the binding sub-score highlighted (why a deal is amber); the fabrication validator matches every score/IRR/PME to a tool response. The ESG-flag component must cite the specific controversy/exclusion that triggered it (an auditable signal, not an opaque score). Mutating actions (advancing a deal's stage) gate behind confirmation + RBAC.

**Prerequisites (hard).** Evolution A — there is no CADS or real PME to call today; a copilot narrating the current independent `esgScore` draw as a deal-quality signal would launder noise into an investment decision. **Acceptance:** every CADS/PME figure traces to a tool call; triage explanations name the driving sub-score and specific ESG flags; the copilot refuses to score deals before CADS exists.