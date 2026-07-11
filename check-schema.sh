#!/bin/bash
docker exec fee-menouf-postgres psql -U postgres -d fee_menouf_platform -c "\dn"
echo "---"
docker exec fee-menouf-postgres psql -U postgres -d fee_menouf_platform -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema') ORDER BY table_schema, table_name;"
