# Transition Regulatory Reporting
**Module ID:** `transition-reg-reporting` · **Route:** `/transition-reg-reporting` · **Tier:** B (frontend-computed) · **EP code:** EP-CE3 · **Sprint:** CE

## 1 · Overview
TCFD 4-pillar disclosure suite with 11 requirements, ISSB S2 compliance tracker (Para 10-39), CSRD ESRS E1 gap analysis, scenario board narratives, metrics register with source module traceability, and multi-format export centre.

**How an analyst works this module:**
- TCFD Report tab shows 4-pillar accordion — expand each for disclosure text and status
- ISSB S2 Disclosure tracks Para 10-39 compliance
- Board Narrative generates scenario-specific narrative (CP/B2C/NZ2050) with metrics
- Metrics Register shows 12 TCFD/ISSB metrics with source EP-code and verification status
- Export Centre offers PDF (board report), XBRL (machine-readable), Excel, Word, JSON

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `EMISSIONS_TREND`, `ISSB_ITEMS`, `METRICS_TABLE`, `NARRATIVES`, `TABS`, `TCFD_PILLARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TCFD_PILLARS` | 15 | `code`, `color`, `disclosures`, `id`, `req`, `status`, `text` |
| `ISSB_ITEMS` | 10 | `topic`, `status`, `color` |
| `METRICS_TABLE` | 13 | `value`, `unit`, `source`, `status` |
| `EMISSIONS_TREND` | 12 | `actual`, `target` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pct` | `Math.round((complete / total) * 100);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EMISSIONS_TREND`, `ISSB_ITEMS`, `METRICS_TABLE`, `TABS`, `TCFD_PILLARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| TCFD Completeness | `11/12 disclosures complete` | Self-assessment | Only S3 (scenario resilience) partially complete |
| ISSB S2 Completeness | `7/9 paragraph groups` | Self-assessment | Para 17 (scenario) and Para 33 (Scope 3) in progress |
| CSRD ESRS E1 Gaps | `Cross-walk analysis` | EFRAG | Transition plan (E1-1), energy mix (E1-5), and Scope 3 Cat 11 (E1-6) |
| Metrics Register | `With source module trace` | Platform data | Each metric linked to its computation module (EP-code reference) |

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-framework disclosure automation
**Headline formula:** `Completeness = Σ(completed_disclosures) / Σ(required_disclosures) per framework`

TCFD: 4 pillars (Governance G1-G2, Strategy S1-S3, Risk Management R1-R3, Metrics & Targets M1-M3) = 11 required disclosures. ISSB S2: 9 paragraph groups (Para 10-39). CSRD ESRS E1: 6 disclosure requirements (E1-1 through E1-6) mapped to TCFD/ISSB equivalents. Each metric traced to source module (e.g., CVaR from EP-CE1, WACI from EP-CC2).

**Standards:** ['TCFD 2017+2021', 'ISSB IFRS S2', 'CSRD ESRS E1', 'SFDR RTS']
**Reference documents:** TCFD Final Report (2017) + Status Report (2021); ISSB IFRS S2 Climate-related Disclosures; CSRD ESRS E1 Delegated Act; SFDR RTS (Commission Delegated Regulation)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

This is a **static disclosure-report generator**, not a calculation engine — every metric, scenario
narrative, and completeness status is hand-authored fixed content. The one genuine computation in
the file is a completeness percentage per TCFD pillar:

```
pct = round(COMPLETE-status disclosures / total disclosures in pillar × 100)
```

### 7.2 Parameterisation

