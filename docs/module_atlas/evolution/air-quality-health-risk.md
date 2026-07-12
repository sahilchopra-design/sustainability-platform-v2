## 9 · Future Evolution

### 9.1 Evolution A — Facility-level DALY and liability model from satellite exposure (analytics ladder: rung 1 → 3)

**What.** Per the §7 mismatch flag, the guide's facility-level model — MODIS/Sentinel-5P PM2.5
intersected with portfolio facilities, GBD 2021 concentration-response functions, `DALY = YLL + YLD`,
and non-attainment penalty estimation — is **entirely absent**: the page is a 50-city browser where
pollution follows a hand-assigned rank gradient (`basePM = 95 − i·1.4 + noise`) and, critically,
health outcomes (`prematureDeaths`, `asthmaCases`) are **independent random draws unrelated to
PM2.5**, so the dose-response cross-charts show no real epidemiology (§7.5). Evolution A builds the
guide's model: ingest satellite-derived gridded PM2.5 (the platform already wires Sentinel-family
sources in the physical-risk digital twin), intersect with uploaded facility coordinates, apply GBD
relative-risk functions RR(c) to baseline mortality for attributable deaths and DALYs, and estimate
non-attainment liability from local regulatory penalty schedules.

**How.** `POST /api/v1/aq-health/facility-assessment` (coordinates + population → exposure, DALYs,
liability) sourcing PM2.5 from a satellite ingester and CRFs from a GBD reference table; portfolio
aggregation ranks holdings by a computed air-quality risk score. Rung 3: calibrate attributable
deaths against WHO/IHME State-of-Global-Air country totals.

**Prerequisites (hard).** Purge the `sr()`-driven health draws and the rank-gradient pollution
generator per the no-fabricated-random guardrail; fix the documented `whoCompliant < 15` vs
`whoGuideline = 5` internal inconsistency (§7.5); resolve the small-index seed collisions (Delhi's
fields all reuse `sr(0)`). **Acceptance:** premature deaths become a function of PM2.5 via CRF (the
scatter shows real dose-response); WHO compliance uses the annual 5 µg/m³ guideline consistently; a
facility in a higher-PM2.5 grid cell shows higher attributable DALYs.

### 9.2 Evolution B — Air-quality liability copilot for portfolio engagement (LLM tier 1 → 2)

**What.** A copilot answering "which portfolio holdings face the most air-quality liability?", "why
is this city's health cost so high?", and "what's the regulatory exposure as WHO 2021 guidelines
enter national law?" — grounded in the page's computed rankings (deaths-per-million is the one real
health metric today) and, post-Evolution A, the facility-level engine. Since health outcomes are
currently independent of pollution, the tier-1 copilot must disclose that the dose-response shown is
synthetic and cannot support real liability estimates.

**How.** Tier-1 roadmap pattern: §7.2 WHO guideline constants (genuinely sourced) and §7.6 framework
alignment (WHO AQG, GBD, EPA NAAQS, EU AAQD) embedded as the module corpus; page state (filtered
cities, selected pollutant) as context; served via `POST /api/v1/copilot/air-quality-health-risk/
ask` with the standard refusal path. After Evolution A, graduates to tier 2 by tool-calling
`POST /facility-assessment` for real per-holding liability, with the no-fabrication validator
checking every DALY and penalty figure.

**Prerequisites.** Atlas corpus embedded (roadmap D3); grounding carries the §7 mismatch note.
**Acceptance:** every figure cited matches page state with its synthetic status stated; a request
for a facility liability estimate before Evolution A returns a refusal naming the absent
satellite/CRF/penalty inputs.
