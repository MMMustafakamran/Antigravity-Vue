# HARNESS: copied from ../react/backend (repo stays self-contained).
# HARNESS: tool-rendering backend. get_weather and the TOOLS line are verbatim from the doc.
# SYSTEM_PROMPT, search_flights, get_stock_price and roll_d20 are referenced but never shown,
# so they're copied from showcase/integrations/google-antigravity/src/agents/tool_rendering.py (4f0e86d).
# build() is replaced with AntigravityAgent (agents._common is unpublished).
import os
from random import choice, randint  # HARNESS: showcase import the copied tools need
from ag_ui_antigravity import AntigravityAgent, create_antigravity_app

SYSTEM_PROMPT = (
    "You are a travel & lifestyle concierge. Use the mock tools for "
    "weather, flights, stock prices, or d20 rolls when the user asks; "
    "otherwise reply in plain text. For flights, default origin to 'SFO' "
    "if the user only names a destination. Call multiple tools in one "
    "turn if asked. After tools return, summarize in one short sentence. "
    "Never fabricate data a tool could provide."
)


# @region[weather-tool-backend]

# --- Doc (verbatim) ---
def get_weather(location: str) -> dict:
    """Get the current weather for a given location."""
    return {
        "city": location,
        "temperature": 68,
        "humidity": 55,
        "wind_speed": 10,
        "conditions": "Sunny",
    }
# --- end doc ---

def search_flights(origin: str, destination: str) -> dict:
    """Search mock flights from an origin airport to a destination airport."""
    return {
        "origin": origin,
        "destination": destination,
        "flights": [
            {
                "airline": "United",
                "flight": "UA231",
                "depart": "08:15",
                "arrive": "16:45",
                "price_usd": 348,
            },
            {
                "airline": "Delta",
                "flight": "DL412",
                "depart": "11:20",
                "arrive": "19:55",
                "price_usd": 312,
            },
            {
                "airline": "JetBlue",
                "flight": "B6722",
                "depart": "17:05",
                "arrive": "01:30",
                "price_usd": 289,
            },
        ],
    }


def get_stock_price(
    ticker: str, price_usd: float | None = None, change_pct: float | None = None
) -> dict:
    """Get a mock current price for a stock ticker. Optional price_usd and change_pct are echoed back when given."""
    return {
        "ticker": ticker.upper(),
        "price_usd": round(float(price_usd), 2)
        if price_usd is not None
        else round(100 + randint(0, 400) + randint(0, 99) / 100, 2),
        "change_pct": round(float(change_pct), 2)
        if change_pct is not None
        else round(choice([-1, 1]) * (randint(0, 300) / 100), 2),
    }


def roll_d20(value: int = 0) -> dict:
    """Roll a 20-sided die. A value between 1 and 20 is echoed back as the roll."""
    rolled = value if isinstance(value, int) and 1 <= value <= 20 else randint(1, 20)
    return {"sides": 20, "value": rolled, "result": rolled}


# @region[tool-rendering-agent]

# --- Doc (verbatim) ---
TOOLS = [get_weather, search_flights, get_stock_price, roll_d20]
# --- end doc ---

agent = AntigravityAgent(
    model="gemini-2.5-flash",
    api_key=os.environ["GEMINI_API_KEY"],
    system_instructions=SYSTEM_PROMPT,
    tools=TOOLS,
    workspaces=["/srv/agents/w1"],
)
app = create_antigravity_app(agent, path="/")  # HARNESS: mounted under /tool-rendering by v2_main.py (port 8143)
