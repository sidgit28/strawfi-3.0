from pathlib import Path
import json
import torch

BASE_DIR = Path(__file__).resolve().parent
INPUT_FILE = BASE_DIR / "financial_instructions.txt"
OUTPUT_DIR = BASE_DIR / "processed"

OUTPUT_DIR.mkdir(exist_ok=True)

text = INPUT_FILE.read_text(encoding="utf-8")

if not text.strip():
    raise ValueError("financial_training.txt is empty.")

# Character-level vocabulary.
chars = sorted(set(text))
vocab_size = len(chars)

stoi = {ch: i for i, ch in enumerate(chars)}
itos = {i: ch for ch, i in stoi.items()}

encode = lambda s: [stoi[c] for c in s]
decode = lambda ids: "".join(itos[i] for i in ids)

data = torch.tensor(encode(text), dtype=torch.long)

# Keep a small train/validation split.
split = int(0.9 * len(data))

train_data = data[:split]
val_data = data[split:]

torch.save(train_data, OUTPUT_DIR / "train.pt")
torch.save(val_data, OUTPUT_DIR / "val.pt")

(OUTPUT_DIR / "vocab.json").write_text(
    json.dumps(
        {
            "chars": chars,
            "stoi": stoi,
            "itos": {str(k): v for k, v in itos.items()},
        },
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)

print(f"Total characters : {len(text)}")
print(f"Vocabulary size   : {vocab_size}")
print(f"Training tokens   : {len(train_data)}")
print(f"Validation tokens : {len(val_data)}")
print(f"Processed data    : {OUTPUT_DIR}")