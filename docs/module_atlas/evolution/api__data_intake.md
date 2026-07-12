## 9 · Future Evolution

### 9.1 Evolution A — Fix the PCAF summary defects and use prescribed attribution denominators (analytics ladder: rung 1 → 3)

**What.** "Category C — Client Proprietary Data Intake": seven intake modules (loan CSV, counterparty
emissions, real-estate EUI, shipping fleet, steel borrowers, project finance, config) persisting to
`di_*` tables, plus three computation endpoints (PCAF summary, shipping CII analytics, steel intensity
vs NZE) — all client-supplied, no PRNG. §7.3/§7.5 document **real defects to fix**, not just deepening:
the PCAF summary counts only each counterparty's **first loan row** in the headline (understating
multi-loan counterparties), the sector-breakdown guard `if cid not in seen or True:` is **always true**
(so sector figures include every row, inconsistent with the headline), and the "WACI" term is actually
financed-emissions-per-$M lending intensity with multi-row double-counting — not PCAF/TCFD revenue-
weighted WACI. Attribution also uses lending-book share, not PCAF's prescribed EVIC/(equity+debt)
denominators. There is also a steel unit-naming mismatch (`total_co2_tco2e` holds MtCO₂).

**How.** Rewrite `get_pcaf_summary` so financed emissions aggregate correctly across all loan rows per
counterparty (AF already apportions per row — sum them, don't dedup to the first), fix the sector guard,
and compute true WACI as revenue-intensity weighted by portfolio weight; attribution uses EVIC for
listed and total equity+debt for private per PCAF. Rung 3: shipping IMO 2030/2050 compliance computed
against the real CII reduction-factor trajectory (not a rating-letter proxy); project IRR with
construction period, degradation and debt sculpting.

**Prerequisites (hard).** Fix the harness failure — §4.2 shows `GET /portfolio/{upload_id}/rows`
**failed** (db-empty); fix the three documented PCAF-summary logic bugs and the steel unit label.
**Acceptance:** the §7.4 steel worked example (1.736 tCO₂/tCS, +0.456 vs NZE) reproduces with correct
MtCO₂ labelling; a two-loan counterparty's financed emissions appear in full in the headline; sector
and headline totals reconcile; the rows endpoint passes the harness.

### 9.2 Evolution B — Data-intake copilot that validates and computes on upload (LLM tier 2)

**What.** A copilot for onboarding client data: "upload this loan portfolio CSV and show me PCAF
summary" (`/portfolio/upload` → `/pcaf-summary`), "add this steel borrower" (`/steel-borrowers` with
the blended-intensity calc), "what's my fleet's CII compliance?" (`/shipping-analytics`), "model this
project's DSCR and IRR" (`/project-finance`) — narrating real computed metrics and flagging invalid
rows (stored with `is_valid=false` and per-row `validation_errors`, not rejected).

**How.** Tool schemas over the ~26 endpoints; write actions (upload, upsert, delete) render a
confirmation before persisting (audit-logged via middleware). The copilot uses the CSV templates
(CRREM/ENERGY STAR/CII columns) to guide the user's data preparation, and surfaces the PCAF DQS ladder
(1 verified → 5 proxy) so the user understands their data-quality score. The no-fabrication validator
checks every financed-emissions, DSCR and intensity figure against tool output; post-Evolution A the
copilot reports corrected PCAF totals.

**Prerequisites (hard).** Evolution A's PCAF-summary fixes (a copilot must not narrate the documented
double-count/understate bugs); the rows-endpoint harness fix; Atlas corpus embedded (roadmap D3); RBAC
so uploads run under the user's session. **Acceptance:** every figure cited traces to an intake tool
call; an upload with invalid rows surfaces the per-row validation errors, not a silent drop; the PCAF
summary a copilot reports reconciles headline and sector totals.
