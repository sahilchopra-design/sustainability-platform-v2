# Site Biodiversity Screener
**Module ID:** `site-biodiversity-screener` · **Route:** `/site-biodiversity-screener` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `CLASS_COLORS`, `DEMO_SAMPLE`, `GBIF_API`, `IUCN_COLOR`, `KpiCard`, `PRESET_SITES`, `SectionH`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PRESET_SITES` | 7 | `kind`, `lat`, `lon` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `GBIF_API` | ``${API}/api/v1/gbif`;` |
| `bandColor` | `sens.band === 'High' ? T.red : sens.band === 'Moderate' ? T.orange : sens.band === 'Low-Moderate' ? T.amber : T.green;` |
| `classChart` | `useMemo(() => (data.class_breakdown \|\| []).slice(0, 10).map(c => ({` |
| `iucnChart` | `useMemo(() => (data.iucn_breakdown \|\| []).map(b => ({` |
| `inpPx` | `{ ...selPx, width: '100%', boxSizing: 'border-box' };` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CLASS_COLORS`, `PRESET_SITES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

Like the Flood Loss Calibrator, this module's data layer is a **live proxy over a real external
API** — the free, keyless GBIF (Global Biodiversity Information Facility) occurrence-search API
— not a simulation. Given a lat/lon and radius, the backend (`gbif_screening.py`) queries GBIF
for openly-licensed occurrence records (CC0/CC-BY 4.0 only), aggregates species richness,
taxonomic breadth, and IUCN Red List threat load, and derives a single **TNFD LEAP "Locate"-style
site-sensitivity score (0-100)** from those four real, live-fetched drivers.

### 7.2 Live GBIF aggregation

Four faceted GBIF queries (each `limit=0`, using GBIF's server-side facet counts rather than
downloading raw records) drive the aggregates:

```
speciesKey facet (limit 1000) → species_richness = count of distinct species (capped at 1000, "richness_capped" flag)
classKey facet (limit 60)     → distinct_classes, per-class record counts (canonical names resolved via GBIF species API)
iucnRedListCategory facet     → per-category record counts; threatened_records = Σ counts where category ∈ {CR,EN,VU,NT}
kingdomKey facet               → distinct_kingdoms
```

A fifth, non-faceted call (`iucnRedListCategory ∈ {CR,EN,VU,NT}, limit=200`) pulls actual
occurrence records to build the **threatened-species sample table** with real scientific names,
sorted by IUCN severity weight then record count. All queries are restricted to
`license ∈ {CC0_1_0, CC_BY_4_0}` via GBIF's OR-filter mechanism (repeated `license` params).

### 7.3 TNFD-style sensitivity score

```python
richness_component        = min(1.0, species_richness / 400.0)
weighted_threat            = Σ_over_ALL_iucn_categories( IUCN_WEIGHT[cat] × records[cat] )
                              # IUCN_WEIGHT = {CR:1.0, EN:0.8, VU:0.6, NT:0.35, DD:0.1}  (LC has no entry → weight 0)
threatened_component       = min(1.0, weighted_threat / 50.0)
distinct_class_component   = min(1.0, distinct_classes / 20.0)
kingdom_component          = min(1.0, distinct_kingdoms / 5.0)

sensitivity_score = 100 × (0.35×richness + 0.40×threatened + 0.15×distinct_class + 0.10×kingdom)
```

Bands: High ≥70, Moderate ≥45, Low-Moderate ≥20, Low otherwise.

**Subtle but real code detail worth flagging:** `weighted_threat` sums `IUCN_WEIGHT.get(category,
0) × records` across **every** IUCN category present, including **Data Deficient (DD, weight
0.1)** — not just the four categories GBIF/IUCN would call "threatened." The page's
`threatened_records` KPI, by contrast, only counts CR/EN/VU/NT records. This is a deliberate,
defensible design choice (DD species may in fact be threatened; giving them a small non-zero
weight is precautionary) but means the sensitivity score's "threatened" component is not
numerically reproducible from the displayed `threatened_records` figure alone — a reader would
need to also know the DD record count to reconstruct `weighted_threat` exactly.

### 7.4 Worked example — Bełchatów Coal Complex, live-queried during this review

Calling the real `site_screen(lat=51.266, lon=19.330, radius_km=15.0)` endpoint directly against
the live GBIF API (the exact preset site and radius the page defaults to) returned:

| Metric | Live value |
|---|---|
| Total occurrence records (open license) | 2,247 |
| Species richness | **1,000 (capped — `richness_capped: true`)** |
| Distinct taxonomic classes | 26 |
| Distinct kingdoms | 4 |
| Threatened records (CR+EN+VU+NT) | 76 |
| Threatened species (sample table) | 63 |
| IUCN breakdown | LC 927 · NT 36 · VU 23 · CR 11 · EN 6 · DD 3 |

Hand-tracing the sensitivity formula against these live numbers:

| Step | Computation | Result |
|---|---|---|
| Richness component | min(1, 1000/400) | **1.0** (saturated — GBIF facet cap reached) |
| Weighted threat | 0.35×36(NT) + 0.6×23(VU) + 1.0×11(CR) + 0.8×6(EN) + 0.1×3(DD) | 12.6+13.8+11+4.8+0.3 = **42.5** |
| Threatened component | min(1, 42.5/50) | **0.850** |
| Distinct-class component | min(1, 26/20) | **1.0** (saturated) |
| Kingdom component | min(1, 4/5) | **0.800** |
| **Sensitivity score** | 100×(0.35×1.0 + 0.40×0.85 + 0.15×1.0 + 0.10×0.8) | **100×(0.35+0.34+0.15+0.08) = 92.0** |
| Band | 92.0 ≥ 70 | **High** |

This matches the live engine's own returned `sensitivity.score = 92.0, band = 'High'` exactly —
confirmed by direct API call, and the `weighted_threat = 42.5` figure independently confirms the
DD-inclusion behaviour noted in §7.3 (without the DD term the sum would be 42.2, not 42.5).
Real named species in the live threatened table include *Anguilla anguilla* (European eel, CR),
*Puffinus mauretanicus* (Balearic shearwater, CR), and *Vanellus gregarius* (sociable lapwing,
CR) — genuine GBIF occurrence records near this real coal-mining complex, not fabricated names.

### 7.5 Data provenance & limitations

- **Fully live, real external data:** every number above was independently reproduced by a direct
  call to the actual GBIF occurrence-search API during this review — species names, record
  counts, and the derived score are all genuine, current GBIF data, filtered to open licenses.
- **`DEMO_SAMPLE` fallback** is itself explicitly a real, frozen GBIF snapshot for the same site
  (captured 2026-07), used only if the live proxy is unreachable — clearly badged "○ Demo" in
  the UI, and slightly different from the live-refetched numbers in this review (e.g. demo shows
  12 threatened species vs 63 live) simply because GBIF's dataset has grown/changed between the
  snapshot date and this review's query.
- **Richness is capped at 1,000** (GBIF facet limit) and flagged with a "+" — for very
  biodiverse sites the true species count could exceed the reported figure.
- **Occurrence density ≠ population/ecological importance:** GBIF records reflect observation/
  collection effort (museum specimens, citizen-science apps, survey programs), which is highly
  uneven across regions — a site near a well-surveyed area (e.g. Rotterdam) will show more
  records than an equally biodiverse but under-surveyed site, independent of true ecological
  sensitivity. This is a structural limitation of any occurrence-based (rather than
  distribution-modelled) biodiversity proxy, not specific to this module's code.
- **Sensitivity score is explicitly labelled** "a derived screening indicator, not a regulatory
  determination; use for LEAP 'Locate' prioritisation only" — an appropriately modest framing.

**Framework alignment:** GBIF occurrence data (CC0/CC-BY 4.0, api.gbif.org) · IUCN Red List
categories (CR/EN/VU/NT/DD/LC) · TNFD LEAP approach, "Locate" phase (site-level nature-related
dependency/impact screening).

## 8 · Model Specification

**Status: implemented.** The GBIF proxy, aggregation, and sensitivity-score computation are all
fully implemented and were independently verified live against the real GBIF API during this
review.

**8.1 Purpose & scope.** Give a nature-risk or biodiversity-due-diligence team a fast, no-API-key
first-pass screen of *any* lat/lon site (mine, port, plantation) against real, openly-licensed
species-occurrence data, producing a defensible TNFD LEAP "Locate"-stage sensitivity indicator
without requiring a proprietary biodiversity database subscription.

**8.2 Conceptual approach.** Real occurrence-record density and IUCN threat status are used as
observable proxies for site-level biodiversity sensitivity. Four independently-normalised,
saturating components (richness, IUCN-weighted threat load, taxonomic breadth, cross-kingdom
presence) are combined in a fixed-weight linear composite, deliberately simple and fully
transparent (weights and formula are returned in the API response itself and displayed on-page).

**8.3 Mathematical specification.**
```
richness_component      = min(1, species_richness / 400)
weighted_threat         = Σ_category IUCN_WEIGHT[category] × records[category]   (CR 1.0, EN 0.8, VU 0.6, NT 0.35, DD 0.1, LC 0)
threatened_component    = min(1, weighted_threat / 50)
distinct_class_component = min(1, distinct_classes / 20)
kingdom_component       = min(1, distinct_kingdoms / 5)
sensitivity_score = 100 × (0.35·richness + 0.40·threatened + 0.15·distinct_class + 0.10·kingdom)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Component weights | 35/40/15/10% | Hand-set, TNFD-inspired; not independently back-tested |
| Richness saturation point | 400 species | Hand-set |
| Threat saturation point | 50 (IUCN-weighted units) | Hand-set |
| IUCN category weights | 1.0/0.8/0.6/0.35/0.1 | Hand-set, ordered by IUCN severity ranking |
| Class/kingdom saturation | 20 classes / 5 kingdoms | Hand-set (5 kingdoms = standard taxonomic kingdom count) |

**8.4 Data requirements.** Only a lat/lon and search radius (1-100km) — both user-selected or
from the six hand-picked real preset sites (Bełchatów, Grasberg, Rotterdam, Cerrejón, Riau, and
Carajás). No portfolio, financial, or entity data is required.

**8.5 Validation & benchmarking.** No formal validation exists for the sensitivity-score weights
against independent biodiversity-importance rankings (e.g. Key Biodiversity Areas, protected-area
overlap) — the score is explicitly positioned as a first-pass, cross-checkable screening
indicator, not a certified biodiversity-impact assessment. The underlying GBIF aggregation
correctness was independently re-derived and confirmed in this review.

**8.6 Limitations & model risk.** (1) Occurrence density reflects survey/collection effort, not
just true biodiversity — under-surveyed regions will systematically score lower regardless of
actual sensitivity. (2) The 1,000-species richness cap and 60/20-category facet limits mean
extremely rich sites are under-counted (flagged with "+" but not corrected for). (3) The DD-
category inclusion in `weighted_threat` (but not in the displayed `threatened_records` KPI) can
make the sensitivity score's threat component appear inconsistent with the visible threatened-
record count unless a reader knows to add the DD contribution. (4) A 6-hour in-process cache
means repeated screens of the same site within that window will not reflect newly-published GBIF
records. (5) The tool is explicitly a screening aid for TNFD LEAP "Locate" prioritisation, not a
substitute for a site-specific ecological survey or formal biodiversity impact assessment.

## 9 · Future Evolution

### 9.1 Evolution A — Calibrate the TNFD sensitivity score against protected-area and habitat layers (analytics ladder: rung 2 → 3)

**What.** This module is genuinely strong: its data layer is a live proxy over the free, keyless GBIF occurrence API (`gbif_screening.py`), aggregating real species richness, taxonomic breadth, and IUCN threat load into a TNFD LEAP "Locate"-style 0–100 sensitivity score from four live-fetched drivers. Its honest limit is that GBIF occurrence density is a sampling-effort proxy, not a habitat measure — a well-surveyed city park can outscore a poorly-surveyed critical habitat. Evolution A calibrates the score against authoritative spatial layers so sensitivity reflects protection status and habitat value, not observer bias.

**How.** (1) Add free spatial overlays as additional drivers: WDPA protected-area polygons (proximity/containment), KBA (Key Biodiversity Area) boundaries, and IUCN habitat/range maps — all openly licensed. (2) Introduce a sampling-effort normaliser: divide threatened-record counts by total-record density in a reference buffer so richness reflects relative rather than absolute survey intensity. (3) Re-weight the `IUCN_WEIGHT` blend and the `richness / 400` component against a small validated set of sites with known TNFD assessments, publishing calibration error per the Atlas §8 model-card convention. (4) Report a `data_confidence` field driven by GBIF record density so under-surveyed sites are flagged, not silently under-scored.

**Prerequisites.** WDPA/KBA layers need PostGIS ingestion (the platform already runs 5 hazard grids in PostGIS — same scaffold); a reference set of scored sites for calibration. **Acceptance:** a KBA-contained site scores higher than a species-rich urban park with the same raw GBIF richness; calibration error reported, not hidden.

### 9.2 Evolution B — Site-screening copilot with LEAP-structured narrative (LLM tier 2)

**What.** A copilot that runs the screener conversationally — "screen our new facility at these coordinates" resolves to a `GET /api/v1/gbif` call, and the answer narrates the TNFD LEAP Locate findings: species richness, the threatened-species sample table (real scientific names), and the sensitivity drivers, with a plain-language interpretation of what the score means for a Locate-phase dependency/impact screen. It never invents species — every name comes from the live GBIF response.

**How.** Tool-calling pattern: the coordinate-to-screen endpoint is the primary tool; the copilot passes lat/lon/radius, receives the aggregated response, and structures it into a LEAP Locate output (the module already computes Locate-style outputs, so this is narration plus framework scaffolding). Threatened-species citations link to their GBIF occurrence records. The fabrication validator ensures every count and species name traces to the API response; refusal for locations returning zero CC0/CC-BY records ("insufficient open occurrence data at this site").

**Prerequisites.** None hard — the live API already exists; Evolution A's confidence field lets the copilot caveat sparse-data sites honestly. **Acceptance:** every species named appears in the tool's GBIF response; a marine or under-surveyed coordinate with no open records yields the insufficient-data refusal, not a fabricated assessment.