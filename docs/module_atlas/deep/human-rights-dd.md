## 7 · Methodology Deep Dive

> ℹ️ **Guide↔code note.** The guide gives `SalientRisk = Impact_severity × Likelihood × Vulnerability`.
> The page implements a **related but different** salient-risk model: it blends four issue-level country
> risk factors (forced labour, child labour, freedom-of-association, OH&S) into a base risk, scaled by a
> sector multiplier, and scores UNGP due-diligence completeness against a weighted 15-item checklist.
> Risk factors are drawn from real, curated country×issue tables (not `sr()`), but individual holding
> variation uses a deterministic `(h % N)` jitter rather than real firm data. Substantively close to the
> guide; the exact multiplicative form differs.

### 7.1 What the module computes

**Base human-rights risk** per holding (`scoredHoldings`):
```js
baseRisk = ((forcedLabourRisk + childLabourRisk + foaRisk + ohsRisk)/4) × 100 × sectorMult
hrRiskScore = clamp(5, 100, round(baseRisk + (h%15) − 7))          // ±7 index jitter
supplyChainRisk = clamp(10, 100, hrRiskScore + (h%20) − 10)
```
where the four issue risks are the country risk factors for that holding's country from
`HR_SALIENT_ISSUES` (e.g. Bangladesh forced-labour 0.85, Germany 0.08).

**UNGP completeness** (weighted DD checklist, 15 items, total weight 104):
```js
ungpPct = ungpMax>0 ? round(ungpScore/ungpMax × 100)
                    : max(15, 85 − hrRiskScore + (h%20))            // fallback
```

**Portfolio exposures** (weight-weighted issue prevalence):
```js
forcedExposure = Σ(forcedLabourRisk × weight) / Σ weight × 100
engagementPriority = (hrRiskScore/100) × weight                     // ranked top-15
```

### 7.2 Parameterisation — real UNGP framework

**8 salient issues** (`HR_SALIENT_ISSUES`) each carry severity, exposed sectors, indicators and a
**country risk-factor table**:

| Issue | Severity | Example country factors |
|---|---|---|
| Forced Labour | Critical | BD 0.85, VN 0.75, IN 0.72, DE 0.08 |
| Child Labour | Critical | CG 0.88, NG 0.82, BD 0.78, BR 0.38 |
| Freedom of Association | High | CN 0.85, VN 0.82, SA 0.80, GB 0.12 |
| OH&S | High | BD 0.78, IN 0.65, US 0.22, DE 0.10 |

**15-item DD checklist** weighted by materiality (HR impact assessment 10, supply-chain audits 10,
board-approved policy 8, grievance mechanism 8…; total 104). **Regulatory sets**: Modern Slavery Acts
(UK £36M threshold, AU $100M, US UFLPA, Canada), CSDDD articles (7 rows, 2027 phase-in), 13-event
regulatory timeline. These country/issue/regulatory tables are curated real data, not seeded.

### 7.3 Calculation walkthrough

Holdings come from the portfolio (`GLOBAL_COMPANY_MASTER`). For each, the country determines the four
issue risk factors; the sector determines `sectorMult`; `baseRisk` blends them; a deterministic `(h%N)`
jitter adds per-holding spread. UNGP completeness scores against the weighted checklist. Portfolio KPIs:
`avgHR`, `avgUNGP`, weight-weighted `forcedExposure`/`childExposure`, grievance-mechanism %. The
country heatmap shows the 8 issues × 14 countries risk matrix; engagement-priority ranks holdings by
`risk × weight`.

### 7.4 Worked example (a Bangladesh consumer-staples holding)

Country BD issue factors: forced 0.85, child 0.78, FoA 0.75, OH&S 0.78; sector Consumer Staples
`sectorMult` ≈ 1.2; holding index h = 3 (jitter +3−7 = −4):

| Step | Computation | Result |
|---|---|---|
| mean issue risk | (0.85+0.78+0.75+0.78)/4 | 0.79 |
| baseRisk | 0.79 × 100 × 1.2 | 94.8 |
| hrRiskScore | clamp(5,100, round(94.8 − 4)) | **91** |
| supplyChainRisk | clamp(10,100, 91 + (3%20)−10) | 84 |
| engagement priority (weight 3%) | (91/100) × 3 | 2.73 |

