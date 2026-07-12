## 9 · Future Evolution

### 9.1 Evolution A — Connect the page to its own engine and repair the POST surface (analytics ladder: rung 1 (UI) / 2 (engine) → 3)

**What.** The backend is one of the platform's most honest: `assess_aqueduct_risk`
does weighted 7-indicator Aqueduct 4.0 scoring with a deterministic country-stress
proxy that is documented "never a random draw" and tracks `proxied_indicators` — yet
§7's flag shows the frontend contains **no axios/fetch call at all**, rendering 60
synthetic companies whose `waterStressScore` is a flat `sr()` draw unrelated to their
`primaryBasin` (an Indian company can show "Low" and a Norwegian one "Extremely High"
by index luck, per §7.4). The lineage harness also reports `physical-risk-scenarios`
failed and six POSTs skipped. Evolution A executes §7.5's own remediation: call
`assess_aqueduct_risk()` per company with real country+sector; join `BASIN_DATA` to
the `WRI_AQUEDUCT_WATER_RISK` reference data already wired into the sibling
`water-risk-analytics` module (which shares both engines — blast radius 1); surface
`proxied_indicators` as a data-quality badge per row; and fix the failing
physical-risk-scenarios route.

**How.** Frontend rewiring (the 16 endpoints already exist across two route files);
company records gain `country_code` (currently absent); rung-3 step: pin the
India-proxy worked example from §7.4 in `bench_quant` and validate `COUNTRY_STRESS`
multipliers against published Aqueduct country rankings.

**Prerequisites.** The disconnected-page defect acknowledged; the three mutually
independent risk fields (physical/regulatory/reputational as unlinked random picks)
replaced by engine outputs. **Acceptance:** lineage harness passes the POST surface;
an India-based company always outranks a Norway-based one on proxied stress; each row
shows whether its indicators are Aqueduct-sourced or country-proxied.

### 9.2 Evolution B — CDP/ESRS E3 disclosure assistant (LLM tier 2)

**What.** The engine already computes the exact artefacts water disclosure teams
need — CDP grade bands with `gap_to_a_list`, ESRS E3 completeness with honest
not-yet-disclosed handling, water footprint with AWARE scarcity adjustment, financial
impact (revenue-at-risk, compliance cost, insurance uplift) — across 16 endpoints.
Evolution B is a tool-calling assistant that runs a company's full disclosure
workflow: "assess our 12 facilities, tell me what's blocking a CDP A-, and draft the
ESRS E3 quantitative section." It orchestrates `POST /aqueduct-risk`, `/cdp-water`,
`/esrs-e3`, `/water-footprint`, and `/materiality`, then drafts disclosure text where
every m³, score, and grade traces to a tool response — and where the engine's null-
not-fabricated convention (CEO Water Mandate score returned null when absent) is
carried through as explicit "not yet disclosed" statements rather than papered over.

**How.** Tier-2 stack: tool schemas from the existing OpenAPI operations (unusually
rich here — 16 routes); grounding corpus is this Atlas page plus the two `/ref/*`
methodology payloads. The `proxied_indicators` field feeds the mandatory data-quality
caveat in any drafted disclosure.

**Prerequisites (hard).** Evolution A's POST repairs and page rewiring (a copilot and
a page showing different numbers for the same company is disqualifying); facility
geocodes or country codes per entity. **Acceptance:** drafted E3 text distinguishes
measured, proxied, and undisclosed values explicitly; the CDP gap analysis cites
`gap_to_a_list` from the payload; asked for a basin's raw Aqueduct sub-indicator the
engine wasn't given, the assistant reports the proxy basis instead of a fabricated
precision.
