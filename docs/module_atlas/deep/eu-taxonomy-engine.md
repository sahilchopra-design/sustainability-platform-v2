## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code (frontend↔backend) mismatch flag.** As with `eu-taxonomy`, a rigorous backend
> (`eu_taxonomy_engine.py`) implements the real Article-3 test with genuine TSC comparison, DNSH, MSS,
> and GAR roll-up. **This frontend, however, computes alignment locally in `assessTaxonomyAlignment`,
> partly against real TSC thresholds but partly on a seeded ESG-score heuristic.** It is a step closer
> to reality than `eu-taxonomy` (it embeds correct numeric thresholds — 100 gCO₂e/kWh, 1.331 tCO₂e/t
> steel, 0.469 t/t cement clinker, EPC-A, PUE < 1.5) but the `ghg_intensity` it tests is frequently
> synthetic (`50 + s·400`) and the headline `alignedRevenuePct` is an **ESG-score formula, not
> aligned-turnover accounting**. Documented below.

### 7.1 What the module computes

Per company, `assessTaxonomyAlignment` maps GICS→taxonomy sector, filters `EU_TAXONOMY.activities` to
that sector, and evaluates each activity's threshold against the company's GHG intensity / ESG score:

```js
h = hashStr(isin || name);  s = seed(h)
esgScore = company.esg_score ?? (30 + s·50)                    // synthetic fallback
ghgInt   = company.ghg_intensity_tco2e_per_mn ?? (50 + s·400)  // synthetic fallback
per activity:
  if threshold.ghg_per_kwh   → aligned = ghgInt < 200          // power
  if threshold.ghg_per_tonne → aligned = ghgInt < 250          // steel/cement/aluminium
  if transport thresholds    → aligned = ghgInt < 180
  if building/PUE/forest      → aligned = esgScore > 55/50/45
  else                        → aligned = seed(h+idx·137) > 0.5
  dnsh_met       = esgScore > 45 + s2·10
  safeguards_met = esgScore > 38 + s2·8
  overall_aligned = aligned ∧ dnsh_met ∧ safeguards_met
alignedRevenuePct = anyAligned ? min(100, esgScore/100·75 + (sbti?20:0) + s·5) : (s>0.7 ? s·12 : 0)
```

Portfolio KPIs then weight `alignedRevenuePct` by holding weight:
`weightedAligned = Σ(alignedRevenuePct · weight/100)`, plus per-objective and DNSH/safeguard averages.

### 7.2 Parameterisation & provenance

| Element | Value | Provenance |
|---|---|---|
| Activity TSC thresholds | **Real regulatory numbers**: power < 100 gCO₂e/kWh; gas transitional < 270g; steel EAF < 1.331 tCO₂e/t; cement clinker < 0.469; aluminium < 1.484; rail < 50 gCO₂/pkm; ZEV 0 tailpipe; new build 10% < NZEB; renovation 30%; EPC-A; data centre PUE < 1.5; water < 0.5 kWh/m³ | **Climate DA 2021/2139** + Complementary DA 2022/1214 |
| Alignment test cut-offs | ghgInt < 200/250/180; esgScore > 45–55 | **Frontend heuristic** — proxies the threshold, not a per-activity comparison to the exact TSC |
| `esgScore`/`ghgInt` fallback | `30+s·50` / `50+s·400` | **Synthetic** when company lacks real fields |
| DNSH criteria (5) | CCA / WMR / CE / PP / BIO | Real DNSH structure; scored via `esgScore` heuristic |
| Minimum Safeguards (4) | OECD MNE / UNGP / ILO / Intl Bill of Human Rights | Real; scored via `esgScore` heuristic |
| `SECTOR_MAP` | GICS → {Energy, Industry, Transport, Buildings, ICT, Finance, Water, Forestry} | Editorial mapping |

The **activity/threshold catalogue is genuinely accurate** — these are the exact Delegated-Act numbers.
The weakness is the *evaluation*: it applies broad `ghgInt < 200` bands rather than comparing to each
activity's specific threshold, and it substitutes ESG score for building/PUE/forest criteria.

### 7.3 Calculation walkthrough

1. Company → GICS → `taxSector` → eligible activities in that sector.
2. Each activity's threshold type routes to a comparison (GHG-intensity band or ESG-score gate).
3. `dnsh_met`, `safeguards_met` gate on ESG score; `overall_aligned` requires all three.
4. `alignedRevenuePct` = ESG-score-driven formula if any activity aligns, else a small seeded residual.
5. Portfolio: `weightedAligned`, `avgDnsh`, `avgSafeguards`, per-objective %s, GAR-style aggregation.

### 7.4 Worked example

Company with real `esg_score = 68`, `ghg_intensity = 140`, GICS "Utilities" → taxSector "Energy",
`sbti_committed = true`, `s = seed(hash) ≈ 0.6`:

