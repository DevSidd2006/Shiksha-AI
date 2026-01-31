from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
import uvicorn

app = FastAPI()

# Load model and tokenizer on startup
# Using distilled-600M as requested for efficiency
MODEL_NAME = "facebook/nllb-200-distilled-600M"
print(f"Loading {MODEL_NAME}...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)

# Move to GPU if available
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
print(f"Model loaded on {device}")

class TranslationRequest(BaseModel):
    text: str
    src_lang: str = "eng_Latn"
    tgt_lang: str = "hin_Deva"

# Mapping common names to NLLB codes if needed
LANG_MAP = {
    "English": "eng_Latn",
    "Hindi": "hin_Deva",
    "Bengali": "ben_Beng",
    "Marathi": "mar_Deva",
    "Telugu": "tel_Telu",
    "Tamil": "tam_Taml",
    "Gujarati": "guj_Gujr",
    "Kannada": "kan_Knda",
    "Odia": "ory_Orya",
    "Malayalam": "mal_Mlym",
    "Punjabi": "pan_Guru"
}

@app.post("/translate")
async def translate(request: TranslationRequest):
    try:
        # Check if target language is a common name and map it
        tgt_code = LANG_MAP.get(request.tgt_lang, request.tgt_lang)
        src_code = LANG_MAP.get(request.src_lang, request.src_lang)

        tokenizer.src_lang = src_code
        inputs = tokenizer(request.text, return_tensors="pt").to(device)
        
        translated_tokens = model.generate(
            **inputs,
            forced_bos_token_id=tokenizer.lang_code_to_id[tgt_code],
            max_length=512
        )
        
        translation = tokenizer.batch_decode(translated_tokens, skip_special_tokens=True)[0]
        return {"translation": translation}
    except Exception as e:
        print(f"Translation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3001)
