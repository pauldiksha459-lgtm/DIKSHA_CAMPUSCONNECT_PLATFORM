import bcrypt from "bcryptjs";
import { ApiError } from "../utils/ApiError.js";
import { signToken } from "../utils/tokens.js";
import { authRepository } from "../repositories/authRepository.js";
import { ROLES } from "../constants/roles.js";

const buildAuthResponse = (user) => ({
  token: signToken({ userId: user.id, role: user.role }),
  user
});

export const authService = {
  signup: async (payload) => {
    const existingUser = await authRepository.findUserByEmail(payload.email);
    if (existingUser) {
      throw new ApiError(409, "An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await authRepository.createUser({
      roleCode: payload.role ?? ROLES.AMBASSADOR,
      fullName: payload.fullName,
      email: payload.email,
      passwordHash,
      college: payload.college ?? null,
      skills: payload.skills ?? [],
      socialLinks: payload.socialLinks ?? {}
    });

    const freshUser = await authRepository.findUserByEmail(payload.email);
    return buildAuthResponse(freshUser);
  },
  login: async ({ email, password }) => {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new ApiError(401, "Invalid email or password");
    }

    return buildAuthResponse(user);
  },
  me: async (userId) => {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    return user;
  }
};
