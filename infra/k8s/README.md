# Kubernetes Deployment Foundation

This folder is the initial production Kubernetes manifest set for `T036`. It is intentionally provider-neutral and expects managed PostgreSQL plus managed Redis in production.

## Apply Order

```bash
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secret.example.yaml
# Or, in production:
# kubectl apply -f external-secret.example.yaml
kubectl apply -f serviceaccount.yaml
kubectl apply -f backend.yaml
kubectl apply -f web.yaml
kubectl apply -f ingress.yaml
kubectl apply -f hpa.yaml
kubectl apply -f pdb.yaml
kubectl apply -f networkpolicy.yaml
kubectl apply -f year-review-cronjob.yaml
```

Run migrations before backend rollout:

```bash
kubectl apply -f migration-job.yaml
kubectl -n bloodsugar wait --for=condition=complete job/bloodsugar-migrate --timeout=120s
```

The year-review CronJob runs once per year on January 1:

```bash
kubectl apply -f year-review-cronjob.yaml
kubectl -n bloodsugar create job --from=cronjob/bloodsugar-year-review-snapshots year-review-snapshots-manual
```

The command defaults to the previous calendar year and only generates missing snapshots:

```bash
python -m app.jobs.generate_year_review_snapshots
```

## Production Assumptions

- Backend image: `registry.example.com/bloodsugar/backend:<tag>`
- Web image: `registry.example.com/bloodsugar/web:<tag>`
- PostgreSQL: managed Cloud SQL / RDS / Aurora, not an in-cluster single pod.
- Redis: managed Memorystore / ElastiCache or an operator-managed Redis StatefulSet.
- Secrets: use External Secrets Operator with Google Secret Manager, AWS Secrets Manager, or Vault. `secret.example.yaml` is only a local shape example.
- PgBouncer: run as a sidecar/deployment or use a managed connection pooler before scaling backend replicas heavily.

## Required Secrets

```text
DATABASE_URL
REDIS_URL
```

## PgBouncer Contract

Backend replicas must not connect directly to PostgreSQL without a pooling plan once HPA is enabled. Use one of:

- managed connection pooling from the cloud provider
- PgBouncer deployment inside the private network
- PgBouncer sidecar only when lifecycle/credential reload behavior is explicitly tested

`DATABASE_URL` should point to the pooler endpoint when pooling is enabled.

## Redis / Worker Contract

`REDIS_URL` is reserved for cache, rate limit, session, and future background jobs. Production Redis should be:

- managed Memorystore / ElastiCache where possible
- or operator-managed StatefulSet if Redis must run in Kubernetes

Queue workers should be a separate deployment with their own HPA once background jobs are introduced.

## CI/CD Deploy Plan

Recommended flow:

1. Run tests, lint, typecheck, migration check, dependency scan, and image scan.
2. Build immutable backend and web image tags.
3. Push images to Artifact Registry or ECR using OIDC/workload identity, not static cloud keys.
4. Run `migration-job.yaml` with the new backend image.
5. Deploy backend and web with rolling updates.
6. Roll back by image tag if probes fail; review migration reversibility before rollback.

## Required Checks

Run the local static guard before changing these manifests:

```bash
python scripts/verify_k8s_manifests.py
```

- Backend `/healthz` liveness probe.
- Backend `/readyz` readiness probe.
- HPA on backend and worker when workers are added.
- PDB for backend and web.
- NetworkPolicy restricts default ingress.
- Container security contexts run non-root and drop privilege escalation.
- Year-review snapshot CronJob runs `python -m app.jobs.generate_year_review_snapshots` on January 1 with `concurrencyPolicy: Forbid`.
