## 9 · Future Evolution

### 9.1 Evolution A — Curve-based greenium and DSR from real financials (analytics ladder: rung 1 → 3)

**What.** §7 rates this the more genuinely quantitative of the two municipal-green-bond pages: the four closed-form functions (`calcTaxEquivalentYield`, `calcAfterTaxYield` with correct AMT handling, `calcGreeniumValue`, `calcDsr`) are economically correct muni math. But the greenium itself is a stored per-issuer number over 8 hand-authored issuers, `calcGreeniumValue` is undiscounted, and the DSR uses a fixed `annualRevenue = faceValue·0.15` proxy. Evolution A computes greenium against a constructed vanilla curve — the workflow §1 already describes but the code skips.

**How.** (1) Build the issuer vanilla curve from the hand-authored `RATING_SPREADS` table (a realistic AAA→BBB+ muni curve already in the page) plus a benchmark AAA curve, then `greenium = interpolated vanilla yield at the green bond's maturity − green yield` — turning two static tables into an actual spread model. (2) Discount `calcGreeniumValue` (PV of the bps saving over remaining life at the issuer's own curve) instead of the current `face × bps × years`. (3) Replace the DSR revenue proxy with issuer-entered or ACFR-sourced pledged revenue, falling back to the labelled proxy with a `proxy: true` flag — honest-nulls convention. Backend optional; this can stay tier-B if the curve math is unit-tested in the page.

**Prerequisites.** Agreement with the sibling `municipal-green-bond` module on shared greenium conventions (that page's synthetic book uses the opposite sign); interpolation method pinned on a hand-computed case. **Acceptance:** moving a bond's maturity or rating changes its computed greenium via the curve; discounted greenium value < undiscounted for any positive rate.

### 9.2 Evolution B — Muni-desk copilot for TEY and issuance what-ifs (LLM tier 1 → 2)

**What.** A copilot that answers the questions muni analysts actually ask this page: "what's the tax-equivalent yield of Chicago's green GO for a 37% bracket investor?", "how much does Paris's 18bps greenium save over the bond's life?", "which credit enhancement lifts a BBB+ issuer most?" — computed through the page's own four functions and the `RATING_SPREADS`/`BOND_TYPES` tables, never by the LLM doing yield arithmetic in its head.

**How.** Tier 1 ships now: the four formulas are deterministic and client-side, so expose them as a small calculation tool set (either a thin `POST /api/v1/muni-gb/calc` endpoint or sandboxed page-side function calls) and assemble the system prompt from this Atlas page's §7.1 formula block so explanations state the TEY formula exactly. Tier 2 adds scenario chains: "compare after-tax economics of the AMT vs non-AMT structure across tax brackets" becomes a sweep of `calcAfterTaxYield` calls rendered as a table. Fabrication validator matches every yield/bps figure to a function result.

**Prerequisites.** None hard — the math is real today; Evolution A improves the greenium answers but tier-1 TEY/DSR explanation is safe immediately, provided the copilot discloses that greenium and issuer data are hand-authored reference values, not live market quotes. **Acceptance:** every numeric traceable to a calc invocation; asking for live secondary-market pricing yields a refusal naming the data limitation.
