## 9 · Future Evolution

### 9.1 Evolution A — Rate real cities from the platform's own hazard grids (analytics ladder: rung 1 → 3)

**What.** §7 documents the module's core defect: 80 real city names (Miami, Rotterdam,
Jakarta, Lagos…) carry 13 *independent* PRNG-drawn fields — hazard sub-scores, physical
risk, resilience, and credit impact are unrelated to each other and to the cities, and
the `i % 5` region assignment mis-regions many. Meanwhile the platform already
operates a Physical Risk Digital Twin: five populated `ref_*_zones` PostGIS grids
(earthquake, cyclone, wildfire, flood, sea-level from USGS/IBTrACS/GWIS/OpenFEMA/
IPCC-AR6) with a composite scoring engine. Evolution A replaces the fabricated fields
with per-city hazard lookups from those grids at each city's actual coordinates, then
implements the guide's advertised composite
(`CityRiskRating = w_P·Hazard − w_A·AdaptiveCapacity + w_V·Vulnerability`) with
adaptive-capacity proxies from curated sources (GDP per capita, C40 membership,
adaptation-plan status).

**How.** (1) City gazetteer table (name, lat/lon, region — fixing the mis-regioning) →
digital-twin composite score per city via the existing scoring engine's resolution
cascade. (2) The weighted composite as a pure function with documented weights; the
two genuine stress multipliers (heat, sea-level charts) retained and wired to grid
values. (3) Muni-spread impact deferred or shipped as a clearly-labelled illustrative
multiplier until an empirical calibration source exists — do not fake the Moody's
calibration the guide claims.

**Prerequisites (hard).** PRNG purge is the deliverable; flood/sea-level grid coverage
is currently sparse (48/152 rows) so `resolution_tier` honesty is mandatory for cities
outside coverage. **Acceptance:** Miami and Rotterdam differ on flood/SLR sub-scores
in the direction the grids dictate; every sub-score traces to a grid query or a cited
proxy; zero `sr()` calls remain.

### 9.2 Evolution B — Municipal risk copilot (LLM tier 2)

**What.** Post-Evolution A, an analyst assistant over real ratings: "why is Jakarta
rated worse than Singapore?" answered by decomposing the composite into grid-sourced
hazard terms and capacity proxies, "show the top-10 sea-level-exposed cities in our
coverage", "what would a stronger adaptation program do to Lagos's score?" as a
tool-called re-run with the capacity input changed. Tool surface: the digital twin's
existing composite-scoring endpoints plus the new city-rating function.

**How.** Tool schemas over the twin's scoring API filtered via the atlas endpoint map;
per the tier-2 contract every score and sub-score in an answer matches a tool response;
the "show work" expander lists grid tables consulted and each lookup's
`resolution_tier`, so sparse-coverage cities are visibly lower-confidence.

**Prerequisites (hard).** Evolution A complete — narrating today's seeded numbers
about real cities would be fabrication attached to real names, the platform's worst
provenance pattern. **Acceptance:** a comparative-rating explanation cites grid values
reproducible by direct query; the copilot flags any city scored on country-level
fallback rather than grid resolution.
