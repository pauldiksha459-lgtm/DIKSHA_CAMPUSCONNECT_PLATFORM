import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import { pool } from "../src/config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);

  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const ambassadorPassword = await bcrypt.hash("Ambassador@123", 10);

  await pool.query(`
    insert into roles (code, name)
    values ('admin', 'Admin'), ('ambassador', 'Ambassador')
    on conflict (code) do nothing
  `);

  const adminResult = await pool.query(
    `insert into users (role_id, full_name, email, password_hash, college)
     values ((select id from roles where code = 'admin'), 'Aisha Patel', 'admin@campusconnect.app', $1, 'CampusConnect HQ')
     on conflict (email) do update set full_name = excluded.full_name
     returning id`,
    [adminPassword]
  );

  const ambassadorOne = await pool.query(
    `insert into users (role_id, full_name, email, password_hash, college, skills, social_links)
     values (
       (select id from roles where code = 'ambassador'),
       'Riya Sharma',
       'riya@student.edu',
       $1,
       'Delhi University',
       array['content', 'community'],
       '{"linkedin":"https://linkedin.com/in/riya","instagram":"https://instagram.com/riya"}'::jsonb
     )
     on conflict (email) do update set full_name = excluded.full_name
     returning id`,
    [ambassadorPassword]
  );

  const ambassadorTwo = await pool.query(
    `insert into users (role_id, full_name, email, password_hash, college, skills, social_links)
     values (
       (select id from roles where code = 'ambassador'),
       'Arjun Mehta',
       'arjun@student.edu',
       $1,
       'IIT Bombay',
       array['referrals', 'events'],
       '{"linkedin":"https://linkedin.com/in/arjun","twitter":"https://x.com/arjun"}'::jsonb
     )
     on conflict (email) do update set full_name = excluded.full_name
     returning id`,
    [ambassadorPassword]
  );

  const adminId = adminResult.rows[0].id;
  const ambassadorIds = [ambassadorOne.rows[0].id, ambassadorTwo.rows[0].id];

  const programResult = await pool.query(
    `insert into programs (name, slug, description, start_date, end_date, created_by)
     values (
       'Spring Launch CA Program',
       'spring-launch-ca-program',
       'Drive referrals, social buzz, and creator-led storytelling for the spring product launch.',
       current_date,
       current_date + interval '90 day',
       $1
     )
     on conflict (slug) do update set description = excluded.description
     returning id`,
    [adminId]
  );

  const programId = programResult.rows[0].id;

  for (const ambassadorId of ambassadorIds) {
    await pool.query(
      `insert into program_memberships (program_id, user_id, status, application_note, approved_at)
       values ($1, $2, 'approved', 'Seeded ambassador application', now())
       on conflict (program_id, user_id) do update set status = 'approved'`,
      [programId, ambassadorId]
    );
  }

  const taskOne = await pool.query(
    `insert into tasks (program_id, title, description, task_type, proof_type, points, due_date, created_by)
     values (
       $1,
       'Share your referral code with 20 peers',
       'Promote the product using your unique referral code and submit screenshots or link proof.',
       'referral',
       'mixed',
       50,
       now() + interval '7 day',
       $2
     )
     returning id`,
    [programId, adminId]
  );

  const taskTwo = await pool.query(
    `insert into tasks (program_id, title, description, task_type, proof_type, points, due_date, created_by)
     values (
       $1,
       'Post a launch reel on Instagram',
       'Create a short launch reel highlighting features, CTA, and your referral link.',
       'social',
       'link',
       80,
       now() + interval '5 day',
       $2
     )
     returning id`,
    [programId, adminId]
  );

  for (const ambassadorId of ambassadorIds) {
    await pool.query(
      `insert into task_assignments (task_id, ambassador_id, assigned_by)
       values ($1, $2, $3)
       on conflict (task_id, ambassador_id) do nothing`,
      [taskOne.rows[0].id, ambassadorId, adminId]
    );
  }

  await pool.query(
    `insert into task_assignments (task_id, ambassador_id, assigned_by)
     values ($1, $2, $3)
     on conflict (task_id, ambassador_id) do nothing`,
    [taskTwo.rows[0].id, ambassadorIds[0], adminId]
  );

  const assignmentOne = await pool.query(
    `select id from task_assignments
     where task_id = $1 and ambassador_id = $2`,
    [taskOne.rows[0].id, ambassadorIds[0]]
  );

  const approvedSubmission = await pool.query(
    `insert into submissions (
       task_assignment_id,
       ambassador_id,
       submission_text,
       proof_links,
       proof_files,
       status,
       reviewed_at,
       reviewed_by
     )
     values (
       $1,
       $2,
       'Shared referral code in 4 campus communities and attached screenshot proof.',
       array['https://instagram.com/p/demo-referral'],
       array['/uploads/demo-referral-proof.png'],
       'approved',
       now(),
       $3
     )
     returning id`,
    [assignmentOne.rows[0].id, ambassadorIds[0], adminId]
  );

  await pool.query(
    `update task_assignments set status = 'approved' where id = $1`,
    [assignmentOne.rows[0].id]
  );

  await pool.query(
    `insert into points_ledger (user_id, program_id, task_id, submission_id, points_delta, reason)
     values ($1, $2, $3, $4, 50, 'Seeded approved submission')
     on conflict (submission_id) do nothing`,
    [ambassadorIds[0], programId, taskOne.rows[0].id, approvedSubmission.rows[0].id]
  );

  await pool.query(
    `insert into user_program_stats (
       program_id,
       user_id,
       current_points,
       completed_tasks,
       approved_submissions,
       streak_count,
       last_activity_on
     )
     values
       ($1, $2, 50, 1, 1, 3, current_date),
       ($1, $3, 0, 0, 0, 1, current_date - 1)
     on conflict (program_id, user_id) do update
     set current_points = excluded.current_points,
         completed_tasks = excluded.completed_tasks,
         approved_submissions = excluded.approved_submissions,
         streak_count = excluded.streak_count,
         last_activity_on = excluded.last_activity_on`,
    [programId, ambassadorIds[0], ambassadorIds[1]]
  );

  await pool.query(`
    insert into badges (code, name, description, icon, points_threshold, streak_threshold, submissions_threshold)
    values
      ('first-win', 'First Win', 'Earn your first 50 points.', 'sparkles', 50, 0, 1),
      ('streak-starter', 'Streak Starter', 'Maintain a 3-day activity streak.', 'flame', 0, 3, 1),
      ('top-creator', 'Top Creator', 'Cross 200 points and 3 approved submissions.', 'trophy', 200, 0, 3)
    on conflict (code) do nothing
  `);

  await pool.query(
    `insert into user_badges (user_id, badge_id)
     select $1, id from badges where code in ('first-win', 'streak-starter')
     on conflict do nothing`,
    [ambassadorIds[0]]
  );

  await pool.query(
    `insert into notifications (user_id, title, message, type, is_read)
     values
       ($1, 'Submission approved', 'Your referral campaign proof was approved and 50 points were awarded.', 'submission_reviewed', false),
       ($1, 'New task assigned', 'An Instagram launch reel task is now waiting in your dashboard.', 'task_assigned', true),
       ($2, 'Program approved', 'You have been approved for the Spring Launch CA Program.', 'program_status', false)
     on conflict do nothing`,
    [ambassadorIds[0], ambassadorIds[1]]
  );

  console.log("CampusConnect seed completed");
  await pool.end();
};

run().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
