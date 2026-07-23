# Deploy BugFlow

This project uses Vercel for the Vite frontend and Railway for the Spring Boot API, Python ML service, and MySQL database.

## 1. Rotate exposed credentials

The repository previously contained a JWT signing key and a GitHub OAuth secret. Rotate the GitHub OAuth client secret in GitHub before deploying, then create a new random JWT secret. Never add either value to Git.

## 2. Create Railway services

Create one Railway project and add these services from this GitHub repository:

| Service | Root directory | Dockerfile path | Public domain |
| --- | --- | --- | --- |
| `mysql` | Railway MySQL database | — | No |
| `ml-service` | `ml-service` | `Dockerfile` | No |
| `backend` | `backend` | `Dockerfile` | Yes |

Generate a Railway public domain for `backend` and set its healthcheck path to `/health`.

### Backend variables

Set these in the Railway backend service. Use Railway reference variables for the MySQL values, replacing `MySQL` if you give the database another service name.

```text
SPRING_DATASOURCE_URL=jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}?useSSL=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=${{MySQL.MYSQLUSER}}
SPRING_DATASOURCE_PASSWORD=${{MySQL.MYSQLPASSWORD}}
JWT_SECRET=<new long random secret>
GITHUB_CLIENT_ID=<GitHub OAuth client ID>
GITHUB_CLIENT_SECRET=<new GitHub OAuth client secret>
GITHUB_FRONTEND_REDIRECT=https://<your-vercel-domain>/github-auth
ML_SERVICE_URL=http://${{ml-service.RAILWAY_PRIVATE_DOMAIN}}:${{ml-service.PORT}}
CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>
```

`JWT_EXPIRATION` is optional; it defaults to 30 days.

### ML service variables

No variables are required if the committed model files are used. Railway supplies `PORT` automatically.

## 3. Deploy the frontend on Vercel

Import this GitHub repository into Vercel and configure:

```text
Root Directory: frontend
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
VITE_API_URL: https://<your-backend-railway-domain>/api
```

Deploy it and copy the resulting Vercel domain.

## 4. Complete the backend configuration

Update `GITHUB_FRONTEND_REDIRECT` and `CORS_ALLOWED_ORIGINS` with the final Vercel URL, then redeploy the Railway backend.

In the GitHub OAuth App settings, add this callback URL:

```text
https://<your-backend-railway-domain>/api/auth/github/callback
```

## 5. Verify

- `https://<backend-domain>/health` returns `{\"status\":\"ok\"}`.
- The Vercel site loads, registers users, and logs in.
- A tester can submit a bug and an admin/developer can access their expected views.
- GitHub OAuth redirects back to `/github-auth` successfully.

## Important security note

Before calling the project production-ready, change the global Spring Security fallback from `permitAll()` to `authenticated()` and add endpoint-level authorization for every protected route.
