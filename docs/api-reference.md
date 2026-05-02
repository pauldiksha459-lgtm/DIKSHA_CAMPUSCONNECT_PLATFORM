# CampusConnect API Reference

Base URL: `http://localhost:5000/api`

All protected routes require:

```http
Authorization: Bearer <jwt>
Content-Type: application/json
```

## Authentication

### `POST /auth/signup`

Create an admin or ambassador account.

Request:

```json
{
  "fullName": "Riya Sharma",
  "email": "riya@student.edu",
  "password": "Ambassador@123",
  "role": "ambassador",
  "college": "Delhi University",
  "skills": ["content", "community"],
  "socialLinks": {
    "instagram": "https://instagram.com/riya",
    "linkedin": "https://linkedin.com/in/riya"
  }
}
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "uuid",
      "full_name": "Riya Sharma",
      "email": "riya@student.edu",
      "role": "ambassador",
      "college": "Delhi University"
    }
  }
}
```

### `POST /auth/login`

Request:

```json
{
  "email": "admin@campusconnect.app",
  "password": "Admin@123"
}
```

### `GET /auth/me`

Returns the authenticated user profile.

## Programs

### `GET /programs`

- Admin: returns programs they created plus ambassador counts
- Ambassador: returns programs they applied to or joined

### `POST /programs`

Admin only.

Request:

```json
{
  "name": "Summer Creator Sprint",
  "description": "Drive student-generated social storytelling for the launch.",
  "startDate": "2026-05-01",
  "endDate": "2026-07-31"
}
```

### `POST /programs/:programId/apply`

Ambassador only.

Request:

```json
{
  "applicationNote": "I run a campus creator club and can drive reels plus referral volume."
}
```

### `GET /programs/:programId/applicants`

Admin-only review feed for pending, approved, and rejected applicants.

### `PATCH /memberships/:membershipId/status`

Admin only.

Request:

```json
{
  "status": "approved"
}
```

## Tasks

### `GET /tasks`

Query params:

- `programId` optional

### `POST /tasks`

Admin only.

```json
{
  "programId": "program-uuid",
  "title": "Share your referral code with 20 peers",
  "description": "Submit screenshots or links proving distribution.",
  "taskType": "referral",
  "points": 50,
  "dueDate": "2026-05-04T17:00:00.000Z",
  "proofType": "mixed",
  "assigneeIds": ["ambassador-uuid-1", "ambassador-uuid-2"]
}
```

### `POST /assignments/:assignmentId/submissions`

Ambassador only. Multipart form data.

Fields:

- `submissionText`
- `proofLinks` as JSON string array
- `proofFiles` up to 3 files

Example:

```bash
curl -X POST http://localhost:5000/api/assignments/<assignmentId>/submissions \
  -H "Authorization: Bearer <jwt>" \
  -F "submissionText=Shared in 3 creator groups and posted story proof" \
  -F 'proofLinks=["https://instagram.com/p/example"]' \
  -F "proofFiles=@story-proof.png"
```

### `PATCH /submissions/:submissionId/review`

Admin only.

```json
{
  "status": "approved",
  "feedback": "Strong proof set. Points awarded."
}
```

Approval triggers:

- points ledger entry
- aggregate stat refresh
- badge sync
- ambassador notification

## Dashboards and Analytics

### `GET /dashboard/admin`

Admin analytics payload:

```json
{
  "success": true,
  "data": {
    "program_count": 2,
    "active_ambassadors": 48,
    "completion_rate": 76.3,
    "top_performers": [
      {
        "full_name": "Riya Sharma",
        "current_points": 410
      }
    ]
  }
}
```

### `GET /dashboard/ambassador`

Ambassador snapshot:

```json
{
  "success": true,
  "data": {
    "total_points": 240,
    "best_streak": 5,
    "badges_earned": 3,
    "completed_tasks": 7
  }
}
```

## Leaderboard and Gamification

### `GET /leaderboard/:programId?timeframe=overall`

`timeframe` values:

- `overall`
- `weekly`

Example response:

```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "user_id": "uuid",
      "full_name": "Riya Sharma",
      "college": "Delhi University",
      "points": 410,
      "streak_count": 6
    }
  ]
}
```

### `GET /badges`

Returns all badges and whether the current user has unlocked them.

## Profile and Notifications

### `PUT /profile`

```json
{
  "fullName": "Riya Sharma",
  "college": "Delhi University",
  "skills": ["content", "community", "events"],
  "socialLinks": {
    "instagram": "https://instagram.com/riya",
    "linkedin": "https://linkedin.com/in/riya"
  }
}
```

### `GET /notifications`

Returns the latest 20 notifications.

### `PATCH /notifications/:notificationId/read`

Marks a notification as read.

## CSV Export

### `GET /exports/ambassadors.csv`

Admin only. Exports:

- program name
- ambassador name
- email
- college
- current points
- completed tasks
- streak count

## Database model summary

Primary tables:

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
