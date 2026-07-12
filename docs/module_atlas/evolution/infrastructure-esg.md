## 9 · Future Evolution

### 9.1 Evolution A — Real GIIA KPI computation from asset operational data (analytics ladder: rung 1 → 2)

**What.** The §7 flag is total: all 50 projects are `genProjects` fabrications — `carbonInt` (20–500 "gCO₂/kWh") is a raw draw with no emissions total or throughput behind it, `esgScore` bears no arithmetic relation to its own pillar draws, `gresbScore` is a random number wearing a real framework's name, compliance status is a two-threshold coin flip. The guide's `CI_infra = Total_CO2e / Throughput_metric` and the IEA NZE 30 gCO₂/kWh benchmark are never computed. Evolution A builds the §8 pipeline as this module's first backend vertical: activity data × emission factors → Scope 1/2, normalised by sector-specific throughput (kWh, vehicle-km, ML treated), with the NZE-pathway gap per asset and a weighted E/S/G composite whose pillars actually aggregate.

**How.** (1) An asset-operational-data intake vertical (asset × period × fuel/electricity/throughput/water/safety-hours), the register the §1 workflow already assumes analysts "load". (2) Emission factors from IPCC/DEFRA and grid intensities from IEA/eGRID into refdata — partially present in the platform's emission-factor layers already. (3) `GET /infrastructure-esg/kpis` computing GIIA KPI 4.1 (CI), 3.2 (water loss), LTIFR and renewable share to GIIA definitions, honest nulls for missing activity data. (4) Validation per §8.5: renewables land <5 gCO₂/kWh, gas peakers 400–500; a computed portfolio reconciles against any audited GHG inventory entered.

**Prerequisites.** The `genProjects(50)` fabrication deleted — decorative random numbers labeled as GIIA/GRESB/IFC metrics is the module's core defect; the intake UX. **Acceptance:** every KPI decomposes into activity × factor ÷ throughput; assets without data show gaps, not draws; the NZE-gap sign check passes (green vs fossil assets).

### 9.2 Evolution B — GP/LP ESG reporting copilot with framework fidelity (LLM tier 2)

**What.** The stated workflow ends at "generate the GIIA-format annual ESG performance report" — a document-production task suited to tier 2 once real KPIs exist: "draft the GIIA annual report section for the transport assets", "which assets sit above their NZE pathway and by how much?", "explain why market-based and location-based Scope 2 diverge for the PPA-backed solar asset" (a real subtlety §8.6 flags as material).

**How.** Tool schemas over the Evolution A `/kpis` route; report sections map to GIIA framework indicators with each figure validated against tool output. Framework fidelity rules: KPI definitions quoted from GIIA (the §4.1 anchor table carries the thresholds — LTIFR <1.0 best-in-class, >3.0 social-risk flag; NRW >20% efficiency gap); GRESB numbers only if an actual GRESB submission is ingested — the copilot must never present an internal score as a GRESB result, which is exactly the confusion the current random `gresbScore` invites. Coverage candour opens each report section ("CI computed for 31 of 48 assets; 17 lack throughput data").

**Prerequisites (hard).** Evolution A — LP reporting from PRNG data would be fabricated disclosure. Phase 2 tool-calling. **Acceptance:** report figures 100% tool-traceable; framework labels used only where the underlying computation matches the framework's definition; coverage statistics present per section.
