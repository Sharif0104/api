# Bullkit API Backend

A scalable, secure, and maintainable Node.js/Express backend for internal service endpoints, API management, and traffic routing.

---

## General Information
- **Project Type:** Node.js + Express REST API backend
- **Primary Language:** JavaScript (Node.js)
- **Database:** PostgreSQL (managed via Prisma ORM)
- **Cache:** Redis (for caching and queueing)
- **API Versioning:** All endpoints under `/api/v1/`
- **Containerization:** Docker support (`Dockerfile`, `.dockerignore`)
- **Monitoring:** Prometheus metrics, health endpoints
- **Logging:** File-based logs and audit logs
- **CI/CD:** GitHub Actions workflows for test, lint, security, and deploy
- **Backups:** Automated PostgreSQL backups with retention and restore scripts
- **Documentation:** Comprehensive `README.md` and backup guide

---

## Core Features

### API & Routing
- Modular Express routers for:
  - Users, authentication, shops, products, orders, appointments, inventory, friends, messages (with file/image support), notifications, admin, audit, uploads, search, etc.
- API versioning for future-proofing (`/api/v1/`)

### Security
- JWT authentication and session management
- 2FA (Two-Factor Authentication) support
- Role-Based Access Control (RBAC) middleware
- API key validation middleware
- CSRF protection (with exceptions for specific routes)
- Rate limiting (per IP)
- Security headers via Helmet
- HPP (HTTP Parameter Pollution) protection
- CORS configuration

### Performance & Scalability
- Node.js clustering (multi-core support, now limited to 2 workers for WSL2/Windows)
- Redis caching for images and other data
- Optimized Prisma queries (pagination, field selection)
- Graceful shutdown for all services

### Monitoring & Reliability
- Prometheus metrics endpoint (`/metrics`)
- Health, liveness, and readiness endpoints
- Centralized error handling middleware
- Audit logging for sensitive actions
- File-based logging with timestamps

### DevOps & Maintainability
- Dockerized for easy deployment
- Automated daily PostgreSQL backups (with retention and restore instructions)
- GitHub Actions for CI/CD (test, lint, security, deploy)
- Environment variable support via `.env`
- Modular code structure (controllers, routes, middleware, services, utils)

### Documentation
- Comprehensive `README.md` (setup, usage, Docker, API, monitoring, CI/CD, security, contributing)
- `DB_BACKUP_README.md` for backup/restore
- Swagger/OpenAPI auto-generated docs at `/api-docs`

### Testing
- Test suite in `test/` directory (run in CI)
- Health check test example

