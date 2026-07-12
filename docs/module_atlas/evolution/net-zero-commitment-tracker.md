## 9 · Future Evolution

### 9.1 Evolution A — Real signatory targets from SBTi and Net Zero Tracker (analytics ladder: rung 1 → 3)

**What.** §7 confirms a genuine strength: the alliance-level facts and signatory rosters are real and current (NZAM 315 members/$43T, NZAOA 88/$11T, NZBA 144/$74T, plus the real withdrawn set — Vanguard, Invesco, T. Rowe Price, Janus Henderson, QBE, and 120 real institution names). What's synthetic is each signatory's target and progress: `actualReduction = interimTarget·(0.3 + s2·0.8)` and `targetYear = 2040 + floor(s2·4)·5` are seeded. Evolution A replaces those with real pledge data, making the commitment-vs-action gap an actual measurement.

**How.** (1) Ingest the SBTi Companies Taking Action registry (public CSV) and the Net Zero Tracker dataset (both named in §5) into a `net_zero_pledges` table keyed to the existing real firm names: net-zero year, interim target, Scope 3 inclusion, offset cap, verification status. (2) Compute the gap from actual reported emissions trajectories (OWID/CDP data in the refdata layer) versus the pledged interim target — replacing the seeded `actualReduction`. (3) Implement the §5 NZCS credibility composite (`Σ wᵢ × Dimensionᵢ` over coverage/interim/offset/governance/verification) from these real fields, so the greenwashing-signal flags §1 describes are data-driven.

**Prerequisites.** SBTi/Net Zero Tracker ingestion (both free but need refresh cadence); firm-name reconciliation to LEI for clean joins. **Acceptance:** each signatory's commitment-action gap derives from a real pledge and real reported emissions; the withdrawn set and rosters stay accurate; no `sr()` remains in target/progress fields.

### 9.2 Evolution B — Stewardship copilot for pledge scrutiny (LLM tier 1 → 2)

**What.** A copilot for the stewardship/ESG-ratings users §1 targets: "which NZAM signatories have the widest commitment-action gap?", "does HSBC's pledge include Scope 3?", "flag greenwashing signals for this holding" — grounded in the alliance facts (real) and, post-Evolution-A, the real pledge fields and NZCS decomposition.

**How.** Tier 1 works immediately for alliance-structure questions (membership, AUM, withdrawals, secretariats — all real). Tier 2, after Evolution A: tool calls against the pledge-query and NZCS endpoints for signatory-specific credibility scores, with the fabrication validator matching quoted gaps and dimension scores to tool outputs. The copilot must clearly separate real alliance facts from computed credibility judgments in its provenance, and refuse to assert a company is "greenwashing" beyond flagging the specific NZCS dimensions that scored low (an evidenced signal, not an accusation).

**Prerequisites.** Tier 1 needs only the current real roster data but must disclose that per-signatory targets are illustrative until Evolution A; credibility scoring needs the real pledges. **Acceptance:** alliance facts cite the roster data; credibility answers (post-Evolution-A) trace to NZCS tool calls; "is X greenwashing?" returns the dimension-level evidence, not a verdict.
