# Platform Intelligence & Strategic Opportunity Map

A cross-module synthesis over the 963-record Module Atlas, built after the 2026-07-03
documentation pass (per-module deep dives + §8 model specs) and the subsequent
remediation sweep (11 original code fixes + ~55 consolidated-backlog fixes across
fabrication, calculation bugs, structural issues, regulatory accuracy, and 20+
frontend↔backend wiring gaps). This document looks *across* modules rather than
within one — where the platform's functional dependency chains run, where its
real analytical strength concentrates vs where it's still thin, and what that
implies for new use cases, risk, and a review cadence.

Machine-readable companion: `docs/module_atlas/module_tags.json` — every module_id
tagged with `sector`, `strategic_signal` (0–4), `blast_radius`, `tier`, `engines`.
Regenerate via `python scripts/build_module_tags.py` whenever `atlas.json` changes.

---

## 1 · Sector map

963 modules mechanically classified into 26 sector/economic-activity clusters
(keyword classification over title/module_id/nav/engines/tables — see
`scripts/build_module_tags.py`). Ordered by size, with the Tier split (A = real
backend-vertical engine, B = frontend-computed):

| Sector | Modules | Tier A | Tier B | A-share |
|---|---|---|---|---|
| Energy & Power | 98 | 35 | 63 | 36% |
| Regulatory & Disclosure Infrastructure | 89 | 41 | 48 | 46% |
| Carbon Markets & Credits | 80 | 27 | 53 | 34% |
| Climate Physical & Transition Risk Science | 65 | 25 | 40 | 38% |
| Financial Services & Capital Markets | 56 | 12 | 44 | 21% |
| Corporate Climate Strategy & Intelligence Hubs | 49 | 20 | 29 | 41% |
| Governance, Social & Human Capital | 44 | 6 | 38 | **14%** |
| AI, ML & Data Platform Infrastructure | 42 | 12 | 30 | 29% |
| Sovereign, Macro & Systemic Risk | 34 | 5 | 29 | **15%** |
| Climate & Blended Finance Instruments | 32 | 8 | 24 | 25% |
| ESG Data, Ratings & Analytics | 28 | 9 | 19 | 32% |
| Real Estate & Built Environment | 28 | 12 | 16 | 43% |
| Nature & Biodiversity | 28 | 16 | 12 | 57% |
| Industrials & Heavy Manufacturing | 27 | 13 | 14 | 48% |
| Platform Operations & Admin | 25 | 10 | 15 | 40% |
| Entity, Counterparty & Reference Data Services | 25 | 22 | 3 | **88%** |
| Agriculture, Food & Land Use | 18 | 4 | 14 | 22% |
| Transport & Mobility | 18 | 3 | 15 | **17%** |
| Prudential Banking & Insurance Regulation | 18 | 16 | 2 | **89%** |
| PCAF, Financed Emissions & Carbon Accounting | 16 | 12 | 4 | 75% |
| Insurance & Catastrophe Risk | 13 | 7 | 6 | 54% |
| Circular Economy & Resource Efficiency | 11 | 4 | 7 | 36% |
| Generic AI / Anomaly & Reporting Tooling | 9 | 4 | 5 | 44% |
| Commodities & Trade Intelligence | 8 | 0 | 8 | **0%** |
| Health, Air Quality & Climate-Related Human Impact | 3 | 0 | 3 | **0%** |
| Cross-Cutting / Other (unclassified residual) | 99 | 12 | 87 | 12% |

**Read:** Tier-A share is a rough proxy for "how much of this sector's output is a
real, standards-grounded calculation vs a frontend-only display layer" — not a
verdict on quality (many Tier-B pages are legitimate UI/demo/aggregation layers),
but a genuine signal of where the platform's calculation depth actually lives.

---

## 2 · Where analytical depth concentrates — and where it's thin

**Deepest real coverage:** Prudential Banking & Insurance Regulation (89%),
Entity/Reference Data Services (88%), PCAF/Financed Emissions (75%), Nature &
Biodiversity (57%), Insurance & Catastrophe Risk (54%). These are the platform's
load-bearing regulatory core — Basel/EIOPA capital mechanics, PCAF attribution,
and the entity-resolution layer everything else joins against.

