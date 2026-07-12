# Controversy Materiality
**Module ID:** `controversy-materiality` · **Route:** `/controversy-materiality` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Assesses the financial materiality of ESG controversies on equity valuations and credit spreads using event study methodology, SASB materiality mapping, and sector-specific financial impact models. Quantifies the expected financial impact of controversy severity tiers on EV/EBITDA multiples and CDS spreads.

> **Business value:** Enables credit analysts and portfolio managers to price ESG controversy risk into valuations and credit assessments, supporting active ownership decisions and providing quantitative evidence for stewardship engagement with investee companies.

**How an analyst works this module:**
- Select company or controversy event from the browser panel
- Financial Impact tab shows EV/EBITDA compression and CDS spread impact by severity tier
- SASB Materiality Mapping tab links controversy type to relevant SASB industry standards
- Persistence Curve shows expected decay path of financial impact over time
- Peer Comparison contrasts controversy-adjusted valuations across sector peers
- Export controversy materiality assessment for investment committee or stewardship reporting

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CHART_COLORS`, `CONTROVERSY_ESRS_MAP`, `CONTROVERSY_EVENTS`, `CustomTooltip`, `ENRICHED_EVENTS`, `ESRS_TOPICS`, `KpiCard`, `LS_PORT`, `LS_PREFS`, `SEV_COLOR`, `SEV_LABEL`, `Section`, `SortHeader`, `TOPIC_MAP`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ESRS_TOPICS` | 11 | `label`, `category`, `materialScore` |
| `CONTROVERSY_EVENTS` | 31 | `company`, `ticker`, `sector`, `type`, `severity`, `date`, `region`, `estImpactUsd`, `description`, `remediation`, `verified` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `fmtM` | `v => v >= 1000 ? `$${(v / 1000).toFixed(1)}B` : `$${v}M`;` |
| `ENRICHED_EVENTS` | `CONTROVERSY_EVENTS.map(e => ({` |
| `holdings` | `useMemo(() => { return portfolio.map(h => { const match = GLOBAL_COMPANY_MASTER.find(c => c.isin === h.isin \|\| c.ticker === h.ticker \|\| c.company_name === h.company_name);` |
| `totalImpact` | `ENRICHED_EVENTS.reduce((s, e) => s + e.estImpactUsd, 0);` |
| `holdingTickers` | `new Set(holdings.map(h => h.ticker));` |
| `avgSeverity` | `(ENRICHED_EVENTS.reduce((s, e) => s + e.severity, 0) / ENRICHED_EVENTS.length).toFixed(1);` |
| `materialIds` | `new Set(materialTopics.map(t => t.id));` |
| `types` | `[...new Set(ENRICHED_EVENTS.map(e => e.type))];` |
| `controversyTypes` | `useMemo(() => [...new Set(ENRICHED_EVENTS.map(e => e.type))], []);` |
| `validationData` | `useMemo(() => { return ESRS_TOPICS.map(t => { const supporting = ENRICHED_EVENTS.filter(e => e.esrsTopics.includes(t.id) && e.severity >= 3).length;` |
| `avgSev` | `total > 0 ? ENRICHED_EVENTS.filter(e => e.esrsTopics.includes(t.id)).reduce((s, e) => s + e.severity, 0) / total : 0;` |
| `status` | `isMaterial && total > 0 ? 'validated' : !isMaterial && total > 0 ? 'gap' : isMaterial && total === 0 ? 'untested' : 'non-material';` |
| `severityByTopic` | `useMemo(() => { return ESRS_TOPICS.map(t => { const events = ENRICHED_EVENTS.filter(e => e.esrsTopics.includes(t.id));` |
| `totalSeverity` | `events.reduce((s, e) => s + e.severity, 0);` |
| `maxSev` | `events.length > 0 ? Math.max(...events.map(e => e.severity)) : 0;` |
| `caughtAnalysis` | `useMemo(() => { const materialIds = new Set(ESRS_TOPICS.filter(t => t.materialScore >= 50).map(t => t.id));` |
| `engagementRecs` | `useMemo(() => { const holdingTickers = new Set(holdings.map(h => h.ticker));` |
| `portfolioExposure` | `useMemo(() => { const holdingTickers = new Set(holdings.map(h => h.ticker));` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHART_COLORS`, `CONTROVERSY_EVENTS`, `ESRS_TOPICS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EV/EBITDA Compression (Sev.4) | — | Event study calibration | Multiple compression observed for severity-4 ESG controversies in GICS sector cross-section |
| CDS Spread Widening (Sev.5) | — | Barclays ESG Credit Research | Credit default swap spread widening observed following severe ESG controversies |
| Controversy Persistence Half-Life | — | RepRisk temporal analysis | Time for financial impact to decay by 50% post-controversy onset, sector-dependent |
| SASB Materiality Alignment | — | SASB Materiality Map | Proportion of controversies mapped to financially material SASB topics for that sector |
| Financial Impact Range | — | Event study estimates | Estimated range of equity value impact from ESG controversies by severity tier |
- **RepRisk / MSCI controversy database** → Classify severity, map to SASB industry, tag financial sector → **Controversy event register with severity and materiality flags**
- **Bloomberg/Refinitiv price and multiple data** → Run event study around controversy dates, estimate β by sector → **Calibrated controversy β coefficients per GICS sector**
- **CDS spread history** → Compute abnormal spread widening post-controversy, regress on severity → **Credit impact model per severity tier**

