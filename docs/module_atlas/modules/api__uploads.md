# Api::Uploads
**Module ID:** `api::uploads` · **Route:** `/uploads` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/uploads` | `upload_file` | api/v1/routes/uploads.py |
| GET | `/uploads/{upload_id}` | `get_upload_status` | api/v1/routes/uploads.py |
| GET | `/uploads/{upload_id}/preview` | `get_upload_preview` | api/v1/routes/uploads.py |
| PATCH | `/uploads/{upload_id}/mapping` | `update_mapping` | api/v1/routes/uploads.py |
| POST | `/uploads/{upload_id}/process` | `process_upload` | api/v1/routes/uploads.py |
| GET | `/uploads/{upload_id}/errors` | `get_validation_errors` | api/v1/routes/uploads.py |
| GET | `/uploads/templates` | `list_mapping_templates` | api/v1/routes/uploads.py |
| POST | `/uploads/templates` | `create_mapping_template` | api/v1/routes/uploads.py |

### 2.3 Engine `upload_service` (services/upload_service.py)
| Function | Args | Purpose |
|---|---|---|
| `UploadService.save_file` | file_content, filename, upload_id | Save uploaded file to disk |
| `UploadService.parse_file` | file_path, file_format | Parse uploaded file and return DataFrame. |
| `UploadService.auto_map_columns` | columns | Automatically map uploaded columns to standard fields using fuzzy matching. |
| `UploadService.apply_mapping` | df, mapping | Apply column mapping to DataFrame. |
| `UploadService.get_preview` | df, max_rows | Get preview of first N rows. |
| `UploadService.convert_to_holdings` | df | Convert DataFrame to list of holding dictionaries. |
| `UploadService.detect_duplicates` | df | Detect duplicate rows based on key fields. |
| `UploadService.calculate_statistics` | df | Calculate statistics for the uploaded data. |

### 2.3 Engine `validation_service` (services/validation_service.py)
| Function | Args | Purpose |
|---|---|---|
| `ValidationService.validate_row` | row, row_number | Validate a single row of data. |
| `ValidationService.validate_dataframe` | df | Validate entire DataFrame. |
| `ValidationService.validate_portfolio_level` | df | Perform portfolio-level validations. |
| `ValidationService.validate_lei_format` | lei | Validate LEI format. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `api` *(shared)*, `column`, `db` *(shared)*, `fastapi` *(shared)*, `filename`, `mapping`, `services` *(shared)*, `smaller`, `sqlalchemy` *(shared)*, `status`, `typing` *(shared)*, `workers` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /uploads/templates** — status `passed`, provenance ['db-empty'], source tables: `mapping_templates`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /uploads/{upload_id}** — status `failed`, provenance ['db-empty'], source tables: `file_uploads`
Output: `None`

**GET /uploads/{upload_id}/errors** — status `failed`, provenance ['db-empty'], source tables: `file_uploads`
Output: `None`

**GET /uploads/{upload_id}/preview** — status `failed`, provenance ['db-empty'], source tables: `file_uploads`
Output: `None`

**POST /uploads** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `validation_service` — extracted transformation lines:**
```python
row_errors = self.validate_row(row, idx + 1)
top_exposure_pct = (top_exposures.iloc[0] / total_exposure) * 100
sector_pct = (exposure / total_exposure) * 100
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).