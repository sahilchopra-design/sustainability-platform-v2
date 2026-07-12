## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. The sections below document
`backend/services/dme_factor_registry.py` — the DME Unified Factor Taxonomy — exposed at
`/api/v1/dme-factor-registry` via `backend/api/v1/routes/dme_factor_registry.py`.)*

### 7.1 What the module computes

A **queryable factor taxonomy**, not a numeric model. It merges two factor universes into one
in-memory registry of **658 `FactorDefinition` rows**:

1. **DME taxonomy: 627 factors** — 209 base topics × 3 materiality dimensions, generated
   combinatorially at first call:
   ```
   factor_id = {PILLAR}-{index:03d}-{I|R|O}     e.g. ENV-001-I / ENV-001-R / ENV-001-O
   dimensions: Impact (annual) · Risk (monthly) · Opportunity (annual)
   ```
   Topic counts per pillar: environmental 69, social 56, governance 42, technology 24,
   sectoralStructure 18 (= 209).
2. **Risk Analytics overlay factors: 31** — `OVR-ESG-001…010`, `OVR-GEO-001…009`,
   `OVR-TEC-001…012`, each an explicit mapping onto a hard-coded registry in
   `services/factor_overlay_engine.py` (via `overlay_registry_key`), carrying units,
   regulatory references and source attributions (e.g. Green Bond Premium ↔
   `GREEN_BOND_PREMIUM_BPS`, "CBI 2024").

Endpoints: `GET /factors` (paged), `GET /factors/{id}`, `POST /search` (pillar / topic /
source / dimension / velocity-method / free-text filters), `GET /stats`,
`GET /overlay-mapping`, `GET /ref/pillars`, `GET /ref/dme-topics`, and `POST /compare`
(closest-overlay matching, §7.3).

### 7.2 Parameterisation — the factor schema

Each `FactorDefinition` carries velocity-tracking metadata consumed by the DME velocity engine:

| Field | Default | Meaning |
|---|---|---|
| `velocity_method` | `z_score` (DME) / `static` (overlays) | how temporal change is measured (z_score, exposure_led, sentiment_led, policy_led, hawkes_process, percentage, static) |
| `ewma_alpha` | 0.2 | EWMA smoothing for velocity computation |
| `alert_watch / elevated / critical / extreme` | 1.5 / 2.0 / 3.0 / 4.0 | z-score alert ladder |
| `signal_decay` | `medium` | instant → permanent decay class |
| `data_frequency` | monthly (risk dim) / annual (impact & opportunity) | sampling cadence |
| `pcaf_dq` | 4 for topics containing "GHG"/"Carbon"/"Emission", else None | default PCAF data-quality assumption |
| `regulatory_refs` | per overlay factor | framework + reference + relevance (ESRS E1-6, TCFD Strategy-b, EU GBS Art 6-8, TNFD LEAP-A3, EUDR 2023/1115, CBAM 2023/956, EU Methane Reg 2024/1787, SFDR Art 7, CSRD ESRS 1, EU Taxonomy CC-M7.1) |

Overlay factor descriptions name their intended data anchors (PRI IPR 2024, CBI 2024,
IPBES/Swiss Re, WHO/Lancet 2024, MSCI 2024, JLL/CBRE 2024, IEA 2024, WB WGI + OECD CRC +
Maplecroft, EIU GFSI, DESI) — these are *provenance labels on the mapping*, the numeric tables
themselves live in `factor_overlay_engine.py`.

### 7.3 Calculation walkthrough

The registry is built once and memoised (`_cache`). All query methods are list comprehensions
over that cache — `search_factors` applies conjunctive filters then pages, `get_stats`
aggregates counts by source/pillar/dimension/velocity-method and derives
`dme_base_factors = 209` by stripping the `-I/-R/-O` suffix. The one piece of scoring logic is
**`compare_factor`**, a coverage cross-walk from a DME factor to overlay factors:

