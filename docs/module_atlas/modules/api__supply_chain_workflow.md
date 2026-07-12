# Api::Supply_Chain_Workflow
**Module ID:** `api::supply_chain_workflow` · **Route:** `/api/v1/supply-chain-workflow` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/supply-chain-workflow/assess/batch` | `assess_batch` | api/v1/routes/supply_chain_workflow.py |
| GET | `/api/v1/supply-chain-workflow/ref/esrs-e4-disclosures` | `ref_esrs_e4` | api/v1/routes/supply_chain_workflow.py |
| GET | `/api/v1/supply-chain-workflow/ref/eudr-commodities` | `ref_eudr_commodities` | api/v1/routes/supply_chain_workflow.py |
| GET | `/api/v1/supply-chain-workflow/ref/country-tiers` | `ref_country_tiers` | api/v1/routes/supply_chain_workflow.py |

### 2.3 Engine `supply_chain_workflow_engine` (services/supply_chain_workflow_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SupplyChainWorkflowEngine.assess` | entity_name, suppliers, assessment_date | Run the full supply chain workflow for *entity_name* across *suppliers*. Returns a WorkflowAssessment with per-supplier risk results, aggregate scores, gap list, and regulatory cross-reference table. |
| `SupplyChainWorkflowEngine._assess_supplier` | s |  |
| `SupplyChainWorkflowEngine._eudr_country_tier` | country |  |
| `SupplyChainWorkflowEngine._eudr_traceability_score` | s |  |
| `SupplyChainWorkflowEngine._eudr_risk_score` | r, s | Higher score = higher EUDR non-compliance risk (0–100). |
| `SupplyChainWorkflowEngine._csddd_impacts` | s |  |
| `SupplyChainWorkflowEngine._csddd_dd_score` | s | Higher score = better CSDDD due diligence posture (0–100). |
| `SupplyChainWorkflowEngine._esrs_e4_risk_level` | s |  |
| `SupplyChainWorkflowEngine._esrs_e4_flags` | s | Returns which ESRS E4 disclosures are triggered for this supplier. |
| `SupplyChainWorkflowEngine._combined_risk` | r | Weighted combined risk score (higher = higher non-compliance risk). EUDR 40% + CSDDD (inverted) 40% + ESRS E4 20% |
| `SupplyChainWorkflowEngine._build_gaps` | r, s |  |
| `SupplyChainWorkflowEngine._build_actions` | r, s |  |
| `SupplyChainWorkflowEngine._aggregate` | run_id, entity_name, assessment_date, supplier_results, suppliers |  |

**Engine `supply_chain_workflow_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `_ESRS_E4_DISCLOSURES` | `{'E4-1': 'Transition plan and consideration of biodiversity', 'E4-2': 'Policies related to biodiversity and ecosystems', 'E4-3': 'Actions and resources related to biodiversity and ecosystems', 'E4-4': 'Targets related to biodiversity and ecosystems', 'E4-5': 'Impact metrics related to biodiversity a` |
| `_CSDDD_SC_IMPACTS` | `{'ENV-01': 'Deforestation / forest degradation', 'ENV-02': 'Land conversion / habitat destruction', 'ENV-03': 'Biodiversity loss (species)', 'ENV-04': 'Pollution of soil / groundwater', 'ENV-05': 'Water over-extraction', 'HR-01': 'Forced labour in supply chain', 'HR-02': 'Child labour in supply chai` |
| `_REGULATORY_MAPPING` | `{'EUDR_Art_3': {'obligation': 'No deforestation: commodities must not contribute to deforestation/forest degradation', 'csddd_link': 'CSDDD Art.6 ENV-01/ENV-02', 'esrs_link': 'ESRS E4-7 ecosystems conversion', 'platform_module': 'eudr_engine'}, 'EUDR_Art_9': {'obligation': 'Due diligence: geolocatio` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/supply-chain-workflow/ref/country-tiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['high_risk', 'low_risk', 'standard_risk', 'reference', 'note'], 'n_keys': 5}`

**GET /api/v1/supply-chain-workflow/ref/esrs-e4-disclosures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['disclosure_count', 'disclosures', 'reference'], 'n_keys': 3}`

