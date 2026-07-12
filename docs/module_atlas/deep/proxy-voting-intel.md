## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a **voting-alignment score**
> `VA = (votes_aligned_to_policy / total_votes) × 100`. **No such ratio is computed.** The code's
> `issVote`/`glassLewis` are **seeded binary flags** (`sr(i·41) > 0.4 ? 'Aligned' : 'Divergent'`),
> not a percentage derived from a vote ledger. All 80 companies carry **real names and sectors** but
> **every voting metric is `sr()`-seeded** (resolutions, support %, say-on-pay, director election,
> abstention, engagements). The page is a filter/sort/paginate workbench over this synthetic book,
> with correct aggregate arithmetic on fabricated inputs.

### 7.1 What the module computes

Per company (80, real names Apple…Brookfield with hand-mapped sectors):

```js
totalRes    = round(sr(i·7)·15 + 3)                          // 3–18 total resolutions
esgRes      = round(totalRes × (sr(i·11)·0.4 + 0.1))         // 10–50% of total are ESG
avgSupport  = round(sr(i·13)·40 + 20)                        // 20–60 % support
mgmtOpposed = round(esgRes × (sr(i·17)·0.6 + 0.2))
resolutions = up to 5 items: {type (12-type list), support 15–65%, year 2023–24,
              result sr>0.7?'Passed':'Failed', filer (8 real filers)}
sayOnPayPct = round(sr(i·23)·25 + 70)                        // 70–95 %
directorElectionAvg = round(sr(i·29)·15 + 80)               // 80–95 %
issVote     = sr(i·41) > 0.4 ? 'Aligned' : 'Divergent'      // seeded flag, NOT a ratio
passedESG   = resolutions.filter(result='Passed').length
```

**Portfolio aggregates** (correct arithmetic over the seeded book):

```js
totalESGRes  = Σ esgResolutions
avgSupport   = round( Σ avgSupportPct / n )
totalPassed  = Σ passedESG
issAligned   = #{ issVote='Aligned' }
sectorVoting = per-sector mean of avgSupportPct and sayOnPayPct
resTypeDist  = histogram of resolution types across all companies' resolution lists
```

### 7.2 Parameterisation / provenance

| Field | Formula | Provenance |
|---|---|---|
| Company names / sectors | fixed arrays | **real** (80 large caps, hand-mapped) |
| Resolution filers | 8-name list | **real** (As You Sow, Follow This, ICCR, CalPERS…) |
| Resolution types | 12-type list | **real** ESG proposal taxonomy |
| totalRes / esgRes | `sr()` ranges | synthetic |
| avgSupportPct | `sr(i·13)·40 + 20` | synthetic (20–60%) |
| issVote / glassLewis | `sr() > threshold` flag | **synthetic; not a computed alignment** |
| sayOnPayPct, directorElectionAvg | `sr()` ranges | synthetic |

The **taxonomy is real** (proposal types, filers, proxy advisors) even though the **quantities are
fabricated** — a common pattern in this codebase.

### 7.3 Calculation walkthrough

1. `COS` seeds 80 companies; each gets a nested `resolutions` array (≤5) also seeded.
2. Filter (search/sector) + sort + paginate (12/page).
3. `stats` computes correct means/sums over the filtered set.
4. Charts: resolution-type histogram, sector support bars, ISS-alignment-by-sector
   (`#aligned/#total × 100` — a real ratio, but over the seeded flags), support-vs-abstention scatter.

### 7.4 Worked example (one company, i = 0 "Apple")

`sr(0·7)=sr(0)`, `sr(0·11)=sr(0)`, `sr(0·13)=sr(0)` — note the **seed collision**: for i=0 several
fields share `sr(0)` because `0×k = 0`. Suppose `sr(0) ≈ 0.30`:
`totalRes = round(0.30·15 + 3) = round(7.5) = 8`; `esgRes = round(8 × (0.30·0.4 + 0.1)) = round(8×0.22)
= 2`; `avgSupport = round(0.30·40 + 20) = 32%`; `issVote = sr(0)>0.4 ? … = 0.30>0.4 → 'Divergent'`.
The i=0 collision means Apple's total/ESG/support are all driven by the same draw — an artefact of the
`i·k` seeding when i=0.

### 7.5 Data provenance & limitations

- **Company/filer/type taxonomies are real; all voting numbers are synthetic**, seeded by
  `sr(seed)=frac(sin(seed+1)×10⁴)`.
- **`issVote`/`glassLewis` are seeded flags, not computed alignment** — the guide's `VA` ratio is not
  implemented at the company level (only a sector-level share of the seeded flags is charted).
- **Seed collision at i=0**: several fields reuse `sr(0)` (Apple), correlating metrics that should be
  independent.
- Resolution `support` for a nested resolution is drawn independently of the company `avgSupportPct`,
  so they need not reconcile.

**Framework alignment:** **ISS 2024 Proxy Voting Guidelines** and **Glass Lewis Benchmark Policy** are
the alignment references (the two proxy advisors whose recommendations institutions benchmark against);
**UN PRI Active Ownership 2.0** frames the stewardship metrics. The 12 resolution types and 8 filers
(As You Sow, Follow This, ICCR, ShareAction, Trillium, Mercy Investment, CalPERS, NYSCRF) are
accurate real-world stewardship actors. None of these frameworks' quantitative scoring is implemented;
the page renders a plausible-looking but synthetic voting universe. (A real alignment model mirrors
the spec in `proxy-voting-climate` §8.)
