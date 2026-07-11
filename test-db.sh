#!/bin/bash
docker exec fee-menouf-postgres psql -U fee_menouf_user -d fee_menouf -h localhost -c "SELECT id, email, role, is_active FROM public.users ORDER BY created_at;"
