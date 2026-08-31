from pathlib import Path
import sys
import json

import torch

# ---------------------------------------------------------
# Make the AI folder importable
# ---------------------------------------------------------

AI_DIR = Path(__file__).resolve().parents[1]

if str(AI_DIR) not in sys.path:
    sys.path.insert(0, str(AI_DIR))


from model.gpt import (
    GPTLanguageModel,
    encode,
    decode,
    device,
)


# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------

DATA_DIR = AI_DIR / "data" / "processed"
MODEL_PATH = AI_DIR / "model" / "strawfi_tiny_gpt.pt"


# ---------------------------------------------------------
# Main inference function
# ---------------------------------------------------------

def main():

    print("Loading StrawFi Tiny GPT...")

    # Check checkpoint
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Checkpoint not found:\n{MODEL_PATH}\n\n"
            "Run training first."
        )

    # Check vocabulary
    vocab_path = DATA_DIR / "vocab.json"

    if not vocab_path.exists():
        raise FileNotFoundError(
            f"Vocabulary file not found:\n{vocab_path}\n\n"
            "Run data/prepare_data.py first."
        )

    # Load vocabulary
    vocab = json.loads(
        vocab_path.read_text(
            encoding="utf-8"
        )
    )

    print(f"Vocabulary size: {len(vocab['chars'])}")
    print(f"Device: {device}")

    # -----------------------------------------------------
    # Create model
    # -----------------------------------------------------

    model = GPTLanguageModel().to(device)

    # -----------------------------------------------------
    # Load checkpoint
    # -----------------------------------------------------

    checkpoint = torch.load(
        MODEL_PATH,
        map_location=device,
        weights_only=True,
    )

    model.load_state_dict(
        checkpoint["model_state_dict"]
    )

    model.eval()

    print("Checkpoint loaded successfully.")

    # -----------------------------------------------------
    # Prompt
    # -----------------------------------------------------

    prompt = "### What is EBITDA?"

    print()
    print("Prompt:")
    print(prompt)
    print()

    # Convert prompt to token IDs
    token_ids = encode(prompt)

    context = torch.tensor(
        [token_ids],
        dtype=torch.long,
        device=device,
    )

    # -----------------------------------------------------
    # Generate
    # -----------------------------------------------------

    print("Generating...")
    
    with torch.no_grad():

        generated = model.generate(
            context,
            max_new_tokens=200,
        )

    # Convert generated IDs back to text
    output = decode(
        generated[0].tolist()
    )

    # -----------------------------------------------------
    # Display
    # -----------------------------------------------------

    print()
    print("==========================================")
    print("          STRAWFI TINY GPT")
    print("==========================================")
    print()
    print(output)
    print()


if __name__ == "__main__":
    main()