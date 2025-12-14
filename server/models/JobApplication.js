import mongoose from "mongoose";

const jobApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    jobId: {
      type: String,
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
    },
    jobCompany: {
      type: String,
      required: true,
    },
    applicantName: {
      type: String,
      required: true,
    },
    applicantEmail: {
      type: String,
      required: true,
    },
    resumePath: {
      type: String,
      required: true,
    },
    resumeFileName: {
      type: String,
      required: true,
    },
    coverLetter: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "rejected", "accepted"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Create unique index to prevent duplicate applications
jobApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);

export default JobApplication;
