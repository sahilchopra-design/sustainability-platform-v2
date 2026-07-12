# Api::Carbon_Markets_Intel
**Module ID:** `api::carbon_markets_intel` · **Route:** `/api/v1/carbon-markets-intel` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/carbon-markets-intel/vcmi-claim` | `vcmi_claim` | api/v1/routes/carbon_markets_intel.py |
| POST | `/api/v1/carbon-markets-intel/icvcm-ccp` | `icvcm_ccp` | api/v1/routes/carbon_markets_intel.py |
| POST | `/api/v1/carbon-markets-intel/corsia-check` | `corsia_check` | api/v1/routes/carbon_markets_intel.py |
| POST | `/api/v1/carbon-markets-intel/article6` | `article6` | api/v1/routes/carbon_markets_intel.py |
| POST | `/api/v1/carbon-markets-intel/credit-pricing` | `credit_pricing` | api/v1/routes/carbon_markets_intel.py |
| POST | `/api/v1/carbon-markets-intel/portfolio-analysis` | `portfolio_analysis` | api/v1/routes/carbon_markets_intel.py |
| POST | `/api/v1/carbon-markets-intel/full-assessment` | `full_assessment` | api/v1/routes/carbon_markets_intel.py |
| GET | `/api/v1/carbon-markets-intel/ref/vcmi-criteria` | `ref_vcmi_criteria` | api/v1/routes/carbon_markets_intel.py |
| GET | `/api/v1/carbon-markets-intel/ref/icvcm-ccps` | `ref_icvcm_ccps` | api/v1/routes/carbon_markets_intel.py |
| GET | `/api/v1/carbon-markets-intel/ref/corsia-schemes` | `ref_corsia_schemes` | api/v1/routes/carbon_markets_intel.py |
| GET | `/api/v1/carbon-markets-intel/ref/price-benchmarks` | `ref_price_benchmarks` | api/v1/routes/carbon_markets_intel.py |

### 2.3 Engine `carbon_markets_intel_engine` (services/carbon_markets_intel_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CarbonMarketsIntelEngine.screen_vcmi_claim` | entity_id, abatement_pct, sbti_status, scope_coverage, mitigation_contribution_pct |  |
| `CarbonMarketsIntelEngine.assess_icvcm_ccps` | entity_id, credit_portfolio |  |
| `CarbonMarketsIntelEngine.check_corsia_eligibility` | entity_id, credit_records |  |
| `CarbonMarketsIntelEngine.assess_article6` | entity_id, credit_records, host_country |  |
| `CarbonMarketsIntelEngine.price_credits` | entity_id, project_type, vintage_year, icvcm_pass, co_benefits, registry, additionality_premium_rate |  |
| `CarbonMarketsIntelEngine.analyse_portfolio` | entity_id, credit_portfolio |  |
| `CarbonMarketsIntelEngine.generate_full_assessment` | entity_id, portfolio_data |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/carbon-markets-intel/ref/corsia-schemes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/carbon-markets-intel/ref/icvcm-ccps** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/carbon-markets-intel/ref/price-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/carbon-markets-intel/ref/vcmi-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**POST /api/v1/carbon-markets-intel/article6** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/carbon-markets-intel/corsia-check** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/carbon-markets-intel/credit-pricing** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/carbon-markets-intel/full-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `carbon_markets_intel_engine` — extracted transformation lines:**
```python
pass_rate = pass_votes / max(len(credit_portfolio), 1)
score = round(pass_rate * 100, 1)
overall_pass_rate = round(passing_credits / max(total_credits, 1) * 100, 1)
total_volume = eligible_volume + ineligible_volume
eligible_pct = round(eligible_volume / max(total_volume, 1) * 100, 1)
itmo_volume = art62_volume + art64_volume
vintage_age = current_year - vintage_year
vintage_discount = round(min(0.40, vintage_age * 0.025), 3)
price_after_vintage = base_price * (1 - vintage_discount)
additionality_premium = round(base_price * premium_rate, 2)
total_price = round((price_after_vintage + additionality_premium + co_benefit_premium) * registry_adj, 2)
avg_price = round(total_value / max(total_volume, 1), 2)
d[k] = round(d[k] / max(total_volume, 1) * 100, 1)
vintage_dist[k] = round(vintage_dist[k] / max(total_volume, 1) * 100, 1)
quality_dist[k] = round(quality_dist[k] / max(total_volume, 1) * 100, 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

Grounded in `backend/services/carbon_markets_intel_engine.py` (E46; routes:
`api/v1/routes/carbon_markets_intel.py`). A voluntary-carbon-market intelligence engine: VCMI
Claims Code tiering, ICVCM 10-CCP portfolio assessment, CORSIA Phase 2 eligibility, Article 6
ITMO classification, a credit fair-value model, and portfolio analytics.

### 7.1 What the domain computes

| Function | Core logic |
|---|---|
| `screen_vcmi_claim` | Gold/Silver/Bronze eligibility from abatement %, SBTi status, scope coverage, mitigation-contribution %; fixed credibility 95/72/50/20 |
| `assess_icvcm_ccps` | per-CCP `pass_rate = pass_votes/n_credits`; CCP passes at ≥0.6; category & overall scores |
| `check_corsia_eligibility` | volume eligible if scheme ∈ approved list AND vintage ≥ 2016 AND has corresponding adjustment |
| `assess_article6` | classify volume into Art 6.2 / 6.4 / unclassified; `double_counting_risk = low if CA% > 80 else high` |
| `price_credits` | `(base×(1−vintage_disc) + additionality_prem + co_benefit_prem) × registry_adj` |
| `analyse_portfolio` | volume-weighted price, registry/type/vintage/quality distributions |

### 7.2 Parameterisation (cited to VCMI/ICVCM/CORSIA/Verra standards)

**VCMI Claims Code tiers** — Gold: abatement ≥ 90%, SBTi 1.5 °C validated, all 3 scopes,
mitigation contribution ≥ 20%. Silver: ≥ 45%, WB2C, ≥ 10%. Bronze: on SBTi pathway, ≥ 5%.

**ICVCM 10 CCPs** with weights (sum 1.0) across three categories:

| Category | CCPs (weight) |
|---|---|
| Governance | CCP01 Governance (.12) · CCP02 Tracking (.10) · CCP03 Transparency (.10) · CCP04 Third-party V&V (.12) |
| Emissions impact | CCP05 Additionality (.12) · CCP06 Permanence (.10) · CCP07 Quantification (.10) · CCP08 No double counting (.10) |
| Sustainable dev | CCP09 SD benefits & safeguards (.07) · CCP10 Net-zero transition (.07) |

**CORSIA Phase 2 (2024–2026) eligible schemes** — ACR, ART TREES, CAR, Gold Standard, Plan Vivo,
Verra VCS (CORSIA label), Global Carbon Council, Social Carbon.

**Price benchmarks** ($/tCO₂ by vintage 2015/2020/2023): renewables 2/3/4 · methane 2/4/6 ·
cookstoves 3/5/8 · soil 5/8/12 · nature-based 8/12/18 · blue carbon 10/16/25 · BECCS 25/40/55 ·
DAC 40/60/80. Co-benefit premiums (% of base): SDG-multiple 15, biodiversity 12, livelihoods 8,
water 6, gender 5, basic 2. Registry adjustment: Verra 1.00 · CAR 1.03 · ACR 1.05 · Gold 1.08.
Vintage discount `min(0.40, age × 0.025)`; ICVCM additionality premium midpoint 0.10 (documented
5–15% market band). Also embeds 20 Article 6 bilateral agreements (CH-GH, JP-TH…) with status.

### 7.3 Calculation walkthrough

The engine is de-fabricated with **conservative/honest-null defaults** (extensive inline
comments):

- **ICVCM voting:** CCP01 passes if the registry is a known one; CCP02 if Verra/Gold/ACR; CCP04
  if `independent_audit` is true; CCP05 if vintage ≥ 2016; CCP08 if `corsia_eligible`. The five
  "attestation-only" CCPs (03, 06, 07, 09, 10) pass *only* with an explicit per-credit
  `ccp_attestations[id] == True` — a missing attestation is **not** a random pass but a no-evidence
  fail, and `credits_missing_ccp_attestations` reports the data gap. A CCP passes portfolio-wide
  when ≥ 60% of credits vote pass.
- **CORSIA:** three independent gates (scheme, vintage, corresponding adjustment); missing CA
  defaults False, keeping legacy/unadjusted credits ineligible.
- **Article 6:** unspecified mechanism → unclassified; missing CA → not counted, so
  double-counting risk stays "high" until CA evidence is supplied (>80% CA → low).
- **Pricing:** base price selected by vintage bucket, discounted by age; ICVCM-passing credits
  earn a 10% additionality premium (or caller rate); co-benefit premiums are additive % of base;
  registry multiplier applied last.
- **Full assessment:** VCMI inputs absent → conservative no-data defaults (0% abatement,
  not_committed) so `screen_vcmi_claim` correctly returns "not_eligible", flagged with a note.

### 7.4 Worked example (price a 2022 nature-based Gold-Standard credit, ICVCM pass, biodiversity + livelihoods)

Benchmark nature-based: 2023 vintage = $18 (vintage 2022 ≥ 2022 → base 18); vintage age = 2 →
discount `min(0.40, 0.05) = 0.05`:

| Step | Computation | Result |
|---|---|---|
| Price after vintage | 18 × (1 − 0.05) | $17.10 |
| Additionality premium (ICVCM pass, 10%) | 18 × 0.10 | $1.80 |
| Co-benefit premium | (12% + 8%) × 18 = 0.20 × 18 | $3.60 |
| Subtotal | 17.10 + 1.80 + 3.60 | $22.50 |
| Registry adj (Gold 1.08) | 22.50 × 1.08 | **$24.30/tCO₂** |

For VCMI: a company with 92% abatement, `validated_1.5c` SBTi, all scopes, 22% mitigation
contribution → **Gold** (credibility 95). Drop abatement to 50% → fails Gold (< 90%) but meets
Silver (≥ 45%, ≥ 10%) → **Silver** (72).

### 7.5 Data provenance & limitations

- **No synthetic/PRNG data.** Multiple inline comments document removed random jitter (VCMI
  credibility, ICVCM attestation votes, additionality premium) replaced by deterministic tier
  logic, conservative defaults, or explicit model constants (labelled "MODEL calibration
  constant").
- ICVCM assessment is a **portfolio heuristic**, not a real ICVCM decision: it infers CCP
  pass/fail from registry identity, audit flag, vintage and CORSIA flag, plus optional
  attestations. It does not evaluate methodology-category ICVCM approvals.
- VCMI tiering is a threshold check on self-reported abatement/SBTi/contribution — it does not
  verify SBTi validation or the quality of the mitigation-contribution credits themselves.
- Prices are static benchmark tables (2015/2020/2023 vintages), not live market data; the
  additionality-premium band and co-benefit premiums are stylised market estimates.
- The 20 Article 6 bilateral agreements are a fixed sample with signing dates/status — a snapshot,
  not a live registry.

### 7.6 Framework alignment

- **VCMI Claims Code of Practice v1.0 (2023)** — Gold/Silver/Bronze claim tiers gated on the
  carbon-integrity + emission-reduction prerequisites (SBTi-validated near-term target, scope
  coverage) and a minimum mitigation-contribution %; faithfully thresholded.
- **ICVCM Core Carbon Principles v2.0 (2023)** — real ICVCM approval is programme-level +
  methodology-category-level across the 10 CCPs; here the CCPs are scored per-credit by proxy
  signals with an attestation escape hatch. The category weights match ICVCM's governance /
  emissions-impact / sustainable-development grouping.
- **ICAO CORSIA (Eligible Emissions Unit Criteria, Phase 2 2024–2026)** — approved-scheme list,
  vintage ≥ 2016, and corresponding-adjustment requirement.
- **Paris Agreement Article 6.2 / 6.4** — ITMO classification and the corresponding-adjustment
  test that drives double-counting risk; bilateral-agreement registry for host-country status.
- **Verra VCS v4.5 / Gold Standard / ACR / CAR** — registry methodology catalogues and
  registry-quality price adjustments.
- **TSVCM (2021)** — the market-scaling context behind the pricing and quality-tiering design.

## 9 · Future Evolution

### 9.1 Evolution A — Live credit prices and methodology-level ICVCM assessment (analytics ladder: rung 1 → 3)

**What.** A clean tier-A VCM intelligence engine (E46): VCMI Claims Code tiering, ICVCM 10-CCP
assessment, CORSIA eligibility, Article 6 ITMO classification, credit pricing, portfolio analytics
— all de-fabricated with conservative honest-null defaults (§7.5 documents removed random jitter
now replaced by deterministic tier logic and "no-evidence fail" for missing attestations). §7.5
names the deepening targets: prices are **static benchmark tables** (2015/2020/2023 vintages), not
live market data; the ICVCM assessment is a **portfolio heuristic** inferring CCP pass/fail from
registry identity/audit-flag/vintage rather than evaluating real ICVCM methodology-category
approvals; and the 20 Article 6 bilateral agreements are a fixed snapshot. Evolution A wires live
VCM price feeds and upgrades ICVCM scoring to reference the actual ICVCM programme/methodology
approval registry.

**How.** A VCM-price ingester replaces the static benchmark tables (the platform already wires
market-data feeds); `assess_icvcm_ccps` joins to an ingested ICVCM-approved-methodology table so
CCP verdicts reflect real approvals, keeping the attestation escape-hatch for un-approved credits.
Rung 3: calibrate the additionality/co-benefit premium bands against observed VCM transaction data
and refresh the Article 6 bilateral registry from UNFCCC.

**Prerequisites (hard).** Fix the lineage-harness failures — §4.2 shows `POST /full-assessment`
**failed** and `/article6`, `/corsia-check`, `/credit-pricing` **skipped**; preserve the honest-null
discipline (a missing CCP attestation stays a no-evidence fail, not a fabricated pass).
**Acceptance:** the §7.4 pricing worked example ($24.30/tCO₂ nature-based Gold credit) reproduces at
legacy benchmarks; a live price feed moves the base price; ICVCM verdicts reflect real methodology
approvals where available; the failing POST endpoints pass the harness.

### 9.2 Evolution B — Carbon-credit quality analyst with tool-called screening (LLM tier 2)

**What.** A tool-calling analyst for VCM buyers: "is this VCMI claim Gold-eligible?" (`/vcmi-claim`),
"assess ICVCM CCP alignment for our credit portfolio" (`/icvcm-ccp`), "are these credits CORSIA-
eligible?" (`/corsia-check`), "price a 2022 nature-based Gold-Standard credit" (`/credit-pricing`),
and "analyse our portfolio" (`/portfolio-analysis`) — narrating the engine's real outputs and its
data-gap flags (`credits_missing_ccp_attestations`, conservative no-data VCMI defaults).

**How.** Tool schemas from the 7 POST + 4 GET operations; the four reference endpoints (VCMI
criteria, ICVCM CCPs, CORSIA schemes, price benchmarks) are ideal RAG grounding for "what does
CCP05 additionality require?" questions — a tier-1 explainer over a tier-2 operator. The
no-fabrication validator checks every price, score and pass-rate against tool output; the copilot
must surface which CCPs failed for lack of attestation (a data gap, not a quality failure).

**Prerequisites.** Evolution A's harness fixes (working endpoints for tool-calling); Atlas +
reference corpus embedded (roadmap D3). **Acceptance:** every figure cited traces to an engine tool
call; the credit price matches `/credit-pricing` exactly; an ICVCM answer distinguishes a
no-attestation data gap from a substantive CCP failure, per the engine's design.