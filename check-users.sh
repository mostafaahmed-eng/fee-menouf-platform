#!/bin/bash
docker exec fee-menouf-postgres psql -U postgres -d fee_menouf_platform -c "SELECT id, email, role, is_active FROM public.users ORDER BY created_at;"
echo "---"
docker exec fee-menouf-postgres psql -U postgres -d fee_menouf_platform -c "SELECT id, email, role FROM public.users WHERE id='65a12c02-cfaa-47f8-a166-ea17a663cc03';"
echo "---"
docker exec fee-menouf-postgres psql -U postgres -d fee_menouf_platform -c "SELECT id, email, role FROM public.users WHERE id='06d62b96-087b-4fd6-9526-1c548159f300';"
