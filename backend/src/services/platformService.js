import slugify from "slugify";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { platformRepository } from "../repositories/platformRepository.js";

const mailer =
  env.smtp.host && env.smtp.user
    ? nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: false,
        auth: {
          user: env.smtp.user,
          pass: env.smtp.pass
        }
      })
    : null;

const sendMail = async ({ to, subject, html }) => {
  if (!mailer) {
    return;
  }

  await mailer.sendMail({
    from: env.emailFrom,
    to,
    subject,
    html
  });
};

export const platformService = {
  createProgram: async (payload, userId) =>
    platformRepository.createProgram({
      ...payload,
      slug: slugify(payload.name, { lower: true, strict: true }),
      createdBy: userId
    }),
  listPrograms: async (userId, role) => platformRepository.listProgramsForUser({ userId, role }),
  applyToProgram: async ({ programId, userId, applicationNote }) => {
    const program = await platformRepository.getProgramById(programId);
    if (!program) {
      throw new ApiError(404, "Program not found");
    }
    return platformRepository.createMembership({ programId, userId, applicationNote });
  },
  listApplicants: async (programId) => platformRepository.listApplicants(programId),
  updateApplicantStatus: async ({ membershipId, status }) => {
    const membership = await platformRepository.updateMembershipStatus({ membershipId, status });
    return membership;
  },
  createTask: async (payload, admin) => {
    const task = await platformRepository.createTask({
      ...payload,
      assigneeIds: payload.assigneeIds ?? [],
      createdBy: admin.id
    });

    for (const assigneeId of payload.assigneeIds ?? []) {
      await platformRepository.createNotification({
        userId: assigneeId,
        title: "New task assigned",
        message: `${payload.title} has been assigned to you`,
        type: "task_assigned",
        meta: { taskId: task.id }
      });
    }

    return task;
  },
  listTasks: async ({ userId, role, programId }) =>
    platformRepository.listTasks({ userId, role, programId }),
  submitProof: async ({ assignmentId, ambassadorId, submissionText, proofLinks, proofFiles }) => {
    const submission = await platformRepository.submitProof({
      assignmentId,
      ambassadorId,
      submissionText,
      proofLinks,
      proofFiles
    });
    return submission;
  },
  reviewSubmission: async ({ submissionId, status, feedback, reviewerId }) => {
    const submission = await platformRepository.reviewSubmission({
      submissionId,
      status,
      feedback,
      reviewerId
    });

    if (status === "approved") {
      const ledgerEntry = await platformRepository.awardPointsForSubmission(submissionId);
      if (ledgerEntry) {
        await platformRepository.refreshStats(ledgerEntry.program_id, ledgerEntry.user_id);
        await platformRepository.syncBadges(ledgerEntry.user_id);
      }
    }

    await platformRepository.createNotification({
      userId: submission.ambassador_id,
      title: status === "approved" ? "Submission approved" : "Submission needs changes",
      message:
        status === "approved"
          ? "Great work. Your proof has been approved and points were added."
          : "Your proof was reviewed. Please check the feedback and resubmit.",
      type: "submission_reviewed",
      meta: { submissionId: submission.id }
    });

    return submission;
  },
  adminAnalytics: async (adminId) => platformRepository.getAnalytics(adminId),
  ambassadorAnalytics: async (userId) => platformRepository.getAmbassadorDashboard(userId),
  leaderboard: async ({ programId, timeframe }) =>
    platformRepository.listLeaderboard({ programId, timeframe }),
  exportAmbassadors: async (adminId) => platformRepository.exportAmbassadors(adminId),
  updateProfile: async (payload, userId) =>
    platformRepository.updateProfile({
      ...payload,
      userId
    }),
  listNotifications: async (userId) => platformRepository.listNotifications(userId),
  markNotificationRead: async (notificationId, userId) =>
    platformRepository.markNotificationRead(notificationId, userId),
  listBadges: async (userId) => platformRepository.listBadges(userId),
  sendOnboardingEmail: async (email, name) =>
    sendMail({
      to: email,
      subject: "Welcome to CampusConnect",
      html: `<p>Hi ${name},</p><p>Your CampusConnect account is ready. Log in to start managing campaigns and ambassador growth.</p>`
    })
};
