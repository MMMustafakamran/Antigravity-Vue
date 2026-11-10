# HARNESS: copied from ../react/backend (repo stays self-contained).
# HARNESS: state-rendering page. set_steps is verbatim; the imports, prompt and agent are harness
# (the doc shows no imports, and gen_ui_agent.py's prompt and build() aren't published).
import os
from ag_ui_antigravity import AntigravityAgent, create_antigravity_app, experimental_get_state, experimental_set_state

# --- Doc (verbatim) ---
def set_steps(steps: list[dict]) -> str:
    """Publish the current plan + step statuses. Call this every time a step
    transitions (including the first enumeration of steps).

    Each step has: id, title, and status ("pending", "in_progress" or
    "completed").
    """
    experimental_set_state({**experimental_get_state(), "steps": steps})
    return f"Published {len(steps)} step(s)."
# --- end doc ---

agent = AntigravityAgent(
    model="gemini-2.5-flash",
    api_key=os.environ["GEMINI_API_KEY"],
    system_instructions="Plan the user's task as 3 steps. Call set_steps after enumerating them, then again each time a step changes status, until all are completed. Then answer briefly.",
    tools=[set_steps],
    workspaces=["/srv/agents/w1"],
)
app = create_antigravity_app(agent, path="/")  # HARNESS: mounted under /state-rendering by v2_main.py (port 8143)
