## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry advertises a *cross-framework* hub
> comparing **CSRD double materiality vs ISSB single materiality vs GRI impact materiality**, with
> SASB sector-standard mapping, peer benchmarking and "convergence analysis" identifying topics
> material under multiple frameworks. **The code does none of that.** The page renders as the
> "Double Materiality Hub" and its seven tabs (Overview · Impact Materiality · Financial Materiality
> · CSRD Assessment · Stakeholders · Topic Matrix · Reporting) all operate on a *single* CSRD/ESRS
> lens. There is no ISSB scoring, no GRI scoring, no SASB metric library, and no convergence set
> logic anywhere in the source. The sections below document the ESRS double-materiality
> visualisation that is actually implemented.

### 7.1 What the module computes

The module is a **presentation layer over a fixed ESRS topic table** — it does no scoring; the
impact/financial scores are literals in `TOPICS`. The only computed aggregates are means and the
CSRD-scope count:

```js
Avg Impact    = Σ TOPICS.impact / TOPICS.length          // = 7.04 / 10
Avg Financial = Σ TOPICS.financial / TOPICS.length        // = 6.13 / 10
CSRD In-Scope = COMPANIES.filter(c => c.csrdScope).length  // = 18 / 24
```

Charts re-shape the same table: a grouped bar of impact-vs-financial per ESRS code, a scatter
(impact = y, financial = x) for the double-materiality matrix, and a 3-axis stakeholder E/S/G
ratings view.

### 7.2 Parameterisation / scoring rubric

**`TOPICS` (12 rows)** — the ESRS topical standards (E1–E5, S1–S4, G1) with `impact` and `financial`
scores on a 0–10 scale. These are **hard-coded editorial values, not seeded and not computed**:

| Topic | ESRS | Impact | Financial | Pillar |
|---|---|---|---|---|
| Climate Change Mitigation | E1 | 8.9 | 7.8 | E |
| Biodiversity & Ecosystems | E4 | 8.1 | 5.2 | E |
| Own Workforce | S1 | 7.5 | 6.8 | S |
| Business Conduct | G1 | 7.4 | 7.2 | G |
| Tax Transparency | G1 | 5.8 | 6.1 | G |

The full list spans all ten ESRS topical standards; scores broadly reflect consensus that climate
mitigation is the highest-impact topic, but they carry no external provenance.

**`STAKEHOLDER_GROUPS` (7 rows)** — each carries an influence `weight` (Σ = 1.0: investors 0.28,
employees 0.18, customers 0.16, regulators 0.14, NGOs 0.12, suppliers 0.07, communities 0.05) and
E/S/G rating literals (e.g. NGOs rate E at 9.4, regulators rate G at 9.4). **Synthetic demo values.**

**`COMPANIES` (24 rows)** — real large-cap names, but `impactMaterialityScore`,
`financialMaterialityScore` and `disclosureQuality` are seeded `sr(i·k)·40 + base`; `csrdScope`,
`materialTopics` and `stakeholderEngaged` are index-modulo flags (`i%4`, `i%5`, `i%3`).

### 7.3 Calculation walkthrough

There is no materiality *derivation*. Inputs flow as: `TOPICS` literals → KPI means and the
double-materiality scatter/bar; `STAKEHOLDER_GROUPS` literals → the E/S/G stakeholder chart;
`maturityTrend` (2021–2025) → a line chart where each year's impact/financial/double index is
`base + i·slope + sr()·noise` (a fabricated upward-trending curve). Pillar and sector selectors
filter the topic/company arrays but do not re-score anything.

### 7.4 Worked example (KPI means)

Average impact = (8.9+7.2+7.8+8.1+6.4+7.5+7.1+6.8+6.2+7.4+5.8+7.3)/12 = 84.5/12 = **7.04**.
Average financial = (7.8+6.4+5.9+5.2+5.7+6.8+5.5+4.9+5.8+7.2+6.1+6.3)/12 = 73.6/12 = **6.13**.
CSRD in-scope = 24 companies with `i%4 !== 3` true for 18 of them → **18/24**. These three literals
are exactly what the Overview KPIs display.

### 7.5 Data provenance & limitations

- **All scores are static demo data.** Topic and stakeholder scores are hand-set literals; company
  scores use the platform PRNG `sr(s)=frac(sin(s+1)×10⁴)`. Nothing is entity-specific or derived
  from disclosures.
