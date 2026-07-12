"""
Prepare Notion push payloads for the Module Atlas.

Reads docs/module_atlas/atlas.json (+ module_guides.json) and emits
docs/module_atlas/notion_batches/slice_NN.json — each a list of ready-to-send
page objects {properties, content} in Notion-flavored Markdown, trimmed to a
consistent per-page budget so the wiki stays fast and the push predictable.
The FULL ultra-depth pages remain in docs/module_atlas/modules/*.md (source of
truth); every Notion page links back to its repo path.

Usage: python scripts/prepare_notion_payload.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "module_atlas")
BATCH_DIR = os.path.join(OUT, "notion_batches")
DEEP_DIR = os.path.join(OUT, "deep")
os.makedirs(BATCH_DIR, exist_ok=True)

atlas = json.load(open(os.path.join(OUT, "atlas.json"), encoding="utf-8"))
guides = json.load(open(os.path.join(OUT, "module_guides.json"), encoding="utf-8"))

SLICES = 8


def esc(s):
    return str(s).replace("|", "/").replace("\n", " ").strip()


def read(p):
    try:
        with open(p, encoding="utf-8") as f:
            return f.read()
    except OSError:
        return ""


def content_md(mid, m):
    g = guides.get(m.get("route", "")) or {}
    L = []
    is_be = mid.startswith("api::")
    L.append(f"**Module ID:** `{mid}` · **Route:** `{m.get('route','')}` · "
             f"**Layer:** {'Backend API Domain' if is_be else 'Frontend Module'} · "
             f"**Tier:** {m.get('tier','B')}")
    L.append(f"**Repo wiki source:** `docs/module_atlas/modules/{mid.replace('::','__')}.md`")

    if g.get("description"):
        L.append(f"\n## Overview\n{g['description']}")
    if g.get("valueSummary"):
        L.append(f"> **Business value:** {g['valueSummary']}")

    # ── Function map ──
    L.append("\n## Function Map")
    comps = m.get("components") or []
    if comps:
        L.append("**Frontend components:** " + ", ".join(f"`{c}`" for c in comps[:15]))
    if g.get("userInteraction"):
        L.append("\n**How an analyst works this module:**")
        for u in g["userInteraction"][:12]:
            L.append(f"- {esc(u)}")
    computed = m.get("computed") or []
    if computed:
        L.append("\n**UI-layer derived values (variable ← expression):**")
        L.append("| Variable | Expression |\n|---|---|")
        for c in computed[:24]:
            L.append(f"| `{c['name']}` | `{esc(c['expr'])[:220]}` |")
    if m.get("seed_schemas"):
        L.append("\n**Seed dataset schemas:**")
        L.append("| Dataset | Rows | Fields |\n|---|---|---|")
        for s in m["seed_schemas"][:12]:
            L.append(f"| `{s['name']}` | {s.get('rows') or '—'} | {', '.join('`'+f+'`' for f in s['fields'])} |")
    brs = m.get("backend_routes") or []
    if brs:
        L.append("\n**Backend endpoints:**")
        L.append("| Method | Path | Handler |\n|---|---|---|")
        n = 0
        for br in brs:
            for ep in br["endpoints"]:
                if n >= 20:
                    break
                L.append(f"| {ep['method']} | `{esc(ep['path'])}` | `{ep['handler']}` |")
                n += 1
    for ed in (m.get("engine_detail") or [])[:3]:
        if ed.get("functions"):
            L.append(f"\n**Engine `{ed['name']}` functions:**")
            L.append("| Function | Purpose |\n|---|---|")
            for fn in ed["functions"][:24]:
                L.append(f"| `{esc(fn['name'])}` | {esc(fn['doc'])[:220]} |")
        if ed.get("constants"):
            L.append(f"\n**Engine `{ed['name']}` — reference constants / scoring weights:**")
            L.append("| Constant | Value |\n|---|---|")
            for c in ed["constants"][:14]:
                L.append(f"| `{c['name']}` | `{esc(c['value'])[:300]}` |")

    # ── Lineage ──
    L.append("\n## Data Lineage (source → transformation → UI)")
    dps = g.get("dataPoints") or []
    if dps:
        L.append("| UI metric | Formula | Source |\n|---|---|---|")
        for d in dps[:32]:
            L.append("| {} | {} | {} |".format(
                esc(d.get("name", ""))[:80],
                f"`{esc(d['formula'])[:160]}`" if d.get("formula") else "—",
                esc(d.get("source", "—"))[:80]))
    for dl_ in (g.get("dataLineage") or [])[:12]:
        L.append(f"- **{esc(dl_.get('source',''))}** → {esc(dl_.get('flow',''))} → **{esc(dl_.get('output',''))}**")
    for t in (m.get("trace") or [])[:6]:
        L.append(f"\n**Traced chain — {esc(t['label'])}** (provenance {t['provenance']}; "
                 f"tables: {', '.join('`'+s+'`' for s in t['source_tables'][:10]) or '—'})")
        if t.get("call_chain"):
            L.append("```\n" + "\n".join(t["call_chain"][:20]) + "\n```")

    # ── Transformation logic ──
    ce = g.get("calculationEngine") or {}
    forms = [(ed["name"], ed["formulas"]) for ed in (m.get("engine_detail") or []) if ed.get("formulas")]
    if ce or forms:
        L.append("\n## Transformation Logic")
        if ce.get("methodology"):
            L.append(f"**Methodology:** {esc(ce['methodology'])[:400]}")
        if ce.get("formula"):
            L.append(f"**Headline formula:** `{esc(ce['formula'])[:300]}`")
        if ce.get("brief"):
            L.append(f"\n{esc(ce['brief'])[:1200]}")
        if ce.get("standards"):
            L.append(f"\n**Standards:** {esc(ce['standards'])[:300]}")
        for name, fl in forms[:2]:
            L.append(f"\n**Engine `{name}` — extracted transformation lines:**")
            L.append("```python\n" + "\n".join(f[:160] for f in fl[:20]) + "\n```")

    # ── Sources / provenance ──
    L.append("\n## Data Sources & Provenance")
    L.append(f"**Provenance:** {', '.join(m.get('provenance', []))}")
    if m.get("tables"):
        shared = set(m.get("shared_tables") or [])
        L.append("**DB tables:** " + ", ".join(
            f"`{t}`{' *(shared)*' if t in shared else ''}" for t in m["tables"][:28]))
    if m.get("seed_constants"):
        L.append("**Frontend seed datasets:** " + ", ".join(f"`{s}`" for s in m["seed_constants"][:20]))
    if m.get("contexts"):
        L.append("**Shared context buses:** " + ", ".join(f"`{c}`" for c in m["contexts"]))

    # ── Interconnections ──
    L.append("\n## Interconnections & Change Risk")
    L.append(f"**Blast radius:** {m.get('blast_radius', 0)} connected module(s).")
    if m.get("shared_engines"):
        L.append("**Shared engines (edits propagate):** " + ", ".join(f"`{e}`" for e in m["shared_engines"][:16]))
    ics = m.get("interconnections") or []
    if ics:
        L.append("| Connected module | Shared via |\n|---|---|")
        for ic in ics[:16]:
            L.append(f"| `{ic['module']}` | {esc(', '.join(ic['via']))[:180]} |")

    # ── Methodology Deep Dive (the whole point of this expansion) ──
    deep_md = read(os.path.join(DEEP_DIR, f"{mid.replace('::', '__')}.md")).strip()
    if deep_md:
        L.append("\n" + deep_md)
    return "\n".join(L)


pages = []
for mid, m in sorted(atlas.items()):
    is_be = mid.startswith("api::")
    eng = m.get("engines") or []
    props = {
        "Name": m.get("title") or mid,
        "Module ID": mid,
        "Layer": "Backend API Domain" if is_be else "Frontend Module",
        "Tier": "A — Backend vertical" if m.get("tier") == "A" else "B — Frontend-computed",
        "Route": m.get("route", ""),
        "Domain / Sprint": str(m.get("nav") or ""),
        "EP Code": str(m.get("ep_code") or ""),
        "Engines": ", ".join(eng[:8]),
        "Shared Engines": ", ".join((m.get("shared_engines") or [])[:8]),
        "DB Tables": ", ".join((m.get("tables") or [])[:12]),
        "Provenance": ", ".join(m.get("provenance") or []),
        "Blast Radius": int(m.get("blast_radius") or 0),
        "Endpoints": sum(len(br["endpoints"]) for br in (m.get("backend_routes") or [])),
        "Lineage Traced": "__YES__" if m.get("trace") else "__NO__",
    }
    pages.append({"properties": props, "content": content_md(mid, m)})

per = (len(pages) + SLICES - 1) // SLICES
total_kb = 0
for i in range(SLICES):
    sl = pages[i * per:(i + 1) * per]
    p = os.path.join(BATCH_DIR, f"slice_{i+1:02d}.json")
    with open(p, "w", encoding="utf-8") as f:
        json.dump(sl, f)
    kb = os.path.getsize(p) / 1024
    total_kb += kb
    print(f"slice_{i+1:02d}.json: {len(sl)} pages, {kb:,.0f} KB")
print(f"total: {len(pages)} pages, {total_kb:,.0f} KB")
