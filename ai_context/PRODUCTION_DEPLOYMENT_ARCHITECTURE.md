# 糖錄錄 Production Deployment Architecture

文件定位：本文件描述糖錄錄正式環境的容器化、Kubernetes、自動擴展、資料庫、流量入口、CI/CD、observability 與安全架構。它補齊 production infrastructure 藍圖；本地開發仍以 `docker-compose.yml` 與 `ai_context/DOCKER_DEV_PLAN.md` 為準。

## 1. 設計哲學

目標是支援：

- 自動擴展。
- 容器化部署。
- Kubernetes 後端服務。
- 可擴展資料庫。
- 穩定入口流量管理。
- production-grade backup / restore / migration。
- 可觀測、可回滾、可審計。

核心觀念：

```text
Backend 可以 autoscale，Database 不能像 backend 那樣隨便複製。
```

因此正確設計是：

```text
Backend:
Kubernetes Deployment + HPA + stateless

Database:
Managed PostgreSQL / Aurora / Cloud SQL + read replica + backup + connection pooling

Traffic entry:
Cloudflare / Load Balancer + Ingress Controller

Deployment:
Docker image + Kubernetes YAML / Helm

Development:
docker compose

Production:
Kubernetes + managed database
```

## 2. 整體 Architecture Diagram

```text
User
  |
  v
Cloudflare / CDN / DNS
  |
  v
Cloud Load Balancer
  |
  v
Ingress Controller
  |
  v
Kubernetes Cluster
  |
  +-- Frontend Pods
  |     - React / Next.js
  |     - can also be CDN/static hosting outside K8s
  |
  +-- Backend API Pods
  |     - FastAPI or Node.js
  |     - stateless
  |     - HPA autoscale
  |     - /healthz and /readyz
  |
  +-- Worker Pods
  |     - background jobs
  |     - queue consumers
  |     - autoscale by queue depth
  |
  +-- Redis Client Access
  |     - managed Redis preferred
  |     - cache / rate limit / session / queue
  |
  +-- PgBouncer
        |
        v
Managed PostgreSQL / Aurora / Cloud SQL
  |
  +-- Primary DB
  +-- Read Replica
  +-- Backup / PITR
  +-- Encrypted storage
```

Path routing：

```text
/api -> backend service
/   -> frontend service or CDN/static app
```

## 3. Component Responsibilities

### Frontend

Responsibilities：

- React / Next.js UI。
- Docker image for Kubernetes deployment if not using CDN/static hosting。
- Environment-configurable API endpoint。
- Health-aware API client behavior。
- No secrets in frontend bundle。

Production options：

- Static hosting / CDN preferred for purely static build。
- Kubernetes frontend Deployment acceptable when SSR, internal routing, or unified ingress is needed。

### Backend

Responsibilities：

- FastAPI or Node.js API service。
- Stateless request handling。
- Session / state stored in Redis or database, not process memory。
- Health endpoints：
  - `/healthz` for liveness。
  - `/readyz` for readiness, including DB / Redis readiness if needed。
- Structured logging。
- `/metrics` Prometheus text endpoint with normalized bounded PHI-safe labels only。
- Distributed tracing。
- Rate-limit decisions through Redis。
- DB access through PgBouncer。

### Worker

Responsibilities：

- Background jobs。
- Queue consumption。
- Report generation。
- Sync jobs。
- Email / notification dispatch。
- Future AI fallback jobs。

Scaling：

- Scale separately from backend。
- Prefer queue-depth based autoscaling with KEDA or custom metrics。

### PostgreSQL

Responsibilities：

- Durable system of record。
- Health records, accounts, profiles, subscriptions, audit logs, sync state。
- Managed PostgreSQL preferred：
  - AWS RDS PostgreSQL / Aurora PostgreSQL。
  - GCP Cloud SQL。
  - Azure Database for PostgreSQL。

If running inside Kubernetes：

- Use Postgres Operator：
  - CloudNativePG。
  - Zalando Postgres Operator。