### Other
- Static file serving for uploads (images, avatars, documents, QR codes)
- Graceful shutdown for HTTP, Redis, and background workers
- Support for background jobs (BullMQ/Redis workers)
- Audit and admin endpoints for secure management

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL
- Redis
- [PM2](https://pm2.keymetrics.io/) process manager (required for production and recommended for all environments)
- (Optional) Docker

### Setup
```bash
# Install dependencies
npm install

# Copy and edit environment variables
cp .env.example .env
# Edit .env with your DB, Redis, and secret values

# Run database migrations
npx prisma migrate deploy

# Start the server (development)
node server.js

# Or start the server with PM2 (required for production)
npm install -g pm2
pm2 start server.js --name bullkit-api
```

### PM2 (Production Process Manager)

PM2 is required for production deployments and recommended for all environments. It manages and keeps the Node.js server running, enables log rotation, and handles restarts automatically.

#### Install PM2 globally:
```bash
npm install -g pm2
```

#### Start the server with PM2:
```bash
pm2 start server.js --name bullkit-api
```

#### View logs:
```bash
pm2 logs bullkit-api
```

#### Restart/stop the server:
```bash
pm2 restart bullkit-api
pm2 stop bullkit-api
```

#### More info:
See the [PM2 documentation](https://pm2.keymetrics.io/) for advanced usage, ecosystem files, and cluster mode.

### Docker
```bash
# (Optional) Build and run with Docker
# (Edit .env for production secrets)
docker build -t bullkit-api .
docker run --env-file .env -p 3000:3000 bullkit-api
```

---

## API
- All endpoints are under `/api/v1/`
- Auth, users, shops, products, orders, appointments, etc.
- See `/api-docs` for Swagger UI (auto-generated API docs)
- **Note:** This deployment is not on a cloud or VPS. The API is self-hosted on a personal computer, running on WSL2 (Ubuntu 24.04).

---

## Monitoring & Logging
- Prometheus metrics: `/metrics`
- Health checks: `/api/v1/status`, `/api/v1/live`, `/api/v1/ready`
- Logs: `logs/` directory
- Audit logs: `logs/audit.log`

---

## CI/CD
- Automated tests, lint, and security checks via GitHub Actions
- See `.github/workflows/`

---

## Backups
- Daily PostgreSQL backups via `scripts/pg_backup.sh` to `backups/`
- Restore instructions: see `scripts/DB_BACKUP_README.md`

---

## Security
- Helmet, rate limiting, API key, CSRF, RBAC
- Sensitive data never logged
- Keep dependencies up to date

---

## Contributing
- PRs welcome! Please add tests and update docs.

---

## License
MIT

---

## Contact
- Maintainer: [Sharif Darjen Kyle E. Abdulhamid/Team]
- Issues: [GitHub Issues URL]

---

## Advanced API & Security Features

| Feature                                 | Status      | Notes |
|-----------------------------------------|-------------|-------|
| API request validation (Joi/Zod)        | Yes         | Joi validation middleware added (see `src/middleware/joiValidation.js`) |
| Structured (JSON) logging               | Yes         | Winston logger with JSON format |
| Enhanced metrics (endpoint/user role)   | Partial     | Prometheus metrics, not by user role/endpoint |
| Dependency vulnerability scanning in CI | Partial     | GitHub Actions for test/lint/security, but not explicit dependency scanning |
| More granular rate limiting (per user)  | Yes         | Per-user rate limiting via `rate-limiter-flexible` (see `src/middleware/perUserRateLimiter.js`) |
| Background job retries/dead-letter      | Yes         | BullMQ jobs with retry and dead-letter queue logic (see `src/utils/jobQueue.js`) |
| Data encryption at rest                 | Yes         | Prisma middleware for field encryption (see `src/middleware/prismaEncryption.js`) |
| API gateway/service mesh                | Doc/sample  | See `docs/api-gateway-example.md` for NGINX/service mesh guidance |

### Implementation Notes
- **Validation:** Joi validation middleware is now available and used in registration. See `src/middleware/joiValidation.js`.
- **Logging:** Winston logger is configured for JSON logs and daily rotation. Audit logs are also available.
- **Metrics:** Prometheus metrics are exposed at `/metrics`. For per-endpoint/user role metrics, further instrumentation is needed.
- **Rate Limiting:** Per-user rate limiting is available. See `src/middleware/perUserRateLimiter.js`.
- **Background Jobs:** BullMQ is used for background jobs, now with retries and dead-letter queue logic. See `src/utils/jobQueue.js`.
- **Encryption at Rest:** Prisma middleware encrypts/decrypts User.email. See `src/middleware/prismaEncryption.js`.
- **API Gateway/Service Mesh:** See `docs/api-gateway-example.md` for NGINX/service mesh setup.

---

## Critical Processes & Operations

### 1. Self-Hosting & Environment
- **Deployment:** This API is self-hosted on a personal computer, running on WSL2 (Ubuntu 24.04). It is not deployed on a cloud or VPS.
- **Production Process Management:** PM2 is required for production and recommended for all environments. It ensures the server stays running, restarts on failure, and provides log management.
- **Cluster Worker Limit:** For WSL2/Windows, Node.js cluster workers are limited to 2 for stability.

### 2. Starting & Managing the API
- **Development:**
  - `node server.js` (not recommended for production)
- **Production:**
  - `pm2 start server.js --name bullkit-api`
  - View logs: `pm2 logs bullkit-api`
  - Restart: `pm2 restart bullkit-api`
  - Stop: `pm2 stop bullkit-api`
- **Monitoring:**
  - Prometheus metrics: `/metrics`
  - Health checks: `/api/v1/status`, `/api/v1/live`, `/api/v1/ready`

### 3. Docker Migration
- **Optional:** Docker is supported for containerized deployments, but not required for self-hosting.
- **Build & Run:**
  - `docker build -t bullkit-api .`
  - `docker run --env-file .env -p 3000:3000 bullkit-api`
- **Migration Steps:**
  - Ensure all environment variables are set in `.env`.
  - Update any volume mounts for persistent data (e.g., `uploads/`, `backups/`, `logs/`).
  - Review Dockerfile for customizations.

### 4. Database & Backups
- **Database:** PostgreSQL managed via Prisma ORM.
- **Backups:**
  - Daily automated backups via `scripts/pg_backup.sh` to `backups/`.
  - Restore instructions in `scripts/DB_BACKUP_README.md`.

### 5. Security & Operations
- **Authentication:** JWT, 2FA, RBAC, API key, CSRF, rate limiting, Helmet, HPP, CORS.
- **Sensitive Data:** Never logged. Audit logs in `logs/audit.log`.
- **Dependency Management:** Keep dependencies up to date. CI/CD runs lint, test, and security checks.
- **Environment Variables:** All secrets and credentials must be set in `.env` and never committed to version control.
- **File Uploads:** All uploads are stored in `uploads/` and served statically. Ensure proper permissions and monitoring.
- **Graceful Shutdown:** All services (HTTP, Redis, background workers) shut down cleanly on exit.

### 6. Monitoring & Logging
- **Logs:**
  - Application logs: `logs/`
  - Audit logs: `logs/audit.log`
- **Metrics:**
  - Prometheus metrics at `/metrics`
- **Error Handling:** Centralized error handler logs and reports all errors.

### 7. Migration & Upgrade Procedures
- **Database Migrations:**
  - Run `npx prisma migrate deploy` after pulling new code or updating schema.
- **Dependency Upgrades:**
  - Run `npm install` after updating dependencies.
- **Backup Before Upgrade:**
  - Always run a database backup before major upgrades.

### 8. Security Best Practices
- **Never expose .env or secrets.**
- **Restrict access to uploads, logs, and backups directories.**
- **Monitor logs and audit logs for suspicious activity.**
- **Regularly update dependencies and review security advisories.**

---

## All Features

| Feature                                 | Status      | Notes |
|-----------------------------------------|-------------|-------|
| Modular Express routers                 | Yes         | Users, authentication, shops, products, orders, appointments, inventory, friends, messages (with file/image support), notifications, admin, audit, uploads, search, etc. |
| API versioning                         | Yes         | All endpoints under `/api/v1/` |
| JWT authentication & session management | Yes         | See `src/middleware/auth.js` and `src/config/passport.js` |
| 2FA (Two-Factor Authentication)         | Yes         | See `src/controllers/authController.js` (2FA endpoints) |
| Role-Based Access Control (RBAC)        | Yes         | See `src/middleware/rbac.js` |
| API key validation middleware           | Yes         | See `src/middleware/apiKeyMiddleware.js` |
| CSRF protection                        | Yes         | See `server.js` and `csurf` usage |
| Rate limiting (per IP)                  | Yes         | See `src/middleware/rateLimiter.js` |
| More granular rate limiting (per user)  | Yes         | Per-user rate limiting via `rate-limiter-flexible` (see `src/middleware/perUserRateLimiter.js`) |
| Security headers via Helmet             | Yes         | See `src/middleware/helmetMiddleware.js` |
| HPP (HTTP Parameter Pollution)          | Yes         | See `src/middleware/hppMiddleware.js` |
| CORS configuration                     | Yes         | See `src/middleware/corsMiddleware.js` |
| Node.js clustering                     | Yes         | See `server.js` (cluster usage, now limited to 2 workers for WSL2/Windows) |
| Redis caching                          | Yes         | See `src/utils/cache.js` |
| Optimized Prisma queries                | Yes         | Pagination, field selection in controllers |
| Graceful shutdown                      | Yes         | See `server.js` (shutdown logic) |
| Prometheus metrics endpoint             | Yes         | `/metrics` endpoint, see `server.js` |
| Enhanced metrics (endpoint/user role)   | Partial     | Prometheus metrics, not by user role/endpoint |
| Health, liveness, readiness endpoints   | Yes         | `/api/v1/status`, `/api/v1/live`, `/api/v1/ready` |
| Centralized error handling              | Yes         | See `src/middleware/errorHandler.js` |
| Audit logging for sensitive actions     | Yes         | See `logs/audit.log` and logger usage |
| File-based logging with timestamps      | Yes         | See `src/utils/logger.js` |
| Structured (JSON) logging               | Yes         | Winston logger with JSON format |
| Dockerized deployment                   | Yes         | See `Dockerfile` |
| Automated PostgreSQL backups            | Yes         | See `scripts/pg_backup.sh` |
| GitHub Actions for CI/CD                | Yes         | See `.github/workflows/` |
| Dependency vulnerability scanning in CI | Partial     | GitHub Actions for test/lint/security, but not explicit dependency scanning |
| Environment variable support            | Yes         | See `.env.example` |
| Modular code structure                  | Yes         | Controllers, routes, middleware, services, utils |
| Swagger/OpenAPI auto-generated docs     | Yes         | `/api-docs` endpoint |
| Test suite in `test/`                   | Yes         | See `test/` directory |
| Static file serving for uploads         | Yes         | See `uploads/` directory |
| Background jobs (BullMQ/Redis workers)  | Yes         | See `src/utils/jobQueue.js` and `src/workers/` |
| Background job retries/dead-letter      | Yes         | BullMQ jobs with retry and dead-letter queue logic (see `src/utils/jobQueue.js`) |
| Data encryption at rest                 | Yes         | Prisma middleware for field encryption (see `src/middleware/prismaEncryption.js`) |
| API gateway/service mesh                | Doc/sample  | See `docs/api-gateway-example.md` for NGINX/service mesh guidance |
| Audit/admin endpoints                   | Yes         | See `src/routes/adminRoutes.js`, `src/routes/auditRoutes.js` |
| API request validation (Joi/Zod)        | Yes         | Joi validation middleware added (see `src/middleware/joiValidation.js`) |
| URL parameter handling (tracking, access control, caching, context) | Yes | Professional middleware parses and logs tracking, access, cache, and context params (see `src/middleware/urlParameterMiddleware.js`) |
| Messaging with file/image attachments   | Yes         | Send images/files in messages via `attachmentUrl` (see Message model and sendMessage controller) |
| Message read/seen tracking              | Yes         | MessageRead model and endpoints for marking messages as read, per user |
| Friend request and chat system          | Yes         | Friend request, acceptance, and chat between users implemented |
| Cluster worker limit for WSL2/Windows   | Yes         | Cluster workers limited to 2 for stability |
