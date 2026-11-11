"""HARNESS: last-resort fallback for tools/gemini_pool.py. Translates one Gemini generateContent
request into an OpenAI chat completion and the answer back into Gemini's response shape, so the
ADK agents (doc code unchanged) keep working when every free Gemini key/model is out of quota.

Covers what ADK agents send: system instruction, text, functionCall / functionResponse turns,
function declarations (Gemini Schema or JSON schema). Streaming requests get the whole answer as a
single SSE chunk. Inline images are passed on as image_url parts; other inline data is dropped (logged).
"""
import json, os, uuid

OPENAI_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_MODEL = os.getenv("GEMINI_POOL_OPENAI_MODEL", "gpt-6-luna")

_DROP = {"nullable", "propertyOrdering", "example", "default", "title", "format", "minItems", "maxItems",
         "minLength", "maxLength", "minimum", "maximum", "pattern", "anyOf"}


def openai_key():
    k = os.getenv("GEMINI_POOL_OPENAI_KEY", "").strip()
    if k:
        return k
    f = os.getenv("GEMINI_POOL_OPENAI_KEYFILE", "").strip()  # an env-style file holding OPENAI_API_KEY=
    if f:
        try:
            for line in open(f, encoding="utf-8-sig"):
                if line.startswith("OPENAI_API_KEY="):
                    return line.split("=", 1)[1].strip().strip('"')
        except OSError:
            pass
    return ""


def _schema(s):
    """Gemini Schema (type: "OBJECT", ...) -> JSON schema."""
    if isinstance(s, list):
        return [_schema(x) for x in s]
    if not isinstance(s, dict):
        return s
    out = {}
    for k, v in s.items():
        if k in _DROP:
            continue
        if k == "type" and isinstance(v, str):
            out[k] = v.lower()
        elif k == "properties" and isinstance(v, dict):
            out[k] = {pk: _schema(pv) for pk, pv in v.items()}
        elif k == "items":
            out[k] = _schema(v)
        else:
            out[k] = v
    if out.get("type") == "object":
        out.setdefault("properties", {})
    return out


def to_openai(g: dict) -> tuple[dict, list[str]]:
    notes, msgs = [], []
    sys_parts = (g.get("systemInstruction") or g.get("system_instruction") or {}).get("parts", [])
    sys_text = "\n".join(p.get("text", "") for p in sys_parts if p.get("text"))
    if sys_text:
        msgs.append({"role": "system", "content": sys_text})
    pending = {}  # function name -> queue of call ids awaiting a functionResponse
    for c in g.get("contents", []):
        role = c.get("role", "user")
        texts, calls, results, images = [], [], [], []
        for p in c.get("parts", []):
            if p.get("thought"):
                continue
            if "text" in p and p["text"]:
                texts.append(p["text"])
            elif "functionCall" in p or "function_call" in p:
                fc = p.get("functionCall") or p.get("function_call")
                cid = fc.get("id") or f"call_{uuid.uuid4().hex[:12]}"
                pending.setdefault(fc["name"], []).append(cid)
                calls.append({"id": cid, "type": "function",
                              "function": {"name": fc["name"], "arguments": json.dumps(fc.get("args") or {})}})
            elif "functionResponse" in p or "function_response" in p:
                fr = p.get("functionResponse") or p.get("function_response")
                q = pending.get(fr["name"]) or []
                cid = fr.get("id") or (q.pop(0) if q else f"call_{uuid.uuid4().hex[:12]}")
                if fr.get("id") and fr["id"] in q:
                    q.remove(fr["id"])
                results.append({"role": "tool", "tool_call_id": cid,
                                "content": json.dumps(fr.get("response"), default=str)})
            elif ("inlineData" in p or "inline_data" in p) and role != "model":
                d = p.get("inlineData") or p.get("inline_data")
                mime = d.get("mimeType") or d.get("mime_type") or ""
                if mime.startswith("image/"):
                    b64 = (d.get("data") or "").replace("-", "+").replace("_", "/")  # google-genai sends URL-safe base64
                    b64 += "=" * (-len(b64) % 4)
                    images.append({"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}})
                else:
                    notes.append(f"dropped inline {mime}")
            else:
                notes.append(f"dropped part {list(p)[:1]}")
        if role == "model":
            m = {"role": "assistant", "content": "\n".join(texts) or None}
            if calls:
                m["tool_calls"] = calls
            if m["content"] or calls:
                msgs.append(m)
        else:
            msgs.extend(results)
            if images:
                msgs.append({"role": "user", "content": ([{"type": "text", "text": "\n".join(texts)}] if texts else []) + images})
            elif texts:
                msgs.append({"role": "user", "content": "\n".join(texts)})
    tools = []
    for t in g.get("tools", []) or []:
        for fd in t.get("functionDeclarations") or t.get("function_declarations") or []:
            params = fd.get("parametersJsonSchema") or fd.get("parameters_json_schema")
            params = params if params is not None else _schema(fd.get("parameters") or {"type": "OBJECT"})
            if not params or params.get("type") != "object":
                params = {"type": "object", "properties": {}}
            tools.append({"type": "function", "function": {
                "name": fd["name"], "description": fd.get("description", ""), "parameters": params}})
        for k in t:
            if k not in ("functionDeclarations", "function_declarations"):
                notes.append(f"dropped tool {k}")
    # gpt-6-luna on chat/completions rejects function tools unless reasoning is off
    req = {"model": OPENAI_MODEL, "messages": msgs, "reasoning_effort": os.getenv("GEMINI_POOL_OPENAI_REASONING", "none")}
    if tools:
        req["tools"] = tools
    return req, notes


def to_gemini(o: dict) -> dict:
    ch = (o.get("choices") or [{}])[0]
    m = ch.get("message") or {}
    parts = []
    if m.get("content"):
        parts.append({"text": m["content"]})
    for tc in m.get("tool_calls") or []:
        try:
            args = json.loads(tc["function"].get("arguments") or "{}")
        except json.JSONDecodeError:
            args = {}
        parts.append({"functionCall": {"id": tc.get("id"), "name": tc["function"]["name"], "args": args}})
    if not parts:
        parts = [{"text": ""}]
    u = o.get("usage") or {}
    return {
        "candidates": [{"content": {"role": "model", "parts": parts}, "finishReason": "STOP", "index": 0}],
        "usageMetadata": {"promptTokenCount": u.get("prompt_tokens", 0),
                          "candidatesTokenCount": u.get("completion_tokens", 0),
                          "totalTokenCount": u.get("total_tokens", 0)},
        "modelVersion": OPENAI_MODEL,
    }
