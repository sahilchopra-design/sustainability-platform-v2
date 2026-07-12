# Api::Priips_Kid
**Module ID:** `api::priips_kid` · **Route:** `/api/v1/priips-kid` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/priips-kid/generate-kid` | `generate_kid` | api/v1/routes/priips_kid.py |
| POST | `/api/v1/priips-kid/calculate-scenarios` | `calculate_scenarios` | api/v1/routes/priips_kid.py |
| POST | `/api/v1/priips-kid/esg-inserts` | `esg_inserts` | api/v1/routes/priips_kid.py |
| POST | `/api/v1/priips-kid/generate-kid/batch` | `generate_kid_batch` | api/v1/routes/priips_kid.py |
| GET | `/api/v1/priips-kid/ref/kid-sections` | `ref_kid_sections` | api/v1/routes/priips_kid.py |
| GET | `/api/v1/priips-kid/ref/esg-insert-types` | `ref_esg_insert_types` | api/v1/routes/priips_kid.py |
| GET | `/api/v1/priips-kid/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/priips_kid.py |

### 2.3 Engine `priips_kid_engine` (services/priips_kid_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SRIResult.to_dict` |  |  |
| `PerformanceScenario.to_dict` |  |  |
| `CostSummary.to_dict` |  |  |
| `ESGInsert.to_dict` |  |  |
| `PRIIPSKIDResult.to_dict` |  |  |
| `PRIIPSKIDEngine.generate_kid` | inp | Generate a full PRIIPs KID for a product. Returns PRIIPSKIDResult with SRI, 4 performance scenarios, cost RIY, and ESG inserts. |
| `PRIIPSKIDEngine.assess_sri` | inp | Calculate the Summary Risk Indicator (SRI) per PRIIPs Annex II methodology. SRI = max(market_risk_class, credit_risk_class adjusted). |
| `PRIIPSKIDEngine.calculate_scenarios` | inp | Generate 4 performance scenarios per PRIIPs RTS Annex IV revised methodology. Returns: [stress, unfavourable, moderate, favourable]. |
| `PRIIPSKIDEngine.get_esg_inserts` | sfdr_classification, product_name | Return the ESGInsert list required for the given SFDR classification. Classification values: art_6 / art_8 / art_8_pai / art_8_taxonomy / art_9 |
| `PRIIPSKIDEngine.get_kid_sections` |  |  |
| `PRIIPSKIDEngine.get_sri_classes` |  |  |
| `PRIIPSKIDEngine.get_esg_insert_types` |  |  |
| `PRIIPSKIDEngine.get_cross_framework` |  |  |
| `PRIIPSKIDEngine.get_timeline` |  |  |
| `PRIIPSKIDEngine._calculate_costs` | inp |  |
| `PRIIPSKIDEngine._validate` | inp |  |
| `PRIIPSKIDEngine._build_warnings` | inp, sri |  |
| `PRIIPSKIDEngine._count_complete_sections` | inp, sri, costs |  |

**Engine `priips_kid_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `PERFORMANCE_SCENARIO_NAMES` | `['stress', 'unfavourable', 'moderate', 'favourable']` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `annual` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/priips-kid/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sfdr_overlap', 'eu_taxonomy', 'mifid_spt', 'uk_priips', 'ucits_kiid'], 'n_keys': 5}`

**GET /api/v1/priips-kid/ref/esg-insert-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sustainability_risk', 'pai_consideration', 'art8_esg_characteristics', 'art9_sustainable_investment', 'taxonomy_alignment'], 'n_keys': 5}`

**GET /api/v1/priips-kid/ref/kid-sections** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['section_1_product', 'section_2_risk', 'section_3_costs', 'section_4_holding_period', 'section_5_complaints', 'section_6_other_info'], 'n_keys': 6}`

**GET /api/v1/priips-kid/ref/sri-classes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': [1, 2, 3, 4, 5, 6, 7], 'n_keys': 7}`

