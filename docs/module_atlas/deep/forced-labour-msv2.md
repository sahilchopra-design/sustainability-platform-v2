## 7 · Methodology Deep Dive

> ⚠️ **Engine↔page disconnect.** A **rigorous backend engine** (`forced_labour_engine.py`) implements
> the real methodology — weighted ILO 11-indicator screening, EU FLR 2024/3015 risk-points, UK MSA
> Section-54 30-point scoring, 5-pillar compliance maturity — with disciplined **honest-null handling**
> (unassessed indicators return `None`, never fabricated). **The frontend page does not call it.** The
> page (`ForcedLabourPage.jsx`) generates 300 supply chains, ILO scores, country risk and grievances
> entirely from the `sr()` PRNG. So the displayed risk scores are synthetic, even though a production-
> grade scoring engine sits behind the same module ID.

### 7.1 What the backend engine computes (the real methodology)

**ILO 11-indicator screening** — weighted aggregate over supplied per-indicator scores:
```python
score_i = clamp(raw_i, 0, 10)
aggregate = Σ_i score_i · weight_i        # weights sum to ~1.0 (0.07–0.10 each)
agg_score = aggregate / Σ_assessed weight_i   # renormalised over ASSESSED indicators only
risk_level = agg_score ≥7 critical · ≥5 high · ≥3 medium · else low
```
Unassessed indicators are excluded (not zero-filled); if none are assessed, the score is `None` with
`risk_level = "insufficient_data"`.

**EU FLR risk-points** (Regulation (EU) 2024/3015):
```
country: Tier-1 +3 · Tier-2 +2
sector : very_high +3 · high +2
audit  : missing +2 (cannot demonstrate absence) · <40 +2 · <60 +1
risk = points ≥7 critical · ≥5 high · ≥3 medium · else low
art7_trigger = (risk == critical) ;  art8_match = country∈{CN,KP,BY} & high-risk sector
```

**UK MSA Section 54** — 6 areas × 5 criteria, 1 point per affirmatively-disclosed criterion (max 30);
grade A (≥25) → E (<6). **Compliance maturity** — 5 weighted pillars (DD 0.25, policy/grievance/
remediation 0.20, monitoring 0.15), renormalised over supplied pillars, banded Initial→Optimising.

### 7.2 What the frontend page computes (synthetic)

The page aggregates over 300 `sr()`-seeded supply chains:

| Field | Formula | Status |
|---|---|---|
| riskScore | `round(20 + sr(i·7)·75)` → 20–95 | synthetic (drives tier) |
| ukMsaQuality | `round(20 + sr(i·13)·70)` | synthetic |
| iloScores[j] | `round(10 + sr(i·50+j·7)·80)` | synthetic (20 pseudo-indicators) |
| supplierCount | `round(50 + sr(i·19)·450)` | synthetic |
| highRiskSuppliers | `round(supplierCount·0.05 + sr()·supplierCount·0.15)` | synthetic (5–20%) |
| wageGap | `round(5 + sr(i·59)·45)` | synthetic |
| tier | riskScore >70 Critical · >50 High · >30 Medium · else Low | derived from synthetic |

Country risk, grievances (200), and audit records are likewise seeded. The page **lists 20 ILO
indicators** vs the engine's canonical **11** — a taxonomy divergence (the page mixes ILO forced-labour
indicators with other labour-rights items).

### 7.3 Calculation walkthrough (page)

1. Generate 300 supply chains + 25 country-risk rows + 200 grievances via `sr()`.
2. Aggregate portfolio KPIs (avg risk, total workers, tier distribution, audit pass rates).
3. Radar of ILO indicator scores; heatmap of country × industry risk; grievance severity/type/status.

### 7.4 Worked example (engine ILO aggregate)

