# Transition Finance
**Module ID:** `transition-finance` · **Route:** `/transition-finance` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Financing platform for credible climate transitions in hard-to-abate sectors (steel, cement, shipping, aviation, chemicals) using sustainability-linked instruments, blended finance and Just Transition provisions.

> **Business value:** Hard-to-abate sectors account for 30% of global GHG emissions; GFANZ estimates they require ≈1 trillion annually in transition finance to achieve net zero, 10× current deployment levels.

**How an analyst works this module:**
- Assess company transition plan credibility and sector pathway alignment
- Score TFES across ambition, credibility and additionality dimensions
- Structure appropriate financing instrument (SLB, green loan, blended)
- Set KPI-linked financial incentives to milestones
- Monitor and report transition progress against financing covenants

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `INSTRUMENT_OPTIONS`, `Inp`, `KpiCard`, `Row`, `SECTOR_OPTIONS`, `Section`, `Sel`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SECTOR_OPTIONS` | 11 | `label` |
| `INSTRUMENT_OPTIONS` | 6 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `composite` | `Math.round(elements.reduce((s, e) => s + e.score, 0) / 6);` |
| `nearTerm` | `Math.round(r(10) * 30 + 50);` |
| `longTerm` | `Math.round(r(11) * 32 + 45);` |
| `netZero` | `Math.round(r(12) * 28 + 48);` |
| `alignment15c` | `parseFloat((r(13) * 0.4 + 0.3).toFixed(2));` |
| `rtzScore` | `Math.round(metCount * 20);` |
| `scoreData` | `checklist.map(c => ({ step: c.step, score: c.met ? 100 : Math.round(r(31 + checklist.indexOf(c)) * 40 + 20) }));` |
| `portfolioTemp` | `parseFloat((1.8 + r(40) * 1.8).toFixed(1));` |
| `waci` | `Math.round(r(41) * 300 + 50);` |
| `engagementCoverage` | `Math.round(r(42) * 40 + 40);` |
| `parisAligned` | `Math.round(r(43) * 35 + 20);` |
| `credibilityScore` | `Math.round(instrumentScore.reduce((s, i) => s + i.score, 0) / instrumentScore.length);` |
| `seed0` | `hashStr(companyName + sector + instrument);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/transition-finance/assess` | `assess_credibility` | api/v1/routes/transition_finance.py |
| POST | `/api/v1/transition-finance/portfolio-temperature` | `portfolio_temperature` | api/v1/routes/transition_finance.py |
| POST | `/api/v1/transition-finance/instrument-screen` | `instrument_screen` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/tpt-elements` | `ref_tpt_elements` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/sbti-criteria` | `ref_sbti_criteria` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/race-to-zero` | `ref_race_to_zero` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/sector-pathways` | `ref_sector_pathways` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/gfanz-expectations` | `ref_gfanz_expectations` | api/v1/routes/transition_finance.py |

### 2.3 Engine `transition_finance_engine` (services/transition_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_score_tpt_element` | element_id, element_inputs | Score a single TPT element 0-1 from user-provided sub-element scores or qualitative tier. element_inputs: dict with optional keys 'score' (float 0-1) or 'sub_scores' (list of floats). |
| `_get_quality_tier` | score |  |
| `_calculate_waci` | holdings | WACI = Σ(weight_i × tCO2e_i / revenue_i_M) holdings: list of {weight: float, tco2e: float, revenue_usd_mn: float} |
| `_implied_temperature` | waci | Estimate implied portfolio temperature from WACI using linear interpolation between benchmark anchors: WACI 100 → 1.5°C WACI 300 → 2.5°C WACI 600 → 3.5°C Simplified proxy; full TCFD/SBTi approach requires sector-specific SDA. |
| `_detect_red_flags` | tpt_score, sbti_score, rtz_score, tpt_inputs, sbti_inputs | Identify greenwash / credibility red flags. |
| `assess_transition_finance_credibility` | entity_name, sector, tpt_inputs, sbti_inputs, rtz_inputs, portfolio_inputs, tnfd_inputs | Full transition finance credibility assessment. Scores: - TPT 6-element composite (weighted) - SBTi validation criteria - Race to Zero 5 Cs - Portfolio temperature alignment (WACI-based) - TNFD LEAP nature integration - Overall credibility composite + red flags |
| `calculate_portfolio_temperature` | holdings, engagement_coverage_pct, paris_aligned_pct | Calculate portfolio temperature alignment using WACI and implied temperature. holdings: list of { name: str, weight: float (sum to 1.0), tco2e: float, revenue_usd_mn: float, has_sbti: bool (optional), sbti_temperature: float (optional) } |
| `screen_transition_instrument` | instrument_type, entity_name, sector, kpis, spts, has_transition_plan, transition_plan_tier, sbti_status | Screen a transition finance instrument against applicable credibility criteria. instrument_type: transition_bond / sustainability_linked_loan / transition_loan_facility / blended_finance_transition |
| `get_transition_benchmarks` |  | Return consolidated benchmark and reference data for transition finance analysis. |

