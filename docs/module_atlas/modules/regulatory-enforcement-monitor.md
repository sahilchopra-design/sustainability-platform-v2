# Regulatory Enforcement Monitor
**Module ID:** `regulatory-enforcement-monitor` · **Route:** `/regulatory-enforcement-monitor` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks ESG regulatory enforcement actions, fines, and sanctions globally, identifying sector exposure to supervisory scrutiny and greenwashing risk.

> **Business value:** Provides real-time regulatory enforcement intelligence, enabling compliance and legal teams to proactively manage greenwashing risk and benchmark against peer actions.

**How an analyst works this module:**
- Review enforcement action feed by jurisdiction and regulator.
- Filter by sector to identify peer exposure.
- Assess own disclosure practices against enforcement patterns.
- Set alert for new actions in relevant sector or jurisdiction.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACTION_TYPES`, `ENFORCEMENT_ACTIONS`, `ENTITY_NAMES_200`, `KpiCard`, `PORTFOLIO_HOLDINGS`, `REGULATORS_25`, `SECTORS`, `STATUSES`, `TABS`, `VIOLATION_CATEGORIES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REGULATORS_25` | 26 | `jurisdiction`, `avgFineM`, `region` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ACTION_TYPES` | `['Fine', 'Suspension', 'Cease-and-Desist', 'Consent Order', 'Criminal Referral', 'Mandatory Audit', 'Public Censure', 'License Revocation'];` |
| `VIOLATION_CATEGORIES` | `['Greenwashing', 'Failure-to-Disclose', 'Data Falsification', 'ESG Rating Manipulation', 'Climate Commitment Breach', 'Proxy Voting Failure', 'Product Mislabeling', 'Market Manipulation', 'Insider Trading on Climate', 'T` |
| `regIdx` | `Math.floor(sr(i * 7 + 4000) * 25);` |
| `sectorIdx` | `Math.floor(sr(i * 11 + 4000) * 10);` |
| `actionTypeIdx` | `Math.floor(sr(i * 13 + 4000) * 8);` |
| `violationIdx` | `Math.floor(sr(i * 17 + 4000) * 10);` |
| `fineUSD` | `Math.round((sr(i * 19 + 4000) * 150 + 0.5) * 1e6 * (REGULATORS_25[regIdx].avgFineM / 50));` |
| `year` | `2018 + Math.floor(sr(i * 23 + 4000) * 6);` |
| `quarter` | `1 + Math.floor(sr(i * 29 + 4000) * 4);` |
| `statusIdx` | `Math.floor(sr(i * 31 + 4000) * 5);` |
| `deterrenceScore` | `Math.round(sr(i * 37 + 4000) * 80 + 10);` |
| `complianceScore` | `Math.round(sr(p * 61 + 5000) * 70 + 20);` |
| `actions` | `ENFORCEMENT_ACTIONS.filter(a => a.portfolioHolding && Math.floor(sr(p * 67 + 5000) * 200) === a.id % 200).length;` |
| `weight` | `+(sr(p * 71 + 5000) * 0.05 + 0.005).toFixed(4);` |
| `label` | ``${yr}-Q${q}`;` |
| `violationDist` | `useMemo(() => VIOLATION_CATEGORIES.map(vc => ({` |
| `regulatorStats` | `useMemo(() => REGULATORS_25.map(r => {` |
| `totalFineM` | `Math.round(acts.reduce((s, a) => s + a.fineUSD, 0) / 1e6);` |
| `avgFineM` | `acts.length ? Math.round(totalFineM / acts.length) : 0;` |
| `sectorHeat` | `useMemo(() => SECTORS.map(s => {` |
| `fineM` | `Math.round(acts.reduce((a, x) => a + x.fineUSD, 0) / 1e6);` |
| `heatScore` | `entityCount > 0 ? +(acts.length / entityCount).toFixed(2) : 0;` |
| `portfolioRisk` | `useMemo(() => { const totalWeight = PORTFOLIO_HOLDINGS.reduce((s, h) => s + h.weight, 0);` |
| `portfolioScore` | `totalWeight > 0 ? PORTFOLIO_HOLDINGS.reduce((s, h) => s + h.weight * h.complianceScore, 0) / totalWeight : 0;` |
| `yoyFineGrowth` | `useMemo(() => { const yearData = Array.from({ length: 6 }, (_, y) => { const yr = 2018 + y;` |
| `avgFine` | `filtered.length ? Math.round(filtered.reduce((s, a) => s + a.fineUSD, 0) / filtered.length) : 0;` |
| `deterrenceEff` | `ENFORCEMENT_ACTIONS.length > 0 ? (1 - repeatOffenders / ENFORCEMENT_ACTIONS.length) * 100 : 0;` |
| `growth` | `yoyFineGrowth[yoyFineGrowth.length - 1].totalFineB - yoyFineGrowth[0].totalFineB;` |
| `cagr` | `yoyFineGrowth[0].totalFineB > 0 ? (Math.pow(yoyFineGrowth[yoyFineGrowth.length - 1].totalFineB / yoyFineGrowth[0].totalFineB, 1 / 5) - 1) * 100 : 0;` |
| `regIds` | `REGULATORS_25.filter(r => r.region === region).map(r => r.id);` |
| `deff` | `acts.length > 0 ? ((1 - repeats / acts.length) * 100).toFixed(0) : '100';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ACTION_TYPES`, `REGULATORS_25`, `SECTORS`, `STATUSES`, `TABS`, `VIOLATION_CATEGORIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Enforcement Actions (YTD) | — | Regulatory Database | Total ESG-related enforcement actions recorded across monitored jurisdictions year-to-date. |
| Total Fines (€M, YTD) | — | Enforcement Register | Cumulative fines issued for ESG-related violations across EU, UK, and US jurisdictions. |
| Greenwashing Actions (%) | — | Action Classification | Share of enforcement actions specifically categorised as greenwashing or misleading ESG disclosure. |
- **Regulatory press releases + enforcement databases + NLP classification** → Action classification; fine aggregation; sector exposure scoring → **Enforcement monitor dashboard with sector exposure and alert feeds**

## 5 · Intermediate Transformation Logic
**Methodology:** Enforcement Exposure Score
**Headline formula:** `EE = Σ(fine_amountᵢ × sector_relevanceᵢ) / peer_count`

Sector-weighted average enforcement exposure derived from historical fine amounts and regulatory action frequency.

**Standards:** ['ESMA Greenwashing Progress Report (2023)', 'FCA ESG Enforcement Database']
**Reference documents:** ESMA Greenwashing Progress Report (2023); FCA Dear Chair Letter on Greenwashing (2021); SEC Climate and ESG Task Force Enforcement Actions

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

200 synthetic enforcement actions across 26 named regulators, 8 action types, and 10 violation
categories, joined against a 40-holding synthetic portfolio for exposure scoring:

```js
fineUSD = round((sr()×150 + 0.5) × 1e6 × (regulator.avgFineM / 50))     // scaled by regulator's own severity
deterrenceScore = round(sr()×80 + 10)                                    // 10–90, per action
complianceScore = round(sr()×70 + 20)                                    // 20–90, per portfolio holding
portfolioScore  = Σ(holding.weight × holding.complianceScore) / Σ(holding.weight)   // weighted average
deterrenceEff   = (1 − repeatOffenders / totalActions) × 100
cagr            = (finalYearFineB / firstYearFineB)^(1/5) − 1) × 100
```

The guide's formula `EE = Σ(fine_amount_i × sector_relevance_i) / peer_count` is **not literally
implemented** — there is no `sector_relevance` weighting term anywhere in the file; the closest
analogue is `heatScore = actionsInSector / entityCountInSector` (an action-frequency-per-entity
ratio, not a fine-weighted exposure score) and the separate `portfolioScore` (a compliance-score
weighted average, not a fine-weighted enforcement-exposure score).

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `REGULATORS_25` | 26 rows (jurisdiction, `avgFineM`, region) — despite the name implying 25 | Curated regulator list, likely including ESMA, FCA, SEC, and others per the guide's cited sources; `avgFineM` values not independently verified here |
| Fine scaling | `avgFineM / 50` multiplier | Rescales the base random fine draw by how severe each named regulator's typical fines are relative to a $50M reference — a reasonable relative-severity mechanism |
| `deterrenceEff` | `(1 − repeatOffenderShare) × 100` | Directionally sound proxy: fewer repeat offenders ⇒ enforcement is more deterrent — though this conflates "few repeat offenders in the sample" with "enforcement is effective," which could equally reflect a small/young sample |
| Action types (8) | Fine, Suspension, Cease-and-Desist, Consent Order, Criminal Referral, Mandatory Audit, Public Censure, License Revocation | Real enforcement-action taxonomy |
| Violation categories (10) | Greenwashing, Failure-to-Disclose, Data Falsification, ESG Rating Manipulation, Climate Commitment Breach, Proxy Voting Failure, Product Mislabeling, Market Manipulation, Insider Trading on Climate, + 1 more | Real, comprehensive ESG-enforcement taxonomy consistent with ESMA/FCA greenwashing enforcement themes |

### 7.3 Calculation walkthrough

1. **Action generation** (200 rows, seed offset `+4000`): regulator/sector/action-type/violation
   drawn via `sr()`; `fineUSD` scaled by the drawn regulator's `avgFineM`; `year∈[2018,2023]`,
   `quarter∈[1,4]`; `deterrenceScore` (10–90) per action.
2. **Portfolio generation** (40 holdings, seed offset `+5000`): `complianceScore` (20–90),
   `actions` (count of enforcement actions matched to this holding via a seeded modulo-200 join —
   `floor(sr(p×67+5000)×200) === a.id%200`, an artificial matching mechanism rather than a real
   entity-to-action link), `weight` (0.5–5.5% per holding, `sr()×0.05+0.005`).
3. **Violation distribution** (`violationDist`): count + total fine per violation category.
4. **Regulator stats** (`regulatorStats`): per-regulator `totalFineM`, `avgFineM` (recomputed from
   actual actions, distinct from the seed regulator's nominal `avgFineM`), action count.
5. **Sector heat** (`sectorHeat`): `heatScore = actionsInSector / entityCountInSector` — enforcement
   density per sector, a genuine (if simplified) exposure-frequency metric.
6. **Portfolio risk** (`portfolioRisk`): weighted-average `complianceScore` across the 40 holdings
   by portfolio `weight` — a real weighted-average calculation, though "compliance score" here is
   an independent random draw per holding, not derived from that holding's own linked enforcement
   `actions` count.
7. **YoY fine growth / CAGR**: 6-year (2018–2023) time series of total fines, with a geometric CAGR
   over the 5-year span — genuine CAGR formula, correctly using the `^(1/5)` root for a 6-point
   (5-interval) series.
8. **Deterrence efficacy**: `(1 − repeatOffenders/total) × 100`, both portfolio-wide and
   filtered/regional variants.

### 7.4 Worked example

Action `i=0`, regulator index `regIdx=floor(sr(4007)×25)` (say ESMA, `avgFineM=80`):

| Step | Formula | Result |
|---|---|---|
| Base fine draw | `sr(4019)×150+0.5` | e.g. **62.3** ($M-scale factor before regulator adjustment) |
| Regulator scale | `avgFineM/50 = 80/50` | **1.6×** |
| `fineUSD` | `62.3×1e6×1.6` | **$99.7M** |
| `deterrenceScore` | `sr(4037)×80+10` | e.g. **58** |

Portfolio-level, for a holding with `weight=2.5%` and `complianceScore=65`, contributing to
`portfolioScore = Σ(weight×complianceScore)/Σweight` — if this were the only holding,
`portfolioScore=65`; in the full 40-holding book it is the weighted average across all.

### 7.5 Enforcement-severity rubric (as coded)

| Metric | Interpretation |
|---|---|
| `deterrenceScore` (10–90) | Higher = enforcement action judged more deterrent (per-action synthetic score) |
| `deterrenceEff` (0–100%) | Portfolio-wide, `1 − repeat-offender share` |
| `heatScore` | Actions per entity, by sector — higher = denser regulatory scrutiny |

### 7.6 Companion analytics

Enforcement action feed (200-row, filterable by regulator/sector/violation/year), violation
category distribution, regulator league table, sector heat map, portfolio exposure (weighted
compliance score), YoY fine growth + CAGR, deterrence efficacy by region.

### 7.7 Data provenance & limitations

- **All 200 enforcement actions and 40 portfolio holdings are synthetic**, `sr(seed)=
  frac(sin(seed+1)×10⁴)`; the 26-regulator list and action-type/violation-category taxonomies are
  real and comprehensive, but individual action records (which regulator fined which sector for
  what, and how much) are fabricated, not sourced from ESMA/FCA/SEC enforcement databases despite
  those being the guide's cited sources.
- The portfolio-to-action link (`actions` count per holding) uses an artificial modulo-200 seed
  match rather than a genuine entity-identity join — no real portfolio holding is actually "linked"
  to a real enforcement action.
- `EE = Σ(fine×sector_relevance)/peer_count` (the guide's formula) is not implemented; the closest
  analogues (`heatScore`, `portfolioScore`) measure different things (action density; weighted
  compliance score) and are not reconciled with each other.
- Guide's YTD headline figures (28 actions, €94M fines, 54% greenwashing) cannot be reproduced
  deterministically from this file without running it (results depend on the full 200-row seeded
  draw filtered to a specific year), so they should be treated as illustrative targets rather than
  values this code is guaranteed to reproduce.

**Framework alignment:** ESMA Greenwashing Progress Report (2023) / FCA Dear Chair Letter on
Greenwashing (2021) — cited as guide sources; the violation-category taxonomy (Greenwashing,
Failure-to-Disclose, ESG Rating Manipulation, etc.) is consistent with the themes those reports
actually cover, though no data is drawn from them · SEC Climate and ESG Task Force — referenced,
not linked to any real SEC enforcement action record.

## 9 · Future Evolution

### 9.1 Evolution A — Ingested enforcement records with entity-resolved portfolio links (analytics ladder: rung 1 → 2)

**What.** §7.7 documents fabrication over a real taxonomy: 200 synthetic actions (fines, deterrence scores) across a genuinely comprehensive 26-regulator list, a portfolio "link" that is a modulo-200 seed match rather than an entity join, and the guide's `EE = Σ(fine × sector_relevance)/peer_count` unimplemented — the closest analogues (`heatScore`, `portfolioScore`) measure different things and don't reconcile. Enforcement is one of the few domains where the cited sources are actually harvestable: SEC litigation releases, FCA final notices, ESMA sanctions registers, and AMF decisions are public, dated, and structured enough to ingest. Evolution A builds that ingestion and a real join.

**How.** (1) An `enforcement_actions` table populated by per-regulator ingesters starting with the machine-readable ones (SEC Litigation/ALJ RSS, FCA final-notice list); each record carries regulator, date, entity name, violation category (mapped to the existing 10-type taxonomy), fine amount, source URL. (2) Entity resolution via the platform's GLEIF/`entity-match` cascade so holdings link to actions by LEI — replacing the modulo trick and enabling honest "your holding X was fined by Y" statements. (3) Implement the guide's EE with a documented sector-relevance mapping, and separate it explicitly from `heatScore` (action density) — two named metrics, defined and reconciled. (4) Fabricated `deterrenceScore` deleted; retained analytics recompute from ingested records.

**Prerequisites.** Ingestion effort per regulator (start with 3–4, labelled coverage); entity-match layer from `reference-data-explorer`'s evolution. **Acceptance:** every action row carries a source URL; portfolio exposure changes when a holding's LEI matches a new ingested action; EE and heatScore have distinct documented definitions.

### 9.2 Evolution B — Greenwashing-precedent research analyst (LLM tier 2)

**What.** The high-value question is precedent-shaped: "what have regulators fined for fund-naming greenwashing, and how does our marketing language compare?", "summarize enforcement themes in EU disclosure cases this year", "which violation categories are accelerating for our sectors?" — legal-intelligence work over ingested action texts, exactly the retrieval-plus-synthesis pattern LLMs handle well when grounded.

**How.** Tier-2: the copilot queries the actions table by category/jurisdiction/sector (tool calls), then summarizes the retrieved records with per-case citations (regulator, date, source URL); trend claims come from computed aggregates, not impressionistic recall. Comparative-exposure answers use the entity-resolved portfolio join. Hard guardrails: no legal advice — thematic summaries and precedent lists only, with the consult-counsel boundary in the prompt; no claims about entities absent from ingested records (defamation-adjacent risk makes the no-fabrication rule existential here, not just methodological). Full-text case documents, where ingested, are chunked for retrieval so quotes are verbatim-checkable.

**Prerequisites (hard).** Evolution A's real records — a precedent analyst over fabricated fines attributed to real regulators is the platform's worst possible failure mode; source-URL fields mandatory. **Acceptance:** every cited case resolves to its source URL; trend statistics match table aggregates; questions about un-ingested jurisdictions receive a coverage disclaimer.