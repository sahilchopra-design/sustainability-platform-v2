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
