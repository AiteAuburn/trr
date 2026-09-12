# AWS ECS Fargate deployment

This Terraform root creates the production backend foundation: ECR, a two-AZ
VPC, private Fargate tasks, an ALB, RDS PostgreSQL, CloudWatch logs, and one
Secrets Manager secret. Secret values are deliberately not managed by
Terraform and must never be committed or supplied as Terraform variables.

## Two-stage deployment

1. Copy `terraform.tfvars.example` to an ignored `terraform.tfvars`. Keep
   `desired_count = 0`, then run `terraform init` and `terraform apply`.
2. Read the generated RDS master secret and database endpoint. Construct the
   SQLAlchemy URL locally without printing it. Put a JSON object containing
   `DATABASE_URL`, `DEEPSEEK_API_KEY`, and a random 32+ character
   `AUTH_JWT_SECRET` into the output `runtime_secret_arn`.
3. Authenticate Docker to the output ECR repository, build
   `backend/Dockerfile.prod`, tag it with an immutable Git SHA, and push it.
4. Set `image_tag` to that SHA and `desired_count = 2`, then apply again.
5. Run `alembic upgrade head` as a one-off ECS task before directing production
   clients to the output `api_base_url`.

Use HTTPS before production traffic: request/validate an ACM certificate and
set `certificate_arn`. The default HTTP listener exists only so the initial
infrastructure can be verified before DNS and ACM are available.

The Android production build must use the final HTTPS ALB/custom-domain URL as
`EXPO_PUBLIC_API_BASE_URL`. The DeepSeek key belongs only in Secrets Manager;
never put it in Expo public variables, an APK, Terraform state, or Git.
