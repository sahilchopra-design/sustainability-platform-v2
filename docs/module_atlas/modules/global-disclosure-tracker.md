# Global Disclosure Tracker
**Module ID:** `global-disclosure-tracker` · **Route:** `/global-disclosure-tracker` · **Tier:** B (frontend-computed) · **EP code:** EP-CR2 · **Sprint:** CR

## 1 · Overview
12 jurisdictions with cross-walk matrix, gap analysis, timeline, and compliance cost estimator.

**How an analyst works this module:**
- Jurisdiction Map shows 12 regulatory regimes
- Cross-Walk Matrix highlights overlaps and gaps
- Timeline shows effective dates and deadlines

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CROSSWALK`, `DEADLINES`, `JURISDICTIONS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `JURISDICTIONS` | 13 | `name`, `requirements`, `mandatory`, `effective`, `scope`, `overlap`, `uniqueReqs`, `costEstKUsd` |
| `DEADLINES` | 8 | `jurisdiction`, `type` |
| `CROSSWALK` | 9 | `eu`, `uk`, `us`, `hk`, `sg`, `au`, `jp` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Jurisdiction Map','Requirement Cross-Walk','Gap Analysis','Timeline & Deadlines','Overlap Efficiency','Compliance Cost Estimator'];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CROSSWALK`, `DEADLINES`, `JURISDICTIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Jurisdictions | — | Regulatory mapping | Global coverage |
| Unique Requirements | — | Cross-walk | Requirements not shared with any other jurisdiction |

## 5 · Intermediate Transformation Logic
**Methodology:** Cross-jurisdiction requirement mapping
**Headline formula:** `Overlap = SharedRequirements / UnionOfRequirements`

12 jurisdictions: EU (CSRD), UK (TPT/SDR), US (SEC), HK, SG, AU, JP, KR, BR, IN, CA, ZA. Cross-walk shows which requirements overlap and which are unique per jurisdiction.

**Standards:** ['ISSB', 'EFRAG', 'SEC', 'HKEX']
**Reference documents:** ISSB IFRS S1/S2; EFRAG ESRS; SEC Climate Rule

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The Global Disclosure Tracker (EP-CR2) is a **regulatory cross-walk reference tool**: it maps ESG
disclosure requirements across 12 jurisdictions, showing overlaps, gaps, effective dates, and a
compliance-cost estimate. There is no calculation engine beyond one overlap ratio; all data is
static, curated regulatory fact. No guide↔code mismatch.

### 7.1 What the module computes

The only formula (guide) is the overlap ratio:

```
Overlap = SharedRequirements / UnionOfRequirements
```

In the code this is pre-computed as the `overlap` field on each jurisdiction (e.g. EU 82%, India
48%), plus a `uniqueReqs` count. There is no runtime derivation — the tabs render the static
`JURISDICTIONS`, `DEADLINES`, and `CROSSWALK` tables and a boolean-matrix view.

### 7.2 Parameterisation (real regulatory data)

`JURISDICTIONS` (12 rows) — **genuine regulatory facts**:

| Jurisdiction | Requirements | Effective | Overlap % | Unique | Cost $K |
|---|---|---|---|---|---|
| EU (CSRD/ESRS) | 35 | Jan 2024 | 82 | 6 | 450 |
| UK (TPT/SDR) | 22 | Apr 2024 | 72 | 4 | 280 |
| US (SEC Climate) | 18 | Jan 2025 | 65 | 5 | 350 |
| HK (HKEX) | 20 | Jan 2025 | 68 | 3 | 220 |
| SG (SGX/MAS) | 16 | Jul 2025 | 62 | 2 | 180 |
| Japan (SSBJ) | 18 | Apr 2025 | 75 | 2 | 250 |
| India (BRSR) | 15 | Active | 48 | 5 | 120 |

(plus AU, KR, BR, CA, ZA). Effective dates, framework names and scope thresholds are accurate as of
authoring. `CROSSWALK` (8 requirements × 7 jurisdictions) is a boolean matrix: e.g. **Double
Materiality** and **Biodiversity** are EU-only; **GHG Scope 1+2** is universal; **Scope 3** is
everywhere except Singapore. `DEADLINES` sequences the CSRD Wave 1/2, SEC, SSBJ, MAS timeline.

### 7.3 Calculation walkthrough

1. Jurisdiction Map renders `JURISDICTIONS` with overlap/unique/cost.
2. Cross-Walk Matrix renders the `CROSSWALK` boolean grid (which requirement applies where).
3. Gap Analysis highlights requirements unique to one jurisdiction (the `uniqueReqs` count).
4. Timeline orders `DEADLINES` by effective date.
5. Overlap Efficiency reads the `overlap` field; Cost Estimator sums `costEstKUsd` across selected
   jurisdictions.

