# Deployment Guide

## Recommended topology

- Frontend: Vercel or Netlify
- Backend: Render, Railway, Fly.io, or a Dockerized VM
- Database: Managed PostgreSQL such as Neon, Supabase, Railway Postgres, or RDS
- File storage: Cloudinary for production media handling

## Environment checklist

### Backend

- `NODE_ENV=production`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `CLIENT_URL`
- `UPLOAD_PROVIDER=cloudinary` for hosted uploads
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- SMTP values if transactional email is enabled

### Frontend

- `VITE_API_BASE_URL=https://your-api-domain/api`

## Hardening recommendations

1. Move uploads to Cloudinary or S3 before handling larger cohorts.
2. Add refresh tokens or rotating session strategy for longer-lived SaaS sessions.
3. Add request validation with Zod or Joi for stricter input enforcement.
4. Add rate limiting and audit logs for admin actions.
5. Move notification fan-out and streak recomputation into background jobs for scale.

## Basic release flow

1. Provision PostgreSQL and run [backend/sql/schema.sql](C:/Users/Diksha/Documents/Codex/2026-04-26-build-a-complete-production-ready-full/backend/sql/schema.sql).
2. Set backend environment variables and deploy the Express service.
3. Run the seed script only in staging or demo environments.
4. Deploy the frontend with `VITE_API_BASE_URL` pointed at the live API.
5. Verify login, program creation, task assignment, submission review, and CSV export.

## Optional Docker direction

If you containerize next, split into:

- `frontend` static build served by Nginx or platform CDN
- `backend` Node container
- managed PostgreSQL rather than self-hosted in the same stack
