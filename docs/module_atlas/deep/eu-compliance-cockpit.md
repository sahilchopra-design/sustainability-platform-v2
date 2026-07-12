## 7 · Methodology Deep Dive

### 7.1 What the module computes

The cockpit walks one company profile through **five independently wired, live backend
engines** in sequence, then builds a sixth "scorecard" step that is purely a local aggregation
of the five live results — no engine exists for the scorecard itself.

| Step | Endpoint | Engine | Regulation |
|---|---|---|---|
| 1 | `POST /api/v1/eu-taxonomy/assess-activity` | `eu_taxonomy_engine.py` | Reg. (EU) 2020/852 Art. 3 |
| 2 | `POST /api/v1/eudr/due-diligence` | `eudr_engine.py` | Reg. (EU) 2023/1115 Art. 4-12 |
| 3 | `POST /api/v1/eu-ets/ets2-readiness` | `eu_ets_engine.py` | Directive 2003/87/EC Ch. IVa (Art. 30a-30j) |
| 4 | `POST /api/v1/eu-gbs/assess-issuance` | `eu_gbs_engine.py` | Reg. (EU) 2023/2631 Art. 5 |
| 5 | `POST /api/v1/xbrl/export` | `xbrl_export_engine.py` | CSRD / ESEF — EFRAG XBRL taxonomy |
| 6 | — (local aggregation only) | `scorecard` useMemo | All five |

A shared "Company Profile" (name, LEI, reporting year, Scope 1/2/3, energy, renewable share,
internal carbon price) is carried across steps and feeds the DNSH/minimum-safeguards
confirmations from Step 1 into Step 4's EuGB assessment (`step1DnshOk`, `step1MsOk`, lines
278-280), which is a genuine cross-step dependency, not just shared UI state.

### 7.2 Step 1 — EU Taxonomy Article 3 three-part test

`_evaluate_substantial_contribution` compares a single evidence value (e.g.
`emission_intensity`) against a NACE activity's Technical Screening Criteria (TSC) threshold
from a hand-authored `NACE_ACTIVITIES` table (Climate Delegated Act 2021/2139). For lower-is-
better metrics:

```python
met   = actual_value <= threshold
score = max(0, min(100, (1 - actual_value/threshold) * 100))
```

