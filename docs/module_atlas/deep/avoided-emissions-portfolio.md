## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** The overall shape matches the guide — counterfactual
> avoided emissions with investor attribution — but three specifics diverge: (1) the guide defines
> `Attribution Factor = Investment / Total_capex` (project-finance convention), while the code uses
> the **PCAF listed-equity convention `outstanding / EVIC`**; (2) the guide's "Additionality
> Assessment" tab (financial/regulatory/common-practice tests, ICVCM CCP scoring) **does not exist
> on this page** — additionality logic lives only in the backend engine
> (`avoided_emissions_engine.py`), which this page never calls (no fetch/axios); (3) there is no
> portfolio upload or grid-EF database lookup — all 150 holdings are synthetic. The attribution
> waterfall, methodology comparison and double-count adjustment described below are real code.

### 7.1 What the module computes

For 150 synthetic climate-solution holdings across 15 sectors, the page computes portfolio avoided
emissions, an attribution waterfall, and screening analytics. Holding generation (per holding `i`):

```js
aumWeight      = 0.2 + s4 × 2.8                     // 0.2–3.0 %
emitted        = 800 + s5 × 24,000                  // tCO2e
solutionRevPct = s6 × 0.85                          // 0–85 % climate-solution revenue
avoidedRatio   = 0.05 + solutionRevPct × 1.8 + s7 × 0.3
avoided        = emitted × avoidedRatio             // correlated with solution revenue
net            = emitted − avoided
evic           = 500 + sr(·) × 9,500                // $M
outstanding    = evic × (0.01 + sr(·) × 0.08)       // 1–9 % of EVIC held
attrFactor     = outstanding / evic                 // PCAF attribution
```

Unlike the sibling `avoided-emissions-hub`, **avoided is structurally linked to solution
revenue** (slope 1.8), so pure-play companies show avoided ≫ emitted by construction.

### 7.2 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| Attribution factor | `outstanding / EVIC` (1–9%) | PCAF Standard convention (financed-emissions attribution) |
| Methodology toggle | PCAF = factor as-is; "proprietary" = factor × (0.85 + sr×0.3) | synthetic ±15% method dispersion |
| Double-count haircut | attributable × (0.05 + sr×0.1) → 5–15% | synthetic demo value |
| Sensitivity slider | factor × (1 + sensitivity/100), ±20% grid | UI parameter |
| Credibility tiers | High / Medium-High / Medium / Medium-Low / Low (uniform random) | synthetic |
| Pure-play screen | `solutionRevPct ≥ minSolRev/100` slider; top-20 ranking | screening rubric |
| Quarterly trend | emitted × (0.85–1.15), avoided × (0.7–1.3) noise per quarter | synthetic |
| SDG tags | always 7 & 13; 9/11/15 probabilistic | synthetic |

### 7.3 Calculation walkthrough

1. **Portfolio KPIs** — over the filtered set: Σ emitted, Σ avoided, Σ net,
   `ratio = avoided/emitted` (guarded), and the AUM-weighted mean solution revenue
   `Σ(solutionRevPct × aumWeight) / Σ aumWeight`.
2. **Attribution engine** (`attribution` memo) —

```js
factor        = (userOverride || attrFactor) × (1 + sensitivity/100)
methodFactor  = methodology === 'PCAF' ? factor : factor × (0.85 + sr(id×101)×0.3)
attributable  = avoided × methodFactor
dblCount      = attributable × (0.05 + sr(id×103)×0.1)
netAttributable = Σ attributable − Σ dblCount
```

   rendered as a waterfall: Gross Avoided → −(gross − attributable) attribution loss →
   −double-count adjustment → Net Attributable, with per-sector roll-ups and per-holding
   editable attribution factors.
3. **Methodology comparison** — first 30 holdings, PCAF vs proprietary attributable and delta,
   sorted by |delta|.