- Do not use a simple single postgres Deployment for production。

### PgBouncer

Responsibilities：

- Connection pooling。
- Prevent backend pod scaling from exhausting DB connections。
- Smooth rolling deploy connection churn。
- Provide stable internal DB endpoint for backend services。

### Redis

Responsibilities：

- Cache。
- Rate limit counters。
- Short-lived sessions if needed。
- Background job queue。
- Distributed locks when required。

Production options：

- Managed Redis preferred, for example AWS ElastiCache / Memorystore。
- If in Kubernetes, use StatefulSet / Redis Operator and plan persistence, failover, backup, and upgrade behavior.

### Ingress / Load Balancer

Responsibilities：

- Stable public traffic entry。
- HTTPS / TLS termination。
- Path-based routing。
- Rate limiting。
- Request size limits。
- Optional WAF integration。

Recommended stack：

- Cloudflare / AWS ALB / GCP Load Balancer in front。
- NGINX Ingress Controller or Traefik inside cluster。

## 4. Kubernetes Resource Design

Required resources：

- Namespace。
- Deployment。
- Service。
- Ingress。
- ConfigMap。
- Secret or ExternalSecret。
- HorizontalPodAutoscaler。
- PodDisruptionBudget。
- Resource requests / limits。
- Liveness probe。
- Readiness probe。
- Rolling update strategy。
- NetworkPolicy。
- ServiceAccount with least privilege。

Recommended namespace：

```text
bloodsugar-prod
bloodsugar-staging
```

## 5. Kubernetes YAML Examples

These examples are reference shapes. Real production should template them with Helm or Kustomize and separate staging / production values.

### 5.1 Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: bloodsugar-prod
  labels:
    app.kubernetes.io/part-of: bloodsugar
    environment: production
```

### 5.2 ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: bloodsugar-config
  namespace: bloodsugar-prod
data:
  APP_ENV: "production"
  LOG_LEVEL: "info"
  BACKEND_CORS_ORIGINS: "https://app.example.com"
  REDIS_HOST: "bloodsugar-redis.example.cache.amazonaws.com"
  PGBOUNCER_HOST: "pgbouncer.bloodsugar-prod.svc.cluster.local"
  OTEL_EXPORTER_OTLP_ENDPOINT: "http://otel-collector.observability.svc.cluster.local:4317"
```

### 5.3 Secret

Prefer External Secrets Operator in production. Native Secret example：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: bloodsugar-secret
  namespace: bloodsugar-prod
type: Opaque
stringData:
  DATABASE_URL: "postgresql+psycopg://app:${DB_PASSWORD}@pgbouncer.bloodsugar-prod.svc.cluster.local:6432/bloodsugar"
  REDIS_URL: "redis://:${REDIS_PASSWORD}@bloodsugar-redis.example.cache.amazonaws.com:6379/0"
```

ExternalSecret shape：

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: bloodsugar-secret
  namespace: bloodsugar-prod
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: bloodsugar-secret
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: bloodsugar/prod/database-url
    - secretKey: REDIS_URL
      remoteRef:
        key: bloodsugar/prod/redis-url
```

### 5.4 ServiceAccount

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: backend
  namespace: bloodsugar-prod
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/bloodsugar-prod-backend
automountServiceAccountToken: true
```

### 5.5 Backend Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: bloodsugar-prod
  labels:
    app: backend
spec:
  replicas: 3
  revisionHistoryLimit: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: backend
      containers:
        - name: backend
          image: ghcr.io/example/bloodsugar-backend:1.0.0
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8000
          envFrom:
            - configMapRef:
                name: bloodsugar-config
            - secretRef:
                name: bloodsugar-secret
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1Gi"
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8000
            initialDelaySeconds: 20
            periodSeconds: 10
            timeoutSeconds: 2
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /readyz
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 2
            failureThreshold: 3
```

### 5.6 Backend Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: bloodsugar-prod
spec:
  type: ClusterIP
  selector:
    app: backend
  ports:
    - name: http
      port: 80
      targetPort: 8000
