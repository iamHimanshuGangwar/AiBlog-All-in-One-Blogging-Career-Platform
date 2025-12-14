import JobApplication from "../models/JobApplication.js";

// =================== APPLY JOB ===================
export const submitJobApplication = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      jobId,
      jobTitle,
      jobCompany,
      applicantName,
      applicantEmail,
      coverLetter,
    } = req.body;

    // Validate required fields
    if (!jobId || !jobTitle || !jobCompany || !applicantName || !applicantEmail) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    // Resume check
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume upload failed",
      });
    }

    // Prevent duplicate application
    const alreadyApplied = await JobApplication.findOne({
      userId: req.user.id,
      jobId,
    });

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: "You already applied for this job",
      });
    }

    const application = await JobApplication.create({
      userId: req.user.id,
      jobId,
      jobTitle,
      jobCompany,
      applicantName,
      applicantEmail,
      coverLetter: coverLetter || "",
      resumePath: req.file.path,
      resumeFileName: req.file.filename,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Job application submitted successfully",
      data: application,
    });
  } catch (error) {
    console.error("Submit application error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
