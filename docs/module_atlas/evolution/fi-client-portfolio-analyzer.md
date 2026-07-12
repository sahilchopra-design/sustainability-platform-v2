## 9 · Future Evolution

### 9.1 Evolution A — Real borrower book with the promised IFRS 9 climate-overlay ECL (analytics ladder: rung 1 → 2)

**What.** The §7 flag is explicit: this tier-B page promises `ECL = PD·LGD·EAD` with `PD_climate = PD_base·(1 + γ·Δscore)` and Stage 1/2/3 staging, but implements none of it — 50 borrowers carry a bare seeded score (`round(20 + sr(i·7)·70)`) and seeded exposure, and the §8 model spec is marked "not yet implemented in code". Evolution A builds the module's first backend vertical: persist a borrower book, and compute the guide's ECL machinery server-side rather than inventing a new method — the platform already has the climate-conditioned ECL pattern in `climate-credit-integration` (PD×LGD×EAD with NGFS multipliers), which §7 itself points to as the genuine implementation to reuse.

**How.** (1) New `fi_borrowers` table (name, NACE sector, region, exposure, PD_base, LGD, transition score) seeded from the platform's demo portfolio (roadmap D0). (2) A route that applies the §8 spec: staging on PD>2× origination, 12-month vs lifetime ECL, climate-stressed PD via the documented γ·Δscore overlay. (3) The page's watchlist and score distribution re-read from the API; TreeMap and heatmap keep their real NACE/region taxonomies.

**Prerequisites.** The seeded-random book must be replaced, not wrapped (documented §7 defect); γ calibration honestly labelled as assumption until loss data exists. **Acceptance:** a borrower detail view shows PD, LGD, EAD, stage, and ECL that reproduce the §8 formulas by hand; watchlist membership changes when a borrower's PD is edited.

### 9.2 Evolution B — Relationship-manager engagement copilot (LLM tier 2)

**What.** The Watchlist tab has an "Engage" button that today leads nowhere analytical. Evolution B makes it real: for a watchlisted borrower, the copilot assembles an engagement brief by tool-calling the module's borrower endpoint plus sibling modules — `fi-concentration-monitor` logic for the borrower's contribution to sector HHI, `fi-net-zero-pathways` for the sector's decarbonisation trajectory — and drafts the client conversation agenda (score drivers, staging risk, what improvement would lift them off the watchlist).

**How.** Tier-2 tool-calling over the Evolution A endpoints (read-only), with the routing edges taken from the atlas interconnection graph rather than free association. The brief's numeric spine (score, exposure, ECL, stage) comes exclusively from tool output; the LLM contributes structure and sector-specific talking points grounded in the embedded atlas corpus for the CT-sprint FI modules.

**Prerequisites.** Evolution A (there is currently no backend to call and the scores are synthetic); RBAC inheritance so a copilot session only sees the user's permitted book. **Acceptance:** an engagement brief for borrower N cites only that borrower's tool-returned values; the fabrication validator passes on 20 consecutive briefs.
