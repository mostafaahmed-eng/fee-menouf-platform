import logging
import collections
import numpy as np
from typing import Optional
from functools import lru_cache

from app.config import settings

logger = logging.getLogger("ai_engine.embeddings")


class EmbeddingService:
    def __init__(self):
        self._local_model = None
        self._openai_client = None
        self._cache: collections.OrderedDict[str, list[float]] = collections.OrderedDict()
        self._cache_enabled = settings.ENABLE_CACHE
        self._cache_max_size = 1000

    def _get_local_model(self):
        if self._local_model is None:
            try:
                from sentence_transformers import SentenceTransformer
                model_name = settings.EMBEDDING_MODEL
                cache_folder = settings.MODEL_CACHE_DIR
                self._local_model = SentenceTransformer(
                    model_name, cache_folder=cache_folder
                )
                logger.info(f"Loaded local embedding model: {model_name}")
            except Exception as e:
                logger.warning(f"Failed to load local embedding model: {e}")
                raise
        return self._local_model

    def _get_openai_client(self):
        if self._openai_client is None and settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                self._openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI embedding client initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {e}")
        return self._openai_client

    def _embed_local(self, texts: list[str]) -> list[list[float]]:
        model = self._get_local_model()
        embeddings = model.encode(texts, normalize_embeddings=True)
        return embeddings.tolist()

    def _embed_openai(self, texts: list[str]) -> list[list[float]]:
        client = self._get_openai_client()
        if not client:
            raise RuntimeError("OpenAI client not available")
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=texts,
        )
        return [item.embedding for item in response.data]

    def embed_texts(self, texts: list[str], use_openai: Optional[bool] = None) -> list[list[float]]:
        if not texts:
            return []

        if use_openai is None:
            use_openai = bool(settings.OPENAI_API_KEY and settings.FALLBACK_OPENAI)

        cached_results = []
        texts_to_embed = []
        text_indices = []

        for i, text in enumerate(texts):
            if self._cache_enabled and text in self._cache:
                cached_results.append((i, self._cache[text]))
            else:
                texts_to_embed.append(text)
                text_indices.append(i)

        result_map = dict(cached_results)

        if texts_to_embed:
            try:
                if use_openai:
                    embeddings = self._embed_openai(texts_to_embed)
                else:
                    embeddings = self._embed_local(texts_to_embed)
            except Exception as e:
                logger.warning(f"Primary embedding failed ({use_openai=}), falling back: {e}")
                try:
                    embeddings = self._embed_local(texts_to_embed)
                except Exception as e2:
                    logger.error(f"Fallback embedding also failed: {e2}")
                    raise RuntimeError(f"All embedding methods failed. Primary: {e}, Fallback: {e2}") from e2

            for idx, emb in zip(text_indices, embeddings):
                result_map[idx] = emb
                if self._cache_enabled:
                    self._cache[texts[idx]] = emb
                    if len(self._cache) > self._cache_max_size:
                        self._cache.popitem(last=False)

        return [result_map[i] for i in range(len(texts))]

    def embed_text(self, text: str, use_openai: Optional[bool] = None) -> list[float]:
        return self.embed_texts([text], use_openai=use_openai)[0]

    def cosine_similarity(self, a: list[float], b: list[float]) -> float:
        a_np = np.array(a, dtype=np.float32)
        b_np = np.array(b, dtype=np.float32)
        norm_a = np.linalg.norm(a_np)
        norm_b = np.linalg.norm(b_np)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a_np, b_np) / (norm_a * norm_b))

    def batch_cosine_similarity(self, query_emb: list[float], doc_embs: list[list[float]]) -> list[float]:
        q = np.array(query_emb, dtype=np.float32)
        docs = np.array(doc_embs, dtype=np.float32)
        q_norm = np.linalg.norm(q)
        if q_norm == 0:
            return [0.0] * len(doc_embs)
        doc_norms = np.linalg.norm(docs, axis=1)
        doc_norms[doc_norms == 0] = 1.0
        similarities = np.dot(docs, q) / (doc_norms * q_norm)
        return similarities.tolist()

    def clear_cache(self):
        self._cache.clear()
        logger.info("Embedding cache cleared")


embedding_service = EmbeddingService()
