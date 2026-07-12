## 7 · Methodology Deep Dive

The `pe_deals` domain (`/api/v1/pe-deals`) is a **PE/VC deal-pipeline + ESG-screening engine**
(`pe_deal_engine.py`, with `pe_db_service.py` for persistence). It scores each deal across five
ESG dimensions, detects hard/soft red flags, contextualises with a sector risk heatmap, and
issues a proceed/conditions/reject recommendation.

### 7.1 What the module computes

For each deal: a composite ESG score (1 best … 5 worst risk), a risk band, a red-flag list, a
screening recommendation, and sector context. The composite is an equal-weighted mean of five
dimension scores, each the mean of its assessed sub-dimensions:

```
dimension_avg  = mean(assessed sub-dimension ratings)   (default 3.0 if none assessed)
composite      = mean(5 dimension_avgs)
risk_band      = LOW ≤2 · MEDIUM ≤3 · HIGH ≤4 · CRITICAL >4
```

### 7.2 Parameterisation / scoring rubric

**Five ESG dimensions** (`ESGDimension`): environmental, social, governance, transition_risk,
physical_risk — each with four sub-dimensions (`ESG_SUB_DIMENSIONS`), e.g. environmental =
carbon_intensity, resource_efficiency, pollution_prevention, biodiversity_impact.

**Sector ESG risk heatmap** (`SECTOR_ESG_RISK`, 1-5 per dimension) — selected rows:

| Sector | Env | Social | Gov | Transition | Physical |
|---|---|---|---|---|---|
| Energy | 5 | 3 | 3 | 5 | 4 |
| Utilities | 4 | 2 | 3 | 5 | 4 |
| Financials | 1 | 2 | 4 | 3 | 1 |
| Technology | 2 | 3 | 3 | 1 | 1 |

**Red-flag rules** (`_detect_red_flags`): **hard** (deal-breakers) = controversial weapons,
sanctions hit, UNGC violation, child-labour risk. **soft** (mitigation) = high-carbon sector
without transition plan, severe environmental incident, tax-haven structure, or any assessed
dimension averaging >4.0. **High-carbon sectors** (`HIGH_CARBON_SECTORS`): Energy, Utilities,
Materials.

**Recommendation** (`_recommendation`): any hard flag → **reject**; CRITICAL band → reject;
soft flags or HIGH band → **proceed_with_conditions**; else **proceed**.

**Provenance:** the heatmap and sub-dimension taxonomy are platform-authored, referenced to
ILPA ESG Data Convergence, UN PRI, SFDR Art.7 and TCFD for unlisted assets.

### 7.3 Calculation walkthrough

`screen_deal`: `_score_dimensions` averages the deal's supplied sub-ratings per dimension
(unassessed → 3.0 neutral); `_composite_score` equal-weights the five; `_risk_band` maps to a
band; `_detect_red_flags` runs the rule set; `sector_overall = round(mean(sector heatmap
row))`; `_recommendation` combines flags + band. `pipeline_summary` aggregates deals by stage
and sector, average deal size and ESG score, red-flag and deal-breaker counts, and a full
sector heatmap.

### 7.4 Worked example

Buyout in **Energy**, no transition plan, sub-ratings supplied: environmental avg 4.5, social
3.0, governance 2.5, transition_risk 4.0, physical_risk 3.5. No hard-flag booleans set.

- **Dimension avgs:** 4.5, 3.0, 2.5, 4.0, 3.5.
- **Composite:** `(4.5+3.0+2.5+4.0+3.5)/5 = 17.5/5 = 3.5` → **HIGH** band (≤4).
- **Red flags:** Energy ∈ high-carbon AND no transition plan → soft `RF_NO_TRANSITION`;
  environmental avg 4.5 > 4.0 → soft `RF_HIGH_ENVIRONMENTAL`. No hard flags.
- **Sector context:** Energy row sums (5+3+3+5+4)=20 → overall `round(20/5)=4`.
- **Recommendation:** no hard flag, HIGH band + soft flags → **proceed_with_conditions**, with
  the transition-plan and env-DD conditions attached.

### 7.5 Data provenance & limitations

- The sector heatmap and red-flag rules are **expert-judgement constants**, not a live ESG
  data feed; there is no `sr()` PRNG.
- Unassessed sub-dimensions default to a **neutral 3.0**, so a lightly-screened deal lands
  mid-band rather than erroring — this can understate risk for genuinely un-diligenced deals.
- Composite scoring is equal-weighted across dimensions (no materiality weighting by sector).
- Persistence (`db/deals`, pipeline summary, sector heatmap) is via `pe_db_service.py`; the
  scoring engine itself is stateless.

**Framework alignment:** **ILPA ESG Data Convergence Initiative** — the five-dimension /
sub-dimension scorecard mirrors ILPA's standardised PE ESG metrics. **UN PRI** — the
red-flag + recommendation flow implements PRI's ESG-integration-in-due-diligence guidance.
**SFDR Art.7** — PAI consideration for PE/VC funds is reflected in the environmental/social
dimensions. **TCFD** — dedicated transition_risk and physical_risk dimensions apply TCFD's
risk taxonomy to unlisted assets. Hard exclusions (weapons, sanctions, UNGC) follow standard
responsible-investment exclusion policy.
