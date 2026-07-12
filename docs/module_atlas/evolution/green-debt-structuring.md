## 9 · Future Evolution

### 9.1 Evolution A — Real net-benefit model with curve-derived greenium (analytics ladder: rung 1 → 2)

**What.** §7 documents that the guide's structuring economics — `Greenium = Yield(conventional) − Yield(green)` in bps and `Net Benefit = Greenium Savings − SPO Cost − Reporting Cost over bond life` — sit over `sr()`-seeded instruments where greenium is a random draw rather than a spread differential. The live SLL ratchet logic (coupon step-up/down on KPI target/actual) is genuine, but the greenium and net-benefit inputs are synthetic. Evolution A grounds the economics: derive greenium from a matched conventional-vs-green curve (reusing the FRED comp curves the sibling `green-bond-pricing-desk` already pulls), and compute net benefit as greenium savings over the bond's life minus real SPO and post-issuance reporting costs — so an issuer sees whether labelling actually pays.

**How.** (1) Greenium computed as the yield differential against a matched conventional curve, not a seeded field. (2) Net benefit = Σ(greenium bps × notional over tenor) − SPO cost − annual reporting burden, all as parameterised inputs. (3) Keep the working SLL ratchet; add the coupon step economics into the net-benefit calculation. (4) Instruments user-supplied or sourced, replacing the seeded panel.

**Prerequisites.** A conventional-curve source (shared with the pricing-desk sibling); SPO/reporting cost benchmarks; seeded instruments replaced. **Acceptance:** greenium derives from a curve differential (not `sr()`); net benefit reproduces the §5 formula and can go negative when SPO/reporting exceed savings; the SLL ratchet remains correct.

### 9.2 Evolution B — Green-debt structuring copilot (LLM tier 2)

**What.** A copilot for DCM/treasury teams: "does labelling this €500M 7-year bond as green pay after SPO and reporting costs, and how should I set the SLL coupon ratchet?" tool-calls the Evolution A greenium/net-benefit and ratchet endpoints, narrating the structuring trade-off under ICMA GBP/GLP frameworks.

**How.** Tier-2 tool-calling over the net-benefit and ratchet endpoints; the grounding corpus is §5/§7 (ICMA GBP/GLP, greenium mechanics, SPO/reporting-cost economics, SLL step-up/down). The copilot's value is the cost-benefit of labelling and optimal ratchet calibration. Guardrail, pre-Evolution-A: greenium is seeded, so it must refuse net-benefit figures and answer only on framework structure. Every bps and net-benefit figure validated against tool output.

**Prerequisites.** Evolution A (seeded greenium today); conventional-curve data; corpus embedding. **Acceptance:** post-Evolution-A, every greenium and net-benefit figure traces to a tool call; the ratchet recommendation reproduces the step economics; pre-Evolution-A the copilot declines net-benefit claims.
