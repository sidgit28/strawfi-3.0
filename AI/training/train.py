from pathlib import Path
import torch

import sys
from pathlib import Path

AI_DIR = Path(__file__).resolve().parents[1]

sys.path.insert(0, str(AI_DIR))

from model.gpt import GPTLanguageModel, batch_size, block_size, device


# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[1]

DATA_DIR = BASE_DIR / "data" / "processed"
MODEL_DIR = BASE_DIR / "model"

MODEL_DIR.mkdir(exist_ok=True)


# ---------------------------------------------------------
# Load dataset
# ---------------------------------------------------------

train_data = torch.load(
    DATA_DIR / "train.pt",
    weights_only=True
)

val_data = torch.load(
    DATA_DIR / "val.pt",
    weights_only=True
)


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

learning_rate = 3e-4
max_iters = 2000

eval_interval = 200

eval_iters = 50


# ---------------------------------------------------------
# Model
# ---------------------------------------------------------

model = GPTLanguageModel().to(device)

optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=learning_rate
)


# ---------------------------------------------------------
# Batch creation
# ---------------------------------------------------------

def get_batch(split):

    data = train_data if split == "train" else val_data

    if len(data) <= block_size:
        raise ValueError(
            f"{split} dataset is too small for block_size={block_size}."
        )

    ix = torch.randint(
        len(data) - block_size,
        (batch_size,)
    )

    x = torch.stack(
        [
            data[i:i + block_size]
            for i in ix
        ]
    )

    y = torch.stack(
        [
            data[i + 1:i + block_size + 1]
            for i in ix
        ]
    )

    return x.to(device), y.to(device)


# ---------------------------------------------------------
# Loss estimation
# ---------------------------------------------------------

@torch.no_grad()
def estimate_loss():

    results = {}

    model.eval()

    for split in ["train", "val"]:

        losses = torch.zeros(eval_iters)

        for k in range(eval_iters):

            X, Y = get_batch(split)

            _, loss = model(
                X,
                Y
            )

            losses[k] = loss.item()

        results[split] = losses.mean().item()

    model.train()

    return results


# ---------------------------------------------------------
# Training
# ---------------------------------------------------------

print("======================================")
print("        STRAWFI TINY GPT TRAINING")
print("======================================")

print(f"Device: {device}")
print(f"Vocabulary size: {model.token_embedding_table.num_embeddings}")
print(f"Parameters: {sum(p.numel() for p in model.parameters()):,}")
print()

for iteration in range(max_iters):

    if iteration % eval_interval == 0:

        losses = estimate_loss()

        print(
            f"step {iteration:4d} | "
            f"train loss {losses['train']:.4f} | "
            f"val loss {losses['val']:.4f}"
        )

    X, Y = get_batch("train")

    _, loss = model(
        X,
        Y
    )

    optimizer.zero_grad(
        set_to_none=True
    )

    loss.backward()

    optimizer.step()


# ---------------------------------------------------------
# Save checkpoint
# ---------------------------------------------------------

checkpoint_path = MODEL_DIR / "strawfi_tiny_gpt.pt"

torch.save(
    {
        "model_state_dict": model.state_dict(),
    },
    checkpoint_path
)

print()
print("Training complete.")
print(f"Checkpoint saved to: {checkpoint_path}")