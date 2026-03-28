import os
import json
import pdfplumber
import numpy as np
from sentence_transformers import SentenceTransformer

# PDF and Data Paths
PDF_FILE = "science_book.pdf"
CHUNKS_DIR = "data/science"
EMBEDDINGS_FILE = "data/science_embeddings.json"

# --- STEP 1 & 2: Extract & Clean Text ---
def get_pdf_text(pdf_path):
    text = ""
    print(f"Opening {pdf_path}...")
    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        for i, page in enumerate(pdf.pages):
            page_text = page.extract_text()
            if page_text:
                text += page_text + " "
            if (i+1) % 10 == 0 or i+1 == total_pages:
                print(f"Processed {i+1}/{total_pages} pages...")
    return text.replace("\n", " ").strip()

# --- STEP 3: Break into CHUNKS ---
def chunk_text(text, chunk_size=200):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i+chunk_size])
        chunks.append(chunk)
    return chunks

# --- STEP 4: Save chunks into FILES ---
def save_chunks(chunks, base_dir=CHUNKS_DIR):
    os.makedirs(base_dir, exist_ok=True)
    for i, chunk in enumerate(chunks):
        with open(f"{base_dir}/chunk_{i}.txt", "w", encoding="utf-8") as f:
            f.write(chunk)
    print(f"Saved {len(chunks)} chunks to {base_dir}")

# --- STEP 5 & 6: Convert chunks to embeddings & Store them ---
def create_embeddings(chunks, model_name='all-MiniLM-L6-v2', output_path=EMBEDDINGS_FILE):
    print("Loading model...")
    model = SentenceTransformer(model_name)
    print("Generating embeddings (this may take a while)...")
    embeddings = model.encode(chunks, show_progress_bar=True)
    
    data = []
    for i in range(len(chunks)):
        data.append({
            "text": chunks[i],
            "embedding": embeddings[i].tolist()
        })
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(data, f)
    print(f"Embeddings saved to {output_path}")
    return model, data

# --- STEP 8: Find best matching chunk ---
def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

def query_system(query, model, data):
    # print(f"Querying: '{query}'...")
    query_emb = model.encode([query])[0]
    best_text = ""
    best_score = -1

    for item in data:
        score = cosine_similarity(query_emb, item["embedding"])
        if score > best_score:
            best_score = score
            best_text = item["text"]
    
    return best_text, best_score

# --- Main Implementation ---
if __name__ == "__main__":
    # Load model once at start
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Check if embeddings already exist
    if os.path.exists(EMBEDDINGS_FILE):
        print(f"\nLoading existing embeddings from {EMBEDDINGS_FILE}...")
        with open(EMBEDDINGS_FILE, "r") as f:
            data = json.load(f)
        print("Embeddings loaded successfully.")
    else:
        print("\nEmbeddings not found. Starting extraction and generation...")
        if os.path.exists(PDF_FILE):
            # Step 1, 2: Extract & Clean
            full_text = get_pdf_text(PDF_FILE)
            
            # Step 3: Chunk
            chunks = chunk_text(full_text)
            
            # Step 4: Save chunks as text files
            save_chunks(chunks)
            
            # Step 5, 6: Generate & Save Embeddings
            _, data = create_embeddings(chunks, model_name='all-MiniLM-L6-v2', output_path=EMBEDDINGS_FILE)
        else:
            print(f"Error: {PDF_FILE} not found! Please place the PDF in the project folder.")
            data = None

    if data:
        # Step 7, 8: Test Query
        queries = ["What is photosynthesis?", "How do animals breathe?"]
        for query in queries:
            best_match, score = query_system(query, model, data)
            
            print("\n" + "="*50)
            print(f"QUERY: {query}")
            print(f"SIMILARITY SCORE: {score:.4f}")
            print("-" * 50)
            print("CONTEXT RETRIEVED:")
            print(best_match)
            print("-" * 50)
            
            # Step 9: Send to Ollama (Hypothetical prompt snippet)
            prompt = f"""
Answer only from this context:
{best_match}

Question: {query}
"""
            print("\nPROMPT FOR LLM (Ollama):")
            print(prompt)
            print("="*50)