## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/priips_kid_engine.py` (engine E15, class `PRIIPSKIDEngine`) generates EU PRIIPs
Key Information Documents per Regulation (EU) 1286/2014 as amended by Regulation (EU) 2021/2268
(revised RTS methodology). Four core computations, each exposed via its own route in
`api/v1/routes/priips_kid.py`:

```
SRI        = min(7, max(MRC, CRC, CRC>1 ? CRC+1 : 0))            # assess_sri
Scenario V = 10,000 × (1 + r_ann)^RHP                            # calculate_scenarios (4 paths)
Total cost = entry + exit + ongoing + perf_fee + txn  (all % p.a. or one-off %)
RIY        = total_cost_pct × annuity_factor
             annuity_factor = (1 − (1+r)^−RHP) / (r × RHP)       # _calculate_costs
Completeness = complete_sections / 6 × 100                       # generate_kid
```

plus a rules-driven **ESG insert selector** (`get_esg_inserts`) that returns the SFDR/Taxonomy
text blocks a KID must carry for a given SFDR classification.

### 7.2 Parameterisation

**SRI market-risk classes** (`SRI_MARKET_RISK_CLASSES`) — annualised-volatility bands mapped to
MRC 1–7. These approximate the PRIIPs Annex II MRM table (the real RTS uses VaR-equivalent
volatility; the code uses raw input volatility):

| MRC | Vol range | Description |
|---|---|---|
| 1 | 0 – 0.5% | Very low market risk |
| 2 | 0.5% – 12% | Low market risk |
| 3 | 12% – 20% | Low to medium market risk |
| 4 | 20% – 30% | Medium market risk |
| 5 | 30% – 80% | Medium to high market risk |
| 6 | 80% – 100% | High market risk |
| 7 | ≥ 100% | Highest market risk |

**Credit-risk class:** `investment_grade → 1`, `unrated → 2`, else (sub-investment-grade) `→ 3`.
If CRC > 1 the final SRI is floored at `CRC + 1` ("credit uplift"), then capped at 7.

**Scenario return offsets** (module constants, flagged in-code as "approximate" — synthetic demo
calibration, not the RTS percentile bootstrap):

| SRI | `_STRESS_RETURNS` (ann.) | `_UNFAV_RETURNS` (ann.) |
|---|---|---|
| 1 | −5% | −2% |
| 2 | −8% | −3% |
| 3 | −12% | −5% |
| 4 | −18% | −7% |
| 5 | −22% | −9% |
| 6 | −28% | −10% |
| 7 | −30% | −10% |

Moderate = `expected_annual_return − 1.5pp`; Favourable = `expected + 3pp`. Defaults from the
Pydantic request model: RHP 5y, volatility 0.15, ongoing cost 1.5% p.a., transaction cost 0.1%,
expected return 5%.

**ESG insert rubric** (`ESG_INSERT_TYPES` `required_for` lists):

| Insert | SFDR anchor | Required for |
|---|---|---|
| Sustainability Risk Statement | Art 3 SFDR | all 5 classifications (art6…art9) |
| PAI Consideration Statement | Art 4 SFDR | art8_pai, art9 |
| ESG Characteristics Disclosure | Art 8 SFDR | art8, art8_pai, art8_taxonomy, art9 |
| Sustainable Investment Objective | Art 9 SFDR | art9 only |
| Taxonomy Alignment Disclosure | Art 6 EU Taxonomy | art8_taxonomy, art9 |

### 7.3 Calculation walkthrough

`POST /generate-kid` orchestrates: (1) `assess_sri` bands the input volatility into an MRC,
derives CRC from the credit-quality string, applies the max-plus-uplift rule; (2)
`calculate_scenarios` looks up stress/unfavourable annual returns by final SRI and compounds all
four paths over `RHP` years onto a EUR 10,000 base; (3) `_calculate_costs` sums the five cost
legs and converts to RIY via the annuity factor (note: one-off entry/exit costs are summed with
annual costs, a simplification vs RTS Annex VI amortisation); (4) `get_esg_inserts` filters the
insert registry by the normalised SFDR key and fills `{product_name}` into the text templates;
(5) `_validate` emits gap strings (missing manufacturer/ISIN, Art 9 with taxonomy < 1%, vol ≤ 0,
RHP < 1) and `_build_warnings` flags SRI ≥ 6, ongoing cost > 2.5%, and the
`considers_pais=True but art_6` inconsistency; (6) `_count_complete_sections` scores the six KID
sections (sections 5 and 6 always count as complete — static text) into `kid_completeness_pct`.

