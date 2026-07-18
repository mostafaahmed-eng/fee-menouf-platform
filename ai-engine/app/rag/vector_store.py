import logging
import uuid
from typing import Optional
import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import settings
from app.rag.embeddings import embedding_service

logger = logging.getLogger("ai_engine.vector_store")


class VectorStore:
    def __init__(self):
        self._client = None
        self._collection = None
        self._initialized = False

    def _ensure_initialized(self):
        if not self._initialized:
            self._init_client()

    def _init_client(self):
        try:
            self._client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_DIR,
                settings=ChromaSettings(
                    anonymized_telemetry=False,
                    allow_reset=True,
                ),
            )
            self._collection = self._client.get_or_create_collection(
                name=settings.VECTOR_COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"},
            )
            self._initialized = True
            logger.info(
                f"ChromaDB initialized at {settings.CHROMA_PERSIST_DIR}, "
                f"collection: {settings.VECTOR_COLLECTION_NAME}"
            )
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")
            raise

    def add_documents(self, texts: list[str], metadatas: list[dict], ids: Optional[list[str]] = None) -> list[str]:
        self._ensure_initialized()
        if not texts:
            return []

        if ids is None:
            ids = [str(uuid.uuid4()) for _ in texts]

        embeddings = embedding_service.embed_texts(texts)

        self._collection.add(
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids,
        )

        logger.info(f"Added {len(texts)} documents to vector store")
        return ids

    def similarity_search(
        self,
        query: str,
        k: int = 5,
        filter_criteria: Optional[dict] = None,
        score_threshold: Optional[float] = None,
    ) -> list[dict]:
        self._ensure_initialized()
        query_emb = embedding_service.embed_text(query)

        threshold = score_threshold if score_threshold is not None else settings.RELEVANCE_SCORE_THRESHOLD

        results = self._collection.query(
            query_embeddings=[query_emb],
            n_results=k * 2,
            where=filter_criteria,
            include=["documents", "metadatas", "distances"],
        )

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        scored_results = []
        for doc, meta, dist in zip(documents, metadatas, distances):
            score = 1.0 - float(dist)
            if score >= threshold:
                scored_results.append({
                    "text": doc,
                    "metadata": meta,
                    "score": round(score, 4),
                })

        scored_results.sort(key=lambda x: x["score"], reverse=True)
        return scored_results[:k]

    def hybrid_search(
        self,
        query: str,
        k: int = 5,
        filter_criteria: Optional[dict] = None,
        keyword_weight: float = 0.3,
    ) -> list[dict]:
        semantic_results = self.similarity_search(query, k=k * 2, filter_criteria=filter_criteria)
        keyword_results = self.keyword_search(query, k=k * 2, filter_criteria=filter_criteria)

        combined = {}
        for r in semantic_results:
            r["semantic_score"] = r["score"]
            r["keyword_score"] = 0.0
            r["combined_score"] = r["score"] * (1 - keyword_weight)
            combined[r["text"]] = r

        for r in keyword_results:
            if r["text"] in combined:
                combined[r["text"]]["keyword_score"] = r["score"]
                combined[r["text"]]["combined_score"] += r["score"] * keyword_weight
            else:
                r["semantic_score"] = 0.0
                r["keyword_score"] = r["score"]
                r["combined_score"] = r["score"] * keyword_weight
                combined[r["text"]] = r

        results = list(combined.values())
        results.sort(key=lambda x: x["combined_score"], reverse=True)
        return results[:k]

    def keyword_search(self, query: str, k: int = 5, filter_criteria: Optional[dict] = None) -> list[dict]:
        self._ensure_initialized()
        query_terms = set(query.lower().split())
        all_docs = self._collection.get(
            where=filter_criteria,
            include=["documents", "metadatas"],
        )

        documents = all_docs.get("documents", []) or []
        metadatas = all_docs.get("metadatas", []) or []
        ids = all_docs.get("ids", []) or []

        scored = []
        for doc, meta, doc_id in zip(documents, metadatas, ids):
            doc_words = set(doc.lower().split())
            if query_terms:
                overlap = len(query_terms & doc_words)
                score = overlap / len(query_terms)
            else:
                score = 0.0

            if score > 0:
                scored.append({
                    "text": doc,
                    "metadata": meta,
                    "score": round(score, 4),
                    "id": doc_id,
                })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:k]

    def get_document(self, doc_id: str) -> Optional[dict]:
        self._ensure_initialized()
        result = self._collection.get(ids=[doc_id], include=["documents", "metadatas"])
        if result and result.get("documents"):
            return {
                "id": doc_id,
                "text": result["documents"][0],
                "metadata": result["metadatas"][0],
            }
        return None

    def list_documents(self, offset: int = 0, limit: int = 50) -> list[dict]:
        self._ensure_initialized()
        all_docs = self._collection.get(include=["documents", "metadatas"])
        documents = all_docs.get("documents", []) or []
        metadatas = all_docs.get("metadatas", []) or []
        ids = all_docs.get("ids", []) or []

        results = []
        for doc, meta, did in zip(documents, metadatas, ids):
            results.append({
                "id": did,
                "text_preview": doc[:200] + "..." if len(doc) > 200 else doc,
                "metadata": meta,
                "length": len(doc),
            })

        return results[offset : offset + limit]

    def delete_document(self, doc_id: str) -> bool:
        self._ensure_initialized()
        try:
            self._collection.delete(ids=[doc_id])
            logger.info(f"Deleted document {doc_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete document {doc_id}: {e}")
            return False

    def delete_by_filter(self, filter_criteria: dict) -> int:
        self._ensure_initialized()
        try:
            all_docs = self._collection.get(where=filter_criteria)
            ids = all_docs.get("ids", []) or []
            if ids:
                self._collection.delete(ids=ids)
            logger.info(f"Deleted {len(ids)} documents by filter")
            return len(ids)
        except Exception as e:
            logger.error(f"Failed to delete by filter: {e}")
            return 0

    def count(self) -> int:
        self._ensure_initialized()
        return self._collection.count()


vector_store = VectorStore()