### 7.4 Worked example (EU overlap & multi-jurisdiction cost)

EU: `overlap = 82%`, `uniqueReqs = 6`, `requirements = 35`. Reading the overlap ratio: of EU's 35
requirements, ~82% are shared with at least one other regime, leaving 6 EU-unique items (double
materiality, biodiversity, extended social metrics). A company reporting under EU + UK + US would face
a compliance-cost estimate of 450 + 280 + 350 = **$1,080K**, before de-duplication savings from the
82%/72%/65% overlaps.

### 7.5 Data provenance & limitations

- **All data is curated real regulatory fact** — no `sr()` PRNG anywhere; effective dates and
  framework names are accurate as of the authoring date but will drift as rules finalise.
- The `overlap`, `uniqueReqs`, and `costEstKUsd` figures are **estimates/judgements**, not computed
  from a normalised requirement taxonomy — the overlap ratio is asserted, not derived cell-by-cell.
- Cost estimates are illustrative order-of-magnitude, not firm-specific.
- Guide says 12 jurisdictions; the code table has 12 rows (EU…ZA); the CROSSWALK boolean grid covers
  only 7 columns.

**Framework alignment:** *ISSB IFRS S1/S2* — the baseline most jurisdictions (SSBJ, SGX, AASB, HKEX)
build on; the cross-walk shows convergence toward ISSB. *EFRAG ESRS* — the EU's double-materiality and
biodiversity requirements are the main divergence from ISSB. *SEC Climate Rule* — US financial-effects
and Scope 1+2 (Scope 3 dropped). *TPT/SDR* (UK). The tracker's value is mapping the ISSB-vs-ESRS
interoperability gap that these standards create.

*(No §8 model specification required — the module is a static regulatory reference cross-walk, not a
quantitative risk/financial model producing synthetic quantities.)*

## 9 · Future Evolution

### 9.1 Evolution A — Cell-level requirement taxonomy with derived overlap ratios (analytics ladder: rung 1 → 2)

**What.** §7 describes a regulatory cross-walk reference tool over 12 jurisdictions (EU CSRD, UK TPT/SDR, US SEC, HK, SG, AU, JP, KR, BR, IN, CA, ZA) that is curated real regulatory fact with no PRNG — but whose only "engine" is a single overlap ratio that is asserted, not derived: the `overlap`, `uniqueReqs`, and `costEstKUsd` figures are estimates/judgements rather than computed from a normalised requirement taxonomy, and the CROSSWALK boolean grid covers only 7 of the 12 jurisdictions. Evolution A builds the normalised taxonomy so `Overlap = SharedRequirements/UnionOfRequirements` is computed cell-by-cell: decompose each jurisdiction's disclosure regime into atomic requirements mapped to a common ISSB-anchored datapoint spine (shared with the `framework-interop` sibling's crosswalk), then derive overlaps and unique-requirement counts from set operations rather than typing them in.

**How.** (1) A requirement taxonomy table (datapoint ID × jurisdiction applicability) covering all 12 jurisdictions, not 7. (2) Overlap and uniqueReqs computed from the set intersection/union per jurisdiction pair. (3) The compliance-cost estimator driven by a per-requirement effort model (requirement count × effort factor) rather than an order-of-magnitude judgement, cross-referencing the `framework-interop` effort logic.

**Prerequisites.** The atomic requirement taxonomy digitised into refdata (the ESRS/ISSB catalogs are already in the DB); alignment with `framework-interop` so the two modules share one datapoint spine. **Acceptance:** overlap ratios recompute from the requirement sets and match the displayed figures within tolerance; all 12 jurisdictions appear in the crosswalk grid; cost estimates scale with requirement counts.

### 9.2 Evolution B — Multi-jurisdiction compliance-planning copilot (LLM tier 1 → 2)

**What.** A copilot for group sustainability teams: "we list in the EU, US, and Singapore — what's our combined disclosure obligation, where do requirements overlap, and what's the sequencing by deadline?" narrates the jurisdiction map, crosswalk, and timeline from the atlas corpus, and tier-2 tool-calls the Evolution A overlap/cost endpoints to compute the unified requirement set and effort estimate.

**How.** Tier 1 is credible because §7 confirms the data is accurate regulatory fact; the copilot cites specific effective dates and framework names, flagging that they drift as rules finalise. The distinctive value is mapping the ISSB-vs-ESRS interoperability gap the tracker exists to surface, and sequencing data collection against the deadline timeline. Tier 2 computes the exact overlap and cost for the user's jurisdiction mix. Guardrail: cost figures flagged as illustrative until Evolution A derives them.

**Prerequisites.** Corpus embedding; Evolution A for computed overlap/cost. **Acceptance:** every jurisdiction requirement or deadline cited traces to the curated data; post-Evolution-A the unified-requirement and cost answers match the endpoint output for the selected jurisdictions.