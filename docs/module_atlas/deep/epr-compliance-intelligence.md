## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry specifies a weighted **EPR Compliance
> Score** — `Compliance = RC_achieved/RC_target×40 + Collection_achieved/Collection_target×35 +
> Reporting_quality×25` — plus a `Fee_Liability = Σ(Tonnage_j × Rate_j)` model and a
> `Penalty_Exposure = P(non-compliance) × Max_Penalty` model. **None of these three formulas exist in
> code.** Each company's `complianceScore`, `totalFeeM`, `recycledContentPct` and `eprRisk` are direct
> `sr()` PRNG draws, unrelated to the (correct) target values shown in the regulation table. What the
> module *does* deliver is a genuinely accurate **regulatory-landscape reference** (8 jurisdictions,
> real targets/penalties/authorities, real 2024–2030 timeline) wrapped around a synthetic 26-company
> scorecard. The sections below document the code as written; §8 specifies the missing score model.

### 7.1 What the module computes

The only aggregate computations are two portfolio KPIs over the synthetic company table:

```js
highRiskCount = COMPANIES.filter(c => c.eprRisk === 'High').length
avgCompliance = mean(COMPANIES.complianceScore)          // /100, over 26 firms
sortedCompanies = [...COMPANIES].sort((a,b) => b[sortField] - a[sortField])
```

The company records themselves are fabricated:

```js
totalFeeM         = sr(i*13)*80 + 5        // $5–85 M
jurisdictions     = round(sr(i*7)*10 + 3)  // 3–13
complianceScore   = round(sr(i*11)*35 + 55)// 55–90
recycledContentPct= round(sr(i*9)*40 + 10) // 10–50 %
reportingQuality  = pick[Excellent,Good,Adequate,Poor]
eprRisk           = pick[Low,Medium,High]
```

`FEE_TREND` (2018–2026, EU/UK/global $Bn) is a linear trend with `sr()` jitter: e.g.
`eu = 1.2 + i×0.28 + sr(i*11)×0.15`. `COMPLIANCE_RADAR`, `GAP_DATA` and `TIMELINE` are hard-coded
constant tables (no PRNG) that encode real regulatory targets.

### 7.2 Parameterisation — the real regulatory reference

The `EPR_REGULATIONS` table is the module's most valuable, accurate content:

| Jurisdiction | Enforce | Recycled target | Collection | Penalty | Complexity |
|---|---|---|---|---|---|
| EU — PPWR | 2026 | 30–50% | 90% | €75K–200K | 5 |
| UK — UK EPR | 2025 | N/A | 85% | £40K+ | 4 |
| France — REP | Active | 60–90% | 90% | €75K | 5 |
| Germany — VerpackG | Active | 63–90% | 90% | €50K + injunction | 4 |
| USA — CA SB 54 | 2027 | 65% | 65% | $50K/day | 3 |
| Canada — Fed EPR | 2025 | 75% | 75% | $200K | 4 |
| Japan — CPL | Active | 88% | 88% | ¥3M | 3 |
| S. Korea — K-EPR | Active | 82% | 82% | ₩30M | 4 |

These figures are consistent with the named standards (EU PPWR, UK EPR 2023, VerpackG, CA SB 54,
etc.) and the headline KPIs ("$18 Bn global fee revenue 2025", "60+ schemes") match the guide's cited
CEFLEX/EXPRA sources. `GAP_DATA` (e.g. Collection required 90 / achieved 74 / gap 16) is a curated
EU-average gap set.

### 7.3 Calculation walkthrough

1. 26 companies fabricated from `sr(i·k)`; sector labels are hand-assigned (FMCG/Luxury/Apparel/…).
2. KPI bar: `avgCompliance = Σ complianceScore / 26`; `highRiskCount` counts `eprRisk==='High'`.
3. Company tab: sort descending on the chosen field, then optionally filter by `eprRisk`.
4. Gap tab: renders the static `GAP_DATA` required-vs-achieved bars (no per-company roll-up).
5. Fee-trend tab: plots `FEE_TREND` EU/UK/global lines.
6. Timeline & radar tabs: render the constant tables directly.

### 7.4 Worked example (avg compliance KPI)

`avgCompliance = mean(round(sr(i*11)*35+55))` over i=0…25. For i=0, `sr(11)=frac(sin(12)×10⁴)≈0.298`
→ score `round(0.298×35+55)=round(65.4)=65`. Averaging all 26 such draws lands near the midpoint of
the 55–90 band, ≈72, displayed as "72/100". This number is stable across renders (deterministic PRNG)
but carries no information about the real target-vs-achieved gaps in the regulation table beside it —
that is the core mismatch.

