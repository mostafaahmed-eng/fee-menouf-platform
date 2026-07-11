#!/bin/bash
API="http://localhost:4000/api/v1"

echo "=== Test 1: Login as admin and check profile ==="
RESP=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fee-menouf.edu.eg","password":"Demo@12345"}')
echo "Login response role: $(echo "$RESP" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("data",{}).get("user",{}).get("role","N/A"))')"
echo "Login response id: $(echo "$RESP" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("data",{}).get("user",{}).get("id","N/A"))')"

TOKEN=$(echo "$RESP" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("data",{}).get("accessToken",""))')
echo "Token length: ${#TOKEN}"

echo ""
echo "Profile response role: $(curl -s "$API/auth/profile" -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("data",{}).get("role","N/A"))')"
echo "Profile response id: $(curl -s "$API/auth/profile" -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("data",{}).get("id","N/A"))')"

echo ""
echo "=== Test 2: Login as superadmin and check profile ==="
RESP2=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@fee-menouf.edu.eg","password":"Demo@12345"}')
echo "Login response role: $(echo "$RESP2" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("data",{}).get("user",{}).get("role","N/A"))')"
echo "Login response id: $(echo "$RESP2" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("data",{}).get("user",{}).get("id","N/A"))')"

TOKEN2=$(echo "$RESP2" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("data",{}).get("accessToken",""))')

echo ""
echo "Profile response role: $(curl -s "$API/auth/profile" -H "Authorization: Bearer $TOKEN2" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("data",{}).get("role","N/A"))')"
echo "Profile response id: $(curl -s "$API/auth/profile" -H "Authorization: Bearer $TOKEN2" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("data",{}).get("id","N/A"))')"
