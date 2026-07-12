"""SQLAlchemy models for the module-nav backend (migration 154).

Backs the smarter-nav shell: pinned ("favorite") modules and recently-visited
modules, per user. See api/v1/routes/module_nav.py for the routes.
"""
from datetime import datetime, timezone

from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, UniqueConstraint

from db.base import Base


class UserModuleFavoritePG(Base):
    __tablename__ = "user_module_favorites"
    __table_args__ = (
        UniqueConstraint("user_id", "module_path", name="uq_user_module_favorites_user_path"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users_pg.user_id", ondelete="CASCADE"), nullable=False, index=True)
    module_path = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def as_dict(self):
        return {
            "module_path": self.module_path,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class UserModuleRecentPG(Base):
    __tablename__ = "user_module_recents"
    __table_args__ = (
        UniqueConstraint("user_id", "module_path", name="uq_user_module_recents_user_path"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users_pg.user_id", ondelete="CASCADE"), nullable=False, index=True)
    module_path = Column(String(255), nullable=False)
    visited_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def as_dict(self):
        return {
            "module_path": self.module_path,
            "visited_at": self.visited_at.isoformat() if self.visited_at else None,
        }
