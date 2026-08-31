from pathlib import Path
import sys
import json
import torch

AI_DIR = Path(__file__).resolve().parents[1]

if str(AI_DIR) not in sys.path:
    sys.path.insert(0, str(AI_DIR))

from model.gpt import (
    GPTLanguageModel,
    encode,
    decode,
    device,
)

MODEL_PATH = AI_DIR / "model" / "strawfi_tiny_gpt.pt"


PROMPTS = [
    "### User:\nWhat is EBITDA?\n\n### Assistant:",
    "### User:\nWhat is a DCF?\n\n### Assistant:",
    "### User:\nWhat is a P/E ratio?\n\n### Assistant:",
    "### User:\nWhat is investment risk?\n\n### Assistant:",
    "### User:\nWhat should a Traditionalist investor focus on?\n\n### Assistant:",
    "### User:\nWhy should investors compare companies with peers?\n\n### Assistant:",
]


def load_model():
    model = GPTLanguageModel().to(device)

    checkpoint = torch.load(
        MODEL_PATH,
        map_location=device,
        weights_only=True,
    )

    model.load_state_dict(
        checkpoint["model_state_dict"]
    )

    model.eval()

    return model


def generate_answer(model, prompt, max_new_tokens=180):
    token_ids = encode(prompt)

    context = torch.tensor(
        [token_ids],
        dtype=torch.long,
        device=device,
    )

    with torch.no_grad():
        generated = model.generate(
            context,
            max_new_tokens=max_new_tokens,
        )

    return decode(
        generated[0].tolist()
    )


def main():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Checkpoint not found: {MODEL_PATH}"
        )

    model = load_model()

    print("=" * 60)
    print("             STRAWFI GPT V2 EVALUATION")
    print("=" * 60)
    print()

    for i, prompt in enumerate(PROMPTS, start=1):
        print(f"TEST {i}")
        print("-" * 60)
        print(prompt)

        output = generate_answer(model, prompt)

        print(output)
        print()
        print("=" * 60)
        print()


if __name__ == "__main__":
    main()