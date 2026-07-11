import re
import logging
from typing import Optional
from pathlib import Path

from app.utils.text_processor import normalize_arabic, clean_text, detect_language, count_tokens

logger = logging.getLogger("ai_engine.document_processor")


class DocumentChunk:
    def __init__(self, text: str, metadata: dict, chunk_id: str):
        self.text = text
        self.metadata = metadata
        self.chunk_id = chunk_id
        self.token_count = count_tokens(text)

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "metadata": self.metadata,
            "chunk_id": self.chunk_id,
            "token_count": self.token_count,
        }


class DocumentProcessor:
    def __init__(self, chunk_size: int = 512, chunk_overlap: int = 64):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def load_pdf(self, file_path: str) -> str:
        try:
            import fitz
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text
        except ImportError:
            logger.warning("PyMuPDF not available, attempting text extraction via alternative")
            raise
        except Exception as e:
            logger.error(f"Failed to load PDF {file_path}: {e}")
            raise

    def load_markdown(self, file_path: str) -> str:
        path = Path(file_path)
        return path.read_text(encoding="utf-8")

    def load_html(self, file_path: str) -> str:
        from markdown import markdown
        text = Path(file_path).read_text(encoding="utf-8")
        cleaned = re.sub(r"<[^>]+>", " ", text)
        return cleaned

    def load_text(self, file_path: str) -> str:
        return Path(file_path).read_text(encoding="utf-8")

    def load_document(self, file_path: str, file_type: Optional[str] = None) -> str:
        path = Path(file_path)
        ext = (file_type or path.suffix).lower()

        loaders = {
            ".pdf": self.load_pdf,
            ".md": self.load_markdown,
            ".html": self.load_html,
            ".htm": self.load_html,
            ".txt": self.load_text,
        }

        loader = loaders.get(ext)
        if not loader:
            raise ValueError(f"Unsupported file type: {ext}")

        return loader(str(path))

    def extract_metadata(self, text: str, source: str = "") -> dict:
        lang = detect_language(text)
        word_count = len(text.split())
        char_count = len(text)

        title = source
        if not title:
            first_line = text.strip().split("\n")[0][:100]
            title = first_line

        return {
            "source": source,
            "title": title,
            "language": lang,
            "word_count": word_count,
            "char_count": char_count,
        }

    def recursive_split(self, text: str) -> list[str]:
        sentences = re.split(r"(?<=[.?!\n])\s+", text)
        arabic_sentences = re.split(r"(?<=[.\u060C\u061F!?])\s+", text)
        if len(arabic_sentences) > len(sentences):
            sentences = arabic_sentences

        chunks = []
        current_chunk = []
        current_length = 0

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            sent_len = count_tokens(sentence)

            if current_length + sent_len > self.chunk_size and current_chunk:
                chunks.append(" ".join(current_chunk))
                overlap_text = []
                overlap_len = 0
                for s in reversed(current_chunk):
                    s_len = count_tokens(s)
                    if overlap_len + s_len > self.chunk_overlap:
                        break
                    overlap_text.insert(0, s)
                    overlap_len += s_len
                current_chunk = overlap_text
                current_length = overlap_len

            current_chunk.append(sentence)
            current_length += sent_len

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks

    def semantic_split(self, text: str) -> list[str]:
        paragraphs = re.split(r"\n\s*\n", text)
        paragraphs = [p.strip() for p in paragraphs if p.strip()]
        chunks = []
        current = []
        current_len = 0

        for para in paragraphs:
            para_len = count_tokens(para)
            if current_len + para_len > self.chunk_size and current:
                chunks.append("\n\n".join(current))
                overlap = []
                overlap_len = 0
                for p in reversed(current):
                    p_len = count_tokens(p)
                    if overlap_len + p_len > self.chunk_overlap:
                        break
                    overlap.insert(0, p)
                    overlap_len += p_len
                current = overlap
                current_len = overlap_len
            current.append(para)
            current_len += para_len

        if current:
            chunks.append("\n\n".join(current))

        return chunks

    def fixed_size_split(self, text: str) -> list[str]:
        tokens = text.split()
        chunks = []
        for i in range(0, len(tokens), self.chunk_size - self.chunk_overlap):
            chunk_tokens = tokens[i : i + self.chunk_size]
            chunks.append(" ".join(chunk_tokens))
        return chunks

    def process(self, file_path: str, file_type: Optional[str] = None) -> list[DocumentChunk]:
        raw_text = self.load_document(file_path, file_type)
        metadata = self.extract_metadata(raw_text, source=str(Path(file_path).name))

        if metadata["language"] == "ar":
            raw_text = normalize_arabic(raw_text)

        raw_text = clean_text(raw_text)

        if len(raw_text) > self.chunk_size * 10:
            chunks_text = self.semantic_split(raw_text)
        else:
            chunks_text = self.recursive_split(raw_text)

        result = []
        for i, chunk_text in enumerate(chunks_text):
            chunk_id = f"{metadata['source']}#chunk_{i}"
            chunk = DocumentChunk(
                text=chunk_text,
                metadata={**metadata, "chunk_index": i, "total_chunks": len(chunks_text)},
                chunk_id=chunk_id,
            )
            result.append(chunk)

        logger.info(f"Processed {Path(file_path).name}: {len(result)} chunks created")
        return result

    def process_text(self, text: str, source: str = "inline") -> list[DocumentChunk]:
        metadata = self.extract_metadata(text, source=source)
        if metadata["language"] == "ar":
            text = normalize_arabic(text)
        text = clean_text(text)

        chunks_text = self.recursive_split(text)
        result = []
        for i, chunk_text in enumerate(chunks_text):
            chunk_id = f"{source}#chunk_{i}"
            chunk = DocumentChunk(
                text=chunk_text,
                metadata={**metadata, "chunk_index": i, "total_chunks": len(chunks_text)},
                chunk_id=chunk_id,
            )
            result.append(chunk)

        return result
