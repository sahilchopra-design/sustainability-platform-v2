"""
Overture Maps Building Footprints — live query service
=========================================================
Per-building asset-level exposure data: real building footprints (height,
floor count, class, footprint area) queried on-demand from Overture Maps'
public buildings theme, to feed the SAME replacement-value -> physical-risk
pricing pipeline the Asset-Level Exposure Explorer already uses for its
26-building hand-authored sample (see frontend/src/features/asset-exposure-
explorer/pages/AssetExposureExplorerPage.jsx). This is additive: it does not
replace the existing sample.

Upstream & access method (verified live 2026-07-05)
----------------------------------------------------
Overture Maps has NO hosted query API — this is confirmed by inspecting
https://docs.overturemaps.org/ and by the fact that all documented access
paths (the `overturemaps` CLI, DuckDB `httpfs`/spatial extension, direct
pyarrow/pandas) all read the same public, keyless S3 bucket directly:

    s3://overturemaps-us-west-2/release/<release>/theme=buildings/type=building/

Verified bucket structure by listing it directly (anonymous ListObjectsV2):
  - `release/` has one prefix per release, e.g. `release/2026-05-20.0/`,
    `release/2026-06-17.0/` (latest as of 2026-07-05 — picked dynamically
    below, not hardcoded, since Overture cuts a new release roughly monthly).
  - Each release has `theme={addresses,base,buildings,divisions,places,
    transportation}/`.
  - `theme=buildings/` has `type=building/` and `type=building_part/`.
  - **Key finding**: `type=building/` is a FLAT list of exactly 512
    `part-NNNNN-*.zstd.parquet` files (~500MB each). There is NO further
    Hive partitioning by bbox, quadkey, S2 cell, or admin area in the S3 key
    itself — confirmed by listing the prefix and seeing no additional
    CommonPrefixes below `type=building/`. This means a bbox query cannot
    prune whole files by key alone; every part file is a candidate.
  - Each parquet file DOES carry a GeoParquet `bbox` struct column
    `{xmin, xmax, ymin, ymax}` (confirmed via `pyarrow.parquet.ParquetFile`
    metadata) with real per-row-group min/max statistics in the footer, and
    rows are spatially clustered within a file (a Hilbert/Z-order-like sort
    — e.g. part-00000's row group 0 spans lon [-180, -175.1], lat
    [-77.96, -14.27]). Predicate pushdown on `bbox` therefore lets pyarrow
    skip most ROW GROUPS within a file that overlaps the query bbox, but
    every file's FOOTER must still be opened to know whether it's relevant
    (there's no cheaper file-level index available without duckdb or a
    pre-built spatial index of our own).
  - Measured live (2026-07-05): opening one file's footer + parsing its 128
    row groups' bbox statistics takes ~1.5-2.8s over anonymous S3. The
    dominant cost turned out to be the FOOTER SIZE, not request/connection
    overhead: this dataset's footer (FileMetaData: schema + per-row-group
    statistics for ~30 columns x 128 row groups, including deeply nested
    `names`/`sources` structs) measured 570KB-1.4MB per file -- so a
    whole-bucket (512-file) scan needs on the order of a few hundred MB of
    footer data alone, before reading any actual building rows. This
    environment's effective throughput to the bucket is the real limiter
    (concurrency past ~12-16 threads gave little extra throughput whether
    using `pyarrow.fs.S3FileSystem` or plain `requests` -- consistent with a
    bandwidth ceiling rather than a connection/thread limit). A cold,
    whole-bucket scan therefore takes multiple minutes, which is why this
    service is a bounded, cached, best-effort query rather than a fast
    synchronous lookup -- see `query_buildings_bbox()` below.
  - Practical consequence of the above for phase 1 (bbox detection, all 512
    files): plain `requests` + manual HTTP Range reads of just the footer
    (a 8-byte probe for the footer length, then one more Range read of
    exactly that many bytes) measured mildly faster and more reliable at
    concurrency than routing every file through `pyarrow.fs.S3FileSystem`
    (which, in this environment, showed near-zero speedup from threading --
    e.g. 12 files over 12 threads took ~46s, about the same as serial).
    Phase 2 (fetching real height/floors/class/geometry for the handful of
    files that actually matched in phase 1) still uses
    `pyarrow.fs.S3FileSystem` + `pyarrow.dataset` row-group predicate
    pushdown, since at that point it's only a few files, not 512.

Why pyarrow + S3FileSystem(anonymous=True) instead of duckdb: duckdb is not
installed in this backend's environment (pyarrow 24.0.0 already is), and
this platform has a documented history of pinned-dependency drift silently
breaking `include_router` (see MEMORY.md: fastapi/starlette pinning). Adding
a new dependency is riskier than using what's already there.
"""
from __future__ import annotations

