import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

export const authRoutes = Router();

authRoutes.post("/signup", authController.signup);
authRoutes.post("/login", authController.login);
authRoutes.get("/me", authenticate, authController.me);
