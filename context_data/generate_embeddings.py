"""
Shiksha AI — JSON → Embeddings Generator (Step 2)
==================================================
Reads the structured science_chunks.json produced by extract_chunks.py
and adds embeddings using sentence-transformers.

Output: data/science_embeddings.json
  [
    {
      "board": "NCERT",
      "class": "9",
      "subject": "Science",
      "chapter": "...",
      "text": "...",
      "embedding": [0.123, -0.456, ...]
    }
  ]
"""

import os
import json
from sentence_transformers import SentenceTransformer

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────
INPUT_FILE     = "data/science_chunks.json"
OUTPUT_FILE    = "data/science_embeddings.json"
MODEL_NAME     = "all-MiniLM-L6-v2"    # 22MB, fast, works fully offline
BATCH_SIZE     = 64                     # adjust lower if RAM is limited


def load_chunks(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def generate_embeddings(records, model_name=MODEL_NAME, batch_size=BATCH_SIZE):
    print(f"Loading model: {model_name}")
    model = SentenceTransformer(model_name)

    texts = [r["text"] for r in records]
    print(f"Encoding {len(texts)} chunks in batches of {batch_size}...")

    embeddings = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=True,
        convert_to_numpy=True,
    )

    # Attach embedding to each record
    output = []
    for record, emb in zip(records, embeddings):
        entry = dict(record)               # copy all metadata fields
        entry["embedding"] = emb.tolist()
        output.append(entry)

    return output


def save_embeddings(data, output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    print(f"\n✅  Saved {len(data)} records with embeddings → {output_path}")


def query_demo(data, model):
    """Quick sanity check: find the top 3 chunks for a test question."""
    import numpy as np

    def cosine_sim(a, b):
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

    question = "What is photosynthesis?"
    print(f"\n── DEMO QUERY: '{question}' ─────────────────────────")
    q_emb = model.encode([question])[0]

    scored = [
        (cosine_sim(q_emb, item["embedding"]), item)
        for item in data
    ]
    scored.sort(key=lambda x: x[0], reverse=True)

    for rank, (score, item) in enumerate(scored[:3], 1):
        print(f"\n  Rank {rank}  [{item['chapter']}]  score={score:.4f}")
        print(f"  {item['text'][:200]}...")


if __name__ == "__main__":
    if not os.path.exists(INPUT_FILE):
        print(f"❌  Input file not found: {INPUT_FILE}")
        print("    Run extract_chunks.py first.")
    else:
        records    = load_chunks(INPUT_FILE)
        print(f"Loaded {len(records)} chunks from {INPUT_FILE}")

        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer(MODEL_NAME)

        data = generate_embeddings(records)
        save_embeddings(data, OUTPUT_FILE)
        query_demo(data, model)
