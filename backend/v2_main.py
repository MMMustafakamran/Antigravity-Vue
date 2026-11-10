# HARNESS: one backend process on port 8143 for group V2 pages (one port per agent group).
# /tool-rendering -> tool_rendering_main (Tool Rendering page; get_weather + TOOLS verbatim)
# /state-rendering -> state_rendering_main (State Rendering page; set_steps verbatim; the page's
#                     full agent file is LangGraph/langchain code, not Antigravity)
# /default -> quickstart agent (main.py) for Components as Tools, MCP Apps and the Threads pages.
from fastapi import FastAPI
import main, tool_rendering_main, state_rendering_main

app = FastAPI()
app.mount("/tool-rendering", tool_rendering_main.app)
app.mount("/state-rendering", state_rendering_main.app)
app.mount("/default", main.app)