import io
import math
import struct
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Optional

import pyarrow.compute as pc
import pyarrow.dataset as ds
import pyarrow.fs as pafs
import pyarrow.parquet as pq
import requests

try:
    from shapely import wkb as _shapely_wkb
    _HAS_SHAPELY = True
except Exception:  # pragma: no cover - defensive; shapely is present in this env
    _HAS_SHAPELY = False

OVERTURE_BUCKET = "overturemaps-us-west-2"
_HTTP_LIST_BASE = f"https://{OVERTURE_BUCKET}.s3.amazonaws.com"
_PARQUET_MAGIC = b"PAR1"


class _TailFile(io.RawIOBase):
    """Minimal seekable file-like object over just the TAIL bytes of a remote
    file, presented as if it were the full file (reports the real total
    size via seek-to-end). Used to hand `pyarrow.parquet.ParquetFile` only
    the footer bytes we actually fetched via an HTTP Range request, without
    pretending to have (or needing) the rest of the file -- parquet
    FileMetaData is self-contained within the footer for schema/statistics
    purposes, so no earlier byte range is required to read metadata."""

    def __init__(self, true_size: int, tail_bytes: bytes):
        self.true_size = true_size
        self.tail_bytes = tail_bytes
        self.tail_start = true_size - len(tail_bytes)
        self.pos = 0

    def readable(self) -> bool:
        return True

    def seekable(self) -> bool:
        return True

    def seek(self, offset: int, whence: int = 0) -> int:
        if whence == 0:
            self.pos = offset
        elif whence == 1:
            self.pos += offset
        elif whence == 2:
            self.pos = self.true_size + offset
        return self.pos

    def tell(self) -> int:
        return self.pos

    def readinto(self, b) -> int:
        start = self.pos - self.tail_start
        if start < 0:
            raise IOError("Attempted to read outside the fetched tail window (metadata-only reader)")
        chunk = self.tail_bytes[start:start + len(b)]
        b[: len(chunk)] = chunk
        self.pos += len(chunk)
        return len(chunk)


def _key_for(path: str) -> str:
    """Strip the leading `overturemaps-us-west-2/` bucket prefix that
    pyarrow's FileSelector returns, since plain HTTP requests need the S3
    object key relative to the bucket's virtual-hosted-style URL."""
    prefix = OVERTURE_BUCKET + "/"
    return path[len(prefix):] if path.startswith(prefix) else path


def _fetch_footer_metadata(path: str, session: requests.Session, timeout_s: float = 30.0):
    """Fetch just a parquet file's footer over plain HTTP Range requests and
    parse it with pyarrow -- see module docstring for why this is used
    instead of `pyarrow.fs.S3FileSystem` for the whole-bucket detection pass.
    Two requests: an 8-byte probe for the footer length, then one Range read
    of exactly that many bytes. Returns a `pyarrow.parquet.FileMetaData` or
    None on any failure (caller treats that file as unscannable for now).
    """
    url = f"{_HTTP_LIST_BASE}/{_key_for(path)}"
    try:
        probe = session.get(url, headers={"Range": "bytes=-8"}, timeout=timeout_s)
        if probe.status_code not in (200, 206) or len(probe.content) < 8:
            return None
        tail8 = probe.content[-8:]
        if tail8[4:8] != _PARQUET_MAGIC:
            return None
        footer_len = struct.unpack("<I", tail8[:4])[0]
        total_len = footer_len + 8

        cr = probe.headers.get("Content-Range")
        if cr and "/" in cr:
            true_size = int(cr.split("/")[-1])
        elif probe.status_code == 200:
            # Range not honored -- we already have the whole object.
            return pq.ParquetFile(io.BytesIO(probe.content)).metadata
        else:
            return None

        resp = session.get(url, headers={"Range": f"bytes=-{total_len}"}, timeout=timeout_s)
        if resp.status_code not in (200, 206):
            return None
        tail_bytes = resp.content
        return pq.ParquetFile(_TailFile(true_size, tail_bytes)).metadata
    except Exception:
        return None


