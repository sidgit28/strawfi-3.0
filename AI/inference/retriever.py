from pathlib import Path
import json
import re


AI_DIR = Path(__file__).resolve().parents[1]
KNOWLEDGE_PATH = AI_DIR / "data" / "financial_knowledge.json"


def load_knowledge():
    if not KNOWLEDGE_PATH.exists():
        raise FileNotFoundError(
            f"Knowledge base not found: {KNOWLEDGE_PATH}"
        )

    with KNOWLEDGE_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def normalize(text: str) -> list[str]:
    return re.findall(
        r"[a-zA-Z0-9]+",
        text.lower()
    )


def score_entry(query_tokens, entry):
    score = 0

    searchable_text = " ".join(
        [
            entry.get("topic", ""),
            entry.get("category", ""),
            entry.get("definition", ""),
            entry.get("why_it_matters", ""),
            entry.get("limitations", ""),
            " ".join(entry.get("keywords", [])),
        ]
    ).lower()

    for token in query_tokens:
        if token in searchable_text:
            score += 1

    # Give extra weight to exact keyword matches.
    for keyword in entry.get("keywords", []):
        keyword_tokens = normalize(keyword)

        if keyword_tokens and all(
            token in query_tokens
            for token in keyword_tokens
        ):
            score += 3

    return score


def retrieve(query: str, top_k: int = 3):
    knowledge = load_knowledge()

    query_tokens = normalize(query)

    if not query_tokens:
        return []

    scored = []

    for entry in knowledge:
        score = score_entry(
            query_tokens,
            entry
        )

        if score > 0:
            scored.append(
                (score, entry)
            )

    scored.sort(
        key=lambda item: item[0],
        reverse=True
    )

    return [
        entry
        for score, entry in scored[:top_k]
    ]


def format_context(results):
    if not results:
        return "No relevant financial context was found."

    parts = []

    for item in results:
        parts.append(
            f"""Topic: {item['topic']}
Definition: {item['definition']}
Why it matters: {item['why_it_matters']}
Limitations: {item['limitations']}"""
        )

    return "\n\n".join(parts)


if __name__ == "__main__":
    query = input(
        "Ask StrawFi a financial question: "
    ).strip()

    results = retrieve(query)

    print()
    print("=" * 60)
    print("STRAWFI RETRIEVAL")
    print("=" * 60)
    print()

    if not results:
        print("No relevant knowledge found.")
    else:
        for i, result in enumerate(results, 1):
            print(
                f"{i}. {result['topic']}"
            )

        print()
        print("Context:")
        print(format_context(results))