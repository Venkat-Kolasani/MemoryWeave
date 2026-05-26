# Payment Service Recovery Runbook (Partial)

## Health Check
- `GET /health` on payment-api port 8080 — expect `{"status":"ok"}`

## Common Steps
1. Inspect Stripe webhook dashboard for failed events (last 15 min)
2. Restart payment-worker: `kubectl rollout restart deploy/payment-worker -n prod`
3. Verify Redis idempotency pool (`REDIS_URL`)

## Escalation
- Billing DB credentials: A. Patel only (no backup documented)
