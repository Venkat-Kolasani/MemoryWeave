# Auth Service — Technical Runbook

**Author:** R. Chen (Backend Engineer)  
**System:** auth-service (`auth-service` deployment, namespace `prod`)  
**Version:** 3.8.2  
**Last updated:** 2024-03-29

---

## Architecture

The Auth Service is a P0 system providing OAuth2 token issuance, refresh, and validation for all Acme Corp products. It sits upstream of **Payment API** (payment-api calls `/oauth/token` for service-to-service refresh) and **Analytics** (beta).

```
Client → API Gateway → auth-service → PostgreSQL (auth_db)
                    ↘ Redis (session cache, TTL 900s)
                    ↘ Data Bus (Kafka topic auth.events)
```

**Owners:** R. Chen (primary), **A. Patel** (payment integration path only)  
**Dependents:** Payment API, mobile apps, internal admin tools (6 downstream per knowledge graph)

---

## Configuration

| Variable | Description | Secret |
|----------|-------------|--------|
| `JWT_ISSUER` | `https://auth.acme.com` | No |
| `JWT_SIGNING_KEY_ID` | Active kid, rotate quarterly | Vault |
| `AUTH_DB_URL` | PostgreSQL connection | Vault |
| `REDIS_SESSION_URL` | Session cache cluster | Vault |
| `TOKEN_REFRESH_TTL` | 86400 (24h) | No |
| `CLOCK_SKEW_TOLERANCE` | 5 seconds | No |

---

## Health Checks

```bash
# Liveness
curl -s https://auth.acme.com/health | jq .
# Expected: {"status":"ok","db":"ok","redis":"ok"}

# Readiness (includes JWT signer)
curl -s https://auth.acme.com/ready | jq .
```

---

## Common Operations

### Rotate JWT signing keys

```bash
auth-cli keys rotate --env prod --kid prod-YYYY-MM
```

Invalidate active refresh tokens if validation errors spike. Reference incident **P-3882** (2024-03-28, 22 min, R. Chen).

### Drain pod with clock skew

```bash
kubectl get pods -n prod -l app=auth-service
kubectl exec -it <pod> -- chronyc tracking
# If offset > 5s: cordon node, delete pod, verify reschedule
```

### Scale for traffic

```bash
kubectl scale deployment auth-service -n prod --replicas=8
```

HPA policy: CPU 70%, min 4, max 12 replicas.

---

## Incident: Token refresh failures

**Symptoms:** Elevated 401 on `/oauth/token`, log line `invalid token: iat in the future`  
**Severity:** P1 typical  
**Resolver:** R. Chen (primary oncall)

1. Check NTP drift on auth-service nodes (see P-3882 timeline).
2. Rotate signing keys if drift corrected but errors persist.
3. Confirm **payment-api** downstream — refresh latency may spike; coordinate with A. Patel if payment P0 active.

**Backup oncall:** J. Brooks schedules weekend coverage; Chen has not trained backup on solo P0 auth recovery independently (risk item).

---

## Dependencies

| System | Relationship | Notes |
|--------|--------------|-------|
| Payment API | Downstream consumer | Token refresh during checkout |
| Data Bus | Publishes auth.events | M. Kim owns consumer lag alerts |
| Deploy System | Deployed via ArgoCD | T. Walsh — partial env docs |

---

## API Reference (internal)

### POST /oauth/token

Refresh grant. Body: `grant_type=refresh_token&refresh_token=...`  
Rate limit: 100 req/s per client_id.

### GET /.well-known/jwks.json

Public keys for validation. CDN cached 5 min.

---

## Runbook maintenance

- [x] P-3882 postmortem actions merged  
- [x] NTP drift alert  
- [ ] Backup owner solo incident drill (scheduled with J. Brooks)  
- [ ] Cross-link payment-api auth dependency with Patel's partial payment runbook

**Contact:** R. Chen (`#auth-team`), escalate P0 auth to PagerDuty `auth-service-oncall`
