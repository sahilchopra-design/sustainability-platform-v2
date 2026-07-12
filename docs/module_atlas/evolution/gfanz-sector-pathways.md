## 9 · Future Evolution

### 9.1 Evolution A — Real issuer emissions data and convex NZE pathways (analytics ladder: rung 2 → 3)

**What.** §7 flags a partial mismatch: the GFANZ alignment formula (`Alignment_s = 1 − (Intensity_portfolio − Intensity_pathway(t))/(Intensity_baseline − Intensity_pathway(t))`) is real and correctly implemented, and the sector baselines/targets plus the 37 milestones are genuine IEA-NZE reference content (`SECTOR_BENCHMARKS` from the refdata layer) — but every company's current intensity, alignment, capex-alignment, SBTi status, and milestone progress is `sr()`-fabricated, with an `sr()×20−10` noise term making even the alignment score non-deterministic in the gap. Two additional flags: the pathway is linear 2020→2050 (real Power/Auto pathways are convex/front-loaded), and there's no issuer emissions data. Evolution A feeds real issuer intensity data (from the platform's company master and financed-emissions modules) into the already-correct formula, removes the noise term, and interpolates the actual NZE curve rather than a straight line.

**How.** (1) Replace the seeded company panel with issuer production/intensity from the company master (or PCAF-attributed emissions), so alignment is computed from real inputs. (2) Delete the `sr()×20−10` noise addend — alignment must be a deterministic function of the gap. (3) Interpolate the real NZE/NGFS sector trajectories (convex where published) instead of linear; SBTi status read from the module's SBTi data rather than seeded.

**Prerequisites.** Issuer emissions/intensity data (company master + financed-emissions vertical); NZE curve points per sector in refdata. **Acceptance:** two issuers with identical intensity gaps get identical alignment (noise gone); the pathway matches published NZE convexity; no `sr()` value drives any company metric.

### 9.2 Evolution B — GFANZ alignment and engagement copilot (LLM tier 2)

**What.** A copilot for FI net-zero teams: "which steel issuers in our book are off the GFANZ pathway, and who should we prioritise for engagement?" tool-calls the Evolution A alignment endpoint, ranks laggards by intensity gap and portfolio weight, and drafts the GFANZ-format sector alignment report.

**How.** Tier-2 tool-calling over the alignment/sector endpoints; the grounding corpus is §5/§7 (GFANZ Guidance 2022, IEA NZE, NGFS Phase 4, Poseidon Principles for shipping, CRREM for buildings are cited). The copilot's value is turning the fractional-progress score into a prioritised engagement list and milestone-monitoring narrative, every intensity and alignment figure tool-sourced. Guardrail: pre-Evolution-A it must disclose that company-level figures are synthetic and refuse issuer-specific alignment claims.

**Prerequisites.** Evolution A (no real issuer data today); RBAC-scoped portfolio data; corpus embedding. **Acceptance:** post-Evolution-A, every alignment and gap figure in a report traces to a tool call; the milestone-monitor narrative cites the real 37-milestone dataset; pre-Evolution-A, issuer alignment questions are refused.
