## 7 · Methodology Deep Dive

An **infrastructure ESG due-diligence** workbench: a fully-editable 20-asset portfolio (persisted to
localStorage) scored on environmental/social/governance sub-scores, IFC Performance Standards (PS1–PS8),
an IFC E&S category (A/B/C), a 40-item DD checklist and blended-finance structure. The dataset is
**hand-authored from real projects** (Rajasthan Solar, North Sea Wind, Nhava Sheva Port, SQM Lithium…)
— no PRNG. The composite ESG and DD-completion arithmetic is genuine, though the guide's transition-risk
sub-score is not implemented. Flagged below.

> ⚠️ **Guide↔code note.** The guide's IERR formula weights in a **transition-risk sub-score**
> (`IERR = w_E·Env + w_S·Soc + w_G·Gov + w_Transition·TransitionRisk`, with stranded-asset probability
> vs IEA NZE). The code's composite is a **plain equal-weight mean of the three ESG scores**
> (`(env+soc+gov)/3`) — there is no transition-risk term, no stranded-asset probability, no IEA-NZE
> pathway comparison. Env/soc/gov scores are entered per asset, not derived from GIIA criteria.

### 7.1 What the module computes

**Composite ESG** — equal-weight mean:

```js
composite_esg = round((environmental_score + social_score + governance_score) / 3)
```

**IFC PS radar** — portfolio-average of each of the 8 Performance Standards:

```js
avgPS[psk] = Σ_assets a.ifc_ps[psk] / assets.length          // k = 1..8
```

**DD completion** — share of the 40 checklist items marked true:

```js
ddPct = ddTotalAll.total>0 ? ddTotalAll.done/ddTotalAll.total*100 : 0
// per-pillar: envDone/envTotal, socDone/socTotal, govDone/govTotal
```

**Blended-finance balance** and **remediation-cost heuristic**:

```js
total_bf = Σ blended_finance percentages         (should sum to 100)
remedCost = gap>30 ? $(gap·50)K : gap>10 ? $(gap·30)K : $(gap·15)K   // gap = 100 − PS avg
```

### 7.2 Parameterisation — the asset schema (real data)

| Field group | Content | Provenance |
|---|---|---|
| `DD_ITEMS` | 15 env + 15 social + 10 gov DD items | Standard infra ESDD checklist (EIA, resettlement, anti-corruption…) |
| `ifc_ps` | PS1–PS8 scores 0–100 | **Real IFC Performance Standards** framework |
| `ep_category` | A / B / C | **IFC E&S risk category** (A = high, C = low) |
| `sdg_alignment` | SDG list per asset | Curated |
| `blended_finance` | equity/commercial/DFI/concessional % | Curated capital stack |
| 20 assets | capacity, capex, emissions, avoided emissions, scores | Hand-authored from real projects |

Assets are real and internally consistent — e.g. SQM Lithium (Chile): category A, env 42, PS6 (biodiv)
45, "Atacameño community water rights"; Rajasthan Solar: category B, env 85, 680 000 tCO₂e avoided.

### 7.3 Calculation walkthrough

`data` initialises from localStorage or `DEFAULT_INFRA_PORTFOLIO`; `updateAsset`/`addAsset`/`deleteAsset`
mutate and persist. `avgESG`, `totalInvestment`, `totalAvoided`, `totalJobs`, `avgCommunity` reduce the
portfolio. `ddHeatmap` computes per-asset env/soc/gov DD completion %; `avgPS` averages each PS across
assets for the radar. `investByType`/`typeDistrib` group by asset type. New assets get
`composite_esg = round((env+soc+gov)/3)` on add.

### 7.4 Worked example (Rajasthan Solar Park, INF-01)

| Step | Computation | Result |
|---|---|---|
| composite_esg | (85 + 68 + 72)/3 | **75** |
| Env DD completion | 12 of 15 items true | **80%** |
| Social DD completion | 12 of 15 true | **80%** |
| Gov DD completion | 9 of 10 true | **90%** |
| IFC category | B | significant-but-manageable impacts |
| PS6 gap remediation | gap = 100−78 = 22 → $(22·30)K | **$660K** est. remediation |

### 7.5 Data provenance & limitations

- **Data is real and editable** — 20 curated projects, user can add/edit/delete with localStorage
  persistence. **No `sr()` PRNG.** IFC PS and E&S category frameworks are real.
- The **composite ESG is an equal-weight mean**, not the guide's transition-risk-weighted IERR — no
  stranded-asset probability, no IEA-NZE comparison. Env/soc/gov scores are analyst inputs, not derived.
- The remediation-cost heuristic (`gap × $15–50K`) is a rule-of-thumb, not a costed gap analysis.

## 8 · Model Specification — Infrastructure ESG Risk Rating with transition sub-score (IERR)

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce a transition-aware infrastructure ESG rating so long-duration assets (30–50 yr concessions) are
scored on stranded-asset risk, not just static E/S/G — supporting pre-financial-close IC decisions and
ESG covenant structuring.

### 8.2 Conceptual approach
Weighted composite with an explicit transition-risk sub-score, mirroring **EDHECinfra**'s infrastructure
ESG methodology and **GIIA** framework, with the transition term derived from carbon intensity vs the
**IEA NZE** sector pathway (stranded-asset probability à la Carbon Tracker).

### 8.3 Mathematical specification
```
IERR = w_E·Env + w_S·Soc + w_G·Gov + w_T·(100 − TransitionRisk)
TransitionRisk = 100 · P(stranded)
P(stranded) = Φ( (CI_asset − CI_NZE_pathway(t)) / σ_sector )        (probit on intensity gap)
Env/Soc/Gov = Σ_criteria GIIA_subscore · criterion_weight
w = (0.30, 0.20, 0.20, 0.30)   (transition-heavy for energy infra; w_T→0.1 for social infra)
```

| Parameter | Source |
|---|---|
| `CI_asset` | Asset carbon intensity (tCO₂/output) — in schema |
| `CI_NZE_pathway(t)` | IEA NZE sector decarbonisation trajectory |
| `σ_sector` | Sector intensity dispersion | EDHECinfra / Trucost |
| GIIA sub-scores | GIIA ESG criteria | GIIA framework |
| `w_T` | Transition weight by asset type | Calibrated to EDHECinfra |

### 8.4 Data requirements
Asset carbon intensity + output (in schema), IEA NZE sector pathways (needs ingestion), GIIA criterion
scores (partially the env/soc/gov inputs), sector intensity dispersion. Avoided-emissions and Scope 1/2
already captured per asset.

### 8.5 Validation & benchmarking plan
Reconcile IERR ranking against EDHECinfra published infra-ESG scores; validate that fossil assets (LNG,
WtE incineration) score low transition and renewables high; sensitivity to `w_T` and NZE-pathway vintage.

### 8.6 Limitations & model risk
Stranded-asset probability is scenario-dependent — present under multiple NGFS/IEA scenarios, not one.
Social infra (water, telecom) has low transition risk but high social risk; do not let a low `w_T` mask
category-A social impacts — retain a category-A override that floors the rating.

**Framework alignment:** GIIA *Global ESG Reporting Framework* · EDHECinfra *Infrastructure ESG Scores* ·
IFC *Performance Standards* (PS1–PS8, the module's real radar) and E&S categorisation (A/B/C) · IEA NZE
(transition pathway). The code implements the IFC PS scoring and DD checklist faithfully on real data;
the transition-weighted IERR the guide names remains a specification.
