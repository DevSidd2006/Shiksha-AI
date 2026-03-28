"""
Shiksha AI — PDF → Structured JSON Extractor
=============================================
Extracts, cleans, detects chapters, and saves structured
RAG-ready JSON from an NCERT Class 9 Science PDF.
"""

import re
import os
import json
import pdfplumber
from collections import Counter

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────
PDF_FILE    = "science_book.pdf"
OUTPUT_FILE = "data/science_chunks.json"

BOARD   = "NCERT"
CLASS   = "9"
SUBJECT = "Science"

CHUNK_MIN_WORDS = 150
CHUNK_MAX_WORDS = 250

# NCERT Class 9 Science chapters with alternate spellings
CHAPTER_MAP = {
    1:  "Matter in Our Surroundings",
    2:  "Is Matter Around Us Pure",
    3:  "Atoms and Molecules",
    4:  "Structure of the Atom",
    5:  "The Fundamental Unit of Life",
    6:  "Tissues",
    7:  "Diversity in Living Organisms",
    8:  "Motion",
    9:  "Force and Laws of Motion",
    10: "Gravitation",
    11: "Work and Energy",
    12: "Sound",
    13: "Why Do We Fall Ill",
    14: "Natural Resources",
    15: "Improvement in Food Resources",
}


# ─────────────────────────────────────────────
# STEP 1: EXTRACT TEXT PER PAGE
# ─────────────────────────────────────────────
def extract_pages(pdf_path):
    pages = []
    print(f"Extracting text from: {pdf_path}")
    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        for i, page in enumerate(pdf.pages):
            pages.append(page.extract_text() or "")
            if (i + 1) % 20 == 0 or (i + 1) == total:
                print(f"  → {i+1}/{total} pages read")
    return pages


# ─────────────────────────────────────────────
# STEP 2: CLEAN PAGE TEXT
# ─────────────────────────────────────────────
SKIP_PATTERNS = re.compile(
    r"""(
        ^\s*\d{1,3}\s*$                         # bare page number
        |^\s*[\-–—]\s*\d{1,3}\s*[\-–—]\s*$     # – 12 –
        |science\s+ncert$                       # "Science NCERT"
        |ncert\s+science$
        |not\s+for\s+sale
        |reprint
    )""",
    re.IGNORECASE | re.VERBOSE,
)

def clean_page_text(raw):
    lines = []
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        if SKIP_PATTERNS.search(line):
            continue
        lines.append(line)
    return " ".join(lines)


# ─────────────────────────────────────────────
# STEP 3: DETECT CHAPTER HEADING ON A PAGE
# ─────────────────────────────────────────────
# Match patterns like:
#   "Chapter 1   Matter in Our Surroundings"
#   "CHAPTER 1 – MATTER IN OUR SURROUNDINGS"
#   "1. Matter in Our Surroundings"
CHAPTER_HEADING_RE = re.compile(
    r"(?:chapter|unit)[\s\-\.]*(\d{1,2})|^(\d{1,2})\.",
    re.IGNORECASE,
)

def detect_chapter_from_page(raw_text, current_chapter):
    """Return new chapter name if this page starts a new chapter."""
    # Check for roman + chapter number forms
    m = CHAPTER_HEADING_RE.search(raw_text)
    if m:
        num = int(m.group(1) or m.group(2))
        if num in CHAPTER_MAP:
            return CHAPTER_MAP[num]

    # Fallback: match chapter title string directly in the page text
    upper = raw_text.upper()
    for num, title in CHAPTER_MAP.items():
        if title.upper() in upper:
            return title

    return current_chapter


# ─────────────────────────────────────────────
# STEP 4: SMART CHUNKING (sentence-aware)
# ─────────────────────────────────────────────
SENTENCE_END = re.compile(r'(?<=[.!?])\s+')

def smart_chunk(text, min_w=CHUNK_MIN_WORDS, max_w=CHUNK_MAX_WORDS):
    sentences  = SENTENCE_END.split(text)
    chunks     = []
    current    = []
    word_count = 0

    for sent in sentences:
        words = sent.split()
        if not words:
            continue

        if word_count + len(words) > max_w and word_count >= min_w:
            chunks.append(" ".join(current))
            current, word_count = [], 0

        current.extend(words)
        word_count += len(words)

    if current:
        tail = " ".join(current)
        if word_count < min_w // 2 and chunks:
            chunks[-1] += " " + tail
        else:
            chunks.append(tail)

    return chunks


# ─────────────────────────────────────────────
# STEP 5: BUILD STRUCTURED RECORDS
# ─────────────────────────────────────────────
def build_records(pages):
    records         = []
    current_chapter = "Introduction"
    page_buffer     = ""
    chapter_at_flush = "Introduction"

    for i, raw_page in enumerate(pages):
        if not raw_page.strip():
            continue

        # Detect chapter before cleaning (raw has more context)
        new_chapter = detect_chapter_from_page(raw_page, current_chapter)
        cleaned     = clean_page_text(raw_page)
        if not cleaned:
            continue

        # When chapter changes, flush buffer under OLD chapter first
        if new_chapter != current_chapter and page_buffer.strip():
            for chunk in smart_chunk(page_buffer.strip()):
                chunk = chunk.strip()
                if len(chunk.split()) >= 30:
                    records.append({
                        "board":   BOARD,
                        "class":   CLASS,
                        "subject": SUBJECT,
                        "chapter": chapter_at_flush,
                        "text":    chunk
                    })
            page_buffer      = ""
            chapter_at_flush = new_chapter

        current_chapter  = new_chapter
        chapter_at_flush = current_chapter
        page_buffer     += " " + cleaned

        # Flush every 5 pages to keep memory low
        if (i + 1) % 5 == 0:
            for chunk in smart_chunk(page_buffer.strip()):
                chunk = chunk.strip()
                if len(chunk.split()) >= 30:
                    records.append({
                        "board":   BOARD,
                        "class":   CLASS,
                        "subject": SUBJECT,
                        "chapter": current_chapter,
                        "text":    chunk
                    })
            page_buffer = ""

    # Final flush
    if page_buffer.strip():
        for chunk in smart_chunk(page_buffer.strip()):
            chunk = chunk.strip()
            if len(chunk.split()) >= 30:
                records.append({
                    "board":   BOARD,
                    "class":   CLASS,
                    "subject": SUBJECT,
                    "chapter": current_chapter,
                    "text":    chunk
                })

    return records


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
if __name__ == "__main__":
    pages   = extract_pages(PDF_FILE)
    records = build_records(pages)

    # Save JSON
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"\n✅  Saved {len(records)} chunks → {OUTPUT_FILE}")

    # Preview
    print("\n── PREVIEW (first 2 records) ─────────────────────────")
    for r in records[:2]:
        print(json.dumps(r, indent=2, ensure_ascii=False))
        print()

    # Chapter stats
    print("── CHUNK COUNT PER CHAPTER ───────────────────────────")
    counts = Counter(r["chapter"] for r in records)
    for ch, cnt in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"  {cnt:4}  {ch}")
    print(f"\nTotal chunks: {len(records)}")