### 7.5 Data provenance & limitations

- **Company scorecard is synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`); compliance scores, fees and
  recycled-content % are decoupled from the (correct) regulatory targets shown alongside them.
- **Regulation landscape, gap table, radar, and 2024–2030 timeline are curated real facts** — no
  PRNG — and are the module's genuine value.
- No linkage between a company's `jurisdictions` count and which regulations in the table apply to it;
  no tonnage data, so no real fee-liability or penalty-exposure computation despite the guide's
  formulas.

**Framework alignment:** **EU PPWR 2024** (replaces Packaging Directive 94/62/EC; eco-modulated fees,
mandatory recycled content, Digital Product Passport by 2026 — captured in the table and timeline) ·
**UK EPR 2023** (modulated fees, Environment Agency) · **CA SB 54** (65% source-reduction by 2032,
CalRecycle). The module represents these accurately as a landscape reference but does not *compute*
compliance against them.

### 8 · Model Specification

**Status: specification — not yet implemented in code.** The three quantities the guide names —
compliance score, fee liability, penalty exposure — are all synthetic; the production model follows.

**8.1 Purpose & scope.** For a producer placing packaging/WEEE/battery volumes on N EPR markets,
compute (a) a defensible per-jurisdiction and consolidated compliance score, (b) expected annual EPR
fee liability, and (c) expected penalty exposure — to support regulatory-affairs budgeting and M&A
EPR due diligence.

**8.2 Conceptual approach.** A weighted-attainment score mirroring **eco-modulation** logic used by EU
PROs (Zentrale Stelle, ADEME) and the EXPRA compliance-survey structure, plus a bottom-up
**activity-based fee model** (tonnage × modulated rate) analogous to how PRO fee schedules are
actually assessed, and a **frequency-severity penalty model** (compliance-gap → breach probability ×
statutory max penalty) in the spirit of operational-risk loss modelling.

**8.3 Mathematical specification.**
- Compliance (per jurisdiction j): `C_j = 0.40·min(1,RC_j/RC*_j) + 0.35·min(1,Coll_j/Coll*_j) +
  0.25·Q_j`, where `Q_j∈{Poor .25, Adequate .5, Good .75, Excellent 1.0}`; consolidate by fee-weight:
  `C = Σ_j (fee_j/Σfee)·C_j`.
- Fee liability: `Fee_j = Σ_m T_{j,m} · rate_{j,m} · μ_{j,m}` over materials m, where `μ` is the
  eco-modulation multiplier (recyclability bonus/malus, 0.5–2.0).
- Penalty exposure: `E[Pen_j] = p_j · Pen^{max}_j`, `p_j = σ((C*_target − C_j)/s)` (logistic in the
  compliance shortfall), summed over jurisdictions.

| Parameter | Value / source |
|---|---|
| Weights 0.40/0.35/0.25 | guide rubric (RC / collection / reporting) |
| Targets `RC*, Coll*` | `EPR_REGULATIONS` table (real PPWR/UK/VerpackG/… values) |
| Rates `rate_{j,m}` | PRO fee schedules (Green Dot, CITEO, Valpak) |
| Eco-modulation μ | PPWR Art. 8 / national bonus-malus grids |
| Max penalty `Pen^max` | statutory maxima in `EPR_REGULATIONS.penalty` |
| Logistic scale s | calibrated to observed breach rates (EXPRA survey) |

**8.4 Data requirements.** Per-jurisdiction placed-on-market tonnage by material; PRO fee schedules;
recyclability grades for eco-modulation; achieved recycled-content and collection performance. The
platform already holds the real target/penalty table; tonnage and fee schedules would be new inputs.

**8.5 Validation & benchmarking plan.** Reconcile modelled `Fee_j` against a client's actual PRO
invoices; backtest `p_j` against historical enforcement actions; sensitivity of consolidated `C` to
fee-weighting vs equal-weighting; benchmark against EXPRA/CEFLEX aggregate compliance statistics.

**8.6 Limitations & model risk.** Eco-modulation grids differ sharply by country and change annually;
tonnage self-reporting error dominates fee uncertainty; the logistic penalty link is a modelling
convenience, not a calibrated legal-risk model, and should carry a conservative upper-bound fallback
(`E[Pen]=Pen^max` when `C_j` below a hard floor).