```
relevance = 1·(same pillar) + 1·(same materiality dimension)
          + 3·(topic substring match either direction)
```

sorted descending, top 5 returned with `has_overlay_coverage`. E.g. `ENV-001-R`
("Climate Transition – Risk") scores 5 against `OVR-ESG-001` (Transition Risk PD Multiplier:
same pillar +1, same dimension +1, topic "Climate Transition" exact +3) — flagging that the
DME signal has a quantified overlay counterpart in the credit-risk engines.

### 7.4 Worked example — registry arithmetic and one search

Registry size: `209 topics × 3 dimensions = 627` DME rows `+ 31` overlays `= 658` total —
exactly what `GET /stats` reports (`by_source: {dme: 627, overlay_esg: 10, overlay_geo: 9,
overlay_tech: 12}`; `by_materiality`: impact 209 + overlay impacts, risk 209 + overlay risks,
opportunity 209 + overlay opportunities). A search
`POST /search {"pillar": "environmental", "materiality_dimension": "risk", "search_text":
"water"}` walks the 658 rows: pillar filter → 207 + env overlays; dimension filter → 69 + risk
overlays; text filter keeps rows whose name/topic/description contains "water" → `ENV-015-R`
Water Stress, `ENV-016-R` Water Consumption Intensity, `ENV-041-R` Freshwater Ecosystem Impact
(IDs illustrative of the generation order: the NNN index is the topic's position in the pillar
list). Each result carries the full velocity/alert metadata block of §7.2.

### 7.5 Data provenance & limitations

- **No PRNG and no measured values** — this module holds *definitions only*; `FactorValueSnapshot`
  (Layer 2) and velocity series (Layer 3) are schema classes whose persistence lives in the
  migration-054 tables and other engines. Nothing here fabricates entity data.
- The 627-factor expansion is **combinatorial**: names are `"{topic} - {Dimension}"` and
  `sub_topic` is the placeholder `"{topic} Detail {i}"` — taxonomy scaffolding, not curated
  per-factor documentation. The `pcaf_dq = 4` default for emissions-related topics is a blanket
  assumption.
- Alert thresholds (1.5/2/3/4σ), `ewma_alpha = 0.2` and dimension→frequency choices are DME
  calibrations applied uniformly to all DME factors; overlays are `static` (no velocity
  tracking) by design.
- `compare_factor`'s relevance score is a coarse lexical/pillar heuristic (max 5) — adequate
  for "is there overlay coverage?" but not a semantic ontology alignment.
- The in-memory cache means edits to the topic lists require a process restart; pagination caps
  at 500 per page.

### 7.6 Framework alignment

- **Double materiality (CSRD/ESRS)** — the I/R/O trisection generalises ESRS's impact vs
  financial materiality into impact / risk / opportunity dimensions per topic; overlay factors
  cite specific ESRS datapoints (E1-6 GHG, E2-4 pollution, E4-5 biodiversity).
- **TCFD / ISSB S2, TNFD** — cross-referenced on transition-risk and nature factors (TCFD
  Strategy-b; TNFD LEAP-A3 dependencies), matching the module docstring's stated
  ESRS-IG3/ISSB/TCFD cross-reference intent.
- **PCAF DQS** — the 1–5 quality ladder appears as per-factor default data-quality metadata,
  feeding the DMI engine's confidence weighting (`api::dme_dmi`).
- **EU regulatory anchors on overlays** — EU Green Bond Standard (Art 6-8), EUDR deforestation
  due diligence (2023/1115), CBAM (2023/956), EU Methane Regulation (2024/1787), SFDR Art 7,
  EU Taxonomy climate-mitigation criteria — each named on the overlay factor it governs.
- **Statistical process conventions** — the z-score alert ladder (watch 1.5σ → extreme 4σ) and
  EWMA smoothing follow standard anomaly-detection practice; `hawkes_process` is reserved for
  self-exciting event factors (controversy cascades) in the DME velocity engine.
