from pathlib import Path
import json
import math

import torch
import torch.nn as nn
import torch.nn.functional as F


# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data" / "processed"


# ---------------------------------------------------------
# Vocabulary
# ---------------------------------------------------------

vocab_path = DATA_DIR / "vocab.json"

if not vocab_path.exists():
    raise FileNotFoundError(
        f"Vocabulary file not found: {vocab_path}\n"
        "Run data/prepare_data.py first."
    )

vocab = json.loads(vocab_path.read_text(encoding="utf-8"))

chars = vocab["chars"]
stoi = vocab["stoi"]
itos = {int(k): v for k, v in vocab["itos"].items()}

vocab_size = len(chars)


def encode(text: str) -> list[int]:
    """Convert text into integer token IDs."""
    return [stoi[c] for c in text]


def decode(ids: list[int]) -> str:
    """Convert integer token IDs back into text."""
    return "".join(itos[i] for i in ids)


# ---------------------------------------------------------
# Tiny GPT configuration
# ---------------------------------------------------------

batch_size = 8
block_size = 128

n_embd = 64
n_head = 4
n_layer = 2

dropout = 0.0


# ---------------------------------------------------------
# Device
# ---------------------------------------------------------

device = "cuda" if torch.cuda.is_available() else "cpu"


# ---------------------------------------------------------
# Head
# ---------------------------------------------------------

class Head(nn.Module):
    """One self-attention head."""

    def __init__(self, head_size: int):
        super().__init__()

        self.key = nn.Linear(n_embd, head_size, bias=False)
        self.query = nn.Linear(n_embd, head_size, bias=False)
        self.value = nn.Linear(n_embd, head_size, bias=False)

        self.register_buffer(
            "tril",
            torch.tril(torch.ones(block_size, block_size))
        )

        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        B, T, C = x.shape

        k = self.key(x)
        q = self.query(x)

        # Scaled dot-product attention
        weights = q @ k.transpose(-2, -1)
        weights = weights * (C ** -0.5)

        # Causal mask: tokens can only attend to previous/current tokens
        weights = weights.masked_fill(
            self.tril[:T, :T] == 0,
            float("-inf")
        )

        weights = F.softmax(weights, dim=-1)
        weights = self.dropout(weights)

        v = self.value(x)

        return weights @ v


# ---------------------------------------------------------
# Multi-head attention
# ---------------------------------------------------------

class MultiHeadAttention(nn.Module):

    def __init__(self, num_heads: int, head_size: int):
        super().__init__()

        self.heads = nn.ModuleList(
            [Head(head_size) for _ in range(num_heads)]
        )

        self.proj = nn.Linear(num_heads * head_size, n_embd)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        out = torch.cat(
            [head(x) for head in self.heads],
            dim=-1
        )

        out = self.proj(out)

        return self.dropout(out)


# ---------------------------------------------------------
# Feed-forward network
# ---------------------------------------------------------

class FeedForward(nn.Module):

    def __init__(self, n_embd: int):
        super().__init__()

        self.net = nn.Sequential(
            nn.Linear(n_embd, 4 * n_embd),
            nn.GELU(),
            nn.Linear(4 * n_embd, n_embd),
            nn.Dropout(dropout),
        )

    def forward(self, x):
        return self.net(x)


# ---------------------------------------------------------
# Transformer block
# ---------------------------------------------------------

class Block(nn.Module):

    def __init__(self, n_embd: int, n_head: int):
        super().__init__()

        head_size = n_embd // n_head

        self.sa = MultiHeadAttention(
            n_head,
            head_size
        )

        self.ffwd = FeedForward(n_embd)

        self.ln1 = nn.LayerNorm(n_embd)
        self.ln2 = nn.LayerNorm(n_embd)

    def forward(self, x):

        # Residual connection
        x = x + self.sa(self.ln1(x))

        # Residual connection
        x = x + self.ffwd(self.ln2(x))

        return x


# ---------------------------------------------------------
# GPT model
# ---------------------------------------------------------

class GPTLanguageModel(nn.Module):

    def __init__(self):

        super().__init__()

        # Token embeddings
        self.token_embedding_table = nn.Embedding(
            vocab_size,
            n_embd
        )

        # Position embeddings
        self.position_embedding_table = nn.Embedding(
            block_size,
            n_embd
        )

        # Transformer blocks
        self.blocks = nn.Sequential(
            *[
                Block(n_embd, n_head)
                for _ in range(n_layer)
            ]
        )

        self.ln_f = nn.LayerNorm(n_embd)

        # Language-model output layer
        self.lm_head = nn.Linear(
            n_embd,
            vocab_size
        )

        self.apply(self._init_weights)

    @staticmethod
    def _init_weights(module):

        if isinstance(module, nn.Linear):

            nn.init.normal_(
                module.weight,
                mean=0.0,
                std=0.02
            )

            if module.bias is not None:
                nn.init.zeros_(module.bias)

        elif isinstance(module, nn.Embedding):

            nn.init.normal_(
                module.weight,
                mean=0.0,
                std=0.02
            )

    def forward(self, idx, targets=None):

        B, T = idx.shape

        # Token embeddings
        token_emb = self.token_embedding_table(idx)

        # Positional embeddings
        positions = torch.arange(
            T,
            device=idx.device
        )

        pos_emb = self.position_embedding_table(positions)

        # Combine
        x = token_emb + pos_emb

        # Transformer
        x = self.blocks(x)

        # Final layer norm
        x = self.ln_f(x)

        # Vocabulary logits
        logits = self.lm_head(x)

        loss = None

        if targets is not None:

            B, T, C = logits.shape

            logits = logits.view(B * T, C)
            targets = targets.view(B * T)

            loss = F.cross_entropy(
                logits,
                targets
            )

        return logits, loss

    @torch.no_grad()
    def generate(self, idx, max_new_tokens: int):

        for _ in range(max_new_tokens):

            # Only keep the latest block_size tokens
            idx_cond = idx[:, -block_size:]

            logits, _ = self(idx_cond)

            # Last token's logits
            logits = logits[:, -1, :]

            # Convert logits into probabilities
            probabilities = F.softmax(
                logits,
                dim=-1
            )

            # Sample next token
            next_token = torch.multinomial(
                probabilities,
                num_samples=1
            )

            idx = torch.cat(
                (idx, next_token),
                dim=1
            )

        return idx


# ---------------------------------------------------------
# Utility
# ---------------------------------------------------------

def get_model() -> GPTLanguageModel:

    model = GPTLanguageModel().to(device)

    return model