| Element | Structure | Provenance |
|---|---|---|
| `TCFD_PILLARS` | 4 pillars (Governance 2 items, Strategy 3, Risk Management 3, Metrics & Targets 3 = 11 total disclosures) each with hand-written compliance narrative text and a `COMPLETE`/`PARTIAL` status | Real TCFD 2017 framework structure and disclosure requirement wording; content is illustrative, written as if from a real bank/asset-manager TCFD report |
| `ISSB_ITEMS` | 9 rows mapped to real ISSB IFRS S2 paragraph numbers (Para 10, 14, 17, 22, 25, 29, 33, 36, 39) | Correct paragraph-to-topic mapping per the actual IFRS S2 standard structure |
| `NARRATIVES` | 3 NGFS-named scenarios (Current Policies, Below 2°C, Net Zero 2050), each with a fixed ITR/VaR/stranded-asset headline and multi-paragraph narrative text | Hand-authored; the 3 scenarios' ITR (3.1°C/1.8°C/1.5°C) and VaR (5.8%/8.7%/11.2%) figures are static and internally consistent with each other in direction (more ambitious scenario → higher near-term VaR, lower long-run ITR) but not computed from any live model |
| `METRICS_TABLE` | 12 rows, each citing a specific source module (e.g. `EP-CE1`, `EP-CC2`, `EP-CA2`) and a `VERIFIED`/`ESTIMATED`/`IN PROGRESS` status | Values match figures that appear as live outputs in the platform's actual Climate VaR Engine (EP-CE1: 8.7% VaR), PCAF Financed Emissions (EP-CC2: WACI 182 tCO₂/$M), and Stranded Asset (EP-CA2: $2.1B) modules — i.e., this table is a **manually synchronised snapshot**, not a live pull |
| `EMISSIONS_TREND` | 2020–2030, `actual` populated through 2024, `target` for all 11 years | Static trajectory; `actual` 2020→2024 declines 225→182 tCO₂e (≈19% cumulative), `target` continues to 112 by 2030 (≈50% below 2020 baseline — matches the M3 disclosure's stated "50% reduction in WACI by 2030 vs 2020" target) |

### 7.3 Calculation walkthrough

1. **TCFD Report tab**: expandable accordion per pillar; `pct` is computed live from the hardcoded
   `status` fields (e.g. Strategy pillar: 2 of 3 disclosures COMPLETE → 67%), the only place actual
   arithmetic happens in the file.
2. **ISSB S2 Disclosure tab**: renders the 9-paragraph tracker with static status badges — no
   completeness percentage is computed here (unlike the TCFD tab).
3. **Board Narrative tab**: scenario dropdown swaps between the 3 pre-written `NARRATIVES` entries;
   no interpolation or recomputation occurs — selecting a scenario just displays a different fixed
   text block and its 3 headline numbers.
4. **Metrics Register tab**: renders the static 12-row table with source-module citations and
   verification status badges.
5. **Export Centre tab**: format selector (PDF/XBRL/Excel/Word/JSON) — UI only, no export
   generation logic was inspected as part of this deep dive's scope of computed values.

### 7.4 Worked example (TCFD completeness)

| Pillar | Disclosures | COMPLETE count | `pct` |
|---|---|---|---|
| Governance | G1, G2 (both COMPLETE) | 2/2 | **100%** |
| Strategy | S1 COMPLETE, S2 COMPLETE, S3 PARTIAL | 2/3 | **67%** |
| Risk Management | R1, R2, R3 (all COMPLETE) | 3/3 | **100%** |
| Metrics & Targets | M1 COMPLETE, M2 PARTIAL, M3 COMPLETE | 2/3 | **67%** |
| **Overall (11 disclosures)** | 9 COMPLETE, 2 PARTIAL | 9/11 | **≈82%**, matching the guide's cited "92%"† only approximately |

†The guide's dataPoints entry claims "TCFD Completeness 92% (11/12 disclosures complete)" — the code
has 11 total disclosures (not 12) and 9, not 11, marked COMPLETE, giving 82% not 92%; a minor
guide/code figure discrepancy worth noting alongside the main structural findings above.

### 7.5 Companion analytics

- **Emissions trajectory chart** — actual (2020–2024) vs target (2020–2030) line chart tracking
  toward the 50%-by-2030 WACI reduction goal stated in TCFD disclosure M3.
- **Cross-framework citation** — the Metrics Register's `source` column is the module's most useful
  design feature conceptually: it explicitly documents which platform module (by EP-code) should be
  the system of record for each disclosed figure, even though the values themselves are a manual
  snapshot rather than a live query.

### 7.6 Data provenance & limitations

- **No live data connections.** Despite citing specific source modules (EP-CE1, EP-CC1, EP-CC2,
  EP-CA2, EP-CD1, EP-CD3, EP-CB3, EP-CC3) for every metric, this page does not query those modules —
  all figures are hardcoded and must be manually kept in sync with whatever those other modules
  currently compute (they will drift out of sync as soon as any upstream module's synthetic data
  regenerates or its logic changes).
- **Scenario narratives are pre-written text**, not generated from a scenario-analysis engine — the
  ITR/VaR/stranded-asset headline figures per scenario are static and cannot reflect any change in
  the underlying portfolio.
- **TCFD completeness percentage is the only genuinely computed figure**, and even it depends on
  hand-set `status` flags rather than an actual audit of which disclosures have real supporting
  data.

### 7.7 Framework alignment

- **TCFD (2017 Final Recommendations)**: the 4-pillar / 11-disclosure structure (Governance 2,
  Strategy 3, Risk Management 3, Metrics & Targets 3) is accurate to the real TCFD framework.
- **ISSB IFRS S2**: paragraph references (Para 10, 14, 17, 22, 25, 29, 33, 36, 39) correctly map to
  Governance, Strategy, Risk Management, and Metrics & Targets sections of the actual standard.
- **CSRD ESRS E1 / SFDR RTS**: cited in the guide as additional governing standards; not
  independently represented as separate tracked disclosures in this file (only TCFD and ISSB S2 have
  dedicated tabs).
- **NGFS scenarios** (Current Policies, Below 2°C, Net Zero 2050): correct real scenario names used
  for the board narrative; the relative ordering of implied VaR (Current Policies lowest, Net Zero
  2050 highest near-term VaR) reflects the genuine NGFS insight that faster transitions front-load
  transition risk even as they reduce long-run physical risk.

## 9 · Future Evolution

### 9.1 Evolution A — Turn the manual metrics-register snapshot into live cross-module queries (analytics ladder: rung 1 → 2)

**What.** This is a static disclosure-report generator whose one genuine computation is TCFD pillar completeness (`complete/total × 100` over hand-set status flags, §7.1). Its most valuable design feature is the Metrics Register's `source` column, which documents *which platform module* (by EP-code) is the system of record for each disclosed figure — but §7.6 documents the fatal caveat: despite citing EP-CE1 (Climate VaR), EP-CC2 (WACI), EP-CA2 (Stranded Assets), the page never queries them; every value is a hardcoded snapshot that drifts out of sync the moment an upstream module changes. Evolution A makes the traceability real.

**How. (1)** Replace the manual `METRICS_TABLE` values with live queries to the cited source modules — the register already names the EP-code system-of-record for each metric, so the wiring targets are specified; this is the platform's own lineage graph made executable. (2) Compute ISSB S2 completeness (the tab renders status badges but computes no percentage, unlike TCFD — §7.3). (3) Add the CSRD ESRS E1 and SFDR tabs the guide claims but §7.7 notes are absent (only TCFD/ISSB have tabs today). (4) Reconcile the guide's "92%/11-of-12" TCFD figure with the code's actual 82%/9-of-11 (§7.4 documents the discrepancy). (5) Drive scenario narratives' ITR/VaR headlines from the actual scenario-analysis modules rather than pre-written text.

**Prerequisites.** Live read access to the ~8 cited source modules (EP-CE1/CC1/CC2/CA2/CD1/CD3/CB3/CC3); a verification-status field that reflects real assurance state, not a hand-set badge. **Acceptance:** changing an upstream module's output changes this register's displayed value; ISSB completeness is computed; the TCFD figure is internally consistent between guide and code.

### 9.2 Evolution B — Disclosure-assembly copilot with source-traced metrics (LLM tier 1 → 2)

**What.** Regulatory disclosure drafting is the platform's canonical LLM use case, and this module already encodes the structure: TCFD 11 disclosures, ISSB S2 paragraph map (Para 10–39, correctly mapped per §7.7), the cross-framework citations. The copilot drafts the disclosure narrative per pillar/paragraph, pulling each metric with its source-module provenance ("Scope 1+2 WACI of 182 tCO₂/$M, per the PCAF Financed Emissions module, EP-CC2"), and generates the board scenario narrative.

**How.** Tier 1 grounds in this Atlas record and the accurate framework structures (the ISSB paragraph mapping and TCFD 4-pillar/11-disclosure structure are real, §7.7). The Metrics Register's source-column is the copilot's provenance backbone — it can state which module each number comes from, exactly the "show work" transparency the roadmap's Tier-2 UX requires. Tier 2 arrives with Evolution A's live cross-module queries: the copilot pulls current values as tool calls rather than narrating a stale snapshot, and the no-fabrication validator checks each disclosed metric against its source-module response. Pre-Evolution-A, drafts must flag that metric values are a manual snapshot that may have drifted (§7.6).

**Prerequisites.** Evolution A's live source-module wiring for tier 2; tier-1 narrative drafting ships now with the snapshot-drift caveat. **Acceptance:** every disclosed metric cites its source EP-code module; completeness figures match the computed status flags; scenario narratives are labelled pre-written until driven by a real scenario engine.