import { query } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyToken } from "../utils/tokens.js";

export const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "Authorization token missing");
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = verifyToken(token);
    const { rows } = await query(
      `select u.id, u.email, u.full_name, u.status, u.college, u.skills, u.social_links,
              r.code as role
       from users u
       join roles r on r.id = u.role_id
       where u.id = $1`,
      [decoded.userId]
    );

    if (!rows[0]) {
      throw new ApiError(401, "User not found");
    }

    req.user = rows[0];
    next();
  } catch (error) {
    next(error);
  }
};