## 5 · Intermediate Transformation Logic
**Methodology:** Controversy Financial Impact Model
**Headline formula:** `EV_impact = β_controversy × SeverityScore × PersistenceDecay(t)`

Beta coefficients are calibrated from event study analysis of 2,000+ ESG controversies across GICS sectors (2010–2024). Severity scores (1–5) map to empirically observed multiple compression: Severity 3 = −2.5× EV/EBITDA; Severity 5 = −6.8×. Persistence decay follows exponential function with sector-specific half-life (financial sector: 18 months; energy: 36 months). Credit spread impact calibrated from Barclays ESG Credit study.

**Standards:** ['SASB Materiality Map', 'MSCI ESG Ratings Methodology', 'Friede et al. 2015 Meta-Analysis']
**Reference documents:** SASB Materiality Map by Sector 2023; Friede, Busch & Bassen (2015) ESG and Financial Performance: Aggregated Evidence; Barclays ESG Fixed Income Research 2020; MSCI ESG Controversy Assessment Methodology

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a **Controversy Financial Impact
> Model** — `EV_impact = β_controversy × SeverityScore × PersistenceDecay(t)`, with event-study-calibrated
> β per GICS sector, EV/EBITDA compression tables (Sev 3 = −2.5×, Sev 5 = −6.8×), sector-specific
> persistence half-lives, and a Barclays-calibrated CDS-spread impact. **None of that financial-impact
> logic exists in the code.** What the page actually implements is a **double-materiality validation
> cross-check**: it maps 30 curated controversy events to ESRS topics and asks *does the observed
> controversy evidence support (or challenge) the materiality assessment for each ESRS topic?* There is
> no β, no EV/EBITDA compression, no decay function, no CDS model. `estImpactUsd` is a **curated data
> field**, not a modelled output. Sections below document the validation logic; §8 specifies the impact
> model the guide promises.

### 7.1 What the module computes

The core computation is a per-ESRS-topic validation status derived from controversy support vs. the
topic's stored material score:

```js
supporting = |events where esrsTopics.includes(topic) AND severity ≥ 3|
total      = |events where esrsTopics.includes(topic)|
avgSev     = total>0 ? mean(severity over topic events) : 0
isMaterial = topic.materialScore ≥ 50
status     = isMaterial && total>0 ? 'validated'
           : !isMaterial && total>0 ? 'gap'
           : isMaterial && total==0 ? 'untested'
           :                          'non-material'
netScore   = supporting × avgSev
```

`avgSeverity = mean(severity)` and `totalImpact = Σ estImpactUsd` are simple roll-ups. The "gap" status is
the analytically interesting output: a topic that is scored *non-material* (materialScore < 50) yet has
severe controversies attached — i.e. a potential materiality-assessment miss.

### 7.2 Parameterisation / scoring rubric

| Quantity | Value / rule | Provenance |
|---|---|---|
| `ESRS_TOPICS.materialScore` | E1 78, G1 70, S1 65, … E5 38 | Curated demo material scores |
| Materiality threshold | `materialScore ≥ 50` | Hard-coded cut-off |
| Support threshold | `severity ≥ 3` | Hard-coded ("Moderate+") |
| `severity` scale | 1 Minor … 5 Critical | MSCI/RepRisk-style severity tiers |
| `estImpactUsd` | $25M–$3,800M | **Curated per-event field, not computed** |
| `CONTROVERSY_ESRS_MAP` | type → ESRS topic ids | Editorial mapping (20 types) |

The 30 events are **hand-curated real incidents** (Shell Niger Delta spill, VW emissions, Boeing 737 MAX,
Google EU antitrust €4.1B, Glencore DRC bribery…) with severity, region, `estImpactUsd`, and remediation
status assigned editorially. Portfolio overlay matches events to holdings by ticker/ISIN via
`GLOBAL_COMPANY_MASTER`.

### 7.3 Calculation walkthrough

