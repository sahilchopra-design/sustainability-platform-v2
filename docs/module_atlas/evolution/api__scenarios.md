## 9 · Future Evolution

### 9.1 Evolution A — Replace simplified EL multipliers with the platform's real credit engines (analytics ladder: rung 2 → 3)

**What.** The platform's scenario lifecycle engine: it syncs 8 NGFS scenario definitions
(`ngfs_sync_service`), manages custom-scenario creation/versioning/approval, and previews scenario
impact on a portfolio as an expected-loss delta (`scenario_impact_service`). The impact model is
candidly simplified in §5: `temperature_factor = 1 + (ΔT − 1)×0.15` ("15% PD increase per degree"),
`gdp_factor = 1 + |gdp|×0.05`, LGD capped `min(base×1.1, 0.9)`, and several
`scenario_el = baseline × 1.5` / `× 1.8` "simplified multipliers". The scenario library itself is
real-db (42 scenarios, 12 templates). Evolution A grounds the impact model.

**How.** (1) Replace the linear temperature/GDP PD factors and the `×1.5`/`×1.8` shortcuts with the
platform's actual credit-risk engines — route the scenario's carbon-price/GDP/temperature paths
through the PCAF-ECL bridge and the prudential-climate engine so ΔEL derives from calibrated PD/LGD
transformations, not flat multipliers. (2) Reconcile the embedded `NGFS_SCENARIOS` library with the
canonical `dh_ngfs_scenario_data` source (the platform's third NGFS surface — consolidate). (3) Fix
the failing `/{scenario_id}` and preview endpoints. (4) Bench-pin the EL-delta math.

**Prerequisites.** Integration with the credit engines (`pcaf_ecl_bridge`, `prudential_climate_risk`);
NGFS source consolidation; the failed detail/preview/versions endpoints repaired. **Acceptance:**
scenario EL-delta derives from calibrated credit transformations, not `×1.5`/linear factors;
`/{scenario_id}` and preview return `passed`; the scenario library reads the canonical NGFS table;
ΔEL bench-pinned.

### 9.2 Evolution B — Scenario-lifecycle copilot with governed approval (LLM tier 2)

**What.** A copilot that manages the scenario library conversationally — "show me the disorderly
scenario, preview its impact on my portfolio, and submit a custom variant for approval" — calling
the list/preview endpoints and the governed create/version/publish actions.

**How.** A mixed read/write surface: list/templates/get/preview are free; create, version, approve,
and publish are the gated mutating actions (the engine already models an approval workflow —
NGFS scenarios are pre-approved, custom ones require sign-off). The copilot narrates the real ΔEL
preview and never invents a portfolio impact. Approval/publish inherit RBAC and log to audit — a
governed-scenario tool matching the `parameter_governance` four-eyes pattern. Central node feeding
scenarios to the stress-test and transition-risk copilots.

**Prerequisites.** Evolution A's grounded impact model — a copilot narrating ΔEL from the simplified
multipliers as a stress result needs the caveat; endpoint fixes. **Acceptance:** every scenario
parameter and ΔEL figure traces to a tool response; custom-scenario approval/publish require
confirmation and log to audit; the copilot labels EL-deltas as simplified-model until Evolution A,
and refuses to publish a scenario without the approval step.