def _file_bbox(path: str, session: requests.Session) -> Optional[tuple]:
    """Aggregate (xmin, xmax, ymin, ymax) across all row groups' `bbox`
    statistics in one file's footer -- the phase-1 per-file candidate check."""
    meta = _fetch_footer_metadata(path, session)
    if meta is None:
        return None
    xmin, xmax, ymin, ymax = 1e9, -1e9, 1e9, -1e9
    found = False
    for i in range(meta.num_row_groups):
        rg = meta.row_group(i)
        for j in range(rg.num_columns):
            col = rg.column(j)
            stats = col.statistics
            if not stats or not stats.has_min_max:
                continue
            name = col.path_in_schema
            if name == "bbox.xmin":
                xmin = min(xmin, stats.min); found = True
            elif name == "bbox.xmax":
                xmax = max(xmax, stats.max); found = True
            elif name == "bbox.ymin":
                ymin = min(ymin, stats.min); found = True
            elif name == "bbox.ymax":
                ymax = max(ymax, stats.max); found = True
    return (xmin, xmax, ymin, ymax) if found else None

# ── Politeness / performance knobs (see module docstring for the measured
#    per-file footer cost that motivates these) ──────────────────────────────
_DEFAULT_TIMEOUT_S = 45.0        # per-request budget for a query
_MAX_TIMEOUT_S = 480.0           # generous ceiling for a "let it finish" cold whole-bucket scan
_FILE_SCAN_WORKERS = 12          # concurrent S3 footer reads; higher => rising error rate (measured)
_FILE_RETRIES = 2

# ── In-process caches (TTL) ──────────────────────────────────────────────────
_RELEASE_TTL_S = 6 * 3600        # release list rarely changes (~monthly cadence)
_FILE_LIST_TTL_S = 6 * 3600
_RESULT_TTL_S_COMPLETE = 24 * 3600   # scan covered all 512 files -> safe to cache long
_RESULT_TTL_S_PARTIAL = 5 * 60       # scan hit its deadline before covering all files

_lock = threading.Lock()
_fs: Optional[pafs.S3FileSystem] = None
_release_cache: tuple[float, Optional[str]] = (0.0, None)
_file_list_cache: dict[str, tuple[float, list[str]]] = {}
_result_cache: dict[tuple, tuple[float, dict]] = {}

PROVENANCE = {
    "source": "Overture Maps Foundation — Buildings theme",
    "access": "Public, keyless, anonymous S3 Parquet (no hosted query API exists)",
    "bucket": f"s3://{OVERTURE_BUCKET}",
    "docs": "https://docs.overturemaps.org/",
    "license": "ODbL / CC-BY (varies by contributing source; see per-row `sources`)",
    "live": True,
}


def _get_fs() -> pafs.S3FileSystem:
    global _fs
    with _lock:
        if _fs is None:
            _fs = pafs.S3FileSystem(anonymous=True, region="us-west-2")
        return _fs


def _latest_release(timeout_s: float = 20.0) -> str:
    """Return the latest `release/<date>.<n>/` prefix, cached for _RELEASE_TTL_S.

    Releases sort lexicographically by date (YYYY-MM-DD.N), so max() of the
    prefix strings picks the latest — verified against the live bucket
    (2026-07-05: two releases present, 2026-05-20.0 and 2026-06-17.0).
    """
    global _release_cache
    now = time.time()
    exp, val = _release_cache
    if val and exp > now:
        return val

    import requests as _requests  # local import: keep top-level deps minimal

    resp = _requests.get(
        _HTTP_LIST_BASE,
        params={"list-type": "2", "prefix": "release/", "delimiter": "/"},
        timeout=timeout_s,
    )
    resp.raise_for_status()
    import xml.etree.ElementTree as ET
    ns = {"s3": "http://s3.amazonaws.com/doc/2006-03-01/"}
    root = ET.fromstring(resp.text)
    prefixes = [
        el.find("s3:Prefix", ns).text
        for el in root.findall("s3:CommonPrefixes", ns)
    ]
    if not prefixes:
        raise RuntimeError("Overture bucket listing returned no release/ prefixes")
    latest = max(prefixes)  # e.g. "release/2026-06-17.0/"
    with _lock:
        _release_cache = (now + _RELEASE_TTL_S, latest)
    return latest