`_evaluate_dnsh` checks the other five objectives via boolean flags in `evidence_data`
(`dnsh_cca`, `dnsh_wtr`, etc. — met=True/score=100 if the flag is true, 0 otherwise — the
frontend's Step 1 checkboxes map 1:1 onto this). `_evaluate_minimum_safeguards` is a weighted
average across five OECD/UNGP/ILO areas with fixed weights (`human_rights` 0.30, `labour` 0.25,
`anti_corruption` 0.20, `taxation` 0.15, `fair_competition` 0.10):

```python
final_score = Σ(area_score × weight) / Σ(weight)
met = final_score >= 50.0
taxonomy_aligned = sc_met AND all_dnsh_met AND ms_met
```

**Traced example** (Step 1 defaults: `D35.11_solar`, `emission_intensity=32` gCO2e/kWh vs
threshold 100, all 5 DNSH flags true, MS scores 80/75/70/65/75): direct call to
`EUTaxonomyEngine.assess_activity` returns `sc_score=68.0` (= (1-32/100)×100), all 5 DNSH
`met=True/score=100`, `ms_evidence.score=74.0` (= 80×.30+75×.25+70×.20+65×.15+75×.10), and
**`taxonomy_aligned=True`** — confirmed by direct engine call.

### 7.3 Step 2 — EUDR due diligence (Art. 4-12)

Three sub-scores combine into an overall compliance score:

```python
overall = information_score*0.45 + risk_assessment_score*0.25 + risk_mitigation_score*0.30
status  = "compliant" (≥80) | "at_risk" (≥50) | "non_compliant" (<50)
```

`information_score` (Art. 9) is the average per-commodity traceability score, which starts at
100 and loses points for missing geolocation (-25, or -10 if a >4ha plot lacks a polygon),
missing supplier ID (-15), missing production date (-10), missing quantity (-10), no local-law
evidence (-15), and — critically — **no deforestation-free evidence (-25)**, all per named
Art. 9(1) sub-clauses. `risk_assessment_score` (Art. 10) starts at 100 and subtracts 40/20/30 for
missing country, high-risk country, or missing commodities respectively. `risk_mitigation_score`
(Art. 11-12) starts at a 30 baseline, adds fixed credits for independent audit (+25), satellite
monitoring (+20), third-party verification (+15), and +5 per recognised certification (FSC,
RSPO, PEFC, Rainforest Alliance) — then, if the country/commodity pairing is enhanced-DD
("high" risk tier), **subtracts** 15 for no independent audit and 10 for no satellite monitoring.

**Traced example** (Step 2 defaults: wood, Brazil + Indonesia — both "high" risk tier under
Art. 29 → enhanced DD level, plot 12ha with polygon, supplier/date/quantity all provided, local
law evidence yes, deforestation-free evidence **no**, satellite monitoring yes, independent
audit no, FSC certified): direct call to `EUDREngine.assess_due_diligence` returns
`information_score=75.0` (100 − 25 for the missing deforestation-free evidence only),
`risk_assessment_score=80.0` (100 − 20 for high-risk country), `risk_mitigation_score=40.0`
(30 + 20 satellite + 5 FSC − 15 enhanced-DD independent-audit penalty = 40),
**`overall_compliance_score=65.8`** (= 75×0.45 + 80×0.25 + 40×0.30 = 33.75+20+12), status
`"at_risk"` — confirmed by direct engine call, matching hand arithmetic exactly.

### 7.4 Step 3 — ETS2 readiness (Art. 30a-30j)

Annual emissions are computed from a fuel-specific emission factor table
(`ETS2_EMISSION_FACTORS`, e.g. diesel = 2.640 kgCO2/litre) applied to the declared fuel volume:

```python
annual_emissions_tco2 = annual_fuel_volume_litres * ef_kgco2_per_litre / 1000
allowance_cost_eur    = annual_emissions * max(carbon_price_eur, corridor_floor_eur)
consumer_impact_eur_per_litre = carbon_price_eur * ef_per_litre / 1000
```

Readiness is a 100-point deduction scale: −25 (no MRV system), −20 (no monitoring plan
submitted), −20 (no registry account), −20 (no verified emissions report), −15/−5 for
estimated/calculated (vs measured) fuel-volume data quality. Pass-through potential is a fixed
85%/70%/60% by fuel category (road/heating/other).

**Traced example** (Step 3 defaults: diesel, 5,000,000 litres/yr, €59/tCO2 expected price, none
of the four readiness flags set, "calculated" data quality): direct call to
`EUETSEngine.assess_ets2_readiness` returns **`annual_emissions_tco2=13,200.0`**
(= 5,000,000 × 2.640 / 1000), **`estimated_allowance_cost_eur=778,800.0`** (= 13,200 × €59, since
59 exceeds the price-corridor floor), `consumer_impact_eur_per_litre=0.1558` (= 59×2.640/1000),
**`readiness_score=10.0`** (100 − 25 − 20 − 20 − 20 − 5), `pass_through_potential_pct=85.0` —
confirmed by direct engine call.

### 7.5 Step 4 — EU Green Bond 85/15 flexibility pocket (Art. 5)

The "85/15" name refers to the Art. 5 flexibility pocket: up to 15 percentage points of
proceeds may go to activities meeting DNSH/minimum-safeguards but lacking finalized Technical
Screening Criteria, provided the **TSC-compliant core alone still reaches `threshold − 15%`**
(85% for a standard 100% threshold, or 65% for the 80% sovereign threshold under Art. 21):

```python
pocket_credited = min(pocket_pct, 15) if pocket_conditions_met else 0
core_min_pct    = max(threshold_pct - 15, 0)
effective_pct   = core_pct + pocket_credited
tax_score       = min(effective_pct / threshold_pct, 1.0) * 100
# blocking gap if core_pct < core_min_pct, even if effective_pct clears the threshold
compliance_score = 0.40*tax_score + 0.20*dnsh_score + 0.15*ms_score + 0.15*er_score + 0.10*reporting_score
overall_compliant = (len(blocking_gaps) == 0)
```

**Traced example** (Step 4 defaults, carrying Step 1's DNSH/MS confirmations forward:
`taxonomy_alignment_pct=78`, `flexibility_pocket_pct=15`, conditions met, external reviewer
engaged with pre-issuance review, not sovereign): direct call to `EUGBSEngine.assess_issuance`
returns `effective_taxonomy_alignment_pct=93` (78+15) and `tax_score=93.0`, giving
**`compliance_score=95.2`** (0.40×93 + 0.20×100 + 0.15×100 + 0.15×100 + 0.10×80) — **yet
`overall_compliant=False`**, because the 78% *core* allocation is below the 85% minimum core
required when the pocket is capped at 15pp of a 100% threshold (`core_min_pct = 100−15 = 85`).
This is an important, code-verified nuance: **a 95.2/100 compliance score does not imply
compliance** — a single blocking gap (here, insufficient TSC-compliant core) overrides the
headline score, exactly matching the regulation's intent (the pocket cannot substitute for core
compliance, only supplement it).

