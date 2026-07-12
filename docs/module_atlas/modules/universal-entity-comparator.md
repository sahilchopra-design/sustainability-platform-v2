# Universal Entity Comparator
**Module ID:** `universal-entity-comparator` · **Route:** `/universal-entity-comparator` · **Tier:** B (frontend-computed) · **EP code:** EP-CW1 · **Sprint:** CW

## 1 · Overview
15 entities (FI/Energy/Corporate) compared side-by-side across 8 L1 taxonomy topics.

**How an analyst works this module:**
- Side-by-Side shows 4 entities compared
- Taxonomy Comparison drills into L1→L4 differences

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `ENTITIES`, `ENTITY_COLORS`, `KPI`, `L1_LABELS`, `L1_TOPICS`, `L2_DATA`, `Pill`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ENTITIES` | 91 | `name`, `type`, `sector`, `scores`, `env`, `soc`, `gov`, `climate`, `bio`, `supply`, `human`, `innovation` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Side-by-Side','Taxonomy Comparison','Score Spider','Gap Analysis','Historical Comparison','Export'];` |
| `radarData` | `useMemo(() => L1_TOPICS.map(t => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENTITIES`, `ENTITY_COLORS`, `L1_TOPICS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Entities | — | Cross-type | 5 FIs, 5 energy, 5 corporates |

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-entity radar comparison
**Headline formula:** `Gap = EntityA_score - EntityB_score per topic`

Compare up to 4 entities of any type. RadarChart overlay shows profile shape differences.

**Standards:** ['Taxonomy assessment']
**Reference documents:** Taxonomy Assessment Framework

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

15 real, named companies (5 Financial Institutions, 5 Energy companies, 5 Corporates — exactly
matching the guide's stated composition) each carry **hand-set, illustrative** scores across 8 L1
ESG/climate topics (Environmental, Social, Governance, Climate, Biodiversity, Supply Chain, Human
Rights, Innovation) plus a 5-quarter score history. This is one of the platform's more curated
reference datasets — no PRNG generates the entity roster or its scores; the seeded PRNG `sr()` is
used exactly once, for a decorative L2 sub-topic drill-down jitter.

```
gap(topic) = entity[0].scores[topic] − entity[1].scores[topic]     // pairwise comparison only
L2_subtopic_score = L1_topic_score + (sr(seed)×2−1)×12              // ±12-point jitter around parent
```

### 7.2 Parameterisation

| Element | Values | Provenance |
|---|---|---|
| `ENTITIES` (15) | JPMorgan Chase, HSBC, Allianz, BlackRock, BNP Paribas (5 FI); Shell, TotalEnergies, Enel, NextEra Energy, BP (5 Energy); Microsoft, Unilever, Siemens, Nestlé, Tesla (5 Corporate) | Real, named companies with hand-set illustrative scores across 8 dimensions — directionally realistic (Shell/BP lowest Environmental & Climate scores 42–48/35–42; NextEra Energy & Microsoft highest Environmental 78–82; Tesla highest Innovation 95 but lowest-tier Governance 60 and Human Rights 52, reflecting real market commentary on Tesla's governance controversies) |
| `L1_TOPICS` (8) | Environmental, Social, Governance, Climate, Biodiversity, Supply Chain, Human Rights, Innovation | Platform-defined comprehensive ESG+climate+nature+social taxonomy |
| `L2_DATA` | 4 sub-topics per L1 topic (e.g. Environmental → Emissions Mgmt, Waste & Circular, Water Stewardship, Pollution Prevention) | Real, standard ESG sub-category naming |
| `history` (5 quarters, Q1-25→Q1-26) | Per-entity trajectory, generally +1 to +2 points/quarter improvement | Hand-set, monotonically improving for all 15 entities — a simplification (no entity shows deterioration, which understates realistic dispersion in the sector) |

### 7.3 Calculation walkthrough

1. **Side-by-Side comparison**: up to 4 selected entities (default: JPMorgan, Shell, Microsoft,
   Tesla — one from each archetype plus a second) rendered with all 8 topic scores side by side.
2. **Score Spider (radar)**: overlays the selected entities' 8-topic score profiles on one radar
   chart — a direct pass-through of the hand-set scores, genuinely useful for visual profile-shape
   comparison.
3. **Gap Analysis**: computes a simple difference (`entity[0] − entity[1]`) per topic — only
   meaningful for exactly 2 selected entities; with 3–4 selected, the "gap" column still only
   compares the first two.
4. **Taxonomy Comparison (L1→L2 drill-down)**: for the selected `drillTopic`, generates 4 sub-topic
   scores per entity by jittering the parent L1 score by up to ±12 points using `sr()` — this is
   **not an independently assessed sub-topic score**, just decorative variation around the known
   parent value, so e.g. Shell's "Emissions Mgmt" sub-score under Environmental will always be close
   to its 45 Environmental score, never meaningfully diverge from it.
5. **Historical Comparison**: line chart of the 5-quarter trajectory per selected entity.

### 7.4 Worked example (Gap Analysis: JPMorgan vs Shell, Environmental topic)

| Entity | Environmental score |
|---|---|
| JPMorgan Chase (E1) | 72 |
| Shell plc (E5) | 45 |
| **Gap** | **72 − 45 = 27** |

Across all 8 topics, JPMorgan leads Shell most narrowly on Governance (81 vs 72, gap=9) and most
widely on Climate (65 vs 38, gap=27) — a directionally sensible pattern reflecting the real-world
narrative that a diversified bank scores closer to an oil major on governance/board-structure
basics than on climate-transition metrics, where the oil major's stranded-asset exposure and
transition-plan credibility drag its score down substantially.

### 7.5 Companion analytics

- **Export tab** — presumably exports the comparison table/chart data for the selected entities
  (not independently verified in this review's read window).
- **Watchlist** — lets users flag entities for tracking, a UI convenience with no scoring effect.

### 7.6 Data provenance & limitations

- **Entity scores are hand-set illustrative values, not derived from any live ESG data feed**
  (MSCI, Sustainalytics, CDP, or the platform's own DME engine) — they should be read as
  representative demo values consistent with each company's general public reputation on climate
  and ESG matters, not as an actual current rating.
- **L2 sub-topic scores are synthetic noise around the parent L1 score**, not independently assessed
  — the "Taxonomy Comparison" tab cannot reveal genuine within-topic strengths/weaknesses (e.g. an
  entity strong on "Water Stewardship" but weak on "Pollution Prevention" within Environmental) since
  both would just jitter around the same parent value.
- **Gap Analysis only compares the first 2 of up to 4 selected entities** — a UI/logic limitation
  when 3 or 4 entities are selected.
- All 15 entities show a monotonically improving 5-quarter history, which is not representative of
  real-world ESG score volatility (real ratings do decline for individual issuers, e.g. following
  controversies or restated disclosures).

### 7.7 Framework alignment

- **Multi-framework taxonomy comparison**: the 8-topic structure spans what would in practice be
  drawn from several distinct standards — Environmental/Social/Governance (SASB/GRI-style),
  Climate (TCFD/ISSB IFRS S2), Biodiversity (TNFD), Supply Chain (CSDDD-style due diligence), Human
  Rights (UNGPs), Innovation (platform-specific) — though the module does not label which framework
  underlies each topic's scoring rubric.
- **Cross-entity-type comparison** (FI vs Energy vs Corporate): a genuinely useful design choice,
  since real institutional investors do need to benchmark holdings across sectors on a common ESG
  scale despite very different underlying materiality profiles per sector.

## 9 · Future Evolution

### 9.1 Evolution A — Live entity scores from platform engines with real L2 assessment (analytics ladder: rung 1 → 2)

**What.** The comparator's mechanics are sound (radar overlay, pairwise gap math) but
its substance is hand-set: §7.6 notes the 15 named companies' scores come from no data
feed — not MSCI/CDP inputs, not even the platform's own DME engine — the L2 drill-down
is ±12-point jitter around the parent L1 score (so within-topic strengths can never
diverge), and all 15 entities improve monotonically over the 5-quarter history.
Evolution A replaces the hand-set `ENTITIES` scores with entity records resolved
through the platform's entity layer (GLEIF `entity_lei` for identity; DME materiality
scores and disclosure-module outputs where they exist for the 15 issuers), and makes
L2 sub-topics independently scored fields rather than jitter, so "Taxonomy Comparison"
becomes a real diagnostic.

**How.** (1) A backend `GET /api/v1/entity-comparator/entities` route joining the
refdata/DME tables, with per-field provenance (`source`, `as_of`) so hand-set fallback
values are labelled. (2) Fix the documented Gap Analysis limitation — it silently
compares only the first 2 of up to 4 selected entities; compute pairwise or
vs-selection-mean gaps. (3) Allow score histories to decline, sourcing quarterly
snapshots from stored assessment runs.

**Prerequisites.** The seeded-jitter L2 rendering (a documented decorative-data
instance) must be removed, not papered over; DME coverage check for the 15 issuers.
**Acceptance:** an entity can show a strong Water Stewardship and weak Pollution
Prevention sub-score simultaneously; every displayed score carries a provenance label;
4-entity Gap Analysis reports all pairs.

### 9.2 Evolution B — Comparison-memo copilot (LLM tier 1 → 2)

**What.** The module's output is inherently narrative — analysts compare 4 entities
and then write up why profiles differ. Evolution B adds a copilot that turns the
current selection state into a sourced comparison memo: "JPMorgan leads Shell by 27 on
Climate but only 9 on Governance" with the interpretation grounded in the Atlas page's
own framework mapping (§7.7: Climate ← TCFD/ISSB, Biodiversity ← TNFD, Human Rights ←
UNGPs), and honest caveats that scores are illustrative until Evolution A lands. The
tier-2 step lets it call the comparator route to pull entities not currently selected
("add TotalEnergies to this comparison and re-rank").

**How.** Tier-1 first: no new backend — the memo is generated from the page's selected
entities and score state plus the embedded Atlas record in `llm_corpus_chunks`, per
the standard copilot stack (`POST /api/v1/copilot/universal-entity-comparator/ask`).
Tier-2 adds Evolution A's `GET /entities` as the single read-only tool. Every numeric
in the memo must match the selection state; the validator enforces it.

**Prerequisites.** pgvector corpus (roadmap D3); the system prompt must state the
current hand-set provenance explicitly so memos carry the caveat verbatim.
**Acceptance:** generated memo contains no score not present in the selection state;
asked "what's Shell's current MSCI rating?", the copilot refuses and names what the
module actually holds.