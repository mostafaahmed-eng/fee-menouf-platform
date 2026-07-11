ARG PG_MAJOR=16

FROM postgres:${PG_MAJOR}-bookworm AS builder

LABEL maintainer="FEE-MENOUF DevOps <devops@fee-menouf.edu.eg>"
LABEL description="PostgreSQL 16 with pgvector extension for FEE-MENOUF Smart University Platform"

# Install build dependencies for pgvector
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        git \
        postgresql-server-dev-${PG_MAJOR} \
        ca-certificates \
        pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Build pgvector from source
RUN git clone --branch v0.7.4 --depth 1 https://github.com/pgvector/pgvector.git /tmp/pgvector \
    && cd /tmp/pgvector \
    && make \
    && make install \
    && rm -rf /tmp/pgvector

# -----------------------------------------------------------------------------

FROM postgres:${PG_MAJOR}-bookworm

LABEL maintainer="FEE-MENOUF DevOps <devops@fee-menouf.edu.eg>"
LABEL description="PostgreSQL 16 with pgvector for FEE-MENOUF Smart University Platform"

# Copy pgvector extension from builder stage
COPY --from=builder /usr/share/postgresql/${PG_MAJOR}/extension/vector* \
    /usr/share/postgresql/${PG_MAJOR}/extension/
COPY --from=builder /usr/lib/postgresql/${PG_MAJOR}/lib/vector* \
    /usr/lib/postgresql/${PG_MAJOR}/lib/

# Install additional tools
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-contrib-${PG_MAJOR} \
        postgresql-${PG_MAJOR}-partman \
        curl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy initialization script
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql

# Add custom PostgreSQL configuration
RUN echo "\n# ------------------------------------------------------------------\n\
# FEE-MENOUF Smart University Platform - Custom Configuration\n\
# ------------------------------------------------------------------\n\
\n\
# Connection settings\n\
max_connections = 200\n\
superuser_reserved_connections = 10\n\
\n\
# Memory settings\n\
shared_buffers = '256MB'\n\
effective_cache_size = '768MB'\n\
work_mem = '16MB'\n\
maintenance_work_mem = '64MB'\n\
wal_buffers = '16MB'\n\
\n\
# Checkpoint tuning\n\
checkpoint_completion_target = 0.9\n\
checkpoint_timeout = '15min'\n\
max_wal_size = '4GB'\n\
min_wal_size = '1GB'\n\
\n\
# Query planner\n\
random_page_cost = 1.1\n\
effective_io_concurrency = 200\n\
default_statistics_target = 500\n\
\n\
# Logging\n\
log_destination = 'csvlog'\n\
logging_collector = on\n\
log_directory = '/var/log/postgresql'\n\
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'\n\
log_rotation_age = '1d'\n\
log_rotation_size = '100MB'\n\
log_min_duration_statement = 500\n\
log_checkpoints = on\n\
log_connections = on\n\
log_disconnections = on\n\
log_lock_waits = on\n\
log_temp_files = 0\n\
\n\
# Autovacuum tuning\n\
autovacuum_vacuum_scale_factor = 0.01\n\
autovacuum_analyze_scale_factor = 0.005\n\
autovacuum_vacuum_threshold = 50\n\
autovacuum_analyze_threshold = 25\n\
\n\
# Parallel queries\n\
max_parallel_workers = 8\n\
max_parallel_workers_per_gather = 4\n\
parallel_tuple_cost = 0.01\n\
parallel_setup_cost = 100\n\
\n\
# Extensions pre-load\n\
shared_preload_libraries = 'pg_stat_statements'\n" \
>> /usr/share/postgresql/${PG_MAJOR}/postgresql.conf.sample

# Switch to non-root postgres user
USER postgres

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=5 \
    CMD ["pg_isready", "-U", "postgres"]

EXPOSE 5432

CMD ["postgres"]
