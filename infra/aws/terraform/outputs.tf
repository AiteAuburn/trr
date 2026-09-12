output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

output "ecr_repository_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "runtime_secret_arn" {
  value = aws_secretsmanager_secret.runtime.arn
}

output "database_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "database_master_secret_arn" {
  value     = try(aws_db_instance.main.master_user_secret[0].secret_arn, null)
  sensitive = true
}

output "api_base_url" {
  value = "${var.certificate_arn == "" ? "http" : "https"}://${aws_lb.main.dns_name}"
}
