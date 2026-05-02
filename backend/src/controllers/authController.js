import { asyncHandler } from "../utils/asyncHandler.js";
import { authService } from "../services/authService.js";
import { platformService } from "../services/platformService.js";

export const authController = {
  signup: asyncHandler(async (req, res) => {
    const result = await authService.signup(req.body);
    await platformService.sendOnboardingEmail(result.user.email, result.user.full_name);
    res.status(201).json({ success: true, data: result });
  }),
  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  }),
  me: asyncHandler(async (req, res) => {
    const user = await authService.me(req.user.id);
    res.json({ success: true, data: user });
  })
};
