## 9 · Future Evolution

### 9.1 Evolution A — Lender-specific two-rate spread and EPC-grounded energy savings (analytics ladder: rung 1 → 2)

**What.** §7 credits this with a deterministic (no-PRNG) benefit calculator and static real-world product/scheme tables covering 8 green mortgage products and 6 retrofit schemes (UK ECO4/GBIS, EU Renovation Wave, France MaPrimeRénov, Germany BAFA/KfW, US IRA §25C). Its flagged simplification: the rate benefit is a flat 15 bps per EPC notch rather than a lender-specific two-rate spread, and the energy-saving term (`ΔEPCgrade × AvgEnergyBill`) uses an average bill rather than the property's actual consumption. Evolution A grounds these: model each product's actual standard-vs-green rate spread (from the real product table) instead of a flat 15 bps, and derive energy savings from EPC-band-specific energy-intensity data (the platform's EPC feed, wired in wave-1) rather than a flat average bill.

**How.** (1) Replace the flat 15 bps/notch with each product's real two-rate spread from the product table, so the monthly saving reflects the actual discount. (2) Energy savings from EPC-band EUI deltas × the property's floor area and local energy price, not a flat bill. (3) The retrofit-scheme subsidies netted into the payback so `Payback = (RetrofitCost − Subsidy)/TotalAnnualBenefit` reflects the real scheme.

**Prerequisites.** EPC-band energy-intensity data (wave-1 EPC source); local energy prices; the flat 15 bps replaced by product-specific spreads. **Acceptance:** the monthly saving uses each product's real rate spread; energy savings derive from EPC-band EUI and property area; payback nets scheme subsidies; no flat-15bps assumption remains.

### 9.2 Evolution B — Retrofit-financing copilot (LLM tier 1 → 2)

**What.** A copilot for mortgage lenders and homeowners: "for an EPC-D house upgraded to B with a €20k retrofit, which scheme and green mortgage minimise payback?" narrates the product and scheme tables from the atlas corpus, with tier-2 computing the benefit/payback via the Evolution A calculator across products and schemes.

**How.** Tier 1 grounds on §5/§7 (the 8 products, 6 real retrofit schemes, the benefit/payback formulae) — the copilot cites real scheme terms (ECO4, MaPrimeRénov, IRA §25C). Because the calculator is deterministic, an explainer over rendered state ships immediately; the tier-2 upgrade computes cross-product/scheme comparisons via the Evolution A endpoint. Every saving and payback figure validated against tool output.

**Prerequisites.** Corpus embedding; Evolution A for lender-specific/EPC-grounded computation. **Acceptance:** every saving and payback figure traces to a tool call or rendered state; the scheme recommendation uses real subsidy terms; post-Evolution-A the energy saving reflects EPC-band data, not a flat bill.