```

### 5.7 Frontend Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: bloodsugar-prod
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: ghcr.io/example/bloodsugar-frontend:1.0.0
          ports:
            - containerPort: 3000
          env:
            - name: NEXT_PUBLIC_API_BASE_URL
              value: "https://app.example.com/api"
          resources:
            requests:
              cpu: "100m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 20
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
```

### 5.8 Frontend Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: bloodsugar-prod
spec:
  type: ClusterIP
  selector:
    app: frontend
  ports:
    - name: http
      port: 80
      targetPort: 3000
```

### 5.9 Ingress

NGINX Ingress example：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: bloodsugar
  namespace: bloodsugar-prod
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/limit-rps: "20"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  tls:
    - hosts:
        - app.example.com
      secretName: bloodsugar-tls
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

### 5.10 HPA

CPU / memory example：

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend
  namespace: bloodsugar-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 65
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 75
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
```

Request-per-second scaling requires custom metrics adapter, Prometheus Adapter, or KEDA.

### 5.11 Worker Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker
  namespace: bloodsugar-prod
spec:
  replicas: 2
  selector:
    matchLabels:
      app: worker
  template:
    metadata:
      labels:
        app: worker
    spec:
      serviceAccountName: backend
      containers:
        - name: worker
          image: ghcr.io/example/bloodsugar-backend:1.0.0
          command: ["python", "-m", "app.worker"]
          envFrom:
            - configMapRef:
                name: bloodsugar-config
            - secretRef:
                name: bloodsugar-secret
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1Gi"
```

KEDA Redis queue scaler example：

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: worker-redis-queue
  namespace: bloodsugar-prod
spec:
  scaleTargetRef:
    name: worker
  minReplicaCount: 1
  maxReplicaCount: 20
  triggers:
    - type: redis
      metadata:
        address: bloodsugar-redis.example.cache.amazonaws.com:6379
        listName: bloodsugar_jobs
        listLength: "50"
      authenticationRef:
        name: redis-auth
```

### 5.12 PodDisruptionBudget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: backend
  namespace: bloodsugar-prod
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: backend
```

### 5.13 NetworkPolicy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-ingress-only
  namespace: bloodsugar-prod
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8000
  egress:
    - to:
        - namespaceSelector: {}
      ports:
        - protocol: TCP
          port: 6432
        - protocol: TCP
          port: 6379
        - protocol: TCP
          port: 4317
```

## 6. Dockerfile Examples

### 6.1 Backend FastAPI Dockerfile

```dockerfile
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml backend/uv.lock* /app/
RUN pip install --no-cache-dir -U pip \
    && pip install --no-cache-dir .

COPY backend/app /app/app
COPY backend/alembic /app/alembic
COPY backend/alembic.ini /app/alembic.ini

USER 10001

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
```

### 6.2 Next.js Frontend Dockerfile

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY web/package*.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY web/ ./
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
USER 10001
EXPOSE 3000
CMD ["npm", "run", "start"]
```

For static hosting, build static assets and upload to CDN/object storage instead of running frontend pods.

## 7. Docker Compose Local Development Example

Local development can use single-container PostgreSQL and Redis because it is not production. This must not be copied into production as-is.

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: bloodsugar
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d bloodsugar"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    environment:
      APP_ENV: local
      DATABASE_URL: postgresql+psycopg://app:app@db:5432/bloodsugar
      REDIS_URL: redis://redis:6379/0
      BACKEND_CORS_ORIGINS: http://localhost:3000,http://localhost:5173
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

  frontend:
    build:
      context: .
      dockerfile: web/Dockerfile
      args:
        NEXT_PUBLIC_API_BASE_URL: http://localhost:8000/api
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://localhost:8000/api
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## 8. Production Deployment Flow

Recommended flow：

```text
developer pushes branch
-> GitHub Actions PR checks
-> tests / lint / typecheck
-> secret scan / dependency scan / image scan
-> build Docker images
-> push images to registry
-> deploy to staging via Helm
-> run migrations against staging
-> smoke tests
-> manual approval
-> deploy to production via Helm
-> run backward-compatible migrations
-> rollout status check
-> production smoke tests
-> monitor metrics / logs / traces
```

Migration strategy：

- Prefer expand-and-contract migrations。
- Migration job runs before app rollout only when migration is backward compatible。
- Destructive migrations require separate release and backup verification。
- Always backup or verify PITR before risky migration。

Rollback strategy：

- `helm rollback` to previous release。
- Kubernetes Deployment rollout undo for emergency。
- DB rollback is not assumed; design migrations to be backward compatible。
- Feature flags for risky features。
- Canary or blue-green for high-risk releases。

## 9. GitHub Actions CI/CD Example

```yaml
name: deploy

