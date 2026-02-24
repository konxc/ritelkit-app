#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:4321}"

echo "[smoke] BASE_URL=${BASE_URL}"

status_code() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  if [[ -n "$body" ]]; then
    curl -sS -o /tmp/smoke-body.txt -w "%{http_code}" \
      -X "$method" \
      -H "Content-Type: application/json" \
      --data "$body" \
      "${BASE_URL}${path}"
  else
    curl -sS -o /tmp/smoke-body.txt -w "%{http_code}" \
      -X "$method" \
      "${BASE_URL}${path}"
  fi
}

assert_code() {
  local got="$1"
  local want="$2"
  local label="$3"
  if [[ "$got" != "$want" ]]; then
    echo "[smoke][FAIL] ${label}: expected ${want}, got ${got}"
    echo "--- body ---"
    cat /tmp/smoke-body.txt || true
    exit 1
  fi
  echo "[smoke][OK] ${label}: ${got}"
}

code="$(status_code GET "/api/health")"
assert_code "$code" "200" "health basic"

code="$(status_code GET "/api/order-status")"
assert_code "$code" "400" "order-status validation"

code="$(status_code POST "/api/checkout" '{"customer_name":"","customer_phone":"","items":[]}')"
assert_code "$code" "400" "checkout validation"

code="$(status_code POST "/api/midtrans/webhook" '{"order_id":"RS-0","status_code":"200","gross_amount":"10000","signature_key":"bad","transaction_status":"settlement"}')"
assert_code "$code" "403" "webhook signature validation"

echo "[smoke] done"
