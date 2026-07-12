# GTM Content Package — Energy Developers · Financial Institutions · Compliance

*Drafted 2026-07-07. Companion to `TOP25_BUSINESS_CASES.md` (readiness grades are
binding on every asset below), `GTM_ROADMAP.md` (phases G0–G3, channels), and
`IMPLEMENTATION_PLAN.md`. Grounded in `PRODUCTIZATION_ROADMAP.md` §1 (the copilot
is G2 roadmap, never described as shipped) and `CRITICAL_REVIEW_UAT_AUDIT.md` Part A
(known limitations are stated, not dodged).*

**Rules that govern every asset in this package:**

1. Only 🟢 cases are demoed or claimed as working today. 🟡 cases are described as
   "engine ready, UI wiring / data population in progress," with the gap named.
   The single 🔴 case (BC-25) is not marketed until its gate clears.
2. Every module id cited validates against `docs/module_atlas/atlas.json`.
3. No invented customers, metrics, or testimonials — templates use [BRACKETED]
   placeholders that only a real design partner fills.
4. Factual voice throughout. The platform's differentiation is that its numbers are
   verifiable; the content earns trust the same way — by showing work, not by
   adjectives.

---

## 1 · Content strategy summary

**The thesis:** our buyers are people who get audited — risk officers, project
financiers, compliance leads. Content that works on them is content that survives
their skepticism. So every asset is built around one of three verifiable proof
mechanisms rather than claims:

| Proof mechanism | What it is | Content it powers |
|---|---|---|
| bench_quant hand-verification | `backend/benchmark/bench_quant.py` — 12 engines pinned to hand-computed reference cases (VaR, PCAF WACI, Basel floors, Solvency II SCR, CBAM phase-out, LCOE/IRR) | FI whitepapers, demo "show the work" moments, objection responses |
| Module Atlas transparency | 999 documented modules; §7 methodology + §8 model spec per module, in `docs/module_atlas/` | Compliance explainer series, methodology whitepapers, due-diligence packets |
| Honest-nulls + lineage | Engines return `insufficient_data` / null rather than inventing values; every number traces via `backend/lineage_output/traces/` to a source table or named public API | Demo scripts (the lineage moment), objection handling, digital-twin content |

**How content ladders into the GTM phases (per `GTM_ROADMAP.md` §4–5):**

- **G0 (weeks 0–6, no outbound):** publish the 2 methodology whitepapers drawn from
  Atlas deep-dives (candidates: the PCAF attribution paper and the digital-twin
  sources paper, both drafted below in §2). Purpose: a credibility floor exists
  before the first design-partner conversation.
- **G1 (design partners):** the per-case one-pagers (§2) are the recruiting
  instrument — one page, one pain, one worked number. The demo scripts (§2) are run
  live with prospects; the four persona UAT scripts from the critical review double
  as the structured pilot plan. Case-study templates (§4) are handed to partners at
  kickoff so evidence collection starts on day one.
- **G2 (lighthouse & repeatability):** full content cadence begins — the
  thought-leadership calendar (§2, 12 assets) publishes on regulatory timing;
  completed case studies replace templates; copilot content may now reference the
  Tier-1 copilot as a shipping beta (and not before).
- **G3 (scale):** the Compliance explainer series becomes the inbound engine
  (regenerated from the Atlas whenever regulation moves — same pipeline as the
  Notion wiki push); partner-channel enablement reuses §5's cheat sheet.

**Channel fit per segment (from `GTM_ROADMAP.md` §5):**

- *Energy developers* — conference-and-referrer channel (project-finance
  conferences, PPA marketplaces, tax-equity brokers). Content format: worked
  deal examples and demo-first one-pagers; land with BC-07 site screening
  (visually strong, real public data), expand via BC-02.
- *Financial institutions* — association-and-supervision channel (GARP/PRMIA,
  stress-test season, consultation responses). Content format: methodology
  whitepapers with the hand-calculation shown; the bench_quant story is the wedge
  no black-box vendor can copy.
- *Compliance* — content-led inbound. The free regulatory-calendar tier (BC-24) is
  the top-of-funnel hook; the ESRS/SFDR/Taxonomy explainer series (auto-generated
  from Atlas §7 sections) is the nurture layer; audit-firm alliances get the
  due-diligence packet (Atlas + bench + lineage).

---

## 2 · Per-segment content kits

### 2A · Energy Developers & IPPs

Top-3 🟢 cases selected: **BC-01, BC-02, BC-07** (BC-03, BC-06, BC-09 are also 🟢
and available as follow-on one-pagers; BC-04/05/08 are 🟡 and are only positioned
as roadmap).

---

#### 2A.1 One-pager — BC-01 · PPA structuring & valuation desk

**Headline:** Price PPAs on real resource data and credit-adjusted terms — not a
consultant's spreadsheet that goes stale the week it's delivered.

**Three pains:**
1. Every PPA pricing exercise is a bespoke consultant engagement or a fragile
   internal spreadsheet; nothing is re-runnable when market inputs move.
2. Resource assumptions are copy-pasted defaults — the same capacity factor for
   Seville and the North Sea — so capture-rate risk is invisible until COD.
3. Counterparty credit and valuation adjustments (XVA) are either ignored or
   priced by a bank against you, never by you.

**Three capability proof-points:**
- `ppa-structuring-desk` prices structures on live NASA POWER resource data — the
  wiring is proven: Seville solar and North Sea wind return genuinely different
  yields, not a shared default table (verified in the platform UAT record).
- `ppa-xva-engine` computes credit/valuation adjustments on the PPA with a real
  lattice engine — the adjustment a bank would apply, visible to the developer side.
- `ppa-analytics` closes the loop with capture-rate and shape analytics on the
  same data spine, so structuring and monitoring use one set of assumptions.

**Worked mini-example:** the platform's UAT script for this desk requires
structuring the same PPA at two real locations with different resource regimes and
confirming the yields differ plausibly *and cite NASA POWER as source* — that
two-location test is the demo, and it is repeatable on any coordinates a prospect
brings.

**CTA:** Bring two candidate sites (lat/lng is enough) to a 30-minute working
session. We structure both PPAs live on real resource data. Design-partner terms
available for the first two energy partners (discounted annual, weekly feedback
cadence, named case study).

---

#### 2A.2 One-pager — BC-02 · Climate-integrated project finance modeling

**Headline:** NGFS-scenario-aware project finance models — DSCR and LLCR under
transition paths — without rebuilding Excel for every deal.

**Three pains:**
1. Each new deal means rebuilding the same PF model in Excel; scenario analysis is
   a manual copy of the workbook per case.
2. Lenders increasingly ask what the deal looks like under NGFS transition
   scenarios; answering costs weeks of one-off analysis.
