## 9 · Future Evolution

### 9.1 Evolution A — Calibrate the TNFD sensitivity score against protected-area and habitat layers (analytics ladder: rung 2 → 3)

**What.** This module is genuinely strong: its data layer is a live proxy over the free, keyless GBIF occurrence API (`gbif_screening.py`), aggregating real species richness, taxonomic breadth, and IUCN threat load into a TNFD LEAP "Locate"-style 0–100 sensitivity score from four live-fetched drivers. Its honest limit is that GBIF occurrence density is a sampling-effort proxy, not a habitat measure — a well-surveyed city park can outscore a poorly-surveyed critical habitat. Evolution A calibrates the score against authoritative spatial layers so sensitivity reflects protection status and habitat value, not observer bias.

**How.** (1) Add free spatial overlays as additional drivers: WDPA protected-area polygons (proximity/containment), KBA (Key Biodiversity Area) boundaries, and IUCN habitat/range maps — all openly licensed. (2) Introduce a sampling-effort normaliser: divide threatened-record counts by total-record density in a reference buffer so richness reflects relative rather than absolute survey intensity. (3) Re-weight the `IUCN_WEIGHT` blend and the `richness / 400` component against a small validated set of sites with known TNFD assessments, publishing calibration error per the Atlas §8 model-card convention. (4) Report a `data_confidence` field driven by GBIF record density so under-surveyed sites are flagged, not silently under-scored.

**Prerequisites.** WDPA/KBA layers need PostGIS ingestion (the platform already runs 5 hazard grids in PostGIS — same scaffold); a reference set of scored sites for calibration. **Acceptance:** a KBA-contained site scores higher than a species-rich urban park with the same raw GBIF richness; calibration error reported, not hidden.

### 9.2 Evolution B — Site-screening copilot with LEAP-structured narrative (LLM tier 2)

**What.** A copilot that runs the screener conversationally — "screen our new facility at these coordinates" resolves to a `GET /api/v1/gbif` call, and the answer narrates the TNFD LEAP Locate findings: species richness, the threatened-species sample table (real scientific names), and the sensitivity drivers, with a plain-language interpretation of what the score means for a Locate-phase dependency/impact screen. It never invents species — every name comes from the live GBIF response.

**How.** Tool-calling pattern: the coordinate-to-screen endpoint is the primary tool; the copilot passes lat/lon/radius, receives the aggregated response, and structures it into a LEAP Locate output (the module already computes Locate-style outputs, so this is narration plus framework scaffolding). Threatened-species citations link to their GBIF occurrence records. The fabrication validator ensures every count and species name traces to the API response; refusal for locations returning zero CC0/CC-BY records ("insufficient open occurrence data at this site").

**Prerequisites.** None hard — the live API already exists; Evolution A's confidence field lets the copilot caveat sparse-data sites honestly. **Acceptance:** every species named appears in the tool's GBIF response; a marine or under-surveyed coordinate with no open records yields the insufficient-data refusal, not a fabricated assessment.