**GET /api/v1/priips-kid/ref/timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 6, 'item0_keys': ['date', 'event', 'article']}`

**POST /api/v1/priips-kid/assess-sri** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/priips-kid/calculate-scenarios** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/priips-kid/esg-inserts** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `priips_kid_engine` — extracted transformation lines:**
```python
kid_completeness_pct = (sections_complete / 6.0) * 100.0
final_sri = max(final_sri, credit_risk_class + 1)
expected_ret = inp.expected_annual_return_pct / 100.0
moderate_ann = expected_ret - 0.015
favourable_ann = expected_ret + 0.03
return_rhp_annualised_pct=stress_ann * 100.0,
return_rhp_annualised_pct=unfav_ann * 100.0,
return_rhp_annualised_pct=moderate_ann * 100.0,
return_rhp_annualised_pct=favourable_ann * 100.0,
r = inp.expected_annual_return_pct / 100.0
annuity_factor = (1.0 - math.pow(1.0 + r, -rhp)) / (r * rhp)
riy_pct = total_cost_pct * annuity_factor
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — VaR-equivalent SRI and full RTS scenario methodology (analytics ladder: rung 2 → 3)

**What.** The E15 `PRIIPSKIDEngine` generates EU PRIIPs Key Information Documents per Reg (EU)
1286/2014 as amended by 2021/2268: it computes the Summary Risk Indicator (`SRI = min(7, max(MRC,
CRC, CRC>1 ? CRC+1 : 0))`), four performance scenarios (`10,000 × (1+r_ann)^RHP`), total cost and
Reduction-in-Yield (`RIY = total_cost × annuity_factor`), and a rules-driven ESG-insert selector.
The §7.2 note is candid: the SRI market-risk classes "approximate the PRIIPs Annex II MRM table
(the real RTS uses VaR-equivalent volatility)", and the performance scenarios use a
simple-return model rather than the RTS bootstrap/Cornish-Fisher methodology. Evolution A closes
the methodology gap.

**How.** (1) Replace the volatility-band MRC approximation with the actual RTS VaR-equivalent
volatility calculation (VEV from historical return moments — Cornish-Fisher for non-linear
products), which is what a regulator recomputes. (2) Implement the RTS-prescribed performance
scenarios (stress/unfavourable/moderate/favourable) from the historical-simulation methodology
rather than the current `expected_return ± fixed offsets` (moderate = `r − 1.5%`, favourable =
`r + 3%`). (3) Keep the cost/RIY annuity math (already RTS-correct) and bench-pin all four
computations against a worked KID example. (4) Source return history from the platform's
market-data tables.

**Prerequisites.** Return-history input per product (via `financial_data`); the RTS VEV and
scenario formulas encoded. **Acceptance:** SRI derives from VaR-equivalent volatility matching a
worked RTS example; the four scenarios follow the RTS historical-simulation method, not fixed
offsets; RIY and SRI bench-pinned.

### 9.2 Evolution B — KID-generation copilot with ESG-insert automation (LLM tier 2)

**What.** A copilot that generates a KID and explains it — "your product is SRI 4; the moderate
scenario returns €X over the 5-year RHP; RIY is 1.8%; because it's SFDR Article 8 you need these
ESG inserts" — each figure from a tool call, plus batch generation across a product range.

**How.** Four POST endpoints (`/generate-kid`, `/calculate-scenarios`, `/esg-inserts`,
`/generate-kid/batch`) plus reference GETs (kid-sections, esg-insert-types, cross-framework) that
ground the KID structure and the SFDR/Taxonomy overlap. The ESG-insert selector is a natural
tier-2 action: given the SFDR classification, it returns the exact text blocks the KID must carry.
The cross-framework endpoint links to MiFID SPT and UCITS KIID. Strong node for a product/
compliance desk.

**Prerequisites.** Evolution A's RTS methodology for defensible risk/scenario figures — a copilot
narrating an approximated SRI as regulatory-final would misstate the KID. **Acceptance:** every
SRI, scenario value, and RIY traces to a tool response; ESG inserts match the SFDR classification
via the selector, not the LLM's own judgement; the copilot labels risk/scenario figures as
RTS-approximate until Evolution A, and refuses to assert KID regulatory sign-off.