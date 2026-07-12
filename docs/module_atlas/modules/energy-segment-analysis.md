# Energy Segment Analysis
**Module ID:** `energy-segment-analysis` · **Route:** `/energy-segment-analysis` · **Tier:** B (frontend-computed) · **EP code:** EP-CU2 · **Sprint:** CU

## 1 · Overview
Upstream, midstream, downstream segment decomposition with revenue, EBITDA, CapEx, and transition score per segment.

**How an analyst works this module:**
- Segment Overview shows 5 segments with financial metrics
- Cross-Segment Metrics shows internal carbon pricing

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CROSS_SEGMENT`, `DOWNSTREAM_DETAIL`, `MIDSTREAM_DETAIL`, `REVENUE_TREND`, `SEGMENTS`, `SEG_COLORS`, `TABS`, `TRANSITION_RADAR`, `UPSTREAM_DETAIL`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REVENUE_TREND` | 7 | `Upstream`, `Midstream`, `Downstream` |
| `TRANSITION_RADAR` | 7 | `Upstream`, `Midstream`, `Downstream` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Segment Overview','Upstream (E&P)','Midstream (Transport)','Downstream (Refining+Retail)','Cross-Segment Metrics','Transition Readiness'];` |
| `cost` | `(SEGMENTS[s].emissions_mt * carbonPrice / 1000).toFixed(2);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `REVENUE_TREND`, `TABS`, `TRANSITION_RADAR`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Segments | — | Organizational | Upstream, midstream, downstream, renewables, retail |

## 5 · Intermediate Transformation Logic
**Methodology:** Segment P&L decomposition
**Headline formula:** `Transition_score per segment = taxonomy assessment weighted by segment revenue`

Revenue, EBITDA, CapEx, and emissions split by segment.

**Standards:** ['IEA', 'Company filings']
**Reference documents:** IEA World Energy Outlook

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide describes a segment P&L decomposition with a transition score per segment — implemented as
written. One small discrepancy: the guide's data-point says "5 segments (upstream, midstream,
downstream, renewables, retail)", but the code models **three** segments only — Upstream, Midstream,
Downstream (renewables/retail appear as *within*-downstream detail, e.g. EV chargers, biofuel blend).
The module is a static, transparent decomposition dashboard with one live calculation.

### 7.1 What the module computes

Hand-authored segment financials (`SEGMENTS`), 6-year revenue trend, and per-segment operational
detail (`UPSTREAM_DETAIL`, `MIDSTREAM_DETAIL`, `DOWNSTREAM_DETAIL`). The only render-time computation
is the internal-carbon-price cost overlay:

```js
cost = SEGMENTS[segment].emissions_mt × carbonPrice / 1000        // $B carbon cost
```

`transition_score` per segment is a **stored** attribute (Upstream 32, Midstream 55, Downstream 48),
not computed from a taxonomy assessment as the guide's formula suggests.

### 7.2 Parameterisation / scoring rubric

| Segment | Revenue $B | EBITDA $B | CapEx $B | Emissions Mt | Transition score |
|---|---|---|---|---|---|
| Upstream (E&P) | 42.5 | 18.2 | 12.8 | 28.4 | 32 |
| Midstream (transport) | 18.7 | 8.9 | 4.2 | 5.1 | 55 |
| Downstream (refining+retail) | 56.3 | 6.1 | 8.5 | 18.7 | 48 |

Detail objects carry realistic operational metrics:

| Segment | Key detail |
|---|---|
| Upstream | reserves 8,420 mmboe, R/P 11.2 yr, production 1,840 mboed, decline 4.8%/yr, decline curve to 2040 |
| Midstream | 12,400 km pipeline, 78% utilisation, LNG 18.5 mtpa cap / 14.8 throughput |
| Downstream | 1,250 kbd refinery, 82% util, 2,400 EV chargers, 8.5% biofuel blend, 8,200 retail sites |

`CROSS_SEGMENT.internal_carbon_price = 85` ($/tCO₂), `transfer_pricing_adj = 2.4`. All values are
editorial (integrated-major-plausible), not a live feed.

### 7.3 Calculation walkthrough

Load static segment data → the overview shows revenue/EBITDA/CapEx/emissions per segment and the
transition-score radar → the detail tabs render each segment's operational metrics and time series →
the cross-segment tab applies the internal carbon price to each segment's emissions to show the carbon
cost burden. EBITDA margin is read directly (e.g. Downstream 6.1/56.3 = 10.8% vs Upstream 18.2/42.5 =
42.8%), illustrating upstream's higher margin but higher emissions intensity.

### 7.4 Worked example

Internal carbon-price cost for **Upstream** at the default `carbonPrice = 85` $/tCO₂:
```
cost = 28.4 Mt × 85 / 1000 = 28.4 × 85 / 1000 = $2.41B
```
Against Upstream EBITDA of $18.2B, an $85 internal carbon price consumes ≈13% of segment EBITDA —
the module's central message that upstream carries the largest transition-cost exposure (28.4 Mt vs
midstream 5.1 Mt). Downstream at the same price: `18.7 × 85/1000 = $1.59B`, ≈26% of its thinner $6.1B
EBITDA.

### 7.5 Companion analytics

- **Transition-readiness radar:** the 7-point `TRANSITION_RADAR` series compares segment scores across
  dimensions; Midstream scores highest (55) reflecting infrastructure repurposing optionality.
- **Decline curve (upstream):** production 1,840 → 858 mboed by 2040 at ~4.8%/yr — the natural
  depletion pathway even absent transition policy.
- **Downstream buildout:** EV chargers 200 → 2,400 and biofuel blend 3.2% → 8.5% (2020–2025) — the
  retail-network transition.

### 7.6 Data provenance & limitations

- **All data is static editorial** (no PRNG); magnitudes are integrated-major-plausible but not a real
  company.
- `transition_score` is a **stored heuristic**, not computed from taxonomy/SBTi assessment despite the
  guide's "taxonomy assessment weighted by segment revenue" formula.
- Only three operating segments are modelled (not the guide's five); renewables/retail are embedded as
  downstream detail rather than standalone segments.

**Framework alignment:** **IEA World Energy Outlook** — the upstream/midstream/downstream value-chain
framing and the decline-curve/utilisation concepts; **internal carbon pricing** (TCFD-recommended) —
the $85/tCO₂ shadow price applied to segment emissions is the standard shadow-cost technique for
stress-testing transition exposure. Company-filing segment reporting (IFRS 8 operating segments)
underpins the P&L decomposition structure.

## 9 · Future Evolution

### 9.1 Evolution A — Multi-issuer segment data with a computed transition score (analytics ladder: rung 1 → 2)

**What.** §7 rates this a "static, transparent decomposition dashboard with one live calculation": hand-authored financials for three segments (guide says five; renewables/retail are folded into downstream detail), realistic operational metrics (8,420 mmboe reserves, 12,400 km pipeline), and a single render-time computation — the internal-carbon-price cost overlay `emissions × price / 1000`. The `transition_score` per segment (32/55/48) is a stored attribute, though the guide says it should be a taxonomy assessment weighted by segment revenue. Evolution A makes both the data and the score real.

**How.** (1) Backend `energy_segments` table sourced from issuer filings' segment notes (shared collection effort with `energy-revenue-split`'s Evolution A — the same ~10 integrated majors, one ingestion pass, two consumers), replacing the single anonymous demo company with an issuer selector. (2) Compute the transition score as the guide specifies: each segment's activities mapped to taxonomy alignment (via the `eu-taxonomy-engine` / `energy-sector-taxonomy` screening) weighted by segment revenue — deleting the stored 32/55/48 constants. (3) Rung 2: the carbon-price overlay grows into a proper what-if — price path scenarios (EU ETS forward curve vs internal $85/t) applied to per-segment emissions, showing EBITDA erosion per segment per scenario. (4) Resolve the 3-vs-5 segment discrepancy explicitly: either model renewables/retail as segments or amend the guide.

**Prerequisites.** Segment-note data collection (manual per issuer initially); taxonomy-engine availability for the score computation. **Acceptance:** a real issuer's segment revenue/EBITDA matches its filing; the transition score reproduces from the taxonomy-weighted formula; the carbon-cost overlay at $85/t reproduces the documented arithmetic.

### 9.2 Evolution B — Segment-economics copilot (LLM tier 1)

**What.** This module's LLM need is explanatory, not operational: analysts landing on the segment view ask "why does downstream have the highest revenue but lowest EBITDA margin?", "what does a $150/t carbon price do to upstream profitability?", "how is the transition score derived?" A tier-1 copilot answers from the page's loaded data and this Atlas record — including the honest caveat, pre-Evolution-A, that transition scores are stored assessments rather than computed values.

**How.** Pure RAG per the roadmap's tier-1 pattern: this Atlas record (§7.1's formula, §7.2's segment and detail tables) embedded in `llm_corpus_chunks`, plus the page's current state (selected carbon price, active segment) passed as structured context. The carbon-cost question is answerable exactly — the formula and inputs are on the page — so the copilot walks the arithmetic rather than estimating. The refusal path covers what the module doesn't have: issuer comparisons (pre-Evolution-A there is one company), quarterly granularity, cash-flow forecasts.

**Prerequisites.** Tier-1 copilot infrastructure (`module_copilot.py` router, corpus embedding) — no module-specific backend needed, which is why tier 1 is the right first rung here. **Acceptance:** golden Q&A (5 questions from §7 content) answered with correct figures and formula citations; the carbon-cost walkthrough matches the page's computed value at the same slider position; questions about unmodeled segments (renewables standalone) get the honest 3-segment explanation.