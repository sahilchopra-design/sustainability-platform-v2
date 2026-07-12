## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** A rigorous backend engine
> (`biodiversity_credit_engine.py`, E88) implements the full DEFRA BNG Metric 4.0
> (distinctiveness × condition × strategic-significance × temporal × proximity ×
> irreplaceability), TNFD LEAP 14-metric scoring, TEEB/SEEA-EA ecosystem valuation,
> GBF Target-15 and a 5-factor credit-quality tier. **The React page does not call
> those methods for its headline numbers** — it computes a *simplified* BNG on the
> client and fills TNFD/ecosystem-service/credit-quality panels with the seeded PRNG
> `seed(s)=frac(sin(s+1)×10⁴)`. The engine is real; the page is a demo. §7 documents
> both, §8 specifies the production wiring.

### 7.1 What the module computes (client side)

The page's on-screen BNG uses a reduced formula, not the engine's:

```js
dist          = HABITAT_DISTINCTIVENESS[habitat]          // 3 (farmland) … 8 (grassland/wetland/coastal)
preC, postC   = condition maps (poor=1 … very_good=4, restored=5)
baselineUnits = area × dist × preC × 0.30
postUnits     = area × dist × postC × 0.28
bngPct        = (postUnits − baselineUnits) / max(baselineUnits, 0.01) × 100
tenPctMet     = bngPct ≥ 10
```

TNFD, ecosystem services, GBF Target-15 and credit-quality panels are all
`seed()`-generated (e.g. TNFD pillar scores `seed(21..31)×25+55`; additionality
`seed(141)×25+60`), then aggregated by real weightings.

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| Distinctiveness | woodland 6, grassland 8, wetland 8, heathland 7, coastal 8, freshwater 7, farmland 3, urban 4 | Client tier map (loosely DEFRA) |
| Baseline/post factors | ×0.30 / ×0.28 | Undocumented client scalars |
| Engine distinctiveness multipliers | high 3.5, medium 2.0, low 1.0, very-low 0.5, degraded 0.1, built 0.0 | DEFRA Metric 4.0 tiers (engine) |
| Engine condition multipliers | poor 0.5, moderate 0.7, good 1.0, excellent 1.3 | DEFRA Metric 4.0 (engine) |
| Engine credit-quality weights | additionality 0.30, permanence-risk 0.25, perm-years 0.15, buffer 0.15, CORSIA 0.15 | Engine `assess_credit_quality` |
| BNG market price | $1,200–18,000/unit (mid used for value) | `NATURE_MARKET_PRICE_BENCHMARKS` |

The page also fetches real reference tables from the API
(`/ref/credit-standards`, `/ref/ecosystem-services`, `/ref/habitat-tiers`,
`/ref/price-benchmarks`), which come from the engine's constant blocks.

### 7.3 Calculation walkthrough — engine (the intended path)

`assess_bng_metric`:
```
pre_units  = area · dist_score · pre_cond_mult · strategic_sig
post_units = area · dist_score · post_cond_mult · strategic_sig · temporal · proximity · irreplace
net_gain_% = (post − pre)/pre × 100 ;  compliant = ≥10%
saleable   = max(0, post − pre×1.10)
value_usd  = saleable × mid(BNG_habitat_unit price)
```
`temporal = min(1, legal_years/30)`, `proximity` steps 1.0/0.95/0.85/0.75 by
distance, `irreplace = 1.25` if flagged. Credit quality blends additionality,
permanence-risk (`100 − Σ risk_factor×100`), permanence-years, reversal buffer
(adequate ≥10%) and CORSIA eligibility into tiers A ≥80, B ≥65, C ≥45, D else.

### 7.4 Worked example (engine BNG)

Grassland, area 10 ha, medium distinctiveness (score 0.545 = mid of 0.4–0.69),
pre `poor`(0.5)→post `good`(1.0), strategic significance 1.15, 30-yr agreement
(temporal 1.0), onsite (proximity 1.0), not irreplaceable:

| Step | Computation | Result |
|---|---|---|
| Pre units | 10 × 0.545 × 0.5 × 1.15 | 3.134 |
| Post units | 10 × 0.545 × 1.0 × 1.15 × 1 × 1 | 6.268 |
| Net gain % | (6.268 − 3.134)/3.134 | **+100%** |
| 10% threshold units | 3.134 × 1.10 | 3.447 |
| Saleable | 6.268 − 3.447 | 2.821 units |
| Value | 2.821 × $9,600 mid | **≈$27,080** |