**Thinnest real coverage — the strategic gap:**
- **Sovereign, Macro & Systemic Risk (15% Tier-A)** — 29 of 34 modules are
  frontend-computed. For a platform this deep on corporate/asset-level climate
  risk, sovereign-level analysis (34 modules!) running mostly on seeded data is
  a real credibility gap for any institutional (bank/insurer/asset-owner)
  audience that needs sovereign exposure alongside corporate exposure.
- **Governance, Social & Human Capital (14% Tier-A)** — 38 of 44 modules
  frontend-only. The "S" and "G" of ESG are structurally the least
  quantitatively grounded pillar across this entire platform, mirroring a
  well-known industry-wide problem (E is measurable, S/G is harder) but worth
  naming explicitly rather than leaving implicit.
- **Transport & Mobility (17%)**, **Commodities & Trade Intelligence (0%)**,
  **Health/Air Quality (0%)** — small clusters, but zero real-engine coverage
  in the latter two means every number in those 11 modules is currently
  illustrative.

This is not a criticism of individual modules — the remediation sweep already
fixed the fabrication and wiring problems that made Tier-B pages *dishonest*
about being synthetic. It's a portfolio-level finding: **if this platform's
roadmap includes sovereign or governance-grade underwriting products, those are
the two clusters that need real engines built next**, not more frontend polish.

---

## 3 · Functional dependency architecture (breadth)

Shared-engine analysis over `atlas.json`'s `engines`/`shared_engines` field —
these are the platform's actual internal "APIs": one engine, many consuming
pages.

| Shared engine | Modules depending on it | Concentration risk |
|---|---|---|
| `carbon_calculator` | 19 | **Highest** — a bug here ripples across 19 carbon-accounting modules |
| `methodology_engine` | 19 | Same footprint as above (co-located, likely imported together) |
| `portfolio_analytics_engine` | 10 | Powers the whole portfolio-* module family |
| `portfolio_analytics_engine_v2` | 9 | Overlaps heavily with the v1 engine's consumers — check for version-drift risk (are v1 and v2 consistent?) |
| `hydrogen_economy_engine` | 5 | Hydrogen family (derivatives/economics/market-intel/project-finance/storage) |
| `just_transition_engine` | 5 | Just-transition family |
| `green_hydrogen_engine` | 4 | Now wired end-to-end this session (was previously bypassed by 3 of its 4 consumers) |
| `insurance_climate_risk` | 4 | Now wired to `insurance-portfolio-climate`; the other 3 insurance-* pages deliberately left unwired (genuine scope mismatch — see backlog) |
| `scope3_analytics_engine` | 4 | Scope 3 family |
| `esg_ratings_engine`, `greenwashing_engine`, `monte_carlo_engine`, `sentiment_analysis_engine`, `transition_finance_engine` | 3 each | Second-tier shared cores |

**Strategic implication:** `carbon_calculator` + `methodology_engine` are the
platform's de facto shared carbon-accounting kernel. They already function as
an internal "Carbon-Calculation-as-a-Service" layer — worth formalizing that
explicitly (a documented internal API contract + regression test suite) rather
than leaving it as an implicit convention 19 modules happen to share. Any
future engine-methodology change here should run the full 19-module regression
sweep, not spot-checks.

**A measurement caveat on "blast radius":** the raw `blast_radius` field in
`atlas.json` (used as a hub-detection signal in earlier remediation work)
counts *shared database tables* as well as shared engines. A cluster of oddly
uniform `blast_radius=90` scores across 12 otherwise-unrelated modules
(`insurance-*` × 4, `supply-chain-*` × 8) traces to shared *reference* tables
(entities/companies/portfolios), not a real functional coupling — i.e. two
modules both reading the `companies` table doesn't mean a bug in one breaks
the other. Treat `blast_radius` as a *table-sharing* signal and the
shared-engine table above as the *functional-coupling* signal; they answer
different questions and shouldn't be conflated.