**GET /api/v1/supply-chain-workflow/ref/eudr-commodities** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['commodity_count', 'commodities', 'reference'], 'n_keys': 3}`

**GET /api/v1/supply-chain-workflow/ref/regulatory-mapping** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['mapping_count', 'regulatory_mapping', 'reference'], 'n_keys': 3}`

**POST /api/v1/supply-chain-workflow/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/supply-chain-workflow/assess/batch** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `supply_chain_workflow_engine` — extracted transformation lines:**
```python
traceability_discount = r.eudr_traceability_score * 0.5
eudr_component = r.eudr_risk_score * eudr_weight
csddd_component = (100.0 - r.csddd_dd_score) * csddd_weight
workflow_score = round(100.0 - avg_risk, 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/supply-chain-workflow` (engine E5, `supply_chain_workflow_engine.py`) orchestrates
**EUDR + CSDDD + ESRS E4** into one supplier-level compliance workflow. For each supplier
(country, commodity, plus boolean control signals) it produces three layer scores, a combined
0–100 risk score, status, gaps and deadline-mapped actions; portfolio aggregation yields a
workflow score and ESRS E4 disclosure-readiness table.

```
EUDR traceability  = 40·geolocation + 30·traceability_system + 20·certification + 10·hs_code
EUDR risk          = 0 if commodity not in Annex I
                   = clamp(base(tier) − 0.5 × traceability, 0, 100)   base: high 70 / standard 40 / low 15
CSDDD DD score     = 30 baseline + 25·code_of_conduct + 20·audit + 15·grievance + 10·traceability
Combined risk      = 0.40·EUDR_risk + 0.40·(100 − CSDDD_DD) + 0.20·E4_risk_points
                     E4 points: high 75 / medium 45 / low 15 / not_assessed 50
Status: compliant ≤ 30 | needs_review | high_risk ≥ 65
Workflow score     = 100 − mean(supplier risk);  compliant ≥ 75 | partial ≥ 45 | non_compliant < 45
```

### 7.2 Parameterisation

| Reference table | Content | Provenance |
|---|---|---|
| `_EUDR_COMMODITIES` | cattle, cocoa, coffee, oil_palm, rubber, soy, wood | EUDR Annex I — exact statutory list |
| `_EUDR_HIGH_RISK_COUNTRIES` | 15 ISO-3: BRA, IDN, MMR, COD, PNG, COG, CMR, BOL, ARG, PRY, GUY, SUR, GIN, GHA, NGA | "EUDR Article 29 — abbreviated": *anticipatory* — the Commission's actual 2025 benchmarking classified only 4 countries high-risk (BY, KP, MM, RU); this list encodes deforestation-hotspot expectations |
| `_EUDR_LOW_RISK_COUNTRIES` | 13 mostly EU/OECD | same anticipatory benchmarking |
| `_ESRS_E4_DISCLOSURES` | E4-1…E4-8 titles | Matches ESRS Delegated Regulation 2023/2772 E4 disclosure requirements |
| `_CSDDD_SC_IMPACTS` | ENV-01…05, HR-01/02/04 | Platform taxonomy of CSDDD Annex adverse-impact categories |
| `_REGULATORY_MAPPING` | 6 cross-reference rows (EUDR Art. 3/9/29, CSDDD Art. 6/8, ESRS E4-4) with links between frameworks and platform modules | Hand-authored crosswalk |

Scoring weights (40/30/20/10 traceability; 30+25+20+15+10 CSDDD; 40/40/20 combination; the 0.5
traceability discount; tier bases 70/40/15; status cut-offs 30/65 and 45/75) are **platform
calibration choices** — the regulations define obligations, not numeric scores.

### 7.3 Calculation walkthrough

1. **EUDR layer**: commodity coverage gates everything (non-Annex-I commodities score 0 EUDR
   risk); country tier from the benchmarking sets the base; traceability evidence discounts up to
   50 points.
