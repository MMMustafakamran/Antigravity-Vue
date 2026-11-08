import os

from ag_ui_antigravity import AntigravityAgent, create_antigravity_app

agent = AntigravityAgent(
    model="gemini-2.5-flash",
    api_key=os.environ["GEMINI_API_KEY"],
    system_instructions="You are a helpful assistant embedded in a CopilotKit app.",
    # The harness does real file and shell work scoped to these
    # directories, so always set this. Keep the path short — a long,
    # high-entropy path makes the model reproduce it wrongly in tool
    # calls (see Troubleshooting below).
    workspaces=["/srv/agents/w1"],
)

app = create_antigravity_app(agent, path="/")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
