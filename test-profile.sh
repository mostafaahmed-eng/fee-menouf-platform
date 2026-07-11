#!/bin/bash
API="http://localhost:4000/api/v1"

# Login as admin
RESP=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fee-menouf.edu.eg","password":"Demo@12345"}')

echo "Login user ID:"
echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['user']['id'])"
echo "Login role:"
echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['user']['role'])"

TOKEN=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

echo ""
echo "Decoded JWT payload:"
echo "$TOKEN" | cut -d'.' -f2 | python3 -c "import sys,base64,json; d=json.loads(base64.b64decode(sys.stdin.read()+'==')); print(json.dumps(d,indent=2))"

echo ""
echo "--- Profile call ---"
curl -s "$API/auth/profile" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
if d.get('success'):
    u=d['data']
    print(f'Profile user ID: {u[\"id\"]}')
    print(f'Profile role: {u[\"role\"]}')
    print(f'Profile email: {u[\"email\"]}')
else:
    print(f'Error: {d}')
"
