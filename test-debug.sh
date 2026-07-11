#!/bin/bash
API="http://localhost:4000/api/v1"

echo "=== Fresh login as admin ==="
RESP=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fee-menouf.edu.eg","password":"Demo@12345"}')
TOKEN=$(echo "$RESP" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("data",{}).get("accessToken",""))')
echo "Token obtained: ${#TOKEN} chars"

echo ""
echo "Token payload:"
echo "$TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null; echo ""

echo ""
echo "=== Calling /auth/profile ==="
curl -s "$API/auth/profile" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
if d.get('success'):
    u=d['data']
    print(f'  id: {u[\"id\"]}')
    print(f'  email: {u[\"email\"]}')
    print(f'  role: {u[\"role\"]}')
else:
    print(f'  ERROR: {d.get(\"message\", d)}')
"

echo ""
echo "=== Calling /users (UsersController) ==="
curl -s "$API/users" -H "Authorization: Bearer $TOKEN" -H "limit: 1" | python3 -c "
import sys,json
d=json.load(sys.stdin)
if d.get('success'):
    users=d.get('data',[])
    print(f'  Got {len(users)} users')
    if users:
        print(f'  First user: {users[0].get(\"id\")} {users[0].get(\"email\")} ({users[0].get(\"role\")})')
else:
    print(f'  ERROR: {d.get(\"message\", d)}')
"

echo ""
echo "=== Calling /auth/users (AuthController) ==="
curl -s "$API/auth/users" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
if d.get('success'):
    users=d.get('data',[])
    print(f'  Got {len(users)} users')
    if users:
        print(f'  First user: {users[0].get(\"id\")} {users[0].get(\"email\")} ({users[0].get(\"role\")})')
else:
    print(f'  ERROR: {d.get(\"message\", d)}')
"