2. **CSDDD layer**: adverse impacts are *inferred* from signals — EUDR commodity in high/standard
   tier ⇒ ENV-01/02 (priority if high tier); sensitive area ⇒ ENV-03 (priority); no code of
   conduct ⇒ HR-01/HR-04; no audit programme in high tier ⇒ HR-02 (priority); soy/palm/cattle/
   coffee ⇒ ENV-04 (+ENV-05 in high tier). The DD score starts at 30 ("entity has a policy").
3. **ESRS E4 layer**: biodiversity risk high if sensitive area or high-tier country; medium if
   standard tier + EUDR commodity; per-supplier disclosure flags — E4-2 always true, E4-7 =
   EUDR commodity, E4-5 = impact assessment done, E4-3 = restoration commitments, E4-1 heuristic
   from code-of-conduct, E4-8 = sensitive area; E4-4 and E4-6 are never set true.
4. **Gaps & actions**: article-cited gap strings (e.g. "[EUDR Art.9(1)(a)] No traceability
   system…"); actions carry priority, regulation, hard-coded deadlines (e.g. geolocation
   "critical" by 2025-12-30 — the EUDR large-operator application date), and target module
   (including "TNFD LEAP / BNG Metric 4.0" for biodiversity assessments).
5. **Aggregation**: risk-tier counts, de-duplicated critical/high actions, gap totals, and an
   E4 readiness table counting triggering suppliers per disclosure (`disclosure_required =
   count > 0`). Metadata records whether the standalone `eudr_engine`/`csddd_engine` imports are
   available and notes: "Scores are computed from supplier-provided signals."

### 7.4 Worked example — Brazilian soy supplier with partial controls

Input: BRA, soy, geolocation ✓, traceability system ✗, certification RTRS-like ✓, HS code ✓,
code of conduct ✓, audit ✗, grievance ✗, sensitive area ✗.

| Step | Computation | Result |
|---|---|---|
| Country tier | BRA ∈ high-risk set | high (base 70) |
| Traceability | 40 + 0 + 20 + 10 | 70 |
| EUDR risk | 70 − 0.5×70 | **35.0** |
| CSDDD impacts | ENV-01, ENV-02 (priority), HR-02 (priority, no audit + high tier), ENV-04, ENV-05 | 5 impacts |
| CSDDD DD score | 30 + 25 + 0 + 0 + 0 | 55 |
| E4 risk | high tier → "high" | 75 pts |
| Combined | 0.40×35 + 0.40×(100−55) + 0.20×75 = 14 + 18 + 15 | **47.0 → "needs_review"** |
| Gaps | no traceability system (Art.9(1)(a)); no audit (Art.8(3)); no grievance (Art.9) | 3 |

A single-supplier portfolio then scores 100 − 47 = **53 → "partial"**.

### 7.5 Data provenance & limitations