**Engine `transition_finance_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `WACI_UNIT` | `'tCO2e / USD mn revenue'` |
| `IMPLIED_TEMP_BASE_WACI` | `300.0` |
| `IMPLIED_TEMP_15C_WACI` | `100.0` |
| `IMPLIED_TEMP_3C_WACI` | `600.0` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `INSTRUMENT_OPTIONS`, `SECTOR_OPTIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Transition Finance Deployed | — | Deal Registry | Total capital deployed in transition finance instruments in current year across hard-to-abate sectors. |
| Avg TFES | — | Eligibility Engine | Mean transition finance eligibility score across funded companies; 60+ required for instrument approval. |
| Hard-to-Abate Coverage | — | Sector Framework | Sectors covered: steel, cement, shipping, aviation, chemicals, heavy road transport. |
- **Company Transition Plans, Financial Terms, Sector Pathway Data** → TFES engine + instrument structuring + milestone monitoring → **Transition finance deal registry, KPI dashboards, impact reports**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/transition-finance/ref/gfanz-expectations** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'version', 'expectations', 'transition_instrument_criteria', 'credibility_framework_weights', 'greenwash_red_flags'], 'n_keys': 6}`

**GET /api/v1/transition-finance/ref/race-to-zero** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'overview', 'five_cs', 'membership_categories', 'key_requirements_summary', 'total_members_2023', 'financial_assets_committed_usd_tn'], 'n_keys': 7}`

**GET /api/v1/transition-finance/ref/sbti-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'standard_version', 'criteria', 'validation_process', 'near_term_requirements', 'long_term_requirements', 'sector_specific_pathways'], 'n_keys': 7}`

**GET /api/v1/transition-finance/ref/sector-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'note', 'pathways', 'high_climate_impact_sectors', 'sector_count', 'key_milestones'], 'n_keys': 6}`

