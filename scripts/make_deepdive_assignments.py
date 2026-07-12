"""Emit per-agent assignment files for the deep-dive authoring fleet.

Each assignment is a self-contained JSON work order: for every module it lists
the source files to read (feature dir / engine files / route files), the full
MODULE_GUIDES entry, and the mechanical evidence already extracted into
atlas.json — so an agent never needs to load the 5 MB atlas itself.

Usage: python scripts/make_deepdive_assignments.py <out_dir> [per_agent]
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = sys.argv[1]
PER_AGENT = int(sys.argv[2]) if len(sys.argv) > 2 else 16
os.makedirs(OUT_DIR, exist_ok=True)

atlas = json.load(open(os.path.join(ROOT, "docs", "module_atlas", "atlas.json"), encoding="utf-8"))
guides = json.load(open(os.path.join(ROOT, "docs", "module_atlas", "module_guides.json"), encoding="utf-8"))

DONE = {f[:-3] for f in os.listdir(os.path.join(ROOT, "docs", "module_atlas", "deep"))
        if f.endswith(".md")}

records = []
for mid, m in sorted(atlas.items()):
    safe = mid.replace("::", "__")
    if safe in DONE:
        continue
    rec = {
        "module_id": mid,
        "deep_file": f"docs/module_atlas/deep/{safe}.md",
        "title": m.get("title"),
        "route": m.get("route"),
        "tier": m.get("tier"),
        "source_files": [],
        "engines": [f"backend/services/{e}.py" for e in (m.get("engines") or [])[:4]],
        "route_files": [br["file"] for br in (m.get("backend_routes") or [])[:3]],
        "computed": (m.get("computed") or [])[:40],
        "seed_schemas": m.get("seed_schemas") or [],
        "trace_labels": [t.get("label") for t in (m.get("trace") or [])[:8]],
        "guide": guides.get(m.get("route", "")) or None,
    }
    if not mid.startswith("api::"):
        fdir = os.path.join("frontend", "src", "features", mid)
        if os.path.isdir(os.path.join(ROOT, fdir)):
            for dirpath, _d, fns in os.walk(os.path.join(ROOT, fdir)):
                for fn in fns:
                    if fn.endswith((".jsx", ".js")):
                        rel = os.path.relpath(os.path.join(dirpath, fn), ROOT)
                        rec["source_files"].append(rel.replace("\\", "/"))
    records.append(rec)

batches = [records[i:i + PER_AGENT] for i in range(0, len(records), PER_AGENT)]
for i, b in enumerate(batches, 1):
    with open(os.path.join(OUT_DIR, f"agent_{i:02d}.json"), "w", encoding="utf-8") as f:
        json.dump(b, f, indent=1)
print(f"remaining modules: {len(records)} -> {len(batches)} assignments of <= {PER_AGENT}")
