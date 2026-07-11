#!/bin/bash
docker exec fee-menouf-postgres psql -U postgres -c "SELECT rolname FROM pg_roles;"
docker exec fee-menouf-postgres psql -U postgres -c "\l"