on:
  push:
    branches: [main]

permissions:
  contents: read
  packages: write
  id-token: write

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Backend tests
        run: docker compose run --rm backend pytest -q
      - name: Web tests
        run: docker compose run --rm web npm test -- --run

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Log in to registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and push backend
        uses: docker/build-push-action@v6
        with:
          context: .
          file: backend/Dockerfile
          push: true
          tags: ghcr.io/example/bloodsugar-backend:${{ github.sha }}
      - name: Build and push frontend
        uses: docker/build-push-action@v6
        with:
          context: .
          file: web/Dockerfile
          push: true
          tags: ghcr.io/example/bloodsugar-frontend:${{ github.sha }}

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - name: Configure cloud credentials
        run: echo "Use OIDC federation, not long-lived static keys"
      - name: Helm deploy
        run: |
          helm upgrade --install bloodsugar ./infra/helm/bloodsugar \
            --namespace bloodsugar-staging \
            --create-namespace \
            --set backend.image.tag=${{ github.sha }} \
            --set frontend.image.tag=${{ github.sha }}
      - name: Run migrations
        run: kubectl -n bloodsugar-staging create job --from=cronjob/db-migrate migrate-${{ github.run_number }}
      - name: Smoke test
        run: curl -fsS https://staging.example.com/api/healthz

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Helm deploy production
        run: |
          helm upgrade --install bloodsugar ./infra/helm/bloodsugar \
            --namespace bloodsugar-prod \
            --create-namespace \
            --set backend.image.tag=${{ github.sha }} \
            --set frontend.image.tag=${{ github.sha }} \
            --wait --timeout 10m
      - name: Production smoke test
        run: curl -fsS https://app.example.com/api/healthz
