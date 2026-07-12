## 9 · Future Evolution

### 9.1 Evolution A — Per-asset stranding years from real EPC certificates (analytics ladder: rung 2 → 3)

**What.** EP-EI2 is a real vertical — `commercial_re_engine` behind 12 routes, with the
four ref GETs (CRREM pathways, EPC thresholds, retrofit measures, green premium)
passing the harness — but the page's stranding logic is a static `epc >= 'D'` cut over
seeded assets rather than the per-asset CRREM-pathway-crossing year the backend can
compute (§7.5). Evolution A closes the loop: real building data in, engine-computed
stranding years out. The platform already integrated the UK EPC register (data-sources
wave 1) — this module is its natural consumer.

**How.** (1) Frontend swap: the 24-asset seed panel loads from ingested EPC
certificates (floor area, band, EUI where derivable), and `POST /commercial-re/crrem`
computes `CRREM_Gap = AssetEUI − Pathway_EUI(year)` and stranding year per asset —
replacing the `epc >= 'D'` proxy with actual pathway crossings. (2) Triage the harness
gaps: `/full-assessment` shows status `failed` and the core POSTs (`/crrem`,
`/epc-epbd`, `/green-lease`) were only `skipped` — they need payload fixtures and a
passing sweep before the frontend depends on them. (3) Retrofit payback: revisit the
`carbonSave·carbonPrice/1000` term §7.5 flags as scaling carbon value to near-nothing
(£9.6/yr vs £60,000 energy in the worked example) — verify units (t vs kg) and make
the rent-premium and avoided-stranding-loss terms from the guide's formula real
inputs. (4) Pin the corrected worked example in `bench_quant.py`.

**Prerequisites.** UK EPC ingest coverage for the demo portfolio's geographies;
harness fixtures for the skipped POSTs. **Acceptance:** two assets in the same EPC
band with different EUIs get different stranding years; the carbon-price slider moves
payback by a defensible magnitude after the units audit; `/full-assessment` passes the
lineage sweep.

### 9.2 Evolution B — Mortgage-book stress analyst for RE lenders (LLM tier 2)

**What.** The module's first stated user is "real estate lenders stress-testing
mortgage book under NGFS scenarios". Evolution B gives them a tool-calling analyst:
"stress the logistics book under Hot House and flag refinancing risk" runs
`POST /commercial-re/full-assessment` (and `/refi` for the refinancing lens) per asset,
then reports LTV/NOI/cap-rate impacts, stranding-year distribution, and which loans
breach covenant thresholds — every figure from tool output. Retrofit questions ("is it
worth funding this borrower's retrofit?") call `/retrofit` and narrate the computed
payback against the green-premium reference data.

**How.** Tool schemas from the module's 12 OpenAPI operations; the four ref GETs serve
as citable grounding (CRREM pathway values, EPC thresholds) so the analyst quotes
pathway numbers from the engine, not from memory. System prompt from §5 (stranding
formula, CRREM v2.0/NGFS standards) and §7.2's parameter provenance so it discloses
which scenario impacts are curated NGFS figures. No-fabrication validator on all
basis-point and year figures.

**Prerequisites (hard).** Evolution A's endpoint triage — `/full-assessment` currently
fails and cannot anchor an analyst; real asset data so narratives describe an actual
book. **Acceptance:** a book-level stress memo where every LTV delta and stranding
year matches a tool response; the analyst refuses to opine on asset classes the CRREM
pathways don't cover rather than borrowing an adjacent pathway silently.
