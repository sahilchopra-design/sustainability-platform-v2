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
