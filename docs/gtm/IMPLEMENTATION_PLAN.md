# Implementation Plan — Top-25 GTM Business Cases

*Companion to `TOP25_BUSINESS_CASES.md` (the 25 cases + honest readiness grades),
`GTM_ROADMAP.md` (G0–G3 phases, §6 pre-GTM dependencies), `CRITICAL_REVIEW_UAT_AUDIT.md`
(B1 open bugs / B2 limitations / B3 missing tests / A1–A4 persona UAT scripts), and
`PRODUCTIZATION_ROADMAP.md` (P0–P3 phases, D0–D5 database stages). All module ids
validate against `docs/module_atlas/atlas.json`. No calendar dates — all timing is
week-offsets from G0 start (G0+n) plus effort bands.*

---

## 1 · Reading guide & workstream model

**Two layers.** Work that many cases share lives in five **cross-cutting workstreams**
(W1–W5, §2) so it is planned once; each of the 25 **per-case plans** (§3) then contains
only what is specific to that case, and declares its workstream dependencies by id.
When an implementation item already exists in `PRODUCTIZATION_ROADMAP.md`, the plan
cross-references the P-phase/D-stage instead of duplicating it (e.g. demo seeding = D0;
copilot = P1; write-sweep = D1).

**Effort bands:** **S** ≤ 2 person-days · **M** ≤ 1 person-week · **L** = 2–3
person-weeks. Bands are per-case *incremental* effort — a case's share of a workstream
is counted in the workstream, not double-counted in the case.

**Grades are binding** (per `GTM_ROADMAP.md` §8): 🟢 case plans are content/demo-polish;
every 🟡 case plan contains its *named* fix from `TOP25_BUSINESS_CASES.md` /
`CRITICAL_REVIEW_UAT_AUDIT.md`; the single 🔴 case (BC-25) carries an explicit go/no-go
decision step. Gap tags: **[bug]** (B1 or a TOP25-named defect) · **[wiring]**
(engine exists, page/route not connected) · **[data]** (engine correct, data thin or
keyless) · **[content]** (demo script, disclosure, benchmark collateral) · **[none]**.

**Definition of demo-ready (DoD)** always resolves to a testable criterion — usually a
numbered step of the four persona UAT scripts in `CRITICAL_REVIEW_UAT_AUDIT.md` Part A
(A1 financial, A2 energy, A3 supply chain, A4 manufacturing), run against the
*deployed* URL, not localhost.

---

## 2 · Cross-cutting workstreams

### W1 — Deploy + seed foundation (the 8 GTM §6 gate items)

**Scope:** the eight named pre-GTM dependencies from `GTM_ROADMAP.md` §6, sequenced.
These gate G0→G1; nothing customer-facing happens before item 1 below. **Owner-type:**
backend (items 2–7), devops/backend (item 1), data (item 3). **Effort:** L overall.

