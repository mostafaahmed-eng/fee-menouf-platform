import time
import logging
from typing import Optional
from collections import defaultdict

from app.config import settings

logger = logging.getLogger("ai_engine.rate_limiter")


class MemoryRateLimiter:
    def __init__(self):
        self._buckets: dict[str, list[float]] = defaultdict(list)

    def check(self, key: str, limit: Optional[int] = None, window: Optional[int] = None) -> bool:
        now = time.time()
        limit = limit or settings.RATE_LIMIT_PER_USER
        window = window or settings.RATE_LIMIT_WINDOW

        timestamps = self._buckets[key]
        cutoff = now - window
        timestamps[:] = [t for t in timestamps if t > cutoff]

        if len(timestamps) >= limit:
            return False

        timestamps.append(now)
        return True

    def get_remaining(self, key: str, limit: Optional[int] = None, window: Optional[int] = None) -> int:
        now = time.time()
        limit = limit or settings.RATE_LIMIT_PER_USER
        window = window or settings.RATE_LIMIT_WINDOW
        timestamps = self._buckets[key]
        cutoff = now - window
        timestamps[:] = [t for t in timestamps if t > cutoff]
        return max(0, limit - len(timestamps))


class RedisRateLimiter:
    def __init__(self, redis_client):
        self._redis = redis_client
        self._use_redis = True

    def check(self, key: str, limit: Optional[int] = None, window: Optional[int] = None) -> bool:
        try:
            limit = limit or settings.RATE_LIMIT_PER_USER
            window = window or settings.RATE_LIMIT_WINDOW
            now = int(time.time())
            window_start = now - window

            self._redis.zremrangebyscore(key, 0, window_start)
            count = self._redis.zcard(key)

            if count >= limit:
                return False

            self._redis.zadd(key, {str(now): now})
            self._redis.expire(key, window)
            return True
        except Exception as e:
            logger.warning(f"Redis rate limiter error, falling back: {e}")
            return True

    def get_remaining(self, key: str, limit: Optional[int] = None, window: Optional[int] = None) -> int:
        try:
            limit = limit or settings.RATE_LIMIT_PER_USER
            window = window or settings.RATE_LIMIT_WINDOW
            now = int(time.time())
            window_start = now - window
            self._redis.zremrangebyscore(key, 0, window_start)
            count = self._redis.zcard(key)
            return max(0, limit - count)
        except Exception:
            return limit


def get_rate_limiter(redis_client=None):
    if redis_client:
        try:
            return RedisRateLimiter(redis_client)
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Using in-memory rate limiter.")
    return MemoryRateLimiter()
