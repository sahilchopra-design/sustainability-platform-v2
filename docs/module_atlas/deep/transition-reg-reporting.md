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
