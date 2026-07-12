## 9 · Future Evolution

### 9.1 Evolution A — Observation-driven data-quality and satellite detectability (analytics ladder: rung 2 → 4)

**What.** The E73 MRV engine assesses measurement/reporting/verification infrastructure:
it infers a digital-MRV tier (1–5) from capability flags mapped to ISO 14064-3 and IPCC
tiers, computes a PCAF-style tonnage-weighted data-quality score, verifies satellite
coverage (TROPOMI/GHGSat/Sentinel-5P/Carbon Mapper detectability with an
`orbit_factor = 1 + |lat|/90 × 0.5` revisit geometry), and scores verification readiness.
The satellite detectability and DQS are computed from entity-supplied capability flags,
not from actual observation feeds. Evolution A grounds them in real data.

**How.** (1) Wire `verify_satellite_coverage` to real satellite metadata (revisit
schedules, detection limits per platform) and, where available, actual detections for a
facility's coordinates — turning a geometric estimate into an observation-backed
coverage statement with a resolution tier. (2) Layer a predictive element on
`calculate_data_quality`: project the DQS improvement trajectory from an
improvement-plan's capex/opex over the 3-year horizon the engine already models
(`total_3yr = capex + annual_opex×3`), so users see when a target tier is reached, not
just its cost. (3) Bench-pin the tier inference, DQS, and IPCC/ISO mappings.

**Prerequisites.** Satellite platform metadata and, ideally, a detections feed (external);
the DQS methodology cross-checked against the platform's PCAF quality module.
**Acceptance:** satellite coverage cites platform revisit data with a tier when
observations exist; the improvement plan returns a time-to-target-tier trajectory; bench
pins reproduce the DQS and tier mapping.

### 9.2 Evolution B — MRV-readiness copilot for climate-data teams (LLM tier 2)

**What.** A copilot that runs the MRV suite for an entity and explains the path to
audit-grade data: "you're MRV Tier 2 (IPCC Tier 1 equivalent); to reach ISAE 3410 limited
assurance you need X; satellite coverage over your sites is adequate for facilities above
25 t/hr but not smaller leaks" — each claim grounded in a tool call.

**How.** Three computational POST endpoints (`/tier-assessment`, `/satellite-coverage`,
`/improvement-plan`) plus five reference GETs (tiers, uncertainty-tiers, satellite
platforms, verification bodies, standards) that ground every framework mapping. The
improvement-plan endpoint drives a costed remediation narrative; the reference endpoints
let the copilot correctly map between ISO 14064-3, IPCC, ISAE 3410 and ISSA 5000
assurance levels. Cross-links to the PCAF-quality and emissions copilots.

**Prerequisites.** None hard for tier-1 narration; for credible satellite claims,
Evolution A's real platform metadata. **Acceptance:** every tier, DQS, and assurance-level
claim traces to a tool response; the copilot maps assurance standards using the reference
endpoints, not memory; it labels satellite detectability as geometry-estimated until
Evolution A wires observations, and refuses to assert a facility is emitting when the
engine only computes detectability.
