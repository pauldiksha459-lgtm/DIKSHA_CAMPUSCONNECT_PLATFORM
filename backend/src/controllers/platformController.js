import { asyncHandler } from "../utils/asyncHandler.js";
import { platformService } from "../services/platformService.js";
import { toCsv } from "../utils/csv.js";

export const platformController = {
  createProgram: asyncHandler(async (req, res) => {
    const program = await platformService.createProgram(req.body, req.user.id);
    res.status(201).json({ success: true, data: program });
  }),
  listPrograms: asyncHandler(async (req, res) => {
    const programs = await platformService.listPrograms(req.user.id, req.user.role);
    res.json({ success: true, data: programs });
  }),
  applyToProgram: asyncHandler(async (req, res) => {
    const membership = await platformService.applyToProgram({
      programId: req.params.programId,
      userId: req.user.id,
      applicationNote: req.body.applicationNote
    });
    res.status(201).json({ success: true, data: membership });
  }),
  listApplicants: asyncHandler(async (req, res) => {
    const applicants = await platformService.listApplicants(req.params.programId);
    res.json({ success: true, data: applicants });
  }),
  updateApplicantStatus: asyncHandler(async (req, res) => {
    const membership = await platformService.updateApplicantStatus({
      membershipId: req.params.membershipId,
      status: req.body.status
    });
    res.json({ success: true, data: membership });
  }),
  createTask: asyncHandler(async (req, res) => {
    const task = await platformService.createTask(req.body, req.user);
    res.status(201).json({ success: true, data: task });
  }),
  listTasks: asyncHandler(async (req, res) => {
    const tasks = await platformService.listTasks({
      userId: req.user.id,
      role: req.user.role,
      programId: req.query.programId
    });
    res.json({ success: true, data: tasks });
  }),
  submitProof: asyncHandler(async (req, res) => {
    const files = (req.files ?? []).map((file) => `/uploads/${file.filename}`);
    const links = req.body.proofLinks ? JSON.parse(req.body.proofLinks) : [];
    const submission = await platformService.submitProof({
      assignmentId: req.params.assignmentId,
      ambassadorId: req.user.id,
      submissionText: req.body.submissionText,
      proofLinks: links,
      proofFiles: files
    });
    res.status(201).json({ success: true, data: submission });
  }),
  reviewSubmission: asyncHandler(async (req, res) => {
    const submission = await platformService.reviewSubmission({
      submissionId: req.params.submissionId,
      status: req.body.status,
      feedback: req.body.feedback,
      reviewerId: req.user.id
    });
    res.json({ success: true, data: submission });
  }),
  adminAnalytics: asyncHandler(async (req, res) => {
    const analytics = await platformService.adminAnalytics(req.user.id);
    res.json({ success: true, data: analytics });
  }),
  ambassadorAnalytics: asyncHandler(async (req, res) => {
    const analytics = await platformService.ambassadorAnalytics(req.user.id);
    res.json({ success: true, data: analytics });
  }),
  leaderboard: asyncHandler(async (req, res) => {
    const leaderboard = await platformService.leaderboard({
      programId: req.params.programId,
      timeframe: req.query.timeframe ?? "overall"
    });
    res.json({ success: true, data: leaderboard });
  }),
  exportCsv: asyncHandler(async (req, res) => {
    const rows = await platformService.exportAmbassadors(req.user.id);
    const csv = toCsv(rows);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=campusconnect-ambassadors.csv");
    res.send(csv);
  }),
  updateProfile: asyncHandler(async (req, res) => {
    const user = await platformService.updateProfile(req.body, req.user.id);
    res.json({ success: true, data: user });
  }),
  notifications: asyncHandler(async (req, res) => {
    const notifications = await platformService.listNotifications(req.user.id);
    res.json({ success: true, data: notifications });
  }),
  markNotificationRead: asyncHandler(async (req, res) => {
    const notification = await platformService.markNotificationRead(req.params.notificationId, req.user.id);
    res.json({ success: true, data: notification });
  }),
  badges: asyncHandler(async (req, res) => {
    const badges = await platformService.listBadges(req.user.id);
    res.json({ success: true, data: badges });
  })
};