A Bangladesh apparel holding scores 91/100 HR risk — Critical — driven by the high forced/child-labour
country factors and the consumer-staples sector multiplier, exactly the CSDDD/UFLPA hotspot the module
is designed to flag.

### 7.5 Data provenance & limitations

- **Country×issue risk factors are curated real data** (plausible ILO/Global Slavery Index-shaped
  values), not `sr()`-seeded — the substantive risk signal is defensible.
- **Per-holding variation is a deterministic `(h % N)` index jitter**, not real firm-level HR data or an
  actual salient-issue assessment — two same-country/same-sector firms differ only by portfolio index.
- The salient-risk form is an *average × sector multiplier*, not the guide's
  `severity × likelihood × vulnerability` product; severity is stored per issue but not multiplied in.
- UNGP completeness falls back to a formula (`85 − hrRiskScore + jitter`) when no assessment data exists.

### 7.6 Framework alignment

**UN Guiding Principles (2011)** — the 3-pillar structure (Protect/Respect/Remedy), salient-rights
identification, and the DD process (assess→integrate→track→remedy) are encoded in the pillars and
15-item checklist. **EU CSDDD (CS3D)** — the 7 mapped articles, 2027 phase-in and the value-chain scope
drive the regulatory tab; civil liability and up-to-5%-turnover penalties are the stakes. **OECD Due
Diligence Guidance** — the risk-based, salient-issue-first approach. **Modern Slavery Acts / UFLPA** —
jurisdiction thresholds and reporting obligations. UNGP itself defines salience by *scale, scope and
irremediability* of impact — the severity field encodes this qualitatively; a fuller model would
multiply severity × likelihood × leverage as §8 below specifies.

### 8 · Model Specification

**Status: specification — not yet implemented in code** (the page averages country factors × sector
multiplier; the guide's severity×likelihood×vulnerability salient-risk product and firm-level DD scoring
are not fully implemented).

**8.1 Purpose & scope.** Score salient human-rights risk and UNGP/CSDDD due-diligence adequacy per
holding, prioritising engagement across the portfolio.

**8.2 Conceptual approach.** UNGP salience scoring (severity × likelihood, weighted by leverage/
vulnerability) combined with a firm-level DD maturity score, mirroring the Corporate Human Rights
Benchmark (CHRB) and KnowTheChain methodologies, overlaid on country risk indices (Global Slavery
Index, ITUC Rights Index).

**8.3 Mathematical specification.**
```
SalientRisk_ij = Severity_i × Likelihood_ij × Vulnerability_j
   Severity_i  = f(scale, scope, irremediability) per issue i
   Likelihood_ij = country_risk_i(country_j) × sector_exposure_i(sector_j)
   Vulnerability_j = f(migrant-worker share, informal supply chain depth)
CompanyHRRisk_j = Σ_i w_i · SalientRisk_ij           (w_i = issue severity weight)
DD_maturity_j = Σ_k weight_k · met_k / Σ weight_k    (15-item UNGP checklist)
ResidualRisk_j = CompanyHRRisk_j × (1 − DD_maturity_j)
```

| Parameter | Source |
|---|---|
| Country risk factors | Global Slavery Index, ITUC Global Rights Index |
| Sector exposure | KnowTheChain, CHRB sector benchmarks |
| Severity weights | UNGP salience (scale/scope/irremediability) |
| DD checklist weights | UNGP Pillar 2/3 (page's 104-point set) |

**8.4 Data requirements.** Holding country/sector, actual HR policy/DD/grievance data, supply-chain
country mix, controversy feeds. The page has country/issue/sector tables and the DD checklist.

**8.5 Validation.** Reconcile company scores against CHRB benchmark ranks; back-test flags against
realised HR controversies/enforcement; sensitivity on severity weights and country indices.

**8.6 Limitations & model risk.** Firm-level DD data is scarce → fallback formulas dominate; country
indices are coarse; salience is partly qualitative. Conservative fallback: report country×issue risk
and DD-checklist completeness separately rather than a single residual score.

**Framework alignment:** UN Guiding Principles on Business and Human Rights (2011) — salience and the
Protect/Respect/Remedy pillars; EU CSDDD — mandatory value-chain DD (2027); OECD DD Guidance — risk-
based prioritisation; CHRB / KnowTheChain — the benchmarking the §8 model reconciles against; Modern
Slavery Acts / UFLPA — the disclosure and import-control obligations.