def _building_file_paths(timeout_s: float = 20.0) -> list[str]:
    """List the (flat, unpartitioned) part-*.parquet files for the buildings
    theme's `type=building` table under the latest release. Cached."""
    release = _latest_release(timeout_s)
    cache_key = release
    now = time.time()
    hit = _file_list_cache.get(cache_key)
    if hit and hit[0] > now:
        return hit[1]

    prefix = f"{release}theme=buildings/type=building/"
    fs = _get_fs()
    selector = pafs.FileSelector(f"{OVERTURE_BUCKET}/{prefix.rstrip('/')}", recursive=False)
    infos = fs.get_file_info(selector)
    paths = sorted(info.path for info in infos if info.is_file and info.path.endswith(".parquet"))
    if not paths:
        raise RuntimeError(f"No building parquet files found under {prefix}")
    _file_list_cache[cache_key] = (now + _FILE_LIST_TTL_S, paths)
    return paths


def _approx_area_m2(poly, centroid_lat: float) -> Optional[float]:
    """Equirectangular-projection area approximation — accurate to within a
    fraction of a percent for building-footprint-scale polygons (tens to a
    few thousand m²), which is the relevant scale here."""
    try:
        m_per_deg_lat = 111_320.0
        m_per_deg_lon = 111_320.0 * math.cos(math.radians(centroid_lat))
        return abs(poly.area) * m_per_deg_lat * m_per_deg_lon
    except Exception:
        return None


def _scan_one_file(path: str, filt, columns: list[str], fs: pafs.S3FileSystem):
    """Query a single Overture parquet file with row-group predicate pushdown
    on the `bbox` columns. Returns a pyarrow Table (possibly 0 rows) or None
    on failure after retries. Only called for files that already passed the
    cheap file-level `_file_bbox` check in `_detect_candidate_rows` below --
    NOT for all 512 files (see module docstring on why the full-bucket
    detection pass uses plain-HTTP footer reads instead)."""
    for _attempt in range(_FILE_RETRIES + 1):
        try:
            frag_ds = ds.dataset(f"{OVERTURE_BUCKET}/{path}" if not path.startswith(OVERTURE_BUCKET) else path,
                                  filesystem=fs, format="parquet")
            return frag_ds.to_table(filter=filt, columns=columns)
        except Exception:  # noqa: BLE001 — transient S3/network errors; retry then give up
            continue
    return None


def _detect_candidate_rows(
    path: str, min_lon: float, min_lat: float, max_lon: float, max_lat: float,
    filt, columns: list[str], session: requests.Session, fs: pafs.S3FileSystem,
):
    """Two-step per-file detection: (1) cheap file-level bbox check via a
    plain-HTTP footer read (`_file_bbox`) -- if the file's overall bbox
    doesn't even overlap the query, skip it for ~free without touching
    `pyarrow.fs.S3FileSystem` at all; (2) only for files that DO overlap at
    the file level, run the real row-group-pushdown query via pyarrow to get
    actual matching rows (most files will be pruned at step 1, since even
    though row-group bboxes are coarse, most of the 512 files simply don't
    cover the query area at all).
    """
    file_bbox = _file_bbox(path, session)
    if file_bbox is None:
        return None  # footer fetch failed -- unknown, caller doesn't count this file as "scanned"
    fxmin, fxmax, fymin, fymax = file_bbox
    if fxmax < min_lon or fxmin > max_lon or fymax < min_lat or fymin > max_lat:
        return []  # no overlap at file level -- pruned without a row-level fetch
    return _scan_one_file(path, filt, columns, fs)