**GET /api/v1/transition-finance/ref/tpt-elements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'elements', 'quality_tiers', 'total_weight', 'element_weights_summary', 'composite_scoring'], 'n_keys': 6}`

**POST /api/v1/transition-finance/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/transition-finance/instrument-screen** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/transition-finance/portfolio-temperature** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Transition Finance Eligibility Score
**Headline formula:** `TFES = Ambition Score × Credibility Score × Additionality Factor`

Three-dimensional screening for transition finance eligibility: ambition of decarbonisation pathway, credibility of plan, and financial additionality of instrument.

**Standards:** ['GFANZ Transition Finance Recommendations 2022', 'EU Platform on Sustainable Finance 2023']
**Reference documents:** GFANZ Transition Finance Recommendations 2022; EU Platform on Sustainable Finance Transition Finance Report 2023; OECD Blended Finance for Climate 2022; IFC Just Transition Finance Guidelines

**Engine `transition_finance_engine` — extracted transformation lines:**
```python
score = sum(scores) / len(scores) if scores else 0.0
WACI = Σ(weight_i × tCO2e_i / revenue_i_M)
frac = (waci - IMPLIED_TEMP_15C_WACI) / (IMPLIED_TEMP_BASE_WACI - IMPLIED_TEMP_15C_WACI)
frac = (waci - IMPLIED_TEMP_BASE_WACI) / (IMPLIED_TEMP_3C_WACI - IMPLIED_TEMP_BASE_WACI)
score = 1.0  # full marks for N/A criteria (e.g. FLAG for non-land sector)
leap_score = len(leap_stages_completed) / max_leap
sbtn_score = sbtn_steps / 5
tnfd_score = round((leap_score + sbtn_score) / 2.0, 3)
composite = score_sum / n_checks if n_checks > 0 else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **46** other module(s).
**Shared engines (edits propagate!):** `transition_finance_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `transition-finance-engine` | engine:transition_finance_engine, table:exc |
| `transition-finance-screener` | engine:transition_finance_engine, table:exc |
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `green-hydrogen-lcoh` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |
| `supply-chain-resilience` | table:exc |

## 7 · Methodology Deep Dive

> ⚠️ **"Run Assessment" button is a no-op against the displayed data.** The page does call the real
> backend (`POST /api/v1/transition-finance/assess`, handled by `backend/services/
> transition_finance_engine.py`), but the response is **never captured or used**:
> `await axios.post(...)` discards its return value, and any error is silently swallowed
> (`catch { void 0 }`). Every number on the page — TPT scores, SBTi trajectories, Race-to-Zero
> checklist, portfolio temperature, TNFD/instrument credibility — is instead computed **entirely
> client-side** from `seededRandom(seed0+n)`, where `seed0 = hashStr(companyName+sector+instrument)`.
> Clicking "Run Assessment" therefore does nothing visible: the same five data blocks would render
> identically whether or not the button is ever clicked, or whether the backend is even running.

### 7.1 What the module computes

Five independent synthetic scoring blocks, all keyed off a single DJB2-style string hash of the
user's three inputs (company name, sector, instrument type):

```js
hashStr(s)      // DJB2 hash: h = ((h<<5)+h) ^ charCode, repeated per character
seed0 = hashStr(companyName + sector + instrument)
r(n) = seededRandom(seed0 + n) = frac(sin(seed0+n+1) × 10⁴)
```

Because `seed0` is a deterministic hash of the exact input strings, the same company/sector/
instrument combination always reproduces the same "assessment" — but changing the company name by
even one character produces an entirely unrelated set of scores (hash avalanche), which is
inconsistent with how a real credibility assessment should behave (small input changes should not
flip the result).

### 7.2 Parameterisation

| Block | Formula | Range | Provenance |
|---|---|---|---|
| TPT composite | `round(Σ 6 dimension scores / 6)` where each dimension = `r(n)×spread+floor` | ~50–87 | Dimension names (Foundations, Implementation, Engagement, Metrics, Governance, Finance) match the UK's real **Transition Plan Taskforce (TPT)** Disclosure Framework's structure; the scores themselves are synthetic |
| TPT quality tier | 80/65/50 cutoffs → leading/advanced/developing/initial | — | Platform-defined tiering |
| SBTi near/long-term/net-zero scores | `r(10)×30+50`, `r(11)×32+45`, `r(12)×28+48` | ~45–82 | Synthetic; SBTi itself does not publish a single 0–100 "validation score" — it issues pass/fail target validation |
| SBTi sector baseline (`sectorBaselines`) | Fixed dict, e.g. steel 1800, banking 180 (implied tCO2e/$M or similar intensity unit) | 180–1800 | Platform-authored relative sector-intensity ranking (steel > oil&gas > power > cement ≈ aviation > shipping > agriculture > automotive > real estate > banking) — directionally plausible but not sourced from a named intensity database |
| Pathway curve (2024–2050) | `baseline × (multiplier + r(n)×spread)` at each milestone year, `paris` column a fixed % of baseline per year | — | The "Paris" line is a fixed geometric decline (98%→0% of baseline by 2050), not derived from a named 1.5°C sector pathway (e.g. SBTi SDA or IEA NZE) |
| Race-to-Zero checklist | 5 steps (Pledge/Plan/Proceed/Publish/Account) each `r(n) > threshold` | boolean | Real Race to Zero "5 P's" criteria structure; pass/fail is a random draw |
| `rtzScore` | `metCount × 20` | 0/20/40/60/80/100 | Simple count-based score — genuinely computed from the checklist booleans, though the booleans themselves are random |
| Portfolio temperature | `1.8 + r(40)×1.8` | 1.8–3.6°C | Synthetic; not derived from any actual holdings |
| TNFD LEAP / SBTN steps | boolean completion flags per stage | — | Real TNFD LEAP and SBTN 5-step taxonomies, randomly populated |
| Instrument credibility | `round(mean of 5 sub-scores)` (KPI Ambition, SPT Calibration, Greenwash Flags, Reporting Quality, Third-party Verify) | ~50–83 | Synthetic |

### 7.3 Calculation walkthrough

1. User enters company name / sector / instrument type; `seed0` is recomputed on every keystroke
   (no debounce), immediately re-rendering all 5 tabs with a new hash-derived dataset.
2. **TPT Credibility tab**: 6 dimension scores averaged into a composite, mapped to a 4-tier quality
   label; SBTi commitment status and Race-to-Zero membership are two more independent random draws
   presented alongside the TPT score without being combined into it.
3. **SBTi Validation tab**: near-term/long-term/net-zero target scores (0–100) plus an 8-point
   emissions pathway (2024→2050) benchmarked against a "Paris" reference line that is a fixed
   percentage decay of the sector baseline, not a modelled 1.5°C trajectory.
4. **Race to Zero tab**: 5-step pass/fail checklist → `rtzScore = metCount × 20`; 6 initiative
   memberships (GFANZ, NZBA, NZAM, NZI, NZAOA, RE100) as independent booleans.
5. **Portfolio Temperature tab**: a single portfolio ITR figure and its 2024→2050 projected decline
   (declining multiplier curve, not scenario-driven), plus a 4-bucket aligned/not-aligned holdings
   breakdown.
6. **TNFD & Instrument tab**: LEAP and SBTN completion checklists (both real TNFD/SBTN process
   taxonomies) plus a 5-factor instrument credibility score for the selected financial instrument
   type.

### 7.4 Worked example (`companyName="Atlas Energy Corp"`, `sector="power"`, `instrument="transition_bond"`)

| Step | Computation | Result |
|---|---|---|
| `seed0` | DJB2 hash of the concatenated string | **240,798,774** |
| TPT dimensions | Foundations 77, Implementation 68, Engagement 66, Metrics 50, Governance 59, Finance 80 | — |
| TPT composite | `round(400/6)` | **67** |
| TPT tier | `65 ≤ 67 < 80` | **Advanced** |
| SBTi status | `r(7)=0.586 > 0.5` | **Committed** |
| RTZ membership | `r(8)=0.784 > 0.45` | **True** |
| SBTi near-term score | `r(10)×30+50` | **70** |

Changing `companyName` to "Atlas Energy Corp " (trailing space) would produce a completely different
`seed0` and hence an unrelated set of scores — illustrating that the "assessment" is a hash lookup,
not a graded evaluation of the company's actual transition credentials.

### 7.5 Data provenance & limitations

- **All displayed scores are synthetic and disconnected from the real backend engine.** Even though
  `transition_finance_engine.py` and its `/assess`, `/instrument-screen`, and `/portfolio-
  temperature` endpoints exist and are called, their responses are discarded — see the mismatch
  note above. Any real scoring logic in the Python engine (which was not audited here since it is
  provably unused by this page) has zero effect on what the user sees.
- The hash-based seeding means results are **reproducible per exact input string** but **not
  smoothly related to nearby inputs** — a core property any legitimate scoring model should have
  (continuity) is absent by construction.
- The "Paris" reference pathway in the SBTi tab is a fixed percentage decay curve, not tied to any
  named 1.5°C sector decarbonisation pathway (e.g. SBTi's Sectoral Decarbonization Approach, IEA
  NZE technology roadmaps) despite sitting next to real SBTi terminology.
- No sensitivity, confidence interval, or audit trail is attached to any of the 5 blocks.

### 7.6 Framework alignment

- **UK Transition Plan Taskforce (TPT) Disclosure Framework**: the 6-dimension structure
  (Foundations, Implementation, Engagement, Metrics, Governance/Ambition, Finance) matches the
  TPT's real framework pillars; scoring is synthetic.
- **SBTi Corporate Net-Zero Standard**: near-term/long-term/net-zero terminology is correct SBTi
  vocabulary; SBTi itself validates targets as pass/fail against sector pathways rather than issuing
  a continuous 0–100 score, so the module's scoring convention is a platform simplification.
- **Race to Zero "5 P's" criteria** (Pledge, Plan, Proceed, Publish, Account): correctly represented
  as the 5 checklist items; UNFCCC-recognised initiative list (GFANZ, NZBA, NZAM, NZI, NZAOA, RE100)
  is accurate.
- **TNFD LEAP** and **SBTN 5-step framework**: both real taxonomies (Locate/Evaluate/Assess/Prepare;
  Assess/Interpret & Prioritise/Measure & Set Targets/Act/Track & Disclose) faithfully represented
  as completion checklists.
- **ICMA/GFANZ transition-instrument credibility criteria**: the 5-factor instrument score (KPI
  Ambition, SPT Calibration, Greenwash Flags, Reporting Quality, Third-party Verification) reflects
  real due-diligence dimensions used to assess SLBs/transition bonds, consistent with the separate
  `transition-bond-credibility` module's approach.

## 9 · Future Evolution

### 9.1 Evolution A — Capture the response the page already discards (analytics ladder: rung 1 → 3)

**What.** The §7 flag documents a wiring failure with an unusual property: the page *does* call the real engine (`POST /transition-finance/assess`) but throws the response away — `await axios.post(...)` discards its return and `catch { void 0 }` swallows errors — then renders five blocks from `seededRandom(hashStr(companyName+sector+instrument))`. Clicking "Run Assessment" is a no-op; worse, the hash-seeding means a one-character change to the company name produces an entirely unrelated score (§7.4), violating the continuity any real scoring model must have. Meanwhile the backend engine implements genuine weighted TPT/SBTi/Race-to-Zero/WACI scoring with red-flag detection. Evolution A simply connects the two.

**How.** (1) Capture the `/assess` response and render it — the engine already computes the TPT 6-element composite (matching the real TPT framework structure the page mislabels as synthetic), WACI-based implied temperature, and greenwash red flags. (2) Fix the two documented live failures: `POST /assess` and `/instrument-screen` both trace `failed`, `/portfolio-temperature` is skipped — diagnose before wiring (likely payload/auth). (3) Delete the `seededRandom` blocks entirely — replace hash-lookup scores with graded engine output that responds continuously to inputs. (4) Feed the SBTi-tab "Paris" reference line from the engine's `ref/sector-pathways` (real SBTi SDA / IEA NZE) instead of the fixed geometric decay (§7.5).

**Prerequisites (hard).** The three POST failures root-caused; the `seededRandom` fabrication removed (guardrail-policed). Note the 46-module blast radius via the shared `transition_finance_engine` (§6) — coordinate with `transition-finance-engine` and `transition-finance-screener`. **Acceptance:** identical inputs give identical scores AND near-identical inputs give near-identical scores (continuity restored); every displayed number traces to the `/assess` response; the three POSTs trace green.

### 9.2 Evolution B — Transition-credibility analyst over the live engine (LLM tier 2)

**What.** The engine computes exactly what a transition-finance analyst needs to reason about — TPT elements, SBTi criteria, Race-to-Zero 5 Cs, WACI temperature, TNFD integration, and red flags. A copilot runs `assess_transition_finance_credibility` and `screen_transition_instrument` as tools ("assess this steel issuer's transition plan", "screen an SLL for this borrower"), narrating the engine's red-flag detections and instrument-fit reasoning.

**How.** Tier 2 leverages the 8 mapped routes, 5 of which (the reference GETs) already trace green and are the safe first slice. Grounding corpus: this Atlas record plus the engine's rich reference payloads — `ref/gfanz-expectations` (credibility framework weights + greenwash red flags), `ref/tpt-elements`, `ref/sbti-criteria` — which are precisely the standards the copilot must cite. The no-fabrication validator matters acutely: this module's whole subject is greenwash detection, so the copilot laundering a fabricated credibility score would be self-defeating; every score must trace to `/assess`, provenance-expanded.

**Prerequisites (hard).** Evolution A's fixes — a copilot cannot tool-call endpoints that currently fail, and must never narrate the discarded-response synthetic scores. **Acceptance:** every credibility figure traces to an engine tool call; red flags come from the engine's `_detect_red_flags`, not LLM judgment; framework citations match the reference payloads.