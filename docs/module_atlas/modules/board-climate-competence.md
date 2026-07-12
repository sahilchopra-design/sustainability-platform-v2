# Board Climate Competence
**Module ID:** `board-climate-competence` · **Route:** `/board-climate-competence` · **Tier:** B (frontend-computed) · **EP code:** EP-CP5 · **Sprint:** CP

## 1 · Overview
25 companies with director-level climate expertise scoring, climate committee status, and peer benchmarking.

**How an analyst works this module:**
- Competence Dashboard shows 25 companies ranked by score
- Director Profiles detail individual expertise
- Climate Committee Status checks existence and mandate

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COMPANIES` | 26 | `sector`, `expertise`, `structure`, `accountability`, `score`, `committee`, `meetingFreq`, `directors`, `climateExp`, `training`, `diversityScore` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sectors` | `[...new Set(COMPANIES.map(c => c.sector))];` |
| `filtered` | `useMemo(() => sectorFilter === 'All' ? COMPANIES : COMPANIES.filter(c => c.sector === sectorFilter), [sectorFilter]); const avgScore = filtered.length ? Math.round(filtered.reduce((s, c) => s + c.score, 0) / filtered.length) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Companies | — | Governance data | With board-level climate data |
| Avg Competence Score | — | Assessment | Significant room for improvement |

## 5 · Intermediate Transformation Logic
**Methodology:** Board climate competence scoring
**Headline formula:** `Score = Expertise(30) + Committee(25) + Training(20) + Diversity(15) + Accountability(10)`

Director profiles: climate expertise, relevant experience, training history. Climate committee: existence, mandate, meeting frequency. Competence score 0-100.

**Standards:** ['UK Corporate Governance Code', 'TCFD']
**Reference documents:** UK Corporate Governance Code; TCFD Good Practice Handbook

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states a weighted competence score:
> `Score = Expertise(30) + Committee(25) + Training(20) + Diversity(15) +
> Accountability(10)`. **The code does not compute this.** Each company's `score` is a
> **pre-baked constant** in the `COMPANIES` seed table (e.g. Shell `score:73`, Ørsted
> `score:92`, Exxon `score:31`), sitting alongside its component fields
> (`expertise`, `structure`, `accountability`, `training`, `diversityScore`) but
> *not* derived from them by any weighting. The only live calculation on the page is a
> filtered average of these stored scores. §8 specifies the scoring model the guide
> describes.

### 7.1 What the module computes

```js
sectors  = unique(COMPANIES.sector)
filtered = sectorFilter==='All' ? COMPANIES : COMPANIES.filter(c => c.sector===sectorFilter)
avgScore = round(Σ filtered.score / filtered.length)
```

That is the entirety of the computation: a sector filter and a mean of the stored
`score` field across 25 (the data table actually holds 25) companies. Radar and bar
charts read the component sub-fields directly; no weighted composite is recomputed.

### 7.2 Parameterisation / scoring rubric

The guide's intended rubric (not implemented):

| Component | Weight | Field in data |
|---|---|---|
| Climate expertise | 30 | `expertise` |
| Climate committee | 25 | `committee`/`structure` |
| Training | 20 | `training` |
| Diversity | 15 | `diversityScore` |
| Accountability | 10 | `accountability` |

`COMPANIES` (25 rows) carry real named issuers with plausible governance attributes:
`committee` (bool), `meetingFreq` (0–10/yr), `directors`, `climateExp` (# climate-
literate directors), and the 0–100 sub-scores. Illustrative extremes: Ørsted 92,
Unilever 88, BHP 86, Schneider 85 (top); Exxon 31, ArcelorMittal 52, Toyota 54
(bottom — all lacking a climate committee, `committee:false`, `meetingFreq:0`).

### 7.3 Calculation walkthrough

1. Load the 25-company table.
2. Apply the sector filter (Oil & Gas, Mining, Banking, Consumer, Auto, Materials,
   Utilities, Industrials, Tech).
3. Average the stored `score` for the KPI card.
4. Director-profile, committee-status, training and diversity tabs display the
   corresponding stored fields; peer-benchmarking ranks companies by `score`.

### 7.4 Worked example

Filter = Oil & Gas (Shell 73, BP 78, Exxon 31, TotalEnergies 69, Equinor 81):

| Step | Computation | Result |
|---|---|---|
| Sum | 73+78+31+69+81 | 332 |
| Count | 5 | — |
| Avg score | round(332/5) | **66** |

If instead the guide's rubric were applied to Shell (`expertise 72`, committee=true→
say 80, `training 65`, `diversityScore 72`, `accountability 68`):
`0.30×72 + 0.25×80 + 0.20×65 + 0.15×72 + 0.10×68 = 21.6+20+13+10.8+6.8 = 72.2` — close
to the stored 73, suggesting the seed scores were *hand-tuned to look like* the rubric
but are not generated by it, so they cannot respond to edits in the component fields.

### 7.5 Data provenance & limitations

- Company scores and sub-fields are **hand-set demo data** (no PRNG, no real
  governance data feed). They are static; changing `training` or `diversityScore`
  would not move `score`.
- The advertised weighted rubric is **not executed** — the page is a display of
  fixed assessments plus a mean.
- No time series, no evidence links (proxy statements, TCFD reports), no inter-rater
  reliability — it is a snapshot leaderboard.

**Framework alignment:** UK Corporate Governance Code (board oversight, committee
structure — reflected in `committee`/`meetingFreq`) · TCFD Governance pillar (a)
board oversight & (b) management role — the `expertise`/`accountability` fields proxy
these · ISSB S2 governance disclosures. The rubric is a reasonable operationalisation
of TCFD governance, but here it is asserted per company rather than computed.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Produce a transparent, evidence-linked board climate-
competence score that responds to underlying inputs, for investor stewardship,
proxy-voting and engagement prioritisation.

**8.2 Conceptual approach.** A **weighted additive scorecard** (the guide's rubric)
grounded in disclosed evidence, benchmarked against **TCFD Governance** and
governance-rating practice (**ISS Governance QualityScore, MSCI, Sustainalytics**),
with sector normalisation so high-emitting sectors are held to the committee/expertise
criteria most material to them.

**8.3 Mathematical specification.**
```
Score_c = 0.30·Expertise_c + 0.25·Committee_c + 0.20·Training_c
        + 0.15·Diversity_c + 0.10·Accountability_c            (each sub-score 0–100)
