import { query, withTransaction } from "../config/db.js";

export const platformRepository = {
  createProgram: async ({ name, slug, description, startDate, endDate, createdBy }) => {
    const result = await query(
      `insert into programs (name, slug, description, start_date, end_date, created_by)
       values ($1, $2, $3, $4, $5, $6)
       returning *`,
      [name, slug, description, startDate, endDate, createdBy]
    );
    return result.rows[0];
  },
  listProgramsForUser: async ({ userId, role }) => {
    const sql =
      role === "admin"
        ? `select p.*, count(distinct pm.user_id) filter (where pm.status = 'approved') as ambassador_count
           from programs p
           left join program_memberships pm on pm.program_id = p.id
           where p.created_by = $1
           group by p.id
           order by p.created_at desc`
        : `select p.*, pm.status as membership_status
           from programs p
           join program_memberships pm on pm.program_id = p.id
           where pm.user_id = $1
           order by p.created_at desc`;

    const result = await query(sql, [userId]);
    return result.rows;
  },
  getProgramById: async (programId) => {
    const result = await query(`select * from programs where id = $1`, [programId]);
    return result.rows[0];
  },
  createMembership: async ({ programId, userId, applicationNote }) => {
    const result = await query(
      `insert into program_memberships (program_id, user_id, application_note)
       values ($1, $2, $3)
       on conflict (program_id, user_id) do update
       set application_note = excluded.application_note
       returning *`,
      [programId, userId, applicationNote]
    );
    return result.rows[0];
  },
  listApplicants: async (programId) => {
    const result = await query(
      `select pm.id, pm.status, pm.application_note, pm.applied_at, u.id as user_id,
              u.full_name, u.email, u.college, u.skills, u.social_links
       from program_memberships pm
       join users u on u.id = pm.user_id
       where pm.program_id = $1
       order by pm.applied_at desc`,
      [programId]
    );
    return result.rows;
  },
  updateMembershipStatus: async ({ membershipId, status }) => {
    const result = await query(
      `update program_memberships
       set status = $2,
           approved_at = case when $2 = 'approved' then now() else approved_at end
       where id = $1
       returning *`,
      [membershipId, status]
    );
    return result.rows[0];
  },
  createTask: async ({
    programId,
    title,
    description,
    taskType,
    points,
    dueDate,
    proofType,
    createdBy,
    assigneeIds
  }) =>
    withTransaction(async (client) => {
      const taskResult = await client.query(
        `insert into tasks (program_id, title, description, task_type, points, due_date, proof_type, created_by)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         returning *`,
        [programId, title, description, taskType, points, dueDate, proofType, createdBy]
      );
      const task = taskResult.rows[0];

      for (const ambassadorId of assigneeIds) {
        await client.query(
          `insert into task_assignments (task_id, ambassador_id, assigned_by)
           values ($1, $2, $3)`,
          [task.id, ambassadorId, createdBy]
        );
      }

      return task;
    }),
  listTasks: async ({ userId, role, programId }) => {
    const filters = [];
    const values = [];

    if (programId) {
      values.push(programId);
      filters.push(`t.program_id = $${values.length}`);
    }

    if (role === "ambassador") {
      values.push(userId);
      filters.push(`ta.ambassador_id = $${values.length}`);
    }

    const where = filters.length ? `where ${filters.join(" and ")}` : "";

    const result = await query(
      `select t.id, t.title, t.description, t.task_type, t.points, t.due_date, t.proof_type, t.status,
              p.name as program_name, p.id as program_id,
              ta.id as assignment_id, ta.status as assignment_status,
              s.id as submission_id, s.status as submission_status, s.submitted_at,
              u.full_name as ambassador_name
       from tasks t
       join programs p on p.id = t.program_id
       left join task_assignments ta on ta.task_id = t.id
       left join submissions s on s.task_assignment_id = ta.id
       left join users u on u.id = ta.ambassador_id
       ${where}
       order by t.created_at desc`,
      values
    );
    return result.rows;
  },
  submitProof: async ({
    assignmentId,
    ambassadorId,
    submissionText,
    proofLinks,
    proofFiles
  }) => {
    const result = await query(
      `insert into submissions (task_assignment_id, ambassador_id, submission_text, proof_links, proof_files)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [assignmentId, ambassadorId, submissionText, proofLinks, proofFiles]
    );
    await query(`update task_assignments set status = 'submitted' where id = $1`, [assignmentId]);
    return result.rows[0];
  },
  reviewSubmission: async ({ submissionId, status, feedback, reviewerId }) => {
    const result = await query(
      `update submissions
       set status = $2, feedback = $3, reviewed_at = now(), reviewed_by = $4
       where id = $1
       returning *`,
      [submissionId, status, feedback, reviewerId]
    );

    await query(
      `update task_assignments
       set status = case when $2 = 'approved' then 'approved' else 'needs_changes' end
       where id = (select task_assignment_id from submissions where id = $1)`,
      [submissionId, status]
    );

    return result.rows[0];
  },
  awardPointsForSubmission: async (submissionId) => {
    const result = await query(
      `with approved_submission as (
         select s.id, s.ambassador_id, t.program_id, t.id as task_id, t.points
         from submissions s
         join task_assignments ta on ta.id = s.task_assignment_id
         join tasks t on t.id = ta.task_id
         where s.id = $1 and s.status = 'approved'
       ),
       inserted as (
         insert into points_ledger (user_id, program_id, task_id, submission_id, points_delta, reason)
         select ambassador_id, program_id, task_id, id, points, 'Task submission approved'
         from approved_submission
         where not exists (
           select 1 from points_ledger pl where pl.submission_id = $1
         )
         returning *
       )
       select * from inserted`,
      [submissionId]
    );
    return result.rows[0];
  },
  refreshStats: async (programId, userId) => {
    await query(
      `insert into user_program_stats (program_id, user_id, current_points, completed_tasks, approved_submissions, streak_count, last_activity_on)
       values ($1, $2, 0, 0, 0, 0, current_date)
       on conflict (program_id, user_id) do update
       set current_points = (
             select coalesce(sum(points_delta), 0) from points_ledger
             where program_id = $1 and user_id = $2
           ),
           completed_tasks = (
             select count(*) from task_assignments
             where ambassador_id = $2 and status = 'approved'
               and task_id in (select id from tasks where program_id = $1)
           ),
           approved_submissions = (
             select count(*) from submissions s
             join task_assignments ta on ta.id = s.task_assignment_id
             join tasks t on t.id = ta.task_id
             where s.ambassador_id = $2 and s.status = 'approved' and t.program_id = $1
           ),
           streak_count = greatest(
             case
               when last_activity_on = current_date - 1 then user_program_stats.streak_count + 1
               when last_activity_on = current_date then user_program_stats.streak_count
               else 1
             end,
             1
           ),
           last_activity_on = current_date`,
      [programId, userId]
    );
  },
  listLeaderboard: async ({ programId, timeframe }) => {
    const sql =
      timeframe === "weekly"
        ? `select rank() over (order by sum(pl.points_delta) desc) as rank,
                  u.id as user_id, u.full_name, u.college, sum(pl.points_delta) as points
           from points_ledger pl
           join users u on u.id = pl.user_id
           where pl.program_id = $1 and pl.created_at >= date_trunc('week', now())
           group by u.id
           order by points desc, u.full_name asc`
        : `select rank() over (order by ups.current_points desc) as rank,
                  u.id as user_id, u.full_name, u.college, ups.current_points as points, ups.streak_count
           from user_program_stats ups
           join users u on u.id = ups.user_id
           where ups.program_id = $1
           order by ups.current_points desc, ups.streak_count desc, u.full_name asc`;

    const result = await query(sql, [programId]);
    return result.rows;
  },
  getAnalytics: async (adminId) => {
    const result = await query(
      `with admin_programs as (
         select id from programs where created_by = $1
       ),
       active_ambassadors as (
         select count(distinct pm.user_id) as count
         from program_memberships pm
         where pm.program_id in (select id from admin_programs) and pm.status = 'approved'
       ),
       completion as (
         select
           count(*) filter (where ta.status = 'approved')::float /
           nullif(count(*), 0) * 100 as completion_rate
         from task_assignments ta
         join tasks t on t.id = ta.task_id
         where t.program_id in (select id from admin_programs)
       ),
       top_performers as (
         select u.full_name, ups.current_points
         from user_program_stats ups
         join users u on u.id = ups.user_id
         where ups.program_id in (select id from admin_programs)
         order by ups.current_points desc
         limit 5
       )
       select
         (select count(*) from admin_programs) as program_count,
         (select count from active_ambassadors) as active_ambassadors,
         coalesce((select completion_rate from completion), 0) as completion_rate,
         (
           select json_agg(tp) from top_performers tp
         ) as top_performers`,
      [adminId]
    );
    return result.rows[0];
  },
  getAmbassadorDashboard: async (userId) => {
    const result = await query(
      `select
         coalesce(sum(ups.current_points), 0) as total_points,
         coalesce(max(ups.streak_count), 0) as best_streak,
         (
           select count(*) from user_badges where user_id = $1
         ) as badges_earned,
         (
           select count(*) from task_assignments where ambassador_id = $1 and status = 'approved'
         ) as completed_tasks
       from user_program_stats ups
       where ups.user_id = $1`,
      [userId]
    );
    return result.rows[0];
  },
  exportAmbassadors: async (adminId) => {
    const result = await query(
      `select p.name as program_name, u.full_name, u.email, u.college,
              ups.current_points, ups.completed_tasks, ups.streak_count
       from programs p
       join user_program_stats ups on ups.program_id = p.id
       join users u on u.id = ups.user_id
       where p.created_by = $1
       order by p.name, ups.current_points desc`,
      [adminId]
    );
    return result.rows;
  },
  updateProfile: async ({ userId, fullName, college, skills, socialLinks }) => {
    const result = await query(
      `update users
       set full_name = $2,
           college = $3,
           skills = $4,
           social_links = $5
       where id = $1
       returning id, full_name, email, college, skills, social_links`,
      [userId, fullName, college, skills, socialLinks]
    );
    return result.rows[0];
  },
  listNotifications: async (userId) => {
    const result = await query(
      `select * from notifications where user_id = $1 order by created_at desc limit 20`,
      [userId]
    );
    return result.rows;
  },
  createNotification: async ({ userId, title, message, type, meta }) => {
    await query(
      `insert into notifications (user_id, title, message, type, meta)
       values ($1, $2, $3, $4, $5)`,
      [userId, title, message, type, meta]
    );
  },
  markNotificationRead: async (notificationId, userId) => {
    const result = await query(
      `update notifications set is_read = true where id = $1 and user_id = $2 returning *`,
      [notificationId, userId]
    );
    return result.rows[0];
  },
  listBadges: async (userId) => {
    const result = await query(
      `select b.*, ub.awarded_at
       from badges b
       left join user_badges ub on ub.badge_id = b.id and ub.user_id = $1
       order by b.points_threshold asc nulls last, b.streak_threshold asc nulls last`,
      [userId]
    );
    return result.rows;
  },
  syncBadges: async (userId) => {
    await query(
      `insert into user_badges (user_id, badge_id)
       select $1, b.id
       from badges b
       left join user_badges ub on ub.badge_id = b.id and ub.user_id = $1
       cross join lateral (
         select
           coalesce(max(current_points), 0) as points,
           coalesce(max(streak_count), 0) as streaks,
           coalesce(sum(approved_submissions), 0) as approved_submissions
         from user_program_stats
         where user_id = $1
       ) stats
       where ub.id is null
         and stats.points >= coalesce(b.points_threshold, 0)
         and stats.streaks >= coalesce(b.streak_threshold, 0)
         and stats.approved_submissions >= coalesce(b.submissions_threshold, 0)`,
      [userId]
    );
  }
};
