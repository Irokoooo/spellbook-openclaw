"""
config.py — loads config.toml, validates required fields.
"""
import sys
from pathlib import Path

try:
    import tomllib  # Python 3.11+
except ImportError:
    import tomli as tomllib  # pip install tomli


def load_config(path: str = "config.toml") -> dict:
    cfg_path = Path(path)
    if not cfg_path.exists():
        example = cfg_path.with_suffix(".toml.example")
        sys.exit(
            f"[ERROR] config.toml not found. Copy {example} to config.toml and fill in your values."
        )

    with open(cfg_path, "rb") as f:
        cfg = tomllib.load(f)

    required = ["supabase_url", "agent_id"]
    for key in required:
        if not cfg.get(key) or cfg[key].startswith("your-"):
            sys.exit(f"[ERROR] Please set '{key}' in config.toml")

    # service_role_key bypasses RLS so the agent can read/write its own rows.
    # Fall back to anon key for backwards compat but warn the user.
    if not cfg.get("service_role_key"):
        if not cfg.get("supabase_anon_key"):
            sys.exit("[ERROR] Please set 'service_role_key' in config.toml")
        import logging
        logging.getLogger("config").warning(
            "service_role_key not set — falling back to anon key (RLS may block agent queries)"
        )

    cfg.setdefault("heartbeat_interval", 30)
    cfg.setdefault("poll_interval", 5)
    cfg.setdefault("openclaw_path", "openclaw")
    cfg.setdefault("local_db_path", "./data/db.sqlite")

    return cfg