---

## 4 · Depth chains — a worked example

To illustrate how data actually flows several hops deep (not just breadth):

```
Company disclosure / PCAF loan data
   → pcaf_sovereign_engine / PCAF attribution (financed emissions, DQS)
      → portfolio-temperature-score (WACI → implied temperature)
         → climate-credit-integration (NGFS scenario × credit-risk conditioning)
            → dme-financial-risk / dme-risk-engine (materiality-weighted signal)
               → sovereign-esg-hub / cross-entity-intelligence-dashboard (portfolio-level synthesis)
```

Each hop was independently verified this session (PCAF sovereign engine is the
Wave-3 remediation reference implementation; portfolio-temperature-score and
climate-credit-integration were both deep-dived with worked examples; the DME
family was wired end-to-end in the §2 wiring-gap sweep). The chain is real, but
**it currently runs through five separately-maintained modules with no shared
integration test** — a regression in any one hop (e.g. the DQS classification
in PCAF sovereign) would silently propagate a wrong number all the way to the
portfolio-level dashboard with nothing to catch it. See §6.

---

## 5 · Strategic opportunities enabled by cross-module combination

These are *new use cases* the platform's breadth already supports but doesn't
yet package as a product surface:

1. **Climate-adjusted credit-insurance bundling.** `insurance_climate_risk`
   (Solvency II CAT/SCR/TP, now wired) + `physical_risk_pricing_engine` (real
   EP-curve/NGFS-amplified peril pricing, now wired) + PCAF financed-emissions
   attribution together cover the full underwriting chain for climate-exposed
   real assets — but they're three separate module visits today. A combined
   "Climate Underwriting Workbench" surfacing all three against one asset/
   counterparty would be a genuinely differentiated product, not a new model.
2. **Sovereign-corporate risk bridge.** The platform is deep on corporate
   climate risk and structurally thin on sovereign (§2) — but where it *does*
   have real sovereign engines (`sovereign_climate_risk_engine`,
   `pcaf_sovereign_engine`), nothing currently bridges a corporate holding to
   its sovereign-of-domicile risk in one view. This is the highest-leverage
   sovereign investment given how much corporate infrastructure already exists
   to hang it off.
3. **EU regulatory compliance chain.** `eu_taxonomy_engine` (Art. 3 TSC) +
   `eudr_engine` (Art. 9 traceability) + `eu_ets`/`eu_gbs` (ETS2/Green Bond
   Standard) + `xbrl_export_engine` (ESRS→XBRL tagging) are all now genuinely
   wired, standards-grounded engines covering adjacent parts of the same EU
   compliance stack (taxonomy alignment → deforestation-free sourcing → carbon
   pricing → machine-readable disclosure). A single "EU Compliance Cockpit"
   walking a company through all four in sequence would turn four separate
   regulatory point-solutions into one coherent workflow.
4. **Carbon-calculation-as-a-service, formalized.** Per §3 — 19 modules
   already share `carbon_calculator`/`methodology_engine`. Publishing this as
   a documented internal API (with the regression suite recommended in §6)
   would let *new* modules (or the 99 still-unclassified "Other" modules) plug
   into a proven calculation core instead of re-deriving carbon math per page —
   directly reducing the fabrication risk that caused most of this session's
   remediation work in the first place.
5. **DME (Dynamic Materiality Engine) as a cross-sector signal layer.** The DME
   family (contagion/nlp-engine/financial-risk/risk-engine/pd-engine, all now
   wired to real Hawkes-process and pulse-decay engines) is architecturally a
   *general-purpose* materiality/signal-propagation layer, not sector-specific
   — yet it's currently only consumed within its own module cluster. Exposing
   its `/process-signal` and contagion outputs to other sector dashboards
   (e.g. feeding a real-time materiality signal into `climate-litigation-risk-
   scorer` or `stranded-asset-analyzer`) would extend real-time signal
   propagation across sectors that currently only get static snapshots.

---

## 6 · Risk identification, quantification & monitoring framework