1. `ENRICHED_EVENTS` = each event + its `esrsTopics` from `CONTROVERSY_ESRS_MAP[type]`.
2. `validationData` iterates the 10 ESRS topics, counting supporting (sev≥3) and total events, computing
   `avgSev` and the four-way `status`.
3. `caughtAnalysis` flags whether each event's topic was pre-flagged material (`materialScore ≥ 50`) — the
   "caught vs. gap" chart quantifies double-materiality coverage.
4. `portfolioExposure`/`engagementRecs` intersect event tickers with the loaded portfolio to prioritise
   stewardship. `severityByTopic` aggregates total/max severity per topic for the heatmap.

### 7.4 Worked example

Topic **E4 (Biodiversity)**, `materialScore = 48` → `isMaterial = false` (48 < 50). Events mapping to E4:
JBS deforestation (sev 5), BHP tailings (sev 4, via E2/E5 not E4 — check map), Rio Tinto water (E2/E3).
Deforestation maps to `['E4','E5']`, so JBS (sev 5) supports E4. With `total ≥ 1` and `isMaterial = false`,
`status = 'gap'` — the model flags E4 as a **materiality miss**: severe biodiversity controversies exist
but the topic was scored below the 50 materiality threshold. `netScore = supporting × avgSev`
(e.g. 1 × 5 = 5) ranks the severity of the gap. No dollar EV impact is derived — the JBS `estImpactUsd`
of $280M is displayed as a curated figure, not a `β × severity × decay` output.

### 7.5 Companion analytics on the page

Tabs cover: controversy browser (filter by type/severity/verified), Materiality Validation table (the
`validationData` above), severity-by-topic heatmap/radar, "caught vs gap" double-materiality coverage
chart, portfolio exposure (matched holdings), and engagement recommendations. Export to JSON/CSV/Markdown.
No backend engine or route — all client-side over the curated event set + portfolio localStorage.

### 7.6 Data provenance & limitations

- **Events are curated real incidents; scores are editorial.** `materialScore`, `severity`, and
  `estImpactUsd` are assigned, not derived — there is a defined `sr()`/`hashStr` PRNG in the file but it
  is not used in the validation path (the events are hard-coded).
- The validation is a **presence check**, not a financial model: it asks whether controversies exist for a
  material topic, not what they cost. The guide's β/decay/EV-EBITDA/CDS machinery is entirely absent.
- `estImpactUsd` totals (`totalImpact`) should not be read as a modelled portfolio loss — they are a sum of
  hand-entered impact estimates.

**Framework alignment:** *ESRS / CSRD double materiality* is the real framework the page operationalises —
it cross-checks each ESRS topic's materiality determination against controversy evidence, exactly the kind
of triangulation EFRAG guidance recommends. *SASB Materiality Map* (sector-specific financially material
topics) is referenced as the mapping basis. *Friede, Busch & Bassen (2015)* and *Barclays ESG Credit* are
cited as the empirical basis for the (unimplemented) financial-impact model. *MSCI ESG Controversy
Assessment* supplies the 1–5 severity convention actually used.

---

## 8 · Model Specification — Controversy Financial-Impact Model (EV & Credit)

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Translate an ESG controversy (type, severity, sector, date) into an expected valuation and credit impact —
EV/EBITDA multiple compression and CDS-spread widening — so credit and equity PMs can price controversy
risk and prioritise stewardship. Coverage: listed issuers with sector and multiple/spread data.

### 8.2 Conceptual approach
Calibrate sector-level β via **event-study abnormal-return analysis** (the standard finance-academic
approach: MacKinlay 1997) on a controversy panel, then apply an **exponential persistence decay** with a
sector-specific half-life. This mirrors **MSCI ESG controversy-adjusted valuation** and the **Barclays ESG
fixed-income** credit-impact studies; the equity leg follows the Friede-Busch-Bassen evidence that ESG
events move multiples materially in high-materiality sectors.

