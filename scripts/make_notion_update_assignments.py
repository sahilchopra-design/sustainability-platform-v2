"""Build per-agent Notion update-page assignment files.

Reads the mid->page_id map + the notion_batches/slice_*.json payloads, joins them,
and splits into N files of {page_id, module_id, properties, content} for parallel
update-page (replace_content) pushes.

Usage: python scripts/make_notion_update_assignments.py <map_tsv> <out_dir> [per_agent]
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAP_TSV = sys.argv[1]
OUT_DIR = sys.argv[2]
PER_AGENT = int(sys.argv[3]) if len(sys.argv) > 3 else 30
os.makedirs(OUT_DIR, exist_ok=True)

mid_to_pid = {}
with open(MAP_TSV, encoding="utf-8") as f:
    for line in f:
        parts = line.rstrip("\n").split("\t")
        if len(parts) == 2:
            mid_to_pid[parts[0]] = parts[1]

BATCH_DIR = os.path.join(ROOT, "docs", "module_atlas", "notion_batches")
records = []
missing = []
for fn in sorted(os.listdir(BATCH_DIR)):
    if not fn.endswith(".json"):
        continue
    pages = json.load(open(os.path.join(BATCH_DIR, fn), encoding="utf-8"))
    for pg in pages:
        mid = pg["properties"]["Module ID"]
        pid = mid_to_pid.get(mid)
        if not pid:
            missing.append(mid)
            continue
        records.append({"page_id": pid, "module_id": mid,
                         "properties": pg["properties"], "content": pg["content"]})

print(f"records: {len(records)}  missing-page-id: {len(missing)}")
if missing:
    print("MISSING:", missing[:20])

batches = [records[i:i + PER_AGENT] for i in range(0, len(records), PER_AGENT)]
for i, b in enumerate(batches, 1):
    with open(os.path.join(OUT_DIR, f"update_{i:02d}.json"), "w", encoding="utf-8") as f:
        json.dump(b, f)
print(f"-> {len(batches)} update-assignment files of <= {PER_AGENT} in {OUT_DIR}")