### 7.6 Step 5 — ESRS XBRL export

`XBRLExportEngine.export()` maps each submitted data point through a fixed `ESRS_XBRL_TAXONOMY`
dictionary (concept, unit, ESRS disclosure code) to produce one `XBRLFact` per recognised
`dp_id`; unrecognised `dp_id`s are silently dropped. Validation runs 7 ESEF rules (LEI format,
period ordering, currency unit presence, decimals attribute, taxonomy concept existence, unique
context IDs, no duplicate facts) and `validation_passed = (errors_count == 0)`.

**Traced example** (Step 5 defaults: 8 data points — Scope 1/2loc/2mkt/3/total GHG, energy,
renewable share, internal carbon price — all of which exist in the taxonomy): direct call
returns **`fact_count=8`**, `coverage_by_esrs={'E1': 8}`, `validation_passed=True`,
`errors_count=0`, `warnings_count=0`.

⚠️ **Minor code note (not a guide/code mismatch, but worth flagging):** `export()` **always**
hard-codes `warnings_count=0` (line 369 of `xbrl_export_engine.py`) regardless of the actual
validation results — there is no code path that produces a non-zero warning count from the live
engine. The page's `DEMO_RESULTS.xbrl` fallback (shown only if the backend is unreachable)
happens to show `warnings_count: 1`, which is illustrative demo data, not something the live
engine can currently produce.

### 7.7 Step 6 — Compliance scorecard (local aggregation, no engine)

Each step contributes a 0-100 score derived from its own live result (`scorecard` useMemo, lines
351-385): Taxonomy = 100 if aligned else a weighted SC/DNSH/MS blend; EUDR = its own
`overall_compliance_score`; ETS2 = its own `readiness_score`; EuGB = its own `compliance_score`;
XBRL = validation pass-rate (100 if `validation_passed`, else % of rules passed). The **Overall
Chain Score** is a simple unweighted mean of whichever steps have been run:

```js
overallScore = Math.round(ranRows.reduce((a, r) => a + r.score, 0) / ranRows.length)
```

**Traced full-chain example**, combining all five steps' hand/engine-verified results above
(Taxonomy 100, EUDR round(65.8)=66, ETS2 round(10.0)=10, EuGB round(95.2)=95, XBRL 100):
mean = (100+66+10+95+100)/5 = 371/5 = **74.2 → Overall Chain Score 74/100**, with 2 of 5
requirements passed (Taxonomy aligned, XBRL filing-ready) despite the moderate blended score —
illustrating that a single mid-70s composite can mask a genuinely non-compliant chain (ETS2
readiness of 10 and a blocking EuGB gap).

### 7.8 Data provenance & limitations

- All five engines are genuine, deterministic Python calculators over named regulatory
  thresholds (Climate Delegated Act 2021/2139 TSC values, EUDR Art. 9-12 penalty weights, ETS2
  emission factors, EU GBS Art. 5 pocket cap, ESEF validation rules) — none use random-number
  fabrication; every score traced above was cross-checked against a direct call into the actual
  service function, not just read from source.
- `DEMO_RESULTS` is an explicit, clearly-labelled fallback shown only when the corresponding
  live endpoint is unreachable; it is illustrative, static data and does not reflect the live
  formulas (see the XBRL `warnings_count` note above).
- The Step 6 scorecard performs no new risk modelling — it is a documented, transparent mean of
  five already-computed scores, each remaining independently inspectable via its own step page.
- EUDR's enforcement-deadline logic (`enforcement_deadline = "2025-12-30"` for non-SME
  operators) is date-relative; running the assessment after that date will show a negative
  `days_until_deadline`, which is a correct reflection of a passed deadline, not a bug.

