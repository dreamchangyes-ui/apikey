# Free LLM Hub & AI API Key Management System

Enterprise-grade SaaS backend dashboard and Unified API Gateway for multi-provider AI model orchestration, automatic key pool rotation, rate limit protection, and real-time observability.

## 🚀 Key Features

1. **Executive Admin Dashboard**
   - Live metrics: Total Providers, API Keys, Active/Error status, Models count, Requests Today, Token Usage, Success Rate %, Estimated Costs, Quota remaining.
   - Interactive charts: Request volume over time, Token consumption, Error rates, Provider share, and Model distribution.

2. **Provider Management**
   - Built-in profiles for **Google Gemini, Groq, OpenRouter, Hugging Face, Together AI, Cerebras, Mistral AI, Cohere**, plus custom providers.
   - Configure Base URLs, Auth types (Bearer token, Header key, Query param), RPM/TPM/RPD limits, Free-tier notes.
   - Live connectivity test and latency measurement.

3. **Secure API Key Management & Storage**
   - **Encryption at Rest**: AES-256 encrypted payload storage.
   - **Zero Leaks**: Plaintext secrets never exposed to frontend, never saved in localStorage, and never written to logs.
   - **Masked Formatting**: Keys rendered securely (e.g. `sk-••••••••••••••••91ab`).
   - Actions: Add, Edit, Delete, Rotate, Test, Enable/Disable, Quota limits.

4. **Dynamic Model Registry**
   - Manage model names, IDs, context windows (up to 2M tokens), input/output boundaries, free/paid status.
   - Dynamic model addition without hardcoding.

5. **Intelligent API Key Pool & Rotation**
   - Rotation Strategies:
     - **Round Robin**: Even load distribution across keys.
     - **Least Used**: Routes to key with minimum requests.
     - **Random**: Uniform random selection.
     - **Priority**: Cascades through ordered priority tiers.
     - **Failover**: Instant backup fallback upon HTTP 429 / 5xx.
   - Automatic **Cooldown Timer** for rate-limited keys.

6. **Unified API Gateway (OpenAI Compatible)**
   - Single endpoint: `POST /api/v1/chat/completions`
   - Accepts standard OpenAI payload:
     ```json
     {
       "model": "gemini-2.5-flash",
       "messages": [{ "role": "user", "content": "Hello!" }]
     }
     ```
   - Automated authentication, model resolution, key pool rotation, failover retry, usage logging, and standardized response generation.

7. **Client API Keys (Internal Tenancy)**
   - Issue internal keys formatted as `fk_live_...`.
   - Set granular daily request limits, token quotas, allowed model whitelists, and expiration dates.

8. **Audit & Usage Observability**
   - Request-level logs: Client, Provider, Model, Masked Key, Latency, Status code, Token count, IP address, and Request ID.
   - Real-time Error Monitoring with categorization (Rate Limit, Invalid Key, Offline, Timeout).
   - Provider Health Dashboard with real-time ping monitors and status indicators (🟢 Online, 🟡 Degraded, 🔴 Offline).

9. **Security & RBAC**
   - Roles: `ADMIN`, `OPERATOR`, `VIEWER`.
   - Key hashing, CSRF headers, rate limiting middleware, sanitized logging.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Tailwind CSS v4, Motion, Lucide Icons, Recharts
- **Backend / Gateway**: Node.js, Express, TypeScript, tsx
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Containerization**: Docker, Docker Compose

---

## 💻 Quickstart

### Prerequisites
- Node.js 20+ or 22+
- PostgreSQL (or run via Docker)

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Setup Environment Variables
cp .env.example .env

# 3. Run Prisma Migration & Seed
npx prisma migrate dev
npx prisma db seed

# 4. Start Development Server
npm run dev
```

The application will be available at:
`http://localhost:3000`

---

## 🐳 Docker Deployment

To run both the application and PostgreSQL database with Docker Compose:

```bash
docker compose up -d
```

Check service status:
```bash
docker compose ps
docker compose logs -f app
```

---

## 🔑 Default Seed Accounts

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@freellmhub.dev` | `admin123` | Full administrative control |
| **Operator** | `operator@freellmhub.dev` | `operator123` | Key management, models, pool routing |
| **Viewer** | `viewer@freellmhub.dev` | `viewer123` | Read-only analytics & health |

---

## 📡 Unified API Gateway Quick Example

```bash
curl -X POST http://localhost:3000/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fk_live_demo_key_12345" \
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [
      { "role": "user", "content": "Explain quantum computing in one sentence." }
    ]
  }'
```