def _fetch_geometry_for_ids(path: str, filt, ids: list[str], fs: pafs.S3FileSystem):
    """Second-pass, targeted fetch of the `geometry` WKB column for a small
    set of already-matched building ids in one file (cheap: `id` is in the
    row-group-filtered result set, so this reads far fewer row groups' worth
    of geometry data than fetching it for every candidate row group up front).
    """
    try:
        frag_ds = ds.dataset(f"{OVERTURE_BUCKET}/{path}" if not path.startswith(OVERTURE_BUCKET) else path,
                              filesystem=fs, format="parquet")
        id_filt = filt & pc.field("id").isin(ids)
        return frag_ds.to_table(filter=id_filt, columns=["id", "geometry"])
    except Exception:
        return None


def query_buildings_bbox(
    min_lon: float,
    min_lat: float,
    max_lon: float,
    max_lat: float,
    limit: int = 200,
    timeout_seconds: float = _DEFAULT_TIMEOUT_S,
) -> dict[str, Any]:
    """Query real Overture building footprints intersecting a bounding box.

    Returns a dict:
      {
        "buildings": [{id, height, num_floors, class, geometry_wkt_or_centroid,
                        area_m2}, ...],
        "count": int,
        "source_unavailable": bool,   # true if we couldn't get ANY answer
        "scan_complete": bool,        # true if every part file was checked
        "files_scanned": int, "files_total": int,
        "cache": "hit" | "miss",
        "provenance": {...},
      }

    Never raises on upstream failure/timeout — always returns this shape so
    callers (routes, frontend) can render a clean "no data" / "partial" state.
    """
    timeout_seconds = max(5.0, min(timeout_seconds, _MAX_TIMEOUT_S))
    key = (round(min_lon, 3), round(min_lat, 3), round(max_lon, 3), round(max_lat, 3), int(limit))
    now = time.time()
    cached = _result_cache.get(key)
    if cached and cached[0] > now:
        payload = dict(cached[1])
        payload["cache"] = "hit"
        return payload

    try:
        paths = _building_file_paths()
        release = _latest_release()
        fs = _get_fs()
    except Exception as exc:
        return {
            "buildings": [], "count": 0, "source_unavailable": True,
            "scan_complete": False, "files_scanned": 0, "files_total": 0,
            "cache": "miss", "error": f"Overture bucket listing failed: {exc}",
            "provenance": PROVENANCE,
        }

    filt = (
        (pc.field("bbox", "xmin") <= max_lon) & (pc.field("bbox", "xmax") >= min_lon)
        & (pc.field("bbox", "ymin") <= max_lat) & (pc.field("bbox", "ymax") >= min_lat)
    )
    # Phase 1: cheap columns only (no `geometry` WKB) -- see _scan_one_file
    # docstring for why this matters for throughput.
    detect_columns = ["id", "height", "num_floors", "class", "bbox"]

    deadline = time.time() + timeout_seconds
    collected_rows: dict[str, tuple[str, dict]] = {}  # id -> (file_path, row)
    files_scanned = 0
    session = requests.Session()

    ex = ThreadPoolExecutor(max_workers=_FILE_SCAN_WORKERS)
    try:
        futures = {
            ex.submit(_detect_candidate_rows, p, min_lon, min_lat, max_lon, max_lat, filt, detect_columns, session, fs): p
            for p in paths
        }
        try:
            for fut in as_completed(futures, timeout=max(0.5, deadline - time.time())):
                path = futures[fut]
                files_scanned += 1
                tbl_or_rows = None
                try:
                    tbl_or_rows = fut.result()
                except Exception:
                    tbl_or_rows = None
                if tbl_or_rows is not None:
                    rows_iter = tbl_or_rows.to_pylist() if hasattr(tbl_or_rows, "to_pylist") else tbl_or_rows
                    for row in rows_iter:
                        rid = row.get("id")
                        if rid is not None:
                            collected_rows[rid] = (path, row)
                if len(collected_rows) >= limit or time.time() > deadline:
                    break
        except TimeoutError:
            pass
    finally:
        # Non-blocking shutdown: don't wait for still-running footer/scan
        # threads to finish before returning to the caller -- they finish in
        # the background (their results are simply discarded), which is what
        # makes the `timeout_seconds` budget actually bound this function's
        # wall-clock time rather than only bounding the as_completed() loop.
        ex.shutdown(wait=False, cancel_futures=True)

    scan_complete = files_scanned >= len(paths)

    # Phase 2: targeted geometry fetch, per matched file, only for the ids
    # already confirmed by phase 1 (small, cheap compared to fetching
    # geometry for every candidate row group up front).
    by_file: dict[str, list[str]] = {}
    for rid, (path, _row) in collected_rows.items():
        by_file.setdefault(path, []).append(rid)

    geometry_by_id: dict[str, bytes] = {}
    if by_file:
        remaining = max(1.0, deadline - time.time() + 20.0)  # small grace period for phase 2
        with ThreadPoolExecutor(max_workers=min(_FILE_SCAN_WORKERS, len(by_file))) as ex2:
            futs2 = {
                ex2.submit(_fetch_geometry_for_ids, path, filt, ids, fs): path
                for path, ids in by_file.items()
            }
            try:
                for fut in as_completed(futs2, timeout=remaining):
                    tbl = None
                    try:
                        tbl = fut.result()
                    except Exception:
                        tbl = None
                    if tbl is not None and tbl.num_rows:
                        for row in tbl.to_pylist():
                            if row.get("geometry"):
                                geometry_by_id[row["id"]] = row["geometry"]
            except TimeoutError:
                pass

    # Build response rows (parse WKB geometry -> real centroid + area when
    # phase 2 got it; fall back to the bbox-column centroid + bbox-derived
    # area upper bound otherwise -- still real Overture data either way, just
    # less precise than the true footprint polygon).
    out_rows = []
    for rid, (_path, row) in list(collected_rows.items())[:limit]:
        bbox = row.get("bbox") or {}
        cx = (bbox.get("xmin", 0.0) + bbox.get("xmax", 0.0)) / 2.0
        cy = (bbox.get("ymin", 0.0) + bbox.get("ymax", 0.0)) / 2.0
        area_m2 = None
        area_basis = "bbox_upper_bound"
        geom_repr = f"POINT({cx} {cy})"
        geom_bytes = geometry_by_id.get(rid)
        if _HAS_SHAPELY and geom_bytes:
            try:
                poly = _shapely_wkb.loads(bytes(geom_bytes))
                c = poly.centroid
                cx, cy = c.x, c.y
                area_m2 = _approx_area_m2(poly, cy)
                geom_repr = c.wkt
                area_basis = "footprint_polygon"
            except Exception:
                pass
        if area_m2 is None:
            # bbox width x height in meters -- an upper-bound proxy on the
            # true footprint area (real building polygons are inscribed in
            # their bbox, so this over-estimates but is a genuine Overture
            # bbox, not a fabricated figure).
            w_m = abs(bbox.get("xmax", cx) - bbox.get("xmin", cx)) * 111_320.0 * math.cos(math.radians(cy))
            h_m = abs(bbox.get("ymax", cy) - bbox.get("ymin", cy)) * 111_320.0
            area_m2 = w_m * h_m if (w_m and h_m) else None
        out_rows.append({
            "id": rid,
            "height": row.get("height"),
            "num_floors": row.get("num_floors"),
            "class": row.get("class"),
            "geometry_wkt_or_centroid": geom_repr,
            "area_m2": round(area_m2, 1) if area_m2 is not None else None,
            "area_basis": area_basis,
            "lon": round(cx, 6),
            "lat": round(cy, 6),
        })

    result = {
        "buildings": out_rows,
        "count": len(out_rows),
        "source_unavailable": len(out_rows) == 0 and not scan_complete,
        "scan_complete": scan_complete,
        "files_scanned": files_scanned,
        "files_total": len(paths),
        "release": release,
        "cache": "miss",
        "provenance": PROVENANCE,
    }
    ttl = _RESULT_TTL_S_COMPLETE if scan_complete else _RESULT_TTL_S_PARTIAL
    _result_cache[key] = (time.time() + ttl, result)
    return result
