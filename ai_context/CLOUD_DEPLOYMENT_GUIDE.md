# Cloud Deployment Guide

This guide keeps deployment cloud-neutral while documenting safe defaults for GCP and AWS. The app should stay stateless at the backend layer and use managed services for database, secrets, and durable infrastructure.

## Common Production Assumptions

- Frontend: static build served by CDN/static hosting, Cloud Run, ECS, or Kubernetes ingress.
- Backend: FastAPI container, stateless, horizontally scalable.
- Database: managed PostgreSQL preferred.
- Secrets: injected at runtime from a cloud secret manager.
- Auth: local dev auth is disabled in production; real OIDC/JWT auth must be added before serving real users.
- Debug tools: disabled in production.

Required production environment:

```text
APP_ENV=production
LOG_LEVEL=info
ENABLE_DEBUG_TOOLS=false
ALLOW_DEV_AUTH=false
DATABASE_URL=<managed-postgres-url>
BACKEND_CORS_ORIGINS=https://app.example.com
LOCAL_LLM_PARSER_URL=<private-parser-url-if-used>
LOCAL_LLM_TIMEOUT_SECONDS=45
LOCAL_LLM_MAX_TOKENS=900
```

## GCP: Cloud Run

Use Cloud Run when traffic is modest, operations should stay simple, and the backend remains stateless.

Recommended services:

- Cloud Run for backend container.
- Cloud Run or Cloud Storage + Cloud CDN for frontend.
- Cloud SQL for PostgreSQL.
- Memorystore for Redis when queue/cache/session features are added.
- Secret Manager for `DATABASE_URL` and future auth/payment/API secrets.
- Artifact Registry for images.
- Cloud Build or GitHub Actions OIDC for CI/CD.

Least privilege:

- Cloud Run service account can read only required Secret Manager versions.
- Cloud Run service account can connect only to the intended Cloud SQL instance.
- CI deploy identity can push to Artifact Registry and update only the target Cloud Run service.
- Do not create or store long-lived service account JSON keys.

Deployment outline:

```bash
gcloud artifacts repositories create bloodsugar --repository-format=docker --location=us-central1
gcloud builds submit --tag us-central1-docker.pkg.dev/PROJECT_ID/bloodsugar/backend:TAG backend
gcloud run deploy bloodsugar-api \
  --image us-central1-docker.pkg.dev/PROJECT_ID/bloodsugar/backend:TAG \
  --region us-central1 \
  --allow-unauthenticated=false \
  --service-account bloodsugar-api@PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars APP_ENV=production,LOG_LEVEL=info,ENABLE_DEBUG_TOOLS=false,ALLOW_DEV_AUTH=false \
  --set-secrets DATABASE_URL=bloodsugar-database-url:latest
```

Run migrations as a separate Cloud Run Job or controlled one-off task before shifting traffic.

## GCP: GKE

Use GKE when Kubernetes control, HPA, ingress policy, or multiple workers/services are needed.

Recommended services:

- GKE Autopilot or Standard.
- Cloud SQL with private IP.
- Workload Identity for pods.
- External Secrets Operator connected to Secret Manager.
- NGINX Ingress, Gateway API, or Google Cloud Load Balancer.
- Managed Service for Prometheus and Cloud Logging.

Least privilege:

- Backend Kubernetes service account maps to a narrow Google service account through Workload Identity.
- External secrets controller reads only named app secrets.
- NetworkPolicy allows backend to talk only to database proxy, Redis, parser, and required egress.

Deployment outline:

- Build and push backend/web images to Artifact Registry.
- Apply namespace, config, secrets, deployments, services, ingress, HPA, PDB, and NetworkPolicy.
- Run Alembic migration as a Kubernetes Job before rollout.
- Use Cloud SQL Auth Proxy sidecar or private IP with authorized network design.

## AWS: ECS Fargate

Use ECS Fargate when managed containers are preferred without operating Kubernetes.

Recommended services:

- ECS Fargate for backend.
- S3 + CloudFront or ECS for frontend.
- RDS PostgreSQL or Aurora PostgreSQL.
- ElastiCache Redis when queue/cache/session features are added.
- AWS Secrets Manager or SSM Parameter Store for secrets.
- ECR for images.
- GitHub Actions OIDC to assume a deploy role.

Least privilege:

- Task role can read only required Secrets Manager ARNs.
- Task execution role can pull only required ECR images and write logs.
- Database security group accepts connections only from backend tasks.
- CI role can push to the app ECR repo and update only the target ECS service.
- Avoid static IAM access keys in GitHub secrets; use OIDC role assumption.

Deployment outline:

```bash
aws ecr create-repository --repository-name bloodsugar-backend
docker build -f backend/Dockerfile.prod -t bloodsugar-backend:TAG backend
docker tag bloodsugar-backend:TAG ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/bloodsugar-backend:TAG
docker push ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/bloodsugar-backend:TAG
aws ecs update-service --cluster bloodsugar --service bloodsugar-api --force-new-deployment
```

Run Alembic migration as a one-off ECS task using the same backend image before deployment.

## AWS: EKS

Use EKS when Kubernetes features are required on AWS.

Recommended services:

- EKS with managed node groups or Fargate profiles.
- RDS/Aurora PostgreSQL private subnets.
- IRSA for pod identity.
- External Secrets Operator connected to Secrets Manager.
- AWS Load Balancer Controller or NGINX Ingress.
- CloudWatch Container Insights, Prometheus, Grafana, Loki/ELK as needed.

Least privilege:

- Backend service account uses IRSA with only the exact secret and AWS API permissions required.
- Deployment role can update only the app namespace and related image repositories.
- Security groups restrict database access to backend pods/nodes only.

Deployment outline:

- Build and push images to ECR.
- Apply ExternalSecret, ConfigMap, Secret, Deployment, Service, Ingress, HPA, PDB, and NetworkPolicy.
- Run migrations as a Kubernetes Job.
- Roll forward with rolling update; roll back by image tag and migration rollback note when safe.

## CI/CD Expectations

- Tests, lint, typecheck, and migration checks must pass before deploy.
- Secret scan must pass.
- Dependency scan should fail on high/critical practical issues.
- Container scan should fail on high/critical vulnerabilities when a fix is available or risk is unacceptable.
- Deploy jobs should use GitHub Actions OIDC to assume a narrow cloud role.
- Production deploys should use protected environments and manual approval.

## Rollback Expectations

- Keep immutable image tags.
- Keep last known good task definition / Cloud Run revision / Kubernetes deployment.
- Document whether each migration is backward compatible.
- If a migration is not safely reversible, use expand-and-contract migration phases.