| Activity | Threshold | Test | Aligned? |
|---|---|---|---|
| Solar PV (ghg_per_kwh) | ghgInt < 200 | 140 < 200 | yes |
| Wind (ghg_per_kwh) | ghgInt < 200 | 140 < 200 | yes |
| Gas < 270g (ghg_per_kwh) | ghgInt < 200 | 140 < 200 | yes (but should test 270 band) |
| dnsh_met | esg > 45 + s2·10 (~51) | 68 > 51 | yes |
| safeguards_met | esg > 38 + s2·8 (~43) | 68 > 43 | yes |

anyAligned = true → `alignedRevenuePct = min(100, 68/100·75 + 20 + 0.6·5) = 51 + 20 + 3 = 74.0%`.
So the company reports **74% taxonomy-aligned turnover** — but this number is `f(ESG score, SBTi)`,
**not** the sum of aligned activities' actual revenue. A utility with 68 ESG and SBTi always lands near
74% regardless of its real green-revenue split.

### 7.5 Data provenance & limitations

- **TSC catalogue is real and accurate**; the *alignment evaluation* is coarse (intensity bands) and
  falls back to ESG-score gates for non-emission criteria.
- **`alignedRevenuePct` is an ESG-score heuristic**, not aligned-turnover accounting — the core
  Article-8 KPI is fabricated from ratings, not financials.
- **GHG intensity is synthetic** (`50 + s·400`) whenever the company lacks a real value.
- DNSH and Minimum Safeguards are `esgScore` thresholds, not evidence assessments.
- The rigorous engine (`eu_taxonomy_engine.py`) that does real TSC comparison and turnover-based GAR is
  not invoked for scoring; only `/ref/*` reference data is fetched.

**Framework alignment:** Faithful to **EU Taxonomy Regulation (EU) 2020/852** and the **Climate
Delegated Act 2021/2139** threshold set (the embedded gCO₂/kWh and tCO₂e/tonne numbers are correct),
and structurally to Article-3 (SC ∩ DNSH ∩ MSS) and Article-8 turnover/capex/opex KPIs. But it
approximates alignment via ratings rather than the technical-screening comparison the framework
defines. The genuine implementation lives in the backend engine.

## 8 · Model Specification

**Status: specification — not yet wired into the frontend (backend engine exists).** Replace the
ESG-score heuristic with per-activity TSC evaluation and turnover-based alignment via
`eu_taxonomy_engine.assess_entity`.

**8.1 Purpose & scope.** Compute activity-level alignment against exact TSC, then entity turnover/capex/
opex alignment and portfolio GAR — from reported activity revenues and evidence, not ratings.

**8.2 Conceptual approach.** The Article-3 three-step test with per-activity threshold comparison, as
in ISS ESG / MSCI / Clarity AI taxonomy engines and the platform's own `eu_taxonomy_engine.py`. Each
activity's revenue is classified eligible/aligned/non-eligible, then aggregated by financial weight.

**8.3 Mathematical specification.**

```
Per company activity a with reported metric m_a, threshold τ_a, revenue R_a:
  SC_met_a = (m_a ≤ τ_a) for emission thresholds, or (m_a ≥ τ_a) for reduction/EPC thresholds
  aligned_a = SC_met_a ∧ DNSH_a ∧ MSS   (DNSH/MSS from attested evidence, not ESG proxy)
  turnover_aligned% = Σ_a (aligned_a · R_a) / Σ_a R_a
  turnover_eligible% = Σ_a (eligible_a · R_a) / Σ_a R_a    (capex, opex analogous)
Portfolio: GAR = Σ_i (exposure_i · turnover_aligned%_i) / Σ_i exposure_i
Per objective: aligned%_o = Σ_i exposure_i · aligned_turnover_for_o / Σ exposure
```

| Parameter | Source |
|---|---|
| Per-activity τ (100 gCO₂/kWh, 1.331 t/t steel, 0.469 cement, EPC-A, PUE 1.5) | Climate DA 2021/2139 (already in the catalogue) |
| DNSH criteria | DA Annexes |
| Minimum Safeguards | OECD MNE / UNGP / ILO / Intl Bill of Human Rights |
| Activity revenues | Company segment reporting / Taxonomy disclosures |

**8.4 Data requirements.** Per-activity revenue and the specific TSC metric (life-cycle gCO₂/kWh,
tCO₂e/tonne, EPC class, PUE, % below NZEB), plus DNSH/MSS attestations. Platform holds
`GLOBAL_COMPANY_MASTER` (GHG intensity, ESG) and the backend engine; needs activity-level revenue
splits (segment data) to replace the ESG-score proxy.

**8.5 Validation & benchmarking plan.** Reconcile computed turnover-aligned% against issuers' published
Taxonomy disclosures; unit-test each threshold comparison; benchmark portfolio GAR against EBA Pillar-3
templates and a vendor (ISS/MSCI) taxonomy dataset.

**8.6 Limitations & model risk.** Activity-level revenue splits are scarce for non-EU issuers — where
absent, mark eligible-not-aligned rather than proxying alignment from ESG. Transitional/enabling
activities need special handling (gas < 270g, nuclear conditions). Conservative fallback: no evidence →
not aligned.
