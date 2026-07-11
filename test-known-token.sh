#!/bin/bash
API="http://localhost:4000/api/v1"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWExMmMwMi1jZmFhLTQ3ZjgtYTE2Ni1lYTE3YTY2M2NjMDMiLCJlbWFpbCI6ImFkbWluQGZlZS1tZW5vdWYuZWR1LmVnIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzgzNTEwODA3LCJleHAiOjE3ODM1MTE3MDcsImF1ZCI6ImZlZS1tZW5vdWYtcGxhdGZvcm0iLCJpc3MiOiJmZWUtbWVub3VmLXVuaXZlcnNpdHkifQ.SKDavLtrjB8cMjNdE48T6SoTx4GPkk_Hvo-6H7VKFMI"

echo "=== Testing with known admin token ==="
echo "Token sub (user ID): 65a12c02-cfaa-47f8-a166-ea17a663cc03"
echo "Expected: admin@fee-menouf.edu.eg (ADMIN)"

echo ""
FULL=$(curl -s "$API/auth/profile" -H "Authorization: Bearer $TOKEN")
echo "Full profile response:"
echo "$FULL" | python3 -m json.tool

echo ""
echo "Now trying to GET /users (expect ADMIN access):"
curl -s "$API/users" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Success:', d.get('success'), 'Count:', len(d.get('data',[])))"
