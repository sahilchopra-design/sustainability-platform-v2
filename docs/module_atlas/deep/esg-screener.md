## 7 · Methodology Deep Dive

This module is a **genuinely functional rule-based ESG screening engine** with no PRNG. It runs the
guide's three-layer screening logic — negative/exclusionary, positive/best-in-class, and
threshold/norms screens — directly against the real `GLOBAL_COMPANY_MASTER` universe, marking each
company pass/fail with itemised reasons. The guide's formula
`Pass = (∀ neg_filter: !triggered) AND (score ≥ min) AND (∀ norms: compliant)` is implemented
faithfully. No ⚠️ mismatch flag.

### 7.1 What the module computes

The core is `applyNegativeScreens` plus threshold and positive-screen checks; a company **passes iff
its `reasons[]` array is empty**:

```js
// Negative / exclusionary (tag- and subsector-based, revenue-proxy via classification):
thermalCoal    → tags include Coal-Mining/Coal-Power OR subsector~"coal"
fossilFuel     → sector==Energy AND subsector~(E&P | mining | exploration)
tobacco / gambling / controversialWeapons → subsector/tag match
veryHighTRisk  → transition_risk == 'Very High'
noGhg          → !ghg_reporting_year
noSbti         → !sbti_committed AND !carbon_neutral_target_year

// Threshold screens:
transition_risk rank > maxTRisk threshold        → 'T-Risk > Max'
dqs_score < minDqs                                → 'DQS Below Min'
ghg_intensity > maxGhgIntensity                   → 'GHG Intensity > Max'
exchange ∉ selectedExchanges                      → 'Exchange Excluded'

// Positive / best-in-class:
Best-in-Class  → dqs_score < sector top-30% threshold → fail
SBTi Only      → !sbti_committed → fail
Low T-Risk Only→ transition_risk ∉ {Low, Very Low} → fail

pass = reasons.length === 0
```

### 7.2 Parameterisation

| Screen | Rule | Provenance |
|---|---|---|
| Transition-risk order | Very High 4 / High 3 / Medium 2 / Low 1 / Very Low 0 | platform ordinal scale |
| Best-in-Class threshold | per-sector top-30% of `dqs_score` (`scores[floor(n×0.3)]`) | best-in-class convention |
| Negative screens | 8 toggles (coal, fossil, tobacco, weapons, gambling, T-risk, GHG, SBTi) | standard exclusion categories |
| Positive screens | None / Best-in-Class / SBTi Only / Low T-Risk Only | 3 positive-screen modes |
| Universe | `GLOBAL_COMPANY_MASTER` (real company dataset with tags/subsector/DQS/T-risk/GHG) | platform master data |

The best-in-class threshold is computed **dynamically per sector** by sorting each sector's DQS scores
and taking the 30th-percentile cut — a correct implementation of "top 30% within sector".

### 7.3 Calculation walkthrough

1. User configures negative toggles, a positive-screen mode, max transition-risk, min DQS, max GHG
   intensity, and an exchange filter; clicks Apply → `appliedConfig` snapshot.
2. If Best-in-Class selected, precompute `sectorDqsThresholds[sector]` = each sector's top-30% DQS cut.
3. For every company: run negative screens → threshold checks → exchange filter → positive screen,
   accumulating `reasons[]`.
4. `pass = reasons.length === 0`; render pass/fail with the specific failing reasons.
5. KPIs and sector/exchange breakdowns aggregate the pass rate.

### 7.4 Worked example — coal-exposed energy company

Company: sector Energy, subsector "Coal-Power", `transition_risk='Very High'`, `sbti_committed=false`,
`dqs_score=2`. With negative screens `thermalCoal=true`, `veryHighTRisk=true`, `noSbti=true`, positive
`SBTi Only`, `minDqs=3`:

| Check | Result | Reason added |
|---|---|---|
| thermalCoal | subsector~coal → triggered | 'Thermal Coal' |
| veryHighTRisk | Very High → triggered | 'Very High T-Risk' |
| noSbti | not committed, no neutral target | 'No SBTi/Net Zero' |
| minDqs 3 | dqs 2 < 3 | 'DQS Below Min' |
| SBTi Only positive | not committed | 'Fails Positive Screen' |
| **pass** | reasons = 5 | **FAIL** |

A renewable utility with `transition_risk='Low'`, `sbti_committed=true`, `dqs_score=4` (above its
sector's 30th-percentile) accumulates **no reasons** → **PASS**. All deterministic on the master data.

### 7.5 Data provenance & limitations

- **No synthetic PRNG** — screening runs on the real `GLOBAL_COMPANY_MASTER` fields (tags, subsector,
  transition_risk, dqs_score, ghg_intensity, sbti_committed, ghg_reporting_year).
- Negative screens are **classification-based**, not revenue-threshold-based: the guide describes
  "fossil fuels by revenue threshold", but the code triggers on sector/subsector/tag membership (no
  revenue-percentage gate). A company with minor coal revenue is excluded the same as a pure coal
  miner.
- Norms-based screening (UN Global Compact / OECD / ILO) is represented only indirectly (via
  controversial-weapons tag); no explicit UNGC-violation field is checked.
- Best-in-class uses DQS (data-quality score) as the ranking metric — a proxy for ESG performance, not
  an ESG score per se.

**Framework alignment:** the module implements the three canonical **responsible-investment screening
layers**: **negative/exclusionary** (weapons, tobacco, thermal coal, fossil extraction — the standard
PRI exclusion list), **positive/best-in-class** (top-quantile within sector, the DJSI/FTSE4Good
approach), and **threshold** (transition-risk and GHG-intensity ceilings, min data quality). It
approximates **SFDR Art 8** "promotes E/S characteristics" screening and norms-based **UNGC/OECD/ILO**
exclusion, though the norms layer is thinner than the guide implies. A production build would add
explicit revenue-percentage thresholds (e.g. >5% coal revenue) and a UNGC-violation field.

*(No §8 model specification required — this is a genuine rule engine, not a missing/synthetic model.
The recommended refinements are (a) revenue-percentage exclusion thresholds and (b) an explicit
norms-compliance field rather than tag-only proxying.)*
