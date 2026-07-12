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
