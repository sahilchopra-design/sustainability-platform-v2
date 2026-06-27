"""SQLAlchemy model for the real-estate-carbon-analytics module (table ep_recarb1_properties)."""
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime, timezone

from db.base import Base


class RealEstateCarbonAnalyticsProperty(Base):
    __tablename__ = "ep_recarb1_properties"

    id = Column(Integer, primary_key=True)
    ref = Column(String, unique=True)          # business key for idempotent seed
    name = Column(String)
    category = Column(String)
    value = Column(Float)
    payload = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    def as_dict(self):
        return {
            "id": self.id, "ref": self.ref, "name": self.name,
            "category": self.category, "value": self.value,
            **(self.payload or {}),
        }


# >>> REMEMBER: register this model in backend/db/base.py:init_db():
#     from db.models.real_estate_carbon_analytics import RealEstateCarbonAnalyticsProperty  # noqa: F401
