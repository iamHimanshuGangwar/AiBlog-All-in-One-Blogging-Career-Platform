import express from "express";
import { auth } from "../middlewares/auth.js";
import { resumeUpload } from "../middlewares/multer.js";
import {
  submitJobApplication,
  getUserApplications,
  getAllApplications,
  approveJobApplication,
  rejectJobApplication,
} from "../controllers/jobController.js";

const router = express.Router();

// Error handler wrapper for multer
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Submit job application (protected route with resume upload)
router.post(
  "/apply",
  auth,
  (req, res, next) => {
    resumeUpload.single("resume")(req, res, (err) => {
      if (err) {
        console.error('[MULTER ERROR] Resume upload failed:', err.message);
        return res.status(400).json({
          success: false,
          message: err.message || "Resume upload failed",
        });
      }
      next();
    });
  },
  submitJobApplication
);

// Get user's applications
router.get("/my-applications", auth, getUserApplications);

// Get all applications (admin only)
router.get("/all-applications", auth, getAllApplications);

// Approve job application (admin only)
router.patch("/approve/:applicationId", auth, approveJobApplication);

// Reject job application (admin only)
router.patch("/reject/:applicationId", auth, rejectJobApplication);

export default router;
