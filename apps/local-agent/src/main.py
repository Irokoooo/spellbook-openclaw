"""
main.py — SpellBook Local Agent entry point.

Usage:
    python src/main.py [--config path/to/config.toml]

The agent:
  1. Loads config.toml
  2. Connects to Supabase
  3. Starts heartbeat + task polling loops
  4. Gracefully shuts down on Ctrl+C
"""
import asyncio
import logging
import signal
import sys
from pathlib import Path

# Add src/ to path so imports work whether run from project root or src/
sys.path.insert(0, str(Path(__file__).parent))

from config import load_config
from supabase_client import get_client
from task_runner import TaskRunner

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("main")


async def main():
    import argparse

    parser = argparse.ArgumentParser(description="SpellBook Local Agent")
    parser.add_argument("--config", default="config.toml", help="Path to config.toml")
    args = parser.parse_args()

    cfg = load_config(args.config)

    # Use service_role key so queries bypass RLS (agent has no user session)
    supabase = get_client(cfg["supabase_url"], cfg.get("service_role_key") or cfg["supabase_anon_key"])
    agent_id = cfg["agent_id"]

    # Verify agent exists in database
    resp = supabase.table("agents").select("id, name").eq("id", agent_id).single().execute()
    if not resp.data:
        sys.exit(
            f"[ERROR] Agent '{agent_id}' not found in Supabase. "
            "Please register the Agent in SpellBook Settings first."
        )

    agent_name = resp.data["name"]
    logger.info("Starting SpellBook Agent: %s (%s)", agent_name, agent_id)

    runner = TaskRunner(supabase=supabase, agent_id=agent_id, cfg=cfg)

    # Graceful shutdown
    loop = asyncio.get_running_loop()

    def handle_signal():
        logger.info("Shutting down...")
        asyncio.create_task(runner.stop())

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, handle_signal)
        except (NotImplementedError, OSError):
            # Windows doesn't fully support add_signal_handler
            pass

    try:
        await runner.start()
    except KeyboardInterrupt:
        logger.info("Interrupted, shutting down...")
        await runner.stop()


if __name__ == "__main__":
    asyncio.run(main())