- **The advertised multi-framework engine is absent.** No ISSB/GRI/SASB scoring, no interoperability
  map, no convergence set, no peer-disclosure benchmarking — the guide should be rewritten to
  describe an ESRS double-materiality dashboard, or the framework-comparison logic should be built
  (see §8).
- Stakeholder weights sum to 1.0 but are never used to *weight* topic scores — they only feed the
  descriptive E/S/G chart.

**Framework alignment:** EFRAG ESRS 1 double materiality — the topic taxonomy (E1–E5, S1–S4, G1) and
the impact-vs-financial two-axis presentation are correct ESRS 1 concepts (a topic is material if it
crosses *either* the impact or the financial threshold). ISSB IFRS S1 (enterprise-value / single
materiality) and GRI (impact-only materiality) are named in the guide but not implemented. SASB
industry standards (12–20 accounting metrics per SICS sector) are referenced but no metric library
exists in code.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A cross-framework materiality reconciliation engine that, for a given entity and sector, scores each
sustainability topic under CSRD/ESRS (double), ISSB IFRS S1 (single/financial) and GRI (impact) and
identifies the *convergence set* — topics material under two or more frameworks — to minimise
duplicative disclosure. Coverage: one reporting entity mapped to a SICS/NACE sector; ~30 candidate
topics spanning ESRS topical standards.

### 8.2 Conceptual approach
A two-signal Bayesian materiality score per topic per framework, benchmarked against EFRAG's
Implementation Guidance IG-1 (materiality assessment) and the GRI-SASB-ISSB Interoperability Map.
Impact and financial signals are elicited from stakeholder surveys and financial exposure data, then
thresholded per framework rule. Convergence is a set operation over the three material-topic sets,
mirroring the "connected information" objective of the IFRS-EFRAG interoperability guidance.

### 8.3 Mathematical specification
For topic *t*:

```
Impact_t     = w_severity·Severity_t + w_scale·Scale_t + w_irrem·Irremediability_t   (0–10)
Financial_t  = Σ_h P(risk_h) · Magnitude_h / EBITDA                                  (0–10, scaled)
Material_CSRD = 1[Impact_t ≥ θ_I]  OR  1[Financial_t ≥ θ_F]
Material_ISSB = 1[Financial_t ≥ θ_F]
Material_GRI  = 1[Impact_t ≥ θ_I]
Convergence_t = Material_CSRD + Material_ISSB + Material_GRI   ∈ {0,1,2,3}
```

| Parameter | Symbol | Value / source |
|---|---|---|
| Severity/scale/irremediability weights | w | EFRAG IG-1 impact factors (0.4/0.3/0.3) |
| Impact threshold | θ_I | ≥5/10 (entity-set, EFRAG IG-1) |
| Financial threshold | θ_F | ≥5/10 or ≥5 % EBITDA-at-risk (ISSB S1 §BC) |
| Sector priors | — | SASB SICS materiality map |
| Stakeholder weights | w_grp | AUM/influence-weighted (already in `STAKEHOLDER_GROUPS`) |

### 8.4 Data requirements
Per topic: stakeholder survey scores (severity/scale/likelihood), sector SASB priors, and financial
exposure (topic-linked revenue/cost/CapEx at risk, EBITDA). Sources: internal DMA survey, SASB
Materiality Finder (free), NACE/SICS sector mapping. Platform assets: `STAKEHOLDER_GROUPS` weights
already exist; `GLOBAL_COMPANY_MASTER` supplies sector; the `dynamic-materiality` engine and
`materiality-scenarios` module hold adjacent scoring logic to reuse.

### 8.5 Validation & benchmarking plan
Reconcile the CSRD material set against the entity's published ESRS DMA; reconcile ISSB set against
SASB-disclosed metrics; back-test convergence stability across two reporting years. Sensitivity-test
θ_I/θ_F ±1 point to confirm the convergence set is not knife-edge. Benchmark against peer DMAs and
the GRI-SASB-ISSB Interoperability Map's expected shared datapoints.

### 8.6 Limitations & model risk
Survey-driven impact scores are subjective and gameable; financial materiality depends on
EBITDA-at-risk estimates that are noisy for long-horizon topics (biodiversity). Conservative
fallback: when a signal is missing, default the topic to *material* under CSRD (precautionary) but
flag it low-confidence, never auto-dropping a topic on incomplete data.
