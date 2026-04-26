# DIKSHA_CAMPUSCONNECT_PLATFORM
CampusConnect is a full-stack SaaS platform for managing Campus Ambassador programs with role-based dashboards, task tracking, proof submissions, analytics, leaderboards, badges, and gamification.
The platform supports two primary roles:

- `Admin`: organizations, startups, or program managers running ambassador campaigns
- `Ambassador`: students participating in the program and completing assigned activities

CampusConnect is designed as a portfolio-quality project and a practical MVP foundation that can be extended into a real product.
## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Core Features](#core-features)
- [User Roles](#user-roles)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Design](#database-design)
- [API Overview](#api-overview)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Seed Data and Demo Credentials](#seed-data-and-demo-credentials)
- [Sample User Flows](#sample-user-flows)
- [Demo Video](#demo-video)
- [GitHub Demo Checklist](#github-demo-checklist)
- [Deployment Guide](#deployment-guide)
- [Future Improvements](#future-improvements)
- [Known Notes](#known-notes)

## Problem Statement

Many campus ambassador programs are still managed using disconnected tools:

- spreadsheets for ambassador data
- messaging apps for updates and reminders
- forms or shared drives for proof submission
- manual calculations for points and leaderboard tracking
- inconsistent review workflows for approvals and payouts

This creates major problems:

- poor visibility into ambassador performance
- slow onboarding and review cycles
- inconsistent task tracking
- low engagement due to weak incentives
- difficulty scaling as the ambassador base grows

## Solution Overview

CampusConnect solves this by providing a unified, data-driven platform where teams can:

- create and manage ambassador programs
- review and approve applicants
- assign structured tasks
- collect proof of work through links and file uploads
- approve or reject submissions
- award points automatically
- monitor live performance analytics
- boost participation with leaderboards, badges, and streak rewards

The result is a single operational system for running modern ambassador programs at scale.

## Core Features

### Authentication and Access Control

- JWT-based authentication
- role-based access control for `admin` and `ambassador`
- protected API routes
- personalized dashboards based on logged-in role

### Admin Features

- create and manage ambassador programs
- review and approve ambassador applications
- assign structured tasks such as:
  - referrals
  - social media campaigns
  - content creation
  - events and activations
- review proof submissions
- approve or reject work with feedback
- monitor analytics including:
  - active ambassadors
  - task completion rate
  - top performers
- export ambassador performance as CSV

### Ambassador Features

- create and maintain profile
- add college, skills, and social links
- view assigned tasks and deadlines
- submit proof of work using links or uploaded files
- track points earned
- view leaderboard position
- unlock badges
- build activity streaks
- receive task and review notifications

### Gamification System

- points engine
- weekly and overall leaderboard
- badge unlocks
- streak-based motivation
- ranking visibility for engagement and retention

## User Roles

### Admin

Admins are organizations or growth teams running Campus Ambassador campaigns. Their responsibility is to manage operations, monitor output, and make decisions using platform analytics.

### Ambassador

Ambassadors are students who participate in a program by completing growth and marketing tasks. Their dashboard is optimized for action, motivation, and progress visibility.

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router

### Backend

- Node.js
- Express.js
- PostgreSQL
- JWT authentication
- Multer for file uploads
- Nodemailer for optional email notifications

### Optional Integrations

- Cloudinary for hosted media storage
- SMTP for onboarding or status emails

## Architecture

CampusConnect follows a clean layered backend architecture inspired by MVC:

- `routes`: define REST endpoints
- `controllers`: handle request and response flow
- `services`: contain business logic
- `repositories`: isolate database access
- `middlewares`: authentication, authorization, uploads, error handling
- `utils`: helpers for tokens, CSV export, async handling, and custom errors

Frontend architecture is organized around:

- reusable UI components
- page-level role-based dashboards
- API abstraction modules
- auth context and routing guards
- Tailwind-based responsive layout system

## Project Structure

```text
campusconnect/
|-- backend/
|   |-- sql/
|   |   |-- schema.sql
|   |   `-- seed.js
|   |-- uploads/
|   `-- src/
|       |-- config/
|       |-- constants/
|       |-- controllers/
|       |-- middlewares/
|       |-- repositories/
|       |-- routes/
|       |-- services/
|       `-- utils/
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- context/
|   |   |-- data/
|   |   |-- hooks/
|   |   |-- pages/
|   |   `-- styles/
|   |-- index.html
|   `-- vite.config.js
|-- docs/
|   |-- api-reference.md
|   `-- deployment.md
|-- package.json
`-- README.md
```

## Database Design

CampusConnect uses PostgreSQL with a normalized relational schema.

### Core Tables

- `roles`
- `users`
- `programs`
- `program_memberships`
- `tasks`
- `task_assignments`
- `submissions`
- `points_ledger`
- `badges`
- `user_badges`
- `notifications`
- `user_program_stats`

### What the schema supports

- user role separation
- ambassador applications per program
- one-to-many task assignment patterns
- submission review lifecycle
- ledger-based point tracking
- badge unlock logic
- notification history
- leaderboard-ready aggregate stats

Full schema:file:///C:/Users/Diksha/Documents/Codex/2026-04-26-build-a-complete-production-ready-full/backend/sql/schema.sql

## API Overview

CampusConnect exposes a RESTful API for auth, program management, task management, submissions, analytics, leaderboard data, notifications, and profile operations.

### Example API Modules

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/programs`
- `POST /api/programs`
- `POST /api/programs/:programId/apply`
- `GET /api/programs/:programId/applicants`
- `PATCH /api/memberships/:membershipId/status`
- `GET /api/tasks`
- `POST /api/tasks`
- `POST /api/assignments/:assignmentId/submissions`
- `PATCH /api/submissions/:submissionId/review`
- `GET /api/dashboard/admin`
- `GET /api/dashboard/ambassador`
- `GET /api/leaderboard/:programId`
- `GET /api/exports/ambassadors.csv`

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm
- PostgreSQL 14+

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd campusconnect
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the PostgreSQL database

Create a database named `campusconnect`.

### 4. Configure environment variables

Copy the example env files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

If you are on Windows PowerShell:

```powershell
Copy-Item backend\\.env.example backend\\.env
Copy-Item frontend\\.env.example frontend\\.env
```

### 5. Update backend environment variables

Set at minimum:

- `DATABASE_URL`
- `JWT_SECRET`
- `CLIENT_URL`

### 6. Seed the database

```bash
npm run seed
```

### 7. Start the development servers

```bash
npm run dev
```

Expected local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

## Environment Variables

### Backend `.env`

Example file: [backend/.env.example](backend/.env.example)

Important keys:

- `NODE_ENV`
- `PORT`
- `CLIENT_URL`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `UPLOAD_PROVIDER`
- `UPLOAD_DIR`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`

### Frontend `.env`

Example file: [frontend/.env.example](frontend/.env.example)

Important key:

- `VITE_API_BASE_URL`

## Seed Data and Demo Credentials

The project includes sample data for quick review and demo recording.

### Seeded Users

- Admin: `admin@campusconnect.app` / `Admin@123`
- Ambassador: `riya@student.edu` / `Ambassador@123`

### Seeded Content

- sample program
- task assignments
- approved submission example
- notifications
- badges
- leaderboard-ready point records

## Sample User Flows

### Admin Flow

1. Log in as admin
2. Open dashboard analytics
3. Create or review a program
4. Approve ambassador applications
5. Create and assign tasks
6. Review proof submissions
7. Export ambassador data as CSV

### Ambassador Flow

1. Log in as ambassador
2. Open personal dashboard
3. View assigned tasks
4. Submit proof of work
5. Check points and badges
6. Open leaderboard
7. Update profile and socials

## Demo Video

You can publish your project demo video publicly by uploading it to YouTube, Loom, or Google Drive and linking it here.

Recommended option:

- Upload the video to YouTube as `Unlisted`
- Copy the share link
- Replace the placeholder link below

### Demo Link

- Project Demo: 

```md
```
## Live Demo

- Demo Video: v
- Source Code: [GitHub Repository](https://github.com/your-username/your-repo-name)
```


```md
```
## Screenshots

![Login] <img width="1872" height="1022" alt="image" src="https://github.com/user-attachments/assets/47f390f8-2c44-4808-8e2d-d96212eba68d" />

![Admin Dashboard]<img width="1787" height="1023" alt="Screenshot 2026-04-26 145611" src="https://github.com/user-attachments/assets/808f2911-a219-42b1-8fc1-788d037a0860" />

```
```

## Future Improvements

- real-time notifications with WebSockets
- refresh-token based auth
- background job queue for emails and streak updates
- advanced analytics charts
- richer program filtering and search
- organization billing and multi-tenant SaaS support
- file storage migration from local uploads to Cloudinary or S3
- automated testing suite for backend and frontend
- admin activity audit logs
- referral link generation and conversion attribution

## Known Notes

- The frontend includes a demo-friendly fallback mode so the UI can still be reviewed even if the backend is temporarily unavailable.
- File upload support is scaffolded and can run locally or be moved to a hosted media provider.
- This repository is structured as a strong MVP foundation and can be extended into a production deployment with validation, testing, and infrastructure hardening.



## Why This Project Stands Out

CampusConnect is more than a CRUD dashboard. It combines:

- operational workflow management
- role-based product design
- relational data modeling
- performance analytics
- gamification mechanics
- extensible SaaS architecture
- GitHub portfolio showcases
- internship or placement submissions
- startup MVP demonstrations
- final-year project demos