### 8.3 Mathematical specification
```
EV_compression_i = β_sector(i) × Severity_i × Material_i × PersistenceDecay(t − t0_i)
PersistenceDecay(Δt) = exp( − ln2 · Δt / HalfLife_sector )
ΔMultiple_i = EV_compression_i × (EV/EBITDA)_baseline
ΔCDS_i      = γ_sector × Severity_i × exp(−ln2·Δt/HalfLife_credit)     (bps)
EquityImpact_% = ΔMultiple_i / (EV/EBITDA)_baseline
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Sector β | `β_sector` | Event study on RepRisk/MSCI controversy panel 2010–2024 |
| Severity | `Severity_i` | MSCI/RepRisk 1–5 (as in code) |
| Materiality weight | `Material_i` | SASB material-topic flag for the controversy type × sector |
| Equity half-life | `HalfLife_sector` | 12–36 mo (guide: financials 18 mo, energy 36 mo) |
| Credit sensitivity | `γ_sector` | Barclays ESG credit study (Sev 5 ≈ +45–80 bps) |
| Baseline multiple | `(EV/EBITDA)` | Bloomberg/Refinitiv per issuer |

### 8.4 Data requirements
Controversy panel with dated events + issuer returns/multiples/CDS around each (Bloomberg/Refinitiv;
RepRisk/MSCI for events). SASB materiality map (free) for `Material_i`. The platform already holds the
event set (type, severity, sector, date) and `GLOBAL_COMPANY_MASTER` for baseline multiples; the missing
pieces are the event-study calibration and CDS history.

### 8.5 Validation & benchmarking plan
Out-of-sample event study: hold out post-2023 controversies, test whether predicted compression matches
realised abnormal returns (target sign accuracy > 70%, R² meaningful in high-materiality sectors).
Reconcile CDS leg against Barclays published ranges. Sensitivity on half-life and β; stability across
market regimes. Benchmark against MSCI controversy-adjusted scores where available.

### 8.6 Limitations & model risk
Event studies suffer confounding (controversies cluster with earnings/macro shocks) — use tight event
windows and market-model residuals. β is noisy for rare severe events; pool across sectors with shrinkage.
Persistence half-lives are regime-dependent. Conservative fallback: report the impact as a range keyed to
severity tier (the guide's −2.5× to −6.8× bands) rather than a point estimate when β confidence is low.

## 9 · Future Evolution

### 9.1 Evolution A — A real event study on the curated event set (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide's financial-impact model
(`EV_impact = β × Severity × PersistenceDecay(t)`, EV/EBITDA compression tables,
CDS-spread calibration) is entirely absent — `estImpactUsd` is a hand-entered field.
What the page *does* compute is worth keeping: the double-materiality validation
cross-check (ESRS topics with severe controversies but sub-50 material scores flagged
as "gap") is genuine, useful logic over 30 curated real incidents. Evolution A adds
the missing financial layer as an actual event study rather than asserted
coefficients.

**How.** (1) The 30 curated events have real dates and listed tickers (VW, Boeing,
Shell, Glencore…) — run a standard event study: abnormal returns vs a market model
over event windows (−5,+30 days), using the platform's market-data layer for prices;
statsmodels handles the estimation. (2) Report per-severity-tier mean CAR with
confidence intervals — replacing the guide's uncited "Sev 5 = −6.8× EV/EBITDA" with
numbers the module itself estimated, benchmarked against the Friede et al. /
event-study literature it already cites. (3) Persistence: fit the decay half-life
from the post-event CAR path per sector instead of asserting 18/36 months. (4) The
validation cross-check then gains a financial column: "gap" topics ranked by
estimated (not curated) impact. Keep `estImpactUsd` as a labelled editorial
comparison column.

**Prerequisites.** Price history coverage for the event tickers (the EA-hybrid-v3
market-data seed or an EOD ingest); 30 events is a small sample — report N and
uncertainty honestly rather than sector-level splits the data can't support.
**Acceptance:** each event's CAR reproduces from stored prices; severity-tier
estimates carry confidence intervals; the module's headline no longer implies a 2,000-
event calibration it doesn't have.

### 9.2 Evolution B — Materiality-gap challenger for DMA reviews (LLM tier 1)

**What.** The module's best output — the "gap" status where severe controversy
evidence contradicts a non-material ESRS scoring — is exactly what a double-
materiality assessment reviewer needs surfaced and argued. Evolution B drafts the
challenge memo: for each gap topic, the controversy evidence (which events, their
severity and remediation status), why it challenges the materiality determination,
and the EFRAG-consistent reassessment question — grounded in the
`CONTROVERSY_ESRS_MAP`, the event records, and (post-Evolution A) estimated financial
impact. This feeds the sibling `csrd-dma` module's assessment workflow.

**How.** Tier-1 RAG: this Atlas record, the ESRS topic definitions from refdata, and
the curated event set as grounding; the validation table's computed statuses pass as
structured context. The prompt's honesty rules come from §7.6: `materialScore` values
are curated demo scores, `estImpactUsd` is editorial — until Evolution A, financial
claims must be framed as editorial estimates. No endpoints exist; tier 2 waits for a
backend.

**Prerequisites.** Corpus embedding (D3); coordination with `csrd-dma` if memos are
to land in its workflow. **Acceptance:** every gap memo cites the specific events and
their severities driving the flag; topics with `status = untested` produce "no
evidence either way" rather than manufactured support; memo regenerates identically
for identical validation state.