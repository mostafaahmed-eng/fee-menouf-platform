import re
import unicodedata
from typing import Optional
import tiktoken


ARABIC_DIACRITICS = re.compile(
    r"[\u064B-\u0652\u0610-\u061A\u06D6-\u06ED]"
)

ARABIC_ALEF_MAP = {
    "\u0622": "\u0627",
    "\u0623": "\u0627",
    "\u0625": "\u0627",
}

ARABIC_YEH_MAP = {
    "\u0649": "\u064A",
    "\u0620": "\u064A",
}

ARABIC_TAA_MARBUTA = {
    "\u0629": "\u0647",
}

ARABIC_NORMALIZATION = {
    "\u0622": "\u0627",
    "\u0623": "\u0627",
    "\u0625": "\u0627",
    "\u0649": "\u064A",
    "\u0620": "\u064A",
}


def normalize_arabic(text: str) -> str:
    text = ARABIC_DIACRITICS.sub("", text)
    for old, new in ARABIC_NORMALIZATION.items():
        text = text.replace(old, new)
    text = re.sub(r"\u064E\u0645\u0651", "\u0645", text)
    text = re.sub(r"\u0629(?=\s|$)", "\u0647", text)
    return text


def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    text = text.strip()
    text = re.sub(r"[^\w\s\.\,\;\:\!\?\-\(\)\[\]\{\}\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]", "", text)
    return text


def detect_language(text: str) -> str:
    arabic_chars = len(re.findall(r"[\u0600-\u06FF]", text))
    total_chars = len(re.sub(r"\s", "", text))
    if total_chars == 0:
        return "unknown"
    arabic_ratio = arabic_chars / total_chars
    if arabic_ratio > 0.4:
        return "ar"
    return "en"


def count_tokens(text: str, model: str = "gpt-4-turbo") -> int:
    try:
        encoding = tiktoken.encoding_for_model(model)
        return len(encoding.encode(text))
    except Exception:
        return len(text.split())


def truncate_to_tokens(text: str, max_tokens: int, model: str = "gpt-4-turbo") -> str:
    try:
        encoding = tiktoken.encoding_for_model(model)
        tokens = encoding.encode(text)
        if len(tokens) <= max_tokens:
            return text
        return encoding.decode(tokens[:max_tokens])
    except Exception:
        words = text.split()
        if len(words) <= max_tokens:
            return text
        return " ".join(words[:max_tokens])


split_pattern = re.compile(r"(?<=[.?!\u061F\u060C\u061B])\s+")

def split_sentences(text: str) -> list[str]:
    sentences = split_pattern.split(text)
    return [s.strip() for s in sentences if s.strip()]
