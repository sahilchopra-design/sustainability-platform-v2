## 9 · Future Evolution

### 9.1 Evolution A — Quantitative scenario impact and evidence-graded scoring (analytics ladder: rung 2 → 3)

**What.** `ISSBS2Engine` scores IFRS S2 climate disclosures across four pillars, computes
GHG intensity (`total_ghg / revenue`), surfaces physical/transition risks by sector, and
runs a 3-scenario (Net Zero 1.5°C / Below 2°C / Current Policies) impact analysis per S2
§22–24. The scoring blends `0.6·qualitative + 0.4·quantitative` where the quant signal is
just a count of present numeric fields. The scenario analysis is qualitative — it names
exposures rather than quantifying financial impact. Evolution A makes scenarios numeric
and grounds risk identification in real data.

**How.** (1) Replace the qualitative scenario output with quantified impact: link
`run_scenario_analysis` to the platform's NGFS scenario data and physical-risk digital
twin so "Below 2°C" returns a modelled revenue/cost delta for the entity's sector and
locations, not just a narrative. (2) Ground `identify_risks` sector exposure in the
entity's actual asset footprint (physical risks from the digital twin grids) rather than
a static `sectors_most_exposed` lookup. (3) Grade quantitative completeness by data
quality, not mere presence, and bench-pin the pillar aggregation and GHG intensity.

**Prerequisites.** NGFS scenario data and physical-risk grids linked (both exist on the
platform); an entity asset-location input. **Acceptance:** `/scenario-analysis` returns a
quantified impact range per scenario with source attribution; risk identification varies
by the entity's real locations; bench pin reproduces pillar and completeness scores.

### 9.2 Evolution B — IFRS S2 disclosure copilot with TCFD cross-walk (LLM tier 2)

**What.** A copilot that runs `/assess` and explains the four-pillar verdict, then uses
`/risk-identification` and `/scenario-analysis` to draft the S2 strategy narrative —
"under the disorderly scenario your Metrics & Targets pillar is weakest; here are the
priority actions and the SASB metrics your sector must report" — each figure tool-sourced.

**How.** Three POST endpoints plus six `/ref/*` taxonomies (pillars, scenarios, physical/
transition risks, SASB sectors, TCFD cross-reference) form a complete, self-contained
grounding corpus. The `/ref/tcfd-crossref` endpoint lets the copilot answer "we already
report under TCFD — what's the S2 delta?" by mapping existing disclosures. Batch and
priority-action outputs drive a remediation workflow. Strong tier-3 node alongside the
`ifrs_s1` and `tcfd_metrics` copilots.

**Prerequisites.** For quantified scenario narration, Evolution A first — otherwise the
copilot can only narrate qualitative exposures and must say so. **Acceptance:** every
pillar score, risk, and SASB metric cited traces to a tool response; the copilot uses the
real TCFD cross-reference table for the delta question; asking for a quantified financial
impact before Evolution A yields an explicit "S2 scenario analysis is qualitative here"
refusal.