4. **Sensitivity strip** — total attributable at −20%…+20% factor adjustments in 5% steps.
5. **Screens** — sector heat cards (ratio > 0.8 green / > 0.4 gold / else red), pure-play screen,
   top-20 pure-plays, exposure by solution category (8 categories, weight-based with a seeded
   cross-category contribution `sr(id×97+ci×11) × (own-cat 0.5 | other 0.12) × weight`).

### 7.4 Worked example — one holding through attribution

Take a holding with `emitted = 12,000 tCO₂e`, `solutionRevPct = 0.50`, `s7 = 0.2`,
`evic = $4,000M`, `outstanding = $200M`, PCAF methodology, sensitivity 0, seeded dblCount draw 0.10:

| Step | Computation | Result |
|---|---|---|
| Avoided ratio | 0.05 + 0.50×1.8 + 0.2×0.3 | 1.01 |
| Avoided | 12,000 × 1.01 | 12,120 tCO₂e |
| Net | 12,000 − 12,120 | −120 t (net positive impact) |
| Attribution factor | 200 / 4,000 | 0.05 |
| Attributable | 12,120 × 0.05 | 606 tCO₂e |
| Double-count haircut | 606 × 0.10 | 60.6 t |
| Net attributable | 606 − 60.6 | **545.4 tCO₂e** |

Under the "proprietary" method with dispersion draw 1.10, attributable becomes
606 × 1.10 = 666.6 t — the method-comparison tab visualises exactly this PCAF-vs-proprietary
spread per holding.

### 7.5 Companion analytics

12-quarter per-holding trends (drill-down panel with EVIC and SDG badges), sector emitted-vs-
avoided chart, benchmark comparison by solution category, and a paginated, sortable holdings table
(15 per page, 7-page windowed pagination).

### 7.6 Data provenance & limitations

- **All 150 holdings are synthetic** (`sr(seed) = frac(sin(seed+1)×10⁴)`); company names are
  generated prefix+suffix combinations. No portfolio upload, no grid-EF database (IEA/eGRID per
  the guide) is consulted.
- The avoided-emissions figure per holding is *assumed* (ratio driven by solution revenue), not
  computed from a baseline-vs-project comparison; the platform's real counterfactual math
  (`max(0, baseline_EF − solution_EF) × quantity × attribution`) sits unused in the backend
  engine for this page.
- The double-count adjustment is a random 5–15% haircut, not an overlap detection between value-
  chain claims.
- The "proprietary methodology" is PCAF ± seeded noise — a placeholder for genuine method variants
  (e.g. revenue-share or physical-causation allocation).
- Additionality, Article 6 and BVCM checks (guide's ICVCM-scored additionality) are backend-only.

### 7.7 Framework alignment

- **PCAF (Global GHG Accounting Standard)** — attribution = investor share of financing:
  `outstanding / EVIC` for listed equity/bonds. The code implements this exactly (including
  user-overridable factors), then extends it by analogy to avoided emissions — a common but
  non-canonical practice sometimes called "financed avoided emissions".
- **WBCSD Avoided Emissions Framework (2023)** — requires a credible reference scenario,
  attribution transparency and separation from inventory accounting; the page's waterfall
  (gross → attributed → double-count-adjusted) mirrors the framework's reporting decomposition
  even though the gross figure is synthetic.
- **GHG Protocol Scope 4 draft (guide reference)** — comparative/consequential accounting; not
  computed here (see §7.6).
- **ICVCM Core Carbon Principles (guide reference)** — the ICVCM derives CCP labels by assessing
  carbon-crediting *programs* (governance, registry, no double counting) and *methodology
  categories* (additionality, baselines, permanence, quantification) against 10 principles; on
  this page "credibility tier" is a uniform-random label, not a CCP assessment.
- **EU Green Bond Standard (guide reference)** — use-of-proceeds impact reporting is the intended
  downstream use of net-attributable figures; no EuGB template is generated in code.
