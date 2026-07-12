## 9 · Future Evolution

### 9.1 Evolution A — Real registry data under the VCM integrity score (analytics ladder: rung 1 → 2)

**What.** §7's flag is double-edged: the guide entry describes green-*bond* due
diligence that belongs to a different module, while the code is voluntary-carbon-
market credit integrity DD (EP-BN3's subject) — and every credit attribute is
`sr()`-seeded: 18 synthetic credits, hard-coded `CCP_DIMS`, a standards-alignment
matrix that is "random noise re-drawn per cell", and an unattributed equal-⅕
dimension weighting. §7.5 also notes the real ICVCM CCP is a *binary program +
methodology-category label*, not a 0–100 score. Evolution A commits to the VCM
identity and grounds it: real registry credits, the actual CCP-Approved
determinations, and an integrity rubric that acknowledges what is assessed versus
asserted.

**How.** (1) Registry data: the platform already seeded Verra registry projects
(migration 102) — join credits to real project records (methodology, vintage,
country, registry) and extend with Gold Standard's public registry export.
(2) CCP alignment: ICVCM publishes its program and methodology-category decisions —
a curated, versioned table replaces the invented 8-dimension numeric rubric, with the
binary CCP label shown as ICVCM defines it; the module's own 5-dimension house score
(additionality/permanence/MRV/co-benefits/safeguards) stays but with documented,
justified weights and per-dimension evidence notes. (3) The `0.5 + score/100` price
map gets replaced by category/vintage-differentiated benchmarks or dropped — §7.5 is
right that quality premia aren't linear in a composite. (4) The random ✅/⚠️
standards matrix is deleted outright.

**Prerequisites (hard).** Full PRNG purge; ICVCM decision-table curation with a
refresh owner; reconcile the guide entry (the green-bond DD description should move
to its own module or §8). **Acceptance:** every displayed credit maps to a real
registry project ID; the CCP column matches ICVCM's published list; zero random
draws in any rendered cell.

### 9.2 Evolution B — Credit due-diligence dossier builder (LLM tier 2)

**What.** VCM due diligence is document synthesis: project design documents,
verification reports, and registry records feed an integrity judgment. Evolution B
builds the dossier: for a selected (post-Evolution A) real credit, the assistant
pulls the registry record, summarizes the methodology's ICVCM category status,
extracts additionality and permanence arguments from the uploaded PDD with page
citations, checks the greenwashing flag rules (§5's documented triggers), and drafts
the credit-committee addendum — separating registry facts, ICVCM determinations,
house-score judgments, and unverifiable claims into labelled sections.

**How.** Tier-2 with a document pipeline: PDD/verification-report upload → extraction
prompts structured per the house rubric's five dimensions, each output span-cited;
registry and ICVCM lookups as read tools. The provenance separation is the product:
buyers get burned when assessment layers blur, so the dossier template enforces the
four-way labelling. Draft scores queue for analyst confirmation before entering the
displayed universe (gated mutation per the roadmap).

**Prerequisites (hard).** Evolution A (a dossier over seeded credits is fiction);
document upload path; ICVCM/VCMI texts in the corpus. **Acceptance:** a dossier for
one real Verra project cites retrievable PDD passages for every extracted claim;
ICVCM status is quoted, never inferred; dimensions without documentary evidence are
scored "insufficient evidence" rather than mid-range defaults.