### 6.1 Module trust score (quantification)

A simple 0–4 composite already computed per module in `module_tags.json` as
`strategic_signal`, built from:

| Signal | Points |
|---|---|
| `blast_radius` ≥ 5 (many dependents / shared tables) | +2 |
| `blast_radius` 2–4 | +1 |
| Has `shared_engines` (functional coupling, not just table-sharing) | +1 |
| Uses one of the ~19 engines this session's remediation specifically hardened (honest-null design, real formulas — see `STRATEGIC_SIGNAL_HIGH_ENGINES` in the tagging script) | +1 |
| Tier A **and** provenance isn't purely `frontend-seed` | +1 |
| Title contains "hub"/"dashboard"/"command center"/"orchestrator" (aggregation point) | +1 |

This isn't a quality score — a Tier-B demo page can be perfectly honest about
being illustrative. It's a **leverage** score: how much would fixing or
breaking this module matter to the rest of the platform. Use it to prioritize
future audit/remediation passes (start with high-leverage modules) rather than
sweeping the whole atlas uniformly each time.

### 6.2 Systemic risks surfaced by this analysis

- **Carbon-calculator concentration** (§3) — no regression suite currently
  covers all 19 dependents; a methodology change is the single highest-blast
  -radius change possible on this platform.
- **Silent multi-hop chains with no integration test** (§4) — the PCAF→
  portfolio-temp→climate-credit→DME chain (and others like it) has no
  end-to-end test; each module's *own* tests pass, but nothing verifies the
  chain as a whole stays consistent.
- **Environment-dependent wiring fragility** — the §2 remediation sweep found
  that `REQUIRE_AUTH=true` gates every POST endpoint in this dev environment,
  meaning "Live" wiring silently degrades to "Demo Data" in any session
  without an active auth token. This is *working as designed* (graceful
  fallback), but it means routine manual QA in an unauthenticated browser
  session will never actually exercise the real code path — a monitoring gap,
  not a code gap.
- **Sector coverage gaps are structural, not incidental** (§2) — Sovereign/
  Macro and Governance/Social being 85%+ frontend-only isn't a backlog item to
  clear, it's a standing platform characteristic that should inform any
  claims made about platform coverage in those two areas specifically.

### 6.3 Recommended monitoring & review cadence

| Check | Cadence | Why |
|---|---|---|
| `backend/tools/check_no_fabricated_random.py --report` | Every PR (already CI-gated) | Prevents regression back to random-as-data fabrication |
| Re-run `docs/module_atlas` deep-dive pass on a sample | Quarterly, or after any sprint touching >10 modules | The 963 deep-dive docs will drift from code the moment new modules ship or existing ones change — the atlas is a snapshot, not live |
| Wiring-gap spot-check (does "Live" badge actually fire with a real auth session, not just fall back gracefully?) | Quarterly | Distinct from the fabrication guardrail — checks the *frontend* actually calls the *real* backend, not just that the backend itself is honest |
| Carbon-calculator / methodology_engine regression suite (§6.2) | Every change to either engine | Highest-concentration shared dependency on the platform |
| Sector coverage re-tally (`build_module_tags.py`) | After any sprint adding new modules | Tracks whether Sovereign/Governance gaps are closing or new gaps are opening elsewhere |
| Multi-hop chain integration test (§4 example, and others found via `shared_engines` traversal) | Build once, run every release | Currently the single biggest silent-failure risk identified in this analysis |

---

## 7 · What this document is not

This is a point-in-time synthesis (2026-07-03/04) over mechanically-classified
data plus this session's audit findings — it is not a live dashboard and will
go stale exactly as fast as the underlying atlas does (see §6.3). The sector
taxonomy is a pragmatic ~90%-coverage keyword classification, not a
professionally-validated GICS-style standard — treat cluster boundaries as
directionally useful, not authoritative. Where this document makes a coverage
claim (e.g. "Sovereign is 15% Tier-A"), that claim is checkable directly
against `docs/module_atlas/module_tags.json` and `atlas.json` — verify before
citing externally.
