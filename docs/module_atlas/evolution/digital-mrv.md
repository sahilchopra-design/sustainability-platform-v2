## 9 · Future Evolution

### 9.1 Evolution A — Implement the MRV equation on a real measurement stream (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag: nothing in the promised pipeline
`Verified_emission = Raw_sensor × (1 − Uncertainty) × GWP` is computed — all 80
projects, 30 satellite sites, 50 sensors, and 20 certificates are `sr()`-generated,
with "verified" emissions drawn directly (`sr(i·19)·5 + 0.1`) rather than derived
from readings, and no emission-factor application, GWP conversion, or uncertainty
propagation anywhere. Evolution A builds the calculation layer on a measurement
stream the platform can actually obtain, deferring physical IoT integration to
when a real deployment exists.

**How.** (1) Measurement substrate: start with obtainable streams — metered energy
data (the capture hub's records, utility interval data) and satellite-derived
observations (the platform's GWIS/NASA-POWER integrations provide genuine remote
sensing precedent) — ingested as timestamped readings in an `mrv_readings` table.
(2) Calculation layer: readings × emission factors (from the refdata factor
library) × GWP (AR6 values, curated) with uncertainty propagated per ISO 14064's
quantification guidance — each verified figure decomposable into
reading/factor/GWP/uncertainty. (3) Verification workflow: evidence packages per
reporting period (readings, factors applied, calculation trace) with
verifier-role sign-off states — the audit machinery AuditMiddleware supports.
(4) The registry-connectivity tab stays aspirational until a real registry API
relationship exists; label it so. (5) Purge all four synthetic generators.

**Prerequisites (hard).** PRNG purge; a first real measurement source (metered
energy is realistic; methane sensing is not, yet); AR6 GWP and factor tables in
refdata. **Acceptance:** a verified emission decomposes on screen into its
reading × factor × GWP × (1−uncertainty) chain; changing the GWP vintage
recomputes visibly; no displayed project carries generated data.

### 9.2 Evolution B — Verification-evidence reviewer for MRV audits (LLM tier 2)

**What.** The economic pitch of digital MRV — "reduced assurance costs" — comes
from making verification review faster. Evolution B assists the third-party audit
workflow: for a reporting period's evidence package, the reviewer checks
completeness against the ISO 14064 quantification requirements, flags anomalies in
the reading stream (gaps, step changes, values outside the sensor's plausible
band — deterministic checks the assistant orchestrates and explains), verifies
factor-vintage consistency, and drafts the verification-findings memo with each
finding citing the specific readings and calculation-trace rows involved.

**How.** Tier-2 read tools over the readings, factors, and calculation traces from
Evolution A; anomaly detection is deterministic statistics (the assistant
prioritizes and narrates, never invents thresholds); the findings memo queues for
the human verifier's sign-off — the module supports verification, it does not
perform it, a boundary the carbon-credit standards require. Grounding: ISO 14064
and the VCS/Gold Standard MRV requirement texts.

**Prerequisites (hard).** Evolution A's calculation layer and evidence packages
(there is nothing real to review today); standards texts embedded; verifier RBAC
role. **Acceptance:** findings cite specific reading IDs and trace rows; a
constructed gap in the stream is flagged; the memo's completeness checklist maps
to the standard's clauses; sign-off remains human.
