from pathlib import Path
import sys

# ---------------------------------------------------------
# Make AI/ importable
# ---------------------------------------------------------

AI_DIR = Path(__file__).resolve().parents[1]

if str(AI_DIR) not in sys.path:
    sys.path.insert(0, str(AI_DIR))


from inference.retriever import retrieve, format_context
from inference.local_model import generate_response


SYSTEM_PROMPT = """
You are FinBot, the financial assistant inside StrawFi.

Your job is to help users understand financial concepts,
research and investment analysis.

Rules:
- Use the supplied StrawFi financial context as your primary
  source for factual financial information.
- Distinguish facts from assumptions.
- Never guarantee investment returns.
- Never present uncertain information as fact.
- Do not invent company-specific data.
- Do not invent financial formulas.
- Keep answers concise and structured.
- Consider the user's investment persona when relevant.
- Mention important limitations when discussing valuation,
  financial metrics, or investment decisions.
- When the provided context is insufficient, say that the
  available StrawFi context is insufficient instead of making
  up facts.
"""


def build_chat_prompt(
    message: str,
    persona: str = "general investor",
    history=None,
):
    """
    Build the compact prompt supplied to the local model.
    """

    if not message or not message.strip():
        raise ValueError("Message cannot be empty.")

    if history is None:
        history = []

    # Keep only recent messages to control prompt size.
    recent_history = history[-6:]

    history_parts = []

    for item in recent_history:
        role = item.get("role", "user")
        content = str(
            item.get("content", "")
        ).strip()

        if content:
            history_parts.append(
                f"{role.upper()}: {content}"
            )

    history_text = (
        "\n".join(history_parts)
        if history_parts
        else "No previous conversation."
    )

    # Retrieve relevant StrawFi knowledge.
    results = retrieve(
        message,
        top_k=3,
    )

    context = format_context(results)

    prompt = f"""
{SYSTEM_PROMPT}

INVESTMENT PERSONA:
{persona or "general investor"}

RECENT CONVERSATION:
{history_text}

STRAWFI FINANCIAL CONTEXT:
{context}

CURRENT USER QUESTION:
{message}

Write a concise answer using the StrawFi context above.
Do not invent information that is not supported by the
context.

ANSWER:
""".strip()

    return prompt


def chat(
    message: str,
    persona: str = "general investor",
    history=None,
):
    """
    Generate a StrawFi chatbot response.
    """

    prompt = build_chat_prompt(
        message=message,
        persona=persona,
        history=history,
    )

    response = generate_response(
        prompt=prompt,
        max_tokens=250,
        temperature=0.2,
    )

    return {
        "response": response,
        "persona": persona or "general investor",
    }


if __name__ == "__main__":

    question = input(
        "Ask StrawFi: "
    ).strip()

    persona = input(
        "Investment persona (press Enter for general): "
    ).strip()

    if not persona:
        persona = "general investor"

    result = chat(
        message=question,
        persona=persona,
        history=[],
    )

    print()
    print("=" * 70)
    print("STRAWFI LOCAL CHAT")
    print("=" * 70)
    print()
    print(result["response"])
    print()