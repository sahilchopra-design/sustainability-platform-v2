## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry claims the navigator covers **"all 1,144
> ESRS mandatory and voluntary datapoints"** and computes an `obligation_weight = mandatory_flag ×
> materiality_relevance × phase-in_discount` plus a "Data Collection Complexity Score (1–5)" and a
> "Phase-In Coverage Rate". **The code contains none of these scores, and the datapoint totals do not
> reconcile to 1,144.** The `ESRS_STANDARDS.datapoints` field sums to **307**, and the module only ever
> computes two derived numbers (a total sum and a materiality-filtered sum). This is fundamentally a
> **reference catalogue / disclosure-requirement navigator**, not a scoring engine. Documented below.

### 7.1 What the module computes

The only two derived quantities in the entire module:

```js
totalDatapoints    = ESRS_STANDARDS.reduce((s,e)=>s+e.datapoints, 0)          // = 307
materialDatapoints = ESRS_STANDARDS.filter((_,i)=>materialTopics[i])
                                   .reduce((s,e)=>s+e.datapoints, 0)
```

`materialTopics[i]` is a boolean toggle array driven by the "Materiality Filter" tab — the user marks
which of the 11 topic standards are material, and `materialDatapoints` sums the datapoint counts of
just those. Everything else on the page is **static reference content**: the ESRS standards register,
per-standard disclosure-requirement (DR) tables (E1–E5, S1–S4, G1, ESRS 2), a framework crosswalk, an
Omnibus-change table, and an assurance-phase table. No PRNG-derived numbers drive any headline metric
(`sr` is imported but only used, if at all, for decorative chart jitter).

### 7.2 Parameterisation / reference tables

| Table | Rows | Content & provenance |
|---|---|---|
| `ESRS_STANDARDS` | 11 | ESRS 2 + E1–E5 + S1–S4 + G1; `datapoints` and `drs` counts per standard. **Real standard structure**, but counts are illustrative approximations (sum 307, not the official ~1,144 including sub-datapoints) |
| `E1_DATAPOINTS` | 10 | **Real** ESRS E1 disclosure requirements E1-1…E1-9 + AR, with correct methodology tags (GHG Protocol, ISO 14064, SBTi, TCFD, NGFS) |
| `E2–E5_DATAPOINTS` | 6–7 each | Real DRs with real methodology references (E-PRTR/IED, REACH/CLP, GRI 303, CDP Water, WRI Aqueduct) |
| `S1_DATAPOINTS` | 18 | Real Own-Workforce DRs |
| `G1_DATAPOINTS`, `ESRS2_DATAPOINTS` | 7 / 13 | Real Business-Conduct / General-Disclosure DRs |
| `CROSSWALK_MAP` | 15 | ESRS → GRI / ISSB / BRSR / SASB mapping (editorial crosswalk) |
| `OMNIBUS_CHANGES` | 9 | 2025 EU Omnibus simplification before/after + impact |
| `ASSURANCE_PHASES` | 5 | Limited → reasonable assurance roadmap (ISSA 5000 direction of travel) |

Note E1-7 is correctly tagged *GHG removals* and E1-8 *internal carbon pricing* (fixing the ordering
error flagged elsewhere in the platform's REM backlog for `csrd-xbrl`).

### 7.3 Calculation walkthrough

1. `ESRS_STANDARDS` renders the register; `totalDatapoints` sums the `datapoints` column (307).
2. On the Materiality Filter tab, the user toggles `materialTopics[i]` per standard.
3. `materialDatapoints` re-sums only the material standards' datapoint counts — the single dynamic KPI.
4. Detail tabs render the DR tables read-only; the crosswalk, Omnibus and assurance tabs are static.

### 7.4 Worked example

A company whose double-materiality assessment finds **E1 (Climate), S1 (Own Workforce), and G1
(Business Conduct)** material, plus the always-mandatory **ESRS 2**:

| Standard | datapoints | Material? |
|---|---|---|
| ESRS 2 | 35 | yes (always) |
| E1 | 42 | yes |
| S1 | 52 | yes |
| G1 | 18 | yes |
| others (E2–E5, S2–S4) | 160 | no |

`materialDatapoints = 35 + 42 + 52 + 18 = 147` of `totalDatapoints = 307` in scope → the reporter
sees a ~48% in-scope datapoint load. (Against the official ~1,144-datapoint universe the proportion
would differ; the code's counts are indicative, not the EFRAG line-item total.)

### 7.5 Companion reference content

- **Framework Crosswalk** — maps each ESRS DR to GRI, ISSB (IFRS S1/S2), India BRSR, and SASB, the
  key artefact for multi-standard reporters avoiding duplicate data collection.
- **Omnibus Impact Analyzer** — captures the 2025 EU Omnibus proposals (scope threshold changes,
  datapoint reductions) as before/after rows — genuinely useful given the regulation is in flux.
- **Assurance Roadmap** — the limited-→reasonable-assurance phase-in the CSRD mandates.

### 7.6 Data provenance & limitations

- **No synthetic scoring**: the module is a catalogue; its two computations are plain sums, so there is
  no `sr()`-fabricated headline number to caveat.
- **Datapoint counts are approximate**: the `datapoints` fields (sum 307) are illustrative and do not
  reconcile to the official EFRAG count (~1,144 incl. sub-datapoints) the guide cites — a reporter
  should treat these as topic-level scale indicators, not the legal line-item total.
- **The guide's scores do not exist**: no `obligation_weight`, no 1–5 collection-complexity score, no
  phase-in coverage rate. The materiality filter is a binary include/exclude, not a weighted obligation.
- Crosswalk mappings are editorial and require maintenance as ISSB/GRI interoperability guidance evolves.

**Framework alignment:** Content operationalises **EU Delegated Regulation 2023/2772** (ESRS Set 1):
ESRS 1 (general requirements incl. Article-37 phase-in provisions) and ESRS 2 (general disclosures)
sit cross-cutting, with topical E1–E5 / S1–S4 / G1 standards applied per **double materiality
assessment (DMA)**. Methodology tags cite the real underlying standards each DR relies on — **GHG
Protocol / ISO 14064** for E1-6 emissions, **SBTi** for E1-4 targets, **WRI Aqueduct** for E3 water
risk, **REACH/CLP** for E2 substances of concern. The crosswalk targets **GRI**, **ISSB IFRS S1/S2**,
and **SASB** interoperability. No production model is required — a navigator's job is faithful
reference structure, which the code substantially delivers (subject to the count caveat above).
