## 9 · Future Evolution

### 9.1 Evolution A — Build the actual geospatial GERI the module name promises (analytics ladder: rung 1 → 3)

**What.** The §7 flag is comprehensive: the module is named "Supply Chain Map" and the guide promises geocoded facilities, an interactive map with trade flows, and `GERI = ESG Score × (1 + Country Risk Premium) × Physical Hazard Weight` referencing WRI Aqueduct and ND-GAIN — but **there are no lat/lon fields, no map library, no WRI/ND-GAIN data, and no GERI calculation** in the 930-line file. What exists is a tabular supplier registry (150 synthetic suppliers, 11 tabs) where `riskLevel` is a single-variable ESG-score bucket (the 'Critical' band is even unreachable given the score floor of 20), with the displayed carbon/human-rights/deforestation fields not contributing to it. The DD regulations and hotspots are real reference content but disconnected from suppliers. Blast radius 81. Evolution A builds the geospatial capability the module is named for.

**How.** (1) Add facility geocoding (lat/lon per supplier) and a map component with hazard overlays — the platform's physical-risk digital twin already has flood/water-stress/heat/cyclone PostGIS grids to overlay, and WRI Aqueduct water-risk is a free layer. (2) Implement the GERI formula: supplier ESG × (1 + country-governance-risk premium from ND-GAIN/WGI) × physical-hazard weight from the facility's grid cell — a real location-adjusted composite replacing the single-variable bucket. (3) Join suppliers to the real DD regulations by their actual applicability tests (CSDDD turnover/employee thresholds) rather than hard-coded compliance percentages. (4) Fix the unreachable 'Critical' bucket. (5) Ground suppliers in real data via the shared backend (fixing its failing compute routes).

**Prerequisites.** Geocoding; physical-risk grids and WRI Aqueduct (available); the shared compute-route fixes. This is a substantial build — the geospatial layer is entirely absent. **Acceptance:** GERI computes per facility from ESG × country premium × hazard weight; suppliers render on a map with hazard overlays; regulatory flags reflect the regulations' real applicability tests.

### 9.2 Evolution B — Geospatial supply-chain risk copilot (LLM tier 2)

**What.** A copilot for the procurement/resilience analyst: "which facilities sit in high-flood-risk zones with weak governance?", "compute GERI for our Southeast Asia suppliers", "which suppliers trigger EUDR due-diligence and where are they?" — reading the (Evolution-A) GERI, facility geolocations, and hazard overlays, prioritising site visits and due-diligence spend.

**How.** Tier-2 pattern once GERI and geocoding exist: the GERI calculation and hazard-lookup become tools; the copilot narrates facility risk by location, decomposing GERI into ESG/governance/hazard contributions and citing WRI Aqueduct/ND-GAIN sources. Regulatory answers map facilities to the DD regulations' real thresholds. The no-fabrication validator checks every GERI figure against tool output.

**Prerequisites (hard).** Evolution A — there is no map, no geocoding, and no GERI today, so a geospatial copilot would fabricate locations and a risk index that doesn't exist. **Acceptance:** every GERI figure traces to the computed formula with its hazard-grid source; facility locations are real geocodes; a supplier outside coverage returns a refusal.