**Framework alignment:** EU Taxonomy Regulation (EU) 2020/852 Art. 3/10-18 + Climate Delegated
Act 2021/2139 · EUDR Regulation (EU) 2023/1115 Art. 4-12, 29 · EU ETS Directive 2003/87/EC as
amended by Directive 2023/959 Ch. IVa (ETS2, Art. 30a-30j) · EU Green Bond Standard Regulation
(EU) 2023/2631 Art. 3-5, 21-22 · CSRD/ESRS Set 1 (2023) XBRL taxonomy / ESEF Regulation.

## 8 · Model Specification

**Status: implemented.** All five composed engines are complete, live FastAPI-backed Python
services; the sequencing/aggregation logic (shared profile, cross-step DNSH/MS carry-forward,
scorecard) is genuinely computed in the React page, not mocked.

**8.1 Purpose & scope.** Give a compliance officer a single walkthrough of one company's
exposure across five distinct, independently-regulated EU climate compliance regimes that in
practice are usually assessed by different teams using different tools — and show, in one
scorecard, where the chain as a whole stands.

**8.2 Conceptual approach.** Each step is a thin UI wrapper around a pre-existing, fully
implemented regulatory calculator; the cockpit's only original contribution is (a) carrying one
company profile across all five, (b) feeding Step 1's DNSH/minimum-safeguards verdict into
Step 4's EuGB assessment as a genuine dependency, and (c) an unweighted-mean scorecard. No new
regulatory logic is introduced at the cockpit layer.

**8.3 Mathematical specification.**
```
Taxonomy:  aligned = SC_met AND DNSH_all_met AND MS_met (MS = Σ area_score·weight / Σweight)
EUDR:      overall = 0.45·info + 0.25·risk_assessment + 0.30·risk_mitigation
ETS2:      emissions_tCO2 = volume × emission_factor / 1000;  readiness = 100 − Σ gap_penalties
EuGB:      tax_score = min((core_pct + min(pocket_pct,15)) / threshold_pct, 1) × 100
           compliant = tax_score meets threshold AND core_pct ≥ threshold_pct − 15 AND no other blocking gaps
XBRL:      validation_passed = (errors_count == 0) over 7 ESEF rules
Scorecard: overall_chain_score = mean(step_scores for steps run)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| NACE TSC thresholds | per-activity | EU Climate Delegated Act 2021/2139 (real, cited) |
| MS area weights | 30/25/20/15/10% | Hand-set, OECD/UNGP/ILO-aligned |
| EUDR score weights | 45/25/30% | Hand-set (Art. 9/10/11-12 emphasis) |
| ETS2 emission factors | kgCO2/litre by fuel | Real published EU default emission factors |
| EuGB pocket cap | 15pp | Regulation (EU) 2023/2631 Art. 5 (real, cited) |
| EuGB score weights | 40/20/15/15/10% | Hand-set |

**8.4 Data requirements.** Per step: NACE activity code + one quantitative/qualitative
evidence value + DNSH flags + MS maturity scores (Step 1); commodity/country/certification/
traceability flags (Step 2); fuel type/volume/price/readiness flags (Step 3); bond taxonomy %,
pocket %, external-reviewer flags (Step 4, using Step 1's DNSH/MS carry-forward); Scope 1/2/3,
energy, renewable share, carbon price (Step 5). All fields are user-entered in the cockpit form;
none are pulled from a live disclosure or ERP system.

**8.5 Validation & benchmarking.** Each engine's thresholds are traceable to the cited
regulation/delegated act text and were independently verified in this deep-dive by direct
function calls reproducing the page's default inputs. No end-to-end backtest exists for the
Step 6 scorecard's unweighted-mean design — it is explicitly a transparency aid, not a modelled
composite risk score.

**8.6 Limitations & model risk.** (1) The Step 6 mean treats all five regimes as equally
weighted regardless of materiality to the specific company (e.g. ETS2 may be irrelevant for a
company with no regulated fuel use, yet still drags down the average). (2) EUDR's country-risk
list and EU GBS pocket mechanics are current as of the respective regulations' 2023 text and
will need updates as delegated/implementing acts evolve (e.g. EUDR's repeatedly delayed
application date). (3) The XBRL engine's `warnings_count` is currently a dead code path (always
0) — any UI or downstream logic expecting genuine warning-level validation results should not
rely on it. (4) None of the five engines ingest real disclosure data automatically; every input
is manually re-entered per assessment, so consistency across steps depends entirely on the
operator keeping the shared Company Profile and per-step forms aligned.
