#!/usr/bin/env bash
# Test jeweller push notifications with a REAL JWT (not the placeholder YOUR_JWT).
#
# 1. Log into the Jeweller app on your phone/emulator
# 2. Copy the JWT from Metro logs after login, or from SecureStore in dev tools
# 3. Run:
#      JWT='eyJhbGciOi...' ./scripts/test-push-notification.sh
#
# Easier option: open Notifications screen in the app and tap the bell icon (test push).

set -euo pipefail

API_URL="${API_URL:-http://168.144.83.229:5001/api/jeweller}"
JWT="${JWT:-}"

if [ -z "$JWT" ] || [ "$JWT" = "YOUR_JWT" ]; then
  echo "ERROR: Set a real JWT token."
  echo "Usage: JWT='eyJhbGciOi...' $0"
  echo "Or use the in-app test: Notifications screen -> bell icon (top right)."
  exit 1
fi

echo "==> Checking push status..."
curl -sS "$API_URL/notifications/push-status" \
  -H "Authorization: Bearer $JWT" | python3 -m json.tool

echo ""
echo "==> Sending test push..."
curl -sS -X POST "$API_URL/notifications/push-test" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"title":"FCM Test","body":"Working!"}' | python3 -m json.tool
