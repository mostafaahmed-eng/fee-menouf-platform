import logging
import json
import os
import glob as glob_mod
from typing import Optional
from hashlib import md5

from app.config import settings
from app.rag.vector_store import vector_store
from app.rag.embeddings import embedding_service
from app.rag.document_processor import DocumentProcessor

logger = logging.getLogger("ai_engine.rag_engine")


class RagEngine:
    def __init__(self):
        self.processor = DocumentProcessor(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
        )
        self._cache: dict[str, list[dict]] = {}
        self._cache_enabled = settings.ENABLE_CACHE

    def ingest_file(self, file_path: str, file_type: Optional[str] = None) -> dict:
        chunks = self.processor.process(file_path, file_type)
        texts = [c.text for c in chunks]
        metadatas = [c.metadata for c in chunks]
        ids = [c.chunk_id for c in chunks]

        stored_ids = vector_store.add_documents(texts, metadatas, ids)

        return {
            "document": chunks[0].metadata.get("source", file_path),
            "chunks": len(chunks),
            "ids": stored_ids,
        }

    def ingest_text(self, text: str, source: str = "inline") -> dict:
        chunks = self.processor.process_text(text, source)
        texts = [c.text for c in chunks]
        metadatas = [c.metadata for c in chunks]
        ids = [c.chunk_id for c in chunks]

        stored_ids = vector_store.add_documents(texts, metadatas, ids)

        return {
            "document": source,
            "chunks": len(chunks),
            "ids": stored_ids,
        }

    def retrieve(
        self,
        query: str,
        k: int = 5,
        filter_criteria: Optional[dict] = None,
        use_hybrid: bool = True,
    ) -> list[dict]:
        cache_key = self._make_cache_key(query, k, filter_criteria)
        if self._cache_enabled and cache_key in self._cache:
            logger.debug(f"Cache hit for query: {query[:50]}")
            return self._cache[cache_key]

        if use_hybrid:
            results = vector_store.hybrid_search(query, k=k, filter_criteria=filter_criteria)
        else:
            results = vector_store.similarity_search(query, k=k, filter_criteria=filter_criteria)

        results = self._rerank(query, results)

        if self._cache_enabled:
            self._cache[cache_key] = results

        logger.debug(f"Retrieved {len(results)} results for query: {query[:50]}")
        return results

    def retrieve_with_context(
        self,
        query: str,
        k: int = 5,
        filter_criteria: Optional[dict] = None,
        max_tokens: int = 3000,
    ) -> list[dict]:
        results = self.retrieve(query, k=k, filter_criteria=filter_criteria)

        context_parts = []
        token_accum = 0
        for r in results:
            tokens = r.get("metadata", {}).get("token_count", len(r["text"].split()))
            if token_accum + tokens > max_tokens:
                break
            context_parts.append(r["text"])
            token_accum += tokens

        combined_text = "\n\n".join(context_parts)

        return {
            "results": results[:k],
            "context": combined_text,
            "total_tokens": token_accum,
            "result_count": len(results),
        }

    def _rerank(self, query: str, results: list[dict]) -> list[dict]:
        if len(results) <= 1:
            return results

        query_emb = embedding_service.embed_text(query)
        doc_embs = [
            embedding_service.embed_text(r["text"]) for r in results
        ]

        for r, emb in zip(results, doc_embs):
            score = embedding_service.cosine_similarity(query_emb, emb)
            r["rerank_score"] = round(score, 4)

        results.sort(key=lambda x: x["rerank_score"], reverse=True)
        return results

    def _make_cache_key(self, query: str, k: int, filter_criteria: Optional[dict]) -> str:
        raw = f"{query}:{k}:{json.dumps(filter_criteria or {}, sort_keys=True)}"
        return md5(raw.encode()).hexdigest()

    def clear_cache(self):
        self._cache.clear()
        embedding_service.clear_cache()
        logger.info("RAG cache cleared")

    def ingest_knowledge_directory(self, directory: str = "data/knowledge") -> dict:
        """Ingest all markdown files from the knowledge directory at startup."""
        if not os.path.isdir(directory):
            logger.warning(f"Knowledge directory not found: {directory}")
            return {"ingested": 0, "files": []}

        md_files = glob_mod.glob(os.path.join(directory, "*.md"))
        if not md_files:
            logger.info(f"No markdown files found in {directory}")
            return {"ingested": 0, "files": []}

        results = []
        for file_path in sorted(md_files):
            try:
                result = self.ingest_file(file_path)
                results.append(result)
                logger.info(f"Ingested {file_path}: {result['chunks']} chunks")
            except Exception as e:
                logger.error(f"Failed to ingest {file_path}: {e}")

        total_chunks = sum(r["chunks"] for r in results)
        logger.info(f"Ingested {len(results)} files ({total_chunks} chunks) from knowledge directory")
        return {"ingested": len(results), "files": results, "total_chunks": total_chunks}


rag_engine = RagEngine()
