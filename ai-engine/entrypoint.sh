#!/bin/sh
set -e

# Fix permissions on data directories (Docker volumes may be root-owned)
if [ -d /app/data ]; then
    chown -R appuser:appgroup /app/data 2>/dev/null || true
fi

exec "$@"
