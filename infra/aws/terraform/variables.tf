variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "us-east-1"
}

variable "name" {
  description = "Resource name prefix."
  type        = string
  default     = "bloodsugar"
}

variable "environment" {
  description = "Deployment environment."
  type        = string
  default     = "production"
}

variable "image_tag" {
  description = "Immutable backend image tag already pushed to the module-created ECR repository."
  type        = string
  default     = "bootstrap"
}

variable "desired_count" {
  description = "ECS task count. Keep at zero until the image and runtime secret are populated."
  type        = number
  default     = 0

  validation {
    condition     = var.desired_count >= 0
    error_message = "desired_count must be zero or greater."
  }
}

variable "backend_cors_origins" {
  description = "Comma-separated HTTPS origins allowed to call the API."
  type        = string
  default     = "https://app.example.com"

  validation {
    condition     = !strcontains(var.backend_cors_origins, "*")
    error_message = "Wildcard CORS origins are forbidden."
  }
}

variable "auth_jwt_issuer" {
  description = "JWT issuer expected by the backend."
  type        = string
  default     = "https://auth.example.com"
}

variable "auth_jwt_audience" {
  description = "JWT audience expected by the backend."
  type        = string
  default     = "bloodsugar-api"
}

variable "database_name" {
  type    = string
  default = "bloodsugar"
}

variable "database_username" {
  type    = string
  default = "bloodsugar_admin"
}

variable "database_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "certificate_arn" {
  description = "Optional ACM certificate ARN. Empty uses HTTP for bootstrap only."
  type        = string
  default     = ""
}
