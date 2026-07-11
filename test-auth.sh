#!/bin/bash
API="http://localhost:4000/api/v1"

echo "=== Testing Authentication ==="

# Login as admin
echo ""
echo "--- Login as admin ---"
ADMIN_RESP=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fee-menouf.edu.eg","password":"Demo@12345"}')
echo "$ADMIN_RESP" | python3 -m json.tool 2>/dev/null || echo "$ADMIN_RESP"

ADMIN_TOKEN=$(echo "$ADMIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('accessToken',''))" 2>/dev/null)
echo ""
echo "Token: ${ADMIN_TOKEN:0:80}..."

# Test profile
echo ""
echo "--- Profile ---"
curl -s "$API/auth/profile" -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool 2>/dev/null

# Test refresh token
echo ""
echo "--- Refresh Token ---"
REFRESH_TOKEN=$(echo "$ADMIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('refreshToken',''))" 2>/dev/null)
curl -s -X POST "$API/auth/refresh" -H "Content-Type: application/json" -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | python3 -m json.tool 2>/dev/null

# Test wrong password
echo ""
echo "--- Wrong Password (expect 401) ---"
curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@fee-menouf.edu.eg","password":"wrong"}' | python3 -m json.tool 2>/dev/null

# Test non-existent user
echo ""
echo "--- Non-existent User (expect 401) ---"
curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"email":"nobody@test.com","password":"test"}' | python3 -m json.tool 2>/dev/null

echo ""
echo "=== Authentication tests complete ==="

# Save tokens for later use
echo "$ADMIN_TOKEN" > /tmp/admin_token.txt
echo "$REFRESH_TOKEN" > /tmp/admin_refresh.txt
