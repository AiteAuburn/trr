# Lightsail staging deployment for APK testing

This is the low-cost, single-user staging path. It runs Caddy, the FastAPI
backend, and PostgreSQL on one 1 GB Lightsail instance with a 2 GB swap file.
DeepSeek remains a hosted API; no local LLM container runs on this host.

This topology is intentionally not high availability. Do not use real customer
traffic until authentication, backups, restore testing, monitoring, and the
ECS/RDS production path are complete.

## AWS resources

- Ubuntu 24.04 Lightsail instance, `micro_3_0` / 1 GB plan.
- Static IPv4 attached to the instance.
- TCP 22 restricted to the operator IP; TCP 80/443 public for Caddy.
- AWS Budget at USD 10/month with actual 80% and forecasted 100% email alerts.

## Deployment sequence

1. Create the instance, static IP, firewall, and budget using an authenticated
   AWS CLI session.
2. Run `bootstrap.sh` as root through Lightsail SSH.
3. Upload the repository to `/opt/bloodsugar` without `.git`, `.env`, caches,
   local devices, or credentials.
4. Create `infra/lightsail/.env` on the server with mode `0600`. Enter the new
   DeepSeek key only on that server.
5. Run migrations with the backend image, then start `compose.yml`.
6. Verify `https://DOMAIN/healthz`, `https://DOMAIN/readyz`, and a bounded
   DeepSeek parser smoke test without real health data.
7. Build the APK with `EXPO_PUBLIC_API_BASE_URL=https://DOMAIN`.

For the initial test hostname, an IP-based wildcard DNS service can avoid a
domain purchase. A domain controlled by the project is required before real
customer use.