- **Deterministic, no PRNG** (`uuid4` run id only; header states "The engine is deterministic
  given the same inputs"). All risk derives from caller-supplied boolean signals plus the embedded
  country/commodity reference sets.
- The country benchmarking list **pre-dates and diverges from** the Commission's adopted EUDR
  country classification — production use requires syncing to the official Implementing Act list.
- CSDDD impacts are rule-inferred proxies, not findings; the 30-point DD baseline is granted
  unconditionally. E4-4/E4-6 flags are structurally unreachable, so the readiness table can never
  require those disclosures.
- Action deadlines are hard-coded calendar dates (2025-12-30 … 2026-09-30) that will go stale;
  no supplier-volume or spend weighting is applied anywhere (the `annual_volume_tonnes` and
  `spend_eur` inputs are unused).
- Sub-engine imports (`eudr_engine`, `csddd_engine`) are detected but never invoked — the
  orchestration is self-contained scoring, with the detailed engines linked via
  `_REGULATORY_MAPPING.platform_module` only.

### 7.6 Framework alignment

- **EUDR (Regulation (EU) 2023/1115)** — Art. 3 deforestation-free requirement, Art. 9 due
  diligence (geolocation of every plot, risk assessment, mitigation), Art. 29 country
  benchmarking (high/standard/low determines simplified vs full due diligence). The engine's
  commodity gate, geolocation gap, and tier-based risk base implement this structure; real EUDR
  compliance additionally requires Due Diligence Statements in the EU Information System.
- **CSDDD (Directive (EU) 2024/1760)** — Art. 6 identification of actual/potential adverse
  impacts, Art. 8 prevention (codes of conduct, contractual assurances, audits), Art. 9 (as coded;
  the directive's complaints-procedure article) grievance mechanisms, Art. 22 climate transition
  plan. Encoded as signal-driven impact inference and gap/action rules.
- **ESRS E4 (CSRD Delegated Regulation 2023/2772)** — the 8 biodiversity & ecosystems disclosure
  requirements (transition plan, policies, actions, targets, metrics, and the platform's added
  pollution/conversion/financial-effects framings); readiness = which DRs any supplier triggers.
- **TNFD LEAP & Biodiversity Net Gain Metric 4.0** — named as the recommended assessment
  methodologies in generated actions, bridging to the platform's nature modules.

## 9 · Future Evolution

### 9.1 Evolution A — Evidence-fed supplier signals and geolocation-verified EUDR scoring (analytics ladder: rung 2 → 3)

**What.** The E5 engine orchestrates EUDR + CSDDD + ESRS E4 into one supplier-level workflow: EUDR
traceability (`40·geolocation + 30·system + 20·certification + 10·hs_code`), EUDR risk
(`clamp(base(country_tier) − 0.5·traceability)`, zero if the commodity isn't Annex I), a CSDDD
due-diligence score from boolean controls, and a combined risk
(`0.40·EUDR + 0.40·(100−CSDDD) + 0.20·E4`), rolled to a portfolio workflow score with an ESRS E4
readiness table. It's clean deterministic work whose inputs are all *self-declared booleans*
(geolocation? audit? code of conduct?). Evolution A replaces declarations with platform evidence.

**How.** (1) Verify the geolocation component against actual plot data: the `spatial` module's
`POST /eudr/plot-overlap` (`eudr_geolocation_proofs` table) can confirm a supplier's plots exist
and don't intersect deforestation areas — turning the 40-point geolocation boolean into a verified
check with an evidence tier. (2) Feed deforestation exposure from `nature_data`'s GFW layer per
sourcing country and controversy signals from `gdelt_controversy` into the E4/CSDDD components.
(3) Make the country tiers (high 70 / standard 40 / low 15) track the EU's official EUDR country
benchmarking as it's published, with a provenance date. (4) Bench-pin the three layer scores and
the combined weighting.

**Prerequisites.** `spatial`/EUDR plot data populated; GFW backfill (nature_data's Evolution A);
the official EUDR country benchmarking list. **Acceptance:** geolocation scoring cites plot-overlap
evidence where available; country tiers carry a source and date; combined risk bench-pinned; a
supplier with declared-but-unverifiable geolocation scores visibly lower than a verified one.

### 9.2 Evolution B — Supplier-compliance copilot across EUDR/CSDDD/E4 (LLM tier 2)

**What.** A copilot for procurement/compliance teams: "screen these 40 suppliers — who's high-risk,
why, and what do we do before the EUDR deadline?" (calling `/assess/batch` and narrating the
per-supplier layer decomposition, gaps, and deadline-mapped actions the engine already returns).

**How.** One batch POST plus four reference GETs (ESRS E4 disclosures, EUDR Annex-I commodities,
country tiers, regulatory mapping) that ground every threshold and deadline. The three-layer
decomposition lets the copilot explain *which regulation* drives a supplier's status
(EUDR-traceability gap vs CSDDD control gap vs E4 exposure); the deadline-mapped actions become the
remediation plan. What-ifs ("if this supplier implements geolocation?") re-run statelessly. Node
for a supply-chain desk in the tier-3 orchestrator, chaining GLEIF resolution → this screen →
`sustainable_trade_finance`.

**Prerequisites.** None hard — the engine is honest and reference-complete; evidence-backed
narration needs Evolution A. **Acceptance:** every score, status, and action traces to a batch
response; the copilot names the regulation and reference table behind each gap; it discloses that
control signals are self-declared (pre-Evolution-A) and refuses to assert EUDR legal compliance —
the screen is preparatory, not a due-diligence statement.