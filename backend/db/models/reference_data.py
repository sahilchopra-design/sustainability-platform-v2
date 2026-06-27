"""SQLAlchemy models for the public reference-data layer (migration 153).

Shared store for free authoritative datasets consumed by many modules.
See backend/scripts/ingest/ for the per-source ingesters.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime, timezone

from db.base import Base


class ReferenceDataSource(Base):
    __tablename__ = "reference_data_sources"

    id = Column(Integer, primary_key=True)
    source_key = Column(String(64), unique=True, nullable=False)
    name = Column(String(200))
    provider = Column(String(200))
    license = Column(String(200))
    url = Column(String(500))
    shape = Column(String(20))        # 'points' | 'records'
    cadence = Column(String(50))
    row_count = Column(Integer, default=0)
    last_ingested_at = Column(DateTime)
    status = Column(String(20), default="registered")
    meta = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    def as_dict(self):
        return {
            "source_key": self.source_key, "name": self.name, "provider": self.provider,
            "license": self.license, "url": self.url, "shape": self.shape,
            "cadence": self.cadence, "row_count": self.row_count,
            "last_ingested_at": self.last_ingested_at.isoformat() if self.last_ingested_at else None,
            "status": self.status, "meta": self.meta or {},
        }


class ReferenceDataPoint(Base):
    __tablename__ = "reference_data_points"

    id = Column(Integer, primary_key=True)
    source_key = Column(String(64), nullable=False, index=True)
    entity_code = Column(String(32), index=True)   # ISO3 / sector
    entity_name = Column(String(200))
    year = Column(Integer, index=True)
    metric = Column(String(80), index=True)
    value = Column(Float)
    unit = Column(String(40))
    meta = Column(JSON)

    def as_dict(self):
        return {
            "entity_code": self.entity_code, "entity_name": self.entity_name,
            "year": self.year, "metric": self.metric, "value": self.value, "unit": self.unit,
        }


class ReferenceDataRecord(Base):
    __tablename__ = "reference_data_records"

    id = Column(Integer, primary_key=True)
    source_key = Column(String(64), nullable=False, index=True)
    ref = Column(String(120), index=True)
    name = Column(String(400))
    category = Column(String(120))
    country = Column(String(120))
    payload = Column(JSON)

    def as_dict(self):
        return {
            "ref": self.ref, "name": self.name, "category": self.category,
            "country": self.country, **(self.payload or {}),
        }
