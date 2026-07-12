# Api::Trade_Finance_Esg
**Module ID:** `api::trade_finance_esg` · **Route:** `/api/v1/trade-finance-esg` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/trade-finance-esg/equator-principles` | `post_equator_principles` | api/v1/routes/trade_finance_esg.py |
| POST | `/api/v1/trade-finance-esg/eca-standards` | `post_eca_standards` | api/v1/routes/trade_finance_esg.py |
| POST | `/api/v1/trade-finance-esg/supply-chain-esg` | `post_supply_chain_esg` | api/v1/routes/trade_finance_esg.py |
| POST | `/api/v1/trade-finance-esg/green-instrument` | `post_green_instrument` | api/v1/routes/trade_finance_esg.py |
| GET | `/api/v1/trade-finance-esg/ref/ep4-categories` | `get_ep4_categories` | api/v1/routes/trade_finance_esg.py |
| GET | `/api/v1/trade-finance-esg/ref/oecd-arrangement` | `get_oecd_arrangement` | api/v1/routes/trade_finance_esg.py |
| GET | `/api/v1/trade-finance-esg/ref/esg-tiers` | `get_esg_tiers` | api/v1/routes/trade_finance_esg.py |
| GET | `/api/v1/trade-finance-esg/ref/emission-factors` | `get_emission_factors` | api/v1/routes/trade_finance_esg.py |
| GET | `/api/v1/trade-finance-esg/ref/green-instruments` | `get_green_instruments` | api/v1/routes/trade_finance_esg.py |

### 2.3 Engine `trade_finance_engine` (services/trade_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | v, lo, hi |  |
| `_assign_ep_category` | project_type, country, project_cost_usd | Assign EP category A/B/C based on project characteristics. Deterministic rule set. For medium-risk projects that could fall in either A or B, the precautionary category "A" is assigned (never a random draw) so the higher assurance regime governs until finer characterisation is provided. |
| `_esg_tier_from_score` | score |  |
| `_discount_bps_from_score` | score, tier | Locate the dynamic-discounting margin within the tier's reference band. Deterministic linear interpolation: a supplier at the top of its ESG band receives the lower (better) discount bps, at the bottom the higher bps. Both the band and the interpolation are documented reference-data policy — no random component. |
| `assess_equator_principles` | entity_id, project_type, project_cost_usd, country, sector, principle_assessments, grievance_data | Assess Equator Principles v4 compliance. Returns EP categorisation (A/B/C), 10 principle scores, ESIA requirements, IESC requirement, grievance mechanism, and IFC Performance Standard applicability. Optional inputs (backward-compatible; default ``None``): - ``principle_assessments``: mapping of EP id (``"EP1"``..``"EP10"``) to a real 0-100 compliance score. Only supplied principles are scored; the |
| `evaluate_eca_standards` | entity_id, export_credit_type, oecd_sector, country, climate_compatibility_score | Evaluate ECA standards under OECD Arrangement on export credits. Returns sector understanding thresholds, coal exclusion assessment, OECD CRC country risk classification, and premium calculation. Optional inputs (backward-compatible; default ``None``): - ``country``: host/buyer country used to look up the real OECD CRC (``OECD_COUNTRY_RISK``) that drives the CRC premium adjustment. When absent, CR |
| `score_supply_chain_esg` | entity_id, suppliers, product_category | Score supplier ESG tiers and model dynamic discounting ratchet. Returns supplier ESG tier (A-E), dynamic discounting margin (0-300bps), Scope 3 Cat 1 attribution per supplier, reverse factoring eligibility, and ILO labour standards compliance. Each supplier dict may carry (all optional; missing → honest null): - ``supplier_id``, ``supplier_name``, ``country`` - ``annual_spend_usd``, ``revenue_usd` |
| `calculate_trade_flow_emissions` | entity_id, trade_lanes, commodity_type, volume_tonnes, grid_intensity_factors | Calculate GHG emissions for trade flows. Returns Scope 3 Cat 4 (upstream transport) + Cat 1 (purchased goods), emission factors per transport mode, lifecycle GHG intensity. ``trade_lanes`` items: ``from_country``, ``to_country``, ``transport_mode``, ``distance_km``, ``volume_pct``. When empty, an explicit empty result with a note is returned — no synthetic lanes are fabricated. Optional ``grid_int |
| `generate_green_instrument` | entity_id, instrument_type, use_of_proceeds, counterparty_country, stf_principle_scores, esg_performance_score | Generate green trade finance instrument assessment. Returns green LC/SBLC/trade loan criteria, ICC STF Principles alignment, ICMA Green Bond linkage, documentation requirements, pricing benefit. Optional inputs (backward-compatible; default ``None``): - ``stf_principle_scores``: mapping of ICC STF principle id (``"P1"``..``"P8"``) to a real 0-100 score. The weighted STF score is computed over the  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `Jan` *(shared)*, `__future__` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/trade-finance-esg/ref/emission-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['transport_emission_factors', 'product_ghg_intensity_kgco2e_per_tonne', 'scope3_categories', 'standard'], 'n_keys': 4}`

**GET /api/v1/trade-finance-esg/ref/ep4-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ep4_categories', 'ep4_principles', 'high_risk_country_count', 'note'], 'n_keys': 4}`

