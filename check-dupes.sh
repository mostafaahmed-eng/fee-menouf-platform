#!/bin/bash
echo "=== Checking for users table in both schemas ==="
docker exec fee-menouf-postgres psql -U postgres -d fee_menouf_platform -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name='users';"
echo ""
echo "=== Search path ==="
docker exec fee-menouf-postgres psql -U postgres -d fee_menouf_platform -c "SHOW search_path;"
echo ""
echo "=== Check public.users ==="
docker exec fee-menouf-postgres psql -U postgres -d fee_menouf_platform -c "SELECT count(*) FROM public.users;" 2>&1
echo ""
echo "=== Check app.users schema ==="
docker exec fee-menouf-postgres psql -U postgres -d fee_menouf_platform -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='app' AND table_name='users';"
