# Platform Module Navigator
**Module ID:** `module-navigator` · **Route:** `/module-navigator` · **Tier:** B (frontend-computed) · **EP code:** EP-NAV · **Sprint:** Platform

## 1 · Overview
Comprehensive navigation and discovery hub for all 745 platform modules, with full-text search, domain/sprint/status filtering, guided mode previews, recently viewed history, bookmarks, module dependency mapping, and related module recommendations. Acts as the central entry point for platform users discovering analytical capabilities.

> **Business value:** Used by all platform users — from first-time onboarders to power analysts — to discover relevant analytical modules, understand platform capabilities, and efficiently navigate the 745-module ecosystem.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CompactTile`, `GridCard`, `GroupHeader`, `ItemGrid`, `ListRow`, `SPRINT_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `prefixes` | `Object.keys(SPRINT_COLORS).sort((a,b) => b.length - a.length);` |
| `badges` | `(item.badge\|\|'').split('·').map(s=>s.trim()).filter(Boolean);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`
**Shared context buses:** `AuthContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Module Coverage | `COUNT(routed_modules)` | App.js route registry | Full platform scope across 93+ domains; filtered by status (live/beta/planned) for production navigation. |
| Search Relevance Score | `BM25_score × semantic_similarity` | Module metadata corpus | Score >0.7 indicates strong match; used to rank top-10 results in search and recommendations. |
| Module Dependency Depth | `max_shortest_path_length in dependency DAG` | Module dependency graph | Deep dependency chains (>3 hops) indicate integration complexity; shown to users before enabling a module work |
- **App.js route registry + module metadata store → searchable index** → BM25 + semantic retrieval → dependency graph traversal → recommendations → **Personalised module discovery experience with dependency-aware navigation**

## 5 · Intermediate Transformation Logic
**Methodology:** Module Discovery & Dependency Mapping
**Headline formula:** `relevance_score = semantic_similarity(query, module_description) × status_weight × domain_weight`
**Standards:** ['Platform module registry', 'Neo4j graph traversal (dependency DAG)', 'BM25 full-text retrieval']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).