**GET /api/v1/trade-finance-esg/ref/esg-tiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['esg_tiers', 'icc_stf_principles', 'ilo_core_standards'], 'n_keys': 3}`

**GET /api/v1/trade-finance-esg/ref/green-instruments** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['green_instruments', 'icc_stf_principles_2022', 'icma_categories'], 'n_keys': 3}`

**GET /api/v1/trade-finance-esg/ref/oecd-arrangement** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['oecd_arrangement_sectors', 'version', 'climate_key_events', 'crc_scale'], 'n_keys': 4}`

**POST /api/v1/trade-finance-esg/eca-standards** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/trade-finance-esg/equator-principles** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/trade-finance-esg/green-instrument** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `trade_finance_engine` — extracted transformation lines:**
```python
span = hi_score - lo_score
pos = 0.0 if span <= 0 else _clamp((hi_score - score) / span, 0.0, 1.0)
crc_premium_adj = round(crc_country * 0.05, 3)
total_premium_pct = round(base_premium_pct + crc_premium_adj, 3)
annual_cost_per_100m = round(total_premium_pct * 1_000_000, 0)
proxy_volume_tonnes = spend / max(product_ghg * 0.5, 1.0)
total_scope3_cat1 = None  # portfolio total is incomplete if any supplier lacks spend/revenue
cat1_tco2e = lane_volume * product_ghg * grid_intensity_factor / 1000.0
pricing_benefit_bps = round(bps_lo + (perf / 100.0) * (bps_hi - bps_lo), 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/trade_finance_engine.py` (a second, complementary E75 engine — distinct from `sustainable_trade_finance_engine.py`) powers `/api/v1/trade-finance-esg` with three POST assessments plus five `ref/*` endpoints serving its reference tables (emission factors, EP4 categories, ESG tiers, green instruments, OECD Arrangement sectors):

| Function | Endpoint | Output |
|---|---|---|
| `assess_equator_principles` | `POST /equator-principles` | EP category A/B/C, weighted 10-principle EP4 score, ESIA regime, IESC/consultation flags, grievance status, OECD CRC |
| `evaluate_eca_standards` | `POST /eca-standards` | OECD sector understanding, coal exclusion, CRC premium calculation, Paris-alignment flag |
| `generate_green_instrument` | `POST /green-instrument` | Green LC/SBLC/SLL/SSCF eligibility, ICC STF (2022, 8 principles) weighted score, ICMA classification, pricing benefit in bps |
| `score_supply_chain_esg` | (engine) | Supplier ESG tier A–E, dynamic discounting bps, Scope 3 Cat 1 attribution, ILO compliance |
| `calculate_trade_flow_emissions` | (engine) | Scope 3 Cat 4 transport + Cat 1 purchased-goods emissions per trade lane, mode-shift optimisation |

The module header carries an explicit **"Data-integrity note (2026-07 remediation)"**: every metric is either a deterministic computation from caller inputs or an honest null — "No metric is drawn from a random number generator."

### 7.2 Parameterisation / scoring rubric

**EP4 principle weights** (engine-authored; EP itself is unweighted): EP1 0.12, EP2 0.14, EP3 0.12, EP4 0.10, EP5 0.10, EP6 0.08, EP7 0.10, EP8 0.08, EP9 0.08, EP10 0.08. Categorisation is precautionary: high-risk project types (mining, dam, oil_gas…) or the 12 hard-coded high-risk countries → A; medium-risk types **or cost ≥ $50M → A as well** (comment: "the more conservative category governs"); cost ≥ $10M → B; else C.

**OECD Arrangement sectors** (`OECD_ARRANGEMENT_SECTORS`): coal_power = full exclusion since 2022-01-01 (matching the actual 2021 OECD agreement ending unabated-coal export credits); renewables max 18-yr repayment / 0.15% min premium (per the 2023 Arrangement revision extending climate-friendly terms); nuclear 18 yr / 0.20%; infrastructure 15 yr / 0.25%; manufacturing 10 yr / 0.30%; ships & aircraft 12 yr / 0.22% (sector understandings). CRC premium adjustment `= CRC × 0.05%` (model constant).

**ESG tiers** (`ESG_TIERS`): A 85–100 → 0–25 bps discount, B 70–85 → 25–50, C 55–70 → 50–75, D 35–55 → 75–150 (not reverse-factoring eligible), E 0–35 → 150–300 bps + exclusion review. Discount within band by linear interpolation — top of band gets the cheaper bps.

**Physical constants:** transport emission factors (kgCO₂e/t-km): air 0.602, sea 0.016, road HGV 0.108, LGV 0.158, rail 0.028, inland waterway 0.031 — consistent with GLEC/DEFRA-order magnitudes. Product lifecycle intensities (kgCO₂e/t): steel 1,800; cement 850; aluminium 11,500; electronics 28,000; etc.

**Green instruments:** pricing-benefit reference bands — green LC 5–25 bps, green SBLC 5–20, sustainability-linked trade loan 10–50, sustainable SCF 15–75; point estimate `= lo + perf/100 × (hi − lo)` only when an ESG performance score is supplied. ICC STF **2022** principle set here is 8 principles (P1 Governance … P8 Capacity Building) with weights 0.15/0.15/0.12/0.12/0.12/0.10/0.12/0.12 — note the sibling engine models the 2019 4-principle set.

### 7.3 Calculation walkthrough

EP assessment: category from deterministic rules; principle scores only from `principle_assessments`, weighted mean renormalised over supplied weight mass; ≥70 compliant / ≥55 partial / else non-compliant; missing inputs produce `insufficient_data` plus an explanatory `notes` entry. ECA: sector lookup → base premium; CRC lookup (30-country table) → `total_premium_pct = base + CRC×0.05`; `annual_cost_per_100m = total_premium_pct × 1,000,000`. Trade-flow emissions per lane: `Cat4 = volume × distance_km × EF / 1000`; `Cat1 = volume × product_intensity × grid_factor / 1000` (grid factor defaults to neutral 1.0, flagged per lane); optimisation compares against the best mode (sea freight) at average distance.

### 7.4 Worked example — ECA premium (route defaults + India)

Renewable-energy export credit, country = India:

| Step | Computation | Result |
|---|---|---|
| Sector data | renewable_energy → PREFERRED, 18 yr, min premium 0.15% | — |
| OECD CRC | `OECD_COUNTRY_RISK["India"]` | 3 |
| CRC adjustment | 3 × 0.05 | 0.15% |
| Total premium | 0.15 + 0.15 | **0.30%** |
| Annual cost per $100M | 0.003 × $100M (`0.30 × 1,000,000`) | **$300,000** |
| Paris aligned | PREFERRED and not excluded | **true** |

Trade-flow check: 10,000 t of steel, one sea lane of 8,000 km (100% volume): Cat 4 = 10,000 × 8,000 × 0.016 / 1000 = **1,280 tCO₂e**; Cat 1 = 10,000 × 1,800 × 1.0 / 1000 = **18,000 tCO₂e**; combined intensity = 19,280/10,000 = **1.928 tCO₂e/t**. Since sea freight is already the minimum-EF mode, reduction potential = 0%.

### 7.5 Data provenance & limitations

- **No PRNG.** The 2026-07 remediation note documents the honest-null contract; ambiguous EP categorisations resolve to the precautionary "A", never a random draw.
- OECD CRC table covers only 30 named countries (full-name keys, e.g. "Germany" — the sibling engine uses ISO-2 codes; the two tables are not interchangeable) and is a static snapshot of the quarterly OECD classification.
- Model constants without external citation: EP/STF principle weights, CRC×0.05% premium coefficient, ESG-tier bps bands, pricing-benefit bands. Transport EFs and product intensities are literature-order values but carry no per-value source comment.
- Scope 3 Cat 1 supplier attribution uses a proxy volume (`spend / (product_ghg × 0.5)`) — a spend-based estimate, i.e. PCAF's lowest data-quality method, not activity data.
- Premium formula is a simplification of the OECD's actual MPR (minimum premium rate) model, which depends on tenor, cover, and buyer category, not just CRC.

### 7.6 Framework alignment

- **Equator Principles IV (2020)** — A/B/C impact categorisation, ESIA/IESC/consultation regime per category, 10-principle checklist. The engine adds numeric weights and a 70/55 status rubric of its own.
- **OECD Arrangement on Officially Supported Export Credits (2023 revision)** — coal full exclusion (per the 2021 coal-fired power agreement), extended repayment terms for climate-friendly sectors, ship/aircraft sector understandings, and CRC 0–7 country classification (which in the real Arrangement feeds MPRs).
- **ICC Sustainable Trade Finance Principles (2022)** — 8-principle weighted alignment score from caller assessments.
- **ICMA Green Bond Principles** — use-of-proceeds eligibility test against 7 green categories drives the Green / Sustainability-Linked / Not Eligible classification, mirroring GBP's use-of-proceeds vs the SLB principles' KPI-linked structure.
- **GHG Protocol Corporate Value Chain (Scope 3) Standard + ISO 14083:2023** — Cat 4 transport emissions as volume × distance × modal EF is exactly the ISO 14083 tonne-km method; Cat 1 as lifecycle intensity × volume.
- **ILO Core Labour Standards / PCAF Part C** — 4-flag ILO compliance check; attribution-ratio emissions allocation is PCAF-style (spend/revenue capped at 1).

## 9 · Future Evolution

### 9.1 Evolution A — Consolidate the twin E75 engines and ground trade-lane emissions (analytics ladder: rung 2 → 3)

**What.** `trade_finance_engine.py` is a second, complementary E75 engine (distinct from
`sustainable_trade_finance_engine.py`) behind `/api/v1/trade-finance-esg`: EP4 categorisation with
OECD CRC premium (`crc × 0.05`), ECA standards with coal exclusion, green-instrument eligibility
(ICC STF 2022 8-principle score, pricing benefit interpolated in bps), supplier ESG tiers A–E with
dynamic discounting, and trade-flow emissions (Scope 3 Cat 1/Cat 4 per lane from embedded transport
emission factors). It shows good honesty (`total_scope3_cat1 = None` when any supplier lacks
spend data) but overlaps heavily with its sibling — two EP4 scorers, two ECA classifiers — and the
Cat 1 proxy (`spend / (product_ghg × 0.5)`) is coarse. Evolution A consolidates and calibrates.

**How.** (1) Reconcile the twin engines: one EP4 categoriser and one ECA classifier shared by both
routes (or an explicit division of labour documented in both), so the platform can't give two EP4
categories for one project. (2) Ground trade-lane volumes and modes from the UN Comtrade module
(`un_comtrade` proxies real flows) instead of caller-typed lane data, with provenance. (3) Replace
the `× 0.5` spend-to-volume proxy with EEIO or product-price-based conversion, keeping the honest
null for incomplete portfolios. (4) Bench-pin the EP4 score, CRC premium, and lane emissions.

**Prerequisites.** A consolidation decision with `sustainable_trade_finance`; Comtrade linkage
(that module's trade-flow endpoint currently fails); EEIO/price factors. **Acceptance:** identical
project inputs to both routes yield one EP4 category; lane emissions cite a flow-data source or the
caller-input label; the Cat 1 proxy carries documented conversion provenance; bench pins pass.

### 9.2 Evolution B — Trade-lane emissions and instrument-eligibility copilot (LLM tier 2)

**What.** A copilot for trade-finance and procurement teams: "what are the Scope 3 emissions of
this Shanghai–Rotterdam lane by sea vs air, and does the financing qualify as a green LC?" —
calling the trade-flow and green-instrument endpoints and narrating the mode-shift deltas, ICC STF
score, and pricing benefit in bps, each figure tool-sourced.

**How.** Four POST assessments plus five `ref/*` registries (transport emission factors with their
standard, EP4 categories/principles, ESG tiers with ICC STF and ILO standards, green instruments,
OECD Arrangement sectors) — every constant citable. Mode-shift what-ifs ("rail instead of air")
re-run statelessly and produce the decarbonisation-vs-cost narrative; the supplier-tier output
drives dynamic-discounting proposals. Pairs with `sustainable_trade_finance` (until consolidation)
and `supply_chain_workflow` on a trade desk.

**Prerequisites.** None hard — the engine is deterministic with honest nulls; consolidation
(Evolution A) before the copilot spans both trade-finance modules, to avoid contradictory EP4
narrations. **Acceptance:** every emissions, score, and bps figure traces to a tool response;
incomplete-portfolio Scope 3 totals are reported as the engine's honest null, never summed around;
the copilot cites the emission-factor standard per lane and refuses to assert green-label
certification (an external review).