import re
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "data" / "profiles.db"
PROFILE_FIELDS = ("partner_name", "partner_short", "address", "partner_ceo", "partner_md1", "partner_md2", "borg_number")
ROLE_LABELS = {"lead": "Lead Partner", "first": "First Partner", "second": "Second Partner"}


def _connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    with _connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS partner_profiles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                identifier TEXT NOT NULL DEFAULT '',
                identifier_type TEXT NOT NULL DEFAULT 'direct',
                borg_number TEXT NOT NULL DEFAULT '',
                partner_name TEXT NOT NULL DEFAULT '',
                partner_short TEXT NOT NULL DEFAULT '',
                address TEXT NOT NULL DEFAULT '',
                partner_ceo TEXT NOT NULL DEFAULT '',
                partner_md1 TEXT NOT NULL DEFAULT '',
                partner_md2 TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        columns = {row[1] for row in connection.execute("PRAGMA table_info(partner_profiles)")}
        for name, definition in (("identifier", "TEXT NOT NULL DEFAULT ''"), ("identifier_type", "TEXT NOT NULL DEFAULT 'direct'"), ("borg_number", "TEXT NOT NULL DEFAULT ''")):
            if name not in columns:
                connection.execute(f"ALTER TABLE partner_profiles ADD COLUMN {name} {definition}")
        connection.execute("CREATE INDEX IF NOT EXISTS idx_partner_profiles_identifier ON partner_profiles(identifier)")
        connection.commit()


def list_profiles():
    init_db()
    with _connection() as connection:
        rows = connection.execute("SELECT * FROM partner_profiles ORDER BY updated_at DESC, name ASC").fetchall()
    return [dict(row) for row in rows]


def create_profile(name, role, identifier, identifier_type, values):
    name = (name or "").strip()
    role = (role or "").strip().lower()
    identifier = (identifier or "").strip()
    identifier_type = (identifier_type or "direct").strip().lower()
    if not name:
        raise ValueError("Profile name is required.")
    if role not in ROLE_LABELS:
        raise ValueError("Profile role is invalid.")
    if not identifier:
        raise ValueError("Enter a Gmail address or direct profile ID.")
    if identifier_type == "gmail" and not re.fullmatch(r"[A-Za-z0-9._%+-]+@gmail\.com", identifier, re.IGNORECASE):
        raise ValueError("Enter a valid Gmail address ending in @gmail.com.")
    if identifier_type not in {"gmail", "direct"}:
        raise ValueError("Profile identifier type is invalid.")
    now = datetime.now().isoformat(timespec="seconds")
    profile_id = uuid.uuid4().hex[:12]
    payload = {field: str(values.get(field, "") or "").strip() for field in PROFILE_FIELDS}
    try:
        with _connection() as connection:
            connection.execute(
                """INSERT INTO partner_profiles
                   (id, name, role, identifier, identifier_type, borg_number, partner_name, partner_short, address, partner_ceo, partner_md1, partner_md2, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (profile_id, name, role, identifier, identifier_type, payload["borg_number"], payload["partner_name"], payload["partner_short"], payload["address"],
                 payload["partner_ceo"], payload["partner_md1"], payload["partner_md2"], now, now),
            )
            connection.commit()
    except sqlite3.IntegrityError as exc:
        raise ValueError("That profile ID is already in use. Choose another one.") from exc
    return get_profile(profile_id)


def get_profile(profile_id):
    init_db()
    with _connection() as connection:
        row = connection.execute("SELECT * FROM partner_profiles WHERE id = ?", (profile_id,)).fetchone()
    return dict(row) if row else None


def find_profile_by_identifier(identifier):
    init_db()
    with _connection() as connection:
        row = connection.execute("SELECT * FROM partner_profiles WHERE lower(identifier) = lower(?)", ((identifier or "").strip(),)).fetchone()
    return dict(row) if row else None


def delete_profile(profile_id):
    init_db()
    with _connection() as connection:
        cursor = connection.execute("DELETE FROM partner_profiles WHERE id = ?", (profile_id,))
        connection.commit()
    return cursor.rowcount > 0