### 7.4 Worked example

Product: Art 9 fund, volatility 0.25, investment-grade, RHP 5y, expected return 5%, ongoing
1.5%, transaction 0.1%, no other costs.

| Step | Computation | Result |
|---|---|---|
| MRC | 0.20 ≤ 0.25 < 0.30 → class 4 | 4 |
| CRC | investment_grade | 1 |
| Final SRI | max(4, 1); no uplift (CRC = 1) | **4** ("Medium market risk") |
| Stress path | 10,000 × (1 − 0.18)⁵ | **€3,707.40** |
| Unfavourable | 10,000 × (1 − 0.07)⁵ | **€6,957** |
| Moderate | r = 0.05 − 0.015 = 0.035 → 10,000 × 1.035⁵ | **€11,876.86** |
| Favourable | r = 0.08 → 10,000 × 1.08⁵ | **€14,693.28** |
| Total cost | 0 + 0 + 1.5 + 0 + 0.1 | 1.6% |
| Annuity factor | (1 − 1.05⁻⁵)/(0.05 × 5) = 0.21647/0.25 | 0.86590 |
| RIY | 1.6 × 0.86590 | **1.3854%** |
| ESG inserts | art_9 matches 5 of 5 registry entries | 5 inserts |
| Completeness (no manufacturer) | 5/6 × 100 | 83.33% |

### 7.5 Reference endpoints & regulatory timeline

`GET /ref/kid-sections` returns the 6 mandatory KID sections with their `mandatory_fields`
checklists; `/ref/sri-classes`, `/ref/esg-insert-types`, `/ref/cross-framework` (5 mappings:
SFDR Annex II/III mirroring, Taxonomy % consistency, MiFID II sustainability-preference
screening, UK PRIIPs divergence, UCITS KIID replacement) and `/ref/timeline` (6 dated events,
2014 OJEU publication → 2024 UK FCA divergence) serve static registries. A `/generate-kid/batch`
route loops `generate_kid` over a list.

### 7.6 Data provenance & limitations

- **No seeded PRNG / no synthetic datasets** — the engine is fully deterministic on caller
  inputs; only the reference registries are hard-coded.
- The SRI is a **simplification** of PRIIPs Annex II: real MRM uses Cornish-Fisher VaR-equivalent
  volatility from 5 years of observed returns; here raw input volatility is banded directly, and
  CRM is a 3-value proxy instead of the CQS-based Annex II Table 2 matrix.
- Performance scenarios use fixed per-SRI return offsets, not the RTS Annex IV percentile
  methodology (10th/50th/90th percentiles of a bootstrapped/Cornish-Fisher distribution; stress
  from conditional high-volatility sub-samples).
- RIY sums one-off and recurring costs before annuitising — RTS Annex VI computes RIY as the
  difference between gross and net-of-cost annualised returns.
- `return_1yr_pct` simply restates the annualised return (`ann_ret × 100`), so 1-year and
  RHP-annualised figures are identical by construction.

### 7.7 Framework alignment

- **PRIIPs Regulation (EU) 1286/2014 + (EU) 2021/2268** — the KID's 6-section structure, SRI 1–7
  scale, 4 named scenarios and RIY concept all follow the regulation; the quantitative internals
  are approximations (see §7.6). The real SRI combines a Market Risk Measure (VaR-equivalent
  volatility mapped to 7 classes) and a Credit Risk Measure (credit quality step from external
  ratings, adjusted for tenor) via a lookup matrix — the engine mimics this with max-plus-uplift.
- **SFDR (EU) 2019/2088** — insert registry keys map to Art 3 (sustainability-risk integration),
  Art 4 (PAI), Art 8 (E/S characteristics), Art 9 (sustainable-investment objective).
- **EU Taxonomy (EU) 2020/852** — taxonomy-alignment insert requires the aligned-% plus DNSH
  (Arts 17–18) statement; validation enforces a non-trivial % for Art 9 products.
- **MiFID II sustainability preferences** — cross-framework note only (product screening feed).
- **UK PRIIPs (FCA COBS 13)** — timeline records the 2024 UK divergence (own SRI, no SFDR inserts).
