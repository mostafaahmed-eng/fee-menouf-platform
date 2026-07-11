-- =============================================================================
-- FEE-MENOUF Smart University Platform
-- PostgreSQL Initialization Script
-- =============================================================================
-- This script runs on first container start (docker-entrypoint-initdb.d).
-- It enables required extensions and creates the base schema objects.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

-- Enable pgvector for vector similarity search (AI embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search capabilities
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Enable fuzzy string matching (for search)
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";

-- Enable pgcrypto for cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable table partitioning
CREATE EXTENSION IF NOT EXISTS "pg_partman";

-- Enable statistics for query optimization
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Enable for trigram-based text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable for earth distance calculations (geo queries)
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- ---------------------------------------------------------------------------
-- Schema setup
-- ---------------------------------------------------------------------------

-- Create application schemas
CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION CURRENT_USER;
CREATE SCHEMA IF NOT EXISTS audit AUTHORIZATION CURRENT_USER;
CREATE SCHEMA IF NOT EXISTS ai AUTHORIZATION CURRENT_USER;

-- Set default search path
ALTER DATABASE fee_menouf_platform SET search_path TO app, ai, audit, public;

-- ---------------------------------------------------------------------------
-- Base tables (minimal bootstrap)
-- ---------------------------------------------------------------------------

-- Audit log table (for all DML changes)
CREATE TABLE IF NOT EXISTS audit.audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name      TEXT NOT NULL,
    operation       TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')),
    record_id       TEXT,
    old_data        JSONB,
    new_data        JSONB,
    changed_by      UUID,
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address      INET,
    user_agent      TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON audit.audit_log (changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit.audit_log (table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON audit.audit_log (operation);

-- AI embeddings metadata table
CREATE TABLE IF NOT EXISTS ai.embeddings_meta (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model           TEXT NOT NULL,
    dimensions      INTEGER NOT NULL,
    chunk_size      INTEGER,
    chunk_overlap   INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Application configuration table
CREATE TABLE IF NOT EXISTS app.configurations (
    key             TEXT PRIMARY KEY,
    value           JSONB NOT NULL,
    description     TEXT,
    is_encrypted    BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION app.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log audit entries
CREATE OR REPLACE FUNCTION audit.log_audit_entry()
RETURNS TRIGGER AS $$
DECLARE
    record_id TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        record_id := NEW.id::TEXT;
        INSERT INTO audit.audit_log (table_name, operation, record_id, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, record_id, row_to_json(NEW)::JSONB);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        record_id := NEW.id::TEXT;
        INSERT INTO audit.audit_log (table_name, operation, record_id, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, record_id, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        record_id := OLD.id::TEXT;
        INSERT INTO audit.audit_log (table_name, operation, record_id, old_data)
        VALUES (TG_TABLE_NAME, TG_OP, record_id, row_to_json(OLD)::JSONB);
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Performance tuning
-- ---------------------------------------------------------------------------

-- Enable parallel queries for analytics
ALTER DATABASE fee_menouf_platform SET max_parallel_workers = 8;
ALTER DATABASE fee_menouf_platform SET max_parallel_workers_per_gather = 4;
ALTER DATABASE fee_menouf_platform SET parallel_tuple_cost = 0.01;
ALTER DATABASE fee_menouf_platform SET parallel_setup_cost = 100;

-- Enable JIT for complex queries
ALTER DATABASE fee_menouf_platform SET jit = on;
ALTER DATABASE fee_menouf_platform SET jit_above_cost = 100000;
ALTER DATABASE fee_menouf_platform SET jit_inline_above_cost = 50000;
ALTER DATABASE fee_menouf_platform SET jit_optimize_above_cost = 50000;

COMMIT;