3. Model risk: nobody can prove the IRR in the deck matches the formula in the
   model, because the model is a spreadsheet with no audit trail.

**Three capability proof-points:**
- `financial-modeling-studio` is the platform's flagship financial engine: 8
  endpoints including quasi-Monte-Carlo simulation (`/simulate`) and an efficient
  frontier solver (`/solve-frontier`), with NGFS scenario integration built in.
- The engine's LCOE discounted-denominator and real-IRR bisection are hand-verified
  in bench_quant — the earlier IRR-proxy bug was found, fixed, and is now pinned by
  the benchmark so it cannot silently regress.
- The engine is deterministic and PRNG-free (2,425 lines audited under the
  platform's no-fabrication guardrail, which runs in CI).

**Worked mini-example:** the standing verification exercise for this module is:
build a project-finance model in the Studio, export the assumptions, and replicate
the IRR in a spreadsheet within tolerance. We run exactly that exercise with every
design partner on their own deal — and we are candid that the full scenario-matrix
× QMC path has not yet been pinned in bench_quant (it is the top item on the
benchmark backlog); the side-by-side replication is how a partner verifies it on
their numbers first.

**CTA:** Send one anonymized deal's assumption set. We rebuild it in the Studio and
hand back the IRR/DSCR replication side-by-side with your Excel.

---

#### 2A.3 One-pager — BC-07 · Site physical-risk screening

**Headline:** Screen candidate sites against five real hazard datasets — USGS,
NOAA IBTrACS, GWIS, OpenFEMA, IPCC AR6 — in one composite score that tells you
when it doesn't know.

**Three pains:**
1. Physical-risk screening at siting stage is either skipped or bought as an
   opaque vendor score with no visibility into sources.
2. Multi-hazard comparison across a pipeline of candidate sites is manual — one
   consultant PDF per site.
3. Vendor scores zero-fill missing data, so "low risk" and "no data" look
   identical — exactly the wrong behavior for siting decisions.

**Three capability proof-points:**
- `global-physical-risk-atlas` runs on five independently-ingested hazard grids
  (earthquake 4,500 cells, cyclone 4,470, wildfire 5,378, flood 48 named
  locations, sea-level 152) — each from a named public source, with per-layer
  provenance documented in the Module Atlas.
- The composite score is missing-data-aware by construction: hazards with no
  coverage at a point are excluded and weights re-normalized — never zero-filled —
  and the response carries a per-hazard `data_availability` breakdown
  (`api::spatial`, `api::usgs_earthquake`, `api::ibtracs_cyclone` document the
  ingestion chain).
- Every grid population was spot-checked against real hazard geography rather than
  trusting ingestion logs — a discipline that caught and fixed two real ingestion
  bugs before any client saw the data.

**Worked mini-example (from the Atlas deep-dive, verified against ground truth):**
Tokyo (35.68, 139.65) returns earthquake zone `EQ_34_138` at M6.6/50yr with 656
recorded events (real USGS ANSS catalog) and cyclone zone `CYC_34_138` at 105 kt
max wind (real IBTrACS); Miami returns 145 kt cyclone exposure; landlocked
Kazakhstan correctly returns zero cyclone rows; and the sea-level layer's 0.77 m
by 2100 under SSP5-8.5 matches the published IPCC AR6 WG1 Table 9.9 figure.

**Known limitation, stated up front:** wildfire is country-level resolution (two
plants in the same country show the same wildfire score) and flood/sea-level are
named-location samples, not global grids. The engine discloses this per hazard;
the roadmap item is NASA FIRMS per-cell enrichment (needs a manually-issued key).

**CTA:** Send three candidate-site coordinates. We return the five-hazard
composite profile for each, with the source dataset named next to every number.

---

#### 2A.4 15-minute demo script — flagship: BC-07 site screening

*Preconditions: logged-in session (interactive POST endpoints require auth —
production posture), backend live, hazard grids populated (verify beforehand via
step 1). Persona: Head of Development evaluating three candidate sites.*

| # | Time | Action (click / endpoint) | What the prospect sees | Talk track |
|---|---|---|---|---|
| 1 | 0:00 | Open `/global-physical-risk-atlas` in the app; behind it, show `GET /api/v1/global-physical-risk/coverage-stats` | World map + build stats: 5/5 layers populated, row counts per layer, spatial extent, last-updated | "Before any score: here is exactly what data exists. Five layers, five named public sources, and the platform reports its own coverage." |
| 2 | 1:30 | Enter prospect's first site (or Tokyo 35.68/139.65 as control) → `POST /api/v1/global-physical-risk/point-profile` | Per-hazard scores + composite + `data_availability` per hazard | "Earthquake M6.6/50yr, 656 events — that's the USGS ANSS catalog, 1976–2026, not a modeled proxy." |
| 3 | 4:00 | Same call for a deliberately contrasting site (e.g. an inland continental location) | Cyclone layer drops out; composite re-normalizes over available hazards; note explains why | "Watch what happens with no ocean exposure: the engine excludes the hazard and re-weights. It never zero-fills. 'No data' and 'low risk' are different answers here." |
| 4 | 6:00 | Batch: `POST /api/v1/global-physical-risk/portfolio-profile` with the prospect's 3 sites (cap: 200/batch) | Ranked table of composite scores across the candidate pipeline | "This is the siting comparison you currently assemble from consultant PDFs — re-runnable whenever the pipeline changes." |
| 5 | 8:30 | Regional context: `GET /api/v1/global-physical-risk/region-summary` over the development region's bounding box | Aggregate hazard stats for the region | "Portfolio-level view for the IC deck; per-asset precision stays with point-profile." |
| 6 | 10:00 | **The lineage moment.** Open the Module Atlas page for `global-physical-risk-atlas` (§7) and the lineage trace directory `backend/lineage_output/traces/` | The normalization formulas, per-layer provenance, and the recorded call-tree/SQL trace for the queries just run | "Every number you just saw traces to a table row and a named source. This documentation exists for all 999 modules — it's the model-risk file your lenders will ask for." |
| 7 | 12:00 | Show the disclosed limitation deliberately: query wildfire for two sites in the same country | Identical wildfire score, with the country-resolution caveat surfaced | "We show you this before you find it: wildfire is country-level today. Per-cell enrichment is on the roadmap. We'd rather you hear resolution limits from us." |
| 8 | 13:30 | Close: one-pager + design-partner offer | — | "Send your real pipeline coordinates; we run this exact screen and hand you the provenance file." |

**Questions to expect, with the honest answer:**
- *"Can I get flood scores for any site globally?"* — No: flood is 48 named
  locations (OpenFEMA NFIP for US counties, documented precipitation proxy
  elsewhere) and explicitly labeled not-an-authoritative-flood-map; FEMA NFHL is
  the production reference for US base-flood elevations. Absence of a zone means
  "not sampled," and the response says so.
- *"Does the score change under climate scenarios?"* — Sea-level carries
  SSP1-2.6/SSP5-8.5 × 2050/2100 variants (IPCC AR6). The other hazards are
  historical-catalog-based; forward scenario conditioning is a roadmap item, and
  we won't imply otherwise.
- *"Why did my POST get a 401 earlier?"* — Interactive endpoints require an
  authenticated session by design (production security posture); GET endpoints
  like coverage-stats are open reads.
- *"How do I know the ingestion is right?"* — Spot-check discipline documented in
  the Atlas: two real ingestion bugs (a cyclone hemisphere gap, a wildfire
  geometry failure) were caught by checking known geography against the grids,
  then fixed and re-verified. The spot-check table is in the deep-dive.

---

#### 2A.5 Thought-leadership assets (Energy)

1. **Whitepaper — "The IRR your spreadsheet gets wrong: hand-verifying project
   finance math."** Most PF models approximate IRR or bury the discounting
   convention where nobody checks it; we found and fixed exactly such a bug in our
   own engine and then pinned the correction to a hand-computed benchmark that
   runs on every code change. This paper publishes the reference cases — LCOE
   discounted denominator, real-IRR bisection — with the hand calculations shown.
   Readers can reproduce every number in their own spreadsheet, which is the point.

2. **Whitepaper — "Five hazards, five public datasets: building a physical-risk
   digital twin without a data vendor."** Site screening does not require a
   black-box score: USGS, NOAA IBTrACS, GWIS, OpenFEMA, and IPCC AR6 are public
   and sufficient for a defensible multi-hazard composite, if you handle missing
   data honestly. This paper documents the full ingestion chain, the two real bugs
   the spot-check discipline caught, and the resolution limits per layer —
   including the ones that favor competitors' marketing. G0 flagship publication.

3. **Webinar — "Structuring the same PPA in two places: what location-real
   resource data changes."** A live session structuring one PPA at two real sites
   with different resource regimes, showing how capture-rate and yield assumptions
   diverge when NASA POWER data replaces default tables. The audience nominates
   the coordinates at the start; nothing is pre-baked. Ends with the assumption
   export so attendees can replicate offline.

4. **Blog series — "Reading a model's documentation before you trust its
   number."** Short pieces walking through single Module Atlas deep-dives
   (tax-equity flip solver, offshore wind chain, BESS stacking) — what §7
   methodology and §8 limitations sections contain and why a lender's model-risk
   team should demand this artifact from every analytics vendor. Doubles as the
   organic-search surface for the Energy Desk modules.

---

### 2B · Financial Institutions

Top-3 🟢 cases selected: **BC-12, BC-13, BC-17** (BC-15 also 🟢, available as a
follow-on one-pager; BC-10/11/14/16/18 are 🟡 — positioned as "engine ready, wiring
in progress," never demoed until their gates clear).

---

#### 2B.1 One-pager — BC-12 · Financed emissions / PCAF reporting

**Headline:** PCAF-compliant financed and facilitated emissions with data-quality
scores you can defend — attribution formulas implemented per asset-class chapter,
verified by hand.

**Three pains:**
1. Financed-emissions numbers arrive from vendors without the attribution math
   being inspectable — indefensible in front of a supervisor or auditor.
2. Most tools cover 4–5 asset classes; sovereign debt, undrawn commitments, and
   facilitated emissions get spreadsheet side-cars.
3. Data-quality scoring (PCAF DQS) is an afterthought, so proxy-based numbers
   masquerade as reported ones.

**Three capability proof-points:**
- `pcaf-financed-emissions` implements attribution-factor formulas for 13
  instrument types — including Sovereign Debt (Ch. 4.9), Use-of-Proceeds (Ch. 4.10),
  and Undrawn Commitments (Ch. 4.13) — each capped at 100% attribution, per the
  PCAF Global GHG Standard.
- The WACI and DQS computations are pinned in bench_quant (hand-computed reference
  case, re-run after every engine change); the backend asset-class engines are
  served via `api::pcaf_asset_classes` and `api::pcaf_regulatory`.
- Missing EVIC triggers a sector-proxy substitution that *forces DQS to at
  least 4* — the engine penalizes its own data quality instead of hiding the proxy,
  and `avoided-emissions-hub` extends the same discipline to avoided-emissions
  claims.

**Worked mini-example (from the Atlas deep-dive):** Shell plc at EVIC £245B,
outstanding £31.2B, Scope 1+2 of 68.4 MtCO₂e: attribution factor
min(1, 31.2/245) = **12.73%** → financed emissions **8,708,000 tCO₂e**; revenue
proxy £196B → WACI **349 tCO₂e/$M revenue**; carbon intensity **279 tCO₂e/$M
outstanding**. Every step is in the deep-dive and reproducible by hand — that is
the acceptance test we invite.

**CTA:** Bring 10 anonymized positions (asset class, outstanding, EVIC or
property/project value, reported emissions). We compute the attribution live and
hand back the per-step math.

---

#### 2B.2 One-pager — BC-13 · Climate-in-Basel capital integration

**Headline:** Climate integrated into regulatory capital the way a supervisor
expects it — risk-weight routing, PD floors, output floor — with every mechanic
hand-verified.

**Three pains:**
1. Climate adjustments to RWA are bolted on outside the capital engine, so the
   interaction with floors and routing is untested until a supervisory exam.
2. Basel mechanics are easy to get subtly wrong (floor sequencing, retail
   routing) and vendor tools rarely expose the calculation for inspection.
3. Quantifying a "climate quarantine" in capital terms requires consistent
   scenario plumbing most banks don't have in-house.

**Three capability proof-points:**
- `regulatory-capital` implements retail risk-weight routing, the 5 bps PD floor,
  and the 72.5% output floor — all hand-verified in bench_quant, not just
  code-reviewed.
- `climate-capital-adequacy` layers the climate quarantine into RWA on the same
  engine, so climate and baseline capital share one set of mechanics.
- `api::basel3_liquidity` extends the same verified treatment to liquidity
  metrics, with determinism proven (two identical runs → byte-identical results).

**Worked mini-example:** the bench_quant reference case exercises the routing and
floor sequence end-to-end — retail exposure routing, PD floored at 5 bps, output
floor applied at 72.5% — against a hand calculation. In a working session we run
the benchmark live and then apply the same engine to a sample of the prospect's
exposure classes.

**CTA:** A 45-minute session with your prudential-risk team: we run the benchmark
in front of you, then map your exposure classes onto the engine.

---

#### 2B.3 One-pager — BC-17 · Climate underwriting & CAT exposure

**Headline:** Peril-priced underwriting on exceedance-curve math that reconciles
to hand calculation — with hazard inputs from named public datasets, not a licensed
black box.

**Three pains:**
1. CAT model output is unauditable: the EP curve arrives without the aggregation
   math being inspectable.
2. Solvency II SCR aggregation is re-implemented in spreadsheets around the CAT
   model, introducing exactly the errors it should prevent.
3. Hazard data licensing costs scale with usage, so underwriters ration the
   analysis instead of running it per submission.

**Three capability proof-points:**
- `climate-underwriting-workbench` computes EP-curve expected annual loss with the
  physical VaR = 1-in-100 PML identity pinned in bench_quant.
- The Solvency II / EIOPA SCR correlation aggregation is also bench-pinned —
  hand-computed reference case, rerun on every change (`climate-insurance`,
  `api::insurance_risk` carry the supporting engines).
- Hazard inputs come from the platform's digital twin (`global-physical-risk-atlas`)
  — USGS/IBTrACS/GWIS/OpenFEMA/IPCC sources, with per-hazard availability
  disclosed, so the underwriting desk knows the resolution of what it's pricing.

**Worked mini-example:** the standing verification is the SCR aggregation
reference case in bench_quant — correlation-matrix aggregation reproduced by hand
and pinned. Demo includes running it live, then pricing one sample location
end-to-end from hazard profile to EP-curve EAL.

**CTA:** Bring one treaty or one location schedule (anonymized). We profile the
hazards and price it live, with the aggregation math on screen.

---

#### 2B.4 15-minute demo script — flagship: BC-12 PCAF financed emissions

*Preconditions: logged-in session; backend live. Persona: Head of ESG Reporting /
Head of Climate Risk. Honest framing to state up front: the demo book is a seeded
portfolio of real named companies with cited public financials — the demo shows
the engine's math, not the prospect's book (their book is the pilot).*

| # | Time | Action (click / endpoint) | What the prospect sees | Talk track |
|---|---|---|---|---|
| 1 | 0:00 | Open the `pcaf-financed-emissions` module page | Portfolio of ~40 named positions (Shell, TotalEnergies, BHP, Toyota…) with per-row source citations (annual reports, CDP) | "Each row cites where the emissions and EVIC came from. No synthetic issuers." |
| 2 | 2:00 | Click into the Shell position; show the attribution breakdown | AF = 12.73%, financed emissions 8,708,000 tCO₂e, WACI 349, DQS 1 | "Outstanding over EVIC, capped at one. You can check this on a napkin — 31.2 over 245. That's the acceptance test we want you to run." |
| 3 | 4:30 | Show asset-class coverage: `GET /api/v1/pcaf/asset-classes` and `GET /api/v1/pcaf/methodology` | 13 instrument types with the formula per PCAF chapter | "Sovereign debt Ch. 4.9, use-of-proceeds Ch. 4.10, undrawn commitments Ch. 4.13 — the chapters most tools skip." |
| 4 | 6:30 | Run a live asset-class computation: `POST /api/v1/pcaf/listed-equity` with 3 sample positions, then `POST /api/v1/pcaf/portfolio-aggregate` | Engine response: per-position AF, financed emissions, DQS, portfolio rollup | "This is the backend engine, not the page — same numbers via API, which is how your reporting pipeline would consume it." |
| 5 | 8:30 | **The data-quality moment.** Submit a position with EVIC omitted | Sector-proxy substitution fires; DQS forced to ≥4 with an explicit warning; `GET /api/v1/pcaf/dqs-improvement-guidance` shows the remediation path | "The engine downgrades its own data quality when it uses a proxy. Vendors bury this; supervisors ask for exactly this." |
| 6 | 10:30 | **The honest-nulls moment.** `POST /api/v1/sfdr/pai` with an empty portfolio | `insufficient_data` warnings — no invented PAI values | "Empty input produces an honest refusal, not a plausible number. This behavior is verified in our benchmark suite." |
| 7 | 12:00 | **The lineage moment.** Open `docs/module_atlas/deep/pcaf-financed-emissions.md` §7 and the bench_quant WACI pin | The full worked Shell example in the documentation; the benchmark that reruns it | "The documentation you'd have to produce for model risk management already exists — for this module and 999 others." |
| 8 | 13:30 | Close | — | "Pilot = your anonymized book through the same engine, with the per-step math returned. Design-partner terms for the first two FIs." |

**Questions to expect, with the honest answer:**
- *"Is this our data or yours?"* — Seeded demo book of real named companies with
  cited public figures; your book is the pilot. Today the platform's stored
  portfolio data is thin (3 demo portfolios) — a realistic 200–500-holding demo
  book is a named G0 work item, and we say so.
- *"Where do sector proxies come from?"* — Sector revenue/EVIC multiples and
  country PPP-GDP tables are documented calibration assumptions (Atlas §7.2), not
  live market-data feeds; the DQS penalty exists precisely because proxies are
  proxies.
- *"Can it do facilitated emissions?"* — Yes, per the PCAF Part C convention
  (deal-type attribution); the demo book's facilitated and insurance extensions use
  seed emission factors rather than PCAF's full published LOB tables — stated in
  the module's own limitations section.
- *"What about Scope 3 of investees?"* — Attribution applies uniformly across
  scopes; Scope 3 is carried separately for CSRD E1 needs, consistent with PCAF.
- *"Year-over-year trend?"* — The YoY chart in the demo module is illustrative
  seed trend, not backtested attribution history — the Atlas says so, and so do we.
  Trend from your own re-runs accumulates from first use.

---

#### 2B.5 Thought-leadership assets (Financial Institutions)

1. **Whitepaper — "Show the hand calculation: a verification standard for climate
   risk analytics."** Regulated buyers are asked to trust climate numbers from
   engines nobody outside the vendor has inspected; we propose a simple standard —
   publish hand-computed reference cases and rerun them on every code change — and
   release our own 12 pinned cases (VaR, PCAF WACI, Basel floors, Solvency II SCR
   aggregation, CBAM phase-out) as a working example. The paper includes the
   reference arithmetic so any risk team can replicate it. G0 flagship publication.

2. **Whitepaper — "Honest nulls: why your disclosure engine should refuse to
   answer."** A disclosure produced from insufficient data is worse than none,
   because it is unfalsifiable until an auditor falsifies it for you. This paper
   documents the honest-nulls contract — empty portfolio → `insufficient_data`,
   never an invented PAI value — and the CI guardrail that keeps fabricated
   randomness out of the calculation path platform-wide. Written for heads of
   reporting who sign what the tool produces.

3. **Webinar — "Stress-test season, deterministically."** A working session run
   against the supervisory-scenario timing in the regulatory calendar: same
   scenario executed twice live to show byte-identical results, then the
   scenario-to-capital chain discussed with the bench-pinned Basel mechanics.
   Positioning for `stress-test-orchestrator` is honest: orchestrator
   deterministic and pinned; the full climate-VaR suite is engine-ready with two
   documented defects being cleared — attendees hear the gap from us first.

4. **Blog series — "One number, fully traced."** Each post picks a single figure
   from a module (a WACI, a risk weight, an SCR cell) and walks its lineage
   end-to-end: input row → formula (Atlas §7) → engine response → trace file. The
   format *is* the argument: black-box vendors cannot publish this series.

---

### 2C · Compliance & Regulatory

Top-3 🟢 cases: **BC-20, BC-22, BC-24** (exactly the segment's three 🟢 cases;
BC-19/21/23 are 🟡 — described as engine-ready with named gaps; BC-25 is 🔴 and
excluded from all marketing until its gate clears).

---

#### 2C.1 One-pager — BC-20 · SFDR PAI & product disclosure

**Headline:** PAI computation that tells you when your data can't support the
disclosure — instead of inventing a number you'll have to retract.

**Three pains:**
1. PAI indicators are computed in spreadsheets from patchy holdings data, with no
   record of which values are estimates.
2. Annex-format statements are assembled manually each period, re-introducing
   transcription errors each time.
3. When data is missing, most tools silently substitute — the compliance officer
   discovers this during assurance, at the worst possible moment.

**Three capability proof-points:**
- `sfdr-pai` runs on a 2,044-line PAI engine covering computation, DNSH logic, and
  Annex statement assembly (`api::sfdr_annex`, `api::sfdr_product_reporting` carry
  the product-level reporting endpoints).
- Honest-nulls behavior is verified, not aspirational: an empty portfolio returns
  `insufficient_data` warnings — the engine never fabricates a PAI value. This is
  bench-verified behavior under the platform's no-fabrication guardrail (CI-gated).
- PCAF outputs map directly into PAI #2/#3 (carbon footprint, WACI) on the same
  data spine — the lineage from financed emissions to the PAI table is documented,
  not re-keyed.

**Worked mini-example:** the verification we show live: submit an empty portfolio
to the PAI endpoint and read the response — explicit insufficiency warnings, zero
invented indicators. Then submit a populated book and trace PAI #2 back to the
PCAF carbon-footprint figure that produced it.

**CTA:** A 30-minute session with your fund-compliance team: we run your PAI set
on a sample book and show which indicators your current data can and cannot
support — before your auditor does.

---

#### 2C.2 One-pager — BC-22 · CBAM exposure & cost projection

**Headline:** Your 2026–2034 CBAM cost curve per import line — phase-in factors
pinned to the official schedule, arithmetic you can check by hand.

**Three pains:**
1. CBAM liability grows ~40× over the phase-in for a typical uncarbon-priced
   origin, and most importers have not quantified the curve per origin.
2. Origin-substitution decisions are being made on gut feel, without a consistent
   landed-cost-premium comparison.
3. Internal estimates mix up free-allocation phase-out, domestic-carbon-price
   deductions (Art. 9), and ETS price paths — three moving parts with different
   schedules.

**Three capability proof-points:**
- `cbam-trade-exposure-mapper` is wired to the platform's real CBAM engine
  (`api::cbam`): free-allocation schedule, ETS price scenarios, and the Art. 9
  net-cost formula served live — the frontend holds only an identical offline
  fallback mirror, documented line-by-line.
- The free-allocation phase-out factors are bench-pinned to the official 2026–2034
  schedule (97.5% → 0%; the 2030 CBAM factor is 48.5% — a value we invite prospects
  to check against the regulation).
- Trade patterns come from a labeled UN Comtrade / Eurostat COMEXT extract
  (`api::un_comtrade` provides the live-flow path), with the label stating its
  approximation level and the recommended production upgrade (CEPII BACI bulk).

**Worked mini-example (from the Atlas deep-dive, hand-checked end-to-end):**
Turkish steel, 5.5 Mt/yr at 0.8 tCO₂/t direct intensity = 4.4 MtCO₂ embedded.
Under the Current Trend ETS path: 2026 net CBAM cost **€8.25M** (97.5% free
allocation), 2030 **€202.73M** (48.5% CBAM factor at €95/t), 2034 **€506.0M**
(0% free allocation at an interpolated €115/t). Same emissions, **61× larger
bill** by 2034 — driven almost entirely by the free-allocation phase-out, not the
ETS price. Every line reconciles to net = gross × (1 − free-allocation%) when the
origin pays no carbon price.

**CTA:** Send your top-5 CBAM import lines (sector, origin, volume). We return the
2026–2034 cost curve per line with the arithmetic shown.

---

#### 2C.3 One-pager — BC-24 · Regulatory obligation calendar & readiness

**Headline:** Twelve frameworks, twenty-five tracked obligations, one calendar —
with urgency scoring your compliance committee can act on.

**Three pains:**
1. Obligation tracking lives in a spreadsheet one person maintains; coverage
   depends on that person reading the right newsletter.
2. Deadlines across CSRD waves, ETS2, SFDR, BRSR and others interact — entity
   scoping is manual and error-prone.
3. No systematic link from "deadline approaching" to "which tool prepares this
   disclosure."

**Three capability proof-points:**
- `regulatory-calendar` serves 25 obligations across 12 frameworks (CSRD waves,
  ETS2 monitoring-plan deadlines, SFDR, BRSR and more), live-verified working
  after a fix on 2026-07-05 — filterable by framework, jurisdiction, and entity
  type.
- Urgency is computed, not hand-tagged: ≤14 days → critical, ≤45 → high,
  ≤90 → medium — so the alert list is reproducible.
- Each obligation carries its regulatory reference and the platform modules that
  prepare it — the calendar is the front door to the Compliance Desk
  (`regulatory-horizon` and `climate-reg-policy-tracker` extend it to
  horizon-scanning and policy tracking).

**Worked mini-example:** filter to an EU industrial entity and pull the ETS2 and
CBAM obligations with deadlines — the manufacturing persona UAT script checks
these against the official calendar, and that check is the demo.

**CTA:** Free tier: your jurisdictions and entity types, the filtered obligation
list, and 90-day alerts. The paid desk turns each obligation into the module that
prepares it.

---

#### 2C.4 15-minute demo script — flagship: BC-22 CBAM cost projection

*Preconditions: logged-in session; backend live. Persona: Trade-compliance lead /
CFO office of an EU importer. Opens with the calendar for context, lands on CBAM.*

| # | Time | Action (click / endpoint) | What the prospect sees | Talk track |
|---|---|---|---|---|
| 1 | 0:00 | Context: `GET /api/v1/regulatory-calendar/obligations?frameworks=CBAM` | CBAM obligations with deadlines, regulatory references, penalty risk | "This is where your CBAM deadlines live alongside the other 11 frameworks. Now let's size the exposure behind them." |
| 2 | 1:30 | Open `cbam-trade-exposure-mapper`; exposure matrix tab | 6 CBAM sectors × origins, embedded-emissions ranking, exempt/sanction flags, per-row intensity basis text | "The trade rows are a labeled Comtrade/COMEXT extract — order-of-magnitude, and the label says exactly that, with the production upgrade path named." |
| 3 | 3:30 | Show the engine feed: `GET /api/v1/cbam/free-allocation-schedule` and `GET /api/v1/cbam/ets-price-scenarios` | The official phase-out schedule (97.5% 2026 → 0% 2034) and three ETS price paths | "These factors are pinned in our benchmark against the official schedule. Check 2030: 51.5% free allocation, 48.5% CBAM factor." |
| 4 | 5:30 | Select Turkey/steel; walk the worked example | Embedded 4.4 MtCO₂; cost curve €8.25M (2026) → €202.73M (2030) → €506.0M (2034) | "Same tonnes, 61× the bill — the phase-out, not the ETS price, does the damage. You can verify 2026 on a calculator: 4.4M × €75 × 2.5%." |
| 5 | 8:00 | Live per-origin computation: Origin Substitution tab → `POST /api/v1/cbam/calculate-cost` per origin | Landed premium €/t per origin, % of implied unit value, competitiveness flags | "Each origin is a live engine call with its own domestic carbon price deducted per Art. 9. The 'uncompetitive' threshold is yours to set." |
| 6 | 10:30 | **The lineage moment.** Open the Atlas deep-dive for `cbam-trade-exposure-mapper` §7.4 | The hand-computed 3-vintage table, matching what's on screen | "The worked example in the documentation is the same numbers you just saw. If our math and our docs ever disagree, that's a bug we want to hear about." |
| 7 | 12:00 | Disclose limits proactively | The data label; hydrogen rows marked placeholders; static-mix assumption | "Three honest caveats: trade rows are approximations pending a BACI refresh; hydrogen is a placeholder corridor; substitution assumes full pass-through and no re-sourcing elasticity. For a real CBAM filing, origin carbon prices need documentary evidence." |
| 8 | 13:30 | Close: free calendar tier + pilot | — | "Free tier starts with your obligations calendar today. Pilot: your actual import lines through the same engine." |

**Questions to expect, with the honest answer:**
- *"Is the trade data our data?"* — No: a labeled hand-compiled extract for
  demonstration. The pilot runs your import lines; multi-year live Comtrade pulls
  are rate-limited on the keyless preview tier (1 period/request) — a free key
  removes that, and the UI discloses which mode it's in.
- *"Does this cover indirect emissions?"* — Per Annex II: direct-only for
  steel/aluminium/hydrogen, direct+indirect for cement/fertilisers/electricity.
  The matrix shows both columns so the pending-review contingent exposure (e.g.
  coal-heavy captive power) stays visible.
- *"Can it produce our CBAM declaration?"* — It sizes exposure and cost; the
  declaration workflow (registry integration, verified emissions data) is roadmap.
  The importer-checklist tab tracks the transitional-period timeline including the
  2025 Omnibus simplifications, labeled as needing verification against the final
  consolidated text.
- *"What about EUDR / broader supply-chain due diligence?"* — Honest answer: the
  EUDR spatial engine exists but its protected-areas reference table is
  deliberately empty pending a WDPA license decision, so screens return empty by
  design — we do not demo it, and we won't until that's resolved (it's the one red
  case on our readiness list).

---

#### 2C.5 Thought-leadership assets (Compliance)

1. **Explainer series — "The ESRS datapoint, explained one at a time."**
   Auto-generated from Module Atlas §7 sections: each piece takes one
   ESRS/SFDR/Taxonomy concept and shows the computation behind it with a worked
   example, regenerated whenever the regulation or the engine changes (the same
   pipeline that maintains the internal wiki). This is the G3 inbound engine;
   pieces begin publishing in G2.

2. **Whitepaper — "The 61× problem: what CBAM phase-in actually does to landed
   cost."** Using the pinned free-allocation schedule and a worked origin example,
   this paper shows that the dominant driver of 2026→2034 CBAM cost growth is the
   free-allocation phase-out, not ETS price appreciation — a distinction that
   changes which mitigation levers matter. All arithmetic is printed in full and
   reconciles to the identity net = gross × (1 − free-allocation%).

3. **Webinar — "When your disclosure tool should say 'insufficient data'."** A
   live demonstration of honest-nulls behavior: an empty portfolio through the
   SFDR PAI engine, the warnings it returns, and why a refusal is the compliant
   answer. Aimed at fund compliance officers who personally sign PAI statements
   and bear the consequences of invented values.

4. **Blog series — "Deadline math: reading the regulatory calendar like a risk
   register."** Monthly pieces keyed to the computed urgency windows in the
   obligation calendar (≤14/≤45/≤90 days), covering what each approaching deadline
   requires and which preparation steps take longest. Publishing cadence is set by
   the calendar itself — the content calendar *is* the regulatory calendar.

---

## 3 · Objection-handling matrix

Honest responses are the positioning. Where the true answer involves a known
limitation, the response states the limitation and the roadmap answer. Sales must
not improvise past these.

| # | Objection | Segment(s) | Honest response |
|---|---|---|---|
| 1 | "You're small/new — why should we trust your numbers over MSCI/S&P?" | All | We don't ask for trust; we ask for verification. 12 engines are pinned to hand-computed reference cases you can rerun (`backend/benchmark/bench_quant.py`); every module has published methodology docs (Module Atlas §7/§8); every number traces to source. Ask your current vendor for any one of those three artifacts. |
| 2 | "Is this just an LLM making up numbers?" | All | No LLM sits in any calculation path. Engines are deterministic code with a CI guardrail that blocks fabricated randomness platform-wide. A module copilot (RAG-grounded, cites documentation, refuses out-of-scope questions) is on the G2 roadmap — it will *explain* engine outputs, never generate numbers. It has not shipped, and we won't demo it as if it had. |
| 3 | "Your entity 'golden source' — how deep is it really?" | FI | Today the local LEI store is a just-in-time cache with only a handful of resolved entities; live GLEIF resolution works (proven end-to-end incl. ownership and sanctions chain), but cold lookups go to the live API. The bulk ingester is fixed and scheduled to run at scale (target ≥100k LEIs) as a named G0 work item before FI pilots. |
| 4 | "We compared two plants in the same country and wildfire risk was identical." | Energy, FI | Correct, and disclosed: wildfire is country-level resolution (a documented proxy from GWIS burned-area data), unlike earthquake/cyclone which are true 2°×2° grids. Per-cell enrichment via NASA FIRMS is designed in but needs a manually-issued API key. Never use the current wildfire layer for intra-country siting differentiation — the engine's `data_availability` field exists so you don't. |
| 5 | "Can you screen our supply chain for EUDR deforestation risk?" | Compliance | Not yet, and we won't pretend: the spatial overlap engine exists, but the protected-areas reference table is deliberately empty pending a WDPA license decision, so screens return empty by design. This is our one red-graded case. If EUDR is your priority, we'll tell you when the reference data is licensed and loaded — not before. |
| 6 | "Is your US/EU grid carbon data live?" | Energy | GB is fully live out of the box. US (EIA) and EU (ENTSO-E) require free API keys; until set, those endpoints return clearly-labeled fallback data — the label is visible, and flipping to live is a keys-only step, not a build. |
| 7 | "Your physical-risk pricing page showed numbers that didn't match the API." | FI | Known and documented: the E104 pricing engine is live and correct, but some frontend tabs still render a legacy demo path — it's the top wiring fix gating FI demos, and per our own rule we don't demo that case until it's closed. You heard about it from us because it's in our published review, which is how we'd like every vendor issue disclosed to you. |
| 8 | "Will the Studio's IRR match our Excel model?" | Energy, FI | The IRR bisection and LCOE conventions are hand-verified and benchmark-pinned. The full scenario-matrix × QMC path is not yet pinned — it's the top item on our benchmark backlog — so the pilot includes a side-by-side replication on your deal before you rely on it. If they disagree, one of us has a bug and we find it together. |
| 9 | "Can you handle our 5,000-asset book?" | FI | Functionally yes, volume-tested no: current stored demo data is thin (3 portfolios), batch hazard profiling caps at 200 locations per call, and we haven't load-tested a 500-holding book yet — seeding one is a named G0 item. We'd rather scale-test with your anonymized book in a pilot than claim a number we haven't measured. |
| 10 | "Our EU Taxonomy GAR differs from what your tool computes." | Compliance | Plausible — two documented defects are open: the GAR denominator is currently narrower than the Delegated Act requires (overstates GAR) and an eligibility multiplier is flagged for removal. The engines are real but the case is graded engine-ready-not-client-ready until both fixes land; it is not demoed today. |
| 11 | "Do your climate projections differentiate SSP scenarios?" | Energy | Partially, and disclosed per layer: sea-level carries SSP1-2.6 vs SSP5-8.5 (IPCC AR6). The Open-Meteo projection feed cannot switch SSPs upstream (effectively ~RCP8.5) and the response carries an explicit flag saying so. Where scenario differentiation isn't real, the platform tells you rather than letting you assume it. |
| 12 | "Who else uses this? Show me case studies." | All | We're in the design-partner phase and say so: heavily discounted annual terms in exchange for a named case study and weekly feedback. What we have today instead of logos: hand-verified benchmarks, per-module methodology documentation, and lineage traces — the evidence that usually takes longest to fake. |
| 13 | "Your ESRS navigator doesn't cover all datapoints." | Compliance | Correct: the underlying catalog in the database is real (1,184 ESRS rows) but the navigator currently surfaces 307 of ~1,144 datapoints — a documented shortfall, which is why CSRD automation is graded engine-ready rather than demo-ready. The calendar (BC-24) and SFDR PAI (BC-20) are the compliance cases we demo today. |
| 14 | "How do we know a future update won't silently change our numbers?" | All | Two mechanisms: benchmark pins (engine edits rerun the hand-computed cases; a formula regression fails the suite) and the CI fabrication guardrail on every commit. Honest gap: 12 of 297 engines are pinned today, clustered in prudential/PCAF/climate-risk; expanding pin coverage is an explicit roadmap track, ranked by blast radius. |
| 15 | "What's your security/access posture for a bank deployment?" | FI, Compliance | Auth required on all mutating endpoints (verified 401s when unauthenticated), RBAC per module with an admin panel, and audit middleware capturing mutating requests end-to-end. Known limits we state: single-instance rate limiting today, and SOC 2 is a readiness track, not a certificate — the audit-middleware foundation is built. |

---

## 4 · Case-study templates (for G1 design partners)

*Rules: no placeholder may survive to publication unfilled; metrics must come from
the partner's own verification, not ours; the partner approves the verification
section verbatim. Each template mirrors the segment's demo arc: pain → live run →
verification moment → outcome.*

### 4.1 Energy Developers template

> **[PARTNER NAME] screens [N] candidate sites and structures [N] PPAs on A² Intelligence**
>
> **Partner profile:** [developer type], [GW pipeline], [regions], analytics team of [N].
> **Business cases run:** BC-07 site screening, BC-01 PPA structuring [add BC-02 if used].
>
> **Before:** [How siting/PPA analysis was done previously — consultant engagements,
> spreadsheet count, cycle time per site/deal, cost per engagement.]
>
> **What was run:** [N] sites through `global-physical-risk-atlas` point/portfolio
> profiling; [N] PPA structures through `ppa-structuring-desk` on NASA POWER
> resource data; [optional: one deal replicated in `financial-modeling-studio`].
>
> **The verification moment (partner-approved):** [Describe the specific check the
> partner ran — e.g. "compared the platform's hazard profile for [SITE] against
> the consultant report we had already commissioned" or "replicated the Studio IRR
> for [DEAL] in our own model; delta was [X] bps." This section is written by the
> partner.]
>
> **Outcomes:** [screening cycle time: before → after] · [cost per screen/deal:
> before → after] · [decision affected: e.g. "site [X] deprioritized on cyclone
> exposure" — only if the partner confirms causality].
>
> **Limitation encountered and how it was handled:** [Required section — e.g.
> wildfire country-resolution on [COUNTRY] sites; what the disclosure looked like
> and what the partner did instead. Publishing limitations is policy.]
>
> **Quote:** "[PARTNER QUOTE — must reference something verifiable.]"
> — [NAME, TITLE, COMPANY]

### 4.2 Financial Institutions template

> **[PARTNER NAME] computes PCAF financed emissions for a [N]-position book with per-step attribution math**
>
> **Partner profile:** [institution type], [AUM/balance-sheet size], [supervisor],
> climate/ESG team of [N].
> **Business cases run:** BC-12 financed emissions [add BC-13 capital / BC-17
> underwriting if used].
>
> **Before:** [Prior vendor/spreadsheet process; asset classes NOT covered; what
> the auditor or supervisor flagged, if shareable.]
>
> **What was run:** [N] positions across [N] PCAF asset classes via
> `pcaf-financed-emissions` and the `api::pcaf_asset_classes` endpoints; DQS
> distribution before/after; [optional: PAI #2/#3 handoff into `sfdr-pai`].
>
> **The verification moment (partner-approved):** [The hand-check the partner's
> risk team performed — e.g. "recomputed attribution for our [N] largest positions
> by hand from the documented formulas; [N]/[N] matched" — and/or "reran
> bench_quant in our environment: 12/12."]
>
> **Outcomes:** [asset-class coverage: before → after] · [% of book at DQS ≤ 3:
> before → after] · [reporting cycle time: before → after] · [audit/assurance
> finding closed, if applicable].
>
> **Limitation encountered and how it was handled:** [Required — e.g. sector-proxy
> EVIC substitutions on [N] private positions and the forced DQS ≥ 4 penalty; how
> the partner sourced better data using the DQS improvement guidance.]
>
> **Quote:** "[PARTNER QUOTE]" — [NAME, TITLE, COMPANY]

### 4.3 Compliance template

> **[PARTNER NAME] quantifies its 2026–2034 CBAM cost curve and consolidates [N]-framework deadline tracking**
>
> **Partner profile:** [EU importer / fund manager / corporate], [sector],
> [CSRD wave / SFDR scope], compliance team of [N].
> **Business cases run:** BC-22 CBAM, BC-24 regulatory calendar [add BC-20 SFDR
> PAI if used].
>
> **Before:** [Spreadsheet obligation tracker owner; CBAM estimate method or
> absence; disclosure assembly process.]
>
> **What was run:** [N] import lines through `cbam-trade-exposure-mapper` with
> live per-origin `/api/v1/cbam/calculate-cost` calls; obligation calendar
> filtered to [jurisdictions/entity types]; [optional: PAI run on [N]-position
> book with honest-nulls output on the [N] indicators lacking data].
>
> **The verification moment (partner-approved):** [e.g. "checked the 2030
> free-allocation factor (51.5%) and CBAM factor (48.5%) against the regulation
> text ourselves" and/or "hand-recomputed the net cost for our largest origin
> line; matched to the euro."]
>
> **Outcomes:** [CBAM exposure quantified: € curve per year] · [sourcing decision
> informed, if any] · [obligation-tracking coverage: before → after] · [indicators
> flagged insufficient-data and the remediation plan — presented as a positive:
> found before assurance, not during].
>
> **Limitation encountered and how it was handled:** [Required — e.g. Comtrade
> preview-tier rate limits before the free key was set; the labeled
> approximation level of trade rows pending a BACI refresh.]
>
> **Quote:** "[PARTNER QUOTE]" — [NAME, TITLE, COMPANY]

---

## 5 · Sales enablement cheat sheet (one page)

**THE BINDING RULE:** demo 🟢 only. 🟡 = "engine ready, UI wiring / data
population in progress" — show roadmap, name the gap, never run it live in front
of a prospect. 🔴 (BC-25 only) = not marketed at all. Grades live in
`TOP25_BUSINESS_CASES.md` and only that document changes them.

**Demoable today (the twelve 🟢):**

| Case | What you demo | Anchor module |
|---|---|---|
| BC-01 PPA desk | Two-location PPA structuring, real NASA POWER yields | `ppa-structuring-desk` |
| BC-02 PF modeling | Studio model + IRR replication offer (QMC benchmark pending — say so) | `financial-modeling-studio` |
| BC-03 Tax equity | Flip solver vs the worked example in its Atlas deep-dive | `tax-equity-transferability` |
| BC-06 Offshore wind | Resource→O&M→debt-sizing chain | `offshore-wind-finance` |
| BC-07 Site screening | 5-hazard point/portfolio profile + coverage stats (disclose wildfire resolution) | `global-physical-risk-atlas` |
| BC-09 YieldCo | CAFD accretion / dropdown NAV bridge | `yieldco-dropdown-analyzer` |
| BC-12 PCAF | 13 asset classes, Shell worked example, DQS penalty, honest nulls | `pcaf-financed-emissions` |
| BC-13 Basel capital | Bench-pinned routing/floors + climate quarantine | `regulatory-capital` |
| BC-15 Green bonds | Pricing + greenium signal | `green-bond-pricing-desk` |
| BC-17 Underwriting | Bench-pinned PML/EAL + SCR aggregation | `climate-underwriting-workbench` |
| BC-20 SFDR PAI | PAI engine + empty-portfolio honest-nulls moment | `sfdr-pai` |
| BC-22 CBAM | Turkey-steel 61× cost curve, live per-origin calls | `cbam-trade-exposure-mapper` |
| BC-24 Reg calendar | 12 frameworks / 25 obligations, computed urgency (also the free tier) | `regulatory-calendar` |

*(BC-03/06/09/15 are 🟢 follow-ons — demoable, second-call material.)*

**The 🟡 phrasing that is allowed:** "The engine is built and documented; the
[page wiring / API key / data population / named fix] is in progress — here's the
gap and here's when." Named gaps to know cold: E104 page wiring (BC-10) ·
climate-VaR defects (BC-11) · thin LEI store until bulk run (BC-14) · page
discards API response (BC-16) · valuation Decimal/null bugs (BC-18) · ESRS
navigator 307-of-1,144 (BC-19) · GAR denominator + multiplier (BC-21) · Pydantic
contract break (BC-23) · VPP annualisation bug (BC-04) · guide↔code mismatch
(BC-05) · EIA/ENTSO-E keys (BC-08). BC-25 (EUDR): empty reference data by license
decision — decline to demo, explain why, log the interest.

**The three proof assets (carry to every meeting):**
1. **bench_quant** — `python backend/benchmark/bench_quant.py`: 12/12 hand-computed
   reference cases pass (VaR, PCAF WACI, Basel floors, Solvency II SCR, CBAM
   phase-out, LCOE/IRR). Offer to run it live.
2. **Module Atlas** — `docs/module_atlas/`: 999 modules with §7 methodology and §8
   model spec. Open the deep-dive of whatever module is on screen; it doubles as
   the buyer's model-risk documentation.
3. **Lineage traces** — `backend/lineage_output/traces/`: pick any displayed
   number, trace it to its source table or named public API. The "show the work"
   close for every demo.

**Three sentences that are always true (use them):**
- "If the number can't be traced, we don't show it."
- "When the data is insufficient, the engine says so instead of guessing."
- "Every limitation you'll find in a pilot is already written down — we'll hand
  you the list."
