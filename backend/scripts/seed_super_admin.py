"""
Seed the founder's super admin account.

Usage:
    python scripts/seed_super_admin.py --email admin@example.com --password s3cur3 --name "Sahil Chopra"

If the user already exists the password and name are updated and the
RbacUserProfilePG is upserted to rbac_role='super_admin', is_active=True,
no expiry.
"""

import argparse
import sys
import os

# Allow running from the repo root or from the scripts/ directory
_HERE = os.path.dirname(os.path.abspath(__file__))
_BACKEND = os.path.dirname(_HERE)
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

import bcrypt
from db.postgres import SessionLocal
from db.models.portfolio_pg import UserPG
from db.models.rbac import RbacUserProfilePG
from datetime import datetime, timezone


def _hash_pw(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def seed(email: str, password: str, name: str) -> None:
    db = SessionLocal()
    try:
        # ── Upsert user ───────────────────────────────────────────────────────
        user = db.query(UserPG).filter(UserPG.email == email).first()
        if user:
            print(f"[INFO] User {email} already exists — updating name/password.")
            user.name = name
            user.password_hash = _hash_pw(password)
            user.is_active = True
        else:
            user = UserPG(
                user_id="user_superadmin",
                email=email,
                name=name,
                password_hash=_hash_pw(password),
                is_active=True,
            )
            db.add(user)
            db.flush()   # get user_id into session before profile FK
            print(f"[INFO] Created user {email} with user_id=user_superadmin")

        # ── Upsert RBAC profile ───────────────────────────────────────────────
        profile = db.query(RbacUserProfilePG).filter(
            RbacUserProfilePG.user_id == user.user_id
        ).first()

        if profile:
            print("[INFO] RBAC profile exists — promoting to super_admin.")
            profile.rbac_role = "super_admin"
            profile.is_active = True
            profile.access_expires_at = None
            profile.access_duration_days = None
            profile.updated_at = datetime.now(timezone.utc)
            profile.updated_by = "seed_script"
        else:
            profile = RbacUserProfilePG(
                user_id=user.user_id,
                rbac_role="super_admin",
                is_active=True,
                access_expires_at=None,
                created_by="seed_script",
                updated_by="seed_script",
            )
            db.add(profile)
            print("[INFO] Created RbacUserProfilePG with rbac_role=super_admin, no expiry.")

        db.commit()
        print(f"[OK] Super admin seeded: {email}")
    except Exception as exc:
        db.rollback()
        print(f"[ERROR] {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Seed founder super admin account")
    parser.add_argument("--email", required=True, help="Admin email address")
    parser.add_argument("--password", required=True, help="Admin password (min 8 chars)")
    parser.add_argument("--name", default="Sahil Chopra", help="Display name")
    args = parser.parse_args()

    if len(args.password) < 6:
        print("[ERROR] Password must be at least 6 characters.", file=sys.stderr)
        sys.exit(1)

    seed(args.email, args.password, args.name)


if __name__ == "__main__":
    main()
