# HARNESS: Vue shared-state pages backend (port 8144). Doc snippets are verbatim; imports, the
# AntigravityAgent construction (stands in for the doc's undefined build()) and the endpoint
# mounting are harness. Copied (not imported) from ../react/backend/shared_state_main.py.
#   /        -> "workspace" agent   (shared-state, shared-state/rendering-in-app, agent-readonly)
#   /writer  -> "writer" agent      (shared-state/streaming: the page's Antigravity snippet is set_steps)
import os

from ag_ui_antigravity import (  # HARNESS: the doc's snippets use these but never import them
    AntigravityAgent,
    create_antigravity_app,
    experimental_get_state,
    experimental_set_state,
)

# --- Doc: https://docs.copilotkit.ai/vue/google-antigravity/shared-state (verbatim) ---
READ_WRITE_PROMPT = (
    "You are a helpful, concise assistant. Call `get_shared_state` before "
    "every answer. Its `preferences` object holds the user's name, preferred "
    "tone, language and interests, which the user edits in the app: always "
    "respect them, and address the user by name when you know it. Its "
    "`notes` list holds what you have remembered so far. "
    "When the user asks you to remember something, or when you observe "
    "something worth surfacing in the UI, call `set_notes` with the FULL "
    "updated list of short note strings (existing notes + new)."
)


def set_notes(notes: list[str]) -> str:
    """Replace the notes array in shared state with the full updated list.

    Use this tool whenever the user asks you to "remember" something, or
    when you have an observation about the user worth surfacing in the
    UI's notes panel. Always pass the FULL notes list (existing notes +
    any new ones), not a diff. Keep each note short (< 120 chars).
    """
    experimental_set_state({**experimental_get_state(), "notes": notes})
    return "Notes updated."
# --- end doc ---

# --- Doc: https://docs.copilotkit.ai/vue/google-antigravity/shared-state/streaming (gen_ui_agent.py, verbatim) ---
def set_steps(steps: list[dict]) -> str:
    """Publish the current plan + step statuses. Call this every time a step
    transitions (including the first enumeration of steps).

    Each step has: id, title, and status ("pending", "in_progress" or
    "completed").
    """
    experimental_set_state({**experimental_get_state(), "steps": steps})
    return f"Published {len(steps)} step(s)."
# --- end doc ---

# HARNESS: stands in for the doc's build(system_instructions=..., tools=[set_notes], experimental_app_state=True)
agent = AntigravityAgent(
    model="gemini-2.5-flash",
    api_key=os.environ["GEMINI_API_KEY"],
    system_instructions=READ_WRITE_PROMPT,
    tools=[set_notes],
    experimental_app_state=True,
    workspaces=["/srv/agents/w1"],
)

# HARNESS: the streaming page never shows the agent that owns set_steps (no instructions, no
# construction); minimal agent so the tool can run at all.
writer = AntigravityAgent(
    model="gemini-2.5-flash",
    api_key=os.environ["GEMINI_API_KEY"],
    system_instructions="You are a helpful assistant.",  # HARNESS: doc gives none for this agent
    tools=[set_steps],
    experimental_app_state=True,
    workspaces=["/srv/agents/w1"],
)

app = create_antigravity_app({"": agent, "writer": writer}, path="/")  # HARNESS: / and /writer


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
