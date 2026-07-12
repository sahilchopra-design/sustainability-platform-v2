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