Committee_c = f(exists, mandate_breadth, meeting_freq, independent_chair)
Expertise_c = min(100, 100 · climate_literate_directors / board_size · adj_relevance)
Peer_z = (Score_c − μ_sector) / σ_sector                       (sector-normalised)
Materiality_weight_sector applied to reweight Expertise/Committee for high-impact sectors
```

| Parameter | Source |
|---|---|
| Sub-score inputs | Proxy statements, TCFD/ISSB reports, board bios (NLP-extracted) |
| Component weights | TCFD Governance materiality; calibrated to investor engagement outcomes |
| Sector norms | Peer distribution per GICS sector |
| Materiality weights | SASB/ISSB sector materiality map |

**8.4 Data requirements.** Board composition & bios, committee charters, meeting
frequency, training disclosures, diversity data, remuneration-linkage flags —
extractable from proxy statements and sustainability reports. None currently ingested
(all hand-set).

**8.5 Validation & benchmarking.** Reconcile against ISS/MSCI governance scores
(rank correlation); inter-rater reliability on the qualitative sub-scores; back-test
whether high scores predict lower climate-governance controversies; sensitivity on
the committee and expertise weights.

**8.6 Limitations & model risk.** Governance disclosure is self-reported and gameable;
"climate expertise" is hard to verify; weights are judgemental. Conservative fallback:
require evidence links for each sub-score, mark unverified components as null (do not
impute), and report the sector-normalised z-score alongside the raw score.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the weighted rubric and source director data (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide's weighted score (`Score = Expertise(30) + Committee(25) + Training(20) + Diversity(15) + Accountability(10)`) is **not computed** — each company's `score` is a pre-baked constant in the 25-row `COMPANIES` seed sitting *beside* its component fields but never derived from them; the only live calc is a filtered mean of the stored scores. Evolution A implements the rubric the module already documents and sources its inputs.

**How.** (1) Compute the composite from the component sub-fields per the documented weights — a small, purely deterministic change that makes the score reproducible from `expertise/committee/training/diversityScore/accountability` rather than asserted. (2) Source the component data: board climate-committee existence and meeting frequency are disclosed in proxy statements/annual reports; director climate credentials can be assembled from board bios. Even a curated-but-cited dataset (with a `source_url` and vintage per company) beats the current unattributed constants. (3) Publish the weight rationale per Atlas §8, since the 30/25/20/15/10 split is authorial. (4) Rung 3: benchmark the composite against an external board-governance index (Spencer Stuart Board Index, referenced by the sibling module) for the overlapping issuers and report rank correlation. As a backend vertical, `POST /api/v1/board-competence/score`.

**Prerequisites.** A sourced governance dataset (the 25 companies are real names — their board attributes are publicly disclosable but currently uncited); a decision on refresh cadence (board composition changes annually). **Acceptance:** each company's score equals the weighted sum of its components (verifiable by hand); components carry source and vintage; the composite rank-correlates with the external index and the deviation is published.

### 9.2 Evolution B — Board-governance stewardship copilot (LLM tier 1 → 2)

**What.** Active-ownership teams use board-competence data for engagement, so the copilot's tier-1 job is comparison and explanation: "how does Shell's board climate competence compare to Equinor's?", "which Oil & Gas issuers lack a climate committee?" (Exxon, per §7.2's `committee:false` extremes), "what drives Ørsted's 92?" — grounded in this Atlas record with the honest caveat that scores are currently stored constants, not computed (until Evolution A). Tier 2 runs the scoring rubric as a tool for what-if engagement planning.

**How.** Tier-1 corpus from this record (§7.2 rubric table, the company extremes); the refusal path discloses that the composite is not yet derived from its components. Tier 2 tool schemas over the Evolution-A scoring route; "if this company added two climate-expert directors and a committee, what score would it reach?" becomes a tool call recomputing from adjusted components — directly useful for stewardship engagement asks. The copilot cites the weight rationale and, once Evolution A benchmarks against Spencer Stuart, contextualises scores against the external index.

**Prerequisites.** Copilot router (tier 1); Evolution A's rubric implementation (tier 2 — a what-if is only meaningful once the score is a function of inputs). **Acceptance:** tier-1 answers label scores as stored constants pre-Evolution-A; tier-2 what-ifs recompute from adjusted components and trace to the scoring tool; engagement scenarios state which components they changed.