Supplier with only 3 indicators assessed: `debt_bondage 8.0 (w 0.10)`, `retention_of_wages 6.0 (w 0.10)`,
`excessive_overtime 4.0 (w 0.07)`:
```
aggregate     = 8·0.10 + 6·0.10 + 4·0.07 = 0.80 + 0.60 + 0.28 = 1.68
assessed_wt   = 0.10 + 0.10 + 0.07 = 0.27
agg_score     = 1.68 / 0.27 = 6.22 → risk_level "high"
triggered (>6): debt_bondage only  ;  completeness "partial" (3 of 11)
```
The renormalisation is the engine's key rigour: it scores 6.22/10 on the evidence available rather than
diluting to ~0.15 by dividing over all 11 weights — and flags the 3/11 coverage honestly.

### 7.5 Data provenance & limitations

- **Frontend: all 300 supply chains and their risk scores are `sr()`-seeded** — not real suppliers,
  and not produced by the backend engine.
- **Backend: no synthetic data** — every score is caller-supplied or an honest null; this is the
  reference implementation.
- The page's 20-item indicator list diverges from the engine's canonical ILO-11 taxonomy.
- The engine is unwired to the page, so the page cannot benefit from its honest-null discipline.

**Framework alignment:** ILO 11 forced-labour indicators (engine: weighted, renormalised — ILO's
indicators are qualitative flags; the engine converts them to a 0–10 weighted risk) · EU Forced Labour
Regulation 2024/3015 (Art 5–8 risk assessment, country/sector risk points) · UK Modern Slavery Act 2015
s.54 (6-area disclosure, 30-point) · German LKSG prohibited-practices mapping · SA8000 audit framework ·
CSRD ESRS S2 + CSDDD HR-01 cross-linkage. The backend is a genuinely production-grade compliance engine.

## 8 · Model Specification

**Status: specification — not yet implemented (as wired to the page).** The engine is production-grade
but the page shows `sr()`-seeded scores instead of calling it. The specification below is essentially
"wire the page to the engine and feed it real supplier data."

### 8.1 Purpose & scope
Screen a company's supply chain for forced-labour risk and regulatory compliance (EU FLR, UK MSA, LKSG,
CSDDD) at supplier level, producing auditable risk scores and prioritised remediation actions.

### 8.2 Conceptual approach
The existing engine is the model — a **multi-framework compliance screen** benchmarked against
**Sedex/SMETA**, **Verisk Maplecroft** country risk indices, and the **ILO Global Estimates** of forced
labour. Its distinguishing rigour is honest-null renormalisation (score only the assessed evidence).

### 8.3 Mathematical specification
```
ILO_risk     = Σ_i∈A score_i·w_i / Σ_i∈A w_i          A = assessed indicators (renormalised)
EU_FLR_pts   = countryTier + sectorVuln + auditGap    → banded risk level
MSA_score    = Σ_area min(maxScore, Σ criteria met)   (0–30)
Maturity     = Σ_p∈S s_p·w_p / Σ_p∈S w_p              S = supplied pillars, renormalised
ResidualRisk = max(ILO_risk_level, countryFloor)      high-risk sourcing floors at "medium"
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| w_i (ILO) | indicator weights | ILO indicator severity (0.07–0.10) |
| countryTier | EU FLR risk tier | ILO Global Estimates + EC risk assessment |
| sectorVuln | sector risk | EU FLR high-risk sector list |
| pillar weights | compliance weights | DD-heavy (0.25); expert judgement |

### 8.4 Data requirements
Per supplier: per-ILO-indicator evidence scores, sourcing country/sector, audit evidence + score,
SA8000 status, MSA disclosure flags, compliance-pillar scores. Sources: Sedex/SMETA audits, supplier
questionnaires, Verisk Maplecroft (country risk), worker-voice surveys. The engine accepts all these
today; the page must collect and pass them instead of seeding.

### 8.5 Validation & benchmarking plan
Reconcile engine risk levels against Sedex SMETA audit outcomes; benchmark country floors against ILO
Global Estimates prevalence; test honest-null behaviour (partial data → partial score, never a fabricated
number); validate MSA grades against published statutory-disclosure assessments.

### 8.6 Limitations & model risk
Supplier self-disclosure is incomplete and gameable; indicator weights are judgemental; deep-tier
suppliers are unobserved. Conservative fallback (already in the engine): treat missing audit evidence as
elevated risk and floor high-risk-country residual risk at "medium".
