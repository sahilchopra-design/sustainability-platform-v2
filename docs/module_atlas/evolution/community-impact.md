## 9 · Future Evolution

### 9.1 Evolution A — Implement SROI monetisation; keep the FPIC scorecard it actually is (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag: the guide promises an SROI engine (HACT financial
proxies, deadweight/attribution/displacement/drop-off adjustments, gross→net
waterfall), but the page is an FPIC/grievance/benefit-sharing scorecard over 60
`sr()`-seeded extractive projects — real company/site names carrying fabricated
scores, with a fully seeded 24-month trend and KPIs that ignore the active filters
(§7.6). Evolution A does two honest things: build the §8-specified SROI calculator as
a new tab, and de-fabricate the scorecard rather than pretending it's the SROI tool.

**How.** (1) SROI engine: programme-level inputs (investment £, beneficiary counts,
outcome indicators) → outcome monetisation via a curated HACT Social Value Bank proxy
table (public values, versioned in refdata) → the four adjustments as explicit
percentage inputs with SROI-Guide default ranges → net social value discounted at a
social discount rate → `SROI = value/investment` with the gross→net waterfall chart
the guide describes. (2) Scorecard cleanup: replace the 60 seeded projects with
user-entered or case-study data; fix the KPI aggregation to respect filters; derive
the trend series from project records instead of `sr()`. (3) The genuinely-aligned
FPIC/grievance indicators (IFC PS7/PS1, UNGP 31) stay — they're the module's real
identity — now scored from entered evidence.

**Prerequisites (hard).** PRNG purge (60 projects + trend); the real-names/seeded-
scores combination must not survive — either anonymize or source. HACT proxy
licensing check (the free subset is publishable; the full bank isn't).
**Acceptance:** a hand-computed SROI case reproduces through the waterfall
(gross → deadweight → attribution → displacement → drop-off → net); KPIs change when
filters change; zero PRNG calls feed displayed metrics.

### 9.2 Evolution B — Impact-report drafter for GRI 413 disclosures (LLM tier 1)

**What.** The overview promises exports "formatted for GRI 201/203/413 and UN SDG
Bond disclosure" — a structured-drafting task. Evolution B generates the community
impact disclosure from a completed (post-Evolution A) SROI case plus the FPIC/
grievance records: GRI 413-1 (engagement/impact-assessment programmes, with the FPIC
and grievance-mechanism scores as evidence), GRI 203 (indirect economic impacts, with
the monetised outcome values), and an SDG-mapped outcomes table — each figure cited to
the module's computed waterfall or an entered record.

**How.** Tier-1 RAG: corpus is this Atlas record, the GRI 413/203/201 requirement
text (refdata catalog — GRI standards are already in the platform's reference layer),
and the SROI Guide's reporting principles. Structured case data passes as context;
the drafter marks unmet disclosure requirements explicitly rather than padding.
No endpoints exist today; tier 2 tool-calling arrives with Evolution A's backend if
the SROI calc is served rather than computed in-page.

**Prerequisites (hard).** Evolution A — GRI disclosures quoting seeded FPIC scores
attached to real mining companies would be a legal/reputational hazard; GRI text in
the corpus. **Acceptance:** every number in a draft disclosure traces to the SROI
waterfall or an entered record; each GRI disclosure number (413-1, 203-2) maps to a
section; missing evidence produces a stated gap, not filler prose.