The same site under the *client* formula (dist 8, pre 1, post 3):
baseline `10×8×1×0.30 = 24`, post `10×8×3×0.28 = 67.2`, bng% `+180%` — a materially
different answer, which is why the wiring in §8 matters.

### 7.5 Data provenance & limitations

- Client BNG uses a **non-DEFRA simplification**; TNFD, ecosystem-service and
  credit-quality figures on the page are **synthetic** (`seed()`), not engine
  outputs. Reference tables (standards, prices, habitat tiers) are real.
- The engine itself is deterministic and does **not** use `random` for scores
  (the `import random` is unused); it returns honest structure from real inputs.
- No connectivity multiplier in the client formula (guide's BDU formula includes
  it); `radialData` connectivity is a `seed()` placeholder.

**Framework alignment:** UK Environment Act 2021 / DEFRA Biodiversity Metric 4.0
(habitat units = area × distinctiveness × condition × strategic significance, with
temporal & spatial risk multipliers and a mandatory 10% net gain — implemented in
the engine, approximated on the page) · TNFD v1.0 LEAP (14 core metrics across 4
pillars; the engine scores them and blends LEAP-stage completion) · Kunming-Montreal
GBF Target 15 (6 sub-targets a–f; engine applies TNFD/CSRD/GRI boosts) · TEEB/SEEA-EA
(12 ecosystem services valued at benefit-transfer $/ha) · ICROA (≥10–20% reversal
buffer; CORSIA eligibility set for Verra/ART/Gold Standard).

## 8 · Model Specification

**Status: specification — not yet implemented in code** (as the *page*'s live model;
much already exists server-side in `biodiversity_credit_engine.py`).

**8.1 Purpose & scope.** Deliver a bankable BNG unit count, saleable-credit estimate
and credit-quality tier for a habitat parcel or purchased credit — for developers
meeting statutory 10% BNG, habitat banks, and TNFD-reporting FIs.

**8.2 Conceptual approach.** Adopt the statutory **DEFRA Metric 4.0** unit algebra
(the authoritative UK method) for BNG and a **weighted multi-criteria quality score**
for voluntary credits, benchmarked against **Verra VM0033/CCB** integrity screening
and **ICVCM Core Carbon Principles**-style durability discounting. Wire the page to
the existing engine rather than the client heuristic.

**8.3 Mathematical specification.**
```
Units = A · D · C · S · T · P · I
  D distinctiveness score, C condition mult, S strategic-sig, T=min(1,yrs/30),
  P proximity step, I irreplaceability
NetGain% = (post−pre)/pre·100 ; Saleable = max(0, post − 1.10·pre)
Quality = 0.30·Add + 0.25·PermRisk + 0.15·PermYr + 0.15·Buffer + 0.15·CORSIA
PermRisk = 100 − Σ_f risk_factor_f·100   (wildfire .15, tenure .18, political .20 …)
Value = Saleable · price_mid(habitat_unit)
```

| Parameter | Source |
|---|---|
| D, C, S multipliers | DEFRA Statutory Biodiversity Metric 4.0 |
| Reversal buffer floor | ICROA / registry rule (≥10%) |
| Risk factors | Engine `_PERMANENCE_RISK_FACTORS` (calibrate to registry reversal data) |
| Unit price | Real habitat-bank transactions / DEFRA credit tariff |

**8.4 Data requirements.** Habitat type & area, pre/post condition survey, legal
agreement term, offsite distance, irreplaceability flag, additionality evidence,
buffer %, risk-factor register, market price feed. All exist as engine inputs; the
page must POST them to `/assess`, `/bng-metric`, `/credit-quality` instead of
seeding.

**8.5 Validation & benchmarking.** Reconcile unit counts against DEFRA's official
metric spreadsheet on canonical test parcels (±0 tolerance — it is deterministic);
quality tiers against Verra/BeZero ratings; prices against DEFRA statutory credit
tariff and habitat-bank comparables.

**8.6 Limitations & model risk.** DEFRA multipliers are policy-fixed but revised
(Metric 4.0→ later versions); strategic significance and condition are surveyor
judgements; permanence risk factors are subjective. Conservative fallback: use
statutory metric verbatim, apply the maximum buffer, and treat voluntary co-benefit
premia as upside only.
