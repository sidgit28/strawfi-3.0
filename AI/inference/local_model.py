from typing import Optional
import requests


OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5:0.5b"


def generate_response(
    prompt: str,
    max_tokens: int = 300,
    temperature: float = 0.2,
) -> str:
    """
    Generate a response from the local Ollama model.
    """

    if not prompt.strip():
        raise ValueError("Prompt cannot be empty.")

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "options": {
            "num_predict": max_tokens,
            "temperature": temperature,
        },
    }

    try:
        response = requests.post(
            OLLAMA_URL,
            json=payload,
            timeout=120,
        )

        response.raise_for_status()

        data = response.json()

        result = data.get("response", "").strip()

        if not result:
            raise RuntimeError(
                "Ollama returned an empty response."
            )

        return result

    except requests.RequestException as exc:
        raise RuntimeError(
            "Could not connect to Ollama. "
            "Make sure Ollama is running."
        ) from exc


if __name__ == "__main__":
    prompt = """
You are FinBot inside StrawFi.

Answer the following financial question clearly and briefly.

Question:
What is EBITDA?

Answer:
""".strip()

    print("=" * 60)
    print("STRAWFI LOCAL AI TEST")
    print("=" * 60)
    print()

    answer = generate_response(prompt)

    print(answer)