param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[^@\s]+@[^@\s]+\.[^@\s]+$')]
  [string]$NotificationEmail,

  [string]$BudgetName = "bloodsugar-monthly-10-usd"
)

$ErrorActionPreference = "Stop"
$accountId = aws sts get-caller-identity --query Account --output text
if (-not $accountId) {
  throw "AWS identity is unavailable. Run aws sso login first."
}

$workingDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ("bloodsugar-budget-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $workingDirectory | Out-Null

try {
  $budgetPath = Join-Path $workingDirectory "budget.json"
  $notificationsPath = Join-Path $workingDirectory "notifications.json"

  @{
    BudgetName = $BudgetName
    BudgetLimit = @{ Amount = "10"; Unit = "USD" }
    TimeUnit = "MONTHLY"
    BudgetType = "COST"
  } | ConvertTo-Json -Depth 5 | Set-Content -Path $budgetPath -Encoding utf8NoBOM

  @(
    @{
      Notification = @{
        NotificationType = "ACTUAL"
        ComparisonOperator = "GREATER_THAN"
        Threshold = 80
        ThresholdType = "PERCENTAGE"
      }
      Subscribers = @(@{ SubscriptionType = "EMAIL"; Address = $NotificationEmail })
    },
    @{
      Notification = @{
        NotificationType = "FORECASTED"
        ComparisonOperator = "GREATER_THAN"
        Threshold = 100
        ThresholdType = "PERCENTAGE"
      }
      Subscribers = @(@{ SubscriptionType = "EMAIL"; Address = $NotificationEmail })
    }
  ) | ConvertTo-Json -Depth 6 | Set-Content -Path $notificationsPath -Encoding utf8NoBOM

  aws budgets create-budget `
    --account-id $accountId `
    --budget "file://$budgetPath" `
    --notifications-with-subscribers "file://$notificationsPath"
}
finally {
  Remove-Item -Recurse -Force $workingDirectory -ErrorAction SilentlyContinue
}
