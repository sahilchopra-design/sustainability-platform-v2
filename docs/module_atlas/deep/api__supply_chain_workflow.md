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
