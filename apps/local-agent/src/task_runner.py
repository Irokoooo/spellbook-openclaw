"""
task_runner.py — polls Supabase for queued tasks and executes them.
"""
import asyncio
import logging
import os
from datetime import datetime, timezone
from pathlib import Path

from supabase import Client
from croniter import croniter
import datetime

from openclaw_wrapper import run_skill

SKILL_NOTES_PATH = Path.home() / ".openclaw" / "workspace" / "SKILL_NOTES.md"

logger = logging.getLogger(__name__)


class TaskRunner:
    def __init__(self, supabase: Client, agent_id: str, cfg: dict):
        self.supabase = supabase
        self.agent_id = agent_id
        self.cfg = cfg
        self._running = False

    async def start(self):
        self._running = True
        await asyncio.gather(
            self._heartbeat_loop(),
            self._task_loop(),
            self._scheduler_loop(),
        )

    async def stop(self):
        self._running = False
        await self._set_status("offline")


    # ------------------------------------------------------------------ #
    # Scheduler
    # ------------------------------------------------------------------ #

    async def _scheduler_loop(self):
        interval = 60
        while self._running:
            try:
                await self._process_schedules()
            except Exception as exc:
                logger.warning('Scheduler error: ' + str(exc))
            await asyncio.sleep(interval)

    async def _process_schedules(self):
        response = self.supabase.table('schedules').select('*').eq('enabled', True).execute()
        schedules = response.data or []
        now = datetime.datetime.now()
        for sched in schedules:
            try:
                cron = croniter(sched['cron_expression'], now)
                last_run = sched.get('last_run_at')
                if last_run:
                    last_run_dt = datetime.datetime.fromisoformat(last_run.replace('Z', '+00:00')).replace(tzinfo=None)
                    if last_run_dt > now - datetime.timedelta(seconds=120):
                        continue
                self.supabase.table('tasks').insert({
                    'agent_id': self.agent_id,
                    'skill_id': sched.get('skill_id'),
                    'skill_name': sched.get('skill_name', ''),
                    'input': sched.get('input_template', {}),
                    'status': 'queued',
                }).execute()
                self.supabase.table('schedules').update({'last_run_at': now.isoformat()}).eq('id', sched['id']).execute()
                logger.info('Scheduler fired: ' + str(sched.get('name')))
            except Exception as exc:
                logger.warning('Schedule failed: ' + str(exc))

    # ------------------------------------------------------------------ #
    # Heartbeat
    # ------------------------------------------------------------------ #

    async def _heartbeat_loop(self):
        interval = self.cfg["heartbeat_interval"]
        while self._running:
            try:
                await self._set_status("online")
            except Exception as exc:
                logger.warning("Heartbeat failed: %s", exc)
            await asyncio.sleep(interval)

    async def _set_status(self, status: str):
        self.supabase.table("agents").update(
            {"status": status, "last_seen": datetime.now(timezone.utc).isoformat()}
        ).eq("id", self.agent_id).execute()

    # ------------------------------------------------------------------ #
    # Task polling
    # ------------------------------------------------------------------ #

    async def _task_loop(self):
        interval = self.cfg["poll_interval"]
        while self._running:
            try:
                await self._process_queued_tasks()
            except Exception as exc:
                logger.error("Task loop error: %s", exc)
            await asyncio.sleep(interval)

    async def _process_queued_tasks(self):
        response = (
            self.supabase.table("tasks")
            .select("*")
            .eq("agent_id", self.agent_id)
            .eq("status", "queued")
            .order("created_at")
            .limit(1)
            .execute()
        )

        tasks = response.data or []
        if not tasks:
            return

        task = tasks[0]
        await self._execute_task(task)

    async def _execute_task(self, task: dict):
        task_id = task["id"]
        logger.info("Executing task %s (%s)", task_id, task.get("skill_name"))

        # Mark running
        self.supabase.table("tasks").update(
            {"status": "running", "updated_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", task_id).execute()
        await self._set_status("busy")

        try:
            # Fetch skill prompt from Supabase
            prompt = ""
            skill_id = task.get("skill_id")
            if skill_id:
                skill_resp = (
                    self.supabase.table("skills")
                    .select("prompt")
                    .eq("id", skill_id)
                    .single()
                    .execute()
                )
                if skill_resp.data:
                    prompt = skill_resp.data.get("prompt", "")

            if not prompt:
                # Fallback: use skill_name as the prompt instruction
                prompt = f"请根据用户提供的信息完成以下任务：{task.get('skill_name', '')}"

            input_data = task.get("input") or {}

            output = await run_skill(
                openclaw_path=self.cfg["openclaw_path"],
                skill_name=task.get("skill_name", ""),
                prompt=prompt,
                input_data=input_data,
            )

            self.supabase.table("tasks").update(
                {
                    "status": "completed",
                    "output": output,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            ).eq("id", task_id).execute()

            logger.info("Task %s completed", task_id)
            await self._append_skill_note(task, success=True, detail=output)

        except Exception as exc:
            logger.error("Task %s failed: %s", task_id, exc)
            self.supabase.table("tasks").update(
                {
                    "status": "failed",
                    "error": str(exc),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            ).eq("id", task_id).execute()
            await self._append_skill_note(task, success=False, detail=str(exc))

        finally:
            await self._set_status("online")

    async def _append_skill_note(self, task: dict, success: bool, detail: str):
        """Append a one-line experience note so OpenClaw learns from history."""
        try:
            skill_name = task.get("skill_name") or "unknown"
            ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
            status_icon = "✅" if success else "❌"
            # Keep detail short — just first 200 chars
            snippet = detail.replace("\n", " ").strip()[:200]
            line = f"- {status_icon} [{ts}] **{skill_name}**: {snippet}\n"

            SKILL_NOTES_PATH.parent.mkdir(parents=True, exist_ok=True)
            if not SKILL_NOTES_PATH.exists():
                SKILL_NOTES_PATH.write_text(
                    "# SKILL_NOTES\n\n"
                    "龙虾自动记录的 Skill 执行经验，用于积累成功方法和规避已知坑。\n\n",
                    encoding="utf-8",
                )
            with SKILL_NOTES_PATH.open("a", encoding="utf-8") as f:
                f.write(line)
        except Exception as exc:
            logger.warning("Failed to write SKILL_NOTES.md: %s", exc)
