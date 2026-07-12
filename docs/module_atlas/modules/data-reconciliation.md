# Data Reconciliation
**Module ID:** `data-reconciliation` · **Route:** `/data-reconciliation` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Cross-source ESG data reconciliation that identifies conflicts between providers, applies configurable resolution rules, and produces a single golden record for each entity and metric. Reconciliation lineage is preserved for full audit traceability. Supports automated and manual override workflows.

> **Business value:** Produces a single, auditable golden record per entity and metric, eliminating disclosure errors caused by provider disagreement. Enables compliance teams to demonstrate data lineage and conflict resolution rationale to regulators and auditors.

**How an analyst works this module:**
- Connect data providers in Data Source Manager and map fields to the canonical schema
- Run the reconciliation job or schedule it daily post-ingestion
- Review auto-resolution decisions in the conflict queue and apply manual overrides where needed
- Publish golden records downstream to analytics modules and lock the version for disclosure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `DEFAULT_SOURCES`, `LS_CONFIG`, `LS_OVERRIDES`, `LS_PORTFOLIO`, `LS_RESOLUTIONS`, `RECONCILE_FIELDS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DEFAULT_SOURCES` | 7 | `name`, `priority`, `coverage`, `fields`, `reliability`, `freshness`, `color`, `icon` |
| `RECONCILE_FIELDS` | 10 | `label`, `type` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `pct` | `(n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `sortedSources` | `[...sourceConfig].sort((a, b) => a.priority - b.priority);` |
| `companyResult` | `{ company: company.name, ticker: company.ticker, exchange: company._displayExchange \|\| 'N/A', sector: company.sector, fields: {} };` |
| `values` | `sortedSources.map(src => {` |
| `maxV` | `Math.max(...numericValues.map(v => v.value));` |
| `minV` | `Math.min(...numericValues.map(v => v.value));` |
| `cnt` | `RECONCILE_FIELDS.reduce((acc, fDef) => acc + (r.fields[fDef.key]?.sourceCount \|\| 0 > 1 ? 1 : 0), 0);` |
| `bucket` | `cnt >= 4 ? '4+' : String(cnt);` |
| `agreementMatrix` | `useMemo(() => { const srcIds = sourceConfig.map(s => s.id);` |
| `coveragePieData` | `useMemo(() => { const counts = { '0': 0, '1': 0, '2': 0, '3': 0, '4+': 0 };` |
| `maxSrc` | `Math.max(...RECONCILE_FIELDS.map(fDef => r.fields[fDef.key]?.sourceCount \|\| 0));` |
| `sourceReliabilityData` | `useMemo(() => sourceConfig.map(s => ({ name: s.name.split(' ')[0], reliability: s.reliability, coverage: parseInt(s.coverage.match(/\d+/) \|\| [0]) \|\| 0, priority: s.priority })), [sourceConfig]);` |
| `fieldConflictData` | `useMemo(() => Object.entries(stats.fieldConflicts).map(([k, v]) => ({ name: RECONCILE_FIELDS.find(f => f.key === k)?.label \|\| k, conflicts: v })).sort((a, b) => b.conflicts - a.conflicts), [stats]);` |
| `next` | `prev.map(s => s.id === sourceId ? { ...s, priority: Math.max(0, Math.min(5, s.priority + delta)) } : s);` |
| `best` | `[...c.allValues].sort((a, b) => a.priority - b.priority)[0];` |
| `blob` | `new Blob([hdr + rows.join('\n')], { type: 'text/csv' });` |
| `rows` | `filteredConflicts.map(c => `"${c.company}","${c.ticker}","${c.fieldLabel}","${c.winner}","${c.winnerSource}","${c.confidence}","${c.allValues.map(v => `${v.source}:${v.value}`).join('; ')}"`);` |
| `badge` | `(color) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: color + '18', color, marginLeft: 6 });` |
| `TABS` | `['dashboard', 'sources', 'conflicts', 'field-view', 'agreement', 'history', 'deep-dive'];` |
| `totalWins` | `reconciled.reduce((acc, r) => acc + RECONCILE_FIELDS.filter(fDef => r.fields[fDef.key]?.source === src.name).length, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `DEFAULT_SOURCES`, `RECONCILE_FIELDS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Open Conflicts | — | Conflict detection engine | Count of entity-metric pairs with material disagreement between two or more providers |
| Auto-Resolved Rate | — | Resolution rule engine | Share of conflicts resolved automatically by priority and reliability rules |
| Golden Record Coverage | — | Entity master | Share of entities with at least one fully reconciled golden record |
| Avg Provider Deviation | — | Cross-provider comparison | Mean absolute percentage difference across conflicting provider pairs |
- **Multiple ESG data providers (Bloomberg, MSCI, Refinitiv, proprietary)** → Field-level conflict detection using threshold-based deviation analysis → **Conflict inventory with provider attribution**
- **Provider reliability weights (configured in Data Source Manager)** → Weighted priority resolution algorithm → **Golden record with source lineage per field**
- **Manual override audit trail** → Reviewer sign-off and justification capture → **Immutable lineage log for regulatory audit**

## 5 · Intermediate Transformation Logic
**Methodology:** Conflict Resolution Score
**Headline formula:** `CRS = Σ |vᵢ − v̅| / v̅ × wᵢ`

For each disputed field the engine computes provider-weighted deviation from the provisional mean; the provider with the lowest deviation and highest reliability weight wins unless a manual override is applied. Lineage records which provider sourced each final value.

**Standards:** ['PCAF Golden Record Guidance', 'EFRAG ESRS 2 BP-2', 'GRI 2-4']
**Reference documents:** PCAF (2022) Data Quality and Source Hierarchy Guidance; EFRAG (2023) ESRS 2 General Disclosures â€” BP-2 Disclosures in relation to specific circumstances; GRI Standards 2021 â€” GRI 2-4 Restatements of information

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry advertises a *Conflict Resolution Score*
> `CRS = Σ|vᵢ − v̄|/v̄ × wᵢ` — a provider-weighted deviation ranking where "the provider with the
> lowest deviation and highest reliability weight wins." **No such deviation score exists in the code.**
> The actual winner-selection rule is a pure **priority sort** (lowest `priority` integer wins); the
> deviation `v̄` and reliability weights `wᵢ` never enter the choice. Reliability is displayed but not
> used to rank. The guide's "82% auto-resolved rate", "96.3% golden-record coverage", and "6.8% avg
> deviation" are illustrative headline numbers, not computed on this page. The sections below document
> what the code does: multi-source value simulation, a max/min ratio conflict flag, and
> priority-ranked golden-record selection.

### 7.1 What the module computes

For every company in `GLOBAL_COMPANY_MASTER` (or the saved portfolio) and each of 9
`RECONCILE_FIELDS`, the page synthesises what each of 7 sources *would* report, detects disagreement,
and elects a golden value:

```js
// per (company, field) — 7 candidate provider values are simulated, then:
values      = sortedSources.map(simulateSourceValue).filter(Boolean)   // priority-ordered
sortedSources = [...sourceConfig].sort((a,b) => a.priority - b.priority) // lower = higher precedence
hasConflict = (numericValues.length > 1) && (minV > 0) && (maxV / minV) > 1.1
winner      = values[0]        // = lowest-priority-number source that has a value
```

The golden record is simply `values[0]` after priority sorting — **not** a deviation-minimising
choice. A conflict is flagged whenever the spread between the largest and smallest candidate exceeds
10% (`maxV/minV > 1.1`).

### 7.2 Source registry & reliability weights

| Source | `priority` | reliability | freshness | provenance |
|---|---|---|---|---|
| Manual Overrides | 0 | 100 | User-set | user input (LS) |
| BRSR Supabase (Live) | 1 | 98 | FY2024 | India BRSR filings (live table) |
| EODHD API (Live) | 1 | 90 | Live | vendor API label |
| Exchange Files (Static) | 2 | 85 | FY2023 | exchange bulk files |
| Enrichment Service | 2 | 80 | Cached | internal enrichment |
| Company Master (Static) | 3 | 95 | FY2024 | curated India master (30) |

`priority` (0–5, editable via Up/Down, persisted to `ra_reconciliation_config_v1`) is the **only**
field that decides the winner. `reliability` feeds the KPI "Avg Confidence" (mean of winning sources'
reliability) and colour bars, but never the election. All values are synthetic demo values — see §7.6.

### 7.3 Calculation walkthrough

1. **Simulate each provider's value** — `simulateSourceValue(company, field, sourceId, baseVal)`
   hashes `"{ticker}-{field}-{sourceId}"` via a djb2 `seed()` then draws `r = sRand(hash)`. Each
   source applies (a) a field-eligibility gate, (b) a region gate, (c) a multiplicative noise band:
   - BRSR: only `scope1_mt/scope2_mt/employees/esg_score`; non-South-Asia dropped ~85% of the time;
     value `× (0.92 + 0.16r)` (±8% band).
   - EODHD: financials/ESG/sector; `× (0.88 + 0.24r)` (±12%).
   - Exchanges: any numeric; `× (0.95 + 0.10r)` (±5%, tightest).
   - Enrichment: ESG/employees/sector/transition; `× (0.85 + 0.30r)` (±15%, widest).
   - Master: South-Asia only; `× (0.97 + 0.06r)` (±3%).
2. **Conflict flag** — compute `maxV`, `minV` over numeric candidates; flag if `maxV/minV > 1.1`.
3. **Winner** — `values[0]` (priority-sorted); confidence = winner's reliability.
4. **Aggregate stats** — `agreementRate = (totalFields − conflicts)/totalFields × 100`;
   `autoResolved` counts conflicts with `sourceCount > 1`, `manualNeeded` the rest.
5. **Reconcile All** (`bulkReconcile`) writes `overrides[ticker:field] = lowest-priority value` — i.e.
   auto-applies the same priority winner as an explicit manual override.

### 7.4 Worked example

Company `RELIANCE` (South Asia), field `scope1_mt`, base value 20.0 Mt. Suppose the per-source hashes
draw `r = 0.5` for each:

| Source (priority) | eligible? | simulated value |
|---|---|---|
| Manual (0) | no override set | — |
| BRSR (1) | yes | 20 × (0.92 + 0.16·0.5) = 20 × 1.00 = **20.00** |
| Exchanges (2) | yes | 20 × (0.95 + 0.10·0.5) = 20 × 1.00 = **20.00** |
| Master (3) | yes | 20 × (0.97 + 0.06·0.5) = 20 × 1.00 = **20.00** |

With `r=0.5` all bands centre on 1.0 so values coincide (`maxV/minV = 1.0 ≤ 1.1` → no conflict) and
the winner is BRSR (priority 1). Now take `esg_score` base 60 with BRSR `r=0.10`, EODHD `r=0.90`,
Enrichment `r=0.40`:

| Source | value |
|---|---|
| BRSR (1) | 60 × (0.92 + 0.16·0.10) = 60 × 0.936 = **56.2** |
| EODHD (1) | 60 × (0.88 + 0.24·0.90) = 60 × 1.096 = **65.8** |
| Enrichment (2) | 60 × (0.85 + 0.30·0.40) = 60 × 0.970 = **58.2** |

`maxV/minV = 65.8/56.2 = 1.17 > 1.1` → **conflict flagged**. Winner = BRSR (first at priority 1,
tie broken by array order); confidence = 98%. This shows the design flaw the §8 spec fixes: EODHD
(the outlier at 65.8) and Enrichment are *ignored* in the golden value even though a reliability- or
consensus-weighted rule would pull the estimate toward the cluster.

### 7.5 Companion analytics

- **Agreement heatmap** — pairwise % of shared fields where two sources fall within 10% (`|v1−v2|/max(|v1|,1) < 0.1`).
- **Coverage pie** — companies bucketed by max source count per field (0–4+).
- **Conflict-by-field bar**, **source reliability bar**, **conflict-win distribution** per source.
- **History / overrides** — every manual `Use` and `Reconcile All` action logged to
  `ra_reconciliation_resolutions_v1` (capped 200) for an audit trail.

### 7.6 Data provenance & limitations

- **Every provider value is synthetic**, generated by `sRand(seed) = frac(sin(hash+1)×10⁴)` over a
  djb2 hash of `ticker-field-source`. Only `GLOBAL_COMPANY_MASTER` base values (themselves a mix of
  live BRSR/EODHD and curated data) are real; the "7-source disagreement" is manufactured noise.
- Winner is priority-only: reliability weights, cross-source consensus, and the guide's deviation
  score are **not** implemented. A 10% ratio threshold is a blunt conflict test (asymmetric to
  outliers, ignores field-specific tolerances).
- No true lineage persistence beyond browser localStorage; no reviewer sign-off capture.

**Framework alignment:** PCAF *Data Quality Hierarchy* (DQ1–5) — the priority ladder loosely mirrors
PCAF's source-tiering intent (reported > verified > estimated), but PCAF scores data *quality per
data point*, not a global provider precedence. EFRAG ESRS 2 BP-2 (restatement disclosure) and GRI 2-4
require documenting *which* value was used and why — the override log partially satisfies this, but
without the rationale capture BP-2 expects. Golden-record MDM practice (master data management)
normally blends deterministic survivorship rules with probabilistic matching; this page implements
only the deterministic survivorship half.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The page elects golden values by provider
precedence alone and manufactures disagreement with a seeded PRNG. A production reconciliation engine
needs a defensible *survivorship* model that fuses multiple noisy provider observations into a single
best estimate with a calibrated confidence — the discipline behind Bloomberg/MSCI/Refinitiv data
consolidation and the PCAF DQ-weighted "best available source" rule.

**8.1 Purpose & scope.** Produce, per entity × metric, (i) a golden value, (ii) a confidence /
standard error, and (iii) full lineage — for all ESG/financial metrics ingested from N providers,
supporting downstream disclosure (ESRS BP-2) and financed-emissions attribution (PCAF).

**8.2 Conceptual approach.** Treat each provider report as a noisy observation of a latent true value
and fuse via **reliability-weighted (inverse-variance) estimation** — the standard measurement-fusion
approach, and the same shrink-to-consensus logic vendors use for consensus estimates. Benchmarks:
(a) **PCAF DQ-score weighting**, where lower DQ (better) sources get higher weight; (b) **Refinitiv/
Bloomberg golden-copy MDM** survivorship + trust scoring; (c) robust statistics (Huber/median) for
outlier resistance, as in S&P Trucost gap-filling.

**8.3 Mathematical specification.**
For metric m of entity e with provider observations `{xᵢ}` and provider trust `τᵢ ∈ (0,1]`:

```
wᵢ  = τᵢ · fᵢ · rᵢ                      # trust × field-fit × freshness-decay
x̂   = Σ wᵢ xᵢ / Σ wᵢ                    # inverse-variance / reliability-weighted mean
     (robust variant: weighted Huber M-estimator to cap outlier pull)
σ̂²  = Σ wᵢ (xᵢ − x̂)² / ((n−1)/n · Σ wᵢ)  # dispersion → standard error of golden value
CV  = σ̂ / |x̂|                           # coefficient of variation → conflict severity
conflict = CV > θ_m                      # per-metric tolerance θ_m (not a flat 10%)
confidence = 100 · (1 − min(1, CV/CV_max))
```

Freshness decay `rᵢ = exp(−λ · age_days)` (λ ≈ ln2/365, half-life 1yr). Trust `τᵢ` is
**learned**, not fixed: after any period where a ground-truth (audited) value arrives, update
`τᵢ ← τᵢ · (1 − η·|xᵢ − truth|/|truth|)` (exponential penalty for historical error). Winner for a
categorical field = trust-weighted mode.

| Parameter | Symbol | Default | Calibration source |
|---|---|---|---|
| Provider trust prior | τᵢ | PCAF DQ→[1.0,0.8,0.6,0.4,0.2] | PCAF DQ 1–5 hierarchy |
| Freshness half-life | ln2/λ | 365 d | ESRS timeliness expectation |
| Per-metric tolerance | θ_m | emissions 15%, revenue 3%, ESG 10% | empirical inter-provider spread studies |
| Trust learning rate | η | 0.05 | backtest-tuned |
| CV normaliser | CV_max | 0.5 | 95th pct of observed CV |

**8.4 Data requirements.** Fields: `entity_id, metric, provider_id, value, report_date, unit,
dq_score`. Sources already in-platform: `GLOBAL_COMPANY_MASTER`, live BRSR Supabase table, EODHD API,
`reference_data` tables. Needs a `provider_trust` table (seeded from PCAF DQ, updated online) and a
`ground_truth` table (audited/assured values) to drive trust learning.

**8.5 Validation & benchmarking.** Backtest: hold out one provider, predict its value from the others'
fused estimate, score MAE/coverage of the σ̂ prediction interval. Reconcile golden emissions against
CDP-assured figures; reconcile golden revenue against audited financials. Stability: golden value must
not swing >θ_m when a single provider is added/removed (survivorship robustness test). Reconcile trust
scores against provider assurance track record.

**8.6 Limitations & model risk.** Inverse-variance fusion assumes independent provider errors —
providers often copy each other (correlated errors) → over-tight σ̂; mitigate by clustering providers
by lineage and down-weighting correlated ones. Trust learning needs enough ground-truth or it degrades
to the prior. Conservative fallback: when `n=1` or all trust ties, revert to PCAF-priority survivorship
(the current behaviour) and flag confidence "single-source".

## 9 · Future Evolution

### 9.1 Evolution A — Reconcile real provider values with the advertised deviation rule (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag is double: the guide's Conflict Resolution Score
(`CRS = Σ|vᵢ−v̄|/v̄ × wᵢ`, deviation-plus-reliability election) is not implemented —
the winner is a pure priority-integer sort, with reliability displayed but never
used — and every provider value is *simulated* (djb2-hashed `sRand` noise bands
around a base value), so the module reconciles synthetic disagreements. The
workflow shell is genuinely good: priority registry persisted to config, manual
overrides, a capped resolution history, agreement heatmaps. Evolution A gives it
real inputs and the real election rule.

**How.** (1) Real candidate values: the platform holds genuine multi-source
overlap today — BRSR Supabase (live table), the curated company master, and the
enrichment service (EODHD/Alpha Vantage) all report revenue/market-cap/emissions
for Indian issuers; wire `simulateSourceValue` out and provider reads in.
(2) Election rule: implement the CRS — deviation from the provisional mean weighted
by reliability — with priority as the tiebreaker, so the displayed reliability
scores finally matter; document the rule per §8. (3) Golden records persist
server-side (`golden_records` table) with the winning source, CRS, and override
lineage — the "publish downstream and lock for disclosure" promise requires
persistence beyond `localStorage`. (4) The 10%-spread conflict flag stays; the
guide's illustrative headline rates (82% auto-resolved) become measured outputs.

**Prerequisites (hard).** Simulation purge; provider adapters for the three real
sources; coordination with `data-hub-ingester`'s fusion evolution — reconciliation
(golden record election) and fusion (weighted blend) are different policies over
the same conflict store and must share it, not duplicate it. **Acceptance:** a
real BRSR-vs-enrichment revenue disagreement appears in the queue with genuine
values; the winner reproduces from the documented CRS arithmetic; a locked golden
record survives sessions and reports its lineage.

### 9.2 Evolution B — Override-rationale assistant and restatement drafter (LLM tier 2)

**What.** Two judgment points in this workflow suit an LLM. First, manual
overrides: when a steward overrides the CRS election, the assistant drafts the
rationale from the evidence (values, vintages, known scope/unit mismatches — the
usual true cause of "conflicts"), giving the audit trail the *why* that GRI 2-4 and
ESRS BP-2 restatement disclosures later require. Second, restatements: when a
golden record locked for a prior disclosure changes, the assistant drafts the
GRI 2-4/BP-2 restatement note — what changed, why, and the effect — from the
resolution history the module already keeps.

**How.** Tier-2 read tools over the conflict store, resolution history, and
provider metadata; drafts attach to the override/restatement records pending
steward confirmation. Grounding: the PCAF source-hierarchy guidance and
GRI 2-4/ESRS BP-2 texts §5 cites (refdata additions). The assistant never elects a
winner — it documents elections and overrides humans make, which is exactly the
auditability this module sells.

**Prerequisites (hard).** Evolution A's real conflict store and persistence (a
rationale for a simulated conflict is doubly fictional); regulation texts embedded.
**Acceptance:** every drafted rationale cites the actual candidate values and
vintages; restatement notes reproduce the before/after from the locked history;
drafts require steward sign-off before attaching.