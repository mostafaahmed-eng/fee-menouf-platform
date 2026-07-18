import json
import logging
from typing import Optional
from datetime import datetime

logger = logging.getLogger("ai_engine.session_store")


class RedisSessionStore:
    """Redis-backed session store for conversation persistence."""

    def __init__(self, redis_url: str = "redis://localhost:6379/0", ttl: int = 86400):
        self._redis_url = redis_url
        self._ttl = ttl
        self._client = None
        self._memory_fallback = {}

    def _get_client(self):
        if self._client is None:
            try:
                import redis
                self._client = redis.from_url(self._redis_url, decode_responses=True)
                self._client.ping()
                logger.info("Connected to Redis for session storage")
            except Exception as e:
                logger.warning(f"Redis unavailable, using in-memory fallback: {e}")
                self._client = False
        return self._client if self._client is not False else None

    def _key(self, session_id: str) -> str:
        return f"ai:session:{session_id}"

    def get_or_create(self, session_id: str) -> dict:
        client = self._get_client()
        if client:
            try:
                data = client.get(self._key(session_id))
                if data:
                    return json.loads(data)
                session = {
                    "history": [],
                    "created_at": datetime.utcnow().isoformat(),
                    "token_usage": {"prompt": 0, "completion": 0, "total": 0},
                }
                client.setex(self._key(session_id), self._ttl, json.dumps(session))
                return session
            except Exception as e:
                logger.error(f"Redis error in get_or_create: {e}")

        if session_id not in self._memory_fallback:
            self._memory_fallback[session_id] = {
                "history": [],
                "created_at": datetime.utcnow().isoformat(),
                "token_usage": {"prompt": 0, "completion": 0, "total": 0},
            }
        return self._memory_fallback[session_id]

    def get_history(self, session_id: str) -> list:
        session = self.get_or_create(session_id)
        return session.get("history", [])

    def add_message(self, session_id: str, role: str, content: str, tokens: int = 0):
        session = self.get_or_create(session_id)
        session["history"].append({
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "tokens": tokens,
        })
        session["history"] = session["history"][-50:]

        client = self._get_client()
        if client:
            try:
                client.setex(self._key(session_id), self._ttl, json.dumps(session))
            except Exception as e:
                logger.error(f"Redis error in add_message: {e}")
        else:
            self._memory_fallback[session_id] = session

    def clear_history(self, session_id: str):
        client = self._get_client()
        if client:
            try:
                client.delete(self._key(session_id))
            except Exception as e:
                logger.error(f"Redis error in clear_history: {e}")
        if session_id in self._memory_fallback:
            del self._memory_fallback[session_id]

    def update_token_usage(self, session_id: str, prompt_tokens: int, completion_tokens: int):
        session = self.get_or_create(session_id)
        session["token_usage"]["prompt"] += prompt_tokens
        session["token_usage"]["completion"] += completion_tokens
        session["token_usage"]["total"] += prompt_tokens + completion_tokens

        client = self._get_client()
        if client:
            try:
                client.setex(self._key(session_id), self._ttl, json.dumps(session))
            except Exception as e:
                logger.error(f"Redis error in update_token_usage: {e}")
        else:
            self._memory_fallback[session_id] = session

    def delete_session(self, session_id: str):
        self.clear_history(session_id)

    def list_sessions(self, prefix: str = "") -> list:
        client = self._get_client()
        if client:
            try:
                pattern = f"ai:session:{prefix}*" if prefix else "ai:session:*"
                keys = client.keys(pattern)
                sessions = []
                for key in keys:
                    data = client.get(key)
                    if data and not key.endswith(":history"):
                        session = json.loads(data)
                        sessions.append({
                            "id": key.replace("ai:session:", ""),
                            "created_at": session.get("created_at"),
                            "message_count": len(session.get("history", [])),
                        })
                return sessions
            except Exception as e:
                logger.error(f"Redis error in list_sessions: {e}")
        return []


class SessionStore:
    """Legacy interface wrapper for backward compatibility."""

    def __init__(self):
        from app.config import settings
        self._store = RedisSessionStore(
            redis_url=settings.REDIS_URL,
            ttl=settings.CACHE_TTL,
        )

    def get_or_create(self, session_id: str) -> dict:
        return self._store.get_or_create(session_id)

    def get_history(self, session_id: str) -> list:
        return self._store.get_history(session_id)

    def add_message(self, session_id: str, role: str, content: str, tokens: int = 0):
        self._store.add_message(session_id, role, content, tokens)

    def clear_history(self, session_id: str):
        self._store.clear_history(session_id)

    def update_token_usage(self, session_id: str, prompt_tokens: int, completion_tokens: int):
        self._store.update_token_usage(session_id, prompt_tokens, completion_tokens)