| Seq | GTM §6 item | Week | Effort | Blocked BCs |
|---|---|---|---|---|
| 1 | §6-8 Commit/push the ~1,353 uncommitted files, rotate `SECRET_KEY` off the repo placeholder, Railway deploy (all `docs/DEPLOYMENT.md` blockers) | G0+0→1 | M | **All 25** — nothing is demoable off-laptop before this |
| 2 | §6-3 Seed realistic demo books: 200–500-holding portfolio + demo carbon book (B2c actions; = D0 in `PRODUCTIZATION_ROADMAP.md`) | G0+1→2 | M | BC-10, BC-11, BC-12 (demo depth); feeds W2 |
| 3 | §6-1 Wire E104 page to its engine (B1 #3 — page renders seeded-random values on some tabs while the real engine response is discarded) | G0+1→2 | M | BC-10 |
| 4 | §6-2 GLEIF bulk ingest run — `entity_lei` 3 rows → ≥100k (B2c; ingester already fixed) | G0+2 | S | BC-14 |
| 5 | §6-7 Fix severity `.length` bug + `climate-var-engine` interaction-term defect | G0+2→3 | M | BC-11 (full-suite runs) |
| 6 | §6-4 Fix valuation Decimal×float + null bugs (B1 #6, #7) | G0+3 | S | BC-18 |
| 7 | §6-5 Fix `virtual-power-plant` 144× annualisation bug | G0+3 | S | BC-04 (its fourth module; demo can proceed without it) |
| 8 | §6-6 EUDR empty-reference disclosure made un-missable OR BC-25 held back (WDPA license go/no-go) | G0+4 | S (decision) | BC-25 |

Hygiene rider (same pass, not gate items): park/delete the dead legacy portfolios
router (B1 #2, P3) and add explicit float coercion on the gbif-screening /
nasa-power / open-meteo route params (B1 #4, P3).

### W2 — Demo-environment factory (per-segment seeded books)

**Scope:** one seeded, resettable demo environment per segment on the deployed
instance — the "3 flagship demo environments" required by the G0 gate. Energy book:
2 template project-finance deals in `financial-modeling-studio`, a PPA portfolio with
two real resource locations (Seville solar / North Sea wind), a 10-site siting
candidate list with lat/lng, one BESS asset. FI book: the 200–500-holding portfolio
from W1-seq2 with lat/lng + LEI + sector per holding (so BC-10/11/12/13/14 all run on
the *same* book), plus the demo carbon book. Compliance book: one EU-scoped corporate
entity with an ESRS datapoint mapping in flight, an SFDR fund with the 5 named
holdings, a steel-importer trade ledger for CBAM. Includes the **disclosure register**:
every demo script must surface the disclosed limitations (wildfire country-level
resolution, Open-Meteo fixed-scenario, Comtrade preview tier, GB-only live grid until
keys, EUDR empty reference, demo-book labeling). Seed through ORM/endpoints — never raw
SQL — to avoid the NULL `updated_at` class of bugs (B2c). **Owner-type:** data + GTM.
**Effort:** L (M per segment). **Unblocks:** demo depth for all 25; hard requirement
for BC-01, BC-02, BC-07, BC-10, BC-11, BC-12, BC-14, BC-19, BC-20, BC-22.

### W3 — Bench coverage expansion (which engines get pins)

**Scope:** extend `bench_quant.py` per the B3 missing-test inventory, in this order:
(1) Financial Modeling Studio IRR/QMC vs a hand model — B3's top-ranked gap (BC-02);
(2) hazard-grid regression — pin the §7.4 spot-check table (Tokyo/Miami/Kazakhstan) as
a script (BC-07, BC-10, BC-17); (3) tax-equity flip year vs the Atlas worked example
(BC-03, per UAT A2 step 4); (4) BESS stacking additivity — disable one market, total
drops by exactly that stream (BC-04, per A2 step 5); (5) PCAF per-instrument AF
reference cases (BC-12, per its §9 Evolution A); (6) post-fix pins for
`climate-var-engine` (BC-11) and the GAR formula (BC-21); (7) then the B3 "top-20
blast-radius engines" ladder (XVA for BC-01, DCM for BC-15) as G1/G2 background work.
Playwright smoke (login → 4 persona landing pages → 1 calc each) and the RBAC
matrix test from B3 ride along at G1. **Owner-type:** backend/quant. **Effort:** M
(items 1–6), ongoing L thereafter. **Unblocks:** credibility DoD for BC-02, BC-03,
BC-04; the "bench-verified vs hand calculation" sales wedge for the whole FI segment.

### W4 — Copilot enablement (P1, gated — G2, not G1)

**Scope:** Tier-1 module copilot per `PRODUCTIZATION_ROADMAP.md` §1 (pgvector +
`llm_corpus_chunks` in P0, copilot GA in P1), landing at **G2** per `GTM_ROADMAP.md` §4
— the `bench_llm.py` no-fabrication harness is a hard prerequisite. First module sets =
the six flagship cases' primaries, whose §9 Evolution B specs are already written:
`financial-modeling-studio`, `global-physical-risk-atlas`, `physical-risk-pricing`,
`pcaf-financed-emissions`, `sfdr-pai`, `cbam-trade-exposure-mapper`. Note the
documented hard gates: `physical-risk-pricing` Evolution B requires W1-seq3 (E104
wiring) done first; `cbam-trade-exposure-mapper` Evolution B requires its Evolution A
live trade refresh. **Owner-type:** backend + LLM. **Effort:** L. **Unblocks:** no
G0/G1 DoD depends on it — it is the G2 copilot-beta gate item and the Phase-2 layer of
BC-02, BC-07, BC-10, BC-12, BC-20, BC-22.

### W5 — Data population (D0/D1 + keys)

**Scope:** cross-references `PRODUCTIZATION_ROADMAP.md` D0/D1 rather than restating:
D0 = GLEIF bulk + demo books (already sequenced as W1-seq2/seq4) + widen
`dh_data_sources.cost` varchar. D1 = lineage-harness `--allow-writes` sweep against a
disposable Supabase branch DB, closing the 635-mutation-endpoint blind spot (B2 #8) and
generating realistic write-side fixtures. Plus the key/tier acquisitions: free EIA +
ENTSO-E API keys (BC-08), UN Comtrade key above preview tier (BC-22), and the WDPA
license decision input (BC-25). Plus the B2c grep pass confirming no engine silently
reads an empty sibling scenario table. **Owner-type:** data. **Effort:** M (D1 sweep is
the bulk). **Unblocks:** BC-08, BC-14, BC-22 depth, BC-25 (conditional), and the write-
path confidence behind every mutating demo step.

---

## 3 · Per-case implementation plans (BC-01 … BC-25)

### Segment A — Energy Developers & IPPs

---

**BC-01 · PPA structuring & valuation desk** — 🟢 · target G0

- **Current state:** demo-ready — NASA POWER resource wiring proven (Seville vs North
  Sea yields genuinely differ) and the `ppa-xva-engine` lattice is real.
- **Gaps:** [none] engine-side · [content] scripted two-location comparison + XVA
  walkthrough (XVA is atlas-audited, unpinned — B2b coverage skew) · [content] B1 #4
  float-coercion hygiene touches the nasa-power route this case leans on (P3, W1
  rider).
- **Steps:** 1. Seed the two-location PPA book in the energy demo env (W2). 2. Script
  UAT A2 step 1 (capture rates/yields differ plausibly, NASA POWER cited as source) as
  the standard demo. 3. Queue XVA for a W3 ladder pin (G1 background). 4. Fold the
  desk into the BC-02 flagship narrative (`ppa-structuring-desk` → studio hand-off).
- **Effort:** S. **Depends on:** W1-seq1, W2-energy.
- **DoD:** UAT A2 step 1 passes live on the deployed URL; both locations cite NASA
  POWER provenance in the UI.

---

**BC-02 · Climate-integrated project finance modeling** — 🟢 · flagship · target G0

- **Current state:** demo-ready — the flagship 2,425-line PRNG-free
  `financial-modeling-studio` engine with 8 endpoints is live; the *benchmark pin* is
  the pending item (B3's top-ranked missing test).
- **Gaps:** [content] no bench pin — one hand-built reference model (assumptions →
  known IRR/DSCR) does not yet exist (B3 row 1; UAT A2 step 2 is ◻) · [none] engine
  wiring.
- **Steps:** 1. Build the reference deal by hand (spreadsheet), run `/run` and the QMC
  `/simulate` path, replicate IRR/DSCR within tolerance — UAT A2 step 2, once. 2. Pin
  it in `bench_quant.py` (W3 item 1) so refactors can't silently break the flagship.
  3. Seed 2 template deals in the energy demo book (W2). 4. Author the GTM §5 content
  wedge: studio model vs a named public deal's disclosed assumptions. 5. **Phase-2
  (G1/G2), per §9 Evolution A** — do not invent alternatives: (a) implement the
  per-period LLCR/PLCR series the route docstring promises but the code reduces to a
  single COD-vintage scalar; (b) refresh the NGFS extract from the IIASA Scenario
  Explorer as a versioned-ingester job, replacing linear 5-year interpolation; (c)
  replace the labeled diversification proxy in `/consolidate` with a covariance
  estimated from ingested price history (honest fallback to the proxy where history is
  thin). 6. **Phase-2 (G2), per §9 Evolution B:** tier-2 structuring analyst driving
  `/solve`, `/scenario-matrix`, `/solve-frontier` conversationally (W4).
- **Effort:** M (steps 1–4). **Depends on:** W1-seq1, W2-energy, W3.
- **DoD:** `bench_quant.py` studio case passes; A2 step 2 converts ◻→✅; two identical
  `/simulate` runs are byte-identical on the deployed URL.

---

**BC-03 · Tax equity & transferability structuring (IRA)** — 🟢 · target G0

- **Current state:** demo-ready — flip solver with a worked example in the Atlas
  deep-dive.
- **Gaps:** [none] · [content] the flip-year hand check (UAT A2 step 4) has not been
  pinned.
- **Steps:** 1. Verify the partnership-flip solver's flip year against the known hand
  example in its Atlas deep-dive (A2 step 4). 2. Pin it (W3 item 3). 3. Script the
  flip-vs-§6418-transfer comparison demo on `tax-equity-transferability`.
- **Effort:** S. **Depends on:** W1-seq1.
- **DoD:** A2 step 4 passes live; flip year matches the deep-dive example exactly.

---

**BC-04 · BESS revenue stacking & dispatch** — 🟡 · target G1

- **Current state:** stacking logic real across `battery-revenue-stacker` /
  `bess-grid-analytics` / `energy-storage-analytics`, but `virtual-power-plant` has the
  documented 144× annualisation bug (its §9 evolution gates on the fix) — the named fix
  for this case.
- **Gaps:** [bug] `virtual-power-plant` 144× annualisation (TOP25 note; GTM §6-5;
  W1-seq7) · [content] stacking additivity never regression-tested (A2 step 5).
- **Steps:** 1. Fix the annualisation in the VPP engine (the revenue aggregation
  multiplies by interval count where it should average/scale — correct the
  intervals-per-day→year conversion) and update its atlas §7. 2. Add the additivity
  regression: run a stack, re-run with one market disabled, total drops by exactly that
  stream (A2 step 5 → W3 item 4). 3. If the fix slips past G0+3, demo on the three
  sound modules and exclude `virtual-power-plant` from the script (allowed per GTM §6-5).
  4. Seed the BESS asset in the energy demo book (W2).
- **Effort:** M. **Depends on:** W1-seq7, W2-energy, W3.
- **DoD:** A2 step 5 passes live; VPP annualised revenue is within an order-of-magnitude
  sanity band of the per-interval sum × intervals, or the module is out of the demo path.

---

**BC-05 · Green hydrogen / P2X economics** — 🟡 · target G1

- **Current state:** core LCOH real across `green-hydrogen` / `power-to-x-finance`,
  but `green-hydrogen-economics` has the documented guide↔code mismatch — the named fix.
- **Gaps:** [wiring] `green-hydrogen-economics` guide↔code mismatch (TOP25 note; the
  module's documented behavior diverges from its atlas guide).
- **Steps:** 1. Reconcile: read the module's atlas §7 vs the code, decide which is
  correct, align the other, and record the resolution in the deep-dive. 2. Re-verify
  the LCOH worked example after alignment. 3. Script the RFNBO-compliant
  LCOH/electrolyzer-sizing demo.
- **Effort:** S. **Depends on:** W1-seq1.
- **DoD:** guide and code agree (documented in the atlas record); LCOH demo reproduces
  the documented worked example live.

---

**BC-06 · Offshore wind development finance** — 🟢 · target G0

- **Current state:** demo-ready — flagged "genuinely well-built" in the evolution
  review across all four modules.
- **Gaps:** [none] · [content] chained demo script.
- **Steps:** 1. Script the resource-to-financing chain: `offshore-wind-resource` yield →
  `offshore-wind-om` O&M → `offshore-wind-finance` debt sizing →
  `offshore-grid-infrastructure`. 2. Add one North Sea reference site to the energy
  demo book (shared with BC-01's second location).
- **Effort:** S. **Depends on:** W1-seq1, W2-energy.
- **DoD:** the four-module chain runs end-to-end live with no console errors and each
  stage consuming the prior stage's output.

---

**BC-07 · Site physical-risk screening** — 🟢 · flagship · target G0

- **Current state:** demo-ready — 5 hazard grids populated and spot-verified against
  real USGS/IBTrACS/GWIS/OpenFEMA/IPCC sources; the wildfire country-resolution caveat
  must be disclosed.
- **Gaps:** [content] wildfire is country-level resolution — same-country sites show no
  wildfire differentiation (B2 #4; A4 ⚠️) — disclosure must be in every demo ·
  [data] flood (~48 rows) and sea-level (~152 rows) are named-location samples vs
  thousands for the other perils (B2 #4) — disclosed via per-hazard
  `data_availability`, filled in Phase-2 · [content] hazard-grid regression not pinned
  (B3 — re-ingestion has silently regressed twice).
- **Steps:** 1. Pin the §7.4 spot-check table (Tokyo seismicity / Miami cyclone /
  Kazakhstan) as a regression script (W3 item 2). 2. Put the wildfire + flood/sea-level
  coverage caveats into the W2 disclosure register and the demo script verbally.
  3. Seed the 10-site candidate list (W2) and script the screening: profile sites,
  show per-hazard `data_availability`, show composite re-normalisation over available
  hazards. 4. **Phase-2 (G1/G2), per §9 Evolution A:** bulk-ingest gridded flood
  (JRC global flood maps or FEMA NFHL) and IPCC AR6 sea-level to grid parity; calibrate
  the normalisation constants (fwi/50, magnitude/9, wind/200, depth/5) against observed
  loss/event frequency; add return-period trend layers. 5. **Phase-2 (G2), per §9
  Evolution B:** point-and-portfolio hazard copilot (W4) — must report
  `data_availability` per hazard and never present missing coverage as low risk.
- **Effort:** S (demo-ready), L (Phase-2). **Depends on:** W1-seq1, W2-energy, W3.
- **DoD:** UAT A4 step 2 passes live (3 real plant coordinates, hazard scores differ
  sensibly, `data_availability` honest — flood "not sampled" inland); hazard regression
  script green.

---

**BC-08 · Grid carbon intelligence & 24/7 CFE** — 🟡 · target G1

- **Current state:** GB fully live; US/EU return *labeled* seeded fallback until free
  EIA + ENTSO-E API keys are set — the named fix is key acquisition, not code.
- **Gaps:** [data] EIA + ENTSO-E keys unset (A2 ⚠️; TOP25 note) · [content] Live-vs-
  fallback labels must be visibly different in the demo (A2 step 3).
- **Steps:** 1. Register the free EIA and ENTSO-E keys; set them in the deployed
  environment (W5). 2. Verify `api::eia_energy` and `api::entsoe_grid` flip to Live and
  the badges change (this is also audit checklist item "Live/Demo badges flip when key
  unset"). 3. Script the GB-vs-US/EU hourly-mix comparison for CFE claims.
- **Effort:** S. **Depends on:** W1-seq1, W5.
- **DoD:** A2 step 3 passes live: GB live, US/EU live once keyed — or visibly labeled
  fallback if a key is still pending, never unlabeled.

---

**BC-09 · YieldCo / asset rotation analytics** — 🟢 · target G0

- **Current state:** demo-ready — NX2-14 build, engine-computed CAFD accretion and
  dropdown NAV bridge.
- **Gaps:** [none] · [content] demo dropdown case.
- **Steps:** 1. Script one dropdown scenario on `yieldco-dropdown-analyzer` fed from
  `renewable-project-pipeline` assets in the energy demo book. 2. Verify CAFD-accretion
  figures trace to the engine response (spot lineage check).
- **Effort:** S. **Depends on:** W1-seq1, W2-energy.
- **DoD:** dropdown demo runs live; the NAV-bridge numbers match the API payload in
  devtools.

---

### Segment B — Financial Institutions

---

**BC-10 · Portfolio physical climate risk (asset-level)** — 🟡 · flagship · target G1

- **Current state:** the `physical-risk-pricing` (E104) engine is bench-verified, but
  the page still renders its legacy seeded-random path on some tabs while discarding
  the real engine response — the single most audit-sensitive known issue for the
  financial persona (B1 #3).
- **Gaps:** [bug][wiring] E104 seeded-random tabs (B1 #3; GTM §6-1; W1-seq3 — the named
  fix) · [data] only 3 portfolios in DB, no volume book (B2c; W1-seq2) · [content]
  provenance walkthrough script.
- **Steps:** 1. Rewire every E104 tab to the `/price` response per the specced §8
  upgrade — and *delete* the seeded generator path, don't just bypass it (so no code
  path can regress back). 2. Run UAT A1 step 3: price one asset via `/price` with
  lat/lng; confirm every displayed number traces to the response — converts ⚠️→✅.
  3. Seed the 300-holding FI book with lat/lng per holding (W1-seq2/W2) and run batch
  EAL/PML across it with `asset-exposure-explorer`. 4. Script the provenance demo:
  one priced asset traced via its lineage file to `global-physical-risk-atlas` grid
  sources. 5. **Phase-2 (G1/G2), per §9 Evolution A:** resolution cascade in
  `price_physical_risk()` — coordinate → zone-level driver values from the digital-twin
  grids → country-baseline fallback with `resolution_tier` reported (GLEIF pattern);
  fit GPD exceedance curves where claims density supports it; backtest EAL vs NFIP
  claims by county-year and publish calibration error in the payload. 6. **Phase-2
  (G2), per §9 Evolution B:** underwriter copilot with tool-called repricing (W4) —
  Evolution B's stated hard prerequisite is step 1 of this plan.
- **Effort:** M (steps 1–4). **Depends on:** W1-seq2, W1-seq3, W2-FI, W3 (hazard pin).
- **DoD:** A1 UAT step 3 passes live with zero seeded values (every number on the page
  present in the `/price` response); grep confirms the seeded generator is gone from
  the page source.

---

**BC-11 · Climate stress testing (ECB/EBA/BoE style)** — 🟡 · target G1

- **Current state:** `stress-test-orchestrator` (E100) is deterministic and
  bench-pinned, but the full suite is blocked by the documented `climate-var-engine`
  interaction-term defect and the open severity `.length` bug — the named fixes.
- **Gaps:** [bug] severity `.length` bug (TOP25 note; GTM §6-7) · [bug]
  `climate-var-engine` interaction-term defect (TOP25 note; GTM §6-7) · [bug] the
  scenario preview route 500s under uvicorn from repo root — absolute import assuming a
  different working directory (B1 #5, P2; this is a stress-testing surface) · [data]
  thin portfolio book (B2c; W1-seq2).
- **Steps:** 1. Fix the severity `.length` frontend bug (JS `.length` on a non-array
  severity value — guard/normalize the shape). 2. Fix the `climate-var-engine`
  interaction term per its atlas §7 documentation; then pin the corrected formula in
  `bench_quant.py` (W3 item 6). 3. Fix B1 #5: make the scenarios preview import
  relative/package-safe and re-sweep the domain. 4. Run A1 step 2 on the deployed URL:
  same scenario twice → byte-identical (orchestrator determinism is already
  bench-proven; this re-proves it post-fix). 5. Script a supervisory-scenario run over
  the seeded FI book with `supervisory-scenario-runner`.
- **Effort:** M. **Depends on:** W1-seq2, W1-seq5, W2-FI, W3.
- **DoD:** A1 step 2 passes live AND a full-suite run including `climate-var-engine`
  completes with neither defect; scenario preview returns 200 from a repo-root uvicorn.

---

**BC-12 · Financed emissions / PCAF reporting** — 🟢 · flagship · target G0

- **Current state:** demo-ready — WACI/DQS bench-pinned, sovereign attribution
  deterministic; the engine implements correct PCAF attribution-factor formulas for 13
  instrument types.
- **Gaps:** [data] positions and reported emissions behind the engine are seed data
  (its §9 Evolution A names this) — acceptable at G0 *if disclosed as a demo book*
  (B2c carbon-book row says exactly that) · [content] per-instrument AF pins not yet
  in `bench_quant.py` (Evolution A acceptance item).
- **Steps:** 1. Align the demo carbon book + FI holdings (W1-seq2/W2) and label them
  demo. 2. Script the WACI/DQS demo and the honest-nulls proof: empty portfolio →
  `insufficient_data`, never invented (A1 step 5, already bench-verified behavior —
  show it live). 3. Pin the 13 per-instrument AF reference cases (W3 item 5).
  4. **Phase-2 (G1/G2), per §9 Evolution A:** wire positions to `portfolios_pg`
  resolving holdings via GLEIF/OpenFIGI; pull real EVIC from market data and reported
  Scope 1/2 from CDP/disclosures with PCAF sector-median proxy + DQ score where
  missing; World Bank PPP-GDP for sovereign attribution; real bond sizes for
  use-of-proceeds. 5. **Phase-2 (G2), per §9 Evolution B:** financed-emissions
  reporting analyst (W4) — a natural tier-3 hub via the CarbonCreditContext bus;
  RBAC-gate any write to the shared context.
- **Effort:** S (demo-ready), M (Phase-2 step 4). **Depends on:** W1-seq2, W2-FI, W3;
  Phase-2 also W1-seq4 (GLEIF).
- **DoD:** A1 step 5 passes live (empty portfolio → honest `insufficient_data`); WACI
  on the demo book matches the bench-pinned value.

---

**BC-13 · Climate-in-Basel capital integration** — 🟢 · target G0

- **Current state:** demo-ready — routing, PD floors, and climate quarantine all
  hand-verified and bench-pinned.
- **Gaps:** [none] · [content] demo script.
- **Steps:** 1. Script the demo directly off the pinned reference cases: retail
  risk-weight routing, 5bps PD floor, 72.5% output floor, climate quarantine in RWA —
  on `regulatory-capital` + `climate-capital-adequacy` with `api::basel3_liquidity`.
  2. Show the bench: "here is our number vs the hand calculation" (the GTM §5 FI
  proof wedge).
- **Effort:** S. **Depends on:** W1-seq1.
- **DoD:** live demo reproduces the `bench_quant.py` pinned values for floor and
  quarantine mechanics on the deployed URL.

---

**BC-14 · Counterparty & entity climate due diligence** — 🟡 · target G1

- **Current state:** the resolve→ownership→sanctions chain is live-proven (Novo Nordisk
  live-resolve → cache test), but `entity_lei` holds only 3 JIT-cached rows until the
  bulk ingest runs, and `entity-360` has the documented missing-data-rewards-rating bug.
- **Gaps:** [data] `entity_lei` = 3 rows — the "golden source" is currently a lazy
  cache; cold typeahead misses go to live GLEIF each time (B2c; GTM §6-2; W1-seq4 — the
  named fix) · [bug] `entity-360` missing-data-rewards-rating: an entity with missing
  data scores *better* (TOP25 note).
- **Steps:** 1. Run the (already-fixed) weekly GLEIF bulk ingester once at scale;
  verify ≥100k LEIs by live COUNT (the B2c action verbatim). 2. Fix the `entity-360`
  rating logic so missing inputs penalize or flag the composite rather than rewarding
  it (honest-nulls convention: missing ≠ good). 3. Run A1 step 4 end-to-end: typeahead
  → LEI with `resolution_tier` shown → `counterparty-ownership-graph` → sanctions
  screen via `sanctions-screening-desk`. 4. Script the one-entity-view demo joining
  climate exposure from the FI book.
- **Effort:** M. **Depends on:** W1-seq4, W2-FI, W5.
- **DoD:** A1 step 4 passes live with a cold typeahead served from the local golden
  source (no JIT GLEIF round-trip), and a deliberately data-thin entity shows a
  flagged/degraded rating, not an improved one.

---

**BC-15 · Green/sustainable bond pricing & greenium** — 🟢 · target G0

- **Current state:** demo-ready — flagged genuinely strong in the evolution review.
- **Gaps:** [none] · [content] demo script; DCM engines are atlas-audited but unpinned
  (B2b coverage skew — background W3 ladder, not a G0 gate).
- **Steps:** 1. Script issuance pricing + greenium signal + use-of-proceeds tracking
  across `green-bond-pricing-desk`, `greenium-signal`, `green-securitisation`.
  2. Queue a DCM methodology pin on the W3 ladder (G1/G2 background).
- **Effort:** S. **Depends on:** W1-seq1.
- **DoD:** pricing → greenium → proceeds demo runs live with all figures traceable to
  engine responses (spot lineage check on one number).

---

**BC-16 · Transition finance origination & credibility** — 🟡 · target G1

- **Current state:** `energy-transition-credit-portal` is engine-backed (NX2-15), but
  the `transition-finance` page discards its own API response — the named, documented
  wiring gap.
- **Gaps:** [wiring] `transition-finance` fetches then discards its API response,
  rendering local values instead (TOP25 note).
- **Steps:** 1. Wire the page's render state to the fetched response (same class of
  fix as E104 but page-local; remove the discarded-response path). 2. Verify displayed
  PD/LGD/EL and RAROC-under-NGFS-deltas byte-match the API payload in devtools.
  3. Until step 1 lands, demo exclusively through `energy-transition-credit-portal`
  and `transition-bond-credibility` (both engine-backed).
- **Effort:** S. **Depends on:** W1-seq1.
- **DoD:** every number on the `transition-finance` page appears verbatim in its API
  response (devtools network check), and the multi-stream borrower demo runs live.

---

**BC-17 · Climate underwriting & CAT exposure (insurers)** — 🟢 · target G0

- **Current state:** demo-ready — physical VaR = 1-in-100 PML and EIOPA SCR correlation
  aggregation both bench-pinned.
- **Gaps:** [none] · [content] demo script; the wildfire country-resolution caveat
  (B2 #4) applies to CAT exposure exactly as in BC-07 — include the disclosure.
- **Steps:** 1. Script the peril-priced underwriting demo on
  `climate-underwriting-workbench` + `climate-insurance` with the EP-curve EAL and the
  digital-twin hazard feed. 2. Reuse the W2 disclosure register (wildfire resolution,
  flood/sea-level coverage). 3. Lead with the bench pins (PML + SCR) as the proof wedge.
- **Effort:** S. **Depends on:** W1-seq1, W2-FI, W3 (hazard regression pin shared with
  BC-07).
- **DoD:** live demo reproduces the pinned 1-in-100 PML and SCR aggregation values;
  hazard caveats stated in-script.

---

**BC-18 · Real estate portfolio climate analytics** — 🟡 · target G1

- **Current state:** the RE DCF is bench-pinned, but three valuation endpoints carry
  open bugs on real payloads — the named fixes (B1 #6–7).
- **Gaps:** [bug] Decimal×float TypeError in the replacement-cost and
  direct-capitalization valuation endpoints — Pydantic Decimal fields multiplied by
  float constants, fails on real payloads (B1 #6, P2; GTM §6-4) · [bug] valuation
  map-data `float(None)` crash — defensive-input gap (B1 #7, P2).
- **Steps:** 1. Fix B1 #6: normalize the arithmetic (cast constants to Decimal or the
  fields to float — one convention, applied to both endpoints). 2. Fix B1 #7: null-guard
  the map-data numeric fields (same defensive class as B1 #1). 3. Re-sweep the
  valuation domain via the lineage harness; add a regression payload with nulls.
  4. Confirm the RE DCF bench pin still green. 5. Script CRREM pathways + green premium
  on `real-estate-carbon-analytics` / `real-estate-valuation` with
  `api::green_premium_tenant` and hazard pricing via `asset-exposure-explorer`.
- **Effort:** M. **Depends on:** W1-seq6, W2-FI.
- **DoD:** all three valuation endpoints return 200 on real payloads including
  null-field payloads; CRREM demo runs live with the DCF pin green.

---

### Segment C — Compliance & Regulatory

---

**BC-19 · CSRD/ESRS reporting factory** — 🟡 · target G2

- **Current state:** the catalogs are real (1,184-row ESRS catalog in the DB), but the
  `esrs-datapoint-navigator` surfaces only 307 of 1,144 datapoints — the named,
  documented shortfall.
- **Gaps:** [wiring][data] navigator 307-vs-1,144 datapoint shortfall (TOP25 note) —
  the full catalog exists in the DB; the navigator reads a partial set.
- **Steps:** 1. Point the navigator's datapoint source at the full ESRS catalog table
  and reconcile its schema mapping (the gap is read-path, not catalog-side). 2. Verify
  the returned count ≥1,144 and spot-check 10 datapoints across topical standards
  against the official list. 3. Wire one end-to-end topic demo: datapoint mapping in
  `esrs-datapoint-navigator` → disclosure drafting in `csrd-esrs-automation` →
  `assurance-readiness-engine` scoring, persisted via `api::csrd_reports`. 4. Seed the
  compliance demo entity's in-flight mapping (W2). 5. Sequence after BC-24/BC-20/BC-22
  in compliance demos (those are 🟢 and carry the segment at G0/G1).
- **Effort:** M. **Depends on:** W1-seq1, W2-compliance.
- **DoD:** navigator returns the full datapoint set (count matches the DB catalog) and
  one ESRS topic runs mapping→draft→assurance live end-to-end.

---

**BC-20 · SFDR PAI & product disclosure** — 🟢 · flagship · target G0

- **Current state:** demo-ready — the 2,044-LOC `sfdr_pai_engine` is substantive and
  the honest-nulls behavior is verified (empty portfolio → `insufficient_data`, never
  invented).
- **Gaps:** [content] the demo must disclose the documented indicator coverage: per its
  §9 (open REM-38 findings), PAI-16 is mislabelled and PAI-17/18 (real-estate) are
  absent — 16 of 18 mandatory indicators exist; the sibling `sfdr-pai-dashboard`
  already carries the corrected 18-row taxonomy · [none] engine/computation.
- **Steps:** 1. Script the honest-nulls flagship demo (A1 step 5): empty portfolio →
  `insufficient_data` warnings live — this IS the segment's positioning proof.
  2. State the 16/18 indicator coverage in the demo script (disclosure register, W2).
  3. Demo the real-data path (5 named holdings; PAI-1/2/4 CDP-wired for O&G) from the
  compliance demo book. 4. **Phase-2 (G1), per §9 Evolution A:** port the sibling's
  corrected 18-row taxonomy (relabel PAI-16, add PAI-17/18) into the page and the
  engine's calculate-all path; mark non-sourced fields `estimated: true` so estimates
  are distinguishable from disclosures; replace the totalAUM-or-1 guard with an
  explicit empty-portfolio state; surface the already-built `/benchmark` and
  `/compare-periods` routes in the UI. 5. **Phase-2 (G2), per §9 Evolution B:**
  data-coverage triage analyst over `/data-coverage`, `/classify-entity`,
  `/calculate-all` (W4) — Evolution B's stated prerequisite is step 4's `estimated`
  flags.
- **Effort:** S (demo-ready), M (Phase-2 step 4). **Depends on:** W1-seq1,
  W2-compliance.
- **DoD:** A1 step 5 passes live on the deployed URL; the mandatory-indicators
  reference endpoint's coverage is stated in-demo; after Phase-2, it returns 18
  correctly-labelled rows.

---

**BC-21 · EU Taxonomy alignment & GAR** — 🟡 · target G1

- **Current state:** the engines are real, but two documented methodology defects —
  GAR denominator narrower than the Delegated Act (overstates GAR) and a flagged
  eligible ×1.5 multiplier — must both be fixed before any client exposure (the named
  fixes; grades binding: not demoable until then).
- **Gaps:** [bug] GAR denominator narrower than the DA — overstates GAR (TOP25 note) ·
  [bug] eligible ×1.5 multiplier flagged (TOP25 note).
- **Steps:** 1. Widen the GAR denominator in `eu-taxonomy-engine` /
  `api::eu_taxonomy_gar` to the DA definition (total covered assets, with the DA's
  specified exclusions), documenting the formula change in the atlas §7. 2. Remove (or
  source-justify and document) the ×1.5 eligible multiplier — default is removal;
  an unexplained upward multiplier is exactly what the honesty positioning forbids.
  3. Hand-compute GAR on a small reference book and pin it (W3 item 6). 4. Script
  activity-level alignment → GAR/BTAR on `taxonomy-hub` over the compliance demo book.
- **Effort:** M. **Depends on:** W1-seq1, W2-compliance, W3.
- **DoD:** GAR on the reference book matches the hand calculation per the DA formula;
  bench pin green; only then does the case enter demo scripts.

---

**BC-22 · CBAM exposure & cost projection** — 🟢 · flagship · target G0

- **Current state:** demo-ready — phase-out factors bench-pinned to the official
  2026–2034 schedule; the module genuinely calls the real CBAM engine and a live UN
  Comtrade endpoint, and is honest that its trade extract is hand-compiled (its own
  DATA_LABEL says "refresh from CEPII BACI bulk for production precision").
- **Gaps:** [data] hand-compiled trade snapshot — disclosed by the module itself;
  Phase-2 item per §9 Evolution A · [data] UN Comtrade preview tier = 1 period/request
  — comparative multi-year flows rate-limited without a key (A3 ⚠️; disclosed in the
  mapper's live-vs-seeded comparison) · [none] engine.
- **Steps:** 1. Script UAT A3 step 1 as the standard demo: steel-importer exposure,
  verify the 2030 phase-out factor = 48.5% against the pinned schedule. 2. Keep the
  trade-data-vintage disclosure visible in the demo (W2 register). 3. Acquire the
  Comtrade key (W5) to lift the preview-tier limit. 4. **Phase-2 (G1/G2), per §9
  Evolution A:** replace the hand-compiled sector origins with a live Comtrade/CEPII
  BACI pull (the LiveComtradeVerificationPanel wiring already exists); wire the
  advanced `cbam_calculator.py` endpoints the page doesn't yet call
  (`/calculate-emissions`, `/project-costs`, `/portfolio-exposure`, `/supplier-risk`);
  validate the exemption/liable-trade logic against actual CBAM scope; benchmark the
  origin-substitution analyzer against real supplier carbon prices. 5. **Phase-2 (G2),
  per §9 Evolution B:** trade-strategy & supplier-risk copilot (W4) — Evolution B's
  stated prerequisite is step 4's live trade refresh.
- **Effort:** S (demo-ready), M (Phase-2 step 4). **Depends on:** W1-seq1,
  W2-compliance, W5.
- **DoD:** A3 UAT step 1 passes live (2030 factor = 48.5%); trade-vintage disclosure
  visible in the demo path.

---

**BC-23 · ISSB S2 / TCFD disclosure** — 🟡 · target G2

- **Current state:** the issb-tcfd family has a documented Pydantic contract break —
  its atlas evolution is explicitly "wiring-first" (the named fix).
- **Gaps:** [bug][wiring] Pydantic contract break in the issb-tcfd family (TOP25
  note): a response/request model mismatch breaks the disclosure-assembly path.
- **Steps:** 1. Locate the breaking model in the `api::issb_s2` route family (run the
  routes against their own Pydantic schemas; the contract break surfaces as a
  validation error on the happy path). 2. Fix the contract (align model fields with
  the engine payload — wiring-first per the atlas: no methodology change). 3. Re-sweep
  the domain; add the happy-path payload as a regression. 4. Script the S2
  metrics/targets/scenario assembly on `issb-disclosure` +
  `tcfd-physical-risk-assessment`, pulling physical-risk inputs from the BC-07/BC-10
  stack. 5. Sequence at G2 with BC-19 (the compliance segment's G0/G1 demos are
  carried by BC-20/22/24).
- **Effort:** M. **Depends on:** W1-seq1, W2-compliance; benefits from BC-10 (physical
  inputs).
- **DoD:** the `api::issb_s2` disclosure-assembly happy path returns 200 with
  schema-valid payloads, and the page renders the engine payload end-to-end live.

---

**BC-24 · Regulatory obligation calendar & readiness** — 🟢 · target G0

- **Current state:** demo-ready — fixed and live-verified (25 obligations, 12
  frameworks, incl. ETS2 monitoring-plan deadlines); the 3 endpoint 500s are in the
  fixed-and-verified ledger, not the open-bug table.
- **Gaps:** [none] · [content] lead-magnet packaging — GTM §5 designates the free
  regulatory-calendar tier as the compliance top-of-funnel hook and the campaign
  calendar for FI timing.
- **Steps:** 1. Script UAT A4 step 1: pull the ETS2/CBAM obligation list for an EU
  industrial entity; check deadlines against the official calendar. 2. Package
  `regulatory-calendar` + `regulatory-horizon` + `climate-reg-policy-tracker` as the
  free-tier lead magnet (GTM asset, no engineering). 3. Feed its deadlines into the
  GTM outbound calendar (sell into stress-test/disclosure season).
- **Effort:** S. **Depends on:** W1-seq1.
- **DoD:** A4 step 1 passes live on the deployed URL.

---

**BC-25 · Supply-chain due diligence (EUDR/CSDDD/forced labour)** — 🔴 · target G2
(conditional)

- **Current state:** material build/fix required — `ref_protected_areas` is empty (WDPA
  license deferred) so `eudr-engine` plot-overlap returns empty *by design*, the
  scope3 calculate POST routes are failing, and the empty-reference disclosure is not
  yet un-missable.
- **Gaps:** [data] `ref_protected_areas` = 0 rows — EUDR/protected-area screens return
  empty by design; a user who misses the note gets false negatives on deforestation
  screening (B2 #3; B2c; A3 ⚠️) · [bug] the scope3 calculate POST routes failing
  (TOP25 note; note the *validation* path is verified — empty activity list → clean
  400 per A3 — the failure is on the calculate path) · [content] the "returns empty
  until reference data is loaded" note must be un-missable in the UI before any client
  demo (A3; GTM §6-6) · [bug] adjacent persona surface: the maritime fleet-assessment
  route 500s on null numeric fields — `float(None)` (B1 #1, P1) — fix alongside since
  A3 is the persona exercising it.
- **Steps:** 1. **Go/no-go decision (G0+4, explicit and binding):** license WDPA (or a
  compliant alternative protected-areas source) and commit to the load — **GO** →
  continue steps 2–7 targeting G2; otherwise **NO-GO** → execute step 8 only.
  2. (GO) Procure the license; bulk-load `ref_protected_areas` via `api::spatial`,
  normalizing geometry to MULTIPOLYGON (the documented geometry-type lesson from the
  wildfire 0-row incident, B2c). 3. (GO) Fix the failing scope3 calculate routes and
  re-sweep the domain. 4. Fix B1 #1 (null-guard the fleet-assessment numeric fields) —
  do this regardless of the decision; it is a P1 defensive gap on a real route.
  5. (GO) Make the empty/partial-reference disclosure un-missable (blocking banner
  with row-count provenance, not a footnote). 6. (GO) Verify plot-overlap returns real
  intersections on a known test plot; wire the chain demo: plot check → entity screen
  via `forced-labour-msv2` → `csddd-engine` readiness → `supply-chain-esg-hub`.
  7. (GO) Re-run UAT A3 steps 4–5 (disclosure visible; fleet assessment 200 on
  null-field payload). 8. (NO-GO) Hold BC-25 out of all demo scripts and collateral
  (mark "roadmap"); optionally demo only the non-EUDR half (`forced-labour-msv2` +
  `csddd-engine` readiness screens) with an explicit statement that deforestation
  screening is not offered pending reference data.
- **Effort:** L (GO path) / S (NO-GO path + B1 #1 fix). **Depends on:** W1-seq8 (the
  decision), W5 (license input), W2-compliance.
- **DoD (GO):** A3 step 4 shows a *populated* protected-area screen with visible
  row-count provenance and the disclosure banner; scope3 calculate returns 200;
  A3 step 5 (fleet assessment with missing vessel field) converts ❌→✅.
  **DoD (NO-GO):** BC-25 absent from every demo script; the un-missable
  empty-reference banner is live anyway (protects any user who wanders in).

---

## 4 · Sequencing table (all 25 × target GTM phase)

Ordered by readiness → segment balance → dependency chain. "Week" = week-offset from
G0 start when the case becomes demoable at its DoD. **Bold** = critical path.

| BC | Case (short) | Grade | Segment | Phase | Ready by | Key dependencies |
|---|---|---|---|---|---|---|
| **BC-24** | Reg calendar (lead magnet) | 🟢 | C | G0 | **G0+1** | **W1-seq1 only — first live proof + free tier** |
| BC-13 | Basel capital | 🟢 | B | G0 | G0+2 | W1-seq1 |
| BC-03 | Tax equity | 🟢 | A | G0 | G0+2 | W1-seq1, W3 |
| BC-15 | Green bonds | 🟢 | B | G0 | G0+2 | W1-seq1 |
| BC-09 | YieldCo | 🟢 | A | G0 | G0+3 | W1-seq1, W2 |
| BC-06 | Offshore wind | 🟢 | A | G0 | G0+3 | W1-seq1, W2 |
| BC-01 | PPA desk | 🟢 | A | G0 | G0+3 | W1-seq1, W2 |
| **BC-07** | Site screening | 🟢 | A | G0 | **G0+3** | **W2, W3 hazard pin — energy land-fast case (GTM §5)** |
| BC-17 | Underwriting/CAT | 🟢 | B | G0 | G0+4 | W2, W3 (shared hazard pin) |
| **BC-12** | PCAF | 🟢 | B | G0 | **G0+4** | **W1-seq2 demo book — FI entry case** |
| BC-20 | SFDR PAI | 🟢 | C | G0 | G0+4 | W2-compliance |
| BC-22 | CBAM | 🟢 | C | G0 | G0+4 | W2-compliance, W5 key |
| **BC-02** | PF modeling studio | 🟢 | A | G0 | **G0+5** | **W3 item 1 bench pin — flagship credibility gate** |
| BC-05 | Green hydrogen | 🟡 | A | G1 | G0+5 | guide↔code reconcile |
| BC-16 | Transition finance | 🟡 | B | G1 | G0+5 | page wiring fix |
| BC-08 | Grid carbon | 🟡 | A | G1 | G0+6 | W5 keys (external) |
| BC-04 | BESS stacking | 🟡 | A | G1 | G0+6 | W1-seq7 VPP fix, W3 additivity |
| **BC-10** | Portfolio physical risk | 🟡 | B | G1 | **G0+6** | **W1-seq3 E104 rewire + W1-seq2 book — FI flagship, gates G1 FI pilots** |
| BC-18 | Real estate | 🟡 | B | G1 | G0+7 | W1-seq6 valuation fixes |
| **BC-14** | Entity due diligence | 🟡 | B | G1 | **G0+7** | **W1-seq4 GLEIF bulk + entity-360 rating fix** |
| BC-11 | Stress testing | 🟡 | B | G1 | G0+8 | W1-seq5 two fixes + B1 #5 |
| BC-21 | EU Taxonomy/GAR | 🟡 | C | G1 | G0+8 | GAR denominator + ×1.5 fixes + pin (hard pre-client gate) |
| BC-19 | CSRD factory | 🟡 | C | G2 | G0+12 | navigator full-catalog wiring |
| BC-23 | ISSB S2/TCFD | 🟡 | C | G2 | G0+14 | Pydantic contract fix; BC-10 inputs |
| BC-25 | Supply-chain DD | 🔴 | C | G2 (conditional) | G0+16 (GO) / held (NO-GO) | W1-seq8 decision, WDPA license, scope3 fix |

**Critical path:** W1-seq1 (deploy) → W1-seq2 (FI book) → W1-seq3 (E104) → BC-10 →
BC-14/BC-11 — the FI segment carries 5 of the 11 🟡 cases and the G1 design-partner
gate needs ≥2 cases running weekly per partner; if E104 or the book slips, FI partners
start on BC-12/13/15/17 only. Secondary path: W3 item 1 (studio pin) → BC-02, the
energy flagship — do the pin in weeks 1–2 so a surprise mismatch (see risk R6) is
caught before collateral is written. Segment balance holds per phase: G0 = 6A/4B/3C;
G1 adds 3A/5B/1C; G2 adds 0A/0B/3C (compliance G2-heavy — acceptable because BC-20/22/24
already carry compliance at G0).

---

## 5 · Capacity view

**Per-case incremental effort:** 14 × S (BC-01, 03, 05, 06, 08, 09, 12, 13, 15, 16,
17, 20, 22, 24) + 9 × M (BC-02, 04, 10, 11, 14, 18, 19, 21, 23) + 1 × L-conditional
(BC-25 GO path). **Workstreams:** W1 = L, W2 = L, W3 = M (items 1–6), W4 = L (G2),
W5 = M.

Rough load (S≈2d, M≈5d, L≈12–15d): workstreams ≈ 40 person-days (excl. W4); per-case
increments ≈ 75 person-days; total to full G2 scope excl. copilot ≈ **115 person-days**,
of which the G0 gate (W1 + W2 + 13 🟢 case scripts + W3 items 1–3) ≈ 45 person-days.

| Team | By end-G0 (wk 6) | By G1 gate (wk 20) | By G2 window (wk 20–40) |
|---|---|---|---|
| **1 person** | W1 all 8 items + W2 (3 envs) + 10–13 🟢 cases at DoD; W3 items 1–2 only. G0 gate is *tight* — protect it by deferring all Phase-2 items and BC-19/23/25 entirely | + the four S-band 🟡 fixes (BC-05/08/16 then 04) and 2–3 of the M-band FI fixes (BC-10 first, then 14, 18) — BC-11/21 likely land mid-G1; W3 items 3–6 opportunistic | + BC-11/21 done, BC-19/23; BC-25 only if NO-GO stays cheap or GO gets deferred to G3; W4 copilot beta slips to late G2 |
| **3 people** (backend + data + GTM) | Same G0 gate met with slack: backend does W1 seq3–7 in parallel with data on W1-seq2/W2/W5; GTM writes all 13 🟢 demo scripts + whitepapers; W3 items 1–4 done | ALL 11 🟡 fixes done by ~G0+8 (whole table demoable except BC-25); W3 items 1–6 + Playwright/RBAC smoke; D1 write-sweep (W5) done | BC-25 GO path executable; W4 copilot beta on the 6 flagship module sets with `bench_llm.py` gating; first Phase-2 evolutions (BC-02a, BC-10a, BC-20a, BC-22a) started |

The single-founder risk from `GTM_ROADMAP.md` §8 is mitigated exactly as stated there:
sequence one segment's fixes at a time (the table above already does — energy 🟡s land
before FI M-band, compliance G2 items last) and stagger partner starts.

---

## 6 · Risk register (implementation-specific)

| # | Risk | Trigger | Mitigation |
|---|---|---|---|
| R1 | E104 rewire leaves a seeded-random path reachable — a demoed number the engine never produced, in front of the most audit-sensitive persona | Any page value absent from the `/price` response during A1 step 3 | Delete the generator code (not just bypass); A1 step 3 is a scripted release check; `check_no_fabricated_random.py` stays CI-gated |
| R2 | GLEIF bulk ingest fails silently at scale (this exact ingester shipped silently broken once, 0 rows) | Post-run live COUNT < 100k, or weekly re-run row-count diff ≈ 0 | Hard row-count verification gate in the runbook (≥100k before BC-14 enters any script); ingester idempotency check from B3 rides along |
| R3 | Demo-book seeding via raw SQL reintroduces the NULL `updated_at` bug class (two shipped bugs from this pattern, B2c) | 500s on portfolio list/detail right after seeding | W2 rule: seed through ORM/endpoints only; audit NOT-NULL-by-model/NULL-in-DB columns after each seed run (the documented B2c action) |
| R4 | Studio bench pin (W3 item 1) *disagrees* with the hand model — a formula bug discovered in the flagship after collateral exists | Reference-case mismatch beyond tolerance in week 1–2 | Sequence the pin before any BC-02 collateral (it is scheduled G0+1→2); on mismatch BC-02 demotes to 🟡 (grades binding) and energy demos lead with BC-01/07 |
| R5 | REQUIRE_AUTH=true surprises a live demo — mutating steps 401 mid-walkthrough (B2 #1) | First POST in any demo script fails on the deployed URL | Pre-created demo accounts with live sessions per segment env (W2); the A1 step 6 logged-out-401 check stays in UAT as the *intended* behavior proof |
| R6 | Alembic two-heads (B2 #2) blocks a schema change needed for seeding or the BC-19 navigator wiring | Any migration attempt during G0/G1 | Use the established direct-DDL + documentation-migration pattern; the real merge is D5 and becomes mandatory only when a second environment exists (per PRODUCTIZATION_ROADMAP) |
| R7 | Key/tier acquisitions (EIA, ENTSO-E, Comtrade, WDPA) slip — external parties, not effort | Key not issued by the case's target week | All four have labeled-fallback demo modes already; demo with the label visible (honesty positioning), never unlabeled; WDPA has the explicit NO-GO path (BC-25 step 8) |
| R8 | Fixing BC-21's GAR defects *changes* previously seen numbers, or a 🟡 case gets demoed early and the later fix contradicts it | Any 🟡 case appearing in a demo before its DoD | Grades are binding at the script level: sales demos only cases at DoD (GTM §8 rule); BC-21 specifically enters scripts only after the pin is green |
| R9 | The 635 never-exercised mutation endpoints (B2 #8) hide a write-path 500 that a design partner hits first | Partner-reported write failure during G1 pilots | Pull the D1 `--allow-writes` branch-DB sweep (W5) into G1's first two weeks for the demo-critical domains (portfolios, reports, disclosures) rather than waiting for P2 |

---

*End of plan. Traceability: every [bug] tag maps to a B1 row or a TOP25-named defect;
every named 🟡 fix appears in its case's steps; workstream W1 sequences all 8 GTM §6
items with blocked-BC mapping; flagship Phase-2 items follow the §9 Evolution A/B of
`financial-modeling-studio`, `global-physical-risk-atlas`, `physical-risk-pricing`,
`pcaf-financed-emissions`, `sfdr-pai`, `cbam-trade-exposure-mapper`.*
