# ESG Screener
**Module ID:** `esg-screener` · **Route:** `/esg-screener` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Multi-provider ESG screening engine with positive/negative/norms-based filters. Covers MSCI, Sustainalytics, ISS ESG, and custom rule sets. Exclusion list management and audit trail.

> **Business value:** ESG screening is the first step in sustainable investment. This engine automates screening across multiple data providers and frameworks, reducing manual effort while maintaining full audit trail for client reporting and regulatory compliance.

**How an analyst works this module:**
- Screen Builder configures negative/positive/norms filters
- Universe View shows pass/fail per company with reason codes
- Audit Trail logs all screening decisions with timestamp
- Override Manager handles analyst exceptions with approval chain
- Report exports screening results for compliance

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DEFAULT_NEG`, `SECTOR_COLORS`, `T_RISK_ORDER`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `screenedResults` | `useMemo(() => { if (!appliedConfig) return GLOBAL_COMPANY_MASTER.map(c => ({ ...c, pass: true, reasons: [] }));` |
| `scores` | `bySector[sec].sort((a, b) => b - a);` |
| `passCount` | `useMemo(() => screenedResults.filter(r => r.pass).length, [screenedResults]); const failCount = screenedResults.length - passCount;` |
| `headers` | `'Company,Ticker,Exchange,Sector,T-Risk,DQS,GHG Intensity,Status,Reasons';` |
| `rows` | `displayRows.map(r => `"${r.name}","${r.ticker \|\| ''}","${r._displayExchange \|\| r.exchange \|\| ''}","${r.sector \|\| ''}","${r.transition_risk \|\| ''}","${r.dqs_score \|\| ''}","${r.ghg_intensity \|\| ''}","${r.pass ? 'PASS' : 'F` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Negative Screens | — | Platform | Weapons, tobacco, coal, gambling, adult content, etc. |
| Pass Rate | — | Typical universe | Fraction of investment universe passing all screens |
| Controversy Exclusions | — | News feeds | Auto-exclusion on severe controversy flags |
- **Company revenue data** → Threshold comparison → **Negative screen trigger**
- **ESG scores (MSCI/Sust.)** → Score threshold check → **Positive screen pass/fail**
- **Controversy flags** → Norms assessment → **Global Compact alignment**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG screening rule engine
**Headline formula:** `Pass = (∀ neg_filter: !triggered) AND (score ≥ min_threshold) AND (∀ norms: compliant)`

Three screening layers: (1) Negative/exclusionary (weapons, tobacco, fossil fuels by revenue threshold), (2) Positive/best-in-class (ESG score > sector median), (3) Norms-based (UN Global Compact, OECD, ILO compliance).

**Standards:** ['MSCI ESG Research', 'Sustainalytics', 'UN Global Compact']
**Reference documents:** MSCI ESG Research Methodology; Sustainalytics ESG Risk Ratings; UN Global Compact Ten Principles; OECD Guidelines for Multinational Enterprises

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module is a **genuinely functional rule-based ESG screening engine** with no PRNG. It runs the
guide's three-layer screening logic — negative/exclusionary, positive/best-in-class, and
threshold/norms screens — directly against the real `GLOBAL_COMPANY_MASTER` universe, marking each
company pass/fail with itemised reasons. The guide's formula
`Pass = (∀ neg_filter: !triggered) AND (score ≥ min) AND (∀ norms: compliant)` is implemented
faithfully. No ⚠️ mismatch flag.

### 7.1 What the module computes

The core is `applyNegativeScreens` plus threshold and positive-screen checks; a company **passes iff
its `reasons[]` array is empty**:

```js
// Negative / exclusionary (tag- and subsector-based, revenue-proxy via classification):
thermalCoal    → tags include Coal-Mining/Coal-Power OR subsector~"coal"
fossilFuel     → sector==Energy AND subsector~(E&P | mining | exploration)
tobacco / gambling / controversialWeapons → subsector/tag match
veryHighTRisk  → transition_risk == 'Very High'
noGhg          → !ghg_reporting_year
noSbti         → !sbti_committed AND !carbon_neutral_target_year

// Threshold screens:
transition_risk rank > maxTRisk threshold        → 'T-Risk > Max'
dqs_score < minDqs                                → 'DQS Below Min'
ghg_intensity > maxGhgIntensity                   → 'GHG Intensity > Max'
exchange ∉ selectedExchanges                      → 'Exchange Excluded'

// Positive / best-in-class:
Best-in-Class  → dqs_score < sector top-30% threshold → fail
SBTi Only      → !sbti_committed → fail
Low T-Risk Only→ transition_risk ∉ {Low, Very Low} → fail

pass = reasons.length === 0
```

### 7.2 Parameterisation

| Screen | Rule | Provenance |
|---|---|---|
| Transition-risk order | Very High 4 / High 3 / Medium 2 / Low 1 / Very Low 0 | platform ordinal scale |
| Best-in-Class threshold | per-sector top-30% of `dqs_score` (`scores[floor(n×0.3)]`) | best-in-class convention |
| Negative screens | 8 toggles (coal, fossil, tobacco, weapons, gambling, T-risk, GHG, SBTi) | standard exclusion categories |
| Positive screens | None / Best-in-Class / SBTi Only / Low T-Risk Only | 3 positive-screen modes |
| Universe | `GLOBAL_COMPANY_MASTER` (real company dataset with tags/subsector/DQS/T-risk/GHG) | platform master data |

The best-in-class threshold is computed **dynamically per sector** by sorting each sector's DQS scores
and taking the 30th-percentile cut — a correct implementation of "top 30% within sector".

### 7.3 Calculation walkthrough

1. User configures negative toggles, a positive-screen mode, max transition-risk, min DQS, max GHG
   intensity, and an exchange filter; clicks Apply → `appliedConfig` snapshot.
2. If Best-in-Class selected, precompute `sectorDqsThresholds[sector]` = each sector's top-30% DQS cut.
3. For every company: run negative screens → threshold checks → exchange filter → positive screen,
   accumulating `reasons[]`.
4. `pass = reasons.length === 0`; render pass/fail with the specific failing reasons.
5. KPIs and sector/exchange breakdowns aggregate the pass rate.

### 7.4 Worked example — coal-exposed energy company

Company: sector Energy, subsector "Coal-Power", `transition_risk='Very High'`, `sbti_committed=false`,
`dqs_score=2`. With negative screens `thermalCoal=true`, `veryHighTRisk=true`, `noSbti=true`, positive
`SBTi Only`, `minDqs=3`:

| Check | Result | Reason added |
|---|---|---|
| thermalCoal | subsector~coal → triggered | 'Thermal Coal' |
| veryHighTRisk | Very High → triggered | 'Very High T-Risk' |
| noSbti | not committed, no neutral target | 'No SBTi/Net Zero' |
| minDqs 3 | dqs 2 < 3 | 'DQS Below Min' |
| SBTi Only positive | not committed | 'Fails Positive Screen' |
| **pass** | reasons = 5 | **FAIL** |

A renewable utility with `transition_risk='Low'`, `sbti_committed=true`, `dqs_score=4` (above its
sector's 30th-percentile) accumulates **no reasons** → **PASS**. All deterministic on the master data.

### 7.5 Data provenance & limitations

- **No synthetic PRNG** — screening runs on the real `GLOBAL_COMPANY_MASTER` fields (tags, subsector,
  transition_risk, dqs_score, ghg_intensity, sbti_committed, ghg_reporting_year).
- Negative screens are **classification-based**, not revenue-threshold-based: the guide describes
  "fossil fuels by revenue threshold", but the code triggers on sector/subsector/tag membership (no
  revenue-percentage gate). A company with minor coal revenue is excluded the same as a pure coal
  miner.
- Norms-based screening (UN Global Compact / OECD / ILO) is represented only indirectly (via
  controversial-weapons tag); no explicit UNGC-violation field is checked.
- Best-in-class uses DQS (data-quality score) as the ranking metric — a proxy for ESG performance, not
  an ESG score per se.

**Framework alignment:** the module implements the three canonical **responsible-investment screening
layers**: **negative/exclusionary** (weapons, tobacco, thermal coal, fossil extraction — the standard
PRI exclusion list), **positive/best-in-class** (top-quantile within sector, the DJSI/FTSE4Good
approach), and **threshold** (transition-risk and GHG-intensity ceilings, min data quality). It
approximates **SFDR Art 8** "promotes E/S characteristics" screening and norms-based **UNGC/OECD/ILO**
exclusion, though the norms layer is thinner than the guide implies. A production build would add
explicit revenue-percentage thresholds (e.g. >5% coal revenue) and a UNGC-violation field.

*(No §8 model specification required — this is a genuine rule engine, not a missing/synthetic model.
The recommended refinements are (a) revenue-percentage exclusion thresholds and (b) an explicit
norms-compliance field rather than tag-only proxying.)*

## 9 · Future Evolution

### 9.1 Evolution A — Server-side screening with revenue thresholds and a real audit trail (analytics ladder: rung 1 → 2)

**What.** §7's verdict: "a genuinely functional rule-based ESG screening engine with no PRNG" — the three-layer logic (negative/exclusionary via tags and subsectors, positive/best-in-class, threshold/norms) runs faithfully against the real `GLOBAL_COMPANY_MASTER`, with itemized fail reasons. Two honest limitations: exclusions are *classification proxies* (a company tagged Coal-Mining fails, but the guide's "revenue threshold" screening — e.g. "≤5% thermal coal revenue" — can't run without revenue-share data), and the promised audit trail and override approval chain are frontend-only concepts with no persistence.

**How.** (1) `api/v1/routes/esg_screener.py` + tables `screen_configs` (versioned rule sets per mandate), `screen_runs` (universe snapshot, config version, per-company outcome + reasons, timestamp), and `screen_overrides` (analyst exception, rationale, approver) — turning the audit-trail promise into rows the AuditMiddleware complements. (2) Revenue-share data: business-involvement percentages for the classic screens from disclosed segment data where public, else the proxy screen stays but the reason code says "classification-based" — the honesty is in labeling which screen type fired. (3) Norms layer upgrades from tag checks to `esg-controversy`'s UNGC violation assessments (its engine already computes them). (4) Rung 2: screen impact analysis — pass-rate and sector-tilt deltas as thresholds sweep, so mandate design sees the cost of each rule.

**Prerequisites.** Revenue-involvement data sourcing decision; config versioning semantics (a re-run under a changed config must be distinguishable — compliance depends on it). **Acceptance:** a screen run reproduces byte-identically from its stored config and universe snapshot; overrides carry approver trails; each fail reason declares proxy vs revenue-threshold basis.

### 9.2 Evolution B — Mandate-to-screen translator and reason-code explainer (LLM tier 2)

**What.** Screening's real-world friction is translation: a client mandate says "no material involvement in thermal coal, UNGC compliant, best-in-class within sectors" and someone must encode it. A tool-calling assistant that drafts the `screen_config` from mandate language (each rule mapped to a mandate clause, ambiguities surfaced as questions — "does 'material' mean 5% or 10% revenue?"), runs it, and then answers the aftermath: "why did company X fail?" with the itemized reason codes and their data basis, and "what would change at a 10% threshold?" via re-run comparison.

**How.** Tools: `create_screen_config(rules)` (gated — analyst approves before it becomes a mandate config), `run_screen(config)`, `explain_result(company, run)`, `compare_runs(a, b)`. Grounding corpus = this Atlas record's §7.1 rule catalog (the exact screen predicates) so explanations describe implemented logic, not generic ESG-screening lore. The translator never silently resolves ambiguity — unresolved mandate terms block config creation with questions. Client-facing explanations distinguish proxy-based from revenue-based exclusions per Evolution A's labeling.

**Prerequisites.** Evolution A's config/run persistence (the translator needs somewhere durable to put its output; the explainer needs stored runs) — though a read-only explainer over the current in-page engine could ship as a thin first slice. **Acceptance:** a golden mandate produces a config whose every rule cites its clause; ambiguous terms yield questions, not defaults; fail explanations match stored reason codes exactly.