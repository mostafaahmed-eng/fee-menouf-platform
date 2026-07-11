ARG PYTHON_VERSION=3.12-slim

FROM python:${PYTHON_VERSION} AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt .
# Install PyTorch from CPU-only index first (smaller, no CUDA)
RUN pip install --no-cache-dir --default-timeout=1000 --retries=10 torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir --default-timeout=1000 --retries=10 -r requirements.txt

# -----------------------------------------------------------------------------

FROM python:${PYTHON_VERSION}

LABEL maintainer="FEE-MENOUF DevOps <devops@fee-menouf.edu.eg>"
LABEL description="FEE-MENOUF Smart University Platform - AI Engine"

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY . .

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Set proper permissions
RUN chown -R appuser:appgroup /app

USER appuser

HEALTHCHECK --interval=15s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
