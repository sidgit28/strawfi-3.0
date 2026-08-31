from pathlib import Path
import sys

AI_DIR = Path(__file__).resolve().parents[1]

if str(AI_DIR) not in sys.path:
    sys.path.insert(0, str(AI_DIR))

from retriever import retrieve, format_context


def build_financial_context(
    query: str,
    top_k: int = 3,
) -> str:
    results = retrieve(
        query,
        top_k=top_k,
    )

    return format_context(results)


if __name__ == "__main__":
    query = input(
        "Ask StrawFi: "
    ).strip()

    print()
    print("=" * 60)
    print("STRAWFI FINANCIAL CONTEXT")
    print("=" * 60)
    print()

    context = build_financial_context(
        query
    )

    print(context)