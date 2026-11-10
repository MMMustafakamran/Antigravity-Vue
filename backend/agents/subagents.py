# src/agents/subagents.py
import uuid

import httpx
from ag_ui_antigravity import experimental_get_state, experimental_set_state

from agents._common import MODEL, aimock_headers, api_key, gemini_base_url

SUPERVISOR_PROMPT = (
    "You are a supervisor. For research tasks call `research_agent`, for "
    "drafting call `writing_agent`, for review call `critique_agent`. "
    "Delegate step by step: research first, then write, then critique once, "
    "then answer the user with the final draft."
)

_ROLE_PROMPTS = {
    "research_agent": "You are a research sub-agent. Given a topic, produce a concise bulleted list of 3-5 key facts. No preamble, no closing.",
    "writing_agent": "You are a writing sub-agent. Given a brief and optional source facts, produce a polished 1-paragraph draft. Be clear and concrete. No preamble.",
    "critique_agent": "You are an editorial critique sub-agent. Given a draft, give 2-3 crisp, actionable critiques. No preamble.",
}

SUB_AGENT_EMPTY_SENTINEL = "<sub-agent produced no output>"

# One connection pool for the whole process, created lazily on the first
# sub-agent call so importing this module never touches the network stack.
_HTTP_CLIENT: httpx.AsyncClient | None = None


def _http_client() -> httpx.AsyncClient:
    global _HTTP_CLIENT
    if _HTTP_CLIENT is None:
        _HTTP_CLIENT = httpx.AsyncClient(timeout=120.0)
    return _HTTP_CLIENT


async def close_http_client() -> None:
    """Closes the shared client. Called from agent_server's shutdown hook."""
    global _HTTP_CLIENT
    client, _HTTP_CLIENT = _HTTP_CLIENT, None
    if client is not None:
        await client.aclose()


async def _run(role: str, task: str) -> str:
    base = gemini_base_url() or "https://generativelanguage.googleapis.com"
    headers = aimock_headers()
    key = api_key()
    if key:
        headers["x-goog-api-key"] = key
    response = await _http_client().post(
        f"{base}/v1beta/models/{MODEL}:generateContent",
        json={
            "systemInstruction": {"parts": [{"text": _ROLE_PROMPTS[role]}]},
            "contents": [{"role": "user", "parts": [{"text": task}]}],
        },
        headers=headers,
    )
    response.raise_for_status()
    candidates = response.json().get("candidates") or [{}]
    parts = (candidates[0].get("content") or {}).get("parts") or []
    # Thinking models return their thought summary as parts flagged `thought`.
    content = "".join(part.get("text", "") for part in parts if not part.get("thought"))
    result = content.strip() or SUB_AGENT_EMPTY_SENTINEL
    _record_delegation(role, task, result)
    return result


def _record_delegation(role: str, task: str, result: str) -> None:
    """Appends a completed delegation to shared state, shape as in the reference.

    Read and write happen with no ``await`` between them, so tools the SDK
    runs concurrently cannot interleave here and drop each other's entry.
    """
    state = experimental_get_state()
    delegations = list(state.get("delegations") or [])
    delegations.append(
        {
            "id": str(uuid.uuid4()),
            "sub_agent": role,
            "task": task,
            "status": "completed",
            "result": result,
        }
    )
    experimental_set_state({**state, "delegations": delegations})


async def research_agent(task: str) -> str:
    """Delegate a research task; returns 3-5 key facts."""
    return await _run("research_agent", task)


async def writing_agent(task: str) -> str:
    """Delegate a drafting task; returns a one-paragraph draft."""
    return await _run("writing_agent", task)


async def critique_agent(task: str) -> str:
    """Delegate a review task; returns 2-3 critiques."""
    return await _run("critique_agent", task)




def subagents_agent():
    from agents._common import build

    return build(
        system_instructions=SUPERVISOR_PROMPT,
        tools=[research_agent, writing_agent, critique_agent],
    )


