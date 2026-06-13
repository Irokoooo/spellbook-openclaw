"""
openclaw_wrapper.py — calls OpenClaw via `openclaw agent --local`.
"""
import asyncio
import json
import logging
import subprocess
import sys

logger = logging.getLogger(__name__)


async def run_skill(
    openclaw_path: str,
    skill_name: str,
    prompt: str,
    input_data: dict,
    session_id: str | None = None,
) -> str:
    """Run a skill via `openclaw agent --local --json` and return the reply text."""
    user_lines = "\n".join(f"{k}: {v}" for k, v in input_data.items() if v)
    message = f"{prompt.strip()}\n\n---\n{user_lines}" if user_lines else prompt.strip()

    if not session_id:
        import hashlib
        session_id = 'skill-' + hashlib.md5(skill_name.encode()).hexdigest()[:16]

    cmd = [openclaw_path, "agent", "--local", "--session-id", session_id, "--json", "--message", message]
    logger.debug("Running: %s", cmd)

    # Use run_in_executor + subprocess.run instead of create_subprocess_exec
    # because create_subprocess_exec has quoting issues with .cmd files on Windows
    loop = asyncio.get_event_loop()

    try:
        result = await loop.run_in_executor(
            None,
            lambda: subprocess.run(cmd, capture_output=True, timeout=300),
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"OpenClaw timed out after 300s for skill '{skill_name}'")
    except FileNotFoundError:
        raise RuntimeError(f"OpenClaw executable not found: {openclaw_path}")

    if result.returncode != 0:
        err = result.stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(f"OpenClaw exited {result.returncode}: {err}")

    raw = result.stdout.decode("utf-8", errors="replace").strip()

    try:
        data = json.loads(raw)
        payloads = data.get("payloads") or []
        if payloads:
            return payloads[0].get("text", "") or "(no output)"
        return data.get("reply") or data.get("text") or data.get("content") or raw
    except json.JSONDecodeError:
        return raw or "(no output)"
