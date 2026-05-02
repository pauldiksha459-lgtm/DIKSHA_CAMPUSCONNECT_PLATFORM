import { Router } from "express";
import { platformController } from "../controllers/platformController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { ROLES } from "../constants/roles.js";

export const platformRoutes = Router();

platformRoutes.use(authenticate);

platformRoutes.get("/programs", platformController.listPrograms);
platformRoutes.post("/programs", authorize(ROLES.ADMIN), platformController.createProgram);
platformRoutes.post("/programs/:programId/apply", authorize(ROLES.AMBASSADOR), platformController.applyToProgram);
platformRoutes.get("/programs/:programId/applicants", authorize(ROLES.ADMIN), platformController.listApplicants);
platformRoutes.patch("/memberships/:membershipId/status", authorize(ROLES.ADMIN), platformController.updateApplicantStatus);

platformRoutes.get("/tasks", platformController.listTasks);
platformRoutes.post("/tasks", authorize(ROLES.ADMIN), platformController.createTask);
platformRoutes.post(
  "/assignments/:assignmentId/submissions",
  authorize(ROLES.AMBASSADOR),
  upload.array("proofFiles", 3),
  platformController.submitProof
);
platformRoutes.patch("/submissions/:submissionId/review", authorize(ROLES.ADMIN), platformController.reviewSubmission);

platformRoutes.get("/dashboard/admin", authorize(ROLES.ADMIN), platformController.adminAnalytics);
platformRoutes.get("/dashboard/ambassador", authorize(ROLES.AMBASSADOR), platformController.ambassadorAnalytics);
platformRoutes.get("/leaderboard/:programId", platformController.leaderboard);
platformRoutes.get("/exports/ambassadors.csv", authorize(ROLES.ADMIN), platformController.exportCsv);

platformRoutes.put("/profile", platformController.updateProfile);
platformRoutes.get("/notifications", platformController.notifications);
platformRoutes.patch("/notifications/:notificationId/read", platformController.markNotificationRead);
platformRoutes.get("/badges", platformController.badges);
