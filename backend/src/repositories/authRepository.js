import { query } from "../config/db.js";

export const authRepository = {
  createUser: async ({ roleCode, fullName, email, passwordHash, college, skills, socialLinks }) => {
    const result = await query(
      `insert into users (role_id, full_name, email, password_hash, college, skills, social_links)
       values ((select id from roles where code = $1), $2, $3, $4, $5, $6, $7)
       returning id, full_name, email, college, skills, social_links`,
      [roleCode, fullName, email.toLowerCase(), passwordHash, college, skills, socialLinks]
    );
    return result.rows[0];
  },
  findUserByEmail: async (email) => {
    const result = await query(
      `select u.*, r.code as role
       from users u
       join roles r on r.id = u.role_id
       where u.email = $1`,
      [email.toLowerCase()]
    );
    return result.rows[0];
  },
  findUserById: async (userId) => {
    const result = await query(
      `select u.id, u.full_name, u.email, u.status, u.college, u.skills, u.social_links, u.avatar_url,
              r.code as role
       from users u
       join roles r on r.id = u.role_id
       where u.id = $1`,
      [userId]
    );
    return result.rows[0];
  }
};
