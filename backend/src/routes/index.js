import { Router } from "express";
import { authRoutes } from "./authRoutes.js";
import { platformRoutes } from "./platformRoutes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "CampusConnect API is healthy"
  });
});

apiRouter.use("/auth", authRoutes);
apiRouter.use("/", platformRoutes);
