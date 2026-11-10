# HARNESS: one backend (port 8145) for the Vue HITL / useInterrupt / sub-agents pages.
# The pages show agent modules only, never an app; each is mounted like the quickstart
# main.py (create_antigravity_app). agents/_common.py + _header_forwarding.py are copied
# from the showcase (via ../react/backend): the pages import agents._common but never publish it.
import os

from fastapi import FastAPI
from ag_ui_antigravity import AntigravityAgent, create_antigravity_app

from agents.hitl import hitl_in_chat_agent
from agents.subagents import subagents_agent

# --- Doc: /vue/google-antigravity/human-in-the-loop, step "pause a server tool" (verbatim) ---
from ag_ui_antigravity import experimental_interrupt

async def schedule_meeting(topic: str, attendee: str) -> str:
    """Books a meeting once the user picks a time."""
    answer = await experimental_interrupt(
        "schedule_meeting",
        message=f"Pick a time for {topic}",
        metadata={"topic": topic, "attendee": attendee},
    )
    if not answer.resolved:
        return f"Not scheduled ({answer.status})."
    return f"Scheduled for {answer.payload['chosen_label']}."
# --- end doc ---

# HARNESS: no agent wraps schedule_meeting on any page; quickstart AntigravityAgent + tools=[...].
interrupt_agent = AntigravityAgent(
    model="gemini-2.5-flash",
    api_key=os.environ["GEMINI_API_KEY"],
    system_instructions="When the user asks to schedule a meeting, call the `schedule_meeting` tool.",  # HARNESS: no prompt on the page
    tools=[schedule_meeting],
    workspaces=["/srv/agents/w1"],
)

app = FastAPI()
app.mount("/hitl", create_antigravity_app(hitl_in_chat_agent(), path="/"))
app.mount("/interrupt", create_antigravity_app(interrupt_agent, path="/"))
app.mount("/subagents", create_antigravity_app(subagents_agent(), path="/"))


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
