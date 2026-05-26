# Deploy System Runbook (Partial)

**Owner:** T. Walsh (DevOps)  
**System:** Deploy System (`deploy-system` service, ArgoCD + custom promotion hooks)  
**Last updated:** 2024-03-15  
**Status:** Incomplete — known tribal knowledge gaps

---

## Overview

The Deploy System orchestrates production releases for Acme Corp services including **payment-worker**, **payment-api**, **auth-service**, and **analytics**. Most teams use standard Helm charts; payment and auth have custom promotion gates.

**Related systems:** Payment API, Auth Service, Deploy System → depends on **Data Bus** for deploy event streaming.

---

## Prerequisites

- `kubectl` access to `prod` namespace (requires `deploy-operator` RBAC role)
- ArgoCD UI access: `https://deploy.acme.internal`
- Slack `#deploys` channel notifications enabled

---

## Standard Deploy Flow

### Step 1: Pre-deploy checks

1. Confirm no active P0/P1 in `#incidents` affecting target service.
2. Verify last green build on `main` in GitHub (`acme/deploy-pipelines`).
3. For **payment-api** or **payment-worker**: check with **A. Patel** before prod promotion (business-hours rule).

### Step 2: Staging promotion

```bash
argocd app sync payment-worker-staging
argocd app wait payment-worker-staging --health
```

Run smoke tests documented per service. Auth smoke tests: see `docs/auth-service.md` (R. Chen).

### Step 3: Production promotion

```bash
argocd app sync payment-worker-prod --prune
```

Watch Datadog dashboard `deploy-system-promotions` for rollback signals.

### Step 4: Post-deploy environment binding

Apply production environment variables to the deployment ConfigMap:

```bash
kubectl edit configmap payment-worker-env -n prod
```

**Step 4: [only Walsh knows the exact env var names here]**

Known to exist but **not documented**:

- Stripe signing secret reference (vault path unknown to team)
- Internal `DEPLOY_PROMOTION_KEY` for Argo hook authentication
- Region-specific `PAYMENT_GATEWAY_URL` overrides

> **Risk note:** J. Brooks flagged in risk review — "Deploy System runbook has 3 undocumented steps known only to T. Walsh." If Walsh is unavailable, promotion may succeed but runtime config can be wrong.

### Step 5: Rollback

```bash
argocd app rollback payment-worker-prod <revision>
```

For **payment-api** rollbacks involving billing schema: escalate to **A. Patel** — partial rollback runbook exists, billing DB step not documented.

---

## Service-Specific Notes

| Service | Deploy owner | Backup | Docs |
|---------|--------------|--------|------|
| payment-worker | T. Walsh (pipeline) | A. Patel (runtime) | Partial |
| payment-api | T. Walsh | A. Patel | Partial |
| auth-service | T. Walsh | R. Chen | `auth-service.md` |
| analytics | M. Kim | M. Kim | Complete |

---

## Known Gaps (intentional for demo)

1. Step 4 env var names — tribal knowledge (T. Walsh only).
2. Payment billing DB credential rotation — not in deploy pipeline; manual (A. Patel).
3. Hotfix path for payment-worker OOM — Walsh can tag image, Patel must validate Stripe queue.

---

## Escalation

| Scenario | Contact |
|----------|---------|
| Deploy pipeline failure | T. Walsh |
| Payment prod incident during deploy | A. Patel |
| Auth prod incident | R. Chen |
| Incident process | J. Brooks |
