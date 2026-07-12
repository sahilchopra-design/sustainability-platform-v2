# Next Use Cases — Batch 2: Energy, Carbon, Project Finance & Debt Capital Markets (2026-07-04)

Target functionality level: institutional portfolio/risk platforms (BlackRock Aladdin,
Charles River IMS, YieldBook-class analytics) — meaning: real term-structure math, cash-flow
waterfalls computed period-by-period (not headline ratios), rating/PD-based credit treatment,
scenario/stress hooks into the platform's NGFS + carbon-price engines, and every number
traceable to an input, a wired engine, or a labeled seeded extract. No `sr()` PRNG as data.

Selection rule: each module must (a) compose at least one already-wired platform engine,
(b) add genuinely new calculation depth (not re-skin an existing module — see "adjacent
modules" column for what already exists and must be integrated, not duplicated), and
(c) model MULTIPLE REVENUE STREAMS and instrument-level criticalities where applicable
(PPA + merchant + capacity + RECs + carbon; step-ups, collars, flip structures, waterfalls).

| # | Module (route) | What it does | Composes (wired engines) | Adjacent modules (integrate, don't duplicate) |
|---|---|---|---|---|
| 1 | `/ppa-structuring-desk` | Structure & value a PPA term sheet: pay-as-produced vs baseload vs shaped; contract vs merchant-tail split; capture-price / cannibalization discount; REC/GoO + ancillary revenue stacking; counterparty bankability | `renewable_ppa` (/wind-yield, /solar-yield, /ppa-risk, refs), `grid_carbon` (shape), new backend `ppa_structuring.py` (shape/capture math) | ppa-analytics, ppa-revenue-analytics (portfolio views — link, don't rebuild) |
| 2 | `/project-finance-debt-sizer` | DSCR-sculpted debt sizing: period-by-period CFADS, target DSCR by revenue-contract mix, gearing/tenor caps, DSRA/MRA, cash sweep, P50 sponsor vs P90 lender case, refinancing assumption | `renewable_ppa` (yields), `project_finance` (/calculate), new backend `pf_debt_sizing.py` (sculpting solver) | hydrogen/bess/geothermal/ccus-project-finance pages (sector-specific — this is the generic solver) |
| 3 | `/infra-debt-portfolio-manager` | Aladdin-style infra private-debt book: positions ledger, rating & sector buckets, duration/spread-duration, expected loss via PF default-study PD × LGD, ratings-migration matrix, climate overlay | `fred_spreads` (discount/spread context), platform transition scores, seeded real PF default-study stats (S&P/Moody's PF studies, labeled) | infrastructure-debt-utility-bonds (single-name muni/utility — this is the multi-asset book) |
| 4 | `/green-bond-pricing-desk` | Primary issuance pricing: comparable-curve greenium estimation, new-issue premium, order-book build simulation, EuGB 85/15 use-of-proceeds test (wired), post-issuance spread tracking | `eu_gbs` engine, `fred_spreads` (rating-bucket OAS as comp curve) | green-bond-portfolio-analytics/optimizer (secondary portfolio — this is primary/issuance) |
| 5 | `/slb-structurer` | Sustainability-linked bond/loan structuring: KPI materiality + SPT ambition tests vs sectoral decarbonization pathways, coupon step-up valued as digital option (real prob-weighted math), SPO checklist | platform sector pathways, `fred_spreads` (base curve), new backend `slb_structuring.py` | sll-slb-v2, sustainability-linked-finance/instruments (scoring — this adds instrument pricing) |
| 6 | `/carbon-offtake-structurer` | Carbon credit offtake/ERPA structuring: forward purchase vs prepay vs streaming; delivery-risk haircuts (project-stage based); price indexation + floor/ceiling collars; quality adjustment via ICVCM score | `carbon_credit_quality` (/score-project), `dcm` (methodology refs), `carbon_markets_intel` | carbon-credit-pricing, em-carbon-credit-hub (spot analytics — this is the contracting desk) |
| 7 | `/battery-revenue-stacker` | BESS revenue stacking: arbitrage spread capture from real intensity/price shape, frequency-response + capacity-market stacks, cycle-degradation cost, augmentation schedule, merchant vs tolled comparison | `grid_carbon` (real GB shape), new backend `bess_stacking.py` (dispatch optimizer, greedy daily arbitrage) | bess-project-finance (financing — this is the revenue engine feeding it) |
| 8 | `/hybrid-project-workbench` | Co-located solar+wind+BESS hybrid: combined P50/P90 generation, shared-connection curtailment, PPA + merchant + storage revenue mix, one-click handoff into the debt sizer | `renewable_ppa` (both yields), modules #1/#2/#7 backends | energy-revenue-split (accounting split — this is the physical+financial workbench) |
| 9 | `/pf-credit-rating-engine` | Project-finance rating scorecard (agency-methodology style): construction/operation phase risk, resource risk (P90/P50 spread), counterparty, structure (DSCR/gearing/DSRA/sweep), notching → indicative rating + PD mapping | new backend `pf_rating.py` (scorecard, documented weights + agency-study PD table, labeled) | pf sector pages; feeds #3's expected-loss engine |
| 10 | `/maturity-wall-monitor` | DCM refinancing analytics for energy/utility issuers: bond maturity ladder (seeded real issuer extract), refi cost delta at live OAS, rate/spread stress, refinancing-gap flags | `fred_spreads` (live OAS), seeded real bond extract (major energy/utility issuers, labeled) | climate-capital-markets (macro views — this is issuer-level refi risk) |
| 11 | `/carbon-derivatives-desk` | EUA/CCA compliance hedging: cost-of-carry forward pricing, Black-76 options on carbon futures (real formula), hedge-ratio calculator for a compliance entity's emissions profile, margin/rollover schedule | `carbon_price_ets` (/eu-ets-forecast, /price-pathway), `climate_derivatives` | live-carbon-price-monitor (spot — this is the hedging desk) |
| 12 | `/ppa-xva-engine` | XVA on long-dated PPAs: expected-exposure profile from price-path simulation (documented lattice, not PRNG-as-data), CVA/DVA from rating-based PD curves, collateral/netting terms, wrong-way-risk flag | `renewable_ppa` (ppa-risk/ratings refs), new backend `ppa_xva.py` | banking_risk (bank-book XVA — this is contract-level for corporates/IPPs) |
| 13 | `/tax-equity-transferability` | US IRA monetization: ITC vs PTC economics, partnership-flip structure (target-IRR flip timing, pre/post-flip allocations), MACRS depreciation value, transferability-market discount comparison | new backend `tax_equity.py` (flip solver); real IRA parameters (labeled: ITC 30%+adders, PTC $/MWh inflation-adjusted) | india-green-infra-finance etc. (other jurisdictions) |
| 14 | `/yieldco-dropdown-analyzer` | YieldCo/asset-rotation analytics: CAFD accretion of a dropdown, payout-ratio sustainability, NAV/share bridge, dropdown vs green-securitization takeout comparison | modules #1/#2 outputs, green-securitization concepts | green-securitization (ABS — integrate as the takeout alternative) |
| 15 | `/energy-transition-credit-portal` | Integrated single-borrower credit view: PPA-backed project loan + carbon revenue + merchant exposure → PD/LGD/EL, Basel RWA + RAROC pricing floor, NGFS scenario deltas | `basel_capital`, `ngfs-extract` (scenarios), #9 rating, #2 DSCR outputs | climate-credit-integration (listed corporates — this is project/borrower-level) |

| 16 | `/financial-modeling-studio` | **Flagship: ultra-detailed financial modeling studio** — full project/IPP financial model: monthly construction + quarterly/annual operations periodicity; multi-stream revenue (PPA/merchant/capacity/REC/carbon); multi-tranche debt (senior + mezz, fixed/floating + swap) with full priority-of-payments waterfall, DSRA/MRA, covenant suite (DSCR/LLCR/PLCR/ICR, lock-up & default tests); three-statement outputs (IS/CF/BS with circularity resolved iteratively); scenario manager; 1D/2D sensitivity grids + tornado; deterministic quasi-Monte Carlo (Sobol/Halton — reproducible, computation-not-data) → IRR/DSCR distributions P5/P50/P95; goal-seek solvers (bisection: PPA price / capex / leverage for target IRR) | New backend `financial_model_engine.py` (all model math server-side); composes `renewable_ppa` yields, `carbon_price_ets` price paths, `fred_spreads` base-curve context; feeds #2 (its CFADS is a superset) | project_finance (single-shot IRR — this is the full modeling environment) |

## Build conventions (same as batch 1)
- Local `T` theme object per page; Live/Demo badging per AIGovernancePage convention on every
  engine/API-backed section; hand-authored editable defaults clearly labeled; seeded extracts
  labeled with source + date + refresh path.
- Finance math that other modules could reuse goes in a NEW BACKEND ROUTE
  (`backend/api/v1/routes/`, registered in server.py) — not buried in JSX. Frontend-only math is
  acceptable for display-level derivations (deltas, ratios).
- READ the Pydantic models of every composed engine BEFORE writing payloads.
- Cash-flow models are period-by-period arrays surfaced in the UI (inspectable waterfall tables),
  not single headline numbers. Every scorecard shows its weights. Every PD/LGD/default statistic
  cites its study basis in-UI.
- Routes wired centrally into App.js (single writer) under a new "Energy & Capital Markets Desk"
  nav group (codes NX2-01…NX2-15), wrapped in ProtectedRoute.
- No sub-agents; no App.js edits by build agents.
