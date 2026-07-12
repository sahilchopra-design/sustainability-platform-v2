## 9 · Future Evolution

### 9.1 Evolution A — Fully live capacity data and computed pipeline dynamics (analytics ladder: rung 2 → 3)

**What.** §7 describes a descriptive market-tracker whose value is its curated, largely-real dataset — installed capacity by country (USA 3,706 MW, Indonesia 2,356, Philippines 1,918, Turkey 1,682, Kenya 990, all matching IRENA/ThinkGeoEnergy 2023), real listed developers with tickers (Ormat NYSE:ORA, Pertamina IDX:PGEO, Fervo, Eavor), and a partly-wired IRENA public seed (`IRENA_RENEWABLE_CAPACITY_2023`). The only formula is capacity share (`country GW/global × 100`); `INVESTMENT_FLOWS` is flagged synthetic/illustrative and `CAPACITY_HISTORY` 2025–2050 are projections. Evolution A moves it from descriptive to benchmarked: fully wire all country rows to the IRENA reference-data layer (not just the derived `IRENA_GEOTHERMAL` filter), add computed pipeline conversion rates (permitted → under-construction → operational) from historical pipeline data, and replace the synthetic investment flows with sourced figures where available.

**How.** (1) Read `COUNTRIES.installed`/`pipeline` from the IRENA/ThinkGeoEnergy tables in the refdata layer rather than hand-set literals, with provenance badges. (2) Compute pipeline conversion probabilities from the capacity-history series so the pipeline total is risk-weighted, not a raw sum. (3) Source `INVESTMENT_FLOWS` from published market reports or mark honestly as illustrative.

**Prerequisites.** Refresh cadence for the IRENA seed; historical pipeline snapshots to estimate conversion rates. **Acceptance:** every headline capacity figure carries a source badge and reconciles to the refdata table; the pipeline total is risk-weighted with a documented conversion model; no illustrative figure is presented as sourced.

### 9.2 Evolution B — Geothermal market-scan copilot (LLM tier 1 → 2)

**What.** A copilot for investors and market analysts: "which new-entrant geothermal markets (Chile, Ethiopia, Saudi Arabia) have the strongest resource-plus-policy setup, and who are the listed developers exposed to Kenya?" narrates the country capacity/policy tables and developer landscape from the atlas corpus, with tier-2 pulling live capacity shares and pipeline-conversion figures from the Evolution A endpoint.

**How.** Tier 1 is credible because §7 confirms the dataset is among the most genuinely-sourced in the atlas (real projects: The Geysers, Olkaria, Larderello; real tickers). The copilot cites real capacity figures and developers, flagging `INVESTMENT_FLOWS` as illustrative. Tier 2 tool-calls the capacity-share/pipeline endpoint so market-position rankings are computed. Cross-links to the LCOE and project-finance siblings come from the atlas interconnection graph.

**Prerequisites.** Corpus embedding; Evolution A for computed pipeline dynamics. **Acceptance:** every capacity and developer fact cited traces to the refdata table or curated dataset; the copilot labels investment-flow figures as illustrative until Evolution A sources them.
