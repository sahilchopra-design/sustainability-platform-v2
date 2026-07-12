## 9 · Future Evolution

### 9.1 Evolution A — Default dashboard from the real engine, live CBECI refresh (analytics ladder: rung 2 → 3)

**What.** The methodology here is real and citably parameterized — the engine
implements `GHG = Hashrate × EnergyPerHash × GridEF_weighted` with authentic CBECI
energy bands, CCAF hashrate geography (US 38%/CN 21%/KZ 13%), real per-country grid
EFs, MiCA scoring, and PCAF financed emissions; 6 of 8 harness checks pass. But §7
flags the split: the page's *default* view renders hard-coded/seeded charts
(`portfolioHoldings` BTC 110.2 TWh, `piData`, seeded `countryIntensity` and
`premiumData`) and only touches the engine on explicit user action. Evolution A
makes the engine the default and keeps its constants current.

**How.** (1) Default wiring: page-load charts populate from
`GET /ref/consensus-mechanisms` and `/ref/country-energy-profiles` plus a default
`POST /assess` for BTC/ETH — deleting the hard-coded holdings and the seeded
overlays. (2) Freshness: CBECI publishes a live API for network energy estimates and
the CCAF mining map updates periodically — a scheduled ingest keeps the engine's
constants versioned with `as_of` dates instead of frozen 2024 values, the rung-3
discipline for a module whose headline number (Bitcoin ~TWh/yr) moves with hashprice
cycles. (3) Fixture the skipped `POST /mica-compliance` sweep. (4) Portfolio tab:
holdings from the platform's portfolio layer through `POST /portfolio`, so Scope 3
Cat 15 exposure reflects actual positions.

**Prerequisites.** CBECI API integration (free, attribution required); frontend
seed purge. **Acceptance:** the default dashboard's network-energy figure matches
the engine's CBECI value with its date stamp; zero hard-coded TWh values remain in
the page; `/mica-compliance` passes the sweep.

### 9.2 Evolution B — MiCA sustainability-disclosure drafter (LLM tier 2)

**What.** MiCA Article 66 requires crypto-asset service providers to publish
sustainability indicators — a new, template-poor disclosure that this module's
engine already scores. Evolution B drafts it: for a given asset or book, the
assistant runs `POST /assess`, `/financed-emissions`, and `/mica-compliance`, then
writes the indicator disclosure — network energy with the CBECI low/central/high
band (not a false point estimate), geography-weighted emission intensity with the
hashrate-share table, per-transaction figures with the engine's own clamp caveat
("transactions don't consume energy — miners do"), and the PCAF attribution
arithmetic — every number tool-traced, every methodological ambiguity disclosed as
the engine's documentation does.

**How.** Tool schemas over the 7 operations; `GET /ref/mica-requirements` provides
the requirement checklist the draft is structured against, so coverage is
verifiable requirement-by-requirement. The band-not-point discipline is the key
prompt rule: crypto emissions estimates carry wide uncertainty and the engine
returns ranges — the drafter must never collapse them. Output through the
report-studio layer.

**Prerequisites.** Evolution A's default wiring and the `/mica-compliance` fixture;
MiCA requirement text current in the ref endpoint. **Acceptance:** a draft
disclosure covers every `/ref/mica-requirements` item or marks it unmet; all
emission figures quote the engine's low/central/high band; the PCAF attribution in
the draft reproduces from holdings × the engine's arithmetic.