```

## 10. Scaling Strategy

### Backend Scaling

Backend pods scale horizontally because they are stateless.

Signals：

- CPU utilization。
- Memory utilization。
- Request per second through custom metrics。
- Latency / queueing pressure。

HPA：

- Start with CPU / memory HPA。
- Add Prometheus Adapter for RPS or p95 latency if traffic grows。
- Keep min replicas >= 2 in staging-like production, >= 3 for real production。

Cluster Autoscaler：

- HPA increases pod count。
- If pods cannot be scheduled because nodes lack CPU/memory, Cluster Autoscaler adds nodes。
- Node pools should separate general workloads from heavy AI / GPU workloads if added later。

### Worker Scaling

Worker pods scale by queue depth, not HTTP traffic.

Recommended：

- KEDA Redis scaler。
- Separate worker Deployment。
- Idempotent job handlers。
- Dead-letter queue or failed-job table。

### Redis Scaling

Managed Redis：

- Start single primary with replica / automatic failover where available。
- Scale memory and connection capacity vertically first。
- Use cluster mode only when needed because it complicates key design。

Kubernetes Redis：

- StatefulSet / Redis Operator。
- Persistent volume if queue durability requires it。
- Clear failover and backup procedure。

### Database Scaling

PostgreSQL does not scale like backend pods because it has durable state, transactions, WAL, locks, indexes, and replication consistency constraints.

Scaling strategy：

- Use managed PostgreSQL。
- Size primary vertically for writes。
- Add read replicas for read-heavy reports / dashboards。
- Route read-only analytics/report queries to replicas when acceptable。
- Use PgBouncer to control connection count。
- Add indexes and query tuning before adding infrastructure complexity。
- Use partitioning or archival tables for large audit/event data。
- Use Aurora read replicas or serverless v2 when AWS is the target and workload is spiky。

What not to do：

- Do not run multiple independent PostgreSQL pods behind a Service and call that horizontal scaling。
- Do not let every backend pod open unbounded DB connections。
- Do not treat read replicas as strongly consistent write targets。

## 11. Database Design Strategy

Production preferred：

```text
Managed PostgreSQL / Aurora / Cloud SQL
-> private subnet
-> encrypted storage
-> automatic backups
-> PITR enabled
-> read replicas
-> PgBouncer
-> migration jobs
```

Backup / restore：

- Daily automated backups。
- PITR enabled。
- Restore drill on staging at regular interval。
- Backup encryption with cloud KMS。
- Retention policy aligned with legal / product requirements。

Migration：

- Alembic or equivalent migration tool。
- CI verifies migration applies to empty DB and copied staging DB。
- Use expand-and-contract。
- Avoid long exclusive locks。
- Large backfills run as separate jobs。

Read replica strategy：

- Backend writes to primary。
- Reports and heavy read endpoints may read from replica。
- UI must tolerate replica lag if reading from replica。
- Any read-after-write critical path should read primary or use consistency guard。

If Kubernetes-hosted DB is unavoidable：

- CloudNativePG or Zalando Postgres Operator。
- Anti-affinity across nodes / zones。
- PersistentVolumes with snapshot support。
- WAL archiving。
- Automated failover tested。
- Backup restore drill required before production use。

## 12. Observability

Required：

- Prometheus for metrics。
- Grafana for dashboards。
- Loki or ELK for logs。
- OpenTelemetry for traces。
- Alertmanager or cloud alerting。

Backend instrumentation：

- Request count。
- Error count。
- Latency p50 / p95 / p99。
- DB query latency。
- Redis latency。
- Queue depth。
- Worker job success / failure。
- Health check failures。

Logging：

- Structured JSON logs。
- Correlation/request id。
- No PHI in general logs。
- Redaction for tokens, email, phone, health text。

Tracing：

- OpenTelemetry SDK in backend。
- Propagate trace id through API, worker, DB calls when possible。
- Export to OTEL Collector, then Tempo / Jaeger / vendor.

Alerting examples：

- Backend 5xx rate > threshold。
- p95 latency > target。
- Pod restart loop。
- HPA maxed out for sustained period。
- DB CPU / connections / storage high。
- PgBouncer pool exhaustion。
- Redis memory or latency high。
- Queue depth stale or growing。
- Backup failure。
- Certificate expiry approaching。

## 13. Security Strategy

Required：

- Kubernetes Secret or External Secrets Operator。
- External secret manager, for example AWS Secrets Manager / GCP Secret Manager / Vault。
- TLS everywhere on public traffic。
- Private network for database and Redis。
- NetworkPolicy between namespaces and workloads。
- Least privilege ServiceAccount。
- Image scanning in CI。
- Dependency scanning。
- Secret scanning。
- Signed images if possible。
- Read-only root filesystem where feasible。
- Non-root containers。
- Backup encryption。
- Audit logs for sensitive operations。

Database security：

- Private subnet only。
- No public DB endpoint。
- KMS encryption。
- Separate users for app, migration, read-only reporting。
- Rotate credentials。
- PgBouncer credentials through secret manager。

Ingress security：

- HTTPS enforced。
- HSTS after domain is stable。
- WAF / Cloudflare rules。
- Rate limiting。
- Request body size limits。
- CORS allowlist。

PHI note：

- Do not log health record payloads。
- Do not send PHI to third-party observability tools unless explicitly reviewed, necessary, and contractually allowed。
- OpenAI or other cloud AI paths require separate compliance and data-processing review before production use。

## 14. Common Failure Cases And Handling

### Backend pod crash loop

Handling：

- Liveness probe restarts pod。
- Read logs in Loki / kubectl。
- Roll back recent release if widespread。
- PDB and replicas keep service available if enough pods remain。

### Readiness failure

Handling：

- Pod removed from Service endpoints。
- Check DB / Redis / config / secret availability。
- Rollout should pause if new pods never become ready。

### DB connection exhaustion

Handling：

- PgBouncer protects DB。
- Cap backend pool size。
- Alert on PgBouncer pool saturation。
- Scale backend carefully; increasing backend pods can worsen DB pressure。

### Database primary outage

Handling：

- Managed DB automatic failover。
- App retries with backoff。
- Readiness may fail until DB endpoint recovers。
- Run post-failover smoke tests。

### Read replica lag

Handling：

- Monitor replica lag。
- Critical read-after-write paths use primary。
- Show pending state for recently saved data if replica-backed view is stale。

### Redis outage

Handling：

- Managed Redis failover。
- Backend should degrade cache misses gracefully。
- Rate limiting may fail closed or fail open based on endpoint risk。
- Queue workers pause and resume after Redis recovery。

### Traffic spike

Handling：

- Cloudflare / WAF rate limits。
- Ingress rate limits。
- HPA scales backend。
- Cluster Autoscaler adds nodes。
- Queue noncritical work。
- Watch DB and Redis bottlenecks。

### Bad deployment

Handling：

- Rolling update with maxUnavailable 0。
- Smoke test after rollout。
- Helm rollback。
- Feature flag disable。
- Backward-compatible DB migrations.

### Failed migration

Handling：

- Stop rollout。
- Restore from backup only if data corruption occurs。
- Prefer forward fix for schema issues。
- Keep migration logs and runbooks。

### Certificate expiry

Handling：

- cert-manager automation。
- Alert before expiry。
- Manual renewal runbook。

## 15. Roadmap

### Phase 0：Keep Local Dev Stable

- Keep `docker-compose.yml` for db / backend / web / ollama。
- Add Redis to local compose when queue / rate limit work starts。
- Add `/healthz` and `/readyz` while preserving existing `/health` if needed for compatibility。

### Phase 1：Container Production Readiness

- Harden backend Dockerfile。
- Harden frontend Dockerfile or static build pipeline。
- Add non-root user。
- Add resource-friendly startup。
- Add structured logging。
- Add OpenTelemetry hooks。
- Add metrics endpoint。

### Phase 2：Kubernetes Manifests / Helm

- Create `infra/helm/bloodsugar` or `infra/k8s`。
- Add Namespace, Deployment, Service, Ingress。
- Add ConfigMap and ExternalSecret。
- Add HPA and PDB。
- Add resource requests / limits。
- Add liveness / readiness probes。
- Add NetworkPolicy。

### Phase 3：Managed Data Layer

- Provision managed PostgreSQL / Aurora / Cloud SQL。
- Enable private networking。
- Enable backup and PITR。
- Add PgBouncer。
- Add migration job。
- Provision managed Redis。
- Add queue / worker deployment。

### Phase 4：CI/CD

- GitHub Actions PR checks。
- Docker build / push。
- Image scan。
- Helm deploy to staging。
- Migration step。
- Smoke tests。
- Manual approval for production。
- Rollback command documented。

### Phase 5：Observability

- Prometheus。
- Grafana dashboards。
- Loki or ELK。
- OpenTelemetry Collector。
- Alerts for API, DB, Redis, queue, ingress, certificates, backups。

### Phase 6：Security Hardening

- External Secrets Operator。
- OIDC federation from CI to cloud。
- Network policies。
- Least privilege service accounts。
- Private DB / Redis。
- Backup encryption verification。
- Secret rotation runbook。
- PHI logging tests。

### Phase 7：Scaling Validation

- Load test backend。
- Validate HPA behavior。
- Validate Cluster Autoscaler。
- Validate PgBouncer limits。
- Validate DB read replica behavior。
- Validate Redis failover。
- Validate restore from backup。
