## 9 · Future Evolution

### 9.1 Evolution A — PAI roll-up on real holdings with pre-trade what-ifs (analytics ladder: rung 1 → 2)

**What.** The backend is genuinely strong — `sfdr_art9_engine` computes PAI-1/PAI-2 with honest nulls (`pai1 = None` when no Scope 1+2 data) across 7 routes — but the lineage sweep records `POST /assess` as **failed** and the two other POST computes as skipped, and the frontend runs on 60 `sr()`-synthetic funds. §7.6 adds three defects: the PAI `category` cutoff is off by one versus SFDR Annex I (Biodiversity/Water/Hazardous-Waste mislabelled Social), the PAI table's coverage figures never join to the funds' own `paiScore`, and `tempAlignment` is a random draw, not an ITR computation. Evolution A wires the module to real holdings and adds the what-if dimension an Art. 9 compliance officer actually needs.

**How.** (1) Diagnose and fix the `/assess` failure (triage pattern from the deployment-prep sweep). (2) Fix the one-line category cutoff. (3) Feed `POST /pai-aggregate` from `portfolios_pg` holdings so fund-level PAI indicators roll up from position-level data through the engine's existing weighted-sum math — eliminating the disconnected coverage table. (4) Pre-trade mode: submit a hypothetical holdings delta and return the SI%, taxonomy-alignment, and PAI movement before the trade — the same endpoints, scenario-parameterised. (5) Replace random `tempAlignment` with the platform's ITR machinery or drop the field (honest-null).

**Prerequisites.** `/assess` bug fix is the gate; a demo Art. 9 portfolio seeded in `portfolios_pg` (the D0 credibility-gap item). **Acceptance:** lineage sweep shows all 4 POST routes passing; PAI table totals reconcile with the sum over holdings; the mislabelled indicators render as Environmental.

### 9.2 Evolution B — Annex IV drafting analyst (LLM tier 2)

**What.** Article 9 periodic reporting (SFDR RTS Annex IV) is a template-filling task with strict numeric grounding — exactly the tier-2 shape. The copilot assembles the periodic report by calling `POST /pai-aggregate`, `POST /dnsh-check`, and `POST /portfolio-holdings` for the live figures, then drafts the narrative sections (how the sustainable investment objective was attained, DNSH assessment description) citing the module's own reference endpoints — `GET /ref/art9-requirements`, `/ref/dnsh-criteria`, and `/ref/esma-qa-2023`, which encode the actual regulatory text and ESMA guidance.

**How.** Tool schemas from the 7 OpenAPI routes; the report template's numeric slots are filled only from tool responses (fabrication validator enforced), while narrative slots must quote the relevant `/ref/*` payload for every regulatory claim. Draft output lands in the report-studio render layer per the Tier-3 composability pattern. A "greenwashing tripwire" refuses to draft language claiming sustainable-investment percentages above what `/assess` returned.

**Prerequisites (hard).** Evolution A first — `/assess` currently 500s, and drafting regulatory disclosures from synthetic fund data would be the exact failure mode SFDR exists to police. **Acceptance:** every figure in a generated Annex IV draft traces to a tool call in the session; a portfolio failing DNSH produces a refusal to draft compliance language, with the failing holdings listed.
