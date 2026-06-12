"""
openclaw_wrapper.py — calls OpenClaw via `openclaw agent --local`.

JSON response shape (confirmed):
  { "payloads": [{ "text": "..." }], "meta": { ... } }
"""
import asyncio
import json
import logging

logger = logging.getLogger(__name__)


async def run_skill(
    openclaw_path: str,
    skill_name: str,
    prompt: str,
    input_data: dict,
    session_id: str | None = None,
) -> str:
    """
    Run a skill via `openclaw agent --local --json` and return the reply text.

    A stable session_id lets openclaw maintain conversation context per task.
    Pass None to let each call be stateless (new session each time).
    """
    user_lines = "\n".join(f"{k}: {v}" for k, v in input_data.items() if v)
    message = f"{prompt.strip()}\n\n---\n{user_lines}" if user_lines else prompt.strip()

    cmd = [openclaw_path, "agent", "--local", "--message", message, "--json"]
    if session_id:
        cmd += ["--session-id", session_id]

    logger.debug("openclaw agent --local --session-id %s", session_id)

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=300)
    except asyncio.TimeoutError:
        proc.kill()
        raise RuntimeError(f"OpenClaw timed out after 300s for skill '{skill_name}'")

    if proc.returncode != 0:
        err = stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(f"OpenClaw exited {proc.returncode}: {err}")

    raw = stdout.decode("utf-8", errors="replace").strip()

    try:
        data = json.loads(raw)
        # Confirmed shape: {"payloads": [{"text": "..."}], "meta": {...}}
        payloads = data.get("payloads") or []
        if payloads:
            return payloads[0].get("text", "") or "(no output)"
        # Fallback keys
        return data.get("reply") or data.get("text") or data.get("content") or raw
    except json.JSONDecodeError:
        return raw or "(no output)"
