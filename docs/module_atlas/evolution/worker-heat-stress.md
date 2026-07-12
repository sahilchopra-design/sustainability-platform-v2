## 9 · Future Evolution

### 9.1 Evolution A — Real WBGT from weather data with ISO 7243 thresholds (analytics ladder: rung 1 → 2)

**What.** The guide's WBGT composite (`0.7×T_wetbulb + 0.2×T_globe + 0.1×T_air`) is
entirely absent — §7 documents that `qTrend.wbgt` is generated directly in a
plausible 26–33°C range with no temperature inputs, so it "cannot respond to a change
in location, season, or climate scenario", and the top KPI even mislabels exposure
*hours* as "WBGT". Evolution A computes real WBGT: the platform already ingests
NASA POWER and Open-Meteo weather series (data-sources wave 1), which supply
temperature/humidity/radiation per coordinate — enough for the standard outdoor WBGT
estimate (Liljegren or the simpler ACGIH approximation, documented per Atlas §8
convention). Layer on the pieces the module names but never encodes: ISO 7243
work/rest action limits by metabolic rate class, ILO sector productivity-loss curves
replacing the flat 1–13% random `prodLossPct`, and warming-scenario deltas from the
digital twin's IPCC-derived layers for the 2030/2050 projections. Compliance scores
stop being three independent random draws and become checklists against the actual
differing ILO/OSHA/EU trigger thresholds.

**How.** Backend `heat_stress_engine` (module is Tier B, no EP code) with
`POST /wbgt` (coordinates + months in, WBGT distribution + threshold-exceedance days
out) and `POST /productivity-loss`; company records gain geocodes; the coin-flip
`shiftOpt` becomes a real comparison of hourly WBGT profiles against shift windows.

**Prerequisites.** The synthetic WBGT and random compliance scores acknowledged as
fabrication-pattern removals; workforce geocoding for the demo portfolio.
**Acceptance:** the §7.4 worked example (27/34/32°C → 28.9°C) reproduces through the
endpoint; a Dubai site shows more threshold-exceedance days than a Hamburg site;
productivity loss varies by sector curve, not a uniform draw.

### 9.2 Evolution B — ESRS S1/GRI 403 heat-disclosure copilot (LLM tier 2)

**What.** The module's stated outputs are ESRS S1 working-conditions and GRI 403
health-and-safety disclosures. Evolution B is a tool-calling assistant for HR/EHS
teams: "assess our 12 sites for the 2026 season, tell me which need work/rest
protocols under ISO 7243, and draft the S1 heat-stress paragraph." It calls Evolution
A's `POST /wbgt` per site and `POST /productivity-loss` per workforce segment, maps
findings to the 8-regulation reference table (with each regime's actual trigger
threshold now encoded), and drafts disclosure text where every °C, exceedance-day
count, and % loss traces to a tool response — including the shift-schedule
recommendation with its computed saving.

**How.** Tier-2 stack: tool schemas from the new OpenAPI operations; grounding corpus
is this Atlas page plus the ISO 7243 threshold table. The prompt carries §7.5's
regulatory nuance (ILO/OSHA/EU regimes differ materially) so the copilot never
presents one compliance score as covering all three.

**Prerequisites (hard).** Evolution A — narrating the current random compliance
scores into a GRI 403 disclosure would be fabricated audit evidence; weather-data
coverage for all sites. **Acceptance:** drafted disclosure figures all appear in tool
outputs; a site below all action limits yields "no protocol required" with the
computed margin; asked for heat-related incident counts the platform doesn't track,
the copilot refuses and names the data gap.
